#!/usr/bin/env node
/**
 * Put the authored menus into the database.
 *
 *   npm run seed:menus
 *   npm run seed:menus -- --activate    also move new menus to 'active'
 *   npm run seed:menus -- --overwrite   let the file beat the curator's edits
 *
 * ─────────────────────────────────────────────────────────────────────
 * WHY THIS READS A MARKDOWN FILE
 *
 * Because docs/menus.md is where the menus were written, and it is where they
 * will be edited. Copying them into a JavaScript array would create a second
 * copy that drifts from the first the day somebody fixes a typo in the wrong
 * one — the same argument db/002 makes about two representations of one fact,
 * and the same argument scripts/seed-destinations.mjs makes for reading
 * src/lib/destinations.ts rather than a dump of it.
 *
 * So this parses the document, strictly, and FAILS LOUDLY on anything it does
 * not recognise. A menu with three bullets instead of four, or a season phrase
 * nobody has mapped, stops the run and names the line. A seed that guesses is
 * a seed that quietly invents content, which is the one thing it must not do.
 *
 * ─────────────────────────────────────────────────────────────────────
 * WHAT IT WILL AND WILL NOT DO
 *
 *   · A menu that does not exist is created as a DRAFT. Deciding that
 *     something is offered is a curator's decision, not a script's — exactly
 *     the rule seed-destinations.mjs states. `--activate` is how you say yes.
 *   · A menu that already exists is LEFT ALONE and any difference is REPORTED.
 *     A curator's edit at the desk outranks the file. `--overwrite` reverses
 *     that, deliberately and only when asked.
 *   · Season and how-much-cooking are written as COLUMNS. Their facets are
 *     projected by a trigger (db/012) and are never written here.
 *   · The destination each menu was written for becomes a `menu_world` row at
 *     full affinity, when that destination exists as a `world`. When it does
 *     not — most of the library is still catalogue copy — it is reported and
 *     the menu stays general, which is a true statement rather than a hole.
 *
 * Same connection rules as scripts/migrate.mjs. Needs DATABASE_URL.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import pg from "pg";

const SOURCE = fileURLToPath(new URL("../docs/menus.md", import.meta.url));

const activate = process.argv.includes("--activate");
const overwrite = process.argv.includes("--overwrite");

/** Kept in sync with the same function in scripts/migrate.mjs and src/lib/db.ts. */
function needsSsl(url) {
  if (/sslmode=disable/.test(url)) return false;
  return !/@(localhost|127\.0\.0\.1|\[::1\])/.test(url);
}

/**
 * The `## heading` in the document -> the `world.slug` it refers to.
 *
 * A table rather than a slugify() call, because "Vegas" is `las-vegas` and
 * "Westhampton" is `westhampton-1976`, and a rule that gets two of six wrong
 * is worse than a list. An unknown heading is an error, not a skip.
 */
const DESTINATIONS = {
  Westhampton: "westhampton-1976",
  Nantucket: "nantucket",
  "New York": "new-york",
  "Cap Ferrat": "cap-ferrat",
  "Côte d'Azur": "cote-dazur",
  Vegas: "las-vegas",
};

/**
 * Her season wording -> the closed value in season_band (db/012).
 *
 * Her words are kept verbatim in `season_note` beside it. This mapping exists
 * only so the selection layer has something to filter and weight on; where the
 * two disagree in richness, hers is the one a human reads.
 *
 * "Late August" is `summer` rather than `high_summer` because the menu it
 * belongs to says "end of summer" in the same breath. That is a judgement, and
 * it is here, in one line, where it can be argued with.
 */
const SEASONS = {
  Spring: "spring",
  Summer: "summer",
  "High summer": "high_summer",
  "Late August": "summer",
  Fall: "autumn",
  October: "autumn",
  Winter: "winter",
  "Shoulder season": "shoulder",
  "Spring or fall": "shoulder",
  "Year-round": "year_round",
  "Winter, works year-round": "year_round",
};

/**
 * The four authored values, longest first so that "Bought and arranged" is not
 * matched as something shorter. Everything after the phrase is the ESCAPE
 * HATCH and is kept verbatim — see db/012.
 */
const COOKING = [
  ["Bought and arranged", "bought_and_arranged"],
  ["Actually made", "actually_made"],
  ["Mostly made", "mostly_made"],
  ["Half made", "half_made"],
];

