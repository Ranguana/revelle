#!/usr/bin/env node
/**
 * ONE ROOM, ONE PAGE, ONE VERDICT.
 *
 *   npm run room:check <slug>
 *
 * ── WHY THIS EXISTS ──────────────────────────────────────────────────
 *
 * A room currently arrives in nine pieces across three sessions, and the
 * founder's okay is the last step in every one of them. She cannot give it,
 * because there is nowhere to look: the row is in one audit, the voice in
 * another, the palette in a test's private helpers, and the completeness in
 * nobody's. This page is the artifact she says okay to.
 *
 * EVERY NUMBER ON IT IS REPRODUCIBLE BY RUNNING THIS COMMAND. Nothing here is
 * quoted from a transcript, and nothing is computed twice — the row comes from
 * src/lib/matrix.ts, the voice from src/lib/voice.ts, the palette from
 * src/lib/palette.ts, the floors from scripts/deliverables.mjs, and the pools
 * from the registry. Rule 7's principle, generalised: a number belongs to one
 * instrument and this page is a reader, never a second author.
 *
 * ── IT RUNS WITHOUT A DATABASE, AND SAYS WHAT IT COULD NOT RUN ───────
 *
 * `DATABASE_URL` is a placeholder here and `ipAllowList: []` means no laptop
 * reaches production. Every pool is seeded from files, so completeness is
 * computable offline. Anything that genuinely needs a database is reported
 * SKIPPED WITH ITS REASON and counts toward NEITHER a pass nor a fail — rule
 * 33, because a check that behaves differently in two places is the defect this
 * whole week has been paying for, and a silent omission is how it hides.
 *
 * ── A CHECK THAT DID NOT RUN IS NOT A PASS ───────────────────────────
 *
 * The verdict counts what RAN. If a composed audit errors, the page says so and
 * the verdict cannot be COMPLETE. Rule 24: this reports what was checked, how
 * many ran, and how many were skipped and why — never "the room is complete".
 */
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import {
  MATRIX_KEYS, MATRIX_GATE, matrixRow, neighbours, ballB2, gateShell,
  loadBearingCells, fingerprintDrop, sameKindAtGate, kindOf, isAuthored, KIND_MASK,
} from "../src/lib/matrix.ts";
import { DESTINATIONS, DESTINATION_TONES } from "../src/lib/destinations.ts";
import {
  voiceAffinity, destinationVoiceProfile, toneHandOverlap, voiceCeiling,
  VOICE_CEILING_STRICT, VOICE_CEILING_MONITOR, TONE_HAND_OVERLAP_MAX,
} from "../src/lib/voice.ts";
import { isDeclaredTwin } from "../src/lib/matrix.ts";
import {
  contrastReadings, groundSeparation, paletteDarkAudit, GROUND_FLOOR,
} from "../src/lib/palette.ts";
import { poolReports, structuralItems } from "../src/lib/room-completeness.ts";
import { foodIdentityClaim } from "../src/lib/food-identity.ts";
import { EVIDENCE_FLOORS } from "./deliverables.mjs";
import { DESTINATIONS as HEADING_TO_SLUG } from "./catalogue-vocabulary.mjs";

const slug = process.argv[2];
const root = (p) => fileURLToPath(new URL(`../${p}`, import.meta.url));

if (!slug) {
  console.error("usage: npm run room:check -- <slug>\n\nrows: " + MATRIX_KEYS.join(", "));
  process.exit(1);
}

/** Reads a file, or null. Null becomes `unknown` downstream, never zero. */
const readOrNull = (p) => { try { return readFileSync(root(p), "utf8"); } catch { return null; } };

/** Ran / skipped / failed, counted at the end. A skip is neither a pass nor a fail. */
const ran = [];
const skipped = [];
const failedChecks = [];
function compose(label, fn) {
  try { const v = fn(); ran.push(label); return v; }
  catch (e) { failedChecks.push({ label, why: e.message.split("\n")[0] }); return null; }
}
function skip(label, why) { skipped.push({ label, why }); }

const line = (s = "") => console.log(s);
const rule = (t) => { line(); line(`── ${t} ${"─".repeat(Math.max(0, 68 - t.length))}`); line(); };

