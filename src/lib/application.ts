/**
 * APPLYING. She signs up, she proves the address is hers, and then she is
 * asked the questions.
 *
 * Founder, 2026-09-05: "when they apply for membership, need a fun page where
 * they sign up and confirm email not just to the quiz."
 *
 * Before this, /apply dropped a visitor into the questions and asked for her
 * address on the last screen. Two things were wrong with that and only one of
 * them is about feel: there was no moment of joining — she answered everything
 * and only then learned what she had joined — and the address was never
 * proved, so anybody could put anybody's inbox on an application and the house
 * would mail a stranger about a party she had not planned.
 *
 * ── WHAT THIS FILE IS AND IS NOT ─────────────────────────────────────
 *
 * It is the POLICY for applying, the way src/lib/login.ts is the policy for
 * signing in. It knows who gets a note, what the note says, and what has to be
 * true before the questions are shown. It borrows the MECHANISM whole from
 * src/lib/session.ts — mint 256 bits, store only the sha256, spend once inside
 * an expiry — and adds none of its own. There is exactly one way to prove an
 * address in this codebase and this is not a second one; it is the same one,
 * with `purpose = 'confirm'` on the row (db/063).
 *
 * IT NEVER OPENS A SESSION. An applicant is not a member. A confirmed address
 * is a real fact and it buys exactly one thing — the questions — and never a
 * portal, never a desk, never a `login_session` row. db/015 drew that line and
 * db/063's comments defend it again at the table.
 *
 * ── THE HALF-FINISHED APPLICATION, WHICH IS THE HARD PART ────────────
 *
 * She will not do this in one sitting. She fills it in on a phone, one-handed,
 * and will be interrupted; she may open the confirmation note in a mail app
 * that launches a DIFFERENT browser from the one she typed her address into.
 * Every one of those has to cost her nothing, so:
 *
 * 1. HER ANSWERS NEVER LEAVE THE BROWSER UNTIL SHE SENDS THEM, and nothing in
 *    this flow touches them. The draft in src/lib/quiz-draft.ts is written on
 *    every tap and cleared at exactly ONE moment — after the server has
 *    confirmed the submission — which is the rule it already had and which
 *    signing up does not change. Not on sign-up, not on confirming, not on a
 *    pass expiring.
 *
 * 2. THE PASS IS MINTED AT SIGN-UP, NOT AT THE CLICK. That is the whole reason
 *    the browser split is survivable. The browser holding her answers gets its
 *    pass the moment she types her address; the note's click mints a second
 *    one for whatever browser opened it. Both point at the same customer, and
 *    neither records whether the address is confirmed — `readPass` asks
 *    `customer.email_confirmed_at` every time. So the browser with her answers
 *    starts working as soon as the confirmation lands ANYWHERE, without ever
 *    having seen the note.
 *
 *    Had the pass been minted at the click instead, confirming in browser B
 *    would strand every answer typed in browser A behind a wall it could never
 *    pass. That is the failure this ordering exists to prevent.
 *
 * 3. A PASS IS NOT SPENT BY APPLYING. quiz_response is append-only and a host
 *    may bring the house a second occasion; consuming the pass at submission
 *    would refuse her the next one. It expires on its own, thirty days out.
 *
 * 4. AN APPLICANT WHO CONFIRMS AND NEVER ANSWERS IS NOT A LOST ROW. She has a
 *    `customer` row with `email_confirmed_at` set and no `quiz_response`, and
 *    that is a true and readable state: somebody who came to the door and
 *    stopped. Nothing sweeps it, nothing promises her anything, and if she
 *    comes back inside the pass's life she resumes at the exact question she
 *    left.
 *
 * ── THE ANSWER IS THE SAME FOR EVERY ADDRESS ─────────────────────────
 *
 * As at the sign-in door, and more easily: every well-formed address becomes an
 * applicant here, so there is nothing to be learned from the reply. A member's
 * address, a stranger's, and one nobody has typed before all get a customer
 * row, a pass and a note. `answerForBegin` therefore has one sentence, and the
 * two refusals it can also render — malformed, throttled — are both true
 * before anybody is looked up.
 *
 * ── FRAMEWORK-FREE ───────────────────────────────────────────────────
 *
 * No "server-only", no next/*, no src/lib/db.ts, siblings imported with an
 * explicit .ts extension. The database and the mailer arrive as arguments, so
 * `node --test` can prove the properties above rather than assert them in a
 * comment. src/lib/auth.ts supplies the real ones.
 */

