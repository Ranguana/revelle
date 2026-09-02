"use server";

import { revalidatePath } from "next/cache";

import { query, queryOne, transaction } from "@/lib/db";
import { recordAction, requireStaff } from "@/lib/staff";

/**
 * NO, FOR ANY POOL.
 *
 * Founder, 2026-09-02: "i want these deleted otherwise its confusing, need a
 * delete or no button for dishes, games, drinks etc."
 *
 * ── WHY THIS IS ONE ACTION AND NOT FIVE ──────────────────────────────
 *
 * Because a refusal is one idea and the pools differ only in which table the
 * row sits in. Five copies would be five chances for one of them to delete
 * without recording, which is the exact bug this replaces — and the sixth
 * pool would arrive with none of them.
 *
 * The table name is validated against `ingredient_pool`, the registry that
 * already knows what a pool is (rule 19), so a seventh pool is refusable the
 * day it is registered and nothing here is edited. It is interpolated into the
 * SQL only after that check and only through format-safe identifier quoting —
 * never a caller's string.
 *
 * ── WHAT MAKES THE NO STICK ──────────────────────────────────────────
 *
 * The row is DELETED, as asked. What survives is a `refused_row` record of the
 * slug, and db/057's BEFORE INSERT trigger on every pool table skips any
 * insert matching one. So the seeders — which recreate from documents on every
 * deploy, and are why deletion alone did not hold — are stopped at the table
 * rather than asked to check first.
 *
 * Both statements are in ONE transaction, because they must not half-exist: a
 * refusal on file for a row that survived is a lie, and a deleted row with no
 * refusal on file is precisely the bug this replaces — the seeder rebuilds it
 * on the next deploy and the no evaporates.
 *
 * ── WHAT IT WILL NOT DELETE ──────────────────────────────────────────
 *
 * Anything that has been issued. db/002's join tables are `on delete restrict`
 * — "a pooled ingredient that has been issued to somebody cannot be deleted
 * out from under her Revelle" — so the database refuses, and this reports that
 * plainly and names retirement as the right instrument instead. The refusal
 * record is rolled back with it, because a no that could not be carried out is
 * not a no.
 */
export async function refusePoolRow(form: FormData): Promise<void> {
  const staff = await requireStaff();
  const entityTable = String(form.get("entity_table") ?? "");
  const id = String(form.get("id") ?? "");
  const reason = String(form.get("reason") ?? "").trim();
  const back = String(form.get("back") ?? "/desk");

  if (!/^[0-9a-f-]{36}$/i.test(id)) return;

  // The registry decides what a pool is. An unknown table is not an error
  // worth explaining to an attacker and not a case worth guessing at.
  const pool = await queryOne<{ entity_table: string }>(
    `select entity_table from ingredient_pool where entity_table = $1`,
    [entityTable]
  );
  if (!pool) return;

  const before = await queryOne<{ slug: string; name: string }>(
    `select slug::text as slug, name from ${quoted(pool.entity_table)} where id = $1`,
    [id]
  );
  if (!before) return;

  try {
    // THROUGH THE HELPER, because `query` takes a connection from the pool
    // each call — a hand-rolled begin/commit would run them on different
    // connections and leave transaction state on one somebody else picks up.
    // src/lib/db.ts's transaction() exists for exactly this, and the two
    // statements below "must not half-exist": a refusal recorded without the
    // delete is a lie, and a delete without the refusal is the bug this
    // replaces.
    await transaction(async (client) => {
      await client.query(
        `insert into refused_row (entity_table, slug, refused_by, name_at_refusal, reason)
         values ($1, $2, $3, $4, $5)
         on conflict (entity_table, slug) do update
            set refused_by = excluded.refused_by,
                refused_at = now(),
                reason = excluded.reason`,
        [pool.entity_table, before.slug, staff.email, before.name, reason]
      );

      await client.query(
        `delete from ${quoted(pool.entity_table)} where id = $1`,
        [id]
      );
    });
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code === "23503") {
      // Issued. The database is right and this is not. The whole transaction
      // rolled back, so no refusal is on file for a row that survived.
      await recordAction(staff, {
        action: `${pool.entity_table}.refusal_refused`,
        entityTable: pool.entity_table,
        entityId: id,
        summary: `${before.name} could not be refused — it has been issued. Retire it instead.`,
      });
      revalidatePath(back);
      return;
    }
    throw err;
  }

  await recordAction(staff, {
    action: `${pool.entity_table}.refused`,
    entityTable: pool.entity_table,
    entityId: id,
    summary: `${before.name} — refused and deleted; the slug is on file so no seeder rebuilds it`,
    detail: { slug: before.slug, reason: reason || null },
  });

  revalidatePath(back);
}

/** Identifier quoting for a name the registry has already vouched for. */
function quoted(table: string): string {
  return `"${table.replace(/"/g, '""')}"`;
}
