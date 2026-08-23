/**
 * WHERE THE DATABASE IS, AGAINST WHERE THE CODE THINKS IT SHOULD BE.
 *
 * ── THE QUESTION THIS ANSWERS ───────────────────────────────────────
 *
 * "Is production current?" — asked by a person looking at a screen, answered
 * in one line, without opening a deploy log or a psql prompt (which, per rule
 * 9 and render.yaml's empty ipAllowList, nobody has anyway).
 *
 * It cost four weeks to learn that this needs asking. db/032 carried an
 * assertion that could never be true; `npm run migrate` raised on it, and
 * because migrate is the FIRST step of preDeployCommand, every deploy after it
 * failed before a single seeder ran. Render did the right thing — the deploy
 * failed, the old instance kept serving — and the right thing was completely
 * silent. It surfaced weeks later as the wrong number of destinations on a
 * dashboard.
 *
 * ── WHY A HEAD NUMBER ALONE IS NOT AN ANSWER ────────────────────────
 *
 * Three separate facts have to agree, and each covers a hole in the others.
 *
 *   1. THE LEDGER — `schema_migrations`, which has existed all along. It says
 *      which files are applied. It cannot say whether anything ran recently:
 *      if nobody wrote a migration this fortnight, the head is the same
 *      whether the pipeline is healthy or has been dead since March.
 *
 *   2. THIS INSTANCE'S db/ DIRECTORY — what the code now serving expects. It
 *      turns a head into a verdict: "at db/036, repo has db/040, FOUR BEHIND"
 *      is an answer; "db/036" is a fact nobody can grade.
 *
 *   3. THE RUN RECORD — `schema_migration_run`, written by scripts/migrate.mjs
 *      (see THE RUN RECORD in its header). This is the one that catches the
 *      db/032 shape, and nothing else can.
 *
 * Fact 3 deserves its argument spelled out, because fact 2 looks sufficient
 * and is not. WHEN A DEPLOY FAILS AT THE MIGRATION STEP, THE NEW CODE NEVER
 * SERVES. The instance answering this question is the OLD commit. Its db/
 * directory ends at exactly the migration the database is at, so facts 1 and 2
 * agree perfectly and the verdict is a confident, wrong "current". The only
 * witness to the failure is the failing deploy itself, and the only thing it
 * shares with the instance still serving is the database. So it leaves a row
 * there on its way out, and this module reads it.
 *
 * ── FOUR STATES, AND THE FOURTH IS THE IMPORTANT ONE ────────────────
 *
 *   current   nothing outstanding, and the last run finished cleanly.
 *   behind    files in db/ that the ledger has never seen.
 *   failed    the last recorded run failed, or started and never finished.
 *   unknown   one of the three facts could not be read.
 *
 * `unknown` is loud, not quiet. A monitor that answers "current" when it
 * cannot actually tell is the exact bug being fixed here — a loudness
 * mechanism that goes silent when it breaks is worse than none, because it
 * spends the trust it has not earned. CLAUDE.md rule 16: nothing absorbs input
 * it does not honour. This module refuses to grade what it could not read.
 *
 * ── PURE, AND WHY ───────────────────────────────────────────────────
 *
 * No database, no filesystem, no framework — the same split drift.ts makes,
 * for the same reason: the comparison is where the mistakes live, so it has to
 * be testable without standing anything up. `src/lib/desk/schema.ts` does the
 * reading and hands values in here.
 */

/* ── the facts, as they arrive ──────────────────────────────────────── */

/** One row of `schema_migration_run`. See scripts/migrate.mjs. */
export type MigrationRun = {
  /** 'running' | 'ok' | 'failed'. Anything else is treated as unreadable. */
  status: string;
  started_at: string;
  finished_at: string | null;
  /** The newest db/*.sql in the repo THAT RAN IT — not necessarily this one. */
  repo_head: string | null;
  head_before: string | null;
  head_after: string | null;
  failed_file: string | null;
  error: string | null;
  never_ran_migrations: readonly string[];
  never_ran_steps: readonly string[];
};

