/**
 * The pipeline, end to end. Pure: a snapshot in, candidates out.
 *
 * No database handle reaches this file, nothing here writes anything anywhere,
 * and no framework is imported. Two consequences, both deliberate:
 *
 *   · every stage is testable against fixture objects, which is how the
 *     verification in scripts/selection-demo.mjs is actually run;
 *   · persisting a chosen candidate, recording issuance and stamping a
 *     fingerprint belong to the CALLER. Generation will eventually be a job
 *     rather than a request, and an engine that writes as it goes is much
 *     harder to retry safely — the second attempt has to know what the first
 *     one already did.
 *
 * It never delivers on its own. It produces a shortlist for a human.
 */

import { chooseDestinations } from "./destination.ts";
import { explain } from "./explain.ts";
import { fillSlots, scopePools } from "./fill.ts";
import { ensureNovel } from "./novelty.ts";
import { planSlots } from "./occasion.ts";
import { arbitrarySeed, rng } from "./rng.ts";
import { buildVector, inheritDestination } from "./vector.ts";
import {
  withDefaults,
  type BudgetReport,
  type Candidate,
  type CatalogueGap,
  type EngineOptions,
  type Pick,
  type Scale,
  type SelectionInput,
  type SelectionResult,
} from "./types.ts";

export function runSelection(
  input: SelectionInput,
  overrides: Partial<EngineOptions> = {}
): SelectionResult {
  const options = withDefaults(overrides);
  const seed = options.seed ?? arbitrarySeed();
  const random = rng(seed);
  const now = options.now ?? new Date();

  const { application, history, cohorts, catalogue } = input;

  // ── stage 1 ────────────────────────────────────────────────────────
  const vector = buildVector(
    application.stated,
    history,
    cohorts,
    catalogue.facets,
    options
  );

  // ── stage 2 ────────────────────────────────────────────────────────
  const { shortlist, eliminated, impasse } = chooseDestinations(
    catalogue.destinations,
    vector,
    application.occasion,
    options,
    random,
    now
  );

  if (impasse) {
    return { candidates: [], vector, eliminated, impasse, seed, gaps: [] };
  }

  // ── the occasion gate ──────────────────────────────────────────────
  const slots = planSlots(catalogue.slotRules, catalogue.shape, application.scale);

  // Every assemblage already delivered, plus every one produced in this run:
  // two candidates on the same destination must differ from each other, or the
  // curator is choosing between a thing and itself.
  const issued = new Set(catalogue.issuedFingerprints);

  const candidates: Candidate[] = [];
  const allGaps: CatalogueGap[] = [];

  for (let i = 0; i < options.candidateCount; i += 1) {
    // Fewer surviving destinations than candidates asked for: reuse them in
    // shortlist order rather than returning less. The novelty stage guarantees
    // the second one is genuinely a different assemblage.
    const entry = shortlist[i % shortlist.length];
    if (!entry) break;

    const destination = entry.destination;

    // ── stage 3 ──────────────────────────────────────────────────────
    const scopedVector = inheritDestination(vector, destination.facets, options);
    const pools = scopePools(
      slots,
      catalogue.ingredients,
      destination,
      application.occasion,
      scopedVector,
      vector.dealbreakers,
      (facetId) =>
        (catalogue.facets[facetId]?.label ?? facetId).toLowerCase(),
      application.scale,
      options,
      now
    );

    // ── stage 4 ──────────────────────────────────────────────────────
    const fill = fillSlots(pools, application.scale, options);

    const picks: Pick[] = fill.picks.map((pick) => {
      const pool = pools.get(pick.slot.key);
      const total = pool?.candidates.length ?? 0;
      return { ...pick, forced: total === 1, alternatives: Math.max(0, total - 1) };
    });

    // ── stage 5 ──────────────────────────────────────────────────────
    const novelty = ensureNovel(
      picks,
      pools,
      destination.id,
      issued,
      application.scale,
      options
    );
    if (novelty.fingerprint) issued.add(novelty.fingerprint);

    const dropped = [...fill.dropped, ...novelty.dropped];
    const budget = budgetReport(novelty.picks, application.scale);

    const lowConfidence =
      entry.score < options.lowConfidenceScore ||
      fill.gaps.some((gap) => gap.required) ||
      !novelty.novel;

    // ── stage 6 ──────────────────────────────────────────────────────
    const explanation = explain({
      application,
      shape: catalogue.shape,
      vector,
      destination,
      destinationScore: entry.score,
      destinationRank: entry.rank,
      ditheredRank: entry.ditheredRank,
      picks: novelty.picks,
      dropped,
      gaps: fill.gaps,
      swaps: novelty.swaps,
      eliminated,
      budget,
      lowConfidence,
    });

    if (!novelty.novel) {
      explanation.confidence.push(
        `Could not find an unissued assemblage after ${novelty.attempts} local ` +
          `swap${novelty.attempts === 1 ? "" : "s"}. Do not deliver this one — ` +
          `the catalogue is too thin here, which is a house problem and shows up ` +
          `in assemblage_headroom().`
      );
    }

    for (const gap of fill.gaps) {
      if (!allGaps.some((g) => g.pool === gap.pool && g.slotCode === gap.slotCode)) {
        allGaps.push(gap);
      }
    }

    candidates.push({
      rank: candidates.length + 1,
      destination,
      destinationScore: entry.score,
      destinationRank: entry.rank,
      ditheredRank: entry.ditheredRank,
      picks: novelty.picks,
      dropped,
      gaps: fill.gaps,
      swaps: novelty.swaps,
      fingerprint: novelty.fingerprint,
      budget,
      score: novelty.picks.reduce((sum, pick) => sum + pick.score, 0),
      lowConfidence,
      explanation,
    });
  }

  return { candidates, vector, eliminated, impasse: null, seed, gaps: allGaps };
}

/**
 * The money, stated the way a host can act on it.
 *
 * Per head as well as in total, because "$40 a head over" is a sentence
 * somebody can do something about and "$680 over" is a number.
 */
function budgetReport(picks: readonly Pick[], scale: Scale): BudgetReport {
  const totalCents = picks.reduce((sum, pick) => sum + (pick.lineCost ?? 0), 0);
  const guests = scale.guestsHigh ?? scale.guestsPlanning ?? null;

  const overage =
    scale.budgetCeiling === null
      ? null
      : Math.max(0, totalCents / 100 - scale.budgetCeiling);

  return {
    guests,
    guestsAreConfirmed: scale.guestsHigh !== null,
    planning: scale.budgetPlanning,
    ceiling: scale.budgetCeiling,
    totalCents,
    totalPerHeadCents:
      guests && guests > 0 ? Math.round(totalCents / guests) : null,
    overage: overage !== null && overage > 0 ? Math.round(overage) : null,
    overagePerHead:
      overage !== null && overage > 0 && guests && guests > 0
        ? Math.round(overage / guests)
        : null,
    unbounded: scale.budgetCeiling === null,
    unpricedItems: picks
      .filter((pick) => pick.unitCost === null)
      .map((pick) => pick.ingredient.name),
  };
}
