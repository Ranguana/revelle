import "server-only";

import { pool, queryOne, transaction } from "@/lib/db";
import { enqueueJob } from "@/lib/jobs";
import { GENERATE, generateDedupeKey } from "@/lib/revelle/generate";
import {
  approve,
  deliver,
  discard,
  readProposals,
  reject,
  type Proposal,
  type Queryable,
} from "@/lib/revelle/proposals";

/**
 * THE DESK'S SIDE OF GENERATION.
 *
 * src/lib/revelle/proposals.ts is framework-free and takes a database handle,
 * the same discipline the selection engine and the queue keep — which is what
 * lets it be exercised by `node --test` against a throwaway database. This file
 * is the thin layer that gives it the app's pool and its transactions, exactly
 * as src/lib/desk/room.ts does for db/013's two tables.
 *
 * It is the ONLY place the desk writes a proposal or an approval, so the rules
 * that are not constraints live here rather than in four Server Actions.
 *
 * ── EVERY WRITE HERE IS INSIDE A TRANSACTION ─────────────────────────
 *
 * Approval writes a `revelle` row and then one row per placed ingredient, and a
 * Revelle carrying half an assemblage is worse than none: db/002's trigger
 * recomputes the fingerprint on every ingredient row, so a half-written
 * assemblage has a real, wrong digest for as long as it exists.
 */

export type { Proposal, ProposalPick } from "@/lib/revelle/proposals";

/** The pool as a `Queryable`, called per query for the reason in db.ts. */
const db: Queryable = {
  query: (text: string, params?: unknown[]) =>
    pool().query(text, params ?? []) as Promise<{
      rows: Record<string, unknown>[];
    }>,
};

/* ── reading ──────────────────────────────────────────────────────── */

/** Everything ever proposed for this application, newest run first. */
export function applicationProposals(
  quizResponseId: string
): Promise<Proposal[]> {
  return readProposals(db, quizResponseId);
}

/**
 * WHERE THE RUN GOT TO.
 *
 * db/008's `revelle_generation_status` view is keyed on `revelle_id`, and a
 * generation job has none — there is no Revelle until a curator approves one,
 * which is the whole point. So this reads the job row directly, through the
 * partial expression index db/018 adds for exactly this.
 *
 * The `result` field carries the run's own account, including the IMPASSE
 * sentence — the one outcome that produces no candidates at all and therefore
 * has nowhere else to live.
 */
export type GenerationRun = {
  jobId: string;
  status: string;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  finishedAt: string | null;
  runAfter: string;
  lastError: string | null;
  result: Record<string, unknown> | null;
};

export async function latestRun(
  quizResponseId: string
): Promise<GenerationRun | null> {
  const row = await queryOne<{
    id: string;
    status: string;
    attempts: number;
    max_attempts: number;
    created_at: Date;
    finished_at: Date | null;
    run_after: Date;
    last_error: string | null;
    result: Record<string, unknown> | null;
  }>(
    `select id, status::text as status, attempts, max_attempts,
            created_at, finished_at, run_after, last_error, result
       from job
      where type = $1 and payload ->> 'quizResponseId' = $2
      order by created_at desc
      limit 1`,
    [GENERATE, quizResponseId]
  );
  if (!row) return null;
  return {
    jobId: row.id,
    status: row.status,
    attempts: Number(row.attempts),
    maxAttempts: Number(row.max_attempts),
    createdAt: row.created_at.toISOString(),
    finishedAt: row.finished_at?.toISOString() ?? null,
    runAfter: row.run_after.toISOString(),
    lastError: row.last_error,
    result: row.result,
  };
}

/** The Revelle this application has, if a curator has approved one. */
export type ApprovedRevelle = {
  id: string;
  status: string;
  firstDeliveredAt: string | null;
  accessToken: string;
  voiceId: string | null;
};

export async function approvedRevelle(
  quizResponseId: string
): Promise<ApprovedRevelle | null> {
  const row = await queryOne<{
    id: string;
    status: string;
    first_delivered_at: Date | null;
    access_token: string;
    voice_id: string | null;
  }>(
    `select id, status::text as status, first_delivered_at, access_token, voice_id
       from revelle where quiz_response_id = $1`,
    [quizResponseId]
  );
  if (!row) return null;
  return {
    id: row.id,
    status: row.status,
    firstDeliveredAt: row.first_delivered_at?.toISOString() ?? null,
    accessToken: row.access_token,
    voiceId: row.voice_id,
  };
}

/* ── writing ──────────────────────────────────────────────────────── */

export type Outcome =
  | { ok: true; summary: string; detail: Record<string, unknown> }
  | { ok: false; reason: string };

