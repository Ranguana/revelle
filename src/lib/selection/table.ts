/**
 * THE COMPOSED TABLE — the rules that stand in for an author.
 *
 * db/022 retired the set menu as the unit of selection. A table is now an
 * appetizer, a main and a dessert drawn separately from the dish pool, and the
 * founder's sentence is the whole brief:
 *
 *     "They have to be mix and match with all this data."
 *     "Set menus cannot be the model."
 *
 * A composed table has no author, and everything else in this system is
 * authored. So the rules below are not conveniences — they are the entire
 * substitute for a person, they are small, and their smallness is stated in
 * db/022 under WHAT COMPOSITION LOSES rather than hidden here.
 *
 * ── WHY THIS IS ITS OWN FILE ────────────────────────────────────────
 *
 * Because it is a set of JUDGEMENTS about food, and fill.ts is a beam search.
 * The search knows how to carry a constraint across picks — it already does it
 * for the budget and for the evening's blocks — and it should not also know
 * that high summer is inside summer or that a made dish can be bought and a
 * bought one cannot be made. Two of the three functions here are one-line
 * lookups over a ladder; the argument for the ladder is the file.
 *
 * Nothing here reads a database, and nothing here is pool-specific: a
 * "coherence group" is whatever slot_kind.coherence_group says it is, and the
 * three courses are its only members today.
 */

import type { Ingredient, UnitSlot } from "./types.ts";

/**
 * What one coherence group has committed to, so far, in one search state.
 *
 * Both start null and are narrowed, never widened. A group that has placed
 * nothing constrains nothing; a group that has placed one bound dish
 * constrains everything after it.
 */
export type TableCommitment = {
  /** season_band, or null for "nothing placed here has bound the calendar". */
  season: string | null;
  /** making_level, or null for "no rung is settled yet". */
  making: string | null;
};

/**
 * THE MAKING LADDER, IN ASCENDING ORDER OF WORK.
 *
 * db/016's `making_level` and db/012's `cooking_level` have the same members
 * because they are one axis under two names (db/017 argues it). `mostly_made`
 * is retired — it stays in both enums forever so stored rows keep resolving —
 * and it is deliberately NOT in this ladder: no live row carries it after a
 * re-seed, and giving a retired value a rung would put it in the fallback order
 * for six hundred dishes that will never use it.
 */
const LADDER = ["bought_and_arranged", "half_made", "actually_made"] as const;

/**
 * THE RUNGS A COURSE MAY USE, best first, when the table sits at `rung`.
 *
 * The table's own rung comes first and is what almost every course gets. The
 * rest of the order is the fallback, and it leans one way for a reason that is
 * in the catalogue rather than in anybody's taste:
 *
 *   THE CATALOGUE DOCUMENTS HOW MADE THINGS BEND TOWARD BOUGHT AND NEVER THE
 *   REVERSE. Every escape hatch docs/menus.md ever carried ran one way —
 *   "lobster meat can be bought picked", "chicken can be bought rotisserie",
 *   "good jarred fish soup exists" — and db/012 says outright that a member can
 *   cook or she can order. A host handed one course more made than she asked
 *   for can order it. A host handed something bought when she wanted to cook
 *   cannot un-buy it.
 *
 * So the order is: her rung, then upward toward `actually_made`, then downward
 * toward `bought_and_arranged`. From the top rung there is no upward, so it
 * falls straight down — which is the same rule, not an exception to it.
 *
 * This exists because most destinations have no main course that can be bought
 * (db/021 counts them). The figure was nine of thirteen when this was written
 * and has not been re-counted since CAP FERRAT was folded into CÔTE D'AZUR. Without a fallback, a host who wants
 * no work gets a table with no main in it, and a missing main is worse than a
 * main one rung off.
 */
export function rungPreference(rung: string): string[] {
  const at = LADDER.indexOf(rung as (typeof LADDER)[number]);
  if (at < 0) return [];
  const order = [rung];
  for (let i = at + 1; i < LADDER.length; i += 1) order.push(LADDER[i]);
  for (let i = at - 1; i >= 0; i -= 1) order.push(LADDER[i]);
  return order;
}

/**
 * HER ANSWER TO `how_made`, AS A RUNG — or null when she did not answer.
 *
 * Read from the resolved answers rather than from the preference vector,
 * because the vector deliberately loses it: db/017 set the middle of the axis
 * to weight 0 and vector.ts adds no term for a zero, so "she asked for the
 * middle" and "she said nothing" are the same shape in the vector and are very
 * different facts here.
 *
 * ── AND THIS IS NOT HER ANSWER BECOMING A FILTER ────────────────────
 *
 * db/012 and db/016 both forbid her answer ELIMINATING an ingredient, at
 * length, and it still does not. Every dish is in the pool at every rung and is
 * scored by weight exactly as before. What this seeds is the table's INTERNAL
 * agreement: the rule is not "she wants bought, so this made dish is gone", it
 * is "these three are not one table". The same dish is placed happily on the
 * next table that sits at its rung.
 */
