-- Revelle Société — THE DRINKS: the fifth ingredient pool, and its mirror
--
-- Applied by scripts/migrate.mjs after 016, inside one transaction together
-- with its schema_migrations ledger row. Same rule as every file before it:
-- nothing here may be a statement that refuses to run in a transaction.
--
-- New file, never applied anywhere, so no SENTINELS entry in
-- scripts/migrate.mjs.
--
-- ─────────────────────────────────────────────────────────────────────
-- THE ONE DECISION THIS FILE IS ABOUT
--
-- EVERY DRINK IS ONE RECORD WITH TWO BUILDS, AND THE SCHEMA SAYS SO.
--
-- docs/drinks.md opens with it and it is not a garnish on the design, it is
-- the design:
--
--     "Every entry carries a mocktail mirror: the same glass, built from the
--      same components, arriving at the same time. […] nobody at the table is
--      visibly not drinking. A person who is pregnant, driving, in recovery,
--      on antibiotics, or simply not in the mood is handed the same tall glass
--      with the same lime wheel as everyone else, and no one has a
--      conversation about it."
--
-- That guarantee dies the moment the two builds can be selected apart. If the
-- mirror were its own pool row, a search that is scoring things one at a time
-- would sooner or later place a cocktail and not its mirror — no rule broken,
-- nothing to see in the output, and a pregnant guest holding a glass of water
-- while everyone else holds a daiquiri.
--
-- So the mirror is NOT a comment, a convention or a curator's habit. It is:
--
--   · TWO NOT-NULL COLUMNS ON ONE ROW. `cocktails` and `mocktails`. There is no
--     way to store half a drink, because there is no row shape that holds one.
--   · NO `is_mocktail` FLAG, NO PARENT KEY, NO SECOND TABLE. Each of those
--     would be a way to represent a mirror that exists on its own, and a way to
--     represent one is a way to select one.
--   · A CHECK THAT THEY DIFFER. A mirror that is the cocktail line pasted twice
--     is not a mirror; it is the field left unanswered in a way that passes
--     NOT NULL.
--   · ONE POOL ROW, SO ONE UNIT OF SELECTION. The engine picks ingredients, an
--     ingredient is a row, and this row is both builds. src/lib/selection/
--     catalogue.ts turns the pair into two printed objects from one pick —
--     the same mechanism a game uses for its card and its ballot.
--
-- WHATEVER IS ADDED TO THIS TABLE LATER, DO NOT ADD A WAY TO HAVE ONE WITHOUT
-- THE OTHER. That is the whole file.
--
-- The mirrors are also not a fallback and must never be flattened into one.
-- Read them: the punch comes from the same pitcher fruit; the citron pressé is
-- self-mixed at the table, so the person drinking it has something to do with
-- her hands; the mocktail sits in a coupe, a flute, a gimlet glass. That craft
-- lives in the author's own line, kept verbatim, for the same reason db/012
-- refuses to split a menu on its commas.
--
-- ─────────────────────────────────────────────────────────────────────
-- THE SECOND DECISION: THE DRINKS ARE THEIR OWN SLOT
--
-- db/012 left a seam and named it: "drinks may become their own pool matched
-- like menus […] Nothing here assumes either." This is that pool, and the slot
-- question it left open is answered here: `the_drinks` is ITS OWN SLOT, not
-- part of `the_menu`.
--
-- The argument is not symmetry, it is db/016. Her application already carries
-- `food_plan`, and one of its four answers is `drinks_only` — "Drinks, and
-- nothing that needs a plate" — which db/016 wires to the `no_food` exclusion,
-- which db/014 hangs off `the_menu`. So a host who says the only thing she is
-- serving is drinks has, by her own answer, removed the slot the drinks would
-- have lived in. She would receive nothing to drink because she said drinks
-- were all she was serving.
--
-- Two slots make her answer mean what it says: the menu goes, the bar stays.
--
--   `the_drinks`.excluded_by IS NULL, DELIBERATELY. There is no answer in the
--   application that removes the bar, and the two near misses are refused for
--   db/014's own reasons:
--
--     food_plan = 'eating_out'   somebody else is choosing the FOOD. The house
--                                can still say what is in her hand beforehand,
--                                and a table booked out is not a dry evening.
--     a future 'no_alcohol'      would be the wrong instrument, and this pool
--                                is why. A host with no drinkers is served by
--                                the MIRROR — the same glass, the same
--                                components, the same moment — which is the
--                                thing the mirror was authored to do. Removing
--                                the slot would take away the answer.
--
-- `section` is 'details' — THE TABLE as she reads it (src/lib/portal/
-- sections.ts). That is the block it renders in and it is not the same
-- question as which slot it is: section_kind is a closed enum in db/001 and
-- adding a value to it cannot be done and used in one transaction, so a BAR
-- block is a two-migration change nobody needs today. The slot is its own; the
-- block it prints in is beside the table, which is where a drink is.
--
-- ─────────────────────────────────────────────────────────────────────
-- THE THIRD DECISION: THREE POSITIONS, ONE AXIS, ONE FACET
--
-- The founder's current drop settles a ladder that used to have four rungs.
-- Both documents now carry exactly three positions, worded per pool:
--
--     menus   actually made · half made · bought and arranged
--     drinks  actually mixed · half made · bought and poured
--
-- They are the SAME axis — db/016's `making` dimension and its one signed
-- facet `made_by_hand`. `bought and poured` is not a fourth thing; it is
-- `bought and arranged` said at a bar, and it projects identically.
--
-- `mostly_made` is retired, not deleted, in both `cooking_level` (db/012) and
-- `making_level` (db/016) — the treatment db/016 prescribed for exactly this:
-- "leave the value in the enum forever, stop offering the option in
-- src/lib/quiz.ts, and every stored answer keeps resolving." No enum is
-- altered here and no stored row is rewritten.
--
-- ── AND THE MIDDLE OF THE LADDER IS NOW AN ABSENCE ──────────────────
--
-- With four rungs db/016 projected 1.0 / 0.4 / −0.4 / −1.0 and every menu
-- carried a tag. With three, the middle rung is genuinely the middle, and a
-- facet tag cannot say that: install_facet_tags (db/002) constrains every
-- weight to `weight <> 0`, which is the schema stating that a claim of zero is
-- not a claim. So `half_made` is projected as NO ROW AT ALL.
--
-- That is not a shortcut. src/lib/selection/score.ts scores a facet the vector
-- carries and the ingredient does not as exactly zero, so an absent tag and a
-- zero-weight tag would score identically — and only one of them is a thing
-- the database will hold. Absence is the representation.
--
--   actually made / actually mixed     made_by_hand  +1.000
--   half made                          (no tag)
--   bought and arranged / and poured   made_by_hand  −1.000
--   mostly made (retired)              made_by_hand  +0.400   legacy rows only
--
-- IT STILL WEIGHTS AND NEVER ELIMINATES. Nothing below is a filter. A host who
-- said she wants everything to arrive finished is shown the most finished
-- drinks there are, at the top of a pool that still contains all of them —
-- which is the same promise db/016 makes for the table, now made for the bar.
--
-- ─────────────────────────────────────────────────────────────────────
-- CONTENTS
--
--   drink                 the pool
--   made_by_hand_weight   the ladder, written once, read by both projections
--   menu_project_facets   repointed onto three positions
--   drink_project_facets  the same three, from drink.making
--   the installs          facet tags, ingredients, occasion, slot, destination
--   the_drinks            a slot, and the occasions that have one
--   drink_card            the reading view
-- ─────────────────────────────────────────────────────────────────────


