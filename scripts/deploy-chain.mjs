/**
 * WHAT THE DEPLOY ACTUALLY RUNS, PARSED ONCE.
 *
 * ── WHY THIS FILE EXISTS ─────────────────────────────────────────────
 *
 * This parser was written twice — in `scripts/smoke-seeders.mjs` and again in
 * `src/lib/deploy.test.ts` — and a third copy was about to be written for
 * `scripts/preflight.mjs`. Rule 21's narrow test settles it without argument:
 * MUST TWO SURFACES AGREE ABOUT THIS? They must. "Which seeders does the
 * deploy run, in what order" has exactly one answer, and three readers of one
 * YAML block will eventually disagree about it — most likely on the day
 * somebody adds a step and only two of them notice.
 *
 * So this is an EXTRACTION, not an abstraction. The behaviour is unchanged
 * from the copy in smoke-seeders, including its refusal to fall back.
 *
 * ── AND IT REFUSES TO GUESS, LOUDLY ──────────────────────────────────
 *
 * If the block moves or is renamed, this throws. It must never fall back to a
 * list of its own: a hardcoded chain that silently disagrees with render.yaml
 * is rule 20's exact failure — the file that describes the deploy is not the
 * deploy, and a checker reading its own list has stopped checking anything.
 *
 * ── AND render.yaml IS STILL NOT THE DEPLOY ──────────────────────────
 *
 * Rule 20, stated here because this is where a reader will assume otherwise:
 * the live service is not linked to this blueprint. For the whole life of the
 * service the running `preDeployCommand` was `npm run migrate` alone while
 * this file listed eight seeders. Anything asserting a property of PRODUCTION
 * must read production or say which of the two it read. Every consumer of this
 * function is reading THE FILE, and each one says so in its own output.
 */

import { readFileSync } from "node:fs";

const ROOT = new URL("../", import.meta.url).pathname;

/** Every `npm run …` in render.yaml's preDeployCommand, in order. */
export function deployChain() {
  const lines = readFileSync(`${ROOT}render.yaml`, "utf8").split("\n");
  const start = lines.findIndex((line) =>
    /^\s*preDeployCommand:\s*>-\s*$/.test(line)
  );
  if (start < 0) {
    throw new Error(
      "render.yaml has no `preDeployCommand: >-` block. If the deploy chain " +
        "moved, this parser has to be told where it went — it must never fall " +
        "back to a list of its own."
    );
  }

  const indent = (line) => line.length - line.trimStart().length;
  const base = indent(lines[start]);
  const steps = [];
  for (const line of lines.slice(start + 1)) {
    if (line.trim() === "") break;
    if (indent(line) <= base) break;
    const m = /npm run ([A-Za-z0-9:_-]+)/.exec(line);
    if (m) steps.push(m[1]);
  }

  if (steps.length === 0) {
    throw new Error("render.yaml's preDeployCommand names no `npm run` steps.");
  }
  return steps;
}

/**
 * The chain's `seed:*` steps mapped to the file each one runs, in order and
 * DEDUPLICATED — `seed:destinations` appears twice in the chain on purpose
 * (once before the pools and once after), and running its guards twice tells
 * you nothing the first run did not.
 */
export function seedScripts() {
  const seen = new Set();
  const out = [];
  for (const step of deployChain()) {
    if (!step.startsWith("seed:")) continue;
    const name = step.slice("seed:".length);
    if (seen.has(name)) continue;
    seen.add(name);
    out.push({ step, name, file: `scripts/seed-${name}.mjs` });
  }
  return out;
}
