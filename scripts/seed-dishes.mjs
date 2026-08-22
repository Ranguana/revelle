#!/usr/bin/env node
/**
 * Put the authored dishes into the database.
 *
 *   npm run seed:dishes
 *   npm run seed:dishes -- --activate    also move new dishes to 'active'
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
 * seed:menus and seed:drinks take `--overwrite`, which lets the file beat the
 * curator when explicitly asked. THIS SEEDER HAS NO SUCH FLAG and never had
 * one, and neither do seed:destinations or seed:dishes. So a desk edit here is
 * not merely default-winning — nothing in the pipeline can revert it, and the
 * only way back to the authored text is a person retyping it.
 *
 * That is defensible for content a curator is meant to own. It is written down
 * because five scripts describe themselves in near-identical words and only two
 * of them have the escape hatch.

 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import pg from "pg";

import {
  DESTINATIONS,
  MEALS,
  SEASONS,
  SEASON_NARROWED,
  ensureWorld,
} from "./catalogue-vocabulary.mjs";

const SOURCE = fileURLToPath(new URL("../docs/dishes.md", import.meta.url));

const activate = process.argv.includes("--activate");
const overwrite = process.argv.includes("--overwrite");

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
const PER_DESTINATION = 50;

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
  if (count !== PER_DESTINATION) {
    fail(
      `${destination} has ${count} dishes and every destination has ` +
        `${PER_DESTINATION}. Either the document changed or the parser lost a ` +
        `line — and after the fact those look the same. If the catalogue ` +
        `genuinely grew, change PER_DESTINATION here in the same commit.`
    );
  }
}

const { dishes, disagreed } = collapse(entries);
assignSlugs(dishes);

const url = process.env.DATABASE_URL;
if (!url) fail("DATABASE_URL is not set.");

const client = new pg.Client({
  connectionString: url,
  ssl: needsSsl(url) ? { rejectUnauthorized: false } : undefined,
  application_name: "revelle-seed-dishes",
});

await client.connect();

let created = 0;
let left = 0;
let updated = 0;
let scoped = 0;
let claimed = 0;
const stubbed = [];
let orphans = [];

try {
  await client.query("begin");

  // Every destination resolved once, before the loop, rather than 650 times
  // inside it. seed-menus calls ensureWorld per menu because there are twenty
  // of them; at 650 lines that is 650 round trips for thirteen answers.
  const worlds = new Map();
  for (const destination of counts.keys()) {
    const world = await ensureWorld(client, destination, "seed-dishes");
    if (world.created) stubbed.push(world.slug);
    worlds.set(destination, world);
  }

  for (const dish of dishes) {
    const { rows: existing } = await client.query(
      `select id, name, course::text, making::text, season::text, season_note,
              season_strict, source_note, status::text
         from dish where slug = $1`,
      [dish.slug]
    );

    let dishId;
    if (existing.length === 0) {
      const { rows } = await client.query(
        `insert into dish (slug, name, course, making, season, season_note,
                           season_strict, source_note, status)
         values ($1, $2, $3::course, $4::making_level, $5::season_band, $6, $7,
                 $8, $9::product_status)
         returning id`,
        [
          dish.slug,
          dish.name,
          dish.course,
          dish.making,
          dish.season,
          dish.seasonNote,
          dish.seasonStrict,
          dish.sourceNote,
          activate ? "active" : "draft",
        ]
      );
      dishId = rows[0].id;
      created += 1;
    } else {
      dishId = existing[0].id;
      const row = existing[0];
      const differs =
        row.name !== dish.name ||
        row.course !== dish.course ||
        row.making !== dish.making ||
        row.season !== dish.season ||
        row.season_note !== dish.seasonNote ||
        row.season_strict !== dish.seasonStrict ||
        (row.source_note ?? null) !== dish.sourceNote;

      if (differs && !overwrite) {
        left += 1;
        console.log(
          `[seed-dishes] differs  ${dish.slug} — left as the desk has it. ` +
            `Re-run with --overwrite to let the file win.`
        );
      } else if (differs) {
        await client.query(
          `update dish set name = $2, course = $3::course,
                  making = $4::making_level, season = $5::season_band,
                  season_note = $6, season_strict = $7, source_note = $8
             where id = $1`,
          [
            dishId,
            dish.name,
            dish.course,
            dish.making,
            dish.season,
            dish.seasonNote,
            dish.seasonStrict,
            dish.sourceNote,
          ]
        );
        updated += 1;
        console.log(`[seed-dishes] updated  ${dish.slug} — from the file`);
      }
    }

    // WHAT IT IS FOR. Inserted, never deleted, for the reason the destination
    // rows are: a curator may have said at the desk that this dish also works
    // at brunch, and a re-seed has no standing to reverse that. Removing a
    // claim is a tick in the box at /desk/dishes.
    for (const meal of dish.meals) {
      const { rowCount } = await client.query(
        `insert into dish_meal (dish_id, meal, note)
         values ($1, $2::meal_shape, $3)
         on conflict (dish_id, meal) do nothing`,
        [dishId, meal, "docs/dishes.md, fourth field."]
      );
      claimed += rowCount;
    }

    // The destinations it was written for. Never overwritten and never removed:
    // a curator may have said this dish also suits somewhere else, and this
    // script has no standing to reverse that.
    //
    // `native` is the CLAIM db/019 added, and it is the whole of what this row
    // has always meant: every line of docs/dishes.md sits UNDER a destination
    // heading. It is why "Havana's plantains are not an option at the
    // Dolomites" is enforced rather than merely unlikely.
    for (const destination of dish.destinations) {
      const world = worlds.get(destination);
      const { rowCount } = await client.query(
        `insert into dish_world (dish_id, world_id, native, affinity, note)
         values ($1, $2, true, 1.000, $3)
         on conflict (dish_id, world_id) do nothing`,
        [dishId, world.id, "Written for this destination. docs/dishes.md."]
      );
      scoped += rowCount;
    }
  }

  // Dishes in the database whose slug the file no longer produces. NOT deleted
  // — a curator may have added one by hand at the desk, and this script has no
  // standing to remove her work — but named, because the other way a row lands
  // here is a rename in the document, and a rename leaves the old row behind
  // looking exactly like a real dish.
  const { rows: strays } = await client.query(
    `select slug::text as slug, name, status::text as status
       from dish
      where slug <> all($1::citext[])
      order by slug`,
    [dishes.map((dish) => dish.slug)]
  );
  orphans = strays;

  await client.query("commit");
} catch (err) {
  await client.query("rollback");
  console.error(`\n[seed-dishes] FAILED: ${err.message}`);
  process.exitCode = 1;
} finally {
  await client.end();
}

console.log(
  `\n[seed-dishes] ${entries.length} lines in the file over ` +
    `${counts.size} destinations, deduped to ${dishes.length} dishes: ` +
    `${created} created, ${updated} updated, ${left} left as the desk has ` +
    `them. ${scoped} destination claim(s) and ${claimed} meal-shape claim(s) ` +
    `written.`
);

if (disagreed.length > 0) {
  console.log(
    `\n${disagreed.length} dish(es) are written under two destinations that ` +
      `disagree about the season. A claim two destinations disagree about is ` +
      `not a claim, so each is year-round and says why in its source note:`
  );
  for (const dish of disagreed) {
    console.log(
      `  ${dish.slug} — ` +
        dish.destinations
          .map((d, i) => `${d}: ${dish.seasonNotes[i] || "unseasoned"}`)
          .join(" · ")
    );
  }
}

if (orphans.length > 0) {
  console.log(
    `\n${orphans.length} dish(es) in the database are not in the file. ` +
      `Nothing has been deleted — a curator may have added them — but a ` +
      `renamed dish leaves exactly this trace:`
  );
  for (const row of orphans) {
    console.log(`  ${row.slug} (${row.status}) — ${row.name}`);
  }
}

if (stubbed.length > 0) {
  console.log(
    `\nThese destinations had no world row and now have a DRAFT STUB, so the ` +
      `dishes written for them are scoped to something true:\n  ` +
      stubbed.join("\n  ") +
      `\nA draft destination is never chosen for a customer. Author the look ` +
      `and the voice in src/lib/destinations.ts and run ` +
      `npm run seed:destinations, which completes a stub in place.`
  );
}

if (!activate && created > 0) {
  console.log(
    `\n${created} dish(es) are drafts. Offering one is a decision: activate ` +
      `them at the desk, or re-run with --activate.`
  );
}
