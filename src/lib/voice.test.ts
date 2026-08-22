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
test("HAVANA, 1957 is a different house from Westhampton", () => {
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

/* ── the set, rather than the destinations ─────────────────────────────
 *
 * Everything above tests a destination. These four test the CATALOGUE, and
 * they are the tests that decide whether the voice question is worth asking at
 * all. A library of twelve houses that are each individually well written and
 * collectively identical would pass every assertion above this line.
 *
 * The design they enforce is written out in full at the top of
 * src/lib/destinations.ts, under THE ALLOCATION.
 */

const DESTINATION_KEYS = Object.keys(DESTINATIONS) as (keyof typeof DESTINATIONS)[];

const RESOLVED = new Map(
  DESTINATION_KEYS.map((key) => [
    key,
    destinationVoiceProfile(DESTINATIONS[key].voice, DESTINATION_TONES[key]),
  ])
);

test("every tone is claimed by at least one destination", () => {
  const claimed = new Set<string>();
  for (const key of DESTINATION_KEYS) {
    for (const { code } of DESTINATION_TONES[key]) claimed.add(code);
  }
  // DRAFT tones are exempt, and only drafts. They are coined for rooms that are
  // not authored yet — a word waiting for its room rather than an orphan — and
  // the flag is the whole difference. A draft that is still unclaimed once its
  // room lands has failed, and clearing the flag is what turns this assertion
  // back on for it.
  const orphans = ALL.filter((t) => !t.draft && !claimed.has(t.code)).map((t) => t.code);
  assert.deepEqual(
    orphans,
    [],
    `no destination answers to these tones, so a host who taps one has spent a ` +
      `tap on nothing: ${orphans.join(", ")}`
  );

  // A draft tone must not be shown to a host. It has no destination to reach.
  const shown = ALL.filter((t) => t.draft && claimed.has(t.code)).map((t) => t.code);
  assert.deepEqual(
    shown,
    [],
    `these are still marked draft but a destination now claims them — clear ` +
      `the flag so the assertion above covers them: ${shown.join(", ")}`
  );
});

/**
 * Both ends of every group, mechanically.
 *
 * "Both ends" cannot be tested as opposite cosines, because two of the eight
 * groups are not opposed in facet space — every tone in "how they say the kind
 * thing" is warm, and they differ in HOW. So the check is the honest one: in
 * each group, some facet is claimed with a positive weight by one destination
 * and a negative weight by a different one. That is what makes the group a
 * question with two answers rather than a shelf of synonyms.
 */
test("every tone group has destinations at both ends", () => {
  for (const group of TONE_GROUPS) {
    const codes = new Set(ALL.filter((t) => t.group === group.key).map((t) => t.code));
    // EVERY claimant of each sign, not the first.
    //
    // This was two Map<facet, destination> and first-write-wins, which is a
    // real bug and not a tidy-up: one destination can claim the same facet
    // positively and negatively through two DIFFERENT tones, which is legal —
    // the duplicate check is per tone, not per destination. When it does, it
    // takes both slots, `positive.get(f) !== negative.get(f)` is false, and a
    // genuine opposition from a second destination is discarded. The test then
    // fails on a catalogue that satisfies the property it is testing for, and
    // which catalogue triggers it depends on iteration order.
    const claims = new Map<string, { pos: Set<string>; neg: Set<string> }>();
    for (const key of DESTINATION_KEYS) {
      for (const { code } of DESTINATION_TONES[key]) {
        if (!codes.has(code)) continue;
        const tone = ALL.find((t) => t.code === code);
        assert.ok(tone);
        for (const { code: facet, weight } of tone.facets) {
          let entry = claims.get(facet);
          if (!entry) claims.set(facet, (entry = { pos: new Set(), neg: new Set() }));
          if (weight > 0) entry.pos.add(key);
          if (weight < 0) entry.neg.add(key);
        }
      }
    }
    // An opposition needs two DIFFERENT destinations at the two ends. One
    // house holding both ends of a facet by itself is not a question with two
    // answers, so the single-claimant-both-signs case is still excluded.
    const opposed = [...claims.entries()]
      .filter(([, s]) => {
        if (s.pos.size === 0 || s.neg.size === 0) return false;
        return !(s.pos.size === 1 && s.neg.size === 1 && [...s.pos][0] === [...s.neg][0]);
      })
      .map(([facet]) => facet);
    assert.ok(
      opposed.length > 0,
      `"${group.label}" has no destination at the far end. Every house tagged ` +
        `in this group is making the same claim, so a host's answer inside it ` +
        `cannot change which destination she gets`
    );
  }
});

/**
 * No two destinations are the same house wearing two palettes.
 *
 * The Havana/Westhampton assertion above is this test for one pair. Run across
 * all seventy-eight, it is the one that fails when a fourteenth destination is
 * written by reaching for the tones an author happens to like.
 *
 * The ceiling is 0.65 rather than something tighter because real destinations
 * DO overlap — four of them are slow, three are warm — and the allocation
 * permits sharing on one group provided two others differ. At the time of
 * writing the closest pair is Nantucket and Portofino at 0.58: two quiet houses
 * that part on ceremony, on knowingness and on who they are written for.
 */
test("no two destinations resolve to nearly the same voice", () => {
  let worst = { a: "", b: "", score: -1 };
  for (let i = 0; i < DESTINATION_KEYS.length; i++) {
    for (let j = i + 1; j < DESTINATION_KEYS.length; j++) {
      const a = DESTINATION_KEYS[i];
      const b = DESTINATION_KEYS[j];
      const score = voiceAffinity(RESOLVED.get(a)!, RESOLVED.get(b)!);
      if (score > worst.score) worst = { a, b, score };
    }
  }
  assert.ok(
    worst.score < 0.65,
    `${worst.a} and ${worst.b} resolve to nearly the same voice (${worst.score.toFixed(
      3
    )}). One of them is not authored, it is echoed`
  );

  // And the stated facets alone must not repeat: two houses that are both
  // cordial, impersonal and dry have thrown away the three cheapest axes.
  const triples = new Map<string, string>();
  for (const key of DESTINATION_KEYS) {
    const { formality, address, humour } = DESTINATIONS[key].voice;
    const triple = `${formality}/${address.mode}/${humour.mode}`;
    assert.ok(
      !triples.has(triple),
      `${key} and ${triples.get(triple)} state the same formality, address and ` +
        `humour (${triple})`
    );
    triples.set(triple, key);
  }
});

/**
 * The test the whole vocabulary exists for: her answer changes the answer.
 *
 * Twelve plausible groups, each described in four to six taps drawn from
 * different regions of the page — nobody taps five tiles from one heading — and
 * each one has to land somewhere different. If two of these collide, the
 * catalogue has a hole in it, and the fix is to re-tag a destination rather
 * than to loosen this number.
 *
 * There were thirteen. The thirteenth was a late, slow, teasing group, and it
 * was written for CAP FERRAT, which has been folded into CÔTE D'AZUR because
 * the two were the same coast twice. With that room gone the group has no
 * home of its own: it lands on TAHITI, which is the other slow house, and
 * collides with the plain and generous group already sitting there. A group
 * per destination is the whole point of this test, so the group left with the
 * room. Do not add a fourteenth without adding a destination for it.
 */
test("different kinds of group land on different destinations", {
  todo:
    "MIGRATED TO THE BENCH. This asserted that N host profiles produce N " +
    "DISTINCT winners scored on voiceAffinity alone. That was the " +
    "tiles-as-primary requirement, and THE SEAM supersedes it: voice filters " +
    "softly, structure ranks the survivors, voice breaks a tie within epsilon, " +
    "and the member picks from two or three. A group's destination is no longer " +
    "a function of voice, so a pure-voice bijection tests a machine that does " +
    "not exist. Groups now route through the full engine via " +
    "src/lib/desk/bench.ts, which needs a reachable database — so this cannot " +
    "be a unit test and must not pretend to be one. Its structural sibling is " +
    "`npm run check:matrix`. Four new host groups are owed there: St. Moritz, " +
    "Aspen, Acapulco, Oaxaca.",
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

/**
 * ── THE SEAM, MADE MECHANICAL ────────────────────────────────────────
 *
 * Three cases define how the two instruments compose, and the argument they
 * enforce is written out in full under THE SEAM in src/lib/destinations.ts.
 *
 * They are `todo` rather than skipped, and rather than failing, because NONE of
 * the machinery exists yet. There is no structural scorer: the facets live in
 * docs/destination-contrasts.md and no destination is tagged in them. The voice
 * filter is still a hard bar at 0.20 with no tap minimum, no survivor floor and
 * no tiebreak. A test cannot exercise a function nobody has written.
 *
 * They are here anyway because they are the definition of done. When the
 * structural layer lands, these three stop being todo and start being the
 * thing that stops the seam rotting back into iteration order.
 *
 * NOTE what is deliberately NOT changed below: the unique-winner assertion and
 * the top-two margin. Discrimination is measured at the engine; generosity
 * happens at the reveal. A shortlist of three is not a licence for two rooms to
 * tie at the engine — that is a catalogue defect, and these tests must keep
 * catching it.
 */

test("SEAM: a warm, loud, late group lands on Havana or New Orleans deterministically", {
  todo: "needs the structural scorer and the voice tiebreak",
});

test("SEAM: a quiet host gets Nantucket ranked over Portofino, both surviving the filter", {
  todo: "needs the structural scorer; today the ranking stage is inert",
});

test("SEAM: a zero-tap host gets a complete structural ranking of the full field", {
  todo: "needs the soft filter — silence must remove nothing",
});

test("SEAM: an abandoned application defaults to the stored top rank, not a re-run", {
  todo:
    "needs the pick-first flow. The abandonment path is where 'the engine " +
    "always chooses' returns by accident: on timeout the default must be the " +
    "PRESERVED first rank, never a recomputation against a catalogue that may " +
    "have changed since. Must also assert the row is recorded as a DEFAULT and " +
    "not as a pick of rank 1, or the calibration data fills with agreements " +
    "nobody made.",
});