-- ── drink ────────────────────────────────────────────────────────────
--
-- Ordinary in every way the other four pools are — uuid, slug, name,
-- product_status — so the installers below need no special case. What is not
-- ordinary is the pair of text columns, and the pair is the point.

create table drink (
  id            uuid primary key default gen_random_uuid(),
  -- 'drink-01' … 'drink-23', the numbering in docs/drinks.md. Stable under a
  -- re-seed even when the wording of a line changes, which is the only
  -- property a seed key needs. Never reused.
  slug          citext not null unique check (slug ~ '^[a-z][a-z0-9-]*$'),

  -- WHAT IT IS FOR, in her words, and it is the name because it is the name:
  -- "A summer dinner or cocktail party", "A midnight breakfast". Read by
  -- ingredient_pool.label_column, so it appears in the curator's inventory and
  -- in every error message about this pool.
  name          text not null check (btrim(name) <> ''),

  -- THE COCKTAILS, IN ORDER, VERBATIM. One line, her punctuation, not
  -- decomposed — "sidecars (cognac, orange liqueur, lemon), brandy after" is
  -- two drinks and one of them has a parenthesis in it, and splitting on
  -- commas would be a guess applied to somebody's writing. db/012 makes the
  -- same refusal about a menu's dishes and for the same reason.
  cocktails     text not null
                  check (cocktails !~ '[\r\n]'
                         and length(btrim(cocktails)) between 1 and 600),

  -- THE MOCKTAIL MIRROR, VERBATIM, AND NOT NULLABLE.
  --
  -- Read the top of this file before touching this column. The guarantee is
  -- that nobody at the table is visibly not drinking, and it is kept here, by
  -- NOT NULL and a non-empty check, rather than by anybody remembering.
  --
  -- Her line, whole: "Citron pressé (fresh lemon, sugar, cold water,
  -- self-mixed at the table), sparkling water with cassis syrup". The glass,
  -- the method and the reason a person has something to do with her hands are
  -- all in that sentence, and none of them survives being summarised.
  mocktails     text not null
                  check (mocktails !~ '[\r\n]'
                         and length(btrim(mocktails)) between 1 and 600),

  season        season_band not null,
  -- Her wording, kept: "Shoulder season and fall", "Spring and summer",
  -- "Warm weather", "Winter or spring". The enum is what the engine reads;
  -- this is what a curator reads, and it says things the enum cannot.
  season_note   text not null default '',
  -- A HARD FILTER rather than a weight, exactly as db/012 defines it for a
  -- menu. docs/drinks.md names no list of drinks that are wrong out of season,
  -- so scripts/seed-drinks.mjs sets none and every drink ships false. The
  -- column exists because hot buttered rum in August is the same kind of wrong
  -- a clambake in February is, and when she names that list it is a seed
  -- change and not a migration.
  season_strict boolean not null default false,

  -- HOW MUCH MIXING — the making axis, at the bar. `making_level` from db/016
  -- rather than a third enum with the same members: this is the same ladder as
  -- the menus' and saying it twice is how two representations of one fact
  -- start to disagree. The bar's WORDS are the bar's own ("actually mixed",
  -- "bought and poured") and live in src/lib/desk/labels.ts, where words
  -- belong.
  --
  -- There is deliberately NO making_note. The founder removed the prose escape
  -- hatches from docs/menus.md in this drop, and said why: "the three values
  -- now say the same thing without a machine having to read prose to find out
  -- how a menu bends." A note column beside this one would invite the next
  -- reader to parse it.
  making        making_level not null,

  -- Internal. Never rendered to a member.
  source_note   text,
  notes         text,

  status        product_status not null default 'draft',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  -- A mirror that is the cocktail line again is not a mirror. Cheap, and it
  -- catches the one way NOT NULL can be satisfied without answering.
  constraint drink_mirror_is_not_the_cocktail
    check (btrim(lower(mocktails)) <> btrim(lower(cocktails)))
);

