import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

/**
 * THE SEEDER AND THE MIGRATION MUST HOLD BACK THE SAME ROWS.
 *
 * Pool content stocks itself (CLAUDE.md rule 13), and the one exception is a
 * row carrying a founder-pending question IN ITS OWN TEXT. There is no list of
 * held slugs anywhere on purpose: a list is a thing that falls out of date, and
 * text cannot.
 *
 * But the test is made TWICE — once in JavaScript, by the seeder deciding what
 * status to write on a row it is creating, and once in SQL, by the migration
 * that cleared the existing backlog. A divergence between them is silent and
 * one-directional: it means a row the migration would have held is one the
 * seeder offers. Nothing raises. The row is simply in front of members with the
 * founder's unanswered question inside it.
 *
 * So the two are compared here, by name, as strings:
 *
 *   scripts/seed-games.mjs  `PROSE`, the columns whose text is read
 *   db/038                  the `concat_ws(...)` argument list
 *
 * The marker string itself is compared for the same reason — SQL cannot import
 * scripts/catalogue-vocabulary.mjs, so it spells the literal, and a typo in
 * eleven characters would hold nothing.
 */

const ROOT = new URL("../../", import.meta.url).pathname;

const MARKER = "FOUNDER-PENDING";

test("the games hold-back reads the same columns in the seeder and in db/038", () => {
  const seeder = readFileSync(`${ROOT}scripts/seed-games.mjs`, "utf8");
  const migration = readFileSync(
    `${ROOT}db/038-games-are-shelf-not-world.sql`,
    "utf8"
  );

  const block = /const PROSE = \[([\s\S]*?)\n\];/.exec(seeder);
  assert.ok(
    block,
    "scripts/seed-games.mjs has no `const PROSE = [ … ];` — if the hold-back " +
      "moved, this test has to be told where it went rather than passing on a " +
      "list it could not find."
  );
  const fromSeeder = [...block[1].matchAll(/\["([a-z_]+)"/g)].map((m) => m[1]);
  assert.ok(fromSeeder.length > 0, "PROSE names no columns");

  const concat = /concat_ws\(' ',([\s\S]*?)\)\s*\n?\s*not like/.exec(migration);
  assert.ok(
    concat,
    "db/038 has no `concat_ws(' ', …) not like` hold-back predicate. The " +
      "migration and the seeder must make the same test; if the predicate " +
      "changed shape, change this test with it."
  );
  const fromSql = concat[1]
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s !== "");

  assert.deepEqual(
    fromSql,
    fromSeeder,
    `db/038 and scripts/seed-games.mjs read different columns when deciding ` +
      `whether a game carries a founder-pending question. A game the ` +
      `migration would hold is one the seeder offers, silently, with the ` +
      `question still in it.`
  );
});

test("every place that spells the hold-back marker spells it the same", () => {
  const files = [
    "scripts/catalogue-vocabulary.mjs",
    "scripts/seed-bank.mjs",
    "db/036-pool-content-stocks-itself.sql",
    "db/038-games-are-shelf-not-world.sql",
  ];

  for (const file of files) {
    const src = readFileSync(`${ROOT}${file}`, "utf8");
    assert.ok(
      src.includes(MARKER),
      `${file} no longer contains ${MARKER}. It is the only hold-back list ` +
        `there is and it lives in the content; a file that stopped spelling ` +
        `it has stopped participating in the hold-back.`
    );
  }

  // The one authoritative definition, so the string above is not just another
  // copy of a copy.
  const vocabulary = readFileSync(
    `${ROOT}scripts/catalogue-vocabulary.mjs`,
    "utf8"
  );
  assert.match(
    vocabulary,
    new RegExp(`export const FOUNDER_PENDING = "${MARKER}";`),
    "scripts/catalogue-vocabulary.mjs must export FOUNDER_PENDING as the one " +
      "definition the seeders import. Migrations spell the literal because SQL " +
      "cannot import it."
  );
});
