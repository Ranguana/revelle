import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";

/**
 * EVERY PARAMETERISED QUERY BINDS $1..$N WITH NO GAP, AND N ARGUMENTS.
 *
 * ── THE BUG THIS EXISTS TO CATCH, WHICH WAS FOUND BY LUCK ────────────
 *
 * scripts/seed-bank.mjs shipped with its insert and its update both skipping
 * `$7` and running off the end at `$11`: the shape left behind when db/033
 * dropped `venue` from the column list and nobody renumbered what came after
 * it. Postgres would have refused the bind on the FIRST ROW OF THE FIRST RUN —
 * "bind message supplies 10 parameters, but prepared statement requires 11" —
 * so it was never going to survive contact with the database.
 *
 * It survived contact with everything else. The seeder was not in
 * `preDeployCommand`, so it had never run, and CLAUDE.md rule 12's corollary
 * is exactly this: AN UNWIRED SEEDER SHIELDS ITS OWN BUGS FROM EVER
 * SURFACING. It was found because somebody opened the file for an unrelated
 * reason.
 *
 * ── WHY A STATIC CHECK WHEN THERE IS ALSO A SMOKE RUN ────────────────
 *
 * `npm run smoke:seeders` runs the whole deploy chain against a real throwaway
 * Postgres and is the stronger instrument by far: it catches this bug and also
 * every enum literal, NOT NULL, CHECK and foreign key that a static reader
 * cannot know about. But it needs a Postgres server, so it runs in CI and not
 * in `npm test`.
 *
 * This runs everywhere, in about a millisecond, with no database at all — and
 * it catches the ONE failure mode that has actually happened here. The two are
 * not alternatives: this one tells you before you push, the smoke run tells you
 * things this one cannot know.
 *
 * ── WHAT IT DELIBERATELY DOES NOT DO ─────────────────────────────────
 *
 * It reads only the queries it can read WHOLE: a SQL string that is literal
 * (string literals, `+` concatenation, or a template with no `${}`) and an
 * argument list written as an array literal at the call site. A query composed
 * at runtime is SKIPPED rather than guessed at, and the skips are counted, so
 * this file can never quietly degrade into checking nothing — the assertions
 * below fail if a seeder that makes queries has none this can read.
 */

const ROOT = new URL("../../", import.meta.url).pathname;

type Finding = { file: string; sql: string; problem: string };

/**
 * Walk one argument list from the character after `(`, returning the raw text
 * of each top-level argument.
 *
 * A small lexer rather than a regex, because the arguments contain commas
 * inside arrow functions, nested calls, arrays, template literals and strings
 * holding apostrophes. It understands quotes, template substitutions, and both
 * comment forms. It does NOT understand regex literals; a call containing one
 * ends up unbalanced, returns null, and is counted as unreadable rather than
 * mis-parsed.
 */
function args(src: string, open: number, close = ")"): string[] | null {
  const out: string[] = [];
  let depth = 0;
  let start = open + 1;
  let i = open + 1;

  const LIMIT = 20000;
  while (i < src.length && i - open < LIMIT) {
    const c = src[i];

    if (c === "/" && src[i + 1] === "/") {
      const nl = src.indexOf("\n", i);
      if (nl < 0) return null;
      i = nl + 1;
      continue;
    }
    if (c === "/" && src[i + 1] === "*") {
      const end = src.indexOf("*/", i + 2);
      if (end < 0) return null;
      i = end + 2;
      continue;
    }
    if (c === "'" || c === '"' || c === "`") {
      const end = endOfString(src, i);
      if (end < 0) return null;
      i = end + 1;
      continue;
    }
    if (c === "(" || c === "[" || c === "{") {
      depth += 1;
      i += 1;
      continue;
    }
    if (c === close && depth === 0) {
      const last = src.slice(start, i).trim();
      if (last !== "" || out.length > 0) out.push(last);
      return out;
    }
    if (c === ")" || c === "]" || c === "}") {
      depth -= 1;
      if (depth < 0) return null;
      i += 1;
      continue;
    }
    if (c === "," && depth === 0) {
      out.push(src.slice(start, i).trim());
      start = i + 1;
      i += 1;
      continue;
    }
    i += 1;
  }
  return null;
}

