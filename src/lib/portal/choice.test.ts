/**
 * THE CAROUSEL, ON THE SIDE SHE SEES — db/061.
 *
 * Three things are proved here and they fail differently, which is why they
 * are three tests and not one:
 *
 *   · WHAT COUNTS. A card she has not taken is hers and is not yet part of
 *     the night. Get this wrong in one direction and her shopping list buys
 *     for three games; get it wrong in the other and the game she chose
 *     prints nothing.
 *   · WHAT SHE IS SHOWN. Three cards are a choice, one card is her game, and
 *     nothing is padded out to look like three.
 *   · WHERE THINGS SIT. CLAUDE.md rule 18 — choosing marks a card in place
 *     and never reorders the stack, because the correction for pressing the
 *     wrong card is pressing the right one.
 */

import assert from "node:assert/strict";
import test from "node:test";

import type { MemberPiece } from "../selection/member.ts";
import { entriesIn, isSettled, offerLead, settledSql } from "./choice.ts";

function piece(over: Partial<MemberPiece> & { name: string }): MemberPiece {
  return {
    heading: "The fun",
    section: "fun",
    description: "",
    pool: "game",
    slug: over.name.toLowerCase().replace(/\W+/g, "-"),
    quantity: 1,
    perGuest: false,
    dayIndex: null,
    offerGroup: null,
    chosen: false,
    ...over,
  };
}

/* ── what counts ────────────────────────────────────────────────────── */

test("settled: the house placed it, or she took it. Nothing else", () => {
  assert.equal(isSettled(null, null), true, "the house placed it");
  assert.equal(isSettled(undefined, null), true, "an older row, same thing");
  assert.equal(isSettled("game:1:0", "2026-09-04T00:00:00Z"), true, "she took it");
  assert.equal(
    isSettled("game:1:0", null),
    false,
    "offered and not taken: hers, and not yet part of the night"
  );
});

