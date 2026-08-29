#!/usr/bin/env node
/**
 * Audit the voice space.
 *
 *   npm run check:voices              every pair, closest first
 *   npm run check:voices -- --wired   only the rooms in DESTINATIONS
 *   npm run check:voices -- --facets acapulco-1959 las-vegas
 *                                     where one pair's number comes from
 *   npm run check:voices -- --duplicates
 *                                     what a COPIED room scores, in four
 *                                     strengths — the calibration evidence for
 *                                     the two ceilings and the hand guard
 *
 * THE ONLY PLACE A VOICE AFFINITY MAY BE QUOTED FROM. `npm run check:matrix`
 * is that instrument for structural distance and this is its sibling, on the
 * same terms (CLAUDE.md rule 7): a number in a document should be reproducible
 * by running a committed script, or the matrix forks again — this time in voice
 * space, where it already half has. `docs/voices-draft/VERIFICATION.md`,
 * `docs/proposals.md` and three comment blocks in `src/lib/destinations.ts` all
 * quote affinities, every one of them measured by a throwaway run that no
 * longer exists.
 *
 * ── WHY THIS EXISTS AT ALL, WHICH IS THE POINT ───────────────────────
 *
 * A threshold gates the twin rule — condition 2, "voice affinity < 0.65" — and
 * until now NOTHING PRINTED THE DISTRIBUTION IT GATES ON. `check:matrix` echoes
 * the affinities that were hand-typed into `data/destination-matrix.json`;
 * `src/lib/voice.test.ts` computes all of them and prints exactly one, the
 * worst. So the number a ruling turns on could not be seen next to the field it
 * was set against, and the ruling that has been asked for three times this week
 * — is 0.65 still the right number — was unanswerable from the repo. That is
 * CLAUDE.md rule 15's shape one layer up: an instrument that grades without
 * anybody being able to see what it graded.
 *
 * ── WHY A SEPARATE SCRIPT AND NOT PART OF `check:matrix` ─────────────
 *
 * Folding it in was the alternative and was rejected on two counts. THE
 * POPULATIONS ARE DIFFERENT: the matrix holds eighteen rows including six rooms
 * with no voice at all, and the voice space holds fifteen authored voices
 * including three with no place in `DESTINATIONS`. One table over two different
 * sets of pairs, with half the cells blank in either direction, is a worse
 * report than two tables. AND THE DEPENDENCIES ARE DIFFERENT: `check:matrix`
 * reads one JSON file and nothing else, which is why it still runs when
 * `src/lib/destinations.ts` is mid-edit. Making the structural audit depend on
 * the voice module would take both instruments down together, and the whole
 * reason there are two instruments is that they fail independently.
 *
 * What is NOT duplicated is the distance. This script prints structural
 * distance beside every affinity, and it gets that number from
 * `src/lib/matrix.ts` — the same function `check:matrix` calls, because a split
 * ceiling applied against a distance the matrix does not hold is a verdict
 * about nothing (CLAUDE.md rule 21).
 *
 * ── WHAT THE TWO CEILINGS ARE ────────────────────────────────────────
 *
 * `voiceCeiling()` in src/lib/voice.ts, with the argument written there. Short
 * form: strict where the structural matrix cannot route two rooms apart
 * (declared twins and distance <= 2), monitor where it can. The tier is
 * printed on every row so the report never asserts a verdict without showing
 * which rule produced it.
 *
 * Both numbers were recalibrated on 2026-08-27 from round figures to
 * measurements, and a third instrument — `TONE_HAND_OVERLAP_MAX` — was added
 * because the measurement showed the cosine cannot detect a copied room once
 * the copyist restates one stated facet. `--duplicates` is that measurement and
 * it is here rather than in a note, because a threshold argued from a number no
 * committed script prints is the throwaway-run failure rule 7 exists to stop.
 *
 * Exit code is 0 even when pairs breach, exactly as `check:matrix` is. This
 * reports; `src/lib/voice.test.ts` is what goes red.
 */
