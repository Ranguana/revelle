import {
  BAND_SAID,
  refusedColumns,
  statedCells,
  type QueueClaim,
  type QueuePhoto,
  type Ranked,
} from "@/lib/desk/photo-queue";
import { photoQueue } from "@/lib/desk/photos";
import { stamp } from "@/lib/desk/labels";
import { canRead } from "@/lib/photo-read";
import {
  AFFORDANCE_SAID,
  MAX_PHOTOS,
  ROLE_SAID,
  TONE_SAID,
  type PhotoRole,
} from "@/lib/photo-extract";

import styles from "../../desk.module.css";
import { Empty, Head, Seam } from "../bits";
import {
  keepClaimAction,
  readApplicationAction,
  readPhotoAction,
  setRoleAction,
  strikeClaimAction,
} from "./actions";

/**
 * THE PHOTOGRAPHS A MEMBER ATTACHED, AND WHAT THE HOUSE READ OUT OF THEM.
 *
 * Founder, 2026-09-05: "A member is saying: this light, this table, this era,
 * not that one. Your job is to read the photo, map it onto the house, and put
 * the original away."
 *
 * One row per APPLICATION, never per jpeg — a woman's seven pictures are one
 * statement and reviewing them one at a time is how a set ends up contradicting
 * itself. Three columns: her night in the codes she answered in, her pictures
 * with a control for what each one is for, and the claims one line each with
 * keep and strike.
 *
 * ── WHAT IS NOT ON THIS SCREEN, AND WHY ─────────────────────────────
 *
 * NO DESTINATION NAME. Not a suggestion, not a shortlist, not a "closest
 * room". A photograph proposes cells; which room those cells reach is stage
 * 4's arithmetic and the founder's signature, and putting a room name here
 * would make every keep a vote for it.
 *
 * NO SIMILARITY SCORE, and no similar-image strip. The founder: "Do not store
 * 'similar Pinterest pins.' Store the attributes."
 *
 * NO CONFIDENCE NUMBER. It is on the row, for audit; it is not on the screen,
 * because "it makes people rubber-stamp 0.91". The evidence sentence is what
 * a reviewer is meant to be reading, and a number beside it becomes the
 * decision.
 *
 * NO APPROVE-ALL. "A bulk keep on seven pictures is how `arrival: assigned`
 * sneaks in." Every keep names one claim.
 *
 * ── AND WHY THERE IS NO NEXT BUTTON ─────────────────────────────────
 *
 * CLAUDE.md rule 18. This list is ordered by band, and a decision can move an
 * application between bands — accepting a contradicting claim creates a
 * conflict and lifts the row to the top. An unstable ordering may not host a
 * review pass, and rule 18 says excluding such a screen is the correct reading
 * rather than a gap. What rule 18 actually forbids — a correction landing on a
 * different row — is prevented by every action carrying its own claim id, so a
 * gesture cannot be inherited by whatever moved into that position.
 *
 * ── NOTHING HERE IS WIRED TO THE RANKER, AND THE SCREEN SAYS SO ─────
 *
 * Rules 15 and 16. An accepted cell waits for a `fedBy` entry in
 * data/destination-matrix.json and no entry exists. Until one does, these are
 * proposals on a desk and the seam at the bottom of every application says
 * exactly that — an accepted claim that LOOKS wired is the most expensive
 * thing this codebase could put on a screen.
 */

export const dynamic = "force-dynamic";

