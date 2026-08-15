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

async function sentinelExists(client, relation) {
  const { rows } = await client.query(
    `select to_regclass($1) is not null as present`,
    [relation]
  );
  return rows[0].present;
}

async function runMigrations(client) {
  // The ledger is migration zero and cannot itself live in a migration file.
  // `if not exists` plus the advisory lock already held makes this safe on an
  // empty database and on one that has run this a hundred times.
  await client.query(`
    create table if not exists schema_migrations (
      filename    text primary key,
      applied_at  timestamptz not null default now()
    )
  `);

  const files = discoverMigrations();
  const done = await appliedFilenames(client);

  let ran = 0;
  let adopted = 0;

  for (const file of files) {
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
      adopted += 1;
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
      throw new Error(`migration ${file} failed: ${err.message}`);
    }
    console.log(`[migrate] apply    ${file}`);
    ran += 1;
  }

  console.log(
    `[migrate] ${ran} applied, ${adopted} adopted, ` +
      `${files.length - ran - adopted} already recorded`
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
try {
  // Blocks rather than failing if another deploy is mid-run. Session-level:
  // released below, or by the server the moment this connection drops.
  await client.query("select pg_advisory_lock($1::bigint)", [ADVISORY_LOCK_KEY]);
  locked = true;

  await runMigrations(client);

  console.log("[migrate] done");
} catch (err) {
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
