import Link from "next/link";
import { notFound } from "next/navigation";

import { requireMember } from "@/lib/members";
import { morningLabel } from "@/lib/correspondence/pieces";
import {
  currentDraft,
  listGuests,
  readCorrespondent,
  readPiece,
  recipientsFor,
} from "@/lib/correspondence/store";
import { canWrite } from "@/lib/correspondence/writer";
import { themeCss } from "@/lib/tokens";

import { againAction, editAction, sendAction } from "../actions";
import { Take } from "./Take";

import styles from "../correspondence.module.css";

/**
 * ONE PIECE — read it, change it, then send it or print it.
 *
 * The screen the whole feature is for. Everything on it is arranged around one
 * sentence from docs/portal-spec.md: nothing generated goes out without her
 * reading it first. So the words are the first thing on the page, set as the
 * object they will be, and every control is below them.
 *
 * ── THE TWO CHANGES ARE TWO DIFFERENT THINGS ─────────────────────────
 *
 *   SAY IT DIFFERENTLY  a new line from the house. Her rejection is signal,
 *                       and the line she turned down is kept.
 *   HER OWN WORDS       hers, recorded ALONGSIDE the house's rather than over
 *                       it. The difference between the two is the corpus, and
 *                       an in-place edit would destroy exactly it.
 *
 * Both are visible further down the page under WHAT WAS WRITTEN, because a
 * host who can see what she changed is a host who can tell the house what it
 * keeps getting wrong. That block is not an audit log — it is the product
 * admitting, plainly, that she improved it.
 *
 * ── A PLAIN PIECE HAS NO "SAY IT DIFFERENTLY" ────────────────────────
 *
 * Not disabled — absent. There is nothing to regenerate, because nothing was
 * generated: a plain piece is her facts, laid out. The house never offers to
 * make a cancellation sound more like itself, and the way it never offers is
 * that the control does not exist on this branch.
 */

export const dynamic = "force-dynamic";

const KIND_NAMES: Record<string, string> = {
  invitation: "An invitation",
  notice: "A note to everyone",
  house_note: "A note to one person",
  bulletin: "A morning bulletin",
  menu_item: "A line for the menu",
  place_card: "A place card",
};

