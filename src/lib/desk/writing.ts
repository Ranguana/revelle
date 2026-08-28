/**
 * THE WRITING BENCH — the one model call in the product, invoked on purpose.
 *
 * `src/lib/correspondence/writer.ts` has never run. Not once, in any
 * environment. It is reachable only from a member's own portal, which means
 * producing a single line costs an application, a decision, a delivered Revelle
 * and an occasion — so the thing that decides how thirteen houses SOUND has
 * never been read by the person whose taste it is meant to carry.
 *
 * This module is the way in. A room, a piece kind, an ask, and the real writer
 * runs against the real prompt.
 *
 * ── IT WRITES NOTHING DOWN, AND THAT IS LOAD-BEARING ─────────────────
 *
 * The same discipline as the selection bench next door (src/lib/desk/bench.ts),
 * for a sharper reason: correspondence is the one place where a generated line
 * could be MISTAKEN FOR SOMETHING THE HOUSE OFFERED HER. So a bench run leaves
 * behind:
 *
 *   no correspondence_piece   nothing is drafted into anybody's occasion,
 *                             which is what `startPiece` does and this does not
 *                             call.
 *   no revelle, no occasion   the request is composed against a Destination
 *                             object, not against a member's row. There is no
 *                             member in this file and no parameter for one.
 *   no voice pin              nothing claims a voice version, so no issued
 *                             Revelle can drift under one of these.
 *
 * Rule 8 from the other end: agents and benches produce drafts at most, and
 * this one does not even produce those. What comes back is text on a screen.
 *
 * ── WHAT IT SHOWS BESIDES THE LINE ───────────────────────────────────
 *
 * A line she dislikes is a different problem depending on what the model was
 * shown. So every run carries WHICH EXEMPLARS AND WHICH REFUSALS THE PROMPT
 * ACTUALLY CONTAINED — measured against the assembled prompt string by finding
 * each authored line in it, never by re-deriving `voicePrompt`'s hoisting rule
 * here. That is rule 21 and rule 24 together: the prompt is the only authority
 * on what the prompt carried, and the way to know what a match matched is to
 * count it. An authored line the prompt does NOT carry is reported as missing
 * rather than quietly omitted from a list that then looks complete.
 *
 * ── THE FAILURE THIS BENCH EXISTS TO DETECT ──────────────────────────
 *
 * Not a bad line. THE SAME LINE IN EVERY HOUSE — which is invisible in a single
 * sample and fatal across a library, and is the reason writer.ts names Opus
 * rather than something cheaper. So a run takes up to three rooms and writes
 * the same piece in each, and the three sit beside each other. One call per
 * room, counted and shown before and after; there is deliberately no button
 * that spends eighteen.
 *
 * ── AND IT IS FRAMEWORK-FREE, WHICH IS WHY IT CAN BE TESTED ──────────
 *
 * The writer arrives as a parameter (`WriterSeam`), not as an import. writer.ts
 * is "server-only" and builds its own Anthropic client, so a module that
 * imported it could not be run by `node --test` and its success path could
 * never be exercised without a key and a network. Passing the seam in means the
 * shape of a run — the prompt, the carried lines, the voice check, the cost —
 * is provable against a stub, and the only thing left untested is the network
 * call itself.
 */

import type { PieceKind } from "../tokens.ts";
import { PIECE_KINDS, writerPrompt, type Destination } from "../tokens.ts";
import type { VoicedRequest } from "../correspondence/types.ts";
import { voicedChoices } from "../correspondence/pieces.ts";
import {
  authoredRooms,
  isServable,
  roomBySlug,
  voiceFindings,
  type VoiceFindings,
} from "../voice-check.ts";

/**
 * How many rooms one run may write.
 *
 * Three, because three is what fits side by side on a screen and because the
 * cost of a run should be a number she agreed to. Two would be enough to catch
 * the failure; three is enough to see whether the third is also the same line.
 */
export const MAX_ROOMS = 3;

/* ── the rooms ───────────────────────────────────────────────────────── */

/** A room as the picker draws it. */
export type BenchRoom = {
  slug: string;
  name: string;
  tagline: string;
  /**
   * Keyed into `DESTINATIONS`, and therefore a room a member can actually be
   * sent. False for the five that are authored and unwired.
   */
  servable: boolean;
  /** How many authored lines the voice has, so a thin room says so up front. */
  exemplars: number;
  rejected: number;
};

