/**
 * WHICH ITEMS CAN FILL SLOT Y FOR ROOM X — asked once, by both surfaces.
 *
 * ── WHY THIS FILE EXISTS ─────────────────────────────────────────────
 *
 * Two things in this codebase now answer "does room X have slot Y covered":
 * the engine's gap reporter (`scopePools` in ./fill.ts, which files a
 * `CatalogueGap` when a slot's candidate list comes back empty) and the desk's
 * coverage board (src/lib/desk/coverage.ts, which colours a cell). The founder,
 * on the day the second one was built:
 *
 *   "If each writes its own query, they'll drift, and the failure mode is
 *    exquisite: the board shows a gap the reporter doesn't fire on, or vice
 *    versa, and someone spends a day discovering that 'coverage' means two
 *    different things in two files. One exported function, both consumers.
 *    That's the registry lesson applied to logic instead of lists."
 *
 * Rule 19 is about hand-written lists of pools. This is the same lesson one
 * level up: a hand-written *rule*, restated in a second file, is correct
 * exactly until one of the two is edited — and then it is wrong without being
 * broken, which is the dangerous half.
 *
 * ── WHAT IS SHARED, AND WHAT HONESTLY CANNOT BE ──────────────────────
 *
 * Said precisely, because "one function, both consumers" is easy to claim and
 * easy to fake. `scopePools` runs SIX filters over an ingredient before it
 * decides a slot is unfillable:
 *
 *   the destination   \  CATALOGUE FACTS. Properties of the row itself. True
 *   the slot          /  before any host applies, and the same for everybody.
 *
 *   her dealbreakers  \  APPLICANT FACTS. Properties of ONE evening — what she
 *   the venue         |  vetoed, the room she is standing in, the month, the
 *   the season        |  shape of the meal, how many are coming. Every one of
 *   the meal shape    |  them can only ever REMOVE candidates.
 *   the group size    /
 *
 * A coverage board has no applicant, so it can only ever ask the first two.
 * That is not a weaker version of the reporter's question — it is the exact
 * subset of it that is answerable without a host, and the containment runs one
 * way and is worth stating as an invariant:
 *
 *   IF THIS MODULE SAYS ZERO, THE REPORTER FIRES A GAP FOR THAT SLOT, ALWAYS.
 *   If this module says some, the reporter may still fire — because of her,
 *   not because of the catalogue. That is an applicant, not a divergence.
 *
 * So the shared artifact is the two catalogue axes, taken together, as one
 * named question. `scopePools` calls `placement()` once per ingredient and
 * consumes its two halves at the two points in its chain where they have
 * always been consumed — the destination first, at rank 0, and the slot last,
 * at rank 2 — so the ranked sentences a curator reads are unchanged to the
 * character. The board calls `claimsForSlot()` and `itemsForRoom()`, which are
 * thin wrappers over the same call. Neither consumer owns a copy of the rule.
 *
 * src/lib/selection/slot-coverage.test.ts is the guard: it drives `scopePools`
 * and this module over the same fixtures and fails if their verdicts ever part
 * company.
 *
 * ── THE THIRD STATE THIS SHAPE DOES NOT YET CARRY ────────────────────
 *
 * Written down before it is needed, because the next consumer is known: a
 * take-home whose supply is a slot-plus-predicate dependency — "did whatever
 * filled `the_main` carry a `yields_shell` tag". That resolves at COMPOSITION
 * time and is CONDITIONAL coverage: a fact about one package, not about the
 * room. A board must be able to show it as neither covered nor uncovered.
 *
 * `Placement` cannot express it today, and saying exactly what it would take
 * is more useful than pretending otherwise:
 *
 *   1. `Placement` grows a third member beside `world` and `slot` — call it
 *      `supply` — carrying its own verdict and its own sentence, exactly as
 *      those two do. The type is already a RECORD OF PER-AXIS VERDICTS rather
 *      than a boolean, which is why this is an addition and not a rewrite.
 *   2. The rollup on the last line of `placement()` stops being an `&&`. It
 *      becomes three-valued: uncovered if either catalogue axis refuses,
 *      conditional if both pass and the supply axis is unresolved, covered
 *      otherwise. ONE LINE, ONE PLACE, which is the whole point of both
 *      consumers going through here.
 *   3. `Cell.state` in src/lib/desk/coverage.ts gains a fourth member and the
 *      page a fourth stripe colour. That is a real design decision and not a
 *      mechanical one — a conditional cell must not read as either a pass or a
 *      failure — so it belongs to whoever ships the dependency.
 *
 * What must NOT happen is the dependency being answered in a fourth place.
 * Three surfaces already ask this question; the reason they agree is that they
 * ask it here.
 *
 * ── FRAMEWORK-FREE, LIKE ITS NEIGHBOURS ──────────────────────────────
 *
 * No React, no `server-only`, no `@/` alias — the same rule src/lib/portal/
 * picks.ts keeps, and here it buys the same thing: the desk imports it through
 * Next and `node --test` imports it directly, and the drift test can therefore
 * run on every `npm test` with no database at all.
 */

