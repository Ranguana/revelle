import "server-only";

import { query, queryOne } from "@/lib/db";

/**
 * WHO IS A MEMBER — the read behind /desk/members.
 *
 * ── THE DEFINITION, AND IT IS ONE LINE ───────────────────────────────
 *
 * `customer.accepted_at is not null`. Nothing else. Not `quiz_response.status`,
 * not the existence of a `revelle` row, not a proposal that was approved.
 * db/015's author refused to key membership off workflow in as many words —
 * "'in_progress' is desk workflow, and workflow must not quietly grant a
 * portal" — and src/lib/desk/acceptance.ts is the wire that sets the column by
 * hand. This file is the first screen that reads it back out in bulk, and it
 * must not invent a second, looser definition on the way.
 *
 * So the predicate is a named constant, used by every statement here, rather
 * than three copies of the same `where` that can drift apart. It is the same
 * question src/lib/login.ts asks before it will mail anybody a link and the
 * same one src/lib/members.ts re-asks on every request.
 *
 * ── WHAT A COUNT IS, OUT OF node-postgres ────────────────────────────
 *
 * `count(*)` is `bigint`, and the driver hands a bigint back as a STRING —
 * it cannot promise one fits a JS number. Every count below is cast to `int`
 * in SQL so the driver parses it, AND is put through `count()` on the way out,
 * because a cast deleted in a later edit would otherwise turn `total + 1` into
 * "21" with nothing failing. The destinations screens have exactly that bug.
 *
 * ── AND EVERY DATE IS FORMATTED IN POSTGRES ──────────────────────────
 *
 * `to_char(...)`, so what arrives here is already a `YYYY-MM-DD` string. A
 * `date` column comes back from `pg` as a Date at LOCAL midnight, which
 * `toISOString()` then moves onto the previous day for anybody west of
 * Greenwich — src/lib/portal/occasions.ts has a helper that exists only to
 * undo that. The cheaper fix is not to hand a Date across the boundary at all.
 */

/** The one definition. Assumes the customer table is aliased `c`. */
export const MEMBER_PREDICATE = "c.accepted_at is not null";

/**
 * The four states a Revelle can be in (db/001 `revelle_status`), in the
 * house's words rather than the schema's.
 *
 * Kept here rather than in src/lib/desk/labels.ts because it is read with the
 * rows it labels, and because the members screen is the only place that has
 * ever needed to name them.
 */
export const REVELLE_STATUS: Readonly<Record<string, string>> = {
  draft: "Being built",
  preview: "In preview",
  delivered: "Delivered",
  archived: "Archived",
};

/**
 * WHAT SHE CAN ACTUALLY OPEN.
 *
 * The complement of 'draft', which is the same set src/lib/portal/occasions.ts
 * calls OPENABLE — a Revelle the house is still building is house work and is
 * simply not on her shelf. Written as "not draft" rather than as a second copy
 * of the list so that adding a status to the enum shows up here as a question
 * rather than as a silent omission from her shelf.
 */
const OPENABLE_SQL = "r.status <> 'draft'";

export type MemberRevelles = {
  total: number;
  draft: number;
  preview: number;
  delivered: number;
  archived: number;
  /** preview + delivered + archived: what is on her shelf. */
  openable: number;
};

export type MemberListing = {
  id: string;
  /** db/001 does not ask for a name. Staff fill it in, so it is often null. */
  name: string | null;
  email: string;
  /** YYYY-MM-DD, UTC. Never null for a member, by the predicate above. */
  acceptedOn: string | null;
  /** Who pressed "Take her on", from the ledger. Null for a backfilled row. */
  acceptedBy: string | null;
  revelles: MemberRevelles;
  /** The status of her NEWEST Revelle, or null when she has none. */
  newestStatus: string | null;
  /** The soonest openable Revelle dated today or later. */
  nextDate: string | null;
  /**
   * When she last signed in — NOT when she was last active.
   *
   * `login_session.last_seen_at` exists and looks like the better answer, but
   * src/lib/session.ts only ever touches `staff.last_seen_at`; for a member the
   * column sits at its insert-time default forever. So the honest fact
   * available is when a session was last opened, and that is what this is
   * called on the screen. A column labelled "last active" reading a value
   * nothing updates is worse than no column.
   */
  lastSignedIn: string | null;
};

