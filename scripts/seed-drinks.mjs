#!/usr/bin/env node
/**
 * Put the authored drinks into the database.
 *
 *   npm run seed:drinks
 *   npm run seed:drinks -- --overwrite   let the file beat the curator's edits
 *   npm run seed:drinks -- --dry-run     parse and COUNT, touch no database
 *
 * The sibling of scripts/seed-menus.mjs, deliberately: same document shape,
 * same flags, same refusal to guess, same rule that a curator's edit at the
 * desk outranks the file. Read that script's header for the argument; only the
 * differences are written out here.
 *
 * ─────────────────────────────────────────────────────────────────────
 * THE UNIT CHANGED. THE PARSE MOVED OUT. THIS FILE OWNS THE WRITE.
 *
 * docs/drinks.md held twenty-five PROGRAMMES and now holds SEVENTY-SIX atomic
 * drinks (docs/drink-explosion.md did the conversion, by counting rather than
 * eyeballing; db/060 is its schema half). The read lives in
 * scripts/drinks-parse.mjs, as a module rather than a function in here, for one
 * reason: this script connects to a database at import time and `npm test`
 * cannot. A parse nothing can exercise is a parse whose first real run is its
 * first test — CLAUDE.md rule 24's corollary, and this document just changed
 * shape.
 *
 * So: `parseDrinks()` decides what the document says, and every argument about
 * STATUS, SCOPING, MEAL CLAIMS and the LEDGER is here.
 *
 * ── WHAT THIS FILE DELETED, AND THE ARGUMENT IT DELETED IT WITH ─────
 *
 * CLAUDE.md rule 14: superseded reasoning is preserved, never deleted. Two
 * functions are gone from this file and both were RIGHT AT THE PROGRAMME
 * GRAIN. What beat them is a change of unit, not a change of mind.
 *
 *   `contiguous()` — "a gap in the numbering is an entry a bad parse dropped".
 *     Still true, still enforced, and now enforced ON TWO AXES rather than one:
 *     the programmes run 1..25 and each programme's drinks run 1..n.
 *     scripts/drinks-parse.mjs owns it, because the numbering it checks is a
 *     property of the DOCUMENT and the document has exactly one reader. Two
 *     copies of that check would be two authorities for one fact (rule 21), and
 *     the copy in here would have been the broken one: it reads `entry.number`,
 *     which an atomic record does not have.
 *
 *   `collapse()` — "TWO ENTRIES ARE ONE PROGRAMME WHEN SHE WROTE THEM THE SAME
 *     WAY. The key is the AUTHORED CONTENT — the cocktails line and the
 *     mocktail line, exactly […] Cross-referencing is HER decision, expressed
 *     by writing the same thing twice." At the programme grain that is exactly
 *     right: writing a whole five-bullet record twice, word for word, under two
 *     headings is a deliberate act nobody performs by accident.
 *
 *     AT THE ATOMIC GRAIN IT IS A MATCHER THAT MATCHES BY ACCIDENT, and it was
 *     COUNTED rather than reasoned about (rule 24). Run unchanged over the
 *     seventy-six rows, its `cocktails\0mocktails` key collides TWICE — bloody
 *     marys at Westhampton (3.1) with bloody marys at Vegas (14.2), and cold
 *     beer at Tahiti (18.3) with cold beer at Havana (20.2) — and BOTH
 *     collisions are between rows that disagree about the season or the mixing
 *     level they inherited from their programmes. So the function does not
 *     quietly merge: IT FAILS THE RUN, with a message built from `drink.number`,
 *     a field atomic records do not carry, so it fails printing `drink
 *     undefined`. And in the counterfactual where it did not fail it would fold
 *     76 rows into 74 and MINT TWO CROSS-ROOM NATIVE CLAIMS NOBODY AUTHORED.
 *
 *     A repeated PROGRAMME was her saying "this bar belongs in two houses". A
 *     repeated drink NAME is two rooms independently pouring a common thing —
 *     seven names occur verbatim across sixteen rows (whiskey sours, cold beer,
 *     manhattans, mimosas, bloody marys, champagne, negronis). The parser
 *     COUNTS those and reports them; nothing acts on them.
 *
 *     Sharing therefore has exactly ONE spelling now: the sixth bullet.
 *
 * ─────────────────────────────────────────────────────────────────────
 * A DRINK THIS SCRIPT CREATES IS LIVE, AND USED NOT TO BE
 *
 * It used to be created as a draft, and `--activate` was how a curator said
 * yes, "because deciding that something is offered to a customer is a curator's
 * decision and not a script's". The full argument — what that rule protected,
 * why it was right about that and wrong about its scope, and what db/036 and
 * CLAUDE.md rule 13 replaced it with — is preserved at the top of
 * scripts/seed-menus.mjs, where it was originally written. It is not repeated
 * here for the same reason nothing else in this header is: two copies of one
 * argument become two arguments.
 *
 * What it means HERE: a drink this seeder creates is offered on the way in,
 * `--activate` is refused by name rather than silently ignored, and every one
 * of them lands in `staff_action` under the pool-stocking actor so /desk/stocked
 * can show the run and send any of it back to draft.
 *
 * ── EXCEPT THE TWENTY-ONE WHOSE MIRROR IS OWED ──────────────────────
 *
 * Those arrive at `draft`, and the hold-back is NOT this script being cautious:
 * db/060's `drink_live_has_its_mirror` refuses `status = 'active'` on a row
 * whose `mocktails` is null, so a live owed drink is not a thing the database
 * will hold. This script writes `draft` so the run reports the truth rather
 * than meeting a constraint name.
 *
 * IT IS DELIBERATELY NOT THE `FOUNDER-PENDING` HOLD-BACK, and the difference
 * matters enough to write down (rule 23: state the fact where the wrong reading
 * would be made). That marker means "this row's own TEXT carries the question,
 * and deleting the question is what publishes it". Here the question is a NULL
 * COLUMN. Writing the marker into `notes` would invite a curator to delete a
 * sentence and expect a drink to go out, and what she would get is a check
 * constraint. So the note beside an owed drink says what is actually owed —
 * the mirror — and says that writing it is what publishes the row.
 *
 * ─────────────────────────────────────────────────────────────────────
 * THE MIRROR IS THE RECORD, AND THIS SCRIPT IS WHERE IT COULD BE LOST
 *
 * docs/drinks.md carries five bullets per entry and the first two are the two
 * builds of one drink: the drink, then its mocktail mirror. They go into two
 * columns of ONE row (db/017), never two rows, never a mirror table.
 *
 * That is not tidiness. The guarantee the mirror exists to provide is that
 * nobody at the table is visibly not drinking, and it survives exactly as long
 * as the two builds cannot be separated.
 *
 * WHAT THE ATOMIC GRAIN FOUND, AND WHY `mocktails` IS NULLABLE NOW: twenty-one
 * of the seventy-six drinks have no twin in their programme's mocktail line.
 * They are not a parse failure — the mocktail lines are shorter than the
 * cocktail lines in twenty of the twenty-five programmes. The one thing that
 * may not happen is INVENTING them, because a weak invented mirror is worse
 * than a named gap and db/017's guarantee is exactly what it would spend. The
 * document says `Mirror owed` in the second bullet; this script writes NULL and
 * `draft`; db/060 §IV makes that unofferable. Read that section before changing
 * any of it.
 *
 * The alternative was to seed 55 and drop 21 authored drinks, which is rule
 * 16's exact failure: an input absorbed and not honoured, with the catalogue
 * looking complete from every angle.
 *
 * The mirrors that DO exist carry craft that must not be flattened — "from the
 * same pitcher fruit", "self-mixed at the table", "in a gimlet glass" — so the
 * line is stored exactly as written, in her punctuation, whole.
 *
 * ─────────────────────────────────────────────────────────────────────
 * A DRINK CAN BELONG TO SEVERAL DESTINATIONS
 *
 * The founder: "Drinks need to be destination picked though some can cross
 * reference." So a drink is scoped, as it always was, and it can be scoped to
 * MORE THAN ONE house — one row with several `native = true` `drink_world`
 * rows, exactly the rule scripts/seed-dishes.mjs follows for the dish pool.
 *
 * There used to be two spellings for that and there is now one: the sixth
 * bullet, `Also at: Vegas, Catskills`. The other — repeating a whole record
 * under a second heading — was retired with `collapse()` above, because at this
 * grain it cannot be told apart from two rooms pouring the same common thing.
 *
 * NOTHING IN docs/drinks.md USES IT TODAY: zero of the seventy-six carry a
 * sixth bullet, and the run says so rather than assuming it. The `on conflict`
 * branch of the `drink_world` upsert below has therefore still never fired
 * against a row that already existed — docs/drink-explosion.md §7.2 books the
 * scratch-database test that rule 24's corollary requires before the first
 * sharing line is authored.
 *
 * ─────────────────────────────────────────────────────────────────────
 * --dry-run EXISTS BECAUSE THE DATABASE IS UNREACHABLE
 *
 * `ipAllowList: []` — no laptop can connect (CLAUDE.md rule 9). So the
 * document has to be readable BEFORE it is written, and `--dry-run` parses the
 * file, prints every count db/060 and docs/drink-explosion.md claim, and
 * contacts nothing. It is the same instrument `npm run check:bank` is for the
 * bank.
 *
 * Same connection rules as scripts/migrate.mjs. Needs DATABASE_URL.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import pg from "pg";

import {
  ensureWorld,
  recordAutoPublish,
  refuseActivateFlag,
  stockingRun,
} from "./catalogue-vocabulary.mjs";
import { DrinkParseError, drinkCounts, parseDrinks } from "./drinks-parse.mjs";
import { OWED_NOTE_OPENING, drinkRow } from "./drinks-row.mjs";

const SOURCE = fileURLToPath(new URL("../docs/drinks.md", import.meta.url));

refuseActivateFlag("seed-drinks");
const overwrite = process.argv.includes("--overwrite");
const dryRun = process.argv.includes("--dry-run");

/** One id for this run, so /desk/stocked can group what it put out. */
const RUN = stockingRun();

