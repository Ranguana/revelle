import "server-only";

/**
 * The queue's front door, and the only file in this directory that knows it is
 * inside a Next.js app.
 *
 * Everything else here takes a database handle and a registry as arguments.
 * This file is where the handle comes from the pool in src/lib/db.ts, the
 * registry is assembled, and the runner is started.
 *
 * ── HOW THE RUNNER IS STARTED, AND WHAT IT COSTS ─────────────────────
 *
 * An interval inside the web process, kicked off from src/instrumentation.ts.
 * Two alternatives were considered and this one was chosen with its eyes open.
 *
 *   A. AN INTERVAL IN THE WEB PROCESS — this.
 *      Nothing to deploy, nothing to authenticate, no second service to keep in
 *      sync with the first, and no HTTP surface that must be protected. It runs
 *      whenever the service runs. On Render's `starter` plan (render.yaml) the
 *      web service does not sleep, so "whenever the service runs" is always.
 *
 *      What it does not survive: itself. If the process dies mid-job the work
 *      it held stops dead. That is survivable ONLY because of the lease — the
 *      row stays `running` with a deadline, and the next instance claims it
 *      back by the same query it uses for everything else. The failure mode is
 *      a delay of one lease, not lost work, and that is the trade being made.
 *
 *      What it genuinely cannot do: run when the service is not running. If the
 *      plan is ever downgraded to `free`, which sleeps when idle, an enqueued
 *      job would sit until the next visitor woke the service. That is the one
 *      condition under which this choice becomes wrong.
 *
 *   B. A RENDER CRON HITTING AN ENDPOINT.
 *      More robust in exactly one respect — a cron fires whether or not the web
 *      process is healthy — and worse in several. It is a second service to
 *      provision and pay for; its minimum granularity is a minute, so a
 *      customer waiting on a page waits up to a minute for work to even start;
 *      and it requires a public route with a shared secret, which is a new
 *      authenticated surface in an app whose application endpoint is already
 *      flagged as needing rate limiting before launch (docs/build-checklist).
 *      More moving parts to buy latency that is worse.
 *
 *   C. A RENDER BACKGROUND WORKER. Ruled out by the brief and by render.yaml:
 *      one service, one database, no step that depends on a machine anyone has
 *      to remember about.
 *
 * If (A) ever proves wrong, (B) is a small change and not a rewrite: `tick()`
 * on the runner is public and does one complete pass, so the endpoint is four
 * lines around a call to it. Nothing else moves.
 *
 * NOTHING HERE DEPENDS ON A LOCAL MACHINE, which is this project's standing
 * constraint. The runner lives inside the same Render process that serves the
 * site, started by the same deploy, using the same DATABASE_URL.
 */

import { pool } from "@/lib/db";

import { registerFixtures } from "./fixtures.ts";
import * as q from "./queue.ts";
import { createRegistry, type Registry } from "./registry.ts";
import { JobRunner } from "./runner.ts";
import type { EnqueueInput, EnqueueResult } from "./queue.ts";
import type { JobRow, QueryRow, Queryable } from "./types.ts";

export type {
  GenerationStatus,
  EnqueueInput,
  EnqueueResult,
  QueueHealth,
} from "./queue.ts";
export type { JobRow, JobStatus, Handler, Registration } from "./types.ts";
export { PermanentJobError, done, waiting, isTerminal } from "./types.ts";
export { JobRunner } from "./runner.ts";
export { Registry, createRegistry } from "./registry.ts";

/**
 * The pool as a `Queryable`.
 *
 * `pool()` is called per query rather than captured once, because in
 * development Next.js recreates modules on hot reload and src/lib/db.ts stashes
 * the pool on globalThis to survive that. Capturing it here would hold a
 * reference to a pool that a later reload replaced.
 */
const db: Queryable = {
  query: <R extends QueryRow = QueryRow>(text: string, params?: unknown[]) =>
    pool().query(text, params ?? []) as Promise<{ rows: R[] }>,
};

declare global {
  var __revelleJobRunner: JobRunner | undefined;
  var __revelleJobRegistry: Registry | undefined;
}

/**
 * The live registry.
 *
 * Fixtures are gated: they are how the queue is exercised, not something a
 * customer's database should be able to be asked to run. Generation registers
 * itself here when it lands.
 */
export function registry(): Registry {
  if (!globalThis.__revelleJobRegistry) {
    const built = createRegistry();
    if (process.env.JOBS_FIXTURES === "on") registerFixtures(built);
    globalThis.__revelleJobRegistry = built;
  }
  return globalThis.__revelleJobRegistry;
}

export function runner(): JobRunner {
  if (!globalThis.__revelleJobRunner) {
    globalThis.__revelleJobRunner = new JobRunner({
      db,
      registry: registry(),
      // Distinct per process, and legible in the table after an incident.
      instanceId: `${process.env.RENDER_INSTANCE_ID ?? "local"}:${process.pid}`,
      batchSize: Number(process.env.JOBS_BATCH_SIZE ?? 4),
      intervalMs: Number(process.env.JOBS_INTERVAL_MS ?? 2_000),
    });
  }
  return globalThis.__revelleJobRunner;
}

/**
 * Called once from src/instrumentation.ts.
 *
 * Returns immediately — `register()` in instrumentation must complete before
 * the server takes traffic, so this may not do work, only arrange for work to
 * be done.
 */
export function startJobRunner(): void {
  if (process.env.JOBS_RUNNER === "off") {
    console.log("[jobs] runner disabled by JOBS_RUNNER=off");
    return;
  }
  if (!process.env.DATABASE_URL) {
    // Same posture as a missing RESEND_API_KEY in src/lib/email.ts: absent
    // configuration is a state, said out loud, not a crash at boot.
    console.error("[jobs] DATABASE_URL is not set — the runner will not start");
    return;
  }

  const instance = runner();
  instance.start();

  // Render sends SIGTERM before replacing an instance. Aborting in-flight
  // handlers here is what returns their jobs to the queue in seconds rather
  // than after a full lease.
  const shutdown = () => {
    void instance.stop();
  };
  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);
}

/* ── the trigger surface ──────────────────────────────────────────── */

/**
 * Write a row and return. What a request calls.
 *
 * Thin on purpose: the only thing it adds to `enqueue` in queue.ts is looking
 * up the handler's declared lease and attempt budget, so that a caller does not
 * have to know how long the work it is asking for takes.
 */
export async function enqueueJob(
  input: EnqueueInput
): Promise<EnqueueResult> {
  const registration = registry().get(input.type);
  return q.enqueue(db, {
    ...input,
    leaseSeconds: input.leaseSeconds ?? registration?.leaseSeconds,
    maxAttempts: input.maxAttempts ?? registration?.maxAttempts,
  });
}

/** Where a Revelle's generation has got to. The page poll. */
export function generationStatus(revelleId: string) {
  return q.generationStatus(db, revelleId);
}

/** Is the queue alive. */
export function queueHealth() {
  return q.queueHealth(db);
}

export function getJob(id: string): Promise<JobRow | null> {
  return q.getJob(db, id);
}

export function cancelJob(id: string, reason?: string): Promise<number> {
  return q.cancel(db, id, reason);
}