export type MemberPage = {
  rows: MemberListing[];
  /** How many members match the filters. */
  matched: number;
  /** How many members there are at all. */
  everything: number;
};

type Row = {
  id: string;
  name: string | null;
  email: string;
  accepted_on: string | null;
  accepted_by: string | null;
  total: unknown;
  drafts: unknown;
  previews: unknown;
  delivereds: unknown;
  archiveds: unknown;
  next_date: string | null;
  newest_status: string | null;
  last_signed_in: string | null;
};

/**
 * The joins, written once because the count and the page must agree.
 *
 * Two laterals rather than one: an aggregate lateral always returns a row (a
 * count over no rows is 0), so it is a `cross join`; the newest-Revelle lateral
 * returns NO row for a member who has none, so it is a `left join` and its
 * column is null for her. Getting those two the wrong way round is how a member
 * with nothing yet vanishes from the list she most needs to be on.
 */
const FROM = `
  from customer c
  cross join lateral (
    select (count(*))::int                                        as total,
           (count(*) filter (where r.status = 'draft'))::int      as drafts,
           (count(*) filter (where r.status = 'preview'))::int    as previews,
           (count(*) filter (where r.status = 'delivered'))::int  as delivereds,
           (count(*) filter (where r.status = 'archived'))::int   as archiveds,
           min(r.event_date) filter (
             where ${OPENABLE_SQL} and r.event_date >= current_date
           ) as next_date
      from revelle r
     where r.customer_id = c.id
  ) rev
  left join lateral (
    select r.status::text as status
      from revelle r
     where r.customer_id = c.id
     order by r.created_at desc
     limit 1
  ) newest on true
  cross join lateral (
    select max(s.created_at) as last_at
      from login_session s
     where s.customer_id = c.id
  ) seen`;

/** Who took her on, from the append-only ledger. Same read as acceptance.ts. */
const ACCEPTED_BY = `
  (select coalesce(nullif(btrim(s.name), ''),
                   split_part(s.email::text, '@', 1))
     from staff_action a
     join staff s on s.id = a.staff_id
    where a.action = 'customer.accepted'
      and a.entity_table = 'customer'
      and a.entity_id = c.id
    order by a.created_at desc
    limit 1)`;

export type MemberFilters = {
  /** A name or an address, loosely. */
  q?: string;
  /**
   * 'none' for a member with no Revelle at all, or one of the four statuses,
   * meaning her NEWEST Revelle is in that state. Anything else is no filter.
   */
  state?: string;
  limit: number;
  offset: number;
};

