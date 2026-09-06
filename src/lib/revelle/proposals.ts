/**
 * THE JOIN BETWEEN THE TWO HALVES.
 *
 * The selection engine can choose; the queue can run work. Neither one knew
 * about the other, so an application arrived, landed in the desk inbox, and
 * stopped. This module is what a run of the engine leaves behind: the
 * candidates, as rows, in db/018's two tables — and the one operation that
 * turns the best of them into a `revelle`.
 *
 * ── FRAMEWORK-FREE, LIKE EVERYTHING IT SITS BETWEEN ──────────────────
 *
 * Every function takes a `Queryable` as its first argument, the same discipline
 * src/lib/selection/catalogue.ts and src/lib/jobs/queue.ts keep. No pool, no
 * `server-only`, no Next.js. A `pg.Pool`, a `pg.Client` and a transaction's
 * `PoolClient` all satisfy it, which is what lets the job handler pass the
 * runner's handle, the desk pass a transaction client, and `node --test` pass a
 * throwaway database.
 *
 * ── THE ONE RULE ABOUT TRANSACTIONS ──────────────────────────────────
 *
 * `persistRun` is a SINGLE statement. It has to be: the job runner hands
 * handlers a pool wrapper and not a client (see the note on JobContext in
 * src/lib/jobs/types.ts — a handler that runs for four minutes must not hold a
 * connection open for four minutes), and `begin` on a pool is a promise that
 * the next query lands on the same connection, which it does not. One
 * data-modifying-CTE statement is a transaction whether or not anybody gave us
 * one.
 *
 * `approve`, `discard` and `deliver` are several statements and each one says
 * so in its own doc comment: they must be given a client that is already inside
 * a transaction. They are called from Server Actions, which have one.
 *
 * ── AT-LEAST-ONCE, SAID OUT LOUD ─────────────────────────────────────
 *
 * db/008 is explicit that a slow handler whose lease expires runs twice and
 * that both copies do the work. Two things here answer that, and they are
 * deliberately belt and braces:
 *
 *   1. `seedForJob` derives the engine's seed from the JOB ID, so the second
 *      run of a job computes the identical candidates rather than a fresh
 *      random set. Retrying generation is not a re-roll.
 *   2. `persistRun` inserts `on conflict (job_id, rank) do nothing`, so the
 *      second run writes nothing at all and its picks are never reached.
 *
 * (1) alone would still write duplicate picks; (2) alone would leave two runs
 * of one job disagreeing about what was proposed. Together the operation is
 * idempotent in both senses — same input, same output, written once.
 */

import { createHash } from "node:crypto";

import type {
  Candidate,
  SelectionResult,
} from "@/lib/selection/types";

export type Queryable = {
  query: (
    text: string,
    params?: unknown[]
  ) => Promise<{ rows: Record<string, unknown>[] }>;
};

/**
 * Every pool the engine can place, and where an approved pick lands.
 *
 * ── THE ARGUMENT THIS KEEPS, AND THE HALF OF IT THAT WAS WRONG ───────
 *
 * It read, verbatim (CLAUDE.md rule 14):
 *
 *     A fixed constant of this module — the values never come from a request,
 *     and `pool` arriving from the database is FK'd to `ingredient_pool` and
 *     is looked up in this map rather than interpolated, so an unregistered
 *     pool is an exception here instead of an identifier in a statement. Same
 *     argument src/lib/selection/catalogue.ts makes for the read side.
 *
 *     Adding a sixth pool is one entry, exactly as it is there.
 *
 * The first paragraph stands and is still why `poolSpec` exists: a value FK'd
 * to a registry is not the same thing as a value safe to concatenate, and the
 * lookup is what converts one into the other.
 *
 * The last sentence is the one CLAUDE.md rule 19 reverses. "Adding a pool is
 * one entry" is exactly the shape of a list that lies in wait — it is correct
 * until the migration runs and then wrong WITHOUT BEING BROKEN. The list had
 * already gone stale twice over: `dish` (db/021) and `bank_item` (db/031) were
 * both registered pools with join tables, and neither was here. Both are now.
 *
 * ── WHY THIS ONE STAYS A MAP AND `portal/picks.ts` DID NOT ───────────
 *
 * Because what is looked up here is not WHICH POOLS EXIST — the registry
 * settles that, and every reader of this map is already handed a pool that
 * came out of `revelle_proposal_pick.pool`, which is FK'd to it. What is
 * looked up is the column holding the sentence a curator reads, and that is a
 * fact about authoring rather than about the schema: a menu's line of dishes
 * IS the thing (db/012), a drink has two authored lines on one row (db/017),
 * and a dish has no description column at all because the plate is the
 * sentence (db/021). src/lib/portal/picks.ts makes the same split for the same
 * reason and its essay is the long version.
 *
 * So the loud form here is `poolSpec` rather than a registry loop, and rule
 * 19's requirement is met by making sure NOTHING SLIPS PAST IT — see the note
 * on `readPicks` below, which is where a missing entry used to be swallowed.
 */
