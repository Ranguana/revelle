/**
 * The pure half of the soundtrack, tested.
 *
 *   npm test
 *
 * Node's own runner (`node --test`), no framework, no dependency. Nothing here
 * touches a network or reads a credential — deliberately, because the parts of
 * this feature that can be tested honestly are exactly the parts that decide
 * whether the right recording ends up in the right place, and none of them
 * needs Spotify to be reachable.
 */
import assert from "node:assert/strict";
import test from "node:test";

import {
  MATCH_THRESHOLD,
  arcViolations,
  bestMatch,
  chunk,
  dedupeByIsrc,
  normaliseForMatch,
  normaliseIsrc,
  orderTracks,
  queryFromTrack,
  scoreCandidate,
  segmentRank,
  similarity,
  truncate,
  type Candidate,
} from "./select.ts";
import type { ArcSegment, Track } from "./types.ts";

function track(
  position: number,
  segment: ArcSegment,
  extra: Partial<Track> = {}
): Track {
  return {
    position,
    segment,
    artist: extra.artist ?? "Nina Simone",
    title: extra.title ?? `Track ${position}`,
    ...extra,
  };
}

/* ── the ISRC, the portability key ─────────────────────────────────── */

test("normaliseIsrc accepts every form an ISRC is written in", () => {
  assert.equal(normaliseIsrc("GBAYE0600301"), "GBAYE0600301");
  assert.equal(normaliseIsrc("GB-AYE-06-00301"), "GBAYE0600301");
  assert.equal(normaliseIsrc("gb aye 06 00301"), "GBAYE0600301");
  // A registrant code may contain digits.
  assert.equal(normaliseIsrc("USRC17607839"), "USRC17607839");
});

test("normaliseIsrc rejects anything that is not one, without throwing", () => {
  // A mistyped ISRC is worse than a missing one: it resolves confidently to the
  // wrong recording. Every one of these must come back null.
  assert.equal(normaliseIsrc("GBAYE060030"), null, "eleven characters");
  assert.equal(normaliseIsrc("GBAYE06003011"), null, "thirteen");
  assert.equal(normaliseIsrc("G1AYE0600301"), null, "digit in the country code");
  assert.equal(normaliseIsrc("GBAYE060030X"), null, "letter in the designation");
  assert.equal(normaliseIsrc(""), null);
  assert.equal(normaliseIsrc(null), null);
  assert.equal(normaliseIsrc(undefined), null);
  assert.equal(normaliseIsrc(12 as unknown as string), null);
});

/* ── the arc ───────────────────────────────────────────────────────── */

test("the arc runs arrival to ending", () => {
  assert.equal(segmentRank("arrival"), 0);
  assert.ok(segmentRank("dinner") < segmentRank("moment"));
  assert.ok(segmentRank("moment") < segmentRank("late"));
  assert.ok(segmentRank("late") < segmentRank("ending"));
});

test("orderTracks sorts by the authored position, not by segment", () => {
  const tracks = [track(3, "moment"), track(1, "arrival"), track(2, "dinner")];
  assert.deepEqual(
    orderTracks(tracks).map((t) => t.position),
    [1, 2, 3]
  );
});

test("orderTracks is stable, so its output does not depend on the sort", () => {
  const first = track(1, "arrival", { title: "first" });
  const second = track(1, "arrival", { title: "second" });
  assert.deepEqual(
    orderTracks([first, second]).map((t) => t.title),
    ["first", "second"]
  );
});

test("arcViolations reports an evening that runs backwards", () => {
  const violations = arcViolations([
    track(1, "arrival"),
    track(2, "late"),
    track(3, "dinner"),
  ]);
  assert.equal(violations.length, 1);
  assert.equal(violations[0].at.position, 3);
  assert.equal(violations[0].after.position, 2);
});

test("arcViolations allows repeats and gaps — an all-dinner evening is legal", () => {
  assert.deepEqual(
    arcViolations([
      track(1, "dinner"),
      track(2, "dinner"),
      track(3, "dinner"),
    ]),
    []
  );
  assert.deepEqual(
    arcViolations([track(1, "arrival"), track(2, "ending")]),
    [],
    "skipping the middle of the night is a choice, not an error"
  );
});

test("arcViolations judges the ordered selection, not the array order", () => {
  // Same three tracks, handed over shuffled. The arc is coherent by position.
  assert.deepEqual(
    arcViolations([
      track(3, "late"),
      track(1, "arrival"),
      track(2, "dinner"),
    ]),
    []
  );
});

test("dedupeByIsrc drops a repeated recording and keeps unresolved ones", () => {
  const kept = dedupeByIsrc([
    track(1, "arrival", { isrc: "GBAYE0600301" }),
    track(2, "dinner", { isrc: "gb-aye-06-00301" }),
    track(3, "moment"),
    track(4, "late"),
  ]);
  assert.deepEqual(
    kept.map((t) => t.position),
    [1, 3, 4],
    "two tracks with no ISRC are not duplicates of each other"
  );
});

