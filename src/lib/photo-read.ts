import "server-only";

import Anthropic from "@anthropic-ai/sdk";

import { queryOne, transaction } from "@/lib/db";
import { MAX_TOKENS, MODEL } from "@/lib/model";
import { palette, photoBytes } from "@/lib/photo-store";
import {
  EXTRACT_ASK,
  EXTRACT_TOOL_NAME,
  PHOTO_EXTRACT_VERSION,
  extractFrom,
  extractSystemPrompt,
  extractTool,
  isPhotoRole,
  mayPrune,
  silentExtract,
  type PaletteSwatch,
  type PhotoExtract,
  type PhotoRole,
} from "@/lib/photo-extract";
import { recordSystemAction } from "@/lib/staff";

/**
 * ONE FRAME, TO THE MODEL AND BACK, ONCE.
 *
 * The only place in this feature that talks to a network. Every rule it obeys
 * is written in src/lib/photo-extract.ts and every one of them is a schema or
 * a function rather than a sentence in a prompt; this file supplies a client,
 * an image block and a transaction.
 *
 * ── THE EXTRACTOR IS NOT STAFF ───────────────────────────────────────
 *
 * Founder's instruction, and it is the difference between a desk that can say
 * "the model wrote this" and one that quietly implies a person did. Every
 * ledger row from here is written with `staff_id` null and `actor = 'extract'`
 * (db/036's shape). Nobody signed for a reading, because nobody read it.
 *
 * ── ONE CALL. NO RETRY. FAILURE IS SILENCE. ──────────────────────────
 *
 * Founder: "Do not retry with a looser prompt. A retry that 'just works' is
 * how `assigned` appears." src/app/desk/(signed-in)/images/actions.ts retries
 * a malformed reply and is right to, because a mood-board reading is a
 * proposal into a pool and the cost of losing one is a re-drop. This is a
 * claim about a member's evening. A refusal, a timeout, a bad key, a reply
 * that will not parse — all four write a `silent` extract carrying the reason,
 * and the desk shows the reason. A curator who wants it read again presses the
 * button again, which is a person deciding rather than a loop.
 *
 * ── temperature 0, AND ONE FORCED TOOL ───────────────────────────────
 *
 * `tool_choice` names the tool, so there is no path where the model answers in
 * prose and something downstream has to parse English. `temperature: 0` is the
 * founder's, and it is right for this shape of work: the job is to READ a
 * frame against a fixed vocabulary, and variety in that answer is not richness,
 * it is noise that a second run would contradict.
 *
 * ── ONE IMAGE PER CALL ───────────────────────────────────────────────
 *
 * Also hers, and the reason is worth writing down because batching seven
 * frames into one call is cheaper and obviously tempting: evidence. A claim
 * has to name what in THE FRAME states it, and a model holding seven pictures
 * will write a sentence about the set. "The table is pushed back" stops being
 * checkable the moment nobody can say which table.
 */

/** How the ledger names the thing that did this. Never a person. */
export const EXTRACT_ACTOR = "extract";

/** Is there a reader at all? Asked before a screen offers the button. */
export function canRead(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/* ══ 1 · THE CALL ════════════════════════════════════════════════════ */

type Reply =
  | { ok: true; model: string; raw: unknown }
  | { ok: false; silence: string };

async function look(
  bytes: Buffer,
  mediaType: string,
  role: PhotoRole | null
): Promise<Reply> {
  const tool = extractTool();
  const client = new Anthropic();

  let message: Anthropic.Message;
  try {
    message = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      // Hers. See the note at the top.
      temperature: 0,
      system: extractSystemPrompt(role),
      tools: [tool],
      tool_choice: { type: "tool", name: EXTRACT_TOOL_NAME },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                // Narrowed by db/064's CHECK and by what the writer emits.
                media_type: mediaType as "image/jpeg" | "image/png" | "image/webp",
                data: bytes.toString("base64"),
              },
            },
            { type: "text", text: EXTRACT_ASK },
          ],
        },
      ],
    });
  } catch (err) {
    // The provider's own sentence, carried through: "overloaded" and "invalid
    // api key" are different problems and both arrive as an exception.
    return {
      ok: false,
      silence: `the reader could not be reached: ${
        err instanceof Error ? err.message : String(err)
      }`,
    };
  }

  if (message.stop_reason === "refusal") {
    return { ok: false, silence: "the reader declined this frame" };
  }
  if (message.stop_reason === "max_tokens") {
    return { ok: false, silence: "the reply came back unfinished" };
  }

  const call = message.content.find(
    (block): block is Anthropic.ToolUseBlock =>
      block.type === "tool_use" && block.name === EXTRACT_TOOL_NAME
  );
  if (!call) {
    // Forced tool use makes this close to impossible, which is exactly why it
    // is handled rather than asserted: the impossible cases are the ones that
    // arrive at 2am with no line number.
    return { ok: false, silence: "the reader answered without using the tool" };
  }

  return { ok: true, model: message.model ?? MODEL, raw: call.input };
}

/* ══ 2 · READING ONE PHOTOGRAPH, AND WRITING WHAT CAME BACK ══════════ */

export type ReadOutcome = {
  photoId: string;
  extract: PhotoExtract;
  /** How many entries the parser threw away. Rule 24. */
  dropped: readonly string[];
};

