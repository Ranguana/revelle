/**
 * THE DAY BEAT, DRIVEN RATHER THAN ASSERTED — db/068.
 *
 * Founder, 2026-09-06: "day_material should come back for multi-day occasions
 * only", and "field days are daytime games".
 *
 * ── WHY THIS FILE DRIVES THE ENGINE INSTEAD OF READING THE CHAIN ────
 *
 * `one-game.test.ts` already asserts what the migration chain leaves in
 * `occasion_slot`, and that is a fact about a table. This asks the next
 * question, which is the one CLAUDE.md rule 24's corollary makes urgent:
 * DOES THE MECHANISM THOSE ROWS TURN ON ACTUALLY WORK?
 *
 * `per_day` had not run in production since db/061, because db/061 deleted the
 * only three rows in the table that ever carried it — a finding first written
 * down in a superseded migration and credited in db/068's header. So the day
 * loop in `src/lib/selection/occasion.ts` has been reachable by nothing for a
 * week, and "NEVER USED" MEANS "NEVER TESTED AGAINST THE TABLES IT WILL
 * ACTUALLY MEET". An instrument's first real use is its first test unless
 * somebody forces an earlier one. This forces one.
 *
 * The rules handed to `planSlots` are built FROM THE REPLAY, not typed out
 * here: the facts a ruling was made about — which occasion, which slot, which
 * pool, per-day or not, how many offered — come from db/ and would go red if a
 * later migration moved them. The label and the section are cosmetic and are
 * supplied, because `planSlots` only prints them.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { ALL_GAMES, type GameSlotClaim } from "./games.ts";
import {
  OCCASION_DAYS,
  OCCASION_SHAPES,
  replayOccasionSlots,
} from "./occasion-slot-replay.ts";
import { planSlots } from "./selection/occasion.ts";
import { slotEligibility } from "./selection/occasion.ts";
import type { OccasionShape, Scale, SlotRule } from "./selection/types.ts";

/**
 * The authored claim in the shape the engine reads it in. `note` is optional in
 * src/lib/games.ts and nullable in the selection types, and the two say the
 * same thing — one absent note. Converted here rather than loosened at either
 * end, because both files are right about their own side of the seeder.
 */
const asClaims = (claims: readonly GameSlotClaim[]) =>
  claims.map((claim) => ({ ...claim, note: claim.note ?? null }));

const SCALE: Scale = {
  guestBand: null,
  guestsLow: 8,
  guestsHigh: 14,
  guestsPlanning: 12,
  spendBand: null,
  perPersonLow: null,
  perPersonHigh: null,
  perPersonPlanning: null,
  budgetPlanning: null,
  budgetCeiling: null,
  retiredBudgetBand: null,
};

/** Every game-pool beat one occasion carries, as the engine would receive it. */
function rulesFor(occasion: string): SlotRule[] {
  const replay = replayOccasionSlots();
  const rows = [...replay.rows.values()].filter(
    (row) => row.occasion === occasion && row.pool === "game"
  );
  assert.ok(rows.length > 0, `${occasion} draws from the game pool nowhere`);

  return rows.map((row, index) => ({
    slotCode: row.slotCode,
    label: row.slotCode === "day_material" ? "The day" : "The fun",
    description: "",
    section: "details",
    perGuest: false,
    pool: row.pool,
    minCount: 1,
    maxCount: 1,
    offerCount: row.offerCount,
    required: true,
    perDay: row.perDay,
    position: (index + 1) * 10,
    note: "",
    excludedBy: null,
  }));
}

function shapeOf(occasion: string): OccasionShape {
  const days = OCCASION_DAYS.get(occasion);
  assert.ok(days !== undefined, `${occasion} has no occasion_shape row`);
  return {
    occasion: occasion as OccasionShape["occasion"],
    label: occasion,
    days,
    note: "",
    scheduledGameMax: 3,
  };
}

/* ── the day beat, on an occasion that has days ──────────────────────── */

