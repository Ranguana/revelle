"use client";

/**
 * THE COMPOSE FORM.
 *
 * A client component for one reason: `useActionState`, so that a refusal — no
 * published voice, the writing desk not open, nothing said — comes back as a
 * sentence in place rather than as a navigation to a page with an error on it.
 *
 * Everything else about it is a plain form. The radios are real radios, the
 * text areas are real text areas, and it submits without JavaScript if
 * JavaScript never arrives; the only thing lost in that case is where the
 * sentence appears.
 *
 * ── WHAT IT ASKS FOR ─────────────────────────────────────────────────
 *
 * Two fields, and neither of them asks her to write in the voice. One is the
 * job in her own words. The other is a list of facts, one to a line. That
 * distinction is the product: she supplies Friday and seven o'clock, and the
 * house supplies the sentence they arrive in.
 */

import { useActionState } from "react";

import type { PieceChoice } from "@/lib/correspondence/types";
import { composeAction, type ComposeState } from "./actions";

import styles from "./correspondence.module.css";

const START: ComposeState = { error: null };

export function ComposeForm({
  revelleId,
  voiced,
  plain,
  deskIsOpen,
}: {
  revelleId: string;
  voiced: PieceChoice[];
  plain: PieceChoice[];
  deskIsOpen: boolean;
}) {
  const [state, action, pending] = useActionState(composeAction, START);

  return (
    <form className={styles.form} action={action}>
      <input type="hidden" name="revelleId" value={revelleId} />

      {/*
        The voiced pieces are ABSENT when there is nobody to write them —
        not disabled, not greyed, not a button that fails when pressed. The
        line below says why, once, in words she can act on. Same discipline as
        the soundtrack routing to print when there is no Spotify.
      */}
      {deskIsOpen && voiced.length > 0 ? (
        <div className={styles.choices}>
          {voiced.map((choice) => (
            <label className={styles.choice} key={choice.value}>
              <input type="radio" name="choice" value={choice.value} required />
              <span className={styles.choiceLabel}>{choice.label}</span>
              <span className={styles.choiceHint}>{choice.hint}</span>
            </label>
          ))}
        </div>
      ) : null}

      {plain.length > 0 ? (
        <div>
          <p className={styles.plainHead}>These go out plain</p>
          <div className={styles.choices}>
            {plain.map((choice) => (
              <label className={styles.choice} key={choice.value}>
                <input
                  type="radio"
                  name="choice"
                  value={choice.value}
                  required
                />
                <span className={styles.choiceLabel}>{choice.label}</span>
                {choice.hint ? (
                  <span className={styles.choiceHint}>{choice.hint}</span>
                ) : null}
              </label>
            ))}
          </div>
        </div>
      ) : null}

      <div className={styles.field}>
        <label className={styles.label} htmlFor="ask">
          What is it for
        </label>
        <textarea
          className={styles.area}
          id="ask"
          name="ask"
          rows={2}
          placeholder="Ask six people to the house for the weekend."
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="facts">
          What it has to carry
        </label>
        <textarea
          className={styles.area}
          id="facts"
          name="facts"
          rows={4}
          placeholder={"Friday\nseven o'clock\nbring a swimsuit"}
        />
        <p className={styles.quiet}>One to a line. These arrive exactly as written.</p>
      </div>

      {state.error ? <p className={styles.trouble}>{state.error}</p> : null}

      <div className={styles.actions}>
        <button className={styles.button} disabled={pending}>
          {/*
            "Writing" rather than a spinner, a percentage or a phrase about how
            long it takes. A piece takes as long as it takes, and telling her
            would be counting.
          */}
          {pending ? "Writing" : "Write it"}
        </button>
      </div>
    </form>
  );
}
