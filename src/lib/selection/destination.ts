/**
 * STAGE 2 — choose the destination. The collection key.
 *
 * The single most consequential decision in the system, and the reason every
 * later stage is cheap: once this is chosen, every pool downstream is already
 * scoped to it and nothing has to know that tiki glasses clash with linen.
 *
 * Order of operations, and the order is the argument:
 *
 *   1. FILTER on dealbreakers. Not a penalty. If she said no costume rule, a
 *      destination built on a costume rule is gone at any score — treating it
 *      as a large negative weight is what lets a high-scoring match sneak one
 *      through, and it would sneak through on exactly the customers who scored
 *      the most strongly on everything else.
 *   2. FILTER on the occasion, but only where a destination has explicitly
 *      refused it. The default is that a destination carries every occasion;
 *      see db/009.
 *   3. FILTER on the VOICE. A tier, not a weight — see below.
 *   4. RANK what survives, on the AESTHETIC half of her vector.
 *   5. PENALISE recently-issued destinations, so the catalogue spreads.
 *   6. DITHER, within the survivors, and take the top few.
 *
 * ── THE VENUE IS NOT ON THAT LIST, AND NEVER WILL BE ─────────────────
 *
 *   "Venue never touches the destination — that's the thesis of the product…
 *    Havana in a Brooklyn apartment isn't a compromise, it's the pitch."
 *
 * `environment` has zero weight here. It is a non-taste dimension in vector.ts,
 * db/020 refuses to let an environment facet be tagged onto a destination at
 * all, and selection.test.ts fails with the thesis in the message if anybody
 * reconnects it. What the room does instead is prune the POOL at stage 3 —
 * src/lib/selection/venue.ts.
 *
 * ── VOICE IS A FILTER, AESTHETIC IS A RANK ───────────────────────────
 *
 *   "Not a bigger weight — a TIER."
 *
 * Tone facets threshold-filter; aesthetic facets rank within the survivors.
 * They are never averaged, because averaging two axes produces the destination
 * that is middling on both — the compromise that is nobody's. The whole
 * argument, and the argument for resolving tones into voice facets before
 * comparing them, is in tone.ts.
 *
 * A hard clash — the tone filter leaves nothing — is FIRST A CATALOGUE GAP.
 * "The conflict exists only because your catalog lacks that destination." It
 * is recorded through the ordinary gap channel, which reaches the desk's
 * authoring queue, BEFORE the engine makes any decision about how to proceed.
 *
 * ── WHERE THE DITHER IS APPLIED ──────────────────────────────────────
 *
 * On the CURATOR'S SHORTLIST, never on a delivered Revelle. Netflix can afford
 * to explore on a live recommendation because the regret is amortised over a
 * hundred million members; Revelle has few customers and each deliverable is
 * expensive, so exploring on a delivered one is a bad trade. The curator
 * absorbs the exploration risk, and her rejecting a dithered candidate is
 * itself the signal we wanted from the exploration.
 *
 * AND IT IS APPLIED TO THE SURVIVORS ONLY. Exploration may trade one
 * voice-true destination for another; it may never resurrect an aesthetic
 * winner the tone filter killed. That falls out of the shape of this function —
 * eliminated destinations are not in the array `dither` is handed — and
 * selection.test.ts asserts it across many seeds rather than trusting it.
 */

import { dither, type Rng } from "./rng.ts";
import { facetOverlap, issuanceMultiplier, issuancePenalty } from "./score.ts";
import { occasionEligibility } from "./occasion.ts";
import { isSilent, isToneFacet, toneMatch, voiceProfileOfTags } from "./tone.ts";
import type {
  CatalogueGap,
  Destination,
  Elimination,
  EngineOptions,
  Facet,
  FacetTags,
  OccasionCode,
  PreferenceVector,
} from "./types.ts";

