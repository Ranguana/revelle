#!/usr/bin/env node
/**
 * Put the authored drinks into the database.
 *
 *   npm run seed:drinks
 *   npm run seed:drinks -- --activate    also move new drinks to 'active'
 *   npm run seed:drinks -- --overwrite   let the file beat the curator's edits
 *
 * The sibling of scripts/seed-menus.mjs, deliberately: same document shape,
 * same flags, same refusal to guess, same rule that a curator's edit at the
 * desk outranks the file. Read that script's header for the argument; only the
 * differences are written out here.
 *
 * ─────────────────────────────────────────────────────────────────────
 * THE MIRROR IS THE RECORD, AND THIS SCRIPT IS WHERE IT COULD BE LOST
 *
 * docs/drinks.md carries five bullets per entry and the first two are the two
 * builds of one drink: the cocktails, then the mocktail mirror. They go into
 * two NOT NULL columns of one row (db/017), never two rows, and this script
 * fails rather than writing a drink whose mirror is missing or blank.
 *
 * That is not tidiness. The guarantee the mirror exists to provide is that
 * nobody at the table is visibly not drinking, and it survives exactly as long
 * as the two builds cannot be separated. A seeder that quietly accepted four
 * bullets and left the mirror empty would be the first place it went.
 *
 * The mirrors also carry craft that must not be flattened — "from the same
 * pitcher fruit", "self-mixed at the table", "in a gimlet glass" — so the line
 * is stored exactly as written, in her punctuation, whole.
 *
 * ─────────────────────────────────────────────────────────────────────
 * A PROGRAMME CAN BELONG TO SEVERAL DESTINATIONS
 *
 * The founder: "Drinks need to be destination picked though some can cross
 * reference." So a programme is scoped, as it always was, and it can now be
 * scoped to MORE THAN ONE house — one row with several `native = true`
 * `drink_world` rows, exactly the rule scripts/seed-dishes.mjs follows for the
 * dish pool. One rule between the two pools, which is the point.
 *
 * There are two ways to say it and the parser takes both:
 *
 *   REPEAT THE ENTRY under a second `## Heading`, word for word. Two entries
 *     are ONE programme when their cocktails line and their mocktail line MATCH
 *     — the authored content, never a resemblance. A Cap Ferrat kir and a Côte
 *     d'Azur kir royale are different drinks and stay two rows, and inferring a
 *     cross-reference from similarity would quietly merge them. Cross-
 *     referencing is HER decision, expressed by writing the same thing twice.
 *
 *   ADD A SIXTH BULLET, `Also at: Vegas, Catskills`. Repeating five lines to
 *     name one more destination is tedious authoring, and tedious authoring is
 *     how a catalogue stops being edited. The record shape stays five bullets
 *     or six, position-delimited like everything else she writes, and a sixth
 *     bullet that does not begin "Also at" is an error rather than a guess.
 *
 * NOTHING IN docs/drinks.md USES EITHER TODAY. Seeding the file as it stands
 * produces twenty-five programmes with one destination each, and the run says
 * so. This removes a limitation; it changes no data.
 *
 * Same connection rules as scripts/migrate.mjs. Needs DATABASE_URL.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import pg from "pg";

import {
  DESTINATIONS,
  SEASONS,
  ensureWorld,
} from "./catalogue-vocabulary.mjs";

const SOURCE = fileURLToPath(new URL("../docs/drinks.md", import.meta.url));

const activate = process.argv.includes("--activate");
const overwrite = process.argv.includes("--overwrite");

/** Kept in sync with the same function in scripts/migrate.mjs and src/lib/db.ts. */
function needsSsl(url) {
  if (/sslmode=disable/.test(url)) return false;
  return !/@(localhost|127\.0\.0\.1|\[::1\])/.test(url);
}

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
const MIXING = new Map([
  ["Actually mixed", "actually_made"],
  ["Half made", "half_made"],
  ["Bought and poured", "bought_and_arranged"],
]);

