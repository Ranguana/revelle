import Link from "next/link";
import { notFound } from "next/navigation";

import { requireMember } from "@/lib/members";
import { longDate } from "@/lib/portal/sections";
import { morningLabel, plainChoices, voicedChoices } from "@/lib/correspondence/pieces";
import {
  listGuests,
  listPieces,
  readCorrespondent,
} from "@/lib/correspondence/store";
import { canWrite } from "@/lib/correspondence/writer";
import { themeCss } from "@/lib/tokens";

import { ComposeForm } from "./ComposeForm";
import {
  addGuestAction,
  removeGuestAction,
  setReplyAction,
} from "./actions";

import styles from "./correspondence.module.css";

/**
 * THE CORRESPONDENCE — the room where the writing happens.
 *
 * Three things on one page, in the order they are needed: who is coming, what
 * has been written, and the form that writes the next one. She is doing this
 * on a sofa the week before or in a kitchen on the morning of, so it is one
 * column, real form controls, and no step she has to be walked through.
 *
 * ── PAINTED IN THE DESTINATION'S PALETTE ─────────────────────────────
 *
 * Same argument as the occasion page it hangs off: the writing IS the
 * destination, and a house-coloured page about a destination's voice is a
 * document about a voice rather than the voice. The second scoped block is not
 * a duplicate — see the long note in ../page.tsx about why paper needs its own
 * token block and its own data-theme.
 *
 * ── WHAT IT DOES NOT SAY ─────────────────────────────────────────────
 *
 * No count of guests, no count of pieces, no progress through a list of things
 * a good host sends. docs/copy-brief.md bans counting, and the same rule that
 * keeps a progress bar off the application keeps a checklist off this page.
 * It also never says who or what wrote a line — the house does not introduce
 * its staff, and the opposite claim would be worse.
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

export default async function CorrespondencePage({
  params,
}: PageProps<"/portal/occasions/[id]/correspondence">) {
  const member = await requireMember();
  const { id } = await params;

  const correspondent = await readCorrespondent(member.id, id);
  if (!correspondent) notFound();

  const [guests, pieces] = await Promise.all([
    listGuests(correspondent.revelleId),
    listPieces(correspondent.revelleId),
  ]);

  const voice = correspondent.destination?.voice ?? null;
  const theme = correspondent.destination?.look ?? null;
  const deskIsOpen = canWrite() && voice !== null;

  // A null `days` means the occasion_shape table has no row for her occasion
  // — a lookup gap, not a one-day party. The store used to coalesce it to 1,
  // which silently offered her a single morning bulletin for what might be a
  // three-day weekend and said nothing to anybody. Offering the plain pieces
  // and withholding the day-numbered ones is the honest reading: she keeps
  // everything that does not depend on the count.
  const voiced =
    voice && correspondent.days !== null
      ? voicedChoices(correspondent.days)
      : [];
  const plain = voice ? plainChoices(voice) : [];
  const date = longDate(correspondent.eventDate);

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
          <header className={styles.masthead}>
            <Link className={styles.back} href={`/portal/occasions/${id}`}>
              {correspondent.destinationName}
            </Link>
            {date ? <p className={styles.when}>{date}</p> : null}
          </header>

          <div className={styles.rule} aria-hidden="true" />

          <h1 className={styles.title}>The correspondence</h1>
          <p className={styles.standfirst}>
            Everything that goes to the people you are asking. Say what it has
            to carry — the day, the hour, the thing to bring — and it comes
            back written.
          </p>

          {/* ── THE GUEST LIST ─────────────────────────────────────── */}
          <section className={styles.section}>
            <h2 className={styles.sectionName}>The guest list</h2>

            {/*
              No empty state. A list with nobody on it renders as the form
              that puts somebody on it, which is the only useful thing to
              look at — the same judgement the shelf makes when she has no
              occasions yet.
            */}
            {guests.length > 0 ? (
              <ul className={styles.guests}>
                {guests.map((guest) => (
                  <li className={styles.guest} key={guest.id}>
                    <span className={styles.guestName}>{guest.name}</span>
                    {guest.email ? (
                      <span className={styles.guestAddress}>{guest.email}</span>
                    ) : null}
                    {guest.note ? (
                      <span className={styles.guestNote}>{guest.note}</span>
                    ) : null}

                    <span className={styles.replies}>
                      {REPLIES.map((reply) => (
                        <form action={setReplyAction} key={reply.value}>
                          <input type="hidden" name="revelleId" value={id} />
                          <input type="hidden" name="guestId" value={guest.id} />
                          <input type="hidden" name="reply" value={reply.value} />
                          <button
                            className={`${styles.reply} ${
                              guest.reply === reply.value ? styles.replyOn : ""
                            }`}
                            aria-label={reply.said}
                            aria-pressed={guest.reply === reply.value}
                          >
                            {reply.label}
                          </button>
                        </form>
                      ))}
                      <form action={removeGuestAction}>
                        <input type="hidden" name="revelleId" value={id} />
                        <input type="hidden" name="guestId" value={guest.id} />
                        <button className={styles.remove}>Take off</button>
                      </form>
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}

            <form className={styles.form} action={addGuestAction}>
              <input type="hidden" name="revelleId" value={id} />
              <div className={styles.row}>
                <span className={styles.field}>
                  <label className={styles.label} htmlFor="guest-name">
                    Name
                  </label>
                  <input
                    className={styles.input}
                    id="guest-name"
                    name="name"
                    required
                  />
                </span>
                <span className={styles.field}>
                  <label className={styles.label} htmlFor="guest-email">
                    Where to reach her
                  </label>
                  {/*
                    Not required, and the label does not say optional. Half a
                    real guest list is people who will be told in person, and
                    a list that demands an address for a name is a list she
                    keeps somewhere else instead.
                  */}
                  <input
                    className={styles.input}
                    id="guest-email"
                    name="email"
                    type="email"
                  />
                </span>
                <button className={`${styles.button} ${styles.buttonQuiet}`}>
                  Add
                </button>
              </div>
            </form>
          </section>

          {/* ── WHAT HAS BEEN WRITTEN ──────────────────────────────── */}
          {pieces.length > 0 ? (
            <section className={styles.section}>
              <h2 className={styles.sectionName}>Written</h2>
              <ul className={styles.pieces}>
                {pieces.map((piece) => (
                  <li key={piece.id}>
                    <Link
                      className={styles.piece}
                      href={`/portal/occasions/${id}/correspondence/${piece.id}`}
                    >
                      <span className={styles.pieceKind}>
                        {label(piece.kind, piece.plain, piece.dayIndex)}
                      </span>
                      <span className={styles.pieceLine}>
                        {firstLine(piece.body)}
                      </span>
                      {piece.status === "sent" ? (
                        <span className={styles.stamp}>Sent</span>
                      ) : null}
                      <span className={styles.open} aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* ── WRITE SOMETHING ────────────────────────────────────── */}
          <section className={styles.section}>
            <h2 className={styles.sectionName}>Write something</h2>

            {/*
              The two refusals, in words she can act on, said once and in
              place of the thing they refuse. Neither is a broken button.
            */}
            {voice === null ? (
              <p className={styles.note}>
                {correspondent.destinationName} has no published voice yet.
                Nothing can be written in it until one is.
              </p>
            ) : !canWrite() ? (
              <p className={styles.note}>
                The writing desk is not open. Anything a guest has to act on
                can still go out, and it goes out plain.
              </p>
            ) : null}

            {voice !== null ? (
              <ComposeForm
                revelleId={id}
                voiced={voiced}
                plain={plain}
                deskIsOpen={deskIsOpen}
              />
            ) : null}
          </section>
        </div>
      </main>
    </>
  );
}

/**
 * The three states of a reply, as three small targets.
 *
 * The dash is "nothing has been said", which is a real answer and the one most
 * guests will sit in — WESTHAMPTON's own convention is regrets only, and
 * silence is a yes. It is a control rather than a blank so that a reply she
 * recorded by mistake can be taken back.
 */
const REPLIES = [
  { value: "coming", label: "Coming", said: "Coming" },
  { value: "not_coming", label: "Not", said: "Not coming" },
  { value: "unknown", label: "—", said: "Nothing said" },
] as const;

function label(kind: string, plain: boolean, dayIndex: number | null): string {
  if (plain) return "Plain";
  if (kind === "bulletin") return morningLabel(dayIndex) || "A morning bulletin";
  return KIND_NAMES[kind] ?? kind.replace(/_/g, " ");
}

/** The piece's opening line, which is how she will recognise it. */
function firstLine(body: string): string {
  const line = body.split("\n").find((part) => part.trim().length > 0) ?? "";
  return line.trim();
}
