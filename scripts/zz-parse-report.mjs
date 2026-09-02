#!/usr/bin/env node
/**
 * Put the authored dishes into the database.
 *
 *   npm run seed:dishes
 *   npm run seed:dishes -- --overwrite   let the file beat the curator's edits
 *
 * The sibling of scripts/seed-menus.mjs and scripts/seed-drinks.mjs,
 * deliberately: same flags, same refusal to guess, same rule that a curator's
 * edit at the desk outranks the file, same shared vocabulary in
 * scripts/catalogue-vocabulary.mjs rather than a second copy of the maps. Read
 * seed-menus' header for the argument; only the differences are written out
 * here, and there are four of them.
 *
 * ─────────────────────────────────────────────────────────────────────
 * 1. 650 LINES BECOME 600 ROWS. THAT IS THE POINT, NOT A LOSS.
 *
 * The founder's instruction, verbatim:
 *
 *   "Dishes repeat across destinations on purpose — dedupe to one row with
 *    multiple destination tags at import."
 *
 * Oysters on the half shell is written under Westhampton, Nantucket, Côte
 * d'Azur and New Orleans. It is ONE dish that four houses serve. So the unit
 * this script writes is the dish, and the destination becomes a `dish_world`
 * row — the same shape `menu_world` and `drink_world` already have, and the
 * same `native` CLAIM (db/019), because every line of the document sits under a
 * destination heading and that is precisely what the claim means.
 *
 * THE KEY IS (name, COURSE), NOT name. The document contains exactly one
 * disagreement of that kind and it is not a typo: "Papaya with lime" is a
 * DESSERT at Tahiti and an APPETIZER at Havana. Those are two things to serve
 * at two moments, and one row would force one house to be wrong.
 *
 * ─────────────────────────────────────────────────────────────────────
 * 2. THE SLUG COMES FROM THE NAME, AND WHY THAT IS NOT A STYLE CHOICE
 *
 * The other two seeders number their slugs ('menu-01', 'drink-07') because
 * their documents number their entries. docs/dishes.md numbers nothing.
 *
 * A positional slug would therefore mean that inserting one dish into the
 * middle of Nantucket renumbers every dish after it — and this script leaves
 * existing rows alone and CREATES the ones it cannot find, so a renumbering
 * would create four hundred duplicate dishes in a single run, silently, in one
 * transaction that commits. The name is the stable thing, so the name is the
 * key.
 *
 * Two names can still slugify to one string. Today none of the 600 do, and the
 * one pair that shares a name is separated by course. The rule below handles
 * both cases without ever inventing an arbitrary suffix, and FAILS rather than
 * guessing if a third kind of collision ever appears.
 *
 * ─────────────────────────────────────────────────────────────────────
 * 3. WHEN TWO DESTINATIONS DISAGREE ABOUT A SEASON
 *
 * Three of the 650 lines put the same dish under two destinations with two
 * different answers about the calendar:
 *
 *     Strawberry shortcake   Nantucket "early summer" · New Orleans "spring"
 *     Fried chicken          Catskills "summer"       · New Orleans (none)
 *
 * Both readings are true where they were written — strawberries come in in
 * March in Louisiana and in June on Nantucket — but a deduped dish has one
 * `season` column, and picking a winner would silently delete one author's
 * judgement.
 *
 * So: A CLAIM TWO DESTINATIONS DISAGREE ABOUT IS NOT A CLAIM. The dish becomes
 * `year_round`, which db/012 glosses as "Makes no claim about the calendar",
 * with `season_strict` false and both wordings recorded in `source_note` — the
 * internal column, never rendered to a member — so a curator can see exactly
 * what was given up and set it by hand. Every one of them is REPORTED by name
 * on every run, because a rule this quiet must not also be invisible.
 *
 * ─────────────────────────────────────────────────────────────────────
 * 4. AN UNKNOWN HEADING IS AN ERROR AND SO IS AN UNREADABLE LINE
 *
 * A `##` that is not a destination, a `###` that is not one of the three
 * courses, a bullet whose fields do not read, a making letter that is not one
 * of three, a season wording nobody has mapped, a meal-shape code nobody has
 * mapped, or a count that is not fifty per destination — every one of them
 * stops the run and names the line number. docs/new-destination.md §5 explains why that is right and what
 * it costs: a new section without a map entry fails the pre-deploy step and
 * blocks the deploy, which is enormously better than a typo in a destination
 * name silently dropping fifty dishes.
 *
 * Same connection rules as scripts/migrate.mjs. Needs DATABASE_URL.
*
 * ── ONE ASYMMETRY, STATED SO IT IS NOT A SURPRISE ────────────────────
 *
 * `--overwrite` lets the file beat the curator's WORDS when explicitly asked.
 * seed:menus, seed:drinks and seed:dishes have it; seed:games and
 * seed:destinations do not.
 *
 * BUT THE FLAG HAS NOTHING TO DO WITH STATUS, WHICH IS THE PART THAT MATTERS.
 * No seeder in this repo writes `status` on a row that already exists — not
 * one, checked across all five. `--overwrite` rewrites name, contents, season,
 * notes; a status is written once, on the way in, and never again.
 *
 * WHAT THIS PARAGRAPH USED TO END WITH, kept because it was the thing worth
 * knowing and because CLAUDE.md rule 14 says a reversed decision keeps its
 * argument:
 *
 *   "`--activate` only touches rows the seeder itself just created. So
 *    PUBLISHING IS ONE-WAY FOR EVERY POOL, and the only way back is a person
 *    withdrawing a row by hand at the desk."
 *
 *   (And before that, an earlier version said the asymmetry was about
 *    reversibility and named the wrong scripts. It was wrong twice. The
 *    distinction it missed — words are revertible, offered-ness is not — is
 *    the one worth knowing.)
 *
 * BOTH HALVES OF THAT ARE NOW FALSE FOR THIS POOL, and it is worth being exact
 * about which part lost. `--activate` is gone (db/036, CLAUDE.md rule 13): a
 * dish this seeder creates is LIVE on the way in, because nobody reads 372
 * dishes to decide whether a dish may exist. And publishing is no longer
 * one-way — /desk/stocked lists what a seeder put out, run by run, and sends
 * one row or a whole run back to draft in a click. The founder vetoes; she no
 * longer consents.
 *
 * What did NOT change is the sentence the old rule was really protecting, which
 * still governs `world` and `world_voice` word for word: deciding that a
 * DESTINATION is offered is a curator's decision and not a script's. This
 * seeder can create a draft stub for a destination and it still cannot publish
 * one — see the stub note at the end of the run, and src/lib/governed.test.ts,
 * which fails the build if it tries.

 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import pg from "pg";

import {
  DESTINATIONS,
  LIVE,
  MEALS,
  SEASONS,
  SEASON_NARROWED,
  ensureWorld,
  recordAutoPublish,
  refuseActivateFlag,
  stockingRun,
} from "./catalogue-vocabulary.mjs";

const SOURCE = fileURLToPath(new URL("../docs/dishes.md", import.meta.url));

refuseActivateFlag("seed-dishes");
const overwrite = process.argv.includes("--overwrite");

/** One id for this run, so /desk/stocked can group what it put out. */
const RUN = stockingRun();

