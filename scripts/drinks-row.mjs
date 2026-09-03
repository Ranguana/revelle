/**
 * WHAT A PARSED DRINK BECOMES IN THE `drink` TABLE.
 *
 * The third piece of one job, and it is a third piece for the reason the second
 * one was: scripts/seed-drinks.mjs connects to a database at import time and
 * `npm test` cannot. scripts/drinks-parse.mjs owns the READ, this owns the
 * MAPPING, and the seeder owns the WRITE — the transaction, the ledger, the
 * scoping, the counts, the refusals.
 *
 * ── WHY THE MAPPING IS NOT LEFT INSIDE THE SEEDER ───────────────────
 *
 * Because the one thing about it worth guarding cannot be reached from a test
 * otherwise. Twenty-one of the seventy-six drinks have no mirror, and what must
 * be true of them is a conjunction: `mocktails` is NULL **and** the status is
 * `draft`. Either half alone is wrong in a way nothing would report — a NULL
 * mirror on a live row is refused by db/060's `drink_live_has_its_mirror`, and
 * a draft row with an invented mirror is the failure the whole conversion
 * exists to avoid.
 *
 * The alternative was a test that reads the seeder's source and looks for a
 * token. scripts/catalogue-vocabulary.mjs already learned what that is worth,
 * beside `stockingStatus`: "a test that reads a source file for a token is
 * testing a spelling, and the spelling next to it was enough to keep the test
 * green while the behaviour was reverted." So the decision is a function, the
 * seeder's insert binds what the function returned, and the test drives the
 * function.
 *
 * Nothing here touches a database, decides scoping, or writes a ledger row.
 */
import { HELD, LIVE } from "./catalogue-vocabulary.mjs";

/**
 * How the note an owed drink carries begins.
 *
 * Exported because TWO places must agree about it and they are two statements:
 * the insert that writes it, and the update that clears it once the mirror is
 * authored. A second spelling would leave a false sentence in the column of a
 * drink that has its mirror — the note saying it is owed while the row says it
 * is not (CLAUDE.md rule 21).
 */
export const OWED_NOTE_OPENING = "THE MIRROR IS OWED.";

/**
 * The sentence an owed drink carries in its own `notes`, read at /desk/drinks.
 *
 * It names the debt, names who can settle it, and says plainly that deleting
 * the sentence settles nothing — because what holds the row back is a NULL
 * column and a check constraint, not this text.
 *
 * THAT LAST CLAUSE IS THE POINT, and it is CLAUDE.md rule 23: state the fact
 * where the wrong reading would be made. The house's other hold-back — the
 * `FOUNDER-PENDING` marker in scripts/catalogue-vocabulary.mjs — works exactly
 * the opposite way round: there, the question IS the hold-back and deleting it
 * publishes the row on the next run. Writing that marker here would invite a
 * curator to delete a sentence and expect a drink to go out, and what she would
 * get is a constraint name after a click.
 */
function owedNote(drink) {
  return (
    `${OWED_NOTE_OPENING} Programme ${drink.programme} ` +
    `("${drink.programmeLine}") names no mocktail twin for this drink, and ` +
    `nobody may invent one: a weak invented mirror is worse than a named gap, ` +
    `and db/017's guarantee — nobody at the table is visibly not drinking — is ` +
    `what an invented one spends. Held at draft. WRITING THE MIRROR IS WHAT ` +
    `PUBLISHES THIS ROW; deleting this note does nothing, because db/060's ` +
    `drink_live_has_its_mirror refuses to offer a drink whose mirror is null. ` +
    `docs/drinks.md, docs/drink-explosion.md §5 batch B.`
  );
}

/**
 * Where the row came from, in the document's own terms. Internal, never
 * member-facing.
 *
 * The programme's "what it is for" line lives HERE and not in `name`, which is
 * the whole of db/060 §I in one field: at the programme grain that sentence WAS
 * the row's name and was richer than any enum, and at the atomic grain "Gin and
 * tonics in tall glasses" is the name and "A summer dinner or cocktail party"
 * is where it came from. The sentence did not get poorer; it stopped being a
 * property of the row.
 */
function sourceNote(drink) {
  return (
    `Drink ${drink.programme}.${drink.index} of programme ${drink.programme}, ` +
    `"${drink.programmeLine}". docs/drinks.md; split out by ` +
    `docs/drink-explosion.md.`
  );
}

/**
 * One parsed drink -> the columns of one `drink` row.
 *
 * Meal claims and destination claims are NOT here: they are separate tables and
 * they need no mapping — `drink.meals` and `drink.destinations` come out of the
 * parser ready to insert.
 *
 * @param {import("./drinks-parse.mjs").ParsedDrink} drink
 * @returns {{
 *   slug: string, name: string, cocktails: string, mocktails: string|null,
 *   season: string, seasonNote: string, making: string, mirrorSelf: boolean,
 *   sourceNote: string, notes: string|null, status: string
 * }}
 */
export function drinkRow(drink) {
  const owed = drink.mirrorOwed;
  return {
    slug: drink.slug,
    // THE NAME IS THE DRINK. See sourceNote() above for what it used to be.
    name: drink.name,
    // Both builds of one record, never two rows and never a mirror table
    // (db/017). `cocktails` is the drink as she wrote it, which at this grain
    // is the same string as the name — the row IS the drink now.
    cocktails: drink.name,
    // NULL MEANS OWED. Not blank, not a placeholder, not an invented twin.
    mocktails: drink.mirror,
    season: drink.season,
    seasonNote: drink.seasonNote,
    making: drink.making,
    // Derived by the parser from the document — the author wrote the same line
    // twice — never judged here. db/060 §IV.
    mirrorSelf: drink.mirrorSelf,
    sourceNote: sourceNote(drink),
    notes: owed ? owedNote(drink) : null,
    // Live on the way in: the pool stocks itself and the desk vetoes rather
    // than consents (db/036, CLAUDE.md rule 13). The exception is not this
    // function being cautious — db/060's drink_live_has_its_mirror will not
    // hold an active row whose mirror is null, so `draft` is the only status
    // an owed drink has, and writing it here is what makes the RUN say so
    // instead of a constraint name.
    status: owed ? HELD : LIVE,
  };
}
