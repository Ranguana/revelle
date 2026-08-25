import "server-only";

import { headers } from "next/headers";

import { query } from "@/lib/db";
import {
  SYNC_DONE,
  SYNC_FAILED,
  SYNC_STARTED,
  type StepResult,
  type SyncEvent,
} from "./catalogue.ts";

/**
 * CALLING THE SEEDERS FROM THE DESK, AND WRITING DOWN WHAT THEY DID.
 *
 * ── WHY THIS EXISTS ─────────────────────────────────────────────────
 *
 * The preDeployCommand is `npm run migrate` alone. The seeders left the deploy
 * chain, which relocates CLAUDE.md rule 12's failure rather than removing it:
 * a seeder that used to be forgotten by a blueprint can now be forgotten by a
 * person. THE TRADE IS ONLY GOOD IF A SYNC IS VISIBLE — who ran it, when, what
 * each seeder did, and what failed.
 *
 * So every run writes to the ledger, in the same table and the same shape
 * db/036 gave the seeders' own auto-publishes, and /desk/stocked reads it back.
 * A silent success and a silent no-op are the same screen, and that is the bug
 * this whole change exists to prevent.
 *
 * ── IT CALLS THE ROUTE. IT DOES NOT REIMPLEMENT IT ──────────────────
 *
 * src/app/api/desk/seed/route.ts already spawns the seeder chain inside
 * Render, on the private network, with the service's environment — read its
 * header, which documents the problem and its own safety properties. This
 * module POSTs to it and records the answer. A second copy of the chain here
 * would be a second list to drift (CLAUDE.md rule 19, and rule 20's whole
 * lesson about a file that disagrees with what actually runs).
 *
 * The origin comes from the INCOMING REQUEST's own headers rather than from
 * APP_URL, because the route is on this same service and by definition
 * reachable at the host the browser just used. APP_URL is set by hand in the
 * dashboard (render.yaml, `sync: false`), and a control that breaks when
 * somebody mistypes an unrelated variable is a control nobody trusts.
 *
 * ── WHAT THE ROUTE ACTUALLY DOES ABOUT LONG RUNS ────────────────────
 *
 * It BLOCKS. It runs the steps one at a time, `await`ing each child process,
 * stops at the first non-zero exit, and returns the whole transcript at the
 * end. It does not stream and it does not return early; its `maxDuration` is
 * 300 seconds because the dish seeder alone writes 600 rows.
 *
 * There is therefore no honest progress to show, and none is faked. What the
 * screen gets is a PENDING STATE with the run's own start time in it, and a
 * completed record afterwards. The fetch below carries a deadline slightly
 * under the route's ceiling; if it expires, the run has NOT been cancelled —
 * the child processes belong to the route, not to this request — so the ledger
 * is left holding a start with no ending, which is a true statement and reads
 * on screen as one. It is never written up as a success.
 *
 * ── AND ABOUT TWO PEOPLE PRESSING AT ONCE ───────────────────────────
 *
 * The route does NOTHING about concurrency. It has no lock, no dedupe and no
 * refusal: two POSTs spawn two chains that write the same rows in two
 * transactions, and Postgres decides who loses. The seeders are idempotent
 * against THEMSELVES, not against each other.
 *
 * So the guard is here, in front of it: a sync that has started and not ended
 * blocks another from starting. It is a check-then-act and therefore not
 * airtight against two clicks in the same millisecond — said plainly rather
 * than implied — but it closes the case that actually happens, which is a
 * second person opening the screen, seeing nothing moving, and pressing the
 * button again. A database-level lock belongs in the route, where both callers
 * would pass through it; that is a change to the route's contract and is
 * deliberately not being made in the same pass as the button.
 */

/** How many sync records the desk reads back. A feed, not a backlog. */
export const SYNC_HISTORY = 12;

/**
 * How long this request waits on the route.
 *
 * Under the route's own `maxDuration` of 300s, so that when the route gives up
 * it is the route that says so, with its transcript, rather than this side
 * timing out first and losing the report. 280 seconds.
 */
const DEADLINE_MS = 280_000;

/**
 * Past this, a start with no ending is not a run in flight — it is a run that
 * died without saying so. Matches RUNNING_IS_STALE_AFTER_MS in catalogue.ts
 * and migrations.ts, generously, because a false "abandoned" here would let a
 * second chain start on top of a first.
 */
export const IN_FLIGHT_FOR_MS = 30 * 60 * 1000;

/* ── the run record ─────────────────────────────────────────────────── */

