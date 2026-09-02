#!/usr/bin/env node
/**
 * MOOD BOARD → CANDIDATE PLACEMENTS.
 *
 *   node scripts/mood-board.mjs ~/Camp/refs/board-1
 *   node scripts/mood-board.mjs ~/Camp/refs/board-1 --out docs/board-1-placements.md
 *   node scripts/mood-board.mjs ~/Camp/refs/board-1 --limit 5      # try it on five first
 *
 * Founder, 2026-09-02: "write a script that chrons a mood board image file
 * like we have and finds a place for each in a destination; I saved these bc I
 * like the idea behind them and think they fit somewhere."
 *
 * "I like the idea behind them" is the whole specification. The images are
 * saved because an IDEA is in them, and the idea is not the photograph.
 *
 * ── THE RULE THIS SCRIPT EXISTS TO ENFORCE ───────────────────────────
 *
 * JUDGE THE OBJECT, NOT THE STYLING.
 *
 * Learned the hard way on the board that produced it. An oyster shell poured
 * as a candle was dismissed as craft-fair — because it was photographed on
 * satin with pearls scattered round it, in a 2024 wedding-favour register.
 * The styling was contemporary. The object was a shell with wax in it, which
 * is as old as shells, and the catalogue ALREADY routes shells twice: Tahiti's
 * pearl-shell disc and Big Sur's shell scatter.
 *
 * A matcher that reads photographs instead of things makes that mistake on
 * every image. So the prompt below asks first and separately: what IS this,
 * stated as an object, with the photograph's styling stripped off. Everything
 * else is downstream of that answer.
 *
 * ── AND WHAT IT MAY NOT DO ───────────────────────────────────────────
 *
 * It PROPOSES. It writes a markdown sheet and touches no database, because a
 * claim about what belongs in a room is a governed judgement (rule 13) and a
 * script may not sign one. Every proposal carries a FOUNDER-PENDING question
 * in the same idiom scripts/seed-bank.mjs already reads, so an accepted line
 * can be moved into the bank by hand and a refused one costs a keystroke.
 *
 * NO ROOM IS A VALID ANSWER and the prompt says so twice. A matcher that
 * always finds a home is a matcher that has stopped measuring — rule 15 — and
 * forcing a fit is exactly how the confetti got into Amalfi as a pan-Italian
 * object the country-not-room test then had to catch (rule 32).
 *
 * THE IMAGES ARE REFERENCE AND STAY REFERENCE. They are other people's
 * photographs. Nothing here copies one into the product; the output is a
 * description in the house's own vocabulary, which is the only thing that
 * could ever ship.
 */
import { readdir, readFile, writeFile, access } from "node:fs/promises";
import { extname, join, basename } from "node:path";

import { DESTINATIONS } from "../src/lib/destinations.ts";
import { MODEL } from "../src/lib/model.ts";

const args = process.argv.slice(2);
const dir = args.find((a) => !a.startsWith("--"));
const outArg = args.indexOf("--out");
const limitArg = args.indexOf("--limit");
const out = outArg > -1 ? args[outArg + 1] : join(dir ?? ".", "placements.md");
const limit = limitArg > -1 ? Number(args[limitArg + 1]) : Infinity;

if (!dir) {
  console.error("usage: node scripts/mood-board.mjs <image-folder> [--out FILE] [--limit N]");
  process.exit(1);
}

const KEY = (process.env.ANTHROPIC_API_KEY ?? "").trim();
if (!KEY) {
  console.error(
    "[mood] ANTHROPIC_API_KEY is not set. It is in .env.local; export it or run with it in the environment."
  );
  process.exit(1);
}

/* ── the rooms, as the model will read them ──────────────────────────
 *
 * Straight from the registry (rule 19) rather than a list kept here, so a
 * nineteenth room is matchable the day it is authored and nobody edits this.
 */
const ROOMS = Object.entries(DESTINATIONS).map(([slug, d]) => ({
  slug,
  name: d.name,
  tagline: d.tagline,
  premise: d.premise,
}));

