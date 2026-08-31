/**
 * AFFINITY IS NOT A CLAIM — ASSERTED THROUGH THE TWO SURFACES THAT READ IT.
 *
 *   createdb revelle_alsoat && npm run migrate     # against that database
 *   npm run seed:destinations                      # against that database
 *   REVELLE_TEST_DATABASE_URL=postgres://…/revelle_alsoat npm test
 *
 * SKIPPED unless REVELLE_TEST_DATABASE_URL is set, exactly like
 * ./coverage.db.test.ts and ../pools/registry.db.test.ts, and for their
 * reasons.
 *
 * ── THE FACT THIS FILE EXISTS TO PIN DOWN ────────────────────────────
 *
 *   AFFINITY RE-WEIGHTS SCORING FOR ALREADY-ELIGIBLE CANDIDATES; IT NEVER
 *   CONFERS ELIGIBILITY — SHARING REQUIRES A SECOND NATIVE ROW.
 *
 * `claimEligibility` (../selection/occasion.ts) reads a `native` row as a
 * WHITELIST: any native row makes an ingredient eligible for its native values
 * and no others. A `<pool>_world` row that is neither native nor forbidden is
 * NOT A CLAIM — `affinity` is the additive term stage 4 scores with
 * (../selection/fill.ts) and says nothing whatever about eligibility.
 *
 * The mechanism is correct and load-bearing: it is what keeps a game scoped to
 * Westhampton at +0.4 playable everywhere else. IT IS NOT A BUG. But the field
 * answers a different question than its name suggests, and in one week that
 * misreading produced one wrong report, one wrong ruling and two rows that
 * were written and do nothing. A rule that costs that much is a rule with a
 * test.
 *
 * ── WHY A FIXTURE AND NOT THE CATALOGUE ──────────────────────────────
 *
 * The three states have to sit side by side in one read to be compared, and no
 * authored room holds all three on purpose. So the file builds three rooms and
 * two items whose ONLY difference is the flag on one row, drives the real
 * `board()` — the function src/app/desk/(signed-in)/coverage/page.tsx calls,
 * loaded through the resolver hook beside this file — and asks the engine's
 * own `worldEligibility` the same question. Nothing here reimplements either.
 *
 * ONE WRITE, ONE READ, ONE CLEANUP, on purpose: `node --test` runs test files
 * concurrently and ./coverage.db.test.ts fingerprints the tables between its
 * two reads to be sure the database held still. Every extra mutation moment
 * here is a chance to make that guard cry wolf, so the fixture lands in a
 * single transaction, the board is read once, and it all goes away in a
 * single transaction. `after` deletes by the run's own mark, so a failed
 * assertion does not leave rooms behind.
 */
import assert from "node:assert/strict";
import { register } from "node:module";
import test, { after, before } from "node:test";

import pg from "pg";

import { worldEligibility } from "../selection/occasion.ts";
import type { WorldScope } from "../selection/types.ts";

const URL = process.env.REVELLE_TEST_DATABASE_URL;
const skip = URL ? false : "set REVELLE_TEST_DATABASE_URL to run";

/** Unique per run, so two of these can be in flight without colliding. */
const MARK = `alsoat-${process.pid}-${Date.now().toString(36)}`;

type BoardShape = {
  columns: readonly { key: string; label: string }[];
  rows: readonly {
    id: string;
    name: string;
    cells: Record<string, { state: string; value: string; what: string }>;
  }[];
};

let client: pg.Client | null = null;
let closeAppPool: (() => Promise<void>) | null = null;
let theBoard: BoardShape | null = null;

/** The three rooms, by the part of their slug that says what they are for. */
const HOME = `${MARK}-home`;
const AFFINITY_ONLY = `${MARK}-affinity`;
const SECOND_NATIVE = `${MARK}-native`;

const worldIds = new Map<string, string>();
const itemIds = new Map<string, string>();
/** The slot db/043's trigger classified the fixture items into. */
let slotCode: string | null = null;

async function one(sql: string, values: unknown[]): Promise<string> {
  const { rows } = await client!.query<{ id: string }>(sql, values);
  return rows[0].id;
}

