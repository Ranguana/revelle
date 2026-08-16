-- Revelle Société — THE TABLE, COMPOSED
--
-- Applied by scripts/migrate.mjs after 021, inside one transaction together
-- with its schema_migrations ledger row. Same rule as every file before it:
-- nothing here may be a statement that refuses to run in a transaction.
--
-- New file, never applied anywhere, so no SENTINELS entry in
-- scripts/migrate.mjs.
--
-- ─────────────────────────────────────────────────────────────────────
-- THE DECISION THIS FILE EXISTS TO CARRY OUT
--
-- The founder, on the dish pool db/021 imports:
--
--     "They have to be mix and match with all this data."
--
-- and, settling what that means for the menus:
--
--     "Set menus cannot be the model."
--
-- So THE TABLE IS COMPOSED, ALWAYS. An appetizer, a main and a dessert, each
-- drawn from the dish pool, each native to the destination, assembled at
-- selection time. Not a fallback for when no authored menu fits — the
-- mechanism.
--
-- That is a reversal of db/012's second product decision, and it is worth being
-- exact about which half is reversed and which half is not:
--
--   REVERSED. "The pool is menus, the unit of selection is one whole menu."
--             The unit of selection is now the course, and three of them make a
--             table. db/012 argued its position on the evidence it had:
--             thirty-six authored evenings and no dish pool at all. Six hundred
--             authored dishes is new evidence, and the argument was always
--             about coherence rather than about the shape of a row.
--
--   NOT REVERSED. "Splitting her list on commas would be a guess applied to
--             somebody's writing." `menu.dishes` is still one authored line,
--             nothing parses it, and NO PART OF THIS FILE MATCHES THE PROSE IN
--             docs/menus.md TO A DISH ROW. The thirty-nine rows survive
--             untouched. What they are FOR changes, and that is argued below.
--
-- ─────────────────────────────────────────────────────────────────────
-- WHAT MAKES A COMPOSITION DEFENSIBLE, AND WHAT IT COSTS
--
-- A composed menu HAS NO AUTHOR. Everything else in this system is authored —
-- the destinations, the voices, the menus, the drinks, the games — and that is
-- not decoration, it is the product. So the rules that stand in for an author
-- have to be real, they have to be stated, and the gap between them and a
-- person has to be named rather than glossed.
--
-- THE FOUR RULES, and where each is enforced:
--
--   1. ONE DESTINATION. All three courses `native` to it. Already true and not
--      re-implemented here: worldEligibility() in src/lib/selection/occasion.ts
--      gates every pick against the one destination the Revelle is in, and
--      db/021's seeder writes a native claim per authored destination heading.
--
--   2. THE SEASONS MUST AGREE. A dish bound to summer cannot sit beside one
--      bound to winter. A year-round dish goes anywhere. Enforced in
--      fillSlots() as a running commitment on the search state, because it is a
--      property of the SET and not of any one dish — the same class of rule as
--      the budget and the evening's blocks, enforced in the same place for the
--      same reason.
--
--      WHAT THIS CANNOT DO, said plainly: it makes the courses agree WITH EACH
--      OTHER and cannot make them agree with the calendar, because the
--      application never asks when the party is. There is no date anywhere in
--      src/lib/quiz.ts. `dish.season_strict` is the column already waiting for
--      that question; until it is asked, "a clambake in February" is a sentence
--      the engine cannot form an opinion about.
--
--   3. THE TABLE IS ONE RUNG OF THE MAKING AXIS. She answers `how_made` once,
--      about the whole evening, and a table that is two-thirds bought and
--      one-third actually made is not an answer to that question — it is the
--      mean of three answers to it.
--
--      AND THIS IS NOT db/012'S "NEVER A FILTER" BEING BROKEN. db/012 and
--      db/016 both forbid her answer ELIMINATING an ingredient, and it still
--      does not: every dish stays in the pool at every rung and is scored by
--      weight exactly as before. What is constrained is the COMBINATION. The
--      rule is not "she wants bought, so this made dish is gone"; it is "these
--      three are not one table". A dish refused here is placed happily in the
--      next composition whose table sits at its rung.
--
--      THE FALLBACK, AND WHY IT LEANS THE WAY IT DOES. Nine of the thirteen
--      destinations have no main course that can be bought (db/021 counts
--      them), so a strict rung would hand a host who wants no work a table with
--      no main in it. A missing main is worse than a main one rung off, so when
--      a course has nothing at the table's rung the rung STEPS for that course:
--      toward `actually_made` first, and only then toward
--      `bought_and_arranged`.
--
--      Leaning toward made is the founder's instinct and it has a reason under
--      it: THE CATALOGUE DOCUMENTS HOW MADE THINGS BEND TOWARD BOUGHT AND NEVER
--      THE REVERSE. Every escape hatch docs/menus.md ever carried ran one way —
--      "lobster meat can be bought picked", "chicken can be bought rotisserie",
--      "good jarred fish soup exists" — and db/012 says outright that a member
--      can cook or she can order. A host handed one course more made than she
--      asked for can order it. A host handed something bought when she wanted
--      to cook cannot un-buy it.
--
--   4. NOTHING REPEATS. Already true and not re-implemented: the beam search
--      keys every pick as `pool:id` in one `used` set per candidate Revelle, so
--      a dish cannot appear twice on a table and cannot reappear on day three
--      of a weekend.
--
-- ── WHAT AN AUTHORED MENU IS NOW ────────────────────────────────────
--
-- The founder, deciding it:
--
--     "Set menus cannot be the model."
--
-- So `the_menu` STOPS BEING A SLOT. Its occasion_slot rows are removed at the
-- bottom of this file and the three courses are not an alternative to anything
-- — they are the table. The pool, the thirty-nine rows, the seeder, the desk
-- screen and `slot_kind.the_menu` itself all stay exactly as they are; nothing
-- is deleted and a Revelle already issued with a menu in it is unaffected. What
-- changes is only what the ENGINE does with them, and the answer is: nothing.
--
-- ── AN AUTHORED MENU IS AN EXEMPLAR ─────────────────────────────────
--
-- It is a known-good arrangement, written by the founder, that a curator reads
-- to judge whether a composed table is any good. It is evidence about what a
-- good table looks like at a destination, in a season, at a rung. It is not a
-- candidate and it is not a template.
--
-- Four things it could have become were considered. Three are refused here and
-- the reasons are the useful part:
--
--   A CONSTRAINT SOURCE — mine the thirty-nine for which dishes belong beside
--     which, so composition inherits her judgement. THIS IS THE ONE WORTH
--     WANTING AND IT IS NOT AVAILABLE, for a reason that is structural rather
--     than a matter of effort: getting a pairing out of a menu means matching
--     her prose to dish rows, and that is the decomposition db/012 refused and
--     the founder has refused again. It is not fastidiousness. Her lines do not
--     decompose:
--
--       "chilled langoustines with garlic mayonnaise, champagne"  is two things
--         and one of them is a drink;
--       "caviar with blini and crème fraîche"                     is one thing
--         with two commas in it;
--       "corn with herb butter", "wild rice with almonds"         are not in
--         the dish pool at all, and never were;
--       "Cold potato-leek soup"                                   is nearly but
--         not exactly the dish "Cold leek and potato soup".
--
--     A fuzzy matcher over those produces pairings that are partly hers and
--     partly invented, with no way afterwards to tell which is which — and a
--     wrong pairing is worse than no pairing, because it wears her authority.
--     SO THE PAIRING JUDGEMENT IS GIVEN UP RATHER THAN APPROXIMATED. What it
--     would take to get it back is written at the bottom of WHAT COMPOSITION
--     LOSES, and it is authoring: a human with both documents open, one pair at
--     a time. That is a real piece of work somebody may choose to do. It is not
--     something a parser may guess at.
--
--   A PRESET A CURATOR APPLIES AT THE DESK — a human choosing a whole authored
--     menu over the composed table when reviewing a proposal. Refused HERE
--     rather than refused outright: it is a good idea and it is a desk feature,
--     not an engine one. Nothing in this migration prevents it and the pool it
--     needs is untouched.
--
--   THE SELECTION PRIMITIVE — what it was until this file. Refused by the
--     founder, and the arithmetic is why: thirty-nine menus over thirteen
--     destinations is two or three evenings each, and db/002's assemblage
--     fingerprint burns through those in three customers. Six hundred dishes at
--     three courses is C(600,3) ≈ 3.6 × 10^7 before scoping. The set menu was
--     never going to be the supply.
--
-- ── AND THE ONE PIECE OF HER JUDGEMENT THAT SURVIVES WITHOUT PARSING ─
--
-- A menu row carries four facts as COLUMNS, and no prose has to be read to get
-- at any of them: the destination it claims, its season, its rung on the making
-- axis, and what it is FOR. Menu 3 is Westhampton / autumn / actually made, and
-- that is a real statement — "at Westhampton, in autumn, a made table is
-- right" — extracted with zero guessing.
--
-- Nothing in this file consumes it, deliberately: a prior over the table's rung
-- would be a second, quiet influence on a decision her `how_made` answer is
-- supposed to own. It is written down because the fourth fact is the valuable
-- one and it is the next thing worth authoring. "Brunch, the morning after",
-- "A rainy-day lunch", "A midnight breakfast after a night out", "A cocktail
-- party", "Drinks in the cold months, standing" — those are the SHAPES OF AN
-- EVENING, and the composer built here knows exactly one shape. See the end of
-- WHAT COMPOSITION LOSES.
--
-- ── WHAT COMPOSITION LOSES. WRITE THIS DOWN. ────────────────────────
--
-- The rules above protect against an incoherent SET. They do not and cannot
-- protect against a table that is merely bad, and these are the specific things
-- an author does that no rule here does:
--
--   · SEQUENCE. Her menus are "dishes in order". A composition knows that a
--     dessert follows a main and knows nothing about whether THIS dessert
--     follows THAT main.
--   · RICHNESS. Nothing in the catalogue models weight, fat, or how much of an
--     evening a dish already is. Lobster thermidor, then beef wellington, then
--     baked alaska is three of Westhampton's best dishes at the right rung in
--     the right season, and it is a table nobody could finish. THERE IS NO
--     ADJACENCY MODEL ANYWHERE IN THIS SYSTEM. The destination scoping is the
--     only "these go together" signal that exists, and it is coarse: it says
--     they belong to one house, not that they belong on one table.
--   · REPETITION OF MATERIAL. Two courses can both be built on cream, or
--     tomatoes, or fried things, and nothing notices. `similarityDiscount` in
--     score.ts compares FACET TAGS, and a dish carries season and making and
--     whatever a curator tagged by hand — which is not what a plate is made of.
--   · THE NAME. A menu's name is what it is FOR — "A long summer dinner", "A
--     dressed-up dinner party" — and it is authored. A composed table has no
--     such sentence and src/lib/selection/member.ts prints the three dishes.
--     That is honest and it is less.
--
--   · THE SHAPE OF THE EVENING. This composer knows exactly one shape —
--     appetizer, main, dessert — so it can only ever produce dinner. Her
--     thirty-nine include "Brunch, the morning after", "A rainy-day lunch", "A
--     midnight breakfast after a night out", "A cocktail party" and "Drinks in
--     the cold months, standing". Those evenings STOP BEING PRODUCED the moment
--     the set menu stops being selected, and `no_seated_meal` recovers exactly
--     one of them (the standing party, as appetizers only). That is the single
--     largest thing this migration gives up and it is not a subtlety: it is
--     five kinds of evening reduced to one.
--
-- ── SO: GIVEN UP, OR REPLACED? BOTH, AND HERE IS WHICH ──────────────
--
-- GIVEN UP for now: sequence, richness, repetition of material, and the name.
-- Nothing in this file replaces them and nothing pretends to.
--
-- REPLACEABLE, and each replacement is AUTHORING rather than inference. Written
-- out because "we will get to it" is how a loss becomes permanent:
--
--   `dish_pairing`   (dish_id, other_dish_id, fit) — "these go together",
--       "never these two". It is the adjacency model the system does not have,
--       and the only way to get it is a human with docs/menus.md and the dish
--       list open, one pair at a time. THAT IS THE HONEST VERSION OF MINING HER
--       MENUS: the decomposition is done by the person who wrote them, not by a
--       matcher guessing at her punctuation. Thirty-nine menus is an afternoon.
--
--   `table_shape`    (code, label, {course -> how many}) — "a cocktail party is
--       six appetizers and nothing else", "brunch is two courses". Read off her
--       menu NAMES, which are a column and need no parsing, and authored into a
--       closed list the way `occasion_shape` already is. This is what turns one
--       composer into five kinds of evening.
--
--   a `richness` facet — the axis nobody has authored. If composed tables start
--       arriving that a curator rejects for being too much, that IS the next
--       dimension in db/002's vocabulary, and it should be tagged by hand on
--       six hundred dishes rather than inferred from a name.
--
-- Neither table is created here. Creating an empty one would be machinery with
-- nothing in it, and db/016's own test applies: a term earns its place when
-- somebody can answer in it.
--
-- THE MITIGATION THAT EXISTS TODAY IS THE CURATOR. Every proposal is approved by
-- a human before it is delivered (src/lib/revelle/proposals.ts), and a composed
-- table is exactly the kind of thing that approval step exists for. The
-- exemplars are one screen away at /desk/menus, and /desk/dishes shows the
-- authored menus for a destination beside the dishes it is filtered to, so the
-- comparison a curator needs is in front of her rather than in a document.
--
-- ─────────────────────────────────────────────────────────────────────
-- CONTENTS
--
--   no_seated_meal          the exclusion a standing party carries
--   slot_kind.coherence_group   which slots have to agree with each other
--   the three courses       slot_kind rows
--   dish_project_slot       course -> a native dish_slot claim
--   occasion_slot           which occasions set a table, and over how many days
--   the_menu retired        the slot rows removed; the pool untouched
--   typical_draw            the headroom arithmetic, told the truth
-- ─────────────────────────────────────────────────────────────────────


