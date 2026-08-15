/**
 * The selection engine's vocabulary.
 *
 * Every type here describes a SNAPSHOT — the state of the catalogue and of one
 * customer at the moment a curator asked for candidates. Nothing in this
 * directory opens a connection except src/lib/selection/catalogue.ts, and that
 * file's only job is to fill these shapes in. The stages themselves take a
 * snapshot and return candidates, which is what makes the scoring, the
 * dithering, the beam search and the fingerprint testable without a database.
 *
 * See docs/selection-spec.md. Stage numbers below are that document's.
 */

/** occasion_type in db/001. */
export type OccasionCode =
  | "birthday"
  | "girls_weekend"
  | "dinner_party"
  | "getaway"
  | "anniversary"
  | "holiday"
  | "bridal"
  | "no_reason"
  | "other";

/** section_kind in db/001. */
export type SectionKind =
  | "world"
  | "arrival"
  | "moment"
  | "ending"
  | "fun"
  | "soundtrack"
  | "details"
  | "edit"
  | "downloads"
  | "make_it_happen";

export type Polarity = "positive" | "negative";

/** occasion_fit in db/009. */
export type OccasionFit = "native" | "forbidden";

/**
 * game_shape in db/010. Games only; every other pool carries null.
 *
 * `scheduled` occupies a block of the evening, and an occasion has a small
 * number of blocks (occasion_shape.scheduled_game_max). `ambient` runs
 * underneath everything and consumes none. `finale` closes the night. Only
 * `scheduled` is counted against the cap — that distinction IS the point:
 * three games in one evening is fine when one runs underneath it and one is
 * the ending.
 */
export type GameShape = "scheduled" | "ambient" | "finale";

/** taste_provenance in db/002. */
export type Provenance =
  | "curator"
  | "quiz"
  | "observed"
  | "inferred"
  | "cohort_prior";

/** One term of the controlled vocabulary, enough to name it in a sentence. */
export type Facet = {
  id: string;
  dimension: string;
  code: string;
  label: string;
};

/** A signed tag: facet id -> weight, -1..1. The shape every pool is tagged in. */
export type FacetTags = Record<string, number>;

/**
 * Her two scale answers as numbers — quiz_response_scale in db/006.
 *
 * Dollars, not cents, because that is what the view returns and what a curator
 * reads. Every field is nullable and each null means something specific; see
 * the spec's "Two kinds of null, and both mean ask her".
 */
export type Scale = {
  guestBand: string | null;
  guestsLow: number | null;
  guestsHigh: number | null;
  guestsPlanning: number | null;

  spendBand: string | null;
  perPersonLow: number | null;
  perPersonHigh: number | null;
  perPersonPlanning: number | null;

  /** planning-per-head × planning-guests. What to build to. */
  budgetPlanning: number | null;
  /** top of one band × top of the other. NULL means ask her, never no limit. */
  budgetCeiling: number | null;

  /** Set only on responses priced the retired way. */
  retiredBudgetBand: string | null;
};

/** One resolved answer from this application. Stage 0 output. */
export type StatedFacet = {
  facetId: string;
  dimension: string;
  code: string;
  label: string;
  field: string;
  polarity: Polarity;
  /**
   * quiz_option_facet.answer_weight — db/016. HOW MUCH, AND WHICH END, signed
   * -1..1 and never zero. 1 for every answer to an unordered question, which is
   * all of them until the making axis.
   *
   * A NEGATIVE WEIGHT IS NOT A VETO, and the two must never be collapsed.
   * `polarity` answers "is this a dealbreaker" and only "what would ruin it" is
   * asked that way. This answers "which end of an ordinal axis", and it is
   * scored: a host who wants everything to arrive finished is pulled toward the
   * most finished menus in the pool, not shown an empty table because
   * everything in it involves cooking.
   */
  weight: number;
};

