import Link from "next/link";

import { query } from "@/lib/db";
import {
  BANK_KINDS,
  BANK_PHASES,
  BANK_VENUES,
  POOL_STATUS,
  leadDays,
  shipsWord,
} from "@/lib/desk/labels";

import styles from "../../desk.module.css";
import { Chips, Empty, Head, Seam, Status, StatusLegend, TableRow } from "../bits";
import { setBankStatus } from "./actions";

/**
 * THE BANK — pool-selected atmosphere, per destination.
 *
 * The same instrument /desk/dishes is, for the same reason: the pool is
 * per-destination and four-kinded, so the question a curator actually asks here
 * — "what does Havana have for after dark that needs no door" — cannot be asked
 * of a list. Every control is a GET parameter, so a filtered view is a URL she
 * can send to somebody, and there is no client JavaScript on this screen.
 *
 * ── HOW TO READ THE COLUMNS, WHICH IS THE WHOLE DESIGN PROBLEM ───────
 *
 * Three of db/031's values are named the opposite of what they mean, and a
 * curator who reads them wrongly will TAG ROWS to match the wrong reading. So
 * the table never prints the enum's own word for them:
 *
 *   phase `all`      printed "no opinion", lower case. It is not "All" and not
 *                    "always" — it is the absence of a claim about the hour.
 *   ships `false`    printed "Owned if present", a sentence, never a blank cell
 *                    or an unticked box. Both of those read as "out of stock",
 *                    which is the one thing it does not mean.
 *   venue            two positive grades, never collapsed. "Needs a door to
 *                    somewhere" is soft and most apartments meet it. "Cannot
 *                    happen inside" is a hard constraint and is drawn as a veto
 *                    chip, the same mark the rest of the desk gives a thing
 *                    that rules an evening out.
 *
 * The typographic rule that follows from those three, and is stated in the note
 * on the screen: A CAPITAL IS A CLAIM, lower case is the absence of one.
 *
 * ── GESTURES ARE NOT HERE ────────────────────────────────────────────
 *
 * db/031 kept them off this table on purpose — a gesture is INVARIANT per
 * destination and the bank is only what selection chooses among. Filter to one
 * destination and the gesture is shown at the foot of this screen, read-only,
 * with where it is edited.
 */

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  slug: string;
  name: string;
  description: string;
  kind: string;
  phase: string;
  venue: string;
  min_lead_days: number | string | null;
  ships: boolean;
  /** numeric(4,3) — a STRING out of node-postgres. Never compared as a number. */
  weight: string;
  status: string;
  world_name: string;
  card_id: string | null;
  card_name: string | null;
  /** count(*) is bigint, which node-postgres hands back as a STRING. */
  ingredients: string;
};

type Destination = {
  id: string;
  slug: string;
  name: string;
  gesture: string | null;
  gesture_note: string | null;
};

const PER_PAGE = 100;

const STATUSES = ["draft", "active", "discontinued"];

/** The two answers the `ships` filter can give, as words rather than a boolean. */
const SHIPPING = [
  { code: "ships", label: "Only what ships", value: true },
  { code: "owned", label: "Only owned-if-present", value: false },
];

const label = (
  list: readonly { code: string; label: string }[],
  code: string
) => list.find((entry) => entry.code === code)?.label ?? code;