create trigger drink_touch before update on drink
  for each row execute function set_updated_at();

create index drink_status_idx on drink (status, name);
create index drink_season_idx on drink (season, season_strict);
create index drink_making_idx on drink (making);

comment on table drink is
  'Drinks — the fifth ingredient pool. ONE RECORD, TWO BUILDS: every row '
  'carries both the cocktails and their mocktail mirror, and the pair is '
  'enforced by NOT NULL rather than by convention, because the guarantee they '
  'exist to provide is that nobody at the table is visibly not drinking. '
  'Never split this into two rows or two tables. See db/017 and docs/drinks.md.';

comment on column drink.cocktails is
  'The cocktails in order, one line, in the author''s own punctuation. Not '
  'decomposed into rows.';

comment on column drink.mocktails is
  'THE MOCKTAIL MIRROR — the same glass, the same components, arriving at the '
  'same time. NOT NULL on purpose: a drink without its mirror is not a drink '
  'this house serves. Selected with the cocktail because it is the same row.';

comment on column drink.making is
  'How much mixing, on db/016''s making axis. Three positions as authored: '
  'actually mixed, half made, bought and poured. The same axis the menus use '
  'and the same one the application asks about.';


-- ── made_by_hand_weight ──────────────────────────────────────────────
--
-- THE LADDER, WRITTEN ONCE. Two triggers read it — menus from `cooking_level`
-- and drinks from `making_level` — and the two enums have the same members
-- because db/016 says in as many words that they are the same axis under two
-- names. Writing the case expression twice is how they would come to disagree.
--
-- NULL means NO TAG, which is the middle of the axis. See the note at the top.

