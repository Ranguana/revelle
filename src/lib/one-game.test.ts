/**
 * ONE GAME REACHES THE EVENING, AND SHE CHOOSES IT FROM THREE — db/061.
 *
 * Founder, 2026-09-04: "there shouldnt be more than one ga[m]e", and "what i
 * do want to do is give a host three ga[m]es to choose from. as an or not an
 * and. like a carousel look."
 *
 * ── WHY THIS READS THE MIGRATIONS ───────────────────────────────────
 *
 * `occasion_slot` is a TABLE, and the ruling is a fact about its contents. The
 * honest place to check a fact about contents is a database, and `npm test`
 * has none — the db-gated tests skip without a `*_TEST_DATABASE_URL` and CI's
 * `smoke:seeders` builds a scratch one, which under CLAUDE.md rule 33 is a
 * different question anyway.
 *
 * So this replays the migrations' own statements, in the order the runner
 * applies them, and asserts the ruling against the result. That is a strictly
 * weaker claim than reading production and it says so: it proves THE COMMITTED
 * CHAIN produces one game beat per occasion, which is what a future migration
 * would break and what nothing else would catch. It does not prove production
 * holds it; `/api/health` and the deploy log's own count (db/061 section 0) are
 * where that is read. CLAUDE.md rule 31: where a number is read from belongs in
 * the label.
 *
 * ── AND IT REFUSES TO GUESS ─────────────────────────────────────────
 *
 * A replay is only worth anything if it understands every statement it
 * replays. Two `delete from occasion_slot` predicates exist in db/ today and
 * both are handled below; a third one this parser cannot read FAILS THE TEST
 * rather than being skipped. A parser that silently ignored a statement would
 * report a clean chain and mean nothing — CLAUDE.md rule 24, count what it
 * matched.
 */

import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";

const DIR = new URL("../../db/", import.meta.url).pathname;

const FILES = readdirSync(DIR)
  .filter((name) => name.endsWith(".sql"))
  .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

const SOURCE = new Map(
  FILES.map((name) => [name, readFileSync(`${DIR}${name}`, "utf8")] as const)
);

/**
 * THE STATEMENTS, WITHOUT THE PROSE.
 *
 * Not a nicety. These files argue at length and the arguments contain
 * semicolons and every identifier the assertions below look for, so a regex
 * over the raw text reads a paragraph about `compute_assemblage_fingerprint`
 * as a call to it and stops an insert at a semicolon in a sentence. Both
 * happened before this function existed.
 *
 * A scanner rather than a `replace`, because `--` inside a quoted string is
 * not a comment and `''` inside one is not the end of it. Same shape as
 * `sqlStatements` in src/lib/games.test.ts.
 */
function code(sql: string): string {
  let out = "";
  let i = 0;
  while (i < sql.length) {
    const c = sql[i];
    if (c === "'") {
      out += c;
      i += 1;
      while (i < sql.length) {
        if (sql[i] === "'" && sql[i + 1] === "'") {
          out += "''";
          i += 2;
        } else if (sql[i] === "'") {
          out += "'";
          i += 1;
          break;
        } else {
          out += sql[i];
          i += 1;
        }
      }
      continue;
    }
    if (c === "-" && sql[i + 1] === "-") {
      const nl = sql.indexOf("\n", i);
      i = nl === -1 ? sql.length : nl;
      continue;
    }
    out += c;
    i += 1;
  }
  return out;
}

const CODE = new Map([...SOURCE].map(([name, sql]) => [name, code(sql)] as const));

const DB061 = "061-one-game-and-she-picks-it.sql";

/** db/001's occasion_type, which is the list of occasions there are. */
const OCCASIONS = [
  ...(
    /create type occasion_type as enum \(([^)]*)\)/.exec(
      CODE.get("001-schema.sql") ?? ""
    )?.[1] ?? ""
  ).matchAll(/'([a-z_]+)'/g),
].map((m) => m[1]);

/* ── replaying occasion_slot ────────────────────────────────────────── */

type Row = { occasion: string; slotCode: string; pool: string };

/**
 * Every occasion_slot row the committed chain leaves behind.
 *
 * Inserts are read positionally out of the VALUES tuples — every one of the
 * six `insert into occasion_slot` statements in db/ names the same nine
 * columns in the same order, and the parser asserts that rather than assuming
 * it, because a seventh statement with a different column list would otherwise
 * be read as nonsense with total confidence.
 */
