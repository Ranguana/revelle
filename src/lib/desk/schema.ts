import "server-only";

import { readdirSync } from "node:fs";
import { join } from "node:path";

import { query } from "@/lib/db";
import { schemaState, type MigrationRun, type SchemaState } from "@/lib/desk/migrations";

/**
 * THE THREE FACTS, FETCHED. The arithmetic is next door in migrations.ts —
 * same split as drift.ts, for the same reason: comparison is where mistakes
 * live and it has to be testable without standing anything up.
 *
 * ── THE ONE RULE THIS MODULE OBEYS ──────────────────────────────────
 *
 * IT NEVER THROWS, AND IT NEVER PRETENDS.
 *
 * Those are two halves of one rule and both are load-bearing. It never throws
 * because it runs in the desk's layout, on every screen: a monitor that can
 * take the tool down is a monitor somebody removes. It never pretends because
 * an unreadable fact reported as a zero is precisely the failure it was built
 * to catch — a loudness mechanism that goes silent when it breaks spends trust
 * it has not earned. So every catch here returns `null` for the fact it could
 * not get, and migrations.ts turns that into a loud `unknown` rather than a
 * quiet pass. CLAUDE.md rule 16.
 */

/**
 * The migration files THIS PROCESS has on disk — what the running code
 * expects, not what any repo elsewhere contains.
 *
 * ── WHY THE DIRECTORY IS READ AND NOT A GENERATED LIST ──────────────
 *
 * A committed constant of migration filenames would be one more thing to
 * regenerate, and the day somebody adds db/041 without regenerating it, the
 * monitor reports "current" about a database that is a migration behind. That
 * is this bug with a new coat on. The directory cannot go stale.
 *
 * ── AND WHY IT IS ALLOWED TO FAIL ───────────────────────────────────
 *
 * render.yaml's startCommand is `npm run start`, i.e. `next start` from the
 * repo root, so db/ is on disk beside the build and `process.cwd()` finds it.
 * If that ever stops being true — a standalone output, a different working
 * directory, a slimmed image — this returns null and the desk says CANNOT
 * TELL in large letters. It does not guess, and it does not fall back to a
 * hardcoded list that would be wrong quietly.
 */
function repoMigrations(): string[] | null {
  try {
    const files = readdirSync(join(process.cwd(), "db"))
      .filter((name) => /^\d{3}-[a-z0-9-]+\.sql$/.test(name))
      .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    // An empty db/ is not a readable-and-empty repo; it is a directory that is
    // not the one we meant. Treated as unreadable.
    return files.length > 0 ? files : null;
  } catch {
    return null;
  }
}

/** Postgres `undefined_table`. The table is absent, not the database broken. */
function isMissingTable(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { code?: string }).code === "42P01"
  );
}

async function ledger(): Promise<{ filename: string; applied_at: string }[] | null> {
  try {
    return await query<{ filename: string; applied_at: string }>(
      `select filename, applied_at from schema_migrations`
    );
  } catch {
    // Missing table and unreachable database are both "cannot tell" here, and
    // both are already loud: a database this process cannot read has bigger
    // problems than its head, and every other screen is about to say so.
    return null;
  }
}

async function lastRun(): Promise<{ run: MigrationRun | null; unavailable: boolean }> {
  try {
    const rows = await query<MigrationRun>(
      `select status,
              started_at,
              finished_at,
              repo_head,
              head_before,
              head_after,
              failed_file,
              error,
              never_ran_migrations,
              never_ran_steps
         from schema_migration_run
        order by id desc
        limit 1`
    );
    return { run: rows[0] ?? null, unavailable: false };
  } catch (err) {
    // The table is created by scripts/migrate.mjs itself — see THE RUN RECORD
    // in its header — so its absence means migrate has not run against this
    // database since the recorder existed. A real, nameable state.
    return { run: null, unavailable: isMissingTable(err) };
  }
}

/**
 * Where the database stands, in one value, safe to render anywhere.
 *
 * Read live on every desk request rather than cached. A cached answer to "is
 * the pipeline alive" is an answer from a moment that has passed, and the
 * whole point is to be current about currency. It is two indexed reads and a
 * readdir of forty entries.
 */
export async function schemaPosition(): Promise<SchemaState> {
  const [applied, runs] = await Promise.all([ledger(), lastRun()]);
  return schemaState({
    repoFiles: repoMigrations(),
    applied,
    lastRun: runs.run,
    runsUnavailable: runs.unavailable,
    now: new Date(),
  });
}