/** Kept in sync with the same function in scripts/migrate.mjs and src/lib/db.ts. */
function needsSsl(url) {
  if (/sslmode=disable/.test(url)) return false;
  return !/@(localhost|127\.0\.0\.1|\[::1\])/.test(url);
}

function fail(message) {
  console.error(`\n[seed-drinks] FAILED: ${message}`);
  process.exit(1);
}

/* ── the read ───────────────────────────────────────────────────────── */

let drinks;
try {
  drinks = parseDrinks(readFileSync(SOURCE, "utf8"));
} catch (err) {
  // A parse error is written for the person editing docs/drinks.md, so it is
  // printed as it was written rather than wrapped in a stack trace.
  if (err instanceof DrinkParseError) fail(err.message);
  throw err;
}

const counts = drinkCounts(drinks);

/**
 * WHAT THE DOCUMENT SAYS, COUNTED, BEFORE ANY DATABASE IS INVOLVED.
 *
 * CLAUDE.md rule 24: "reading the code tells you what it was meant to match,
 * only counting tells you what it did". These are the numbers
 * docs/drink-explosion.md §1 reports from its own hand count and db/060 quotes
 * in its header. They are PRINTED, not asserted, because the document is
 * allowed to grow — what is asserted is that the database ends up holding what
 * was read, and that check is at the bottom of this file.
 */