test("the SQL and the TypeScript say the same sentence", () => {
  // CLAUDE.md rule 21's narrow test: must two surfaces agree about this? The
  // page marking one card while the shopping list buys for three is a host
  // arriving on the night with the wrong things, so yes — and the guard is
  // that both readings come off this one module.
  assert.equal(
    settledSql("rg"),
    "(rg.offer_group is null or rg.chosen_at is not null)"
  );
  assert.match(settledSql("x"), /^\(x\.offer_group is null or x\.chosen_at/);
});

/* ── what she is shown ──────────────────────────────────────────────── */

test("three cards of one beat fold into one offer", () => {
  const entries = entriesIn([
    piece({ name: "Art Battle", offerGroup: "game:1:0" }),
    piece({ name: "Fishbowl", offerGroup: "game:1:0" }),
    piece({ name: "Imposter", offerGroup: "game:1:0" }),
  ]);

  assert.equal(entries.length, 1);
  assert.equal(entries[0].kind, "offer");
  if (entries[0].kind !== "offer") return;
  assert.equal(entries[0].offer.cards.length, 3);
  assert.equal(entries[0].offer.settled, false, "she has not picked yet");
  assert.deepEqual(
    entries[0].offer.cards.map((c) => c.name),
    ["Art Battle", "Fishbowl", "Imposter"],
    "delivery order, which is the order she read them in"
  );
});

test("two cards are an offer of two, and nothing says otherwise", () => {
  const entries = entriesIn([
    piece({ name: "Fishbowl", offerGroup: "game:1:0" }),
    piece({ name: "Let's Make a Deal", offerGroup: "game:1:0" }),
  ]);

  assert.equal(entries.length, 1);
  assert.equal(entries[0].kind, "offer");
  if (entries[0].kind !== "offer") return;
  assert.equal(
    entries[0].offer.cards.length,
    2,
    "two is what exists, so two is what shows. Nothing is padded or repeated"
  );
});

test("AN OFFER OF ONE IS NOT AN OFFER — it is her game", () => {
  const entries = entriesIn([
    piece({ name: "Oaxaca: Correct the Year", offerGroup: "game:1:0" }),
  ]);

  assert.equal(entries.length, 1);
  assert.equal(
    entries[0].kind,
    "piece",
    "there is nothing to choose between, so she is asked nothing"
  );
});

test("pieces outside an offer are untouched, in place", () => {
  const entries = entriesIn([
    piece({ name: "The centrepiece", pool: "product", heading: "The table" }),
    piece({ name: "Art Battle", offerGroup: "game:1:0" }),
    piece({ name: "Fishbowl", offerGroup: "game:1:0" }),
    piece({ name: "The soundtrack", pool: "tracklist", heading: "The music" }),
  ]);

  assert.deepEqual(
    entries.map((e) => e.kind),
    ["piece", "offer", "piece"],
    "the offer takes the place of its first card, where the beat sits"
  );
});

/* ── and the same page carries four of them — db/062 ────────────────── */

test("three per course: each course is its own offer, in delivery order", () => {
  // Founder, 2026-09-05: "three per course". Nothing in this module changed
  // for it — the beats are keyed by `offerGroup` and it has never asked which
  // pool a piece came from — and that is what this asserts.
  const entries = entriesIn([
    piece({ name: "Clams casino", pool: "dish", heading: "The first course", offerGroup: "the_appetizer:1:0" }),
    piece({ name: "Rumaki", pool: "dish", heading: "The first course", offerGroup: "the_appetizer:1:0" }),
    piece({ name: "Stuffed celery", pool: "dish", heading: "The first course", offerGroup: "the_appetizer:1:0" }),
    piece({ name: "Lobster thermidor", pool: "dish", heading: "The main course", offerGroup: "the_main:1:0" }),
    piece({ name: "Beef Wellington", pool: "dish", heading: "The main course", offerGroup: "the_main:1:0" }),
    piece({ name: "Baked alaska", pool: "dish", heading: "The last course", offerGroup: "the_dessert:1:0" }),
    piece({ name: "Peach melba", pool: "dish", heading: "The last course", offerGroup: "the_dessert:1:0" }),
    piece({ name: "Lemon ice", pool: "dish", heading: "The last course", offerGroup: "the_dessert:1:0" }),
  ]);

  assert.deepEqual(
    entries.map((e) => (e.kind === "offer" ? e.offer.group : "piece")),
    ["the_appetizer:1:0", "the_main:1:0", "the_dessert:1:0"],
    "three beats, in the order the courses are eaten — one carousel per " +
      "course and never one carousel of nine"
  );
  assert.deepEqual(
    entries.map((e) => (e.kind === "offer" ? e.offer.cards.length : 0)),
    [3, 2, 3],
    "and the main shows the two that exist, with nothing padded to three"
  );
  assert.ok(
    entries.every((e) => e.kind === "offer" && e.offer.pool === "dish"),
    "the pool is a fact about the beat: occasion_slot.pool is one column"
  );
});

test("the game and the courses sit on one page without touching", () => {
  const entries = entriesIn([
    piece({ name: "Rumaki", pool: "dish", heading: "The first course", offerGroup: "the_appetizer:1:0" }),
    piece({ name: "Clams casino", pool: "dish", heading: "The first course", offerGroup: "the_appetizer:1:0" }),
    piece({ name: "The centrepiece", pool: "product", heading: "The table" }),
    piece({ name: "Art Battle", offerGroup: "game:1:0" }),
    piece({ name: "Fishbowl", offerGroup: "game:1:0" }),
  ]);

  assert.deepEqual(
    entries.map((e) =>
      e.kind === "offer" ? `offer:${e.offer.pool}` : `piece:${e.piece.pool}`
    ),
    ["offer:dish", "piece:product", "offer:game"],
    "each beat folds where it sits. A second pool offering a choice does not " +
      "gather the offers together or move a piece the house placed (rule 18)"
  );
});

test("choosing a main leaves the appetizer's cards exactly as they were", () => {
  // The mix-and-match case, on the side she sees. Her three choices are three
  // independent beats: taking a main marks one card in one carousel and
  // touches nothing else on the page.
  const before = [
    piece({ name: "Rumaki", pool: "dish", offerGroup: "the_appetizer:1:0" }),
    piece({ name: "Clams casino", pool: "dish", offerGroup: "the_appetizer:1:0" }),
    piece({ name: "Lobster thermidor", pool: "dish", offerGroup: "the_main:1:0" }),
    piece({ name: "Beef Wellington", pool: "dish", offerGroup: "the_main:1:0" }),
  ];
  const after = before.map((p) =>
    p.name === "Beef Wellington" ? { ...p, chosen: true } : p
  );

  const one = entriesIn(before);
  const two = entriesIn(after);
  if (one[0].kind !== "offer" || two[0].kind !== "offer") assert.fail("offers");
  else {
    assert.deepEqual(
      two[0].offer.cards.map((c) => [c.name, c.chosen]),
      one[0].offer.cards.map((c) => [c.name, c.chosen]),
      "the first course is untouched — same cards, same order, same marks"
    );
    assert.equal(two[0].offer.settled, false, "and still unsettled");
  }
  if (two[1].kind !== "offer") assert.fail("the main is an offer");
  else {
    assert.deepEqual(two[1].offer.cards.map((c) => c.chosen), [false, true]);
    assert.equal(two[1].offer.settled, true);
  }
});

/* ── the line above the cards ───────────────────────────────────────── */

function offerOf(pool: string, n: number, settled = false) {
  const entries = entriesIn(
    Array.from({ length: n }, (_, i) =>
      piece({ name: `Card ${i}`, pool, offerGroup: "beat:1:0", chosen: settled && i === 0 })
    )
  );
  if (entries[0].kind !== "offer") throw new Error("an offer");
  return entries[0].offer;
}

test("the lead line names the beat's own verb, and credits HER", () => {
  // CLAUDE.md rule 10 is the test for every word: does the line credit her, or
  // credit us. Both verbs put her at the centre of the act.
  assert.equal(
    offerLead(offerOf("game", 3)),
    "Three to choose between. The one you pick is the one that runs."
  );
  assert.equal(
    offerLead(offerOf("dish", 3)),
    "Three to choose between. The one you pick is the one you serve."
  );
  // A pool nobody has ruled on gets the flattest true thing rather than an
  // invented verb (rule 32).
  assert.equal(
    offerLead(offerOf("drink", 3)),
    "Three to choose between. The one you pick is the one that happens."
  );
});

test("the lead line says how many exist and never how many were possible", () => {
  assert.match(
    offerLead(offerOf("dish", 2)),
    /^Two to choose between\./,
    "two is what exists, so two is what it says — not 'only two fit' and not " +
      "'two of three'. The apology would be the house describing its own " +
      "catalogue to her, which is house business"
  );

  const lead = offerLead(offerOf("dish", 3));
  for (const wrong of [/match/i, /score/i, /chose (for|you)/i, /we /i, /narrow/i, /select/i]) {
    assert.doesNotMatch(
      lead,
      wrong,
      "nothing about how the cards were found. That credits the house"
    );
  }
});

test("once she has taken one, the line is about changing her mind", () => {
  assert.equal(
    offerLead(offerOf("dish", 3, true)),
    "Three to choose between. Change your mind whenever you like.",
    "db/061 made the offer the thing that binds so that this sentence could " +
      "be true without limit and without a refusal"
  );
});

/* ── where things sit ───────────────────────────────────────────────── */

test("CHOOSING MARKS A CARD IN PLACE AND MOVES NOTHING", () => {
  // CLAUDE.md rule 18. The same three pieces, the middle one taken.
  const before = entriesIn([
    piece({ name: "Art Battle", offerGroup: "game:1:0" }),
    piece({ name: "Fishbowl", offerGroup: "game:1:0" }),
    piece({ name: "Imposter", offerGroup: "game:1:0" }),
  ]);
  const after = entriesIn([
    piece({ name: "Art Battle", offerGroup: "game:1:0" }),
    piece({ name: "Fishbowl", offerGroup: "game:1:0", chosen: true }),
    piece({ name: "Imposter", offerGroup: "game:1:0" }),
  ]);

  if (before[0].kind !== "offer" || after[0].kind !== "offer") {
    assert.fail("both are offers");
  }
  assert.deepEqual(
    after[0].offer.cards.map((c) => c.name),
    before[0].offer.cards.map((c) => c.name),
    "identical order. Her choice does not promote, sort or collapse anything"
  );
  assert.deepEqual(
    after[0].offer.cards.map((c) => c.chosen),
    [false, true, false],
    "and the two she did not take are still there, still available"
  );
  assert.equal(after[0].offer.settled, true);
});

test("changing her mind is one card unmarked and another marked", () => {
  // The undo has to be reachable, which means the target has to be where it
  // was. Nothing here is asserted about the write — that is one statement in
  // src/lib/portal/choose.ts — only that the page can express the change.
  const moved = entriesIn([
    piece({ name: "Art Battle", offerGroup: "game:1:0", chosen: true }),
    piece({ name: "Fishbowl", offerGroup: "game:1:0" }),
    piece({ name: "Imposter", offerGroup: "game:1:0" }),
  ]);
  if (moved[0].kind !== "offer") assert.fail("an offer");
  else {
    assert.deepEqual(
      moved[0].offer.cards.map((c) => c.name),
      ["Art Battle", "Fishbowl", "Imposter"],
      "the stack is the stack, whichever card carries the mark"
    );
    assert.equal(
      moved[0].offer.cards.filter((c) => c.chosen).length,
      1,
      "at most one, which db/061's partial unique index enforces below this"
    );
  }
});
