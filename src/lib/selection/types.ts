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

import type { CourseChooser } from "./compose.ts";

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
  /**
   * EVERY ANSWER THE VENUE GATE READS, including `environment` again — db/049.
   *
   * `environment` stays where it is because a dozen readers already reach for
   * it there and it is a fact about the application, not only about the gate.
   * This is the SET the gate consumes, assembled once so that no caller has to
   * know which four columns those are; `composeVenue()` is the only thing that
   * reads it. Three of the four are null on any response written before
   * 2026-08-h, which means she was never asked and prunes nothing.
   */
  venueAnswers: VenueAnswers;
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

// ── the emphasis ─────────────────────────────────────────────────────

/** The six answers to "what do you want more of". AFFINITIES in quiz.ts. */
export type EmphasisCode =
  | "one_moment"
  | "ease"
  | "beauty"
  | "ritual"
  | "wit"
  | "late";

/**
 * WHICH DELIVERABLE SHE VALUES — and emphatically not a taste.
 *
 * "It's the only question on the quiz that tells you which deliverable she
 * values, and averaging it into taste weights discards exactly that."
 *
 * Built by src/lib/selection/emphasis.ts, which carries the whole mapping and
 * the argument for it. Consumed at stage 4 (the plan promotes the guaranteed
 * slots) and by the voice layer (`attention`). It never touches the preference
 * vector, and `affinity` is a non-taste dimension in vector.ts so that it
 * cannot.
 */
