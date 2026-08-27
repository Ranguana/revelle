/**
 * WHAT A COPIED ROOM SCORES — the calibration evidence for the voice ceilings,
 * built rather than imagined.
 *
 * ── WHY THIS IS A MODULE AND NOT A PARAGRAPH ─────────────────────────
 *
 * CLAUDE.md rule 7 says a distance may be quoted only from the committed audit
 * script, because the matrix forked once precisely when numbers were reported
 * from throwaway runs and could not be reconstructed.
 * `scripts/check-voices.mjs` says the same thing about voice affinity in its
 * own header — "THE ONLY PLACE A VOICE AFFINITY MAY BE QUOTED FROM". The
 * recalibration of `VOICE_CEILING_STRICT`, `VOICE_CEILING_MONITOR` and
 * `TONE_HAND_OVERLAP_MAX` rests on four numbers that no committed script
 * printed — what a duplicate room actually scores — so quoting them from a
 * scratch run would have been that exact failure, one layer up and in the file
 * that argues the thresholds. This module is the fix: the constructions live
 * here, `npm run check:voices -- --duplicates` prints them, and
 * `src/lib/voice.test.ts` asserts against the same generator.
 *
 * ── WHY ONE OWNER AND NOT TWO COPIES ─────────────────────────────────
 *
 * Rule 21's narrow test — must two surfaces agree about this? — answers yes
 * without argument. The report and the regression are making the SAME claim
 * about the SAME population, and two hand-rolled clone builders would drift
 * into two different populations while both looked right, which is the failure
 * shape that rule describes. And rule 21's second half is why the test imports
 * this rather than restating it: a guard has to go through the thing it guards.
 *
 * Nothing in the running application imports this module.
 *
 * ── WHAT A "DUPLICATE" IS HERE, AND WHY IT IS BUILT IN FOUR STRENGTHS ─
 *
 * An echo, in this system's own terms, is one room's TONE HAND worn by another
 * room. That is the thing being detected, so it is the thing constructed: take
 * a real authored room, keep its hand, and then degrade the copy along the two
 * axes a copyist would actually move — drop a tone or two, nudge the weights,
 * and restate the three facets the voice states outright.
 *
 * The four strengths exist because THEY DO NOT ALL BEHAVE THE SAME, and that
 * difference is the entire calibration finding. The stated triple is nearly
 * invisible to `voiceAffinity` — one-hot facets contribute zero on
 * disagreement rather than a negative — so changing it drops a clone's score
 * far more than it changes what the clone IS. Reported as four populations so a
 * reader can see the cosine failing to separate three of them from the authored
 * field, rather than being told it in prose.
 *
 * THE DEGRADATIONS ARE DELIBERATELY MILD. Two dropped tones and a weight nudge
 * of 0.2 is a copyist covering their tracks, not a second room. If a
 * construction here ever stops reading as a duplicate to a human, the
 * generator is wrong and the thresholds derived from it are wrong with it.
 */

import type { AddressMode, Formality, HumourMode, Voice } from "./tokens.ts";
import {
  destinationVoiceProfile,
  type ToneWeight,
  type VoiceProfile,
} from "./voice.ts";

/**
 * The other end of each stated axis.
 *
 * Any different member would do — the cosine cannot tell one substitution from
 * another, since a one-hot disagreement contributes zero however far apart the
 * two members read to a person. These are chosen as the FAR end so that the
 * constructions are the most generous possible case for the copyist: if a clone
 * still scores high with all three facets thrown to the opposite pole, no
 * gentler restatement will save it either.
 */
const OPPOSITE_FORMALITY: Record<Formality, Formality> = {
  ceremonial: "familiar",
  formal: "familiar",
  cordial: "plain",
  plain: "cordial",
  familiar: "ceremonial",
};

const OPPOSITE_ADDRESS: Record<AddressMode, AddressMode> = {
  second_person: "impersonal",
  third_person: "collective_first",
  collective_first: "third_person",
  impersonal: "second_person",
};

const OPPOSITE_HUMOUR: Record<HumourMode, HumourMode> = {
  none: "absurd",
  dry: "warm",
  deadpan: "warm",
  arch: "warm",
  warm: "arch",
  absurd: "none",
};

/** How many of the three stated facets the copy restates. */
export type StatedChanges = 0 | 1 | 2 | 3;

export const STATED_CHANGE_LABELS: Record<StatedChanges, string> = {
  0: "same hand, SAME stated triple",
  1: "same hand, ONE stated facet changed",
  2: "same hand, TWO stated facets changed",
  3: "same hand, ALL THREE stated facets changed",
};

/** Tones dropped from the end of the hand. Never below the six-tone floor. */
export const DROPS = [0, 1, 2] as const;

/** Weight nudges, alternating sign along the hand. */
export const JITTERS = [0, 0.1, 0.2] as const;

function restate(voice: Voice, changes: StatedChanges, which: number): Voice {
  // `which` selects WHICH facets move when fewer than three do, so the
  // one-changed population covers all three axes rather than only humour.
  const order: ("formality" | "address" | "humour")[] = [
    ["formality", "address", "humour"],
    ["address", "humour", "formality"],
    ["humour", "formality", "address"],
  ][which % 3] as ("formality" | "address" | "humour")[];
  const moving = new Set(order.slice(0, changes));
  return {
    ...voice,
    formality: moving.has("formality")
      ? OPPOSITE_FORMALITY[voice.formality]
      : voice.formality,
    address: {
      ...voice.address,
      mode: moving.has("address")
        ? OPPOSITE_ADDRESS[voice.address.mode]
        : voice.address.mode,
    },
    humour: {
      ...voice.humour,
      mode: moving.has("humour")
        ? OPPOSITE_HUMOUR[voice.humour.mode]
        : voice.humour.mode,
    },
  };
}

function degrade(
  tones: readonly ToneWeight[],
  drop: number,
  jitter: number
): readonly ToneWeight[] {
  return tones.slice(0, tones.length - drop).map((t, i) => ({
    code: t.code,
    // Clamped into the legal 0 < w <= 1 a destination tag must satisfy, so a
    // construction is always a hand a curator could actually have written.
    weight: Math.max(0.05, Math.min(1, t.weight + (i % 2 ? jitter : -jitter))),
  }));
}

export type Duplicate = {
  /** The room that was copied. */
  original: string;
  changes: StatedChanges;
  drop: number;
  jitter: number;
  profile: VoiceProfile;
  tones: readonly ToneWeight[];
};

/**
 * Every copy of one room, across the four strengths and the degradations.
 *
 * The six-tone floor is the same one `voice.test.ts` asserts on real
 * destinations: a hand shorter than that is not a room, so a construction that
 * would go below it is not generated rather than being generated illegally.
 */
export function duplicatesOf(
  key: string,
  voice: Voice,
  tones: readonly ToneWeight[]
): Duplicate[] {
  const out: Duplicate[] = [];
  let n = 0;
  for (const changes of [0, 1, 2, 3] as StatedChanges[])
    for (const drop of DROPS) {
      if (tones.length - drop < 6) continue;
      for (const jitter of JITTERS) {
        const copyTones = degrade(tones, drop, jitter);
        out.push({
          original: key,
          changes,
          drop,
          jitter,
          tones: copyTones,
          profile: destinationVoiceProfile(restate(voice, changes, n++), copyTones),
        });
      }
    }
  return out;
}