function occasionSlots(): Map<string, Row> {
  const rows = new Map<string, Row>();
  let inserts = 0;
  let deletes = 0;

  for (const name of FILES) {
    const sql = CODE.get(name) ?? "";

    /*
      IN THE ORDER THEY APPEAR, WHICH IS THE ORDER POSTGRES RUNS THEM.

      This loop collected every insert and then every delete before it did
      this, and the bug was invisible in exactly the way rule 24 describes: on
      the chain as committed, the two happen to commute, so the replay produced
      the right answer for the wrong reason and the test was GREEN AGAINST A
      DELIBERATE BREAK. db/061 deletes at its line 286 and inserts at its line
      300; the delete only removes rows the inserts do not write, so nothing
      looked wrong until a second game beat was added by hand to see the test
      go red and it did not.

      Found by breaking it on purpose. CLAUDE.md rule 21's last paragraph is
      the procedure and this is what it is for.
    */
    const statements: { at: number; kind: "insert" | "delete"; m: RegExpMatchArray }[] =
      [];
    for (const m of sql.matchAll(
      /insert into occasion_slot\s*\(([^)]*)\)\s*values([\s\S]*?);/g
    )) {
      statements.push({ at: m.index ?? 0, kind: "insert", m });
    }
    for (const m of sql.matchAll(/delete from occasion_slot([^;]*);/g)) {
      statements.push({ at: m.index ?? 0, kind: "delete", m });
    }
    statements.sort((a, b) => a.at - b.at);

    for (const statement of statements) {
      const m = statement.m;

      if (statement.kind === "insert") {
        const columns = m[1].split(",").map((c) => c.trim());
        assert.deepEqual(
          columns.slice(0, 3),
          ["occasion", "slot_code", "pool"],
          `db/${name}: this test reads occasion_slot inserts positionally and ` +
            `this statement's first three columns are ${columns.slice(0, 3)}.`
        );
        inserts += 1;

        for (const tuple of m[2].matchAll(
          /\(\s*'([a-z_]+)'\s*,\s*'([a-z_]+)'\s*,\s*'([a-z_]+)'/g
        )) {
          const row = { occasion: tuple[1], slotCode: tuple[2], pool: tuple[3] };
          // `on conflict do nothing` on every re-insert in db/, so an existing
          // key wins. Replayed the same way.
          const key = `${row.occasion}/${row.slotCode}`;
          if (!rows.has(key)) rows.set(key, row);
        }
        continue;
      }

      deletes += 1;
      const where = m[1].trim();

      // db/022 — the set menu, retired from selection.
      const byCode = /^where slot_code = '([a-z_]+)'$/.exec(where);
      if (byCode) {
        for (const [key, row] of rows) {
          if (row.slotCode === byCode[1]) rows.delete(key);
        }
        continue;
      }

      // db/061 — the collapse. Every beat drawing from the game pool except
      // the game itself.
      const collapse =
        /^where pool = '([a-z_]+)' and slot_code <> '([a-z_]+)'$/.exec(where);
      if (collapse) {
        for (const [key, row] of rows) {
          if (row.pool === collapse[1] && row.slotCode !== collapse[2]) {
            rows.delete(key);
          }
        }
        continue;
      }

      assert.fail(
        `db/${name} deletes from occasion_slot with a predicate this test ` +
          `cannot replay: "${where}". Teach it the predicate — a parser that ` +
          `skipped a statement would report a chain it never read.`
      );
    }
  }

  // Rule 24 in its smallest form: a parser that matched nothing would make
  // every assertion below pass by having nothing to compare against.
  assert.ok(inserts >= 5, `parsed ${inserts} occasion_slot inserts`);
  assert.ok(deletes >= 2, `parsed ${deletes} occasion_slot deletes`);
  assert.ok(rows.size >= 40, `replayed ${rows.size} occasion_slot rows`);
  assert.equal(OCCASIONS.length, 9, `parsed ${OCCASIONS.length} occasions`);

  return rows;
}

/* ── the ruling ─────────────────────────────────────────────────────── */

test("THERE IS NOT MORE THAN ONE GAME: one game beat per occasion", () => {
  const rows = [...occasionSlots().values()].filter((r) => r.pool === "game");

  const byOccasion = new Map<string, string[]>();
  for (const row of rows) {
    byOccasion.set(row.occasion, [
      ...(byOccasion.get(row.occasion) ?? []),
      row.slotCode,
    ]);
  }

  const wrong = [...byOccasion]
    .filter(([, codes]) => codes.length !== 1)
    .map(([occasion, codes]) => `${occasion}: ${codes.sort().join(", ")}`);

  assert.deepEqual(
    wrong,
    [],
    `these occasions draw from the game pool more than once. Before db/061 ` +
      `every one of them did — a birthday drew five times — and a Westhampton ` +
      `dinner party delivered Art Battle AND Fishbowl, which is what the ` +
      `founder saw. Adding a second game beat needs her, not a migration.`
  );

  assert.deepEqual(
    [...byOccasion.keys()].sort(),
    [...OCCASIONS].sort(),
    "and every occasion has one. An occasion with none gets no game at all"
  );

  assert.deepEqual(
    [...new Set(rows.map((r) => r.slotCode))],
    ["game"],
    "and it is the `game` beat, not one of the five db/061 retired"
  );
});

