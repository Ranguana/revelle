/**
 * THE FIXTURE HALF OF THE DRIFT GUARD. THE OTHER HALF IS THE REAL ONE.
 *
 * READ THIS FIRST, so this file is not mistaken for the deliverable it is not.
 * src/lib/desk/coverage.db.test.ts is the guard the founder asked for: it
 * drives BOTH consumers end-to-end — `board()` as the screen calls it, a real
 * `loadCatalogue` + `scopePools` as production calls them — against a seeded
 * database, and it has been proven to go red when either one is given its own
 * eligibility rule. That is the test that catches a future bypass.
 *
 * This file is not that, and it is not a duplicate of it either. It exists
 * because the seeded bank cannot express two states the rule turns on:
 *
 *   AN ITEM WITH NO SLOT CLAIM, which is eligible for every slot — the general
 *   bucket's whole purpose, and the case where "count the rows in
 *   bank_item_slot" and the real whitelist rule stop agreeing.
 *   AN ITEM CLAIMING TWO SLOTS, which is what makes claims-per-cell and
 *   distinct-per-total two different numbers.
 *
 * db/043's backfill gives every row exactly one claim, so on real data those
 * two shapes are absent and a slot-axis bypass is INVISIBLE — verified, by
 * introducing one and watching the database guard stay green. Fixtures are the
 * only way to hold that ground, so this file holds it, and drives the real
 * `scopePools` on the other side of every comparison rather than the shared
 * module twice.
 *
 * ── THE INVARIANT BOTH FILES ASSERT ──────────────────────────────────
 *
 *   "You now have two surfaces answering 'does room X have slot Y covered' —
 *    the migration's gap reporter and this board. If each writes its own
 *    query, they'll drift, and the failure mode is exquisite: the board shows
 *    a gap the reporter doesn't fire on, or vice versa, and someone spends a
 *    day discovering that 'coverage' means two different things in two files."
 *
 * A test that merely asserted `placement()` returns what `worldEligibility` and
 * `slotEligibility` return would be a test of an equals sign. This one drives
 * the REPORTER — `scopePools` from ./fill.ts, the real function that files a
 * `CatalogueGap` — and the BOARD'S BASIS — `claimsForSlot` from
 * ./slot-coverage.ts — over one set of fixtures, and asserts the invariant the
 * shared module claims:
 *
 *   claimsForSlot(...).length === 0  ⟹  the reporter files a gap for that slot
 *
 * and its converse under the only conditions where the converse holds: with no
 * applicant filters in play (no dealbreakers, no venue, no season, no meal
 * shape, no group-size limits), the two must agree EXACTLY. Any future edit
 * that adds a catalogue axis to one of the two files and not the other turns
 * one of these red.
 *
 * The asymmetry is asserted too, in its own test, because it is the part that
 * looks like a bug and is not: an applicant filter may empty a pool the
 * catalogue had stocked, and that is a host's evening, not a divergence.
 *
 * No database. The fixtures below are the whole catalogue.
 */
import assert from "node:assert/strict";
import test from "node:test";

import { scopePools } from "./fill.ts";
import { claimsForSlot, itemsForRoom, placement } from "./slot-coverage.ts";
import {
  withDefaults,
  type Destination,
  type Ingredient,
  type Scale,
  type UnitSlot,
} from "./types.ts";

const OPTIONS = withDefaults({ seed: 7, now: new Date("2026-08-15T00:00:00Z") });

const HERE: Destination = {
  id: "w-positano",
  slug: "positano",
  name: "POSITANO",
  tagline: "",
  facets: {},
  occasions: [],
  issuance: null,
  isFixture: true,
};

const ELSEWHERE = "w-havana";

/** Enough of a Scale that nothing in the fill is undefined. No group limits. */
const SCALE: Scale = {
  guestBand: "from_9_to_12",
  guestsLow: 9,
  guestsHigh: 12,
  guestsPlanning: 11,
  spendBand: "from_150_to_300",
  perPersonLow: 150,
  perPersonHigh: 300,
  perPersonPlanning: 225,
  budgetPlanning: 2475,
  budgetCeiling: 3600,
  retiredBudgetBand: null,
};