export type ScoredDestination = {
  destination: Destination;
  /** Overlap before the issuance penalty. AESTHETIC ONLY — see toneMatch. */
  rawScore: number;
  /**
   * How much this destination sounds like her people. −1..1.
   *
   * NULL when it could not be judged — either she named no tones, or the
   * destination carries none. Both are silence, and silence is never a failing
   * score. See the two notes at the filter.
   */
  toneMatch: number | null;
  issuancePenalty: number;
  score: number;
  /** On merit, 1-based. */
  rank: number;
  /** After the dither, 1-based. This is the order the curator sees. */
  ditheredRank: number;
};

export type Shortlist = {
  shortlist: ScoredDestination[];
  eliminated: Elimination[];
  /** Set when the filters left nothing. Names the constraints that conflict. */
  impasse: string | null;
  /**
   * WHAT THE HOUSE MUST AUTHOR, discovered at stage 2 rather than at stage 4.
   *
   * A taste/voice clash is a work order — "the house lacks a
   * wedding-reception-register destination" — and it travels the same channel
   * as a thin pool so that src/lib/revelle/generate.ts hands it to
   * `recordCatalogueGaps` with no new seam.
   */
  gaps: CatalogueGap[];
  /** True when her tone answers left nothing above the bar. */
  voiceClash: boolean;
  /** Set when the tone question was never answered; the filter is then inert. */
  toneSilent: boolean;
};

