"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { query, queryOne } from "@/lib/db";
import { BANK_KINDS, BANK_PHASES, slugify } from "@/lib/desk/labels";
import {
  clearRequirement,
  declareRequirement,
  requirementNamed,
} from "@/lib/desk/requirements";
import { carryReview } from "@/lib/desk/review";
import { recordAction, requireStaff } from "@/lib/staff";

/**
 * Editing the bank.
 *
 * ── THE DATABASE IS THE AUTHORITY, AND ITS REFUSALS ARE QUOTED ───────
 *
 * db/031 enforces one rule from a trigger rather than a CHECK, because it has
 * to read another row: `technique_card_id` must point at a row of kind
 * `printed_card`, and the exception it raises names the offending kind. The
 * picker on the form only ever offers printed cards, so a curator should never
 * see it — but "should never" is not "cannot": another tab can retype a kind
 * between the page load and the save, and the seeder writes rows this form
 * never saw.
 *
 * So the message is passed through VERBATIM (see `refusal` below). A friendlier
 * sentence invented here would be less true than the one the database wrote,
 * and would hide which row was wrong.
 *
 * ── WHAT IS NOT WRITTEN FROM THIS FILE ──────────────────────────────
 *
 * GESTURES. `world.gesture` is invariant per destination and is not bank
 * content — db/031 is explicit that an invariant in a pool of variables
 * eventually gets left out of a package. The desk shows it beside this pool,
 * read-only, and it is edited where it lives, on the destination record.
 *
 * `world.venue_requirement`, db/033, for the same reason and a sharper one. It
 * is what a DESTINATION's deliverable presupposes, so it belongs to the
 * destination record; and it is read at the reveal and surfaced, NEVER scored,
 * so nothing about it may become a thing a curator adjusts from a pool screen
 * until she has understood which of the two questions she is answering.
 *
 * ── AND THE COLUMN THAT IS NOT WRITTEN BECAUSE IT IS GONE ───────────
 *
 * `bank_item.venue`. db/033 dropped it and dropped the `bank_venue` type with
 * it: a bank item's venue requirement now lives in `ingredient_requirement`,
 * where every other pool's does, and it is written by the two actions at the
 * foot of this file rather than by the item's own save. That is not only
 * because it moved tables — it is the `bank_item_ingredient` rule again, argued
 * at length below: a save that owns a relationship it cannot fully see will
 * eventually destroy one.
 */

export type BankState = { error: string | null };

const KIND_CODES = BANK_KINDS.map((entry) => entry.code);
const PHASE_CODES = BANK_PHASES.map((entry) => entry.code);
const STATUSES = ["draft", "active", "discontinued"];

const UUID = /^[0-9a-f-]{36}$/i;

function trimmed(form: FormData, key: string): string {
  return String(form.get(key) ?? "").trim();
}

/**
 * A refusal, in the words of whoever refused.
 *
 * The slug collision is the one message rewritten, for the reason the products
 * form gives: a curator will hit it, and `bank_item_slug_key` is not a
 * sentence. Everything else — the technique-card trigger above all — is quoted
 * exactly as Postgres raised it.
 */
function refusal(err: unknown, slug: string): BankState {
  const message = err instanceof Error ? err.message : String(err);
  if (message.includes("bank_item_slug_key")) {
    return {
      error: `Another bank item already has the slug "${slug}". Give this one its own.`,
    };
  }
  return { error: message };
}