-- ── the exclusion a standing party carries ───────────────────────────
--
-- docs/quiz `food_plan` already has the answer: "Things to pick at, standing
-- up — a cocktail party, not a dinner." A cocktail party is appetizers and no
-- main and no dessert, which is a fact about her evening and therefore a
-- `slot_exclusion` (db/014) rather than a weight.
--
-- WHY ONE NEW CODE AND NOT `no_food` ON EVERY COURSE. `slot_kind.excluded_by`
-- holds ONE code, and the main course needs to disappear for three different
-- answers: standing, eating out, and drinks only. So the code names the fact
-- those three share — she is not sitting down to courses — and the two answers
-- that already carry `no_food` carry this as well. The appetizer keeps
-- `no_food`, because a standing party is exactly a table of appetizers.
--
-- db/014's rule is unchanged and is the reason this is an answer and not an
-- inference: "Inferring 'no_food' from a room would silently delete a
-- deliverable she never said she did not want." Nothing here reads
-- `environment`.

insert into slot_exclusion (code, label, description, question) values
  ('no_seated_meal', 'Not a seated meal',
   'She is not sitting down to courses. A cocktail party is a table of things '
   'to pick at; a booked restaurant and a drinks-only evening are not courses '
   'this house sets either. Removes the main and the dessert and leaves the '
   'appetizers, which is what a standing party actually is. NOT inferred from '
   'the room — see db/014.',
   'Are people sitting down to courses?');