function fail(message) {
  console.error(`\n[seed-drinks] FAILED: ${message}`);
  process.exit(1);
}

/* ── the parser ─────────────────────────────────────────────────────── */

function parse(text) {
  const lines = text.split("\n");
  const drinks = [];

  let destination = null;
  let current = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    const heading = /^##\s+(.+?)\s*$/.exec(line);
    if (heading) {
      const name = heading[1];
      // The document opens and closes with prose sections that are not
      // destinations. "The mirror is the whole point" is the best thing in the
      // file and it is not a place.
      destination = Object.hasOwn(DESTINATIONS, name) ? name : null;
      current = null;
      continue;
    }

    const numbered = /^\*\*(\d+)\.\*\*\s*$/.exec(line);
    if (numbered) {
      if (!destination) {
        fail(
          `line ${i + 1}: drink ${numbered[1]} is not under a known destination heading`
        );
      }
      current = { number: Number(numbered[1]), destination, bullets: [] };
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
    if (drink.bullets.length !== 5 && drink.bullets.length !== 6) {
      fail(
        `drink ${drink.number} has ${drink.bullets.length} lines; the record ` +
          `shape is five: cocktails, mocktail mirrors, what it's for, season, ` +
          `how much mixing — with an optional sixth, "Also at: <destination>, ` +
          `<destination>". A drink without its mirror is not a drink this ` +
          `house serves — see the top of docs/drinks.md.`
      );
    }
    const [cocktails, mocktails, whatItsFor, season, mixing, alsoAt] =
      drink.bullets;

    // THE SIXTH BULLET, when there is one. An unrecognised sixth line is an
    // error rather than a skip, for the reason an unknown heading is: a typo
    // that silently drops a destination is far worse than a failed run.
    drink.also = [];
    if (alsoAt !== undefined) {
      const match = /^Also at:?\s*(.+)$/i.exec(alsoAt);
      if (!match) {
        fail(
          `drink ${drink.number}: the sixth line is "${alsoAt}". The only ` +
            `sixth line a drink record has is "Also at: <destination>, ` +
            `<destination>".`
        );
      }
      for (const raw of match[1].split(",")) {
        const heading = raw.trim();
        if (heading.length === 0) continue;
        if (!Object.hasOwn(DESTINATIONS, heading)) {
          fail(
            `drink ${drink.number}: "${heading}" is not a destination this ` +
              `catalogue knows. Add it to DESTINATIONS in ` +
              `scripts/catalogue-vocabulary.mjs — docs/new-destination.md §5 ` +
              `is about exactly this step.`
          );
        }
        if (heading === drink.destination) {
          fail(
            `drink ${drink.number}: "Also at" names ${heading}, which is the ` +
              `heading it already sits under.`
          );
        }
        if (!drink.also.includes(heading)) drink.also.push(heading);
      }
    }

    if (mocktails.length === 0) {
      fail(`drink ${drink.number}: the mocktail mirror is empty.`);
    }
    if (mocktails.toLowerCase() === cocktails.toLowerCase()) {
      fail(
        `drink ${drink.number}: the mirror is the cocktail line again. A mirror ` +
          `is the same glass built without the alcohol, not the same sentence.`
      );
    }

    if (!Object.hasOwn(SEASONS, season)) {
      fail(
        `drink ${drink.number}: season "${season}" is not in the mapping in ` +
          `scripts/catalogue-vocabulary.mjs. Add it there — a new wording is a ` +
          `decision, not a default.`
      );
    }

    if (!MIXING.has(mixing)) {
      fail(
        `drink ${drink.number}: "${mixing}" is not one of the three authored ` +
          `values (${[...MIXING.keys()].join(" · ")})`
      );
    }

    drink.cocktails = cocktails;
    drink.mocktails = mocktails;
    drink.name = whatItsFor;
    drink.seasonNote = season;
    drink.season = SEASONS[season];
    drink.making = MIXING.get(mixing);
  }

  if (drinks.length === 0) fail("no drinks found in docs/drinks.md");
  contiguous(drinks);
  return collapse(drinks);
}

