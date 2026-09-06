/**
 * READING A MEMBER'S PHOTOGRAPH INTO THE HOUSE'S OWN VOCABULARY.
 *
 * Founder, 2026-09-05: "A member is saying: this light, this table, this era,
 * not that one. Your job is to read the photo, map it onto the house, and put
 * the original away." And: "Do not store 'similar Pinterest pins.' Store the
 * attributes."
 *
 * So this file is the vocabulary and the rules. It is the whole specification
 * of what may be read out of a picture, what may never be, and what happens
 * when the reading fails. No SQL, no React, no `server-only`, no `@/` — the
 * same discipline as src/lib/desk/images.ts and for the same reason: the model
 * call (src/lib/photo-read.ts), the desk (src/app/desk/(signed-in)/photos),
 * the member's own screen (src/app/apply/photos) and the bench
 * (scripts/photo-bench.mjs) must all be reading ONE copy of these rules.
 *
 * ══ THE FOUR THINGS THAT ARE STRUCTURAL, NOT DOCUMENTED ═════════════
 *
 * Each of these is written as something the model CANNOT DO rather than
 * something it is asked not to do, because a rule in a prompt is a request and
 * a rule in a schema is a wall.
 *
 * 1 · THERE IS NO DESTINATION FIELD. Not a slug, not a name, not an id, and
 *     NOT A NULLABLE ONE. Founder: "Do not add `destination: string | null`.
 *     A nullable slug is an invitation." The tool schema below has no such
 *     property, `PhotoExtract` has no such member, and db/064 gives the claim
 *     table no such column. A photograph proposes CELLS. Which room those
 *     cells reach is the ranker's business and the founder's, and it happens
 *     at a different desk on a different day.
 *
 * 2 · `arrival`, `ending` and `starts` ARE NOT IN THE ENUM. Founder: "If the
 *     model cannot put it in the tool, it cannot propose it." Three separate
 *     arguments, one mechanism:
 *
 *       `arrival` is a FINGERPRINT facet — `assigned` is Catskills alone
 *       (see fedBy in data/destination-matrix.json), so one tap would name a
 *       room. It is never wired from photographs.
 *
 *       `ending` and `starts` are ALREADY FED, by `how_it_ends` and
 *       `meal_time`. A photograph may not override a quiz answer. She said
 *       what hour it starts; a picture of a dark terrace does not get to
 *       argue with her.
 *
 *     `mayPropose` below is the one owner of that list, and PROPOSABLE_FACETS
 *     is derived from it — so the tool schema, the post-parse drop and db/064's
 *     CHECK constraint are three consumers of one fact rather than three
 *     hand-written lists (rule 21, rule 19).
 *
 * 3 · `schedule` IS IN THE ENUM AND SHOULD ALMOST NEVER FIRE. Founder: "A veto
 *     is not a cell." The nearest quiz answer is `anti_preferences/schedule`,
 *     which says one level is unwanted and cannot say which of the other three
 *     the evening is. A photograph showing a printed running order is real
 *     evidence for `posted`; nothing else in a frame states this column, and
 *     the bench (docs/photo-gold-set.md) counts a schedule proposal as a
 *     false positive unless the frame carries the paper.
 *
 * 4 · `mayPrune` IS SET BY CODE FROM `role`, NEVER BY THE MODEL. Founder:
 *     "That flag is the whole seam." Only `place_she_has` can light it — a
 *     Pinterest terrace does not prune. It is absent from the tool schema, it
 *     is computed by `mayPrune()` below, and db/064 carries
 *     `check (may_prune = false or role = 'place_she_has')` so the flag cannot
 *     be true on a row that does not deserve it even if some future writer
 *     forgets to call this function.
 *
 * ══ EMPTY IS LEGAL AND IS THE POINT ═════════════════════════════════
 *
 * `facets` has `minItems: 0`. Founder: "If every facet is required, the model
 * will invent cells to fill the object." There is no `"unknown"` level and
 * there will not be one — "that becomes a cell someone will one day feed."
 * A photograph that states nothing about the evening is a photograph that
 * states nothing about the evening, and that is a correct reading.
 *
 * ══ ON FAILURE, THE PHOTOGRAPH IS SILENT FOR FACETS ═════════════════
 *
 * Founder: "Do not retry with a looser prompt. A retry that 'just works' is
 * how `assigned` appears." A malformed reply, a refusal, a network failure —
 * all three produce a `silent` extract carrying the reason, and nothing else.
 * `readingFrom` in src/lib/desk/images.ts retries because a mood-board
 * reading is a proposal into a pool; this is a claim about a member's evening
 * and the trade runs the other way.
 *
 * ══ THE PALETTE IS COUNTED, NOT ASKED ═══════════════════════════════
 *
 * Founder: "VLMs invent #C4A574. Count pixels." The palette is computed from
 * the bytes in src/lib/photo-store.ts and never appears in the tool schema.
 * A model asked for a hex code will produce a plausible one; a plausible hex
 * code is a lie with six digits of precision.
 */