/** Kept in sync with the same function in scripts/migrate.mjs and src/lib/db.ts. */
function needsSsl(url) {
  if (/sslmode=disable/.test(url)) return false;
  return !/@(localhost|127\.0\.0\.1|\[::1\])/.test(url);
}

/**
 * THE THREE AUTHORED POSITIONS, IN THE KITCHEN'S OWN SHORTHAND.
 *
 * docs/dishes.md, at the top: "Level: B = bought and arranged · H = half made ·
 * M = actually made."
 *
 * ONE AXIS, THREE VOCABULARIES. These are the same three rungs the menus write
 * out in words and the bar writes as "actually mixed / bought and poured", and
 * they map onto the same `making_level` values so that one answer from a host
 * governs the plate, the table and the bar together. Nothing downstream can
 * tell the three phrasings apart — db/017's made_by_hand_weight() sees only the
 * enum — which is the point.
 *
 * A letter and not a prefix match: `Bought` would also start with B, and a line
 * that is nearly one of these is a malformed entry that should name itself
 * rather than be truncated into a value.
 */
const LEVELS = new Map([
  ["B", "bought_and_arranged"],
  ["H", "half_made"],
  ["M", "actually_made"],
]);

/**
 * The `### heading` -> the value of `course` (db/021).
 *
 * A table rather than a lowercase-and-singularise rule, for the reason
 * DESTINATIONS is a table: a rule that gets one of three wrong is worse than a
 * list, and "Mains" -> "main" is not a rule anything else in this codebase
 * follows. An unknown heading is an error, not a skip.
 */
const COURSES = new Map([
  ["Appetizers", "appetizer"],
  ["Mains", "main"],
  ["Desserts", "dessert"],
]);

