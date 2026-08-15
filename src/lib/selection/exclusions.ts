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
 * ── WHERE THE ANSWERS COME FROM ──────────────────────────────────────
 *
 * She states them, in two questions added by db/016 and QUIZ_VERSION
 * 2026-08-d:
 *
 *   food_plan       "What are they eating?"    'eating_out' and 'drinks_only'
 *                   both carry 'no_food'. One says somebody else is choosing
 *                   the food; the other says there is none. Neither is a
 *                   dislike of menus.
 *   play_appetite   "Where do games sit in this?"   'none at all' carries
 *                   'no_games'.
 *
 * The mapping is DATA — quiz_option_exclusion in db/016, the same bridge shape
 * quiz_option_facet uses for taste — so a second answer that means "no menu"
 * is an INSERT, and this file still knows no option codes and no slot codes.
 * quiz_response_exclusion resolves a response into codes, and
 * src/lib/selection/catalogue.ts passes them in as `recorded`.
 *
 * The near misses, and why each is still refused rather than quietly used:
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
 *     providing. Not choosing "compete" is not saying "no games". The four
 *     options db/016 added to it — making something, working the room, keeping
 *     a secret, playing for stakes — do not change this: they say what kind,
 *     and kind is not whether.
 *
 * NOTE THAT THE OPT-OUT AND THE APPETITE ARE ONE QUESTION AND TWO
 * CONSEQUENCES. "None at all" both removes the game slots (here) and weights
 * her vector away from anything played (db/016's `organised_play` at -1), which
 * is why the exclusion and the facet are two separate bridges off one answer.
 * An evening with no games can still have an edit with a deck of cards in it,
 * and it should not.
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
   * The codes she stated, read back from quiz_response_exclusion (db/016).
   * Passed through verbatim, which is what made adding the question a change
   * to the LOADER and not to this rule.
   */
  recorded?: readonly string[];
};

/**
 * The slot_exclusion codes that apply to this application.
 *
 * Only what she stated. Nothing is derived from `occasion`, `environment` or
 * `stated`, and they are parameters so that the refusal is visible: deriving an
 * exclusion from an answer that does not mean it would delete a deliverable she
 * wanted, and she would never learn why.
 */
export function hostExclusions(answers: ExclusionAnswers): string[] {
  const codes = new Set<string>();

  for (const code of answers.recorded ?? []) {
    const trimmed = code.trim();
    if (trimmed.length > 0) codes.add(trimmed);
  }

  return [...codes].sort();
}
