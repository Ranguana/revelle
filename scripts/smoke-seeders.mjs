#!/usr/bin/env node
/**
 * RUN THE WHOLE DEPLOY CHAIN AGAINST A SCRATCH DATABASE AND THROW IT AWAY.
 *
 *   SMOKE_DATABASE_URL=postgres://…/postgres npm run smoke:seeders
 *
 * ─────────────────────────────────────────────────────────────────────
 * WHAT THIS IS FOR — CLAUDE.md RULE 12'S COROLLARY
 *
 * Rule 12: a seeder not in `preDeployCommand` silently did not happen. The
 * corollary cost a near-miss to learn: AN UNWIRED SEEDER DOES NOT MERELY FAIL
 * TO RUN — IT SHIELDS ITS OWN BUGS FROM EVER SURFACING. scripts/seed-bank.mjs
 * carried off-by-one bind placeholders left behind when db/033 dropped a
 * column: `$7` skipped, the list running off the end at `$11`. Postgres would
 * have refused the bind on the FIRST ROW OF THE FIRST RUN with a one-line
 * error. It survived a review and a commit because the seeder was not in the
 * chain, and it was found by somebody opening the file for an unrelated
 * reason — by luck, not by process.
 *
 * So the day rule 12 landed and every seeder joined the chain, every one of
 * them became a first-run risk at once. This is the process version of the
 * luck: one execution against a real, empty, throwaway Postgres before a
 * seeder is trusted with a deploy.
 *
 * ── WHY A WHOLE DATABASE AND NOT A MOCK ──────────────────────────────
 *
 * The bugs this class of script catches are the ones only Postgres can see: a
 * bind count, an enum literal that is not in the enum, a NOT NULL nobody
 * noticed, a CHECK constraint, a foreign key to a row the seeder writes later.
 * A mock client would have accepted every one of them, including the bind skew
 * — the argument array was the right SHAPE, it was the placeholders that were
 * wrong. Only the server knows.
 *
 * ── IT RUNS WHAT THE DEPLOY RUNS, BY READING THE DEPLOY ──────────────
 *
 * The chain is parsed out of render.yaml's `preDeployCommand` rather than
 * listed here. A copy of the chain would drift from the chain, and a smoke
 * test that runs a stale list of seeders is rule 12 wearing a different hat.
 *
 * ── WHAT IT REFUSES TO DO ────────────────────────────────────────────
 *
 * It never touches DATABASE_URL. It reads SMOKE_DATABASE_URL — a server it may
 * CREATE and DROP a database on — and if that is unset it says so and exits.
 * The real database is unreachable from any laptop by design (rule 9,
 * render.yaml's ipAllowList) and must stay that way; this script would be a
 * hole in that if it took the deploy's own connection string.
 *
 * The scratch database is named `revelle_smoke_<timestamp>_<pid>` and is
 * dropped in a `finally`. `--keep` leaves it behind to be looked at, and says
 * where it is.
 *
 * ── WHERE IT ACTUALLY RUNS ───────────────────────────────────────────
 *
 * .github/workflows/smoke.yml, against a `postgres:17` service container —
 * which is why this is not a step anybody has to remember (rule 9 again, and
 * the standing constraint that no pipeline step may depend on a local
 * machine). It also runs against a local Postgres, which is how it was
 * developed and what makes it debuggable.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

import { deployChain } from "./deploy-chain.mjs";
import { fileURLToPath } from "node:url";

import pg from "pg";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const keep = process.argv.includes("--keep");

const log = (...parts) => console.log("[smoke]", ...parts);

function fail(message) {
  console.error(`\n[smoke] FAILED: ${message}`);
  process.exit(1);
}

/** Kept in sync with the same function in scripts/migrate.mjs and src/lib/db.ts. */
function needsSsl(url) {
  if (/sslmode=disable/.test(url)) return false;
  return !/@(localhost|127\.0\.0\.1|\[::1\])/.test(url);
}

/**
 * Identifiers composed into SQL come from `ingredient_pool`, which is ours —
 * but a registry row is still data, and this is the one place this script
 * builds SQL by hand. Anything that is not a plain lower-case identifier is a
 * hard stop rather than a quoted guess.
 */
function ident(name) {
  if (!/^[a-z_][a-z0-9_]*$/.test(name)) {
    throw new Error(`refusing to compose ${JSON.stringify(name)} into SQL`);
  }
  return name;
}

/* ── the chain, read from the deploy ─────────────────────────────────── */

/*
 * `deployChain` MOVED TO scripts/deploy-chain.mjs on 2026-09-08.
 *
 * It lived here and in src/lib/deploy.test.ts, and `npm run preflight` was
 * about to make three copies of one YAML parser. Rule 21: "which seeders does
 * the deploy run, in what order" has exactly one answer, and three readers
 * disagree the day somebody adds a step and only two notice. The behaviour is
 * unchanged, including its refusal to fall back to a list of its own.
 */

/* ── the scratch database ────────────────────────────────────────────── */