export function chooseDestinations(
  destinations: readonly Destination[],
  vector: PreferenceVector,
  occasion: OccasionCode,
  facets: Record<string, Facet>,
  options: EngineOptions,
  random: Rng,
  now: Date
): Shortlist {
  const eliminated: Elimination[] = [];
  const gaps: CatalogueGap[] = [];
  const survivors: Destination[] = [];

  const dealbreakers = new Set(vector.dealbreakers);

  for (const destination of destinations) {
    // ── 1. dealbreakers, as a filter ─────────────────────────────────
    // Only a POSITIVE tag eliminates. A destination tagged -0.9 on a costume
    // rule is one that repudiates costumes, and eliminating it because the
    // word appears in its tags would be exactly backwards.
    const offending: string[] = [];
    for (const facetId of dealbreakers) {
      const weight = destination.facets[facetId];
      if (weight !== undefined && weight > 0) {
        const term = vector.terms[facetId];
        offending.push(term ? term.facet.label.toLowerCase() : facetId);
      }
    }

    if (offending.length > 0) {
      eliminated.push({
        destinationName: destination.name,
        reason: `it carries ${joinWords(offending)}, which she said would ruin it`,
        tier: "dealbreaker",
        toneMatch: null,
      });
      continue;
    }

    // ── 2. an occasion the destination has refused ───────────────────
    const verdict = occasionEligibility(destination.occasions, occasion);
    if (!verdict.eligible) {
      eliminated.push({
        destinationName: destination.name,
        reason: verdict.reason,
        tier: "occasion",
        toneMatch: null,
      });
      continue;
    }

    survivors.push(destination);
  }

  if (survivors.length === 0) {
    return {
      shortlist: [],
      eliminated,
      impasse: impasseMessage(eliminated, destinations.length),
      gaps,
      voiceClash: false,
      toneSilent: true,
    };
  }

  // ── 3. THE VOICE FILTER ────────────────────────────────────────────
  //
  // Her tones, resolved into the voice vocabulary, against each destination's.
  // A destination below the bar is OUT — the aesthetic ranking below never sees
  // it, and neither does the dither.
  const hers = voiceProfileOfTags(vector.weights, facets);

  // THE QUESTION SHE NEVER ANSWERED IS NOT A FAILED ANSWER.
  //
  // A response written before the voice question existed carries no tones at
  // all, and reading that silence as "she matches nothing" would eliminate the
  // entire library on the strength of a question she was never shown. The same
  // rule voice.ts already states about the tiles she did not tap: absence is
  // silence, never a claim. So the filter is inert and the fact is recorded.
  const toneSilent = isSilent(hers);

  // AND NEITHER IS A DESTINATION NOBODY HAS TAGGED.
  //
  // voice.ts argues that a destination whose voice cannot be said in six to ten
  // tones is one this question cannot match — but "cannot match" is not the
  // same verdict as "fails". An untagged destination scores 0 by construction,
  // and 0 is below any useful bar, so treating silence as a score would delete
  // every destination the house has not got round to tagging: today that is
  // every fixture and every stub, which is most of the library.
  //
  // The rule is the one this codebase already takes everywhere else — no claim
  // means no restriction (claimEligibility in occasion.ts, and the venue's
  // "untagged works anywhere"). It passes, carrying a null match, and stage 6
  // tells the curator it could not be judged. The work order for the missing
  // voice is already raised by src/lib/revelle/generate.ts, which reports every
  // proposed destination that has no published voice.
  const withTone = survivors.map((destination) => {
    if (toneSilent) return { destination, tone: null as number | null };
    const theirs = voiceProfileOfTags(destination.facets, facets);
    if (isSilent(theirs)) return { destination, tone: null as number | null };
    return { destination, tone: toneMatch(hers, theirs) };
  });

  const judged = withTone.filter((entry) => entry.tone !== null);
  let cleared = withTone.filter(
    (entry) => entry.tone === null || entry.tone >= options.toneThreshold
  );

  let voiceClash = false;

  for (const entry of withTone) {
    if (entry.tone === null || entry.tone >= options.toneThreshold) continue;
    eliminated.push({
      destinationName: entry.destination.name,
      reason:
        `it does not sound like her people — voice match ` +
        `${entry.tone.toFixed(2)} against a bar of ` +
        `${options.toneThreshold.toFixed(2)}. A wrong look reads as "not what ` +
        `I pictured"; a wrong voice reads as "this isn't us"`,
      tier: "voice",
      toneMatch: entry.tone,
    });
  }

  if (cleared.length === 0) {
    // ── THE HARD CLASH, AND WHAT HAPPENS IN WHICH ORDER ──────────────
    //
    // "supper club, disco after dark, warm, loud, sentimental isn't actually a
    //  contradiction — it's a wedding-reception-register party humans throw
    //  constantly. The conflict exists only because your catalog lacks that
    //  destination. So a hard taste/voice clash is FIRST a catalog-gap log
    //  entry, and only second an engine decision."
    //
    // So the work order is written first, unconditionally, and it names the
    // aesthetic she asked for — because that, plus the voice, is the
    // destination somebody has to sit down and author.
    voiceClash = true;
    gaps.push(voiceClashGap(vector, judged, options));

    // AND ONLY THEN THE ENGINE DECISION: take the destinations that come
    // CLOSEST ON VOICE, not the ones that score best on look. Voice still wins
    // when it wins by a poor margin — falling back to the aesthetic winner
    // would be the tier collapsing into a weight at exactly the moment the tier
    // is load-bearing, and it is what would put a deadpan invitation in front
    // of people who cry at the toast.
    const best = Math.max(...judged.map((entry) => entry.tone as number));
    cleared = judged.filter((entry) => entry.tone === best);
  }

  // ── 4 and 5. rank on the aesthetic half, then discount for issuance ─
  //
  // The tone facets are REMOVED from the weights this scores with. Leaving them
  // in would be the averaging the tier exists to replace: a destination would
  // be able to buy back rank with voice points it has already been judged on,
  // and one that squeaked over the bar would outrank a better-looking one that
  // cleared it comfortably, on the strength of a measurement already spent.
  const aesthetic = withoutToneFacets(vector.weights, facets);

  const scored = cleared.map(({ destination, tone }) => {
    const rawScore = facetOverlap(aesthetic, destination.facets);
    const multiplier = issuanceMultiplier(destination.issuance, now, options);
    const penalty = issuancePenalty(rawScore, multiplier);
    return {
      destination,
      rawScore,
      toneMatch: tone,
      issuancePenalty: penalty,
      score: rawScore - penalty,
      rank: 0,
      ditheredRank: 0,
    };
  });

  // ── 6. dither, WITHIN THE SURVIVORS, and read the shortlist off the top ──
  const shortlist = dither(
    scored,
    (entry) => entry.score,
    options.ditherEpsilon,
    random
  ).map((entry) => ({
    ...entry.item,
    rank: entry.rank,
    ditheredRank: entry.ditheredRank,
  }));

  return { shortlist, eliminated, impasse: null, gaps, voiceClash, toneSilent };
}

