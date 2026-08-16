"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { query, queryOne } from "@/lib/db";
import { setTags, validFacetIds } from "@/lib/desk/facets";
import {
  COURSES,
  DISH_LEVELS,
  MEAL_SHAPES,
  SEASONS,
  slugify,
} from "@/lib/desk/labels";
import { recordAction, requireStaff } from "@/lib/staff";

/**
 * Editing a dish.
 *
 * FOUR FIELDS AND NO MORE, because that is what docs/dishes.md authors: the
 * name, the course, how much of it is made, and a season only where it binds.
 * There is no recipe box, no quantity, no method and no serving count on this
 * form, and their absence is deliberate — read the top of db/012 and then the
 * top of db/021 before adding one. A dish is a line.
 *
 * Season is one field to a curator and three columns here: the closed value the
 * selection layer will filter on, her own wording beside it, and whether it is
 * a gate or a weight.
 *
 * How much making is NOT tagged from this form. A trigger projects it from
 * `dish.making` onto the one `made_by_hand` facet (db/021, reading db/017's
 * ladder), which is why `making` is withheld from the dish tag picker in
 * src/lib/desk/facets.ts.
 */

export type DishState = { error: string | null };

const COURSE_CODES = COURSES.map((entry) => entry.code);
const MAKING_CODES = DISH_LEVELS.map((entry) => entry.code);
const SEASON_CODES = SEASONS.map((season) => season.code);
const MEAL_CODES = MEAL_SHAPES.map((entry) => entry.code);
const STATUSES = ["draft", "active", "discontinued"];

function trimmed(form: FormData, key: string): string {
  return String(form.get(key) ?? "").trim();
}

