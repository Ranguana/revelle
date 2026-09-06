#!/usr/bin/env node
/**
 * THE PHOTOGRAPH BENCH.
 *
 *   npm run bench:photos -- ./photos          read every case in that folder
 *   npm run bench:photos -- ./photos trap     one group only
 *   npm run bench:photos -- --dry-run         say what is missing and stop
 *
 * Reads each of the thirty cases in src/lib/photo-gold-set.ts through EXACTLY
 * the code path the product uses — src/lib/photo-extract.ts's tool, prompt and
 * parser — and scores schema validity separately from claim correctness, plus
 * the two the founder asked for: false-positive rate and silence precision.
 *
 * ── IT WILL NOT PRETEND ─────────────────────────────────────────────
 *
 * CLAUDE.md rule 9: never point a person at something that cannot be run, and
 * rule 20: a report generated from something other than reality is the most
 * convincing failure this system produces. So:
 *
 *   · no folder, or no pictures in it → it says which files are missing, by
 *     name, and exits non-zero. It does not score nine cases and print a
 *     percentage as though it had scored thirty.
 *   · no ANTHROPIC_API_KEY → it says so and exits. It does not fall back.
 *   · unlabelled cases are counted and named. A run over thirty unlabelled
 *     photographs still measures schema validity, the seam and every trap,
 *     and it says in the header that precision and recall rest on nothing.
 *
 * ── AND IT WRITES NOTHING ───────────────────────────────────────────
 *
 * No database, no rows, no ledger. The bench is a measurement of the reader,
 * not an act on anybody's application.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import process from "node:process";

import Anthropic from "@anthropic-ai/sdk";
import sharp from "sharp";

import { MAX_TOKENS, MODEL } from "../src/lib/model.ts";
import {
  EXTRACT_ASK,
  EXTRACT_TOOL_NAME,
  PHOTO_LONG_EDGE,
  extractFrom,
  extractSystemPrompt,
  extractTool,
  silentExtract,
} from "../src/lib/photo-extract.ts";
import {
  BENCH_FACETS,
  GOLD_GROUPS,
  GOLD_SET,
  score,
} from "../src/lib/photo-gold-set.ts";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const positional = args.filter((arg) => !arg.startsWith("--"));
const folder = positional[0] ? resolve(positional[0]) : null;
const group = positional[1] ?? null;

if (group !== null && !GOLD_GROUPS.includes(group)) {
  console.error(`Unknown group ${group}. One of: ${GOLD_GROUPS.join(", ")}`);
  process.exit(2);
}

const cases = GOLD_SET.filter((entry) => group === null || entry.group === group);

/* ── what the bench does not have ──────────────────────────────────── */

const unlabelled = cases.filter((entry) => !entry.labelled);
const missing = folder
  ? cases.filter((entry) => !existsSync(join(folder, entry.file)))
  : cases;

function saySituation() {
  console.log(`THE BENCH — ${cases.length} case(s)${group ? ` in ${group}` : ""}`);
  console.log("");
  if (unlabelled.length > 0) {
    console.log(
      `${unlabelled.length} of ${cases.length} carry no labels. Precision and ` +
        `recall over those rest on nothing and are reported as such; schema ` +
        `validity, the seam and every trap are still measured.`
    );
    console.log(`  ${unlabelled.map((entry) => entry.id).join(", ")}`);
    console.log("");
  }
  if (missing.length > 0) {
    console.log(`${missing.length} photograph(s) are not on disk:`);
    for (const entry of missing) {
      console.log(`  ${entry.file.padEnd(16)} ${entry.brief}`);
    }
    console.log("");
    console.log("docs/photo-gold-set.md is the sheet. Drop the files, write the");
    console.log("labels, run this again.");
  }
}

if (dryRun || folder === null || missing.length === cases.length) {
  saySituation();
  if (folder === null && !dryRun) {
    console.log("");
    console.log("Point it at a folder: npm run bench:photos -- ./photos");
  }
  process.exit(dryRun ? 0 : 1);
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error(
    "ANTHROPIC_API_KEY is unset. The bench measures a reader; there is no " +
      "reader. Nothing was run."
  );
  process.exit(1);
}

saySituation();

/* ── the run ───────────────────────────────────────────────────────── */

const client = new Anthropic();
const tool = extractTool();

