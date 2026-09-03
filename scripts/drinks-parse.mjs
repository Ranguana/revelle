/**
 * READING docs/drinks.md — the parse, on its own, so it can be tested.
 *
 * Split out of scripts/seed-drinks.mjs on the day the drinks stopped being
 * programmes. The seeder still owns the WRITE and every argument about status,
 * scoping and the ledger; this file owns the READ, and it is a module rather
 * than a function inside the seeder for one reason: the seeder connects to a
 * database at import time, and `npm test` cannot. A parse nothing can exercise
 * is a parse whose first real run is its first test (CLAUDE.md rule 24's
 * corollary), and this document just changed shape.
 *
 * ─────────────────────────────────────────────────────────────────────
 * WHAT A RECORD IS NOW, AND WHAT IT WAS
 *
 * It was FIVE BULLETS PER PROGRAMME: the cocktails in order, the mocktail
 * mirrors, what it's for, season, how much mixing. One row held several drinks
 * and several mirrors, and `docs/drinks-programmes.md` keeps all twenty-five
 * of them whole.
 *
 * It is now FIVE BULLETS PER DRINK, and the arity is deliberately unchanged so
 * that everything the old shape refused, this one still refuses:
 *
 *   1  the drink, in her words, whole
 *   2  its mocktail mirror, in her words, whole — or `Mirror owed`
 *   3  what shape of table it is for — db/023's meal_shape, in her words,
 *      comma-separated, or `Not said`
 *   4  season, in her wording
 *   5  how much mixing
 *   6  optionally, `Also at: <destination>, <destination>`
 *
 * The "what it's for" line she wrote per programme has NOT been deleted and has
 * NOT been split seventy-six ways. It is the `###` heading each group of drinks
 * sits under, written once, and every drink carries it into `source_note` as
 * provenance. It is not the drink's name and it is not a claim: a gin and tonic
 * is not "a summer dinner or cocktail party".
 *
 * ─────────────────────────────────────────────────────────────────────
 * THE FAILURE MODES ARE LOUD ON PURPOSE, AND THERE ARE MORE OF THEM NOW
 *
 * The old parser refused an unknown sixth bullet, a season it did not know, a
 * mixing level it did not know, a record that was not five bullets, a mirror
 * that was blank, a mirror that was the cocktail line again, and a gap in the
 * numbering — "a typo that silently drops a destination is far worse than a
 * failed run". Every one of those survives. The atomic shape adds four:
 *
 *   · a `**N.M**` record whose N disagrees with the `###` heading above it.
 *     The number is written twice so that a record pasted into the wrong
 *     programme is a failed run rather than a drink that quietly changes rooms.
 *   · a record with no `###` heading above it at all.
 *   · two drinks in one programme that disagree about the meal shape, the
 *     season or the mixing level. Those three are the PROGRAMME'S answers,
 *     inherited by every drink split out of it, so a disagreement is an edit
 *     that reached one row and not its siblings.
 *   · a meal shape that is not one of her five words.
 *
 * ─────────────────────────────────────────────────────────────────────
 * WHAT THE OLD PARSER DID THAT THIS ONE REFUSES TO DO: COLLAPSE
 *
 * Kept whole, because it was right and the thing that beat it is a change of
 * unit rather than a change of mind (CLAUDE.md rule 14). The old rule:
 *
 *     "TWO ENTRIES ARE ONE PROGRAMME WHEN SHE WROTE THEM THE SAME WAY. The key
 *      is the AUTHORED CONTENT — the cocktails line and the mocktail line,
 *      exactly — and nothing else. […] Cross-referencing is HER decision,
 *      expressed by writing the same thing twice."
 *
 * At the programme grain that is exactly right: writing a whole five-bullet
 * record twice, word for word, under two headings, is a deliberate authorial
 * act nobody performs by accident.
 *
 * At the atomic grain it is a matcher that matches everything, which is rule
 * 24's other direction. `docs/drink-explosion.md` §3 counted it: SEVEN drink
 * names occur verbatim in more than one programme — whiskey sours in 1, 13 and
 * 15; cold beer in 18, 20 and 25; manhattans, mimosas, bloody marys, champagne,
 * negronis — so collapsing would fold 16 rows into 7, give 67 records instead
 * of 76, and MINT NINE CROSS-ROOM NATIVE CLAIMS NOBODY AUTHORED. A repeated
 * programme was her saying "this bar belongs in two houses". A repeated drink
 * name is two rooms independently pouring a common thing.
 *
 * So sharing has exactly one spelling now, the sixth bullet, and this parser
 * COUNTS the verbatim repeats and reports them rather than acting on them.
 */
