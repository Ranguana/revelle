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
  type TableCueCode,
} from "./photo-extract.ts";

/* ══ 1 · WHAT ONE BENCH ENTRY IS ════════════════════════════════════ */

/**
 * THE THREE GROUPS — redesigned 2026-09-08, before she shot anything.
 *
 * They were `evening` / `place` / `trap`, which was the right bench for the
 * aim the photograph tool used to have: proposing matrix cells. Founder:
 * *"Put the photo tool on tables and palettes, not on proving `clean_stop`
 * from an empty glass count."* So the bench follows the aim.
 *
 * THE TIMING IS THE WHOLE REASON THIS IS CHEAP. She has not taken the thirty
 * photographs. A brief rewritten today costs a paragraph; ten `evening-*`
 * frames shot against the old briefs and then found to be the wrong evidence
 * costs her a day and cannot be undone by any amount of code.
 *
 * `trap` survives by name and nearly by content — see TRAPS below.
 */
export const GOLD_GROUPS = ["palette", "table", "trap"] as const;
export type GoldGroup = (typeof GOLD_GROUPS)[number];

/** One expected cell. The founder writes these; nothing generates them. */
export type GoldCell = { facet: MatrixFacet; level: string };

/**
 * WHICH PAYLOAD A CASE IS ABOUT — and, for a trap, which must come back empty.
 *
 * A trap's whole design is that a frame INVITES a reading it must not give,
 * and under the old aim the only thing a frame could wrongly give was a matrix
 * cell (`mustNotPropose`). Now there are five ways to over-read a picture, and
 * the traps have to be able to name any of them: a black-and-white photograph
 * invites a palette, a restaurant invites a table, a saved beach invites a
 * venue cue.
 */
export const PAYLOADS = ["facets", "venue", "tone", "table", "palette"] as const;
export type Payload = (typeof PAYLOADS)[number];

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
   * PAYLOADS THAT MUST COME BACK EMPTY on this frame.
   *
   * Writable without the photograph, like `mustNotPropose`, because it is a
   * property of the case rather than of the picture. This is what makes a trap
   * scoreable before anybody has labelled anything.
   */
  mustBeSilentOn: readonly Payload[];
  /**
   * WHAT THE FRAME STATES ABOUT THE TABLE. The founder's, and empty until she
   * says — the same rule as `expected`.
   *
   * NOTE THAT THE PALETTE GROUP HAS NO EQUIVALENT AND NEEDS NONE. A palette
   * reading is DETERMINISTIC: `palette()` counts the same pixels the same way
   * every run, and `paletteFrom` selects against fixed contrast floors. So a
   * palette case is scored on properties that need no ground truth — did it
   * propose only counted colours, does every proposed token clear its floor,
   * does the ground collide with a room we already have. Twenty of thirty
   * cases used to need her judgement before they measured anything; ten do
   * now, and they are these.
   */
  expectedTable: readonly TableCueCode[];
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
  over: {
    mustNotPropose?: readonly MatrixFacet[];
    mustBeSilentOn?: readonly Payload[];
  } = {}
): GoldPhoto {
  return {
    id,
    group,
    role,
    brief,
    mustNotPropose: over.mustNotPropose ?? [],
    mustBeSilentOn: over.mustBeSilentOn ?? [],
    expected: [],
    expectedTable: [],
    labelled: false,
    file: `${id}.jpg`,
  };
}

/**
 * TEN PALETTES. Frames chosen for the colour that can be counted out of them.
 *
 * ── WHAT THESE TEST, AND WHY THEY NEED NO LABELS ─────────────────────
 *
 * `palette()` counts pixels; `paletteFrom` selects a ground, an ink and three
 * accents against fixed contrast floors. Both are deterministic, so a palette
 * case is scoreable the day the photograph exists, with no judgement from
 * anybody:
 *
 *   · every proposed value was one of the counted colours — nothing invented;
 *   · every proposed token clears its floor against the proposed ground;
 *   · the proposed ground does not collide with a room already in the registry;
 *   · a frame that supplies no ink proposes no ink.
 *
 * THE BRIEFS SPAN THE WAYS A FRAME CAN BE HARD, not the ways it can be pretty.
 * Two are deliberately near-monochrome and are EXPECTED to supply a ground and
 * little else — a reader that returns six confident tokens off frame 05 is
 * inventing, and that is the finding.
 */
