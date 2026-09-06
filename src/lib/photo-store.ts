import "server-only";

import sharp from "sharp";

import { query, queryOne } from "@/lib/db";
import {
  MAX_PHOTOS,
  PHOTO_LONG_EDGE,
  PHOTO_THUMB_EDGE,
  type PaletteSwatch,
  type PhotoRole,
} from "@/lib/photo-extract";
import {
  SNIFF_BYTES,
  STORED_TYPE,
  checkUpload,
  sha256Hex,
} from "@/lib/desk/images";

/**
 * KEEPING A MEMBER'S PHOTOGRAPH, AND COUNTING ITS COLOURS.
 *
 * The half of the photo pipeline that touches bytes and rows. Every DECISION
 * — what may be proposed, what a reply means, how a set merges — is in
 * src/lib/photo-extract.ts, which is framework-free and testable. This file is
 * sharp, one insert and two reads.
 *
 * ── WHY IT REUSES src/lib/desk/images.ts's DOOR AND NOT ITS DOWNSCALE ─
 *
 * `checkUpload`, `sniffImage` and `sha256Hex` are about WHAT A FILE HAS TO BE
 * BEFORE ANYTHING DECODES IT — magic bytes against the declared type, a size
 * ceiling, a refusal that names which half was wrong. That question has one
 * answer in this house and it is already written down; a second copy would be
 * a second security decision, which is the worst kind to have two of
 * (CLAUDE.md rule 21).
 *
 * The RESIZE is a different matter and is deliberately not shared. The bank
 * stores at 1600 for two curators browsing at full size; a member's frame is
 * stored at 1280 because that is what the founder specified for the reading,
 * and a shared constant would make the next change to either one a change to
 * both. Both numbers live beside their arguments — 1600 in desk/images.ts,
 * 1280 in photo-extract.ts.
 *
 * ── THE PICTURES ARE HERS ────────────────────────────────────────────
 *
 * Said here, in db/064, and in each of the two view routes, because those are
 * the places somebody would write the wrong code. An `application_photo` row
 * is readable by a signed-in member of STAFF_EMAILS and by the applicant
 * herself through her own application pass. By nobody else: not the portal,
 * not an occasion package, not an email, not an export, not an artifact.
 * `photoBytes` below is the only reader of the pixels in this codebase.
 *
 * ── THE PALETTE IS COUNTED ───────────────────────────────────────────
 *
 * Founder: "VLMs invent #C4A574. Count pixels." So it is counted, here, from
 * the stored copy, and it never appears in the tool schema. A model asked for
 * a hex code will return a plausible one, and a plausible hex code is a lie
 * with six digits of precision.
 */

/* ══ 1 · THE PALETTE, FROM THE PIXELS ════════════════════════════════ */

/** How many colours are kept. Enough to describe a frame, few enough to read. */
const SWATCHES = 5;

/**
 * The grid the counting happens on: 64×64, which is 4096 samples.
 *
 * Small enough that this costs nothing beside a resize that is happening
 * anyway, large enough that a lamp in the corner does not disappear. `fit:
 * "fill"` rather than "inside" because the aspect ratio is irrelevant to a
 * colour census and "inside" would make the sample count depend on the shape
 * of the photograph.
 */
const SAMPLE_EDGE = 64;

/**
 * Buckets per channel. 8, i.e. the top three bits.
 *
 * Coarse on purpose. The question a palette answers here is "what colours is
 * this frame made of", and at 32 levels per channel every gradient in a sky
 * becomes its own colour and the top five are five shades of the same blue.
 * The hex that comes back is the MEAN of the bucket's members rather than the
 * bucket's centre, so the coarseness costs accuracy in grouping and not in
 * the reported value.
 */
const BUCKET_SHIFT = 5;

/**
 * What this frame is made of, as counted colours.
 *
 * Deterministic: the same bytes always produce the same list, in the same
 * order, which is what makes it usable as evidence rather than as decoration.
 * Ties break on the bucket index, so two colours with identical counts do not
 * swap places between runs.
 */
