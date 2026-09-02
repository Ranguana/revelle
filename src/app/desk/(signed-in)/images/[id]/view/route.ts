import { imageBytes } from "@/lib/desk/image-store";
import { currentStaff } from "@/lib/staff";

/**
 * THE ONLY DOOR THE PIXELS COME OUT OF, AND IT IS LOCKED.
 *
 * ── WHAT IS BEHIND IT ───────────────────────────────────────────────
 *
 * Other people's photographs, held as private reference so that two curators
 * can point at an object and say what it is. They are readable by a signed-in
 * member of STAFF_EMAILS and by nobody else. They never reach a member
 * surface, an artifact, the portal, an email or an export, and no route other
 * than this one serves them. The thing this product may ship out of a picture
 * is the house's own words about the object in it, which lives in
 * `reference_image_reading.bank_clause` and travels as text.
 *
 * ── THE GUARD IS HERE BECAUSE THE LAYOUT'S DOES NOT RUN ─────────────
 *
 * `(signed-in)/layout.tsx` calls `requireStaff` for every PAGE beneath it. A
 * route handler is not a page: it renders no layout, so it inherits no check.
 * A `/desk/...` path that serves bytes without asking who is asking is exactly
 * the shape of hole this codebase's one auth system exists to avoid, and the
 * fact that the URL starts with /desk is not a check.
 *
 * 404 and not 403 for a signed-out request: an unauthenticated caller learns
 * nothing about which ids exist.
 *
 * ── AND WHY THE CACHE HEADER SAYS `private` ─────────────────────────
 *
 * `no-store` would make the list re-fetch every thumbnail on every render,
 * which is the one genuinely expensive thing this screen does. `private`
 * keeps it in HER browser and out of every shared cache between here and it —
 * the correct reading for a staff-only image, and the header a proxy must not
 * be allowed to misread as "cacheable, it's just a picture".
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: RouteContext<"/desk/images/[id]/view">
): Promise<Response> {
  const staff = await currentStaff();
  if (!staff) return new Response("Not found", { status: 404 });

  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return new Response("Not found", { status: 404 });
  }

  const wantsThumb =
    new URL(request.url).searchParams.get("size") !== "full";

  const found = await imageBytes(id, wantsThumb ? "thumb" : "full");
  if (!found) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(found.bytes), {
    headers: {
      "content-type": found.mediaType,
      "content-length": String(found.bytes.byteLength),
      "cache-control": "private, max-age=3600",
      // Belt and braces on the one thing that must never happen: a stored file
      // is served as itself and is never sniffed into something executable.
      "x-content-type-options": "nosniff",
      "content-disposition": "inline",
      // Said in a header as well as in prose, so a crawler that reaches a
      // leaked URL does not index a photograph the house does not own.
      "x-robots-tag": "noindex, nofollow, noimageindex",
    },
  });
}