const ROOM_BRIEF = ROOMS.map(
  (r) => `- ${r.slug} — ${r.name}\n    ${r.tagline}\n    ${r.premise}`
).join("\n");

const SYSTEM = `You place objects from a mood board into a catalogue of eighteen authored
party destinations. Each room is a specific place in a specific year.

THE ROOMS:
${ROOM_BRIEF}

HOW TO READ AN IMAGE — this is the part people get wrong.

1. NAME THE OBJECT, NOT THE PHOTOGRAPH. Strip the styling: the backdrop, the
   props, the lighting, the era of the photography itself. A shell with wax in
   it photographed on satin with pearls is not a 2024 object; it is a shell
   with wax in it. Say what the thing IS in plain words, as if describing it to
   someone holding it.

2. THEN ask whether that OBJECT is plausible in a candidate room's year and
   place. A modern photograph of an old object is fine. An object that could
   not exist in the year, or belongs to a different country than the room, is
   not — a pan-Italian sweet is not an Amalfi-coast object, and a Campanian
   liqueur is not a Ligurian one. Region matters as much as period.

3. NO ROOM IS A CORRECT AND COMMON ANSWER. Many mood-board images are
   atmosphere with no object in them at all, or an object no room can claim.
   Say so. Do not stretch. A forced placement is worse than an empty one,
   because somebody then has to find it and take it out.

4. NEVER a brand name. If the image shows branded goods, name the generic
   object or refuse it.

5. Prefer THE EVENING SUPPLIES IT where it is true: an object the party
   already produces — the cork from a bottle opened anyway, a shell from the
   oysters served — rather than something bought and shipped in.

Reply as JSON only, no prose around it:
{
  "object": "what it is, plainly, styling stripped",
  "styling_note": "what about the photograph is period-wrong or misleading, if anything",
  "placements": [
    {"room": "<slug>", "as": "take_home | table_set | atmosphere | light | act | none",
     "why": "one sentence tying it to that room's premise or year",
     "confidence": "strong | possible | weak"}
  ],
  "no_room": false,
  "question": "the one thing a founder would have to decide before this ships",
  "bank_clause": "the item written in the bank's own syntax: '<lower-case name> — <take-home | table set | take-home and table set | atmosphere>, <what it is in a clause or two>, <one per guest | one per house | quantity>' — no FOUNDER-PENDING, that is added for you. Match the register of: 'the knife you learned on — take-home, a cheap wooden-handled oyster knife, one per person who joined the shucking, kept'"
}
If nothing fits, set no_room true and placements to [].`;

const MIME = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif" };

