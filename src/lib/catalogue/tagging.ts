/**
 * THE POST-SEED TAGGING STEP — CLAUDE.md rule 22, made into a thing that runs.
 *
 * ── WHAT IT IS ───────────────────────────────────────────────────────
 *
 * Migrations own SCHEMA. Seeders own CONTENT. Anything computed OVER content
 * runs after content exists, and this is that step: one exported function,
 * `tagCatalogue`, that reads the seeded catalogue and writes the three derived
 * claims nothing else can write.
 *
 *   ingredient_requirement   what a thing needs of the room (db/020, db/033)
 *   world.venue_requirement  what a destination's deliverable presupposes
 *   drink.season_strict      whether a drink's season is a gate or a lean
 *   drink_occasion           which occasions a programme claims — and see the
 *                            long section below, because the honest answer
 *                            today is NONE and that is the deliverable
 *
 * ── THE FOUNDING DEFECT, WHICH IS WHY THIS FILE EXISTS ───────────────
 *
 * `preDeployCommand` runs `npm run migrate` BEFORE every seeder. db/020 and
 * db/033 derive rows by MATCHING AUTHORED TEXT — `menu.dishes ilike '%grilled%'`,
 * `world.slug in ('tahiti', …)` — against tables that are empty at migration
 * time. On every build, forever. The migrations looked right, ran clean, raised
 * nothing and did nothing, and `ingredient_requirement` is EMPTY on any
 * database built from the committed chain, so `venueEligibility()` prunes
 * nothing: open-flame, full-kitchen and outdoor requirements constrain no
 * package in production today.
 *
 * db/045 hit the identical wall from the other side three weeks later — a
 * migration that retired the menu pool, running before the seeder that created
 * it — and solved it by moving the DECISION onto the registry. This file is the
 * general form of the same fix: the computation moves to where the content is.
 *
 * ── TWO CALLERS, ONE AUTHORITY (CLAUDE.md rule 21) ───────────────────
 *
 * The founder, before this was written:
 *
 *   "The tagging step now has two callers — deploy and the sync button — and
 *    anything with two callers is Rule 21 territory before it's even built. One
 *    exported function both paths invoke, or the button and the deploy drift
 *    apart the day after the button existed to prevent exactly that."
 *
 * So `tagCatalogue()` is the whole of it. `scripts/tag-catalogue.mjs` is a
 * fourteen-line wrapper that opens a client, calls this, prints, and sets an
 * exit code; `render.yaml` runs that wrapper as the last link of the deploy
 * chain and `src/app/api/desk/seed/route.ts` runs the same wrapper as the last
 * step of the sync button's chain. Neither caller contains a tagging rule.
 *
 * The irony worth naming, because it is one edit away in either direction:
 * /desk/stocked's button exists BECAUSE render.yaml and the live service had
 * drifted and the catalogue silently stopped being stocked. A tagging step that
 * only the deploy reached would be that same drift, reintroduced by the fix for
 * it. `src/lib/deploy.test.ts` now asserts the two chains name the same steps
 * in the same order, which is the only way the two lists cannot part company.
 *
 * ── FRAMEWORK-FREE, LIKE ITS NEIGHBOURS ──────────────────────────────
 *
 * No React, no `server-only`, no `@/` alias — the rule src/lib/portal/picks.ts
 * and src/lib/selection/slot-coverage.ts already keep, and it buys the same
 * thing here: `node --test` imports it directly, a plain `.mjs` script imports
 * it, and a Next route could import it in-process tomorrow without any of the
 * three getting a different answer.
 *
 * ── IT DOES NOT ACTIVATE ANYTHING ────────────────────────────────────
 *
 * Rule 8 stands whole. This writes CLAIMS about rows that already exist at
 * whatever status their seeder gave them. It publishes nothing, retires
 * nothing, and touches no governed class.
 */

import { SEASONS, SEASON_NARROWED } from "../../../scripts/catalogue-vocabulary.mjs";

/** The same minimal handle the engine takes. A `pg` Client satisfies it. */
export type Queryable = {
  query: (
    text: string,
    params?: unknown[]
  ) => Promise<{ rows: Record<string, unknown>[]; rowCount?: number | null }>;
};