before(async () => {
  if (!URL) return;

  client = new pg.Client({ connectionString: URL });
  await client.connect();

  await client.query("begin");
  try {
    for (const slug of [HOME, AFFINITY_ONLY, SECOND_NATIVE]) {
      worldIds.set(
        slug,
        await one(
          `insert into world (slug, name, tagline, description, status, notes)
           values ($1, $2, 'A fixture.', '', 'draft', $3) returning id`,
          [slug, slug.toUpperCase(), `Fixture for ${MARK}. Deleted by the test.`]
        )
      );
    }

    // TWO ITEMS, IDENTICAL BUT FOR ONE BOOLEAN. Active, because the coverage
    // board counts what a member could actually be given (`status = 'active'`)
    // and a draft row would make every cell below read `none` for a reason
    // that has nothing to do with the claim under test.
    for (const [key, name] of [
      ["weighted", "the fixture that is only weighted elsewhere"],
      ["shared", "the fixture that is claimed twice"],
    ] as const) {
      itemIds.set(
        key,
        await one(
          `insert into bank_item (slug, kind, name, description, status,
                                  source_citation)
           values ($1, 'good', $2, 'A fixture. Deleted by the test.',
                   'active', $3)
           returning id`,
          [`${MARK}-${key}`, `${name} ${MARK}`, `${MARK}`]
        )
      );
      await client.query(
        `insert into bank_item_world
           (bank_item_id, world_id, forbidden, native, affinity, note)
         values ($1, $2, false, true, 0.000, 'The home claim. Fixture.')`,
        [itemIds.get(key), worldIds.get(HOME)]
      );
    }

    // THE ROW THE MISREADING PRODUCES: a weight, at a room the item is not
    // native to. 0.600 is a real number somebody would write; the point of the
    // test is that its size never matters.
    await client.query(
      `insert into bank_item_world
         (bank_item_id, world_id, forbidden, native, affinity, note)
       values ($1, $2, false, false, 0.600, 'Affinity only. Fixture.')`,
      [itemIds.get("weighted"), worldIds.get(AFFINITY_ONLY)]
    );

    // THE ROW `Also at:` PRODUCES: a second native claim, same pair of rooms,
    // no weight at all.
    await client.query(
      `insert into bank_item_world
         (bank_item_id, world_id, forbidden, native, affinity, note)
       values ($1, $2, false, true, 0.000, 'A second native claim. Fixture.')`,
      [itemIds.get("shared"), worldIds.get(SECOND_NATIVE)]
    );

    await client.query("commit");
  } catch (err) {
    await client.query("rollback");
    throw err;
  }

  // The slot comes from db/043's AFTER INSERT trigger, never from a guess
  // here: `bank_item_default_slot()` is the one authority on which of the four
  // atmosphere slots a row lands in (CLAUDE.md rule 21), and this file reads
  // its answer rather than holding a second opinion.
  const { rows: claimed } = await client.query<{ slot_code: string }>(
    `select slot_code from bank_item_slot
      where bank_item_id = $1 and fit = 'native'`,
    [itemIds.get("shared")]
  );
  assert.equal(
    claimed.length,
    1,
    "the fixture item should carry exactly one native slot claim, written by " +
      "db/043's trigger. Without one there is no board column to read."
  );
  slotCode = claimed[0].slot_code;

  // The board reads through src/lib/db.ts, which takes its connection string
  // from DATABASE_URL. Pointed at the test database and imported only after,
  // because the pool is built on first use and stashed on globalThis. The
  // resolver hook is ./alias.test.hooks.mjs — shared with its sibling
  // rather than copied, since it teaches Node the same two things.
  process.env.DATABASE_URL = URL;
  register("./alias.test.hooks.mjs", import.meta.url);
  const coverage = (await import("./coverage.ts")) as {
    board: () => Promise<BoardShape>;
  };
  const appDb = (await import("../db.ts")) as {
    pool: () => { end: () => Promise<void> };
  };
  closeAppPool = () => appDb.pool().end();
  theBoard = await coverage.board();
});

after(async () => {
  if (closeAppPool) await closeAppPool();
  if (!client) return;
  try {
    // bank_item_world and bank_item_slot cascade from their parents.
    await client.query(`delete from bank_item where slug like $1`, [`${MARK}%`]);
    await client.query(`delete from world where slug like $1`, [`${MARK}%`]);
  } finally {
    await client.end();
  }
});

