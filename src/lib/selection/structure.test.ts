/**
 * THE MATRIX AND THE QUIZ, HELD TOGETHER.
 *
 * Three files have to agree about the structural facets and none of them can
 * see the other two at runtime: `data/destination-matrix.json` declares the
 * columns and the levels, `src/lib/quiz.ts` asks the questions, and
 * `src/lib/selection/structure.ts` does the arithmetic. This file is the joint.
 *
 * THE ASSERTION THAT MATTERS MOST is the one CLAUDE.md rule 15 asks for: the
 * number of columns the ranker RANKS ON is the number of columns a host FEEDS.
 * It is written as a set equality rather than as a count, because a count would
 * pass on the day somebody wired one facet and unwired another, and the failure
 * rule 15 describes is silent by construction — an unfed instrument still
 * returns a number and nothing goes red.
 */

import assert from "node:assert/strict";
import test from "node:test";

import MATRIX from "../../../data/destination-matrix.json" with { type: "json" };
import { FIELDS, QUIZ_STEPS, isFieldActive } from "../quiz.ts";
import {
  FED_FACETS,
  STRUCTURAL_FACETS,
  STRUCTURAL_LEVELS,
  STRUCTURAL_SUPPLIERS,
  rankByStructure,
  rowFromCells,
  statedEnding,
  statedStartHour,
  statedStructure,
  structuralDistance,
  type StructuralFacet,
  type StructuralRow,
} from "./structure.ts";

const facetNames = Object.keys(MATRIX.facets) as StructuralFacet[];
const levels = MATRIX.facets as Record<string, readonly string[]>;
const rows = MATRIX.rows as Record<string, readonly string[]>;
// `fedBy` carries a prose `note` beside the nine entries, so it is read through
// `unknown` rather than asserted into a uniform record. The test below is what
// proves each of the nine is actually there and actually has a reason on it.
const fedBy = MATRIX.fedBy as unknown as Record<
  string,
  { field: string | null; dimension?: string; why?: string }
>;

/** One resolved answer, in the shape quiz_response_facet hands the engine. */
const said = (field: string, dimension: string, code: string) => ({
  field,
  dimension,
  code,
});

// ── the three files agree about the vocabulary ────────────────────────

test("structure.ts declares the matrix's columns, in the matrix's order", () => {
  assert.deepEqual([...STRUCTURAL_FACETS], facetNames);
});

test("structure.ts declares the matrix's levels, exactly", () => {
  for (const facet of facetNames) {
    assert.deepEqual(
      [...STRUCTURAL_LEVELS[facet]],
      [...levels[facet]],
      `levels for ${facet} differ between the matrix and structure.ts`
    );
  }
});

// ── rule 15: fed == ranked ────────────────────────────────────────────

test("every matrix column declares a supplier or declares that it has none", () => {
  for (const facet of facetNames) {
    assert.ok(
      Object.prototype.hasOwnProperty.call(fedBy, facet),
      `${facet} has no entry in fedBy. CLAUDE.md rule 15: every instrument ` +
        `traces to a supplier, and "none" is an answer that has to be written down.`
    );
    assert.ok(
      typeof fedBy[facet].why === "string" && fedBy[facet].why.length > 0,
      `${facet}'s fedBy entry has no reason on it.`
    );
  }
});

test("the matrix and structure.ts name the same suppliers", () => {
  for (const facet of facetNames) {
    const declared = fedBy[facet].field ?? null;
    const wired = STRUCTURAL_SUPPLIERS[facet]?.field ?? null;
    assert.equal(
      wired,
      declared,
      `${facet}: the matrix says ${declared ?? "unfed"} and structure.ts says ` +
        `${wired ?? "unfed"}.`
    );
    if (declared !== null) {
      assert.equal(
        STRUCTURAL_SUPPLIERS[facet]?.dimension,
        fedBy[facet].dimension,
        `${facet}: the two files disagree about which dimension resolves it.`
      );
    }
  }
});

