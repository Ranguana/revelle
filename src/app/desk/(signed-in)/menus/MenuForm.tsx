"use client";

import { useActionState } from "react";

import type { FacetGroup } from "@/lib/desk/facets";
import { COOKING_LEVELS, POOL_STATUS, SEASONS } from "@/lib/desk/labels";

import styles from "../../desk.module.css";
import FacetPicker from "../FacetPicker";
import { saveMenu, type MenuState } from "./actions";

/**
 * A menu, in the four fields it was authored in.
 *
 * `dishes` is one line, in her punctuation, not decomposed into courses. The
 * catalogue is written that way and splitting her list on commas would be a
 * guess applied to somebody's writing — "chilled langoustines with garlic
 * mayonnaise, champagne" is two things and "caviar with blini and crème
 * fraîche" is one. db/012 argues it at length.
 *
 * There is deliberately no recipe field. Read the top of db/012 before adding
 * one: a member can cook or she can order; what she lacks is knowing what the
 * evening should be.
 */

const INITIAL: MenuState = { error: null };

export type MenuValues = {
  id?: string;
  slug?: string;
  name?: string;
  dishes?: string;
  season?: string;
  season_note?: string;
  season_strict?: boolean;
  cooking?: string;
  cooking_note?: string;
  notes?: string | null;
  status?: string;
};

export default function MenuForm({
  values,
  groups,
  selected,
  weights,
  destinations,
  attached,
}: {
  values: MenuValues;
  groups: readonly FacetGroup[];
  selected: readonly string[];
  weights?: readonly (readonly [string, string])[];
  destinations: readonly { id: string; name: string }[];
  attached: readonly string[];
}) {
  const [state, action, pending] = useActionState(saveMenu, INITIAL);
  const isAttached = new Set(attached);

  return (
    <form action={action} className={`${styles.form} ${styles.formWide}`}>
      {values.id ? <input type="hidden" name="id" value={values.id} /> : null}
      {state.error ? <p className={styles.error}>{state.error}</p> : null}

      <div className={styles.field}>
        <label className={styles.label} htmlFor="dishes">
          The dishes, in order
        </label>
        <textarea
          id="dishes"
          name="dishes"
          rows={3}
          required
          defaultValue={values.dishes ?? ""}
          placeholder="Steamed clams with broth and butter, boiled lobsters, corn, red potatoes, Portuguese sausage, blueberry pie"
          className={styles.textarea}
        />
        <span className={styles.hint}>
          One line, your punctuation, in the order it is eaten. Not a recipe —
          no quantities, no method, no timings. A menu item is a line.
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
            placeholder="A big outdoor dinner, newspaper on the table"
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
            placeholder="High summer · Late August · Winter, works year-round"
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
            A hard filter, for the menus where the wrong month is wrong rather
            than weak. Off means season is a weight.
          </span>
        </div>
      </div>

      <div className={styles.grid2}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="cooking">
            How much cooking
          </label>
          <select
            id="cooking"
            name="cooking"
            defaultValue={values.cooking ?? "half_made"}
            className={styles.select}
          >
            {COOKING_LEVELS.map((level) => (
              <option key={level.code} value={level.code}>
                {level.label}
              </option>
            ))}
          </select>
          <span className={styles.hint}>
            The menu&apos;s own natural state, not what a member asked for. Her
            answer weights toward one end; it never eliminates a menu.
          </span>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="cooking_note">
            A note on the making
          </label>
          <input
            id="cooking_note"
            name="cooking_note"
            defaultValue={values.cooking_note ?? ""}
            className={styles.input}
          />
          <span className={styles.hint}>
            For a curator, and read by nothing else. The three values above
            carry how a menu bends; this is where a reason goes.
          </span>
        </div>
      </div>

      <fieldset className={styles.facetBlock}>
        <p className={styles.facetDimension}>Written for</p>
        {destinations.length === 0 ? (
          <p className={styles.hint}>
            No destinations exist yet. A menu with none is general, which is a
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
          Season and how-much-cooking are not here: they are the fields above,
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

      <div className={styles.buttonRow}>
        <button className={styles.button} disabled={pending}>
          {pending ? "Saving" : values.id ? "Save" : "Add the menu"}
        </button>
      </div>
    </form>
  );
}
