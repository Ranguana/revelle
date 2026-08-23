"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { query, queryOne } from "@/lib/db";
import { setTags, validFacetIds } from "@/lib/desk/facets";
import { slugify } from "@/lib/desk/labels";
import { carryReview } from "@/lib/desk/review";
import { recordAction, requireStaff } from "@/lib/staff";

/**
 * Editing a game at the desk.
 *
 * ── THE FILE, THE SEED, AND WHO WINS ────────────────────────────────
 *
 * The seven authored games live in src/lib/games.ts, and the header of that
 * file states why: a rule the founder wants reworded should be a diff a human
 * can read in a pull request, not migration 037. That makes the MODULE the
 * canonical, reviewable text of a game — and it does not make the module the
 * live record. scripts/seed-games.mjs says the other half out loud: "A game
 * that already exists is LEFT ALONE — name, rules, bounds and all. A curator's
 * edit in the tool outranks the module."
 *
 * This is the same arrangement src/lib/destinations.ts has with
 * /desk/destinations, and scripts/seed-menus.mjs states it in the same words
 * ("left as the desk has it"). So the rule this file works under is:
 *
 *   · The module is the source of truth for SEEDING. It creates what is
 *     missing, as a draft, and adds child rows that are absent.
 *   · The database is the source of truth for what is OFFERED, and the desk
 *     edits the database.
 *   · A curator's edit here outranks the module, permanently, because
 *     seed-games.mjs has no --overwrite at all. Nothing can quietly undo it.
 *
 * A curator editing a rule here should still put the reworded rule back into
 * src/lib/games.ts, or a fresh database will seed the old words. That is a
 * property of the arrangement rather than a fault in it, and the form says so
 * where a curator can read it.
 *
 * ── WHAT IS EDITABLE HERE, AND WHAT IS NOT ──────────────────────────
 *
 * The `game` ROW: its words, its shape, its bounds, its facet tags, its status.
 * Exactly the columns /desk/destinations edits on `world`.
 *
 * NOT the runbook, the supplies, the printed matter, the requirements, the
 * dependencies or the three scoping registries. Those are structured rows the
 * module authors and db/010 and db/025 guard with triggers — a step points at a
 * supply that must exist, a phase decides whether a step may carry a clock, a
 * dependency edge may not close a cycle. The detail page RENDERS all of it, in
 * full, because a curator has to be able to read what she is deciding about.
 * Making it editable is a second authoring surface for content whose whole
 * argument is that it is authored in a file, and the destinations section makes
 * exactly the same cut: the look is edited in place, the voice is not.
 *
 * ── THE DATABASE'S REFUSALS ARE SHOWN VERBATIM ──────────────────────
 *
 * db/010 and db/025 refuse several edits, and each refusal carries a HINT that
 * is the useful half: an ambient game may not have a duration, a game may not
 * be made recommended while its runbook still plays it, a game may not be made
 * ambient while its steps still carry a clock. Those sentences are shown as
 * they arrive. The same argument the voice form makes applies — rewriting them
 * into something friendlier makes them less true and puts a second copy of the
 * rule in TypeScript.
 */

const STATUSES = ["draft", "active", "discontinued"];
const SHAPES = ["scheduled", "ambient", "finale"];
const SOURCING = ["provided", "recommended"];
const HOST_ROLES = ["runs_it", "plays_too"];

export type GameState = { error: string | null; hint: string | null };

function trimmed(form: FormData, key: string): string {
  return String(form.get(key) ?? "").trim();
}

function nullable(form: FormData, key: string): string | null {
  const value = trimmed(form, key);
  return value.length > 0 ? value : null;
}

/**
 * A whole number, or nothing at all.
 *
 * A field holding something that is not one is an ERROR and never a silent
 * null: "45 mins" typed into the duration box must not quietly erase the
 * duration and leave the curator believing she saved it. The RANGES are the
 * database's (1..600 for a clock, >= 1 for a guest bound) and are not repeated
 * here — a 900 is passed down and refused by the CHECK that owns the rule.
 */
function whole(
  form: FormData,
  key: string,
  label: string,
  complaints: string[]
): number | null {
  const value = trimmed(form, key);
  if (value.length === 0) return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    complaints.push(`${label} has to be a whole number, or empty.`);
    return null;
  }
  return parsed;
}

/** What the database said, with its hint. Never translated. See the header. */
function refusal(err: unknown): GameState {
  const said = err as { message?: string; hint?: string };
  return { error: said?.message ?? String(err), hint: said?.hint ?? null };
}

