/**
 * The queue, as functions over a database handle.
 *
 * Every function here takes a `Queryable` as its first argument and returns
 * data. No pool, no process.env, no "server-only", no Next.js — the same
 * discipline the selection engine keeps, and for the same reason: a queue whose
 * claiming logic can only be exercised by booting a web server is a queue whose
 * claiming logic is not exercised.
 *
 * The schema, and the reasoning behind it, is db/008. This file is the SQL that
 * file was shaped for, and nothing more.
 *
 * ── THE TWO STATEMENTS THAT MATTER ───────────────────────────────────
 *
 * `claim` and `fail`. Everything else is bookkeeping. Both are single
 * statements on purpose: a single statement is a transaction whether or not the
 * caller gave us one, so a caller holding a pool cannot accidentally split them
 * across two connections and lose the atomicity they depend on.
 */

import {
  LeaseLostError,
  type JobRow,
  type JobStatus,
  type JsonObject,
  type JsonValue,
  type QueryRow,
  type Queryable,
} from "./types.ts";

/**
 * Every column of `job`, aliased to the shape TypeScript reads it in. Written
 * once because a select-star returning snake_case would put the translation in
 * every call site, and one of them would eventually disagree.
 */
const JOB_COLUMNS = `
  id,
  parent_id      as "parentId",
  type,
  payload,
  result,
  status,
  attempts,
  max_attempts   as "maxAttempts",
  run_after      as "runAfter",
  lease_seconds  as "leaseSeconds",
  claimed_by     as "claimedBy",
  claimed_at     as "claimedAt",
  dedupe_key     as "dedupeKey",
  revelle_id     as "revelleId",
  last_error     as "lastError",
  last_error_at  as "lastErrorAt",
  error_log      as "errorLog",
  created_at     as "createdAt",
  updated_at     as "updatedAt",
  started_at     as "startedAt",
  finished_at    as "finishedAt"
`;

/** Prefixed for the claim, where the update needs a table alias. */
function jobColumns(alias: string): string {
  return JOB_COLUMNS.replace(/^(\s+)([a-z_]+)/gm, `$1${alias}.$2`);
}

/**
 * A very long error message is almost always a provider's HTML error page, and
 * storing fifty kilobytes of it on a row that is read by every status poll is a
 * bad trade for information nobody reads past the first line.
 */
export const MAX_ERROR_LENGTH = 4_000;

export function truncateError(message: string): string {
  if (message.length <= MAX_ERROR_LENGTH) return message;
  return `${message.slice(0, MAX_ERROR_LENGTH - 20)}… [truncated]`;
}

/** Whatever was thrown, as one line someone can read. */
export function errorMessage(err: unknown): string {
  if (err instanceof Error) {
    const name = err.name && err.name !== "Error" ? `${err.name}: ` : "";
    const message = err.message || "(no message)";
    const cause =
      err.cause instanceof Error ? ` (caused by ${err.cause.message})` : "";
    return truncateError(`${name}${message}${cause}`);
  }
  if (typeof err === "string") return truncateError(err);
  try {
    return truncateError(`non-Error thrown: ${JSON.stringify(err)}`);
  } catch {
    return "non-Error thrown, and it could not be serialised";
  }
}

/* ── enqueue ──────────────────────────────────────────────────────── */

export type EnqueueInput = {
  type: string;
  payload?: JsonObject;
  /** The Revelle this is about, if any. What makes the status view cheap. */
  revelleId?: string | null;
  /**
   * Unique among live jobs. The double-click guard: enqueueing the same key
   * twice while the first is still going gives back the first.
   */
  dedupeKey?: string | null;
  maxAttempts?: number;
  leaseSeconds?: number;
  /** Do not run before now + this. */
  delayMs?: number;
  /** Set only when enqueueing a piece of a parent. */
  parentId?: string | null;
};

export type EnqueueResult = {
  job: JobRow;
  /**
   * False when a live job already held this dedupe key, in which case `job` is
   * that one. A caller that wants to say "already under way" rather than
   * "started" needs to know which happened.
   */
  created: boolean;
};

/**
 * Write the row and return. This is the trigger surface — the thing a request
 * calls before answering the customer.
 *
 * It is a plain insert on purpose. No notification, no side effect, no "and
 * also poke the runner": the runner's next tick will find it, and a queue whose
 * enqueue path can fail for a reason unrelated to the insert is a queue that
 * loses work at the moment it is accepted.
 */
