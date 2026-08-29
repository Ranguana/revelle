import { timingSafeEqual } from "node:crypto";

import { query } from "@/lib/db";
import { DESTINATIONS } from "@/lib/destinations";
import { staffAllowlist } from "@/lib/staff-allowlist";
import { isServable } from "@/lib/voice-check";

/**
 * Is the new build live, and did its content land?
 *
 * ── WHY THIS ENDPOINT EXISTS ─────────────────────────────────────────
 *
 * Before this route, "is the deploy live?" was answerable only by forensics.
 * On 2026-08-29 a commit had to be confirmed by pulling the ten JS chunks
 * behind /apply and grepping them for SVG path strings that one commit had
 * rewritten — four pre-change strings absent, four post-change strings
 * present, in both directions. That is legitimate evidence and it worked, but
 * nobody should derive it twice.
 *
 * ── WHY IT REPORTS TWO NUMBERS AND NOT ONE ───────────────────────────
 *
 * "How many destinations exist" has TWO authorities that can disagree:
 *
 *   THE REGISTRY — `DESTINATIONS` in src/lib/destinations.ts. Compile-time,
 *   shipped with the build, changes when code deploys.
 *
 *   THE DATABASE — `world` rows. Changes when the SEEDER runs, which is a
 *   separate step that can fail, be skipped, or never have been wired into
 *   the deploy chain at all. It has been all three.
 *
 * Wiring a room in the registry does not create its row. That gap is the
 * whole history of "why do I still see 12 destinations" — asked repeatedly,
 * investigated from scratch every time, because the dashboard counts `world`
 * rows and the work had happened in the code.
 *
 * So this route refuses to pick a side. Rule 21 says every fact two surfaces
 * must agree on has exactly one owner and the guard must go through the
 * consumers — and a health check that reported only one of these numbers
 * would become the next surface claiming a certainty it does not have. It
 * reports both AND whether they agree, which is the only honest shape.
 *
 * `missing` and `extra` are here because "they disagree" starts an
 * investigation and "these five rooms have no row" ends one. Naming the drift
 * costs one array and saves the afternoon.
 *
 * ── WHAT `seeded` MEANS, EXACTLY ─────────────────────────────────────
 *
 * Every servable room in the registry has a non-retired `world` row. Not
 * "the counts match" — counts can coincide while the wrong rooms are present,
 * and a tripwire that can be fooled by arithmetic is not a tripwire.
 *
 * ── SAME TOKEN, SAME FAILURE MODE AS THE DIGEST ──────────────────────
 *
 * DESK_DIGEST_TOKEN, reused deliberately rather than minted fresh: this grants
 * a strictly smaller read than the digest already does — counts and slugs,
 * no member data, nothing an application contains — so a second secret would
 * add key management without adding safety. Unset means OFF, not open, which
 * is the same rule STAFF_EMAILS follows: the failure mode of a missing
 * environment variable must never be "everyone".
 */

export const dynamic = "force-dynamic";

/** Constant-time and length-safe. `timingSafeEqual` throws on a length mismatch. */
function sameSecret(given: string, expected: string): boolean {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function GET(request: Request): Promise<Response> {
  const expected = (process.env.DESK_DIGEST_TOKEN ?? "").trim();
  if (!expected) {
    console.warn("[health] DESK_DIGEST_TOKEN is not set; the route is closed.");
    return new Response("Not found", { status: 404 });
  }

  const header = request.headers.get("authorization") ?? "";
  const given = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!given || !sameSecret(given, expected)) {
    return new Response("Not found", { status: 404 });
  }

  // The registry, read through isServable rather than re-derived. Rule 19:
  // "which rooms are servable" is a fact with one owner.
  const servable = Object.entries(DESTINATIONS)
    .filter(([, room]) => isServable(room))
    .map(([slug]) => slug)
    .sort();

  // Retired rows are excluded on both sides: a retired room is deliberately
  // absent from the dashboard, so counting it here would report agreement
  // where the screen shows none.
  // Voices are joined in because "a destination is published only if it has a
  // published voice" (src/lib/desk/coverage.ts). A report counting world rows
  // alone said `agree: true` about a catalogue that could not issue a single
  // Revelle — the defect this route exists to end, one level down.
  const rows = await query<{
    slug: string;
    status: string;
    voice: string | null;
    drafts: string;
  }>(
    `select w.slug::text as slug,
            w.status::text as status,
            (select 'v' || v.version from world_voice v
              where v.world_id = w.id and v.status = 'published'
              limit 1) as voice,
            (select count(*)::text from world_voice v
              where v.world_id = w.id and v.status = 'draft') as drafts
       from world w
      order by w.slug`
  );
  const live = rows.filter((r) => r.status !== "retired").map((r) => r.slug);
  const liveSet = new Set(live);
  const servableSet = new Set(servable);

  // A look and no voice: it cannot hold an invitation, a menu card or a prep
  // list, because everything in a Revelle is written in the room's voice and
  // there is no fallback voice by design.
  const voiceless = rows
    .filter((r) => r.status !== "retired" && !r.voice)
    .map((r) => `${r.slug} (${r.drafts} draft${r.drafts === "1" ? "" : "s"} waiting)`);

  const missing = servable.filter((s) => !liveSet.has(s));
  const extra = live.filter((s) => !servableSet.has(s));

  const byStatus = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  return Response.json(
    {
      // Render sets this on every build. Null locally, which is honest —
      // better than a placeholder that reads like a commit.
      sha: process.env.RENDER_GIT_COMMIT ?? null,
      registry: servable.length,
      worlds: live.length,
      seeded: missing.length === 0,
      // Rows landing is not a usable catalogue. A voiceless room is not
      // servable, so it cannot count toward agreement.
      agree:
        missing.length === 0 && extra.length === 0 && voiceless.length === 0,
      voices: live.length - voiceless.length,
      voiceless,
      // ── WHY THE DOOR IS DESCRIBED HERE ──────────────────────────────
      //
      // The sign-in form returns the SAME response whether the address is
      // staff, a member, an applicant or unknown, and it returns ok even when
      // the mail fails — deliberate anti-enumeration (src/lib/login.ts). The
      // real reason goes to a log. When the only person who can read that log
      // is locked out by the thing she is trying to diagnose, the design is
      // airtight and useless at once.
      //
      // So: COUNTS AND BOOLEANS, never an address and never a key. This says
      // whether the door is configured, not who may walk through it, and it
      // grants nothing — it is strictly a smaller read than the digest.
      door: {
        staffCount: staffAllowlist().length,
        mailKeySet: Boolean((process.env.RESEND_API_KEY ?? "").trim()),
        mailFromSet: Boolean((process.env.MAIL_FROM ?? "").trim()),
        // Not a secret; it is the host the magic link points AT, and a wrong
        // value here sends a working link to a dead address.
        appUrl: process.env.APP_URL ?? null,
      },
      // In the registry, no row yet. The seeder has not run, or not fully.
      missing,
      // A row with no authored room behind it. Usually a stub or a rename.
      extra,
      worldsByStatus: byStatus,
    },
    { headers: { "cache-control": "no-store" } }
  );
}
