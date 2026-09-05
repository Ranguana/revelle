/**
 * THE DOOR. One address in, one link out, and two rooms behind it.
 *
 * src/lib/session.ts is the mechanism and knows nothing about who anyone is.
 * This is the policy: who gets a link, what the link says, and what has to
 * still be true when it is clicked. Everything that decides *whether* someone
 * may sign in is in this file, so there is one place to read.
 *
 * ── THE RULE THAT SHAPES EVERY FUNCTION BELOW ────────────────────────
 *
 * THE ANSWER IS THE SAME WHETHER OR NOT THE ADDRESS IS ON FILE.
 *
 * Not similar — the same. A door that says "yes, she is a member" to anyone
 * who types an address is a door that hands over the membership list, one
 * guess at a time, and the membership list is a list of Jessica's customers.
 * So `requestLink` returns `ok: true` for a curator, for a member, for an
 * applicant, and for an address nobody has ever heard of, and the caller has
 * exactly one sentence to render. `issued` exists for the server log and for
 * the tests; a caller that branches on it has broken the property.
 *
 * That rule survives a mail failure too. If Resend is down, the outcome is
 * still `ok: true` and the error goes to the log — because "the link could not
 * be sent" is only ever said about an address we tried to send to, and saying
 * it is the same as saying she is on file.
 *
 * ── THREE KINDS OF PERSON, AND THE ONE WHO IS NOT ────────────────────
 *
 *   staff       on STAFF_EMAILS. Gets a link to the desk.
 *   member      customer.accepted_at is set. Gets a link to her portal.
 *   applicant   customer row, accepted_at null. Gets a plain note saying
 *               there is nothing to open yet. AN APPLICANT IS NOT A MEMBER
 *               and must not be given a portal by asking nicely for one.
 *   unknown     no row. Gets nothing at all — sending mail to an address that
 *               has never heard of us is spam, whoever typed it.
 *
 * The note to an applicant is not a leak. It reaches one inbox: hers. The
 * enumeration rule is about what an attacker learns from the RESPONSE, and the
 * response is identical in all four cases.
 *
 * ── FRAMEWORK-FREE ───────────────────────────────────────────────────
 *
 * No "server-only", no next/*, no src/lib/db.ts, siblings imported with an
 * explicit .ts extension — the rule src/lib/jobs and src/lib/selection follow,
 * so `node --test` can run this directly. The database and the mailer both
 * arrive as arguments. That is what makes it possible to prove the properties
 * above rather than assert them in a comment.
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
import { isEmail } from "./quiz.ts";
import {
  destinationFor,
  issueSignInToken,
  redeemSignInToken,
  SIGN_IN_TTL_MINUTES,
  type Db,
  type Redemption,
  type Subject,
} from "./session.ts";
import { isStaffEmail } from "./staff-allowlist.ts";
import {
  recordAttempt,
  REQUEST_BY_EMAIL,
  REQUEST_BY_IP,
  REDEEM_BY_IP,
} from "./rate-limit.ts";

/* ── the mail ───────────────────────────────────────────────────────── */

/**
 * Re-exported, not redeclared. `Mail` and `Deliver` moved to
 * src/lib/house-mail.ts when a third file needed to compose a message in the
 * house's frame — rule 21, one owner. The names stay importable from here
 * because src/lib/auth.ts and the tests have always asked this module for
 * them, and moving a type is not a reason to make every caller learn a new
 * path. src/lib/auth.ts supplies the real `Deliver`.
 */
export type { Deliver, Mail } from "./house-mail.ts";

/* ── asking ─────────────────────────────────────────────────────────── */

export type LinkOutcome =
  | {
      ok: true;
      /**
       * FOR THE LOG AND FOR TESTS ONLY. Rendering different words for
       * different values of this is the one way to break the door. See the
       * rule at the top of the file.
       */
      issued: "staff" | "member" | "applicant" | "none";
    }
  | { ok: false; reason: "malformed" }
  | { ok: false; reason: "rate_limited"; retryAfterSeconds: number };