const POOLS: readonly {
  pool: string;
  table: string;
  /** The column holding the sentence a member reads. See db/012 and db/017. */
  describe: string;
}[] = [
  { pool: "product", table: "product", describe: "description" },
  { pool: "game", table: "game", describe: "description" },
  { pool: "tracklist", table: "tracklist", describe: "description" },
  { pool: "menu", table: "menu", describe: "dishes" },
  { pool: "drink", table: "drink", describe: "cocktails" },
  // db/021's pool. `describe` is the dish's own NAME: there is no description
  // column and db/021 declines to add one, because the plate is the sentence.
  { pool: "dish", table: "dish", describe: "name" },
  // db/031's atmosphere pool — goods, host acts, games and printed cards.
  { pool: "bank_item", table: "bank_item", describe: "description" },
];

/**
 * The pool, or a named failure.
 *
 * The only door onto POOLS, and both the read and the write path go through it
 * so the two cannot come to disagree about which pools this module handles.
 */
function poolSpec(pool: string): (typeof POOLS)[number] {
  const spec = POOLS.find((entry) => entry.pool === pool);
  if (!spec) {
    throw new Error(
      `pool ${JSON.stringify(pool)} is not one this module knows how to ` +
        `materialise. Add it to POOLS in src/lib/revelle/proposals.ts, the ` +
        `same entry src/lib/selection/catalogue.ts needs, and the entry ` +
        `RENDERING in src/lib/portal/picks.ts needs before anything issued ` +
        `into it can reach a member.`
    );
  }
  return spec;
}

/* ── the seed ─────────────────────────────────────────────────────── */

/**
 * THE ENGINE'S SEED, DERIVED FROM THE JOB ID.
 *
 * `arbitrarySeed()` is right for a curator asking for another look; it is
 * exactly wrong for a retry. A job that is claimed twice — a lease that expired
 * under a slow run, an instance replaced mid-flight — must not produce a
 * different set of candidates the second time, because "which one you get
 * depends on whether the first attempt timed out" is not a system anybody can
 * reason about, and because the two attempts would then race to write
 * contradictory proposals under one job id.
 *
 * The first four bytes of sha256(job id), as an unsigned 32-bit integer, which
 * is what `rng()` takes. The value is stored on every proposal row, so the run
 * stays reproducible from the row alone without anybody knowing this rule.
 */
export function seedForJob(jobId: string): number {
  return createHash("sha256").update(jobId, "utf8").digest().readUInt32BE(0);
}

/* ── writing a run ────────────────────────────────────────────────── */

export type PersistInput = {
  jobId: string;
  quizResponseId: string;
  result: SelectionResult;
};

export type PersistOutcome = {
  /** How many proposals this call actually wrote. Zero on a repeat run. */
  created: number;
  /** How many the run produced, written by this attempt or an earlier one. */
  candidates: number;
};

/**
 * Write what one run found.
 *
 * One statement, for the reason in the header. It supersedes any earlier run's
 * proposals for this application in the same breath: a curator looking at this
 * screen must be choosing between the candidates that were just made, not
 * between those and a set from three days ago that referred to a thinner
 * catalogue. An APPROVED proposal is never superseded — that one is a decision
 * and a `revelle` hangs off it.
 */
