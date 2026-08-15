import Link from "next/link";

import type { GenerationRun, Proposal } from "@/lib/desk/proposals";

import styles from "../../../desk.module.css";
import {
  approveProposalAction,
  regenerateAction,
  rejectProposalAction,
} from "../actions";

/**
 * WHAT THE ENGINE PROPOSED, AND WHY.
 *
 * The screen the whole system was missing. `runSelection` has been able to
 * choose since it was written and nothing outside its own tests ever called it,
 * so an application arrived, landed in the inbox, and stopped. This is where it
 * stops stopping.
 *
 * ── EVERY SENTENCE HERE IS FOR THE HOUSE ─────────────────────────────
 *
 * The explanation, the eliminations, the drops, the swaps, the money and the
 * catalogue gaps are written by src/lib/selection/explain.ts for a curator and
 * for nobody else. src/lib/selection/member.ts makes that structural on the
 * other side of the wall — `MemberRevelle` cannot carry any of them and
 * `memberRevelle()` is the only way across. Nothing on this page is reachable
 * from anything she looks at, and nothing on it should ever be copied into one.
 *
 * ── WHY THE ALTERNATIVES ARE SHOWN IN FULL ───────────────────────────
 *
 * docs/selection-spec.md, stage 6: two or three COMPLETE candidates, each with
 * its own account. Not a headline with a "see more" — a curator choosing
 * between destinations is choosing between whole evenings, and the second
 * candidate's dropped items and forced slots are exactly what decides it. The
 * dither means rank is already a sampled opinion rather than a verdict
 * (stage 2), so a screen that treats rank 1 as the answer and the rest as
 * footnotes is arguing with the algorithm it is displaying.
 *
 * ── THE THREE THINGS THAT MAKE A PROPOSAL UNAPPROVABLE ───────────────
 *
 * Marked here, refused in src/lib/revelle/proposals.ts. A marker on a screen is
 * a courtesy; the refusal is the rule, and it is on the transaction.
 *
 *   no published voice   the destination has a look and cannot speak. See the
 *                        essay in src/lib/revelle/generate.ts for why
 *                        generation proposes it anyway.
 *   blocked              this exact assemblage has been delivered to somebody.
 *                        The only verdict that withholds a whole candidate.
 *   not live             already approved, rejected, or superseded by a later
 *                        run.
 */

const LIVE = "proposed";