export type Emphasis = {
  /** What she tapped, in vocabulary order. */
  codes: EmphasisCode[];
  /**
   * slot_kind codes promoted from optional to required — which is what a slot
   * weight means in a beam search. See emphasis.ts on why this is a guarantee
   * and not a multiplier.
   */
  guaranteed: string[];
  /** What the writer must spend its attention on. The voice layer's half. */
  attention: string[];
  /** For the curator, in the founder's own sentences. Reaches explain(). */
  notes: string[];
  /**
   * "A ritual we repeat next year" — the highest-LTV answer on the quiz. Also
   * recorded on the MEMBER RECORD by db/020, because it is a fact about her
   * rather than about this evening.
   */
  repeatable: boolean;
  /** "Everything already handled". Forces the sleight-of-hand tier. */
  effortless: boolean;
  /** How The Prep is written. `brief` is what `ease` buys. */
  prepRegister: "brief" | "full";
  /** Product budget shifted toward tabletop. */
  tabletop: boolean;
  /** The Soundtrack arc extends and The Ending moves late. */
  runsLate: boolean;
  /**
   * "An inside joke, made real" — WHICH THE CATALOGUE CANNOT SATISFY. Her free
   * text is weighted up in the writer prompt and a follow-up is owed. Nothing
   * is ever selected to stand in for it.
   */
  needsHerMaterial: boolean;
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

/**
 * ONE STRUCTURAL DEMAND AN INGREDIENT MAKES OF THE ROOM — db/020.
 *
 * NOT A TASTE, and deliberately not a facet. A facet is something she can have
 * an opinion about and something a destination can be tagged with; "needs a
 * kitchen" is neither. Keeping these out of the facet vocabulary is what stops
 * them being scored by accident — `facetOverlap` and `similarity` both read
 * `facets`, and two menus that both need an oven are not thereby similar.
 *
 * See src/lib/selection/venue.ts for the rule, and db/020 for the five terms.
 */
export type StructuralRequirement = {
  /** structural_requirement.code — 'requires_outdoors', 'outdoor_access', … */
  code: string;
  /** "Needs a full kitchen". For a curator. */
  label: string;
  /**
   * The verb phrase that completes "it …" in a rejection sentence: "needs to
   * be outdoors", "needs a door to somewhere". Held on the row so the reading
   * of a code is never inferred from its name — which mattered most for the two
   * codes that were nouns rather than requirements, `noise_ceiling` and
   * `deposit_safe`, and still matters: `outdoor_access` is a grade and not a
   * synonym for the flag above it.
   */
  demand: string;
  /** The curator's note on THIS ingredient carrying it, when there is one. */
  note: string | null;
};

/**
 * THE ROOM SHE IS ACTUALLY IN — db/020's venue_affordance, for her answer.
 *
 * It never scores anything. It is a set of yes/no affordances, consumed once,
 * at stage 3, as a filter over the pool. Null on the snapshot means the house
 * does not know the room and nothing is pruned.
 */
export type Venue = {
  /** environment_type. Her answer, verbatim. */
  environment: string;
  /** "An apartment". For a sentence. */
  label: string;
  /** requirement code -> does this room afford it. Missing means yes. */
  provides: Record<string, boolean>;
  /** requirement code -> why not, in the house's words. */
  notes: Record<string, string>;
  /**
   * requirement code -> WHICH ANSWER refused it: `environment`,
   * `indoor_outdoor`, `water_access`, `water_use`. db/049.
   *
   * It exists for one sentence and it is worth the field. Before db/049 every
   * refusal came from the room, so "impossible in an apartment" was always
   * true. It is now sometimes false in a way that misleads: a float refused
   * because she has no pool has nothing to do with her house, and telling a
   * curator the house was the problem sends her to fix the wrong thing.
   *
   * Optional because a Venue assembled by hand in a test is not lying when it
   * omits provenance — it simply has none, and the sentence falls back to the
   * room, which is what every refusal in the catalogue was until today.
   */
  refusedBy?: Record<string, string>;
};

/**
 * One row of `host_affordance` — db/049.
 *
 * What ONE ANSWER says about ONE requirement. There is no third boolean state:
 * an option that makes no claim has NO ROW, which is how "Still deciding" is
 * expressed and why it can never be read as "none".
 */
export type HostAffordance = {
  /** The quiz field the answer belongs to. `indoor_outdoor`, `water_access`, … */
  readonly quizField: string;
  readonly optionCode: string;
  readonly requirement: string;
  readonly provided: boolean;
  readonly note: string;
};

/**
 * The venue-shaped answers on one application — db/049.
 *
 * Null means SHE WAS NEVER ASKED (a response written against a quiz version
 * before 2026-08-h), which is the same thing as "Still deciding" for every
 * purpose the engine has: no claim, nothing pruned.
 */
export type VenueAnswers = {
  /** environment_type, and the only one of the four that predates db/049. */
  readonly environment: string;
  readonly indoorOutdoor: string | null;
  readonly waterAccess: string | null;
  readonly waterUse: string | null;
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

/**
 * How an ingredient behaves under one destination — stage 3.
 *
 * THREE STATES, NOT TWO, and the third one is what makes docs/drinks.md true:
 * "Havana's daiquiris are not an option at the Dolomites." `forbidden` vetoes,
 * `native` CLAIMS, and a row that does neither is a weight and nothing more.
 * The rule over the three is claimEligibility() in occasion.ts, which is the
 * same rule the occasion and slot axes run. See db/019.
 */
export type WorldScope = {
  forbidden: boolean;
  /**
   * WRITTEN FOR THIS DESTINATION. Any native row turns the whole set into a
   * whitelist: the ingredient is eligible only where it claims.
   *
   * Optional so that a snapshot assembled by hand stays valid without being
   * edited — same concession `printedMatter` makes, and it means the same
   * thing as false: this row makes no claim.
   */
  native?: boolean;
  /** Signed -1..1, consumed as an additive term. No row means zero. */
  affinity: number;
  /**
   * The destination's name, carried for one sentence: "written for HAVANA, THE
   * SMALL HOURS, not for PORT CLYDE" in a catalogue gap. A read-time join
   * result, not a second copy of anything — `Facet.label` and
   * `Destination.name` are carried the same way and for the same reason.
   */
  name?: string | null;
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
   * THE TWO AXES A COMPOSED TABLE HAS TO AGREE ON — db/022.
   *
   * `season` is season_band and `making` is making_level (cooking_level on a
   * menu, which has the same members and is the same axis under db/012's older
   * name). Both are null in a pool that carries neither, which is products,
   * games and tracklists.
   *
   * READ AS COLUMNS RATHER THAN DUG OUT OF `facets`, even though both are also
   * projected there. The facet is what SCORES — a weight against her vector,
   * exactly as db/016 insists — and these are what CONSTRAIN a set: three
   * courses have to land on one season and one rung or they are not one table.
   * Reading a constraint back out of a scoring weight would make the two
   * inseparable, and the first change to either would silently be a change to
   * both.
   *
   * Optional, so that a snapshot assembled by hand — every fixture in
   * selection.test.ts — stays valid without being edited. Absent means the same
   * as null: this ingredient makes no claim on that axis and agrees with
   * anything.
   */
  season?: string | null;
  making?: string | null;
  /**
   * IS THAT SEASON A GATE OR A LEAN — `season_strict`, db/012, 017 and 021.
   *
   * THE SECOND HALF OF `season`, AND THE HALF THAT MAKES IT A FILTER. db/012
   * carried both from the start and said why there are two: "some menus are
   * merely seasonal and some are wrong out of season, and collapsing them would
   * either make every menu seasonal or none of them." A clambake in February is
   * the second kind. A menu that merely reads like autumn is the first.
   *
   * So it is read HERE, as a column, beside `season` and for the same reason:
   * the facet projected from `season` is what SCORES, and this is what says
   * whether the season may also REFUSE. Reading a filter out of a scoring
   * weight would make the two inseparable.
   *
   * Optional, and absent means false — a season that leans and does not gate,
   * which is both the database's default and the safe one. A hand-built fixture
   * that omits it is making the weaker claim, which is the one to make when
   * nobody has decided.
   */
  seasonStrict?: boolean;
  /**
   * WHICH SHAPES OF TABLE THIS CLAIMS — `dish_meal`, db/023. Dishes only.
   *
   * EMPTY MEANS EVERY SHAPE, which is claimEligibility()'s own default and the
   * reason 650 authored lines that carry no fourth field are correct rather
   * than incomplete. Any claim makes the set a whitelist.
   *
   * Optional, and absent means the same as empty.
   */
  meals?: readonly string[];
  /**
   * WHAT GETS PRINTED, when this ingredient brings objects with it.
   *
   * Optional rather than an empty array, so that a snapshot assembled by hand
   * — every fixture in selection.test.ts, every caller written before db/010
   * grew the table — stays valid without being edited. Absent and empty mean
   * the same thing to every reader: this ingredient prints nothing.
   */
  printedMatter?: readonly PrintedPiece[];
  /**
   * WHAT THE ROOM HAS TO PROVIDE — db/020, and the venue's only lever.
   *
   * Optional rather than an empty array, and absent means the same as empty:
   * this ingredient works anywhere. That is the safe default and it is the one
   * the founder asked for by name — where tagging is a judgement call, leave it
   * untagged rather than guess, because a wrong tag deletes a deliverable
   * silently and a missing one costs a second look.
   */
  requirements?: readonly StructuralRequirement[];
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
  /**
   * occasion_slot.offer_count — db/061. HOW MANY CANDIDATES THIS BEAT OFFERS
   * HER, as an OR and never an AND.
   *
   * 1 — the default, and what every slot but the game meant before db/061 —
   * is the house placing it. 3 means she is shown three and one of them is
   * hers; all three are delivered, because the OFFER is what uniqueness binds
   * on and a choice made after delivery must never be refusable.
   *
   * It does not interact with minCount/maxCount, which still say how many
   * ITEMS the beat contains. A slot asking for one to three edit items and
   * offering one candidate each is three objects; the game slot asking for one
   * and offering three is one game.
   *
   * Optional so a snapshot assembled by hand stays valid, and absent means 1.
   */
  offerCount?: number;
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
  /**
   * slot_kind.coherence_group — db/022. Slots that must agree WITH EACH OTHER
   * rather than each agreeing with her separately. The three courses share
   * 'the_table': one season and one rung of the making axis across all of them,
   * because a table that is two-thirds bought and one-third actually made is
   * not an answer to a question she was asked once.
   *
   * Optional, and absent means the same as null: this slot answers to nobody.
   */
  coherenceGroup?: string | null;
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
  /**
   * PROMOTED BY HER EMPHASIS — she asked for this deliverable by name.
   *
   * Carried separately from `required` even though it sets it, because the two
   * are different facts and a curator reading "forced" needs to know which one
   * she is looking at: `required` is the occasion's shape, this is her answer.
   */
  guaranteed?: boolean;
  /** slot_kind.coherence_group — db/022. Carried from the rule unchanged. */
  coherenceGroup?: string | null;
  /**
   * WHICH SET OF ALTERNATIVES THIS UNIT BELONGS TO — db/061, and null for
   * everything the house simply places.
   *
   * Units sharing an offerGroup are an OR. She receives all of them and one
   * of them runs, so they must be read as ONE BEAT wherever the count of
   * beats matters — the scheduled-game cap in fill.ts is the case that
   * proves it, and the reason this is a field rather than something derived
   * from the key at each call site (CLAUDE.md rule 21).
   *
   * The first unit of a group carries the beat's `required`; the rest are
   * optional, which is exactly how a room with two eligible games offers two
   * without a gap, an error, or a repeat.
   */
  offerGroup?: string | null;
  /**
   * Where this unit sits in the carousel. 0 for anything not in an offer.
   *
   * STAMPED AT PLANNING AND NEVER RECOMPUTED, because CLAUDE.md rule 18 says
   * the UI may not move the target of a correction: the card she wants has to
   * be where it was the first time she looked, whatever she has clicked since.
   */
  offerIndex?: number;
  /**
   * db/069. WHAT KIND OF OFFER — true for db/061's carousel (one runs), false
   * for `any_of` (any non-empty subset runs), null for no offer.
   *
   * Absent on the forward path and present on the read-back, and that is not
   * an oversight: the kind is STAMPED on the delivered row at approval from
   * `occasion_slot.offer_rule`, so a plan has no stamp to report. See db/069.
   */
  offerExclusive?: boolean | null;
  /**
   * db/069. Which day SHE put it on, 1-based, or null for she has not said.
   * Only ever present on a read-back: the engine delivers and never schedules.
   */
  runDay?: number | null;
};

export type Catalogue = {
  facets: Record<string, Facet>;
  destinations: Destination[];
  ingredients: Ingredient[];
  slotRules: SlotRule[];
  shape: OccasionShape;
  /**
   * THE ROOM SHE IS IN, as affordances. Null when the house cannot resolve her
   * answer to a row, in which case nothing is pruned.
   *
   * On the CATALOGUE rather than on the Application on purpose: what an
   * apartment affords is the house's knowledge, not hers. She answered a
   * question about a room; the mapping from that answer to "there is no
   * outdoors" is db/020's, and it is a thing the house can be wrong about and
   * correct without reopening her application.
   *
   * Optional so that a snapshot assembled by hand stays valid without being
   * edited — the same concession `printedMatter` and `WorldScope.native` make,
   * and it means the same thing as null: no room is known, so nothing is
   * pruned.
   */
  venue?: Venue | null;
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
  /**
   * WHAT SHE SAID THAT THIS VECTOR DOES NOT SCORE.
   *
   * Every stated facet a NON_TASTE_DIMENSIONS rule kept out — the room she is
   * in, the money, the platform, the meal shape, and now the taste direction.
   * They are excluded from `weights` for the reasons written beside that list
   * in src/lib/selection/vector.ts, and they are kept HERE because "not scored"
   * and "not said" are different facts and something downstream needs the
   * difference.
   *
   * THE READER THAT PROVED IT NEEDED: voiceClashGap() in destination.ts keys a
   * catalogue gap on the AESTHETIC she asked for, and read it out of
   * `vector.terms`. The day `taste_direction` left the vector, that gap would
   * have started reporting an empty aesthetic — an instrument going quiet
   * without going red, which is exactly the failure CLAUDE.md rule 15 names.
   *
   * Never scored, by anything. A reader that wants to weight one of these has
   * misunderstood the list it came off.
   */
  unscored: Facet[];
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
  /**
   * SHE TOOK THIS ONE — db/061. Only ever meaningful inside an offer.
   *
   * NEVER SET BY THE ENGINE, and the absence is the point rather than an
   * omission: a run of the engine produces an OFFER, and the choice is a thing
   * that happens after delivery, in the portal, possibly weeks later and more
   * than once. The only writer is src/lib/portal/picks.ts reading `chosen_at`
   * off the join row.
   *
   * Optional, and absent means the same as false. It is on `Pick` rather than
   * on `UnitSlot` because it is a fact about the INGREDIENT that was placed —
   * the slot is the beat, and the beat is not chosen, one of its candidates
   * is.
   */
  chosen?: boolean;
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
    | "scheduled_cap"
    /**
     * A COMPOSED TABLE COULD NOT AGREE WITH ITSELF — db/022.
     *
     * The dish was eligible, affordable and well scored, and it was refused
     * because the season or the rung of the making axis the other courses had
     * already committed to is not its own. Never a CatalogueGap: the pool was
     * not thin, the table was.
     */
    | "table_disagreed";
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
  /**
   * WHICH TIER KILLED IT, and the two must never be collapsed into one list
   * that reads as "rejected".
   *
   *   dealbreaker  she said this would ruin it. A veto.
   *   occasion     the destination itself refuses this occasion.
   *   voice        it does not sound like her people. A TIER, not a low score:
   *                the tone filter runs before the aesthetic ranking and the
   *                aesthetic ranking cannot bring it back. See tone.ts.
   */
  tier: "dealbreaker" | "occasion" | "voice";
  /** The tone match, for a voice elimination. Null otherwise. */
  toneMatch: number | null;
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
  /**
   * WHICH DELIVERABLE SHE VALUES, and what was done about it.
   *
   * Its own list rather than folded into `forced`, because a curator reading a
   * candidate has to be able to see the one thing on the quiz that says what
   * she is buying — including the two answers the catalogue cannot satisfy on
   * its own, which arrive here as an owed follow-up rather than as silence.
   */
  emphasis: string[];
  /**
   * THE ROOM, and only ever what it removed. Never why a destination was
   * chosen: the venue does not touch the destination, and a sentence here
   * saying otherwise would be the first crack in the thesis.
   */
  venue: string[];
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
  /** Which deliverable she values. Never part of the vector. */
  emphasis: Emphasis;
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
  /**
   * THE STRUCTURAL EPSILON — how much nearer one room has to be before the
   * matrix is allowed to overturn the aesthetic order. See DEFAULT_OPTIONS for
   * where the number comes from; it is not a taste.
   *
   * A difference of ε OR LESS is a tie, and a tie is settled by the aesthetic
   * score with its issuance discount already taken. Anything wider is
   * structure's to decide. Without it a quarter-point near miss reads as a
   * verdict, which is the one thing the near band was priced not to be.
   */
  structureEpsilon: number;
  /**
   * THE VOICE BAR — the tier, in one number. Cosine, −1..1. See tone.ts.
   *
   * A destination whose tone match falls below this is OUT OF STAGE 2, at any
   * aesthetic score, and the dither cannot bring it back. Picked from the real
   * catalogue rather than from taste; the argument is on DEFAULT_OPTIONS below.
   */
  toneThreshold: number;
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
  /**
   * THE SEAM WHERE A MODEL CHOOSES — src/lib/selection/compose.ts, and absent
   * by default.
   *
   * "Rules narrow. A model chooses." Everything that narrows is deterministic
   * and runs whether this is set or not; this decides only which of the
   * survivors makes an EVENING rather than three individually permitted
   * dishes. Absent means the best-scoring survivor, which is what the search
   * takes on its own — absence is a ROUTE, not a fault, the same discipline
   * src/lib/music/ applies to Spotify.
   *
   * Optional rather than nullable-and-required so that DEFAULT_OPTIONS and
   * every hand-built options object stay valid unedited.
   */
  courseChooser?: CourseChooser | null;
};

export const DEFAULT_OPTIONS: EngineOptions = {
  candidateCount: 3,
  statedWeight: 0.55,
  cohortPriorStrength: 8,
  softNegativeRatio: 0.2,
  inheritedFacetWeight: 0.35,
  ditherEpsilon: 2,
  /**
   * 0.25, AND IT IS READ OFF THE ARITHMETIC ALREADY IN structure.ts.
   *
   * That file prices a cell at FULL = 1 and a NEAR miss at 0.25, and states
   * the intent in one sentence: "four near misses cost what one real mismatch
   * costs, so nearness can order two rooms that are otherwise tied and cannot
   * overturn a column she actually agreed with." This constant is that
   * sentence applied one layer up, where the overturning actually happens —
   * without it, the sentence is true of the distance and false of the ranking.
   *
   * THE REACHABLE DISTANCES, over the two columns a host feeds today
   * (`ending`, `starts`), every one of them a sum of 0, 0.25 and 1:
   *
   *   0      0.25      1      1.25      2
   *      ↑         ↑       ↑        ↑
   *    0.25      0.75    0.25     0.75      ← the gaps between neighbours
   *
   * A gap of 0.25 is ONE near miss and nothing else — today the single
   * `starts.late → evening` cell. A gap of 0.75 or more cannot be reached
   * without a column she actually disagreed on. So the band is closed at the
   * near miss (a difference of exactly 0.25 is a tie) and open above it, and
   * the two cases the founder named come out right: a 0.25 near-miss does not
   * look like a verdict, and a full mismatch does.
   *
   * IT DOES NOT MOVE AS COLUMNS ARE FED. A near miss is 0.25 whether two
   * columns are fed or nine, so this number stays put while `fedBy` fills in.
   * What changes is HOW MANY ROOMS SHARE A BAND, and that is the number to
   * watch — a band holding every survivor means structure decided nothing.
   */
  structureEpsilon: 0.25,
  /**
   * 0.20, AND HERE IS WHERE IT CAME FROM.
   *
   * STALE AS PRINTED. The table below was measured against THIRTEEN
   * destinations. CAP FERRAT has since been folded into CÔTE D'AZUR and the
   * library is twelve, so every row is a measurement of a catalogue that no
   * longer exists. The numbers are kept rather than edited because they are a
   * record of a measurement, not a claim about today — re-run
   * `npm run check:tone-threshold` and replace the block wholesale. See the
   * REFIT note at the bottom of this comment, which anticipated exactly this.
   *
   * Measured — `npm run check:tone-threshold` reprints this — against the
   * thirteen destinations that carried authored tone tags in
   * src/lib/destinations.ts, crossed with four thousand sampled host answers at
   * one to seven tiles each, which is the range the quiz allows. What the
   * number does to the surviving set is the only question worth asking of it:
   *
   *   bar    none    one    two   three+   median survivors
   *   0.00   0.0%   0.0%   0.0%  100.0%   11   — not a filter at all
   *   0.10   0.0%   0.0%   1.2%   98.8%    9
   *   0.15   0.0%   0.1%   2.8%   97.2%    8
   *   0.20   0.0%   0.1%   5.6%   94.3%    7   ← chosen
   *   0.25   0.0%   2.1%   7.2%   90.6%    6
   *   0.30   0.1%   4.6%  10.8%   84.5%    5
   *   0.40   1.6%  13.0%  22.2%   63.3%    3
   *   0.50   7.6%  33.0%  30.8%   28.6%    2   — a third of hosts down to one
   *
   * Three properties decided it, in this order:
   *
   *   1. IT MUST ACTUALLY CUT. At 0.20 the median host loses six of thirteen —
   *      close to half the library. That is a tier. At 0 nothing is removed and
   *      "voice wins" is a sentence in a comment.
   *   2. THE SHORTLIST MUST SURVIVE IT. The reveal shows two or three (there
   *      is no curator; the member picks),
   *      and the dither — the thing that stops two similar customers getting the
   *      same Revelle — is what needs them. With fewer than three survivors
   *      engine.ts reuses one and she is choosing between a thing and itself.
   *      94.3% of hosts keep three or more at 0.20; that collapses past 0.30.
   *   3. THE FALLBACK MUST BE EXCEPTIONAL. Nothing at all survives for 0.0% of
   *      hosts at 0.20, so the hard-clash path is a rare event the house learns
   *      from rather than a route the engine takes daily.
   *
   * The sanity check, on the founder's own example: a warm, loud, sentimental
   * group scores HAVANA 0.74, CATSKILLS 0.51, LAS VEGAS 0.42, NEW ORLEANS 0.39,
   * NEW YORK 0.32, NANTUCKET 0.25, TAHITI 0.21 — seven through — and cuts
   * WESTHAMPTON, 1976 at −0.28, CÔTE D'AZUR at −0.08 and BIG SUR at −0.07,
   * which are the driest and quietest destinations in the library and exactly
   * the ones that should not be written for people who cry at the toast.
   *
   * REFIT IT WHEN THE LIBRARY GROWS. The right number is a property of how
   * densely the catalogue covers the voice space, not a constant of nature. As
   * more destinations are authored the same bar will leave more survivors, and
   * the number to hold roughly steady is the "three+" column rather than 0.20.
   */
  toneThreshold: 0.2,
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
