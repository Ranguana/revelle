/**
 * WHAT POOLS EXIST, READ OFF THE MIGRATIONS THAT CREATE THEM.
 *
 * This module exists so that `src/lib/pools/registry.ts` can be GENERATED
 * rather than typed, and so that one test can fail on the day a migration
 * registers a pool nobody told TypeScript about. It is the only honest
 * compile-time answer to a question whose real answer lives in a database.
 *
 * ── WHY NOT JUST READ `ingredient_pool` ─────────────────────────────
 *
 * Because a runtime read cannot produce a compile error, and a compile error is
 * the whole point (CLAUDE.md rule 19). `connections.ts`, `publish.ts` and
 * `portal/picks.ts` already read the registry at runtime and are right to; that
 * pattern catches a missing pool when somebody opens the screen. What it cannot
 * catch is a hand-written UNION — `catalogue.ts`'s POOLS, `facets.ts`'s
 * TAGGABLE, `requirements.ts`'s REQUIRABLE — because those are types, and types
 * are gone before a connection is opened.
 *
 * ── SO THE MIGRATIONS ARE THE COMPILE-TIME TRUTH ────────────────────
 *
 * `db/*.sql` is the only description of the schema that exists in the repo, it
 * is applied in numeric order and never edited after the fact, and a pool is
 * registered by exactly one of six statements:
 *
 *     install_revelle_ingredients('X', …)   →  revelle_X, and a row of
 *                                              ingredient_pool  (db/002, db/009)
 *     install_facet_tags('X', …)            →  X_facet          (db/002)
 *     install_occasion_eligibility('X')     →  X_occasion       (db/009)
 *     install_slot_eligibility('X')         →  X_slot           (db/009)
 *     install_world_affinity('X')           →  X_world          (db/009, db/019)
 *     insert into ingredient_pool values ('world', null, …)      (db/002)
 *
 * The join names are not guessed here. Each installer computes its own name by
 * concatenation INSIDE the migration — `v_join := p_entity_table || '_facet'`,
 * `v_table := p_entity_table || '_occasion'` — and this file reproduces that
 * one derivation in one place so that no consumer has to. That is the
 * difference rule 19 draws: concatenating a table name at the point of use is a
 * guess that goes stale; concatenating it once, next to the migration text it
 * was read from, and checking the result against the live database in a test,
 * is a derivation.
 *
 * ── AND WHAT THIS DELIBERATELY DOES NOT CARRY ───────────────────────
 *
 * `typical_draw` and `label` are columns of `ingredient_pool` that migrations
 * UPDATE after the fact — db/022 moves dish to 3 and menu to 0 — and that
 * nothing needing a compile-time answer ever reads. Copying them here would be
 * a second opinion about a number the database owns, kept current by hand,
 * feeding nothing: rule 15's shape exactly. They stay in the database, where
 * `connections.ts` and `publish.ts` read them live.
 *
 * ── NODE-ONLY ───────────────────────────────────────────────────────
 *
 * Imports `node:fs`. Only the generator script and the registry test import
 * this module; nothing the app renders ever does. `registry.ts` is the pure
 * constant, and it is what everything else imports.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * One entity the migrations have registered, with the tables they installed.
 *
 * TWO REGISTRIES, NOT ONE, and the difference is load-bearing. `taste_cohort`
 * has a `taste_cohort_facet` table and no row of `ingredient_pool` — it is a
 * thing that gets TAGGED, never a thing that gets ISSUED. `world` is the
 * mirror case in the other direction: a row of `ingredient_pool` with a null
 * `join_table`, because db/001 already carries the chosen destination as
 * `revelle.world_id`. Collapsing the two into one list is how a curator ends up
 * offered a tag picker for a pool that has no facet table, or how the engine
 * tries to select destinations as if they were ingredients.
 */
export type DerivedEntity = {
  /** `ingredient_pool.entity_table` / `facet_tag_entity.entity_table`. */
  pool: string;
  /** It has a row of `ingredient_pool`. False for `taste_cohort` alone. */
  ingredient: boolean;
  /** `revelle_<pool>`, or null for an entity that keeps no ingredient rows. */
  joinTable: string | null;
  /** `<pool>_facet`, or null where `install_facet_tags` was never called. */
  facetTable: string | null;
  /** `<pool>_occasion`, or null. */
  occasionTable: string | null;
  /** `<pool>_slot`, or null. */
  slotTable: string | null;
  /** `<pool>_world`, or null. */
  worldTable: string | null;
};