import {
  FOOTER,
  NOTHING_HAPPENED,
  aside,
  button,
  eyebrow,
  heading,
  line,
  shell,
  type Deliver,
  type Mail,
} from "./house-mail.ts";
import { appUrl, type Answer } from "./login.ts";
import { isEmail } from "./quiz.ts";
import {
  CONFIRM_BY_EMAIL,
  CONFIRM_BY_IP,
  REDEEM_BY_IP,
  recordAttempt,
} from "./rate-limit.ts";
import {
  SIGN_IN_TTL_MINUTES,
  digest,
  looksLikeToken,
  mintToken,
  sameDigest,
  type Db,
} from "./session.ts";

/**
 * The cookie the pass rides in. Deliberately not COOKIE (`revelle_session`):
 * two different things must not share a name, or a reader of either file has
 * to hold both meanings at once to know what a browser is carrying.
 */
export const APPLICATION_COOKIE = "revelle_application";

/**
 * A confirmation note lives exactly as long as a sign-in link, and for the
 * identical reason — it arrives in a medium we do not own. Read from
 * session.ts rather than restated, so the two cannot drift apart into "why is
 * one of them twenty minutes".
 */
export const CONFIRM_TTL_MINUTES = SIGN_IN_TTL_MINUTES;

/**
 * Thirty days. Long, because what it protects is a half-finished application
 * living in her browser, which may sit through a fortnight of ordinary life
 * before she picks it up. Short enough that a shared laptop does not carry a
 * way into somebody else's application forever. Absolute, never sliding, for
 * the reason SESSION_TTL_DAYS gives.
 */
export const PASS_TTL_DAYS = 30;

/* ── signing up ─────────────────────────────────────────────────────── */

export type BeginOutcome =
  | {
      ok: true;
      /**
       * The RAW pass. The caller's one job is to put it in a cookie and forget
       * it. It is never logged and never written to a column — only its digest
       * is stored.
       */
      pass: string;
    }
  | { ok: false; reason: "malformed" }
  | { ok: false; reason: "rate_limited"; retryAfterSeconds: number };

export type BeginRequest = {
  email: string;
  /** The client's address, already reduced to one hop. May be null. */
  ip: string | null;
  userAgent: string | null;
};

/**
 * Begin an application.
 *
 * The order is the sign-in door's, and deliberate for the same reasons:
 *
 *   1. Shape. A value that is not an address cannot be anyone, and refusing it
 *      before touching the database keeps a junk POST from being a write.
 *   2. THE THROTTLE, BEFORE ANYTHING IS CREATED. A refused attempt writes no
 *      customer, mints no pass and sends no mail.
 *   3. Only then the row, the tokens and at most one message.
 *
 * The customer row is created here rather than at submission. That is the
 * change db/063 makes to the shape of the product: an applicant exists from
 * the moment she gives her address, not from the moment she finishes. The
 * insert is idempotent on the address, so signing up twice is one applicant.
 */
export async function beginApplication(
  db: Db,
  input: BeginRequest,
  deliver: Deliver
): Promise<BeginOutcome> {
  const address = input.email.trim().toLowerCase();
  if (address.length === 0 || address.length > 254 || !isEmail(address)) {
    return { ok: false, reason: "malformed" };
  }

  const byIp = await recordAttempt(db, CONFIRM_BY_IP, input.ip);
  const byEmail = await recordAttempt(db, CONFIRM_BY_EMAIL, address);
  if (!byIp.allowed || !byEmail.allowed) {
    return {
      ok: false,
      reason: "rate_limited",
      retryAfterSeconds: Math.max(
        byIp.retryAfterSeconds,
        byEmail.retryAfterSeconds
      ),
    };
  }

  const customerId = await applicantFor(db, address);

  const raw = mintToken();
  await db.query(
    `insert into sign_in_token
       (customer_id, token_hash, expires_at, requested_user_agent, purpose)
     values ($1, $2, now() + ($3 || ' minutes')::interval, $4, 'confirm')`,
    [customerId, digest(raw), String(CONFIRM_TTL_MINUTES), input.userAgent]
  );

  // Before the send, not after. A pass that exists only if Resend answered
  // would make a mail outage into "she cannot even start", when in fact
  // everything except the note worked.
  const pass = await issuePass(db, customerId, input.userAgent);

  await send(deliver, confirmNote(address, `${appUrl()}/apply/${raw}`));

  return { ok: true, pass };
}

