import { pool, transaction } from "@/lib/db";
import { EmailNotConfiguredError, sendQuizConfirmation } from "@/lib/email";
import { enqueueJobOn } from "@/lib/jobs";
import { GENERATE, generateDedupeKey } from "@/lib/revelle/generate";
import {
  APPLY_BY_EMAIL,
  APPLY_BY_IP,
  clientAddress,
  recordAttempt,
} from "@/lib/rate-limit";
import {
  FIELDS,
  QUIZ_VERSION,
  allErrors,
  isEmail,
  isFieldActive,
  type QuizAnswers,
} from "@/lib/quiz";

/**
 * The one write path in the product.
 *
 * Everything a customer tells Revelle arrives here, and nothing about it is
 * inferred, scored or matched: the row lands in the queue and a person reads
 * it. That is the V1 principle, and it is why this handler is short.
 *
 * Validation uses the SAME functions the client uses (src/lib/quiz.ts), so a
 * hand-rolled POST is held to exactly the rules the UI enforces — no second,
 * subtly different copy of the rules to drift.
 *
 * IDEMPOTENCY. `submissionKey` is generated once per draft in the browser and
 * survives a retry. A dropped connection after the insert therefore replays as
 * the same submission and returns the original id instead of writing a second
 * row. The uniqueness is a database constraint, not a check-then-insert, so two
 * simultaneous retries cannot both win.
 *
 * Route Handlers are not cached and POST is never prerendered, so there is no
 * segment config to set here. Do NOT add `runtime = 'edge'` — pg needs Node.
 */

/** Enough for the longest honest answer many times over; anything larger is abuse. */
const MAX_BODY_BYTES = 32_000;

type SubmitBody = {
  submissionKey?: unknown;
  quizVersion?: unknown;
  answers?: unknown;
};

function bad(errors: string[], status = 400): Response {
  return Response.json({ ok: false, errors }, { status });
}

