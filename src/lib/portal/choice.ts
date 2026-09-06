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
 * ── AND THEN THE COURSES — db/062 ───────────────────────────────────
 *
 * Founder, 2026-09-05: "lets give 3 menu options (if member wants) like we do
 * for games", and then "three per course". So `the_appetizer`, `the_main` and
 * `the_dessert` each offer three, and a host's page carries four beats she
 * chooses in rather than one.
 *
 * NOTHING BELOW CHANGED FOR THAT, and that is the fact worth recording. Every
 * function here reads `offerGroup` and `chosen` off a `MemberPiece` and has
 * never asked which pool it came from, because db/061 put `offer_count` on
 * `occasion_slot` and `offer_group`/`chosen_at` on every join table rather than
 * on the game's. A second pool arriving and finding the mechanism already fits
 * is what a pool-agnostic column was for.
 *
 * The one thing added is `Offer.pool`, so that a surface can say the true thing
 * about the beat — a game runs, a course is eaten — without a page inferring it
 * from a heading.
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

import { idColumnFor, tablesFor, type EntityTable } from "../pools/registry.ts";
import { inWords } from "./sections.ts";
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

/**
 * ── AND THEN THE FIELD DAY — db/069 ─────────────────────────────────
 *
 * Founder, 2026-09-06: "field day games include all and she chooses", and then
 * "it is a set across different days if host wants it."
 *
 * AN OFFER IS NO LONGER ALWAYS AN OR, and this module is where that stops
 * being a schema fact and becomes a behaviour. `occasion_slot.offer_rule`
 * names two kinds and `revelle_<pool>.offer_exclusive` stamps which kind a
 * delivered row arrived in:
 *
 *   one_of   db/061's carousel. Taking one clears its siblings.
 *   any_of   the field day. Taking one leaves its siblings exactly as they
 *            were, and she may hold any non-empty subset of them.
 *
 * THE RULE IS READ OFF THE ROW AND NEVER OFF THE CALLER. A parameter saying
 * which kind of offer this is would be a second authority over a fact the
 * delivered row already carries (rule 21), and the failure would be the worst
 * available: a caller passing the wrong one would either clear a host's field
 * day down to a single game or leave a carousel holding two, and both look
 * like a working button. So the `case` below branches on `j.offer_exclusive`,
 * inside the statement, where a caller cannot reach it.
 *
 * `isSettled` NEEDED NO CHANGE, and that is worth recording rather than
 * assuming. A row in an `any_of` offer that she has not taken is unsettled by
 * exactly the same sentence that made an unchosen carousel card unsettled —
 * offered, delivered, hers, and not part of the night. The prep list buys for
 * the three field day games she picked and not for the two she did not,
 * without a line of this module knowing what a field day is.
 *
 * THE STATEMENT, AS A TEMPLATE AND THE THREE NAMES IT NEEDS.
 *
 * Separated from the write so that the composition can be driven by a test on
 * a machine with no database — `npm test` has none, and the shape of this
 * statement is exactly what a second pool would get wrong (CLAUDE.md rule 21's
 * last paragraph: seed the case, drive the surface the way production drives
 * it).
 *
 * Null for anything the registry does not issue.
 *
 * THE `case` IS THE WHOLE OF "AN OR, NOT AN AND": every row of the offer is
 * set in one pass, the pressed card to `now()` and its siblings to null, so
 * there is no instant at which two are chosen and none at which none is.
 */
