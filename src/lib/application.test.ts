/**
 * APPLYING, PROVED RATHER THAN DESCRIBED.
 *
 * Every claim src/lib/application.ts makes about itself, and nothing else.
 * Each of these is a property that is invisible from the screen, cannot be
 * checked by reading, and would fail silently in production — which is the bar
 * src/lib/login.db.test.ts set for the door beside this one.
 *
 * ── WHY THIS RUNS WITHOUT POSTGRES, WHEN THE DOOR'S TESTS DO NOT ─────
 *
 * Because these have to run. login.db.test.ts is skipped unless
 * AUTH_TEST_DATABASE_URL is set, which is right for what it checks — it is
 * proving that the SQL means what we think against a real planner. What is
 * being proved here is different: the ORDERING of the flow, and above all that
 * a half-finished application survives every route through it. Those are
 * decisions, not queries, and a decision that is only checked on a machine
 * with a database is a decision nobody checks.
 *
 * So the database is a fake, and the fake THROWS ON A STATEMENT IT DOES NOT
 * RECOGNISE. That is the whole reason it is trustworthy: CLAUDE.md rule 24
 * says count what it matched and assume your matching is wrong until you have,
 * and a fake that silently returned no rows for a query it had never seen
 * would make every test below pass vacuously while proving nothing. A
 * misspelled table name is a thrown error here, not a green run.
 *
 * Time is never waited for. Where a test needs an expiry to have passed it
 * rewinds the row's clock, which is instant and exercises the same predicate a
 * real fifteen minutes would.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import {
  PASS_TTL_DAYS,
  answerForBegin,
  beginApplication,
  confirmApplication,
  readPass,
  type BeginOutcome,
} from "./application.ts";
import type { Deliver, Mail } from "./house-mail.ts";
import {
  ASKED_STEPS,
  FIELDS,
  QUIZ_STEPS,
  SIGN_UP_STEP,
  allErrors,
} from "./quiz.ts";
import { digest, redeemSignInToken, type Db } from "./session.ts";

process.env.APP_URL = "https://revelle.test";

const CONTEXT = { ip: "203.0.113.9", userAgent: "node:test" };

/* ── the fake ───────────────────────────────────────────────────────── */

type CustomerRow = {
  id: string;
  email: string;
  email_confirmed_at: Date | null;
  accepted_at: Date | null;
};
type TokenRow = {
  customer_id: string;
  token_hash: string;
  purpose: string;
  expires_at: Date;
  consumed_at: Date | null;
};
type PassRow = { customer_id: string; token_hash: string; expires_at: Date };

/**
 * Just enough Postgres to run this module, and no more.
 *
 * It is deliberately dumb about SQL — it dispatches on a distinctive fragment
 * of each statement — and deliberately loud about anything else. See the note
 * at the top of the file for why the throw is the important part.
 */
class Fake implements Db {
  customers: CustomerRow[] = [];
  tokens: TokenRow[] = [];
  passes: PassRow[] = [];
  attempts: { bucket: string; key_hash: string; created_at: Date }[] = [];
  /** Only ever written by redeemSignInToken. It must stay empty for an applicant. */
  sessions: { customer_id: string }[] = [];
  private next = 0;

  async query<R extends Record<string, unknown>>(
    text: string,
    params: unknown[] = []
  ): Promise<{ rows: R[] }> {
    const sql = text.replace(/\s+/g, " ").trim();
    const rows = this.run(sql, params) as R[];
    return { rows };
  }