/** One value out of the query string, or "" — never a decision, only a read. */
function one(value: string | string[] | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

/** A value that must be one of a closed set, or "" for "no filter". */
function oneOf(
  value: string | string[] | undefined,
  allowed: readonly string[]
): string {
  const picked = one(value);
  return allowed.includes(picked) ? picked : "";
}

export default async function BankPage({
  searchParams,
}: PageProps<"/desk/bank">) {
  const params = await searchParams;

  const destinations = await query<Destination>(
    `select id, slug::text as slug, name, gesture, gesture_note
       from world
      where status <> 'retired'
      order by name`
  );

  const q = one(params.q).slice(0, 80);
  const destination = oneOf(
    params.destination,
    destinations.map((row) => row.slug)
  );
  const kind = oneOf(params.kind, BANK_KINDS.map((entry) => entry.code));
  const phase = oneOf(params.phase, BANK_PHASES.map((entry) => entry.code));
  const venue = oneOf(params.venue, BANK_VENUES.map((entry) => entry.code));
  const shipping = oneOf(params.ships, SHIPPING.map((entry) => entry.code));
  const status = oneOf(params.status, STATUSES);
  const page = Math.max(1, Number(one(params.page)) || 1);

  // (clause, value) pairs, so that adding a filter is one line and cannot get
  // the placeholder numbering wrong — the bug every hand-numbered dynamic WHERE
  // eventually has. Lifted from /desk/dishes deliberately.
  const clauses: string[] = [];
  const values: unknown[] = [];
  const where = (sql: string, value: unknown) => {
    values.push(value);
    clauses.push(sql.replace("$?", `$${values.length}`));
  };

  if (q) where("b.name ilike '%' || $? || '%'", q);
  if (destination) where("w.slug::text = $?", destination);
  if (kind) where("b.kind::text = $?", kind);
  // A phase filter of "no opinion" asks for the rows that make no claim, which
  // is a real question and not the same as "any phase" — that is the empty
  // filter above it in the select.
  if (phase) where("b.phase::text = $?", phase);
  if (venue) where("b.venue::text = $?", venue);
  if (shipping) {
    where(
      "b.ships = $?",
      SHIPPING.find((entry) => entry.code === shipping)?.value ?? true
    );
  }
  if (status) where("b.status::text = $?", status);

  const filter = clauses.length > 0 ? `where ${clauses.join(" and ")}` : "";

  const counted = await query<{ total: string; everything: string }>(
    `select (select count(*) from bank_item b
               join world w on w.id = b.world_id ${filter}) as total,
            (select count(*) from bank_item) as everything`,
    values
  );

  // Both counts arrive as STRINGS. Parsed once, here, and never compared in the
  // shape they arrived in.
  const matched = Number(counted[0]?.total ?? 0);
  const everything = Number(counted[0]?.everything ?? 0);
  const pages = Math.max(1, Math.ceil(matched / PER_PAGE));
  const current = Math.min(page, pages);
  const offset = (current - 1) * PER_PAGE;

  const rows = await query<Row>(
    `select b.id, b.slug::text as slug, b.name, b.description,
            b.kind::text as kind, b.phase::text as phase,
            b.venue::text as venue, b.min_lead_days, b.ships,
            b.weight::text as weight, b.status::text as status,
            w.name as world_name,
            c.id as card_id, c.name as card_name,
            (select count(*) from bank_item_ingredient i
              where i.bank_item_id = b.id) as ingredients
       from bank_item b
       join world w on w.id = b.world_id
       left join bank_item c on c.id = b.technique_card_id
       ${filter}
      order by w.name, b.kind, b.name
      limit ${PER_PAGE} offset ${offset}`,
    values
  );

  /** This view's URL with one thing changed. Paging must not drop the filters. */
  const href = (changes: Record<string, string>) => {
    const next = new URLSearchParams();
    const base: Record<string, string> = {
      q,
      destination,
      kind,
      phase,
      venue,
      ships: shipping,
      status,
      page: String(current),
    };
    for (const [key, value] of Object.entries({ ...base, ...changes })) {
      if (!value) continue;
      if (key === "page" && value === "1") continue;
      next.set(key, value);
    }
    const search = next.toString();
    return search ? `/desk/bank?${search}` : "/desk/bank";
  };

  const filtered = clauses.length > 0;
  const first = matched === 0 ? 0 : offset + 1;
  const last = Math.min(offset + PER_PAGE, matched);
  const house = destinations.find((row) => row.slug === destination) ?? null;

  return (
    <>
      <Head eyebrow="The bank" title="Atmosphere">
        <Link href="/desk/bank/new" className={styles.button}>
          Add to the bank
        </Link>
      </Head>

      <p className={styles.note}>
        Goods, host acts, games the house has out, and printed cards — one pool,
        per destination, chosen a few at a time per package. The four kinds are
        one table because their mechanics are identical and they differ only in
        what a curator calls them. Read the columns this way:{" "}
        <strong>a capital is a claim, lower case is the absence of one</strong>.
        &ldquo;no opinion&rdquo; under Time of day means this line says nothing
        about the hour — not that it suits every hour. &ldquo;Owned if
        present&rdquo; under What arrives means the house sends nothing and the
        scene card only glances at it — it is not out of stock.
      </p>

      <form method="get" action="/desk/bank" className={styles.buttonRow}>
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search the name"
          aria-label="Search the name"
          className={styles.input}
        />
        <select
          name="destination"
          defaultValue={destination}
          aria-label="Destination"
          className={styles.select}
        >
          <option value="">Every destination</option>
          {destinations.map((row) => (
            <option key={row.slug} value={row.slug}>
              {row.name}
            </option>
          ))}
        </select>
        <select
          name="kind"
          defaultValue={kind}
          aria-label="What it is"
          className={styles.select}
        >
          <option value="">Every kind</option>
          {BANK_KINDS.map((entry) => (
            <option key={entry.code} value={entry.code}>
              {entry.label}
            </option>
          ))}
        </select>
        <select
          name="phase"
          defaultValue={phase}
          aria-label="Time of day"
          className={styles.select}
        >
          {/*
            "Any time of day" is NO FILTER. "No opinion" is a filter, for the
            rows that make no claim about the hour. Two different things, and
            the reason the default value here is "" rather than "all".
          */}
          <option value="">Any time of day</option>
          {BANK_PHASES.map((entry) => (
            <option key={entry.code} value={entry.code}>
              {entry.code === "all"
                ? "Only the ones with no opinion"
                : entry.label}
            </option>
          ))}
        </select>
        <select
          name="venue"
          defaultValue={venue}
          aria-label="Where it can happen"
          className={styles.select}
        >
          <option value="">Anywhere it can happen</option>
          {BANK_VENUES.map((entry) => (
            <option key={entry.code} value={entry.code}>
              {entry.label}
            </option>
          ))}
        </select>
        <select
          name="ships"
          defaultValue={shipping}
          aria-label="What arrives"
          className={styles.select}
        >
          <option value="">Ships or not</option>
          {SHIPPING.map((entry) => (
            <option key={entry.code} value={entry.code}>
              {entry.label}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={status}
          aria-label="Status"
          className={styles.select}
        >
          <option value="">Any status</option>
          {STATUSES.map((code) => (
            <option key={code} value={code}>
              {POOL_STATUS[code]}
            </option>
          ))}
        </select>
        <button className={styles.button}>Filter</button>
        {filtered ? (
          <Link href="/desk/bank" className={styles.filter}>
            Clear
          </Link>
        ) : null}
      </form>

      <div className={styles.filters}>
        <span className={styles.hint}>
          {matched === 0
            ? filtered
              ? `Nothing matches, out of ${everything}`
              : "Nothing yet"
            : `${first}–${last} of ${matched}${
                filtered ? ` matched, out of ${everything}` : ""
              }`}
        </span>
        {pages > 1 ? (
          <>
            {/*
              A boundary is a SPAN and not a disabled link, for the reason
              /desk/dishes gives: `aria-disabled` on an anchor is a lie a screen
              reader repeats, because the link still navigates.
            */}
            {current > 1 ? (
              <Link
                href={href({ page: String(current - 1) })}
                className={styles.filter}
              >
                Previous
              </Link>
            ) : null}
            <span className={styles.hint}>
              Page {current} of {pages}
            </span>
            {current < pages ? (
              <Link
                href={href({ page: String(current + 1) })}
                className={styles.filter}
              >
                Next
              </Link>
            ) : null}
          </>
        ) : null}
      </div>

      {rows.length > 0 ? <StatusLegend statuses={POOL_STATUS} /> : null}

      {rows.length === 0 ? (
        <Empty>
          {filtered ? (
            <>
              Nothing matches those filters.{" "}
              <Link href="/desk/bank">Clear them</Link> to see the whole pool.
            </>
          ) : (
            <>
              Nothing in the bank yet.{" "}
              <Link href="/desk/bank/new">Add the first line</Link> — one at a
              time is the common case here, and an item arrives as a draft
              because offering it is a curator&rsquo;s decision.
            </>
          )}
        </Empty>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>The line</th>
              <th>What it is</th>
              <th>Time of day</th>
              <th>Where it can happen</th>
              <th>What arrives</th>
              <th>Lead time</th>
              <th>Card</th>
              <th>Destination</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <TableRow key={row.id} status={row.status}>
                <td>
                  <Link href={`/desk/bank/${row.id}`} className={styles.whoEmail}>
                    {row.name}
                  </Link>
                  <div className={styles.when}>
                    {row.slug} · weight {row.weight}
                    {Number(row.ingredients) > 0
                      ? ` · ${row.ingredients} to buy`
                      : ""}
                  </div>
                </td>
                <td className={styles.numeric}>{label(BANK_KINDS, row.kind)}</td>
                <td className={styles.numeric}>
                  {/*
                    LOWER CASE IS THE ABSENCE OF A CLAIM. `all` is db/031's
                    "no opinion" and is deliberately not printed as "All",
                    which a curator reads as "every phase".
                  */}
                  {row.phase === "all"
                    ? "no opinion"
                    : label(BANK_PHASES, row.phase)}
                </td>
                <td>
                  {row.venue === "requires_outdoors" ? (
                    // A hard constraint, drawn with the mark the rest of the
                    // desk gives a veto. The soft grade beside it is plain text
                    // on purpose: the two must not look like one control.
                    <Chips items={["Cannot happen inside"]} tone="no" />
                  ) : row.venue === "outdoor_access" ? (
                    "Needs a door to somewhere"
                  ) : (
                    "indoors is fine"
                  )}
                </td>
                {/*
                  BOTH STATES ARE A SENTENCE. An unticked box or a blank cell
                  here would read as "out of stock", which is the one thing
                  `ships = false` does not mean.
                */}
                <td>{shipsWord(row.ships)}</td>
                <td className={styles.numeric}>{leadDays(row.min_lead_days)}</td>
                <td>
                  {row.card_id ? (
                    <Link
                      href={`/desk/bank/${row.card_id}`}
                      className={styles.link}
                    >
                      {row.card_name}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td>{row.world_name}</td>
                <td>
                  <Status code={row.status} label={POOL_STATUS[row.status]} />
                </td>
                <td>
                  <form action={setBankStatus}>
                    <input type="hidden" name="id" value={row.id} />
                    <input
                      type="hidden"
                      name="status"
                      value={row.status === "active" ? "draft" : "active"}
                    />
                    <button className={styles.filter}>
                      {row.status === "active" ? "Withdraw" : "Offer it"}
                    </button>
                  </form>
                </td>
              </TableRow>
            ))}
          </tbody>
        </table>
      )}

      {house ? (
        <Seam title={`The gesture at ${house.name} is not in this pool`}>
          {house.gesture ? (
            <>
              <strong>{house.gesture}</strong>
              {house.gesture_note ? ` — ${house.gesture_note}` : ""}. It is the
              one thing that always happens here, so it is invariant and not
              something selection chooses among — an invariant in a pool of
              variables eventually gets left out of a package. It lives on the
              destination record and is edited there, not here.
            </>
          ) : (
            <>
              Nothing written yet. A gesture is the one thing that always
              happens in this room, so it is invariant rather than pool content
              and it lives on the destination record, not in the bank. It is not
              editable from this screen and will not become so.
            </>
          )}
        </Seam>
      ) : null}
    </>
  );
}
