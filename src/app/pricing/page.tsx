import type { Metadata } from "next";
import Link from "next/link";

import { formatPrice, pricing, spellCount } from "@/lib/pricing";

import styles from "./pricing.module.css";

export const metadata: Metadata = {
  title: "Membership",
  // "Or commission a single Revelle without joining." was the second sentence
  // here and went with the offer it described. What is left is her line,
  // unaltered, which was always the first half.
  description: "Apply once. Dues annually.",
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
  // `commissionCents` is deliberately not read. Founder, 2026-09-05: the
  // single Revelle is gone, so membership is the only door. Rule 15's shape —
  // an instrument that is not consumed does not get to sit in the file looking
  // wired. See the note beside the field in src/lib/pricing.ts.
  const { duesCents, foundingMembers, trialDays } = pricing();

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.masthead}>
          <Link className={styles.wordmark} href="/">
            Revelle Société
          </Link>
          {/* The label was "The destinations", for a shelf of plates the
              landing page no longer carries. It points at the front door,
              so it now says what is actually there. */}
          <Link className={styles.back} href="/">
            The société
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
              {/*
                What membership IS. The three paragraphs below are hers,
                verbatim, and were written when there was a cheaper offer
                beside them — they read as the terms of the only door now,
                which is stronger and needed no edit to become so. Every claim
                is about what the house remembers and what stays hers.

                THEY USED TO BE READ AS A COMPARISON: "what membership adds
                over a single commission". That framing goes with the offer it
                compared against, and nothing replaces it. A société states its
                terms and does not argue for itself — so no feature list, no
                ticks, no comparison table, and above all nothing added here to
                make up for the option that was removed.
              */}
              <p className={styles.termBody}>
                Apply once, then dues annually. Membership is continuity: the
                société keeps your taste, your people, and what you would never
                do twice, so the third is sharper than the first.
              </p>
              <p className={styles.termBody}>
                You are never given the same thing twice — not the same table,
                the same game, or the same ending. Your people are remembered
                as well as your taste, so the friend who will not get up in
                front of a room never has to say so again.
              </p>
              <p className={styles.termBody}>
                Everything you have been sent stays yours, in its own type,
                years later. Anything you need written afterwards — a change of
                plan, a note before, a thank-you — is written in the same voice
                as the invitation. And the house writes when you have not asked
                it to, a few times a year, about nothing you are buying.
                {trialDays > 0
                  ? ` The first ${spellCount(trialDays)} days are free.`
                  : ""}
              </p>
            </div>
          </div>

          {/* ── the single Revelle: REMOVED, 2026-09-05 ───────────────────
              Founder: "get rid of A single Revelle $30 / One occasion,
              commissioned without joining. Designed the same way and issued
              the same once — what it does not do is remember you afterwards."

              One occasion bought without joining was the second of two
              products (docs/build-checklist.md still lists both, and is a
              founder document, so it is reported rather than edited here).
              Removing it makes membership the only way in, and her own copy
              above already carries that argument: membership is CONTINUITY,
              and the third occasion is sharper than the first. That reads
              stronger with nothing cheaper beside it, so nothing was added to
              compensate.

              PRICE_SINGLE_COMMISSION is now read by nothing. The variable is
              left set on Render — an unread variable is harmless and clearing
              it is not this change's decision — but it is INERT, and this is
              the note that stops it looking live. */}
        </section>

        <div className={styles.foot}>
          <Link className="cta" href="/apply">
            Apply for membership
          </Link>
          <p className={styles.fine}>Every party is a destination.</p>
        </div>
      </div>
    </main>
  );
}