export async function palette(bytes: Buffer): Promise<PaletteSwatch[]> {
  const { data } = await sharp(bytes)
    .rotate()
    .resize({ width: SAMPLE_EDGE, height: SAMPLE_EDGE, fit: "fill" })
    .removeAlpha()
    .toColourspace("srgb")
    .raw()
    .toBuffer({ resolveWithObject: true });

  const count = new Map<number, { n: number; r: number; g: number; b: number }>();
  for (let i = 0; i + 2 < data.length; i += 3) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const key =
      ((r >> BUCKET_SHIFT) << (2 * (8 - BUCKET_SHIFT))) |
      ((g >> BUCKET_SHIFT) << (8 - BUCKET_SHIFT)) |
      (b >> BUCKET_SHIFT);
    const seen = count.get(key);
    if (seen) {
      seen.n += 1;
      seen.r += r;
      seen.g += g;
      seen.b += b;
    } else {
      count.set(key, { n: 1, r, g, b });
    }
  }

  const total = [...count.values()].reduce((sum, bucket) => sum + bucket.n, 0);
  if (total === 0) return [];

  return [...count.entries()]
    .sort((a, b) => b[1].n - a[1].n || a[0] - b[0])
    .slice(0, SWATCHES)
    .map(([, bucket]) => ({
      hex: hex(bucket.r / bucket.n, bucket.g / bucket.n, bucket.b / bucket.n),
      share: Math.round((bucket.n / total) * 1000) / 1000,
    }));
}

