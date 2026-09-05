/**
 * WHAT THE COMMITTED MIGRATION CHAIN LEAVES IN `occasion_slot`.
 *
 * ── WHY A REPLAY EXISTS AT ALL ──────────────────────────────────────
 *
 * `occasion_slot` is a TABLE, and two founder rulings are now facts about its
 * contents — db/061's "there shouldnt be more than one ga[m]e" and db/062's
 * "three per course". The honest place to check a fact about contents is a
 * database, and `npm test` has none: the db-gated tests skip without a
 * `*_TEST_DATABASE_URL`, and CI's `smoke:seeders` builds a scratch one, which
 * under CLAUDE.md rule 33 is a different question anyway.
 *
 * So this replays the migrations' own statements, in the order the runner
 * applies them, and hands the result to whoever is asserting. That is a
 * strictly weaker claim than reading production and it says so: it proves what
 * THE COMMITTED CHAIN produces, which is what a future migration would break
 * and what nothing else would catch. It does not prove production holds it;
 * `/api/health` and each migration's own deploy-log count are where that is
 * read. CLAUDE.md rule 31: where a number is read from belongs in the label.
 *
 * ── WHY IT IS A MODULE AND NOT A FUNCTION INSIDE ONE TEST FILE ──────
 *
 * It began inside `src/lib/one-game.test.ts`. `src/lib/three-per-course.test.ts`
 * asks the same question of the same table one column over, and CLAUDE.md
 * rule 21's narrow test settles where the answer lives: MUST TWO SURFACES AGREE
 * ABOUT THIS? They must — "what does the chain leave in occasion_slot" has one
 * answer — and two replays would drift in the worst possible way, each green
 * about a different reading of the same files.
 *
 * ── AND IT REFUSES TO GUESS ─────────────────────────────────────────
 *
 * A replay is only worth anything if it understands every statement it
 * replays. Every `delete` predicate and every `offer_count` update in db/ today
 * is handled below; one this parser cannot read THROWS rather than being
 * skipped. A parser that silently ignored a statement would report a clean
 * chain and mean nothing — CLAUDE.md rule 24, count what it matched.
 *
 * The counts come back with the rows for the same reason. A parser that matched
 * NOTHING would make every assertion downstream pass by having nothing to
 * compare against, and that failure is invisible from the outside.
 */

import { readdirSync, readFileSync } from "node:fs";

const DIR = new URL("../../db/", import.meta.url).pathname;

/** Every migration, in the order scripts/migrate.mjs applies them. */
export const MIGRATION_FILES: readonly string[] = readdirSync(DIR)
  .filter((name) => name.endsWith(".sql"))
  .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

/**
 * THE STATEMENTS, WITHOUT THE PROSE.
 *
 * Not a nicety. These files argue at length and the arguments contain
 * semicolons and every identifier the assertions look for, so a regex over the
 * raw text reads a paragraph about `compute_assemblage_fingerprint` as a call
 * to it and stops an insert at a semicolon in a sentence. Both happened before
 * this function existed.
 *
 * A scanner rather than a `replace`, because `--` inside a quoted string is
 * not a comment and `''` inside one is not the end of it. Same shape as
 * `sqlStatements` in src/lib/games.test.ts.
 */
