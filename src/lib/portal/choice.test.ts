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
import { entriesIn, isSettled, settledSql } from "./choice.ts";

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
