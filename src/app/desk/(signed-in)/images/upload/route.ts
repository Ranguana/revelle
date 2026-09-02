import { revalidatePath } from "next/cache";

import { keepImage } from "@/lib/desk/image-store";
import { MAX_UPLOAD_BYTES } from "@/lib/desk/images";
import { currentStaff, recordAction } from "@/lib/staff";

/**
 * WHERE A DROPPED PICTURE LANDS.
 *
 * ── WHY A ROUTE HANDLER AND NOT A SERVER ACTION ─────────────────────
 *
 * The founder asked for a droppable area, and a drop is usually more than one
 * file. A Server Action posts the whole form, blocks the page while it goes,
 * and reports one outcome at the end — so twenty pictures are one long wait
 * with no sign of life, and one bad file among them takes the other nineteen
 * with it.
 *
 * This takes ONE FILE PER REQUEST. The client sends them a few at a time and
 * draws each result as it arrives, so the page never blocks, a refusal names
 * the file it is about, and the nineteen good ones are already in the bank
 * while the twentieth is being explained.
 *
 * ── IT GUARDS ITSELF ────────────────────────────────────────────────
 *
 * A route handler is its own entry point: the `(signed-in)` layout does not
 * run for it and neither does its `requireStaff`. So this calls the check
 * itself — and returns 401 as JSON rather than redirecting, because the caller
 * is a fetch and a redirect to /login would arrive as an opaque success.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const staff = await currentStaff();
  if (!staff) {
    return Response.json(
      { state: "refused", refusal: "Your session has ended. Sign in again." },
      { status: 401 }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json(
      {
        state: "refused",
        refusal:
          "That upload did not arrive as a file. Nothing was stored. If it " +
          `was very large, the bank takes ${Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))}MB at most.`,
      },
      { status: 400 }
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json(
      { state: "refused", refusal: "No file was posted." },
      { status: 400 }
    );
  }

  // Read once. `keepImage` sniffs the head, hashes the whole, and only then
  // decodes — see the order-of-checks note at its head.
  const bytes = Buffer.from(await file.arrayBuffer());

  const outcome = await keepImage({
    filename: file.name,
    declared: file.type,
    bytes,
    staff,
  });

  if (outcome.state === "stored") {
    await recordAction(staff, {
      action: "reference_image.dropped",
      entityTable: "reference_image",
      entityId: outcome.id,
      summary: file.name || "a reference image",
      detail: {
        filename: file.name,
        original_bytes: bytes.byteLength,
        width: outcome.width,
        height: outcome.height,
      },
    });
    // The list is a server component and has just gone stale.
    revalidatePath("/desk/images");
  }

  return Response.json(
    { ...outcome, filename: file.name },
    { status: outcome.state === "refused" ? 415 : 200 }
  );
}