export async function enqueue(
  db: Queryable,
  input: EnqueueInput
): Promise<EnqueueResult> {
  const { rows } = await db.query<JobRow>(
    `insert into job (type, payload, revelle_id, dedupe_key, parent_id,
                      max_attempts, lease_seconds, run_after)
     values ($1, coalesce($2::jsonb, '{}'::jsonb), $3, $4, $5,
             coalesce($6, 5), coalesce($7, 180),
             now() + (coalesce($8, 0) || ' milliseconds')::interval)
     on conflict do nothing
     returning ${JOB_COLUMNS}`,
    [
      input.type,
      input.payload ? JSON.stringify(input.payload) : null,
      input.revelleId ?? null,
      input.dedupeKey ?? null,
      input.parentId ?? null,
      input.maxAttempts ?? null,
      input.leaseSeconds ?? null,
      input.delayMs ?? 0,
    ]
  );

  if (rows[0]) return { job: rows[0], created: true };

  // `on conflict do nothing` returned nothing, so the partial unique index on
  // dedupe_key stopped it. Hand back the job that already holds the key.
  if (input.dedupeKey) {
    const existing = await liveByDedupeKey(db, input.dedupeKey);
    if (existing) return { job: existing, created: false };
  }

  // No dedupe key and still no row: something else is wrong, and silently
  // returning "fine" would drop work on the floor.
  throw new Error(
    `enqueue of ${input.type} inserted nothing and no live job holds its ` +
      `dedupe key — the row was refused for a reason the queue does not model`
  );
}

export async function liveByDedupeKey(
  db: Queryable,
  dedupeKey: string
): Promise<JobRow | null> {
  const { rows } = await db.query<JobRow>(
    `select ${JOB_COLUMNS} from job
      where dedupe_key = $1
        and status in ('queued', 'running', 'waiting')
      limit 1`,
    [dedupeKey]
  );
  return rows[0] ?? null;
}

/* ── claim ────────────────────────────────────────────────────────── */

export type ClaimOptions = {
  /** How many to take. Also the runner's concurrency — see runner.ts. */
  limit: number;
  /** Which runner instance is taking them. Recorded for forensics. */
  claimedBy: string;
  /** Restrict to these types. Omit for everything. */
  types?: readonly string[];
};

/**
 * THE CLAIM. Take up to `limit` runnable jobs, atomically, and hold a lease on
 * each.
 *
 * `for update skip locked` is the whole mechanism. The inner select locks the
 * rows it picks and steps over any row another transaction has already locked,
 * so two runners racing for the same job cannot both get it and neither waits
 * for the other — the second simply reads past it to the next one. Without SKIP
 * LOCKED the second runner blocks on the first's lock and then discovers the
 * row is no longer runnable, which is a queue that gets slower the more workers
 * you add.
 *
 * Three things in the predicate, each load-bearing:
 *
 *   status in ('queued','running')  — `running` is not a mistake. A job whose
 *     runner died still says `running`; the lease is what decides whether that
 *     claim is still good, and run_after carries it. THIS is deploy survival.
 *
 *   run_after <= now()              — backoff for a queued job, lease expiry
 *     for a running one. One column, one comparison. See db/008.
 *
 *   attempts < max_attempts         — a job that has exhausted its budget must
 *     not be claimed again. Without this a handler that crashes the process
 *     would be reclaimed forever, incrementing attempts and never reaching a
 *     state anybody can see. `reapExhausted` below is the other half.
 *
 * The order is `run_after, created_at`: oldest deadline first, ties broken by
 * age, which is fair and — because it is the index's own order — free.
 */
export async function claim(
  db: Queryable,
  opts: ClaimOptions
): Promise<JobRow[]> {
  const { rows } = await db.query<JobRow>(
    `with runnable as (
       select id
         from job
        where status in ('queued', 'running')
          and run_after <= now()
          and attempts < max_attempts
          and ($3::text[] is null or type = any($3::text[]))
        order by run_after, created_at
        for update skip locked
        limit $1
     )
     update job j
        set status     = 'running',
            attempts   = j.attempts + 1,
            started_at = coalesce(j.started_at, now()),
            claimed_by = $2,
            claimed_at = now(),
            run_after  = now() + (j.lease_seconds || ' seconds')::interval
       from runnable r
      where j.id = r.id
     returning ${jobColumns("j")}`,
    [opts.limit, opts.claimedBy, opts.types?.length ? [...opts.types] : null]
  );
  return rows;
}

