"use client";

import { useActionState } from "react";

import {
  ADDRESS_MODES,
  FORMALITIES,
  HUMOUR_MODES,
  PIECE_KIND_CODES,
  SEP,
  type VoiceFormValues,
} from "@/lib/desk/voice-form";

import styles from "../../../../desk.module.css";
import { saveVoiceDraft, type VoiceState } from "../../actions";

/**
 * Writing a voice.
 *
 * Every field of the `Voice` type (src/lib/tokens.ts), in the order that type
 * argues for: who is speaking, how it reads, what things are called, the rules,
 * and then the lines — because the lines are the field that matters and are
 * worth arriving at with the rest already answered.
 *
 * ── LINE PER ENTRY ──────────────────────────────────────────────────
 *
 * The list fields are textareas with one entry per line. Voices are written in
 * a document and pasted; a repeatable row widget with an "add" button turns
 * nine exemplars into nine round trips and is the interaction people abandon
 * halfway. The three structured lists use " | " and say so above the box.
 *
 * ── SAVE AND PUBLISH ARE DIFFERENT BUTTONS ──────────────────────────
 *
 * Saving a draft never validates. Publishing runs validate_voice() in the
 * database, which is the only authority — its errors name the field and carry
 * a hint, and they are shown here verbatim rather than restated in friendlier,
 * less true words.
 */

const INITIAL: VoiceState = { error: null, hint: null };

function Area({
  name,
  label,
  hint,
  value,
  rows = 4,
}: {
  name: keyof VoiceFormValues;
  label: string;
  hint?: string;
  value: string;
  rows?: number;
}) {
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={name}>
        {label}
      </label>
      {hint ? <span className={styles.hint}>{hint}</span> : null}
      <textarea
        id={name}
        name={name}
        rows={rows}
        defaultValue={value}
        className={styles.textarea}
      />
    </div>
  );
}

function Line({
  name,
  label,
  hint,
  value,
}: {
  name: keyof VoiceFormValues;
  label: string;
  hint?: string;
  value: string;
}) {
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={name}>
        {label}
      </label>
      {hint ? <span className={styles.hint}>{hint}</span> : null}
      <input id={name} name={name} defaultValue={value} className={styles.input} />
    </div>
  );
}

