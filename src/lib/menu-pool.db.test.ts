/**
 * The menu pool's retirement, against a real Postgres.
 *
 *   createdb revelle_menus && npm run migrate      # against that database
 *   REVELLE_TEST_DATABASE_URL=postgres://…/revelle_menus npm test
 *
 * SKIPPED unless REVELLE_TEST_DATABASE_URL is set, so `npm test` stays a
 * no-dependency run — the same arrangement every other `.db.test.ts` here uses,
 * and a separate variable from DATABASE_URL for the same reason.
 *
 * ── WHAT THIS HALF IS FOR ────────────────────────────────────────────
 *
 * `src/lib/menu-pool.test.ts` asserts the ARCHITECTURE: the decision lives on
 * the registry, the seeder asks it, nothing deletes. That runs everywhere and
 * is the half that catches a revert.
 *
 * This asserts the SCHEMA — that the constraints db/045 added actually refuse
 * what they claim to refuse. Those are claims a migration makes and nothing
 * else can check: a CHECK constraint that was never provoked is a sentence in a
 * file. db/042 makes the same point about its own — "there is no version of
 * this that can be tested by reading".
 *
 * ── IT WRITES, AND EVERY WRITE IS ROLLED BACK ────────────────────────
 *
 * Deliberately, and it is the reason this file does not run the seeder. Running
 * `seed-menus` against a shared test database would create thirty-nine menus
 * and up to thirteen DRAFT WORLD STUBS as a side effect, which other db tests
 * build their own fixtures around. Provoking a constraint inside a transaction
 * that is thrown away proves the same thing and leaves nothing behind. The
 * seeder's own behaviour is proved by driving `stockingStatus` in the static
 * half, and was verified end to end against a scratch cluster built from the
 * committed chain plus the whole preDeployCommand seeder chain.
 */
import assert from "node:assert/strict";
import test, { after, before } from "node:test";

import pg from "pg";

const URL = process.env.REVELLE_TEST_DATABASE_URL;
const skip = URL ? false : "set REVELLE_TEST_DATABASE_URL to run these";

let pool: pg.Pool;

before(async () => {
  if (!URL) return;
  pool = new pg.Pool({ connectionString: URL, max: 4 });
});

after(async () => {
  if (!URL) return;
  await pool.end();
});

/** Run inside a transaction that is always thrown away. */
async function attempt(body: (c: pg.PoolClient) => Promise<void>) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    await body(client);
  } finally {
    await client.query("rollback").catch(() => {});
    client.release();
  }
}

test("the registry says the menu pool is retired, with lineage and words", {
  skip,
}, async () => {
  const { rows } = await pool.query(
    `select retired_at, superseded_by, retirement_note
       from ingredient_pool where entity_table = 'menu'`
  );

  assert.equal(rows.length, 1, "the menu pool is not registered at all.");
  assert.ok(
    rows[0].retired_at,
    "ingredient_pool says the menu pool is still live. db/045 retired it by " +
      "founder ruling, and this row is what a fresh build reads — if it is " +
      "null, the next deploy stocks thirty-nine menus no package can deliver."
  );
  assert.equal(
    rows[0].superseded_by,
    "dish",
    "the retirement has no lineage. db/022's composed table took the work; " +
      "CLAUDE.md rule 17 wants that pointer machine-readable."
  );
  assert.ok(
    rows[0].retirement_note && rows[0].retirement_note.trim() !== "",
    "the retirement has no reason in a column — rule 17's 'adjudication with " +
      "the opinion torn off'."
  );
});

test("every menu is out of the catalogue, and every one says why", {
  skip,
}, async () => {
  const { rows } = await pool.query(
    `select count(*) filter (where status = 'active')        as offered,
            count(*) filter (where status = 'draft')         as draft,
            count(*) filter (where status = 'discontinued')  as out,
            count(*) filter (where status = 'discontinued'
                               and retirement_note is null)  as silent,
            count(*)                                         as total
       from menu`
  );
  const r = rows[0];

  assert.equal(
    Number(r.offered) + Number(r.draft),
    0,
    `${r.offered} menu(s) are offered and ${r.draft} are in draft. The pool is ` +
      `retired: db/022 deleted the nine occasion_slot rows for the_menu, so ` +
      `nothing here can reach a member's package. A row that looks like stock ` +
      `gets counted as stock — that is how /desk/coverage came to report a ` +
      `room as able to serve dinner.`
  );
  assert.equal(
    Number(r.silent),
    0,
    "a menu is out of the catalogue with nothing saying why. CLAUDE.md rule 17."
  );
  // Not an assertion about 39: a database built from the chain alone has none
  // yet, and that is a legitimate state. What is asserted is that whatever is
  // there is retired and reasoned.
  assert.ok(Number(r.total) >= 0);
});

