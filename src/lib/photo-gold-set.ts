/**
 * THE THIRTY-PHOTOGRAPH BENCH, AND WHAT IT MEASURES.
 *
 * Founder's specification: ten evenings, ten places, ten traps — "a marble
 * lobby as `dress`, a toast as `spectacle`, an empty beach as 'she has a
 * beach'". Score schema validity separately from claim correctness, and add
 * the two a generic bench lacks: FALSE-POSITIVE RATE, the proposed cells a
 * reviewer would strike, and SILENCE PRECISION, the facets correctly left
 * empty.
 *
 * ══ WHAT IS HERE AND WHAT IS NOT ════════════════════════════════════
 *
 * HERE: the structure, the thirty slots, every trap's falsifiable half, and
 * the scorer. All of it runs today and all of it is tested.
 *
 * NOT HERE, AND IT CANNOT BE: the photographs, and the labels for the twenty
 * that are not traps. Nobody but the founder can say that THIS frame is
 * `size = one_table` — that judgement is the ground truth the bench exists to
 * measure against, and a machine writing it would be marking its own paper
 * with its own answers. docs/photo-gold-set.md is the sheet she fills in.
 *
 * THE TRAPS ARE THE EXCEPTION, and it is worth saying why they can be written
 * without the picture. A trap's label is not "what this frame states" — it is
 * "what this frame INVITES and must not produce", and that is a property of
 * the trap's design rather than of the photograph. The founder named three;
 * the other seven have their invitation written and their picture missing.
 *
 * ══ WHY FALSE POSITIVES AND SILENCE ARE THE TWO THAT MATTER ═════════
 *
 * A generic bench reports precision and recall over the cells it found, which
 * rewards a reader that guesses. This catalogue's whole failure mode is the
 * opposite one: a cell nobody stated, arriving with a plausible sentence
 * attached, accepted by a tired reviewer on a Tuesday. CLAUDE.md rule 3.
 *
 * So the two numbers that decide whether this feature is safe are:
 *
 *   FALSE-POSITIVE RATE — of everything proposed, what share would a reviewer
 *   strike? This is the number that has to be low. A reader at 0.9 recall and
 *   0.5 false positives is worse than useless, because it trains the desk to
 *   rubber-stamp.
 *
 *   SILENCE PRECISION — of the columns that should have been left empty, what
 *   share were? Its floor is the trap group, which is designed so that a
 *   reader reaching for the obvious answer scores zero.
 *
 * Recall is reported and is deliberately NOT the headline. A photograph that
 * states nothing is a correct answer, and a bench that punishes silence is a
 * bench that will be optimised into the exact behaviour this schema refuses.
 */

import {
  MATRIX_FACETS,
  PROPOSABLE_FACETS,
  type MatrixFacet,
  type PhotoExtract,
  type PhotoRole,
} from "./photo-extract.ts";

/* ══ 1 · WHAT ONE BENCH ENTRY IS ════════════════════════════════════ */

export const GOLD_GROUPS = ["evening", "place", "trap"] as const;
export type GoldGroup = (typeof GOLD_GROUPS)[number];

/** One expected cell. The founder writes these; nothing generates them. */
export type GoldCell = { facet: MatrixFacet; level: string };

export type GoldPhoto = {
  id: string;
  group: GoldGroup;
  /** The role the frame is presented under. Part of the case, not a guess. */
  role: PhotoRole;
  /**
   * What the picture must be, in words, so the founder can find or take one.
   * For a trap this is the whole design of the case.
   */
  brief: string;
  /**
   * WHAT THE FRAME INVITES AND MUST NOT PRODUCE.
   *
   * Writable without the photograph, because it is a property of the trap.
   * A proposal on any of these columns is a false positive by construction,
   * whatever level it carries.
   */
  mustNotPropose: readonly MatrixFacet[];
  /**
   * WHAT THE FRAME ACTUALLY STATES. The founder's, and empty until she says.
   * An entry with `labelled: false` is scored for schema validity and for its
   * `mustNotPropose` columns, and contributes nothing to precision or recall.
   */
  expected: readonly GoldCell[];
  /** True once a person has written `expected`. Never set by a script. */
  labelled: boolean;
  /** The file, under the folder the bench is pointed at. */
  file: string;
};