export function chooseStatement(
  pool: string
): { template: string; identifiers: string[] } | null {
  const entity = tablesFor(pool);
  if (!entity?.joinTable) return null;

  const idColumn = idColumnFor(entity.pool as EntityTable);

  return {
    template:
      "update %I j" +
      // THE WHOLE OF BOTH RULES, IN ONE EXPRESSION.
      //
      // An exclusive offer is set in one pass — the pressed card to now() and
      // its siblings to null — so there is no instant at which two are chosen
      // and none at which none is. That was db/061's argument and it is
      // unchanged.
      //
      // A non-exclusive offer TOUCHES ONLY THE CARD SHE PRESSED, and toggles
      // it: pressing an unchosen card takes it, pressing a chosen one puts it
      // back. `else j.chosen_at` is load-bearing — without it every sibling
      // would be rewritten to its own value, which is harmless today and is
      // exactly the line somebody edits into `null` while "simplifying".
      " set chosen_at = case" +
      "   when j.offer_exclusive" +
      "     then case when t.slug = $4 then now() else null end" +
      "   when t.slug = $4" +
      "     then case when j.chosen_at is null then now() else null end" +
      "   else j.chosen_at end," +
      // AND UNTAKING A CARD UNSCHEDULES IT. The schema refuses a run_day on a
      // row with no chosen_at, so this is not a nicety: without it the toggle
      // would fail the constraint on the way out and a host correcting herself
      // would meet an error. Rule 18 — nothing may punish a correction.
      "   run_day = case" +
      "     when t.slug = $4 and j.chosen_at is not null then null" +
      "     else j.run_day end" +
      " from %I t, revelle r" +
      " where t.id = j.%I" +
      " and r.id = j.revelle_id" +
      " and j.revelle_id = $2" +
      " and r.customer_id = $1" +
      " and r.status = any($5::revelle_status[])" +
      " and j.offer_group = $3" +
      " returning j.%I as entity_id, t.slug, j.chosen_at",
    identifiers: [entity.joinTable, entity.pool, idColumn, idColumn],
  };
}

/**
 * WHICH DAY SHE IS RUNNING IT ON — db/069.
 *
 * Separate from `chooseStatement` because it answers a different question and
 * because bundling them would make every choice a scheduling decision: she may
 * take a game today and say nothing about which afternoon it belongs on, and
 * `run_day` null means exactly that rather than "day one".
 *
 * The schema refuses a day on a card she has not taken, so this can only ever
 * move a day around inside what she is already running. `$4` is the slug and
 * `$6` the day, null to unschedule.
 */
export function scheduleStatement(
  pool: string
): { template: string; identifiers: string[] } | null {
  const entity = tablesFor(pool);
  if (!entity?.joinTable) return null;

  const idColumn = idColumnFor(entity.pool as EntityTable);

  return {
    template:
      "update %I j" +
      " set run_day = $6::integer" +
      " from %I t, revelle r" +
      " where t.id = j.%I" +
      " and r.id = j.revelle_id" +
      " and j.revelle_id = $2" +
      " and r.customer_id = $1" +
      " and r.status = any($5::revelle_status[])" +
      " and j.offer_group = $3" +
      " and t.slug = $4" +
      // ONLY WHAT SHE IS RUNNING. The database says the same thing and would
      // raise; saying it here too means the statement matches no row and the
      // caller rolls back silently, which is the right answer for a member who
      // has pressed a day on a card she has not taken.
      " and j.chosen_at is not null" +
      " returning j.%I as entity_id, t.slug, j.run_day",
    identifiers: [entity.joinTable, entity.pool, idColumn, idColumn],
  };
}

/* ── the carousel, as the page reads it ─────────────────────────────── */

export type OfferCard = {
  /** The pool row. `slug` is what the choose action names. */
  slug: string;
  name: string;
  description: string;
  pool: string;
  /**
   * True for a card she has taken. AT MOST ONE IS TRUE IN AN EXCLUSIVE OFFER
   * and any number may be true in a set — read `Offer.exclusive` before
   * assuming which, because db/069 made both real.
   */
  chosen: boolean;
  /**
   * db/069. Which day she has put it on, 1-based, or null for she has not
   * said. Only ever set on a chosen card, and only meaningful on an occasion
   * that has more than one day.
   */
  runDay: number | null;
};

export type Offer = {
  /** `occasion_slot`'s beat key — 'game:1:0'. Stable, and the form's handle. */
  group: string;
  /**
   * WHICH POOL THE BEAT DRAWS — 'game', 'dish'.
   *
   * A property of the OFFER and not of a card, because `occasion_slot.pool` is
   * one column: a beat draws one pool and every card in it came out of that
   * pool. It is carried here so the page can say the true thing about what she
   * is choosing between — a game runs, a course is eaten — and so the write
   * knows which join table holds her choice (db/062).
   */
  pool: string;
  /** The beat's own name, from slot_kind. "The fun". "The main course". */
  heading: string;
  /** In delivery order, always. See rule 18 above. */
  cards: OfferCard[];
  /**
   * WHAT KIND OF OFFER — db/069.
   *
   * True is db/061's carousel: three cards, one runs, taking one puts the
   * others back. False is a SET: all of them were delivered and she runs any
   * non-empty subset, each on a day of its own. "Field day games include all
   * and she chooses."
   *
   * A property of the OFFER and not of a card, because the rule is stamped on
   * every row of the group from one `occasion_slot.offer_rule` — and READ from
   * the rows rather than inferred from how many there are, since a room with
   * two field day games would otherwise read as a two-card carousel.
   */
  exclusive: boolean;
  /**
   * True once she has taken one of them.
   *
   * The same sentence for both kinds, deliberately: an offer she has acted on
   * is settled, and one she has not is a beat still waiting for her. It does
   * NOT mean "finished" for a set — she may take a fourth game tomorrow — and
   * nothing downstream reads it that way; `isSettled` is per card.
   */
  settled: boolean;
};

