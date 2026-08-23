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
  loadCatalogue,
  type Queryable,
} from "./catalogue.ts";

export { runSelection } from "./engine.ts";

/**
 * THE MEMBER'S SIDE OF THE WALL.
 *
 * memberRevelle() is the only sanctioned way from a Candidate to something a
 * member may see, and MemberRevelle structurally cannot carry the house's
 * fields. A surface she looks at imports these and nothing else from here.
 */
export {
  memberRevelle,
  type MemberDestination,
  type MemberPiece,
  type MemberPrintedPiece,
  type MemberRevelle,
  type MemberSection,
} from "./member.ts";

export { buildVector, inheritDestination, topMatches } from "./vector.ts";
export { chooseDestinations, type Shortlist } from "./destination.ts";
export {
  planSlots,
  occasionEligibility,
  humanOccasion,
  type SlotPlan,
} from "./occasion.ts";
export { hostExclusions, type ExclusionAnswers } from "./exclusions.ts";
export { scopePools, fillSlots, formatCents, type Fill, type SlotPool } from "./fill.ts";
export {
  assemblageFingerprint,
  fingerprintOfPicks,
  ensureNovel,
} from "./novelty.ts";
/**
 * THE STRUCTURAL MATRIX, HER SIDE OF IT. Exported so that the wiring change
 * described at the top of structure.ts is an import and a call rather than a
 * new module — nothing in src/ consumes these yet, and the file says so.
 */
export {
  STRUCTURAL_FACETS,
  STRUCTURAL_LEVELS,
  STRUCTURAL_SUPPLIERS,
  FED_FACETS,
  rowFromCells,
  statedEnding,
  statedStartHour,
  statedStructure,
  structureOf,
  structuralDistance,
  rankByStructure,
  type StructuralFacet,
  type StructuralRow,
} from "./structure.ts";

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
