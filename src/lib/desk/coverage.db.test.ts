/**
 * THE DRIFT GUARD, THROUGH BOTH CONSUMERS — the founder's second ruling.
 *
 *   createdb revelle_coverage && npm run migrate     # against that database
 *   npm run seed:destinations && npm run seed:dishes # against that database
 *   npm run seed:drinks && npm run seed:games && npm run seed:bank
 *   REVELLE_TEST_DATABASE_URL=postgres://…/revelle_coverage npm test
 *
 * SKIPPED unless REVELLE_TEST_DATABASE_URL is set, exactly like
 * ../pools/registry.db.test.ts and for its reasons.
 *
 * ── WHAT THIS FILE IS FOR ────────────────────────────────────────────
 *
 * Two surfaces answer "does room X have slot Y covered": the engine's gap
 * reporter and the desk's coverage board. They now share one authority for the
 * question — src/lib/selection/slot-coverage.ts — and the founder named the
 * failure that makes sharing worth enforcing:
 *
 *   "If each writes its own query, they'll drift… the board shows a gap the
 *    reporter doesn't fire on, or vice versa, and someone spends a day
 *    discovering that 'coverage' means two different things in two files."
 *
 * And then, on the shape of the guard itself, which is why this file is a
 * `.db.test.ts` and not the cheap unit test it started as:
 *
 *   "There's a version of it that's vacuous: if both the board and the
 *    reporter call the shared module and the test calls the shared module
 *    twice, it can never fail — it's testing the function against itself. For
 *    the test to catch the failure it exists for (someone adds a second path
 *    next month), it has to exercise both consumers end-to-end: render the
 *    board's cell for a seeded room, fire the reporter for the same room,
 *    compare verdicts."
 *
 * So NOTHING BELOW CALLS THE SHARED MODULE. One side calls `board()` from
 * ./coverage.ts — the function the screen calls, loaded through the resolver
 * hook beside this file so that Node can read a Next server module. The other
 * calls `loadCatalogue` and `scopePools` — the two functions a real selection
 * run goes through to file a `CatalogueGap`. The only thing compared is their
 * output.
 *
 * A future edit that gives either consumer its own eligibility query turns
 * these red. That is the entire deliverable.
 *
 * ── WHAT "AGREE" MEANS, EXACTLY ──────────────────────────────────────
 *
 * The reporter runs four filters this board cannot: her dealbreakers, her
 * venue, her month, her group size. Every one of them can only REMOVE
 * candidates, so the relation between the two is containment and not equality:
 *
 *   EMPTY BOARD CELL ⟹ THE REPORTER FIRES A GAP. Always. No host can rescue
 *   a slot the catalogue cannot fill. This is the assertion that must never be
 *   weakened.
 *
 *   COVERED BOARD CELL ⟹ the reporter MAY still fire, because of her.
 *
 * The run below sets every applicant filter to its neutral value — no vetoed
 * facets, no venue, no stated season, no meal shape — so under that one
 * configuration the two sets must match exactly, and the exact-match test is
 * the one with the teeth. Its precondition — no occasion claims on the pools
 * being compared, which would be a fifth applicant filter — is MEASURED before
 * the comparison and asserted, with the table names taken from the registry
 * rather than composed (rule 19).
 *
 * ── IT COMPARES WHATEVER BLOCKS THE BOARD GREW ───────────────────────
 *
 * Two today — the table's three dish slots and atmosphere's four — and nothing
 * here names either. The columns are parsed out of the board's own output as
 * `<block>:<slotCode>`, the reporter is asked about every slot the occasion
 * plans, and the intersection is what gets compared. A third block is
 * compared the day it appears. The founder has one coming.
 *
 * It writes nothing and creates nothing, so it is safe against any migrated
 * database including a copy of production.
 */
import assert from "node:assert/strict";
import { register } from "node:module";
import test, { after, before } from "node:test";

import pg from "pg";

import { STOCKED_POOLS, tablesFor, type StockedPool } from "../pools/registry.ts";
import { loadCatalogue } from "../selection/catalogue.ts";
import { planSlots } from "../selection/occasion.ts";
import { scopePools } from "../selection/fill.ts";
import {
  withDefaults,
  type Destination,
  type OccasionCode,
  type Scale,
} from "../selection/types.ts";

const URL = process.env.REVELLE_TEST_DATABASE_URL;
const skip = URL ? false : "set REVELLE_TEST_DATABASE_URL to run";

/**
 * The occasion the comparison is run for. A long dinner, because db/043 made
 * the dressed table REQUIRED there — so if a room's table-set cell is empty,
 * the gap it produces is one that also marks the Revelle low-confidence, which
 * is the most expensive version of this disagreement.
 */
