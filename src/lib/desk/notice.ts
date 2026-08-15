import "server-only";

import { cookies } from "next/headers";

/**
 * HOW A REFUSAL REACHES THE CURATOR.
 *
 * The five actions that decide what a member receives can all say no — the
 * destination has no published voice, the engine withheld this assemblage, the
 * Revelle has been delivered and db/003's ratchet is down. A refusal nobody
 * sees is worse than no check at all, because the button appears to have
 * worked.
 *
 * ── WHY A COOKIE, AND NOT EITHER OBVIOUS ANSWER ──────────────────────
 *
 * Next's documented answer is `useActionState`, which needs a Client
 * Component. Every screen in this tool is a server component on purpose, and
 * turning the application page into a client one to carry a sentence that
 * appears twice a week is a bad trade.
 *
 * The other obvious answer is `redirect()` with the message on the query
 * string. That works when the client router is driving — but a Server Action is
 * its own entry point, and a plain form POST with no JavaScript gets the
 * redirect target rendered INLINE, at the URL that was posted to, with the
 * query string gone. The refusal would disappear in exactly the case where
 * somebody is poking at the endpoint directly, which is the case the refusal
 * exists for.
 *
 * A cookie survives both. It is written during the action, and Next's cookie
 * store is request-scoped and reflects pending writes — so the page rendered
 * in the SAME request already sees it, and so does the page a browser
 * navigates to afterwards.
 *
 * ── THE TWO THINGS THAT KEEP IT HONEST ───────────────────────────────
 *
 *   · It carries the SUBJECT it belongs to, so a refusal about one application
 *     cannot appear on another's page.
 *   · It expires in seconds. A message that outlives the click that caused it
 *     is a message somebody will eventually act on twice.
 *
 * This is a place to say something once, not a state machine. Nothing here is
 * ever read for a decision.
 */

const COOKIE = "revelle_desk_notice";

/** Long enough for the render that follows; too short to still be there later. */
const SECONDS = 20;

export async function setNotice(subject: string, message: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, `${subject}\n${message.slice(0, 900)}`, {
    httpOnly: true,
    sameSite: "lax",
    // Scoped to the tool. Nothing outside the desk has any use for it, and a
    // cookie sent on every request to the landing page is a cookie on a page
    // that has no session at all.
    path: "/desk",
    maxAge: SECONDS,
  });
}

export async function clearNotice(): Promise<void> {
  // The path has to match the one it was set with, or the browser keeps the
  // original cookie and the deletion writes a second, different one.
  (await cookies()).delete({ name: COOKIE, path: "/desk" });
}

/** The message left for this subject, or "" — including when it names another. */
export async function readNotice(subject: string): Promise<string> {
  const raw = (await cookies()).get(COOKIE)?.value ?? "";
  const newline = raw.indexOf("\n");
  if (newline < 0) return "";
  return raw.slice(0, newline) === subject ? raw.slice(newline + 1) : "";
}
