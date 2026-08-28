/**
 * THE BANNED-SHAPES CHECK, TYPED — the CLI's logic, reachable from a screen.
 *
 * `scripts/check-voice-output.mjs` owns this logic and keeps owning it. This
 * file adds no rule, no regex and no threshold; it is an adapter, and the whole
 * reason it exists is rule 21: the guard a curator runs at a terminal and the
 * guard the writing bench runs on real model output MUST AGREE, and the only
 * way two surfaces agree forever is that one of them is not a second copy.
 *
 * The script was made importable for this — its CLI is guarded behind an
 * `import.meta.url === process.argv[1]` check, so importing it parses a module
 * and runs nothing. If that guard is ever removed, importing this file will
 * start printing a usage error and exiting the server process, which is the
 * loudest possible way to be told and is better than a silent fork.
 *
 * ── WHAT IS ADDED HERE, AND WHY IT IS NOT LOGIC ──────────────────────
 *
 * Two things, both about crossing boundaries the script never crosses:
 *
 *   TYPES. The script is JavaScript. A screen that renders findings needs to
 *   know what a finding has on it, and a `Destination` must be accepted where
 *   the script takes an untyped object.
 *
 *   A SERIALIZABLE SHAPE. Findings travel from a Server Action to a browser.
 *   `near` carries every rejected line scored, which is the right answer for a
 *   terminal and a large payload for a screen that renders one of them, so the
 *   adapter keeps the nearest ONLY WHEN IT CLEARS THE SAME 0.34 THE CLI PRINTS
 *   AT — the same threshold, read from the same constant, not a second opinion
 *   about what is close.
 *
 * ── AND THE ROSTER, FOR THE SAME REASON ──────────────────────────────
 *
 * `ROOMS` walks the destinations module's exports, so it holds all eighteen
 * authored rooms rather than the thirteen keyed into `DESTINATIONS`, and
 * `isKeyed` is how a caller tells the two apart. Both are re-exported here
 * rather than re-derived, because "which rooms exist" and "which rooms are
 * servable" are exactly the facts two surfaces must not each answer for
 * themselves (rule 19: the registry is the only truth).
 */

import {
  ROOMS,
  checkVoiceOutput as check,
  isKeyed,
  roomBySlug as rawRoomBySlug,
} from "../../scripts/check-voice-output.mjs";

import type { Destination } from "./tokens.ts";

/**
 * The score at which the CLI prints its SHAPE PROXIMITY block.
 *
 * Below it the closest refusal is noise — every line shares some words with
 * some rejection. It is a reporting floor and never a verdict; the CLI says so
 * in the line it prints under the block, and so does the bench.
 */
export const PROXIMITY_FLOOR = 0.34;

/** A word the house replaced, found in the candidate. A hard finding. */
export type Displaced = { term: string; use: string };

/** A word quoted inside a `never` rule, found in the candidate. */
export type NeverHit = { term: string; rule: string };

/** A word refused in every room, with the refusal that carries it. */
export type HouseWideHit = { term: string; why: string };

/** How close the candidate came to a line this house already turned down. */
export type Proximity = {
  text: string;
  why: string;
  /** 0–1, over the shorter line's distinctive words. */
  score: number;
  shared: string[];
};

export type VoiceFindings = {
  displaced: Displaced[];
  never: NeverHit[];
  /** The room's own `banned` list, checked literally. */
  banned: string[];
  houseWide: HouseWideHit[];
  /** The closest refusal, only when it clears PROXIMITY_FLOOR. */
  nearest: Proximity | null;
  /** How many hard findings. Non-zero is the CLI's exit 1. */
  flagged: number;
};

/** The script's return, named so the adapter below is readable. */
type Raw = {
  displaced: { term: string; use: string }[];
  never: { term: string; rule: string }[];
  banned: string[];
  houseWide: { term: string; why: string }[];
  near: { text: string; why: string; score: number; shared: string[] }[];
  bad: number;
};

/**
 * Run the check. One room, one candidate line.
 *
 * Every field is copied rather than passed through. Not defensiveness: the
 * result crosses a Server Action boundary, and copying is how a shape stays
 * plain data instead of inheriting whatever the script decides to attach next.
 */
export function voiceFindings(
  destination: Destination,
  text: string
): VoiceFindings {
  const raw = check(destination, text) as Raw;
  const top = raw.near[0];
  return {
    displaced: raw.displaced.map((d) => ({ term: d.term, use: d.use })),
    never: raw.never.map((n) => ({ term: n.term, rule: n.rule })),
    banned: raw.banned.map((b) => b),
    houseWide: raw.houseWide.map((h) => ({ term: h.term, why: h.why })),
    nearest:
      top && top.score >= PROXIMITY_FLOOR
        ? {
            text: top.text,
            why: top.why,
            score: top.score,
            shared: [...top.shared],
          }
        : null,
    flagged: raw.bad,
  };
}

/**
 * Every authored room, servable or not.
 *
 * The cast is the seam between an untyped script and typed callers, and it is
 * safe for a stated reason rather than by hope: the script's filter admits only
 * objects carrying a string `key` and a `voice` with a `never` array, and
 * `voice-check.test.ts` walks the result and asserts the full `Destination`
 * shape on every row. If a non-destination export ever slips through, that test
 * is where it surfaces.
 */
export function authoredRooms(): readonly Destination[] {
  return ROOMS as readonly Destination[];
}

/** Is this room keyed into `DESTINATIONS` — that is, can a member be sent it? */
export function isServable(destination: Destination): boolean {
  return isKeyed(destination) as boolean;
}

/** One authored room by slug, servable or not. Null when there is no such room. */
export function roomBySlug(slug: string): Destination | null {
  return (rawRoomBySlug(slug) as Destination | undefined) ?? null;
}