export type AppliedRow = { filename: string; applied_at: string };

export type SchemaFacts = {
  /**
   * Every db/*.sql on THIS instance's disk, ascending. `null` means the
   * directory could not be read — which is a state, not a zero.
   */
  repoFiles: readonly string[] | null;
  /** The ledger, ascending. `null` means it could not be read. */
  applied: readonly AppliedRow[] | null;
  /** The newest run row, or null. */
  lastRun: MigrationRun | null;
  /**
   * True when `schema_migration_run` does not exist at all — a database that
   * has never been touched by a migrate.mjs new enough to record runs.
   * Distinguished from "the table is there and empty" because the remedies
   * differ, and because a state nobody named is a state somebody guesses at.
   */
  runsUnavailable: boolean;
  now: Date;
};

export type Verdict = "current" | "behind" | "failed" | "unknown";

export type SchemaState = {
  verdict: Verdict;
  /** One line, sized to be read at a glance. The answer to the question. */
  headline: string;
  /** Everything else worth saying, most consequential first. */
  detail: readonly string[];
  /** Ledger head, e.g. `036-pool-content-stocks-itself.sql`. */
  head: string | null;
  headAt: string | null;
  /** Newest file in THIS instance's db/. */
  repoHead: string | null;
  /** In db/ here, absent from the ledger. */
  pending: readonly string[];
  /** Pending files that sort BELOW the head: a hole, not a lag. Worse. */
  gaps: readonly string[];
  lastRun: MigrationRun | null;
  /** The permanently-visible short form, for the rail. Never empty. */
  foot: string;
};

/**
 * A run that says `running` and has not finished is a run in flight — for
 * about a minute. Past this it is a run that died without saying so, which is
 * a different fact and gets reported as one. Generous, because a cold Render
 * instance applying forty files is slow and a false alarm here would teach
 * people to ignore the banner.
 */
const RUNNING_IS_STALE_AFTER_MS = 30 * 60 * 1000;

/* ── small shared shapes ────────────────────────────────────────────── */

/**
 * `040-tahiti-begins-in-daylight.sql` → `db/040`.
 *
 * The number is the name everyone actually uses — commit messages, CLAUDE.md
 * and render.yaml all say "db/032" — so the desk says it too. A filename in a
 * banner is a string to parse; `db/032` is a thing you can already picture.
 */
export function migrationLabel(filename: string | null | undefined): string {
  if (!filename) return "—";
  const m = /^(\d{3})-/.exec(filename);
  return m ? `db/${m[1]}` : filename;
}