function fail(message) {
  console.error(`\n[seed-menus] FAILED: ${message}`);
  process.exit(1);
}

/* ── the parser ─────────────────────────────────────────────────────── */

function parse(text) {
  const lines = text.split("\n");
  const menus = [];

  let destination = null;
  let current = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    const heading = /^##\s+(.+?)\s*$/.exec(line);
    if (heading) {
      const name = heading[1];
      // The document ends with prose sections that are not destinations.
      destination = Object.hasOwn(DESTINATIONS, name) ? name : null;
      current = null;
      continue;
    }

    const numbered = /^\*\*(\d+)\.\*\*\s*$/.exec(line);
    if (numbered) {
      if (!destination) {
        fail(`line ${i + 1}: menu ${numbered[1]} is not under a known destination heading`);
      }
      current = { number: Number(numbered[1]), destination, bullets: [] };
      menus.push(current);
      continue;
    }

    if (current && line.startsWith("- ")) {
      current.bullets.push(line.slice(2).trim());
    } else if (line === "" || line.startsWith("#") || line.startsWith("---")) {
      current = null;
    }
  }

  for (const menu of menus) {
    if (menu.bullets.length !== 4) {
      fail(
        `menu ${menu.number} has ${menu.bullets.length} lines; the record shape ` +
          `is exactly four: dishes, what it's for, season, how much cooking`
      );
    }
    const [dishes, whatItsFor, season, cooking] = menu.bullets;

    if (!Object.hasOwn(SEASONS, season)) {
      fail(
        `menu ${menu.number}: season "${season}" is not in the mapping at the ` +
          `top of scripts/seed-menus.mjs. Add it there — a new wording is a ` +
          `decision, not a default.`
      );
    }

    const matched = COOKING.find(([phrase]) =>
      cooking.toLowerCase().startsWith(phrase.toLowerCase())
    );
    if (!matched) {
      fail(
        `menu ${menu.number}: "${cooking}" does not start with one of the four ` +
          `authored values (${COOKING.map(([p]) => p).join(" · ")})`
      );
    }

    menu.dishes = dishes;
    menu.name = whatItsFor;
    menu.seasonNote = season;
    menu.season = SEASONS[season];
    menu.cooking = matched[1];
    // Whatever she wrote after the value, with the joining punctuation removed
    // and nothing else touched.
    menu.cookingNote = cooking
      .slice(matched[0].length)
      .replace(/^\s*[,;—–-]\s*/, "")
      .trim();
  }

  // The two claims the document makes in prose about specific menus, read from
  // the document rather than copied here, so the file stays the source of both
  // the content and the rules about it.
  const strict = numbersIn(
    text,
    /hard filter for the summer-coastal menus\s*\(([^)]+)\)/i,
    "the season hard-filter list"
  );
  const smell = numbersIn(
    text,
    /Menus\s+([\d,\sand]+?)\s+fill the house with smell/i,
    "the cooking-smell list"
  );

  for (const menu of menus) {
    menu.seasonStrict = strict.has(menu.number);
    menu.smell = smell.has(menu.number);
  }

  if (menus.length === 0) fail("no menus found in docs/menus.md");
  return menus;
}

function numbersIn(text, pattern, what) {
  const match = pattern.exec(text);
  if (!match) {
    fail(
      `${what} is missing from docs/menus.md. It is parsed from the document ` +
        `on purpose; if the sentence changed, update the pattern in ` +
        `scripts/seed-menus.mjs rather than hard-coding the numbers.`
    );
  }
  return new Set(
    match[1]
      .split(/[,\s]+|and/)
      .map((n) => Number(n.trim()))
      .filter((n) => Number.isInteger(n) && n > 0)
  );
}

/* ── the write ──────────────────────────────────────────────────────── */

const menus = parse(readFileSync(SOURCE, "utf8"));

const url = process.env.DATABASE_URL;
if (!url) fail("DATABASE_URL is not set.");

const client = new pg.Client({
  connectionString: url,
  ssl: needsSsl(url) ? { rejectUnauthorized: false } : undefined,
  application_name: "revelle-seed-menus",
});

await client.connect();

let created = 0;
let left = 0;
let updated = 0;
const missingWorlds = new Map();

