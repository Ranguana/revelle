"use client";

import { useActionState } from "react";

import type { FacetGroup } from "@/lib/desk/facets";
import {
  GAME_SHAPES,
  GAME_SOURCING,
  HOST_ROLES,
  POOL_STATUS,
} from "@/lib/desk/labels";

import type { Carried } from "@/lib/desk/review";

import styles from "../../desk.module.css";
import { ReviewFields } from "../bits";
import FacetPicker from "../FacetPicker";
import { saveGame, type GameState } from "./actions";

/**
 * A game, in the fields src/lib/games.ts authors it in.
 *
 * The order is the order a curator reads one: what it is, then what it does to
 * an evening, then who it takes and how long, then the rules that get printed,
 * then what it costs her to run, then what it is LIKE — which is the only part
 * that takes thought and is therefore last. The same argument ProductForm makes
 * about the order of its fields.
 *
 * ── THE SCORING BOX IS NOT A LEADERBOARD ────────────────────────────
 *
 * docs/copy-brief.md bans points, streaks and leaderboards, and both
 * src/lib/games.ts and db/010 spend a paragraph saying that the ban governs
 * REVELLE'S OWN INTERFACE and has nothing to say about a scavenger hunt in
 * which a foreign coin is worth twenty. `scoring` and `currencyLabel` are game
 * rules, printed on game materials and read aloud by a host. The hint under the
 * field says so, because this keeps being misread.
 *
 * ── WHAT IS NOT ON THIS FORM ────────────────────────────────────────
 *
 * The runbook, the supplies, the printed matter, the requirements, the
 * dependencies and the three scoping registries. They are rendered beside this
 * form, in full, and they are authored in src/lib/games.ts. actions.ts argues
 * that cut at length; the short version is that it is the same cut
 * /desk/destinations makes between a look, which is edited in place, and a
 * voice, which is not.
 */

const INITIAL: GameState = { error: null, hint: null };

export type GameValues = {
  id?: string;
  slug?: string;
  name?: string;
  description?: string;
  how_it_works?: string;
  materials?: string | null;
  shape?: string;
  sourcing?: string;
  duration_minutes?: number | null;
  duration_max_minutes?: number | null;
  min_guests?: number | null;
  max_guests?: number | null;
  scoring?: string | null;
  currency_label?: string | null;
  external_name?: string | null;
  external_url?: string | null;
  caveat?: string | null;
  host_role?: string;
  host_note?: string | null;
  source_note?: string | null;
  notes?: string | null;
  status?: string;
};

/** A nullable integer column in a text box. Null is empty, never a zero. */
function num(value: number | null | undefined): string {
  return value === null || value === undefined ? "" : String(value);
}

