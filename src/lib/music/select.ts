/**
 * The pure half of the soundtrack: ordering, ISRC handling, and deciding
 * whether a catalogue result is actually the recording we asked for.
 *
 * No fetch, no process.env, no "server-only" — every function here is a
 * function of its arguments, which is what makes the interesting parts of this
 * feature testable with no credentials and no network (src/lib/music/*.test.ts).
 *
 * ── THE FAILURE THIS FILE EXISTS FOR ──────────────────────────────────
 * The expensive failure in a streaming render is not an error. It is a playlist
 * that quietly contains a karaoke cover, a 2011 remaster, or a nine-minute live
 * take of the right song. Nothing raises, nobody notices until the evening.
 *
 * So matching is deliberately CONSERVATIVE: an ISRC hit is trusted absolutely
 * (it identifies one recording and cannot be nearly-right), a word match must
 * clear a threshold on both artist and title, and a duration that disagrees by
 * more than a fifth is refused outright. An unresolved track is a question for
 * a curator. A wrong track is a ruined moment.
 */

import {
  ARC_SEGMENTS,
  type ArcSegment,
  type Track,
  type TrackQuery,
} from "./types.ts";

/* ── the ISRC ──────────────────────────────────────────────────────── */

/**
 * Twelve characters: two-letter country, three-character registrant, two-digit
 * year of reference, five-digit designation. Kept identical to the CHECK
 * constraint on tracklist_track.isrc in db/005 — if one changes, both change.
 */
const ISRC_SHAPE = /^[A-Z]{2}[A-Z0-9]{3}[0-9]{7}$/;

/**
 * Upper case, hyphens and spaces removed, validated.
 *
 * ISRCs are written both ways in the wild — "GB-AYE-06-00301" on a sleeve,
 * "GBAYE0600301" in an API — and storing both forms would mean two rows never
 * matching for a reason nobody can see. Returns null rather than throwing on
 * anything that is not one: a curator pasting the wrong field into the wrong
 * box should get an empty column, not a stack trace, and NULL is a state this
 * schema already handles (resolution fills it in).
 */
export function normaliseIsrc(
  value: string | null | undefined
): string | null {
  if (typeof value !== "string") return null;
  const compact = value.replace(/[\s-]/g, "").toUpperCase();
  return ISRC_SHAPE.test(compact) ? compact : null;
}

export function isIsrc(value: string | null | undefined): boolean {
  return normaliseIsrc(value) !== null;
}

/* ── the arc ───────────────────────────────────────────────────────── */

/** Where a segment sits in the evening. arrival = 0, ending = 4. */
export function segmentRank(segment: ArcSegment): number {
  return ARC_SEGMENTS.indexOf(segment);
}

/**
 * The selection in the order it will be heard.
 *
 * `position` is authoritative — it is what the curator authored and what the
 * database stores — so this sorts by position and NOT by segment. Sorting by
 * segment would silently "fix" a tracklist whose arc is out of order, which is
 * the one thing that must be reported rather than repaired: see arcViolations.
 *
 * Ties on position (which the database forbids, but an in-memory tracklist
 * assembled by hand can carry) keep their original order, so the function is
 * stable and its output does not depend on the sort implementation.
 */
export function orderTracks(tracks: readonly Track[]): Track[] {
  return tracks
    .map((track, index) => ({ track, index }))
    .sort((a, b) =>
      a.track.position === b.track.position
        ? a.index - b.index
        : a.track.position - b.track.position
    )
    .map((entry) => entry.track);
}

export type ArcViolation = {
  at: Track;
  after: Track;
};

/**
 * Places where the evening runs backwards — a dinner track after a late one.
 *
 * The same rule the database enforces in tracklist_arc_is_ordered(), available
 * before a write so a curator's tool can say so while she is still typing. An
 * empty array means the arc is coherent; it does NOT mean every segment is
 * present, which is deliberate — a soundtrack that is all dinner is a
 * legitimate soundtrack.
 */