try {
  await client.query("begin");

  const { rows: smellFacet } = await client.query(
    `select id from facet where dimension_code = 'mood' and code = 'cooking_smell'`
  );
  if (smellFacet.length === 0) {
    throw new Error(
      "the cooking_smell facet is missing. Has db/012 been applied?"
    );
  }

  for (const menu of menus) {
    const slug = `menu-${String(menu.number).padStart(2, "0")}`;

    const { rows: existing } = await client.query(
      `select id, name, dishes, season::text, season_note, season_strict,
              cooking::text, cooking_note, status::text
         from menu where slug = $1`,
      [slug]
    );

    let menuId;
    if (existing.length === 0) {
      const { rows } = await client.query(
        `insert into menu (slug, name, dishes, season, season_note,
                           season_strict, cooking, cooking_note, status)
         values ($1, $2, $3, $4::season_band, $5, $6, $7::cooking_level, $8, $9)
         returning id`,
        [
          slug,
          menu.name,
          menu.dishes,
          menu.season,
          menu.seasonNote,
          menu.seasonStrict,
          menu.cooking,
          menu.cookingNote,
          activate ? "active" : "draft",
        ]
      );
      menuId = rows[0].id;
      created += 1;
      console.log(
        `[seed-menus] created  ${slug} ${activate ? "(active)" : "(draft)"} — ${menu.name}`
      );
    } else {
      menuId = existing[0].id;
      const row = existing[0];
      const differs =
        row.name !== menu.name ||
        row.dishes !== menu.dishes ||
        row.season !== menu.season ||
        row.season_note !== menu.seasonNote ||
        row.season_strict !== menu.seasonStrict ||
        row.cooking !== menu.cooking ||
        row.cooking_note !== menu.cookingNote;

      if (!differs) {
        console.log(`[seed-menus] same     ${slug}`);
      } else if (!overwrite) {
        left += 1;
        console.log(
          `[seed-menus] differs  ${slug} — left as the desk has it. ` +
            `Re-run with --overwrite to let the file win.`
        );
      } else {
        await client.query(
          `update menu set name = $2, dishes = $3, season = $4::season_band,
                  season_note = $5, season_strict = $6,
                  cooking = $7::cooking_level, cooking_note = $8
             where id = $1`,
          [
            menuId,
            menu.name,
            menu.dishes,
            menu.season,
            menu.seasonNote,
            menu.seasonStrict,
            menu.cooking,
            menu.cookingNote,
          ]
        );
        updated += 1;
        console.log(`[seed-menus] updated  ${slug} — from the file`);
      }
    }

    // The destination it was written for. Never overwritten: a curator may
    // have said this menu also suits somewhere else, and this script has no
    // standing to reverse that.
    const worldSlug = DESTINATIONS[menu.destination];
    const { rows: world } = await client.query(
      `select id from world where slug = $1`,
      [worldSlug]
    );
    if (world.length === 0) {
      missingWorlds.set(
        worldSlug,
        (missingWorlds.get(worldSlug) ?? 0) + 1
      );
    } else {
      await client.query(
        `insert into menu_world (menu_id, world_id, affinity, note)
         values ($1, $2, 1.000, $3)
         on conflict (menu_id, world_id) do nothing`,
        [menuId, world[0].id, "Written for this destination. docs/menus.md."]
      );
    }

    if (menu.smell) {
      await client.query(
        `insert into menu_facet (menu_id, facet_id, weight, provenance, note)
         values ($1, $2, 1.000, 'curator', $3)
         on conflict (menu_id, facet_id) do nothing`,
        [
          menuId,
          smellFacet[0].id,
          "Fills the house with smell before anyone arrives. docs/menus.md.",
        ]
      );
    }
  }

  await client.query("commit");
} catch (err) {
  await client.query("rollback");
  console.error(`\n[seed-menus] FAILED: ${err.message}`);
  process.exitCode = 1;
} finally {
  await client.end();
}

console.log(
  `\n[seed-menus] ${menus.length} in the file: ${created} created, ` +
    `${updated} updated, ${left} left as the desk has them`
);
if (missingWorlds.size > 0) {
  console.log(
    `\nThese destinations have no world row yet, so those menus are general:`
  );
  for (const [slug, n] of missingWorlds) {
    console.log(`  ${slug}  (${n} menu${n === 1 ? "" : "s"})`);
  }
  console.log(
    `Run npm run seed:destinations once they are authored, then this again.`
  );
}
if (!activate && created > 0) {
  console.log(
    `\n${created} menu(s) are drafts. Offering one is a decision: activate ` +
      `them at the desk, or re-run with --activate.`
  );
}
