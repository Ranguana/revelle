/**
 * THE WRITE BEHIND A CARD, FOR EVERY POOL — db/061, db/062.
 *
 * ── WHY THE STATEMENT IS TESTABLE SEPARATELY FROM THE WRITE ─────────
 *
 * `npm test` has no database, and the shape of this statement is exactly what
 * a second pool would get wrong: a per-pool copy that forgot to clear the
 * group would leave a host with two chosen mains until db/061's partial unique
 * index refused the third, at which point her page would fail on a CORRECTION
 * — the one gesture CLAUDE.md rule 18 exists to protect.
 *
 * So `chooseStatement` is a pure function of the registry — it lives in
 * src/lib/portal/choice.ts beside `settledSql`, because both are the one
 * statement of a fact about offers — and this file drives it the way the write
 * does. It proves the composition, not the round trip;
 * the round trip is `src/lib/portal/picks.db.test.ts`'s territory and skips
 * without a `*_TEST_DATABASE_URL`. Rule 31: where a number is read from
 * belongs beside it.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { STOCKED_POOLS } from "../pools/registry.ts";
import { chooseStatement, scheduleStatement } from "./choice.ts";

test("ONE STATEMENT, EVERY POOL — the mechanism never became per-pool", () => {
  // db/061 put `offer_group` and `chosen_at` on every join table and
  // `offer_count` on `occasion_slot` rather than on the game's, expressly so
  // that a second pool offering a choice would need no second write. db/062 is
  // that second pool. This is the receipt.
  for (const pool of STOCKED_POOLS) {
    const statement = chooseStatement(pool);
    assert.ok(statement, `no choose statement for the registered pool '${pool}'`);
    assert.deepEqual(
      statement.identifiers,
      [`revelle_${pool}`, pool, `${pool}_id`, `${pool}_id`],
      `${pool}: the join table, the entity table and the id column, from the ` +
        `registry rather than composed at the point of use (rule 19)`
    );
  }
});

test("the identifiers come from the registry, never from the request", () => {
  // `pool` is a hidden form field. A value naming no pool must not reach a
  // statement at all — it is the same class of thing as a slug naming no card,
  // and gets the same silent answer.
  assert.equal(chooseStatement("dish; drop table revelle"), null);
  assert.equal(chooseStatement("revelle_dish"), null);
  assert.equal(chooseStatement(""), null);

  // `world` IS in the registry and has no join table: a destination is the
  // frame the evening is drawn in, not a thing drawn into it, so it can never
  // be a card. Null rather than a name for a table that does not exist.
  assert.equal(chooseStatement("world"), null);
});

test("AN OR, NOT AN AND — for the offers that are an OR", () => {
  /*
   * THE SUPERSEDED ASSERTION, kept per rule 14 because it names what must
   * still be true. It read the whole set clause as
   *
   *     set chosen_at = case when t.slug = $4 then now() else null end
   *
   * and that WAS the whole of choosing while every offer in the product was
   * db/061's carousel. db/069 added `any_of` — "field day games include all
   * and she chooses" — so the same statement now serves two rules, and an
   * assertion matching the old text exactly would have forced the second rule
   * into a second statement, which is the per-pool write db/061 argued against
   * in the file this tests.
   *
   * So the invariant SPLITS rather than loosening: the exclusive branch must
   * still clear its siblings in the same pass, and the non-exclusive branch
   * must not touch them at all. Both are asserted; neither is inferred.
   */
  const sql = chooseStatement("dish")!.template;

  assert.match(
    sql,
    /when j\.offer_exclusive\s+then case when t\.slug = \$4 then now\(\) else null end/,
    "an exclusive offer is still set and cleared in one pass. There is no " +
      "instant at which she has chosen two or chosen none, and a mind-change " +
      "that could fail halfway is a mechanism that punishes correcting a " +
      "mistake (rule 18)"
  );

  // THE RULE IS READ OFF THE ROW, NEVER OFF THE CALLER. A parameter would be a
  // second authority over a fact the delivered row already carries, and both
  // ways of getting it wrong look like a working button: a carousel holding
  // two, or a field day cleared down to one game.
  assert.doesNotMatch(
    sql,
    /offer_exclusive\s*=\s*\$/,
    "the kind of offer is not something a caller may assert"
  );

  assert.match(
    sql,
    /else j\.chosen_at end/,
    "a non-exclusive offer leaves every sibling exactly as it was. Without " +
      "this branch the statement would rewrite them — harmless today, and " +
      "precisely the line somebody edits into `null` while simplifying"
  );

  assert.match(
    sql,
    /and j\.offer_group = \$3/,
    "and it reaches only the beat she pressed in — the other courses and the " +
      "game are untouched, because her three choices are three beats"
  );
});