/**
 * TWO ENTRIES ARE ONE PROGRAMME WHEN SHE WROTE THEM THE SAME WAY.
 *
 * The key is the AUTHORED CONTENT — the cocktails line and the mocktail line,
 * exactly — and nothing else. Not a similarity score, not a normalised name,
 * not the "what it's for" line. Martinis at New York and martinis at Vegas are
 * one programme only if the two records match; a Cap Ferrat kir and a Côte
 * d'Azur kir royale differ by a word and stay two rows, which is correct,
 * because they are two drinks.
 *
 * The slug comes from the FIRST occurrence's number, so a cross-referenced
 * programme keeps the identity it already had in the database and a re-seed
 * recognises it. The later numbers are simply not used — which is why
 * contiguous() runs before this, on the raw entries: a gap in her numbering is
 * still a dropped record, and it has to be caught before the collapse hides it.
 *
 * Everything else about the two entries must match as well. A repeated
 * programme whose season or making level differs between the two headings is
 * one of the two being wrong, and it fails rather than picking a winner — the
 * same rule scripts/seed-dishes.mjs applies to a repeated dish's making level.
 */
function collapse(entries) {
  const byContent = new Map();

  for (const drink of entries) {
    const key = `${drink.cocktails}\u0000${drink.mocktails}`;
    const first = byContent.get(key);

    if (!first) {
      drink.destinations = [drink.destination, ...drink.also];
      byContent.set(key, drink);
      continue;
    }

    for (const [field, label] of [
      ["name", "what it's for"],
      ["season", "season"],
      ["seasonNote", "the season wording"],
      ["making", "how much mixing"],
    ]) {
      if (first[field] !== drink[field]) {
        fail(
          `drink ${drink.number} repeats drink ${first.number} word for word ` +
            `but disagrees about ${label}: "${first[field]}" against ` +
            `"${drink[field]}". A cross-referenced programme is one record; ` +
            `two answers for one record is one of the two being wrong.`
        );
      }
    }

    for (const heading of [drink.destination, ...drink.also]) {
      if (first.destinations.includes(heading)) {
        fail(
          `drink ${drink.number}: ${heading} is already claimed by drink ` +
            `${first.number}, which is the same programme.`
        );
      }
      first.destinations.push(heading);
    }
  }

  return [...byContent.values()];
}

/** A gap in the numbering is an entry a bad parse dropped. See seed-menus. */
function contiguous(entries) {
  const numbers = entries.map((entry) => entry.number).sort((a, b) => a - b);
  for (let i = 0; i < numbers.length; i += 1) {
    if (numbers[i] !== i + 1) {
      fail(
        `the drinks are not contiguous from 1: expected ${i + 1} and found ` +
          `${numbers[i]}. Either the document has a gap or the parser lost one.`
      );
    }
  }
}

/* ── the write ──────────────────────────────────────────────────────── */

const drinks = parse(readFileSync(SOURCE, "utf8"));

const url = process.env.DATABASE_URL;
if (!url) fail("DATABASE_URL is not set.");

const client = new pg.Client({
  connectionString: url,
  ssl: needsSsl(url) ? { rejectUnauthorized: false } : undefined,
  application_name: "revelle-seed-drinks",
});

await client.connect();

let created = 0;
let left = 0;
let updated = 0;
let scoped = 0;
const stubbed = [];

