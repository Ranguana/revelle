/**
 * WHETHER THE CATALOGUE IN THE DATABASE IS THE CATALOGUE IN THE REPO.
 *
 * ── THE QUESTION THIS ANSWERS, AND WHY IT IS NEW ────────────────────
 *
 * The seeders used to run on every deploy. They no longer do: the
 * preDeployCommand is `npm run migrate` alone, and stocking the catalogue is a
 * deliberate act at the desk (/desk/stocked). That trade buys a visible,
 * attributable gesture and it SELLS SOMETHING REAL — CLAUDE.md rule 12's
 * safety. A seeder in the chain could not be forgotten; a seeder behind a
 * button can be.
 *
 * So the trade is only good if a stale catalogue is LOUD. This module is that
 * loudness, and it is the direct descendant of src/lib/desk/migrations.ts:
 * same split (arithmetic here, reading in catalogue-sync.ts), same four-plus
 * states, same refusal to grade what it could not read.
 *
 * ── WHY A HEAD COUNT IS NOT AN ANSWER, RESTATED FOR CONTENT ─────────
 *
 * migrations.ts learned it for schema: A HEAD CANNOT TELL YOU WHETHER THE
 * PIPELINE IS ALIVE. If nobody wrote a migration this fortnight the head is
 * the same whether the pipeline is healthy or dead since March.
 *
 * Content has the identical hole and it is wider, because content changes more
 * often than schema and NOBODY ADDS A ROW EVERY WEEK EITHER. "600 dishes" is
 * the same number whether the sync ran an hour ago or has never run against
 * this database since March. And the mirror trap: a catalogue that has not
 * CHANGED in a week is not stale — nothing may have been added. Wall-clock
 * alone would cry every Monday and teach people to ignore it, which is how a
 * banner becomes wallpaper.
 *
 * ── SO IT COMPARES CONTENT, NOT THE CLOCK ───────────────────────────
 *
 * Every seeder reads exactly one authored document or module, named beside it
 * in CATALOGUE_STEPS below. A successful sync records a sha256 of each of those
 * files as it found them. The check is then a real comparison:
 *
 *     the authored sources on THIS instance's disk
 *     versus
 *     the authored sources as the last successful sync read them
 *
 * Different → the documents moved and nothing has re-read them → STALE, and it
 * can name which files. Identical → nothing is known to be missing, however
 * long ago that sync was, and the line says so rather than implying a check it
 * is not making.
 *
 * The step list is compared the same way and for the reason the whole change
 * exists: ADD A SEEDER TOMORROW AND NOTHING RUNS IT. A sync whose recorded step
 * list is shorter than CATALOGUE_STEPS is a sync that never touched the new
 * pool, and that is stale even when every document is byte-identical.
 *
 * ── AND THE HONEST LIMIT, STATED WHERE IT IS MADE ───────────────────
 *
 * IT FINGERPRINTS THE AUTHORED SOURCES, NOT THE SEEDERS. Change
 * scripts/seed-dishes.mjs so it parses a field differently and this module will
 * still say "current": the document did not move, so nothing here can see that
 * what the document MEANS has. That is a real gap and it is named rather than
 * papered over — `detail` carries the caveat in words on every screen that
 * renders a good state. Widening the fingerprint to the seeder scripts was
 * considered and rejected: a comment edit in a 2,000-line seeder would then
 * raise the alarm, and an alarm that fires on comments is one nobody reads.
 *
 * ── PURE, AND WHY ───────────────────────────────────────────────────
 *
 * No database, no filesystem, no framework, no `@/` alias, no `server-only` —
 * so `node --test` can exercise the verdict without standing anything up, AND
 * so scripts/smoke-seeders.mjs can import CATALOGUE_STEPS directly. That second
 * reason is load-bearing: the smoke run must execute the same list the desk
 * executes, and a copy of the list would drift from the list, which is rule 12
 * wearing a different hat.
 */

import { ago } from "./migrations.ts";

