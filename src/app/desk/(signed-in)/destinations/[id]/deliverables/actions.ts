"use server";

import { revalidatePath } from "next/cache";

import { query, transaction } from "@/lib/db";
import { SECTION_KINDS } from "@/lib/desk/labels";
import { recordAction, requireStaff } from "@/lib/staff";

/**
 * WHAT SHE RECEIVES, per destination.
 *
 * Two different things live on this screen and they are different on purpose:
 *
 *   THE PIECES        `world_section` — the destination's default content
 *                     blocks. Cloned into a Revelle at build time and then
 *                     edited for her, which is what makes a destination an
 *                     asset instead of a name (db/001). Editing them here does
 *                     NOT reach a delivered Revelle: hers were cloned and are
 *                     frozen.
 *
 *   THE INGREDIENTS   `<pool>_world` — how a product, a game, a menu, a drink
 *                     or a soundtrack behaves UNDER this destination. Stage 3 of
 *                     docs/selection-spec.md, as two columns: `forbidden` is a
 *                     structural never, `affinity` is a signed re-weighting.
 *                     A missing row means neutral, which is the correct
 *                     default and why nothing is listed until it is scoped.
 */

const SECTION_CODES = new Set(SECTION_KINDS.map((kind) => kind.code));

/** The five pools that can be scoped to a destination. See db/009, db/017. */
const POOLS = {
  product: { table: "product_world", column: "product_id", label: "Products" },
  game: { table: "game_world", column: "game_id", label: "Games" },
  menu: { table: "menu_world", column: "menu_id", label: "Menus" },
  drink: { table: "drink_world", column: "drink_id", label: "Drinks" },
  tracklist: {
    table: "tracklist_world",
    column: "tracklist_id",
    label: "Soundtracks",
  },
} as const;

export type Pool = keyof typeof POOLS;

function isPool(value: string): value is Pool {
  return Object.hasOwn(POOLS, value);
}

/* ── the pieces ─────────────────────────────────────────────────────── */

export async function saveSection(form: FormData): Promise<void> {
  const staff = await requireStaff();
  const worldId = String(form.get("world_id") ?? "");
  const id = String(form.get("section_id") ?? "");
  const kind = String(form.get("kind") ?? "");
  const heading = String(form.get("heading") ?? "").trim();
  const body = String(form.get("body") ?? "");

  if (!SECTION_CODES.has(kind)) return;

  if (id) {
    await query(
      `update world_section set kind = $2::section_kind, heading = $3, body = $4
        where id = $1 and world_id = $5`,
      [id, kind, heading || null, body, worldId]
    );
  } else {
    // Appended. Position is data (db/001) and the constraint is deferrable, so
    // reordering below can renumber inside one transaction.
    await query(
      `insert into world_section (world_id, kind, heading, body, position)
       select $1, $2::section_kind, $3, $4,
              coalesce(max(position), 0) + 10
         from world_section where world_id = $1`,
      [worldId, kind, heading || null, body]
    );
  }

  await recordAction(staff, {
    action: id ? "section.updated" : "section.created",
    entityTable: "world",
    entityId: worldId,
    summary: `${kind}${heading ? ` — ${heading}` : ""}`,
  });

  revalidatePath(`/desk/destinations/${worldId}/deliverables`);
}

export async function deleteSection(form: FormData): Promise<void> {
  const staff = await requireStaff();
  const worldId = String(form.get("world_id") ?? "");
  const id = String(form.get("section_id") ?? "");

  await query(`delete from world_section where id = $1 and world_id = $2`, [
    id,
    worldId,
  ]);
  await recordAction(staff, {
    action: "section.deleted",
    entityTable: "world",
    entityId: worldId,
    summary: `Removed a section`,
    detail: { sectionId: id },
  });
  revalidatePath(`/desk/destinations/${worldId}/deliverables`);
}

/**
 * Up or down, without retyping anything.
 *
 * Two rows swap positions inside one transaction. `world_section_position_unique`
 * is DEFERRABLE INITIALLY DEFERRED precisely so this works — db/001 says so —
 * and the swap is written as one statement against both rows so there is never
 * an intermediate state to collide with.
 */
