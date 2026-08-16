/**
 * A HYPOTHETICAL HOST, AS ANSWERS.
 *
 * Framework-free, and deliberately so: this is imported by the bench's client
 * component AND by the Server Action behind it, and both must agree about what
 * a well-formed set of answers is. No React, no "server-only", no database, and
 * nothing from src/lib/selection — the engine's own modules are large and have
 * no business in a browser bundle.
 *
 * Everything here is derived from QUIZ_STEPS. There is no second list of
 * questions anywhere in this file, and there must never be one: a question
 * added to src/lib/quiz.ts has to appear on the bench without anybody
 * remembering, or the bench quietly stops testing the thing it exists to test.
 */

import {
  FIELDS,
  QUIZ_STEPS,
  isFieldActive,
  stepErrors,
  type QuizAnswers,
  type QuizField,
} from "../quiz.ts";

/**
 * Every field the bench renders, in the order she would be asked.
 *
 * `email` is dropped, and it is the only field this list refuses. The engine
 * never reads an address — it reaches `Application.customerEmail` and stops —
 * and asking for one on a bench that writes nothing would invite somebody to
 * type a real customer's address into a tool that then looks like it did
 * something with it.
 */
export const BENCH_FIELDS: readonly { step: string; field: QuizField }[] =
  QUIZ_STEPS.flatMap((step) =>
    step.fields
      .filter((field) => field.type !== "email")
      .map((field) => ({ step: step.key, field }))
  );

/**
 * Answers off a submitted form, coerced the way the quiz route coerces them.
 *
 * Multi fields become arrays even when nothing was ticked, because the minimum
 * rules cannot fire against `undefined` — the same correction
 * src/app/api/quiz/route.ts makes for the same reason.
 */
export function answersFromForm(form: {
  get(name: string): unknown;
  getAll(name: string): unknown[];
}): QuizAnswers {
  const answers: QuizAnswers = {};

  for (const field of Object.values(FIELDS)) {
    if (field.type === "multi") {
      answers[field.id] = Array.from(
        new Set(
          form
            .getAll(field.id)
            .map((value) => String(value))
            .filter((value) => value.length > 0)
        )
      );
      continue;
    }
    const value = form.get(field.id);
    if (typeof value === "string") answers[field.id] = value;
  }

  return answers;
}

/**
 * Is this host answerable? The quiz's own rules, minus the address.
 *
 * `allErrors` cannot be used directly because it walks every step including the
 * delivery step, and the bench never asks for an address. Everything else is
 * `stepErrors` unchanged — the same function the client and the submission
 * route both run, so the bench refuses exactly what a real application would
 * be refused and nothing more. A bench that accepted an application the product
 * would reject would be a bench testing a host who cannot exist.
 */
export function benchErrors(answers: QuizAnswers): string[] {
  return QUIZ_STEPS.flatMap((step) =>
    stepErrors(
      { ...step, fields: step.fields.filter((field) => field.type !== "email") },
      answers
    )
  );
}

/** The value of a single-select or text field, for a defaultValue. */
export function single(answers: QuizAnswers, id: string): string {
  const value = answers[id];
  return typeof value === "string" ? value : "";
}

/** The values of a multi field, as a set, for defaultChecked. */
export function chosen(answers: QuizAnswers, id: string): ReadonlySet<string> {
  const value = answers[id];
  return new Set(Array.isArray(value) ? value : []);
}

/**
 * ROLL THE DICE — a plausible host, from the question set itself.
 *
 * Trying twenty different people should cost twenty clicks rather than twenty
 * forms. Every answer is drawn from the options the quiz actually offers, at a
 * count inside the field's own min and max, so a rolled host always validates:
 * the bench is for watching the engine move, not for practising form-filling.
 *
 * The free text is left EMPTY. Her one paragraph is the most valuable thing an
 * application carries and inventing one would put a machine's sentence where a
 * curator is meant to read a person's — it also touches nothing the engine
 * decides on, so a fake one would buy nothing and cost the honesty.
 */
export function randomAnswers(random: () => number = Math.random): QuizAnswers {
  const answers: QuizAnswers = {};

  const pick = <T,>(list: readonly T[]): T =>
    list[Math.floor(random() * list.length) % list.length];

  for (const { field } of BENCH_FIELDS) {
    switch (field.type) {
      case "single": {
        // `revealsTextField` names the option that opens a free-text box —
        // "something else". Rolled hosts do not take it: the box it opens is
        // her own words, and the same argument as `secret` applies.
        const options = field.revealsTextField
          ? field.options.filter((o) => o.code !== field.revealsTextField)
          : field.options;
        answers[field.id] = pick(options).code;
        break;
      }
      case "multi": {
        const span = field.max - field.min + 1;
        const want = field.min + Math.floor(random() * span);
        const pool = [...field.options];
        const taken: string[] = [];
        while (taken.length < want && pool.length > 0) {
          const index = Math.floor(random() * pool.length) % pool.length;
          taken.push(pool.splice(index, 1)[0].code);
        }
        answers[field.id] = taken;
        break;
      }
      case "text":
        answers[field.id] = "";
        break;
      default:
        break;
    }
  }

  // A conditional field that is not active must not carry a value: the quiz's
  // own validator skips it, and leaving a stale answer behind would make the
  // bench's form and the bench's run disagree about what was asked.
  for (const { field } of BENCH_FIELDS) {
    if (!isFieldActive(field, answers)) delete answers[field.id];
  }

  return answers;
}