create or replace function made_by_hand_weight(p_level text)
returns numeric
language sql
immutable
as $$
  select case p_level
           when 'actually_made'       then  1.000
           -- Retired by this migration's drop; no live row carries it after a
           -- re-seed. Kept at the weight it was authored with so a legacy row
           -- is not silently promoted to the top of the ladder.
           when 'mostly_made'         then  0.400
           when 'half_made'           then  null
           when 'bought_and_arranged' then -1.000
         end::numeric;
$$;

comment on function made_by_hand_weight(text) is
  'One position on db/016''s making axis, from an authored level. NULL is the '
  'middle of the ladder and means NO TAG — install_facet_tags forbids a zero '
  'weight, which is the schema saying that a claim of zero is not a claim. '
  'Read by menu_project_facets() and drink_project_facets(). See db/017.';


-- ── the menu projection, collapsed to three ──────────────────────────
--
-- Byte for byte db/016's function except that the making half now reads the
-- ladder above, and DELETES the tag where the ladder has no rung. Season is
-- untouched, from db/012.
--
-- A one-way projection still, not a sync: menu.cooking is the authored field
-- and the facet row is derived from it. Nothing writes back.

create or replace function menu_project_facets() returns trigger
language plpgsql as $$
declare
  v_weight numeric := made_by_hand_weight(new.cooking::text);
begin
  -- Season. Unchanged from db/012.
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

  -- How much is made. The middle of the ladder is an absence, so the delete is
  -- unconditional and the insert is skipped when there is no rung.
  delete from menu_facet mf
   using facet f
   where mf.menu_id = new.id
     and f.id = mf.facet_id
     and f.dimension_code = 'making'
     and f.code = 'made_by_hand'
     and v_weight is null;

  if v_weight is not null then
    insert into menu_facet (menu_id, facet_id, weight, provenance, note)
    select new.id, f.id, v_weight, 'curator', 'Projected from menu.cooking.'
      from facet f
     where f.dimension_code = 'making' and f.code = 'made_by_hand'
    on conflict (menu_id, facet_id) do update
          set weight = excluded.weight,
              note   = excluded.note;
  end if;

  return null;
end;
$$;


-- ── the drink projection ─────────────────────────────────────────────
--
-- The same two facts, from the drink's own columns. A separate function rather
-- than a shared one because a trigger function reads NEW, whose shape is the
-- table's; the part that could genuinely drift is the ladder, and that is the
-- scalar function above.

create or replace function drink_project_facets() returns trigger
language plpgsql as $$
declare
  v_weight numeric := made_by_hand_weight(new.making::text);
