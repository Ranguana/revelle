import "server-only";

import { pool } from "@/lib/db";
import { QUIZ_VERSION, type QuizAnswers } from "@/lib/quiz";
import { loadCatalogue, type Queryable } from "@/lib/selection/catalogue.ts";
import { runSelection } from "@/lib/selection/engine.ts";
import { hostExclusions } from "@/lib/selection/exclusions.ts";
import { topMatches } from "@/lib/selection/vector.ts";
import type {
  Application,
  OccasionCode,
  Scale,
  SelectionInput,
  StatedFacet,
} from "@/lib/selection/types.ts";

import { BENCH_FIELDS } from "./bench-answers.ts";
import type { BenchRun } from "./bench-run.ts";

/** The shapes a screen renders, re-exported so a caller needs one import. */
export * from "./bench-run.ts";

/**
 * THE TEST BENCH — a hypothetical host in, the real engine's answer out.
 *
 * ─────────────────────────────────────────────────────────────────────
 * IT WRITES NOTHING. THIS IS THE WHOLE REASON IT CAN EXIST.
 *
 * `runSelection` is pure: a snapshot in, candidates out, no database handle
 * anywhere near it, and persisting a chosen candidate belongs to the caller.
 * This file is a caller that persists nothing. A bench run leaves behind:
 *
 *   no quiz_response      the application is composed in memory and never
 *                         inserted, so no confirmation mail, no inbox row.
 *   no job                nothing is enqueued, so `revelle.generate` never
 *                         picks it up and no proposals are written.
 *   no revelle_proposal   the candidates are summarised for a screen and
 *                         dropped when the request ends.
 *   no ingredient_issuance / no fingerprint  nothing is issued, so no
 *                         assemblage is claimed and no ingredient's issue count
 *                         moves. A bench run cannot spend a combination a real
 *                         customer would otherwise have received.
 *   no taste_signal       `record_quiz_signals()` is never called, because
 *                         there is no response id to call it with. A curator
 *                         trying twenty imaginary hosts does not thereby teach
 *                         the house anything about anybody.
 *   no staff_action       a run mutates nothing, and the ledger is for
 *                         mutations. The matrix and the coverage board write to
 *                         it; this does not.
 *
 * Every statement in this file is a SELECT. If a future edit needs an INSERT,
 * the honest thing is a different tool, not a flag on this one.
 *
 * ─────────────────────────────────────────────────────────────────────
 * WHY THE APPLICATION IS COMPOSED RATHER THAN INSERTED
 *
 * `quiz_response` is append-only by trigger and every insert enqueues a
 * generation job in the same transaction — deliberately, so an application can
 * never sit in the inbox with nothing ever generating it. That is exactly
 * right for a real submission and exactly wrong for a bench, so the bench never
 * takes that path. What it does instead is read the same three bridges the
 * database reads:
 *
 *   quiz_option_facet      an answer -> the shared vocabulary, with the sign
 *                          and the degree. What quiz_response_facet resolves.
 *   quiz_option_exclusion  an answer -> a slot she does not have. What
 *                          quiz_response_exclusion resolves.
 *   quiz_option_range      a band -> numbers. What quiz_response_scale
 *                          resolves.
 *
 * so the resolution is the DATABASE's, not a second copy of it in TypeScript.
 * The catalogue comes from `loadCatalogue`, which is the very function the real
 * run uses. Nothing about selection is approximated here.
 */

/* ── the run ────────────────────────────────────────────────────────── */

/**
 * Compose the host, read the catalogue, run the engine, summarise.
 *
 * `seed` is required rather than optional. The engine will invent one when it
 * is not given one, and an invented seed is precisely what makes a curator
 * unable to tell whether her change moved the pick or the dither did.
 */
