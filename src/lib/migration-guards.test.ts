/**
 * A MIGRATION MAY NOT ASSERT THAT SEED-SUPPLIED ROWS EXIST.
 *
 * ── THE DEFECT THIS EXISTS FOR, TWICE IN ONE DAY ────────────────────
 *
 * CLAUDE.md rule 33, in the founder's words: ANY CHECK THAT RUNS POST-SEED IN
 * SCRATCH BUT PRE-SEED IN PRODUCTION WILL PASS CI AND WEDGE THE DEPLOY.
 *
 * db/053 was the first. db/069 was the second, and it is the one this file is
 * built from: a `do $$` block raised when `field_day` had no native claimant,
 * guarded by `v_games > 0` — "only complain if the pool is populated", which
 * reads exactly like a pre-seed guard and is not one.
 *
 *   · `scripts/smoke-seeders.mjs` builds a database and SEEDS it, then the
 *     migration finds the claim and passes. Honestly green.
 *   · `render.yaml` runs `migrate` BEFORE every seeder. At that instant
 *     production holds the PREVIOUS catalogue: the game table is full, so
 *     `v_games > 0` is true, and the rows the migration is asking after have
 *     never been written because the seeder that writes them has not run.
 *
 * Zero claimants was the correct state and the guard called it a catastrophe.
 * Eight seeders never ran and production stayed on db/068.
 *
 * ── THE RULE, WHICH IS NARROWER THAN "DO NOT READ SEEDED TABLES" ────
 *
 *     A GUARD MAY ASSERT A PROPERTY OF THE ROWS THAT EXIST.
 *     IT MAY NOT ASSERT THAT ROWS EXIST.
 *
 * The first kind is vacuous on an empty table and honest on a full one — "no
 * game claims only beats no occasion has" is true of nothing, true of the old
 * catalogue, and true of the new one. The second kind has no safe reading at
 * migration time at all, and no `count > 0` precondition rescues it: A
 * POPULATED POOL PROVES THE SEEDERS RAN ONCE, NOT THAT THEY HAVE RUN SINCE THE
 * CATALOGUE GAINED THE ROWS BEING ASKED AFTER.
 *
 * ── WHY A TEST AND NOT A NOTE ───────────────────────────────────────
 *
 * Rule 20: the file that describes the deploy is not the deploy, and a
 * paragraph does not go red. Both wedges today were written by somebody who
 * had read rule 33 that morning. The rule needed a checker.
 *
 * ── AND THE EXEMPTION IS DECLARED, NEVER DERIVED ────────────────────
 *
 * CLAUDE.md: an exception a checker derives is an exception that silently
 * widens. A migration whose guard genuinely must read a seed-owned count
 * declares it by name below, with the reason, and the declaration is itself
 * counted — so a file that quietly acquires a second such guard fails even
 * though it is "already exempt".
 */

import assert from "node:assert/strict";
import test from "node:test";

import { code, MIGRATION_FILES, MIGRATION_CODE } from "./occasion-slot-replay.ts";

/**
 * TABLES WHOSE ROWS ARRIVE FROM A SEEDER, not from a migration.
 *
 * The pool entity tables and everything hanging off them, plus `world`, which
 * `seed-destinations` owns. `occasion_slot`, `occasion_shape`, `slot_kind` and
 * `slot_shape` are deliberately ABSENT: those are written by migrations, so a
 * migration may assert their contents freely and several correctly do.
 */
const SEED_OWNED = [
  "game",
  "dish",
  "drink",
  "bank_item",
  "tracklist",
  "product",
  "menu",
  "world",
];

/** `game`, `game_slot`, `game_facet`, `dish_ingredient`, … */
function isSeedOwned(table: string): boolean {
  const name = table.toLowerCase().replace(/^public\./, "");
  return SEED_OWNED.some((base) => name === base || name.startsWith(`${base}_`));
}

/**
 * DECLARED EXEMPTIONS, each with the reason it is safe.
 *
 * The key is the migration filename; the value is why a guard in it may raise
 * on a seed-owned count reaching zero. Anything not listed here is a defect,
 * and a listed file that grows a SECOND such guard is also a defect — the
 * count below is what makes that true.
 */