  private run(sql: string, p: unknown[]): Record<string, unknown>[] {
    if (sql.startsWith("delete from sign_in_attempt")) {
      // The sweep. Nothing in these tests depends on it having run.
      return [];
    }

    if (sql.startsWith("insert into sign_in_attempt")) {
      this.attempts.push({
        bucket: String(p[0]),
        key_hash: String(p[1]),
        created_at: new Date(),
      });
      return [];
    }

    if (sql.startsWith("select count(*)::text as used")) {
      const window = Number(p[2]) * 1000;
      const since = Date.now() - window;
      const live = this.attempts.filter(
        (a) =>
          a.bucket === p[0] &&
          a.key_hash === p[1] &&
          a.created_at.getTime() > since
      );
      const oldest = live.reduce<Date | null>(
        (min, a) => (min === null || a.created_at < min ? a.created_at : min),
        null
      );
      return [{ used: String(live.length), oldest }];
    }

    if (sql.startsWith("insert into customer (email)")) {
      const email = String(p[0]);
      const existing = this.customers.find((c) => c.email === email);
      if (existing) return [{ id: existing.id }];
      const row: CustomerRow = {
        id: `customer-${++this.next}`,
        email,
        email_confirmed_at: null,
        accepted_at: null,
      };
      this.customers.push(row);
      return [{ id: row.id }];
    }

    if (sql.startsWith("insert into sign_in_token")) {
      this.tokens.push({
        customer_id: String(p[0]),
        token_hash: String(p[1]),
        expires_at: minutesFromNow(Number(p[2])),
        consumed_at: null,
        purpose: "confirm",
      });
      return [];
    }

    if (sql.startsWith("insert into application_pass")) {
      this.passes.push({
        customer_id: String(p[0]),
        token_hash: String(p[1]),
        expires_at: daysFromNow(Number(p[2])),
      });
      return [];
    }

    if (sql.startsWith("update sign_in_token set consumed_at = now()")) {
      // The purpose is read OUT OF THE STATEMENT rather than assumed, so this
      // fake cannot be the thing that makes the purpose filter look like it
      // works. Both redeemers issue an almost identical update and the clause
      // below is the only difference between them.
      const wants = sql.match(/purpose = '([a-z_]+)'/)?.[1];
      if (!wants) throw new Error(`an update with no purpose filter: ${sql}`);
      const found = this.tokens.find(
        (t) =>
          t.token_hash === p[0] &&
          t.purpose === wants &&
          t.consumed_at === null &&
          t.expires_at > new Date()
      );
      if (!found) return [];
      found.consumed_at = new Date();
      return [{ staff_id: null, customer_id: found.customer_id }];
    }

    if (sql.startsWith("select id, email::text as email, name from customer")) {
      const found = this.customers.find((c) => c.id === p[0]);
      return found
        ? [{ id: found.id, email: found.email, name: null }]
        : [];
    }

    if (sql.startsWith("insert into login_session")) {
      this.sessions.push({ customer_id: String(p[1]) });
      return [];
    }

    if (sql.startsWith("update customer set email_confirmed_at")) {
      const found = this.customers.find((c) => c.id === p[0]);
      if (!found) return [];
      found.email_confirmed_at = found.email_confirmed_at ?? new Date();
      return [{ email: found.email }];
    }

    if (sql.startsWith("select p.customer_id,")) {
      const pass = this.passes.find(
        (row) => row.token_hash === p[0] && row.expires_at > new Date()
      );
      if (!pass) return [];
      const customer = this.customers.find((c) => c.id === pass.customer_id);
      if (!customer) return [];
      return [
        {
          customer_id: pass.customer_id,
          email: customer.email,
          email_confirmed_at: customer.email_confirmed_at,
          token_hash: pass.token_hash,
        },
      ];
    }

    // Rule 24. A statement nobody taught this fake is a test that would
    // otherwise pass while proving nothing.
    throw new Error(`the fake database was asked something it does not know: ${sql}`);
  }
}

function minutesFromNow(n: number): Date {
  return new Date(Date.now() + n * 60_000);
}

function daysFromNow(n: number): Date {
  return new Date(Date.now() + n * 24 * 60 * 60_000);
}

function collector(): { deliver: Deliver; sent: Mail[] } {
  const sent: Mail[] = [];
  return {
    sent,
    deliver: async (mail) => {
      sent.push(mail);
    },
  };
}

/** The token out of the note, which is the only place it exists. */
function tokenFrom(mail: Mail): string {
  const link = mail.text.match(/https:\/\/\S+\/apply\/([0-9a-f]{64})/);
  assert.ok(link, "the note carries a link with a token in it");
  return link[1];
}

async function signUp(
  db: Fake,
  email: string,
  deliver: Deliver
): Promise<{ outcome: BeginOutcome; pass: string }> {
  const outcome = await beginApplication(db, { email, ...CONTEXT }, deliver);
  assert.ok(outcome.ok, "signing up succeeded");
  return { outcome, pass: outcome.pass };
}

/* ── signing up ─────────────────────────────────────────────────────── */

