import type { BenchDiff, BenchRun } from "@/lib/desk/bench";
import type { QuizAnswers } from "@/lib/quiz";

/**
 * What the bench holds between two clicks.
 *
 * Its own module rather than a corner of actions.ts, because a "use server"
 * file may only export async functions — a constant exported beside an action
 * is a build error, and the seed default and the empty state are both
 * constants. The BenchRun types are imported for their SHAPE only, so the
 * server-only module they live in never reaches a browser bundle.
 */
export type BenchState = {
  /** Bumped on every action, to redraw the form from what the server echoed. */
  formKey: number;
  answers: QuizAnswers;
  seed: number;
  errors: string[];
  current: BenchRun | null;
  previous: BenchRun | null;
  diff: BenchDiff | null;
};

/**
 * A seed a person can read, retype and recognise. The engine takes any integer;
 * six digits is enough to tell two runs apart and short enough to say out loud
 * across a desk.
 */
export function arbitraryBenchSeed(): number {
  return Math.floor(Math.random() * 900_000) + 100_000;
}

export const EMPTY_BENCH: BenchState = {
  formKey: 0,
  answers: {},
  seed: 481_516,
  errors: [],
  current: null,
  previous: null,
  diff: null,
};
