import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";

/**
 * THE MENU POOL IS RETIRED, AND STAYS RETIRED ACROSS A SYNC.
 *
 * ── WHAT WAS DECIDED ────────────────────────────────────────────────
 *
 * db/022 replaced the set menu with a composed table — `the_appetizer`,
 * `the_main`, `the_dessert`, all drawing from `dish` — and deleted the nine
 * `occasion_slot` rows for `the_menu`. From that day no package could deliver a
 * menu, and thirty-nine of them went on sitting in the catalogue, `active`, on
 * the desk, in the registry, looking exactly like stock. One board read them as
 * stock: /desk/coverage answered "can this room serve dinner?" with menu rows,
 * so a room could report as covered while unable to fill `the_dessert`.
 *
 * The founder retired the pool in db/045. Retired, never deleted: a menu is an
 * EVENING and a dish is a PLATE (db/021), composition is still revertible, and
 * every row keeps its text, its season, its destinations, its facets and its
 * reason. Bringing the set menu back is un-retiring rows plus re-inserting
 * db/012's nine `occasion_slot` rows.
 *
 * ── WHY THIS TEST EXISTS AT ALL, WHICH IS THE WHOLE POINT ───────────
 *
 * A migration can only retire the rows that EXIST WHEN IT RUNS.
 * `preDeployCommand` is `npm run migrate && … && npm run seed:menus`, so on
 * every fresh build db/045 runs against an empty `menu` table and the seeder
 * creates all thirty-nine a few seconds later. Retirement performed by UPDATE
 * alone is retirement that lasts until the next rebuild — CLAUDE.md rule 22,
 * and the failure this week is named for. It was reproduced on a scratch
 * database before it was fixed: 39 active menus after a full chain, with the
 * migration reporting success.
 *
 * The fix is that the decision lives on `ingredient_pool` — the registry rule
 * 19 calls the only truth — and the seeder ASKS. So the guard has to be
 * ARCHITECTURAL rather than a count: a count is green on the database that was
 * checked and says nothing about the next build. What is asserted here is that
 * the two halves cannot come apart.
 *
 * Source-reading, in the shape `src/lib/governed.test.ts` and
 * `src/lib/pools/derive.ts` already use: the migrations and the seeders are the
 * only description of a fresh build that ships in the repo, and rule 9 says the
 * database is unreachable from a laptop, so a test that needs one is a test
 * nobody runs. The database-side assertions are in
 * `src/lib/menu-pool.db.test.ts` and are the other half.
 */

const ROOT = new URL("../../", import.meta.url).pathname;

/**
 * Comments in this codebase argue about the rules constantly and must not
 * satisfy them. TWO STRIPPERS, because there are two comment syntaxes and using
 * the JavaScript one on SQL is a silent no-op: `--` survives it, the migration's
 * own prose then matches every assertion below, and the test is green against a
 * file that does nothing. That is exactly what happened here on the first
 * attempt, and it was found by breaking the migration on purpose.
 */
function code(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");
}

function sql(name: string): string {
  return readFileSync(`${ROOT}db/${name}`, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/--[^\n]*/g, " ");
}

const MIGRATIONS = readdirSync(`${ROOT}db`).filter((f) => f.endsWith(".sql"));

/* ── 1 · the decision is on the registry, where a rebuild can find it ── */

test("a migration retires the menu POOL, with lineage and a reason", () => {
  // Found by content rather than by filename, so renaming db/045 does not
  // silently turn this green.
  const retiring = MIGRATIONS.filter((file) =>
    /update\s+ingredient_pool[\s\S]{0,600}?retired_at\s*=\s*now\(\)/i.test(
      sql(file)
    )
  );

  assert.ok(
    retiring.length > 0,
    "no migration sets ingredient_pool.retired_at. The menu pool's retirement " +
      "has to live on the REGISTRY, not only on the rows: a fresh build runs " +
      "every migration against an empty menu table and then seeds it. See " +
      "db/045 and CLAUDE.md rule 22."
  );

  const text = retiring.map((file) => sql(file)).join("\n");

  assert.match(
    text,
    /superseded_by\s*=\s*'dish'/,
    "the menu pool is retired with no lineage. CLAUDE.md rule 17 wants a " +
      "machine-readable pointer as well as words, and the honest one here is " +
      "pool-level: the dish pool plus db/022's three courses took the work. " +
      "A per-menu FK would be null on every row forever."
  );

  assert.match(
    text,
    /retirement_note\s*=/,
    "the menu pool is retired with no reason in a column. status alone is an " +
      "adjudication with the opinion torn off (CLAUDE.md rule 17); db/028 lost " +
      "Cap Ferrat's reasoning exactly this way."
  );
});

