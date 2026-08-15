/**
 * The queue's vocabulary.
 *
 * Framework-free on purpose — no React, no "server-only", no `pg` — so that
 * every function in this directory except the wiring in index.ts can be run by
 * `node --test` against a throwaway database, or against nothing at all. Same
 * discipline as src/lib/selection/types.ts and src/lib/music/types.ts.
 *
 * `Queryable` is the whole of the database dependency: one method, satisfied
 * structurally by a pg Pool, a pg PoolClient, and a fake. Nothing here opens a
 * connection or knows where one comes from.
 *
 * The table is db/008. Read that file first — the reasoning about leases,
 * fan-out and the two-level tree lives there, and this file only names it.
 */

/** job_status in db/008. */
export type JobStatus =
  | "queued"
  | "running"
  | "waiting"
  | "succeeded"
  | "failed"
  | "cancelled";

/** The three that never change again. */
export const TERMINAL_STATUSES: readonly JobStatus[] = [
  "succeeded",
  "failed",
  "cancelled",
];

export function isTerminal(status: JobStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

/** What a payload or a result may be. Anything jsonb round-trips. */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type JsonObject = { [key: string]: JsonValue };

/**
 * The only thing this module needs from a database.
 *
 * Deliberately not `pg.Pool`: a Pool, a PoolClient and a hand-written fake all
 * satisfy this, which is what lets the runner be tested with no server and lets
 * a caller pass a transaction client when it has one.
 */
export type QueryRow = Record<string, unknown>;

export interface Queryable {
  query<R extends QueryRow = QueryRow>(
    text: string,
    params?: unknown[]
  ): Promise<{ rows: R[] }>;
}

/** One row of `job`, as it comes back from Postgres. */
export type JobRow = {
  id: string;
  parentId: string | null;
  type: string;
  payload: JsonObject;
  result: JsonValue | null;
  status: JobStatus;
  attempts: number;
  maxAttempts: number;
  runAfter: Date;
  leaseSeconds: number;
  claimedBy: string | null;
  claimedAt: Date | null;
  dedupeKey: string | null;
  revelleId: string | null;
  lastError: string | null;
  lastErrorAt: Date | null;
  errorLog: JobErrorEntry[];
  createdAt: Date;
  updatedAt: Date;
  startedAt: Date | null;
  finishedAt: Date | null;
};

export type JobErrorEntry = {
  attempt: number;
  at: string;
  error: string;
};

/**
 * What a handler is given.
 *
 * `db` is the same handle the runner claimed with, so a handler that needs to
 * write is writing to the same database — but NOT inside the runner's
 * transaction, because there isn't one. A handler that runs for four minutes
 * must not be holding a connection open for four minutes, which is exactly the
 * problem this whole table exists to solve. A handler that needs atomicity
 * across several of its own writes should open its own transaction.
 */
export type JobContext = {
  job: JobRow;
  db: Queryable;

  /**
   * Enqueue a piece of this job. Only meaningful from a root job's handler —
   * the depth guard in db/008 rejects a piece of a piece.
   */
  piece: (input: PieceInput) => Promise<JobRow>;

  /**
   * This job's pieces, from every wave so far, oldest first. The join step
   * reads their `result` fields; that is how work comes back up the tree.
   */
  pieces: () => Promise<JobRow[]>;

  /**
   * Aborted shortly before the lease expires, and on runner shutdown. Pass it
   * to fetch() — a generation call that outlives its lease is work whose result
   * will be thrown away, and the point of the signal is not to pay for it.
   */
  signal: AbortSignal;
};

export type PieceInput = {
  type: string;
  payload?: JsonObject;
  maxAttempts?: number;
  leaseSeconds?: number;
  /** Delay before the piece may first run. Rarely wanted; default is now. */
  delayMs?: number;
};

/**
 * What a handler returns, and the only two things it can mean.
 *
 * `done`     — this unit of work is finished. Its result is stored.
 * `waiting`  — this job has fanned out into the pieces whose ids are given,
 *              and wants another turn once they have all settled.
 *
 * The ids are required rather than inferred. A handler that returns `waiting`
 * having enqueued nothing is a bug that would otherwise present as a job stuck
 * forever in `waiting`, and asking for the ids turns it into an error message
 * at the moment it happens.
 */
export type HandlerResult =
  | { kind: "done"; result?: JsonValue }
  | { kind: "waiting"; pieces: string[] };

export function done(result?: JsonValue): HandlerResult {
  return { kind: "done", result };
}

export function waiting(pieces: readonly string[]): HandlerResult {
  return { kind: "waiting", pieces: [...pieces] };
}

export type Handler = (ctx: JobContext) => Promise<HandlerResult>;

/**
 * A handler and the two operational facts about it that belong next to it
 * rather than at every call site that enqueues it.
 */
export type Registration = {
  handle: Handler;
  /**
   * How long one attempt is allowed to take. Set it generously: a lease that
   * expires under a handler that is still working causes the job to run twice.
   */
  leaseSeconds?: number;
  maxAttempts?: number;
};

/**
 * Thrown by a handler (or by the runner) when retrying is pointless: a payload
 * that will never validate, a type with no handler, a provider saying the
 * request itself is malformed. Goes straight to `failed` with the attempts it
 * has left unspent, because burning four more attempts and eight minutes of
 * backoff on a 400 helps nobody.
 */
export class PermanentJobError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "PermanentJobError";
  }
}

/**
 * Thrown when a job cannot be found, or when a write is refused because the
 * runner no longer holds the lease. Not a handler's problem — the runner
 * catches it and moves on.
 */
export class LeaseLostError extends Error {
  // A field and an assignment rather than a constructor parameter property:
  // Node's type stripping (which is what runs `npm test` on these files) does
  // not support parameter properties, and every module in this directory has to
  // stay loadable by `node --test`.
  readonly jobId: string;

  constructor(jobId: string) {
    super(
      `lease on job ${jobId} was lost — another runner has claimed it, and ` +
        `this attempt's result is being discarded`
    );
    this.name = "LeaseLostError";
    this.jobId = jobId;
  }
}
