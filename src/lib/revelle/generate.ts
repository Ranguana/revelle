import "server-only";

/**
 * `revelle.generate` — the first real job, and the seam the product was
 * missing.
 *
 * An application is written; in the same transaction a row lands in `job`; the
 * runner claims it; this handler runs the selection engine and writes down what
 * it found. Before this file `runSelection` was called by nothing outside its
 * own tests, so an application arrived, landed in the desk inbox, and stopped.
 *
 * ── WHY IT IS ONE JOB AND NOT A FAN-OUT ──────────────────────────────
 *
 * db/008's shape is a parent that fans out into pieces, and that shape is right
 * for WRITING a Revelle: the invitation, the menu card and the prep list are
 * each a chain of language-model calls, each is expensive, and each must be
 * able to fail and retry without rewriting the others.
 *
 * Choosing is not that. It is arithmetic over a snapshot and it takes
 * milliseconds — db/008 says so in its own opening paragraph. A fan-out here
 * would be four rows of ceremony around one pure function. When the writing
 * lands it hangs off the approved Revelle, as pieces of a job of its own, and
 * nothing in this file changes.
 *
 * ── AT-LEAST-ONCE, AND WHAT WAS DONE ABOUT IT ────────────────────────
 *
 * db/008 is explicit: a handler whose lease expires while it is still working
 * runs twice, only one of the two can record an outcome, and BOTH do the work.
 * This handler has three side effects and each one is keyed so that running
 * twice is indistinguishable from running once:
 *
 *   1. THE CANDIDATES. `seedForJob(ctx.job.id)` makes the engine's randomness a
 *      function of the job id, so the second attempt computes the identical
 *      candidates — a retry is not a re-roll. They are written `on conflict
 *      (job_id, rank) do nothing`, so the second attempt writes nothing at all.
 *      See src/lib/revelle/proposals.ts.
 *   2. THE GAPS. `recordCatalogueGaps` inserts `on conflict (gap_key) do
 *      nothing` against db/013's unique index. That is also what stops a
 *      dismissed gap coming back, so the idempotency was already load-bearing
 *      before this caller existed.
 *   3. NOTHING ELSE. No mail, no money, no issued fingerprint. A proposal is
 *      not issuance: the fingerprint is stamped, and the uniqueness promise
 *      enforced, only when a `revelle` row becomes delivered (db/003), and that
 *      happens at a curator's hand and not here.
 *
 * ─────────────────────────────────────────────────────────────────────
 * THE UNVOICED DESTINATION
 *
 * A destination is a look and a voice (db/004). Today one has both, one more
 * is being written, and ten have plates and silence. A destination with no
 * published voice cannot actually be delivered — the invitation, the menu card
 * and the prep list are all written IN a voice, there is no fallback voice by
 * design, and db/004's guard will pin `voice_id` to null and call it "issued
 * with no voice", which is a true statement about historical rows and must
 * never become true of a new one.
 *
 * So: does generation refuse to propose one, propose it and flag it, or
 * something else?
 *
 * IT PROPOSES IT, FLAGS IT, AND THE REFUSAL LIVES AT APPROVAL. Four reasons,
 * and the first two are the ones that decide it.
 *
 *   1. A FILTER HERE IS A SILENT NARROWING OF THE CATALOGUE. Generation is
 *      automatic and unattended — that is the founder's decision, and the
 *      reason is scale. Refusing unvoiced destinations at this point would
 *      quietly turn a shortlist of twelve into a shortlist of two, which means
 *      stage 2's dither — the entire exploration mechanism, and the thing that
 *      stops two similar customers receiving identical Revelles — would be
 *      dithering a list of two. Nobody would see it happen, because a filtered
 *      destination leaves no trace anywhere.
 *
 *   2. A MISSING VOICE IS A CATALOGUE GAP, AND THE HOUSE HAS ALREADY DECIDED
 *      WHAT TO DO WITH THOSE. A gap never blocks generation and never reaches
 *      the member; it reaches the curator, because it is how the library learns
 *      what to write next (db/013, src/lib/desk/gaps.ts). A missing voice is
 *      the largest gap in the library — docs/build-checklist.md calls exactly
 *      this the critical path — and a filter would delete the only measurement
 *      of it. If the engine silently declines to propose Big Sur, nobody ever
 *      finds out that eleven applications in a row would have been Big Sur.
 *      Proposing it and recording the gap turns "which voice should we write
 *      next" from an opinion into a count.
 *
 *   3. IT IS A FACT THAT CHANGES, AND A REFUSAL WOULD FREEZE IT. The voice is
 *      joined at READ time (db/018's revelle_proposal_live, over db/004's
 *      world_current_voice), so a destination that acquires a voice this
 *      afternoon makes this morning's proposal approvable with no re-run and no
 *      migration. A generation-time filter would have thrown the candidate away
 *      an hour before it became correct.
 *
 *   4. AND A FLAG IS NOT ENOUGH ON ITS OWN. "Flag it" is a convention, and a
 *      convention is what the first tired curator at eleven at night gets
 *      wrong. So the refusal is structural and it is in two places, neither of
 *      them here: `approve()` refuses a proposal whose destination has no
 *      published voice, and `deliver()` refuses a Revelle that came out of the
 *      delivery transition with a null pin. A customer cannot receive a
 *      destination that cannot speak, and no amount of clicking makes it
 *      possible.
 *
 * WHAT WAS REJECTED. Falling back to another destination's voice, or to a
 * house voice: db/004 is explicit that the voice is the half that survives
 * being copied and is a promise about how her weekend sounds. A Revelle written
 * in a borrowed voice is a different destination wearing a name, and it would
 * be undetectable afterwards. Also rejected: proposing only voiced destinations
 * while reporting the voiceless ones on the side, which is this design with a
 * second list to reconcile and the engine's own ranking split across the two.
 *
 * The honest consequence, stated rather than hidden: until more voices are
 * written, most runs will propose candidates a curator cannot yet approve. That
 * is not a defect of this handler. It is the state of the library, and this is
 * the first thing in the system that measures it.
 * ─────────────────────────────────────────────────────────────────────
 */