export default function GameForm({
  values,
  groups,
  selected,
  weights,
  carried,
}: {
  values: GameValues;
  groups: readonly FacetGroup[];
  selected: readonly string[];
  weights?: readonly (readonly [string, string])[];
  /** the review this save must land back inside, if one is running */
  carried?: Carried | null;
}) {
  const [state, action, pending] = useActionState(saveGame, INITIAL);

  return (
    <form action={action} className={`${styles.form} ${styles.formWide}`}>
      {values.id ? <input type="hidden" name="id" value={values.id} /> : null}
      {/* So that saving mid-review does not end the review. See review.ts. */}
      <ReviewFields carried={carried ?? null} />

      {state.error ? (
        <p className={styles.error}>
          {state.error}
          {state.hint ? `\n\n${state.hint}` : ""}
        </p>
      ) : null}

      <div className={styles.grid2}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="name">
            The game
          </label>
          <input
            id="name"
            name="name"
            required
            defaultValue={values.name ?? ""}
            placeholder="Art Battle"
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
            The seed key. Changing it makes the next{" "}
            <code>npm run seed:games</code> create the game again from
            src/lib/games.ts rather than recognise this one.
          </span>
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="description">
          The card
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          required
          defaultValue={values.description ?? ""}
          className={styles.textarea}
        />
        <span className={styles.hint}>
          One or two sentences, in the house&rsquo;s register. This is what she
          reads in her Revelle and it stays a teaser — the instructions are the
          runbook, and db/025 says why the two are different documents with
          different readers.
        </span>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="how_it_works">
          How it works
        </label>
        <textarea
          id="how_it_works"
          name="how_it_works"
          rows={8}
          defaultValue={values.how_it_works ?? ""}
          className={styles.textarea}
        />
        <span className={styles.hint}>
          The prose account, read while she is CHOOSING. Not the instructions.
        </span>
      </div>

      <div className={styles.grid3}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="shape">
            What it does to an evening
          </label>
          <select
            id="shape"
            name="shape"
            defaultValue={values.shape ?? "scheduled"}
            className={styles.select}
          >
            {GAME_SHAPES.map((entry) => (
              <option key={entry.code} value={entry.code}>
                {entry.label}
              </option>
            ))}
          </select>
          <span className={styles.hint}>
            Ambient runs underneath the night and takes no block — so it carries
            no duration, and the database refuses one.
          </span>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="sourcing">
            Ours, or somebody else&rsquo;s
          </label>
          <select
            id="sourcing"
            name="sourcing"
            defaultValue={values.sourcing ?? "provided"}
            className={styles.select}
          >
            {GAME_SOURCING.map((entry) => (
              <option key={entry.code} value={entry.code}>
                {entry.label}
              </option>
            ))}
          </select>
          <span className={styles.hint}>
            Recommended means the house may name it and may not print a rule or
            a card for it. It needs the name below.
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
          <span className={styles.hint}>
            Only Active can be issued. A new game is a draft whatever this says.
          </span>
        </div>
      </div>

      <div className={styles.grid2}>
        <div className={styles.field}>
          <span className={styles.label}>How long it runs</span>
          <div className={styles.grid2}>
            <input
              name="duration_minutes"
              inputMode="numeric"
              defaultValue={num(values.duration_minutes)}
              placeholder="45"
              aria-label="The planning figure, in minutes"
              className={styles.input}
            />
            <input
              name="duration_max_minutes"
              inputMode="numeric"
              defaultValue={num(values.duration_max_minutes)}
              placeholder="60"
              aria-label="The longest it runs, in minutes"
              className={styles.input}
            />
          </div>
          <span className={styles.hint}>
            The planning figure and the top of the range, in minutes. Both empty
            on an ambient game.
          </span>
        </div>
        <div className={styles.field}>
          <span className={styles.label}>The group it works for</span>
          <div className={styles.grid2}>
            <input
              name="min_guests"
              inputMode="numeric"
              defaultValue={num(values.min_guests)}
              placeholder="6"
              aria-label="The smallest group"
              className={styles.input}
            />
            <input
              name="max_guests"
              inputMode="numeric"
              defaultValue={num(values.max_guests)}
              placeholder="no ceiling"
              aria-label="The largest group"
              className={styles.input}
            />
          </div>
          <span className={styles.hint}>
            A CONSTRAINT and never a score: a game outside her group size is
            filtered out, not weighted down. Empty means no limit at that end.
          </span>
        </div>
      </div>

      <div className={styles.grid2}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="scoring">
            How it is scored or judged
          </label>
          <textarea
            id="scoring"
            name="scoring"
            rows={3}
            defaultValue={values.scoring ?? ""}
            className={styles.textarea}
          />
          <span className={styles.hint}>
            A GAME RULE, printed on the materials and read aloud. The ban on
            points and leaderboards in docs/copy-brief.md is about Revelle&rsquo;s
            own interface and does not reach a party game — see the top of
            db/010. Do not sanitise this.
          </span>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="currency_label">
            What the currency is called
          </label>
          <input
            id="currency_label"
            name="currency_label"
            defaultValue={values.currency_label ?? ""}
            placeholder="Party Bucks"
            className={styles.input}
          />
          <span className={styles.hint}>
            Only where something accumulates across the evening and is spent at
            the end. It is printed in her destination&rsquo;s own typeface.
          </span>
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="materials">
          What it needs, in a sentence
        </label>
        <textarea
          id="materials"
          name="materials"
          rows={2}
          defaultValue={values.materials ?? ""}
          className={styles.textarea}
        />
        <span className={styles.hint}>
          The sentence a host reads. The counted, dated version is the supply
          list beside this form, and it is authored in src/lib/games.ts.
        </span>
      </div>

      <div className={styles.grid2}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="external_name">
            What it is called out there
          </label>
          <input
            id="external_name"
            name="external_name"
            defaultValue={values.external_name ?? ""}
            className={styles.input}
          />
          <span className={styles.hint}>
            Recommended games only, and required for them. A provided game with
            anything here is refused.
          </span>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="external_url">
            Where to get it
          </label>
          <input
            id="external_url"
            name="external_url"
            type="url"
            defaultValue={values.external_url ?? ""}
            placeholder="https://"
            className={styles.input}
          />
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="caveat">
          What can go wrong that is not ours to fix
        </label>
        <textarea
          id="caveat"
          name="caveat"
          rows={2}
          defaultValue={values.caveat ?? ""}
          className={styles.textarea}
        />
        <span className={styles.hint}>
          An app that can be pulled, renamed or paywalled between the day this
          is designed and the night it is run. Shown to a host, not hidden.
        </span>
      </div>

      <div className={styles.grid2}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="host_role">
            Is she playing?
          </label>
          <select
            id="host_role"
            name="host_role"
            defaultValue={values.host_role ?? "plays_too"}
            className={styles.select}
          >
            {HOST_ROLES.map((entry) => (
              <option key={entry.code} value={entry.code}>
                {entry.label}
              </option>
            ))}
          </select>
          <span className={styles.hint}>
            Running it spends a person. She needs to know before she starts, not
            at the moment it begins.
          </span>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="host_note">
            What running it costs her
          </label>
          <textarea
            id="host_note"
            name="host_note"
            rows={2}
            defaultValue={values.host_note ?? ""}
            className={styles.textarea}
          />
        </div>
      </div>

      <div className={styles.grid2}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="source_note">
            Whose it is
          </label>
          <textarea
            id="source_note"
            name="source_note"
            rows={2}
            defaultValue={values.source_note ?? ""}
            placeholder="The founder's own. Written and run at real parties."
            className={styles.textarea}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="notes">
            Anything internal
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={2}
            defaultValue={values.notes ?? ""}
            className={styles.textarea}
          />
          <span className={styles.hint}>Never shown to a member.</span>
        </div>
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
