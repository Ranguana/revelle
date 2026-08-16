"use client";

import { useActionState } from "react";

import { chosen, single } from "@/lib/desk/bench-answers";
import {
  QUIZ_STEPS,
  isFieldActive,
  type MultiField,
  type QuizField,
  type SingleField,
  type TextField,
} from "@/lib/quiz";

import styles from "../../desk.module.css";
import { benchAction } from "./actions";
import Compare from "./Compare";
import RunView from "./RunView";
import { EMPTY_BENCH, type BenchState } from "./state";

/**
 * THE HOST, COMPOSED.
 *
 * ── THE FORM IS BUILT FROM QUIZ_STEPS AND NOWHERE ELSE ───────────────
 *
 * Not a hand-listed set of fields that happens to match today's questions. A
 * question added to src/lib/quiz.ts appears here on the next render, in the
 * step it was added to, validated by the same `stepErrors` the submission route
 * runs — and a question REMOVED disappears, rather than lingering as a control
 * that writes an answer nothing resolves. The bench exists to tell a curator
 * what the engine does with an application; a bench asking a different set of
 * questions from the application would be lying about the one thing it is for.
 *
 * ── WHY THE FORM IS REDRAWN FROM THE SERVER'S ECHO ───────────────────
 *
 * Every action returns the answers it was given, and the fields are remounted
 * against them (`formKey`). That is what lets "roll the dice" replace fourteen
 * answers at once without a line of client state, and it means the form on
 * screen is always the form the last run was made from — which matters, because
 * a curator reading a result against a form that has drifted from it is reading
 * a result for somebody else.
 */

export default function BenchForm() {
  const [state, action, pending] = useActionState<BenchState, FormData>(
    benchAction,
    EMPTY_BENCH
  );

  return (
    <form action={action}>
      <div key={state.formKey}>
        {/*
          The controls first and stuck to the top, not at the foot of a form
          two screens long. See .benchBar in desk.module.css.
        */}
        <section className={styles.benchBar}>
          <div className={styles.buttonRow}>
            <div className={styles.field} style={{ maxWidth: "8rem" }}>
              <label className={styles.label} htmlFor="seed">
                Seed
              </label>
              <input
                id="seed"
                name="seed"
                type="number"
                defaultValue={state.seed}
                className={styles.input}
              />
            </div>
            <button
              className={styles.button}
              name="intent"
              value="run"
              disabled={pending}
            >
              {pending ? "Running" : "Run it"}
            </button>
            <button
              className={styles.buttonQuiet}
              name="intent"
              value="seed"
              disabled={pending}
            >
              New seed
            </button>
            <button
              className={styles.buttonQuiet}
              name="intent"
              value="roll"
              disabled={pending}
            >
              Roll the dice
            </button>
            <span className={styles.hint} style={{ maxWidth: "38rem" }}>
              The seed is the engine&apos;s dither. Hold it and the same answers
              against the same catalogue give the same result every time, so a
              pick that moves moved because something you changed moved it.
              Rolling gives you a plausible host and a new seed, drawn from the
              questions themselves. Nothing is written either way.
            </span>
          </div>

          {state.errors.length > 0 ? (
            <p className={styles.error} style={{ marginTop: "0.625rem" }}>
              {state.errors.join("\n")}
            </p>
          ) : null}
        </section>

        <section className={styles.panel}>
          <h2 className={styles.panelHead}>
            <span>The application</span>
            <span>src/lib/quiz.ts</span>
          </h2>

          {QUIZ_STEPS.map((step) => {
            const fields = step.fields.filter((field) => field.type !== "email");
            if (fields.length === 0) return null;
            return (
              <fieldset key={step.key} className={styles.facetBlock} style={{ marginBottom: "0.5rem" }}>
                <p className={styles.facetDimension}>
                  {step.eyebrow} — {step.title}
                </p>
                {fields.map((field) => (
                  <Field key={field.id} field={field} state={state} />
                ))}
              </fieldset>
            );
          })}
        </section>

      </div>

      {state.diff && state.previous && state.current ? (
        <Compare
          diff={state.diff}
          before={state.previous}
          after={state.current}
        />
      ) : null}

      {state.current ? <RunView run={state.current} /> : null}
    </form>
  );
}