export async function saveBankItem(
  _previous: BankState,
  form: FormData
): Promise<BankState> {
  const staff = await requireStaff();

  const id = trimmed(form, "id");
  // One line, like every other name in the catalogue. A pasted wrapped line
  // meant one line, so it is collapsed rather than refused.
  const name = trimmed(form, "name").replace(/[\r\n]+/g, " ");
  if (name.length === 0) return { error: "It needs a name." };

  const worldId = trimmed(form, "world_id");
  if (!UUID.test(worldId)) {
    return { error: "Pick the destination this belongs to." };
  }

  const kind = trimmed(form, "kind");
  const phase = trimmed(form, "phase");
  const status = trimmed(form, "status");
  if (!KIND_CODES.includes(kind)) return { error: "Pick what it is." };
  if (!PHASE_CODES.includes(phase)) return { error: "Pick a time of day." };
  if (!STATUSES.includes(status)) return { error: "Unknown status." };

  // BLANK IS A CLAIM, NOT A GAP: db/031 says a null lead time means "no lead
  // time", so an empty box is a complete answer and is stored as null.
  const leadRaw = trimmed(form, "min_lead_days");
  let lead: number | null = null;
  if (leadRaw.length > 0) {
    const days = Number(leadRaw);
    if (!Number.isInteger(days) || days < 0) {
      return {
        error:
          "Lead time is a whole number of days, or blank for a thing that needs none.",
      };
    }
    lead = days;
  }

  // Two states, both of them a sentence on the form. Anything else is a
  // tampered post, and the safe reading of an unreadable one is the one that
  // ships nothing rather than the one that promises a delivery.
  const ships = trimmed(form, "ships") === "true";

  const weightRaw = trimmed(form, "weight");
  const weight = weightRaw.length > 0 ? Number(weightRaw) : 1;
  if (!Number.isFinite(weight) || weight < 0 || weight > 2) {
    return { error: "Weight is a number from 0 to 2. It is a nudge, not a gate." };
  }

  const cardRaw = trimmed(form, "technique_card_id");
  const card = UUID.test(cardRaw) ? cardRaw : null;
  if (card !== null && card === id) {
    return { error: "A card cannot be its own technique card." };
  }

  const slug = slugify(trimmed(form, "slug") || name);

  const values = [
    slug,
    worldId,
    kind,
    name,
    trimmed(form, "description"),
    phase,
    lead,
    ships,
    card,
    // numeric(4,3): sent as text and cast, so no float ever rounds on the way
    // in. node-postgres hands it back as a string for the same reason.
    weight.toFixed(3),
    status,
    trimmed(form, "source_citation"),
  ];

  let itemId = id;
  try {
    if (id) {
      await query(
        `update bank_item
            set slug = $1, world_id = $2, kind = $3::bank_kind, name = $4,
                description = $5, phase = $6::bank_phase,
                min_lead_days = $7, ships = $8,
                technique_card_id = $9, weight = $10::numeric,
                status = $11::product_status, source_citation = $12
          where id = $13`,
        [...values, id]
      );
    } else {
      const rows = await query<{ id: string }>(
        `insert into bank_item
           (slug, world_id, kind, name, description, phase,
            min_lead_days, ships, technique_card_id, weight, status,
            source_citation)
         values ($1,$2,$3::bank_kind,$4,$5,$6::bank_phase,
                 $7,$8,$9,$10::numeric,$11::product_status,$12)
         returning id`,
        values
      );
      itemId = rows[0].id;
    }
  } catch (err) {
    return refusal(err, slug);
  }

  await recordAction(staff, {
    action: id ? "bank_item.updated" : "bank_item.created",
    entityTable: "bank_item",
    entityId: itemId,
    summary: `${name} (${kind}, ${status})`,
    detail: { slug, kind, phase, ships, lead, weight: weight.toFixed(3) },
  });

  revalidatePath("/desk/bank");
  revalidatePath(`/desk/bank/${itemId}`);
  // Back into the review it was saved from, if there was one. See review.ts.
  redirect(carryReview(form, `/desk/bank/${itemId}?saved=1`));
}

/** The one-click move from draft to offered, and back. Dishes' gesture exactly. */
export async function setBankStatus(form: FormData): Promise<void> {
  const staff = await requireStaff();
  const id = String(form.get("id") ?? "");
  const status = String(form.get("status") ?? "");
  if (!UUID.test(id) || !STATUSES.includes(status)) return;

  const before = await queryOne<{ name: string }>(
    `select name from bank_item where id = $1`,
    [id]
  );
  if (!before) return;

  await query(`update bank_item set status = $2::product_status where id = $1`, [
    id,
    status,
  ]);

  await recordAction(staff, {
    action: "bank_item.status_changed",
    entityTable: "bank_item",
    entityId: id,
    summary: `${before.name} → ${status}`,
    detail: { status },
  });

  revalidatePath("/desk/bank");
  revalidatePath(`/desk/bank/${id}`);
}

