import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

/**
 * The register, as a merge gate rather than an audit.
 *
 * ── WHY THIS IS A TEST AND NOT A HABIT ───────────────────────────────
 *
 * A member-facing surface shipped, was register-checked afterwards, and came
 * back clean — but the sequence was inverted, and a clean result from a check
 * that ran too late is luck rather than process. The fix is mechanical: the
 * check runs before the merge, every time, because it runs in the suite.
 *
 * ── WHAT IT CHECKS ───────────────────────────────────────────────────
 *
 * Two rules, both already decided and written down:
 *
 *   HOST-AS-AUTHOR, PRODUCT-AS-INSTRUMENT (CLAUDE.md rule 10). The party is
 *   hers; Revelle never authors AT her. "We've selected", "your curated", "it
 *   arrives written" all fail — the test is whether the line credits her or
 *   credits us.
 *
 *   THE HOUSE-WIDE REFUSALS, carried by authored `rejected` entries and
 *   enforced by scripts/check-voice-output.mjs. `elevated`, `curated`,
 *   `unforgettable`, and `experience` as a NOUN — Nantucket's "a clambake is a
 *   dinner, not an experience". The verb is allowed; the founder's Catskills
 *   tagline uses it correctly.
 *
 * ── WHERE IT LOOKS, AND WHY NOT EVERYWHERE ───────────────────────────
 *
 * Member-facing surfaces only. The desk is house-facing and says house things —
 * "offered", "withdrawn", "the curator" — which are correct there and would
 * make this test scream. A rule applied where it does not belong gets disabled,
 * and a disabled rule protects nothing.
 */

const SURFACES = [
  "src/app/portal",
  "src/app/apply",
  "src/app/desk/(signed-in)/members", // renders HER portal, so it speaks to her
  "src/lib/correspondence",
];

/** Each pattern carries the refusal that argues for it. Taste alone is not a reason. */
const BANNED: { re: RegExp; why: string }[] = [
  { re: /\bwe(?:'|’)?ve\s+(?:selected|chosen|curated|picked|handled|done)/i,
    why: "rule 10: credits the product with her party" },
  { re: /\byour\s+curated\b/i, why: "rule 10, and `curated` is a house-wide refusal" },
  { re: /\bit\s+arrives\s+written\b/i, why: "rule 10: the product wrote it, she did not" },
  { re: /\beverything\s+else\s+is\s+written\b/i, why: "rule 10, one clause deep" },
  { re: /\bcurated\b/i, why: "the house names the thing; a curated anything is a shop describing itself" },
  { re: /\belevated\b/i, why: "nothing here is elevated — it is a dinner, a lunch, or a night" },
  { re: /\bunforgettable\b/i, why: "promises the reader her own memory back" },
  { re: /\b(?:an?|the)\s+\w*\s*experience\b/i,
    why: 'NANTUCKET: "a clambake is a dinner, not an experience". The NOUN only — the verb is fine' },
];

function walk(dir: string, out: string[] = []): string[] {
  let entries: string[];
  try { entries = readdirSync(dir); } catch { return out; }
  for (const e of entries) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx?|css)$/.test(e)) out.push(p);
  }
  return out;
}

/** Comments explain the rules; they are not shown to anybody. */
function strip(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");
}

test("no member-facing surface speaks in the product's voice", () => {
  const root = new URL("../../", import.meta.url).pathname;
  const hits: string[] = [];

  for (const surface of SURFACES) {
    for (const file of walk(join(root, surface))) {
      const text = strip(readFileSync(file, "utf8"));
      for (const { re, why } of BANNED) {
        const m = re.exec(text);
        if (m) hits.push(`${file.replace(root, "")}: "${m[0].trim()}" — ${why}`);
      }
    }
  }

  assert.deepEqual(
    hits,
    [],
    `member-facing copy in the product's voice:\n  ${hits.join("\n  ")}\n\n` +
      `See docs/copy-brief.md. If a line is right and the rule is wrong, change ` +
      `the rule deliberately — do not add an exception here.`
  );
});
