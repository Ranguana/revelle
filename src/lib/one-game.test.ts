/**
 * ONE GAME REACHES THE EVENING, AND SHE CHOOSES IT FROM THREE — db/061.
 *
 * Founder, 2026-09-04: "there shouldnt be more than one ga[m]e", and "what i
 * do want to do is give a host three ga[m]es to choose from. as an or not an
 * and. like a carousel look."
 *
 * ── WHERE THE REPLAY WENT ───────────────────────────────────────────
 *
 * The migration replay this file used to carry now lives in
 * `src/lib/occasion-slot-replay.ts`, unchanged in behaviour and extended to
 * follow `offer_count`. db/062 made "three per course" a second ruling about
 * the same table, `src/lib/three-per-course.test.ts` asserts it, and two
 * replays of one chain would drift in the worst possible way — each green
 * about a different reading of the same files (CLAUDE.md rule 21).
 *
 * The argument for replaying migrations at all, and for refusing to guess at a
 * statement, is written at the top of that module.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  MIGRATION_CODE,
  OCCASIONS,
  OCCASION_DAYS,
  replayOccasionSlots,
  type OccasionSlotRow,
} from "./occasion-slot-replay.ts";

const CODE = MIGRATION_CODE;

const DB061 = "061-one-game-and-she-picks-it.sql";

/* ── replaying occasion_slot ────────────────────────────────────────── */

type Row = OccasionSlotRow;

/**
 * Every occasion_slot row the committed chain leaves behind, with the counts
 * that prove the parser matched something.
 *
 * Rule 24 in its smallest form: a parser that matched nothing would make every
 * assertion below pass by having nothing to compare against.
 */
function occasionSlots(): Map<string, Row> {
  const replay = replayOccasionSlots();

  assert.ok(replay.inserts >= 5, `parsed ${replay.inserts} occasion_slot inserts`);
  assert.ok(replay.deletes >= 2, `parsed ${replay.deletes} occasion_slot deletes`);
  assert.ok(replay.rows.size >= 40, `replayed ${replay.rows.size} occasion_slot rows`);
  assert.equal(OCCASIONS.length, 9, `parsed ${OCCASIONS.length} occasions`);

  return new Map(replay.rows);
}

/* ── the ruling ─────────────────────────────────────────────────────── */

/*
 * ── THE RULING, AS IT STANDS AFTER db/068 ───────────────────────────
 *
 * THE SUPERSEDED READING, KEPT PER CLAUDE.md RULE 14 BECAUSE IT IS THE ONE A
 * LATER AGENT WILL RE-DERIVE. This file used to assert that each occasion drew
 * from the game pool EXACTLY ONCE, full stop — one row, `slot_code = 'game'`,
 * and every other beat that had ever drawn a game deleted. That was the right
 * assertion for db/061 as db/061 was briefed, and the briefing was wrong.
 *
 * WHAT BEAT IT: the founder's "there shouldnt be more than one ga[m]e" was
 * said about a Westhampton DINNER PARTY that came out carrying Art Battle and
 * Fishbowl on one night, and it means ONE GAME PER EVENING. It was implemented
 * as one game per REVELLE, which deleted `day_material` — a beat about the
 * DAYTIME of an occasion that runs longer than an evening — and orphaned ten
 * authored claims on it. Founder, 2026-09-06: "day_material should come back
 * for multi-day occasions only."
 *
 * So the invariant SPLITS rather than loosening, which is the shape CLAUDE.md
 * prescribes for exactly this (an exception a checker derives is an exception
 * that silently widens):
 *
 *   the evening    exactly one `game` beat per occasion, every occasion, and
 *                  it is never multiplied per day. UNCHANGED by db/068.
 *   the day        `day_material`, on the occasions that have days and on no
 *                  others. One per day, and the count comes from
 *                  occasion_shape rather than from a list of occasion names.
 *
 * Both halves are counted below, in both directions, because "the day beat is
 * missing" and "the day beat is everywhere" look identical from outside.
 */