/** The application, resolved. */
export type Application = {
  quizResponseId: string;
  customerId: string;
  customerEmail: string;
  quizVersion: string;
  occasion: OccasionCode;
  /** Her words, when the occasion is 'other'. Never parsed. */
  occasionOther: string | null;
  environment: string;
  /** The free-text answer. Held for the curator, verbatim. */
  secret: string | null;
  musicService: string | null;
  stated: StatedFacet[];
  scale: Scale;
  /**
   * SLOTS THAT DO NOT EXIST FOR HER — slot_exclusion codes, db/014.
   *
   * "Maybe someone won't even be serving food, in that case no menu." That is
   * a FACT about her evening, not a dislike, and it is not a catalogue gap:
   * the house has nothing to author. A slot named here is removed from the
   * plan before the fill runs, so it is never filled, never dropped and never
   * reported as missing.
   *
   * Filled from `quiz_response_exclusion` (db/016), which resolves her answers
   * about food and about games into slot_exclusion codes the same way
   * quiz_response_facet resolves the rest of them into vocabulary.
   */
  exclusions: string[];
  createdAt: string;
};

/** A current taste_signal row — db/002, superseded rows already excluded. */
export type HistorySignal = {
  facetId: string | null;
  polarity: Polarity;
  strength: number;
  confidence: number;
  source: Provenance;
  context: string;
  observedAt: string;
  subjectLabel: string | null;
  note: string | null;
};

/** customer_cohort_affinity_effective, joined to the cohort's own tags. */
export type CohortAffinity = {
  cohortId: string;
  slug: string;
  name: string;
  weightShare: number;
  confidence: number;
  facets: FacetTags;
};

/** ingredient_issuance, per ingredient. Null when it has never been issued. */
export type Issuance = {
  issueCount: number;
  lastIssuedAt: string | null;
  customerCount: number;
};

export type OccasionClaim = {
  occasion: OccasionCode;
  fit: OccasionFit;
  note: string | null;
};

/** Which slots a thing may fill. Same rule as the occasion axis. */
export type SlotClaim = {
  slotCode: string;
  fit: OccasionFit;
  note: string | null;
};

/** Either axis, normalised, for the one function that implements the rule. */
export type EligibilityClaim = {
  key: string;
  fit: OccasionFit;
  note: string | null;
};

/** A published destination, with everything the engine needs to judge it. */
export type Destination = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  facets: FacetTags;
  occasions: OccasionClaim[];
  issuance: Issuance | null;
  isFixture: boolean;
};

/** How an ingredient behaves under one destination — stage 3. */
export type WorldScope = {
  forbidden: boolean;
  /** Signed -1..1, consumed as an additive term. No row means zero. */
  affinity: number;
  note: string | null;
};

/**
 * ONE OBJECT THAT GETS PRINTED — game_printed_matter in db/010.
 *
 * A real thing in the destination's palette and face: the rules card, the
 * prompts, the ballot. It is a property of the INGREDIENT and not of the
 * Revelle, because it is authored once with the game and travels with it into
 * every Revelle the game lands in.
 *
 * Nothing here scores or filters. It is carried so that member.ts can answer
 * "what is printed" from the same object that answers "what did she get",
 * which is the one-answer rule that file states.
 */
export type PrintedPiece = {
  /** 'the_deck', 'voting_slips'. Machine-stable within its ingredient. */
  piece: string;
  label: string;
  description: string;
  /** One per head, counted from the top of her guest band. */
  perGuest: boolean;
  /** A fixed count when it is not per head. Null when nobody has counted. */
  quantity: number | null;
};

