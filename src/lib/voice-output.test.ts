import assert from "node:assert/strict";
import { test } from "node:test";

import {
  ROOMS,
  isKeyed,
  fold,
  termHits,
  termShape,
  neverTerms,
  neverTermsLegacy,
  checkVoiceOutput,
  refusalAudit,
} from "../../scripts/check-voice-output.mjs";

/**
 * THE GUARD, COUNTED.
 *
 * `scripts/check-voice-output.mjs` is the only thing standing between a writer
 * model with research at authoring time and eighteen rooms' worth of refusals.
 * Until 2026-08-28 nobody had counted what it caught, and both answers were
 * bad: a refusal written as a comma list enforced its first item only, and
 * `voice.banned` — eighteen arrays whose own type comment promises they are
 * "checked literally" — was read by nothing at all.
 *
 * These tests exist because rule 24 says reading the code tells you what it was
 * meant to match and only counting tells you what it did. So they count, they
 * count in both directions, and the numbers are written down where a change
 * that quietly lowers one will fail.
 */

const ALL = ROOMS as readonly {
  key: string; name: string; tagline?: string;
  voice: {
    never: readonly string[];
    banned: readonly string[];
    lexicon: readonly { term: string; insteadOf?: readonly string[] }[];
    exemplars: readonly { text: string }[];
    signOffs: readonly string[];
    rejected: readonly { text: string }[];
  };
}[];

type Room = (typeof ALL)[number];

/** Typed lookup. `ROOMS` comes from a .mjs script, so it arrives shapeless. */
function room(slug: string): Room {
  const d = ALL.find((r) => r.key === slug);
  assert.ok(d, `no such room: ${slug}`);
  return d;
}

test("all eighteen authored rooms are reachable by the checker", () => {
  assert.equal(ALL.length, 18, "eighteen rooms are authored; the checker must reach every one");
  const notKeyed = ALL.filter((d) => !isKeyed(d)).map((d) => d.key).sort();
  // Not a defect and not something to fix here: these five are authored and
  // deliberately unkeyed, and each one's block in destinations.ts says why.
  // The assertion is that the QA path reaches them anyway, because a refusal
  // list nothing can be pointed at is the same defect as one nothing reads.
  assert.deepEqual(notKeyed,
    ["amalfi-1953", "aspen-1994", "oaxaca-1954", "palm-springs-1965", "st-moritz-1984"]);
});

/* ── the defect, reproduced ───────────────────────────────────────────*/

test("a comma list after `never` enforced its first item only — the measurement", () => {
  // PALM SPRINGS, 1965, as her refusal was originally written. The room has
  // since been reformatted into one clause per refusal; this is the string that
  // exposed the extractor, kept here so the claim in the script header can be
  // re-run rather than believed.
  const asWritten = ["Never mid-century, retro, mod, vintage, kitsch, swanky or classy. The room does not describe its own decade."];
  const old = neverTermsLegacy(asWritten).map((t: { term: string }) => t.term);
  const now = neverTerms(asWritten).map((t: { term: string }) => t.term);

  assert.deepEqual(old, ["mid-century"], "the old extractor stopped at the first comma");
  for (const word of ["mid-century", "retro", "mod", "vintage", "kitsch", "swanky", "classy"])
    assert.ok(now.includes(word), `${word} was declared and unenforced`);
  assert.equal(old.length, 1);
  assert.equal(now.filter((t: string) => t !== "the room does not describe its own decade").length, 7);
});

test("a clause that ends on an em dash is still a clause", () => {
  // TAHITI. The old lookahead knew about commas and full stops and nothing
  // else, so `aloha` — the word this room refuses most specifically — fell out.
  const rule = ["Never the costume. No tiki, no hula, no lei, no aloha — that word belongs to a different ocean."];
  assert.ok(!neverTermsLegacy(rule).some((t: { term: string }) => t.term === "aloha"));
  assert.ok(neverTerms(rule).some((t: { term: string }) => t.term === "aloha"));
});

test("the never-rule channel no longer cares how a word is spelled", () => {
  const stMoritz = room("st-moritz-1984");
  for (const line of ["The après hour is the point.", "The apres hour is the point."]) {
    const r = checkVoiceOutput(stMoritz, line);
    assert.ok(r.bad > 0, `unenforced: ${line}`);
  }
  assert.ok(termHits(fold("girls’ night"), "girls' night"), "curly apostrophes fold too");
});

test("splitting lists did not turn the checker into a substring matcher", () => {
  // The price of splitting a list is single-word terms, and a single-word term
  // matched by containment fires inside longer words. `mod` must not fire on
  // "modern"; a gate that matches everything prunes nothing.
  const palmSprings = room("palm-springs-1965");
  assert.equal(checkVoiceOutput(palmSprings, "The room is modern and the drinks are cold.").bad, 0);
  assert.ok(checkVoiceOutput(palmSprings, "The room is mod and the drinks are cold.").bad > 0);
  // but an inflection of a refused term is the refused term
  const westhampton = room("westhampton-1976");
  assert.ok(checkVoiceOutput(westhampton, "Thanks for coming to the venues.").bad > 0);
});

/* ── the channel that was never read ──────────────────────────────────*/

test("`voice.banned` is read, and it is the largest channel", () => {
  let banned = 0;
  for (const d of ALL) banned += d.voice.banned.length;
  assert.equal(banned, 397, "the banned terms this file now enforces");

  // Every room must have at least one banned word that fires on its own.
  for (const d of ALL) {
    const fires = d.voice.banned.filter((b) => checkVoiceOutput(d, `A note: ${b}.`).bad > 0);
    assert.ok(fires.length > 0, `${d.key}: no banned word fires`);
  }
});