const admin = process.env.SMOKE_DATABASE_URL;
if (!admin) {
  fail(
    "SMOKE_DATABASE_URL is not set.\n\n" +
      "  It is a connection string for a Postgres server this script may " +
      "CREATE and DROP a\n  database on — a service container in CI, or a " +
      "local server. It is deliberately NOT\n  DATABASE_URL: the real " +
      "database is unreachable from a laptop on purpose and this\n  script " +
      "must not be the exception.\n\n" +
      "  In CI:    .github/workflows/smoke.yml sets it to the postgres " +
      "service.\n" +
      "  Locally:  SMOKE_DATABASE_URL=postgres://localhost:5432/postgres " +
      "npm run smoke:seeders"
  );
}

const scratch = `revelle_smoke_${Date.now()}_${process.pid}`;
const scratchUrl = (() => {
  const u = new URL(admin);
  u.pathname = `/${scratch}`;
  return u.toString();
})();

const server = new pg.Client({
  connectionString: admin,
  ssl: needsSsl(admin) ? { rejectUnauthorized: false } : undefined,
  application_name: "revelle-smoke",
});

let steps;
try {
  steps = deployChain();
} catch (err) {
  fail(err.message);
}

log(`chain from render.yaml: ${steps.join(" → ")}`);

await server.connect();
let created = false;
let failure = null;

try {
  // `create database` cannot run inside a transaction block, which is why this
  // is a bare statement and not part of anything larger.
  await server.query(`create database ${ident(scratch)}`);
  created = true;
  log(`scratch database ${scratch} created`);

  for (const step of steps) {
    log(`── ${step} ─────────────────────────────────────────────`);
    execFileSync("npm", ["run", step], {
      cwd: ROOT,
      stdio: "inherit",
      env: {
        ...process.env,
        // The ONE place the scratch url is handed to anything. Every seeder
        // and the migrator read DATABASE_URL and nothing else.
        DATABASE_URL: scratchUrl,
        // A child that re-entered this script would create a second scratch
        // database and drop the first one's sibling; nothing does today, and
        // this makes sure nothing starts.
        SMOKE_DATABASE_URL: "",
      },
    });
  }

  /* ── AND THEN: DOES ANY OF IT ACTUALLY REFUSE ANYTHING ────────────── */
  //
  // `check:gates` is deliberately NOT in render.yaml's chain and is run here,
  // and the reason is worth writing down because both halves are decisions.
  //
  // NOT IN THE DEPLOY: it fails when a gate holds claims and prunes nothing,
  // which is an AUTHORING gap — a catalogue too thin for a filter to bite. A
  // deploy that refuses to ship a code fix until somebody writes more drinks
  // is a deploy nobody will leave switched on.
  //
  // HERE: this is the free place to fail, the same argument the whole file
  // makes about a seeder's first run. It runs against the database the chain
  // has just built, which is the only database in existence where the question
  // "did the tagging step actually change anything" can be asked honestly.
  //
  // CLAUDE.md rule 22 asks for two guards because the two failures read
  // identically from outside — the tagger never ran, versus the tagger ran and
  // matched nothing. `tag:catalogue` above is the first; this is the second.
  log(`── check:gates ─────────────────────────────────────────`);
  execFileSync("npm", ["run", "check:gates"], {
    cwd: ROOT,
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: scratchUrl, SMOKE_DATABASE_URL: "" },
  });

  /* ── what actually landed ─────────────────────────────────────────── */

  const scratchClient = new pg.Client({
    connectionString: scratchUrl,
    ssl: needsSsl(scratchUrl) ? { rejectUnauthorized: false } : undefined,
    application_name: "revelle-smoke-read",
  });
  await scratchClient.connect();
  try {
    const { rows: pools } = await scratchClient.query(
      `select entity_table, active_column, active_value
         from ingredient_pool
        where active_column is not null
        order by entity_table`
    );

    log("── what the chain put in the catalogue ──────────────────");
    for (const pool of pools) {
      // count(*) comes back as a STRING from Postgres, every time.
      const { rows } = await scratchClient.query(
        `select count(*)::text as all_rows,
                count(*) filter (where ${ident(pool.active_column)}::text = $1)::text as live
           from ${ident(pool.entity_table)}`,
        [pool.active_value]
      );
      log(
        `  ${pool.entity_table.padEnd(12)} ${String(rows[0].all_rows).padStart(5)} rows, ` +
          `${String(rows[0].live).padStart(5)} ${pool.active_value}`
      );
    }

    const { rows: ledger } = await scratchClient.query(
      `select action, count(*)::text as n
         from staff_action
        where staff_id is null
        group by action
        order by action`
    );
    log("── what the seeders told the ledger they did ────────────");
    if (ledger.length === 0) {
      log("  nothing. If a pool seeder created rows, that is a bug: an");
      log("  auto-publish with no ledger entry is invisible to the veto.");
    }
    for (const row of ledger) {
      log(`  ${row.action.padEnd(28)} ${String(row.n).padStart(5)}`);
    }
  } finally {
    await scratchClient.end();
  }

  log("");
  log("the chain runs clean on an empty database.");
} catch (err) {
  failure = err;
} finally {
  if (created && !keep) {
    try {
      await server.query(`drop database ${ident(scratch)} with (force)`);
      log(`scratch database ${scratch} dropped`);
    } catch (err) {
      console.error(
        `[smoke] could not drop ${scratch}: ${err.message} — drop it by hand.`
      );
    }
  } else if (created) {
    log(`--keep: ${scratch} left behind. Drop it when you are done with it.`);
  }
  await server.end();
}

if (failure) {
  fail(failure.message);
}
