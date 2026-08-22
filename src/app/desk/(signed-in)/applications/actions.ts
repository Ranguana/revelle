"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { query, queryOne } from "@/lib/db";
import { acceptApplicant } from "@/lib/desk/acceptance";
import { APPLICATION_STATUS } from "@/lib/desk/labels";
import { clearNotice, setNotice } from "@/lib/desk/notice";
import {
  deliverRevelle,
  requestGeneration,
  type Outcome,
} from "@/lib/desk/proposals";
import { recordAction, requireStaff } from "@/lib/staff";

/**
 * What the desk may change about an application.
 *
 * Almost nothing, and that is the design. `quiz_response` is append-only (see
 * the trigger in db/001): her answers are the evidentiary record of what she
 * submitted against the question set she was shown, and the desk cannot edit
 * them at all — the database refuses. Three columns are exempt and each is a
 * fact the house LEARNS rather than something she said:
 *
 *   status                  staff workflow
 *   event_date              from the reply email
 *   guest_count_confirmed   the real number, once there is one. NOT her answer,
 *                           which is guest_count_band and is frozen (db/006).
 *
 * Below those, what is left of the five that used to decide what she actually
 * receives. Three of them are gone: APPROVING a proposal, REJECTING one, and
 * DISCARDING an undelivered Revelle so it could be chosen again. There is no
 * curator — the engine ranks, she is shown two or three, she taps one, and her
 * pick is the record — so an action whose only job was to decide, un-decide or
 * re-decide one member's Revelle from this side of the screen has nothing left
 * to do. The argument each of them carried is preserved where it was made:
 * approve and reject in the header of applications/[id]/Proposals.tsx, discard
 * beside the panel it lived in on applications/[id]/page.tsx.
 *
 * Two survive, because neither decides WHAT she gets:
 *
 *   regenerateAction        a repair for a run that produced nothing she could
 *                           be shown. Hidden once anything of hers exists.
 *   deliverRevelleAction    WHEN she gets what she chose, and the transition
 *                           that arms db/003's ratchet.
 *
 * And one that decides something else entirely — accepting her as a member.
 * See the note above `acceptApplicantAction`. That one is the CATALOGUE GATE's
 * cousin and is untouched by any of this: deciding what the house may offer,
 * and to whom it opens at all, remains ours.
 *
 * EVERY ACTION RE-CHECKS THE SESSION. A Server Action is its own entry point
 * and is reachable without rendering the page whose form calls it, so the
 * layout's guard is not enough; Next's own forms guide says exactly this and
 * src/lib/desk/room.ts's actions already work this way.
 */

const STATUSES = Object.keys(APPLICATION_STATUS);

const ID = /^[0-9a-f-]{36}$/i;

/**
 * Finish an action: leave a sentence if it refused, and land back on the page.
 *
 * The refusal mechanism itself — and the argument for a cookie rather than a
 * query string or a client component — is in src/lib/desk/notice.ts.
 */
async function settle(id: string, outcome: Outcome): Promise<never> {
  if (outcome.ok) {
    await clearNotice();
  } else {
    await setNotice(id, outcome.reason);
  }
  revalidatePath(`/desk/applications/${id}`);
  revalidatePath("/desk");
  redirect(`/desk/applications/${id}`);
}

export async function setApplicationStatus(form: FormData): Promise<void> {
  const staff = await requireStaff();

  const id = String(form.get("id") ?? "");
  const status = String(form.get("status") ?? "");
  if (!STATUSES.includes(status)) return;

  const before = await queryOne<{ status: string; email: string }>(
    `select qr.status::text as status, c.email::text as email
       from quiz_response qr join customer c on c.id = qr.customer_id
      where qr.id = $1`,
    [id]
  );
  if (!before || before.status === status) return;

  await query(`update quiz_response set status = $2::quiz_status where id = $1`, [
    id,
    status,
  ]);

  await recordAction(staff, {
    action: "application.status_changed",
    entityTable: "quiz_response",
    entityId: id,
    summary: `${before.email}: ${APPLICATION_STATUS[before.status]} → ${APPLICATION_STATUS[status]}`,
    detail: { from: before.status, to: status },
  });

  revalidatePath("/desk");
  revalidatePath(`/desk/applications/${id}`);
}

/** The two facts staff fill in from the reply email. */
export async function setApplicationFacts(form: FormData): Promise<void> {
  const staff = await requireStaff();

  const id = String(form.get("id") ?? "");
  const rawDate = String(form.get("event_date") ?? "").trim();
  const rawGuests = String(form.get("guest_count_confirmed") ?? "").trim();

  const eventDate = rawDate.length > 0 ? rawDate : null;
  const guests = rawGuests.length > 0 ? Number(rawGuests) : null;
  if (guests !== null && (!Number.isInteger(guests) || guests < 1)) return;

  await query(
    `update quiz_response
        set event_date = $2::date, guest_count_confirmed = $3
      where id = $1`,
    [id, eventDate, guests]
  );

  await recordAction(staff, {
    action: "application.facts_recorded",
    entityTable: "quiz_response",
    entityId: id,
    summary: `Date ${eventDate ?? "—"}, ${guests ?? "—"} confirmed guests`,
    detail: { eventDate, guests },
  });

  revalidatePath(`/desk/applications/${id}`);
  revalidatePath("/desk");
}

/* ── what she actually receives ───────────────────────────────────── */