const OCCASION: OccasionCode = "dinner_party";

/** Neutral in every direction a host could constrain the pool. */
const SCALE: Scale = {
  guestBand: "from_9_to_12",
  guestsLow: 9,
  guestsHigh: 12,
  guestsPlanning: 11,
  spendBand: "from_150_to_300",
  perPersonLow: 150,
  perPersonHigh: 300,
  perPersonPlanning: 225,
  budgetPlanning: 2475,
  budgetCeiling: 3600,
  retiredBudgetBand: null,
};

const OPTIONS = withDefaults({ seed: 1, now: new Date("2026-08-15T00:00:00Z") });

/**
 * The board's column-key convention for a per-slot block: `<block>:<slotCode>`,
 * and `<block>:in-all` for the block's distinct total. Parsed rather than
 * assumed, so a third block — the founder has one coming — is compared by this
 * file the day it appears, with nothing edited here.
 */
const TOTAL_SUFFIX = ":in-all";

type SlotColumn = { key: string; block: string; slotCode: string };

type BoardShape = {
  headings: readonly { key: string; label: string; span: number }[];
  columns: readonly { key: string; label: string }[];
  rows: readonly {
    id: string;
    name: string;
    cells: Record<string, { state: string; value: string; what: string }>;
  }[];
};

let client: pg.Client | null = null;
let theBoard: BoardShape | null = null;
/** slotCode -> room id -> the reporter's verdict for that room. */
let reported: Map<string, Map<string, { candidates: number; gap: boolean }>> =
  new Map();
/** Every `<block>:<slotCode>` column the board grew, in board order. */
let slotColumns: SlotColumn[] = [];
/** slotCode -> the pool the occasion plans it from, per the engine's own plan. */
const slotPools: Map<string, string> = new Map();
/** pool -> rows in its occasion table. See the exact-match test. */
const occasionClaims: Map<string, number> = new Map();
let closeAppPool: (() => Promise<void>) | null = null;
/** The resolver hook is registered once, however many read attempts run. */
let hooked = false;

/**
 * A FINGERPRINT OF EVERYTHING THE COMPARISON DEPENDS ON.
 *
 * The board and the reporter are two separate reads, and `node --test` runs
 * test FILES CONCURRENTLY — the sibling `.db.test.ts` files in this repo insert
 * dishes, bank items and destinations into the same database while this one is
 * running. A row that lands between the two reads makes them disagree about a
 * count for a reason that has nothing to do with drift, which would be a
 * flake wearing the costume of the exact failure this file exists to catch.
 * The worst possible thing for a guard to do is cry wolf.
 *
 * So the window is checked rather than assumed: the counts are taken before
 * the first read and again after the second, and the comparison is only
 * trusted if the database did not move. Tables come from the registry, never
 * composed (rule 19).
 */
async function fingerprint(db: pg.Client): Promise<string> {
  const tables = ["world"];
  for (const pool of STOCKED_POOLS) {
    const registered = tablesFor(pool);
    if (!registered) continue;
    tables.push(pool);
    for (const t of [registered.worldTable, registered.slotTable, registered.occasionTable]) {
      if (t) tables.push(t);
    }
  }
  const parts = tables.map((t) => `select '${t}' as t, count(*)::int as n from ${t}`);
  const { rows } = await db.query(parts.join(" union all "));
  return rows
    .map((r) => `${r.t}:${r.n}`)
    .sort()
    .join(" ");
}

before(async () => {
  if (!URL) return;

  client = new pg.Client({ connectionString: URL });
  await client.connect();

  // Up to three attempts at a still window. Three, because the sibling suites
  // are short; a database still moving after that is reported rather than
  // silently compared.
  for (let attempt = 1; ; attempt += 1) {
    const opened = await fingerprint(client);
    await collect(client);
    const closed = await fingerprint(client);
    if (opened === closed) break;
    if (attempt === 3) {
      throw new Error(
        "the test database changed under every attempt to read it, so the " +
          "board and the gap reporter cannot be compared against one state. " +
          "Run this file on its own: node --test src/lib/desk/coverage.db.test.ts"
      );
    }
  }
});

