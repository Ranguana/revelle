import "server-only";

import { query, queryOne } from "@/lib/db";
import {
  isProposalStatus,
  isPhotoRole,
  mergeSet,
  type Dropped,
  type MatrixFacet,
  type ObjectCue,
  type PaletteSwatch,
  type PhotoRole,
  type SilentCell,
  type ToneCue,
  type VenueCue,
} from "@/lib/photo-extract";
import {
  sortQueue,
  type QueueApplication,
  type QueueClaim,
  type QueueExtract,
  type QueuePhoto,
  type Ranked,
} from "@/lib/desk/photo-queue";
import { recordAction, type Staff } from "@/lib/staff";

/**
 * THE PHOTO DESK — what it can read, and the five things it can do.
 *
 * The SQL half. The sort is in src/lib/desk/photo-queue.ts, the vocabulary and
 * the merge rule are in src/lib/photo-extract.ts, and neither of those files
 * can reach a database. This one holds the queries and the five writes, and it
 * is deliberately short on judgement.
 *
 * ── THE FIVE ACTS, AND THE FOUR THINGS THAT ARE NOT ACTS ─────────────
 *
 * A curator may: set a photograph's role, read a photograph, keep one claim,
 * strike one claim, and nothing else.
 *
 * She may NOT, and there is no code here for any of them:
 *
 *   · name a destination. There is no column and no argument that takes one.
 *   · accept everything. The founder: "A bulk keep on seven pictures is how
 *     `arrival: assigned` sneaks in." No loop over claims exists in this file
 *     and none may be added.
 *   · put back something the MEMBER struck. db/064's trigger refuses it; this
 *     file refuses it earlier and in words, so the answer arrives as a
 *     sentence rather than as a database error.
 *   · resolve a conflict by picking a side. Two kept claims that disagree
 *     leave the column silent, and the remedy is a question to her — a
 *     different act, with a different record, which this feature does not
 *     build.
 */

/* ══ 1 · READING THE QUEUE ══════════════════════════════════════════ */

type ApplicationRow = {
  id: string;
  email: string;
  created_at: Date;
  occasion: string;
  environment: string;
  budget: string;
  answers: Record<string, unknown> | null;
  taste_directions: string[] | null;
  group_fun: string[] | null;
  anti_preferences: string[] | null;
};

type PhotoRow = {
  id: string;
  quiz_response_id: string;
  ordinal: number;
  filename: string;
  role: string | null;
  extract_id: string | null;
  version: string | null;
  model: string | null;
  extract_role: string | null;
  may_prune: boolean | null;
  outcome: string | null;
  silence: string | null;
  palette: unknown;
  venue: unknown;
  tone: unknown;
  objects: unknown;
  dropped: unknown;
  read_at: Date | null;
};

type ClaimRow = {
  id: string;
  photo_id: string;
  quiz_response_id: string;
  facet: string;
  level: string;
  evidence: string;
  status: string;
  confidence: string;
  member_struck_at: Date | null;
};

/**
 * Every application carrying at least one photograph, in the founder's order.
 *
 * ── WHY IT IS THREE QUERIES AND NOT ONE JOIN ─────────────────────────
 *
 * A single join across applications × photographs × claims multiplies rows and
 * the bytes are on the photo table. Three narrow reads and an assembly in
 * memory is cheaper and, more usefully, is a shape somebody can read: each
 * query answers one question, and none of them selects `bytes` or `thumb`.
 *
 * NOTHING HERE READS THE PIXELS. The list renders `<img>` tags pointing at the
 * guarded view route, which is the only reader.
 */
