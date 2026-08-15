import "server-only";

import { query } from "@/lib/db";

/**
 * THE SEAM BETWEEN THE SELECTION ENGINE AND THE AUTHORING QUEUE.
 *
 * ── WHY THIS MATTERS MORE THAN IT LOOKS ─────────────────────────────
 *
 * The engine already discovers, precisely and mechanically, what the catalogue
 * is missing: "no game in the pool is an honouring ritual, and birthday
 * requires one"; "nothing can fill The moment for a getaway of two". Those
 * statements ARE the authoring queue, and until this module existed they lived
 * only inside a run nobody read.
 *
 * They are now the ONLY place a gap is visible to anybody. An unfilled slot is
 * silent to the member — she does not receive that deliverable and is never
 * told a slot existed — so if a gap does not reach the desk it reaches nowhere
 * at all. Treat this as the primary output of the gap machinery.
 *
 * ── HOW IT IS WIRED, AND WHY IT IS NOT WIRED HERE ───────────────────
 *
 * The engine (src/lib/selection/) is owned by another pass and is being
 * changed right now to split what the house sees from what the member sees.
 * So this module takes a STRUCTURAL shape rather than importing
 * `CatalogueGap`, and the call site is one line wherever a selection is
 * persisted — a job, not a request handler, because the engine never writes
 * and whoever calls it has to be safe to retry:
 *
 *     import { recordCatalogueGaps } from "@/lib/desk/gaps";
 *     const result = await selectForApplication(pool, applicationId);
 *     await recordCatalogueGaps(result.gaps);
 *
 * `SelectionResult["gaps"]` is assignable to the parameter below as long as
 * CatalogueGap keeps its five fields; adding fields to it does not break this.
 *
 * ── WHAT MUST NEVER BECOME A TO-DO ──────────────────────────────────
 *
 * A slot that is empty because the HOST OPTED OUT — she is not serving food,
 * so there is no menu — is not work. Nobody can act on it, and a queue that
 * fills with rows nobody can act on stops being read.
 *
 * That distinction is the ENGINE'S and is already made UPSTREAM of this
 * module: db/014 hangs `slot_kind.excluded_by` off a fact about her evening,
 * and `planSlots` removes the rule before anything is scoped or filled, so an
 * excluded slot never becomes a gap in the first place. Nothing here needs to
 * know a single slot code.
 *
 * The `optedOut` skip below is therefore belt and braces rather than the
 * mechanism, and it stays for one reason: if a future exclusion is ever
 * discovered during the fill rather than before it, the flag is where it will
 * arrive, and the failure mode of not having it is a curator's list quietly
 * filling with work that does not exist. It is never re-derived from wording.
 */

export type IngestibleGap = {
  /** Which pool could not fill the slot: 'product', 'game', 'menu'. */
  pool: string;
  slotCode: string;
  slotLabel: string;
  required: boolean;
  /** The engine's sentence. Shown verbatim; never rewritten here. */
  detail: string;
  /**
   * Set by the engine when the slot is empty because the host declined the
   * deliverable. Optional so that a `CatalogueGap` without it still assigns.
   */
  optedOut?: boolean;
};

/**
 * WHAT A GAP IS, for deduplication.
 *
 * Pool plus slot, and deliberately nothing else. The same gap fires on every
 * selection for every applicant — hundreds of times a week once this is live —
 * and one row is the correct number of rows. Including the destination, the
 * occasion or the run would make each of those a separate "task" for the same
 * missing thing.
 *
 * The unique index in db/013 is what enforces it, which also means a DISMISSED
 * gap never comes back: the row still exists, so the insert finds it and does
 * nothing.
 */
export function gapKey(gap: IngestibleGap): string {
  return `${gap.pool}:${gap.slotCode}`;
}

export type GapIngestResult = {
  considered: number;
  skippedOptedOut: number;
  created: number;
};

export async function recordCatalogueGaps(
  gaps: readonly IngestibleGap[]
): Promise<GapIngestResult> {
  const result: GapIngestResult = {
    considered: gaps.length,
    skippedOptedOut: 0,
    created: 0,
  };

  // One row per distinct gap within this batch too, so a candidate list that
  // reports the same gap three times does not do three inserts.
  const seen = new Map<string, IngestibleGap>();
  for (const gap of gaps) {
    if (gap.optedOut) {
      result.skippedOptedOut += 1;
      continue;
    }
    const key = gapKey(gap);
    if (!seen.has(key)) seen.set(key, gap);
  }

  for (const [key, gap] of seen) {
    const rows = await query<{ id: string }>(
      `insert into desk_todo (body, source, gap_key, detail)
       values ($1, 'gap', $2, $3::jsonb)
       on conflict (gap_key) where gap_key is not null do nothing
       returning id::text as id`,
      [
        // The engine's own sentence, with the slot named first so the list
        // reads as work rather than as a log line.
        `${gap.slotLabel}: ${gap.detail}`,
        key,
        JSON.stringify({
          pool: gap.pool,
          slotCode: gap.slotCode,
          slotLabel: gap.slotLabel,
          required: gap.required,
          detail: gap.detail,
        }),
      ]
    );
    if (rows.length > 0) result.created += 1;
  }

  if (result.created > 0) {
    console.log(
      `[gaps] ${result.created} new catalogue gap(s) are now on the desk's list`
    );
  }
  return result;
}
