/**
 * How long to wait before trying again.
 *
 * One function, no state, no database — the same reason src/lib/selection/
 * keeps its arithmetic out of SQL. An argument about whether the queue gives
 * up too fast should be an argument with this file and its test, not with a
 * `case` expression buried in an UPDATE.
 *
 * ── WHY EXPONENTIAL, AND WHY JITTERED ────────────────────────────────
 *
 * Everything this queue will retry against is a shared remote service: a
 * language-model API, Resend, Spotify. The failures worth retrying are almost
 * all correlated — a rate limit, a provider incident, a network partition —
 * which means every piece of every Revelle in flight fails at the same instant
 * and, without jitter, retries at the same instant. Retrying in lockstep is how
 * a brief provider wobble becomes a self-inflicted thundering herd that keeps
 * the provider down.
 *
 * The scheme is AWS's "equal jitter" (Marc Brooker, *Exponential Backoff and
 * Jitter*): half the delay fixed, half random. Full jitter spreads slightly
 * better but can retry almost immediately, which reads as a bug when you are
 * watching a log; equal jitter keeps the doubling legible while still smearing
 * a synchronised herd across a window.
 *
 * ── THE NUMBERS, AND WHAT THEY ADD UP TO ─────────────────────────────
 *
 * With the defaults and max_attempts = 5, a job that keeps failing is given up
 * on after roughly 2½–5 minutes:
 *
 *   attempt 1 fails ->  2.5–5s
 *   attempt 2 fails ->  5–10s
 *   attempt 3 fails -> 10–20s
 *   attempt 4 fails -> 20–40s
 *   attempt 5 fails -> terminal
 *
 * That is deliberately short. A woman is on a page waiting for this; an hour of
 * patient retrying is worse for her than a visible failure a curator can see
 * and act on, and the cap exists for the provider-incident case where the
 * queue drains slowly rather than not at all.
 */

/** First retry lands here, before jitter. */
export const BACKOFF_BASE_MS = 5_000;

/** No single wait is longer than this, however many attempts have failed. */
export const BACKOFF_CAP_MS = 300_000;

/** Never retry sooner than this, whatever the jitter rolls. */
export const BACKOFF_FLOOR_MS = 1_000;

/**
 * Milliseconds to wait after `attempt` has failed.
 *
 * `attempt` is 1-based and is the value of job.attempts AFTER the claim that
 * failed — the first failure is attempt 1, and gets the base delay.
 *
 * `random` is injected so the test can assert the bounds exactly rather than
 * assert them loosely a hundred times and hope.
 */
export function backoffMs(
  attempt: number,
  random: () => number = Math.random
): number {
  const n = Math.max(1, Math.floor(attempt));

  // Math.min BEFORE the shift, so a large attempt count cannot overflow into
  // Infinity on the way to being capped.
  const exponent = Math.min(n - 1, 30);
  const uncapped = BACKOFF_BASE_MS * 2 ** exponent;
  const capped = Math.min(uncapped, BACKOFF_CAP_MS);

  const half = capped / 2;
  const jittered = half + random() * half;

  return Math.max(BACKOFF_FLOOR_MS, Math.round(jittered));
}

/**
 * The same delay as a Postgres interval literal, which is how it reaches the
 * database. Milliseconds rather than seconds because a floor of one second and
 * a jitter window measured in seconds would quantise the spread away.
 */
export function backoffInterval(
  attempt: number,
  random: () => number = Math.random
): string {
  return `${backoffMs(attempt, random)} milliseconds`;
}