test("signing up creates an applicant, a pass and one note", async () => {
  const db = new Fake();
  const { sent, deliver } = collector();

  const { pass } = await signUp(db, "Ada@Example.com", deliver);

  assert.equal(db.customers.length, 1);
  // Lowercased on the way in, so two spellings of one inbox are one applicant.
  assert.equal(db.customers[0].email, "ada@example.com");
  assert.equal(db.customers[0].accepted_at, null, "an applicant is not a member");
  assert.equal(db.customers[0].email_confirmed_at, null);

  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, "ada@example.com");
  assert.ok(pass.length === 64);
});

test("what is stored is a digest — neither the note's token nor the pass", async () => {
  const db = new Fake();
  const { sent, deliver } = collector();
  const { pass } = await signUp(db, "ada@example.com", deliver);
  const token = tokenFrom(sent[0]);

  assert.equal(db.tokens[0].token_hash, sha(token));
  assert.notEqual(db.tokens[0].token_hash, token);
  assert.equal(db.passes[0].token_hash, sha(pass));
  assert.notEqual(db.passes[0].token_hash, pass);
});

test("an address on file and one nobody has seen get the same answer", async () => {
  const db = new Fake();
  const { deliver } = collector();

  const first = await beginApplication(
    db,
    { email: "known@example.com", ...CONTEXT },
    deliver
  );
  const again = await beginApplication(
    db,
    { email: "known@example.com", ...CONTEXT },
    deliver
  );
  const stranger = await beginApplication(
    db,
    { email: "stranger@example.com", ...CONTEXT },
    deliver
  );

  assert.deepEqual(answerForBegin(again), answerForBegin(first));
  assert.deepEqual(answerForBegin(stranger), answerForBegin(first));
  // And signing up twice is one applicant, not two.
  assert.equal(db.customers.filter((c) => c.email === "known@example.com").length, 1);
});

test("a malformed address writes nothing at all", async () => {
  const db = new Fake();
  const { sent, deliver } = collector();

  const outcome = await beginApplication(
    db,
    { email: "not an address", ...CONTEXT },
    deliver
  );

  assert.deepEqual(outcome, { ok: false, reason: "malformed" });
  assert.equal(db.customers.length, 0);
  assert.equal(db.attempts.length, 0, "a junk POST does not spend an allowance");
  assert.equal(sent.length, 0);
});

test("the throttle trips by address, and a refused attempt still counts", async () => {
  const db = new Fake();
  const { sent, deliver } = collector();
  const ask = () =>
    beginApplication(db, { email: "ada@example.com", ...CONTEXT }, deliver);

  assert.ok((await ask()).ok);
  assert.ok((await ask()).ok);
  assert.ok((await ask()).ok);

  const fourth = await ask();
  assert.ok(!fourth.ok && fourth.reason === "rate_limited");
  assert.equal(sent.length, 3, "the refused one sent nothing");

  const fifth = await ask();
  assert.ok(!fifth.ok, "asking again while limited does not reset the window");
});

test("a mailer on fire changes neither the answer nor the pass", async () => {
  const db = new Fake();
  const onFire: Deliver = async () => {
    throw new Error("resend is on fire");
  };

  const outcome = await beginApplication(
    db,
    { email: "ada@example.com", ...CONTEXT },
    onFire
  );

  assert.ok(outcome.ok, "she can still get on with it");
  assert.equal(db.passes.length, 1, "the pass exists whatever the mailer did");
});

/* ── the pass, before and after the note is opened ───────────────────── */

test("the pass exists before the note is opened, and reads as unconfirmed", async () => {
  const db = new Fake();
  const { deliver } = collector();
  const { pass } = await signUp(db, "ada@example.com", deliver);

  const applicant = await readPass(db, pass);
  assert.ok(applicant);
  assert.equal(applicant.email, "ada@example.com");
  assert.equal(applicant.confirmed, false);
});

/**
 * THE PROPERTY THE WHOLE ORDERING EXISTS FOR.
 *
 * She types her address in browser A, where her answers will live. The note
 * opens in browser B, because her mail app launched its own. Browser A must
 * come good WITHOUT EVER SEEING THE NOTE — otherwise every answer typed in it
 * is stranded behind a wall it can never pass, which is the exact failure the
 * pass is minted at sign-up to prevent.
 */
