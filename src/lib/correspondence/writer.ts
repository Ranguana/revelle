import "server-only";

/**
 * THE ONE MODEL CALL IN THE PRODUCT.
 *
 * Everything else in this repo selects: a destination is chosen, a menu is
 * composed, a game is placed. This is the file that WRITES, and it is the only
 * one. Keeping it to one file is the point — the voice is data
 * (src/lib/tokens.ts), the prompt is assembled from that data by a pure
 * function, and the thing that talks to a network is this and nothing else.
 *
 * ── IT DOES NOT ASSEMBLE A PROMPT ────────────────────────────────────
 *
 * `writerPrompt()` in src/lib/tokens.ts already does that, and does it better
 * than a second copy would: it hoists the exemplars that match the piece being
 * written, so an invitation is written against invitation lines rather than
 * against an average of everything a house has ever said. A prompt assembled
 * here would drift from the one a curator reads and approves, and the whole
 * reason that function is pure is that the approval step is reading its
 * output aloud.
 *
 * So this file contributes exactly three things the pure function cannot: a
 * client, a model, and the conversation shape that makes "say it differently"
 * mean something.
 *
 * ── ABSENCE OF A KEY IS A ROUTE, NOT A FAULT ─────────────────────────
 *
 * The same discipline as the soundtrack (src/lib/music/index.ts) and the same
 * as email: `canWrite()` is asked BEFORE anything is attempted, so a house
 * with no key renders a compose screen that says plainly that the writing desk
 * is not open, rather than a button that fails when she presses it. The plain
 * route (./plain.ts) keeps working either way, which is the right asymmetry:
 * the message a guest must act on is the last one that should depend on a
 * third party being reachable.
 *
 * ── AND A DESTINATION WITH NO PUBLISHED VOICE CANNOT BE WRITTEN IN ───
 *
 * Refused in words, by name, before any request is made. A voice is what the
 * writing is made of; a destination that has only a look has nothing to say
 * yet, and saying so is more useful than a competent line in nobody's register.
 */

import Anthropic from "@anthropic-ai/sdk";

import { writerPrompt, type Destination, type WriterBrief } from "@/lib/tokens";
import {
  NoVoiceError,
  WritingDeskClosedError,
  WritingFailedError,
  type VoicedRequest,
} from "./types";

/**
 * The model, named once.
 *
 * Opus rather than a smaller model, and this is a taste decision rather than a
 * cost one: the thing being asked for is thirteen distinguishable registers
 * held apart under pressure, and the failure mode of a weaker model is not a
 * worse line, it is the SAME line in every house. That failure is invisible in
 * a single sample and fatal across a library.
 */
const MODEL = "claude-opus-5";

/**
 * Room for the piece and for the thinking that reaches it. `max_tokens` caps
 * both together on this model, and a place card that comes back truncated
 * because the ceiling was set to the length of a place card is the sort of bug
 * that only shows up on the shortest pieces.
 */
const MAX_TOKENS = 4000;

/**
 * `medium`, not `high`.
 *
 * The job is short, the whole brief is supplied, and the exemplars do most of
 * the steering — this is exactly the shape of work where the effort ladder's
 * lower rungs hold. It is a dial worth sweeping against real output rather
 * than a setting to argue about in a comment.
 */
const EFFORT = "medium" as const;

/** Is there a writer at all? Asked before a compose screen offers one. */
export function canWrite(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/** What came back, and what wrote it. Both are recorded on the draft. */
export type Written = {
  body: string;
  model: string;
};

/**
 * Write one piece.
 *
 * Takes a VoicedRequest and nothing else — a PlainRequest is not assignable,
 * so a cancellation cannot reach a model through this door. See the essay at
 * the top of ./types.ts.
 *
 * `rejected` is the lines she has already turned down, oldest first. They are
 * replayed as what they were: the house said this, she said not that. A second
 * request with an identical prompt and no history is the same request, and the
 * most likely thing to come back is the line she just declined.
 */
export async function writePiece(
  destination: Destination,
  request: VoicedRequest,
  rejected: readonly string[] = []
): Promise<Written> {
  if (!canWrite()) throw new WritingDeskClosedError("ANTHROPIC_API_KEY");
  if (destination.voice.exemplars.length === 0) {
    throw new NoVoiceError(destination.name);
  }

  const brief: WriterBrief = {
    piece: request.kind,
    ask: request.ask,
    facts: request.facts.length > 0 ? request.facts : undefined,
    maxWords: request.maxWords ?? undefined,
  };

  const messages: Anthropic.Beta.BetaMessageParam[] = [
    { role: "user", content: writerPrompt(destination, brief) },
  ];

  // The rejections, as the conversation they were. Each one is an assistant
  // turn followed by her turning it down — ordinary history, not a prefill:
  // the array still ends on a user turn, which is what this model requires.
  for (const line of rejected) {
    messages.push({ role: "assistant", content: line });
    messages.push({
      role: "user",
      content:
        "Not that one. Write it again for the same brief, in the same voice. " +
        "Do not reuse its opening, its shape, or the detail it ended on.",
    });
  }

  const client = new Anthropic();

  let message: Anthropic.Beta.BetaMessage;
  try {
    message = await client.beta.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      output_config: { effort: EFFORT },
      // The safety classifiers on this model can decline a request outright.
      // A house voice is not the kind of thing that trips them, but a refused
      // invitation with no fallback is a broken product for a reason nobody
      // can see, so the server-side fallback is on by default and picks the
      // substitute itself rather than pinning a model this file would then
      // own forever.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      messages,
    });
  } catch (err) {
    // A network failure, a rate limit, a bad key. All of them are the same
    // fact to the woman waiting: nothing was written. The provider's sentence
    // is carried through because "domain is not verified" and "overloaded" are
    // very different problems and both arrive as an exception.
    throw new WritingFailedError(
      err instanceof Error ? err.message : "the writer could not be reached"
    );
  }

  if (message.stop_reason === "refusal") {
    throw new WritingFailedError(
      "The writer declined this one. Say what it must contain in different " +
        "words, or send it plain."
    );
  }

  const body = textOf(message);
  if (body.length === 0) {
    throw new WritingFailedError("Nothing came back.");
  }
  if (message.stop_reason === "max_tokens") {
    throw new WritingFailedError("It came back unfinished.");
  }

  return { body, model: message.model ?? MODEL };
}

/**
 * The words, out of a response that also carries thinking.
 *
 * Thinking blocks arrive on this model whether or not their text is returned,
 * so `content[0]` is not the answer and never was. Text blocks only, joined,
 * and the surrounding whitespace taken off — the prompt asks for the finished
 * piece and nothing else, and this is the belt for that brace.
 */
function textOf(message: Anthropic.Beta.BetaMessage): string {
  return message.content
    .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === "text")
    .map((block) => block.text)
    .join("")
    .trim();
}
