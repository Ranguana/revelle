/**
 * STAGE 6 — the account.
 *
 * "The layer that says 'dropped the premium glassware to stay under budget' has
 * to be our code. No solver produces that sentence, and practitioners
 * consistently rank transparency over automation."
 *
 * Every sentence in this file is assembled from facts the earlier stages
 * recorded as they went. Nothing here re-derives anything, nothing here calls a
 * language model, and nothing here is allowed to say something the engine did
 * not actually do — which is the one rule that makes an explanation worth
 * reading twice.
 *
 * The curator's four questions, in order:
 *
 *   why this destination        the facets that matched
 *   what eliminated the others  the dealbreakers, named
 *   what was forced             the slots that had one candidate
 *   what was dropped, and why   budget, a thin pool, or a collision
 *
 * And her free-text answer, verbatim and prominent — never summarised, never
 * parsed, because it is the one part of the application a machine has no
 * business interpreting.
 */

import { formatCents } from "./fill.ts";
import { humanOccasion } from "./occasion.ts";
import { topMatches } from "./vector.ts";
import type {
  Application,
  BudgetReport,
  CatalogueGap,
  Destination,
  DroppedPick,
  Explanation,
  OccasionShape,
  Pick,
  PreferenceVector,
  Elimination,
  Swap,
} from "./types.ts";

export type ExplainInput = {
  application: Application;
  shape: OccasionShape;
  vector: PreferenceVector;
  destination: Destination;
  destinationScore: number;
  destinationRank: number;
  ditheredRank: number;
  picks: Pick[];
  dropped: DroppedPick[];
  gaps: CatalogueGap[];
  swaps: Swap[];
  eliminated: Elimination[];
  budget: BudgetReport;
  lowConfidence: boolean;
};

export function explain(input: ExplainInput): Explanation {
  const {
    application,
    shape,
    vector,
    destination,
    destinationScore,
    picks,
    dropped,
    gaps,
    swaps,
    eliminated,
    budget,
  } = input;

  const occasion = humanOccasion(application.occasion);

  const headline =
    `${destination.name} for a ${occasion}` +
    (shape.days > 1 ? ` over ${shape.days} days` : "") +
    `, ${picks.length} ingredient${picks.length === 1 ? "" : "s"} placed.`;

  // ── why this destination ───────────────────────────────────────────
  const matches = topMatches(vector, destination.facets, 5);
  const positives = matches.filter((m) => !m.agreesOnANo);
  const agreements = matches.filter((m) => m.agreesOnANo);
  const why: string[] = [];

  if (positives.length > 0) {
    why.push(
      `${destination.name} matched on ${list(positives.map((m) => m.facet.label.toLowerCase()))} — ` +
        `${(destinationScore * 100).toFixed(0)} against her preference vector.`
    );
  } else {
    why.push(
      `${destination.name} scored ${(destinationScore * 100).toFixed(0)} and shares no ` +
        `named facet with her answers. Worth a second look before it goes out.`
    );
  }

  if (agreements.length > 0) {
    why.push(
      `It also repudiates ${list(agreements.map((m) => m.facet.label.toLowerCase()))}, ` +
        `which she is against. Agreeing about a no counts.`
    );
  }

  const stated = positives.filter((m) =>
    vector.terms[m.facet.id]?.contributions.some(
      (c) => c.source === "stated" && c.weight > 0
    )
  );
  if (stated.length > 0) {
    why.push(
      `She asked for ${list(stated.map((m) => m.facet.label.toLowerCase()))} by name.`
    );
  }

  const fromCohort = positives.filter((m) =>
    vector.terms[m.facet.id]?.contributions.some((c) => c.source === "cohort")
  );
  if (fromCohort.length > 0 && vector.evidenceCount < 12) {
    why.push(
      `${list(fromCohort.map((m) => m.facet.label.toLowerCase()))} came mostly from her cohort — ` +
        `she has ${vector.evidenceCount} signal${vector.evidenceCount === 1 ? "" : "s"} of her own, ` +
        `so the prior is carrying ${(vector.blend.cohort * 100).toFixed(0)}% of the weight.`
    );
  }

  if (input.ditheredRank !== input.destinationRank) {
    why.push(
      `On merit it ranked ${ordinal(input.destinationRank)}; the shortlist is ` +
        `dithered, so it is shown ${ordinal(input.ditheredRank)}. The shuffle is on ` +
        `this list only — nothing is dithered on the way to a customer.`
    );
  }

  // ── what eliminated the others ─────────────────────────────────────
  const ruledOut = eliminated.map(
    (entry) => `${entry.destinationName} — ${entry.reason}.`
  );

  // ── what the occasion decided ──────────────────────────────────────
  const forced: string[] = [];
  forced.push(
    `A ${occasion} has ${countSlots(picks)}. ${shapeSentence(shape, application)}`
  );

  for (const pick of picks) {
    if (pick.forced) {
      forced.push(
        `"${pick.slot.label}" was forced: ${pick.ingredient.name} is the only ` +
          `thing in the ${pick.slot.pool} pool that fits this destination and this occasion.`
      );
    }
  }

  for (const pick of picks) {
    if (pick.slot.perGuest) {
      forced.push(
        `${pick.ingredient.name} is counted per head: ${pick.slot.quantity} of them` +
          (budget.guestsAreConfirmed
            ? `, from the top of her guest band.`
            : `, from her planning number — her band has no top, so confirm the ` +
              `count with her before anything is printed or bought.`)
      );
    }
  }

  // ── what was dropped ───────────────────────────────────────────────
  // One line per thing dropped, not one per slot it was dropped from. The
  // beam evaluates the same unaffordable item against every optional slot in a
  // repeated group, and three identical sentences read as three separate
  // events.
  const seenDrops = new Set<string>();
  const dropSentences: string[] = [];
  for (const entry of dropped) {
    const key = `${entry.ingredientName}|${entry.reason}`;
    if (seenDrops.has(key)) continue;
    seenDrops.add(key);
    dropSentences.push(`${entry.ingredientName} — ${entry.detail}`);
  }

  // ── what moved, and why ────────────────────────────────────────────
  const swapSentences = swaps.map(
    (swap) =>
      `${swap.slotLabel}: ${swap.from} → ${swap.to}. ${capitalise(swap.reason)}`
  );

  // ── the money ──────────────────────────────────────────────────────
  const money = budgetSentences(budget);

  // ── the catalogue's own problems ───────────────────────────────────
  const gapSentences = gaps.map(
    (gap) =>
      `${gap.required ? "REQUIRED" : "Optional"} slot "${gap.slotLabel}" is unfilled. ${gap.detail}`
  );

  // ── when a human must look ─────────────────────────────────────────
  const confidence: string[] = [];
  if (input.lowConfidence) {
    confidence.push(
      `Weak match overall (${(destinationScore * 100).toFixed(0)}). Mandatory review, ` +
        `whatever the sampling rate.`
    );
  }
  if (vector.evidenceCount === 0) {
    confidence.push(
      `First Revelle — nothing of her own in the profile yet, so this is her ` +
        `answers and a cohort prior and nothing else.`
    );
  }
  if (application.occasion === "other" && application.occasionOther) {
    confidence.push(
      `The occasion is her own words — "${application.occasionOther}" — and the ` +
        `slot plan is the default one. A human should read it and change the plan.`
    );
  }
  if (gaps.some((gap) => gap.required)) {
    confidence.push(
      `A required slot could not be filled. That is a catalogue gap, not a ` +
        `customer-facing error, and it is the house's problem to author out.`
    );
  }

  return {
    headline,
    destination: why,
    eliminated: ruledOut,
    forced,
    dropped: dropSentences,
    swapped: swapSentences,
    budget: money,
    gaps: gapSentences,
    confidence,
    secret: application.secret,
  };
}

