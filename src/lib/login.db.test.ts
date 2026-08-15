/**
 * The door, against a real Postgres.
 *
 *   createdb revelle_auth && npm run migrate      # against that database
 *   AUTH_TEST_DATABASE_URL=postgres://…/revelle_auth npm test
 *
 * SKIPPED unless AUTH_TEST_DATABASE_URL is set, so `npm test` stays a
 * no-dependency run — the same arrangement as src/lib/jobs/queue.db.test.ts,
 * and for the same reason. It has to be a separate variable from DATABASE_URL:
 * these tests truncate tables, and pointing them at anything that matters
 * would be a very bad afternoon.
 *
 * ── WHY THESE PARTICULAR TESTS ───────────────────────────────────────
 *
 * Every claim the feature makes about itself, and nothing else. Each of these
 * is a property that is invisible from the screen, cannot be checked by
 * reading, and would fail silently in production:
 *
 *   1. a token that has expired does not work
 *   2. a token that has been used does not work a second time
 *   3. a token nobody issued does not work
 *   4. an address on file and an address that is not produce the SAME words
 *   5. the throttle trips, and keeps counting while it is tripped
 *   6. a curator lands at the desk and a member lands at her portal
 *   7. an applicant is not a member: no link is minted and none is sent
 *   8. what is in the database is a digest, not a token
 *   9. signing out kills the session server side, not just the cookie
 *  10. losing the allowlist ends a curator's session at her next click
 *
 * Time is never waited for. Where a test needs an expiry to have passed it
 * rewinds the row's clock, which is instant and is a more honest test — it
 * exercises the same predicate a real fifteen minutes would.
 *
 * No email leaves. `deliver` is a collector, which is the whole reason
 * src/lib/login.ts takes one.
 */
import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import test, { after, before, beforeEach } from "node:test";

import pg from "pg";

import {
  answerFor,
  redeemLink,
  requestLink,
  type Deliver,
  type LinkOutcome,
  type Mail,
} from "./login.ts";
import { REQUEST_BY_EMAIL } from "./rate-limit.ts";
import { revokeSession, subjectForSession, type Db } from "./session.ts";

const URL = process.env.AUTH_TEST_DATABASE_URL;
const skip = URL ? false : "set AUTH_TEST_DATABASE_URL to run these";

const CURATOR = "curator@revelle.test";
const MEMBER = "member@revelle.test";
const APPLICANT = "applicant@revelle.test";
const NOBODY = "nobody@revelle.test";

let pool: pg.Pool;
let sent: Mail[];

/** The mailer that never sends. */
const collect: Deliver = async (mail) => {
  sent.push(mail);
};

/** One that fails, for the test that a broken mailer changes no answer. */
const explode: Deliver = async () => {
  throw new Error("resend is on fire");
};

const CONTEXT = { ip: "203.0.113.9", userAgent: "node:test" };

before(async () => {
  if (!URL) return;
  pool = new pg.Pool({ connectionString: URL, max: 8 });
  process.env.APP_URL = "https://revelle.test";
  process.env.STAFF_EMAILS = ` ${CURATOR.toUpperCase()} `;
});

after(async () => {
  if (!URL) return;
  await pool.end();
});

beforeEach(async () => {
  if (!URL) return;
  process.env.STAFF_EMAILS = ` ${CURATOR.toUpperCase()} `;
  sent = [];
  await pool.query(`truncate sign_in_token, login_session, sign_in_attempt`);
  await pool.query(`delete from staff where email = $1`, [CURATOR]);
  await pool.query(`delete from customer where email = any($1::citext[])`, [
    [MEMBER, APPLICANT, NOBODY],
  ]);
  await pool.query(
    `insert into customer (email, name, accepted_at) values ($1, $2, now())`,
    [MEMBER, "Margot"]
  );
  // Applied, never accepted. accepted_at stays null: db/015.
  await pool.query(`insert into customer (email) values ($1)`, [APPLICANT]);
});

/* ── helpers ────────────────────────────────────────────────────────── */

/** Ask, and hand back both the outcome and whatever would have been mailed. */
async function ask(
  email: string,
  deliver: Deliver = collect,
  ip: string | null = CONTEXT.ip
): Promise<LinkOutcome> {
  return requestLink(pool, { email, ip, userAgent: CONTEXT.userAgent }, deliver);
}

/** The token out of the last message. Never logged, never stored anywhere. */
function tokenFromLastMail(): string {
  const link = sent[sent.length - 1]?.text.match(
    /https:\/\/revelle\.test\/login\/([0-9a-f]{64})/
  );
  assert.ok(link, "the last message carried no sign-in link");
  return link[1];
}

/**
 * Click, the way production clicks: inside a transaction, so the consuming
 * update and the session insert are one fact.
 */
async function click(raw: string) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const outcome = await redeemLink(client as unknown as Db, raw, CONTEXT);
    await client.query("commit");
    return outcome;
  } catch (err) {
    await client.query("rollback");
    throw err;
  } finally {
    client.release();
  }
}