/**
 * Every authored room, servable first.
 *
 * THE UNWIRED FIVE ARE OFFERED, LABELLED, NOT OMITTED. They have voices, they
 * have exemplars, and `writerPrompt` does not ask whether a room is keyed — so
 * a bench that hid them would be withholding exactly the rooms whose voices
 * have been read by nobody, on the grounds that nobody has read them. What it
 * may not do is let the label go missing: reaching one of these is a QA read
 * and not an activation (rule 8), the screen says so on every row, and nothing
 * in this file writes a row anywhere for either kind.
 *
 * The roster is `authoredRooms()`, which walks the destinations module's
 * exports. Not a hand-written list of the five: Acapulco moved from unwired to
 * wired on 2026-08-27, and a list would have been correct until that morning
 * and wrong without breaking (rule 19).
 */
export function benchRooms(): BenchRoom[] {
  return authoredRooms()
    .map((d) => ({
      slug: d.key,
      name: d.name,
      tagline: d.tagline,
      servable: isServable(d),
      exemplars: d.voice.exemplars.length,
      rejected: d.voice.rejected.length,
    }))
    .sort((a, b) => Number(b.servable) - Number(a.servable));
}

/* ── the piece ───────────────────────────────────────────────────────── */

/**
 * The word ceiling for a piece, where the piece has a physical size.
 *
 * Read out of `voicedChoices`, which already owns this fact for the six pieces
 * a host sends — a place card is a card, and the bench and the member's compose
 * screen must not disagree about how long one is (rule 21). The three pieces
 * that are not offered to a member (`heading`, `sign_off`, `game_rule`) have no
 * ceiling there and get none here.
 *
 * `voicedChoices` takes the number of days so it can withhold a bulletin from a
 * one-night evening. The bench is not an occasion and has no days; it asks for
 * all of them.
 */
const CEILINGS = new Map<PieceKind, number | null>(
  voicedChoices(7).map((choice) => [choice.kind as PieceKind, choice.maxWords])
);

export function defaultCeiling(piece: PieceKind): number | null {
  return CEILINGS.get(piece) ?? null;
}

/**
 * A placeholder ask per piece, so the form is useful before anything is typed.
 *
 * NOT a fact two surfaces must agree about, which is rule 21's narrow test:
 * scripts/writer-prompt.mjs carries its own defaults for its own reader, and
 * one of them changing does not make the other wrong. These are worded as jobs
 * a host would actually name, because an ask worded like a prompt produces a
 * line written to a prompt.
 */
export const DEFAULT_ASKS: Readonly<Record<PieceKind, string>> = {
  invitation:
    "Ask six people to the house for a long weekend. They already know each other.",
  menu_item: "Name one dish on the dinner card.",
  notice: "One line for the hall table about the record player.",
  house_note: "A note left in a guest's room before she arrives.",
  place_card: "One place card. A name, and where she is sitting.",
  game_rule: "The rule for a game played after dinner, in one or two lines.",
  bulletin: "The line at the top of the second morning's sheet.",
  heading: "A heading for the drinks section of the menu.",
  sign_off: "The line that closes the invitation.",
};

/* ── a run ───────────────────────────────────────────────────────────── */

export type WritingInput = {
  slugs: readonly string[];
  piece: PieceKind;
  ask: string;
  facts: readonly string[];
  maxWords: number | null;
  /**
   * False assembles the prompts and stops there — free, no key needed, and the
   * only mode that works on a laptop. True spends one Opus call per room.
   */
  generate: boolean;
};

/**
 * One authored line, and where the assembled prompt put it.
 *
 * `at` is the character offset in the prompt, which is how the order on screen
 * is decided: the exemplars matching the piece are hoisted by `voicePrompt`, so
 * sorting by offset shows them in the order the model read them WITHOUT this
 * file knowing that hoisting exists. `at` is -1 when the prompt does not carry
 * the line at all.
 */
export type CarriedLine = {
  text: string;
  /** The piece an exemplar belongs to. Null on a refusal. */
  piece: string | null;
  /** Why a line was refused. Null on an exemplar. */
  why: string | null;
  at: number;
};

export type RoomOutcome = {
  slug: string;
  name: string;
  servable: boolean;
  /** The prompt, verbatim, exactly as the writer was handed it. */
  prompt: string;
  exemplarsCarried: CarriedLine[];
  exemplarsMissing: CarriedLine[];
  rejectedCarried: CarriedLine[];
  rejectedMissing: CarriedLine[];
  /** Null on a prompt-only run, and on a room whose call failed. */
  written: { body: string; model: string } | null;
  findings: VoiceFindings | null;
  /** In words, from the writer's own errors. Null when nothing went wrong. */
  error: string | null;
};

