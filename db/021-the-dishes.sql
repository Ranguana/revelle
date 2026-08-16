-- Revelle Société — THE DISHES: the sixth ingredient pool
--
-- Applied by scripts/migrate.mjs after 020, inside one transaction together
-- with its schema_migrations ledger row. Same rule as every file before it:
-- nothing here may be a statement that refuses to run in a transaction.
--
-- New file, never applied anywhere, so no SENTINELS entry in
-- scripts/migrate.mjs.
--
-- ─────────────────────────────────────────────────────────────────────
-- THIS IS NOT db/012 BEING RECONSIDERED
--
-- db/012 ends with "No dish table, no course rows. The whole menu is the unit",
-- and a file called "the dishes" arriving nine migrations later looks exactly
-- like somebody quietly overturning it. It is not, and the distinction is the
-- reason this file can exist without the menus changing by a byte:
--
--   db/012 refused to DECOMPOSE A MENU. "Splitting her list on commas would be
--   a guess, and a guess applied to somebody's writing." That refusal stands
--   here, whole. `menu.dishes` is still one authored line, no menu is parsed by
--   anything, and there is no join table between a menu and a dish anywhere in
--   this migration. Read db/012's opening argument before adding one.
--
--   THIS FILE IMPORTS A SECOND AUTHORED DOCUMENT. docs/dishes.md is not a
--   decomposition of docs/menus.md — it is 650 lines the founder wrote
--   separately, one dish per line, already carrying the two facts a menu line
--   does not carry per dish: which course it is and how much of it is made. The
--   dishes were never inside the menus to be extracted. They arrived beside
--   them.
--
-- So there are two authored things on the table now and they are different
-- shapes: an EVENING (a menu — composed, sequenced, named for what it is for)
-- and a PLATE (a dish — one line, one course, one rung of work). Neither is
-- derived from the other and neither replaces the other.
--
-- ── AND NOTHING HERE PUTS A DISH ON A TABLE ─────────────────────────
--
-- THERE IS NO SLOT IN THIS MIGRATION. No `slot_kind` row, no `occasion_slot`
-- rows, and `typical_draw` is 0. That is a split between two files rather than
-- a hesitation: db/022, in the same drop, is THE TABLE, COMPOSED — three course
-- slots, the rules that make a composition coherent, and the argument for all
-- of it. It sets `typical_draw` to 3 on the row this file registers.
--
-- The split is worth the two files because the two decisions are genuinely
-- separable and only one of them is reversible. IMPORTING 650 AUTHORED LINES IS
-- NOT A PRODUCT DECISION — the dishes exist, they were written, and a database
-- that cannot hold them is simply behind the catalogue. LETTING A MACHINE
-- ASSEMBLE AN EVENING OUT OF THEM IS the product decision, it is the one db/012
-- refused on the evidence available then, and it is argued at length in db/022
-- including what it costs. Anyone who wants to revisit composition reverts one
-- file and still has the pool.
--
-- ─────────────────────────────────────────────────────────────────────
-- ONE ROW PER DISH, MANY DESTINATIONS — HER INSTRUCTION, VERBATIM
--
--   "Dishes repeat across destinations on purpose — dedupe to one row with
--    multiple destination tags at import."
--
-- Oysters on the half shell is written under Westhampton, Nantucket, Côte
-- d'Azur and New Orleans. It is ONE dish that four houses serve, not four
-- dishes, and the shape that says so already exists: `dish_world`, installed
-- below by exactly the same call `menu_world` and `drink_world` came from.
--
-- The de-duplication key is (name, COURSE) and not name alone, because the
-- document contains one genuine disagreement and it is not a typo: "Papaya
-- with lime" is a DESSERT at Tahiti and an APPETIZER at Havana. Those are two
-- things to serve, at two moments, and collapsing them onto one row would
-- force one of the two houses to be wrong. 650 lines therefore become 600
-- dishes and 650 `dish_world` rows.
--
-- ─────────────────────────────────────────────────────────────────────
-- CONTENTS
--
--   course                 appetizer · main · dessert. an enum: closed and
--                          structural, exactly as season_band is
--   dish                   the pool
--   dish_project_facets    season and making, projected the one way
--   the installs           facet tags, ingredients, occasion, slot, destination
--   dish_card              the reading view
-- ─────────────────────────────────────────────────────────────────────


