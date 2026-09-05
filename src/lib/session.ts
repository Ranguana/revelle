/**
 * THE MECHANISM. One magic link, one session, two kinds of person.
 *
 * db/015 renamed the desk's tables rather than copying them, and this module
 * is the only thing that reads or writes them. There is ONE token table, ONE
 * session table and one redemption predicate, because two authentication
 * systems in a codebase is how a hole survives: each reviewer assumes the
 * other one is the real one, and a fix applied to one is not applied to both.
 *
 * ── WHAT THIS MODULE KNOWS AND DOES NOT KNOW ─────────────────────────
 *
 * It knows how to mint a token, store its digest, spend it exactly once, open
 * a session and read one back. It knows NOTHING about who is allowed to do any
 * of that. Policy — the STAFF_EMAILS allowlist, whether an applicant has been
 * accepted, what the email says — lives in src/lib/login.ts, which calls this.
 *
 * ── WHY IT IS FRAMEWORK-FREE ─────────────────────────────────────────
 *
 * No "server-only", no next/headers, no import of src/lib/db.ts, and siblings
 * are imported with an explicit .ts extension. That is the same rule
 * src/lib/jobs and src/lib/selection follow, and it exists so `node --test`
 * can run this code directly — the security properties below are worth
 * nothing if they are only asserted in prose. The database arrives as an
 * argument and the caller decides where it came from.
 *
 * ── THE PROPERTIES, STATED ───────────────────────────────────────────
 *
 *   · What is STORED is a sha256 digest. The raw token exists in exactly two
 *     places — the email, and the browser's cookie — and never in a column. A
 *     dump of either table yields nothing that can be replayed. This is the
 *     only property that makes a bearer token in an email tolerable at all.
 *   · Single use, enforced by one `update … where consumed_at is null` with a
 *     `returning`, so two clicks on the same link cannot both win. It is not a
 *     read followed by a write and must never become one.
 *   · Short lived. Fifteen minutes, checked in the same predicate.
 *   · Comparison of a stored digest against a presented one is constant time.
 *   · Signing out revokes server side. Deleting the cookie is the smaller half.
 *   · Nothing here logs a token, an address or a session id. Not at any level,
 *     not in an error path.
 */

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * The whole of the database dependency: one method, satisfied structurally by
 * a pg Pool, a pg PoolClient and a fake. Deliberately declared here rather
 * than shared with the queue's identical `Queryable` (src/lib/jobs/types.ts) —
 * they are the same shape by coincidence of pg's API, not because auth should
 * follow a change made for the background queue.
 */
export interface Db {
  query<R extends Record<string, unknown> = Record<string, unknown>>(
    text: string,
    params?: unknown[]
  ): Promise<{ rows: R[] }>;
}

/** A magic link is short lived because it arrives in a medium we do not own. */
export const SIGN_IN_TTL_MINUTES = 15;

/**
 * Absolute, not sliding. A sliding window is a session that never ends, and
 * the places these sessions live — an internal tool, and a phone in a kitchen
 * on the day of a party — are exactly where a forgotten open tab lives longest.
 */
export const SESSION_TTL_DAYS = 14;

/**
 * One cookie for both doors, because there is one session table. A member who
 * wanders to /desk gets past the proxy's cookie check and is refused by the
 * layout's real guard, which is the division of labour src/proxy.ts documents.
 *
 * It is not the desk's old `revelle_desk`: a cookie of that name holding a
 * member's session would be a lie, and the rename costs two people one sign-in.
 */
export const COOKIE = "revelle_session";

export type SubjectKind = "staff" | "member";

export type Subject = {
  kind: SubjectKind;
  /** staff.id for staff, customer.id for a member. */
  id: string;
  email: string;
  /** Display name, or null when nobody has given one. */
  name: string | null;
};

/* ── hashing ────────────────────────────────────────────────────────── */

