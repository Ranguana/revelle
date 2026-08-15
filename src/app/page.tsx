import Link from "next/link";
import { HeroCollage } from "./HeroCollage";

import { WESTHAMPTON_1976 } from "@/lib/destinations";
import {
  DELIVERABLES,
  MORE_THIS,
  NOT_THIS,
  OCCASIONS,
} from "@/lib/library";
import { HOUSE, themeCss } from "@/lib/tokens";

import DestinationPlates from "./DestinationPlates";
import { OCCASION_ICONS } from "./plates";
import styles from "./landing.module.css";

/**
 * The front door.
 *
 * The page is EVIDENCE, in this order: a destination you are standing in, the
 * occasions it comes in, the shelf it came off, one of them worked through in
 * full, what actually arrives, the two lists, and the way in. Nothing on it
 * explains the service, because a house that explains itself is a house nobody
 * wanted to visit. See docs/copy.md for the approved words and
 * docs/copy-brief.md for the rules behind them — the words here are theirs and
 * are not to be improved.
 *
 * ── What is deliberately absent ──────────────────────────────────────
 *
 * No "how it works", no step count, no duration on a button, no accordion
 * hiding the deliverables, no closing principle, no bone arc, and no italics
 * anywhere. Every one of those was tried and cut; the reasoning is in the two
 * documents above and does not need repeating in a component.
 *
 * ── The hero is the design handoff's, structurally ───────────────────
 *
 * design_handoff_revelle_societe/Revelle Societe.dc.html is the source for it:
 * masthead over a hairline, then a two-column grid set to a common baseline
 * with the destination on the left and a 4:5 framed collage on the right, on
 * a flat cream ground. The words are ours, the composition is the handoff's,
 * and where the two disagreed the handoff won. It is rebuilt rather than
 * copied — the prototype's inline styles belong to its own environment, and
 * the collage is the one thing lifted verbatim, because it is the artwork.
 *
 * ── The three token blocks below ─────────────────────────────────────
 *
 * A destination is a LOOK and a VOICE (src/lib/tokens.ts), and the look is a
 * palette. So the sections that ARE a destination are painted from that
 * destination's own palette rather than the house's, by rendering its token
 * set under a scoped selector. This is the same mechanism the root layout uses
 * for the house theme, pointed at a class instead of :root — which is exactly
 * what it was built for.
 *
 * Two of the three blocks are pinned to their light values with
 * `data-theme="light"` on the element. That is not a dark-mode oversight: a
 * poster and a menu card are printed objects sitting on a permanently dark
 * shelf, and paper does not invert when the reader's system does.
 */

const WESTHAMPTON = WESTHAMPTON_1976;

/** "Labor Day. Six friends. A rented house." and the rest — docs/copy.md. */
const WORKED_NARRATIVE =
  "They wanted glamour without a theme, and a long dinner that turned into " +
  "something else. So: a cast of characters, one staged photograph, and a " +
  "rule about the record player.";

function exemplars(piece: string, count: number) {
  return WESTHAMPTON.voice.exemplars
    .filter((e) => e.piece === piece)
    .slice(0, count);
}

