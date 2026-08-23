#!/usr/bin/env node
/**
 * Check a piece of generated copy against a destination's voice.
 *
 *   npm run check:voice-output -- <slug> "the candidate line"
 *   echo "the candidate line" | npm run check:voice-output -- <slug>
 *
 * THE BANNED-SHAPES LAYER of the voice-layer QA described in
 * docs/proposals.md. That specification names three checks: the 26-facet
 * profile, lexicon-required, and banned. This is the third, and it is built
 * first because it is the one that needs no model and no training data — the
 * material already exists, authored, in every destination's `rejected` list.
 *
 * ── WHY THE REFUSALS ARE THE RIGHT SOURCE ────────────────────────────
 *
 * A banned WORD list catches "authentic" and misses "a night of old New York
 * glamour", which uses no banned word and is still the exact failure the house
 * refuses. The rejected examples are banned SHAPES: a line the voice will not
 * write, with the reason attached. They are the only place in the catalogue
 * where the failure mode is stated positively.
 *
 * ── WHAT THIS DOES AND DOES NOT CLAIM ────────────────────────────────
 *
 * It is lexical, not semantic. It reports three things and judges none of them
 * cleverly:
 *
 *   1. DISPLACED TERMS — every `insteadOf` word in the lexicon. These are hard
 *      bans: the house has its own word and this is the one it replaced.
 *   2. NEVER-RULE TERMS — words quoted inside a `never` rule, which is where a
 *      voice names what it will not say.
 *   3. SHAPE PROXIMITY — distinctive phrase overlap with each rejected example.
 *      A high score is not proof of anything. It is a prompt to read the
 *      refusal beside the candidate and decide, which is what the `why` on
 *      every rejected entry is for.
 *
 * A model will eventually judge shape better than this does. Until then a
 * lexical check that never lies about its confidence is worth more than a
 * clever one that does.
 */
import { readFileSync } from "node:fs";
import { DESTINATIONS } from "../src/lib/destinations.ts";

const [slug, ...rest] = process.argv.slice(2);
const dest = DESTINATIONS[slug];
if (!dest) {
  console.error(`unknown destination: ${slug || "(none given)"}`);
  console.error(`known: ${Object.keys(DESTINATIONS).join(", ")}`);
  process.exit(2);
}
let text = rest.join(" ").trim();
if (!text) { try { text = readFileSync(0, "utf8").trim(); } catch {} }
if (!text) { console.error("no text given"); process.exit(2); }

const lower = text.toLowerCase();
const words = (s) => s.toLowerCase().replace(/[^a-z' ]/g, " ").split(/\s+/).filter(Boolean);
const STOP = new Set("a an the and or of in on at to for with is are was were it its this that you your we our us".split(" "));

// 1 · displaced terms
const displaced = [];
for (const l of dest.voice.lexicon || [])
  for (const t of l.insteadOf || [])
    if (lower.includes(t.toLowerCase())) displaced.push({ term: t, use: l.term });

// 2 · never-rule terms
const neverTerms = [];
for (const rule of dest.voice.never || []) {
  const r = typeof rule === "string" ? rule : rule.text || "";
  for (const m of r.matchAll(/\b(?:no|never)\s+([a-z][a-z' -]{2,24}?)(?=[,.]|\s+and\b|\s+no\b|$)/gi)) {
    const t = m[1].trim().toLowerCase();
    if (t.length > 2 && lower.includes(t)) neverTerms.push({ term: t, rule: r.slice(0, 90) });
  }
}

// 2b · CATALOGUE-WIDE refusals
//
// Found by using this tool on real copy: a Catskills tagline reading "never too
// late to EXPERIENCE sleepaway camp" passed, because the word is refused in
// NANTUCKET's list — "a clambake is a dinner, not an experience" — and the
// check was scoped per room. But that is not a Nantucket quirk. It is a rule
// about the whole house's relationship to the word, and a per-room check reads
// a catalogue-wide refusal as somebody else's business.
//
// So a small set of terms is refused EVERYWHERE, each carried by a refusal
// somebody already wrote. Adding one means finding the rejected entry that
// argues for it — this list may not grow on taste alone.
const HOUSE_WIDE = [
  { term: "experience", why: 'NANTUCKET: "A clambake is a dinner, not an experience, and calling it authentic is the surest sign it is not."' },
  { term: "authentic",  why: 'NANTUCKET: "Three words the house bans in one line."' },
  { term: "curated",    why: "The house names the thing. A curated anything is a shop describing itself." },
  { term: "elevated",   why: "Nothing here is elevated. It is a dinner, a lunch, or a night." },
  { term: "unforgettable", why: "Promises the reader's memory back to her. The evening either is or is not." },
];
const houseWide = HOUSE_WIDE.filter((h) => new RegExp(`\\b${h.term}`, "i").test(text));

// 3 · shape proximity against every rejected example
const cand = new Set(words(text).filter((w) => !STOP.has(w)));
const near = (dest.voice.rejected || []).map((r) => {
  const other = new Set(words(r.text).filter((w) => !STOP.has(w)));
  const shared = [...cand].filter((w) => other.has(w));
  const score = other.size ? shared.length / Math.min(cand.size || 1, other.size) : 0;
  return { ...r, score, shared };
}).sort((a, b) => b.score - a.score);

console.log(`\n${dest.name}\n${"-".repeat(dest.name.length)}\n${text}\n`);
let bad = 0;

if (displaced.length) {
  bad += displaced.length;
  console.log("DISPLACED TERMS — the house has its own word:");
  for (const d of displaced) console.log(`   "${d.term}"  ->  the house says "${d.use}"`);
  console.log("");
}
if (neverTerms.length) {
  bad += neverTerms.length;
  console.log("NEVER-RULE TERMS:");
  for (const n of neverTerms) console.log(`   "${n.term}"  — ${n.rule}…`);
  console.log("");
}
if (houseWide.length) {
  bad += houseWide.length;
  console.log("HOUSE-WIDE REFUSALS — banned in every room, not just this one:");
  for (const h of houseWide) console.log(`   "${h.term}"  — ${h.why}`);
  console.log("");
}

const top = near[0];
if (top && top.score >= 0.34) {
  console.log(`SHAPE PROXIMITY — closest refusal (${(top.score * 100) | 0}% of the shorter line's distinctive words):`);
  console.log(`   refused: "${top.text}"`);
  console.log(`   because: ${top.why}`);
  console.log(`   shared:  ${top.shared.join(", ")}`);
  console.log("   Not a verdict. Read the refusal beside the candidate and decide.\n");
}
if (!bad && (!top || top.score < 0.34)) console.log("No banned shapes found. This layer is lexical — it does not certify the voice.\n");
process.exit(bad ? 1 : 0);