export function code(sql: string): string {
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

/** Every migration's code, by filename, with the prose stripped. */
export const MIGRATION_CODE: ReadonlyMap<string, string> = new Map(
  MIGRATION_FILES.map(
    (name) => [name, code(readFileSync(`${DIR}${name}`, "utf8"))] as const
  )
);

/**
 * ONE MIGRATION'S STATEMENTS, SPLIT AT THE SEMICOLONS THAT ARE SEMICOLONS.
 *
 * ── THE BUG THIS EXISTS FOR, WHICH RULE 24 FOUND EXACTLY AS ADVERTISED ──
 *
 * The replay used to find its statements with `/insert into occasion_slot …
 * values([\s\S]*?);/` over the whole file, and that regex stops at the first
 * semicolon it sees — INCLUDING ONE INSIDE A STRING. db/022 writes
 *
 *     ('other', 'the_appetizer', 'dish', …,
 *      'Shape unknown until a human reads her words; a table is offered, not '
 *      'insisted on.'),
 *
 * and that semicolon truncated the composed table's twenty-seven course rows
 * at SIXTEEN. Nothing went red for a day: `one-game.test.ts` only ever looked
 * at rows where `pool = 'game'`, all of which are inserted by db/010 and
 * db/061 above the truncation, so the parser was wrong about eleven rows while
 * being right about every row anybody had asked it for.
 *
 * CLAUDE.md rule 24, in its own words: reading the code tells you what it was
 * meant to match, only counting tells you what it did. It was found by
 * expecting 27 and getting 16.
 *
 * So the split is a scanner, not a regex, and it knows the three things a
 * semicolon can be hiding inside: a quoted string, a quoted identifier, and a
 * dollar-quoted body — `do $$ … $$` and db/061's `format($ddl$ … $ddl$)`,
 * both of which are full of semicolons that end nothing.
 */
export function statementsOf(sqlCode: string): string[] {
  const out: string[] = [];
  let current = "";
  let i = 0;

  while (i < sqlCode.length) {
    const c = sqlCode[i];

    if (c === "'" || c === '"') {
      const end = c;
      current += c;
      i += 1;
      while (i < sqlCode.length) {
        if (sqlCode[i] === end && sqlCode[i + 1] === end) {
          current += end + end;
          i += 2;
        } else if (sqlCode[i] === end) {
          current += end;
          i += 1;
          break;
        } else {
          current += sqlCode[i];
          i += 1;
        }
      }
      continue;
    }

    // $$ … $$ or $tag$ … $tag$. A tag is letters, digits and underscores.
    const dollar = /^\$([A-Za-z_][A-Za-z0-9_]*)?\$/.exec(sqlCode.slice(i));
    if (dollar) {
      const tag = dollar[0];
      const close = sqlCode.indexOf(tag, i + tag.length);
      const stop = close === -1 ? sqlCode.length : close + tag.length;
      current += sqlCode.slice(i, stop);
      i = stop;
      continue;
    }

    if (c === ";") {
      out.push(current.trim());
      current = "";
      i += 1;
      continue;
    }

    current += c;
    i += 1;
  }

  if (current.trim().length > 0) out.push(current.trim());
  return out.filter((statement) => statement.length > 0);
}

/** db/001's `occasion_type`, which is the list of occasions there are. */
export const OCCASIONS: readonly string[] = [
  ...(
    /create type occasion_type as enum \(([^)]*)\)/.exec(
      MIGRATION_CODE.get("001-schema.sql") ?? ""
    )?.[1] ?? ""
  ).matchAll(/'([a-z_]+)'/g),
].map((m) => m[1]);

/** One replayed row. Only the columns a ruling has been made about. */
export type OccasionSlotRow = {
  occasion: string;
  slotCode: string;
  pool: string;
  /**
   * `occasion_slot.offer_count` — db/061. How many candidates the beat OFFERS
   * her; 1 is the house placing it, which is the column's default and what
   * every row means until a migration says otherwise.
   */
  offerCount: number;
};

export type OccasionSlotReplay = {
  /** Keyed `occasion/slot_code`, which is the table's own unique key. */
  rows: ReadonlyMap<string, OccasionSlotRow>;
  inserts: number;
  deletes: number;
  /** `update` statements that set `offer_count`. */
  offerUpdates: number;
  /** `update` statements that set something this replay does not track. */
  otherUpdates: number;
};

/**
 * Replay every `occasion_slot` statement in db/, in file order.
 *
 * IN THE ORDER THEY APPEAR, WHICH IS THE ORDER POSTGRES RUNS THEM.
 *
 * This collected every insert and then every delete before it did that, and the
 * bug was invisible in exactly the way rule 24 describes: on the chain as
 * committed the two happen to commute, so the replay produced the right answer
 * for the wrong reason and the test was GREEN AGAINST A DELIBERATE BREAK.
 * db/061 deletes at its line 286 and inserts at its line 300; the delete only
 * removes rows the inserts do not write, so nothing looked wrong until a second
 * game beat was added by hand to see the test go red and it did not.
 *
 * Found by breaking it on purpose. CLAUDE.md rule 21's last paragraph is the
 * procedure and this is what it is for.
 */