/* ══ 2 · THE THIRTY SLOTS ═══════════════════════════════════════════ */

function slot(
  id: string,
  group: GoldGroup,
  role: PhotoRole,
  brief: string,
  mustNotPropose: readonly MatrixFacet[] = []
): GoldPhoto {
  return {
    id,
    group,
    role,
    brief,
    mustNotPropose,
    expected: [],
    labelled: false,
    file: `${id}.jpg`,
  };
}

/**
 * TEN EVENINGS. Frames of a party happening, presented as taste.
 *
 * The briefs span the six proposable columns deliberately — two that state
 * `size` unambiguously, two that state `food`, and so on — so that a reader
 * that is good at one column and blind in another is visible in the per-facet
 * breakdown rather than averaged away.
 */
const EVENINGS: readonly GoldPhoto[] = [
  slot("evening-01", "evening", "evening_she_wants", "One long table, laid, mid-meal, everybody seated and in one conversation."),
  slot("evening-02", "evening", "evening_she_wants", "A room with forty people standing, drinks in hand, several conversations at once."),
  slot("evening-03", "evening", "evening_she_wants", "Four people at a small table, late, plates pushed away."),
  slot("evening-04", "evening", "evening_she_wants", "A kitchen mid-cook during the party — pans going, people in the room."),
  slot("evening-05", "evening", "evening_she_wants", "A table of shop-bought things arranged on platters, nothing cooked."),
  slot("evening-06", "evening", "evening_she_wants", "Black tie, obviously and uniformly, at a private party."),
  slot("evening-07", "evening", "evening_she_wants", "The same kind of party in jeans and shirtsleeves — nobody has dressed."),
  slot("evening-08", "evening", "evening_she_wants", "A band actually playing to a room that has turned to watch."),
  slot("evening-09", "evening", "evening_she_wants", "A printed running order pinned up where guests can read it."),
  slot("evening-10", "evening", "evening_she_wants", "A quiet room, three people, low light, nothing happening but talk."),
];

/**
 * TEN PLACES. Frames of a room somebody has, presented as her own.
 *
 * These are the only ten in the bench that may produce a venue cue, and that
 * is half of what they test: `mayPrune` must be true for all ten and false for
 * the other twenty, whatever is in the frame.
 */
const PLACES: readonly GoldPhoto[] = [
  slot("place-01", "place", "place_she_has", "Her own garden, open sky, grass, a table already out."),
  slot("place-02", "place", "place_she_has", "A city apartment living room, no outdoor space visible."),
  slot("place-03", "place", "place_she_has", "A domestic kitchen with a full oven and hob, hers."),
  slot("place-04", "place", "place_she_has", "A terrace with a built grill or fire pit, clearly usable."),
  slot("place-05", "place", "place_she_has", "A rented house's dining room, table for twelve."),
  slot("place-06", "place", "place_she_has", "A poolside, daytime, her own."),
  slot("place-07", "place", "place_she_has", "A narrow apartment kitchen — a hob and a sink, no room to put anything down."),
  slot("place-08", "place", "place_she_has", "A hotel suite sitting room."),
  slot("place-09", "place", "place_she_has", "A covered porch: outdoors, roofed, no sky directly above."),
  slot("place-10", "place", "place_she_has", "A basement or windowless room with no natural light."),
];

/**
 * TEN TRAPS. Frames designed to produce a cell that is not there.
 *
 * The first three are the founder's own. Every one of them has its invitation
 * written in `mustNotPropose`, which is what makes a trap scoreable before
 * anybody has labelled anything: the failure is proposing that column at all.
 */
