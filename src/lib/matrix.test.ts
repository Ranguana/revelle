/**
 * THE DERIVED MATRIX READINGS — balls, shells, load-bearing cells, puncturing.
 *
 * These back `npm run check:matrix`, and `docs/room-structure.md` commits the
 * house to a second consumer: "The GUI must not compute Hamming as truth; a
 * server action reads the same JSON as check:matrix." So these functions decide
 * whether a corner is crowded in two places, and rule 21's guard applies —
 * which is why nothing below re-calls the function it is testing and compares
 * the answer to itself. Every assertion is against a fact derived independently
 * from the JSON, or against a strike actually performed on the row.
 */
import test from "node:test";
import assert from "node:assert/strict";
import MATRIX from "../../data/destination-matrix.json" with { type: "json" };
import {
  MATRIX_FACETS,
  MATRIX_KEYS,
  MATRIX_GATE,
  matrixDistance,
  differingFacets,
  neighbours,
  ballB2,
  gateShell,
  loadBearingCells,
  fingerprintDrop,
  fingerprintLevels,
  sameKind,
  sameKindAtGate,
  KIND_MASK,
  FINGERPRINT_PRONE,
  isAuthored,
} from "./matrix.ts";

const ROWS = MATRIX.rows as Record<string, string[]>;

test("the table is never sampled — every other row is returned", () => {
  // The guarantee behind "No others >= 6". Hong Kong's first draft sampled
  // Havana out of its own distance table, which is the defect this forbids.
  for (const k of MATRIX_KEYS) {
    const ns = neighbours(k);
    assert.equal(
      ns.length,
      MATRIX_KEYS.length - 1,
      `${k} reports ${ns.length} neighbours of ${MATRIX_KEYS.length - 1}`
    );
    const seen = new Set(ns.map((n) => n.key));
    for (const other of MATRIX_KEYS)
      if (other !== k) assert.ok(seen.has(other), `${k} omits ${other}`);
  }
});

test("B2 holds what is UNDER the gate, and never what is AT it", () => {
  // Her instruction, verbatim: "Do not put d=3 rooms in the ball. Three is
  // legal. The d=3 shell is load-bearing, not collision." Folding the shell
  // into the ball would report every zero-margin room as a crowded corner and
  // retire the twin rule by arithmetic, so this is asserted rather than
  // trusted.
  for (const k of MATRIX_KEYS) {
    for (const n of ballB2(k))
      assert.ok(n.d <= 2, `${k}/${n.key} is at ${n.d} and is in B2`);
    for (const n of gateShell(k))
      assert.equal(n.d, MATRIX_GATE, `${k}/${n.key} is in the shell at ${n.d}`);
    const inBall = new Set(ballB2(k).map((n) => n.key));
    for (const n of gateShell(k))
      assert.ok(!inBall.has(n.key), `${k}: ${n.key} is in both the ball and the shell`);
  }
});

test("B2 occupancy agrees with the declared twins, computed independently", () => {
  // Derived from twinRule, not from ballB2 — the two must agree and each
  // computes its own answer, which is exactly when they drift.
  const inATwin = new Set<string>();
  for (const t of MATRIX.twinRule?.declared ?? []) for (const s of t.pair) inATwin.add(s);
  for (const k of MATRIX_KEYS) {
    const occupants = ballB2(k).length;
    if (occupants > 0)
      assert.ok(
        inATwin.has(k),
        `${k} has ${occupants} room(s) under the gate but is in no declared twin — ` +
          `that is an undeclared sub-gate pair, which is a failure and not a twin`
      );
  }
});

test("a load-bearing cell really does drop the pair below the gate when struck", () => {
  // The strike is PERFORMED here rather than inferred. loadBearingCells derives
  // its answer from the shell; this re-derives it by editing the row and
  // re-measuring, which is the only way the two can disagree visibly.
  for (const k of MATRIX_KEYS) {
    for (const [facet, who] of loadBearingCells(k)) {
      const i = MATRIX_FACETS.indexOf(facet);
      assert.ok(i >= 0, `${facet} is not a declared facet`);
      for (const n of who) {
        const struck = [...ROWS[k]];
        struck[i] = ROWS[n][i];
        const d = struck.reduce((acc, v, j) => acc + (v !== ROWS[n][j] ? 1 : 0), 0);
        assert.ok(
          d < MATRIX_GATE,
          `${k}.${facet} is reported load-bearing against ${n}, but striking it ` +
            `leaves them at ${d}, which is not below ${MATRIX_GATE}`
        );
      }
    }
  }
});