/* ── the chain, as data ─────────────────────────────────────────────── */

/**
 * One seeder, and the authored thing it reads.
 *
 * `source` is repo-relative and is not decoration: it is what makes staleness
 * checkable against something real instead of against the clock, and it is what
 * the desk prints beside the step so a curator knows which document a run was
 * about. A step with no readable source would be a step this module can never
 * grade, so there is no `null` in the list today — the type allows it so that a
 * future seeder reading nothing (a derived table, a rebuild) can be added
 * without pretending it has a document.
 */
export type CatalogueStep = {
  /** The npm script, without `npm run`. */
  script: string;
  /** Extra argv, as `npm run x -- --flag` would pass it. */
  args: readonly string[];
  /** The authored file it reads, repo-relative. */
  source: string | null;
  /** Why it is here, where that is not obvious from the name. */
  why?: string;
};

/**
 * THE CATALOGUE CHAIN — the one list, and the reason there is only one.
 *
 * This was three lists: render.yaml's preDeployCommand, the STEPS constant in
 * src/app/api/desk/seed/route.ts, and whatever a person typed by hand. Two of
 * the three had already drifted when this file was written — the route's
 * comment said "exactly the preDeployCommand render.yaml carries, in order"
 * and OMITTED `seed:bank`, which is the very seeder whose absence from the live
 * service's chain cost six destinations and taught rule 12. The comment was
 * true when it was written and false by the time it mattered, which is what
 * every copied list does.
 *
 * So: one list, here, imported by the route, by the desk's control, by the CI
 * smoke run and by src/lib/deploy.test.ts, which fails if a `seed:*` script in
 * package.json is in none of the three places it may live.
 *
 * ── seed:destinations RUNS TWICE, ON PURPOSE ────────────────────────
 *
 * The menu, drink, dish and bank seeders create a DRAFT STUB for a destination
 * that has content and no authored look; seed:destinations is what completes a
 * stub once somebody writes the voice. First pass adopts what is authored, the
 * middle passes attach the content, the last pass completes anything new.
 *
 * ── WHAT IS DELIBERATELY ABSENT ─────────────────────────────────────
 *
 * seed:fixtures and seed:occasion invent test customers and refuse a non-local
 * database anyway. activate:catalogue is not here either and must never be:
 * CLAUDE.md rule 8 — a seeder produces drafts and activation is a human
 * gesture. Both are named, with their reasons, in src/lib/deploy.test.ts.
 */
export const CATALOGUE_STEPS: readonly CatalogueStep[] = [
  {
    script: "seed:destinations",
    args: [],
    source: "src/lib/destinations.ts",
    why: "the authored worlds, first, so everything after it has somewhere to hang",
  },
  { script: "seed:menus", args: [], source: "docs/menus.md" },
  { script: "seed:drinks", args: [], source: "docs/drinks.md" },
  {
    script: "seed:dishes",
    args: [],
    source: "docs/dishes.md",
    why: "650 authored lines into 600 rows — by far the longest step here",
  },
  { script: "seed:games", args: [], source: "src/lib/games.ts" },
  {
    script: "seed:bank",
    args: [],
    source: "docs/atmosphere-idea-bank-v1.md",
    why:
      "THE SEEDER THAT TAUGHT RULE 12. It sat out every deploy, and the six " +
      "draft world stubs it creates were missing from the desk with nothing " +
      "reporting it.",
  },
  {
    script: "seed:destinations",
    args: [],
    source: "src/lib/destinations.ts",
    why: "the second pass: completes a stub the four seeders above just created",
  },
];

/**
 * Every authored file the chain reads, deduped, in a fixed order.
 *
 * Derived rather than written out, so adding a step adds its document to the
 * staleness check in the same edit. A hand-kept second list is the shape
 * CLAUDE.md rule 19 warns about: correct exactly until the next entry.
 */