export function arcViolations(tracks: readonly Track[]): ArcViolation[] {
  const ordered = orderTracks(tracks);
  const found: ArcViolation[] = [];
  for (let i = 1; i < ordered.length; i += 1) {
    if (segmentRank(ordered[i].segment) < segmentRank(ordered[i - 1].segment)) {
      found.push({ at: ordered[i], after: ordered[i - 1] });
    }
  }
  return found;
}

/**
 * The same recording twice in one evening is a mistake, not a choice — the
 * rule tracklist_track_no_repeats states in the schema, applied to an in-memory
 * selection so a render does not fail on a constraint it could have caught.
 * Tracks with no ISRC yet are never treated as duplicates of one another.
 */
export function dedupeByIsrc(tracks: readonly Track[]): Track[] {
  const seen = new Set<string>();
  return orderTracks(tracks).filter((track) => {
    const isrc = normaliseIsrc(track.isrc);
    if (!isrc) return true;
    if (seen.has(isrc)) return false;
    seen.add(isrc);
    return true;
  });
}

export function queryFromTrack(track: Track): TrackQuery {
  return {
    artist: track.artist,
    title: track.title,
    album: track.album ?? null,
    isrc: normaliseIsrc(track.isrc),
    durationMs: track.durationMs ?? null,
  };
}

/* ── matching ──────────────────────────────────────────────────────── */

/**
 * What a catalogue result looks like once the service-specific JSON has been
 * read. Every implementation maps its own response into this shape, so the
 * matcher below is shared and an Apple implementation inherits it.
 */
export type Candidate = {
  externalId: string;
  url?: string | null;
  isrc?: string | null;
  artist: string;
  title: string;
  album?: string | null;
  durationMs?: number | null;
};

/**
 * Everything that makes two spellings of one recording look different:
 * diacritics, case, punctuation, the featured artist, and the parenthetical
 * apparatus record labels attach to a title.
 *
 * "Águas de Março (Remastered 2015)" and "Aguas de Marco" are the same song and
 * must score as such; "Waters of March" is a different recording and must not
 * be repaired into a match by anything here.
 */
export function normaliseForMatch(value: string): string {
  return value
    .normalize("NFD")
    // The combining marks NFD just split off, U+0300–U+036F. Load-bearing, and
    // it must run BEFORE the final strip: "Á" decomposes to "A" + an accent,
    // and letting the strip turn that accent into a space would split the word.
    // Written as a literal range because \p{M} needs an ES2018 target.
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\((?:feat|ft|with)[^)]*\)/g, " ")
    .replace(/\s-\s(?:remaster|remastered|mono|stereo|single|radio)[^-]*$/g, " ")
    // "live" is deliberately NOT in either list. A remaster, a mono mix and a
    // deluxe-edition tag all name the same performance; a live take is a
    // DIFFERENT RECORDING, and normalising the word away would make the
    // Wembley version score identically to the one she chose.
    .replace(/\((?:remaster|remastered|mono|stereo|deluxe)[^)]*\)/g, " ")
    .replace(/\b(?:feat|ft|featuring)\b\.?.*$/g, " ")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Sørensen–Dice on character bigrams. 1 is identical, 0 shares nothing. */
export function similarity(a: string, b: string): number {
  const left = normaliseForMatch(a);
  const right = normaliseForMatch(b);
  if (!left && !right) return 1;
  if (!left || !right) return 0;
  if (left === right) return 1;
  if (left.length < 2 || right.length < 2) return left === right ? 1 : 0;

  const bigrams = new Map<string, number>();
  for (let i = 0; i < left.length - 1; i += 1) {
    const pair = left.slice(i, i + 2);
    bigrams.set(pair, (bigrams.get(pair) ?? 0) + 1);
  }

  let shared = 0;
  for (let i = 0; i < right.length - 1; i += 1) {
    const pair = right.slice(i, i + 2);
    const count = bigrams.get(pair) ?? 0;
    if (count > 0) {
      bigrams.set(pair, count - 1);
      shared += 1;
    }
  }

  return (2 * shared) / (left.length - 1 + (right.length - 1));
}