-- ── course ───────────────────────────────────────────────────────────
--
-- An enum by 001's rule: the set is closed by the STRUCTURE OF A MEAL rather
-- than by taste. docs/dishes.md is grouped under exactly three `###` headings
-- at all thirteen destinations and the seeder treats a fourth as an error.
--
-- Declared in the order a meal runs, so `order by course` means something and
-- means nothing more.
--
-- ── WHY THIS IS NOT A FACET ─────────────────────────────────────────
--
-- Season is a facet (db/012 projects it) because a host can have a preference
-- about the calendar. Making is a facet (db/016) because she is asked about it
-- by name. NOBODY PREFERS APPETIZERS. Course is not a taste, it is a position
-- in an evening — the same kind of fact `game.shape` is, which db/010 also
-- leaves as a plain column with no facet beside it.
--
-- The test db/016 states for whether a facet earns its place is whether a host
-- can ANSWER in it. There is no question here to answer, so a `course`
-- dimension would be seven hundred tag rows that nothing ever scores against,
-- and scripts/check-facets.mjs would be right to be suspicious of it.

create type course as enum (
  'appetizer',
  'main',
  'dessert'
);

comment on type course is
  'Where a dish sits in an evening. Closed by the structure of a meal, and the '
  'three headings docs/dishes.md is grouped under at every destination. NOT a '
  'facet: nobody prefers appetizers. See db/021.';


-- ── dish ─────────────────────────────────────────────────────────────
--
-- Ordinary in every way the other five pools are — uuid, slug, name,
-- product_status — so the installers below need no special case.
--
-- IT IS ALSO A LINE AND NEVER A RECIPE. There is no method column, no
-- ingredient list, no quantity and no serving count here, and their absence is
-- db/012's product decision applied one level down: "A member can cook or she
-- can order. What she lacks is knowing what the evening should BE." A dish is
-- "Clams casino" or "Chicken liver pâté on toasts" and stops there. Anyone
-- reading this file will eventually notice that a recipe field is "obviously
-- missing"; it is not, and 650 dishes is 650 times the temptation, which is
-- why the sentence is repeated here rather than pointed at.

