#!/usr/bin/env node
/**
 * WHAT DOES THE VOICE BAR ACTUALLY DO TO THE SHORTLIST?
 *
 *   npm run check:tone-threshold
 *
 * ─────────────────────────────────────────────────────────────────────
 * WHY THIS EXISTS
 *
 * `EngineOptions.toneThreshold` is the whole of "voice is a filter, aesthetic
 * is a rank" — it is the number that decides which destinations are still in
 * the room before anything is ranked at all. A number like that must not be
 * picked from taste, and it must not be defended from memory a year later.
 *
 * So this prints the table the comment on DEFAULT_OPTIONS quotes: for each
 * candidate threshold, how many destinations a host is left with. It reads the
 * REAL authored tone tags out of src/lib/destinations.ts and crosses them with
 * sampled host answers across the range the quiz allows (one to seven tiles).
 *
 * NO DATABASE. The tags in src/lib/destinations.ts are the reviewable copy of
 * what `world_facet` holds, and src/lib/voice.ts is the reviewable copy of
 * `voice_tone_facet` (db/007). Reading the modules keeps this runnable from a
 * laptop with nothing installed, which is the only way it actually gets re-run
 * when the library grows.
 *
 * ─────────────────────────────────────────────────────────────────────
 * HOW TO READ IT, AND THE THREE PROPERTIES THAT DECIDED 0.20
 *
 *   1. IT MUST ACTUALLY CUT. A bar nothing fails is a bar in name only, and
 *      "voice wins" becomes a sentence in a comment.
 *   2. THE SHORTLIST MUST SURVIVE IT. The curator is shown three candidates and
 *      the dither is what stops two similar customers getting the same Revelle.
 *      With fewer than three survivors the engine reuses one and she is
 *      choosing between a thing and itself, so watch the "three+" column.
 *   3. THE FALLBACK MUST BE EXCEPTIONAL. A hard clash is first a catalogue gap;
 *      if the "none" column is not near zero, the engine is taking the
 *      exceptional path routinely and the tier is theatre.
 *
 * REFIT WHEN THE LIBRARY GROWS. The right number is a property of how densely
 * the catalogue covers the voice space, not a constant of nature.
 */
import { DESTINATION_TONES } from "../src/lib/destinations.ts";
import { TONES, taggedToneProfile, toneProfile, voiceAffinity } from "../src/lib/voice.ts";

const THRESHOLDS = [0, 0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5];
const SAMPLES = 4000;

const destinations = Object.entries(DESTINATION_TONES).map(([slug, tags]) => ({
  slug,
  profile: taggedToneProfile(tags),
}));

if (destinations.length === 0) {
  console.error("[tone-threshold] no destination carries tone tags.");
  process.exit(1);
}

/**
 * A fixed sampler, so two runs of this command differ only when the CATALOGUE
 * changed. A table that moves on its own is a table nobody trusts.
 */
let state = 12345;
const random = () =>
  ((state = (state * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);

const codes = TONES.map((tone) => tone.code);
const matches = [];
for (let i = 0; i < SAMPLES; i += 1) {
  // One to seven, which is exactly what the quiz allows (src/lib/quiz.ts).
  const howMany = 1 + Math.floor(random() * 7);
  const tapped = new Set();
  while (tapped.size < howMany) {
    tapped.add(codes[Math.floor(random() * codes.length)]);
  }
  const hers = toneProfile([...tapped]);
  matches.push(destinations.map((d) => voiceAffinity(hers, d.profile)));
}

console.log(
  `[tone-threshold] ${destinations.length} destinations with authored tones, ` +
    `${SAMPLES} sampled host answers\n`
);
console.log("  bar     none    one    two   three+   median survivors");
for (const bar of THRESHOLDS) {
  const counts = matches
    .map((row) => row.filter((value) => value >= bar).length)
    .sort((a, b) => a - b);
  const share = (predicate) =>
    `${((counts.filter(predicate).length / counts.length) * 100).toFixed(1)}%`.padStart(6);
  console.log(
    `  ${bar.toFixed(2)}  ${share((c) => c === 0)} ${share((c) => c === 1)} ` +
      `${share((c) => c === 2)} ${share((c) => c >= 3)}   ` +
      `${counts[Math.floor(counts.length / 2)]}`
  );
}

// The sanity check the comment on DEFAULT_OPTIONS quotes: the founder's own
// example of a group that is not a contradiction.
const HER_EXAMPLE = [
  "sentimental",
  "all_at_once",
  "says_it_out_loud",
  "toasts",
  "laughs_first",
];
console.log(
  `\n  a warm, loud, sentimental group — the founder's own example — against ` +
    `each destination:`
);
const hers = toneProfile(HER_EXAMPLE);
for (const d of destinations
  .map((d) => ({ slug: d.slug, match: voiceAffinity(hers, d.profile) }))
  .sort((a, b) => b.match - a.match)) {
  console.log(
    `    ${d.slug.padEnd(20)} ${d.match.toFixed(3)}` +
      (d.match < 0.2 ? "   CUT" : "")
  );
}
