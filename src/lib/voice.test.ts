import assert from "node:assert/strict";
import { test } from "node:test";

import { DESTINATIONS, DESTINATION_TONES } from "./destinations.ts";
import { QUIZ_STEPS, type MultiField } from "./quiz.ts";
import {
  TONES,
  TONE_GROUPS,
  VOICE_FACETS,
  destinationVoiceProfile,
  statedVoiceFacets,
  toneProfile,
  voiceAffinity,
  type Tone,
  type VoiceFacetCode,
} from "./voice.ts";

/**
 * The voice vocabulary, checked against itself and against the one destination
 * that has a real voice.
 *
 * The interesting test is the last one. A vocabulary of fifty tones is only
 * worth having if a destination written long before it can be SAID in it — if
 * WESTHAMPTON, 1976 needs words this list does not have, the list is wrong, and
 * every future destination will need its own private vocabulary, at which point
 * matching a register becomes comparing two paragraphs.
 */

/*
 * Widened on purpose. `TONES` is `as const`, so TypeScript knows every weight
 * and every array length as a literal and proves several of the assertions
 * below at compile time — which is welcome, and would also make them look like
 * mistakes to the compiler ("this comparison has no overlap"). Read through the
 * declared type, the checks are the runtime guarantee the database relies on.
 */
const ALL: readonly Tone[] = TONES;

const FACET_CODES = new Set<string>(VOICE_FACETS.map((f) => f.code));
const TONE_CODES = new Set<string>(TONES.map((t) => t.code));

test("every tone resolves to at least one voice facet", () => {
  for (const tone of ALL) {
    assert.ok(
      tone.facets.length > 0,
      `${tone.code} resolves to nothing — it is a tile that means nothing`
    );
  }
});

test("every tone points at facets that exist, once each, at legal weights", () => {
  for (const tone of ALL) {
    const seen = new Set<string>();
    for (const { code, weight } of tone.facets) {
      assert.ok(FACET_CODES.has(code), `${tone.code} -> unknown facet ${code}`);
      assert.ok(!seen.has(code), `${tone.code} claims ${code} twice`);
      seen.add(code);
      assert.ok(
        weight >= -1 && weight <= 1 && weight !== 0,
        `${tone.code} -> ${code} has weight ${weight}; must be -1..1 and never zero`
      );
    }
  }
});

test("codes are unique and machine-safe", () => {
  assert.equal(TONE_CODES.size, TONES.length, "duplicate tone code");
  assert.equal(FACET_CODES.size, VOICE_FACETS.length, "duplicate facet code");
  for (const code of [...TONE_CODES, ...FACET_CODES]) {
    // The same shape the database's check constraint enforces.
    assert.match(code, /^[a-z][a-z0-9_]*$/, `${code} is not a legal code`);
  }
});

test("every tone belongs to a group that exists", () => {
  const groups = new Set(TONE_GROUPS.map((g) => g.key));
  for (const tone of ALL) {
    assert.ok(groups.has(tone.group), `${tone.code} is in no group`);
  }
  for (const group of TONE_GROUPS) {
    assert.ok(
      ALL.some((t) => t.group === group.key),
      `the "${group.label}" heading has nothing under it`
    );
  }
});

/**
 * A facet nothing resolves to is a facet nothing can ever be matched on. It is
 * not harmful, but it means the axis was invented rather than needed, and this
 * is the cheapest possible check that the twenty-six are all earning their
 * place.
 */
test("every voice facet is reachable from some tone or from a voice token", () => {
  const reached = new Set<string>();
  for (const tone of ALL) {
    for (const { code } of tone.facets) reached.add(code);
  }
  for (const destination of Object.values(DESTINATIONS)) {
    for (const { code } of statedVoiceFacets(destination.voice)) reached.add(code);
  }
  for (const facet of VOICE_FACETS) {
    assert.ok(reached.has(facet.code), `nothing resolves to ${facet.code}`);
  }
});

