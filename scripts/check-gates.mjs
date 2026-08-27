#!/usr/bin/env node
/**
 * DOES ANY OF IT ACTUALLY REFUSE ANYTHING — the gate detector.
 *
 *   npm run check:gates              report, and exit non-zero if a gate is inert
 *   npm run check:gates -- --report  report only, always exit 0
 *
 * The other half of `npm run tag:catalogue`. That one says WHAT WAS WRITTEN;
 * this one says WHETHER ANY OF IT FIRES, and the two are separate commands
 * because they catch different lies. CLAUDE.md rule 22:
 *
 *   "…a build test that FAILS IF THE DERIVED TABLE IS EMPTY after a full
 *    build, and a detector for A GATE THAT PRUNES ZERO ROWS ACROSS THE WHOLE
 *    CATALOGUE. The first catches the tagger never running; the second catches
 *    it running and matching nothing, which reads identically from the outside
 *    and is why one guard is not enough."
 *
 * ── AND THE THIRD SECTION, WHICH IS THE ONE TO READ ──────────────────
 *
 * A gate that matches everything filters nothing; a gate that matches nothing
 * filters to ZERO, and that reaches a member as a package with no drink in it.
 * ROOM × OCCASION below enumerates every pair whose drink pool comes back
 * empty. The founder asked for it before the occasion gate goes live, and it is
 * an authoring brief rather than a diagnostic: every line is a room somebody
 * has to write a bar for.
 *
 * Same connection rules as scripts/migrate.mjs. Needs DATABASE_URL.
 */
import pg from "pg";

import { gateReport, inertGates, WATCHED_POOL } from "../src/lib/catalogue/gates.ts";

/** Kept in sync with the same function in scripts/migrate.mjs and src/lib/db.ts. */
function needsSsl(url) {
  if (/sslmode=disable/.test(url)) return false;
  return !/@(localhost|127\.0\.0\.1|\[::1\])/.test(url);
}

const reportOnly = process.argv.includes("--report");

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("\n[check-gates] FAILED: DATABASE_URL is not set.");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: url,
  ssl: needsSsl(url) ? { rejectUnauthorized: false } : undefined,
  application_name: "revelle-check-gates",
});

await client.connect();

let report = null;
let failure = null;
try {
  report = await gateReport(client);
} catch (err) {
  failure = err instanceof Error ? err.message : String(err);
} finally {
  await client.end().catch(() => {});
}

if (failure !== null) {
  console.error(`\n[check-gates] FAILED: ${failure}`);
  process.exit(1);
}

const pad = (n) => String(n).padStart(6);

console.log(`\n══ WHAT IS HELD ══════════════════════════════════════════════`);
console.log(`  ingredient_requirement`);
for (const [code, n] of Object.entries(report.holdings.venueRequirements)) {
  console.log(`    ${pad(n)}  ${code}`);
}
if (report.holdings.venueRequirementRows === 0) console.log(`    ${pad(0)}  (empty)`);
console.log(
  `    ${pad(report.holdings.venueRequirementRows)}  in all, plus ` +
    `${report.holdings.worldRequirements} destination(s) declaring one`
);
console.log(`  season_strict, over ACTIVE rows`);
for (const [pool, n] of Object.entries(report.holdings.seasonStrict)) {
  console.log(`    ${pad(n)}  ${pool}`);
}
console.log(`  occasion claims`);
for (const [pool, n] of Object.entries(report.holdings.occasionClaims)) {
  console.log(`    ${pad(n)}  ${pool}_occasion`);
}