/** docs/dishes.md, at the top: "Roughly 50 per destination". Exactly 50 today. */
// Every destination held exactly fifty until 2026-08-22, when CAP FERRAT was
// folded into CÔTE D'AZUR and 380 authored dishes were appended. The counts now
// vary by design, so a single constant cannot express the invariant any more —
// but the invariant itself is unchanged and still worth having: A COUNT THAT
// MOVES ON ITS OWN IS EITHER AN EDIT OR A PARSER THAT LOST A LINE, AND
// AFTERWARDS THOSE LOOK THE SAME.
//
// So the expectation becomes a manifest rather than a number. Changing the
// document means changing this table in the same commit, which is exactly the
// discipline the old constant enforced — one destination at a time instead of
// all of them at once.
//
// Côte d'Azur is the outlier at 119 because it absorbed Cap Ferrat's pool.
//
// ── 2026-08-27: FIVE ROOMS JOIN, AND THEY JOIN AT SINGLE DIGITS ──────
//
// The twelve entries above are pools of 77–119, and reading this table it is
// easy to take those numbers as the shape a room is supposed to have. They are
// not. Amalfi Coast 8, Aspen 6, Palm Springs 7, St. Moritz 5 and Oaxaca 1 are
// everything the founder's four deliverables sheets, her one Oaxaca
// cell-evidence line and her pasta ruling actually contain, and THE THINNESS IS
// THE RECORD — each sheet names between three and five foods, and inventing the
// other seventy would be an agent authoring a room's food under her name. The
// right response to a single-digit entry here is to get a sheet, not to pad the
// document until the number looks like its neighbours.
//
// Amalfi is 8 rather than 6, and WESTHAMPTON MOVES 90 -> 91, because of two
// founder rulings on 2026-08-27: "anyplace like ny, las vegas and italy have to
// allow pasta", which reversed an earlier and defensible decision to give
// Amalfi no pasta at all; and "th[ey] both can use spaghetti w clams, as can
// westhampton", which puts one dish under three headings. Both arguments,
// including the one that lost, are in docs/proposals.md per rule 14.
//
// WESTHAMPTON'S +1 IS WHY THIS TABLE IS PER-ROOM AND NOT A TOTAL. A ruling
// about an Italian room moved an American room's count, because a shared dish
// is written under every heading that claims it and deduped at import. A single
// total would have absorbed that movement silently; a per-room manifest makes
// somebody type the 91.
//
// Palm Springs has no Mains section at all, and that is her sheet being obeyed
// rather than a course lost by the parser: "nothing requires a fork or your
// full attention". A room may hold fewer than three courses.
//
// ── 2026-08-27, LATER: AMALFI GOES 8 -> 22 ON A SECOND SHEET ─────────
//
// The paragraph above is kept whole (rule 14) and one of its numbers is now
// superseded rather than wrong. It said the right response to a single digit is
// TO GET A SHEET, and a sheet arrived: the founder sent fifteen Amalfi foods in
// one message. Fourteen are new lines here — the fifteenth, spaghetti alla
// Nerano, was already written that morning — so the room moves 8 -> 22.
//
// THE THINNESS ARGUMENT IS UNCHANGED AND STILL GOVERNS THE OTHER FOUR. Aspen 6,
// Palm Springs 7, St. Moritz 5 and Oaxaca 1 stay exactly where they are. Amalfi
// did not grow because 8 looked small; it grew because more of her food exists
// now than did this morning. Nothing was padded and no line here is an agent's
// invention.
//
// WHY THE NUMBER MATTERS BEYOND THIS FILE: `EVIDENCE_FLOOR` in
// scripts/deliverables.mjs is 12, on the SMALLER room of a pair, so at 8 every
// Amalfi pair read `unknown` and rule 26 forbids reading `unknown` as
// `disjoint`. At 22 the room is measurable against all twelve wired rooms for
// the first time. That is the whole reason a dish count is load-bearing.
//
// ACAPULCO IS DELIBERATELY ABSENT FROM THIS TABLE. It is in DESTINATIONS and it
// has no deliverables sheet, so it has no `##` heading in the document and
// therefore never reaches this check — `counts` only holds rooms the document
// mentions. It is founder-owed food, not a manifest omission.
//
// ── 2026-08-28: ACAPULCO ARRIVES AT 24, AND WHAT BEAT THE PARAGRAPH ABOVE ──
//
// The paragraph is kept whole (rule 14) and is now superseded on its verdict
// while remaining right about its reason. It said the room has no sheet, and it
// still has none. What changed is that A SHEET IS NOT THE ONLY KIND OF
// EVIDENCE: `docs/acapulco-1959-food.md` is a researched pass over the Guerrero
// coast in 1959 — twenty-two dish blocks, each carrying a period check, a
// rule-6 tier, a stated border test against Oaxaca and its own founder
// question. Twenty-one of them are converted here, plus three that the second
// ruling below frees.
//
// THE EARLIER RULING THIS REVERSES, QUOTED SO THE REVERSAL IS LEGIBLE.
// docs/proposals.md, 2026-08-27: "Zero Acapulco dishes are written below.
// Transcribing an agent's draft into the dish pool under her name is
// retro-tagging with a byline on it." That was correct about the room's
// `menu_item` exemplars, which ARE an agent's draft, and it is not what landed:
// the lines below are sourced research with citations, not exemplars copied
// across. Rule 13 settles where they may sit — dishes are POOL content that
// stocks itself and the founder VETOES at the desk rather than consenting in
// advance. Her instruction on 2026-08-27, verbatim: "no. dont cut corners."
//
// TWO FOUNDER RULINGS ON 2026-08-28 SET THE MAINS COUNT AT NINE, and both
// overturn constraints the source document reasoned under:
//
//   1. "so the answer is more dishes." The document argued its mains "will not
//      honestly grow much past seven" because "the room gets exactly one fire."
//      Rule 25.3 is about STAFF, not difficulty — "the host can of course make
//      all of those things" — and a second hot dish implies no second cook.
//   2. "also get rid of the constraint globally 'or have been finished hours
//      ago'." The made-ahead requirement is retired catalogue-wide. THE TEST IS
//      SERVICE: no dish may imply somebody plating to order and carrying it out
//      while she is at her own table. Nothing below does.
//
// So the three added mains are FIRE doing more than one job — grilled oysters,
// grilled shrimp in their shells, fried fish fillets — and each is a second
// preparation of a food the document already establishes in this room with a
// source. None resurrects anything from its "Cut, and why" list: those cuts
// stand on rule 6 and on period, which neither ruling touched.
//
// ONE OF THE TWENTY-TWO DID NOT LAND, and it is named in docs/proposals.md:
// "Whatever lunch left, put back out cold when dinner starts" names no food,
// has no making level to give (its own entry says "making: none, twice"), and
// is already THE RESET — this room's signature gesture, recorded in
// destinations.ts as owed a `world.gesture` row. As a dish it would fill a
// member's dish slot with a mechanism. Founder's to route.
const PER_DESTINATION = {
  "Westhampton": 91,
  "Nantucket": 85,
  "New York": 86,
  "Côte d'Azur": 119,
  "Vegas": 86,
  "Catskills": 87,
  "Dolomites": 79,
  "Tahiti": 77,
  "Havana": 84,
  "Big Sur": 84,
  "New Orleans": 80,
  "Portofino": 80,
  "Amalfi Coast": 22,
  // 1 -> 4. THREE ADDED, AND THE ROOM STOPS THERE ON RULE 3 RATHER THAN ON A
  // NUMBER. `tamales` and `tortillas` are named in HER OWN RULING, quoted in
  // this room's `never` list — "the dishes may always be named — mole, tamales,
  // tortillas, mezcal are table words. They may never be adjectived" — which is
  // both the licence for the two lines and the CAP ON THEM: a filling or a
  // style would be an adjective on a table word, so each noun gets exactly one
  // line and the clause that follows it is about time, in her register.
  // `mezcal` is the fourth table word and is a DRINK, so it is not here. The
  // appetizer is the mezcal plate's other half: the take-home bank establishes
  // that plate carries ORANGE SLICES and a twist of worm salt off it.
  //
  // WHAT IS STILL MISSING IS FOOD, NOT PERMISSION. Beans, rice, the chocolate
  // beaten with water and "the mole over chicken or turkey" are NOT in this
  // repository in her hand — docs/proposals.md already recorded that the
  // paragraph carrying them "does not exist in this repository" and may be an
  // agent's draft that acquired her name in transit. Rule 3 forbids writing
  // them on that basis. The drinking chocolate IS evidenced (the chocolate
  // tablet, the jícara, the molinillo at the chairs-to-the-wall turn) and is a
  // DRINK, so it belongs to docs/drinks.md and not to this table.
  //
  // This room is below EVIDENCE_FLOOR (12) and is reported as such. The fix
  // that worked for Acapulco is the fix here: a sourced research pass, or a
  // sheet. Not padding.
  "Oaxaca": 36,
  // 7 -> 11, ONE UNDER THE FLOOR, AND THE SHORTFALL IS DELIBERATE.
  // Palm Springs still has NO MAINS, and that is unchanged by the 2026-08-28
  // rulings: they retired an inference about LABOUR, and "nothing requires a
  // fork or your full attention" is a sentence SHE WROTE about the party. The
  // founder is the only person who can revisit it, and she has been asked
  // rather than assumed — see docs/proposals.md.
  //
  // Three of the four additions come from "things on picks", which is the only
  // clause in any of the four sheets that names a CATEGORY of preparations
  // rather than a food; the fourth is the valley's own crop, which the
  // take-home bank establishes as "a paper sack of medjools — the valley's
  // actual crop, not an import".
  //
  // WHY IT STOPPED AT ELEVEN INSTEAD OF REACHING TWELVE. A twelfth line was
  // available in the abstract and every candidate failed the count: `Olives
  // stuffed with almonds` against Vegas' `Blue cheese-stuffed olives` and Côte
  // d'Azur's `Green olive and almond bowls`; `Radishes with butter and salt`
  // against TWO existing rows; `Lime sherbet` against three `Lemon sorbet`
  // rows and a `Melon sorbet`; `Chocolate mints` against `Mints in silver
  // dishes`. Each would have been "same frame, one ingredient swapped".
  //
  // The most useful finding is about her own line `One tray that looks
  // expensive`, whose CONTENTS the sheet never names: 1965's answers are
  // smoked salmon, caviar and pâté, and the twelve wired rooms already hold
  // six, seven and three rows of those respectively. THE EXPENSIVE TRAY CANNOT
  // BE ENUMERATED WITHOUT TAKING ANOTHER ROOM'S PLATE. That is a real
  // constraint on this room and it is founder-owed, not an authoring failure.
  // Eleven honest lines beat twelve with padding.
  "Palm Springs": 11,
  // 5 -> 7, AND THE ROOM STOPS SHORT OF THE FLOOR FOR A REASON WORTH READING.
  // Both additions come from the room's own material rather than from a
  // species list: the caviar service, the mother-of-pearl spoon and the caviar
  // tin are all NATIVE St. Moritz rows in the take-home bank, so caviar is
  // evidenced here by objects the room already ships; and the consommé is a
  // preparation of her own "something hot in small cups when the light goes",
  // which the 2026-08-28 ruling frees to be made at the moment.
  //
  // WHY IT IS NOT TWELVE, AND THIS IS A FINDING RATHER THAN AN EXCUSE. Her
  // sheet names four standing foods, and the obvious way to reach twelve is to
  // enumerate species under them — smoked salmon, smoked trout, smoked eel.
  // THE COUNT REFUSES IT: the twelve wired rooms already hold six "smoked
  // salmon + a carrier" rows and four "smoked trout + a carrier" rows, so a
  // seventh and a fifth would be the single-substitution duplicate CLAUDE.md's
  // unratified section names — "same frame, one ingredient swapped" — and
  // would hand this room another room's plate under a new slug. It is the same
  // reasoning that cut two anchovy lines from Amalfi as near-neighbours of
  // Portofino's.
  //
  // TWO GAPS ARE FOUNDER-OWED, both named in docs/proposals.md: the food of
  // the late supper her sheet makes conditional ("a late supper only if the
  // night earns one" names the course and not its contents), and the half-past
  // eleven course that this room's own timetable card fills with FONDUE —
  // which rule 6 refuses, because Dolomites owns alpine cheese outright. That
  // refusal stands and it leaves a real hole she should see.
  "St. Moritz": 7,
  // 6 -> 12, AND IT CLEARS EVIDENCE_FLOOR. Her sheet names three foods and a
  // MECHANISM — "whatever gets made while dancing" — and the mechanism is the
  // licence: this is the one room whose food is defined by being cooked during
  // the party, by the people at it, in a kitchen everybody has crowded into.
  // The 2026-08-28 ruling retiring the made-ahead constraint changes nothing
  // here except to confirm what she already wrote.
  //
  // The six are 1994 American repertoire (rule 6: repertoire goes anywhere the
  // register fits), on the precedent the founder already let stand in this
  // room — "Chips and the onion dip made from the packet", marked in
  // docs/proposals.md as an agent's extension and not cut. Each is self-serve,
  // which is rule 25.3's only surviving test: nothing here is plated to order
  // and carried out.
  //
  // THE COUNT PICKED THE LINES, NOT TASTE (rule 24). Four candidates were
  // dropped because a grep of the document found them already spent: `Brownies
  // from the pan` EXISTS at Big Sur as `M`, so an Aspen `H` would have failed
  // the seeder's level-disagreement check outright; `Campfire chili` and
  // `Venison chili` are Big Sur's, so a third chili would have been the
  // single-substitution duplicate; and `Pickled okra and pepper jelly with
  // cream cheese` is New Orleans', which killed the cream-cheese-and-pepper-
  // jelly line. Reading would have caught none of the four.
  //
  // `Marshmallow squares` and `Cookies from the tube` are described rather than
  // branded, following her own two examples in this room — "the onion dip made
  // from the packet", "the box of good chocolate" — which is rule 25.2 obeyed
  // in her own idiom.
  "Aspen": 12,
  "Acapulco": 24,
};