export type LinkRequest = {
  email: string;
  /** The client's address, already reduced to one hop. May be null. */
  ip: string | null;
  userAgent: string | null;
};

/**
 * Ask for a link.
 *
 * Order matters and is deliberate:
 *
 *   1. Shape. A value that is not an address cannot be anyone, and refusing it
 *      before touching the database keeps a junk POST from being a query.
 *   2. THE THROTTLE, BEFORE THE LOOKUP. Both limits are recorded for every
 *      request that got this far, whoever it is for. Counting only known
 *      addresses would make the limit itself an oracle: a request that is
 *      never throttled is a request for an address that is not on file.
 *   3. Only then, who this is — and at most one message.
 */
export async function requestLink(
  db: Db,
  input: LinkRequest,
  deliver: Deliver
): Promise<LinkOutcome> {
  const address = input.email.trim().toLowerCase();
  if (address.length === 0 || address.length > 254 || !isEmail(address)) {
    return { ok: false, reason: "malformed" };
  }

  const byIp = await recordAttempt(db, REQUEST_BY_IP, input.ip);
  const byEmail = await recordAttempt(db, REQUEST_BY_EMAIL, address);
  if (!byIp.allowed || !byEmail.allowed) {
    return {
      ok: false,
      reason: "rate_limited",
      retryAfterSeconds: Math.max(byIp.retryAfterSeconds, byEmail.retryAfterSeconds),
    };
  }

  const person = await identify(db, address);

  // Nobody we know. No mail, and nothing in the answer to say so.
  if (!person) return { ok: true, issued: "none" };

  if (person.kind === "applicant") {
    await send(deliver, applicantNote(address));
    return { ok: true, issued: "applicant" };
  }

  const raw = await issueSignInToken(db, person.subject, input.userAgent);
  const link = `${appUrl()}/login/${raw}`;

  await send(
    deliver,
    person.subject.kind === "staff" ? deskLink(address, link) : memberLink(address, link)
  );

  return { ok: true, issued: person.subject.kind === "staff" ? "staff" : "member" };
}

/**
 * Deliver, and swallow.
 *
 * A throw here must not change the answer — see the rule at the top. It is
 * logged as an error because a service whose mail is broken is a service that
 * cannot be signed into at all, and that is worth waking up to; it says which
 * failure it was and never who it was for.
 */
async function send(deliver: Deliver, mail: Mail): Promise<void> {
  try {
    await deliver(mail);
  } catch (err) {
    console.error(
      "[login] a sign-in message could not be sent",
      err instanceof Error ? err.message : err
    );
  }
}

/* ── what she is told ───────────────────────────────────────────────── */

export type Answer = {
  message: string;
  /** Whether the page draws this as an answer or as a refusal. */
  asked: boolean;
};

/**
 * THE SENTENCE. One of them, for every address that could exist.
 *
 * This lives here rather than in the Server Action for one reason: it is the
 * single most important behaviour in the feature and it has to be TESTABLE.
 * A comment in a route file saying "the response is identical either way" is
 * a promise; `assert.deepEqual(answerFor(member), answerFor(nobody))` is a
 * fact, and it fails the build the day somebody adds a kindly "we could not
 * find that address".
 *
 * The two refusals are safe to distinguish because neither depends on who the
 * address belongs to: a malformed value is malformed for everybody, and the
 * throttle counts every request before anybody is looked up.
 */