/** One paired read: the board, then the reporter, over the same library. */
async function collect(client: pg.Client): Promise<void> {
  slotPools.clear();
  occasionClaims.clear();
  reported = new Map();

  // ── CONSUMER ONE: THE BOARD, AS THE SCREEN LOADS IT ────────────────
  //
  // `board()` reads through src/lib/db.ts, which takes its connection string
  // from DATABASE_URL. Pointed at the test database and imported only after,
  // because the pool is built on first use and stashed on globalThis.
  process.env.DATABASE_URL = URL;
  if (!hooked) {
    register("./coverage.db.test.hooks.mjs", import.meta.url);
    hooked = true;
  }
  const coverage = (await import("./coverage.ts")) as {
    board: () => Promise<BoardShape>;
  };
  const appDb = (await import("../db.ts")) as {
    pool: () => { end: () => Promise<void> };
  };
  closeAppPool = () => appDb.pool().end();
  theBoard = await coverage.board();

  slotColumns = theBoard.columns
    .filter((c) => c.key.includes(":") && !c.key.endsWith(TOTAL_SUFFIX))
    .map((c) => {
      const [block, ...rest] = c.key.split(":");
      return { key: c.key, block, slotCode: rest.join(":") };
    });

  // ── CONSUMER TWO: THE GAP REPORTER, AS A SELECTION RUN FIRES IT ────
  //
  // The production chain: load the catalogue, expand the occasion's slot rules
  // into unit slots, scope the pool. `scopePools` is the function that builds
  // the `CatalogueGap` a curator eventually reads at /desk/todo.
  //
  // Every planned slot is scoped, not only the ones this board renders — the
  // board's columns pick out which of them to compare, so a block added to the
  // board tomorrow is compared tomorrow.
  //
  // The environment is passed empty, which is `loadVenue`'s own "no venue" —
  // one of the four applicant filters switched off.
  const catalogue = await loadCatalogue(client, OCCASION, {
    environment: "",
    indoorOutdoor: null,
    waterAccess: null,
    waterUse: null,
  });
  const plan = planSlots(catalogue.slotRules, catalogue.shape, SCALE);
  for (const slot of plan.slots) slotPools.set(slot.slotCode, slot.pool);

  reported = new Map();
  for (const column of slotColumns) reported.set(column.slotCode, new Map());

  for (const row of theBoard.rows) {
    // The destination is carried by identity alone. `worldEligibility` needs an
    // id and a name — the id to match a scope row, the name for the sentence —
    // and nothing else about a room enters this question. Built here rather
    // than taken from `catalogue.destinations` because a seeded library is all
    // drafts (rule 8) and the catalogue loader is right to skip them, while the
    // board is right to show them.
    const destination: Destination = {
      id: row.id,
      slug: row.id,
      name: row.name,
      tagline: "",
      facets: {},
      occasions: [],
      issuance: null,
      isFixture: false,
    };

    const pools = scopePools(
      plan.slots,
      catalogue.ingredients,
      destination,
      OCCASION,
      {},
      [],
      (id) => id,
      SCALE,
      null,
      OPTIONS,
      OPTIONS.now!
    );

    for (const entry of pools.values()) {
      const seat = reported.get(entry.slot.slotCode);
      if (!seat) continue;
      seat.set(row.id, {
        candidates: entry.candidates.length,
        gap: entry.gap !== null,
      });
    }
  }

  // The precondition of the exact-match test, measured rather than assumed:
  // an occasion claim on any of these pools would be a fifth applicant filter
  // the reporter applies and the board cannot. Table names come from the
  // registry (rule 19), never composed.
  for (const pool of new Set(slotColumns.map((c) => slotPools.get(c.slotCode)))) {
    if (!pool) continue;
    const table = tablesFor(pool as StockedPool)?.occasionTable;
    if (!table) continue;
    const counted = await client.query(`select count(*)::int as n from ${table}`);
    occasionClaims.set(pool, Number(counted.rows[0].n));
  }
}

after(async () => {
  await client?.end();
  // `board()` opened the app's own pool on first use. Left running, the test
  // process never exits.
  await closeAppPool?.();
});

test("the board and the reporter plan the same slots", { skip }, () => {
  assert.ok(slotColumns.length > 0, "the board grew no per-slot columns");
  const blocks = new Set(slotColumns.map((c) => c.block));
  assert.ok(
    blocks.size >= 2,
    `only ${blocks.size} per-slot block(s): ${[...blocks].join(", ")}. The ` +
      `board carries the table and the atmosphere; one of them has gone.`
  );
  for (const column of slotColumns) {
    const seat = reported.get(column.slotCode);
    assert.ok(
      seat && seat.size > 0,
      `the board has a column for "${column.key}" and a ${OCCASION} never ` +
        `plans that slot. The board is reporting coverage of something no ` +
        `package can contain — the defect db/022 left in the menu column.`
    );
  }
});

