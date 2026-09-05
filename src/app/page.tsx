import Link from "next/link";
import { HeroCollage } from "./HeroCollage";

import { WESTHAMPTON_1976 } from "@/lib/destinations";
import {
  DELIVERABLES,
  MORE_THIS,
  NOT_THIS,
  OCCASIONS,
} from "@/lib/library";
import { themeCss } from "@/lib/tokens";

import { OCCASION_ICONS } from "./plates";
import styles from "./landing.module.css";

/**
 * The front door.
 *
 * The page is EVIDENCE, in this order: the range the product covers, the
 * occasions it comes in, one destination worked through in full, what actually
 * arrives, the two lists, and the way in. Nothing on it explains the service,
 * because a house that explains itself is a house nobody wanted to visit. See
 * docs/copy.md for the approved words and docs/copy-brief.md for the rules
 * behind them — the words here are theirs and are not to be improved.
 *
 * ── TWO THINGS THIS PAGE NO LONGER DOES, AND WHY ─────────────────────
 *
 * IT DOES NOT OPEN WITH ONE ROOM. The H1 was WESTHAMPTON, 1976 and the hero
 * was painted in that room's palette. Founder, 2026-09-05: "it shouldnt open
 * with westhampton 1976. just move this line up." That is rule 2 read from the
 * front of the house — "Havana in a Brooklyn apartment isn't a compromise, it's
 * the pitch." A single destination as the headline sells a location, and
 * leading with Westhampton tells a visitor this is for people who have a house
 * in Westhampton. HERO_LINE leads instead: two destinations and then the room
 * she already owns, which is the actual product. The hero is now painted in the
 * HOUSE palette for the same reason — with eighteen genuinely distinct grounds,
 * seven of them dark, wearing one room's colours at the front door is the same
 * claim in paint.
 *
 * IT DOES NOT SHELVE THE DESTINATIONS. A grid of named rooms ran here, and
 * none of the plates linked anywhere. Founder, same day: "you have all the
 * destinations on the landing page but they dont click anywhere, I think its
 * better we dont show the destinations (except for westhampton i guess as an
 * example toward the bottom)." A dead grid promises a page that does not exist
 * — and worse, a menu of eighteen rooms invites "which one do I want?", which
 * is the wrong question: she does not pick, the house assigns from her answers
 * (docs/selection-spec.md, "she does not pick"). So the shelf is gone and
 * Westhampton stays as the one worked example, low on the page, where the
 * reader knows what she is looking at.
 *
 * Nothing was deleted to do either. `LIBRARY` still holds every plate's
 * authored caption, tagline and rows, `POSTERS` still holds the artwork, and
 * DestinationPlates.tsx still renders them — it is simply not called from here.
 * Rule 14: the argument is kept so the next person does not re-make it.
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

/**
 * The plain-English explainer, for the reader who wants the service named
 * before she reads a plate. The founder's words, with two fixes she can revert:
 *
 *   "elevated experience"  -> struck. `elevated` is a house-wide refusal
 *                             ("nothing here is elevated — it is a dinner, a
 *                             lunch, or a night") and `experience` as a noun is
 *                             Nantucket's ("a clambake is a dinner, not an
 *                             experience"). npm run check:voice-output catches
 *                             both.
 *   "Revelle turns it into" -> "you throw". Rule 10: HOST-AS-AUTHOR,
 *                             PRODUCT-AS-INSTRUMENT. The original credits the
 *                             product with her party, which is the same failure
 *                             as "we've done everything".
 *
 * "a customer comes to us" also became "you come to us" — she is reading this,
 * and being called a customer in the third person is colder than the rest of
 * the page. The original is recorded verbatim in docs/copy-brief.md.
 */
const EXPLAINER =
  "Revelle Société is a creative director for your social life. You come to " +
  "us with a moment — a birthday, a girls' weekend, a dinner, a holiday, a " +
  "getaway — and you throw the night you meant to, made yours and made real.";

/**
 * THE HEADLINE. It is not a destination tagline and it never was.
 *
 * WESTHAMPTON.tagline — "Vintage summer glamour. Very questionable
 * houseguests." — describes one destination, and it still runs on the worked
 * plate below and on the library card, where that is exactly its job. It was
 * the wrong thing to open with, because it sells a house rather than the
 * product; so was the room's NAME, which is what the H1 held until
 * 2026-09-05.
 *
 * This line is the thesis, in the founder's words: two destinations and then
 * the room the reader actually owns. It is the same argument
 * src/lib/selection/destination.ts makes in code — "Venue never touches the
 * destination… Havana in a Brooklyn apartment isn't a compromise, it's the
 * pitch." The third clause is the one doing the work. Do not "improve" it by
 * making the third place exotic too.
 *
 * The forms are deliberately unlike each other — a year, a season, a weekday —
 * so the three land as a range rather than a list.
 *
 * ── WHY IT IS SPLIT FOR SETTING, AND WHY THAT IS SAFE ────────────────
 *
 * The constant above is the copy and the only authority for it. The split is
 * typography: three sentences authored as a range are set as three lines, so
 * the range is visible at a glance instead of depending on where a measure
 * happens to wrap. `split` on a lookbehind cannot drop or alter a character —
 * if the pattern ever fails to match, the result is the whole string in one
 * span, which still renders every word. There is no arrangement of this code
 * that can lose her line.
 */
