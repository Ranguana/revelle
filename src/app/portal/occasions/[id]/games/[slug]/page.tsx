import Link from "next/link";
import { notFound } from "next/navigation";

import { requireMember } from "@/lib/members";
import { readOccasion } from "@/lib/portal/occasions";
import { readGamePage, type RunbookSupply } from "@/lib/portal/runbook";
import { inWords } from "@/lib/portal/sections";
import { themeCss } from "@/lib/tokens";

import styles from "./game.module.css";

/**
 * THE GAME PAGE. What she clicks through to from the card in her Revelle.
 *
 * The card is a teaser and it stays one. This is the runbook: before anyone
 * arrives, how to start it, the sequence with timings, how it is judged, how it
 * ends, what to do when it goes wrong, and whether she is playing or running
 * it. Plus the things she has to get, linked to where she gets them, and the
 * things she has to print.
 *
 * ── IT IS READ UNDER PRESSURE, AND THAT IS THE WHOLE BRIEF ───────────
 *
 * Standing up, on a phone, one-handed, with people waiting. So: clarity beats
 * voice wherever the two conflict. The instruction is an imperative and it is
 * the largest thing on the page. The timings sit in a fixed column so scanning
 * down answers "what is next and how long" without reading. Nothing is behind
 * a hover and nothing needs a network round trip to read.
 *
 * The sentences are still hers. The register survives in `detail` and in `say`,
 * which is where the writing lives; the STRUCTURE is a runbook.
 *
 * ── EVERY SECTION OPEN EXCEPT ONE ────────────────────────────────────
 *
 * Native <details>, open by default, for the same reason the occasion page
 * gives: a woman looking for the rules with people in the kitchen should not
 * have to find them first. WHEN IT GOES WRONG is the exception and is closed —
 * it is the only part of this page she goes looking for on purpose, and six
 * paragraphs of hypothetical between "go" and "call time" is how a runbook
 * stops being read.
 *
 * ── NOTHING IS SAID TWICE ────────────────────────────────────────────
 *
 * A step that mentions the canvases prints the game_supply row: its count, its
 * deadline, and the product link where there is one. The runbook does not
 * restate any of it, and db/025 refuses a step that points at a supply the game
 * does not have.
 */

export const dynamic = "force-dynamic";