import {
  VOICE_FACETS,
  destinationVoiceProfile,
  voiceAffinity,
  voiceCeiling,
  toneHandOverlap,
  VOICE_CEILING_STRICT,
  VOICE_CEILING_MONITOR,
  TONE_HAND_OVERLAP_MAX,
} from "../src/lib/voice.ts";
import {
  duplicatesOf,
  STATED_CHANGE_LABELS,
} from "../src/lib/voice-duplicates.ts";
import { matrixDistance, isDeclaredTwin, differingFacets } from "../src/lib/matrix.ts";
import {
  deliverableClaims,
  dishClaims,
  drinkClaims,
  overlapFraction,
  deliverablesVerdict,
  roomEvidence,
  DELIVERABLES_CLOSE,
  EVIDENCE_FLOORS,
} from "./deliverables.mjs";
import * as CATALOGUE from "../src/lib/destinations.ts";

const { DESTINATIONS, DESTINATION_TONES } = CATALOGUE;

/* ── WHICH ROOMS HAVE A VOICE ─────────────────────────────────────────
 *
 * NOT A HAND-WRITTEN LIST (CLAUDE.md rule 19). Two rooms are authored and
 * deliberately not registered in `DESTINATIONS` — Acapulco and Amalfi, each
 * with a block in destinations.ts saying why — and a third has just landed. A
 * reporter that could not see them would be unable to answer the only question
 * anybody is asking it, and a reporter with their slugs typed into it would be
 * wrong the next time a room is drafted.
 *
 * So they are DISCOVERED: any exported object carrying a `key` and a `voice` is
 * a destination, and the tone list beside it is the export of the same name
 * plus `_TONES`. The count is printed, because a discovery rule that silently
 * finds fewer rooms than exist is rule 24's exact failure — read the number
 * against what you expect to be in the file.
 */
function authoredRooms() {
  const rooms = [];
  for (const [name, value] of Object.entries(CATALOGUE)) {
    if (!value || typeof value !== "object" || Array.isArray(value)) continue;
    if (typeof value.key !== "string" || !value.voice) continue;
    const tones = CATALOGUE[`${name}_TONES`];
    if (!Array.isArray(tones)) {
      console.error(
        `${name} is a destination with no ${name}_TONES beside it — it has a voice ` +
          `and no tones, so it cannot be measured. Not silently skipped.`
      );
      process.exit(1);
    }
    rooms.push({
      const: name,
      key: value.key,
      wired: Object.prototype.hasOwnProperty.call(DESTINATIONS, value.key),
      profile: destinationVoiceProfile(value.voice, tones),
      voice: value.voice,
      tones,
    });
  }
  rooms.sort((a, b) => a.key.localeCompare(b.key));
  return rooms;
}

const argv = process.argv.slice(2);
const wiredOnly = argv.includes("--wired");
const duplicates = argv.includes("--duplicates");
const facetsIdx = argv.indexOf("--facets");

const ALL = authoredRooms();
const CLAIMS = deliverableClaims();
const DISHES = dishClaims();
const DRINKS = drinkClaims();

/* Rule 24, in the direction that catches a discovery rule matching too little:
 * every key in DESTINATION_TONES must have been found. */
for (const key of Object.keys(DESTINATION_TONES)) {
  if (!ALL.some((r) => r.key === key)) {
    console.error(`${key} is in DESTINATION_TONES and was not discovered. The rule is wrong.`);
    process.exit(1);
  }
}

const rooms = wiredOnly ? ALL.filter((r) => r.wired) : ALL;
const byKey = new Map(ALL.map((r) => [r.key, r]));

/* ── --facets: where ONE pair's number comes from ─────────────────────
 *
 * A single affinity is a number with no argument in it. This prints the per
 * facet contribution to the dot product, largest first, so "these two rooms
 * collide on warmth and volume and nothing else" is a thing somebody can read
 * rather than a thing somebody has to take on trust.
 */
