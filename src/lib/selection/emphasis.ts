/**
 * "WHAT DO YOU WANT MORE OF" IS AN EMPHASIS, NOT A TASTE WEIGHT.
 *
 * The founder, deciding it:
 *
 *   "Each answer points at a slot, and this question shouldn't feed the
 *    preference vector at all. It's the only question on the quiz that tells
 *    you which deliverable she values, and averaging it into taste weights
 *    discards exactly that."
 *
 * ── WHAT WAS WRONG WITH THE OLD BEHAVIOUR ────────────────────────────
 *
 * `affinities` resolved into the `affinity` dimension and went into the
 * preference vector beside old-world Riviera and faded coastal. So "a ritual we
 * repeat next year" became a half-point of pull toward destinations a curator
 * had tagged `ritual`, and it competed with, and was averaged against, answers
 * about how a room should LOOK. The one question that says which DELIVERABLE
 * she is buying was spent nudging which DESTINATION she gets — and the
 * information it actually carried was destroyed on the way, because a scalar
 * added to a dot product cannot say "make sure there is an ending".
 *
 * So: `affinity` is now a non-taste dimension in vector.ts, exactly like
 * `guest_count` and `spend_per_person`, and it arrives here instead.
 *
 * ── WHY A GUARANTEE AND NOT A MULTIPLIER ─────────────────────────────
 *
 * Read this before "improving" the emphasis into a weight.
 *
 * Stage 4 is a beam search that fills one slot at a time from a pool already
 * scoped to that slot. Multiplying every candidate in a slot by 1.6 does not
 * change which of them wins — they all move together — so a slot weight is a
 * no-op on the choice WITHIN a slot. The only thing it could change is the
 * running total, which decides beam pruning, which is not what "she values The
 * Moment" means.
 *
 * What a slot weight MEANS in a search over required and optional slots is
 * whether the slot gets filled at all and what it is allowed to cost. So an
 * emphasised slot is PROMOTED TO REQUIRED in the plan (occasion.ts), and that
 * single change does the whole job through machinery that already exists:
 *
 *   · it is never skipped for a weak score — fillSlots only skips optional;
 *   · it is bounded by `budget_ceiling` rather than by `budget_planning`, so it
 *     gets first claim on the slack between the two. That IS "product budget
 *     shifted toward tabletop": guarantee The Table and The Edit and the money
 *     goes there before it goes to a favour;
 *   · the cheapest-completion lookahead reserves money for it up front;
 *   · and if the pool cannot fill it, the house gets a REQUIRED catalogue gap —
 *     a work order — which is the correct response to "she asked for a moment
 *     and we have not written one".
 *
 * Her answer does not outrank the occasion's shape in the other direction: a
 * guarantee can promote a slot, never invent one. If her occasion has no
 * ending, emphasising the ending changes nothing, because there is nothing
 * there to guarantee.
 *
 * ── THE TWO ANSWERS THAT ARE NOT SLOTS ───────────────────────────────
 *
 * `ease` and `wit` do not point at a pool, and pretending they do would be the
 * same mistake in a different costume.
 *
 *   ease  is "the effort answer wearing a costume": it forces the
 *         sleight-of-hand tier and weights The Prep toward brevity. Both are
 *         instructions to the writer and to the curator, and neither is a
 *         pick from a pool. Nothing is guaranteed, because what she is buying
 *         is the ABSENCE of work.
 *   wit   "only works with her material". An inside joke cannot be satisfied
 *         from the catalogue, and no ingredient in it will ever be her inside
 *         joke. So it does two honest things and no dishonest one: it raises
 *         the weight of her free-text answer in the writer prompt, and it
 *         records that a FOLLOW-UP IS OWED — in `notes`, which explain.ts puts
 *         in front of the curator. It never quietly picks a witty product and
 *         calls it done.
 *
 * ── AND ONE THAT IS A BUSINESS FACT ──────────────────────────────────
 *
 * "A ritual we repeat next year" is the highest-LTV answer on the quiz: she is
 * asking for Revelle #2 before #1 has shipped. That is a fact about the MEMBER,
 * not about this application, so db/020 records it on `member_emphasis` keyed
 * by customer, written by a trigger on `quiz_response` so that no caller can
 * forget it. `repeatable` here is the engine's half of the same fact.
 */

import type { Emphasis, EmphasisCode, StatedFacet } from "./types.ts";

/** The six answers, in the order src/lib/quiz.ts offers them. */
export const EMPHASIS_CODES: readonly EmphasisCode[] = [
  "one_moment",
  "ease",
  "beauty",
  "ritual",
  "wit",
  "late",
];

/**
 * ONE ROW PER ANSWER, and every column of it is the founder's own sentence.
 *
 * Kept as data rather than as a switch so that the mapping can be read in one
 * screen and argued with in a diff — the same reason src/lib/quiz.ts is data
 * and db/002's dimensions are rows. `slots` names slot_kind codes (db/009).
 */
const MAPPING: Readonly<
  Record<
    EmphasisCode,
    {
      /** What she tapped, in her words. */
      label: string;
      /** slot_kind codes promoted to required. May be empty. */
      slots: readonly string[];
      /** What the writer must spend its attention on. */
      attention: readonly string[];
      /** The sentence a curator reads. Hers, not a paraphrase. */
      note: string;
    }
  >
