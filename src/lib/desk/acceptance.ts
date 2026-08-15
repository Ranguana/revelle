import "server-only";

import { query, queryOne } from "@/lib/db";

/**
 * ACCEPTING AN APPLICANT — the one door, opened by hand.
 *
 * `customer.accepted_at` has existed since db/015 and until now NOTHING SET IT,
 * which meant nobody could become a member and nobody could reach the portal.
 * The column was correct and unwired; this is the wire.
 *
 * ── WHY IT IS ITS OWN ACT AND NOT A CONSEQUENCE OF ANYTHING ──────────
 *
 * db/015's author was explicit, and the sentence is worth repeating because it
 * is the whole design: acceptance is "deliberately NOT keyed on
 * quiz_response.status: 'in_progress' is desk workflow, and workflow must not
 * quietly grant a portal."
 *
 * That refusal is what this module implements. Moving an application to "in
 * progress" does not accept her. Approving a proposal does not accept her.
 * Delivering a Revelle does not accept her. Somebody presses a button that says
 * what it does, and a row lands in `staff_action` with her name on it.
 *
 * The temptation to infer it is real and it is worth naming: every one of those
 * three events is *correlated* with acceptance, and any of them would have been
 * a plausible trigger. But `accepted_at` is what src/lib/login.ts checks before
 * it will mail anybody a link and what src/lib/members.ts re-checks on every
 * single request. A workflow status that quietly grants a portal is a portal
 * granted by a dropdown, and nobody would be able to say afterwards who granted
 * it. db/015's own backfill made the same distinction: it keyed off the
 * existence of a `revelle` row — acceptance by conduct, a thing the house
 * actually did — and refused to key off status.
 *
 * ── WHERE THE ATTRIBUTION IS ─────────────────────────────────────────
 *
 * In `staff_action`, and deliberately not in a second column on `customer`.
 * db/011 built that ledger so that a change has an author, it is append-only
 * and cannot be edited by the person who wrote it, and it already carries the
 * entity anchor this needs. An `accepted_by` column would be a second record of
 * the same fact, and two records of one fact eventually disagree.
 *
 * ── NO REVOCATION ────────────────────────────────────────────────────
 *
 * There is deliberately no `unaccept` here, matching db/015: "There is no
 * evidence yet about what ending a membership means (does her archive stay
 * readable?), and guessing produces a column that has to be re-thought the
 * first time it is used." When it exists it is `ended_at` beside the column,
 * and src/lib/members.ts is the only read that has to learn about it.
 */

export type Membership = {
  customerId: string;
  email: string;
  /** ISO, or null. Null means she has applied and nothing more. */
  acceptedAt: string | null;
  /** Who pressed it, from the ledger. Null for a backfilled or old row. */
  acceptedBy: string | null;
};

export async function membership(
  customerId: string
): Promise<Membership | null> {
  const row = await queryOne<{
    id: string;
    email: string;
    accepted_at: Date | null;
    accepted_by: string | null;
  }>(
    `select c.id, c.email::text as email, c.accepted_at,
            (select coalesce(nullif(btrim(s.name), ''),
                             split_part(s.email::text, '@', 1))
               from staff_action a
               join staff s on s.id = a.staff_id
              where a.action = 'customer.accepted'
                and a.entity_table = 'customer'
                and a.entity_id = c.id
              order by a.created_at desc
              limit 1) as accepted_by
       from customer c
      where c.id = $1`,
    [customerId]
  );
  if (!row) return null;
  return {
    customerId: row.id,
    email: row.email,
    acceptedAt: row.accepted_at?.toISOString() ?? null,
    acceptedBy: row.accepted_by,
  };
}

export type AcceptOutcome =
  | { ok: true; email: string; acceptedAt: string }
  | { ok: false; reason: string };

/**
 * Take her on.
 *
 * `where accepted_at is null` rather than a read-then-write: two curators
 * pressing at the same moment must produce one acceptance with one date, and
 * the second must be able to tell that it did nothing rather than silently
 * moving the date forward. The date is when the house said yes, and it does not
 * move.
 */
export async function acceptApplicant(
  customerId: string
): Promise<AcceptOutcome> {
  const rows = await query<{ email: string; accepted_at: Date }>(
    `update customer
        set accepted_at = now()
      where id = $1 and accepted_at is null
     returning email::text as email, accepted_at`,
    [customerId]
  );

  if (rows.length === 0) {
    const already = await membership(customerId);
    return {
      ok: false,
      reason: already?.acceptedAt
        ? `${already.email} was already a member as of ` +
          `${already.acceptedAt.slice(0, 10)}` +
          (already.acceptedBy ? `, taken on by ${already.acceptedBy}.` : ".")
        : "There is no such customer.",
    };
  }

  return {
    ok: true,
    email: rows[0].email,
    acceptedAt: rows[0].accepted_at.toISOString(),
  };
}