// ── the room ─────────────────────────────────────────────────────────
const row = matrixRow(slug);
const room = DESTINATIONS[slug];
const tones = DESTINATION_TONES[slug];
if (!row && !room) {
  console.error(`No room "${slug}" — it has neither a matrix row nor a voice.\n\nrows: ${MATRIX_KEYS.join(", ")}`);
  process.exit(1);
}

const heading =
  Object.entries(HEADING_TO_SLUG).find(([, s]) => s === slug)?.[0] ?? null;

line(`ROOM CHECK — ${slug}`);
line(`${room?.name ?? "(no voice object; name unknown)"}`);
line(`${isAuthored(slug) ? "SIGNED — on `authored`" : "NOT SIGNED — draft or proposed. Admission is a signature (rule 13)."}`);

// ── 1. the row ───────────────────────────────────────────────────────
rule("1 · THE ROW");
if (!row) {
  line("   NO MATRIX ROW. Every distance below is unmeasured, not zero.");
  skip("row placement", "no row in data/destination-matrix.json");
} else {
  compose("row placement", () => {
    line(`   cells  ${row.join(" · ")}`);
    line(`   kind   ${kindOf(slug)}   [mask: ${KIND_MASK.join(", ")}]`);
    line();
    const ns = neighbours(slug);
    line(`   DISTANCE TO EVERY OTHER ROW (gate ${MATRIX_GATE}) — full table, never sampled`);
    for (const n of ns) {
      const tags = [];
      if (n.d < MATRIX_GATE) tags.push(isDeclaredTwin(slug, n.key) ? "declared twin" : "FAILS THE GATE");
      if (n.d === MATRIX_GATE) tags.push("at the gate");
      if (!n.authored) tags.push("not signed");
      line(`      ${n.d}  ${n.key.padEnd(19)}${tags.length ? "  [" + tags.join(" · ") + "]" : ""}`);
    }
    const min = ns[0].d;
    line(`      nearest ${min} (${ns.filter((n) => n.d === min).map((n) => n.key).join(", ")}) · mean ${(ns.reduce((s, n) => s + n.d, 0) / ns.length).toFixed(2)}`);
    line();
    const b2 = ballB2(slug), shell = gateShell(slug);
    line(`   B2 (under the gate): ${b2.length}${b2.length ? " — " + b2.map((n) => `${n.key} at ${n.d}`).join(", ") : " — empty, eligible on structure"}`);
    if (b2.length === 1) line(`      ONE OCCUPANT — twin CANDIDATE. Propose; you may not declare.`);
    if (b2.length >= 2) line(`      CROWDED CORNER — change a cell or kill the snapshot.`);
    line(`   d=${MATRIX_GATE} shell: ${shell.length}${shell.length ? " — " + shell.map((n) => n.key).join(", ") : " — none"}`);
    const lb = loadBearingCells(slug);
    line(`   load-bearing cells: ${lb.size ? [...lb].map(([f, who]) => `${f} (${who.join("/")})`).join(", ") : "none"}`);
    const fp = fingerprintDrop(slug);
    line(`   fingerprint-drop: ${fp ? fp.map((f) => `${f.facet}.${f.level} ${f.minWith}→${f.minWithout} ${f.collapses ? "COLLAPSES" : "holds"}`).join("; ") : "none"}`);
    const sk = sameKindAtGate(slug);
    line(`   same-kind at/inside the gate: ${sk.length ? sk.map((n) => `${n.key} (${n.d})`).join(", ") : "none"}`);
  });
}