insert into quiz_option_exclusion (quiz_field, option_code, exclusion_code, note) values
  ('food_plan', 'standing', 'no_seated_meal',
   'A cocktail party, in her own words. The appetizers stay and are the whole '
   'table; the main and the dessert were never part of this evening.'),
  ('food_plan', 'eating_out', 'no_seated_meal',
   'Somebody else is setting the courses. She already carries no_food, which '
   'removes the authored menu; this removes the composed one, which is the '
   'same fact said to the other mechanism.'),
  ('food_plan', 'drinks_only', 'no_seated_meal',
   'Nothing that needs a plate. Same fact as her no_food, said to the '
   'composition.');


-- ── one column on slot_kind ──────────────────────────────────────────
--
-- DATA about slots rather than a rule in code, which is the whole argument
-- db/009 makes for slot_kind being a table. A fourth course, or a second thing
-- that has to agree with itself, is an insert.

alter table slot_kind
  add column coherence_group text
    check (coherence_group is null
           or coherence_group ~ '^[a-z][a-z0-9_]*$');

comment on column slot_kind.coherence_group is
  'Slots that have to AGREE WITH EACH OTHER, not merely each agree with her. '
  'Every slot in one group must land on one season and one rung of the making '
  'axis — the rule is in fillSlots(), src/lib/selection/fill.ts, carried on the '
  'search state like the budget and the evening''s blocks, because it is a '
  'property of the SET. Null means the slot answers to nobody. See db/022.';


