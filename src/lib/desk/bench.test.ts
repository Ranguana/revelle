import assert from "node:assert/strict";
import test from "node:test";

import { benchErrors, randomAnswers } from "./bench-answers.ts";
import { compareRuns, type BenchCandidate, type BenchRun } from "./bench-run.ts";

/**
 * THE TWO PARTS OF THE BENCH THAT ARE NOT THE ENGINE.
 *
 * Everything else on that screen is `runSelection`, which has its own two
 * thousand lines of tests and is exercised through the real thing. What is new
 * is a dice roll and a diff, and both fail SILENTLY when they are wrong:
 *
 *   a rolled host that does not validate  produces a refusal a curator reads as
 *                                         a broken tool.
 *   a diff that misses a moved pick       tells her the change she just made
 *                                         did nothing, which is the exact
 *                                         opposite of what the screen is for.
 *
 * Neither module touches a database or a framework, which is why they live
 * apart from src/lib/desk/bench.ts and why this file can run under
 * `node --test` with nothing standing up.
 */

/* ── roll the dice ──────────────────────────────────────────────────── */

/**
 * A deterministic stand-in for Math.random, so a failure is reproducible.
 *
 * The first few outputs are discarded. A linear congruential generator started
 * at 1, 2, 3 … produces first values that are almost the same number, and the
 * first value here decides the occasion — so without the warm-up two hundred
 * "different" hosts all turn out to be planning a birthday, and the tests below
 * would be exercising one host two hundred times.
 */
function seeded(seed: number): () => number {
  let state = (seed * 2654435761) >>> 0;
  const next = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
  next();
  next();
  return next;
}

test("a rolled host always answers the application", () => {
  for (let seed = 1; seed <= 200; seed += 1) {
    const answers = randomAnswers(seeded(seed));
    assert.deepEqual(
      benchErrors(answers),
      [],
      `seed ${seed} produced a host the quiz would refuse`
    );
  }
});

test("a rolled host never takes the option that opens a free-text box", () => {
  // "Something else" needs her own words, and inventing those is the one thing
  // the roll refuses to do. It must therefore never choose the option.
  for (let seed = 1; seed <= 200; seed += 1) {
    const answers = randomAnswers(seeded(seed));
    assert.notEqual(answers.occasion, "other", `seed ${seed}`);
    assert.equal(answers.occasion_other, undefined, `seed ${seed}`);
  }
});

test("a rolled host leaves her own words empty", () => {
  assert.equal(randomAnswers(seeded(7)).secret, "");
});

test("the roll spreads — two hundred hosts are not one host", () => {
  // Math.random on purpose: this is the generator the button actually uses, and
  // the property being asserted is about the shipped path rather than about a
  // toy LCG. Twenty different people should cost twenty clicks, and they are
  // only different if the roll reaches across the question.
  const occasions = new Set<string>();
  const directions = new Set<string>();
  for (let i = 0; i < 200; i += 1) {
    const answers = randomAnswers();
    occasions.add(String(answers.occasion));
    for (const code of answers.taste_directions as string[]) directions.add(code);
  }
  // Eight occasions are offered once "something else" is excluded, and eleven
  // directions. A roll that reached two of either would not be worth a button.
  assert.ok(occasions.size >= 6, `only ${occasions.size} occasions in 200 rolls`);
  assert.ok(directions.size >= 8, `only ${directions.size} directions in 200 rolls`);
});

/* ── the diff ───────────────────────────────────────────────────────── */

function candidate(
  rank: number,
  name: string,
  picks: readonly [string, string][]
): BenchCandidate {
  return {
    rank,
    destinationId: name,
    destinationName: name,
    tagline: "",
    destinationScore: 0,
    destinationRank: rank,
    ditheredRank: rank,
    fingerprint: null,
    blocked: null,
    lowConfidence: false,
    budget: {
      guests: null,
      guestsAreConfirmed: false,
      planning: null,
      ceiling: null,
      totalCents: 0,
      totalPerHeadCents: null,
      overage: null,
      overagePerHead: null,
      unbounded: true,
      unpricedItems: [],
    },
    picks: picks.map(([slot, what]) => ({
      slotKey: slot,
      slotLabel: slot,
      pool: "menu",
      name: what,
      quantity: 1,
      perGuest: false,
      lineCostCents: null,
      forced: false,
      alternatives: 0,
      score: 0,
    })),
    explanation: {
      headline: "",
      destination: [],
      eliminated: [],
      forced: [],
      dropped: [],
      swapped: [],
      budget: [],
      gaps: [],
      excluded: [],
      emphasis: [],
      venue: [],
      confidence: [],
      secret: null,
    },
  };
}

