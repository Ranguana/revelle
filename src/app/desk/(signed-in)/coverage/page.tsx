import Link from "next/link";

import { board } from "@/lib/desk/coverage";
import { WORLD_STATUS } from "@/lib/desk/labels";

import styles from "../../desk.module.css";
import { Empty, Head, Status } from "../bits";

/**
 * THE COVERAGE BOARD.
 *
 * ── WHY THIS IS NOT A BOARD OF APPLICATIONS ──────────────────────────
 *
 * A kanban of hosts moving from new to in progress to delivered is the right
 * shape LATER, and it is the wrong shape now, for one reason: there are no
 * customers. A board of cards with no cards on it is a screen that teaches
 * nobody anything, and building one now would freeze a workflow around
 * guesses — how many columns, where a proposal sits versus a Revelle, what
 * "delivered" means when db/003 makes delivery a ratchet. The desk already has
 * the surface that triage needs (/desk, the inbox) and it holds one row per
 * application, which is one more row than the shape is worth today.
 *
 * The thing that DOES need a board is the library. Thirteen destinations exist,
 * every one of them is half-finished in a different way, and until now the only
 * way to know which way was to open each of them and read.
 *
 * ── EVERY CELL IS DERIVED, AND EVERY CELL IS A LINK ──────────────────
 *
 * Derived from the rows as they stand, using the engine's own eligibility
 * rules — see src/lib/desk/coverage.ts. A hand-kept checklist would be a second
 * catalogue and would be the one people believed on the day it was wrong.
 *
 * The link is not decoration: a thin column is only useful if the thing that
 * would fill it is one click away.
 */

export const dynamic = "force-dynamic";

export default async function CoveragePage() {
  const { columns, rows } = await board();

  return (
    <>
      <Head eyebrow="The library" title="Coverage">
        <Link href="/desk/bench" className={styles.filter}>
          The test bench
        </Link>
        <Link href="/desk/matrix" className={styles.filter}>
          The connections
        </Link>
      </Head>

      <p className={styles.note}>
        Every destination against the standard in docs/new-destination.md. The
        making spread is the one that gets missed: a destination whose menus are
        all made by hand still matches a host who said she wants everything to
        arrive finished — her answer weights the pool, it never filters it — and
        she opens the table to find nothing on it she can have.
      </p>

      <p className={styles.note}>
        <strong>Unclaimed</strong> under occasion means nothing scoped here has
        said which occasion it is for, so every menu is eligible for all of them
        and the table is the same at a long dinner and at standing drinks. That
        is the correct default for a catalogue that starts empty — no claim, no
        restriction — and it is also an axis nobody has tagged yet.
      </p>

      {rows.length === 0 ? (
        <Empty>
          No destinations. <code>npm run seed:destinations</code> moves the
          hand-authored ones out of src/lib/destinations.ts.
        </Empty>
      ) : (
        <table className={styles.board}>
          <thead>
            <tr>
              <th>Destination</th>
              {columns.map((column) => (
                <th key={column.key}>{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <Link
                    href={`/desk/destinations/${row.id}`}
                    className={styles.whoEmail}
                  >
                    {row.name}
                  </Link>
                  <div className={styles.when}>{row.tagline}</div>
                  {row.status === "published" ? null : (
                    <Status
                      code={row.status}
                      label={WORLD_STATUS[row.status] ?? row.status}
                    />
                  )}
                </td>
                {columns.map((column) => {
                  const cell = row.cells[column.key];
                  return (
                    <td key={column.key}>
                      <Link
                        href={cell.href}
                        className={`${styles.boardCell} ${
                          cell.state === "filled"
                            ? styles.boardFilled
                            : cell.state === "thin"
                              ? styles.boardThin
                              : styles.boardEmpty
                        }`}
                      >
                        {cell.value}
                        {cell.what ? (
                          <span className={styles.boardWhat}>{cell.what}</span>
                        ) : null}
                      </Link>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p className={styles.hint} style={{ marginTop: "0.75rem" }}>
        Only ACTIVE rows count. A draft menu is a decision not yet taken — the
        engine cannot see it, so it covers nothing. Scoping happens at the
        connections grid; a cell here changes on the next load with nothing to
        remember.
      </p>
    </>
  );
}