export async function persistRun(
  db: Queryable,
  input: PersistInput
): Promise<PersistOutcome> {
  const { jobId, quizResponseId, result } = input;
  const candidates = result.candidates;

  if (candidates.length === 0) {
    // An impasse, or a catalogue with nothing publishable in it. Nothing to
    // write, and deliberately no placeholder row: the run's own account is on
    // the job's `result`, which is where a run that produced nothing belongs.
    return { created: 0, candidates: 0 };
  }

  const doc = candidates.map((candidate) =>
    encode(candidate, result.seed, result.excluded)
  );

  const { rows } = await db.query(
    `with input as (
       select (c.value ->> 'rank')::integer as rank, c.value as doc
         from jsonb_array_elements($3::jsonb) c
     ),
     -- Everything from an earlier run stops being an option. Ordered before
     -- the insert in the same statement, so there is no instant in which two
     -- runs' proposals are both live.
     stale as (
       update revelle_proposal
          set status = 'superseded'
        where quiz_response_id = $1
          and job_id <> $2
          and status = 'proposed'
       returning id
     ),
     made as (
       insert into revelle_proposal
         (quiz_response_id, job_id, rank, world_id, seed,
          destination_score, score, fingerprint, low_confidence, blocked,
          explanation, budget, gaps, excluded, dropped, swaps)
       select $1,
              $2,
              i.rank,
              (i.doc ->> 'worldId')::uuid,
              (i.doc ->> 'seed')::bigint,
              (i.doc ->> 'destinationScore')::numeric,
              (i.doc ->> 'score')::numeric,
              i.doc ->> 'fingerprint',
              (i.doc ->> 'lowConfidence')::boolean,
              i.doc ->> 'blocked',
              i.doc -> 'explanation',
              i.doc -> 'budget',
              i.doc -> 'gaps',
              i.doc -> 'excluded',
              i.doc -> 'dropped',
              i.doc -> 'swaps'
         from input i
       -- THE AT-LEAST-ONCE GUARD. A second run of this job finds its own rows
       -- and writes nothing; the CTE below is then empty and no pick is
       -- inserted either, because the picks join to it.
       on conflict (job_id, rank) do nothing
       returning id, rank
     ),
     picks as (
       insert into revelle_proposal_pick
         (proposal_id, slot_key, pool, entity_id, slot_code, slot_label,
          section, required, quantity, per_guest, day_index, position,
          offer_group, forced, alternatives, unit_cost_cents, line_cost_cents,
          score)
       select m.id,
              p.value ->> 'slotKey',
              p.value ->> 'pool',
              (p.value ->> 'entityId')::uuid,
              p.value ->> 'slotCode',
              p.value ->> 'slotLabel',
              (p.value ->> 'section')::section_kind,
              (p.value ->> 'required')::boolean,
              (p.value ->> 'quantity')::integer,
              (p.value ->> 'perGuest')::boolean,
              (p.value ->> 'dayIndex')::integer,
              (p.value ->> 'position')::integer,
              p.value ->> 'offerGroup',
              (p.value ->> 'forced')::boolean,
              (p.value ->> 'alternatives')::integer,
              (p.value ->> 'unitCostCents')::integer,
              (p.value ->> 'lineCostCents')::integer,
              (p.value ->> 'score')::numeric
         from made m
         join input i on i.rank = m.rank
         cross join lateral jsonb_array_elements(i.doc -> 'picks') p
       returning proposal_id
     )
     select (select count(*) from made) as created`,
    [quizResponseId, jobId, JSON.stringify(doc)]
  );

  return {
    created: Number(rows[0]?.created ?? 0),
    candidates: candidates.length,
  };
}

/**
 * One candidate, flattened for the statement above.
 *
 * The picks are DEDUPED BY INGREDIENT before they are written, and that is not
 * a nicety. `revelle_<pool>` is keyed `(revelle_id, <pool>_id)` in db/002, so
 * the same ingredient in two slots is a row that cannot exist there; catching
 * it at proposal time means the desk never shows a curator something approval
 * would refuse. The engine does not do this today — the fill avoids collisions
 * — but "does not today" is not a constraint.
 */
