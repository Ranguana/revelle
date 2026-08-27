import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

/**
 * A seeder may stock a pool. It may not sign for a world.
 *
 * ── THE LINE, AND WHY IT MOVED ───────────────────────────────────────
 *
 * Every seeder used to carry the same sentence: "deciding that something is
 * offered to a customer is a curator's decision and not a script's". It was
 * written when the only content was destinations, and it was right about what
 * it protected and wrong about its scope. A destination is an authored world.
 * A dish is an ingredient. One gate over both left 372 dishes waiting on a
 * signature that adds nothing, because nobody reads 372 dishes to decide
 * whether a dish may exist.
 *
 * So db/036 split them:
 *
 *   POOL CLASSES stock themselves — dish, drink, bank_item, menu, game,
 *   product, tracklist — and the desk vetoes rather than consents. `game`
 *   joined a round late (db/038): rule 13 did not name the table, and what
 *   settled it was that `bank_kind = 'game'` — the shipped kit for the same
 *   game — was already stocking itself, so one product category sat under two
 *   publication regimes.
 *
 *   GOVERNED CLASSES stay founder-signed — `world` (a destination, its gesture)
 *   and `world_voice` (how the house speaks). Each is a claim about a world or
 *   about the voice, and one of those reaching a member unread is a different
 *   kind of wrong from a dish doing it.
 *
 * This is rule 12's sibling: rule 12 catches a seeder that never runs; this
 * catches a seeder that runs and signs something it may not.
 */

/** Tables a seeder may never set to a live status. */
const GOVERNED = ["world", "world_voice"] as const;

/** Live values across the status enums in play. */
const LIVE = ["published", "active"] as const;

const SEEDERS = [
  "seed-destinations",
  "seed-menus",
  "seed-drinks",
  "seed-dishes",
  "seed-games",
  "seed-bank",
  "seed-occasion",
  "seed-fixtures",
];

test("no seeder gives a governed class a live status", () => {
  const root = new URL("../../", import.meta.url).pathname;
  // ONE EXEMPTION, and it is guarded by the property that justifies it.
  //
  // `seed-fixtures.mjs` publishes the worlds it invents, which is correct: it
  // builds throwaway rows for a bench, not catalogue a member can reach. The
  // exemption is safe ONLY while that seeder stays out of the deploy chain, so
  // that is asserted rather than assumed — the day somebody adds it to
  // `preDeployCommand`, this test fails and the exemption stops applying
  // instead of quietly covering a real offence.
  const EXEMPT = new Set(["seed-fixtures"]);
  const chain = readFileSync(`${root}render.yaml`, "utf8");
  for (const name of EXEMPT) {
    assert.ok(
      !new RegExp(`\\bseed:${name.replace(/^seed-/, "")}\\b`).test(chain),
      `${name} is exempt from the governed-class rule because it seeds a ` +
        `bench and never a member's catalogue. It is now in the deploy chain, ` +
        `so the exemption no longer holds — remove it from the chain or from EXEMPT.`
    );
  }

  const offences: string[] = [];

  for (const name of SEEDERS) {
    if (EXEMPT.has(name)) continue;
    let src: string;
    try {
      src = readFileSync(`${root}scripts/${name}.mjs`, "utf8");
    } catch {
      continue; // a seeder that does not exist cannot offend
    }
    // Comments argue about this rule constantly and must not trip it.
    const code = src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");

    for (const table of GOVERNED) {
      // TWO SHAPES, because the first one alone missed a live offence for as
      // long as this test has existed. `seed-destinations.mjs` writes
      //
      //   insert into world_voice (world_id, voice, status, ...)
      //   values ($1, $2::jsonb, 'published', ...)
      //
      // — the status is POSITIONAL, in a VALUES list, and never appears as
      // `status = '...'`. The assignment regex below could not see it, so a
      // governed class published itself on every deploy while this test stayed
      // green. CLAUDE.md rule 24: the guard was verified by reading it, not by
      // counting what it caught.
      const shapes = [
        // `update world set ... status = 'published'`, in any order, across lines.
        `(?:update|into)\\s+${table}\\b[\\s\\S]{0,400}?status\\s*=\\s*'(${LIVE.join("|")})'`,
        // `insert into world_voice (..., status, ...) values (..., 'published', ...)`
        // — a column list naming `status` and a live literal anywhere in the
        // statement that follows. Deliberately loose: a false positive here is
        // a seeder author writing one comment, and a false negative is a voice
        // reaching a member unsigned.
        `into\\s+${table}\\s*\\([^)]*\\bstatus\\b[^)]*\\)[\\s\\S]{0,400}?'(${LIVE.join("|")})'`,
      ];
      for (const shape of shapes) {
        const m = new RegExp(shape, "i").exec(code);
        if (m) {
          offences.push(`${name}.mjs writes ${table}.status = '${m[1]}'`);
          break;
        }
      }
    }
  }

  assert.deepEqual(
    offences,
    [],
    `a seeder is signing for a governed class:\n  ${offences.join("\n  ")}\n\n` +
      `Pool content stocks itself (db/036); destinations, gestures and voices ` +
      `stay founder-signed. If a governed class should now auto-publish, that ` +
      `is a decision to make in a migration and in CLAUDE.md, not in a seeder.`
  );
});
