/**
 * The queue, against a real Postgres.
 *
 *   createdb revelle_jobs && npm run migrate      # against that database
 *   JOBS_TEST_DATABASE_URL=postgres://…/revelle_jobs npm test
 *
 * SKIPPED unless JOBS_TEST_DATABASE_URL is set, so `npm test` stays a
 * no-dependency run. It has to be a separate variable from DATABASE_URL: every
 * test below truncates the job table, and pointing this at anything that
 * matters would be a bad afternoon.
 *
 * ── WHY THESE PARTICULAR TESTS ───────────────────────────────────────
 *
 * Everything about this queue that can go wrong goes wrong under concurrency or
 * under a process dying, and neither is observable from a unit test. What is
 * asserted here is exactly the set of claims db/008 makes:
 *
 *   1. two runners racing for one job — exactly one gets it
 *   2. a job whose runner died becomes claimable when its lease expires
 *   3. a failing job retries with backoff and ends in a terminal state with its
 *      error intact
 *   4. a parent whose piece fails and retries while its siblings finish, and
 *      the parent reporting truthfully at every step
 *   5. the status query returning what a page needs
 *
 * Time is never waited for. Where a test needs a lease or a backoff to have
 * passed it rewinds the row's clock, which is both instant and a more honest
 * test — it exercises the same predicate a real timeout would.
 */
import assert from "node:assert/strict";
import test, { after, before, beforeEach } from "node:test";

import pg from "pg";

import {
  cancel,
  claim,
  enqueue,
  generationStatus,
  getJob,
  markWaiting,
  piecesOf,
  queueHealth,
  reapExhausted,
  succeed,
  fail,
} from "./queue.ts";
import { registerFixtures } from "./fixtures.ts";
import { createRegistry } from "./registry.ts";
import { JobRunner, type RunnerLogger } from "./runner.ts";
import { PermanentJobError, type Queryable } from "./types.ts";

const URL = process.env.JOBS_TEST_DATABASE_URL;
const skip = URL ? false : "set JOBS_TEST_DATABASE_URL to run these";

let pool: pg.Pool;
let db: Queryable;
let revelleId: string;

const QUIET: RunnerLogger = { info: () => {}, error: () => {} };

before(async () => {
  if (!URL) return;
  pool = new pg.Pool({ connectionString: URL, max: 12 });
  db = pool;
  revelleId = await makeRevelle();
});

after(async () => {
  if (!URL) return;
  await pool.end();
});

beforeEach(async () => {
  if (!URL) return;
  await pool.query("delete from job");
});

/**
 * A Revelle needs a customer, a response and a world before it can exist. All
 * of it is disposable and none of it is what is being tested — it is here so
 * that the revelle_id foreign key, and therefore the status view, is exercised
 * for real rather than with a null.
 */