const DECLARED: ReadonlyMap<string, { guards: number; because: string }> =
  new Map([
    [
      "068-the-day-comes-back-and-a-game-knows-the-hour.sql",
      {
        guards: 1,
        because:
          "APPLIED IN PRODUCTION BEFORE THIS RULE EXISTED, so its text is a " +
          "record of what ran and is not edited (rule 14). Its guard is the " +
          "same shape as db/069's and survived only by luck: the " +
          "`day_material` claims it counted were written by earlier seeder " +
          "runs and PREDATED the migration, so they were already there. Had " +
          "that beat been new, this file would have wedged the deploy exactly " +
          "as db/069 did. Left in place, named here, and covered going " +
          "forward by the beat check in scripts/seed-games.mjs.",
      },
    ],
  ]);

/* ── reading the guards ─────────────────────────────────────────────── */

/** Every `do $$ … $$` body in a migration, prose already stripped. */
function plpgsqlBlocks(sql: string): string[] {
  const out: string[] = [];
  const re = /\bdo\s+(\$[A-Za-z_]*\$)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(sql)) !== null) {
    const tag = m[1];
    const start = m.index + m[0].length;
    const close = sql.indexOf(tag, start);
    out.push(sql.slice(start, close === -1 ? sql.length : close));
    re.lastIndex = close === -1 ? sql.length : close + tag.length;
  }
  return out;
}

/**
 * Variables in this block that hold a COUNT OVER A SEED-OWNED TABLE.
 *
 * Both spellings db/ uses: `select count(*) into v from game …` and the
 * `execute '…' into v` form db/069 needs for a table added by a loop.
 */
function seedCountedVars(block: string): Set<string> {
  const vars = new Set<string>();

  for (const m of block.matchAll(
    /select\s+count\(\*\)\s+into\s+([a-z_][a-z0-9_]*)\s+from\s+([a-z_.]+)/gi
  )) {
    if (isSeedOwned(m[2])) vars.add(m[1].toLowerCase());
  }
  for (const m of block.matchAll(
    /execute\s+'([^']*)'\s*into\s+([a-z_][a-z0-9_]*)/gi
  )) {
    const from = /\bfrom\s+([a-z_.]+)/i.exec(m[1]);
    if (from && isSeedOwned(from[1])) vars.add(m[2].toLowerCase());
  }
  return vars;
}

/**
 * Every `if <condition> then … raise exception …` in a block, as its condition.
 *
 * Deliberately crude and deliberately OVER-INCLUSIVE: it takes the condition
 * of the nearest `if` above each `raise exception`. A checker that missed a
 * guard would be worse than one that occasionally asks for a declaration.
 */
function raisingConditions(block: string): string[] {
  const out: string[] = [];
  for (const m of block.matchAll(/\braise\s+exception\b/gi)) {
    const before = block.slice(0, m.index);
    const at = before.toLowerCase().lastIndexOf("if ");
    if (at === -1) continue;
    const condition = before.slice(at + 3);
    const then = condition.toLowerCase().lastIndexOf(" then");
    out.push((then === -1 ? condition : condition.slice(0, then)).trim());
  }
  return out;
}

/** Does this condition fire BECAUSE a seed-owned count is zero? */
function assertsExistence(condition: string, vars: ReadonlySet<string>): boolean {
  const text = condition.toLowerCase().replace(/\s+/g, " ");
  for (const name of vars) {
    // `v = 0`, `v < 1`, `v <= 0`, and `v <> n` where the guard wants n rows.
    const shapes = [
      new RegExp(`\\b${name}\\s*=\\s*0\\b`),
      new RegExp(`\\b${name}\\s*<\\s*[1-9]`),
      new RegExp(`\\b${name}\\s*<=\\s*0\\b`),
    ];
    if (shapes.some((re) => re.test(text))) return true;
  }
  return false;
}

/* ── the rule ───────────────────────────────────────────────────────── */