test("the guard is not vacuous: it checks a real library", { skip }, () => {
  // The failure this catches is the test itself going quiet — an empty board,
  // an empty pool, a seed that never ran — and reporting safety it never
  // checked. Numbers rather than "greater than zero", because the interesting
  // number is the one that shrinks.
  assert.ok(
    theBoard!.rows.length >= 5,
    `only ${theBoard!.rows.length} destinations on the board; seed the library ` +
      `before trusting this file`
  );
  const scoped = [...reported.values()].reduce(
    (n, seat) => n + [...seat.values()].filter((v) => v.candidates > 0).length,
    0
  );
  assert.ok(
    scoped > 0,
    "the reporter scoped nothing anywhere, so nothing below can fail"
  );
});

test(
  "DRIFT: an empty board cell is a fired gap, in every room and every slot",
  { skip },
  () => {
    // The one-way implication, and the assertion that must never be weakened.
    for (const row of theBoard!.rows) {
      for (const column of slotColumns) {
        const cell = row.cells[column.key];
        assert.ok(cell, `${row.name} has no cell for "${column.key}"`);
        const engine = reported.get(column.slotCode)!.get(row.id);
        assert.ok(engine, `the reporter said nothing about ${row.name} / ${column.key}`);

        if (cell.state === "empty") {
          assert.equal(
            engine.gap,
            true,
            `${row.name} / "${column.key}": the coverage board shows this room ` +
              `as having nothing, and the gap reporter does not fire. One of ` +
              `the two has its own eligibility rule now.`
          );
        }
        if (engine.gap && engine.candidates === 0) {
          assert.equal(
            cell.state,
            "empty",
            `${row.name} / "${column.key}": the gap reporter files a catalogue ` +
              `gap and the board shows "${cell.value}" (${cell.state}). The ` +
              `board is telling a curator a slot is covered that no package ` +
              `can fill.`
          );
        }
      }
    }
  }
);

test(
  "DRIFT: with every applicant filter neutral, the two counts are identical",
  { skip },
  () => {
    for (const [pool, n] of occasionClaims) {
      assert.equal(
        n,
        0,
        `${pool}'s occasion table holds ${n} rows, which is a fifth applicant ` +
          `filter this comparison does not neutralise. The exact-match ` +
          `assertion below is no longer sound for that pool; narrow the run to ` +
          `one occasion's claims, or drop back to the containment test above.`
      );
    }

    let compared = 0;
    for (const row of theBoard!.rows) {
      for (const column of slotColumns) {
        const cell = row.cells[column.key];
        const engine = reported.get(column.slotCode)!.get(row.id)!;
        const shown = cell.state === "empty" ? 0 : Number(cell.value);
        assert.equal(
          shown,
          engine.candidates,
          `${row.name} / "${column.key}": the board counts ${shown} and a real ` +
            `selection run scopes ${engine.candidates}. With no host filters ` +
            `in play these are the same question, so they are now being asked ` +
            `by two different pieces of code.`
        );
        compared += 1;
      }
    }
    assert.ok(compared >= 20, `only ${compared} cells compared`);
  }
);

test(
  "gaps are reported, not softened — and every block's total is on the other basis",
  { skip },
  () => {
    // Not a threshold on a number that will change as the pools fill, but the
    // property per-slot exists for: the slots are counted apart, and at least
    // one room can be short of one of them while holding plenty of another. If
    // this ever fails because every room is covered everywhere, delete it and
    // say so — that is a library that got finished.
    const perSlot = slotColumns.map((column) => ({
      key: column.key,
      empty: theBoard!.rows.filter(
        (row) => row.cells[column.key].state === "empty"
      ).length,
    }));
    assert.ok(
      perSlot.some((s) => s.empty > 0),
      `no slot is empty in any room: ${JSON.stringify(perSlot)}. A board that ` +
        `cannot show a gap is the failure per-slot was written to avoid.`
    );

    for (const block of new Set(slotColumns.map((c) => c.block))) {
      const mine = slotColumns.filter((c) => c.block === block);
      for (const row of theBoard!.rows) {
        const total = row.cells[`${block}${TOTAL_SUFFIX}`];
        assert.ok(total, `${row.name} has no total for block "${block}"`);
        assert.notEqual(
          total.state,
          "thin",
          `${row.name} / ${block}: a total must not grade a room. Only the ` +
            `per-slot cells beside it may say "thin".`
        );
        if (total.state === "empty") continue;
        assert.match(
          total.what,
          /distinct/,
          "the total's basis has to be readable on the board itself"
        );
        const claims = mine.reduce((n, column) => {
          const cell = row.cells[column.key];
          return n + (cell.state === "empty" ? 0 : Number(cell.value));
        }, 0);
        assert.ok(
          Number(total.value) <= claims,
          `${row.name} / ${block}: ${total.value} distinct things cannot ` +
            `exceed ${claims} claims over the same things`
        );
      }
    }
  }
);
