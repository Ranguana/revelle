/**
 * WHAT THEY ACTUALLY PLAY — the question, its consumers, and its one refusal.
 *
 * Founder, 2026-09-06: "keep appetite for play questions and add my questions
 * (or similar) regarding games, karaoke, etc. forget the people traits for
 * this. if hates games, get rid of game option - very simple."
 *
 * Three things have to hold and none of them is visible from the screen.
 *
 *   1. EVERY OPTION SHE CAN TAP REACHES SOMETHING. Rule 15/16: a tile that
 *      grades nothing is worse than no tile, because facetOverlap normalises
 *      by the vector's total mass and an unmatched term makes her result
 *      WORSE. The consumer of this question is the game carousel, so the check
 *      is a join against src/lib/games.ts, run in both directions (rule 24).
 *   2. THE RETIRED CODES STILL PARSE. Nine options left the offer and none
 *      left the vocabulary. A `group_fun` array stored under QUIZ_VERSION
 *      2026-08-h still resolves every code in it, and the only thing that
 *      changed is that the quiz stops offering them. This is the contract at
 *      the top of quiz.ts and it is silent when broken: an old row would
 *      simply start meaning less.
 *   3. `hates_games` REMOVES THE GAME. The constraint door, and it has to be
 *      driven through the real gate — planSlots with the exclusion set — and
 *      not asserted about a bridge row.
 *
 * WHY THE DATABASE IS READ AS TEXT. Same argument games.test.ts makes: the
 * cluster is unreachable from any laptop, and a hand-written copy of the
 * vocabulary in a test file is rule 19's hand-written list of pools — correct
 * until the next insert, then wrong without being broken.
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";

import { ALL_GAMES } from "./games.ts";
import { FIELDS, QUIZ_VERSION, stepErrors, type MultiField } from "./quiz.ts";
import { planSlots } from "./selection/occasion.ts";
import type { OccasionShape, Scale, SlotRule } from "./selection/types.ts";

const DB = readdirSync(new URL("../../db/", import.meta.url).pathname)
  .filter((f) => f.endsWith(".sql"))
  .sort()
  .map((f) => readFileSync(new URL(`../../db/${f}`, import.meta.url).pathname, "utf8"))
  .join("\n");

const FUN = FIELDS.group_fun as MultiField;
const OFFERED = FUN.options.map((o) => o.code);

/**
 * The fourteen that were offered under QUIZ_VERSION 2026-08-h, written out
 * because this is the one list in the codebase that MUST be a literal: it is
 * the historical record of what a stored response can contain, and deriving it
 * from anything current would make the test agree with whatever the module
 * happens to say today.
 */
const OFFERED_UNDER_2026_08_H = [
  "long_dinner",
  "dance",
  "compete",
  "toast",
  "dress_up",
  "perform",
  "talk_deep",
  "wander",
  "swim_late",
  "cook_together",
  "make_something",
  "work_the_room",
  "keep_a_secret",
  "play_for_stakes",
];

const RETIRED = OFFERED_UNDER_2026_08_H.filter((c) => !OFFERED.includes(c));

/* ── 1 · the offer ──────────────────────────────────────────────────── */

test("the question offers appetite for play and nothing else", () => {
  assert.deepEqual(
    OFFERED,
    [
      "compete",
      "perform",
      "theatre",
      "board_games",
      "group_games",
      "make_something",
      "keep_a_secret",
      "play_for_stakes",
      "hates_games",
    ],
    "the offered set changed. That is allowed — but a code may never be " +
      "reused for a different meaning, and a removal has to be reflected in " +
      "RETIRED below and in QUIZ_VERSION."
  );

  // Her four, by name, so a later tidy cannot quietly drop one.
  for (const code of ["theatre", "board_games", "group_games", "hates_games"]) {
    assert.ok(OFFERED.includes(code), `${code} is no longer offered`);
  }

  assert.equal(RETIRED.length, 9, `${RETIRED.length} codes retired rather than 9`);
  assert.equal(QUIZ_VERSION, "2026-09-a", "the offer changed without the stamp");
});

