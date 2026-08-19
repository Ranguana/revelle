/**
 * THE RULES THAT KEEP THE WRITING FROM EMBARRASSING HER.
 *
 * Two of them, and they are the two this module exists to enforce:
 *
 *   1. A piece that must go out plain never touches a voice. Tested here at
 *      the level a test can reach — the shape of what `composePlain` produces
 *      and the fact that it produces it from her facts and nothing else. The
 *      stronger version of the same rule is in the type system (a PlainRequest
 *      is not assignable to `writePiece`) and in db/024's check constraint,
 *      neither of which needs a test because neither can be got wrong at
 *      runtime.
 *
 *   2. The plain routes are the DESTINATION'S, read out of its own
 *      breaksCharacterFor rather than typed in here. A test that asserts
 *      Westhampton and Havana produce different routes is the cheapest guard
 *      against somebody quietly replacing thirteen authored answers with one
 *      constant.
 *
 * Framework-free, like everything it tests. No database, no model, no network.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { HAVANA, WESTHAMPTON_1976 } from "../destinations.ts";
import { composePlain, plainSubject } from "./plain.ts";
import {
  allChoices,
  choiceFor,
  factsFrom,
  morningLabel,
  plainChoices,
  voicedChoices,
} from "./pieces.ts";

/* ── the plain route ─────────────────────────────────────────────────── */

test("a plain piece is her facts, one to a line, and nothing added", () => {
  const body = composePlain({
    route: "plain",
    reason: "Anything a guest has to act on to arrive or to be safe",
    ask: "The house has moved.",
    facts: ["It is 14 Dune Road, not 12", "The gate code is 4412"],
  });

  assert.equal(
    body,
    "The house has moved.\nIt is 14 Dune Road, not 12.\nThe gate code is 4412."
  );
});

test("a plain piece carries no word she did not write", () => {
  const facts = ["Take the stairs on the left", "The lift is out"];
  const body = composePlain({
    route: "plain",
    reason: "safety",
    ask: "",
    facts,
  });

  // Every word in the output came from her. This is the assertion that would
  // fail the day somebody adds a friendly opening line to the plain route.
  const hers = new Set(
    facts.join(" ").toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/)
  );
  for (const word of body.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/)) {
    assert.ok(hers.has(word), `"${word}" was not hers`);
  }
});

test("a paragraph she pasted in becomes lines a guest can scan", () => {
  const body = composePlain({
    route: "plain",
    ask: "Dinner is cancelled. Nobody needs to come. I am sorry.",
    reason: "a way out",
    facts: [],
  });
  assert.deepEqual(body.split("\n"), [
    "Dinner is cancelled.",
    "Nobody needs to come.",
    "I am sorry.",
  ]);
});

test("her own punctuation is not corrected", () => {
  // The house never writes an exclamation point. These are HER words on a
  // plain piece, and this function does not have opinions about them.
  const body = composePlain({
    route: "plain",
    ask: "Do not park on the grass!",
    reason: "safety",
    facts: [],
  });
  assert.equal(body, "Do not park on the grass!");
});

test("the subject line of a plain piece is her first sentence, unadorned", () => {
  const subject = plainSubject({
    route: "plain",
    ask: "The address has changed.",
    reason: "safety",
    facts: ["14 Dune Road"],
  });
  assert.equal(subject, "The address has changed");
});

/* ── the plain routes are the destination's ──────────────────────────── */

test("the plain routes come out of the destination, not out of this file", () => {
  const west = plainChoices(WESTHAMPTON_1976.voice);
  const havana = plainChoices(HAVANA.voice);

  assert.equal(west.length, WESTHAMPTON_1976.voice.breaksCharacterFor.length);
  assert.equal(havana.length, HAVANA.voice.breaksCharacterFor.length);

  // Two houses worry about different doors. Westhampton names a locked
  // bathroom door and a hospital; Havana names the unlit stairs to the roof
  // and what is in the food. If these ever match, somebody has replaced the
  // authored answers with a constant.
  assert.notDeepEqual(
    west.map((c) => c.hint),
    havana.map((c) => c.hint)
  );
});