const PALETTES: readonly GoldPhoto[] = [
  slot("palette-01", "palette", "evening_she_wants", "A room after dark lit only by candles: a near-black ground with warm highlights on faces and glass."),
  slot("palette-02", "palette", "evening_she_wants", "Late afternoon sun raking across a plain painted wall — one dominant warm ground, one hard shadow."),
  slot("palette-03", "palette", "evening_she_wants", "A table under flat overcast daylight. Cool, low contrast, nothing saturated."),
  slot("palette-04", "palette", "evening_she_wants", "A dark green painted room with brass and warm lamplight."),
  slot("palette-05", "palette", "evening_she_wants", "A whitewashed room in bright sun, near-monochrome. It supplies a ground and very little else, and that is the correct reading."),
  slot("palette-06", "palette", "evening_she_wants", "A red-walled room after dark, one lamp on."),
  slot("palette-07", "palette", "evening_she_wants", "A pool at midday: saturated blue, white stone, hard light."),
  slot("palette-08", "palette", "evening_she_wants", "A wood-panelled room, one lamp, everything else in shadow."),
  slot("palette-09", "palette", "evening_she_wants", "A terrace at blue hour, the windows going blue and the lamps just on."),
  slot("palette-10", "palette", "evening_she_wants", "A neutral kitchen where all the colour is in the objects, not the room. The ground is grey and the accents are real."),
];

/**
 * TEN TABLES. Frames of a table laid, spanning the three axes.
 *
 * These are the ten that need her: `expectedTable` is the founder's list of
 * which cues the frame actually states, and every cue she does not list is a
 * cue the reading must be SILENT on. Listing fewer is the stricter test, the
 * same way it was for cells.
 *
 * The briefs cover all twelve terms of `TABLE_CUES` at least once, so a reader
 * blind to one axis — good at cloth, blind to what is in the vase — shows up
 * in the per-case breakdown rather than being averaged away.
 *
 * ── FIVE ARE HER OWN TABLE AND FIVE ARE A TABLE SHE LIKES ────────────
 *
 * AND THAT IS WHAT KEEPS THE SEAM BENCHED. `mayPrune` is true for
 * `place_she_has` and false for everything else, and it is the one property in
 * this feature that is a seam rather than a score — a saved terrace must never
 * become evidence about the room she actually has. The old bench tested it
 * with a whole group of ten; the redirect nearly deleted it by accident,
 * because a palette is a palette whoever's room it is.
 *
 * A table is where the distinction is real: HER table in HER room may say what
 * that room can do, and a table off the internet may not, while both are
 * perfectly good evidence about cloth and dishes. So the split lives here.
 */
const TABLES: readonly GoldPhoto[] = [
  slot("table-01", "table", "place_she_has", "Bare wood, the everyday plates, branches cut that morning lying along the middle."),
  slot("table-02", "table", "place_she_has", "Printed oilcloth, dishes that do not match and never have, a bowl of fruit left out."),
  slot("table-03", "table", "place_she_has", "A white cloth to the floor, matched service, flowers properly arranged."),
  slot("table-04", "table", "place_she_has", "The good embroidered cloth, the good dishes out for this, nothing else on it."),
  slot("table-05", "table", "place_she_has", "Stems dropped straight into a jug of water, not arranged, on bare wood."),
  slot("table-06", "table", "evening_she_wants", "A table mid-meal: everyday dishes in use, cloth rucked, nothing growing on it."),
  slot("table-07", "table", "evening_she_wants", "A long table outdoors on bare boards, matched everyday plates down both sides."),
  slot("table-08", "table", "evening_she_wants", "A cloth, mismatched inherited china, a single cut branch."),
  slot("table-09", "table", "evening_she_wants", "Bare wood with nothing on it but fruit — no cloth, no flowers, no service laid."),
  slot("table-10", "table", "evening_she_wants", "A close crop of one corner: the cloth is legible and nothing else in the frame is."),
];