/** Index of the closing quote of the string starting at `open`, or -1. */
function endOfString(src: string, open: number): number {
  const quote = src[open];
  let i = open + 1;
  while (i < src.length) {
    const c = src[i];
    if (c === "\\") {
      i += 2;
      continue;
    }
    if (quote === "`" && c === "$" && src[i + 1] === "{") {
      // A substitution can nest braces and further templates. Walk it.
      let depth = 1;
      i += 2;
      while (i < src.length && depth > 0) {
        const d = src[i];
        if (d === "{") depth += 1;
        else if (d === "}") depth -= 1;
        else if (d === "'" || d === '"' || d === "`") {
          const end = endOfString(src, i);
          if (end < 0) return -1;
          i = end;
        }
        i += 1;
      }
      continue;
    }
    if (c === quote) return i;
    i += 1;
  }
  return -1;
}

/**
 * The SQL an argument denotes, or null when it is not literal.
 *
 * Accepts a single quoted string, several joined by `+`, and a template with
 * no `${}` in it. A template that interpolates is composed at runtime, and this
 * file does not guess at what it composes to.
 */
function literalSql(arg: string): string | null {
  const chunks: string[] = [];
  let i = 0;
  while (i < arg.length) {
    const c = arg[i];
    if (c === " " || c === "\n" || c === "\r" || c === "\t" || c === "+") {
      i += 1;
      continue;
    }
    if (c === "/" && arg[i + 1] === "/") {
      const nl = arg.indexOf("\n", i);
      if (nl < 0) return null;
      i = nl + 1;
      continue;
    }
    if (c === "/" && arg[i + 1] === "*") {
      const end = arg.indexOf("*/", i + 2);
      if (end < 0) return null;
      i = end + 2;
      continue;
    }
    if (c === "'" || c === '"' || c === "`") {
      const end = endOfString(arg, i);
      if (end < 0) return null;
      const body = arg.slice(i + 1, end);
      if (c === "`" && body.includes("${")) return null;
      chunks.push(body);
      i = end + 1;
      continue;
    }
    return null;
  }
  return chunks.length > 0 ? chunks.join("") : null;
}

/** How many elements an array literal has, or null when it is not one. */
function arrayLength(arg: string): number | null {
  if (!arg.startsWith("[")) return null;
  // Walked with `]` as the closer rather than rewritten into a call: swapping
  // the bracket for a paren and leaving the `]` behind was this function's
  // first bug, and it made every checked query silently unreadable.
  const parts = args(arg, 0, "]");
  if (parts === null) return null;
  // `[a, b,]` — a trailing comma leaves an empty final element.
  if (parts.length > 0 && parts[parts.length - 1] === "") parts.pop();
  if (parts.some((p) => p.startsWith("..."))) return null;
  return parts.length;
}

type Scan = {
  checked: number;
  /** Skipped and PARAMETERISED — the ones this check would have liked to read. */
  skipped: number;
  unreadable: number;
  findings: Finding[];
};