/**
 * The ledger actor. The same string the seeders stock under
 * (`POOL_STOCKING_ACTOR` in scripts/catalogue-vocabulary.mjs) would be a lie
 * here — this step stocks nothing — so it gets its own, and /desk/stocked can
 * tell a tagging run from a stocking run without reading the summary.
 */
export const TAGGING_ACTOR = "auto: catalogue-tagging";

/** db/011's CHECK: dotted, lower case, past tense. */
export const TAGGING_ACTION = "catalogue.tagged";

/* ═════════════════════════════════════════════════════════════════════
   1 · WHAT A THING NEEDS OF THE ROOM
   ═════════════════════════════════════════════════════════════════════

   MOVED, NOT REWRITTEN. Every predicate below is db/020's or db/033's, to the
   character, with its argument. What beat the original placement was not the
   reasoning — the reasoning was right and is kept verbatim — but the PLACE: a
   migration cannot match authored text, because at migration time there is no
   authored text. See CLAUDE.md rule 14 and rule 22.

   Kept as SQL rather than turned into a row-by-row loop in TypeScript, for two
   reasons that are the same reason: db/020 wrote `ilike '%grilled%' and not
   ilike '%grilled cheese%'` and a JavaScript re-expression of that is a second
   spelling of one predicate, which is exactly how the classifier-hyphen
   incident happened (`'take home'` against `take-home`, 143 of 152 rows in the
   wrong bucket, nothing said anything). And `on conflict do nothing` is what
   makes a re-run free, which is the property the whole deploy chain is built
   on. */

type RequirementStatement = {
  /** For the report, and for the "did this match anything" count. */
  readonly label: string;
  /** db/020 or db/033, so a reader can go and check the argument. */
  readonly from: string;
  readonly sql: string;
};

const REQUIREMENT_STATEMENTS: readonly RequirementStatement[] = [
  {
    label: "the clambake — a boil pot has no indoor version",
    from: "db/020",
    // A CLAMBAKE IS THE WORKED EXAMPLE, and it is the founder's own:
    //
    //   "a clambake in a studio apartment. The boil-pot menu dies on
    //    requires_outdoors; NANTUCKET survives; she gets the fog-day lunch."
    //
    // Menu 5 in docs/menus.md — steamed clams, boiled lobsters, corn, red
    // potatoes, Portuguese sausage — is authored as "A big outdoor dinner". A
    // boil pot is not a saucepan; there is no indoor version of it. Menu 6, the
    // rainy-day lunch of chowder and lobster rolls, carries nothing at all,
    // which is why she still gets Nantucket.
    sql: `insert into ingredient_requirement (entity_table, entity_id, requirement, note)
          select 'menu', m.id, 'requires_outdoors',
                 'A boil pot. Authored as "' || m.name || '"; there is no indoor version.'
            from menu m
           where m.dishes ilike '%steamed clams%'
             and m.dishes ilike '%boiled lobster%'
          on conflict do nothing`,
  },
  {
    label: "grilled over fire — live fire, and it is outside",
    from: "db/020",
    // ANYTHING GRILLED OVER FIRE, from either document. "Grilled" in the dishes
    // is the fact; a grill is live fire and it is outside.
    sql: `insert into ingredient_requirement (entity_table, entity_id, requirement, note)
          select 'menu', m.id, r.code,
                 'Grilled over fire: "' || left(m.dishes, 60) || '…"'
            from menu m
            cross join (values ('requires_open_flame'), ('requires_outdoors')) as r(code)
           where m.dishes ilike '%grilled%'
             and m.dishes not ilike '%grilled cheese%'
          on conflict do nothing`,
  },
  {
    label: "the fire-lit dinner — a drink authored as live fire",
    from: "db/020",
    // A FIRE-LIT DINNER, and the flamed cherries. docs/drinks.md authors drink
    // 21 as "A fire-lit dinner"; anything flamed at the table is live fire by
    // definition. Neither is outdoors — a fireplace is indoors — so only the
    // flame is claimed, which is exactly the "tag what is obvious" rule doing
    // its job.
    sql: `insert into ingredient_requirement (entity_table, entity_id, requirement, note)
          select 'drink', d.id, 'requires_open_flame',
                 'Authored as "' || d.name || '".'
            from drink d
           where d.name ilike '%fire-lit%'
          on conflict do nothing`,
  },
  {
    label: "flamed at the table",
    from: "db/020",
    sql: `insert into ingredient_requirement (entity_table, entity_id, requirement, note)
          select 'menu', m.id, 'requires_open_flame',
                 'Flamed at the table: "' || left(m.dishes, 60) || '…"'
            from menu m
           where m.dishes ilike '%flamed%' or m.dishes ilike '%bananas foster%'
              or m.dishes ilike '%cherries jubilee%'
          on conflict do nothing`,
  },
  {
    label: "actually made — the afternoon before is part of the evening",
    from: "db/020",
    // A MENU THAT IS ACTUALLY MADE NEEDS A KITCHEN. `cooking = 'actually_made'`
    // is the author's own value and it means the afternoon before is part of
    // the evening — which is not something that happens on a beach with no
    // oven. `half_made` deliberately does not claim it: half of it arrives
    // finished, and a hob is not a full kitchen. `bought_and_arranged` claims
    // nothing at all, which is the whole point of that rung.
    //
    // A DRINK THAT IS ACTUALLY MIXED DOES NOT NEED A KITCHEN. A bar is a table
    // with ice on it. Nothing is tagged from the drinks' making axis, and this
    // comment exists so that the next person does not "finish the job" by
    // symmetry: symmetry is not evidence.
    sql: `insert into ingredient_requirement (entity_table, entity_id, requirement, note)
          select 'menu', m.id, 'requires_full_kitchen',
                 'Authored as actually made — the afternoon before is part of the evening.'
            from menu m
           where m.cooking = 'actually_made'
          on conflict do nothing`,
  },
];

