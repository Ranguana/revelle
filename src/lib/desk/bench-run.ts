/**
 * WHAT A BENCH RUN LOOKS LIKE, AND WHAT CHANGED BETWEEN TWO OF THEM.
 *
 * Framework-free and database-free on purpose: `node --test` loads this file
 * directly, which is the only way the comparison is ever going to be trusted.
 * A diff that quietly stops noticing a moved pick is worse than no diff at all
 * — it is a screen telling a curator that her change did nothing.
 *
 * The run itself lives in src/lib/desk/bench.ts, which reads a database. It
 * imports these shapes and re-exports them, so a caller only ever needs one of
 * the two.
 */

import type {
  BudgetReport,
  CatalogueGap,
  Emphasis,
  ExcludedSlot,
  Explanation,
} from "../selection/types.ts";
import type { QuizAnswers } from "../quiz.ts";

/* ── what a run produces, for a screen ──────────────────────────────── */

export type BenchPick = {
  slotKey: string;
  slotLabel: string;
  pool: string;
  name: string;
  quantity: number;
  perGuest: boolean;
  lineCostCents: number | null;
  forced: boolean;
  alternatives: number;
  score: number;
};

export type BenchCandidate = {
  rank: number;
  destinationId: string;
  destinationName: string;
  tagline: string;
  destinationScore: number;
  destinationRank: number;
  ditheredRank: number;
  fingerprint: string | null;
  blocked: string | null;
  lowConfidence: boolean;
  budget: BudgetReport;
  picks: BenchPick[];
  explanation: Explanation;
};

export type BenchElimination = {
  destinationName: string;
  tier: "dealbreaker" | "occasion" | "voice";
  reason: string;
  toneMatch: number | null;
};

export type BenchRun = {
  /** Milliseconds, so two runs in the same session are distinguishable. */
  ranAt: string;
  seed: number;
  /** Echoed so the form redraws exactly what produced this. */
  answers: QuizAnswers;
  impasse: string | null;
  candidates: BenchCandidate[];
  eliminated: BenchElimination[];
  gaps: CatalogueGap[];
  excluded: ExcludedSlot[];
  emphasis: Emphasis;
  /** What her answers came to, strongest first. */
  vector: {
    terms: { label: string; dimension: string; weight: number; because: string }[];
    dealbreakers: string[];
    blend: { stated: number; history: number; cohort: number };
    evidenceCount: number;
  };
  /** What the run was measured against, so a stale bench is visible. */
  library: {
    destinations: number;
    ingredients: number;
    slotsPlanned: number;
  };
};


/* ── comparing two runs ─────────────────────────────────────────────── */

export type BenchDiff = {
  seed: { from: number; to: number } | null;
  /** Field ids whose answers differ. */
  answers: string[];
  /** A destination's place in the shortlist, before and after. */
  destinations: { name: string; from: number | null; to: number | null }[];
  /** The chosen destination, when it is not the same one. */
  chosen: { from: string; to: string } | null;
  /** Slot by slot, for the candidate at rank one. */
  picks: { slotLabel: string; from: string | null; to: string | null }[];
  gapsOpened: string[];
  gapsClosed: string[];
  /** True when nothing at all moved. Worth saying out loud. */
  identical: boolean;
};

/**
 * WHAT MOVED — the affordance that makes this a bench rather than a preview.
 *
 * Watching a pick move when a scoping is toggled is the entire point of the
 * tool, and a curator should not have to hold two screens in her head to see
 * it. So the previous run is kept beside the new one and the differences are
 * named: the shortlist's order, the chosen destination, each slot's pick, and
 * the gaps that opened or closed.
 *
 * `identical` is reported rather than inferred by the reader. Same seed, same
 * answers, same catalogue means the same result, and a run that proves it is
 * as useful as one that shows a change — it is what tells her the dither is not
 * what she is looking at.
 */
export function compareRuns(before: BenchRun, after: BenchRun): BenchDiff {
  const seed =
    before.seed === after.seed ? null : { from: before.seed, to: after.seed };

  const answers: string[] = [];
  const ids = new Set([
    ...Object.keys(before.answers),
    ...Object.keys(after.answers),
  ]);
  for (const id of ids) {
    if (answerKey(before.answers[id]) !== answerKey(after.answers[id])) {
      answers.push(id);
    }
  }
  answers.sort();

  const rankBefore = new Map(
    before.candidates.map((c) => [c.destinationName, c.rank])
  );
  const rankAfter = new Map(
    after.candidates.map((c) => [c.destinationName, c.rank])
  );

  const destinations: BenchDiff["destinations"] = [];
  for (const name of new Set([...rankBefore.keys(), ...rankAfter.keys()])) {
    const from = rankBefore.get(name) ?? null;
    const to = rankAfter.get(name) ?? null;
    if (from !== to) destinations.push({ name, from, to });
  }
  destinations.sort((a, b) => (a.to ?? 99) - (b.to ?? 99));

  const oldChosen = before.candidates[0] ?? null;
  const newChosen = after.candidates[0] ?? null;
  const chosen =
    oldChosen && newChosen && oldChosen.destinationName !== newChosen.destinationName
      ? { from: oldChosen.destinationName, to: newChosen.destinationName }
      : null;

  // Keyed on the SLOT, not on the position: a slot that lost its pick and a
  // slot that gained one have to line up, or a single change reads as two.
  const picksBefore = new Map(
    (oldChosen?.picks ?? []).map((p) => [p.slotKey, p])
  );
  const picksAfter = new Map((newChosen?.picks ?? []).map((p) => [p.slotKey, p]));

  const picks: BenchDiff["picks"] = [];
  for (const key of new Set([...picksBefore.keys(), ...picksAfter.keys()])) {
    const from = picksBefore.get(key) ?? null;
    const to = picksAfter.get(key) ?? null;
    if ((from?.name ?? null) === (to?.name ?? null)) continue;
    picks.push({
      slotLabel: to?.slotLabel ?? from?.slotLabel ?? key,
      from: from?.name ?? null,
      to: to?.name ?? null,
    });
  }
  picks.sort((a, b) => a.slotLabel.localeCompare(b.slotLabel));

  const gapKey = (gap: CatalogueGap) => `${gap.pool}:${gap.slotCode}`;
  const gapsBefore = new Map(before.gaps.map((g) => [gapKey(g), g.slotLabel]));
  const gapsAfter = new Map(after.gaps.map((g) => [gapKey(g), g.slotLabel]));

  const gapsOpened: string[] = [];
  const gapsClosed: string[] = [];
  for (const [key, label] of gapsAfter) {
    if (!gapsBefore.has(key)) gapsOpened.push(label);
  }
  for (const [key, label] of gapsBefore) {
    if (!gapsAfter.has(key)) gapsClosed.push(label);
  }

  return {
    seed,
    answers,
    destinations,
    chosen,
    picks,
    gapsOpened,
    gapsClosed,
    identical:
      seed === null &&
      answers.length === 0 &&
      destinations.length === 0 &&
      chosen === null &&
      picks.length === 0 &&
      gapsOpened.length === 0 &&
      gapsClosed.length === 0,
  };
}

/** Order within a multi-select answer is not an answer. */
function answerKey(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return [...value].sort().join("|");
  return value ?? "";
}

