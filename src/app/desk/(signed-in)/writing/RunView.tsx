import type { CarriedLine, RoomOutcome, WritingRun } from "@/lib/desk/writing";

import styles from "../../desk.module.css";

/**
 * ONE RUN, READ ACROSS THE ROOMS.
 *
 * The rooms sit in a row because the failure this bench exists to detect is not
 * a bad line — it is THE SAME LINE IN EVERY HOUSE, which is invisible in a
 * single sample. Reading Havana beside Nantucket beside Aspen is the test, and
 * a screen that made her scroll from one to the next would be hiding the only
 * thing worth looking at.
 *
 * Under each line, and this matters as much as the line: what the prompt
 * carried. A line she dislikes is a different problem depending on whether the
 * model was shown the right refusals, and the only way to know is to look at
 * the prompt that was actually sent.
 */
export default function RunView({ run }: { run: WritingRun }) {
  const columns =
    run.rooms.length >= 3
      ? styles.grid3
      : run.rooms.length === 2
        ? styles.grid2
        : "";

  return (
    <section className={styles.panel}>
      <h2 className={styles.panelHead}>
        <span>
          {run.generated ? "What came back" : "What would be sent"} —{" "}
          {run.piece.replace(/_/g, " ")}
        </span>
        <span>{run.at.replace("T", " ").slice(0, 19)}</span>
      </h2>

      {/*
        THE BILL, SAID AFTER IT WAS SPENT AS WELL AS BEFORE. `calls` counts the
        rooms that reached the model, failures included — a call that came back
        as an error was still a call, and a cost line that quietly excluded it
        would understate every bad afternoon.
      */}
      <p className={styles.hint}>
        {run.generated
          ? `${run.calls} ${run.calls === 1 ? "call" : "calls"} to ${run.requestedModel}, ` +
            `ceiling ${run.maxTokens} tokens each, thinking included. One call a room.`
          : "Prompts only. Nothing was sent, nothing was spent, and no key was needed."}
      </p>

      <div className={styles.facts}>
        <p className={styles.hint}>
          <strong>Ask</strong> {run.ask}
        </p>
        {run.facts.length > 0 ? (
          <p className={styles.hint}>
            <strong>Facts</strong> {run.facts.join(" · ")}
          </p>
        ) : null}
        <p className={styles.hint}>
          <strong>Ceiling</strong>{" "}
          {run.maxWords === null ? "none" : `${run.maxWords} words`}
        </p>
      </div>

      <div className={columns}>
        {run.rooms.map((room) => (
          <Room key={room.slug} room={room} generated={run.generated} />
        ))}
      </div>
    </section>
  );
}

function Room({
  room,
  generated,
}: {
  room: RoomOutcome;
  generated: boolean;
}) {
  return (
    <div className={styles.compareSide}>
      <p className={styles.factLabel}>{room.name}</p>

      {/*
        SAID ON EVERY ROW, not once at the top of the picker. Reading an unwired
        room's voice is QA and not an activation (rule 8), and the row is where
        somebody is standing when they read the line and think about sending it.
      */}
      {room.servable ? null : (
        <p className={styles.hint}>
          Authored, not in the catalogue. No member can be sent this room, and
          nothing written here changes that.
        </p>
      )}

      {room.error ? <p className={styles.error}>{room.error}</p> : null}

      {room.written ? (
        <>
          <pre className={styles.copyBlock}>{room.written.body}</pre>
          {/*
            THE MODEL THAT ANSWERED, NOT THE ONE THAT WAS ASKED. writer.ts turns
            the server-side fallback on, so a request for Opus can legitimately
            be answered by a substitute — and a bench comparing registers across
            houses must say when two rooms were not written by the same model.
          */}
          <p className={styles.hint}>Answered by {room.written.model}.</p>
        </>
      ) : generated && !room.error ? (
        <p className={styles.hint}>Nothing came back.</p>
      ) : null}

      {room.findings ? <Findings findings={room.findings} /> : null}

      <Carried room={room} />

      <details>
        <summary className={styles.hint}>The prompt, verbatim</summary>
        <pre className={styles.pre}>{room.prompt}</pre>
      </details>
    </div>
  );
}