export async function photoQueue(limit = 50): Promise<Ranked[]> {
  const applications = await query<ApplicationRow>(
    `select q.id::text as id,
            c.email::text as email,
            q.created_at,
            q.occasion::text as occasion,
            q.environment::text as environment,
            q.budget::text as budget,
            q.answers,
            q.taste_directions,
            q.group_fun,
            q.anti_preferences
       from quiz_response q
       join customer c on c.id = q.customer_id
      where exists (select 1 from application_photo p
                     where p.quiz_response_id = q.id)
      order by q.created_at desc
      limit $1`,
    [limit]
  );
  if (applications.length === 0) return [];

  const ids = applications.map((row) => row.id);

  // The NEWEST reading per photograph. `distinct on` rather than a window
  // function because the ordering is the whole of the question and this says
  // so in one line. A photograph read twice keeps both rows — a superseded
  // reading is evidence, not litter (rule 14) — and the desk shows the latest.
  const photos = await query<PhotoRow>(
    `select distinct on (p.id)
            p.id::text as id,
            p.quiz_response_id::text as quiz_response_id,
            p.ordinal, p.filename, p.role::text as role,
            e.id::text as extract_id, e.version, e.model,
            e.role::text as extract_role, e.may_prune,
            e.outcome, e.silence, e.palette, e.venue, e.tone, e.objects,
            e.dropped, e.read_at
       from application_photo p
       left join application_photo_extract e on e.photo_id = p.id
      where p.quiz_response_id = any($1::uuid[])
      order by p.id, e.read_at desc nulls last`,
    [ids]
  );

  const claims = await query<ClaimRow>(
    `select cl.id::text as id,
            cl.photo_id::text as photo_id,
            p.quiz_response_id::text as quiz_response_id,
            cl.facet, cl.level, cl.evidence, cl.status::text as status,
            cl.confidence::text as confidence, cl.member_struck_at
       from photo_claim cl
       join application_photo p on p.id = cl.photo_id
      where p.quiz_response_id = any($1::uuid[])
      order by p.ordinal, cl.facet, cl.level`,
    [ids]
  );

  const assembled: QueueApplication[] = applications.map((row) => ({
    id: row.id,
    email: row.email,
    createdAt: row.created_at.toISOString(),
    night: {
      occasion: row.occasion,
      environment: row.environment,
      budget: row.budget,
      // The two answers that already feed the matrix, read out of the verbatim
      // payload rather than out of a projection, because that is where they
      // are. They are shown on the review screen so a curator can see WHY a
      // photograph is not allowed to speak to `ending` or `starts` — she
      // already did.
      howItEnds: answerCode(row.answers, "how_it_ends"),
      mealTime: answerCode(row.answers, "meal_time"),
      tasteDirections: row.taste_directions ?? [],
      groupFun: row.group_fun ?? [],
      antiPreferences: row.anti_preferences ?? [],
    },
    photos: photos
      .filter((photo) => photo.quiz_response_id === row.id)
      .sort((a, b) => a.ordinal - b.ordinal)
      .map(toQueuePhoto),
    claims: claims
      .filter((claim) => claim.quiz_response_id === row.id)
      .map(toQueueClaim),
  }));

  return sortQueue(assembled);
}

/** One application, for a screen that wants only one. Same assembly. */
export async function photoQueueFor(
  applicationId: string
): Promise<Ranked | null> {
  const all = await photoQueue(200);
  return all.find((row) => row.application.id === applicationId) ?? null;
}

function toQueuePhoto(row: PhotoRow): QueuePhoto {
  const extract: QueueExtract | null =
    row.extract_id === null
      ? null
      : {
          id: row.extract_id,
          version: row.version ?? "",
          model: row.model ?? "",
          role: isPhotoRole(row.extract_role) ? row.extract_role : null,
          mayPrune: row.may_prune === true,
          outcome: row.outcome === "read" ? "read" : "silent",
          silence: row.silence,
          palette: (row.palette as PaletteSwatch[]) ?? [],
          venue: (row.venue as VenueCue[]) ?? [],
          tone: (row.tone as ToneCue[]) ?? [],
          objects: (row.objects as ObjectCue[]) ?? [],
          dropped: (row.dropped as Dropped[]) ?? [],
          readAt: row.read_at?.toISOString() ?? "",
        };
  return {
    id: row.id,
    ordinal: row.ordinal,
    filename: row.filename,
    role: isPhotoRole(row.role) ? row.role : null,
    extract,
  };
}

function toQueueClaim(row: ClaimRow): QueueClaim {
  return {
    id: row.id,
    photoId: row.photo_id,
    facet: row.facet as MatrixFacet,
    level: row.level,
    evidence: row.evidence,
    status: isProposalStatus(row.status) ? row.status : "silent",
    memberStruck: row.member_struck_at !== null,
    confidence: Number(row.confidence),
  };
}