/**
 * The other half of `attempts < max_attempts`.
 *
 * A job reaches this only one way: its runner claimed it for the last time its
 * budget allowed and then died without reporting anything — the process was
 * killed by a deploy at the wrong second, or the handler took the process down.
 * The lease expires, the claim will not take it back, and without this it would
 * sit in `running` looking busy forever.
 *
 * Called at the top of every tick. It is a no-op against an index-covered empty
 * set on a healthy queue.
 */
export async function reapExhausted(db: Queryable): Promise<JobRow[]> {
  const note =
    "abandoned: the attempt budget was spent and the last runner to hold it " +
    "never reported an outcome — it was almost certainly killed mid-flight";

  const { rows } = await db.query<JobRow>(
    `update job
        set status        = 'failed',
            finished_at   = now(),
            last_error    = coalesce(last_error, $1),
            last_error_at = now(),
            error_log     = job_append_error(error_log, attempts, $1)
      where status in ('queued', 'running')
        and run_after <= now()
        and attempts >= max_attempts
     returning ${JOB_COLUMNS}`,
    [note]
  );
  return rows;
}

/* ── settling a claim ─────────────────────────────────────────────── */

/**
 * Every write below is fenced on `attempts`.
 *
 * A runner that lost its lease — because it was slow and another instance took
 * the row — must not be able to write the row's outcome. Its work is already
 * being redone; letting it report would overwrite a fresh attempt with a stale
 * one, and in the worst case mark a job succeeded whose successful attempt is
 * still running and about to write a different result.
 *
 * `attempts` is the token because the claim increments it, so it is different
 * for every claim of a row and identifies one exactly. The obvious alternative,
 * claimed_at, is WRONG here and the reason is worth writing down: Postgres
 * keeps timestamps to the microsecond and a JavaScript Date holds
 * milliseconds, so a timestamp that has been through this process and back no
 * longer equals the one in the row. Every write would be refused as stale.
 * An integer survives the round trip exactly.
 */
export async function succeed(
  db: Queryable,
  job: JobRow,
  result?: JsonValue
): Promise<JobRow> {
  const { rows } = await db.query<JobRow>(
    `update job
        set status      = 'succeeded',
            finished_at = now(),
            run_after   = now(),
            result      = $3::jsonb
      where id = $1 and status = 'running' and attempts = $2
     returning ${JOB_COLUMNS}`,
    [job.id, job.attempts, result === undefined ? null : JSON.stringify(result)]
  );
  if (!rows[0]) throw new LeaseLostError(job.id);
  return rows[0];
}

/**
 * Record a failure and decide, in the same statement, whether that failure was
 * the last one.
 *
 * One statement because the decision and the write must not be able to
 * disagree: reading attempts, deciding in TypeScript, and writing back is a
 * read-modify-write over a row another runner may have re-claimed in between.
 *
 * `permanent` skips the remaining budget. See PermanentJobError.
 */
export async function fail(
  db: Queryable,
  job: JobRow,
  message: string,
  opts: { permanent?: boolean; retryDelayMs: number }
): Promise<JobRow> {
  const text = truncateError(message);

  const { rows } = await db.query<JobRow>(
    `update job
        set status = case
              when $3 or attempts >= max_attempts then 'failed'::job_status
              else 'queued'::job_status
            end,
            finished_at = case
              when $3 or attempts >= max_attempts then now()
              else null
            end,
            run_after = case
              when $3 or attempts >= max_attempts then now()
              else now() + ($4 || ' milliseconds')::interval
            end,
            last_error    = $5,
            last_error_at = now(),
            error_log     = job_append_error(error_log, attempts, $5)
      where id = $1 and status = 'running' and attempts = $2
     returning ${JOB_COLUMNS}`,
    [job.id, job.attempts, opts.permanent ?? false, opts.retryDelayMs, text]
  );
  if (!rows[0]) throw new LeaseLostError(job.id);
  return rows[0];
}

/**
 * The fan-out transition. Delegates to job_mark_waiting() in db/008, which does
 * the update and the settle check in one transaction — read the note above that
 * function before changing this, because doing the same two things from here
 * with two round trips is a race that loses a Revelle silently.
 *
 * Returns false when the lease was lost.
 */
export async function markWaiting(
  db: Queryable,
  job: JobRow
): Promise<boolean> {
  const { rows } = await db.query<{ ok: boolean }>(
    `select job_mark_waiting($1, $2) as ok`,
    [job.id, job.attempts]
  );
  return rows[0]?.ok === true;
}

