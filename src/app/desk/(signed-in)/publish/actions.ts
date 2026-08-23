"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { query } from "@/lib/db";
import {
  pools,
  publish,
  publishDestinations,
  type Ask,
} from "@/lib/desk/publish";
import { POOL_SCREEN } from "@/lib/desk/stocked";
import { recordAction, requireStaff } from "@/lib/staff";

/**
 * SAYING YES, IN BULK.
 *
 * ── WHY THE RULE IS NOT WRITTEN HERE ─────────────────────────────────
 *
 * Everything about what "offered" MEANS — which pools have a draft state, that
 * only `draft` moves, that a destination without a published voice may not be
 * published at any price — lives in src/lib/desk/publish.ts, and
 * scripts/activate-catalogue.mjs calls the same functions. That is the whole
 * point of the module: the screen and the script cannot drift into two
 * definitions of the gate, which is the one thing a gate must not have.
 *
 * What is written here is the part that is genuinely about a screen: who is
 * allowed to press the button, what she was shown when she pressed it, and what
 * gets recorded about it.
 *
 * ── ONE ACTION, NOT ONE PER POOL ─────────────────────────────────────
 *
 * The pool arrives as a form value and is resolved against `ingredient_pool`
 * before it reaches a query — an unrecognised pool is refused rather than
 * guessed, exactly as matrix/actions.ts resolves a pool code. A seventh pool
 * therefore needs no edit here either.
 *
 * ── THE IDS ARE THE CONSENT ──────────────────────────────────────────
 *
 * The screen submits one id per ticked row, so what is published is what she
 * looked at and left ticked. There is deliberately no "publish everything in
 * this pool regardless of what was on screen" path: the bulk gesture that skips
 * the list is `npm run activate:catalogue -- --yes`, it still exists, and it
 * runs where nobody can see it. Here she says yes to specific things.
 *
 * A row that moved out of draft between the render and the press is simply not
 * matched — `publish` keeps `where status = 'draft'` — so a stale form is a
 * smaller receipt, never a wrong write.
 */

const UUID = /^[0-9a-f-]{36}$/i;

/** `query` is exactly the shape the shared module asks for. */
const ask: Ask = query;

export async function publishSelected(form: FormData): Promise<void> {
  const staff = await requireStaff();

  const poolCode = String(form.get("pool") ?? "");
  const back = `/desk/publish?pool=${encodeURIComponent(poolCode)}`;

  // A required checkbox in the markup, re-checked here, because a Server Action
  // is its own entry point and `required` is a courtesy the browser pays. The
  // sentence beside it is the one irreversible thing on this screen.
  if (String(form.get("confirm") ?? "") !== "on") {
    redirect(`${back}&refused=${encodeURIComponent(NOT_CONFIRMED)}`);
  }

  const ids = form
    .getAll("id")
    .map((value) => String(value))
    .filter((value) => UUID.test(value));

  if (ids.length === 0) {
    redirect(`${back}&refused=${encodeURIComponent(NOTHING_TICKED)}`);
  }

  const done =
    poolCode === "world"
      ? await destinations(ids)
      : await ingredients(poolCode, ids);

  // An unrecognised pool is refused rather than guessed — and SAID, because a
  // form action that returns quietly leaves a curator looking at a page that
  // has not changed with no way to know whether it worked.
  if (done === null) {
    redirect(`${back}&refused=${encodeURIComponent(NO_SUCH_POOL)}`);
  }

  if (done.error) {
    await recordAction(staff, {
      action: "catalogue.publish_refused",
      entityTable: poolCode,
      summary: `${ids.length} refused`,
      detail: { pool: poolCode, ids, refusal: done.error },
    });
    redirect(`${back}&refused=${encodeURIComponent(done.error)}`);
  }

  await recordAction(staff, {
    action: "catalogue.published",
    entityTable: poolCode,
    summary: `${done.names.length} offered out of ${ids.length} asked`,
    detail: { pool: poolCode, asked: ids.length, published: done.names },
  });

  // Every screen that reads a status is now stale. Listing them rather than
  // revalidating the segment because /desk/publish must be the one that is
  // certainly fresh — she is about to read her own receipt off it.
  revalidatePath("/desk/publish");
  revalidatePath("/desk/matrix");
  revalidatePath("/desk/coverage");
  if (POOL_SCREEN[poolCode]) revalidatePath(POOL_SCREEN[poolCode]);

  redirect(`${back}&published=${done.names.length}&asked=${ids.length}`);
}

/* ── the two halves of the gate ─────────────────────────────────────── */

type Done = { names: string[]; error: string | null };

/**
 * A pool out of the registry. The refusal is CAUGHT AND SHOWN, not allowed to
 * become a stack trace — the same rule setDestinationStatus and setGameStatus
 * state for the single-row buttons. A trigger's own words are the accurate
 * ones; rewriting them into something friendlier would make them less true.
 *
 * The whole batch is one statement, so a refusal means nothing was published.
 * That is the honest behaviour for a gesture that cannot be undone: a partial
 * bulk publish nobody can list is worse than none.
 */
async function ingredients(
  poolCode: string,
  ids: readonly string[]
): Promise<Done | null> {
  const pool = (await pools(ask)).find((entry) => entry.code === poolCode);
  if (!pool) return null;

  try {
    const rows = await publish(ask, pool, ids);
    return { names: rows.map((row) => row.name), error: null };
  } catch (err) {
    return { names: [], error: said(err) };
  }
}

/** Destinations. `publishDestinations` carries the voice rule; see the module. */
async function destinations(ids: readonly string[]): Promise<Done> {
  try {
    const rows = await publishDestinations(ask, ids);
    return { names: rows.map((row) => row.slug), error: null };
  } catch (err) {
    return { names: [], error: said(err) };
  }
}

/** A Postgres refusal, message and hint, verbatim. */
function said(err: unknown): string {
  const refusal = err as { message?: string; hint?: string };
  return (
    [refusal?.message ?? String(err), refusal?.hint].filter(Boolean).join(" ") ||
    "The database refused it and said nothing."
  );
}

const NOT_CONFIRMED =
  "Nothing was published. The sentence under the list has to be ticked — " +
  "no seeder can put any of this back.";

const NO_SUCH_POOL =
  "Nothing was published. That pool is not in `ingredient_pool`, which is the " +
  "only list of pools this desk will act on.";

const NOTHING_TICKED =
  "Nothing was published, because nothing was ticked. Untick what should stay " +
  "in draft, not everything.";

/*
 * The map of pool -> desk screen used to be a second copy right here, and it
 * had already drifted from the one on the screen: this one had no `bank_item`,
 * so offering a bank item left /desk/bank showing drafts that were not. It now
 * lives in src/lib/desk/stocked.ts, which is a plain module and can therefore
 * be imported by both — a `"use server"` file may only export async functions,
 * which is why neither action file could own it.
 */