if (facetsIdx !== -1) {
  const [ka, kb] = argv.slice(facetsIdx + 1, facetsIdx + 3);
  const a = byKey.get(ka);
  const b = byKey.get(kb);
  if (!a || !b) {
    console.error(`--facets needs two known slugs. Known: ${ALL.map((r) => r.key).join(", ")}`);
    process.exit(2);
  }
  const score = voiceAffinity(a.profile, b.profile);
  let normA = 0;
  let normB = 0;
  for (const f of VOICE_FACETS) {
    normA += (a.profile[f.code] ?? 0) ** 2;
    normB += (b.profile[f.code] ?? 0) ** 2;
  }
  const denom = Math.sqrt(normA * normB);
  const rows = VOICE_FACETS.map((f) => {
    const x = a.profile[f.code] ?? 0;
    const y = b.profile[f.code] ?? 0;
    return { facet: f.code, axis: f.axis, x, y, share: denom ? (x * y) / denom : 0 };
  })
    .filter((r) => r.x !== 0 || r.y !== 0)
    .sort((p, q) => Math.abs(q.share) - Math.abs(p.share));
  const d = matrixDistance(ka, kb);
  const c = voiceCeiling(d, isDeclaredTwin(ka, kb));
  console.log(`${ka} / ${kb}`);
  console.log(
    `affinity ${score.toFixed(3)} · structural distance ${d ?? "unrowed"} · ` +
      `${c.tier} ceiling ${c.limit} · ${score < c.limit ? "PASS" : "BREACH"}`
  );
  console.log(`differ structurally on: ${differingFacets(ka, kb).join(", ") || "(unrowed)"}\n`);
  console.log(`${"facet".padEnd(26)}${"axis".padEnd(11)}${ka.slice(0, 9).padStart(9)}${kb.slice(0, 9).padStart(11)}   share of the score`);
  for (const r of rows)
    console.log(
      `${r.facet.padEnd(26)}${r.axis.padEnd(11)}${r.x.toFixed(2).padStart(9)}${r.y.toFixed(2).padStart(11)}   ${r.share >= 0 ? " " : ""}${r.share.toFixed(3)}`
    );
  process.exit(0);
}

/* ── --duplicates: WHAT A COPIED ROOM SCORES ──────────────────────────
 *
 * The calibration evidence for both ceilings and for the hand guard, printed
 * by the committed script rather than quoted from a scratch run (rule 7). The
 * constructions come from src/lib/voice-duplicates.ts, which is also what
 * src/lib/voice.test.ts asserts against — one owner, two consumers (rule 21).
 *
 * READ THE FOUR ROWS AGAINST THE AUTHORED FIELD'S MAXIMUM, which is printed
 * beneath them. Only the first population separates from it. The other three
 * overlap it completely, which is the finding the ceilings were recalibrated on
 * and the reason a cosine is not, by itself, an echo detector.
 */
