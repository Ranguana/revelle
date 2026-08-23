import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
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

/* ── the step the seeders all stand on ───────────────────────────────── */

/**
 * `migrate` runs, and runs FIRST.
 *
 * ── THE MISTAKE THIS EXISTS TO CATCH, WHICH IS RULE 12's SIBLING ────
 *
 * Rule 12 catches a seeder that is not in the chain. It has nothing to say
 * about the step every other step depends on. db/032 shipped an assertion that
 * could never be true; `npm run migrate` raised on it; and because migrate is
 * the first link of an `&&` chain, SEVEN SEEDERS NEVER EXECUTED. Four
 * migrations never applied. The deploy failed, correctly and silently, and the
 * discovery four weeks later was a destination count that looked wrong.
 *
 * Two things are asserted, and the second is the interesting one:
 *
 *   · migrate is in the chain at all. Take it out and the seeders would run
 *     happily against last month's schema, which is a worse failure than the
 *     one above because it does not stop.
 *
 *   · migrate is FIRST. A seeder that runs before the migration that gives it
 *     its columns fails on a real database and passes on a fresh one, which is
 *     the flavour of bug that survives review. The order is not a style
 *     preference — it is the reason a failed migration cancels the seeders
 *     rather than letting them write into a schema that has not moved.
 */
test("migrate runs on deploy, and runs before every seeder", () => {
  const render = readFileSync(new URL("../../render.yaml", import.meta.url), "utf8");
  const start = render
    .split("\n")
    .findIndex((line) => /^\s*preDeployCommand:\s*>-\s*$/.test(line));
  assert.ok(
    start >= 0,
    "render.yaml has no `preDeployCommand: >-` block. If the deploy chain " +
      "moved, this test has to be told where it went — it must never fall " +
      "back to assuming there is one."
  );

  const lines = render.split("\n");
  const indent = (line: string) => line.length - line.trimStart().length;
  const base = indent(lines[start]);
  const chain: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (line.trim() === "") break;
    if (indent(line) <= base) break;
    const m = /npm run ([A-Za-z0-9:_-]+)/.exec(line);
    if (m) chain.push(m[1]);
  }

  assert.ok(chain.length > 0, "preDeployCommand names no `npm run` steps");
  assert.equal(
    chain[0],
    "migrate",
    `preDeployCommand starts with \`${chain[0]}\`, not \`migrate\`. Every ` +
      `seeder after it writes into whatever schema the database happens to ` +
      `have; the migration is what makes that schema the one the code expects.`
  );
  assert.equal(
    chain.filter((step) => step === "migrate").length,
    1,
    "migrate appears more than once in the chain. It is idempotent, so this " +
      "is not dangerous — but it means somebody has a theory about ordering " +
      "that is not written down."
  );
});

/**
 * Every db/*.sql is named the way the runner insists on.
 *
 * scripts/migrate.mjs already refuses to guess at an ordering it cannot read,
 * and throws on a badly-named file. That check runs at DEPLOY TIME, where
 * failing is expensive and — as db/032 proved — quiet. This is the same check
 * a commit earlier, in `npm test`, where failing is free. Same rule the
 * seeders' smoke run follows: move the first execution to the cheapest place
 * it can happen.
 */
test("every migration is named NNN-description.sql, so its order is not a guess", () => {
  const dir = new URL("../../db/", import.meta.url);
  const bad = readdirSync(dir)
    .filter((name) => name.endsWith(".sql"))
    .filter((name) => !/^\d{3}-[a-z0-9-]+\.sql$/.test(name));
  assert.deepEqual(
    bad,
    [],
    `db/ contains .sql files that scripts/migrate.mjs will refuse: ` +
      `${bad.join(", ")}. See its ORDERING RULE — \`schema.sql\` sorts after ` +
      `\`002-…\`, which would apply migrations backwards.`
  );

  const numbers = readdirSync(dir)
    .filter((name) => /^\d{3}-/.test(name))
    .map((name) => name.slice(0, 3));
  const duplicates = numbers.filter((n, i) => numbers.indexOf(n) !== i);
  assert.deepEqual(
    duplicates,
    [],
    `two migrations share a number: ${duplicates.join(", ")}. Both would ` +
      `apply, in an order decided by the rest of the filename, which is not ` +
      `an order anybody chose.`
  );
});
