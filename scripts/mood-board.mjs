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
 *
 * ── AND THE DESK NOW DOES THIS TOO ───────────────────────────────────
 *
 * /desk/images is the same reading with the two things this script cannot
 * have: a place two curators can drop into that is not somebody's laptop, and
 * a button that puts an accepted placement into the bank as a draft instead of
 * asking for a paste. This script stays because a folder of a thousand
 * references is a batch job and a batch job belongs on a command line.
 *
 * THE PROMPT MOVED, AND ONLY THE PROMPT. It is now
 * `placementSystemPrompt()` in src/lib/desk/images.ts, imported below and
 * unchanged word for word, together with the JSON repair and the media-type
 * sniff. Two copies of "judge the object, not the styling" would drift, and
 * the drift would be invisible — both surfaces would go on returning
 * placements and only the catalogue would slowly disagree with itself
 * (CLAUDE.md rule 21). The argument for the prompt is still HERE, above,
 * because this is where it was won.
 */
import { readdir, readFile, writeFile, access } from "node:fs/promises";
import { extname, join, basename } from "node:path";

import { MODEL } from "../src/lib/model.ts";
import {
  PLACEMENT_ASK,
  SNIFF_BYTES,
  parseReply,
  placementSystemPrompt,
  sniffImage,
} from "../src/lib/desk/images.ts";

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

/* ── the rooms, the prompt, and the reply reader ──────────────────────
 *
 * All three now live in src/lib/desk/images.ts, which the desk imports too.
 * The rooms still come straight from the registry (rule 19) — that happens
 * inside `placementSystemPrompt()`, so a nineteenth room is matchable the day
 * it is authored and nobody edits either file.
 */
const SYSTEM = placementSystemPrompt();

/** Which files in the folder are worth opening. The TYPE comes from the bytes
 *  (`sniffImage`), never from the extension — an extension is a label. */
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

async function look(file) {
  const bytes = await readFile(file);
  // THE BYTES DECIDE, not the extension. Same test /desk/images applies to a
  // dropped file, from the same module, so a picture this script will read is
  // exactly a picture that screen will keep.
  const media = sniffImage(bytes.subarray(0, SNIFF_BYTES));
  if (!media) {
    throw new Error(
      `${basename(file)} is named like an image and its first bytes are not ` +
        `one. Nothing is guessed here.`
    );
  }

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
            { type: "text", text: PLACEMENT_ASK },
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

/* Resume: anything already written up is skipped, so an interrupted run costs
 * nothing and a second board can append to the same sheet. */
let existing = "";
try { existing = await readFile(out, "utf8"); } catch {}

const files = (await readdir(dir))
  .filter((f) => IMAGE_EXTENSIONS.has(extname(f).toLowerCase()))
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
