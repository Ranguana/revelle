import "server-only";

import { query, queryOne } from "@/lib/db";
import {
  isPhotoRole,
  saidAs,
  TONE_SAID,
  type PhotoRole,
  type ToneCue,
} from "@/lib/photo-extract";
import { recordSystemAction } from "@/lib/staff";

/**
 * HER SIDE OF THE PHOTOGRAPHS.
 *
 * Everything a member may do with the pictures she attached, and the reads
 * behind her own screen. The desk's half is src/lib/desk/photos.ts and the two
 * are deliberately separate files: they authorise differently, they show
 * different things, and one of them can strike something the other can never
 * put back.
 *
 * ── WHAT SHE SEES IS WORDS ───────────────────────────────────────────
 *
 * Founder: "Member side sees words, not facets: warm, sparse, late sun, not
 * costumes. Strike is enough." So nothing in this file returns a facet name, a
 * level, a confidence, a model name or a version. `saidAs` in
 * src/lib/photo-extract.ts turns a cell into the sentence she reads, and that
 * function has one owner precisely so a curator can see the sentence her
 * strike was about.
 *
 * ── HER STRIKE IS DIFFERENT IN KIND FROM THE DESK'S ──────────────────
 *
 * It sets `member_struck_at`, and db/064's trigger then refuses to let that
 * claim become accepted or the strike be lifted — by anybody, from any screen,
 * forever. The desk's remedy is to ask her a question, which is a different
 * act. This is the one place in the product where a member's gesture
 * outranks a curator's.
 *
 * ── AND EVERY READ IS SCOPED BY THE PASS ─────────────────────────────
 *
 * Every function takes `customerId` from `currentApplicant()` and every query
 * joins back to it. An id in a form is never an authorisation: these are
 * pictures of somebody's house.
 */

/* ══ 1 · WHICH APPLICATION THESE PICTURES BELONG TO ══════════════════ */

/**
 * Her newest application, or null.
 *
 * Newest rather than "the one in progress", because `quiz_response` is
 * append-only and a host may bring the house a second occasion (db/063). The
 * pictures she is attaching now are about the night she just described.
 */
export async function myApplication(
  customerId: string
): Promise<{ id: string; createdAt: string } | null> {
  const row = await queryOne<{ id: string; created_at: Date }>(
    `select id::text as id, created_at
       from quiz_response
      where customer_id = $1
      order by created_at desc
      limit 1`,
    [customerId]
  );
  return row
    ? { id: row.id, createdAt: row.created_at.toISOString() }
    : null;
}

/* ══ 2 · WHAT SHE READS BACK ════════════════════════════════════════ */

/** One line she can say no to. She never sees which column it is about. */
export type MemberLine = {
  claimId: string;
  said: string;
  struck: boolean;
};

export type MemberPicture = {
  id: string;
  ordinal: number;
  filename: string;
  role: PhotoRole | null;
  /** Read yet? She is told, because a blank card is not an answer. */
  read: boolean;
  /** "warm, sparse, late sun" — the words, in the order the frame gave them. */
  words: readonly string[];
  lines: readonly MemberLine[];
};

export async function myPictures(
  customerId: string,
  applicationId: string
): Promise<MemberPicture[]> {
  const photos = await query<{
    id: string;
    ordinal: number;
    filename: string;
    role: string | null;
    extract_id: string | null;
    tone: unknown;
  }>(
    `select distinct on (p.id)
            p.id::text as id, p.ordinal, p.filename, p.role::text as role,
            e.id::text as extract_id, e.tone
       from application_photo p
       join quiz_response q on q.id = p.quiz_response_id
       left join application_photo_extract e on e.photo_id = p.id
      where p.quiz_response_id = $1 and q.customer_id = $2
      order by p.id, e.read_at desc nulls last`,
    [applicationId, customerId]
  );
  if (photos.length === 0) return [];

  const claims = await query<{
    id: string;
    photo_id: string;
    facet: string;
    level: string;
    member_struck_at: Date | null;
  }>(
    `select cl.id::text as id, cl.photo_id::text as photo_id,
            cl.facet, cl.level, cl.member_struck_at
       from photo_claim cl
       join application_photo p on p.id = cl.photo_id
       join quiz_response q on q.id = p.quiz_response_id
      where p.quiz_response_id = $1 and q.customer_id = $2
        and cl.status <> 'silent'
      order by cl.facet, cl.level`,
    [applicationId, customerId]
  );

  return photos
    .sort((a, b) => a.ordinal - b.ordinal)
    .map((photo) => ({
      id: photo.id,
      ordinal: photo.ordinal,
      filename: photo.filename,
      role: isPhotoRole(photo.role) ? photo.role : null,
      read: photo.extract_id !== null,
      words: ((photo.tone as ToneCue[]) ?? []).map((cue) => TONE_SAID[cue.cue]),
      lines: claims
        .filter((claim) => claim.photo_id === photo.id)
        .map((claim) => ({
          claimId: claim.id,
          said: saidAs(claim.facet, claim.level),
          struck: claim.member_struck_at !== null,
        })),
    }));
}

