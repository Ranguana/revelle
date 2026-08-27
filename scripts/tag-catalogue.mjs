#!/usr/bin/env node
/**
 * THE POST-SEED TAGGING STEP — the wrapper, not the step.
 *
 *   npm run tag:catalogue
 *   npm run tag:catalogue -- --overwrite   let the derivation beat the desk
 *
 * Everything this does is in `tagCatalogue()`, src/lib/catalogue/tagging.ts.
 * This file opens a client, calls it once, prints what happened and sets an
 * exit code — and that division is deliberate rather than tidy.
 *
 * ── WHY THE WORK IS NOT IN HERE (CLAUDE.md rule 21) ──────────────────
 *
 * The step has TWO CALLERS from the day it exists: `preDeployCommand` in
 * render.yaml, and /desk/stocked's sync button through
 * src/app/api/desk/seed/route.ts. The founder, before it was built:
 *
 *   "One exported function both paths invoke, or the button and the deploy
 *    drift apart the day after the button existed to prevent exactly that."
 *
 * Both paths run THIS script, which calls THAT function. There is no second
 * implementation to keep in step, and `src/lib/deploy.test.ts` asserts the two
 * chains name the same steps in the same order so there is no second LIST
 * either.
 *
 * ── WHY IT RUNS LAST ─────────────────────────────────────────────────
 *
 * It computes over content, so it runs after content exists. That is the whole
 * of CLAUDE.md rule 22 and the whole reason this file is not a migration:
 * `preDeployCommand` runs `migrate` BEFORE every seeder, so db/020's and
 * db/033's text-matching tag statements have run against empty tables on every
 * build since they were written, and `ingredient_requirement` is empty on any
 * database built from the committed chain.
 *
 * Same connection rules as scripts/migrate.mjs. Needs DATABASE_URL.
 */
import pg from "pg";

import { tagCatalogue } from "../src/lib/catalogue/tagging.ts";

/** Kept in sync with the same function in scripts/migrate.mjs and src/lib/db.ts. */
function needsSsl(url) {
  if (/sslmode=disable/.test(url)) return false;
  return !/@(localhost|127\.0\.0\.1|\[::1\])/.test(url);
}

function fail(message) {
  console.error(`\n[tag-catalogue] FAILED: ${message}`);
  process.exit(1);
}

// `--activate` is refused by every seeder by name rather than ignored, because
// a flag that silently means nothing still reads as if it controlled something
// (CLAUDE.md rule 16). This step never publishes anything at all, so the flag
// is even less meaningful here than there.
if (process.argv.includes("--activate")) {
  console.error(
    `[tag-catalogue] --activate is not a thing this step has. It writes ` +
      `derived CLAIMS about rows\nthat already exist; it publishes nothing and ` +
      `it never will. See CLAUDE.md rule 8.`
  );
  process.exit(2);
}

const overwrite = process.argv.includes("--overwrite");

const url = process.env.DATABASE_URL;
if (!url) fail("DATABASE_URL is not set.");

const client = new pg.Client({
  connectionString: url,
  ssl: needsSsl(url) ? { rejectUnauthorized: false } : undefined,
  application_name: "revelle-tag-catalogue",
});

await client.connect();

// ONE TRANSACTION, like every seeder. A tagging run that half-applied would
// leave a gate that fires for some of the catalogue, which is worse than one
// that does not fire at all: it looks like an authoring gap.
let report = null;
let failure = null;
try {
  await client.query("begin");
  report = await tagCatalogue(client, { overwrite });
  await client.query("commit");
} catch (err) {
  await client.query("rollback").catch(() => {});
  failure = err instanceof Error ? err.message : String(err);
} finally {
  await client.end().catch(() => {});
}

if (failure !== null) fail(failure);

/* ── the report ─────────────────────────────────────────────────────── */