export default function VoiceForm({
  worldId,
  voiceId,
  version,
  values,
  note,
}: {
  worldId: string;
  voiceId: string;
  version: number;
  values: VoiceFormValues;
  note: string;
}) {
  const [state, action, pending] = useActionState(saveVoiceDraft, INITIAL);

  return (
    <form action={action} className={`${styles.form} ${styles.formWide}`}>
      <input type="hidden" name="world_id" value={worldId} />
      <input type="hidden" name="voice_id" value={voiceId} />

      {state.error ? (
        <p className={styles.error}>
          {state.error}
          {state.hint ? `\n\n${state.hint}` : ""}
        </p>
      ) : null}

      <p className={styles.sub}>Draft — version {version}</p>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="note">
          Why this version exists
        </label>
        <input
          id="note"
          name="note"
          defaultValue={note}
          placeholder="The changelog entry for a register."
          className={styles.input}
        />
      </div>

      <h2 className={styles.panelHead}>
        <span>Who is speaking</span>
      </h2>
      <div className={styles.grid2}>
        <Line
          name="speaker"
          label="Speaker"
          hint="One noun phrase. “The Management.” “The house.”"
          value={values.speaker}
        />
        <Line
          name="audience"
          label="Audience"
          hint="What it calls the people it writes for."
          value={values.audience}
        />
      </div>
      <Area
        name="selfReference"
        label="It calls itself"
        hint="One per line, in preference order. An empty box is a real answer: this voice never refers to itself."
        value={values.selfReference}
        rows={3}
      />
      <div className={styles.grid2}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="addressMode">
            Person
          </label>
          <select
            id="addressMode"
            name="addressMode"
            defaultValue={values.addressMode}
            className={styles.select}
          >
            <option value="">—</option>
            {ADDRESS_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {mode.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
        <Line
          name="addressNote"
          label="…and what that means here"
          value={values.addressNote}
        />
      </div>

      <h2 className={styles.panelHead}>
        <span>How it reads</span>
      </h2>
      <Line
        name="register"
        label="Register"
        hint="The document this is pretending to be. One line, concrete."
        value={values.register}
      />
      <div className={styles.grid3}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="formality">
            Formality
          </label>
          <select
            id="formality"
            name="formality"
            defaultValue={values.formality}
            className={styles.select}
          >
            <option value="">—</option>
            {FORMALITIES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="typicalWords">
            Typical words a sentence
          </label>
          <input
            id="typicalWords"
            name="typicalWords"
            type="number"
            min={1}
            defaultValue={values.typicalWords}
            className={styles.input}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="maxWords">
            Never more than
          </label>
          <input
            id="maxWords"
            name="maxWords"
            type="number"
            min={1}
            defaultValue={values.maxWords}
            className={styles.input}
          />
        </div>
      </div>
      <Line name="cadence" label="Cadence" value={values.cadence} />
      <Line
        name="punctuation"
        label="Punctuation"
        hint="Marks it uses, and marks it does not."
        value={values.punctuation}
      />
      <Line
        name="orthography"
        label="On the page"
        hint="Caps, numerals, dates, hours. Where a generated line most often breaks character while getting every word right."
        value={values.orthography}
      />
      <div className={styles.grid2}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="humourMode">
            Humour
          </label>
          <select
            id="humourMode"
            name="humourMode"
            defaultValue={values.humourMode}
            className={styles.select}
          >
            <option value="">—</option>
            {HUMOUR_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>
        </div>
        <Line
          name="humourMechanism"
          label="…and its mechanism"
          hint="The mode names the family. The mechanism is what makes the joke reproducible."
          value={values.humourMechanism}
        />
      </div>

      <h2 className={styles.panelHead}>
        <span>What things are called, and the rules</span>
      </h2>
      <Area
        name="lexicon"
        label="Lexicon"
        hint={`One per line: term ${SEP} what it means ${SEP} the words it displaces, comma separated`}
        value={values.lexicon}
        rows={6}
      />
      <Area
        name="formulae"
        label="Sentence shapes it reuses"
        hint="One per line. Two lines sharing a frame are what make them sound like one house."
        value={values.formulae}
      />
      <Area
        name="banned"
        label="Words that must never appear"
        hint="One per line. Checked literally, so keep them literal."
        value={values.banned}
      />
      <Area
        name="signOffs"
        label="How a piece ends"
        hint="One per line. Rotated, not sequenced."
        value={values.signOffs}
      />
      <div className={styles.grid2}>
        <Area name="always" label="Always" value={values.always} rows={6} />
        <Area name="never" label="Never" value={values.never} rows={6} />
      </div>
      <Area
        name="breaksCharacterFor"
        label="Write these straight, with no voice at all"
        hint="Anything a guest must act on to arrive or be safe, anything about money, and any message that gives someone a way out. A voice with no documented exit is a liability."
        value={values.breaksCharacterFor}
      />

      <h2 className={styles.panelHead}>
        <span>The lines</span>
      </h2>
      <Area
        name="exemplars"
        label="Lines from this house"
        hint={`One per line: piece ${SEP} the line ${SEP} an optional note to yourself. Pieces: ${PIECE_KIND_CODES.join(", ")}. At least three are required to publish — examples steer a generated line further than adjectives do.`}
        value={values.exemplars}
        rows={12}
      />
      <Area
        name="rejected"
        label="Lines that were rejected, and why"
        hint={`One per line: the line ${SEP} one clause saying what is wrong with it. A line that is nearly right locates a voice more precisely than a good one does.`}
        value={values.rejected}
        rows={8}
      />

      <div className={styles.buttonRow}>
        <button
          className={styles.buttonQuiet}
          name="intent"
          value="save"
          disabled={pending}
        >
          {pending ? "Working" : "Save the draft"}
        </button>
        <button
          className={styles.button}
          name="intent"
          value="publish"
          disabled={pending}
        >
          Publish version {version}
        </button>
        <span className={styles.hint}>
          Publishing supersedes whatever is in force. Revelles already issued
          keep the words they were issued with.
        </span>
      </div>
    </form>
  );
}