function fail(message) {
  console.error(`\n[seed-dishes] FAILED: ${message}`);
  process.exit(1);
}

/**
 * A slug from a dish's name.
 *
 * Deliberately NOT imported from src/lib/desk/labels.ts, which is the desk's
 * and truncates at 60 characters for a curator typing a name into a box. The
 * longest authored dish slugifies to 58 and truncation here would be a way for
 * two long names to collide silently, so this one does not truncate at all —
 * the CHECK on dish.slug has no length limit either.
 */
function slugify(name) {
  const slug = name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!/^[a-z]/.test(slug)) {
    fail(
      `"${name}" slugifies to "${slug}", which does not start with a letter. ` +
        `dish.slug is checked against '^[a-z][a-z0-9-]*$' — see db/021.`
    );
  }
  return slug;
}

/* ── the parser ─────────────────────────────────────────────────────── */

/**
 * THE DISH LINE, IN BOTH SHAPES IT IS ALLOWED TO HAVE.
 *
 * The founder's format is POSITION-DELIMITED on U+00B7 MIDDLE DOT, which is
 * what she typed, and which is what lets a letter mean one thing in one
 * position and another thing in the next — `B` is "bought and arranged" in the
 * making field and `BR` is brunch in the last one, with no collision, because
 * position decides.
 *
 *     - <name> · <making>                          the 650 lines as they stand
 *     - <name> · <making> (<season>)               … and their parenthesised
 *                                                    season, also as they stand
 *     - <name> · <making> · <season> · <what for>  the four-field form
 *
 * BOTH SHAPES ARE ACCEPTED AND THAT IS NOT A TRANSITIONAL KINDNESS. Six hundred
 * and fifty authored lines exist; asking for them to be re-authored to gain a
 * field that is empty on most of them would be asking a person to do a
 * machine's work. She adds the fourth field where it matters, over time, and
 * the pool has to work before she does.
 *
 * AN EMPTY FIELD MEANS ANYWHERE, in both positions. `- Deviled eggs · M ·  · C`
 * is a dish with no season and one meal shape, and the doubled separator is
 * deliberate rather than an error to be tidied: dropping the empty field would
 * make the last position ambiguous, which is the one thing position-delimiting
 * exists to prevent.
 */
