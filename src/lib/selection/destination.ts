/**
 * STAGE 2 — choose the destination. The collection key.
 *
 * The single most consequential decision in the system, and the reason every
 * later stage is cheap: once this is chosen, every pool downstream is already
 * scoped to it and nothing has to know that tiki glasses clash with linen.
 *
 * Order of operations, and the order is the argument:
 *
 *   1. FILTER on dealbreakers. Not a penalty. If she said no costume rule, a
 *      destination built on a costume rule is gone at any score — treating it
 *      as a large negative weight is what lets a high-scoring match sneak one
 *      through, and it would sneak through on exactly the customers who scored
 *      the most strongly on everything else.
 *   2. FILTER on the occasion, but only where a destination has explicitly
 *      refused it. The default is that a destination carries every occasion;
 *      see db/009.
 *   3. SCORE what survives by weighted facet overlap.
 *   4. PENALISE recently-issued destinations, so the catalogue spreads.
 *   5. DITHER, and take the top few.
 *
 * ── WHERE THE DITHER IS APPLIED ──────────────────────────────────────
 *
 * On the CURATOR'S SHORTLIST, never on a delivered Revelle. Netflix can afford
 * to explore on a live recommendation because the regret is amortised over a
 * hundred million members; Revelle has few customers and each deliverable is
 * expensive, so exploring on a delivered one is a bad trade. The curator
 * absorbs the exploration risk, and her rejecting a dithered candidate is
 * itself the signal we wanted from the exploration.
 */

import { dither, type Rng } from "./rng.ts";
import { facetOverlap, issuanceMultiplier, issuancePenalty } from "./score.ts";
import { occasionEligibility } from "./occasion.ts";
import type {
  Destination,
  Elimination,
  EngineOptions,
  OccasionCode,
  PreferenceVector,
} from "./types.ts";

export type ScoredDestination = {
  destination: Destination;
  /** Overlap before the issuance penalty. */
  rawScore: number;
  issuancePenalty: number;
  score: number;
  /** On merit, 1-based. */
  rank: number;
  /** After the dither, 1-based. This is the order the curator sees. */
  ditheredRank: number;
};

export type Shortlist = {
  shortlist: ScoredDestination[];
  eliminated: Elimination[];
  /** Set when the filters left nothing. Names the constraints that conflict. */
  impasse: string | null;
};

export function chooseDestinations(
  destinations: readonly Destination[],
  vector: PreferenceVector,
  occasion: OccasionCode,
  options: EngineOptions,
  random: Rng,
  now: Date
): Shortlist {
  const eliminated: Elimination[] = [];
  const survivors: Destination[] = [];

  const dealbreakers = new Set(vector.dealbreakers);

  for (const destination of destinations) {
    // ── 1. dealbreakers, as a filter ─────────────────────────────────
    // Only a POSITIVE tag eliminates. A destination tagged -0.9 on a costume
    // rule is one that repudiates costumes, and eliminating it because the
    // word appears in its tags would be exactly backwards.
    const offending: string[] = [];
    for (const facetId of dealbreakers) {
      const weight = destination.facets[facetId];
      if (weight !== undefined && weight > 0) {
        const term = vector.terms[facetId];
        offending.push(term ? term.facet.label.toLowerCase() : facetId);
      }
    }

    if (offending.length > 0) {
      eliminated.push({
        destinationName: destination.name,
        reason: `it carries ${joinWords(offending)}, which she said would ruin it`,
      });
      continue;
    }

    // ── 2. an occasion the destination has refused ───────────────────
    const verdict = occasionEligibility(destination.occasions, occasion);
    if (!verdict.eligible) {
      eliminated.push({
        destinationName: destination.name,
        reason: verdict.reason,
      });
      continue;
    }

    survivors.push(destination);
  }

  if (survivors.length === 0) {
    return {
      shortlist: [],
      eliminated,
      impasse: impasseMessage(eliminated, destinations.length),
    };
  }

  // ── 3 and 4. score, then discount for issuance ─────────────────────
  const scored = survivors.map((destination) => {
    const rawScore = facetOverlap(vector.weights, destination.facets);
    const multiplier = issuanceMultiplier(destination.issuance, now, options);
    const penalty = issuancePenalty(rawScore, multiplier);
    return {
      destination,
      rawScore,
      issuancePenalty: penalty,
      score: rawScore - penalty,
      rank: 0,
      ditheredRank: 0,
    };
  });

  // ── 5. dither, and read the shortlist off the top ──────────────────
  const shortlist = dither(
    scored,
    (entry) => entry.score,
    options.ditherEpsilon,
    random
  ).map((entry) => ({
    ...entry.item,
    rank: entry.rank,
    ditheredRank: entry.ditheredRank,
  }));

  return { shortlist, eliminated, impasse: null };
}

/**
 * The failure mode the spec names first: dealbreakers eliminate everything.
 *
 * "Report which constraints conflict and which to relax. Never silently drop
 * one." So the message names them, and the engine returns no candidates rather
 * than quietly relaxing the least popular veto and producing something she
 * explicitly refused.
 */
function impasseMessage(
  eliminated: readonly Elimination[],
  total: number
): string {
  const reasons = [...new Set(eliminated.map((e) => e.reason))];
  return (
    `All ${total} destination${total === 1 ? "" : "s"} were eliminated. ` +
    `Nothing was relaxed. The constraints that did it: ` +
    reasons.map((r) => `${r}`).join("; ") +
    `. Relax one with her, or author a destination that clears them all.`
  );
}

function joinWords(words: readonly string[]): string {
  if (words.length === 1) return words[0];
  return `${words.slice(0, -1).join(", ")} and ${words[words.length - 1]}`;
}