test("every supplier is a question the quiz actually asks", () => {
  for (const facet of FED_FACETS) {
    const supplier = STRUCTURAL_SUPPLIERS[facet];
    assert.ok(supplier, `${facet} is in FED_FACETS with no supplier`);
    const field = FIELDS[supplier.field];
    assert.ok(
      field,
      `${facet} is fed by "${supplier.field}", which is not a field in quiz.ts.`
    );
    assert.equal(
      field.type,
      "single",
      `${facet} is fed by "${supplier.field}", which is not a single-select — ` +
        `a column takes one level, not a set.`
    );
  }
});

test("THE RULE 15 INVARIANT: the columns ranked are exactly the columns fed", () => {
  // Every fed field answered, at once. This is what the ranker gets at its
  // widest, and it must be the fed list — no more (a column ranked on nothing)
  // and no less (a question asked for nothing).
  const everything = [
    said("how_it_ends", "evening_ending", "dissolves"),
    said("meal_time", "evening_start", "evening"),
    // db/070. A third fed column, and this fixture is where a new one has to be
    // declared — the invariant is "every fed field answered, at once", so
    // adding a supplier without adding its answer here fails LOUDLY rather
    // than silently ranking on a column the fixture never states.
    said("what_they_wear", "evening_dress", "dressed"),
    // Noise from the rest of the application, which must not produce a column.
    said("meal_time", "meal_shape", "long_dinner"),
    said("event_month", "season", "high_summer"),
    said("how_made", "making", "made_by_hand"),
    said("guest_count_band", "guest_count", "from_9_to_12"),
  ];

  const ranked = Object.keys(statedStructure(everything));
  assert.deepEqual(ranked.sort(), [...FED_FACETS].sort());

  // And the ranker cannot be made to charge for a column nobody supplies.
  const room = rowFromCells(rows["dolomites"]);
  const unfed = facetNames.filter((f) => !FED_FACETS.includes(f));
  const withUnfed = { ...statedStructure(everything) } as StructuralRow;
  assert.equal(
    unfed.every((f) => withUnfed[f] === undefined),
    true
  );
  assert.equal(
    structuralDistance(withUnfed, room),
    structuralDistance(statedStructure(everything), room)
  );
});

// ── reading her answers ───────────────────────────────────────────────

test("an answer is read from its own dimension and not from the field alone", () => {
  const stated = [
    said("meal_time", "meal_shape", "late_supper"),
    said("meal_time", "evening_start", "late"),
  ];
  assert.equal(statedStartHour(stated), "late");
  assert.equal(statedEnding(stated), null);
});

test("a code the matrix does not declare is dropped, not carried", () => {
  // A bridge row and a level list disagreeing is a bug to fix. Carrying the
  // code would add a full mismatch against every room and look like a taste.
  const stated = [said("how_it_ends", "evening_ending", "at_dawn_ish")];
  assert.equal(statedEnding(stated), null);
  assert.deepEqual(statedStructure(stated), {});
});

test("silence costs nothing", () => {
  const room = rowFromCells(rows["havana"]);
  assert.equal(structuralDistance({}, room), 0);
});

// ── the ending facet, against the rooms it actually separates ─────────

test("ending sorts the rooms the audit says it sorts", () => {
  const i = facetNames.indexOf("ending" as StructuralFacet);
  const by = (level: string) =>
    Object.keys(rows).filter((slug) => rows[slug][i] === level).length;
  // The most even split any column has: 7 / 7 / 6 over twenty rows.
  //
  // WAS 7 / 7 / 4 over eighteen (CLAUDE.md rule 14, the numbers kept rather
  // than overwritten). The fifth `clean_stop` is the PROPOSED tokyo-1978 row,
  // which is the only row in the matrix that is an agent's proposal rather than
  // the founder's — see `founderPending` in data/destination-matrix.json. If
  // she declines it, the row goes and these three numbers go back.
  //
  // AND THE GENERAL POINT, because this constant will be edited again: a
  // catalogue-size number written into a test has to be hand-edited by every
  // room that lands, forever, and this file is one of five that hold one
  // (`food-identity.test.ts` holds 18 and the 12/4/2 identity split,
  // `games.test.ts` holds 20, `drinks-seed.test.ts` holds nine corpus counts).
  // None of them is wrong; all of them are per-room manual work that scales
  // linearly with a catalogue meant to reach hundreds.
  assert.equal(by("until_morning"), 7);
  assert.equal(by("dissolves"), 7);
  assert.equal(by("clean_stop"), 6);  // 4 at eighteen rooms, 5 with tokyo-1978, 6 with hong-kong-1963
});