test("the retirement carries the constraints that keep it honest", () => {
  const all = MIGRATIONS.map((file) => sql(file)).join("\n");

  for (const [constraint, why] of [
    [
      "menu_discontinued_has_reason",
      "a menu can leave the catalogue with no words saying why",
    ],
    [
      "menu_retirement_note_not_blank",
      "a reason can be satisfied by pressing space, which looks answered from " +
        "every angle and is worse than a null",
    ],
    [
      "ingredient_pool_retired_has_reason",
      "a whole pool can be retired with nothing on record",
    ],
    [
      "ingredient_pool_lineage_has_words",
      "a pointer can exist with no argument beside it",
    ],
  ] as const) {
    assert.ok(
      all.includes(constraint),
      `${constraint} is not in the migration chain, so ${why}.`
    );
  }
});

/* ── 2 · the seeder asks the registry rather than knowing ────────────── */

test("stockingStatus sends a new row live, or out with the reason", async () => {
  // THE DECISION ITSELF, driven rather than read. A source-reading guard over a
  // ternary could not fail: the token it looked for sat three lines below the
  // one that mattered, so reverting the behaviour left the test green. This
  // runs the function.
  const { stockingStatus } = await import(
    `${ROOT}scripts/catalogue-vocabulary.mjs`
  );

  assert.deepEqual(
    stockingStatus({ retired: false, note: null, supersededBy: null }),
    { status: "active", retirementNote: null },
    "a live pool must still stock itself — db/036 and CLAUDE.md rule 13."
  );

  assert.deepEqual(
    stockingStatus({ retired: true, note: "because.", supersededBy: "dish" }),
    { status: "discontinued", retirementNote: "because." },
    "a row created into a RETIRED pool must arrive out of the catalogue " +
      "carrying the pool's own reason. This is the only thing that makes the " +
      "retirement survive a rebuild: db/045 can only move rows that exist, and " +
      "on every fresh build the seeder creates them after it runs."
  );

  assert.throws(
    () => stockingStatus({ retired: true, note: "   ", supersededBy: null }),
    /rule 17/,
    "a retired pool with no reason must refuse, not write silence into " +
      "thirty-nine rows."
  );
});

