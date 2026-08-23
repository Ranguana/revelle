"use client";

import { useActionState } from "react";

import {
  BANK_KINDS,
  BANK_PHASES,
  BANK_SHIPS,
  POOL_STATUS,
} from "@/lib/desk/labels";

import type { Carried } from "@/lib/desk/review";

import styles from "../../desk.module.css";
import { ReviewFields } from "../bits";
import { saveBankItem, type BankState } from "./actions";

/**
 * One bank item, in the fields db/031 gives it and db/033 left it.
 *
 * ── THE TWO FIELDS THAT ARE READ WRONG IF THEY ARE LABELLED RIGHT ────
 *
 * Two of these columns have a value whose NAME is the opposite of its meaning,
 * and each is worded here rather than glossed in a tooltip nobody opens:
 *
 *   phase = all     is NO OPINION. Not "every phase" and not "always". Shown as
 *                   "No opinion", never as "All". Four real times of day sit
 *                   above it, in the order the day runs.
 *   ships = false   is OWNED-IF-PRESENT. Not "out of stock". Shown as a
 *                   sentence, never as an unticked box, because an unticked box
 *                   is an absence and this is a claim.
 *
 * ── AND THE THIRD, WHICH IS NO LONGER A FIELD ───────────────────────
 *
 * WHERE IT CAN HAPPEN. It was `bank_item.venue`, a select on this form, and
 * db/033 dropped the column: a bank item's venue requirement now lives in
 * `ingredient_requirement` beside every other pool's. Its grades survive the
 * move and are still never one control with an on and an off — the hard one is
 * a veto, the soft one is not — but they are declared in their own panel on the
 * item's own screen, not saved with the row. actions.ts argues that cut.
 *
 * The hint in this form's place says so, and says the thing a curator most
 * needs to hear: DECLARING NOTHING IS A COMPLETE ANSWER.
 *
 * There is no tag picker on this form: db/031 registers the pool for publishing
 * and issuance but does not call `install_facet_tags`, so `bank_item_facet`
 * does not exist and a picker here would write to a table that is not there.
 */

const INITIAL: BankState = { error: null };

export type BankValues = {
  id?: string;
  slug?: string;
  world_id?: string;
  kind?: string;
  name?: string;
  description?: string;
  phase?: string;
  min_lead_days?: number | string | null;
  ships?: boolean;
  technique_card_id?: string | null;
  /** numeric(4,3) — a string out of node-postgres, and kept one. */
  weight?: string | null;
  status?: string;
  source_citation?: string;
};

