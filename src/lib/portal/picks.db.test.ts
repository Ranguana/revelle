/**
 * A DISH IN A REVELLE REACHES THE WOMAN IT BELONGS TO — against a real Postgres.
 *
 *   createdb revelle_picks && npm run migrate      # against that database
 *   REVELLE_TEST_DATABASE_URL=postgres://…/revelle_picks npm test
 *
 * SKIPPED unless REVELLE_TEST_DATABASE_URL is set, exactly like
 * src/lib/revelle/proposals.db.test.ts and for its reasons: `npm test` stays a
 * no-dependency run, and a separate variable from DATABASE_URL because this
 * file writes rows.
 *
 * ── WHY THIS FILE IS A BENCH AND NOT A UNIT TEST ─────────────────────
 *
 * The bug it exists for was one line: `revelle_${spec.table}`, looped over a
 * hand-written list of five pools that did not include `dish` or `bank_item`.
 * Nothing about it was subtle. It survived because NOTHING EVER RAN IT END TO
 * END — every test above it took the picks as given, so the read that produced
 * them was the one link in the chain nobody pulled on. A unit test of a helper
 * would have passed on the broken code, because the broken code's helpers were
 * all correct; what was wrong was which tables got asked.
 *
 * So this goes through the whole of the real path and asserts on the far end:
 *
 *     a real row in revelle_dish and revelle_bank_item
 *       → the registry-driven read in ./picks.ts
 *       → candidateFrom()
 *       → memberRevelle(), the one sanctioned wall crossing
 *       → a MemberPiece with her dish's name on it
 *
 * If the pool list ever goes stale again — or if a seventh pool is registered
 * and nobody tells the portal — one of the four tests below goes red before
 * anybody's package goes out thin.
 *
 * ── NOTHING IS TRUNCATED BETWEEN TESTS ───────────────────────────────
 *
 * Same arrangement proposals.db.test.ts settled on: db/001 makes
 * `quiz_response` append-only with a trigger that refuses a DELETE outright,
 * so a test that tidied up after itself would have to work around the schema's
 * most important guarantee. Every test builds its own customer, destination,
 * dish and bank item under a unique stamp and shares nothing.
 *
 * The ONE exception is the scratch pool in the third test, which is DDL rather
 * than data: it installs a pool, proves the portal refuses to absorb it, and
 * drops it again in a `finally`. It never calls
 * `rebuild_revelle_ingredient_view()`, so the union view never learns the
 * table's name and dropping it leaves nothing dangling.
 */
import assert from "node:assert/strict";
import test, { after, before } from "node:test";

import pg from "pg";

import { memberRevelle } from "../selection/member.ts";
import type { Ask } from "../desk/publish.ts";
import {
  UnrenderableIngredients,
  candidateFrom,
  hasRenderer,
  readPicks,
  type Setting,
} from "./picks.ts";

const URL = process.env.REVELLE_TEST_DATABASE_URL;
const skip = URL ? false : "set REVELLE_TEST_DATABASE_URL to run these";

let pool: pg.Pool;
let ask: Ask;

before(async () => {
  if (!URL) return;
  pool = new pg.Pool({ connectionString: URL, max: 4 });
  ask = (async (text: string, params: readonly unknown[] = []) =>
    (await pool.query(text, params as unknown[])).rows) as Ask;
});

after(async () => {
  if (!URL) return;
  await pool.end();
});

/* ── the proof the deploy was held for ──────────────────────────────── */