/**
 * Read one photograph and write the reading.
 *
 * Everything is written, including a silence. A row that says "the reader
 * declined this frame" is worth more than no row: without it the desk cannot
 * tell a picture nobody has read from a picture that was read and said
 * nothing, and those are two different next moves.
 *
 * The claims land as `proposed` and nothing else. There is no path in this
 * file to `accepted` — acceptance is a person, at a desk, one claim at a time.
 */
export async function readPhoto(photoId: string): Promise<ReadOutcome | null> {
  const row = await queryOne<{
    id: string;
    quiz_response_id: string;
    role: string | null;
    media_type: string;
  }>(
    `select id::text as id, quiz_response_id::text as quiz_response_id,
            role::text as role, media_type
       from application_photo where id = $1`,
    [photoId]
  );
  if (!row) return null;

  const role = isPhotoRole(row.role) ? row.role : null;
  const picture = await photoBytes(photoId, "full");
  if (!picture) return null;

  // COUNTED, NEVER ASKED. Founder: "VLMs invent #C4A574. Count pixels."
  // Computed before the call and kept whatever the call does, because the
  // colours of a frame are a fact about the bytes and do not depend on whether
  // a model was reachable.
  let counted: PaletteSwatch[] = [];
  try {
    counted = await palette(picture.bytes);
  } catch {
    // A palette that will not compute is a palette that will not compute. It
    // is not a reason to refuse the reading.
    counted = [];
  }

  if (!canRead()) {
    return write(row.quiz_response_id, photoId, [], silentExtract(
      "there is no reader configured — ANTHROPIC_API_KEY is unset",
      { role, palette: counted }
    ));
  }

  const reply = await look(picture.bytes, picture.mediaType, role);
  if (!reply.ok) {
    return write(row.quiz_response_id, photoId, [], silentExtract(reply.silence, {
      role,
      palette: counted,
    }));
  }

  const parsed = extractFrom({
    raw: reply.raw,
    role,
    model: reply.model,
    palette: counted,
  });
  if (!parsed.ok) {
    return write(row.quiz_response_id, photoId, [], silentExtract(parsed.silence, {
      model: reply.model,
      role,
      palette: counted,
    }));
  }

  return write(row.quiz_response_id, photoId, parsed.dropped, parsed.extract);
}

/**
 * The extract and its claims, in one transaction.
 *
 * One or the other alone is a lie: an extract with no claims reads as a frame
 * that stated nothing, and claims with no extract have no version, no model
 * and no reason.
 *
 * ── THE LEDGER IS AT THE GRAIN OF ONE CLAIM ──────────────────────────
 *
 * CLAUDE.md's "provenance must be recorded at the grain it will be read at",
 * and the founder said the same thing about this table before it existed. A
 * single `photo.extracted` row proves a picture was read and never which cell
 * came out of it; the per-claim rows are what a reviewer six months out reads
 * when she asks where `dressed` came from. Both are written, because they
 * answer different questions.
 */
async function write(
  applicationId: string,
  photoId: string,
  dropped: readonly string[],
  extract: PhotoExtract
): Promise<ReadOutcome> {
  await transaction(async (client) => {
    const { rows } = await client.query<{ id: string }>(
      `insert into application_photo_extract
         (photo_id, version, model, role, may_prune, outcome, silence,
          palette, venue, tone, objects, dropped)
       values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9::jsonb,$10::jsonb,
               $11::jsonb,$12::jsonb)
       returning id::text as id`,
      [
        photoId,
        PHOTO_EXTRACT_VERSION,
        extract.model,
        extract.role,
        // From the role, by code, here as everywhere. db/064's CHECK is the
        // wall behind it.
        mayPrune(extract.role),
        extract.outcome,
        extract.silence,
        JSON.stringify(extract.palette),
        JSON.stringify(extract.venue),
        JSON.stringify(extract.tone),
        JSON.stringify(extract.objects),
        JSON.stringify(dropped),
      ]
    );
    const extractId = rows[0].id;

    for (const claim of extract.facets) {
      await client.query(
        `insert into photo_claim
           (extract_id, photo_id, facet, level, evidence, confidence, status)
         values ($1,$2,$3,$4,$5,$6,'proposed')
         on conflict (extract_id, facet, level) do nothing`,
        [
          extractId,
          photoId,
          claim.facet,
          claim.level,
          claim.evidence,
          claim.confidence,
        ]
      );
    }
  });

  await recordSystemAction(EXTRACT_ACTOR, {
    action: "photo.extracted",
    entityTable: "application_photo",
    entityId: photoId,
    summary:
      extract.outcome === "silent"
        ? `Read nothing: ${extract.silence}`
        : `Proposed ${extract.facets.length} cell(s) from one frame.`,
    detail: {
      application: applicationId,
      version: extract.version,
      model: extract.model,
      role: extract.role,
      may_prune: extract.mayPrune,
      outcome: extract.outcome,
      silence: extract.silence,
      dropped,
    },
  });

  // One row per claim, because that is the grain it will be read at.
  for (const claim of extract.facets) {
    await recordSystemAction(EXTRACT_ACTOR, {
      action: "photo_claim.proposed",
      entityTable: "application_photo",
      entityId: photoId,
      summary: `${claim.facet} = ${claim.level}`,
      detail: {
        application: applicationId,
        facet: claim.facet,
        level: claim.level,
        evidence: claim.evidence,
        confidence: claim.confidence,
        previous_status: null,
        status: "proposed",
      },
    });
  }

  return { photoId, extract, dropped };
}
