import Link from "next/link";
import { notFound } from "next/navigation";

import { requireMember } from "@/lib/members";
import { readOccasion } from "@/lib/portal/occasions";
import { inHouseOrder, inWords, longDate } from "@/lib/portal/sections";
import { themeCss } from "@/lib/tokens";

import styles from "./occasion.module.css";

/**
 * INSIDE AN OCCASION. The screen membership buys.
 *
 * She opens this on the day, on a phone, in a kitchen, with people arriving.
 * That sentence from docs/portal-spec.md is the whole brief and it decides
 * everything below: one column, large type, no hover, no drag, no second hand
 * required, and nothing that needs a network round trip to read. The desktop
 * layout is the adaptation, not the other way round.
 *
 * ── IT IS PAINTED IN THE DESTINATION'S PALETTE, NOT THE HOUSE'S ──────
 *
 * A destination is a look and a voice (src/lib/tokens.ts). The look is a token
 * set, and `themeCss` renders one under any selector — which is what the
 * landing page already does for its Westhampton sections and what the
 * mechanism was built for. Here it is pointed at the whole page. Westhampton
 * must feel like Westhampton when she opens it; a house-coloured page with a
 * destination's name at the top is a document about a destination rather than
 * a destination.
 *
 * The tokens come out of a jsonb column a curator can edit, so they are
 * validated on the way through — src/lib/portal/theme.ts, and the reason is
 * that a colour is interpolated into CSS.
 *
 * ── AN ABSENT DELIVERABLE RENDERS AS NOTHING ─────────────────────────
 *
 * There is no branch below for a missing piece, no empty state, no dash and no
 * heading over a blank space. There is nothing to branch on: the sections come
 * out of `memberRevelle()` already built from pieces that exist, and a section
 * with no pieces is not in the list. If this file ever grows an `if` about
 * something being missing, the wall has been climbed rather than crossed —
 * read the essay at the top of src/lib/selection/member.ts.
 *
 * ── AND NO COUNTERS ──────────────────────────────────────────────────
 *
 * No tally of deliverables, no completion, no badge, no progress. A step
 * counter and a progress bar were taken out of the application for this
 * reason. Quantities that ARE facts about objects — five prompt cards, a
 * ballot each — are said in words beside the object they describe.
 */

export const dynamic = "force-dynamic";