/** Her vector with the voice half taken out. See the note at the call site. */
function withoutToneFacets(
  weights: FacetTags,
  facets: Record<string, Facet>
): FacetTags {
  const out: FacetTags = {};
  for (const facetId in weights) {
    if (isToneFacet(facets[facetId])) continue;
    out[facetId] = weights[facetId];
  }
  return out;
}

/**
 * THE WORK ORDER A CLASH PRODUCES.
 *
 * `pool` is 'destination' and `slotCode` is the aesthetic she asked for, sorted
 * so the same clash from two customers dedupes to one row — src/lib/desk/gaps.ts
 * keys on `pool:slotCode` precisely so that the same missing thing is one task.
 * The aesthetic is the right key because it is what has to be authored: the
 * house already has her voice covered by something, it is the LOOK in that
 * voice that does not exist.
 */
function voiceClashGap(
  vector: PreferenceVector,
  judged: readonly { destination: Destination; tone: number | null }[],
  options: EngineOptions
): CatalogueGap {
  const asked = Object.keys(vector.weights)
    .filter((id) => vector.terms[id]?.facet.dimension === "taste_direction")
    .filter((id) => vector.weights[id] > 0)
    .map((id) => vector.terms[id].facet)
    .sort((a, b) => a.code.localeCompare(b.code));

  const closest = judged
    .slice()
    .sort((a, b) => (b.tone ?? -1) - (a.tone ?? -1))
    .slice(0, 3);

  return {
    pool: "destination",
    slotCode:
      asked.length > 0 ? asked.map((f) => f.code).join("+") : "no_taste_stated",
    slotLabel:
      asked.length > 0
        ? `Nothing in her voice looks like ${joinWords(asked.map((f) => f.label.toLowerCase()))}`
        : `Nothing in the library sounds like her people`,
    required: true,
    detail:
      `Her voice answers cleared no destination at the ${options.toneThreshold.toFixed(2)} ` +
      `bar, so there is no destination in the library that both sounds like her ` +
      `people and serves ${
        asked.length > 0
          ? joinWords(asked.map((f) => f.label.toLowerCase()))
          : "the look she asked for"
      }. That is not a contradiction in her answers — it is a hole in the ` +
      `catalogue, and it is what to author next. The closest the library got: ` +
      closest
        .map(
          (entry) => `${entry.destination.name} at ${(entry.tone ?? 0).toFixed(2)}`
        )
        .join(", ") +
      `. Voice still won: the candidate was built from the closest voice match, ` +
      `never from the best-looking destination.`,
  };
}

/**
 * The failure mode the spec names first: dealbreakers eliminate everything.
 *
 * "Report which constraints conflict and which to relax. Never silently drop
 * one." So the message names them, and the engine returns no candidates rather
 * than quietly relaxing the least popular veto and producing something she
 * explicitly refused.
 */
function impasseMessage(
  eliminated: readonly Elimination[],
  total: number
): string {
  const reasons = [...new Set(eliminated.map((e) => e.reason))];
  return (
    `All ${total} destination${total === 1 ? "" : "s"} were eliminated. ` +
    `Nothing was relaxed. The constraints that did it: ` +
    reasons.map((r) => `${r}`).join("; ") +
    `. Relax one with her, or author a destination that clears them all.`
  );
}

function joinWords(words: readonly string[]): string {
  if (words.length === 0) return "nothing";
  if (words.length === 1) return words[0];
  return `${words.slice(0, -1).join(", ")} and ${words[words.length - 1]}`;
}
