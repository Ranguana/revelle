#!/usr/bin/env node
/**
 * Deploy-time database migration.
 *
 *   npm run migrate
 *
 * ─────────────────────────────────────────────────────────────────────
 * WHERE THIS RUNS
 *
 * On Render, as the web service's `preDeployCommand` — see render.yaml. That
 * is not an optimisation, it is the rule this project is built around: NO STEP
 * OF THE PIPELINE MAY DEPEND ON A DEVELOPER'S MACHINE. The Render Postgres has
 * an empty ipAllowList and is unreachable from the internet, so the only place
 * a migration can be applied from is inside Render. preDeployCommand runs once
 * per deploy, after the build, before any new instance takes traffic, with the
 * service's environment (including the internal DATABASE_URL).
 *
 * A non-zero exit here FAILS THE DEPLOY. The old instance keeps serving and the
 * new code is never promoted. That is the point: code expecting a column the
 * database does not have must not ship.
 *
 * ─────────────────────────────────────────────────────────────────────
 * ORDERING RULE
 *
 * Migrations are discovered from db/ — never named on a command line, so a new
 * file cannot be forgotten in render.yaml — and applied in ascending order of
 * filename compared by UTF-16 code unit (JavaScript's `<`), NOT by locale.
 * Locale collation ignores punctuation on some systems and would reorder files
 * depending on which machine ran them.
 *
 * Every file MUST be named `NNN-description.sql` with a three-digit,
 * zero-padded prefix. Anything else ending in .sql in db/ is a hard error
 * rather than a guess — `schema.sql` sorts AFTER `002-...` lexically, which
 * would apply migrations backwards.
 *
 * ─────────────────────────────────────────────────────────────────────
 * ADOPTION RULE — a database that already has tables but no ledger
 *
 * A database that was set up by hand before this script existed would fail on
 * "relation already exists", and wired to preDeployCommand that wedges every
 * deploy forever.
 *
 * So for each migration with no ledger row we probe for a SENTINEL: an object
 * that file creates and nothing else does. If the sentinel is present the file
 * is recorded as applied without running ("adopted"); if not, it runs normally.
 * Both starting states then work — an empty database gets everything, and a
 * pre-existing one gets a ledger describing what it already has.
 *
 * This is sound because each file is applied as ONE multi-statement query,
 * which PostgreSQL wraps in an implicit transaction: a file is either fully
 * applied or not at all, so its sentinel is a reliable test for it.
 *
 * Only migrations that could predate the ledger need a sentinel. A brand new
 * migration has by definition never been applied anywhere; give it no entry and
 * it simply runs.
 *
 * ─────────────────────────────────────────────────────────────────────
 * THE RUN RECORD — WHY A LEDGER OF FILES IS NOT ENOUGH
 *
 * `schema_migrations` answers "which files are applied". It cannot answer the
 * question that actually cost this project four weeks: DID THE LAST DEPLOY'S
 * MIGRATION STEP RUN AT ALL?
 *
 * Those are not the same question, and the difference is invisible from the
 * ledger alone. If nobody wrote a migration for a fortnight, the head is
 * identical whether this script ran sixty times or zero, so a head number on
 * its own is consistent with a pipeline that has been dead since March.
 *
 * db/032 shipped an assertion that could never be true. It raised on every
 * database it touched, this script exited non-zero, and — correctly — Render
 * failed the deploy. The old instance kept serving. That is the safe outcome
 * and it was also the silent one: for weeks the running code was old, the
 * database was old, every screen agreed with itself, and the only evidence
 * lived in a deploy log nobody opens. db/033, 034, 035 and 036 never applied,
 * and seven seeders never executed, and NOTHING SAID SO.
 *
 * Here is the part that decides the design. When a deploy fails at this step,
 * THE NEW CODE NEVER SERVES. So the running instance cannot discover the
 * problem by looking at its own `db/` directory — its copy of the repo is the
 * old commit, whose newest migration is exactly the one the database is at.
 * It looks current. It is not.
 *
 * The ONE THING the failing deploy and the still-serving old instance share is
 * the database. So the failing deploy writes what it knows INTO the database,
 * on its way out:
 *
 *   schema_migration_run — one row per invocation of this script.
 *     when it started and finished, whether it ended ok or failed,
 *     the head before and after, what it applied, WHICH FILE FAILED,
 *     which migrations therefore never ran, and which deploy steps
 *     after this one therefore never ran either.
 *
 * `src/lib/desk/schema.ts` reads that row and the desk puts it on screen. That
 * is the whole channel: a deploy that dies in Render's log still reaches a
 * person, because it left a note in the only room both processes are in.
 *
 * Like the ledger, this table CANNOT live in a migration file. A database
 * wedged at db/032 would never reach db/041, so the recorder of the wedge has
 * to exist before the first migration runs. Both are bootstrapped below with
 * `create table if not exists`, under the advisory lock.
 *
 * The row is written at the START as `running` and updated at the end. A run
 * that is killed mid-flight (an instance recycled, a deploy cancelled) then
 * leaves a `running` row that never finished, which is a distinguishable state
 * rather than one that looks like "never ran".
 *
 * ─────────────────────────────────────────────────────────────────────
 * CONCURRENCY
 *
 * Two deploys (or a rollback racing a deploy) can run this simultaneously. The
 * whole run holds a session-level advisory lock, so the second process blocks
 * until the first finishes and then finds nothing to do. The lock lives on the
 * same connection as the work, so if this process dies the lock dies with the
 * session — there is no stuck-lock state to clean up by hand (which would, of
 * course, require reaching the database from a laptop).
 *
 * ─────────────────────────────────────────────────────────────────────
 * NOTE FOR FUTURE MIGRATIONS
 *
 * Each file is applied inside an explicit transaction together with its ledger
 * row, so a failure leaves no partial record. A file therefore may NOT contain
 * anything that refuses to run in a transaction — `create index concurrently`,
 * `vacuum`, `alter system`. If you need one, give it its own file and teach
 * this script to run that file unwrapped; do not quietly drop the wrapper for
 * everything.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import pg from "pg";

import { deployChain as sharedDeployChain } from "./deploy-chain.mjs";

// Resolved from this file, not from process.cwd(), so it works no matter where
// the deploy runner starts it.
const MIGRATIONS_DIR = fileURLToPath(new URL("../db/", import.meta.url));

const FILENAME_PATTERN = /^\d{3}-[a-z0-9-]+\.sql$/;

// Arbitrary but fixed. Anything else that must serialise against migrations
// has to use this same key.
const ADVISORY_LOCK_KEY = "728301994";

/**
 * Migrations that could predate the ledger, and one relation each creates.
 * Values go to to_regclass(), so they must be schema-qualified relation names.
 * See ADOPTION RULE.
 */