export type WritingRun = {
  /** ISO, so the screen can say which run it is reading. */
  at: string;
  piece: PieceKind;
  ask: string;
  facts: string[];
  maxWords: number | null;
  /** False on a prompt-only run: nothing was spent and nothing was written. */
  generated: boolean;
  /** What writer.ts asks for. The answer may come back on another model. */
  requestedModel: string;
  maxTokens: number;
  /** Model calls attempted by this run, failures included. The bill. */
  calls: number;
  rooms: RoomOutcome[];
};

/**
 * The writer, as a parameter.
 *
 * `write` is `writePiece` from src/lib/correspondence/writer.ts, handed in by
 * the Server Action. `model` and `maxTokens` are that file's own constants —
 * read from it rather than restated here, so the cost the screen quotes is the
 * cost the call makes (rule 21).
 *
 * WHAT IS NOT ON THE SEAM, and each absence is deliberate rather than an
 * oversight, because a field taken in and never acted on is rule 16:
 *
 *   no `canWrite`   the action asks writer.ts directly and refuses in words
 *                   before this module is reached. A second gate here would
 *                   have to invent a second sentence for the same fact.
 *   no `rejected`   `writePiece` replays the lines a host has already turned
 *                   down, and a bench has no host and no history. Every run is
 *                   a first request, which is the honest thing to compare
 *                   across rooms anyway.
 */
export type WriterSeam = {
  write: (
    destination: Destination,
    request: VoicedRequest
  ) => Promise<{ body: string; model: string }>;
  model: string;
  maxTokens: number;
};

/**
 * What is wrong with the request, in words, before anything is spent.
 *
 * Every one of these is a refusal she can act on. An unknown slug names the
 * slug; too many rooms names the ceiling and why it exists.
 */
export function writingErrors(input: WritingInput): string[] {
  const errors: string[] = [];

  if (input.slugs.length === 0) {
    errors.push("Pick a room. Nothing can be written in no house.");
  }
  if (input.slugs.length > MAX_ROOMS) {
    errors.push(
      `${MAX_ROOMS} rooms at a time. Each one is a separate Opus call, and a ` +
        `run that spends more than you meant it to is not a bench.`
    );
  }
  for (const slug of input.slugs) {
    const room = roomBySlug(slug);
    if (!room) {
      errors.push(`There is no room called ${slug}.`);
    } else if (room.voice.exemplars.length === 0) {
      errors.push(
        `${room.name} has no lines in its voice. A voice is what the writing ` +
          `is made of, and the writer refuses this one by name.`
      );
    }
  }
  if (!PIECE_KINDS.includes(input.piece)) {
    errors.push(`There is no piece called ${input.piece}.`);
  }
  if (input.ask.trim().length === 0) {
    errors.push("Say what the piece has to do.");
  }
  // Blank means the house ceiling and zero means no ceiling at all, both of
  // which arrive here as null. A negative number is a typo, and saying which
  // two blanks mean what is cheaper than letting her guess.
  if (input.maxWords !== null && input.maxWords < 1) {
    errors.push(
      "A word ceiling cannot be negative. Leave it blank for the house " +
        "ceiling, or type 0 for no ceiling at all."
    );
  }

  return [...new Set(errors)];
}

/**
 * Assemble, optionally call, check, and hand back one run.
 *
 * A failure in one room does not lose the others: each is caught and carried on
 * that room's outcome, so two houses that answered still sit beside the one
 * that did not. That is the whole point of the side-by-side — a run that threw
 * away two good answers because a third timed out would have spent three calls
 * and shown one error.
 */