import MATRIX from "../../data/destination-matrix.json" with { type: "json" };

/* ══ 1 · WHAT VERSION OF THIS READING A ROW HOLDS ═════════════════════ */

/**
 * Bumped whenever the vocabulary, the prompt or the guards below change in a
 * way that makes an old extract mean something different.
 *
 * Recorded on every extract row so that a claim accepted in September can be
 * told apart from one accepted after the rules moved — rule 17's shape from
 * the other end: a status without its reason is an adjudication with the
 * opinion torn off, and a claim without its version is a reading whose rules
 * cannot be recovered.
 */
export const PHOTO_EXTRACT_VERSION = "photo-extract-1";

/**
 * How many photographs one application may carry.
 *
 * The founder's number. Enforced structurally in db/064 as
 * `check (ordinal between 1 and 7)` rather than by a count in application
 * code, because a cap that lives in a `select count(*)` loses every race.
 */
export const MAX_PHOTOS = 7;

/**
 * Longest edge of the copy that is stored and read, in pixels.
 *
 * Deliberately NOT src/lib/desk/images.ts's LONG_EDGE (1600), and this is not
 * an oversight to tidy up later. That number is for a reference bank two
 * curators browse at full size; this one is for a frame a model reads and a
 * member glances at on her phone. They are two decisions about two things and
 * a shared constant would make the next change to either one a change to
 * both. 1280 is what the founder specified.
 */
export const PHOTO_LONG_EDGE = 1280;

/** Longest edge of the card copy. Same argument, smaller number. */
export const PHOTO_THUMB_EDGE = 480;

/* ══ 2 · WHAT A PHOTOGRAPH IS FOR ════════════════════════════════════ */

/**
 * The three things a member can mean by attaching a picture.
 *
 * They are not three flavours of the same act. `place_she_has` is EVIDENCE
 * ABOUT HER ROOM and is the only one that may touch feasibility;
 * `evening_she_wants` is TASTE and may only propose cells; `object_to_find` is
 * a thing she would like to end up with and proposes nothing at all.
 *
 * Nullable in the database on purpose. A photograph whose role nobody has
 * stated is a photograph whose role nobody has stated — it is not
 * `evening_she_wants` by default, because defaulting to a role is inventing
 * the member's meaning, and the role it would default to is the one that
 * feeds the matrix.
 */
export const PHOTO_ROLES = [
  "place_she_has",
  "evening_she_wants",
  "object_to_find",
] as const;
export type PhotoRole = (typeof PHOTO_ROLES)[number];

/** What the member is told each role means. Her words, not the code's. */
export const ROLE_SAID: Readonly<Record<PhotoRole, string>> = {
  place_she_has: "This is where it happens",
  evening_she_wants: "This is the night I have in mind",
  object_to_find: "I would like something like this",
};

export function isPhotoRole(value: unknown): value is PhotoRole {
  return (
    typeof value === "string" && (PHOTO_ROLES as readonly string[]).includes(value)
  );
}

/**
 * MAY THIS PHOTOGRAPH PRUNE THE POOL?
 *
 * The whole seam, in one function. Only a picture of the place she actually
 * has may eliminate what cannot physically happen there (CLAUDE.md rule 2's
 * constraint door). A saved terrace off the internet is taste, and taste never
 * reaches feasibility.
 *
 * A null role returns false. Unstated is not a claim.
 */
export function mayPrune(role: PhotoRole | null | undefined): boolean {
  return role === "place_she_has";
}

/* ══ 3 · THE MATRIX, AS THE ONE PLACE IT IS WRITTEN DOWN ═════════════ */

