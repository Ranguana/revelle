"use client";

import Link from "next/link";
import { useCallback, useMemo, useState, useSyncExternalStore } from "react";

import {
  clearDraft,
  getServerSnapshot,
  getSnapshot,
  parseDraft,
  subscribe,
  updateDraft,
} from "@/lib/quiz-draft";
import {
  QUIZ_STEPS,
  QUIZ_VERSION,
  isFieldActive,
  stepErrors,
  type MultiField,
  type QuizAnswers,
  type QuizField,
  type QuizOption,
  type SingleField,
} from "@/lib/quiz";

import styles from "./quiz.module.css";

/**
 * The quiz, client side.
 *
 * Her answers and her position in the flow live in the draft store
 * (src/lib/quiz-draft.ts), not in this component: they must survive a closed
 * tab, so localStorage is the source of truth and this subscribes to it. Only
 * the things that are genuinely about this screen right now — whether a
 * request is in flight, whether to show a complaint — are React state.
 *
 * Validation calls the same functions the route handler calls
 * (src/lib/quiz.ts), so the button is never enabled for something the API will
 * reject, and there is no second copy of the rules to drift.
 */

type Phase = "asking" | "sending" | "done";

const NO_ANSWERS: QuizAnswers = {};

export default function QuizFlow() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const draft = useMemo(() => parseDraft(raw), [raw]);

  const answers = draft?.answers ?? NO_ANSWERS;
  const stepIndex = Math.min(draft?.stepIndex ?? 0, QUIZ_STEPS.length - 1);

  const [phase, setPhase] = useState<Phase>("asking");
  const [showErrors, setShowErrors] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState("");

  const step = QUIZ_STEPS[stepIndex];
  const errors = useMemo(() => stepErrors(step, answers), [step, answers]);
  const canAdvance = errors.length === 0;
  const isLast = stepIndex === QUIZ_STEPS.length - 1;

  const setValue = useCallback((fieldId: string, value: string) => {
    setShowErrors(false);
    updateDraft((d) => ({ ...d, answers: { ...d.answers, [fieldId]: value } }));
  }, []);

  const toggle = useCallback((field: MultiField, code: string) => {
    setShowErrors(false);
    updateDraft((d) => {
      const chosen = Array.isArray(d.answers[field.id])
        ? (d.answers[field.id] as string[])
        : [];
      const next = chosen.includes(code)
        ? chosen.filter((c) => c !== code)
        : // At the limit the newest choice replaces the oldest. Tapping a
          // fourth thing should feel like changing your mind, not like being
          // told off by a form.
          [...chosen, code].slice(-field.max);
      return { ...d, answers: { ...d.answers, [field.id]: next } };
    });
  }, []);

  const choose = useCallback((field: SingleField, code: string) => {
    setShowErrors(false);
    updateDraft((d) => {
      const answers = { ...d.answers, [field.id]: code };
      // Clearing the conditional text when its trigger is deselected keeps the
      // payload honest — and matches the CHECK constraint on the table.
      if (field.revealsTextField && code !== field.revealsTextField) {
        delete answers.occasion_other;
      }
      return { ...d, answers };
    });
  }, []);

  const goTo = useCallback((index: number) => {
    setShowErrors(false);
    updateDraft((d) => ({ ...d, stepIndex: index }));
    // A step change is a new screen, not a scroll position.
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  const submit = useCallback(async () => {
    if (!draft) return;
    setPhase("sending");
    setFailure(null);
    const email = String(draft.answers.email ?? "");

    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          submissionKey: draft.submissionKey,
          quizVersion: QUIZ_VERSION,
          answers: draft.answers,
        }),
      });
      const body = (await res.json().catch(() => null)) as
        | { ok?: boolean; errors?: string[] }
        | null;

      if (!res.ok || !body?.ok) {
        setPhase("asking");
        setFailure(
          body?.errors?.[0] ??
            "That did not go through. Your answers are saved — try again."
        );
        return;
      }

      // Only now is it safe to forget. Until this line the draft is the only
      // copy that exists.
      setSentTo(email);
      setPhase("done");
      clearDraft();
      window.scrollTo({ top: 0, behavior: "auto" });
    } catch {
      setPhase("asking");
      setFailure("No connection. Your answers are saved — try again.");
    }
  }, [draft]);

  const next = useCallback(() => {
    if (!canAdvance) {
      setShowErrors(true);
      return;
    }
    if (isLast) {
      void submit();
      return;
    }
    goTo(stepIndex + 1);
  }, [canAdvance, isLast, goTo, stepIndex, submit]);

  if (phase === "done") return <Closing email={sentTo} />;

  const progress = ((stepIndex + (canAdvance ? 1 : 0)) / QUIZ_STEPS.length) * 100;
  const complaint = failure ?? (showErrors && !canAdvance ? errors[0] : null);

  return (
    <div className={styles.shell}>
      <header className={styles.bar}>
        <div className={styles.barInner}>
          <Link className={styles.mark} href="/">
            Revelle Société
          </Link>
          <span className={styles.count}>
            {String(stepIndex + 1).padStart(2, "0")} /{" "}
            {String(QUIZ_STEPS.length).padStart(2, "0")}
          </span>
        </div>
        <div
          className={styles.track}
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={QUIZ_STEPS.length}
          aria-valuenow={stepIndex + 1}
          aria-label="Quiz progress"
        >
          <div className={styles.fill} style={{ width: `${progress}%` }} />
        </div>
      </header>

      <main className={styles.stage}>
        <div className={styles.stageInner}>
          {/* Two elements, not one: on a wide screen the question stays put
              while the choices scroll past it. */}
          <div className={styles.head}>
            <p className="eyebrow">{step.eyebrow}</p>
            <h1 className={styles.title}>{step.title}</h1>
            {step.help ? <p className={styles.help}>{step.help}</p> : null}
          </div>

          <div className={styles.fields}>
            {step.fields.map((field) =>
              isFieldActive(field, answers) ? (
                <Field
                  key={field.id}
                  field={field}
                  answers={answers}
                  onChoose={choose}
                  onToggle={toggle}
                  onValue={setValue}
                />
              ) : null
            )}

            {isLast ? (
              <p className={styles.fine}>
                One email when your world is ready, and nothing else. No list,
                no drip, no forwarding it on.
              </p>
            ) : null}
          </div>
        </div>
      </main>

      <footer className={styles.foot}>
        <div className={styles.footInner}>
          <button
            type="button"
            className={styles.back}
            hidden={stepIndex === 0}
            onClick={() => goTo(stepIndex - 1)}
          >
            Back
          </button>

          <p
            className={`${styles.note} ${complaint ? styles.noteBad : ""}`}
            aria-live="polite"
          >
            {complaint ?? hint(step.fields, answers)}
          </p>

          <button
            type="button"
            className={`cta ${styles.go}`}
            onClick={next}
            disabled={phase === "sending"}
            aria-disabled={!canAdvance}
          >
            {phase === "sending"
              ? "Sending"
              : isLast
                ? "Send it"
                : stepIndex === 0
                  ? "Begin"
                  : "Next"}
          </button>
        </div>
      </footer>
    </div>
  );
}

