"use client";

import { useActionState } from "react";

import type { FacetGroup } from "@/lib/desk/facets";
import { PRICE_BANDS, POOL_STATUS } from "@/lib/desk/labels";

import styles from "../../desk.module.css";
import FacetPicker from "../FacetPicker";
import { saveProduct, type ProductState } from "./actions";

/**
 * The form. One screen, everything on it, no wizard.
 *
 * The order of the fields is the order she has them: she found the thing, so
 * the URL comes first, then what it is, then what it costs, then who has it,
 * then what it is LIKE — which is the only part that takes thought and is
 * therefore last.
 */

const INITIAL: ProductState = { error: null };

export type ProductValues = {
  id?: string;
  slug?: string;
  name?: string;
  description?: string;
  external_url?: string | null;
  image_url?: string | null;
  price_cents?: number | null;
  price_band?: string | null;
  supplier?: string | null;
  source_note?: string | null;
  status?: string;
};

export default function ProductForm({
  values,
  groups,
  selected,
  weights,
}: {
  values: ProductValues;
  groups: readonly FacetGroup[];
  selected: readonly string[];
  weights?: readonly (readonly [string, string])[];
}) {
  const [state, action, pending] = useActionState(saveProduct, INITIAL);

  return (
    <form action={action} className={`${styles.form} ${styles.formWide}`}>
      {values.id ? <input type="hidden" name="id" value={values.id} /> : null}

      {state.error ? <p className={styles.error}>{state.error}</p> : null}

      <div className={styles.field}>
        <label className={styles.label} htmlFor="external_url">
          Where she buys it
        </label>
        <input
          id="external_url"
          name="external_url"
          type="url"
          defaultValue={values.external_url ?? ""}
          placeholder="https://"
          className={styles.input}
        />
        <span className={styles.hint}>
          Revelle sends her to the source. There is no checkout, so this is the
          whole commerce integration.
        </span>
      </div>

      <div className={styles.grid2}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="name">
            Name
          </label>
          <input
            id="name"
            name="name"
            required
            defaultValue={values.name ?? ""}
            className={styles.input}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="slug">
            Slug
          </label>
          <input
            id="slug"
            name="slug"
            defaultValue={values.slug ?? ""}
            placeholder="made from the name"
            className={styles.input}
          />
          <span className={styles.hint}>
            Permanent and never reused. Leave it blank and one is made.
          </span>
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={values.description ?? ""}
          className={styles.textarea}
        />
      </div>

      <div className={styles.grid3}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="price">
            Price
          </label>
          <input
            id="price"
            name="price"
            inputMode="decimal"
            defaultValue={
              values.price_cents === null || values.price_cents === undefined
                ? ""
                : (values.price_cents / 100).toFixed(2)
            }
            placeholder="48.00"
            className={styles.input}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="price_band">
            Band
          </label>
          <select
            id="price_band"
            name="price_band"
            defaultValue={values.price_band ?? ""}
            className={styles.select}
          >
            <option value="">From the price</option>
            {PRICE_BANDS.map((band) => (
              <option key={band.code} value={band.code}>
                {band.label}
              </option>
            ))}
          </select>
          <span className={styles.hint}>
            Only choose one when the price is misleading.
          </span>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="status">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={values.status ?? "draft"}
            className={styles.select}
          >
            {Object.entries(POOL_STATUS).map(([code, label]) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>
          <span className={styles.hint}>Only Active can be issued.</span>
        </div>
      </div>

      <div className={styles.grid2}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="supplier">
            Supplier
          </label>
          <input
            id="supplier"
            name="supplier"
            defaultValue={values.supplier ?? ""}
            className={styles.input}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="image_url">
            Image URL
          </label>
          <input
            id="image_url"
            name="image_url"
            type="url"
            defaultValue={values.image_url ?? ""}
            className={styles.input}
          />
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="source_note">
          Anything internal
        </label>
        <textarea
          id="source_note"
          name="source_note"
          rows={2}
          defaultValue={values.source_note ?? ""}
          placeholder="Lead time, affiliate terms, the fact that it sells out every June"
          className={styles.textarea}
        />
        <span className={styles.hint}>Never shown to a member.</span>
      </div>

      <div className={styles.field}>
        <span className={styles.label}>What it is like</span>
        <FacetPicker
          groups={groups}
          selected={new Set(selected)}
          weights={new Map(weights ?? [])}
        />
      </div>

      <div className={styles.buttonRow}>
        <button className={styles.button} disabled={pending}>
          {pending ? "Saving" : values.id ? "Save" : "Add it"}
        </button>
      </div>
    </form>
  );
}