if (duplicates) {
  const built = [];
  for (const r of ALL) built.push(...duplicatesOf(r.key, r.voice, r.tones));

  const authored = [];
  for (let i = 0; i < ALL.length; i++)
    for (let j = i + 1; j < ALL.length; j++)
      authored.push({
        score: voiceAffinity(ALL[i].profile, ALL[j].profile),
        hand: toneHandOverlap(ALL[i].tones, ALL[j].tones),
        pair: `${ALL[i].key} / ${ALL[j].key}`,
      });

  const summarise = (values) => {
    const s = [...values].sort((a, b) => a - b);
    const at = (p) => s[Math.min(s.length - 1, Math.floor(p * s.length))];
    return { n: s.length, min: s[0], p10: at(0.1), med: at(0.5), max: s[s.length - 1] };
  };
  const row = (label, values) => {
    const t = summarise(values);
    console.log(
      `   ${label.padEnd(40)} n=${String(t.n).padStart(3)}   min ${t.min.toFixed(3)}` +
        `   p10 ${t.p10.toFixed(3)}   med ${t.med.toFixed(3)}   max ${t.max.toFixed(3)}`
    );
  };

  console.log(
    `${ALL.length} authored rooms copied ${built.length} ways ` +
      `(each room's own hand, 0-2 tones dropped, weights jittered by 0/0.1/0.2,\n` +
      `and the three stated facets restated 0, 1, 2 or 3 at a time).\n`
  );

  console.log(`VOICE AFFINITY OF A COPY AGAINST ITS ORIGINAL`);
  for (const changes of [0, 1, 2, 3]) {
    const set = built.filter((d) => d.changes === changes);
    row(
      STATED_CHANGE_LABELS[changes],
      set.map((d) => voiceAffinity(byKey.get(d.original).profile, d.profile))
    );
  }
  const authoredScores = summarise(authored.map((a) => a.score));
  const worstAuthored = authored.reduce((b, a) => (b === null || a.score > b.score ? a : b), null);
  console.log(
    `   ${"THE AUTHORED FIELD, for comparison".padEnd(40)} n=${String(
      authoredScores.n
    ).padStart(3)}   min ${authoredScores.min.toFixed(3)}   p10 ${authoredScores.p10.toFixed(
      3
    )}   med ${authoredScores.med.toFixed(3)}   max ${authoredScores.max.toFixed(3)}`
  );
  console.log(`   authored maximum is ${worstAuthored.pair} at ${worstAuthored.score.toFixed(3)}`);
  const sameTripleFloor = Math.min(
    ...built.filter((d) => d.changes === 0).map((d) => voiceAffinity(byKey.get(d.original).profile, d.profile))
  );
  console.log(
    `\n   THE ONLY EMPTY BAND A COSINE CAN POLICE: ${authoredScores.max.toFixed(3)} (authored max) ` +
      `to ${sameTripleFloor.toFixed(3)} (same-triple copy floor).\n` +
      `   Midpoint ${((authoredScores.max + sameTripleFloor) / 2).toFixed(3)}. ` +
      `VOICE_CEILING_MONITOR is ${VOICE_CEILING_MONITOR}.\n` +
      `   Every other population above OVERLAPS the authored field, so no threshold\n` +
      `   separates them and none is pretended to.`
  );

  console.log(`\nTONE-HAND OVERLAP OF A COPY AGAINST ITS ORIGINAL`);
  for (const changes of [0, 1, 2, 3]) {
    const set = built.filter((d) => d.changes === changes);
    row(
      STATED_CHANGE_LABELS[changes],
      set.map((d) => toneHandOverlap(byKey.get(d.original).tones, d.tones))
    );
  }
  const authoredHands = summarise(authored.map((a) => a.hand));
  const worstHand = authored.reduce((b, a) => (b === null || a.hand > b.hand ? a : b), null);
  console.log(
    `   ${"THE AUTHORED FIELD, for comparison".padEnd(40)} n=${String(
      authoredHands.n
    ).padStart(3)}   min ${authoredHands.min.toFixed(3)}   p10 ${authoredHands.p10.toFixed(
      3
    )}   med ${authoredHands.med.toFixed(3)}   max ${authoredHands.max.toFixed(3)}`
  );
  console.log(
    `   authored maximum is ${worstHand.pair} at ${worstHand.hand.toFixed(3)}; ` +
      `${authored.filter((a) => a.hand === 0).length} of ${authored.length} pairs share not one code.`
  );
  console.log(
    `\n   THE SECOND EMPTY BAND: ${authoredHands.max.toFixed(3)} (authored max) to 1.000 ` +
      `(every copy, at every strength).\n` +
      `   TONE_HAND_OVERLAP_MAX is ${TONE_HAND_OVERLAP_MAX}. This is the instrument that\n` +
      `   fires on all four populations, and it is exact where the cosine is blurry\n` +
      `   because copying a list is what an echo IS.`
  );

  /* Rule 24, and the reason this block is not just a table: COUNT WHAT EACH
   * INSTRUMENT CAUGHT. A guard nobody counted is a guard nobody has checked. */
  const caught = (pred) => built.filter(pred).length;
  const affOf = (d) => voiceAffinity(byKey.get(d.original).profile, d.profile);
  const handOf = (d) => toneHandOverlap(byKey.get(d.original).tones, d.tones);
  console.log(`\nWHAT EACH INSTRUMENT CATCHES, of the ${built.length} copies:`);
  console.log(
    `   the monitor ceiling (>= ${VOICE_CEILING_MONITOR})        ` +
      `${String(caught((d) => affOf(d) >= VOICE_CEILING_MONITOR)).padStart(3)}`
  );
  console.log(
    `   the OLD monitor ceiling (>= 0.8)         ` +
      `${String(caught((d) => affOf(d) >= 0.8)).padStart(3)}   [for the record — it caught more copies and refused four authored rooms to do it]`
  );
  console.log(
    `   the hand guard (> ${TONE_HAND_OVERLAP_MAX})                 ` +
      `${String(caught((d) => handOf(d) > TONE_HAND_OVERLAP_MAX)).padStart(3)}`
  );
  console.log(
    `   either of the two                        ` +
      `${String(caught((d) => affOf(d) >= VOICE_CEILING_MONITOR || handOf(d) > TONE_HAND_OVERLAP_MAX)).padStart(3)}`
  );
  process.exit(0);
}