export function statedRung(
  stated: readonly { field: string; weight: number }[]
): string | null {
  const answer = stated.find((entry) => entry.field === "how_made");
  if (!answer) return null;
  // db/016's bridge, read backwards: +1 actually made, 0 half made (db/017
  // moved it to the centre), −1 bought and arranged. A legacy `mostly_made`
  // answer sits at +0.4 and resolves to the rung above the centre, which is
  // where it was authored.
  if (answer.weight > 0) return "actually_made";
  if (answer.weight < 0) return "bought_and_arranged";
  return "half_made";
}

/**
 * SEASONS THAT CAN SIT AT ONE TABLE.
 *
 * `year_round` is not a season, it is the absence of a claim — db/012's own
 * gloss is "Makes no claim about the calendar" — so it agrees with everything
 * and commits nothing. 502 of the 600 dishes are that, which is why the rule
 * bites rarely and correctly.
 *
 * Two bound dishes agree when one band CONTAINS the other:
 *
 *   summer ⊃ high_summer    high summer is August and August is summer
 *   shoulder ⊃ spring       db/012: "Shoulder season. Spring or autumn."
 *   shoulder ⊃ autumn
 *
 * Everything else that differs conflicts. A summer dish beside a winter dish is
 * the case the founder named, and it is refused.
 */
const CONTAINS: Readonly<Record<string, readonly string[]>> = {
  summer: ["high_summer"],
  shoulder: ["spring", "autumn"],
};

function contains(wide: string, narrow: string): boolean {
  return (CONTAINS[wide] ?? []).includes(narrow);
}

/** Does this dish's season fit what the table has already committed to? */
export function seasonAgrees(
  committed: string | null,
  candidate: string | null | undefined
): boolean {
  if (!candidate || candidate === "year_round") return true;
  if (!committed || committed === "year_round") return true;
  if (committed === candidate) return true;
  return contains(committed, candidate) || contains(candidate, committed);
}

/**
 * HER MONTH'S SEASON — or null when the calendar is not settled.
 *
 * Read off the resolved answers rather than computed, exactly as `statedRung`
 * is, and for a stronger version of the same reason: db/026's bridge is the one
 * place in the system that says which season a month is in. Twelve rows, one
 * per month, joined to the `season` facets db/012 already authored. Nothing in
 * this directory knows that August is high summer, and nothing should.
 *
 * NULL IS REACHABLE THREE WAYS AND MEANS ONE THING. She answered "still
 * deciding" (which resolves to an inert `event_timing` facet, not a season);
 * she applied before the question existed; or a snapshot was built by hand.
 * All three mean the calendar says nothing, and everything downstream treats
 * that as today's behaviour — season weights nothing, excludes nothing.
 */
export function statedSeason(
  stated: readonly { field: string; dimension: string; code: string }[]
): string | null {
  const answer = stated.find(
    (entry) => entry.field === "event_month" && entry.dimension === "season"
  );
  return answer ? answer.code : null;
}

/**
 * IS THIS THING IN SEASON ON HER CALENDAR — and this is NOT `seasonAgrees`.
 *
 * The two questions look alike and are not the same, and collapsing them would
 * be wrong in one direction and invisible:
 *
 *   seasonAgrees  CAN THESE TWO SIT AT ONE TABLE. Symmetric, because it is
 *                 asked of two dishes and neither outranks the other. A summer
 *                 dish and a high-summer dish are one table either way round.
 *   inSeason      IS THIS DISH'S BAND OPEN ON HER DATE. DIRECTIONAL, because
 *                 her month is a point and the dish's band is a set. August is
 *                 inside summer, so a summer dish is in season in August. June
 *                 is NOT inside high summer, so a dish written for August only
 *                 is out of season in June — and the symmetric test would have
 *                 let it through.
 *
 * One ladder underneath both, so "high summer is inside summer" is written once.
 *
 * ── THE TWO ABSENCES, AND BOTH MEAN YES ─────────────────────────────
 *
 * A candidate with no band, or `year_round`, makes no claim about the calendar
 * (db/012's own gloss) and is in season always. A HOST with no month has not
 * made a claim either, and nothing may be refused on a fact nobody stated —
 * which is what makes "still deciding" a route through this rather than a
 * degraded version of an answer.
 */
export function inSeason(
  /** Her season, from statedSeason(). Null when the calendar is not settled. */
  here: string | null,
  candidate: string | null | undefined
): boolean {
  if (!candidate || candidate === "year_round") return true;
  if (!here) return true;
  if (candidate === here) return true;
  // Her season must be INSIDE the candidate's band, never the other way round.
  return contains(candidate, here);
}

/**
 * The table's season after this dish joins it — NARROWED, never widened.
 *
 * Summer plus high summer is high summer, so that a third course bound to
 * spring is refused rather than let in on the strength of the wider of the two
 * bands. A commitment that could widen would let a table drift a season at a
 * time, which is the failure this whole rule exists to prevent.
 */
export function narrowSeason(
  committed: string | null,
  candidate: string | null | undefined
): string | null {
  if (!candidate || candidate === "year_round") return committed;
  if (!committed || committed === "year_round") return candidate;
  if (contains(committed, candidate)) return candidate;
  return committed;
}

