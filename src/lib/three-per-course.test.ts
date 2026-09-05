/**
 * THREE PER COURSE, AND SHE PICKS ONE OF EACH — db/062.
 *
 * Founder, 2026-09-05: "we had talked about making the menu changeable, lets
 * give 3 menu options (if member wants) like we do for games", and, asked
 * whether that meant three whole composed menus or three per course, "three
 * per course".
 *
 * Three things are proved here and they fail differently:
 *
 *   · THE RULING LANDED. Twenty-seven course beats offer three, across all
 *     nine occasions, and no other beat changed.
 *   · IT IS AN EXTENSION AND NOT A SECOND MECHANISM. The migration adds no
 *     column, no table, no index and no dish-specific anything, because
 *     db/061 built every one of those pool-agnostically.
 *   · THE MENU POOL IS STILL RETIRED. "Menu options" was her word for the
 *     table, and reading it as three composed menus would have un-retired
 *     thirty-nine rows on an agent's inference.
 *
 * The replay's own label, restated because CLAUDE.md rule 31 says where a
 * number is read from belongs beside it: this reads THE COMMITTED CHAIN, not
 * production. It proves what a deploy of these files produces and what a future
 * migration would break.
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  MIGRATION_CODE,
  OCCASIONS,
  replayOccasionSlots,
} from "./occasion-slot-replay.ts";

const DB062 = "062-three-per-course.sql";

/** db/022's composed table. A menu is not an object; it is these three. */
const COURSES = ["the_appetizer", "the_main", "the_dessert"] as const;

/* ── the ruling ─────────────────────────────────────────────────────── */

test("THREE PER COURSE: every course beat of every occasion offers three", () => {
  const replay = replayOccasionSlots();

  // Rule 24's smallest form. A replay that matched no offer_count update would
  // make every assertion here pass by having nothing to compare against.
  assert.ok(
    replay.offerUpdates >= 2,
    `parsed ${replay.offerUpdates} offer_count updates — db/061's and db/062's`
  );

  const courses = [...replay.rows.values()].filter((row) =>
    (COURSES as readonly string[]).includes(row.slotCode)
  );

  assert.equal(
    courses.length,
    27,
    "nine occasions times three courses, exactly as db/022 wrote them"
  );

  const wrong = courses
    .filter((row) => row.offerCount !== 3)
    .map((row) => `${row.occasion}/${row.slotCode} offers ${row.offerCount}`);

  assert.deepEqual(
    wrong,
    [],
    "these course beats do not offer three. A beat left at 1 is a course the " +
      "house places, which is what every course was before her ruling and is " +
      "indistinguishable from it on the page"
  );

  // AND EVERY OCCASION HAS ALL THREE. An occasion offering a choice of
  // appetizer and a main the house simply gave her reads as a bug in the page
  // rather than as the ruling half-applied.
  const byOccasion = new Map<string, string[]>();
  for (const row of courses) {
    byOccasion.set(row.occasion, [
      ...(byOccasion.get(row.occasion) ?? []),
      row.slotCode,
    ]);
  }
  assert.deepEqual(
    [...byOccasion.keys()].sort(),
    [...OCCASIONS].sort(),
    "every occasion sets a composed table, so every occasion chooses in it"
  );
  for (const [occasion, codes] of byOccasion) {
    assert.deepEqual(
      codes.slice().sort(),
      [...COURSES].sort(),
      `${occasion} does not offer three at all three courses`
    );
  }
});

test("every course beat still contains ONE dish — an or, not an and", () => {
  // `offer_count` multiplies what she is SHOWN. `min_count` and `max_count`
  // say how many items the beat contains and are untouched at 1, which is the
  // whole of "as an or not an and". If this ever reverses she is served three
  // appetizers rather than choosing one, which is a different party.
  const sql = MIGRATION_CODE.get(DB062) ?? "";
  assert.doesNotMatch(
    sql,
    /set[^;]*\b(min_count|max_count)\b/,
    "db/062 changes no count. Only how many candidates are offered"
  );
});

