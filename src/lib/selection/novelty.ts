/**
 * STAGE 5 — novelty, and the local backtrack.
 *
 * Fingerprint the assemblage, check it against everything already delivered,
 * and ON COLLISION SWAP THE LEAST LOAD-BEARING INGREDIENT. Never restart.
 *
 * ── WHY THAT RULE IS NOT A MICRO-OPTIMISATION ────────────────────────
 *
 * Local rules propagate cheaply. A rule that spans the WHOLE SET — a budget
 * ceiling, one-from-each-category, never-issued — is a global constraint, and
 * restart-on-failure falls off a cliff there: the same generation problem has
 * been taken from zero conflicts to unable-to-finish by adding a single global
 * rule. Uniqueness is exactly that class of rule.
 *
 * So the repair is local and it is ours. Find the pick that is contributing
 * least, replace it with the next-best thing that still fits the budget, and
 * ask again. The rest of the assemblage — which was fine — is not thrown away.
 *
 * ── THE DIGEST, AND ITS RELATIONSHIP TO THE ONE IN SQL ───────────────
 *
 * Same rule as compute_assemblage_fingerprint() in db/002: the sorted, distinct
 * set of `pool:uuid` keys, sha256, prefixed with the rule version. Order and
 * slot are excluded — the digest is over the SET, so the same nine things
 * rearranged is the same assemblage and the second one is rejected.
 *
 * One honest caveat. PostgreSQL's `order by` inside that function uses the
 * database's collation; this sorts by UTF-16 code unit, which is byte order.
 * On a C-collation database the two produce identical strings. On any other
 * they may not, and IT DOES NOT MATTER, because these two digests are never
 * compared with each other: the database's digest enforces the promise at
 * delivery, and this one is the search's own mirror, computed on both sides of
 * every comparison it makes (see catalogue.ts, which recomputes the issued
 * digests from ingredient rows rather than reading the stored column). What
 * both agree on is the only thing that has to be true — the same set of
 * ingredients always yields the same digest.
 */

import { createHash } from "node:crypto";

import type {
  DroppedPick,
  EngineOptions,
  Pick,
  Scale,
  Swap,
} from "./types.ts";
import type { SlotPool } from "./fill.ts";
import { formatCents } from "./fill.ts";

export type AssemblageItem = { pool: string; id: string };

export function assemblageFingerprint(
  worldId: string | null,
  items: readonly AssemblageItem[]
): string | null {
  const keys = new Set<string>();
  if (worldId) keys.add(`world:${worldId}`);
  for (const item of items) {
    if (item.pool === "world") continue;
    keys.add(`${item.pool}:${item.id}`);
  }
  if (keys.size === 0) return null;

  const canonical = [...keys].sort().join("|");
  return `a1:${createHash("sha256").update(canonical, "utf8").digest("hex")}`;
}

export function fingerprintOfPicks(
  worldId: string,
  picks: readonly Pick[]
): string | null {
  return assemblageFingerprint(
    worldId,
    picks.map((p) => ({ pool: p.ingredient.pool, id: p.ingredient.id }))
  );
}

export type NoveltyOutcome = {
  picks: Pick[];
  fingerprint: string | null;
  swaps: Swap[];
  dropped: DroppedPick[];
  /** False when even the backtrack could not find an unissued assemblage. */
  novel: boolean;
  attempts: number;
};

