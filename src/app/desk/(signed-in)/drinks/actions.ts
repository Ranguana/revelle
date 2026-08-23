"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { query, queryOne } from "@/lib/db";
import { setTags, validFacetIds } from "@/lib/desk/facets";
import { MIXING_LEVELS, SEASONS, slugify } from "@/lib/desk/labels";
import { carryReview } from "@/lib/desk/review";
import { recordAction, requireStaff } from "@/lib/staff";

/**
 * Editing a drink.
 *
 * FIVE FIELDS AND NO MORE, because that is what docs/drinks.md authors: the
 * cocktails in order, the mocktail mirror, what it is for, season, how much
 * mixing. There is no recipe box, no quantity and no method on this form, and
 * their absence is deliberate — the glass is already in her sentence.
 *
 * ── THE MIRROR IS NOT OPTIONAL, AND THIS IS THE FORM THAT COULD MAKE IT SO ──
 *
 * A drink is one record with two builds. The guarantee is that nobody at the
 * table is visibly not drinking, and it survives exactly as long as the two
 * cannot be separated — so a save with an empty mirror is REFUSED here, with
 * the reason, before the database refuses it less legibly. db/017 makes the
 * column NOT NULL for the same reason; this is the sentence a curator reads.
 *
 * Season and mixing each appear as one field with two parts where there is
 * something to say: the closed value the selection layer weights on, and her
 * own wording beside it. There is no note beside the mixing value on purpose —
 * the founder removed the prose escape hatches from the catalogue so that
 * nothing has to read prose to know how a drink bends.
 */

export type DrinkState = { error: string | null };

const SEASON_CODES = SEASONS.map((season) => season.code);
const MIXING_CODES = MIXING_LEVELS.map((level) => level.code);
const STATUSES = ["draft", "active", "discontinued"];

function trimmed(form: FormData, key: string): string {
  return String(form.get(key) ?? "").trim();
}

export async function saveDrink(
  _previous: DrinkState,
  form: FormData
): Promise<DrinkState> {
  const staff = await requireStaff();

  const id = trimmed(form, "id");
  const name = trimmed(form, "name");
  const cocktails = trimmed(form, "cocktails").replace(/[\r\n]+/g, " ");
  const mocktails = trimmed(form, "mocktails").replace(/[\r\n]+/g, " ");

  if (name.length === 0) return { error: "Say what it is for." };
  if (cocktails.length === 0) return { error: "A drink needs its cocktails." };
  if (mocktails.length === 0) {
    return {
      error:
        "Every drink carries a mirror. The same glass, the same components, " +
        "arriving at the same time — so nobody at the table is visibly not " +
        "drinking.",
    };
  }
  if (cocktails.toLowerCase() === mocktails.toLowerCase()) {
    return {
      error:
        "The mirror is the same line as the cocktails. A mirror is the glass " +
        "built without the alcohol, not the sentence again.",
    };
  }
  if (cocktails.length > 600 || mocktails.length > 600) {
    return {
      error: "That is longer than a drinks line. 600 characters is the ceiling.",
    };
  }

  const season = trimmed(form, "season");
  const making = trimmed(form, "making");
  const status = trimmed(form, "status");
  if (!SEASON_CODES.includes(season)) return { error: "Pick a season." };
  if (!MIXING_CODES.includes(making)) return { error: "Pick how much mixing." };
  if (!STATUSES.includes(status)) return { error: "Unknown status." };

  const slug = slugify(trimmed(form, "slug") || name);
  const facets = await validFacetIds(
    form.getAll("facet").map((value) => String(value))
  );

  const values = [
    slug,
    name,
    cocktails,
    mocktails,
    season,
    trimmed(form, "season_note"),
    form.get("season_strict") !== null,
    making,
    trimmed(form, "notes") || null,
    status,
  ];

  let drinkId = id;
  try {
    if (id) {
      await query(
        `update drink
            set slug = $1, name = $2, cocktails = $3, mocktails = $4,
                season = $5::season_band, season_note = $6, season_strict = $7,
                making = $8::making_level, notes = $9,
                status = $10::product_status
          where id = $11`,
        [...values, id]
      );
    } else {
      const rows = await query<{ id: string }>(
        `insert into drink (slug, name, cocktails, mocktails, season,
                            season_note, season_strict, making, notes, status)
         values ($1,$2,$3,$4,$5::season_band,$6,$7,$8::making_level,$9,
                 $10::product_status)
         returning id`,
        values
      );
      drinkId = rows[0].id;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      error: message.includes("drink_slug_key")
        ? `Another drink already has the slug "${slug}".`
        : message,
    };
  }

  // Season and mixing are NOT tagged here — a trigger projects them into the
  // facet vocabulary (db/017). Writing them from this form as well would be a
  // second, contrary copy of a fact the columns already hold.
  await setTags("drink", drinkId, facets);

  /*
   * WHICH DESTINATIONS IT WAS WRITTEN FOR — and only that. Same correction as
   * the menu form, for the same reason and in the same words: these checkboxes
   * are the complete statement about db/019's `native` claim and say nothing
   * about the other two states, so the delete is narrowed to the claim. A
   * forbidden scoping set at the deliverables desk — a row this form cannot see
   * — used to be destroyed by saving an unrelated field, and a veto a save can
   * delete is not a veto.
   */
  const worlds = form
    .getAll("world")
    .map((value) => String(value))
    .filter((value) => /^[0-9a-f-]{36}$/i.test(value));

  await query(
    `delete from drink_world
      where drink_id = $1
        and native
        and ($2::uuid[] = '{}' or world_id <> all($2::uuid[]))`,
    [drinkId, worlds]
  );
  if (worlds.length > 0) {
    await query(
      // `native` — the claim (db/019). Same question and same answer as the
      // menu form: "written for" is what makes it unavailable elsewhere, and
      // the conflict clause sets the claim on an existing re-weighting while
      // leaving a forbidden row exactly as it is.
      `insert into drink_world (drink_id, world_id, native, affinity, note)
       select $1, w.id, true, 1.000, 'Attached at the desk.'
         from unnest($2::uuid[]) as w(id)
       on conflict (drink_id, world_id) do update
          set native = true
        where not drink_world.forbidden`,
      [drinkId, worlds]
    );
  }

  await recordAction(staff, {
    action: id ? "drink.updated" : "drink.created",
    entityTable: "drink",
    entityId: drinkId,
    summary: `${name} (${status})`,
    detail: { slug, season, making, destinations: worlds.length },
  });

  revalidatePath("/desk/drinks");
  revalidatePath(`/desk/drinks/${drinkId}`);
  // Back into the review it was saved from, if there was one. See review.ts.
  redirect(carryReview(form, `/desk/drinks/${drinkId}?saved=1`));
}

export async function setDrinkStatus(form: FormData): Promise<void> {
  const staff = await requireStaff();
  const id = String(form.get("id") ?? "");
  const status = String(form.get("status") ?? "");
  if (!STATUSES.includes(status)) return;

  const before = await queryOne<{ name: string }>(
    `select name from drink where id = $1`,
    [id]
  );
  if (!before) return;

  await query(`update drink set status = $2::product_status where id = $1`, [
    id,
    status,
  ]);

  await recordAction(staff, {
    action: "drink.status_changed",
    entityTable: "drink",
    entityId: id,
    summary: `${before.name} → ${status}`,
    detail: { status },
  });

  revalidatePath("/desk/drinks");
  revalidatePath(`/desk/drinks/${id}`);
}