export const CATALOGUE_SOURCES: readonly string[] = [
  ...new Set(
    CATALOGUE_STEPS.map((step) => step.source).filter(
      (source): source is string => source !== null
    )
  ),
].sort();

/** The names of the steps, in order, with the repeat kept. What a run records. */
export function stepNames(
  steps: readonly CatalogueStep[] = CATALOGUE_STEPS
): string[] {
  return steps.map((step) => step.script);
}

/* ── the ledger's vocabulary ────────────────────────────────────────── */

/**
 * The three verbs a sync writes into `staff_action`.
 *
 * db/011's CHECK on `action` wants dotted, lower case, past tense, and db/036
 * is why a machine may write here at all. There is no run TABLE for this and
 * that is a decision, not an omission: `schema_migration_run` exists because
 * scripts/migrate.mjs runs OUTSIDE the app with no ledger to write to, and its
 * whole job is to leave a note for a process it will never meet. A sync runs
 * INSIDE the app, by a person, and the ledger is already the place the desk
 * reads "who did what". A second table would be a second answer to a question
 * db/011 answers, and the pair of rows below carries exactly what a run row
 * would: when it started, when it ended, what it did, and what failed.
 *
 * A start with no ending is therefore a sayable state — the same one
 * `schema_migration_run` calls `running`, and it goes stale the same way.
 */
export const SYNC_STARTED = "catalogue.sync_started";
export const SYNC_DONE = "catalogue.synced";
export const SYNC_FAILED = "catalogue.sync_failed";

/**
 * The system actor for a sync nobody signed for.
 *
 * POST /api/desk/seed authenticates with a token, not a session, so there is no
 * person to attribute — and db/036's CHECK ties `staff_id is null` to
 * `actor <> 'staff'` precisely so that "nobody, this mechanism" is sayable
 * without inventing a fake staff row. Distinct from `auto: pool-stocking`,
 * which is what the seeders write per ROW: this names the run, that names the
 * rows the run offered.
 */
export const SYNC_ACTOR = "auto: catalogue-sync";

/** One step's outcome, as the ledger keeps it. */
export type StepResult = {
  script: string;
  /** Process exit code. 0 is the only good one; -1 means it never started. */
  code: number;
  ms: number;
  /** The tail of stdout+stderr. Bounded — a runaway seeder must not fill a row. */
  output: string;
};

/**
 * One ledger row about a sync, read back.
 *
 * `detail` is jsonb and its shape differs per action by design (db/011), so
 * everything here is read defensively and a missing key is normal.
 */
export type SyncEvent = {
  /** `staff_action.id`, as text. */
  entry: string;
  at: Date;
  action: string;
  /** Whoever pressed it, or null when a token did. */
  who: string | null;
  /** The run id both halves of a pair share. Null in a row that predates it. */
  run: string | null;
  summary: string;
  steps: readonly StepResult[];
  /** The step names the run intended, in order. */
  planned: readonly string[];
  /** path -> sha256, as the run found them. */
  sources: Readonly<Record<string, string>>;
  /** entity_table -> rows the seeders offered during the run. */
  stocked: Readonly<Record<string, number>>;
};

/* ── the facts, as they arrive ──────────────────────────────────────── */

export type CatalogueFacts = {
  /**
   * Sync rows, newest first. `null` means the ledger could not be read — a
   * state, never a zero.
   */
  events: readonly SyncEvent[] | null;
  /**
   * The authored sources on THIS instance's disk, path -> sha256. `null` means
   * they could not be read, which is CANNOT TELL and not "unchanged".
   */
  sources: Readonly<Record<string, string>> | null;
  /** The step names this code would run now. */
  planned: readonly string[];
  now: Date;
};

export type CatalogueVerdict =
  | "current"
  | "running"
  | "stale"
  | "never"
  | "failed"
  | "unknown";

