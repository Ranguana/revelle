#!/usr/bin/env node
/**
 * WHEN THE REGISTRY LAST SAID IT — one date per room per copy field.
 *
 *   npm run gen:registry-dates      writes src/lib/desk/registry-dates.ts
 *   npm run check:registry-dates    fails if that file is out of date
 *
 * ─────────────────────────────────────────────────────────────────────
 * WHY THIS EXISTS
 *
 * The reconciliation desk (/desk/reconcile) shows the founder three facts
 * about a drifting field, not two. Who chose the database copy, WHEN they
 * chose it, and when the registry text they were choosing against was last
 * written. Founder, 2026-08-31:
 *
 *   "A human choice from before the correction cycle is a stale choice; the
 *    no-preselection rule stands, but the timeline belongs in front of you
 *    when you click."
 *
 * Two of those three facts are in the database — `staff_action.created_at`
 * answers who and when. The third is not in any table and never will be: the
 * registry is a source file, and the only record of when one of its sentences
 * was written is the commit that wrote it.
 *
 * ─────────────────────────────────────────────────────────────────────
 * WHY IT IS GENERATED AND NOT READ AT REQUEST TIME
 *
 * The desk runs on Render out of a build artifact. There is no working tree
 * under it, `git` is not on the path, and a server component shelling out per
 * row would be a subprocess per field per render. So the answer is computed
 * once, here, against a clean worktree, and committed as data.
 *
 * ─────────────────────────────────────────────────────────────────────
 * HOW THE DATE IS DERIVED, AND WHAT IT CANNOT SEE
 *
 * `git log -s -L <start>,<end>:src/lib/destinations.ts`, one range per field,
 * newest commit first. `-L` follows the line range backwards through history
 * — it survives the block moving inside the file, which `git blame` on a fixed
 * line number does not, and it survives the value being a concatenation split
 * across four physical lines, which `git log -S"<the whole string>"` does not.
 * Both of those shapes are present in this file today: `tagline:` sits alone
 * on its line at WESTHAMPTON and inline at HAVANA, and every `premise:` is a
 * multi-line `+` chain.
 *
 * WHAT IT OVERSTATES: the range is the whole property, key line included, so a
 * commit that only reindented it or only changed the wrapping counts as an
 * authoring date. That is the honest direction to be wrong in — it can make a
 * curator's edit look older than the registry text when it is not, and the
 * screen's job is to make the founder look, never to decide for her.
 *
 * WHAT IT CANNOT SEE AT ALL: a room whose property this parser does not find.
 * Those are EMITTED WITH A REASON rather than omitted, because a missing row
 * and a room with no history are indistinguishable once they are both absent,
 * and the screen has to be able to say which it is (rule 16).
 *
 * ─────────────────────────────────────────────────────────────────────
 * THE STALENESS GUARD, WHICH IS THE PART THAT MATTERS
 *
 * A generated file is a lie the moment the thing it was generated from moves,
 * and this one would be a lie IN FRONT OF THE FOUNDER AT THE MOMENT SHE
 * CLICKS — the worst place this repository has. So every row carries `value`:
 * the registry text the date was computed for. `src/lib/desk/registry-dates.ts`
 * compares that against the live registry at read time and returns `stale`
 * rather than a date when they differ. No git, no build step, no trust.
 *
 * `src/lib/desk/reconcile.test.ts` fails when any row is stale, so a commit
 * that rewrites a tagline and forgets to regenerate goes red in `npm test`
 * rather than reaching a screen.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const SOURCE = "src/lib/destinations.ts";
const OUT = `${ROOT}src/lib/desk/registry-dates.ts`;

/** The three fields /api/health and /desk/reconcile compare. */
const FIELDS = ["name", "tagline", "premise"];

const check = process.argv.includes("--check");

function git(args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" });
}

/*
 * A DIRTY WORKTREE MAKES EVERY LINE NUMBER BELOW WRONG.
 *
 * The ranges are parsed out of the file on disk and handed to `git log -L`,
 * which resolves them against HEAD. With uncommitted edits in the file those
 * are two different documents, and the dates come back attached to whatever
 * sentence happens to sit at that line number in the commit — plausible,
 * wrong, and unfalsifiable from the output. Refused rather than warned about.
 */
function assertClean() {
  const dirty = git(["status", "--porcelain", "--", SOURCE]).trim();
  if (dirty !== "") {
    console.error(
      `[registry-dates] ${SOURCE} has uncommitted changes.\n` +
        `  Line ranges are read from the working tree and resolved against HEAD,\n` +
        `  so every date below would be attached to the wrong sentence.\n` +
        `  Commit the registry first, then regenerate.`
    );
    process.exit(1);
  }
}

/* ── parsing the registry ───────────────────────────────────────────── */

/**
 * Every authored room, with the 1-based line range of each copy field.
 *
 * Textual, not a TypeScript parse. The shape it depends on is the file's own
 * and has held for eighteen rooms: a room is `export const NAME: Destination =
 * {`, its properties sit at exactly two spaces of indent, and a property runs
 * until the next two-space property or the closing brace. Anything that does
 * not match is reported by name — see NOT FOUND below — never skipped.
 */
