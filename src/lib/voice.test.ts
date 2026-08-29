import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { test } from "node:test";

import { DESTINATIONS, DESTINATION_TONES } from "./destinations.ts";
import { QUIZ_STEPS, type MultiField } from "./quiz.ts";
import { matrixDistance, isDeclaredTwin } from "./matrix.ts";
import {
  TONES,
  TONE_GROUPS,
  VOICE_FACETS,
  destinationVoiceProfile,
  statedVoiceFacets,
  toneProfile,
  voiceAffinity,
  voiceCeiling,
  toneHandOverlap,
  VOICE_CEILING_STRICT,
  VOICE_CEILING_MONITOR,
  TONE_HAND_OVERLAP_MAX,
  type Tone,
  type VoiceFacetCode,
} from "./voice.ts";
import { duplicatesOf } from "./voice-duplicates.ts";

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
  // THE SHIPPED TONES, NOT ALL OF THEM. Drafts are words waiting for their
  // rooms and are filtered off the page (src/lib/quiz.ts, CLAUDE.md rule 16);
  // "no draft tone reaches the quiz" below asserts that boundary in both
  // directions. Counting against TONES.length would fail the moment a
  // fourteenth draft is coined, which is a correct state of the world.
  assert.equal(
    field.options.length,
    ALL.filter((t) => !t.draft).length,
    "the page and the vocabulary disagree about how many SHIPPED tones there are"
  );
  for (const option of field.options) {
    assert.ok(TONE_CODES.has(option.code), `${option.code} is not a tone`);
    assert.equal(option.hint, undefined, "a tile carries no hint line");
  }
});

/* ── the round trip ────────────────────────────────────────────────── */

/**
 * HOW MANY TONES ONE ROOM MAY CLAIM — measured, 2026-08-29.
 *
 * KEPT PER RULE 14. THE OLD VALUE WAS 10, and its whole argument was the
 * failure message it shipped with: "the vocabulary is doing the work of a
 * paragraph, and a host cannot make that many claims." That is a real risk and
 * the number was a PROXY for it — a room claiming most of the vocabulary stops
 * being tellable from its neighbours. What the proxy never had was an argument
 * beside it: no distribution, no measured refusal, no calibration. A bare
 * number, exactly the shape `0.65` was before it was calibrated, and by the end
 * it was failing five authored rooms that every real guard passes.
 *
 * WHAT BEAT IT: CLAUDE.md rule 28, and the condition rule 28 attached to
 * itself. The founder's ruling — "i dont want to cut tones. once the drinks and
 * food are added they r different enough" — was made conditional on the second
 * number existing: "the cap moves WITH the catalogue, not ahead of it… the
 * deliverables measure is MUTE while six rooms have no dishes." That condition
 * is now met. `npm run check:voices` reports 153 OF 153 PAIRS MEASURABLE, 0
 * UNKNOWN, after the per-identity floors of 5df056d. A proxy is retired when
 * the thing it stood in for becomes measurable; it is not defended for its own
 * sake.
 *
 * WHERE 13 COMES FROM: the authored rooms, not a wish. The largest hand in the
 * catalogue is 13 — Amalfi and Oaxaca, both from the founder's own verbatim
 * tone lists. Aspen and Palm Springs carry 12, St. Moritz 10. The cap sits at
 * what she actually wrote, so it still refuses a room that reaches past the
 * whole vocabulary while refusing none of the rooms she authored.
 *
 * WHAT THE MOVE COSTS, COUNTED (rule 24), and measured the way the ceiling
 * recalibration was measured — over the SAME 420 constructions from
 * `src/lib/voice-duplicates.ts` that `npm run check:voices -- --duplicates`
 * prints, all 18 rooms, 0-2 tones dropped, weights jittered, the stated triple
 * restated 0/1/2/3 at a time:
 *
 *   refused by the OLD configuration (cap 10 + monitor ceiling + hand guard
 *     + the stated-triple uniqueness test)                        420 of 420
 *   refused by the NEW configuration (cap 13, everything else as before)
 *                                                                 420 of 420
 *   constructions the old caught and the new lets through                  0
 *
 * NO LESS IS REFUSED. The cap fired on 120 of the 420 and was never the only
 * thing firing on any of them: the count of constructions REFUSED BY THE CAP
 * ALONE, with no other instrument catching them, is 0 at a cap of 10 and 0 at a
 * cap of 13.
 *
 * SO SAY PLAINLY WHAT DOES THE WORK, because the cap has been read as the
 * echo guard and is not: `TONE_HAND_OVERLAP_MAX` (0.8) catches ALL 420 — an
 * echo is a copied list of codes, and that is the instrument that compares
 * lists. The monitor ceiling catches 240, the stated-triple uniqueness test 105.
 * A hand length has never caught a copy and cannot: a copyist shortens a hand,
 * they do not lengthen one, so the cap is the one guard an echo passes by
 * getting MORE like an echo.
 */
