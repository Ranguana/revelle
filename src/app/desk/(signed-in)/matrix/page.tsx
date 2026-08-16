import Link from "next/link";

import { grid, isRowFilter, type CellState } from "@/lib/desk/connections";
import { POOL_STATUS } from "@/lib/desk/labels";

import styles from "../../desk.module.css";
import { Empty, Head } from "../bits";
import { setConnection } from "./actions";

/**
 * THE CONNECTIONS.
 *
 * ── ONE SCREEN WITH A POOL SWITCHER, AND HERE IS THE ARGUMENT ────────
 *
 * Five screens would put the same grid, the same legend and the same
 * consequence strip in five files, and the fifth would drift. But that is not
 * the reason — the reason is that a curator reading this screen is asking one
 * question at a time, and the question has a pool in it. "Which menus can
 * PORTOFINO serve" and "which drinks can PORTOFINO pour" are two questions with
 * two answers, and stacking sixty-eight rows of mixed pools into one table
 * answers neither: the row axis stops being one kind of thing, the consequence
 * strip under it stops being one number, and the eye has to filter before it
 * can read. The switcher is the question; the grid is the answer.
 *
 * The pools come from `ingredient_pool`, the registry the migrations write, so
 * a sixth pool appears in the switcher with no edit here.
 *
 * ── ONE FORM, NOT FOUR HUNDRED ───────────────────────────────────────
 *
 * Every cell is a submit button in a single form and its `value` carries the
 * whole instruction. A form per cell would be several hundred forms on one page
 * for no gain — a button already knows which form it is in and what it means.
 */

export const dynamic = "force-dynamic";

const MARK: Record<CellState, string> = {
  native: "■",
  forbidden: "✕",
  neither: "·",
};

/** What one click does. Three states, one button, no hidden mode. */
const NEXT: Record<CellState, CellState> = {
  neither: "native",
  native: "forbidden",
  forbidden: "neither",
};

const SAYS: Record<CellState, string> = {
  native: "written for this destination, and therefore for no other",
  forbidden: "forbidden here, at any score",
  neither: "no claim — a weight at most",
};

