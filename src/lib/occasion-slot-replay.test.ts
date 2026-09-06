/**
 * THE READER, PROVED AGAINST STATEMENTS IT DOES NOT FIND ON DISK.
 *
 * ── WHY THIS FILE EXISTS ────────────────────────────────────────────
 *
 * `src/lib/occasion-slot-replay.ts` is the one authority on what the committed
 * chain leaves in `occasion_slot`, and two rulings are asserted against it.
 * Everything else that tests it drives it over `db/`, which proves it can read
 * the statements somebody has already written and says NOTHING about the one it
 * cannot read — and the one it cannot read is the whole risk, because a reader
 * that skips a statement reports a chain it never read.
 *
 * ── THE NEAR-MISS, 2026-09-06 ───────────────────────────────────────
 *
 * A migration appeared in `db/` for about half an hour carrying
 *
 *     update occasion_slot os set per_day = true from occasion_shape sh …
 *
 * — ordinary Postgres, and a form the reader's update regex could not match,
 * because it required `set` to follow the table name directly. It matched
 * nothing, fell past every branch, and was replayed AS IF IT HAD NOT HAPPENED.
 * Nothing went red. The file was superseded and deleted for unrelated reasons,
 * which is exactly why the proof cannot live in `db/`: A PARSER PROVED BY A
 * FILE SOMEBODY MAY DELETE IS PROVED BY NOTHING.
 *
 * So the fixtures are here, they are strings, and each one is a shape the
 * reader must either understand or refuse loudly. Both halves are tested,
 * because a reader that throws on everything passes the first half.
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  code,
  OCCASION_DAYS,
  replayOccasionSlots,
} from "./occasion-slot-replay.ts";

/**
 * A chain of one file. `code()` strips prose the same way the real one is read,
 * so a fixture with a comment in it behaves like a migration with a comment in
 * it.
 */
const chain = (sql: string) => [["fixture.sql", code(sql)] as const];

/** Two rows to update: one multi-day occasion and one single-evening one. */
const SEED = `
insert into occasion_slot
  (occasion, slot_code, pool, min_count, max_count, required, per_day,
   position, note)
values
  ('getaway', 'day_material', 'game', 1, 1, true, false, 60,
   'A note with a comma, the word from in it, and where it sits.'),
  ('dinner_party', 'game', 'game', 1, 1, true, false, 70, '')
on conflict (occasion, slot_code) do nothing;
`;

test("the reader understands an aliased update with a from clause", () => {
  const replay = replayOccasionSlots(
    chain(`${SEED}
update occasion_slot os
   set per_day    = true,
       updated_at = now()
  from occasion_shape sh
 where sh.occasion = os.occasion
   and os.pool     = 'game'
   and sh.days     > 1;
`)
  );

  const day = replay.rows.get("getaway/day_material");
  assert.ok(day, "the day beat was not replayed at all");
  assert.equal(
    day.perDay,
    true,
    "the aliased update did not reach the row. This is the exact statement " +
      "that fell past every branch and was replayed as a no-op."
  );

  // AND THE OTHER DIRECTION, which is the half that catches a predicate read
  // too widely: `dinner_party` runs one day and must not have been touched.
  const evening = replay.rows.get("dinner_party/game");
  assert.ok(evening);
  assert.equal(
    evening.perDay,
    false,
    "a one-evening occasion was given a per-day beat. The predicate says " +
      "sh.days > 1 and the reader has to honour it, not approximate it."
  );
  assert.equal(OCCASION_DAYS.get("dinner_party"), 1);
});

test("a statement against this table is REFUSED, never skipped", () => {
  // The general guard, tested with a form nobody has written: a delete by
  // occasion. It is legal SQL and the reader has no predicate for it, so it
  // must throw rather than quietly leave the row in place.
  assert.throws(
    () =>
      replayOccasionSlots(
        chain(`${SEED}
delete from occasion_slot where occasion = 'getaway';
`)
      ),
    /cannot read/,
    "an unreadable delete was skipped. A replay that skips a statement is " +
      "green about a chain it did not read."
  );

  // And an insert whose rows come from somewhere this reader does not know.
  assert.throws(
    () =>
      replayOccasionSlots(
        chain(`${SEED}
insert into occasion_slot
  (occasion, slot_code, pool, min_count, max_count, required, per_day,
   position, note)
select o.occasion, 'day_material', 'game', 1, 1, true, true, 60, ''
  from some_other_table o;
`)
      ),
    /Teach it the statement/
  );
});

test("an update of a TRACKED column in an unreadable form is refused", () => {
  // The narrow case, and the reason "does it mention the column" is not enough:
  // an expression the reader cannot evaluate must not be read as a literal.
  assert.throws(
    () =>
      replayOccasionSlots(
        chain(`${SEED}
update occasion_slot set offer_count = offer_count + 1 where pool = 'game';
`)
      ),
    /cannot read/
  );
});

test("an update of an UNTRACKED column is counted and let past", () => {
  // db/061 sets `required`, `min_count` and `max_count`, none of which this
  // replay models. Refusing those would make the reader unusable; the line is
  // drawn at the columns a ruling has been made about.
  const replay = replayOccasionSlots(
    chain(`${SEED}
update occasion_slot set required = true where slot_code = 'game';
`)
  );
  assert.equal(replay.otherUpdates, 1);
  assert.equal(replay.rows.get("getaway/day_material")?.perDay, false);
});

test("an update that reaches no row is a ruling that did not land", () => {
  assert.throws(
    () =>
      replayOccasionSlots(
        chain(`${SEED}
update occasion_slot set offer_count = 3 where pool = 'tracklist';
`)
      ),
    /matched no replayed row/
  );
});

test("the on-conflict target is not read as a row", () => {
  // Rule 24, found by counting: `on conflict (occasion, slot_code) do nothing`
  // is a parenthesised group that looks exactly like a two-field tuple to a
  // reader counting brackets, and db/061's three-row insert replayed as four.
  const replay = replayOccasionSlots(chain(SEED));
  assert.equal(replay.rows.size, 2, `replayed ${replay.rows.size} rows rather than 2`);
  assert.deepEqual(
    [...replay.rows.keys()].sort(),
    ["dinner_party/game", "getaway/day_material"]
  );
});

test("a note containing a semicolon does not end the statement", () => {
  // db/022's `'… a table is offered, not insisted on.'` truncated the composed
  // table at sixteen of twenty-seven rows for a day. The scanner is the fix and
  // this is the fixture that keeps it honest.
  const replay = replayOccasionSlots(
    chain(`
insert into occasion_slot
  (occasion, slot_code, pool, min_count, max_count, required, per_day,
   position, note)
values
  ('getaway', 'day_material', 'game', 1, 1, true, true, 60,
   'One per day; occasion_shape.days does the multiplying.'),
  ('getaway', 'game', 'game', 1, 1, true, false, 70, '');
`)
  );
  assert.equal(replay.rows.size, 2, "the semicolon inside the note truncated the insert");
  assert.equal(replay.rows.get("getaway/day_material")?.perDay, true);
  assert.equal(replay.rows.get("getaway/game")?.perDay, false);
});
