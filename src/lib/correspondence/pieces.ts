/**
 * WHAT SHE MAY ASK FOR — the menu on the compose screen.
 *
 * Framework-free. Pure functions over a Voice; no database, no model, no
 * React. That is what makes the copy she reads testable, and the plain routes
 * provably derived from the destination rather than typed in twice.
 *
 * ── THE VOICED PIECES ARE A SUBSET, AND ON PURPOSE ───────────────────
 *
 * `PIECE_KINDS` in src/lib/tokens.ts has nine members. Six of them are things
 * a host sends people; `heading`, `sign_off` and `game_rule` are parts of
 * printed matter the house sets for her, not letters she writes. Offering them
 * here would put "a section head" in a list of ways to talk to her friends.
 *
 * The order is the spec's, which is the order these actually happen in:
 * the ask, then everyone, then one person, then each morning, then the table.
 *
 * ── THE PLAIN ROUTES ARE READ OUT OF THE DESTINATION ─────────────────
 *
 * Not a constant. Every destination's `breaksCharacterFor` names its own
 * exits, in its own words — WESTHAMPTON worries about a locked door, HAVANA
 * about the unlit stairs to the roof — and hard-coding three categories here
 * would quietly replace thirteen authored answers with one guess.
 *
 * So a plain route is one entry of that array, split into a label and a line
 * under it. She never sees a warning, a lock, or a disabled control; she sees
 * three more things she can write, which happen to be the three the house does
 * not make jokes about.
 */

import type { PieceKind, Voice } from "../tokens.ts";
import type { PieceChoice } from "./types.ts";

/**
 * The pieces a host sends, in the order she sends them.
 *
 * `maxWords` is a physical fact about the object, not a style preference: a
 * place card is a card. Null where the piece has no edge.
 */
const VOICED: readonly {
  kind: PieceKind;
  label: string;
  hint: string;
  maxWords: number | null;
  /** Only offered on an occasion that runs over more than one day. */
  needsDays: boolean;
}[] = [
  {
    kind: "invitation",
    label: "An invitation",
    hint: "The ask itself. Where, when, and what it is.",
    maxWords: 60,
    needsDays: false,
  },
  {
    kind: "notice",
    label: "A note to everyone",
    hint: "One thing they should all know before they arrive.",
    maxWords: 60,
    needsDays: false,
  },
  {
    kind: "house_note",
    label: "A note to one person",
    hint: "Left in a room, or handed over.",
    maxWords: 60,
    needsDays: false,
  },
  {
    kind: "bulletin",
    label: "A morning bulletin",
    hint: "The line at the top of a day.",
    maxWords: 40,
    needsDays: true,
  },
  {
    kind: "menu_item",
    label: "A line for the menu",
    hint: "What a dish or a drink is called here.",
    maxWords: 25,
    needsDays: false,
  },
  {
    kind: "place_card",
    label: "A place card",
    hint: "A name, and at most one clause.",
    maxWords: 12,
    needsDays: false,
  },
];

/**
 * The voiced pieces, for an occasion that runs `days` days.
 *
 * A bulletin is absent from an evening. Not disabled and not explained —
 * absent, which is the same rule the member's page follows for a deliverable
 * that was never placed: from where she stands there is no morning to write a
 * line at the top of.
 */
export function voicedChoices(days: number): PieceChoice[] {
  return VOICED.filter((piece) => !piece.needsDays || days > 1).map((piece) => ({
    value: piece.kind,
    label: piece.label,
    hint: piece.hint,
    route: "voiced" as const,
    kind: piece.kind,
    reason: null,
    maxWords: piece.maxWords,
  }));
}

/**
 * The plain routes this destination names.
 *
 * One choice per `breaksCharacterFor` entry, split at the first colon or dash:
 * what it is on one side, what it covers on the other. The tail of several of
 * these lines — "Fact first, fewest words, no joke" — is left in, because it
 * is true of what she is about to get and reads as a description rather than
 * as a caution.
 *
 * A voice with an empty `breaksCharacterFor` yields no plain routes, which is
 * a true statement about that voice and not a hole: validate_voice() in
 * db/004 requires the field to be an array, not to be non-empty.
 */
export function plainChoices(voice: Voice): PieceChoice[] {
  return voice.breaksCharacterFor.map((line, index) => {
    const { label, hint } = split(line);
    return {
      value: `plain:${index}`,
      label,
      hint,
      route: "plain" as const,
      kind: null,
      reason: line,
      maxWords: null,
    };
  });
}

/** Everything she may ask for, voiced first, plain after. */
export function allChoices(voice: Voice, days: number): PieceChoice[] {
  return [...voicedChoices(days), ...plainChoices(voice)];
}

/** Find a choice by the value a form submitted. Null when it is not one. */
export function choiceFor(
  voice: Voice,
  days: number,
  value: string
): PieceChoice | null {
  return allChoices(voice, days).find((c) => c.value === value) ?? null;
}

/**
 * Split one breaksCharacterFor line into a label and a line under it.
 *
 * The authored lines take one of two shapes, and both are in WESTHAMPTON:
 *
 *   "Anything a guest has to act on to arrive or to be safe: an address, …"
 *   "Any message that gives someone a way out — a decline, a cancellation, …"
 *
 * and a third that is a label with nothing after it: "Anything about money."
 * Splitting on the first colon or em dash handles all three, and a line that
 * contains neither becomes a label with no hint, which is correct.
 */
function split(line: string): { label: string; hint: string } {
  const at = line.search(/:|\s—\s/);
  if (at < 0) return { label: strip(line), hint: "" };
  const label = strip(line.slice(0, at));
  const rest = line.slice(at).replace(/^(:|\s—\s)\s*/, "").trim();
  return { label, hint: capital(rest) };
}

/** No trailing period on a label. It is a name, not a sentence. */
function strip(text: string): string {
  return text.trim().replace(/\.$/, "");
}

function capital(text: string): string {
  return text.length === 0 ? text : text[0].toUpperCase() + text.slice(1);
}

/**
 * WHICH MORNING THIS BULLETIN IS.
 *
 * Ordinal words rather than a numeral, for the same reason src/lib/portal/
 * sections.ts says "five prompt cards" — a numeral beside a heading reads as a
 * tally, and docs/copy-brief.md bans counting. Beyond the sixth morning it is
 * a numeral again, because "the eleventh morning" is worse than knowing the
 * house has never sold an eleven-day getaway.
 */
const ORDINALS = [
  "",
  "The first morning",
  "The second morning",
  "The third morning",
  "The fourth morning",
  "The fifth morning",
  "The sixth morning",
];

export function morningLabel(dayIndex: number | null): string {
  if (dayIndex === null || dayIndex < 1) return "";
  return ORDINALS[dayIndex] ?? `Morning ${dayIndex}`;
}

/**
 * Facts as she types them: one per line, blanks dropped.
 *
 * Kept here rather than in a form handler because the same parse has to work
 * for a test and for a script, and because "what did she actually ask the
 * piece to carry" is a question the corpus will be asked later.
 */
export function factsFrom(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}