/* ── reading ──────────────────────────────────────────────────────── */

export async function getJob(
  db: Queryable,
  id: string
): Promise<JobRow | null> {
  const { rows } = await db.query<JobRow>(
    `select ${JOB_COLUMNS} from job where id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

/** A job's pieces, oldest first. What a join step reads. */
export async function piecesOf(
  db: Queryable,
  parentId: string
): Promise<JobRow[]> {
  const { rows } = await db.query<JobRow>(
    `select ${JOB_COLUMNS} from job where parent_id = $1 order by created_at, id`,
    [parentId]
  );
  return rows;
}

/**
 * WHERE IS THIS REVELLE UP TO — the query a waiting page polls.
 *
 * Reads the view in db/008, which is index-driven: one lookup by revelle_id,
 * one by parent_id per root job. Nothing here scans.
 */
export type GenerationStatus = {
  revelleId: string;
  jobId: string;
  type: string;
  status: JobStatus;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  startedAt: Date | null;
  finishedAt: Date | null;
  /**
   * Null if and only if the job has settled. Otherwise the soonest moment
   * anything is due — including a piece's retry while the parent itself is
   * merely waiting. A page can poll until this is null and nothing else.
   */
  nextAttemptAt: Date | null;
  lastError: string | null;
  piecesTotal: number;
  piecesSucceeded: number;
  piecesRunning: number;
  piecesPending: number;
  piecesFailed: number;
  failedPieceType: string | null;
  /** The failing piece's own words, next to the parent's summary. */
  pieceError: string | null;
};

export async function generationStatus(
  db: Queryable,
  revelleId: string
): Promise<GenerationStatus[]> {
  const { rows } = await db.query<GenerationStatus>(
    `select revelle_id       as "revelleId",
            job_id           as "jobId",
            type,
            status,
            attempts,
            max_attempts     as "maxAttempts",
            created_at       as "createdAt",
            started_at       as "startedAt",
            finished_at      as "finishedAt",
            next_attempt_at  as "nextAttemptAt",
            last_error       as "lastError",
            pieces_total     as "piecesTotal",
            pieces_succeeded as "piecesSucceeded",
            pieces_running   as "piecesRunning",
            pieces_pending   as "piecesPending",
            pieces_failed    as "piecesFailed",
            failed_piece_type as "failedPieceType",
            piece_error      as "pieceError"
       from revelle_generation_status
      where revelle_id = $1
      order by created_at desc`,
    [revelleId]
  );
  // Postgres counts come back as bigint, which pg hands over as strings.
  return rows.map((row) => ({
    ...row,
    piecesTotal: Number(row.piecesTotal),
    piecesSucceeded: Number(row.piecesSucceeded),
    piecesRunning: Number(row.piecesRunning),
    piecesPending: Number(row.piecesPending),
    piecesFailed: Number(row.piecesFailed),
  }));
}

export type QueueHealth = {
  queued: number;
  running: number;
  waiting: number;
  /** Failures in the last 24 hours. Bounded on purpose — see db/008. */
  failedLastDay: number;
  leasesExpired: number;
  /** Milliseconds. Growing past a few minutes means nothing is claiming. */
  oldestRunnableAgeMs: number | null;
  lastFailureAt: Date | null;
};

export async function queueHealth(db: Queryable): Promise<QueueHealth> {
  const { rows } = await db.query<QueryRow>(
    `select queued, running, waiting, failed_last_day, leases_expired,
            extract(epoch from oldest_runnable_age) * 1000 as oldest_ms,
            last_failure_at
       from job_queue_health`
  );
  const row = rows[0] ?? {};
  return {
    queued: Number(row.queued ?? 0),
    running: Number(row.running ?? 0),
    waiting: Number(row.waiting ?? 0),
    failedLastDay: Number(row.failed_last_day ?? 0),
    leasesExpired: Number(row.leases_expired ?? 0),
    oldestRunnableAgeMs:
      row.oldest_ms === null || row.oldest_ms === undefined
        ? null
        : Number(row.oldest_ms),
    lastFailureAt: (row.last_failure_at as Date | null) ?? null,
  };
}

/** Stop a job and its unsettled pieces. Returns how many were stopped. */
export async function cancel(
  db: Queryable,
  jobId: string,
  reason?: string
): Promise<number> {
  const { rows } = await db.query<{ stopped: string }>(
    `select cancel_job($1, $2) as stopped`,
    [jobId, reason ?? null]
  );
  return Number(rows[0]?.stopped ?? 0);
}
