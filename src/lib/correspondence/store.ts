import "server-only";

/**
 * THE CORRESPONDENCE, READ AND WRITTEN — db/024, from the member's side.
 *
 * Every read here is scoped by customer id in the same statement that finds
 * the row, exactly as src/lib/portal/occasions.ts is and for the same reason:
 * a member holding another member's id gets the same answer as a member
 * holding a typo — nothing. Not a 403; there is nothing here to acknowledge
 * the existence of.
 *
 * ── THE VOICE IS THE PINNED ONE, ALWAYS ──────────────────────────────
 *
 * `revelle.voice_id` is set on first delivery and never moves (db/004). This
 * module reads THAT row and never `world_current_voice`, so a thank-you
 * written next spring is in the same house as the invitation that went out
 * last summer. A curator republishing WESTHAMPTON's voice tomorrow changes
 * what tomorrow's Revelles sound like and nothing about hers.
 *
 * It is also recorded a second time, on the correspondence row itself, so a
 * piece can say what it was written in without depending on a column somebody
 * later decides to move.
 *
 * ── NOTHING HERE DECIDES WHETHER A PIECE MAY BE WRITTEN ──────────────
 *
 * That is ./writer.ts (is there a writer) and ./types.ts (may this piece have
 * a voice at all). This file moves rows.
 */

import { query, queryOne, transaction } from "@/lib/db";
import { readTheme } from "@/lib/portal/theme";
import { HOUSE, type Destination, type Voice } from "@/lib/tokens";
import type { Draft, PieceRequest } from "./types";

/* ── the occasion this correspondence belongs to ─────────────────────── */

export type Correspondent = {
  revelleId: string;
  /** The destination, with its PINNED voice. Null when none was pinned. */
  destination: Destination | null;
  /** The destination's name even when there is no voice, for the refusal. */
  destinationName: string;
  eventDate: string | null;
  guestCount: number | null;
  /** How many days this occasion runs. One for an evening. */
  days: number;
};

type HeadRow = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  slug: string;
  tokens: unknown;
  tokens_override: unknown;
  voice: unknown;
  voice_version: number | null;
  voice_override: unknown;
  event_date: Date | null;
  guest_count: number | null;
  days: number;
};

const OPENABLE = ["preview", "delivered", "archived"] as const;

/**
 * The occasion, as the thing correspondence is written for.
 *
 * Returns null for a Revelle that is not hers, not openable, or not there —
 * one answer for all three.
 */
export async function readCorrespondent(
  customerId: string,
  revelleId: string
): Promise<Correspondent | null> {
  if (!/^[0-9a-f-]{36}$/i.test(revelleId)) return null;

  const row = await queryOne<HeadRow>(
    `select r.id,
            coalesce(r.title_override, w.name)      as name,
            coalesce(r.tagline_override, w.tagline) as tagline,
            w.description, w.slug::text as slug,
            w.tokens, r.tokens_override,
            v.voice, v.version as voice_version, r.voice_override,
            r.event_date, r.guest_count,
            coalesce(s.days, 1) as days
       from revelle r
       join world w on w.id = r.world_id
       join quiz_response q on q.id = r.quiz_response_id
       left join world_voice v on v.id = r.voice_id
       left join occasion_shape s on s.occasion = q.occasion
      where r.id = $1 and r.customer_id = $2
        and r.status = any($3::revelle_status[])`,
    [revelleId, customerId, OPENABLE]
  );
  if (!row) return null;

  return {
    revelleId: row.id,
    destinationName: row.name,
    destination: destinationFrom(row),
    eventDate: day(row.event_date),
    guestCount: row.guest_count,
    days: row.days,
  };
}

/**
 * The rows as the object `writerPrompt` takes.
 *
 * Null when no voice was pinned, which db/004 says is legal and means the
 * Revelle was issued with a look and no register. The caller refuses in words;
 * it does not substitute today's voice, because substituting it is exactly the
 * retroactive change 004 exists to prevent.
 *
 * `voice_override` is shallow-merged over the pinned voice, which is what
 * db/004 says that column means. One level only: overriding `signOffs`
 * replaces the list, and that is the intent — a per-customer adjustment is a
 * short list of replacements, not a diff.
 */