export async function runWritingBench(
  input: WritingInput,
  writer: WriterSeam
): Promise<WritingRun> {
  const rooms: RoomOutcome[] = [];
  let calls = 0;

  for (const slug of input.slugs.slice(0, MAX_ROOMS)) {
    const destination = roomBySlug(slug);
    if (!destination) continue;

    const prompt = writerPrompt(destination, {
      piece: input.piece,
      ask: input.ask,
      facts: input.facts.length > 0 ? input.facts : undefined,
      maxWords: input.maxWords ?? undefined,
    });

    const outcome: RoomOutcome = {
      slug: destination.key,
      name: destination.name,
      servable: isServable(destination),
      prompt,
      ...carriedLines(destination, prompt),
      written: null,
      findings: null,
      error: null,
    };

    if (input.generate) {
      calls += 1;
      const request: VoicedRequest = {
        route: "voiced",
        kind: input.piece,
        ask: input.ask,
        facts: input.facts,
        // The bench is not an occasion, so there is no morning this is the top
        // of. `writerPrompt` does not read it either; it is on the request type
        // because a member's bulletin needs it.
        dayIndex: null,
        maxWords: input.maxWords,
      };
      try {
        const written = await writer.write(destination, request);
        outcome.written = { body: written.body, model: written.model };
        outcome.findings = voiceFindings(destination, written.body);
      } catch (err) {
        outcome.error =
          err instanceof Error ? err.message : "Nothing came back.";
      }
    }

    rooms.push(outcome);
  }

  return {
    at: new Date().toISOString(),
    piece: input.piece,
    ask: input.ask,
    facts: [...input.facts],
    maxWords: input.maxWords,
    generated: input.generate,
    requestedModel: writer.model,
    maxTokens: writer.maxTokens,
    calls,
    rooms,
  };
}

/**
 * WHAT THE PROMPT ACTUALLY CARRIED — found in the prompt, not predicted.
 *
 * Every authored exemplar and every authored refusal is looked for in the
 * assembled string. Carried ones are sorted by where they appear, which is the
 * order the model read them; missing ones are kept and reported, because an
 * authored line that did not reach the prompt is the interesting case and a
 * list that silently dropped it would look complete (rule 24: count what it
 * matched, in both directions).
 *
 * Exported for its test. Today `voicePrompt` renders every exemplar and every
 * refusal, so the missing lists are empty for every authored room — which is
 * the correct answer and also means the channel has never fired. It is not dead
 * code: the first time somebody caps the exemplar block, or hoists only the
 * matching ones, this is what says so on the screen instead of quietly showing
 * a shorter list. `writing.test.ts` fires it against a prompt that carries
 * nothing, because a guard whose only evidence is that it has never gone off is
 * a guard nobody has tested.
 */
export function carriedLines(
  destination: Destination,
  prompt: string
): Pick<
  RoomOutcome,
  "exemplarsCarried" | "exemplarsMissing" | "rejectedCarried" | "rejectedMissing"
> {
  const exemplars = destination.voice.exemplars.map((e) => ({
    text: e.text,
    piece: e.piece as string,
    why: null,
    // Both renderings, because `voicePrompt` writes the hoisted block bare and
    // labels the rest. Whichever is found first is where the model read it.
    at: renderedAt(prompt, e.text, `${e.piece}: ${e.text}`),
  }));
  const rejected = destination.voice.rejected.map((r) => ({
    text: r.text,
    piece: null,
    why: r.why,
    at: renderedAt(prompt, r.text),
  }));
  const byPosition = (a: CarriedLine, b: CarriedLine) => a.at - b.at;

  return {
    exemplarsCarried: exemplars.filter((l) => l.at >= 0).sort(byPosition),
    exemplarsMissing: exemplars.filter((l) => l.at < 0),
    rejectedCarried: rejected.filter((l) => l.at >= 0).sort(byPosition),
    rejectedMissing: rejected.filter((l) => l.at < 0),
  };
}

/**
 * WHERE A LINE WAS RENDERED — anchored to the start of its own line.
 *
 * FOUND BY COUNTING, which is the only way it was going to be found. The first
 * version of this was `prompt.indexOf(text)`, and it was wrong in a way that
 * read perfectly: ACAPULCO's tagline is "Lunch never exactly ends. Nobody
 * checks a clock again once the candles are lit", and its `notice` exemplar is
 * the second of those sentences — so a bare substring search located that
 * exemplar at character 281, inside THE DESTINATION block, four thousand
 * characters before any exemplar is rendered. The screen would have reported
 * that the model read a notice first when it read three invitations first, and
 * the number would have been right and the meaning wrong (rule 23).
 *
 * So the search is for the RENDERED LINE, not the string: a newline, the two
 * spaces `voicePrompt` indents with, the text, and the end of the line. The
 * lexicon, the formulae, the sign-offs and every `always`/`never` rule are
 * written as `  - …` and cannot collide with this; the destination's own
 * tagline and premise can only collide by being EXACTLY an exemplar, which is a
 * true statement about the prompt if it ever happens.
 */
function renderedAt(prompt: string, ...renderings: string[]): number {
  const found = renderings
    .map((line) => prompt.indexOf(`\n  ${line}\n`))
    .filter((at) => at >= 0);
  return found.length > 0 ? Math.min(...found) : -1;
}
