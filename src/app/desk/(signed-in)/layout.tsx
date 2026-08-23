import type { Metadata } from "next";

import { deskSummary } from "@/lib/desk/room";
import { schemaPosition } from "@/lib/desk/schema";
import { requireStaff } from "@/lib/staff";

import styles from "../desk.module.css";
import Rail from "./Rail";
import { SchemaBanner, SchemaFoot } from "./SchemaBanner";
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
 *
 * ── AND THE ONE FACT THAT IS TRUE OF EVERY SCREEN UNDER IT ──────────
 *
 * WHERE THE DATABASE STANDS. It is read here, once, for the same reason the
 * guard is here: there is nowhere to add a page that escapes this file. A
 * database stuck at db/032 does not make one list wrong and the rest right, it
 * makes every list in the tool a report about a schema weeks out of date — so
 * the fact belongs to the shell, not to a page somebody would have to think to
 * open. See SchemaBanner.tsx for the argument, and src/lib/desk/schema.ts for
 * why it can never throw.
 */

export const metadata: Metadata = {
  title: { default: "The desk", template: "%s — the desk" },
  robots: { index: false, follow: false, nocache: true },
};

export default async function DeskLayout({ children }: LayoutProps<"/desk">) {
  const staff = await requireStaff();
  const summary = await deskSummary(staff);
  const schema = await schemaPosition();

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
          <SchemaFoot state={schema} />
        </div>
      </div>
      <main className={styles.main}>
        <SchemaBanner state={schema} />
        {children}
      </main>
    </div>
  );
}
