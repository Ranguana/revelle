/**
 * EVERY GUARD THAT CAN FIRE WITHOUT A DATABASE, FIRED.
 *
 * ── WHY THIS EXISTS ──────────────────────────────────────────────────
 *
 * Four deploys failed in one day, every one of them on a seeder guard that
 * runs BEFORE the database is contacted — a manifest count, a vocabulary
 * check, a bind-placeholder assertion. Each cost a push, a build, a failed
 * pre-deploy and a rollback to find out something a laptop could have said in
 * ten seconds.
 *
 * The seeders already do the right thing: they validate what they can from the
 * authored files, and only then reach for `DATABASE_URL`. So running them with
 * no `DATABASE_URL` at all exercises every one of those guards and stops
 * exactly at the connection. That is this whole script.
 *
 *     A CLEAN RUN MEANS: every guard that can fire without a database has
 *     fired, and none of them refused.
 *
 * It does NOT mean the deploy will succeed. §"What this cannot check" below is
 * printed on every run, pass or fail, and it is the honest half — a green
 * checkmark that implies more than it tested is worse than no checkmark,
 * because it is the one people stop reading.
 *
 * ── THE SENTINEL ─────────────────────────────────────────────────────
 *
 * A seeder that reaches the database and finds no URL exits non-zero saying
 * so. That is SUCCESS here: it means everything upstream of the connection
 * passed. A seeder that exits non-zero saying anything else has a guard that
 * fired, and that is the wedge, caught on a laptop.
 *
 * A seeder that exits ZERO is the third case and it is reported as unexpected
 * rather than as a pass: it completed without a database, which either means
 * it does nothing or means it never tried, and both are worth a person's
 * attention (rule 24 — count what it matched, and be suspicious of a checker
 * that finds nothing).
 *
 * ── THE CHAIN IS READ, NEVER LISTED ──────────────────────────────────
 *
 * From `scripts/deploy-chain.mjs`, which reads render.yaml — the same parser
 * `smoke:seeders` and `deploy.test.ts` use. A hardcoded list here would be
 * correct until the next seeder joins the chain and then wrong without being
 * broken (rule 19).
 */

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

import { deployChain, seedScripts } from "./deploy-chain.mjs";

const ROOT = new URL("../", import.meta.url).pathname;
const NO_DATABASE = /DATABASE_URL is not set/i;

const line = (s = "") => console.log(s);
const bad = (s) => console.error(s);

line("preflight — every guard that can fire without a database");
line("reading the chain from render.yaml (NOT from the live service — rule 20)");
line();

const seeders = seedScripts();
const chain = deployChain();

/*
 * THE ENVIRONMENT IS STRIPPED, NOT OVERRIDDEN.
 *
 * Setting DATABASE_URL to a bogus value would exercise a different path — the
 * seeders would try to connect and fail on DNS or a refused socket, which is
 * slow, noisy, and tests the network rather than the guards. Deleting it
 * reaches the seeders' own "not set" branch, which is the one they were
 * written to have.
 */
const env = { ...process.env };
delete env.DATABASE_URL;
delete env.SMOKE_DATABASE_URL;

let failed = 0;
let unexpected = 0;

for (const { step, name, file } of seeders) {
  if (!existsSync(`${ROOT}${file}`)) {
    bad(`  MISSING  ${step} — render.yaml runs it and ${file} does not exist`);
    failed += 1;
    continue;
  }

  const run = spawnSync(process.execPath, [file], {
    cwd: ROOT,
    env,
    encoding: "utf8",
    timeout: 120_000,
  });

  const output = `${run.stdout ?? ""}${run.stderr ?? ""}`;
  const reachedTheDatabase = NO_DATABASE.test(output);

  if (run.status === 0) {
    unexpected += 1;
    line(`  ?        ${step} — exited 0 with no database. It never tried, or it does nothing.`);
    continue;
  }
  if (reachedTheDatabase) {
    line(`  ok       ${step}`);
    continue;
  }

  failed += 1;
  bad(`  GUARD    ${step} refused before it reached the database:`);
  for (const l of output.trimEnd().split("\n").slice(-12)) bad(`             ${l}`);
  bad("");
}

/* ── what this cannot check, printed every run ────────────────────────── */

const notExercised = chain.filter((s) => !s.startsWith("seed:"));

line();
line("WHAT THIS DID NOT CHECK — read this part, it is most of the deploy:");
line(`  · ${notExercised.join(", ")} — not run here. They do their work AGAINST`);
line("    the database, so there is nothing for them to refuse without one.");
line("  · Every migration. `npm run migrate` is the first step of the chain and");
line("    this script does not run it. A migration that wedges the deploy — and");
line("    two did this week — is invisible from here.");
line("  · CLAUDE.md rule 33's whole class: a check that runs post-seed in");
line("    scratch and pre-seed in production. Nothing local can see it, because");
line("    the divergence IS the order these steps run in.");
line("  · Anything that depends on rows production already holds. This machine");
line("    has no database at all, so every count is vacuous rather than green.");
line("  · Whether the live service runs this chain. render.yaml is a blueprint");
line("    applied once and the service is not linked to it (rule 20). For the");
line("    whole life of this service the running command was `npm run migrate`");
line("    alone while this file listed eight seeders.");
line();
line("  `npm run smoke:seeders` builds a scratch database and runs the real");
line("  chain against it. That is the next check up, and it is not this one.");
line();

if (failed > 0) {
  bad(`preflight FAILED: ${failed} step(s) refused before reaching the database.`);
  bad("Every one of these would have failed the deploy after a push and a build.");
  process.exit(1);
}

if (unexpected > 0) {
  line(
    `preflight passed with ${unexpected} step(s) that exited 0 without a ` +
      `database. Worth a look; not a failure.`
  );
}

line(
  `preflight ok — ${seeders.length} seeder(s) ran every guard they have and ` +
    `stopped at the connection.`
);
