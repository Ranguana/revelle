/**
 * The engine, tested without a database.
 *
 *   npm test
 *
 * Everything here builds its own catalogue out of plain objects, which is the
 * point of the snapshot shape in types.ts: if these tests needed rows, nobody
 * would change a scoring rule, because changing it would mean re-seeding a
 * database to find out what happened.
 *
 * What is asserted, deliberately: the PROPERTIES the spec argues for, not the
 * exact numbers the current constants happen to produce. "A dealbreaker
 * eliminates rather than penalises" must stay true when the weights are re-fit;
 * "PORT CLYDE scores 0.323" must not be something a re-fit has to update.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { chooseDestinations } from "./destination.ts";
import { runSelection } from "./engine.ts";
import { fillSlots, scopePools } from "./fill.ts";
import { memberRevelle, type MemberRevelle } from "./member.ts";
import { assemblageFingerprint, ensureNovel } from "./novelty.ts";
import { claimEligibility, planSlots } from "./occasion.ts";
import { dither, rng } from "./rng.ts";
import { inSeason, mealShape, seasonAgrees, statedSeason } from "./table.ts";
import {
  facetOverlap,
  issuanceMultiplier,
  issuancePenalty,
  similarity,
  similarityDiscount,
} from "./score.ts";
import { FIELDS } from "../quiz.ts";
import { matrixRow } from "../matrix.ts";
import { type StructuralRow } from "./structure.ts";
import { buildVector } from "./vector.ts";
import { composeVenue, statedAnswers, venueEligibility } from "./venue.ts";
import {
  withDefaults,
  type Catalogue,
  type Destination,
  type Facet,
  type Ingredient,
  type OccasionShape,
  type Scale,
  type SelectionInput,
  type SlotRule,
  type StatedFacet,
  type Venue,
} from "./types.ts";

// ── fixtures ─────────────────────────────────────────────────────────

const FACETS: Record<string, Facet> = {};
function facet(id: string, dimension: string, code: string): Facet {
  const f = { id, dimension, code, label: code.replace(/_/g, " ") };
  FACETS[id] = f;
  return f;
}

/*
 * HER GENERIC TASTE ANSWER, AND IT IS NOT `taste_direction` ANY MORE.
 *
 * These two are the stand-in "she said she likes this" facet in most of the
 * tests below, and what those tests are about is vector arithmetic — a soft
 * negative is a fifth of a positive, a dealbreaker comes from this application
 * only, an aesthetic ranks within the survivors. None of them is about which
 * dimension the answer came from.
 *
 * They were `taste_direction` until that dimension joined NON_TASTE_DIMENSIONS
 * (src/lib/selection/vector.ts, and the whole argument is there: nothing in the
 * catalogue is tagged in it, so her two or three terms sat in facetOverlap's
 * denominator and damped every term that DID match). A fixture on an excluded
 * dimension would have made seven tests assert the mechanics of a term that no
 * longer exists, so they moved to `mood`, which the catalogue really is tagged
 * in — one menu tag today, `cooking_smell`, and it is a scored dimension.
 *
 * MOVE THEM BACK the day the catalogue carries taste directions and that line
 * comes out of vector.ts. Until then the one test that is genuinely ABOUT the
 * dimension — the catalogue-gap keyed on the look she asked for — uses
 * DISCO_DIRECTION below, which is the real thing.
 */
const COASTAL = facet("f-coastal", "mood", "faded_coastal");
const DISCO = facet("f-disco", "mood", "disco_after_dark");
/** The real `taste_direction` answer, for the one test about the gap it files. */
const DISCO_DIRECTION = facet("f-disco-direction", "taste_direction", "disco_after_dark");
const NOVELTY = facet("f-novelty", "anti_preference", "novelty");
const EASE = facet("f-ease", "affinity", "ease");
const GUESTS = facet("f-guests", "guest_count", "from_9_to_12");
/** db/016's making axis. One signed facet, four answers on it. */
const MADE = facet("f-made", "making", "made_by_hand");

const OPTIONS = withDefaults({ seed: 42, now: new Date("2026-08-15T00:00:00Z") });

/**
 * A HOST WHO STATED NO STRUCTURAL COLUMN — which is what most of these tests
 * are, because most of them are about something else.
 *
 * It is passed explicitly rather than defaulted inside `chooseDestinations`,
 * and that is the point of the parameter being required: a test that means "the
 * matrix has nothing to say here" says so, and a test that forgot to think
 * about the matrix cannot compile. See the parameter's own note.
 */
const NO_STRUCTURE: StructuralRow = {};

/**
 * `weight` defaults to 1, which is what every answer to an unordered question
 * carries. The making axis is the first question with four answers on one
 * signed axis; pass a weight to build one of those.
 */
function stated(
  f: Facet,
  polarity: "positive" | "negative" = "positive",
  weight = 1
): StatedFacet {
  return {
    facetId: f.id,
    dimension: f.dimension,
    code: f.code,
    label: f.label,
    field: f.dimension,
    polarity,
    weight,
  };
}

function destination(
  id: string,
  name: string,
  facets: Record<string, number>
): Destination {
  return {
    id,
    slug: id,
    name,
    tagline: "",
    facets,
    occasions: [],
    issuance: null,
    isFixture: true,
  };
}

function ingredient(
  id: string,
  pool: string,
  name: string,
  facets: Record<string, number>,
  extra: Partial<Ingredient> = {}
): Ingredient {
  return {
    pool,
    id,
    slug: id,
    name,
    description: "",
    priceCents: 1000,
    facets,
    occasions: [],
    slots: [],
    worlds: {},
    issuance: null,
    minGuests: null,
    maxGuests: null,
    shape: null,
    isFixture: true,
    ...extra,
  };
}

const SCALE: Scale = {
  guestBand: "from_9_to_12",
  guestsLow: 9,
  guestsHigh: 12,
  guestsPlanning: 11,
  spendBand: "from_150_to_300",
  perPersonLow: 150,
  perPersonHigh: 300,
  perPersonPlanning: 225,
  budgetPlanning: 2475,
  budgetCeiling: 3600,
  retiredBudgetBand: null,
};

const SHAPE: OccasionShape = {
  occasion: "girls_weekend",
  label: "The weekend away",
  days: 3,
  note: "Three days.",
  // One block per day. db/010: the days are the blocks.
  scheduledGameMax: 3,
};

// ── the dither ───────────────────────────────────────────────────────

test("dither: epsilon 1 is exactly no dithering", () => {
  const items = [5, 4, 3, 2, 1];
  const result = dither(items, (n) => n, 1, rng(1));
  assert.deepEqual(
    result.map((r) => r.item),
    [5, 4, 3, 2, 1]
  );
  assert.deepEqual(
    result.map((r) => r.ditheredRank),
    [1, 2, 3, 4, 5]
  );
});

test("dither: the same seed is the same shortlist, and a different seed is not", () => {
  const items = Array.from({ length: 12 }, (_, i) => 12 - i);
  const a = dither(items, (n) => n, 2, rng(7)).map((r) => r.item);
  const b = dither(items, (n) => n, 2, rng(7)).map((r) => r.item);
  const c = dither(items, (n) => n, 2, rng(8)).map((r) => r.item);

  assert.deepEqual(a, b, "same seed must reproduce exactly — the seed is recorded");
  assert.notDeepEqual(a, c, "a different seed must be able to differ");
});

test("dither: leaves the top roughly alone and pulls deep candidates up", () => {
  const items = Array.from({ length: 20 }, (_, i) => 20 - i);
  let topStayedNearTop = 0;
  let deepSurfaced = 0;

  for (let seed = 0; seed < 300; seed += 1) {
    const result = dither(items, (n) => n, 2, rng(seed));
    const positionOfBest = result.findIndex((r) => r.rank === 1);
    if (positionOfBest < 3) topStayedNearTop += 1;
    if (result.slice(0, 3).some((r) => r.rank >= 8)) deepSurfaced += 1;
  }

  assert.ok(
    topStayedNearTop > 200,
    `the best candidate should usually stay near the top, was ${topStayedNearTop}/300`
  );
  assert.ok(
    deepSurfaced > 15,
    `a rank-8-or-deeper candidate should sometimes surface, was ${deepSurfaced}/300`
  );
});

// ── the arithmetic ───────────────────────────────────────────────────

test("facetOverlap: all four sign cases", () => {
  const likes = { [COASTAL.id]: 1 };
  const dislikes = { [COASTAL.id]: -1 };

  assert.ok(facetOverlap(likes, { [COASTAL.id]: 1 }) > 0, "likes it, is it");
  assert.ok(facetOverlap(likes, { [COASTAL.id]: -1 }) < 0, "likes it, repudiates it");
  assert.ok(facetOverlap(dislikes, { [COASTAL.id]: 1 }) < 0, "dislikes it, is it");
  assert.ok(
    facetOverlap(dislikes, { [COASTAL.id]: -1 }) > 0,
    "agreement about a no is worth points"
  );
});

test("facetOverlap: normalised, so a talkative customer does not inflate scores", () => {
  const thin = facetOverlap({ [COASTAL.id]: 1 }, { [COASTAL.id]: 1 });
  const chatty = facetOverlap(
    { [COASTAL.id]: 1, [EASE.id]: 1, [DISCO.id]: 1 },
    { [COASTAL.id]: 1 }
  );
  assert.ok(thin <= 1 && chatty <= 1);
  assert.ok(thin > chatty, "a shared facet is worth more when there are fewer of them");
});

test("issuanceMultiplier: never issued is exactly 1, and both features decay", () => {
  const now = new Date("2026-08-15T00:00:00Z");
  assert.equal(issuanceMultiplier(null, now, OPTIONS), 1);

  const once = issuanceMultiplier(
    { issueCount: 1, lastIssuedAt: "2026-08-14T00:00:00Z", customerCount: 1 },
    now,
    OPTIONS
  );
  const often = issuanceMultiplier(
    { issueCount: 10, lastIssuedAt: "2026-08-14T00:00:00Z", customerCount: 9 },
    now,
    OPTIONS
  );
  const longAgo = issuanceMultiplier(
    { issueCount: 1, lastIssuedAt: "2024-01-01T00:00:00Z", customerCount: 1 },
    now,
    OPTIONS
  );

  assert.ok(once < 1, "issued yesterday is discounted");
  assert.ok(often < once, "issued ten times is discounted harder");
  assert.ok(longAgo > once, "the recency half of the penalty fades");
  assert.ok(often >= OPTIONS.issuance.floor, "the floor keeps a good thing usable");
});

test("issuancePenalty: never improves a negative score", () => {
  assert.equal(issuancePenalty(-0.5, 0.2), 0);
  assert.ok(Math.abs(issuancePenalty(1, 0.25) - 0.75) < 1e-9);
});

test("similarityDiscount: proportional, and cannot flip a sign", () => {
  const a = { [COASTAL.id]: 1 };
  const b = { [COASTAL.id]: 1 };
  assert.ok(similarity(a, b) > 0.99, "identical tag sets are similar");

  const discount = similarityDiscount(0.1, a, [b], 0.5);
  assert.ok(discount <= 0.1, "a candidate worth 0.1 cannot lose more than 0.1");
  assert.equal(
    similarityDiscount(-0.4, a, [b], 0.5),
    0,
    "a negative candidate is not made better by resembling something"
  );
});

test("similarity: agreeing about a no is not resemblance", () => {
  const a = { [NOVELTY.id]: -1 };
  const b = { [NOVELTY.id]: -1 };
  assert.equal(similarity(a, b), 0);
});

// ── occasion and slot eligibility ────────────────────────────────────

test("eligibility: no claims means eligible everywhere", () => {
  assert.equal(claimEligibility([], "birthday", (k) => k).eligible, true);
});

test("eligibility: naming one native value opts into a whitelist", () => {
  const claims = [{ key: "birthday", fit: "native" as const, note: null }];
  assert.equal(claimEligibility(claims, "birthday", (k) => k).eligible, true);
  assert.equal(claimEligibility(claims, "getaway", (k) => k).eligible, false);
});

test("eligibility: a veto cannot be outvoted", () => {
  const claims = [
    { key: "getaway", fit: "native" as const, note: null },
    { key: "getaway", fit: "forbidden" as const, note: "no roof" },
  ];
  const verdict = claimEligibility(claims, "getaway", (k) => k);
  assert.equal(verdict.eligible, false);
  assert.match(verdict.reason, /no roof/);
});

// ── the slot plan ────────────────────────────────────────────────────

const SLOT_RULES: SlotRule[] = [
  {
    slotCode: "day_material",
    label: "The day",
    description: "",
    section: "details",
    perGuest: false,
    pool: "game",
    minCount: 1,
    maxCount: 1,
    required: true,
    perDay: true,
    position: 10,
    note: "",
    excludedBy: null,
  },
  {
    slotCode: "edit_item",
    label: "The edit",
    description: "",
    section: "edit",
    perGuest: false,
    pool: "product",
    minCount: 1,
    maxCount: 3,
    required: false,
    perDay: false,
    position: 20,
    note: "",
    excludedBy: null,
  },
  {
    slotCode: "favour",
    label: "What they take home",
    description: "",
    section: "edit",
    perGuest: true,
    pool: "product",
    minCount: 1,
    maxCount: 1,
    required: false,
    perDay: false,
    position: 30,
    note: "",
    excludedBy: null,
  },
  // db/014's excludable slot, with db/016's answer now able to remove it.
  // Required by the occasion, which is the interesting half: her answer wins.
  {
    slotCode: "the_menu",
    label: "The menu",
    description: "",
    section: "details",
    perGuest: false,
    pool: "menu",
    minCount: 1,
    maxCount: 1,
    required: true,
    perDay: false,
    position: 15,
    note: "",
    excludedBy: "no_food",
  },
];

test("planSlots: a per-day slot becomes one slot per day of the occasion", () => {
  const slots = planSlots(SLOT_RULES, SHAPE, SCALE).slots;
  const days = slots.filter((s) => s.slotCode === "day_material");
  assert.equal(days.length, 3);
  assert.deepEqual(
    days.map((s) => s.dayIndex),
    [1, 2, 3]
  );
  assert.ok(days.every((s) => s.required));
});

test("planSlots: min..max becomes one required slot and an optional tail", () => {
  const slots = planSlots(SLOT_RULES, SHAPE, SCALE).slots;
  const edit = slots.filter((s) => s.slotCode === "edit_item");
  assert.equal(edit.length, 3);
  assert.deepEqual(
    edit.map((s) => s.required),
    [false, false, false],
    "the rule is optional, so every unit of it is"
  );
});

test("planSlots: a per-head slot counts from the TOP of the guest band", () => {
  const slots = planSlots(SLOT_RULES, SHAPE, SCALE).slots;
  const favour = slots.find((s) => s.slotCode === "favour");
  assert.equal(favour?.quantity, 12, "guests_high, never guests_planning");

  const openTopped = planSlots(SLOT_RULES, SHAPE, {
    ...SCALE,
    guestsHigh: null,
    guestsPlanning: 75,
  }).slots;
  assert.equal(
    openTopped.find((s) => s.slotCode === "favour")?.quantity,
    75,
    "an open-topped band falls back to the planning number, to be confirmed"
  );
});

// ── slots she does not have ──────────────────────────────────────────

test("planSlots: a slot she opted out of is never in the plan, and is not a gap", () => {
  const plan = planSlots(SLOT_RULES, SHAPE, SCALE, ["no_food"]);

  assert.equal(
    plan.slots.filter((s) => s.slotCode === "the_menu").length,
    0,
    "removed before anything is scoped, so it can never go unfilled"
  );
  assert.equal(plan.excluded.length, 1);
  assert.equal(plan.excluded[0].slotCode, "the_menu");
  assert.equal(plan.excluded[0].exclusion, "no_food");
  assert.ok(
    plan.excluded[0].requiredByOccasion,
    "the occasion asked for it and she outranks the occasion"
  );
  assert.match(plan.excluded[0].detail, /this is not a gap/);

  // And everything else she did not opt out of is untouched.
  assert.ok(plan.slots.some((s) => s.slotCode === "day_material"));
});

test("planSlots: an exclusion nobody stated removes nothing", () => {
  const plan = planSlots(SLOT_RULES, SHAPE, SCALE, ["no_games"]);
  assert.equal(plan.excluded.length, 0, "no slot here is removed by no_games");
  assert.ok(plan.slots.some((s) => s.slotCode === "the_menu"));
});

test("an opted-out slot produces no gap; an unfillable one still does", () => {
  const vector = buildVector([stated(COASTAL)], [], [], FACETS, OPTIONS);
  const scope = (exclusions: string[]) => {
    const slots = planSlots(SLOT_RULES, SHAPE, SCALE, exclusions).slots;
    // An empty menu pool either way. The only difference is whether the slot
    // was ever in the plan.
    return fillSlots(
      scopePools(
        slots,
        [],
        destination("d1", "SOMEWHERE", {}),
        "girls_weekend",
        vector.weights,
        vector.dealbreakers,
        (id) => FACETS[id]?.label ?? id,
        SCALE,
        null,
        OPTIONS,
        OPTIONS.now!
      ),
      SCALE,
      SHAPE,
      OPTIONS
    );
  };

  assert.ok(
    scope([]).gaps.some((g) => g.slotCode === "the_menu"),
    "she wanted a menu and the pool could not fill it: a work order"
  );
  assert.equal(
    scope(["no_food"]).gaps.filter((g) => g.slotCode === "the_menu").length,
    0,
    "she is not serving food: there is nothing to author"
  );
});

// ── the preference vector ────────────────────────────────────────────

test("buildVector: the cohort recedes as her own evidence accumulates", () => {
  const cohorts = [
    {
      cohortId: "c1",
      slug: "c1",
      name: "Coastal restraint",
      weightShare: 1,
      confidence: 1,
      facets: { [COASTAL.id]: 0.9 },
    },
  ];

  const cold = buildVector([stated(EASE)], [], cohorts, FACETS, OPTIONS);

  const warm = buildVector(
    [stated(EASE)],
    Array.from({ length: 40 }, () => ({
      facetId: COASTAL.id,
      polarity: "positive" as const,
      strength: 1,
      confidence: 1,
      source: "observed" as const,
      context: "delivered_revelle",
      observedAt: "2026-01-01T00:00:00Z",
      subjectLabel: null,
      note: null,
    })),
    cohorts,
    FACETS,
    OPTIONS
  );

  assert.ok(cold.blend.cohort > warm.blend.cohort);
  assert.ok(
    cold.blend.cohort > cold.blend.history,
    "at application #1 the prior carries it"
  );
  assert.ok(
    warm.blend.history > warm.blend.cohort,
    "with forty of her own signals, she does"
  );
  assert.equal(cold.blend.stated, OPTIONS.statedWeight, "stated is always dominant");
});

test("buildVector: only THIS application's negatives become dealbreakers", () => {
  const vector = buildVector(
    [stated(COASTAL), stated(NOVELTY, "negative")],
    [
      {
        facetId: DISCO.id,
        polarity: "negative",
        strength: 1,
        confidence: 1,
        source: "curator",
        context: "conversation",
        observedAt: "2026-01-01T00:00:00Z",
        subjectLabel: null,
        note: null,
      },
    ],
    [],
    FACETS,
    OPTIONS
  );

  assert.deepEqual(vector.dealbreakers, [NOVELTY.id]);
  assert.ok(
    vector.weights[DISCO.id] < 0,
    "a history negative is a soft negative, not a veto"
  );
});

