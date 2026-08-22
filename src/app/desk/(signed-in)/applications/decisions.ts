import "server-only";

import { query } from "@/lib/db";

/**
 * WHO DECIDED, AND HOW FAR IT WAS FROM WHAT THE ENGINE WANTED.
 *
 * The desk no longer decides an individual Revelle. The engine ranks, the
 * member is shown two or three, she taps one, and her pick is the record. What
 * is left for a person to do at this desk is READ THE DIVERGENCE: the distance
 * between the destination the engine ranked first and the one she actually
 * took. THE SEAM in src/lib/destinations.ts calls that "the only per-host data
 * that will ever say whether the voice layer or the structural layer is
 * mis-weighted", and until this file nothing in the tool showed it.
 *
 * ── system_default IS NOT AGREEMENT ──────────────────────────────────
 *
 * db/027's whole reason for existing, and the one rule this module enforces.
 * The reveal has an abandonment path: on timeout the top-ranked destination is
 * taken by default, and it lands in exactly the columns a member's own pick
 * lands in — status 'approved', rank 1 — where it reads as the engine being
 * agreed with. It is not. Nothing here may collapse `system_default` into
 * `member`, and a decided row whose `decided_by_kind` is null is UNATTRIBUTED
 * rather than agreed with. Both are rendered as what they are, and `agreed` is
 * true for one value of one column and nothing else.
 *
 * ── WHY THIS READS DEFENSIVELY ───────────────────────────────────────
 *
 * db/027 is new, and a database that has not had it applied has no
 * `decided_by_kind` column at all. The divergence itself — the rank taken, the
 * scores, which candidate it was — predates that migration and is worth reading
 * on its own, so a missing column falls back to the columns that have always
 * been there rather than taking the inbox down over a migration nobody has run
 * yet. The fallback answers "who decided" with null, which the screens say out
 * loud. A second failure is a real one and is allowed to throw.
 *
 * `revelle_proposal_live` is `select p.*` over the proposal table (db/018), so
 * the new column arrives in the view with the migration and no view is rebuilt.
 */

export type DecisionKind = "member" | "system_default" | "founder_override";

/** What each value of db/027's enum is called on a screen. */
export const DECISION_KIND: Readonly<Record<DecisionKind, string>> = {
  member: "Her pick",
  system_default: "Timeout default",
  founder_override: "Founder override",
};

/** The sentence under the label. `system_default` gets the longest one. */
export const DECISION_MEANS: Readonly<Record<DecisionKind, string>> = {
  member: "She was shown the reveal and tapped this one. This is the record.",
  system_default:
    "Nobody tapped. The reveal timed out and the top-ranked destination was " +
    "taken by default. This is NOT agreement with the engine and must never " +
    "be counted as any — see db/027.",
  founder_override:
    "A person overrode the engine on her behalf. Rare, and always staffed.",
};

export type Candidate = {
  proposalId: string;
  rank: number;
  status: string;
  worldName: string;
  /** How well the destination matched her vector, 0–1. */
  destinationScore: number;
};

export type Divergence = {
  /** How many candidates the run produced. The reveal shows two or three. */
  candidates: number;
  /** The engine's own first choice from that run. */
  top: Candidate;
  /** What was taken, or null while the reveal is still open. */
  chosen: Candidate | null;
  /** db/027. Null on a decided row means nobody recorded who decided. */
  kind: DecisionKind | null;
  decidedAt: string | null;
  /**
   * TRUE ONLY FOR A MEMBER WHO TOOK RANK 1. A timeout that took rank 1 is not
   * agreement and neither is an unattributed decision; see the note above.
   */
  agreed: boolean;
  /** 0 when she took the engine's first choice. Null while undecided. */
  rankGap: number | null;
  /** Destination score given up by not taking rank 1. Null while undecided. */
  scoreGap: number | null;
};

type Row = {
  quiz_response_id: string;
  id: string;
  rank: number;
  status: string;
  world_name: string;
  destination_score: string;
  decided_at: Date | null;
  job_id: string;
  decided_by_kind: string | null;
};

