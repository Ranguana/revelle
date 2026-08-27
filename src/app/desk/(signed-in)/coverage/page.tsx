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
  const { headings, columns, rows } = await board();

  // The second header row exists only for the headings that span more than one
  // column — today, atmosphere. A standing column keeps its label in the top
  // row and reaches down through both.
  const grouped = headings.some((heading) => heading.span > 1);
  const subColumns = (() => {
    const out: { key: string; label: string }[] = [];
    let at = 0;
    for (const heading of headings) {
      if (heading.span > 1) {
        out.push(...columns.slice(at, at + heading.span));
      }
      at += heading.span;
    }
    return out;
  })();

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
        making spread is the one that gets missed: a destination whose dishes
        are all made by hand still matches a host who said she wants everything to
        arrive finished — her answer weights the pool, it never filters it — and
        she opens the table to find nothing on it she can have.
      </p>

      <p className={styles.note}>
        <strong>The table and the atmosphere are reported per slot.</strong> A
        column with a number is how many things this destination can put in that
        one slot; <em>none</em> means every package built here reports a
        catalogue gap for it, and an amber number means the slot draws as many
        as the room has, so every evening gets the same one. A single
        &ldquo;has atmosphere&rdquo; check could only ever say <em>none at
        all</em>, which with 174 live items never fires — split, it can say a
        room has table settings and nothing to take home. Those columns are
        nearly empty across the library and that is the finding, not a fault in
        the board.
      </p>

      <p className={styles.note}>
        <strong>Cells count claims; the total counts things.</strong> One item
        may claim more than one slot — a rock is both dressing and atmosphere —
        and it is counted in every cell it can fill, because that is what
        selection draws from. <em>In all</em> counts each thing once, so it can
        be smaller than the cells beside it added up. That gap is the
        multiply-claimed rows, not a miscount.
      </p>

      <p className={styles.note}>
        <strong>Serving is measured in dishes, not menus.</strong> db/022
        composed the table out of three course slots and left the menu pool with
        no slot to be placed in — <code>occasion_slot</code> has no row for{" "}
        <code>menu</code> at all. The 39 authored menus are still at{" "}
        <Link href="/desk/menus" className={styles.whoEmail}>
          /desk/menus
        </Link>
        ; what they are not is evidence that a room can be served, so they are
        off this board rather than colouring a column nothing draws. The season
        and making spreads moved with them, for the same reason.
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
              <th rowSpan={grouped ? 2 : 1}>Destination</th>
              {headings.map((heading) => (
                <th
                  key={heading.key}
                  colSpan={heading.span}
                  rowSpan={grouped && heading.span === 1 ? 2 : 1}
                  className={heading.span > 1 ? styles.boardGroup : undefined}
                >
                  {heading.label}
                </th>
              ))}
            </tr>
            {grouped ? (
              <tr>
                {subColumns.map((column) => (
                  <th key={column.key}>{column.label}</th>
                ))}
              </tr>
            ) : null}
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