test("buildVector: a soft negative is worth about a fifth of a positive", () => {
  const vector = buildVector(
    [stated(COASTAL), stated(NOVELTY, "negative")],
    [],
    [],
    FACETS,
    OPTIONS
  );
  const ratio = Math.abs(vector.weights[NOVELTY.id] / vector.weights[COASTAL.id]);
  assert.ok(Math.abs(ratio - OPTIONS.softNegativeRatio) < 1e-9);
});

test("buildVector: an ordinal answer carries its own weight and its own sign", () => {
  const made = buildVector([stated(MADE, "positive", 1)], [], [], FACETS, OPTIONS);
  const leaning = buildVector([stated(MADE, "positive", 0.4)], [], [], FACETS, OPTIONS);
  const bought = buildVector([stated(MADE, "positive", -1)], [], [], FACETS, OPTIONS);

  assert.equal(made.weights[MADE.id], OPTIONS.statedWeight);
  assert.ok(
    Math.abs(leaning.weights[MADE.id] - OPTIONS.statedWeight * 0.4) < 1e-9,
    "mostly made is a weaker claim than actually made, not a different one"
  );
  assert.equal(bought.weights[MADE.id], -OPTIONS.statedWeight);
});

test("buildVector: a negative-weight answer is NOT a dealbreaker", () => {
  const bought = buildVector([stated(MADE, "positive", -1)], [], [], FACETS, OPTIONS);
  assert.deepEqual(
    bought.dealbreakers,
    [],
    "she asked for the other end of an axis; she did not veto anything"
  );

  // The contrast, so the difference is on the record: the SAME facet, asked
  // the way "what would ruin it" asks, does eliminate.
  const vetoed = buildVector([stated(MADE, "negative")], [], [], FACETS, OPTIONS);
  assert.deepEqual(vetoed.dealbreakers, [MADE.id]);
});

test("buildVector: a scale answer is a constraint and never a taste", () => {
  const vector = buildVector([stated(GUESTS)], [], [], FACETS, OPTIONS);
  assert.equal(
    vector.weights[GUESTS.id],
    undefined,
    "nothing in the catalogue is tagged in guest_count, so it must score against nothing"
  );
});

// ── stage 2 ──────────────────────────────────────────────────────────

test("a dealbreaker eliminates, and no score is high enough to survive it", () => {
  const vector = buildVector(
    [stated(COASTAL), stated(NOVELTY, "negative")],
    [],
    [],
    FACETS,
    OPTIONS
  );

  const perfect = destination("d1", "PERFECT BUT VETOED", {
    [COASTAL.id]: 1,
    [NOVELTY.id]: 0.1,
  });
  const modest = destination("d2", "MODEST BUT CLEAN", { [COASTAL.id]: 0.2 });

  const result = chooseDestinations(
    [perfect, modest],
    vector,
    "dinner_party",
    FACETS,
    OPTIONS,
    rng(1),
    OPTIONS.now!,
    NO_STRUCTURE
  );

  assert.deepEqual(
    result.shortlist.map((s) => s.destination.name),
    ["MODEST BUT CLEAN"]
  );
  assert.match(result.eliminated[0].reason, /would ruin it/);
});

test("a destination that REPUDIATES a dealbreaker is not eliminated by it", () => {
  const vector = buildVector([stated(NOVELTY, "negative")], [], [], FACETS, OPTIONS);
  const repudiates = destination("d1", "AGREES WITH HER", { [NOVELTY.id]: -0.9 });

  const result = chooseDestinations(
    [repudiates],
    vector,
    "dinner_party",
    FACETS,
    OPTIONS,
    rng(1),
    OPTIONS.now!,
    NO_STRUCTURE
  );

  assert.equal(result.shortlist.length, 1);
  assert.ok(result.shortlist[0].score > 0, "agreement about a no scores");
});

test("dealbreakers eliminating everything is an impasse, not a relaxation", () => {
  const vector = buildVector([stated(NOVELTY, "negative")], [], [], FACETS, OPTIONS);
  const only = destination("d1", "THE ONLY ONE", { [NOVELTY.id]: 0.8 });

  const result = chooseDestinations(
    [only],
    vector,
    "dinner_party",
    FACETS,
    OPTIONS,
    rng(1),
    OPTIONS.now!,
    NO_STRUCTURE
  );

  assert.equal(result.shortlist.length, 0);
  assert.ok(result.impasse);
  assert.match(result.impasse!, /Nothing was relaxed/);
});

// ── stages 3 and 4 ───────────────────────────────────────────────────

function poolsFor(ingredients: Ingredient[], scale: Scale = SCALE) {
  const vector = buildVector([stated(COASTAL)], [], [], FACETS, OPTIONS);
  const slots = planSlots(SLOT_RULES, SHAPE, scale).slots;
  return {
    slots,
    pools: scopePools(
      slots,
      ingredients,
      destination("d1", "SOMEWHERE", {}),
      "girls_weekend",
      vector.weights,
      vector.dealbreakers,
      (id) => FACETS[id]?.label ?? id,
      scale,
      null,
      OPTIONS,
      OPTIONS.now!
    ),
  };
}

test("scoping: forbidden under this destination is a filter, not a low score", () => {
  const banned = ingredient("i1", "game", "Banned here", { [COASTAL.id]: 1 }, {
    worlds: { d1: { forbidden: true, affinity: 0, note: "wrong register" } },
  });
  const fine = ingredient("i2", "game", "Fine", { [COASTAL.id]: 0.1 });

  const { pools } = poolsFor([banned, fine]);
  const day1 = [...pools.values()].find((p) => p.slot.slotCode === "day_material")!;
  assert.deepEqual(
    day1.candidates.map((c) => c.ingredient.name),
    ["Fine"]
  );
});

/**
 * ── THE DESTINATION IS A WHITELIST, NOT A WEIGHT ─────────────────────
 *
 * docs/drinks.md promises "Havana's daiquiris are not an option at the
 * Dolomites", and until db/019 the schema could not say it: `affinity` is an
 * additive term in the score, so a drink written for HAVANA stayed eligible
 * everywhere and merely came second. The proof that it was not a guarantee is
 * the first test below — withdraw the competition and the thing is placed.
 */

test("scoping: an ingredient written for somewhere else is not merely outscored", () => {
  const elsewhere = ingredient("i1", "game", "Havana's own", { [COASTAL.id]: 1 }, {
    worlds: {
      d2: { native: true, forbidden: false, affinity: 1, name: "HAVANA", note: null },
    },
  });

  // The ONLY candidate in the pool. Under a weight there is nothing to lose to,
  // and it is placed; under a claim the slot goes unfilled and the house is
  // told the pool is thin. The second is what the document promised.
  const { pools } = poolsFor([elsewhere]);
  const day1 = [...pools.values()].find((p) => p.slot.slotCode === "day_material")!;
  assert.equal(day1.candidates.length, 0);
  assert.ok(day1.gap, "a required slot nothing may fill is a catalogue gap");
  assert.match(day1.gap!.detail, /written for HAVANA, not for SOMEWHERE/);
});

test("scoping: a native claim to THIS destination is eligible, and still weighs", () => {
  const home = ingredient("i1", "game", "Ours", { [COASTAL.id]: 1 }, {
    worlds: {
      d1: { native: true, forbidden: false, affinity: 1, name: "SOMEWHERE", note: null },
    },
  });
  const { pools } = poolsFor([home]);
  const day1 = [...pools.values()].find((p) => p.slot.slotCode === "day_material")!;
  assert.equal(day1.candidates.length, 1);
  assert.equal(
    day1.candidates[0].affinity,
    1,
    "the claim does not consume the weight — they are different columns"
  );
});

test("scoping: a positive affinity alone is NOT a claim", () => {
  // ART BATTLE at WESTHAMPTON, +0.4, "the house would allow it". A permission,
  // not an ownership claim, and reading it as one would delete the game from
  // every other destination in the library. This is the whole reason db/019 is
  // a column and not a threshold on the weight.
  const allowed = ingredient("i1", "game", "Art battle", { [COASTAL.id]: 1 }, {
    worlds: {
      d2: { forbidden: false, affinity: 0.4, name: "WESTHAMPTON", note: null },
    },
  });
  const { pools } = poolsFor([allowed]);
  const day1 = [...pools.values()].find((p) => p.slot.slotCode === "day_material")!;
  assert.deepEqual(
    day1.candidates.map((c) => c.ingredient.name),
    ["Art battle"]
  );
});

test("scoping: an untagged ingredient stays eligible everywhere", () => {
  const global = ingredient("i1", "game", "Anywhere", { [COASTAL.id]: 1 });
  const { pools } = poolsFor([global]);
  const day1 = [...pools.values()].find((p) => p.slot.slotCode === "day_material")!;
  assert.equal(day1.candidates.length, 1);
});

test("scoping: a veto somewhere else does not become a whitelist", () => {
  // The occasion axis behaves this way and the destination axis must match: an
  // ingredient forbidden at one destination and silent about the rest makes no
  // claim about the rest.
  const vetoedElsewhere = ingredient("i1", "game", "Not there", { [COASTAL.id]: 1 }, {
    worlds: { d2: { forbidden: true, affinity: 0, name: "WESTHAMPTON", note: null } },
  });
  const { pools } = poolsFor([vetoedElsewhere]);
  const day1 = [...pools.values()].find((p) => p.slot.slotCode === "day_material")!;
  assert.equal(day1.candidates.length, 1);
});

test("scoping: a veto here outranks a claim here", () => {
  const contradictory = ingredient("i1", "game", "Both", { [COASTAL.id]: 1 }, {
    worlds: {
      d1: { native: true, forbidden: true, affinity: 1, name: "SOMEWHERE", note: "no" },
    },
  });
  const { pools } = poolsFor([contradictory]);
  const day1 = [...pools.values()].find((p) => p.slot.slotCode === "day_material")!;
  assert.equal(day1.candidates.length, 0);
});

test("scoping: a group-size limit is a constraint, and it says so", () => {
  const tooBig = ingredient("i1", "game", "Parlour game for four", { [COASTAL.id]: 1 }, {
    maxGuests: 4,
  });
  const { pools } = poolsFor([tooBig]);
  const day1 = [...pools.values()].find((p) => p.slot.slotCode === "day_material")!;
  assert.equal(day1.candidates.length, 0);
  assert.ok(day1.gap, "an empty required pool is a catalogue gap");
  assert.match(day1.gap!.detail, /tops out at 4 people and there are 12/);
});

/**
 * THE MAKING AXIS, END TO END OVER ONE POOL.
 *
 * Four menus at the four authored levels, and the same host answering the
 * question two different ways. The pool does not change; the order does, and
 * nothing is ever removed from it — which is the whole instruction: a host who
 * wants everything bought is shown the most finished things there are, not an
 * empty table.
 */
test("the making axis reorders the pool and never empties it", () => {
  const menus = [
    ingredient("m-actually", "menu", "Actually made", { [MADE.id]: 1 }),
    ingredient("m-mostly", "menu", "Mostly made", { [MADE.id]: 0.4 }),
    ingredient("m-half", "menu", "Half made", { [MADE.id]: -0.4 }),
    ingredient("m-bought", "menu", "Bought and arranged", { [MADE.id]: -1 }),
  ];

  const rank = (answerWeight: number) => {
    const vector = buildVector(
      [stated(MADE, "positive", answerWeight)],
      [],
      [],
      FACETS,
      OPTIONS
    );
    const slots = planSlots(SLOT_RULES, SHAPE, SCALE).slots;
    const pools = scopePools(
      slots,
      menus,
      destination("d1", "SOMEWHERE", {}),
      "girls_weekend",
      vector.weights,
      vector.dealbreakers,
      (id) => FACETS[id]?.label ?? id,
      SCALE,
      null,
      OPTIONS,
      OPTIONS.now!
    );
    const menu = [...pools.values()].find((p) => p.slot.slotCode === "the_menu")!;
    return menu.candidates.map((c) => c.ingredient.name);
  };

  assert.deepEqual(rank(1), [
    "Actually made",
    "Mostly made",
    "Half made",
    "Bought and arranged",
  ]);
  assert.deepEqual(
    rank(-1),
    ["Bought and arranged", "Half made", "Mostly made", "Actually made"],
    "the ladder inverts whole, which four independent facets could not do"
  );
  assert.equal(
    rank(-1).length,
    menus.length,
    "nothing is eliminated: a weight, not a filter"
  );
});

test("a thin pool is a catalogue gap and never an error", () => {
  const { pools } = poolsFor([]);
  const fill = fillSlots(pools, SCALE, SHAPE, OPTIONS);
  assert.equal(fill.picks.length, 0);
  assert.ok(fill.gaps.length > 0);
  assert.ok(fill.gaps.some((g) => g.required));
});

test("the budget is carried: nothing is placed that breaks the ceiling", () => {
  const scale: Scale = { ...SCALE, budgetPlanning: 40, budgetCeiling: 50 };
  const dear = ingredient("i1", "game", "Dear", { [COASTAL.id]: 1 }, {
    priceCents: 100_00,
  });
  const cheap = ingredient("i2", "game", "Cheap", { [COASTAL.id]: 0.9 }, {
    priceCents: 5_00,
  });
  const cheaper = ingredient("i3", "game", "Cheaper", { [COASTAL.id]: 0.8 }, {
    priceCents: 4_00,
  });
  const cheapest = ingredient("i4", "game", "Cheapest", { [COASTAL.id]: 0.7 }, {
    priceCents: 3_00,
  });

  const { pools } = poolsFor([dear, cheap, cheaper, cheapest], scale);
  const fill = fillSlots(pools, scale, SHAPE, OPTIONS);

  assert.ok(fill.cost <= 50_00, `spent ${fill.cost}, ceiling 5000`);
  assert.ok(
    !fill.picks.some((p) => p.ingredient.name === "Dear"),
    "the best match was unaffordable and was not placed"
  );
  assert.ok(
    fill.dropped.some((d) => d.reason === "budget"),
    "and the engine says so"
  );
});

test("the lookahead reserves for required slots before spending on optional ones", () => {
  // Three required day slots at $10 each and a ceiling of $35 leave $5. An
  // optional $20 edit item must not be allowed to eat the soundtrack's money.
  const scale: Scale = { ...SCALE, budgetPlanning: 35, budgetCeiling: 35 };
  const day = (n: number) =>
    ingredient(`d${n}`, "game", `Day thing ${n}`, { [COASTAL.id]: 0.9 }, {
      priceCents: 10_00,
    });
  const dearEdit = ingredient("e1", "product", "Dear edit", { [COASTAL.id]: 1 }, {
    priceCents: 20_00,
  });

  const { pools } = poolsFor([day(1), day(2), day(3), dearEdit], scale);
  const fill = fillSlots(pools, scale, SHAPE, OPTIONS);

  assert.equal(
    fill.picks.filter((p) => p.slot.slotCode === "day_material").length,
    3,
    "every required day is filled"
  );
  assert.ok(fill.cost <= 35_00);
});

// ── stage 5 ──────────────────────────────────────────────────────────

test("the fingerprint is over the SET: order and repetition change nothing", () => {
  const a = assemblageFingerprint("w1", [
    { pool: "product", id: "p1" },
    { pool: "game", id: "g1" },
  ]);
  const b = assemblageFingerprint("w1", [
    { pool: "game", id: "g1" },
    { pool: "product", id: "p1" },
    { pool: "product", id: "p1" },
  ]);
  const c = assemblageFingerprint("w2", [
    { pool: "product", id: "p1" },
    { pool: "game", id: "g1" },
  ]);

  assert.equal(a, b, "reordering is the same assemblage");
  assert.notEqual(a, c, "a different destination is a different assemblage");
  assert.match(a!, /^a1:[0-9a-f]{64}$/);
  assert.equal(assemblageFingerprint(null, []), null, "nothing to hash is null");
});

test("a collision swaps the least load-bearing ingredient and does not restart", () => {
  const scale: Scale = { ...SCALE, budgetCeiling: null };
  const ingredients = [
    ingredient("g1", "game", "Day one", { [COASTAL.id]: 0.9 }),
    ingredient("g2", "game", "Day two", { [COASTAL.id]: 0.8 }),
    ingredient("g3", "game", "Day three", { [COASTAL.id]: 0.7 }),
    ingredient("g4", "game", "Day spare", { [COASTAL.id]: 0.6 }),
    ingredient("p1", "product", "Edit one", { [COASTAL.id]: 0.5 }),
    ingredient("p2", "product", "Edit two", { [COASTAL.id]: 0.45 }),
    ingredient("p3", "product", "Edit three", { [COASTAL.id]: 0.4 }),
    ingredient("p4", "product", "Edit four", { [COASTAL.id]: 0.35 }),
    ingredient("p5", "product", "Edit five", { [COASTAL.id]: 0.3 }),
    ingredient("p6", "product", "Edit six", { [COASTAL.id]: 0.25 }),
  ];

  const { pools } = poolsFor(ingredients, scale);
  const fill = fillSlots(pools, scale, SHAPE, OPTIONS);
  const before = fill.picks;
  const print = assemblageFingerprint(
    "d1",
    before.map((p) => ({ pool: p.ingredient.pool, id: p.ingredient.id }))
  )!;

  const outcome = ensureNovel(
    before,
    pools,
    "d1",
    new Set([print]),
    scale,
    OPTIONS
  );

  assert.ok(outcome.novel, "it found a way through");
  assert.notEqual(outcome.fingerprint, print);
  assert.equal(outcome.swaps.length, 1, "one swap, not a new search");

  const changed = outcome.picks.filter(
    (p, i) => before[i]?.ingredient.id !== p.ingredient.id
  );
  assert.equal(changed.length, 1, "exactly one position moved");
  assert.ok(
    !changed[0].slot.required || before.every((p) => p.slot.required),
    "an optional slot moves before a required one"
  );
});

test("when a slot has nothing left to swap in, an optional pick is dropped instead", () => {
  const scale: Scale = { ...SCALE, budgetCeiling: null };
  // Exactly as many ingredients as slots: every alternative is already placed,
  // so no swap is available anywhere and the only way out is to let something
  // go. Still local, still not a restart.
  const ingredients = [
    ingredient("g1", "game", "Day one", { [COASTAL.id]: 0.9 }),
    ingredient("g2", "game", "Day two", { [COASTAL.id]: 0.8 }),
    ingredient("g3", "game", "Day three", { [COASTAL.id]: 0.7 }),
    ingredient("p1", "product", "Edit one", { [COASTAL.id]: 0.5 }),
  ];

  const { pools } = poolsFor(ingredients, scale);
  const fill = fillSlots(pools, scale, SHAPE, OPTIONS);
  const print = assemblageFingerprint(
    "d1",
    fill.picks.map((p) => ({ pool: p.ingredient.pool, id: p.ingredient.id }))
  )!;

  const outcome = ensureNovel(
    fill.picks,
    pools,
    "d1",
    new Set([print]),
    scale,
    OPTIONS
  );

  assert.ok(outcome.novel);
  assert.equal(outcome.dropped.length, 1);
  assert.equal(outcome.dropped[0].reason, "collision");
  assert.equal(outcome.picks.length, fill.picks.length - 1);
});

