import { NextResponse, type NextRequest } from "next/server";

/**
 * The cheap half of the guard, for both signed-in areas.
 *
 * Next 16 renamed Middleware to Proxy; the file lives beside `app` and there is
 * one per project. See node_modules/next/dist/docs/01-app/01-getting-started/
 * 16-proxy.md.
 *
 * ── WHAT THIS DOES AND EMPHATICALLY DOES NOT DO ──────────────────────
 *
 * It checks that a session cookie EXISTS and sends anyone without one to the
 * way in. That is all. It does not read the database, does not validate the
 * session, does not look at what KIND of session it is, and is not the thing
 * that keeps anyone out — Next's own documentation is explicit that Proxy is
 * for optimistic checks and not for authorisation.
 *
 * THE REAL GUARDS are `requireStaff()` in src/app/desk/(signed-in)/layout.tsx
 * and `requireMember()` in src/app/portal/layout.tsx, each wrapping its whole
 * segment, plus the same call inside every Server Action. Both re-read the
 * allowlist and the membership on every request.
 *
 * A forged cookie gets past this file and dies at the layout. So does a
 * MEMBER's real cookie at /desk: there is one session table (db/015), so the
 * proxy cannot tell them apart and deliberately does not try — the layout
 * asks the only question that matters. That is the intended division of
 * labour, not a gap.
 */

const COOKIE = "revelle_session";

/** The way in, and the only path under a guarded segment that is not guarded. */
const OPEN = "/desk/sign-in";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // The desk's old door. It still exists so that a link already sitting in an
  // inbox works; both routes under it hand over to /login.
  if (pathname.startsWith(OPEN)) return NextResponse.next();

  if (!request.cookies.has(COOKIE)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Both segments, in one place. Adding a page under either cannot forget to
  // be covered, which is the entire reason this is a matcher and not a check
  // written into each page.
  matcher: ["/desk/:path*", "/portal/:path*"],
};