/**
 * A DESTINATION MAY PRESUPPOSE A ROOM — db/033 §4, and the third inert
 * derivation this file found rather than the two it was sent for.
 *
 * db/033 wrote `update world set venue_requirement = 'requires_outdoors' where
 * slug in ('tahiti', 'palm-springs-1965')`. `world` rows are created by
 * `seed:destinations` and by `seed:bank`'s draft stubs — both of which run
 * AFTER the migration — so that statement has updated zero rows on every build
 * since it was written, exactly like the five above, and nobody had counted it.
 *
 * THIS IS NOT VENUE TOUCHING THE DESTINATION CHOICE, and db/033's paragraph
 * saying so is kept whole because the reading it forbids is the one a reader
 * arrives at: `environment` has zero weight in stage 2, db/020 refuses an
 * environment facet on a world, and selection.test.ts fails with the thesis in
 * the message. Havana in a Brooklyn apartment is still the pitch. What this is:
 * a destination declaring what its DELIVERABLE PRESUPPOSES, read at the
 * reveal's eligibility pass and surfaced, never scored.
 */
const WORLD_REQUIREMENT_SQL = `
  update world set venue_requirement = 'requires_outdoors'
   where slug in ('tahiti', 'palm-springs-1965')
     and venue_requirement is distinct from 'requires_outdoors'`;

export type VenueTagging = {
  /** Per statement: how many rows it actually wrote THIS run. */
  readonly statements: readonly { label: string; from: string; wrote: number }[];
  /** Rows in `ingredient_requirement` after the pass, by requirement code. */
  readonly holdings: Readonly<Record<string, number>>;
  readonly total: number;
  /** `world` rows now declaring a requirement. db/033 §4. */
  readonly worldsDeclaring: number;
};

async function tagVenueRequirements(db: Queryable): Promise<VenueTagging> {
  const statements: { label: string; from: string; wrote: number }[] = [];

  for (const statement of REQUIREMENT_STATEMENTS) {
    const result = await db.query(statement.sql);
    statements.push({
      label: statement.label,
      from: statement.from,
      wrote: result.rowCount ?? 0,
    });
  }

  const worlds = await db.query(WORLD_REQUIREMENT_SQL);
  const declaring = await db.query(
    `select count(*)::int as n from world where venue_requirement is not null`
  );

  const holdings = await db.query(
    `select requirement, count(*)::int as n
       from ingredient_requirement group by requirement order by requirement`
  );
  const byCode: Record<string, number> = {};
  let total = 0;
  for (const row of holdings.rows) {
    const n = Number(row.n);
    byCode[String(row.requirement)] = n;
    total += n;
  }

  void worlds;
  return {
    statements,
    holdings: byCode,
    total,
    worldsDeclaring: Number(declaring.rows[0]?.n ?? 0),
  };
}