test(
  "a dish and a bank item issued into a Revelle reach her page",
  { skip },
  async () => {
    const fx = await fixture();

    // Issued exactly the way db/002's installer says a pool ingredient is
    // issued: a row in the join table, naming the block it renders into. No
    // slot_code, which db/009 explicitly allows for something placed by hand at
    // the desk — and which is the harder case, because the section then has to
    // come off the join row rather than off `slot_kind`.
    await place(fx.revelleId, "dish", fx.dishId, "details", 1);
    await place(fx.revelleId, "bank_item", fx.bankItemId, "fun", 2);

    const picks = await readPicks(ask, fx.revelleId);
    const view = memberRevelle(candidateFrom(fx.setting, picks));

    const dish = view.pieces.find((piece) => piece.pool === "dish");
    assert.ok(
      dish,
      "a dish in revelle_dish must reach her page — this is the bug: the " +
        "hand-written pool list omitted `dish`, so it rendered as nothing at " +
        "all, with no error and no gap message"
    );
    assert.equal(dish.name, fx.dishName);
    // db/021 gives a dish no description column: the plate IS the sentence, so
    // the name is read as both. A blank line here would mean RENDERING picked
    // the wrong column and her card would be a heading over nothing.
    assert.equal(dish.description, fx.dishName);
    assert.equal(dish.section, "details");

    const bank = view.pieces.find((piece) => piece.pool === "bank_item");
    assert.ok(bank, "a bank item in revelle_bank_item must reach her page");
    assert.equal(bank.name, fx.bankName);
    assert.equal(bank.description, "Lit at dusk and nobody mentions it.");
    assert.equal(bank.section, "fun");

    // And it is really THERE, in the grouped shape the page iterates, not just
    // in the flat list. A section built from no pieces is not in `sections` at
    // all — which is precisely how the missing dish stayed invisible.
    const sections = view.sections.map((entry) => entry.section);
    assert.ok(sections.includes("details"));
    assert.ok(sections.includes("fun"));
  }
);

/* ── the loud form ──────────────────────────────────────────────────── */

test(
  "a pool registered after the portal was written is refused, not absorbed",
  { skip },
  async () => {
    const fx = await fixture();
    const table = `fixture_orphan_${stamp()}`.slice(0, 40).replace(/-/g, "_");

    try {
      // A pool installed the way every real pool was installed: its own table,
      // then db/002's installer, which creates `revelle_<table>` and registers
      // the row. What it does NOT get is an entry in RENDERING — which is
      // exactly the state `dish` and `bank_item` were in.
      await ask(
        `create table ${table} (
           id uuid primary key default gen_random_uuid(),
           name text not null,
           status product_status not null default 'active')`
      );
      await ask(`select install_revelle_ingredients($1, 'Orphans')`, [table]);

      // With no rows of hers in it, it is SILENT. That is the absent-
      // deliverable rule and it must survive: registering a pool cannot be
      // allowed to break the page of every member who has none of it.
      const quiet = await readPicks(ask, fx.revelleId);
      assert.equal(quiet.length, 0);

      const { rows } = await pool.query<{ id: string }>(
        `insert into ${table} (name) values ('An orphan') returning id`
      );
      await pool.query(
        `insert into revelle_${table} (revelle_id, ${table}_id, slot, position)
         values ($1, $2, 'details', 1)`,
        [fx.revelleId, rows[0].id]
      );

      // One row of hers in it, and it is a REFUSAL. CLAUDE.md rule 19: a pool
      // the registry knows about returning rows a surface cannot render is an
      // error state, not an empty section.
      await assert.rejects(
        () => readPicks(ask, fx.revelleId),
        (err: unknown) => {
          assert.ok(
            err instanceof UnrenderableIngredients,
            "it must be catchable BY TYPE — the page distinguishes this from " +
              "every other failure and shows her different words"
          );
          assert.equal(err.pools.length, 1);
          assert.equal(err.pools[0].pool, table);
          assert.equal(err.pools[0].rows, 1);
          // What the house is told is enough to act on without opening a file.
          assert.match(err.message, new RegExp(table));
          assert.match(err.message, /RENDERING/);
          return true;
        }
      );
    } finally {
      await pool.query(`drop table if exists revelle_${table}`);
      await pool.query(`drop table if exists ${table}`);
      await pool.query(`delete from ingredient_pool where entity_table = $1`, [
        table,
      ]);
    }
  }
);

/* ── the two claims the registry itself makes ───────────────────────── */

test(
  "every pool with a join table has somewhere for its words to go",
  { skip },
  async () => {
    const rows = await ask<{ entity_table: string }>(
      `select entity_table from ingredient_pool
        where join_table is not null order by entity_table`
    );
    assert.ok(rows.length >= 7, "the registry should carry the known pools");

    const orphans = rows
      .map((row) => row.entity_table)
      .filter((code) => !hasRenderer(code));

    assert.deepEqual(
      orphans,
      [],
      "these pools are registered and the portal has no way to read them. " +
        "Add an entry to RENDERING in src/lib/portal/picks.ts. Until then, " +
        "anything issued into them withholds the whole occasion from her."
    );
  }
);

