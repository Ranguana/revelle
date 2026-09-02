import "server-only";

import sharp from "sharp";

import { query, queryOne } from "@/lib/db";
import {
  LONG_EDGE,
  STORED_TYPE,
  THUMB_EDGE,
  checkUpload,
  sha256Hex,
  SNIFF_BYTES,
} from "@/lib/desk/images";
import type { Staff } from "@/lib/staff";

/**
 * KEEPING A REFERENCE PHOTOGRAPH.
 *
 * The half of the image bank that cannot be pure: sharp, and the one insert.
 * Every decision it makes — is this a picture, is it too big, has it been
 * dropped before — is taken in src/lib/desk/images.ts, which is testable and
 * database-free. This file is the part that touches bytes and rows.
 *
 * ── THE IMAGES ARE OTHER PEOPLE'S PHOTOGRAPHS ───────────────────────
 *
 * The third of the three places this is written down, because it is the place
 * where the wrong code would be written. A `reference_image` row is PRIVATE
 * STAFF REFERENCE. `imageBytes` below is the only reader of the pixels in this
 * codebase and it is called from exactly one route, which is inside the
 * signed-in desk segment and calls `requireStaff` itself.
 *
 * NOTHING ELSE MAY READ THEM. Not the portal, not an occasion package, not an
 * email, not an export, not an artifact, not a member-facing route of any
 * kind. What the product may ship out of a picture is the house's own words
 * about the object in it — `reading.bank_clause` — and nothing else, ever.
 * src/lib/desk/images.test.ts fails if `src/app/portal`, `src/app/apply` or
 * `src/lib/portal` so much as names this table.
 *
 * ── WHY THE BYTES ARE IN POSTGRES ───────────────────────────────────
 *
 * db/056 argues it at length. In one line: there is no object store in this
 * service, adding one means a second set of credentials and a second thing
 * that can be reachable when the database is not, and two curators' scrapbook
 * is hundreds of files rather than millions.
 *
 * ── DOWNSCALING IS NOT AN OPTIMISATION HERE ─────────────────────────
 *
 * It is what makes the choice above sound. A dropped pin is a 4MB phone
 * photograph and what this bank needs is something a person can recognise and
 * a model can read; 1600px on the long edge is both, at roughly a tenth of the
 * weight. `original_byte_size` is kept beside `byte_size` precisely so that
 * "the resize silently stopped running" is a countable fact rather than a
 * slow surprise (CLAUDE.md rule 24).
 */

/** What a stored row weighs and measures. Written by `downscale` alone. */
export type Rendered = {
  bytes: Buffer;
  thumb: Buffer;
  width: number;
  height: number;
};

/**
 * The stored copy and the card copy, from the uploaded bytes.
 *
 * `.rotate()` before the resize, and it is not decoration: a phone photograph
 * carries its orientation in EXIF, and a resize that ignores it produces a
 * sideways picture whose EXIF has been stripped — unrecoverably sideways, in
 * a bank nobody can re-import.
 *
 * JPEG out, whatever came in. db/056's CHECK is wider than this so that
 * keeping PNG for line art later is a code change rather than a migration,
 * but a photograph of an object is a photograph and one encoder is one thing
 * to reason about.
 *
 * An animated GIF yields its first frame, because `animated` is not passed.
 * That is the right reading of a mood board: the object is in the frame.
 */