-- ── the three courses ────────────────────────────────────────────────
--
-- Positions 31–33, between table_object (30) and the_menu (35), so that a
-- Revelle reads: the table, then what is eaten at it. They are all in the
-- `details` section, which is THE TABLE as she reads it (src/lib/portal/
-- sections.ts) and is where db/012 and db/017 already put the menu and the bar.
--
-- All three share `coherence_group = 'the_table'`, which is the entire
-- mechanism for rules 2 and 3 above.

insert into slot_kind
  (code, label, description, section, per_guest, position,
   excluded_by, coherence_group)
values
  ('the_appetizer', 'The first course',
   'What is eaten first, drawn from the dish pool and native to the '
   'destination. One third of the COMPOSED table that replaced the set menu — '
   'see db/022.',
   'details', false, 31, 'no_food', 'the_table'),

  ('the_main', 'The main course',
   'The middle of the table. Removed for a standing party: a cocktail party is '
   'appetizers, and a main course is the thing that makes an evening a dinner.',
   'details', false, 32, 'no_seated_meal', 'the_table'),

  ('the_dessert', 'The last course',
   'The end of the table, and removed for a standing party for the same reason '
   'the main is.',
   'details', false, 33, 'no_seated_meal', 'the_table');


-- ── course becomes a slot claim ──────────────────────────────────────
--
-- THE COURSE COLUMN IS ALREADY THE ANSWER, so nothing new is invented: a dish's
-- course is projected into `dish_slot` as a NATIVE claim, and claimEligibility()
-- does the rest — an ingredient with any native slot claim is eligible at those
-- slots and no others. An appetizer cannot be placed as a main because it
-- claims the first course and claiming one is opting into a whitelist.
--
-- A ONE-WAY PROJECTION, NOT A SYNC, exactly as the facets are: `dish.course` is
-- the authored field and the `dish_slot` row is derived from it. Nothing writes
-- back, and a curator changes the course rather than editing a slot claim.
--
-- The delete is scoped to the three course slots by name. A dish that a curator
-- has ALSO claimed for some other slot by hand keeps that claim — this function
-- owns the courses and nothing else, which is the same care menu_project_facets
-- takes with the dimensions it owns.

