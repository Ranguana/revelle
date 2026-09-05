import Link from "next/link";
import { notFound } from "next/navigation";

import { entriesIn, offerLead, type Offer } from "@/lib/portal/choice";
import { readOccasion } from "@/lib/portal/occasions";
import { inHouseOrder, inWords, longDate } from "@/lib/portal/sections";
import { themeCss } from "@/lib/tokens";

import { Inert, PreviewBanner, Stopped, openPreview } from "../../../../Preview";
import occasion from "@/app/portal/occasions/[id]/occasion.module.css";
import frame from "../../../../preview.module.css";

/**
 * INSIDE ONE OF HER OCCASIONS, READ FROM THE DESK.
 *
 * The mirror of src/app/portal/occasions/[id]/page.tsx, and the same bargain as
 * the shelf beside it: the READS and the STYLESHEET are the portal's own, the
 * markup is a second copy because a route component that begins with
 * `requireMember()` cannot be rendered for somebody else without inventing a
 * session for her. IF YOU CHANGE THE OCCASION PAGE, CHANGE BOTH — and the
 * honest fix is to lift its body into a component both routes render, in
 * src/app/portal/ where the portal can own it.
 *
 * What comes from the portal unchanged:
 *
 *   · `readOccasion(customerId, revelleId)`, which scopes to her in the same
 *     statement that finds the row. A revelle id belonging to somebody else
 *     returns null here exactly as it does for her, so the preview cannot be
 *     pointed at another member's occasion by editing the URL.
 *   · `memberRevelle()` behind it — the one sanctioned crossing of the wall.
 *     The preview therefore CANNOT show the house's side (gaps, eliminations,
 *     scores, budget): there is nothing in what it is handed to show. Staff
 *     wanting that already have /desk/applications.
 *   · `inHouseOrder`, `inWords`, `longDate`, `themeCss`, and
 *     occasion.module.css.
 *
 * ── EVERY CONTROL OF HERS, AND WHAT WAS DONE TO IT ───────────────────
 *
 * Her occasion page has no forms and no buttons at all. It has three links —
 * back to /portal, into a game's runbook, into the correspondence — and a set
 * of native <details> panels. So:
 *
 *   · back      → points at the preview's own shelf, never at /portal.
 *   · a game    → NOT rendered as a link. The runbook is a screen this preview
 *                 does not carry, and the name is printed with a line saying
 *                 so. See below for why it is not carried.
 *   · a card    → the CAROUSEL is rendered, and its buttons are not. db/061
 *                 gave the game beat three candidates and db/062 gave each
 *                 course three, so this page would otherwise show nine dishes
 *                 and three games as twelve things the house placed — a
 *                 preview describing a Revelle nobody was sent. Choosing is
 *                 hers alone: staff see which card she took, and there is no
 *                 button here to take one for her.
 *   · the post  → NOT rendered as a link, and for a stronger reason: her guest
 *                 list and her letters are about other people who never agreed
 *                 to be read at the desk.
 *   · <details> → left alone. Opening a disclosure changes nothing, and taking
 *                 it away would misrepresent a page whose whole shape is
 *                 sections she opens and closes.
 */

export const dynamic = "force-dynamic";