/**
 * Deliver, and swallow.
 *
 * A throw here must not change the answer. She has a pass, her application has
 * begun, and the note not arriving is something she fixes by asking for
 * another — which the waiting screen offers. It is logged as an error because
 * a house whose mail is broken cannot confirm anybody, and that is worth
 * waking up to; it says which failure it was and never who it was for.
 */
async function send(deliver: Deliver, mail: Mail): Promise<void> {
  try {
    await deliver(mail);
  } catch (err) {
    console.error(
      "[apply] a confirmation note could not be sent",
      err instanceof Error ? err.message : err
    );
  }
}

/**
 * Her customer row, created if this is the first time.
 *
 * `on conflict do update` rather than `do nothing`, because `returning` yields
 * no row for a conflict that did nothing, and a second statement to fetch the
 * id would be a lookup racing an insert. One statement, one snapshot: two
 * sign-ups from the same address at the same moment cannot both create.
 *
 * `accepted_at` is untouched and stays null. Signing up makes an APPLICANT.
 */
async function applicantFor(db: Db, address: string): Promise<string> {
  const upserted = await db.query<{ id: string }>(
    `insert into customer (email) values ($1)
     on conflict (email) do update set updated_at = now()
     returning id`,
    [address]
  );
  return upserted.rows[0].id;
}

async function issuePass(
  db: Db,
  customerId: string,
  userAgent: string | null
): Promise<string> {
  const raw = mintToken();
  await db.query(
    `insert into application_pass (customer_id, token_hash, expires_at, user_agent)
     values ($1, $2, now() + ($3 || ' days')::interval, $4)`,
    [customerId, digest(raw), String(PASS_TTL_DAYS), userAgent]
  );
  return raw;
}

/**
 * THE SENTENCE. One of them, for every address that could exist.
 *
 * Here for the reason `answerFor` is in login.ts: it is the behaviour most
 * worth being able to test, and a comment promising that the response is
 * identical either way is a promise, while an assertion is a fact.
 *
 * The words obey docs/copy-brief.md. Nothing counted, no duration on the note,
 * no apology for asking, and the mechanism is never named "quiz".
 */
export function answerForBegin(outcome: BeginOutcome): Answer {
  if (outcome.ok) {
    return {
      message: "A note is on its way. Open it and we can begin.",
      asked: true,
    };
  }

  if (outcome.reason === "malformed") {
    return { message: "That does not look like an email address.", asked: false };
  }

  return {
    message: "That has been asked for a few times over. Try again in a while.",
    asked: false,
  };
}

/* ── confirming ─────────────────────────────────────────────────────── */

export type ConfirmOutcome =
  | { ok: true; pass: string; email: string }
  | { ok: false };

/**
 * Press the button in the note.
 *
 * ONE FAILURE, however it failed. Expired, already used, never existed, a
 * sign-in link submitted here by mistake — all of them are `{ ok: false }` and
 * the page says one sentence about notes working once. A handler that
 * distinguished them would be telling a script which of its guesses was
 * closest, and there is nothing she could do differently anyway.
 *
 * SINGLE USE IN ONE STATEMENT, never a read followed by a write: two clicks
 * racing on the same note must not both win. The `purpose = 'confirm'` in the
 * predicate is what stops this from being a second way to spend a sign-in
 * link — see db/063.
 *
 * PASS A TRANSACTION for `db`. Consuming the note, marking the address and
 * minting the pass are one fact and must not half-happen: a failure after the
 * consuming update would burn her note and give her nothing, and asking for
 * another would be the only cure for a problem she cannot see.
 */