const SPLIT = /\s*·\s*/;
/** The trailing `(season)` of the three-field form, on the making field. */
const PARENTHESISED = /^([BHM])\s*\(([^)]+)\)$/;

function parse(text) {
  const lines = text.split("\n");
  const entries = [];

  let destination = null;
  let course = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    const course3 = /^###\s+(.+?)\s*$/.exec(line);
    if (course3) {
      if (!destination) {
        fail(
          `line ${i + 1}: "${course3[1]}" is a course heading with no ` +
            `destination above it.`
        );
      }
      if (!COURSES.has(course3[1])) {
        fail(
          `line ${i + 1}: "${course3[1]}" is not one of the three courses ` +
            `(${[...COURSES.keys()].join(" · ")}). An unknown heading is a ` +
            `decision, not a skip — add it to COURSES here and to the ` +
            `\`course\` enum in a migration.`
        );
      }
      course = COURSES.get(course3[1]);
      continue;
    }

    const heading = /^##\s+(.+?)\s*$/.exec(line);
    if (heading) {
      // Unlike the menus and the drinks, EVERY `##` in this document is a
      // destination — it opens with prose under `#` and has no trailing
      // sections — so an unrecognised one is a typo rather than a paragraph,
      // and ensureWorld's own error is the right one to raise. Checking here
      // as well means the line number survives.
      if (!Object.hasOwn(DESTINATIONS, heading[1])) {
        fail(
          `line ${i + 1}: "${heading[1]}" is not a destination this catalogue ` +
            `knows. Add it to DESTINATIONS in ` +
            `scripts/catalogue-vocabulary.mjs — docs/new-destination.md §5 is ` +
            `about exactly this step.`
        );
      }
      destination = heading[1];
      course = null;
      continue;
    }

    if (!line.startsWith("- ")) continue;

    const body = line.slice(2).trim();
    if (!destination || !course) {
      fail(
        `line ${i + 1}: "${body}" is a dish with no ` +
          `${destination ? "course" : "destination"} heading above it.`
      );
    }

    const fields = body.split(SPLIT).map((field) => field.trim());
    if (fields.length < 2 || fields.length > 4) {
      fail(
        `line ${i + 1}: "${body}" has ${fields.length} field(s). A dish line is ` +
          `"- <name> · <B|H|M>" with an optional season and an optional ` +
          `"what it's for", either as "· <season> · <codes>" or as the older ` +
          `"(<season>)" after the letter.`
      );
    }

    const name = fields[0];
    if (name.length === 0) fail(`line ${i + 1}: the dish has no name.`);

    // The making field, in both forms. The parenthesised season is read off it
    // FIRST, so that a three-field line and a four-field line arrive at the
    // same two values and nothing downstream knows which shape it came from.
    let letter = fields[1];
    let season = fields.length >= 3 ? fields[2] : "";
    const parenthesised = PARENTHESISED.exec(letter);
    if (parenthesised) {
      letter = parenthesised[1];
      if (season.length > 0) {
        fail(
          `line ${i + 1}: "${body}" names its season twice — once in ` +
            `parentheses and once in the third field. One or the other.`
        );
      }
      season = parenthesised[2].trim();
    }

    if (!LEVELS.has(letter)) {
      fail(
        `line ${i + 1}: "${letter}" is not one of the three authored levels ` +
          `(${[...LEVELS.keys()].join(" · ")}). B = bought and arranged, ` +
          `H = half made, M = actually made.`
      );
    }

    if (season.length > 0 && !Object.hasOwn(SEASONS, season)) {
      fail(
        `line ${i + 1}: season "${season}" is not in the mapping in ` +
          `scripts/catalogue-vocabulary.mjs. Add it there — a new wording is a ` +
          `decision, not a default.`
      );
    }

    // WHAT IT IS FOR — the fourth position, and empty means anywhere. Several
    // are allowed, comma-separated, because a dish that honestly suits two
    // shapes should say so rather than be filed under the likelier one.
    const meals = [];
    const forWhat = fields.length >= 4 ? fields[3] : "";
    if (forWhat.length > 0) {
      for (const raw of forWhat.split(",")) {
        const code = raw.trim();
        if (code.length === 0) continue;
        if (!Object.hasOwn(MEALS, code)) {
          fail(
            `line ${i + 1}: "${code}" is not one of the meal shapes ` +
              `(${Object.keys(MEALS).join(" · ")}). An unknown code is a ` +
              `decision, not a skip — see db/023 for where the five came from.`
          );
        }
        const meal = MEALS[code];
        if (!meals.includes(meal)) meals.push(meal);
      }
    }

    entries.push({
      line: i + 1,
      destination,
      course,
      name,
      making: LEVELS.get(letter),
      seasonNote: season,
      meals,
    });
  }

  if (entries.length === 0) fail("no dishes found in docs/dishes.md");
  return entries;
}