test("A MULTI-DAY OCCASION GETS ONE DAY BEAT PER DAY, and per_day is what does it", () => {
  const multiDay = [...OCCASION_DAYS].filter(([, days]) => days > 1);
  assert.ok(multiDay.length >= 2, `${multiDay.length} occasions run more than one day`);

  for (const [occasion, days] of multiDay) {
    const plan = planSlots(rulesFor(occasion), shapeOf(occasion), SCALE);
    const dayBeats = plan.slots.filter((slot) => slot.slotCode === "day_material");

    assert.equal(
      dayBeats.length,
      days,
      `${occasion} runs ${days} days and planned ${dayBeats.length} day beats. ` +
        `If this is 1, per_day is false on the row and the weekend has one ` +
        `afternoon of material for three afternoons.`
    );
    assert.deepEqual(
      dayBeats.map((slot) => slot.dayIndex),
      Array.from({ length: days }, (_, i) => i + 1),
      `${occasion}'s day beats are not stamped with the day they belong to. ` +
        `dayIndex is what the itinerary and the morning bulletin read.`
    );
    // And each one is a beat in its own right rather than three alternatives:
    // distinct keys, distinct positions, and no offer group, because db/068
    // left offer_count at 1 on the day.
    assert.equal(new Set(dayBeats.map((s) => s.key)).size, days);
    for (const beat of dayBeats) {
      assert.equal(beat.offerGroup, null, `${occasion}'s day beat is offered as a carousel`);
      assert.equal(beat.required, true, `${occasion}'s day beat is not required`);
    }
  }
});

test("AND THE EVENING'S GAME IS STILL ONE GAME, offered three ways", () => {
  // db/061's ruling, checked from the side most likely to break it: the file
  // that gives a weekend three day beats must not have given it three games.
  for (const [occasion, days] of OCCASION_DAYS) {
    const plan = planSlots(rulesFor(occasion), shapeOf(occasion), SCALE);
    const game = plan.slots.filter((slot) => slot.slotCode === "game");

    assert.equal(
      game.length,
      3,
      `${occasion} planned ${game.length} units for the evening's game rather ` +
        `than one beat offering three.`
    );
    assert.equal(
      new Set(game.map((slot) => slot.offerGroup)).size,
      1,
      `${occasion}'s three game units are not one offer. Three offer groups ` +
        `would be three games, which is the ruling db/061 exists to hold.`
    );
    assert.equal(
      game.filter((slot) => slot.required).length,
      1,
      `${occasion} requires more than one of the three offered games. Only the ` +
        `first card of an offer is required; the rest are the alternatives.`
    );
    assert.deepEqual(
      game.map((slot) => slot.dayIndex),
      [null, null, null],
      `${occasion}'s game beat was stamped with a day. It is the EVENING's ` +
        `game and it does not repeat — ${days} days or one.`
    );
  }
});

test("A ONE-EVENING OCCASION HAS NO DAY BEAT AT ALL", () => {
  // The other direction, and the half a widened predicate would break without
  // anything going red: an evening has no daytime to carry material.
  const single = [...OCCASION_DAYS].filter(([, days]) => days === 1);
  assert.ok(single.length >= 5, `${single.length} occasions run one day`);

  for (const [occasion] of single) {
    const plan = planSlots(rulesFor(occasion), shapeOf(occasion), SCALE);
    assert.deepEqual(
      plan.slots.filter((slot) => slot.slotCode === "day_material"),
      [],
      `${occasion} runs one evening and was planned a day beat. She said ` +
        `multi-day ONLY.`
    );
  }
});

/* ── the time of day ─────────────────────────────────────────────────── */