/* ═════════════════════════════════════════════════════════════════════
   2 · WHETHER A DRINK'S SEASON IS A GATE OR A LEAN
   ═════════════════════════════════════════════════════════════════════ */

/**
 * IS THIS WORDING A HARD FILTER?
 *
 * `season_strict` is db/012's hard filter: the difference between "a clambake
 * in February is a weak match" and "a clambake in February is wrong".
 * `scripts/seed-drinks.mjs` has never written it — the column defaults false —
 * so no drink is season-gated, and a February party is offered the summer bar
 * with "Summer" printed on the sheet. Portofino is the worst case in the
 * catalogue: its premise is explicitly off-season and both its programmes say
 * Summer.
 *
 * THE RULE IS NOT NEW AND IS NOT INVENTED HERE. It is the one
 * `scripts/seed-dishes.mjs` already applies to six hundred dishes, in
 * `catalogue-vocabulary.mjs`'s own words:
 *
 *   STRICT WHERE THE BAND CONTAINS HER WORDING, SOFT WHERE THE BAND IS ONLY
 *   PART OF IT.
 *
 * A band WIDER than the wording ("October" -> autumn) can never exclude a month
 * she wanted, so it gates. A band that holds only PART of the wording ("Spring
 * and summer" -> summer) would delete May from a drink she wrote for May, which
 * is not a narrower reading of her sentence but a contradiction of it — so it
 * leans, through the season facet, and refuses nothing.
 *
 * `SEASON_NARROWED` is the list of wordings the band only partly covers, and it
 * lives in scripts/catalogue-vocabulary.mjs beside `SEASONS` because those two
 * answer one question and must agree. This file adds no second copy; it gained
 * the drinks' four two-season wordings there, in the file that already owned
 * the judgement.
 *
 * `year_round` is not a claim about the calendar at all, so strictness is
 * meaningless on it and it is always soft — which is also what `inSeason()`
 * does with it independently, so the two agree by construction rather than by
 * being kept in step.
 */
export function seasonStrictClaim(seasonNote: string | null): {
  readonly band: string | null;
  readonly strict: boolean;
  readonly why: string;
} {
  const wording = (seasonNote ?? "").trim();
  if (wording.length === 0) {
    return { band: null, strict: false, why: "no season wording on the row" };
  }

  const band: string | undefined = (SEASONS as Record<string, string>)[wording];
  if (band === undefined) {
    // A wording nothing maps is a wording nobody decided. The seeder would have
    // refused it on the way in, so reaching this means the row was typed at the
    // desk — and guessing is exactly what the map exists to prevent.
    return {
      band: null,
      strict: false,
      why: `"${wording}" is not in SEASONS — a new wording is a decision, not a default`,
    };
  }

  if (band === "year_round") {
    return { band, strict: false, why: "year-round is not a claim about the calendar" };
  }

  if ((SEASON_NARROWED as Set<string>).has(wording)) {
    return {
      band,
      strict: false,
      why: `the band (${band}) holds only part of "${wording}", so it leans rather than gates`,
    };
  }

  return {
    band,
    strict: true,
    why: `the band (${band}) holds the whole of "${wording}"`,
  };
}

export type SeasonRow = {
  readonly slug: string;
  readonly name: string;
  readonly wording: string;
  readonly why: string;
};

export type SeasonTagging = {
  readonly examined: number;
  /** Rows this run lifted from the column default to a real gate. */
  readonly gated: number;
  /** Already correct — the idempotent re-run. */
  readonly agreed: number;
  /** Derived soft, stored strict. NEVER cleared without --overwrite. */
  readonly deskIsStricter: readonly SeasonRow[];
  /** Derived strict, stored soft, and left alone by --no-overwrite policy. */
  readonly notGated: readonly SeasonRow[];
  readonly unmapped: readonly SeasonRow[];
};