function hex(r: number, g: number, b: number): string {
  const part = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${part(r)}${part(g)}${part(b)}`;
}

/* ══ 2 · THE STORED AND CARD COPIES ══════════════════════════════════ */

export type Rendered = {
  bytes: Buffer;
  thumb: Buffer;
  width: number;
  height: number;
};

/**
 * `.rotate()` before the resize, for db/056's reason: a phone photograph
 * carries its orientation in EXIF and a resize that ignores it produces a
 * sideways picture whose EXIF has been stripped. Unrecoverably sideways, in an
 * application nobody can re-import.
 */
export async function downscalePhoto(input: Buffer): Promise<Rendered> {
  const full = await sharp(input)
    .rotate()
    .resize({
      width: PHOTO_LONG_EDGE,
      height: PHOTO_LONG_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer({ resolveWithObject: true });

  const thumb = await sharp(input)
    .rotate()
    .resize({
      width: PHOTO_THUMB_EDGE,
      height: PHOTO_THUMB_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: 72, mozjpeg: true })
    .toBuffer();

  return {
    bytes: full.data,
    thumb,
    width: full.info.width,
    height: full.info.height,
  };
}

/* ══ 3 · ONE FILE → AT MOST ONE ROW ══════════════════════════════════ */

export type KeepPhotoOutcome =
  | { state: "stored"; id: string; ordinal: number }
  /** The same bytes are already on this application. Not an error. */
  | { state: "duplicate"; id: string; filename: string }
  | { state: "refused"; refusal: string }
  /** She is at seven. Said in words rather than as a failed insert. */
  | { state: "full"; refusal: string };

/**
 * Keep one photograph against one application.
 *
 * The order of the checks is db/056's and the argument is unchanged: declared
 * type AND magic bytes first, then the digest, and only then does anything
 * hand bytes to an image library.
 *
 * ── THE SEVENTH IS A SENTENCE AND THE EIGHTH IS A CONSTRAINT ────────
 *
 * The count below tells her she is full, in words, before anything is decoded.
 * It is not the enforcement — two tabs uploading at once would both read six —
 * and it is not pretending to be: db/064's `check (ordinal between 1 and 7)`
 * is what actually cannot be beaten, and losing that race arrives here as a
 * refusal naming the cap rather than as a stack trace. Rule 16: what did not
 * happen is said where she is standing.
 *
 * The ordinal is `max + 1` and never reused. A photograph she removed does not
 * hand its slot to the next one — the slot is where it was, and a member who
 * uploads seven, deletes one and uploads another has attached eight pictures
 * to this application over its life, which is a true sentence the ordinals
 * should not contradict. Seven live at once is the cap; db/064's unique
 * (quiz_response_id, ordinal) keeps the history honest.
 */
export async function keepPhoto(input: {
  applicationId: string;
  filename: string;
  declared: string;
  bytes: Buffer;
  role: PhotoRole | null;
}): Promise<KeepPhotoOutcome> {
  const check = checkUpload({
    filename: input.filename,
    declared: input.declared,
    size: input.bytes.byteLength,
    head: input.bytes.subarray(0, SNIFF_BYTES),
  });
  if (!check.ok) return { state: "refused", refusal: check.refusal };

  const digest = sha256Hex(input.bytes);

  const already = await queryOne<{ id: string; filename: string }>(
    `select id::text as id, filename
       from application_photo
      where quiz_response_id = $1 and sha256 = $2`,
    [input.applicationId, digest]
  );
  if (already) {
    return { state: "duplicate", id: already.id, filename: already.filename };
  }

  const standing = await queryOne<{ live: string; next: string }>(
    `select count(*)::text as live,
            coalesce(max(ordinal), 0)::text as next
       from application_photo where quiz_response_id = $1`,
    [input.applicationId]
  );
  const live = Number(standing?.live ?? 0);
  const ordinal = Number(standing?.next ?? 0) + 1;
  if (live >= MAX_PHOTOS || ordinal > MAX_PHOTOS) {
    return {
      state: "full",
      refusal:
        `This application already carries ${MAX_PHOTOS} pictures, which is ` +
        `all it takes. Remove one and add this instead.`,
    };
  }

  let rendered: Rendered;
  try {
    rendered = await downscalePhoto(input.bytes);
  } catch (err) {
    return {
      state: "refused",
      refusal:
        `${input.filename || "That file"} has the header of a ${check.type} ` +
        `and will not open as one — it is truncated or damaged. ` +
        `(${err instanceof Error ? err.message : String(err)})`,
    };
  }

  const rows = await query<{ id: string; ordinal: number }>(
    `insert into application_photo
       (quiz_response_id, ordinal, sha256, filename, media_type, bytes,
        thumb, thumb_media_type, width, height, byte_size,
        original_byte_size, role, role_set_at)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,
             case when $13::photo_role is null then null else now() end)
     on conflict (quiz_response_id, sha256) do nothing
     returning id::text as id, ordinal`,
    [
      input.applicationId,
      ordinal,
      digest,
      input.filename.slice(0, 300),
      STORED_TYPE,
      rendered.bytes,
      rendered.thumb,
      STORED_TYPE,
      rendered.width,
      rendered.height,
      rendered.bytes.byteLength,
      input.bytes.byteLength,
      input.role,
    ]
  );

  if (rows.length === 0) {
    const theirs = await queryOne<{ id: string; filename: string }>(
      `select id::text as id, filename
         from application_photo
        where quiz_response_id = $1 and sha256 = $2`,
      [input.applicationId, digest]
    );
    return theirs
      ? { state: "duplicate", id: theirs.id, filename: theirs.filename }
      : {
          state: "refused",
          refusal:
            "The insert conflicted and the conflicting row cannot be found. " +
            "Nothing was stored; add it again.",
        };
  }

  return { state: "stored", id: rows[0].id, ordinal: rows[0].ordinal };
}

/* ══ 4 · READING THE PIXELS ══════════════════════════════════════════ */

/**
 * THE ONLY READER OF THE PIXELS IN THIS CODEBASE.
 *
 * Two callers, and both guard themselves because a route handler is its own
 * entry point: the desk's view route checks `requireStaff`, and the member's
 * checks that HER pass owns THIS photograph. The second check is the one worth
 * saying twice — an id in a URL is not an authorisation, and these are
 * pictures of somebody's house.
 *
 * If a third caller ever appears, the question to ask before writing it is
 * whether that caller can be reached without one of those two proofs. If it
 * can, the answer is no.
 */
export async function photoBytes(
  id: string,
  which: "full" | "thumb"
): Promise<{ bytes: Buffer; mediaType: string; applicationId: string } | null> {
  const column = which === "thumb" ? "thumb" : "bytes";
  const typeColumn = which === "thumb" ? "thumb_media_type" : "media_type";
  const row = await queryOne<{
    bytes: Buffer;
    media_type: string;
    quiz_response_id: string;
  }>(
    `select ${column} as bytes, ${typeColumn} as media_type,
            quiz_response_id::text as quiz_response_id
       from application_photo where id = $1`,
    [id]
  );
  return row
    ? {
        bytes: row.bytes,
        mediaType: row.media_type,
        applicationId: row.quiz_response_id,
      }
    : null;
}
