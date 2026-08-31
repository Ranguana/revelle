import { timingSafeEqual } from "node:crypto";

import { query } from "@/lib/db";
import { copyDrift as copyFields, copyDriftReport } from "@/lib/desk/drift";
import {
  settlementOf,
  unsettled,
  type ReconciliationRecord,
} from "@/lib/desk/reconcile";
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
    name: string;
    tagline: string;
    description: string;
  }>(
    `select w.slug::text as slug,
            w.status::text as status,
            w.name, w.tagline, w.description,
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

  // ── COPY DRIFT ──────────────────────────────────────────────────────
  //
  // The seeder NEVER overwrites a curator: it writes name, tagline and
  // premise when it CREATES a room and leaves them alone forever after. That
  // rule is right — a script has no standing to reverse a judgement made in
  // the tool — but it means the registry and the database can say different
  // things indefinitely and nothing reconciles them.
  //
  // It happened, and it reached a member: WESTHAMPTON, 1976 read "Vintage
  // summer glamour. No cooking" on the portal while destinations.ts said
  // "Very questionable houseguests." Found by a person reading a screen,
  // which is the most expensive detector there is.
  //
  // So this reports DISAGREEMENT, and nothing more. It does not say which is
  // right — the database is authoritative for copy, and a curator's edit is
  // exactly the case that shows up here as drift. It is a prompt to look, not
  // a defect. Same shape as `missing` and `extra`: name the rows, so the
  // question is answerable instead of merely raised.
  //
  // ── AND IT IS NOT THIS ROUTE'S PREDICATE ANY MORE ───────────────────
  //
  // It used to be. Three lines of `row.tagline !== room.tagline` sat here
  // while src/lib/desk/drift.ts compared the same three fields through
  // `normalise` — a trim and a line-ending fold — so a premise differing only
  // by trailing whitespace was drift on this route and no drift on the desk.
  // Rule 21's exquisite failure: both surfaces looked right and meant
  // different things, and nothing could go red, because neither side is wrong
  // on its own.
  //
  // It stopped being survivable when the reconciliation desk landed. A verdict
  // is recorded against one (room, field) pair, and a field this route calls
  // drifted while the desk calls it clean cannot be reconciled at all: it
  // would sit on the detector forever with nothing on the screen to click.
  // `copyDriftReport` is the one owner and both surfaces call it — including
  // the sentence it renders, because two spellings of one report is how a
  // person concludes the two screens disagree.
  //
  // Retired rows are excluded HERE and not in the module: `world.status` is
  // not a fact src/lib/desk/drift.ts can see, and a module guessing at it
  // would be a second authority on which rooms count.
  const working = rows.filter((r) => r.status !== "retired");
  const copyDrift = copyDriftReport(working);

  // ── AND THE NUMBER THAT CAN ACTUALLY REACH ZERO ─────────────────────
  //
  // `copyDrift` cannot, and that is not a defect in it. A `database wins`
  // verdict leaves the file and the row disagreeing FOREVER, on purpose,
  // because the database is what a member reads and the file is 4,900 lines of
  // argument nobody is going to regenerate. A detector demanding that number
  // reach zero would be demanding the founder reverse a decision to make a
  // light go green — which is how a tripwire becomes furniture.
  //
  // So db/055 records the verdicts and this reports the difference between
  // them. `copyUnsettled` is drift NOBODY HAS RULED ON, plus drift that was
  // ruled on and has since moved — the two states a person still owes an
  // afternoon. That one is meant to hit zero and stay there, and when it does
  // not, the reason is in the string.
  const settlements = await query<
    ReconciliationRecord & { slug: string }
  >(
    `select w.slug::text as slug, c.id::text as id, c.field, c.verdict,
            c.registry_value, c.database_value, c.chosen_value,
            c.provenance, c.note, c.decided_at,
            -- Cast, not a bare null: an untyped null comes back as unknown.
            -- Null at all because this route has no use for the address --
            -- /api/health reports counts and slugs and never a person, which
            -- is the rule the door block below states at length.
            null::text as decided_by_email
       from copy_reconciliation_current c
       join world w on w.id = c.world_id`
  );
  const byField = new Map(
    settlements.map((row) => [`${row.slug}:${row.field}`, row])
  );
  const pending = working.flatMap((row) =>
    copyFields(row).map((item) => ({
      slug: row.slug,
      field: item.key,
      settlement: settlementOf(
        byField.get(`${row.slug}:${item.key}`) ?? null,
        item.file,
        item.live
      ),
    }))
  );
  const copyUnsettled = unsettled(pending);
  // Counted over FIELDS, not over the strings above: `copyDrift` and
  // `copyUnsettled` are both one line per ROOM, and a room with a settled
  // tagline and an unruled premise appears in both. Subtracting the two
  // lengths would report a room half-done as a room untouched.
  const copySettled = pending.filter(
    (item) => item.settlement.state === "settled"
  ).length;

  const missing = servable.filter((s) => !liveSet.has(s));
  const extra = live.filter((s) => !servableSet.has(s));

  // ── THE PUBLISH BACKLOG, AS A NUMBER ────────────────────────────────
  //
  // db/054. A status report once said "THE QUEUE: 1" meaning the engine's
  // decision queue, while the backlog a curator actually feels — rows waiting
  // for a person — was measured nowhere she could read it. The policy answer
  // (db/036: pool classes stock themselves) is correct and is not a count:
  // rows predating it, and anything hand-drafted, are unaffected by it.
  //
  // Registry-driven, so a seventh pool appears here without an edit.
  const pools = await query<{
    entity_table: string;
    total: string;
    issuable: string;
    sitting: string;
  }>("select entity_table, total, issuable, sitting from pool_standing()");

  const sittingByPool = Object.fromEntries(
    pools
      .filter((p) => Number(p.sitting) > 0)
      .map((p) => [p.entity_table, Number(p.sitting)])
  );
  const sitting = pools.reduce((n, p) => n + Number(p.sitting), 0);

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
      // True when every live room's name, tagline and premise match the
      // registry. False is a prompt to look, not necessarily a defect.
      copyAgrees: copyDrift.length === 0,
      copyDrift,
      // The one that is meant to reach zero. See the block above `copyDrift`:
      // a settled `database wins` is a permanent, deliberate difference, so
      // `copyAgrees` will read false forever and correctly. This says whether
      // anything is still WAITING — never ruled on, or ruled on against text
      // that has moved since. `copySettled` counts FIELDS; `copyDrift` and
      // `copyUnsettled` are one line per ROOM.
      copySettled,
      copyUnsettled,
      // Rows waiting for a person, across every live pool. The publish queue,
      // as distinct from the engine's decision queue in /api/desk/digest.
      sitting,
      sittingByPool,
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