begin
  delete from drink_facet df
   using facet f
   where df.drink_id = new.id
     and f.id = df.facet_id
     and f.dimension_code = 'season'
     and f.code::text is distinct from new.season::text;

  insert into drink_facet (drink_id, facet_id, weight, provenance, note)
  select new.id, f.id, 1.000, 'curator', 'Projected from drink.season.'
    from facet f
   where f.dimension_code = 'season' and f.code::text = new.season::text
  on conflict (drink_id, facet_id) do nothing;

  delete from drink_facet df
   using facet f
   where df.drink_id = new.id
     and f.id = df.facet_id
     and f.dimension_code = 'making'
     and f.code = 'made_by_hand'
     and v_weight is null;

  if v_weight is not null then
    insert into drink_facet (drink_id, facet_id, weight, provenance, note)
    select new.id, f.id, v_weight, 'curator', 'Projected from drink.making.'
      from facet f
     where f.dimension_code = 'making' and f.code = 'made_by_hand'
    on conflict (drink_id, facet_id) do update
          set weight = excluded.weight,
              note   = excluded.note;
  end if;

  return null;
end;
$$;


-- ─────────────────────────────────────────────────────────────────────
-- AND THE MIDDLE OF THE LADDER ON HER SIDE OF IT
-- ─────────────────────────────────────────────────────────────────────
--
-- The collapse above has a matching consequence in the application, and it is
-- a bug if it is not made: db/016's bridge scores "half made" as an ANSWER at
-- −0.400, which was right when the ladder had four rungs and half made was the
-- lower-middle of them. With three rungs it is the CENTRE, and a centre scored
-- at −0.400 pulls a host who wants the middle toward the finished end.
--
-- Follow it through src/lib/selection/score.ts to see how wrong. Her vector
-- carries made_by_hand at −0.400; a bought-and-arranged drink is tagged −1.000
-- and scores +0.400; an actually-mixed one is tagged +1.000 and scores −0.400;
-- a half-made one carries no tag and scores 0. She asked for the middle and is
-- ranked bought first, half second, made last.
--
-- ── WHY THE FIX IS ZERO, AND WHY ZERO NEEDED PERMISSION ─────────────
--
-- Zero is the honest weight for the centre of an ordinal axis, and
-- src/lib/selection/vector.ts already does exactly the right thing with one:
-- `if (weight === 0) return` — the term is never added, so it neither pulls nor
-- dilutes the normalising mass. "No claim on this axis" is precisely what a
-- host means when she picks the middle of three.
--
-- db/016 forbade it, and its reason was good and is now too narrow. It borrowed
-- db/002's rule for TAG tables, where a zero-weight tag really is a claim
-- nobody made and the row should not exist. An ANSWER is different: the row
-- must exist, because scripts/check-facets.mjs treats an option that resolves
-- to no facet as a silent failure — she can tap it and it means nothing — and
-- that check is right. So the row stays, resolves, and says zero.
--
-- The rest of that constraint is untouched: an answer is still bounded to
-- −1..1, and a veto still has no degree.

alter table quiz_option_facet
  drop constraint quiz_option_facet_weight_signed;

alter table quiz_option_facet
  add constraint quiz_option_facet_weight_signed
    check (answer_weight >= -1 and answer_weight <= 1);