test("ONE GAME PER EVENING: exactly one `game` beat per occasion", () => {
  const rows = [...occasionSlots().values()].filter((r) => r.slotCode === "game");

  const wrong = rows.filter((r) => r.pool !== "game").map((r) => r.occasion);
  assert.deepEqual(wrong, [], "the game beat draws from the game pool");

  assert.deepEqual(
    rows.map((r) => r.occasion).sort(),
    [...OCCASIONS].sort(),
    `every occasion has exactly one game beat. Before db/061 seven of nine ` +
      `drew from the game pool more than once in one evening — a birthday ` +
      `drew five times — and a Westhampton dinner party delivered Art Battle ` +
      `AND Fishbowl, which is what the founder saw. Adding a second beat to ` +
      `the EVENING needs her, not a migration.`
  );
});

test("THE DAY BEAT IS BACK, ON MULTI-DAY OCCASIONS AND ON NO OTHERS", () => {
  // Founder, 2026-09-06: "day_material should come back for multi-day
  // occasions only." Counted in both directions (rule 24) off
  // occasion_shape.days, never off a list of occasion names (rule 19) — a
  // hand-written list here would be correct until a tenth multi-day occasion
  // is admitted and then wrong without being broken.
  const rows = [...occasionSlots().values()].filter(
    (r) => r.slotCode === "day_material"
  );

  assert.ok(OCCASION_DAYS.size >= 9, `parsed ${OCCASION_DAYS.size} occasion shapes`);
  const multiDay = [...OCCASION_DAYS].filter(([, days]) => days > 1).map(([o]) => o);
  assert.ok(multiDay.length >= 2, `${multiDay.length} occasions run more than one day`);

  assert.deepEqual(
    rows.map((r) => r.occasion).sort(),
    [...multiDay].sort(),
    `the day beat belongs to the occasions that have days. Too few and a ` +
      `weekend gets one game for three days; too many and an evening has been ` +
      `given a daytime it does not have.`
  );

  for (const row of rows) {
    assert.equal(row.pool, "game", `${row.occasion}'s day beat draws from the game pool`);
    assert.equal(
      row.offerCount,
      1,
      `${row.occasion}'s day beat offers ${row.offerCount}. db/061 gave the ` +
        `carousel to the EVENING's game; nothing she has said extends it to ` +
        `the day, and "she chooses which field day games run" is a different ` +
        `mechanism entirely — see docs/itinerary.md.`
    );
  }
});

test("the four beats db/061 collapsed still draw from nothing at all", () => {
  const rows = [...occasionSlots().values()];
  // `day_material` WAS THE FIFTH AND HAS BEEN RESTORED BY db/068. The other
  // four stay gone for db/061's own per-beat reasons, which are not about
  // counting: a moment is staged and never announced, an honouring is a ritual
  // and not a party game, and an ambient deck and a finale are unmistakably
  // games and so belong to the one beat she gets.
  const collapsed = ["the_moment", "honouring", "ambient_game", "finale"];

  for (const code of collapsed) {
    assert.equal(
      rows.filter((r) => r.slotCode === code).length,
      0,
      `${code} still has an occasion_slot row. db/061 removed it: these are ` +
        `structural beats, not games, and were never re-pointed at a ` +
        `replacement pool invented to keep the shape tidy (rule 32).`
    );
  }
});

test("their slot_kind rows are KEPT, exactly as db/022 kept the_menu", () => {
  // Rule 14 and db/022's precedent in one. An issued Revelle still names these
  // slots, and re-enabling one against a pool somebody authors later has to be
  // an insert rather than a migration reconstructing a deleted slot.
  const all = [...CODE.values()].join("\n");
  for (const code of ["the_moment", "honouring", "day_material", "ambient_game", "finale"]) {
    assert.match(
      all,
      new RegExp(`\\(\\s*'${code}'`),
      `${code} has no slot_kind row left`
    );
  }
  assert.doesNotMatch(
    CODE.get(DB061) ?? "",
    /delete from slot_kind/,
    "db/061 deletes no slot kind"
  );
});

