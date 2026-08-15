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
};

export type OccasionShape = {
  occasion: OccasionCode;
  label: string;
  days: number;
  note: string;
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
  reason: "budget" | "pool_empty" | "collision" | "no_good_match";
  detail: string;
};

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

export type Explanation = {
  headline: string;
  destination: string[];
  eliminated: string[];
  forced: string[];
  dropped: string[];
  swapped: string[];
  budget: string[];
  gaps: string[];
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
  explanation: Explanation;
};

export type SelectionResult = {
  candidates: Candidate[];
  vector: PreferenceVector;
  eliminated: Elimination[];
  /** Set when dealbreakers left nothing at all. */
  impasse: string | null;
  seed: number;
  gaps: CatalogueGap[];
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