/**
 * One thing she reads, in the order she reads it: a piece the house placed, or
 * a beat she chooses in.
 */
export type Entry =
  | { kind: "piece"; piece: MemberPiece }
  | { kind: "offer"; offer: Offer };

/* ── the line above the cards ───────────────────────────────────────── */

/**
 * WHAT SHE READS ABOVE A CAROUSEL — one owner, two surfaces.
 *
 * Her occasion page renders it and so does the desk's preview of her occasion
 * page, and the preview exists precisely so that staff can see WHAT SHE SEES.
 * Two copies of this sentence would make the preview a page about a different
 * product the day either was edited (CLAUDE.md rule 21).
 *
 * ── RULE 10 IS THE TEST FOR EVERY WORD OF IT ────────────────────────
 *
 * Does the line credit her, or credit us? "The one you pick is the one that
 * runs" credits her. Anything about how these cards were found — matched,
 * scored, chosen for her, narrowed from a catalogue — credits the house and is
 * not written. Offering a choice is the instrument working; describing the
 * work behind the offer turns it back into a service she is a customer of.
 *
 * IT DOES NOT SAY HOW MANY WERE POSSIBLE. Two cards say "two to choose
 * between", never "only two fit" and never "two of three". A room with two
 * desserts has two desserts; the count is a fact and the apology would be the
 * house describing its own catalogue to her, which is house business.
 *
 * ── AND THE VERB IS THE BEAT'S OWN ──────────────────────────────────
 *
 * A game RUNS. A course is one she SERVES. Both put her at the centre of the
 * act. The fallback is deliberately the flattest true thing rather than a
 * guess at a third pool's verb: a pool that starts offering a choice and reads
 * "happens" has a line that is correct and dull, which is the right failure —
 * inventing "the one you pick is the one that's poured" for a pool nobody has
 * ruled on would be the house authoring her evening (rule 32).
 */
export function offerLead(offer: Offer): string {
  const count = inWords(offer.cards.length);
  const many = `${count.charAt(0).toUpperCase()}${count.slice(1)}`;

  // A SET IS NOT A CAROUSEL AND MUST NOT BE DESCRIBED AS ONE — db/069.
  //
  // "Three to choose between. The one you pick is the one that runs" is true
  // of a carousel and false of a field day, and a member reading it would
  // reasonably believe that taking the rope put the sack race back. That is
  // rule 16's shape in copy rather than in code: the page would be telling her
  // the mechanism does something it does not.
  //
  // The line credits her either way (rule 10). It says what is hers to decide,
  // never what the house has done.
  if (!offer.exclusive) {
    const opening = `${many}, and they are all yours.`;
    if (offer.settled) {
      return `${opening} Run as many as you want, on whichever days you want.`;
    }
    return `${opening} Take the ones you want and leave the rest.`;
  }

  const opening = `${many} to choose between.`;
  if (offer.settled) return `${opening} Change your mind whenever you like.`;

  switch (offer.pool) {
    case "game":
      return `${opening} The one you pick is the one that runs.`;
    case "dish":
      return `${opening} The one you pick is the one you serve.`;
    default:
      return `${opening} The one you pick is the one that happens.`;
  }
}

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
        pool: siblings[0].pool,
        heading: siblings[0].heading,
        cards: siblings.map((member) => ({
          slug: member.slug,
          name: member.name,
          description: member.description,
          pool: member.pool,
          chosen: member.chosen,
          runDay: member.runDay,
        })),
        // READ OFF THE ROWS, NEVER COUNTED. Every card of a group carries the
        // same stamp, so the first one answers for all of them; `?? true` is
        // for a Revelle delivered before db/069, whose offers were all
        // carousels and whose rows carry null. That is not a guess — it is
        // what every offer made before that migration was.
        exclusive: siblings[0].offerExclusive ?? true,
        settled: siblings.some((member) => member.chosen),
      },
    });
  }

  return entries;
}