/**
 * SQL with its commentary removed — line comments and block comments alike.
 *
 * A prose mention is not a registration. db/005 discusses
 * `install_facet_tags('tracklist', …)` in a worked example sixty lines before
 * it runs it, and db/017 names the function in an argument it never calls.
 */
function strip(sql: string): string {
  return sql.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/--[^\n]*/g, " ");
}

/** The migrations, in the order Postgres applies them. */
export function migrationFiles(dbDir: string): string[] {
  return readdirSync(dbDir)
    .filter((name) => name.endsWith(".sql"))
    .sort((a, b) => Number.parseInt(a, 10) - Number.parseInt(b, 10) || a.localeCompare(b))
    .map((name) => join(dbDir, name));
}

/**
 * Every registered entity, derived from `db/*.sql`.
 *
 * Ordered by `pool` so the generated file is stable under a re-run: the order
 * migrations happen to run in is not a fact anybody should be able to diff.
 */
export function deriveEntities(dbDir: string): DerivedEntity[] {
  const found = new Map<string, DerivedEntity>();
  const at = (pool: string): DerivedEntity => {
    const existing = found.get(pool);
    if (existing) return existing;
    const fresh: DerivedEntity = {
      pool,
      ingredient: false,
      joinTable: null,
      facetTable: null,
      occasionTable: null,
      slotTable: null,
      worldTable: null,
    };
    found.set(pool, fresh);
    return fresh;
  };

  for (const file of migrationFiles(dbDir)) {
    const sql = strip(readFileSync(file, "utf8"));

    // A CALL, not a definition. Every installer is declared as
    // `install_x(p_entity_table text …)`, so requiring a quote after the paren
    // is what separates the six registrations from their own two `create or
    // replace function` bodies (db/002 and db/009 both define one).
    const call = (fn: string) =>
      [...sql.matchAll(new RegExp(`\\b${fn}\\s*\\(\\s*'([a-z_]+)'`, "g"))].map(
        (m) => m[1]
      );

    for (const pool of call("install_revelle_ingredients")) {
      const entity = at(pool);
      entity.ingredient = true;
      entity.joinTable = `revelle_${pool}`;
    }
    for (const pool of call("install_facet_tags")) {
      at(pool).facetTable = `${pool}_facet`;
    }
    for (const pool of call("install_occasion_eligibility")) {
      at(pool).occasionTable = `${pool}_occasion`;
    }
    for (const pool of call("install_slot_eligibility")) {
      at(pool).slotTable = `${pool}_slot`;
    }
    for (const pool of call("install_world_affinity")) {
      at(pool).worldTable = `${pool}_world`;
    }

    // THE ONE POOL THAT IS INSERTED BY HAND — `world`, with `join_table` null,
    // because db/001 already carries the chosen destination as
    // `revelle.world_id` and a join table would be a second place for one fact.
    // src/lib/portal/picks.ts argues the consequence at length. The literal
    // quote is again what skips the same INSERT inside the installer's body,
    // where the value is `p_entity_table`.
    for (const m of sql.matchAll(
      /insert\s+into\s+ingredient_pool\b[\s\S]{0,400}?values\s*\(\s*'([a-z_]+)'/g
    )) {
      at(m[1]).ingredient = true;
    }
  }

  return [...found.values()].sort((a, b) => a.pool.localeCompare(b.pool));
}

/**
 * The pools db/033's CHECK will accept an `entity_table` of, as the migrations
 * currently leave it.
 *
 * Read rather than assumed, because this constraint has DRIFTED once already:
 * db/020 wrote five pools into it, three more pools were registered, and db/033
 * had to repair it. `src/lib/desk/requirements.ts` derives its `Requirable`
 * union from the registry, and the test asserts the two agree — which is the
 * only way a third drift shows up as a red test instead of as a 500 in front of
 * a curator.
 *
 * The LAST occurrence wins, for the same reason Postgres does: db/033 drops the
 * constraint db/020 created and adds its own.
 */
export function deriveRequirable(dbDir: string): string[] | null {
  let latest: string[] | null = null;
  for (const file of migrationFiles(dbDir)) {
    const sql = strip(readFileSync(file, "utf8"));
    for (const m of sql.matchAll(
      /constraint\s+ingredient_requirement_known_pool\s+check\s*\(\s*entity_table\s+in\s*\(([^)]*)\)/g
    )) {
      latest = [...m[1].matchAll(/'([a-z_]+)'/g)].map((q) => q[1]);
    }
  }
  return latest;
}