test("a room with an empty shell has no load-bearing cell, and the converse", () => {
  // Her derivation: every differing cell on a d=3 neighbour is load-bearing, no
  // single cell on a d=4 neighbour is. So the two facts are the same fact and
  // a disagreement means one of them is computing something else.
  for (const k of MATRIX_KEYS) {
    const shell = gateShell(k).length;
    const cells = loadBearingCells(k).size;
    if (shell === 0)
      assert.equal(cells, 0, `${k} has an empty shell but ${cells} load-bearing cell(s)`);
    else assert.ok(cells > 0, `${k} has ${shell} room(s) at the gate but no load-bearing cell`);
  }
});

test("the fingerprint-drop fires on a level the house names, not only on one held alone", () => {
  // REGRESSION. The first cut reported only levels held by exactly one room,
  // and returned null for tokyo-1978 — a row using `assigned`, which
  // room-structure.md step 8 covers by name. It returned null BECAUSE that row
  // is itself the second claimant, so the check stopped applying to the row
  // that triggered it. Rule 24 caught it at zero matches.
  for (const k of MATRIX_KEYS) {
    const usesNamed = MATRIX_FACETS.some((_, i) => FINGERPRINT_PRONE.includes(ROWS[k][i]));
    const held = fingerprintLevels().some((f) => f.room === k);
    const drop = fingerprintDrop(k);
    if (usesNamed || held)
      assert.ok(
        drop && drop.length > 0,
        `${k} holds a fingerprint-prone or uniquely-held level and reports no drop`
      );
    else assert.equal(drop, null, `${k} holds no such level yet reports a drop`);
  }
});

test("puncturing a column can only lower a distance, never raise it", () => {
  // The sanity property of the one coding operation this house allows. A
  // puncture that raised min-d would mean the column was being counted twice.
  for (const k of MATRIX_KEYS)
    for (const f of fingerprintDrop(k) ?? [])
      assert.ok(
        f.minWithout <= f.minWith,
        `${k}: dropping ${f.facet} moved min d from ${f.minWith} up to ${f.minWithout}`
      );
});

test("the kind mask is the four cells she named, and sameKind reads exactly them", () => {
  assert.deepEqual([...KIND_MASK], ["arrival", "dress", "food", "ending"]);
  for (const f of KIND_MASK) assert.ok(MATRIX_FACETS.includes(f), `${f} is not a facet`);
  for (const a of MATRIX_KEYS)
    for (const b of MATRIX_KEYS) {
      if (a === b) continue;
      const byHand = KIND_MASK.every(
        (f) => ROWS[a][MATRIX_FACETS.indexOf(f)] === ROWS[b][MATRIX_FACETS.indexOf(f)]
      );
      assert.equal(sameKind(a, b), byHand, `sameKind disagrees on ${a}/${b}`);
    }
});

test("same-kind is a REPORT and not a gate — it refuses nothing", () => {
  // room-structure.md: "Do not use this mask as a second gate." The way that
  // rule would be broken is by something starting to filter on it, so the
  // property asserted is that same-kind pairs are allowed to exist at the gate.
  const atGate: string[] = [];
  for (const k of MATRIX_KEYS) for (const n of sameKindAtGate(k)) if (n.d === MATRIX_GATE) atGate.push(`${k}/${n.key}`);
  assert.ok(
    atGate.length > 0,
    "no same-kind pair sits at the gate; if that is genuinely true the catalogue " +
      "changed, but it is far more likely something began filtering on the mask"
  );
});

test("unrowed slugs are unmeasured, not at distance zero", () => {
  // The reading this file's header already refuses for matrixDistance, asserted
  // for the derived readings too: a room with no row is not identical to
  // everything.
  assert.equal(matrixDistance("hong-kong-1963", "havana"), null);
  assert.equal(sameKind("hong-kong-1963", "havana"), null);
  assert.equal(fingerprintDrop("hong-kong-1963"), null);
  assert.deepEqual(differingFacets("hong-kong-1963", "havana"), []);
});

test("authored and proposed are disjoint, and every row is in one of them", () => {
  const authored = new Set(MATRIX.authored);
  const proposed = new Set(MATRIX.proposed);
  for (const k of MATRIX_KEYS) {
    assert.ok(
      authored.has(k) !== proposed.has(k),
      `${k} is in neither authored nor proposed, or in both — a row with no ` +
        `status cannot be reported as signed or unsigned`
    );
    assert.equal(isAuthored(k), authored.has(k));
  }
});