export default function BankForm({
  values,
  destinations,
  cards,
  carried,
}: {
  values: BankValues;
  destinations: readonly { id: string; name: string }[];
  /** the review this save must land back inside, if one is running */
  carried?: Carried | null;
  /** Every `printed_card` in the library, and nothing else. See the hint. */
  cards: readonly { id: string; name: string; world_name: string }[];
}) {
  const [state, action, pending] = useActionState(saveBankItem, INITIAL);

  const lead =
    values.min_lead_days === null || values.min_lead_days === undefined
      ? ""
      : String(values.min_lead_days);

  return (
    <form action={action} className={`${styles.form} ${styles.formWide}`}>
      {values.id ? <input type="hidden" name="id" value={values.id} /> : null}
      {/* So that saving mid-review does not end the review. See review.ts. */}
      <ReviewFields carried={carried ?? null} />
      {state.error ? <p className={styles.error}>{state.error}</p> : null}

      <div className={styles.grid2}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="name">
            The line
          </label>
          <input
            id="name"
            name="name"
            required
            defaultValue={values.name ?? ""}
            placeholder="The good chess set, out on the low table"
            className={styles.input}
          />
          <span className={styles.hint}>
            One line, your punctuation. This is its name everywhere else in the
            tool.
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
            seed create the item again rather than recognise it.
          </span>
        </div>
      </div>

      <div className={styles.grid2}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="world_id">
            Destination
          </label>
          <select
            id="world_id"
            name="world_id"
            required
            defaultValue={values.world_id ?? ""}
            className={styles.select}
          >
            <option value="">Pick one</option>
            {destinations.map((destination) => (
              <option key={destination.id} value={destination.id}>
                {destination.name}
              </option>
            ))}
          </select>
          <span className={styles.hint}>
            The bank is per destination and every item has exactly one — this is
            not a weight and there is no general pool. Moving an item here moves
            it out of one house&rsquo;s bank and into another&rsquo;s.
          </span>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="kind">
            What it is
          </label>
          <select
            id="kind"
            name="kind"
            defaultValue={values.kind ?? "good"}
            className={styles.select}
          >
            {BANK_KINDS.map((entry) => (
              <option key={entry.code} value={entry.code}>
                {entry.label}
              </option>
            ))}
          </select>
          <span className={styles.hint}>
            The four kinds behave identically — this is the word a curator uses,
            not a difference the engine sees. &ldquo;A game in the room&rdquo; is
            something the house has out, like backgammon; the authored games
            with rules and runbooks are a different pool, at /desk/games.
          </span>
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="description">
          What it is
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={values.description ?? ""}
          className={styles.textarea}
        />
        <span className={styles.hint}>
          Enough for a curator to know what she is choosing. Not the scene card
          copy — that is written where the writing is done.
        </span>
      </div>

      <div className={styles.grid2}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="phase">
            Time of day
          </label>
          <select
            id="phase"
            name="phase"
            defaultValue={values.phase ?? "all"}
            className={styles.select}
          >
            {BANK_PHASES.map((entry) => (
              <option key={entry.code} value={entry.code}>
                {entry.label} — {entry.gloss}
              </option>
            ))}
          </select>
          <span className={styles.hint}>
            <strong>No opinion is the default and means exactly that:</strong>{" "}
            this line makes no claim about when it belongs. It does{" "}
            <em>not</em> mean every phase and it does <em>not</em> mean always.
            Pick one of the other four only when the wrong hour would be wrong.
            Dawn is not dark — it is the windows going blue, which is the
            opposite of deep night.
          </span>
        </div>
        {/*
          NOT A FIELD, AND SAYING SO IS THE POINT. A curator who edited this
          form last month will look here for the venue select. It is gone with
          the column db/033 dropped, and the sentence below is where she is
          told what replaced it and where — the alternative is her concluding
          the constraint stopped mattering.
        */}
        <div className={styles.field}>
          <span className={styles.label}>What it needs of the room</span>
          <p className={styles.hint}>
            <strong>Declared on this item&rsquo;s own screen</strong>, in its
            own panel, the way the products it buys are — not saved with this
            form. It is the one vocabulary the whole catalogue uses for the
            room, so a bank item asks for outdoors, live fire or a real kitchen
            in the same words a menu does.
          </p>
          <span className={styles.hint}>
            <strong>Declaring nothing is a complete answer.</strong> No
            requirement means it works anywhere, which is the default and
            usually right — a wrong tag deletes a line silently and forever, a
            missing one costs a second look.
          </span>
        </div>
      </div>

      <div className={styles.grid3}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="ships">
            What arrives
          </label>
          <select
            id="ships"
            name="ships"
            defaultValue={String(values.ships ?? true)}
            className={styles.select}
          >
            {BANK_SHIPS.map((entry) => (
              <option key={String(entry.value)} value={String(entry.value)}>
                {entry.label}
              </option>
            ))}
          </select>
          <span className={styles.hint}>
            <strong>Owned if present is not out of stock.</strong> It is the
            house saying: she either already has one or the line is not written
            — a turntable, a fireplace, the good chess set. The scene card may
            glance at it and nothing is sent, bought or sourced.
          </span>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="min_lead_days">
            Lead time
          </label>
          <input
            id="min_lead_days"
            name="min_lead_days"
            type="number"
            min={0}
            step={1}
            defaultValue={lead}
            placeholder="blank"
            className={styles.input}
          />
          <span className={styles.hint}>
            Blank means <strong>none needed</strong>, which is a claim and not a
            gap. A number here is a thing that has to be ordered, and it is the
            days before the party that ordering has to happen.
          </span>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="weight">
            Weight
          </label>
          <input
            id="weight"
            name="weight"
            type="number"
            min={0}
            max={2}
            step={0.001}
            defaultValue={values.weight ?? "1.000"}
            className={styles.input}
          />
          <span className={styles.hint}>
            0 to 2, one is neutral. A nudge, in the sense the rest of the
            catalogue uses: higher is reached for first, and nothing here is
            ever a gate.
          </span>
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="technique_card_id">
          Technique card
        </label>
        <select
          id="technique_card_id"
          name="technique_card_id"
          defaultValue={values.technique_card_id ?? ""}
          className={styles.select}
        >
          <option value="">No card</option>
          {cards
            .filter((card) => card.id !== values.id)
            .map((card) => (
              <option key={card.id} value={card.id}>
                {card.name} · {card.world_name}
              </option>
            ))}
        </select>
        <span className={styles.hint}>
          {cards.length === 0
            ? "No printed cards exist yet, so there is nothing a card could be. A technique card is itself a bank item of kind “a printed card”."
            : "Only printed cards are offered, because only a printed card may be one — the database refuses anything else and says so in its own words. One skill per card, riding with whichever act the package selected. A printed card should not itself carry one."}
        </span>
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
          <span className={styles.hint}>
            The engine cannot see a draft. Offering it is a curator&rsquo;s
            decision and never a script&rsquo;s.
          </span>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="source_citation">
            Where the line came from
          </label>
          <input
            id="source_citation"
            name="source_citation"
            defaultValue={values.source_citation ?? ""}
            placeholder="the bank document · a founder note · a supplier"
            className={styles.input}
          />
          <span className={styles.hint}>
            Not decoration: an atmosphere line with no provenance is one nobody
            can check, and this catalogue&rsquo;s whole discipline is that a
            claim has a source.
          </span>
        </div>
      </div>

      <div className={styles.buttonRow}>
        <button className={styles.button} disabled={pending}>
          {pending ? "Saving" : values.id ? "Save" : "Add it to the bank"}
        </button>
      </div>
    </form>
  );
}