/* ── 1. expired ─────────────────────────────────────────────────────── */

test("a token that has expired does not work", { skip }, async () => {
  await ask(MEMBER);
  const token = tokenFromLastMail();

  // Rewind the link's clock rather than wait fifteen minutes. This exercises
  // the same `expires_at > now()` predicate a real expiry would.
  await pool.query(
    `update sign_in_token set expires_at = now() - interval '1 second'`
  );

  const outcome = await click(token);
  assert.equal(outcome.ok, false);
  assert.equal(outcome.ok === false && outcome.reason, "no");

  // And it opened nothing.
  const sessions = await pool.query(`select count(*)::int as n from login_session`);
  assert.equal(sessions.rows[0].n, 0);
});

/* ── 2. reused ──────────────────────────────────────────────────────── */

test("a token works exactly once", { skip }, async () => {
  await ask(MEMBER);
  const token = tokenFromLastMail();

  const first = await click(token);
  assert.equal(first.ok, true);

  const second = await click(token);
  assert.equal(second.ok, false);
  assert.equal(second.ok === false && second.reason, "no");

  // One click, one session. The second must not have opened another.
  const sessions = await pool.query(`select count(*)::int as n from login_session`);
  assert.equal(sessions.rows[0].n, 1);
});

/* ── 3. wrong ───────────────────────────────────────────────────────── */

test("a token nobody issued does not work", { skip }, async () => {
  await ask(MEMBER);
  const real = tokenFromLastMail();

  // Right shape, never minted.
  const invented = randomBytes(32).toString("hex");
  assert.notEqual(invented, real);
  assert.equal((await click(invented)).ok, false);

  // Wrong shape, including the digest of a real token — which is what an
  // attacker with a database dump would actually hold.
  const digestOfReal = createHash("sha256").update(real).digest("hex");
  assert.equal((await click(digestOfReal)).ok, false);
  assert.equal((await click("")).ok, false);
  assert.equal((await click("../../etc/passwd")).ok, false);
  assert.equal((await click(real.toUpperCase())).ok, false);

  // The real one still works afterwards: a wrong guess must not burn it.
  assert.equal((await click(real)).ok, true);
});

/* ── 4. the answer is the same for everybody ────────────────────────── */

test(
  "an address on file and one that is not produce identical words",
  { skip },
  async () => {
    const member = answerFor(await ask(MEMBER));
    const applicant = answerFor(await ask(APPLICANT));
    const curator = answerFor(await ask(CURATOR));
    const nobody = answerFor(await ask(NOBODY));

    assert.deepEqual(member, nobody);
    assert.deepEqual(applicant, nobody);
    assert.deepEqual(curator, nobody);

    // Not vacuously equal because every branch returns nothing.
    assert.ok(nobody.message.length > 0);
    assert.equal(nobody.asked, true);

    // And the same when the mailer is broken. "The link could not be sent" is
    // only ever said about an address we tried to send to, which is the same
    // as saying she is on file.
    assert.deepEqual(answerFor(await ask(MEMBER, explode)), nobody);
    assert.deepEqual(answerFor(await ask(NOBODY, explode)), nobody);
  }
);

test("nothing is mailed to an address nobody has heard of", { skip }, async () => {
  await ask(NOBODY);
  assert.equal(sent.length, 0);

  const tokens = await pool.query(`select count(*)::int as n from sign_in_token`);
  assert.equal(tokens.rows[0].n, 0);
});

/* ── 5. the throttle ────────────────────────────────────────────────── */

test("the throttle trips on one address, and stays tripped", { skip }, async () => {
  const allowed: boolean[] = [];
  for (let i = 0; i < REQUEST_BY_EMAIL.max + 2; i += 1) {
    // A different IP each time, so it is unambiguously the address limit that
    // trips and not the coarser one beside it.
    allowed.push((await ask(MEMBER, collect, `198.51.100.${i}`)).ok);
  }

  assert.deepEqual(
    allowed,
    [...Array(REQUEST_BY_EMAIL.max).fill(true), false, false],
    "the first max requests are allowed and everything after is refused"
  );

  const last = await ask(MEMBER, collect, "198.51.100.200");
  assert.equal(last.ok, false);
  assert.equal(last.ok === false && last.reason, "rate_limited");

  // Refused requests still count, so hammering cannot reset the window; and no
  // message went out for any of them.
  assert.equal(sent.length, REQUEST_BY_EMAIL.max);

  // A different address is unaffected — the limit is per person, not global.
  assert.equal((await ask(APPLICANT, collect, "198.51.100.201")).ok, true);
});

test("the throttle counts an address nobody has heard of", { skip }, async () => {
  // If only known addresses were counted, never being throttled would itself
  // be the answer to "is she on file".
  const outcomes: boolean[] = [];
  for (let i = 0; i < REQUEST_BY_EMAIL.max + 1; i += 1) {
    outcomes.push((await ask(NOBODY, collect, `198.51.100.${i}`)).ok);
  }
  assert.equal(outcomes[outcomes.length - 1], false);
});