/** The four atmosphere slots db/043 installed, in `slot_kind.position` order. */
const SLOT_CODES = [
  "the_table_set",
  "the_light",
  "the_atmosphere",
  "the_take_home",
] as const;

function slot(slotCode: string, position: number): UnitSlot {
  return {
    key: `${slotCode}#1`,
    slotCode,
    label: slotCode.replace(/_/g, " "),
    section: "details",
    pool: "bank_item",
    required: false,
    quantity: 1,
    perGuest: false,
    dayIndex: null,
    position,
    note: "",
  };
}

const SLOTS: UnitSlot[] = SLOT_CODES.map((code, i) => slot(code, 60 + i * 2));

function item(
  id: string,
  claims: readonly string[],
  worlds: Ingredient["worlds"] = {},
  extra: Partial<Ingredient> = {}
): Ingredient {
  return {
    pool: "bank_item",
    id,
    slug: id,
    name: id,
    description: "",
    priceCents: 1000,
    facets: {},
    occasions: [],
    slots: claims.map((slotCode) => ({ slotCode, fit: "native", note: null })),
    worlds,
    issuance: null,
    minGuests: null,
    maxGuests: null,
    shape: null,
    isFixture: true,
    ...extra,
  };
}

const nativeHere = { [HERE.id]: { forbidden: false, native: true, affinity: 0, note: null } };
const nativeElsewhere = {
  [ELSEWHERE]: { forbidden: false, native: true, affinity: 0, note: null },
};
const forbiddenHere = {
  [HERE.id]: { forbidden: true, native: false, affinity: 0, note: null },
};

/**
 * The shape of the real bank as db/043 left it: most rows in the general
 * bucket, a handful lit and dressed, and almost nothing to take home.
 */
const BANK: Ingredient[] = [
  item("linen", ["the_table_set"], nativeHere),
  item("place-cards", ["the_table_set"], nativeHere),
  item("lanterns", ["the_light"], nativeHere),
  // The founder's rock: one item, two claims. Counts in two cells, once in the
  // room's total.
  item("rock", ["the_table_set", "the_atmosphere"], nativeHere),
  item("tombola", ["the_atmosphere"], nativeHere),
  // Unclassified: no slot claim at all, so eligible for every slot — the
  // general bucket's whole point, and a partition-breaker in the other
  // direction.
  item("unclassified", [], nativeHere),
  // Written for Havana. Reaches nothing here, in any slot.
  item("daiquiri-tray", ["the_table_set"], nativeElsewhere),
  // Refused here by name even though it claims the slot.
  item("neon", ["the_light"], forbiddenHere),
];

/** The reporter, with every applicant filter switched off. */
function reporterGaps(ingredients: readonly Ingredient[]) {
  const pools = scopePools(
    SLOTS,
    ingredients,
    HERE,
    "dinner_party",
    {},
    [],
    (id) => id,
    SCALE,
    null,
    OPTIONS,
    OPTIONS.now!
  );
  const byCode = new Map<string, { candidates: number; gap: boolean }>();
  for (const entry of pools.values()) {
    byCode.set(entry.slot.slotCode, {
      candidates: entry.candidates.length,
      gap: entry.gap !== null,
    });
  }
  return byCode;
}

test("drift: the board's per-slot count and the reporter's candidate list are the same set", () => {
  const reported = reporterGaps(BANK);
  for (const code of SLOT_CODES) {
    const board = claimsForSlot(BANK, HERE.id, HERE.name, code);
    const engine = reported.get(code);
    assert.ok(engine, `the reporter planned no ${code}`);
    assert.equal(
      board.length,
      engine.candidates,
      `"${code}": the coverage board counts ${board.length} and the engine ` +
        `scopes ${engine.candidates}. One of the two files has grown a ` +
        `filter the other does not have — see src/lib/selection/slot-coverage.ts.`
    );
  }
});

test("drift: an empty board cell is a fired gap, and a filled one is not", () => {
  const reported = reporterGaps(BANK);
  for (const code of SLOT_CODES) {
    const board = claimsForSlot(BANK, HERE.id, HERE.name, code);
    assert.equal(
      board.length === 0,
      reported.get(code)!.gap,
      `"${code}": the board says ${board.length === 0 ? "empty" : "covered"} ` +
        `and the gap reporter says the opposite. This is the exact divergence ` +
        `the founder's second ruling forbids.`
    );
  }
});