/* ══ 3 · WHAT SHE MAY DO ════════════════════════════════════════════ */

export type MemberOutcome = { ok: boolean; said: string };

/**
 * NOT THAT.
 *
 * One claim, struck, permanently, on this picture. The `where` clause carries
 * the ownership join rather than trusting the id, and `member_struck_at is
 * null` makes a second press a no-op rather than moving the date — the date is
 * when she said no, and it does not move.
 *
 * The ledger row is written as the extractor's sibling: `actor = 'member'`,
 * `staff_id` null. She is not staff and the desk must not read her strike as
 * one of its own — that is the whole reason the desk cannot lift it.
 */
export async function strikeAsMember(
  customerId: string,
  claimId: string
): Promise<MemberOutcome> {
  const rows = await query<{
    id: string;
    photo_id: string;
    facet: string;
    level: string;
  }>(
    `update photo_claim cl
        set status = 'struck',
            member_struck_at = now(),
            decided_at = now()
       from application_photo p
       join quiz_response q on q.id = p.quiz_response_id
      where cl.photo_id = p.id
        and cl.id = $1
        and q.customer_id = $2
        and cl.member_struck_at is null
     returning cl.id::text as id, cl.photo_id::text as photo_id,
               cl.facet, cl.level`,
    [claimId, customerId]
  );
  if (rows.length === 0) return { ok: false, said: "" };

  const struck = rows[0];
  await recordSystemAction(MEMBER_ACTOR, {
    action: "photo_claim.struck",
    entityTable: "application_photo",
    entityId: struck.photo_id,
    summary: `She removed ${struck.facet} = ${struck.level}.`,
    detail: {
      claim: struck.id,
      facet: struck.facet,
      level: struck.level,
      previous_status: "proposed",
      status: "struck",
      by: "member",
      // Said in the row, because the desk screen reads this to explain why a
      // line has no buttons.
      note: "A member's strike cannot be lifted. The remedy is a question.",
    },
  });

  return { ok: true, said: "" };
}

/**
 * How the ledger names a member's own act.
 *
 * Not 'staff' — db/036's CHECK ties `staff_id is null` to `actor <> 'staff'`,
 * and the distinction is load-bearing here rather than cosmetic: `staff_recent_
 * activity` is the list of things the HOUSE did, and a member striking a claim
 * about her own evening does not belong in it.
 */
export const MEMBER_ACTOR = "member";

/** Say what one of her pictures is for. Hers to set; the desk may correct it. */
export async function setRoleAsMember(
  customerId: string,
  photoId: string,
  role: PhotoRole | null
): Promise<MemberOutcome> {
  const rows = await query<{ id: string }>(
    `update application_photo p
        set role = $3::photo_role,
            role_set_at = case when $3::photo_role is null then null else now() end
       from quiz_response q
      where q.id = p.quiz_response_id
        and p.id = $1
        and q.customer_id = $2
     returning p.id::text as id`,
    [photoId, customerId, role]
  );
  if (rows.length === 0) return { ok: false, said: "" };

  await recordSystemAction(MEMBER_ACTOR, {
    action: "photo.role_set",
    entityTable: "application_photo",
    entityId: photoId,
    summary: role === null ? "She cleared what a picture is for." : `She set a picture to ${role}.`,
    detail: { role, by: "member" },
  });
  return { ok: true, said: "" };
}

/**
 * TAKE ONE BACK.
 *
 * Her picture, so her call, and the cascade goes with it: the readings and the
 * claims made from a photograph that is no longer here are not evidence about
 * anything. db/064's foreign keys do the cascade.
 *
 * THE ORDINAL IS NOT REUSED, which is why the removal does not quietly free a
 * slot for an eighth. A woman who attaches seven, removes one and attaches
 * another has shown the house eight pictures over the life of this
 * application; six live plus a gap is the true state and the unique index
 * keeps it.
 *
 * The ledger row survives, because `staff_action` is append-only. What was
 * read out of a picture she withdrew stays readable as history and reaches
 * nothing.
 */
export async function removePicture(
  customerId: string,
  photoId: string
): Promise<MemberOutcome> {
  const rows = await query<{ id: string; ordinal: number }>(
    `delete from application_photo p
      using quiz_response q
      where q.id = p.quiz_response_id
        and p.id = $1
        and q.customer_id = $2
     returning p.id::text as id, p.ordinal`,
    [photoId, customerId]
  );
  if (rows.length === 0) return { ok: false, said: "" };

  await recordSystemAction(MEMBER_ACTOR, {
    action: "photo.removed",
    entityTable: "application_photo",
    entityId: photoId,
    summary: "She took a picture back.",
    detail: { ordinal: rows[0].ordinal, by: "member" },
  });
  return { ok: true, said: "" };
}