function encode(
  candidate: Candidate,
  runSeed: number,
  /**
   * SLOTS SHE DOES NOT HAVE. A property of the RUN and not of a candidate —
   * the occasion gate and her exclusions are settled once, before any
   * destination is chosen (see planSlots in the engine) — and copied onto each
   * proposal so a curator reading one candidate sees the whole account without
   * a join. Never merged into `gaps`: db/014 exists to keep those apart.
   */
  excluded: SelectionResult["excluded"]
): Record<string, unknown> {
  const seen = new Set<string>();
  const picks: Record<string, unknown>[] = [];

  for (const pick of candidate.picks) {
    const key = `${pick.ingredient.pool}:${pick.ingredient.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    picks.push({
      slotKey: pick.slot.key,
      pool: pick.ingredient.pool,
      entityId: pick.ingredient.id,
      slotCode: pick.slot.slotCode,
      slotLabel: pick.slot.label,
      section: pick.slot.section,
      required: pick.slot.required,
      quantity: pick.slot.quantity,
      perGuest: pick.slot.perGuest,
      dayIndex: pick.slot.dayIndex,
      position: pick.slot.position,
      // db/061. Which set of alternatives this pick belongs to, or null when
      // the beat offered one candidate. Copied, like every other slot fact
      // here, because it records what the ENGINE decided — occasion_slot's
      // offer_count may be edited between the run and the approval.
      offerGroup: pick.slot.offerGroup ?? null,
      forced: pick.forced,
      alternatives: pick.alternatives,
      unitCostCents: pick.unitCost,
      lineCostCents: pick.lineCost,
      score: round(pick.score),
    });
  }

  return {
    rank: candidate.rank,
    worldId: candidate.destination.id,
    seed: runSeed,
    destinationScore: round(candidate.destinationScore),
    score: round(candidate.score),
    fingerprint: candidate.fingerprint,
    lowConfidence: candidate.lowConfidence,
    blocked: candidate.blocked,
    explanation: candidate.explanation,
    budget: candidate.budget,
    gaps: candidate.gaps,
    excluded,
    dropped: candidate.dropped,
    swaps: candidate.swaps,
    picks,
  };
}

/** The columns are numeric(_,4); rounding here rather than letting Postgres do
 *  it keeps what is stored equal to what a test asserts on. */
function round(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

/* ── reading a run ────────────────────────────────────────────────── */

export type ProposalPick = {
  slotKey: string;
  pool: string;
  entityId: string;
  slotCode: string;
  slotLabel: string;
  section: string;
  required: boolean;
  quantity: number;
  perGuest: boolean;
  dayIndex: number | null;
  position: number;
  forced: boolean;
  alternatives: number;
  unitCostCents: number | null;
  lineCostCents: number | null;
  score: number;
  /** The ingredient as it is named today, not as it was named at proposal. */
  name: string;
  description: string;
};

export type Proposal = {
  id: string;
  rank: number;
  status: "proposed" | "approved" | "rejected" | "superseded";
  worldId: string;
  worldSlug: string;
  worldName: string;
  worldTagline: string;
  seed: string;
  destinationScore: number;
  score: number;
  fingerprint: string | null;
  lowConfidence: boolean;
  blocked: string | null;
  /**
   * THE CURATOR'S ACCOUNT, and every field of it house-facing. Typed loosely
   * because nothing in this module reads inside it — it is prose, written by
   * src/lib/selection/explain.ts, rendered verbatim, never rewritten.
   */
  explanation: Record<string, unknown>;
  budget: Record<string, unknown>;
  gaps: Record<string, unknown>[];
  excluded: Record<string, unknown>[];
  dropped: Record<string, unknown>[];
  swaps: Record<string, unknown>[];
  /**
   * WHETHER THIS DESTINATION CAN SPEAK — db/004's published voice, joined at
   * read time. Null means it has a look and no voice, which is legal, common
   * today, and the one condition `approve` refuses on. See the essay there.
   */
  voiceId: string | null;
  voiceVersion: number | null;
  revelleId: string | null;
  decisionNote: string | null;
  decidedAt: string | null;
  createdAt: string;
  jobId: string;
  picks: ProposalPick[];
};

/**
 * Everything proposed for this application, best first.
 *
 * Includes superseded and rejected ones deliberately: "we already tried that
 * and she said no" is the most useful thing on the screen when a curator is
 * looking at a second run, and hiding it would make the desk re-litigate a
 * decision it has already recorded.
 */
export async function readProposals(
  db: Queryable,
  quizResponseId: string
): Promise<Proposal[]> {
  const { rows } = await db.query(
    `select id, rank, status::text as status, world_id, world_slug, world_name,
            world_tagline, seed::text as seed,
            destination_score, score, fingerprint, low_confidence, blocked,
            explanation, budget, gaps, excluded, dropped, swaps,
            voice_id, voice_version, revelle_id, decision_note, decided_at,
            created_at, job_id
       from revelle_proposal_live
      where quiz_response_id = $1
      order by created_at desc, rank`,
    [quizResponseId]
  );
  if (rows.length === 0) return [];

  const picks = await readPicks(
    db,
    rows.map((row) => String(row.id))
  );

  return rows.map((row) => ({
    id: str(row.id),
    rank: Number(row.rank),
    status: str(row.status) as Proposal["status"],
    worldId: str(row.world_id),
    worldSlug: str(row.world_slug),
    worldName: str(row.world_name),
    worldTagline: str(row.world_tagline),
    seed: str(row.seed),
    destinationScore: Number(row.destination_score),
    score: Number(row.score),
    fingerprint: nullable(row.fingerprint),
    lowConfidence: Boolean(row.low_confidence),
    blocked: nullable(row.blocked),
    explanation: object(row.explanation),
    budget: object(row.budget),
    gaps: array(row.gaps),
    excluded: array(row.excluded),
    dropped: array(row.dropped),
    swaps: array(row.swaps),
    voiceId: nullable(row.voice_id),
    voiceVersion: row.voice_version === null ? null : Number(row.voice_version),
    revelleId: nullable(row.revelle_id),
    decisionNote: nullable(row.decision_note),
    decidedAt: iso(row.decided_at),
    createdAt: iso(row.created_at) ?? "",
    jobId: str(row.job_id),
    picks: picks.get(str(row.id)) ?? [],
  }));
}

/**
 * The picks of several proposals at once, with the ingredient's own words.
 *
 * A union over the pool registry rather than five round trips, and the pool
 * list is this module's constant — never a value from a request — which is what
 * makes composing the identifiers safe in the one way that matters.
 *
 * ── THE SILENT HALF, NOW CLOSED ──────────────────────────────────────
 *
 * `n` is a LEFT join and its miss coalesces to "(no longer in the catalogue)".
 * That sentence is right for the case it was written for — an ingredient
 * retired out from under a proposal nobody has decided yet — and it was a LIE
 * for the case nobody thought of: a pick from a pool simply absent from POOLS
 * printed the same words, and the row was in the catalogue the whole time,
 * offered and live. A curator reading that would reject a good proposal for a
 * reason that does not exist.
 *
 * So every pool that comes back is put through `poolSpec` before anything is
 * built from it. Same door as the write path, same named error. A pool this
 * module cannot read is now a failure at the desk — which is the house's own
 * surface, where a failure is a thing somebody can fix — instead of a
 * plausible sentence on a screen. CLAUDE.md rule 16: refuse it, drop it
 * visibly, or honour it; never take it in quietly.
 */
async function readPicks(
  db: Queryable,
  proposalIds: readonly string[]
): Promise<Map<string, ProposalPick[]>> {
  const named = POOLS.map(
    (spec) =>
      `select '${spec.pool}'::text as pool, t.id, t.name, ` +
      `coalesce(t.${spec.describe}, '') as description from ${spec.table} t`
  ).join("\n        union all\n        ");

  const { rows } = await db.query(
    `select k.proposal_id, k.slot_key, k.pool, k.entity_id, k.slot_code,
            k.slot_label, k.section::text as section, k.required, k.quantity,
            k.per_guest, k.day_index, k.position, k.forced, k.alternatives,
            k.unit_cost_cents, k.line_cost_cents, k.score,
            coalesce(n.name, '(no longer in the catalogue)') as name,
            coalesce(n.description, '') as description
       from revelle_proposal_pick k
       left join (
        ${named}
       ) n on n.pool = k.pool and n.id = k.entity_id
      where k.proposal_id = any($1::uuid[])
      order by k.position, k.slot_key`,
    [[...proposalIds]]
  );

  const out = new Map<string, ProposalPick[]>();
  for (const row of rows) {
    // Throws by name on a pool POOLS does not carry. See the note above: the
    // alternative is this row rendering as "(no longer in the catalogue)"
    // about an ingredient that is sitting in the catalogue, live.
    poolSpec(str(row.pool));
    const key = str(row.proposal_id);
    const list = out.get(key) ?? [];
    list.push({
      slotKey: str(row.slot_key),
      pool: str(row.pool),
      entityId: str(row.entity_id),
      slotCode: str(row.slot_code),
      slotLabel: str(row.slot_label),
      section: str(row.section),
      required: Boolean(row.required),
      quantity: Number(row.quantity),
      perGuest: Boolean(row.per_guest),
      dayIndex: row.day_index === null ? null : Number(row.day_index),
      position: Number(row.position),
      forced: Boolean(row.forced),
      alternatives: Number(row.alternatives),
      unitCostCents:
        row.unit_cost_cents === null ? null : Number(row.unit_cost_cents),
      lineCostCents:
        row.line_cost_cents === null ? null : Number(row.line_cost_cents),
      score: Number(row.score),
      name: str(row.name),
      description: str(row.description),
    });
    out.set(key, list);
  }
  return out;
}

/* ── deciding ─────────────────────────────────────────────────────── */

export type Refusal = { ok: false; reason: string };
export type Approval = { ok: true; revelleId: string };

/**
 * APPROVAL. The moment a proposal becomes hers.
 *
 * MUST be given a client already inside a transaction: it writes a `revelle`
 * row and then one row per pick into `revelle_<pool>`, and a Revelle carrying
 * half an assemblage would be worse than none — its fingerprint would be
 * computed over the half (db/002's trigger fires per ingredient row) and could
 * claim an assemblage nobody assembled.
 *
 * ── THE FOUR REFUSALS, AND WHY EACH ONE IS HERE ─────────────────────
 *
 *   1. NOT PROPOSED. Approving twice must not make two Revelles, and the
 *      `for update` above the check is what makes two curators clicking at
 *      once resolve to one approval rather than to a race.
 *
 *   2. BLOCKED. The one verdict the engine uses to withhold a whole candidate
 *      — this exact assemblage has already been delivered to somebody. db/003
 *      would refuse it at delivery anyway, with a good message; refusing it
 *      here means a curator finds out before she has told a customer.
 *
 *   3. NO VOICE. A destination with a look and no published voice cannot be
 *      written, so it cannot be delivered — the invitation, the menu card and
 *      the prep list are all written IN a voice (db/004), and there is no
 *      fallback voice by design. Generation does not refuse an unvoiced
 *      destination and must not; see the essay in
 *      src/lib/revelle/generate.ts. This is where it bites, because this is
 *      the first moment a human is present to be told why.
 *
 *   4. ALREADY HAS A REVELLE. `revelle.quiz_response_id` is unique, so the
 *      insert would fail anyway — but it would fail as a constraint violation,
 *      and a curator deserves the sentence rather than the error. When that
 *      Revelle has been DELIVERED this is the ratchet from db/003 talking, and
 *      the message says so.
 */
export async function approve(
  tx: Queryable,
  input: { proposalId: string; staffId: string }
): Promise<Approval | Refusal> {
  const { rows: locked } = await tx.query(
    `select p.id, p.quiz_response_id, p.job_id, p.world_id, p.status::text as status,
            p.blocked,
            qr.customer_id, qr.event_date, qr.guest_count_confirmed,
            (select v.id from world_voice v
              where v.world_id = p.world_id and v.status = 'published') as voice_id,
            w.name as world_name
       from revelle_proposal p
       join quiz_response qr on qr.id = p.quiz_response_id
       join world w on w.id = p.world_id
      where p.id = $1
        for no key update of p`,
    [input.proposalId]
  );

  const proposal = locked[0];
  if (!proposal) return { ok: false, reason: "That proposal does not exist." };

  if (str(proposal.status) !== "proposed") {
    return {
      ok: false,
      reason:
        `This proposal is ${str(proposal.status)} and cannot be approved. ` +
        `Only a live proposal can become a Revelle.`,
    };
  }

  if (proposal.blocked !== null && proposal.blocked !== undefined) {
    return {
      ok: false,
      reason:
        `The engine withheld this one: ${str(proposal.blocked)} ` +
        `Approve a different candidate, or ask for another run.`,
    };
  }

  if (proposal.voice_id === null || proposal.voice_id === undefined) {
    return {
      ok: false,
      reason:
        `${str(proposal.world_name)} has no published voice, so nothing in ` +
        `this Revelle could be written. Publish its voice first — the desk's ` +
        `destination page has the form — and this proposal becomes ` +
        `approvable with no re-run, because the voice is read fresh every ` +
        `time this page loads.`,
    };
  }

  const { rows: existing } = await tx.query(
    `select id, status::text as status, first_delivered_at
       from revelle where quiz_response_id = $1`,
    [str(proposal.quiz_response_id)]
  );

  if (existing[0]) {
    const delivered = existing[0].first_delivered_at !== null;
    return {
      ok: false,
      reason: delivered
        ? `This application already has a Revelle and it has been delivered. ` +
          `It is hers, and the assemblage is claimed for good — db/003 is ` +
          `explicit that there is no reissue, for anybody, ever. Nothing at ` +
          `this desk can re-roll it.`
        : `This application already has a Revelle (${str(existing[0].status)}). ` +
          `Discard it first if you mean to choose differently.`,
    };
  }

  const { rows: made } = await tx.query(
    `insert into revelle (customer_id, quiz_response_id, world_id,
                          event_date, guest_count, status)
     values ($1, $2, $3, $4, $5, 'preview')
     returning id`,
    [
      str(proposal.customer_id),
      str(proposal.quiz_response_id),
      str(proposal.world_id),
      proposal.event_date ?? null,
      proposal.guest_count_confirmed ?? null,
    ]
  );
  const revelleId = str(made[0].id);

  const { rows: picks } = await tx.query(
    `select pool, entity_id, slot_code, section::text as section, position,
            offer_group
       from revelle_proposal_pick where proposal_id = $1
      order by position, slot_key`,
    [input.proposalId]
  );

  for (const pick of picks) {
    const spec = poolSpec(str(pick.pool));
    await tx.query(
      // `revelle_<pool>` and `<pool>_id` are exactly what
      // install_revelle_ingredients() builds in db/002. Both halves come from
      // POOLS above — a constant of this module, never a request — which is
      // what makes composing them into a statement safe.
      //
      // SAFE IS NOT THE SAME AS COMPLETE, which is CLAUDE.md rule 19's point
      // and the reason `poolSpec` is called on the line above rather than the
      // map being indexed. A pool missing from POOLS cannot silently write
      // nothing here: it raises, inside the transaction, and the approval
      // rolls back whole. That is the loud form this path needs — a Revelle
      // materialised minus one of its pools is the same silent thinning the
      // portal read was fixed for, one table upstream.
      // `offer_exclusive` IS STAMPED HERE, AT DELIVERY, AND IS NEVER READ BACK
      // THROUGH TO THE SLOT — db/069. What kind of offer she received is a
      // fact about the promise the house made her, and db/003 fixes that at
      // delivery: a curator changing `occasion_slot.offer_rule` next March
      // must not reach back and turn a field day she has already picked three
      // games out of into a carousel that now refuses two of them.
      //
      // IT IS SUBQUERIED RATHER THAN CARRIED ON THE PICK because the pick was
      // computed by the planner and the stamp is a property of the moment of
      // delivery; those are different instants and the second one is the one
      // db/003 binds. If the slot has vanished between the two, the subquery
      // is null against a non-null offer_group and db/069's
      // `offer_has_a_kind` check refuses the insert — loudly, inside the
      // transaction, rolling the whole approval back. That is the right
      // failure: an offer whose rule nobody can state is an offer the portal
      // cannot honour, and a coalesce to `true` here would deliver it anyway
      // and look like it worked.
      `insert into revelle_${spec.table}
         (revelle_id, ${spec.table}_id, slot, slot_code, position, offer_group,
          offer_exclusive)
       select $1, $2, $3::section_kind, $4, $5, $6,
              case when $6::text is null then null else (
                select os.offer_rule = 'one_of'
                  from revelle r
                  join quiz_response qr on qr.id = r.quiz_response_id
                  join occasion_slot os
                    on os.occasion = qr.occasion and os.slot_code = $4
                 where r.id = $1
              ) end
       on conflict do nothing`,
      [
        revelleId,
        str(pick.entity_id),
        str(pick.section),
        str(pick.slot_code),
        Number(pick.position),
        // db/061. Null for everything the house places; the beat's key for a
        // candidate she chooses between. `chosen_at` is deliberately NOT set
        // here — approval delivers the offer, it does not make the choice.
        nullable(pick.offer_group),
      ]
    );
  }

  // `founder_override` because this path takes a staffId, and under db/027 that
  // is exactly what a staffed decision now is. THE MEMBER PATH DOES NOT EXIST
  // YET: when she picks from the reveal it must write kind = 'member' with
  // decided_by NULL, and a timeout must write 'system_default' — never
  // 'member', or the divergence measure fills with agreements nobody made.
  // The check constraint refuses a staff id on either of those.
  await tx.query(
    `update revelle_proposal
        set status = 'approved', revelle_id = $2,
            decided_at = now(), decided_by = $3,
            decided_by_kind = 'founder_override'
      where id = $1`,
    [input.proposalId, revelleId, input.staffId]
  );

  // Its siblings stop being options. Not `rejected` — nobody judged them, and
  // conflating the two would put a fabricated negative into the only signal
  // docs/selection-spec.md says is worth having.
  await tx.query(
    `update revelle_proposal
        set status = 'superseded'
      where quiz_response_id = $1 and id <> $2 and status = 'proposed'`,
    [str(proposal.quiz_response_id), input.proposalId]
  );

  return { ok: true, revelleId };
}