/** One answer's code out of the verbatim payload. Defensive by design. */
function answerCode(
  answers: Record<string, unknown> | null,
  field: string
): string | null {
  if (!answers) return null;
  const value = answers[field];
  if (typeof value === "string" && value.trim() !== "") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return null;
}

/* ══ 2 · WHAT A CURATOR MAY DO ══════════════════════════════════════ */

export type ClaimOutcome = { ok: true; said: string } | { ok: false; said: string };

type ClaimContext = {
  id: string;
  photoId: string;
  applicationId: string;
  facet: string;
  level: string;
  status: string;
  memberStruck: boolean;
};

async function claimContext(claimId: string): Promise<ClaimContext | null> {
  const row = await queryOne<{
    id: string;
    photo_id: string;
    quiz_response_id: string;
    facet: string;
    level: string;
    status: string;
    member_struck_at: Date | null;
  }>(
    `select cl.id::text as id, cl.photo_id::text as photo_id,
            p.quiz_response_id::text as quiz_response_id,
            cl.facet, cl.level, cl.status::text as status, cl.member_struck_at
       from photo_claim cl
       join application_photo p on p.id = cl.photo_id
      where cl.id = $1`,
    [claimId]
  );
  return row
    ? {
        id: row.id,
        photoId: row.photo_id,
        applicationId: row.quiz_response_id,
        facet: row.facet,
        level: row.level,
        status: row.status,
        memberStruck: row.member_struck_at !== null,
      }
    : null;
}

/**
 * KEEP ONE CLAIM.
 *
 * One claim. There is no plural form of this function and there must not be
 * one — the founder's reason is that "a bulk keep on seven pictures is how
 * `arrival: assigned` sneaks in", and the defence is that keeping is tedious
 * enough that nobody does it without reading.
 *
 * ── HER STRIKE IS REFUSED HERE AND AGAIN IN THE DATABASE ─────────────
 *
 * db/064's trigger is the wall. This check exists so that the answer arrives
 * as an English sentence naming the remedy — ask her — rather than as a
 * `restrict_violation` a screen would have to translate. Two layers, and the
 * outer one is for the person.
 */
export async function keepClaim(
  staff: Staff,
  claimId: string
): Promise<ClaimOutcome> {
  const claim = await claimContext(claimId);
  if (!claim) return { ok: false, said: "That claim is no longer here." };

  if (claim.memberStruck) {
    return {
      ok: false,
      said:
        `She removed ${claim.facet} = ${claim.level} from this picture. It ` +
        `cannot go back on this picture. Ask her about it instead — that is a ` +
        `different act, and it will carry her answer rather than yours.`,
    };
  }

  const rows = await query<{ id: string }>(
    `update photo_claim
        set status = 'accepted', decided_at = now()
      where id = $1 and member_struck_at is null
     returning id::text as id`,
    [claimId]
  );
  if (rows.length === 0) {
    return { ok: false, said: "Nothing changed. Read the row again." };
  }

  await recordAction(staff, {
    action: "photo_claim.accepted",
    entityTable: "application_photo",
    entityId: claim.photoId,
    summary: `Kept ${claim.facet} = ${claim.level}.`,
    detail: {
      application: claim.applicationId,
      claim: claimId,
      facet: claim.facet,
      level: claim.level,
      previous_status: claim.status,
      status: "accepted",
    },
  });

  await noteConflict(staff, claim.applicationId);
  return { ok: true, said: `Kept ${claim.facet} = ${claim.level}.` };
}

/**
 * STRIKE ONE CLAIM, as the desk.
 *
 * `member_struck_at` is NOT set — that column means SHE did it, and a curator
 * writing it would be forging her signature and locking herself out at the
 * same time. A desk strike is reversible by the desk, which is rule 18's
 * Publish/Withdraw pair: the correction sits beside the act.
 */
