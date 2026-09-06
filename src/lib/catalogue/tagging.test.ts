import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { parseDrinks } from "../../../scripts/drinks-parse.mjs";

import {
  matchedOccasionWords,
  occasionClaim,
  seasonStrictClaim,
} from "./tagging.ts";

/**
 * THE DERIVATIONS, COUNTED AGAINST THE REAL DOCUMENT.
 *
 * ── WHY IT READS docs/drinks.md AND NOT A FIXTURE ────────────────────
 *
 * CLAUDE.md, on the classifier-hyphen incident: `bank_item_default_slot()`
 * spelled `'take home'` with a space while every authored clause used
 * `take-home`, 143 of 152 rows landed in the wrong bucket, and nothing said
 * anything. The lesson is not "write a unit test" — a fixture spelled the way
 * the matcher expects passes brilliantly and proves nothing. It is ASSUME YOUR
 * MATCHING IS WRONG UNTIL YOU HAVE COUNTED WHAT IT MATCHED, against the text
 * that actually exists.
 *
 * So these tests read the authored file, count, and assert the counts. The
 * numbers are the finding, not decoration: if docs/drinks.md gains a sixth
 * field, or a programme is renamed to something that genuinely names an
 * occasion, or a season wording changes, one of these goes red and somebody has
 * to look — which is exactly what should happen, because every one of those is
 * a judgement.
 *
 * ── THE READER BELOW USED TO BE A SECOND PARSER, AND IT DRIFTED ──────
 *
 * CLAUDE.md rule 14. What this paragraph said, kept whole because the intention
 * was right and the mechanism is what failed:
 *
 *     "THE READER BELOW IS NOT A SECOND PARSER. `scripts/seed-drinks.mjs` owns
 *      parsing docs/drinks.md; this pulls two fields out of it for counting and
 *      never writes anything. The distinction matters because rule 21 is about
 *      duplicated AUTHORITY, not duplicated code: nothing here decides what a
 *      drink IS, and a disagreement between this reader and the seeder shows up
 *      immediately as a wrong count rather than as a wrong row."
 *
 * WHAT BEAT IT: it was a second parser, and the disagreement did NOT show up as
 * a wrong count. When `docs/drinks.md` was atomised the records became `**N.M**`
 * where they had been `**N.**`; this reader matched nothing, and four tests in
 * this file went red at once — which is the good half. The bad half is that
 * "found zero programmes" and "the document has no programmes" were the same
 * value, and only the guard directly below (`all.length === 25`) told them
 * apart. A reader that can return an empty list is a reader that can report a
 * clean sheet it has not earned; this file said so about itself and still
 * shipped one.
 *
 * So it reads the document through `scripts/drinks-parse.mjs`, which is the one
 * reader of that file, and derives the PROGRAMME view from it — because the
 * three fields these tests count are the programme's answers, inherited by
 * every drink split out of it, and the parser already refuses a programme whose
 * drinks disagree about them. Nothing here still decides what a drink is.
 */

const SOURCE = new URL("../../../docs/drinks.md", import.meta.url);

type Programme = { number: number; whatItsFor: string; season: string };

/**
 * The twenty-five programmes, recovered from the seventy-six drinks.
 *
 * `programmeLine` is her "what it is for" line, carried onto every drink as
 * provenance (it is not their name — db/060 §I), and `seasonNote` is her season
 * wording. Both are per-programme by construction: `parseDrinks` fails the read
 * if two drinks under one heading disagree about either.
 */
function programmes(): Programme[] {
  const byNumber = new Map<number, Programme>();
  for (const drink of parseDrinks(readFileSync(SOURCE, "utf8"))) {
    if (byNumber.has(drink.programme)) continue;
    byNumber.set(drink.programme, {
      number: drink.programme,
      whatItsFor: drink.programmeLine,
      season: drink.seasonNote,
    });
  }
  return [...byNumber.values()].sort((a, b) => a.number - b.number);
}

