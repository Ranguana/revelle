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
 * THE GATE IS 3. Two destinations must differ on at least three facets. Three
 * is the coding bound that lets one wrong quiz answer still land the host
 * correctly (d >= 2t+1 with t=1); at distance 1 a single misread tap flips the
 * result. Below the gate the two rooms are either one room written twice — fold
 * one in, as CAP FERRAT was — or the facet set is blind to a real difference,
 * in which case add the facet. The test that tells them apart: CAN YOU STATE
 * THE DIFFERENCE IN ONE SENTENCE A HOST COULD ANSWER? Yes means add a facet.
 * No means merge.
 *
 * Exit code is 0 even when pairs fail. This reports; it does not gate a deploy,
 * because a failing pair is an authoring decision and not a broken build.
 */
import { readFileSync } from "node:fs";

const M = JSON.parse(readFileSync(new URL("../data/destination-matrix.json", import.meta.url), "utf8"));
const FACETS = Object.keys(M.facets);
const keys = Object.keys(M.rows);
const arg = process.argv[2];

// Every cell must be a declared level. A typo is otherwise a silent extra
// distance, which flatters every pair it touches.
let bad = 0;
for (const [k, row] of Object.entries(M.rows)) {
  if (row.length !== FACETS.length) { console.error(`${k}: ${row.length} cells, expected ${FACETS.length}`); bad++; continue; }
  row.forEach((v, i) => {
    if (!M.facets[FACETS[i]].includes(v)) { console.error(`${k}.${FACETS[i]} = "${v}" is not a declared level`); bad++; }
  });
}
if (bad) { console.error(`\n${bad} invalid cell(s) — fix before trusting any distance below.`); process.exit(1); }

const dist = (a, b) => M.rows[a].reduce((n, v, i) => n + (v !== M.rows[b][i] ? 1 : 0), 0);
const differing = (a, b) => FACETS.filter((_, i) => M.rows[a][i] !== M.rows[b][i]);

const pairs = [];
for (let i = 0; i < keys.length; i++)
  for (let j = i + 1; j < keys.length; j++)
    pairs.push({ a: keys[i], b: keys[j], d: dist(keys[i], keys[j]) });
pairs.sort((x, y) => x.d - y.d);

// THE TWIN RULE. A declared pair may sit below the gate; an undeclared one may
// not. Enforced here rather than trusted, because "we agreed that pair is fine"
// is exactly the kind of thing that stops being written down.
const twinKey = (a, b) => [a, b].sort().join(" / ");
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
if (arg === "--rows") {
  console.log(`\n${"destination".padEnd(19)}${FACETS.map((f) => f.slice(0, 9).padEnd(11)).join("")}`);
  for (const k of keys) console.log(`${k.padEnd(19)}${M.rows[k].map((v) => v.slice(0, 9).padEnd(11)).join("")}`);
}