type LedgerRow = {
  entry: string;
  created_at: Date;
  action: string;
  actor: string;
  summary: string;
  who: string | null;
  detail: Record<string, unknown> | null;
};

/**
 * The sync rows, newest first.
 *
 * Read straight from `staff_action` rather than through `desk_activity`,
 * because these rows carry no `entity_table` — a sync is about the library, not
 * about one row — and the pool-shaped reads next door would drop every one of
 * them. Everything out of `detail` is read defensively: it is jsonb, its shape
 * differs per action by design (db/011), and a missing key is normal.
 */
export async function syncEvents(
  limit: number = SYNC_HISTORY
): Promise<SyncEvent[] | null> {
  try {
    const rows = await query<LedgerRow>(
      `select a.id::text as entry, a.created_at, a.action, a.actor, a.summary,
              a.detail,
              coalesce(nullif(btrim(s.name), ''), s.email) as who
         from staff_action a
         left join staff s on s.id = a.staff_id
        where a.action in ($1, $2, $3)
        order by a.created_at desc, a.id desc
        limit ${Math.max(1, Math.floor(limit))}`,
      [SYNC_STARTED, SYNC_DONE, SYNC_FAILED]
    );
    return rows.map(readEvent);
  } catch (err) {
    // A ledger this process cannot read is CANNOT TELL, never "nothing has
    // happened". The screen says so in those words. CLAUDE.md rule 16.
    console.error(
      "[catalogue] could not read the sync ledger",
      err instanceof Error ? err.message : err
    );
    return null;
  }
}

function readEvent(row: LedgerRow): SyncEvent {
  const detail = row.detail ?? {};
  const text = (key: string): string | null => {
    const value = detail[key];
    return typeof value === "string" && value.length > 0 ? value : null;
  };

  const rawSteps = Array.isArray(detail.steps) ? detail.steps : [];
  const steps: StepResult[] = rawSteps.flatMap((step) => {
    if (typeof step !== "object" || step === null) return [];
    const s = step as Record<string, unknown>;
    if (typeof s.script !== "string") return [];
    return [
      {
        script: s.script,
        code: typeof s.code === "number" ? s.code : -1,
        ms: typeof s.ms === "number" ? s.ms : 0,
        output: typeof s.output === "string" ? s.output : "",
      },
    ];
  });

  const stocked: Record<string, number> = {};
  if (typeof detail.stocked === "object" && detail.stocked !== null) {
    for (const [table, n] of Object.entries(
      detail.stocked as Record<string, unknown>
    )) {
      if (typeof n === "number") stocked[table] = n;
    }
  }

  return {
    entry: row.entry,
    at: new Date(row.created_at),
    action: row.action,
    // `who` is null for a token-triggered run, which is exactly what db/036's
    // nullable staff_id was for: the ledger says "nobody" rather than lying.
    who: row.who,
    run: text("run"),
    summary: row.summary,
    steps,
    planned: Array.isArray(detail.planned)
      ? detail.planned.filter((s): s is string => typeof s === "string")
      : [],
    sources: {},
    stocked,
  };
}

/**
 * Is a run open right now, and how long has it been open?
 *
 * A start is open until a `catalogue.synced` or `catalogue.sync_failed` row
 * with the same run id lands. Matched on the run id rather than on time,
 * because two runs' rows interleave by timestamp and a time-based pairing
 * would call the second one finished by the first one's receipt.
 */
export function openRun(events: readonly SyncEvent[]): SyncEvent | null {
  const started = events.find((event) => event.action === SYNC_STARTED);
  if (!started) return null;
  const ended = events.some(
    (event) =>
      (event.action === SYNC_DONE || event.action === SYNC_FAILED) &&
      event.run !== null &&
      event.run === started.run
  );
  return ended ? null : started;
}

/** Has it been open so long that it is a corpse rather than a run? */
export function isAbandoned(started: SyncEvent, now: Date): boolean {
  return now.getTime() - started.at.getTime() > IN_FLIGHT_FOR_MS;
}

/* ── calling the route ──────────────────────────────────────────────── */

export type RouteOutcome =
  | { kind: "ok"; steps: StepResult[] }
  | { kind: "failed"; steps: StepResult[]; message: string }
  | { kind: "unreachable"; message: string }
  | { kind: "timeout"; message: string }
  | { kind: "closed"; message: string };

type RouteBody = { ok?: unknown; steps?: unknown };