import { DESTINATIONS, MEALS, SEASONS } from "./catalogue-vocabulary.mjs";

/**
 * THE THREE AUTHORED VALUES, IN THE BAR'S OWN WORDS.
 *
 * docs/drinks.md: "How much mixing uses the same three positions as the menus,
 * in the bar's own words: actually mixed · half made · bought and poured."
 *
 * ONE AXIS, TWO VOCABULARIES. `bought and poured` is not a fourth position, it
 * is `bought_and_arranged` said at a bar, and it maps onto the same
 * `making_level` value so that one answer from a host governs the whole
 * evening. Nothing downstream can tell the two phrasings apart, which is the
 * point — the words are the bar's and live in src/lib/desk/labels.ts.
 *
 * Matched exactly. A line that is nearly one of these is a malformed entry and
 * fails loudly rather than being truncated into a value.
 */
export const MIXING = new Map([
  ["Actually mixed", "actually_made"],
  ["Half made", "half_made"],
  ["Bought and poured", "bought_and_arranged"],
]);

/** Bullet 2, when there is no twin. Matched exactly, for the usual reason. */
export const MIRROR_OWED = "Mirror owed";

/** Bullet 3, when she named no shape. NOT the same as claiming all five. */
export const NO_MEAL_SHAPE = "Not said";

/**
 * Thrown rather than `process.exit`, so a test can assert on the sentence and
 * the seeder can print it exactly as it always did. Every message in here is
 * written for the person editing the document, not for the person editing this
 * file.
 */
export class DrinkParseError extends Error {}

function fail(message) {
  throw new DrinkParseError(message);
}

/**
 * ONE DRINK, AS THIS FILE HANDS IT OVER.
 *
 * Written out as a type rather than left to inference because the record is
 * built in two passes — the scanner makes it, `readRecord` fills it — so an
 * inferred type describes the half-built object and every consumer sees a shape
 * that does not exist. The consumers are scripts/drinks-row.mjs, the seeder and
 * two test files; `npm test` type-strips TypeScript and `npx tsc --noEmit`
 * checks it, so a wrong shape here is a build error somewhere else.
 *
 * @typedef {object} ParsedDrink
 * @property {number}   programme     the `###` heading's number, 1..25
 * @property {number}   index         its place within that programme, from 1
 * @property {string}   programmeLine her "what it is for" line, verbatim.
 *                                    PROVENANCE, never the drink's name.
 * @property {string}   destination   the `##` heading it sits under
 * @property {string[]} also          the sixth bullet's rooms, if any
 * @property {string[]} destinations  `destination` followed by `also`
 * @property {string[]} bullets       the record as read, before interpretation
 * @property {string}   name          the drink, in her words, whole
 * @property {string|null} mirror     her mocktail twin, or NULL where OWED
 * @property {boolean}  mirrorOwed    true where bullet 2 says `Mirror owed`
 * @property {boolean}  mirrorSelf    true where the two lines are the same line
 * @property {string[]} meals         db/023 meal_shape codes; empty claims none
 * @property {string}   mealsNote     bullet 3 as written
 * @property {string}   season        the season_band code
 * @property {string}   seasonNote    her season wording, verbatim
 * @property {string}   making        the making_level code
 * @property {string}   slug          `drink-NN-M`, the seed key
 */

/**
 * Read the whole document. Returns one object per DRINK, in document order.
 *
 * Nothing here touches a database and nothing here decides a status. The
 * seeder does both, and `--dry-run` exists so this can be exercised against the
 * committed file with no connection at all.
 *
 * @param {string} text
 * @returns {ParsedDrink[]}
 */
