/**
 * THE STRUCTURAL MATRIX, ON THE AUDIT SIDE — the one owner of room-vs-room
 * distance.
 *
 * ── WHY THIS FILE EXISTS AT ALL ──────────────────────────────────────
 *
 * Until now the Hamming distance between two ROOMS had exactly one
 * implementation: four lines inside `scripts/audit-matrix.mjs`. That was
 * correct while `check:matrix` was the only surface that needed it. It stopped
 * being correct the moment a SECOND instrument had to quote a distance —
 * `npm run check:voices` prints structural distance beside every voice
 * affinity, and `src/lib/voice.test.ts` applies a ceiling that DEPENDS on that
 * distance. Three surfaces, one fact, and CLAUDE.md rule 21's narrow test —
 * MUST TWO SURFACES AGREE ABOUT THIS? — answers yes without argument: a split
 * ceiling applied against a distance the matrix does not hold is a verdict
 * about nothing.
 *
 * So this is an extraction and not an abstraction. `audit-matrix.mjs` is a
 * consumer of it rather than a sibling of it, which is the half of rule 21 that
 * is usually skipped: a shared function nobody was moved onto guards nothing.
 *
 * ── WHAT IT IS NOT ───────────────────────────────────────────────────
 *
 * It is not `src/lib/selection/structure.ts`. That file is the APPLICANT side —
 * her answers turned into a row, and a deliberately ASYMMETRIC host-vs-room
 * distance with a NEAR band in it. This file is room-vs-room, symmetric, and
 * all-or-nothing per cell, which is the arithmetic the gate of 3 is expressed
 * in. structure.ts says so in its own words ("The matrix's own distance is
 * Hamming ... Nothing below changes it"), and the two must not be confused:
 * they answer different questions and would give different numbers.
 *
 * ── IT IS IN THE REQUEST PATH NOW ────────────────────────────────────
 *
 * This module used to say "nothing in the running application imports this",
 * and that stopped being true when the ranker was wired:
 * `src/lib/selection/destination.ts` reads `matrixRow()` at step 5½ to sort the
 * voice survivors. The JSON is imported at BUILD time, not read from disk in a
 * request, so the bundle carries the rows and no file path exists at runtime.
 *
 * What that changes for a reader: an edit to `data/destination-matrix.json` is
 * now a change to what a host is shown, not only to what an audit prints. The
 * cells are founder-signed (CLAUDE.md rule 13) and this is why.
 *
 * Consumers: the two audit scripts, the voice test, and the destination ranker.
 */

import MATRIX from "../../data/destination-matrix.json" with { type: "json" };

/** The nine columns, in the order the file declares them. Cells are positional. */
export const MATRIX_FACETS: readonly string[] = Object.keys(MATRIX.facets);

/** Every room that has a row, authored or proposed. */
export const MATRIX_KEYS: readonly string[] = Object.keys(MATRIX.rows);

/** The gate. Two rooms must differ on at least this many facets. */
export const MATRIX_GATE: number = MATRIX.gate;

const ROWS = MATRIX.rows as Readonly<Record<string, readonly string[]>>;
const LEVELS = MATRIX.facets as Readonly<Record<string, readonly string[]>>;

/**
 * Every cell is a declared level and every row is the right length.
 *
 * Returns the complaints rather than throwing, so a caller can print all of
 * them at once and then refuse to quote a distance. A typo is otherwise a
 * SILENT EXTRA DISTANCE that flatters every pair it touches, and a short row
 * shifts every column after it.
 */
export function matrixCellErrors(): string[] {
  const bad: string[] = [];
  for (const [key, row] of Object.entries(ROWS)) {
    if (row.length !== MATRIX_FACETS.length) {
      bad.push(`${key}: ${row.length} cells, expected ${MATRIX_FACETS.length}`);
      continue;
    }
    row.forEach((value, i) => {
      const facet = MATRIX_FACETS[i];
      if (!LEVELS[facet].includes(value))
        bad.push(`${key}.${facet} = "${value}" is not a declared level`);
    });
  }
  return bad;
}

/** A room's row, or undefined for a room with no row. */
export function matrixRow(key: string): readonly string[] | undefined {
  return ROWS[key];
}

/**
 * How many of the nine columns two rooms differ on.
 *
 * NULL, NOT ZERO, when either room has no row. A room with no matrix row is not
 * at distance 0 from everything — it is unmeasured, and the two readings lead
 * opposite ways: zero would silently declare every unrowed pair a Cap Ferrat
 * case. Callers say "unrowed" out loud instead (CLAUDE.md rule 3).
 */
export function matrixDistance(a: string, b: string): number | null {
  const rowA = ROWS[a];
  const rowB = ROWS[b];
  if (!rowA || !rowB) return null;
  return rowA.reduce((n, v, i) => n + (v !== rowB[i] ? 1 : 0), 0);
}

/** The names of the columns two rooms differ on. Empty when either is unrowed. */
export function differingFacets(a: string, b: string): string[] {
  const rowA = ROWS[a];
  const rowB = ROWS[b];
  if (!rowA || !rowB) return [];
  return MATRIX_FACETS.filter((_, i) => rowA[i] !== rowB[i]);
}

/** A pair as a stable key, order-independent. */
export function pairKey(a: string, b: string): string {
  return [a, b].sort().join(" / ");
}

export type DeclaredTwin = {
  pair: readonly string[];
  distance?: number;
  voiceAffinity?: number | null;
  status?: string;
};

/** The declared twin pairs, by `pairKey`. */
export const DECLARED_TWINS: ReadonlyMap<string, DeclaredTwin> = new Map(
  ((MATRIX.twinRule?.declared ?? []) as readonly DeclaredTwin[]).map((t) => [
    pairKey(t.pair[0], t.pair[1]),
    t,
  ])
);

/** Is this pair declared as a twin in the matrix file? */
export function isDeclaredTwin(a: string, b: string): boolean {
  return DECLARED_TWINS.has(pairKey(a, b));
}
