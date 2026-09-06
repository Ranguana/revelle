#!/usr/bin/env node
/**
 * Audit the structural matrix.
 *
 *   npm run check:matrix
 *
 * THE ONLY PLACE A FAILURE LIST MAY COME FROM. Every distance quoted in a
 * document or a commit message should be reproducible by running this, so that
 * a number in prose can be diffed against a number in a file. Failure lists
 * quoted from a scratch script are how the matrix forked the first time.
 *
 * THE GATE IS 3. Two destinations must differ on at least three facets.
 *
 * WHY THREE, SAID CORRECTLY. This comment used to read "the coding bound that
 * lets one wrong quiz answer still land the host correctly (d >= 2t+1 with
 * t=1)", and that sentence describes a DIFFERENT INSTRUMENT. A host's mistap is
 * scored by `src/lib/selection/structure.ts`, which is asymmetric, has a NEAR
 * band, and compares her answers to a room; this file's distance is row-vs-row,
 * symmetric and all-or-nothing per cell, and the gate governs it whether or not
 * anybody ever taps anything. Kept rather than deleted (rule 14) because the
 * error is easy to re-derive: both are "distance", and only one of them has a
 * host in it.
 *
 * Three is a DESIGNED minimum in the BCH sense — a law chosen so that one
 * substitution cannot turn Portofino into Cote d'Azur without a declared seam.
 * It is not a decoder and there are no parity bits. `docs/room-structure.md`
 * refuses Reed-Solomon, BCH and a tenth facet by name; puncturing one column
 * for the fingerprint-drop below is the only coding operation this house does.
 *
 * Below the gate the two rooms are either one room written twice — fold
 * one in, as CAP FERRAT was — or the facet set is blind to a real difference,
 * in which case add the facet. The test that tells them apart: CAN YOU STATE
 * THE DIFFERENCE IN ONE SENTENCE A HOST COULD ANSWER? Yes means add a facet.
 * No means merge.
 *
 * Exit code is 0 even when pairs fail. This reports; it does not gate a deploy,
 * because a failing pair is an authoring decision and not a broken build.
 */
import { readFileSync } from "node:fs";
// THE DISTANCE IS NOT COMPUTED HERE ANY MORE. It used to be, and that was right
// while this was the only surface that quoted one. `npm run check:voices` and
// src/lib/voice.test.ts now both print or gate on the same number, and three
// copies of a Hamming loop is CLAUDE.md rule 21's exact defect — the failure
// being that all three look right and two of them mean something slightly
// different. src/lib/matrix.ts owns it; this script is a consumer.
import {
  MATRIX_FACETS,
  MATRIX_KEYS,
  matrixCellErrors,
  matrixDistance,
  differingFacets,
  pairKey,
  // The derived readings, per docs/room-structure.md steps 5-8. Owned by
  // matrix.ts rather than computed here, because she has committed the house to
  // a second consumer in writing: "a server action reads the same JSON as
  // check:matrix". Two implementations of "is this corner crowded" is rule 21's
  // exact defect.
  neighbours,
  ballB2,
  gateShell,
  loadBearingCells,
  fingerprintDrop,
  sameKind,
  sameKindAtGate,
  kindOf,
  isAuthored,
  KIND_MASK,
} from "../src/lib/matrix.ts";

const M = JSON.parse(readFileSync(new URL("../data/destination-matrix.json", import.meta.url), "utf8"));
const FACETS = MATRIX_FACETS;
const keys = MATRIX_KEYS;
const arg = process.argv[2];

// Every cell must be a declared level. A typo is otherwise a silent extra
// distance, which flatters every pair it touches.
const cellErrors = matrixCellErrors();
for (const e of cellErrors) console.error(e);
if (cellErrors.length) { console.error(`\n${cellErrors.length} invalid cell(s) — fix before trusting any distance below.`); process.exit(1); }

const dist = (a, b) => matrixDistance(a, b);
const differing = (a, b) => differingFacets(a, b);