/**
 * The nine columns and their levels, READ from the matrix rather than copied
 * beside it.
 *
 * The founder's instruction was "MATRIX_LEVELS copied from
 * data/destination-matrix.json — do not invent a tenth". Deriving is the
 * stronger form of the same instruction and the one rule 21 asks for: a tenth
 * facet cannot be invented here because there is nowhere to write it, and a
 * level this file did not get from the matrix cannot exist. src/lib/matrix.ts
 * reads the same file the same way and is the audit side of the same fact.
 */
export const MATRIX_LEVELS = MATRIX.facets as Readonly<
  Record<string, readonly string[]>
>;

/** The nine column names, as a type, straight off the matrix. */
export type MatrixFacet = keyof typeof MATRIX.facets;

/** The nine, in the matrix's own order. */
export const MATRIX_FACETS = Object.keys(MATRIX_LEVELS) as readonly MatrixFacet[];

/**
 * THE THREE A PHOTOGRAPH MAY NEVER PROPOSE, AND WHY EACH ONE IS HERE.
 *
 * Kept as a map rather than a list so the reason travels with the name. The
 * desk renders these sentences when somebody asks why a column is missing from
 * the review screen, which is the only way a rule like this survives a year.
 */
export const NEVER_FROM_A_PHOTO: Readonly<Partial<Record<MatrixFacet, string>>> = {
  arrival:
    "A fingerprint column. `assigned` is one room alone, so a single tap " +
    "would name a destination. Wiring it needs a scene question, not a " +
    "picture.",
  ending:
    "Already fed, by `how_it_ends`. She said how the night ends; a " +
    "photograph does not get to overrule her.",
  starts:
    "Already fed, by `meal_time`. She said what hour it starts; a dark " +
    "terrace is not an argument.",
};

/**
 * May a photograph propose this column at all?
 *
 * THE ONE OWNER. The tool schema's enum, the post-parse drop and db/064's
 * CHECK constraint are all consumers of this function — three surfaces that
 * must agree, computing nothing of their own (rule 21). src/lib/
 * photo-extract.test.ts drives the migration's list and this function's list
 * from opposite ends and compares them, because a test that calls the shared
 * function twice cannot fail.
 */
export function mayPropose(facet: string): facet is MatrixFacet {
  if (!(facet in MATRIX_LEVELS)) return false;
  return !(facet in NEVER_FROM_A_PHOTO);
}

/** The six columns a photograph may speak to. Derived, never typed out. */
export const PROPOSABLE_FACETS: readonly MatrixFacet[] =
  MATRIX_FACETS.filter(mayPropose);

/**
 * Every level of every proposable column, flattened.
 *
 * This is what goes in the tool schema's `level` enum, and it is worth saying
 * plainly what that does and does not buy. It stops `dressed` being spelled
 * `dressy` and it stops a level of `arrival` appearing at all. It does NOT
 * stop the model pairing `dress` with `crowd`, because a flat enum cannot
 * express the pairing.
 *
 * The founder asked for "enums rather than strings for facet and level", and
 * this is that. The pairing is closed one step later, by `isLevelOf` below,
 * which every parse runs — the defence-in-depth she asked for. A per-facet
 * `anyOf` would state the pairing in the schema itself; it is not used because
 * a tool schema this house cannot reason about at a glance is worth less than
 * a flat one plus a check that cannot be skipped. Written down because the
 * next reader will otherwise wonder whether it was considered.
 */
export const PROPOSABLE_LEVELS: readonly string[] = [
  ...new Set(PROPOSABLE_FACETS.flatMap((facet) => MATRIX_LEVELS[facet])),
];

/** Is `level` a level OF `facet`? The pairing check the flat enum cannot make. */
export function isLevelOf(facet: string, level: unknown): boolean {
  const levels = MATRIX_LEVELS[facet];
  return (
    Array.isArray(levels) && typeof level === "string" && levels.includes(level)
  );
}

/* ══ 4 · THE STATUSES A CLAIM CAN HOLD ══════════════════════════════ */

/**
 * What has happened to one proposed cell.
 *
 *   proposed  the extractor wrote it and nobody has looked
 *   accepted  a person kept it
 *   struck    a person removed it — the member or the desk
 *   silent    it states nothing, and never will
 *
 * `silent` IS THE DEFAULT, in this file and in db/064's column default, and
 * the direction of that default is the point. A row that arrives with no
 * status states nothing, rather than quietly counting as a proposal nobody
 * made. The extractor writes `proposed` explicitly; every other path fails
 * into silence.
 */
export const PROPOSAL_STATUSES = [
  "proposed",
  "accepted",
  "struck",
  "silent",
] as const;
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];