/** One member of one pool. */
export type Ingredient = {
  pool: string;
  id: string;
  slug: string;
  name: string;
  description: string;
  /** Per unit. Null means "a curator has not priced it yet". */
  priceCents: number | null;
  facets: FacetTags;
  occasions: OccasionClaim[];
  slots: SlotClaim[];
  worlds: Record<string, WorldScope>;
  issuance: Issuance | null;
  /** Games only. A constraint, never a score. */
  minGuests: number | null;
  maxGuests: number | null;
  /**
   * Games only; null in every other pool. game.shape in db/010, and the reason
   * the fill can tell a block-occupying game from one that runs underneath the
   * evening. A constraint on the SET, never a score.
   */
  shape: GameShape | null;
  /**
   * WHAT GETS PRINTED, when this ingredient brings objects with it.
   *
   * Optional rather than an empty array, so that a snapshot assembled by hand
   * — every fixture in selection.test.ts, every caller written before db/010
   * grew the table — stays valid without being edited. Absent and empty mean
   * the same thing to every reader: this ingredient prints nothing.
   */
  printedMatter?: readonly PrintedPiece[];
  isFixture: boolean;
};

/** One row of occasion_slot, joined to slot_kind — db/009. */
export type SlotRule = {
  slotCode: string;
  label: string;
  description: string;
  section: SectionKind;
  perGuest: boolean;
  pool: string;
  minCount: number;
  maxCount: number;
  required: boolean;
  perDay: boolean;
  position: number;
  note: string;
  /**
   * slot_kind.excluded_by — db/014. The name of the FACT about her evening
   * that removes this slot from her plan entirely: 'no_food' takes the menu,
   * 'no_games' takes the games. Null on a slot no answer can remove.
   *
   * On the slot table rather than in a list in this file so that making a new
   * slot excludable is an INSERT, exactly as slot_shape made "which shapes may
   * fill this slot" data rather than code.
   */
  excludedBy: string | null;
};

export type OccasionShape = {
  occasion: OccasionCode;
  label: string;
  days: number;
  note: string;
  /**
   * occasion_shape.scheduled_game_max — db/010. How many block-occupying games
   * this occasion has room for. One for a long dinner, two for a birthday,
   * three for a weekend, because the weekend has days.
   *
   * Read by fillSlots and enforced DURING the search, not reported afterwards:
   * two things cannot occupy the same hour, so a fourth scheduled game is not
   * a weak candidate, it is an impossibility.
   */
  scheduledGameMax: number;
};

/**
 * A SLOT SHE DOES NOT HAVE — and the difference between this and a gap is the
 * whole reason it exists.
 *
 * A CatalogueGap is a work order: the pool could not fill a slot her occasion
 * has, and the house must author something. This is not. She is not serving
 * food, so there is no menu; there is nothing to write, nothing to fix, and
 * nothing for a curator to do. Keeping the two in one list would fill the gap
 * list with noise and the gap list would stop being read — which would cost
 * the house the only signal telling it what to write next.
 *
 * To the member both look identical: the deliverable is simply absent.
 */
export type ExcludedSlot = {
  slotCode: string;
  slotLabel: string;
  pool: string;
  /** What the occasion asked for, before her answer removed it. */
  requiredByOccasion: boolean;
  /** The slot_exclusion code that removed it. */
  exclusion: string;
  /** Why, in a sentence, for the curator. */
  detail: string;
};

/**
 * ONE PICK'S WORTH OF SLOT. The plan is expanded so that a slot asking for one
 * to three items becomes three unit slots — one required, two optional — and a
 * per-day slot becomes one per day. Everything downstream then deals with a
 * flat list, and "how many of this did we place" is a count rather than a
 * nested loop.
 */
export type UnitSlot = {
  key: string;
  slotCode: string;
  label: string;
  section: SectionKind;
  pool: string;
  required: boolean;
  /** How many of this item get bought/printed: guests for a per-head slot. */
  quantity: number;
  perGuest: boolean;
  /** 1-based, only for a per-day slot. */
  dayIndex: number | null;
  position: number;
  note: string;
};

export type Catalogue = {
  facets: Record<string, Facet>;
  destinations: Destination[];
  ingredients: Ingredient[];
  slotRules: SlotRule[];
  shape: OccasionShape;
  /** Every assemblage that has actually been delivered. Stage 5. */
  issuedFingerprints: string[];
};

/** Everything one run of the engine reads. */
export type SelectionInput = {
  application: Application;
  history: HistorySignal[];
  cohorts: CohortAffinity[];
  catalogue: Catalogue;
};

