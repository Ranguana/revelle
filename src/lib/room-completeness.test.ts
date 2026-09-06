/**
 * WHAT A ROOM OWES — the guard on the completeness report.
 *
 * The report's whole value is that it does not lie about absence, so every
 * assertion here is about the difference between NOTHING OWED and COULD NOT BE
 * MEASURED. `portal/occasions.ts` is the reason: it enumerated five pools by
 * hand, omitted two, and would have rendered a member's package minus its
 * dishes with no error and no gap message.
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { POOL_ENTITIES } from "./pools/registry.ts";
import { countUnderHeading, countDrinksUnderHeading, poolReports, structuralItems } from "./room-completeness.ts";

const NO_SOURCES = {
  dishes: null, drinks: null, heading: null, games: null,
  bankItems: null, gesture: null, dishFloor: null,
};

test("every registered pool is reported on, and none is enumerated by hand", () => {
  // Rule 19. If a tenth pool is registered tomorrow this must report on it
  // without being edited — and if it cannot read that pool it must say
  // `unknown`, never score it satisfied.
  const reported = poolReports("nantucket", NO_SOURCES).map((p) => p.pool).sort();
  const registered = POOL_ENTITIES.map((p) => p.pool).sort();
  assert.deepEqual(reported, registered, "the report and the registry disagree about what the pools are");
});

test("a pool whose source cannot be read is UNKNOWN, never empty", () => {
  // Rule 26's trap in a new place: a room must not read as complete because
  // nothing could be counted. This is the assertion that keeps `unknown` from
  // collapsing into "nothing owed".
  const reports = poolReports("nantucket", NO_SOURCES);
  const dish = reports.find((p) => p.pool === "dish");
  assert.equal(dish?.state, "unknown");
  assert.equal(dish?.count, null, "an unreadable source must not report a count of 0");
  const drink = reports.find((p) => p.pool === "drink");
  assert.equal(drink?.state, "unknown");
  assert.equal(drink?.count, null);
});

test("a missing heading reads as unknown, not as an empty room", () => {
  const withDoc = { ...NO_SOURCES, dishes: "## Havana\n- one · B\n- two · M\n", heading: "Nowhere" };
  const dish = poolReports("nantucket", withDoc).find((p) => p.pool === "dish");
  assert.equal(dish?.state, "unknown", "a heading that is not in the document is unmeasured, not zero");
});

test("counting is scoped to the room's own section", () => {
  const doc = "## Havana\n- a · B\n- b · M\n\n## Nantucket\n- c · B\n\n## Tahiti\n- d · B\n- e · B\n";
  assert.equal(countUnderHeading(doc, "Havana"), 2);
  assert.equal(countUnderHeading(doc, "Nantucket"), 1);
  assert.equal(countUnderHeading(doc, "Tahiti"), 2);
  assert.equal(countUnderHeading(doc, "Absent"), null, "an absent heading is null, not 0");
  assert.equal(countUnderHeading(null, "Havana"), null, "an unreadable document is null, not 0");
});

test("drinks are counted by entry, not by bullet", () => {
  // A drink is `**4.1**` followed by bullets for the drink, its mirror, the
  // occasion, the season and the mixing. Counting bullets would report six
  // drinks where there is one.
  const doc = "## Nantucket\n\n### 4 · A porch night\n\n**4.1**\n- Cape Codders\n- Cranberry-lime soda\n- Dinner\n- Summer\n- Bought and poured\n\n**4.2**\n- Cold beer\n- Mirror owed\n- Dinner\n- Summer\n- Bought and poured\n";
  assert.equal(countDrinksUnderHeading(doc, "Nantucket"), 2);
  assert.equal(countUnderHeading(doc, "Nantucket"), 10, "the bullet count is what the naive read would have given");
});

test("a retired pool is retired, not missing, and carries its migration", () => {
  const menu = poolReports("nantucket", NO_SOURCES).find((p) => p.pool === "menu");
  assert.equal(menu?.state, "retired");
  assert.match(menu?.note ?? "", /db\/045/, "a retirement carries its reason (rule 17)");
});

test("pools that are not world-scoped are not counted against a room", () => {
  for (const pool of ["taste_cohort", "world"]) {
    const r = poolReports("nantucket", NO_SOURCES).find((p) => p.pool === pool);
    assert.equal(r?.state, "not-scoped", `${pool} is being scored against a room`);
  }
});

test("an unsigned room reports unsigned, whatever else it has", () => {
  // Admission is a signature (rule 13). A room can be complete on every
  // mechanical check and still not be a room.
  const hk = structuralItems("hong-kong-1963", NO_SOURCES);
  const signed = hk.find((i) => i.label === "signed onto `authored`");
  assert.equal(signed?.ok, false);
  assert.match(signed?.detail ?? "", /signature/i);

  const nantucket = structuralItems("nantucket", NO_SOURCES);
  assert.equal(nantucket.find((i) => i.label === "signed onto `authored`")?.ok, true);
});

test("a gesture held at NULL with its reason is not the same as no gesture", () => {
  // Catskills is held at NULL on purpose — "FOUNDER DECIDES — mock awards vs.
  // last-up-turns-off-the-string-lights" — which is rule 17 working. A room
  // with no clause at all is a different state and must read differently.
  const pending = structuralItems("catskills", { ...NO_SOURCES, gesture: "NULL — the founder has not decided" });
  const none = structuralItems("tokyo-1978", NO_SOURCES);
  const g = (items: ReturnType<typeof structuralItems>) => items.find((i) => i.label === "signature gesture");
  assert.match(g(pending)?.detail ?? "", /founder decides/i);
  assert.match(g(none)?.detail ?? "", /no GESTURE clause/);
  assert.equal(g(pending)?.ok, false);
  assert.equal(g(none)?.ok, false);
});