export async function saveDish(
  _previous: DishState,
  form: FormData
): Promise<DishState> {
  const staff = await requireStaff();

  const id = trimmed(form, "id");
  // A dish is a line, and the newline ban is a CHECK on the column. Collapsing
  // here rather than refusing is the same thing MenuForm does with `dishes`: a
  // curator who pasted a wrapped line meant one line.
  const name = trimmed(form, "name").replace(/[\r\n]+/g, " ");

  if (name.length === 0) return { error: "A dish needs a name." };
  if (name.length > 200) {
    return { error: "That is longer than a dish. 200 characters is the ceiling." };
  }

  const course = trimmed(form, "course");
  const making = trimmed(form, "making");
  const season = trimmed(form, "season");
  const status = trimmed(form, "status");
  if (!COURSE_CODES.includes(course)) return { error: "Pick a course." };
  if (!MAKING_CODES.includes(making)) return { error: "Pick how much making." };
  if (!SEASON_CODES.includes(season)) return { error: "Pick a season." };
  if (!STATUSES.includes(status)) return { error: "Unknown status." };

  const slug = slugify(trimmed(form, "slug") || name);
  const facets = await validFacetIds(
    form.getAll("facet").map((value) => String(value))
  );

  const values = [
    slug,
    name,
    course,
    making,
    season,
    trimmed(form, "season_note"),
    form.get("season_strict") !== null,
    trimmed(form, "notes") || null,
    status,
  ];

  let dishId = id;
  try {
    if (id) {
      await query(
        `update dish
            set slug = $1, name = $2, course = $3::course,
                making = $4::making_level, season = $5::season_band,
                season_note = $6, season_strict = $7,
                notes = $8, status = $9::product_status
          where id = $10`,
        [...values, id]
      );
    } else {
      const rows = await query<{ id: string }>(
        `insert into dish (slug, name, course, making, season, season_note,
                           season_strict, notes, status)
         values ($1,$2,$3::course,$4::making_level,$5::season_band,$6,$7,$8,
                 $9::product_status)
         returning id`,
        values
      );
      dishId = rows[0].id;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      error: message.includes("dish_slug_key")
        ? `Another dish already has the slug "${slug}".`
        : message,
    };
  }

  // Season and making are NOT tagged here — a trigger projects them into the
  // facet vocabulary (db/021). Writing them from this form as well would be a
  // second, contrary copy of a fact the columns already hold.
  await setTags("dish", dishId, facets);

  /*
   * WHICH DESTINATIONS IT WAS WRITTEN FOR — and only that.
   *
   * THE BUG THIS AVOIDS, WRITTEN OUT SO IT IS NOT REINTRODUCED A FOURTH TIME.
   * The menu and drink forms both shipped a delete that removed every
   * `<pool>_world` row not in the checkbox list. The checkboxes are loaded from
   * `where native` — the CLAIM — so a `forbidden` row set at the deliverables
   * desk was invisible to the form and was silently destroyed by saving an
   * unrelated field. A veto a save can delete is not a veto, and the same was
   * true of a plain re-weighting.
   *
   * These checkboxes are the complete statement about ONE of the three states a
   * `dish_world` row can be in (db/019): the `native` claim. They say nothing
   * about the other two, so the delete is narrowed to the claim. A forbidden row
   * survives — the database's own CHECK guarantees `not (forbidden and native)`,
   * so it cannot be in this set. A re-weighting survives, because a weight is
   * not a claim. Unticking a box removes the claim, which is what unticking it
   * means and all that it means.
   */
  const worlds = form
    .getAll("world")
    .map((value) => String(value))
    .filter((value) => /^[0-9a-f-]{36}$/i.test(value));

  await query(
    `delete from dish_world
      where dish_id = $1
        and native
        and ($2::uuid[] = '{}' or world_id <> all($2::uuid[]))`,
    [dishId, worlds]
  );
  if (worlds.length > 0) {
    await query(
      // ON CONFLICT SETS THE CLAIM AND TOUCHES NOTHING ELSE. A row that already
      // exists as a re-weighting keeps its affinity and its curator's note and
      // gains the claim, which is what ticking the box says. The `where` clause
      // is the veto winning: a forbidden row is left exactly as it is, the
      // database's CHECK is never provoked, and the box simply reads unticked
      // again on the next load — because it is.
      `insert into dish_world (dish_id, world_id, native, affinity, note)
       select $1, w.id, true, 1.000, 'Attached at the desk.'
         from unnest($2::uuid[]) as w(id)
       on conflict (dish_id, world_id) do update
          set native = true
        where not dish_world.forbidden`,
      [dishId, worlds]
    );
  }

  /*
   * WHAT KIND OF TABLE IT IS FOR — db/023.
   *
   * A full replace, and safe to be one, unlike the destination rows above: the
   * boxes are the COMPLETE statement about `dish_meal`, which has exactly one
   * state and no `forbidden` half for a form to be blind to. That is the whole
   * difference, and it is the reason db/023 declines to add one — an unused
   * state is a state a form will eventually destroy.
   */
  const meals = form
    .getAll("meal")
    .map((value) => String(value))
    .filter((value) => MEAL_CODES.includes(value));

  await query(
    `delete from dish_meal
      where dish_id = $1
        and ($2::text[] = '{}' or meal::text <> all($2::text[]))`,
    [dishId, meals]
  );
  if (meals.length > 0) {
    await query(
      `insert into dish_meal (dish_id, meal, note)
       select $1, m::meal_shape, 'Ticked at the desk.'
         from unnest($2::text[]) as m
       on conflict (dish_id, meal) do nothing`,
      [dishId, meals]
    );
  }

  await recordAction(staff, {
    action: id ? "dish.updated" : "dish.created",
    entityTable: "dish",
    entityId: dishId,
    summary: `${name} (${status})`,
    detail: { slug, course, making, season, meals, destinations: worlds.length },
  });

  revalidatePath("/desk/dishes");
  revalidatePath(`/desk/dishes/${dishId}`);
  redirect(`/desk/dishes/${dishId}?saved=1`);
}

export async function setDishStatus(form: FormData): Promise<void> {
  const staff = await requireStaff();
  const id = String(form.get("id") ?? "");
  const status = String(form.get("status") ?? "");
  if (!STATUSES.includes(status)) return;

  const before = await queryOne<{ name: string }>(
    `select name from dish where id = $1`,
    [id]
  );
  if (!before) return;

  await query(`update dish set status = $2::product_status where id = $1`, [
    id,
    status,
  ]);

  await recordAction(staff, {
    action: "dish.status_changed",
    entityTable: "dish",
    entityId: id,
    summary: `${before.name} → ${status}`,
    detail: { status },
  });

  revalidatePath("/desk/dishes");
  revalidatePath(`/desk/dishes/${id}`);
}