console.log(`\n══ WHAT IS REFUSED ═══════════════════════════════════════════`);
console.log(
  `  These are (row × everything a host can say) pairs across the WHOLE active`
);
console.log(`  catalogue, not one evening. A zero here is a gate that cannot fire.\n`);
console.log(`  venue     ${pad(report.prunes.venue)} refusals`);
for (const [code, n] of Object.entries(report.prunes.venueByRequirement)) {
  console.log(`              ${pad(n)}  on ${code}`);
}
for (const [environment, n] of Object.entries(report.prunes.venueByEnvironment)) {
  if (n > 0) console.log(`              ${pad(n)}  in ${environment}`);
}
console.log(`  season    ${pad(report.prunes.season)} refusals`);
for (const [band, n] of Object.entries(report.prunes.seasonByBand)) {
  if (n > 0) console.log(`              ${pad(n)}  when she says ${band}`);
}
console.log(`  occasion  ${pad(report.prunes.occasion)} refusals`);
for (const [pool, n] of Object.entries(report.prunes.occasionByPool)) {
  console.log(`              ${pad(n)}  in ${pool}`);
}

console.log(`\n══ ROOM × OCCASION, FOR THE ${WATCHED_POOL.toUpperCase()} POOL ═══════════════════════`);
console.log(
  `  ${report.rooms} rooms × ${report.occasions.length} occasions = ` +
    `${report.pairs} pairs that draw a ${WATCHED_POOL}.`
);
if (report.zeros.length === 0) {
  console.log(`  Every pair has something to pour.`);
} else {
  console.log(`  ${report.zeros.length} land at ZERO:\n`);
  const byRoom = new Map();
  for (const zero of report.zeros) {
    const list = byRoom.get(zero.worldSlug) ?? [];
    list.push(zero);
    byRoom.set(zero.worldSlug, list);
  }
  for (const [slug, list] of byRoom) {
    console.log(
      `  ${slug} (${list[0].worldStatus}) — ${list.length}/` +
        `${report.occasions.length}: ${list.map((z) => z.occasion).join(", ")}`
    );
    console.log(`      ${list[0].reason}`);
    const vetoed = list.filter((z) => z.roomNotOffered).map((z) => z.occasion);
    if (vetoed.length > 0) {
      console.log(
        `      (not a catalogue gap at ${vetoed.join(", ")}: the destination ` +
          `itself is vetoed there)`
      );
    }
  }
}

console.log(`\n══ THE OTHER TWO AXES, SAME POOL ═════════════════════════════`);
console.log(
  `  Rooms that hold a ${WATCHED_POOL} at all, against every room she can be ` +
    `standing in\n  (${report.environments.length}) and every season she can ` +
    `state (${report.seasons.length}). One axis at a time, so a zero names\n  ` +
    `the gate that caused it.\n`
);
for (const [label, list] of [
  ["venue", report.venueZeros],
  ["season", report.seasonZeros],
]) {
  if (list.length === 0) {
    console.log(
      `  ${label.padEnd(7)} no room is emptied by this gate alone. It can ` +
        `thin a pool; it cannot\n          empty one, because no room's whole ` +
        `${WATCHED_POOL} pool carries the same claim.`
    );
    continue;
  }
  console.log(`  ${label.padEnd(7)} ${list.length} room × answer pair(s) at ZERO:`);
  for (const zero of list) {
    console.log(`            ${zero.worldSlug} in ${zero.answer} — ${zero.reason}`);
  }
}

if (report.thinRooms.length > 0) {
  console.log(
    `\n  THIN, AND THEREFORE FRAGILE — rooms holding three ${WATCHED_POOL}s or ` +
      `fewer. Any claim\n  written onto one of these can take a room to zero at ` +
      `an occasion in one edit:`
  );
  for (const room of report.thinRooms) {
    console.log(`    ${String(room.held).padStart(2)}  ${room.slug}`);
  }
}

const inert = inertGates(report);
console.log(`\n══ VERDICT ═══════════════════════════════════════════════════`);
if (inert.length === 0) {
  console.log(`  Every gate holds claims and refuses something. None is inert.`);
} else {
  for (const line of inert) console.log(`  INERT — ${line}`);
}

if (inert.length > 0 && !reportOnly) process.exit(1);
