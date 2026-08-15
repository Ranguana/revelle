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
 */

import {
  humanOccasion,
  occasionEligibility,
  slotEligibility,
} from "./occasion.ts";
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
  options: EngineOptions,
  now: Date
): Map<string, SlotPool> {
  const groupSize = scale.guestsHigh ?? scale.guestsPlanning ?? null;
  const pools = new Map<string, SlotPool>();

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

      const scope = ingredient.worlds[destination.id];
      if (scope?.forbidden) {
        rejected.push({
          rank: 0,
          text:
            `${ingredient.name} is forbidden under ${destination.name}` +
            (scope.note ? ` — ${scope.note}` : ""),
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
      const forSlot = slotEligibility(ingredient.slots, slot.slotCode);
      if (!forSlot.eligible) {
        rejected.push({ rank: 2, text: `${ingredient.name} is ${forSlot.reason}` });
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
              `${humanOccasion(occasion)} under ${destination.name}.` +
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
};

/** Does placing this thing take one of the evening's blocks? */
function takesABlock(ingredient: Ingredient): boolean {
  return ingredient.shape === "scheduled";
}

/** STAGE 4. */
export function fillSlots(
  pools: Map<string, SlotPool>,
  scale: Scale,
  shape: OccasionShape,
  options: EngineOptions
): Fill {
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

  const gaps: CatalogueGap[] = [];
  for (const entry of order) {
    if (entry.gap) gaps.push(entry.gap);
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

      for (const candidate of entry.candidates) {
        const key = `${candidate.ingredient.pool}:${candidate.ingredient.id}`;
        if (state.used.has(key)) continue;

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
        if (takesABlock(candidate.ingredient) && state.scheduled >= blocks) {
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

        next.push(extend(state, pick, cost, key, candidate.ingredient.facets));
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

      if (slot.required) {
        // A required slot that could not be filled within the ceiling still has
        // to be filled: the spec's answer to "budget can't be met" is the
        // closest candidate with the overage stated plainly, not a Revelle with
        // a hole in it. The cheapest option is the closest one.
        if (placed === 0 && cheapestFallback !== null) {
          const { candidate, cost } = cheapestFallback;
          const key = `${candidate.ingredient.pool}:${candidate.ingredient.id}`;
          const pick = scorePick(candidate, slot, state, options);
          next.push(extend(state, pick, cost, key, candidate.ingredient.facets));
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
  facets: FacetTags
): State {
  const used = new Set(state.used);
  used.add(key);
  return {
    picks: [...state.picks, pick],
    dropped: state.dropped,
    cost: state.cost + cost,
    score: state.score + pick.score,
    used,
    chosenFacets: [...state.chosenFacets, facets],
    scheduled: state.scheduled + (takesABlock(pick.ingredient) ? 1 : 0),
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