function budgetSentences(budget: BudgetReport): string[] {
  const lines: string[] = [];

  if (budget.unbounded) {
    lines.push(
      `No ceiling exists — ${
        budget.planning === null
          ? `she said "not sure yet"`
          : `one of her bands is open-topped`
      }. Built to the register; the curator prices this by hand. Nothing was ` +
        `substituted for a middle band.`
    );
  }

  lines.push(
    `${formatCents(budget.totalCents)} of pooled ingredients` +
      (budget.totalPerHeadCents !== null
        ? `, ${formatCents(budget.totalPerHeadCents)} a head`
        : "") +
      (budget.planning !== null
        ? ` against ${formatDollars(budget.planning)} planned`
        : "") +
      (budget.ceiling !== null
        ? ` and a ${formatDollars(budget.ceiling)} ceiling.`
        : ".")
  );

  if (budget.overage !== null && budget.overage > 0) {
    lines.push(
      `OVER by ${formatDollars(budget.overage)}` +
        (budget.overagePerHead !== null
          ? ` — ${formatDollars(budget.overagePerHead)} a head`
          : "") +
        `. This is the closest complete candidate; the required slots could not ` +
        `be filled for less.`
    );
  }

  if (budget.unpricedItems.length > 0) {
    lines.push(
      `Not counted, because nobody has priced ${
        budget.unpricedItems.length === 1 ? "it" : "them"
      } yet: ${list(budget.unpricedItems)}.`
    );
  }

  return lines;
}

function shapeSentence(shape: OccasionShape, application: Application): string {
  if (application.occasion === "other") {
    return `Shape unknown until someone reads her words, so it is planned as one evening.`;
  }
  return shape.note;
}

function countSlots(picks: readonly Pick[]): string {
  const bySlot = new Map<string, number>();
  for (const pick of picks) {
    bySlot.set(pick.slot.slotCode, (bySlot.get(pick.slot.slotCode) ?? 0) + 1);
  }
  const parts = [...bySlot.entries()].map(([code, n]) =>
    n === 1 ? code.replace(/_/g, " ") : `${n} × ${code.replace(/_/g, " ")}`
  );
  return list(parts);
}

function list(words: readonly string[]): string {
  if (words.length === 0) return "nothing";
  if (words.length === 1) return words[0];
  return `${words.slice(0, -1).join(", ")} and ${words[words.length - 1]}`;
}

function ordinal(n: number): string {
  const suffix =
    n % 100 >= 11 && n % 100 <= 13
      ? "th"
      : n % 10 === 1
        ? "st"
        : n % 10 === 2
          ? "nd"
          : n % 10 === 3
            ? "rd"
            : "th";
  return `${n}${suffix}`;
}

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatDollars(amount: number): string {
  return `$${amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}
