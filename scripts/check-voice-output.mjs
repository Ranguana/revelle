#!/usr/bin/env node
/**
 * Check a piece of generated copy against a destination's voice.
 *
 *   npm run check:voice-output -- <slug> "the candidate line"
 *   echo "the candidate line" | npm run check:voice-output -- <slug>
 *   npm run check:voice-output -- --audit          # every room, term counts
 *   npm run check:voice-output -- --audit <slug>   # one room, term by term
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
 * It is lexical, not semantic. It reports four things and judges none of them
 * cleverly:
 *
 *   1. DISPLACED TERMS — every `insteadOf` word in the lexicon. These are hard
 *      bans: the house has its own word and this is the one it replaced.
 *   2. NEVER-RULE TERMS — words quoted inside a `never` rule, which is where a
 *      voice names what it will not say.
 *   3. BANNED WORDS — the room's own `banned` list, whose type comment reads
 *      "Words that must never appear. Checked literally, so keep them literal."
 *   4. SHAPE PROXIMITY — distinctive phrase overlap with each rejected example.
 *      A high score is not proof of anything. It is a prompt to read the
 *      refusal beside the candidate and decide, which is what the `why` on
 *      every rejected entry is for.
 *
 * A model will eventually judge shape better than this does. Until then a
 * lexical check that never lies about its confidence is worth more than a
 * clever one that does.
 *
 * ── THE NEVER-RULE EXTRACTOR, AND WHAT BEAT THE FIRST ONE ────────────
 *
 * SUPERSEDED 2026-08-28. The original extractor was one regex:
 *
 *     /\b(?:no|never)\s+([a-z][a-z' -]{2,24}?)(?=[,.]|\s+and\b|\s+no\b|$)/gi
 *
 * Its argument was that a refusal names one thing and the clause ends at the
 * next comma or full stop, so the first noun after "never" IS the refusal. That
 * argument holds for a rule written as "Never explain a joke." It fails for a
 * rule written as a list, because the comma that was supposed to END the clause
 * is the comma that SEPARATES the items — so the capture stopped at item one
 * and items two onward were read as somebody else's sentence. Nothing said
 * anything: the rule was present, the channel was populated, the check passed.
 *
 * Measured, before and after, on the room that exposed it — PALM SPRINGS, 1965,
 * whose refusal then read "Never mid-century, retro, mod, vintage, kitsch,
 * swanky or classy. The room does not describe its own decade.":
 *
 *     old extractor  1 of the 7 words in that clause fired  (`mid-century`)
 *     new extractor  7 of 7
 *
 * Across all eighteen authored rooms, counted by `--audit` (rule 24 — count
 * what it matched, do not assert that it works):
 *
 *     never-rule terms extracted, old   300
 *     never-rule terms extracted, new   386
 *     terms the `banned` channel adds   397  (see below — it was never read)
 *
 * And counted in the other direction, because a gate that matches everything
 * prunes nothing and looks identical from outside: against the 508 lines of
 * authored GOOD copy in the catalogue — every exemplar, sign-off and tagline —
 * the old pipeline fired on 7 and this one fires on the same 7, none of them
 * introduced here. Against the 117 lines the rooms themselves record as
 * REFUSED, the old pipeline fired on 49 and this one fires on 65. The other 52
 * are refused SHAPES that carry no refused word; nothing lexical will reach
 * them, and the shape-proximity report is what they are for.
 *
 * Three further blind spots closed at the same time, each found by counting:
 *
 *   · A clause ending on an em dash was not a clause ending at all. TAHITI's
 *     "No tiki, no hula, no lei, no aloha — that word belongs to a different
 *     ocean" lost `aloha`, because the old lookahead knew about commas and full
 *     stops and nothing else. Clause terminators are now the full set.
 *   · The channel was spelling-literal. "Never apres" caught `apres` and missed
 *     `après`, which ST. MORITZ had documented in its own never-list as a
 *     defect it had to work around. Both sides are now folded — NFD, combining
 *     marks stripped, curly apostrophe to straight — so the accent is invisible
 *     to matching and the workaround is no longer needed.
 *   · Matching was raw substring containment. That is survivable when every
 *     term is a phrase and lethal once lists are split into single words: `mod`
 *     would have fired inside "modern". Terms now match on word boundaries,
 *     with an optional plural or inflection, so "the venues" still trips a
 *     refusal of "the venue" and "modern" trips nothing.
 *
 * TRIED AND REJECTED, both worth not re-proposing:
 *
 *   · Stripping the leading article, so ASPEN's "Never a mountain" would fire
 *     on bare "mountain". It catches more and it authors a refusal the founder
 *     did not write.
 *   · Letting the article VARY — a/an/the interchangeable — on the argument
 *     that a room refusing "a mountain" refuses "the mountain". Measured, and
 *     it cost more than it bought: NEW YORK refuses "a year", and its own
 *     exemplar reads "Somebody will correct the year of the record." Two of the
 *     catalogue's approved lines started failing. Terms are matched verbatim.
 *
 * Both failed the same way, which is the thing to remember: a refusal the
 * founder wrote is a string she chose, and widening it is authoring.
 *
 * ── WHY `banned` IS READ HERE NOW ────────────────────────────────────
 *
 * It never was. Eighteen rooms carry a `banned` array whose own type comment
 * promises it is "checked literally", and nothing in the repository read it —
 * a word parked there alone was a refusal with no enforcement anywhere, which
 * is rule 16 exactly: the list looked honoured from every angle. It is a
 * channel now, and it is the largest one.
 *
 * The single narrowing: `experience`. It sits in almost every room's `banned`
 * list, and the founder's own Catskills tagline is "It's never too late to
 * experience sleepaway camp." A literal word ban fails the catalogue's own
 * approved line. HOUSE_WIDE already settled this on 2026-08-23 — the ban is on
 * the NOUN, not the verb — so the banned channel defers to that pattern for
 * that one word rather than re-fighting a decided argument in a weaker place.
 * This is not a weakened refusal; it is the ratified refusal, applied once.
 *
 * ── WHAT IS STILL NOT CHECKED ────────────────────────────────────────
 *
 * There is no punctuation pass. "Never an exclamation point" and "Never use
 * italics" appear in nearly every room and NEITHER IS ENFORCEABLE by this file,
 * because both name a mark rather than a word: 41 declared refusal terms across
 * the eighteen rooms, and a line with three exclamation marks in it still
 * returns "No banned shapes found." A further 83 are prose naming an ACT —
 * "Never write summer camp for grown-ups" — and fire only on that exact phrase,
 * which real copy will not contain. `--audit` prints both counts as MARK and
 * PROSE rather than folding them into a coverage number, so what this tool says
 * it enforces is what it enforces.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import * as CATALOGUE from "../src/lib/destinations.ts";

const { DESTINATIONS } = CATALOGUE;

/* ── the eighteen authored rooms ──────────────────────────────────────
 *
 * Five of them (AMALFI, ASPEN, PALM SPRINGS, OAXACA, ST. MORITZ) are authored
 * and deliberately NOT keyed into `DESTINATIONS`; the comments beside each in
 * destinations.ts say why and say exactly what a human must do to activate one.
 * This file resolves rooms by walking the module's exports instead, because a
 * refusal list that nothing can be pointed at is the same defect as a refusal
 * list nothing reads. Reaching a room here is a QA read and NOT an activation —
 * the selection engine still resolves through `DESTINATIONS` and still cannot
 * serve these five. The CLI says so, loudly, every time one is checked.
 */
