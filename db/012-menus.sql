-- Revelle Société — MENUS: the fourth ingredient pool
--
-- Applied by scripts/migrate.mjs after 011, inside one transaction together
-- with its schema_migrations ledger row. Same rule as every file before it:
-- nothing here may be a statement that refuses to run in a transaction.
--
-- New file, never applied anywhere, so no SENTINELS entry in
-- scripts/migrate.mjs.
--
-- ─────────────────────────────────────────────────────────────────────
-- TWO PRODUCT DECISIONS, MADE BEFORE THE TABLE WAS DRAWN
--
-- 1. MENU IDEAS ONLY. NEVER RECIPES.
--
--    There is no method column, no ingredient list, no quantity, no serving
--    count and no prep timeline in this file, and their absence is the
--    product, not an omission somebody has not got to yet. A menu item is a
--    line. WESTHAMPTON's own exemplars are the form:
--
--        Oysters, until they are gone.
--        Cold roast chicken. Dinner, or three in the morning.
--        Vodka, grapefruit, salt. Called something else after midnight.
--
--    A member can cook or she can order. What she lacks is knowing what the
--    evening should BE. Anyone reading this file will eventually notice that
--    a recipe field is "obviously missing"; it is not, and adding it turns a
--    société into a food blog. If it is ever added it must be argued for on
--    its own, in a pull request, against this paragraph.
--
-- 2. THE WHOLE MENU IS THE UNIT, NOT THE DISH.
--
--    This is where menus deliberately DIFFER from products and games, which
--    are individually selectable and combined by the engine. It looks like an
--    inconsistency, so: a menu is a composition. Oysters, then cold roast
--    chicken, then something at three in the morning is an evening; the same
--    three dishes drawn one at a time from three pools is a buffet, and food
--    is where incoherence reads worst and fastest. So the pool is menus, the
--    unit of selection is one whole menu, and `dishes` is one verbatim line
--    rather than a table of rows.
--
--    That last point is not laziness. The catalogue (docs/menus.md) is
--    authored as a single ordered list per menu, in the author's punctuation —
--    "chilled langoustines with garlic mayonnaise, champagne" is two things
--    and "caviar with blini and crème fraîche" is one. Splitting on commas
--    would be a guess, and a guess applied to somebody's writing. The line is
--    stored as she wrote it.
--
-- ─────────────────────────────────────────────────────────────────────
-- THE FOUR AUTHORED FIELDS
--
-- docs/menus.md is the source of truth and it carries exactly four fields per
-- menu. They map here as:
--
--   dishes in order   -> menu.dishes            verbatim, one line
--   what it's for     -> menu.name              her words. This IS the name
--   season            -> menu.season + season_note + season_strict
--   how much cooking  -> menu.cooking + cooking_note
--
-- Season and cooking are each ONE field to a curator and two columns here: a
-- closed value the selection layer can filter and weight on, and her own
-- wording beside it, kept verbatim. "Winter, works year-round" and "Half made
-- — good jarred fish soup exists" both say something the enum cannot, and the
-- second is how the menu BENDS, which is the most useful sentence on the
-- record. Neither is normalised away.
--
-- ─────────────────────────────────────────────────────────────────────
-- CONTENTS
--
--   season_band       when a menu belongs. an enum: closed and structural
--   cooking_level     the four authored values. an enum, projected to a facet
--   the vocabulary    season facets, cooking facets, one mood facet
--   menu              the pool
--   menu_project_facets  a ONE-WAY projection, not a sync
--   the_menu          a slot, and the occasions that have one
--   the installs      facet tags, ingredients, occasion, slot, destination
-- ─────────────────────────────────────────────────────────────────────

