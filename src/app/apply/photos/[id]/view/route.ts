import { currentApplicant } from "@/lib/auth";
import { photoBytes } from "@/lib/photo-store";
import { myApplication } from "@/lib/photos-member";

/**
 * HER OWN PICTURE, BACK TO HER, AND TO NOBODY ELSE.
 *
 * ── THE ID IN THE URL IS NOT THE AUTHORISATION ──────────────────────
 *
 * The one thing worth saying about this route. It reads her pass, finds HER
 * application, and serves the bytes only when the photograph's application is
 * that one. A handler that served by id alone would hand anybody with a
 * uuid a stranger's living room — and these ids are in HTML, in logs, and in
 * the browser history of whatever device she used.
 *
 * 404 for a signed-out request and 404 for somebody else's id: an
 * unauthenticated or unauthorised caller learns nothing about which ids exist.
 *
 * The desk's door onto the same rows is
 * src/app/desk/(signed-in)/photos/[id]/view, which proves staff instead. Two
 * doors, two proofs, and no third.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: RouteContext<"/apply/photos/[id]/view">
): Promise<Response> {
  const applicant = await currentApplicant();
  if (!applicant || !applicant.confirmed) {
    return new Response("Not found", { status: 404 });
  }

  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return new Response("Not found", { status: 404 });
  }

  const mine = await myApplication(applicant.customerId);
  if (!mine) return new Response("Not found", { status: 404 });

  const found = await photoBytes(id, "thumb");
  if (!found || found.applicationId !== mine.id) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(new Uint8Array(found.bytes), {
    headers: {
      "content-type": found.mediaType,
      "content-length": String(found.bytes.byteLength),
      "cache-control": "private, max-age=3600",
      "x-content-type-options": "nosniff",
      "content-disposition": "inline",
      "x-robots-tag": "noindex, nofollow, noimageindex",
    },
  });
}