/* ── the table ────────────────────────────────────────────────────────── */

const pairs = [];
for (let i = 0; i < rooms.length; i++)
  for (let j = i + 1; j < rooms.length; j++) {
    const a = rooms[i];
    const b = rooms[j];
    const score = voiceAffinity(a.profile, b.profile);
    const distance = matrixDistance(a.key, b.key);
    const twin = isDeclaredTwin(a.key, b.key);
    const ceiling = voiceCeiling(distance, twin);
    const toneBreaches = score >= ceiling.limit;
    const overlap = overlapFraction(a.key, b.key, CLAIMS);
    const v = deliverablesVerdict(toneBreaches, overlap);
    pairs.push({
      a,
      b,
      score,
      distance,
      twin,
      ceiling,
      toneBreaches,
      overlap,
      hand: toneHandOverlap(a.tones, b.tones),
      verdict: v.verdict,
      why: v.why,
      breach: v.verdict === "BREACH",
    });
  }
pairs.sort((x, y) => y.score - x.score);

const mark = (r) => (r.wired ? r.key : `${r.key}*`);
const scores = pairs.map((p) => p.score).sort((x, y) => x - y);
const mean = scores.reduce((s, v) => s + v, 0) / (scores.length || 1);
const median = scores.length
  ? scores.length % 2
    ? scores[(scores.length - 1) / 2]
    : (scores[scores.length / 2 - 1] + scores[scores.length / 2]) / 2
  : 0;

const wiredCount = rooms.filter((r) => r.wired).length;
console.log(
  `${rooms.length} voiced rooms (${wiredCount} wired, ${rooms.length - wiredCount} authored and ` +
    `not in DESTINATIONS, marked *) · ${pairs.length} pairs`
);
console.log(
  `ceilings: strict ${VOICE_CEILING_STRICT} at declared twins and structural distance <= 2 · ` +
    `monitor ${VOICE_CEILING_MONITOR} at distance >= 3\n` +
    `hand guard: no pair may share more than ${TONE_HAND_OVERLAP_MAX} of the smaller room's ` +
    `tone codes, at any distance\n`
);

const showDeliv = (o) => (o === null ? "unknown" : o.toFixed(3));
console.log(
  `${"tone".padStart(6)}  ${"deliv".padStart(7)}  ${"dist".padStart(4)}  ` +
    `${"tier".padEnd(7)}  ${"limit".padStart(5)}  ${"verdict".padEnd(8)}  pair`
);
for (const p of pairs)
  console.log(
    `${p.score.toFixed(3).padStart(6)}  ${showDeliv(p.overlap).padStart(7)}  ` +
      `${String(p.distance ?? "—").padStart(4)}  ` +
      `${p.ceiling.tier.padEnd(7)}  ${p.ceiling.limit.toFixed(2).padStart(5)}  ` +
      `${p.verdict.padEnd(8)}  ${mark(p.a)} / ${mark(p.b)}` +
      `${p.twin ? "   [declared twin]" : ""}`
  );

/* ── the distribution, which is the thing that was missing ───────────── */

