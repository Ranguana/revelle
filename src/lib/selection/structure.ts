/**
 * THE STRUCTURAL MATRIX, ON THE APPLICANT'S SIDE.
 *
 * `data/destination-matrix.json` describes every destination as nine cells
 * about the EVENING — when it starts, who cooked, how it ends, how many. This
 * file is the other half of that comparison: it turns her answers into the same
 * vocabulary, and it holds the one thing the comparison is not free to be, which
 * is symmetric.
 *
 * ── WHAT THIS FILE IS FOR, AND WHAT IT IS NOT ────────────────────────
 *
 * It is the SUPPLY SIDE. Given her resolved answers it produces her structural
 * row, and given a destination's row it produces a distance. It does not decide
 * a shortlist, it does not know about voice, and it does not know what an
 * epsilon is. THE SEAM in src/lib/destinations.ts owns all three, and every one
 * of them is a decision this file would be the wrong place to make.
 *
 * ── THE SOCKET IS FILLED. WHAT FOLLOWS IS THE STATE IT WAS FILLED FROM ─
 *
 * `chooseDestinations` now calls `rankByStructure` at step 5½ and sorts the
 * voice survivors into bands of structural distance, the look breaking the
 * ties. The rows come out of `data/destination-matrix.json` through
 * src/lib/matrix.ts, which is the file's one owner; the epsilon is
 * `EngineOptions.structureEpsilon` and its arithmetic is beside it in types.ts;
 * the argument for bands rather than a blended term is in the header of
 * src/lib/selection/destination.ts. So a host's `how_it_ends` and `meal_time`
 * move a rank, which is the sentence this paragraph existed to be unable to
 * write.
 *
 * THE PARAGRAPH BELOW IS KEPT UNDER CLAUDE.md RULE 14 rather than deleted: it
 * is the diagnosis that produced the wiring, and the shape of the failure it
 * describes — an instrument that returns a number nobody reads — is worth more
 * than the fact that this instance of it is closed. Everything in it was true
 * as of db/037 and up to that call being added. The half that is STILL TRUE is
 * the aesthetic half: `facetOverlap(aesthetic, destination.facets)` remains 0
 * for every destination, because `world_facet` holds voice tones (plus
 * projections in two dimensions the vector excludes) and her aesthetic keys are
 * in none of them. That is a live defect with a fork in it — tag the rooms, or
 * stop putting those keys on her vector — and it is the founder's to pick.
 *
 * ── THE SOCKET WAS EMPTY. READ THIS BEFORE BELIEVING ANY CALLER ──────
 *
 * NOTHING IN src/ CALLS THIS YET, AND NOTHING IN src/ READS THE MATRIX. As of
 * db/037 the only reader of `data/destination-matrix.json` is
 * scripts/audit-matrix.mjs. At runtime `chooseDestinations()` in
 * src/lib/selection/destination.ts filters on tone and then ranks the survivors
 * with `facetOverlap(aesthetic, destination.facets)` — and `destination.facets`
 * comes from `world_facet`, into which scripts/seed-destinations.mjs writes
 * `voice_tone` rows and nothing else. The aesthetic half of the vector and the
 * tags on a destination therefore do not intersect, `facetOverlap` returns 0 for
 * every destination, and the structural half of the ranking is inert for
 * everybody. src/lib/destinations.ts said so in its own words before this file
 * existed: "the ranking stage is inert and there is an empty socket the matrix
 * happens to fit."
 *
 * SO THE HONEST STATEMENT OF WHAT db/037 SHIPPED: her answers about how the
 * evening ends and what hour it starts are RECORDED, correctly shaped, resolved
 * through the bridge, and available. They do not yet move a rank. That is not a
 * defect in this file and it is not something to paper over at the call site —
 * it is one wiring change, and it is deliberately not made here because it is
 * the change that makes the matrix live for the first time, and a matrix cell
 * reaching a member is founder-signed under CLAUDE.md rule 13.
 *
 * THE ONE CHANGE THAT WOULD FILL IT: a reader that lifts the rows out of
 * `data/destination-matrix.json` (or out of `world_facet`, once the cells are
 * seeded there) and a call to `rankByStructure` inside `chooseDestinations`,
 * between step 5's aesthetic score and step 6's dither. Everything else the
 * seam asks for — the survivor floor, the voice tiebreak, the epsilon — is
 * already specified there and still unmeasured.
 *
 * ── WHY THIS IS NOT IN table.ts ──────────────────────────────────────
 *
 * `statedEnding` and `statedStartHour` below are `statedMeal` and `statedSeason`
 * in every respect, and they are not in that file because that file is THE
 * COMPOSED TABLE: it is a set of judgements about food, and its three readers
 * ask what may sit on one table. A start hour that reaches the ranker and a
 * meal shape that reaches the dessert course are two resolutions of one answer,
 * and keeping them in separate files is what stops the second from quietly
 * acquiring an opinion about the first.
 */