const DESTINATION_TONE_MAX = 13;

test("a destination's tones are real, weighted legally, and few", () => {
  for (const [key, tones] of Object.entries(DESTINATION_TONES)) {
    assert.ok(tones.length >= 6, `${key} is described in too few tones`);
    assert.ok(
      tones.length <= DESTINATION_TONE_MAX,
      `${key} claims ${tones.length} tones against a cap of ${DESTINATION_TONE_MAX} — ` +
        `the vocabulary is doing the work of a paragraph, and a host cannot make ` +
        `that many claims. This is NOT the echo guard: see toneHandOverlap and ` +
        `the argument above this test before reading a breach as a duplicated room.`
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

  // A draft whose room has arrived is no longer a draft, and the flag has to be
  // cleared or the assertion above stops covering it.
  //
  // THIS USED TO CARRY THE COMMENT "A draft tone must not be shown to a host",
  // WHICH IT DOES NOT CHECK. It compares drafts against DESTINATION_TONES —
  // what the library claims — and the quiz surface is a different list
  // entirely, so the rule the comment stated was asserted nowhere and thirteen
  // draft tones rendered as blank tiles for as long as the flag existed. The
  // comment is corrected to what this assertion does; the rule it named is
  // asserted below, against the surface it is about. CLAUDE.md rule 16: an
  // input the system does not honour must be refused where the person is
  // standing, and a test that describes a rule it does not check is the same
  // failure one layer up.
  const claimedDrafts = ALL.filter((t) => t.draft && claimed.has(t.code)).map(
    (t) => t.code
  );
  assert.deepEqual(
    claimedDrafts,
    [],
    `these are still marked draft but a destination now claims them — clear ` +
      `the flag so the assertion above covers them: ${claimedDrafts.join(", ")}`
  );
});

/**
 * A DRAFT TONE IS NOT SHOWN TO A HOST — asserted against the quiz itself.
 *
 * The rule this states is CLAUDE.md rule 16's own worked example: a draft tile
 * has no mark, so it renders blank; no destination claims it, so it can win
 * nothing; and no migration gives it a facet row, so `quiz_response_facet`'s
 * inner join drops the answer. Every one of those failures is silent, and the
 * host has spent one of seven taps.
 *
 * It is asserted HERE and not in the quiz's own tests because the draft flag
 * lives in this file's vocabulary, and the day somebody coins a fourteenth
 * draft this is the file they are already in.
 */
test("no draft tone reaches the quiz", () => {
  const field = QUIZ_STEPS.flatMap((step) => step.fields).find(
    (f) => f.id === "voice_tones"
  ) as MultiField | undefined;
  assert.ok(field, "the voice question has gone missing");

  const offered = new Set(field.options.map((o) => o.code));
  const drafts = ALL.filter((t) => t.draft).map((t) => t.code);

  const shown = drafts.filter((code) => offered.has(code));
  assert.deepEqual(
    shown,
    [],
    `these tones are marked draft and are on the page. A host can tap them, ` +
      `they render without a mark, no destination claims them and nothing ` +
      `resolves them: ${shown.join(", ")}`
  );

  // And the other direction, so the filter cannot be over-eager: everything
  // that is NOT a draft is offered. A shipped tone missing from the page is a
  // destination nobody can reach.
  const missing = ALL.filter((t) => !t.draft && !offered.has(t.code)).map(
    (t) => t.code
  );
  assert.deepEqual(
    missing,
    [],
    `these tones ship and are not on the page: ${missing.join(", ")}`
  );
});

/**
 * Every shipped tone has a mark cut for it, and no draft does.
 *
 * THE CHEAPEST TEST IN THIS FILE AND IT GUARDS A MEMBER SURFACE. The binding
 * between a tone and its tile art is a FILENAME and nothing else:
 * scripts/build-tone-marks.mjs reads design/tone-icons/*.svg, strips the
 * extension, and emits that string as a key into TONE_MARKS. QuizFlow then does
 * TONE_MARKS[option.code], and a miss renders NOTHING — by design, so that a
 * tone without a mark is a plainer tile rather than a broken one.
 *
 * That graceful failure is correct for one missing mark and terrible as a
 * silent contract. Rename a tone and its mark is orphaned; coin a tone and its
 * tile ships blank; and `npm run check:tone-marks` will not notice either,
 * because it only checks that the GENERATED FILE matches the DIRECTORY. Nothing
 * anywhere compared the directory to TONES until this test.
 *
 * Draft tones are asserted in the OTHER direction: a mark must not exist for a
 * tone no host can be shown yet, because an unclaimed drawing in that directory
 * is how a retired tone quietly comes back.
 */
test("every shipped tone has a mark, and every mark has a tone", () => {
  const cut = new Set(
    readdirSync(new URL("../../design/tone-icons", import.meta.url))
      .filter((f) => f.endsWith(".svg"))
      .map((f) => f.slice(0, -4))
  );
  const shipped = ALL.filter((t) => !t.draft).map((t) => t.code);
  const drafts = ALL.filter((t) => t.draft).map((t) => t.code);

  const unmarked = shipped.filter((c) => !cut.has(c));
  assert.deepEqual(
    unmarked,
    [],
    `these tones ship to a host with no mark cut, so the tile renders blank: ` +
      `${unmarked.join(", ")}. Cut the SVG into design/tone-icons/ and re-run ` +
      `npm run build:tone-marks.`
  );

  const orphaned = [...cut].filter((c) => !shipped.includes(c) && !drafts.includes(c)).sort();
  assert.deepEqual(
    orphaned,
    [],
    `these marks are drawn but no tone claims them, which is usually a rename ` +
      `that left its art behind: ${orphaned.join(", ")}`
  );

  const premature = drafts.filter((c) => cut.has(c)).sort();
  assert.deepEqual(
    premature,
    [],
    `a mark exists for a DRAFT tone no host can be shown: ${premature.join(", ")}. ` +
      `Either clear the draft flag or remove the art — an unclaimed drawing is ` +
      `how a retired tone comes back.`
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
 * every pair, it is the one that fails when a fourteenth destination is written
 * by reaching for the tones an author happens to like.
 *
 * ── THE ARGUMENT THAT WAS HERE, KEPT PER RULE 14 ─────────────────────
 *
 * Verbatim, because it is still true and is not what changed:
 *
 *   "The ceiling is 0.65 rather than something tighter because real
 *   destinations DO overlap — four of them are slow, three are warm — and the
 *   allocation permits sharing on one group provided two others differ. At the
 *   time of writing the closest pair is Nantucket and Portofino at 0.58: two
 *   quiet houses that part on ceremony, on knowingness and on who they are
 *   written for."
 *
 * WHAT BEAT IT: not the number, the APPLICATION of it. This test held every
 * pair to 0.65 regardless of structural distance, and the doctrine has said a
 * split for as long as it has been written down — strict 0.65 where the
 * structural matrix cannot route two rooms apart, monitor 0.80 where it can.
 * `data/destination-matrix.json` quotes "the strict cap of 0.65, which applies
 * here BECAUSE the pair sits at structural distance 1"; `docs/proposals.md`
 * rules Oaxaca/Havana at 0.846 "against a MONITOR ceiling of 0.80" and calls it
 * kinship rather than defect, on the express ground that "structural distance
 * is 3, so routing is unaffected". Two tiers, both in prose, neither in code —
 * so the flat assertion here was enforcing the tiebreak tier against pairs no
 * tiebreak is ever reached for. `voiceCeiling()` in ./voice.ts holds the split
 * and the full argument for where the boundary sits.
 *
 * WHAT THE SPLIT MOVES, COUNTED (rule 24). Measured against the twelve wired
 * rooms by `npm run check:voices --wired`: NOTHING. The wired field's worst
 * pair is Nantucket/Portofino at 0.580 and its two strict-tier pairs are the
 * declared twins at 0.401 and 0.172, so no pair in the shipped catalogue
 * changes verdict and this test stays green for the same reason it was green
 * before. The split is not a loosening that buys today's catalogue anything.
 * It is the doctrine written down where it is enforced, so that the rooms
 * waiting on it are judged by the rule that was actually ruled.
 *
 * AND THE FAILURE MESSAGE WAS ASSERTING SOMETHING FALSE. It said "One of them
 * is not authored, it is echoed" of any breach at all. That diagnosis is
 * correct for a strict-tier pair and it is a slander at the monitor tier: the
 * three rooms that have breached this ceiling — Acapulco, Amalfi, Aspen — are
 * each authored from a founder's own verbatim tone list, and what they share
 * with the room they collide with is a temperament, not a text. A test that
 * names the wrong cause sends the next person to re-tag a room that is
 * correctly tagged, which is the exact failure `docs/voices-draft/
 * VERIFICATION.md` refused by name.
 *
 * ── AND THE TWO NUMBERS THEMSELVES MOVED, 2026-08-27 ─────────────────
 *
 * KEPT PER RULE 14: strict was 0.65 and monitor was 0.80. Neither was ever
 * measured. Strict sat 0.07 above the maximum of its own field and fired zero
 * times in the life of the project; monitor fired on every new room and on
 * nothing else. The full argument, the distribution and the four duplicate
 * populations that beat them are in `voiceCeiling()` in ./voice.ts, and every
 * number in it is reproducible from `npm run check:voices` and
 * `npm run check:voices -- --duplicates`.
 *
 * WHAT THIS TEST GAINED AS A RESULT, because widening a ceiling without
 * widening what is refused would be a relaxation wearing a calibration's
 * clothes: the hand-overlap assertion below, and the duplicate regression
 * beneath it. Counted (rule 24), over the 420 committed constructions: the old
 * flat 0.80 caught 379 of them; the new monitor ceiling alone catches 239, and
 * the ceiling together with the hand guard catches 420 — every one. MORE IS
 * REFUSED THAN BEFORE, and the rooms the old number held out are admitted.
 */
test("no two destinations resolve to nearly the same voice", () => {
  // EVERY breach, not the worst one. The old assertion printed a single pair,
  // which is how a second and third collision stayed invisible behind the
  // first: fixing the top pair simply revealed the next, one run at a time.
  const breaches: {
    a: string;
    b: string;
    score: number;
    tier: string;
    limit: number;
    why: string;
  }[] = [];
  for (let i = 0; i < DESTINATION_KEYS.length; i++) {
    for (let j = i + 1; j < DESTINATION_KEYS.length; j++) {
      const a = DESTINATION_KEYS[i];
      const b = DESTINATION_KEYS[j];
      const score = voiceAffinity(RESOLVED.get(a)!, RESOLVED.get(b)!);
      // The tier comes from the matrix, not from a second copy of the row set
      // living in this file. src/lib/matrix.ts is the one owner and
      // scripts/audit-matrix.mjs is the other consumer (rule 21).
      const ceiling = voiceCeiling(matrixDistance(a, b), isDeclaredTwin(a, b));
      if (score >= ceiling.limit)
        breaches.push({ a, b, score, tier: ceiling.tier, limit: ceiling.limit, why: ceiling.why });
    }
  }
  assert.equal(
    breaches.length,
    0,
    breaches
      .map(
        (b) =>
          `${b.a} and ${b.b} are at ${b.score.toFixed(3)} against the ${b.tier} ` +
          `ceiling of ${b.limit} (${b.why}). ` +
          (b.tier === "strict"
            ? "STRICT TIER: the structural matrix cannot route these two apart, so " +
              "voice is the only thing that can, and it cannot. One of them is not " +
              "authored, it is echoed — or the pair is one room written twice."
            : "MONITOR TIER: these two are routed apart structurally, so this is not " +
              "a routing failure and re-tagging is not automatically the fix. Read it " +
              "as a question — are these two rooms the same temperament said twice " +
              "(echo, and it is an authoring defect), or two different evenings thrown " +
              "by the same kind of people (kinship, which is real and is recorded as " +
              "such for Oaxaca/Havana in docs/proposals.md)? Run " +
              "`npm run check:voices -- --facets " + b.a + " " + b.b + "` before deciding.")
      )
      .join("\n") +
      `\n\nThe whole distribution is \`npm run check:voices\`. Ceilings: strict ` +
      `${VOICE_CEILING_STRICT} at declared twins and structural distance <= 2, ` +
      `monitor ${VOICE_CEILING_MONITOR} beyond.`
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
 * NO ROOM WEARS ANOTHER ROOM'S TONE HAND.
 *
 * The instrument the ceiling above cannot be. `voiceAffinity` is a cosine over
 * facet weights, and the three facets a voice states outright are very nearly
 * invisible to it — a one-hot disagreement contributes zero to the dot product
 * rather than a negative — so a copyist who restates one stated facet drops a
 * clone from 0.955 to as low as 0.844, straight into the range where real
 * authored rooms live. No choice of threshold separates those two populations,
 * which is measured rather than argued: `npm run check:voices -- --duplicates`.
 *
 * This is exact where that is blurry. An echo, in this system's own terms, IS a
 * copied list of codes, so the list of codes is the thing to compare. Weights
 * are ignored deliberately: re-weighting a copied hand is the cheapest possible
 * evasion of a weighted measure, and the jittered constructions still score
 * 1.000 here while scoring 0.998 on the cosine.
 *
 * The threshold is the middle of a measured empty band — the authored field
 * tops out at 0.667 (two pairs, each four tones of six) and every construction
 * lands at 1.000. It is FLAT across both tiers, unlike the ceiling, because
 * copying a hand is an authoring defect whatever the structural matrix says
 * about routing.
 */
test("no destination wears another destination's tone hand", () => {
  const copied: string[] = [];
  for (let i = 0; i < DESTINATION_KEYS.length; i++)
    for (let j = i + 1; j < DESTINATION_KEYS.length; j++) {
      const a = DESTINATION_KEYS[i];
      const b = DESTINATION_KEYS[j];
      const overlap = toneHandOverlap(DESTINATION_TONES[a], DESTINATION_TONES[b]);
      if (overlap > TONE_HAND_OVERLAP_MAX)
        copied.push(
          `${a} and ${b} share ${(overlap * 100).toFixed(0)}% of the smaller ` +
            `room's tone codes against a guard of ${TONE_HAND_OVERLAP_MAX}`
        );
    }
  assert.deepEqual(
    copied,
    [],
    `a tone hand has been reused rather than authored. This is not the voice ` +
      `ceiling and re-weighting will not fix it — the codes themselves are the ` +
      `same list:\n${copied.join("\n")}`
  );
});

/**
 * THE GUARD, WATCHED GOING RED. Rule 21: a guard nobody has seen fire is a
 * guard nobody has checked, and "the assertion did not fail" is not evidence
 * that it can.
 *
 * Every room in the catalogue is copied by `src/lib/voice-duplicates.ts` — the
 * same generator `npm run check:voices -- --duplicates` reports from, so the
 * report and this assertion cannot drift into two different populations — and
 * every copy is run past the instruments the way the two tests above run real
 * rooms past them. The claim under test is narrow and is the whole point of the
 * recalibration: WIDENING THE CEILING DID NOT ADMIT A COPIED ROOM, because
 * something else catches every copy the ceiling now lets through.
 *
 * It also asserts the shape of the finding, not only its conclusion: the
 * cosine alone must FAIL to catch some copies. If that assertion ever goes
 * green the other way — if the ceiling starts catching all 384 — then the
 * populations have moved and the ceiling was recalibrated against a field that
 * no longer exists, which is a thing a later reader needs told rather than
 * left to notice.
 */
test("a copied room is refused, and the ceiling alone is not what refuses it", () => {
  let built = 0;
  let ceilingCaught = 0;
  const escaped: string[] = [];

  for (const key of DESTINATION_KEYS) {
    const original = RESOLVED.get(key)!;
    for (const copy of duplicatesOf(key, DESTINATIONS[key].voice, DESTINATION_TONES[key])) {
      built++;
      const score = voiceAffinity(original, copy.profile);
      const hand = toneHandOverlap(DESTINATION_TONES[key], copy.tones);
      if (score >= VOICE_CEILING_MONITOR) ceilingCaught++;
      if (score < VOICE_CEILING_MONITOR && hand <= TONE_HAND_OVERLAP_MAX)
        escaped.push(
          `a copy of ${key} with ${copy.changes} stated facet(s) restated, ` +
            `${copy.drop} tone(s) dropped and weights nudged by ${copy.jitter} ` +
            `scores ${score.toFixed(3)} and shares ${hand.toFixed(3)} of the hand`
        );
    }
  }

  assert.ok(built > 100, `only ${built} copies were built; the generator is not running`);
  assert.deepEqual(
    escaped,
    [],
    `these copies pass every instrument, so a room could be echoed into the ` +
      `catalogue without anything going red:\n${escaped.join("\n")}`
  );
  assert.ok(
    ceilingCaught < built,
    `the monitor ceiling caught all ${built} copies. That is not the field the ` +
      `ceiling was calibrated against — re-run npm run check:voices -- --duplicates ` +
      `and re-derive it before trusting the number.`
  );
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