function scan(file: string, src: string): Scan {
  const out: Scan = { checked: 0, skipped: 0, unreadable: 0, findings: [] };
  // A query with no argument list has nothing to bind and nothing to skew, so
  // being unable to read it costs nothing and is not counted against coverage.
  const skip = (parts: string[]) => {
    if (parts.length > 1) out.skipped += 1;
  };
  const call = /\bquery\s*\(/g;
  let m: RegExpExecArray | null;

  while ((m = call.exec(src)) !== null) {
    const open = m.index + m[0].length - 1;
    const parts = args(src, open);
    if (parts === null) {
      out.unreadable += 1;
      continue;
    }
    if (parts.length === 0) continue;

    const sql = literalSql(parts[0]);
    if (sql === null) {
      skip(parts);
      continue;
    }
    // Dollar-quoted bodies (`do $$ … $$`) make `$N` ambiguous; not guessed at.
    if (sql.includes("$$")) {
      skip(parts);
      continue;
    }

    const used = [...sql.matchAll(/\$(\d+)/g)].map((x) => Number(x[1]));
    const supplied = parts.length > 1 ? arrayLength(parts[1]) : 0;
    if (supplied === null) {
      skip(parts);
      continue;
    }

    out.checked += 1;
    const where = sql.replace(/\s+/g, " ").trim().slice(0, 80);

    if (used.length === 0) {
      if (supplied > 0) {
        out.findings.push({
          file,
          sql: where,
          problem: `${supplied} argument(s) supplied to a statement with no placeholders`,
        });
      }
      continue;
    }

    const highest = Math.max(...used);
    const seen = new Set(used);
    const gaps: number[] = [];
    for (let n = 1; n <= highest; n += 1) if (!seen.has(n)) gaps.push(n);

    if (gaps.length > 0) {
      out.findings.push({
        file,
        sql: where,
        problem:
          `placeholders skip $${gaps.join(", $")} and still reach $${highest} — ` +
          `the renumbering shape: a column was removed and what followed it was not moved down`,
      });
    }
    if (supplied !== highest) {
      out.findings.push({
        file,
        sql: where,
        problem: `highest placeholder is $${highest} but ${supplied} argument(s) are supplied`,
      });
    }
  }

  return out;
}

const SCRIPTS = `${ROOT}scripts/`;

test("every literal parameterised query binds $1..$N with N arguments", () => {
  const files = readdirSync(SCRIPTS).filter((n) => n.endsWith(".mjs"));
  assert.ok(files.length > 0, "no scripts/*.mjs found — has the tree moved?");

  const findings: Finding[] = [];
  const thin: string[] = [];
  const unreadable: string[] = [];

  for (const file of files) {
    const src = readFileSync(`${SCRIPTS}${file}`, "utf8");
    const result = scan(file, src);
    findings.push(...result.findings);
    if (result.unreadable > 0) {
      unreadable.push(`${file}: ${result.unreadable}`);
    }
    // A file that makes queries must offer at least one this can read. If a
    // rewrite ever makes every query dynamic, that is worth knowing — the
    // check would otherwise pass by checking nothing.
    if (/\bquery\s*\(/.test(src) && result.checked === 0 && result.skipped > 0) {
      thin.push(`${file}: ${result.skipped} parameterised queries, none readable`);
    }
  }

  assert.deepEqual(
    findings.map((f) => `${f.file}: ${f.problem}\n      ${f.sql}…`),
    [],
    `a parameterised query would be refused by Postgres on its first row:\n  ` +
      findings.map((f) => `${f.file}: ${f.problem}\n    ${f.sql}…`).join("\n  ") +
      `\n\nThis is the seed-bank bug (CLAUDE.md rule 12's corollary). Renumber ` +
      `the placeholders,\nor add the missing argument.`
  );

  assert.deepEqual(
    unreadable,
    [],
    `this check could not parse some query call sites, so it did not check ` +
      `them: ${unreadable.join(", ")}. A call it cannot read is a call it ` +
      `cannot defend — see the lexer note at the top of this file.`
  );

  assert.deepEqual(
    thin,
    [],
    `these scripts make queries and none of them are statically readable, so ` +
      `nothing was checked: ${thin.join(", ")}. Either that is fine and this ` +
      `list should say so, or the parser has regressed.`
  );
});

/**
 * THE CHECK ABOVE PASSES. THIS IS THE PROOF THAT PASSING MEANS SOMETHING.
 *
 * A checker whose only evidence is a green tree is a checker that could be
 * returning "nothing wrong" because it read nothing. So the bug it was written
 * for is kept here as a fixture — seed-bank's insert as it was actually
 * committed, `$7` skipped and the list running off the end at `$11` — and this
 * test fails if the scanner ever stops seeing it.
 */
test("the bind check catches the statement it was written for", () => {
  const asShipped = `
    const { rows } = await client.query(
      \`insert into bank_item
         (slug, world_id, kind, name, description, phase,
          min_lead_days, ships, weight, status, source_citation)
       values ($1, $2, $3::bank_kind, $4, $5, $6::bank_phase,
               $8, $9, $10, $11::product_status, $12)
       returning id\`,
      [
        row.slug,
        world.id,
        row.kind,
        row.name,
        description,
        row.phase,
        row.minLeadDays,
        row.ships,
        row.weight,
        held ? HELD : LIVE,
        row.citation,
      ]
    );
  `;

  const result = scan("fixture.mjs", asShipped);
  assert.equal(result.checked, 1, "the fixture query was not read at all");
  assert.equal(result.findings.length, 2, result.findings.map((f) => f.problem).join("; "));
  assert.match(result.findings[0].problem, /skip \$7/);
  assert.match(result.findings[1].problem, /highest placeholder is \$12 but 11/);
});

/** And the same statement, renumbered, is clean. */
test("the bind check passes the same statement once it is renumbered", () => {
  const fixed = `
    await client.query(
      \`insert into bank_item (a, b, c) values ($1, $2, $3::product_status)\`,
      [one, two, three]
    );
  `;
  const result = scan("fixture.mjs", fixed);
  assert.equal(result.checked, 1);
  assert.deepEqual(result.findings, []);
});