/**
 * The quiet line above the button. It says how many more taps are wanted, not
 * what is wrong — the scolding version appears only after she presses Next.
 */
function hint(fields: readonly QuizField[], answers: QuizAnswers): string {
  for (const field of fields) {
    if (field.type !== "multi") continue;
    const chosen = Array.isArray(answers[field.id])
      ? (answers[field.id] as string[])
      : [];
    if (chosen.length < field.min) {
      return `Choose ${field.min - chosen.length} more`;
    }
    if (chosen.length >= field.max) return `${field.max} is the limit`;
  }
  return "";
}

function Field({
  field,
  answers,
  onChoose,
  onToggle,
  onValue,
}: {
  field: QuizField;
  answers: QuizAnswers;
  onChoose: (field: SingleField, code: string) => void;
  onToggle: (field: MultiField, code: string) => void;
  onValue: (fieldId: string, value: string) => void;
}) {
  const labelClass =
    field.id === "anti_preferences"
      ? `${styles.fieldLabel} ${styles.fieldLabelNo}`
      : field.id === "affinities"
        ? `${styles.fieldLabel} ${styles.fieldLabelYes}`
        : styles.fieldLabel;

  const value = answers[field.id];
  const text = typeof value === "string" ? value : "";
  const chosen = Array.isArray(value) ? value : [];

  return (
    <section className={styles.field}>
      {field.label ? <h2 className={labelClass}>{field.label}</h2> : null}

      {field.type === "single" ? (
        <div
          className={styles.options}
          role="radiogroup"
          aria-label={field.label ?? "Choose one"}
        >
          {field.options.map((option) => (
            <Option
              key={option.code}
              option={option}
              role="radio"
              selected={text === option.code}
              onClick={() => onChoose(field, option.code)}
            />
          ))}
        </div>
      ) : null}

      {field.type === "multi" ? (
        <div className={styles.options}>
          {field.options.map((option) => (
            <Option
              key={option.code}
              option={option}
              role="checkbox"
              negative={field.id === "anti_preferences"}
              selected={chosen.includes(option.code)}
              onClick={() => onToggle(field, option.code)}
            />
          ))}
        </div>
      ) : null}

      {field.type === "text" ? (
        <>
          <textarea
            className={styles.textbox}
            rows={field.rows ?? 4}
            maxLength={field.maxLength}
            placeholder={field.placeholder}
            aria-label={field.label ?? "Your answer"}
            value={text}
            onChange={(e) => onValue(field.id, e.target.value)}
          />
        </>
      ) : null}

      {field.type === "email" ? (
        <input
          className={styles.textbox}
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="off"
          spellCheck={false}
          maxLength={field.maxLength}
          placeholder="you@example.com"
          aria-label="Your email address"
          value={text}
          onChange={(e) => onValue(field.id, e.target.value)}
        />
      ) : null}
    </section>
  );
}

