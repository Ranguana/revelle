"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { query, queryOne } from "@/lib/db";
import { setTags, validFacetIds } from "@/lib/desk/facets";
import { slugify } from "@/lib/desk/labels";
import { recordAction, requireStaff } from "@/lib/staff";

/**
 * Adding the thing she just found.
 *
 * A CSV importer already exists (scripts/import-products.mjs) and is the right
 * tool for forty rows out of a spreadsheet. This is the common case: one
 * object, seen once, added before the tab is closed. The two write the same
 * table and neither is a wrapper around the other.
 */

export type ProductState = { error: string | null };

const BANDS = [
  "under_25",
  "from_25_to_75",
  "from_75_to_200",
  "from_200_to_500",
  "over_500",
];

const STATUSES = ["draft", "active", "discontinued"];

/**
 * Price to band, when the curator did not pick one.
 *
 * The bands are db/002's and the edges are theirs, not a judgement made here.
 * Deriving rather than demanding is the point: she pastes a price, and the
 * filter the selection layer reads is correct without her thinking about it.
 * An explicitly chosen band always wins — sometimes a $180 thing belongs in
 * the bracket above because of what it is.
 */
function bandFor(cents: number | null): string | null {
  if (cents === null) return null;
  if (cents < 2_500) return "under_25";
  if (cents < 7_500) return "from_25_to_75";
  if (cents < 20_000) return "from_75_to_200";
  if (cents < 50_000) return "from_200_to_500";
  return "over_500";
}

function cents(raw: string): number | null {
  const text = raw.replace(/[$,\s]/g, "");
  if (text.length === 0) return null;
  const value = Number(text);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
}

function trimmed(form: FormData, key: string): string {
  return String(form.get(key) ?? "").trim();
}

function nullable(form: FormData, key: string): string | null {
  const value = trimmed(form, key);
  return value.length > 0 ? value : null;
}

export async function saveProduct(
  _previous: ProductState,
  form: FormData
): Promise<ProductState> {
  const staff = await requireStaff();

  const id = trimmed(form, "id");
  const name = trimmed(form, "name");
  if (name.length === 0) return { error: "It needs a name." };

  const slug = slugify(trimmed(form, "slug") || name);
  const priceCents = cents(trimmed(form, "price"));
  const chosenBand = trimmed(form, "price_band");
  const band = BANDS.includes(chosenBand) ? chosenBand : bandFor(priceCents);

  const status = trimmed(form, "status");
  if (!STATUSES.includes(status)) return { error: "Unknown status." };

  const facets = await validFacetIds(
    form.getAll("facet").map((value) => String(value))
  );

  const values = [
    slug,
    name,
    trimmed(form, "description"),
    nullable(form, "external_url"),
    nullable(form, "image_url"),
    band,
    priceCents,
    nullable(form, "supplier"),
    nullable(form, "source_note"),
    status,
  ];

  let productId = id;
  try {
    if (id) {
      await query(
        `update product
            set slug = $1, name = $2, description = $3, external_url = $4,
                image_url = $5, price_band = $6::price_band, price_cents = $7,
                supplier = $8, source_note = $9, status = $10::product_status
          where id = $11`,
        [...values, id]
      );
    } else {
      const rows = await query<{ id: string }>(
        `insert into product
           (slug, name, description, external_url, image_url, price_band,
            price_cents, supplier, source_note, status)
         values ($1,$2,$3,$4,$5,$6::price_band,$7,$8,$9,$10::product_status)
         returning id`,
        values
      );
      productId = rows[0].id;
    }
  } catch (err) {
    // The slug is unique and a curator will collide with one eventually. The
    // database's message is the accurate one; surfacing it beats inventing a
    // friendlier sentence that is less true.
    const message = err instanceof Error ? err.message : String(err);
    return {
      error: message.includes("product_slug_key")
        ? `Another product already has the slug "${slug}". Give this one its own.`
        : message,
    };
  }

  await setTags("product", productId, facets);

  await recordAction(staff, {
    action: id ? "product.updated" : "product.created",
    entityTable: "product",
    entityId: productId,
    summary: `${name} (${status})`,
    detail: { slug, priceCents, band, status, facets: facets.length },
  });

  revalidatePath("/desk/products");
  revalidatePath(`/desk/products/${productId}`);
  redirect(`/desk/products/${productId}?saved=1`);
}

/** The one-click move from draft to offered, and back. */
export async function setProductStatus(form: FormData): Promise<void> {
  const staff = await requireStaff();
  const id = String(form.get("id") ?? "");
  const status = String(form.get("status") ?? "");
  if (!STATUSES.includes(status)) return;

  const before = await queryOne<{ name: string }>(
    `select name from product where id = $1`,
    [id]
  );
  if (!before) return;

  await query(
    `update product set status = $2::product_status where id = $1`,
    [id, status]
  );

  await recordAction(staff, {
    action: "product.status_changed",
    entityTable: "product",
    entityId: id,
    summary: `${before.name} → ${status}`,
    detail: { status },
  });

  revalidatePath("/desk/products");
  revalidatePath(`/desk/products/${id}`);
}