/**
 * "Not this one."
 *
 * One proposal, with a reason. Its siblings are untouched and still approvable,
 * which is the cheap half of "reject it and ask for another" — the expensive
 * half is a fresh run, and that is a separate act because it costs a job.
 *
 * The note is the point of the whole operation. docs/selection-spec.md: "Every
 * edit is a signal — a swapped product is a negative on what came out and a
 * positive on what went in, and those are the highest-value observations in the
 * system." There is nowhere else this sentence could live.
 */
export async function reject(
  tx: Queryable,
  input: { proposalId: string; staffId: string; note: string | null }
): Promise<{ ok: true } | Refusal> {
  const { rows } = await tx.query(
    // See the note in approve(): a staffId means founder_override under db/027.
    `update revelle_proposal
        set status = 'rejected', decided_at = now(), decided_by = $2,
            decided_by_kind = 'founder_override', decision_note = $3
      where id = $1 and status = 'proposed'
     returning id`,
    [input.proposalId, input.staffId, input.note]
  );
  if (rows.length === 0) {
    return {
      ok: false,
      reason: "That proposal is no longer live, so there is nothing to reject.",
    };
  }
  return { ok: true };
}

/**
 * UNDO AN APPROVAL — and the exact place db/003's ratchet is honoured.
 *
 * A Revelle that has never been delivered is disposable, and db/003 says so at
 * length: drafts and previews may collide with anything, in any number, because
 * nobody has them. Deleting one to choose again costs nothing anybody has.
 *
 * A Revelle that HAS been delivered is not. `first_delivered_at` is the ratchet
 * — set once, never cleared, surviving archival — and it is the fact the
 * uniqueness promise hangs on. Once it is set, this returns a refusal and
 * nothing at this desk can re-roll her Revelle. That is not a policy this
 * module invented; it is the same test db/003's index uses, asked here so that
 * a curator gets a sentence instead of a constraint violation.
 *
 * The delete cascades to `revelle_<pool>` (db/002) and the proposal returns to
 * `proposed`, so the alternatives from the same run become choosable again.
 * MUST be inside a transaction.
 */