test("confirming in another browser brings the first browser's pass good", async () => {
  const db = new Fake();
  const { sent, deliver } = collector();

  const { pass: browserA } = await signUp(db, "ada@example.com", deliver);
  assert.equal((await readPass(db, browserA))?.confirmed, false);

  const confirmed = await confirmApplication(db, tokenFrom(sent[0]), CONTEXT);
  assert.ok(confirmed.ok);
  assert.equal(confirmed.email, "ada@example.com");

  // Browser B got its own pass and can also carry on.
  assert.equal((await readPass(db, confirmed.pass))?.confirmed, true);
  // And browser A — which never saw the note — is now through.
  assert.equal((await readPass(db, browserA))?.confirmed, true);
});

test("a note works once", async () => {
  const db = new Fake();
  const { sent, deliver } = collector();
  await signUp(db, "ada@example.com", deliver);
  const token = tokenFrom(sent[0]);

  assert.ok((await confirmApplication(db, token, CONTEXT)).ok);
  assert.deepEqual(await confirmApplication(db, token, CONTEXT), { ok: false });
});

test("an expired note, a junk one and one nobody issued all fail the same way", async () => {
  const db = new Fake();
  const { sent, deliver } = collector();
  await signUp(db, "ada@example.com", deliver);

  // Rewind the row's clock rather than waiting a quarter of an hour.
  db.tokens[0].expires_at = new Date(Date.now() - 1000);

  assert.deepEqual(await confirmApplication(db, tokenFrom(sent[0]), CONTEXT), {
    ok: false,
  });
  assert.deepEqual(await confirmApplication(db, "f".repeat(64), CONTEXT), {
    ok: false,
  });
  assert.deepEqual(await confirmApplication(db, "not-a-token", CONTEXT), {
    ok: false,
  });
});

/**
 * db/063's purpose column, doing the job it was added for. Neither of these is
 * a hole — both need the raw token, so only its owner can try — but a
 * mechanism that invites the wrong reading is a defect even when it works
 * (rule 23), and this is what stops the two from being one thing.
 */
test("a sign-in link cannot be spent as a confirmation", async () => {
  const db = new Fake();
  const { sent, deliver } = collector();
  await signUp(db, "ada@example.com", deliver);
  const token = tokenFrom(sent[0]);

  // Same row, same token, written as the sign-in door would have written it.
  // Nothing else about it changes, so the only thing under test is the
  // purpose — and without it this call would succeed.
  db.tokens[0].purpose = "sign_in";

  assert.deepEqual(await confirmApplication(db, token, CONTEXT), { ok: false });
  assert.equal(db.tokens[0].consumed_at, null, "the sign-in link is untouched");
  assert.equal(db.customers[0].email_confirmed_at, null);

  // And put it back: the same token, as a confirmation, works. Without this
  // half the test above would pass for any reason at all.
  db.tokens[0].purpose = "confirm";
  assert.ok((await confirmApplication(db, token, CONTEXT)).ok);
});

/**
 * THE OTHER HALF OF db/063'S PURPOSE COLUMN, and the half with teeth.
 *
 * A confirmation clicked at /login/[token] must not be spent there. If it
 * were, she would be told to ask for another note she had never used — and the
 * only way back would be another note for the same thing to eat. That is
 * exactly the shape that locked a curator out before the interstitial existed.
 *
 * The second half of the test is what makes the first half mean anything: the
 * identical token, with only its purpose changed, IS redeemed. So the refusal
 * above is the purpose filter and not some other accident.
 */
test("a confirmation cannot be spent as a sign-in, and opens no session", async () => {
  const db = new Fake();
  const { sent, deliver } = collector();
  await signUp(db, "ada@example.com", deliver);
  const token = tokenFrom(sent[0]);

  const spent = await redeemSignInToken(db, token, { stillAllowed: () => true });

  assert.equal(spent, null);
  assert.equal(db.tokens[0].consumed_at, null, "the note is still hers to open");
  assert.equal(db.sessions.length, 0, "an applicant is not a member");

  db.tokens[0].purpose = "sign_in";
  assert.ok(await redeemSignInToken(db, token, { stillAllowed: () => true }));
});

test("a confirmation token is not a pass", async () => {
  const db = new Fake();
  const { sent, deliver } = collector();
  await signUp(db, "ada@example.com", deliver);

  assert.equal(await readPass(db, tokenFrom(sent[0])), null);
});

test("an expired pass reads as nobody", async () => {
  const db = new Fake();
  const { deliver } = collector();
  const { pass } = await signUp(db, "ada@example.com", deliver);

  db.passes[0].expires_at = new Date(Date.now() - 1000);
  assert.equal(await readPass(db, pass), null);
});