/** One frame, through the product's own call shape. One image, temperature 0. */
async function read(entry) {
  const bytes = await sharp(readFileSync(join(folder, entry.file)))
    .rotate()
    .resize({
      width: PHOTO_LONG_EDGE,
      height: PHOTO_LONG_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();

  let message;
  try {
    message = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      temperature: 0,
      system: extractSystemPrompt(entry.role),
      tools: [tool],
      tool_choice: { type: "tool", name: EXTRACT_TOOL_NAME },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: bytes.toString("base64"),
              },
            },
            { type: "text", text: EXTRACT_ASK },
          ],
        },
      ],
    });
  } catch (err) {
    return {
      extract: silentExtract(`unreachable: ${err.message}`, { role: entry.role }),
      drops: [],
    };
  }

  const call = message.content.find(
    (block) => block.type === "tool_use" && block.name === EXTRACT_TOOL_NAME
  );
  if (!call) {
    return {
      extract: silentExtract("answered without using the tool", {
        role: entry.role,
      }),
      drops: [],
    };
  }

  // The product's parser, not a second one. No retry, exactly as in
  // src/lib/photo-read.ts — a bench that is more forgiving than production
  // measures a reader nobody ships.
  const parsed = extractFrom({
    raw: call.input,
    role: entry.role,
    model: message.model ?? MODEL,
    palette: [],
  });
  return parsed.ok
    ? { extract: parsed.extract, drops: parsed.dropped }
    : { extract: silentExtract(parsed.silence, { role: entry.role }), drops: [] };
}

const runnable = cases.filter((entry) => existsSync(join(folder, entry.file)));
const results = [];
for (const entry of runnable) {
  process.stdout.write(`  ${entry.id} … `);
  const outcome = await read(entry);
  results.push({ photo: entry, ...outcome });
  process.stdout.write(
    outcome.extract.outcome === "silent"
      ? "silent\n"
      : `${outcome.extract.facets.length} cell(s)\n`
  );
}

/* ── the report ────────────────────────────────────────────────────── */

const s = score(results);
const pct = (value) => (value === null ? "—" : `${(value * 100).toFixed(1)}%`);

console.log("");
console.log("SCHEMA VALIDITY (scored separately, on purpose)");
console.log(`  read                  ${s.read} of ${s.cases}`);
console.log(`  entries dropped       ${s.dropped}`);
console.log(`  fingerprint attempts  ${s.fingerprintAttempts}`);
console.log(`  seam breaches         ${s.seamBreaches}   (must be 0)`);
for (const silence of s.silences) console.log(`    ${silence}`);

console.log("");
console.log("CLAIM CORRECTNESS");
console.log(`  labelled cases        ${s.labelled} of ${s.cases}`);
console.log(`  hits                  ${s.hits}`);
console.log(`  misses                ${s.misses}`);
console.log(`  false positives       ${s.falsePositives} of ${s.scoredProposals}`);

console.log("");
console.log("THE TWO THAT DECIDE IT");
console.log(`  false-positive rate   ${pct(s.falsePositiveRate)}   (low)`);
console.log(`  silence precision     ${pct(s.silencePrecision)}   (high)`);
console.log(`  recall                ${pct(s.recall)}   (reported, not the headline)`);

console.log("");
console.log("BY GROUP");
for (const name of GOLD_GROUPS) {
  const subset = results.filter((row) => row.photo.group === name);
  if (subset.length === 0) continue;
  const sub = score(subset);
  console.log(
    `  ${name.padEnd(8)} fp ${pct(sub.falsePositiveRate).padStart(6)}   ` +
      `silence ${pct(sub.silencePrecision).padStart(6)}   ` +
      `recall ${pct(sub.recall).padStart(6)}`
  );
}

console.log("");
console.log("PROPOSALS BY COLUMN");
for (const facet of BENCH_FACETS) {
  const n = results.filter((row) =>
    row.extract.facets.some((claim) => claim.facet === facet)
  ).length;
  console.log(`  ${facet.padEnd(12)} ${n}`);
}

if (s.seamBreaches > 0) {
  console.log("");
  console.error(
    `${s.seamBreaches} seam breach(es). mayPrune disagreed with the case's ` +
      `role, or a venue cue survived on a frame that is not her place. That ` +
      `is a bug, not a score.`
  );
  process.exit(1);
}