import { recordCatalogueGaps } from "@/lib/desk/gaps";
import { selectForApplication } from "@/lib/selection/catalogue";
import {
  PermanentJobError,
  done,
  type Handler,
  type Registration,
} from "@/lib/jobs/types";

import { persistRun, seedForJob } from "./proposals";

/** The job type. Named in db/018 and in src/lib/jobs/backoff.test.ts. */
export const GENERATE = "revelle.generate";

/**
 * The dedupe key for one application's generation.
 *
 * Unique among LIVE jobs only (db/008's partial index), which is exactly the
 * behaviour wanted: it stops a double submission or an impatient second click
 * producing two runs, and it stops nothing once the first run has settled — a
 * curator asking for another look must be able to get one.
 */
export function generateDedupeKey(quizResponseId: string): string {
  return `${GENERATE}:${quizResponseId}`;
}

/**
 * How many complete candidates a curator is shown.
 *
 * docs/selection-spec.md's stage 6 says two or three and lists "how many" as an
 * open question. Three, matching DEFAULT_OPTIONS, and set here rather than
 * taken from the payload so that it is a property of the job type instead of
 * something a caller can quietly change per application.
 */
const CANDIDATES = 3;

export const generate: Handler = async (ctx) => {
  const quizResponseId = ctx.job.payload.quizResponseId;
  if (typeof quizResponseId !== "string" || quizResponseId.length === 0) {
    // A payload that will never validate. Burning four more attempts and eight
    // minutes of backoff on it helps nobody — see PermanentJobError.
    throw new PermanentJobError(
      `${GENERATE} needs a string quizResponseId in its payload; got ` +
        `${JSON.stringify(ctx.job.payload.quizResponseId)}`
    );
  }

  const seed = seedForJob(ctx.job.id);
  const result = await selectForApplication(ctx.db, quizResponseId, {
    seed,
    candidateCount: CANDIDATES,
  });

  // ── the gaps, to the only place a human will ever see them ─────────
  //
  // `result.gaps` already excludes every slot the host opted out of: db/014
  // hangs the exclusion off a fact about her evening and `planSlots` removes
  // the rule BEFORE anything is scoped or filled, so an excluded slot never
  // becomes a gap in the first place. That distinction is the engine's and it
  // is consumed here, never re-derived — `result.excluded` is carried on the
  // proposal for the curator's account and goes nowhere near the to-do list,
  // because nobody can act on "she is not serving food".
  const gaps = await recordCatalogueGaps(result.gaps);

  // ── and the gap that is not a slot ─────────────────────────────────
  const voices = await recordMissingVoices(ctx.db, result);

  const written = await persistRun(ctx.db, {
    jobId: ctx.job.id,
    quizResponseId,
    result,
  });

  return done({
    quizResponseId,
    seed,
    candidates: written.candidates,
    proposalsWritten: written.created,
    // Null on every ordinary run. Set when her dealbreakers eliminated every
    // destination, which produces no candidates at all and is therefore the one
    // outcome that has nowhere else to be recorded. The desk reads it off this
    // row — see db/018's job_generate_application_idx.
    impasse: result.impasse,
    eliminated: result.eliminated.length,
    gaps: gaps.created,
    gapsConsidered: gaps.considered,
    voicesMissing: voices,
  });
};