test("no collision means no swap and no wasted work", () => {
  const { pools } = poolsFor([
    ingredient("g1", "game", "Day one", { [COASTAL.id]: 0.9 }),
  ]);
  const fill = fillSlots(pools, SCALE, SHAPE, OPTIONS);
  const outcome = ensureNovel(
    fill.picks,
    pools,
    "d1",
    new Set(),
    SCALE,
    OPTIONS
  );
  assert.equal(outcome.attempts, 0);
  assert.equal(outcome.swaps.length, 0);
});

// ── end to end, still without a database ─────────────────────────────

function inputFor(
  overrides: Partial<Catalogue> = {},
  application: Partial<SelectionInput["application"]> = {}
): SelectionInput {
  const catalogue: Catalogue = {
    facets: FACETS,
    destinations: [
      destination("d1", "ONE", { [COASTAL.id]: 0.9, [EASE.id]: 0.4 }),
      destination("d2", "TWO", { [COASTAL.id]: 0.5 }),
      destination("d3", "THREE", { [DISCO.id]: 0.9 }),
    ],
    ingredients: [
      ingredient("g1", "game", "A day thing", { [COASTAL.id]: 0.8 }),
      ingredient("g2", "game", "Another day thing", { [EASE.id]: 0.7 }),
      ingredient("g3", "game", "A third day thing", { [COASTAL.id]: 0.3 }),
      ingredient("p1", "product", "An edit item", { [COASTAL.id]: 0.6 }),
      ingredient("p2", "product", "A favour", { [EASE.id]: 0.5 }, { priceCents: 500 }),
    ],
    slotRules: SLOT_RULES,
    shape: SHAPE,
    issuedFingerprints: [],
    ...overrides,
  };

  return {
    application: {
      quizResponseId: "q1",
      customerId: "c1",
      customerEmail: "her@example.invalid",
      quizVersion: "2026-08-b",
      occasion: "girls_weekend",
      occasionOther: null,
      environment: "beach",
      venueAnswers: {
        environment: "beach",
        indoorOutdoor: null,
        waterAccess: null,
        waterUse: null,
      },
      secret: "Two of them have not spoken since March.",
      musicService: "print",
      stated: [stated(COASTAL), stated(EASE), stated(NOVELTY, "negative")],
      scale: SCALE,
      exclusions: [],
      createdAt: "2026-08-01T00:00:00Z",
      ...application,
    },
    history: [],
    cohorts: [],
    catalogue,
  };
}

test("end to end: three complete candidates, each with an account of itself", () => {
  const result = runSelection(inputFor(), { seed: 5 });

  assert.equal(result.candidates.length, 3);
  for (const candidate of result.candidates) {
    assert.ok(candidate.explanation.headline.length > 0);
    assert.ok(candidate.explanation.destination.length > 0);
    assert.equal(
      candidate.explanation.secret,
      "Two of them have not spoken since March.",
      "her words, verbatim"
    );
    assert.ok(
      candidate.picks.filter((p) => p.slot.slotCode === "day_material").length > 0
    );
  }
});

test("end to end: it never writes and never mutates its input", () => {
  const input = inputFor();
  const snapshot = JSON.stringify(input);
  runSelection(input, { seed: 9 });
  assert.equal(JSON.stringify(input), snapshot, "the snapshot is read-only");
});

test("end to end: the same seed reproduces exactly, a different one need not", () => {
  const input = inputFor();
  const a = runSelection(input, { seed: 3 });
  const b = runSelection(input, { seed: 3 });
  assert.deepEqual(
    a.candidates.map((c) => c.fingerprint),
    b.candidates.map((c) => c.fingerprint)
  );

  const seen = new Set<string>();
  for (let seed = 0; seed < 40; seed += 1) {
    seen.add(
      runSelection(input, { seed })
        .candidates.map((c) => c.destination.name)
        .join(">")
    );
  }
  assert.ok(seen.size > 1, "the shortlist is dithered across seeds");
});

test("end to end: candidates in one run never repeat each other's assemblage", () => {
  const result = runSelection(inputFor(), { seed: 11 });
  const prints = result.candidates.map((c) => c.fingerprint);
  assert.equal(new Set(prints).size, prints.length);
});

test("end to end: an empty catalogue is an impasse with a sentence, not a crash", () => {
  const result = runSelection(inputFor({ destinations: [] }), { seed: 1 });
  assert.equal(result.candidates.length, 0);
  assert.ok(result.impasse);
});

// ─────────────────────────────────────────────────────────────────────
// THE WALL — nothing about a catalogue gap may ever reach the member
//
// "if a game doesnt match, then no game, dont give an error to the member."
//
// The rule under it: an unfillable slot means the deliverable does not exist
// in her Revelle. Not an error, not a placeholder, not an apology. Silence.
// The signal goes to the house, because that is how the library gets built.
// ─────────────────────────────────────────────────────────────────────

/** A slot rule, written out. Defaults are the common case. */
function rule(overrides: Partial<SlotRule> & { slotCode: string }): SlotRule {
  return {
    label: overrides.slotCode,
    description: "",
    section: "fun",
    perGuest: false,
    pool: "game",
    minCount: 1,
    maxCount: 1,
    required: true,
    perDay: false,
    position: 10,
    note: "",
    excludedBy: null,
    ...overrides,
  };
}

/**
 * A BIRTHDAY WITH A HONOURING BEAT NOTHING CAN FILL.
 *
 * This is the real gap in the catalogue today, reproduced by the real
 * mechanism: every game in src/lib/games.ts claims `game`, `the_moment` or
 * `day_material` by name, and naming one is opting into a whitelist. Nothing
 * claims `honouring`, so the birthday's required honouring slot has an empty
 * pool — with a dozen perfectly good games sitting next to it.
 */
const BIRTHDAY: OccasionShape = {
  occasion: "birthday",
  label: "The birthday",
  days: 1,
  note: "One evening.",
  scheduledGameMax: 2,
};

const BIRTHDAY_RULES: SlotRule[] = [
  rule({
    slotCode: "honouring",
    label: "The honouring",
    section: "moment",
    required: true,
    position: 10,
  }),
  rule({ slotCode: "game", label: "The fun", required: true, position: 20 }),
  rule({
    slotCode: "edit_item",
    label: "The edit",
    section: "edit",
    pool: "product",
    required: false,
    position: 30,
  }),
];

function birthdayInput(): SelectionInput {
  return inputFor(
    {
      // Three destinations, so each candidate is a genuinely different
      // assemblage. Uniqueness is the only thing that ever withholds one, and
      // this test is about gaps — the two must not be confused for each other.
      destinations: [
        destination("d1", "PALM SPRINGS, 1972", { [COASTAL.id]: 0.9 }),
        destination("d2", "AMAGANSETT, 1979", { [COASTAL.id]: 0.7 }),
        destination("d3", "CAPRI, OFF-SEASON", { [COASTAL.id]: 0.5 }),
      ],
      ingredients: [
        ingredient("g1", "game", "The Art Battle", { [COASTAL.id]: 0.8 }, {
          description: "Two teams, one still life, forty minutes.",
          shape: "scheduled",
          slots: [{ slotCode: "game", fit: "native", note: null }],
          // What it prints. A game brings real objects (db/010's
          // game_printed_matter) and its description is a sentence ABOUT the
          // game rather than something to set in type — which is why the
          // member's printed matter is built from these and never from that.
          printedMatter: [
            {
              piece: "voting_slips",
              label: "The ballot",
              description: "Five categories, one line each.",
              perGuest: true,
              quantity: null,
            },
          ],
        }),
        ingredient("p1", "product", "The good candles", { [COASTAL.id]: 0.6 }, {
          description: "Beeswax, and enough of them.",
          slots: [{ slotCode: "edit_item", fit: "native", note: null }],
        }),
      ],
      slotRules: BIRTHDAY_RULES,
      shape: BIRTHDAY,
    },
    { occasion: "birthday" }
  );
}

test("a required slot the catalogue cannot fill does not block issuance", () => {
  const result = runSelection(birthdayInput(), { seed: 5 });

  assert.equal(
    result.candidates.length,
    3,
    "a gap is a house problem, not a reason to produce nothing"
  );
  for (const candidate of result.candidates) {
    assert.ok(candidate.fingerprint, "it is a real, issuable assemblage");
    assert.equal(candidate.blocked, null, "a gap never withholds a Revelle");
    assert.ok(
      candidate.picks.some((p) => p.slot.slotCode === "game"),
      "everything that could be filled was"
    );
  }
});

test("the house is told about the gap, by name and in full", () => {
  const result = runSelection(birthdayInput(), { seed: 5 });
  const gap = result.gaps.find((g) => g.slotCode === "honouring");

  assert.ok(gap, "the curator's work order survives");
  assert.equal(gap!.required, true, "and it says the occasion asked for it");
  assert.match(gap!.detail, /honouring/i);

  const candidate = result.candidates[0];
  assert.ok(
    candidate.explanation.gaps.some((s) => /REQUIRED slot "The honouring"/.test(s)),
    "and it is in the account the curator reads"
  );
  assert.ok(
    candidate.lowConfidence,
    "a required slot nobody could fill means a human looks at it"
  );
});

test("the member view of that same Revelle carries no trace of the gap", () => {
  const candidate = runSelection(birthdayInput(), { seed: 5 }).candidates[0];
  const view = memberRevelle(candidate);
  const rendered = JSON.stringify(view).toLowerCase();

  // The slot itself, by every name it has.
  assert.ok(!rendered.includes("honouring"), "the slot is not named");
  assert.ok(!rendered.includes("gap"));
  assert.ok(!rendered.includes("required"));

  // And every word an apology is made of.
  for (const word of [
    "error",
    "sorry",
    "unfortunately",
    "could not",
    "couldn't",
    "unavailable",
    "missing",
    "not found",
    "no game",
    "none selected",
    "placeholder",
    "empty",
    "tbd",
  ]) {
    assert.ok(!rendered.includes(word), `member view must never say "${word}"`);
  }

  // The house's own fields are not merely filtered — they are not there.
  const asRecord = view as unknown as Record<string, unknown>;
  for (const field of [
    "gaps",
    "eliminated",
    "dropped",
    "swaps",
    "lowConfidence",
    "explanation",
    "blocked",
    "budget",
  ]) {
    assert.equal(asRecord[field], undefined, `member view must not carry ${field}`);
  }
});

test("and it is otherwise a complete Revelle, not a degraded one", () => {
  const candidate = runSelection(birthdayInput(), { seed: 5 }).candidates[0];
  const view = memberRevelle(candidate);

  assert.equal(view.destination.name, candidate.destination.name);
  assert.ok(view.destination.name.length > 0, "she is somewhere");
  assert.equal(
    view.pieces.length,
    candidate.picks.length,
    "every piece that was placed is hers"
  );
  assert.ok(view.pieces.length > 0);
  assert.ok(
    view.pieces.every((p) => p.heading.length > 0 && p.name.length > 0),
    "no piece arrives without a heading or a name"
  );
  assert.equal(
    view.sections.reduce((n, s) => n + s.pieces.length, 0),
    view.pieces.length,
    "the sections account for every piece and nothing else"
  );
  assert.ok(
    view.sections.every((s) => s.pieces.length > 0),
    "AND THERE IS NO EMPTY SECTION — a heading over nothing is the failure"
  );
  // WHAT PRINTS IS WHAT AN INGREDIENT SAYS PRINTS, and nothing else. The
  // ballot is a real object the game carries; the game's own description is a
  // sentence about the game and is not a card. An earlier version of
  // memberRevelle fell back to the description when an ingredient printed
  // nothing, which put a soundtrack and a batch negroni on the page as printed
  // objects — a failure only visible in a screenshot, which is where it was
  // found.
  const ballot = view.printedMatter.find((p) => p.heading === "The ballot");
  assert.ok(ballot, "an authored object is hers to print");
  assert.equal(ballot.from, "The Art Battle", "and it says what it came with");
  assert.equal(ballot.perGuest, true, "one each, counted from her guest band");
  assert.ok(
    !view.printedMatter.some((p) => p.body.includes("forty minutes")),
    "a description is not an object and must not be printed as one"
  );
  assert.ok(
    !view.printedMatter.some((p) => p.body.includes("Beeswax")),
    "and a product that prints nothing prints nothing"
  );
});

test("a Candidate cannot be handed to a member surface by mistake", () => {
  const candidate = runSelection(birthdayInput(), { seed: 5 }).candidates[0];

  // @ts-expect-error — a Candidate carries gaps, eliminated, dropped, swaps,
  // lowConfidence, explanation and blocked. MemberRevelle forbids all seven by
  // typing them `never`, so this assignment cannot compile. If this line ever
  // stops erroring, the wall in member.ts has been taken down.
  const leaked: MemberRevelle = candidate;
  assert.ok(leaked);
});

test("assemblage uniqueness DOES withhold, and says so only to the house", () => {
  // One destination, one game, nothing to swap in: the only assemblage this
  // catalogue can produce, and it has already been delivered to someone.
  const only = ingredient("g1", "game", "The only game", { [COASTAL.id]: 0.8 }, {
    shape: "scheduled",
    slots: [{ slotCode: "game", fit: "native", note: null }],
  });
  const issued = assemblageFingerprint("d1", [{ pool: "game", id: "g1" }])!;

  const result = runSelection(
    inputFor(
      {
        destinations: [destination("d1", "THE ONLY ONE", { [COASTAL.id]: 0.9 })],
        ingredients: [only],
        slotRules: [rule({ slotCode: "game", label: "The fun", position: 20 })],
        shape: BIRTHDAY,
        issuedFingerprints: [issued],
      },
      { occasion: "birthday" }
    ),
    { seed: 5 }
  );

  const candidate = result.candidates[0];
  assert.ok(candidate.blocked, "this one must not go out");
  assert.match(candidate.blocked!, /Do not deliver this one/);
  assert.ok(
    candidate.explanation.confidence.some((s) => /Do not deliver this one/.test(s)),
    "the wording lives on the house side"
  );
  assert.throws(
    () => memberRevelle(candidate),
    /must not be delivered/,
    "and there is no way to build a member view of it"
  );
});

// ─────────────────────────────────────────────────────────────────────
// THE EVENING'S BLOCKS — scheduled_game_max binds during the search
// ─────────────────────────────────────────────────────────────────────

/** Three slots that all draw from the game pool, as a birthday really has. */
const THREE_GAME_SLOTS: SlotRule[] = [
  rule({ slotCode: "game", label: "The fun 1", minCount: 3, maxCount: 3, position: 10 }),
];

function gamesFor(
  shape: OccasionShape,
  rules: SlotRule[],
  ingredients: Ingredient[],
  exclusions: string[] = []
) {
  const vector = buildVector([stated(COASTAL)], [], [], FACETS, OPTIONS);
  const scale: Scale = { ...SCALE, budgetCeiling: null, budgetPlanning: null };
  const plan = planSlots(rules, shape, scale, exclusions);
  const pools = scopePools(
    plan.slots,
    ingredients,
    destination("d1", "SOMEWHERE", {}),
    shape.occasion,
    vector.weights,
    vector.dealbreakers,
    (id) => FACETS[id]?.label ?? id,
    scale,
    null,
    OPTIONS,
    OPTIONS.now!
  );
  return { plan, fill: fillSlots(pools, scale, shape, OPTIONS) };
}

const DINNER: OccasionShape = {
  occasion: "dinner_party",
  label: "The long dinner",
  days: 1,
  note: "One table, one evening.",
  scheduledGameMax: 1,
};

const WEEKEND: OccasionShape = { ...SHAPE, scheduledGameMax: 3 };

function scheduledGames(): Ingredient[] {
  return [
    ingredient("g1", "game", "The Art Battle", { [COASTAL.id]: 0.9 }, {
      shape: "scheduled",
      slots: [{ slotCode: "game", fit: "native", note: null }],
    }),
    ingredient("g2", "game", "Fishbowl", { [COASTAL.id]: 0.8 }, {
      shape: "scheduled",
      slots: [{ slotCode: "game", fit: "native", note: null }],
    }),
    ingredient("g3", "game", "The Reverse Scavenger Hunt", { [COASTAL.id]: 0.7 }, {
      shape: "scheduled",
      slots: [{ slotCode: "game", fit: "native", note: null }],
    }),
  ];
}

// ── the carousel — db/061 ────────────────────────────────────────────
//
// "there shouldnt be more than one ga[m]e" and "give a host three ga[m]es to
// choose from. as an or not an and." One beat, three candidates, one of them
// hers. Everything below is the "as an or not an and" half made mechanical.

/** The post-db/061 shape of the one game beat: one item, three candidates. */
const ONE_GAME_OFFERED: SlotRule[] = [
  rule({ slotCode: "game", label: "The fun", position: 10, offerCount: 3 }),
];

test("planSlots: an offer is three unit slots of ONE beat", () => {
  const slots = planSlots(ONE_GAME_OFFERED, DINNER, SCALE).slots;

  assert.equal(slots.length, 3, "three candidates");
  assert.equal(
    new Set(slots.map((s) => s.offerGroup)).size,
    1,
    "and one beat — an or, not an and"
  );
  assert.deepEqual(
    slots.map((s) => s.offerIndex),
    [0, 1, 2],
    "stamped at planning and never recomputed: the cards must not move"
  );
  assert.ok(
    slots.every((s) => s.slotCode === "game"),
    "three candidates for one slot, never three slots"
  );
});

test("planSlots: only the FIRST candidate of an offer is required", () => {
  const slots = planSlots(ONE_GAME_OFFERED, DINNER, SCALE).slots;
  assert.deepEqual(
    slots.map((s) => s.required),
    [true, false, false],
    "which is how a room with one eligible game offers one and reports no gap"
  );
});

test("planSlots: offer_count 1 is exactly what every slot did before", () => {
  const plain = planSlots(
    [rule({ slotCode: "game", label: "The fun", position: 10 })],
    DINNER,
    SCALE
  ).slots;

  assert.equal(plain.length, 1);
  assert.equal(plain[0].offerGroup, null, "nothing the house places is an offer");
  assert.equal(plain[0].key, "game:1:0", "and its key is unchanged");
});

test("an offer spends ONE block, however many cards are in it", () => {
  // scheduled_game_max = 1 and all three candidates are scheduled. Before
  // db/061 taught fill.ts what a beat is, the second card would have been
  // refused by the first card's own block and she would have been handed one
  // game with a house note saying the evening was full.
  const { fill } = gamesFor(DINNER, ONE_GAME_OFFERED, scheduledGames());

  assert.equal(fill.picks.length, 3, "three cards offered");
  assert.equal(
    new Set(fill.picks.map((p) => p.ingredient.name)).size,
    3,
    "three DIFFERENT games — nothing is padded and nothing repeats"
  );
  assert.ok(
    !fill.dropped.some((d) => d.reason === "scheduled_cap"),
    "one beat, one block, no refusal"
  );
});