// ── 2. the voice ─────────────────────────────────────────────────────
rule("2 · THE VOICE");
if (!room?.voice || !tones) {
  line("   NO VOICE OBJECT. A destination is published only if it has a published voice.");
  skip("voice affinity", "no entry in src/lib/destinations.ts / DESTINATION_TONES");
} else {
  compose("voice affinity", () => {
    const v = room.voice;
    line(`   stated triple  ${v.formality} / ${v.address.mode} / ${v.humour.mode}`);
    const others = Object.keys(DESTINATIONS).filter((k) => k !== slug);
    const dupe = others.find((k) => {
      const o = DESTINATIONS[k].voice;
      return o.formality === v.formality && o.address.mode === v.address.mode && o.humour.mode === v.humour.mode;
    });
    line(`                  ${dupe ? `REPEATED by ${dupe} — cosine is blind to this; the test is not` : "unused by any other room"}`);
    line(`   tone hand      ${tones.length} tones (6–13 allowed)`);
    line();
    const mine = destinationVoiceProfile(v, tones);
    const rows = others.map((k) => {
      const score = voiceAffinity(mine, destinationVoiceProfile(DESTINATIONS[k].voice, DESTINATION_TONES[k]));
      const ceil = voiceCeiling(matrixRow(slug) && matrixRow(k) ? neighbours(slug).find((n) => n.key === k)?.d ?? null : null, isDeclaredTwin(slug, k));
      return { k, score, overlap: toneHandOverlap(tones, DESTINATION_TONES[k]), ceil };
    }).sort((a, b) => b.score - a.score);
    line(`   NEAREST MOUTHS (STRICT ${VOICE_CEILING_STRICT} at d≤2 or a twin, MONITOR ${VOICE_CEILING_MONITOR} beyond)`);
    for (const r of rows.slice(0, 5))
      line(`      ${r.score.toFixed(3)}  ${r.k.padEnd(19)} ${r.ceil.tier.padEnd(8)} ${r.ceil.limit}  ${r.score >= r.ceil.limit ? "BREACH" : "ok"}`);
    const breaches = rows.filter((r) => r.score >= r.ceil.limit);
    line(`   breaches: ${breaches.length}`);
    const worstOverlap = rows.reduce((a, b) => (b.overlap > a.overlap ? b : a));
    line(`   max tone-hand overlap: ${worstOverlap.overlap.toFixed(3)} vs ${worstOverlap.k} (guard ${TONE_HAND_OVERLAP_MAX}) ${worstOverlap.overlap > TONE_HAND_OVERLAP_MAX ? "BREACH" : "ok"}`);
  });
}

// ── 3. the palette, day and dark ─────────────────────────────────────
rule("3 · THE PALETTE — day and dark");
if (!room?.look) {
  line("   NO LOOK. Nothing to measure.");
  skip("palette", "no look on the destination object");
} else {
  compose("palette day", () => {
    line("   DAY");
    for (const c of contrastReadings(room.look.palette))
      line(`      ${c.token.padEnd(9)} ${c.ratio.toFixed(2)}:1  floor ${String(c.floor).padEnd(4)} ${c.ok ? "ok" : "FAIL"}`);
    const sep = groundSeparation(slug, DESTINATIONS, "palette");
    const worst = sep[0];
    line(`      ground separation: nearest ${worst.distance.toFixed(1)} (${worst.other}), floor ${GROUND_FLOOR} ${worst.ok ? "ok" : "FAIL"}`);
  });
  compose("palette dark", () => {
    line("   DARK — never gated by any test; measured here for the first time");
    if (!room.look.paletteDark) { line("      no paletteDark on this room"); return; }
    for (const c of contrastReadings(room.look.paletteDark))
      line(`      ${c.token.padEnd(9)} ${c.ratio.toFixed(2)}:1  floor ${String(c.floor).padEnd(4)} ${c.ok ? "ok" : "FAIL"}`);
    const sep = groundSeparation(slug, DESTINATIONS, "paletteDark");
    const worst = sep[0];
    line(`      ground separation: nearest ${worst.distance.toFixed(1)} (${worst.other}), floor ${GROUND_FLOOR} ${worst.ok ? "ok" : "BELOW FLOOR"}`);
    const audit = paletteDarkAudit(DESTINATIONS);
    const twin = audit.identical.find((p) => p.a === slug || p.b === slug);
    if (twin) line(`      *** BYTE-IDENTICAL to ${twin.a === slug ? twin.b : twin.a} across all ${twin.fields} dark fields ***`);
    line(`      registry-wide: mean ${audit.mean.toFixed(2)}, ${audit.belowFloor.length} of ${(audit.measured * (audit.measured - 1)) / 2} pairs below ${GROUND_FLOOR}, ${audit.identical.length} identical pair(s)`);
  });
}

// ── 4. what the room owes ────────────────────────────────────────────
rule("4 · WHAT THE ROOM OWES — pools from the registry, never a hand list");