export async function runBench(
  answers: QuizAnswers,
  seed: number
): Promise<BenchRun> {
  const db = pool() as Queryable;

  const application = await benchApplication(db, answers);
  const catalogue = await loadCatalogue(
    db,
    application.occasion,
    application.environment
  );

  const input: SelectionInput = {
    application,
    // NO HISTORY AND NO COHORT, and that is a statement rather than a gap.
    // Both belong to a customer, and the bench has no customer — every real
    // application today is somebody's first, so this is the blend the engine
    // actually runs at. A bench that borrowed a stranger's taste signals would
    // be showing a curator a run she cannot reproduce from what is on screen.
    history: [],
    cohorts: [],
    catalogue,
  };

  const result = runSelection(input, {
    seed,
    // PINNED TO THE START OF THE DAY, so that "same seed, same answers, same
    // result" is exactly true rather than nearly true. The only thing `now`
    // reaches is the issuance recency curve, whose half-life is measured in
    // weeks; letting it be the wall clock would make two runs a minute apart
    // differ in the eighth decimal place, and the whole affordance being sold
    // here is that a difference means something.
    now: startOfDay(),
  });

  return {
    ranAt: new Date().toISOString(),
    seed: result.seed,
    answers,
    impasse: result.impasse,
    candidates: result.candidates.map((candidate) => ({
      rank: candidate.rank,
      destinationId: candidate.destination.id,
      destinationName: candidate.destination.name,
      tagline: candidate.destination.tagline,
      destinationScore: candidate.destinationScore,
      destinationRank: candidate.destinationRank,
      ditheredRank: candidate.ditheredRank,
      fingerprint: candidate.fingerprint,
      blocked: candidate.blocked,
      lowConfidence: candidate.lowConfidence,
      budget: candidate.budget,
      picks: candidate.picks.map((pick) => ({
        slotKey: pick.slot.key,
        slotLabel: pick.slot.label,
        pool: pick.slot.pool,
        name: pick.ingredient.name,
        quantity: pick.slot.quantity,
        perGuest: pick.slot.perGuest,
        lineCostCents: pick.lineCost,
        forced: pick.forced,
        alternatives: pick.alternatives,
        score: pick.score,
      })),
      explanation: candidate.explanation,
    })),
    eliminated: result.eliminated.map((entry) => ({
      destinationName: entry.destinationName,
      tier: entry.tier,
      reason: entry.reason,
      toneMatch: entry.toneMatch,
    })),
    gaps: result.gaps,
    excluded: result.excluded,
    emphasis: result.emphasis,
    vector: {
      terms: topMatches(result.vector, result.vector.weights, 12).map((entry) => ({
        label: entry.facet.label,
        dimension: entry.facet.dimension,
        weight: result.vector.weights[entry.facet.id],
        because:
          result.vector.terms[entry.facet.id]?.contributions
            .map((c) => c.because)
            .join("; ") ?? "",
      })),
      dealbreakers: result.vector.dealbreakers.map(
        (id) => result.vector.terms[id]?.facet.label ?? id
      ),
      blend: result.vector.blend,
      evidenceCount: result.vector.evidenceCount,
    },
    library: {
      destinations: catalogue.destinations.length,
      ingredients: catalogue.ingredients.length,
      slotsPlanned:
        (result.candidates[0]?.picks.length ?? 0) +
        (result.candidates[0]?.gaps.length ?? 0),
    },
  };
}

/** Midnight UTC today. See the note at the call site. */
function startOfDay(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
}

/* ── the host, composed ─────────────────────────────────────────────── */

/**
 * An `Application` from answers, resolved through the database's own bridges.
 *
 * The (field, option) pairs are read off QUIZ_STEPS rather than listed here, so
 * a new question resolves on the bench the moment it resolves in the bridge
 * table — which is the same promise `quiz_response_facet` makes, kept in the
 * one place that can keep it.
 */
export async function benchApplication(
  db: Queryable,
  answers: QuizAnswers
): Promise<Application> {
  const fields: string[] = [];
  const codes: string[] = [];

  for (const { field } of BENCH_FIELDS) {
    if (field.type === "single") {
      const value = answers[field.id];
      if (typeof value === "string" && value.length > 0) {
        fields.push(field.id);
        codes.push(value);
      }
      continue;
    }
    if (field.type === "multi") {
      const value = answers[field.id];
      for (const code of Array.isArray(value) ? value : []) {
        fields.push(field.id);
        codes.push(code);
      }
    }
  }

  const stated = await resolveFacets(db, fields, codes);
  const recorded = await resolveExclusions(db, fields, codes);
  const scale = await resolveScale(
    db,
    text(answers.guest_count_band),
    text(answers.spend_per_person)
  );

  const occasion = (text(answers.occasion) || "no_reason") as OccasionCode;

  return {
    // NOT IDENTIFIERS. Nothing here is ever written, so there is nothing to
    // identify; empty is the honest value and a fabricated uuid would be a
    // thing somebody could paste into a query and be lied to by.
    quizResponseId: "",
    customerId: "",
    customerEmail: "",
    quizVersion: QUIZ_VERSION,
    occasion,
    occasionOther: nullable(answers.occasion_other),
    environment: text(answers.environment),
    secret: nullable(answers.secret),
    musicService: nullable(answers.music_service),
    stated,
    scale,
    // The same rule the real loader runs, on the same codes, unchanged.
    exclusions: hostExclusions({
      occasion,
      environment: text(answers.environment),
      stated,
      recorded,
    }),
    createdAt: new Date().toISOString(),
  };
}

