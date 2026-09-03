import Link from "next/link";

import { query } from "@/lib/db";
import {
  ACCEPTED_TYPES,
  MAX_UPLOAD_BYTES,
  PLACEMENT_LABEL,
  STAGE_SAID,
  mayApprove,
  stageOf,
  unread,
  type Confidence,
  type Placement,
  type Stage,
} from "@/lib/desk/images";
import { stamp } from "@/lib/desk/labels";

import styles from "../../desk.module.css";
import { Submit } from "./Submit";
import { Empty, Head, Seam } from "../bits";
import DropZone from "./DropZone";
import {
  approvePlacement,
  readEverythingUnread,
  deleteImage,
  readImage,
  refuseImage,
} from "./actions";

/**
 * THE IMAGE BANK.
 *
 * Founder, 2026-09-02: "id need to see it on the dashboard somewhere to okay
 * it. also the image bank should be a droppable area on a tab on the desk so
 * Tara and I can drop images".
 *
 * Two curators drop reference photographs. Each one is read for what OBJECT is
 * in it — the photograph's styling stripped off, which is the whole argument
 * in scripts/mood-board.mjs's header and the reason that reading is worth
 * anything. Rooms are proposed. She approves one into the catalogue or refuses
 * it, here, without editing a file.
 *
 * ── THE PICTURES ARE OTHER PEOPLE'S AND NEVER LEAVE THIS SCREEN ─────
 *
 * Held as private reference. Visible to a signed-in member of STAFF_EMAILS
 * through one route that guards itself, and to nobody else — not the portal,
 * not a package, not an email, not an export. What the product may ship out of
 * a picture is the house's own words about the object in it. Said in db/056,
 * in src/lib/desk/images.ts, in the view route, and here, because those are
 * the four places somebody would write the wrong code.
 *
 * ── NOTHING IS PRE-SELECTED, AND APPROVING IS CHOOSING A ROOM ───────
 *
 * There is no "approve" button on a picture. There is a button on each
 * CANDIDATE ROOM, so the gesture is "this object, into Havana, as the light" —
 * a claim somebody can check. `strong`, `possible` and `weak` are printed at
 * the same size in the same colour: a confidence styled as the obvious answer
 * is a pre-selection wearing a label, and the temptation is strongest exactly
 * where the evidence is thinnest.
 *
 * ── WHAT AN APPROVAL WRITES: A DRAFT, ALWAYS ────────────────────────
 *
 * A `bank_item` with `status = 'draft'` whose description carries the
 * reading's FOUNDER-PENDING question, which is the same mechanism holding the
 * 179 proposals seed-bank already put in the bank. Bank items are a POOL class
 * and pool content stocks itself (CLAUDE.md rule 13) — so the hold-back is not
 * the default and has to be written in, and it is written in by the marker
 * being part of the content. A reading that asked no question produces no row.
 *
 * ── THE CARDS DO NOT MOVE ───────────────────────────────────────────
 *
 * Rule 18. The sort is `dropped_at desc` and nothing on this screen changes
 * when a picture was dropped, so a card approved by mistake is exactly where
 * it was when the page comes back, with the correction — another verdict —
 * in the same place. A refused card STAYS ON THE SCREEN saying it was refused.
 * It does not vanish into a filter: a "no" that makes something disappear is a
 * "no" nobody can check and nobody can reverse.
 */

export const dynamic = "force-dynamic";

type ImageRow = {
  id: string;
  filename: string;
  width: number;
  height: number;
  byte_size: number;
  original_byte_size: number;
  dropped_at: string;
  dropped_by_email: string;
  reading_id: string | null;
  object: string | null;
  styling_note: string | null;
  no_room: boolean | null;
  question: string | null;
  bank_clause: string | null;
  model: string | null;
  read_at: string | null;
  read_by_email: string | null;
};

type CandidateRow = {
  id: string;
  reading_id: string;
  room_slug: string;
  world_id: string | null;
  world_name: string | null;
  placement: Placement;
  confidence: Confidence;
  why: string;
  ordinal: number;
};