/**
 * TEN TRAPS. Frames designed to produce a reading that is not there.
 *
 * ── THE FIRST THREE ARE THE FOUNDER'S AND THEY SURVIVED THE REDIRECT ──
 *
 * That is worth saying plainly, because it is evidence the traps were built on
 * something more durable than the old aim. `trap-01`'s empty marble lobby and
 * `trap-03`'s empty beach were written as arguments AGAINST STRUCTURAL
 * INFERENCE — against reading an evening out of a frame that contains no
 * evening — and every word of that argument holds against over-reading a
 * palette or a table. Only what they must be silent ON has changed.
 *
 * The new ones are the ways the new aim can be over-read: a photograph whose
 * colour is the filter's rather than the room's, a table that is not hers, a
 * frame with several palettes in it.
 */
const TRAPS: readonly GoldPhoto[] = [
  slot(
    "trap-01",
    "trap",
    "evening_she_wants",
    "A marble hotel lobby, empty, no party in it. HERS. It reads as grandeur, " +
      "and there is nobody in the frame and nothing laid — so it states no " +
      "table, whatever it states about colour.",
    { mustNotPropose: ["dress"], mustBeSilentOn: ["table", "facets"] }
  ),
  slot(
    "trap-02",
    "trap",
    "evening_she_wants",
    "One person standing with a raised glass at a table. HERS. A toast reads " +
      "as spectacle and is not — a room attending to one person it knows is " +
      "ceremony. The table under it is real and may be read.",
    { mustNotPropose: ["spectacle"], mustBeSilentOn: ["facets"] }
  ),
  slot(
    "trap-03",
    "trap",
    "evening_she_wants",
    "An empty beach, beautiful, nobody in it. HERS. It reads as 'she has a " +
      "beach'. It is a saved picture: it states a palette and nothing else.",
    { mustBeSilentOn: ["venue", "table", "facets"] }
  ),
  slot(
    "trap-04",
    "trap",
    "evening_she_wants",
    "A restaurant dining room mid-service, waiters carrying plates. The tables " +
      "are laid and none of them is hers — the frame invites a table reading " +
      "for a room the member does not have.",
    { mustNotPropose: ["food"], mustBeSilentOn: ["venue", "facets"] }
  ),
  slot(
    "trap-05",
    "trap",
    "evening_she_wants",
    "A BLACK-AND-WHITE photograph of a laid table. There is no colour in it to " +
      "count, so it states a table and NO PALETTE. A reader that returns a " +
      "ground here has invented one, which is the exact failure counting was " +
      "chosen to prevent.",
    { mustBeSilentOn: ["palette", "facets"] }
  ),
  slot(
    "trap-06",
    "trap",
    "evening_she_wants",
    "A heavily filtered image — a strong colour cast over the whole frame. The " +
      "palette that can be counted is the FILTER'S, not the room's, and a " +
      "ground taken off it would put a filter in the registry.",
    { mustBeSilentOn: ["palette", "facets"] }
  ),
  slot(
    "trap-07",
    "trap",
    "evening_she_wants",
    "A screenshot of a grid of saved pictures — several rooms, several " +
      "palettes, one frame. There is no single palette to count and no table " +
      "to read.",
    { mustBeSilentOn: ["palette", "table", "facets"] }
  ),
  slot(
    "trap-08",
    "trap",
    "evening_she_wants",
    "A styled magazine shot of a table nobody has eaten at. Everything about " +
      "it is a proposition. The table is legible; the evening is not.",
    { mustBeSilentOn: ["facets"] }
  ),
  slot(
    "trap-09",
    "trap",
    "evening_she_wants",
    "A close crop of a single dish. There is no room and no table surface in " +
      "the frame, so the cloth, the service and the flowers have nothing to " +
      "stand on.",
    {
      mustNotPropose: ["volume", "size", "dress"],
      mustBeSilentOn: ["table", "facets"],
    }
  ),
  slot(
    "trap-10",
    "trap",
    "object_to_find",
    "A single object on a plain seamless ground — a lamp, a glass. It is an " +
      "object and nothing else: no room, no table, and a 'palette' that is " +
      "the photographer's backdrop.",
    { mustNotPropose: [...PROPOSABLE_FACETS], mustBeSilentOn: ["palette", "table", "facets"] }
  ),
];

export const GOLD_SET: readonly GoldPhoto[] = [...PALETTES, ...TABLES, ...TRAPS];

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
