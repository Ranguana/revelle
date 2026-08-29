/**
 * WHAT FOOD IS FOR, IN THIS ROOM. ONE DECLARED CLAIM PER ROOM.
 *
 * The founder's ruling, 2026-08-29, verbatim:
 *
 *   "food-identity must be a DECLARED CLAIM per room, not an inference from
 *    the row count. If `deliverables.mjs` decides 'incidental' by seeing few
 *    rows, then an under-authored table room reads as a healthy incidental
 *    room and the floor stops catching the very defect it exists for — a gate
 *    that can't fire, again. The room declares its identity (table /
 *    expression / incidental), and the floor per identity does the
 *    enforcement: table rooms owe 20+, expression rooms 12, incidental rooms
 *    something like 6–8."
 *
 * That is CLAUDE.md rule 30's last paragraph made mechanical. THE ROOM
 * DECLARES; THE FLOOR ENFORCES. This module is the declaring half and holds
 * nothing else — the floors live beside the measure they calibrate, in
 * `scripts/deliverables.mjs`, with their argument.
 *
 * ── WHY AN INFERRED IDENTITY IS NOT A GUARD AT ALL ───────────────────
 *
 * Stated here rather than only in the rule, because this is the single fact a
 * later reader has to hold: a floor that reads "few rows, therefore
 * incidental" cannot fail. Palm Springs at eleven and a table room stalled at
 * eleven produce the same number, so the measure would clear both and the
 * defect it was built for — a room whose food was never written — would pass
 * inspection wearing the costume of a room that refuses a seated meal. Rule 22
 * calls this a gate that cannot fire; rule 30 calls it the back door it
 * arrives through. The claim below is what makes the two cases distinguishable
 * from the outside: one of them SAYS it serves no meal, in the founder's own
 * sentence, and the other has said nothing at all.
 *
 * ── THE THREE VALUES, AND THE TEST THAT SORTS A NEW ROOM ─────────────
 *
 * They are the three the matrix work already uses, now doing double duty: the
 * same claim answers "what does this room owe in dishes" here and will answer
 * "what is this pair actually sharing" when the matrix adjudicates a breach.
 * Authored once, consumed twice (rule 21) — which is why it is a module both a
 * script and `src/lib` can import, and not a comment in either of them.
 *
 * The test is THE SPINE, and it is asked of the room's own words:
 *
 *   TABLE       The room seats people at a composed meal and the meal is the
 *               evening's spine. Take the food away and the evening has no
 *               shape left. Oaxaca's mole is the schedule.
 *
 *   EXPRESSION  The room feeds people substantially and the food carries real
 *               identity — but the spine is something else: the dancing, the
 *               movie, the cards, the story. Take the food away and the
 *               evening still happens, thinner. Havana's table is literally
 *               carried back against the wall so the party can start.
 *
 *   INCIDENTAL  The room REFUSES a seated meal, in its own sentence. Food
 *               serves the drinking and the talking and is meant to stay out
 *               of their way. Palm Springs: "nothing requires a fork."
 *
 * A room is sorted on what its premise and its deliverables sheet SAY, never
 * on how many rows it happens to have today. Every entry below therefore
 * carries the sentence it was derived from, and `food-identity.test.ts` checks
 * that sentence still appears in the authored source it names — a quote that
 * has drifted out of the document is a claim with its evidence torn off
 * (rule 17's shape, one layer out from the database).
 *
 * ── THE NAME THAT INVITES THE WRONG READING (rule 23) ────────────────
 *
 * `data/destination-matrix.json` HAS A FACET CALLED `food`, AND IT IS NOT
 * THIS. Its levels are `bought` / `cooked` / `arrived` and it is an axis of
 * PROVENANCE — who made it — graded against a quiz answer like every other
 * facet. This is an axis of PURPOSE, it grades nobody, it is asked of no host,
 * and it prunes no pool. The two come apart at both ends and the catalogue
 * already proves it: Amalfi is `bought` and is the most table-centred room in
 * the file, and Aspen is `cooked` while its own sheet subordinates the pot to
 * the dancing. Reading either column off the other produces a wrong floor
 * silently, which is the whole failure mode this module exists to close.
 *
 * ── WHY THE CLAIM LIVES HERE AND NOT IN THE THREE OTHER PLACES ───────
 *
 * NOT A COLUMN ON `world` (a db/051 migration was the obvious move and is
 * refused). Rule 22: the database is unreachable from any laptop and
 * `deliverables.mjs` is an offline reader of authored documents, so a column
 * could not be read by the consumer that needs it. Worse, five of the six
 * newest rooms have no `world` row at all — the claim would be undeclarable
 * for exactly the rooms whose floors are in question. A column would therefore
 * have to be fed from code anyway, which means the code is the owner and the
 * column is a projection. When the desk needs to render it, `seed-destinations`
 * writes it from here, the way `DESTINATION_TONES` already reaches
 * `world_facet`.
 *
 * NOT `data/destination-matrix.json`. It covers all eighteen rows, which is
 * the one thing in its favour, and it fails on rule 23: a key sitting beside
 * `facets` and `rows` reads as a tenth facet, and a tenth facet is something
 * rule 15 then demands a quiz answer for. This grades nothing. It would also
 * lose the closed value set — a typo in JSON is a runtime surprise, and here
 * it is a compile error.
 *
 * NOT INLINE ON EACH `Destination` IN `src/lib/destinations.ts`. Tempting,
 * because the claim belongs to the room and the evidence is on the same
 * screen. Two costs decided it. `Destination` is the WRITER's type — a look
 * and a voice, assembled into prompts — and food purpose is neither; and a
 * required field there breaks every `Destination` literal in the test suite,
 * including files this change does not own. Eighteen declarations in one
 * screen also review better than eighteen fields nine thousand lines apart,
 * which is the property that let this file be checked against its sources at
 * all.
 */

