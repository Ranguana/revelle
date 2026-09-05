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
import { chooseStatement } from "./choice.ts";

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

test("AN OR, NOT AN AND: one pass sets the card and clears its siblings", () => {
  const sql = chooseStatement("dish")!.template;

  assert.match(
    sql,
    /set chosen_at = case when t\.slug = \$4 then now\(\) else null end/,
    "there is no instant at which she has chosen two or chosen none. A " +
      "mind-change that could fail halfway is a mechanism that punishes " +
      "correcting a mistake (rule 18)"
  );
  assert.match(
    sql,
    /and j\.offer_group = \$3/,
    "and it reaches only the beat she pressed in — the other courses and the " +
      "game are untouched, because her three choices are three beats"
  );
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