/** The board's key for one slot of the atmosphere block. See ./coverage.ts. */
function cell(worldSlug: string, column: string) {
  const id = worldIds.get(worldSlug);
  const row = theBoard!.rows.find((r) => r.id === id);
  assert.ok(row, `the board has no row for the fixture room ${worldSlug}`);
  const found = row.cells[column];
  assert.ok(found, `the board row has no cell '${column}'`);
  return found;
}

/** The world scopes of one fixture item, as ./coverage.ts's `pool` reads them. */
async function scopesFor(key: string): Promise<Record<string, WorldScope>> {
  const { rows } = await client!.query<{
    world_id: string;
    forbidden: boolean;
    native: boolean;
    affinity: string;
    note: string | null;
    name: string;
  }>(
    `select w.world_id, w.forbidden, w.native, w.affinity::text as affinity,
            w.note, d.name
       from bank_item_world w join world d on d.id = w.world_id
      where w.bank_item_id = $1`,
    [itemIds.get(key)]
  );
  const scopes: Record<string, WorldScope> = {};
  for (const row of rows) {
    scopes[row.world_id] = {
      forbidden: row.forbidden,
      native: row.native,
      affinity: Number(row.affinity),
      note: row.note ?? "",
      name: row.name,
    };
  }
  return scopes;
}

test(
  "an affinity row confers no eligibility — the engine's own gate says so",
  { skip },
  async () => {
    const scopes = await scopesFor("weighted");
    const there = worldIds.get(AFFINITY_ONLY)!;

    assert.equal(
      scopes[there].affinity,
      0.6,
      "the fixture should be carrying a real weight at the second room"
    );

    const verdict = worldEligibility(scopes, there, AFFINITY_ONLY.toUpperCase());
    assert.equal(
      verdict.eligible,
      false,
      "an item native to one room and merely weighted at another is NOT " +
        "eligible at the second. If this ever goes green, `claimEligibility` " +
        "has changed meaning and every affinity row in the catalogue has " +
        "silently become a claim."
    );
    assert.match(verdict.reason, /written for/);
  }
);

test(
  "a second native row does confer eligibility, and keeps the first",
  { skip },
  async () => {
    const scopes = await scopesFor("shared");
    const home = worldIds.get(HOME)!;
    const there = worldIds.get(SECOND_NATIVE)!;

    assert.equal(
      worldEligibility(scopes, there, SECOND_NATIVE.toUpperCase()).eligible,
      true,
      "the second native row is what `Also at:` writes, and it is the only " +
        "thing that makes the item available in the second room"
    );
    assert.equal(
      worldEligibility(scopes, home, HOME.toUpperCase()).eligible,
      true,
      "a second claim must not cost the item its first"
    );
    assert.equal(
      worldEligibility(scopes, worldIds.get(AFFINITY_ONLY)!, "elsewhere")
        .eligible,
      false,
      "and it is still a whitelist: two claims means two rooms, not all rooms"
    );
  }
);

test(
  "the coverage board counts the second native row and not the affinity row",
  { skip },
  async () => {
    const column = `atmosphere:${slotCode}`;
    const total = "atmosphere:in-all";

    const weighted = cell(AFFINITY_ONLY, column);
    assert.equal(
      weighted.state,
      "empty",
      `the board must report ${AFFINITY_ONLY} as having nothing in ` +
        `${slotCode}. It carries an affinity row for a live item and an ` +
        `affinity row reaches no member — a cell that counted it would be ` +
        `the board claiming more certainty than the catalogue has.`
    );
    assert.equal(cell(AFFINITY_ONLY, total).state, "empty");

    const shared = cell(SECOND_NATIVE, column);
    assert.equal(
      shared.value,
      "1",
      "the second native room must count the shared item — one row, reached " +
        "from two rooms, which is the content debt db/043's join table exists " +
        "to kill"
    );
    assert.equal(cell(SECOND_NATIVE, total).value, "1");

    // AND THE HOME ROOM KEEPS BOTH. The shared row is counted twice across the
    // board on purpose: it is one row that two rooms may draw.
    assert.equal(
      cell(HOME, column).value,
      "2",
      "the room both fixtures are native to holds both of them"
    );
  }
);
