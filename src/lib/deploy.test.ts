import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";

import { deployChain } from "../../scripts/deploy-chain.mjs";
import { CATALOGUE_CHAIN, POST_SEED_STEP } from "./desk/seed-chain.ts";

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
/**
 * THE DEPLOY CHAIN, PARSED ONCE.
 *
 * Three tests below ask a question of it, and three parsers of one file would
 * be three answers the day the file's shape changes. Same rule this file
 * enforces on seeders, applied to itself.
 *
 * It THROWS rather than returning an empty chain when the block is missing,
 * because "no steps found" and "the file moved" must not be the same value: a
 * test that silently compares against nothing passes forever.
 */
/*
 * EXTRACTED 2026-09-08. The parser that used to live here is now
 * `scripts/deploy-chain.mjs`, and this test is a consumer of it.
 *
 * It was written twice — here and in `scripts/smoke-seeders.mjs` — and a third
 * copy was about to be written for `npm run preflight`. Rule 21's narrow test:
 * MUST TWO SURFACES AGREE ABOUT THIS? They must. "Which seeders does the deploy
 * run, in what order" has one answer, and three readers of one YAML block
 * disagree on the day somebody adds a step and only two of them notice.
 *
 * THE GUARD STILL GOES THROUGH THE CONSUMER, which is the half of rule 21 that
 * usually gets skipped: this test drives the shared parser the way the deploy
 * drives it and asserts against the chain's real content, so a parser that
 * started returning nothing would fail here rather than pass by comparing
 * itself to itself.
 */