/**
 * REMOVED: `approveProposalAction` and `rejectProposalAction`.
 *
 * Approval was the moment a proposal became a Revelle and rejection was "not
 * this one", with an optional note that docs/selection-spec.md called the
 * highest-value observation in the system. Both were a curator deciding one
 * member's Revelle, and that is the loop the human left. The reasoning, and
 * what the change cost in prose, is kept in the header of
 * applications/[id]/Proposals.tsx where the two forms were.
 *
 * `approveProposal` and `rejectProposal` in src/lib/desk/proposals.ts — and
 * `approve`/`reject` under them in src/lib/revelle/proposals.ts — are NOT
 * removed with these. They are the write path a member's pick has to travel
 * too, they carry every refusal that matters (no published voice, a blocked
 * assemblage, a Revelle that already exists), and they are covered by
 * src/lib/revelle/proposals.db.test.ts. What is gone is the desk's door to
 * them, not the machinery behind it.
 */

/**
 * "Show me another set."
 *
 * NOT the only path to a proposal, and it must never become one: generation is
 * automatic and happens in the same transaction as the application (see
 * src/app/api/quiz/route.ts).
 *
 * It used to be the second half of "approve one, or reject it and ask for
 * another", and that sentence no longer has a first half. What it is for now is
 * narrower and is enforced by the UI that calls it: a run that left her with
 * nothing to be shown — failed, impasse, empty. Regenerating supersedes the
 * whole live set, so offering it once she has been shown candidates would be
 * taking back an offer, and the form is hidden the moment there is a pick or a
 * Revelle. `requestGeneration` already refuses outright after delivery.
 */
export async function regenerateAction(form: FormData): Promise<void> {
  const staff = await requireStaff();
  const id = String(form.get("id") ?? "");
  if (!ID.test(id)) return;

  const outcome = await requestGeneration(id);
  if (outcome.ok) {
    await recordAction(staff, {
      action: "proposal.requested",
      entityTable: "quiz_response",
      entityId: id,
      summary: outcome.summary,
      detail: outcome.detail,
    });
  }
  await settle(id, outcome);
}

/**
 * REMOVED: `discardRevelleAction`.
 *
 * "Discard and choose again" — undo an approval so a curator could pick a
 * different candidate, free until delivery and impossible after it, because
 * `first_delivered_at` is db/003's ratchet. Every word of that is still true;
 * what changed is whose choice the button would throw away. Approval is not a
 * curator's any more, so discarding could only un-decide HER pick and hand the
 * choice back to the house. The argument is preserved beside the panel it lived
 * in, in applications/[id]/page.tsx.
 *
 * `discardApproval` in src/lib/desk/proposals.ts is left in place. It is the
 * only correct way to release an undelivered Revelle, it is tested, and a
 * pick-first flow that has to undo one before delivery will need exactly it.
 * What it must never grow back is a button on this desk.
 */

/**
 * DELIVERY. The last thing anyone can undo, and after it nothing.
 *
 * The database does the work: db/003's guard stamps the ratchet and refuses a
 * repeated assemblage in a sentence naming the other Revelle, and db/004's
 * guard pins the voice it was written in and freezes it. This adds one check on
 * the way out — a Revelle that came through with no pinned voice was issued in
 * no voice at all, and is rolled back rather than delivered.
 */
export async function deliverRevelleAction(form: FormData): Promise<void> {
  const staff = await requireStaff();
  const id = String(form.get("id") ?? "");
  const revelleId = String(form.get("revelle_id") ?? "");
  if (!ID.test(id) || !ID.test(revelleId)) return;

  const outcome = await deliverRevelle(revelleId);
  if (outcome.ok) {
    await recordAction(staff, {
      action: "revelle.delivered",
      entityTable: "revelle",
      entityId: revelleId,
      summary: outcome.summary,
      detail: outcome.detail,
    });
  }
  await settle(id, outcome);
}

/* ── the one door ─────────────────────────────────────────────────── */

/**
 * TAKING HER ON.
 *
 * `customer.accepted_at` has existed since db/015 and nothing set it, so nobody
 * could become a member and nobody could reach the portal. This is the button.
 *
 * It is deliberately NOT a consequence of anything else on this page. Setting
 * the status to "in progress" does not do it; approving a proposal does not do
 * it; delivering does not do it. db/015's author refused to key acceptance off
 * workflow in as many words — "workflow must not quietly grant a portal" —
 * because `accepted_at` is what src/lib/login.ts checks before mailing anybody
 * a link and what src/lib/members.ts re-checks on every request. A portal
 * granted by a dropdown is a portal nobody can say they granted.
 *
 * Deliberate: its own form, its own button, its own words.
 * Recorded: a `staff_action` row, append-only, which is also where the "who"
 *           is read back from — see src/lib/desk/acceptance.ts.
 * Attributed: `requireStaff()`, like everything else here.
 */
export async function acceptApplicantAction(form: FormData): Promise<void> {
  const staff = await requireStaff();
  const id = String(form.get("id") ?? "");
  const customerId = String(form.get("customer_id") ?? "");
  if (!ID.test(id) || !ID.test(customerId)) return;

  const outcome = await acceptApplicant(customerId);
  if (!outcome.ok) {
    await settle(id, outcome);
    return;
  }

  await recordAction(staff, {
    action: "customer.accepted",
    entityTable: "customer",
    entityId: customerId,
    summary: `${outcome.email} is a member as of ${outcome.acceptedAt.slice(0, 10)}`,
    detail: { customerId, acceptedAt: outcome.acceptedAt, fromApplication: id },
  });

  await settle(id, { ok: true, summary: "", detail: {} });
}