/** The default, named once so nothing has to remember which end it is. */
export const DEFAULT_STATUS: ProposalStatus = "silent";

export function isProposalStatus(value: unknown): value is ProposalStatus {
  return (
    typeof value === "string" &&
    (PROPOSAL_STATUSES as readonly string[]).includes(value)
  );
}

/* ══ 5 · WHAT COMES BACK FROM ONE FRAME ═════════════════════════════ */

/**
 * One proposed cell.
 *
 * `evidence` is not optional and not decorative. It is the sentence naming
 * what IN THE FRAME states the level — "the table is pushed back against the
 * wall", not "it feels informal". CLAUDE.md rule 3: positive evidence, never
 * inference from silence. A proposal whose evidence describes what is ABSENT
 * is the retro-tagging failure this catalogue exists to escape, and the desk
 * review shows the evidence beside every keep/strike precisely so a reviewer
 * is judging the sentence rather than the label.
 *
 * `confidence` is carried for audit and IS NEVER RENDERED. Founder: "It makes
 * people rubber-stamp 0.91."
 */
export type FacetProposal = {
  facet: MatrixFacet;
  level: string;
  evidence: string;
  confidence: number;
};

/**
 * WHAT THE FRAME SHOWS ABOUT WHAT THE PLACE CAN PHYSICALLY DO.
 *
 * Only from a `place_she_has` photograph, and only ever as a positive:
 * there is a sky, there is a fire, there is a kitchen. THERE IS NO WAY IN THIS
 * TYPE TO SAY THAT SOMETHING IS ABSENT, and that is deliberate — a frame that
 * does not show a kitchen is a frame that does not show a kitchen, not a
 * kitchenless house (rule 3, and the founder's "never infer from what is
 * missing").
 *
 * The codes are `structural_requirement.code` from db/020. `noise_ceiling` is
 * not among them because a photograph cannot show an hour or a neighbour.
 *
 * NOTHING CONSUMES THESE YET. Venue prunes the pool at stage 3 from
 * `quiz_response.environment`, and a cue read off a picture does not join that
 * path until the founder wires it. The desk says so on the screen (rule 16).
 */
export const VENUE_AFFORDANCES = [
  "requires_outdoors",
  "requires_open_flame",
  "requires_full_kitchen",
] as const;
export type VenueAffordance = (typeof VENUE_AFFORDANCES)[number];

export const AFFORDANCE_SAID: Readonly<Record<VenueAffordance, string>> = {
  requires_outdoors: "there is open sky",
  requires_open_flame: "there is somewhere a fire can be lit",
  requires_full_kitchen: "there is a kitchen she can cook in",
};

export type VenueCue = {
  affordance: VenueAffordance;
  evidence: string;
};

/**
 * THE LIGHT AND THE DENSITY. What the member reads back on her own screen.
 *
 * Ten closed codes, and they are deliberately NOT the house's tone vocabulary
 * (src/lib/voice.ts's TONES) and NOT the quiz's taste directions. TONES are
 * about how her PEOPLE talk, which rule 1 forbids reading off an evening, let
 * alone off a photograph of one. Taste directions she has already answered,
 * and a picture does not re-answer them.
 *
 * What is left is what a frame genuinely carries: how it is lit, how full it
 * is, how warm it is, how kept it is. These are the words on the member's
 * strike screen — "warm, sparse, late sun" is three of them — and being the
 * words she is shown and can remove is the whole of what they are for today.
 * They grade nothing (rule 15 is satisfied by their not being in any scoring
 * loop) and the desk says so.
 */
export const TONE_CUES = [
  "daylight",
  "late_sun",
  "candlelight",
  "electric_night",
  "sparse",
  "layered",
  "warm",
  "cool",
  "polished",
  "worn",
] as const;
export type ToneCueCode = (typeof TONE_CUES)[number];

/** The member-facing word for each. Lower case: they read as a list. */
export const TONE_SAID: Readonly<Record<ToneCueCode, string>> = {
  daylight: "daylight",
  late_sun: "late sun",
  candlelight: "candlelight",
  electric_night: "electric, after dark",
  sparse: "sparse",
  layered: "layered",
  warm: "warm",
  cool: "cool",
  polished: "polished",
  worn: "worn in",
};

export type ToneCue = {
  cue: ToneCueCode;
  evidence: string;
};