export async function strikeClaim(
  staff: Staff,
  claimId: string
): Promise<ClaimOutcome> {
  const claim = await claimContext(claimId);
  if (!claim) return { ok: false, said: "That claim is no longer here." };

  const rows = await query<{ id: string }>(
    `update photo_claim
        set status = 'struck', decided_at = now()
      where id = $1
     returning id::text as id`,
    [claimId]
  );
  if (rows.length === 0) {
    return { ok: false, said: "Nothing changed. Read the row again." };
  }

  await recordAction(staff, {
    action: "photo_claim.struck",
    entityTable: "application_photo",
    entityId: claim.photoId,
    summary: `Struck ${claim.facet} = ${claim.level}.`,
    detail: {
      application: claim.applicationId,
      claim: claimId,
      facet: claim.facet,
      level: claim.level,
      previous_status: claim.status,
      status: "struck",
      by: "desk",
    },
  });

  await noteConflict(staff, claim.applicationId);
  return { ok: true, said: `Struck ${claim.facet} = ${claim.level}.` };
}

/**
 * SET WHAT A PHOTOGRAPH IS FOR.
 *
 * The founder: "setting `place_she_has` is the dangerous one — confirm with
 * the same gravity as acceptance: a sentence, not a checkbox hidden under the
 * thumbnails." The gravity is on the screen; what is here is the record and
 * the one consequence: A ROLE CHANGE DOES NOT RE-READ THE PHOTOGRAPH.
 *
 * That is deliberate and it is the safer half. `may_prune` is stamped on the
 * EXTRACT from the role as it stood when the frame was read, so moving a
 * picture to `place_she_has` afterwards does not retroactively turn a taste
 * reading into evidence about her house. It marks the reading stale, the desk
 * says so, and a curator presses read again — which is a person deciding that
 * the second reading is the one that counts.
 */
export async function setPhotoRole(
  staff: Staff,
  photoId: string,
  role: PhotoRole | null
): Promise<ClaimOutcome> {
  const before = await queryOne<{
    role: string | null;
    quiz_response_id: string;
  }>(
    `select role::text as role, quiz_response_id::text as quiz_response_id
       from application_photo where id = $1`,
    [photoId]
  );
  if (!before) return { ok: false, said: "That picture is no longer here." };

  await query(
    `update application_photo
        set role = $2::photo_role,
            role_set_at = case when $2::photo_role is null then null else now() end
      where id = $1`,
    [photoId, role]
  );

  await recordAction(staff, {
    action: "photo.role_set",
    entityTable: "application_photo",
    entityId: photoId,
    summary:
      role === null
        ? "Cleared what this picture is for."
        : `Set this picture to ${role}.`,
    detail: {
      application: before.quiz_response_id,
      previous_role: before.role,
      role,
      by: "desk",
      // Said in the ledger as well as on the screen, because the next reader
      // of this row will want to know whether the reading beside it was taken
      // before or after.
      note: "The existing reading was taken under the previous role and is stale.",
    },
  });

  return { ok: true, said: "Saved." };
}

/**
 * A CONFLICT IS NOTED, NOT RESOLVED.
 *
 * Written after any decision that could have produced one. It is a ledger row
 * and not a column: the conflict itself is computed by `mergeSet` on every
 * read (the founder: "the set is a view"), and what is worth recording is that
 * one CAME INTO EXISTENCE at a particular moment because of a particular act.
 *
 * Nothing here picks a side. Two kept claims that disagree leave the column
 * silent, and the remedy is a question to her.
 */
async function noteConflict(staff: Staff, applicationId: string): Promise<void> {
  const rows = await query<{ facet: string; level: string; status: string }>(
    `select cl.facet, cl.level, cl.status::text as status
       from photo_claim cl
       join application_photo p on p.id = cl.photo_id
      where p.quiz_response_id = $1`,
    [applicationId]
  );

  const set = mergeSet(
    applicationId,
    [],
    rows.map((row) => ({
      facet: row.facet as MatrixFacet,
      level: row.level,
      status: isProposalStatus(row.status) ? row.status : "silent",
    }))
  );
  if (set.conflicts.length === 0) return;

  await recordAction(staff, {
    action: "photo_set.conflict",
    entityTable: "quiz_response",
    entityId: applicationId,
    summary:
      `Kept claims disagree about ${set.conflicts.join(", ")}. ` +
      `Those columns state nothing.`,
    detail: {
      application: applicationId,
      conflicts: set.conflicts,
      levels: set.facets
        .filter(
          (facet): facet is SilentCell =>
            facet.state === "conflict"
        )
        .map((facet) => ({ facet: facet.facet, levels: facet.levels })),
    },
  });
}
