/**
 * THE TEST THAT GOES RED WHEN A POOL IS REGISTERED AND A LIST DOES NOT KNOW.
 *
 * CLAUDE.md rule 19 names four instances of the same bug and one of them —
 * `menu` — was memorialised in a comment inside `src/lib/selection/catalogue.ts`
 * which then grew the bug a SECOND time with `bank_item`. A comment is not a
 * guard. This file is the guard.
 *
 * ── WHAT IT ASSERTS, AND WHAT EACH ASSERTION WOULD HAVE CAUGHT ───────
 *
 * 1. `registry.ts` matches `db/*.sql`. A migration that calls
 *    `install_revelle_ingredients` without `npm run gen:pools` fails HERE, in
 *    the one file whose whole job is to notice. This is the assertion that
 *    turns "somebody has to remember" into "something goes red".
 *
 *      → db/012 registered `menu`. Red the same commit.
 *      → db/031 registered `bank_item`. Red the same commit.
 *
 * 2. The engine's catalogue lists exactly `STOCKED_POOLS`. Its POOLS object is
 *    now `Record<StockedPool, PoolSpec>`, so a missing pool is ALSO a compile
 *    error — but a compile error can be silenced by widening a type in a hurry,
 *    and `npx tsc --noEmit` is not what runs in CI's `npm test`. This asserts
 *    the same fact at runtime, from the values, so both doors are shut.
 *
 *      → With db/012 applied and no `menu` entry, red, naming `menu`.
 *      → With db/031 applied and no `bank_item` entry, red, naming `bank_item`.
 *
 *    That is the exact failure that instead showed up as `the_menu` reporting a
 *    catalogue gap on every occasion that had one however full the pool was,
 *    and as 174 published bank items reaching nobody.
 *
 * 3. A stocked pool has all four scoping tables. db/031 gave `bank_item` a
 *    `revelle_bank_item` and none of `bank_item_facet`, `_occasion`, `_slot`,
 *    `_world`, which is why the catalogue entry "could not simply be added" and
 *    sat undone for three migrations. A half-installed pool is a real state and
 *    it should be LOUD rather than latent.
 *
 *      → Red for `bank_item` from db/031 until db/043 made the four calls.
 *        That is the point: the twelve migrations in between are exactly the
 *        window in which nothing said anything.
 *
 * 4. db/033's CHECK on `ingredient_requirement.entity_table` accepts every
 *    stocked pool and nothing else. This constraint has drifted once already —
 *    db/020 wrote five pools, three more were registered, db/033 repaired it.
 *
 *      → Red from db/012 until db/033, naming `menu`, `drink` and `dish` as
 *        pools the desk could offer and the database would refuse with a 500.
 *
 * 5. Nothing in `src/` composes a scoping table name by concatenation. This is
 *    rule 19's second clause, and it is what stops the class of bug coming back
 *    through a file nobody thought to add to this test.
 *
 * ── WHAT THIS FILE DELIBERATELY CANNOT ASSERT ────────────────────────
 *
 * `src/lib/desk/facets.ts` and `src/lib/desk/requirements.ts` are marked
 * "server-only" and cannot be imported by `node --test`. They are therefore
 * fixed by SUBTRACTION rather than by assertion: both now derive their lists
 * from `registry.ts` instead of keeping one, so there is no second copy left to
 * drift. Assertions 1 and 4 cover the registry those two now read, which is the
 * whole of what they used to spell out.
 *
 * And this file checks the MIGRATIONS, not the database. That is rule 20's
 * distinction and it is stated rather than blurred: see ./registry.db.test.ts,
 * which asserts the same constant against a live `ingredient_pool` and
 * `facet_tag_entity` and skips when no database is configured.
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { CATALOGUE_POOLS } from "../selection/catalogue.ts";
import { deriveEntities, deriveRequirable } from "./derive.ts";
import {
  ENTITY_TABLES,
  FACET_ENTITIES,
  POOL_ENTITIES,
  REQUIRABLE_POOLS,
  STOCKED_POOLS,
  facetTableFor,
  idColumnFor,
  tablesFor,
} from "./registry.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const DB_DIR = join(ROOT, "db");
const SRC_DIR = join(ROOT, "src");

const REGENERATE = "Run `npm run gen:pools` and re-read the diff before trusting it.";

test("the generated registry still matches db/*.sql", () => {
  const derived = deriveEntities(DB_DIR);

  assert.deepEqual(
    derived.map((entity) => entity.pool),
    [...ENTITY_TABLES],
    `A migration registered, renamed or removed an entity and ` +
      `src/lib/pools/registry.ts was not regenerated. ${REGENERATE}`
  );

  // Field by field rather than one deepEqual of the whole array, because the
  // failure this catches most often is ONE null table on ONE pool and the
  // message should say which.
  for (const entity of derived) {
    const generated = tablesFor(entity.pool);
    assert.ok(generated, `pool '${entity.pool}' is in db/ and not in the registry`);
    assert.deepEqual(
      {
        ingredient: generated.ingredient,
        joinTable: generated.joinTable,
        facetTable: generated.facetTable,
        occasionTable: generated.occasionTable,
        slotTable: generated.slotTable,
        worldTable: generated.worldTable,
      },
      {
        ingredient: entity.ingredient,
        joinTable: entity.joinTable,
        facetTable: entity.facetTable,
        occasionTable: entity.occasionTable,
        slotTable: entity.slotTable,
        worldTable: entity.worldTable,
      },
      `the registry's tables for '${entity.pool}' disagree with db/. ${REGENERATE}`
    );
  }
});

test("the two derived sub-lists agree with the entities they come from", () => {
  assert.deepEqual(
    [...STOCKED_POOLS],
    POOL_ENTITIES.filter((e) => e.ingredient && e.joinTable).map((e) => e.pool),
    `STOCKED_POOLS is out of step with POOL_ENTITIES. ${REGENERATE}`
  );
  assert.deepEqual(
    [...FACET_ENTITIES],
    POOL_ENTITIES.filter((e) => e.facetTable).map((e) => e.pool),
    `FACET_ENTITIES is out of step with POOL_ENTITIES. ${REGENERATE}`
  );

  // The two registries are NOT the same set, and a change that made them the
  // same would be a change worth stopping on. `taste_cohort` is tagged and
  // never issued; `world` is issued (as the frame) and has no join table.
  assert.ok(
    FACET_ENTITIES.includes("taste_cohort"),
    "taste_cohort lost its facet table — db/002's tagging vocabulary is the " +
      "one thing the desk cannot work without"
  );
  assert.ok(
    !(STOCKED_POOLS as readonly string[]).includes("world"),
    "world acquired a join table. db/001 already carries the chosen " +
      "destination as revelle.world_id; a second place for one fact is the bug."
  );
});

test("THE ENGINE CAN SEE EVERY POOL THE REGISTRY KNOWS ABOUT", () => {
  // The one that would have caught `menu` in db/012 and `bank_item` in db/031.
  const missing = STOCKED_POOLS.filter((pool) => !CATALOGUE_POOLS.includes(pool));
  const extra = CATALOGUE_POOLS.filter(
    (pool) => !(STOCKED_POOLS as readonly string[]).includes(pool)
  );

  assert.deepEqual(
    missing,
    [],
    `src/lib/selection/catalogue.ts's POOLS is missing ${missing.join(", ")}. ` +
      `This is CLAUDE.md rule 19 in its worst shape: the pool has rows, the ` +
      `engine cannot see them, every slot that wants one reports a catalogue ` +
      `gap that names this file rather than a real hole, and NOTHING THROWS. ` +
      `It happened to 'menu' (db/012) and again to 'bank_item' (db/031).`
  );
  assert.deepEqual(
    extra,
    [],
    `src/lib/selection/catalogue.ts lists ${extra.join(", ")}, which no ` +
      `migration registers. The engine would query a table that is not there.`
  );
});

test("a stocked pool carries all four of its scoping tables", () => {
  for (const pool of STOCKED_POOLS) {
    const tables = tablesFor(pool);
    assert.ok(tables, `${pool} vanished from the registry`);
    const absent = (
      [
        ["facetTable", "install_facet_tags"],
        ["occasionTable", "install_occasion_eligibility"],
        ["slotTable", "install_slot_eligibility"],
        ["worldTable", "install_world_affinity"],
      ] as const
    )
      .filter(([field]) => tables[field] === null)
      .map(([, installer]) => installer);

    assert.deepEqual(
      absent,
      [],
      `pool '${pool}' is HALF-INSTALLED: its migration never called ` +
        `${absent.join(", ")}. loadIngredients() composes from all four, so ` +
        `the pool cannot enter the engine until a migration finishes the job — ` +
        `which is what db/043 did for bank_item, twelve migrations after ` +
        `db/031 left it in this state with nothing saying so.`
    );
  }
});

test("db/033's requirement CHECK accepts exactly the stocked pools", () => {
  const inMigrations = deriveRequirable(DB_DIR);
  assert.ok(
    inMigrations,
    "no ingredient_requirement_known_pool CHECK found in db/ — either it was " +
      "dropped without a replacement, or it was renamed and this test now " +
      "reads nothing while looking green"
  );

  assert.deepEqual(
    [...REQUIRABLE_POOLS].sort(),
    [...inMigrations].sort(),
    `REQUIRABLE_POOLS is out of step with the CHECK in db/. ${REGENERATE}`
  );

  assert.deepEqual(
    [...inMigrations].sort(),
    [...STOCKED_POOLS].sort(),
    `db/033's CHECK and the pool registry disagree. A pool the CHECK omits ` +
      `is one the desk offers a requirement form for and the database refuses ` +
      `with a constraint violation raised as a 500 in front of a curator; a ` +
      `pool it names that no longer exists is dead vocabulary. This drifted ` +
      `once already — db/020 wrote five pools, three more were registered, ` +
      `and db/033 had to repair it. Repair it in a NEW migration, not here.`
  );
});

test("the derived helpers agree with the constant", () => {
  for (const entity of POOL_ENTITIES) {
    assert.equal(idColumnFor(entity.pool), `${entity.pool}_id`);
    if (entity.facetTable) {
      assert.equal(facetTableFor(entity.pool), entity.facetTable);
      assert.equal(entity.facetTable, `${entity.pool}_facet`);
    }
  }
  assert.equal(tablesFor("no_such_pool"), null);
});

/* ── rule 19's second clause: no scoping table built by concatenation ── */