function Option({
  option,
  selected,
  negative = false,
  role,
  onClick,
}: {
  option: QuizOption;
  selected: boolean;
  negative?: boolean;
  role: "radio" | "checkbox";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={selected}
      className={[
        styles.option,
        selected ? styles.optionOn : "",
        negative ? styles.optionNo : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={onClick}
    >
      <span className={styles.tick} aria-hidden="true" />
      {/*
        There is no image library yet. When there is, an option gains an
        `image` in src/lib/quiz.ts and this renders it with no other change —
        which is the whole reason options are data.
      */}
      {option.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className={styles.thumb}
          src={option.image.src}
          alt={option.image.alt}
        />
      ) : null}
      <span className={styles.text}>
        <span className={styles.label}>{option.label}</span>
        {option.hint ? <span className={styles.hint}>{option.hint}</span> : null}
      </span>
    </button>
  );
}

function Closing({ email }: { email: string }) {
  return (
    <div className={styles.done}>
      <div className={styles.doneInner}>
        <p className={styles.doneEyebrow}>Received</p>
        <h1 className={styles.doneTitle}>We have your answers.</h1>
        <p className={styles.doneBody}>
          A person reads every one of these. Yours is in the queue now, and the
          confirmation is on its way to <strong>{email || "your inbox"}</strong>.
        </p>
        <p className={styles.doneBody}>
          If you think of the thing you forgot to tell us, reply to that email.
          It reaches the same person.
        </p>
      </div>

      <svg
        className={`${styles.arcDone} arc`}
        viewBox="0 0 600 600"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M520 10 A290 290 0 0 0 520 590 L520 530 A230 230 0 0 1 520 70 Z"
          fill="var(--bone)"
        />
        {/* Starts at the arc rather than at the viewBox edge: on a wide
            screen most of the circle is cropped away, and a rule that began
            in empty space read as a stray line. */}
        <rect x="190" y="299" width="410" height="2" fill="var(--night-aqua)" />
      </svg>
    </div>
  );
}
