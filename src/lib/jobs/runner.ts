/**
 * The runner: claim work, run it, record what happened.
 *
 * Framework-free like everything beside it. Give it a `Queryable` and a
 * `Registry` and it runs; it does not know it is inside Next.js, and the tests
 * drive it with no server at all.
 *
 * ── SAFE IN N COPIES ─────────────────────────────────────────────────
 *
 * Nothing here coordinates with another runner. It does not have to: `claim` in
 * queue.ts is one atomic statement with `for update skip locked`, so two
 * runners racing for the same row cannot both get it, and neither waits. Run
 * one instance or five; the only thing that changes is throughput.
 *
 * ── SURVIVING A DEPLOY ───────────────────────────────────────────────
 *
 * Render replaces the instance on every deploy, and a generation in flight dies
 * with it. There is no way to prevent that in a single-service architecture, so
 * the design does not try — it makes the loss recoverable instead. A job the
 * dead instance held is still `running` with a lease deadline in `run_after`;
 * once that passes the claim takes it back like any other runnable row, on its
 * next attempt. Nothing is stuck, and nothing needs a human.
 *
 * `stop()` makes the common case cheaper: on SIGTERM it aborts the in-flight
 * handlers' signals and returns their jobs to the queue immediately rather than
 * making the next instance wait out a lease.
 *
 * ── AT-LEAST-ONCE, WHICH HANDLERS MUST KNOW ──────────────────────────
 *
 * A handler can run twice: once by a runner whose lease expired while it was
 * still working, and again by whoever claimed the row next. The fencing on
 * claimed_at (see queue.ts) means only one of them can RECORD an outcome, but
 * both will have done the work and both will have had whatever side effects the
 * work has. Handlers that spend money or send mail must therefore be written to
 * tolerate it — check before sending, or key the side effect on the job id.
 */

import { backoffMs } from "./backoff.ts";
import {
  claim,
  enqueue,
  errorMessage,
  fail,
  markWaiting,
  piecesOf,
  reapExhausted,
  succeed,
} from "./queue.ts";
import type { Registry } from "./registry.ts";
import {
  LeaseLostError,
  PermanentJobError,
  type JobContext,
  type JobRow,
  type PieceInput,
  type Queryable,
} from "./types.ts";

export type RunnerLogger = {
  info: (message: string, detail?: Record<string, unknown>) => void;
  error: (message: string, detail?: Record<string, unknown>) => void;
};

const CONSOLE_LOGGER: RunnerLogger = {
  info: (message, detail) => console.log(`[jobs] ${message}`, detail ?? ""),
  error: (message, detail) => console.error(`[jobs] ${message}`, detail ?? ""),
};

export type RunnerOptions = {
  db: Queryable;
  registry: Registry;
  /**
   * Who this is, in job.claimed_by. Include something that changes per process
   * — "everything stuck was held by the instance that restarted at 04:12" is
   * the sentence this makes possible.
   */
  instanceId: string;
  /**
   * How many jobs one tick takes, and therefore how many run at once. Four is
   * the size of a Revelle's fan-out: it lets one generation's pieces run in
   * parallel without one generation monopolising the process.
   */
  batchSize?: number;
  /**
   * How often to look. Two seconds is short enough that a customer watching a
   * page does not notice the poll and long enough that an idle queue costs one
   * indexed lookup every two seconds.
   */
  intervalMs?: number;
  /**
   * Abort a handler's signal this long BEFORE its lease expires, so it has a
   * moment to unwind and the outcome is recorded by the runner that owns it
   * rather than lost to a lease that has already gone.
   */
  leaseMarginMs?: number;
  logger?: RunnerLogger;
};

export type TickReport = {
  claimed: number;
  succeeded: number;
  failed: number;
  waiting: number;
  reaped: number;
  lost: number;
};

const EMPTY_TICK: TickReport = {
  claimed: 0,
  succeeded: 0,
  failed: 0,
  waiting: 0,
  reaped: 0,
  lost: 0,
};