export const ROOMS = Object.values(CATALOGUE)
  .filter((v) => v && typeof v === "object" && !Array.isArray(v)
    && typeof v.key === "string" && v.voice && Array.isArray(v.voice.never));
export const roomBySlug = (slug) => ROOMS.find((d) => d.key === slug);
export const isKeyed = (dest) =>
  Object.prototype.hasOwnProperty.call(DESTINATIONS, dest.key);

/* ── folding ──────────────────────────────────────────────────────────
 * Both sides of every comparison go through this. NFD splits "é" into "e" plus
 * a combining acute; stripping the marks leaves "e". Curly apostrophes are
 * folded to straight for the same reason: "girls’ night" and "girls' night" are
 * one refusal, not two.
 */
export const fold = (s) =>
  String(s).normalize("NFD").replace(/\p{M}/gu, "").replace(/[‘’]/g, "'").toLowerCase();

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Does a folded text contain this term as a word?
 *
 * Verbatim, with word boundaries at both ends and an optional plural or
 * inflection at the tail — so "the venues" trips a refusal of "the venue" and
 * "modern" trips nothing. Hand-rolled boundaries rather than \b because a term
 * may legally end in an apostrophe ("swingin'").
 */
export function termHits(foldedText, term) {
  const t = fold(term).trim();
  if (t.length < 3) return false;
  const body = escapeRe(t).replace(/\s+/g, "\\s+");
  return new RegExp(`(?<![a-z])${body}(?:s|es|ed|ing|'s)?(?![a-z])`).test(foldedText);
}

