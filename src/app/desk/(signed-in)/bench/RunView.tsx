import type { BenchCandidate, BenchRun } from "@/lib/desk/bench";
import { dollars, money } from "@/lib/desk/labels";

import styles from "../../desk.module.css";
import { Fact } from "../bits";

/**
 * WHAT SHE WOULD ACTUALLY RECEIVE — the engine's own account, not a summary.
 *
 * Every sentence below is written by src/lib/selection/explain.ts for a curator
 * and for nobody else, and it is shown here in the same order and under the
 * same headings as the real proposal screen
 * (applications/[id]/Proposals.tsx). That symmetry is the point: a curator who
 * learns to read a bench run has learned to read a proposal, and a bench that
 * presented the same object differently would be teaching her a second
 * vocabulary for one thing.
 *
 * Nothing here is reachable from anything a member sees.
 * `src/lib/selection/member.ts` makes that structural — MemberRevelle cannot
 * carry an Explanation — and it stays true on this page because this page never
 * gets near one.
 */
export default function RunView({ run }: { run: BenchRun }) {
  return (
    <>
      <section className={styles.panel}>
        <h2 className={styles.panelHead}>
          <span>The shortlist</span>
          <span>
            seed {run.seed} · {run.library.destinations} destinations ·{" "}
            {run.library.ingredients} ingredients
          </span>
        </h2>

        {run.impasse ? (
          <p className={styles.error}>
            <strong>Impasse.</strong> {run.impasse} Nothing was proposed, and
            that is the engine refusing to guess rather than failing.
          </p>
        ) : null}

        {run.candidates.length === 0 && !run.impasse ? (
          <p className={styles.hint}>No candidates. Nothing survived stage 2.</p>
        ) : null}

        {run.candidates.length > 0 ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Destination</th>
                <th>On merit</th>
                <th>After the dither</th>
                <th>Against her vector</th>
                <th>Fingerprint</th>
              </tr>
            </thead>
            <tbody>
              {run.candidates.map((candidate) => (
                <tr key={`${candidate.rank}-${candidate.destinationId}`}>
                  <td className={styles.numeric}>{candidate.rank}</td>
                  <td>
                    {candidate.destinationName}
                    <div className={styles.when}>{candidate.tagline}</div>
                  </td>
                  <td className={styles.numeric}>{candidate.destinationRank}</td>
                  <td className={styles.numeric}>{candidate.ditheredRank}</td>
                  <td className={styles.numeric}>
                    {(candidate.destinationScore * 100).toFixed(0)}
                  </td>
                  <td className={styles.numeric}>
                    {candidate.fingerprint?.slice(0, 12) ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}

        <div className={styles.facts} style={{ marginTop: "0.625rem" }}>
          <Fact label="Blend">
            stated {run.vector.blend.stated.toFixed(2)} · history{" "}
            {run.vector.blend.history.toFixed(2)} · cohort{" "}
            {run.vector.blend.cohort.toFixed(2)}
          </Fact>
          <Fact label="Her own evidence">{run.vector.evidenceCount}</Fact>
          <Fact label="Vetoes">
            {run.vector.dealbreakers.join(", ") || "none"}
          </Fact>
        </div>

        {run.vector.terms.length > 0 ? (
          <>
            <h4 className={styles.railHead} style={{ marginTop: "0.625rem" }}>
              What her answers came to
            </h4>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Facet</th>
                  <th>Dimension</th>
                  <th>Weight</th>
                  <th>From</th>
                </tr>
              </thead>
              <tbody>
                {run.vector.terms.map((term) => (
                  <tr key={`${term.dimension}-${term.label}`}>
                    <td>{term.label}</td>
                    <td className={styles.numeric}>{term.dimension}</td>
                    <td className={styles.numeric}>{term.weight.toFixed(3)}</td>
                    <td>{term.because}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : null}
      </section>

      {run.eliminated.length > 0 ? (
        <section className={styles.panel}>
          <h2 className={styles.panelHead}>
            <span>What was eliminated, and by which tier</span>
            <span>stage 2</span>
          </h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Destination</th>
                <th>Tier</th>
                <th>Voice match</th>
                <th>Why</th>
              </tr>
            </thead>
            <tbody>
              {run.eliminated.map((entry) => (
                <tr key={entry.destinationName}>
                  <td>{entry.destinationName}</td>
                  <td className={styles.numeric}>{entry.tier}</td>
                  <td className={styles.numeric}>
                    {entry.toneMatch === null ? "—" : entry.toneMatch.toFixed(2)}
                  </td>
                  <td>{entry.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {run.candidates.map((candidate) => (
        <Candidate
          key={`${candidate.rank}-${candidate.destinationId}`}
          candidate={candidate}
        />
      ))}
    </>
  );
}

function Candidate({ candidate }: { candidate: BenchCandidate }) {
  const e = candidate.explanation;

  return (
    <section className={styles.panel}>
      <h2 className={styles.panelHead}>
        <span>
          {candidate.rank === 1 ? "What it would choose" : "The alternative"} —{" "}
          {candidate.destinationName}
        </span>
        <span>
          rank {candidate.rank} ·{" "}
          {(candidate.destinationScore * 100).toFixed(0)} against her vector
        </span>
      </h2>

      {candidate.blocked ? (
        <p className={styles.error}>
          <strong>Withheld.</strong> {candidate.blocked}
        </p>
      ) : null}

      {candidate.lowConfidence ? (
        <p className={styles.note}>
          Flagged for mandatory review, whatever the sampling rate.
        </p>
      ) : null}

      <p>{e.headline}</p>

      {candidate.picks.length === 0 ? (
        <p className={styles.hint}>
          Nothing was placed. Every slot her occasion has was either excluded by
          her own answers or could not be filled from the pools.
        </p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Slot</th>
              <th>What</th>
              <th>Pool</th>
              <th>Cost</th>
              <th>Alternatives</th>
            </tr>
          </thead>
          <tbody>
            {candidate.picks.map((pick) => (
              <tr key={pick.slotKey}>
                <td>{pick.slotLabel}</td>
                <td>
                  {pick.name}
                  {pick.perGuest ? ` × ${pick.quantity}` : ""}
                </td>
                <td className={styles.numeric}>{pick.pool}</td>
                <td className={styles.numeric}>
                  {pick.lineCostCents === null
                    ? "unpriced"
                    : money(pick.lineCostCents)}
                </td>
                <td className={styles.numeric}>
                  {pick.forced ? "forced — nothing else fits" : pick.alternatives}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className={styles.facts} style={{ marginTop: "0.5rem" }}>
        <Fact label="Total">{money(candidate.budget.totalCents)}</Fact>
        <Fact label="A head">
          {candidate.budget.totalPerHeadCents === null
            ? "—"
            : money(candidate.budget.totalPerHeadCents)}
        </Fact>
        <Fact label="Build to">{dollars(candidate.budget.planning)}</Fact>
        <Fact label="Never exceed">
          {candidate.budget.unbounded
            ? "open — ask her, never assume no limit"
            : dollars(candidate.budget.ceiling)}
        </Fact>
        <Fact label="Guests">
          {candidate.budget.guests ?? "—"}
          {candidate.budget.guestsAreConfirmed ? "" : " (open band)"}
        </Fact>
      </div>

      <Sentences title="Why this destination" lines={e.destination} />
      <Sentences title="What eliminated the others" lines={e.eliminated} />
      <Sentences title="What she wants more of" lines={e.emphasis} />
      <Sentences title="What the occasion and the pools decided" lines={e.forced} />
      <Sentences title="What was dropped" lines={e.dropped} />
      <Sentences title="What moved, and why" lines={e.swapped} />
      <Sentences title="The money" lines={e.budget} />
      <Sentences title="What the room ruled out" lines={e.venue} />
      <Sentences title="What the catalogue could not supply" lines={e.gaps} />
      <Sentences title="Slots she does not have" lines={e.excluded} />
      <Sentences title="Flagged for review" lines={e.confidence} />

      {/*
        HER WORDS, VERBATIM. `Explanation.secret` is the one field on the
        curator's account that is not the engine talking, and explain.ts carries
        it through untouched and unsummarised. It is set like the application
        screen sets it — larger than what surrounds it, quoted, never truncated
        — because it is what a curator reads the proposal against.
      */}
      {e.secret && e.secret.trim().length > 0 ? (
        <>
          <h4 className={styles.railHead} style={{ marginTop: "0.625rem" }}>
            The thing we could not possibly know
          </h4>
          <blockquote className={styles.secret}>{e.secret}</blockquote>
        </>
      ) : null}

      <p className={styles.hint} style={{ marginTop: "0.5rem" }}>
        fingerprint {candidate.fingerprint ?? "—"}
      </p>
    </section>
  );
}

/** No heading over an empty body. The rule member.ts states, kept here too. */
function Sentences({
  title,
  lines,
}: {
  title: string;
  lines: string[] | undefined;
}) {
  if (!lines || lines.length === 0) return null;
  return (
    <>
      <h4 className={styles.railHead} style={{ marginTop: "0.625rem" }}>
        {title}
      </h4>
      <ul className={styles.messages}>
        {lines.map((line, index) => (
          <li key={index} className={styles.messageBody}>
            {line}
          </li>
        ))}
      </ul>
    </>
  );
}