const TRAPS: readonly GoldPhoto[] = [
  slot(
    "trap-01",
    "trap",
    "evening_she_wants",
    "A marble hotel lobby, empty, no party in it. HERS: the grandeur reads as " +
      "`dress = dressed`, and there is nobody in the frame to be dressed.",
    ["dress"]
  ),
  slot(
    "trap-02",
    "trap",
    "evening_she_wants",
    "One person standing with a raised glass at a table. HERS: a toast reads " +
      "as `spectacle = performed`. It is not — the facet's own note says a " +
      "room attending to one person it knows is CEREMONY, not spectacle.",
    ["spectacle"]
  ),
  slot(
    "trap-03",
    "trap",
    "evening_she_wants",
    "An empty beach, beautiful, nobody in it. HERS: it reads as 'she has a " +
      "beach'. It is a saved picture and states nothing about her place.",
    []
  ),
  slot(
    "trap-04",
    "trap",
    "evening_she_wants",
    "A restaurant dining room mid-service, waiters carrying plates. The staff " +
      "make it read as `food = cooked` at a party that is not hers.",
    ["food"]
  ),
  slot(
    "trap-05",
    "trap",
    "evening_she_wants",
    "A wedding, hundreds of guests. The scale reads as `size = crowd` for an " +
      "evening the member never described.",
    ["size"]
  ),
  slot(
    "trap-06",
    "trap",
    "evening_she_wants",
    "A dark bar at 2am with nobody in it. Reads as `starts = late` — a column " +
      "no photograph may propose, so any proposal is a fingerprint attempt.",
    []
  ),
  slot(
    "trap-07",
    "trap",
    "evening_she_wants",
    "A place setting with a name card at each seat. Reads as " +
      "`arrival = assigned`, which is one room alone.",
    []
  ),
  slot(
    "trap-08",
    "trap",
    "evening_she_wants",
    "A styled magazine shot of a table nobody has eaten at. Everything about " +
      "it is a proposition; nothing about it is an evening.",
    []
  ),
  slot(
    "trap-09",
    "trap",
    "evening_she_wants",
    "A close crop of a single dish. There is no room in the frame, so `volume`, " +
      "`size` and `dress` have nothing to stand on.",
    ["volume", "size", "dress"]
  ),
  slot(
    "trap-10",
    "trap",
    "object_to_find",
    "A single object on a plain ground — a lamp, a glass. It proposes no cell " +
      "at all; anything on any column is invented.",
    [...PROPOSABLE_FACETS]
  ),
];

/**
 * The bench.
 *
 * Thirty entries, ten of each group, exactly as specified. The count is
 * asserted in src/lib/photo-extract.test.ts rather than trusted, because a
 * bench that has quietly lost four cases still prints a percentage.
 */
export const GOLD_SET: readonly GoldPhoto[] = [...EVENINGS, ...PLACES, ...TRAPS];

/* ══ 3 · THE SCORE ══════════════════════════════════════════════════ */

export type Score = {
  /** How many cases were run. */
  cases: number;
  /** How many carry a founder's labels. The rest score only their traps. */
  labelled: number;

  /* ── schema validity, scored separately on purpose ──────────────── */

  /** Cases where a reading came back at all rather than a silence. */
  read: number;
  /** Cases that came back silent, with the reasons. */
  silences: readonly string[];
  /** Entries the parser threw away, across every case. Rule 24's count. */
  dropped: number;
  /** Drops that were an attempt on a column no photograph may propose. */
  fingerprintAttempts: number;
  /** Readings whose `mayPrune` disagreed with the case's role. Must be 0. */
  seamBreaches: number;

  /* ── claim correctness ──────────────────────────────────────────── */

  /** Proposed cells that the label agrees with. */
  hits: number;
  /** Labelled cells nobody proposed. Reported, never the headline. */
  misses: number;
  /**
   * FALSE POSITIVES: proposed cells a reviewer would strike. Every proposal on
   * a `mustNotPropose` column, plus every proposal on a labelled case that the
   * label does not carry.
   */
  falsePositives: number;
  /** Proposals counted for the rate below — labelled cases and traps only. */
  scoredProposals: number;

  /* ── silence ────────────────────────────────────────────────────── */

  /** Columns that should have been left empty, across every case. */
  shouldBeSilent: number;
  /** How many of those actually were. */
  wereSilent: number;
};

export type Rates = Score & {
  /** falsePositives / scoredProposals. The number that has to be low. */
  falsePositiveRate: number | null;
  /** wereSilent / shouldBeSilent. The number the trap group exists to hold up. */
  silencePrecision: number | null;
  /** hits / (hits + misses). Reported, and never the headline. */
  recall: number | null;
};

/**
 * Score one run.
 *
 * `results` pairs each case with what came back. A case with no result is
 * skipped rather than counted as a failure — an unlabelled photograph the
 * founder has not supplied yet is a gap in the bench, not a defect in the
 * reader, and reporting it as the latter is exactly the "report generated
 * from something other than reality" CLAUDE.md rule 20 names.
 */