/**
 * WHY THIS ONLY EVER TIGHTENS, AND WHAT --overwrite IS FOR.
 *
 * `drink.season_strict` has exactly two writers: this step, and a curator at
 * /desk/drinks. CLAUDE.md rule 16 is the whole of the policy — never absorb an
 * input you do not honour — and a curator who UNTICKS "the season is a hard
 * gate" has given an input. So:
 *
 *   derived strict, stored soft   ASSERT it. On a fresh build every drink is at
 *                                 the column default and this is the pass that
 *                                 makes the gate exist at all.
 *   derived soft, stored strict   LEAVE IT and say so. Retracting a refusal a
 *                                 person made is not a derivation's business.
 *
 * The asymmetry is deliberate and is the same one `ingredient_requirement` has
 * had since db/020: a tag is asserted, and removing one is a human gesture.
 * `--overwrite` is the seeders' own flag, with the seeders' own meaning — let
 * the document win — and it writes both directions.
 *
 * THE HONEST LIMIT, said rather than implied: on the first pass, "stored soft"
 * and "a curator deliberately made it soft" are the same row, because nothing
 * has ever written this column. There is no provenance to read. The first run
 * therefore tightens 20 of 25 drinks with no curator having been consulted,
 * which is correct — the pool stocks itself (rule 13) and the desk vetoes —
 * and every subsequent run is the conservative one.
 */
async function tagDrinkSeasons(
  db: Queryable,
  overwrite: boolean
): Promise<SeasonTagging> {
  const { rows } = await db.query(
    `select id, slug, name, season_note, season_strict, season::text as season
       from drink order by slug`
  );

  let gated = 0;
  let agreed = 0;
  const deskIsStricter: SeasonRow[] = [];
  const notGated: SeasonRow[] = [];
  const unmapped: SeasonRow[] = [];

  for (const row of rows) {
    const wording = String(row.season_note ?? "");
    const stored = Boolean(row.season_strict);
    const claim = seasonStrictClaim(wording);
    const entry: SeasonRow = {
      slug: String(row.slug),
      name: String(row.name),
      wording,
      why: claim.why,
    };

    if (claim.band === null && wording.length > 0) unmapped.push(entry);

    if (claim.strict === stored) {
      agreed += 1;
      continue;
    }

    if (claim.strict) {
      await db.query(`update drink set season_strict = true where id = $1`, [row.id]);
      gated += 1;
      continue;
    }

    // Derived soft, stored strict.
    if (overwrite) {
      await db.query(`update drink set season_strict = false where id = $1`, [row.id]);
      notGated.push(entry);
    } else {
      deskIsStricter.push(entry);
    }
  }

  return {
    examined: rows.length,
    gated,
    agreed,
    deskIsStricter,
    notGated,
    unmapped,
  };
}