import type { StatedFacet } from "./types.ts";

/**
 * The nine columns, IN THE ORDER THE MATRIX FILE DECLARES THEM.
 *
 * The order is load-bearing because a row in `data/destination-matrix.json` is
 * an array and not an object — the audit script reads cell `i` as facet `i`, and
 * `rowFromCells` below does the same. src/lib/selection/structure.test.ts asserts
 * this list against the file, so the two cannot drift without a red test.
 */
export const STRUCTURAL_FACETS = [
  "arrival",
  "schedule",
  "volume",
  "dress",
  "food",
  "ending",
  "starts",
  "size",
  "spectacle",
] as const;

export type StructuralFacet = (typeof STRUCTURAL_FACETS)[number];

/**
 * The declared levels per column.
 *
 * Mirrored here rather than imported from the JSON, for the reason src/lib/voice.ts
 * mirrors the facet vocabulary rather than reading it out of the database: this
 * module is bundled into the server and must not depend on a file path, and a
 * test that asserts agreement is a stronger guarantee than a runtime read
 * anyway — it fails on a tree, before a deploy, rather than in a request.
 *
 * `starts.late` IS DECLARED HERE AND CLAIMED BY NO DESTINATION. That is not an
 * oversight; see NEARNESS below and `facetNotes.starts` in the matrix.
 */
export const STRUCTURAL_LEVELS: Readonly<
  Record<StructuralFacet, readonly string[]>
> = {
  arrival: ["ceremony", "absorbed", "assigned"],
  schedule: ["posted", "anchored", "standing", "unplanned"],
  volume: ["overlapping", "one_conversation", "quiet"],
  dress: ["dressed", "plain"],
  food: ["bought", "cooked", "arrived"],
  ending: ["clean_stop", "dissolves", "until_morning"],
  starts: ["morning", "afternoon", "evening", "late"],
  size: ["few", "one_table", "crowd"],
  spectacle: ["performed", "nothing"],
};

/**
 * WHICH ANSWER SUPPLIES WHICH COLUMN — CLAUDE.md rule 15, as code.
 *
 * An entry is `{ field, dimension }` and it names one resolution of one answer
 * in `quiz_response_facet`. The resolved facet CODE is the level: the bridge
 * does the translation, in a row, the way db/026 put the month-to-season
 * calendar in rows rather than in a module. Nothing in this file knows that a
 * late supper starts late.
 *
 * `null` MEANS UNFED AND IS THE HONEST ANSWER FOR SEVEN OF THE NINE. The reason
 * for each is written out in `fedBy` in `data/destination-matrix.json`, which is
 * the document a curator reads; this list is the machine's copy of it and the
 * test asserts they agree. Two states are collapsed into `null` on purpose —
 * a column nothing supplies and a column supplied by a value identical for every
 * applicant are the same column as far as ranking is concerned, and the second
 * is the dangerous one because it looks fed.
 *
 * THE RANKER READS THIS AND NOTHING ELSE, which is what keeps the promise: the
 * number of columns the reveal ranks on cannot exceed the number a host has
 * actually filled in, because the only cells `statedStructure` can produce are
 * the ones with a supplier here.
 */
export const STRUCTURAL_SUPPLIERS: Readonly<
  Record<StructuralFacet, { field: string; dimension: string } | null>