/** The three values. A room is exactly one of them. */
export type FoodIdentity = "table" | "expression" | "incidental";

/**
 * A declaration, with the evidence attached rather than remembered.
 *
 * `from` is VERBATIM from `source` and is checked to be (see the test). `why`
 * is the one line of reasoning that turns the sentence into the value, and it
 * is where a close call says so out loud instead of looking settled.
 */
export type FoodIdentityClaim = {
  readonly identity: FoodIdentity;
  readonly from: string;
  readonly source: "premise" | "deliverables-sheet";
  readonly why: string;
};

/**
 * ALL EIGHTEEN. Twelve wired rooms, five authored-but-unwired, and Acapulco,
 * which is wired and was the thirteenth.
 *
 * There is no default and there is no fallback: a room that is not in this
 * object has no floor, and `foodIdentityOf` throws rather than guessing twelve
 * at it. That is the loud half of rule 22's pair — a gate that cannot see a
 * room must stop, not wave it through.
 */
export const FOOD_IDENTITY = {
  /* ── THE TWELVE WIRED ROOMS ─────────────────────────────────────────
   *
   * Every one of them holds eighty claims or more, so no floor changes any of
   * their verdicts today. They are declared anyway, and carefully, because the
   * claim is consumed twice: the second consumer is the matrix's breach
   * adjudication, where "these two rooms are both table rooms" is the reading
   * that will matter and where a lazily-assigned value would be believed.
   */
  "westhampton-1976": {
    identity: "table",
    from: "a long dinner that turns into something else",
    source: "premise",
    why: "The dinner is the room's one structural event and everything after it is described as what the dinner became.",
  },
  havana: {
    identity: "expression",
    from: "Dinner runs until the table is carried back against the wall",
    source: "premise",
    why: "The table is physically removed so the party can start. Dinner and the second supper bracket the night; the dancing is the night. This is the founder's own contrast in rule 26 — rum in a nightclub against mole at a family table.",
  },
  "las-vegas": {
    identity: "expression",
    from: "a table held until midnight",
    source: "premise",
    why: "A table HELD is an asset secured for the night, not a meal the room authored; the spine is the one game and one stake agreed upstairs. THE CLOSEST CALL AMONG THE TWELVE — a booked dinner is still a dinner, and a founder reading this as `table` would not be contradicting the sentence.",
  },
  "new-york": {
    identity: "table",
    from: "Dinner is served, one person stands up at midnight",
    source: "premise",
    why: "A served dinner with a toast at it. The table is long enough to need a plan, which is the room's first fact.",
  },
  nantucket: {
    identity: "table",
    from: "a dinner everybody takes apart with their hands",
    source: "premise",
    why: "The meal is the event, and the room's tagline is two objects from it — newspaper on the table, butter in a saucepan.",
  },
  "new-orleans": {
    identity: "table",
    from: "a dinner nobody sits down to on time",
    source: "premise",
    why: "Late is not incidental: they do sit down, and the midnight coffee and something fried is a second course of the same evening.",
  },
  catskills: {
    identity: "table",
    from: "Dinner is long and loud and too much.",
    source: "premise",
    why: "Food opens the room before anyone is hungry and the trays never stop; the day gears down into a dinner the premise names as its own paragraph.",
  },
  "cote-dazur": {
    identity: "table",
    from: "a lunch that is still going at seven",
    source: "premise",
    why: "The meal IS the duration of the party — the tagline is `Lunch that never ended`.",
  },
  portofino: {
    identity: "table",
    from: "lunch takes the whole of Saturday",
    source: "premise",
    why: "One restaurant is open and it is the good one; a lunch that consumes a day is the spine even when the kitchen is not hers.",
  },
  dolomites: {
    identity: "table",
    from: "Dinner is one pot on a long table",
    source: "premise",
    why: "One pot, but seated at a long table, and the cards follow the meal rather than compete with it. The contrast with Aspen's identical pot is the words: `on a long table` against `while everybody dances in the kitchen and gets in the way`.",
  },
  "big-sur": {
    identity: "expression",
    from: "Dinner is cooked over a fire and eaten off a tailgate. The evening is one story at a time, told long",
    source: "premise",
    why: "The two sentences are consecutive and they hand the evening over: the fire-cooked dinner is character, the storytelling is the shape. Nothing here seats anybody.",
  },
  tahiti: {
    identity: "table",
    from: "A table set on sand, a fire beside it",
    source: "premise",
    why: "The room's first noun is the table, and dinner is eaten late and slowly at it. `food = arrived` in the matrix is provenance — what came in today — and says nothing about whether there is a table. There is.",
  },

  /* ── THE SIX NEWEST ROOMS ───────────────────────────────────────────
   *
   * These are the rooms the floors are actually adjudicating, and five of
   * their six declarations come from the founder's own deliverables sheets
   * (docs/deliverables-sheets.md), which is where she wrote what each room
   * serves. Acapulco is derived from its premise instead, because its sheet's
   * food line is deliberately conditional — "if it becomes dinner — nobody
   * decided it would" — while its premise states the table as the room's
   * invariant without a condition on it.
   */
  "amalfi-1953": {
    identity: "table",
    from: "A long table under striped umbrellas, laid for more people than were asked, and everything on it before anybody sits down.",
    source: "premise",
    why: "The whole room is a table. Its signature gesture is the plate refilled mid-sentence, which only exists because somebody is seated at one.",
  },
  "oaxaca-1954": {
    identity: "table",
    from: "the mole, started days ago, over chicken or turkey — that's the centerpiece",
    source: "deliverables-sheet",
    why: "Her word, `centerpiece`, and the premise makes it the schedule: the mole has been going since yesterday and that is the whole schedule. The comida runs from two until six.",
  },
  "acapulco-1959": {
    identity: "table",
    from: "Lunch never exactly ends — the table gets reset around whoever refuses to leave it",
    source: "premise",
    why: "The table is the room's signature gesture and its invariant — relaid, not cleared. The sheet's `if it becomes dinner` is about when, not whether; the food is continuous from lunch.",
  },
  "aspen-1994": {
    identity: "expression",
    from: "whatever gets made while dancing — one big pot, garlic bread, the box of good chocolate that's suddenly gone",
    source: "deliverables-sheet",
    why: "A real cooked meal, subordinated in her own sentence to the dancing, and the evening's spine is the movie and the blankets — the tagline names both and names no food. NOT incidental: a pot and garlic bread are dinner. THE CLOSEST CALL AMONG THE SIX, and the consequential one — read as `table` this room owes twenty and is eight short.",
  },
  "palm-springs-1965": {
    identity: "incidental",
    from: "drinks first, food that doesn't interrupt them — devilled eggs, cold shrimp, olives, things on picks. Appetizers on a tray. Nothing requires a fork or your full attention.",
    source: "deliverables-sheet",
    why: "The room refuses a seated meal in two independent sentences, and her superseding edit of this line went AWAY from a bigger table, not towards one. Its authored courses corroborate without being the evidence: appetizers and desserts, no mains at all.",
  },
  "st-moritz-1984": {
    identity: "incidental",
    from: "Then things that eat standing: smoked fish, cheese doing its best work, chocolate, something hot in small cups when the light goes. A late supper only if the night earns one.",
    source: "deliverables-sheet",
    why: "`Things that eat standing` is the refusal, and the supper is explicitly conditional — the one main this room has authored is that supper. Champagne first and mostly is the actual centre of the evening.",
  },
} as const satisfies Record<string, FoodIdentityClaim>;

