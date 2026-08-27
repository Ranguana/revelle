/**
 * THE CATALOGUE CHAIN — the ordered list of npm steps that stock a database.
 *
 * ── WHY IT IS A MODULE AND NOT AN ARRAY IN THE ROUTE ─────────────────
 *
 * Two surfaces run this chain and they must agree about it:
 *
 *   the DEPLOY        `preDeployCommand` in render.yaml
 *   the SYNC BUTTON   src/app/api/desk/seed/route.ts, from /desk/stocked
 *
 * They cannot be one object — a YAML blueprint cannot import a TypeScript
 * module — so CLAUDE.md rule 21's fallback applies: one authority on this side,
 * and a guard that goes THROUGH THE CONSUMERS to compare it with the other.
 * `src/lib/deploy.test.ts` parses render.yaml's chain and asserts it names the
 * same steps in the same order as this list.
 *
 * ── THE DRIFT THAT ALREADY HAPPENED, KEPT AS THE REASON ──────────────
 *
 * The route's array carried the comment "Exactly the preDeployCommand
 * render.yaml carries, in order" for four days while it did not: `seed:bank`
 * entered render.yaml on 2026-08-23 and never entered the array, so pressing
 * the button stocked a catalogue with 180 bank rows, seventeen gestures and six
 * draft room stubs missing, and nothing said anything. The button exists
 * BECAUSE render.yaml and the live service had drifted (rule 20); it had then
 * quietly grown a drift of its own.
 *
 * Framework-free on purpose — no `server-only`, no `@/` — so that `node --test`
 * can read it directly, which is what makes the guard cheap enough to run on
 * every commit.
 */

/** One step: an npm script name, then any arguments, exactly as `npm run` takes them. */
export type ChainStep = readonly [string, ...string[]];

/**
 * `migrate` is NOT here, and its absence is a decision rather than an omission.
 *
 * The deploy runs it first — `src/lib/deploy.test.ts` asserts that it does, and
 * that it is first — because a seeder writing into a schema that has not moved
 * fails on a real database and passes on a fresh one. The BUTTON does not run
 * it: a schema change belongs to a deploy, where a non-zero exit keeps the old
 * instance serving, and not to a click. The deploy-chain comparison below
 * therefore compares render.yaml's chain WITHOUT its leading migrate.
 */
export const CATALOGUE_CHAIN: readonly ChainStep[] = [
  ["seed:destinations"],
  ["seed:menus"],
  ["seed:drinks"],
  // 650 authored lines into 600 dish rows. By far the longest step here.
  ["seed:dishes"],
  ["seed:games"],
  // 180 authored bank rows, seventeen gestures and six draft room stubs.
  ["seed:bank"],
  // Twice on purpose: the menu, drink and dish seeders create a draft stub for
  // a destination that has content and no authored look, and this is what
  // completes a stub once somebody writes the voice.
  ["seed:destinations"],
  // LAST, AND THAT IS THE WHOLE POINT OF IT. Anything computed over content
  // runs after content exists — CLAUDE.md rule 22. It writes the venue
  // requirement tags db/020 and db/033 have failed to write on every build
  // since they were written (they match authored text, and `migrate` runs
  // before every seeder) and `drink.season_strict`, which no seeder has ever
  // written. One exported function, `tagCatalogue()` in
  // src/lib/catalogue/tagging.ts; scripts/tag-catalogue.mjs is its wrapper and
  // both callers run that wrapper.
  ["tag:catalogue"],
];

/** The step that must come last, by name, so the assertion is not positional. */
export const POST_SEED_STEP = "tag:catalogue";
