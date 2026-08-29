import type { Metadata } from "next";

import styles from "../login.module.css";
import { spendLinkAction } from "./actions";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false, nocache: true },
};

/**
 * THE INTERSTITIAL, AND WHY IT NOW COSTS A CLICK.
 *
 * This was a GET that spent the token on arrival. The trade was stated in the
 * file it replaces and made deliberately: an interstitial costs a click on
 * every sign-in forever, and the known weakness — "a GET that consumes a
 * token can be burned by a mail client or a security scanner that pre-fetches
 * links" — was judged worth carrying until it happened in practice.
 *
 * It happened in practice. A curator who had been signing in for days stopped
 * being able to, and every fresh link failed the same way, which is the exact
 * signature: the scanner opens the link the moment it lands, the token is
 * spent, and the human click that follows finds it already used. Asking for
 * another produces another link for the scanner to eat. From inside it is
 * indistinguishable from being locked out, because it IS being locked out.
 *
 * The old file named the fix and estimated it: "the fix is the interstitial
 * and it is half an hour of work." This is that half hour, spent.
 *
 * ── WHY A BUTTON IS ENOUGH ───────────────────────────────────────────
 *
 * Pre-fetchers and link scanners issue GETs. They do not submit forms. So the
 * token survives the scan and is spent only when a person presses the button,
 * which is the property the old route could not have.
 *
 * Nothing here reads the token, validates it, or says anything about it. The
 * page looks identical for a good token and a junk one — same rule as the
 * route it replaces, for the same reason.
 */
export default async function SpendLinkPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <p className={styles.eyebrow}>Revelle Société</p>
        <h1 className={styles.title}>You&rsquo;re expected.</h1>
        <p className={styles.hint}>
          Press the button and we&rsquo;ll take you where you were going.
        </p>
        <form action={spendLinkAction}>
          <input type="hidden" name="token" value={token} />
          <button className={styles.button} type="submit">
            Let me in
          </button>
        </form>
        <p className={styles.notice}>
          A link is good once, and for fifteen minutes. If this one has been
          sitting a while, ask for another.
        </p>
      </div>
    </main>
  );
}