export async function discard(
  tx: Queryable,
  input: { quizResponseId: string; staffId: string }
): Promise<{ ok: true; revelleId: string } | Refusal> {
  const { rows } = await tx.query(
    `select id, status::text as status, first_delivered_at
       from revelle where quiz_response_id = $1 for update`,
    [input.quizResponseId]
  );
  const revelle = rows[0];
  if (!revelle) {
    return { ok: false, reason: "There is no Revelle on this application." };
  }

  if (revelle.first_delivered_at !== null) {
    return {
      ok: false,
      reason:
        `This Revelle was delivered on ` +
        `${iso(revelle.first_delivered_at)?.slice(0, 10) ?? "an earlier date"}. ` +
        `It is hers and its assemblage is claimed for good — there is no ` +
        `reissue, for anybody, including her. A different Revelle for this ` +
        `application would have to vary at least one pooled ingredient, and ` +
        `that is a new application, not a re-roll of this one.`,
    };
  }

  await tx.query(
    `update revelle_proposal
        set status = 'proposed', revelle_id = null,
            decided_at = null, decided_by = null, decided_by_kind = null
      where revelle_id = $1`,
    [str(revelle.id)]
  );
  // The siblings this approval superseded become choosable again. Anything a
  // curator actively REJECTED stays rejected — that was a judgement and it
  // survives somebody changing her mind about a different candidate.
  await tx.query(
    `update revelle_proposal
        set status = 'proposed'
      where quiz_response_id = $1 and status = 'superseded'
        and job_id = (select job_id from revelle_proposal
                       where quiz_response_id = $1
                       order by created_at desc limit 1)`,
    [input.quizResponseId]
  );
  await tx.query(`delete from revelle where id = $1`, [str(revelle.id)]);

  return { ok: true, revelleId: str(revelle.id) };
}