const sd = Math.sqrt(
  scores.reduce((s, v) => s + (v - mean) ** 2, 0) / (scores.length || 1)
);
const pct = (p) => scores[Math.min(scores.length - 1, Math.floor(p * scores.length))] ?? 0;
console.log(`\nDISTRIBUTION`);
console.log(
  `   min ${scores[0]?.toFixed(3)} · median ${median.toFixed(3)} · mean ${mean.toFixed(3)} · ` +
    `max ${scores[scores.length - 1]?.toFixed(3)}`
);
// The spread, because both ceilings are now argued against it and a threshold
// quoted against a field whose width nobody printed is the same defect as a
// threshold quoted from a scratch run.
console.log(
  `   sd ${sd.toFixed(3)} · p90 ${pct(0.9).toFixed(3)} · p95 ${pct(0.95).toFixed(3)} · ` +
    `mean+2sd ${(mean + 2 * sd).toFixed(3)} · mean+3sd ${(mean + 3 * sd).toFixed(3)}`
);
const buckets = new Array(11).fill(0);
for (const s of scores) buckets[Math.max(0, Math.min(10, Math.floor(((s + 1) / 2) * 10)))]++;
for (let i = 0; i < 11; i++) {
  const lo = -1 + i * 0.2;
  if (!buckets[i] && lo < 0) continue;
  console.log(
    `   ${lo.toFixed(1).padStart(4)} to ${(lo + 0.2).toFixed(1).padStart(4)}  ` +
      `${String(buckets[i]).padStart(3)}  ${"#".repeat(buckets[i])}`
  );
}

/* ── THE SECOND NUMBER (CLAUDE.md rule 26) ────────────────────────────
 *
 * Printed as its own block rather than only as a column, because the rule has
 * two halves and the second is a RECORDING duty: a pair admitted on
 * deliverables-disjointness must be visible as such, so a later reader can see
 * which verdicts rested on the second number rather than the first.
 *
 * And the coverage is stated before any of it, because rule 26's trap is that
 * `unknown` reads as `disjoint` from the outside. If most of the field is
 * unknown then most of this block is an absence of evidence and must not be
 * mistaken for evidence of absence.
 */

const measurable = pairs.filter((p) => p.overlap !== null);
const unknown = pairs.filter((p) => p.overlap === null);
const ovs = measurable.map((p) => p.overlap).sort((x, y) => x - y);
console.log(`\nDELIVERABLES (shared dishes and drinks, as a fraction of the smaller pool)`);
console.log(
  `   FLOORS ARE PER DECLARED FOOD IDENTITY (CLAUDE.md rule 30): ` +
    Object.entries(EVIDENCE_FLOORS)
      .map(([k, v]) => `${k} ${v}`)
      .join(" · ") +
    `.\n   The room declares in src/lib/food-identity.ts; the floor enforces in ` +
    `scripts/deliverables.mjs.\n   A table room at 14 is SHORT where an incidental room ` +
    `at 7 is COMPLETE, and one number cannot say that.`
);

/* ── EVERY ROOM AGAINST ITS OWN FLOOR ────────────────────────────────
 *
 * Rule 24, and the reason this is a table rather than a sentence: the only
 * honest way to report a per-identity floor is per room, because the same
 * count means different things at two rooms. Printing "two rooms are under
 * twelve" was true and useless — it named Palm Springs and St. Moritz as
 * defects when both of them REFUSE a seated meal in the founder's own sheets.
 *
 * `roomEvidence` throws for a room that has not declared, and it is not
 * caught: a reporter that skipped an undeclared room would be the silent
 * default the ruling forbids, printing a clean table with a hole in it. */
const evidence = rooms.map((r) => roomEvidence(r.key, CLAIMS));
const shortRooms = evidence.filter((e) => e.short);
console.log(`\n   EVERY ROOM AGAINST ITS OWN FLOOR`);
console.log(
  `   room                 dish  drink  total  identity     floor  standing`
);
for (const e of [...evidence].sort((x, y) =>
  x.identity === y.identity
    ? x.size - y.size
    : x.identity.localeCompare(y.identity)
)) {
  const d = DISHES.get(e.slug)?.size ?? 0;
  const k = DRINKS.get(e.slug)?.size ?? 0;
  const margin = e.size - e.floor;
  console.log(
    `   ${e.slug.padEnd(20)} ${String(d).padStart(4)} ${String(k).padStart(6)} ` +
      `${String(e.size).padStart(6)}  ${e.identity.padEnd(12)} ${String(e.floor).padStart(5)}  ` +
      (e.short
        ? `SHORT by ${-margin}`
        : margin === 0
          ? `clear, exactly at it`
          : `clear (+${margin})`)
  );
}
console.log(
  `   ${evidence.length} rooms declared · ${shortRooms.length} SHORT against their own identity` +
    (shortRooms.length
      ? `: ${shortRooms.map((e) => `${e.slug} (${e.size}/${e.floor}, ${e.identity})`).join(", ")}`
      : ` — every room clears the floor it claims`)
);

