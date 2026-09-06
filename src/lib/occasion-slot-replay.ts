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

/**
 * db/009's `occasion_shape.days`, by occasion — HOW LONG AN OCCASION RUNS.
 *
 * Read rather than restated, for db/009's own reason: "a product decision that
 * lives in a `switch` is a product decision nobody can find". It is here and
 * not in a test file because two rulings now turn on it — `per_day` multiplies
 * a beat by it, and db/068 gives the day beat to `days > 1` and to nothing
 * else — and CLAUDE.md rule 21's narrow test says one owner for a fact two
 * surfaces must agree about.
 *
 * Positional, exactly as the occasion_slot reader is, and it refuses a column
 * order it does not recognise rather than reading the wrong field.
 */
export const OCCASION_DAYS: ReadonlyMap<string, number> = (() => {
  const out = new Map<string, number>();
  for (const name of MIGRATION_FILES) {
    for (const statement of statementsOf(MIGRATION_CODE.get(name) ?? "")) {
      const insert =
        /^insert into occasion_shape\s*\(([^)]*)\)\s*values([\s\S]*)$/.exec(
          statement
        );
      if (insert === null) continue;
      const columns = insert[1].split(",").map((c) => c.trim());
      if (columns[0] !== "occasion" || columns[1] !== "days") {
        throw new Error(
          `db/${name}: this replay reads occasion_shape inserts positionally ` +
            `and this statement's first two columns are ` +
            `${columns.slice(0, 2).join(", ")}.`
        );
      }
      for (const tuple of insert[2].matchAll(/\(\s*'([a-z_]+)'\s*,\s*(\d+)/g)) {
        if (!out.has(tuple[1])) out.set(tuple[1], Number(tuple[2]));
      }
    }
  }
  return out;
})();

/** db/001's `occasion_type`, which is the list of occasions there are. */
export const OCCASIONS: readonly string[] = [
  ...(
    /create type occasion_type as enum \(([^)]*)\)/.exec(
      MIGRATION_CODE.get("001-schema.sql") ?? ""
    )?.[1] ?? ""
  ).matchAll(/'([a-z_]+)'/g),
].map((m) => m[1]);

/**
 * ONE `values` TUPLE, SPLIT INTO ITS FIELDS.
 *
 * The reader used to take the first three fields with a regex and stop, which
 * was enough while `occasion`, `slot_code` and `pool` were the only columns any
 * ruling turned on. `per_day` is a fourth (db/068), it sits at a position that
 * differs between migrations, and reading it positionally off a fixed index is
 * how `bank_item_default_slot()` put 143 rows of 152 in the wrong bucket
 * (CLAUDE.md rule 24). So the fields are split properly and matched to the
 * statement's own declared column list.
 *
 * A scanner, not a split on ",", because a note is a quoted string and notes in
 * this table contain commas in every row.
 */
function tupleFields(tuple: string): string[] {
  const out: string[] = [];
  let current = "";
  let depth = 0;
  let i = 0;
  while (i < tuple.length) {
    const c = tuple[i];
    if (c === "'") {
      current += c;
      i += 1;
      while (i < tuple.length) {
        if (tuple[i] === "'" && tuple[i + 1] === "'") {
          current += "''";
          i += 2;
        } else if (tuple[i] === "'") {
          current += "'";
          i += 1;
          break;
        } else {
          current += tuple[i];
          i += 1;
        }
      }
      continue;
    }
    if (c === "(") depth += 1;
    if (c === ")") depth -= 1;
    if (c === "," && depth === 0) {
      out.push(current.trim());
      current = "";
      i += 1;
      continue;
    }
    current += c;
    i += 1;
  }
  if (current.trim().length > 0) out.push(current.trim());
  return out;
}

