import "server-only";

import { cookies, headers } from "next/headers";
import { cache } from "react";

import {
  APPLICATION_COOKIE,
  PASS_TTL_DAYS,
  beginApplication,
  confirmApplication,
  readPass,
  type Applicant,
  type BeginOutcome,
  type ConfirmOutcome,
} from "@/lib/application";
import { pool, transaction } from "@/lib/db";
import { EmailNotConfiguredError, sendEmail } from "@/lib/email";
import {
  redeemLink,
  requestLink,
  stillAllowed,
  type ClickOutcome,
  type Deliver,
  type LinkOutcome,
  type Mail,
} from "@/lib/login";
import { clientAddress } from "@/lib/rate-limit";
import {
  COOKIE,
  SESSION_TTL_DAYS,
  revokeAllForSubject,
  revokeSession,
  subjectForSession,
  type Subject,
} from "@/lib/session";

/**
 * WHERE THE FRAMEWORK MEETS THE DOOR.
 *
 * src/lib/session.ts is the mechanism, src/lib/login.ts is the policy, and
 * both are framework-free so `node --test` can run them. This file is the
 * thin part that cannot be: it reads the request's headers, it opens the pool,
 * it sets and clears the cookie, and it hands the mailer over. It contains no
 * decisions — every branch worth testing is in the two modules below it.
 *
 * That split is the reason the security tests are real tests and not prose.
 */

/* ── asking for a link ──────────────────────────────────────────────── */

/**
 * Send Resend the message src/lib/login.ts composed.
 *
 * The one exception to "never log a token" lives here, gated on NOT being
 * production and unchanged from what the desk already did: with no API key
 * there is no other way to sign in on a laptop, and the server log is already
 * a developer surface. In production a missing key is a fault to fix and the
 * link is never printed.
 */
const deliverByEmail: Deliver = async (mail: Mail) => {
  try {
    await sendEmail({
      to: mail.to,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      replyTo: process.env.MAIL_REPLY_TO || undefined,
    });
  } catch (err) {
    if (
      err instanceof EmailNotConfiguredError &&
      process.env.NODE_ENV !== "production"
    ) {
      const link = mail.text.match(/https?:\/\/\S+/)?.[0];
      console.warn(`[login] ${err.message}. For development only:`);
      console.warn(`[login]   ${link ?? "(this message carries no link)"}`);
      return;
    }
    throw err;
  }
};

/**
 * The request path, with the request attached.
 *
 * The caller gets an outcome that says nothing about who the address belongs
 * to — see the rule at the top of src/lib/login.ts — and must render one
 * sentence for every `ok: true`.
 */
export async function askForLink(email: string): Promise<LinkOutcome> {
  const head = await headers();
  return requestLink(
    pool(),
    {
      email,
      ip: clientAddress(head.get("x-forwarded-for")),
      userAgent: head.get("user-agent"),
    },
    deliverByEmail
  );
}

/* ── spending one ───────────────────────────────────────────────────── */

/**
 * The click.
 *
 * Wrapped in a transaction so the consuming update and the session insert are
 * one fact: a failure between them would spend a link and open nothing, and
 * the person would be told to ask for another link she had already used.
 *
 * The cookie is set AFTER the transaction commits, because a cookie for a
 * session that got rolled back is a cookie that fails on every request until
 * it expires.
 */
export async function spendLink(raw: string): Promise<ClickOutcome> {
  const head = await headers();
  const context = {
    ip: clientAddress(head.get("x-forwarded-for")),
    userAgent: head.get("user-agent"),
  };

  const outcome = await transaction((client) => redeemLink(client, raw, context));
  if (!outcome.ok) return outcome;

  const store = await cookies();
  store.set(COOKIE, outcome.sessionToken, {
    httpOnly: true,
    // The link is clicked from a mail client, which is a cross-site top-level
    // navigation. 'strict' would drop the cookie on exactly that request.
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
  });

  return outcome;
}

/* ── reading one ────────────────────────────────────────────────────── */

/**
 * Who is signed in, or null. Staff or member — the caller narrows.
 *
 * `cache` deduplicates within one request: a layout, the page under it and
 * every Server Action it renders all ask, and all of them should share one
 * lookup.
 *
 * AUTHORITY IS RE-READ HERE, on every request, and not trusted from sign-in
 * time. An address removed from STAFF_EMAILS, or a membership that has ended,
 * ends the session at her next click rather than in a fortnight.
 */
