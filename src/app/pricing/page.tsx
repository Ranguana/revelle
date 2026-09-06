import type { Metadata } from "next";
import Link from "next/link";

import { formatPrice, pricing, spellCount } from "@/lib/pricing";

import styles from "./pricing.module.css";

export const metadata: Metadata = {
  title: "Membership",
  // Her line, unaltered, plus the door that came back on 2026-09-06. The
  // second sentence used to read "Or commission a single Revelle without
  // joining"; the offer returned under a different word, so the sentence does
  // too. See the note beside `commissionCents` in src/lib/pricing.ts.
  description: "Apply once. Dues annually. Or come once, as a guest.",
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
  // Every figure is read. `commissionCents` was inert for one day — see the
  // note beside it in src/lib/pricing.ts — and is live again as the guest
  // price. If any of these is unset it renders as "on application", never as
  // a guess.
  const {
    duesCents,
    commissionCents,
    extraCents,
    includedRevelles,
    foundingMembers,
    trialDays,
  } = pricing();

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
              {/*
                THIS PARAGRAPH WAS CORRECTED, 2026-09-06, AND THE CORRECTION
                IS THE POINT. It used to read "They are not billed, and they
                do not lapse into a bill later." That was true when dues were
                the only charge. Founding members are now billed per Revelle,
                à la carte, so a flat "not billed" had become a false promise
                on a live page — the worst kind, because it was made publicly
                and generously and somebody would have held us to it.

                What was promised in public is NO DUES. That promise is kept
                here in the same words, and the thing it never covered is now
                said out loud rather than discovered at a first invoice. The
                offer is not smaller for being accurate.

                THE RATE IS THE MEMBERS' ONE, AND THAT IS A JUDGEMENT. She
                said "billing them à la carte" without naming a figure. A
                founding member is a member, so they pay what members pay past
                their allowance; and having no dues, they have no allowance to
                be past. Flagged to her rather than left to be inferred.
              */}
              <p className={styles.termBody}>
                The first {spellCount(foundingMembers)} memberships are
                founding memberships. Dues are never charged, and they do not
                lapse into dues later.
              </p>
              <p className={styles.termBody}>
                {extraCents === null ? (
                  <>Each Revelle is commissioned on its own terms.</>
                ) : (
                  <>
                    Each Revelle is commissioned on its own terms, at{" "}
                    {formatPrice(extraCents)} — the members&rsquo; figure,
                    because that is what a founding member is.
                  </>
                )}
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
              {/*
                The allowance, before the argument for membership, because it
                is the concrete half and she asked for it first: "$120 with
                two included", then "25 per extra revelle".

                NOTHING COUNTS THESE YET. No part of the machine tallies a
                member's Revelles against their year — this is a printed term
                with no meter behind it, and the note travels with the number
                in src/lib/pricing.ts so the next reader of this page does not
                assume the enforcement exists.
              */}
              {/* One expression, not text-then-expression: JSX inserts a
                  space at the line break, which put a gap before the comma
                  on the live page. */}
              <p className={styles.termBody}>
                {`Dues cover ${spellCount(includedRevelles)} Revelles a year${
                  extraCents === null
                    ? "."
                    : `, and each one after is ${formatPrice(extraCents)}.`
                }`}{" "}
                There is no calendar on them: two in a month and two ten months
                apart are the same two.
              </p>
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

          {/* ── one Revelle, as a guest: RESTORED, 2026-09-06 ─────────────
              Removed 2026-09-05 on her instruction — "get rid of A single
              Revelle $30" — and asked back the next day at a new figure:
              "$65 for one as guest." So the removal was about the price and
              the framing, not about the door.

              WHAT CHANGED BESIDES THE NUMBER. It is not a "commission" any
              more; it is a guest. The old copy sold it by what it LACKED —
              "what it does not do is remember you afterwards" — which is a
              shabby way to describe somebody you want in the house. A guest
              is welcome. The reason to join is made on the membership side,
              as continuity, and that argument stands on its own without this
              block being diminished to prop it up.

              PRICE_SINGLE_COMMISSION is read again. The env var keeps its
              name; see src/lib/pricing.ts on why renaming it would cost a
              live figure for nothing. */}
          <div className={styles.term}>
            <h2 className={styles.termName}>One, as a guest</h2>
            <div>
              {commissionCents === null ? (
                <p className={styles.amountUnset}>On application</p>
              ) : (
                <p className={styles.amount}>
                  {formatPrice(commissionCents)}
                  <span className={styles.fine}> once</span>
                </p>
              )}
              <p className={styles.termBody}>
                One occasion, without joining. Designed the same way, by the
                same house, and issued the same once — a guest is not sent a
                lesser evening.
              </p>
              <p className={styles.termBody}>
                What it does not come with is the second year. The société does
                not keep your taste, your people, or what you would never do
                twice, so the next one begins from nothing again.
              </p>
            </div>
          </div>
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