export type CatalogueState = {
  verdict: CatalogueVerdict;
  /** One line. The answer to "is the catalogue the one in the repo". */
  headline: string;
  /** Everything else worth saying, most consequential first. */
  detail: readonly string[];
  /** The permanently-visible short form, for the rail. Never empty. */
  foot: string;
  /** When the last SUCCESSFUL sync finished, if one ever has. */
  lastOk: Date | null;
  /** The newest sync event of any kind. */
  last: SyncEvent | null;
  /** Sources on disk that the last good sync did not read, or read differently. */
  changed: readonly string[];
  /** Steps this code would run that the last good sync did not. */
  unrun: readonly string[];
};

/**
 * A started sync with no ending is a sync in flight — for a while. Past this it
 * is a run that died without saying so, which is a different fact and gets
 * reported as one.
 *
 * Thirty minutes, matching RUNNING_IS_STALE_AFTER_MS in migrations.ts and
 * generous for the same reason: the route's own ceiling is five minutes
 * (`maxDuration`), a cold instance is slow, and a false "abandoned" here would
 * let a second sync start on top of a first. The advisory lock in
 * catalogue-sync.ts is what actually prevents that; this number only decides
 * when the SCREEN stops saying "running" and starts saying "nobody finished
 * this".
 */
export const RUNNING_IS_STALE_AFTER_MS = 30 * 60 * 1000;

/* ── the verdict ────────────────────────────────────────────────────── */

