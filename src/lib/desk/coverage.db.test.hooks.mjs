/**
 * A MODULE RESOLVER FOR ONE TEST, so that the test can drive the REAL board.
 *
 * ── WHY THIS EXISTS ──────────────────────────────────────────────────
 *
 * The founder, on the shape of the drift guard beside this file:
 *
 *   "There's a version of it that's vacuous: if both the board and the
 *    reporter call the shared module and the test calls the shared module
 *    twice, it can never fail — it's testing the function against itself. For
 *    the test to catch the failure it exists for (someone adds a second path
 *    next month), it has to exercise both consumers end-to-end."
 *
 * Exercising the board consumer end-to-end means calling `board()` in
 * src/lib/desk/coverage.ts — the exact function the page calls. That module is
 * a Next server module: it opens with `import "server-only"` and reaches its
 * dependencies through the `@/` alias. Both are resolved by the bundler and by
 * nothing else, so `node --test` cannot load it, which is why every existing
 * test in this repo tests a module deliberately kept framework-free.
 *
 * Two ways out, and the cheaper one is not the safer one:
 *
 *   REFACTOR THE BOARD until Node can load it. That means unpicking
 *   src/lib/desk/labels.ts, which reaches `@/lib/quiz`, which is itself
 *   `server-only` — a cascade through modules this change has no business in,
 *   to make a screen easier to test. Rejected.
 *
 *   TEACH NODE THE TWO THINGS THE BUNDLER KNOWS, which is this file: `@/x`
 *   means `src/x`, and `server-only` is a marker with no runtime. Fourteen
 *   lines, scoped to the one test that registers it, and the module under test
 *   is byte-for-byte the module the page imports.
 *
 * `.mjs` and not `.ts`, and named `*.test.hooks.mjs` rather than `*.test.ts`,
 * so `npm test`'s glob does not pick it up as a test file. It is loaded by
 * `module.register()` from ./coverage.db.test.ts and by nothing else.
 */
import { pathToFileURL } from "node:url";

/** The repo's `src/`, derived from this file rather than from cwd. */
const SRC = new URL("../../", pathToFileURL(import.meta.filename)).href;

export async function resolve(specifier, context, next) {
  // The marker Next replaces at build time. It has no runtime meaning and
  // deliberately fails to resolve outside a bundler, which is the whole point
  // of it; an empty module is exactly what the bundler substitutes.
  if (specifier === "server-only" || specifier === "client-only") {
    return { url: "data:text/javascript,export{}", shortCircuit: true };
  }

  // tsconfig.json: "paths": { "@/*": ["./src/*"] }. Extensionless specifiers
  // are TypeScript's habit and Node's refusal, so the extension is restored
  // here — the same job `moduleResolution: bundler` does for the build.
  if (specifier.startsWith("@/")) {
    const rest = specifier.slice(2);
    const file = /\.[a-z]+$/.test(rest) ? rest : `${rest}.ts`;
    return { url: SRC + file, shortCircuit: true };
  }

  return next(specifier, context);
}
