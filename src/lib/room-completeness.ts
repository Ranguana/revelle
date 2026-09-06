/**
 * WHAT A ROOM OWES, COMPUTED FROM THE POOL REGISTRY.
 *
 * ── THE RULE THIS FILE IS BUILT AROUND ───────────────────────────────
 *
 * CLAUDE.md rule 19: THE REGISTRY IS THE ONLY TRUTH, AND HAND-WRITTEN LISTS OF
 * POOLS LIE IN WAIT. Its worst instance is the one this file must not repeat —
 * `portal/occasions.ts` spelled five pools out by hand, omitted `dish` and
 * `bank_item`, and a member's package would have rendered minus its dishes with
 * no error and no gap message. A completeness report that enumerates pools by
 * hand has exactly that defect, and it is worse here because the whole point of
 * the report is to say what is missing.
 *
 * So the pool list comes from `POOL_ENTITIES` and nowhere else. When a tenth
 * pool is registered this file starts reporting on it without being edited, and
 * if it cannot read that pool's source it says SO rather than scoring it zero.
 *
 * ── NO DATABASE, AND THAT IS NOT A COMPROMISE ────────────────────────
 *
 * `DATABASE_URL` is a placeholder on every laptop and `ipAllowList: []` means
 * no laptop can reach production anyway (rule 9). Every pool in this catalogue
 * is SEEDED FROM FILES — `docs/dishes.md`, `docs/drinks.md`,
 * `docs/atmosphere-idea-bank-v1.md`, `src/lib/games.ts` — so what a room holds
 * is computable from the seed sources without one.
 *
 * WHERE A POOL'S SOURCE CANNOT BE READ, THE ANSWER IS `unknown`, NEVER ZERO.
 * Rule 26's trap, in a new place: a pair can read as disjoint because neither
 * room has anything, and a room can read as complete because nothing could be
 * counted. `unknown` must never be allowed to read as `nothing owed`, and the
 * verdict below refuses to pass on an unknown.
 */

import { POOL_ENTITIES } from "./pools/registry.ts";
import { DESTINATIONS, DESTINATION_TONES } from "./destinations.ts";
// EVIDENCE_FLOORS is NOT imported. It lives in scripts/deliverables.mjs, which
// is its one owner (rule 21), and reaching across the .ts/.mjs boundary to get
// it would either duplicate the numbers here or couple this module to a script.
// The caller reads it from the owner and passes it in as `dishFloor`.
import { foodIdentityClaim } from "./food-identity.ts";
import { matrixRow, isAuthored } from "./matrix.ts";

export type PoolState = "held" | "empty" | "unknown" | "retired" | "not-scoped";

export type PoolReport = {
  pool: string;
  state: PoolState;
  count: number | null;
  floor: number | null;
  source: string;
  note: string;
};

/** Pools that are not scoped to a world at all — nothing for a room to owe. */
const NOT_WORLD_SCOPED = new Set(["taste_cohort", "world"]);

/** Retired pools, with the migration that retired them. */
const RETIRED: Readonly<Record<string, string>> = {
  menu: "retired by db/045; a new section seeds `discontinued` and reaches nobody",
};

/**
 * Count `- ` lines under a `## <heading>` section of a markdown document.
 * Returns null when the document or the heading is absent — the caller turns
 * that into `unknown`, never into 0.
 */
export function countUnderHeading(
  markdown: string | null,
  heading: string
): number | null {
  if (markdown === null) return null;
  const lines = markdown.split("\n");
  let inSection = false;
  let n = 0;
  let found = false;
  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+?)\s*$/);
    if (h2) {
      inSection = h2[1].trim() === heading;
      if (inSection) found = true;
      continue;
    }
    if (inSection && /^-\s+\S/.test(line)) n++;
  }
  return found ? n : null;
}

/** Count the `**N.M**` drink entries under a `## <heading>` section. */
export function countDrinksUnderHeading(
  markdown: string | null,
  heading: string
): number | null {
  if (markdown === null) return null;
  const lines = markdown.split("\n");
  let inSection = false;
  let n = 0;
  let found = false;
  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+?)\s*$/);
    if (h2) {
      inSection = h2[1].trim() === heading;
      if (inSection) found = true;
      continue;
    }
    if (inSection && /^\*\*\d+\.\d+\*\*/.test(line)) n++;
  }
  return found ? n : null;
}

export type Sources = {
  /** `docs/dishes.md`, or null if unreadable. */
  dishes: string | null;
  /** `docs/drinks.md`, or null if unreadable. */
  drinks: string | null;
  /** The heading this room is filed under in those documents. */
  heading: string | null;
  /** Native game count, from `src/lib/games.ts`. Null if unreadable. */
  games: number | null;
  /** Bank rows and gesture, from `seed-bank.mjs --dry-run`. Null if not run. */
  bankItems: number | null;
  gesture: string | null;
  /** The evidence floor for this room's declared identity, from its owner. */
  dishFloor: number | null;
};

/**
 * Every registered pool, and what the room holds in it.
 *
 * ITERATES THE REGISTRY. A pool with no reader here returns `unknown` with the
 * reason, which is the honest answer and is what keeps a new pool from being
 * silently scored as satisfied.
 */