function destinationFrom(row: HeadRow): Destination | null {
  const base = row.voice as Record<string, unknown> | null;
  if (!base || typeof base !== "object") return null;

  const voice = {
    ...base,
    ...((row.voice_override ?? {}) as Record<string, unknown>),
  } as unknown as Voice;

  // Published voices are shape-checked by validate_voice() in db/004, so this
  // is not a validator — it is the one assumption worth not making, because a
  // voice with no lines produces confident copy for the wrong house.
  if (!Array.isArray(voice.exemplars) || voice.exemplars.length === 0) {
    return null;
  }

  const look = readTheme(merged(row.tokens, row.tokens_override), row.slug);

  return {
    key: row.slug,
    name: row.name,
    tagline: row.tagline,
    premise: row.description ?? "",
    look: look.theme ?? HOUSE,
    voice,
    voiceVersion: row.voice_version ?? 1,
  };
}

/** Her per-Revelle token overrides over the stored set. Same as the portal's. */
function merged(base: unknown, override: unknown): unknown {
  const a = (base ?? {}) as Record<string, unknown>;
  const b = (override ?? {}) as Record<string, unknown>;
  const out: Record<string, unknown> = { ...a };
  for (const [key, value] of Object.entries(b)) {
    const left = out[key];
    if (
      left && typeof left === "object" && !Array.isArray(left) &&
      value && typeof value === "object" && !Array.isArray(value)
    ) {
      out[key] = { ...(left as object), ...(value as object) };
      continue;
    }
    out[key] = value;
  }
  return out;
}

/* ── the guest list ──────────────────────────────────────────────────── */

export type Guest = {
  id: string;
  name: string;
  email: string | null;
  reply: "unknown" | "coming" | "not_coming";
  note: string;
};

export async function listGuests(revelleId: string): Promise<Guest[]> {
  const rows = await query<{
    id: string;
    name: string;
    email: string | null;
    reply: Guest["reply"];
    note: string;
  }>(
    `select id, name, email, reply, note
       from revelle_guest
      where revelle_id = $1
      order by position, name`,
    [revelleId]
  );
  return rows;
}

/**
 * Add one guest.
 *
 * The address is optional and that is the load-bearing part: half a real guest
 * list is people who will be told in person, and a list that demands an
 * address for a name is a list she keeps somewhere else instead.
 *
 * `on conflict do nothing` against the partial unique index, so adding the
 * same person twice is not an error she has to read a sentence about.
 */
export async function addGuest(
  revelleId: string,
  name: string,
  email: string | null,
  note: string
): Promise<void> {
  await query(
    `insert into revelle_guest (revelle_id, name, email, note, position)
     values ($1, $2, $3, $4,
             coalesce((select max(position) + 1 from revelle_guest
                        where revelle_id = $1), 0))
     on conflict do nothing`,
    [revelleId, name, email, note]
  );
}

export async function removeGuest(
  revelleId: string,
  guestId: string
): Promise<void> {
  await query(`delete from revelle_guest where id = $1 and revelle_id = $2`, [
    guestId,
    revelleId,
  ]);
}

/**
 * WHO A SEND IS FOR — everyone with an address, or exactly one of them.
 *
 * Pure, and it lives beside the guest list rather than beside the send so that
 * the confirmation panel and the action that sends can derive the same answer
 * from the same function. The panel names every address it is about to use;
 * the action re-derives them rather than trusting what the panel submitted.
 *
 * There is no default. `to` is either the word everyone or one guest's id, and
 * anything else resolves to nobody — which is what "no accidental
 * send-to-all" has to mean if it is not going to be a dialog somebody clicks
 * through.
 */
export function recipientsFor(
  guests: readonly Guest[],
  to: string
): { guestId: string; name: string; email: string }[] {
  const addressed = guests.filter(
    (guest): guest is Guest & { email: string } => guest.email !== null
  );
  if (to === "everyone") {
    return addressed.map((guest) => ({
      guestId: guest.id,
      name: guest.name,
      email: guest.email,
    }));
  }
  const one = addressed.find((guest) => guest.id === to);
  return one ? [{ guestId: one.id, name: one.name, email: one.email }] : [];
}

