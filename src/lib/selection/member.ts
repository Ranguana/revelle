/**
 * WHAT SHE SEES — and the wall between it and everything else.
 *
 * The founder's rule, verbatim: "if a game doesnt match, then no game, dont
 * give an error to the member."
 *
 * The generalisation, which is the actual rule: AN UNFILLABLE SLOT MEANS THE
 * DELIVERABLE DOES NOT EXIST IN HER REVELLE. It is not an error, not a
 * placeholder, not an apology, not "we couldn't find a game for you". It is
 * silence. She never learns a slot existed.
 *
 * A catalogue gap is a message to the HOUSE. It tells the curator that the
 * pool needs authoring, and that signal must survive — it is how the library
 * gets built. It just must never cross into anything a member reads.
 *
 * ── WHY THIS IS A TYPE AND NOT A CONVENTION ──────────────────────────
 *
 * Explanation was curator-facing by intent from the day it was written, and
 * intent is exactly what the first preview page breaks by accident: it takes
 * the Candidate it already has, renders `picks`, and one sprint later someone
 * adds "and show the gaps in grey while we're testing". So MemberRevelle does
 * not merely omit the house's fields — it FORBIDS them. `gaps`, `eliminated`,
 * `dropped`, `swaps`, `lowConfidence`, `explanation` and `blocked` are typed
 * `never`, which makes a Candidate structurally unassignable to it and makes
 * memberRevelle() below the only way across.
 *
 * ── THE RENDERING RULE, FOR WHOEVER BUILDS THE PAGE ──────────────────
 *
 * WHERE A PIECE IS ABSENT, RENDER NOTHING AT ALL. Not a heading with an empty
 * body, not "no game selected", not a dash. There is no empty state for a
 * missing piece, because from where she stands nothing is missing.
 *
 * That is why the heading is a property of the PIECE and not of a list of
 * slots: a piece that was never placed takes its own heading away with it, and
 * a page that iterates `sections` cannot print a title over nothing. If you
 * find yourself needing a "no game" branch, the shape of the data is telling
 * you the truth — there is no game, and therefore nothing to say.
 *
 * The two reasons a piece is absent — the pool could not fill it, or she said
 * she does not have it — are deliberately indistinguishable here. They are
 * different in the curator's view (CatalogueGap vs ExcludedSlot) because one
 * is a work order and one is not. To her they are the same fact: it is not
 * part of her Revelle.
 */

import type { Candidate, Pick, SectionKind } from "./types.ts";

/**
 * The house's fields, forbidden by name.
 *
 * `?: never` rather than omission, because TypeScript's structural typing
 * would otherwise let a Candidate satisfy a member-facing type: extra
 * properties are allowed on anything that is not a fresh object literal, so
 * "the type does not have gaps" is not the same promise as "the value cannot".
 * Typed this way, `const view: MemberRevelle = candidate` is a compile error,
 * and so is putting any of them back on the way through.
 */
type HouseOnly = {
  gaps?: never;
  eliminated?: never;
  dropped?: never;
  swaps?: never;
  lowConfidence?: never;
  explanation?: never;
  blocked?: never;
  /** Overages and unpriced items are a curator's problem, never hers. */
  budget?: never;
};

/** The world her Revelle is set in. Its name and its line, nothing else. */
export type MemberDestination = {
  name: string;
  tagline: string;
};

/**
 * ONE THING SHE ACTUALLY RECEIVES.
 *
 * The heading travels with the piece. See the rendering rule above.
 */
export type MemberPiece = {
  /** The slot's label — printed only because this piece exists. */
  heading: string;
  section: SectionKind;
  name: string;
  description: string;
  /** How many of the object: her guest count on a per-head piece, else 1. */
  quantity: number;
  perGuest: boolean;
  /** 1-based, on an occasion that runs over days. Null on an evening. */
  dayIndex: number | null;
};

/** A section of her Revelle. Only ever built from pieces that exist. */
export type MemberSection = {
  section: SectionKind;
  pieces: MemberPiece[];
};