/**
 * SHOPPABLE ATMOSPHERE — `bank_item_ingredient`, db/031.
 *
 * Its own pair of actions rather than checkboxes inside the item form, for one
 * blunt reason: the product pool is unbounded and a checkbox per product is not
 * a control. A select and an Attach button is the same plain-form idiom the
 * connections grid uses, and it means the item's own save can never silently
 * destroy a link — the failure mode written out at length in the dish form.
 */
export async function attachIngredient(form: FormData): Promise<void> {
  const staff = await requireStaff();
  const id = String(form.get("id") ?? "");
  const productId = String(form.get("product_id") ?? "");
  if (!UUID.test(id) || !UUID.test(productId)) return;

  const note = String(form.get("note") ?? "").trim();

  await query(
    `insert into bank_item_ingredient (bank_item_id, product_id, note)
     values ($1, $2, $3)
     on conflict (bank_item_id, product_id) do update set note = excluded.note`,
    [id, productId, note]
  );

  await recordAction(staff, {
    action: "bank_item.ingredient_attached",
    entityTable: "bank_item",
    entityId: id,
    summary: "a product was attached",
    detail: { productId, note },
  });

  revalidatePath(`/desk/bank/${id}`);
}

export async function detachIngredient(form: FormData): Promise<void> {
  const staff = await requireStaff();
  const id = String(form.get("id") ?? "");
  const productId = String(form.get("product_id") ?? "");
  if (!UUID.test(id) || !UUID.test(productId)) return;

  await query(
    `delete from bank_item_ingredient
      where bank_item_id = $1 and product_id = $2`,
    [id, productId]
  );

  await recordAction(staff, {
    action: "bank_item.ingredient_detached",
    entityTable: "bank_item",
    entityId: id,
    summary: "a product was detached",
    detail: { productId },
  });

  revalidatePath(`/desk/bank/${id}`);
}

/**
 * WHAT IT NEEDS OF THE ROOM — `ingredient_requirement`, db/020 and db/033.
 *
 * The pair sits here rather than inside the item form for the reason the
 * ingredient pair does, and it is not layout: a save that owns a relationship
 * it cannot fully see will eventually destroy one. The old `bank_item.venue`
 * was a single column and could be saved with the row; a set of requirements
 * cannot, because a form that posts an empty set is indistinguishable from a
 * form that was rendered before somebody else declared one.
 *
 * DECLARING AND CLEARING ARE THE SAME GESTURE, in the same place, and neither
 * can be undone by saving an unrelated field. There is no "none" to choose:
 * clearing the last row is the claim that it works anywhere, which is db/020's
 * default and the founder's instruction where it is a judgement call.
 */
export async function declareBankRequirement(form: FormData): Promise<void> {
  const staff = await requireStaff();
  const id = String(form.get("id") ?? "");
  const requirement = String(form.get("requirement") ?? "").trim();
  if (!UUID.test(id)) return;

  // Checked against the table, not a list here — db/020 says the vocabulary is
  // closed only in the sense that adding to it is an INSERT. An unknown code is
  // nothing happening, quietly, rather than a foreign key raised as a 500.
  const kind = await requirementNamed(requirement);
  if (!kind) return;

  const note = String(form.get("note") ?? "").trim();

  await declareRequirement("bank_item", id, requirement, note);

  await recordAction(staff, {
    action: "bank_item.requirement_declared",
    entityTable: "bank_item",
    entityId: id,
    // db/020's `demand` completes "it …", which is what makes an audit line a
    // sentence a person can check rather than a code they have to look up.
    summary: `it ${kind.demand}`,
    detail: { requirement, note },
  });

  revalidatePath("/desk/bank");
  revalidatePath(`/desk/bank/${id}`);
}

export async function clearBankRequirement(form: FormData): Promise<void> {
  const staff = await requireStaff();
  const id = String(form.get("id") ?? "");
  const requirement = String(form.get("requirement") ?? "").trim();
  if (!UUID.test(id)) return;
  const kind = await requirementNamed(requirement);
  if (!kind) return;

  await clearRequirement("bank_item", id, requirement);

  await recordAction(staff, {
    action: "bank_item.requirement_cleared",
    entityTable: "bank_item",
    entityId: id,
    summary: `it no longer ${kind.demand}`,
    detail: { requirement },
  });

  revalidatePath("/desk/bank");
  revalidatePath(`/desk/bank/${id}`);
}