export class JobRunner {
  private readonly db: Queryable;
  private readonly registry: Registry;
  private readonly instanceId: string;
  private readonly batchSize: number;
  private readonly intervalMs: number;
  private readonly leaseMarginMs: number;
  private readonly log: RunnerLogger;

  private timer: ReturnType<typeof setTimeout> | null = null;
  private running = false;
  private ticking: Promise<TickReport> | null = null;
  private readonly inFlight = new Set<AbortController>();

  constructor(opts: RunnerOptions) {
    this.db = opts.db;
    this.registry = opts.registry;
    this.instanceId = opts.instanceId;
    this.batchSize = opts.batchSize ?? 4;
    this.intervalMs = opts.intervalMs ?? 2_000;
    this.leaseMarginMs = opts.leaseMarginMs ?? 5_000;
    this.log = opts.logger ?? CONSOLE_LOGGER;
  }

  /**
   * One pass: reap what was abandoned, claim what is runnable, run it.
   *
   * Public because it is the whole runner. A test calls it directly; so would a
   * cron-driven endpoint, if the interval below is ever swapped for one.
   */
  async tick(): Promise<TickReport> {
    const report: TickReport = { ...EMPTY_TICK };

    const reaped = await reapExhausted(this.db);
    report.reaped = reaped.length;
    for (const job of reaped) {
      this.log.error("reaped a job whose runner never reported back", {
        id: job.id,
        type: job.type,
        attempts: job.attempts,
        claimedBy: job.claimedBy,
      });
    }

    const jobs = await claim(this.db, {
      limit: this.batchSize,
      claimedBy: this.instanceId,
    });
    report.claimed = jobs.length;
    if (jobs.length === 0) return report;

    // The batch runs concurrently and settles independently — a piece that
    // fails must not delay the piece beside it, which is the whole reason
    // pieces are separate rows.
    const outcomes = await Promise.all(jobs.map((job) => this.runOne(job)));
    for (const outcome of outcomes) report[outcome] += 1;

    return report;
  }

  private async runOne(
    job: JobRow
  ): Promise<"succeeded" | "failed" | "waiting" | "lost"> {
    const registration = this.registry.get(job.type);

    if (!registration) {
      // A type with no handler will never run, however many attempts it has.
      // Usually a deploy that removed a handler while rows referencing it were
      // still in the queue — which is a real thing to find out about, not a
      // thing to retry into the ground.
      return this.recordFailure(
        job,
        new PermanentJobError(
          `no handler is registered for job type ${job.type} — either it was ` +
            `removed while jobs referencing it were still queued, or the type ` +
            `was misspelled at enqueue`
        )
      );
    }

    const controller = new AbortController();
    this.inFlight.add(controller);

    // Abort a little before the lease runs out. Past that point this runner no
    // longer owns the row, so the work is being redone elsewhere and paying a
    // provider to finish it helps nobody.
    const leaseMs = job.leaseSeconds * 1_000;
    const deadline = setTimeout(
      () =>
        controller.abort(
          new Error(
            `lease of ${job.leaseSeconds}s expired for job ${job.id} (${job.type})`
          )
        ),
      Math.max(1_000, leaseMs - this.leaseMarginMs)
    );
    if (typeof deadline.unref === "function") deadline.unref();

    try {
      const result = await registration.handle(this.context(job, controller));

      if (result.kind === "done") {
        await succeed(this.db, job, result.result);
        return "succeeded";
      }

      if (result.pieces.length === 0) {
        // Would otherwise be a job stuck in `waiting` with nothing that can
        // ever wake it. db/008's settle function catches this too; catching it
        // here means the error names the handler rather than the symptom.
        throw new PermanentJobError(
          `handler for ${job.type} returned waiting but enqueued no pieces`
        );
      }

      const held = await markWaiting(this.db, job);
      if (!held) throw new LeaseLostError(job.id);
      return "waiting";
    } catch (err) {
      if (err instanceof LeaseLostError) {
        this.log.error("lost a lease mid-flight; discarding this attempt", {
          id: job.id,
          type: job.type,
        });
        return "lost";
      }
      return this.recordFailure(job, err);
    } finally {
      clearTimeout(deadline);
      this.inFlight.delete(controller);
    }
  }