test("where fewer than three are eligible, she is offered what exists", () => {
  const two = scheduledGames().slice(0, 2);
  const { fill } = gamesFor(DINNER, ONE_GAME_OFFERED, two);

  assert.equal(fill.picks.length, 2, "two, said plainly");
  assert.equal(
    fill.gaps.length,
    0,
    "AND NOT A GAP. The second and third cards are optional units; a room " +
      "with two games has two games, which is not a work order for the house"
  );
  assert.deepEqual(
    fill.picks.map((p) => p.ingredient.name).sort(),
    ["Fishbowl", "The Art Battle"],
    "nothing is repeated to make up the number"
  );
});

test("one eligible game is one card, and still not a gap", () => {
  const { fill } = gamesFor(DINNER, ONE_GAME_OFFERED, scheduledGames().slice(0, 1));

  assert.equal(fill.picks.length, 1);
  assert.equal(fill.gaps.length, 0);
});

test("no eligible game IS a gap — the required first card went unfilled", () => {
  // The distinction the offer must not blur. A thin room is silence to her
  // (src/lib/selection/member.ts) and a work order to the house; an EMPTY one
  // is the pool needing authoring, and that signal has to survive.
  const { fill } = gamesFor(DINNER, ONE_GAME_OFFERED, []);

  assert.equal(fill.picks.length, 0);
  assert.equal(fill.gaps.length, 1, "one gap for the beat, not three");
});

test("the cap binds: a long dinner takes one game, not the three it could", () => {
  const { fill } = gamesFor(DINNER, THREE_GAME_SLOTS, scheduledGames());

  assert.equal(
    fill.picks.length,
    1,
    "three slots, three eligible games, one block — one game"
  );
  assert.equal(fill.picks[0].ingredient.shape, "scheduled");
  assert.equal(
    fill.gaps.length,
    0,
    "AND IT IS NOT A CATALOGUE GAP — the pool was full, the evening was not"
  );
  assert.ok(
    fill.dropped.some((d) => d.reason === "scheduled_cap"),
    "the curator is told why the other two are not there"
  );
});

test("the cap is the occasion's: the same three games all fit a weekend", () => {
  const { fill } = gamesFor(WEEKEND, THREE_GAME_SLOTS, scheduledGames());

  assert.equal(fill.picks.length, 3, "three days, three blocks, three games");
  assert.ok(!fill.dropped.some((d) => d.reason === "scheduled_cap"));
});

test("ambient and finale games do not count toward it — the whole point", () => {
  const rules = [
    rule({ slotCode: "game", label: "The fun", position: 10 }),
    rule({
      slotCode: "ambient_game",
      label: "The undercurrent",
      required: false,
      position: 20,
    }),
    rule({ slotCode: "finale", label: "The ending", required: false, position: 30 }),
  ];
  const ingredients = [
    ingredient("g1", "game", "The Art Battle", { [COASTAL.id]: 0.9 }, {
      shape: "scheduled",
      slots: [{ slotCode: "game", fit: "native", note: null }],
    }),
    ingredient("g2", "game", "Secret Game Cards", { [COASTAL.id]: 0.8 }, {
      shape: "ambient",
      slots: [{ slotCode: "ambient_game", fit: "native", note: null }],
    }),
    ingredient("g3", "game", "The Secret Auction", { [COASTAL.id]: 0.7 }, {
      shape: "finale",
      slots: [{ slotCode: "finale", fit: "native", note: null }],
    }),
  ];

  // scheduled_game_max = 1, and she still gets three games.
  const { fill } = gamesFor(DINNER, rules, ingredients);

  assert.equal(fill.picks.length, 3);
  assert.deepEqual(
    fill.picks.map((p) => p.ingredient.shape).sort(),
    ["ambient", "finale", "scheduled"],
    "one block spent; the other two take none"
  );
  assert.ok(!fill.dropped.some((d) => d.reason === "scheduled_cap"));
});

test("a REQUIRED slot does not buy an extra block", () => {
  // Every slot required, three scheduled games, one block. Required is the
  // occasion's shape; it cannot make an evening longer.
  const { fill } = gamesFor(DINNER, THREE_GAME_SLOTS, scheduledGames());
  assert.ok(fill.picks.every((p) => p.slot.required));
  assert.equal(fill.picks.length, 1);
});

test("a game with no shape takes no block, and cannot silently fill an evening", () => {
  const shapeless = scheduledGames().map((g) => ({ ...g, shape: null }));
  const { fill } = gamesFor(DINNER, THREE_GAME_SLOTS, shapeless);
  assert.equal(
    fill.picks.length,
    3,
    "null means 'takes no block' — the cap counts scheduled games and nothing else"
  );
});

test("end to end: the cap holds all the way through the engine", () => {
  const result = runSelection(
    inputFor(
      {
        destinations: [destination("d1", "ONE", { [COASTAL.id]: 0.9 })],
        ingredients: scheduledGames(),
        slotRules: THREE_GAME_SLOTS,
        shape: DINNER,
      },
      { occasion: "dinner_party" }
    ),
    { seed: 5 }
  );

  for (const candidate of result.candidates) {
    const blocks = candidate.picks.filter(
      (p) => p.ingredient.shape === "scheduled"
    ).length;
    assert.ok(blocks <= 1, `a long dinner has one block, took ${blocks}`);
    assert.equal(
      memberRevelle(candidate).pieces.length,
      candidate.picks.length,
      "and what did not fit is simply not in what she sees"
    );
  }
});

// ─────────────────────────────────────────────────────────────────────
// SLOTS SHE DOES NOT HAVE — an exclusion is not a gap
// ─────────────────────────────────────────────────────────────────────

const MENU_RULES: SlotRule[] = [
  rule({
    slotCode: "the_menu",
    label: "The menu",
    section: "details",
    pool: "menu",
    required: true,
    position: 10,
    excludedBy: "no_food",
  }),
  rule({ slotCode: "game", label: "The fun", required: true, position: 20 }),
];

function dinnerInput(exclusions: string[]): SelectionInput {
  return inputFor(
    {
      destinations: [destination("d1", "ONE", { [COASTAL.id]: 0.9 })],
      ingredients: [
        ingredient("m1", "menu", "Oysters, then cold roast chicken", {
          [COASTAL.id]: 0.9,
        }, { slots: [{ slotCode: "the_menu", fit: "native", note: null }] }),
        ingredient("g1", "game", "The Art Battle", { [COASTAL.id]: 0.8 }, {
          shape: "scheduled",
          slots: [{ slotCode: "game", fit: "native", note: null }],
        }),
      ],
      slotRules: MENU_RULES,
      shape: DINNER,
    },
    { occasion: "dinner_party", exclusions }
  );
}

test("she is serving food: the menu is planned and filled, as it always was", () => {
  const result = runSelection(dinnerInput([]), { seed: 5 });
  const candidate = result.candidates[0];

  assert.ok(candidate.picks.some((p) => p.slot.slotCode === "the_menu"));
  assert.equal(result.excluded.length, 0);
  assert.ok(memberRevelle(candidate).pieces.some((p) => p.heading === "The menu"));
});

test("she is not serving food: no menu, and it is not a gap", () => {
  const result = runSelection(dinnerInput(["no_food"]), { seed: 5 });
  const candidate = result.candidates[0];

  assert.ok(
    !candidate.picks.some((p) => p.slot.slotCode === "the_menu"),
    "the slot was never in her plan"
  );
  assert.equal(
    result.gaps.filter((g) => g.slotCode === "the_menu").length,
    0,
    "NOT A WORK ORDER — there is nothing for the house to author"
  );
  assert.ok(
    !candidate.dropped.some((d) => d.slot.slotCode === "the_menu"),
    "and nothing was filled and then discarded"
  );

  const excluded = result.excluded.find((s) => s.slotCode === "the_menu");
  assert.ok(excluded, "the curator can still see that she said so");
  assert.equal(excluded!.exclusion, "no_food");
  assert.equal(excluded!.requiredByOccasion, true);
  assert.ok(
    candidate.explanation.excluded.length > 0 &&
      candidate.explanation.gaps.every((s) => !s.includes("The menu")),
    "said in its own list, never in the gap list"
  );
});

test("her answer beats `required`, and the rest of the Revelle is untouched", () => {
  const withFood = runSelection(dinnerInput([]), { seed: 5 }).candidates[0];
  const without = runSelection(dinnerInput(["no_food"]), { seed: 5 }).candidates[0];

  assert.ok(without.fingerprint, "a Revelle with no menu is still issuable");
  assert.equal(without.blocked, null);
  assert.deepEqual(
    without.picks.map((p) => p.ingredient.name),
    withFood.picks
      .filter((p) => p.slot.slotCode !== "the_menu")
      .map((p) => p.ingredient.name),
    "everything that is not the menu is exactly what it was"
  );

  const view = memberRevelle(without);
  const rendered = JSON.stringify(view).toLowerCase();
  assert.ok(!rendered.includes("menu"), "she is never told a menu was considered");
  assert.ok(!rendered.includes("no_food"));
  assert.ok(view.pieces.length > 0, "and she still receives a Revelle");
});

test("an exclusion she did not state removes nothing", () => {
  const result = runSelection(dinnerInput(["no_games"]), { seed: 5 });
  assert.equal(
    result.excluded.length,
    0,
    "no rule in this plan is excluded by no_games"
  );
  assert.ok(result.candidates[0].picks.some((p) => p.slot.slotCode === "the_menu"));
});

/* ── THE GAME BEAT, AND THE HOST WHO SAYS HER PEOPLE HATE THEM ───────
 *
 * The menu pair above proves the third gate on `no_food`. This proves it on
 * `no_games`, which is a different shape and is the one db/061 made sharp: the
 * game beat is REQUIRED at every occasion and OFFERS THREE CANDIDATES, so a
 * host who is not heard is handed three cards for an evening she said has no
 * game in it. `hates_games` on the play question and `play_appetite = 'none'`
 * both carry the code; db/066 and db/016 are the two bridges.
 *
 * The plan differs from MENU_RULES in one column, which is the point: the same
 * `game` rule with `excludedBy` set, as db/014 sets it on slot_kind.
 */
const GAME_RULES: SlotRule[] = [
  rule({
    slotCode: "the_menu",
    label: "The menu",
    section: "details",
    pool: "menu",
    required: true,
    position: 10,
    excludedBy: "no_food",
  }),
  rule({
    slotCode: "game",
    label: "The fun",
    required: true,
    position: 20,
    offerCount: 3,
    excludedBy: "no_games",
  }),
];

function gameInput(exclusions: string[]): SelectionInput {
  return inputFor(
    {
      destinations: [destination("d1", "ONE", { [COASTAL.id]: 0.9 })],
      ingredients: [
        ingredient("m1", "menu", "Oysters, then cold roast chicken", {
          [COASTAL.id]: 0.9,
        }, { slots: [{ slotCode: "the_menu", fit: "native", note: null }] }),
        ingredient("g1", "game", "The Art Battle", { [COASTAL.id]: 0.8 }, {
          shape: "scheduled",
          slots: [{ slotCode: "game", fit: "native", note: null }],
        }),
        ingredient("g2", "game", "The Late Supper", { [COASTAL.id]: 0.7 }, {
          shape: "scheduled",
          slots: [{ slotCode: "game", fit: "native", note: null }],
        }),
        ingredient("g3", "game", "The Last Song", { [COASTAL.id]: 0.6 }, {
          shape: "finale",
          slots: [{ slotCode: "game", fit: "native", note: null }],
        }),
      ],
      slotRules: GAME_RULES,
      shape: DINNER,
    },
    { occasion: "dinner_party", exclusions }
  );
}

test("she wants games: the beat offers her three, which is db/061's carousel", () => {
  const candidate = runSelection(gameInput([]), { seed: 5 }).candidates[0];
  assert.equal(
    candidate.picks.filter((p) => p.slot.slotCode === "game").length,
    3,
    "the carousel is what a host who said nothing about games receives"
  );
});

test("SHE SAYS HER PEOPLE HATE GAMES: NO CARD, NO GAP, NO SENTENCE", () => {
  const result = runSelection(gameInput(["no_games"]), { seed: 5 });
  const candidate = result.candidates[0];

  assert.equal(
    candidate.picks.filter((p) => p.slot.slotCode === "game").length,
    0,
    "she was dealt a game she said her people hate"
  );
  assert.equal(
    result.gaps.filter((g) => g.slotCode === "game").length,
    0,
    "NOT A WORK ORDER. Nobody can author their way out of 'she does not want " +
      "games', and a gap list with rows nobody can act on stops being read."
  );
  assert.ok(
    !candidate.dropped.some((d) => d.slot.slotCode === "game"),
    "nothing was filled and then discarded — the beat was never in the plan"
  );

  const excluded = result.excluded.find((s) => s.slotCode === "game");
  assert.ok(excluded, "the curator can still see that she said so");
  assert.equal(excluded!.exclusion, "no_games");
  assert.equal(
    excluded!.requiredByOccasion,
    true,
    "db/061 made this beat required at every occasion, and her answer still wins"
  );
});

test("A GAMELESS REVELLE IS A REVELLE, AND SAYS NOTHING ABOUT A GAME", () => {
  // CLAUDE.md rule 29's neighbourhood: an absence SHE CHOSE is not an
  // authoring gap, and the page must not read as though something failed. To
  // the member an excluded slot and an unfillable one are identical and
  // deliberately so — no heading, no empty state, no "no game selected". What
  // is left is the rest of her evening, unchanged.
  const withGames = runSelection(gameInput([]), { seed: 5 }).candidates[0];
  const without = runSelection(gameInput(["no_games"]), { seed: 5 }).candidates[0];

  assert.ok(without.fingerprint, "a Revelle with no game is still issuable");
  assert.equal(without.blocked, null);
  assert.deepEqual(
    without.picks.map((p) => p.ingredient.name),
    withGames.picks
      .filter((p) => p.slot.slotCode !== "game")
      .map((p) => p.ingredient.name),
    "everything that is not the game is exactly what it was"
  );

  const view = memberRevelle(without);
  assert.ok(view.pieces.length > 0, "and she still receives a Revelle");
  assert.ok(
    !view.pieces.some((p) => p.heading === "The fun"),
    "the section is absent rather than empty"
  );
  assert.ok(
    !view.sections.some((s) => s.pieces.length === 0),
    "no section renders with nothing in it"
  );
  const rendered = JSON.stringify(view).toLowerCase();
  assert.ok(!rendered.includes("no_games"), "the code never reaches her");
  assert.ok(
    !rendered.includes("the fun"),
    "she is never told a game was planned and removed"
  );
});

// ═════════════════════════════════════════════════════════════════════
// THREE PRODUCT DECISIONS
//
// Each of these is a decision somebody will otherwise "fix" back, so each one
// fails with the reasoning in the message rather than with a diff of two
// arrays. A test that says `expected [a,b] to equal [b,a]` teaches nobody why
// the order mattered.
// ═════════════════════════════════════════════════════════════════════

const THESIS =
  "VENUE NEVER TOUCHES THE DESTINATION. The destination is where she is " +
  "transported to; the venue is where she physically is, and the engine's whole " +
  "job is mapping one onto the other — Havana in a Brooklyn apartment is the " +
  "pitch, not a compromise. The moment venue nudges destination you are back to " +
  "'party themes that match your space'. If you meant to make the room matter, " +
  "it matters at stage 3, over structural requirements, in venue.ts.";

/** Every value of environment_type, as facets she could have answered with. */
const ENVIRONMENTS = [
  "my_home",
  "rented_house",
  "city_apartment",
  "beach",
  "mountains",
  "poolside",
  "garden",
  "restaurant_or_venue",
  "hotel",
  "not_decided",
].map((code) => facet(`f-env-${code}`, "environment", code));

// Real tone codes from src/lib/voice.ts, so the resolution through the voice
// vocabulary is the real one and not a fixture of itself.
const DEADPAN = facet("f-tone-deadpan", "voice_tone", "deadpan");
const UNDERSTATED = facet("f-tone-understated", "voice_tone", "understated");
const SENTIMENTAL = facet("f-tone-sentimental", "voice_tone", "sentimental");
const ALL_AT_ONCE = facet("f-tone-all-at-once", "voice_tone", "all_at_once");
const LOW_VOICES = facet("f-tone-low-voices", "voice_tone", "low_voices");

const MOMENT = facet("f-moment", "affinity", "one_moment");
const RITUAL = facet("f-ritual", "affinity", "ritual");
const BEAUTY = facet("f-beauty", "affinity", "beauty");
const WIT = facet("f-wit", "affinity", "wit");
const LATE = facet("f-late", "affinity", "late");

// ── 1. VENUE NEVER TOUCHES THE DESTINATION ───────────────────────────

test("the venue is not in the preference vector at all", () => {
  const vector = buildVector(
    [stated(COASTAL), stated(ENVIRONMENTS[2])],
    [],
    [],
    FACETS,
    OPTIONS
  );

  assert.equal(
    vector.weights[ENVIRONMENTS[2].id],
    undefined,
    `an environment facet reached the preference vector. ${THESIS}`
  );
  assert.ok(vector.weights[COASTAL.id] > 0, "her taste answer is still there");
});

test("every venue answer produces the identical destination ranking", () => {
  // One application, ten rooms. Nothing else moves.
  const rankings = ENVIRONMENTS.map((room) => {
    const result = runSelection(
      inputFor(
        {},
        {
          environment: room.code,
          stated: [
            stated(COASTAL),
            stated(EASE),
            stated(NOVELTY, "negative"),
            stated(room),
          ],
        }
      ),
      { seed: 11 }
    );
    return {
      room: room.code,
      order: result.candidates.map(
        (c) => `${c.destination.name}@${c.destinationScore.toFixed(6)}`
      ),
    };
  });

  const first = rankings[0];
  for (const entry of rankings.slice(1)) {
    assert.deepEqual(
      entry.order,
      first.order,
      `the destination ranking moved between "${first.room}" and "${entry.room}":\n` +
        `  ${first.room}: ${first.order.join(", ")}\n` +
        `  ${entry.room}: ${entry.order.join(", ")}\n\n${THESIS}`
    );
  }

  assert.ok(first.order.length > 0, "the fixture actually produced candidates");
});

test("the room prunes the pool instead, and the destination survives it", () => {
  // The founder's worked example, in miniature: a thing that needs outdoors,
  // and a thing that does not, in one pool, under one destination.
  const boilPot = ingredient("m1", "menu", "The clambake", { [COASTAL.id]: 0.9 }, {
    requirements: [
      {
        code: "requires_outdoors",
        label: "Needs outdoors",
        demand: "needs to be outdoors",
        note: "A boil pot. There is no indoor version.",
      },
    ],
  });
  const fogDayLunch = ingredient("m2", "menu", "The fog-day lunch", {
    [COASTAL.id]: 0.6,
  });

  const apartment: Venue = {
    environment: "city_apartment",
    label: "An apartment",
    provides: { requires_outdoors: false },
    notes: { requires_outdoors: "there is no outdoors" },
  };

  const run = (venue: Venue | null) =>
    scopePools(
      planSlots(SLOT_RULES, SHAPE, SCALE).slots,
      [boilPot, fogDayLunch],
      destination("d1", "NANTUCKET", { [COASTAL.id]: 0.9 }),
      "girls_weekend",
      buildVector([stated(COASTAL)], [], [], FACETS, OPTIONS).weights,
      [],
      (id) => FACETS[id]?.label ?? id,
      SCALE,
      venue,
      OPTIONS,
      OPTIONS.now!
    );

  const outdoors = [...run(null).values()].find(
    (p) => p.slot.slotCode === "the_menu"
  )!;
  assert.deepEqual(
    outdoors.candidates.map((c) => c.ingredient.name),
    ["The clambake", "The fog-day lunch"],
    "with no room known, nothing is pruned"
  );

  const indoors = [...run(apartment).values()].find(
    (p) => p.slot.slotCode === "the_menu"
  )!;
  assert.deepEqual(
    indoors.candidates.map((c) => c.ingredient.name),
    ["The fog-day lunch"],
    "the boil pot dies on requires_outdoors"
  );
  assert.deepEqual(indoors.prunedByVenue, ["The clambake"]);
  assert.equal(indoors.gap, null, "the pool is thinner, not empty");
});