const HERO_LINE =
  "Westhampton, 1976. Portofino, off-season. Your dining room, Saturday.";

const HERO_CLAUSES = HERO_LINE.split(/(?<=\.)\s+/);

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
            themeCss(WESTHAMPTON.look, `.${styles.specimen}`),
          ].join("\n\n"),
        }}
      />

      {/* ── the hero: the range, on the house's own ground ─────────────
          NOT painted in a destination's palette. It was, and that was the
          same claim as the old H1 made in colour: one room's ground at the
          front door tells a visitor the house has one look. There are
          eighteen, seven of them dark, and the page's one room wears its own
          colours further down where it means something. */}

      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.masthead}>
            <div className={styles.mastheadName}>
              <p className={styles.wordmark}>Revelle Société</p>
              {/* Approved text, unchanged — it moved under the wordmark only
                  because the right-hand corner is now the way in. */}
              <p className={styles.mastheadNote}>Est. for people who host</p>
            </div>
            <nav className={styles.mastheadNav} aria-label="Société">
              <Link className={styles.mastheadLink} href="/pricing">
                Pricing
              </Link>
              {/*
                The second door, for someone who already belongs. It signs in
                a member and a curator alike — /login decides which room from
                the address, and says nothing to either of them about which.
              */}
              <Link className={styles.mastheadLink} href="/login">
                Login
              </Link>
            </nav>
          </div>

          {/*
            The handoff's hero, structurally: masthead over a hairline, then two
            columns set to a common baseline — the words on the left, the 4:5
            framed collage on the right. The left column held a destination
            when the handoff was drawn and holds the range now; the composition
            is unchanged. The collage is a sibling of the
            type and never a layer behind it, which is the whole reason nothing
            can land on top of anything here at any width.
          */}
          <div className={styles.heroGrid}>
            <div className={styles.heroPlate}>
              {/* The index and the destination's name were here, above this
                  line. Neither was deleted: both still run on the worked plate
                  further down, which is now the page's one destination and the
                  only place it is claimed. */}
              <h1 className={styles.heroName}>
                {HERO_CLAUSES.map((clause) => (
                  <span key={clause}>{clause}</span>
                ))}
              </h1>
              {/* No ornament between the headline and the line under it. The
                  handoff sets those two as one unit, and the page's single
                  ornament belongs to the worked plate further down. */}
              <p className={styles.heroSociete}>A société for people who host.</p>
              <p className={styles.heroExplainer}>{EXPLAINER}</p>

              <div className={styles.heroActions}>
                <Link className={`cta ${styles.ctaHero}`} href="/apply">
                  Apply for membership
                </Link>
                <p className={styles.fine}>Every party is a destination.</p>
              </div>
              {/*
                The founding offer. It is a count, and the brief bans counting —
                but what the brief bans is counting the EXPERIENCE (durations,
                question tallies) and manufactured scarcity ("247 people
                today"). This is neither: it is a true fact about a real class
                of membership, and "founding members" is the oldest register a
                club has. Written as a standing, not a countdown — no "only N
                left", no timer, nothing that would make her hurry.
              */}
              <p className={styles.heroFounding}>
                The first twenty are founding members. No dues.
              </p>
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

      {/* ── the destinations: CUT, and the argument kept ────────────────
          A shelf of eighteen plates ran here, under the eyebrow "The
          destinations", rendered by DestinationPlates. Founder, 2026-09-05:
          "you have all the destinations on the landing page but they dont
          click anywhere". Two faults, and the second is the one that matters:

            · none of the plates linked anywhere, so a visitor who tried one
              got nothing — a promise of a page that does not exist;
            · a menu of named rooms asks "which one do I want?", and she does
              not pick. The house assigns the room from her answers, and
              docs/selection-spec.md has a whole section saying so. The shelf
              was teaching the opposite of how the product works.

          The plates, their captions, taglines and rows are all still authored
          in src/lib/library.ts and drawn in ./plates.tsx, and
          DestinationPlates.tsx still renders them — nothing was deleted, and a
          route that gives a destination its own page is the thing that would
          bring the shelf back. Rule 14: the argument stays so it is not
          re-made from scratch. */}

      {/* ── the one destination, worked through ─────────────────────
          It was already here and it stays here, which is exactly what the
          founder asked for: "except for westhampton i guess as an example
          toward the bottom". This is now the page's only room, and the only
          block wearing a destination's palette. */}

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
            <Link className="cta" href="/apply">
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