export async function moveSection(form: FormData): Promise<void> {
  await requireStaff();
  const worldId = String(form.get("world_id") ?? "");
  const id = String(form.get("section_id") ?? "");
  const direction = String(form.get("direction") ?? "");
  if (direction !== "up" && direction !== "down") return;

  await transaction(async (client) => {
    const { rows } = await client.query<{ id: string; position: number }>(
      `select id, position from world_section
        where world_id = $1 order by position`,
      [worldId]
    );
    const index = rows.findIndex((row) => row.id === id);
    const other = direction === "up" ? index - 1 : index + 1;
    if (index === -1 || other < 0 || other >= rows.length) return;

    await client.query(
      `update world_section set position = case id when $1 then $4 else $3 end
        where id in ($1, $2)`,
      [rows[index].id, rows[other].id, rows[index].position, rows[other].position]
    );
  });

  revalidatePath(`/desk/destinations/${worldId}/deliverables`);
}

/* ── the ingredients ────────────────────────────────────────────────── */

export async function scopeIngredient(form: FormData): Promise<void> {
  const staff = await requireStaff();
  const worldId = String(form.get("world_id") ?? "");
  const pool = String(form.get("pool") ?? "");
  const entityId = String(form.get("entity_id") ?? "");
  if (!isPool(pool) || !/^[0-9a-f-]{36}$/i.test(entityId)) return;

  const { table, column } = POOLS[pool];
  const forbidden = form.get("forbidden") !== null;
  const raw = Number(String(form.get("affinity") ?? "0"));
  const affinity = Number.isFinite(raw) ? Math.max(-1, Math.min(1, raw)) : 0;
  const note = String(form.get("note") ?? "").trim() || null;

  await query(
    `insert into ${table} (${column}, world_id, forbidden, affinity, note)
     values ($1, $2, $3, $4, $5)
     on conflict (${column}, world_id) do update
       set forbidden = excluded.forbidden,
           affinity = excluded.affinity,
           note = excluded.note`,
    [entityId, worldId, forbidden, affinity, note]
  );

  await recordAction(staff, {
    action: "ingredient.scoped",
    entityTable: pool,
    entityId,
    summary: `${pool} ${forbidden ? "forbidden" : `affinity ${affinity}`} under this destination`,
    detail: { worldId, forbidden, affinity },
  });

  revalidatePath(`/desk/destinations/${worldId}/deliverables`);
}

export async function unscopeIngredient(form: FormData): Promise<void> {
  await requireStaff();
  const worldId = String(form.get("world_id") ?? "");
  const pool = String(form.get("pool") ?? "");
  const entityId = String(form.get("entity_id") ?? "");
  if (!isPool(pool) || !/^[0-9a-f-]{36}$/i.test(entityId)) return;

  const { table, column } = POOLS[pool];
  // No row means NEUTRAL, which is the default and a real answer — this is
  // "stop having an opinion", not "forbid".
  await query(`delete from ${table} where ${column} = $1 and world_id = $2`, [
    entityId,
    worldId,
  ]);
  revalidatePath(`/desk/destinations/${worldId}/deliverables`);
}

/* ── the rare veto ──────────────────────────────────────────────────── */

/**
 * Which occasions this destination refuses.
 *
 * Deliberately only the veto. db/009's whole argument is that a destination
 * must be able to carry EVERY occasion in a different shape, or the catalogue
 * stops compounding — so the default is "all of them" and this is the
 * exception, used for a destination built around something a particular
 * occasion cannot survive.
 */
export async function setOccasionVetoes(form: FormData): Promise<void> {
  const staff = await requireStaff();
  const worldId = String(form.get("world_id") ?? "");
  const forbidden = form.getAll("forbidden").map((value) => String(value));

  await transaction(async (client) => {
    await client.query(
      `delete from world_occasion where world_id = $1 and fit = 'forbidden'`,
      [worldId]
    );
    if (forbidden.length > 0) {
      await client.query(
        `insert into world_occasion (world_id, occasion, fit, note)
         select $1, o::occasion_type, 'forbidden', 'Set at the desk.'
           from unnest($2::text[]) as o
         on conflict (world_id, occasion) do update set fit = 'forbidden'`,
        [worldId, forbidden]
      );
    }
  });

  await recordAction(staff, {
    action: "destination.occasions_vetoed",
    entityTable: "world",
    entityId: worldId,
    summary: forbidden.length === 0 ? "No occasion vetoes" : forbidden.join(", "),
    detail: { forbidden },
  });

  revalidatePath(`/desk/destinations/${worldId}/deliverables`);
}