export function catalogueState(facts: CatalogueFacts): CatalogueState {
  const { events, sources, planned, now } = facts;

  const empty = {
    lastOk: null,
    last: null,
    changed: [] as string[],
    unrun: [] as string[],
  };

  /* ── could the two facts be read at all? ─────────────────────────── */

  if (events === null || sources === null) {
    const blind: string[] = [];
    if (events === null) {
      blind.push(
        "The ledger could not be read, so there is no way to know whether the " +
          "catalogue has ever been synced against this database. Nothing here " +
          "is a claim that it has."
      );
    }
    if (sources === null) {
      blind.push(
        "The authored sources could not be read from this process, so there " +
          "is nothing to compare a sync against. See CATALOGUE_SOURCES in " +
          "src/lib/desk/catalogue.ts for what it was looking for."
      );
    }
    return {
      ...empty,
      verdict: "unknown",
      headline: "CANNOT TELL whether the catalogue is current",
      detail: blind,
      foot: "catalogue state unknown",
    };
  }

  const last = events[0] ?? null;
  const lastGood = events.find((event) => event.action === SYNC_DONE) ?? null;
  const lastOk = lastGood ? lastGood.at : null;

  /* ── is one in flight, and has it been in flight too long? ───────── */

  const started = events.find((event) => event.action === SYNC_STARTED) ?? null;
  const unfinished =
    started !== null &&
    !events.some(
      (event) =>
        (event.action === SYNC_DONE || event.action === SYNC_FAILED) &&
        // Matched on the run id where both halves carry one, and on time
        // otherwise — a pair written before the id existed still reads.
        (started.run !== null && event.run !== null
          ? event.run === started.run
          : event.at.getTime() >= started.at.getTime())
    );

  if (unfinished && started) {
    const waiting = now.getTime() - started.at.getTime();
    const who = started.who ?? "a token";
    if (waiting <= RUNNING_IS_STALE_AFTER_MS) {
      return {
        ...empty,
        lastOk,
        last,
        verdict: "running",
        headline: `A sync started ${ago(now, started.at)}, by ${who}, and is still going.`,
        detail: [
          "The seeders take minutes and write thousands of rows. Nothing on " +
            "this screen updates itself — reload it to see where the run got to.",
          ...caveat(),
        ],
        foot: `catalogue syncing since ${ago(now, started.at)}`,
      };
    }
    return {
      ...empty,
      lastOk,
      last,
      verdict: "failed",
      headline:
        `A SYNC STARTED ${ago(now, started.at).toUpperCase()} AND NEVER ` +
        `FINISHED. Nothing recorded how it ended.`,
      detail: [
        `It was started by ${who}. A sync runs inside the web process, so an ` +
          `instance replaced mid-run — a deploy, a restart, an out-of-memory ` +
          `kill — takes its child processes with it and leaves exactly this: ` +
          `a beginning with no end.`,
        "The seeders are idempotent by construction, so running it again is " +
          "safe and is the remedy. What it wrote before it died stays written.",
        ...(lastGood
          ? [`The last sync that did finish cleanly was ${ago(now, lastGood.at)}.`]
          : ["No sync has ever finished cleanly against this database."]),
      ],
      foot: `catalogue sync DIED ${ago(now, started.at)}`,
    };
  }

  /* ── nothing in flight: what does the last ending say? ───────────── */

  if (last === null) {
    return {
      ...empty,
      verdict: "never",
      headline: "THE CATALOGUE HAS NEVER BEEN SYNCED against this database.",
      detail: [
        "The seeders no longer run on deploy — the preDeployCommand is " +
          "`npm run migrate` alone — so nothing has put the authored " +
          "catalogue into this database except a person, and nobody has.",
        `Whatever is in the pools got there some other way. ${CATALOGUE_STEPS.length} ` +
          `steps are waiting: ${[...new Set(stepNames())].join(", ")}.`,
        "Sync the catalogue is on /desk/stocked. It takes minutes.",
      ],
      foot: "catalogue NEVER SYNCED",
    };
  }

  if (last.action === SYNC_FAILED) {
    const failed = last.steps.find((step) => step.code !== 0) ?? null;
    return {
      ...empty,
      lastOk,
      last,
      verdict: "failed",
      headline:
        `THE LAST SYNC FAILED${failed ? ` at \`npm run ${failed.script}\`` : ""} — ` +
        `${ago(now, last.at)}.`,
      detail: [
        ...(failed
          ? [`\`npm run ${failed.script}\` exited ${failed.code}.`]
          : []),
        ...(last.steps.length > 0
          ? [
              `Steps that did run: ` +
                last.steps
                  .map((step) => `${step.script} (${step.code === 0 ? "ok" : step.code})`)
                  .join(", ") +
                `. A sync stops at the first failure, so anything after it did not run.`,
            ]
          : []),
        ...(lastGood
          ? [`The last sync that finished cleanly was ${ago(now, lastGood.at)}.`]
          : ["No sync has ever finished cleanly against this database."]),
      ],
      foot: `catalogue sync FAILED ${ago(now, last.at)}`,
    };
  }

  // The last thing that happened was a clean run. Now the real question.
  if (!lastGood) {
    // Reachable only if the newest row is neither a start, a failure nor a
    // success — a verb this module does not model. Named rather than guessed.
    return {
      ...empty,
      last,
      verdict: "unknown",
      headline: "CANNOT TELL: the newest sync record is a kind this screen does not know",
      detail: [
        `The ledger's newest catalogue row is \`${last.action}\`, which is ` +
          `none of \`${SYNC_STARTED}\`, \`${SYNC_DONE}\` or \`${SYNC_FAILED}\`. ` +
          `Something writes a verb this module was not told about.`,
      ],
      foot: "catalogue state unknown",
    };
  }

  const changed = compareSources(sources, lastGood.sources);
  const unrun = missingSteps(planned, lastGood.planned);

  if (changed.length > 0 || unrun.length > 0) {
    const bits: string[] = [];
    if (changed.length > 0) {
      bits.push(
        `${changed.length} authored source${changed.length === 1 ? "" : "s"} changed`
      );
    }
    if (unrun.length > 0) {
      bits.push(
        `${unrun.length} seeder${unrun.length === 1 ? "" : "s"} never ran`
      );
    }
    return {
      lastOk,
      last,
      changed,
      unrun,
      verdict: "stale",
      headline:
        `THE CATALOGUE IS STALE — ${bits.join(" and ")} since the last sync, ` +
        `${ago(now, lastGood.at)}.`,
      detail: [
        ...(changed.length > 0
          ? [
              `Changed on disk since that run read them: ${changed.join(", ")}. ` +
                `Whatever was authored into those files is not in the database.`,
            ]
          : []),
        ...(unrun.length > 0
          ? [
              `In the chain now and not in that run: ${unrun.join(", ")}. ` +
                `A seeder added since the last sync has never executed here — ` +
                `which is CLAUDE.md rule 12 exactly, moved from the deploy to ` +
                `the desk and caught rather than silent.`,
            ]
          : []),
        "Sync the catalogue is on /desk/stocked. It is idempotent: a re-run " +
          "against a current database reports 0 created, 0 updated, and a " +
          "curator's edit always outranks the file.",
        ...caveat(),
      ],
      foot: `catalogue STALE — ${bits.join(", ")}`,
    };
  }

  return {
    lastOk,
    last,
    changed,
    unrun,
    verdict: "current",
    headline: `catalogue synced ${ago(now, lastGood.at)} · sources unchanged since`,
    detail: [
      `Every one of the ${CATALOGUE_SOURCES.length} authored sources is ` +
        `byte-identical to what that run read, and the chain has not gained a ` +
        `step. Nothing is known to be missing.`,
      `THIS IS NOT A CLAIM ABOUT THE CLOCK. A sync months old is still ` +
        `current if nothing was authored since; time on its own is not ` +
        `evidence of anything and is not used as any.`,
      ...(Object.keys(lastGood.stocked).length > 0
        ? [
            `That run offered: ` +
              Object.entries(lastGood.stocked)
                .map(([table, n]) => `${n} ${table}`)
                .join(", ") +
              `.`,
          ]
        : [`That run offered nothing new, which is what a re-run looks like.`]),
      ...caveat(),
    ],
    foot: `catalogue synced ${ago(now, lastGood.at)}`,
  };
}

