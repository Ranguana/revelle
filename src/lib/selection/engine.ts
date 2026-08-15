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
import { buildEmphasis } from "./emphasis.ts";
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

/**
 * WHAT AN UNFILLABLE SLOT DOES, AND DOES NOT DO.
 *
 * It does not stop a candidate being produced, it does not stop one being
 * delivered, and it does not reach her. A slot the catalogue could not fill
 * leaves her Revelle one piece smaller and nothing else — no error, no
 * placeholder, no apology. The signal goes to the curator (`gaps`,
 * explanation.gaps, and lowConfidence when the slot was required) because the
 * pool needs authoring, and it goes nowhere else. See member.ts.
 *
 * Exactly one thing withholds a whole candidate, and it is not a gap: an
 * assemblage that has already been delivered to someone. Two women must not
 * receive the same object.
 */

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

  // ── stage 1½ — WHICH DELIVERABLE SHE VALUES ────────────────────────
  //
  // Built beside the vector and deliberately not inside it. "What do you want
  // more of" is the only question on the quiz that names a deliverable, and
  // averaging it into taste weights is what destroyed that information. See
  // emphasis.ts, and the `affinity` entry in vector.ts's non-taste list.
  const emphasis = buildEmphasis(application.stated);

  // ── stage 2 ────────────────────────────────────────────────────────
  const {
    shortlist,
    eliminated,
    impasse,
    gaps: destinationGaps,
  } = chooseDestinations(
    catalogue.destinations,
    vector,
    application.occasion,
    catalogue.facets,
    options,
    random,
    now
  );

  // ── the occasion gate, her own exclusions, and her emphasis ────────
  // Planned before the impasse check returns, so that "she is not serving
  // food" is on the record even in a run that produced nothing: the curator
  // must be able to see it, and it must never look like something to author.
  const plan = planSlots(
    catalogue.slotRules,
    catalogue.shape,
    application.scale,
    application.exclusions,
    emphasis.guaranteed
  );
  const slots = plan.slots;

  if (impasse) {
    return {
      candidates: [],
      vector,
      emphasis,
      eliminated,
      impasse,
      seed,
      // A taste/voice clash is a work order whether or not anything else
      // survived, and it is the one gap discovered before any pool is scoped.
      gaps: destinationGaps,
      excluded: plan.excluded,
    };
  }

  // Every assemblage already delivered, plus every one produced in this run:
  // two candidates on the same destination must differ from each other, or the
  // curator is choosing between a thing and itself.
  const issued = new Set(catalogue.issuedFingerprints);

  const candidates: Candidate[] = [];
  // The stage-2 clash gap is already a work order and goes in first: it was
  // discovered before a single pool was scoped, and it is the one that says
  // which destination to author rather than which ingredient.
  const allGaps: CatalogueGap[] = [...destinationGaps];

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
      // THE ROOM, and the only stage it is allowed to act on.
      // Absent on a hand-built snapshot, which means the same as null: no room
      // is known, so nothing is pruned.
      catalogue.venue ?? null,
      options,
      now
    );

    // ── stage 4 ──────────────────────────────────────────────────────
    // The occasion's shape goes in as well as her scale: it carries how many
    // blocks the evening has for a game that stops the room.
    const fill = fillSlots(pools, application.scale, catalogue.shape, options);

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

    // MANDATORY CURATOR REVIEW, which is not the same as a downgrade. A
    // required slot the catalogue could not fill flags this candidate for a
    // human — the house should look at a thin pool — and changes nothing about
    // what she receives.
    const lowConfidence =
      entry.score < options.lowConfidenceScore ||
      fill.gaps.some((gap) => gap.required) ||
      !novelty.novel;

    // THE ONE VERDICT THAT WITHHOLDS. Assemblage uniqueness, and nothing else:
    // this exact set has been delivered before, and delivering it again would
    // make two women's Revelles the same object. Its wording never leaves the
    // house side — memberRevelle() refuses a blocked candidate outright.
    const blocked = novelty.novel
      ? null
      : `Could not find an unissued assemblage after ${novelty.attempts} local ` +
        `swap${novelty.attempts === 1 ? "" : "s"}. Do not deliver this one — ` +
        `the catalogue is too thin here, which is a house problem and shows up ` +
        `in assemblage_headroom().`;

    // ── stage 6 ──────────────────────────────────────────────────────
    const explanation = explain({
      application,
      shape: catalogue.shape,
      vector,
      emphasis,
      venue: catalogue.venue ?? null,
      pools,
      toneMatch: entry.toneMatch,
      toneThreshold: options.toneThreshold,
      destination,
      destinationScore: entry.score,
      destinationRank: entry.rank,
      ditheredRank: entry.ditheredRank,
      picks: novelty.picks,
      dropped,
      gaps: fill.gaps,
      excluded: plan.excluded,
      swaps: novelty.swaps,
      eliminated,
      budget,
      lowConfidence,
      blocked,
    });

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
      blocked,
      explanation,
    });
  }

  return {
    candidates,
    vector,
    emphasis,
    eliminated,
    impasse: null,
    seed,
    gaps: allGaps,
    excluded: plan.excluded,
  };
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