> = {
  arrival: null,
  schedule: null,
  volume: null,
  dress: null,
  food: null,
  ending: { field: "how_it_ends", dimension: "evening_ending" },
  starts: { field: "meal_time", dimension: "evening_start" },
  /*
   * SIZE STAYS NULL, AND THE RULING IS WRITTEN HERE BECAUSE THIS IS THE ONE
   * LINE THAT WOULD UNDO IT.
   *
   * Founder, 2026-09-06, and she was repeating herself: "i dont want any
   * destination TO BE LIMITED BY GUEST COUNT - this is not the first time ive
   * said this."
   *
   * An audit of every consumer that day found the ruling already honoured for
   * destinations: no hard filter, no ranking penalty, no SQL predicate, and
   * `application.scale` is not even among the arguments `chooseDestinations`
   * receives. The `size` cell DESCRIBES a night and gates nothing — which is
   * consistent with her other ruling the same day, "if the weeknight is six
   * people, `few` is true." A cell may be true and still never narrow what a
   * host is offered.
   *
   * CHANGING THIS ONE `null` TO A SUPPLIER IS THE WHOLE AUDIT SURFACE. It is
   * the entire distance between "describes" and "limits": the moment `size`
   * has a supplier, `statedStructure` emits it, `structuralDistance` scores it,
   * and a host's headcount starts sorting rooms. Nothing else would have to
   * change and no test would go red on the intent — which is why the ruling is
   * recorded at the line rather than only in a document (rule 23: state the
   * fact at every place the wrong reading would be made).
   *
   * The obvious bridge is also wrong on its own terms, and `fedBy` in
   * data/destination-matrix.json already says so: `guest_count_band`'s
   * `from_13_to_20` straddles the 16 that divides `one_table` from `crowd`, so
   * wiring it is a judgement rather than a translation. But the reason it stays
   * null is her ruling, not the boundary.
   *
   * DO NOT "FINISH THE JOB" BY SYMMETRY (rule 32). Seven columns are unfed;
   * this is the one that may not be wired.
   */
  size: null,
  spectacle: null,
};

/** The columns a host can actually state today. Derived, never hand-listed. */
export const FED_FACETS: readonly StructuralFacet[] = STRUCTURAL_FACETS.filter(
  (facet) => STRUCTURAL_SUPPLIERS[facet] !== null
);

/** A destination's row, or a host's — the same shape, deliberately. */
export type StructuralRow = Partial<Record<StructuralFacet, string>>;

/**
 * A row out of `data/destination-matrix.json`'s array form.
 *
 * Cells are positional, so a row of the wrong length is a corrupt row rather
 * than a short one and is refused. The audit script makes the same check and
 * exits before quoting a distance, for the same reason: a missing cell shifts
 * every column after it and flatters every pair it touches.
 */
export function rowFromCells(cells: readonly string[]): StructuralRow {
  if (cells.length !== STRUCTURAL_FACETS.length) {
    throw new Error(
      `A matrix row has ${cells.length} cells and the matrix has ` +
        `${STRUCTURAL_FACETS.length} facets. Run npm run check:matrix.`
    );
  }
  const row: StructuralRow = {};
  STRUCTURAL_FACETS.forEach((facet, i) => {
    row[facet] = cells[i];
  });
  return row;
}

/**
 * HER `how_it_ends` ANSWER, AS A LEVEL — or null when she was not asked.
 *
 * `statedMeal`'s twin (src/lib/selection/table.ts), down to the dimension
 * filter, and for the same reason: the option code arrives through db/037's
 * bridge rather than out of a raw column somebody has to remember to cast. The
 * bridge is an identity here — the three option codes ARE the three levels — so
 * there is no translation to get wrong, which is why the identity is worth
 * having.
 *
 * NULL IS REACHABLE THREE WAYS AND MEANS ONE THING, exactly as it does for the
 * calendar: she applied before the question existed, a snapshot was built by
 * hand, or something upstream dropped the row. All three mean she has not said,
 * and `structuralDistance` scores an unstated column as nothing rather than as a
 * mismatch — CLAUDE.md rule 3, positive evidence only.
 */
export function statedEnding(
  stated: readonly { field: string; dimension: string; code: string }[]
): string | null {
  return statedLevel(stated, "ending");
}

