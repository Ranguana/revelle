-- ── 047 · TAGGING IS NOT A MIGRATION ────────────────────────────────
--
-- Applied by scripts/migrate.mjs in filename order — after 046 if that file
-- has landed and after 045 otherwise; nothing here depends on which — inside
-- one transaction together
-- with its schema_migrations ledger row. Nothing here may be a statement that
-- refuses to run in a transaction.
--
-- New file, never applied anywhere, so no SENTINELS entry in
-- scripts/migrate.mjs.
--
-- THIS MIGRATION MOVES NO ROWS AND CREATES NO TABLE. It changes four comments
-- and one CHECK's documentation, and that is the entire point of it: the defect
-- it closes was a migration doing work a migration cannot do, and the fix is a
-- step outside the migration chain. What belongs HERE is the part that is
-- genuinely schema — what each column MEANS and who writes it — because the
-- next person to read this schema will otherwise re-derive the same wrong
-- answer from the same right-looking evidence.
--
-- ═════════════════════════════════════════════════════════════════════
-- THE DEFECT, WHICH IS CLAUDE.md RULE 22's FOUNDING CASE
-- ═════════════════════════════════════════════════════════════════════
--
-- `preDeployCommand` runs `npm run migrate` BEFORE every seeder. db/020 and
-- db/033 derive rows by MATCHING AUTHORED TEXT:
--
--     where m.dishes ilike '%steamed clams%' and m.dishes ilike '%boiled lobster%'
--     where m.dishes ilike '%grilled%' and m.dishes not ilike '%grilled cheese%'
--     where d.name ilike '%fire-lit%'
--     where m.cooking = 'actually_made'
--     update world set venue_requirement = … where slug in ('tahiti', …)
--
-- Every one of those runs against an EMPTY TABLE. `menu`, `drink` and `world`
-- rows are written by seeders, which run after. So `ingredient_requirement` is
-- empty on any database built from the committed chain, `venueEligibility()`
-- prunes nothing, and open-flame, full-kitchen and outdoor requirements
-- constrain no package in production today. Not once — ON EVERY BUILD, FOREVER.
-- The migrations looked right, ran clean, raised nothing and did nothing.
--
-- Measured on a scratch build of the whole committed chain before this was
-- written: `ingredient_requirement` 0 rows, `world.venue_requirement` 0 rows,
-- `drink.season_strict` true on 0 of 25, `drink_occasion` 0 rows.
--
-- db/045 hit the same wall from the other side and said so in its own words —
-- "a migration can only retire the rows that exist when it runs, and
-- preDeployCommand runs migrate before seed:menus, so on every fresh build
-- db/045 retired nothing and the seeder created all thirty-nine, live, seconds
-- later". It solved its instance by moving the DECISION onto the registry. This
-- file is the general form: the COMPUTATION moves to after the content.
--
-- ═════════════════════════════════════════════════════════════════════
-- THE REASONING THAT WAS RIGHT, PRESERVED (CLAUDE.md RULE 14)
-- ═════════════════════════════════════════════════════════════════════
--
-- Nothing db/020 or db/033 argued was wrong. Every predicate is kept to the
-- character in src/lib/catalogue/tagging.ts, each with the paragraph that
-- justified it, because the JUDGEMENTS are the expensive part and they were
-- made well. db/020's brief in its own words:
--
--     "Only where it is OBVIOUS, which is the whole brief. Each block below
--      names the words in docs/menus.md, docs/drinks.md or src/lib/games.ts
--      that make the requirement a fact rather than an opinion, and anything
--      that needed an argument was left alone."
--
--     "Matched on the authored text rather than on slugs, so that a re-seed
--      that renumbers the catalogue does not silently tag the wrong dish."
--
-- The second sentence is the one that contains its own defeat, and it is worth
-- being exact about why, because "match text, not slugs" is still correct
-- advice: matching authored text is the right INSTRUMENT and a migration is the
-- wrong PLACE for it. The two were decided together and only one of them was
-- wrong.
--
-- WHAT BEAT IT: not an argument, a measurement. Nobody had counted the rows
-- those statements wrote. They write 35 (measured on a full scratch build,
-- 2026-08-27) and they had written 0 in production since the day they landed.
--
-- ═════════════════════════════════════════════════════════════════════
-- WHERE IT LIVES NOW
-- ═════════════════════════════════════════════════════════════════════
--
--   src/lib/catalogue/tagging.ts     `tagCatalogue()` — the one authority
--   scripts/tag-catalogue.mjs        its wrapper; `npm run tag:catalogue`
--   src/lib/desk/seed-chain.ts       the ordered chain, held once
--   render.yaml                      runs the wrapper, LAST
--   src/app/api/desk/seed/route.ts   runs the same wrapper, LAST
--
-- Two callers from the day it exists, so it is one exported function and not
-- two code paths that agree today (CLAUDE.md rule 21). `src/lib/deploy.test.ts`
-- fails if the two chains stop naming the same steps in the same order — a
-- guard that caught a live drift the day it was written, `seed:bank` having
-- been in render.yaml and not in the route's list for four days.
--
-- AND IT CARRIES THE TWO-PART GUARD RULE 22 ASKS FOR, because the two failures
-- read identically from outside:
--
--   `npm run check:gates`  scripts/check-gates.mjs. Refuses to pass when a
--                          derived table is EMPTY (the tagger never ran) or
--                          when a gate holds claims and PRUNES ZERO ROWS across
--                          the whole catalogue (it ran and matched nothing).
--   src/lib/catalogue/gates.db.test.ts   the same two questions as a build
--                          test, plus the deliberate breakages that prove each
--                          half goes red.
--
-- ═════════════════════════════════════════════════════════════════════
-- AND THE THIRD DERIVATION, WHICH IS NOT WRITTEN AND SAYS SO
-- ═════════════════════════════════════════════════════════════════════
--
-- `drink_occasion` holds zero rows and this migration does not fix that,
-- because it is not a bug. A drink record in docs/drinks.md is five bullets —
-- cocktails · mocktail mirrors · what it's for · season · how much mixing — and
-- there is no occasion among them. The third bullet is the one a parser would
-- reach for, and db/023 already ruled on exactly those twenty-five lines:
--
--     "A sibling of `game_shape` and `occasion_shape`, and deliberately NOT a
--      value of `occasion_type`: an occasion is why she is having people over —
--      a birthday, an anniversary — and a meal shape is what the table is. A
--      birthday can be a brunch and an anniversary can be a late supper, and
--      collapsing the two would make one of those unsayable."
--
-- Twenty of the twenty-five contain a word a thesaurus parser would have scoped
-- on ("dinner", "supper", "dinner party", "boat"), counted rather than assumed.
-- Minting `dinner_party` from "A long dinner party" would be the
-- classifier-hyphen incident with a thesaurus: a matcher that hits confidently
-- against the wrong question. So the tagging step writes NO CLAIM and files one
-- to-do on the desk saying whose move it is, and an unclaimed drink behaves
-- exactly as it does today — room-scoped, occasion-blind. Turning the machinery
-- on removed nothing a member could have had.
-- ═════════════════════════════════════════════════════════════════════


