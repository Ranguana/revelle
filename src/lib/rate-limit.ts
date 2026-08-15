/**
 * THE THROTTLE.
 *
 * A sign-in endpoint that is not rate limited is a mail cannon. An address is
 * the whole input; the message is sent by us, from our domain, at our cost,
 * and the person buried under it is a customer. It is also the only remaining
 * way to probe this door at any useful rate, since the response says nothing.
 *
 * The table is db/015. Read the comment there for why the counter is in
 * Postgres (Render runs more than one instance, so a counter in process memory
 * silently multiplies every limit by the instance count) and why the key is
 * stored as a digest (this table must not become a list of everyone who has
 * ever tried to sign in, including people who are not customers).
 *
 * Framework-free for the same reason as src/lib/session.ts: `node --test` has
 * to be able to trip it, and a limit nobody has watched trip is a limit nobody
 * knows the sign of.
 */

import { createHash, randomInt } from "node:crypto";

import type { Db } from "./session.ts";

export type Limit = {
  /** Matches the CHECK on sign_in_attempt.bucket. */
  bucket: string;
  /** Attempts allowed inside the window, inclusive. */
  max: number;
  windowSeconds: number;
};

/**
 * ── THE NUMBERS, AND WHY ─────────────────────────────────────────────
 *
 * By address, three in fifteen minutes. A person who did not get the mail asks
 * again, and then looks in her spam folder; a fourth in the same quarter hour
 * is not someone signing in. This is the limit that actually protects a
 * customer's inbox and our sending reputation, because it is the only one an
 * attacker cannot sidestep by moving.
 *
 * By IP, twelve in fifteen minutes — four addresses' worth. Higher because an
 * office, a household and a phone network share one, and locking out a
 * building to slow down one script is the wrong trade. It is a coarse net for
 * someone walking a list of addresses, and nothing finer.
 *
 * Redemption by IP, thirty in fifteen minutes. Guessing a 256-bit token is not
 * a threat anyone can mount, so this exists to stop a loop hammering the
 * database, not to protect the token.
 */
export const REQUEST_BY_EMAIL: Limit = {
  bucket: "request_email",
  max: 3,
  windowSeconds: 15 * 60,
};

export const REQUEST_BY_IP: Limit = {
  bucket: "request_ip",
  max: 12,
  windowSeconds: 15 * 60,
};

export const REDEEM_BY_IP: Limit = {
  bucket: "redeem_ip",
  max: 30,
  windowSeconds: 15 * 60,
};

/**
 * ── THE APPLICATION ──────────────────────────────────────────────────
 *
 * POST /api/quiz was the last unauthenticated, unthrottled write in the
 * product, and it is a heavier one than a sign-in: it inserts a customer, a
 * taste profile and an append-only response, sends mail on our quota, and puts
 * a row in front of a curator. A script pointed at it fills the queue with
 * fiction and burns the mail allowance, and the curators cannot tell the
 * fiction from the customers by looking.
 *
 * By address, three an hour. Applying is a considered thing done once; the
 * second and third exist for someone who hit an error and tried again. Note
 * that a genuine retry of the SAME submission does not reach here as a new
 * attempt — the submission key replays and returns the original id — so this
 * limit only counts genuinely new applications.
 *
 * By IP, eight an hour. Higher because a household, an office and a phone
 * network share one, and locking out a building to slow one script is the
 * wrong trade. Coarse on purpose: the address limit is the one doing the real
 * work, exactly as it is for sign-in.
 *
 * ── ON THE TABLE'S NAME ──────────────────────────────────────────────
 *
 * These counters live in `sign_in_attempt`, whose name is now too narrow. That
 * is a real wart and the honest fix is to rename the table, which is a
 * migration — deliberately NOT done here, because several agents are writing
 * migrations concurrently and a rename landing mid-flight is how a deploy
 * breaks. Reusing the mechanism rather than building a second throttle is the
 * decision that matters; the name is owed and recorded.
 */
export const APPLY_BY_EMAIL: Limit = {
  bucket: "apply_email",
  max: 3,
  windowSeconds: 60 * 60,
};

export const APPLY_BY_IP: Limit = {
  bucket: "apply_ip",
  max: 8,
  windowSeconds: 60 * 60,
};