const pairs = [];
for (let i = 0; i < keys.length; i++)
  for (let j = i + 1; j < keys.length; j++)
    pairs.push({ a: keys[i], b: keys[j], d: dist(keys[i], keys[j]) });
pairs.sort((x, y) => x.d - y.d);

// THE TWIN RULE. A declared pair may sit below the gate; an undeclared one may
// not. Enforced here rather than trusted, because "we agreed that pair is fine"
// is exactly the kind of thing that stops being written down.
const twinKey = pairKey;
const declared = new Map((M.twinRule?.declared ?? []).map((t) => [twinKey(...t.pair), t]));
const twinOf = {};
for (const t of M.twinRule?.declared ?? []) {
  const [a, b] = t.pair;
  if (twinOf[a] || twinOf[b]) console.error(`TWIN VIOLATION: ${twinOf[a] ? a : b} is declared in two twin pairs. One twin per room.`);
  twinOf[a] = b; twinOf[b] = a;
}

const belowGate = pairs.filter((p) => p.d < M.gate);
const excused = belowGate.filter((p) => declared.has(twinKey(p.a, p.b)));
const failing = belowGate.filter((p) => !declared.has(twinKey(p.a, p.b)));

// A room with two sub-gate partners is a crowded corner, not a pair, and may
// not twin with either. Check the declarations against that.
for (const [key, t] of declared) {
  const [a, b] = t.pair;
  for (const k of [a, b]) {
    const partners = keys.filter((o) => o !== k && dist(k, o) < M.gate);
    if (partners.length > 1)
      console.error(`TWIN VIOLATION: ${k} sits below the gate against ${partners.length} rooms (${partners.join(", ")}). One twin per room — it may twin with none of them.`);
  }
  if (t.d === 0) console.error(`TWIN VIOLATION: ${key} is at distance 0. That is one room written twice, not a twin.`);
}
const zero = pairs.filter((p) => p.d === M.gate);
const mean = pairs.reduce((s, p) => s + p.d, 0) / pairs.length;

console.log(`${keys.length} destinations · ${pairs.length} pairs · gate ${M.gate}`);
console.log(`${M.authored.length} authored, ${M.proposed.length} proposed\n`);

if (excused.length) {
  console.log(`DECLARED TWINS (below the gate, allowed): ${excused.length}`);
  for (const p of excused) {
    const t = declared.get(twinKey(p.a, p.b));
    const v = t.voiceAffinity == null ? "voice affinity UNMEASURABLE — a voice is unwritten" : `voice affinity ${t.voiceAffinity}`;
    console.log(`   ${p.d}  ${p.a} / ${p.b}   [${v}]`);
  }
  console.log("");
}

console.log(`FAILING (below the gate, undeclared): ${failing.length}`);
for (const p of failing) console.log(`   ${p.d}  ${p.a} / ${p.b}   [differ only on: ${differing(p.a, p.b).join(", ")}]`);

console.log(`\nZERO MARGIN (exactly ${M.gate}): ${zero.length}`);
for (const p of zero) console.log(`   ${p.d}  ${p.a} / ${p.b}`);

console.log(`\nmean distance ${mean.toFixed(2)}`);

// Which facets are carrying the load, and which are nearly free-riding.
console.log(`\nDISCRIMINATION (pairs separated, of ${pairs.length}):`);
FACETS.map((f, i) => {
  let n = 0, marginal = 0;
  for (let a = 0; a < keys.length; a++) for (let b = a + 1; b < keys.length; b++) {
    if (M.rows[keys[a]][i] !== M.rows[keys[b]][i]) {
      n++;
      if (dist(keys[a], keys[b]) - 1 < M.gate) marginal++;
    }
  }
  return { f, n, marginal };
}).sort((x, y) => y.n - x.n)
  .forEach(({ f, n, marginal }) => console.log(`   ${String(n).padStart(3)}  ${f.padEnd(17)} (${marginal} pairs would drop below the gate without it)`));