const SENTINELS = {
  "001-schema.sql": "public.customer",
};

/**
 * A single token nobody types by accident, on its own line in the failure
 * block. `grep REVELLE_MIGRATE_FAILED` over a Render log, a CI log or a
 * scrollback finds every failed run and nothing else.
 */
const FAIL_MARK = "REVELLE_MIGRATE_FAILED";

/**
 * The ledger and the run record — MIGRATION ZERO, both of them.
 *
 * Neither may live in a db/*.sql file: the whole point of the run record is to
 * describe a database that is wedged BEFORE reaching some file, and a recorder
 * that needs that file to have run is a recorder that is silent exactly when
 * it matters. See THE RUN RECORD at the top.
 *
 * `if not exists` plus the advisory lock already held makes both safe on an
 * empty database and on one that has run this a hundred times.
 */
const BOOTSTRAP = [
  `create table if not exists schema_migrations (
     filename    text primary key,
     applied_at  timestamptz not null default now()
   )`,
  `create table if not exists schema_migration_run (
     id                    bigserial primary key,
     started_at            timestamptz not null default now(),
     finished_at           timestamptz,
     status                text not null
                             check (status in ('running', 'ok', 'failed')),
     -- The newest db/*.sql in the REPO THAT RAN THIS. Compared against the
     -- running instance's own db/ directory, it is how a still-serving old
     -- instance learns that a newer deploy tried and did not land.
     repo_head             text,
     head_before           text,
     head_after            text,
     applied               text[] not null default '{}',
     adopted               text[] not null default '{}',
     failed_file           text,
     error                 text,
     -- The line that was missing. Not "what failed" — what NEVER RAN AS A
     -- RESULT, on both sides of the failure: the migrations behind it, and the
     -- seeders after it in preDeployCommand.
     never_ran_migrations  text[] not null default '{}',
     never_ran_steps       text[] not null default '{}'
   )`,
];