export function answerFor(outcome: LinkOutcome): Answer {
  if (outcome.ok) {
    // Deliberately does not read outcome.issued. Do not make it.
    return {
      message:
        "If that address has a way in, a link is on its way. It works once, " +
        "and only for a short while.",
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

/* ── who is this ────────────────────────────────────────────────────── */

type Identified =
  | { kind: "subject"; subject: Subject }
  | { kind: "applicant" };

/**
 * Staff is asked FIRST.
 *
 * Both people who run the société will have applied to their own product at
 * some point, so an address can be in both registers. STAFF_EMAILS is the
 * narrower, deliberately-maintained list and it wins: a curator typing her own
 * address wants the desk.
 *
 * The `staff` row is created here on first request, exactly as db/011
 * describes — it is the register, not the gate, and it exists so that a change
 * made in the first minute of the first session already has an author.
 */
async function identify(db: Db, address: string): Promise<Identified | null> {
  if (isStaffEmail(address)) {
    const upserted = await db.query<{ id: string; name: string; status: string }>(
      `insert into staff (email, name)
       values ($1, $2)
       on conflict (email) do update set updated_at = now()
       returning id, name, status`,
      [address, address.split("@")[0]]
    );
    const person = upserted.rows[0];
    // The one thing the register can do to a sign-in: refuse it, whatever the
    // environment variable says. The revoke path that is not a deploy.
    if (!person || person.status !== "active") return null;
    return {
      kind: "subject",
      subject: {
        kind: "staff",
        id: person.id,
        email: address,
        name: person.name.trim().length > 0 ? person.name.trim() : null,
      },
    };
  }

  const found = await db.query<{
    id: string;
    email: string;
    name: string | null;
    accepted_at: Date | null;
  }>(
    `select id, email::text as email, name, accepted_at
       from customer where email = $1`,
    [address]
  );
  const person = found.rows[0];
  if (!person) return null;

  // db/015: null means she has applied and nothing more.
  if (person.accepted_at === null) return { kind: "applicant" };

  const named = (person.name ?? "").trim();
  return {
    kind: "subject",
    subject: {
      kind: "member",
      id: person.id,
      email: person.email,
      name: named.length > 0 ? named : null,
    },
  };
}

/* ── clicking ───────────────────────────────────────────────────────── */

export type ClickOutcome =
  | { ok: true; subject: Subject; sessionToken: string; destination: string }
  | { ok: false; reason: "no" }
  | { ok: false; reason: "rate_limited" };

/**
 * Spend a link.
 *
 * Every way of failing returns the same `no`: expired, already used, never
 * existed, revoked in the fifteen minutes since it was sent. The person sees
 * one sentence telling her links work once and to ask for another, which is
 * the only thing she can act on anyway, and a script sees nothing it can sort.
 *
 * PASS A TRANSACTION for `db`. The consuming update and the session insert
 * belong together — see redeemSignInToken.
 */
export async function redeemLink(
  db: Db,
  raw: string,
  context: { ip: string | null; userAgent: string | null }
): Promise<ClickOutcome> {
  const byIp = await recordAttempt(db, REDEEM_BY_IP, context.ip);
  if (!byIp.allowed) return { ok: false, reason: "rate_limited" };

  const redeemed: Redemption | null = await redeemSignInToken(db, raw, {
    userAgent: context.userAgent,
    stillAllowed: (subject) => stillAllowed(db, subject),
  });
  if (!redeemed) return { ok: false, reason: "no" };

  return {
    ok: true,
    subject: redeemed.subject,
    sessionToken: redeemed.sessionToken,
    destination: destinationFor(redeemed.subject),
  };
}

/**
 * Is this person still who she was when the link was issued?
 *
 * Asked at the click, and again on every single request that reads a session
 * (src/lib/staff.ts, src/lib/members.ts). A link sits in an inbox for fifteen
 * minutes and a session lives for a fortnight; an address taken off
 * STAFF_EMAILS, or a membership that was never granted, has to bite at the
 * next click rather than whenever the token happens to lapse.
 */
export async function stillAllowed(db: Db, subject: Subject): Promise<boolean> {
  if (subject.kind === "staff") {
    if (!isStaffEmail(subject.email)) return false;
    const found = await db.query<{ status: string }>(
      `select status from staff where id = $1`,
      [subject.id]
    );
    return found.rows[0]?.status === "active";
  }

  const found = await db.query<{ accepted: boolean }>(
    `select accepted_at is not null as accepted from customer where id = $1`,
    [subject.id]
  );
  return found.rows[0]?.accepted === true;
}

/* ── where the link points ──────────────────────────────────────────── */

/**
 * Where a link points.
 *
 * Exported because src/lib/application.ts mints links too, and "what is this
 * app's public address" is exactly rule 21's test: two surfaces MUST agree
 * about it, so it has one owner. A second reader of APP_URL with its own
 * trailing-slash handling is how a confirmation link and a sign-in link end up
 * pointing at two different hosts on the day somebody sets the variable with a
 * slash on the end.
 */
export function appUrl(): string {
  const url = process.env.APP_URL;
  if (!url) {
    throw new Error(
      "APP_URL is not set, so a sign-in link would point nowhere. See " +
        ".env.example — there is no local fallback by design."
    );
  }
  return url.replace(/\/+$/, "");
}

/* ── what the mail says ─────────────────────────────────────────────── */

/**
 * Three messages, two registers.
 *
 * The desk's note is INTERNAL: docs/copy-brief.md governs what a customer
 * reads, and this is a tool telling two people how to get into it, so it says
 * the thing plainly, minutes and all, and gets out of the way.
 *
 * The other two are customer-facing and obey the brief. No exclamation points,
 * no italics, nothing counted — a duration is a count, so the member's note
 * says the link is short lived without putting a number on it, and the page
 * she lands on if she is too late tells her what to do about it. Nothing
 * announces who or what reads anything: the house speaks as a house and does
 * not introduce its staff. The word the customer sees for /apply is never
 * "quiz".
 */

/** Internal. Two people, a tool, and the minutes said out loud. */
function deskLink(to: string, link: string): Mail {
  return {
    to,
    subject: "Your link to the desk",
    html: shell(
      [
        eyebrow("Revelle Soci&eacute;t&eacute; &middot; the desk"),
        heading("Your link to the desk"),
        button(link, "Open the desk"),
        line(`It works once and expires in ${SIGN_IN_TTL_MINUTES} minutes.`),
        aside(`${NOTHING_HAPPENED} You can ignore it.`),
      ].join("\n"),
      "Internal"
    ),
    text: [
      "REVELLE SOCIÉTÉ — THE DESK",
      "",
      "Your link to the desk:",
      link,
      "",
      `It works once and expires in ${SIGN_IN_TTL_MINUTES} minutes.`,
      NOTHING_HAPPENED,
    ].join("\n"),
  };
}

/** A member. The house, being brief. */
function memberLink(to: string, link: string): Mail {
  return {
    to,
    subject: "Your way in",
    html: shell(
      [
        eyebrow("Revelle Soci&eacute;t&eacute;"),
        heading("Your way in."),
        button(link, "Sign in"),
        line("It works once, and only for a short while."),
        aside(NOTHING_HAPPENED),
      ].join("\n"),
      FOOTER
    ),
    text: [
      "REVELLE SOCIÉTÉ",
      "",
      "Your way in:",
      link,
      "",
      "It works once, and only for a short while.",
      NOTHING_HAPPENED,
      "",
      FOOTER,
    ].join("\n"),
  };
}

/**
 * An applicant.
 *
 * She asked for a way in and there is not one yet. Silence would read as a
 * broken door, so she gets a note — and the note promises nothing, dates
 * nothing and says nothing about how a decision is made or by whom.
 */
function applicantNote(to: string): Mail {
  return {
    to,
    subject: "Your application",
    html: shell(
      [
        eyebrow("Revelle Soci&eacute;t&eacute;"),
        heading("Your application is with us."),
        line(
          "There is nothing to sign in to yet. When there is, this address is " +
            "where it arrives."
        ),
        aside(NOTHING_HAPPENED),
      ].join("\n"),
      FOOTER
    ),
    text: [
      "REVELLE SOCIÉTÉ",
      "",
      "Your application is with us.",
      "",
      "There is nothing to sign in to yet. When there is, this address is where it arrives.",
      "",
      NOTHING_HAPPENED,
      "",
      FOOTER,
    ].join("\n"),
  };
}