export default async function PhotosPage() {
  const queue = await photoQueue();
  const reader = canRead();

  return (
    <>
      <Head eyebrow="Applications" title="Photographs">
        <span className={styles.sub}>
          {queue.length} application{queue.length === 1 ? "" : "s"} with pictures
        </span>
      </Head>

      <Seam title="What a photograph may say">
        <p>
          A picture proposes CELLS — how loud, how dressed, how many, who
          cooked, whether anything is performed. It never names a room, and
          there is nowhere in this schema to put one.
        </p>
        <p>
          Three columns are missing from every list below on purpose:{" "}
          {refusedColumns().map((column, index) => (
            <span key={column.facet}>
              {index > 0 ? "; " : ""}
              <strong>{column.facet}</strong> — {column.why}
            </span>
          ))}
        </p>
        <p>
          <strong>
            Nothing kept here reaches the ranker yet.
          </strong>{" "}
          A cell is only ranked on once it has a supplier written into
          data/destination-matrix.json, and no supplier has been written for
          photographs. Keeping a claim records a judgement; it does not move a
          destination.
        </p>
        {reader ? null : (
          <p>
            <strong>There is no reader configured.</strong> ANTHROPIC_API_KEY is
            unset, so pressing read will store a silence saying so rather than
            failing quietly.
          </p>
        )}
      </Seam>

      {queue.length === 0 ? (
        <Empty>
          No application has attached a photograph yet. A member may attach up
          to {MAX_PHOTOS} on her own screen after she has answered.
        </Empty>
      ) : (
        <div className={styles.rows}>
          {queue.map((row) => (
            <Application key={row.application.id} row={row} reader={reader} />
          ))}
        </div>
      )}
    </>
  );
}

/* ══ one application, three columns ═════════════════════════════════ */