/**
 * THE TAIL OF AN UPDATE, SPLIT AT THE KEYWORDS THAT ARE KEYWORDS.
 *
 * Everything after `set`: the assignments, an optional `from` clause, and the
 * predicate. Split by scanning rather than by a lazy regex, because `from` and
 * `where` both occur inside the notes this table's updates write and a regex
 * would stop at the first one it saw in a sentence — the same failure the
 * statement splitter was rewritten for.
 *
 * A `from` clause is DROPPED rather than modelled: the predicate that follows
 * it names its own columns, and the readers below match on those. What the
 * clause must not do is disappear silently into the assignments, which is what
 * a `set([\s\S]*?)where` regex did with it.
 */
function splitUpdateTail(tail: string): { set: string; where: string } {
  let depth = 0;
  let i = 0;
  let fromAt = -1;
  let whereAt = -1;
  while (i < tail.length) {
    const c = tail[i];
    if (c === "'") {
      i += 1;
      while (i < tail.length) {
        if (tail[i] === "'" && tail[i + 1] === "'") i += 2;
        else if (tail[i] === "'") {
          i += 1;
          break;
        } else i += 1;
      }
      continue;
    }
    if (c === "(") depth += 1;
    else if (c === ")") depth -= 1;
    else if (depth === 0) {
      const word = /^\b(from|where)\b/i.exec(tail.slice(i));
      if (word && (i === 0 || /\s/.test(tail[i - 1]))) {
        if (word[1].toLowerCase() === "from" && fromAt === -1 && whereAt === -1) {
          fromAt = i;
        } else if (word[1].toLowerCase() === "where" && whereAt === -1) {
          whereAt = i;
          break;
        }
        i += word[0].length;
        continue;
      }
    }
    i += 1;
  }

  if (whereAt === -1) {
    throw new Error(
      `an occasion_slot update has no readable where clause: ` +
        `"set ${tail.slice(0, 80)}…". An unqualified update over this table ` +
        `would change every beat in the product.`
    );
  }

  const setEnd = fromAt === -1 ? whereAt : fromAt;
  return {
    set: tail.slice(0, setEnd).trim().replace(/,\s*$/, ""),
    where: tail.slice(whereAt).replace(/^where\s+/i, "").trim(),
  };
}

/**
 * A `values` body with its `on conflict` clause cut off.
 *
 * `on conflict (occasion, slot_code) do nothing` ends every re-insert in db/,
 * and its conflict target is a parenthesised group that looks exactly like a
 * row to a reader counting brackets. Found by counting (rule 24): db/061's
 * three-row insert replayed as four, the fourth being a two-field "row" made of
 * two column names.
 */
function beforeOnConflict(body: string): string {
  let depth = 0;
  let i = 0;
  while (i < body.length) {
    const c = body[i];
    if (c === "'") {
      i += 1;
      while (i < body.length) {
        if (body[i] === "'" && body[i + 1] === "'") i += 2;
        else if (body[i] === "'") {
          i += 1;
          break;
        } else i += 1;
      }
      continue;
    }
    if (c === "(") depth += 1;
    else if (c === ")") depth -= 1;
    else if (depth === 0 && /^\bon\s+conflict\b/i.test(body.slice(i))) {
      return body.slice(0, i);
    }
    i += 1;
  }
  return body;
}

