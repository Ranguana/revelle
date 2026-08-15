import type { Metadata } from "next";
import Link from "next/link";

import { formatPrice, pricing, spellCount } from "@/lib/pricing";

import styles from "./pricing.module.css";

export const metadata: Metadata = {
  title: "Membership",
  description:
    "Apply once. Dues annually. Or commission a single Revelle without joining.",
};

/**
 * What it costs.
 *
 * Every figure comes from src/lib/pricing.ts, which reads the environment —
 * pricing is still being tested and a price that needs a deploy to change is a
 * price nobody tests. An UNSET figure renders as "on application" rather than
 * as a guess: a wrong number on a live page looks exactly like a decided one,
 * and somebody may hold us to it.
 *
 * Rendered on every request rather than at build time, for the same reason —
 * a statically prerendered page would bake in whatever the price was when the
 * build ran, which defeats the entire arrangement.
 */
export const dynamic = "force-dynamic";

export default function PricingPage() {
  const { duesCents, commissionCents, foundingMembers, trialDays } = pricing();

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.masthead}>
          <Link className={styles.wordmark} href="/">
            Revelle Société
          </Link>
          <Link className={styles.back} href="/">
            The destinations
          </Link>
        </div>

        <header className={styles.head}>
          <h1 className={styles.title}>Membership</h1>
          <p className={styles.standfirst}>
            Every Revelle is designed for these people, this occasion, and
            issued once. Membership is what makes it better each time: the
            société learns your taste, your people, and what you would never do
            twice.
          </p>
        </header>

        {/*
          The founding term first and in the dark palette, because it is the
          only genuinely generous thing on the page and burying it under two
          prices would be coy. Stated as a standing, never as a countdown —
          no "N remaining", no timer. See docs/copy-brief.md on scarcity.
        */}
        <section className={styles.founding}>
          <div className={styles.term}>
            <h2 className={styles.termName}>Founding members</h2>
            <div>
              <p className={styles.amount}>No dues</p>
              <p className={styles.termBody}>
                The first {spellCount(foundingMembers)} memberships are
                founding memberships. They are not billed, and they do not
                lapse into a bill later.
              </p>
            </div>
          </div>
        </section>

        <section className={styles.terms}>
          <div className={styles.term}>
            <h2 className={styles.termName}>Annual dues</h2>
            <div>
              {duesCents === null ? (
                <p className={styles.amountUnset}>On application</p>
              ) : (
                <p className={styles.amount}>
                  {formatPrice(duesCents)}
                  <span className={styles.fine}> a year</span>
                </p>
              )}
              <p className={styles.termBody}>
                Apply once, then dues annually. Being known is what dues buy:
                your taste, your people, and every destination you have been
                given, kept and carried forward, so the third is sharper than
                the first.
                {trialDays > 0
                  ? ` The first ${spellCount(trialDays)} days are free.`
                  : ""}
              </p>
            </div>
          </div>

          <div className={styles.term}>
            <h2 className={styles.termName}>A single Revelle</h2>
            <div>
              {commissionCents === null ? (
                <p className={styles.amountUnset}>On application</p>
              ) : (
                <p className={styles.amount}>{formatPrice(commissionCents)}</p>
              )}
              <p className={styles.termBody}>
                One occasion, commissioned without joining. Designed the same
                way and issued the same once — what it does not do is remember
                you afterwards.
              </p>
            </div>
          </div>
        </section>

        <div className={styles.foot}>
          <Link className="cta" href="/apply">
            Apply for membership
          </Link>
          <p className={styles.fine}>No clipboards. No costume rule.</p>
        </div>
      </div>
    </main>
  );
}