/** Every room that has declared, for the reporters. */
export const DECLARED_ROOMS: readonly string[] = Object.keys(FOOD_IDENTITY);

/**
 * The declaration, or null. For a caller that wants to REPORT the absence.
 *
 * A caller that wants to ACT on the identity uses `foodIdentityOf` and gets an
 * exception, because acting on a missing claim is the one thing no consumer
 * may do quietly.
 */
export function foodIdentityClaim(slug: string): FoodIdentityClaim | null {
  return (
    (FOOD_IDENTITY as Record<string, FoodIdentityClaim>)[slug] ?? null
  );
}

/**
 * THE LOUD HALF. A room with no declaration has no floor and gets no verdict.
 *
 * It throws rather than returning a default, and the default it most wants to
 * return is the old uniform twelve — which is exactly the value that would
 * make an under-authored table room look healthy. The whole ruling is that
 * this cannot be inferred, so the absence of a claim is an authoring gap that
 * stops the measure, not a shrug it routes around.
 */
export function foodIdentityOf(slug: string): FoodIdentity {
  const claim = foodIdentityClaim(slug);
  if (!claim)
    throw new Error(
      `No food-identity declared for "${slug}". A room's food identity is a ` +
        `CLAIM the room makes (CLAUDE.md rule 30) and there is no default: ` +
        `without it there is no evidence floor and no deliverables verdict. ` +
        `Declare it in src/lib/food-identity.ts, with the sentence it was ` +
        `derived from, or leave the room out of the measure deliberately.`
    );
  return claim.identity;
}
