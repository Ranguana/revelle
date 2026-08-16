-- Revelle Société — WHAT A DISH IS FOR
--
-- Applied by scripts/migrate.mjs after 022, inside one transaction together
-- with its schema_migrations ledger row. Same rule as every file before it:
-- nothing here may be a statement that refuses to run in a transaction.
--
-- New file, never applied anywhere, so no SENTINELS entry in
-- scripts/migrate.mjs.
--
-- ─────────────────────────────────────────────────────────────────────
-- THE FOUNDER'S OBSERVATION, WHICH IS EXACTLY RIGHT
--
-- docs/dishes.md already encodes three of the four axes STRUCTURALLY, and
-- nobody had to write a field for any of them:
--
--     ## Havana                      the destination
--     ### Mains                      the course
--     - Oxtail stew · M              the making level
--     - Corn fritters · M (summer)   the season
--
-- The only thing a dish does not say is WHAT IT IS FOR — and that is precisely
-- what composition most needs. A menu says it in its own name ("Brunch, the
-- morning after"), and a menu is no longer what the engine picks.
--
-- So the line gains a fourth position:
--
--     - <name> · <making> · <season> · <what it is for>
--     - Deviled eggs with paprika · M ·  · C
--     - Roast duck with orange sauce · M · fall · D
--     - Quiche lorraine · H ·  · BR
--
-- AN EMPTY FIELD MEANS ANYWHERE, and 650 lines are currently three fields long
-- and therefore empty in the fourth. That is not a migration problem: no claims
-- at all means eligible everywhere, which is claimEligibility()'s own default
-- (src/lib/selection/occasion.ts) and db/019's rule for destinations. The pool
-- works before she tags a single dish, and every dish she tags becomes MORE
-- precise rather than the untagged ones becoming wrong.
--
-- ─────────────────────────────────────────────────────────────────────
-- THE VOCABULARY, DERIVED FROM HER OWN CATALOGUE
--
-- Not invented. The "what it's for" lines across docs/menus.md (39) and
-- docs/drinks.md (25) are the real vocabulary, and they cluster into five
-- shapes and no more. Every one of her sixty-four lines lands in one of these:
--
--   long_dinner  D    "A long summer dinner", "A long dinner party", "A big
--                     outdoor dinner", "A cabin dinner", "A fire-lit dinner",
--                     "A quiet dinner", "A loft dinner", "A long porch dinner",
--                     "A dinner after a day outside", "A big family-style
--                     dinner", "A long dinner in the cold months", and the
--                     dressed-up ones below.
--   cocktails    C    "A cocktail party", "Drinks in the garden", "Golden-hour
--                     drinks, standing", "Drinks in the cold months, standing".
--   brunch       BR   "Brunch, the morning after", "A late, long brunch", "A
--                     slow foggy-morning brunch", "A late brunch".
--   lunch        L    "A rainy-day lunch", "A long lunch by the water", "A
--                     beach or pool lunch", "A lake-day lunch", "A midday
--                     lunch, boots still on", "A long lunch on a cold bright
--                     day", "A long lunch outdoors".
--   late_supper  LS   "A late supper after a show", "A late supper after
--                     dancing", "A midnight supper", "A midnight breakfast".
--
-- THREE THINGS FOLDED IN, AND THE ARGUMENT FOR EACH, because the set is only
-- useful if it stays small:
--
--   "A dressed-up dinner party", "A formal dinner party", "A steakhouse
--   birthday dinner" ARE NOT A SIXTH SHAPE. They are `long_dinner` at a
--   different register, and register is already a taste axis — db/007's voice,
--   db/002's formality facets. A shape says how the food is served; how dressed
--   the room is says nothing about whether there is a main course.
--
--   "A beach or pool lunch" IS NOT A SIXTH SHAPE. The beach is the ROOM, and
--   db/020 already models the room as affordances the venue provides. Making it
--   a meal shape would put one fact in two places, which is the thing db/002
--   warns about on every page.
--
--   "A midnight breakfast" IS `late_supper`. It is a different plate and the
--   same moment, and WESTHAMPTON's own exemplar in db/012 refuses to separate
--   them: "Cold roast chicken. Dinner, or three in the morning." A shape is
--   when and how, not what.
--
-- ── AND ONLY TWO OF THE FIVE ARE REACHABLE TODAY ────────────────────
--
-- This is the honest half and it must not be buried. The engine can only ask a
-- dish "are you right for THIS evening" if it knows what the evening is, and
-- src/lib/quiz.ts asks a host her occasion, her room, her guest count, her
-- budget, her people and her food plan — and never the time of day. So:
--
--   food_plan = 'standing'   ->  cocktails
--   anything else            ->  long_dinner
--
-- and `brunch`, `lunch` and `late_supper` are shapes nothing can currently
-- select. A dish tagged only `BR` is therefore invisible to the engine until a
-- question exists for it — which is CORRECT (a brunch dish does not belong at a
-- long dinner) and is a work order rather than a bug. The question it is
-- waiting for is one line in src/lib/quiz.ts, and the derivation above lives in
-- src/lib/selection/table.ts, in one function, so that adding it is a change in
-- one place.
--
-- ─────────────────────────────────────────────────────────────────────
-- CONTENTS
--
--   meal_shape        what a table IS. an enum: closed, and hers
--   dish_meal         which shapes a dish claims. no rows means all of them
--   dish_meal_card    the read the desk and the seeder both take
-- ─────────────────────────────────────────────────────────────────────


-- ── meal_shape ───────────────────────────────────────────────────────
--
-- An enum by 001's rule: closed by the shape of a day rather than by taste.
-- Declared in the order a day runs, so `order by meal` means something and
-- means nothing more.
--
-- A sibling of `game_shape` (db/010) and `occasion_shape` (db/009), and
-- deliberately NOT a value of `occasion_type`: an occasion is why she is having
-- people over — a birthday, an anniversary — and a meal shape is what the table
-- is. A birthday can be a brunch and an anniversary can be a late supper, and
-- collapsing the two would make one of those unsayable.

create type meal_shape as enum (
  'brunch',
  'lunch',
  'cocktails',
  'long_dinner',
  'late_supper'
);

comment on type meal_shape is
  'What a table IS — brunch, lunch, standing drinks, a long dinner, a late '
  'supper. Derived from the "what it''s for" lines the founder wrote across '
  'docs/menus.md and docs/drinks.md, and NOT the same axis as occasion_type: an '
  'occasion is why, a meal shape is what. See db/023.';


-- ── dish_meal ────────────────────────────────────────────────────────
--
-- The same shape and the same rule as `dish_occasion`, `dish_slot` and
-- `dish_world`: NO ROWS MEANS EVERY SHAPE, and any row makes the set a
-- whitelist. That rule is written once, in claimEligibility()
-- (src/lib/selection/occasion.ts), and nothing here re-implements it — db/009
-- says at length that writing it a second time in SQL is the disease db/002
-- exists to cure, and db/019 refused again.
--
-- A separate table rather than an array column because a claim is a row
-- everywhere else in this schema, because a curator's note belongs beside the
-- claim it explains, and because `where meal = 'cocktails'` is the read the
-- desk takes and an array makes it a scan.
--
-- NO `forbidden` HALF, deliberately. The other three axes have one because
-- there are real vetoes to express — a game that must not be played at a
-- funeral, a menu that cannot be served at the Dolomites. "This dish is
-- forbidden at brunch" is not a sentence anybody has needed to say, and an
-- unused state is a state that will eventually be used for something else.
-- Adding it later is `alter table … add column fit occasion_fit`.

create table dish_meal (
  dish_id    uuid not null references dish(id) on delete cascade,
  meal       meal_shape not null,
  -- A curator's reason, when there is one. The seeder writes the founder's own
  -- letter code so the record says where the claim came from.
  note       text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  primary key (dish_id, meal)
);

create trigger dish_meal_touch before update on dish_meal
  for each row execute function set_updated_at();

create index dish_meal_meal_idx on dish_meal (meal);

comment on table dish_meal is
  'Which shapes of table a dish claims. NO ROWS MEANS EVERY SHAPE — the same '
  'default db/019 gives an untagged destination and db/009 gives an untagged '
  'occasion, and the reason 650 authored lines that carry no fourth field are '
  'correct rather than incomplete. See db/023.';


-- ── the read both the desk and the engine take ───────────────────────
--
-- One row per dish with its shapes as an array, so that neither writes the
-- aggregate again. `dish_card` is left alone: it is db/021's view and adding a
-- column to it would mean dropping and recreating it, which takes out anything
-- that has come to depend on it for the sake of a column position.

create view dish_meal_card as
select d.id,
       coalesce(
         (select array_agg(dm.meal::text order by dm.meal)
            from dish_meal dm where dm.dish_id = d.id),
         '{}') as meals
  from dish d;

comment on view dish_meal_card is
  'Every dish with the meal shapes it claims, empty meaning all of them.';


-- ─────────────────────────────────────────────────────────────────────
-- WHAT THIS DELIBERATELY DOES NOT DO
--
--   · NO BACKFILL. Not one of the 650 authored lines carries a fourth field
--     yet, and inventing one per dish would be six hundred judgements nobody
--     made. Empty means anywhere and anywhere is true.
--
--   · NO `meal_shape` ON A MENU OR A DRINK. Both already say what they are for
--     in a `name` column, in her own words, and that sentence is richer than
--     any enum — "A long Sunday afternoon into dinner" is two shapes and a
--     mood. A menu is now an EXEMPLAR (db/022) rather than something selected,
--     so nothing needs to match it mechanically. A drink programme is a real
--     candidate and could earn one; it is not added here because the founder
--     tagged dishes and not drinks, and a column the catalogue does not fill is
--     a column that will be filled by a guess.
--
--   · NO `forbidden` STATE. See the note on dish_meal.
--
--   · NO QUESTION IN THE QUIZ. Three of the five shapes are unreachable until
--     the application asks about the time of day, and adding that question is a
--     product decision with a facet check behind it (scripts/check-facets.mjs
--     would be right to fail an option that resolves to nothing). The
--     derivation from the answers that DO exist is one function in
--     src/lib/selection/table.ts.
-- ─────────────────────────────────────────────────────────────────────