create or replace function dish_project_slot() returns trigger
language plpgsql as $$
declare
  v_slot text := case new.course
                   when 'appetizer' then 'the_appetizer'
                   when 'main'      then 'the_main'
                   when 'dessert'   then 'the_dessert'
                 end;
begin
  delete from dish_slot ds
   where ds.dish_id = new.id
     and ds.slot_code in ('the_appetizer', 'the_main', 'the_dessert')
     and ds.slot_code <> v_slot;

  insert into dish_slot (dish_id, slot_code, fit, note)
  values (new.id, v_slot, 'native', 'Projected from dish.course. db/022.')
  on conflict (dish_id, slot_code) do nothing;

  return null;
end;
$$;

comment on function dish_project_slot() is
  'A dish''s course, projected one way into dish_slot as a native claim, so '
  'that the eligibility rule already written once (claimEligibility, '
  'src/lib/selection/occasion.ts) keeps an appetizer out of the main course '
  'with no new mechanism. See db/022.';

create trigger dish_slot_claim after insert or update of course on dish
  for each row execute function dish_project_slot();

-- Every dish projected from its unchanged authored value. `update … set course
-- = course` fires an `update of course` trigger whether or not the value
-- changed, which is exactly what is wanted — db/009's device, used again by
-- db/016 and db/017.
update dish set course = course;