/**
 * THE GUARD, RUN ON REAL MODEL OUTPUT.
 *
 * Every finding here comes from `voiceFindings`, which is an adapter over
 * scripts/check-voice-output.mjs and adds no rule of its own. The whole point
 * of showing it on this screen is that until now the checker had only ever been
 * pointed at lines a person or an agent wrote by hand — and "never used" means
 * "never tested against the tables it will actually meet" (rule 24's corollary).
 * This is the first place it meets what the model actually says.
 */
function Findings({
  findings,
}: {
  findings: NonNullable<RoomOutcome["findings"]>;
}) {
  const clean = findings.flagged === 0 && findings.nearest === null;

  if (clean) {
    return (
      <p className={styles.ok}>
        No banned shapes found. This layer is lexical — it does not certify the
        voice.
      </p>
    );
  }

  return (
    <div className={styles.facts}>
      {findings.displaced.length > 0 ? (
        <p className={styles.error}>
          <strong>Displaced terms</strong>{" "}
          {findings.displaced
            .map((d) => `“${d.term}” — the house says “${d.use}”`)
            .join("; ")}
        </p>
      ) : null}

      {findings.never.length > 0 ? (
        <p className={styles.error}>
          <strong>Never-rule terms</strong>{" "}
          {findings.never.map((n) => `“${n.term}”`).join(", ")}
        </p>
      ) : null}

      {findings.banned.length > 0 ? (
        <p className={styles.error}>
          <strong>Banned words</strong>{" "}
          {findings.banned.map((b) => `“${b}”`).join(", ")}
        </p>
      ) : null}

      {findings.houseWide.length > 0 ? (
        <p className={styles.error}>
          <strong>House-wide refusals</strong>{" "}
          {findings.houseWide.map((h) => `“${h.term}”`).join(", ")}
        </p>
      ) : null}

      {findings.nearest ? (
        <div className={styles.note}>
          <p className={styles.hint}>
            <strong>
              Closest refusal, {Math.round(findings.nearest.score * 100)}% of the
              shorter line&rsquo;s distinctive words
            </strong>
          </p>
          <p className={styles.hint}>{findings.nearest.text}</p>
          <p className={styles.hint}>Rejected: {findings.nearest.why}</p>
          <p className={styles.hint}>
            Shared: {findings.nearest.shared.join(", ")}. Not a verdict — read
            the refusal beside the line and decide.
          </p>
        </div>
      ) : null}
    </div>
  );
}

/**
 * WHAT THE PROMPT CARRIED, AND WHAT IT DID NOT.
 *
 * Both directions, because they fail differently and look identical from
 * outside (rule 24). The carried lines are in the order the model read them —
 * the prompt hoists the exemplars matching the piece, and the ordering here is
 * read off the assembled string rather than re-derived, so a change to the
 * hoisting rule changes what this shows without anybody editing this file.
 *
 * A MISSING LINE IS AN ERROR STATE, NOT AN OMISSION. If a room's authored
 * exemplar is not in the prompt sent for it, the list stays honest by saying
 * so — a list that quietly held only the ones it found would look complete.
 */
function Carried({ room }: { room: RoomOutcome }) {
  const missing = room.exemplarsMissing.length + room.rejectedMissing.length;

  return (
    <>
      {missing > 0 ? (
        <p className={styles.error}>
          {missing} authored{" "}
          {missing === 1 ? "line is" : "lines are"} not in this prompt. The
          writer was never shown{" "}
          {[...room.exemplarsMissing, ...room.rejectedMissing]
            .map((l) => `“${l.text}”`)
            .join("; ")}
          .
        </p>
      ) : null}

      <details>
        <summary className={styles.hint}>
          {room.exemplarsCarried.length} exemplars carried, in the order the
          model read them
        </summary>
        <ul className={styles.lines}>
          {room.exemplarsCarried.map((line) => (
            <Line key={`${line.piece}:${line.at}`} line={line} />
          ))}
        </ul>
      </details>

      <details>
        <summary className={styles.hint}>
          {room.rejectedCarried.length} refusals carried
        </summary>
        <ul className={styles.lines}>
          {room.rejectedCarried.map((line) => (
            <Line key={`rejected:${line.at}`} line={line} />
          ))}
        </ul>
      </details>
    </>
  );
}

function Line({ line }: { line: CarriedLine }) {
  return (
    <li className={styles.line}>
      {line.piece ? (
        <span className={styles.factLabel}>{line.piece.replace(/_/g, " ")}</span>
      ) : null}
      <span>{line.text}</span>
      {line.why ? <span className={styles.hint}> — {line.why}</span> : null}
    </li>
  );
}