> = {
  one_moment: {
    label: "One moment they retell for years",
    slots: ["the_moment"],
    attention: [
      "The Moment is the centrepiece. Write it first and write it longest; " +
        "everything else in the paper is scaffolding around it.",
    ],
    note:
      "THE MOMENT is guaranteed: it is promoted to a required slot, so it is " +
      "filled if anything can fill it, it is paid for out of the ceiling rather " +
      "than the planning budget, and if the pool cannot fill it the house gets a " +
      "required-slot work order rather than a quietly shorter Revelle. The voice " +
      "layer gives it centrepiece attention.",
  },
  ease: {
    label: "Everything already handled",
    slots: [],
    attention: [
      "The Prep is written SHORT. Fewest lines that can still be followed; no " +
        "project plan, no timeline, nothing that reads as homework.",
    ],
    note:
      "THE EFFORT ANSWER WEARING A COSTUME. It forces the sleight-of-hand tier — " +
      "the finish arrives looking done — and weights The Prep toward brevity. No " +
      "slot is guaranteed, because what she is buying is the absence of work, and " +
      "adding a deliverable would be the opposite of granting it.",
  },
  beauty: {
    label: "A table worth photographing",
    slots: ["table_object", "edit_item"],
    attention: [
      "The Table and The Edit carry the piece. Name what is on the table " +
        "precisely enough to photograph.",
    ],
    note:
      "THE TABLE and THE EDIT are guaranteed, which is also how the product " +
      "budget shifts toward tabletop: a guaranteed slot is bounded by the ceiling " +
      "rather than by what she is building to, so it gets first claim on the slack " +
      "between the two, before a favour or a second edit item can spend it.",
  },
  ritual: {
    label: "A ritual we repeat next year",
    slots: ["finale"],
    attention: [
      "The Ending is the piece that has to survive being done again. Write it so " +
        "it can be repeated verbatim next year and still land.",
    ],
    note:
      "THE ENDING is guaranteed, and it is designed to be ANNUALIZABLE — a thing " +
      "that can be done again next year without being a copy of this year. " +
      "SHE IS THE HIGHEST-LTV ANSWER ON THE QUIZ: she has asked for Revelle #2 " +
      "before #1 has shipped. The flag is on her MEMBER RECORD (member_emphasis, " +
      "db/020), not only on this application, so it is still true next spring.",
  },
  wit: {
    label: "An inside joke, made real",
    slots: [],
    attention: [
      "Her own words are the material. Use the free-text answer directly; do not " +
        "invent a joke, and do not gesture at one the paper cannot land.",
    ],
    note:
      "CANNOT BE SATISFIED FROM THE CATALOGUE, and nothing here pretends " +
      "otherwise. An inside joke is made of her material and there is no " +
      "ingredient that is anybody's inside joke. So: her free-text answer is " +
      "weighted up in the writer prompt, and A FOLLOW-UP IS OWED — ask her for " +
      "the joke before this goes out. If her free text is empty there is nothing " +
      "to work from at all and the follow-up is the only route.",
  },
  late: {
    label: "Permission to stay up",
    slots: ["soundtrack", "finale"],
    attention: [
      "The Soundtrack arc extends past the ending it would usually have, and The " +
        "Ending moves late. Sequence for a room that is still there at two.",
    ],
    note:
      "STRUCTURE, NOT PRODUCTS. The Soundtrack arc extends and The Ending moves " +
      "late, so both are guaranteed rather than optional. Nothing is bought to " +
      "make an evening run long.",
  },
};

/**
 * Her emphasis, read off the resolved application.
 *
 * The `affinity` dimension is still resolved by `quiz_response_facet` — db/002
 * makes the point that a dimension excluded on purpose must be excluded by a
 * named rule rather than by failing to appear — so this reads the same rows the
 * vector deliberately ignores, and reads them as what they are.
 */
export function buildEmphasis(stated: readonly StatedFacet[]): Emphasis {
  const codes: EmphasisCode[] = [];
  for (const code of EMPHASIS_CODES) {
    if (
      stated.some(
        (answer) =>
          answer.dimension === "affinity" &&
          answer.code === code &&
          answer.polarity === "positive"
      )
    ) {
      codes.push(code);
    }
  }

  const guaranteed: string[] = [];
  const attention: string[] = [];
  const notes: string[] = [];

  for (const code of codes) {
    const row = MAPPING[code];
    for (const slot of row.slots) {
      if (!guaranteed.includes(slot)) guaranteed.push(slot);
    }
    attention.push(...row.attention);
    notes.push(`${row.label} — ${row.note}`);
  }

  return {
    codes,
    guaranteed,
    attention,
    notes,
    repeatable: codes.includes("ritual"),
    effortless: codes.includes("ease"),
    prepRegister: codes.includes("ease") ? "brief" : "full",
    tabletop: codes.includes("beauty"),
    runsLate: codes.includes("late"),
    needsHerMaterial: codes.includes("wit"),
  };
}

/** Nothing tapped, nothing emphasised. The shape callers can rely on. */
export function noEmphasis(): Emphasis {
  return buildEmphasis([]);
}

/**
 * The attention block the voice layer is handed.
 *
 * Kept here rather than in src/lib/tokens.ts because the mapping from her
 * answer to the writer's instruction is a product decision and belongs beside
 * the rest of it. tokens.ts renders the lines; it does not decide them.
 */
export function writerAttention(emphasis: Emphasis): readonly string[] {
  return emphasis.attention;
}