/**
 * Files allowed to compose a scoping table name, each with the reason.
 *
 * One entry, and it should stay one. It exists so that a future exception is
 * written down WITH ITS ARGUMENT rather than deleted from this test in a hurry
 * — CLAUDE.md rule 14's shape applied to a guard.
 */
const MAY_COMPOSE: Readonly<Record<string, string>> = {
  "src/lib/pools/derive.ts":
    "THE ONE PLACE THE DERIVATION IS ALLOWED TO HAPPEN, and the reason the " +
    "rest of the tree is forbidden it. Each installer computes its own name " +
    "by concatenation inside the migration — `v_join := p_entity_table || " +
    "'_facet'` in db/002 — and this file reproduces that single derivation " +
    "beside the migration text it was read from, once, so that no consumer " +
    "has to. Its output is then checked against a live ingredient_pool by " +
    "./registry.db.test.ts. That is the difference the rule draws: composing " +
    "at the point of use is a guess that goes stale; composing once, next to " +
    "the source, and verifying it against the database, is a derivation.",
};

/** `${anything}_facet` and its three siblings, inside a template literal. */
const COMPOSED = /\$\{[^}]*\}_(facet|occasion|slot|world)\b/;

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      out.push(...sourceFiles(path));
    } else if (/\.(ts|tsx)$/.test(name)) {
      out.push(path);
    }
  }
  return out;
}