test("every option she can tap resolves to vocabulary db/ actually defines", () => {
  // scripts/check-facets.mjs calls this MISSING and exits non-zero for it: an
  // option with no facet mapping is stored and means nothing. That script needs
  // a database; this needs the repo.
  const registered = new Set(
    [...DB.matchAll(/\(\s*'group_fun',\s*'([a-z_]+)'\s*\)/g)].map((m) => m[1])
  );
  const facets = new Set(
    [...DB.matchAll(/\(\s*'group_fun',\s*'([a-z_]+)'\s*,/g)].map((m) => m[1])
  );

  for (const code of OFFERED) {
    if (code === "hates_games") {
      // It carries no taste of its own and bridges onto the axis
      // `play_appetite = 'none'` already uses. Checked by name below.
      assert.ok(registered.has(code), `${code} has no quiz_option row in db/`);
      continue;
    }
    assert.ok(
      facets.has(code),
      `${code} is offered and db/ defines no group_fun facet for it. She can ` +
        `tap it, it is stored, and it resolves to nothing.`
    );
  }
});

/* ── 2 · what the answer feeds ──────────────────────────────────────── */

const tags = (code: string) =>
  ALL_GAMES.filter((g) =>
    g.facets.some((f) => f.dimension === "group_fun" && f.code === code)
  );

test("NO TILE GRADES NOTHING: every taste option reaches at least one game", () => {
  /*
   * Rule 16's exact shape, and the reason this test is worth more than it
   * looks. An option nothing is tagged with does not merely fail to help —
   * facetOverlap in score.ts divides by the vector's TOTAL MASS, so the
   * unmatched term sits in the denominator and shrinks the score of every term
   * that DID match. Answering the question would make her result worse.
   *
   * `hates_games` is exempt and is the only exemption: it is a FILTER, checked
   * below by removing a slot rather than by scoring anything.
   */
  for (const code of OFFERED) {
    if (code === "hates_games") continue;
    const reached = tags(code);
    assert.ok(
      reached.length > 0,
      `group_fun:${code} is offered and no game carries it. Either tag the ` +
        `catalogue or do not ask the question — see CLAUDE.md rule 16.`
    );
  }
});

test("AND IN THE OTHER DIRECTION: every game answers this question", () => {
  // Rule 24 both ways. The first test catches a term nothing carries; this
  // catches a GAME nothing she can now say reaches, which is what nine
  // retirements could have produced silently. Two games had exactly this
  // problem before `group_games` was authored — palm-springs-the-best-line and
  // st-moritz-before-the-light-goes, whose only tags were talk_deep and toast.
  const offered = new Set(OFFERED);
  for (const game of ALL_GAMES) {
    const reachable = game.facets.filter(
      (f) => f.dimension === "group_fun" && offered.has(f.code)
    );
    assert.ok(
      reachable.length > 0,
      `${game.slug} carries no group_fun tag a host can still state, so it ` +
        `scores identically for everybody. That is rule 15's DEFAULT-ONLY.`
    );
  }
});

test("the retired tags are kept, not deleted, and are counted", () => {
  // Rule 14: superseded reasoning is preserved. These are authored judgements
  // about what each game is; they cost nothing while nothing asks for them and
  // a later question re-feeds them without re-authoring a line. The number is
  // asserted so that a future pass deleting them has to say so out loud.
  const unreachable = ALL_GAMES.flatMap((g) =>
    g.facets.filter((f) => f.dimension === "group_fun" && RETIRED.includes(f.code))
  );
  assert.equal(
    unreachable.length,
    30,
    `${unreachable.length} game tags carry a retired code rather than 30`
  );
});

/* ── 3 · the retired codes still parse ──────────────────────────────── */

test("A STORED ANSWER FROM 2026-08-h STILL RESOLVES, EVERY CODE OF IT", () => {
  /*
   * CODES ARE PERMANENT. db/037 built `quiz_option` to hold retired options
   * "so that a stored answer stays interpretable", and db/002's bridge is what
   * makes each one mean something. Removing an option from the quiz must not
   * remove either row — and the failure would be perfectly silent: an old
   * response would simply start projecting fewer facets into taste_signal, and
   * nothing would throw.
   *
   * check-facets.mjs calls this state ORPHANED and reports it as "retired,
   * kept so old answers resolve". This is the same check without a database.
   */
  const bridged = new Set(
    [...DB.matchAll(/\(\s*'group_fun',\s*'([a-z_]+)'\s*,/g)].map((m) => m[1])
  );
  const dimensionBridge = /\('group_fun',\s*'group_fun',\s*'positive'\)/.test(DB);

  for (const code of RETIRED) {
    assert.ok(
      bridged.has(code) || dimensionBridge,
      `${code} was retired from the offer and db/ no longer resolves it. A ` +
        `response written under 2026-08-h carries it and would now mean less ` +
        `than it did the day she wrote it.`
    );
  }

  // db/002 bridges the whole dimension in one statement rather than option by
  // option, so the guarantee for the original ten rests on that one line. It
  // is asserted by name because deleting it would pass every other check here.
  assert.ok(
    dimensionBridge,
    "db/002's group_fun -> group_fun bridge is gone. Every retired code from " +
      "the original ten resolves through it."
  );

  // And the four db/016 added are bridged individually.
  for (const code of ["make_something", "work_the_room", "keep_a_secret", "play_for_stakes"]) {
    assert.ok(bridged.has(code), `${code} has no facet row of its own in db/`);
  }
});

test("no retired code is reused, and no new code collides with one", () => {
  // The only way a permanent code can actually break: the same string coming
  // back meaning something else. Nothing enforces it but this.
  const added = OFFERED.filter((c) => !OFFERED_UNDER_2026_08_H.includes(c));
  assert.deepEqual(added, ["theatre", "board_games", "group_games", "hates_games"]);
  for (const code of added) {
    assert.ok(
      !RETIRED.includes(code),
      `${code} is both new and retired, which means a code was reused`
    );
  }
});

/* ── 4 · hates_games removes the game ───────────────────────────────── */

test("hates_games carries no_games, and it is the second answer that does", () => {
  const exclusions = [
    ...DB.matchAll(/\(\s*'([a-z_]+)',\s*'([a-z_]+)',\s*'no_games'/g),
  ].map((m) => `${m[1]}.${m[2]}`);

  assert.ok(
    exclusions.includes("group_fun.hates_games"),
    "db/ does not bridge group_fun.hates_games onto the no_games exclusion"
  );
  assert.ok(
    exclusions.includes("play_appetite.none"),
    "db/016's play_appetite.none -> no_games bridge is gone"
  );

  // And quiz_response_exclusion has to READ the field, or the bridge is a row
  // nothing joins. This is the whole of rule 15 in one line of a view.
  const view = DB.slice(DB.lastIndexOf("create or replace view quiz_response_exclusion"));
  assert.match(
    view,
    /\('group_fun',\s*qr\.group_fun\)/,
    "the latest quiz_response_exclusion does not read group_fun, so " +
      "hates_games would resolve to nothing"
  );

  // AND THE SLOT HAS TO CARRY THE CODE AT THE OTHER END. db/014 sets
  // `slot_kind.excluded_by` on the three game beats; db/061 collapsed two of
  // them into `game`. Without this line the bridge, the view and the engine
  // would all be correct and nothing would ever be removed — the shape rule 15
  // is about, where every part works and the chain is not joined.
  assert.match(
    DB,
    /update slot_kind set excluded_by = 'no_games'\s*\n\s*where code in \([^)]*'game'/,
    "no db/ statement gives the `game` slot excluded_by = 'no_games'"
  );
});

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
  occasion: "birthday",
  label: "The birthday",
  days: 1,
  note: "",
  scheduledGameMax: 1,
};

/** db/061's one game beat, as every occasion carries it: required, three offered. */
const RULES: SlotRule[] = [
  {
    slotCode: "game",
    label: "The game",
    description: "",
    section: "details",
    perGuest: false,
    pool: "game",
    minCount: 1,
    maxCount: 1,
    offerCount: 3,
    required: true,
    perDay: false,
    position: 45,
    note: "",
    excludedBy: "no_games",
    coherenceGroup: null,
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
    offerCount: 1,
    required: false,
    perDay: false,
    position: 20,
    note: "",
    excludedBy: null,
    coherenceGroup: null,
  },
];

test("A HOST WHO HATES GAMES IS NOT DEALT THREE GAME CARDS", () => {
  /*
   * The whole point, driven through the gate that actually decides rather than
   * asserted about a bridge row. db/061 made the beat `required` with
   * offerCount 3, so without the exclusion she is handed three cards to choose
   * between. Her answer beats `required`: required describes the OCCASION's
   * shape, not an obligation on the woman filling in the form.
   */
  const withGames = planSlots(RULES, SHAPE, SCALE, []);
  const gameUnits = withGames.slots.filter((s) => s.slotCode === "game");
  assert.equal(gameUnits.length, 3, "the carousel deals three without her refusal");
  assert.equal(withGames.excluded.length, 0);

  const without = planSlots(RULES, SHAPE, SCALE, ["no_games"]);
  assert.equal(
    without.slots.filter((s) => s.slotCode === "game").length,
    0,
    "she said her people hate games and the beat is still in her plan"
  );

  // AND IT IS NOT A GAP. db/014's whole argument: nobody can act on "she does
  // not want games", so it must not reach the curator's work-order list, which
  // is the only thing telling the house what to write next.
  assert.equal(without.excluded.length, 1);
  assert.equal(without.excluded[0].slotCode, "game");
  assert.equal(without.excluded[0].exclusion, "no_games");
  assert.match(without.excluded[0].detail, /not a gap/);

  // Nothing else moved. A refusal about games is not a refusal about anything
  // else, and the edit is the row that proves the exclusion is narrow.
  assert.equal(
    without.slots.filter((s) => s.slotCode === "edit_item").length,
    withGames.slots.filter((s) => s.slotCode === "edit_item").length,
    "removing the game beat changed a slot that has nothing to do with games"
  );
});

test("A GAMELESS REVELLE IS A SILENCE SHE CHOSE, NOT AN EMPTY SECTION", () => {
  // db/014, and CLAUDE.md rule 29's neighbourhood: an absence she chose is not
  // an authoring gap, and the page must not read as though something failed.
  // The excluded row exists so a curator can SEE why, and it says so in words
  // rather than leaving `no_games` as an adjudication with the opinion torn
  // off (rule 17's shape).
  const plan = planSlots(RULES, SHAPE, SCALE, ["no_games"]);
  const [removed] = plan.excluded;
  assert.ok(removed.detail.length > 0, "the removal carries no reason");
  assert.match(
    removed.detail,
    /never planned/,
    "the detail must say the beat was never in the plan, not that it failed to fill"
  );
  assert.equal(
    removed.requiredByOccasion,
    true,
    "this beat is required by the occasion, and her answer still outranks it"
  );
});

/* ── 5 · the refusal is exclusive ───────────────────────────────────── */

const STEP = { key: "fun", eyebrow: "", title: "", fields: [FUN] };

test("they hate games is the whole answer or it is not in it", () => {
  // Rule 16 inside one field. Without this she could say her people hate games
  // AND that they play for something worth winning, and the second tap would
  // be absorbed, scored, and then deleted along with the beat.
  assert.deepEqual(stepErrors(STEP, { group_fun: ["hates_games"] }), []);
  assert.deepEqual(stepErrors(STEP, { group_fun: ["compete", "perform"] }), []);

  const both = stepErrors(STEP, { group_fun: ["hates_games", "play_for_stakes"] });
  assert.equal(both.length, 1, `expected one complaint, got ${JSON.stringify(both)}`);
  assert.match(both[0], /cannot be chosen with anything else/);

  // Order must not matter — a client that appended rather than replaced would
  // produce the other order and has to be refused identically.
  const reversed = stepErrors(STEP, { group_fun: ["play_for_stakes", "hates_games"] });
  assert.deepEqual(reversed, both);

  // And the field's own bounds still apply on top of it.
  assert.deepEqual(stepErrors(STEP, { group_fun: [] }), ["Pick at least one."]);
});

test("exactly one option in the whole quiz is exclusive", () => {
  // A count, so that a second one is a decision somebody makes on purpose
  // rather than a flag copied onto a tile because it looked similar (rule 32).
  const exclusive = Object.values(FIELDS).flatMap((field) =>
    field.type === "multi"
      ? field.options.filter((o) => o.exclusive === true).map((o) => `${field.id}.${o.code}`)
      : []
  );
  assert.deepEqual(exclusive, ["group_fun.hates_games"]);
});

/* ── 6 · nothing in the catalogue refuses a game ────────────────────── */

test("NO FORBID REMAINS: a room's character may not veto a game", () => {
  /*
   * Founder, 2026-09-06: "there is no way a game shouldnt be offered bc
   * somewhere the revelle is nobody leaves the table - that shouldnt be a rule
   * in the first place", and "also forget this limiting rule that we have to be
   * era specific and cannot have later tech".
   *
   * This is the other half of the ruling above and the reason the two belong in
   * one test file: after both, THE ONLY THING THAT REMOVES A GAME FROM HER
   * EVENING IS HER SAYING SO. A forbid reintroduced later would quietly take
   * that back, and it would look like ordinary authoring.
   */
  const occasion = ALL_GAMES.flatMap((g) =>
    g.occasions.filter((o) => o.fit === "forbidden").map((o) => `${g.slug}:${o.occasion}`)
  );
  const world = ALL_GAMES.flatMap((g) =>
    g.worlds.filter((w) => w.forbidden === true).map((w) => `${g.slug}@${w.world}`)
  );

  assert.deepEqual(
    occasion,
    [],
    "an occasion forbid is back. What may still prune a game is minGuests, " +
      "maxGuests, the venue affordances and the requirement kinds — the " +
      "constraint door. The name of an occasion is not one of them."
  );
  assert.deepEqual(world, [], "a world forbid is back");
});