/* ── WHAT EACH FLOOR ACTUALLY REFUSES (rule 22's second guard) ────────
 *
 * "A detector for a gate that prunes zero rows across the whole catalogue."
 * Three floors replaced one, and a floor that refuses nothing is inert — it
 * may still be the right number, but the report must not let it look like it
 * is working. So each floor is counted separately, in pairs, which is the unit
 * the measure actually produces. */
const gatedBy = {};
for (const identity of Object.keys(EVIDENCE_FLOORS)) gatedBy[identity] = 0;
for (const p of unknown) {
  for (const e of [roomEvidence(p.a.key, CLAIMS), roomEvidence(p.b.key, CLAIMS)])
    if (e.short) gatedBy[e.identity]++;
}
console.log(`\n   WHAT EACH FLOOR REFUSES, IN PAIRS`);
for (const [identity, floor] of Object.entries(EVIDENCE_FLOORS))
  console.log(
    `   ${identity.padEnd(12)} ${String(floor).padStart(3)}   ` +
      `${String(gatedBy[identity]).padStart(3)} pair-sides refused   ` +
      `(${evidence.filter((e) => e.identity === identity).length} rooms declared it)`
  );
if (Object.values(gatedBy).every((n) => n === 0))
  console.log(
    `   *** NO FLOOR REFUSES A PAIR TODAY. Every room clears its own number, so all\n` +
      `   ${pairs.length} pairs are measurable and the three floors prune nothing —\n` +
      `   CLAUDE.md rule 22's second guard, reported rather than shipped quietly.\n` +
      `   The floors are not therefore wrong: the one thing they still refuse is a room\n` +
      `   with NO declaration, which throws rather than defaulting to the old twelve. ***`
  );
console.log(
  `\n   ${measurable.length} of ${pairs.length} pairs measurable · ${unknown.length} UNKNOWN ` +
    `(a room under the floor its own declared identity owes)`
);
if (ovs.length)
  console.log(
    `   measurable range: min ${ovs[0].toFixed(3)} · median ${ovs[
      Math.floor(ovs.length / 2)
    ].toFixed(3)} · max ${ovs[ovs.length - 1].toFixed(3)}`
  );
const observedMax = ovs.length ? ovs[ovs.length - 1] : 0;
if (observedMax < DELIVERABLES_CLOSE)
  console.log(
    `   *** THE CLOSE THRESHOLD (${DELIVERABLES_CLOSE}) IS ABOVE THE OBSERVED MAXIMUM ` +
      `(${observedMax.toFixed(3)}). ***\n` +
      `   On this catalogue the deliverables gate classifies every measurable pair as\n` +
      `   disjoint, so it prunes nothing — CLAUDE.md rule 22's second guard, reported\n` +
      `   rather than shipped quietly. The threshold is FOUNDER-PENDING and is not\n` +
      `   tuned down to fit, because the pairs it exists to judge are the unmeasurable\n` +
      `   ones. See the argument in scripts/deliverables.mjs.`
  );

const admitted = pairs.filter((p) => p.verdict === "admitted");
console.log(
  `\nADMITTED ON THE SECOND NUMBER: ${admitted.length}` +
    (admitted.length ? "" : " — none. No pair is currently tone-close AND measurable.")
);
for (const p of admitted)
  console.log(`   tone ${p.score.toFixed(3)} · deliv ${p.overlap.toFixed(3)}  ${mark(p.a)} / ${mark(p.b)}   [${p.why}]`);

const blockedUnknown = pairs.filter((p) => p.toneBreaches && p.overlap === null);
console.log(
  `\nTONE-CLOSE AND UNMEASURABLE: ${blockedUnknown.length} — NOT admitted. Absence is not disjointness.`
);
for (const p of blockedUnknown)
  console.log(
    `   tone ${p.score.toFixed(3)} · deliv unknown  ${mark(p.a)} / ${mark(p.b)}   ` +
      `[${(CLAIMS.get(p.a.key)?.size ?? 0)} and ${(CLAIMS.get(p.b.key)?.size ?? 0)} authored claims]`
  );