export default async function GamePage({
  params,
}: PageProps<"/portal/occasions/[id]/games/[slug]">) {
  const member = await requireMember();
  const { id, slug } = await params;

  // The occasion first, for the destination's look. Both reads are scoped by
  // customer id in their own statements; neither trusts the other.
  const occasion = await readOccasion(member.id, id);
  if (!occasion) notFound();

  const game = await readGamePage(member.id, id, slug);
  // Not hers, not openable, not a game in this Revelle, or not a game. One
  // answer for all four: there is nothing here to acknowledge the existence of.
  if (!game) notFound();

  const printed = game.printed;
  const buyable = game.supplies.filter((s) => s.source !== "on_hand");
  const onHand = game.supplies.filter((s) => s.source === "on_hand");

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: themeCss(occasion.theme, `.${styles.page}`),
        }}
      />

      <main className={styles.page}>
        <div className={styles.inner}>
          <header className={styles.masthead}>
            <Link className={styles.back} href={`/portal/occasions/${id}`}>
              {occasion.revelle.destination.name}
            </Link>
          </header>

          <div className={styles.rule} aria-hidden="true" />

          <h1 className={styles.name}>{game.name}</h1>
          <p className={styles.teaser}>{game.description}</p>

          <div className={styles.facts}>
            <div className={styles.fact}>
              <span className={styles.factLabel}>How long</span>
              <span className={styles.factValue}>{howLong(game)}</span>
            </div>
            <div className={styles.fact}>
              <span className={styles.factLabel}>How many</span>
              <span className={styles.factValue}>
                {howMany(game.minGuests, game.maxGuests)}
              </span>
            </div>
            <div className={styles.fact}>
              <span className={styles.factLabel}>Your part</span>
              <span className={styles.factValue}>
                {game.hostRole === "runs_it"
                  ? "You run it, and you are not playing"
                  : "You play, and you keep the clock"}
              </span>
            </div>
            {game.scoring ? (
              <div className={styles.fact}>
                <span className={styles.factLabel}>
                  {game.currencyLabel ?? "Scoring"}
                </span>
                <span className={styles.factValue}>{game.scoring}</span>
              </div>
            ) : null}
          </div>

          {game.hostNote ? (
            <p className={styles.hostNote}>{game.hostNote}</p>
          ) : null}

          {/*
            A recommended game is somebody else's product. The house names it,
            points at it, and states plainly what can go wrong that is not ours
            to fix — db/010 draws that line and db/025 keeps the runbook on the
            house's side of it.
          */}
          {game.caveat ? (
            <p className={styles.caveat}>
              {game.caveat}
              {game.externalUrl ? (
                <>
                  {" "}
                  <a href={game.externalUrl} rel="noreferrer">
                    {game.externalName ?? game.name}
                  </a>
                </>
              ) : null}
            </p>
          ) : null}

          {/* Every game this one needs to have happened, and whether she has
              it. Any one of them satisfies it — db/010's any-of reading. */}
          {game.needs.length > 0 ? (
            <details className={styles.section} open>
              <summary className={styles.sectionHead}>
                <span className={styles.sectionName}>What it runs on</span>
                <span className={styles.marker} aria-hidden="true">
                  +
                </span>
              </summary>
              <p className={styles.sectionNote}>
                Any one of these is enough. The money has to have been earned
                somewhere.
              </p>
              <ul className={styles.things}>
                {game.needs.map((need) => (
                  <li className={styles.thing} key={need.name}>
                    <p className={styles.thingName}>{need.name}</p>
                    {need.note ? (
                      <p className={styles.thingDetail}>{need.note}</p>
                    ) : null}
                    <p className={styles.thingWhen}>
                      {need.placed ? "In your evening" : "Not in your evening"}
                    </p>
                  </li>
                ))}
              </ul>
            </details>
          ) : null}

          {/* THE RUNBOOK. One heading per phase, in the curator's order. */}
          {game.phases.map((phase) => (
            <details className={styles.section} key={phase.phase} open>
              <summary className={styles.sectionHead}>
                <span className={styles.sectionName}>{phase.label}</span>
                <span className={styles.marker} aria-hidden="true">
                  +
                </span>
              </summary>

              <ol className={styles.steps}>
                {phase.steps.map((step) => (
                  <li className={styles.step} key={step.step}>
                    <span className={styles.clock}>
                      {step.minutes === null ? "" : `${step.minutes} min`}
                    </span>
                    <div>
                      <p className={styles.instruction}>{step.instruction}</p>
                      {step.detail ? (
                        <p className={styles.detail}>{step.detail}</p>
                      ) : null}
                      {step.say ? (
                        <p className={styles.say} data-theme="light">
                          <span className={styles.sayMark}>Out loud</span>
                          {step.say}
                        </p>
                      ) : null}
                      {step.supply || step.printed ? (
                        <p className={styles.attached}>
                          {step.supply ? thingLine(step.supply) : null}
                          {step.supply && step.printed ? " · " : null}
                          {step.printed
                            ? `${step.printed.label} — ${count(
                                step.printed.perGuest,
                                step.printed.quantity
                              )}`
                            : null}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            </details>
          ))}

          {/* WHAT TO GET. The shopping edit, meeting the games. */}
          {buyable.length > 0 ? (
            <details className={styles.section} open>
              <summary className={styles.sectionHead}>
                <span className={styles.sectionName}>What to get</span>
                <span className={styles.marker} aria-hidden="true">
                  +
                </span>
              </summary>
              <ul className={styles.things}>
                {buyable.map((supply) => (
                  <li className={styles.thing} key={supply.item}>
                    <p className={styles.thingName}>{supply.item}</p>
                    {supply.detail ? (
                      <p className={styles.thingDetail}>{supply.detail}</p>
                    ) : null}
                    {ahead(supply.leadTimeDays, supply.perGuest, supply.quantity) ? (
                      <p className={styles.thingWhen}>
                        {ahead(supply.leadTimeDays, supply.perGuest, supply.quantity)}
                      </p>
                    ) : null}
                    {supply.products.length > 0 ? (
                      <ul className={styles.buy}>
                        {supply.products.map((product) =>
                          product.url ? (
                            <li key={product.name}>
                              <a href={product.url} rel="noreferrer">
                                {product.name}
                                {product.supplier ? ` — ${product.supplier}` : ""}
                              </a>
                            </li>
                          ) : (
                            <li key={product.name}>
                              <span>{product.name}</span>
                            </li>
                          )
                        )}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ul>
            </details>
          ) : null}

          {onHand.length > 0 ? (
            <details className={styles.section} open>
              <summary className={styles.sectionHead}>
                <span className={styles.sectionName}>What you already have</span>
                <span className={styles.marker} aria-hidden="true">
                  +
                </span>
              </summary>
              <ul className={styles.things}>
                {onHand.map((supply) => (
                  <li className={styles.thing} key={supply.item}>
                    <p className={styles.thingName}>{supply.item}</p>
                    {supply.detail ? (
                      <p className={styles.thingDetail}>{supply.detail}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </details>
          ) : null}

          {/* WHAT GETS PRINTED. Objects, in the destination's own face. */}
          {printed.length > 0 ? (
            <details className={styles.section} open>
              <summary className={styles.sectionHead}>
                <span className={styles.sectionName}>What to print</span>
                <span className={styles.marker} aria-hidden="true">
                  +
                </span>
              </summary>
              <p className={styles.sectionNote}>
                Set in this destination&rsquo;s own face.{" "}
                <Link
                  className={styles.printedLink}
                  href={`/portal/occasions/${id}#printed`}
                >
                  They are with the rest of your printed matter.
                </Link>
              </p>
              <ul className={styles.things}>
                {printed.map((piece) => (
                  <li className={styles.thing} key={piece.piece}>
                    <p className={styles.thingName}>{piece.label}</p>
                    {piece.description ? (
                      <p className={styles.thingDetail}>{piece.description}</p>
                    ) : null}
                    {count(piece.perGuest, piece.quantity) ? (
                      <p className={styles.thingWhen}>
                        {count(piece.perGuest, piece.quantity)}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </details>
          ) : null}

          {/* WHEN IT GOES WRONG. Closed, and the only thing on this page that
              is — see the note at the top. */}
          {game.troubles.length > 0 ? (
            <details className={styles.section}>
              <summary className={styles.sectionHead}>
                <span className={styles.sectionName}>When it goes wrong</span>
                <span className={styles.marker} aria-hidden="true">
                  +
                </span>
              </summary>
              <ul className={styles.troubles}>
                {game.troubles.map((trouble) => (
                  <li key={trouble.trouble}>
                    <p className={styles.troubleName}>{trouble.label}</p>
                    <p className={styles.troubleAnswer}>{trouble.answer}</p>
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </div>
      </main>
    </>
  );
}

/**
 * How long it takes, in words.
 *
 * An ambient game has no duration BY CONSTRUCTION — db/010 forbids one, because
 * it runs as long as the evening does — and saying so is more useful than
 * leaving the fact blank.
 */
function howLong(game: {
  shape: string;
  durationMinutes: number | null;
  durationMaxMinutes: number | null;
}): string {
  if (game.shape === "ambient") return "All evening, and no time out of it";
  if (game.durationMinutes === null) return "As long as it takes";
  if (
    game.durationMaxMinutes === null ||
    game.durationMaxMinutes === game.durationMinutes
  ) {
    return `${game.durationMinutes} minutes`;
  }
  return `${game.durationMinutes} to ${game.durationMaxMinutes} minutes`;
}

/** The group it works for. A constraint, said as a fact about the room. */
function howMany(min: number | null, max: number | null): string {
  if (min !== null && max !== null) return `${min} to ${max}`;
  if (min !== null) return `${min} or more`;
  if (max !== null) return `Up to ${max}`;
  return "Any number";
}

/** How many of an object there are, as a fact about the object. */
function count(perGuest: boolean, quantity: number | null): string {
  if (perGuest) return "One each";
  if (quantity === null || quantity <= 1) return "";
  return `${capital(inWords(quantity))} of them`;
}

/**
 * When something has to be in hand.
 *
 * The one number on this page that is genuinely load-bearing: db/010 says a
 * host who learns on Friday that Saturday needed canvases has been handed a
 * failure by the system that designed her evening.
 */
function ahead(days: number, perGuest: boolean, quantity: number | null): string {
  const how = perGuest
    ? ", one each"
    : quantity !== null && quantity > 1
      ? `, ${inWords(quantity)} of them`
      : "";
  if (days <= 0) return how ? capital(how.slice(2)) : "";
  if (days === 1) return `The day before${how}`;
  if (days === 7) return `A week ahead${how}`;
  if (days === 14) return `A fortnight ahead${how}`;
  return `${capital(inWords(days))} days ahead${how}`;
}

/** The supply a step points at, printed from the row rather than restated. */
function thingLine(supply: RunbookSupply): string {
  const when = ahead(supply.leadTimeDays, supply.perGuest, supply.quantity);
  return when ? `${supply.item} — ${when.toLowerCase()}` : supply.item;
}

function capital(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}