/* ── never-rule extraction ────────────────────────────────────────────*/

const CLAUSE_END = /[.;:!?()"—–“”]/;

/*
 * Closed-class words that are never a refusal on their own. ASPEN's "there is
 * no skiing in this destination and there never was" put `was` into the channel
 * as a refused word, and `was` fires on almost any sentence — a gate that
 * matches everything prunes nothing (rule 24, counted in both directions). This
 * list may only hold words that cannot be a thing a house refuses to say.
 */
const NOT_A_TERM = new Set(
  ("was were is are be been being has have had does did not but then than that " +
   "one two more again too very just even only ever any all each both such").split(" "));

const wordCount = (s) => s.trim().split(/\s+/).length;

const tidy = (s) => s
  .replace(/^\s*(?:and|or)\s+/i, "")
  .replace(/^\s*(?:no|never)\s+/i, "")
  .replace(/^[^\p{L}]+/u, "")
  .replace(/[^\p{L}'’]+$/u, "")
  .trim();

/**
 * Split one never/no clause into its listed items.
 *
 * A clause is only a LIST when its first item is a word or a short phrase. When
 * the first item is prose — four words or more — the clause is naming an ACT and
 * the commas inside it are the act's grammar, not separators. NANTUCKET taught
 * it: "Never apologise for the paper plates, the bought pie or the newspaper"
 * split into three refused nouns, and the room's own exemplar reads "The
 * newspaper on the table is the tablecloth." The newspaper is not refused;
 * apologising for it is. Measured: splitting every clause fired on 3 authored
 * good lines, splitting only lists fires on 0.
 */
function splitList(clause) {
  const raw = clause.split(/,|\s+\bor\b\s+|\s+\band\b\s+/i);
  // A repeated "no"/"never" is the author saying LIST out loud, whatever the
  // length of the first item; otherwise a long first item means prose.
  const repeated = raw.slice(1).some((p) => /^\s*(?:no|never)\b/i.test(p));
  const parts = raw.map(tidy);
  const items = !repeated && parts[0] && wordCount(parts[0]) >= 4
    ? [tidy(clause)] : parts;
  return items.filter((s) => s.length > 2 && !NOT_A_TERM.has(fold(s)));
}

/**
 * Every term a room's `never` prose refuses.
 *
 * A "no" or "never" opens a clause; the clause runs to the next sentence-level
 * mark; everything separated by a comma, an "and" or an "or" inside it is its
 * own refusal. Overlapping triggers ("no glamour, no magic") are extracted more
 * than once by design and deduplicated at the end.
 */
export function neverTerms(rules) {
  const out = new Map();
  for (const rule of rules || []) {
    const r = typeof rule === "string" ? rule : rule.text || "";
    for (const m of r.matchAll(/\b(?:no|never)\s+/gi)) {
      const rest = r.slice(m.index + m[0].length);
      const stop = rest.search(CLAUSE_END);
      for (const item of splitList(stop === -1 ? rest : rest.slice(0, stop))) {
        const key = fold(item);
        if (!out.has(key)) out.set(key, { term: item, rule: r });
      }
    }
  }
  return [...out.values()];
}

/**
 * The extractor this file used until 2026-08-28. Kept, exported and exercised
 * by the tests because rule 14 keeps a superseded argument and because the only
 * honest way to state a catch rate is to be able to re-run the thing that lost.
 * Nothing in the CLI calls it.
 */
export function neverTermsLegacy(rules) {
  const out = [];
  for (const rule of rules || []) {
    const r = typeof rule === "string" ? rule : rule.text || "";
    for (const m of r.matchAll(/\b(?:no|never)\s+([a-z][a-z' -]{2,24}?)(?=[,.]|\s+and\b|\s+no\b|$)/gi)) {
      const t = m[1].trim().toLowerCase();
      if (t.length > 2) out.push({ term: t, rule: r });
    }
  }
  return out;
}

/* ── catalogue-wide refusals ──────────────────────────────────────────
 *
 * Found by using this tool on real copy: a Catskills tagline reading "never too
 * late to EXPERIENCE sleepaway camp" passed, because the word is refused in
 * NANTUCKET's list — "a clambake is a dinner, not an experience" — and the
 * check was scoped per room. But that is not a Nantucket quirk. It is a rule
 * about the whole house's relationship to the word, and a per-room check reads
 * a catalogue-wide refusal as somebody else's business.
 *
 * So a small set of terms is refused EVERYWHERE, each carried by a refusal
 * somebody already wrote. Adding one means finding the rejected entry that
 * argues for it — this list may not grow on taste alone.
 */
export const HOUSE_WIDE = [
  // NARROWED 2026-08-23. The ban is on the NOUN — "a ___ experience" — which is
  // what Nantucket refuses: an event sold as a category rather than named. It
  // is NOT a ban on the verb. The founder's Catskills tagline, "It's never too
  // late to experience sleepaway camp", uses it as a verb and is correct, and a
  // rule the catalogue itself violates is a wrong rule rather than an exception
  // to make. Matches "an experience", "the experience", "X experience".
  { pattern: /\b(?:an?|the)\s+\w*\s*experience\b|\bexperiences?\b(?=\s*[.,])/i,
    term: "experience (as a noun)",
    why: 'NANTUCKET: "A clambake is a dinner, not an experience, and calling it authentic is the surest sign it is not."' },
  { term: "authentic",  why: 'NANTUCKET: "Three words the house bans in one line."' },
  { term: "curated",    why: "The house names the thing. A curated anything is a shop describing itself." },
  { term: "elevated",   why: "Nothing here is elevated. It is a dinner, a lunch, or a night." },
  { term: "unforgettable", why: "Promises the reader's memory back to her. The evening either is or is not." },
];

/** The one HOUSE_WIDE entry the `banned` channel defers to. See the header. */
const EXPERIENCE = HOUSE_WIDE[0];

/* ── the check ────────────────────────────────────────────────────────*/

const words = (s) => fold(s).replace(/[^a-z' ]/g, " ").split(/\s+/).filter(Boolean);
const STOP = new Set("a an the and or of in on at to for with is are was were it its this that you your we our us".split(" "));

export function checkVoiceOutput(dest, text) {
  const folded = fold(text);

  const displaced = [];
  for (const l of dest.voice.lexicon || [])
    for (const t of l.insteadOf || [])
      if (termHits(folded, t)) displaced.push({ term: t, use: l.term });

  const never = neverTerms(dest.voice.never).filter((n) => termHits(folded, n.term));

  const houseWide = HOUSE_WIDE.filter((h) =>
    h.pattern ? h.pattern.test(folded) : new RegExp(`\\b${h.term}`, "i").test(folded));

  // Anything already named by a louder channel is not repeated here.
  const said = new Set([
    ...displaced.map((d) => fold(d.term)),
    ...never.map((n) => fold(n.term)),
    ...houseWide.map((h) => fold(h.term)),
  ]);
  const banned = [];
  for (const b of dest.voice.banned || []) {
    const hit = fold(b) === "experience" ? EXPERIENCE.pattern.test(folded) : termHits(folded, b);
    if (hit && !said.has(fold(b))) { banned.push(b); said.add(fold(b)); }
  }

  const cand = new Set(words(text).filter((w) => !STOP.has(w)));
  const near = (dest.voice.rejected || []).map((r) => {
    const other = new Set(words(r.text).filter((w) => !STOP.has(w)));
    const shared = [...cand].filter((w) => other.has(w));
    const score = other.size ? shared.length / Math.min(cand.size || 1, other.size) : 0;
    return { ...r, score, shared };
  }).sort((a, b) => b.score - a.score);

  return {
    displaced, never, banned, houseWide, near,
    bad: displaced.length + never.length + banned.length + houseWide.length,
  };
}

/* ── auditing what is declared against what can fire ──────────────────
 *
 * A term is classified by SHAPE, not by asking whether it matches itself —
 * feeding a term to the checker as its own candidate line proves only that a
 * string contains itself, which is the kind of measurement rule 24 exists to
 * forbid.
 *
 *   WORD   a word or short phrase real copy could contain. Enforceable.
 *   PROSE  four or more words naming an ACT — "write summer camp for grown-ups".
 *          Fires only on that exact phrase, which real copy will not contain.
 *   MARK   names a punctuation mark or a typographic habit. NOTHING here can
 *          enforce it; there is no punctuation pass and this file does not
 *          pretend to be one.
 */
const MARK = /\b(?:exclamation|italics?|em-dash|ellipsis|all-caps|title case|accent|capitals?|apostrophes?|semicolons?|full stops?)\b/i;

export function termShape(term) {
  if (MARK.test(term)) return "MARK";
  return fold(term).trim().split(/\s+/).length >= 4 ? "PROSE" : "WORD";
}

/**
 * Every refusal term a room declares, by channel and shape, plus the only
 * non-circular catch rate available: how many of the room's OWN rejected
 * example lines — copy the founder wrote down as wrong — the checker fires on.
 */
export function refusalAudit(dest) {
  const declared = [
    ...(dest.voice.lexicon || []).flatMap((l) =>
      (l.insteadOf || []).map((t) => ({ channel: "insteadOf", term: t }))),
    ...neverTerms(dest.voice.never).map((n) => ({ channel: "never", term: n.term })),
    ...(dest.voice.banned || []).map((t) => ({ channel: "banned", term: t })),
  ];
  for (const d of declared) d.shape = termShape(d.term);

  const legacyNever = dedupeTerms(neverTermsLegacy(dest.voice.never));
  const refused = (dest.voice.rejected || []).map((r) => {
    const folded = fold(r.text);
    return {
      text: r.text,
      new: checkVoiceOutput(dest, r.text).bad > 0,
      old: legacyNever.some((n) => folded.includes(fold(n.term)))
        || (dest.voice.lexicon || []).some((l) =>
          (l.insteadOf || []).some((t) => folded.includes(fold(t))))
        || HOUSE_WIDE.some((h) => h.pattern
          ? h.pattern.test(r.text) : new RegExp(`\\b${h.term}`, "i").test(r.text)),
    };
  });
  return { dest, declared, legacyNever, refused };
}

function dedupeTerms(list) {
  const seen = new Map();
  for (const t of list) if (!seen.has(fold(t.term))) seen.set(fold(t.term), t);
  return [...seen.values()];
}

/* ── CLI ──────────────────────────────────────────────────────────────*/

const NOT_KEYED =
  "AUTHORED, NOT KEYED INTO `DESTINATIONS` — this room is not servable. " +
  "Checking its voice is QA, not activation.";

function runAudit(only) {
  const rooms = only ? [roomBySlug(only)].filter(Boolean) : ROOMS;
  if (!rooms.length) { console.error(`unknown destination: ${only}`); process.exit(2); }
  const t = { declared: 0, old: 0, now: 0, banned: 0, mark: 0, prose: 0, rOld: 0, rNew: 0, rAll: 0 };
  console.log("\nroom                  declared   never old->new  banned  MARK  PROSE   own refused lines caught");
  for (const dest of rooms) {
    const a = refusalAudit(dest);
    const n = (c) => a.declared.filter((d) => d.channel === c).length;
    const s = (k) => a.declared.filter((d) => d.shape === k).length;
    const rOld = a.refused.filter((r) => r.old).length;
    const rNew = a.refused.filter((r) => r.new).length;
    t.declared += a.declared.length; t.old += a.legacyNever.length; t.now += n("never");
    t.banned += n("banned"); t.mark += s("MARK"); t.prose += s("PROSE");
    t.rOld += rOld; t.rNew += rNew; t.rAll += a.refused.length;
    console.log(
      `${dest.key.padEnd(20)}  ${String(a.declared.length).padStart(8)}` +
      `   ${String(a.legacyNever.length).padStart(3)}->${String(n("never")).padEnd(4)}` +
      `  ${String(n("banned")).padStart(6)}  ${String(s("MARK")).padStart(4)}  ${String(s("PROSE")).padStart(5)}` +
      `   ${String(rOld).padStart(2)}->${rNew} of ${a.refused.length}` +
      (isKeyed(dest) ? "" : "   (not keyed)"));
    if (only) {
      for (const d of a.declared) console.log(`     ${d.shape.padEnd(5)} [${d.channel}] ${d.term}`);
      for (const r of a.refused)
        console.log(`     ${r.new ? "caught " : "MISSED "}${r.old ? "(old caught it too) " : ""}${r.text}`);
    }
  }
  console.log(
    `\n${rooms.length} rooms · ${t.declared} declared refusal terms · ` +
    `never-rule terms ${t.old} old -> ${t.now} new · ${t.banned} from banned\n` +
    `the rooms' own refused example lines caught: ${t.rOld} -> ${t.rNew} of ${t.rAll}\n` +
    `${t.mark} terms name a MARK and NOTHING here enforces them — there is no punctuation\n` +
    `pass. ${t.prose} are PROSE naming an act, and fire only on that exact phrase.\n`);
}

function runCheck(slug, text) {
  const dest = roomBySlug(slug);
  if (!dest) {
    console.error(`unknown destination: ${slug || "(none given)"}`);
    console.error(`known: ${ROOMS.map((d) => d.key).join(", ")}`);
    process.exit(2);
  }
  const r = checkVoiceOutput(dest, text);
  console.log(`\n${dest.name}\n${"-".repeat(dest.name.length)}`);
  if (!isKeyed(dest)) console.log(`${NOT_KEYED}\n`);
  console.log(`${text}\n`);

  if (r.displaced.length) {
    console.log("DISPLACED TERMS — the house has its own word:");
    for (const d of r.displaced) console.log(`   "${d.term}"  ->  the house says "${d.use}"`);
    console.log("");
  }
  if (r.never.length) {
    console.log("NEVER-RULE TERMS:");
    for (const n of r.never) console.log(`   "${n.term}"  — ${n.rule.slice(0, 90)}…`);
    console.log("");
  }
  if (r.banned.length) {
    console.log("BANNED WORDS — this room's own list, checked literally:");
    for (const b of r.banned) console.log(`   "${b}"`);
    console.log("");
  }
  if (r.houseWide.length) {
    console.log("HOUSE-WIDE REFUSALS — banned in every room, not just this one:");
    for (const h of r.houseWide) console.log(`   "${h.term}"  — ${h.why}`);
    console.log("");
  }

  const top = r.near[0];
  if (top && top.score >= 0.34) {
    console.log(`SHAPE PROXIMITY — closest refusal (${(top.score * 100) | 0}% of the shorter line's distinctive words):`);
    console.log(`   refused: "${top.text}"`);
    console.log(`   because: ${top.why}`);
    console.log(`   shared:  ${top.shared.join(", ")}`);
    console.log("   Not a verdict. Read the refusal beside the candidate and decide.\n");
  }
  if (!r.bad && (!top || top.score < 0.34))
    console.log("No banned shapes found. This layer is lexical — it does not certify the voice.\n");
  process.exit(r.bad ? 1 : 0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const argv = process.argv.slice(2);
  if (argv[0] === "--audit") {
    runAudit(argv[1]);
  } else {
    const [slug, ...rest] = argv;
    let text = rest.join(" ").trim();
    if (!text) { try { text = readFileSync(0, "utf8").trim(); } catch { /* no stdin */ } }
    if (!text) { console.error("no text given"); process.exit(2); }
    runCheck(slug, text);
  }
}