function Field({ field, state }: { field: QuizField; state: BenchState }) {
  switch (field.type) {
    case "single":
      return <Single field={field} state={state} />;
    case "multi":
      return <Multi field={field} state={state} />;
    case "text":
      return <Text field={field} state={state} />;
    default:
      return null;
  }
}

/**
 * A single-select as a select, not as a run of radios.
 *
 * The application draws these as full-width menus because she is choosing; the
 * bench draws them as selects because a curator is composing fourteen answers
 * at once and needs them on one screen. Same options, same codes, same
 * validation — a different reader.
 */
function Single({ field, state }: { field: SingleField; state: BenchState }) {
  const value = single(state.answers, field.id);
  return (
    <div className={styles.field} style={{ marginBottom: "0.5rem" }}>
      <label className={styles.label} htmlFor={field.id}>
        {field.label ?? field.id.replace(/_/g, " ")}
      </label>
      <select
        id={field.id}
        name={field.id}
        defaultValue={value}
        className={styles.select}
      >
        <option value="">—</option>
        {field.options.map((option) => (
          <option key={option.code} value={option.code}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Multi({ field, state }: { field: MultiField; state: BenchState }) {
  const picked = chosen(state.answers, field.id);
  const groups = field.groups ?? [];
  // An option whose group is missing from the list is drawn last, under no
  // heading — the rule src/lib/quiz.ts states, so a new option cannot vanish.
  const ungrouped = field.options.filter(
    (option) => !groups.some((group) => group.key === option.group)
  );

  return (
    <div className={styles.field} style={{ marginBottom: "0.5rem" }}>
      <span className={styles.label}>
        {field.label ?? field.id.replace(/_/g, " ")} · {field.min} to {field.max}
      </span>
      {groups.map((group) => {
        const options = field.options.filter((o) => o.group === group.key);
        if (options.length === 0) return null;
        return (
          <div key={group.key}>
            <p className={styles.facetDimension} style={{ margin: "0.25rem 0 0.125rem" }}>
              {group.label}
            </p>
            <ul className={styles.facetList}>
              {options.map((option) => (
                <li key={option.code}>
                  <label className={styles.facetItem}>
                    <input
                      type="checkbox"
                      name={field.id}
                      value={option.code}
                      defaultChecked={picked.has(option.code)}
                    />
                    <span>{option.label}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
      {ungrouped.length > 0 ? (
        <ul className={styles.facetList}>
          {ungrouped.map((option) => (
            <li key={option.code}>
              <label className={styles.facetItem}>
                <input
                  type="checkbox"
                  name={field.id}
                  value={option.code}
                  defaultChecked={picked.has(option.code)}
                />
                <span>{option.label}</span>
              </label>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function Text({ field, state }: { field: TextField; state: BenchState }) {
  /*
   * A CONDITIONAL FIELD IS SHOWN, AND SAYS WHEN IT COUNTS.
   *
   * "In your words" belongs to the occasion "Something else" and to nothing
   * else — `isFieldActive` is the rule, and it is the rule the submission route
   * runs too, so an answer typed here while the occasion is a birthday is
   * ignored by the validator exactly as it would be by the real one. Hiding the
   * box instead would mean the curator picks Something else, presses Run, is
   * told the answer is needed, and only then sees where to type it. It is drawn
   * greyed rather than removed, and the "needed" mark is what moves.
   */
  const active = isFieldActive(field, state.answers);
  return (
    <div className={styles.field} style={{ marginBottom: "0.5rem" }}>
      <label className={styles.label} htmlFor={field.id}>
        {field.label ?? field.id.replace(/_/g, " ")}
        {field.optional ? "" : active ? " · needed" : " · only for “something else”"}
      </label>
      <textarea
        id={field.id}
        name={field.id}
        rows={field.rows ?? 2}
        maxLength={field.maxLength}
        placeholder={field.placeholder}
        defaultValue={single(state.answers, field.id)}
        className={styles.textarea}
      />
    </div>
  );
}