export const currentSubject = cache(async (): Promise<Subject | null> => {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;

  const subject = await subjectForSession(pool(), raw);
  if (!subject) return null;

  if (!(await stillAllowed(pool(), subject))) return null;

  return subject;
});

/* ── applying ───────────────────────────────────────────────────────── */

/**
 * THE OTHER DOOR, and it is not a door at all.
 *
 * Applying is not signing in and nothing below opens a session. The three
 * functions here are the same thin framework layer as the three above them —
 * headers in, pool opened, cookie set, mailer handed over — and every decision
 * they carry is in src/lib/application.ts where `node --test` can reach it.
 *
 * The cookie is APPLICATION_COOKIE, deliberately not COOKIE. A browser may
 * hold both: a member who is signed in and is also part way through applying
 * for a second occasion is an ordinary case, and one cookie holding either
 * meaning would be a bug waiting for that person.
 */

/**
 * Begin an application, or ask for the note again.
 *
 * One function for both, because they are the same act: the second is the
 * first with an address she has already given. It returns the outcome and
 * SETS THE PASS COOKIE on the way, so the browser she typed into can carry on
 * to the questions the moment the address is confirmed anywhere.
 */
export async function beginApplying(email: string): Promise<BeginOutcome> {
  const head = await headers();
  const outcome = await beginApplication(
    pool(),
    {
      email,
      ip: clientAddress(head.get("x-forwarded-for")),
      userAgent: head.get("user-agent"),
    },
    deliverByEmail
  );

  if (outcome.ok) await setPassCookie(outcome.pass);
  return outcome;
}

/**
 * Press the button in the note.
 *
 * Wrapped in a transaction for the reason `spendLink` is: consuming the note,
 * marking the address and minting the pass are one fact, and a failure between
 * them would burn her note and give her nothing back. The cookie is set after
 * the commit, because a cookie for a pass that got rolled back is a cookie
 * that fails on every request until it expires.
 */
export async function confirmApplying(token: string): Promise<ConfirmOutcome> {
  const head = await headers();
  const context = {
    ip: clientAddress(head.get("x-forwarded-for")),
    userAgent: head.get("user-agent"),
  };

  const outcome = await transaction((client) =>
    confirmApplication(client, token, context)
  );
  if (!outcome.ok) return outcome;

  await setPassCookie(outcome.pass);
  return outcome;
}

/**
 * Whose application this browser is carrying, or null.
 *
 * `cache` deduplicates within one request, as `currentSubject` does — the page
 * asks, and so does any Server Action it renders.
 *
 * Whether her address is CONFIRMED is re-read from the customer row on every
 * call and never cached on the pass. That is what lets the browser holding her
 * answers come good the moment the note is opened somewhere else.
 */
export const currentApplicant = cache(async (): Promise<Applicant | null> => {
  const raw = (await cookies()).get(APPLICATION_COOKIE)?.value;
  if (!raw) return null;
  return readPass(pool(), raw);
});

async function setPassCookie(pass: string): Promise<void> {
  const store = await cookies();
  store.set(APPLICATION_COOKIE, pass, {
    httpOnly: true,
    // The note is opened from a mail client, which is a cross-site top-level
    // navigation. 'strict' would drop the cookie on exactly that request —
    // the same reason the session cookie is 'lax'.
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: PASS_TTL_DAYS * 24 * 60 * 60,
  });
}

/* ── leaving ────────────────────────────────────────────────────────── */

/**
 * Sign out, for real.
 *
 * The revoke is the part that matters and the cookie deletion is the
 * courtesy: a cookie that was copied before she clicked has to stop working,
 * and only a row in the database can stop it.
 */
export async function endSession(): Promise<void> {
  const store = await cookies();
  const raw = store.get(COOKIE)?.value;
  if (raw) await revokeSession(pool(), raw);
  store.delete(COOKIE);
}

/**
 * Every browser she has ever signed in on. Not wired to a screen yet; it is
 * here because "I left it signed in somewhere" is the thing a passwordless
 * system has instead of "change my password", and the answer to it should not
 * have to be written under pressure.
 */
export async function endAllSessions(subject: Subject): Promise<void> {
  await revokeAllForSubject(pool(), subject);
}