/**
 * HER `meal_time` ANSWER, AS A START HOUR — or null when she has not said.
 *
 * The SAME answer `statedMeal` reads, resolved a second time. db/037 bridges the
 * four codes onto `evening_start` as well as onto `meal_shape`, so one tap says
 * both what the table is and what hour the evening begins, and neither reader
 * has to know about the other. The dimension filter is the whole safety
 * mechanism: drop it and this function returns `long_dinner`, which is not a
 * level of anything.
 */
export function statedStartHour(
  stated: readonly { field: string; dimension: string; code: string }[]
): string | null {
  return statedLevel(stated, "starts");
}

/**
 * Her whole structural row, as far as she has stated it.
 *
 * Only the fed columns can appear, and only with a DECLARED level. An answer
 * that resolves to a code the matrix does not know is dropped rather than
 * carried: an undeclared level is a bridge row and a level list disagreeing,
 * which is a bug to fix, and carrying it would silently add a full mismatch to
 * every destination and look like a preference.
 */
export function statedStructure(
  stated: readonly { field: string; dimension: string; code: string }[]
): StructuralRow {
  const row: StructuralRow = {};
  for (const facet of FED_FACETS) {
    const level = statedLevel(stated, facet);
    if (level !== null) row[facet] = level;
  }
  return row;
}

function statedLevel(
  stated: readonly { field: string; dimension: string; code: string }[],
  facet: StructuralFacet
): string | null {
  const supplier = STRUCTURAL_SUPPLIERS[facet];
  if (!supplier) return null;
  const answer = stated.find(
    (entry) =>
      entry.field === supplier.field && entry.dimension === supplier.dimension
  );
  if (!answer) return null;
  return STRUCTURAL_LEVELS[facet].includes(answer.code) ? answer.code : null;
}

/**
 * A FULL MISMATCH, AND A NEAR ONE.
 *
 * The matrix's own distance is Hamming — a cell either agrees or it does not,
 * and `npm run check:matrix` counts it that way over eighteen rows. That is
 * right for measuring whether two ROOMS are far enough apart, and it is the
 * number the gate of 3 is expressed in. Nothing below changes it.
 *
 * A HOST AGAINST A ROOM IS A DIFFERENT COMPARISON and it has one place where
 * all-or-nothing is wrong. See NEARNESS.
 */
const FULL = 1;
const NEAR = 0.25;

/**
 * NEARNESS — AND THE TABLE IS ASYMMETRIC ON PURPOSE.
 *
 * READ THIS BEFORE ASSUMING IT IS SYMMETRIC, because every other distance in
 * this codebase is and a future reader will assume this one is too.
 *
 * The keys are HER levels. The values are ROW levels. `late` appears as a key
 * and can never appear as a value, because no destination is authored as
 * beginning at midnight and none should be moved to that cell to populate a
 * level (see `facetNotes.starts`). So the pair (`late`, `evening`) is a real
 * comparison and the pair (`evening`, `late`) is unreachable, and writing the
 * table as if both existed would invite somebody to "fix" the missing half.
 *
 * WHY `late` EXISTS AT ALL. db/037 ungated the hour question and reworded it off
 * "meal", and one of its four answers is a late supper. Morning, afternoon and
 * evening had nowhere to put that, so a host naming one in the morning was
 * either forced onto `evening` — which is a lie about the hour, and the
 * DEFAULT-ONLY failure rule 15 names — or dropped. She gets to say it.
 *
 * WHY IT COSTS A QUARTER AGAINST `evening` AND NOT NOTHING. An eleven o'clock
 * start and a seven o'clock start are not the same evening, and a room authored
 * for the second should not score as though it were authored for the first. A
 * quarter is a nudge: four near misses cost what one real mismatch costs, so
 * nearness can order two rooms that are otherwise tied and cannot overturn a
 * column she actually agreed with.
 *
 * AND WHY `starts` IS NOT WHERE LATE NIGHTS LIVE. The rooms that ARE late-night
 * are not captured by this facet — they are captured by `ending = until_morning`,
 * and that is a question she is now asked in the founder's own words: "if it
 * ends before very late, something went wrong" IS the late-night host's answer.
 * So her one o'clock supper reaches Havana, New Orleans, Las Vegas, St. Moritz
 * and Acapulco through `ending` doing its own job, and `starts` merely stops
 * lying by omission about the hour she named. The two facets divide the work:
 * `starts` records when it BEGINS, `ending` records WHAT KIND OF NIGHT it is.
 * That division is the reason `starts` does not need late-night rows, and it is
 * the reason the bonus below is small rather than decisive.
 */