-- ── which occasions set a composed table ─────────────────────────────
--
-- db/012's judgement for the menu, unchanged, applied to the courses: an
-- occasion built around a TABLE is broken without one, so the one-evening
-- occasions require all three courses; a weekend or a getaway runs for days,
-- some of those meals are eaten out, so the table is per-day and optional.
--
-- REQUIRED IS DOING REAL WORK HERE and is not ceremony. A non-required slot is
-- skipped whenever nothing in it scores above zero, and a dish carries two or
-- three facets against a vector built from fifty — so left optional, the search
-- would quietly hand a host a table with an appetizer and a dessert and no main
-- in it. A table with two courses is not a table. That is the failure this word
-- prevents.
--
-- The positions are 11, 12, 13 — where db/012 put the menu at 15, which no
-- longer has rows.

insert into occasion_slot
  (occasion, slot_code, pool, min_count, max_count, required, per_day, position, note)
values
  ('dinner_party',  'the_appetizer', 'dish', 1, 1, true,  false, 11,
   'The long dinner IS the table. When she has already been sent every menu '
   'written for this destination, this is how she still gets a dinner.'),
  ('dinner_party',  'the_main',      'dish', 1, 1, true,  false, 12, ''),
  ('dinner_party',  'the_dessert',   'dish', 1, 1, true,  false, 13, ''),

  ('birthday',      'the_appetizer', 'dish', 1, 1, true,  false, 11, ''),
  ('birthday',      'the_main',      'dish', 1, 1, true,  false, 12, ''),
  ('birthday',      'the_dessert',   'dish', 1, 1, true,  false, 13, ''),

  ('anniversary',   'the_appetizer', 'dish', 1, 1, true,  false, 11, ''),
  ('anniversary',   'the_main',      'dish', 1, 1, true,  false, 12, ''),
  ('anniversary',   'the_dessert',   'dish', 1, 1, true,  false, 13, ''),

  ('holiday',       'the_appetizer', 'dish', 1, 1, true,  false, 11, ''),
  ('holiday',       'the_main',      'dish', 1, 1, true,  false, 12, ''),
  ('holiday',       'the_dessert',   'dish', 1, 1, true,  false, 13, ''),

  ('no_reason',     'the_appetizer', 'dish', 1, 1, true,  false, 11, ''),
  ('no_reason',     'the_main',      'dish', 1, 1, true,  false, 12, ''),
  ('no_reason',     'the_dessert',   'dish', 1, 1, true,  false, 13, ''),

  ('other',         'the_appetizer', 'dish', 1, 1, false, false, 11,
   'Shape unknown until a human reads her words; a table is offered, not '
   'insisted on.'),
  ('other',         'the_main',      'dish', 1, 1, false, false, 12, ''),
  ('other',         'the_dessert',   'dish', 1, 1, false, false, 13, ''),

  ('girls_weekend', 'the_appetizer', 'dish', 1, 1, false, true,  21,
   'One a day, and optional: some of those meals are eaten out.'),
  ('girls_weekend', 'the_main',      'dish', 1, 1, false, true,  22, ''),
  ('girls_weekend', 'the_dessert',   'dish', 1, 1, false, true,  23, ''),

  ('getaway',       'the_appetizer', 'dish', 1, 1, false, true,  11,
   'The occasion that most resists being scheduled. A table per day, nothing '
   'insisted on.'),
  ('getaway',       'the_main',      'dish', 1, 1, false, true,  12, ''),
  ('getaway',       'the_dessert',   'dish', 1, 1, false, true,  13, ''),

  ('bridal',        'the_appetizer', 'dish', 1, 1, false, true,  21, ''),
  ('bridal',        'the_main',      'dish', 1, 1, false, true,  22, ''),
  ('bridal',        'the_dessert',   'dish', 1, 1, false, true,  23, '');


