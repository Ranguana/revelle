import type { Metadata } from "next";

import { deskSummary } from "@/lib/desk/room";
import { requireStaff } from "@/lib/staff";

import styles from "../desk.module.css";
import Rail from "./Rail";
import { signOutAction } from "./actions";

/**
 * THE GUARD, AND THE SHELL.
 *
 * This layout wraps the ENTIRE signed-in segment, which is the point: adding a
 * page under /desk cannot forget to be protected, because there is nowhere to
 * add one that is not inside this file's subtree. src/proxy.ts turns a missing
 * cookie into a redirect before any of this renders, but the proxy is an
 * optimistic check by Next's own definition — the session is validated here,
 * against the database, on every request.
 *
 * Server Actions are checked separately, in each action, because an action is
 * its own entry point and is reachable without rendering the page whose form
 * calls it.
 */

export const metadata: Metadata = {
  title: { default: "The desk", template: "%s — the desk" },
  robots: { index: false, follow: false, nocache: true },
};

export default async function DeskLayout({ children }: LayoutProps<"/desk">) {
  const staff = await requireStaff();
  const summary = await deskSummary(staff);

  return (
    <div className={styles.shell}>
      <div className={styles.rail}>
        <Rail
          openTodos={summary.openTodos}
          unreadGeneral={summary.unreadGeneral}
        />
        <div className={styles.railFoot}>
          <div>{staff.name}</div>
          <form action={signOutAction}>
            <button className={styles.filter} type="submit">
              Sign out
            </button>
          </form>
        </div>
      </div>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
