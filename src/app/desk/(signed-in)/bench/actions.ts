"use server";

import {
  answersFromForm,
  benchErrors,
  randomAnswers,
} from "@/lib/desk/bench-answers";
import { compareRuns, runBench, type BenchRun } from "@/lib/desk/bench";
import { requireStaff } from "@/lib/staff";

import { arbitraryBenchSeed, type BenchState } from "./state";

/**
 * The bench's one Server Action.
 *
 * ── IT IS GUARDED, AND IT WRITES NOTHING ─────────────────────────────
 *
 * `requireStaff()` first, like every other action at the desk: an action is its
 * own entry point and is reachable without rendering the page whose form calls
 * it. There is no `recordAction` beside it, and that is deliberate rather than
 * forgotten — the ledger records what somebody CHANGED, and a bench run changes
 * nothing. See the head of src/lib/desk/bench.ts for the full list of what a
 * run does not leave behind.
 *
 * ── WHY ONE ACTION AND NOT FOUR ──────────────────────────────────────
 *
 * `useActionState` threads one action, and the previous run has to survive the
 * next one or there is nothing to compare against. Four actions would each need
 * their own copy of that state. So the submitter says what it wants in
 * `intent`, which is what a submit button's name and value are for.
 *
 * ── AND NO revalidatePath ────────────────────────────────────────────
 *
 * Nothing was written, so there is no cached page anywhere that is now wrong.
 */
export async function benchAction(
  previous: BenchState,
  form: FormData
): Promise<BenchState> {
  await requireStaff();

  const intent = String(form.get("intent") ?? "run");
  const answers = answersFromForm(form);
  const seed = readSeed(form, previous.seed);

  if (intent === "roll") {
    // A new host, and a new seed with her. Rolling a twentieth person while
    // holding the dither fixed would be measuring the wrong thing: the seed is
    // held constant to compare two CATALOGUES, not two hosts.
    return {
      ...previous,
      formKey: previous.formKey + 1,
      answers: randomAnswers(),
      seed: arbitraryBenchSeed(),
      errors: [],
    };
  }

  if (intent === "seed") {
    return {
      ...previous,
      formKey: previous.formKey + 1,
      answers,
      seed: arbitraryBenchSeed(),
      errors: [],
    };
  }

  const errors = benchErrors(answers);
  if (errors.length > 0) {
    return {
      ...previous,
      formKey: previous.formKey + 1,
      answers,
      seed,
      errors: [...new Set(errors)],
    };
  }

  let run: BenchRun;
  try {
    run = await runBench(answers, seed);
  } catch (err) {
    return {
      ...previous,
      formKey: previous.formKey + 1,
      answers,
      seed,
      errors: [err instanceof Error ? err.message : String(err)],
    };
  }

  // THE PREVIOUS RUN IS KEPT, and only the previous one. Two is what a
  // comparison needs; a history of ten would be a log, and a log is a different
  // tool that nobody asked for.
  return {
    formKey: previous.formKey + 1,
    answers,
    seed,
    errors: [],
    current: run,
    previous: previous.current,
    diff: previous.current ? compareRuns(previous.current, run) : null,
  };
}

function readSeed(form: FormData, fallback: number): number {
  const raw = String(form.get("seed") ?? "").trim();
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return fallback;
  // The engine's rng takes any integer. Truncating rather than rejecting means
  // a curator who types 1.5 gets a run instead of a refusal about a seed.
  return Math.trunc(parsed);
}