/* ═════════════════════════════════════════════════════════════════════
   3 · WHICH OCCASIONS A PROGRAMME CLAIMS — AND WHY THE ANSWER IS NONE
   ═════════════════════════════════════════════════════════════════════

   ── THE FOUNDER'S INSTRUCTION, WHICH IS THE WHOLE OF THIS SECTION ────

     "'A summer dinner or cocktail party' on a programme name is authored
      intent, parseable — but if any programme names are vibes rather than
      scopes, the parser will mint claims the author didn't mean, which is the
      classifier-hyphen incident with a thesaurus. Where the text is ambiguous,
      the honest output is NO CLAIM plus a flag, not a guessed claim —
      unclaimed stays unfiltered (today's behaviour, room-only), which is the
      safe default while ambiguous rows queue for the desk."

   All twenty-five programme names were read before this was written. The answer
   is stronger than "some are vibes":

   NOT ONE OF THE TWENTY-FIVE NAMES AN OCCASION. They are not ambiguous about
   which occasion they mean; they are about a DIFFERENT AXIS, and the house has
   already ruled on exactly this, over exactly these lines. db/023:

     "A sibling of `game_shape` and `occasion_shape`, and deliberately NOT a
      value of `occasion_type`: an occasion is why she is having people over —
      a birthday, an anniversary — and a meal shape is what the table is. A
      birthday can be a brunch and an anniversary can be a late supper, and
      collapsing the two would make one of those unsayable."

   and, naming the source explicitly:

     "The 'what it's for' lines across docs/menus.md (39) and docs/drinks.md
      (25) are the real vocabulary, and they cluster into five shapes and no
      more."

   THE THIRD BULLET OF A DRINK RECORD IS A MEAL SHAPE. `drink.name` is that
   bullet — `scripts/seed-drinks.mjs` writes `whatItsFor` into `name` — so a
   parser that read occasion claims out of it would be reading one axis and
   writing another. That is the classifier-hyphen incident with a thesaurus,
   said precisely: not a spelling that fails to match, but a matcher that
   matches confidently against the wrong question.

   ── AND THE TRAP IS LIVE, NOT HYPOTHETICAL ───────────────────────────

   Two of the twenty-five contain the word "party" — "A formal dinner party"
   (drink 6) and "A long dinner party" (drink 19) — and `occasion_type` has a
   member spelled `dinner_party`. A word-matching parser mints two native claims
   there and feels correct. It would be wrong: `dinner_party` means SHE IS
   HAVING PEOPLE OVER FOR A DINNER, and "A long dinner party" on a drinks
   programme means THE TABLE IS A LONG DINNER — which is true at a birthday, an
   anniversary and a holiday alike. db/023 folded "A dressed-up dinner party"
   and "A formal dinner party" into `long_dinner` for this exact reason.

   db/012's menu names carry the sharper version of the same trap and it is
   worth keeping here as the calibration case: docs/menus.md contains "A
   steakhouse birthday dinner". A parser matching the word `birthday` mints a
   birthday scope on a menu that is a long dinner with a candle in it.

   ── SO WHAT SHIPS ────────────────────────────────────────────────────

   The gate's machinery ships. The claims do not, because there are none to
   make, and the refusal is COUNTED, REPORTED AND PUT ON THE DESK rather than
   left as a silence — which is the difference between this and the defect this
   whole pass exists to fix. `drink_occasion` staying at zero rows is now a
   measured, argued zero with a person's name on the next move, instead of an
   empty table nobody had looked at.

   `matchedOccasionWords` below is the counting half. It is not used to write a
   claim; it exists so that the report can say WHAT A NAIVE PARSER WOULD HAVE
   MATCHED, which is the only way anybody can check that the refusal is a
   finding rather than an assumption. CLAUDE.md, on the classifier hyphen:
   assume your matching is wrong until you have counted what it matched. */

/**
 * The words a thesaurus parser would reach for, per `occasion_type` member.
 *
 * DELIBERATELY GENEROUS. Its job is to prove the refusal, so it must find
 * everything a careless parser would find and a little more. A narrow list here
 * would make the refusal look safer than it is.
 */
const TEMPTING_WORDS: Readonly<Record<string, readonly string[]>> = {
  birthday: ["birthday", "candles", "many happy"],
  girls_weekend: ["girls", "weekend", "hen", "the girls"],
  dinner_party: ["dinner party", "dinner", "supper"],
  getaway: ["getaway", "escape", "away", "trip", "boat", "beach day"],
  anniversary: ["anniversary", "the two of them"],
  holiday: ["holiday", "christmas", "new year", "thanksgiving", "easter", "festive"],
  bridal: ["bridal", "shower", "wedding", "bride"],
  no_reason: ["no reason", "for nothing", "just because"],
  other: [],
};

export type TemptingMatch = {
  readonly occasion: string;
  readonly word: string;
};

/**
 * WHAT A NAIVE PARSER WOULD HAVE MATCHED on this line. Never written anywhere.
 *
 * Lower-cased and substring-matched, which is precisely the sloppiness being
 * measured: `bank_item_default_slot()` spelled `'take home'` with a space while
 * every authored clause used `take-home`, 143 of 152 rows landed in the wrong
 * bucket, and nothing said anything. The lesson generalises in both directions
 * — a matcher can miss everything, and it can hit everything — and the only
 * defence either way is counting the hits and reading them.
 */