console.log(
  `[seed-drinks] docs/drinks.md — ${counts.drinks} drink(s) in ` +
    `${counts.programmes} programme(s) across ${counts.rooms} room(s): ` +
    `${counts.paired} with the mirror their author wrote, ${counts.owed} ` +
    `carrying a named debt, ${counts.mirrorSelf} whose two lines agree on ` +
    `purpose.`
);
console.log(
  `[seed-drinks] ${counts.mealClaims} meal-shape claim(s); ` +
    `${counts.noMealShape} drink(s) name no shape and claim none. ` +
    `${counts.shared} carry an "Also at" line.`
);
if (counts.repeated.length > 0) {
  const rows = counts.repeated.reduce((n, entry) => n + entry.rows, 0);
  console.log(
    `[seed-drinks] ${counts.repeated.length} drink name(s) occur verbatim in ` +
      `more than one programme, across ${rows} row(s). COUNTED AND NOT ACTED ` +
      `ON: two rooms pouring a common thing are two drinks. Sharing is the ` +
      `"Also at" line and nothing else — see this file's header on collapse().`
  );
  for (const entry of counts.repeated) {
    console.log(`  ${entry.rows} × ${entry.text}`);
  }
}

if (dryRun) {
  console.log(
    `\n[seed-drinks] --dry-run: no database was contacted, nothing was written.`
  );
  process.exit(0);
}