test("the Vegas / New York pair turns on ending", () => {
  const vegas = rowFromCells(rows["las-vegas"]);
  const newYork = rowFromCells(rows["new-york"]);
  const hers: StructuralRow = { ending: "until_morning" };
  assert.equal(structuralDistance(hers, vegas), 0);
  assert.equal(structuralDistance(hers, newYork), 1);
});

// ── the asymmetric level, which is the part a reader will get wrong ───

test("late is a level of the question and of no room", () => {
  assert.ok(STRUCTURAL_LEVELS.starts.includes("late"));
  const i = facetNames.indexOf("starts" as StructuralFacet);
  assert.equal(
    Object.keys(rows).filter((slug) => rows[slug][i] === "late").length,
    0,
    "a room has been moved to starts=late. Read facetNotes.starts before doing that."
  );
});

test("late is near evening, and a full mismatch against the daylight rooms", () => {
  const hers: StructuralRow = { starts: "late" };
  // Nantucket is an evening room that dissolves — near, and charged the quarter.
  assert.equal(structuralDistance(hers, rowFromCells(rows["nantucket"])), 0.25);
  // The Dolomites start in the morning. Nothing near about it.
  assert.equal(structuralDistance(hers, rowFromCells(rows["dolomites"])), 1);
});

test("the nearness table is asymmetric and stays that way", () => {
  // Her `late` against a room's `evening` is a real comparison. The reverse is
  // unreachable, because no room holds `late` — and if one ever did, the level
  // test above goes red first.
  const evening: StructuralRow = { starts: "evening" };
  const asRoom: StructuralRow = { starts: "late" };
  assert.equal(structuralDistance(evening, asRoom), 1);
  assert.equal(structuralDistance({ starts: "late" }, { starts: "evening" }), 0.25);
});

test("a late start against an until-morning room costs nothing, and never less", () => {
  const hers: StructuralRow = { starts: "late" };
  // Havana runs until morning: the quarter is cancelled.
  assert.equal(structuralDistance(hers, rowFromCells(rows["havana"])), 0);
  // AND THE CANCELLATION IS CELL-LOCAL. It zeroes the quarter that `starts`
  // would otherwise cost and reaches no further: a host who starts late and
  // wants a clean stop still pays the full mismatch on `ending` against a room
  // that runs until morning. The bonus can never take a total below what the
  // other columns cost, which is what stops one agreement paying for a
  // disagreement elsewhere.
  const alsoWrong: StructuralRow = { starts: "late", ending: "clean_stop" };
  assert.equal(structuralDistance(alsoWrong, rowFromCells(rows["havana"])), 1);
  assert.equal(
    structuralDistance({ ending: "clean_stop" }, rowFromCells(rows["havana"])),
    1
  );
});

test("a whole late-night host lands on the until-morning corner", () => {
  const hers: StructuralRow = { starts: "late", ending: "until_morning" };
  const all = Object.fromEntries(
    Object.entries(rows).map(([slug, cells]) => [slug, rowFromCells(cells)])
  );
  const ranked = rankByStructure(hers, all);
  const best = ranked.filter((r) => r.distance === ranked[0].distance);
  assert.equal(ranked[0].distance, 0);
  assert.deepEqual(
    best.map((r) => r.slug).sort(),
    [
      "acapulco-1959",
      "havana",
      "las-vegas",
      "new-orleans",
      "st-moritz-1984",
      "tahiti",
      "westhampton-1976",
    ]
  );
});

// ── the quiz half ─────────────────────────────────────────────────────