  private async recordFailure(
    job: JobRow,
    err: unknown
  ): Promise<"failed" | "lost"> {
    const message = errorMessage(err);
    const permanent = err instanceof PermanentJobError;

    try {
      const updated = await fail(this.db, job, message, {
        permanent,
        retryDelayMs: backoffMs(job.attempts),
      });

      if (updated.status === "failed") {
        this.log.error("job failed for good", {
          id: job.id,
          type: job.type,
          attempts: updated.attempts,
          permanent,
          error: message,
        });
      } else {
        this.log.info("job failed; will retry", {
          id: job.id,
          type: job.type,
          attempt: `${updated.attempts}/${updated.maxAttempts}`,
          nextAttemptAt: updated.runAfter,
          error: message,
        });
      }
      return "failed";
    } catch (writeErr) {
      if (writeErr instanceof LeaseLostError) return "lost";
      // The failure could not even be recorded. Say so loudly — the lease will
      // expire and the job will come back, but the reason is only in this log.
      this.log.error("could not record a job failure", {
        id: job.id,
        type: job.type,
        original: message,
        writing: errorMessage(writeErr),
      });
      return "failed";
    }
  }

  private context(job: JobRow, controller: AbortController): JobContext {
    return {
      job,
      db: this.db,
      signal: controller.signal,
      piece: async (input: PieceInput) => {
        const { job: created } = await enqueue(this.db, {
          type: input.type,
          payload: input.payload,
          parentId: job.id,
          // A piece inherits the subject, so the status view counts it without
          // the handler having to remember to pass it.
          revelleId: job.revelleId,
          maxAttempts: input.maxAttempts,
          leaseSeconds: input.leaseSeconds,
          delayMs: input.delayMs,
        });
        return created;
      },
      pieces: () => piecesOf(this.db, job.id),
    };
  }

  /* ── the loop ──────────────────────────────────────────────────── */

  /**
   * Start ticking. Self-scheduling rather than setInterval, so a tick that runs
   * long delays the next one instead of stacking a second tick on top of it —
   * which with a four-minute generation chain would otherwise pile up hundreds
   * of overlapping passes.
   *
   * The interval is jittered so that several instances started by the same
   * deploy do not settle into lockstep and hammer the same index page in
   * unison.
   */
  start(): void {
    if (this.running) return;
    this.running = true;
    this.log.info("runner started", {
      instance: this.instanceId,
      types: this.registry.types().length,
      intervalMs: this.intervalMs,
      batchSize: this.batchSize,
    });
    this.schedule(0);
  }

  private schedule(delayMs: number): void {
    if (!this.running) return;
    const jitter = this.intervalMs * 0.2 * Math.random();
    this.timer = setTimeout(() => {
      void this.runTick();
    }, delayMs + jitter);
    // Never the reason a process stays alive. In the web service the HTTP
    // server holds the process open; in a script it should not.
    if (typeof this.timer.unref === "function") this.timer.unref();
  }

  private async runTick(): Promise<void> {
    this.ticking = this.tick();
    try {
      await this.ticking;
    } catch (err) {
      // A tick that throws is almost always the database being briefly
      // unreachable. Log it and try again on the next interval; crashing the
      // web process over it would be a much worse outage than a late job.
      this.log.error("tick failed", { error: errorMessage(err) });
    } finally {
      this.ticking = null;
      this.schedule(this.intervalMs);
    }
  }

  /**
   * Stop, and give in-flight handlers the courtesy of knowing.
   *
   * Aborting their signals is what turns "this deploy loses four minutes of
   * generation" into "these jobs come back on the next instance immediately".
   * Handlers that ignore the signal still get their lease expiry; this only
   * makes the common case fast.
   */
  async stop(): Promise<void> {
    this.running = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    for (const controller of this.inFlight) {
      controller.abort(new Error("runner is shutting down"));
    }
    if (this.ticking) {
      try {
        await this.ticking;
      } catch {
        // Already logged by runTick.
      }
    }
    this.log.info("runner stopped", { instance: this.instanceId });
  }
}
