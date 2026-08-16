"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { query, queryOne } from "@/lib/db";
import { setTags, validFacetIds } from "@/lib/desk/facets";
import { COOKING_LEVELS, SEASONS, slugify } from "@/lib/desk/labels";
import { recordAction, requireStaff } from "@/lib/staff";

/**
 * Editing a menu.
 *
 * FOUR FIELDS AND NO MORE, because that is what docs/menus.md authors and the
 * shape is the product: dishes in order, what it is for, season, how much
 * cooking. There is no recipe box, no quantity, no method and no serving count
 * on this form, and their absence is deliberate — see the note at the top of
 * db/012 before adding one.
 *
 * Season and cooking each appear as one field with two parts: the closed value
 * the selection layer filters and weights on, and her own wording beside it.
 * "Winter, works year-round" and "Half made — good jarred fish soup exists"
 * both say something the enum cannot, and the second is how the menu BENDS,
 * which is the most useful sentence on the record.
 */

export type MenuState = { error: string | null };

const SEASON_CODES = SEASONS.map((season) => season.code);
const COOKING_CODES = COOKING_LEVELS.map((level) => level.code);
const STATUSES = ["draft", "active", "discontinued"];

function trimmed(form: FormData, key: string): string {
  return String(form.get(key) ?? "").trim();
}

export async function saveMenu(
  _previous: MenuState,
  form: FormData
): Promise<MenuState> {
  const staff = await requireStaff();

  const id = trimmed(form, "id");
  const name = trimmed(form, "name");
  const dishes = trimmed(form, "dishes").replace(/[\r\n]+/g, " ");

  if (name.length === 0) return { error: "Say what it is for." };
  if (dishes.length === 0) return { error: "A menu needs its dishes." };
  if (dishes.length > 600) {
    return { error: "That is longer than a menu line. 600 characters is the ceiling." };
  }

  const season = trimmed(form, "season");
  const cooking = trimmed(form, "cooking");
  const status = trimmed(form, "status");
  if (!SEASON_CODES.includes(season)) return { error: "Pick a season." };
  if (!COOKING_CODES.includes(cooking)) return { error: "Pick how much cooking." };
  if (!STATUSES.includes(status)) return { error: "Unknown status." };

  const slug = slugify(trimmed(form, "slug") || name);
  const facets = await validFacetIds(
    form.getAll("facet").map((value) => String(value))
  );

  const values = [
    slug,
    name,
    dishes,
    season,
    trimmed(form, "season_note"),
    form.get("season_strict") !== null,
    cooking,
    trimmed(form, "cooking_note"),
    trimmed(form, "notes") || null,
    status,
  ];

  let menuId = id;
  try {
    if (id) {
      await query(
        `update menu
            set slug = $1, name = $2, dishes = $3, season = $4::season_band,
                season_note = $5, season_strict = $6,
                cooking = $7::cooking_level, cooking_note = $8,
                notes = $9, status = $10::product_status
          where id = $11`,
        [...values, id]
      );
    } else {
      const rows = await query<{ id: string }>(
        `insert into menu (slug, name, dishes, season, season_note,
                           season_strict, cooking, cooking_note, notes, status)
         values ($1,$2,$3,$4::season_band,$5,$6,$7::cooking_level,$8,$9,
                 $10::product_status)
         returning id`,
        values
      );
      menuId = rows[0].id;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      error: message.includes("menu_slug_key")
        ? `Another menu already has the slug "${slug}".`
        : message,
    };
  }

  // Season and cooking are NOT tagged here — a trigger projects them into the
  // facet vocabulary (db/012). Writing them from this form as well would be a
  // second, contrary copy of a fact the columns already hold.
  await setTags("menu", menuId, facets);

  /*
   * WHICH DESTINATIONS IT WAS WRITTEN FOR — and only that.
   *
   * These checkboxes are the complete statement about ONE of the three states a
   * `menu_world` row can be in: db/019's `native` claim. They say nothing about
   * the other two, and until now the delete below did not know that — it removed
   * every row not in the list, which meant a forbidden scoping set at the
   * deliverables desk (a row this form cannot see, because the read is
   * `where native`) was silently destroyed by saving an unrelated field. A veto
   * that a save can delete is not a veto.
   *
   * So the delete is narrowed to the claim. A forbidden row survives — the
   * database's own CHECK guarantees `not (forbidden and native)`, so it cannot
   * be in this set. A re-weighting survives, because a weight is not a claim.
   * Unticking a box removes the claim, which is what unticking it means.
   */
  const worlds = form
    .getAll("world")
    .map((value) => String(value))
    .filter((value) => /^[0-9a-f-]{36}$/i.test(value));

  await query(
    `delete from menu_world
      where menu_id = $1
        and native
        and ($2::uuid[] = '{}' or world_id <> all($2::uuid[]))`,
    [menuId, worlds]
  );
  if (worlds.length > 0) {
    await query(
      // `native` — the claim (db/019). This form's question is "which
      // destinations was it written for", and the answer to that question is
      // exactly what makes a menu unavailable everywhere else.
      //
      // ON CONFLICT SETS THE CLAIM AND TOUCHES NOTHING ELSE. A row that already
      // exists as a re-weighting keeps its affinity and its curator's note and
      // gains the claim, which is what ticking the box says. The `where` clause
      // is the veto winning: a forbidden row is left exactly as it is, the
      // database's CHECK is never provoked, and the box simply reads unticked
      // again on the next load — because it is.
      `insert into menu_world (menu_id, world_id, native, affinity, note)
       select $1, w.id, true, 1.000, 'Attached at the desk.'
         from unnest($2::uuid[]) as w(id)
       on conflict (menu_id, world_id) do update
          set native = true
        where not menu_world.forbidden`,
      [menuId, worlds]
    );
  }

  await recordAction(staff, {
    action: id ? "menu.updated" : "menu.created",
    entityTable: "menu",
    entityId: menuId,
    summary: `${name} (${status})`,
    detail: { slug, season, cooking, destinations: worlds.length },
  });

  revalidatePath("/desk/menus");
  revalidatePath(`/desk/menus/${menuId}`);
  redirect(`/desk/menus/${menuId}?saved=1`);
}

export async function setMenuStatus(form: FormData): Promise<void> {
  const staff = await requireStaff();
  const id = String(form.get("id") ?? "");
  const status = String(form.get("status") ?? "");
  if (!STATUSES.includes(status)) return;

  const before = await queryOne<{ name: string }>(
    `select name from menu where id = $1`,
    [id]
  );
  if (!before) return;

  await query(`update menu set status = $2::product_status where id = $1`, [
    id,
    status,
  ]);

  await recordAction(staff, {
    action: "menu.status_changed",
    entityTable: "menu",
    entityId: id,
    summary: `${before.name} → ${status}`,
    detail: { status },
  });

  revalidatePath("/desk/menus");
  revalidatePath(`/desk/menus/${id}`);
}