export async function POST(request: Request): Promise<Response> {
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return bad(["That submission is too large."], 413);
  }

  let body: SubmitBody;
  try {
    body = JSON.parse(raw) as SubmitBody;
  } catch {
    return bad(["That submission could not be read."]);
  }

  const submissionKey =
    typeof body.submissionKey === "string" ? body.submissionKey.trim() : "";
  if (!submissionKey || submissionKey.length > 100) {
    return bad(["Missing submission key."]);
  }

  // A submission built against a different question set cannot be projected
  // into today's columns with confidence. Reject rather than guess; the client
  // discards stale drafts for the same reason.
  if (body.quizVersion !== QUIZ_VERSION) {
    return bad([
      "The quiz has been updated since you started. Reload and your answers will still be here.",
    ]);
  }

  if (typeof body.answers !== "object" || body.answers === null || Array.isArray(body.answers)) {
    return bad(["That submission could not be read."]);
  }
  const answers = normalise(body.answers as Record<string, unknown>);

  const errors = allErrors(answers);
  if (errors.length > 0) return bad(errors);

  const email = String(answers.email).trim().toLowerCase();
  if (!isEmail(email)) return bad(["That does not look like an email address."]);

  /*
   * ── THE THROTTLE ───────────────────────────────────────────────────
   *
   * Last, deliberately: a malformed or stale submission should not spend
   * anyone's allowance, and counting it would let a broken client lock out
   * the person using it. Everything above this line is free.
   *
   * Before the transaction, so a refused attempt writes nothing. A genuine
   * retry of the same submission never reaches here as a new attempt — the
   * submission key replays further down and returns the original id.
   *
   * Both limits are recorded even when the first refuses, so hammering one
   * key cannot be used to keep the other's window clear. `recordAttempt`
   * counts a refused attempt too, which is what stops a refused caller from
   * resetting anything by continuing.
   */
  const ip = clientAddress(request.headers.get("x-forwarded-for"));
  const db = pool();
  const [byEmail, byIp] = await Promise.all([
    recordAttempt(db, APPLY_BY_EMAIL, email),
    recordAttempt(db, APPLY_BY_IP, ip),
  ]);
  const refused = !byEmail.allowed ? byEmail : !byIp.allowed ? byIp : null;
  if (refused) {
    // No count, no duration, and nothing about which limit or whether the
    // address is known to us. Retry-After is for the client, not the page.
    console.warn("[quiz] a submission was throttled");
    return Response.json(
      { ok: false, errors: ["That did not go through. Try again a little later."] },
      { status: 429, headers: { "retry-after": String(refused.retryAfterSeconds) } }
    );
  }

  let quizResponseId: string;
  let alreadyHad = false;

  try {
    const result = await transaction(async (client) => {
      // Replay of a submission we already stored: hand back the same id and
      // touch nothing. quiz_response is append-only — see the trigger in
      // db/001-schema.sql — so there is nothing to update here anyway.
      const existing = await client.query<{ id: string }>(
        `select id from quiz_response where submission_key = $1`,
        [submissionKey]
      );
      if (existing.rows.length > 0) {
        return { id: existing.rows[0].id, replay: true };
      }

      // One statement so the lookup and the insert share a snapshot: two
      // quizzes from the same address at the same moment cannot both insert.
      const customer = await client.query<{ id: string }>(
        `insert into customer (email) values ($1)
         on conflict (email) do update set updated_at = now()
         returning id`,
        [email]
      );
      const customerId = customer.rows[0].id;

      // The place her future taste profile will land, created empty now so no
      // later code has to ask whether she has one. Nothing is inferred yet.
      await client.query(
        `insert into taste_profile (customer_id) values ($1)
         on conflict (customer_id) do nothing`,
        [customerId]
      );

      // `budget` is deliberately absent. It holds the retired total-spend
      // answer and is null for everything submitted since db/006 — a row is
      // priced either the old way or the new way, never both, and the table
      // has a constraint that says so.
      const inserted = await client.query<{ id: string }>(
        `insert into quiz_response (
           customer_id, answers, quiz_version, submission_key,
           occasion, occasion_other, environment,
           taste_directions, group_fun, anti_preferences, affinities,
           voice_tones,
           secret, guest_count_band, spend_per_person, music_service,
           food_plan, play_appetite, how_made,
           event_month, meal_time,
           how_it_ends,
           indoor_outdoor, water_access, water_use
         ) values (
           $1, $2::jsonb, $3, $4,
           $5::occasion_type, $6, $7::environment_type,
           $8::text[], $9::text[], $10::text[], $11::text[],
           $12::text[],
           $13, $14::guest_count_band, $15::spend_per_person_band,
           $16::soundtrack_delivery,
           $17::food_plan, $18::play_appetite, $19::making_level,
           $20::event_month, $21::meal_shape,
           $22::evening_ending,
           $23::indoor_outdoor, $24::water_access, $25::water_use
         )
         returning id`,
        [
          customerId,
          // The verbatim record of what she submitted. The columns beside it
          // are a projection of this, never the other way round.
          JSON.stringify(answers),
          QUIZ_VERSION,
          submissionKey,
          answers.occasion,
          answers.occasion === "other" ? trimmed(answers.occasion_other) : null,
          answers.environment,
          multi(answers, "taste_directions"),
          multi(answers, "group_fun"),
          multi(answers, "anti_preferences"),
          multi(answers, "affinities"),
          // How her people talk. Only the tones she TAPPED are written: a tone
          // she did not choose is not a tone she rejected, and db/007 relies on
          // absence meaning silence rather than dislike.
          multi(answers, "voice_tones"),
          trimmed(answers.secret),
          answers.guest_count_band,
          answers.spend_per_person,
          // Which channel her soundtrack is delivered on. Null is legal in the
          // column (responses that predate the question), but never written
          // here: the field is required, so a submission that reached this line
          // has an answer. See db/005.
          answers.music_service,
          // db/016. Two of the four food answers and one of the four play
          // answers carry a slot_exclusion — no menu, no games — through
          // quiz_option_exclusion. Nothing is derived here: the code is stored
          // and the database says what it means, exactly as every other answer.
          answers.food_plan,
          answers.play_appetite,
          answers.how_made,
          // db/026. WHEN, as a month — or 'not_decided', which is an answer and
          // not a hole. The month resolves to a season facet through the same
          // bridge every other answer uses; nothing about the calendar is
          // computed here.
          answers.event_month,
          // WHICH MEAL, and null unless she was actually asked.
          //
          // `stepErrors` SKIPS an inactive conditional field rather than
          // rejecting a value in it, so a hand-rolled POST can carry a meal
          // beside a food plan that has no table. Storing it would put a claim
          // on the record that she was never given the chance to make — the
          // same failure `occasion_other` is guarded against one line up, where
          // the guard is spelled `answers.occasion === "other"`. Spelled here as
          // the field's own condition, so there is one rule and not two.
          isFieldActive(FIELDS.meal_time, answers)
            ? trimmed(answers.meal_time)
            : null,
          // ── db/037's COLUMN, WHICH THIS ROUTE HAS NEVER WRITTEN ────────
          //
          // Found while adding the three below, and it is CLAUDE.md rule 16 in
          // its purest form: db/037 added `how_it_ends`, added the enum, added
          // the facet dimension, added the bridge and added the question — and
          // the column list here was not touched, so every host since has
          // answered "how does it end?", watched the answer be accepted, and
          // had it stored ONLY inside the `answers` jsonb where nothing reads
          // it. `quiz_response_facet` projects the COLUMN, so her ending
          // resolved to no facet, and `structure.ts` ranked all eighteen rooms
          // on `ending` against a default. That is the same DEFAULT-ONLY
          // failure db/037 was written to fix, reintroduced by the one file it
          // forgot.
          //
          // Fixed here rather than filed, because it is one line and because
          // leaving it while adding three columns beside it would mean shipping
          // the identical defect knowingly. The three-place rule for a new quiz
          // answer is: the column (a migration), the projection (the view), and
          // THIS LIST. Two of the three are easy to remember.
          answers.how_it_ends,
          // ── db/049. THE PHYSICAL WORLD ────────────────────────────────
          //
          // All three unconditional, so `isFieldActive` is not consulted: none
          // of them carries an `activeWhen`, and asking would imply they might.
          // Each is required, so a submission that reached this line has all
          // three, and a null in these columns can only ever mean a response
          // written before 2026-08-h — which is exactly what composeVenue()
          // reads as "she was never asked".
          answers.indoor_outdoor,
          answers.water_access,
          answers.water_use,
        ]
      );

      const quizResponseId = inserted.rows[0].id;

      // ── AND THE JOB, IN THIS SAME TRANSACTION ──────────────────────
      //
      // Not after the commit, and not from the pool. The row and the work it
      // implies are one fact about the world and must not half-exist, exactly
      // as the customer, the response and the empty taste profile above are.
      //
      // Committing the response and then enqueueing separately has two failure
      // modes and both are silent: a crash in between leaves an application
      // nothing will ever generate — it sits in the inbox looking normal
      // forever — and a rollback after a successful enqueue leaves a job whose
      // subject does not exist, which fails on every attempt until it gives up.
      // Neither is detectable at the moment it happens. Sharing the client
      // makes both impossible rather than unlikely; that is what `enqueueJobOn`
      // is for.
      //
      // The dedupe key is live-only (db/008's partial index), so it stops a
      // double submission producing two runs and stops nothing afterwards — a
      // curator asking for another look gets a new job.
      await enqueueJobOn(client, {
        type: GENERATE,
        payload: { quizResponseId },
        dedupeKey: generateDedupeKey(quizResponseId),
      });

      return { id: quizResponseId, replay: false };
    });

    quizResponseId = result.id;
    alreadyHad = result.replay;
  } catch (err) {
    console.error("[quiz] submission failed", err);
    return bad(["Something went wrong on our end. Your answers are saved — try again."], 500);
  }

  // Sent inline rather than in the background: whether she got the
  // confirmation is worth knowing at the point of submission, because the
  // closing screen names her address and should not promise a mail that never
  // left. A failure here does NOT fail the submission — the row is committed
  // and the queue is what actually matters.
  let emailed = false;
  if (!alreadyHad) {
    try {
      await sendQuizConfirmation(email);
      emailed = true;
    } catch (err) {
      if (err instanceof EmailNotConfiguredError) {
        console.warn(`[quiz] ${err.message} — confirmation not sent for ${quizResponseId}`);
      } else {
        console.error("[quiz] confirmation email failed", err);
      }
    }
  }

  return Response.json({ ok: true, id: quizResponseId, emailed });
}

/**
 * Coerce the payload into the shape the shared validators expect: strings for
 * single answers, string arrays for multi. Anything else is dropped rather than
 * coerced, so a malformed value fails validation instead of being stored as
 * something plausible.
 */
function normalise(input: Record<string, unknown>): QuizAnswers {
  const out: QuizAnswers = {};
  for (const [key, value] of Object.entries(input)) {
    const field = FIELDS[key];
    if (!field) continue; // unknown keys are not stored at all
    if (field.type === "multi") {
      if (Array.isArray(value)) {
        out[key] = Array.from(
          new Set(value.filter((v): v is string => typeof v === "string"))
        );
      }
      continue;
    }
    if (typeof value === "string") out[key] = value;
  }
  // A multi field the client never touched must still be an array, or the
  // minimum-count rules cannot fire.
  for (const field of Object.values(FIELDS)) {
    if (field.type === "multi" && !Array.isArray(out[field.id])) {
      out[field.id] = [];
    }
  }
  return out;
}

function multi(answers: QuizAnswers, id: string): string[] {
  const value = answers[id];
  return Array.isArray(value) ? value : [];
}

function trimmed(value: string | string[] | undefined): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text.length > 0 ? text : null;
}
