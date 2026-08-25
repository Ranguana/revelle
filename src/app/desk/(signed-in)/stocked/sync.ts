"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";

import {
  CATALOGUE_SOURCES,
  SYNC_DONE,
  SYNC_FAILED,
  SYNC_STARTED,
  stepNames,
} from "@/lib/desk/catalogue";
import {
  IN_FLIGHT_FOR_MS,
  callSeedRoute,
  isAbandoned,
  openRun,
  syncEvents,
} from "@/lib/desk/catalogue-sync";
import { recordAction, requireStaff } from "@/lib/staff";

/**
 * SYNC THE CATALOGUE — the gesture that replaced a side effect.
 *
 * ── WHY THIS EXISTS AT ALL ───────────────────────────────────────────
 *
 * The seeders used to ride along in `preDeployCommand`, because the database
 * has an empty ipAllowList and that chain was the only thing that ran inside
 * Render's private network on its own. It cost us: the live service's command
 * had drifted from render.yaml and omitted `seed:bank` entirely, so six
 * destinations were missing from the desk for weeks while every check in the
 * repo stayed green — CLAUDE.md rule 20. The command is now `npm run migrate`
 * alone, schema stays coupled to code as it must be, and content sync became
 * this: a deliberate act, by a person, that lands in the ledger.
 *
 * ── WHY IT WRITES TWO ROWS AND NOT ONE ───────────────────────────────
 *
 * A start row goes in BEFORE the route is called and an ending row after. A
 * single row written at the end would be honest only about runs that finish:
 * the interesting failure is a sync that begins and never returns — the
 * seeders are child processes of the route, so a lost request does not stop
 * them — and one row cannot describe that, because the row is never written.
 * Two rows make "started, still going" a sayable state instead of silence,
 * which is rule 16 applied to our own machinery.
 *
 * ── CONCURRENCY ──────────────────────────────────────────────────────
 *
 * Refused while a start has no ending, unless that start is old enough to be a
 * corpse (`isAbandoned`). The refusal is not decoration: the seeders are
 * idempotent about rows but two concurrent runs interleave their output, and a
 * feed that cannot tell which run wrote what is a feed that has to be believed
 * rather than read. This is an advisory guard, not a lock — two clicks in the
 * same second can both pass it. That is acceptable and the alternative is not:
 * a real lock would need a row nobody can clear when a process dies, which is
 * the corpse problem again with a worse ending.
 */
export async function syncCatalogue(): Promise<void> {
  const staff = await requireStaff();

  const before = await syncEvents();
  if (before) {
    const open = openRun(before);
    if (open && !isAbandoned(open, new Date())) {
      // Not an error and not silence: the feed already shows the open run, so
      // saying nothing here would look like this press did nothing at all.
      await recordAction(staff, {
        action: SYNC_FAILED,
        entityTable: "ingredient_pool",
        // The age is IN the sentence, because "already running" with no number
        // is the same shape as "old enough to be a corpse" with no number: a
        // threshold doing load-bearing work that nobody can check. A reader
        // must be able to see the age and the cutoff and judge for themselves
        // whether the guard is calibrated.
        summary:
          `Refused: a sync started ${minutes(open.at)} minute(s) ago and has ` +
          `not reported back. A run is only treated as abandoned after ` +
          `${Math.round(IN_FLIGHT_FOR_MS / 60_000)} minutes.`,
        detail: {
          refused: "already running",
          run: open.run,
          startedAt: open.at.toISOString(),
          ageMinutes: minutes(open.at),
          abandonedAfterMinutes: Math.round(IN_FLIGHT_FOR_MS / 60_000),
        },
      });
      revalidatePath("/desk/stocked");
      return;
    }
  }

  const run = randomUUID();

  await recordAction(staff, {
    action: SYNC_STARTED,
    entityTable: "ingredient_pool",
    summary: "Catalogue sync started.",
    detail: { run, planned: stepNames(), sources: CATALOGUE_SOURCES },
  });

  const outcome = await callSeedRoute();

  if (outcome.kind === "ok") {
    const failed = outcome.steps.filter((step) => step.code !== 0);
    await recordAction(staff, {
      action: failed.length === 0 ? SYNC_DONE : SYNC_FAILED,
      entityTable: "ingredient_pool",
      summary:
        failed.length === 0
          ? `Catalogue synced — ${outcome.steps.length} step(s) ran.`
          : `Catalogue sync finished with ${failed.length} failed step(s).`,
      detail: { run, steps: outcome.steps },
    });
  } else {
    await recordAction(staff, {
      action: SYNC_FAILED,
      entityTable: "ingredient_pool",
      // The kind is in the summary because the five kinds each need a
      // different next move, and "sync failed" sends everybody to the logs.
      summary: `Catalogue sync ${outcome.kind}: ${outcome.message}`,
      detail: {
        run,
        kind: outcome.kind,
        message: outcome.message,
        steps: "steps" in outcome ? outcome.steps : [],
      },
    });
  }

  revalidatePath("/desk/stocked");
  revalidatePath("/desk/dishes");
  revalidatePath("/desk/bank");
  revalidatePath("/desk/destinations");
}

/** Whole minutes since `at`, for a sentence rather than a calculation. */
function minutes(at: Date): number {
  return Math.max(0, Math.round((Date.now() - at.getTime()) / 60_000));
}