comment on column quiz_option_facet.answer_weight is
  'How strongly, and in WHICH DIRECTION, choosing this option claims the facet. '
  'Signed -1..1. A NEGATIVE weight is a preference for the other end of an '
  'ordinal axis and is scored; it is not a veto. ZERO is the middle of an '
  'ordinal axis — the row exists so the answer resolves, and buildVector adds '
  'no term for it. Vetoes are answer_polarity = ''negative'' and only '
  '''anti_preferences'' is asked that way. See db/016 and db/017.';

update quiz_option_facet
   set answer_weight = 0.000
 where quiz_field = 'how_made' and option_code = 'half_made';

-- ── record_quiz_signals, and the answer that is not a signal ─────────
--
-- Byte for byte db/016's function with one clause added. taste_signal.strength
-- is constrained to be greater than zero, and rightly: a signal of no strength
-- is not an observation. A centre answer is exactly that — she said the middle,
-- which is a statement about the axis and not evidence for either end of it —
-- so it contributes no row to her history rather than a row of zero.

create or replace function record_quiz_signals(p_quiz_response_id uuid)
returns integer
language plpgsql as $$
declare
  v_written integer;
begin
  delete from taste_signal
   where quiz_response_id = p_quiz_response_id and source = 'quiz';

  insert into taste_signal
    (customer_id, facet_id, polarity, strength, confidence, context, source,
     quiz_response_id, observed_at)
  select v.customer_id, v.facet_id,
         case
           when v.polarity = 'negative' then 'negative'::signal_polarity
           when v.answer_weight < 0     then 'negative'::signal_polarity
           else 'positive'::signal_polarity
         end,
         abs(v.answer_weight), 1.000,
         'quiz_option', 'quiz', v.quiz_response_id, v.observed_at
    from quiz_response_facet v
   where v.quiz_response_id = p_quiz_response_id
     and v.answer_weight <> 0;

  get diagnostics v_written = row_count;
  return v_written;
end;
$$;


-- ── the installs ─────────────────────────────────────────────────────
--
-- Everything below is a call. db/002 claimed adding a pool would be a table
-- plus three calls, db/009 tested it with `game`, db/012 tested it again with
-- `menu`; this is the third test and it still holds.

select install_facet_tags('drink', 'Drinks');
select rebuild_facet_tag_view();

-- typical_draw 1: one drinks programme per Revelle for a single evening. It
-- feeds nothing but the headroom arithmetic in db/002.
select install_revelle_ingredients('drink', 'Drinks', 'name', 'status', 'active', 1);
select rebuild_revelle_ingredient_view();

select install_occasion_eligibility('drink');
select rebuild_ingredient_occasion_view();

select install_slot_eligibility('drink');
select rebuild_ingredient_slot_view();

select install_world_affinity('drink');
select rebuild_ingredient_world_view();

-- The projection trigger can only be created once drink_facet exists, which is
-- install_facet_tags' doing.
create trigger drink_facets after insert or update of season, making on drink
  for each row execute function drink_project_facets();

-- Every menu re-projected from its unchanged authored value, so the four-rung
-- tags become three-rung ones. `update … set cooking = cooking` fires an
-- `update of cooking` trigger whether or not the value changed, which is
-- exactly what is wanted — the same device db/016 and db/009 both use.
update menu set cooking = cooking;


-- ── the slot ─────────────────────────────────────────────────────────
--
-- Position 37 is between the_menu (35) and the_moment (40) and collides with
-- nothing. Adding a slot is an insert, which is the whole argument db/009
-- makes for slot_kind being data.
--
-- excluded_by is left NULL. See the argument at the top of this file: there is
-- no answer in the application that removes the bar, and `drinks_only` is the
-- answer that proves the slot has to be separate from the menu.

insert into slot_kind (code, label, description, section, per_guest, position) values
  ('the_drinks', 'The drinks',
   'What is poured, all evening, and the mocktail mirror that arrives with it. '
   'One programme, chosen whole — the cocktails and their mirrors are one '
   'record, so nobody at the table is visibly not drinking. See db/017.',
   'details', false, 37);

-- ── which occasions have a bar ───────────────────────────────────────
--
-- The judgement, stated so it can be argued with, and it is db/012's for the
-- menu with one difference. An evening with people in it has something to
-- drink, so the one-evening occasions require a programme — docs/drinks.md
-- says every destination now has a bar precisely so that this can be required
-- without producing a gap. A weekend or a getaway runs for days and the bar is
-- per-day and desirable rather than constitutive, so it is optional and
-- multiplied by occasion_shape.days. 'other' asks and does not insist, because
-- nobody knows yet what it is.

insert into occasion_slot
  (occasion, slot_code, pool, min_count, max_count, required, per_day, position, note)
values
  ('dinner_party',  'the_drinks', 'drink', 1, 1, true,  false, 17,
   'The long dinner has a bar for the length of it, and a mirror for whoever '
   'is not drinking.'),
  ('birthday',      'the_drinks', 'drink', 1, 1, true,  false, 17, ''),
  ('anniversary',   'the_drinks', 'drink', 1, 1, true,  false, 17, ''),
  ('holiday',       'the_drinks', 'drink', 1, 1, true,  false, 17, ''),
  ('no_reason',     'the_drinks', 'drink', 1, 1, true,  false, 17, ''),
  ('other',         'the_drinks', 'drink', 1, 1, false, false, 17,
   'Shape unknown until a human reads her words; a bar is offered, not '
   'insisted on.'),
  ('girls_weekend', 'the_drinks', 'drink', 1, 1, false, true,  27,
   'One a day, and optional: some of those nights are somebody else''s bar.'),
  ('getaway',       'the_drinks', 'drink', 1, 1, false, true,  17,
   'The occasion that most resists being scheduled. A bar per day, nothing '
   'insisted on.'),
  ('bridal',        'the_drinks', 'drink', 1, 1, false, true,  27, '');


-- ── the reading view ─────────────────────────────────────────────────
--
-- One row per drink with everything a curator or the engine reads, so that
-- neither writes the same five joins again. Hand-tagged facets only — the two
-- projected dimensions are already columns here and repeating them would be
-- the same fact twice. Byte for byte menu_card's shape, with the pair.

create view drink_card as
select d.id,
       d.slug,
       d.name,
       d.cocktails,
       d.mocktails,
       d.season,
       d.season_note,
       d.season_strict,
       d.making,
       d.status,
       d.created_at,
       d.updated_at,
       -- The destinations it was written for. Empty means general.
       coalesce(w.worlds, '{}') as world_slugs,
       coalesce(o.occasions, '{}') as native_occasions,
       coalesce(t.tags, '{}') as tags
  from drink d
  left join lateral (
    select array_agg(wd.slug::text order by wd.slug) as worlds
      from drink_world dw
      join world wd on wd.id = dw.world_id
     where dw.drink_id = d.id and not dw.forbidden
  ) w on true
  left join lateral (
    select array_agg(do_.occasion::text order by do_.occasion) as occasions
      from drink_occasion do_
     where do_.drink_id = d.id and do_.fit = 'native'
  ) o on true
  left join lateral (
    select array_agg(f.label order by f.label) as tags
      from drink_facet df
      join facet f on f.id = df.facet_id
     where df.drink_id = d.id
       and f.dimension_code not in ('season', 'cooking', 'making')
  ) t on true;

comment on view drink_card is
  'A drink with both its builds, its destinations, occasions and hand-applied '
  'tags. Season and making are columns, not tags, because they are projected '
  'the other way.';

-- ─────────────────────────────────────────────────────────────────────
-- WHAT THIS DELIBERATELY DOES NOT DO
--
--   · NO RECIPES, and no more of one than the author wrote. "Sidecars (cognac,
--     orange liqueur, lemon)" is hers and is a line, not a method. Read the top
--     of db/012 before adding a quantity, a technique or a glassware column;
--     the glass is already in her sentence where it belongs.
--   · No `is_mocktail`, no mirror table, no parent key. Read the top of THIS
--     file. Every one of them is a way to have a cocktail without its mirror.
--   · No `making_note`. The escape hatches were removed from the catalogue in
--     this drop, deliberately, so that nothing has to read prose to find out
--     how a drink bends. Three values say it.
--   · No price. docs/drinks.md carries no cost, and inventing one per head
--     would be a number nobody authored driving a budget nobody checked —
--     db/012's refusal, unchanged.
--   · No alcohol facet, and no exclusion that removes the bar. A host with
--     people who do not drink is served by the mirror, which is the whole
--     reason it exists.
--   · No content. Every drink is CONTENT and lives in docs/drinks.md, moved in
--     by scripts/seed-drinks.mjs — the same rule db/012 and
--     scripts/seed-destinations.mjs both state: content in a migration can
--     only be corrected by another migration.
-- ─────────────────────────────────────────────────────────────────────