/** Byte order, the order migrate.mjs applies in. Never localeCompare. */
function byCodeUnit(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * "4 minutes ago". Coarse on purpose — the only decisions taken from this are
 * "just now" versus "that is not this deploy", and a seconds-accurate figure
 * invites somebody to work to it.
 */
export function ago(now: Date, then: Date | string | null): string {
  if (!then) return "never";
  const at = typeof then === "string" ? new Date(then) : then;
  if (Number.isNaN(at.getTime())) return "at an unreadable time";

  const ms = now.getTime() - at.getTime();
  if (ms < 0) return "in the future (check the clocks)";
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} days ago`;
}

/* ── the verdict ────────────────────────────────────────────────────── */

export function schemaState(facts: SchemaFacts): SchemaState {
  const { repoFiles, applied, lastRun, runsUnavailable, now } = facts;

  const repoSorted = repoFiles ? [...repoFiles].sort(byCodeUnit) : null;
  const repoHead = repoSorted?.at(-1) ?? null;

  const ledger = applied
    ? [...applied].sort((a, b) => byCodeUnit(a.filename, b.filename))
    : null;
  const top = ledger?.at(-1) ?? null;
  const head = top?.filename ?? null;
  const headAt = top?.applied_at ?? null;

  const appliedSet = new Set(ledger?.map((r) => r.filename) ?? []);
  const pending =
    repoFiles && ledger ? repoFiles.filter((f) => !appliedSet.has(f)).sort(byCodeUnit) : [];
  const gaps = head ? pending.filter((f) => byCodeUnit(f, head) < 0) : [];

  const base = { head, headAt, repoHead, pending, gaps, lastRun };

  /* ── could we read the three facts at all? ───────────────────────── */

  const blind: string[] = [];
  if (repoFiles === null) {
    blind.push(
      "The db/ directory could not be read from this process, so there is no " +
        "way to know what the running code expects. Nothing here is a claim " +
        "that the database is fine."
    );
  }
  if (applied === null) {
    blind.push(
      "The schema_migrations ledger could not be read, so there is no way to " +
        "know what has been applied."
    );
  }
  if (blind.length > 0) {
    return {
      ...base,
      verdict: "unknown",
      headline: "CANNOT TELL whether the database is current",
      detail: [...blind, ...runNarrative(lastRun, runsUnavailable, repoHead, now)],
      foot: "schema position unknown",
    };
  }

  /* ── the run record ──────────────────────────────────────────────── */

  const runLines = runNarrative(lastRun, runsUnavailable, repoHead, now);
  const behindLines = pendingNarrative(pending, gaps);

  const runFailed =
    lastRun !== null &&
    (lastRun.status === "failed" ||
      (lastRun.status === "running" &&
        lastRun.finished_at === null &&
        now.getTime() - new Date(lastRun.started_at).getTime() >
          RUNNING_IS_STALE_AFTER_MS));

  if (runFailed && lastRun) {
    const at = lastRun.failed_file
      ? ` at ${migrationLabel(lastRun.failed_file)}`
      : "";
    const when = ago(now, lastRun.started_at);
    return {
      ...base,
      verdict: "failed",
      headline:
        lastRun.status === "failed"
          ? `THE LAST MIGRATION RUN FAILED${at} — ${when}. ` +
            `The database is at ${migrationLabel(head)}.`
          : `A MIGRATION RUN STARTED ${when} AND NEVER FINISHED. ` +
            `The database is at ${migrationLabel(head)}.`,
      detail: [...runLines, ...behindLines],
      foot: `${migrationLabel(head)} · migrate FAILED ${when}`,
    };
  }

  // No usable run record. The ledger and db/ may agree perfectly and still be
  // hiding a deploy that has been failing for a fortnight, so this is not a
  // pass — it is an admission.
  if (lastRun === null || (lastRun.status !== "ok" && lastRun.status !== "running")) {
    return {
      ...base,
      verdict: "unknown",
      headline: "CANNOT TELL when the database was last migrated",
      detail: [...runLines, ...behindLines],
      foot: `${migrationLabel(head)} · no migration run recorded`,
    };
  }

  const ran = `migrate ran ${ago(now, lastRun.started_at)}`;

  if (pending.length > 0) {
    const n = pending.length;
    return {
      ...base,
      verdict: "behind",
      headline:
        `at ${migrationLabel(head)} · repo has ${migrationLabel(repoHead)} · ` +
        `${n} MIGRATION${n === 1 ? "" : "S"} BEHIND`,
      detail: [...behindLines, ...runLines],
      foot: `${migrationLabel(head)} of ${migrationLabel(repoHead)} · ${ran}`,
    };
  }

  return {
    ...base,
    verdict: "current",
    headline: `at ${migrationLabel(head)} · repo has ${migrationLabel(repoHead)} · current`,
    detail: runLines,
    foot: `${migrationLabel(head)} · ${ran}, ok`,
  };
}

/* ── the two narrations ─────────────────────────────────────────────── */

function pendingNarrative(
  pending: readonly string[],
  gaps: readonly string[]
): string[] {
  const lines: string[] = [];
  if (pending.length > 0) {
    lines.push(
      `Never applied: ${pending.map(migrationLabel).join(", ")}. ` +
        `The code now serving expects all of them.`
    );
  }
  if (gaps.length > 0) {
    // A hole in the middle is not a lag — somebody deleted a ledger row, or a
    // migration was added below the head after the fact. Named separately
    // because the remedy is different and because "N behind" hides it.
    lines.push(
      `A HOLE, NOT A LAG: ${gaps.map(migrationLabel).join(", ")} sort below the ` +
        `head and are still unapplied. Migrations are meant to be a prefix; ` +
        `this database has one with a gap in it.`
    );
  }
  return lines;
}

function runNarrative(
  run: MigrationRun | null,
  runsUnavailable: boolean,
  repoHead: string | null,
  now: Date
): string[] {
  if (runsUnavailable) {
    return [
      "No run has ever been recorded: this database has no " +
        "schema_migration_run table, so scripts/migrate.mjs has not run " +
        "against it since the run recorder was added. Until it does, the only " +
        "thing knowable here is which files are in the ledger — not whether " +
        "the pipeline is alive.",
    ];
  }
  if (run === null) {
    return [
      "The run table exists and is empty. No invocation of npm run migrate " +
        "has completed against this database.",
    ];
  }

  const lines: string[] = [];

  if (run.status === "failed") {
    lines.push(
      `The run started ${ago(now, run.started_at)} and failed` +
        (run.failed_file ? ` at ${migrationLabel(run.failed_file)}.` : ".")
    );
    if (run.error) lines.push(run.error);
    if (run.never_ran_migrations.length > 0) {
      lines.push(
        `Never ran because of it: ` +
          run.never_ran_migrations.map(migrationLabel).join(", ") +
          "."
      );
    }
    if (run.never_ran_steps.length > 0) {
      // THE LINE THAT WAS MISSING. db/032's failure cancelled seven seeders
      // and nothing anywhere named them.
      //
      // A step in parentheses is not a step: it is migrate.mjs saying it could
      // not read render.yaml's chain and therefore cannot name what else was
      // cancelled. Rendered verbatim rather than dressed up as `npm run (…)`,
      // because an admission that reads like a command is worse than either.
      lines.push(
        `Deploy steps cancelled by it: ` +
          run.never_ran_steps
            .map((s) => (s.startsWith("(") ? s : `npm run ${s}`))
            .join(", ") +
          (run.never_ran_steps.some((s) => s.startsWith("("))
            ? ""
            : ". None of those executed.")
      );
    }
  } else if (run.status === "running") {
    lines.push(`A migration run has been in flight since ${ago(now, run.started_at)}.`);
  } else {
    lines.push(
      `Last run: ${ago(now, run.started_at)}, ok, ending at ` +
        `${migrationLabel(run.head_after)}.`
    );
  }

  /*
   * THE CROSS-INSTANCE SIGNAL, and the reason the run record exists at all.
   *
   * `repo_head` is the newest migration in the repo that RAN migrate. If that
   * is newer than the newest file this instance has on disk, a later commit
   * has been through here — and since a successful deploy would have replaced
   * this instance with that commit, the fact that it did not means the deploy
   * did not complete. This is the only way an old instance can find out it is
   * old.
   */
  if (
    run.repo_head &&
    repoHead &&
    byCodeUnit(run.repo_head, repoHead) > 0
  ) {
    lines.push(
      `That run was deploying a repo whose newest migration is ` +
        `${migrationLabel(run.repo_head)}. This instance is running code whose ` +
        `newest is ${migrationLabel(repoHead)} — so a NEWER DEPLOY REACHED THE ` +
        `DATABASE AND DID NOT REPLACE THIS PROCESS. The code you are looking ` +
        `at is not the code that was being shipped.`
    );
  }

  return lines;
}