function Application({ row, reader }: { row: Ranked; reader: boolean }) {
  const { application, band, set, reachedFor } = row;
  const stated = statedCells(set.facets);
  const unread = application.photos.filter((photo) => photo.extract === null);

  return (
    <section className={styles.panel} id={`application-${application.id}`}>
      <header className={styles.panelHead}>
        <div>
          <strong>{application.email}</strong>
          <p className={styles.sub}>
            Applied {stamp(application.createdAt)} · {BAND_SAID[band]}
          </p>
        </div>
        {unread.length > 0 && reader ? (
          <form action={readApplicationAction}>
            <input type="hidden" name="application" value={application.id} />
            <button className={styles.button} type="submit">
              Read {unread.length} unread
            </button>
          </form>
        ) : null}
      </header>

      {set.conflicts.length > 0 ? (
        <div className={styles.alarm}>
          <p className={styles.alarmHead}>
            Two kept claims disagree about {set.conflicts.join(", ")}.
          </p>
          <p className={styles.alarmDetail}>
            Those columns state nothing, and they stay silent. There is no
            button here that picks a side — the remedy is to ask her, which is a
            different act and carries her answer instead of yours.
          </p>
        </div>
      ) : null}

      {reachedFor.length > 0 ? (
        <div className={styles.alarm}>
          <p className={styles.alarmHead}>
            The reader reached for {reachedFor.join(", ")}.
          </p>
          <p className={styles.alarmDetail}>
            Refused, three times over: not in the tool, dropped by the parser,
            and refused by the table. Nothing was written. It is on the screen
            so the refusal gets read rather than accumulating unseen.
          </p>
        </div>
      ) : null}

      <div className={styles.panels}>
        {/* ── 1 · HER NIGHT, IN THE CODES SHE ANSWERED IN ───────────── */}
        <div className={styles.panel}>
          <p className={styles.label}>Her night, as stated</p>
          <dl className={styles.facts}>
            <Code label="occasion" value={application.night.occasion} />
            <Code label="environment" value={application.night.environment} />
            <Code label="budget" value={application.night.budget} />
            <Code
              label="how_it_ends → ending"
              value={application.night.howItEnds}
            />
            <Code label="meal_time → starts" value={application.night.mealTime} />
            <Code
              label="taste_directions"
              value={application.night.tasteDirections.join(", ")}
            />
            <Code
              label="group_fun"
              value={application.night.groupFun.join(", ")}
            />
            <Code
              label="anti_preferences"
              value={application.night.antiPreferences.join(", ")}
            />
          </dl>
          <p className={styles.hint}>
            She has already said how it ends and what hour it starts. No
            photograph may argue with either.
          </p>

          <p className={styles.label}>What her pictures state, together</p>
          {stated.length === 0 ? (
            <p className={styles.empty}>Nothing yet.</p>
          ) : (
            <ul className={styles.lines}>
              {stated.map((cell) => (
                <li key={cell.facet} className={styles.line}>
                  {cell.facet} = {cell.level}
                </li>
              ))}
            </ul>
          )}
          <p className={styles.hint}>
            A column is stated only when a kept claim agrees and no kept claim
            contradicts. Nothing is averaged, and a disagreement is silence.
          </p>
        </div>

        {/* ── 2 · THE PICTURES, AND WHAT EACH ONE IS FOR ────────────── */}
        <div className={styles.panel}>
          <p className={styles.label}>
            Her pictures ({application.photos.length} of {MAX_PHOTOS})
          </p>
          <div className={styles.cards}>
            {application.photos.map((photo) => (
              <Picture key={photo.id} photo={photo} reader={reader} />
            ))}
          </div>
        </div>

        {/* ── 3 · THE CLAIMS, ONE LINE EACH ─────────────────────────── */}
        <div className={styles.panel}>
          <p className={styles.label}>Claims</p>
          {application.claims.length === 0 ? (
            <p className={styles.empty}>
              Nothing has been proposed. That is a legal and common answer: a
              frame that states nothing about the evening states nothing about
              the evening.
            </p>
          ) : (
            <ul className={styles.lines}>
              {application.claims.map((claim) => (
                <Claim
                  key={claim.id}
                  claim={claim}
                  photos={application.photos}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

function Code({ label, value }: { label: string; value: string | null }) {
  return (
    <div className={styles.fact}>
      <dt className={styles.factLabel}>{label}</dt>
      <dd className={styles.factValue}>
        {value && value.length > 0 ? <code>{value}</code> : "—"}
      </dd>
    </div>
  );
}

/* ══ one picture ════════════════════════════════════════════════════ */

const OTHER_ROLES: readonly PhotoRole[] = ["evening_she_wants", "object_to_find"];

function Picture({ photo, reader }: { photo: QueuePhoto; reader: boolean }) {
  const extract = photo.extract;

  return (
    <article className={styles.card}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className={styles.cardPicture}
        src={`/desk/photos/${photo.id}/view`}
        alt={`Picture ${photo.ordinal}${photo.filename ? `: ${photo.filename}` : ""}`}
        loading="lazy"
      />
      <p className={styles.cardMeta}>
        {photo.ordinal}. {photo.filename || "untitled"}
      </p>

      <p className={styles.cardObject}>
        {photo.role ? ROLE_SAID[photo.role] : "Nobody has said what this is for."}
      </p>

      {/* THE ORDINARY TWO. A button each, no dropdown: a select that saves on
          change is a role set by a scroll wheel. */}
      <div className={styles.buttonRow}>
        {OTHER_ROLES.filter((role) => role !== photo.role).map((role) => (
          <form key={role} action={setRoleAction}>
            <input type="hidden" name="photo" value={photo.id} />
            <input type="hidden" name="role" value={role} />
            <button className={styles.buttonQuiet} type="submit">
              {ROLE_SAID[role]}
            </button>
          </form>
        ))}
      </div>

      {/* THE DANGEROUS ONE, WITH THE SAME GRAVITY AS ACCEPTANCE.
          Founder: "a sentence, not a checkbox hidden under the thumbnails." */}
      {photo.role === "place_she_has" ? (
        <div className={styles.pickConfirm}>
          <p>
            This is being read as HER OWN PLACE. What it shows about what the
            room can physically do may one day eliminate destinations that
            cannot happen there. It can never make a destination score higher.
          </p>
          <form action={setRoleAction}>
            <input type="hidden" name="photo" value={photo.id} />
            <input type="hidden" name="role" value="" />
            <button className={styles.buttonQuiet} type="submit">
              It is not her place
            </button>
          </form>
        </div>
      ) : (
        <div className={styles.pickConfirm}>
          <p>
            Marking this as the place she HAS is the one setting on this screen
            with consequences beyond the desk. It is the only role that can
            reach feasibility, and a picture saved off the internet marked this
            way becomes evidence about a room she does not have.
          </p>
          <form action={setRoleAction}>
            <input type="hidden" name="photo" value={photo.id} />
            <input type="hidden" name="role" value="place_she_has" />
            <button className={styles.buttonDanger} type="submit">
              This is her own place
            </button>
          </form>
        </div>
      )}

      {extract === null ? (
        <div className={styles.buttonRow}>
          <span className={styles.sub}>Not read.</span>
          {reader ? (
            <form action={readPhotoAction}>
              <input type="hidden" name="photo" value={photo.id} />
              <button className={styles.buttonQuiet} type="submit">
                Read it
              </button>
            </form>
          ) : null}
        </div>
      ) : (
        <>
          {extract.outcome === "silent" ? (
            <p className={styles.cardClause}>
              Read, and it said nothing: {extract.silence}
            </p>
          ) : null}

          {extract.role !== photo.role ? (
            <p className={styles.cardClause}>
              This reading was taken while the picture was
              {extract.role ? ` ${extract.role}` : " unassigned"}. It is stale
              for the role it now has. Read it again if that matters.
            </p>
          ) : null}

          {extract.venue.length > 0 ? (
            <div className={styles.alarm}>
              <p className={styles.alarmHead}>What her place can do</p>
              <ul className={styles.lines}>
                {extract.venue.map((cue) => (
                  <li key={cue.affordance} className={styles.line}>
                    {AFFORDANCE_SAID[cue.affordance]} — {cue.evidence}
                  </li>
                ))}
              </ul>
              <p className={styles.alarmFoot}>
                Positive evidence only. There is no way in this schema to record
                that something is absent, and a frame that does not show a
                kitchen is not a kitchenless house. Nothing consumes these yet.
              </p>
            </div>
          ) : null}

          {extract.tone.length > 0 ? (
            <p className={styles.cardClause}>
              {extract.tone.map((cue) => TONE_SAID[cue.cue]).join(", ")}
            </p>
          ) : null}

          {extract.objects.length > 0 ? (
            <p className={styles.cardClause}>
              Things she named: {extract.objects.map((o) => o.object).join(", ")}
              . These propose no cell and feed nothing; they are kept as her
              own evidence.
            </p>
          ) : null}

          {extract.palette.length > 0 ? (
            <p className={styles.cardMeta}>
              {extract.palette.map((swatch) => (
                <span
                  key={swatch.hex}
                  className={styles.legendSwatch}
                  style={{ background: swatch.hex }}
                  title={`${swatch.hex} · ${Math.round(swatch.share * 100)}%`}
                />
              ))}{" "}
              counted from the pixels, not asked of the reader
            </p>
          ) : null}

          {extract.dropped.length > 0 ? (
            <p className={styles.cardMeta}>
              Dropped: {extract.dropped.map((drop) => drop.said).join("; ")}
            </p>
          ) : null}
        </>
      )}
    </article>
  );
}

/* ══ one claim ══════════════════════════════════════════════════════ */

function Claim({
  claim,
  photos,
}: {
  claim: QueueClaim;
  photos: readonly QueuePhoto[];
}) {
  const from = photos.find((photo) => photo.id === claim.photoId);

  return (
    <li className={claim.status === "struck" ? styles.lineGone : styles.line}>
      <strong>
        {claim.facet} = {claim.level}
      </strong>{" "}
      <span className={styles.sub}>
        from picture {from?.ordinal ?? "?"} · {claim.status}
      </span>
      <p className={styles.candidateWhy}>{claim.evidence}</p>

      {claim.memberStruck ? (
        <p className={styles.hint}>
          She removed this. It cannot go back on this picture. Ask her about it
          instead — that is a different act, and it carries her answer rather
          than yours.
        </p>
      ) : (
        <div className={styles.buttonRow}>
          {claim.status !== "accepted" ? (
            <form action={keepClaimAction}>
              <input type="hidden" name="claim" value={claim.id} />
              <button className={styles.buttonQuiet} type="submit">
                Keep
              </button>
            </form>
          ) : null}
          {claim.status !== "struck" ? (
            <form action={strikeClaimAction}>
              <input type="hidden" name="claim" value={claim.id} />
              <button className={styles.buttonQuiet} type="submit">
                Strike
              </button>
            </form>
          ) : null}
        </div>
      )}
    </li>
  );
}