/**
 * A THING IN THE FRAME, NAMED PLAINLY.
 *
 * For `object_to_find`. Plain words in the house's register — "a low brass
 * lamp", not a brand and not a shop. It proposes no cell, reaches no pool and
 * feeds no ranker; it is a note attached to her application so that whoever
 * later builds the shoppable edit has the member's own evidence rather than a
 * memory of it. The desk says, on the screen, that it does nothing yet.
 */
export type ObjectCue = {
  object: string;
  evidence: string;
};

/** A counted colour. Computed from pixels in src/lib/photo-store.ts. */
export type PaletteSwatch = {
  /** `#rrggbb`, lower case. */
  hex: string;
  /** Share of the sampled pixels, 0–1, rounded to three places. */
  share: number;
};

/**
 * ONE PHOTOGRAPH, READ.
 *
 * `outcome: "silent"` is not an error state to be handled somewhere else — it
 * is a complete, storable reading that says nothing about the evening, and it
 * carries `silence` saying why in words. A failed call and a frame with
 * nothing in it produce the same shape, which is correct: from the matrix's
 * side they are the same fact.
 *
 * There is no `destination` here. See the essay at the top.
 */
export type PhotoExtract = {
  version: string;
  model: string;
  role: PhotoRole | null;
  /** Set from `role` by code. Never by the model. */
  mayPrune: boolean;
  outcome: "read" | "silent";
  /** Present exactly when `outcome === "silent"`. */
  silence: string | null;
  facets: readonly FacetProposal[];
  venue: readonly VenueCue[];
  tone: readonly ToneCue[];
  objects: readonly ObjectCue[];
  palette: readonly PaletteSwatch[];
};

/** The empty reading, with its reason. The only thing a failure may produce. */
export function silentExtract(
  reason: string,
  over: Partial<Pick<PhotoExtract, "model" | "role" | "palette">> = {}
): PhotoExtract {
  const role = over.role ?? null;
  return {
    version: PHOTO_EXTRACT_VERSION,
    model: over.model ?? "",
    role,
    mayPrune: mayPrune(role),
    outcome: "silent",
    silence: reason,
    facets: [],
    venue: [],
    tone: [],
    objects: [],
    palette: over.palette ?? [],
  };
}

/* ══ 6 · THE SET, WHICH IS A VIEW AND NOT A TABLE ═══════════════════ */

/**
 * What a facet is, across the whole application.
 *
 * `stated` carries a level. Everything else is silence with a reason, and the
 * reasons are different facts a reviewer needs to be able to tell apart:
 *
 *   untouched  nobody proposed it
 *   pending    somebody proposed it and nobody has decided
 *   conflict   two accepted proposals disagree
 *   struck     every proposal for it was removed
 */
export type StatedCell = { facet: MatrixFacet; state: "stated"; level: string };

export type SilentCell = {
  facet: MatrixFacet;
  state: "untouched" | "pending" | "conflict" | "struck";
  level: null;
  /** The levels that were in play, for the conflict line on the desk. */
  levels: readonly string[];
};

export type SetFacet = StatedCell | SilentCell;

/**
 * EVERY PHOTOGRAPH ON ONE APPLICATION, MERGED.
 *
 * Founder: "Do not add `approved_set`. The set is a view." So this type is
 * computed by `mergeSet` on read and stored nowhere. A stored set is a fourth
 * record of a fact three tables already hold, and it goes stale the first time
 * somebody strikes something.
 */
export type PhotoSetExtract = {
  applicationId: string;
  /** In upload order. */
  extracts: readonly PhotoExtract[];
  facets: readonly SetFacet[];
  /** Facets where two accepted proposals disagree. Drives the desk sort. */
  conflicts: readonly MatrixFacet[];
};

/** One claim as the merge sees it: a proposal plus what somebody did to it. */
export type DecidedClaim = {
  facet: MatrixFacet;
  level: string;
  status: ProposalStatus;
};

/**
 * THE MERGE RULE, IN THE FOUNDER'S OWN TERMS.
 *
 * "A facet is stated only if at least one accepted proposal agrees and no
 * accepted proposal contradicts it. Conflict → silent."
 *
 * DO NOT AVERAGE. Not a majority, not a weighted mean over confidence, not
 * "the strongest wins". Four photographs saying `dressed` and one accepted
 * `plain` is not four-to-one for `dressed`; it is a woman who has told the
 * house two different things and has not been asked which. The honest output
 * is silence and a conflict on the desk, and the correct next act is a
 * question to her — which is a different act, at a different desk.
 *
 * Only ACCEPTED proposals count. A `proposed` claim nobody has read states
 * nothing, which is why an application with seven unreviewed photographs
 * contributes exactly zero cells to anything.
 */
