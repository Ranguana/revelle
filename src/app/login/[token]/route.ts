import { redirect } from "next/navigation";

import { spendLink } from "@/lib/auth";

/**
 * Spending a link.
 *
 * A Route Handler rather than a page because it has to SET a cookie, and Next
 * only allows that in a Server Function or a Route Handler — a Server
 * Component cannot, because HTTP does not allow a Set-Cookie after streaming
 * has begun.
 *
 * ── ONE FAILURE, WHATEVER WENT WRONG ─────────────────────────────────
 *
 * Expired, already spent, never existed, or belonging to somebody whose access
 * has since gone away: all of them land on /login?error=link and read the same
 * sentence. There is nothing else she could usefully do in any of those cases
 * — ask for another — and a handler that distinguished them would be telling a
 * script which of its guesses was closest.
 *
 * ── THE KNOWN WEAKNESS, STATED ───────────────────────────────────────
 *
 * A GET that consumes a token can be burned by a mail client or a security
 * scanner that pre-fetches links. The failure is recoverable and visible — she
 * is bounced to the sign-in page with a message telling her to ask for another
 * — and the alternative, a landing page with a button that POSTs, costs a
 * click on every single sign-in forever. That is the trade, made deliberately.
 * It is now a customer-facing trade rather than an internal one, so it is
 * worth restating: if scanners ever start eating links in practice, the fix is
 * the interstitial and it is half an hour of work.
 *
 * The redemption path is rate limited by address (src/lib/rate-limit.ts), so a
 * pre-fetcher hammering this route cannot also become a way to load the
 * database.
 */
export async function GET(
  _request: Request,
  context: RouteContext<"/login/[token]">
) {
  const { token } = await context.params;

  const outcome = await spendLink(token);
  if (!outcome.ok) redirect("/login?error=link");

  redirect(outcome.destination);
}
