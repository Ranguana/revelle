"use server";

import { factsFrom } from "@/lib/correspondence/pieces";
import {
  MAX_TOKENS,
  MODEL,
  canWrite,
  writePiece,
} from "@/lib/correspondence/writer";
import {
  DEFAULT_ASKS,
  defaultCeiling,
  runWritingBench,
  writingErrors,
  type WritingInput,
} from "@/lib/desk/writing";
import { recordAction, requireStaff } from "@/lib/staff";
import { PIECE_KINDS, type PieceKind } from "@/lib/tokens";

import type { WritingState } from "./state";

/**
 * The writing bench's one Server Action.
 *
 * ── IT IS GUARDED, AND THE LEDGER IS NOT OPTIONAL HERE ───────────────
 *
 * `requireStaff()` first, like every action at the desk: an action is its own
 * entry point and is reachable without rendering the form that calls it.
 *
 * Then `recordAction`, which the selection bench next door deliberately does
 * NOT do — and the difference is the whole reason this one does. A selection
 * run reads the catalogue and costs nothing. A writing run spends a real Opus
 * call per room, and money spent with no record of who spent it, on what room,
 * for what piece, is a bill nobody can reconstruct. One row per room generated,
 * failures included, because a call that failed was still a call.
 *
 * A prompt-only run writes no ledger row, because nothing was spent and nothing
 * left the building. That is stated rather than assumed: the intent decides.
 *
 * ── NOTHING IT PRODUCES IS EVER OFFERED TO A MEMBER ──────────────────
 *
 * No `startPiece`, no `correspondence_piece`, no occasion, no revalidatePath —
 * nothing was written, so no cached page anywhere is now wrong. The run lives
 * in this tab and nowhere else. See the head of src/lib/desk/writing.ts.
 */
export async function writingAction(
  previous: WritingState,
  form: FormData
): Promise<WritingState> {
  const staff = await requireStaff();

  const generate = String(form.get("intent") ?? "prompt") === "generate";
  const piece = readPiece(form, previous.form.piece);
  const askTyped = String(form.get("ask") ?? "").trim();
  const factsTyped = String(form.get("facts") ?? "");
  const ceilingTyped = String(form.get("maxWords") ?? "").trim();
  const slugs = form.getAll("rooms").map(String);

  const echo = {
    slugs,
    piece,
    ask: askTyped,
    facts: factsTyped,
    maxWords: ceilingTyped,
  };

  const input: WritingInput = {
    slugs,
    piece,
    // A blank ask is not an empty ask. It is "use the house's standby for this
    // piece", which is what makes the bench one click from useful — and the run
    // then reports the ask it actually sent, so nothing is implied.
    ask: askTyped.length > 0 ? askTyped : DEFAULT_ASKS[piece],
    facts: factsFrom(factsTyped),
    maxWords: readCeiling(ceilingTyped, piece),
    generate,
  };

  const errors = writingErrors(input);

  // FAIL CLOSED, AND SAY WHICH THING IS MISSING. Not an empty box and not a
  // stack trace three seconds after she pressed a button (rule 9). The prompts
  // still assemble without a key, which is the other half of the sentence.
  if (generate && !canWrite()) {
    errors.push(
      "ANTHROPIC_API_KEY is not set on this service, so nothing can be " +
        "written here. The key lives on Render; show the prompts instead, " +
        "which needs no key at all."
    );
  }

  if (errors.length > 0) {
    return { formKey: previous.formKey + 1, form: echo, errors, run: null };
  }

  const run = await runWritingBench(input, {
    write: writePiece,
    model: MODEL,
    maxTokens: MAX_TOKENS,
  });

  if (run.generated) {
    for (const room of run.rooms) {
      await recordAction(staff, {
        action: "writing.bench_generated",
        summary:
          `${room.name} — ${piece.replace(/_/g, " ")}, one ${MODEL} call` +
          (room.error ? " (it failed)" : ""),
        detail: {
          room: room.slug,
          servable: room.servable,
          piece,
          ask: input.ask,
          facts: input.facts,
          max_words: input.maxWords,
          calls: 1,
          requested_model: run.requestedModel,
          max_tokens: run.maxTokens,
          answered_by: room.written?.model ?? null,
          voice_check_flagged: room.findings?.flagged ?? null,
          error: room.error,
          // Said in the row itself, because the question a reader of this
          // ledger will have in six months is whether any of this reached
          // anybody. It did not, and it cannot: see src/lib/desk/writing.ts.
          member_facing: false,
        },
      });
    }
  }

  return { formKey: previous.formKey + 1, form: echo, errors: [], run };
}

function readPiece(form: FormData, fallback: PieceKind): PieceKind {
  const raw = String(form.get("piece") ?? "");
  return (PIECE_KINDS as readonly string[]).includes(raw)
    ? (raw as PieceKind)
    : fallback;
}

/**
 * The ceiling, in three states rather than two.
 *
 * Blank is the house ceiling for that piece — a place card is a card, and the
 * number for that lives in src/lib/correspondence/pieces.ts. Zero is no ceiling
 * at all, which is a real thing to want on a bench and impossible to ask for if
 * blank were the only empty value. Anything else is the number she typed, and a
 * negative one is refused by name in `writingErrors`.
 */
function readCeiling(raw: string, piece: PieceKind): number | null {
  if (raw.length === 0) return defaultCeiling(piece);
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return defaultCeiling(piece);
  return parsed === 0 ? null : Math.trunc(parsed);
}