test("the reader found the guards it is checking", () => {
  // Rule 24 in its smallest form: a parser that matched nothing would make the
  // assertion below pass by having nothing to compare against, and would look
  // exactly like a clean tree.
  let blocks = 0;
  let raises = 0;
  let counted = 0;
  for (const name of MIGRATION_FILES) {
    for (const block of plpgsqlBlocks(code(MIGRATION_CODE.get(name) ?? ""))) {
      blocks += 1;
      raises += raisingConditions(block).length;
      counted += seedCountedVars(block).size;
    }
  }
  assert.ok(blocks >= 20, `found ${blocks} plpgsql blocks across db/`);
  assert.ok(raises >= 15, `found ${raises} raising guards`);
  assert.ok(counted >= 3, `found ${counted} seed-owned counts`);
});

test("NO MIGRATION RAISES BECAUSE A SEED-SUPPLIED COUNT IS ZERO", () => {
  const found = new Map<string, string[]>();

  for (const name of MIGRATION_FILES) {
    for (const block of plpgsqlBlocks(code(MIGRATION_CODE.get(name) ?? ""))) {
      const vars = seedCountedVars(block);
      if (vars.size === 0) continue;
      for (const condition of raisingConditions(block)) {
        if (!assertsExistence(condition, vars)) continue;
        found.set(name, [...(found.get(name) ?? []), condition]);
      }
    }
  }

  for (const [name, conditions] of found) {
    const declared = DECLARED.get(name);
    assert.ok(
      declared,
      `db/${name} raises when a seed-supplied count is zero:\n` +
        conditions.map((c) => `    if ${c} then raise exception`).join("\n") +
        `\n\n  MIGRATIONS RUN BEFORE SEEDERS. At that instant the database ` +
        `holds the PREVIOUS catalogue, so a row this migration introduces has ` +
        `not been written yet and zero is the correct answer. A "the pool is ` +
        `not empty" precondition does not help: a full table proves the ` +
        `seeders ran once, not that they have run since.\n\n` +
        `  A guard may assert a PROPERTY OF the rows that exist. It may not ` +
        `assert THAT rows exist. Move this to the seeder — see the beat check ` +
        `at the end of scripts/seed-games.mjs — or declare it in DECLARED ` +
        `above with the reason it is safe.`
    );
    assert.equal(
      conditions.length,
      declared.guards,
      `db/${name} declares ${declared.guards} such guard(s) and has ` +
        `${conditions.length}. A declared exemption covers the guard it was ` +
        `written for, never the next one somebody adds beside it.`
    );
  }

  // AND THE DECLARATIONS ARE COUNTED FROM BOTH ENDS (rule 24). A declaration
  // for a file that no longer has the guard is a permission nobody revoked,
  // and it would silently cover a future one.
  for (const [name, declared] of DECLARED) {
    assert.ok(
      MIGRATION_FILES.includes(name),
      `DECLARED names db/${name}, which is not in db/`
    );
    assert.equal(
      found.get(name)?.length ?? 0,
      declared.guards,
      `db/${name} is declared as having ${declared.guards} seed-dependent ` +
        `existence guard(s) and the reader finds ` +
        `${found.get(name)?.length ?? 0}. If the guard has gone, remove the ` +
        `declaration with it.`
    );
    assert.ok(
      declared.because.length > 80,
      `db/${name}'s exemption has no argument written beside it. A bare ` +
        `entry on this list is the amber-forever tripwire CLAUDE.md warns ` +
        `about (see the 0.65 threshold and the ten-tone cap).`
    );
  }
});

test("db/069's own guards are of the safe kind now", () => {
  // The instance, checked as well as the class — this is the file that wedged
  // and the one a later edit is most likely to walk back.
  const sql = code(MIGRATION_CODE.get("069-all-of-them-and-she-chooses.sql") ?? "");
  assert.ok(sql.length > 0, "db/069 is missing");

  for (const block of plpgsqlBlocks(sql)) {
    const vars = seedCountedVars(block);
    for (const condition of raisingConditions(block)) {
      assert.ok(
        !assertsExistence(condition, vars),
        `db/069 raises on "${condition}". It wedged the deploy doing exactly ` +
          `this; the check belongs in scripts/seed-games.mjs.`
      );
    }
  }

  // AND THE CHECK IS NOT MERELY GONE. It moved, and the file says where, so a
  // reader does not conclude the near-miss stopped being guarded.
  assert.match(
    MIGRATION_CODE.get("069-all-of-them-and-she-chooses.sql") ?? "",
    /scripts\/seed-games\.mjs/,
    "db/069 must name where the claimant check went"
  );
});
