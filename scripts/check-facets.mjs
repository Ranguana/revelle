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
 * A fourth case is not a disagreement at all and is listed separately:
 * TRANSLATED, where the answer is bridged onto a facet with a different code —
 * a point on an ordinal axis, or a month landing on a season. Its words are
 * supposed to differ from the facet's. See the note above `isTranslated`.
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
import { TONES, VOICE_FACETS } from "../src/lib/voice.ts";

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
         m.facet_id::text as facet_id, m.answer_weight::float8 as answer_weight,
         f.code::text as facet_code, f.label, f.description, f.status
    from quiz_option_facet m
    join facet f on f.id = m.facet_id
`);

/*
 * The voice half. A tone is a quiz option like any other and is checked above;
 * what is checked here is the layer beneath it — the weights that decide what a
 * tone MEANS, which the loop above cannot see because they are not options.
 *
 * A tone that resolves to nothing is fatal for the same reason a missing option
 * mapping is: she can tap it, it is stored, and it means nothing to the rest of
 * the system. A weight that DIFFERS is reported and not fatal — the database
 * wins on what a term is, and a curator retuning a weight in the tool is the
 * mechanism working rather than failing.
 */
const { rows: voiceRows } = await client.query(`
  select t.code::text as tone, v.code::text as facet, r.weight::float8 as weight
    from voice_tone_facet r
    join facet t on t.id = r.tone_facet_id
    join facet v on v.id = r.voice_facet_id
`);

const { rows: axisRows } = await client.query(`
  select code::text as code, label, description
    from facet where dimension_code = 'voice'
`);
await client.end();

const mapped = new Map(rows.map((r) => [`${r.quiz_field}/${r.option_code}`, r]));

/*
 * SOME ANSWERS ARE THEIR FACET AND SOME ARE TRANSLATED INTO ONE, and the
 * wording check has to know which or it reports drift forever.
 *
 * Most questions are unordered and their options map one-to-one onto facets —
 * THE FACET IS THE OPTION, so its label and description should be the option's
 * label and hint, and a difference is real drift worth printing. That identity
 * has a spelling: the facet's code and the option's code are the same string,
 * because both come from the same list. Every generated bridge in db/002, 005,
 * 006, 007 and 016 is written as `select f.code` for exactly that reason.
 *
 * Where the codes DIFFER, the bridge is a translation and the two sets of words
 * are describing different things on purpose:
 *
 *   how_made/actually_made -> making/made_by_hand
 *     An ordinal question. Four answers on ONE signed axis (db/016: four
 *     separate terms could not say that bought and arranged is nearer half made
 *     than actually made), so the facet's words describe the AXIS and the
 *     option's describe one point on it.
 *   event_month/august -> season/high_summer
 *     A calendar. db/026 bridges twelve months onto five seasons because the
 *     catalogue is tagged in seasons; the facet's words are db/012's gloss on a
 *     season and the option's word is the name of a month. "August" and "High
 *     summer" are both correct and neither is drift.
 *
 * The test is therefore on the codes rather than on a count of options per
 * facet, which is what it used to be. The count got `august` wrong: high summer
 * has exactly one month in it, so a bridged answer looked one-to-one and was
 * reported as drift — inviting somebody to "fix" it by renaming a season after
 * a month.
 */
const isTranslated = (row, option) => row.facet_code !== option.code;

const missing = [];
const relabelled = [];
/** Options whose facet is a translation of the answer rather than the answer. */
const shared = [];
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
    if (isTranslated(row, option)) {
      shared.push(
        `${key} -> ${row.facet_code} (weight ${row.answer_weight})`
      );
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

// ── the voice mapping ──────────────────────────────────────────────────

const resolved = new Map(
  voiceRows.map((r) => [`${r.tone}/${r.facet}`, r.weight])
);
const axes = new Map(axisRows.map((r) => [r.code, r]));

const unresolved = [];
const reweighted = [];

for (const tone of TONES) {
  const rows = voiceRows.filter((r) => r.tone === tone.code);
  if (rows.length === 0) {
    unresolved.push(tone.code);
    continue;
  }
  for (const { code, weight } of tone.facets) {
    const stored = resolved.get(`${tone.code}/${code}`);
    if (stored === undefined) {
      reweighted.push(`${tone.code} -> ${code}: absent in the database`);
    } else if (Math.abs(stored - weight) > 1e-9) {
      reweighted.push(
        `${tone.code} -> ${code}: db ${stored} vs voice.ts ${weight}`
      );
    }
  }
}

for (const facet of VOICE_FACETS) {
  const row = axes.get(facet.code);
  if (!row) {
    unresolved.push(`voice/${facet.code}`);
    continue;
  }
  if (row.label !== facet.label || row.description !== facet.description) {
    reweighted.push(`voice/${facet.code}: wording differs from voice.ts`);
  }
}

for (const line of reweighted) console.log(`[check-facets] voice drift ${line}`);

for (const line of relabelled) console.log(`[check-facets] relabelled  ${line}`);
for (const line of shared) {
  console.log(`[check-facets] translated  ${line}`);
}
for (const key of orphaned) {
  console.log(`[check-facets] retired     ${key} (kept so old answers resolve)`);
}

if (unresolved.length > 0) {
  console.error(
    `\n[check-facets] FAILED: ${unresolved.length} tone(s) or voice axis(es) ` +
      `resolve to nothing. A tone she can tap that means nothing is the ` +
      `failure db/007 exists to prevent:\n  ` +
      unresolved.join("\n  ") +
      `\n\nHas db/007-the-voice-of-her-people.sql been applied?`
  );
  process.exit(1);
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
    `(${relabelled.length} relabelled, ${shared.length} translated, ` +
    `${orphaned.length} retired), and ` +
    `every tone resolves to a voice axis (${reweighted.length} reweighted)`
);