export function mergeSet(
  applicationId: string,
  extracts: readonly PhotoExtract[],
  claims: readonly DecidedClaim[]
): PhotoSetExtract {
  const facets: SetFacet[] = [];
  const conflicts: MatrixFacet[] = [];

  for (const facet of MATRIX_FACETS) {
    const mine = claims.filter((c) => c.facet === facet);
    if (mine.length === 0) {
      facets.push({ facet, state: "untouched", level: null, levels: [] });
      continue;
    }

    const accepted = [...new Set(mine.filter((c) => c.status === "accepted").map((c) => c.level))];

    if (accepted.length > 1) {
      conflicts.push(facet);
      facets.push({ facet, state: "conflict", level: null, levels: accepted.sort() });
      continue;
    }
    if (accepted.length === 1) {
      facets.push({ facet, state: "stated", level: accepted[0] });
      continue;
    }

    const live = mine.some((c) => c.status === "proposed");
    facets.push({
      facet,
      state: live ? "pending" : "struck",
      level: null,
      levels: [...new Set(mine.map((c) => c.level))].sort(),
    });
  }

  return { applicationId, extracts, facets, conflicts };
}

/* ══ 7 · THE TOOL ═══════════════════════════════════════════════════ */

/** The name the model is forced to call. One tool, no choice of tools. */
export const EXTRACT_TOOL_NAME = "read_the_frame";

/** JSON Schema is `unknown`-shaped by nature; this is the honest type for it. */
type JsonSchema = Record<string, unknown>;

/**
 * THE TOOL SCHEMA. Read the four structural rules at the top of this file
 * before changing anything here.
 *
 * `additionalProperties: false` everywhere, enums for facet, level, affordance
 * and tone cue, `minItems: 0` on every array. Built rather than written out so
 * that PROPOSABLE_FACETS and PROPOSABLE_LEVELS are the only lists — a schema
 * with the facet names typed into it would be right until the matrix moved.
 */
export function extractTool(): {
  name: string;
  description: string;
  /**
   * `type: "object"` is in the TYPE and not only in the value, so that this
   * satisfies the SDK's `Tool` without a cast at the call site. A cast there
   * would be the one place a schema change could stop being checked.
   */
  input_schema: { type: "object" } & JsonSchema;
} {
  const evidence: JsonSchema = {
    type: "string",
    minLength: 4,
    maxLength: 240,
    description:
      "What IS IN THE FRAME that states this. Name the visible thing. " +
      "Never what is absent, never a feeling, never a guess about the year.",
  };

  return {
    name: EXTRACT_TOOL_NAME,
    description:
      "Record only what this single photograph shows. Every array may be " +
      "empty and an empty array is a correct answer.",
    input_schema: {
      type: "object",
      additionalProperties: false,
      required: ["facets", "venue", "tone", "objects"],
      properties: {
        facets: {
          type: "array",
          minItems: 0,
          maxItems: PROPOSABLE_FACETS.length,
          description:
            "Cells this frame states about the EVENING. Omit any column the " +
            "frame does not state. Do not fill this to look thorough.",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["facet", "level", "evidence", "confidence"],
            properties: {
              facet: { enum: [...PROPOSABLE_FACETS] },
              level: { enum: [...PROPOSABLE_LEVELS] },
              evidence,
              confidence: { type: "number", minimum: 0, maximum: 1 },
            },
          },
        },
        venue: {
          type: "array",
          minItems: 0,
          maxItems: VENUE_AFFORDANCES.length,
          description:
            "Only what the place can physically DO, and only as a positive. " +
            "There is no way to say something is absent, on purpose.",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["affordance", "evidence"],
            properties: {
              affordance: { enum: [...VENUE_AFFORDANCES] },
              evidence,
            },
          },
        },
        tone: {
          type: "array",
          minItems: 0,
          maxItems: 4,
          description: "How the frame is lit and how full it is. At most four.",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["cue", "evidence"],
            properties: {
              cue: { enum: [...TONE_CUES] },
              evidence,
            },
          },
        },
        objects: {
          type: "array",
          minItems: 0,
          maxItems: 5,
          description:
            "Things in the frame, named plainly in ordinary words. No brand, " +
            "no shop, no place name.",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["object", "evidence"],
            properties: {
              object: { type: "string", minLength: 2, maxLength: 80 },
              evidence,
            },
          },
        },
      },
    },
  };
}