test("no beat outside the courses was swept along", () => {
  const replay = replayOccasionSlots();

  const offering = [...replay.rows.values()]
    .filter((row) => row.offerCount > 1)
    .map((row) => `${row.occasion}/${row.slotCode}`)
    .sort();

  const expected = [
    ...OCCASIONS.map((occasion) => `${occasion}/game`),
    ...OCCASIONS.flatMap((occasion) =>
      COURSES.map((course) => `${occasion}/${course}`)
    ),
  ].sort();

  assert.deepEqual(
    offering,
    expected,
    "exactly the game beat and the three courses offer a choice. Anything " +
      "else here is a beat that started offering three without a ruling — " +
      "which is why db/062 names the three slot codes rather than writing " +
      "`where pool = 'dish'` (CLAUDE.md rule 32: symmetry is not evidence)"
  );
});

/* ── it extends db/061 rather than growing a second mechanism ───────── */

test("db/062 ADDS NO SCHEMA. The carousel was built pool-agnostic", () => {
  const sql = MIGRATION_CODE.get(DB062) ?? "";

  // db/061's own argument for putting offer_count on occasion_slot and
  // offer_group/chosen_at on every join table was that "a column that could
  // only hold the answer for one pool would absorb the other answers and drop
  // them (rule 16)". This test is that argument's receipt: the second pool
  // needed one update and no new object.
  for (const forbidden of [
    /alter table/,
    /create table/,
    /create index/,
    /create unique index/,
    /add column/,
    /add constraint/,
  ]) {
    assert.doesNotMatch(
      sql,
      forbidden,
      `db/062 defines schema (${forbidden}). Everything a carousel needs ` +
        `already exists on every pool — if this file needed a new object, ` +
        `something in db/061 was built for games rather than for offers.`
    );
  }

  assert.match(
    sql,
    /update occasion_slot\s+set offer_count = 3\s+where pool = 'dish'\s+and slot_code in \('the_appetizer', 'the_main', 'the_dessert'\)/,
    "the whole schema change, named by slot code"
  );
});

test("THE OFFER BINDS, THE CHOICE DOES NOT — unchanged for dishes", () => {
  const sql = MIGRATION_CODE.get(DB062) ?? "";

  // db/061's load-bearing decision governs every pool. All nine dishes are
  // delivered at approval and are inside the fingerprint; her three picks are
  // timestamps outside it. So she may change her mind about any course, as
  // often as she likes, and the house can never refuse a card it dealt her —
  // which is why this file must not go near the fingerprint machinery.
  assert.doesNotMatch(
    sql,
    /compute_assemblage_fingerprint|revelle_assemblage_unique|assemblage_guard/,
    "a choice made after delivery that could change the fingerprint could " +
      "COLLIDE, and the guard would refuse her a card she was already given"
  );

  // And nothing retro-marks a delivered Revelle. Its three courses were
  // PLACED, before choosing existed; a fabricated decision is worse than an
  // honest absence of one (rule 33's "name what it cannot repair").
  assert.doesNotMatch(
    sql,
    /update revelle_dish[\s\S]{0,200}set chosen_at/,
    "db/062 backfills no choice"
  );
});

test("the menu pool stays retired. 'Menu options' meant the courses", () => {
  const sql = MIGRATION_CODE.get(DB062) ?? "";

  // Her word was "menu options"; her ruling was "three per course". A menu has
  // not been an object since db/045 retired the pool — a menu IS these three
  // courses — and reading the first word without the second would have brought
  // thirty-nine rows back into selection on an inference.
  assert.doesNotMatch(
    sql,
    /insert into occasion_slot[\s\S]*'the_menu'/,
    "no occasion_slot row for the_menu comes back"
  );
  assert.doesNotMatch(
    sql,
    /update ingredient_pool[^;]*entity_table = 'menu'/,
    "and the menu pool's typical_draw stays where db/022 put it"
  );
  assert.match(
    sql,
    /update ingredient_pool set typical_draw = 9 where entity_table = 'dish'/,
    "a Revelle draws nine dishes now — the offer, because the offer is what " +
      "is issued and headroom counts issued sets"
  );
});
