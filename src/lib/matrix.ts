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

/* ────────────────────────────────────────────────────────────────────
 * THE DERIVED READINGS — balls, shells, load-bearing cells, puncturing.
 *
 * Founder's standing orders, `docs/room-structure.md`, 2026-09-06. Steps 5
 * through 8 of the row formula ask four questions of a row that a flat list of
 * distances cannot answer, and her stated reason for wanting them emitted is
 * operational rather than theoretical: IT STOPS SAMPLED TABLES. A draft that
 * prints "others >= 6" has chosen which neighbours to show, and the Hong Kong
 * first draft sampled Havana out of its own table while hanging legality on a
 * cell whose sentence argued from a building.
 *
 * WHY THEY LIVE HERE AND NOT IN THE SCRIPT. Rule 21's narrow test — must two
 * surfaces agree about this? — is already answered in this file's own header
 * for `matrixDistance`, and it answers the same way for everything below.
 * `room-structure.md` commits the house to a second consumer in writing: "The
 * GUI must not compute Hamming as truth; a server action reads the same JSON
 * as check:matrix." A ball computed one way in an audit script and another way
 * behind an influencer form is two verdicts about whether a corner is crowded,
 * and both would look right.
 *
 * NOTHING HERE IS A NEW DISTANCE. Every function below is `matrixDistance`
 * with a filter or a mask over it. There is no weighting, no second metric and
 * no encoder — `room-structure.md` refuses Reed-Solomon, BCH and a tenth facet
 * by name, and puncturing one column for the fingerprint-drop is the only
 * coding operation the house allows.
 * ──────────────────────────────────────────────────────────────────── */

/** Rooms the founder has signed onto `authored`. */
export const MATRIX_AUTHORED: readonly string[] = MATRIX.authored;

/** Rows that exist but are not signed. Draft or proposed; never live. */
export const MATRIX_PROPOSED: readonly string[] = MATRIX.proposed;

/** Is this slug signed onto `authored`, as opposed to merely having a row? */
export function isAuthored(key: string): boolean {
  return MATRIX_AUTHORED.includes(key);
}

/** A neighbour and the distance to it. */
export type Neighbour = { key: string; d: number; authored: boolean };

/**
 * Every other row, with its distance, sorted nearest first.
 *
 * THE FULL TABLE, ALWAYS. `room-structure.md`: "Every authored slug. No
 * 'others >= 6'." Rooms that merely feel far are printed too, because which
 * ones feel far is exactly the judgement a sampled table gets wrong.
 */
export function neighbours(key: string): Neighbour[] {
  return MATRIX_KEYS.filter((k) => k !== key)
    .map((k) => ({ key: k, d: matrixDistance(key, k) as number, authored: isAuthored(k) }))
    .filter((n) => n.d !== null)
    .sort((a, b) => a.d - b.d || a.key.localeCompare(b.key));
}

/**
 * B2 — the occupants UNDER the gate.
 *
 *   |B2| = 0  eligible on structure, no twin needed
 *   |B2| = 1  twin CANDIDATE, then the four conditions. Propose, never declare.
 *   |B2| >= 2 crowded corner. Change a cell or kill the snapshot. Rio is the proof.
 *
 * d = 3 IS NOT IN THE BALL. Her instruction is explicit and it matters: "Do not
 * put d=3 rooms in the ball. Three is legal. The d=3 shell is load-bearing, not
 * collision." Folding the shell into the ball would report every zero-margin
 * room as a crowded corner and retire the twin rule by arithmetic.
 */
export function ballB2(key: string): Neighbour[] {
  return neighbours(key).filter((n) => n.d <= 2);
}

/** The rooms at EXACTLY the gate. Legal, and where every load-bearing cell lives. */
export function gateShell(key: string): Neighbour[] {
  return neighbours(key).filter((n) => n.d === MATRIX_GATE);
}

/**
 * The load-bearing cells, and who falls when each is struck.
 *
 * A cell c of R is load-bearing against N when striking it — setting R_c = N_c
 * — drops d(R,N) below the gate. Her derivation, which is why this is a filter
 * and not a search: every differing cell on a d=3 neighbour is load-bearing, no
 * single cell on a d=4 neighbour is, and d <= 2 is already under the gate.
 *
 * NOTE WHAT THIS IS NOT. An earlier sweep in `docs/proposed-tokyo-1978.md`
 * replaced each cell with EVERY other level and re-ran the audit. That answers
 * a broader question and costs 17 runs; this answers hers exactly and costs
 * none. Both are honest, and hers is the one the row formula asks for, because
 * "set the cell to the neighbour's value" is the operation that models an
 * author being talked out of a sentence.
 */
export function loadBearingCells(key: string): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const n of gateShell(key))
    for (const facet of differingFacets(key, n.key))
      out.set(facet, [...(out.get(facet) ?? []), n.key]);
  return out;
}

/**
 * The fingerprint levels — a level one room holds alone, so one tap names it.
 * Computed rather than listed, because which levels are fingerprints changes
 * every time a row lands and a hardcoded list would be wrong without breaking.
 */
