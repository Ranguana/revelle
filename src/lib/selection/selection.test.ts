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
import test from "node:test";

import { chooseDestinations } from "./destination.ts";
import { runSelection } from "./engine.ts";
import { fillSlots, scopePools } from "./fill.ts";
import { memberRevelle, type MemberRevelle } from "./member.ts";
import { assemblageFingerprint, ensureNovel } from "./novelty.ts";
import { claimEligibility, planSlots } from "./occasion.ts";
import { dither, rng } from "./rng.ts";
import {
  facetOverlap,
  issuanceMultiplier,
  issuancePenalty,
  similarity,
  similarityDiscount,
} from "./score.ts";
import { buildVector } from "./vector.ts";
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
} from "./types.ts";

// ── fixtures ─────────────────────────────────────────────────────────

const FACETS: Record<string, Facet> = {};
function facet(id: string, dimension: string, code: string): Facet {
  const f = { id, dimension, code, label: code.replace(/_/g, " ") };
  FACETS[id] = f;
  return f;
}

const COASTAL = facet("f-coastal", "taste_direction", "faded_coastal");
const DISCO = facet("f-disco", "taste_direction", "disco_after_dark");
const NOVELTY = facet("f-novelty", "anti_preference", "novelty");
const EASE = facet("f-ease", "affinity", "ease");
const GUESTS = facet("f-guests", "guest_count", "from_9_to_12");

const OPTIONS = withDefaults({ seed: 42, now: new Date("2026-08-15T00:00:00Z") });

function stated(f: Facet, polarity: "positive" | "negative" = "positive"): StatedFacet {
  return {
    facetId: f.id,
    dimension: f.dimension,
    code: f.code,
    label: f.label,
    field: f.dimension,
    polarity,
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
    OPTIONS,
    rng(1),
    OPTIONS.now!
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
    OPTIONS,
    rng(1),
    OPTIONS.now!
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
    OPTIONS,
    rng(1),
    OPTIONS.now!
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
  assert.ok(
    view.printedMatter.some((p) => p.body.includes("forty minutes")),
    "the printed matter is the authored text of what she actually got"
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
