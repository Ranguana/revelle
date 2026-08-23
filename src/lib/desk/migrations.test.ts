import assert from "node:assert/strict";
import test from "node:test";

import {
  ago,
  migrationLabel,
  schemaState,
  type MigrationRun,
  type SchemaFacts,
} from "./migrations.ts";

/**
 * THE VERDICT, TESTED WITHOUT A DATABASE.
 *
 * Each case below is a real failure this project has had or would have had.
 * The one that matters most is "a failed deploy is invisible to the instance
 * still serving" — that is db/032, and it is the case where every other signal
 * agrees on the wrong answer.
 */

const NOW = new Date("2026-08-23T12:00:00Z");

const REPO_40 = [
  "001-schema.sql",
  "032-the-bank-joins-the-view.sql",
  "033-one-venue-vocabulary.sql",
  "036-pool-content-stocks-itself.sql",
  "040-tahiti-begins-in-daylight.sql",
];

function appliedThrough(files: readonly string[], at = "2026-08-23T11:58:00Z") {
  return files.map((filename) => ({ filename, applied_at: at }));
}

function okRun(over: Partial<MigrationRun> = {}): MigrationRun {
  return {
    status: "ok",
    started_at: "2026-08-23T11:58:00Z",
    finished_at: "2026-08-23T11:58:20Z",
    repo_head: "040-tahiti-begins-in-daylight.sql",
    head_before: "040-tahiti-begins-in-daylight.sql",
    head_after: "040-tahiti-begins-in-daylight.sql",
    failed_file: null,
    error: null,
    never_ran_migrations: [],
    never_ran_steps: [],
    ...over,
  };
}

function facts(over: Partial<SchemaFacts> = {}): SchemaFacts {
  return {
    repoFiles: REPO_40,
    applied: appliedThrough(REPO_40),
    lastRun: okRun(),
    runsUnavailable: false,
    now: NOW,
    ...over,
  };
}

test("db/040 → db/040, a fresh clean run: current", () => {
  const state = schemaState(facts());
  assert.equal(state.verdict, "current");
  assert.match(state.headline, /db\/040/);
  assert.match(state.headline, /current/);
  assert.match(state.foot, /db\/040/);
  assert.deepEqual(state.pending, []);
});

test("the founder's question, answered in the headline: N behind", () => {
  const applied = appliedThrough(REPO_40.slice(0, 3)); // through db/033
  const state = schemaState(facts({ applied }));
  assert.equal(state.verdict, "behind");
  // "at db/033 · repo has db/040 · 2 MIGRATIONS BEHIND"
  assert.match(state.headline, /at db\/033/);
  assert.match(state.headline, /repo has db\/040/);
  assert.match(state.headline, /2 MIGRATIONS BEHIND/);
  assert.deepEqual(state.pending, [
    "036-pool-content-stocks-itself.sql",
    "040-tahiti-begins-in-daylight.sql",
  ]);
});

test("one outstanding migration is singular, because a plural there reads as a bug", () => {
  const applied = appliedThrough(REPO_40.slice(0, 4));
  const state = schemaState(facts({ applied }));
  assert.match(state.headline, /1 MIGRATION BEHIND/);
});

/**
 * db/032, exactly. The instance answering is the OLD commit: its db/ stops at
 * 032 and the ledger stops at 032, so the head-versus-repo comparison is a
 * confident "current". Only the run record knows better.
 */
test("a failed deploy is caught even though this instance's db/ agrees with the ledger", () => {
  const oldRepo = REPO_40.slice(0, 2); // 001, 032 — the commit still serving
  const state = schemaState(
    facts({
      repoFiles: oldRepo,
      applied: appliedThrough(oldRepo, "2026-08-01T09:00:00Z"),
      lastRun: okRun({
        status: "failed",
        started_at: "2026-08-04T09:00:00Z",
        finished_at: "2026-08-04T09:00:04Z",
        repo_head: "040-tahiti-begins-in-daylight.sql",
        head_before: "032-the-bank-joins-the-view.sql",
        head_after: "032-the-bank-joins-the-view.sql",
        failed_file: "033-one-venue-vocabulary.sql",
        error: "migration 033 failed: column b.venue does not exist",
        never_ran_migrations: ["036-pool-content-stocks-itself.sql"],
        never_ran_steps: ["seed:destinations", "seed:bank"],
      }),
    })
  );

  assert.equal(state.verdict, "failed");
  // Nothing is pending from this instance's point of view — which is the trap.
  assert.deepEqual(state.pending, []);
  assert.match(state.headline, /FAILED at db\/033/);

  const detail = state.detail.join("\n");
  assert.match(detail, /NEWER DEPLOY REACHED THE DATABASE/);
  assert.match(detail, /db\/040/);
  // The line that was missing when this actually happened.
  assert.match(detail, /npm run seed:bank/);
  assert.match(detail, /None of those executed/);
});