/**
 * ANOTHER RUN.
 *
 * Generation is automatic — a job is enqueued in the same transaction as the
 * application — so this is not how a Revelle normally comes to exist and must
 * not become the only path. It is the "ask for another" half of "approve one,
 * or reject it and ask for another": a curator who does not like any of three
 * candidates gets three more, from a new seed, against whatever the catalogue
 * holds today.
 *
 * The dedupe key is live-only, so pressing this twice while the first run is
 * still going gives back the first job rather than making a second.
 *
 * REFUSED ONCE THE REVELLE HAS BEEN DELIVERED. That is db/003's ratchet: the
 * assemblage is claimed for good, and generating fresh candidates for an
 * application whose Revelle is already in somebody's hands is offering a
 * choice that cannot be taken.
 */
export async function requestGeneration(
  quizResponseId: string
): Promise<Outcome> {
  const existing = await approvedRevelle(quizResponseId);
  if (existing?.firstDeliveredAt) {
    return {
      ok: false,
      reason:
        `This application's Revelle was delivered on ` +
        `${existing.firstDeliveredAt.slice(0, 10)}. It is hers, and there is ` +
        `no reissue — asking the engine for another set would be offering a ` +
        `choice nobody can take.`,
    };
  }

  const { job, created } = await enqueueJob({
    type: GENERATE,
    payload: { quizResponseId },
    dedupeKey: generateDedupeKey(quizResponseId),
  });

  return {
    ok: true,
    summary: created
      ? `Asked the engine for another set`
      : `A run was already under way`,
    detail: { jobId: job.id, created },
  };
}

export async function approveProposal(
  proposalId: string,
  staffId: string
): Promise<Outcome> {
  return transaction(async (client) => {
    const result = await approve(client, { proposalId, staffId });
    if (!result.ok) return result;

    const named = await client.query<{ world: string; email: string }>(
      `select w.name as world, c.email::text as email
         from revelle_proposal p
         join world w on w.id = p.world_id
         join quiz_response qr on qr.id = p.quiz_response_id
         join customer c on c.id = qr.customer_id
        where p.id = $1`,
      [proposalId]
    );
    const row = named.rows[0];

    return {
      ok: true,
      summary: `Approved ${row?.world ?? "a proposal"} for ${row?.email ?? "her"}`,
      detail: { proposalId, revelleId: result.revelleId },
    };
  });
}

export async function rejectProposal(
  proposalId: string,
  staffId: string,
  note: string | null
): Promise<Outcome> {
  return transaction(async (client) => {
    const result = await reject(client, { proposalId, staffId, note });
    if (!result.ok) return result;
    return {
      ok: true,
      summary: note ? `Rejected a proposal: ${note}` : `Rejected a proposal`,
      detail: { proposalId, note },
    };
  });
}

export async function discardApproval(
  quizResponseId: string,
  staffId: string
): Promise<Outcome> {
  return transaction(async (client) => {
    const result = await discard(client, { quizResponseId, staffId });
    if (!result.ok) return result;
    return {
      ok: true,
      summary: `Discarded an undelivered Revelle so it could be chosen again`,
      detail: { quizResponseId, revelleId: result.revelleId },
    };
  });
}

/**
 * Deliver. The transition that arms db/003's ratchet.
 *
 * A refusal ROLLS BACK — thrown rather than returned — because the write has
 * already happened by the time the voice pin can be checked, and a Revelle left
 * sitting in 'delivered' with no voice would be the exact thing the check
 * exists to prevent. See `deliver` in src/lib/revelle/proposals.ts.
 */
export async function deliverRevelle(revelleId: string): Promise<Outcome> {
  class Refused extends Error {}
  try {
    return await transaction(async (client) => {
      const result = await deliver(client, { revelleId });
      if (!result.ok) throw new Refused(result.reason);
      return {
        ok: true as const,
        summary: `Delivered a Revelle`,
        detail: { revelleId },
      };
    });
  } catch (err) {
    if (err instanceof Refused) return { ok: false, reason: err.message };
    // db/003's guard speaks in sentences — DETAIL and HINT name the other
    // Revelle and the ingredients they share — and re-wording it here would
    // throw away the only thing a curator can act on.
    const message = err instanceof Error ? err.message : String(err);
    const detail =
      err && typeof err === "object" && "detail" in err
        ? String((err as { detail?: unknown }).detail ?? "")
        : "";
    const hint =
      err && typeof err === "object" && "hint" in err
        ? String((err as { hint?: unknown }).hint ?? "")
        : "";
    return {
      ok: false,
      reason: [message, detail, hint].filter(Boolean).join(" "),
    };
  }
}