export function score(
  results: readonly {
    photo: GoldPhoto;
    extract: PhotoExtract;
    /** What the parser threw away for this frame. Rule 24's count. */
    drops?: readonly { kind: string }[];
  }[]
): Rates {
  const s: Score = {
    cases: results.length,
    labelled: 0,
    read: 0,
    silences: [],
    dropped: 0,
    fingerprintAttempts: 0,
    seamBreaches: 0,
    hits: 0,
    misses: 0,
    falsePositives: 0,
    scoredProposals: 0,
    shouldBeSilent: 0,
    wereSilent: 0,
  };
  const silences: string[] = [];

  for (const { photo, extract, drops = [] } of results) {
    if (photo.labelled) s.labelled += 1;

    // SCHEMA VALIDITY, counted separately from claim correctness — the
    // founder's instruction. A reader returning well-formed rubbish and one
    // returning malformed truth are two problems with two fixes, and one
    // number covering both tells you to do neither.
    const schema = schemaScore(drops);
    s.dropped += schema.dropped;
    s.fingerprintAttempts += schema.fingerprintAttempts;

    if (extract.outcome === "silent") {
      silences.push(`${photo.id}: ${extract.silence ?? "no reason given"}`);
    } else {
      s.read += 1;
    }

    // THE SEAM, CHECKED ON EVERY CASE. `mayPrune` must be true for a
    // `place_she_has` frame and false for all twenty others, whatever the
    // picture shows. A breach here is not a scoring problem, it is a bug.
    const shouldPrune = photo.role === "place_she_has";
    if (extract.mayPrune !== shouldPrune) s.seamBreaches += 1;
    if (!shouldPrune && extract.venue.length > 0) s.seamBreaches += 1;

    const proposed = new Map<string, string>();
    for (const claim of extract.facets) proposed.set(claim.facet, claim.level);

    const expected = new Map<string, string>();
    for (const cell of photo.expected) expected.set(cell.facet, cell.level);

    // FALSE POSITIVES.
    for (const [facet, level] of proposed) {
      const invited = photo.mustNotPropose.includes(facet as MatrixFacet);
      if (invited) {
        s.falsePositives += 1;
        s.scoredProposals += 1;
        continue;
      }
      if (!photo.labelled) continue; // nothing to compare it to
      s.scoredProposals += 1;
      if (expected.get(facet) === level) s.hits += 1;
      else s.falsePositives += 1;
    }

    if (photo.labelled) {
      for (const [facet] of expected) {
        if (!proposed.has(facet)) s.misses += 1;
      }
    }

    // SILENCE. Every `mustNotPropose` column, plus — on a labelled case —
    // every proposable column the label does not carry.
    const silent = new Set<string>(photo.mustNotPropose);
    if (photo.labelled) {
      for (const facet of PROPOSABLE_FACETS) {
        if (!expected.has(facet)) silent.add(facet);
      }
    }
    for (const facet of silent) {
      s.shouldBeSilent += 1;
      if (!proposed.has(facet)) s.wereSilent += 1;
    }

  }

  return {
    ...s,
    silences,
    falsePositiveRate:
      s.scoredProposals === 0 ? null : s.falsePositives / s.scoredProposals,
    silencePrecision:
      s.shouldBeSilent === 0 ? null : s.wereSilent / s.shouldBeSilent,
    recall: s.hits + s.misses === 0 ? null : s.hits / (s.hits + s.misses),
  };
}

/**
 * The drop counts, off one frame's parse.
 *
 * `fingerprintAttempts` is the one to watch on a bench run. Zero is not
 * automatically good news — it can mean the traps are not trying — and any
 * number above zero is a reader reaching for a column no photograph may
 * propose, which is a fact about the prompt rather than about the picture.
 */
export function schemaScore(
  drops: readonly { kind: string }[]
): { dropped: number; fingerprintAttempts: number } {
  return {
    dropped: drops.length,
    fingerprintAttempts: drops.filter((drop) => drop.kind === "fingerprint")
      .length,
  };
}

/** Every column, for the per-facet breakdown the bench prints. */
export const BENCH_FACETS: readonly MatrixFacet[] = MATRIX_FACETS;
