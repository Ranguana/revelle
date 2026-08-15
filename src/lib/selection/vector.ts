/**
 * STAGE 1 — her preference vector.
 *
 * A weighted average of three sources, and emphatically not a model:
 *
 *   what she said this time    always dominant
 *   what we have learned       grows with her history
 *   her cohort's prior         fills the gap when that history is thin
 *
 * ── THE SHRINKAGE ────────────────────────────────────────────────────
 *
 * At application #1 there is no history at all, so the choice is between
 * leaning on the cohort and leaning on nothing. Leaning on nothing means every
 * first-time customer is scored on nine tapped answers, which is exactly the
 * sparsity the cohort table was built to survive.
 *
 * So the non-stated half of the weight is split k/(k+n) to the cohort and
 * n/(n+k) to her own history, where n is how many current signals we hold about
 * her and k is a constant expressing how much cohort evidence is worth. At
 * n = 0 the cohort takes all of it; at n = k they are equal; at n = 40 with
 * k = 8 the cohort is down to a sixth. It recedes on its own, and nobody has to
 * remember to turn it off.
 *
 * ── DEALBREAKERS ARE NOT PART OF THE AVERAGE ─────────────────────────
 *
 * A dealbreaker is a FILTER (spec, stage 2), and a filter has no weight to
 * contribute — mixing it into the vector at any magnitude is precisely the
 * mistake the spec warns about, because a high enough match score would then
 * sneak one through. They come out of this stage as a set of facet ids and are
 * applied by exclusion.
 *
 * Which negatives are dealbreakers is a judgement, and it is made here:
 *
 *   · everything she said in THIS application under "what would ruin it" —
 *     she is answering that question now, about this evening;
 *   · nothing else. A negative from her history or her cohort is a SOFT
 *     negative, scored at a fifth of an equivalent positive.
 *
 * A curator who wants a permanent veto records it as a dealbreaker in her own
 * tool; the engine does not promote a preference to a veto on her behalf.
 *
 * ── SUPERSESSION ─────────────────────────────────────────────────────
 *
 * Excluded upstream: the loader only ever selects `superseded_by is null`. A
 * 2029 preference beats a 2026 one and they are never averaged, which is the
 * spec's rule and db/002's mechanism, and this file simply never sees the old
 * row.
 */

import type {
  CohortAffinity,
  EngineOptions,
  Facet,
  HistorySignal,
  PreferenceVector,
  StatedFacet,
  VectorSource,
  VectorTerm,
} from "./types.ts";

/** Answers that are a scale or a routing question, not a taste. */
const NON_TASTE_DIMENSIONS = new Set([
  "guest_count",
  "spend_per_person",
  "music_service",
  // Retired by db/006. It resolves, so it must be excluded on purpose rather
  // than by accident of not appearing.
  "budget",
]);