/**
 * A DESTINATION THE ENGINE WANTED AND CANNOT SPEAK.
 *
 * Written through the same seam as a slot gap — `recordCatalogueGaps`, deduped
 * on `pool:slotCode`, dismissible, and never resurrected once dismissed — for
 * the reason the essay at the top gives: this is a work order for the house and
 * it is the only mechanism the house has for turning "what should we write
 * next" into a count.
 *
 * `pool` is 'voice' rather than one of the five ingredient pools. That is a
 * widening of what a gap can be about and it is deliberate: db/013's table
 * takes free text and a jsonb detail, the type in src/lib/desk/gaps.ts is
 * structural rather than an enum, and the alternative — a second to-do
 * mechanism beside the sanctioned one — is exactly the second crossing that
 * file warns about.
 *
 * Only destinations that were actually PROPOSED are reported. Every unvoiced
 * destination in the catalogue is already known to be unvoiced; what is worth a
 * curator's attention is the one the engine reached for today.
 */
async function recordMissingVoices(
  db: { query: (text: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }> },
  result: Awaited<ReturnType<typeof selectForApplication>>
): Promise<number> {
  const worldIds = [
    ...new Set(result.candidates.map((candidate) => candidate.destination.id)),
  ];
  if (worldIds.length === 0) return 0;

  const { rows } = await db.query(
    `select w.id, w.slug, w.name
       from world w
       left join world_voice v
         on v.world_id = w.id and v.status = 'published'
      where w.id = any($1::uuid[]) and v.id is null
      order by w.name`,
    [worldIds]
  );
  if (rows.length === 0) return 0;

  const outcome = await recordCatalogueGaps(
    rows.map((row) => ({
      pool: "voice",
      slotCode: String(row.slug),
      slotLabel: `${String(row.name)} has no voice`,
      required: true,
      detail:
        `The engine proposed ${String(row.name)} and it has a look but no ` +
        `published voice, so nothing in that Revelle could be written and no ` +
        `curator can approve it. Write the voice in src/lib/destinations.ts ` +
        `and publish it; every proposal already made becomes approvable the ` +
        `moment it is, with no re-run.`,
    }))
  );
  return outcome.created;
}

/**
 * Lease and attempt budget, next to the handler rather than at every call site
 * that enqueues — the arrangement src/lib/jobs/registry.ts argues for.
 *
 * SIXTY SECONDS is generous by two orders of magnitude for arithmetic that
 * takes milliseconds, and generous on purpose: the cost of a lease that expires
 * under a handler still working is the job running twice, and the cost of a
 * lease that is too long is a dead instance's work waiting a minute. The second
 * is much cheaper than the first, and this handler is safe under the first
 * anyway.
 *
 * THREE attempts rather than db/008's default five. Every failure this handler
 * can have is either permanent (a payload that will not validate, an occasion
 * with no shape row) or a database that is briefly unreachable. Neither is
 * helped by the fourth and fifth try, and a job that gives up sooner reaches
 * the state a human is meant to find sooner.
 */
export const generateRegistration: Registration = {
  handle: generate,
  leaseSeconds: 60,
  maxAttempts: 3,
};