/* ── the carousel ───────────────────────────────────────────────────── */

test("the game beat offers three, and the number is data", () => {
  const sql = CODE.get(DB061) ?? "";

  assert.match(
    sql,
    /add column offer_count integer not null default 1 check \(offer_count >= 1\)/,
    "on occasion_slot, defaulting to 1, so no other beat changes"
  );
  assert.match(
    sql,
    /update occasion_slot set offer_count = 3 where pool = 'game'/,
    "three is a product decision and it lives in a column a curator can edit, " +
      "not in a switch nobody can find (db/009's own argument about days)"
  );
});

test("the one beat accepts all three shapes, or eleven games go quiet", () => {
  const sql = CODE.get(DB061) ?? "";

  // db/010 gave `game` only `scheduled`, which was right when four other slots
  // took the ambient decks and the endings. With one beat it would have made
  // every ambient and every finale game unplaceable — a ruling about HOW MANY
  // games she gets silently deciding WHICH KINDS exist.
  assert.match(sql, /insert into slot_shape[\s\S]*'game',\s*'ambient'/);
  assert.match(sql, /insert into slot_shape[\s\S]*'game',\s*'finale'/);

  // And the claims move with the beat. Both halves are needed: the seeder
  // writes them from src/lib/games.ts on a fresh database, this repairs the
  // rows production already holds (db/053's order, rule 33).
  assert.match(
    sql,
    /insert into game_slot \(game_id, slot_code, fit, note\)/,
    "the backfill, in the same migration as the collapse"
  );
});

/* ── how the choice binds ───────────────────────────────────────────── */

test("THE OFFER BINDS, THE CHOICE DOES NOT", () => {
  const sql = CODE.get(DB061) ?? "";

  // db/003: "An assemblage is delivered once, to one person, for good",
  // binding at delivery. All three offered games are delivered into
  // revelle_game at approval, so the trio is inside the fingerprint and no two
  // members receive the same one. Her pick is a timestamp on a row she already
  // has, and the fingerprint machinery is not touched at all — which is what
  // makes the choice unrefusable and reversible without limit.
  assert.doesNotMatch(
    sql,
    /compute_assemblage_fingerprint|revelle_assemblage_unique|assemblage_guard/,
    "db/061 does not go near the fingerprint. A choice made after delivery " +
      "that could change it could COLLIDE, and the guard — correctly doing " +
      "its job — would refuse her a card the house had already dealt her."
  );

  assert.match(
    sql,
    /create unique index %I on %I \(revelle_id, offer_group\)\s*where offer_group is not null and chosen_at is not null/,
    "at most one chosen per offer: the whole mechanical content of an OR"
  );

  assert.match(
    sql,
    /check \(chosen_at is null or offer_group is not null\)/,
    "you cannot choose what you were not offered — the shape a well-meaning " +
      "backfill takes"
  );

  // And nothing retro-marks an existing Revelle as chosen. Their one game was
  // PLACED, before choosing existed; a fabricated decision is worse than an
  // honest absence of one (rule 33's "name what it cannot repair").
  assert.doesNotMatch(
    sql,
    /update revelle_game[\s\S]{0,200}set chosen_at/,
    "db/061 backfills no choice"
  );
});

test("approval delivers the offer and does not make the choice", () => {
  const proposals = readFileSync(
    new URL("./revelle/proposals.ts", import.meta.url).pathname,
    "utf8"
  );
  const insert =
    /insert into revelle_\$\{spec\.table\}\s*\(([^)]*)\)/.exec(proposals)?.[1] ?? "";

  assert.match(insert, /offer_group/, "the offer is materialised");
  assert.doesNotMatch(
    insert,
    /chosen_at/,
    "and the choice is not. It is hers to make, after delivery, in the portal"
  );
});