export async function listMembers(
  filters: MemberFilters
): Promise<MemberPage> {
  // The dishes screen's pattern: a list of (clause, value) pairs, so adding a
  // filter is one line and cannot get the placeholder numbering wrong. `$?` is
  // replaced EVERYWHERE it appears in the clause, which is what lets one value
  // be compared against two columns.
  const clauses: string[] = [MEMBER_PREDICATE];
  const values: unknown[] = [];
  const where = (sql: string, value: unknown) => {
    values.push(value);
    clauses.push(sql.replaceAll("$?", `$${values.length}`));
  };

  const q = (filters.q ?? "").trim();
  if (q) {
    where(
      `(coalesce(c.name, '') ilike '%' || $? || '%'
        or c.email::text ilike '%' || $? || '%')`,
      q
    );
  }

  const state = filters.state ?? "";
  if (state === "none") {
    clauses.push("rev.total = 0");
  } else if (Object.hasOwn(REVELLE_STATUS, state)) {
    where("newest.status = $?", state);
  }

  const filter = `where ${clauses.join(" and ")}`;

  // Cast to int on both, and parsed again below. See the note at the top.
  const counted = await queryOne<{ matched: unknown; everything: unknown }>(
    `select (select (count(*))::int ${FROM} ${filter}) as matched,
            (select (count(*))::int from customer c
              where ${MEMBER_PREDICATE})            as everything`,
    values
  );

  // `limit` and `offset` are numbers this module computed, never a request
  // value, which is why they are interpolated: a placeholder for a LIMIT reads
  // worse and buys nothing here.
  const limit = Math.max(1, Math.floor(filters.limit));
  const offset = Math.max(0, Math.floor(filters.offset));

  const rows = await query<Row>(
    `select c.id, c.name, c.email::text as email,
            to_char(c.accepted_at at time zone 'utc', 'YYYY-MM-DD')
              as accepted_on,
            ${ACCEPTED_BY} as accepted_by,
            rev.total, rev.drafts, rev.previews, rev.delivereds, rev.archiveds,
            to_char(rev.next_date, 'YYYY-MM-DD') as next_date,
            newest.status as newest_status,
            to_char(seen.last_at at time zone 'utc', 'YYYY-MM-DD')
              as last_signed_in
       ${FROM}
       ${filter}
      order by c.accepted_at desc nulls last, c.email
      limit ${limit} offset ${offset}`,
    values
  );

  return {
    rows: rows.map(listing),
    matched: count(counted?.matched),
    everything: count(counted?.everything),
  };
}

function listing(row: Row): MemberListing {
  const preview = count(row.previews);
  const delivered = count(row.delivereds);
  const archived = count(row.archiveds);

  return {
    id: row.id,
    // An empty name and a null name are the same fact — nobody has recorded
    // one — and the screen must not print a row with a blank first column.
    name: nothing(row.name),
    email: row.email,
    acceptedOn: nothing(row.accepted_on),
    acceptedBy: nothing(row.accepted_by),
    revelles: {
      total: count(row.total),
      draft: count(row.drafts),
      preview,
      delivered,
      archived,
      openable: preview + delivered + archived,
    },
    newestStatus: nothing(row.newest_status),
    nextDate: nothing(row.next_date),
    lastSignedIn: nothing(row.last_signed_in),
  };
}

/* ── one member, for the preview ────────────────────────────────────── */

export type MemberHead = {
  id: string;
  name: string | null;
  email: string;
  acceptedOn: string | null;
};

/**
 * One member by id, or null.
 *
 * The membership predicate is in the statement that finds her, not checked
 * afterwards: an applicant has no portal, so there is no portal of hers to
 * preview, and the caller gets the same answer for "not a member" as for "no
 * such id" — nothing. The uuid shape is checked first because an id off a URL
 * reaches this, and Postgres raises rather than returning no rows when it is
 * handed something that is not a uuid.
 */
export async function readMember(id: string): Promise<MemberHead | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;

  const row = await queryOne<{
    id: string;
    name: string | null;
    email: string;
    accepted_on: string | null;
  }>(
    `select c.id, c.name, c.email::text as email,
            to_char(c.accepted_at at time zone 'utc', 'YYYY-MM-DD')
              as accepted_on
       from customer c
      where c.id = $1 and ${MEMBER_PREDICATE}`,
    [id]
  );
  if (!row) return null;

  return {
    id: row.id,
    name: nothing(row.name),
    email: row.email,
    acceptedOn: nothing(row.accepted_on),
  };
}

/* ── small things ───────────────────────────────────────────────────── */

/** See the bigint note at the top. Never NaN, never negative, never a string. */
function count(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

/** Null, an empty string and whitespace are all "nobody recorded one". */
function nothing(value: string | null | undefined): string | null {
  const text = (value ?? "").trim();
  return text.length > 0 ? text : null;
}
