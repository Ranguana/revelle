/**
 * THE SEAM WHERE A MODEL CHOOSES, AND THE DETERMINISTIC ANSWER WHEN THERE IS
 * NONE.
 *
 * The founder's division of labour, and it is the right one:
 *
 *     "Rules narrow. A model chooses."
 *
 * ── WHAT IS ON WHICH SIDE OF THE LINE ────────────────────────────────
 *
 * THE RULES ARE ALREADY WRITTEN AND NO MODEL GOES NEAR THEM. Destination
 * native (db/019), the right course (db/022's dish_slot projection), the meal
 * shape (db/023), one season across the table, one rung of the making axis, the
 * room (db/020), the group size, the budget, and no repeats within a table or
 * across days — all of that runs in `scopePools` and `fillSlots`, it is
 * deterministic, it is free, it is testable without a network, and it takes six
 * hundred dishes down to a handful per course.
 *
 * WHAT IS LEFT OVER IS THE ONLY INTERESTING QUESTION: which of the survivors
 * make an EVENING rather than three individually permitted dishes. That is the
 * judgement db/022 says out loud the rules cannot hold — that this dessert
 * follows that main, that these three are too rich together — and it is the one
 * thing worth a model.
 *
 * ── AND THIS IS WHERE HER THIRTY-NINE MENUS COME BACK ────────────────
 *
 * db/022 concluded that the authored menus could not teach the composer,
 * because getting a pairing out of one means matching her prose to dish rows
 * and that decomposition is refused. THAT CONCLUSION WAS TOO NARROW, and the
 * founder saw why: A MODEL DOES NOT NEED THEM MATCHED. The thirty-nine go into
 * the prompt AS PROSE, as exemplars of what a good arrangement looks like, and
 * the pairing sense transfers without anybody decomposing a line of her
 * writing.
 *
 * So an authored menu is a CONSTRAINT SOURCE after all, and the mechanism is
 * exemplars rather than a decomposition. db/012's refusal is untouched: nothing
 * parses `menu.dishes`, here or anywhere.
 *
 * ── NOTHING DEPENDS ON A MODEL EXISTING ──────────────────────────────
 *
 * The same discipline src/lib/music/ applies to Spotify: absence is a ROUTE,
 * not a fault. With no chooser configured, `chooseCourse` returns the
 * best-scoring survivor — which is what the beam search would have done on its
 * own — so the composer works end to end today, is fully tested today, and gets
 * better rather than starting to work when a chooser is supplied.
 *
 * THIS FILE MAKES NO NETWORK CALL AND IMPORTS NOTHING THAT DOES. Wiring an
 * actual model is a separate decision with its own cost, latency and failure
 * modes, and it plugs in at exactly one function.
 */

import type { Ingredient, UnitSlot } from "./types.ts";

/**
 * ONE DISH, AS COMPACTLY AS IT CAN BE SAID.
 *
 * The encoding is the founder's own and it is what makes a prompt affordable:
 * six hundred dishes as `name · M · summer · D` fits; six hundred verbose
 * records does not. `line` is that string, built once here so that a chooser
 * never has to know the shape of an Ingredient.
 */
export type CourseOption = {
  id: string;
  name: string;
  /** appetizer | main | dessert */
  course: string;
  /** `name · <B|H|M> · <season> · <meal codes>`, empty fields left empty. */
  line: string;
  /** The engine's own ranking, best first from 0. Never hidden from a chooser. */
  rank: number;
};

/**
 * WHAT THE CHOOSER IS ASKED, and it is asked once per course rather than once
 * per table.
 *
 * ── WHY PER COURSE AND NOT ONE SHOT AT THE TRIPLE ───────────────────
 *
 * Because the beam search already explores several tables at once, and a
 * one-shot chooser would have to be told about all of them or would collapse
 * them to one — throwing away the exploration that produces the variety in the
 * first place. Asking per course, WITH WHAT IS ALREADY ON THIS TABLE in hand,
 * is the same question in the form the search can actually use: "given this
 * main, which of these desserts follows it" is exactly the judgement being
 * bought, and it is a smaller prompt than the triple.
 *
 * It also degrades honestly. A chooser that answers the first course badly is
 * still asked the second with the first in front of it.
 */
