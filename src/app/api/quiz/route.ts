import { transaction } from "@/lib/db";
import { EmailNotConfiguredError, sendQuizConfirmation } from "@/lib/email";
import {
  FIELDS,
  QUIZ_VERSION,
  allErrors,
  isEmail,
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

      const inserted = await client.query<{ id: string }>(
        `insert into quiz_response (
           customer_id, answers, quiz_version, submission_key,
           occasion, occasion_other, environment,
           taste_directions, group_fun, anti_preferences, affinities,
           secret, budget
         ) values (
           $1, $2::jsonb, $3, $4,
           $5::occasion_type, $6, $7::environment_type,
           $8::text[], $9::text[], $10::text[], $11::text[],
           $12, $13::budget_band
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
          trimmed(answers.secret),
          answers.budget,
        ]
      );

      return { id: inserted.rows[0].id, replay: false };
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
