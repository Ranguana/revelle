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
  ASKED_STEPS,
  QUIZ_VERSION,
  fieldsInvalidatedBy,
  isFieldActive,
  stepErrors,
  type MultiField,
  type QuizAnswers,
  type QuizField,
  type QuizOption,
  type SingleField,
} from "@/lib/quiz";

import styles from "./quiz.module.css";
import { TONE_MARKS } from "./tone-marks";

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
 *
 * ── IT WALKS ASKED_STEPS, NOT QUIZ_STEPS ─────────────────────────────
 *
 * One question is already answered by the time this renders: her address,
 * given at the sign-up and proved by the note. ASKED_STEPS is QUIZ_STEPS minus
 * that step (src/lib/quiz.ts), so she is not asked a second time for something
 * the server already holds. The address arrives here as a prop and is carried
 * into the submission — the answers jsonb records what she actually gave, and
 * the route refuses a submission whose address is not the one on the pass.
 *
 * ── AN OLD DRAFT IS NOT LOST BY THIS ─────────────────────────────────
 *
 * A draft written before the sign-up existed holds a stepIndex into the old
 * list, where the email step was LAST. Removing it from the front leaves every
 * other screen at the index it had, so the position still points at the same
 * question; only a draft that stopped ON the email screen is out of range, and
 * `Math.min` puts her on the final screen instead. Her answers are untouched
 * in every case — QUIZ_VERSION did not change, because no question did.
 */

type Phase = "asking" | "sending" | "done";

const NO_ANSWERS: QuizAnswers = {};