export default function Home() {
  const menu = exemplars("menu_item", 3);
  const notices = exemplars("notice", 2);

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: [
            themeCss(WESTHAMPTON.look, `.${styles.westhampton}`),
            themeCss(HOUSE, `.${styles.plateFrame}`),
            themeCss(WESTHAMPTON.look, `.${styles.specimen}`),
          ].join("\n\n"),
        }}
      />

      {/* ── the hero: a destination, set like a plate ──────────────── */}

      <header className={`${styles.hero} ${styles.westhampton}`}>
        <div className={styles.heroInner}>
          <div className={styles.masthead}>
            <p className={styles.wordmark}>Revelle Société</p>
            <p className={styles.mastheadNote}>Est. for people who host</p>
          </div>

          {/*
            The handoff's hero, structurally: masthead over a hairline, then two
            columns set to a common baseline — the destination on the left, the
            4:5 framed collage on the right. The collage is a sibling of the
            type and never a layer behind it, which is the whole reason nothing
            can land on top of anything here at any width.
          */}
          <div className={styles.heroGrid}>
            <div className={styles.heroPlate}>
              <p className={styles.plateIndex}>Destination No. 07</p>
              <h1 className={styles.heroName}>{WESTHAMPTON.name}</h1>
              {/* No ornament between the name and the line under it. The
                  handoff sets those two as one unit, and the page's single
                  ornament belongs to the worked plate further down. */}
              <p className={styles.heroTagline}>{WESTHAMPTON.tagline}</p>
              <p className={styles.heroSociete}>A société for people who host.</p>

              <div className={styles.heroActions}>
                <Link className={`cta ${styles.ctaHero}`} href="/quiz">
                  Apply for membership
                </Link>
                <p className={styles.fine}>No clipboards. No costume rule.</p>
              </div>
            </div>

            {/*
              The illustration slot. Six hand-drawn vignettes clipped into one
              4:5 plate — no stock, no CDN, no gradient standing in for a
              photograph. If real photography ever arrives, it drops into this
              same frame at this same ratio.
            */}
            <figure className={styles.heroFigure}>
              <div className={styles.heroCollage}>
                <HeroCollage />
              </div>
            </figure>
          </div>
        </div>
      </header>

      {/* ── where to ───────────────────────────────────────────────────
          No caption, and none is coming: a house does not explain its
          collection. docs/copy.md is explicit that this section gets a label
          and nothing else. */}

      <section className={styles.occasions}>
        <div className={styles.wrap}>
          <h2 className="eyebrow">Where to</h2>

          <ul className={styles.occasionGrid}>
            {OCCASIONS.map((occasion) => (
              <li className={styles.occasion} key={occasion.slug}>
                <svg
                  viewBox="0 0 64 64"
                  aria-hidden="true"
                  focusable="false"
                  className={styles.occasionIcon}
                >
                  {OCCASION_ICONS[occasion.slug]}
                </svg>
                <h3 className={styles.occasionName}>{occasion.name}</h3>
                <p className={styles.occasionLine}>{occasion.line}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── the destinations ───────────────────────────────────────── */}

      <section className={styles.library}>
        <div className={styles.wrap}>
          <h2 className={`eyebrow ${styles.eyebrowDark}`}>The destinations</h2>
          <DestinationPlates />
        </div>
      </section>

      {/* ── one of them, in full ───────────────────────────────────── */}

      <section className={`${styles.worked} ${styles.westhampton}`}>
        <div className={styles.wrap}>
          <div className={styles.workedPlate}>
            <div className={styles.workedTop}>
              <p className={styles.workedWhen}>
                Labor Day. Six friends. A rented house.
              </p>
              <p className={styles.workedIndex}>Destination No. 07</p>
            </div>

            <div className={styles.doubleRuleInk} aria-hidden="true" />

            <h2 className={styles.workedName}>{WESTHAMPTON.name}</h2>

            <div className={`${styles.node} ${styles.nodeInk}`} aria-hidden="true">
              <span />
            </div>

            <p className={styles.workedTagline}>{WESTHAMPTON.tagline}</p>

            <div className={styles.doubleRuleInk} aria-hidden="true" />
          </div>

          <p className={styles.workedNarrative}>{WORKED_NARRATIVE}</p>
        </div>
      </section>

      {/* ── what arrives ───────────────────────────────────────────── */}

      <section className={styles.arrives}>
        <div className={styles.wrap}>
          <h2 className="eyebrow">What arrives</h2>

          <ul className={styles.deliverables}>
            {DELIVERABLES.map((item) => (
              <li className={styles.deliverable} key={item.name}>
                <h3 className={styles.deliverableName}>{item.name}</h3>
                <p className={styles.deliverableLine}>{item.line}</p>
              </li>
            ))}
          </ul>

          {/*
            The printed matter, shown as objects rather than as file names.
            Live markup, not pictures, so the copy stays editable — and set in
            WESTHAMPTON's own palette, because that is the claim: everything
            you send them came from the same place. The lines are the
            destination's authored exemplars (src/lib/destinations.ts), not
            sample text written for a landing page.
          */}
          <div className={styles.specimens}>
            <div className={styles.specimen} data-theme="light">
              <div className={styles.label}>
                <span className={styles.punch} aria-hidden="true" />
                <p className={styles.specimenMark}>Revelle Société</p>
                <p className={styles.specimenDisplay}>
                  Westhampton
                  <br />
                  1976
                </p>
                <div className={styles.specimenRule} aria-hidden="true" />
                {/* Ruled, because a luggage label is a thing somebody writes
                    on. Without the rules the bottom half is dead space and the
                    object stops reading as an object. */}
                <ul className={styles.specimenLines}>
                  <li>Guest</li>
                  <li>Arriving</li>
                  <li>Room</li>
                </ul>
              </div>
            </div>

            <div className={styles.specimen} data-theme="light">
              <div className={styles.menu}>
                <p className={styles.menuHeading}>Drinks, and what follows</p>
                <div className={styles.specimenRule} aria-hidden="true" />
                <ul className={styles.menuItems}>
                  {menu.map((item) => (
                    <li key={item.text}>{item.text}</li>
                  ))}
                </ul>
                <div className={styles.specimenRule} aria-hidden="true" />
                <p className={styles.menuSignOff}>The house, Dune Road.</p>
              </div>
            </div>

            <div className={styles.specimen} data-theme="light">
              <div className={styles.notice}>
                <div className={styles.seal} aria-hidden="true">
                  <div className={styles.sealInner}>
                    <p className={styles.sealMark}>RS</p>
                    <p className={styles.sealYear}>MCMLXXVI</p>
                  </div>
                </div>
                <div className={styles.specimenRule} aria-hidden="true" />
                <ul className={styles.noticeLines}>
                  {notices.map((item) => (
                    <li key={item.text}>{item.text}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <p className={styles.arrivesClose}>
            Everything you send them sounds like it came from the same place.
            Because it did.
          </p>
        </div>
      </section>

      {/* ── not this / more this ───────────────────────────────────────
          No header above it and no thesis line under it. Both were written,
          shown, and cut; the two lists are the argument. */}

      <section className={styles.contrast}>
        <div className={`${styles.wrap} ${styles.contrastGrid}`}>
          <div>
            <h2 className={`${styles.columnHead} ${styles.columnHeadNo}`}>
              Not this
            </h2>
            <ul className={styles.notList}>
              {NOT_THIS.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className={`${styles.columnHead} ${styles.columnHeadYes}`}>
              More this
            </h2>
            <ul className={styles.moreList}>
              {MORE_THIS.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── membership ─────────────────────────────────────────────── */}

      <section className={styles.membership} id="membership">
        {/* Two columns from 64rem up. One column of type against an empty
            half-page read as an unfinished layout rather than as restraint. */}
        <div className={`${styles.wrap} ${styles.membershipGrid}`}>
          <div>
            <p className="eyebrow">Membership</p>
            <h2 className={styles.membershipTitle}>
              Members are <em>known</em>.
            </h2>
          </div>

          <div>
            <p className={styles.membershipBody}>
              Every Revelle is bespoke — designed for these people, this
              occasion, and issued once. Membership is what makes it better each
              time: the société learns your taste, your people, and what
              you&rsquo;d never do twice, so the third is sharper than the first.
            </p>
            <p className={styles.membershipTerms}>Apply once. Dues annually.</p>
            <Link className="cta" href="/quiz">
              Apply
            </Link>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={`${styles.wrap} ${styles.footerRow}`}>
          <p className={styles.footerMark}>Revelle Société</p>
          <p className={styles.footerNote}>Est. for people who host</p>
        </div>
      </footer>
    </>
  );
}