/**
 * THE LIMIT, PRINTED WHEREVER THE GOOD NEWS IS.
 *
 * CLAUDE.md rule 16: nothing absorbs input it does not honour. A screen that
 * says "current" is making a claim, and the claim has a shape — it is about
 * DOCUMENTS, not about seeders. Saying so beside the reassurance is the
 * difference between a check and the appearance of one.
 */
function caveat(): string[] {
  return [
    "What this compares is the authored documents. It does not fingerprint " +
      "the seeder scripts, so a change to how one of them PARSES its document " +
      "is invisible here — after editing a seeder, sync it by hand.",
  ];
}

/* ── the two comparisons ────────────────────────────────────────────── */

/**
 * Which authored sources differ from the ones the last good run read.
 *
 * Three ways to differ, and all three are staleness:
 *   · the digest moved — the document was edited;
 *   · the path is on disk and not in the record — a seeder was added, or the
 *     run predates the source being recorded at all;
 *   · the path is in the record and not on disk — a document was deleted or
 *     renamed, which is worse and is named the same way rather than ignored.
 */
export function compareSources(
  onDisk: Readonly<Record<string, string>>,
  asRead: Readonly<Record<string, string>>
): string[] {
  const paths = new Set([...Object.keys(onDisk), ...Object.keys(asRead)]);
  const out: string[] = [];
  for (const path of [...paths].sort()) {
    const now = onDisk[path];
    const then = asRead[path];
    if (now === then) continue;
    if (now === undefined) out.push(`${path} (gone from this instance)`);
    else if (then === undefined) out.push(`${path} (never read by that run)`);
    else out.push(path);
  }
  return out;
}

/**
 * Steps this code would run that the last good run did not.
 *
 * By NAME and as a set, not as a sequence: the chain contains
 * seed:destinations twice on purpose and a run that did it twice versus three
 * times is not a staleness anybody cares about. What matters is a seeder that
 * has never executed here at all.
 */
export function missingSteps(
  planned: readonly string[],
  ran: readonly string[]
): string[] {
  const done = new Set(ran);
  return [...new Set(planned)].filter((step) => !done.has(step)).sort();
}