export default function QuizFlow({ email }: { email: string }) {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const draft = useMemo(() => parseDraft(raw), [raw]);

  const answers = draft?.answers ?? NO_ANSWERS;
  const stepIndex = Math.min(draft?.stepIndex ?? 0, ASKED_STEPS.length - 1);

  const [phase, setPhase] = useState<Phase>("asking");
  const [showErrors, setShowErrors] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState("");

  const step = ASKED_STEPS[stepIndex];
  const errors = useMemo(() => stepErrors(step, answers), [step, answers]);
  const canAdvance = errors.length === 0;
  const isLast = stepIndex === ASKED_STEPS.length - 1;

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
      // QuizOption.exclusive — "they hate games" is the whole answer or it is
      // not in it. Enforced by REPLACEMENT for the same reason the ceiling is:
      // a form that refuses a tap is telling her off, and the two combinations
      // it refuses are ones she cannot have meant at once. `stepErrors` says
      // the same thing to a submission that did not come through this screen.
      const isExclusive = (c: string) =>
        field.options.some((o) => o.code === c && o.exclusive === true);
      const next = chosen.includes(code)
        ? chosen.filter((c) => c !== code)
        : isExclusive(code)
          ? [code]
          : // At the limit the newest choice replaces the oldest. Tapping a
            // fourth thing should feel like changing your mind, not like being
            // told off by a form.
            [...chosen.filter((c) => !isExclusive(c)), code].slice(-field.max);
      return { ...d, answers: { ...d.answers, [field.id]: next } };
    });
  }, []);

  const choose = useCallback((field: SingleField, code: string) => {
    setShowErrors(false);
    updateDraft((d) => {
      const answers = { ...d.answers, [field.id]: code };
      // Clearing a conditional answer whose question is no longer asked keeps
      // the payload honest — and matches the CHECK constraint on the table.
      // Which fields those are is a property of the fields (`activeWhen`), not
      // a branch this component holds: there are two of them now, and the next
      // one must not need an edit here.
      for (const id of fieldsInvalidatedBy(field.id, code)) delete answers[id];
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

    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          submissionKey: draft.submissionKey,
          quizVersion: QUIZ_VERSION,
          // The address is added at the moment of sending rather than written
          // into the draft, so there is one copy of it and it is the server's.
          // A draft written before the sign-up existed may still carry an
          // `email` of its own; this overrides it, and the route refuses
          // anything that is not the address on the pass either way.
          answers: { ...draft.answers, email },
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
  }, [draft, email]);

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

  // The progress figure is gone with the bar that displayed it. See the note
  // in the header below.
  const complaint = failure ?? (showErrors && !canAdvance ? errors[0] : null);

  return (
    <div className={styles.shell}>
      {/*
        No counter and no progress bar, and both were here.

        docs/copy-brief.md bans them by name — "no step tallies", "no progress
        bars, step counters, percentage complete" — and the reason is not
        squeamishness about numbers. A tally turns being asked good questions
        into a task with a finish line, and a bar that fills is a promise that
        the end is the good part. Being asked about your friends by someone
        with taste is the pleasure, not the toll. The stylesheet's .count,
        .track and .fill are left in place, unused, so nobody re-adds this by
        finding an orphaned class and assuming it went missing.

        What replaces it is nothing. Each step announces itself with its own
        eyebrow and heading, which is the orientation that was ever needed.
      */}
      <header className={styles.bar}>
        <div className={styles.barInner}>
          <Link className={styles.mark} href="/">
            Revelle Société
          </Link>
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

            {/* "One email when your destination is ready, and nothing else.
                No list, no drip, no forwarding it on." stood here, on the last
                screen, because the last screen was where she typed her
                address. It moved to the sign-up with the question it answers —
                a promise about what an address is used for belongs beside the
                moment she gives it, not sixteen screens later. It is not
                deleted; see SignUp.tsx. */}
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
    // A browsed field says nothing about how many. See MultiField.quiet.
    if (field.quiet) continue;
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

      {field.type === "multi" && field.layout === "tiles" ? (
        <Tiles field={field} chosen={chosen} onToggle={onToggle} />
      ) : null}

      {field.type === "multi" && field.layout !== "tiles" ? (
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

/**
 * A field with too many options to read as a list.
 *
 * Fifty rows on a phone is a wall, and a wall is read by scrolling past it. The
 * same fifty in short runs under headings is a browse: each heading is a
 * landmark, each run is over in a thumb-flick, and she can stop at the one that
 * sounds like her friends without having read the rest.
 *
 * The headings do no work beyond that. There is no count, no progress, no
 * "chosen so far" — the state she needs is on the tiles themselves.
 *
 * Options whose group is not in the list are drawn last under no heading, so a
 * tone added to the vocabulary without a group appears on the page rather than
 * disappearing from it.
 */
function Tiles({
  field,
  chosen,
  onToggle,
}: {
  field: MultiField;
  chosen: readonly string[];
  onToggle: (field: MultiField, code: string) => void;
}) {
  const groups = field.groups ?? [];
  const keys = new Set(groups.map((g) => g.key));
  const ungrouped = field.options.filter(
    (o) => o.group === undefined || !keys.has(o.group)
  );

  const runs = [
    ...groups.map((group) => ({
      key: group.key,
      label: group.label,
      options: field.options.filter((o) => o.group === group.key),
    })),
    ...(ungrouped.length > 0
      ? [{ key: "rest", label: "", options: ungrouped }]
      : []),
  ].filter((run) => run.options.length > 0);

  return (
    <>
      {runs.map((run) => (
        <section key={run.key} className={styles.run}>
          {run.label ? <h3 className={styles.runLabel}>{run.label}</h3> : null}
          <div className={styles.tiles}>
            {run.options.map((option) => (
              <Tile
                key={option.code}
                option={option}
                selected={chosen.includes(option.code)}
                onClick={() => onToggle(field, option.code)}
              />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

/**
 * A mark and a short line about her friends.
 *
 * The drawing carries the feeling and the label carries the meaning: nobody can
 * draw "wry" so that it reads as wry, so the mark is never asked to be read on
 * its own. It is decorative to a screen reader for exactly that reason — the
 * label is the whole content.
 *
 * Selected state is a filled block, a heavier frame and a change of ink, so it
 * survives being seen without colour.
 */
function Tile({
  option,
  selected,
  onClick,
}: {
  option: QuizOption;
  selected: boolean;
  onClick: () => void;
}) {
  const mark = TONE_MARKS[option.code];

  return (
    <button
      type="button"
      aria-pressed={selected}
      className={`${styles.tile} ${selected ? styles.tileOn : ""}`}
      onClick={onClick}
    >
      <span className={styles.tileTick} aria-hidden="true" />
      {mark ? (
        <svg
          className={styles.tileArt}
          viewBox="0 0 64 64"
          aria-hidden="true"
          focusable="false"
        >
          {mark}
        </svg>
      ) : null}
      <span className={styles.tileLabel}>{option.label}</span>
    </button>
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
        {/*
          No claim about who or what reads this. The house does not introduce
          its staff (docs/copy-brief.md), and the mirror-image line — that a
          machine does it — would be worse. Silence on the question is the only
          version that is both true and in voice.
        */}
        <h1 className={styles.doneTitle}>We have your answers.</h1>
        <p className={styles.doneBody}>
          Nothing else is needed from you. The confirmation is on its way to{" "}
          <strong>{email || "your inbox"}</strong>.
        </p>
        <p className={styles.doneBody}>
          If you think of the thing you forgot to tell us, reply to that email.
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
