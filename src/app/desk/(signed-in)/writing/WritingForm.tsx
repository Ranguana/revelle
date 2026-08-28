"use client";

import { useActionState } from "react";

import styles from "../../desk.module.css";
import { writingAction } from "./actions";
import RunView from "./RunView";
import type { BenchRoom, PieceChoice, WritingState } from "./state";

/**
 * THE BRIEF, COMPOSED.
 *
 * ── THE ROOMS AND THE PIECES ARRIVE AS PROPS ─────────────────────────
 *
 * Not imported. `benchRooms()` reaches src/lib/destinations.ts, and importing
 * it here would ship ten thousand lines of authored world to a browser so it
 * could draw a checkbox. The page reads the catalogue; this draws what it was
 * given. Same rule as the selection bench's form, arrived at from the other
 * direction — that one builds itself from QUIZ_STEPS because the questions must
 * match the real application; this one takes its rooms as data because the
 * catalogue is the wrong size to carry.
 *
 * ── TWO BUTTONS, AND ONLY ONE OF THEM SPENDS ─────────────────────────
 *
 * Show the prompts is free, needs no key, and works on a laptop; it is also the
 * only way to read what the writer WOULD be told without paying to find out.
 * Write it is one Opus call a room, and it is not rendered at all where the key
 * is absent — a button that cannot work is worse than no button (rule 9), and
 * the sentence above it says which of the two is missing.
 */
export default function WritingForm({
  rooms,
  pieces,
  open,
  initial,
  maxRooms,
}: {
  rooms: readonly BenchRoom[];
  pieces: readonly PieceChoice[];
  /** ANTHROPIC_API_KEY is set on this service. */
  open: boolean;
  initial: WritingState;
  maxRooms: number;
}) {
  const [state, action, pending] = useActionState<WritingState, FormData>(
    writingAction,
    initial
  );

  const servable = rooms.filter((room) => room.servable);
  const authored = rooms.filter((room) => !room.servable);

  return (
    <form action={action}>
      <div key={state.formKey}>
        <section className={styles.benchBar}>
          <div className={styles.buttonRow}>
            <button
              className={styles.buttonQuiet}
              name="intent"
              value="prompt"
              disabled={pending}
            >
              {pending ? "Working" : "Show the prompts"}
            </button>
            {open ? (
              <button
                className={styles.button}
                name="intent"
                value="generate"
                disabled={pending}
              >
                {pending ? "Writing" : "Write it"}
              </button>
            ) : null}
            <span className={styles.hint} style={{ maxWidth: "38rem" }}>
              Showing the prompts costs nothing and needs no key. Writing it
              spends one Opus call for every room ticked, up to {maxRooms} — the
              same brief in each, so they can be read against one another.
              Nothing here is written down and nothing reaches a member.
            </span>
          </div>

          {state.errors.length > 0 ? (
            <p className={styles.error} style={{ marginTop: "0.625rem" }}>
              {state.errors.join("\n")}
            </p>
          ) : null}
        </section>

        <section className={styles.panel}>
          <h2 className={styles.panelHead}>
            <span>The rooms — up to {maxRooms}</span>
            <span>src/lib/destinations.ts</span>
          </h2>

          <p className={styles.facetDimension}>In the catalogue</p>
          <Rooms rooms={servable} state={state} />

          {authored.length > 0 ? (
            <>
              {/*
                OFFERED, LABELLED, NOT OMITTED. These five have voices nobody
                has ever read a line out of, which is the strongest reason to
                be able to read one. Ticking one is a QA read and not an
                activation — the run says so again on every column.
              */}
              <p className={styles.facetDimension}>
                Authored, not in the catalogue — reading these is QA, not
                activation. No member can be sent one.
              </p>
              <Rooms rooms={authored} state={state} />
            </>
          ) : null}
        </section>

        <section className={styles.panel}>
          <h2 className={styles.panelHead}>
            <span>The piece</span>
            <span>src/lib/tokens.ts</span>
          </h2>

          <div className={styles.grid2}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="piece">
                Kind
              </label>
              <select
                id="piece"
                name="piece"
                defaultValue={state.form.piece}
                className={styles.select}
              >
                {pieces.map((piece) => (
                  <option key={piece.kind} value={piece.kind}>
                    {piece.label}
                    {piece.ceiling === null ? "" : ` · ${piece.ceiling} words`}
                  </option>
                ))}
              </select>
              <span className={styles.hint}>
                All nine kinds the prompt assembler supports. Three of them —
                heading, sign off, game rule — are parts of printed matter the
                house sets and are never offered to a member, so this is the
                only place they can be read.
              </span>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="maxWords">
                Word ceiling
              </label>
              <input
                id="maxWords"
                name="maxWords"
                type="number"
                defaultValue={state.form.maxWords}
                className={styles.input}
              />
              <span className={styles.hint}>
                Blank uses the house ceiling for that kind — a place card is a
                card. Type 0 for no ceiling at all.
              </span>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="ask">
              Ask
            </label>
            <textarea
              id="ask"
              name="ask"
              rows={2}
              defaultValue={state.form.ask}
              className={styles.textarea}
            />
            <span className={styles.hint}>
              The job, in the words a host would use. Leave it blank and the
              bench sends the standby ask for that kind, and says which one it
              sent.
            </span>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="facts">
              Facts — one a line
            </label>
            <textarea
              id="facts"
              name="facts"
              rows={4}
              defaultValue={state.form.facts}
              className={styles.textarea}
            />
            <span className={styles.hint}>
              Everything a guest would have to act on. The prompt forbids the
              writer from inventing a date, an hour or an address that is not
              here, which is a rule worth watching it keep.
            </span>
          </div>
        </section>
      </div>

      {state.run ? <RunView run={state.run} /> : null}
    </form>
  );
}

function Rooms({
  rooms,
  state,
}: {
  rooms: readonly BenchRoom[];
  state: WritingState;
}) {
  const picked = new Set(state.form.slugs);
  return (
    <ul className={styles.facetList}>
      {rooms.map((room) => (
        <li key={room.slug}>
          <label className={styles.facetItem}>
            <input
              type="checkbox"
              name="rooms"
              value={room.slug}
              defaultChecked={picked.has(room.slug)}
            />
            <span>
              {room.name}
              <span className={styles.hint}>
                {" "}
                — {room.exemplars} lines, {room.rejected} refusals
              </span>
            </span>
          </label>
        </li>
      ))}
    </ul>
  );
}