export function fingerprintLevels(): { facet: string; level: string; room: string }[] {
  const out: { facet: string; level: string; room: string }[] = [];
  MATRIX_FACETS.forEach((facet, i) => {
    const holders = new Map<string, string[]>();
    for (const k of MATRIX_KEYS)
      holders.set(ROWS[k][i], [...(holders.get(ROWS[k][i]) ?? []), k]);
    for (const [level, rooms] of holders)
      if (rooms.length === 1) out.push({ facet, level, room: rooms[0] });
  });
  return out;
}

/**
 * The three levels the house treats as fingerprint-prone BY NAME, from
 * `room-structure.md` step 8: "If you used `assigned`, `arrived`, or
 * `performed`, recompute min-d with that column ignored."
 *
 * WHY A NAMED LIST AND NOT JUST THE COMPUTED FINGERPRINTS. The first cut of
 * this function reported only levels currently held by ONE room, and it
 * returned "none" for tokyo-1978 — a row that uses `assigned`, which her step 8
 * covers explicitly. The reason it returned none is the interesting part: the
 * proposed row is itself the SECOND claimant, so `assigned` stopped being a
 * computed fingerprint the moment the row landed, and the check silently
 * stopped applying to the row that triggered it. Rule 24 — count what it
 * matched — caught it at zero.
 *
 * So both sources fire: a level held alone today, and these three whatever
 * their current occupancy. A level that has just acquired a second claimant is
 * exactly when the puncture is worth running, not when it stops mattering.
 */
export const FINGERPRINT_PRONE: readonly string[] = ["assigned", "arrived", "performed"];

/**
 * FINGERPRINT-DROP — puncture one column and see whether the gate survives.
 *
 * "If the gate collapses, the fingerprint is parity, not an evening."
 *
 * This is the one coding operation the house permits, and the reading is not
 * that a collapse is illegal — it is that the row is being held apart by a
 * column no host is asked about, which is a fact the author has to know before
 * defending the sentence. Returns null when the row holds no such level.
 */
export function fingerprintDrop(
  key: string
): {
  facet: string;
  level: string;
  why: "held alone" | "fingerprint-prone";
  minWith: number;
  minWithout: number;
  collapses: boolean;
}[] | null {
  const row = ROWS[key];
  if (!row) return null;
  const alone = new Set(
    fingerprintLevels()
      .filter((f) => f.room === key)
      .map((f) => `${f.facet}.${f.level}`)
  );
  const held: { facet: string; level: string; why: "held alone" | "fingerprint-prone" }[] = [];
  MATRIX_FACETS.forEach((facet, i) => {
    const level = row[i];
    const id = `${facet}.${level}`;
    if (alone.has(id)) held.push({ facet, level, why: "held alone" });
    else if (FINGERPRINT_PRONE.includes(level)) held.push({ facet, level, why: "fingerprint-prone" });
  });
  if (!held.length) return null;
  const others = MATRIX_KEYS.filter((k) => k !== key);
  const minWith = Math.min(...others.map((k) => matrixDistance(key, k) as number));
  return held.map(({ facet, level, why }) => {
    const i = MATRIX_FACETS.indexOf(facet);
    const minWithout = Math.min(
      ...others.map((k) => row.reduce((n, v, j) => n + (j !== i && v !== ROWS[k][j] ? 1 : 0), 0))
    );
    return { facet, level, why, minWith, minWithout, collapses: minWithout < MATRIX_GATE };
  });
}

/**
 * THE KIND MASK. Two rooms are the same KIND of evening when these four agree:
 * a ceremonial bought dinner that stops, an unplanned cooked night that does
 * not, and so on.
 *
 * "Eligibility is not separation in use." Two rooms at the gate that are also
 * the same kind sit at the floor of the design AND read alike, and the ranker
 * can still hand a member the pair. That has to be said before anybody signs.
 *
 * IT IS NOT A SECOND GATE, by her explicit instruction. It reports; it refuses
 * nothing.
 */
export const KIND_MASK: readonly string[] = ["arrival", "dress", "food", "ending"];

/** Do two rooms share all four masked cells? Null when either is unrowed. */
export function sameKind(a: string, b: string): boolean | null {
  if (!ROWS[a] || !ROWS[b]) return null;
  return KIND_MASK.every((f) => {
    const i = MATRIX_FACETS.indexOf(f);
    return ROWS[a][i] === ROWS[b][i];
  });
}

/** The kind itself, as the four masked levels, for naming it in a report. */
export function kindOf(key: string): string | null {
  const row = ROWS[key];
  if (!row) return null;
  return KIND_MASK.map((f) => row[MATRIX_FACETS.indexOf(f)]).join(" · ");
}

/** Same-kind neighbours at or inside the gate — the pairs worth naming. */
export function sameKindAtGate(key: string): Neighbour[] {
  return neighbours(key).filter((n) => n.d <= MATRIX_GATE && sameKind(key, n.key));
}