export default async function PiecePage({
  params,
  searchParams,
}: PageProps<"/portal/occasions/[id]/correspondence/[pieceId]">) {
  const member = await requireMember();
  const { id, pieceId } = await params;
  const search = await searchParams;

  const correspondent = await readCorrespondent(member.id, id);
  if (!correspondent) notFound();

  const piece = await readPiece(member.id, correspondent.revelleId, pieceId);
  if (!piece) notFound();

  const current = currentDraft(piece);
  if (!current) notFound();

  const guests = await listGuests(correspondent.revelleId);
  const theme = correspondent.destination?.look ?? null;

  // The confirmation panel. Reached only by naming who it is for, and it
  // re-derives the addresses here rather than trusting whatever the link said.
  const to = typeof search.to === "string" ? search.to : null;
  const about = to ? recipientsFor(guests, to) : [];

  const lines = paragraphs(current.body);
  const addressed = guests.filter((guest) => guest.email !== null);

  return (
    <>
      {theme ? (
        <style
          dangerouslySetInnerHTML={{
            __html: [
              themeCss(theme, `.${styles.page}`),
              themeCss(theme, `.${styles.paper}`),
            ].join("\n\n"),
          }}
        />
      ) : null}

      <main className={styles.page}>
        <div className={styles.inner}>
          <header className={`${styles.masthead} ${styles.noPrint}`}>
            <Link
              className={styles.back}
              href={`/portal/occasions/${id}/correspondence`}
            >
              The correspondence
            </Link>
            <p className={styles.when}>
              {piece.plain
                ? "Plain"
                : piece.kind === "bulletin"
                  ? morningLabel(piece.dayIndex)
                  : (KIND_NAMES[piece.kind] ?? piece.kind)}
            </p>
          </header>

          <div className={`${styles.rule} ${styles.noPrint}`} aria-hidden="true" />

          {/*
            THE PIECE. First on the page and set as the object it is: paper in
            the destination's type for a voiced piece, and plainly for one that
            goes out plain. The plain branch is not a variant of the card — it
            has no display face, no mark, and no ornament, because the envelope
            is half the message and a cancellation in a charming envelope is
            the house being charming at somebody about a hospital.
          */}
          {piece.plain ? (
            <div className={styles.plainPaper}>
              {lines.map((line, index) => (
                <p className={styles.plainLine} key={index}>
                  {line}
                </p>
              ))}
            </div>
          ) : (
            <div className={styles.paper} data-theme="light">
              <p className={styles.paperMark}>
                {correspondent.destinationName}
              </p>
              {lines.map((line, index) =>
                index === 0 ? (
                  <p className={styles.paperFirst} key={index}>
                    {line}
                  </p>
                ) : (
                  <p className={styles.paperLine} key={index}>
                    {line}
                  </p>
                )
              )}
            </div>
          )}

          <div className={`${styles.actions} ${styles.noPrint}`}>
            <Take body={current.body} />

            {/*
              Absent on a plain piece, and absent when there is nobody to
              write. Never a disabled control: the house does not offer to
              make a cancellation sound more like itself.
            */}
            {!piece.plain && canWrite() && correspondent.destination ? (
              <form action={againAction}>
                <input type="hidden" name="revelleId" value={id} />
                <input type="hidden" name="pieceId" value={pieceId} />
                <button className={`${styles.button} ${styles.buttonQuiet}`}>
                  Say it differently
                </button>
              </form>
            ) : null}
          </div>

          {/* ── HER OWN WORDS ──────────────────────────────────────── */}
          <section className={`${styles.section} ${styles.noPrint}`}>
            <h2 className={styles.sectionName}>Your own words</h2>
            <form className={styles.form} action={editAction}>
              <input type="hidden" name="revelleId" value={id} />
              <input type="hidden" name="pieceId" value={pieceId} />
              <textarea
                className={styles.area}
                name="body"
                rows={Math.max(4, lines.length + 2)}
                defaultValue={current.body}
                aria-label="The piece, to change"
              />
              <div className={styles.actions}>
                <button className={`${styles.button} ${styles.buttonQuiet}`}>
                  Keep mine
                </button>
              </div>
            </form>
          </section>

          {/* ── SENDING ────────────────────────────────────────────── */}
          <section className={`${styles.section} ${styles.noPrint}`}>
            <h2 className={styles.sectionName}>Send it</h2>

            {search.stale ? (
              <p className={styles.trouble}>
                The words changed while you were looking. Nothing was sent —
                read it again and send it from here.
              </p>
            ) : null}
            {search.nobody ? (
              <p className={styles.trouble}>
                Nobody on the list has an address. Copy it instead, or add one
                on the correspondence page.
              </p>
            ) : null}

            {/*
              TWO STEPS, AND THE SECOND ONE NAMES EVERY ADDRESS.
              The first is a link; the only thing that sends is the button
              inside a panel listing exactly who it goes to. There is no
              control anywhere on this page that sends to everyone in one
              press, which is what "no accidental send-to-all" has to mean if
              it is not going to be a confirm dialog somebody clicks through.
            */}
            {about.length > 0 ? (
              <div className={styles.confirm}>
                <p className={styles.confirmHead}>
                  This goes to
                </p>
                <ul className={styles.confirmList}>
                  {about.map((recipient) => (
                    <li className={styles.confirmLine} key={recipient.email}>
                      {recipient.name} · {recipient.email}
                    </li>
                  ))}
                </ul>
                <div className={styles.actions}>
                  <form action={sendAction}>
                    <input type="hidden" name="revelleId" value={id} />
                    <input type="hidden" name="pieceId" value={pieceId} />
                    <input type="hidden" name="draftId" value={current.id} />
                    <input type="hidden" name="to" value={to ?? ""} />
                    <button className={styles.button}>Send it</button>
                  </form>
                  <Link
                    className={`${styles.button} ${styles.buttonQuiet}`}
                    href={`/portal/occasions/${id}/correspondence/${pieceId}`}
                  >
                    Not now
                  </Link>
                </div>
              </div>
            ) : addressed.length > 0 ? (
              <div className={styles.actions}>
                <Link
                  className={styles.button}
                  href={`?to=everyone`}
                >
                  To everyone
                </Link>
                {addressed.map((guest) => (
                  <Link
                    className={`${styles.button} ${styles.buttonQuiet}`}
                    href={`?to=${guest.id}`}
                    key={guest.id}
                  >
                    {guest.name}
                  </Link>
                ))}
              </div>
            ) : (
              <p className={styles.note}>
                Nobody on the list has an address yet. Copy it, or add one on
                the correspondence page.
              </p>
            )}

            {piece.sends.length > 0 ? (
              <ul className={styles.sends} style={{ marginTop: "1.25rem" }}>
                {piece.sends.map((send, index) => (
                  <li
                    className={`${styles.sendLine} ${
                      send.error ? styles.sendFailed : ""
                    }`}
                    key={`${send.email}-${index}`}
                  >
                    {send.error
                      ? `${send.email} — it did not go. ${send.error}`
                      : `${send.email} — sent`}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          {/* ── WHAT WAS WRITTEN ───────────────────────────────────── */}
          {piece.drafts.length > 1 ? (
            <section className={`${styles.section} ${styles.noPrint}`}>
              <h2 className={styles.sectionName}>What was written</h2>
              <div className={styles.history}>
                {piece.drafts
                  .slice()
                  .reverse()
                  .map((draft) => (
                    <div
                      className={`${styles.version} ${
                        draft.hand === "hers" ? styles.versionHers : ""
                      }`}
                      key={draft.id}
                    >
                      <p className={styles.versionMark}>
                        {draft.hand === "hers"
                          ? "Yours"
                          : draft.id === current.id
                            ? "The house"
                            : "The house, before"}
                      </p>
                      <p className={styles.versionBody}>{draft.body}</p>
                    </div>
                  ))}
              </div>
            </section>
          ) : null}
        </div>
      </main>
    </>
  );
}

/** A piece arrives with its own line breaks. Each is a real element. */
function paragraphs(body: string): string[] {
  return body
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}
