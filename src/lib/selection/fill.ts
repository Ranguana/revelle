/**
 * STAGE 3 — scope every pool to the chosen destination.
 * STAGE 4 — fill the slots, most-constrained first, with the budget carried.
 *
 * ── SCOPING (stage 3) ────────────────────────────────────────────────
 *
 * Three mechanisms, all borrowed from generators that have shipped:
 *
 *   forbidden   structural. The ingredient is not in the pool under this
 *               destination, at any score.
 *   re-weighted the same thing may be common in one destination and rare in
 *               another. Signed −1..1, added to the score.
 *   inherited   the destination's own facets join her preference vector before
 *               anything is scored. Handled in vector.ts, because it is a
 *               property of the vector rather than of the pool.
 *
 * And a fourth, which the spec assumed and the schema did not have until
 * db/019: a NATIVE CLAIM. "Havana's daiquiris are not an option at the
 * Dolomites" (docs/drinks.md) is not a low score either — an ingredient written
 * FOR a destination is eligible under the ones it claims and nowhere else. The
 * rule is claimEligibility() in occasion.ts, over all three axes, once.
 *
 * ── THE SEARCH (stage 4) ─────────────────────────────────────────────
 *
 * A beam search. Not an optimiser: the spec's fourth principle is sampling, not
 * optimisation — we need one valid, tasteful, novel set, quickly, and that
 * reframe is exactly what rules out a constraint solver.
 *
 *     score = facet match
 *           + destination affinity
 *           − issuance penalty            (spread across customers)
 *           − similarity to already-chosen (spread within the set)
 *
 * MOST-CONSTRAINED SLOT FIRST. The slot with three eligible ingredients is
 * decided before the one with forty, because deciding it late means discovering
 * at the end that the two things that could have filled it are both already
 * placed somewhere else.
 *
 * ── THE BUDGET IS CARRIED, NOT CHECKED AT THE END ────────────────────
 *
 * Two numbers, and the difference between them is the slack the search is
 * allowed to spend:
 *
 *   budget_planning   what to build to. Optional slots are bounded by it.
 *   budget_ceiling    what must not be exceeded. Required slots are bounded by
 *                     it, and it is the running bound on every state.
 *
 * A LOOKAHEAD keeps the two honest. Before any pick is accepted, the cheapest
 * possible completion of the remaining REQUIRED slots is added to the running
 * cost. Without it, a search that fills the cheap optional slots first happily
 * spends the ceiling and then discovers it cannot afford the soundtrack — and
 * the fix would be to re-order the slots, which would sacrifice the
 * most-constrained-first rule to a bookkeeping problem.
 *
 * Both numbers may be NULL, and null means ask her, never no limit. A candidate
 * built against a null ceiling is one the curator must price by hand, and stage
 * 6 says so.
 *
 * ── THE EVENING'S BLOCKS ARE CARRIED THE SAME WAY ────────────────────
 *
 * db/010 gives a game a SHAPE and an occasion a number of blocks
 * (occasion_shape.scheduled_game_max: one for a long dinner, two for a
 * birthday, three for a weekend). A birthday has three slots that all draw
 * from the game pool, and with nothing to stop it the search will fill all
 * three with scheduled games and hand a host two and a quarter hours of
 * programming with a dinner somewhere inside it.
 *
 * So the count is carried on the state, exactly like the money, and it binds
 * DURING the search rather than being reported afterwards by
 * revelle_game_load. Two things cannot occupy the same hour: a fourth
 * scheduled game is not a weak candidate, it is an impossibility, and the
 * budget's own lesson applies — a rule checked at the end is a rule that
 * produces a set nobody can use.
 *
 * AMBIENT AND FINALE GAMES DO NOT COUNT. That distinction is the entire point
 * of the shape column. Three games in one evening is fine when one runs
 * underneath it and one is the ending; three scheduled games at a dinner party
 * is not.
 *
 * When the cap binds the extra game is simply NOT PLACED. Per member.ts, that
 * is invisible to her — the deliverable does not exist in her Revelle, and no
 * heading is printed over an empty body.
 *
 * ── AND THE TABLE HAS TO AGREE WITH ITSELF ───────────────────────────
 *
 * db/022 made the table a COMPOSITION: an appetizer, a main and a dessert, each
 * picked separately from the dish pool. Three independent picks are three
 * independent answers, and a table that is summer at one end and winter at the
 * other — or two-thirds bought and one-third actually made — is not an evening.
 *
 * So a third thing is carried on the state beside the money and the blocks: for
 * each `slot_kind.coherence_group`, the season and the rung of the making axis
 * that group has committed to. Same class of rule as the other two — a property
 * of the SET rather than of any one ingredient — and enforced in the same place
 * for the same reason: a rule checked at the end is a rule that produces a set
 * nobody can use.
 *
 * The judgements themselves (which seasons contain which, which way the rung
 * falls back when a course has nothing at hers) are in table.ts. This file
 * carries them; it does not decide them.
 */

import { humanOccasion, occasionEligibility } from "./occasion.ts";
// THE TWO CATALOGUE AXES, ASKED THROUGH THE FUNCTION THE COVERAGE BOARD ALSO
// ASKS. This file used to call `worldEligibility` and `slotEligibility`
// directly; src/lib/desk/coverage.ts, built later, would have had to call them
// the same way and stay that way by hand. See ./slot-coverage.ts for the
// founder's ruling and for why only these two of the six filters below can be
// shared with a surface that has no applicant.
import { placement } from "./slot-coverage.ts";
import {
  chooseCourse,
  courseOption,
  type CourseChooser,
  type CourseOption,
} from "./compose.ts";
import {
  axesOf,
  groupOf,
  humanSeason,
  inSeason,
  mealAgrees,
  narrowSeason,
  rungPreference,
  seasonAgrees,
  type TableCommitment,
} from "./table.ts";
import { venueEligibility } from "./venue.ts";
import {
  facetOverlap,
  issuanceMultiplier,
  issuancePenalty,
  similarityDiscount,
} from "./score.ts";
import type {
  CatalogueGap,
  Destination,
  DroppedPick,
  EngineOptions,
  FacetTags,
  Ingredient,
  OccasionCode,
  OccasionShape,
  Pick,
  Scale,
  UnitSlot,
  Venue,
} from "./types.ts";