test("the_menu has no occasion_slot rows, and the slot kind still exists", {
  skip,
}, async () => {
  const { rows } = await pool.query(
    `select (select count(*) from occasion_slot where slot_code = 'the_menu') as slots,
            (select count(*) from slot_kind    where code = 'the_menu')      as kind`
  );
  assert.equal(
    Number(rows[0].slots),
    0,
    "the_menu has occasion_slot rows again. If a menu can be placed, the pool " +
      "should not be retired — bring the rows back at the same time."
  );
  assert.equal(
    Number(rows[0].kind),
    1,
    "slot_kind.the_menu is gone. db/022 kept it so already-issued revelle_menu " +
      "rows still name a slot that exists, and so re-enabling the set menu is " +
      "nine inserts rather than a reconstruction."
  );
});

test("the schema refuses a menu that leaves the catalogue in silence", {
  skip,
}, async () => {
  await attempt(async (c) => {
    const { rows } = await c.query(
      `insert into menu (slug, name, dishes, season, cooking, status)
       values ('menu-guard-probe', 'A probe', 'One line.', 'winter',
               'half_made', 'draft')
       returning id`
    );
    const id = rows[0].id;

    await assert.rejects(
      c.query(`update menu set status = 'discontinued' where id = $1`, [id]),
      /menu_discontinued_has_reason/,
      "a menu can be discontinued with no reason. That is db/028's failure — " +
        "an adjudication with the opinion torn off — and db/045 exists to make " +
        "it impossible from the desk, from a seeder and from a psql session."
    );
  });

  await attempt(async (c) => {
    await assert.rejects(
      c.query(
        `insert into menu (slug, name, dishes, season, cooking, status,
                           retirement_note)
         values ('menu-blank-probe', 'A probe', 'One line.', 'winter',
                 'half_made', 'discontinued', '   ')`
      ),
      /menu_retirement_note_not_blank/,
      "a reason can be satisfied by pressing space. A blank string looks " +
        "answered from every angle, which is worse than a null."
    );
  });

  await attempt(async (c) => {
    await assert.rejects(
      c.query(
        `update ingredient_pool set retirement_note = null
          where entity_table = 'menu'`
      ),
      // EITHER of the two, because both are true of this row and Postgres
      // names whichever it checks first. Naming one would make the test
      // depend on constraint evaluation order, which is not a promise.
      /ingredient_pool_(retired_has_reason|lineage_has_words)/,
      "a retired pool can have its reason erased out from under it."
    );
  });
});

test("a menu brought back KEEPS its record", { skip }, async () => {
  // db/042's asymmetry, which this file inherits deliberately: retirement
  // REQUIRES the record, return does not ERASE it. A note is a fact in the past
  // tense, not a description of the current state, and a CHECK shaped like
  // db/001's published_at IFF would delete the argument on the way back —
  // CLAUDE.md rule 14 undone by a constraint.
  await attempt(async (c) => {
    const { rows } = await c.query(
      `insert into menu (slug, name, dishes, season, cooking, status,
                         retirement_note)
       values ('menu-return-probe', 'A probe', 'One line.', 'winter',
               'half_made', 'discontinued', 'the pool had no slot.')
       returning id`
    );
    await c.query(`update menu set status = 'active' where id = $1`, [
      rows[0].id,
    ]);
    const back = await c.query(
      `select status::text as status, retirement_note from menu where id = $1`,
      [rows[0].id]
    );
    assert.equal(back.rows[0].status, "active");
    assert.equal(
      back.rows[0].retirement_note,
      "the pool had no slot.",
      "coming back erased the record of having been out."
    );
  });
});