// ── the preference vector ────────────────────────────────────────────

export type VectorSource = "stated" | "history" | "cohort" | "inherited";

export type VectorContribution = {
  source: VectorSource;
  weight: number;
  /** Where it came from, in words. "her cohort Coastal restraint (0.6)". */
  because: string;
};

export type VectorTerm = {
  facet: Facet;
  weight: number;
  contributions: VectorContribution[];
};

export type PreferenceVector = {
  /** facet id -> signed weight. Soft negatives already scaled down. */
  weights: FacetTags;
  terms: Record<string, VectorTerm>;
  /** Facet ids that eliminate rather than penalise. */
  dealbreakers: string[];
  /** How the three sources were mixed for this customer. */
  blend: { stated: number; history: number; cohort: number };
  /** How much of her own evidence there was. Drives the shrinkage. */
  evidenceCount: number;
};

// ── results ──────────────────────────────────────────────────────────

export type Pick = {
  slot: UnitSlot;
  ingredient: Ingredient;
  /** cents, per unit */
  unitCost: number | null;
  /** cents, unitCost × quantity */
  lineCost: number | null;
  facetMatch: number;
  affinity: number;
  issuancePenalty: number;
  similarityPenalty: number;
  score: number;
  /** True when this slot had exactly one eligible ingredient. */
  forced: boolean;
  /** How many other ingredients could have filled this slot. */
  alternatives: number;
};

export type DroppedPick = {
  slot: UnitSlot;
  ingredientName: string;
  lineCost: number | null;
  reason:
    | "budget"
    | "pool_empty"
    | "collision"
    | "no_good_match"
    /** The evening had no block left. See occasion_shape.scheduled_game_max. */
    | "scheduled_cap";
  detail: string;
};

/**
 * A WORK ORDER FOR THE HOUSE, and never anything else.
 *
 * A gap means her occasion has a slot and the pool could not fill it. It is
 * how the library learns what to write next, so it must survive all the way to
 * the curator — and it must never cross into anything she sees. See member.ts:
 * an unfillable slot means the deliverable does not exist in her Revelle. Not
 * an error, not a placeholder, not an apology. Silence.
 *
 * Distinct from ExcludedSlot, which is not a work order at all.
 */
export type CatalogueGap = {
  pool: string;
  slotCode: string;
  slotLabel: string;
  required: boolean;
  detail: string;
};

export type Swap = {
  slotLabel: string;
  from: string;
  to: string;
  reason: string;
};

export type Elimination = {
  destinationName: string;
  reason: string;
};

export type BudgetReport = {
  guests: number | null;
  guestsAreConfirmed: boolean;
  planning: number | null;
  ceiling: number | null;
  totalCents: number;
  totalPerHeadCents: number | null;
  /** Positive when the ceiling was exceeded. Dollars. */
  overage: number | null;
  overagePerHead: number | null;
  unbounded: boolean;
  unpricedItems: string[];
};

/**
 * THE CURATOR'S ACCOUNT. House-facing, every sentence of it.
 *
 * That was already the intent; it is now also enforced, because "curator-facing
 * by convention" is a rule the first person to build a preview page breaks by
 * accident. MemberRevelle in member.ts structurally cannot carry this field,
 * and memberRevelle() is the only sanctioned way to get from a Candidate to
 * something a member may see.
 */
export type Explanation = {
  headline: string;
  destination: string[];
  eliminated: string[];
  forced: string[];
  dropped: string[];
  swapped: string[];
  budget: string[];
  gaps: string[];
  /** Slots she does not have. Not gaps, and never in the same list. */
  excluded: string[];
  confidence: string[];
  /** Her free-text answer, verbatim. Never summarised. */
  secret: string | null;
};