/** One ingredient, already scored against this destination and this customer. */
export type ScopedCandidate = {
  ingredient: Ingredient;
  facetMatch: number;
  affinity: number;
  issuanceMultiplier: number;
  /** facet match + destination affinity, before the two penalties. */
  base: number;
  unitCost: number | null;
};

export type SlotPool = {
  slot: UnitSlot;
  /** Best first. */
  candidates: ScopedCandidate[];
  /** Why the pool is empty, when it is. */
  gap: CatalogueGap | null;
  /**
   * WHAT THE ROOM REMOVED, by name. Empty in almost every pool.
   *
   * Carried so that stage 6 can tell a curator "the boil pot is not on the
   * table because there is no outdoors", which is the sentence that makes the
   * venue's job visible without letting it near the destination.
   */
  prunedByVenue: readonly string[];
};

/**
 * The composed table's context — see fillSlots.
 *
 * `chooser` is the seam described in compose.ts: rules narrow, a model chooses.
 * Absent means the deterministic answer, which is the best-scoring survivor and
 * is what the search would have taken anyway.
 */
export type TableContext = {
  /** Her `how_made` answer as a rung. Seeds every coherence group. */
  rung?: string | null;
  /**
   * HER MONTH'S SEASON — db/026. Seeds every coherence group, exactly as `rung`
   * does, and for the same reason: a table is set on one date.
   *
   * ── AND THIS IS STILL NOT HER ANSWER BECOMING A FILTER ─────────────
   *
   * The distinction table.ts draws about the rung holds here word for word.
   * Every dish is in the pool at every season and is scored by its season facet
   * exactly as before; what her month seeds is the table's INTERNAL agreement.
   * The rule is not "she is planning February, so this summer dish is gone" —
   * it is "a summer dish and a February evening are not one table", and the same
   * dish is placed happily on the next table that sits in its season.
   *
   * The pool-level gate above is a different rule with a different trigger: it
   * fires only where a curator wrote `season_strict`, which is her way of
   * saying this one is not a lean.
   *
   * Null — she is still deciding — seeds nothing, and every group starts where
   * it started before db/026: at whatever the first bound dish commits it to.
   */
  season?: string | null;
  /** db/023's meal_shape — what kind of table this evening is. */
  meal?: string | null;
  /** The destination's name, for the chooser's request. */
  destination?: string;
  /** Her authored menus for this destination, as prose, verbatim. */
  exemplars?: readonly string[];
  chooser?: CourseChooser | null;
};

export type Fill = {
  picks: Pick[];
  dropped: DroppedPick[];
  gaps: CatalogueGap[];
  /** cents */
  cost: number;
  score: number;
  pools: Map<string, SlotPool>;
  /** Slot order the search actually used, most-constrained first. */
  order: string[];
};

/**
 * STAGE 3. One pass over the catalogue per slot, producing the pool the search
 * will draw from — already filtered, already scored, already sorted.
 *
 * Everything here is a FILTER or a WEIGHT. Nothing is dropped for being a poor
 * match; a poor match is a low score and the search will decide.
 */