test("a run that started and never finished is not the same as no run", () => {
  const state = schemaState(
    facts({
      lastRun: okRun({
        status: "running",
        started_at: "2026-08-23T09:00:00Z",
        finished_at: null,
      }),
    })
  );
  assert.equal(state.verdict, "failed");
  assert.match(state.headline, /NEVER FINISHED/);
});

test("a run in flight right now is not an alarm", () => {
  const state = schemaState(
    facts({
      lastRun: okRun({
        status: "running",
        started_at: "2026-08-23T11:59:00Z",
        finished_at: null,
      }),
    })
  );
  assert.equal(state.verdict, "current");
});

/**
 * The self-test the brief demands: a loudness mechanism that goes quiet when
 * IT breaks is the bug being fixed. Every unreadable fact must produce
 * `unknown`, never `current`.
 */
test("an unreadable db/ directory is UNKNOWN, never current", () => {
  const state = schemaState(facts({ repoFiles: null }));
  assert.equal(state.verdict, "unknown");
  assert.match(state.headline, /CANNOT TELL/);
  assert.match(state.detail.join("\n"), /db\/ directory could not be read/);
});

test("an unreadable ledger is UNKNOWN, never current", () => {
  const state = schemaState(facts({ applied: null }));
  assert.equal(state.verdict, "unknown");
});

test("no run record at all is UNKNOWN, even when the ledger matches db/", () => {
  const state = schemaState(facts({ lastRun: null, runsUnavailable: true }));
  assert.equal(state.verdict, "unknown");
  assert.match(state.headline, /CANNOT TELL when/);
  assert.match(state.detail.join("\n"), /schema_migration_run/);
});

test("a status this code does not understand is UNKNOWN, not assumed benign", () => {
  const state = schemaState(facts({ lastRun: okRun({ status: "partial" }) }));
  assert.equal(state.verdict, "unknown");
});

/**
 * A ledger row deleted by hand, or a migration inserted below the head after
 * the fact. "N behind" would hide it, so it gets its own sentence.
 */
test("a hole below the head is named as a hole, not counted as a lag", () => {
  const applied = appliedThrough([
    "001-schema.sql",
    "032-the-bank-joins-the-view.sql",
    "040-tahiti-begins-in-daylight.sql",
  ]);
  const state = schemaState(facts({ applied }));
  assert.equal(state.verdict, "behind");
  assert.deepEqual(state.gaps, [
    "033-one-venue-vocabulary.sql",
    "036-pool-content-stocks-itself.sql",
  ]);
  assert.match(state.detail.join("\n"), /A HOLE, NOT A LAG/);
});

test("an empty database with nothing applied reads as behind, not as current", () => {
  const state = schemaState(facts({ applied: [] }));
  assert.equal(state.verdict, "behind");
  assert.match(state.headline, /5 MIGRATIONS BEHIND/);
});

test("the head is compared by byte order, the order migrate applies in", () => {
  // Deliberately shuffled input: the state must not depend on arrival order.
  const shuffled = [...REPO_40].reverse();
  const state = schemaState(
    facts({ repoFiles: shuffled, applied: appliedThrough(shuffled) })
  );
  assert.equal(state.head, "040-tahiti-begins-in-daylight.sql");
  assert.equal(state.repoHead, "040-tahiti-begins-in-daylight.sql");
});

test("migrationLabel says what everyone else says", () => {
  assert.equal(migrationLabel("032-the-bank-joins-the-view.sql"), "db/032");
  assert.equal(migrationLabel(null), "—");
  assert.equal(migrationLabel("schema.sql"), "schema.sql");
});

test("ago is coarse, and says so rather than guessing", () => {
  assert.equal(ago(NOW, null), "never");
  assert.equal(ago(NOW, "2026-08-23T11:59:40Z"), "just now");
  assert.equal(ago(NOW, "2026-08-23T11:56:00Z"), "4 minutes ago");
  assert.equal(ago(NOW, "2026-08-04T12:00:00Z"), "19 days ago");
  assert.equal(ago(NOW, "not a date"), "at an unreadable time");
});