export function replayOccasionSlots(): OccasionSlotReplay {
  const rows = new Map<string, OccasionSlotRow>();
  let inserts = 0;
  let deletes = 0;
  let offerUpdates = 0;
  let otherUpdates = 0;

  for (const name of MIGRATION_FILES) {
    // IN THE ORDER THEY APPEAR IN THE FILE, which `statementsOf` preserves by
    // construction. The previous version collected the three kinds separately
    // and sorted them by offset, which is the same order by a longer road.
    for (const statement of statementsOf(MIGRATION_CODE.get(name) ?? "")) {
      const insert =
        /^insert into occasion_slot\s*\(([^)]*)\)\s*values([\s\S]*)$/.exec(
          statement
        );
      const del = /^delete from occasion_slot\b([\s\S]*)$/.exec(statement);
      const update = /^update occasion_slot\s+set([\s\S]*?)\bwhere\b([\s\S]*)$/.exec(
        statement
      );

      const m = insert ?? del ?? update;
      if (m === null) continue;

      if (insert) {
        const columns = m[1].split(",").map((c) => c.trim());
        if (
          columns[0] !== "occasion" ||
          columns[1] !== "slot_code" ||
          columns[2] !== "pool"
        ) {
          throw new Error(
            `db/${name}: this replay reads occasion_slot inserts positionally ` +
              `and this statement's first three columns are ` +
              `${columns.slice(0, 3).join(", ")}.`
          );
        }
        // NO INSERT NAMES offer_count TODAY, and one that did would be read as
        // a beat the house places while it offered three. Rule 24: refuse
        // rather than guess, and teach the parser in the same commit.
        if (columns.includes("offer_count")) {
          throw new Error(
            `db/${name}: an occasion_slot insert names offer_count. This ` +
              `replay reads the first three columns positionally and takes ` +
              `offer_count from the column default (1) plus the updates it ` +
              `can read. Teach it this statement.`
          );
        }
        inserts += 1;

        for (const tuple of m[2].matchAll(
          /\(\s*'([a-z_]+)'\s*,\s*'([a-z_]+)'\s*,\s*'([a-z_]+)'/g
        )) {
          const key = `${tuple[1]}/${tuple[2]}`;
          // `on conflict do nothing` on every re-insert in db/, so an existing
          // key wins. Replayed the same way.
          if (rows.has(key)) continue;
          rows.set(key, {
            occasion: tuple[1],
            slotCode: tuple[2],
            pool: tuple[3],
            // db/061's column default, which is what every row means until a
            // migration updates it.
            offerCount: 1,
          });
        }
        continue;
      }

      if (del) {
        deletes += 1;
        const where = del[1].trim().replace(/^where\s+/, "");

        // db/022 — the set menu, retired from selection.
        const byCode = /^slot_code = '([a-z_]+)'$/.exec(where);
        if (byCode) {
          for (const [key, row] of rows) {
            if (row.slotCode === byCode[1]) rows.delete(key);
          }
          continue;
        }

        // db/061 — the collapse. Every beat drawing from the game pool except
        // the game itself.
        const collapse =
          /^pool = '([a-z_]+)' and slot_code <> '([a-z_]+)'$/.exec(where);
        if (collapse) {
          for (const [key, row] of rows) {
            if (row.pool === collapse[1] && row.slotCode !== collapse[2]) {
              rows.delete(key);
            }
          }
          continue;
        }

        throw new Error(
          `db/${name} deletes from occasion_slot with a predicate this replay ` +
            `cannot read: "${where}". Teach it the predicate — a parser that ` +
            `skipped a statement would report a chain it never read.`
        );
      }

      // Unreachable unless the three regexes above stop being exhaustive of
      // `m`; written as a guard rather than a `!` so that if they ever do, the
      // statement is skipped rather than read as an update of nothing.
      if (update === null) continue;

      // ── UPDATES, AND ONLY THE COLUMN A RULING WAS MADE ABOUT ──────
      //
      // An update that does not touch `offer_count` changes nothing this
      // replay models — db/061 sets `required`, `min_count` and `max_count` on
      // the game beat — so it is counted and skipped rather than refused. An
      // update that DOES touch it in a form this parser cannot read is refused,
      // because that is the one that would leave a beat reading as placed while
      // the chain offers three.
      const set = update[1].trim();
      if (!/\boffer_count\b/.test(set)) {
        otherUpdates += 1;
        continue;
      }

      const assignment = /^offer_count\s*=\s*(\d+)$/.exec(set);
      if (!assignment) {
        throw new Error(
          `db/${name} sets occasion_slot.offer_count in a form this replay ` +
            `cannot read: "set ${set}". Teach it the statement.`
        );
      }
      const count = Number(assignment[1]);
      const where = update[2].trim();

      // db/061 — `where pool = 'game'`.
      const byPool = /^pool = '([a-z_]+)'$/.exec(where);
      // db/062 — `where pool = 'dish' and slot_code in (…)`.
      const byPoolAndCodes =
        /^pool = '([a-z_]+)'\s+and slot_code in \(([^)]*)\)$/.exec(where);

      let matched = 0;
      for (const row of rows.values()) {
        if (byPool) {
          if (row.pool !== byPool[1]) continue;
        } else if (byPoolAndCodes) {
          const codes = [...byPoolAndCodes[2].matchAll(/'([a-z_]+)'/g)].map(
            (c) => c[1]
          );
          if (row.pool !== byPoolAndCodes[1]) continue;
          if (!codes.includes(row.slotCode)) continue;
        } else {
          throw new Error(
            `db/${name} updates occasion_slot.offer_count with a predicate ` +
              `this replay cannot read: "where ${where}". Teach it the ` +
              `predicate — see the delete branch above for why skipping is ` +
              `not an option.`
          );
        }
        row.offerCount = count;
        matched += 1;
      }

      // COUNT WHAT IT MATCHED (rule 24). An offer_count update that reached no
      // row is a ruling that did not land, and it reads identically to one that
      // did from every angle except this one.
      if (matched === 0) {
        throw new Error(
          `db/${name}: "update occasion_slot set ${set} where ${where}" ` +
            `matched no replayed row. Either the predicate is wrong or the ` +
            `rows it means are inserted after it.`
        );
      }
      offerUpdates += 1;
    }
  }

  return { rows, inserts, deletes, offerUpdates, otherUpdates };
}
