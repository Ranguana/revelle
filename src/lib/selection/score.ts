/**
 * The arithmetic. Four small functions, no state, no database.
 *
 * Everything the engine ranks anything by is here, so that an argument about
 * whether the issuance penalty is too harsh is an argument with one function
 * and its test, rather than with a search algorithm.
 */

import type { EngineOptions, FacetTags, Issuance } from "./types.ts";

const DAY_MS = 86_400_000;

/**
 * WEIGHTED FACET OVERLAP — the score every stage is built on.
 *
 * A dot product over the facets the two sides share, normalised by the total
 * weight her vector carries so that a woman who answered nine questions and one
 * who answered four produce comparable numbers. Without the normalisation, a
 * destination's score would rise with how much we happen to know about the
 * customer, which is not a property of the destination.
 *
 * The sign arithmetic is worth stating, because all four cases are meaningful
 * and all four fall out of a plain multiplication:
 *
 *   she likes it,    it is that          -> positive. the match.
 *   she likes it,    it repudiates that  -> negative. the clash.
 *   she dislikes it, it is that          -> negative. the clash, from her side.
 *   she dislikes it, it repudiates that  -> positive. agreement about a no.
 *
 * The last one is not a curiosity — it is how "strongly NOT tropical
 * maximalism" in a cohort earns a destination that also repudiates it.
 */
export function facetOverlap(vector: FacetTags, tags: FacetTags): number {
  let total = 0;
  let mass = 0;

  for (const facetId in vector) {
    const v = vector[facetId];
    mass += Math.abs(v);
    const w = tags[facetId];
    if (w !== undefined) total += v * w;
  }

  if (mass < 1e-9) return 0;
  return total / mass;
}

/**
 * THE ISSUANCE PENALTY — a single multiplier, 0 < d ≤ 1.
 *
 * LinkedIn's impression discounting, which the spec cites: two features do the
 * work, HOW OFTEN a thing has been issued and HOW RECENTLY, each decaying
 * independently and combining multiplicatively.
 *
 *   frequency  exp(-α · times issued)          — smooth, never reaching zero
 *   recency    1 − w · 2^(-days / halfLife)    — worst the day after, fading
 *
 * The floor matters more than it looks. Without it, an ingredient issued a
 * dozen times is effectively deleted from the catalogue, and the thing that
 * gets issued a dozen times is usually the best thing in it. The floor turns
 * "stop using this" into "stop reaching for this first".
 *
 * Never issued -> exactly 1. A new ingredient is not penalised for being new.
 */
export function issuanceMultiplier(
  issuance: Issuance | null,
  now: Date,
  options: EngineOptions
): number {
  if (!issuance || issuance.issueCount === 0) return 1;

  const { frequencyDecay, recencyWeight, recencyHalfLifeDays, floor } =
    options.issuance;

  const frequency = Math.exp(-frequencyDecay * issuance.issueCount);

  let recency = 1;
  if (issuance.lastIssuedAt) {
    const days = Math.max(
      0,
      (now.getTime() - new Date(issuance.lastIssuedAt).getTime()) / DAY_MS
    );
    recency = 1 - recencyWeight * Math.pow(2, -days / recencyHalfLifeDays);
  }

  return Math.max(floor, frequency * Math.max(0, recency));
}

/**
 * Applies that multiplier as the SUBTRACTION the spec writes it as.
 *
 * `score = facet match + destination affinity − issuance penalty − …`
 *
 * Multiplying a negative base by d < 1 would IMPROVE it, which is the opposite
 * of a penalty and the kind of sign error that never shows up in a test that
 * only uses good candidates. So the penalty is taken from the positive part
 * only: identical to base × d wherever base > 0, and zero elsewhere.
 */
export function issuancePenalty(base: number, multiplier: number): number {
  return Math.max(0, base) * (1 - multiplier);
}

/**
 * How much two ingredients resemble each other, 0 to 1.
 *
 * Cosine over their facet tags, with negatives dropped: two things that both
 * repudiate novelty are not thereby similar to each other, and counting that
 * agreement as resemblance would push the search toward variety it has not
 * actually achieved.
 */
export function similarity(a: FacetTags, b: FacetTags): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (const id in a) {
    const w = Math.max(0, a[id]);
    normA += w * w;
    const other = b[id];
    if (other !== undefined) dot += w * Math.max(0, other);
  }
  for (const id in b) normB += Math.max(0, b[id]) ** 2;

  if (normA < 1e-12 || normB < 1e-12) return 0;
  return dot / Math.sqrt(normA * normB);
}

/**
 * THE SIMILARITY DISCOUNT — the spec's fourth term, ten lines as promised.
 *
 * Each candidate is penalised by how much it resembles the MOST similar thing
 * already placed, not by the average. The maximum is the right statistic: an
 * edit of six things where two are near-identical reads as a mistake however
 * varied the other four are, and an average would hide exactly that.
 *
 * ── PROPORTIONAL, NOT ABSOLUTE, AND THIS WAS A BUG ───────────────────
 *
 * The discount is a FRACTION of what the candidate was worth, not a flat
 * subtraction. Written flat it looks like the spec's arithmetic and behaves
 * nothing like it: facet overlap is normalised by the whole preference vector,
 * so a good ingredient scores around 0.1, while γ·cosine reaches 0.5. Every
 * optional slot after the first then scored negative and was skipped, and the
 * engine quietly built half a Revelle and reported no reason for it, because
 * from its own point of view nothing had gone wrong.
 *
 * Proportional says the intended thing — "this is worth less because it repeats
 * something" — and cannot flip a candidate's sign. Same reasoning as the
 * issuance penalty being taken from the positive part only.
 */
export function similarityDiscount(
  base: number,
  candidate: FacetTags,
  chosen: readonly FacetTags[],
  gamma: number
): number {
  let worst = 0;
  for (const other of chosen) {
    const s = similarity(candidate, other);
    if (s > worst) worst = s;
  }
  return Math.max(0, base) * gamma * worst;
}
