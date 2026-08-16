"use server";

import { revalidatePath } from "next/cache";

import { query, transaction } from "@/lib/db";
import { pools } from "@/lib/desk/connections";
import { recordAction, requireStaff } from "@/lib/staff";

/**
 * ONE CELL, THREE STATES, AND ALL THREE ROUND-TRIP.
 *
 * The instruction arrives as one form value — `pool:entityId:worldId:state` —
 * because the grid is a single form with several hundred buttons in it and a
 * form per cell would be several hundred forms. A submit button's name and
 * value carry the whole instruction, which is what they are for.
 *
 * ── WHAT "NEITHER" DOES, AND WHY IT IS NOT A DELETE ──────────────────
 *
 * `neither` means "this row makes no claim and states no veto". It does NOT
 * mean "forget everything anybody ever said about this pair": a curator may
 * have set an affinity of +0.4 with the note "wet paint on a porch in a heat
 * wave — the house would allow it", and that is a weight, and a weight survives
 * having the claim taken off it. So the row is deleted only when the two
 * booleans were the whole of what it said. Anything carrying a weight or a
 * sentence is kept, with both flags cleared.
 *
 * The desk's menu and drink forms used to get this wrong in the other
 * direction — they deleted every row not in their checkbox list, including
 * forbidden rows they could not see, so saving a menu silently dropped its
 * vetoes. Both are corrected in their own actions.ts; this screen was written
 * so that the correction has somewhere to be visible.
 *
 * ── TWO STATEMENTS, ONE TRANSACTION ──────────────────────────────────
 *
 * The delete and the update must not half-happen: a crash between them would
 * leave a cell reading `forbidden` after somebody asked for `neither`.
 */

const STATES = new Set(["native", "forbidden", "neither"]);
const UUID = /^[0-9a-f-]{36}$/i;

export async function setConnection(form: FormData): Promise<void> {
  const staff = await requireStaff();

  const [poolCode, entityId, worldId, state] = String(form.get("cell") ?? "").split(
    ":"
  );
  if (!STATES.has(state)) return;
  if (!UUID.test(entityId ?? "") || !UUID.test(worldId ?? "")) return;

  // The pool is resolved against `ingredient_pool`, the registry the migrations
  // write, so the table names composed below are this codebase's identifiers
  // and never a request's. An unrecognised pool is refused rather than guessed.
  const pool = (await pools()).find((entry) => entry.code === poolCode);
  if (!pool) return;

  const { worldTable } = pool;
  const idColumn = `${pool.code}_id`;

  const name = await ingredientName(pool.code, entityId);

  await transaction(async (client) => {
    if (state === "neither") {
      await client.query(
        `delete from ${worldTable}
          where ${idColumn} = $1 and world_id = $2
            and affinity = 0 and coalesce(note, '') = ''`,
        [entityId, worldId]
      );
      await client.query(
        `update ${worldTable} set forbidden = false, native = false
          where ${idColumn} = $1 and world_id = $2`,
        [entityId, worldId]
      );
      return;
    }

    const forbidden = state === "forbidden";
    await client.query(
      // The affinity and the note of an existing row are untouched on purpose:
      // this screen sets the CLAIM and the VETO, and the weight is somebody
      // else's sentence. A new row carries no note at all, because a
      // machine-written one would end up quoted inside a rejection sentence in
      // a curator's explanation — claimEligibility() reads it verbatim.
      `insert into ${worldTable} (${idColumn}, world_id, forbidden, native, affinity)
       values ($1, $2, $3, $4, 0.000)
       on conflict (${idColumn}, world_id) do update
          set forbidden = excluded.forbidden, native = excluded.native`,
      [entityId, worldId, forbidden, !forbidden]
    );
  });

  await recordAction(staff, {
    action: "connection.set",
    entityTable: pool.code,
    entityId,
    summary:
      state === "native"
        ? `${name} is written for this destination, and therefore for no other`
        : state === "forbidden"
          ? `${name} is forbidden under this destination`
          : `${name} makes no claim about this destination`,
    detail: { pool: pool.code, worldId, state },
  });

  revalidatePath("/desk/matrix");
  revalidatePath(`/desk/destinations/${worldId}/deliverables`);
}

/** For the ledger sentence. A missing row is not an error worth raising here. */
async function ingredientName(pool: string, id: string): Promise<string> {
  const rows = await query<{ name: string }>(
    `select name from ${pool} where id = $1`,
    [id]
  );
  return rows[0]?.name ?? "It";
}