test("the question asks for the tones, and asks for them the way it says", () => {
  const step = QUIZ_STEPS.find((s) => s.key === "voice");
  assert.ok(step, "the voice question is not in the quiz");

  const field = step.fields[0] as MultiField;
  assert.equal(field.id, "voice_tones");
  assert.equal(field.type, "multi");
  assert.equal(field.layout, "tiles");
  assert.equal(field.quiet, true, "a browsed field must not count out loud");
  assert.equal(field.max, 7, "the ceiling is seven; see db/007");
  assert.equal(
    field.options.length,
    TONES.length,
    "the page and the vocabulary disagree about how many tones there are"
  );
  for (const option of field.options) {
    assert.ok(TONE_CODES.has(option.code), `${option.code} is not a tone`);
    assert.equal(option.hint, undefined, "a tile carries no hint line");
  }
});

/* ── the round trip ────────────────────────────────────────────────── */

test("a destination's tones are real, weighted legally, and few", () => {
  for (const [key, tones] of Object.entries(DESTINATION_TONES)) {
    assert.ok(tones.length >= 6, `${key} is described in too few tones`);
    assert.ok(
      tones.length <= 10,
      `${key} needs more than ten tones — the vocabulary is doing the work of ` +
        `a paragraph, and a host cannot make that many claims`
    );
    for (const { code, weight } of tones) {
      assert.ok(TONE_CODES.has(code), `${key} -> unknown tone ${code}`);
      assert.ok(
        weight > 0 && weight <= 1,
        `${key} -> ${code} has weight ${weight}; a destination claims a tone or omits it`
      );
    }
  }
});

test("a destination does not say the same thing twice", () => {
  for (const [key, tones] of Object.entries(DESTINATION_TONES)) {
    const destination = DESTINATIONS[key as keyof typeof DESTINATIONS];
    const stated = new Set(
      statedVoiceFacets(destination.voice).map((f) => f.code)
    );
    // A tone may CONTRIBUTE to a stated axis — that is resolution, not
    // duplication. What must not happen is a tone whose whole meaning is one
    // stated facet, which would be the fact written twice at two strengths.
    for (const { code } of tones) {
      const tone = ALL.find((t) => t.code === code);
      assert.ok(tone);
      const onlyStated =
        tone.facets.length === 1 && stated.has(tone.facets[0].code);
      assert.ok(
        !onlyStated,
        `${key} tags ${code}, which says nothing except what its voice already states`
      );
    }
  }
});

test("WESTHAMPTON, 1976 round-trips through the tone vocabulary", () => {
  const westhampton = DESTINATIONS["westhampton-1976"];
  const authored = destinationVoiceProfile(
    westhampton.voice,
    DESTINATION_TONES["westhampton-1976"]
  );

  // What the voice states outright, arriving intact.
  assert.equal(authored.formality_cordial, 1);
  assert.equal(authored.address_impersonal, 1);
  assert.equal(authored.humour_dry, 1);

  // What the prose says, arriving as numbers with the right SIGN. These are the
  // claims a curator would make reading the voice: it never performs, it
  // explains nothing, it is quiet, it is exact, and it never names a feeling.
  const expected: [VoiceFacetCode, "positive" | "negative"][] = [
    ["theatricality", "negative"],
    ["knowingness", "positive"],
    ["cadence_clipped", "positive"],
    ["volume", "negative"],
    ["precision", "positive"],
    ["earnestness", "negative"],
    ["irreverence", "positive"],
  ];
  for (const [code, sign] of expected) {
    const weight = authored[code] ?? 0;
    assert.ok(
      sign === "positive" ? weight > 0 : weight < 0,
      `${code} should be ${sign} for Westhampton; it is ${weight}`
    );
  }

  // A host whose people sound like that house should land on that house.
  const hers = toneProfile([
    "deadpan",
    "understated",
    "explains_nothing",
    "low_voices",
    "never_performs",
    "unhurried",
  ]);
  const affinity = voiceAffinity(hers, authored);
  assert.ok(
    affinity > 0.75,
    `a deadpan, understated group should match Westhampton strongly; got ${affinity}`
  );

  // And a host whose people are the opposite should not. This is the test that
  // would fail if the vocabulary were fifty synonyms for the same thing.
  const opposite = toneProfile([
    "says_it_out_loud",
    "sentimental",
    "makes_an_entrance",
    "all_at_once",
    "toasts",
    "does_the_voice",
  ]);
  const wrong = voiceAffinity(opposite, authored);
  assert.ok(
    wrong < 0,
    `an effusive, theatrical group should be repelled by Westhampton; got ${wrong}`
  );
  assert.ok(affinity - wrong > 1, "the vocabulary does not discriminate");
});