/**
 * A recording is not the one we asked for if it is a fifth longer or shorter.
 * That single test catches most of the substitutions that matter: the extended
 * mix, the live take, the radio edit, and the karaoke version that is usually
 * a few seconds off.
 */
const DURATION_TOLERANCE = 0.2;

/** Below this, an answer is not an answer. Tuned to reject, not to reach. */
export const MATCH_THRESHOLD = 0.72;

export type Scored = {
  candidate: Candidate;
  score: number;
  /** Set when the candidate is refused outright rather than merely scored low. */
  rejected?: string;
};

/**
 * How much this result looks like what was asked for.
 *
 * Weighted title and artist, with duration as a veto rather than a term:
 * duration cannot make a wrong song right, but a disagreeing duration is
 * decisive evidence that a right-looking song is the wrong recording.
 */
export function scoreCandidate(query: TrackQuery, candidate: Candidate): Scored {
  const queryIsrc = normaliseIsrc(query.isrc);
  const candidateIsrc = normaliseIsrc(candidate.isrc);
  if (queryIsrc && candidateIsrc && queryIsrc === candidateIsrc) {
    return { candidate, score: 1 };
  }

  if (
    typeof query.durationMs === "number" &&
    typeof candidate.durationMs === "number" &&
    query.durationMs > 0 &&
    candidate.durationMs > 0
  ) {
    const drift =
      Math.abs(candidate.durationMs - query.durationMs) / query.durationMs;
    if (drift > DURATION_TOLERANCE) {
      return {
        candidate,
        score: 0,
        rejected: `runs ${Math.round(candidate.durationMs / 1000)}s against ${Math.round(
          query.durationMs / 1000
        )}s — a different recording`,
      };
    }
  }

  const title = similarity(query.title, candidate.title);
  const artist = similarity(query.artist, candidate.artist);

  // Both have to be right. A title that matches perfectly under the wrong
  // artist is a cover, which is exactly the substitution this refuses.
  if (title < 0.5 || artist < 0.5) {
    return {
      candidate,
      score: 0,
      rejected:
        title < 0.5
          ? `titled "${candidate.title}"`
          : `credited to "${candidate.artist}"`,
    };
  }

  return { candidate, score: 0.6 * title + 0.4 * artist };
}

export type Match = {
  candidate: Candidate;
  score: number;
};

/**
 * The best candidate that clears the bar, or null.
 *
 * Null is a real answer and the caller must carry it: an unresolved track is
 * recorded in tracklist_rendering.unresolved and, by default, stops the render
 * before anything is created. Returning a poor match instead would turn a
 * question a curator can answer in ten seconds into a silent defect.
 */
export function bestMatch(
  query: TrackQuery,
  candidates: readonly Candidate[],
  threshold: number = MATCH_THRESHOLD
): Match | null {
  let best: Match | null = null;
  for (const candidate of candidates) {
    const scored = scoreCandidate(query, candidate);
    if (scored.score < threshold) continue;
    if (!best || scored.score > best.score) {
      best = { candidate, score: scored.score };
    }
  }
  return best;
}

/* ── shaping requests ──────────────────────────────────────────────── */

/** Splits into batches, for endpoints that take many ids at once. */
export function chunk<T>(items: readonly T[], size: number): T[][] {
  if (size < 1) throw new RangeError("chunk size must be at least 1");
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size) as T[]);
  }
  return out;
}

/**
 * Cuts to a limit on a word boundary where it can, with no ellipsis: a
 * truncated line that announces its own truncation reads worse than one that
 * simply ends. Used for playlist names and descriptions, both of which every
 * service caps somewhere.
 */
export function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;

  const cut = clean.slice(0, max);
  // The limit fell exactly at a word boundary; there is nothing to tidy.
  if (clean[max] === " ") return cut.trim();

  const lastSpace = cut.lastIndexOf(" ");
  // Backing up to the last space is only worth it when it does not throw most
  // of the line away — a single very long word is better cut than lost.
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim();
}