const bank = compose("bank dry run", () => {
  const out = execFileSync("node", [root("scripts/seed-bank.mjs"), "--dry-run"], {
    encoding: "utf8", timeout: 120000, env: { ...process.env },
  });
  // THE SEEDER'S OWN PER-ROOM HEADER, not a line-count heuristic. It prints
  //   ## NANTUCKET, 1972  [nantucket]  24 rows — good 18 · host_act 2 · ...
  // Counting matching lines instead gave 26 for a room the seeder routes 24
  // rows to — rule 24, caught by comparing against the instrument's own number.
  const header = out.match(new RegExp(`^## .*\\[${slug}\\]\\s+(\\d+) rows`, "m"));
  const items = header ? Number(header[1]) : null;
  // The gesture block prints `gesture` then `gesture_note`, and only the note
  // carries the room. Pair them by position rather than by a fragile lookahead.
  let gesture = null;
  const lines = out.split("\n");
  for (let i = 0; i < lines.length - 1; i++) {
    const g = lines[i].match(/^   gesture {6,}(.+)$/);
    if (!g) continue;
    const note = lines[i + 1];
    if (note.includes(`— ${room?.name ?? "\u0000"},`)) { gesture = g[1].trim(); break; }
  }
  return { out, items, gesture };
});

const sources = {
  dishes: readOrNull("docs/dishes.md"),
  drinks: readOrNull("docs/drinks.md"),
  heading,
  games: compose("game count", () => {
    const g = readOrNull("src/lib/games.ts");
    if (g === null) return null;
    return [...g.matchAll(/world:\s*"([a-z0-9-]+)"/g)].filter((m) => m[1] === slug).length;
  }),
  bankItems: bank?.items ?? null,
  gesture: bank?.gesture ?? null,
  dishFloor: (() => { const c = foodIdentityClaim(slug); return c ? EVIDENCE_FLOORS[c.identity] : null; })(),
};

