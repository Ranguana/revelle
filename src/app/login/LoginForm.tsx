"use client";

import { useActionState } from "react";

import styles from "./login.module.css";
import { requestLinkAction, type LoginState } from "./actions";

const INITIAL: LoginState = { message: "", asked: false };

/**
 * The form.
 *
 * A Client Component only because it needs the pending state of the action —
 * a button that can be pressed four times while the first press is in flight
 * is a button that sends four messages. Everything else on the page is server
 * rendered.
 *
 * No counter, no bar, no step, no tick, and no second screen congratulating
 * her for typing an address. The message appears under the rule and the form
 * stays where it is, so asking again is one keystroke rather than a journey
 * back.
 */
export default function LoginForm({ failedLink }: { failedLink: boolean }) {
  const [state, action, pending] = useActionState(requestLinkAction, INITIAL);

  return (
    <form action={action}>
      <p className={styles.eyebrow}>Revelle Société</p>
      <h1 className={styles.title}>Sign in</h1>

      {failedLink ? (
        <p className={styles.notice}>
          That link did not work. Links work once, and only for a short while.
          Ask for another.
        </p>
      ) : null}

      <div className={styles.rule} />

      <div className={styles.field}>
        <label className={styles.label} htmlFor="email">
          Your address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          autoFocus
          className={styles.input}
        />
      </div>

      <button className={styles.button} disabled={pending}>
        {pending ? "Sending" : "Send a link"}
      </button>

      {state.message ? (
        <p
          className={
            state.asked ? styles.answer : `${styles.answer} ${styles.refusal}`
          }
          aria-live="polite"
        >
          {state.message}
        </p>
      ) : null}

      <p className={styles.hint}>There is no password to forget.</p>
    </form>
  );
}
