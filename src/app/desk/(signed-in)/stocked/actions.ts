"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { query } from "@/lib/db";
import { pools, type Ask, type Pool } from "@/lib/desk/publish";
import { POOL_SCREEN, revert } from "@/lib/desk/stocked";
import { recordAction, requireStaff } from "@/lib/staff";

/**
 * THE VETO.
 *
 * ── WHY THIS IS NOT publishSelected WITH A MINUS SIGN ────────────────
 *
 * The two gestures look symmetrical and are not, and the differences are all
 * in this file rather than in src/lib/desk/stocked.ts, which is where the
 * meaning of "put it back" lives.
 *
 *   · NO CONFIRMATION CHECKBOX. Publishing makes a claim to members and no
 *     script can take it back, so /desk/publish makes her re-read a sentence
 *     before she does it. Withdrawing makes no claim to anybody: the engine
 *     reads `where status = 'active'` and simply stops seeing the row. A
 *     ceremony in front of a reversible act teaches people to click through
 *     ceremonies.
 *
 *   · NOTHING IS TICKED BY DEFAULT on the screen this submits from, where
 *     /desk/publish ticks everything. Ticking everything IS the gesture there
 *     — "offer the pool" — and here the default gesture is to leave the
 *     catalogue alone. A screen whose boxes arrive ticked is a screen that
 *     proposes; this one only answers.
 *
 *   · SO THE BATCH IS ITS OWN BUTTON, not a default. "Send this whole run
 *     back" is a real thing to want — a seeder ran against the wrong document
 *     and put out forty programmes nobody wrote — and with no boxes ticked it
 *     would otherwise mean forty clicks, which is the afternoon /desk/publish
 *     was built to end. The two gestures arrive as two submit buttons on one
 *     form and are told apart by `scope`:
 *
 *       'ticked'  the `id` values, which are the boxes she ticked;
 *       'run'     the `all` values, hidden inputs carrying every row of this
 *                 run that is STILL OFFERED at render time.
 *
 *     Both are explicit lists of ids that were on the screen. There is
 *     deliberately no "everything in this pool" path that skips the list — the
 *     same rule publishSelected states for the other direction. And if `scope`
 *     ever failed to arrive, the fallback is 'ticked', which withdraws less
 *     rather than more.
 *
 *   · IT IS RECORDED WITH HER NAME ON IT, which is the entire point of the
 *     arrangement. db/036 let the ledger say "nobody, this seeder" so that the
 *     machine's act could be recorded honestly; this writes the other half, so
 *     the two sit in the same table, one under the other, and the row reads:
 *     seed-dishes offered it, she took it back.
 *
 * ── WHAT IT WILL NOT DO ──────────────────────────────────────────────
 *
 * It cannot publish, and there is no code path here that could. It cannot
 * touch `world` either: a destination is a governed class (CLAUDE.md rule 13),
 * nothing auto-publishes one, so nothing of theirs is ever in this feed to
 * revert — and `pools()` excludes `world` from the registry it returns anyway.
 */

const UUID = /^[0-9a-f-]{36}$/i;

/** `query` is exactly the shape the shared module asks for. */
const ask: Ask = query;