test("an untagged ingredient works anywhere, which is the safe default", () => {
  const anywhere = ingredient("m2", "menu", "Untagged", { [COASTAL.id]: 0.6 });
  const everyRoom: Venue = {
    environment: "hotel",
    label: "A hotel",
    provides: {
      requires_outdoors: false,
      requires_open_flame: false,
      requires_full_kitchen: false,
      // `noise_ceiling` and `deposit_safe` were here and are cut by db/039:
      // every room had an affordance row for both and nothing in the catalogue
      // ever claimed either, so they pruned nothing for their whole life. The
      // fixture is "a room that affords NOTHING", so it has to be the real list
      // of requirements — a stale extra key would make it look like the venue
      // system still refuses on loudness.
      outdoor_access: false,
    },
    notes: {},
  };

  const pools = scopePools(
    planSlots(SLOT_RULES, SHAPE, SCALE).slots,
    [anywhere],
    destination("d1", "SOMEWHERE", {}),
    "girls_weekend",
    buildVector([stated(COASTAL)], [], [], FACETS, OPTIONS).weights,
    [],
    (id) => FACETS[id]?.label ?? id,
    SCALE,
    everyRoom,
    OPTIONS,
    OPTIONS.now!
  );

  const menu = [...pools.values()].find((p) => p.slot.slotCode === "the_menu")!;
  assert.equal(menu.candidates.length, 1, "no claim means no restriction");
});

test("a pool the room empties is an ordinary catalogue gap, and names the room", () => {
  const outdoorOnly = ingredient("m1", "menu", "The clambake", {}, {
    requirements: [
      {
        code: "requires_outdoors",
        label: "Needs outdoors",
        demand: "needs to be outdoors",
        note: null,
      },
    ],
  });
  const apartment: Venue = {
    environment: "city_apartment",
    label: "An apartment",
    provides: { requires_outdoors: false },
    notes: { requires_outdoors: "there is no outdoors" },
  };

  const pools = scopePools(
    planSlots(SLOT_RULES, SHAPE, SCALE).slots,
    [outdoorOnly],
    destination("d1", "NANTUCKET", {}),
    "girls_weekend",
    buildVector([stated(COASTAL)], [], [], FACETS, OPTIONS).weights,
    [],
    (id) => FACETS[id]?.label ?? id,
    SCALE,
    apartment,
    OPTIONS,
    OPTIONS.now!
  );

  const menu = [...pools.values()].find((p) => p.slot.slotCode === "the_menu")!;
  assert.ok(menu.gap, "an empty pool is still a gap");
  assert.match(menu.gap!.detail, /an apartment/i, "the room is named");
  assert.match(menu.gap!.detail, /needs to be outdoors/);
});

// ── 1b. THE OTHER THREE VENUE ANSWERS — db/049 ───────────────────────
//
// Inside or out, what water there is, whether anybody gets in. Everything in
// section 1 applies to them unchanged, and these tests exist because a NEW venue
// axis is exactly where the thesis erodes: the answer "a pool, and yes, people
// will be in it" looks like it should raise Palm Springs, and it must not.
//
// THE AFFORDANCE ROWS BELOW ARE db/049's, COPIED. That is a duplication of DATA
// and not of authority (CLAUDE.md rule 21's narrow test), and it is deliberate:
// these tests have to run with no database, and the rule they exercise —
// `composeVenue` — is imported rather than restated. The real rows are proved
// against the real loader in gates.db.test.ts, which is where a drift between
// this fixture and the migration would surface.

const HOST_INDOOR = [
  { quizField: "indoor_outdoor", optionCode: "indoor", requirement: "requires_outdoors", provided: false, note: "this evening is inside, and the thing needs a sky" },
];
const HOST_OUTDOOR = [
  { quizField: "indoor_outdoor", optionCode: "outdoor", requirement: "requires_outdoors", provided: true, note: "" },
  { quizField: "indoor_outdoor", optionCode: "outdoor", requirement: "outdoor_access", provided: true, note: "" },
];
const WATER = (code: string, provided: boolean, note: string) => ({
  quizField: "water_access",
  optionCode: code,
  requirement: "requires_still_water",
  provided,
  note,
});
const SWIMMING = (code: string, provided: boolean, note: string) => ({
  quizField: "water_use",
  optionCode: code,
  requirement: "requires_still_water",
  provided,
  note,
});

const APARTMENT_ROWS = [
  { requirement: "requires_outdoors", provided: false, note: "there is no outdoors — this is a room, and the thing needs a sky" },
  { requirement: "outdoor_access", provided: true, note: "" },
];
const HOTEL_ROWS = [
  { requirement: "requires_outdoors", provided: false, note: "there is no outdoors — this is a room, and the thing needs a sky" },
  { requirement: "outdoor_access", provided: false, note: "there is nowhere here a lit thing and its smoke can be outside" },
];
const HOUSE_ROWS = [
  { requirement: "requires_outdoors", provided: true, note: "" },
  { requirement: "outdoor_access", provided: true, note: "" },
];

test("her own statement supersedes the room type, and an apartment with a roof deck is outdoors", () => {
  const venue = composeVenue({
    environment: "city_apartment",
    label: "An apartment",
    environmentRows: APARTMENT_ROWS,
    hostClaims: HOST_OUTDOOR,
  });

  assert.equal(
    venue.provides.requires_outdoors,
    true,
    "db/020 says an apartment has no outdoors; she says her party is outside. " +
      "ANDing the two would absorb her answer and not honour it (rule 16), and " +
      "refusing her the outdoor deliverables is preference-by-square-footage."
  );
});

test("a house that stays indoors does not get the clambake", () => {
  const venue = composeVenue({
    environment: "my_home",
    label: "A house",
    environmentRows: HOUSE_ROWS,
    hostClaims: HOST_INDOOR,
  });

  assert.equal(venue.provides.requires_outdoors, false);
  assert.equal(
    venue.refusedBy?.requires_outdoors,
    "indoor_outdoor",
    "the refusal came from her answer, not from her house, and the gap " +
      "sentence has to say so or a curator authors an indoor clambake"
  );
});

test("an indoor party still has a door to the garden — the two outdoor grades are not one", () => {
  const house = composeVenue({
    environment: "my_home",
    label: "A house",
    environmentRows: HOUSE_ROWS,
    hostClaims: HOST_INDOOR,
  });
  assert.equal(
    house.provides.outdoor_access,
    true,
    "requires_outdoors is about the EVENING; outdoor_access is about the " +
      "BUILDING. `indoor` writes no claim on the second, so the sparklers " +
      "survive a dinner party in a dining room."
  );

  const hotel = composeVenue({
    environment: "hotel",
    label: "A hotel",
    environmentRows: HOTEL_ROWS,
    hostClaims: HOST_INDOOR,
  });
  assert.equal(
    hotel.provides.outdoor_access,
    false,
    "and db/035's sealed hotel room still refuses it, because no host answer " +
      "spoke to it and the room type therefore stands"
  );
});

test("still deciding is no information, and never 'none'", () => {
  // Every axis undecided. db/049 gives `not_decided` NO ROW at all, so the
  // fixture is an empty claim list — which is also, exactly, what every
  // application written before 2026-08-h produces.
  const undecided = composeVenue({
    environment: "city_apartment",
    label: "An apartment",
    environmentRows: APARTMENT_ROWS,
    hostClaims: [],
  });

  const provides = undecided.provides as Record<string, boolean | undefined>;
  assert.deepEqual(
    undecided.provides,
    { requires_outdoors: false, outdoor_access: true },
    "the room type stands untouched and nothing new is pruned"
  );
  assert.equal(
    provides.requires_still_water,
    undefined,
    "an unanswered water question must leave the requirement UNSPOKEN, not " +
      "false. Reading it as 'none' would delete every water-requiring row " +
      "from every application ever submitted, silently."
  );
});

test("a legacy application states nothing on the three new axes", () => {
  assert.deepEqual(
    statedAnswers({
      environment: "beach",
      indoorOutdoor: null,
      waterAccess: null,
      waterUse: null,
    }),
    [],
    "null means she was never asked"
  );
  assert.deepEqual(
    statedAnswers({
      environment: "beach",
      indoorOutdoor: "",
      waterAccess: "pool",
      waterUse: null,
    }),
    [{ quizField: "water_access", optionCode: "pool" }],
    "an empty string is a half-written row, not an answer, and must not prune"
  );
});

test("presence and use are ANDed: a good pool at a long dinner affords nothing", () => {
  const poolAndDinner = composeVenue({
    environment: "my_home",
    label: "A house",
    environmentRows: HOUSE_ROWS,
    hostClaims: [
      WATER("pool", true, ""),
      SWIMMING("beside_it", false, "the water is not part of this evening"),
    ],
  });
  assert.equal(
    poolAndDinner.provides.requires_still_water,
    false,
    "the founder's own case. Among host answers, false wins."
  );

  const poolAndSwimming = composeVenue({
    environment: "my_home",
    label: "A house",
    environmentRows: HOUSE_ROWS,
    hostClaims: [WATER("pool", true, ""), SWIMMING("in_the_water", true, "")],
  });
  assert.equal(poolAndSwimming.provides.requires_still_water, true);

  const noWaterButSwimming = composeVenue({
    environment: "my_home",
    label: "A house",
    environmentRows: HOUSE_ROWS,
    hostClaims: [
      WATER("none", false, "there is no water here"),
      SWIMMING("in_the_water", true, ""),
    ],
  });
  assert.equal(
    noWaterButSwimming.provides.requires_still_water,
    false,
    "two answers, a contradiction, and refusing is the safe direction — " +
      "sending a float to a host who says there is no water is the failure " +
      "db/049 exists to stop"
  );
});

// ── THE FLOAT, THROUGH THE REAL SELECTION PATH ───────────────────────
//
// The acceptance test the founder specified, and it is driven through
// `scopePools` — the function a real run calls — rather than by reading a row
// back out of the affordance table. Reading the row proves the row; this proves
// the gate.
//
// Her ruling: "a pool float should only land if the quiz answer is 'has pool'
// or 'lake'". POOL AND LAKE YES, RIVER AND OCEAN NO, and the reason is that a
// float needs STILL water — a river takes it downstream and the sea takes it
// out. All five outcomes are asserted here, plus the two absent cases, because
// four of the seven are the ones that would ship a float into moving water.

test("the striped floats land in a pool, a lake and a pond, and nowhere else", () => {
  // THE `product` POOL, not `bank_item`, and the substitution is the fixture's
  // limit rather than the gate's: SLOT_RULES above models four pools and the
  // bank is not one of them. `venueEligibility` is polymorphic over pools by
  // construction — one `ingredient_requirement` table, one verdict function —
  // so the pool a fixture happens to use changes nothing about what is proved.
  // The bank row itself is exercised against the real schema in gates.db.test.ts.
  const floats = ingredient("b1", "product", "The striped floats", {}, {
    requirements: [
      {
        code: "requires_still_water",
        label: "Needs still water",
        demand: "needs still water somebody is getting into",
        note: null,
      },
    ],
  });
  const cloth = ingredient("b2", "product", "The striped cloth", {});

  // db/049's water_access matrix, copied. See the note at the top of 1b.
  const ACCESS: Record<string, [boolean, string] | null> = {
    pool: [true, ""],
    lake: [true, ""],
    pond: [true, ""],
    river: [false, "a river moves, and it takes a float downstream with it"],
    sea: [false, "the sea has surf, and it takes a float out with it"],
    not_for_swimming: [false, "the water here is not water anybody gets into"],
    none: [false, "there is no water here"],
    not_decided: null,
  };

  const landsFor = (access: string) => {
    const claim = ACCESS[access];
    const venue = composeVenue({
      environment: "my_home",
      label: "A house",
      environmentRows: HOUSE_ROWS,
      hostClaims: [
        ...(claim === null ? [] : [WATER(access, claim[0], claim[1])]),
        SWIMMING("in_the_water", true, ""),
      ],
    });

    const pools = scopePools(
      planSlots(SLOT_RULES, SHAPE, SCALE).slots,
      [floats, cloth],
      destination("d1", "CÔTE D'AZUR", {}),
      "girls_weekend",
      buildVector([stated(COASTAL)], [], [], FACETS, OPTIONS).weights,
      [],
      (id) => FACETS[id]?.label ?? id,
      SCALE,
      venue,
      OPTIONS,
      OPTIONS.now!
    );
    return [...pools.values()].flatMap((p) =>
      p.candidates.map((c) => c.ingredient.name)
    );
  };

  for (const yes of ["pool", "lake", "pond"]) {
    assert.ok(
      landsFor(yes).includes("The striped floats"),
      `a host who answers "${yes}" must receive the floats`
    );
  }
  for (const no of ["river", "sea", "not_for_swimming", "none"]) {
    assert.ok(
      !landsFor(no).includes("The striped floats"),
      `a host who answers "${no}" must NOT receive the floats — a float needs ` +
        `still water, and moving water takes it away`
    );
    assert.ok(
      landsFor(no).includes("The striped cloth"),
      `and the rest of the room still arrives: pruning is per ROW, never per ` +
        `destination. Côte d'Azur does not leave, the float does.`
    );
  }

  assert.ok(
    landsFor("not_decided").includes("The striped floats"),
    "a host who has not answered is NOT a host without water, and nothing may " +
      "be pruned on an unknown"
  );
});

test("a float refused for want of a pool does not blame her house", () => {
  const floats = ingredient("b1", "product", "The striped floats", {}, {
    requirements: [
      {
        code: "requires_still_water",
        label: "Needs still water",
        demand: "needs still water somebody is getting into",
        note: null,
      },
    ],
  });
  const venue = composeVenue({
    environment: "my_home",
    label: "A house",
    environmentRows: HOUSE_ROWS,
    hostClaims: [WATER("none", false, "there is no water here")],
  });

  const verdict = venueEligibility(floats, venue);
  assert.equal(verdict.eligible, false);
  assert.match(
    verdict.reason,
    /there is no water here/,
    "the note carries the actual reason"
  );
  assert.doesNotMatch(
    verdict.reason,
    /in a house/,
    "and the sentence must NOT blame the room. 'impossible in a house' sends " +
      "whoever reads the gap to author an indoor variant of a thing that " +
      "needed a pool."
  );
});

test("every water answer produces the identical destination ranking", () => {
  // Section 1's thesis test, on the new axis. A host with a pool must not be
  // nudged toward Palm Springs — rule 2's forbidden door, reached from the
  // direction rule 2 did not anticipate.
  const WATERS = [
    "pool",
    "lake",
    "pond",
    "river",
    "sea",
    "not_for_swimming",
    "none",
    "not_decided",
  ].map((code) => facet(`f-water-${code}`, "water_access", code));

  const rankings = WATERS.map((answer) => {
    const result = runSelection(
      inputFor(
        {},
        {
          environment: "my_home",
          stated: [stated(COASTAL), stated(EASE), stated(answer)],
        }
      ),
      { seed: 11 }
    );
    return {
      answer: answer.code,
      order: result.candidates.map(
        (c) => `${c.destination.name}@${c.destinationScore.toFixed(6)}`
      ),
    };
  });

  const first = rankings[0];
  for (const entry of rankings.slice(1)) {
    assert.deepEqual(
      entry.order,
      first.order,
      `the destination ranking moved between "${first.answer}" and ` +
        `"${entry.answer}". ${THESIS}`
    );
  }
  assert.ok(first.order.length > 0, "the fixture actually produced candidates");
});

/**
 * THE QUIZ AND THE MIGRATION MUST AGREE ABOUT WHAT A HOST CAN ANSWER.
 *
 * Rule 21's narrow test, answered yes: `src/lib/quiz.ts` decides what she can
 * tap and db/049 decides what the column will accept, and an option that is not
 * in the enum is a submission Postgres rejects at 3am — while an enum value
 * with no option is an affordance row keyed to an answer nobody can give.
 *
 * It reads the migration as TEXT, which is crude and is the point: it is the
 * only check of this that runs with no database. `scripts/check-facets.mjs`
 * does the rigorous version against a live schema and cannot run on a laptop,
 * so the drift it would catch has to be catchable here too. Same idiom as
 * deploy.test.ts reading render.yaml.
 */
test("every venue answer in the quiz exists in db/049's enum and registry", () => {
  const sql = readFileSync(
    new URL("../../../db/049-the-water-and-the-sky.sql", import.meta.url),
    "utf8"
  );

  for (const field of ["indoor_outdoor", "water_access", "water_use"]) {
    const declared = sql.match(
      new RegExp(`create type ${field} as enum \\(([^)]*)\\)`)
    );
    assert.ok(declared, `db/049 declares no enum for ${field}`);
    const enumValues = [...declared![1].matchAll(/'([a-z_]+)'/g)].map((m) => m[1]);

    const options = FIELDS[field];
    assert.ok(options, `${field} is not a field in the quiz`);
    assert.equal(options.type, "single");
    const codes = (options as { options: readonly { code: string }[] }).options.map(
      (o) => o.code
    );

    assert.deepEqual(
      [...codes].sort(),
      [...enumValues].sort(),
      `${field}: the quiz and db/049's enum disagree. An option missing from ` +
        `the enum is a submission the database rejects; an enum value with no ` +
        `option is an affordance row keyed to an answer nobody can give.`
    );

    for (const code of codes) {
      assert.ok(
        sql.includes(`('${field}',`) && sql.includes(`'${code}'`),
        `${field}=${code} is never registered in quiz_option by db/049, so ` +
          `host_affordance's foreign key could not reference it`
      );
    }
  }
});

test("no venue answer of any of the four kinds reaches the preference vector", () => {
  // db/049 added three dimensions to a list that had one. Named individually
  // rather than looped, so that a dimension dropped from NON_TASTE_DIMENSIONS
  // fails with its own name in the message.
  for (const dimension of [
    "environment",
    "indoor_outdoor",
    "water_access",
    "water_use",
  ]) {
    const answer = facet(`f-${dimension}`, dimension, "some_answer");
    const vector = buildVector(
      [stated(COASTAL), stated(answer)],
      [],
      [],
      { ...FACETS, [answer.id]: answer },
      OPTIONS
    );
    assert.equal(
      vector.weights[answer.id],
      undefined,
      `a ${dimension} facet reached the preference vector. ${THESIS}`
    );
  }
});

// ── 2. THE EMPHASIS ──────────────────────────────────────────────────