test("migrate runs on deploy, and runs before every seeder", () => {
  const chain = deployChain();

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

/* ── the two chains, and the drift between them ──────────────────────── */

/**
 * THE DEPLOY AND THE SYNC BUTTON RUN THE SAME STEPS, IN THE SAME ORDER.
 *
 * ── THE DRIFT THIS CAUGHT ON THE DAY IT WAS WRITTEN ─────────────────
 *
 * `src/app/api/desk/seed/route.ts` carried its own array of steps under the
 * comment "Exactly the preDeployCommand render.yaml carries, in order". It
 * stopped being exact on 2026-08-23, when `seed:bank` entered render.yaml and
 * never entered the array. For four days, pressing SYNC at /desk/stocked
 * stocked a catalogue with 180 bank rows, seventeen gestures and six draft room
 * stubs missing from it, and nothing anywhere said so — the deploy and the
 * button simply produced different databases.
 *
 * That is CLAUDE.md rule 20 one layer in (a list that describes what runs is
 * not what runs) and rule 21 exactly (two surfaces that must agree, each
 * holding its own copy of the answer). The list now lives once, in
 * ./desk/seed-chain.ts, and this compares it with the YAML — because those two
 * genuinely cannot be one object, and rule 21's remedy when they cannot is a
 * guard that goes through both consumers.
 *
 * `migrate` is excluded by name rather than by position: the deploy runs it and
 * the button deliberately does not, because a schema change belongs to a deploy
 * where a non-zero exit keeps the old instance serving. The exclusion is stated
 * in seed-chain.ts as the reason, not merely done here as a slice.
 */
test("the deploy chain and the sync button's chain are the same list", () => {
  const fromYaml = deployChain().filter((step) => step !== "migrate");
  const fromModule = CATALOGUE_CHAIN.map((step) => step[0]);

  assert.deepEqual(
    fromModule,
    fromYaml,
    `render.yaml's preDeployCommand and CATALOGUE_CHAIN in ` +
      `src/lib/desk/seed-chain.ts name different steps, or the same steps in a ` +
      `different order.\n  render.yaml: ${fromYaml.join(" → ")}\n  the button:  ` +
      `${fromModule.join(" → ")}\nOne of the two callers is stocking a ` +
      `database the other one is not. This is exactly how seed:bank came to be ` +
      `in the deploy and not in the button for four days.`
  );
});

/**
 * ANYTHING COMPUTED OVER CONTENT RUNS AFTER CONTENT EXISTS — rule 22, asserted.
 *
 * The post-seed tagging step is in the chain, and it is LAST. Both halves fail
 * silently if they are wrong, which is why they are here rather than trusted:
 *
 *   NOT IN THE CHAIN AT ALL is rule 12's failure with a new name.
 *   `ingredient_requirement` stays empty, `venueEligibility()` prunes nothing,
 *   no drink is season-gated, and every screen agrees with itself.
 *
 *   IN THE CHAIN BUT NOT LAST is the founding defect wearing a different hat.
 *   A tagger that runs before `seed:drinks` derives nothing from drinks it
 *   cannot see, which is precisely how db/020 and db/033 came to tag an empty
 *   database on every build for weeks — and, exactly as there, it would exit
 *   zero and report success.
 */
test("the post-seed tagging step is in the chain, and runs after every seeder", () => {
  const chain = deployChain();
  const steps = CATALOGUE_CHAIN.map((step) => step[0]);

  assert.ok(
    chain.includes(POST_SEED_STEP),
    `render.yaml's preDeployCommand does not run \`${POST_SEED_STEP}\`. The ` +
      `venue requirement tags and \`drink.season_strict\` are derived from ` +
      `authored content, so nothing else writes them — and a gate nobody wrote ` +
      `claims for is a gate that filters nothing, silently, on every build.`
  );
  assert.equal(
    chain[chain.length - 1],
    POST_SEED_STEP,
    `\`${POST_SEED_STEP}\` is not the last step of preDeployCommand — ` +
      `\`${chain[chain.length - 1]}\` is. It computes over seeded content, so a ` +
      `seeder after it writes rows it never saw. That is CLAUDE.md rule 22, ` +
      `which this step exists because of.`
  );
  assert.equal(
    steps[steps.length - 1],
    POST_SEED_STEP,
    `\`${POST_SEED_STEP}\` is not the last step of the sync button's chain.`
  );

  const pkg = JSON.parse(
    readFileSync(new URL("../../package.json", import.meta.url), "utf8")
  );
  assert.ok(
    POST_SEED_STEP in (pkg.scripts as Record<string, string>),
    `\`${POST_SEED_STEP}\` is in the deploy chain and is not a script in ` +
      `package.json. \`npm run\` would fail the deploy — which is the loud ` +
      `outcome, but it would fail it in Render rather than here.`
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

test("THE DEPLOY CHAIN HAS ONE PARSER, and every surface reads it", () => {
  /*
   * Rule 21's guard has to go through the consumers, and the bypass it exists
   * to catch is somebody writing a fourth copy next month — which by
   * definition does not call the shared function. So this looks for the
   * SHAPE of the parser rather than for calls to it: any file that finds
   * `preDeployCommand` in render.yaml by itself is a second authority on what
   * the deploy runs.
   *
   * It was three copies before this test existed — here, smoke-seeders, and
   * one about to be written for preflight.
   */
  const root = new URL("../../", import.meta.url).pathname;
  const OWNER = "scripts/deploy-chain.mjs";

  const suspects = [
    ...readdirSync(`${root}scripts`)
      .filter((f) => f.endsWith(".mjs"))
      .map((f) => `scripts/${f}`),
    "src/lib/deploy.test.ts",
  ];

  const parsers = suspects.filter((file) => {
    const source = readFileSync(`${root}${file}`, "utf8");
    /*
     * THE PARSER'S OWN SIGNATURE, not the word.
     *
     * The first version of this test matched `preDeployCommand:\s*>-`
     * anywhere in the file, and flagged `scripts/migrate.mjs` twice: once
     * correctly, for a real fourth copy, and once after that copy was removed
     * — because migrate PRINTS the string "render.yaml's `preDeployCommand:
     * >-`" in its failure summary. A detector that cannot tell a parser from
     * a sentence about a parser is rule 24's matching problem exactly.
     *
     * So it looks for the anchored line-regex only a parser writes.
     */
    return source.includes("^\\s*preDeployCommand");
  });

  assert.deepEqual(
    parsers,
    [OWNER],
    `these files parse render.yaml's preDeployCommand themselves. There may ` +
      `be exactly one, and it is ${OWNER} — anything else is a second answer ` +
      `to "what does the deploy run", and the two disagree the day a step is ` +
      `added and only one of them is updated.`
  );

  // AND THE OWNER ACTUALLY WORKS, driven the way its consumers drive it, so
  // this cannot pass by the parser having been deleted.
  const chain = deployChain();
  assert.ok(chain.length >= 5, `the shared parser returned ${chain.length} steps`);
  assert.equal(chain[0], "migrate");
});