async function look(file) {
  const bytes = await readFile(file);
  const media = MIME[extname(file).toLowerCase()];
  if (!media) return null;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1200,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: media, data: bytes.toString("base64") } },
            { type: "text", text: "Place this, or refuse it." },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status} ${body.slice(0, 300)}`);
  }
  const msg = await res.json();
  const text = (msg.content ?? []).filter((c) => c.type === "text").map((c) => c.text).join("");
  return parseReply(text);
}

/**
 * The model writes prose about objects for a living, and the prose it is best
 * at contains apostrophes, em dashes and quoted phrases — which is exactly
 * what makes hand-written JSON fragile. One image in three failed on the first
 * run with "Expected ',' or ']'", and the reply was otherwise perfect.
 *
 * So: repair the two things that actually go wrong, and re-ask once if the
 * repair does not take. Throwing away a good reading of a photograph over a
 * trailing comma is the wrong trade when the retry costs one call.
 */
function parseReply(text) {
  const block = text.match(/\{[\s\S]*\}/);
  if (!block) throw new Error(`no JSON in reply: ${text.slice(0, 200)}`);
  const raw = block[0];
  try {
    return JSON.parse(raw);
  } catch {
    // trailing commas before a close, and literal newlines inside strings
    const repaired = raw
      .replace(/,(\s*[}\]])/g, "$1")
      .replace(/"(?:[^"\\]|\\.)*"/g, (m) => m.replace(/\n/g, " "));
    return JSON.parse(repaired);
  }
}

/* Resume: anything already written up is skipped, so an interrupted run costs
 * nothing and a second board can append to the same sheet. */
let existing = "";
try { existing = await readFile(out, "utf8"); } catch {}

const files = (await readdir(dir))
  .filter((f) => MIME[extname(f).toLowerCase()])
  .sort();

console.log(`[mood] ${files.length} images in ${dir}`);

const lines = [];
let placed = 0, refused = 0, skipped = 0, failed = 0, n = 0;

for (const f of files) {
  if (n >= limit) break;
  if (existing.includes(f)) { skipped += 1; continue; }
  n += 1;

  try {
    const r = await look(join(dir, f));
    if (!r) continue;

    const strong = (r.placements ?? []).filter((p) => p.room && p.as !== "none");
    if (r.no_room || strong.length === 0) {
      refused += 1;
      lines.push(`### ${r.object}\n\n\`${f}\` — **no room.** ${r.styling_note || ""}\n`);
      console.log(`[mood] ${f}  — no room: ${r.object}`);
    } else {
      placed += 1;
      lines.push(`### ${r.object}\n\n\`${f}\``);
      if (r.styling_note) lines.push(`\n*Styling note: ${r.styling_note}*\n`);
      for (const p of strong) {
        lines.push(`\n- **${p.room}** · ${p.as} · ${p.confidence} — ${p.why}`);
      }
      lines.push(`\n\n(FOUNDER-PENDING — ${r.question})\n`);
      if (r.bank_clause) {
        // PASTE-READY, because the step between this sheet and a desk row was a
        // hand translation and hand translations are where a register slips.
        // The clause is the bank's syntax exactly: seed-bank splits a GOODS
        // block on `;`, so this drops into the room's second GOODS block and
        // becomes a draft row on the next deploy — held, because the marker
        // rides with it. Still a paste and not a write: what belongs in a room
        // is the founder's to sign (rule 13).
        lines.push(
          `\n<details><summary>bank clause — paste into the room's GOODS block</summary>\n\n` +
            `\`\`\`\n${r.bank_clause} (FOUNDER-PENDING — ${r.question});\n\`\`\`\n</details>\n`
        );
      }
      console.log(`[mood] ${f}  → ${strong.map((p) => p.room).join(", ")}`);
    }
  } catch (err) {
    // One retry, because the failures seen are formatting rather than refusal.
    try {
      const r = await look(join(dir, f));
      const strong = (r?.placements ?? []).filter((p) => p.room && p.as !== "none");
      if (r && strong.length > 0) {
        placed += 1;
        lines.push(`### ${r.object}\n\n\`${f}\``);
        if (r.styling_note) lines.push(`\n*Styling note: ${r.styling_note}*\n`);
        for (const p of strong) lines.push(`\n- **${p.room}** · ${p.as} · ${p.confidence} — ${p.why}`);
        lines.push(`\n\n(FOUNDER-PENDING — ${r.question})\n`);
        console.log(`[mood] ${f}  → ${strong.map((p) => p.room).join(", ")}  (on retry)`);
      } else {
        refused += 1;
        lines.push(`### ${r?.object ?? f}\n\n\`${f}\` — **no room.**\n`);
      }
    } catch (again) {
      failed += 1;
      console.warn(`[mood] ${f} FAILED twice: ${again.message}`);
    }
  }
}

if (lines.length > 0) {
  const header = existing
    ? "\n"
    : `# Mood board placements — ${basename(dir)}\n\n` +
      `Proposals only. Nothing here is in the catalogue: a claim about what belongs\n` +
      `in a room is a governed judgement and a script may not sign one. Each entry\n` +
      `carries a FOUNDER-PENDING question in the idiom seed-bank already reads, so an\n` +
      `accepted line can be moved into the bank by hand and a refused one deleted.\n\n` +
      `The source images are other people's photographs held as private reference.\n` +
      `Nothing here copies one — the text is the house's own words about an object.\n\n`;
  await writeFile(out, existing + header + lines.join("\n") + "\n");
}

console.log(
  `[mood] done — ${placed} placed, ${refused} refused, ${skipped} already written, ${failed} failed  →  ${out}`
);
