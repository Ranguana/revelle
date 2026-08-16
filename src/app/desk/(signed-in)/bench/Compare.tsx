import type { BenchDiff, BenchRun } from "@/lib/desk/bench";
import { optionLabel } from "@/lib/desk/labels";

import styles from "../../desk.module.css";

/**
 * THE RUN BEFORE, BESIDE THE RUN NOW.
 *
 * Toggling one scoping and watching a pick move is the whole reason this is a
 * bench and not a preview, and a curator should not have to hold the last
 * screen in her head to see it. So the previous run stays on the page, in the
 * same shape as the new one, with the lines that differ marked.
 *
 * The marking is colour and weight, never a badge and never a count. Two runs
 * that agree say so in one sentence and take up no more room than that — which
 * matters, because "nothing moved" is the answer that proves the seed is doing
 * what it promises, and it should be as easy to read as a change.
 */
export default function Compare({
  diff,
  before,
  after,
}: {
  diff: BenchDiff;
  before: BenchRun;
  after: BenchRun;
}) {
  const movedDestinations = new Set(diff.destinations.map((d) => d.name));
  const movedSlots = new Set(diff.picks.map((p) => p.slotLabel));

  return (
    <section className={styles.panel}>
      <h2 className={styles.panelHead}>
        <span>Against the run before it</span>
        <span>
          seed {before.seed} → {after.seed}
        </span>
      </h2>

      {diff.identical ? (
        <p className={styles.ok}>
          Nothing moved. Same seed, same answers, same catalogue — so the
          shortlist, every pick and every gap came out identical. Anything that
          moves from here moved because you moved it.
        </p>
      ) : (
        <ul className={styles.lines} style={{ marginBottom: "0.625rem" }}>
          {diff.answers.length > 0 ? (
            <li className={styles.line}>
              Answers changed:{" "}
              {diff.answers
                .map((id) => id.replace(/_/g, " "))
                .join(", ")}
            </li>
          ) : null}
          {diff.seed ? (
            <li className={styles.line}>
              The seed changed, so some of what moved below is the dither rather
              than the catalogue.
            </li>
          ) : null}
          {diff.chosen ? (
            <li className={`${styles.line} ${styles.lineMoved}`}>
              It would now choose {diff.chosen.to}, where before it chose{" "}
              {diff.chosen.from}.
            </li>
          ) : null}
          {diff.destinations.map((entry) => (
            <li key={entry.name} className={`${styles.line} ${styles.lineMoved}`}>
              {entry.name}{" "}
              {entry.from === null
                ? `entered the shortlist at ${entry.to}`
                : entry.to === null
                  ? `left the shortlist (was ${entry.from})`
                  : `moved from ${entry.from} to ${entry.to}`}
            </li>
          ))}
          {diff.picks.map((entry) => (
            <li
              key={entry.slotLabel}
              className={`${styles.line} ${styles.lineMoved}`}
            >
              {entry.slotLabel}:{" "}
              {entry.from === null
                ? `now ${entry.to}, where nothing was placed`
                : entry.to === null
                  ? `nothing placed, where ${entry.from} was`
                  : `${entry.from} → ${entry.to}`}
            </li>
          ))}
          {diff.gapsOpened.map((label) => (
            <li key={`open-${label}`} className={`${styles.line} ${styles.lineMoved}`}>
              A gap opened: {label} — the pool can no longer fill it.
            </li>
          ))}
          {diff.gapsClosed.map((label) => (
            <li key={`close-${label}`} className={styles.line}>
              A gap closed: {label}.
            </li>
          ))}
        </ul>
      )}

      <div className={styles.compare}>
        <Side
          run={before}
          title="Before"
          movedDestinations={movedDestinations}
          movedSlots={movedSlots}
        />
        <Side
          run={after}
          title="Now"
          movedDestinations={movedDestinations}
          movedSlots={movedSlots}
        />
      </div>
    </section>
  );
}

function Side({
  run,
  title,
  movedDestinations,
  movedSlots,
}: {
  run: BenchRun;
  title: string;
  movedDestinations: ReadonlySet<string>;
  movedSlots: ReadonlySet<string>;
}) {
  const chosen = run.candidates[0] ?? null;

  return (
    <div className={styles.compareSide}>
      <p className={styles.facetDimension}>
        {title} · seed {run.seed} ·{" "}
        {optionLabel("occasion", String(run.answers.occasion ?? ""))}
      </p>

      <h4 className={styles.railHead}>The shortlist</h4>
      <ul className={styles.lines}>
        {run.candidates.length === 0 ? (
          <li className={`${styles.line} ${styles.lineGone}`}>Nothing.</li>
        ) : (
          run.candidates.map((candidate) => (
            <li
              key={`${candidate.rank}-${candidate.destinationId}`}
              className={`${styles.line} ${
                movedDestinations.has(candidate.destinationName)
                  ? styles.lineMoved
                  : ""
              }`}
            >
              {candidate.rank}. {candidate.destinationName}
            </li>
          ))
        )}
      </ul>

      <h4 className={styles.railHead} style={{ marginTop: "0.5rem" }}>
        What it would send
      </h4>
      <ul className={styles.lines}>
        {chosen === null || chosen.picks.length === 0 ? (
          <li className={`${styles.line} ${styles.lineGone}`}>Nothing placed.</li>
        ) : (
          chosen.picks.map((pick) => (
            <li
              key={pick.slotKey}
              className={`${styles.line} ${
                movedSlots.has(pick.slotLabel) ? styles.lineMoved : ""
              }`}
            >
              {pick.slotLabel} — {pick.name}
            </li>
          ))
        )}
      </ul>

      {run.gaps.length > 0 ? (
        <>
          <h4 className={styles.railHead} style={{ marginTop: "0.5rem" }}>
            What the house must author
          </h4>
          <ul className={styles.lines}>
            {run.gaps.map((gap) => (
              <li key={`${gap.pool}:${gap.slotCode}`} className={styles.line}>
                {gap.slotLabel}
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