export async function confirmApplication(
  db: Db,
  raw: string,
  context: { ip: string | null; userAgent: string | null }
): Promise<ConfirmOutcome> {
  const byIp = await recordAttempt(db, REDEEM_BY_IP, context.ip);
  if (!byIp.allowed) return { ok: false };

  if (!looksLikeToken(raw)) return { ok: false };

  const consumed = await db.query<{ customer_id: string | null }>(
    `update sign_in_token
        set consumed_at = now()
      where token_hash = $1
        and purpose = 'confirm'
        and consumed_at is null
        and expires_at > now()
      returning customer_id`,
    [digest(raw)]
  );
  if (consumed.rows.length === 0) return { ok: false };

  const customerId = consumed.rows[0].customer_id;
  if (!customerId) return { ok: false };

  // `coalesce`, so confirming twice does not move the timestamp. The fact is
  // the FIRST time she proved the address; a later click is the same fact
  // being re-asserted, not a new one.
  const marked = await db.query<{ email: string }>(
    `update customer
        set email_confirmed_at = coalesce(email_confirmed_at, now())
      where id = $1
      returning email::text as email`,
    [customerId]
  );
  const email = marked.rows[0]?.email;
  if (!email) return { ok: false };

  return {
    ok: true,
    pass: await issuePass(db, customerId, context.userAgent),
    email,
  };
}

/* ── reading a pass ─────────────────────────────────────────────────── */

export type Applicant = {
  customerId: string;
  email: string;
  /**
   * Read from `customer.email_confirmed_at` on every call and never cached on
   * the pass row. That is what lets a pass minted before the note was opened
   * come good the moment somebody opens it, in any browser. See the note at
   * the top of this file.
   */
  confirmed: boolean;
};

/**
 * Who this pass belongs to, or null.
 *
 * Live means the row exists and has not expired. There is no `revoked_at` and
 * no `consumed_at` — a pass is read many times by design, which is the one
 * property that makes it not a `sign_in_token` (db/063).
 *
 * A pass grants NO authority beyond being asked the questions. Everything that
 * matters is re-read here: her address, and whether it is confirmed.
 */
export async function readPass(
  db: Db,
  raw: string
): Promise<Applicant | null> {
  if (!looksLikeToken(raw)) return null;

  const presented = digest(raw);
  const found = await db.query<{
    customer_id: string;
    email: string;
    email_confirmed_at: Date | null;
    token_hash: string;
  }>(
    `select p.customer_id,
            c.email::text as email,
            c.email_confirmed_at,
            p.token_hash
       from application_pass p
       join customer c on c.id = p.customer_id
      where p.token_hash = $1
        and p.expires_at > now()`,
    [presented]
  );
  if (found.rows.length !== 1) return null;

  // Belt and braces against the lookup ever stopping being an exact match on
  // an indexed unique column. Same argument as subjectForSession.
  if (!sameDigest(found.rows[0].token_hash, presented)) return null;

  return {
    customerId: found.rows[0].customer_id,
    email: found.rows[0].email,
    confirmed: found.rows[0].email_confirmed_at !== null,
  };
}

/* ── what the note says ─────────────────────────────────────────────── */

/**
 * The confirmation note.
 *
 * docs/copy-brief.md governs every word. Nothing is counted — no minutes on
 * the link, no questions ahead — nothing apologises for the asking, and the
 * mechanism is not named. What it does say is what happens next, because that
 * is the one thing she cannot see from her inbox.
 *
 * Rule 10: the subject of the good verb is hers. The house asks; she is the
 * one with a night in mind. "It arrives written" and its family fail here as
 * everywhere.
 */
function confirmNote(to: string, link: string): Mail {
  return {
    to,
    subject: "Is this you?",
    html: shell(
      [
        eyebrow("Revelle Soci&eacute;t&eacute;"),
        heading("Is this you?"),
        button(link, "It&rsquo;s me"),
        line(
          "Then we&rsquo;ll ask you about the night you have in mind, and " +
            "about the people who will be in the room."
        ),
        aside(NOTHING_HAPPENED),
      ].join("\n"),
      FOOTER
    ),
    text: [
      "REVELLE SOCIÉTÉ",
      "",
      "Is this you?",
      link,
      "",
      "Then we'll ask you about the night you have in mind, and about the people who will be in the room.",
      "",
      NOTHING_HAPPENED,
      "",
      FOOTER,
    ].join("\n"),
  };
}