/**
 * POST /api/desk/seed, and turn its answer into something a screen can print.
 *
 * Every failure mode is a NAMED state rather than a thrown error, because each
 * one needs a different sentence in front of a person and "something went
 * wrong" is the sentence that starts an archaeology dig. `closed` in
 * particular: the route answers 404 when DESK_DIGEST_TOKEN is unset — it fails
 * closed by design — and a 404 rendered as "not found" would send somebody
 * looking for a missing route instead of a missing variable.
 */
export async function callSeedRoute(): Promise<RouteOutcome> {
  const token = (process.env.DESK_DIGEST_TOKEN ?? "").trim();
  if (!token) {
    return {
      kind: "closed",
      message:
        "DESK_DIGEST_TOKEN is not set on this service, so /api/desk/seed is " +
        "closed and answers 404 to everything — that is the route failing " +
        "closed, not a fault. Set it in the Render dashboard (render.yaml " +
        "lists it, sync: false) and press this again. Nothing ran.",
    };
  }

  let origin: string;
  try {
    origin = await selfOrigin();
  } catch (err) {
    return {
      kind: "unreachable",
      message: `Could not work out this service's own origin: ${message(err)}`,
    };
  }

  let response: Response;
  try {
    response = await fetch(`${origin}/api/desk/seed`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      // No `activate` and no `demo`. Both are separate calls on the route and
      // stay that way: CLAUDE.md rule 8 — a seeder produces drafts and
      // activation is a human gesture, not a side effect of a sync.
      body: "{}",
      cache: "no-store",
      signal: AbortSignal.timeout(DEADLINE_MS),
    });
  } catch (err) {
    const timedOut =
      err instanceof Error &&
      (err.name === "TimeoutError" || err.name === "AbortError");
    return timedOut
      ? {
          kind: "timeout",
          message:
            `No answer within ${Math.round(DEADLINE_MS / 1000)} seconds. THE ` +
            `RUN WAS NOT CANCELLED — the seeders are child processes of the ` +
            `route, not of this request, so they are probably still going. ` +
            `Reload in a minute; what they wrote appears in the feed below ` +
            `whether or not this request ever heard back.`,
        }
      : { kind: "unreachable", message: message(err) };
  }

  if (response.status === 404) {
    return {
      kind: "closed",
      message:
        "The route answered 404, which is how it says DESK_DIGEST_TOKEN is " +
        "unset or does not match. Nothing ran.",
    };
  }

  let body: RouteBody | null = null;
  try {
    body = (await response.json()) as RouteBody;
  } catch {
    body = null;
  }

  const steps = readSteps(body);

  if (response.ok && body?.ok === true) return { kind: "ok", steps };

  return {
    kind: "failed",
    steps,
    message:
      steps.length > 0
        ? `The chain stopped at \`npm run ${
            (steps.find((step) => step.code !== 0) ?? steps[steps.length - 1])
              .script
          }\`.`
        : `The route answered ${response.status} and named no steps.`,
  };
}

/** The route's `steps` array, read defensively. It is JSON off the wire. */
function readSteps(body: RouteBody | null): StepResult[] {
  if (!body || !Array.isArray(body.steps)) return [];
  return body.steps.flatMap((step) => {
    if (typeof step !== "object" || step === null) return [];
    const s = step as Record<string, unknown>;
    if (typeof s.script !== "string") return [];
    return [
      {
        script: s.script,
        code: typeof s.code === "number" ? s.code : -1,
        ms: 0,
        output: typeof s.output === "string" ? s.output : "",
      },
    ];
  });
}

/**
 * Where this service is, according to the request that is being served.
 *
 * `x-forwarded-proto` is set by Render's proxy; behind it is http, in front of
 * it is https, and getting that wrong means a redirect loop rather than an
 * error. Falls back to the scheme that matches the host, so `next dev` on
 * localhost works without configuration.
 */
async function selfOrigin(): Promise<string> {
  const head = await headers();
  const host = head.get("host");
  if (!host) throw new Error("the request carries no Host header");
  const forwarded = head.get("x-forwarded-proto");
  const proto =
    forwarded?.split(",")[0]?.trim() ||
    (/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host) ? "http" : "https");
  return `${proto}://${host}`;
}

function message(err: unknown): string {
  if (err instanceof Error) {
    // `fetch` wraps the interesting part in `cause` and says "fetch failed".
    const cause = (err as { cause?: unknown }).cause;
    const inner =
      cause instanceof Error ? ` (${cause.message})` : "";
    return `${err.message}${inner}`;
  }
  return String(err);
}