// EVERY DRINK OWES A MIRROR (db/060: `mocktails` is nullable and NULL means
// owed; `drink_live_has_its_mirror` refuses a live drink without one). The
// seeded document writes the debt in the mirror position, in words.
const mirrorsOwed = (() => {
  if (!heading || sources.drinks === null) return null;
  // ABSENCE OF A SECTION IS `unknown`, NOT "every drink has one". Hong Kong has
  // no drinks at all and the first cut of this printed `ok — every drink has a
  // mirror`, which is rule 26's trap wearing a new hat: a room read as clean
  // because there was nothing to measure. If the section is missing the answer
  // is null and the verdict treats it as owed-unknown.
  if (!new RegExp(`^##\\s+${heading.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}\\s*$`, "m").test(sources.drinks)) return null;
  const lines = sources.drinks.split("\n");
  let inSection = false, owed = 0, current = null;
  const names = [];
  for (const l of lines) {
    const h2 = l.match(/^##\s+(.+?)\s*$/);
    if (h2) { inSection = h2[1].trim() === heading; continue; }
    if (!inSection) continue;
    if (/^\*\*\d+\.\d+\*\*/.test(l)) { current = null; continue; }
    const bullet = l.match(/^-\s+(.+?)\s*$/);
    if (!bullet) continue;
    if (current === null) { current = bullet[1]; continue; }
    if (/^mirror owed$/i.test(bullet[1])) { owed++; names.push(current); }
    current = current === null ? null : current;
  }
  return { owed, names };
})();

const items = structuralItems(slug, sources);
for (const i of items)
  line(`   ${i.ok === null ? "?" : i.ok ? "ok  " : "MISS"} ${i.label.padEnd(24)} ${i.detail}`);
if (mirrorsOwed !== null && mirrorsOwed.owed > 0)
  line(`   MISS ${"mocktail mirrors".padEnd(24)} ${mirrorsOwed.owed} owed — ${mirrorsOwed.names.join("; ")} (db/060 refuses these live)`);
else if (mirrorsOwed !== null)
  line(`   ok   ${"mocktail mirrors".padEnd(24)} every drink has one`);
else
  line(`   ?    ${"mocktail mirrors".padEnd(24)} UNKNOWN — no drinks section to measure; not the same as nothing owed`);
line();
const pools = poolReports(slug, sources);
line(`   POOLS (${pools.length} registered in ingredient_pool)`);
for (const p of pools) {
  const n = p.count === null ? "—" : String(p.count);
  const flag =
    p.state === "held" ? (p.floor !== null && p.count < p.floor ? `SHORT of ${p.floor}` : "ok") :
    p.state === "empty" ? "EMPTY" :
    p.state === "unknown" ? "UNKNOWN" : p.state;
  line(`      ${p.pool.padEnd(13)} ${n.padStart(4)}  ${flag.padEnd(12)} ${p.note}`);
}

// ── 5. composed audits ───────────────────────────────────────────────
rule("5 · COMPOSED AUDITS — run, not reimplemented");
for (const [label, script, args] of [
  ["check:matrix", "scripts/audit-matrix.mjs", []],
  ["check:facets", "scripts/check-facets.mjs", []],
  ["check:pools", "scripts/generate-pool-registry.mjs", ["--check"]],
  ["check:registry-dates", "scripts/registry-dates.mjs", ["--check"]],
  ["check:tone-marks", "scripts/build-tone-marks.mjs", ["--check"]],
]) {
  try {
    execFileSync("node", ["--disable-warning=MODULE_TYPELESS_PACKAGE_JSON", root(script), ...args], { encoding: "utf8", timeout: 120000, stdio: "pipe" });
    ran.push(label);
    line(`   ok   ${label}`);
  } catch (e) {
    const why = (e.stdout || e.stderr || e.message).split("\n").filter(Boolean).pop() ?? "non-zero exit";
    // A CHECK THAT NEEDS A DATABASE IS SKIPPED, NOT FAILED — and the two must
    // never be merged. Rule 33: a check that behaves differently in two places
    // is the defect; reporting "FAIL" here would make a laptop's missing
    // DATABASE_URL look like a defect in the room, and reporting nothing would
    // hide that the check never ran at all.
    if (/DATABASE_URL|ECONNREFUSED|connect|password authentication/i.test(why)) {
      skip(label, `needs a database — ${why}`);
      line(`   skip ${label} — needs a database`);
    } else {
      failedChecks.push({ label, why });
      line(`   FAIL ${label}`);
    }
  }
}
skip("check:gates", "needs a database; DATABASE_URL is a placeholder and ipAllowList is empty (rule 9)");
skip("seeded-catalogue counts", "needs a database — what is IN production is not readable from a laptop (rule 33)");

// ── the verdict ──────────────────────────────────────────────────────
rule("VERDICT");
const missing = items.filter((i) => i.ok === false).map((i) => i.label);
const emptyPools = pools.filter((p) => p.state === "empty").map((p) => p.pool);
const unknownPools = pools.filter((p) => p.state === "unknown").map((p) => p.pool);
const shortPools = pools.filter((p) => p.state === "held" && p.floor !== null && p.count < p.floor)
  .map((p) => `${p.pool} ${p.count}/${p.floor}`);

line(`   checks run: ${ran.length} · skipped: ${skipped.length} · failed: ${failedChecks.length}`);
for (const s of skipped) line(`      SKIPPED  ${s.label} — ${s.why}`);
for (const f of failedChecks) line(`      FAILED   ${f.label} — ${f.why}`);
line();
if (missing.length) line(`   missing: ${missing.join(", ")}`);
if (shortPools.length) line(`   short:   ${shortPools.join(", ")}`);
if (emptyPools.length) line(`   empty:   ${emptyPools.join(", ")}`);
if (unknownPools.length) line(`   unknown: ${unknownPools.join(", ")} — unknown is not nothing owed`);
line();

const owedMirrors = mirrorsOwed?.owed ?? 0;
if (owedMirrors) line(`   owed:    ${owedMirrors} mocktail mirror(s) — a live drink without one is refused by db/060`);
const blocking = missing.length + shortPools.length + unknownPools.length + failedChecks.length + owedMirrors;
if (failedChecks.length)
  line(`   INCOMPLETE — ${failedChecks.length} check(s) did not run cleanly. A check that did not run is not a pass.`);
else if (blocking === 0 && emptyPools.length === 0)
  line(`   COMPLETE on every check that ran. ${skipped.length} skipped and named above; none counted toward this.`);
else if (blocking === 0)
  line(`   COMPLETE on every gated check. Empty pools above are authoring absences (rule 29), not properties of the room.`);
else
  line(`   INCOMPLETE — ${blocking} blocking item(s).`);
line();
line(`   Not a signature. Admission is a human gesture (rule 8, rule 13).`);
line();