-- ── 1 · what the columns actually mean, said where they are read ─────
--
-- CLAUDE.md rule 23: where a name invites the wrong reading, state the fact at
-- every place the wrong reading would be made. Every one of these columns
-- currently reads as "the schema handles this", and the schema does not — a
-- step outside the schema does, and a database that has not run it has the
-- column and no claims.

comment on table ingredient_requirement is
  'What this ingredient needs of the room. No row means it works anywhere, '
  'which is the safe default and the one to take whenever it is a judgement '
  'call. Consumed by venueEligibility() in src/lib/selection/venue.ts.'
  ' '
  'WRITTEN BY A POST-SEED STEP, NEVER BY A MIGRATION — src/lib/catalogue/'
  'tagging.ts, run as `npm run tag:catalogue` at the end of the deploy chain '
  'and of the desk''s sync. db/020 and db/033 tagged from inside the migration '
  'chain, which runs before every seeder, so those statements matched empty '
  'tables on every build and this table was EMPTY in production for weeks with '
  'nothing reporting it. A database whose tagging step has not run has this '
  'table and no rows, and `venueEligibility()` then prunes nothing. '
  '`npm run check:gates` is how you find out which. See db/047, CLAUDE.md 22.';

comment on column world.venue_requirement is
  'What this destination''s deliverable PRESUPPOSES — read at the reveal and '
  'surfaced, NEVER scored. Venue must never touch the destination choice '
  '(vector.ts, db/020, selection.test.ts); this is the separate question of '
  'whether the room can be delivered at all in the space she has.'
  ' '
  'SET BY THE POST-SEED STEP. db/033 set it with `update world … where slug in '
  '(''tahiti'', ''palm-springs-1965'')`, and `world` rows are written by '
  'seed:destinations and seed:bank — both of which run after the migration — '
  'so that statement updated zero rows on every build. It was the third inert '
  'derivation of the same shape and the one nobody had looked for. See db/047.';

