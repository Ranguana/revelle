import { stamp } from "@/lib/desk/labels";
import { isAbandoned, openRun, syncEvents } from "@/lib/desk/catalogue-sync";
import { SYNC_DONE, SYNC_FAILED } from "@/lib/desk/catalogue";

import styles from "../../desk.module.css";
import { syncCatalogue } from "./sync";

/**
 * THE SYNC, AND WHAT THE LAST ONE DID.
 *
 * ── WHY THE HISTORY IS NOT OPTIONAL ──────────────────────────────────
 *
 * A button that reports only "done" is indistinguishable from a button that
 * reports nothing, which is how `seed:bank` stayed out of the deploy for weeks
 * while every check in the repo passed (CLAUDE.md rules 12 and 20). So the
 * control and the record of what it last did are one thing, not a button here
 * and a log somewhere else: the answer to "is the catalogue current?" has to
 * be readable at the moment of asking, by whoever is standing here.
 *
 * ── WHAT "STALE" IS NOT SAYING ───────────────────────────────────────
 *
 * The line below reports ELAPSED TIME and nothing more. It is not comparing
 * the catalogue against the seeder's source documents and does not know
 * whether anything has changed since. A sync three weeks old is not wrong if
 * nothing was authored in between. Saying "3 weeks ago" is honest; colouring
 * it red would be a claim this panel cannot support, and rule 16 counts an
 * unsupported claim as absorbing input it does not honour.
 */
export async function SyncPanel() {
  const events = await syncEvents();
  const open = events ? openRun(events) : null;
  const running = open !== null && !isAbandoned(open, new Date());
  const last = events?.find(
    (event) => event.action === SYNC_DONE || event.action === SYNC_FAILED
  );

  return (
    <section className={styles.panel}>
      <h2 className={styles.panelHead}>Sync the catalogue</h2>

      <p className={styles.note}>
        The seeders no longer ride along with a deploy. Pressing this runs them
        inside Render, on the private network, exactly as the pre-deploy command
        used to — and writes what happened into the ledger below, with your name
        on it. Safe to press twice: a seeder skips what already exists.
      </p>

      {events === null ? (
        <p className={styles.error}>
          The ledger could not be read, so this panel cannot say when the
          catalogue was last synced. That is this panel failing, not the
          catalogue being stale.
        </p>
      ) : last ? (
        <p className={styles.hint}>
          Last sync {stamp(last.at)}
          {last.action === SYNC_FAILED ? " — it failed." : "."} Elapsed time
          only; nothing here checks whether the sources have changed since.
        </p>
      ) : (
        <p className={styles.hint}>
          No sync has ever been recorded on this database.
        </p>
      )}

      {last && last.action === SYNC_FAILED ? (
        <p className={styles.error}>{last.summary}</p>
      ) : null}

      {running ? (
        <p className={styles.ok}>
          A sync started {stamp(open.at)} and has not reported back. The
          seeders are child processes of the route, so they keep going whether
          or not anyone is watching — reload and what they wrote appears below.
        </p>
      ) : null}

      <form action={syncCatalogue}>
        <div className={styles.buttonRow}>
          <button
            type="submit"
            className={styles.button}
            disabled={running}
            aria-disabled={running}
          >
            {running ? "A sync is running" : "Sync the catalogue"}
          </button>
        </div>
      </form>

      {last && last.steps.length > 0 ? (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Step</th>
              <th className={styles.numeric}>Exit</th>
              <th className={styles.numeric}>Seconds</th>
            </tr>
          </thead>
          <tbody>
            {last.steps.map((step) => (
              <tr key={`${last.entry}-${step.script}`}>
                <td>{step.script}</td>
                <td className={styles.numeric}>{step.code}</td>
                <td className={styles.numeric}>{Math.round(step.ms / 1000)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </section>
  );
}