/**
 * 650 entries -> 600 dishes.
 *
 * Everything that can disagree between two lines of the same dish is checked
 * here rather than resolved silently. Course is part of the key, so it cannot
 * disagree; level and season can, and they are treated differently on purpose:
 *
 *   LEVEL     disagreeing is an ERROR. "Fried chicken · M" at one destination
 *             and "Fried chicken · B" at another is not a nuance, it is one of
 *             the two lines being wrong, and the axis it disagrees on is the
 *             one the host is asked about by name. There are none today.
 *   SEASON    disagreeing is a REPORTED WIDENING. See the header.
 */
function collapse(entries) {
  const dishes = new Map();

  for (const entry of entries) {
    const key = `${entry.name} ${entry.course}`;
    let dish = dishes.get(key);
    if (!dish) {
      dish = {
        name: entry.name,
        course: entry.course,
        making: entry.making,
        destinations: [],
        // Every wording seen for this dish, in document order, including the
        // empty string for a line that named no season. Resolved below.
        seasonNotes: [],
        // WHAT IT IS FOR, UNIONED ACROSS THE LINES. A dish written under two
        // destinations where one line says "D" and the other says nothing is
        // claimed for a long dinner and, by the other line, for anywhere — and
        // the union is the honest reading of two authors' answers. It is also
        // the SAFE direction: no claims at all means eligible everywhere, so a
        // union can only ever narrow, never delete.
        meals: [],
        firstLine: entry.line,
      };
      dishes.set(key, dish);
    }

    if (dish.making !== entry.making) {
      fail(
        `line ${entry.line}: "${entry.name}" is ${entry.making} here and ` +
          `${dish.making} at line ${dish.firstLine}. How much of a dish is ` +
          `made is the axis a host is asked about by name; two answers for one ` +
          `dish is one of the lines being wrong, not a nuance. Fix the ` +
          `document.`
      );
    }

    if (dish.destinations.includes(entry.destination)) {
      fail(
        `line ${entry.line}: "${entry.name}" appears twice under ` +
          `${entry.destination} as the same course.`
      );
    }
    dish.destinations.push(entry.destination);
    dish.seasonNotes.push(entry.seasonNote);
    for (const meal of entry.meals) {
      if (!dish.meals.includes(meal)) dish.meals.push(meal);
    }
  }

  const disagreed = [];

  for (const dish of dishes.values()) {
    const distinct = [...new Set(dish.seasonNotes)];

    if (distinct.length === 1 && distinct[0] === "") {
      // The 543-line majority: no claim about the calendar, and `year_round` is
      // db/012's own word for that rather than a default standing in for a
      // missing answer.
      dish.season = "year_round";
      dish.seasonNote = "";
      dish.seasonStrict = false;
      dish.sourceNote = null;
    } else if (distinct.length === 1) {
      dish.seasonNote = distinct[0];
      dish.season = SEASONS[distinct[0]];
      // Strict where the band holds the whole of her wording; a weight where
      // the band is only part of it. The argument is beside SEASON_NARROWED.
      dish.seasonStrict = !SEASON_NARROWED.has(distinct[0]);
      dish.sourceNote = null;
    } else {
      // Two destinations, two answers. Neither wins.
      dish.season = "year_round";
      dish.seasonNote = "";
      dish.seasonStrict = false;
      dish.sourceNote =
        `Season differs by destination in docs/dishes.md — ` +
        dish.destinations
          .map((d, i) => `${d}: ${dish.seasonNotes[i] || "unseasoned"}`)
          .join("; ") +
        `. Deduped to one row, so the dish makes no claim about the calendar. ` +
        `Set it by hand if one of them should win.`;
      disagreed.push(dish);
    }
  }

  return { dishes: [...dishes.values()], disagreed };
}

