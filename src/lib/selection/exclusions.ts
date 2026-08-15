/**
 * THE THIRD GATE — slots she does not have.
 *
 * The occasion decides which slots EXIST ("a birthday has a beat where the
 * person is marked"). The destination decides the REGISTER. This is the third
 * and narrowest gate, and it is hers: facts about her evening that remove a
 * slot from her plan altogether.
 *
 *   "Maybe someone won't even be serving food, in that case no menu."
 *
 * ── WHY THIS IS NOT A DEALBREAKER, AND NOT A GAP ─────────────────────
 *
 * A dealbreaker is a DISLIKE, and it is scored: it eliminates ingredients that
 * carry the facet she vetoed, one level down, everywhere. "I am not serving
 * food" is not a dislike. She has nothing against menus. There is simply no
 * dinner, so the deliverable does not apply — and making her phrase a fact as
 * a veto to get the right answer is asking her to speak the engine's language.
 *
 * A catalogue gap is a WORK ORDER: the pool could not fill a slot her occasion
 * has, and the house must author something. This is not that either. There is
 * nothing to author. If the two shared a list, the curator's gap list would
 * fill with rows nobody can act on and would stop being read — and the gap
 * list is the only thing telling the house what to write next.
 *
 * So an excluded slot is removed from the plan BEFORE the fill runs. It is not
 * filled and discarded; it was never in the plan. It produces no gap, no drop
 * and no sentence for her. To the member the two are identical anyway: the
 * deliverable is absent, with no heading and no empty state. See member.ts.
 *
 * `required` does not override her. Required describes the OCCASION'S shape —
 * "a dinner party with no soundtrack is broken" — not an obligation on the
 * woman filling in the application. Her answer wins.
 *
 * ── WHERE THE CODES LIVE ─────────────────────────────────────────────
 *
 * slot_exclusion in db/014, and slot_kind.excluded_by names which one removes
 * which slot. Data, not a list in this file: making a new slot excludable is
 * an INSERT, the way slot_shape made "which shapes may fill this slot" data in
 * db/010.
 *
 * ── WHERE THE ANSWERS WOULD COME FROM — THE SEAM ─────────────────────
 *
 * NOTHING IN THE CURRENT QUIZ CAN STATE EITHER FACT. The full question set is
 * src/lib/quiz.ts, and it was read for this:
 *
 *   occasion, environment, taste_directions, group_fun, voice_tones,
 *   anti_preferences, affinities, secret, guest_count_band,
 *   spend_per_person, music_service, email
 *
 * The near misses, and why each is refused rather than quietly used:
 *
 *   environment = 'restaurant_or_venue'  Says where, not whether. A woman who
 *     books the back room of a restaurant may still be choosing the food, and
 *     inferring "no menu" from a room would silently delete a deliverable she
 *     wanted. A room is not an answer about food.
 *   anti_preferences = 'forced_fun'      A dislike, and already carried as a
 *     dealbreaker where it belongs. It weights the game pool down. It does not
 *     mean there are no games, and treating a veto as a fact would make her
 *     dislikes structural.
 *   group_fun                            What they enjoy, not what she is
 *     providing. Not choosing "compete" is not saying "no games".
 *
 * So this returns nothing today, and that is the correct answer rather than a
 * placeholder. The wiring, when the question is added:
 *
 *   1. a question — "Are you serving food?" / "Do you want games?" — added to
 *      QUIZ_STEPS in src/lib/quiz.ts by the piece of work already queued;
 *   2. its answer stored per response, the way quiz_response_facet stores the
 *      others, against the slot_exclusion codes in db/014;
 *   3. THIS FUNCTION reads it and returns the codes.
 *
 * Steps 1 and 2 are somebody else's; step 3 is one line here. Nothing else in
 * the engine changes, because everything downstream already takes the set as
 * an input and already handles it being empty.
 */

import type { OccasionCode, StatedFacet } from "./types.ts";

/**
 * The subset of an application this gate reads. Narrow on purpose: it makes
 * the seam obvious, and it keeps this callable from catalogue.ts while the
 * Application it is filling in is still half-built.
 */
export type ExclusionAnswers = {
  occasion: OccasionCode;
  environment: string;
  stated: readonly StatedFacet[];
  /**
   * Codes already recorded against the response by whatever asked her. Empty
   * until the question above exists; passed through verbatim so that adding
   * the question is a change to the LOADER and not to this rule.
   */
  recorded?: readonly string[];
};

/**
 * The slot_exclusion codes that apply to this application.
 *
 * Deliberately returns [] for everything the current quiz can express — see
 * the seam above. Deriving an exclusion from an answer that does not mean it
 * would delete a deliverable she wanted, and she would never learn why.
 */
export function hostExclusions(answers: ExclusionAnswers): string[] {
  const codes = new Set<string>();

  for (const code of answers.recorded ?? []) {
    const trimmed = code.trim();
    if (trimmed.length > 0) codes.add(trimmed);
  }

  return [...codes].sort();
}
