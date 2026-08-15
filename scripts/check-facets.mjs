#!/usr/bin/env node
/**
 * Does the quiz still agree with the vocabulary?
 *
 *   npm run check:facets
 *
 * ─────────────────────────────────────────────────────────────────────
 * WHAT THIS PROTECTS
 *
 * db/002 promoted the taste vocabularies from strings in src/lib/quiz.ts to
 * rows in `facet`, joined to the quiz by `quiz_option_facet`. That buys
 * referential integrity — no typos, no drift between what a woman answered and
 * what a product is tagged with — but only while the two lists agree.
 *
 * They can disagree in three ways, and only one of them is harmless:
 *
 *   MISSING   an option in quiz.ts with no facet mapping. HARMFUL. She can
 *             pick it, it lands in quiz_response, and it resolves to nothing:
 *             the answer is stored but means nothing to the rest of the system.
 *             This is the failure the whole facet layer exists to prevent, and
 *             it is silent — no constraint fires, because quiz_response stores
 *             text[] by design.
 *   ORPHANED  a mapping with no matching option in quiz.ts. HARMLESS, and
 *             expected: retired options must keep resolving so that historical
 *             answers stay interpretable. Reported, never fatal.
 *   RELABEL   same code, different words. HARMLESS. The database is the source
 *             of truth for what a term IS; the module is the source of truth
 *             for how it is PRESENTED. Reported so a drift that was not
 *             intended gets noticed.
 *
 * Exit code is non-zero only for MISSING.
 *
 * ─────────────────────────────────────────────────────────────────────
 * WHERE THIS RUNS
 *
 * Anywhere with DATABASE_URL — a laptop pointed at a scratch database, or CI.
 * It is deliberately NOT wired into preDeployCommand: a relabelled hint should
 * not be able to fail a deploy, and a missing mapping is caught here long
 * before it reaches production. Same connection rules as scripts/migrate.mjs.
 */
import pg from "pg";

import { FIELDS } from "../src/lib/quiz.ts";

/** Kept in sync with the same function in scripts/migrate.mjs and src/lib/db.ts. */
function needsSsl(url) {
  if (/sslmode=disable/.test(url)) return false;
  return !/@(localhost|127\.0\.0\.1|\[::1\])/.test(url);
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("[check-facets] DATABASE_URL is not set.");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: url,
  ssl: needsSsl(url) ? { rejectUnauthorized: false } : undefined,
  application_name: "revelle-check-facets",
});

await client.connect();

const { rows } = await client.query(`
  select m.quiz_field, m.option_code::text as option_code, m.answer_polarity,
         f.label, f.description, f.status
    from quiz_option_facet m
    join facet f on f.id = m.facet_id
`);
await client.end();

const mapped = new Map(rows.map((r) => [`${r.quiz_field}/${r.option_code}`, r]));

const missing = [];
const relabelled = [];
const seen = new Set();

for (const [fieldId, field] of Object.entries(FIELDS)) {
  if (field.type !== "single" && field.type !== "multi") continue;

  for (const option of field.options) {
    const key = `${fieldId}/${option.code}`;
    seen.add(key);

    const row = mapped.get(key);
    if (!row) {
      missing.push(key);
      continue;
    }
    if (row.label !== option.label) {
      relabelled.push(`${key}: db "${row.label}" vs quiz.ts "${option.label}"`);
    }
    if ((option.hint ?? "") !== row.description) {
      relabelled.push(
        `${key}: hint differs — db "${row.description}" vs quiz.ts "${option.hint ?? ""}"`
      );
    }
  }
}

const orphaned = [...mapped.keys()].filter((k) => !seen.has(k));

for (const line of relabelled) console.log(`[check-facets] relabelled  ${line}`);
for (const key of orphaned) {
  console.log(`[check-facets] retired     ${key} (kept so old answers resolve)`);
}

if (missing.length > 0) {
  console.error(
    `\n[check-facets] FAILED: ${missing.length} quiz option(s) resolve to no ` +
      `facet. An answer using one of these is stored but means nothing:\n  ` +
      missing.join("\n  ") +
      `\n\nAdd a facet row and a quiz_option_facet row — an insert, not a ` +
      `migration. See db/002-taste-cohorts-and-facets.sql.`
  );
  process.exit(1);
}

console.log(
  `[check-facets] ok — ${seen.size} quiz options all resolve to facets ` +
    `(${relabelled.length} relabelled, ${orphaned.length} retired)`
);