test("what she wants more of is not in the preference vector", () => {
  const vector = buildVector([stated(COASTAL), stated(RITUAL)], [], [], FACETS, OPTIONS);
  assert.equal(
    vector.weights[RITUAL.id],
    undefined,
    `"what do you want more of" reached the preference vector. It is the only ` +
      `question on the quiz that tells you which DELIVERABLE she values, and ` +
      `averaging it into taste weights discards exactly that. It belongs in ` +
      `emphasis.ts, at stage 4 and in the voice layer.`
  );
});

test("each emphasis answer moves the deliverables and not the destination", () => {
  const rules: SlotRule[] = [
    { ...SLOT_RULES[0], slotCode: "the_moment", label: "The moment", pool: "game", perDay: false, required: false, position: 40 },
    { ...SLOT_RULES[0], slotCode: "finale", label: "The ending", pool: "game", perDay: false, required: false, position: 65 },
    { ...SLOT_RULES[0], slotCode: "soundtrack", label: "The soundtrack", pool: "tracklist", perDay: false, required: false, position: 60 },
    { ...SLOT_RULES[1], slotCode: "table_object", label: "The table", maxCount: 1, position: 30 },
    { ...SLOT_RULES[1] },
  ];

  const ingredients = [
    ingredient("g1", "game", "A moment", { [COASTAL.id]: 0.8 }),
    ingredient("g2", "game", "An ending", { [COASTAL.id]: 0.7 }),
    ingredient("t1", "tracklist", "A soundtrack", { [COASTAL.id]: 0.6 }),
    ingredient("p1", "product", "A table object", { [COASTAL.id]: 0.6 }),
    ingredient("p2", "product", "An edit item", { [COASTAL.id]: 0.5 }),
  ];

  const runWith = (answers: Facet[]) =>
    runSelection(
      inputFor(
        { slotRules: rules, ingredients },
        { stated: [stated(COASTAL), ...answers.map((f) => stated(f))] }
      ),
      { seed: 21 }
    );

  const none = runWith([]);
  const cases: { answer: Facet; guarantees: string; expects: RegExp }[] = [
    { answer: MOMENT, guarantees: "the_moment", expects: /centrepiece/i },
    { answer: RITUAL, guarantees: "finale", expects: /annualizable|next year/i },
    { answer: BEAUTY, guarantees: "table_object", expects: /tabletop/i },
    { answer: LATE, guarantees: "soundtrack", expects: /moves late|arc extends/i },
  ];

  for (const { answer, guarantees, expects } of cases) {
    const run = runWith([answer]);

    assert.deepEqual(
      run.candidates.map((c) => c.destination.name),
      none.candidates.map((c) => c.destination.name),
      `"${answer.code}" changed WHICH DESTINATION she gets. It must change which ` +
        `deliverable is emphasised and nothing else — this question does not ` +
        `describe a taste.`
    );

    assert.ok(
      run.emphasis.guaranteed.includes(guarantees),
      `"${answer.code}" should guarantee the ${guarantees} slot`
    );

    const slot = run.candidates[0].picks.find(
      (p) => p.slot.slotCode === guarantees
    );
    assert.ok(slot, `${guarantees} should have been placed`);
    assert.ok(
      slot!.slot.guaranteed,
      `${guarantees} should be promoted to required by her answer`
    );
    assert.ok(
      !none.candidates[0].picks.find((p) => p.slot.slotCode === guarantees)?.slot
        .guaranteed,
      `${guarantees} must NOT be guaranteed when she did not ask for it`
    );

    const said = run.candidates[0].explanation.emphasis.join(" ");
    assert.match(said, expects, `the curator is told what "${answer.code}" did`);
  }
});

test("ease emphasises The Prep rather than adding a deliverable", () => {
  const run = runSelection(
    inputFor({}, { stated: [stated(COASTAL), stated(EASE)] }),
    { seed: 21 }
  );
  assert.deepEqual(run.emphasis.guaranteed, [], "nothing is added");
  assert.equal(run.emphasis.prepRegister, "brief");
  assert.ok(run.emphasis.effortless);
  assert.match(
    run.emphasis.attention.join(" "),
    /Prep is written SHORT/,
    "the writer is told, because that is where this answer lands"
  );
});

test("an inside joke is never faked from the catalogue; a follow-up is owed", () => {
  const withText = runSelection(
    inputFor({}, { stated: [stated(COASTAL), stated(WIT)], secret: "The guitar." }),
    { seed: 21 }
  );
  assert.deepEqual(withText.emphasis.guaranteed, []);
  assert.ok(withText.emphasis.needsHerMaterial);
  assert.match(
    withText.candidates[0].explanation.emphasis.join(" "),
    /FOLLOW-UP OWED, and there is something to work from/
  );

  const without = runSelection(
    inputFor({}, { stated: [stated(COASTAL), stated(WIT)], secret: null }),
    { seed: 21 }
  );
  assert.match(
    without.candidates[0].explanation.emphasis.join(" "),
    /NOTHING to work from/,
    "an empty free text plus an inside joke is the case a curator must see"
  );
});

test("a guarantee promotes a slot the occasion has and never invents one", () => {
  const run = runSelection(
    inputFor({}, { stated: [stated(COASTAL), stated(MOMENT)] }),
    { seed: 21 }
  );
  assert.ok(run.emphasis.guaranteed.includes("the_moment"));
  assert.ok(
    !run.candidates[0].picks.some((p) => p.slot.slotCode === "the_moment"),
    "this occasion has no moment slot, so nothing was invented"
  );
  assert.match(
    run.candidates[0].explanation.emphasis.join(" "),
    /has no such slot/,
    "and the curator is told rather than left to notice"
  );
});

// ── 3. VOICE IS A FILTER, AESTHETIC IS A RANK ────────────────────────

/** A destination that looks right to her and sounds nothing like her people. */
function voiceFixtures() {
  return {
    // Deadpan, understated. The best-looking destination in the fixture.
    wrongVoice: destination("d-wrong", "THE AESTHETIC WINNER", {
      [COASTAL.id]: 1,
      [DEADPAN.id]: 1,
      [UNDERSTATED.id]: 1,
    }),
    // Warm, loud, sentimental. A weaker look.
    rightVoice: destination("d-right", "THE ONE THAT SOUNDS LIKE THEM", {
      [COASTAL.id]: 0.2,
      [SENTIMENTAL.id]: 1,
      [ALL_AT_ONCE.id]: 1,
    }),
  };
}

/** Warm, loud, sentimental — the founder's own example of a real group. */
const HER_TONES = [stated(SENTIMENTAL), stated(ALL_AT_ONCE)];

test("the tone filter cuts the shortlist, and cuts the aesthetic winner", () => {
  const { wrongVoice, rightVoice } = voiceFixtures();
  const vector = buildVector(
    [stated(COASTAL), ...HER_TONES],
    [],
    [],
    FACETS,
    OPTIONS
  );

  const result = chooseDestinations(
    [wrongVoice, rightVoice],
    vector,
    "girls_weekend",
    FACETS,
    OPTIONS,
    rng(1),
    OPTIONS.now!,
    NO_STRUCTURE
  );

  assert.deepEqual(
    result.shortlist.map((s) => s.destination.name),
    ["THE ONE THAT SOUNDS LIKE THEM"],
    `the tone filter left ${result.shortlist.length} of 2. VOICE IS A FILTER AND ` +
      `AESTHETIC IS A RANK — not a bigger weight, a TIER. The look that wins on ` +
      `facets must not survive a voice it fails, because a wrong look reads as ` +
      `"not what I pictured" and gets forgiven, and a wrong voice reads as ` +
      `"this isn't us" and churns the member.`
  );

  const cut = result.eliminated.find((e) => e.tier === "voice");
  assert.ok(cut, "the cut is recorded as a voice elimination, not as a low score");
  assert.equal(cut!.destinationName, "THE AESTHETIC WINNER");
  assert.ok(cut!.toneMatch! < OPTIONS.toneThreshold);
});

test("the aesthetic ranks WITHIN the survivors and is never averaged with voice", () => {
  const { rightVoice } = voiceFixtures();
  // Two destinations that both clear the bar. The look decides between them.
  const plainer = destination("d-plain", "SOUNDS RIGHT, LOOKS LESS RIGHT", {
    [COASTAL.id]: 0.1,
    [SENTIMENTAL.id]: 1,
  });
  const vector = buildVector(
    [stated(COASTAL), ...HER_TONES],
    [],
    [],
    FACETS,
    OPTIONS
  );

  const result = chooseDestinations(
    [plainer, rightVoice],
    vector,
    "girls_weekend",
    FACETS,
    OPTIONS,
    rng(1),
    OPTIONS.now!,
    NO_STRUCTURE
  );

  assert.equal(result.shortlist.length, 2, "both cleared the voice bar");
  const ranked = result.shortlist.slice().sort((a, b) => a.rank - b.rank);
  assert.equal(
    ranked[0].destination.name,
    "THE ONE THAT SOUNDS LIKE THEM",
    "among the survivors, the better look ranks first"
  );

  // The scores must be computable from the look alone. If the voice were still
  // in the number, the destination with the stronger tone tags would carry a
  // score the aesthetic cannot account for.
  for (const entry of result.shortlist) {
    const lookOnly = facetOverlap(
      Object.fromEntries(
        Object.entries(vector.weights).filter(
          ([id]) => FACETS[id]?.dimension !== "voice_tone"
        )
      ),
      entry.destination.facets
    );
    assert.equal(
      entry.rawScore.toFixed(9),
      lookOnly.toFixed(9),
      `${entry.destination.name}'s rank score includes voice points. The voice ` +
        `was already spent deciding whether it was in the room; counting it ` +
        `again is the averaging the tier replaced.`
    );
  }
});

test("the dither never resurrects a destination the tone filter killed", () => {
  const { wrongVoice, rightVoice } = voiceFixtures();
  const filler = Array.from({ length: 6 }, (_, i) =>
    destination(`d-f${i}`, `FILLER ${i}`, {
      [COASTAL.id]: 0.3 + i * 0.05,
      [SENTIMENTAL.id]: 0.8,
    })
  );
  const vector = buildVector(
    [stated(COASTAL), ...HER_TONES],
    [],
    [],
    FACETS,
    OPTIONS
  );

  for (let seed = 0; seed < 500; seed += 1) {
    const result = chooseDestinations(
      [wrongVoice, rightVoice, ...filler],
      vector,
      "girls_weekend",
      FACETS,
      OPTIONS,
      rng(seed),
      OPTIONS.now!,
      NO_STRUCTURE
    );
    assert.ok(
      !result.shortlist.some((s) => s.destination.id === "d-wrong"),
      `seed ${seed} put THE AESTHETIC WINNER back on the shortlist. Exploration ` +
        `may trade one voice-true destination for another; it may NEVER ` +
        `resurrect an aesthetic winner that the tone filter killed. The dither ` +
        `operates within the tone-surviving set, and it does so because the ` +
        `eliminated destinations are not in the array it is handed.`
    );
  }
});

test("a hard clash is a catalogue gap BEFORE it is an engine decision", () => {
  const { wrongVoice } = voiceFixtures();
  // Deliberately the BETTER LOOK — it carries both of the taste directions she
  // asked for — and the worse voice of the two. If the fallback ranked on
  // looks, this is the one it would take.
  const alsoWrong = destination("d-wrong2", "THE BETTER LOOK", {
    [COASTAL.id]: 1,
    [DISCO.id]: 0.9,
    [UNDERSTATED.id]: 1,
    // Quieter still, so the two are not tied on voice: this one is the further
    // of the two from a room that is warm and loud (−0.37 against −0.22), and
    // the fallback therefore has a real choice to get wrong.
    [LOW_VOICES.id]: 1,
  });
  const vector = buildVector(
    // DISCO_DIRECTION is the answer the gap is keyed on and is deliberately NOT
    // scored — `taste_direction` is out of the vector until the catalogue is
    // tagged in it. It reaches this report through `vector.unscored`, which is
    // the whole reason that field exists: an answer that stops scoring must not
    // also stop being reported as the thing the library is missing.
    [stated(COASTAL), stated(DISCO), stated(DISCO_DIRECTION), ...HER_TONES],
    [],
    [],
    FACETS,
    OPTIONS
  );

  const result = chooseDestinations(
    [wrongVoice, alsoWrong],
    vector,
    "girls_weekend",
    FACETS,
    OPTIONS,
    rng(1),
    OPTIONS.now!,
    NO_STRUCTURE
  );

  assert.ok(result.voiceClash, "nothing cleared the bar");
  assert.equal(result.gaps.length, 1, "and the house was told, first");
  assert.equal(result.gaps[0].pool, "destination");
  assert.match(
    result.gaps[0].slotCode,
    /disco_after_dark/,
    "keyed on the look that has to be authored in her voice"
  );
  assert.match(
    result.gaps[0].detail,
    /hole in the catalogue/,
    "the sentence says whose problem it is: the library's, not her answers'"
  );

  // AND VOICE STILL WINS. The fallback takes the CLOSEST VOICE, never the best
  // look — otherwise the tier collapses into a weight exactly when it matters.
  assert.ok(
    facetOverlap(vector.weights, alsoWrong.facets) >
      facetOverlap(vector.weights, wrongVoice.facets),
    "the fixture is only meaningful if the two disagree about which is better"
  );
  assert.equal(result.shortlist.length, 1);
  assert.equal(
    result.shortlist[0].destination.name,
    "THE AESTHETIC WINNER",
    `the fallback took THE BETTER LOOK. Voice wins even when it wins by a poor ` +
      `margin: falling back to the best-looking destination is the tier ` +
      `collapsing into a weight at exactly the moment the tier is load-bearing, ` +
      `and it is what would put a deadpan invitation in front of people who cry ` +
      `at the toast.`
  );
});

test("a woman who answered no tone question is not eliminated by silence", () => {
  const { wrongVoice, rightVoice } = voiceFixtures();
  const vector = buildVector([stated(COASTAL)], [], [], FACETS, OPTIONS);

  const result = chooseDestinations(
    [wrongVoice, rightVoice],
    vector,
    "girls_weekend",
    FACETS,
    OPTIONS,
    rng(1),
    OPTIONS.now!,
    NO_STRUCTURE
  );

  assert.ok(result.toneSilent);
  assert.equal(
    result.shortlist.length,
    2,
    "absence is silence, never a claim — she was never shown the question"
  );
  assert.equal(result.eliminated.filter((e) => e.tier === "voice").length, 0);
});

test("a destination nobody has tagged is not eliminated by its own silence", () => {
  const { rightVoice } = voiceFixtures();
  const untagged = destination("d-untagged", "NOT YET TAGGED", {
    [COASTAL.id]: 0.9,
  });
  const vector = buildVector(
    [stated(COASTAL), ...HER_TONES],
    [],
    [],
    FACETS,
    OPTIONS
  );

  const result = chooseDestinations(
    [untagged, rightVoice],
    vector,
    "girls_weekend",
    FACETS,
    OPTIONS,
    rng(1),
    OPTIONS.now!,
    NO_STRUCTURE
  );

  assert.equal(
    result.shortlist.length,
    2,
    `an untagged destination scores 0 by construction, and 0 is below any ` +
      `useful bar. Treating that silence as a score would delete every ` +
      `destination the house has not got round to tagging — today that is every ` +
      `fixture and every stub. No claim means no restriction, exactly as it does ` +
      `on the occasion, slot, destination and venue axes.`
  );
  assert.equal(
    result.shortlist.find((s) => s.destination.id === "d-untagged")!.toneMatch,
    null,
    "and it is carried as UNJUDGED rather than as a number nobody measured"
  );
});

/* ─────────────────────────────────────────────────────────────────────
 * THE STRUCTURAL MATRIX, IN THE RANKING
 *
 * `rankByStructure` was written, tested and never called: the ranking stage
 * scored the aesthetic half of her vector and stopped, so a host's
 * `how_it_ends` and `meal_time` were recorded, resolved, carried — and moved
 * nothing. These tests are the other end of that wire.
 *
 * WHAT THEY ARE BUILT TO CATCH, because a test that cannot fail is worse than
 * no test (CLAUDE.md rule 24): every case below gives the room that STRUCTURE
 * SHOULD REFUSE the better look, so a ranking that ignored the matrix, read the
 * wrong column, or blended the two numbers into one comes out in the opposite
 * order and goes red. And each fed column is driven in BOTH directions against
 * the same pair of rooms, so a scrambled cell — either room's, either way —
 * fails one of the two halves.
 *
 * THE ROOMS ARE REAL. Their slugs are the keys of data/destination-matrix.json,
 * which is what the ranker joins on; a fixture with an invented slug is
 * unrowed, and the last test in the section is about exactly that.
 * ───────────────────────────────────────────────────────────────────── */

/** Her two structural answers, as the quiz actually resolves them (db/037). */
const ENDS_UNTIL_MORNING = facet("f-end-until-morning", "evening_ending", "until_morning");
const STARTS_EVENING = facet("f-start-evening", "evening_start", "evening");

/**
 * One answer, on the QUIZ FIELD it was given on.
 *
 * `stated()` defaults `field` to the dimension, which is true of most answers
 * and false of these two: `meal_time` resolves onto `evening_start` AND onto
 * `meal_shape`, and `structureOf` reads the pair. Getting the field wrong here
 * would make every test below silently structure-free, which is the failure
 * they exist to catch — so they say the field out loud.
 */
function askedOn(f: Facet, field: string): StatedFacet {
  return { ...stated(f), field };
}

/**
 * A REAL ROOM, by its matrix slug, wearing the voice she asked for.
 *
 * Both rooms in every pair below carry her tones at full weight, so both clear
 * the voice bar comfortably and the tier has already done its work before
 * structure is asked anything. `look` is the only thing that separates them
 * aesthetically.
 */
function matrixRoom(slug: string, look: number): Destination {
  return destination(slug, slug.toUpperCase(), {
    [SENTIMENTAL.id]: 1,
    [ALL_AT_ONCE.id]: 1,
    [COASTAL.id]: look,
  });
}

/** Her vector for these tests: the tones that clear the bar, plus a look. */
function structuralVector() {
  return buildVector([stated(COASTAL), ...HER_TONES], [], [], FACETS, OPTIONS);
}

function rankOf(result: ReturnType<typeof chooseDestinations>, slug: string) {
  const entry = result.shortlist.find((s) => s.destination.slug === slug);
  assert.ok(entry, `${slug} is not in the shortlist at all`);
  return entry;
}

function chooseWith(rooms: Destination[], hers: StructuralRow) {
  return chooseDestinations(
    rooms,
    structuralVector(),
    "dinner_party",
    FACETS,
    OPTIONS,
    rng(1),
    OPTIONS.now!,
    hers
  );
}