test("seed-menus takes its status from that decision and nowhere else", () => {
  const src = code(readFileSync(`${ROOT}scripts/seed-menus.mjs`, "utf8"));

  assert.match(
    src,
    /poolRetirement\s*\(/,
    "scripts/seed-menus.mjs no longer asks ingredient_pool whether its pool " +
      "is retired. Without that question every fresh build re-creates all " +
      "thirty-nine menus LIVE seconds after db/045 retired nothing, and the " +
      "deploy reports success — CLAUDE.md rule 22's silent, permanent failure."
  );

  // The negative is the load-bearing half, and it is why the decision moved out
  // of this file: `LIVE` is what the insert used to pass unconditionally, so a
  // revert has to IMPORT it again, and its absence from the import list is a
  // fact a revert cannot leave behind. Read off the import rather than off the
  // whole file, because the log line at the foot says the word in prose — and a
  // guard that a comment can satisfy is a guard that a comment can also break.
  const imported = /from "\.\/catalogue-vocabulary\.mjs"/.exec(src);
  assert.ok(imported, "seed-menus no longer imports the shared vocabulary.");
  const list = src.slice(0, imported.index);
  assert.doesNotMatch(
    list.slice(list.lastIndexOf("import {")),
    /\bLIVE\b/,
    "scripts/seed-menus.mjs imports LIVE again. A menu's status on the way in " +
      "is `stockingStatus`'s answer to what the registry says, not a constant " +
      "this file holds — see db/045 and CLAUDE.md rule 22."
  );

  const at = src.indexOf("insert into menu (");
  assert.ok(at > -1, "scripts/seed-menus.mjs no longer inserts menus at all.");
  assert.match(
    src.slice(at, at + 1400),
    /stocking\.status/,
    "the insert no longer passes the decision it asked for."
  );
});

test("no seeder writes a status onto a menu that already exists", () => {
  // The other half of "stays retired": a fresh build must create them retired,
  // and a sync against a database that already has them must leave them alone.
  //
  // The property this rests on is the one `src/lib/desk/publish.ts` calls
  // IRREVERSIBLE and every pool relies on — a status is settled once, on the
  // way in, and after that it belongs to the desk; `--overwrite` rewrites the
  // words and writes no status at all. Asserted here for `menu` only, and
  // deliberately not generalised over every pool: doing that needs the list of
  // pool tables, and hand-writing one is exactly what CLAUDE.md rule 19 forbids
  // while the registry-derived list is being built elsewhere. Narrow and true
  // beats broad and hand-maintained.
  const seeders = readdirSync(`${ROOT}scripts`).filter((f) =>
    f.startsWith("seed-")
  );
  const offences: string[] = [];

  for (const name of seeders) {
    const src = code(readFileSync(`${ROOT}scripts/${name}`, "utf8"));
    for (const m of src.matchAll(/update\s+menu\s+set\b([\s\S]{0,400})/gi)) {
      if (/\bstatus\b\s*=/.test(m[1])) {
        offences.push(`${name} updates menu.status on an existing row`);
      }
    }
  }

  assert.deepEqual(
    offences,
    [],
    `a seeder is writing a menu's status onto a row it did not create:\n  ` +
      `${offences.join("\n  ")}\n\n` +
      `That is how a retirement undoes itself on the next deploy: a founder ` +
      `ruling takes the pool out of the catalogue and the next sync puts it ` +
      `back, with nothing anywhere reporting it. A seeder settles a status ` +
      `once, on the way in.`
  );
});

/* ── 3 · retired, not deleted ────────────────────────────────────────── */

test("nothing in the chain deletes the menus, the pool or its slot", () => {
  const all = MIGRATIONS.map((file) => sql(file)).join("\n");
  const offences: string[] = [];

  // The authored rows and the issuance record. A retired menu somebody was
  // actually issued stays issued and stays true — `revelle_menu` is ON DELETE
  // RESTRICT for that reason — and the whole hedge is that the rows survive.
  //
  // `menu_facet` is NOT on this list and its absence is a decision: db/012's
  // projection trigger deletes from it on every write, because season and
  // cooking are DERIVED from the columns and rebuilt rather than synced. A rule
  // that caught the projection would be a rule nobody could keep.
  for (const table of ["menu", "menu_world", "revelle_menu"]) {
    if (new RegExp(`delete\\s+from\\s+${table}\\b`, "i").test(all)) {
      offences.push(`a migration deletes from ${table}`);
    }
  }

  // The pool's registration and its slot kind. db/022 argued both: a pool the
  // engine cannot see reports a phantom gap forever, and `slot_kind.the_menu`
  // has to stay so already-issued `revelle_menu` rows name a slot that exists.
  if (/delete\s+from\s+ingredient_pool\b/i.test(all)) {
    offences.push("a migration deregisters a pool");
  }
  if (/delete\s+from\s+slot_kind\b[\s\S]{0,200}?the_menu/i.test(all)) {
    offences.push("a migration deletes slot_kind.the_menu");
  }

  assert.deepEqual(
    offences,
    [],
    `${offences.join("; ")}. The menus are RETIRED, not deleted. db/022 split ` +
      `composition into its own file precisely so it could be reverted while ` +
      `the pool stayed whole, and db/045 kept that hedge: a menu is an evening ` +
      `and a dish is a plate, and neither replaces the other.`
  );
});