export function scopePools(
  slots: readonly UnitSlot[],
  ingredients: readonly Ingredient[],
  destination: Destination,
  occasion: OccasionCode,
  scopedVector: FacetTags,
  dealbreakers: readonly string[],
  facetLabel: (facetId: string) => string,
  scale: Scale,
  /** THE ROOM SHE IS ACTUALLY IN. Null when the house cannot resolve it. */
  venue: Venue | null,
  options: EngineOptions,
  now: Date,
  /**
   * WHAT KIND OF TABLE THIS EVENING IS — db/023's meal_shape, from
   * mealShape() in table.ts. Null for a caller that does not care, which every
   * fixture written before db/023 is.
   */
  meal: string | null = null,
  /**
   * HER MONTH'S SEASON — db/026, from statedSeason() in table.ts.
   *
   * Null means the calendar says nothing: she answered "still deciding", she
   * applied before the question existed, or the snapshot was built by hand.
   * Nothing is refused on a season in that case, which is what the parameter's
   * default already gives every caller written before this.
   */
  season: string | null = null
): Map<string, SlotPool> {
  const groupSize = scale.guestsHigh ?? scale.guestsPlanning ?? null;
  const pools = new Map<string, SlotPool>();
  /** Which slots the room emptied, for the sentence a curator reads. */
  const prunedBySlotCode = new Map<string, string[]>();

  // Filtering is per (pool, slot) and the filters do not depend on which unit
  // slot of a repeated slot we are on, so it is done once per slot_code.
  const bySlotCode = new Map<string, ScopedCandidate[]>();
  const gapBySlotCode = new Map<string, CatalogueGap | null>();

  for (const slot of slots) {
    if (bySlotCode.has(slot.slotCode)) continue;

    // Ranked, because a catalogue gap is only useful if the FIRST reasons it
    // gives are the ones a curator can act on. "Fourteen games are written for
    // another slot" is noise; "every game that fits needs at least four people
    // and there are two of them" is the answer.
    const rejected: { rank: number; text: string }[] = [];
    const candidates: ScopedCandidate[] = [];
    const prunedByVenue: string[] = [];

    for (const ingredient of ingredients) {
      if (ingredient.pool !== slot.pool) continue;

      // ── the dealbreaker, applied one level down ────────────────────
      // The spec states the hard-exclude at stage 2, about destinations. The
      // reasoning does not stop there: a woman who said no novelty props must
      // not be sent a novelty prop inside an otherwise blameless destination,
      // and a penalty large enough to prevent that is the same mistake the
      // spec rejects one stage up. Positive tags only — a thing that
      // REPUDIATES what she vetoed is exactly what she wants.
      const veto = dealbreakers.find(
        (facetId) => (ingredient.facets[facetId] ?? 0) > 0
      );
      if (veto) {
        rejected.push({
          rank: 0,
          text: `${ingredient.name} carries ${facetLabel(veto)}, which she vetoed`,
        });
        continue;
      }

      // ── THE TWO CATALOGUE AXES, DECIDED ONCE ───────────────────────
      //
      // Destination and slot: the only two of this loop's six filters that are
      // facts about the ROW rather than about her evening, and therefore the
      // only two a coverage board with no applicant can ask. Asked here in one
      // call so that the board and this reporter cannot mean different things
      // by "covered" — ./slot-coverage.ts carries the argument.
      //
      // CONSUMED AT THE TWO POSITIONS THEY HAVE ALWAYS BEEN CONSUMED AT, and
      // that is deliberate rather than tidy. The destination refusal is rank 0
      // and comes first; the slot refusal is rank 2 and comes after the venue,
      // the season, the meal shape and the occasion. Moving either would change
      // which sentence a curator reads first in a gap, which is the one thing a
      // refactor here is not allowed to do.
      const placed = placement(
        ingredient,
        destination.id,
        destination.name,
        slot.slotCode
      );

      // THE DESTINATION AXIS, as a filter and not a weight.
      //
      // A `forbidden` row vetoes, a `native` row on ANY destination makes the
      // set a whitelist, and a row that is neither only re-weights. The whole
      // rule is claimEligibility() — the same function the two axes below run —
      // and none of it is repeated here. See occasion.ts and db/019.
      const scope = ingredient.worlds[destination.id];
      if (!placed.world.eligible) {
        rejected.push({
          rank: 0,
          text: `${ingredient.name} is ${placed.world.reason}`,
        });
        continue;
      }

      // THE VENUE AXIS — the room she is physically in, as a filter and only
      // as a filter.
      //
      // This is the ONLY place the venue is allowed to act, and the whole
      // reason it is allowed to act here is that it is acting on the POOL and
      // not on the destination. A clambake needs outdoors; a studio apartment
      // has none; the boil-pot menu leaves. NANTUCKET does not leave, because a
      // destination is not a place — she still gets Nantucket, and what arrives
      // is the fog-day lunch. See venue.ts for the thesis, and vector.ts for
      // the line that keeps `environment` out of the scoring.
      //
      // Rank 0, beside the other structural impossibilities: "the boil pot
      // needs to be outdoors" is the first thing a curator needs to read in a
      // gap, not the fourteenth.
      const forVenue = venueEligibility(ingredient, venue);
      if (!forVenue.eligible) {
        rejected.push({ rank: 0, text: `${ingredient.name} is ${forVenue.reason}` });
        prunedByVenue.push(ingredient.name);
        continue;
      }

      // ── THE CALENDAR, AND ONLY WHERE A CURATOR MADE IT ONE ─────────
      //
      // `season_strict` has been on a menu since db/012, on a drink since
      // db/017 and on a dish since db/021, and until db/026 it did nothing —
      // there was no answer to filter against, and db/021 said so in the column
      // comment. This is the line that comment was waiting for.
      //
      // A FILTER AND NOT A WEIGHT, for the reason the venue axis is one: a
      // clambake in February is not a weak match, it is not a thing that can
      // happen. `season_strict` is the curator's own word for exactly that
      // distinction — db/012: "some menus are merely seasonal and some are
      // WRONG out of season" — so the soft ones are untouched here and reach
      // her as a score, through the season facet her month resolves to.
      //
      // Rank 0, beside the other structural impossibilities. A curator reading
      // a thin pool needs "the clambake needs summer" before she needs the
      // fourteenth reason.
      //
      // Both absences mean yes: a null season here (she is still deciding) and
      // a `year_round` band on the ingredient. See inSeason().
      if (
        season !== null &&
        ingredient.seasonStrict === true &&
        !inSeason(season, ingredient.season)
      ) {
        rejected.push({
          rank: 0,
          text:
            `${ingredient.name} is written strictly for ${humanSeason(ingredient.season)} ` +
            `and this is ${humanSeason(season)}`,
        });
        continue;
      }

      // WHAT KIND OF TABLE THIS IS — db/023, and a filter for the same reason
      // the occasion axis is one: a brunch dish at a long dinner is not a weak
      // match. No claims at all means every shape, so this removes nothing
      // until the founder tags a dish, which is why 650 untagged lines are
      // correct rather than incomplete.
      if (meal !== null && !mealAgrees(ingredient.meals, meal)) {
        rejected.push({
          rank: 1,
          text:
            `${ingredient.name} is written for ` +
            `${(ingredient.meals ?? []).join(" or ")} and this is a ${meal}`,
        });
        continue;
      }

      const forOccasion = occasionEligibility(ingredient.occasions, occasion);
      if (!forOccasion.eligible) {
        rejected.push({ rank: 1, text: `${ingredient.name} is ${forOccasion.reason}` });
        continue;
      }

      // The second axis. Several slots draw from one pool — a birthday has an
      // honouring beat, a game AND per-day material, all of them games — and
      // without this a toast written to mark the person could be placed as
      // day-two material with nothing to object.
      if (!placed.slot.eligible) {
        rejected.push({
          rank: 2,
          text: `${ingredient.name} is ${placed.slot.reason}`,
        });
        continue;
      }

      // A group-size limit is a constraint, not a taste. A parlour game for
      // four at a party of forty is not a weak match, it is an impossibility.
      //
      // Its sibling constraint — how many block-occupying games the evening
      // has room for — cannot be applied here, and the reason is worth
      // stating: a group size is a property of ONE ingredient, and this loop
      // decides one ingredient at a time. The cap is a property of the SET, so
      // it binds in fillSlots below, where there is a running count to compare
      // against. Same class of rule as the budget, enforced in the same place.
      if (groupSize !== null) {
        if (ingredient.minGuests !== null && groupSize < ingredient.minGuests) {
          rejected.push({
            rank: 0,
            text:
              `${ingredient.name} needs at least ${ingredient.minGuests} people ` +
              `and there are ${groupSize}`,
          });
          continue;
        }
        if (ingredient.maxGuests !== null && groupSize > ingredient.maxGuests) {
          rejected.push({
            rank: 0,
            text:
              `${ingredient.name} tops out at ${ingredient.maxGuests} people ` +
              `and there are ${groupSize}`,
          });
          continue;
        }
      }

      const affinity = scope?.affinity ?? 0;
      const facetMatch = facetOverlap(scopedVector, ingredient.facets);
      candidates.push({
        ingredient,
        facetMatch,
        affinity,
        issuanceMultiplier: issuanceMultiplier(ingredient.issuance, now, options),
        base: facetMatch + affinity,
        unitCost: ingredient.priceCents,
      });
    }

    candidates.sort((a, b) => b.base - a.base);
    bySlotCode.set(slot.slotCode, candidates);
    if (prunedByVenue.length > 0) {
      prunedBySlotCode.set(slot.slotCode, prunedByVenue);
    }

    gapBySlotCode.set(
      slot.slotCode,
      candidates.length > 0
        ? null
        : {
            pool: slot.pool,
            slotCode: slot.slotCode,
            slotLabel: slot.label,
            required: slot.required,
            detail:
              `Nothing in the ${slot.pool} pool can fill "${slot.label}" for a ` +
              `${humanOccasion(occasion)} under ${destination.name}` +
              // A POOL THE ROOM EMPTIED IS STILL A CATALOGUE GAP.
              //
              // "If venue pruning leaves a destination's pool too thin, that is
              // the EXISTING pool-too-thin failure mode — a catalogue gap flag
              // — and never a reason to have let venue steer selection." So the
              // room is named in the sentence, because the work order it
              // implies is specific ("author something that works indoors"),
              // and the gap is filed exactly as any other.
              (venue !== null && prunedByVenue.length > 0
                ? ` in ${venue.label.toLowerCase()}`
                : ``) +
              `.` +
              (rejected.length > 0
                ? ` ${rejected.length} were ruled out; the ones worth knowing about: ` +
                  rejected
                    .slice()
                    .sort((a, b) => a.rank - b.rank)
                    .slice(0, 3)
                    .map((r) => r.text)
                    .join("; ") +
                  (rejected.length > 3 ? `; and ${rejected.length - 3} more.` : ".")
                : ` The pool is empty.`),
          }
    );
  }

  for (const slot of slots) {
    pools.set(slot.key, {
      slot,
      candidates: bySlotCode.get(slot.slotCode) ?? [],
      gap: gapBySlotCode.get(slot.slotCode) ?? null,
      prunedByVenue: prunedBySlotCode.get(slot.slotCode) ?? [],
    });
  }

  return pools;
}

