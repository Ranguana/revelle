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
  /**
   * Which pool it came from, and its slug.
   *
   * Not house-only information and not a score: it is the address of the thing
   * itself, and a surface needs it to link a game to its own page (db/025).
   * Nothing here reveals what was rejected, what was dropped, or what the
   * catalogue could not supply — the wall is about the SEARCH, not about the
   * identity of what she was given.
   */
  pool: string;
  slug: string;
  /** How many of the object: her guest count on a per-head piece, else 1. */
  quantity: number;
  perGuest: boolean;
  /** 1-based, on an occasion that runs over days. Null on an evening. */
  dayIndex: number | null;
  /**
   * WHICH SET OF ALTERNATIVES THIS PIECE IS ONE OF — db/061 — or null for
   * everything the house simply placed.
   *
   * Member-facing for the same reason `pool` and `slug` are: it is a fact
   * about what she was given, not about how the search arrived at it. She was
   * handed three games and told to pick one; a page that could not tell which
   * three belong together could not show her the choice she was promised.
   */
  offerGroup: string | null;
  /** True for the one she has taken. At most one per offer. */
  chosen: boolean;
};

/** A section of her Revelle. Only ever built from pieces that exist. */
export type MemberSection = {
  section: SectionKind;
  pieces: MemberPiece[];
};

/**
 * ONE OBJECT THAT GETS SET IN THE DESTINATION'S TYPEFACE.
 *
 * Ingredient has now grown db/010's game_printed_matter rows — the card, the
 * rules sheet, the ballot — and they hang off THIS list and nowhere else, so
 * that "what is printed" stays one answer rather than a second one assembled
 * by whoever is building the print job that week. A surface that wants the
 * objects reads this; it does not go back to the pool tables for them.
 *
 * There is NO fallback to a piece's own description. An earlier version had
 * one and it was wrong in a way only visible on the page: a soundtrack and a
 * batch negroni are not printed, and rendering their descriptions as cards
 * produced a stack of objects that do not exist. What prints is what an
 * ingredient says prints. A menu says so in src/lib/selection/catalogue.ts,
 * where the menu card is made out of the dishes, because that is the file that
 * already knows a menu has no description and that its line IS the thing.
 */
export type MemberPrintedPiece = {
  /** The object. "The ballot", "The menu". */
  heading: string;
  /** What it came with. "Art Battle" — two games both print "The rules". */
  from: string;
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

  // AND THE SORT'S STABILITY IS LOAD-BEARING — db/061, db/062.
  //
  // The cards of one offer share a slot position: read back from the portal,
  // `slot.position` is `slot_kind.position`, which is 31 for all three
  // appetizers. What separates them is the order the rows arrived in, which
  // src/lib/portal/picks.ts fixes with `order by j.position` — the number
  // stamped once at approval and never recomputed.
  //
  // So this comparator returns 0 for the three cards of a course, and what
  // keeps them in delivery order is that Array#sort is STABLE (guaranteed
  // since ES2019, not a V8 accident). CLAUDE.md rule 18 rests on it: if these
  // three could swap between two loads of the same page, the card she is
  // reaching for would move under her hand.
  const pieces: MemberPiece[] = candidate.picks
    .slice()
    .sort((a, b) => a.slot.position - b.slot.position)
    .map((pick) => ({
      heading: pick.slot.label,
      section: pick.slot.section,
      name: pick.ingredient.name,
      description: pick.ingredient.description,
      pool: pick.ingredient.pool,
      slug: pick.ingredient.slug,
      quantity: pick.slot.quantity,
      perGuest: pick.slot.perGuest,
      dayIndex: pick.slot.dayIndex,
      // db/061. Both null/false on anything the engine has just produced: a
      // run of the engine delivers an offer and never makes a choice.
      offerGroup: pick.slot.offerGroup ?? null,
      chosen: pick.chosen ?? false,
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
 * The objects one pick prints. Nothing, for a pick that prints nothing.
 *
 * The section travels from the SLOT rather than from the object, so the
 * ballot that came with the game in THE FUN is filed under the fun — which is
 * where she will look for it.
 */
function printedMatterOf(pick: Pick): MemberPrintedPiece[] {
  return (pick.ingredient.printedMatter ?? []).map((object) => ({
    heading: object.label,
    from: pick.ingredient.name,
    body: object.description,
    section: pick.slot.section,
    perGuest: object.perGuest,
    quantity: object.quantity,
  }));
}