type VerdictRow = {
  id: string;
  image_id: string;
  reading_id: string;
  verdict: "approved" | "refused";
  candidate_id: string | null;
  bank_item_id: string | null;
  bank_item_name: string | null;
  bank_item_status: string | null;
  room_slug: string | null;
  note: string;
  decided_at: string;
  decided_by_email: string | null;
};

export default async function ImagesPage({
  searchParams,
}: PageProps<"/desk/images">) {
  const params = await searchParams;
  const refused = one(params.refused);
  const approved = one(params.approved);
  const refusedOk = one(params.refusedOk);
  const read = one(params.read);

  const images = await query<ImageRow>(
    `select i.id::text as id, i.filename, i.width, i.height,
            i.byte_size, i.original_byte_size, i.dropped_at,
            ds.email::text as dropped_by_email,
            r.id::text as reading_id, r.object, r.styling_note, r.no_room,
            r.question, r.bank_clause, r.model, r.read_at,
            rs.email::text as read_by_email
       from reference_image i
       join staff ds on ds.id = i.dropped_by
       left join lateral (
         select rr.* from reference_image_reading rr
          where rr.image_id = i.id
          order by rr.read_at desc, rr.id desc
          limit 1
       ) r on true
       left join staff rs on rs.id = r.read_by
      order by i.dropped_at desc`
  );

  const readingIds = images
    .map((image) => image.reading_id)
    .filter((id): id is string => id !== null);

  const [candidates, verdicts] = await Promise.all([
    readingIds.length === 0
      ? Promise.resolve([] as CandidateRow[])
      : query<CandidateRow>(
          `select c.id::text as id, c.reading_id::text as reading_id,
                  c.room_slug, c.world_id::text as world_id,
                  w.name as world_name,
                  c.placement, c.confidence, c.why, c.ordinal
             from reference_image_candidate c
             left join world w on w.id = c.world_id
            where c.reading_id = any($1::bigint[])
            order by c.reading_id, c.ordinal`,
          [readingIds]
        ),
    // EVERY verdict, not only the one in force. A superseded decision is shown
    // under the current one — a reversal with its predecessor thrown away is
    // an adjudication with the opinion torn off (CLAUDE.md rule 17).
    query<VerdictRow>(
      `select v.id::text as id, v.image_id::text as image_id,
              v.reading_id::text as reading_id, v.verdict,
              v.candidate_id::text as candidate_id,
              v.bank_item_id::text as bank_item_id,
              b.name as bank_item_name, b.status::text as bank_item_status,
              w.slug::text as room_slug,
              v.note, v.decided_at, s.email::text as decided_by_email
         from reference_image_verdict v
         left join staff s on s.id = v.decided_by
         left join bank_item b on b.id = v.bank_item_id
         left join reference_image_candidate c on c.id = v.candidate_id
         left join world w on w.id = c.world_id
        order by v.image_id, v.decided_at desc, v.id desc`
    ),
  ]);

  const byReading = new Map<string, CandidateRow[]>();
  for (const candidate of candidates) {
    const list = byReading.get(candidate.reading_id) ?? [];
    list.push(candidate);
    byReading.set(candidate.reading_id, list);
  }

  const byImage = new Map<string, VerdictRow[]>();
  for (const verdict of verdicts) {
    const list = byImage.get(verdict.image_id) ?? [];
    list.push(verdict);
    byImage.set(verdict.image_id, list);
  }

  const cards = images.map((image) => {
    const history = byImage.get(image.id) ?? [];
    const current = history[0] ?? null;
    return {
      image,
      candidates: image.reading_id
        ? (byReading.get(image.reading_id) ?? [])
        : [],
      history,
      stage: stageOf({
        reading: image.reading_id
          ? { id: Number(image.reading_id), noRoom: image.no_room === true }
          : null,
        verdict: current
          ? {
              id: Number(current.id),
              readingId: Number(current.reading_id),
              verdict: current.verdict,
            }
          : null,
      }),
    };
  });

  const waiting = unread(cards).length;

  return (
    <>
      <Head eyebrow="The library" title="The image bank">
        <Link href="/desk/bank" className={styles.filter}>
          Atmosphere
        </Link>
        <Link href="/desk/publish" className={styles.filter}>
          Publish
        </Link>
      </Head>

      <p className={styles.note}>
        <strong>These are other people&rsquo;s photographs.</strong> They are
        held here as private reference so that two people can point at an object
        and say what it is. They are visible to whoever is signed in at this
        desk and to nobody else — never a member, never a package, never an
        email. What this product may ever ship out of one is the house&rsquo;s
        own words about the object in it, which is the clause each reading
        writes.
      </p>

      <p className={styles.note}>
        Each picture is read for <strong>what the object is</strong>, with the
        photograph&rsquo;s styling stripped off — a shell with wax in it stays a
        shell with wax in it however it was shot. Then rooms are proposed.{" "}
        <strong>No room is a correct answer</strong> and a good many pictures
        get it. Nothing below is pre-selected: approving is choosing a room, so
        the button is on the room, and what it writes is a{" "}
        <strong>draft</strong> carrying the question the reading asked.
      </p>

      {refused ? <p className={styles.error}>{refused}</p> : null}
      {approved ? (
        <p className={styles.ok}>
          Approved — {approved}. It is a <strong>draft</strong> in{" "}
          <Link href="/desk/bank" className={styles.link}>
            the bank
          </Link>
          , held by its founder-pending question until you answer it there.
        </p>
      ) : null}
      {refusedOk ? (
        <p className={styles.ok}>
          Refused — {refusedOk}. The picture stays, so it is not read and
          proposed again.
        </p>
      ) : null}
      {read ? <p className={styles.ok}>{read === "1" ? "Read." : read}</p> : null}

      <DropZone accept={ACCEPTED_TYPES.join(",")} />

      <div className={styles.filters}>
        <span className={styles.hint}>
          {images.length === 0
            ? "nothing in the bank yet"
            : `${images.length} picture${images.length === 1 ? "" : "s"}`}
          {waiting > 0 ? ` · ${waiting} not read yet` : " · all read"}
        </span>
        {waiting > 0 ? (
          <form action={readEverythingUnread}>
            <button className={styles.filter} type="submit">
              Read the unread
            </button>
          </form>
        ) : null}
        <span className={styles.hint}>
          JPEG, PNG, WebP or GIF, up to{" "}
          {Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))}MB each. Everything is
          scaled down on the way in.
        </span>
      </div>

      {cards.length === 0 ? (
        <Empty>
          Nothing has been dropped here yet. Drag a folder of references onto
          the box above, or click it and choose them.
        </Empty>
      ) : (
        <ul className={styles.cards}>
          {cards.map((card) => (
            <Card key={card.image.id} {...card} />
          ))}
        </ul>
      )}

      <Seam title="What this screen will not do">
        It will not put anything in the catalogue on its own. A reading
        proposes; a row exists because you pressed a room. Every row it makes is
        a draft held by its own question, and answering that question is done at{" "}
        <code>/desk/bank</code>, where the row can also be edited or deleted.
        There is no bulk approve and there is no &ldquo;approve the strong
        ones&rdquo; — a machine deciding what belongs in a room is the thing
        this whole screen exists to keep from happening.
      </Seam>

      <Seam title="And two fields it does not fill in">
        A draft made here arrives as something the house <em>stocks</em>, with
        no time of day. Both are left where the schema puts them rather than
        guessed at: <code>supply</code> is written in one place only —{" "}
        <code>seed-bank</code>, from the marker the bank document carries — so a
        clause here that says the evening supplies it still needs that set at{" "}
        <code>/desk/bank</code>. And <code>phase</code> stays{" "}
        <em>no opinion</em>, which is not &ldquo;every phase&rdquo;: most
        atmosphere has no hour, and a field that must be filled in for every row
        gets filled in wrongly.
      </Seam>
    </>
  );
}

