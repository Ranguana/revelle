import { photoBytes } from "@/lib/photo-store";
import { currentStaff } from "@/lib/staff";

/**
 * THE DESK'S DOOR ONTO A MEMBER'S PHOTOGRAPH, AND IT IS LOCKED.
 *
 * ── WHAT IS BEHIND IT ───────────────────────────────────────────────
 *
 * Pictures a woman attached to her application: her own house, sometimes her
 * own family in it. They are readable by a signed-in member of STAFF_EMAILS
 * through this route, and by HER through the member route
 * (src/app/apply/photos/[id]/view), which proves her pass owns the row rather
 * than trusting the id in the URL. Nothing else may serve them — not the
 * portal, not an occasion package, not an email, not an export, not an
 * artifact. What this product may ever ship out of one is the house's own
 * words about it.
 *
 * ── THE GUARD IS HERE BECAUSE THE LAYOUT'S DOES NOT RUN ─────────────
 *
 * `(signed-in)/layout.tsx` calls `requireStaff` for every PAGE beneath it. A
 * route handler is not a page: it renders no layout and inherits no check. The
 * path starting with /desk is not a check. Same argument, word for word, as
 * /desk/images/[id]/view — said again here rather than referred to, because
 * the next person writing a bytes route will read whichever one they land on.
 *
 * 404 rather than 403 for a signed-out request: an unauthenticated caller
 * learns nothing about which ids exist.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: RouteContext<"/desk/photos/[id]/view">
): Promise<Response> {
  const staff = await currentStaff();
  if (!staff) return new Response("Not found", { status: 404 });

  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return new Response("Not found", { status: 404 });
  }

  const wantsThumb = new URL(request.url).searchParams.get("size") !== "full";
  const found = await photoBytes(id, wantsThumb ? "thumb" : "full");
  if (!found) return new Response("Not found", { status: 404 });

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