type State = {
  picks: Pick[];
  dropped: DroppedPick[];
  cost: number;
  score: number;
  used: Set<string>;
  chosenFacets: FacetTags[];
  /** Blocks of the evening spent. Ambient and finale games spend none. */
  scheduled: number;
  /**
   * WHICH BEATS HAVE ALREADY SPENT A BLOCK — db/061.
   *
   * An offer is three candidates for ONE beat and one of them runs, so the
   * three of them together spend one block, not three. Without this the
   * carousel would trip `scheduled_game_max` on its own second card and hand
   * her one game with a house note saying the evening was full.
   *
   * Keyed on the offer group where there is one and on the unit slot's key
   * where there is not, so a beat outside an offer behaves exactly as it did.
   * A Set per state for the same reason `table` is a Map per state: the beam
   * holds several live states and they have spent different evenings.
   */
  blocksSpent: Set<string>;
  /**
   * WHAT EACH COHERENCE GROUP HAS COMMITTED TO — db/022, and empty in every
   * search that has no such group, which is every occasion until the courses.
   *
   * Copied on extend() rather than mutated, because a beam holds several live
   * states at once and two of them may have set very different tables.
   */
  table: Map<string, TableCommitment>;
};

/** Does placing this thing take one of the evening's blocks? */
function takesABlock(ingredient: Ingredient): boolean {
  return ingredient.shape === "scheduled";
}

/**
 * WHICH BEAT OF THE EVENING THIS UNIT SLOT IS — db/061.
 *
 * The offer group where there is one, the slot's own key where there is not.
 * Stated once because three things must agree about it: the cap check refuses a
 * candidate on it, `extend` spends a block on it, and `whatRuns` below counts
 * one course per beat for the chooser — and if any two disagreed a beat would
 * be charged twice or never (CLAUDE.md rule 21).
 */
function beatOf(slot: UnitSlot): string {
  return slot.offerGroup ?? slot.key;
}

/**
 * WHAT IS ACTUALLY ON THIS TABLE — db/062, and the reading `revelle_game_load`
 * already applies one layer down.
 *
 * An offer is several candidates for ONE beat and exactly one of them happens.
 * Three offered appetizers are not three appetizers; they are one appetizer not
 * yet picked. So anything that answers "what is already on the table" must
 * count a beat once, and the stand-in for an undecided beat is its FIRST card —
 * the top of the carousel, which is a count and not a claim about her taste.
 *
 * WHY THIS EXISTS AT ALL, since it fixes nothing that is broken today: it feeds
 * `CourseRequest.placed`, whose own comment reads "already on this table, in
 * the order they were placed". With three per course that sentence would become
 * false the moment a chooser is configured — a model asked for a main would be
 * shown three appetizers as if she were eating all three, and would compose
 * against a table nobody is sitting at. Nothing would throw and nothing would
 * go red; the prompt would simply be describing a different dinner. That is
 * CLAUDE.md rule 23's shape exactly, and rule 23 says to fix it at the point
 * the wrong reading would be made rather than to wait for the misreading.
 */