/** What she has been told, in a kitchen or a group chat. */
export async function setReply(
  revelleId: string,
  guestId: string,
  reply: Guest["reply"]
): Promise<void> {
  await query(
    `update revelle_guest
        set reply = $3::guest_reply,
            replied_at = case when $3 = 'unknown' then null else now() end
      where id = $1 and revelle_id = $2`,
    [guestId, revelleId, reply]
  );
}

/* ── the pieces ──────────────────────────────────────────────────────── */

export type PieceSummary = {
  id: string;
  kind: string;
  plain: boolean;
  dayIndex: number | null;
  status: "draft" | "sent";
  /** The words in force: the newest draft. Empty when nothing is written. */
  body: string;
  hand: "house" | "hers" | null;
  sentTo: number;
  createdAt: string;
};

export async function listPieces(revelleId: string): Promise<PieceSummary[]> {
  const rows = await query<{
    id: string;
    piece: string;
    plain: boolean;
    day_index: number | null;
    status: "draft" | "sent";
    body: string | null;
    hand: "house" | "hers" | null;
    sent_to: string;
    created_at: Date;
  }>(
    `select c.id, c.piece, c.plain, c.day_index, c.status, c.created_at,
            cur.body, cur.hand,
            (select count(*) from correspondence_send s
              where s.correspondence_id = c.id and s.error is null) as sent_to
       from correspondence c
       left join correspondence_current cur on cur.correspondence_id = c.id
      where c.revelle_id = $1
      order by c.created_at desc`,
    [revelleId]
  );

  return rows.map((row) => ({
    id: row.id,
    kind: row.piece,
    plain: row.plain,
    dayIndex: row.day_index,
    status: row.status,
    body: row.body ?? "",
    hand: row.hand,
    sentTo: Number(row.sent_to),
    createdAt: row.created_at.toISOString(),
  }));
}

export type Piece = {
  id: string;
  revelleId: string;
  kind: string;
  plain: boolean;
  reason: string;
  ask: string;
  facts: string[];
  dayIndex: number | null;
  status: "draft" | "sent";
  drafts: Draft[];
  sends: { email: string; sentAt: string; error: string | null }[];
};

/** One piece, with every version of it. Scoped by customer in the statement. */
export async function readPiece(
  customerId: string,
  revelleId: string,
  pieceId: string
): Promise<Piece | null> {
  if (!/^[0-9a-f-]{36}$/i.test(pieceId)) return null;

  const row = await queryOne<{
    id: string;
    revelle_id: string;
    piece: string;
    plain: boolean;
    plain_reason: string;
    ask: string;
    facts: string[];
    day_index: number | null;
    status: "draft" | "sent";
  }>(
    `select c.id, c.revelle_id, c.piece, c.plain, c.plain_reason,
            c.ask, c.facts, c.day_index, c.status
       from correspondence c
       join revelle r on r.id = c.revelle_id
      where c.id = $1 and c.revelle_id = $2 and r.customer_id = $3
        and r.status = any($4::revelle_status[])`,
    [pieceId, revelleId, customerId, OPENABLE]
  );
  if (!row) return null;

  const drafts = await query<{
    id: string;
    ordinal: number;
    hand: "house" | "hers";
    body: string;
    replaces: string | null;
    model: string | null;
    created_at: Date;
  }>(
    `select id, ordinal, hand, body, replaces, model, created_at
       from correspondence_draft
      where correspondence_id = $1
      order by ordinal`,
    [pieceId]
  );

  const sends = await query<{ email: string; sent_at: Date; error: string | null }>(
    `select email, sent_at, error from correspondence_send
      where correspondence_id = $1 order by sent_at desc, email`,
    [pieceId]
  );

  return {
    id: row.id,
    revelleId: row.revelle_id,
    kind: row.piece,
    plain: row.plain,
    reason: row.plain_reason,
    ask: row.ask,
    facts: row.facts ?? [],
    dayIndex: row.day_index,
    status: row.status,
    drafts: drafts.map((d) => ({
      id: d.id,
      ordinal: d.ordinal,
      hand: d.hand,
      body: d.body,
      replaces: d.replaces,
      model: d.model,
      createdAt: d.created_at.toISOString(),
    })),
    sends: sends.map((s) => ({
      email: s.email,
      sentAt: s.sent_at.toISOString(),
      error: s.error,
    })),
  };
}