function rooms(text) {
  const lines = text.split("\n");
  const found = [];
  let current = null;

  const startOfRoom = /^export const [A-Z0-9_]+: Destination = \{\s*$/;
  const property = /^ {2}([A-Za-z_][A-Za-z0-9_]*):/;
  const endOfRoom = /^\};\s*$/;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (startOfRoom.test(line)) {
      current = { key: null, at: {} };
      found.push(current);
      continue;
    }
    if (!current) continue;
    if (endOfRoom.test(line)) {
      closeLast(current, i); // 0-based index of `};` — one past the last body line
      current = null;
      continue;
    }
    const match = property.exec(line);
    if (!match) continue;
    closeLast(current, i);
    const name = match[1];
    if (name === "key") {
      const slug = /^ {2}key:\s*"([^"]+)"/.exec(line);
      current.key = slug ? slug[1] : null;
    }
    if (FIELDS.includes(name)) {
      current.at[name] = { start: i + 1, end: i + 1 };
      current.open = name;
    } else {
      current.open = null;
    }
  }

  return found.filter((room) => room.key !== null);
}

/** A property runs to the line before the next one. `index` is 0-based. */
function closeLast(room, index) {
  if (!room.open) return;
  room.at[room.open].end = index; // 1-based inclusive end = 0-based index of next line
  room.open = null;
}

/* ── the dates ──────────────────────────────────────────────────────── */

/** ASCII unit separator: not a character a commit subject contains. */
const SEP = "\u001f";

/**
 * Every commit that touched one field's lines, newest first.
 *
 * `-s` suppresses the diff `-L` would otherwise imply; without it this parses
 * a patch per commit to read two fields off the header.
 */
function history(start, end) {
  const out = git([
    "log",
    "-s",
    `--format=%H${SEP}%aI${SEP}%s`,
    `-L`,
    `${start},${end}:${SOURCE}`,
  ]);
  return out
    .split("\n")
    .filter((line) => line.includes(SEP))
    .map((line) => {
      const [sha, authoredAt, subject] = line.split(SEP);
      return { sha, authoredAt, subject };
    });
}

/* ── the file ───────────────────────────────────────────────────────── */

function render(rows) {
  const body = rows
    .map((row) => `  ${JSON.stringify(row)},`)
    .join("\n");

  return `/**
 * WHEN THE REGISTRY LAST SAID IT. GENERATED — do not edit.
 *
 *   npm run gen:registry-dates
 *
 * One row per room per copy field, carrying the date the registry text was
 * last written and the text it was written as. The whole argument — why this
 * is generated, how the date is derived, and what it overstates — is in
 * scripts/registry-dates.mjs. Read that before trusting a number here.
 *
 * ── THE ONE THING TO KNOW BEFORE READING A DATE OFF THIS FILE ────────
 *
 * A generated date is a lie the moment the thing it was generated from moves,
 * and this one would be a lie in front of the founder at the moment she
 * decides whether a curator's edit predates a correction. So NOTHING READS
 * \`authoredAt\` DIRECTLY. \`registryDate()\` checks the recorded \`value\`
 * against the live registry first and returns \`stale\` instead of a date when
 * they have parted — which is a state the screen renders in words, not a blank
 * that would read as "never revised".
 */

import { authoredCopy } from "@/lib/desk/drift";

export type RegistryCopyDate = {
  slug: string;
  /** 'name' | 'tagline' | 'premise' — the registry's own words for them. */
  field: string;
  /** ISO 8601 author date of the newest commit touching the field's lines. */
  authoredAt: string;
  sha: string;
  subject: string;
  /** The registry text this date was computed for. The staleness key. */
  value: string;
  /**
   * How many commits have ever touched these lines. 1 means the sentence has
   * stood unchanged since it was first written, which is the case where "the
   * curator edited against a text that has since been replaced" cannot apply.
   */
  revisions: number;
  /**
   * Null when the field was dated. Otherwise why it was not — a parser miss,
   * or a range with no history. Emitted rather than omitted: an absent row and
   * a room with no history are indistinguishable once both are missing.
   */
  unknown: string | null;
};

export const REGISTRY_COPY_DATES: readonly RegistryCopyDate[] = [
${body}
];

/** What \`registryDate\` can say. Three states, never two. */
export type RegistryDateReading =
  | { state: "dated"; at: RegistryCopyDate }
  | { state: "stale"; at: RegistryCopyDate }
  | { state: "unknown"; why: string };

/**
 * The date the registry text now in force was written, or why there is none.
 *
 * STALE IS NOT A DATE AND IS NOT A BLANK. It means this file was generated
 * against a different sentence than the one the registry holds today — so the
 * date is real and belongs to text nobody is looking at. Returning it would
 * put a wrong number under the founder's cursor; returning nothing would read
 * as "never revised", which is the opposite of the truth. It gets its own
 * state and the screen says so in words.
 */
export function registryDate(slug: string, field: string): RegistryDateReading {
  const row = REGISTRY_COPY_DATES.find(
    (entry) => entry.slug === slug && entry.field === field
  );
  if (!row) {
    return {
      state: "unknown",
      why:
        \`No row for \${slug}.\${field} in the generated dates. Either the room \` +
        \`is newer than the last \\\`npm run gen:registry-dates\\\`, or the parser \` +
        \`does not recognise its shape.\`,
    };
  }
  if (row.unknown !== null) return { state: "unknown", why: row.unknown };

  const live = authoredCopy(slug, field);
  if (live === null) {
    return {
      state: "unknown",
      why: \`The registry no longer authors a room with the slug \${slug}.\`,
    };
  }
  if (live !== row.value) return { state: "stale", at: row };
  return { state: "dated", at: row };
}
`;
}