export function buildVector(
  stated: readonly StatedFacet[],
  history: readonly HistorySignal[],
  cohorts: readonly CohortAffinity[],
  facets: Record<string, Facet>,
  options: EngineOptions
): PreferenceVector {
  const terms: Record<string, VectorTerm> = {};

  const add = (
    facetId: string,
    weight: number,
    source: VectorSource,
    because: string
  ): void => {
    if (weight === 0) return;
    const facet = facets[facetId];
    if (!facet) return;
    if (NON_TASTE_DIMENSIONS.has(facet.dimension)) return;

    const term = (terms[facetId] ??= { facet, weight: 0, contributions: [] });
    term.weight += weight;
    term.contributions.push({ source, weight, because });
  };

  // ── the blend ──────────────────────────────────────────────────────
  const evidence = history.filter((s) => s.facetId !== null).length;
  const k = options.cohortPriorStrength;
  const rest = 1 - options.statedWeight;
  const cohortShare = rest * (k / (k + evidence));
  const historyShare = rest - cohortShare;

  // ── what she said this time ────────────────────────────────────────
  const dealbreakers = new Set<string>();

  for (const answer of stated) {
    if (NON_TASTE_DIMENSIONS.has(answer.dimension)) continue;

    if (answer.polarity === "negative") {
      dealbreakers.add(answer.facetId);
      // `weight` is 1 on every veto — db/016 constrains it, because a veto has
      // no degree — so the arithmetic below is unchanged by its existence.
      // Recorded in the vector too, at the soft-negative ratio, so that a
      // destination merely LEANING toward something she vetoed also scores
      // worse than one that is silent about it. The veto does the eliminating;
      // this only orders what survives.
      add(
        answer.facetId,
        -options.statedWeight * options.softNegativeRatio,
        "stated",
        `she said this would ruin it`
      );
      continue;
    }

    // THE ANSWER'S OWN WEIGHT, and the reason this is a multiplication rather
    // than a constant.
    //
    // Most questions are unordered: old-world Riviera is not more or less than
    // desert modern, so every one of those answers carries weight 1 and this is
    // exactly what it was before db/016. An ORDINAL question is different. "How
    // much of this do you want to make" has four answers on one axis, and a
    // host at the finished end is making a claim AGAINST making things by hand
    // — a negative term in her vector, which pulls the pool toward the most
    // finished things in it and eliminates nothing.
    //
    // That is deliberately not a dealbreaker. A veto is what she said would
    // ruin the evening; this is a preference with a direction, and confusing
    // the two would empty her menu pool over an answer about her afternoon.
    add(
      answer.facetId,
      options.statedWeight * answer.weight,
      "stated",
      answer.weight < 0
        ? `she asked for the other end of this`
        : `she asked for it`
    );
  }

  // ── what we have learned about her ─────────────────────────────────
  if (historyShare > 0) {
    for (const signal of history) {
      if (!signal.facetId) continue;
      const magnitude = signal.strength * signal.confidence;
      const sign =
        signal.polarity === "negative" ? -options.softNegativeRatio : 1;
      add(
        signal.facetId,
        historyShare * magnitude * sign,
        "history",
        `${signal.polarity === "negative" ? "she turned this down" : "she took to this"}` +
          ` (${signal.source}, ${signal.observedAt.slice(0, 10)})`
      );
    }
  }

  // ── her cohort ─────────────────────────────────────────────────────
  if (cohortShare > 0) {
    for (const cohort of cohorts) {
      const share = cohort.weightShare * cohort.confidence;
      if (share <= 0) continue;
      for (const facetId in cohort.facets) {
        const w = cohort.facets[facetId];
        const sign = w < 0 ? options.softNegativeRatio : 1;
        add(
          facetId,
          cohortShare * share * w * sign,
          "cohort",
          `her cohort ${cohort.name} (${cohort.weightShare.toFixed(2)})`
        );
      }
    }
  }

  const weights: Record<string, number> = {};
  for (const facetId in terms) weights[facetId] = terms[facetId].weight;

  return {
    weights,
    terms,
    dealbreakers: [...dealbreakers],
    blend: {
      stated: options.statedWeight,
      history: historyShare,
      cohort: cohortShare,
    },
    evidenceCount: evidence,
  };
}

/**
 * STAGE 3, THE THIRD MECHANISM — inherited facets.
 *
 * The destination contributes its own tags to her vector before a single
 * ingredient is scored, so everything downstream pulls toward it automatically
 * rather than each pool needing its own rule about coherence. This is the whole
 * of "correlate, don't roll independently", and it is nine lines.
 *
 * Returns a new object; the original vector is reused for the other candidates
 * and must not acquire one destination's facets on the way past.
 */
export function inheritDestination(
  vector: PreferenceVector,
  destinationFacets: Record<string, number>,
  options: EngineOptions
): Record<string, number> {
  const scoped: Record<string, number> = { ...vector.weights };
  for (const facetId in destinationFacets) {
    scoped[facetId] =
      (scoped[facetId] ?? 0) +
      options.inheritedFacetWeight * destinationFacets[facetId];
  }
  return scoped;
}

/**
 * The facets that drove a match, strongest first.
 *
 * `agreesOnANo` is the case that has to be reported differently or the sentence
 * is a lie. A destination tagged −0.8 on novelty props, for a woman whose
 * vector carries novelty at −0.11, produces a POSITIVE contribution — the two
 * of them agree, and that agreement is worth points. But "it matched on novelty
 * props and balloons" reads as though the destination has them. It repudiates
 * them, which is why it scored.
 */
export function topMatches(
  vector: PreferenceVector,
  tags: Record<string, number>,
  limit: number
): { facet: Facet; contribution: number; agreesOnANo: boolean }[] {
  const scored: {
    facet: Facet;
    contribution: number;
    agreesOnANo: boolean;
  }[] = [];

  for (const facetId in tags) {
    const v = vector.weights[facetId];
    if (v === undefined) continue;
    const term = vector.terms[facetId];
    if (!term) continue;
    scored.push({
      facet: term.facet,
      contribution: v * tags[facetId],
      agreesOnANo: v < 0 && tags[facetId] < 0,
    });
  }

  return scored
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, limit)
    .filter((entry) => entry.contribution > 0);
}