export default async function OccasionPage({
  params,
}: PageProps<"/portal/occasions/[id]">) {
  const member = await requireMember();
  const { id } = await params;

  const occasion = await readOccasion(member.id, id);
  // Not hers, not openable, or not there. One answer for all three: there is
  // nothing here to acknowledge the existence of.
  if (!occasion) notFound();

  const { revelle } = occasion;
  const sections = inHouseOrder(revelle.pieces);
  const printed = inHouseOrder(revelle.printedMatter);
  const date = longDate(occasion.eventDate);

  return (
    <>
      {/*
        The destination's own tokens, twice. Written into the markup rather
        than a stylesheet because the values are a row, and there is nothing to
        link to.

        The SECOND block is not a duplicate and removing it breaks the page in
        dark mode. `themeCss` emits three rules per selector — the light values,
        the dark overrides under prefers-color-scheme guarded by
        `:not([data-theme="light"])`, and the dark overrides again under
        `[data-theme="dark"]`. That guard only bites on the ELEMENT THE BLOCK
        IS SCOPED TO. A `data-theme="light"` on a card inside `.page` therefore
        pins nothing: the card inherits `.page`'s dark values, and in dark mode
        the destination's near-white ink lands on the card's bone paper and the
        headings disappear. Found in a screenshot, which is the only place it
        was ever going to be found.

        So the card gets its own scoped block and its own data-theme, exactly
        as the landing page does for its specimens — and for the same reason.
        Paper does not invert when the reader's phone does.
      */}
      <style
        dangerouslySetInnerHTML={{
          __html: [
            themeCss(occasion.theme, `.${styles.page}`),
            themeCss(occasion.theme, `.${styles.card}`),
          ].join("\n\n"),
        }}
      />

      <main className={styles.page}>
        <div className={styles.inner}>
          <header className={styles.masthead}>
            <Link className={styles.back} href="/portal">
              Revelle Société
            </Link>
            {date ? <p className={styles.when}>{date}</p> : null}
          </header>

          <div className={styles.rule} aria-hidden="true" />

          <h1 className={styles.name}>{revelle.destination.name}</h1>
          <p className={styles.tagline}>{revelle.destination.tagline}</p>
          {occasion.premise ? (
            <p className={styles.premise}>{occasion.premise}</p>
          ) : null}
          {occasion.dedication ? (
            <p className={styles.dedication}>{occasion.dedication}</p>
          ) : null}

          <div className={styles.rule} aria-hidden="true" />

          {/*
            THE DELIVERABLES, each openable.

            A native <details>, open by default. Native because it needs no
            JavaScript, is reachable from a keyboard, has a tap target the
            width of the page and cannot get out of step with the server; open
            by default because a woman looking for the game's rules with people
            in the kitchen should not have to find them first. Closing one is
            how she shortens the page, which is the useful direction.
          */}
          {sections.map((section) => {
            /*
              Whether this section's pieces name their own slot.

              Decided per SECTION rather than per piece, because the question
              is not "does this label repeat" but "can she tell these apart".
              THE FUN holds one game called "The fun" and the label is noise.
              THE TABLE holds the table and the menu, and dropping the labels
              from a section whose pieces are different things leaves two
              names with no idea which is which.
            */
            const label = section.items.some((piece) =>
              adds(piece.heading, section.name)
            );

            return (
            <details className={styles.section} key={section.section} open>
              <summary className={styles.sectionHead}>
                <span className={styles.sectionName}>{section.name}</span>
                <span className={styles.marker} aria-hidden="true" />
              </summary>

              <div className={styles.pieces}>
                {section.items.map((piece) => (
                  <article
                    className={styles.piece}
                    key={`${piece.section}-${piece.heading}-${piece.name}`}
                  >
                    {label ? (
                      <p className={styles.pieceHead}>{piece.heading}</p>
                    ) : null}
                    {/*
                      A GAME IS THE ONE PIECE WITH SOMEWHERE TO GO.
                      The card here is a teaser and stays one; the instructions
                      are a page, because a runbook read in a kitchen needs
                      steps, timings and a place to look when it goes wrong.
                      Every other piece is complete where it stands and gets no
                      link, which is why this is a condition on the pool rather
                      than a link on every heading.
                    */}
                    <h3 className={styles.pieceName}>
                      {piece.pool === "game" ? (
                        <Link
                          className={styles.pieceLink}
                          href={`/portal/occasions/${occasion.id}/games/${piece.slug}`}
                        >
                          {piece.name}
                        </Link>
                      ) : (
                        piece.name
                      )}
                    </h3>
                    {piece.description ? (
                      <div className={styles.pieceBody}>
                        {paragraphs(piece.description).map((line, index) => (
                          <p key={index}>{line}</p>
                        ))}
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            </details>
            );
          })}

          {/*
            THE PRINTED MATTER — objects she is collecting, not file names.

            Set on paper: pinned to the destination's light values with
            data-theme, because a printed card does not invert when the
            reader's phone does. Same judgement the landing page makes about
            its specimens.

            The id is the target a game page links back to: the runbook tells
            her to hand out the ballot, and this is where the ballot is.
          */}
          {printed.length > 0 ? (
            <details className={styles.section} id="printed" open>
              <summary className={styles.sectionHead}>
                <span className={styles.sectionName}>The Printed Matter</span>
                <span className={styles.marker} aria-hidden="true" />
              </summary>

              <div className={styles.printed}>
                {printed.flatMap((group) =>
                  group.items.map((object) => (
                    <div
                      className={styles.card}
                      data-theme="light"
                      key={`${group.section}-${object.heading}-${object.body.slice(0, 24)}`}
                    >
                      <p className={styles.cardMark}>{object.from}</p>
                      <p className={styles.cardHead}>{object.heading}</p>
                      <div className={styles.cardRule} aria-hidden="true" />
                      <p className={styles.cardBody}>{object.body}</p>
                      {howMany(object.perGuest, object.quantity) ? (
                        <p className={styles.cardCount}>
                          {howMany(object.perGuest, object.quantity)}
                        </p>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </details>
          ) : null}

          {/* THE PREP — a short list. Not a project plan. */}
          {occasion.prep.length > 0 ? (
            <details className={styles.section} open>
              <summary className={styles.sectionHead}>
                <span className={styles.sectionName}>The Prep</span>
                <span className={styles.marker} aria-hidden="true" />
              </summary>

              <ul className={styles.prep}>
                {occasion.prep.map((line) => (
                  <li className={styles.prepLine} key={line.item}>
                    <p className={styles.prepItem}>{line.item}</p>
                    {line.detail ? (
                      <p className={styles.prepDetail}>{line.detail}</p>
                    ) : null}
                    {ahead(line.leadTimeDays, line.perGuest) ? (
                      <p className={styles.prepWhen}>
                        {ahead(line.leadTimeDays, line.perGuest)}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </details>
          ) : null}

          {/*
            THE CORRESPONDENCE — the guest list, and everything she sends them.
            A section like the others rather than a button in the masthead: it
            is one of the things that arrived with the destination, and it
            reads as one.
          */}
          <details className={styles.section} open>
            <summary className={styles.sectionHead}>
              <span className={styles.sectionName}>The Correspondence</span>
              <span className={styles.marker} aria-hidden="true" />
            </summary>

            <div className={styles.pieces}>
              <article className={styles.piece}>
                <h3 className={styles.pieceName}>
                  <Link
                    className={styles.pieceLink}
                    href={`/portal/occasions/${id}/correspondence`}
                  >
                    The guest list, and what you send them
                  </Link>
                </h3>
                <div className={styles.pieceBody}>
                  <p>
                    Invitations, notes, and a line at the top of each morning.
                    Say what they have to carry; they come back written.
                  </p>
                </div>
              </article>
            </div>
          </details>
        </div>
      </main>
    </>
  );
}

/**
 * Authored text arrives with blank lines in it — a game's rules are written in
 * paragraphs (db/010). Split rather than rendered with white-space: pre-line
 * so each paragraph is a real element and can be spaced like one.
 */
function paragraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

/**
 * Does this heading say anything the one above it did not?
 *
 * `slot_kind.label` and the house's name for a section are the same words in
 * every section that has one slot — "The fun" under THE FUN — and printing
 * both makes the page look like a form. Compared loosely on purpose: the two
 * differ in case and in nothing else, and a stricter comparison would let a
 * stray space put the duplicate back.
 */
function adds(heading: string, section: string): boolean {
  const flatten = (text: string) =>
    text.toLowerCase().replace(/^the\s+/, "").replace(/\s+/g, " ").trim();
  return heading.trim().length > 0 && flatten(heading) !== flatten(section);
}

/** How many of an object there are, as a fact about the object. */
function howMany(perGuest: boolean, quantity: number | null): string {
  if (perGuest) return "One each";
  if (quantity === null || quantity <= 1) return "";
  return `${capital(inWords(quantity))} of them`;
}

/**
 * When something has to be in hand.
 *
 * A lead time is the one number here that is genuinely load-bearing: a host
 * who learns on Friday that Saturday needed canvases has been handed a
 * failure by the system that designed her evening (db/010 says exactly that).
 * So it is stated plainly and in words, and only when there is a deadline.
 */
function ahead(days: number, perGuest: boolean): string {
  const each = perGuest ? ", one each" : "";
  if (days <= 0) return each ? "One each" : "";
  if (days === 1) return `The day before${each}`;
  if (days === 7) return `A week ahead${each}`;
  if (days === 14) return `A fortnight ahead${each}`;
  return `${capital(inWords(days))} days ahead${each}`;
}

function capital(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}