/**
 * The second destination, and the first chance to check the thing the
 * vocabulary is actually FOR.
 *
 * One destination cannot fail this: any vector matches itself. Two can, and the
 * failure would be silent — two houses authored months apart, described in the
 * same handful of tones because those are the tones an author reaches for,
 * resolving to the same vector and scoring the same against every host. That is
 * a catalogue with one destination in it wearing two palettes.
 *
 * So the claim under test is not "Havana is warm". It is that Havana and
 * Westhampton are far apart, and that a host's answers sort them.
 */
test("HAVANA, THE SMALL HOURS is a different house from Westhampton", () => {
  const havana = destinationVoiceProfile(
    DESTINATIONS.havana.voice,
    DESTINATION_TONES.havana
  );
  const westhampton = destinationVoiceProfile(
    DESTINATIONS["westhampton-1976"].voice,
    DESTINATION_TONES["westhampton-1976"]
  );

  // Stated outright, and all three differ from Westhampton's cordial,
  // impersonal, dry. A destination whose three stated facets match another's is
  // already most of the way to being the same destination.
  assert.equal(havana.formality_plain, 1);
  assert.equal(havana.address_collective_first, 1);
  assert.equal(havana.humour_warm, 1);

  // What the prose says, arriving as numbers with the right sign: it is fond
  // out loud, it takes its time, it is exact about the hour, it is louder than
  // a house where the best line is muttered, and it does not perform.
  const expected: [VoiceFacetCode, "positive" | "negative"][] = [
    ["warmth", "positive"],
    ["earnestness", "positive"],
    ["cadence_unhurried", "positive"],
    ["precision", "positive"],
    ["volume", "positive"],
    ["theatricality", "negative"],
    ["irreverence", "negative"],
  ];
  for (const [code, sign] of expected) {
    const weight = havana[code] ?? 0;
    assert.ok(
      sign === "positive" ? weight > 0 : weight < 0,
      `${code} should be ${sign} for Havana; it is ${weight}`
    );
  }

  assert.ok(
    voiceAffinity(havana, westhampton) < 0.3,
    "Havana and Westhampton resolve to nearly the same voice — one of them is " +
      "not authored, it is echoed"
  );

  // And the sorting works in both directions, which is the whole point of
  // tagging the catalogue in the vocabulary she answers in.
  const warmGroup = toneProfile([
    "good_natured",
    "laughs_first",
    "lingers",
    "says_it_out_loud",
  ]);
  const dryGroup = toneProfile([
    "deadpan",
    "understated",
    "low_voices",
    "explains_nothing",
  ]);
  assert.ok(
    voiceAffinity(warmGroup, havana) > voiceAffinity(warmGroup, westhampton),
    "a warm, fond, lingering group should land on Havana"
  );
  assert.ok(
    voiceAffinity(dryGroup, westhampton) > voiceAffinity(dryGroup, havana),
    "a dry, quiet group should land on Westhampton"
  );
});

test("silence is silence: unchosen tones make no claim", () => {
  const one = toneProfile(["deadpan"]);
  // Exactly the facets `deadpan` claims, and no others. Not a zero for the
  // other twenty-three axes, which would be a claim she never made.
  assert.deepEqual(Object.keys(one).sort(), [
    "earnestness",
    "humour_deadpan",
    "theatricality",
  ]);
  assert.deepEqual(toneProfile([]), {});
  assert.deepEqual(toneProfile(["not_a_tone"]), {});
});