// Levels declared but claimed by nobody, and levels claimed by exactly one room.
console.log(`\nLEVEL USE:`);
FACETS.forEach((f, i) => {
  const counts = {};
  for (const k of keys) counts[M.rows[k][i]] = (counts[M.rows[k][i]] || 0) + 1;
  for (const lvl of M.facets[f]) {
    const c = counts[lvl] || 0;
    if (c === 0) console.log(`   DEAD        ${f}.${lvl} — declared, claimed by nobody`);
    else if (c === 1) console.log(`   FINGERPRINT ${f}.${lvl} — ${keys.find((k) => M.rows[k][i] === lvl)} alone; one tap names the room`);
  }
});

if (M.founderPending && Object.keys(M.founderPending).length) {
  console.log(`\nPROVISIONAL — not the founder's, and every distance touching them is soft:`);
  for (const [cell, why] of Object.entries(M.founderPending)) console.log(`   ${cell}: ${why}`);
}
// ── SAME-KIND AT THE GATE, over the whole catalogue ──────────────────
//
// "Eligibility is not separation in use." A pair AT the gate that is also the
// same KIND of evening — same arrival, dress, food and ending — sits at the
// floor of the design and reads alike, and the ranker can still hand a member
// both. Printed for every row rather than on request, because the pairs that
// need saying are exactly the ones nobody thought to ask about.
//
// NOT A SECOND GATE, by her explicit instruction. It reports and refuses
// nothing.
const kindPairs = [];
for (const p of pairs)
  if (p.d <= M.gate && sameKind(p.a, p.b)) kindPairs.push(p);
console.log(`\nSAME-KIND AT OR INSIDE THE GATE (mask: ${KIND_MASK.join(", ")}): ${kindPairs.length}`);
if (!kindPairs.length)
  console.log(`   none — no pair at ${M.gate} or below shares all four masked cells`);
for (const p of kindPairs)
  console.log(`   ${p.d}  ${p.a} / ${p.b}   [${kindOf(p.a)}]`);

// ── PER-ROW OCCUPANCY, compact, for every row ────────────────────────
//
// docs/room-structure.md asks the audit to emit B2, the d=3 shell, load-bearing
// cells and a fingerprint-drop line FOR EACH ROW. Nineteen full blocks is not
// readable, so the catalogue view is one line per room and `--room <slug>` is
// the full block. Both come from the same functions.
console.log(`\nPER ROW — B2 (under the gate) · shell (at the gate) · load-bearing cells`);
console.log(`   ${"room".padEnd(19)}${"B2".padStart(3)} ${"shell".padStart(6)}  load-bearing`);
for (const k of keys) {
  const b2 = ballB2(k);
  const shell = gateShell(k);
  const lb = [...loadBearingCells(k).keys()];
  const flag = b2.length >= 2 ? "  CROWDED CORNER" : b2.length === 1 ? "  twin candidate" : "";
  console.log(
    `   ${k.padEnd(19)}${String(b2.length).padStart(3)} ${String(shell.length).padStart(6)}  ` +
      (lb.length ? lb.join(", ") : "none") +
      flag
  );
}