test("a plain route is labelled by what it is, not by the writer's instruction", () => {
  const [first] = plainChoices(WESTHAMPTON_1976.voice);
  assert.equal(
    first.label,
    "Anything a guest has to act on to arrive or to be safe"
  );
  assert.ok(first.hint.startsWith("An address"));
  // A label is a name, not a sentence.
  assert.ok(!first.label.endsWith("."));
});

test("every plain route carries the authored line it came from", () => {
  for (const choice of plainChoices(HAVANA.voice)) {
    assert.equal(choice.route, "plain");
    assert.equal(choice.kind, null);
    assert.ok(
      HAVANA.voice.breaksCharacterFor.includes(choice.reason ?? ""),
      "the reason recorded on a plain piece must be the destination's own line"
    );
  }
});

/* ── what she may ask for ────────────────────────────────────────────── */

test("an evening has no morning to write a line at the top of", () => {
  const evening = voicedChoices(1).map((c) => c.value);
  assert.ok(!evening.includes("bulletin"));

  const weekend = voicedChoices(3).map((c) => c.value);
  assert.ok(weekend.includes("bulletin"));
});

test("only pieces a host sends are offered", () => {
  // heading, sign_off and game_rule are parts of printed matter the house
  // sets for her. Offering "a section head" in a list of ways to talk to her
  // friends would be offering her the schema.
  const offered = voicedChoices(3).map((c) => c.value);
  for (const internal of ["heading", "sign_off", "game_rule"]) {
    assert.ok(!offered.includes(internal), `${internal} is not correspondence`);
  }
});

test("a place card has a ceiling and a note to everyone does not have the same one", () => {
  const byValue = new Map(voicedChoices(1).map((c) => [c.value, c]));
  const card = byValue.get("place_card");
  const notice = byValue.get("notice");
  assert.ok(card && notice);
  assert.ok(card.maxWords !== null && notice.maxWords !== null);
  assert.ok(
    card.maxWords < notice.maxWords,
    "a place card is a card and a notice is not"
  );
});

test("a submitted choice resolves to exactly one route, or to nothing", () => {
  const voice = WESTHAMPTON_1976.voice;
  assert.equal(choiceFor(voice, 1, "invitation")?.route, "voiced");
  assert.equal(choiceFor(voice, 1, "plain:0")?.route, "plain");
  // A bulletin is not on offer for an evening, so it does not resolve for one.
  assert.equal(choiceFor(voice, 1, "bulletin"), null);
  assert.equal(choiceFor(voice, 3, "bulletin")?.route, "voiced");
  assert.equal(choiceFor(voice, 1, "plain:99"), null);
  assert.equal(choiceFor(voice, 1, "nonsense"), null);
});

test("no two choices share a value", () => {
  const values = allChoices(WESTHAMPTON_1976.voice, 3).map((c) => c.value);
  assert.equal(new Set(values).size, values.length);
});

/* ── small things she types ──────────────────────────────────────────── */

test("facts are one to a line, and blank lines are not facts", () => {
  assert.deepEqual(factsFrom("Friday\n\n  seven o'clock \n\nbring a swimsuit\n"), [
    "Friday",
    "seven o'clock",
    "bring a swimsuit",
  ]);
  assert.deepEqual(factsFrom("   \n \n"), []);
});

test("a morning is named, never numbered", () => {
  assert.equal(morningLabel(1), "The first morning");
  assert.equal(morningLabel(3), "The third morning");
  assert.equal(morningLabel(null), "");
  // Past the sixth it is a numeral again, because the house has never sold an
  // eleven-day getaway and "the eleventh morning" is worse than knowing that.
  assert.equal(morningLabel(11), "Morning 11");
});
