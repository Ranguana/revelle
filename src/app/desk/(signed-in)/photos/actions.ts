"use server";

import { revalidatePath } from "next/cache";

import {
  keepClaim,
  photoQueue,
  setPhotoRole,
  strikeClaim,
} from "@/lib/desk/photos";
import { canRead, readPhoto } from "@/lib/photo-read";
import { isPhotoRole } from "@/lib/photo-extract";
import { requireStaff } from "@/lib/staff";

/**
 * WHAT A CURATOR MAY PRESS ON /desk/photos.
 *
 * Four actions, and the list of what is deliberately absent is longer than the
 * list of what is here:
 *
 *   · THERE IS NO "APPROVE ALL". Founder: "A bulk keep on seven pictures is
 *     how `arrival: assigned` sneaks in." There is no per-application keep
 *     either. Every keep and every strike names one claim by id.
 *
 *   · THERE IS NO ACTION THAT TAKES A DESTINATION. No slug, no world id, no
 *     room name. src/lib/photo-extract.test.ts fails if this file names one.
 *
 *   · THERE IS NO ACTION THAT LIFTS A MEMBER'S STRIKE. db/064's trigger
 *     refuses it and src/lib/desk/photos.ts refuses it earlier, in words.
 *
 * ── AND READING IS A PRESS, NOT A CONSEQUENCE ────────────────────────
 *
 * Nothing reads a photograph automatically. A member uploading seven pictures
 * does not spend seven model calls; a curator decides that this application is
 * worth reading and presses the button. CLAUDE.md rule 8: agents produce
 * drafts, and starting the draft is a human gesture.
 */

const UUID = /^[0-9a-f-]{36}$/i;

/**
 * How many unread photographs one press reads.
 *
 * A ceiling and not a page size, for /desk/images' reason: a hundred model
 * calls in one request dies at a gateway timeout with an unknowable number of
 * them already written. This does a knowable amount of work and the screen
 * says how many are left (rule 16).
 */
const BATCH = 7;

function idOf(form: FormData, field: string): string | null {
  const raw = form.get(field);
  return typeof raw === "string" && UUID.test(raw) ? raw : null;
}

/** Keep one claim. One. */
export async function keepClaimAction(form: FormData): Promise<void> {
  const staff = await requireStaff();
  const claimId = idOf(form, "claim");
  if (!claimId) return;
  await keepClaim(staff, claimId);
  revalidatePath("/desk/photos");
}

/** Strike one claim, as the desk. Reversible by the desk; hers is not. */
export async function strikeClaimAction(form: FormData): Promise<void> {
  const staff = await requireStaff();
  const claimId = idOf(form, "claim");
  if (!claimId) return;
  await strikeClaim(staff, claimId);
  revalidatePath("/desk/photos");
}

/**
 * Say what a photograph is for.
 *
 * `place_she_has` arrives from its own form, with its own paragraph and its own
 * button — the founder: "the dangerous one — confirm with the same gravity as
 * acceptance: a sentence, not a checkbox hidden under the thumbnails." That
 * gravity is on the screen; this function only checks that the value is one of
 * the three and records who set it.
 */
export async function setRoleAction(form: FormData): Promise<void> {
  const staff = await requireStaff();
  const photoId = idOf(form, "photo");
  if (!photoId) return;
  const raw = form.get("role");
  const role = typeof raw === "string" && isPhotoRole(raw) ? raw : null;
  await setPhotoRole(staff, photoId, role);
  revalidatePath("/desk/photos");
}

/** Read one photograph. One model call, no retry. */
export async function readPhotoAction(form: FormData): Promise<void> {
  await requireStaff();
  const photoId = idOf(form, "photo");
  if (!photoId) return;
  await readPhoto(photoId);
  revalidatePath("/desk/photos");
}

/**
 * Read the unread photographs of ONE application, up to the batch ceiling.
 *
 * Scoped to one application rather than to the whole queue, and that is not
 * only about cost. A reading is evidence about a member's evening; a button
 * that reads everything anybody has ever uploaded is the shape of gesture that
 * gets pressed without looking, and this feature's whole argument is that
 * nothing about a photograph happens without somebody looking.
 */
export async function readApplicationAction(form: FormData): Promise<void> {
  await requireStaff();
  const applicationId = idOf(form, "application");
  if (!applicationId) return;
  if (!canRead()) return;

  const queue = await photoQueue(200);
  const row = queue.find((entry) => entry.application.id === applicationId);
  if (!row) return;

  const unread = row.application.photos
    .filter((photo) => photo.extract === null)
    .slice(0, BATCH);

  for (const photo of unread) {
    await readPhoto(photo.id);
  }
  revalidatePath("/desk/photos");
}