/**
 * DELIVERY. The transition the ratchet is armed by.
 *
 * Everything that makes this irrevocable is already in the database and this
 * function only asks for the transition:
 *
 *   · db/003's guard stamps `first_delivered_at` and refuses the write if this
 *     assemblage has been delivered to anyone before, with a sentence naming
 *     the other Revelle and the ingredients they share;
 *   · db/004's guard pins `voice_id` to the destination's currently published
 *     voice, and freezes it there.
 *
 * The one thing added here is the check AFTER the transition: a Revelle that
 * came out of it with no pinned voice was issued in no voice at all, which
 * db/004 permits (older rows are like that) and which must never happen to a
 * new one. The transaction is rolled back by the caller on a refusal, so the
 * check is honest even though it reads after the write.
 *
 * MUST be inside a transaction.
 */
export async function deliver(
  tx: Queryable,
  input: { revelleId: string }
): Promise<{ ok: true } | Refusal> {
  const { rows } = await tx.query(
    `update revelle
        set status = 'delivered', delivered_at = now()
      where id = $1 and status <> 'delivered'
     returning id, voice_id`,
    [input.revelleId]
  );
  if (rows.length === 0) {
    return {
      ok: false,
      reason: "That Revelle is already delivered, or does not exist.",
    };
  }

  if (rows[0].voice_id === null || rows[0].voice_id === undefined) {
    return {
      ok: false,
      reason:
        `This destination has no published voice, so this Revelle would be ` +
        `issued in no voice at all — nothing in it could be written. Nothing ` +
        `has been delivered.`,
    };
  }

  return { ok: true };
}

/* ── coercion ─────────────────────────────────────────────────────── */
//
// node-postgres returns `numeric` as a STRING, because a numeric can hold
// values a double cannot, and `bigint` likewise. Same discipline as
// src/lib/selection/catalogue.ts: everything that arrives from one of those
// columns goes through a coercion, and forgetting one produces string
// concatenation where arithmetic was intended.

function str(value: unknown): string {
  return value === null || value === undefined ? "" : String(value);
}

function nullable(value: unknown): string | null {
  return value === null || value === undefined ? null : String(value);
}

function iso(value: unknown): string | null {
  if (value instanceof Date) return value.toISOString();
  return value === null || value === undefined ? null : String(value);
}

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function array(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
}