export function ensureNovel(
  picks: readonly Pick[],
  pools: Map<string, SlotPool>,
  worldId: string,
  issued: ReadonlySet<string>,
  scale: Scale,
  options: EngineOptions
): NoveltyOutcome {
  let current = [...picks];
  let fingerprint = fingerprintOfPicks(worldId, current);
  const swaps: Swap[] = [];
  const dropped: DroppedPick[] = [];
  let attempts = 0;

  if (fingerprint === null || !issued.has(fingerprint)) {
    return { picks: current, fingerprint, swaps, dropped, novel: true, attempts };
  }

  const ceiling =
    scale.budgetCeiling === null ? null : Math.round(scale.budgetCeiling * 100);

  while (attempts < options.maxBacktracks) {
    attempts += 1;

    const target = leastLoadBearing(current, pools);
    if (!target) break;

    const { index, alternatives } = target;
    const pick = current[index];
    const used = new Set(
      current.map((p) => `${p.ingredient.pool}:${p.ingredient.id}`)
    );

    let swapped = false;
    for (const alternative of alternatives) {
      const key = `${alternative.ingredient.pool}:${alternative.ingredient.id}`;
      if (used.has(key)) continue;

      const cost = totalCost(current, index, alternative.unitCost, pick.slot.quantity);
      if (ceiling !== null && cost > ceiling) continue;

      const replacement: Pick = {
        ...pick,
        ingredient: alternative.ingredient,
        unitCost: alternative.unitCost,
        lineCost:
          alternative.unitCost === null
            ? null
            : alternative.unitCost * pick.slot.quantity,
        facetMatch: alternative.facetMatch,
        affinity: alternative.affinity,
        issuancePenalty: 0,
        score: alternative.base,
      };

      const trial = [...current];
      trial[index] = replacement;
      const trialPrint = fingerprintOfPicks(worldId, trial);
      if (trialPrint === null || issued.has(trialPrint)) continue;

      swaps.push({
        slotLabel: pick.slot.label,
        from: pick.ingredient.name,
        to: alternative.ingredient.name,
        reason:
          `this exact set of ingredients has already been delivered to ` +
          `someone. ${pick.ingredient.name} was carrying the least of the ` +
          `assemblage, so it is the one that moved.`,
      });
      current = trial;
      fingerprint = trialPrint;
      swapped = true;
      break;
    }

    if (swapped && fingerprint !== null && !issued.has(fingerprint)) {
      return {
        picks: current,
        fingerprint,
        swaps,
        dropped,
        novel: true,
        attempts,
      };
    }

    if (!swapped) {
      // Nothing left to swap into that slot. Dropping an OPTIONAL pick changes
      // the set too, and is a smaller loss than an assemblage we cannot issue.
      if (!pick.slot.required) {
        dropped.push({
          slot: pick.slot,
          ingredientName: pick.ingredient.name,
          lineCost: pick.lineCost,
          reason: "collision",
          detail:
            `dropped rather than repeated: the set including it has already ` +
            `been delivered, and nothing else in the ${pick.slot.pool} pool ` +
            `could take its place` +
            (pick.lineCost ? ` (${formatCents(pick.lineCost)} back)` : ""),
        });
        current = current.filter((_, i) => i !== index);
        fingerprint = fingerprintOfPicks(worldId, current);
        if (fingerprint !== null && !issued.has(fingerprint)) {
          return {
            picks: current,
            fingerprint,
            swaps,
            dropped,
            novel: true,
            attempts,
          };
        }
        continue;
      }
      break;
    }
  }

  return {
    picks: current,
    fingerprint,
    swaps,
    dropped,
    novel: fingerprint !== null && !issued.has(fingerprint),
    attempts,
  };
}

/**
 * THE LEAST LOAD-BEARING PICK.
 *
 * Load-bearing is not the same as high-scoring. A pick is load-bearing when
 * removing it would change what the Revelle IS: a required slot, or one with
 * nothing else that could have filled it. So the order is
 *
 *   optional before required, then fewest points contributed, then most
 *   alternatives available
 *
 * and the first entry with somewhere to go is the one that moves. A pick with
 * no alternatives at all is skipped rather than returned, because "swap it" is
 * not an instruction that can be carried out.
 */
function leastLoadBearing(
  picks: readonly Pick[],
  pools: Map<string, SlotPool>
): { index: number; alternatives: SlotPool["candidates"] } | null {
  const ranked = picks
    .map((pick, index) => {
      const pool = pools.get(pick.slot.key);
      const alternatives = (pool?.candidates ?? []).filter(
        (c) => c.ingredient.id !== pick.ingredient.id
      );
      return { index, pick, alternatives };
    })
    .filter((entry) => entry.alternatives.length > 0)
    .sort(
      (a, b) =>
        Number(a.pick.slot.required) - Number(b.pick.slot.required) ||
        a.pick.score - b.pick.score ||
        b.alternatives.length - a.alternatives.length
    );

  return ranked.length > 0
    ? { index: ranked[0].index, alternatives: ranked[0].alternatives }
    : null;
}

function totalCost(
  picks: readonly Pick[],
  replacingIndex: number,
  newUnitCost: number | null,
  quantity: number
): number {
  let total = 0;
  picks.forEach((pick, i) => {
    if (i === replacingIndex) {
      total += newUnitCost === null ? 0 : newUnitCost * quantity;
      return;
    }
    total += pick.lineCost ?? 0;
  });
  return total;
}