/* ══ 8 · WHAT THE MODEL IS TOLD ═════════════════════════════════════ */

/**
 * The system rule, short, in the founder's own five clauses.
 *
 * It is short on purpose. Everything a longer prompt would have to say is
 * already said by the schema, and a rule stated twice in two places is a rule
 * that will one day be stated two ways.
 */
export function extractSystemPrompt(role: PhotoRole | null): string {
  const said =
    role === null
      ? "Nobody has said what this photograph is for."
      : `The member attached this saying: ${ROLE_SAID[role]}.`;

  return [
    "You are reading one photograph a member of a private club attached to " +
      "her application, and mapping it onto a fixed vocabulary.",
    said,
    "",
    "Only claim a facet if the frame shows the fact.",
    "If you are unsure, omit it. An empty list is a correct answer.",
    "Never name a destination, a city, a country, a hotel or a year.",
    "Never infer anything from what is missing.",
    "Never report a colour; the colours are counted from the pixels.",
    "",
    `Call ${EXTRACT_TOOL_NAME} once and say nothing else.`,
  ].join("\n");
}

/** The single user turn, beside the image block. */
export const EXTRACT_ASK = "Read this frame.";

/* ══ 9 · READING THE REPLY ══════════════════════════════════════════ */

/**
 * ONE THING THE PARSER THREW AWAY, AS A FACT RATHER THAN AS A SENTENCE.
 *
 * `facet` is populated whenever the drop was about a column, and it is what
 * lets the desk queue put "the model tried to propose `arrival`" in its own
 * band without matching on a substring. CLAUDE.md rule 24: assume your
 * matching is wrong until you have counted, and the cheapest way to never
 * match wrongly is to never match.
 */
export type Dropped = {
  /** Why it went. One of a small closed set so a screen can group them. */
  kind:
    | "fingerprint"
    | "not_a_column"
    | "not_a_level"
    | "no_evidence"
    | "duplicate"
    | "malformed"
    | "not_a_cue";
  /** The column it was about, when it was about one. */
  facet?: string;
  /** The whole entry in words, for the desk and for the bench. */
  said: string;
};

export type ExtractParse =
  | { ok: true; extract: PhotoExtract; dropped: readonly Dropped[] }
  | { ok: false; silence: string };

/**
 * THE REPLY, VALIDATED IN OUR OWN CODE AFTER THE SCHEMA HAS HAD ITS GO.
 *
 * The founder asked for defence in depth and this is it. A tool schema steers
 * a model; it does not bind one. So everything the schema promised is checked
 * again here, and anything that fails is DROPPED rather than repaired:
 *
 *   · a facet outside PROPOSABLE_FACETS — including the three that are not in
 *     the enum at all, which is where a stray `arrival` would appear
 *   · a level that is not a level of ITS facet (the pairing the flat enum
 *     cannot express)
 *   · a second proposal for a facet+level already seen
 *   · an affordance, tone cue or object outside its vocabulary
 *   · an empty evidence sentence — a claim with no receipt is not a claim
 *
 * `dropped` comes back so the caller can count what it threw away. Rule 24:
 * a validator that has never reported a drop is a validator nobody has
 * checked, and the bench in scripts/photo-bench.mjs prints this number.
 *
 * Nothing here invents a value and nothing here retries.
 */