-- ── season_band ──────────────────────────────────────────────────────
--
-- An enum by 001's rule: the set is closed by the calendar rather than by
-- taste. `shoulder` and `year_round` are not seasons, they are answers about
-- season, and both appear verbatim in the authored catalogue ("Shoulder
-- season", "Spring or fall", "Year-round"), so they are values here rather
-- than nulls somebody has to interpret.
--
-- Declared in the order a year runs, then the two answers that are not a point
-- in it, so `order by season` groups sensibly and means nothing more.

create type season_band as enum (
  'spring',
  'summer',
  'high_summer',
  'autumn',
  'winter',
  'shoulder',
  'year_round'
);

-- ── cooking_level ────────────────────────────────────────────────────
--
-- THE FOUR AUTHORED VALUES, in descending order of work, so that comparison
-- operators mean what they look like.
--
-- This is the menu's OWN NATURAL STATE — what this food is, not a tier it can
-- be ordered in and not the member's answer. A member who says she does not
-- want to cook weights the pool toward `bought_and_arranged`; she does not
-- eliminate everything above it, because a menu that is actually made is still
-- the right menu for her if everything else fits and she has an afternoon.
-- That is why this is projected onto a facet below rather than used as a
-- filter: a filter would throw away menus over a preference.

create type cooking_level as enum (
  'actually_made',
  'mostly_made',
  'half_made',
  'bought_and_arranged'
);

-- ── the vocabulary ───────────────────────────────────────────────────
--
-- The shared one. db/002 left `season` deliberately empty — "Empty by design"
-- — precisely so that the first curator who needs it inserts rows rather than
-- writing a migration. This is that insert. `cooking` is a new dimension for
-- the same reason facet_dimension is a table at all.
--
-- No private terms anywhere: a menu is tagged in exactly the vocabulary a
-- destination and a product are tagged in, so matching stays a set operation.

insert into facet_dimension (code, label, description, position) values
  ('cooking', 'How much cooking',
   'The menu''s own natural state, from actually made to bought and arranged. '
   'A WEIGHT, not a gate: a member''s answer pulls toward one end and never '
   'eliminates a menu. Projected from menu.cooking; never tagged by hand. '
   'See db/012.',
   170);

insert into facet (dimension_code, code, label, description, provenance) values
  -- season — the values of season_band, one for one, so the projection below
  -- is total and cannot silently drop a menu.
  ('season', 'spring',      'Spring',           'Cold still, and the first thing worth eating outside.', 'curator'),
  ('season', 'summer',      'Summer',           'The season the coastal destinations are written in.', 'curator'),
  ('season', 'high_summer', 'High summer',      'August. Heat that does not break, and food that concedes to it.', 'curator'),
  ('season', 'autumn',      'Autumn',           'The last weekend up. Ovens on again.', 'curator'),
  ('season', 'winter',      'Winter',           'Indoors, dressed, and the year''s most formal food.', 'curator'),
  ('season', 'shoulder',    'Shoulder season',  'Spring or autumn. Works at either end and belongs to neither.', 'curator'),
  ('season', 'year_round',  'Year-round',       'Makes no claim about the calendar.', 'curator'),

  -- cooking — the four values as authored in docs/menus.md, in her words.
  ('cooking', 'actually_made',       'Actually made',
   'Cooked, and the cooking is the afternoon.', 'curator'),
  ('cooking', 'mostly_made',         'Mostly made',
   'Cooked, with one or two things bought ready.', 'curator'),
  ('cooking', 'half_made',           'Half made',
   'One real dish; everything else arranged.', 'curator'),
  ('cooking', 'bought_and_arranged', 'Bought and arranged',
   'Nothing is cooked, and it is still a menu. The plates are the work.', 'curator'),

  -- The one facet docs/menus.md asks for by name: "Menus 8 and 12 fill the
  -- house with smell before anyone arrives. No delivered version of them does
  -- that, and it is worth a facet of its own." It goes in `mood`, which db/002
  -- also left empty by design, because it is a fact about the room and not
  -- about the food. Tagged by hand, on the menus that earn it.
  ('mood', 'cooking_smell', 'The house smells of it',
   'Something has been in the oven since before anyone arrived. A thing a '
   'delivered dinner cannot do at any price.', 'curator');

-- ── menu ─────────────────────────────────────────────────────────────
--
-- The pool. Ordinary in every way the other three are — uuid, slug, name,
-- product_status — so the installers below need no special case.

create table menu (
  id            uuid primary key default gen_random_uuid(),
  -- 'menu-01' … 'menu-20', the numbering in docs/menus.md. Stable under a
  -- re-seed even when the wording of a line changes, which is the only
  -- property a seed key needs. Never reused.
  slug          citext not null unique check (slug ~ '^[a-z][a-z0-9-]*$'),

  -- WHAT IT IS FOR, in her words, and it is the name because it is the name:
  -- "A long summer dinner", "A midnight breakfast after a night out". Read by
  -- ingredient_pool.label_column, so it appears in the curator's inventory and
  -- in every error message about this pool.
  name          text not null check (btrim(name) <> ''),

  -- THE DISHES, IN ORDER, VERBATIM. One line, her punctuation, not decomposed.
  -- See the note at the top of this file for why this is not a table of rows.
  -- The newline ban is the "a line, not a page" rule made structural: the
  -- moment this column can hold paragraphs, somebody puts a method in it.
  dishes        text not null
                  check (dishes !~ '[\r\n]'
                         and length(btrim(dishes)) between 1 and 600),

  season        season_band not null,
  -- Her wording, kept: "High summer", "Late August", "Winter, works
  -- year-round", "Spring or fall". The enum is what the engine reads; this is
  -- what a curator reads, and it says things the enum cannot.
  season_note   text not null default '',
  -- A HARD FILTER rather than a weight. True for the summer-coastal menus,
  -- which docs/menus.md names: a clambake in February is not a weak match, it
  -- is wrong. False everywhere else, where season is a soft weight through the
  -- facet projected below. Two mechanisms because there are genuinely two
  -- kinds of seasonality here, and collapsing them would either make every
  -- menu seasonal or none of them.
  season_strict boolean not null default false,

  cooking       cooking_level not null,
  -- THE ESCAPE HATCH, VERBATIM. "lobster meat can be bought picked",
  -- "chicken can be bought rotisserie", "good jarred fish soup exists", "or
  -- ordered whole and restaged". This is how the menu BENDS, it is hers, and
  -- it belongs on the record rather than in a separate tier: a menu with an
  -- escape hatch is one menu, not two.
  cooking_note  text not null default '',

  -- Internal. Never rendered to a member.
  source_note   text,
  notes         text,

  status        product_status not null default 'draft',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger menu_touch before update on menu
  for each row execute function set_updated_at();

create index menu_status_idx on menu (status, name);
create index menu_season_idx on menu (season, season_strict);
create index menu_cooking_idx on menu (cooking);

comment on table menu is
  'Menus — the fourth ingredient pool, and the one selected as a WHOLE rather '
  'than assembled from a pool of dishes. Menu ideas only: there is no recipe, '
  'quantity or method column and their absence is deliberate. See db/012 and '
  'docs/menus.md.';

comment on column menu.dishes is
  'The dishes in order, one line, in the author''s own punctuation. Not '
  'decomposed into rows: splitting her list on commas would be a guess applied '
  'to somebody''s writing.';

comment on column menu.cooking_note is
  'The escape hatch, verbatim — how this menu bends when nobody wants to cook.';

-- ── DRINKS: a seam, deliberately not modelled ────────────────────────
--
-- Cocktails currently sit INSIDE `dishes` as a line, exactly as authored:
-- "champagne", "martinis", "Manhattans before", "cold rosé". That is a
-- decision to defer, not a decision to couple, and docs/menus.md keeps it
-- open: drinks may become their own pool matched like menus, or they may
-- become a PARTNERSHIP — a bar or a restaurant supplying the drink for a
-- destination, named on the menu, which makes it someone else's craft rather
-- than another recipe.
--
-- Nothing here assumes either. There is no drink column, no cocktail table and
-- no parsing of `dishes` anywhere in the codebase, so when drinks do get a
-- shape they arrive as a new pool (a table plus the four installer calls
-- below) and the menu line stops carrying them. Do NOT add a "cocktail"
-- column here in the meantime — that is the coupling this note exists to
-- prevent.

-- ── the projection ───────────────────────────────────────────────────
--
-- Season and cooking, as facets, so that matching a menu is the same set
-- operation as matching anything else and no reader needs to know these two
-- facts live in columns.
--
-- A ONE-WAY PROJECTION, NOT A SYNC. db/002 warns at length about two
-- representations of one fact, and db/009 resolves the identical problem for
-- tracklist.world_id the same way: the column is authoritative, the facet row
-- is derived from it, and nothing ever writes back. A curator changes the
-- season on the menu; she does not edit a season tag.
--
-- Safe to delete-then-insert within the dimension because NOTHING ELSE writes
-- rows in the `season` or `cooking` dimensions — they exist for this. Every
-- other facet on a menu (taste direction, mood, the smell facet) is hand
-- tagged and is not touched here.

create or replace function menu_project_facets() returns trigger
language plpgsql as $$
begin
  -- Season.
  delete from menu_facet mf
   using facet f
   where mf.menu_id = new.id
     and f.id = mf.facet_id
     and f.dimension_code = 'season'
     and f.code::text is distinct from new.season::text;

  insert into menu_facet (menu_id, facet_id, weight, provenance, note)
  select new.id, f.id, 1.000, 'curator', 'Projected from menu.season.'
    from facet f
   where f.dimension_code = 'season' and f.code::text = new.season::text
  on conflict (menu_id, facet_id) do nothing;

  -- How much cooking.
  delete from menu_facet mf
   using facet f
   where mf.menu_id = new.id
     and f.id = mf.facet_id
     and f.dimension_code = 'cooking'
     and f.code::text is distinct from new.cooking::text;

  insert into menu_facet (menu_id, facet_id, weight, provenance, note)
  select new.id, f.id, 1.000, 'curator', 'Projected from menu.cooking.'
    from facet f
   where f.dimension_code = 'cooking' and f.code::text = new.cooking::text
  on conflict (menu_id, facet_id) do nothing;

  return null;
end;
$$;

-- ── the slot ─────────────────────────────────────────────────────────
--
-- A menu needs somewhere to go, or the pool is decorative. `the_menu` sits
-- between the table and the moment, in the `details` block, because the menu
-- is part of what the table IS.
--
-- Adding a slot is an insert, which is the whole argument db/009 makes for
-- slot_kind being data. position 35 is between table_object (30) and
-- the_moment (40) and collides with nothing.

insert into slot_kind (code, label, description, section, per_guest, position) values
  ('the_menu', 'The menu',
   'What they eat, as one composition. Chosen whole — see db/012 — so that '
   'the courses agree with each other rather than each agreeing with her '
   'answers separately.',
   'details', false, 35);

-- The rows that put a menu IN that slot per occasion are below the installs,
-- because occasion_slot.pool is a real foreign key into the pool registry and
-- the pool does not exist until install_revelle_ingredients() has run.

-- ── the installs ─────────────────────────────────────────────────────
--
-- Everything below is a call. That was the claim db/002 made about adding a
-- pool and db/009 tested with `game`; this is the second test of it and it
-- still holds. Order matters only in that install_revelle_ingredients()
-- registers the pool, and the three scoping installers update that row.

select install_facet_tags('menu', 'Menus');
select rebuild_facet_tag_view();

-- typical_draw 1: one menu per Revelle for a single evening. It feeds nothing
-- but the headroom arithmetic in db/002.
select install_revelle_ingredients('menu', 'Menus', 'name', 'status', 'active', 1);
select rebuild_revelle_ingredient_view();

select install_occasion_eligibility('menu');
select rebuild_ingredient_occasion_view();

select install_slot_eligibility('menu');
select rebuild_ingredient_slot_view();

select install_world_affinity('menu');
select rebuild_ingredient_world_view();

-- The projection trigger can only be created once menu_facet exists, which is
-- install_facet_tags' doing.
create trigger menu_facets after insert or update of season, cooking on menu
  for each row execute function menu_project_facets();

-- ── which occasions have a menu, and whether it is required ──────────
--
-- The judgement, stated so it can be argued with: an occasion built around a
-- TABLE is broken without a menu, so the one-evening occasions require one. A
-- weekend or a getaway runs for days and some of those meals are eaten out —
-- food there is per-day and desirable rather than constitutive, so it is
-- optional and multiplied by occasion_shape.days. 'other' asks for one and
-- does not insist, because nobody knows yet what it is.
insert into occasion_slot
  (occasion, slot_code, pool, min_count, max_count, required, per_day, position, note)
values
  ('dinner_party',  'the_menu', 'menu', 1, 1, true,  false, 15,
   'The long dinner IS the menu. Nothing else here is more required.'),
  ('birthday',      'the_menu', 'menu', 1, 1, true,  false, 15, ''),
  ('anniversary',   'the_menu', 'menu', 1, 1, true,  false, 15, ''),
  ('holiday',       'the_menu', 'menu', 1, 1, true,  false, 15, ''),
  ('no_reason',     'the_menu', 'menu', 1, 1, true,  false, 15, ''),
  ('other',         'the_menu', 'menu', 1, 1, false, false, 15,
   'Shape unknown until a human reads her words; a menu is offered, not '
   'insisted on.'),
  ('girls_weekend', 'the_menu', 'menu', 1, 1, false, true,  25,
   'One a day, and optional: some of those meals are eaten out.'),
  ('getaway',       'the_menu', 'menu', 1, 1, false, true,  15,
   'The occasion that most resists being scheduled. Food per day, nothing '
   'insisted on.'),
  ('bridal',        'the_menu', 'menu', 1, 1, false, true,  25, '');

-- ── the reading view ─────────────────────────────────────────────────
--
-- One row per menu with everything a curator or the engine reads, so that
-- neither writes the same five joins again. Hand-tagged facets only — the two
-- projected dimensions are already columns here and repeating them would be
-- the same fact twice.

create view menu_card as
select m.id,
       m.slug,
       m.name,
       m.dishes,
       m.season,
       m.season_note,
       m.season_strict,
       m.cooking,
       m.cooking_note,
       m.status,
       m.created_at,
       m.updated_at,
       -- The destinations it was written for. Empty means general.
       coalesce(w.worlds, '{}') as world_slugs,
       coalesce(o.occasions, '{}') as native_occasions,
       coalesce(t.tags, '{}') as tags
  from menu m
  left join lateral (
    select array_agg(wd.slug::text order by wd.slug) as worlds
      from menu_world mw
      join world wd on wd.id = mw.world_id
     where mw.menu_id = m.id and not mw.forbidden
  ) w on true
  left join lateral (
    select array_agg(mo.occasion::text order by mo.occasion) as occasions
      from menu_occasion mo
     where mo.menu_id = m.id and mo.fit = 'native'
  ) o on true
  left join lateral (
    select array_agg(f.label order by f.label) as tags
      from menu_facet mf
      join facet f on f.id = mf.facet_id
     where mf.menu_id = m.id
       and f.dimension_code not in ('season', 'cooking')
  ) t on true;

comment on view menu_card is
  'A menu with its destinations, occasions and hand-applied tags. Season and '
  'cooking are columns, not tags, because they are projected the other way.';

-- ─────────────────────────────────────────────────────────────────────
-- WHAT THIS DELIBERATELY DOES NOT DO
--
--   · NO RECIPES. Read the top of this file before adding one.
--   · No dish table, no course rows. The whole menu is the unit.
--   · No drinks pool. See the seam above.
--   · No price. docs/menus.md carries no cost and inventing one per head
--     would be a number nobody authored driving a budget nobody checked.
--     When a menu costs something, it arrives as a column with a source.
--   · No content. Every menu is CONTENT and lives in docs/menus.md, moved in
--     by scripts/seed-menus.mjs — the same rule seed-destinations.mjs states:
--     content in a migration can only be corrected by another migration.
-- ─────────────────────────────────────────────────────────────────────