test("the reader finds every authored programme, or the counts below mean nothing", () => {
  const all = programmes();
  assert.equal(
    all.length,
    28,  // was 25; Hong Kong's three programmes, db-less insert 2026-09-06
    `docs/drinks.md reads as ${all.length} programmes and the document says ` +
      `twenty-five. Every count in this file is a count over this list, so a ` +
      `reader that has lost records reports a clean sheet it has not earned — ` +
      `which is the shape of the defect these tests exist for.`
  );
  const numbers = all.map((p) => p.number);
  assert.deepEqual(
    numbers,
    Array.from({ length: 28 }, (_, i) => i + 1),
    "the programme numbers are not 1..28 — the reader dropped or doubled one."
  );
});

/* ── the season derivation ───────────────────────────────────────────── */

test("every authored season wording maps, and nothing is guessed", () => {
  const unmapped = programmes().filter(
    (p) => seasonStrictClaim(p.season).band === null
  );
  assert.deepEqual(
    unmapped.map((p) => `${p.number}: ${p.season}`),
    [],
    "these season wordings are not in SEASONS (scripts/catalogue-vocabulary.mjs). " +
      "A new wording is a decision, not a default — the derivation returns no " +
      "band and gates nothing, which is safe and silent, and this test is the " +
      "part that is not silent."
  );
});

test("fifteen of twenty-eight drinks gate on their season, and thirteen lean", () => {
  const all = programmes();
  const strict = all.filter((p) => seasonStrictClaim(p.season).strict);
  const lean = all.filter((p) => !seasonStrictClaim(p.season).strict);

  assert.equal(
    strict.length,
    15,  // was 14 of 25; Hong Kong's programme 27 is Summer, 26 and 28 are Year-round
    `${strict.length} of ${all.length} drinks derive as season-gated, not 14. ` +
      `Before this derivation existed the number was ZERO — the column defaults ` +
      `false and no seeder ever wrote it — so a February party was offered the ` +
      `summer bar with "Summer" printed on the sheet. If this number moved, a ` +
      `wording changed or SEASON_NARROWED did, and both are judgements:\n  ` +
      strict.map((p) => `${p.number}: ${p.season}`).join("\n  ")
  );
  assert.equal(lean.length, 13);  // was 11 of 25

  // The thirteen are nine year-round programmes and four two-season wordings.
  // Named rather than counted, because "thirteen" would still pass if the two
  // groups traded members. Was seven year-round of eleven; Hong Kong's 26 and
  // 28 are year-round because she seasoned only one of her nine drinks, and
  // docs/drinks.md records that the value is the house's rather than hers.
  const yearRound = lean.filter((p) => seasonStrictClaim(p.season).band === "year_round");
  assert.equal(yearRound.length, 9, "nine programmes make no claim about the calendar");  // was 7
  const narrowed = lean.filter((p) => seasonStrictClaim(p.season).band !== "year_round");
  assert.deepEqual(
    narrowed.map((p) => p.season).sort(),
    ["Shoulder season and fall", "Spring and summer", "Warm weather", "Winter or spring"],
    "the four wordings a band only partly covers. Gating on any of these would " +
      "delete a month she named — the whole reason SEASON_NARROWED exists."
  );
});

test("PORTOFINO's two programmes both gate on summer — the room the ruling named", () => {
  // docs/needs-a-human.md, 2026-08-27: "a February party is offered the summer
  // bar with 'Summer' printed on the sheet — in Portofino, whose premise is
  // explicitly off-season, and whose two programmes both say Summer."
  const portofino = programmes().filter((p) => p.number === 24 || p.number === 25);
  assert.equal(portofino.length, 2);
  for (const programme of portofino) {
    const claim = seasonStrictClaim(programme.season);
    assert.equal(claim.band, "summer");
    assert.equal(
      claim.strict,
      true,
      `drink ${programme.number} does not gate. This is the case the founder ` +
        `ruled on by name.`
    );
  }
});

