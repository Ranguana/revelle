/**
 * VOICE IS A FILTER. AESTHETIC IS A RANK.
 *
 * The founder, deciding it:
 *
 *   "Voice wins because (a) the voice is the medium of every deliverable — the
 *    invitation, the menu, the sequencing all speak, while the look touches
 *    fewer surfaces; (b) errors split asymmetrically — a wrong look reads as
 *    'not what I pictured' and gets forgiven, a wrong voice reads as 'this
 *    isn't us' and churns the member; (c) tone icons describe her people,
 *    aesthetic picks describe an image she's seen somewhere — the people are
 *    ground truth, the image is usually borrowed."
 *
 * And, on the mechanism, which is the part that has to be exactly right:
 *
 *   "Not a bigger weight — a TIER."
 *
 * ── WHY A TIER AND NOT A WEIGHT ──────────────────────────────────────
 *
 * A weight averages. Averaging two axes produces the destination that is
 * middling on both, which is the compromise that is nobody's: it is not the
 * one that sounds like her people and it is not the one that looks like the
 * image she had in her head. It is a third thing neither half of her answers
 * asked for, and it arrives looking reasonable because a number went up.
 *
 * A tier does not average. The tone facets decide WHICH DESTINATIONS ARE STILL
 * IN THE ROOM; the aesthetic facets then decide the order among them. A
 * destination that fails the voice bar is not "outweighed" — it is gone, at any
 * aesthetic score, for the same reason a dealbreaker is a filter and not a
 * large negative weight (docs/selection-spec.md, stage 2).
 *
 * ── THE CLASH IS A CATALOGUE PROBLEM FIRST ───────────────────────────
 *
 *   "supper club, disco after dark, warm, loud, sentimental isn't actually a
 *    contradiction — it's a wedding-reception-register party humans throw
 *    constantly. The conflict exists only because your catalog lacks that
 *    destination."
 *
 * So a hard taste/voice clash is FIRST a catalogue gap and only second an
 * engine decision. `chooseDestinations` records it through the ordinary
 * `CatalogueGap` channel, which src/lib/revelle/generate.ts already hands to
 * `recordCatalogueGaps` — the desk's authoring queue. It is the house learning
 * which destination to write next, and it must be recorded whether or not the
 * engine then manages to produce something.
 *
 * ── WHY THE MATCH RESOLVES TONES INTO VOICE FACETS ───────────────────
 *
 * Because comparing the tone CODES directly would compare almost nothing. She
 * taps at most seven tiles out of fifty-one; a destination is tagged with six
 * to ten. Two profiles that agree completely about the kind of room they are —
 * dry, quiet, understated — routinely share no tone code at all, because she
 * tapped "the best line is muttered, not announced" and the curator tagged
 * "says less than it means and lets it sit". Raw code overlap would read that
 * as a total mismatch.
 *
 * The whole point of src/lib/voice.ts is that both sides resolve through the
 * SAME twenty-six voice facets, and at that level those two tones agree
 * strongly (theatricality negative, humour dry, cadence clipped). So this file
 * resolves both sides and compares the resolutions, using `voiceAffinity` —
 * the cosine that src/lib/voice.test.ts already asserts discriminates.
 *
 * Nothing here opens a database. src/lib/voice.ts is framework-free and is the
 * reviewable copy of what `voice_tone_facet` holds (db/007); resolving here
 * keeps stage 2 a pure function of its snapshot, which is what makes the
 * threshold arguable in a test rather than in a query.
 */

import { TONE, voiceAffinity, type VoiceProfile } from "../voice.ts";
import type { Facet, FacetTags } from "./types.ts";

/**
 * The dimensions that are VOICE and therefore filter rather than rank.
 *
 * `voice_tone` is the surface she answers in and the surface a destination is
 * tagged in. `voice` is what a tone resolves TO — nothing is tagged in it
 * today, but db/016 seeds the dimension and a curator may reach for it, and a
 * voice facet arriving through the ranking half would be exactly the averaging
 * this file exists to prevent.
 */
export const TONE_DIMENSIONS: ReadonlySet<string> = new Set(["voice_tone", "voice"]);

export function isToneFacet(facet: Facet | undefined): boolean {
  return facet !== undefined && TONE_DIMENSIONS.has(facet.dimension);
}

/**
 * A tag set, resolved into the voice vocabulary.
 *
 * Two kinds of tag are read and they are not the same thing:
 *
 *   voice_tone   a tile. Resolved through TONE[code].facets, multiplied by how
 *                strongly the tag claims the tone — the same arithmetic
 *                `taggedToneProfile` does, done here because the tags arrive
 *                as facet IDS and the resolution needs CODES.
 *   voice        a facet already in the resolved vocabulary. Taken as it
 *                stands. A curator who tags "theatricality: -1" outright has
 *                said the thing precisely and must not be second-guessed.
 *
 * Unknown codes are ignored, exactly as `toneProfile` ignores them: a tone tile
 * that has been retired should stop counting, not throw.
 */
export function voiceProfileOfTags(
  tags: FacetTags,
  facets: Record<string, Facet>
): VoiceProfile {
  const profile: VoiceProfile = {};

  for (const facetId in tags) {
    const facet = facets[facetId];
    if (!facet) continue;
    const weight = tags[facetId];
    if (weight === 0) continue;

    if (facet.dimension === "voice") {
      profile[facet.code as keyof VoiceProfile] =
        (profile[facet.code as keyof VoiceProfile] ?? 0) + weight;
      continue;
    }

    if (facet.dimension !== "voice_tone") continue;
    const tone = TONE[facet.code];
    if (!tone) continue;
    for (const { code, weight: claim } of tone.facets) {
      profile[code] = (profile[code] ?? 0) + claim * weight;
    }
  }

  return profile;
}

/** True when nothing in this profile makes a claim. */
export function isSilent(profile: VoiceProfile): boolean {
  for (const code in profile) {
    if ((profile[code as keyof VoiceProfile] ?? 0) !== 0) return false;
  }
  return true;
}

/**
 * How much a destination sounds like her people. −1 to 1.
 *
 * Cosine, so a host who tapped seven tiles cannot out-score one who tapped two.
 * That normalisation is what makes ONE threshold apply to every customer, which
 * is the only way a tier is a tier rather than a per-customer judgement call.
 */
export function toneMatch(hers: VoiceProfile, theirs: VoiceProfile): number {
  return voiceAffinity(hers, theirs);
}