export type CourseRequest = {
  /** The destination's own name, as she wrote it. */
  destination: string;
  /** db/023's meal_shape — what kind of table this is. */
  meal: string;
  /** season_band the table has committed to, or null for "nothing yet". */
  season: string | null;
  /** making_level this course is being set at. */
  making: string | null;
  /** The slot being filled. `slotCode` is the course. */
  slot: UnitSlot;
  /** Already on this table, in the order they were placed. */
  placed: readonly CourseOption[];
  /** What the rules left. Never empty — the caller does not ask otherwise. */
  survivors: readonly CourseOption[];
  /**
   * HER AUTHORED MENUS FOR THIS DESTINATION, AS PROSE, VERBATIM.
   *
   * `menu.dishes` lines, unparsed and unmatched to anything. The exemplars.
   * Empty when the destination has none, which is a real state and not an
   * error.
   */
  exemplars: readonly string[];
};

/**
 * THE CONTRACT.
 *
 * Given the request, return the id of ONE survivor, or null to decline.
 *
 * Three rules a chooser must keep, and the caller enforces all three rather
 * than trusting them:
 *
 *   · IT MAY ONLY RETURN AN ID FROM `survivors`. Anything else is discarded and
 *     treated as a decline — a chooser cannot smuggle a dish past the rules,
 *     which is the whole reason the rules run first.
 *   · DECLINING IS ALWAYS ALLOWED and always safe. Null falls back to rank 0.
 *   · IT MUST NOT THROW. A caller wraps it, but a chooser that throws on a
 *     network blip and takes a selection run with it is the failure mode
 *     src/lib/music/ was built to avoid.
 *
 * Synchronous by signature, deliberately. `fillSlots` is a pure function called
 * inside a beam loop and making it async would make the whole engine async for
 * a call that does not exist yet. When a real model arrives it is fetched ahead
 * of the search — the survivors are known before the beam runs — and this
 * function reads the answer. That is a change at the call site and not to this
 * type.
 */
export type CourseChooser = (request: CourseRequest) => string | null;

/**
 * THE COMPACT LINE, in the founder's own encoding.
 *
 * Position-delimited on U+00B7 MIDDLE DOT, empty fields left empty, exactly as
 * docs/dishes.md is authored — so a prompt built from these reads like the
 * document a model would have been shown anyway.
 */
export function compactLine(ingredient: Ingredient): string {
  const making = MAKING_LETTER[ingredient.making ?? ""] ?? "";
  const season =
    ingredient.season && ingredient.season !== "year_round"
      ? ingredient.season
      : "";
  const meals = (ingredient.meals ?? []).map((m) => MEAL_CODE[m] ?? m).join(", ");
  return `${ingredient.name} · ${making} · ${season} · ${meals}`;
}

const MAKING_LETTER: Readonly<Record<string, string>> = {
  bought_and_arranged: "B",
  half_made: "H",
  actually_made: "M",
  // Retired (db/017). No live row carries it; a legacy one should still print.
  mostly_made: "M",
};

const MEAL_CODE: Readonly<Record<string, string>> = {
  long_dinner: "D",
  cocktails: "C",
  brunch: "BR",
  lunch: "L",
  late_supper: "LS",
};

export function courseOption(
  ingredient: Ingredient,
  rank: number
): CourseOption {
  return {
    id: ingredient.id,
    name: ingredient.name,
    // A dish's course is not a column on Ingredient — it is the slot claim
    // db/022 projects — so it is read from the slot being filled by the caller
    // and defaulted here rather than invented.
    course: "",
    line: compactLine(ingredient),
    rank,
  };
}

/**
 * ASK THE CHOOSER, AND FALL BACK.
 *
 * The one function a model plugs into. Everything about it is defensive on
 * purpose: an optional integration that can break a selection run is not
 * optional.
 *
 * WHAT THE DETERMINISTIC ANSWER IS: the survivor at rank 0, which is the
 * best-scoring candidate the rules left and exactly what `fillSlots` would have
 * taken by itself. So "no chooser configured" is not a degraded path, it is
 * today's behaviour, and every test in selection.test.ts exercises it.
 */
export function chooseCourse(
  request: CourseRequest,
  chooser: CourseChooser | null | undefined
): CourseOption {
  const fallback = request.survivors[0];
  if (!chooser) return fallback;

  let answer: string | null = null;
  try {
    answer = chooser(request);
  } catch {
    // A chooser that throws declines. It does not take the run with it.
    return fallback;
  }

  if (answer === null) return fallback;
  const chosen = request.survivors.find((option) => option.id === answer);
  // An id that is not a survivor is a chooser trying to smuggle a dish past the
  // rules, or a bug. Either way the rules win.
  return chosen ?? fallback;
}