export async function revertStocked(form: FormData): Promise<void> {
  const staff = await requireStaff();

  const poolCode = String(form.get("pool") ?? "");
  const run = String(form.get("run") ?? "").slice(0, 200);
  const back = `/desk/stocked?pool=${encodeURIComponent(poolCode)}`;

  // Which button she pressed. Anything other than 'run' means the boxes, which
  // is the reading that withdraws less.
  const scope = String(form.get("scope") ?? "") === "run" ? "run" : "ticked";

  const ids = form
    .getAll(scope === "run" ? "all" : "id")
    .map((value) => String(value))
    .filter((value) => UUID.test(value));

  if (ids.length === 0) {
    redirect(`${back}&refused=${encodeURIComponent(NOTHING_TICKED)}`);
  }

  // Resolved against `ingredient_pool` before it reaches a query, exactly as
  // publishSelected does it: an unrecognised pool is refused rather than
  // guessed, and the identifiers this composes with come from the registry
  // rather than from the form.
  const pool = (await pools(ask)).find((entry) => entry.code === poolCode);
  if (!pool) {
    redirect(`${back}&refused=${encodeURIComponent(NO_SUCH_POOL)}`);
  }

  const done = await withdraw(pool, ids);

  if (done.error) {
    await recordAction(staff, {
      action: `${pool.code}.auto_publish_revert_refused`,
      entityTable: pool.code,
      summary: `${ids.length} refused`,
      detail: { pool: pool.code, run, scope, ids, refusal: done.error },
    });
    redirect(`${back}&refused=${encodeURIComponent(done.error)}`);
  }

  /*
   * WHAT ACTUALLY MOVED, NOT WHAT WAS ASKED FOR.
   *
   * `revert` keeps `where <active> = <activeValue>`, so a row somebody
   * discontinued between the render and the press is not in `done.names`. The
   * ledger records the returned list and the count of it beside the count she
   * ticked, because a record that claims more than it did is worse than none —
   * and the gap between the two numbers is exactly the thing a curator would
   * want to see later.
   *
   * `entityId` only when the veto was about ONE row. db/011 indexes
   * (entity_table, entity_id) so that a row's own history reads back cleanly,
   * and pinning a batch of forty to whichever id happened to be first would put
   * a lie in that index. The batch's ids are in `detail`, which is where a
   * shape that differs per action belongs.
   */
  await recordAction(staff, {
    action: `${pool.code}.auto_publish_reverted`,
    entityTable: pool.code,
    entityId: done.rows.length === 1 ? done.rows[0].id : undefined,
    summary:
      done.rows.length === 1
        ? `${done.rows[0].name} — back to draft`
        : `${done.rows.length} of ${ids.length} back to draft`,
    detail: {
      pool: pool.code,
      run,
      scope,
      asked: ids.length,
      withdrawn: done.rows.length,
      ids: done.rows.map((row) => row.id),
      names: done.rows.map((row) => row.name),
    },
  });

  // Every screen that reads a status is now stale. /desk/stocked last, and
  // certainly, because she is about to read her own receipt off it.
  if (POOL_SCREEN[pool.code]) revalidatePath(POOL_SCREEN[pool.code]);
  revalidatePath("/desk/publish");
  revalidatePath("/desk/matrix");
  revalidatePath("/desk/coverage");
  revalidatePath("/desk/stocked");

  redirect(`${back}&withdrawn=${done.rows.length}&asked=${ids.length}`);
}

/* ── the write ──────────────────────────────────────────────────────── */

type Done = { rows: { id: string; name: string }[]; error: string | null };

/**
 * The refusal is CAUGHT AND SHOWN rather than allowed to become a stack trace,
 * the same rule the publish action and the single-row status buttons state. A
 * trigger's own words are the accurate ones; rewriting them into something
 * friendlier would make them less true.
 */
async function withdraw(
  pool: Pool,
  ids: readonly string[]
): Promise<Done> {
  try {
    return { rows: await revert(ask, pool, ids), error: null };
  } catch (err) {
    const refusal = err as { message?: string; hint?: string };
    return {
      rows: [],
      error:
        [refusal?.message ?? String(err), refusal?.hint]
          .filter(Boolean)
          .join(" ") || "The database refused it and said nothing.",
    };
  }
}

const NO_SUCH_POOL =
  "Nothing was withdrawn. That pool is not in `ingredient_pool`, which is the " +
  "only list of pools this desk will act on.";

const NOTHING_TICKED =
  "Nothing was withdrawn, because nothing was ticked. Tick what should go " +
  "back to draft, or use the button that sends the whole run back.";
