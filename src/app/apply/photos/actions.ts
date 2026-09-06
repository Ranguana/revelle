"use server";

import { revalidatePath } from "next/cache";

import { currentApplicant } from "@/lib/auth";
import { isPhotoRole } from "@/lib/photo-extract";
import {
  myApplication,
  removePicture,
  setRoleAsMember,
  strikeAsMember,
} from "@/lib/photos-member";

/**
 * WHAT SHE MAY DO WITH HER OWN PICTURES.
 *
 * Three gestures: say what one is for, take one back, and say "not that" to a
 * line. Founder: "Strike is enough."
 *
 * ── SHE CANNOT KEEP ANYTHING ────────────────────────────────────────
 *
 * There is no accept here and there must not be one. A line she leaves alone
 * is not a line she agreed with — it is a line she did not remove, and those
 * are different facts. Turning silence into consent is the exact move this
 * whole feature is built to refuse (CLAUDE.md rule 3), and it would be
 * cheapest to make right here.
 *
 * ── AND SHE IS NOT SHOWN A COLUMN NAME ──────────────────────────────
 *
 * Every action takes an opaque claim id. Nothing on her screen and nothing in
 * this file names a facet, a level, a model, a confidence or a destination.
 */

const UUID = /^[0-9a-f-]{36}$/i;

async function mine(): Promise<{ customerId: string; applicationId: string } | null> {
  const applicant = await currentApplicant();
  if (!applicant || !applicant.confirmed) return null;
  const application = await myApplication(applicant.customerId);
  if (!application) return null;
  return { customerId: applicant.customerId, applicationId: application.id };
}

function idOf(form: FormData, field: string): string | null {
  const raw = form.get(field);
  return typeof raw === "string" && UUID.test(raw) ? raw : null;
}

/** Not that. Permanent, on this picture, and the desk cannot undo it. */
export async function strikeLineAction(form: FormData): Promise<void> {
  const who = await mine();
  const claimId = idOf(form, "claim");
  if (!who || !claimId) return;
  await strikeAsMember(who.customerId, claimId);
  revalidatePath("/apply/photos");
}

/** Say what a picture is for. */
export async function setPictureRoleAction(form: FormData): Promise<void> {
  const who = await mine();
  const photoId = idOf(form, "photo");
  if (!who || !photoId) return;
  const raw = form.get("role");
  await setRoleAsMember(
    who.customerId,
    photoId,
    typeof raw === "string" && isPhotoRole(raw) ? raw : null
  );
  revalidatePath("/apply/photos");
}

/** Take one back. Its readings go with it; they were never about anything else. */
export async function removePictureAction(form: FormData): Promise<void> {
  const who = await mine();
  const photoId = idOf(form, "photo");
  if (!who || !photoId) return;
  await removePicture(who.customerId, photoId);
  revalidatePath("/apply/photos");
}