async function makeRevelle(): Promise<string> {
  const stamp = `jobs-test-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const { rows } = await pool.query<{ id: string }>(
    `with c as (
       insert into customer (email) values ($1 || '@example.test') returning id
     ), q as (
       insert into quiz_response
         (customer_id, answers, quiz_version, submission_key,
          occasion, environment, budget, taste_directions)
       select c.id, '{}'::jsonb, 'test', $1, 'dinner_party', 'my_home', 'not_sure',
              array['test']
         from c
       returning id, customer_id
     ), w as (
       insert into world (slug, name, tagline) values ($1, 'Test World', 'For tests')
       returning id
     )
     insert into revelle (customer_id, quiz_response_id, world_id)
     select q.customer_id, q.id, w.id from q, w
     returning id`,
    [stamp]
  );
  return rows[0].id;
}

/** Rewind a job's clock so a lease or a backoff has "expired". */
async function rewind(id: string, interval = "1 hour"): Promise<void> {
  await pool.query(
    `update job set run_after = now() - $2::interval where id = $1`,
    [id, interval]
  );
}

async function statusOf(id: string): Promise<string> {
  const job = await getJob(db, id);
  assert.ok(job, `job ${id} should exist`);
  return job.status;
}

function runner(instanceId: string, batchSize = 4): JobRunner {
  return new JobRunner({
    db,
    registry: registerFixtures(createRegistry()),
    instanceId,
    batchSize,
    logger: QUIET,
  });
}

/* ── 1. exactly one runner claims a job ────────────────────────────── */

test("two runners racing for the same job — exactly one claims it", { skip }, async () => {
  const { job } = await enqueue(db, { type: "fixture.echo" });

  // Both claims are issued before either is awaited, on separate pooled
  // connections, so they genuinely overlap inside Postgres.
  const [a, b] = await Promise.all([
    claim(db, { limit: 5, claimedBy: "runner-a" }),
    claim(db, { limit: 5, claimedBy: "runner-b" }),
  ]);

  const claimedIds = [...a, ...b].map((row) => row.id);
  assert.deepEqual(claimedIds, [job.id], "the job is claimed exactly once");

  const [winner] = [...a, ...b];
  assert.equal(winner.status, "running");
  assert.equal(winner.attempts, 1);
  assert.ok(["runner-a", "runner-b"].includes(winner.claimedBy ?? ""));
  assert.ok(winner.startedAt instanceof Date);
  // The claim moved run_after out to the lease deadline.
  assert.ok(winner.runAfter.getTime() > Date.now() + 100_000);
});

test("ten runners racing for ten jobs — every job goes to exactly one", { skip }, async () => {
  const ids = new Set<string>();
  for (let i = 0; i < 10; i += 1) {
    const { job } = await enqueue(db, { type: "fixture.echo", payload: { i } });
    ids.add(job.id);
  }

  const batches = await Promise.all(
    Array.from({ length: 10 }, (_unused, i) =>
      claim(db, { limit: 4, claimedBy: `runner-${i}` })
    )
  );

  const claimed = batches.flat().map((row) => row.id);
  assert.equal(claimed.length, 10, "every job claimed");
  assert.equal(new Set(claimed).size, 10, "and none of them twice");
  assert.deepEqual(new Set(claimed), ids);
});

test("a claimed job is invisible to the next claim until its lease expires", { skip }, async () => {
  const { job } = await enqueue(db, { type: "fixture.echo" });

  const first = await claim(db, { limit: 5, claimedBy: "runner-a" });
  assert.equal(first.length, 1);

  const second = await claim(db, { limit: 5, claimedBy: "runner-b" });
  assert.equal(second.length, 0, "still leased");

  assert.equal(await statusOf(job.id), "running");
});

/* ── 2. a dead runner's job comes back ─────────────────────────────── */

test("a job whose runner died is claimable again once the lease expires", { skip }, async () => {
  const { job } = await enqueue(db, { type: "fixture.echo", leaseSeconds: 60 });

  const [held] = await claim(db, { limit: 5, claimedBy: "runner-that-dies" });
  assert.equal(held.attempts, 1);

  // The instance is killed by a deploy here. It never reports anything, so the
  // row stays `running` with a lease that nobody is renewing.
  assert.equal((await claim(db, { limit: 5, claimedBy: "runner-b" })).length, 0);

  // Time passes. Simulated rather than waited for; the predicate is the same.
  await rewind(job.id);

  const [reclaimed] = await claim(db, { limit: 5, claimedBy: "runner-b" });
  assert.ok(reclaimed, "the lease expired and the job came back");
  assert.equal(reclaimed.id, job.id);
  assert.equal(reclaimed.claimedBy, "runner-b");
  assert.equal(reclaimed.attempts, 2, "a claim by a runner that died still counts");
  assert.equal(
    reclaimed.startedAt?.getTime(),
    held.startedAt?.getTime(),
    "started_at is the FIRST claim, so queue latency survives a retry"
  );
});

test("the runner that lost its lease cannot write the outcome", { skip }, async () => {
  const { job } = await enqueue(db, { type: "fixture.echo" });
  const [stale] = await claim(db, { limit: 1, claimedBy: "runner-a" });

  await rewind(job.id);
  const [fresh] = await claim(db, { limit: 1, claimedBy: "runner-b" });
  assert.equal(fresh.claimedBy, "runner-b");

  // The slow runner finally finishes and tries to report. Its claimed_at no
  // longer matches, so the write is refused rather than clobbering the attempt
  // that is actually in flight.
  await assert.rejects(
    () => succeed(db, stale, { from: "the stale runner" }),
    /lease on job .* was lost/
  );
  assert.equal(await statusOf(job.id), "running");

  // The runner that does hold it can.
  await succeed(db, fresh, { from: "the live runner" });
  const settled = await getJob(db, job.id);
  assert.equal(settled?.status, "succeeded");
  assert.deepEqual(settled?.result, { from: "the live runner" });
});

test("a job abandoned on its last attempt is reaped into failed, not left running", { skip }, async () => {
  const { job } = await enqueue(db, { type: "fixture.echo", maxAttempts: 1 });
  await claim(db, { limit: 1, claimedBy: "runner-that-dies" });
  await rewind(job.id);

  // The claim will not take it — no attempts left — so without the reaper it
  // would sit in `running` forever, looking busy.
  assert.equal((await claim(db, { limit: 1, claimedBy: "runner-b" })).length, 0);

  const reaped = await reapExhausted(db);
  assert.equal(reaped.length, 1);

  const settled = await getJob(db, job.id);
  assert.equal(settled?.status, "failed");
  assert.match(settled?.lastError ?? "", /abandoned/);
  assert.ok(settled?.finishedAt instanceof Date);
});

/* ── 3. retry, backoff, and a terminal state with the error intact ─── */

test("a failing job retries with backoff and ends terminal, error intact", { skip }, async () => {
  const { job } = await enqueue(db, {
    type: "fixture.fail",
    payload: { message: "the model said no" },
    maxAttempts: 3,
    leaseSeconds: 30,
  });

  const r = runner("runner-a", 1);
  const seen: Array<{ status: string; attempts: number; runAfterMs: number }> = [];

  for (let pass = 1; pass <= 3; pass += 1) {
    const report = await r.tick();
    assert.equal(report.claimed, 1, `pass ${pass} claimed`);
    assert.equal(report.failed, 1, `pass ${pass} failed`);

    const row = await getJob(db, job.id);
    assert.ok(row);
    seen.push({
      status: row.status,
      attempts: row.attempts,
      runAfterMs: row.runAfter.getTime() - Date.now(),
    });

    // Backed off, so the next tick would find nothing. Proving that before
    // rewinding is the actual assertion about backoff.
    if (pass < 3) {
      const idle = await r.tick();
      assert.equal(idle.claimed, 0, `pass ${pass} is backed off, not runnable`);
      await rewind(job.id);
    }
  }

  assert.deepEqual(
    seen.map((s) => s.status),
    ["queued", "queued", "failed"],
    "retried twice, then gave up"
  );
  assert.deepEqual(seen.map((s) => s.attempts), [1, 2, 3]);

  // The delay grows. Equal jitter means attempt 2's window (5–10s) cannot
  // overlap attempt 1's (2.5–5s), so this is a real assertion and not a flake.
  assert.ok(seen[0].runAfterMs > 2_000, `first backoff ${seen[0].runAfterMs}ms`);
  assert.ok(seen[0].runAfterMs <= 5_500);
  assert.ok(seen[1].runAfterMs > 4_500, `second backoff ${seen[1].runAfterMs}ms`);
  assert.ok(seen[1].runAfterMs <= 10_500);

  const settled = await getJob(db, job.id);
  assert.equal(settled?.status, "failed");
  assert.equal(settled?.lastError, "the model said no");
  assert.ok(settled?.lastErrorAt instanceof Date);
  assert.ok(settled?.finishedAt instanceof Date);

  // Every attempt is in the log, not just the last one.
  assert.equal(settled?.errorLog.length, 3);
  assert.deepEqual(
    settled?.errorLog.map((e) => e.attempt),
    [1, 2, 3]
  );
  assert.equal(settled?.errorLog[0].error, "the model said no");
});

test("a permanent error skips the remaining budget", { skip }, async () => {
  const registry = createRegistry();
  registry.register("fixture.hopeless", async () => {
    throw new PermanentJobError("this payload will never validate");
  });
  const r = new JobRunner({ db, registry, instanceId: "runner-a", logger: QUIET });

  const { job } = await enqueue(db, { type: "fixture.hopeless", maxAttempts: 5 });
  await r.tick();

  const settled = await getJob(db, job.id);
  assert.equal(settled?.status, "failed", "terminal on the first failure");
  assert.equal(settled?.attempts, 1, "with four attempts unspent");
  assert.equal(settled?.lastError, "PermanentJobError: this payload will never validate");
});

test("a job type with no handler fails visibly rather than retrying forever", { skip }, async () => {
  const { job } = await enqueue(db, { type: "nobody.handles_this", maxAttempts: 5 });
  await runner("runner-a").tick();

  const settled = await getJob(db, job.id);
  assert.equal(settled?.status, "failed");
  assert.equal(settled?.attempts, 1);
  assert.match(settled?.lastError ?? "", /no handler is registered/);
});

test("a flaky job succeeds on its second attempt and keeps the first error", { skip }, async () => {
  const { job } = await enqueue(db, {
    type: "fixture.flaky",
    payload: { succeedOnAttempt: 2 },
  });
  const r = runner("runner-a", 1);

  await r.tick();
  assert.equal(await statusOf(job.id), "queued");

  await rewind(job.id);
  await r.tick();

  const settled = await getJob(db, job.id);
  assert.equal(settled?.status, "succeeded");
  assert.deepEqual(settled?.result, { succeededOnAttempt: 2 });
  // The evidence that it is flaky is not deleted by the success.
  assert.match(settled?.lastError ?? "", /succeed on attempt 2/);
  assert.equal(settled?.errorLog.length, 1);
});

/* ── 4. a parent and its pieces ────────────────────────────────────── */

test("a parent whose pieces all succeed is woken, joins them, and finishes", { skip }, async () => {
  const { job } = await enqueue(db, {
    type: "fixture.fanout",
    payload: { pieces: 3 },
    revelleId,
  });
  const r = runner("runner-a", 8);

  // Wave one: the parent fans out and parks.
  const first = await r.tick();
  assert.equal(first.waiting, 1);
  assert.equal(await statusOf(job.id), "waiting");

  const pieces = await piecesOf(db, job.id);
  assert.equal(pieces.length, 3);
  assert.ok(pieces.every((p) => p.revelleId === revelleId), "pieces inherit the subject");

  // The pieces run. The last one to settle wakes the parent — no polling for a
  // finished parent anywhere in the runner.
  const second = await r.tick();
  assert.equal(second.claimed, 3);
  assert.equal(second.succeeded, 3);
  assert.equal(await statusOf(job.id), "queued", "the database woke it");

  // Wave two: the parent joins and declares itself done.
  const third = await r.tick();
  assert.equal(third.succeeded, 1);

  const settled = await getJob(db, job.id);
  assert.equal(settled?.status, "succeeded");
  assert.equal(settled?.attempts, 2, "one claim per wave");
  const joined = (settled?.result as { joined: unknown[] }).joined;
  assert.equal(joined.length, 3);
});

test("one piece fails and retries while the others finish; the parent reports honestly throughout", { skip }, async () => {
  const { job } = await enqueue(db, {
    type: "fixture.fanout",
    payload: { pieces: 4, flakyIndex: 2 },
    revelleId,
  });
  const r = runner("runner-a", 8);

  await r.tick(); // fan out
  const pieces = await piecesOf(db, job.id);
  assert.equal(pieces.length, 4);
  const flaky = pieces.find((p) => p.type === "fixture.flaky");
  assert.ok(flaky);

  let status = (await generationStatus(db, revelleId))[0];
  assert.equal(status.status, "waiting");
  assert.equal(status.piecesTotal, 4);
  assert.equal(status.piecesSucceeded, 0);
  assert.equal(status.piecesPending, 4);
  assert.ok(
    status.nextAttemptAt instanceof Date,
    "a waiting parent must not tell the page to stop polling — its pieces are due"
  );

  // Everything runs. Three succeed; the flaky one fails and backs off.
  const second = await r.tick();
  assert.equal(second.claimed, 4);
  assert.equal(second.succeeded, 3);
  assert.equal(second.failed, 1);

  status = (await generationStatus(db, revelleId))[0];
  assert.equal(status.status, "waiting", "the parent is not woken early");
  assert.equal(status.piecesSucceeded, 3, "the progress bar is honest");
  assert.equal(status.piecesPending, 1);
  assert.equal(status.piecesFailed, 0, "a piece with attempts left has not failed");
  assert.ok(
    (status.nextAttemptAt?.getTime() ?? 0) > Date.now(),
    "and the page is told when the retry is due, not that it is over"
  );

  // The failing piece is backed off; nothing else is affected by it.
  assert.equal((await r.tick()).claimed, 0);
  assert.equal(await statusOf(job.id), "waiting");

  await rewind(flaky.id);
  const third = await r.tick();
  assert.equal(third.claimed, 1);
  assert.equal(third.succeeded, 1);

  // Its success was the last one, so the database woke the parent.
  assert.equal(await statusOf(job.id), "queued");
  await r.tick();

  status = (await generationStatus(db, revelleId))[0];
  assert.equal(status.status, "succeeded");
  assert.equal(status.piecesSucceeded, 4);
  assert.equal(status.nextAttemptAt, null, "and the page can stop polling");

  const settledFlaky = await getJob(db, flaky.id);
  assert.equal(settledFlaky?.attempts, 2);
  assert.ok(settledFlaky?.lastError, "the piece kept its error even though it went on to work");
});

test("a piece that runs out of attempts fails its parent, carrying its own error up", { skip }, async () => {
  const { job } = await enqueue(db, {
    type: "fixture.fanout",
    payload: { pieces: 3, failIndex: 1 },
    revelleId,
  });
  const r = runner("runner-a", 8);

  await r.tick();
  const pieces = await piecesOf(db, job.id);
  const doomed = pieces.find((p) => p.type === "fixture.fail");
  assert.ok(doomed);

  // Run it into the ground. Its siblings finished on the first pass.
  for (let i = 0; i < 6; i += 1) {
    await r.tick();
    await rewind(doomed.id);
  }

  const settledPiece = await getJob(db, doomed.id);
  assert.equal(settledPiece?.status, "failed");

  const parent = await getJob(db, job.id);
  assert.equal(parent?.status, "failed");
  assert.match(parent?.lastError ?? "", /^piece fixture\.fail/);
  assert.match(parent?.lastError ?? "", /fixture\.fail always fails/);

  // And what the page is told.
  const status = (await generationStatus(db, revelleId))[0];
  assert.equal(status.status, "failed");
  assert.equal(status.piecesFailed, 1);
  assert.equal(status.piecesSucceeded, 2, "the work that did land is not erased");
  assert.equal(status.failedPieceType, "fixture.fail");
  assert.equal(status.pieceError, "fixture.fail always fails");
  assert.equal(status.nextAttemptAt, null);
});

test("marking waiting is safe when the pieces have already all settled", { skip }, async () => {
  // The race the `for update` inside settle_job_parent exists for, forced by
  // hand: the pieces are finished before the parent is ever marked waiting.
  const { job: parent } = await enqueue(db, { type: "fixture.fanout", revelleId });
  const [held] = await claim(db, { limit: 1, claimedBy: "runner-a" });

  const { job: piece } = await enqueue(db, {
    type: "fixture.echo",
    parentId: parent.id,
  });
  const [heldPiece] = await claim(db, { limit: 5, claimedBy: "runner-a" });
  assert.equal(heldPiece.id, piece.id);
  await succeed(db, heldPiece, { ok: true });

  // Every piece is settled and the parent is still `running`. Nothing is left
  // to fire a trigger, so if marking waiting did not check for itself the
  // parent would wait forever.
  assert.equal(await statusOf(parent.id), "running");
  assert.equal(await markWaiting(db, held), true);
  assert.equal(await statusOf(parent.id), "queued", "settled by the mark itself");
});

test("a handler that returns waiting with no pieces fails instead of parking", { skip }, async () => {
  const registry = createRegistry();
  registry.register("fixture.vacuous", async () => ({ kind: "waiting", pieces: [] }));
  const r = new JobRunner({ db, registry, instanceId: "runner-a", logger: QUIET });

  const { job } = await enqueue(db, { type: "fixture.vacuous" });
  await r.tick();

  const settled = await getJob(db, job.id);
  assert.equal(settled?.status, "failed");
  assert.match(settled?.lastError ?? "", /returned waiting but enqueued no pieces/);
});

test("the tree is two levels deep, and says so", { skip }, async () => {
  const { job: parent } = await enqueue(db, { type: "fixture.fanout" });
  const { job: piece } = await enqueue(db, {
    type: "fixture.echo",
    parentId: parent.id,
  });

  await assert.rejects(
    () => enqueue(db, { type: "fixture.echo", parentId: piece.id }),
    /is itself a piece/
  );
});

test("a piece cannot be added to a parent that has already settled", { skip }, async () => {
  const { job: parent } = await enqueue(db, { type: "fixture.echo" });
  const [held] = await claim(db, { limit: 1, claimedBy: "runner-a" });
  await succeed(db, held);

  await assert.rejects(
    () => enqueue(db, { type: "fixture.echo", parentId: parent.id }),
    /has already settled/
  );
});

/* ── 5. the reads a UI needs ───────────────────────────────────────── */

test("the status query answers done, in progress, and failed-and-why", { skip }, async () => {
  const empty = await generationStatus(db, revelleId);
  assert.deepEqual(empty, [], "nothing enqueued, nothing to report");

  const { job } = await enqueue(db, {
    type: "fixture.fanout",
    payload: { pieces: 2 },
    revelleId,
    dedupeKey: `generate:${revelleId}`,
  });

  // Queued: a page knows to keep polling and when the work is due to start.
  let [status] = await generationStatus(db, revelleId);
  assert.equal(status.jobId, job.id);
  assert.equal(status.revelleId, revelleId);
  assert.equal(status.type, "fixture.fanout");
  assert.equal(status.status, "queued");
  assert.equal(status.piecesTotal, 0);
  assert.ok(status.nextAttemptAt instanceof Date);
  assert.equal(status.startedAt, null);
  assert.equal(status.lastError, null);

  const r = runner("runner-a", 8);
  await r.tick();
  await r.tick();
  await r.tick();

  [status] = await generationStatus(db, revelleId);
  assert.equal(status.status, "succeeded");
  assert.equal(status.piecesTotal, 2);
  assert.equal(status.piecesSucceeded, 2);
  assert.equal(status.piecesFailed, 0);
  assert.equal(status.nextAttemptAt, null);
  assert.ok(status.finishedAt instanceof Date);
  assert.ok(status.startedAt instanceof Date);

  // Only root jobs are listed — the pieces are counted, not repeated as rows.
  const all = await generationStatus(db, revelleId);
  assert.equal(all.length, 1);
});

test("queue health is one row and reports a stalled queue", { skip }, async () => {
  const idle = await queueHealth(db);
  assert.deepEqual(
    { queued: idle.queued, running: idle.running, failedLastDay: idle.failedLastDay },
    { queued: 0, running: 0, failedLastDay: 0 }
  );
  assert.equal(idle.oldestRunnableAgeMs, null);

  const { job } = await enqueue(db, { type: "fixture.echo" });
  await rewind(job.id, "10 minutes");

  const stalled = await queueHealth(db);
  assert.equal(stalled.queued, 1);
  assert.ok(
    (stalled.oldestRunnableAgeMs ?? 0) > 9 * 60_000,
    "the number an alert would fire on"
  );
});

/* ── the door ──────────────────────────────────────────────────────── */

test("a dedupe key stops a double-click, and is released once the job settles", { skip }, async () => {
  const key = `generate:${revelleId}`;

  const first = await enqueue(db, { type: "fixture.echo", dedupeKey: key, revelleId });
  assert.equal(first.created, true);

  const second = await enqueue(db, { type: "fixture.echo", dedupeKey: key, revelleId });
  assert.equal(second.created, false, "the second click is not a second job");
  assert.equal(second.job.id, first.job.id);

  const [held] = await claim(db, { limit: 1, claimedBy: "runner-a" });
  await succeed(db, held);

  const later = await enqueue(db, { type: "fixture.echo", dedupeKey: key, revelleId });
  assert.equal(later.created, true, "a deliberate regeneration is not blocked");
  assert.notEqual(later.job.id, first.job.id);
});

test("cancelling a parent stops its unsettled pieces and leaves the finished ones alone", { skip }, async () => {
  const { job: parent } = await enqueue(db, {
    type: "fixture.fanout",
    payload: { pieces: 3, flakyIndex: 0 },
    revelleId,
  });
  const r = runner("runner-a", 8);
  await r.tick();
  await r.tick();

  const before = await piecesOf(db, parent.id);
  assert.equal(before.filter((p) => p.status === "succeeded").length, 2);

  const stopped = await cancel(db, parent.id, "the curator changed her mind");
  assert.equal(stopped, 2, "the parent and the one piece still going");

  assert.equal(await statusOf(parent.id), "cancelled");
  const after = await piecesOf(db, parent.id);
  assert.equal(after.filter((p) => p.status === "cancelled").length, 1);
  assert.equal(
    after.filter((p) => p.status === "succeeded").length,
    2,
    "work that landed is not rewritten"
  );

  const parentRow = await getJob(db, parent.id);
  assert.equal(parentRow?.lastError, "the curator changed her mind");
});

test("a delayed job is not runnable until its delay has passed", { skip }, async () => {
  await enqueue(db, { type: "fixture.echo", delayMs: 60_000 });
  assert.equal((await claim(db, { limit: 5, claimedBy: "runner-a" })).length, 0);
});

test("the error log keeps the last ten failures and no more", { skip }, async () => {
  const { job } = await enqueue(db, { type: "fixture.fail", maxAttempts: 40 });

  for (let i = 1; i <= 14; i += 1) {
    const [held] = await claim(db, { limit: 1, claimedBy: "runner-a" });
    await fail(db, held, `failure ${i}`, { retryDelayMs: 0 });
    await rewind(job.id);
  }

  const row = await getJob(db, job.id);
  assert.equal(row?.errorLog.length, 10);
  assert.deepEqual(
    row?.errorLog.map((e) => e.error),
    Array.from({ length: 10 }, (_unused, i) => `failure ${i + 5}`),
    "oldest first, the last ten kept"
  );
  assert.equal(row?.lastError, "failure 14");
});

/* ── the loop itself ───────────────────────────────────────────────── */

test("two runners ticking concurrently over one backlog run every job exactly once", { skip }, async () => {
  const ids: string[] = [];
  for (let i = 0; i < 12; i += 1) {
    const { job } = await enqueue(db, { type: "fixture.echo", payload: { i } });
    ids.push(job.id);
  }

  const a = runner("runner-a", 3);
  const b = runner("runner-b", 3);

  let total = 0;
  for (let pass = 0; pass < 4; pass += 1) {
    const [ra, rb] = await Promise.all([a.tick(), b.tick()]);
    total += ra.succeeded + rb.succeeded;
  }

  assert.equal(total, 12, "twelve successes, no more and no fewer");
  const { rows } = await pool.query<{ n: string }>(
    `select count(*) as n from job where status = 'succeeded' and attempts = 1`
  );
  assert.equal(Number(rows[0].n), 12, "and none of them was run twice");
});

test("start and stop are safe to call, and stop aborts what is in flight", { skip }, async () => {
  const registry = createRegistry();
  let sawAbort = false;
  registry.register("fixture.slow", async (ctx) => {
    await new Promise<void>((resolve) => {
      if (ctx.signal.aborted) {
        sawAbort = true;
        resolve();
        return;
      }
      ctx.signal.addEventListener("abort", () => {
        sawAbort = true;
        resolve();
      });
    });
    return { kind: "done" };
  });

  const r = new JobRunner({
    db,
    registry,
    instanceId: "runner-a",
    intervalMs: 20,
    logger: QUIET,
  });

  await enqueue(db, { type: "fixture.slow" });
  r.start();
  r.start(); // idempotent

  // Give the loop a couple of intervals to claim it.
  await new Promise((resolve) => setTimeout(resolve, 120));
  await r.stop();

  assert.equal(sawAbort, true, "the handler was told the runner was going away");
});