test("UNTAKING A CARD UNSCHEDULES IT, so a correction cannot fail", () => {
  // db/069 refuses a `run_day` on a row with no `chosen_at`. Without the
  // run_day branch below, a host putting a field day game back would meet a
  // constraint violation on the way out — rule 18 again, from the schema side:
  // nothing may punish a correction.
  const sql = chooseStatement("game")!.template;
  assert.match(
    sql,
    /run_day = case\s+when t\.slug = \$4 and j\.chosen_at is not null then null/,
    "the card she is putting back loses its day in the same statement"
  );
  assert.match(sql, /else j\.run_day end/, "and no sibling's day moves");
});

test("SCHEDULING IS ITS OWN WRITE, and only reaches what she is running", () => {
  /*
   * Founder: "it is a set across different days if host wants it." A member of
   * a set is placed on a day independently of its siblings, so the day is not
   * bundled into choosing — she may take a game and say nothing about which
   * afternoon it belongs on, and null means exactly that rather than "day one".
   */
  const sql = scheduleStatement("game")!.template;

  assert.match(sql, /set run_day = \$6::integer/, "one column, and null unschedules");
  assert.match(
    sql,
    /and j\.chosen_at is not null/,
    "a day may only be put on a card she is running. The database says the " +
      "same thing and would raise; saying it here means a member who presses " +
      "a day on a game she has put back gets the silent answer instead"
  );
  assert.match(sql, /and t\.slug = \$4/, "and it reaches exactly one member of the set");

  // The same authorisation as every other member write, and the same silence.
  assert.match(sql, /r\.customer_id = \$1/);
  assert.match(sql, /j\.revelle_id = \$2/);
  assert.match(sql, /r\.status = any\(\$5::revelle_status\[\]\)/);

  // And it is scoped to a pool the registry issues, exactly as choosing is.
  assert.equal(scheduleStatement("world"), null);
  assert.equal(scheduleStatement("dish; drop table revelle"), null);

  // NOTHING ABOUT THE OFFER OR THE FINGERPRINT MOVES. `run_day` is outside the
  // assemblage with `chosen_at`, `slot` and `position`: it records where a
  // thing sits in her Revelle, not which things she has.
  const setClause = /set([\s\S]*?)\bfrom\b/.exec(sql)?.[1] ?? "";
  assert.doesNotMatch(setClause, /offer_group|chosen_at/);
  assert.doesNotMatch(sql, /\b(delete|insert)\b/);
});

test("the authorisation is on every statement, not on the page that drew it", () => {
  const sql = chooseStatement("dish")!.template;

  assert.match(sql, /r\.customer_id = \$1/, "her Revelle");
  assert.match(sql, /j\.revelle_id = \$2/, "this Revelle");
  assert.match(
    sql,
    /r\.status = any\(\$5::revelle_status\[\]\)/,
    "and one she may open. A Revelle she cannot open is a Revelle she cannot " +
      "choose in, and the list of those comes from the read path (rule 21)"
  );
});

test("nothing about the offer or the fingerprint is touched by choosing", () => {
  const sql = chooseStatement("dish")!.template;

  // db/061's load-bearing decision: the offer binds and the choice does not.
  // A write that moved `offer_group` would move a fingerprint whose ratchet
  // has already fired, and the guard would correctly refuse her a card the
  // house had already dealt her.
  // The SET clause alone. `offer_group` appears in the WHERE — it is how the
  // statement finds her beat — and matching the whole template would read that
  // as a write, which is the mistake this assertion exists to catch.
  const setClause = /set([\s\S]*?)\bfrom\b/.exec(sql)?.[1] ?? "";
  assert.ok(setClause.length > 0, "there is a set clause to read");
  assert.doesNotMatch(setClause, /offer_group/, "the offer is not rewritten");
  assert.doesNotMatch(sql, /\b(delete|insert)\b/, "and no card is taken back");
});