export function parseDrinks(text) {
  const lines = text.split("\n");
  const drinks = [];
  /** One entry per `###` heading, in document order. */
  const programmes = [];

  let destination = null;
  let programme = null;
  let current = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // `###` first: `/^##\s+/` does not match it (the third `#` is not a space),
    // but reading the more specific one first is what keeps that true if the
    // heading regex is ever loosened.
    const sub = /^###\s+(.+?)\s*$/.exec(line);
    if (sub) {
      if (!destination) {
        // Prose sections of the document use `##`. A `###` is a programme, and
        // a programme outside a destination is a drink with no room.
        fail(
          `line ${i + 1}: "${sub[1]}" is a programme heading outside any ` +
            `destination. Every programme sits under a "## <destination>" ` +
            `heading, because that is how a drink knows its room.`
        );
      }
      const match = /^(\d+)\s+·\s+(.+?)\s*$/.exec(sub[1]);
      if (!match) {
        fail(
          `line ${i + 1}: the programme heading is "${sub[1]}". The shape is ` +
            `"### <number> · <what it is for>" — the number she gave the ` +
            `programme, and her own line for it, verbatim.`
        );
      }
      programme = {
        number: Number(match[1]),
        // Her words, whole. Never a name, never a claim: provenance.
        line: match[2],
        destination,
        drinks: [],
      };
      programmes.push(programme);
      current = null;
      continue;
    }

    const heading = /^##\s+(.+?)\s*$/.exec(line);
    if (heading) {
      const name = heading[1];
      // The document opens and closes with prose sections that are not
      // destinations. "The mirror is the whole point" is the best thing in the
      // file and it is not a place.
      destination = Object.hasOwn(DESTINATIONS, name) ? name : null;
      programme = null;
      current = null;
      continue;
    }

    const numbered = /^\*\*(\d+)\.(\d+)\.?\*\*\s*$/.exec(line);
    if (numbered) {
      const [, programmeNumber, index] = numbered;
      if (!destination) {
        fail(
          `line ${i + 1}: drink ${programmeNumber}.${index} is not under a ` +
            `known destination heading`
        );
      }
      if (!programme) {
        fail(
          `line ${i + 1}: drink ${programmeNumber}.${index} is not under a ` +
            `programme heading. Every drink was split out of one of the ` +
            `twenty-five programmes and carries its line as provenance.`
        );
      }
      if (Number(programmeNumber) !== programme.number) {
        fail(
          `line ${i + 1}: drink ${programmeNumber}.${index} sits under ` +
            `programme ${programme.number} ("${programme.line}"). The number ` +
            `is written twice on purpose: a record pasted into the wrong ` +
            `programme is a failed run rather than a drink that quietly ` +
            `changed rooms.`
        );
      }
      current = {
        programme: programme.number,
        index: Number(index),
        programmeLine: programme.line,
        destination,
        bullets: [],
      };
      programme.drinks.push(current);
      drinks.push(current);
      continue;
    }

    if (current && line.startsWith("- ")) {
      current.bullets.push(line.slice(2).trim());
    } else if (line === "" || line.startsWith("#") || line.startsWith("---")) {
      current = null;
    }
  }

  for (const drink of drinks) {
    readRecord(drink);
  }

  if (drinks.length === 0) fail("no drinks found in docs/drinks.md");
  contiguous(programmes);
  agreeWithinProgramme(programmes);
  return drinks;
}

