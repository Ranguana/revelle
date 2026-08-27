/**
 * THE GENERATED REGISTRY, AGAINST A REAL `ingredient_pool` — CLAUDE.md rule 20.
 *
 *   createdb revelle_pools && npm run migrate      # against that database
 *   REVELLE_TEST_DATABASE_URL=postgres://…/revelle_pools npm test
 *
 * SKIPPED unless REVELLE_TEST_DATABASE_URL is set, exactly like
 * ../portal/picks.db.test.ts and for its reasons.
 *
 * ── WHY THIS FILE EXISTS BESIDE ./registry.test.ts ───────────────────
 *
 * Rule 20: "Anything that asserts a property of production must read
 * PRODUCTION, or say plainly which of the two it checked."
 *
 * `./registry.test.ts` checks `src/lib/pools/registry.ts` against `db/*.sql`.
 * That is a check of the REPO against the REPO. It catches the failure that has
 * actually happened four times — a migration lands and a hand-written list does
 * not follow — and it catches it with no database, on every `npm test`, which
 * is why it is the primary guard.
 *
 * What it cannot catch is the whole of `derive.ts` being subtly wrong about
 * what those migrations DO: a regex that misses a call, an installer whose name
 * changes, a `create table … _world` written out longhand instead of through
 * the installer. Every one of those produces a registry that agrees perfectly
 * with the parser that produced it and disagrees with Postgres. That is rule
 * 20's "report generated from something other than reality", and only a
 * connection can tell.
 *
 * So the division is stated rather than blurred. This file asks the two truth
 * sources named in rule 19 — `ingredient_pool` and `facet_tag_entity` — and
 * compares them to the constant every consumer imports.
 *
 * It writes nothing and creates nothing, so it is safe against any migrated
 * database including a copy of production.
 */
import assert from "node:assert/strict";
import test, { after, before } from "node:test";

import pg from "pg";

import { POOL_ENTITIES, tablesFor } from "./registry.ts";

const URL = process.env.REVELLE_TEST_DATABASE_URL;
const skip = URL ? false : "set REVELLE_TEST_DATABASE_URL to run";

let client: pg.Client | null = null;

before(async () => {
  if (!URL) return;
  client = new pg.Client({ connectionString: URL });
  await client.connect();
});

after(async () => {
  await client?.end();
});

test("ingredient_pool agrees with the generated registry", { skip }, async () => {
  const { rows } = await client!.query<{
    entity_table: string;
    join_table: string | null;
    world_table: string | null;
    slot_table: string | null;
    occasion_table: string | null;
  }>(
    `select entity_table, join_table, world_table, slot_table, occasion_table
       from ingredient_pool
      order by entity_table`
  );

  assert.ok(rows.length > 0, "ingredient_pool is empty — is this database migrated?");

  const expected = POOL_ENTITIES.filter((entity) => entity.ingredient);

  assert.deepEqual(
    rows.map((row) => row.entity_table),
    expected.map((entity) => entity.pool),
    "the database's pool list and src/lib/pools/registry.ts disagree. If the " +
      "database is right, `npm run gen:pools` and read the diff; if the parser " +
      "in src/lib/pools/derive.ts missed a registration, fix the parser — the " +
      "registry is generated and is never edited by hand."
  );

  for (const row of rows) {
    const generated = tablesFor(row.entity_table);
    assert.ok(generated, `${row.entity_table} is in ingredient_pool, not in the registry`);
    assert.deepEqual(
      {
        joinTable: row.join_table,
        worldTable: row.world_table,
        slotTable: row.slot_table,
        occasionTable: row.occasion_table,
      },
      {
        joinTable: generated.joinTable,
        worldTable: generated.worldTable,
        slotTable: generated.slotTable,
        occasionTable: generated.occasionTable,
      },
      `the scoping tables the database records for '${row.entity_table}' are ` +
        `not the ones src/lib/pools/derive.ts read out of db/*.sql. This is ` +
        `the failure ./registry.test.ts structurally cannot see: the parser ` +
        `and the constant agree with each other and both are wrong.`
    );
  }
});

test("facet_tag_entity agrees with the generated registry", { skip }, async () => {
  const { rows } = await client!.query<{
    entity_table: string;
    join_table: string;
  }>(`select entity_table, join_table from facet_tag_entity order by entity_table`);

  assert.ok(rows.length > 0, "facet_tag_entity is empty — is this database migrated?");

  assert.deepEqual(
    rows.map((row) => row.entity_table),
    POOL_ENTITIES.filter((entity) => entity.facetTable).map((entity) => entity.pool),
    "the database's taggable-entity list and src/lib/pools/registry.ts " +
      "disagree. The desk's tag pickers are built from the registry, so a " +
      "pool missing here is a pool a curator cannot describe — which is how " +
      "tracklist and bank_item sat untaggable."
  );

  for (const row of rows) {
    assert.equal(
      tablesFor(row.entity_table)?.facetTable,
      row.join_table,
      `facet_tag_entity names '${row.join_table}' for ${row.entity_table}`
    );
  }
});

test("every table the registry names actually exists", { skip }, async () => {
  const named: string[] = [];
  for (const entity of POOL_ENTITIES) {
    named.push(entity.pool);
    for (const table of [
      entity.joinTable,
      entity.facetTable,
      entity.occasionTable,
      entity.slotTable,
      entity.worldTable,
    ]) {
      if (table) named.push(table);
    }
  }

  const { rows } = await client!.query<{ tablename: string }>(
    `select tablename from pg_tables where schemaname = 'public'
      and tablename = any($1::text[])`,
    [named]
  );

  const present = new Set(rows.map((row) => row.tablename));
  const absent = named.filter((table) => !present.has(table));

  assert.deepEqual(
    absent,
    [],
    `src/lib/pools/registry.ts names tables that do not exist: ` +
      `${absent.join(", ")}. Every one of these is composed into SQL by the ` +
      `engine or the desk, so each is a 500 waiting for whichever screen ` +
      `touches that pool first.`
  );
});
