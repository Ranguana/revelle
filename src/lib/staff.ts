import "server-only";

import { redirect } from "next/navigation";

import { currentSubject, endSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { isStaffEmail, staffAllowlist } from "@/lib/staff-allowlist";

/**
 * WHO IS AT THE DESK.
 *
 * Two people run Revelle from one screen, and everything they do at it is an
 * opinion: a curator override on a taste profile, a weight on a facet tag, a
 * voice published under a name. db/002 and db/004 both record WHO — and who is
 * worth nothing if both people are the same login. This module is the reason
 * that recording means something.
 *
 * ── WHAT MOVED, AND WHY ──────────────────────────────────────────────
 *
 * This file used to own the whole passwordless flow: minting a link, hashing
 * it, spending it, opening a session. The member portal needed the same thing,
 * and a second copy of it would have been the beginning of the end — two auth
 * systems in one codebase is how a hole survives, because each reviewer
 * assumes the other one is the real one and a fix lands on only one of them.
 *
 * So the mechanism was GENERALISED rather than copied. db/015 renamed the
 * desk's two tables instead of adding two more, and the flow now lives in:
 *
 *   src/lib/session.ts        the mechanism: tokens, sessions, hashing
 *   src/lib/login.ts          the policy: who gets a link, what it says
 *   src/lib/auth.ts           cookies, headers, the pool, the mailer
 *   src/lib/staff-allowlist.ts  STAFF_EMAILS, moved so testable code can read it
 *
 * The way in is /login for everybody. /desk/sign-in still works and redirects
 * there. What is left in this file is the part that is genuinely about the
 * desk: is this person staff, and what did she do.
 *
 * ── THE ALLOWLIST ────────────────────────────────────────────────────
 *
 * STAFF_EMAILS, comma separated, read in src/lib/staff-allowlist.ts and
 * re-exported here so every existing import still reads. IT FAILS CLOSED:
 * unset or empty means NOBODY is staff and the desk is unreachable. There is
 * one list and there must never be a second.
 *
 * ── WHAT IS NOT HERE ─────────────────────────────────────────────────
 *
 * No roles, no permissions, no groups. There are two people and they do the
 * same job; a permission model built for them would be built against no
 * evidence and would be wrong about a third person anyway. The only authority
 * question this module answers is "is this person staff".
 */

export { isStaffEmail, staffAllowlist };

export type Staff = {
  id: string;
  email: string;
  /** Display name, or the local part of the address if she has not set one. */
  name: string;
};

/* ── reading the session ────────────────────────────────────────────── */

/**
 * Who is signed in, or null.
 *
 * Delegates to `currentSubject`, which is `cache`d for the request — the
 * guarded layout, the page under it and every Server Action it renders all
 * ask, and all of them share one lookup. It also re-checks the allowlist and
 * `staff.status` on every request rather than trusting them from sign-in time:
 * removing an address from STAFF_EMAILS must end her session at the next
 * click, not in a fortnight.
 *
 * A member's session reaches this function and is refused by the `kind` check.
 * That is the point of one session table: a member wandering to /desk is not a
 * special case to remember, it is the same read returning the wrong sort of
 * person.
 */
export async function currentStaff(): Promise<Staff | null> {
  const subject = await currentSubject();
  if (!subject || subject.kind !== "staff") return null;
  return {
    id: subject.id,
    email: subject.email,
    name: subject.name ?? subject.email.split("@")[0],
  };
}

/**
 * THE GUARD.
 *
 * Called once, by the layout that wraps the entire signed-in segment, so that
 * adding a page under /desk cannot forget it — and again inside every Server
 * Action, because an action is its own entry point and reachable without
 * rendering the page that contains its form. Next's own guidance is explicit
 * about the second half: verify in the action, even when the form is only
 * rendered on an authenticated page.
 */
export async function requireStaff(): Promise<Staff> {
  const person = await currentStaff();
  // `redirect` is typed `never` and throws, so this narrows. It is imported at
  // the top of the file rather than dynamically: a dynamic import loses the
  // `never`, and TypeScript then believes this function can return null.
  if (!person) redirect("/login");
  return person;
}

/**
 * Sign out. Kept here as well as in src/lib/auth.ts so the desk's existing
 * action needs no rewiring; the work is done in one place.
 */
export async function signOut(): Promise<void> {
  await endSession();
}

/* ── attribution ────────────────────────────────────────────────────── */

export type ActionRecord = {
  /** Dotted, past tense: 'product.created', 'voice.published'. */
  action: string;
  entityTable?: string;
  entityId?: string;
  /** One sentence, for the activity list. */
  summary?: string;
  detail?: Record<string, unknown>;
};

/**
 * Write the ledger row.
 *
 * Never throws into the caller's path. A failure to record what somebody did
 * is worth a loud log line and is not worth losing the thing she did — the
 * change is the value, the record is the evidence, and dropping the first to
 * protect the second gets the priority backwards.
 */
export async function recordAction(
  staff: Staff,
  record: ActionRecord
): Promise<void> {
  try {
    await query(
      `insert into staff_action
         (staff_id, action, entity_table, entity_id, summary, detail)
       values ($1, $2, $3, $4, $5, $6::jsonb)`,
      [
        staff.id,
        record.action,
        record.entityTable ?? null,
        record.entityId ?? null,
        record.summary ?? "",
        JSON.stringify(record.detail ?? {}),
      ]
    );
  } catch (err) {
    console.error(
      `[staff] could not record ${record.action}`,
      err instanceof Error ? err.message : err
    );
  }
}

/**
 * THE LEDGER ROW FOR SOMETHING NO PERSON DID.
 *
 * db/036 made `staff_action.staff_id` nullable and added `actor` beside it,
 * tied by a CHECK: `(staff_id is null) = (actor <> 'staff')`. So "nobody, this
 * mechanism" is sayable without inventing a fake staff row, and
 * `staff_recent_activity` stays the list of things PEOPLE did while
 * `desk_activity` carries both.
 *
 * This exists so that a machine's act is written by the same function a
 * person's act is, into the same table, with the same failure behaviour.
 * CLAUDE.md rule 21: the ledger write has one owner. Before this, the only
 * system rows in the database were written by hand-rolled INSERTs in seeder
 * scripts, which is fine for a script and wrong for a server.
 *
 * ── AND WHY THE CALLER SUPPLIES THE ACTOR ────────────────────────────
 *
 * Because the desk has to be able to say WHICH mechanism. `auto:
 * catalogue-sync` names a run, `auto: pool-stocking` names the rows a run
 * offered, and `extract` names the model reading a member's photograph. A
 * single 'system' would collapse three different questions into one answer and
 * the screen would have to guess from the verb.
 */
export async function recordSystemAction(
  actor: string,
  record: ActionRecord
): Promise<void> {
  if (actor === "staff") {
    // db/036's CHECK would refuse this row anyway. Refusing it here says why.
    throw new Error(
      "recordSystemAction cannot write as 'staff' — that actor means a person " +
        "pressed something, and a person is recordAction's business."
    );
  }
  try {
    await query(
      `insert into staff_action
         (staff_id, actor, action, entity_table, entity_id, summary, detail)
       values (null, $1, $2, $3, $4, $5, $6::jsonb)`,
      [
        actor,
        record.action,
        record.entityTable ?? null,
        record.entityId ?? null,
        record.summary ?? "",
        JSON.stringify(record.detail ?? {}),
      ]
    );
  } catch (err) {
    console.error(
      `[${actor}] could not record ${record.action}`,
      err instanceof Error ? err.message : err
    );
  }
}