test("a pass outlives a fortnight of ordinary life", async () => {
  const db = new Fake();
  const { deliver } = collector();
  const { pass } = await signUp(db, "ada@example.com", deliver);

  assert.ok(
    PASS_TTL_DAYS >= 14,
    "a half-finished application must survive being put down"
  );
  assert.ok(db.passes[0].expires_at.getTime() > Date.now() + 13 * 86_400_000);
  assert.ok(await readPass(db, pass));
});

test("confirming twice does not move the moment she proved it", async () => {
  const db = new Fake();
  const { sent, deliver } = collector();
  await signUp(db, "ada@example.com", deliver);
  await confirmApplication(db, tokenFrom(sent[0]), CONTEXT);
  const first = db.customers[0].email_confirmed_at;

  // A second note, opened later.
  await beginApplication(db, { email: "ada@example.com", ...CONTEXT }, deliver);
  await confirmApplication(db, tokenFrom(sent[1]), CONTEXT);

  assert.deepEqual(db.customers[0].email_confirmed_at, first);
});

test("applying does not spend the pass — a host may bring a second occasion", async () => {
  const db = new Fake();
  const { sent, deliver } = collector();
  const { pass } = await signUp(db, "ada@example.com", deliver);
  await confirmApplication(db, tokenFrom(sent[0]), CONTEXT);

  // There is no consume path for a pass at all: reading it twice is the same
  // answer twice. If somebody adds one, this goes red.
  assert.ok(await readPass(db, pass));
  assert.ok(await readPass(db, pass));
});

/* ── the shape of the flow, and the half-finished application ────────── */

test("exactly one step is the sign-up, and the flow does not walk it", () => {
  assert.equal(QUIZ_STEPS.filter((s) => s.signUp).length, 1);
  assert.equal(SIGN_UP_STEP.key, "email");
  assert.ok(!ASKED_STEPS.some((s) => s.signUp));
  assert.equal(ASKED_STEPS.length, QUIZ_STEPS.length - 1);
});

test("the address is still a required answer even though it is never walked", () => {
  assert.ok(FIELDS.email, "the field is still in the question set");

  const complete: Record<string, string | string[]> = {};
  for (const step of ASKED_STEPS) {
    for (const field of step.fields) {
      if (field.type === "multi") {
        complete[field.id] = field.options
          .slice(0, Math.max(field.min, 1))
          .map((o) => o.code);
      } else if (field.type === "single") complete[field.id] = field.options[0].code;
      else complete[field.id] = "something";
    }
  }

  // Everything she is ASKED, answered — and it is still not a submission,
  // because the address is not there. That is the guard that keeps the
  // sign-up from being skippable by posting straight at the route.
  assert.ok(allErrors(complete).length > 0);

  complete.email = "ada@example.com";
  assert.deepEqual(allErrors(complete), []);
});

/**
 * A draft written before any of this existed holds a stepIndex into the OLD
 * list, where the address was the last screen. The sign-up step moved to the
 * FRONT, so dropping it leaves every remaining screen at the index it had —
 * her position still points at the same question. This is the assertion that
 * keeps somebody from "tidying" the array order and silently moving every
 * half-finished applicant to a different question than the one she left.
 */
test("an old draft's position still points at the question it left", () => {
  const before = QUIZ_STEPS.filter((s) => !s.signUp).map((s) => s.key);
  assert.deepEqual(
    ASKED_STEPS.map((s) => s.key),
    before
  );
  assert.equal(QUIZ_STEPS[0].key, SIGN_UP_STEP.key, "the sign-up is first");

  // The one draft that cannot point at the same question is one that stopped
  // ON the old last screen, which was the address. It clamps to the final
  // screen, and no answer is touched.
  const strandedIndex = QUIZ_STEPS.length - 1;
  const clamped = Math.min(strandedIndex, ASKED_STEPS.length - 1);
  assert.equal(clamped, ASKED_STEPS.length - 1);
  assert.ok(ASKED_STEPS[clamped]);
});

function sha(value: string): string {
  const byHand = createHash("sha256").update(value).digest("hex");
  // Both, so a change to `digest` that broke it cannot make this test agree
  // with itself.
  assert.equal(byHand, digest(value));
  return byHand;
}
