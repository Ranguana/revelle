/**
 * THE WRITING — what a host can ask the house for, as types.
 *
 * Framework-free on purpose, like src/lib/tokens.ts and src/lib/portal/
 * sections.ts: a test, a script and a print job all need these and none of
 * them should have to start Next to get them.
 *
 * ── THE ONE IDEA IN THIS FILE ────────────────────────────────────────
 *
 * A request to write something is a UNION, and the two arms are not variants
 * of one shape — they are different requests with different consequences:
 *
 *   VoicedRequest   the house writes it, in the destination's register.
 *   PlainRequest    it goes out plain. No voice, no joke, no house.
 *
 * `breaksCharacterFor` in every destination's voice names what that house
 * never jokes about — anything a guest must act on to arrive or be safe,
 * anything about money, and any message that gives someone a way out. That
 * could have been a warning on a screen. A warning is a thing a screen forgets
 * when somebody adds a second screen, so instead:
 *
 *   · `writePiece()` accepts a VoicedRequest and nothing else. A PlainRequest
 *     is not assignable to it, so the model cannot be handed a cancellation.
 *   · `composePlain()` accepts a PlainRequest and IS NOT GIVEN A DESTINATION.
 *     Not "is told not to use the voice" — has no voice to use. There is no
 *     parameter through which one could arrive.
 *   · db/024 says the same thing a third time, in a check constraint: a
 *     correspondence row with `plain` true has a null `voice_id`.
 *
 * Three copies of one rule, in three languages, none of which is a sentence in
 * an interface that somebody has to remember to render.
 */

import type { PieceKind } from "../tokens.ts";

/**
 * WHAT SHE ASKS FOR, when the house is writing.
 *
 * `ask` is the job in her own words — "ask six people to the house for Labor
 * Day". `facts` are the things that must appear exactly: Friday, seven
 * o'clock, Dune Road, bring a swimsuit. She is never asked to write in the
 * voice herself, and neither field invites her to: one is an instruction and
 * the other is a list.
 */
export type VoicedRequest = {
  route: "voiced";
  kind: PieceKind;
  ask: string;
  facts: readonly string[];
  /** 1-based, on a bulletin for a getaway that runs more than one morning. */
  dayIndex: number | null;
  /** A ceiling, when the piece has a physical size. A place card is not a page. */
  maxWords: number | null;
};

/**
 * WHAT SHE ASKS FOR, when it must go out plain.
 *
 * Note what is missing: there is no `kind` that could reach a set of
 * exemplars, no `maxWords` that could make it terse for effect, and above all
 * no destination anywhere in this type or in the function that consumes it.
 *
 * `reason` is one of the destination's own `breaksCharacterFor` lines, carried
 * so the house can see what it is being asked to say straight. It is recorded,
 * never rendered as a warning.
 */
export type PlainRequest = {
  route: "plain";
  reason: string;
  /** The message, in her words. It is not rewritten. */
  ask: string;
  /** The things they have to act on. One per line, and they go out as lines. */
  facts: readonly string[];
};

export type PieceRequest = VoicedRequest | PlainRequest;

/** One finished piece of writing, whoever's hand it is in. */
export type Draft = {
  id: string;
  ordinal: number;
  hand: "house" | "hers";
  body: string;
  /** What this one replaced. Null on the first. */
  replaces: string | null;
  model: string | null;
  createdAt: string;
};

/** What the host sees offered on the compose screen. */
export type PieceChoice = {
  /** The value that goes into the form. */
  value: string;
  /** What she reads. "An invitation." */
  label: string;
  /** One line under it. Concrete, never an instruction. */
  hint: string;
  /** Voiced choices carry the piece kind; plain ones carry the reason. */
  route: "voiced" | "plain";
  kind: PieceKind | null;
  reason: string | null;
  maxWords: number | null;
};

/** Absent configuration is a state, not an error — the soundtrack's rule. */
export class WritingDeskClosedError extends Error {
  constructor(missing: string) {
    super(`${missing} is not set — nothing can be written`);
    this.name = "WritingDeskClosedError";
  }
}

/**
 * A destination with no published voice cannot have correspondence written in
 * it. Said in words a curator or a member can act on, the way approval already
 * refuses an unvoiced destination.
 */
export class NoVoiceError extends Error {
  constructor(destination: string) {
    super(
      `${destination} has no published voice. Nothing can be written in it ` +
        `until one is published — a voice is what the writing is made of.`
    );
    this.name = "NoVoiceError";
  }
}

/** The model declined, or came back with nothing usable. */
export class WritingFailedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WritingFailedError";
  }
}