create table dish (
  id            uuid primary key default gen_random_uuid(),

  -- DERIVED FROM THE NAME, not from a number.
  --
  -- Every other pool numbers its slugs ('menu-01', 'drink-07') because its
  -- document numbers its entries. docs/dishes.md numbers nothing, so a
  -- positional slug would mean that inserting one dish into the middle of
  -- Nantucket renumbers every dish after it — and a seeder that leaves existing
  -- rows alone and creates the ones it cannot find would then create four
  -- hundred duplicates in one run. The name is the stable thing, so the name is
  -- the key. See scripts/seed-dishes.mjs for the collision rule.
  slug          citext not null unique check (slug ~ '^[a-z][a-z0-9-]*$'),

  -- THE DISH, AS SHE WROTE IT. Read by ingredient_pool.label_column, so it
  -- appears in the curator's inventory and in every error message about this
  -- pool. Unlike a menu's, this name is not "what it is for" — it is the plate.
  name          text not null check (btrim(name) <> ''),

  -- One line, never a page. The newline ban is db/012's "a line, not a page"
  -- rule made structural, at a quarter of the length: the longest name in the
  -- authored document is 58 characters and 200 is already generous.
  constraint dish_name_is_a_line
    check (name !~ '[\r\n]' and length(btrim(name)) between 1 and 200),

  course        course not null,

  -- HOW MUCH OF IT IS MADE, on db/016's making axis.
  --
  -- `making_level` and not a sixth enum with the same members, and not db/012's
  -- `cooking_level` either. db/017 settled this: the two existing enums have the
  -- same members because they are one axis under two names, and a new pool
  -- takes the GENERALISED one — `cooking_level` is the menus' historical name
  -- for it and adding a third caller to it would re-establish exactly the drift
  -- db/016 wrote `making_level` to end.
  --
  -- The three authored positions are docs/dishes.md's own letters:
  --
  --     B  bought and arranged   ->  bought_and_arranged   made_by_hand −1.000
  --     H  half made             ->  half_made             (no tag)
  --     M  actually made         ->  actually_made         made_by_hand +1.000
  --
  -- The SAME three positions and the SAME projection function the menus and the
  -- drinks use — made_by_hand_weight() in db/017 — so one answer from a host
  -- governs the plate, the table and the bar together. The kitchen's words are
  -- the menus' words ("actually made"), because a dish is food; they live in
  -- src/lib/desk/labels.ts, where words belong.
  making        making_level not null,

  -- WHEN IT BINDS, AND ONLY WHEN IT BINDS.
  --
  -- docs/dishes.md: "Season noted only where it binds." 107 of 650 lines carry
  -- one; the other 543 make no claim about the calendar and are `year_round`,
  -- which is db/012's own gloss for that value and not a default standing in
  -- for a missing answer.
  season        season_band not null default 'year_round',
  -- Her wording, kept: "early summer", "late summer", "fall/winter", "Carnival
  -- season". The enum is what the engine reads; this is what a curator reads,
  -- and on four of the eight wordings in this document it says something the
  -- enum provably cannot.
  season_note   text not null default '',

  -- A HARD FILTER rather than a weight, exactly as db/012 defines it.
  --
  -- THE RULE THE SEEDER APPLIES, stated here because it is a judgement and not
  -- a mechanism: STRICT WHERE THE BAND CONTAINS HER WORDING, SOFT WHERE THE
  -- BAND IS ONLY PART OF IT.
  --
  --   "summer", "early summer", "late summer"   -> summer,  strict. The band is
  --                                                WIDER than what she wrote,
  --                                                so a hard filter on it can
  --                                                never exclude a month she
  --                                                wanted.
  --   "spring" "fall" "winter"                  -> the band, strict. Exact.
  --   "Carnival season"                         -> winter,  strict. Narrower
  --                                                than winter by weeks; see
  --                                                the note below.
  --   "fall/winter"                             -> autumn,  SOFT. She named two
  --                                                seasons and the band holds
  --                                                one, so a hard filter would
  --                                                delete January from a dish
  --                                                she wrote FOR January. A
  --                                                weight is the only honest
  --                                                instrument left.
  --
  -- AND IT DOES NOTHING TODAY, WHICH IS WHY IT IS SAFE. Nothing in
  -- src/lib/selection/ reads `season` on any pool, and the application asks no
  -- date question — there is no "when is the party" field in src/lib/quiz.ts —
  -- so there is nothing to filter a season against. This column is the answer
  -- already recorded for the day that question is asked. Until then a wrong
  -- judgement here costs nothing and is one checkbox at the desk to reverse.
  season_strict boolean not null default false,

  -- Internal. Never rendered to a member. The seeder writes the one case the
  -- document cannot settle by itself — see the disagreement rule in
  -- scripts/seed-dishes.mjs.
  source_note   text,
  notes         text,

  status        product_status not null default 'draft',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger dish_touch before update on dish
  for each row execute function set_updated_at();

create index dish_status_idx on dish (status, name);
create index dish_course_idx on dish (course, status);
create index dish_season_idx on dish (season, season_strict);
create index dish_making_idx on dish (making);

comment on table dish is
  'Dishes — the sixth ingredient pool, and the interchangeable half of the '
  'table. ONE ROW PER DISH with a dish_world row for every destination it was '
  'written under: Oysters on the half shell is one dish that four houses '
  'serve. Menu ideas only, never recipes — db/012''s refusal at one level down. '
  'It fills NO SLOT today, deliberately; read the top of db/021. '
  'See docs/dishes.md.';

comment on column dish.slug is
  'Derived from the name, not from a position in the document, because '
  'docs/dishes.md numbers nothing and a positional key renumbers on an insert. '
  'See scripts/seed-dishes.mjs.';

comment on column dish.course is
  'Where it sits in an evening. Part of the de-duplication key: "Papaya with '
  'lime" is a dessert at Tahiti and an appetizer at Havana, and those are two '
  'things to serve.';

comment on column dish.making is
  'How much of it is made, on db/016''s making axis. The same three positions '
  'the menus and the drinks carry, projected by the same made_by_hand_weight().';

comment on column dish.season_strict is
  'True where the season she wrote is a hard gate and the band holds the whole '
  'of it. Inert until the application asks when the party is — nothing in '
  'src/lib/selection/ reads a season today. See db/021.';


-- ─────────────────────────────────────────────────────────────────────
-- KING CAKE, AND A CALENDAR season_band CANNOT HOLD
-- ─────────────────────────────────────────────────────────────────────
--
-- One line of the 650 carries a season that is not a season:
--
--     - King cake · B (Carnival season)
--
-- Carnival is a MOVABLE FEAST. It opens on Twelfth Night, 6 January, every
-- year without exception, and closes on Mardi Gras, which falls anywhere from
-- 3 February to 9 March depending on the date of Easter. It is a hard calendar
-- gate — a king cake in July is not a weak match, it is a thing New Orleans
-- would not do — and it is emphatically not one of the four seasons.
--
-- ── WHAT THIS FILE DOES, AND WHAT IT REFUSES TO DO ──────────────────
--
-- It maps to `winter`, with `season_strict = true`, and keeps her two words
-- verbatim in `season_note` so that a curator opening the record reads
-- "Carnival season" and never "Winter".
--
-- It does NOT grow a calendar-gate mechanism, and the reason is not effort. A
-- gate needs a date to be a gate, and THIS SYSTEM HAS NO DATE. src/lib/quiz.ts
-- asks a host for her occasion, her room, her guests, her budget and her people
-- — and never once when the party is. Building a movable-feast evaluator for
-- one dish would be machinery with nothing to evaluate against, which is the
-- purest form of the thing db/012 spends four hundred lines refusing.
--
-- ── WHAT IS LOST BY MAPPING IT TO WINTER, EXACTLY ───────────────────
--
-- Eleven months of the twelve are gated correctly and for free. What winter
-- cannot express is the two edges: king cake will be offerable in the first
-- five days of January, before Twelfth Night, and in whatever remains of
-- February after Mardi Gras has passed. Two or three weeks a year, in the right
-- season, at the one destination that has the dish. That is the entire cost,
-- it is smaller than the machinery, and it is written down here so that
-- whoever eventually builds the real gate knows precisely what they are fixing.
--
-- The real fix, when a date question exists: an `ingredient_calendar_gate`
-- table keyed to a computed range, and Carnival as its first row. Not before.


-- ── the projection ───────────────────────────────────────────────────
--
-- Season and making, as facets, so that matching a dish is the same set
-- operation as matching anything else and no reader needs to know these two
-- facts live in columns.
--
-- A ONE-WAY PROJECTION, NOT A SYNC — db/012's rule, db/017's shape, byte for
-- byte drink_project_facets() with the column names changed. The scalar ladder
-- is made_by_hand_weight(), which is written once in db/017 and read by all
-- three pools; writing the case expression a third time is exactly how three
-- representations of one fact come to disagree.
--
-- NULL from the ladder means NO ROW AT ALL, which is the middle of the axis.
-- install_facet_tags constrains every weight to `weight <> 0`, which is the
-- schema stating that a claim of zero is not a claim, and score.ts scores an
-- absent tag as exactly zero. Absence is the representation.

create or replace function dish_project_facets() returns trigger
language plpgsql as $$
declare
  v_weight numeric := made_by_hand_weight(new.making::text);
begin
  delete from dish_facet df
   using facet f
   where df.dish_id = new.id
     and f.id = df.facet_id
     and f.dimension_code = 'season'
     and f.code::text is distinct from new.season::text;

  insert into dish_facet (dish_id, facet_id, weight, provenance, note)
  select new.id, f.id, 1.000, 'curator', 'Projected from dish.season.'
    from facet f
   where f.dimension_code = 'season' and f.code::text = new.season::text
  on conflict (dish_id, facet_id) do nothing;

  delete from dish_facet df
   using facet f
   where df.dish_id = new.id
     and f.id = df.facet_id
     and f.dimension_code = 'making'
     and f.code = 'made_by_hand'
     and v_weight is null;

  if v_weight is not null then
    insert into dish_facet (dish_id, facet_id, weight, provenance, note)
    select new.id, f.id, v_weight, 'curator', 'Projected from dish.making.'
      from facet f
     where f.dimension_code = 'making' and f.code = 'made_by_hand'
    on conflict (dish_id, facet_id) do update
          set weight = excluded.weight,
              note   = excluded.note;
  end if;

  return null;
end;
$$;

comment on function dish_project_facets() is
  'Season and making, projected one way from dish.season and dish.making. The '
  'ladder is made_by_hand_weight() in db/017 — one axis, three positions, six '
  'pools reading one function. Nothing writes back. See db/021.';


-- ── the installs ─────────────────────────────────────────────────────
--
-- Everything below is a call. db/002 claimed adding a pool would be a table
-- plus three calls; db/009 tested it with `game`, db/012 with `menu`, db/017
-- with `drink`. This is the fourth test and it still holds — including
-- db/019's `native` column, which install_world_affinity() now creates on its
-- own so that the sixth pool gets the claim without anybody remembering.

select install_facet_tags('dish', 'Dishes');
select rebuild_facet_tag_view();

-- typical_draw 0 HERE, AND db/022 SETS IT TO 3 WHEN IT ADDS THE SLOTS.
--
-- It is read by exactly one thing: assemblage_headroom(), which multiplies
-- C(available, typical_draw) across the pools. C(n, 0) = 1, so a pool that
-- fills no slot contributes a factor of one — it makes no assemblage more
-- distinct, because nothing draws from it. Writing 3 in a file that installs no
-- slot would inflate the founder's headroom number by roughly ten million on
-- the strength of a selection that does not yet happen, and the number she is
-- told to watch must not be told in advance.
select install_revelle_ingredients('dish', 'Dishes', 'name', 'status', 'active', 0);
select rebuild_revelle_ingredient_view();

select install_occasion_eligibility('dish');
select rebuild_ingredient_occasion_view();

select install_slot_eligibility('dish');
select rebuild_ingredient_slot_view();

select install_world_affinity('dish');
select rebuild_ingredient_world_view();

-- The projection trigger can only be created once dish_facet exists, which is
-- install_facet_tags' doing.
create trigger dish_facets after insert or update of season, making on dish
  for each row execute function dish_project_facets();


-- ── the reading view ─────────────────────────────────────────────────
--
-- One row per dish with everything a curator or the engine reads, so that
-- neither writes the same five joins again. Byte for byte menu_card's and
-- drink_card's shape.
--
-- `world_slugs` is `not forbidden` here, matching its two siblings exactly. The
-- desk reads the CLAIM (`where native`) separately and directly — see the note
-- in src/app/desk/(signed-in)/dishes/[id]/page.tsx about why the two reads must
-- not be confused, and the bug that confusing them caused on the menu form.

create view dish_card as
select d.id,
       d.slug,
       d.name,
       d.course,
       d.making,
       d.season,
       d.season_note,
       d.season_strict,
       d.status,
       d.created_at,
       d.updated_at,
       -- The destinations it was written for. Empty means general — and no
       -- authored dish is, because every line of docs/dishes.md sits under a
       -- destination heading and the seeder writes a native claim for each.
       coalesce(w.worlds, '{}') as world_slugs,
       coalesce(o.occasions, '{}') as native_occasions,
       coalesce(t.tags, '{}') as tags
  from dish d
  left join lateral (
    select array_agg(wd.slug::text order by wd.slug) as worlds
      from dish_world dw
      join world wd on wd.id = dw.world_id
     where dw.dish_id = d.id and not dw.forbidden
  ) w on true
  left join lateral (
    select array_agg(dio.occasion::text order by dio.occasion) as occasions
      from dish_occasion dio
     where dio.dish_id = d.id and dio.fit = 'native'
  ) o on true
  left join lateral (
    select array_agg(f.label order by f.label) as tags
      from dish_facet df
      join facet f on f.id = df.facet_id
     where df.dish_id = d.id
       and f.dimension_code not in ('season', 'cooking', 'making')
  ) t on true;

comment on view dish_card is
  'A dish with its course, its rung on the making axis, its destinations, '
  'occasions and hand-applied tags. Season and making are columns, not tags, '
  'because they are projected the other way.';


-- ─────────────────────────────────────────────────────────────────────
-- WHAT THIS DELIBERATELY DOES NOT DO
--
--   · NO SLOT, no occasion_slot row, typical_draw 0. All three arrive in
--     db/022, which is where composition is argued. This file is the import.
--
--     Two things the pool is worth even with no slot, and they are worth
--     writing down because they survive whatever happens to composition:
--
--       — IT MAKES THE COVERAGE BOARD TRUE. docs/new-destination.md §6 names
--         the making axis as "the one that gets missed": a destination whose
--         menus are all actually made is invisible to a host who wants
--         everything to arrive finished. With two or three menus per
--         destination, most destinations fail that test and there is nothing
--         to do about it. With fifty dishes per destination the gap becomes
--         visible AND fixable — and the pool immediately names one that was
--         invisible before: NINE OF THE THIRTEEN DESTINATIONS HAVE NO MAIN
--         COURSE THAT CAN BE BOUGHT. Nobody authored one. db/022's fallback
--         rule exists because of that sentence.
--       — IT IS THE SUBSTITUTION A HOST ACTUALLY ASKS FOR. An allergy, a fish
--         she cannot get, a table that does not eat pork. Fifty dishes native
--         to her destination, at her rung of work, in her season, is the
--         answer to that question.
--
--   · NO MENU–DISH JOIN TABLE. db/012 refuses to split her line on commas and
--     that refusal is untouched. It is also not merely a principle here: her
--     menus name things the pool does not contain ("corn with herb butter",
--     "wild rice with almonds"), and the pool names things her menus do not.
--     A join table would have to be authored, one menu at a time, by a human
--     with both documents open — which is a real piece of work somebody may
--     decide to do, and is not something a parser may guess at.
--
--   · NO RECIPES, and one level closer to the temptation than db/012 was.
--     Read the top of db/012 before adding a method, a quantity or a serving
--     count. 650 dishes is 650 invitations to.
--
--   · NO PRICE. docs/dishes.md carries no cost and inventing one per plate
--     would be a number nobody authored driving a budget nobody checked.
--     db/012's refusal, unchanged.
--
--   · NO `course` FACET. Nobody prefers appetizers. See the note on the enum.
--
--   · NO CALENDAR GATE. See King Cake above. A gate with no date to gate on is
--     machinery with nothing to do.
--
--   · No content. Every dish is CONTENT and lives in docs/dishes.md, moved in
--     by scripts/seed-dishes.mjs — the same rule db/012, db/017 and
--     scripts/seed-destinations.mjs all state: content in a migration can only
--     be corrected by another migration.
-- ─────────────────────────────────────────────────────────────────────