export default async function MemberOccasionPreview({
  params,
}: PageProps<"/desk/members/[id]/portal/occasions/[revelleId]">) {
  const { id, revelleId } = await params;
  const { staff, member } = await openPreview(id, {
    at: "occasion",
    revelleId,
  });

  const shelf = `/desk/members/${member.id}/portal`;

  const found = await readOccasion(member.id, revelleId);
  // Not hers, not openable, or not there — the portal's own three-in-one
  // answer, kept. A draft Revelle is not openable and so is not previewable
  // either: what the house is still building is not what she sees.
  if (!found) notFound();

  const { revelle } = found;
  const sections = inHouseOrder(revelle.pieces);
  const printed = inHouseOrder(revelle.printedMatter);
  const date = longDate(found.eventDate);

  return (
    <div className={frame.frame}>
      <PreviewBanner member={member} staff={staff} back={shelf} />

      {/*
        The destination's own tokens, twice, exactly as the portal writes them
        — the second block is not a duplicate, and removing it breaks the cards
        in dark mode. The long argument is in the portal file; the short version
        is that the dark-mode guard only bites on the element the block is
        scoped to, so paper needs its own scoped block to be pinned light.

        Scoped to the same two classes, which means it lands on this page's
        elements and nowhere else. The banner above sits outside both, so the
        warning stays in the house palette while her occasion is painted in the
        destination's.
      */}
      <style
        dangerouslySetInnerHTML={{
          __html: [
            themeCss(found.theme, `.${occasion.page}`),
            themeCss(found.theme, `.${occasion.card}`),
          ].join("\n\n"),
        }}
      />

      <Inert>
        {/* A div, not a <main>: this renders inside the desk's own <main>. */}
        <div className={occasion.page}>
          <div className={occasion.inner}>
            <header className={occasion.masthead}>
              <Link className={occasion.back} href={shelf}>
                Revelle Société
              </Link>
              {date ? <p className={occasion.when}>{date}</p> : null}
            </header>

            <div className={occasion.rule} aria-hidden="true" />

            <h1 className={occasion.name}>{revelle.destination.name}</h1>
            <p className={occasion.tagline}>{revelle.destination.tagline}</p>
            {found.premise ? (
              <p className={occasion.premise}>{found.premise}</p>
            ) : null}
            {found.dedication ? (
              <p className={occasion.dedication}>{found.dedication}</p>
            ) : null}

            <div className={occasion.rule} aria-hidden="true" />

            {sections.map((section) => {
              // Whether this section's pieces name their own slot — decided
              // per SECTION, not per piece. The portal's rule, and its
              // comparison function, copied with it.
              const label = section.items.some((piece) =>
                adds(piece.heading, section.name)
              );

              return (
                <details className={occasion.section} key={section.section} open>
                  <summary className={occasion.sectionHead}>
                    <span className={occasion.sectionName}>{section.name}</span>
                    <span className={occasion.marker} aria-hidden="true" />
                  </summary>

                  <div className={occasion.pieces}>
                    {/*
                      `entriesIn` is the portal's own read (src/lib/portal/
                      choice.ts), not a second one. A beat she chooses in
                      arrives as several rows sharing an offer group, and a
                      preview that rendered them flat would show nine dishes
                      and three games as twelve things the house placed —
                      a page describing a Revelle nobody was sent.
                    */}
                    {entriesIn(section.items).map((entry) =>
                      entry.kind === "piece" ? (
                        <article
                          className={occasion.piece}
                          key={`${entry.piece.section}-${entry.piece.heading}-${entry.piece.name}`}
                        >
                          {label ? (
                            <p className={occasion.pieceHead}>
                              {entry.piece.heading}
                            </p>
                          ) : null}
                          {/*
                            A GAME IS THE ONE PIECE WITH SOMEWHERE TO GO, and
                            here it goes nowhere. The name is set as plain text
                            in the same element the portal uses, so the page
                            reads the same; the line under it says what she has
                            that this does not.
                          */}
                          <h3 className={occasion.pieceName}>
                            {entry.piece.name}
                          </h3>
                          {entry.piece.description ? (
                            <div className={occasion.pieceBody}>
                              {paragraphs(entry.piece.description).map(
                                (line, index) => (
                                  <p key={index}>{line}</p>
                                )
                              )}
                            </div>
                          ) : null}
                          {entry.piece.pool === "game" ? (
                            <Stopped>
                              She can open this one — the runbook is a screen of
                              its own and is not in the preview. It is authored
                              house writing, and it is readable at /desk/games.
                            </Stopped>
                          ) : null}
                        </article>
                      ) : (
                        <PreviewOffer
                          key={entry.offer.group}
                          offer={entry.offer}
                          label={label}
                        />
                      )
                    )}
                  </div>
                </details>
              );
            })}

            {printed.length > 0 ? (
              <details className={occasion.section} id="printed" open>
                <summary className={occasion.sectionHead}>
                  <span className={occasion.sectionName}>
                    The Printed Matter
                  </span>
                  <span className={occasion.marker} aria-hidden="true" />
                </summary>

                <div className={occasion.printed}>
                  {printed.flatMap((group) =>
                    group.items.map((object) => (
                      <div
                        className={occasion.card}
                        data-theme="light"
                        key={`${group.section}-${object.heading}-${object.body.slice(0, 24)}`}
                      >
                        <p className={occasion.cardMark}>{object.from}</p>
                        <p className={occasion.cardHead}>{object.heading}</p>
                        <div className={occasion.cardRule} aria-hidden="true" />
                        <p className={occasion.cardBody}>{object.body}</p>
                        {howMany(object.perGuest, object.quantity) ? (
                          <p className={occasion.cardCount}>
                            {howMany(object.perGuest, object.quantity)}
                          </p>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </details>
            ) : null}

            {found.prep.length > 0 ? (
              <details className={occasion.section} open>
                <summary className={occasion.sectionHead}>
                  <span className={occasion.sectionName}>The Prep</span>
                  <span className={occasion.marker} aria-hidden="true" />
                </summary>

                <ul className={occasion.prep}>
                  {found.prep.map((line) => (
                    <li className={occasion.prepLine} key={line.item}>
                      <p className={occasion.prepItem}>{line.item}</p>
                      {line.detail ? (
                        <p className={occasion.prepDetail}>{line.detail}</p>
                      ) : null}
                      {ahead(line.leadTimeDays, line.perGuest) ? (
                        <p className={occasion.prepWhen}>
                          {ahead(line.leadTimeDays, line.perGuest)}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}

            {/*
              THE CORRESPONDENCE — present, because it is on her page, and shut,
              because it is the one part of her portal that is not about her.
              Her guest list is other people's names and addresses, and her
              letters are what she said to them. Rendering that at the desk
              because it is technically reachable is the kind of thing this
              product is supposed to refuse.
            */}
            <details className={occasion.section} open>
              <summary className={occasion.sectionHead}>
                <span className={occasion.sectionName}>The Correspondence</span>
                <span className={occasion.marker} aria-hidden="true" />
              </summary>

              <div className={occasion.pieces}>
                <article className={occasion.piece}>
                  <h3 className={occasion.pieceName}>
                    The guest list, and what you send them
                  </h3>
                  <div className={occasion.pieceBody}>
                    <p>
                      Invitations, notes, and a line at the top of each morning.
                      Say what they have to carry; they come back written.
                    </p>
                  </div>
                  <Stopped>
                    Not in the preview. Her guest list and her letters are about
                    people who never agreed to be read at the desk.
                  </Stopped>
                </article>
              </div>
            </details>
          </div>
        </div>
      </Inert>
    </div>
  );
}

/**
 * A CAROUSEL AS STAFF SEE IT: every card, the one she took marked, no buttons.
 *
 * The same classes and the same lead line as her page — `offerLead` is
 * exported from src/lib/portal/choice.ts precisely so this cannot drift into a
 * preview of a different sentence. What is missing is the only thing that
 * should be: the form.
 *
 * CHOOSING IS HERS AND THE HOUSE DOES NOT GET A BUTTON FOR IT. db/061 made the
 * offer the thing that binds so that her choice could be changed without limit
 * and never refused; a member of staff able to press it from a preview would
 * be a mind changed by somebody who is not her, with nothing on the page to
 * say it had happened. The preview shows the state and stops there.
 *
 * A card she has not taken is left unmarked rather than labelled. "Not chosen"
 * on two of three cards would read as a verdict on the cards; the absence of a
 * mark reads as what it is, which is a decision she has not made yet.
 */
function PreviewOffer({ offer, label }: { offer: Offer; label: boolean }) {
  return (
    <section className={occasion.offer} aria-label={offer.heading}>
      {label ? <p className={occasion.pieceHead}>{offer.heading}</p> : null}
      <p className={occasion.offerLead}>{offerLead(offer)}</p>

      <div className={occasion.offerCards}>
        {offer.cards.map((card) => (
          <article
            className={occasion.offerCard}
            data-chosen={card.chosen ? "yes" : undefined}
            key={card.slug}
          >
            <h3 className={occasion.pieceName}>{card.name}</h3>
            {card.description ? (
              <div className={occasion.pieceBody}>
                {paragraphs(card.description).map((line, index) => (
                  <p key={index}>{line}</p>
                ))}
              </div>
            ) : null}
            {card.chosen ? <p className={occasion.offerMark}>Yours</p> : null}
          </article>
        ))}
      </div>

      <Stopped>
        She chooses here, and only she does. The preview shows which card she
        has taken and carries no button to take one for her.
      </Stopped>
    </section>
  );
}

/* ── the portal's own small functions, copied ───────────────────────────
 *
 * Private to src/app/portal/occasions/[id]/page.tsx, so they cannot be
 * imported. Copied verbatim rather than reworded: a reworded copy of a pure
 * function is a second behaviour that nobody will notice has diverged. This is
 * the drift surface of the whole preview and it is deliberately this small.
 */

/** Authored text arrives with blank lines in it. Each paragraph an element. */
function paragraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

/** Does this heading say anything the one above it did not? */
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

/** When something has to be in hand. */
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