export default function Proposals({
  applicationId,
  proposals,
  run,
  hasRevelle,
}: {
  applicationId: string;
  proposals: Proposal[];
  run: GenerationRun | null;
  /** An approved Revelle already exists, so nothing else may be approved. */
  hasRevelle: boolean;
}) {
  const live = proposals.filter((p) => p.status === LIVE);
  const decided = proposals.filter((p) => p.status !== LIVE);
  const impasse =
    typeof run?.result?.impasse === "string" ? run.result.impasse : null;

  return (
    <section className={styles.panel}>
      <h2 className={styles.panelHead}>
        <span>What the engine proposed</span>
        <span>{run ? runLine(run) : "no run yet"}</span>
      </h2>

      {run === null ? (
        <p className={styles.hint}>
          No generation job exists for this application. Every application
          submitted since <code>revelle.generate</code> landed enqueues one in
          the same transaction as the response, so this is either a response
          that predates it or one written by hand. Ask for a run.
        </p>
      ) : null}

      {run && run.status === "failed" ? (
        <p className={styles.error}>
          The run failed after {run.attempts} attempt
          {run.attempts === 1 ? "" : "s"}: {run.lastError}
        </p>
      ) : null}

      {run && (run.status === "queued" || run.status === "running") ? (
        <p className={styles.hint}>
          The run is {run.status}. It is claimed by the runner inside this web
          process every couple of seconds — reload in a moment.
        </p>
      ) : null}

      {impasse ? (
        <p className={styles.error}>
          <strong>Impasse.</strong> {impasse} Nothing was proposed, and that is
          the engine refusing to guess rather than a failure — relax one
          dealbreaker with her, or author a destination that does not carry it.
        </p>
      ) : null}

      {live.length === 0 && !impasse && run?.status === "succeeded" ? (
        <p className={styles.hint}>
          Nothing is live. Either every candidate has been decided, or a later
          run superseded this set.
        </p>
      ) : null}

      {live.map((proposal, index) => (
        <Candidate
          key={proposal.id}
          applicationId={applicationId}
          proposal={proposal}
          heading={
            index === 0
              ? "What it would choose"
              : `The alternative${live.length > 2 ? ` (${index + 1} of ${live.length})` : ""}`
          }
          canApprove={!hasRevelle}
        />
      ))}

      {decided.length > 0 ? (
        <div className={styles.facts} style={{ marginTop: "1rem" }}>
          {decided.map((proposal) => (
            <div key={proposal.id} className={styles.fact}>
              <span className={styles.factLabel}>
                {proposal.status} · rank {proposal.rank}
              </span>
              <span className={styles.factValue}>
                {proposal.worldName}
                {proposal.decisionNote ? ` — “${proposal.decisionNote}”` : ""}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      <form action={regenerateAction} className={styles.buttonRow}>
        <input type="hidden" name="id" value={applicationId} />
        <button className={styles.buttonQuiet} type="submit">
          Ask for another set
        </button>
        <span className={styles.hint}>
          A new job, a new seed, against the catalogue as it stands today.
          Generation is automatic — this is only for when none of these is
          right.
        </span>
      </form>
    </section>
  );
}

function runLine(run: GenerationRun): string {
  const seed =
    typeof run.result?.seed === "number" ? ` · seed ${run.result.seed}` : "";
  return `${run.status}${seed} · attempt ${run.attempts}/${run.maxAttempts}`;
}

function Candidate({
  applicationId,
  proposal,
  heading,
  canApprove,
}: {
  applicationId: string;
  proposal: Proposal;
  heading: string;
  canApprove: boolean;
}) {
  const explanation = proposal.explanation as {
    headline?: string;
    destination?: string[];
    eliminated?: string[];
    forced?: string[];
    dropped?: string[];
    swapped?: string[];
    budget?: string[];
    emphasis?: string[];
    venue?: string[];
    gaps?: string[];
    excluded?: string[];
    confidence?: string[];
  };

  const voiceless = proposal.voiceId === null;
  const approvable = canApprove && !voiceless && proposal.blocked === null;

  return (
    <article className={styles.panel} style={{ marginTop: "0.75rem" }}>
      <h3 className={styles.panelHead}>
        <span>
          {heading} — {proposal.worldName}
        </span>
        <span>
          rank {proposal.rank} · {(proposal.destinationScore * 100).toFixed(0)}{" "}
          against her vector
        </span>
      </h3>

      <p className={styles.hint}>{proposal.worldTagline}</p>

      {/*
        THE ONE VERDICT THAT WITHHOLDS. Assemblage uniqueness and nothing else —
        this exact set has already been delivered to somebody, and two women
        must not receive the same object. A catalogue gap never sets it.
      */}
      {proposal.blocked ? (
        <p className={styles.error}>
          <strong>Withheld.</strong> {proposal.blocked}
        </p>
      ) : null}

      {/*
        A LOOK AND NO VOICE. Generation proposes it on purpose — see the essay
        in src/lib/revelle/generate.ts — and approval refuses it, because a
        destination that cannot speak cannot be written and therefore cannot
        reach a customer. The voice is read fresh on every load, so publishing
        one makes this proposal approvable with no re-run.
      */}
      {voiceless ? (
        <p className={styles.error}>
          <strong>{proposal.worldName} has no published voice.</strong> Nothing
          in this Revelle could be written, so it cannot be approved. It is on
          the desk&apos;s list as work — publish the voice and this becomes
          approvable with no re-run.{" "}
          <Link className={styles.link} href="/desk/destinations">
            The destinations
          </Link>
        </p>
      ) : (
        <p className={styles.hint}>
          Voice v{proposal.voiceVersion} is published and would be pinned to her
          Revelle at delivery.
        </p>
      )}

      {proposal.lowConfidence ? (
        <p className={styles.note}>
          Flagged for mandatory review, whatever the sampling rate.
        </p>
      ) : null}

      <p>{explanation.headline}</p>

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
          {proposal.picks.map((pick) => (
            <tr key={pick.slotKey}>
              <td>
                {pick.slotLabel}
                {pick.dayIndex ? ` · day ${pick.dayIndex}` : ""}
              </td>
              <td>
                {pick.name}
                {pick.perGuest ? ` × ${pick.quantity}` : ""}
              </td>
              <td className={styles.numeric}>{pick.pool}</td>
              <td className={styles.numeric}>
                {pick.lineCostCents === null
                  ? "unpriced"
                  : `$${(pick.lineCostCents / 100).toFixed(0)}`}
              </td>
              <td className={styles.numeric}>
                {pick.forced ? "forced — nothing else fits" : pick.alternatives}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Sentences title="Why this destination" lines={explanation.destination} />
      <Sentences title="What eliminated the others" lines={explanation.eliminated} />
      {/*
        WHICH DELIVERABLE SHE VALUES. The only question on the quiz that names
        one, and the only section that can carry an OWED FOLLOW-UP: an inside
        joke cannot be satisfied from the catalogue, so the engine says so here
        rather than quietly selecting something witty. See selection/emphasis.ts.
      */}
      <Sentences title="What she wants more of" lines={explanation.emphasis} />
      <Sentences title="What the occasion and the pools decided" lines={explanation.forced} />
      <Sentences title="What was dropped" lines={explanation.dropped} />
      <Sentences title="What moved, and why" lines={explanation.swapped} />
      <Sentences title="The money" lines={explanation.budget} />
      {/*
        ONLY EVER WHAT THE ROOM REMOVED. There is no sentence here about why a
        destination was chosen, because the venue had nothing to do with it —
        the destination is where she is transported to, the venue is where she
        physically is, and the moment one explains the other this is a Pinterest
        board. Do not add a line to this section that names a destination.
      */}
      <Sentences title="What the room ruled out" lines={explanation.venue} />
      {/*
        WORK ORDERS. Also on the desk's list through recordCatalogueGaps(); kept
        beside the candidate so the account is complete without a join to a list
        that may since have been dismissed. Never shown to a member: she
        receives what there was and never learns a slot existed.
      */}
      <Sentences title="What the catalogue could not supply" lines={explanation.gaps} />
      {/*
        NOT work orders, and never in the same list. She is not serving food, so
        there is no menu — there is nothing to author and nothing to fix.
        db/014 removes these before the fill, so they were never gaps.
      */}
      <Sentences title="Slots she does not have" lines={explanation.excluded} />
      <Sentences title="Flagged for review" lines={explanation.confidence} />

      <p className={styles.hint}>
        fingerprint {proposal.fingerprint ?? "—"} · seed {proposal.seed}
      </p>

      <div className={styles.buttonRow}>
        <form action={approveProposalAction}>
          <input type="hidden" name="id" value={applicationId} />
          <input type="hidden" name="proposal_id" value={proposal.id} />
          <button
            className={styles.button}
            type="submit"
            disabled={!approvable}
            title={
              approvable
                ? "This becomes her Revelle"
                : "This one cannot be approved — see above"
            }
          >
            Approve this one
          </button>
        </form>

        <form action={rejectProposalAction} className={styles.buttonRow}>
          <input type="hidden" name="id" value={applicationId} />
          <input type="hidden" name="proposal_id" value={proposal.id} />
          <input
            name="note"
            className={styles.input}
            style={{ maxWidth: "26rem" }}
            placeholder="Why not — this is the signal"
            aria-label="Why not"
          />
          <button className={styles.buttonQuiet} type="submit">
            Not this one
          </button>
        </form>
      </div>
    </article>
  );
}

/**
 * One block of the curator's account.
 *
 * Renders NOTHING when the list is empty — no heading over an empty body. The
 * same rule src/lib/selection/member.ts states for her side of the wall, for a
 * smaller reason that is still a real one: a screen full of empty headings is a
 * screen people stop reading, and the gap list is the only thing telling the
 * house what to write next.
 */
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
      <h4 className={styles.railHead}>{title}</h4>
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