test("the founder's own Catskills tagline still passes", () => {
  // `experience` is in almost every room's banned list, and the tagline uses it
  // as a VERB. HOUSE_WIDE settled that on 2026-08-23 — the ban is on the noun —
  // and wiring `banned` in literally would have failed the catalogue's own
  // approved line. A rule the catalogue violates is a wrong rule.
  const catskills = room("catskills");
  assert.equal(catskills.tagline, "It's never too late to experience sleepaway camp.");
  assert.equal(checkVoiceOutput(catskills, catskills.tagline).bad, 0);
  // and the noun is still refused
  assert.ok(checkVoiceOutput(catskills, "An unhurried camp experience.").bad > 0);
});

/* ── every room, both directions ──────────────────────────────────────*/

test("every WORD-shaped refusal in every room fires on a line containing it", () => {
  const dead: string[] = [];
  let checked = 0;
  for (const d of ALL) {
    for (const decl of refusalAudit(d).declared as { channel: string; term: string; shape: string }[]) {
      if (decl.shape !== "WORD") continue;
      checked++;
      const r = checkVoiceOutput(d, `The evening, and ${decl.term}, and the rest of it.`);
      // A term may be named by any channel. `curated` sits in seventeen banned
      // lists AND in HOUSE_WIDE, and the louder channel reports it — being
      // refused once is the requirement, not being refused in a chosen place.
      const named = [
        ...r.displaced.map((x: { term: string }) => fold(x.term)),
        ...r.never.map((x: { term: string }) => fold(x.term)),
        ...r.banned.map((x: string) => fold(x)),
        ...r.houseWide.map((x: { term: string }) => fold(x.term).replace(" (as a noun)", "")),
      ];
      if (r.bad === 0 || !named.includes(fold(decl.term)))
        dead.push(`${d.key} [${decl.channel}] ${decl.term}`);
    }
  }
  assert.ok(checked > 1000, `only ${checked} enforceable terms were exercised`);
  assert.deepEqual(dead, [], "declared refusals that do not fire");
});

test("the checker does not fire on the catalogue's own authored copy", () => {
  // Counting in the other direction. A guard that trips on the house's own
  // exemplars is worse than no guard, because the next person turns it off.
  // These seven predate this work — they fired under the old extractor too —
  // and each is a real disagreement inside the catalogue rather than a bug in
  // the matching, so they are recorded rather than suppressed.
  const known = [
    "cote-dazur: The table is outside unless the wind decides otherwise, and the wind is consulted late.",
    "cote-dazur: The Ferrat, in short glasses. One is the arrangement. Two is the afternoon.",
    "cote-dazur: Plates go outside with whoever is standing. Nobody is asked twice and nobody is asked once.",
    "palm-springs-1965: Nobody is making a speech. The compliment is already out there somewhere.",
    "tahiti: Wednesday. The boat came in with more than expected. Dinner is later than yesterday.",
    "westhampton-1976: Everyone names a houseguest. Nobody names themselves. The house keeps score and will not show it.",
    "westhampton-1976: Vintage summer glamour. Very questionable houseguests.",
  ];
  const fired: string[] = [];
  let lines = 0;
  for (const d of ALL) {
    const good = [
      ...d.voice.exemplars.map((e) => e.text),
      ...d.voice.signOffs,
      ...(d.tagline ? [d.tagline] : []),
    ];
    for (const line of good) {
      lines++;
      if (checkVoiceOutput(d, line).bad > 0) fired.push(`${d.key}: ${line}`);
    }
  }
  assert.ok(lines > 500, `only ${lines} authored lines were exercised`);
  assert.deepEqual(fired.sort(), [...known].sort());
});

test("the rooms' own refused example lines are caught more often than they were", () => {
  // The only non-circular catch rate available: `rejected` is copy the founder
  // wrote down as WRONG, so the checker firing on it is the thing working.
  let old = 0, now = 0, all = 0;
  for (const d of ALL) {
    const a = refusalAudit(d);
    for (const r of a.refused as { old: boolean; new: boolean }[]) {
      all++; if (r.old) old++; if (r.new) now++;
    }
  }
  assert.equal(all, 117);
  assert.equal(old, 49, "what the old pipeline caught");
  assert.equal(now, 65, "what this one catches");
  // Not a target to game: the remaining 52 are refused SHAPES, which no lexical
  // channel can reach. They are what the shape-proximity report is for.
});

/* ── what is still not enforced, stated rather than hidden ────────────*/

test("punctuation rules are declared everywhere and enforced nowhere", () => {
  // Rule 16. "Never an exclamation point" appears in seventeen of eighteen
  // rooms and NOTHING checks it — there is no punctuation pass and this test
  // exists so that stays visible instead of being assumed handled.
  const rooms = ALL.filter((d) => d.voice.never.some((r) => /exclamation point/i.test(r)));
  assert.ok(rooms.length >= 17, `${rooms.length} rooms declare an exclamation-point rule`);
  for (const d of rooms.slice(0, 3))
    assert.equal(checkVoiceOutput(d, "Come at seven!!!").bad, 0,
      `${d.key}: something started enforcing punctuation — update this test and the header`);

  let marks = 0;
  for (const d of ALL)
    marks += (refusalAudit(d).declared as { shape: string }[]).filter((x) => x.shape === "MARK").length;
  assert.equal(marks, 41, "declared refusal terms that name a mark rather than a word");
});

test("term shapes are classified, not guessed at", () => {
  assert.equal(termShape("retro"), "WORD");
  assert.equal(termShape("clambake experience"), "WORD");
  assert.equal(termShape("an exclamation point"), "MARK");
  assert.equal(termShape("use italics"), "MARK");
  assert.equal(termShape("write summer camp for grown-ups"), "PROSE");
});