const COLUMNS = `quiz_response_id, id, rank, status::text as status, world_name,
                 destination_score, decided_at, job_id`;

const KINDS: readonly string[] = ["member", "system_default", "founder_override"];

async function readRows(ids: readonly string[]): Promise<Row[]> {
  const sql = (withKind: boolean) =>
    `select ${COLUMNS},
            ${withKind ? "decided_by_kind::text" : "null::text"} as decided_by_kind
       from revelle_proposal_live
      where quiz_response_id = any($1::uuid[])
      order by created_at desc, rank`;

  try {
    return await query<Row>(sql(true), [ids]);
  } catch (err) {
    // Only the missing column is survivable. Anything else throws on the retry.
    console.warn(
      "[desk] decided_by_kind unavailable, falling back — apply db/027:",
      err instanceof Error ? err.message : String(err)
    );
    return query<Row>(sql(false), [ids]);
  }
}

function candidate(row: Row): Candidate {
  return {
    proposalId: row.id,
    rank: Number(row.rank),
    status: row.status,
    worldName: row.world_name,
    destinationScore: Number(row.destination_score),
  };
}

/**
 * The divergence for each of these applications, keyed by application id.
 *
 * Applications with no proposals at all are absent from the map rather than
 * present and empty: "the engine has not run" and "the engine ran and she has
 * not answered" are different facts and the screens say different things about
 * them.
 *
 * THE RUN THAT COUNTS is the one the decision came out of, not the newest —
 * a later run supersedes an older set, and reading her pick against candidates
 * she was never shown would be a divergence measured against the wrong thing.
 * With nothing decided yet, the newest run is the one she is being shown.
 */
export async function readDecisions(
  quizResponseIds: readonly string[]
): Promise<Map<string, Divergence>> {
  const ids = [...new Set(quizResponseIds)];
  if (ids.length === 0) return new Map();

  const byApplication = new Map<string, Row[]>();
  for (const row of await readRows(ids)) {
    const list = byApplication.get(row.quiz_response_id);
    if (list) list.push(row);
    else byApplication.set(row.quiz_response_id, [row]);
  }

  const out = new Map<string, Divergence>();
  for (const [applicationId, all] of byApplication) {
    const decided = all.find((row) => row.status === "approved") ?? null;
    const runId = decided ? decided.job_id : all[0].job_id;
    const run = all
      .filter((row) => row.job_id === runId)
      .sort((a, b) => Number(a.rank) - Number(b.rank));
    if (run.length === 0) continue;

    const top = candidate(run[0]);
    const chosen = decided ? candidate(decided) : null;
    const kind =
      decided && decided.decided_by_kind !== null &&
      KINDS.includes(decided.decided_by_kind)
        ? (decided.decided_by_kind as DecisionKind)
        : null;

    out.set(applicationId, {
      candidates: run.length,
      top,
      chosen,
      kind,
      decidedAt: decided?.decided_at?.toISOString() ?? null,
      agreed: chosen !== null && chosen.rank === top.rank && kind === "member",
      rankGap: chosen === null ? null : chosen.rank - top.rank,
      scoreGap:
        chosen === null ? null : top.destinationScore - chosen.destinationScore,
    });
  }
  return out;
}

/**
 * One line for a list. The detail page says more; this is what fits on a row.
 *
 * Every branch names what actually happened. There is deliberately no "agreed"
 * shorthand that a timeout could fall into.
 */
export function decisionLine(divergence: Divergence): string {
  const { chosen, top, candidates, kind, rankGap } = divergence;
  const of = `${candidates} candidate${candidates === 1 ? "" : "s"}`;

  if (chosen === null) return `${of} · nothing taken yet`;

  const who = kind === null ? "Decided, unattributed" : DECISION_KIND[kind];
  const where = `rank ${chosen.rank} of ${candidates}`;
  if (rankGap === 0) {
    return kind === "member"
      ? `${who} · ${where} · she took the engine's first choice`
      : `${who} · ${where} · not agreement`;
  }
  return `${who} · ${where} · the engine wanted ${top.worldName}`;
}
