import Link from "next/link";

import { query } from "@/lib/db";
import { stamp } from "@/lib/desk/labels";

import styles from "../../desk.module.css";
import Thread from "../Thread";
import { Head } from "../bits";

/**
 * The general thread, and everything either of them has done lately.
 *
 * The activity list is `staff_recent_activity` (db/011) — the attribution
 * ledger with a name attached. It is the answer to "who changed this", and it
 * only means anything because the two of them sign in as themselves.
 *
 * THAT VIEW IS THE HUMAN HALF OF THE LEDGER AND NOT ALL OF IT. Since db/036 a
 * seeder can act too, with `staff_id` null and `actor` naming the machine, and
 * db/038 made the exclusion explicit: `staff_recent_activity` is
 * `desk_activity` filtered to `actor = 'staff'`. That is the right half HERE —
 * this panel is "what have the two of them been doing", and a row with nobody
 * to name in the Who column would be answering a different question. What the
 * catalogue did to itself is /desk/stocked.
 */

export const dynamic = "force-dynamic";

type Activity = {
  id: string;
  created_at: string;
  action: string;
  entity_table: string | null;
  entity_id: string | null;
  summary: string;
  staff_email: string;
  staff_name: string | null;
};

export default async function ThreadPage() {
  const activity = await query<Activity>(
    `select id::text as id, created_at, action, entity_table,
            entity_id::text as entity_id, summary, staff_email, staff_name
       from staff_recent_activity
      order by created_at desc
      limit 60`
  );

  return (
    <>
      <Head eyebrow="Between us" title="The thread" />

      <div className={styles.panels}>
        <Thread subject={null} back="/desk/thread" title="Everything else" />

        <section className={styles.panel}>
          <h2 className={styles.panelHead}>
            <span>What has been done</span>
            <span>and by whom</span>
          </h2>
          {activity.length === 0 ? (
            <p className={styles.hint}>Nothing recorded yet.</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Who</th>
                  <th>What</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {activity.map((row) => (
                  <tr key={row.id}>
                    <td>{row.staff_name ?? row.staff_email}</td>
                    <td>
                      <div className={styles.numeric}>{row.action}</div>
                      {row.summary ? <div>{row.summary}</div> : null}
                      {row.entity_table === "world" && row.entity_id ? (
                        <Link
                          className={styles.link}
                          href={`/desk/destinations/${row.entity_id}`}
                        >
                          open
                        </Link>
                      ) : null}
                    </td>
                    <td className={styles.numeric}>{stamp(row.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </>
  );
}