/* ── one picture ────────────────────────────────────────────────────── */

function Card({
  image,
  candidates,
  history,
  stage,
}: {
  image: ImageRow;
  candidates: CandidateRow[];
  history: VerdictRow[];
  stage: Stage;
}) {
  const current = history[0] ?? null;
  const superseded = history.slice(1);

  return (
    <li id={`image-${image.id}`} className={cardClass(stage)}>
      {/*
        A PLAIN <img>, AND THE DISABLE BELOW IS THE POINT RATHER THAN A
        SHORTCUT. next/image optimises through /_next/image, which is a PUBLIC
        route: it would take a staff-only reference photograph and re-serve it
        from an unguarded path with a cache of its own. The bytes come from
        /desk/images/[id]/view, which checks the session on every request, and
        the picture was downscaled and thumbnailed on the way in — so there is
        nothing for an optimiser to do here except open a door.
      */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className={styles.cardPicture}
        src={`/desk/images/${image.id}/view`}
        alt={
          image.object
            ? `Reference photograph read as: ${image.object}`
            : `Reference photograph, not yet read${image.filename ? ` — ${image.filename}` : ""}`
        }
        loading="lazy"
      />

      <p className={styles.cardMeta}>
        <span>{STAGE_SAID[stage.state]}</span>
        <span>
          {image.dropped_by_email} · {stamp(image.dropped_at)}
        </span>
        {image.filename ? <span>{image.filename}</span> : null}
        <span>
          {image.width}×{image.height} · {kb(image.byte_size)}KB from{" "}
          {kb(image.original_byte_size)}KB
        </span>
      </p>

      {stage.state === "unread" ? (
      <>
      {/* READ AND DELETE SIT TOGETHER, and only while the picture is unread.
          Reading is one model call and takes seconds, so the button says so
          while it works rather than leaving a still page that reads as "the
          click missed" — the founder pressed it and could not tell. Delete is
          beside it for the wrong-upload case, which is a different act from
          refusing: refusing keeps a picture she considered, deleting removes
          one she never meant to drop. */}
      <div className={styles.buttonRow}>
        <form action={readImage}>
          <input type="hidden" name="image_id" value={image.id} />
          <Submit idle="Read it" working="Reading…" />
        </form>
        <form action={deleteImage}>
          <input type="hidden" name="image_id" value={image.id} />
          <Submit
            idle="Delete"
            working="Deleting…"
            danger
            confirm="Delete this picture and anything read from it? This cannot be undone."
          />
        </form>
      </div>
      </>
      ) : null}

      {image.object ? (
        <>
          <p className={styles.cardObject}>{image.object}</p>
          {image.styling_note ? (
            <p className={styles.candidateWhy}>
              <span className={styles.label}>The photograph</span>{" "}
              {image.styling_note}
            </p>
          ) : null}
          <p className={styles.cardMeta}>
            <span>
              read {stamp(image.read_at)}
              {image.read_by_email ? ` by ${image.read_by_email}` : ""}
            </span>
            <span>{image.model}</span>
          </p>
        </>
      ) : null}

      {"staleVerdict" in stage && stage.staleVerdict ? (
        <p className={styles.error}>
          This picture has been read again since that decision. What is below is
          a <strong>different proposal</strong> from the one you answered, and
          the verdict on the older reading is kept but does not cover it.
        </p>
      ) : null}

      {image.reading_id && image.no_room ? (
        <p className={styles.note}>
          <strong>No room.</strong> The reading found no destination this object
          belongs to. That is a finished answer and a common one — a forced
          placement is worse than an empty one, because somebody then has to
          find it and take it out.
        </p>
      ) : null}

      {candidates.map((candidate) => (
        <Candidate
          key={candidate.id}
          candidate={candidate}
          imageId={image.id}
          question={image.question ?? ""}
        />
      ))}

      {image.bank_clause ? (
        <div>
          <span className={styles.label}>
            The clause it would go in as — the house&rsquo;s own words
          </span>
          <pre className={styles.cardClause}>{image.bank_clause}</pre>
        </div>
      ) : null}

      {image.question ? (
        <p className={styles.candidateWhy}>
          <span className={styles.label}>Founder-pending</span>{" "}
          {image.question}
        </p>
      ) : null}

      {current ? <Decided verdict={current} /> : null}
      {superseded.map((verdict) => (
        <Decided key={verdict.id} verdict={verdict} superseded />
      ))}

      {image.reading_id ? (
        <form action={refuseImage} className={styles.form}>
          <input type="hidden" name="image_id" value={image.id} />
          <div className={styles.field}>
            <label className={styles.label} htmlFor={`${image.id}-note`}>
              Why not, if the record will not say it for you
            </label>
            <input
              id={`${image.id}-note`}
              name="note"
              className={styles.input}
              placeholder="Optional. The object, the rooms and the date are already kept."
            />
          </div>
          <div className={styles.buttonRow}>
            <button className={styles.buttonQuiet} type="submit">
              {current?.verdict === "refused"
                ? "Refuse it again"
                : "No room for this"}
            </button>
            <span className={styles.hint}>
              The picture is kept, so it is not read and proposed again.
            </span>
          </div>
        </form>
      ) : null}
    </li>
  );
}

/* ── one proposed room ──────────────────────────────────────────────── */

function Candidate({
  candidate,
  imageId,
  question,
}: {
  candidate: CandidateRow;
  imageId: string;
  question: string;
}) {
  const allowed = mayApprove({
    placement: candidate.placement,
    worldId: candidate.world_id,
    roomSlug: candidate.room_slug,
  });

  return (
    <div className={styles.candidate}>
      <p className={styles.candidateHead}>
        <span>{candidate.world_name ?? candidate.room_slug}</span>
        <span>{PLACEMENT_LABEL[candidate.placement]}</span>
        {/* Same size, same colour, all three. See the head of this file. */}
        <span className={styles.confidence}>{candidate.confidence}</span>
      </p>
      {candidate.why ? (
        <p className={styles.candidateWhy}>{candidate.why}</p>
      ) : null}

      {allowed.ok ? (
        <form action={approvePlacement}>
          <input type="hidden" name="image_id" value={imageId} />
          <input type="hidden" name="candidate_id" value={candidate.id} />
          <div className={styles.buttonRow}>
            <button className={styles.buttonQuiet} type="submit">
              Into {candidate.world_name ?? candidate.room_slug}
            </button>
            <span className={styles.hint}>
              {question
                ? "Writes a draft in that room, held by the question above."
                : "This reading asked no question, so there is nothing to hold a row in draft — it will be refused rather than written live."}
            </span>
          </div>
        </form>
      ) : (
        <p className={styles.error}>{allowed.refusal}</p>
      )}
    </div>
  );
}

/* ── what was decided ───────────────────────────────────────────────── */

function Decided({
  verdict,
  superseded,
}: {
  verdict: VerdictRow;
  superseded?: boolean;
}) {
  const said =
    verdict.verdict === "approved"
      ? `approved into ${verdict.room_slug ?? "a room"}`
      : "refused";

  return (
    <p className={superseded ? styles.hint : styles.ok}>
      {superseded ? "Before that: " : ""}
      {said} {stamp(verdict.decided_at)}
      {verdict.decided_by_email ? ` by ${verdict.decided_by_email}` : ""}
      {verdict.bank_item_id ? (
        <>
          {" — "}
          <Link
            href={`/desk/bank/${verdict.bank_item_id}`}
            className={styles.link}
          >
            {verdict.bank_item_name ?? "the draft"}
          </Link>
          {verdict.bank_item_status ? ` (${verdict.bank_item_status})` : ""}
        </>
      ) : verdict.verdict === "approved" ? (
        " — the draft it made has since been deleted"
      ) : (
        ""
      )}
      {verdict.note ? ` · ${verdict.note}` : ""}
    </p>
  );
}

/* ── small things ───────────────────────────────────────────────────── */

function cardClass(stage: Stage): string {
  // The three families in bits.tsx, read for what they mean rather than for a
  // status code this table does not have: an unread or read picture is
  // somebody's turn (open), an approved one is in play (live), a refused one
  // is finished with and recedes (closed).
  const family =
    stage.state === "approved"
      ? styles.markLive
      : stage.state === "refused"
        ? styles.markClosed
        : styles.markOpen;
  return `${styles.card} ${family}`;
}

function kb(bytes: number): string {
  return Math.max(1, Math.round(bytes / 1024)).toLocaleString("en-US");
}

function one(value: string | string[] | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}
