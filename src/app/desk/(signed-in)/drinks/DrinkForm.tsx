"use client";

import { useActionState } from "react";

import type { FacetGroup } from "@/lib/desk/facets";
import { MIXING_LEVELS, POOL_STATUS, SEASONS } from "@/lib/desk/labels";

import type { Carried } from "@/lib/desk/review";

import styles from "../../desk.module.css";
import { ReviewFields } from "../bits";
import FacetPicker from "../FacetPicker";
import { saveDrink, type DrinkState } from "./actions";

/**
 * A drink, in the five fields it was authored in.
 *
 * The two build lines sit side by side and neither is optional, because they
 * are one record: the same glass, the same components, arriving at the same
 * time. Read the top of db/017 before making the mirror a separate thing, and
 * read docs/drinks.md before summarising one — "self-mixed at the table" and
 * "from the same pitcher fruit" are the craft, and they only survive whole.
 *
 * There is deliberately no recipe field. What a member lacks is not a method,
 * it is knowing what the evening should be.
 */

const INITIAL: DrinkState = { error: null };

export type DrinkValues = {
  id?: string;
  slug?: string;
  name?: string;
  cocktails?: string;
  /** NULL means OWED — her author wrote no twin. db/060 §IV. */
  mocktails?: string | null;
  season?: string;
  season_note?: string;
  season_strict?: boolean;
  making?: string;
  notes?: string | null;
  status?: string;
};

export default function DrinkForm({
  values,
  groups,
  selected,
  weights,
  destinations,
  attached,
  carried,
}: {
  values: DrinkValues;
  groups: readonly FacetGroup[];
  selected: readonly string[];
  weights?: readonly (readonly [string, string])[];
  destinations: readonly { id: string; name: string }[];
  attached: readonly string[];
  /** the review this save must land back inside, if one is running */
  carried?: Carried | null;
}) {
  const [state, action, pending] = useActionState(saveDrink, INITIAL);
  const isAttached = new Set(attached);

  return (
    <form action={action} className={`${styles.form} ${styles.formWide}`}>
      {values.id ? <input type="hidden" name="id" value={values.id} /> : null}
      {/* So that saving mid-review does not end the review. See review.ts. */}
      <ReviewFields carried={carried ?? null} />
      {state.error ? <p className={styles.error}>{state.error}</p> : null}

      <div className={styles.field}>
        <label className={styles.label} htmlFor="cocktails">
          The cocktails, in order
        </label>
        <textarea
          id="cocktails"
          name="cocktails"
          rows={2}
          required
          defaultValue={values.cocktails ?? ""}
          placeholder="Gin and tonics in tall glasses, whiskey sours, sangria in a pitcher"
          className={styles.textarea}
        />
        <span className={styles.hint}>
          One line, your punctuation, in the order they are poured.
        </span>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="mocktails">
          The mirror
        </label>
        {/*
          NOT `required`, and that is db/060 §IV rather than a relaxation.
          Twenty-one of the seventy-six atomic drinks have no mirror because
          their author wrote none, and a browser-side `required` made those
          rows unsavable — including their status, on the one screen that
          exists to settle the debt. An empty mirror is a DRAFT drink; it is
          `saveDrink` that refuses to OFFER one, with the sentence.
        */}
        <textarea
          id="mocktails"
          name="mocktails"
          rows={2}
          defaultValue={values.mocktails ?? ""}
          placeholder="Tonic and lime with cucumber, sour made with lemonade and egg-white foam, fruit punch from the same pitcher fruit"
          className={styles.textarea}
        />
        <span className={styles.hint}>
          The same glass, built from the same components, arriving at the same
          time. Name the glass and the method, so the person holding it has
          something to do with her hands. Never a tumbler of juice.
          {/* `null` is the stored OWED state. `undefined` is the new-drink
              form, which owes nothing yet and is not told that it does. */}
          {values.mocktails === null ? (
            <>
              {" "}
              <strong>This drink&rsquo;s mirror is owed.</strong> Leave it empty
              and the drink stays a draft — nothing can offer it. Write the
              mirror and it can go out. Never invent a weak one to fill the box:
              a named gap is worth more.
            </>
          ) : null}
        </span>
      </div>

      <div className={styles.grid2}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="name">
            What it is for
          </label>
          <input
            id="name"
            name="name"
            required
            defaultValue={values.name ?? ""}
            placeholder="A summer dinner or cocktail party"
            className={styles.input}
          />
          <span className={styles.hint}>
            This is also its name everywhere else in the tool.
          </span>
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
        </div>
      </div>

      <div className={styles.grid3}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="season">
            Season
          </label>
          <select
            id="season"
            name="season"
            defaultValue={values.season ?? "year_round"}
            className={styles.select}
          >
            {SEASONS.map((season) => (
              <option key={season.code} value={season.code}>
                {season.label}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="season_note">
            …in your words
          </label>
          <input
            id="season_note"
            name="season_note"
            defaultValue={values.season_note ?? ""}
            placeholder="Shoulder season and fall · Warm weather · Winter or spring"
            className={styles.input}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Out of season</label>
          <label className={styles.facetItem}>
            <input
              type="checkbox"
              name="season_strict"
              defaultChecked={values.season_strict ?? false}
            />
            <span>Never offer it out of season</span>
          </label>
          <span className={styles.hint}>
            A hard filter, for the bars where the wrong month is wrong rather
            than weak. Off means season is a weight.
          </span>
        </div>
      </div>

      <div className={styles.grid2}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="making">
            How much mixing
          </label>
          <select
            id="making"
            name="making"
            defaultValue={values.making ?? "half_made"}
            className={styles.select}
          >
            {MIXING_LEVELS.map((level) => (
              <option key={level.code} value={level.code}>
                {level.label}
              </option>
            ))}
          </select>
          <span className={styles.hint}>
            The bar&apos;s own natural state, not what a member asked for. The
            same axis the menus use, so one answer from a host governs the
            table and the bar together. Her answer weights toward one end; it
            never eliminates a drink.
          </span>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="notes">
            Internal notes
          </label>
          <input
            id="notes"
            name="notes"
            defaultValue={values.notes ?? ""}
            className={styles.input}
          />
        </div>
      </div>

      <fieldset className={styles.facetBlock}>
        <p className={styles.facetDimension}>Written for</p>
        {destinations.length === 0 ? (
          <p className={styles.hint}>
            No destinations exist yet. A drink with none is general, which is a
            real answer.
          </p>
        ) : (
          <ul className={styles.facetList}>
            {destinations.map((destination) => (
              <li key={destination.id}>
                <label className={styles.facetItem}>
                  <input
                    type="checkbox"
                    name="world"
                    value={destination.id}
                    defaultChecked={isAttached.has(destination.id)}
                  />
                  <span>{destination.name}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </fieldset>

      <div className={styles.field}>
        <span className={styles.label}>What it is like</span>
        <span className={styles.hint}>
          Season and how-much-mixing are not here: they are the fields above,
          and the database projects them into the vocabulary itself.
        </span>
        <FacetPicker
          groups={groups}
          selected={new Set(selected)}
          weights={new Map(weights ?? [])}
        />
      </div>

      <div className={styles.grid2}>
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
        </div>
      </div>

      <div className={styles.buttonRow}>
        <button className={styles.button} disabled={pending}>
          {pending ? "Saving" : values.id ? "Save" : "Add the drink"}
        </button>
      </div>
    </form>
  );
}
