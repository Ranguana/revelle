import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

/**
 * Every seeder either runs on deploy or is named as one that does not.
 *
 * ── THE MISTAKE THIS EXISTS TO CATCH ─────────────────────────────────
 *
 * `scripts/seed-bank.mjs` was written, committed, and never ran. It was not in
 * `preDeployCommand`, so 180 authored rows, seventeen gestures and six room
 * stubs sat in the repo looking shipped while the database knew nothing about
 * them. It surfaced only as a number nobody could explain — eighteen
 * destinations in the file, thirteen on the dashboard — which flickered through
 * three separate reports before anyone traced it.
 *
 * That is the GOOD version of the failure: the repo was truth and the deploy
 * lagged. The bad version is the same shape and harder to see, because a
 * seeder that never runs raises nothing, logs nothing, and leaves a catalogue
 * that is merely smaller than it should be.
 *
 * So: a seeder is in the chain, or it is on the list below with a reason. There
 * is no third state.
 */

/**
 * Seeders that deliberately do NOT run on deploy. Each needs a reason, because
 * "it is on the list" is not one.
 */
const MANUAL: Record<string, string> = {
  "seed:fixtures":
    "invents test customers, and refuses a non-local database anyway. " +
    "render.yaml says so in its own words.",
  "seed:occasion":
    "demo occasions, same reason as fixtures.",
};

test("every seeder either runs on deploy or is listed as manual", () => {
  const pkg = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8"));
  const render = readFileSync(new URL("../../render.yaml", import.meta.url), "utf8");

  const seeders = Object.keys(pkg.scripts as Record<string, string>).filter((s) =>
    s.startsWith("seed:")
  );
  assert.ok(seeders.length > 0, "no seed:* scripts found — has package.json moved?");

  const missing = seeders.filter(
    (s) => !render.includes(`npm run ${s}`) && !(s in MANUAL)
  );
  assert.deepEqual(
    missing,
    [],
    `these seeders are in package.json, are not in render.yaml's ` +
      `preDeployCommand, and are not listed as manual — so they silently do ` +
      `not happen: ${missing.join(", ")}. Add them to the chain, or to MANUAL ` +
      `in this file with the reason.`
  );

  // The reverse: a seeder listed as manual must not also be in the chain, or
  // the list is lying about what runs.
  const contradictory = Object.keys(MANUAL).filter((s) => render.includes(`npm run ${s}`));
  assert.deepEqual(
    contradictory,
    [],
    `listed as manual and also in the deploy chain: ${contradictory.join(", ")}`
  );
});