function fail(message, err) {
  console.error(`\n[migrate] FAILED: ${message}`);
  if (err) console.error(`[migrate]   ${err.message}`);
  process.exitCode = 1;
}

/**
 * Same rule as src/lib/db.ts: hosted Postgres terminates unencrypted
 * connections, a local socket has no TLS to offer. Duplicated rather than
 * imported because that module is TypeScript and marked "server-only".
 */
function needsSsl(url) {
  if (/sslmode=disable/.test(url)) return false;
  return !/@(localhost|127\.0\.0\.1|\[::1\])/.test(url);
}

function discoverMigrations() {
  const entries = readdirSync(MIGRATIONS_DIR).filter((name) =>
    name.endsWith(".sql")
  );

  const bad = entries.filter((name) => !FILENAME_PATTERN.test(name));
  if (bad.length > 0) {
    throw new Error(
      `db/ contains .sql files that are not named NNN-description.sql: ` +
        `${bad.join(", ")}. Rename them — see the ORDERING RULE at the top of ` +
        `scripts/migrate.mjs. Ordering is not guessed.`
    );
  }

  // Code-unit order, said explicitly. sort() without a comparator is already
  // code-unit order; spelling it out stops someone "fixing" it to localeCompare.
  return entries.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

async function appliedFilenames(client) {
  const { rows } = await client.query(`select filename from schema_migrations`);
  return new Set(rows.map((r) => r.filename));
}

/**
 * The highest recorded filename, by BYTE order.
 *
 * `max(filename)` would use the database's collation, and the ORDERING RULE at
 * the top of this file exists because locale collation ignores punctuation and
 * would put these files in a different order than the loop applies them in.
 * `collate "C"` is byte order, which for this filename shape is the same
 * comparison JavaScript's `<` makes. The head must be computed the same way it
 * is ordered, or the number on the desk is from a different sort than the run.
 */
async function recordedHead(client) {
  const { rows } = await client.query(
    `select filename from schema_migrations
      order by filename collate "C" desc limit 1`
  );
  return rows[0]?.filename ?? null;
}

/**
 * Every `npm run …` in render.yaml's preDeployCommand, in order — or null.
 *
 * ── THE PARSER IS SHARED NOW; THE ERROR POLICY IS NOT ────────────────
 *
 * This file carried its own copy, and said why: "the parser is duplicated from
 * that script rather than shared … smoke-seeders.mjs runs top-level code on
 * import and cannot be imported." That reason EXPIRED on 2026-09-08, when the
 * parser moved to `scripts/deploy-chain.mjs`, which has no top-level side
 * effects and exists to be imported. It was one of four copies by then.
 *
 * WHAT IS KEPT IS THIS FILE'S OWN POLICY, and it is a real difference rather
 * than a style: the shared parser THROWS when render.yaml has moved, which is
 * right for a checker whose whole job is to read the chain. It is wrong here.
 * This function is called while building a FAILURE SUMMARY, and a summary that
 * dies because it could not parse a YAML block is this file's own bug wearing
 * a smaller hat. So the throw is caught and becomes null, and the caller says
 * "deploy steps: UNKNOWN" out loud rather than omitting the section.
 */
function deployChain() {
  try {
    return sharedDeployChain();
  } catch {
    return null;
  }
}

/** Everything in the chain after `migrate` — the steps a failure here cancels. */
function stepsAfterMigrate(chain) {
  if (!chain) return null;
  const at = chain.indexOf("migrate");
  return at < 0 ? null : chain.slice(at + 1);
}

/* ── the run record ──────────────────────────────────────────────────── */

async function startRun(client, repoHead, headBefore) {
  const { rows } = await client.query(
    `insert into schema_migration_run (status, repo_head, head_before)
     values ('running', $1, $2) returning id`,
    [repoHead, headBefore]
  );
  return rows[0].id;
}

/**
 * Close the run row out.
 *
 * Wrapped so that a recorder failure can never mask the real error — and when
 * it does fail it says so, because a recorder that goes quiet is the exact bug
 * this file is fixing. If this write is lost the desk still has one signal
 * left: the previous run's age, which is why the desk shows that even when
 * everything looks fine.
 */
async function finishRun(client, runId, fields) {
  if (runId === null) return;
  try {
    await client.query(
      `update schema_migration_run
          set finished_at = now(),
              status = $2,
              head_after = $3,
              applied = $4,
              adopted = $5,
              failed_file = $6,
              error = $7,
              never_ran_migrations = $8,
              never_ran_steps = $9
        where id = $1`,
      [
        runId,
        fields.status,
        fields.headAfter ?? null,
        fields.applied ?? [],
        fields.adopted ?? [],
        fields.failedFile ?? null,
        fields.error ? String(fields.error).slice(0, 4000) : null,
        fields.neverRanMigrations ?? [],
        fields.neverRanSteps ?? [],
      ]
    );
  } catch (err) {
    console.error(
      `[migrate] COULD NOT RECORD THIS RUN (${err.message}). The desk will ` +
        `have no row for it, so the only remaining signal is that the last ` +
        `recorded run is older than this deploy. Say so out loud if you are ` +
        `reading this.`
    );
  }
}

/**
 * THE FAILURE BLOCK.
 *
 * Everything a person needs to act, in one screen, with no other file to open:
 * where the database now stands, which file refused, what is behind it, and —
 * the line that was missing when db/032 wedged the pipeline — WHICH DEPLOY
 * STEPS NEVER EXECUTED BECAUSE OF IT. Seven seeders did not run that day and
 * nothing in the log mentioned their names.
 */
function loudFailure(report, err) {
  const bar = "─".repeat(70);
  const out = [];
  const say = (line = "") => out.push(line === "" ? "[migrate]" : `[migrate] ${line}`);

  say(bar);
  say(FAIL_MARK);
  say("MIGRATION FAILED. THE DEPLOY STOPS HERE AND THE OLD CODE KEEPS SERVING.");
  say(bar);
  say(
    `database was at : ${report.headBefore ?? "(nothing recorded — empty database)"}`
  );
  say(`repo expects    : ${report.repoHead ?? "(no migrations found in db/)"}`);
  say();

  const moved = [...report.applied, ...report.adopted];
  say(
    moved.length > 0
      ? `applied this run (${moved.length}): ${moved.join(", ")}`
      : "applied this run: NOTHING — the file that failed was the first one outstanding."
  );
  say();
  say(`FAILED AT: ${report.failedFile ?? "(before any file — see the error)"}`);
  for (const line of String(err?.message ?? err).split("\n")) say(`  ${line}`);
  say();

  say(
    report.neverRanMigrations.length > 0
      ? `NEVER RAN — ${report.neverRanMigrations.length} migration(s) behind the failure:`
      : "NEVER RAN — no migrations were behind the failure."
  );
  for (const file of report.neverRanMigrations) say(`  db/${file}`);
  say();

  if (report.neverRanSteps === null) {
    say(
      "NEVER RAN — deploy steps: UNKNOWN. render.yaml's `preDeployCommand: >-`"
    );
    say(
      "  block could not be read, so this cannot name what else was cancelled."
    );
    say("  Fix that before trusting this block again.");
  } else if (report.neverRanSteps.length === 0) {
    say("NEVER RAN — deploy steps: none. `migrate` is the last step in the chain.");
  } else {
    say(
      `NEVER RAN — ${report.neverRanSteps.length} deploy step(s) after this one, ` +
        `from render.yaml:`
    );
    for (const step of report.neverRanSteps) say(`  npm run ${step}`);
    say("  Every one of those is a seeder. None of them executed.");
  }

  say();
  say("This is recorded in schema_migration_run and will appear at /desk on");
  say("the instance that is still serving. Nobody has to be watching this log.");
  say(bar);

  console.error(`\n${out.join("\n")}\n`);
}

async function sentinelExists(client, relation) {
  const { rows } = await client.query(
    `select to_regclass($1) is not null as present`,
    [relation]
  );
  return rows[0].present;
}

/**
 * Apply what is outstanding, filling `report` as it goes.
 *
 * The report is a parameter rather than a return value because the CAUGHT case
 * is the one that has to be complete: when this throws, the caller still needs
 * what had already been applied and what was left behind. A function that only
 * describes its successes has nothing to say on the day it matters.
 */
async function runMigrations(client, files, report) {
  const done = await appliedFilenames(client);

  for (const [index, file] of files.entries()) {
    if (done.has(file)) {
      console.log(`[migrate] skip     ${file} (already applied)`);
      continue;
    }

    const sentinel = SENTINELS[file];
    if (sentinel && (await sentinelExists(client, sentinel))) {
      await client.query(
        `insert into schema_migrations (filename) values ($1)
         on conflict (filename) do nothing`,
        [file]
      );
      console.log(
        `[migrate] adopt    ${file} (${sentinel} already exists — recorded, not re-run)`
      );
      report.adopted.push(file);
      continue;
    }

    const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
    try {
      await client.query("begin");
      await client.query(sql);
      // Same transaction as the DDL: a failure anywhere leaves neither the
      // schema change nor the ledger row.
      await client.query(`insert into schema_migrations (filename) values ($1)`, [
        file,
      ]);
      await client.query("commit");
    } catch (err) {
      try {
        await client.query("rollback");
      } catch {
        // A failed rollback is not the error worth reporting.
      }
      report.failedFile = file;
      // Everything behind the failure that is not already recorded. This is
      // the "what never ran because of it" list, and it is computed here
      // rather than guessed at by the reader of a log.
      report.neverRanMigrations = files
        .slice(index + 1)
        .filter((name) => !done.has(name));
      throw new Error(`migration ${file} failed: ${err.message}`);
    }
    console.log(`[migrate] apply    ${file}`);
    report.applied.push(file);
  }

  console.log(
    `[migrate] ${report.applied.length} applied, ${report.adopted.length} adopted, ` +
      `${files.length - report.applied.length - report.adopted.length} already recorded`
  );
}

const url = process.env.DATABASE_URL;
if (!url) {
  fail(
    "DATABASE_URL is not set. On Render this comes from the database's " +
      "connectionString via render.yaml; there is no local default by design."
  );
  process.exit(1);
}

const client = new pg.Client({
  connectionString: url,
  ssl: needsSsl(url) ? { rejectUnauthorized: false } : undefined,
  connectionTimeoutMillis: 30_000,
  application_name: "revelle-migrate",
});

try {
  await client.connect();
} catch (err) {
  fail("could not connect to DATABASE_URL", err);
  process.exit(1);
}

let locked = false;
let runId = null;

/**
 * What this invocation did, whatever way it ends. Populated as the run goes so
 * that the failure path has a complete story rather than a stack trace.
 */
const report = {
  repoHead: null,
  headBefore: null,
  applied: [],
  adopted: [],
  failedFile: null,
  neverRanMigrations: [],
  neverRanSteps: stepsAfterMigrate(deployChain()),
};

try {
  // Blocks rather than failing if another deploy is mid-run. Session-level:
  // released below, or by the server the moment this connection drops.
  await client.query("select pg_advisory_lock($1::bigint)", [ADVISORY_LOCK_KEY]);
  locked = true;

  for (const ddl of BOOTSTRAP) await client.query(ddl);

  const files = discoverMigrations();
  report.repoHead = files.at(-1) ?? null;
  report.headBefore = await recordedHead(client);
  runId = await startRun(client, report.repoHead, report.headBefore);

  await runMigrations(client, files, report);

  const headAfter = await recordedHead(client);
  await finishRun(client, runId, {
    status: "ok",
    headAfter,
    applied: report.applied,
    adopted: report.adopted,
  });

  console.log(
    `[migrate] head is now ${headAfter ?? "(none)"}; repo expects ` +
      `${report.repoHead ?? "(none)"}`
  );
  console.log("[migrate] done");
} catch (err) {
  loudFailure(report, err);
  await finishRun(client, runId, {
    status: "failed",
    headAfter: await recordedHead(client).catch(() => null),
    applied: report.applied,
    adopted: report.adopted,
    failedFile: report.failedFile,
    error: err.message,
    neverRanMigrations: report.neverRanMigrations,
    // null (chain unreadable) is not the same as [] (nothing after migrate).
    // The column cannot hold null, so the unreadable case is written as the
    // sentinel below rather than as an empty list that would read as "nothing
    // was cancelled" — which is a claim this run cannot make.
    neverRanSteps:
      report.neverRanSteps === null
        ? ["(render.yaml unreadable — this run cannot say what else was cancelled)"]
        : report.neverRanSteps,
  });
  fail(err.message);
} finally {
  try {
    if (locked) {
      await client.query("select pg_advisory_unlock($1::bigint)", [
        ADVISORY_LOCK_KEY,
      ]);
    }
  } catch {
    // Losing the unlock is harmless — ending the session drops it.
  }
  await client.end();
}
