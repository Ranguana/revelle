"use client";

import { useActionState } from "react";

import type { FacetGroup } from "@/lib/desk/facets";
import {
  COURSES,
  DISH_LEVELS,
  MEAL_SHAPES,
  POOL_STATUS,
  SEASONS,
} from "@/lib/desk/labels";

import styles from "../../desk.module.css";
import FacetPicker from "../FacetPicker";
import { saveDish, type DishState } from "./actions";

/**
 * A dish, in the four fields it was authored in.
 *
 * docs/dishes.md is one line per dish: `- <name> · <B|H|M>` with a season only
 * where it binds. That is the whole record and this is the whole form.
 *
 * There is deliberately no recipe field, no quantity, no method and no serving
 * count. Read the top of db/012 before adding one — a member can cook or she
 * can order; what she lacks is knowing what the evening should be — and then
 * read the top of db/021, which says the same thing again because six hundred
 * dishes is six hundred invitations to add a method box.
 */

const INITIAL: DishState = { error: null };

export type DishValues = {
  id?: string;
  slug?: string;
  name?: string;
  course?: string;
  making?: string;
  season?: string;
  season_note?: string;
  season_strict?: boolean;
  source_note?: string | null;
  notes?: string | null;
  status?: string;
};

export default function DishForm({
  values,
  groups,
  selected,
  weights,
  destinations,
  attached,
  meals,
}: {
  values: DishValues;
  groups: readonly FacetGroup[];
  selected: readonly string[];
  weights?: readonly (readonly [string, string])[];
  destinations: readonly { id: string; name: string }[];
  attached: readonly string[];
  /** db/023's meal_shape codes this dish claims. Empty means every shape. */
  meals: readonly string[];
}) {
  const [state, action, pending] = useActionState(saveDish, INITIAL);
  const isAttached = new Set(attached);
  const claimsMeal = new Set(meals);

  return (
    <form action={action} className={`${styles.form} ${styles.formWide}`}>
      {values.id ? <input type="hidden" name="id" value={values.id} /> : null}
      {state.error ? <p className={styles.error}>{state.error}</p> : null}

      <div className={styles.grid2}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="name">
            The dish
          </label>
          <input
            id="name"
            name="name"
            required
            defaultValue={values.name ?? ""}
            placeholder="Oysters on the half shell"
            className={styles.input}
          />
          <span className={styles.hint}>
            One line, your punctuation. Not a recipe — no quantities, no method,
            no timings. This is also its name everywhere else in the tool.
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
          <span className={styles.hint}>
            Made from the name, and the seed key. Changing it makes the next
            seed create the dish again rather than recognise it.
          </span>
        </div>
      </div>

      <div className={styles.grid2}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="course">
            Course
          </label>
          <select
            id="course"
            name="course"
            defaultValue={values.course ?? "appetizer"}
            className={styles.select}
          >
            {COURSES.map((entry) => (
              <option key={entry.code} value={entry.code}>
                {entry.label}
              </option>
            ))}
          </select>
          <span className={styles.hint}>
            Where it sits in an evening. Not a taste, so it is not a tag.
          </span>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="making">
            How much making
          </label>
          <select
            id="making"
            name="making"
            defaultValue={values.making ?? "half_made"}
            className={styles.select}
          >
            {DISH_LEVELS.map((level) => (
              <option key={level.code} value={level.code}>
                {level.label}
              </option>
            ))}
          </select>
          <span className={styles.hint}>
            The dish&apos;s own natural state, not what a member asked for. Her
            answer weights toward one end; it never eliminates a dish. The same
            axis the menus and the bar are on.
          </span>
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
          <span className={styles.hint}>
            Year-round means it makes no claim about the calendar, which is what
            most dishes do.
          </span>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="season_note">
            …in your words
          </label>
          <input
            id="season_note"
            name="season_note"
            defaultValue={values.season_note ?? ""}
            placeholder="early summer · late summer · fall/winter · Carnival season"
            className={styles.input}
          />
          <span className={styles.hint}>
            Kept verbatim. Four of the eight wordings in the catalogue say
            something the seven-value enum cannot.
          </span>
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
            A hard filter, for a dish whose wrong month is wrong rather than
            weak. Off means season is a weight. Nothing reads it yet — the
            application does not ask when the party is.
          </span>
        </div>
      </div>

      <fieldset className={styles.facetBlock}>
        <p className={styles.facetDimension}>What kind of table it is for</p>
        <ul className={styles.facetList}>
          {MEAL_SHAPES.map((shape) => (
            <li key={shape.code}>
              <label className={styles.facetItem}>
                <input
                  type="checkbox"
                  name="meal"
                  value={shape.code}
                  defaultChecked={claimsMeal.has(shape.code)}
                />
                <span>
                  {shape.label} <em>{shape.letter}</em>
                </span>
              </label>
            </li>
          ))}
        </ul>
        <span className={styles.hint}>
          Tick nothing and it suits every kind of table, which is what all six
          hundred authored dishes currently say. Tick one and it suits that and
          nothing else. The letters are the fourth field of a line in
          docs/dishes.md. Only a long dinner and standing drinks can be reached
          today — the application never asks the time of day.
        </span>
      </fieldset>

      <fieldset className={styles.facetBlock}>
        <p className={styles.facetDimension}>Written for</p>
        {destinations.length === 0 ? (
          <p className={styles.hint}>
            No destinations exist yet. A dish with none is general, which for a
            dish is almost never true.
          </p>
        ) : (
          <>
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
            <span className={styles.hint}>
              A claim, not a weight: a dish that names any destination is
              offered at those and nowhere else. Ticking several is how one dish
              belongs to several houses. A destination forbidden or re-weighted
              at the deliverables desk is not shown here and is not touched by
              saving this.
            </span>
          </>
        )}
      </fieldset>

      <div className={styles.field}>
        <span className={styles.label}>What it is like</span>
        <span className={styles.hint}>
          Course, season and how-much-making are not here: they are the fields
          above, and the database projects the last two into the vocabulary
          itself. Course is not a taste at all.
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

      {values.source_note ? (
        <div className={styles.field}>
          <span className={styles.label}>From the seed</span>
          <p className={styles.hint}>{values.source_note}</p>
        </div>
      ) : null}

      <div className={styles.buttonRow}>
        <button className={styles.button} disabled={pending}>
          {pending ? "Saving" : values.id ? "Save" : "Add the dish"}
        </button>
      </div>
    </form>
  );
}