/** Longest window in use. Anything older than this is swept. */
const KEEP_SECONDS = 60 * 60;

export type Verdict = {
  allowed: boolean;
  /** How long until the oldest attempt in the window falls out of it. */
  retryAfterSeconds: number;
};

/**
 * Record this attempt and say whether it is allowed.
 *
 * The attempt is recorded FIRST, unconditionally, and then counted. That order
 * matters twice over: a refused attempt still counts against the limit (so
 * hammering a limited key cannot reset it by being refused), and the count is
 * taken from the same rows a concurrent request would see, so two requests
 * racing at the boundary both count each other.
 *
 * A null key means the caller could not identify the client — an absent
 * x-forwarded-for. It is allowed through rather than refused: the address
 * limit is the one that protects the mail quota, and refusing everyone whose
 * proxy header is missing would close the door on a misconfiguration rather
 * than on an attack.
 */
export async function recordAttempt(
  db: Db,
  limit: Limit,
  key: string | null
): Promise<Verdict> {
  if (key === null) return { allowed: true, retryAfterSeconds: 0 };

  await sweep(db);

  const hash = keyDigest(limit.bucket, key);
  await db.query(
    `insert into sign_in_attempt (bucket, key_hash) values ($1, $2)`,
    [limit.bucket, hash]
  );

  const counted = await db.query<{ used: string; oldest: Date | null }>(
    `select count(*)::text as used, min(created_at) as oldest
       from sign_in_attempt
      where bucket = $1
        and key_hash = $2
        and created_at > now() - ($3 || ' seconds')::interval`,
    [limit.bucket, hash, String(limit.windowSeconds)]
  );

  const used = Number(counted.rows[0]?.used ?? "0");
  if (used <= limit.max) return { allowed: true, retryAfterSeconds: 0 };

  const oldest = counted.rows[0]?.oldest;
  const elapsed = oldest ? (Date.now() - new Date(oldest).getTime()) / 1000 : 0;
  const wait = Math.max(1, Math.ceil(limit.windowSeconds - elapsed));
  return { allowed: false, retryAfterSeconds: wait };
}

/**
 * The digest that goes in the column.
 *
 * Salted with the bucket so the same address in two buckets is two values, and
 * so a rainbow table built for one is useless against the other. It is not a
 * strong protection on its own — an address can be guessed and hashed — which
 * is why `sweep` matters as much as this does: what is not needed is deleted
 * rather than kept, and the whole exposure is an hour wide.
 */
function keyDigest(bucket: string, key: string): string {
  return createHash("sha256")
    .update(`${bucket}:${key.trim().toLowerCase()}`)
    .digest("hex");
}

/**
 * Drop attempts older than any window in use.
 *
 * One request in twenty, rather than every time. The table is small and the
 * index is on created_at, so the delete is cheap — but a delete on every
 * sign-in is write amplification and bloat on the common path for no benefit,
 * and a request that pays for the sweep is not the request that needed it.
 *
 * A background job (db/008) would be the tidier home for this. It is here
 * because a throttle that depends on a queue being healthy is a throttle that
 * stops working on exactly the bad day it is for.
 */
async function sweep(db: Db): Promise<void> {
  if (randomInt(20) !== 0) return;
  await db.query(
    `delete from sign_in_attempt
      where created_at < now() - ($1 || ' seconds')::interval`,
    [String(KEEP_SECONDS)]
  );
}

/**
 * The client's address, from the proxy header, or null.
 *
 * THE LAST entry, not the first. A client may send whatever
 * x-forwarded-for it likes and Render's proxy appends the address it actually
 * saw, so the last hop is the only one that is not forgeable. If this service
 * ever sits behind two proxies, this function is wrong and has to learn how
 * many to trust — which is why the address limit above is deliberately the
 * coarse one and the per-address limit is the one doing the real work.
 */
export function clientAddress(forwardedFor: string | null): string | null {
  if (!forwardedFor) return null;
  const hops = forwardedFor
    .split(",")
    .map((hop) => hop.trim())
    .filter((hop) => hop.length > 0);
  return hops.length > 0 ? hops[hops.length - 1] : null;
}