test("THE FOUNDER'S CASE: an until-morning host does not get the Dolomites over New Orleans", () => {
  // She said the night runs until morning and begins in the evening.
  // NEW ORLEANS is that night exactly (until_morning, evening); the DOLOMITES
  // are its opposite on both columns (clean_stop, morning). So the Dolomites
  // are given the better LOOK, and must still lose.
  const dolomites = matrixRoom("dolomites", 1);
  const newOrleans = matrixRoom("new-orleans", 0.1);

  const result = chooseWith([dolomites, newOrleans], {
    ending: "until_morning",
    starts: "evening",
  });

  const nola = rankOf(result, "new-orleans");
  const dol = rankOf(result, "dolomites");

  // Both cleared the voice bar, so this is a ranking question and not a filter
  // question — which is the condition the case was stated under.
  assert.equal(result.shortlist.length, 2);
  for (const entry of result.shortlist) {
    assert.ok(
      (entry.toneMatch ?? 0) >= OPTIONS.toneThreshold,
      `${entry.destination.slug} did not clear the voice bar, so this test is ` +
        `measuring the filter and not the ranking`
    );
  }

  assert.equal(nola.structuralDistance, 0, "she described New Orleans");
  assert.equal(dol.structuralDistance, 2, "both columns disagree with the Dolomites");
  assert.ok(
    nola.rank < dol.rank,
    `the Dolomites (clean_stop, morning) outranked New Orleans (until_morning, ` +
      `evening) for a host who said until_morning and evening. Structure is a ` +
      `sort key over the voice survivors; it is not a decoration.`
  );

  // AND NOTHING WAS AVERAGED. The look still prefers the room structure
  // refused, and its aesthetic number is untouched by the distance — a blended
  // `0.6 · aesthetic + 0.4 · (1 − distance)` would have moved this the other way.
  assert.ok(
    dol.score > nola.score,
    "the aesthetic score must still say what it said; structure orders, it does not add"
  );
});

test("A WRONG `ending` CELL LOSES THIS — the column decides, in both directions", () => {
  // NEW ORLEANS (until_morning, evening) against NEW YORK (dissolves, evening).
  // They agree on `starts`, so `ending` is the only fed column that can
  // separate them, and the room she did NOT describe is given the better look
  // every time.
  for (const [answer, nearer, farther] of [
    ["until_morning", "new-orleans", "new-york"],
    ["dissolves", "new-york", "new-orleans"],
  ] as const) {
    const result = chooseWith(
      [matrixRoom(farther, 1), matrixRoom(nearer, 0.1)],
      { ending: answer, starts: "evening" }
    );

    assert.equal(rankOf(result, nearer).structuralDistance, 0);
    assert.equal(rankOf(result, farther).structuralDistance, 1);
    assert.equal(
      rankOf(result, nearer).rank,
      1,
      `she said the evening ${answer} and ${farther} won anyway. The ` +
        `${nearer} row and the ${farther} row differ on \`ending\` and on ` +
        `nothing else a host feeds, so this is that cell or it is nothing.`
    );
  }
});

test("A WRONG `starts` CELL LOSES THIS — the column decides, in both directions", () => {
  // CATSKILLS (dissolves, morning) against NANTUCKET (dissolves, evening).
  // They agree on `ending`, so `starts` is the only fed column left.
  for (const [answer, nearer, farther] of [
    ["morning", "catskills", "nantucket"],
    ["evening", "nantucket", "catskills"],
  ] as const) {
    const result = chooseWith(
      [matrixRoom(farther, 1), matrixRoom(nearer, 0.1)],
      { ending: "dissolves", starts: answer }
    );

    assert.equal(rankOf(result, nearer).structuralDistance, 0);
    assert.equal(rankOf(result, farther).structuralDistance, 1);
    assert.equal(
      rankOf(result, nearer).rank,
      1,
      `she said the evening starts in the ${answer} and ${farther} won anyway. ` +
        `These two rows differ on \`starts\` and on nothing else a host feeds.`
    );
  }
});

test("THE EPSILON: a quarter-point near miss is not a verdict, and a full column is", () => {
  // A host who names a late supper that ends cleanly. Against her:
  //
  //   HAVANA      (until_morning, evening)  ending +1.00, starts cancelled  1.00
  //   NEW YORK    (dissolves,     evening)  ending +1.00, starts near +0.25 1.25
  //   CATSKILLS   (dissolves,     morning)  ending +1.00, starts +1.00      2.00
  //
  // Havana and New York are 0.25 apart — one near miss, the whole of what
  // `structureEpsilon` is set to — so structure has not distinguished them and
  // the look decides. Havana and the Catskills are 1.00 apart, which is a
  // column she actually disagreed on, and there the look does not get a vote.
  const hers: StructuralRow = { ending: "clean_stop", starts: "late" };

  const withinBand = chooseWith(
    [matrixRoom("havana", 0.1), matrixRoom("new-york", 1)],
    hers
  );
  assert.equal(rankOf(withinBand, "havana").structuralDistance, 1);
  assert.equal(rankOf(withinBand, "new-york").structuralDistance, 1.25);
  assert.equal(
    rankOf(withinBand, "new-york").rank,
    1,
    `a 0.25 near miss overturned the look. Four near misses cost what one ` +
      `mismatch costs (structure.ts), so one of them is not a verdict — it is ` +
      `the tie the aesthetic score is there to break.`
  );

  const beyondBand = chooseWith(
    [matrixRoom("havana", 0.1), matrixRoom("catskills", 1)],
    hers
  );
  assert.equal(rankOf(beyondBand, "catskills").structuralDistance, 2);
  assert.equal(
    rankOf(beyondBand, "havana").rank,
    1,
    `a full column of disagreement did NOT overturn the look. Wider than ` +
      `epsilon and the structural order stands, or the epsilon is a way of ` +
      `switching the matrix off.`
  );
});

test("silence sorts nothing: a host who stated no column gets the aesthetic order", () => {
  // The same two rooms as the founder's case, and the same looks. With no
  // structural answer the Dolomites win, because nothing is charged against
  // anybody and the look is all there is (CLAUDE.md rule 3).
  const result = chooseWith(
    [matrixRoom("dolomites", 1), matrixRoom("new-orleans", 0.1)],
    NO_STRUCTURE
  );

  assert.equal(rankOf(result, "dolomites").rank, 1);
  for (const entry of result.shortlist) {
    assert.equal(
      entry.structuralDistance,
      null,
      "a room she stated nothing against is UNMEASURED, and 0 would read as a match"
    );
  }
});

test("a room with no matrix row is unmeasured, and unmeasured is never distant", () => {
  // An authored room she disagrees with on both columns, against a fixture
  // nobody has given a row. The fixture must not be pushed below the room she
  // contradicted — an absence in the matrix is the catalogue being unfinished,
  // never a property of the room (CLAUDE.md rule 29).
  assert.equal(
    matrixRow("d-no-row-here"),
    undefined,
    "this test needs a slug the matrix does not know"
  );

  const result = chooseWith(
    [matrixRoom("dolomites", 1), matrixRoom("d-no-row-here", 0.9)],
    { ending: "until_morning", starts: "evening" }
  );

  const unrowed = rankOf(result, "d-no-row-here");
  assert.equal(
    unrowed.structuralDistance,
    null,
    "an unrowed room must be carried as unmeasured, not as 0 and not as far"
  );
  assert.equal(unrowed.structuralRow, null);
  assert.equal(
    unrowed.rank,
    1,
    "the Dolomites are 2.00 from the evening she described and the unrowed " +
      "room is nothing from it. Charging a room for a cell nobody has written " +
      "would rank the catalogue's authoring backlog."
  );
});

test("the explanation names the cells, not the vibes", () => {
  // Two real rooms, her two structural answers on their real quiz fields, and
  // an account that has to name what it used. "If the explanation cannot name a
  // fed facet, the ranker used a ghost."
  const run = runSelection(
    inputFor(
      {
        destinations: [
          matrixRoom("new-orleans", 0.9),
          matrixRoom("dolomites", 0.2),
        ],
      },
      {
        stated: [
          stated(COASTAL),
          ...HER_TONES,
          askedOn(ENDS_UNTIL_MORNING, "how_it_ends"),
          askedOn(STARTS_EVENING, "meal_time"),
        ],
      }
    ),
    { seed: 5 }
  );

  const nola = run.candidates.find(
    (c) => c.destination.slug === "new-orleans"
  );
  assert.ok(nola, "New Orleans should be the first candidate for this host");
  const said = nola.explanation.destination.join(" ");

  assert.match(said, /ending=until_morning/);
  assert.match(said, /starts=evening/);
  assert.match(
    said,
    /0\.00 from the evening/,
    "the distance that moved the rank has to be in the account"
  );

  // AND THE SILENT ZERO, SAID OUT LOUD. Nothing in the library is tagged in a
  // dimension her aesthetic answers use, so the look half of this rank decided
  // nothing — and an explanation that let that pass as a low score would be
  // the same silence one layer up (CLAUDE.md rule 16).
  const dolomites = run.candidates.find(
    (c) => c.destination.slug === "dolomites"
  );
  assert.ok(dolomites);
  assert.match(
    dolomites.explanation.destination.join(" "),
    /(NOT ONE aesthetic key|ranked on mood=faded_coastal)/
  );
});

test("the explanation says so when structure abstained", () => {
  // The default fixtures have invented slugs, so no room has a row and no host
  // answer reaches a column. Both silences are stated rather than skipped.
  const run = runSelection(inputFor(), { seed: 5 });
  const said = run.candidates[0].explanation.destination.join(" ");
  assert.match(said, /STRUCTURE ABSTAINED/);
  assert.match(said, /ending/, "the column names are what a curator acts on");
});


/* ─────────────────────────────────────────────────────────────────────
 * THE COMPOSED TABLE — db/021, db/022, db/023
 *
 * The set menu is no longer the unit of selection. A table is three dishes,
 * picked separately, and everything below asserts a PROPERTY the composition
 * rules exist to guarantee rather than a number the constants happen to
 * produce.
 * ───────────────────────────────────────────────────────────────────── */

function dish(
  id: string,
  name: string,
  course: string,
  making: string,
  extra: Partial<Ingredient> = {}
): Ingredient {
  return ingredient(id, "dish", name, {}, {
    course: undefined,
    making,
    season: "year_round",
    meals: [],
    slots: [{ slotCode: course, fit: "native", note: null }],
    ...extra,
  } as Partial<Ingredient>);
}

const COURSE_RULES: SlotRule[] = [
  rule({
    slotCode: "the_appetizer",
    pool: "dish",
    section: "details",
    position: 11,
    coherenceGroup: "the_table",
  }),
  rule({
    slotCode: "the_main",
    pool: "dish",
    section: "details",
    position: 12,
    coherenceGroup: "the_table",
  }),
  rule({
    slotCode: "the_dessert",
    pool: "dish",
    section: "details",
    position: 13,
    coherenceGroup: "the_table",
  }),
];

function tableFor(
  dishes: Ingredient[],
  table: Parameters<typeof fillSlots>[4] = {},
  meal: string | null = null,
  /** Her month's season — db/026. Null is a host who has not settled one. */
  season: string | null = null
) {
  const vector = buildVector([stated(COASTAL)], [], [], FACETS, OPTIONS);
  const slots = planSlots(COURSE_RULES, SHAPE, SCALE).slots;
  const pools = scopePools(
    slots,
    dishes,
    destination("d1", "SOMEWHERE", {}),
    "dinner_party",
    vector.weights,
    vector.dealbreakers,
    (id) => FACETS[id]?.label ?? id,
    SCALE,
    null,
    OPTIONS,
    OPTIONS.now!,
    meal,
    season
  );
  return fillSlots(pools, SCALE, SHAPE, OPTIONS, table);
}

/** The same scoping, stopping at the pool, for asserting on a gap. */
function coursePoolsFor(
  dishes: Ingredient[],
  meal: string | null = null,
  season: string | null = null
) {
  const vector = buildVector([stated(COASTAL)], [], [], FACETS, OPTIONS);
  const slots = planSlots(COURSE_RULES, SHAPE, SCALE).slots;
  return scopePools(
    slots,
    dishes,
    destination("d1", "SOMEWHERE", {}),
    "dinner_party",
    vector.weights,
    vector.dealbreakers,
    (id) => FACETS[id]?.label ?? id,
    SCALE,
    null,
    OPTIONS,
    OPTIONS.now!,
    meal,
    season
  );
}

test("the table: the course claim keeps an appetizer out of the main course", () => {
  const fill = tableFor([
    dish("a1", "Clams casino", "the_appetizer", "half_made"),
    dish("m1", "Lobster thermidor", "the_main", "actually_made"),
    dish("d1", "Baked alaska", "the_dessert", "actually_made"),
  ]);

  const placed = new Map(
    fill.picks.map((pick) => [pick.slot.slotCode, pick.ingredient.name])
  );
  assert.deepEqual(
    [...placed.entries()].sort(),
    [
      ["the_appetizer", "Clams casino"],
      ["the_dessert", "Baked alaska"],
      ["the_main", "Lobster thermidor"],
    ],
    "db/022 projects dish.course into dish_slot as a NATIVE claim, and " +
      "claimEligibility already turns any native claim into a whitelist. No " +
      "new mechanism, and an appetizer is not a main."
  );
});

test("the table: two seasons cannot sit at one table", () => {
  const fill = tableFor([
    dish("a1", "Corn fritters", "the_appetizer", "actually_made", {
      season: "summer",
    }),
    // The best main by score would be the winter one; the table is already
    // summer, so it is refused rather than penalised.
    dish("m1", "Venison stew with juniper", "the_main", "actually_made", {
      season: "winter",
    }),
    dish("m2", "Boiled lobsters", "the_main", "actually_made", {
      season: "summer",
    }),
    dish("d1", "Blueberry pie", "the_dessert", "actually_made", {
      season: "summer",
    }),
  ]);

  const main = fill.picks.find((p) => p.slot.slotCode === "the_main")!;
  assert.equal(
    main.ingredient.name,
    "Boiled lobsters",
    "a summer appetizer commits the table to summer, and a winter main is " +
      "not a weak match — it is not one table"
  );
  assert.ok(
    fill.dropped.some((d) => d.reason === "table_disagreed"),
    "and the refusal is a sentence a curator can act on, never a catalogue gap"
  );
});

test("the table: a year-round dish agrees with everything and commits nothing", () => {
  const fill = tableFor([
    dish("a1", "Marinated olives", "the_appetizer", "bought_and_arranged"),
    dish("m1", "Venison stew with juniper", "the_main", "bought_and_arranged", {
      season: "winter",
    }),
    dish("d1", "Chestnut cream", "the_dessert", "bought_and_arranged", {
      season: "winter",
    }),
  ]);
  assert.equal(fill.picks.length, 3, "502 of 600 dishes are year-round");
});

test("the table: high summer sits inside summer, and narrows the table to it", () => {
  const fill = tableFor([
    dish("a1", "Garden tomato slices", "the_appetizer", "bought_and_arranged", {
      season: "summer",
    }),
    dish("m1", "One-pot clambake", "the_main", "bought_and_arranged", {
      season: "high_summer",
    }),
    // Spring is inside `shoulder` and not inside `high_summer`. Once the main
    // has narrowed the table to high summer this must be refused.
    dish("d1", "Strawberries in red wine", "the_dessert", "bought_and_arranged", {
      season: "spring",
    }),
    dish("d2", "Watermelon wedges", "the_dessert", "bought_and_arranged", {
      season: "summer",
    }),
  ]);
  const dessert = fill.picks.find((p) => p.slot.slotCode === "the_dessert")!;
  assert.equal(dessert.ingredient.name, "Watermelon wedges");
});

test("the table: her one making answer governs every course", () => {
  const fill = tableFor(
    [
      dish("a1", "Jumbo shrimp cocktail", "the_appetizer", "bought_and_arranged"),
      dish("a2", "Vichyssoise", "the_appetizer", "actually_made"),
      dish("m1", "Chilled seafood platter", "the_main", "bought_and_arranged"),
      dish("m2", "Beef wellington", "the_main", "actually_made"),
      dish("d1", "Ice cream sundae bar", "the_dessert", "bought_and_arranged"),
      dish("d2", "Baked alaska", "the_dessert", "actually_made"),
    ],
    { rung: "bought_and_arranged" }
  );

  assert.deepEqual(
    fill.picks.map((p) => p.ingredient.making),
    ["bought_and_arranged", "bought_and_arranged", "bought_and_arranged"],
    "she answered `how_made` once, about the whole evening. A table that is " +
      "two-thirds bought and one-third actually made is the mean of three " +
      "answers to a question she was asked one time."
  );
});

test("the table: a course with nothing at her rung steps toward MADE, not away", () => {
  // Nine of the thirteen destinations have no main that can be bought. This is
  // that, reproduced: she wants everything to arrive finished and the main
  // course has nothing bought in it at all.
  const fill = tableFor(
    [
      dish("a1", "Jumbo shrimp cocktail", "the_appetizer", "bought_and_arranged"),
      dish("m1", "Poached salmon", "the_main", "half_made"),
      dish("m2", "Beef wellington", "the_main", "actually_made"),
      dish("d1", "Ice cream sundae bar", "the_dessert", "bought_and_arranged"),
    ],
    { rung: "bought_and_arranged" }
  );

  const main = fill.picks.find((p) => p.slot.slotCode === "the_main")!;
  assert.equal(
    main.ingredient.making,
    "half_made",
    "ONE step toward made, and only one. A missing main is worse than a main " +
      "one rung off, and the catalogue documents how made things bend toward " +
      "bought and never the reverse — so a host handed slightly more work can " +
      "order it, and a host handed something bought cannot un-buy it."
  );
  assert.equal(fill.picks.length, 3, "and the table is not broken");
});

test("the table: nothing repeats within it", () => {
  // One dish claiming two courses is not a thing db/022 can produce — the
  // projection writes one claim — but the search's own `used` set is what
  // guarantees it, and it is worth asserting where the guarantee lives.
  const both = dish("x1", "The one dish", "the_appetizer", "half_made", {
    slots: [
      { slotCode: "the_appetizer", fit: "native", note: null },
      { slotCode: "the_main", fit: "native", note: null },
    ],
  });
  const fill = tableFor([
    both,
    dish("m2", "Something else", "the_main", "half_made"),
    dish("d1", "A dessert", "the_dessert", "half_made"),
  ]);
  const names = fill.picks.map((p) => p.ingredient.name);
  assert.equal(new Set(names).size, names.length);
});

/* ─────────────────────────────────────────────────────────────────────
 * THREE PER COURSE — db/062
 *
 * Founder, 2026-09-05: "lets give 3 menu options (if member wants) like we do
 * for games", then "three per course".
 *
 * The mechanism is db/061's, unchanged and pointed at a second pool, so what
 * is asserted here is not that the carousel works — selection.test.ts already
 * proves that against the game beat — but the two things that are TRUE OF
 * DISHES AND NOT OF GAMES:
 *
 *   · a game is one unit; three courses answer each other, so the coherence
 *     group has to bind the whole OFFER and not merely the pick, or she can
 *     assemble a table the house would never have set;
 *   · the dish pool is deep in most rooms and thin in a few, and the thin ones
 *     must show what exists rather than pad, repeat or fail.
 * ───────────────────────────────────────────────────────────────────── */

/** The same three courses, each offering three. db/062. */
const COURSES_OFFERED: SlotRule[] = COURSE_RULES.map((r) => ({
  ...r,
  offerCount: 3,
}));

function offeredTableFor(
  dishes: Ingredient[],
  season: string | null = null
) {
  const vector = buildVector([stated(COASTAL)], [], [], FACETS, OPTIONS);
  const slots = planSlots(COURSES_OFFERED, SHAPE, SCALE).slots;
  const pools = scopePools(
    slots,
    dishes,
    destination("d1", "SOMEWHERE", {}),
    "dinner_party",
    vector.weights,
    vector.dealbreakers,
    (id) => FACETS[id]?.label ?? id,
    SCALE,
    null,
    OPTIONS,
    OPTIONS.now!,
    null,
    season
  );
  return fillSlots(pools, SCALE, SHAPE, OPTIONS, { season });
}