export default async function MatrixPage({
  searchParams,
}: PageProps<"/desk/matrix">) {
  const params = await searchParams;
  const requested = typeof params.pool === "string" ? params.pool : "menu";
  const status =
    typeof params.status === "string" && isRowFilter(params.status)
      ? params.status
      : "active";
  const board = await grid(requested, status);
  const link = (pool: string, rows: string) =>
    `/desk/matrix?pool=${pool}&status=${rows}`;

  return (
    <>
      <Head eyebrow="The library" title="Connections">
        <Link href="/desk/bench" className={styles.filter}>
          The test bench
        </Link>
        <Link href="/desk/coverage" className={styles.filter}>
          The coverage board
        </Link>
      </Head>

      <p className={styles.note}>
        What each thing is allowed to be, under each destination. A cell has
        three states and one click moves it to the next: nothing said, written
        for here, forbidden here. Written for is the strongest thing on this
        screen — it takes the ingredient away from every other destination in
        the library, not unlikely but ineligible.
      </p>

      <div className={styles.filters}>
        {board.pools.map((pool) => (
          <Link
            key={pool.code}
            href={link(pool.code, board.status)}
            className={styles.filter}
            aria-current={pool.code === board.pool.code}
          >
            {pool.label}
          </Link>
        ))}
      </div>

      {/*
        ACTIVE FIRST, because the grid is about what the engine can draw on and
        the engine cannot see a draft. The other two are here because scoping
        something before offering it is the normal order of work.
      */}
      <div className={styles.filters}>
        {(["active", "draft", "all"] as const).map((value) => (
          <Link
            key={value}
            href={link(board.pool.code, value)}
            className={styles.filter}
            aria-current={board.status === value}
          >
            {value === "active"
              ? "Offered"
              : value === "draft"
                ? "Draft"
                : "Both"}
          </Link>
        ))}
        {board.matched > board.rows.length ? (
          <span className={styles.hint}>
            Showing the first {board.rows.length} of {board.matched} by name.
            Narrow the pool at its own list before scoping the rest.
          </span>
        ) : null}
      </div>

      <ul className={styles.legend}>
        <li>
          <span className={`${styles.legendMark} ${styles.cellNative}`}>■</span>
          <span>written for here, and therefore for nowhere else</span>
        </li>
        <li>
          <span className={`${styles.legendMark} ${styles.cellForbidden}`}>✕</span>
          <span>forbidden here, at any score</span>
        </li>
        <li>
          <span className={`${styles.legendMark} ${styles.cellWeighted}`}>·</span>
          <span>a weight and nothing more</span>
        </li>
        <li>
          <span className={styles.legendMark}>·</span>
          <span>nothing said</span>
        </li>
      </ul>

      {board.rows.length === 0 ? (
        <Empty>
          Nothing {board.status === "draft" ? "in draft" : board.status === "active" ? "offered" : ""} in the{" "}
          {board.pool.label.toLowerCase()} pool. A grid needs two axes and this
          one has a destination axis only.
        </Empty>
      ) : (
        /*
         * ONE FORM, ONE ACTION, AND THE BUTTON SAYS WHICH CELL.
         *
         * The action is on the form rather than on each button's `formAction`:
         * every cell does the same thing, so the form has one action and each
         * submit button carries the instruction in its value. A form with no
         * action of its own and several hundred `formAction` buttons submits to
         * the page instead of to the action — a silent no-op. The first version
         * of this screen did exactly that, and clicking a cell did nothing at
         * all with no error anywhere to say so.
         */
        <form action={setConnection} className={styles.matrixScroll}>
          <table className={styles.matrix}>
            <thead>
              <tr>
                <th className={styles.matrixName}>
                  {board.pool.label}
                  <span className={styles.boardWhat}>
                    {board.rows.length}
                    {board.matched > board.rows.length
                      ? ` of ${board.matched}`
                      : ""}
                  </span>
                </th>
                {board.destinations.map((destination) => (
                  <th key={destination.id} className={styles.matrixHead}>
                    {destination.name}
                    {destination.status === "published" ? "" : " (draft)"}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {board.rows.map((row) => (
                <tr key={row.id}>
                  <th scope="row" className={styles.matrixName}>
                    {row.name}
                    {row.status === "active" ? null : (
                      <span className={styles.boardWhat}>
                        {POOL_STATUS[row.status] ?? row.status} — the engine
                        cannot see it
                      </span>
                    )}
                  </th>
                  {board.destinations.map((destination) => {
                    const cell = row.cells[destination.id];
                    const state: CellState = cell?.state ?? "neither";
                    const weighted =
                      state === "neither" && (cell?.affinity ?? 0) !== 0;
                    return (
                      <td key={destination.id} className={styles.matrixCell}>
                        <button
                          name="cell"
                          value={`${board.pool.code}:${row.id}:${destination.id}:${NEXT[state]}`}
                          className={`${styles.cell} ${
                            state === "native"
                              ? styles.cellNative
                              : state === "forbidden"
                                ? styles.cellForbidden
                                : weighted
                                  ? styles.cellWeighted
                                  : ""
                          }`}
                          title={
                            `${row.name} · ${destination.name} — ${SAYS[state]}` +
                            (weighted ? ` (affinity ${cell?.affinity})` : "") +
                            `. Click for: ${SAYS[NEXT[state]]}`
                          }
                        >
                          {MARK[state]}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>

            {/*
              THE CONSEQUENCE. How many things each destination can actually
              draw on, per slot, using the engine's own eligibility rule. Toggle
              a cell above and the number under it moves — which is the only way
              to see that "written for" is a whitelist and not a preference.
            */}
            <tfoot className={styles.matrixFoot}>
              {board.slots.map((slot) => (
                <tr key={slot.slotCode}>
                  <th scope="row">Can fill “{slot.label}”</th>
                  {board.destinations.map((destination) => (
                    <td
                      key={destination.id}
                      className={
                        slot.depth[destination.id] === 0 ? styles.poolEmpty : ""
                      }
                    >
                      {slot.depth[destination.id]}
                    </td>
                  ))}
                </tr>
              ))}
              {board.slots.length === 0 ? (
                <tr>
                  <th scope="row">No occasion draws on this pool</th>
                  <td colSpan={board.destinations.length}>
                    Nothing in occasion_slot points at {board.pool.label}, so
                    none of these scopings can reach a Revelle yet.
                  </td>
                </tr>
              ) : null}
            </tfoot>
          </table>
        </form>
      )}

      <p className={styles.hint} style={{ marginTop: "0.625rem" }}>
        The strip along the bottom counts ACTIVE rows only, and applies the
        destination and slot axes and nothing else. Her occasion and her room
        prune further, and both belong to a host — compose one at the test bench
        to see what is left.
      </p>
    </>
  );
}
