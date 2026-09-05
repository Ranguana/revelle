"use client";

import { useRouter } from "next/navigation";
import { useActionState, useTransition } from "react";

import styles from "./quiz.module.css";
import { resendNoteAction, type ApplyState } from "./actions";

/**
 * BETWEEN THE SIGN-UP AND THE QUESTIONS.
 *
 * She has a pass and her address is not confirmed yet. This is the only screen
 * in the flow that asks her to do something outside the browser, so it says
 * exactly what and nothing else.
 *
 * It borrows the closing panel's treatment — the dark ground and the arc —
 * because it is the same kind of moment: a beat where something has happened
 * and she is not being asked to tap. That is also why the button is the quiet
 * one and not the CTA. The act on this screen is opening a note; asking for
 * another is the fallback, and it should not look like the way forward.
 *
 * ── WHAT IT PROMISES, AND WHAT IT DOES NOT ───────────────────────────
 *
 * It says her answers are safe, because that is the fear this screen creates
 * and it is a fear with a true answer: nothing she has tapped is on a server,
 * nothing is cleared by leaving, and the browser she is reading this in is the
 * one holding them. It does not count the note's minutes, does not apologise
 * for asking, does not congratulate her for getting this far, and does not
 * name the mechanism (docs/copy-brief.md).
 *
 * ── AND WHY THERE IS AN "I HAVE OPENED IT" AT ALL ────────────────────
 *
 * Because the note may open in a different browser from this one — a mail app
 * that launches its own. The confirmation lands on the customer row rather
 * than on the pass (src/lib/application.ts), so THIS browser comes good the
 * moment it re-asks, and re-asking is a page load. The link is that page load.
 * Without it she would sit on a screen that had quietly become wrong.
 */
export default function Waiting({ email }: { email: string }) {
  const router = useRouter();
  const [checking, check] = useTransition();
  const [state, action, pending] = useActionState<ApplyState, FormData>(
    resendNoteAction,
    { message: "", asked: false }
  );

  return (
    <div className={styles.done}>
      <div className={styles.doneInner}>
        <p className={styles.doneEyebrow}>Sent</p>
        <h1 className={styles.doneTitle}>Open the note.</h1>
        <p className={styles.doneBody}>
          It has gone to <strong>{email}</strong>. Press the button inside it
          and the questions are yours.
        </p>
        <p className={styles.doneBody}>
          Nothing you have already answered is lost. It is here, in this
          browser, and it stays here whether you come back in ten minutes or
          next week.
        </p>

        <div className={styles.waitingActions}>
          {/*
            `router.refresh()` and not a link. The question this button asks is
            "has the confirmation landed yet", and the answer lives on the
            server — a client navigation to the route she is already on can be
            served from the cached payload, which is the one answer that is
            guaranteed to be stale. A refresh re-runs the page and re-reads the
            customer row.
          */}
          <button
            type="button"
            className="cta"
            disabled={checking}
            onClick={() => check(() => router.refresh())}
          >
            {checking ? "Looking" : "I have opened it"}
          </button>

          <form action={action}>
            <button className={styles.waitingQuiet} disabled={pending}>
              {pending ? "Sending" : "Send another"}
            </button>
          </form>
        </div>

        {state.message ? (
          <p className={styles.doneBody} aria-live="polite">
            {state.message}
          </p>
        ) : null}
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
        <rect x="190" y="299" width="410" height="2" fill="var(--night-aqua)" />
      </svg>
    </div>
  );
}