/** The five bullets, in position, with the sixth when there is one. */
function readRecord(drink) {
  const where = `drink ${drink.programme}.${drink.index}`;

  if (drink.bullets.length !== 5 && drink.bullets.length !== 6) {
    fail(
      `${where} has ${drink.bullets.length} lines; the record shape is five: ` +
        `the drink, its mocktail mirror, what shape of table it is for, ` +
        `season, how much mixing — with an optional sixth, "Also at: ` +
        `<destination>, <destination>". A drink without its mirror line is ` +
        `not a record this house can read — see the top of docs/drinks.md.`
    );
  }

  const [name, mirror, meals, season, mixing, alsoAt] = drink.bullets;

  // THE SIXTH BULLET, when there is one. An unrecognised sixth line is an
  // error rather than a skip, for the reason an unknown heading is: a typo
  // that silently drops a destination is far worse than a failed run.
  drink.also = [];
  if (alsoAt !== undefined) {
    const match = /^Also at:?\s*(.+)$/i.exec(alsoAt);
    if (!match) {
      fail(
        `${where}: the sixth line is "${alsoAt}". The only sixth line a drink ` +
          `record has is "Also at: <destination>, <destination>".`
      );
    }
    for (const raw of match[1].split(",")) {
      const heading = raw.trim();
      if (heading.length === 0) continue;
      if (!Object.hasOwn(DESTINATIONS, heading)) {
        fail(
          `${where}: "${heading}" is not a destination this catalogue knows. ` +
            `Add it to DESTINATIONS in scripts/catalogue-vocabulary.mjs — ` +
            `docs/new-destination.md §5 is about exactly this step.`
        );
      }
      if (heading === drink.destination) {
        fail(
          `${where}: "Also at" names ${heading}, which is the heading it ` +
            `already sits under.`
        );
      }
      if (!drink.also.includes(heading)) drink.also.push(heading);
    }
  }

  if (name.length === 0) fail(`${where}: the drink line is empty.`);

  /*
   * THE MIRROR, OR THE DEBT. Read db/017 and db/060 §IV before changing this.
   *
   * `Mirror owed` is not a value with a shrug in it. Twenty-one of the
   * seventy-six drinks have no twin in their programme's mocktail line, and the
   * one thing that may not happen is inventing them: a weak invented mirror is
   * worse than a named gap, because the guarantee at the top of the document —
   * nobody at the table is visibly not drinking — is what it quietly spends.
   *
   * The old parser failed the run on a blank mirror, and that refusal was
   * right: at the programme grain a blank second bullet was a dropped line.
   * Here the debt is SAID, in a word matched exactly, and the seeder holds such
   * a drink at `draft` where nothing can offer it. A blank second bullet still
   * fails, because a blank is silence and this document does not do silence.
   */
  if (mirror.length === 0) {
    fail(
      `${where}: the mirror line is blank. Write the mirror she wrote, or ` +
        `"${MIRROR_OWED}" — a blank looks answered from every angle and is not.`
    );
  }
  drink.mirrorOwed = mirror === MIRROR_OWED;
  drink.mirror = drink.mirrorOwed ? null : mirror;
  /*
   * THE ONE STATE IN WHICH THE TWO LINES MAY AGREE (db/060 §IV). Vegas 14 says
   * "black coffee" in both of its lines, because the drink has no alcohol in it
   * and the same glass goes to everybody. Derived from the document, never
   * judged here: if she wrote the same thing twice, that is what it means.
   */
  drink.mirrorSelf =
    drink.mirror !== null &&
    drink.mirror.trim().toLowerCase() === name.trim().toLowerCase();

  drink.meals = readMeals(meals, where);

  if (!Object.hasOwn(SEASONS, season)) {
    fail(
      `${where}: season "${season}" is not in the mapping in ` +
        `scripts/catalogue-vocabulary.mjs. Add it there — a new wording is a ` +
        `decision, not a default.`
    );
  }

  if (!MIXING.has(mixing)) {
    fail(
      `${where}: "${mixing}" is not one of the three authored values ` +
        `(${[...MIXING.keys()].join(" · ")})`
    );
  }

  drink.name = name;
  drink.mealsNote = meals;
  drink.seasonNote = season;
  drink.season = SEASONS[season];
  drink.making = MIXING.get(mixing);
  drink.slug = `drink-${String(drink.programme).padStart(2, "0")}-${drink.index}`;
  drink.destinations = [drink.destination, ...drink.also];
}

/**
 * BULLET 3 — db/023's `meal_shape`, in the words the founder's ruling used.
 *
 * `Not said` is not "every shape" wearing a different hat, even though the two
 * behave identically downstream (no claims at all means eligible everywhere,
 * which is claimEligibility()'s own default). It is the document refusing to
 * guess: programmes 17 and 25 are "After a day outside" and "A boat or beach
 * day", and neither names a shape. Rule 3 — a claim is positive evidence, and
 * silence is not evidence of anything.
 */
function readMeals(field, where) {
  if (field.length === 0) {
    fail(
      `${where}: the meal-shape line is blank. Name the shapes she named, or ` +
        `"${NO_MEAL_SHAPE}" where she named none.`
    );
  }
  if (field === NO_MEAL_SHAPE) return [];

  const meals = [];
  for (const raw of field.split(",")) {
    const word = raw.trim();
    if (word.length === 0) continue;
    if (!Object.hasOwn(MEALS, word)) {
      fail(
        `${where}: "${word}" is not one of the five shapes of table ` +
          `(${MEAL_WORDS.join(" · ")}), and it is not "${NO_MEAL_SHAPE}". ` +
          `The vocabulary is db/023's and it is closed; a sixth shape is a ` +
          `migration, not a wording.`
      );
    }
    const code = MEALS[word];
    if (!meals.includes(code)) meals.push(code);
  }
  if (meals.length === 0) {
    fail(`${where}: the meal-shape line "${field}" named no shape.`);
  }
  return meals;
}

/** The five she may write, for the error message above. */
const MEAL_WORDS = Object.keys(MEALS).filter((key) => key.length > 2);

/**
 * A GAP IN THE NUMBERING IS AN ENTRY A BAD PARSE DROPPED. See seed-menus.
 *
 * Two axes now, because the numbering has two: the programmes run 1..25 and
 * each programme's drinks run 1..n. The second is the one that catches the
 * likely edit — deleting a drink from the middle of a programme — and the first
 * still catches a whole `###` block that failed to parse.
 */
