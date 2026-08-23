"use client";

import { useActionState } from "react";

import type { FacetGroup } from "@/lib/desk/facets";
import { OCCASIONS, optionLabel } from "@/lib/desk/labels";
import type { Carried } from "@/lib/desk/review";
import { HOUSE } from "@/lib/tokens";

import styles from "../../desk.module.css";
import FacetPicker from "../FacetPicker";
import { ReviewFields } from "../bits";
import { saveDestination, type DestinationState } from "./actions";

/**
 * The LOOK half of a destination, plus its identity and its matching aids.
 *
 * The voice is a separate screen because it is versioned and this is not — see
 * the note at the top of actions.ts. Putting them on one page would put a Save
 * button next to a document that must never be saved over.
 *
 * ── WHY COLOUR INPUTS AND NOT A JSON BOX ────────────────────────────
 *
 * `world.tokens` is jsonb and would accept anything. The entire argument for a
 * look being DATA (src/lib/tokens.ts) is that a token set "can be ugly but
 * cannot leak arbitrary CSS", and a textarea of raw JSON hands that back. Every
 * colour here is a named token, validated as a hex value on the way in.
 */

const INITIAL: DestinationState = { error: null };

const PALETTE: readonly (readonly [string, string])[] = [
  ["ground", "Ground"],
  ["ground2", "Ground, second"],
  ["ink", "Ink"],
  ["inkSoft", "Ink, soft"],
  ["inkFaint", "Ink, faint"],
  ["rule", "Rule"],
  ["aqua", "Aqua"],
  ["oxblood", "Oxblood"],
  ["gold", "Gold"],
  ["night", "Night"],
  ["night2", "Night, second"],
  ["nightInk", "Night ink"],
  ["nightSoft", "Night soft"],
  ["nightAqua", "Night aqua"],
  ["nightOxblood", "Night oxblood"],
  ["bone", "Bone (the arc)"],
];

const DARK: readonly (readonly [string, string])[] = [
  ["ground", "Ground"],
  ["ground2", "Ground, second"],
  ["ink", "Ink"],
  ["inkSoft", "Ink, soft"],
  ["inkFaint", "Ink, faint"],
  ["rule", "Rule"],
  ["aqua", "Aqua"],
  ["oxblood", "Oxblood"],
  ["gold", "Gold"],
];

export type DestinationValues = {
  id?: string;
  slug?: string;
  name?: string;
  tagline?: string;
  description?: string;
  cover_image_url?: string | null;
  notes?: string | null;
  fits_occasions?: string[];
  tokens?: {
    palette?: Record<string, string>;
    paletteDark?: Record<string, string>;
    type?: { display?: string; body?: string; mono?: string };
  };
};