/**
 * A stable slug per dish, and a loud failure rather than an invented suffix.
 *
 * A name that is unique in the document gets the bare slug. A name that appears
 * as two courses gets the course appended to BOTH of them, rather than one
 * keeping the bare slug — otherwise which of the two is "the real one" would
 * depend on document order, and adding a third course later would move it.
 *
 * Anything still colliding after that is two genuinely different names that
 * slugify the same, which is a document problem a script must not paper over.
 */
function assignSlugs(dishes) {
  const byBase = new Map();
  for (const dish of dishes) {
    const base = slugify(dish.name);
    dish.base = base;
    const list = byBase.get(base) ?? [];
    list.push(dish);
    byBase.set(base, list);
  }

  const taken = new Map();
  for (const [base, list] of byBase) {
    for (const dish of list) {
      dish.slug = list.length === 1 ? base : `${base}-${dish.course}`;
      const clash = taken.get(dish.slug);
      if (clash) {
        fail(
          `"${dish.name}" and "${clash.name}" both become the slug ` +
            `"${dish.slug}". Two different dishes cannot share a seed key — ` +
            `reword one of them in docs/dishes.md.`
        );
      }
      taken.set(dish.slug, dish);
    }
  }
}

/* ── the write ──────────────────────────────────────────────────────── */