/**
 * What her answers MEAN, out of quiz_option_facet.
 *
 * The join is the one `quiz_response_facet` makes, against a list of pairs
 * instead of against a stored row. Facet status is not filtered, exactly as the
 * view does not filter it: a retired option on a live answer still resolves,
 * and hiding that would hide the drift the desk exists to notice.
 */
async function resolveFacets(
  db: Queryable,
  fields: readonly string[],
  codes: readonly string[]
): Promise<StatedFacet[]> {
  if (fields.length === 0) return [];

  const { rows } = await db.query(
    `select a.quiz_field,
            m.facet_id,
            f.dimension_code,
            f.code  as facet_code,
            f.label as facet_label,
            m.answer_polarity::text as polarity,
            m.answer_weight
       from unnest($1::text[], $2::text[]) as a(quiz_field, option_code)
       join quiz_option_facet m
         on m.quiz_field = a.quiz_field
        and m.option_code = a.option_code::citext
       join facet f on f.id = m.facet_id`,
    [fields, codes]
  );

  return rows.map((row) => ({
    facetId: String(row.facet_id),
    dimension: String(row.dimension_code),
    code: String(row.facet_code),
    label: String(row.facet_label),
    field: String(row.quiz_field),
    polarity: String(row.polarity) === "negative" ? "negative" : "positive",
    // numeric arrives as a string. Same fallback the real loader takes, and
    // for the same reason: guessing zero makes an answer silently mean nothing.
    weight: number(row.answer_weight) ?? 1,
  }));
}

/**
 * The slots her answers remove, out of quiz_option_exclusion.
 *
 * Asked over EVERY field she answered rather than over the two the
 * `quiz_response_exclusion` view names. The view's short list is an
 * optimisation of a general rule — "an answer that carries an exclusion" — and
 * copying the short list here would mean a third question that removes a slot
 * works on the real path and silently does nothing on the bench, which is the
 * exact class of divergence a bench exists to prevent.
 */
async function resolveExclusions(
  db: Queryable,
  fields: readonly string[],
  codes: readonly string[]
): Promise<string[]> {
  if (fields.length === 0) return [];

  const { rows } = await db.query(
    `select distinct x.exclusion_code
       from unnest($1::text[], $2::text[]) as a(quiz_field, option_code)
       join quiz_option_exclusion x
         on x.quiz_field = a.quiz_field
        and x.option_code = a.option_code::citext`,
    [fields, codes]
  );

  return rows.map((row) => String(row.exclusion_code));
}

/**
 * Her two bands as numbers — the arithmetic `quiz_response_scale` does.
 *
 * A band with no row in quiz_option_range has no numeric reading at all, which
 * is a real state and not an omission: "not sure yet" is a genuine answer, and
 * a null ceiling means ASK HER rather than no limit. Nothing is coalesced.
 */
async function resolveScale(
  db: Queryable,
  guestBand: string,
  spendBand: string
): Promise<Scale> {
  const { rows } = await db.query(
    `select quiz_field, low, high, typical
       from quiz_option_range
      where (quiz_field = 'guest_count_band' and option_code = $1::citext)
         or (quiz_field = 'spend_per_person' and option_code = $2::citext)`,
    [guestBand, spendBand]
  );

  const guests = rows.find((row) => row.quiz_field === "guest_count_band");
  const spend = rows.find((row) => row.quiz_field === "spend_per_person");

  const guestsHigh = number(guests?.high);
  const guestsPlanning = number(guests?.typical);
  const perPersonHigh = number(spend?.high);
  const perPersonPlanning = number(spend?.typical);

  return {
    guestBand: guestBand || null,
    guestsLow: number(guests?.low),
    guestsHigh,
    guestsPlanning,
    spendBand: spendBand || null,
    perPersonLow: number(spend?.low),
    perPersonHigh,
    perPersonPlanning,
    budgetPlanning:
      guestsPlanning !== null && perPersonPlanning !== null
        ? guestsPlanning * perPersonPlanning
        : null,
    budgetCeiling:
      guestsHigh !== null && perPersonHigh !== null
        ? guestsHigh * perPersonHigh
        : null,
    // Nothing on the bench is priced the retired way. The column exists for
    // responses written before db/006 and a composed host is never one.
    retiredBudgetBand: null,
  };
}

/* ── coercion ───────────────────────────────────────────────────────── */

function number(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function text(value: string | string[] | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

function nullable(value: string | string[] | undefined): string | null {
  const trimmed = text(value);
  return trimmed.length > 0 ? trimmed : null;
}
