import type { Metadata } from "next";

import styles from "../quiz.module.css";
import { confirmAction } from "./actions";

export const metadata: Metadata = {
  title: "Apply",
  robots: { index: false, follow: false, nocache: true },
};

/**
 * THE INTERSTITIAL, AND IT IS A BUTTON FOR A REASON ALREADY PAID FOR.
 *
 * src/app/login/[token]/page.tsx has the full account: the sign-in link used
 * to be a GET that spent its token on arrival, and a mail scanner opened every
 * link the moment it landed. The token was spent, the human click that
 * followed found it already used, and asking for another produced another link
 * for the scanner to eat. From inside it is indistinguishable from being
 * locked out, because it is being locked out.
 *
 * That lesson is not re-learned here. Pre-fetchers and link scanners issue
 * GETs; they do not submit forms. So the note survives the scan and is spent
 * only when a person presses the button.
 *
 * Nothing on this page reads the token, validates it, or says anything about
 * it. It looks identical for a good one and a junk one — same rule as the
 * sign-in interstitial, for the same reason.
 *
 * ── AND WHY IT SAYS SO LITTLE ────────────────────────────────────────
 *
 * She has arrived here from a note that already told her what happens next.
 * Repeating it would be the house explaining itself twice. One question, one
 * button, and the sentence underneath is the only thing she could act on if
 * the note has been sitting a while.
 */
export default async function ConfirmPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <div className={styles.done}>
      <div className={styles.doneInner}>
        <p className={styles.doneEyebrow}>Revelle Société</p>
        <h1 className={styles.doneTitle}>Is this you?</h1>
        <p className={styles.doneBody}>
          Then we&rsquo;ll ask you about the night you have in mind, and about
          the people who will be in the room.
        </p>

        <form className={styles.gateForm} action={confirmAction}>
          <input type="hidden" name="token" value={token} />
          <button className="cta" type="submit">
            It&rsquo;s me
          </button>
        </form>

        <p className={styles.doneBody}>
          A note is good once, and only for a short while. If this one has been
          sitting, ask for another and we will send it.
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
        <rect x="190" y="299" width="410" height="2" fill="var(--night-aqua)" />
      </svg>
    </div>
  );
}