/**
 * WHAT GETS SET IN THE DESTINATION'S TYPEFACE.
 *
 * Ingredient has now grown db/010's game_printed_matter rows — the card, the
 * rules sheet, the ballot — and they hang off THIS list and nowhere else, so
 * that "what is printed" stays one answer rather than a second one assembled
 * by whoever is building the print job that week. A surface that wants the
 * objects reads this; it does not go back to the pool tables for them.
 *
 * An ingredient that prints nothing of its own falls back to its own authored
 * text, which is the right answer for a menu: the menu card IS the menu's
 * line of dishes, and there is no second object to author.
 */
export type MemberPrintedPiece = {
  heading: string;
  body: string;
  section: SectionKind;
  /** One per head. The renderer says "one each", never a tally. */
  perGuest: boolean;
  /** A fixed count of the object, or null when nobody has counted. */
  quantity: number | null;
};

export type MemberRevelle = HouseOnly & {
  destination: MemberDestination;
  /** In the order she reads them. */
  pieces: MemberPiece[];
  /** The same pieces, grouped. Empty sections are not in the list. */
  sections: MemberSection[];
  printedMatter: MemberPrintedPiece[];
};

/**
 * THE ONLY SANCTIONED WAY FROM A CANDIDATE TO SOMETHING SHE MAY SEE.
 *
 * Everything the house recorded on the way — what was eliminated, what was
 * dropped and why, what the catalogue could not supply, what the money did,
 * whether a human must look — stops here. What comes out is the destination,
 * the pieces that were actually placed, and their printed matter.
 *
 * It THROWS on a blocked candidate rather than returning something smaller.
 * The only thing that ever blocks is assemblage uniqueness — this exact set
 * has already been delivered to someone — and that is a reason to withhold the
 * whole Revelle, not to quietly hand over a thinner one. A catalogue gap never
 * blocks; it is not an error, and a candidate with an unfilled required slot
 * comes through here complete and unremarked.
 */
export function memberRevelle(candidate: Candidate): MemberRevelle {
  if (candidate.blocked !== null) {
    throw new Error(
      `This candidate must not be delivered: ${candidate.blocked} ` +
        `Choose another candidate — the member is never told about this.`
    );
  }

  const pieces: MemberPiece[] = candidate.picks
    .slice()
    .sort((a, b) => a.slot.position - b.slot.position)
    .map((pick) => ({
      heading: pick.slot.label,
      section: pick.slot.section,
      name: pick.ingredient.name,
      description: pick.ingredient.description,
      quantity: pick.slot.quantity,
      perGuest: pick.slot.perGuest,
      dayIndex: pick.slot.dayIndex,
    }));

  const sections: MemberSection[] = [];
  for (const piece of pieces) {
    const last = sections[sections.length - 1];
    if (last && last.section === piece.section) {
      last.pieces.push(piece);
      continue;
    }
    sections.push({ section: piece.section, pieces: [piece] });
  }

  return {
    destination: {
      name: candidate.destination.name,
      tagline: candidate.destination.tagline,
    },
    pieces,
    sections,
    printedMatter: candidate.picks
      .slice()
      .sort((a, b) => a.slot.position - b.slot.position)
      .flatMap(printedMatterOf),
  };
}

/**
 * The objects one pick prints, or its own authored text when it prints none.
 *
 * Split out because the fallback is the interesting half. A game brings real
 * objects and its description is a sentence ABOUT the game, not a thing to
 * set in type; a menu brings no objects and its authored line of dishes IS
 * the card. Neither case needs a caller to know which is which.
 */
function printedMatterOf(pick: Pick): MemberPrintedPiece[] {
  const objects = pick.ingredient.printedMatter ?? [];
  if (objects.length > 0) {
    return objects.map((object) => ({
      heading: object.label,
      body: object.description,
      section: pick.slot.section,
      perGuest: object.perGuest,
      quantity: object.quantity,
    }));
  }

  const body = pick.ingredient.description.trim();
  if (body.length === 0) return [];
  return [
    {
      heading: pick.slot.label,
      body,
      section: pick.slot.section,
      perGuest: false,
      quantity: null,
    },
  ];
}