/**
 * Which coherence group this slot belongs to, or null.
 *
 * A function rather than a property read at every call site so that "no group"
 * has one spelling: `slot_kind.coherence_group` is nullable in the database and
 * optional on the type (a hand-built fixture may omit it), and absent and null
 * mean the same thing — this slot answers to nobody.
 */
export function groupOf(slot: UnitSlot): string | null {
  return slot.coherenceGroup ?? null;
}

/**
 * HER `meal_time` ANSWER — or null when she was not asked, or not yet.
 *
 * Read off the resolved answers, like `statedRung` and `statedSeason`, so that
 * the option code arrives through db/026's bridge rather than out of a raw
 * column somebody has to remember to cast.
 *
 * IT IS NOW ASKED OF EVERYONE, AND THIS FUNCTION DID NOT CHANGE. db/037 took
 * the `activeWhen` gate off the question and reworded it as a start hour, so
 * the four codes now arrive from hosts who have no table at all. The dimension
 * filter below is what makes that safe: this reads the `meal_shape` resolution
 * of her answer and nothing else, and `mealShape()` immediately below decides
 * whether that shape is what the evening actually is. The same answer's OTHER
 * resolution — onto the matrix's `starts` levels — is read by
 * src/lib/selection/structure.ts and never reaches this file.
 */
export function statedMeal(
  stated: readonly { field: string; dimension: string; code: string }[]
): string | null {
  const answer = stated.find(
    (entry) => entry.field === "meal_time" && entry.dimension === "meal_shape"
  );
  return answer ? answer.code : null;
}

/**
 * WHAT KIND OF TABLE THIS EVENING IS — db/023's `meal_shape`, in one place.
 *
 * db/023 said this would be "one more branch HERE and nowhere else" when the
 * question existed. It exists (db/026), and this is the branch.
 *
 * THE ORDER OF THE THREE IS THE ARGUMENT.
 *
 *   1. `no_seated_meal` WINS, and it is not a tie being broken. That exclusion
 *      is what db/022 hangs off `food_plan = 'standing'` — the very same answer
 *      that removes the main and the dessert is the answer that makes it a
 *      cocktail party.
 *
 *      THIS BRANCH IS NOW LOAD-BEARING RATHER THAN DEFENSIVE, and the change is
 *      worth stating because the reasoning it replaces is still correct as far
 *      as it went. It read: "A host cannot be shown the meal question at all in
 *      that case (src/lib/quiz.ts holds it to a seated food plan), so this can
 *      only ever fire against a stale answer or a hand-rolled one, and it fires
 *      against them correctly: there is no table, so it is not a lunch." Every
 *      word of that was true while the gate existed. db/037 removed the gate —
 *      the question is now the START HOUR and is asked of everyone, because a
 *      standing party has an hour and had no way to say so — and this branch is
 *      what keeps the old promise once the question no longer keeps it itself.
 *      A cocktail party at midday now states `lunch`, and this returns
 *      `cocktails` anyway. There is no table, so it is not a lunch.
 *   2. HER ANSWER, when she gave one. Four of the five shapes are hers, and
 *      until db/026 three of them were unreachable — which meant a dish tagged
 *      for brunch was not narrowed to brunch, it was removed from every table
 *      the engine could set.
 *   3. `long_dinner`, for a response written before the question existed. It is
 *      the fallback db/023 already used for everything that was not standing,
 *      so an old application behaves today exactly as it did yesterday.
 */
export function mealShape(
  exclusions: readonly string[],
  /** Her answer, from statedMeal(). Null when she was not asked. */
  chosen: string | null = null
): string {
  if (exclusions.includes("no_seated_meal")) return "cocktails";
  return chosen ?? "long_dinner";
}

/**
 * Is this ingredient right for the kind of table this evening is?
 *
 * NO CLAIMS AT ALL MEANS EVERY SHAPE. That is claimEligibility()'s own rule
 * (occasion.ts) for the three axes it governs, and this is the same rule for a
 * fourth — written here rather than as a fourth caller of that function because
 * `dish_meal` has no `forbidden` half to resolve, which is two thirds of what
 * claimEligibility does. db/023 argues why it has none.
 */
export function mealAgrees(
  meals: readonly string[] | undefined,
  evening: string
): boolean {
  if (!meals || meals.length === 0) return true;
  return meals.includes(evening);
}

/**
 * A season band as a phrase, for a sentence a curator reads.
 *
 * `humanOccasion`'s sibling and in this file rather than beside it, because the
 * season vocabulary lives here. The only two that need saying are the ones with
 * an underscore in them; everything else is already a word, and a switch listing
 * all seven would be five lines that say `return band`.
 */
export function humanSeason(band: string | null | undefined): string {
  if (!band) return "any season";
  if (band === "high_summer") return "high summer";
  if (band === "year_round") return "any season";
  return band;
}

/** The two axes a table has to agree on, off one ingredient. */
export function axesOf(ingredient: Ingredient): {
  season: string | null;
  making: string | null;
} {
  return {
    season: ingredient.season ?? null,
    making: ingredient.making ?? null,
  };
}