// ── ONE ROOM, IN FULL ────────────────────────────────────────────────
//
// A full pair list stops being readable long before the catalogue stops
// growing: 171 lines at nineteen rooms, 19,900 at two hundred, and the question
// an author actually asks — "what is my row's nearest neighbour, and what holds
// it up?" — would be unanswerable from the output of the only instrument
// allowed to answer it (rule 7).
//
// EVERY ROW IS PRINTED, including the far ones. "No others >= 6": which
// neighbours feel far is precisely the judgement a sampled table gets wrong,
// and Hong Kong's first draft sampled Havana out of its own table.
//
//   npm run check:matrix -- --room tokyo-1964
if (arg === "--room") {
  const room = process.argv[3];
  if (!M.rows[room]) {
    console.error(`\nNo row for "${room}". Rows: ${keys.join(", ")}`);
    process.exit(1);
  }
  const ns = neighbours(room);
  const min = ns[0].d;

  console.log(`\n${room} — ${isAuthored(room) ? "AUTHORED" : "NOT SIGNED (draft or proposed)"}`);
  console.log(`   row  ${M.rows[room].join(" · ")}`);
  console.log(`   kind ${kindOf(room)}   [mask: ${KIND_MASK.join(", ")}]`);

  console.log(`\n0b. DISTANCE TO EVERY OTHER ROW (gate ${M.gate})`);
  for (const n of ns) {
    const tags = [];
    if (n.d < M.gate) tags.push(declared.has(twinKey(room, n.key)) ? "declared twin" : "FAILS THE GATE");
    if (n.d === M.gate) tags.push("at the gate");
    if (sameKind(room, n.key) && n.d <= M.gate) tags.push("SAME KIND");
    if (!n.authored) tags.push("not signed");
    console.log(
      `   ${n.d}  ${n.key.padEnd(19)} ${differingFacets(room, n.key).join(", ")}` +
        (tags.length ? `   [${tags.join(" · ")}]` : "")
    );
  }
  console.log(
    `\n   nearest ${min} (${ns.filter((n) => n.d === min).map((n) => n.key).join(", ")}) · ` +
      `mean ${(ns.reduce((s, n) => s + n.d, 0) / ns.length).toFixed(2)}`
  );

  // B2 and the shell, kept apart on purpose. Three is legal; the shell is
  // load-bearing, not collision.
  const b2 = ballB2(room);
  const shell = gateShell(room);
  console.log(`\n0b-ball. B2 — OCCUPANTS UNDER THE GATE (d <= 2): ${b2.length}`);
  if (!b2.length) console.log(`   empty — eligible on structure, no twin needed`);
  for (const n of b2) console.log(`   ${n.d}  ${n.key}${n.authored ? "" : "   [not signed]"}`);
  if (b2.length === 1) console.log(`   ONE OCCUPANT — twin CANDIDATE. Then the four conditions. Propose; do not declare.`);
  if (b2.length >= 2) console.log(`   CROWDED CORNER — change a cell or kill the snapshot. Rio is the proof.`);

  console.log(`\n   d = ${M.gate} SHELL (legal, and load-bearing): ${shell.length}`);
  for (const n of shell)
    console.log(`   ${n.d}  ${n.key}${sameKind(room, n.key) ? "   SAME KIND" : ""}`);

  const lb = loadBearingCells(room);
  console.log(`\n0b-i. LOAD-BEARING CELLS — struck to the neighbour's value, who falls`);
  if (!lb.size) console.log(`   none — no neighbour sits at the gate, so no single cell carries the row`);
  for (const [facet, who] of lb)
    console.log(`   ${facet.padEnd(11)} strike -> ${who.join(", ")} below ${M.gate}`);
  if (lb.size)
    console.log(`   Write one line per cell in the draft. A soft sentence on any of these is "legal if", which is not legal.`);

  const fp = fingerprintDrop(room);
  console.log(`\n0b-ii. FINGERPRINT-DROP`);
  if (!fp) console.log(`   none — this row holds no level that only it holds`);
  for (const f of fp ?? [])
    console.log(
      `   ${f.facet}.${f.level} (${f.why}) — min d ${f.minWith} with the column, ${f.minWithout} without.  ` +
        (f.collapses
          ? `COLLAPSES: the column is parity holding near-duplicates apart, not an evening.`
          : `holds: the row stands without it.`)
    );

  const sk = sameKindAtGate(room);
  console.log(`\n0b-iii. SAME-KIND NEIGHBOURS (d <= ${M.gate})`);
  if (!sk.length) console.log(`   none`);
  for (const n of sk) console.log(`   ${n.d}  ${n.key}   [${kindOf(room)}]`);
  console.log(`\n   Eligibility is not separation in use. This is a report, not a gate.`);
}

if (arg === "--rows") {
  console.log(`\n${"destination".padEnd(19)}${FACETS.map((f) => f.slice(0, 9).padEnd(11)).join("")}`);
  for (const k of keys) console.log(`${k.padEnd(19)}${M.rows[k].map((v) => v.slice(0, 9).padEnd(11)).join("")}`);
}