test("THE TIME OF DAY DEFAULTS TO NO OPINION, never to `always`", () => {
  /*
   * db/031's argument, inherited whole by db/068: "`all` meaning NO OPINION
   * rather than 'every phase'. The default is `all` because most content has no
   * time of day, and a tag that has to be filled in for every row gets filled
   * in wrongly."
   *
   * So the test is not that games carry a phase. It is that almost none of them
   * do, and that the ones that do mean it.
   */
  const stated = ALL_GAMES.filter((game) => game.phase !== undefined);
  const silent = ALL_GAMES.filter((game) => game.phase === undefined);

  assert.ok(
    silent.length > stated.length,
    `${stated.length} of ${ALL_GAMES.length} games state a time of day. If ` +
      `most of the pool has an opinion about the hour, the field has been ` +
      `filled in rather than answered — which is the exact failure db/031 ` +
      `chose the default to prevent.`
  );

  for (const game of stated) {
    assert.notEqual(
      game.phase,
      "all",
      `${game.slug} writes phase: "all" out longhand. That is the default and ` +
        `writing it says the row thought about it, which is a claim.`
    );
    assert.ok(
      ["daylight", "dusk", "dark", "dawn"].includes(game.phase ?? ""),
      `${game.slug} claims an hour db/031 and db/033 do not define: ${game.phase}`
    );
  }
});

/* ── a field day game reaching a day slot ────────────────────────────── */

test("THE DAY BEAT IS STILL CLAIMED after the field day left it", () => {
  /*
   * The mirror of db/061's near-miss, and db/069 does BOTH halves of it in one
   * file: it takes five claims off `day_material` and puts five on a beat that
   * did not exist. Either direction failing is silent — a required beat nothing
   * can fill reports a thin catalogue rather than a migration, and a new beat
   * nothing claims simply never fills.
   */
  const onDay = ALL_GAMES.filter((game) =>
    game.slots.some((c) => c.slotCode === "day_material" && c.fit === "native")
  );
  assert.ok(
    onDay.length >= 10,
    `${onDay.length} games claim the day beat. db/068 made it REQUIRED on ` +
      `every multi-day occasion, so emptying it puts a gap in every weekend.`
  );
  for (const game of onDay) {
    assert.ok(
      slotEligibility(asClaims(game.slots), "day_material").eligible,
      `${game.slug} claims day_material natively and slotEligibility refuses it`
    );
    assert.notEqual(
      game.phase,
      "daylight",
      `${game.slug} is a field day game still claiming day_material. That beat ` +
        `deals ONE candidate per day, which is the anonymous placement db/069 ` +
        `exists to end.`
    );
  }
});

test("THE FIELD DAY IS OFFERED WHOLE, and refused everywhere else", () => {
  /*
   * Founder: "field day games include all and she chooses", and then "it is a
   * set across different days if host wants it."
   *
   * Both clauses are mechanical and both are checked. ALL: the beat's offer
   * ceiling is not below the size of the set, or the house shows a subset of
   * something she said to show whole. SHE CHOOSES: the beat is `any_of`, which
   * is the only thing that lets more than one of them run.
   */
  const fieldDay = ALL_GAMES.filter((game) =>
    game.slots.some((c) => c.slotCode === "field_day" && c.fit === "native")
  );
  assert.equal(fieldDay.length, 5, `${fieldDay.length} field day games rather than 5`);

  const beats = [...replayOccasionSlots().rows.values()].filter(
    (row) => row.slotCode === "field_day"
  );
  assert.ok(beats.length > 0, "no occasion carries the field day beat");

  for (const beat of beats) {
    assert.equal(beat.pool, "game", `${beat.occasion}'s field day draws ${beat.pool}`);
    assert.equal(
      beat.offerRule,
      "any_of",
      `${beat.occasion}'s field day is a carousel. A one_of beat delivers five ` +
        `and runs exactly one, which is "she chooses" without "include all".`
    );
    assert.ok(
      beat.offerCount >= fieldDay.length,
      `${beat.occasion}'s field day offers up to ${beat.offerCount} and the ` +
        `set is ${fieldDay.length}. "Include all" is the ruling; raise ` +
        `occasion_slot.offer_count rather than shipping a subset.`
    );
    // NOT per_day. Her third sentence in one column: a per-day beat would
    // offer the set again every morning and weld each offer to its day, which
    // is the welding she retired. One offer; the day is the member's.
    assert.equal(
      beat.perDay,
      false,
      `${beat.occasion}'s field day repeats per day. The set is an OFFER and a ` +
        `NAME, not a placement — she spreads its members across days herself.`
    );
  }

  for (const game of fieldDay) {
    assert.deepEqual(
      game.slots.map((c) => `${c.slotCode}:${c.fit}`),
      ["field_day:native"],
      `${game.slug} claims a beat besides the field day. A native claim is a ` +
        `whitelist and this is what the whitelist is for.`
    );
    assert.equal(slotEligibility(asClaims(game.slots), "game").eligible, false);
    assert.equal(slotEligibility(asClaims(game.slots), "day_material").eligible, false);
    assert.equal(slotEligibility(asClaims(game.slots), "field_day").eligible, true);
    assert.equal(game.phase, "daylight", `${game.slug} is not a daytime game`);
    assert.equal(game.shape, "scheduled");
    assert.ok(game.worlds.some((w) => w.world === "catskills" && w.native === true));
    assert.equal(game.occasions.length, 0, `${game.slug} refuses an occasion`);
  }
});