/* ── THE HAND GUARD (src/lib/voice.ts, TONE_HAND_OVERLAP_MAX) ─────────
 *
 * Reported beside the cosine rather than only in the test, because the two
 * numbers answer different questions and a reader looking at a high affinity
 * needs the other one in the same breath. Affinity says SAME TEMPERAMENT. This
 * says THE LIST WAS COPIED. A pair can be high on one and zero on the other —
 * Havana and Oaxaca share not a single tone code and still sit at 0.730 — and
 * that combination is a kinship, which is exactly the verdict rule 26 asks for.
 */

const handSorted = [...pairs].sort((x, y) => y.hand - x.hand);
const handBreaches = pairs.filter((p) => p.hand > TONE_HAND_OVERLAP_MAX);
console.log(
  `\nTONE-HAND OVERLAP (shared codes over the smaller hand; guard ${TONE_HAND_OVERLAP_MAX}): ` +
    `${handBreaches.length} breach`
);
for (const p of handBreaches)
  console.log(`   ${p.hand.toFixed(3)}  ${mark(p.a)} / ${mark(p.b)}   COPIED HAND`);
console.log(
  `   ${pairs.filter((p) => p.hand === 0).length} of ${pairs.length} pairs share not one code · ` +
    `closest hands:`
);
for (const p of handSorted.slice(0, 5))
  console.log(
    `   ${p.hand.toFixed(3)}  ${mark(p.a)} / ${mark(p.b)}   ` +
      `[tone ${p.score.toFixed(3)}, ${p.ceiling.tier}]`
  );
console.log(
  `   Run \`npm run check:voices -- --duplicates\` for the population this is calibrated against.`
);

/* ── the verdicts, per tier, because they are different claims ────────── */

const strict = pairs.filter((p) => p.ceiling.tier === "strict");
const monitor = pairs.filter((p) => p.ceiling.tier === "monitor");
console.log(
  `\nSTRICT TIER (${strict.length} pairs — the tiebreak has to work here): ` +
    `${strict.filter((p) => p.breach).length} breach`
);
for (const p of strict.filter((x) => x.breach))
  console.log(`   ${p.score.toFixed(3)}  ${mark(p.a)} / ${mark(p.b)}   [${p.ceiling.why}]`);
console.log(
  `MONITOR TIER (${monitor.length} pairs — routing already decided): ` +
    `${monitor.filter((p) => p.breach).length} breach`
);
for (const p of monitor.filter((x) => x.breach))
  console.log(`   ${p.score.toFixed(3)}  ${mark(p.a)} / ${mark(p.b)}   [${p.ceiling.why}]`);

/* ── what the flat 0.65 would have said, so the split is legible ──────── */

const flatBreaches = pairs.filter((p) => p.score >= VOICE_CEILING_STRICT);
const changed = flatBreaches.filter((p) => !p.breach);
console.log(
  `\nUNDER A FLAT ${VOICE_CEILING_STRICT} the same field breaches ${flatBreaches.length} times. ` +
    `${changed.length} of those change verdict under the split:`
);
for (const p of changed)
  console.log(
    `   ${p.score.toFixed(3)}  ${mark(p.a)} / ${mark(p.b)}   BREACH -> ok   [${p.ceiling.why}]`
  );

/* ── the walls that are supposed to hold, named rather than assumed ───── */

console.log(`\nCLOSEST PAIR PER ROOM (a room's nearest neighbour is what echo-authoring looks like):`);
for (const r of rooms) {
  const near = pairs
    .filter((p) => p.a === r || p.b === r)
    .reduce((best, p) => (best === null || p.score > best.score ? p : best), null);
  if (!near) continue;
  const other = near.a === r ? near.b : near.a;
  console.log(
    `   ${near.score.toFixed(3)}  ${mark(r).padEnd(19)} -> ${mark(other).padEnd(19)} ` +
      `[dist ${near.distance ?? "—"}, ${near.ceiling.tier}, ${near.breach ? "BREACH" : "ok"}]`
  );
}