test("drift: the take-home is empty on the board and a gap in the engine, together", () => {
  // db/043 left the bank with almost nothing to take home. That is the state
  // this board must be able to report, so it is the state the guard fixes on.
  const board = claimsForSlot(BANK, HERE.id, HERE.name, "the_take_home");
  assert.deepEqual(
    board.map((i) => i.id),
    ["unclassified"],
    "only the unclassified row reaches the take-home, because an item with no " +
      "slot claim claims every slot"
  );

  const withoutTheSpill = BANK.filter((i) => i.id !== "unclassified");
  assert.equal(claimsForSlot(withoutTheSpill, HERE.id, HERE.name, "the_take_home").length, 0);
  assert.equal(reporterGaps(withoutTheSpill).get("the_take_home")!.gap, true);
});

test("an applicant emptying a pool is not drift — the containment runs one way", () => {
  // Same catalogue, but every candidate for the light is now too big for the
  // party. The board still says covered, because the board has no applicant;
  // the reporter still fires, because she has one. Both are right, and the
  // invariant the shared module states is the one-way implication, not equality.
  const tooBig = BANK.map((i) =>
    i.id === "lanterns" || i.id === "unclassified" ? { ...i, minGuests: 400 } : i
  );
  assert.ok(claimsForSlot(tooBig, HERE.id, HERE.name, "the_light").length > 0);
  assert.equal(reporterGaps(tooBig).get("the_light")!.gap, true);

  // The implication in the direction that must hold: nothing the catalogue
  // refuses can be rescued by a host.
  const noLight = BANK.filter((i) => i.id !== "lanterns" && i.id !== "unclassified");
  assert.equal(claimsForSlot(noLight, HERE.id, HERE.name, "the_light").length, 0);
  assert.equal(reporterGaps(noLight).get("the_light")!.gap, true);
});

test("claims are not a partition, and the room's total is the distinct count", () => {
  const cells = SLOT_CODES.map(
    (code) => claimsForSlot(BANK, HERE.id, HERE.name, code).length
  );
  // table set: linen, place-cards, rock, unclassified = 4
  // light: lanterns, unclassified = 2
  // atmosphere: rock, tombola, unclassified = 3
  // take-home: unclassified = 1
  assert.deepEqual(cells, [4, 2, 3, 1]);

  const distinct = itemsForRoom(BANK, HERE.id, HERE.name, SLOT_CODES);
  assert.deepEqual(
    distinct.map((i) => i.id).sort(),
    ["lanterns", "linen", "place-cards", "rock", "tombola", "unclassified"]
  );

  // THE MISMATCH THE FOUNDER PRE-APPROVED. Ten claims, six items. The rock is
  // in two cells and the unclassified row is in four, and neither is a
  // double-count — it is the truth about the rock.
  assert.equal(
    cells.reduce((a, b) => a + b, 0),
    10
  );
  assert.equal(distinct.length, 6);
  assert.ok(distinct.length < cells.reduce((a, b) => a + b, 0));
});

test("placement returns both halves, so a gap keeps its two ranked sentences", () => {
  const refusedByRoom = placement(
    item("daiquiri-tray", ["the_table_set"], nativeElsewhere),
    HERE.id,
    HERE.name,
    "the_table_set"
  );
  assert.equal(refusedByRoom.eligible, false);
  assert.equal(refusedByRoom.world.eligible, false);
  assert.equal(refusedByRoom.slot.eligible, true);
  assert.match(refusedByRoom.world.reason, /\S/);

  const refusedBySlot = placement(
    item("lanterns", ["the_light"], nativeHere),
    HERE.id,
    HERE.name,
    "the_take_home"
  );
  assert.equal(refusedBySlot.eligible, false);
  assert.equal(refusedBySlot.world.eligible, true);
  assert.equal(refusedBySlot.slot.eligible, false);
  assert.match(refusedBySlot.slot.reason, /\S/);
});