test("A FIELD DAY BEAT GOES ONLY WHERE THERE IS A DAYTIME, not where there are days", () => {
  /*
   * Ruling: a one-day field day must be reachable, and NOT by giving every
   * occasion a daytime beat. db/069 answers with a DECLARED column rather than
   * a day count (rule 30: a declared identity, never an inferred one), so the
   * two questions can diverge the moment an afternoon occasion is admitted.
   *
   * The test is written against `daytime` and NOT against `days > 1`, on
   * purpose. Asserting the day count here would make this green by
   * construction and blind at exactly the row the column exists for.
   */
  const beats = new Set(
    [...replayOccasionSlots().rows.values()]
      .filter((row) => row.slotCode === "field_day")
      .map((row) => row.occasion)
  );
  const daytime = new Set(
    [...OCCASION_SHAPES].filter(([, shape]) => shape.daytime).map(([o]) => o)
  );

  assert.deepEqual([...beats].sort(), [...daytime].sort());
  assert.ok(daytime.size > 0, "no occasion declares a daytime");
  assert.ok(
    daytime.size < OCCASION_SHAPES.size,
    "every occasion declares a daytime. That is the flattening db/061 paid " +
      "for — a dinner party is not entitled to a sack race."
  );

  for (const [occasion, shape] of OCCASION_SHAPES) {
    if (shape.daytime) continue;
    assert.ok(
      !beats.has(occasion),
      `${occasion} has no daytime and was given a field day`
    );
  }
});

test("the field day is FIVE GAMES, not one game with five events in it", () => {
  // Founder: "field day games include all and she chooses for the daily
  // newsletter/itinerary." You cannot choose among events inside one game, so
  // the plural is mechanical and not stylistic. Counted, because "several" is
  // not a number and this is the assertion a later consolidation would break.
  const fieldDay = ALL_GAMES.filter((game) => game.phase === "daylight");
  assert.equal(fieldDay.length, 5);
  for (const game of fieldDay) {
    assert.equal(
      game.printedMatter.length,
      1,
      `${game.slug} prints ${game.printedMatter.length} pieces. One artwork per ` +
        `game, and five games is five sheets — not one sheet with five games on it.`
    );
    assert.equal(game.sourcing, "provided", `${game.slug} is not provided`);
    assert.ok(
      game.runbook.steps.some((step) => step.phase === "playing"),
      `${game.slug} has no play in it`
    );
  }
  assert.equal(
    new Set(fieldDay.map((game) => game.printedMatter[0].piece)).size,
    1,
    "the five sheets share one piece code, which is what makes them one " +
      "afternoon's set of objects rather than five unrelated designs"
  );
});