test("how it ends is asked of everybody", () => {
  const field = FIELDS["how_it_ends"];
  assert.ok(field);
  assert.equal(field.activeWhen, undefined);
  assert.equal(isFieldActive(field, {}), true);
});

test("the hour is asked of a standing party too", () => {
  // The bug db/037 closed: with the gate on, a cocktail party stated no hour
  // anywhere in the system.
  const field = FIELDS["meal_time"];
  assert.ok(field);
  assert.equal(field.activeWhen, undefined);
  for (const plan of ["sit_down", "standing", "eating_out", "drinks_only"]) {
    assert.equal(isFieldActive(field, { food_plan: plan }), true);
  }
});

test("occasion_other is the only conditional field left", () => {
  const conditional = Object.values(FIELDS)
    .filter((f) => f.activeWhen)
    .map((f) => f.id);
  assert.deepEqual(conditional, ["occasion_other"]);
});

test("the ending question offers the matrix's levels and nothing else", () => {
  const field = FIELDS["how_it_ends"];
  assert.ok(field && field.type === "single");
  assert.deepEqual(
    field.options.map((o) => o.code),
    [...STRUCTURAL_LEVELS.ending]
  );
});

test("the ending step sits directly after the calendar", () => {
  const keys = QUIZ_STEPS.map((s) => s.key);
  assert.equal(keys[keys.indexOf("when") + 1], "ending");
});

/**
 * NO DESTINATION IS LIMITED BY GUEST COUNT.
 *
 * Founder ruling, 2026-09-06, given for at least the second time: "i dont want
 * any destination TO BE LIMITED BY GUEST COUNT - this is not the first time ive
 * said this."
 *
 * A ruling that has to be given twice is a ruling with no guard. This is the
 * guard. It goes through the CONSUMER — `statedStructure` fed a real guest-count
 * answer, and `structuralDistance` scored against a real room — rather than
 * asserting `STRUCTURAL_SUPPLIERS.size === null`, which would be a test of the
 * constant against itself and would pass on the day somebody wires it and
 * updates the constant in the same edit (rule 21).
 *
 * It is deliberately NOT a test that `size` is absent from the matrix. The cell
 * may exist and may be true of a night — "if the weeknight is six people, `few`
 * is true", same founder, same day. What it may never do is narrow, penalise or
 * reorder. Description is allowed; gating is not.
 */
test("a host's headcount cannot move a destination, in either direction", () => {
  const roomFew = rowFromCells(rows["nantucket"]);
  const roomCrowd = rowFromCells(rows["new-orleans"]);

  // Every band she can answer with, against a `few` room and a `crowd` room.
  for (const band of [
    "from_2_to_4",
    "from_5_to_8",
    "from_9_to_12",
    "from_13_to_20",
    "from_21_to_40",
    "over_40",
  ]) {
    const hers = statedStructure([said("guest_count_band", "guest_count", band)]);
    assert.deepEqual(
      hers,
      {},
      `a guest-count answer of ${band} produced a structural cell: ${JSON.stringify(hers)}`
    );
    assert.equal(
      structuralDistance(hers, roomFew),
      structuralDistance(hers, roomCrowd),
      `${band} scores a few-room and a crowd-room differently`
    );
    assert.equal(structuralDistance(hers, roomFew), 0, `${band} cost a room distance`);
  }

  // And the same answer alongside a REAL stated facet must not change that
  // facet's verdict — the sneaky failure, where the count rides along.
  const alone = statedStructure([said("how_it_ends", "evening_ending", "clean_stop")]);
  const withCount = statedStructure([
    said("how_it_ends", "evening_ending", "clean_stop"),
    said("guest_count_band", "guest_count", "over_40"),
  ]);
  assert.deepEqual(withCount, alone, "a guest-count answer changed the structural row");
  for (const slug of Object.keys(rows))
    assert.equal(
      structuralDistance(withCount, rowFromCells(rows[slug])),
      structuralDistance(alone, rowFromCells(rows[slug])),
      `adding a headcount answer changed the distance to ${slug}`
    );
});