/**
 * Start a piece and record its first draft, in one transaction.
 *
 * One transaction because a correspondence row with no draft is a piece that
 * was asked for and never written, and there is no screen on which that is a
 * useful thing to be looking at.
 *
 * `voiceId` is null for a plain piece — and db/024's check constraint is what
 * makes that structural rather than a convention here.
 */
export async function startPiece(
  revelleId: string,
  request: PieceRequest,
  body: string,
  voiceId: string | null,
  model: string | null
): Promise<string> {
  const plain = request.route === "plain";
  return transaction(async (client) => {
    const piece = await client.query<{ id: string }>(
      `insert into correspondence
         (revelle_id, piece, voice_id, plain, plain_reason, ask, facts, day_index)
       values ($1, $2, $3, $4, $5, $6, $7, $8)
       returning id`,
      [
        revelleId,
        plain ? "notice" : request.kind,
        plain ? null : voiceId,
        plain,
        plain ? request.reason : "",
        request.ask,
        request.facts,
        plain ? null : request.dayIndex,
      ]
    );
    const id = piece.rows[0].id;

    await client.query(
      `insert into correspondence_draft
         (correspondence_id, hand, body, model, voice_id)
       values ($1, 'house', $2, $3, $4)`,
      [id, body, plain ? null : model, plain ? null : voiceId]
    );

    return id;
  });
}

/**
 * A NEW HOUSE DRAFT, replacing the one she turned down.
 *
 * Not an update. Her rejection is signal, and a signal with the rejected line
 * deleted says nothing at all — see the essay at the top of db/024.
 */
export async function addHouseDraft(
  pieceId: string,
  body: string,
  replaces: string,
  voiceId: string | null,
  model: string | null
): Promise<void> {
  await query(
    `insert into correspondence_draft
       (correspondence_id, hand, body, replaces, model, voice_id)
     values ($1, 'house', $2, $3, $4, $5)`,
    [pieceId, body, replaces, model, voiceId]
  );
}

/**
 * HER WORDS, alongside the house's rather than over them.
 *
 * The pair — what the house wrote, what she sent — is the highest-quality
 * voice training data in the system, and an UPDATE would destroy exactly it.
 * `voice_signal` in db/024 is the read that makes the pair useful.
 */
export async function addHerDraft(
  pieceId: string,
  body: string,
  replaces: string
): Promise<void> {
  await query(
    `insert into correspondence_draft
       (correspondence_id, hand, body, replaces)
     values ($1, 'hers', $2, $3)`,
    [pieceId, body, replaces]
  );
}

/** The words currently in force, and their id. Null before anything is written. */
export function currentDraft(piece: Piece): Draft | null {
  return piece.drafts.length === 0
    ? null
    : piece.drafts[piece.drafts.length - 1];
}

/** Every house line she has turned down, oldest first. What not to write again. */
export function rejectedLines(piece: Piece): string[] {
  const replaced = new Set(
    piece.drafts.map((d) => d.replaces).filter((id): id is string => id !== null)
  );
  return piece.drafts
    .filter((d) => d.hand === "house" && replaced.has(d.id))
    .map((d) => d.body);
}

/* ── sending ─────────────────────────────────────────────────────────── */

/** One recipient's outcome, recorded whether it worked or not. */
export async function recordSend(
  pieceId: string,
  draftId: string,
  guestId: string | null,
  email: string,
  providerId: string | null,
  error: string | null
): Promise<void> {
  await query(
    `insert into correspondence_send
       (correspondence_id, draft_id, guest_id, email, provider_id, error)
     values ($1, $2, $3, $4, $5, $6)`,
    [pieceId, draftId, guestId, email, providerId, error]
  );
}

/** It has gone. Recorded once, on the first successful recipient. */
export async function markSent(pieceId: string): Promise<void> {
  await query(
    `update correspondence
        set status = 'sent', sent_at = coalesce(sent_at, now())
      where id = $1 and status = 'draft'`,
    [pieceId]
  );
}

/* ── small things ────────────────────────────────────────────────────── */

/** A `date` column as its calendar day. Same reason as the portal's. */
function day(value: Date | null): string | null {
  if (!value) return null;
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const date = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${date}`;
}