export async function saveGame(
  _previous: GameState,
  form: FormData
): Promise<GameState> {
  const staff = await requireStaff();

  const id = trimmed(form, "id");
  const name = trimmed(form, "name");
  if (name.length === 0) return { error: "It needs a name.", hint: null };

  const description = trimmed(form, "description");
  if (description.length === 0) {
    return {
      error: "It needs a description.",
      hint: "This is THE CARD — the one or two sentences in her Revelle that " +
        "decide whether she clicks through. A game with none is a game nobody " +
        "chooses.",
    };
  }

  const shape = trimmed(form, "shape");
  if (!SHAPES.includes(shape)) return { error: "Unknown shape.", hint: null };
  const sourcing = trimmed(form, "sourcing");
  if (!SOURCING.includes(sourcing)) {
    return { error: "Unknown sourcing.", hint: null };
  }
  const hostRole = trimmed(form, "host_role");
  if (!HOST_ROLES.includes(hostRole)) {
    return { error: "Unknown host role.", hint: null };
  }
  const status = trimmed(form, "status");
  if (!STATUSES.includes(status)) return { error: "Unknown status.", hint: null };

  const complaints: string[] = [];
  const durationMinutes = whole(form, "duration_minutes", "The duration", complaints);
  const durationMax = whole(form, "duration_max_minutes", "The longest it runs", complaints);
  const minGuests = whole(form, "min_guests", "The smallest group", complaints);
  const maxGuests = whole(form, "max_guests", "The largest group", complaints);
  if (complaints.length > 0) {
    return { error: complaints.join(" "), hint: null };
  }

  const slug = slugify(trimmed(form, "slug") || name);

  const facets = await validFacetIds(
    form.getAll("facet").map((value) => String(value))
  );

  const values = [
    slug,
    name,
    description,
    trimmed(form, "how_it_works"),
    nullable(form, "materials"),
    shape,
    sourcing,
    durationMinutes,
    durationMax,
    minGuests,
    maxGuests,
    nullable(form, "scoring"),
    nullable(form, "currency_label"),
    nullable(form, "external_name"),
    nullable(form, "external_url"),
    nullable(form, "caveat"),
    hostRole,
    nullable(form, "host_note"),
    nullable(form, "source_note"),
    nullable(form, "notes"),
    status,
  ];

  let gameId = id;
  try {
    if (id) {
      await query(
        `update game
            set slug = $1, name = $2, description = $3, how_it_works = $4,
                materials = $5, shape = $6::game_shape,
                sourcing = $7::game_sourcing,
                duration_minutes = $8, duration_max_minutes = $9,
                min_guests = $10, max_guests = $11,
                scoring = $12, currency_label = $13,
                external_name = $14, external_url = $15, caveat = $16,
                host_role = $17::host_role, host_note = $18,
                source_note = $19, notes = $20, status = $21::product_status
          where id = $22`,
        [...values, id]
      );
    } else {
      // Always a DRAFT, whatever the select said, for the reason
      // scripts/seed-games.mjs states about its own inserts: deciding that
      // something is active is a curator's decision and not a side effect of
      // typing a name. She makes it with the button, having read it back.
      const rows = await query<{ id: string }>(
        `insert into game
           (slug, name, description, how_it_works, materials, shape, sourcing,
            duration_minutes, duration_max_minutes, min_guests, max_guests,
            scoring, currency_label, external_name, external_url, caveat,
            host_role, host_note, source_note, notes, status)
         values ($1,$2,$3,$4,$5,$6::game_shape,$7::game_sourcing,$8,$9,$10,$11,
                 $12,$13,$14,$15,$16,$17::host_role,$18,$19,$20,'draft')
         returning id`,
        values.slice(0, 20)
      );
      gameId = rows[0].id;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("game_slug_key")) {
      return {
        error: `Another game already has the slug "${slug}". Give this one its own.`,
        hint: null,
      };
    }
    return refusal(err);
  }

  await setTags("game", gameId, facets);

  await recordAction(staff, {
    action: id ? "game.updated" : "game.created",
    entityTable: "game",
    entityId: gameId,
    summary: `${name} (${id ? status : "draft"})`,
    detail: { slug, shape, sourcing, status, facets: facets.length },
  });

  revalidatePath("/desk/games");
  revalidatePath(`/desk/games/${gameId}`);
  // Back into the review it was saved from, if there was one. See review.ts.
  redirect(carryReview(form, `/desk/games/${gameId}?saved=1`));
}

/**
 * The one-click move from draft to offered, and back.
 *
 * The same shape as setProductStatus and setDishStatus, with one addition: a
 * status move can be refused. db/025 puts a guard on `game` that fires on the
 * sourcing and shape transitions, and while neither is reachable from this
 * button today, a refusal arriving here would otherwise be a stack trace on a
 * page a curator was only trying to publish from. It is caught, recorded and
 * shown on the game's own page, exactly as setDestinationStatus does with the
 * voice guard.
 */
export async function setGameStatus(form: FormData): Promise<void> {
  const staff = await requireStaff();
  const id = String(form.get("id") ?? "");
  const status = String(form.get("status") ?? "");
  if (!STATUSES.includes(status)) return;

  const before = await queryOne<{ name: string }>(
    `select name from game where id = $1`,
    [id]
  );
  if (!before) return;

  try {
    await query(`update game set status = $2::product_status where id = $1`, [
      id,
      status,
    ]);
  } catch (err) {
    const said = err as { message?: string; hint?: string };
    const words = [said?.message ?? String(err), said?.hint]
      .filter(Boolean)
      .join(" ");
    await recordAction(staff, {
      action: "game.status_refused",
      entityTable: "game",
      entityId: id,
      summary: `${before.name} refused → ${status}`,
      detail: { status, refusal: words },
    });
    redirect(
      carryReview(form, `/desk/games/${id}?refused=${encodeURIComponent(words)}`)
    );
  }

  await recordAction(staff, {
    action: "game.status_changed",
    entityTable: "game",
    entityId: id,
    summary: `${before.name} → ${status}`,
    detail: { status },
  });

  revalidatePath("/desk/games");
  revalidatePath(`/desk/games/${id}`);
}