/* ── 6. two identities, two rooms ───────────────────────────────────── */

test("a curator lands at the desk, a member at her portal", { skip }, async () => {
  const curatorAsked = await ask(CURATOR);
  assert.equal(curatorAsked.ok === true && curatorAsked.issued, "staff");
  const curatorClick = await click(tokenFromLastMail());
  assert.equal(curatorClick.ok, true);
  assert.equal(curatorClick.ok === true && curatorClick.destination, "/desk");
  assert.equal(curatorClick.ok === true && curatorClick.subject.kind, "staff");

  const memberAsked = await ask(MEMBER, collect, "198.51.100.7");
  assert.equal(memberAsked.ok === true && memberAsked.issued, "member");
  const memberClick = await click(tokenFromLastMail());
  assert.equal(memberClick.ok, true);
  assert.equal(memberClick.ok === true && memberClick.destination, "/portal");
  assert.equal(memberClick.ok === true && memberClick.subject.kind, "member");

  // The same allowlist decides both, and it is read case- and space-insensitively.
  assert.equal(sent[0].subject, "Your link to the desk");
  assert.equal(sent[1].subject, "Your way in");
});

/* ── 7. an applicant is not a member ────────────────────────────────── */

test("an applicant gets no link and no portal", { skip }, async () => {
  const outcome = await ask(APPLICANT);
  assert.equal(outcome.ok === true && outcome.issued, "applicant");

  // She hears something, because silence reads as a broken door.
  assert.equal(sent.length, 1);
  assert.equal(sent[0].subject, "Your application");
  // But it carries no way in, and none was minted.
  assert.equal(/https?:\/\//.test(sent[0].text), false);
  const tokens = await pool.query(`select count(*)::int as n from sign_in_token`);
  assert.equal(tokens.rows[0].n, 0);
});

test("accepting an applicant is what gives her a portal", { skip }, async () => {
  await pool.query(`update customer set accepted_at = now() where email = $1`, [
    APPLICANT,
  ]);
  const outcome = await ask(APPLICANT);
  assert.equal(outcome.ok === true && outcome.issued, "member");
  const clicked = await click(tokenFromLastMail());
  assert.equal(clicked.ok === true && clicked.destination, "/portal");
});

/* ── 8. what is actually stored ─────────────────────────────────────── */

test("the database holds a digest, never a token", { skip }, async () => {
  await ask(MEMBER);
  const token = tokenFromLastMail();
  const clicked = await click(token);
  assert.equal(clicked.ok, true);
  const session = clicked.ok === true ? clicked.sessionToken : "";

  const rows = await pool.query<{ token_hash: string }>(
    `select token_hash from sign_in_token
     union all
     select token_hash from login_session`
  );
  assert.equal(rows.rows.length, 2);

  for (const row of rows.rows) {
    assert.notEqual(row.token_hash, token);
    assert.notEqual(row.token_hash, session);
    assert.match(row.token_hash, /^[0-9a-f]{64}$/);
  }

  // A dump is a set of digests of the two live secrets, and nothing that can
  // be pasted into a browser.
  const stored = rows.rows.map((r) => r.token_hash).sort();
  const expected = [token, session]
    .map((raw) => createHash("sha256").update(raw).digest("hex"))
    .sort();
  assert.deepEqual(stored, expected);
});

/* ── 9. leaving ─────────────────────────────────────────────────────── */

test("signing out kills the session server side", { skip }, async () => {
  await ask(MEMBER);
  const clicked = await click(tokenFromLastMail());
  assert.equal(clicked.ok, true);
  const session = clicked.ok === true ? clicked.sessionToken : "";

  assert.ok(await subjectForSession(pool, session), "the session should be live");

  await revokeSession(pool, session);

  // The cookie may still be in a browser, or copied into a script. It does not
  // matter: the row is what decides.
  assert.equal(await subjectForSession(pool, session), null);

  const row = await pool.query<{ revoked: boolean }>(
    `select revoked_at is not null as revoked from login_session`
  );
  assert.equal(row.rows[0].revoked, true, "revoked, not deleted");
});

/* ── 10. authority is re-read, not remembered ───────────────────────── */

test("losing the allowlist ends a curator's session", { skip }, async () => {
  await ask(CURATOR);
  const token = tokenFromLastMail();

  // Removed from STAFF_EMAILS while her link sits in her inbox.
  process.env.STAFF_EMAILS = "someone.else@revelle.test";

  const clicked = await click(token);
  assert.equal(clicked.ok, false, "the link must stop working immediately");

  // And an allowlist that is unset closes the desk entirely — fail closed.
  process.env.STAFF_EMAILS = "";
  const outcome = await ask(CURATOR, collect, "198.51.100.50");
  assert.equal(outcome.ok === true && outcome.issued, "none");
});