test("no scoping table name is built by concatenation in src/", () => {
  const offenders: string[] = [];

  for (const path of sourceFiles(SRC_DIR)) {
    const rel = relative(ROOT, path);
    // This file quotes the pattern in its own prose, and so does the comment in
    // catalogue.ts that explains what the code used to do — a mention is not a
    // use, exactly as derive.ts's `strip()` argues about SQL.
    if (rel === relative(ROOT, __filenameish())) continue;
    if (rel in MAY_COMPOSE) continue;

    const source = readFileSync(path, "utf8");
    for (const [index, line] of source.split("\n").entries()) {
      // Skip comment lines. The code this guards is always inside a template
      // literal in a query, never in a `//` or ` *` line.
      const trimmed = line.trim();
      if (trimmed.startsWith("//") || trimmed.startsWith("*")) continue;
      if (COMPOSED.test(line)) offenders.push(`${rel}:${index + 1}  ${trimmed}`);
    }
  }

  assert.deepEqual(
    offenders,
    [],
    `A scoping table name is being composed at the point of use:\n` +
      offenders.map((o) => `    ${o}`).join("\n") +
      `\n\nCLAUDE.md rule 19: that is correct until a pool is registered ` +
      `whose migration did not call that installer, and then it names a table ` +
      `that is not there. Use tablesFor(pool) from src/lib/pools/registry.ts, ` +
      `which returns null in the type and forces the caller to decide. If ` +
      `there is a real reason to compose, add the file to MAY_COMPOSE above ` +
      `WITH THE REASON — do not delete this test.`
  );
});

/** This file's own path, without relying on CJS `__filename` under type strip. */
function __filenameish(): string {
  return fileURLToPath(import.meta.url);
}