-- ── the set menu, retired from selection ─────────────────────────────
--
-- "Set menus cannot be the model." These nine rows are what made one the model,
-- so these nine rows go. Argued in full at the top of this file.
--
-- WHAT IS DELETED AND WHAT IS NOT, precisely, because the difference is the
-- whole of the founder's instruction:
--
--   DELETED   occasion_slot for `the_menu`. Nine rows, one per occasion. The
--             engine no longer has a slot to put a menu in, so it no longer
--             places one.
--   KEPT      slot_kind.the_menu itself, so that `revelle_menu` rows already
--             issued still name a slot that exists, and so that re-enabling it
--             is nine inserts rather than a migration that has to reconstruct a
--             deleted slot.
--   KEPT      the `menu` table, all thirty-nine rows, menu_world, menu_facet,
--             menu_card, scripts/seed-menus.mjs, /desk/menus and the pool's
--             registration in ingredient_pool and in POOLS
--             (src/lib/selection/catalogue.ts).
--
-- THE POOL STAYING IN `POOLS` IS DELIBERATE and is not an oversight to be
-- tidied later. A pool the engine cannot see reports a phantom gap forever —
-- that is what happened to menus before db/017 — and more to the point, a menu
-- is now an EXEMPLAR, which means a curator has to be able to read it beside a
-- composed table. Loading thirty-nine rows the search will never place costs
-- one query and keeps every downstream reader honest about what exists.
--
-- `the_drinks` is untouched. A drinks programme is one row with its mocktail
-- mirror, it pairs with the table rather than with a course, and db/017's
-- guarantee — nobody at the table is visibly not drinking — has nothing to do
-- with this decision.

delete from occasion_slot where slot_code = 'the_menu';


-- ── the headroom arithmetic, told the truth ──────────────────────────
--
-- db/021 registered the pool with typical_draw 0 because nothing drew from it.
-- Three courses draw from it now, so it is 3, and assemblage_headroom() starts
-- counting the combinations composition actually adds.
--
-- The number moves a very long way — C(600,3) is roughly 3.6 × 10^7 where the
-- menu pool contributed C(39,1) = 39 — and that is the honest measure of what
-- composition buys. It is also why the birthday-bound note in db/002 matters
-- more than the raw figure: collisions grow with the square root of it.
--
-- The menu pool drops to 0 by the same rule and for the same reason db/021 gave
-- the dish pool 0: nothing draws from it, so C(n, 0) = 1 and it contributes a
-- factor of one. Leaving it at 1 would count thirty-nine evenings the engine
-- can no longer produce.

update ingredient_pool set typical_draw = 3 where entity_table = 'dish';
update ingredient_pool set typical_draw = 0 where entity_table = 'menu';


-- ─────────────────────────────────────────────────────────────────────
-- WHAT THIS DELIBERATELY DOES NOT DO
--
--   · NO DECOMPOSITION OF docs/menus.md. Nothing here reads `menu.dishes`,
--     matches prose to a dish row, or builds a menu-to-dish join table. db/012's
--     refusal is untouched and the founder restated it: those lines are her
--     writing. A join table would have to be authored by a human with both
--     documents open, and that is a real piece of work somebody may choose to
--     do — it is not something a parser may guess at.
--
--   · NO COMPOSED MENU ROW. A composition is not written back into the `menu`
--     table. It exists as three picks in one Revelle and nothing more, which is
--     what keeps `menu` a table of AUTHORED evenings — the moment a machine can
--     insert into it, "everything in the menu pool is hers" stops being true and
--     no query can recover which is which.
--
--   · NO FOURTH COURSE, no cheese course, no amuse-bouche. docs/dishes.md is
--     grouped under three headings at all thirteen destinations. A fourth is an
--     insert here plus a value on the `course` enum, and it should follow the
--     document rather than lead it.
--
--   · NO DRINK DECOMPOSITION. A drinks programme is one row with its mocktail
--     mirror and it pairs with the table, not with a course. Read the top of
--     db/017 before pouring a different thing with each plate: the guarantee is
--     that nobody at the table is visibly not drinking, and it survives exactly
--     as long as the two builds cannot be separated.
--
--   · NO ADJACENCY MODEL, and the absence is named rather than hidden. See
--     WHAT COMPOSITION LOSES at the top. Nothing in this system knows that two
--     dishes are too rich together, and no rule in this file pretends to.
-- ─────────────────────────────────────────────────────────────────────