/** sha256, hex. The stored form of every token in this system. */
export function digest(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/** 256 bits. Hex, which is URL-safe and matches the CHECK in db/011. */
export function mintToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Rejecting a malformed value early keeps a garbage cookie or a hand-typed URL
 * from becoming a database round trip on every request.
 */
export function looksLikeToken(value: string): boolean {
  return /^[0-9a-f]{64}$/.test(value);
}

/**
 * Constant-time comparison of two hex digests.
 *
 * The lookups below are by an indexed unique column, so in practice the
 * database has already decided; this is belt and braces against that ever
 * stopping being an exact match, and against a future prefix or fallback query
 * that would leak position through timing. `timingSafeEqual` throws on a
 * length mismatch, so the lengths are compared first — that comparison is not
 * secret, because the length is fixed by `looksLikeToken`.
 */
export function sameDigest(a: string, b: string): boolean {
  if (!/^[0-9a-f]+$/.test(a) || !/^[0-9a-f]+$/.test(b)) return false;
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/* ── issuing ────────────────────────────────────────────────────────── */

/**
 * Mint a link for a subject and store its digest.
 *
 * Returns the RAW token, which the caller must put in exactly one place — an
 * email — and then forget. It is never returned to a browser, never logged and
 * never written to a column.
 */
export async function issueSignInToken(
  db: Db,
  subject: Pick<Subject, "kind" | "id">,
  userAgent: string | null = null
): Promise<string> {
  const raw = mintToken();
  await db.query(
    `insert into sign_in_token
       (staff_id, customer_id, token_hash, expires_at, requested_user_agent)
     values ($1, $2, $3, now() + ($4 || ' minutes')::interval, $5)`,
    [
      subject.kind === "staff" ? subject.id : null,
      subject.kind === "member" ? subject.id : null,
      digest(raw),
      String(SIGN_IN_TTL_MINUTES),
      userAgent,
    ]
  );
  return raw;
}

/* ── spending ───────────────────────────────────────────────────────── */

export type Redemption = {
  subject: Subject;
  /** The raw session token. The caller's job is to put it in a cookie. */
  sessionToken: string;
};

/**
 * Spend a link and open a session.
 *
 * `stillAllowed` is asked AFTER the token is consumed and BEFORE the session
 * exists. A link sits in an inbox for fifteen minutes, and an address removed
 * from STAFF_EMAILS or a membership that has not been granted must bite at the
 * click rather than at expiry — so authority is re-checked here even though it
 * was checked when the link was issued.
 *
 * Consuming an unusable token is deliberate: it costs a refusal to somebody
 * who was going to be refused anyway, and the alternative leaves a live link
 * lying around after we have already decided it must not work.
 *
 * PASS A TRANSACTION for `db` in production. Every statement below is on the
 * same handle, and the caller (src/lib/auth.ts) wraps them so that a failure
 * after the consuming update cannot leave a spent token with no session.
 */
export async function redeemSignInToken(
  db: Db,
  raw: string,
  options: {
    userAgent?: string | null;
    stillAllowed: (subject: Subject) => boolean | Promise<boolean>;
  }
): Promise<Redemption | null> {
  if (!looksLikeToken(raw)) return null;

  // Single use and short lived in ONE statement. Not a select followed by an
  // update: two clicks racing on the same link must not both succeed.
  //
  // `purpose = 'sign_in'` is the third condition and it is not decoration.
  // db/063 put a second kind of link in this table — a confirmation, which
  // proves an applicant's address and opens NOTHING. Without this clause a
  // confirmation clicked at /login/[token] would be spent here and thrown
  // away, and she would be told to ask for another note she had never used.
  // Each purpose has exactly one redeemer, and this is how that is true rather
  // than merely intended.
  const consumed = await db.query<{
    staff_id: string | null;
    customer_id: string | null;
  }>(
    `update sign_in_token
        set consumed_at = now()
      where token_hash = $1
        and purpose = 'sign_in'
        and consumed_at is null
        and expires_at > now()
      returning staff_id, customer_id`,
    [digest(raw)]
  );
  if (consumed.rows.length === 0) return null;

  const row = consumed.rows[0];
  const subject = await loadSubject(db, row);
  if (!subject) return null;

  if (!(await options.stillAllowed(subject))) return null;

  const sessionToken = mintToken();
  await db.query(
    `insert into login_session
       (staff_id, customer_id, token_hash, expires_at, user_agent)
     values ($1, $2, $3, now() + ($4 || ' days')::interval, $5)`,
    [
      subject.kind === "staff" ? subject.id : null,
      subject.kind === "member" ? subject.id : null,
      digest(sessionToken),
      String(SESSION_TTL_DAYS),
      options.userAgent ?? null,
    ]
  );

  if (subject.kind === "staff") {
    await db.query(`update staff set last_seen_at = now() where id = $1`, [
      subject.id,
    ]);
  }

  return { subject, sessionToken };
}

/* ── reading ────────────────────────────────────────────────────────── */

/**
 * Who this session token belongs to, or null.
 *
 * Live means: the row exists, was not revoked, and has not expired. Authority
 * is NOT decided here — the caller re-asks the allowlist and the membership
 * question on every request, so that removing either ends the session at the
 * next click rather than in a fortnight.
 */
export async function subjectForSession(
  db: Db,
  raw: string
): Promise<Subject | null> {
  if (!looksLikeToken(raw)) return null;

  const presented = digest(raw);
  const found = await db.query<{
    staff_id: string | null;
    customer_id: string | null;
    token_hash: string;
  }>(
    `select staff_id, customer_id, token_hash
       from login_session
      where token_hash = $1
        and revoked_at is null
        and expires_at > now()`,
    [presented]
  );
  if (found.rows.length !== 1) return null;

  if (!sameDigest(found.rows[0].token_hash, presented)) return null;

  return loadSubject(db, found.rows[0]);
}

/**
 * Sign out, server side.
 *
 * `revoked_at` rather than a delete, so signing out is a fact with a time on
 * it. Clearing the cookie is the caller's other half and is the half that does
 * not matter — a copied cookie has to stop working, and only this stops it.
 */
export async function revokeSession(db: Db, raw: string): Promise<void> {
  if (!looksLikeToken(raw)) return;
  await db.query(
    `update login_session set revoked_at = now()
      where token_hash = $1 and revoked_at is null`,
    [digest(raw)]
  );
}

/** Every session a person has, anywhere. The revoke path that is not a click. */
export async function revokeAllForSubject(
  db: Db,
  subject: Pick<Subject, "kind" | "id">
): Promise<void> {
  const column = subject.kind === "staff" ? "staff_id" : "customer_id";
  await db.query(
    `update login_session set revoked_at = now()
      where ${column} = $1 and revoked_at is null`,
    [subject.id]
  );
}

/* ── the two registers ──────────────────────────────────────────────── */

/**
 * Turn a (staff_id, customer_id) pair into a person.
 *
 * db/015 constrains exactly one of them to be set, so the branch below is
 * total. The status columns are read but not judged: `staff.status` is checked
 * by the policy layer along with the allowlist, and `customer.accepted_at` is
 * checked there too, because both are authority questions and this module
 * deliberately answers none.
 */
async function loadSubject(
  db: Db,
  row: { staff_id: string | null; customer_id: string | null }
): Promise<Subject | null> {
  if (row.staff_id) {
    const found = await db.query<{ id: string; email: string; name: string }>(
      `select id, email::text as email, name from staff where id = $1`,
      [row.staff_id]
    );
    const person = found.rows[0];
    if (!person) return null;
    return {
      kind: "staff",
      id: person.id,
      email: person.email,
      name: person.name.trim().length > 0 ? person.name.trim() : null,
    };
  }

  if (row.customer_id) {
    const found = await db.query<{
      id: string;
      email: string;
      name: string | null;
    }>(`select id, email::text as email, name from customer where id = $1`, [
      row.customer_id,
    ]);
    const person = found.rows[0];
    if (!person) return null;
    const named = (person.name ?? "").trim();
    return {
      kind: "member",
      id: person.id,
      email: person.email,
      name: named.length > 0 ? named : null,
    };
  }

  return null;
}

/**
 * Where the click lands. The whole difference between the two identities is
 * this one function: same door, same mechanism, different room.
 */
export function destinationFor(subject: Subject): string {
  return subject.kind === "staff" ? "/desk" : "/portal";
}