function contiguous(programmes) {
  const numbers = programmes.map((p) => p.number).sort((a, b) => a - b);
  for (let i = 0; i < numbers.length; i += 1) {
    if (numbers[i] !== i + 1) {
      fail(
        `the programmes are not contiguous from 1: expected ${i + 1} and ` +
          `found ${numbers[i]}. Either the document has a gap or the parser ` +
          `lost one.`
      );
    }
  }
  const seen = new Set();
  for (const programme of programmes) {
    if (seen.has(programme.number)) {
      fail(
        `programme ${programme.number} appears twice. A programme is one ` +
          `heading; a drink that belongs in two rooms says so with "Also at".`
      );
    }
    seen.add(programme.number);
    programme.drinks.forEach((drink, at) => {
      if (drink.index !== at + 1) {
        fail(
          `programme ${programme.number} ("${programme.line}") jumps from ` +
            `drink ${at} to drink ${drink.index}. The drinks in a programme ` +
            `are numbered from 1 without gaps, so that a deleted row is a ` +
            `failed run rather than a quieter catalogue.`
        );
      }
    });
  }
}

/**
 * THREE FIELDS ARE THE PROGRAMME'S ANSWER, NOT THE DRINK'S.
 *
 * She wrote one season, one mixing level and one "what it's for" line over a
 * whole bar. Splitting the bar copied all three onto every drink, which makes
 * each record readable on its own — and makes a stale edit possible, where a
 * value is changed on one drink and not on its siblings. The copy is therefore
 * also a checksum: a disagreement inside a programme is a failed run.
 *
 * It is NOT a claim that the inherited values are right per drink. Thirteen of
 * the seventy-six carry a mixing level authored over three drinks that reads
 * oddly against one — a gin and tonic is not "half made" — and
 * docs/drink-explosion.md §5 batch F lists all thirteen for her. They are
 * inherited unchanged, because `making_level` is scored and correcting it here
 * would be a guess that scores.
 */
function agreeWithinProgramme(programmes) {
  for (const programme of programmes) {
    const [first, ...rest] = programme.drinks;
    if (!first) {
      fail(
        `programme ${programme.number} ("${programme.line}") has no drinks ` +
          `under it. An empty programme heading is a block whose records did ` +
          `not parse.`
      );
    }
    for (const drink of rest) {
      for (const [field, label] of [
        ["mealsNote", "what shape of table it is for"],
        ["seasonNote", "the season wording"],
        ["making", "how much mixing"],
      ]) {
        if (first[field] !== drink[field]) {
          fail(
            `programme ${programme.number} ("${programme.line}") disagrees ` +
              `with itself about ${label}: drink ${first.programme}.` +
              `${first.index} says "${first[field]}" and drink ` +
              `${drink.programme}.${drink.index} says "${drink[field]}". ` +
              `Those three are the programme's answers, inherited by every ` +
              `drink split out of it, so this is an edit that reached one row ` +
              `and not its siblings.`
          );
        }
      }
    }
  }
}

/**
 * THE COUNTS, BEFORE ANY DATABASE IS INVOLVED — CLAUDE.md rule 24.
 *
 * "Reading the code tells you what it was meant to match. Only counting tells
 * you what it did." These are the numbers docs/drink-explosion.md reports from
 * its own hand count, and the point of computing them here is that the two can
 * be compared. If they ever disagree, one of the two is wrong and neither
 * should be adjusted to match the other until somebody has found out which.
 *
 * `repeated` is counted and NOT acted on: see the header on collapsing.
 *
 * @param {ParsedDrink[]} drinks
 */
export function drinkCounts(drinks) {
  const byText = new Map();
  for (const drink of drinks) {
    const key = drink.name.trim().toLowerCase();
    byText.set(key, (byText.get(key) ?? 0) + 1);
  }
  return {
    drinks: drinks.length,
    paired: drinks.filter((drink) => !drink.mirrorOwed).length,
    owed: drinks.filter((drink) => drink.mirrorOwed).length,
    mirrorSelf: drinks.filter((drink) => drink.mirrorSelf).length,
    programmes: new Set(drinks.map((drink) => drink.programme)).size,
    rooms: new Set(drinks.map((drink) => drink.destination)).size,
    mealClaims: drinks.reduce((n, drink) => n + drink.meals.length, 0),
    noMealShape: drinks.filter((drink) => drink.meals.length === 0).length,
    /** Drink names occurring verbatim in more than one programme. */
    repeated: [...byText.entries()]
      .filter(([, n]) => n > 1)
      .map(([text, n]) => ({ text, rows: n })),
    /** Sharing lines. Zero today, and the run says so rather than assuming. */
    shared: drinks.filter((drink) => drink.also.length > 0).length,
  };
}