function whatRuns(picks: readonly Pick[]): Pick[] {
  const seen = new Set<string>();
  const runs: Pick[] = [];
  for (const pick of picks) {
    const beat = beatOf(pick.slot);
    if (seen.has(beat)) continue;
    seen.add(beat);
    runs.push(pick);
  }
  return runs;
}

/** STAGE 4. */
export function fillSlots(
  pools: Map<string, SlotPool>,
  scale: Scale,
  shape: OccasionShape,
  options: EngineOptions,
  /**
   * EVERYTHING THE COMPOSED TABLE NEEDS THAT IS NOT A SLOT OR A POOL — db/022,
   * db/023, and one object rather than four parameters because they arrive
   * together and mean nothing apart.
   *
   * Optional in full: a caller that has no coherence group in its plan — every
   * occasion before db/022, and every fixture in selection.test.ts — passes
   * nothing and behaves exactly as it did.
   */
  table: TableContext = {}
): Fill {
  const tableRung = table.rung ?? null;
  const tableSeason = table.season ?? null;
  const ceiling = toCents(scale.budgetCeiling);
  const planning = toCents(scale.budgetPlanning);
  const blocks = Math.max(0, shape.scheduledGameMax);

  // ── most-constrained first ─────────────────────────────────────────
  // Required before optional on a tie, then the authored order, so that a run
  // is reproducible and reads sensibly in the explanation.
  const order = [...pools.values()].sort((a, b) => {
    const byCandidates = a.candidates.length - b.candidates.length;
    if (byCandidates !== 0) return byCandidates;
    if (a.slot.required !== b.slot.required) return a.slot.required ? -1 : 1;
    return a.slot.position - b.slot.position;
  });

  // ── the lookahead ──────────────────────────────────────────────────
  // cheapest[i] = the least this search can still spend on the REQUIRED slots
  // from position i onwards. Suffix sums, computed once.
  const cheapest = new Array<number>(order.length + 1).fill(0);
  for (let i = order.length - 1; i >= 0; i -= 1) {
    const entry = order[i];
    let least = 0;
    if (entry.slot.required && entry.candidates.length > 0) {
      let best: number | null = null;
      for (const candidate of entry.candidates) {
        const cost = lineCost(candidate.unitCost, entry.slot.quantity);
        if (best === null || cost < best) best = cost;
      }
      least = best ?? 0;
    }
    cheapest[i] = cheapest[i + 1] + least;
  }

  // ONE GAP PER BEAT, NOT ONE PER CARD — db/061.
  //
  // A gap is a WORK ORDER (see the note on CatalogueGap in types.ts): the pool
  // could not fill a slot her occasion has, and the house must author
  // something. An offer is three candidates for one beat, all drawing the same
  // scoped pool, so an empty pool reported once per card would put the same
  // work order on the list three times — a list that says three things are
  // missing when one is stops being a count of anything.
  //
  // `beatOf` is the offer group where there is one and the unit slot's key
  // where there is not, so a slot outside an offer is untouched: a maxCount-3
  // edit still reports three gaps, which is correct, because that slot really
  // does want three objects.
  const gaps: CatalogueGap[] = [];
  const reported = new Set<string>();
  for (const entry of order) {
    if (!entry.gap) continue;
    const beat = beatOf(entry.slot);
    if (reported.has(beat)) continue;
    reported.add(beat);
    gaps.push(entry.gap);
  }

  // ── THE TABLE STARTS ON HER DATE ───────────────────────────────────
  //
  // Every coherence group in the plan opens already committed to her season,
  // rather than opening null and being committed by whichever course happened
  // to be decided first. The difference is not cosmetic and it is not
  // symmetrical: `narrowSeason` only ever narrows, so a group that opens null
  // and takes a `shoulder` dish is thereafter a SHOULDER table — wider than the
  // spring evening she is actually having — and an autumn dessert would then be
  // agreed with. Seeding it means the calendar is the outer bound and every
  // course narrows inside it.
  //
  // Null seeds null, which is exactly the state this map had before db/026.
  // Nothing else about the search changes for a host who has not said when.
  //
  // The rung is deliberately NOT seeded here. It falls back through
  // `rungHeld`, because the rung has a preference ORDER (table.ts) and a course
  // with nothing at her rung must be allowed to reach for the next one — which
  // is a different rule from a season, where there is nothing to fall back to.
  const openTable = new Map<string, TableCommitment>();
  for (const entry of pools.values()) {
    const group = groupOf(entry.slot);
    if (group !== null && !openTable.has(group)) {
      openTable.set(group, { season: tableSeason, making: null });
    }
  }

  let beam: State[] = [
    {
      picks: [],
      dropped: [],
      cost: 0,
      score: 0,
      used: new Set(),
      chosenFacets: [],
      scheduled: 0,
      blocksSpent: new Set(),
      table: openTable,
    },
  ];

  for (let i = 0; i < order.length; i += 1) {
    const entry = order[i];
    const slot = entry.slot;
    const limit = slot.required ? ceiling : (planning ?? ceiling);
    const nextCheapest = cheapest[i + 1];

    const next: State[] = [];

    for (const state of beam) {
      const childrenFrom = next.length;
      let placed = 0;
      let blockedByBudget: { name: string; cost: number; over: number } | null =
        null;
      let cheapestFallback: { candidate: ScopedCandidate; cost: number } | null =
        null;
      let weakest: { name: string; score: number } | null = null;
      let blockedByShape: string | null = null;
      let refusedByTable: { name: string; why: string } | null = null;

      // ── WHAT THIS TABLE HAS ALREADY COMMITTED TO ─────────────────────
      //
      // Read once per (state, slot) rather than per candidate, because it does
      // not change while this slot is being decided.
      const group = groupOf(slot);
      const committed = group === null ? undefined : state.table.get(group);
      const seasonHeld = committed?.season ?? null;
      const rungHeld = committed?.making ?? tableRung;

      // THE RUNG THIS COURSE WILL ACTUALLY USE.
      //
      // The table's rung when anything can fill the course at it, and otherwise
      // the first rung in table.ts's fallback order that something can. Decided
      // BEFORE the candidate loop rather than inside it, because "fall back one
      // step" is a statement about the whole course and cannot be evaluated one
      // candidate at a time — the second-best dish at her rung must beat the
      // best dish one rung off, and a per-candidate test would let score decide
      // that.
      //
      // AND THE FALLBACK IS FOR THE BEAT, NOT FOR ITS SPARE CARDS — db/062.
      //
      // "A table with a main in it at the wrong rung beats a table with no
      // main" is the argument, and it is an argument about the beat being
      // EMPTY. It does not transfer to the second and third cards of an offer,
      // which is db/061's own rule ("only the first candidate of an offer is
      // required") arriving on the coherence axis.
      //
      // Left unfixed, a room with two dishes at her rung and a third one rung
      // off deals her that third as a card she may take — so a host who said
      // she wanted a half-made evening is offered a day of stock, and taking it
      // is the product handing her the thing she declined. Rule 16: the answer
      // she gave has to bind at the point she can act on it, and where the
      // rung leaves nothing, SHE IS OFFERED FEWER. Two cards is the honest
      // number; a third at the wrong rung is not a richer choice.
      const spareCard =
        group !== null &&
        (slot.offerGroup ?? null) !== null &&
        (slot.offerIndex ?? 0) > 0;
      let rungForThisCourse: string | null =
        spareCard && rungHeld !== null ? rungHeld : null;
      if (group !== null && rungHeld !== null && !spareCard) {
        for (const rung of rungPreference(rungHeld)) {
          const reachable = entry.candidates.some((candidate) => {
            const axes = axesOf(candidate.ingredient);
            return (
              !state.used.has(
                `${candidate.ingredient.pool}:${candidate.ingredient.id}`
              ) &&
              seasonAgrees(seasonHeld, axes.season) &&
              (axes.making === null || axes.making === rung)
            );
          });
          if (reachable) {
            rungForThisCourse = rung;
            break;
          }
        }
        // Nothing at any rung. Left null, so the rung stops constraining and
        // the season, the budget and the required-slot fallback below decide
        // alone. A table with a main in it at the wrong rung beats a table with
        // no main, and this is the same judgement one step further out.
      }

      // ── RULES NARROW, A MODEL CHOOSES — compose.ts ───────────────────
      //
      // Everything above this line is the rules: destination, course, meal
      // shape, room, group size, season, rung, and nothing already used. What
      // is left is a handful of dishes that are all permitted, and which of
      // them makes an EVENING beside what is already on the table is the one
      // judgement no rule here holds.
      //
      // With no chooser configured this is a no-op that costs one array pass:
      // chooseCourse returns the best-scoring survivor, which is the candidate
      // the loop below would have reached first anyway. Absence is a route.
      let first: string | null = null;
      if (group !== null && table.chooser) {
        const survivors: CourseOption[] = [];
        for (const candidate of entry.candidates) {
          const axes = axesOf(candidate.ingredient);
          if (
            state.used.has(
              `${candidate.ingredient.pool}:${candidate.ingredient.id}`
            ) ||
            !seasonAgrees(seasonHeld, axes.season) ||
            (rungForThisCourse !== null &&
              axes.making !== null &&
              axes.making !== rungForThisCourse)
          ) {
            continue;
          }
          survivors.push(
            courseOption(candidate.ingredient, survivors.length)
          );
        }
        if (survivors.length > 0) {
          first = chooseCourse(
            {
              destination: table.destination ?? "",
              meal: table.meal ?? "",
              season: seasonHeld,
              making: rungForThisCourse,
              slot,
              // ONE COURSE PER BEAT — db/062. See whatRuns above: three
              // offered appetizers are one appetizer not yet picked, and a
              // chooser shown all three would be composing against a table
              // nobody is sitting at.
              placed: whatRuns(
                state.picks.filter((pick) => groupOf(pick.slot) === group)
              ).map((pick, index) => courseOption(pick.ingredient, index)),
              survivors,
              exemplars: table.exemplars ?? [],
            },
            table.chooser
          ).id;
        }
      }

      // The chosen dish is tried FIRST and everything else in score order after
      // it. Not "only the chosen dish": the budget, the ceiling and the beam
      // are still the search's to enforce, and a chooser that names something
      // unaffordable must not empty the slot.
      const ordered =
        first === null
          ? entry.candidates
          : [
              ...entry.candidates.filter((c) => c.ingredient.id === first),
              ...entry.candidates.filter((c) => c.ingredient.id !== first),
            ];

      for (const candidate of ordered) {
        const key = `${candidate.ingredient.pool}:${candidate.ingredient.id}`;
        if (state.used.has(key)) continue;

        // ── THE TABLE HAS TO AGREE WITH ITSELF ───────────────────────
        //
        // Before the budget and before the score, beside the evening's blocks,
        // because it is the same kind of rule: a summer dish next to a winter
        // one is not a weak match, it is not one table. A year-round dish
        // agrees with everything and 502 of the 600 are year-round, so this
        // bites rarely and exactly where it should.
        if (group !== null) {
          const axes = axesOf(candidate.ingredient);
          if (!seasonAgrees(seasonHeld, axes.season)) {
            if (refusedByTable === null) {
              // WHERE THE TABLE'S SEASON CAME FROM, because the two are
              // different work orders. "The other courses are summer" is
              // something a curator can fix by moving a course; "she is having
              // this in February" is not something anybody is going to fix, and
              // what it asks for is a winter dessert at that destination.
              const fromACourse = state.picks.some(
                (pick) => groupOf(pick.slot) === group
              );
              refusedByTable = {
                name: candidate.ingredient.name,
                why:
                  `it is written for ${humanSeason(axes.season)} and ` +
                  (fromACourse
                    ? `the table is already ${humanSeason(seasonHeld)}`
                    : `she is having this in ${humanSeason(seasonHeld)}`),
              };
            }
            continue;
          }
          if (
            rungForThisCourse !== null &&
            axes.making !== null &&
            axes.making !== rungForThisCourse
          ) {
            if (refusedByTable === null) {
              refusedByTable = {
                name: candidate.ingredient.name,
                why:
                  `it is ${axes.making} and this table is being set at ` +
                  `${rungForThisCourse}`,
              };
            }
            continue;
          }
        }

        // THE EVENING HAS RUN OUT OF BLOCKS.
        //
        // Before the budget and before the score, because it is the hardest of
        // the three: money can be argued about and a weak match is a judgement,
        // but an hour that is already spent is spent. Skipped rather than
        // penalised, and skipped here rather than in scopePools, because it
        // depends on what this state has already placed.
        //
        // An ambient game runs underneath the evening and a finale ends it;
        // neither takes a block, so neither is counted and neither is ever
        // refused for this reason.
        //
        // AND AN OFFER IS ONE BEAT — db/061. The three candidates she chooses
        // between are alternatives for one block, so the second and third are
        // never refused on account of the first. `beatOf` is the one place
        // that reading lives; see State.blocksSpent.
        if (
          takesABlock(candidate.ingredient) &&
          !state.blocksSpent.has(beatOf(slot)) &&
          state.scheduled >= blocks
        ) {
          if (blockedByShape === null) blockedByShape = candidate.ingredient.name;
          continue;
        }

        const cost = lineCost(candidate.unitCost, slot.quantity);
        const projected = state.cost + cost + nextCheapest;

        if (cheapestFallback === null || cost < cheapestFallback.cost) {
          cheapestFallback = { candidate, cost };
        }

        if (limit !== null && projected > limit) {
          if (blockedByBudget === null) {
            blockedByBudget = {
              name: candidate.ingredient.name,
              cost,
              over: projected - limit,
            };
          }
          continue;
        }

        const pick = scorePick(candidate, slot, state, options);
        if (!slot.required && pick.score <= 0) {
          if (weakest === null || pick.score > weakest.score) {
            weakest = { name: candidate.ingredient.name, score: pick.score };
          }
          continue;
        }

        next.push(
          extend(state, pick, cost, key, candidate.ingredient.facets, group)
        );
        placed += 1;
        if (placed >= options.beamWidth) break;
      }

      // THE BUDGET BINDING WITHOUT ANYTHING BEING EMPTY.
      //
      // The commonest way a budget actually bites is not an empty slot — it is
      // the best thing being unaffordable and the second-best quietly taking
      // its place. Nothing is missing, the total looks fine, and the curator
      // has no way to know that the slot she is looking at is a compromise.
      // Recorded on every child of this state, because whichever survives the
      // beam, this is true of it.
      if (blockedByBudget !== null && placed > 0) {
        const note: DroppedPick = {
          slot,
          ingredientName: blockedByBudget.name,
          lineCost: blockedByBudget.cost,
          reason: "budget",
          detail:
            `the best fit for "${slot.label}" at ${formatCents(blockedByBudget.cost)}, ` +
            `which would have gone ${formatCents(blockedByBudget.over)} past ` +
            `${slot.required ? "the ceiling" : "what she is building to"}. ` +
            `Something cheaper took the slot.`,
        };
        for (let c = childrenFrom; c < next.length; c += 1) {
          next[c] = { ...next[c], dropped: [...next[c].dropped, note] };
        }
      }

      // The same courtesy for the evening's blocks. A curator reading a
      // birthday with two games and wondering where the third went is owed the
      // sentence; the member is owed nothing here, because to her the slot
      // simply does not exist. Never a CatalogueGap: the pool was not thin,
      // the evening was full.
      const outOfBlocks: DroppedPick | null =
        blockedByShape === null
          ? null
          : {
              slot,
              ingredientName: blockedByShape,
              lineCost: null,
              reason: "scheduled_cap",
              detail:
                `not placed in "${slot.label}": a ${humanOccasion(shape.occasion)} ` +
                `has ${blocks} block${blocks === 1 ? "" : "s"} for a game that stops ` +
                `the room, and ${state.scheduled} ${
                  state.scheduled === 1 ? "is" : "are"
                } already spent. Ambient games and the finale do not count ` +
                `toward it. Nothing is wrong with the catalogue.`,
            };

      if (outOfBlocks !== null && placed > 0) {
        for (let c = childrenFrom; c < next.length; c += 1) {
          next[c] = { ...next[c], dropped: [...next[c].dropped, outOfBlocks] };
        }
      }

      // THE TABLE REFUSING SOMETHING IS WORTH A SENTENCE. A curator looking at
      // a composed table and wondering why the obvious dessert is not on it is
      // owed the reason, and "the table is already summer" is a reason she can
      // act on — by writing a year-round dessert for that destination, or by
      // deciding the season tag was wrong. Never a CatalogueGap: the pool was
      // not thin, the table was.
      if (refusedByTable !== null && placed > 0) {
        const note: DroppedPick = {
          slot,
          ingredientName: refusedByTable.name,
          lineCost: null,
          reason: "table_disagreed",
          detail:
            `not placed in "${slot.label}": ${refusedByTable.why}. A table ` +
            `that is two seasons or two rungs of work is not an evening — see ` +
            `db/022. Something that agrees took the course.`,
        };
        for (let c = childrenFrom; c < next.length; c += 1) {
          next[c] = { ...next[c], dropped: [...next[c].dropped, note] };
        }
      }

      if (slot.required) {
        // A required slot that could not be filled within the ceiling still has
        // to be filled: the spec's answer to "budget can't be met" is the
        // closest candidate with the overage stated plainly, not a Revelle with
        // a hole in it. The cheapest option is the closest one.
        if (placed === 0 && cheapestFallback !== null) {
          const { candidate, cost } = cheapestFallback;
          const key = `${candidate.ingredient.pool}:${candidate.ingredient.id}`;
          const pick = scorePick(candidate, slot, state, options);
          next.push(
            extend(state, pick, cost, key, candidate.ingredient.facets, group)
          );
          placed += 1;
        }
        // Nothing at all could fill it: a catalogue gap, or an evening with no
        // block left. EITHER WAY THE STATE CONTINUES rather than dying.
        //
        // A required slot that cannot be filled must not cost her the rest of
        // her Revelle, and it must not cost the curator every other candidate.
        // "Required" is the occasion's shape and a house signal — it is how the
        // honouring beat with nothing written for it reaches whoever authors
        // the pool — and it is never a reason to withhold. She receives what
        // there was, and never learns a slot existed. See member.ts.
        if (placed === 0) {
          next.push(outOfBlocks === null ? state : withDrop(state, outOfBlocks));
        }
        continue;
      }

      // Optional: skipping is always available, and is what "dropped to stay
      // under budget" actually is.
      if (outOfBlocks !== null && placed === 0) {
        next.push(withDrop(state, outOfBlocks));
      } else if (blockedByBudget !== null && placed === 0) {
        next.push({
          ...state,
          dropped: [
            ...state.dropped,
            {
              slot,
              ingredientName: blockedByBudget.name,
              lineCost: blockedByBudget.cost,
              reason: "budget",
              detail:
                `${blockedByBudget.name} would have put the total ` +
                `${formatCents(blockedByBudget.over)} over ` +
                `${slot.required ? "the ceiling" : "what she is building to"}.`,
            },
          ],
        });
      } else if (weakest !== null && placed === 0) {
        // Left empty because nothing was worth placing — usually a near-copy of
        // something already chosen. Said out loud, because a Revelle quietly
        // arriving with two edit items instead of three is the kind of thing a
        // curator should be told rather than left to count.
        next.push({
          ...state,
          dropped: [
            ...state.dropped,
            {
              slot,
              ingredientName: weakest.name,
              lineCost: null,
              reason: "no_good_match",
              detail:
                `left empty. The best thing left in the ${slot.pool} pool scored ` +
                `${weakest.score.toFixed(2)} — either it repeats something already ` +
                `placed or it does not suit her.`,
            },
          ],
        });
      } else {
        next.push(state);
      }
    }

    beam = prune(next, options.beamWidth);
  }

  const best = beam.reduce((a, b) => (b.score > a.score ? b : a), beam[0]);

  return {
    picks: [...best.picks].sort((a, b) => a.slot.position - b.slot.position),
    dropped: best.dropped,
    gaps,
    cost: best.cost,
    score: best.score,
    pools,
    order: order.map((entry) => entry.slot.key),
  };
}