test("queryFromTrack normalises the ISRC on the way out", () => {
  const query = queryFromTrack(
    track(1, "arrival", { isrc: "gb-aye-06-00301", durationMs: 200_000 })
  );
  assert.equal(query.isrc, "GBAYE0600301");
  assert.equal(query.durationMs, 200_000);
  assert.equal(query.album, null);
});

/* ── matching: the failure with no error message ───────────────────── */

test("normaliseForMatch sees through accents and label apparatus", () => {
  assert.equal(normaliseForMatch("Águas de Março"), "aguas de marco");
  assert.equal(
    normaliseForMatch("I Want Your Love (Remastered 2018)"),
    "i want your love"
  );
  assert.equal(
    normaliseForMatch("The Girl from Ipanema - Remastered 2014"),
    "the girl from ipanema"
  );
  assert.equal(
    normaliseForMatch("Água de Beber (feat. Stan Getz)"),
    "agua de beber"
  );
  assert.equal(normaliseForMatch("Simon & Garfunkel"), "simon and garfunkel");
});

test("similarity is 1 for the same recording spelled differently", () => {
  assert.equal(similarity("Águas de Março", "Aguas de Marco"), 1);
  assert.equal(similarity("Feeling Good", "feeling good"), 1);
  assert.ok(similarity("Feeling Good", "Waters of March") < 0.3);
});

function candidate(extra: Partial<Candidate> = {}): Candidate {
  return {
    externalId: "spotify:track:abc",
    artist: "Nina Simone",
    title: "Feeling Good",
    durationMs: 175_000,
    ...extra,
  };
}

test("an ISRC that agrees is a perfect score and needs nothing else", () => {
  const scored = scoreCandidate(
    { artist: "anything at all", title: "nothing like it", isrc: "GBAYE0600301" },
    candidate({ isrc: "GB-AYE-06-00301", artist: "Wrong", title: "Wrong" })
  );
  assert.equal(scored.score, 1, "an ISRC identifies one recording; words cannot overrule it");
});

test("a duration that disagrees is refused outright", () => {
  const scored = scoreCandidate(
    { artist: "Nina Simone", title: "Feeling Good", durationMs: 175_000 },
    candidate({ durationMs: 640_000 })
  );
  assert.equal(scored.score, 0);
  assert.match(String(scored.rejected), /different recording/);
});

test("the right title under the wrong artist is a cover, and is refused", () => {
  const scored = scoreCandidate(
    { artist: "Nina Simone", title: "Feeling Good" },
    candidate({ artist: "Karaoke Hits Ensemble", durationMs: null })
  );
  assert.equal(scored.score, 0);
  assert.match(String(scored.rejected), /credited to/);
});

test("a remaster of the right recording still clears the bar", () => {
  const scored = scoreCandidate(
    { artist: "Chic", title: "I Want Your Love", durationMs: 415_000 },
    candidate({
      artist: "Chic",
      title: "I Want Your Love (2018 Remaster)",
      durationMs: 419_000,
    })
  );
  assert.ok(scored.score >= MATCH_THRESHOLD, `scored ${scored.score}`);
});

test("bestMatch takes the best candidate that clears the bar", () => {
  const match = bestMatch({ artist: "Chic", title: "Le Freak" }, [
    candidate({ externalId: "spotify:track:wrong", artist: "Chic", title: "Le Freak (Live at Wembley)", durationMs: null }),
    candidate({ externalId: "spotify:track:right", artist: "Chic", title: "Le Freak", durationMs: null }),
  ]);
  assert.equal(match?.candidate.externalId, "spotify:track:right");
});

test("bestMatch returns null rather than a near miss", () => {
  const match = bestMatch({ artist: "Nina Simone", title: "Feeling Good" }, [
    candidate({ artist: "Michael Bublé", title: "Feeling Good", durationMs: null }),
    candidate({ artist: "Nina Simone", title: "Sinnerman", durationMs: null }),
  ]);
  assert.equal(
    match,
    null,
    "an unresolved track is a question for a curator; a wrong track is a ruined moment"
  );
});

test("bestMatch on an empty catalogue is null, not a throw", () => {
  assert.equal(bestMatch({ artist: "a", title: "b" }, []), null);
});

/* ── shaping ───────────────────────────────────────────────────────── */

test("chunk splits at the boundary and keeps order", () => {
  assert.deepEqual(chunk([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]);
  assert.deepEqual(chunk([1, 2], 5), [[1, 2]]);
  assert.deepEqual(chunk([], 3), []);
  assert.equal(chunk(Array.from({ length: 250 }, (_, i) => i), 100).length, 3);
  assert.throws(() => chunk([1], 0), RangeError);
});

test("truncate cuts on a word boundary and never announces itself", () => {
  assert.equal(truncate("a short line", 40), "a short line");
  assert.equal(truncate("  collapses   whitespace  ", 40), "collapses whitespace");
  const cut = truncate("the house sleeps six and has slept nine", 20);
  assert.ok(cut.length <= 20);
  assert.ok(!cut.includes("…"), "no ellipsis: a truncated line should just end");
  assert.equal(cut, "the house sleeps six");
});