const entries = parse(readFileSync(SOURCE, "utf8"));

// Fifty per destination, checked before anything is written. The document says
// "roughly 50" and is exactly 50 at all thirteen; a count that has moved is
// either an edit or a parser that lost a line, and the two look identical
// afterwards. This is the dish pool's version of seed-menus' contiguity check.
const counts = new Map();
for (const entry of entries) {
  counts.set(entry.destination, (counts.get(entry.destination) ?? 0) + 1);
}
for (const [destination, count] of counts) {
  const expected = PER_DESTINATION[destination];
  if (expected === undefined) {
    fail(
      `${destination} is not in the PER_DESTINATION manifest in this file. A ` +
        `new destination heading must be added there in the same commit that ` +
        `adds it to the document, so a count can never appear unwatched.`
    );
  }
  if (count !== expected) {
    fail(
      `${destination} has ${count} dishes and the manifest expects ${expected}. ` +
        `Either the document changed or the parser lost a line — and after the ` +
        `fact those look the same. If the catalogue genuinely changed, update ` +
        `PER_DESTINATION in this file in the same commit.`
    );
  }
}

const { dishes, disagreed } = collapse(entries);
assignSlugs(dishes);


/* ── report (harness only; parser above is byte-identical to committed) ── */
const raw = readFileSync(SOURCE, "utf8").split("\n");
const bullets = raw.filter((l) => l.trim().startsWith("- ")).length;
const skipped = [];
{
  let dest = null, crs = null;
  for (let i = 0; i < raw.length; i++) {
    const line = raw[i].trim();
    const c3 = /^###\s+(.+?)\s*$/.exec(line);
    if (c3) { crs = c3[1]; continue; }
    const h = /^##\s+(.+?)\s*$/.exec(line);
    if (h) { dest = h[1]; crs = null; continue; }
    if (line.startsWith("- ")) continue;
    if (/^[-*]\s/.test(line) || /^\s*-\S/.test(raw[i])) skipped.push(`${i + 1}: ${line}`);
  }
}
console.log(`lines matched (entries):   ${entries.length}`);
console.log(`bullet lines in document:  ${bullets}`);
console.log(`deduped rows (dishes):     ${dishes.length}`);
console.log(`lines skipped:             ${bullets - entries.length}`);
for (const s of skipped) console.log(`   SKIPPED ${s}`);
console.log(`level disagreements:       0 (the parser fails hard on any)`);
console.log(`season disagreements:      ${disagreed.length}`);
for (const d of disagreed) console.log(`   - ${d.name} [${d.course}] ${d.destinations.join(" / ")}`);
console.log(`per-destination counts all matched PER_DESTINATION.`);
for (const [k, v] of [...counts].sort()) console.log(`   ${k}: ${v}`);