/**
 * n dishes of one course, all agreeing with everything.
 *
 * TAGGED, and that is not decoration. An optional unit is skipped when nothing
 * in it scores above zero (fill.ts), and an untagged ingredient scores exactly
 * zero by construction — so a pool of untagged dishes would offer one card per
 * course and prove nothing about the carousel. Real dishes carry facets
 * (db/021's `dish_facet`); these carry one, at descending weights, so the
 * order of the cards is decided and stable.
 *
 * The similarity discount is deliberately in play here rather than designed
 * around: it is PROPORTIONAL (score.ts) and cannot flip a candidate's sign, so
 * the second and third cards of a course are worth less than the first and are
 * still worth offering. That is the property the carousel rests on.
 */
function spread(course: string, n: number, making = "half_made"): Ingredient[] {
  return Array.from({ length: n }, (_, i) =>
    dish(`${course}-${i}`, `${course} ${i}`, course, making, {
      facets: { [COASTAL.id]: 1 - i * 0.1 },
    })
  );
}

test("three per course is NINE units of THREE beats — an or, not an and", () => {
  const slots = planSlots(COURSES_OFFERED, SHAPE, SCALE).slots;

  assert.equal(slots.length, 9, "three candidates at each of three courses");
  assert.equal(
    new Set(slots.map((s) => s.offerGroup)).size,
    3,
    "and three beats. She eats three dishes and is shown nine"
  );
  assert.deepEqual(
    slots.filter((s) => s.required).map((s) => s.slotCode),
    ["the_appetizer", "the_main", "the_dessert"],
    "only the first card of each course is required, which is the whole of " +
      "'where fewer than three are eligible, show what exists'"
  );
  assert.ok(
    slots.every((s) => s.coherenceGroup === "the_table"),
    "and all nine are one table — db/022's group survives the expansion, " +
      "which is what stops her assembling a summer main and a winter dessert"
  );
});

test("THE WHOLE OFFER IS ONE TABLE: every card agrees on season", () => {
  // THE QUESTION DISHES RAISE AND GAMES DO NOT. She mixes and matches after
  // delivery, so it is not enough for the three courses the house would have
  // chosen to agree — all NINE have to, or some combination she can assemble
  // is a table nobody would have set.
  //
  // Nothing was added for this. db/022 commits the group's season on the first
  // card placed and every card after it is refused if it disagrees, offered or
  // not, which is why db/062 adds no coherence rule of its own.
  const fill = offeredTableFor(
    [
      ...spread("the_appetizer", 3),
      ...spread("the_main", 2),
      // Tagged well enough to be offered on every other axis, so the only
      // thing that can keep it off her table is the season. An untagged dish
      // would be dropped as a weak match and this test would pass for the
      // wrong reason (rule 21's last paragraph — proved by making it
      // year_round and watching this go red).
      dish("m-winter", "Venison stew", "the_main", "half_made", {
        season: "winter",
        facets: { [COASTAL.id]: 1 },
      }),
      ...spread("the_dessert", 2),
      dish("d-winter", "Chestnut cake", "the_dessert", "half_made", {
        season: "winter",
        facets: { [COASTAL.id]: 1 },
      }),
    ],
    "summer"
  );

  const offered = fill.picks.map((p) => p.ingredient.name);
  assert.ok(
    !offered.includes("Venison stew") && !offered.includes("Chestnut cake"),
    `a winter dish was offered at a summer table: ${offered.join(", ")}. ` +
      `The card she is shown is a card she may take, so a card that cannot ` +
      `sit at her table must never be dealt.`
  );
});

test("THE WHOLE OFFER IS ONE TABLE: every card agrees on the rung", () => {
  // The same argument on the second coherence axis. Her one making answer
  // governs every course (db/016), and with three per course it has to govern
  // all nine cards — otherwise she can pick a bought-and-arranged appetizer
  // beside a main that wants a day of cooking, on a night she said she wanted
  // neither.
  const fill = offeredTableFor(
    [
      ...spread("the_appetizer", 3, "half_made"),
      ...spread("the_main", 2, "half_made"),
      // Best-scoring main in the pool, so the rung is the only thing that can
      // refuse it. Same guard as the season test above.
      dish("m-made", "A day of stock", "the_main", "actually_made", {
        facets: { [COASTAL.id]: 1 },
      }),
      ...spread("the_dessert", 3, "half_made"),
    ],
    null
  );

  const rungs = new Set(fill.picks.map((p) => p.ingredient.making));
  assert.deepEqual(
    [...rungs],
    ["half_made"],
    "one rung across all nine cards, not one rung across the three she takes"
  );
});

test("A SPARE CARD IS NEVER OFFERED AT A RUNG SHE DID NOT ASK FOR", () => {
  // db/022's rung fallback exists so a REQUIRED course is not empty: "a table
  // with a main in it at the wrong rung beats a table with no main." That
  // argument is about the beat being empty and does not reach the beat's
  // second and third cards — db/061's "only the first candidate of an offer is
  // required", arriving on the coherence axis.
  //
  // Two half-made mains and one that wants a day of stock. Before this was
  // fixed the third card was dealt at the wrong rung, so a host who said she
  // wanted a half-made evening could press a button and get the thing she
  // declined — rule 16, at the one point she can act on it.
  const fill = offeredTableFor([
    ...spread("the_appetizer", 3, "half_made"),
    ...spread("the_main", 2, "half_made"),
    dish("m-made", "A day of stock", "the_main", "actually_made", {
      facets: { [COASTAL.id]: 1 },
    }),
    ...spread("the_dessert", 3, "half_made"),
  ]);

  const mains = fill.picks.filter((p) => p.slot.slotCode === "the_main");
  assert.deepEqual(
    mains.map((p) => p.ingredient.making),
    ["half_made", "half_made"],
    "two cards at her rung, and a third at another rung is not a richer " +
      "choice — she is offered fewer, and that is the honest number"
  );
  assert.equal(
    fill.gaps.length,
    0,
    "and offering two is not a work order for the house"
  );
});

test("three per course never repeats a dish, within a course or across them", () => {
  const fill = offeredTableFor([
    ...spread("the_appetizer", 5),
    ...spread("the_main", 5),
    ...spread("the_dessert", 5),
  ]);

  assert.equal(fill.picks.length, 9, "nine cards from a pool that has them");
  const ids = fill.picks.map((p) => p.ingredient.id);
  assert.equal(
    new Set(ids).size,
    9,
    "nothing is padded out to make up a number and nothing is dealt twice"
  );
  for (const course of ["the_appetizer", "the_main", "the_dessert"]) {
    assert.equal(
      fill.picks.filter((p) => p.slot.slotCode === course).length,
      3,
      `${course} offers three`
    );
  }
});

test("A ROOM WITH ONE DESSERT OFFERS ONE, AND THAT IS NOT A GAP", () => {
  // St. Moritz has one main and one dessert in docs/dishes.md, and Palm
  // Springs refuses a main course outright — CLAUDE.md rule 30, founder's
  // ruling, "the room working, not a gap". So this is not a hypothetical:
  // the second and third cards are ordinary optional units and are dropped the
  // way any optional slot is dropped.
  const fill = offeredTableFor([
    ...spread("the_appetizer", 3),
    ...spread("the_main", 2),
    dish("d-only", "The one dessert", "the_dessert", "half_made", {
      facets: { [COASTAL.id]: 1 },
    }),
  ]);

  assert.deepEqual(
    fill.picks.filter((p) => p.slot.slotCode === "the_dessert").length,
    1,
    "one is what exists, so one is what shows"
  );
  assert.deepEqual(
    fill.picks.filter((p) => p.slot.slotCode === "the_main").length,
    2,
    "and two where two exist"
  );
  assert.equal(
    fill.gaps.length,
    0,
    "AND NOT A GAP. A room with one dessert is a room with one dessert, not a " +
      "work order for the house — and one gap per beat, never one per card"
  );
});

test("a course with nothing at all is ONE gap, not three", () => {
  const fill = offeredTableFor([
    ...spread("the_appetizer", 3),
    ...spread("the_main", 3),
  ]);

  const dessert = fill.gaps.filter((g) => g.slotCode === "the_dessert");
  assert.equal(
    dessert.length,
    1,
    "a gap is a work order — the pool could not fill a beat her occasion has " +
      "— and a list that says three things are missing when one is has " +
      "stopped being a count of anything"
  );
});

test("what a dish is for: no claim means every shape, any claim is a whitelist", () => {
  const dishes = [
    dish("a1", "Untagged", "the_appetizer", "half_made"),
    dish("a2", "Brunch only", "the_appetizer", "half_made", { meals: ["brunch"] }),
    dish("m1", "A main", "the_main", "half_made"),
    dish("d1", "A dessert", "the_dessert", "half_made"),
  ];

  const anywhere = tableFor(dishes, {}, null);
  assert.equal(
    anywhere.picks.filter((p) => p.slot.slotCode === "the_appetizer").length,
    1,
    "a caller that does not know the meal shape filters nothing"
  );

  const dinner = tableFor(dishes, {}, "long_dinner");
  const first = dinner.picks.find((p) => p.slot.slotCode === "the_appetizer")!;
  assert.equal(
    first.ingredient.name,
    "Untagged",
    "650 authored lines carry no fourth field and are eligible everywhere; " +
      "the one dish tagged for brunch is not at a long dinner"
  );
});

/* ─────────────────────────────────────────────────────────────────────
 * WHEN IT IS — db/026
 *
 * `season_strict` was stored on every menu, drink and dish from db/012 onward
 * and read by nothing, because the application never asked when the evening
 * was. These are the properties that answer buys, and the one it must not.
 * ───────────────────────────────────────────────────────────────────── */

/** Her month, as the bridge resolves it: field `event_month`, dimension `season`. */
function monthAnswer(seasonCode: string): StatedFacet {
  return {
    facetId: `f-season-${seasonCode}`,
    dimension: "season",
    code: seasonCode,
    label: seasonCode,
    field: "event_month",
    polarity: "positive",
    weight: 1,
  };
}

test("when it is: a month resolves to a season, still deciding resolves to none", () => {
  assert.equal(statedSeason([monthAnswer("winter")]), "winter");

  // "Still deciding" resolves to `event_timing/not_decided`, which is not a
  // season — so it arrives here as the absence it is, without this function
  // knowing the code. Absence is a route, not a fault.
  const undecided: StatedFacet = {
    facetId: "f-undecided",
    dimension: "event_timing",
    code: "not_decided",
    label: "Still deciding",
    field: "event_month",
    polarity: "positive",
    weight: 1,
  };
  assert.equal(
    statedSeason([undecided]),
    null,
    "an answer that is not a season is not a season"
  );

  assert.equal(statedSeason([]), null, "and an application that predates the question");
});

test("when it is: in season is DIRECTIONAL, and table agreement is not", () => {
  // Her season is a point on the calendar; a band is a set of them. The test is
  // whether the band contains her point, and it does not commute.
  assert.equal(inSeason("high_summer", "summer"), true, "August is inside summer");
  assert.equal(
    inSeason("summer", "high_summer"),
    false,
    "June is NOT inside high summer — an August dish is out of season in June, " +
      "and the symmetric test seasonAgrees() would have let it through"
  );
  assert.equal(
    seasonAgrees("summer", "high_summer"),
    true,
    "which it does, correctly, because THAT question is whether two dishes can " +
      "sit at one table and neither of them outranks the other"
  );

  assert.equal(inSeason("spring", "shoulder"), true, "spring is inside the shoulder");
  assert.equal(inSeason("winter", "shoulder"), false, "winter is not");
  assert.equal(inSeason("winter", "year_round"), true, "a claim about nothing");
  assert.equal(inSeason("winter", null), true, "and no claim at all");
  assert.equal(
    inSeason(null, "summer"),
    true,
    "a host with no month refuses nothing: she has not made a claim either"
  );
});

test("when it is: strict refuses in February, and a soft season only leans", () => {
  const clambake = dish("m1", "Boil pot on the beach", "the_main", "actually_made", {
    season: "summer",
    seasonStrict: true,
  });
  const soft = dish("m2", "Cold poached salmon", "the_main", "half_made", {
    season: "summer",
  });

  const winter = coursePoolsFor([clambake, soft], null, "winter");
  const main = [...winter.values()].find(
    (entry) => entry.slot.slotCode === "the_main"
  )!;

  assert.deepEqual(
    main.candidates.map((c) => c.ingredient.name),
    ["Cold poached salmon"],
    "db/012: some menus are merely seasonal and some are WRONG out of season. " +
      "The clambake is the second kind and leaves the pool; the salmon is the " +
      "first and stays in it, to be scored"
  );

  const summer = coursePoolsFor([clambake, soft], null, "high_summer");
  const inAugust = [...summer.values()].find(
    (entry) => entry.slot.slotCode === "the_main"
  )!;
  assert.equal(
    inAugust.candidates.length,
    2,
    "and in August both are in the pool — summer contains high summer"
  );
});

test("when it is: a season that empties a pool is a catalogue gap that says so", () => {
  // The destination whose only main is written for summer, in February. Not a
  // silent disappearance: a work order, with the reason first.
  const pools = coursePoolsFor(
    [
      dish("a1", "Something", "the_appetizer", "half_made"),
      dish("m1", "Boil pot on the beach", "the_main", "actually_made", {
        season: "summer",
        seasonStrict: true,
      }),
      dish("d1", "A dessert", "the_dessert", "half_made"),
    ],
    null,
    "winter"
  );

  const main = [...pools.values()].find(
    (entry) => entry.slot.slotCode === "the_main"
  )!;
  assert.equal(main.candidates.length, 0);
  assert.ok(main.gap, "an empty pool her occasion asked for is a gap");
  assert.match(
    main.gap!.detail,
    /Boil pot on the beach is written strictly for summer and this is winter/,
    "the reason a curator can act on, first — she authors a winter main, or " +
      "she decides the tag was wrong"
  );
});

test("when it is: still deciding excludes nothing at all", () => {
  const dishes = [
    dish("a1", "Something", "the_appetizer", "half_made"),
    dish("m1", "Boil pot on the beach", "the_main", "actually_made", {
      season: "summer",
      seasonStrict: true,
    }),
    dish("d1", "A dessert", "the_dessert", "half_made"),
  ];

  const pools = coursePoolsFor(dishes, null, null);
  const main = [...pools.values()].find(
    (entry) => entry.slot.slotCode === "the_main"
  )!;
  assert.equal(
    main.candidates.length,
    1,
    "the strictest dish in the library survives a host who has not picked a " +
      "month, because nothing may be refused on a fact nobody stated"
  );
  assert.equal(main.gap, null, "and there is no work order, because there is no hole");
});

test("when it is: the table opens on her calendar, not on the first dish", () => {
  // Nothing here is strict, so the pool filter does not fire at all. What
  // refuses the summer main is the same course-agreement rule db/022 already
  // had — it simply now opens on February instead of on whatever was decided
  // first.
  // The appetizer is the most-constrained slot, so it is decided FIRST and the
  // table has committed to nothing yet. What refuses the summer one is the
  // calendar alone.
  const fill = tableFor(
    [
      dish("a1", "Oysters on ice", "the_appetizer", "half_made", { season: "summer" }),
      dish("a2", "Chestnut soup", "the_appetizer", "half_made", { season: "winter" }),
      dish("m1", "Braised short ribs", "the_main", "half_made"),
      dish("m2", "Beef wellington", "the_main", "half_made"),
      dish("m3", "Coq au vin", "the_main", "half_made"),
      dish("d1", "A dessert", "the_dessert", "half_made"),
      dish("d2", "Another dessert", "the_dessert", "half_made"),
      dish("d3", "A third dessert", "the_dessert", "half_made"),
    ],
    { season: "winter" }
  );

  const first = fill.picks.find((p) => p.slot.slotCode === "the_appetizer")!;
  assert.equal(first.ingredient.name, "Chestnut soup");

  const refused = fill.dropped.find((d) => d.reason === "table_disagreed");
  assert.ok(refused, "and the curator is told why the obvious dish is not on it");
  assert.match(
    refused!.detail,
    /she is having this in winter/,
    "and told which KIND of disagreement it was: a calendar nobody is going " +
      "to move, rather than two courses that could be swapped. Nothing had " +
      "been placed yet — the table opened on her date"
  );
});

test("when it is: a spring table cannot drift into autumn through the shoulder", () => {
  // The reason her season SEEDS the commitment rather than being compared
  // against it. `narrowSeason` only narrows: a group that opened empty and took
  // the shoulder appetizer would thereafter be a shoulder table, and an autumn
  // dessert would agree with it — at a party in April.
  const fill = tableFor(
    [
      dish("a1", "Asparagus vinaigrette", "the_appetizer", "half_made", {
        season: "shoulder",
      }),
      dish("m1", "A main", "the_main", "half_made"),
      dish("d1", "Roast pears in wine", "the_dessert", "half_made", {
        season: "autumn",
      }),
      dish("d2", "Rhubarb fool", "the_dessert", "half_made", { season: "spring" }),
    ],
    { season: "spring" }
  );

  const dessert = fill.picks.find((p) => p.slot.slotCode === "the_dessert")!;
  assert.equal(dessert.ingredient.name, "Rhubarb fool");
});

test("when it is: her answer names the meal, and no meal outranks it", () => {
  assert.equal(
    mealShape([], "brunch"),
    "brunch",
    "three of db/023's five shapes were unreachable, so a dish tagged for " +
      "brunch was not narrowed to brunch — it was removed from every table"
  );
  assert.equal(
    mealShape([], null),
    "long_dinner",
    "an application written before the question was asked behaves as it did"
  );
  assert.equal(
    mealShape(["no_seated_meal"], "brunch"),
    "cocktails",
    "and the exclusion still wins: the answer that removes the main and the " +
      "dessert is the answer that makes it a cocktail party. She cannot be " +
      "shown the meal question at all in that case, so this can only fire " +
      "against a stale answer — and it fires against it correctly"
  );
});

test("when it is: a brunch dish is finally reachable", () => {
  const dishes = [
    dish("a1", "Untagged", "the_appetizer", "half_made"),
    dish("a2", "Quiche lorraine", "the_appetizer", "half_made", {
      meals: ["brunch"],
    }),
    dish("m1", "A main", "the_main", "half_made"),
    dish("d1", "A dessert", "the_dessert", "half_made"),
  ];

  const appetizersAt = (meal: string) =>
    [...coursePoolsFor(dishes, meal).values()]
      .find((entry) => entry.slot.slotCode === "the_appetizer")!
      .candidates.map((c) => c.ingredient.name)
      .sort();

  assert.deepEqual(
    appetizersAt("brunch"),
    ["Quiche lorraine", "Untagged"],
    "a claim NARROWS where it applies. Before db/026 there was no where: " +
      "`brunch` was a shape nothing could produce, so the claim only ever " +
      "removed — tagging a dish for brunch took it off every table the engine " +
      "could set"
  );
  assert.deepEqual(
    appetizersAt("long_dinner"),
    ["Untagged"],
    "and it still removes elsewhere, which is the half that already worked"
  );
});