export type Candidate = {
  rank: number;
  destination: Destination;
  destinationScore: number;
  destinationRank: number;
  ditheredRank: number;
  picks: Pick[];
  dropped: DroppedPick[];
  gaps: CatalogueGap[];
  swaps: Swap[];
  fingerprint: string | null;
  budget: BudgetReport;
  score: number;
  /** Low confidence forces curator review regardless of sampling rate. */
  lowConfidence: boolean;
  /**
   * WHY THIS ONE MUST NOT GO OUT, or null when it may.
   *
   * The only thing that ever sets it is assemblage uniqueness — this exact set
   * has already been delivered to someone, and delivering it again would make
   * two women's Revelles the same object. That is a reason to withhold the
   * whole candidate.
   *
   * A CATALOGUE GAP IS NOT. A slot the pool could not fill leaves her Revelle
   * one piece smaller and nothing else; it never sets this, never blocks
   * issuance, and never reaches her. memberRevelle() refuses a blocked
   * candidate outright and the sentence stays here, on the house side.
   */
  blocked: string | null;
  explanation: Explanation;
};

export type SelectionResult = {
  candidates: Candidate[];
  vector: PreferenceVector;
  eliminated: Elimination[];
  /** Set when dealbreakers left nothing at all. */
  impasse: string | null;
  seed: number;
  /** What the house must author. A work order. */
  gaps: CatalogueGap[];
  /** What she said she does not have. NOT a work order. */
  excluded: ExcludedSlot[];
};

// ── tuning ───────────────────────────────────────────────────────────

/**
 * Every number the engine can be argued with, in one object.
 *
 * None of these are constants of nature. They are the knobs the spec says to
 * fit when there is data, and keeping them here rather than sprinkled through
 * the stages is what makes fitting them a diff instead of an archaeology
 * project.
 */
export type EngineOptions = {
  /** How many complete candidates the curator sees. Spec: two or three. */
  candidateCount: number;
  /** Her stated answers' share of the vector. Always dominant. */
  statedWeight: number;
  /**
   * The shrinkage constant. The cohort carries k/(k+n) of the non-stated
   * weight, where n is how many of her own signals we hold — so it is nearly
   * everything at application #1 and recedes as evidence accumulates.
   */
  cohortPriorStrength: number;
  /** A soft negative is worth this much of an equivalent positive. */
  softNegativeRatio: number;
  /** How hard the destination's own facets pull the downstream scoring. */
  inheritedFacetWeight: number;
  /** Multiplicative fuzz on rank. Published guidance is 1.5–3. */
  ditherEpsilon: number;
  issuance: {
    /** exp(-α · times issued). */
    frequencyDecay: number;
    /** How much of the score recency can take, at most. */
    recencyWeight: number;
    /** Days for the recency penalty to halve. */
    recencyHalfLifeDays: number;
    /** Never discount below this, or a thing issued once is dead forever. */
    floor: number;
  };
  /** How much resembling something already placed costs a candidate. */
  similarityDiscount: number;
  beamWidth: number;
  /** How many local swaps a collision may cost before we give up. */
  maxBacktracks: number;
  /** Below this destination score, flag for mandatory curator review. */
  lowConfidenceScore: number;
  seed: number | null;
  now: Date | null;
};

export const DEFAULT_OPTIONS: EngineOptions = {
  candidateCount: 3,
  statedWeight: 0.55,
  cohortPriorStrength: 8,
  softNegativeRatio: 0.2,
  inheritedFacetWeight: 0.35,
  ditherEpsilon: 2,
  issuance: {
    frequencyDecay: 0.15,
    recencyWeight: 0.6,
    recencyHalfLifeDays: 45,
    floor: 0.05,
  },
  similarityDiscount: 0.5,
  beamWidth: 6,
  maxBacktracks: 8,
  lowConfidenceScore: 0.18,
  seed: null,
  now: null,
};

export function withDefaults(
  overrides: Partial<EngineOptions> = {}
): EngineOptions {
  return {
    ...DEFAULT_OPTIONS,
    ...overrides,
    issuance: { ...DEFAULT_OPTIONS.issuance, ...(overrides.issuance ?? {}) },
  };
}
