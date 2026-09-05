"use client";

import Link from "next/link";
import { useActionState } from "react";

import { SIGN_UP_STEP } from "@/lib/quiz";

import styles from "./quiz.module.css";
import { beginApplicationAction, type ApplyState } from "./actions";

/**
 * THE FIRST SCREEN, and the reason it looks like all the others.
 *
 * Founder, 2026-09-05: "when they apply for membership, need a fun page where
 * they sign up and confirm email not just to the quiz."
 *
 * "Fun" is not decoration and docs/copy-brief.md forbids the decoration it
 * would reach for anyway — no progress, no counter, no confetti, no
 * congratulation for continuing. What makes the rest of the flow good is that
 * being asked a good question by somebody with taste is a pleasure. So the
 * sign-up is not a gate in front of that; it is its FIRST BEAT, and it is
 * built out of the same shell, the same head, the same field and the same foot
 * as every screen after it. She does not experience a form and then a flow.
 * She experiences the flow, and its opening question happens to be the one
 * whose answer we have to prove.
 *
 * ── THE WORDS ARE THE STEP'S OWN ─────────────────────────────────────
 *
 * Eyebrow and title come straight off SIGN_UP_STEP (src/lib/quiz.ts) rather
 * than being retyped here. That is rule 21 at its smallest and it matters:
 * this screen and the bench's rendering of the application must never disagree
 * about what the question is. The question did not change when it moved to the
 * front — only its position did.
 *
 * ── AND WHAT IS NOT ON IT ────────────────────────────────────────────
 *
 * No name field, no "create an account", no password. There is nothing to
 * forget and nothing else is asked, because nothing else is needed to send her
 * a note. No price either: applying costs nothing, and putting a figure on the
 * first screen of an application would say the opposite. /pricing says what
 * membership costs and the masthead links to it.
 */
export default function SignUp() {
  const [state, action, pending] = useActionState<ApplyState, FormData>(
    beginApplicationAction,
    { message: "", asked: false }
  );

  return (
    <form className={styles.shell} action={action}>
      <header className={styles.bar}>
        <div className={styles.barInner}>
          <Link className={styles.mark} href="/">
            Revelle Société
          </Link>
        </div>
      </header>

      <main className={styles.stage}>
        <div className={styles.stageInner}>
          <div className={styles.head}>
            <p className="eyebrow">{SIGN_UP_STEP.eyebrow}</p>
            <h1 className={styles.title}>{SIGN_UP_STEP.title}</h1>
            {SIGN_UP_STEP.help ? (
              <p className={styles.help}>{SIGN_UP_STEP.help}</p>
            ) : null}
          </div>

          <div className={styles.fields}>
            <section className={styles.field}>
              <input
                className={styles.textbox}
                type="email"
                name="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="off"
                spellCheck={false}
                required
                autoFocus
                maxLength={254}
                placeholder="you@example.com"
                aria-label="Your email address"
              />
            </section>

            <p className={styles.fine}>
              One email when your destination is ready, and nothing else. No
              list, no drip, no forwarding it on.
            </p>
          </div>
        </div>
      </main>

      <footer className={styles.foot}>
        <div className={styles.footInner}>
          {/* The Back button's slot, kept empty rather than removed, so the
              foot's three-column rhythm is the same here as on every screen
              after it. */}
          <span />

          <p
            className={`${styles.note} ${
              state.message && !state.asked ? styles.noteBad : ""
            }`}
            aria-live="polite"
          >
            {state.message}
          </p>

          <button className={`cta ${styles.go}`} disabled={pending}>
            {pending ? "Sending" : "Send the note"}
          </button>
        </div>
      </footer>
    </form>
  );
}