test(
  "`world` is a pool with no join table, and is not read as one",
  { skip },
  async () => {
    // The trap the registry-driven loop has to step over: `world` is a real
    // row of `ingredient_pool` (db/002 registers it) because the chosen
    // destination IS an ingredient of the assemblage — but db/001 keeps it on
    // `revelle.world_id`, so there is no `revelle_world` and never will be.
    // `readPicks` excludes it with `join_table is not null` rather than by
    // name. This asserts the fact that predicate depends on.
    const rows = await ask<{ join_table: string | null }>(
      `select join_table from ingredient_pool where entity_table = 'world'`
    );
    assert.equal(rows.length, 1, "`world` is registered as a pool");
    assert.equal(
      rows[0].join_table,
      null,
      "if `world` ever gains a join table, src/lib/portal/picks.ts must be " +
        "told before this passes again — a naive loop would compose " +
        "`revelle_world` and 500 every member's page"
    );

    const { rows: exists } = await pool.query<{ n: string }>(
      `select count(*) as n from pg_class where relname = 'revelle_world'`
    );
    assert.equal(Number(exists[0].n), 0);
  }
);

/* ── fixtures ───────────────────────────────────────────────────────── */

type Fixture = {
  revelleId: string;
  setting: Setting;
  dishId: string;
  dishName: string;
  bankItemId: string;
  bankName: string;
};

function stamp(): string {
  return `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
}

/** One member, one destination, one delivered Revelle, and two ingredients. */
async function fixture(): Promise<Fixture> {
  const mark = stamp();
  const one = async (text: string, params: unknown[] = []) =>
    (await pool.query<{ id: string }>(text, params)).rows[0].id;

  const customerId = await one(
    `insert into customer (email) values ($1) returning id`,
    [`picksbench-${mark}@example.invalid`]
  );
  const quizResponseId = await one(
    `insert into quiz_response
       (customer_id, answers, quiz_version, submission_key, occasion,
        environment, taste_directions, spend_per_person, guest_count_band)
     values ($1, '{}'::jsonb, 'db-test', $2, 'dinner_party', 'my_home',
             array['warm_and_low'], 'from_75_to_150', 'from_6_to_8')
     returning id`,
    [customerId, `picksbench-${mark}`]
  );

  const worldSlug = `picksbench-${mark}`;
  const worldId = await one(
    `insert into world (slug, name, tagline, status, published_at)
     values ($1, 'Picks Bench', 'A tagline.', 'published', now())
     returning id`,
    [worldSlug]
  );

  // 'preview' rather than 'draft', because a draft Revelle is house work and
  // `readOccasion` will not open one — so a bench built on a draft would prove
  // something she can never see.
  const revelleId = await one(
    `insert into revelle (customer_id, quiz_response_id, world_id,
                          guest_count, status)
     values ($1, $2, $3, 8, 'preview') returning id`,
    [customerId, quizResponseId, worldId]
  );

  const dishName = `Sole with brown butter ${mark}`;
  const dishId = await one(
    `insert into dish (slug, name, course, making, status)
     values ($1, $2, 'main', 'half_made', 'active') returning id`,
    [`picksbench-dish-${mark}`, dishName]
  );

  const bankName = `The good candles ${mark}`;
  const bankItemId = await one(
    `insert into bank_item (slug, world_id, kind, name, description, status)
     values ($1, $2, 'good', $3, 'Lit at dusk and nobody mentions it.',
             'active')
     returning id`,
    [`picksbench-bank-${mark}`, worldId, bankName]
  );

  return {
    revelleId,
    setting: {
      worldId,
      worldSlug,
      name: "Picks Bench",
      tagline: "A tagline.",
      guestCount: 8,
    },
    dishId,
    dishName,
    bankItemId,
    bankName,
  };
}

/** Issue one pooled ingredient into one Revelle. */
async function place(
  revelleId: string,
  poolCode: string,
  entityId: string,
  section: string,
  position: number
): Promise<void> {
  await pool.query(
    `insert into revelle_${poolCode} (revelle_id, ${poolCode}_id, slot, position)
     values ($1, $2, $3::section_kind, $4)`,
    [revelleId, entityId, section, position]
  );
}