test("the five collapsed beats draw from nothing at all", () => {
  const rows = [...occasionSlots().values()];
  const collapsed = [
    "the_moment",
    "honouring",
    "day_material",
    "ambient_game",
    "finale",
  ];

  for (const code of collapsed) {
    assert.equal(
      rows.filter((r) => r.slotCode === code).length,
      0,
      `${code} still has an occasion_slot row. db/061 removed them all: they ` +
        `are structural beats, not games, and were never re-pointed at a ` +
        `replacement pool invented to keep the shape tidy (rule 32).`
    );
  }
});

test("their slot_kind rows are KEPT, exactly as db/022 kept the_menu", () => {
  // Rule 14 and db/022's precedent in one. An issued Revelle still names these
  // slots, and re-enabling one against a pool somebody authors later has to be
  // an insert rather than a migration reconstructing a deleted slot.
  const all = [...CODE.values()].join("\n");
  for (const code of ["the_moment", "honouring", "day_material", "ambient_game", "finale"]) {
    assert.match(
      all,
      new RegExp(`\\(\\s*'${code}'`),
      `${code} has no slot_kind row left`
    );
  }
  assert.doesNotMatch(
    CODE.get(DB061) ?? "",
    /delete from slot_kind/,
    "db/061 deletes no slot kind"
  );
});

/* ── the carousel ───────────────────────────────────────────────────── */

test("the game beat offers three, and the number is data", () => {
  const sql = CODE.get(DB061) ?? "";

  assert.match(
    sql,
    /add column offer_count integer not null default 1 check \(offer_count >= 1\)/,
    "on occasion_slot, defaulting to 1, so no other beat changes"
  );
  assert.match(
    sql,
    /update occasion_slot set offer_count = 3 where pool = 'game'/,
    "three is a product decision and it lives in a column a curator can edit, " +
      "not in a switch nobody can find (db/009's own argument about days)"
  );
});

test("the one beat accepts all three shapes, or eleven games go quiet", () => {
  const sql = CODE.get(DB061) ?? "";

  // db/010 gave `game` only `scheduled`, which was right when four other slots
  // took the ambient decks and the endings. With one beat it would have made
  // every ambient and every finale game unplaceable — a ruling about HOW MANY
  // games she gets silently deciding WHICH KINDS exist.
  assert.match(sql, /insert into slot_shape[\s\S]*'game',\s*'ambient'/);
  assert.match(sql, /insert into slot_shape[\s\S]*'game',\s*'finale'/);

  // And the claims move with the beat. Both halves are needed: the seeder
  // writes them from src/lib/games.ts on a fresh database, this repairs the
  // rows production already holds (db/053's order, rule 33).
  assert.match(
    sql,
    /insert into game_slot \(game_id, slot_code, fit, note\)/,
    "the backfill, in the same migration as the collapse"
  );
});

/* ── how the choice binds ───────────────────────────────────────────── */

test("THE OFFER BINDS, THE CHOICE DOES NOT", () => {
  const sql = CODE.get(DB061) ?? "";

  // db/003: "An assemblage is delivered once, to one person, for good",
  // binding at delivery. All three offered games are delivered into
  // revelle_game at approval, so the trio is inside the fingerprint and no two
  // members receive the same one. Her pick is a timestamp on a row she already
  // has, and the fingerprint machinery is not touched at all — which is what
  // makes the choice unrefusable and reversible without limit.
  assert.doesNotMatch(
    sql,
    /compute_assemblage_fingerprint|revelle_assemblage_unique|assemblage_guard/,
    "db/061 does not go near the fingerprint. A choice made after delivery " +
      "that could change it could COLLIDE, and the guard — correctly doing " +
      "its job — would refuse her a card the house had already dealt her."
  );

  assert.match(
    sql,
    /create unique index %I on %I \(revelle_id, offer_group\)\s*where offer_group is not null and chosen_at is not null/,
    "at most one chosen per offer: the whole mechanical content of an OR"
  );

  assert.match(
    sql,
    /check \(chosen_at is null or offer_group is not null\)/,
    "you cannot choose what you were not offered — the shape a well-meaning " +
      "backfill takes"
  );

  // And nothing retro-marks an existing Revelle as chosen. Their one game was
  // PLACED, before choosing existed; a fabricated decision is worse than an
  // honest absence of one (rule 33's "name what it cannot repair").
  assert.doesNotMatch(
    sql,
    /update revelle_game[\s\S]{0,200}set chosen_at/,
    "db/061 backfills no choice"
  );
});

test("approval delivers the offer and does not make the choice", () => {
  const proposals = readFileSync(
    new URL("./revelle/proposals.ts", import.meta.url).pathname,
    "utf8"
  );
  const insert =
    /insert into revelle_\$\{spec\.table\}\s*\(([^)]*)\)/.exec(proposals)?.[1] ?? "";

  assert.match(insert, /offer_group/, "the offer is materialised");
  assert.doesNotMatch(
    insert,
    /chosen_at/,
    "and the choice is not. It is hers to make, after delivery, in the portal"
  );
});