export function matchedOccasionWords(name: string): TemptingMatch[] {
  const haystack = name.toLowerCase();
  const hits: TemptingMatch[] = [];
  for (const [occasion, words] of Object.entries(TEMPTING_WORDS)) {
    for (const word of words) {
      if (haystack.includes(word)) hits.push({ occasion, word });
    }
  }
  return hits;
}

/**
 * THE HONEST VERDICT for one programme name.
 *
 * There is no third state hiding here: `claim` is the occasions this line
 * genuinely scopes to, and it is empty for every line in docs/drinks.md as it
 * stands. The `reading` is what the line ACTUALLY says, on the axis it actually
 * speaks — which is the sentence a curator needs in front of her when she
 * decides whether the drinks document should grow an occasion field.
 */
export function occasionClaim(name: string): {
  readonly claim: readonly string[];
  readonly tempting: readonly TemptingMatch[];
  readonly reading: string;
} {
  const tempting = matchedOccasionWords(name);
  return {
    // EMPTY, ALWAYS, TODAY. Not a stub and not a TODO: there is no authored
    // occasion field on a drink record (docs/drinks.md, "Fields per entry:
    // cocktails in order · mocktail mirrors · what it's for · season · how much
    // mixing"), and the third field is db/023's meal-shape axis. A claim
    // written from it would be a claim the author did not make.
    claim: [],
    tempting,
    reading:
      tempting.length === 0
        ? `"${name}" names a meal shape (db/023), not an occasion — no claim`
        : `"${name}" names a meal shape (db/023); a word parser would have ` +
          `read ${[...new Set(tempting.map((t) => t.occasion))].join(", ")} ` +
          `from ${[...new Set(tempting.map((t) => `"${t.word}"`))].join(", ")} — no claim`,
  };
}

export type OccasionTagging = {
  readonly examined: number;
  readonly claimed: number;
  /** Every row, with what it says and what a naive parser would have said. */
  readonly unclaimed: readonly {
    slug: string;
    name: string;
    reading: string;
    tempting: readonly TemptingMatch[];
  }[];
  /** How many rows a word-matching parser would have scoped. The finding. */
  readonly temptedRows: number;
  /** Rows in `drink_occasion` after the pass. */
  readonly holdings: number;
};

async function tagDrinkOccasions(db: Queryable): Promise<OccasionTagging> {
  const { rows } = await db.query(`select slug, name from drink order by slug`);

  const unclaimed: OccasionTagging["unclaimed"] = rows.map((row) => {
    const name = String(row.name);
    const verdict = occasionClaim(name);
    return {
      slug: String(row.slug),
      name,
      reading: verdict.reading,
      tempting: verdict.tempting,
    };
  });

  // Nothing is written. See the section header — the write is not missing, it
  // is refused, and the refusal is the deliverable.
  const held = await db.query(`select count(*)::int as n from drink_occasion`);

  return {
    examined: rows.length,
    claimed: 0,
    unclaimed,
    temptedRows: unclaimed.filter((row) => row.tempting.length > 0).length,
    holdings: Number(held.rows[0]?.n ?? 0),
  };
}

/**
 * PUT THE REFUSAL WHERE A PERSON IS STANDING — CLAUDE.md rule 16.
 *
 * One row, not twenty-five. The gap machinery in src/lib/desk/gaps.ts already
 * settled the grain — "the same gap fires on every selection for every
 * applicant and one row is the correct number of rows" — and twenty-five rows
 * saying the same sentence is a list that stops being read. `gap_key` makes it
 * idempotent and makes a DISMISSED row stay dismissed: db/013's unique index
 * means the insert finds the existing row and does nothing, whatever its state.
 */
const OCCASION_GAP_KEY = "drink:occasion-unclaimed";

