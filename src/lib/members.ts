import "server-only";

import { redirect } from "next/navigation";

import { currentSubject } from "@/lib/auth";

/**
 * WHO IS IN THE PORTAL.
 *
 * The mirror of src/lib/staff.ts, and deliberately as small as that file's
 * guard half: one question ("is this a member, and which one"), one guard, and
 * nothing else. Both read the SAME session (src/lib/session.ts, db/015) and
 * differ only in which kind of subject they will accept.
 *
 * ── AN APPLICANT IS NOT A MEMBER ─────────────────────────────────────
 *
 * Enforced twice and in neither place as a courtesy. src/lib/login.ts will not
 * issue a link to an address whose `customer.accepted_at` is null, and
 * `stillAllowed` — which src/lib/auth.ts re-runs on EVERY request behind
 * currentSubject — refuses a session whose membership has gone away since. A
 * portal is not something that can be obtained by asking for one.
 *
 * ── WHAT IS NOT HERE ─────────────────────────────────────────────────
 *
 * No roles and no plan tiers. Dues, renewals and receipts (docs/portal-spec.md)
 * are their own table when they exist, and the question this module answers is
 * only "is this her".
 */

export type Member = {
  /** customer.id. */
  id: string;
  email: string;
  /** Her name, if anyone has recorded one. db/001 does not ask for it. */
  name: string | null;
};

/** The member signed in on this request, or null. */
export async function currentMember(): Promise<Member | null> {
  const subject = await currentSubject();
  if (!subject || subject.kind !== "member") return null;
  return { id: subject.id, email: subject.email, name: subject.name };
}

/**
 * THE GUARD.
 *
 * Called by the layout that wraps the whole portal, so that adding a page
 * under it cannot forget — and again inside every Server Action, because an
 * action is its own entry point and is reachable without rendering the page
 * whose form contains it. Next's own guidance is explicit about the second
 * half.
 */
export async function requireMember(): Promise<Member> {
  const member = await currentMember();
  // `redirect` is typed `never` and throws, so this narrows. Imported at the
  // top rather than dynamically: a dynamic import loses the `never` and
  // TypeScript then believes this function can return null.
  if (!member) redirect("/login");
  return member;
}