/* ── the write ──────────────────────────────────────────────────────── */

const url = process.env.DATABASE_URL;
if (!url) {
  fail("DATABASE_URL is not set. Use --dry-run to read the counts without one.");
}

const client = new pg.Client({
  connectionString: url,
  ssl: needsSsl(url) ? { rejectUnauthorized: false } : undefined,
  application_name: "revelle-seed-drinks",
});

await client.connect();

let created = 0;
let held = 0;
let left = 0;
let updated = 0;
let scoped = 0;
let mealsWritten = 0;
let mealsExtra = 0;
let mealsDropped = 0;
const stubbed = [];
/** Rows the file now gives a mirror and the desk still has at draft. */
const awaitingPublish = [];

try {
  await client.query("begin");

  for (const drink of drinks) {
    // The columns this drink becomes, decided once in scripts/drinks-row.mjs
    // so that `npm test` can drive the decision without a database. Read its
    // header before changing what an owed mirror lands as.
    const want = drinkRow(drink);

    const { rows: existing } = await client.query(
      `select id, name, cocktails, mocktails, season::text, season_note,
              season_strict, making::text, mirror_self, source_note, notes,
              status::text
         from drink where slug = $1`,
      [drink.slug]
    );

    const owed = drink.mirrorOwed;

    let drinkId;
    if (existing.length === 0) {
      const { rows } = await client.query(
        `insert into drink (slug, name, cocktails, mocktails, season,
                            season_note, making, mirror_self, source_note,
                            notes, status)
         values ($1, $2, $3, $4, $5::season_band, $6, $7::making_level, $8, $9,
                 $10, $11)
         returning id`,
        [
          want.slug,
          want.name,
          want.cocktails,
          want.mocktails,
          want.season,
          want.seasonNote,
          want.making,
          want.mirrorSelf,
          want.sourceNote,
          want.notes,
          want.status,
        ]
      );
      drinkId = rows[0].id;
      created += 1;
      if (owed) {
        held += 1;
        console.log(
          `[seed-drinks] held     ${drink.slug} (draft) — ${drink.name} — ` +
            `its mirror is owed`
        );
      } else {
        // In the same transaction as the row, so a drink cannot go out with
        // nothing in the ledger saying it did. A held row gets no entry,
        // because nothing went live — the same rule scripts/seed-games.mjs
        // follows for a game carrying a founder-pending question.
        await recordAutoPublish(client, {
          table: "drink",
          id: drinkId,
          name: drink.name,
          seeder: "seed-drinks",
          run: RUN,
          source: "docs/drinks.md",
        });
        console.log(
          `[seed-drinks] created  ${drink.slug} (live) — ${drink.name}`
        );
      }
    } else {
      drinkId = existing[0].id;
      const row = existing[0];
      const differs =
        row.name !== want.name ||
        row.cocktails !== want.cocktails ||
        row.mocktails !== want.mocktails ||
        row.season !== want.season ||
        row.season_note !== want.seasonNote ||
        row.making !== want.making ||
        row.mirror_self !== want.mirrorSelf ||
        row.source_note !== want.sourceNote;

      if (!differs) {
        console.log(`[seed-drinks] same     ${drink.slug}`);
      } else if (!overwrite) {
        left += 1;
        console.log(
          `[seed-drinks] differs  ${drink.slug} — left as the desk has it. ` +
            `Re-run with --overwrite to let the file win.`
        );
      } else {
        // season_strict is NOT written here, and it is NOT unwritten either.
        //
        // THE ARGUMENT THIS COMMENT USED TO MAKE, KEPT WHOLE (CLAUDE.md
        // rule 14), because it was right about its own scope and the thing that
        // beat it is a different question:
        //
        //     "season_strict is NOT written here. docs/drinks.md names no
        //      hard-filter list, so the file has nothing to say about it and a
        //      curator's answer at the desk is the only one there is."
        //
        // WHAT BEAT IT: the consequence, which nobody had measured. The column
        // defaults false, the desk had never been asked, and so NO DRINK IN THE
        // CATALOGUE WAS SEASON-GATED — a February party was offered the summer
        // bar with "Summer" printed on the sheet, in PORTOFINO, whose premise is
        // explicitly off-season and whose two programmes both say Summer. The
        // founder ruled on 2026-08-27 (docs/needs-a-human.md): this is the same
        // defect as the empty venue gate, not a second one, and it outranks it
        // on triage because a sheet that says Summer at a February party is
        // what the MEMBER reads.
        //
        // The half that was right survives untouched: this SEEDER still says
        // nothing about it, because the document still names no hard-filter
        // list. What was wrong was the conclusion that therefore nothing may.
        // `src/lib/catalogue/tagging.ts` derives it from `season_note` by the
        // rule scripts/seed-dishes.mjs already applies to six hundred dishes —
        // strict where the band holds the whole of her wording, a lean where
        // the band is only part of it — as a POST-SEED step, after this seeder
        // has written the wording it reads. A curator's answer at the desk
        // still outranks it: the derivation only ever asserts a gate and never
        // retracts one, without --overwrite.
        //
        // `status` is NOT written here either, and that one is a decision
        // rather than an inheritance: publishing is the desk's act (rule 8),
        // and a seeder that re-published on every deploy would undo a veto
        // silently on the next build. A drink whose mirror ARRIVES in the file
        // while the row is still draft is therefore reported below rather than
        // published — rule 16, the seeder saying out loud what it did not do.
        //
        // `notes` is left alone for the same reason, with one exception: the
        // sentence THIS SCRIPT wrote about an owed mirror becomes false the
        // moment the mirror is authored, so that exact string is cleared. Any
        // other text in that column is somebody's and is not touched.
        const staleOwedNote =
          !owed &&
          row.notes !== null &&
          row.notes.startsWith(OWED_NOTE_OPENING);
        await client.query(
          `update drink set name = $2, cocktails = $3, mocktails = $4,
                  season = $5::season_band, season_note = $6,
                  making = $7::making_level, mirror_self = $8, source_note = $9,
                  notes = $10
             where id = $1`,
          [
            drinkId,
            want.name,
            want.cocktails,
            want.mocktails,
            want.season,
            want.seasonNote,
            want.making,
            want.mirrorSelf,
            want.sourceNote,
            staleOwedNote ? null : row.notes,
          ]
        );
        updated += 1;
        console.log(`[seed-drinks] updated  ${drink.slug} — from the file`);
      }

      if (!owed && row.status === "draft") {
        awaitingPublish.push(drink.slug);
      }
    }

    /*
     * WHICH SHAPES OF TABLE IT CLAIMS — db/060 §V's `drink_meal`.
     *
     * NO ROWS MEANS EVERY SHAPE, exactly as `dish_meal` reads, so the six
     * drinks whose programmes named no shape ("After a day outside", "A boat or
     * beach day") get no rows and are eligible everywhere. That is the
     * document refusing to guess, not a claim on all five (rule 3).
     *
     * The note is the programme's own "what it is for" line, so the row says
     * what was read and where it came from — db/060 asks for exactly that.
     *
     * INSERTED, NEVER BLIND-DELETED. A claim the document does not make but the
     * database holds is a curator's, and this seeder's standing rule is that
     * the desk outranks the file — so an extra claim is REPORTED, and only
     * `--overwrite`, which is the flag that means "let the file win", removes
     * it. Reporting rather than silence is the point: an undeleted stale claim
     * would widen a whitelist with nothing saying so.
     */
    const { rowCount: mealRows } = await client.query(
      `insert into drink_meal (drink_id, meal, note)
       select $1, m.meal::meal_shape, $3
         from unnest($2::text[]) as m(meal)
       on conflict (drink_id, meal) do nothing`,
      [drinkId, drink.meals, drink.programmeLine]
    );
    mealsWritten += mealRows;

    const { rows: extra } = await client.query(
      `select meal::text as meal
         from drink_meal
        where drink_id = $1
          and not (meal::text = any($2::text[]))
        order by meal`,
      [drinkId, drink.meals]
    );
    if (extra.length > 0) {
      const names = extra.map((e) => e.meal).join(", ");
      if (overwrite) {
        const { rowCount } = await client.query(
          `delete from drink_meal
            where drink_id = $1
              and not (meal::text = any($2::text[]))`,
          [drinkId, drink.meals]
        );
        mealsDropped += rowCount;
        console.log(
          `[seed-drinks] dropped  ${drink.slug} — meal claim(s) ${names}, ` +
            `which the document does not make (--overwrite)`
        );
      } else {
        mealsExtra += extra.length;
        console.log(
          `[seed-drinks] extra    ${drink.slug} — the database claims ${names} ` +
            `and the document does not. Left as the desk has it; --overwrite ` +
            `removes it.`
        );
      }
    }

    // EVERY destination this drink was written for. One row each, all
    // `native` — the claim, not a weight. docs/drinks.md: "A drink is scoped to
    // a destination the way a menu is", and the founder: "some can cross
    // reference". See db/019 and scripts/seed-dishes.mjs, which does this
    // identically for six hundred dishes.
    //
    // `do update set native = true` AND NOT `do nothing`, which it was until
    // 2026-08-26. The two differ in exactly one case and it is the case the
    // `Also at:` line will actually be used in:
    //
    //   affinity re-weights scoring for already-eligible candidates; it never
    //   confers eligibility — sharing requires a second native row.
    //
    // A `drink_world` row that is not native is NOT A CLAIM — `claimEligibility`
    // (src/lib/selection/occasion.ts) reads native rows as a whitelist, and an
    // affinity weight on a room the drink is not native to changes a score the
    // drink is never in the running for. So where a row for this pair already
    // exists as an affinity weight — set at the desk, or staged by a pass that
    // read affinity as sharing — `do nothing` left the claim INERT and the run
    // reported a destination it had not actually given the drink. On a fresh
    // database the two are indistinguishable, which is why this survived
    // unnoticed: docs/drinks.md has never carried an `Also at:` line, so this
    // statement has only ever run against empty tables.
    //
    // `affinity` is NOT overwritten on an existing row: a weight somebody set
    // is hers, and it starts mattering rather than stopping. A `forbidden` row
    // is not upgraded at all — a veto that can be outvoted is not a veto — and
    // the check after the loop turns that collision into a failed run.
    for (const heading of drink.destinations) {
      const world = await ensureWorld(client, heading, "seed-drinks");
      if (world.created && !stubbed.includes(world.slug)) stubbed.push(world.slug);
      const { rowCount } = await client.query(
        `insert into drink_world (drink_id, world_id, native, affinity, note)
         values ($1, $2, true, 1.000, $3)
         on conflict (drink_id, world_id) do update
            set native = true, note = excluded.note
          where not drink_world.native and not drink_world.forbidden`,
        [drinkId, world.id, "Written for this destination. docs/drinks.md."]
      );
      const { rows: check } = await client.query(
        `select native from drink_world where drink_id = $1 and world_id = $2`,
        [drinkId, world.id]
      );
      if (check.length === 0 || !check[0].native) {
        // `throw`, not `fail()`: this is inside the transaction, and the catch
        // below is what rolls it back and prints the run's own failure line.
        throw new Error(
          `drink ${drink.programme}.${drink.index} is written for ${heading}, ` +
            `where it is already FORBIDDEN. A veto that can be outvoted is not ` +
            `a veto, so the claim was refused rather than written over it. ` +
            `Remove one of the two — the heading (or "Also at" line) in ` +
            `docs/drinks.md, or the forbidden row at the desk.`
        );
      }
      scoped += rowCount;
    }
  }

  /*
   * COUNT WHAT IT WROTE, FROM THE DATABASE, BEFORE COMMITTING — rule 24, and
   * rule 20's other half: a report generated from something other than reality
   * is the most convincing failure this system produces. Counting the
   * JavaScript objects would prove only that the parser agrees with itself.
   *
   * Read inside the transaction so a mismatch ROLLS THE RUN BACK rather than
   * being noticed after the fact. The only thing that could differ between here
   * and post-commit is another session writing concurrently, which does not
   * happen on a deploy.
   *
   * WHAT IS ASSERTED IS THE ROW COUNT AND NOTHING ELSE. `drink-NN-M` is a slug
   * space only this seeder writes, so the number of rows in it is a fact about
   * this script and can only be wrong if this script is. The paired/owed split
   * is REPORTED instead: a curator authoring one of the twenty-one missing
   * mirrors at the desk moves it, legitimately, and a check that goes red on
   * her doing the right thing is a tripwire that teaches people to ignore
   * tripwires.
   */
  const { rows: back } = await client.query(
    `select count(*)::int                                as rows,
            count(mocktails)::int                        as paired,
            count(*) filter (where mocktails is null)::int as owed,
            count(*) filter (where mirror_self)::int     as mirror_self,
            count(*) filter (where status = 'active')::int as live,
            (select count(*)::int from drink_meal dm
              where dm.drink_id in (select id from drink
                                     where slug ~ '^drink-[0-9]{2}-[0-9]+$'))
                                                         as meal_claims
       from drink
      where slug ~ '^drink-[0-9]{2}-[0-9]+$'`
  );
  const wrote = back[0];

  if (wrote.rows !== drinks.length) {
    throw new Error(
      `the document holds ${drinks.length} drink(s) and the database now holds ` +
        `${wrote.rows} row(s) in the drink-NN-M slug space. Those two numbers ` +
        `are the same number or this seeder is wrong about what it wrote ` +
        `(CLAUDE.md rule 24). Rolled back.`
    );
  }

  await client.query("commit");

  console.log(
    `\n[seed-drinks] READ BACK FROM THE DATABASE — ${wrote.rows} row(s), ` +
      `${wrote.paired} with a mirror, ${wrote.owed} owed, ` +
      `${wrote.mirror_self} mirror-self, ${wrote.live} offered, ` +
      `${wrote.meal_claims} meal-shape claim(s).`
  );
  if (wrote.paired !== counts.paired || wrote.owed !== counts.owed) {
    console.log(
      `[seed-drinks] the file says ${counts.paired} paired and ${counts.owed} ` +
        `owed. The database differs, which is what a mirror authored at the ` +
        `desk looks like — not an error, and not something this script ` +
        `corrects.`
    );
  }
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
  `\n[seed-drinks] ${drinks.length} drink(s) in the file: ${created} created ` +
    `(${created - held} live, ${held} held at draft on an owed mirror), ` +
    `${updated} updated, ${left} left as the desk has them. ` +
    `${claims} destination claim(s) authored, ${scoped} written, ` +
    `${crossed.length} drink(s) cross-referenced. ` +
    `${counts.mealClaims} meal-shape claim(s) authored, ${mealsWritten} written` +
    (mealsDropped > 0 ? `, ${mealsDropped} dropped` : "") +
    (mealsExtra > 0 ? `, ${mealsExtra} extra left in place` : "") +
    `.`
);
for (const drink of crossed) {
  console.log(`  ${drink.slug} — ${drink.destinations.join(" · ")}`);
}
if (awaitingPublish.length > 0) {
  console.log(
    `\n${awaitingPublish.length} drink(s) have a mirror in the file and are ` +
      `still DRAFT in the database — either the mirror arrived after the row ` +
      `did, or somebody sent the row back. This seeder does not publish an ` +
      `existing row either way: that is the desk's act (CLAUDE.md rule 8), and ` +
      `a seeder that re-published on every deploy would undo a veto silently. ` +
      `They are at /desk/drinks:\n  ` +
      awaitingPublish.join("\n  ")
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
if (created - held > 0) {
  console.log(
    `\n${created - held} drink(s) went LIVE on this run. The pool stocks ` +
      `itself (db/036); the desk\nis where that gets vetoed, not where it gets ` +
      `approved. /desk/stocked lists this run\nand sends one drink or all ` +
      `${created - held} back to draft.`
  );
}
if (held > 0) {
  console.log(
    `\n${held} drink(s) are HELD AT DRAFT because their mirror is owed. ` +
      `Nothing can offer one:\ndb/060's drink_live_has_its_mirror refuses it, ` +
      `and that is the guarantee, not this script.\nEach carries the debt in ` +
      `its own notes at /desk/drinks. Writing the mirror in\ndocs/drinks.md ` +
      `and re-running with --overwrite is what settles it — the row is then\n` +
      `offered at the desk, which this seeder does not do for an existing row.`
  );
}