export default function DestinationForm({
  values,
  groups,
  selected,
  weights,
  carried,
}: {
  values: DestinationValues;
  groups: readonly FacetGroup[];
  selected: readonly string[];
  weights?: readonly (readonly [string, string])[];
  /** the review this save must land back inside, if one is running */
  carried?: Carried | null;
}) {
  const [state, action, pending] = useActionState(saveDestination, INITIAL);

  const palette = values.tokens?.palette ?? {};
  const dark = values.tokens?.paletteDark ?? {};
  const type = values.tokens?.type ?? {};
  const occasions = new Set(values.fits_occasions ?? []);

  return (
    <form action={action} className={`${styles.form} ${styles.formWide}`}>
      {values.id ? <input type="hidden" name="id" value={values.id} /> : null}
      {/* So that saving mid-review does not end the review. See review.ts. */}
      <ReviewFields carried={carried ?? null} />
      {state.error ? <p className={styles.error}>{state.error}</p> : null}

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
            placeholder="WESTHAMPTON, 1976"
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
            className={styles.input}
          />
          <span className={styles.hint}>Permanent. Never reused.</span>
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="tagline">
          Tagline
        </label>
        <input
          id="tagline"
          name="tagline"
          required
          defaultValue={values.tagline ?? ""}
          placeholder="Vintage summer glamour. Very questionable houseguests."
          className={styles.input}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="description">
          The premise
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={values.description ?? ""}
          placeholder="A place and a time, then concrete details. No adjective naming the feeling."
          className={styles.textarea}
        />
        <span className={styles.hint}>
          This is what a writer is standing in. It goes into every prompt.
        </span>
      </div>

      <fieldset className={styles.facetBlock}>
        <p className={styles.facetDimension}>The palette</p>
        <div className={styles.grid3}>
          {PALETTE.map(([token, label]) => (
            <div key={token} className={styles.field}>
              <label className={styles.label} htmlFor={`palette_${token}`}>
                {label}
              </label>
              <input
                id={`palette_${token}`}
                name={`palette_${token}`}
                type="color"
                defaultValue={
                  palette[token] ??
                  HOUSE.palette[token as keyof typeof HOUSE.palette]
                }
                className={styles.input}
              />
            </div>
          ))}
        </div>

        <p className={styles.facetDimension} style={{ marginTop: "0.75rem" }}>
          Dark — only the overrides
        </p>
        <div className={styles.grid3}>
          {DARK.map(([token, label]) => (
            <div key={token} className={styles.field}>
              <label className={styles.label} htmlFor={`dark_${token}`}>
                {label}
              </label>
              <input
                id={`dark_${token}`}
                name={`dark_${token}`}
                type="color"
                defaultValue={
                  dark[token] ??
                  HOUSE.paletteDark[token as keyof typeof HOUSE.paletteDark] ??
                  "#000000"
                }
                className={styles.input}
              />
            </div>
          ))}
        </div>
      </fieldset>

      <div className={styles.grid3}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="type_display">
            Display face
          </label>
          <input
            id="type_display"
            name="type_display"
            defaultValue={type.display ?? HOUSE.type.display}
            className={styles.input}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="type_body">
            Body face
          </label>
          <input
            id="type_body"
            name="type_body"
            defaultValue={type.body ?? HOUSE.type.body}
            className={styles.input}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="type_mono">
            Mono face
          </label>
          <input
            id="type_mono"
            name="type_mono"
            defaultValue={type.mono ?? HOUSE.type.mono}
            className={styles.input}
          />
        </div>
      </div>
      <p className={styles.hint}>
        Only three families ship (see src/app/fonts.css, which is generated).
        Naming a fourth falls through to a system fallback silently — a new face
        means adding it to the font build and shipping the woff2.
      </p>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="cover_image_url">
          Cover image URL
        </label>
        <input
          id="cover_image_url"
          name="cover_image_url"
          type="url"
          defaultValue={values.cover_image_url ?? ""}
          className={styles.input}
        />
      </div>

      <fieldset className={styles.facetBlock}>
        <p className={styles.facetDimension}>Fits these occasions</p>
        <ul className={styles.facetList}>
          {OCCASIONS.map((code) => (
            <li key={code}>
              <label className={styles.facetItem}>
                <input
                  type="checkbox"
                  name="occasion"
                  value={code}
                  defaultChecked={occasions.has(code)}
                />
                <span>{optionLabel("occasion", code)}</span>
              </label>
            </li>
          ))}
        </ul>
        <p className={styles.hint}>
          A positive signal that scores. It is not a gate — a destination is
          meant to carry every occasion in a different shape. The rare veto is
          on the deliverables screen.
        </p>
      </fieldset>

      <div className={styles.field}>
        <span className={styles.label}>How it sounds, and what it is like</span>
        <span className={styles.hint}>
          The same fifty tones a host is shown, plus the taste vocabulary. Both
          sides say it in the same words, which is what makes matching a set
          operation. Six terms is a description; fewer is a label.
        </span>
        <FacetPicker
          groups={groups}
          selected={new Set(selected)}
          weights={new Map(weights ?? [])}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="notes">
          Internal notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          defaultValue={values.notes ?? ""}
          className={styles.textarea}
        />
      </div>

      <div className={styles.buttonRow}>
        <button className={styles.button} disabled={pending}>
          {pending ? "Saving" : values.id ? "Save the look" : "Create it"}
        </button>
      </div>
    </form>
  );
}