const NEARNESS: Readonly<
  Partial<Record<StructuralFacet, Readonly<Record<string, readonly string[]>>>>
> = {
  starts: { late: ["evening"] },
};

/**
 * WHAT ONE COLUMN COSTS — and the one place a column reads another.
 *
 * `theirRow` is passed in because the late-night case is genuinely a two-cell
 * fact and pretending otherwise would put it somewhere worse. A host who says
 * her party starts late and ends at dawn has stated one coherent thing twice,
 * and against a room that also runs until morning the quarter she pays for not
 * being an evening room is exactly the wrong charge. So the bonus CANCELS that
 * residual and stops:
 *
 *   0.25   `late` against an `evening` room
 *   0.00   `late` against an `evening` room whose `ending` is `until_morning`
 *
 * It is written as a cancellation rather than as a negative term so a cell can
 * never cost less than nothing. A bonus that could go below zero would let one
 * agreement pay for a disagreement elsewhere, which is the averaging THE SEAM
 * forbids, arriving one layer down and out of sight.
 */
function cellCost(
  facet: StructuralFacet,
  hers: string,
  theirs: string | undefined,
  theirRow: StructuralRow
): number {
  // A room with no cell in this column makes no claim, and nothing may be
  // charged against a claim nobody made.
  if (theirs === undefined) return 0;
  if (hers === theirs) return 0;

  const near = NEARNESS[facet]?.[hers]?.includes(theirs) ?? false;
  if (!near) return FULL;

  if (facet === "starts" && hers === "late" && theirRow.ending === "until_morning") {
    return 0;
  }
  return NEAR;
}

/**
 * HOW FAR THIS ROOM IS FROM THE EVENING SHE DESCRIBED.
 *
 * Summed over the columns SHE STATED and no others. A column she was never
 * asked about contributes nothing — not a half, not an average, nothing — which
 * is rule 3 in arithmetic: a cell she did not fill in is silence, and silence
 * is not evidence against any room.
 *
 * The consequence is that the scale of this number depends on how many columns
 * are fed, and that is correct rather than awkward. Two rooms are compared
 * against each other over the same set of her answers, so the comparison is
 * sound at any width; and the day another facet gets a supplier, every distance
 * widens together. Nothing here needs to be renormalised for that, and nothing
 * here should be — a normalised score would hide the width, and the width is
 * exactly the thing rule 15 wants visible.
 */
export function structuralDistance(
  hers: StructuralRow,
  theirs: StructuralRow
): number {
  let total = 0;
  for (const facet of STRUCTURAL_FACETS) {
    const mine = hers[facet];
    if (mine === undefined) continue;
    total += cellCost(facet, mine, theirs[facet], theirs);
  }
  return total;
}

/**
 * The rooms, nearest first.
 *
 * Ties are left in the order they arrived rather than broken here. THE SEAM is
 * explicit that a structural tie is voice's to settle and that the two are never
 * averaged, so inventing a tiebreak in this file would be deciding a question
 * that has an answer somewhere else. `Array.prototype.sort` is stable in every
 * runtime this ships on, so "the order they arrived" is a promise and not an
 * accident.
 *
 * Returns the distance beside the slug, because a caller that cannot see the
 * margin cannot tell a verdict from a coin flip — which is the whole reason the
 * epsilon exists and is still unset.
 */
export function rankByStructure(
  hers: StructuralRow,
  rooms: Readonly<Record<string, StructuralRow>>
): { slug: string; distance: number }[] {
  return Object.entries(rooms)
    .map(([slug, row]) => ({ slug, distance: structuralDistance(hers, row) }))
    .sort((a, b) => a.distance - b.distance);
}

/**
 * Her row out of the answers the engine already loads, in one call.
 *
 * Takes `StatedFacet[]` — what `loadSelectionInput` produces — so a caller does
 * not have to know that only three of its seven properties matter here.
 */
export function structureOf(stated: readonly StatedFacet[]): StructuralRow {
  return statedStructure(stated);
}