/** Every top-level `( … )` group in a `values` list, in order. */
function tuplesOf(body: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let start = -1;
  let i = 0;
  while (i < body.length) {
    const c = body[i];
    if (c === "'") {
      i += 1;
      while (i < body.length) {
        if (body[i] === "'" && body[i + 1] === "'") i += 2;
        else if (body[i] === "'") {
          i += 1;
          break;
        } else i += 1;
      }
      continue;
    }
    if (c === "(") {
      if (depth === 0) start = i + 1;
      depth += 1;
    } else if (c === ")") {
      depth -= 1;
      if (depth === 0 && start !== -1) {
        out.push(body.slice(start, i));
        start = -1;
      }
    }
    i += 1;
  }
  return out;
}

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
  /**
   * `occasion_slot.per_day` — db/009. Whether the beat repeats for each day of
   * `occasion_shape.days`.
   *
   * MODELLED SINCE db/068, AND THE REASON IS A FINDING RATHER THAN TIDINESS.
   * db/061 deleted the only three rows in the table that ever carried it, so
   * `per_day` was dead in production from that day and the day loop in
   * `src/lib/selection/occasion.ts` was reachable by nothing. Restoring the day
   * beat brings it back, which makes this rule 24's corollary exactly: "never
   * used" means "never tested against the tables it will actually meet".
   * `src/lib/day-material.test.ts` drives it rather than asserting it.
   */
  perDay: boolean;
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
export function replayOccasionSlots(
  /**
   * The chain to replay, as `[filename, code]` in application order. Defaults
   * to db/, which is the only chain production has.
   *
   * IT IS A PARAMETER SO THE READER CAN BE PROVED AGAINST A FIXTURE. A parser
   * whose only evidence is that db/ replays cleanly is a parser proved by files
   * somebody may delete — and the form this reader most recently could not
   * read arrived on disk for half an hour and left again. See
   * src/lib/occasion-slot-replay.test.ts.
   */
  chain: Iterable<readonly [string, string]> = MIGRATION_CODE
): OccasionSlotReplay {
  const rows = new Map<string, OccasionSlotRow>();
  let inserts = 0;
  let deletes = 0;
  let offerUpdates = 0;
  let otherUpdates = 0;

  for (const [name, sql] of chain) {
    // IN THE ORDER THEY APPEAR IN THE FILE, which `statementsOf` preserves by
    // construction. The previous version collected the three kinds separately
    // and sorted them by offset, which is the same order by a longer road.
    for (const statement of statementsOf(sql)) {
      const insert =
        /^insert into occasion_slot\s*\(([^)]*)\)\s*values([\s\S]*)$/.exec(
          statement
        );
      // db/068 — one row per occasion that has days, driven off occasion_shape
      // rather than off a list of occasion names (rule 19). Read below.
      const derived =
        /^insert into occasion_slot\s*\(([^)]*)\)\s*select([\s\S]*)$/.exec(
          statement
        );
      const del = /^delete from occasion_slot\b([\s\S]*)$/.exec(statement);
      // THE ALIAS AND THE `from` CLAUSE ARE PART OF THE FORM, and they were not
      // read until 2026-09-06. `update occasion_slot os set … from
      // occasion_shape sh where …` is ordinary Postgres and the old regex
      // required `set` to follow the table name directly, so a statement in
      // that shape fell past every reader and was replayed as if it had not
      // happened. It was found because a file written in that shape appeared in
      // db/ for half an hour; the shape is the bug, not the file, so the fixture
      // that proves this branch lives in the test and not on disk.
      const update =
        /^update occasion_slot\b(?:\s+(?:as\s+)?(?!set\b)[a-z][a-z0-9_]*)?\s+set\b([\s\S]*)$/.exec(
          statement
        );

      const m = insert ?? derived ?? del ?? update;
      if (m === null) {
        // AND A STATEMENT AGAINST THIS TABLE IS NEVER SKIPPED. The four
        // readers above are the whole vocabulary; anything else touching
        // occasion_slot would be replayed as if it had not happened, and a
        // parser that silently ignores a statement reports a chain it never
        // read (rule 24). This is the guard the derived insert needed: before
        // db/068 an `insert … select` fell through here as a no-op.
        if (/^(insert into|delete from|update)\s+occasion_slot\b/.test(statement)) {
          throw new Error(
            `db/${name}: this replay cannot read "${statement.slice(0, 80)}…". ` +
              `Teach it the statement — skipping one is how a replay goes ` +
              `green about a chain it did not read.`
          );
        }
        continue;
      }

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

        const perDayAt = columns.indexOf("per_day");
        for (const tuple of tuplesOf(beforeOnConflict(m[2]))) {
          const fields = tupleFields(tuple);
          if (fields.length !== columns.length) {
            throw new Error(
              `db/${name}: an occasion_slot tuple has ${fields.length} fields ` +
                `and the statement declares ${columns.length} columns. The ` +
                `reader matches values to the statement's own column list and ` +
                `will not guess at a mismatch.`
            );
          }
          const literal = (field: string): string =>
            /^'([\s\S]*)'$/.exec(field)?.[1].replace(/''/g, "'") ?? field;

          const key = `${literal(fields[0])}/${literal(fields[1])}`;
          // `on conflict do nothing` on every re-insert in db/, so an existing
          // key wins. Replayed the same way.
          if (rows.has(key)) continue;
          rows.set(key, {
            occasion: literal(fields[0]),
            slotCode: literal(fields[1]),
            pool: literal(fields[2]),
            // db/061's column default, which is what every row means until a
            // migration updates it.
            offerCount: 1,
            // db/009's column default is false, and a statement that does not
            // name the column means the default. Never inferred from anything
            // else.
            perDay: perDayAt === -1 ? false : fields[perDayAt] === "true",
          });
        }
        continue;
      }

      if (derived) {
        // ── AN INSERT WHOSE ROWS COME FROM occasion_shape ────────────
        //
        // db/068: `select sh.occasion, 'day_material', 'game', … from
        // occasion_shape sh where sh.days > 1`. The occasions are DERIVED, on
        // purpose (rule 19), so the replay derives them the same way from the
        // same table rather than being handed a list that will be wrong the
        // day a tenth multi-day occasion is admitted.
        //
        // Narrow by design: it reads exactly the one shape db/ writes today
        // and throws on anything else, for the reason the delete branch gives.
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
        if (columns.includes("offer_count")) {
          throw new Error(
            `db/${name}: a derived occasion_slot insert names offer_count. ` +
              `See the note on the values branch.`
          );
        }

        const body = m[2];
        const perDayAt = columns.indexOf("per_day");
        const projected =
          /^\s*sh\.occasion\s*,\s*'([a-z_]+)'\s*,\s*'([a-z_]+)'/.exec(body);
        const source =
          /\bfrom\s+occasion_shape\s+sh\b[\s\S]*?\bwhere\s+sh\.days\s*>\s*(\d+)/.exec(
            body
          );
        if (projected === null || source === null) {
          throw new Error(
            `db/${name}: this replay reads a derived occasion_slot insert as ` +
              `"select sh.occasion, '<slot>', '<pool>', … from occasion_shape ` +
              `sh where sh.days > <n>" and this one is not that. Teach it the ` +
              `statement rather than letting it insert nothing.`
          );
        }

        inserts += 1;
        const minimumDays = Number(source[1]);
        // The projection is a fixed list of literals after `sh.occasion`, so
        // per_day is read from it by the same column-list rule the values
        // branch uses. `select` and `from` bracket it.
        const projection = tupleFields(
          body.slice(0, body.search(/\bfrom\s+occasion_shape\b/))
        );
        const derivedPerDay =
          perDayAt === -1 ? false : projection[perDayAt]?.trim() === "true";
        let matched = 0;
        for (const [occasion, days] of OCCASION_DAYS) {
          if (days <= minimumDays) continue;
          const key = `${occasion}/${projected[1]}`;
          matched += 1;
          // `on conflict do nothing` on every insert in db/, so an existing
          // key wins. Replayed the same way.
          if (rows.has(key)) continue;
          rows.set(key, {
            occasion,
            slotCode: projected[1],
            pool: projected[2],
            offerCount: 1,
            perDay: derivedPerDay,
          });
        }

        // COUNT WHAT IT MATCHED (rule 24). A derived insert that produced no
        // row is a beat nobody gets, and it reads identically to one that
        // worked from every angle except this one.
        if (matched === 0) {
          throw new Error(
            `db/${name}: "insert … select … where sh.days > ${minimumDays}" ` +
              `produced no row. Either occasion_shape was not replayed or the ` +
              `predicate matches nothing.`
          );
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

      // Unreachable unless the four regexes above stop being exhaustive of
      // `m`; written as a guard rather than a `!` so that if they ever do, the
      // statement is skipped rather than read as an update of nothing.
      if (update === null) continue;

      // ── UPDATES, AND ONLY THE COLUMNS A RULING WAS MADE ABOUT ─────
      //
      // An update that touches neither `offer_count` nor `per_day` changes
      // nothing this replay models — db/061 sets `required`, `min_count` and
      // `max_count` on the game beat — so it is counted and skipped rather than
      // refused. One that DOES touch either, in a form this parser cannot read,
      // is refused: those are the ones that would leave a beat reading as
      // placed while the chain offers three, or as one evening while the chain
      // runs it every day.
      const { set, where } = splitUpdateTail(update[1]);
      const touches = /\b(offer_count|per_day)\b/.test(set);
      if (!touches) {
        otherUpdates += 1;
        continue;
      }

      const offerTo = /(?:^|,)\s*offer_count\s*=\s*(\d+)\s*(?:,|$)/.exec(set);
      const perDayTo = /(?:^|,)\s*per_day\s*=\s*(true|false)\s*(?:,|$)/.exec(set);
      if (
        (/\boffer_count\b/.test(set) && offerTo === null) ||
        (/\bper_day\b/.test(set) && perDayTo === null)
      ) {
        throw new Error(
          `db/${name} sets a tracked occasion_slot column in a form this ` +
            `replay cannot read: "set ${set}". Teach it the statement.`
        );
      }

      // db/061 — `where pool = 'game'`.
      const byPool = /^pool = '([a-z_]+)'$/.exec(where);
      // db/062 — `where pool = 'dish' and slot_code in (…)`.
      const byPoolAndCodes =
        /^pool = '([a-z_]+)'\s+and slot_code in \(([^)]*)\)$/.exec(where);
      // The occasion_shape join, as an update: `… os.pool = 'game' and
      // sh.days > 1 …`, in any clause order. Recognised because a ruling about
      // multi-day occasions is the obvious next one somebody writes, and
      // because the alias form above is only half the fix if the predicate is
      // still unreadable.
      const joinsShape = /\bsh\.occasion\s*=\s*[a-z_]+\.occasion\b/.test(where);
      const shapePool = /\b[a-z_]+\.pool\s*=\s*'([a-z_]+)'/.exec(where);
      const shapeDays = /\bsh\.days\s*>\s*(\d+)/.exec(where);

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
        } else if (joinsShape && shapePool !== null && shapeDays !== null) {
          if (row.pool !== shapePool[1]) continue;
          const days = OCCASION_DAYS.get(row.occasion) ?? 1;
          if (days <= Number(shapeDays[1])) continue;
        } else {
          throw new Error(
            `db/${name} updates a tracked occasion_slot column with a ` +
              `predicate this replay cannot read: "where ${where}". Teach it ` +
              `the predicate — see the delete branch above for why skipping ` +
              `is not an option.`
          );
        }
        if (offerTo !== null) row.offerCount = Number(offerTo[1]);
        if (perDayTo !== null) row.perDay = perDayTo[1] === "true";
        matched += 1;
      }

      // COUNT WHAT IT MATCHED (rule 24). An update that reached no row is a
      // ruling that did not land, and it reads identically to one that did from
      // every angle except this one.
      if (matched === 0) {
        throw new Error(
          `db/${name}: "update occasion_slot set ${set} where ${where}" ` +
            `matched no replayed row. Either the predicate is wrong or the ` +
            `rows it means are inserted after it.`
        );
      }
      if (offerTo !== null) offerUpdates += 1;
      else otherUpdates += 1;
    }
  }

  return { rows, inserts, deletes, offerUpdates, otherUpdates };
}