export function extractFrom(input: {
  raw: unknown;
  role: PhotoRole | null;
  model: string;
  palette: readonly PaletteSwatch[];
}): ExtractParse {
  const { raw, role, model, palette } = input;

  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, silence: "the reply was not an object" };
  }
  const body = raw as Record<string, unknown>;
  const dropped: Dropped[] = [];

  const facets: FacetProposal[] = [];
  const seen = new Set<string>();
  for (const item of arrayOf(body.facets)) {
    const row = objectOf(item);
    if (!row) {
      dropped.push({
        kind: "malformed",
        said: "a facet entry that was not an object",
      });
      continue;
    }
    const facet = String(row.facet ?? "");
    if (!mayPropose(facet)) {
      // THE FINGERPRINT BAND'S ONE SOURCE OF TRUTH. `kind: "fingerprint"`
      // means the model tried to propose a column a photograph may never
      // reach, and the desk queue sorts on that fact rather than on a
      // substring of `said` — rule 24, from the safe end: the cheapest way
      // never to match wrongly is never to match.
      dropped.push(
        facet in NEVER_FROM_A_PHOTO
          ? {
              kind: "fingerprint",
              facet,
              said: `${facet}, which a photograph may never propose`,
            }
          : {
              kind: "not_a_column",
              facet: facet || undefined,
              said: `${facet || "(unnamed)"}, which is not a column`,
            }
      );
      continue;
    }
    const level = row.level;
    if (!isLevelOf(facet, level)) {
      dropped.push({
        kind: "not_a_level",
        facet,
        said: `${facet} = ${JSON.stringify(level)}, not a level of it`,
      });
      continue;
    }
    const evidence = trimmed(row.evidence);
    if (evidence === "") {
      dropped.push({
        kind: "no_evidence",
        facet,
        said: `${facet} = ${String(level)}, with no evidence`,
      });
      continue;
    }
    const key = `${facet} ${String(level)}`;
    if (seen.has(key)) {
      dropped.push({
        kind: "duplicate",
        facet,
        said: `${facet} = ${String(level)}, proposed twice`,
      });
      continue;
    }
    seen.add(key);
    facets.push({
      facet,
      level: String(level),
      evidence,
      confidence: confidenceOf(row.confidence),
    });
  }

  const venue: VenueCue[] = [];
  const venueSeen = new Set<string>();
  for (const item of arrayOf(body.venue)) {
    const row = objectOf(item);
    const affordance = row ? String(row.affordance ?? "") : "";
    const evidence = row ? trimmed(row.evidence) : "";
    if (
      !(VENUE_AFFORDANCES as readonly string[]).includes(affordance) ||
      evidence === "" ||
      venueSeen.has(affordance)
    ) {
      dropped.push({
        kind: "not_a_cue",
        said: `a venue cue: ${affordance || "(unnamed)"}`,
      });
      continue;
    }
    venueSeen.add(affordance);
    venue.push({ affordance: affordance as VenueAffordance, evidence });
  }

  const tone: ToneCue[] = [];
  const toneSeen = new Set<string>();
  for (const item of arrayOf(body.tone)) {
    const row = objectOf(item);
    const cue = row ? String(row.cue ?? "") : "";
    const evidence = row ? trimmed(row.evidence) : "";
    if (
      !(TONE_CUES as readonly string[]).includes(cue) ||
      evidence === "" ||
      toneSeen.has(cue)
    ) {
      dropped.push({
        kind: "not_a_cue",
        said: `a tone cue: ${cue || "(unnamed)"}`,
      });
      continue;
    }
    toneSeen.add(cue);
    tone.push({ cue: cue as ToneCueCode, evidence });
  }

  const objects: ObjectCue[] = [];
  for (const item of arrayOf(body.objects)) {
    const row = objectOf(item);
    const object = row ? trimmed(row.object) : "";
    const evidence = row ? trimmed(row.evidence) : "";
    if (object === "" || evidence === "") {
      dropped.push({
        kind: "no_evidence",
        said: "an object cue with no name or no evidence",
      });
      continue;
    }
    objects.push({ object: object.slice(0, 80), evidence });
  }

  return {
    ok: true,
    dropped,
    extract: {
      version: PHOTO_EXTRACT_VERSION,
      model,
      role: role ?? null,
      // NEVER from the reply. See rule 4 at the top of this file.
      mayPrune: mayPrune(role),
      outcome: "read",
      silence: null,
      facets,
      venue: mayPrune(role) ? venue : [],
      tone,
      objects,
      palette,
    },
  };
}

/**
 * A venue cue off a photograph that is not her place is dropped ABOVE, in the
 * parse, and not filtered at the point of use. Said in words because the
 * ternary is three characters and the rule is the seam: a Pinterest terrace
 * showing a fire pit must not become evidence that SHE has one, and the only
 * safe place to stop that is before it is written down.
 */

/* ── the small readers ──────────────────────────────────────────────── */

function arrayOf(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value : [];
}

function objectOf(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function trimmed(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Confidence, clamped, defaulting to 0.
 *
 * Zero rather than a half, because a missing confidence is not a coin flip —
 * it is a model that did not say. The number never reaches a screen; it exists
 * so that a run of the bench can ask whether the ones a reviewer struck were
 * the low ones.
 */
function confidenceOf(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, Math.round(value * 100) / 100));
}
