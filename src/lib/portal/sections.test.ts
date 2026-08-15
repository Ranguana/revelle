/**
 * THE READING ORDER, AND THE ABSENCE RULE, AS TESTS.
 *
 * Both are things a page can break silently. A section printed in the
 * database's order still renders; it just reads wrong, and nobody notices for
 * a month. A heading printed over an empty section also still renders, and
 * that one is the product's central rule — she must never learn that a slot
 * existed.
 */

import assert from "node:assert/strict";
import test from "node:test";

import type { SectionKind } from "../selection/types.ts";
import { SECTION_NAMES, inHouseOrder, inWords, longDate } from "./sections.ts";

function piece(section: SectionKind, name: string) {
  return { section, name };
}

test("the house's order is not the database's", () => {
  // The order slot_kind.position would give: the table (30) before the moment
  // (40), and the edit last. What she is shown is the order the house has
  // always used for a destination.
  const grouped = inHouseOrder([
    piece("edit", "The ice"),
    piece("details", "A crate of lemons"),
    piece("fun", "Fishbowl"),
    piece("arrival", "Cold rosé"),
    piece("moment", "Art Battle"),
    piece("soundtrack", "PORCH AND DOCK"),
  ]);

  assert.deepEqual(
    grouped.map((g) => g.section),
    ["arrival", "moment", "fun", "soundtrack", "details", "edit"]
  );
});

test("pieces sharing a section are gathered even when they arrive apart", () => {
  // THE TABLE holds `table_object` at position 30 and `the_menu` at 35, with
  // the moment and the honouring numbered between them. Grouping by adjacency
  // would give two separate TABLE headings.
  const grouped = inHouseOrder([
    piece("details", "A crate of lemons"),
    piece("moment", "Art Battle"),
    piece("details", "A long summer dinner"),
  ]);

  assert.equal(grouped.length, 2);
  const table = grouped.find((g) => g.section === "details");
  assert.equal(table?.items.length, 2, "one heading, both pieces under it");
});

test("A SECTION WITH NOTHING IN IT IS NOT IN THE RESULT", () => {
  // The absence rule, at the only level a page could break it. There is no
  // empty group to iterate, so there is no way to print a heading over one.
  const grouped = inHouseOrder([piece("fun", "Fishbowl")]);

  assert.equal(grouped.length, 1);
  assert.equal(grouped[0].section, "fun");
  assert.ok(
    grouped.every((g) => g.items.length > 0),
    "no heading over nothing, ever"
  );
});

test("nothing at all is nothing at all", () => {
  assert.deepEqual(inHouseOrder([]), []);
});

test("every section her Revelle can carry has a name the house would use", () => {
  // `world` is the one that matters: docs/copy-brief.md bans the word in
  // customer copy and says THE WORLD becomes THE LOOK.
  assert.equal(SECTION_NAMES.world, "The Look");
  assert.equal(SECTION_NAMES.details, "The Table");
  assert.equal(SECTION_NAMES.make_it_happen, "The Prep");
  assert.ok(
    Object.values(SECTION_NAMES).every((name) => !/world/i.test(name)),
    "the word world never reaches a member"
  );
});

test("small counts are words, because a numeral beside a heading is a badge", () => {
  assert.equal(inWords(1), "one");
  assert.equal(inWords(5), "five");
  assert.equal(inWords(12), "twelve");
  assert.equal(inWords(27), "27");
});

test("a date is a day and a month, and the year only when it is not this one", () => {
  const now = new Date("2026-06-01T00:00:00Z");

  assert.equal(longDate("2026-09-05", now), "Saturday, September 5");
  assert.equal(longDate("2024-04-18", now), "Thursday, April 18, 2024");
  // Parsed from the parts, not from the string: `new Date("2026-09-05")` is
  // midnight UTC and reads as the fourth anywhere west of Greenwich.
  assert.ok(longDate("2026-09-05", now).includes("5"));
  assert.equal(longDate(null), "", "an undated Revelle says nothing");
});
