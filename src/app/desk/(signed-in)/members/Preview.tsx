import Link from "next/link";
import { notFound } from "next/navigation";

import { readMember, type MemberHead } from "@/lib/desk/members";
import { recordAction, requireStaff, type Staff } from "@/lib/staff";

import styles from "./preview.module.css";

/**
 * THE READ-ONLY PORTAL PREVIEW — the frame around it, and the record of it.
 *
 * ── THIS IS NOT IMPERSONATION, AND THE DIFFERENCE IS STRUCTURAL ──────
 *
 * No session is created, no cookie is set, nothing is signed in as her, and
 * there is no code path here that could be talked into any of the three. What
 * these screens do is READ her rows through the portal's own reads — which
 * take a customer id as an argument (src/lib/portal/occasions.ts) rather than
 * pulling one out of a session — and draw them. `requireStaff()` guards the
 * segment through the layout and is called again here, at every entry point,
 * for the reason src/lib/staff.ts gives: a guard on a layout is a guard on
 * rendering, and rendering is not the only way in.
 *
 * If impersonation is ever built, it is built beside this and not out of it,
 * and the ledger row below is already the thing it would need.
 *
 * ── WHY OPENING IT IS RECORDED ───────────────────────────────────────
 *
 * Because reading somebody's private screen is an act. It changes nothing,
 * which is exactly why it would otherwise leave no trace at all — and "who has
 * looked at her portal" is a question that has an answer or it does not. db/011
 * built `staff_action` append-only so that a record of what somebody did is
 * worth something; this is a use of it that has no change attached, and that
 * is the point rather than an exception.
 *
 * `recordAction` never throws into the caller (see src/lib/staff.ts): a ledger
 * that is down must not take the desk down with it.
 */

/** What was opened. Kept small — it is a URL, not a payload. */
export type Opened =
  | { at: "shelf" }
  | { at: "occasion"; revelleId: string };

/**
 * The one entry point. Guard, load, record, in that order.
 *
 * A non-member — an applicant, a stranger, a typo — is `notFound()`, from
 * `readMember`'s own predicate rather than a check bolted on afterwards. She
 * has no portal, so there is no portal of hers to preview, and there is
 * nothing here to acknowledge the existence of.
 */
export async function openPreview(
  customerId: string,
  opened: Opened
): Promise<{ staff: Staff; member: MemberHead }> {
  const staff = await requireStaff();

  const member = await readMember(customerId);
  if (!member) notFound();

  await recordAction(staff, {
    action: "member.portal_previewed",
    entityTable: "customer",
    entityId: member.id,
    summary:
      `Looked at ${member.email}'s portal — read-only preview, ` +
      `${opened.at === "shelf" ? "her shelf" : "one occasion"}`,
    detail:
      opened.at === "shelf"
        ? { customerId: member.id, at: "shelf" }
        : { customerId: member.id, at: "occasion", revelleId: opened.revelleId },
  });

  return { staff, member };
}

/**
 * THE BANNER. Persistent, sticky, and not subtle.
 *
 * It names her, says what this is, and says the three things somebody standing
 * behind the founder's chair would otherwise have to guess: that nothing on the
 * page acts for her, that nothing was written, and that she has not been told.
 * The last line says the reading was recorded, because a record nobody knows
 * about is a record that surprises somebody later.
 */
export function PreviewBanner({
  member,
  staff,
  back,
}: {
  member: MemberHead;
  staff: Staff;
  /** Where "leave the preview" goes. */
  back: string;
}) {
  const called = member.name ?? member.email;

  return (
    <div className={styles.banner}>
      <span className={styles.mark}>Read-only preview</span>
      <p className={styles.who}>
        This is {called}&rsquo;s portal.{" "}
        <span className={styles.address}>{member.email}</span>
      </p>
      <p className={styles.said}>
        You are looking at what she sees, drawn from her own rows. Nothing here
        acts on her behalf: every control is switched off, nothing can be
        written, and no message has been sent. She has not been notified that it
        was opened, and opening it has not signed you in as her.
      </p>
      <p className={styles.foot}>
        <span>
          Opened by {staff.name}, and recorded on her record at the desk.
        </span>
        <Link className={styles.back} href={back}>
          Leave the preview
        </Link>
      </p>
    </div>
  );
}

/**
 * The previewed portal itself, inside the second lock.
 *
 * See the note on `.inert` in preview.module.css: the markup inside is written
 * to contain no form at all, and this is the guard against the edit that
 * eventually pastes one in.
 */
export function Inert({ children }: { children: React.ReactNode }) {
  return (
    <fieldset className={styles.inert} disabled>
      {children}
    </fieldset>
  );
}

/** A control of hers the preview does not carry, said in words. */
export function Stopped({ children }: { children: React.ReactNode }) {
  return <p className={styles.stopped}>{children}</p>;
}