export function poolReports(slug: string, sources: Sources): PoolReport[] {
  const claim = foodIdentityClaim(slug);
  const dishFloor = sources.dishFloor;

  return POOL_ENTITIES.map(({ pool }): PoolReport => {
    if (NOT_WORLD_SCOPED.has(pool))
      return {
        pool,
        state: "not-scoped",
        count: null,
        floor: null,
        source: "—",
        note: "not a world-scoped ingredient; a room owes nothing here",
      };
    if (RETIRED[pool])
      return {
        pool,
        state: "retired",
        count: null,
        floor: null,
        source: "—",
        note: RETIRED[pool],
      };

    switch (pool) {
      case "dish": {
        const n = sources.heading
          ? countUnderHeading(sources.dishes, sources.heading)
          : null;
        return {
          pool,
          state: n === null ? "unknown" : n > 0 ? "held" : "empty",
          count: n,
          floor: dishFloor,
          source: "docs/dishes.md",
          note:
            n === null
              ? sources.heading
                ? `no "## ${sources.heading}" section`
                : "room has no registered heading"
              : claim
                ? `floor ${dishFloor} for a declared ${claim.identity} room`
                : "no food identity declared, so no floor applies",
        };
      }
      case "drink": {
        const n = sources.heading
          ? countDrinksUnderHeading(sources.drinks, sources.heading)
          : null;
        return {
          pool,
          state: n === null ? "unknown" : n > 0 ? "held" : "empty",
          count: n,
          floor: null,
          source: "docs/drinks.md",
          note:
            n === null
              ? sources.heading
                ? `no "## ${sources.heading}" section`
                : "room has no registered heading"
              : "every drink owes a mocktail mirror (db/060)",
        };
      }
      case "game":
        return {
          pool,
          state:
            sources.games === null ? "unknown" : sources.games > 0 ? "held" : "empty",
          count: sources.games,
          floor: null,
          source: "src/lib/games.ts",
          note: "native claims only; rule 29 — `games: none` is not a ruling",
        };
      case "bank_item":
        return {
          pool,
          state:
            sources.bankItems === null
              ? "unknown"
              : sources.bankItems > 0
                ? "held"
                : "empty",
          count: sources.bankItems,
          floor: null,
          source: "docs/atmosphere-idea-bank-v1.md via seed-bank --dry-run",
          note:
            sources.bankItems === null
              ? "the seeder dry run did not report this room"
              : "no founder floor; the bank document argues austere rooms down",
        };
      case "product":
      case "tracklist":
        return {
          pool,
          state: "empty",
          count: 0,
          floor: null,
          source: "—",
          note: "no authored product or tracklist exists in the repo, for any room (scripts/seed-occasion.mjs)",
        };
      default:
        return {
          pool,
          state: "unknown",
          count: null,
          floor: null,
          source: "—",
          note: "REGISTERED POOL WITH NO READER HERE — add one rather than assuming zero (rule 19)",
        };
    }
  });
}

export type RoomCheckItem = {
  label: string;
  ok: boolean | null;
  detail: string;
};

/** The non-pool obligations: a row, a voice, tones, an identity, a heading. */
export function structuralItems(slug: string, sources: Sources): RoomCheckItem[] {
  const room = (DESTINATIONS as Record<string, unknown>)[slug] as
    | { voice?: unknown; look?: unknown }
    | undefined;
  const tones = (DESTINATION_TONES as Record<string, readonly unknown[]>)[slug];
  const claim = foodIdentityClaim(slug);
  const row = matrixRow(slug);

  return [
    {
      label: "matrix row",
      ok: row !== undefined,
      detail: row ? row.join(" · ") : "no row in data/destination-matrix.json",
    },
    {
      label: "signed onto `authored`",
      ok: isAuthored(slug),
      detail: isAuthored(slug)
        ? "signed"
        : "NOT SIGNED — draft or proposed. Admission is a signature (rule 13)",
    },
    {
      label: "voice object",
      ok: Boolean(room?.voice),
      detail: room?.voice ? "written" : "no entry in src/lib/destinations.ts",
    },
    {
      label: "tone hand",
      ok: tones ? tones.length >= 6 && tones.length <= 13 : false,
      detail: tones
        ? `${tones.length} tones (6–13 allowed)`
        : "no entry in DESTINATION_TONES",
    },
    {
      label: "food identity",
      ok: Boolean(claim),
      detail: claim
        ? `${claim.identity}, floor ${sources.dishFloor ?? "?"}`
        : "not declared in src/lib/food-identity.ts",
    },
    {
      label: "heading registered",
      ok: sources.heading !== null,
      detail:
        sources.heading !== null
          ? `"## ${sources.heading}" in scripts/catalogue-vocabulary.mjs`
          : "UNREGISTERED — the seeders fail the deploy on an unknown heading",
    },
    {
      label: "signature gesture",
      ok: sources.gesture !== null && !sources.gesture.startsWith("NULL"),
      detail:
        sources.gesture === null
          ? "no GESTURE clause in docs/atmosphere-idea-bank-v1.md"
          : sources.gesture.startsWith("NULL")
            ? "held at NULL with its reason — founder decides (rule 17)"
            : sources.gesture,
    },
  ];
}
