"use server";

import { revalidatePath } from "next/cache";

import { query, queryOne } from "@/lib/db";
import { APPLICATION_STATUS } from "@/lib/desk/labels";
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
 */

const STATUSES = Object.keys(APPLICATION_STATUS);

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