test("a year-round season is never a gate, whatever else changes", () => {
  // `inSeason()` independently treats year_round as "no claim about the
  // calendar". If this derivation disagreed, a row would be marked strict on a
  // band that refuses nothing — an instrument that grades and cannot prune,
  // which is CLAUDE.md rule 15's whole subject.
  for (const wording of ["Any", "Year-round"]) {
    assert.equal(seasonStrictClaim(wording).strict, false, wording);
  }
});

test("a wording nothing maps gates nothing rather than guessing a band", () => {
  const claim = seasonStrictClaim("When the jacarandas are out");
  assert.equal(claim.band, null);
  assert.equal(claim.strict, false);
});

/* ── the occasion refusal ────────────────────────────────────────────── */

test("not one programme name claims an occasion", () => {
  const claimed = programmes().filter(
    (p) => occasionClaim(p.whatItsFor).claim.length > 0
  );
  assert.deepEqual(
    claimed.map((p) => `${p.number}: ${p.whatItsFor}`),
    [],
    "a programme name now yields an occasion claim. That is a real change and " +
      "needs a person: db/023 ruled these lines are MEAL SHAPES, not " +
      "occasions, and any claim minted from them scopes a drink on the wrong " +
      "axis. See the argument at section 3 of ./tagging.ts."
  );
});

/**
 * THE COUNT THAT MAKES THE REFUSAL A FINDING RATHER THAN AN ASSUMPTION.
 *
 * A parser that declines everything is indistinguishable from a parser that is
 * broken — the same two-lies problem rule 22 names one layer up. So the tempting
 * reading is computed and counted: twenty of twenty-five names contain a word a
 * thesaurus parser would have scoped on, and every one of those twenty would
 * have been a claim the author did not make.
 */
test("a word-matching parser would have scoped twenty of the twenty-five", () => {
  const all = programmes();
  const tempted = all.filter((p) => matchedOccasionWords(p.whatItsFor).length > 0);
  assert.equal(
    tempted.length,
    20,
    `${tempted.length} of ${all.length} programme names contain an occasion ` +
      `word, not 20. This number is the evidence that declining to parse is a ` +
      `decision rather than a bug; if it moved, read the list before trusting ` +
      `either:\n  ` +
      tempted
        .map(
          (p) =>
            `${p.number}: "${p.whatItsFor}" -> ` +
            matchedOccasionWords(p.whatItsFor)
              .map((m) => `${m.occasion} ("${m.word}")`)
              .join(", ")
        )
        .join("\n  ")
  );
});

test("the two names containing the literal words 'dinner party' still claim nothing", () => {
  // Drinks 6 and 19: "A formal dinner party" and "A long dinner party".
  // `occasion_type` has a member spelled `dinner_party`, so this is the single
  // most convincing wrong match in the catalogue — and db/023 folded exactly
  // these two phrasings into `long_dinner`, which is a different axis.
  for (const name of ["A formal dinner party", "A long dinner party"]) {
    const verdict = occasionClaim(name);
    assert.deepEqual(verdict.claim, [], name);
    assert.ok(
      verdict.tempting.some((m) => m.occasion === "dinner_party"),
      `${name} should be RECORDED as tempting — a refusal nobody can see the ` +
        `temptation of is a refusal nobody can check.`
    );
    assert.match(verdict.reading, /meal shape/);
  }
});

test("the calibration case from the menus, which is the sharper one", () => {
  // docs/menus.md carries "A steakhouse birthday dinner". A parser matching the
  // word `birthday` mints a birthday scope on a menu that is a long dinner with
  // a candle in it. Asserted here even though the menu pool is retired, because
  // the day somebody writes this parser for another pool, this is the line they
  // will test it against.
  const verdict = occasionClaim("A steakhouse birthday dinner");
  assert.deepEqual(verdict.claim, []);
  assert.ok(verdict.tempting.some((m) => m.occasion === "birthday"));
});
