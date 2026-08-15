/**
 * The selection engine's front door.
 *
 *   import { selectCandidates } from "@/lib/selection";
 *   const candidates = await selectCandidates(pool, applicationId);
 *
 * Two layers, and the seam between them is the point:
 *
 *   selectCandidates / selectForApplication   take a database handle
 *   runSelection                              takes a snapshot, returns
 *                                             candidates, touches nothing
 *
 * The engine never writes. Persisting a chosen candidate, recording issuance
 * and stamping a fingerprint belong to whoever called it — which will be a job
 * rather than a request handler, and a job has to be safe to retry.
 *
 * See docs/selection-spec.md for what each stage is and why.
 */

export {
  selectCandidates,
  selectForApplication,
  loadSelectionInput,
  type Queryable,
} from "./catalogue.ts";

export { runSelection } from "./engine.ts";

export { buildVector, inheritDestination, topMatches } from "./vector.ts";
export { chooseDestinations, type Shortlist } from "./destination.ts";
export { planSlots, occasionEligibility, humanOccasion } from "./occasion.ts";
export { scopePools, fillSlots, formatCents, type Fill, type SlotPool } from "./fill.ts";
export {
  assemblageFingerprint,
  fingerprintOfPicks,
  ensureNovel,
} from "./novelty.ts";
export { explain } from "./explain.ts";
export { dither, rng, arbitrarySeed, type Rng } from "./rng.ts";
export {
  facetOverlap,
  issuanceMultiplier,
  issuancePenalty,
  similarity,
  similarityDiscount,
} from "./score.ts";

export * from "./types.ts";
