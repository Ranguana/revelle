import { timingSafeEqual } from "node:crypto";

import { messages, openTodos } from "@/lib/desk/room";

/**
 * What the curators have left for whoever is helping them build this.
 *
 * ── WHY THIS ENDPOINT EXISTS ─────────────────────────────────────────
 *
 * The desk's to-do list and thread are where Jessica and Tara say what needs
 * doing — including the gaps the selection engine finds, which reach a human
 * nowhere else. But the database has an EMPTY ipAllowList by design (see
 * render.yaml): it is reachable only from inside Render. So there is no way to
 * read any of it from outside except through this service, and no way for an
 * assistant checking in twice a day to know what was asked for.
 *
 * This is that way in, and it is deliberately the smallest one: read-only, no
 * mutations, no member data, and nothing an application contains.
 *
 * ── WHY A SHARED SECRET AND NOT A SESSION ────────────────────────────
 *
 * Sign-in is passwordless and by design requires a mailbox — correct for two
 * people at a screen, useless for something scheduled. A bearer token is the
 * honest mechanism for a machine, and keeping it OFF the session path means
 * this can never become a second way to be a curator: it grants exactly this
 * one read and nothing else. Compromising it leaks the work list, which is
 * unpleasant; it does not leak a customer, a session, or a way in.
 *
 * ── FAILS CLOSED ─────────────────────────────────────────────────────
 *
 * DESK_DIGEST_TOKEN unset or empty means this route is off, not open. Same
 * rule as STAFF_EMAILS, and for the same reason: the failure mode of a missing
 * environment variable must never be "everyone".
 */

export const dynamic = "force-dynamic";

/**
 * Constant-time, and length-safe.
 *
 * `timingSafeEqual` THROWS on a length mismatch, which would both leak the
 * length through the error path and turn a wrong guess into a 500. Comparing
 * lengths first and returning the same false is what the desk's own token
 * check does.
 */
function sameSecret(given: string, expected: string): boolean {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function GET(request: Request): Promise<Response> {
  const expected = (process.env.DESK_DIGEST_TOKEN ?? "").trim();
  if (!expected) {
    // Not "unauthorized" — off. Said plainly so nobody spends an afternoon
    // debugging a token that was never going to be checked.
    console.warn("[digest] DESK_DIGEST_TOKEN is not set; the route is closed.");
    return new Response("Not found", { status: 404 });
  }

  const header = request.headers.get("authorization") ?? "";
  const given = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!given || !sameSecret(given, expected)) {
    // Never log the value, never say which part was wrong.
    return new Response("Not found", { status: 404 });
  }

  const [todos, thread] = await Promise.all([openTodos(), messages(null)]);

  // Newest last in the thread, so reading it top to bottom is reading the
  // conversation in the order it happened.
  const recent = thread.slice(-30);

  return Response.json(
    {
      todos: todos.map((t) => ({
        id: t.id,
        body: t.body,
        // "gap" means the engine wrote it; anything else means a person did.
        source: t.source,
        assignee: t.assignee,
        subject: t.subject_table
          ? { table: t.subject_table, id: t.subject_id }
          : null,
        created_at: t.created_at,
      })),
      thread: recent.map((m) => ({
        author: m.author,
        body: m.body,
        at: m.created_at,
        edited: Boolean(m.edited_at),
      })),
      counts: { open: todos.length, messages: thread.length },
    },
    // A work list is not a thing to cache, and an intermediary holding a copy
    // of it is the small privacy cost this endpoint is not worth paying.
    { headers: { "cache-control": "no-store" } }
  );
}