async function fileOccasionGap(
  db: Queryable,
  occasion: OccasionTagging
): Promise<boolean> {
  if (occasion.examined === 0) return false;

  const rows = await db.query(
    `insert into desk_todo (body, source, gap_key, detail)
     values ($1, 'gap', $2, $3::jsonb)
     on conflict (gap_key) where gap_key is not null do nothing
     returning id`,
    [
      `No drink is scoped to an occasion, and none can be from the document as ` +
        `it stands: all ${occasion.examined} programmes name a MEAL SHAPE ` +
        `("A late brunch", "A fire-lit dinner") and docs/drinks.md has no ` +
        `occasion field. db/023 ruled these two are different axes. ` +
        `${occasion.temptedRows} of them contain a word a naive parser would ` +
        `have scoped on. Either the document grows an occasion field, or the ` +
        `drinks gain a meal-shape axis of their own — a decision, not a patch.`,
      OCCASION_GAP_KEY,
      JSON.stringify({
        pool: "drink",
        axis: "occasion",
        examined: occasion.examined,
        claimed: occasion.claimed,
        tempted: occasion.temptedRows,
        source: "src/lib/catalogue/tagging.ts",
      }),
    ]
  );
  return rows.rows.length > 0;
}

/* ═════════════════════════════════════════════════════════════════════
   THE RUN
   ═════════════════════════════════════════════════════════════════════ */

export type TaggingReport = {
  readonly venue: VenueTagging;
  readonly season: SeasonTagging;
  readonly occasion: OccasionTagging;
  readonly deskTodoFiled: boolean;
  readonly overwrite: boolean;
};

export type TaggingOptions = {
  /** The seeders' own flag, with the seeders' own meaning: the file wins. */
  readonly overwrite?: boolean;
  /** Skip the `staff_action` row. The tests do; nothing else should. */
  readonly quiet?: boolean;
};

/**
 * THE POST-SEED STEP. Run it after every seeder and never before one.
 *
 * Idempotent by construction: every write is `on conflict do nothing` or is
 * guarded by a comparison, so a second run reports zeros and changes nothing.
 * That is the property that lets it sit in `preDeployCommand` beside the
 * seeders, where a step that had to be remembered would not survive a month.
 */
export async function tagCatalogue(
  db: Queryable,
  options: TaggingOptions = {}
): Promise<TaggingReport> {
  const overwrite = options.overwrite === true;

  const venue = await tagVenueRequirements(db);
  const season = await tagDrinkSeasons(db, overwrite);
  const occasion = await tagDrinkOccasions(db);
  const deskTodoFiled = await fileOccasionGap(db, occasion);

  if (options.quiet !== true) {
    // THE RUN RECORD, and said precisely rather than generously.
    //
    // It is a queryable fact in the same append-only table the seeders' own
    // auto-publishes live in: what was held, what was gated, what was declined,
    // and whether --overwrite was passed. It is NOT rendered by /desk/stocked's
    // per-pool feed, which filters on `entity_table` and a tagging run is about
    // no single row — so claiming this puts it on a screen would be exactly the
    // over-claim this week is named for.
    //
    // What a person actually sees is the STEP: `tag:catalogue` is a link of the
    // sync chain, and src/lib/desk/catalogue-sync.ts records every step's
    // transcript into the sync record that /desk/stocked renders. The report
    // printed by scripts/tag-catalogue.mjs is therefore on the screen already,
    // in full, beside the seeders it followed. This row is the part a query can
    // reach six months later, when the transcript has scrolled off the feed.
    await db.query(
      `insert into staff_action
         (staff_id, actor, action, entity_table, entity_id, summary, detail)
       values (null, $1, $2, null, null, $3, $4::jsonb)`,
      [
        TAGGING_ACTOR,
        TAGGING_ACTION,
        `${venue.total} venue requirement(s) held, ${season.gated} drink(s) ` +
          `season-gated this run, ${occasion.claimed} occasion claim(s) written`,
        JSON.stringify({
          overwrite,
          venue: { total: venue.total, holdings: venue.holdings },
          season: {
            examined: season.examined,
            gated: season.gated,
            agreed: season.agreed,
            deskIsStricter: season.deskIsStricter.length,
          },
          occasion: {
            examined: occasion.examined,
            claimed: occasion.claimed,
            tempted: occasion.temptedRows,
          },
        }),
      ]
    );
  }

  return { venue, season, occasion, deskTodoFiled, overwrite };
}