console.log(`\n[tag-catalogue] WHAT A THING NEEDS OF THE ROOM`);
for (const statement of report.venue.statements) {
  console.log(
    `  ${String(statement.wrote).padStart(4)} written  ${statement.label} (${statement.from})`
  );
}
const holdings = Object.entries(report.venue.holdings);
if (holdings.length === 0) {
  console.log(
    `\n  ingredient_requirement IS EMPTY after a tagging run. Every predicate ` +
      `above matched\n  nothing, which is CLAUDE.md rule 22's second failure — ` +
      `the tagger ran and matched\n  nothing — and it reads identically from ` +
      `outside to the tagger never running.\n  npm run check:gates says which.`
  );
} else {
  console.log(`\n  ingredient_requirement now holds:`);
  for (const [code, n] of holdings) console.log(`    ${String(n).padStart(4)}  ${code}`);
  console.log(`    ${String(report.venue.total).padStart(4)}  in all`);
}
console.log(
  `  ${report.venue.worldsDeclaring} destination(s) declare a venue ` +
    `requirement of their own (db/033 §4).`
);

console.log(`\n[tag-catalogue] WHETHER A DRINK'S SEASON IS A GATE OR A LEAN`);
console.log(
  `  ${report.season.examined} examined · ${report.season.gated} gated this ` +
    `run · ${report.season.agreed} already agreed`
);
if (report.season.deskIsStricter.length > 0) {
  console.log(
    `\n  ${report.season.deskIsStricter.length} drink(s) are stricter in the ` +
      `database than the document derives.\n  LEFT AS THE DESK HAS THEM — ` +
      `retracting a refusal a person made is not a derivation's\n  business. ` +
      `Re-run with --overwrite to let the document win:`
  );
  for (const row of report.season.deskIsStricter) {
    console.log(`    ${row.slug} — ${row.name} (${row.wording}): ${row.why}`);
  }
}
if (report.season.notGated.length > 0) {
  console.log(`\n  --overwrite cleared the gate on:`);
  for (const row of report.season.notGated) {
    console.log(`    ${row.slug} — ${row.name} (${row.wording}): ${row.why}`);
  }
}
if (report.season.unmapped.length > 0) {
  console.log(
    `\n  ${report.season.unmapped.length} drink(s) carry a season wording ` +
      `SEASONS does not map. Nothing was\n  guessed — add the wording to ` +
      `scripts/catalogue-vocabulary.mjs, which is a decision:`
  );
  for (const row of report.season.unmapped) {
    console.log(`    ${row.slug} — ${row.why}`);
  }
}

console.log(`\n[tag-catalogue] WHICH OCCASIONS A PROGRAMME CLAIMS`);
console.log(
  `  ${report.occasion.examined} examined · ${report.occasion.claimed} claim(s) ` +
    `written · drink_occasion holds ${report.occasion.holdings} row(s)`
);
if (report.occasion.claimed === 0 && report.occasion.examined > 0) {
  console.log(
    `\n  NO CLAIM, TWENTY-FIVE TIMES, AND THAT IS THE FINDING RATHER THAN A ` +
      `GAP IN THIS SCRIPT.\n` +
      `  A drink record is five bullets — cocktails · mocktail mirrors · what ` +
      `it's for ·\n  season · how much mixing — and there is no occasion among ` +
      `them. The third\n  bullet is what a parser would reach for, and db/023 ` +
      `already ruled on exactly\n  those lines: they are MEAL SHAPES, and "an ` +
      `occasion is why she is having people\n  over — a birthday, an ` +
      `anniversary — and a meal shape is what the table is".\n\n` +
      `  ${report.occasion.temptedRows} of ${report.occasion.examined} contain ` +
      `a word a thesaurus parser would have scoped on.\n  Counted rather than ` +
      `assumed, because the classifier-hyphen incident was a\n  matcher nobody ` +
      `had counted:`
  );
  for (const row of report.occasion.unclaimed) {
    if (row.tempting.length === 0) continue;
    console.log(`    ${row.slug} — ${row.reading}`);
  }
  console.log(
    `\n  ${report.deskTodoFiled ? "Filed" : "Already on"} the desk's list as ` +
      `a gap. Unclaimed stays UNFILTERED — room-scoped and\n  occasion-blind, ` +
      `exactly today's behaviour — so nothing a member could have had was\n` +
      `  removed by this run.`
  );
}

console.log(
  `\n[tag-catalogue] done. \`npm run check:gates\` is the other half: this ` +
    `says what was\nwritten, that says whether any of it refuses anything.`
);