import {
  slotEligibility,
  worldEligibility,
  type EligibilityVerdict,
} from "./occasion.ts";
import type { SlotClaim, WorldScope } from "./types.ts";

/**
 * THE CATALOGUE FACTS AN ITEM CARRIES ABOUT WHERE IT MAY BE PLACED.
 *
 * Structural rather than nominal on purpose: `Ingredient` (./types.ts, what
 * the engine loads) and the desk board's own row shape both satisfy it without
 * either being converted into the other. Widening this type would silently
 * demand a conversion at one of the two call sites, which is how a shared
 * function quietly becomes two.
 */
export type Placeable = {
  readonly worlds: Readonly<Record<string, WorldScope>>;
  readonly slots: readonly SlotClaim[];
};

/** The two catalogue verdicts, kept apart so each keeps its own sentence. */
export type Placement = {
  /** db/019's destination axis. Rank 0 in a gap: a structural impossibility. */
  world: EligibilityVerdict;
  /** db/009's slot axis. Rank 2: real, but not the first thing to read. */
  slot: EligibilityVerdict;
  /** Both. The only thing a board without an applicant can assert. */
  eligible: boolean;
};

/**
 * CAN THIS ITEM BE PLACED IN THIS SLOT, IN THIS ROOM, BY THE CATALOGUE ALONE.
 *
 * The rule is not restated here and never will be: `worldEligibility` and
 * `slotEligibility` are the engine's own, from ./occasion.ts, and this function
 * is the statement that COVERAGE MEANS BOTH OF THEM AND NOTHING ELSE. That
 * sentence is the thing that was in two files.
 *
 * Both halves are returned rather than collapsed, because the reporter needs
 * them separately — a destination refusal and a slot refusal are different
 * sentences at different ranks in the gap a curator reads — and a function that
 * returned only the boolean would have forced `scopePools` to keep its own two
 * calls, which is the drift this file exists to prevent.
 */
export function placement(
  item: Placeable,
  worldId: string,
  /** The destination being scoped to, by name, for the sentence. */
  here: string,
  slotCode: string
): Placement {
  const world = worldEligibility(item.worlds, worldId, here);
  const slot = slotEligibility(item.slots, slotCode);
  return { world, slot, eligible: world.eligible && slot.eligible };
}

/**
 * EVERY ITEM THAT CAN FILL ONE SLOT IN ONE ROOM — the board's per-cell basis.
 *
 * CLAIMS, NOT DISTINCT ITEMS, and the founder settled which:
 *
 *   "Per-slot cells should count claims — 'how many items can fill this slot
 *    for this room' is the operationally relevant number, because that's what
 *    selection draws from. Your rock legitimately counts in two cells; that's
 *    not double-counting, it's the truth about the rock."
 *
 * So the four returns of this function over four slot codes may overlap, and
 * summing them is meaningless. `itemsForRoom` below is the basis for anything
 * that needs a total, and the two are labelled on the board so that the
 * arithmetic not adding up is a readable fact rather than a suspected bug.
 */
export function claimsForSlot<T extends Placeable>(
  items: readonly T[],
  worldId: string,
  here: string,
  slotCode: string
): T[] {
  return items.filter((item) => placement(item, worldId, here, slotCode).eligible);
}

/**
 * EVERY ITEM THIS ROOM CAN DRAW ON AT ALL — the board's total basis.
 *
 * DISTINCT ITEMS. An item eligible for two of the four slots is one item here
 * and two claims above, which is why `itemsForRoom(...).length` is normally
 * SMALLER than the sum of the per-slot cells beside it. That gap is correct
 * output and the board says which basis each number is on.
 *
 * `slotCodes` is required rather than defaulted to "any slot": an item's
 * `native` slot claims are a whitelist (claimEligibility, ./occasion.ts), and a
 * row claiming only a slot this pool is never drawn into is not something the
 * room can draw on. The codes come from `occasion_slot` at the call site, never
 * from a list written here — rule 19.
 */
export function itemsForRoom<T extends Placeable>(
  items: readonly T[],
  worldId: string,
  here: string,
  slotCodes: readonly string[]
): T[] {
  return items.filter((item) =>
    slotCodes.some((code) => placement(item, worldId, here, code).eligible)
  );
}