/* ── run ────────────────────────────────────────────────────────────── */

assertClean();

const text = readFileSync(`${ROOT}${SOURCE}`, "utf8");
const parsed = rooms(text);

const rows = [];
let dated = 0;
let missing = 0;

for (const room of parsed) {
  for (const field of FIELDS) {
    const range = room.at[field];
    if (!range) {
      missing += 1;
      rows.push({
        slug: room.key,
        field,
        authoredAt: "",
        sha: "",
        subject: "",
        // The live value still travels, so the staleness check can run and the
        // screen can at least show what the registry says today.
        value: "",
        revisions: 0,
        unknown:
          `scripts/registry-dates.mjs found no \`${field}:\` property in this ` +
          `room's block in ${SOURCE}. The date is not missing — it was never ` +
          `computed, and the parser is what needs fixing.`,
      });
      continue;
    }
    const log = history(range.start, range.end);
    if (log.length === 0) {
      missing += 1;
      rows.push({
        slug: room.key,
        field,
        authoredAt: "",
        sha: "",
        subject: "",
        value: value(text, range),
        revisions: 0,
        unknown:
          `\`git log -L ${range.start},${range.end}:${SOURCE}\` returned no ` +
          `commit. The lines exist in the working tree and no commit in this ` +
          `history touches them, which should be impossible on a clean tree.`,
      });
      continue;
    }
    dated += 1;
    rows.push({
      slug: room.key,
      field,
      authoredAt: log[0].authoredAt,
      sha: log[0].sha,
      subject: log[0].subject,
      value: value(text, range),
      revisions: log.length,
      unknown: null,
    });
  }
}

/**
 * The registry's own value for a field, as `normalise` in drift.ts would see
 * it — the string this file is keyed on and the reason a rewrite makes a row
 * stale rather than wrong.
 *
 * Evaluated out of the SOURCE TEXT rather than imported from the module,
 * because this script must be able to run against a file whose imports do not
 * resolve (a half-finished room, a rename). The only shape it accepts is the
 * one the file uses: double-quoted string literals joined by `+`.
 */
function value(text, range) {
  const body = text
    .split("\n")
    .slice(range.start - 1, range.end)
    // Comments inside the range carry apostrophes and quotation marks of their
    // own, and one unbalanced `"` in a note turns the literal scanner below
    // into a scanner of prose. Whole-line comments only: a `//` mid-line is
    // far likelier to be inside a sentence than to start one here.
    .filter((line) => !/^\s*\/\//.test(line))
    .join("\n")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/^\s*[A-Za-z_][A-Za-z0-9_]*:/, "");
  // `\n` is excluded from the body class deliberately: no string literal in
  // this file spans a physical line, and allowing one lets an unterminated
  // quote swallow the rest of the property.
  const parts = body.match(/"(?:[^"\\\n]|\\.)*"/g);
  if (!parts) return "";
  return parts.map((part) => JSON.parse(part)).join("").replace(/\r\n/g, "\n").trim();
}

const rendered = render(rows);

if (check) {
  const existing = (() => {
    try {
      return readFileSync(OUT, "utf8");
    } catch {
      return null;
    }
  })();
  if (existing !== rendered) {
    console.error(
      `[registry-dates] src/lib/desk/registry-dates.ts is out of date.\n` +
        `  Run: npm run gen:registry-dates`
    );
    process.exit(1);
  }
  console.log(
    `[registry-dates] up to date — ${dated} dated, ${missing} unknown, ` +
      `${parsed.length} rooms.`
  );
} else {
  writeFileSync(OUT, rendered);
  // CLAUDE.md rule 24: count what it matched. A parser that found three rooms
  // out of eighteen is not a parser that worked, and the only way anybody
  // finds out is if the number is printed.
  console.log(
    `[registry-dates] ${parsed.length} rooms · ${dated} fields dated · ` +
      `${missing} unknown → src/lib/desk/registry-dates.ts`
  );
  for (const row of rows.filter((r) => r.unknown !== null)) {
    console.log(`[registry-dates]   unknown: ${row.slug}.${row.field}`);
  }
}