function scorePick(
  candidate: ScopedCandidate,
  slot: UnitSlot,
  state: State,
  options: EngineOptions
): Pick {
  const penalty = issuancePenalty(candidate.base, candidate.issuanceMultiplier);
  const similarity = similarityDiscount(
    candidate.base - penalty,
    candidate.ingredient.facets,
    state.chosenFacets,
    options.similarityDiscount
  );

  return {
    slot,
    ingredient: candidate.ingredient,
    unitCost: candidate.unitCost,
    lineCost:
      candidate.unitCost === null ? null : candidate.unitCost * slot.quantity,
    facetMatch: candidate.facetMatch,
    affinity: candidate.affinity,
    issuancePenalty: penalty,
    similarityPenalty: similarity,
    score: candidate.base - penalty - similarity,
    forced: false,
    alternatives: 0,
  };
}

function extend(
  state: State,
  pick: Pick,
  cost: number,
  key: string,
  facets: FacetTags,
  /** The coherence group this pick joins, or null. db/022. */
  group: string | null
): State {
  const used = new Set(state.used);
  used.add(key);

  // THE TABLE, NARROWED. A new Map per state rather than a mutation, because
  // the beam holds several live states and two of them may have set very
  // different tables from the same parent.
  const table = new Map(state.table);
  if (group !== null) {
    const axes = axesOf(pick.ingredient);
    const held = table.get(group) ?? { season: null, making: null };
    table.set(group, {
      season: narrowSeason(held.season, axes.season),
      // The first course to name a rung settles it. A dish with no rung at all
      // — no pool has one today, and a hand-built fixture may — settles
      // nothing rather than settling null over a real answer.
      making: held.making ?? axes.making ?? null,
    });
  }

  // db/061. A beat spends a block once, however many candidates are offered
  // for it. The second card of a carousel adds nothing to the evening's load
  // because only one of the three will ever be played.
  const beat = beatOf(pick.slot);
  const spendsABlock = takesABlock(pick.ingredient) && !state.blocksSpent.has(beat);
  const blocksSpent = spendsABlock
    ? new Set(state.blocksSpent).add(beat)
    : state.blocksSpent;

  return {
    picks: [...state.picks, pick],
    dropped: state.dropped,
    cost: state.cost + cost,
    score: state.score + pick.score,
    used,
    chosenFacets: [...state.chosenFacets, facets],
    scheduled: state.scheduled + (spendsABlock ? 1 : 0),
    blocksSpent,
    table,
  };
}

/** A house note about this state, carried forward. Never seen by a member. */
function withDrop(state: State, note: DroppedPick): State {
  return { ...state, dropped: [...state.dropped, note] };
}

function prune(states: State[], width: number): State[] {
  return states.sort((a, b) => b.score - a.score).slice(0, Math.max(1, width));
}

/**
 * An unpriced ingredient costs nothing HERE and is listed by name in the budget
 * report. Guessing a price would produce a total that looks authoritative and
 * is wrong; a curator pricing three named things by hand is the honest version.
 */
function lineCost(unitCost: number | null, quantity: number): number {
  if (unitCost === null) return 0;
  return unitCost * quantity;
}

function toCents(dollars: number | null): number | null {
  if (dollars === null || !Number.isFinite(dollars)) return null;
  return Math.round(dollars * 100);
}

export function formatCents(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}
