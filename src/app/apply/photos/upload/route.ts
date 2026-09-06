import { revalidatePath } from "next/cache";

import { currentApplicant } from "@/lib/auth";
import { isPhotoRole } from "@/lib/photo-extract";
import { keepPhoto } from "@/lib/photo-store";
import { MEMBER_ACTOR, myApplication } from "@/lib/photos-member";
import { recordSystemAction } from "@/lib/staff";

/**
 * WHERE HER PICTURES LAND.
 *
 * A route handler and not a Server Action, for /desk/images' reason: a drop is
 * usually more than one file, and an action posts the whole form, blocks the
 * page, and takes the good files down with the bad one. This takes the files
 * one at a time inside one request and redirects back with what happened.
 *
 * ── NO JAVASCRIPT ───────────────────────────────────────────────────
 *
 * A plain multipart form with `multiple`, posted and redirected. The desk's
 * drop zone is a client component because two curators are working a hundred
 * references at a time; a member attaching four pictures from a phone is
 * better served by something that cannot half-work. The refusals come back in
 * the query string and are printed on the page.
 *
 * ── IT GUARDS ITSELF ────────────────────────────────────────────────
 *
 * A route handler is its own entry point. Nothing above it checks anything,
 * and the application id is never taken from the form — it is looked up from
 * HER pass. An id in a POST body is not an authorisation.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const back = new URL("/apply/photos", request.url);

  const applicant = await currentApplicant();
  if (!applicant || !applicant.confirmed) {
    return Response.redirect(new URL("/apply", request.url), 303);
  }

  const application = await myApplication(applicant.customerId);
  if (!application) {
    back.searchParams.set(
      "said",
      "There is nothing to attach these to yet. Answer the questions first."
    );
    return Response.redirect(back, 303);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    back.searchParams.set(
      "said",
      "That did not arrive as a file. Nothing was kept."
    );
    return Response.redirect(back, 303);
  }

  const raw = form.get("role");
  const role = typeof raw === "string" && isPhotoRole(raw) ? raw : null;

  const files = form
    .getAll("file")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
  if (files.length === 0) {
    back.searchParams.set("said", "No picture was chosen.");
    return Response.redirect(back, 303);
  }

  const refusals: string[] = [];
  let kept = 0;

  for (const file of files) {
    const bytes = Buffer.from(await file.arrayBuffer());
    const outcome = await keepPhoto({
      applicationId: application.id,
      filename: file.name,
      declared: file.type,
      bytes,
      role,
    });

    if (outcome.state === "stored") {
      kept += 1;
      await recordSystemAction(MEMBER_ACTOR, {
        action: "photo.uploaded",
        entityTable: "application_photo",
        entityId: outcome.id,
        summary: file.name || "a picture",
        detail: {
          application: application.id,
          ordinal: outcome.ordinal,
          role,
          original_bytes: bytes.byteLength,
          by: "member",
        },
      });
    } else if (outcome.state === "duplicate") {
      refusals.push(`${file.name || "That one"} is already here.`);
    } else {
      refusals.push(outcome.refusal);
    }
  }

  if (kept > 0) revalidatePath("/apply/photos");
  if (refusals.length > 0) back.searchParams.set("said", refusals.join(" "));

  return Response.redirect(back, 303);
}
