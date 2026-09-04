/**
 * THE ONE OWNER OF "WHICH ONE IS HERS" — db/061.
 *
 * The founder, 2026-09-04: "there shouldnt be more than one ga[m]e", and then
 * "what i do want to do is give a host three ga[m]es to choose from. as an or
 * not an and. like a carousel look."
 *
 * db/061 collapsed five game beats into one and gave `occasion_slot` an
 * `offer_count`. A beat with an offer arrives at the portal as SEVERAL rows of
 * one join table sharing an `offer_group`, at most one of which carries a
 * `chosen_at`. Every surface that has to say what her evening actually
 * contains — the page, the prep list, the printed matter, and one day the
 * runbook — has to agree about which of those rows counts.
 *
 * CLAUDE.md rule 21 is why that sentence lives here and only here. The test it
 * sets is narrow and this passes it exactly: MUST TWO SURFACES AGREE ABOUT
 * THIS? They must. The page marking one card as hers while the shopping list
 * bought supplies for all three is not a cosmetic disagreement — it is a host
 * arriving on the night with the wrong things.
 *
 * ── WHAT COUNTS: SETTLED ────────────────────────────────────────────
 *
 * A row is SETTLED when the house simply placed it (`offer_group` null — every
 * pick before db/061 and every pool but the game) or when she has taken it
 * (`chosen_at` set). Everything else is a card she has been offered and has
 * not picked.
 *
 * AN UNSETTLED CARD IS STILL HERS. It was delivered; db/061 argues at length
 * that the OFFER is what binds. What it is not yet is part of what happens on
 * the night, so it contributes nothing to the shopping and nothing to the
 * printing — buying materials for three games because she has looked at three
 * games would be the product acting on an input she has not given.
 *
 * ── AND NOTHING MOVES ───────────────────────────────────────────────
 *
 * CLAUDE.md rule 18: between a mistake and its fix, the thing being corrected
 * stays exactly where it was. So the cards are ordered by `position`, which is
 * stamped once at approval and never recomputed — not by whether she has
 * chosen, not by score, not by name. Choosing marks a card. It never sorts the
 * stack, hides the two she declined, or moves the one she is about to change
 * her mind about.
 */

import type { MemberPiece } from "../selection/member.ts";

/* ── the rule, for TypeScript ───────────────────────────────────────── */

/**
 * Does this row count toward what actually happens?
 *
 * Placed by the house, or taken by her. Nothing else.
 */
export function isSettled(
  offerGroup: string | null | undefined,
  chosenAt: string | Date | null | undefined
): boolean {
  if (offerGroup === null || offerGroup === undefined) return true;
  return chosenAt !== null && chosenAt !== undefined;
}

/* ── the same rule, for SQL ─────────────────────────────────────────── */

/**
 * The same sentence as a predicate, for the reads that cannot be done in
 * TypeScript because they join through the pool's own tables.
 *
 * A STRING OF SQL EXPORTED FROM A MODULE reads badly for about a second, and
 * then the alternative reads worse: `readPrep` writing its own version of
 * "settled" is the second authority rule 21 forbids, and the drift would be
 * invisible — a prep list quietly shopping for two extra games while the page
 * showed one, with nothing red anywhere.
 *
 * `alias` is the join table's alias in the caller's statement. It is never a
 * value from a request; every call site passes a literal.
 */
export function settledSql(alias: string): string {
  return `(${alias}.offer_group is null or ${alias}.chosen_at is not null)`;
}

/* ── the carousel, as the page reads it ─────────────────────────────── */

export type OfferCard = {
  /** The pool row. `slug` is what the choose action names. */
  slug: string;
  name: string;
  description: string;
  pool: string;
  /** True for the one she has taken. At most one card in an offer is true. */
  chosen: boolean;
};

export type Offer = {
  /** `occasion_slot`'s beat key — 'game:1:0'. Stable, and the form's handle. */
  group: string;
  /** The beat's own name, from slot_kind. "The fun". */
  heading: string;
  /** In delivery order, always. See rule 18 above. */
  cards: OfferCard[];
  /** True once she has taken one of them. */
  settled: boolean;
};

/**
 * One thing she reads, in the order she reads it: a piece the house placed, or
 * a beat she chooses in.
 */
export type Entry =
  | { kind: "piece"; piece: MemberPiece }
  | { kind: "offer"; offer: Offer };

/**
 * A SECTION'S PIECES, WITH THE OFFERS FOLDED UP — in delivery order.
 *
 * One ordered list rather than two, because the order is the thing that must
 * not be got wrong (rule 18) and it is the caller who would get it wrong. A
 * template handed `{ offers, loose }` has to decide where the offer goes among
 * the pieces, which is a decision about her page being made in JSX.
 *
 * AN OFFER OF ONE IS NOT AN OFFER. Where a room had one eligible game the beat
 * delivered one card and there is nothing to choose between, so it comes back
 * as an ordinary piece and she is asked nothing. Rendering a carousel of one
 * with a "choose this" button would be taking a gesture the product has no use
 * for — rule 16 from the other end. It is also the honest shape of "where
 * fewer than three are eligible, show what exists": one is what exists, so one
 * is what shows, with no apology and nothing padded out to look like three.
 */
export function entriesIn(pieces: readonly MemberPiece[]): Entry[] {
  const members = new Map<string, MemberPiece[]>();
  for (const piece of pieces) {
    const group = piece.offerGroup;
    if (group === null) continue;
    const held = members.get(group);
    if (held) held.push(piece);
    else members.set(group, [piece]);
  }

  const entries: Entry[] = [];
  const done = new Set<string>();

  for (const piece of pieces) {
    const group = piece.offerGroup;
    const siblings = group === null ? null : (members.get(group) ?? []);

    if (group === null || siblings === null || siblings.length < 2) {
      entries.push({ kind: "piece", piece });
      continue;
    }
    // The offer takes the place of its FIRST card, which is where the beat
    // sits in her page. The other cards are inside it.
    if (done.has(group)) continue;
    done.add(group);

    entries.push({
      kind: "offer",
      offer: {
        group,
        heading: siblings[0].heading,
        cards: siblings.map((member) => ({
          slug: member.slug,
          name: member.name,
          description: member.description,
          pool: member.pool,
          chosen: member.chosen,
        })),
        settled: siblings.some((member) => member.chosen),
      },
    });
  }

  return entries;
}