export async function downscale(input: Buffer): Promise<Rendered> {
  const full = await sharp(input)
    .rotate()
    .resize({
      width: LONG_EDGE,
      height: LONG_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer({ resolveWithObject: true });

  const thumb = await sharp(input)
    .rotate()
    .resize({
      width: THUMB_EDGE,
      height: THUMB_EDGE,
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

export type KeepOutcome =
  | { state: "stored"; id: string; width: number; height: number }
  /** The same bytes are already here. Not an error — it is the same pin. */
  | { state: "duplicate"; id: string; filename: string }
  | { state: "refused"; refusal: string };

/**
 * One dropped file → at most one row.
 *
 * ── THE ORDER OF THE CHECKS IS THE DESIGN ───────────────────────────
 *
 *   1. Is it a picture, by its declared type AND its first bytes? A content
 *      type is a label the browser guessed at; the header is evidence. Both,
 *      and a disagreement between them is refused rather than resolved.
 *   2. Has it been seen before? The digest is over the ORIGINAL bytes, so the
 *      answer does not move when a sharp version does.
 *   3. Only then is anything decoded. Nothing hands unvalidated bytes to an
 *      image library, which is the actual reason step 1 comes first.
 *
 * ── AND WHY THE INSERT STILL CARRIES `on conflict` ──────────────────
 *
 * Two curators dropping the same picture at the same second is a race the
 * pre-check cannot win, and the unique index is the only thing that can. The
 * conflict path returns the EXISTING row rather than raising, because from the
 * founder's side "Tara already added this" is not an error, it is the answer.
 */
export async function keepImage(input: {
  filename: string;
  declared: string;
  bytes: Buffer;
  staff: Staff;
}): Promise<KeepOutcome> {
  const check = checkUpload({
    filename: input.filename,
    declared: input.declared,
    size: input.bytes.byteLength,
    head: input.bytes.subarray(0, SNIFF_BYTES),
  });
  if (!check.ok) return { state: "refused", refusal: check.refusal };

  const digest = sha256Hex(input.bytes);

  const already = await queryOne<{ id: string; filename: string }>(
    `select id::text as id, filename from reference_image where sha256 = $1`,
    [digest]
  );
  if (already) {
    return { state: "duplicate", id: already.id, filename: already.filename };
  }

  let rendered: Rendered;
  try {
    rendered = await downscale(input.bytes);
  } catch (err) {
    // A file that passed the header check and will not decode is corrupt or
    // truncated. Say which, rather than "upload failed".
    return {
      state: "refused",
      refusal:
        `${input.filename || "That file"} has the header of a ` +
        `${check.type} and will not open as one — it is truncated or ` +
        `damaged. (${err instanceof Error ? err.message : String(err)})`,
    };
  }

  const rows = await query<{ id: string }>(
    `insert into reference_image
       (sha256, filename, media_type, bytes, thumb, thumb_media_type,
        width, height, byte_size, original_byte_size, dropped_by)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     on conflict (sha256) do nothing
     returning id::text as id`,
    [
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
      input.staff.id,
    ]
  );

  if (rows.length === 0) {
    // Lost the race. The other writer's row is the row.
    const theirs = await queryOne<{ id: string; filename: string }>(
      `select id::text as id, filename from reference_image where sha256 = $1`,
      [digest]
    );
    return theirs
      ? { state: "duplicate", id: theirs.id, filename: theirs.filename }
      : {
          state: "refused",
          refusal:
            "The insert conflicted and the conflicting row cannot be found. " +
            "Nothing was stored; drop it again.",
        };
  }

  return {
    state: "stored",
    id: rows[0].id,
    width: rendered.width,
    height: rendered.height,
  };
}

/**
 * THE ONLY READER OF THE PIXELS IN THIS CODEBASE.
 *
 * Called by src/app/desk/(signed-in)/images/[id]/view/route.ts, which is
 * inside the signed-in segment and checks `requireStaff` itself — a route
 * handler is its own entry point and the layout's guard does not run for it.
 *
 * If a second caller for this function ever appears, the question to ask
 * before writing it is whether that caller can be reached without a staff
 * session. If it can, the answer is no.
 */
export async function imageBytes(
  id: string,
  which: "full" | "thumb"
): Promise<{ bytes: Buffer; mediaType: string } | null> {
  const column = which === "thumb" ? "thumb" : "bytes";
  const typeColumn = which === "thumb" ? "thumb_media_type" : "media_type";
  const row = await queryOne<{ bytes: Buffer; media_type: string }>(
    `select ${column} as bytes, ${typeColumn} as media_type
       from reference_image where id = $1`,
    [id]
  );
  return row ? { bytes: row.bytes, mediaType: row.media_type } : null;
}