try {
  await client.query("begin");

  for (const drink of drinks) {
    const slug = `drink-${String(drink.number).padStart(2, "0")}`;

    const { rows: existing } = await client.query(
      `select id, name, cocktails, mocktails, season::text, season_note,
              season_strict, making::text, status::text
         from drink where slug = $1`,
      [slug]
    );

    let drinkId;
    if (existing.length === 0) {
      const { rows } = await client.query(
        `insert into drink (slug, name, cocktails, mocktails, season,
                            season_note, making, status)
         values ($1, $2, $3, $4, $5::season_band, $6, $7::making_level, $8)
         returning id`,
        [
          slug,
          drink.name,
          drink.cocktails,
          drink.mocktails,
          drink.season,
          drink.seasonNote,
          drink.making,
          activate ? "active" : "draft",
        ]
      );
      drinkId = rows[0].id;
      created += 1;
      console.log(
        `[seed-drinks] created  ${slug} ${activate ? "(active)" : "(draft)"} — ${drink.name}`
      );
    } else {
      drinkId = existing[0].id;
      const row = existing[0];
      const differs =
        row.name !== drink.name ||
        row.cocktails !== drink.cocktails ||
        row.mocktails !== drink.mocktails ||
        row.season !== drink.season ||
        row.season_note !== drink.seasonNote ||
        row.making !== drink.making;

      if (!differs) {
        console.log(`[seed-drinks] same     ${slug}`);
      } else if (!overwrite) {
        left += 1;
        console.log(
          `[seed-drinks] differs  ${slug} — left as the desk has it. ` +
            `Re-run with --overwrite to let the file win.`
        );
      } else {
        // season_strict is NOT written here. docs/drinks.md names no
        // hard-filter list, so the file has nothing to say about it and a
        // curator's answer at the desk is the only one there is.
        await client.query(
          `update drink set name = $2, cocktails = $3, mocktails = $4,
                  season = $5::season_band, season_note = $6,
                  making = $7::making_level
             where id = $1`,
          [
            drinkId,
            drink.name,
            drink.cocktails,
            drink.mocktails,
            drink.season,
            drink.seasonNote,
            drink.making,
          ]
        );
        updated += 1;
        console.log(`[seed-drinks] updated  ${slug} — from the file`);
      }
    }

    // EVERY destination this programme was written under. One row each, all
    // `native` — the claim, not a weight. docs/drinks.md: "A drink is scoped to
    // a destination the way a menu is", and the founder: "some can cross
    // reference". See db/019 and scripts/seed-dishes.mjs, which does this
    // identically for six hundred dishes.
    for (const heading of drink.destinations) {
      const world = await ensureWorld(client, heading, "seed-drinks");
      if (world.created && !stubbed.includes(world.slug)) stubbed.push(world.slug);
      const { rowCount } = await client.query(
        `insert into drink_world (drink_id, world_id, native, affinity, note)
         values ($1, $2, true, 1.000, $3)
         on conflict (drink_id, world_id) do nothing`,
        [drinkId, world.id, "Written for this destination. docs/drinks.md."]
      );
      scoped += rowCount;
    }
  }

  await client.query("commit");
} catch (err) {
  await client.query("rollback");
  console.error(`\n[seed-drinks] FAILED: ${err.message}`);
  process.exitCode = 1;
} finally {
  await client.end();
}

const claims = drinks.reduce((n, drink) => n + drink.destinations.length, 0);
const crossed = drinks.filter((drink) => drink.destinations.length > 1);

console.log(
  `\n[seed-drinks] ${drinks.length} programme(s) in the file: ${created} ` +
    `created, ${updated} updated, ${left} left as the desk has them. ` +
    `${claims} destination claim(s) authored, ${scoped} written, ` +
    `${crossed.length} programme(s) cross-referenced.`
);
for (const drink of crossed) {
  console.log(
    `  drink-${String(drink.number).padStart(2, "0")} — ${drink.destinations.join(" · ")}`
  );
}
if (stubbed.length > 0) {
  console.log(
    `\nThese destinations had no world row and now have a DRAFT STUB, so the ` +
      `drinks written for them are scoped to something true:\n  ` +
      stubbed.join("\n  ") +
      `\nA draft destination is never chosen for a customer. Author the look ` +
      `and the voice in src/lib/destinations.ts and run ` +
      `npm run seed:destinations, which completes a stub in place.`
  );
}
if (!activate && created > 0) {
  console.log(
    `\n${created} drink(s) are drafts. Offering one is a decision: activate ` +
      `them at the desk, or re-run with --activate.`
  );
}