function run(
  seed: number,
  candidates: BenchCandidate[],
  gaps: string[] = [],
  answers: Record<string, string | string[]> = { occasion: "birthday" }
): BenchRun {
  return {
    ranAt: "2026-08-15T00:00:00.000Z",
    seed,
    answers,
    impasse: null,
    candidates,
    eliminated: [],
    gaps: gaps.map((code) => ({
      pool: "menu",
      slotCode: code,
      slotLabel: code,
      required: true,
      detail: "",
    })),
    excluded: [],
    emphasis: {
      codes: [],
      guaranteed: [],
      attention: [],
      notes: [],
      repeatable: false,
      effortless: false,
      prepRegister: "full",
      tabletop: false,
      runsLate: false,
      needsHerMaterial: false,
    },
    vector: {
      terms: [],
      dealbreakers: [],
      blend: { stated: 0.55, history: 0, cohort: 0.45 },
      evidenceCount: 0,
    },
    library: { destinations: 13, ingredients: 68, slotsPlanned: 6 },
  };
}

const HAVANA = candidate(1, "HAVANA", [
  ["the_menu", "A late supper"],
  ["the_drinks", "Daiquiris"],
]);

test("the same run twice is reported as identical", () => {
  const diff = compareRuns(run(481516, [HAVANA]), run(481516, [HAVANA]));
  assert.equal(diff.identical, true);
  assert.deepEqual(diff.picks, []);
  assert.deepEqual(diff.destinations, []);
  assert.equal(diff.chosen, null);
  assert.equal(diff.seed, null);
});

test("a pick that moved is named, and the ones that did not are not", () => {
  const after = candidate(1, "HAVANA", [
    ["the_menu", "A midnight supper"],
    ["the_drinks", "Daiquiris"],
  ]);
  const diff = compareRuns(run(1, [HAVANA]), run(1, [after]));
  assert.equal(diff.identical, false);
  assert.deepEqual(diff.picks, [
    { slotLabel: "the_menu", from: "A late supper", to: "A midnight supper" },
  ]);
});

test("a slot that lost its pick is one change, not two", () => {
  // Keyed on the slot rather than on the position, or a single removal reads as
  // "the drinks changed" plus "the menu vanished".
  const after = candidate(1, "HAVANA", [["the_drinks", "Daiquiris"]]);
  const diff = compareRuns(run(1, [HAVANA]), run(1, [after]));
  assert.deepEqual(diff.picks, [
    { slotLabel: "the_menu", from: "A late supper", to: null },
  ]);
});

test("the shortlist reordering is reported per destination", () => {
  const before = [candidate(1, "HAVANA", []), candidate(2, "LAS VEGAS", [])];
  const after = [candidate(1, "LAS VEGAS", []), candidate(2, "HAVANA", [])];
  const diff = compareRuns(run(1, before), run(1, after));
  assert.deepEqual(diff.chosen, { from: "HAVANA", to: "LAS VEGAS" });
  assert.deepEqual(
    diff.destinations.map((d) => `${d.name} ${d.from}->${d.to}`).sort(),
    ["HAVANA 1->2", "LAS VEGAS 2->1"]
  );
});

test("a destination that left the shortlist reports a null rank", () => {
  const diff = compareRuns(
    run(1, [candidate(1, "HAVANA", []), candidate(2, "TAHITI", [])]),
    run(1, [candidate(1, "HAVANA", [])])
  );
  assert.deepEqual(diff.destinations, [{ name: "TAHITI", from: 2, to: null }]);
});

test("gaps opening and closing are told apart", () => {
  const diff = compareRuns(
    run(1, [HAVANA], ["the_soundtrack"]),
    run(1, [HAVANA], ["the_table"])
  );
  assert.deepEqual(diff.gapsOpened, ["the_table"]);
  assert.deepEqual(diff.gapsClosed, ["the_soundtrack"]);
  assert.equal(diff.identical, false);
});

test("a changed seed is called out, because the dither is then in play", () => {
  const diff = compareRuns(run(1, [HAVANA]), run(2, [HAVANA]));
  assert.deepEqual(diff.seed, { from: 1, to: 2 });
  assert.equal(diff.identical, false);
});

test("reordering a multi-select answer is not an answer changing", () => {
  const before = run(1, [HAVANA], [], { taste_directions: ["a", "b"] });
  const after = run(1, [HAVANA], [], { taste_directions: ["b", "a"] });
  assert.deepEqual(compareRuns(before, after).answers, []);
  assert.equal(compareRuns(before, after).identical, true);
});

test("an answer that actually changed is named by its field", () => {
  const before = run(1, [HAVANA], [], { occasion: "birthday" });
  const after = run(1, [HAVANA], [], { occasion: "getaway" });
  assert.deepEqual(compareRuns(before, after).answers, ["occasion"]);
});
