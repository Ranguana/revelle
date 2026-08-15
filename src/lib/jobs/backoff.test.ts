/**
 * The retry arithmetic, and the error-shaping beside it.
 *
 *   npm test
 *
 * Node's own runner, no framework, no database, no network. These are the parts
 * of the queue that can be checked honestly without a server, so they are
 * checked here; everything that needs Postgres to mean anything is in
 * queue.db.test.ts, which skips unless a throwaway database is handed to it.
 */
import assert from "node:assert/strict";
import test from "node:test";

import {
  BACKOFF_BASE_MS,
  BACKOFF_CAP_MS,
  BACKOFF_FLOOR_MS,
  backoffInterval,
  backoffMs,
} from "./backoff.ts";
import { MAX_ERROR_LENGTH, errorMessage, truncateError } from "./queue.ts";
import { PermanentJobError, isTerminal } from "./types.ts";
import { createRegistry } from "./registry.ts";

/* ── backoff ───────────────────────────────────────────────────────── */

// The jitter is injected rather than sampled, so the bounds are assertions
// rather than hopes.
const lowest = () => 0;
const highest = () => 1;

test("the first retry lands within the base window", () => {
  assert.equal(backoffMs(1, lowest), BACKOFF_BASE_MS / 2);
  assert.equal(backoffMs(1, highest), BACKOFF_BASE_MS);
});

test("each attempt doubles the window", () => {
  assert.equal(backoffMs(2, lowest), 5_000);
  assert.equal(backoffMs(2, highest), 10_000);
  assert.equal(backoffMs(3, lowest), 10_000);
  assert.equal(backoffMs(3, highest), 20_000);
  assert.equal(backoffMs(4, highest), 40_000);
});

test("equal jitter means half fixed, half random — never zero", () => {
  for (let attempt = 1; attempt <= 8; attempt += 1) {
    const low = backoffMs(attempt, lowest);
    const high = backoffMs(attempt, highest);
    assert.ok(low >= BACKOFF_FLOOR_MS, `attempt ${attempt} floor`);
    assert.equal(low, Math.round(high / 2), `attempt ${attempt} is equal-jitter`);
  }
});

test("the cap holds however many attempts have failed", () => {
  for (const attempt of [10, 40, 1_000, Number.MAX_SAFE_INTEGER]) {
    const delay = backoffMs(attempt, highest);
    assert.ok(Number.isFinite(delay), `attempt ${attempt} is a number`);
    assert.equal(delay, BACKOFF_CAP_MS);
  }
});

test("a nonsense attempt number is treated as the first", () => {
  assert.equal(backoffMs(0, highest), BACKOFF_BASE_MS);
  assert.equal(backoffMs(-7, highest), BACKOFF_BASE_MS);
  assert.equal(backoffMs(1.9, highest), BACKOFF_BASE_MS);
});

test("backoffInterval speaks Postgres", () => {
  assert.equal(backoffInterval(1, highest), "5000 milliseconds");
});

/* ── the error, which is the thing someone debugs from ─────────────── */

test("errorMessage keeps the name when it says something", () => {
  assert.equal(errorMessage(new TypeError("nope")), "TypeError: nope");
  // A plain Error's name adds nothing.
  assert.equal(errorMessage(new Error("nope")), "nope");
});

test("errorMessage carries the cause, which is usually the real reason", () => {
  const err = new Error("could not write the menu", {
    cause: new Error("429 rate limited"),
  });
  assert.equal(
    errorMessage(err),
    "could not write the menu (caused by 429 rate limited)"
  );
});

test("errorMessage survives things that are not Errors", () => {
  assert.equal(errorMessage("just a string"), "just a string");
  assert.equal(errorMessage({ status: 500 }), 'non-Error thrown: {"status":500}');

  const circular: Record<string, unknown> = {};
  circular.self = circular;
  assert.match(errorMessage(circular), /could not be serialised/);
});

test("errorMessage never loses the fact that there was an error", () => {
  assert.equal(errorMessage(new Error("")), "(no message)");
});

test("a provider's HTML error page is truncated, not stored whole", () => {
  const huge = "x".repeat(MAX_ERROR_LENGTH * 3);
  const short = truncateError(huge);
  assert.ok(short.length <= MAX_ERROR_LENGTH);
  assert.match(short, /truncated/);
  // And the untruncated case is left exactly alone.
  assert.equal(truncateError("small"), "small");
});

test("PermanentJobError is distinguishable — the runner branches on it", () => {
  const err = new PermanentJobError("payload will never validate");
  assert.ok(err instanceof Error);
  assert.ok(err instanceof PermanentJobError);
  assert.equal(err.name, "PermanentJobError");
});

/* ── statuses ──────────────────────────────────────────────────────── */

test("exactly three statuses are terminal", () => {
  assert.deepEqual(
    (["queued", "running", "waiting", "succeeded", "failed", "cancelled"] as const)
      .filter(isTerminal),
    ["succeeded", "failed", "cancelled"]
  );
});

/* ── the registry ──────────────────────────────────────────────────── */

test("the registry refuses a type that is not shaped area.verb", () => {
  const registry = createRegistry();
  for (const bad of ["generate", "Revelle.generate", "revelle generate", "revelle.", ".generate"]) {
    assert.throws(
      () => registry.register(bad, async () => ({ kind: "done" })),
      /area\.verb/,
      `${bad} should be refused`
    );
  }
  registry.register("revelle.generate", async () => ({ kind: "done" }));
  assert.ok(registry.has("revelle.generate"));
});

test("the registry refuses a second registration of the same type", () => {
  const registry = createRegistry();
  registry.register("revelle.generate", async () => ({ kind: "done" }));
  assert.throws(
    () => registry.register("revelle.generate", async () => ({ kind: "done" })),
    /already registered/
  );
});

test("a bare function and a registration both register", () => {
  const registry = createRegistry();
  registry.register("a.one", async () => ({ kind: "done" }));
  registry.register("a.two", {
    handle: async () => ({ kind: "done" }),
    leaseSeconds: 600,
  });
  assert.equal(registry.get("a.one")?.leaseSeconds, undefined);
  assert.equal(registry.get("a.two")?.leaseSeconds, 600);
  assert.deepEqual(registry.types(), ["a.one", "a.two"]);
});
