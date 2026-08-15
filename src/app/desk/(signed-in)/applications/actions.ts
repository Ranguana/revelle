"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { query, queryOne } from "@/lib/db";
import { acceptApplicant } from "@/lib/desk/acceptance";
import { APPLICATION_STATUS } from "@/lib/desk/labels";
import { clearNotice, setNotice } from "@/lib/desk/notice";
import {
  approveProposal,
  deliverRevelle,
  discardApproval,
  rejectProposal,
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
 * Below those, the five that decide what she actually receives: approving a
 * proposal, rejecting one, asking for another run, discarding an undelivered
 * Revelle, and delivering. And one that decides something else entirely —
 * accepting her as a member. See the note above `acceptApplicantAction`.
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
 * APPROVAL. Before it, a proposal; after it, a Revelle.
 *
 * Everything that could refuse is in src/lib/revelle/proposals.ts, inside one
 * transaction, on a locked row — the destination with no published voice, the
 * assemblage the engine withheld, the Revelle that already exists and has been
 * delivered. This function's whole job is the session, the ledger row and the
 * sentence.
 */
export async function approveProposalAction(form: FormData): Promise<void> {
  const staff = await requireStaff();
  const id = String(form.get("id") ?? "");
  const proposalId = String(form.get("proposal_id") ?? "");
  if (!ID.test(id) || !ID.test(proposalId)) return;

  const outcome = await approveProposal(proposalId, staff.id);
  if (outcome.ok) {
    await recordAction(staff, {
      action: "proposal.approved",
      entityTable: "quiz_response",
      entityId: id,
      summary: outcome.summary,
      detail: outcome.detail,
    });
  }
  await settle(id, outcome);
}

/**
 * "Not this one."
 *
 * The note is the reason this exists at all. docs/selection-spec.md is explicit
 * that a curator's correction is the highest-value observation in the system —
 * "rejecting a dithered candidate is itself signal" — and a rejection with no
 * reason attached teaches nothing. Optional rather than required, because a
 * curator with no words for it should not be blocked from moving on.
 */
export async function rejectProposalAction(form: FormData): Promise<void> {
  const staff = await requireStaff();
  const id = String(form.get("id") ?? "");
  const proposalId = String(form.get("proposal_id") ?? "");
  if (!ID.test(id) || !ID.test(proposalId)) return;

  const raw = String(form.get("note") ?? "").trim();
  const outcome = await rejectProposal(
    proposalId,
    staff.id,
    raw.length > 0 ? raw : null
  );
  if (outcome.ok) {
    await recordAction(staff, {
      action: "proposal.rejected",
      entityTable: "quiz_response",
      entityId: id,
      summary: outcome.summary,
      detail: outcome.detail,
    });
  }
  await settle(id, outcome);
}

/**
 * "Show me another set."
 *
 * NOT the only path to a proposal, and it must never become one: generation is
 * automatic and happens in the same transaction as the application (see
 * src/app/api/quiz/route.ts). This is the second half of "approve one, or
 * reject it and ask for another".
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
 * Undo an approval — and THE PLACE THE RATCHET IS FELT.
 *
 * An undelivered Revelle is disposable and db/003 says so at length: drafts and
 * previews may collide with anything, in any number, because nobody has them.
 * A DELIVERED one is not, and this refuses. `first_delivered_at` is the test,
 * so archiving it does not release it either.
 */
export async function discardRevelleAction(form: FormData): Promise<void> {
  const staff = await requireStaff();
  const id = String(form.get("id") ?? "");
  if (!ID.test(id)) return;

  const outcome = await discardApproval(id, staff.id);
  if (outcome.ok) {
    await recordAction(staff, {
      action: "revelle.discarded",
      entityTable: "quiz_response",
      entityId: id,
      summary: outcome.summary,
      detail: outcome.detail,
    });
  }
  await settle(id, outcome);
}

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