comment on column drink.season_strict is
  'Whether this programme''s season is a GATE or a lean. True means a February '
  'party may not be offered it at all; false means the season only re-weights, '
  'through the season facet. Read by scopePools() in src/lib/selection/fill.ts.'
  ' '
  'DERIVED BY THE POST-SEED STEP from `season_note`, by the rule '
  'scripts/seed-dishes.mjs applies to six hundred dishes: strict where the band '
  'holds the whole of her wording, a lean where the band is only part of it '
  '(SEASON_NARROWED, scripts/catalogue-vocabulary.mjs). scripts/seed-drinks.mjs '
  'has never written this column, so before db/047 every drink was at the '
  'default and NO drink was season-gated — a February party was offered the '
  'summer bar with "Summer" printed on the sheet. The derivation only ever '
  'ASSERTS a gate; a curator who clears one at the desk keeps her answer.';

-- `drink_occasion` is created by install_occasion_eligibility (db/009) with a
-- generic comment, or none. This says the specific thing, in the place a
-- reader of an empty table will be standing.
comment on table drink_occasion is
  'Which occasions a drinks programme claims. NO ROWS MEANS EVERY OCCASION — '
  'the default claimEligibility() gives an untagged row on all four axes.'
  ' '
  'IT HOLDS ZERO ROWS AND THAT IS A DECISION, NOT A GAP IN THE WIRING. '
  'docs/drinks.md has no occasion field: a record is cocktails, mocktail '
  'mirrors, what it''s for, season, how much mixing. The "what it''s for" line '
  'is db/023''s MEAL SHAPE axis — "an occasion is why she is having people '
  'over, and a meal shape is what the table is" — and twenty of the twenty-five '
  'lines contain a word a thesaurus parser would have scoped on. The post-seed '
  'step reads every row, writes no claim, and files one to-do on the desk. '
  'Before writing a parser for this table, read the argument in '
  'src/lib/catalogue/tagging.ts. See db/047.';


-- ── 2 · and prove the file did what it says ──────────────────────────
--
-- Not a content assertion — this migration deliberately makes none, which is
-- the whole subject of the file. It checks that the four comments it just
-- wrote are actually there, which is a fact about the SCHEMA and therefore a
-- fact a migration is allowed to have an opinion about.
--
-- db/032's lesson is why this is narrow: an assertion that can never be true
-- raises on every database, `npm run migrate` exits non-zero, the deploy fails
-- and the old instance keeps serving — correctly, and completely silently.

do $$
declare v_missing text := '';
begin
  if (select obj_description('ingredient_requirement'::regclass, 'pg_class'))
     not like '%POST-SEED STEP%' then
    v_missing := v_missing || ' ingredient_requirement';
  end if;
  if (select obj_description('drink_occasion'::regclass, 'pg_class'))
     not like '%ZERO ROWS AND THAT IS A DECISION%' then
    v_missing := v_missing || ' drink_occasion';
  end if;

  if v_missing <> '' then
    raise exception
      '[047] comment(s) not applied:%. This migration is nothing but '
      'documentation, so a comment that did not land is the whole file failing.',
      v_missing;
  end if;

  raise notice
    '[047] tagging moved out of the migration chain. `npm run tag:catalogue` '
    'writes what db/020 and db/033 could not; `npm run check:gates` says '
    'whether any of it refuses anything.';
end $$;
