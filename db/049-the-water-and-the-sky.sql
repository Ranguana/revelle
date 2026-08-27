-- ── 049 · THE WATER AND THE SKY ──────────────────────────────────────
--
-- Applied by scripts/migrate.mjs after 048, inside one transaction together
-- with its schema_migrations ledger row. Nothing here may be a statement that
-- refuses to run in a transaction.
--
-- New file, never applied anywhere, so no SENTINELS entry in
-- scripts/migrate.mjs.
--
-- ─────────────────────────────────────────────────────────────────────
-- WHAT THIS IS FOR, IN THE FOUNDER'S OWN ORDER
--
--   "we need to add a question to the quiz: is there a pool, lake, river lake?"
--   "is it a swimmable lake or pond? will there be water activities"
--   "indoor or outdoor party or both?"
--
-- Three questions, one subject: THE PHYSICAL WORLD SHE IS STANDING IN, which
-- the application has been able to describe only as a room TYPE since db/020.
-- `environment` is single-select — my_home · city_apartment · beach · mountains
-- · poolside · garden · restaurant_or_venue · hotel · not_decided — so a host
-- with a house AND a pool has to choose one, and choosing "A house" makes the
-- pool invisible to the entire engine. WATER ACCESS IS A DIFFERENT FACT FROM
-- WHERE THE PARTY IS HELD and it has had nowhere to live.
--
-- The immediate content driver is a real row rather than a hypothetical: Côte
-- d'Azur's STRIPED FLOATS, authored as `bank_item` `good`, carrying no
-- founder-pending marker, which means it publishes on the deploy that seeds it.
-- `structural_requirement` holds no water code at all, so as things stand a
-- pool float can be selected into a fifth-floor city apartment with nothing in
-- the system objecting. That is CLAUDE.md rule 16's silence with a member on
-- the other end of it, and this migration is the supply side of the gate that
-- closes it.
--
-- ─────────────────────────────────────────────────────────────────────
-- RULE 2 GOVERNS ALL THREE, AND IT IS THE FIRST THING TO READ
--
-- Verbatim, because the wall is thinner than its short form implies:
--
--     "VENUE MAY ELIMINATE WHAT CANNOT PHYSICALLY HAPPEN. IT MAY NEVER RANK
--      WHAT CAN … Feasibility is honest. PREFERENCE-BY-SQUARE-FOOTAGE IS THE
--      SIN. The test for any new venue-touching code is which door it uses —
--      can this physically happen here (allowed, and it may eliminate) versus
--      would this suit a place like hers (forbidden, at any weight, including
--      small ones that look like tie-breaks)."
--
-- So water and sky PRUNE THE POOL and touch nothing else. A host with a pool is
-- NOT nudged toward Palm Springs. A host with a garden is NOT nudged toward the
-- garden rooms. A host with no water is simply never offered a float, and her
-- eighteen destinations are ranked exactly as they were before she answered.
--
-- The enforcement follows `environment`'s precedent to the letter, in the same
-- three places, because a comment is what the next person overrides:
--
--   1. src/lib/selection/vector.ts   the three dimensions join `environment`
--                                    in NON_TASTE_DIMENSIONS — zero weight,
--                                    not a small one
--   2. this file                     db/020's refuse_environment_tag() is
--                                    widened to refuse ALL FOUR venue
--                                    dimensions on a world or a cohort
--   3. src/lib/selection/selection.test.ts
--                                    fails with the thesis in the message
--
-- If you are here to "connect" one of these to scoring: the answer is no, and
-- the argument is in src/lib/selection/venue.ts's header.
--
-- ─────────────────────────────────────────────────────────────────────
-- WHAT IS IN THIS FILE
--
--   indoor_outdoor, water_access, water_use   three enums, three columns
--   quiz_response_guard                       frozen with the rest of her answers
--   quiz_option                               the registry, three fields
--   facet_dimension / facet / the bridge      so nothing she can tap means nothing
--   quiz_response_facet                       three new branches
--   refuse_environment_tag                    widened to the whole venue family
--   requires_still_water                      one structural_requirement code
--   host_affordance                           venue_affordance's sibling
--   venue_affordance                          DELIBERATELY SILENT about water
--
-- AND WHAT IS NOT IN THIS FILE, WHICH IS THE POINT OF db/047: no statement
-- here matches authored text. Tagging an item as requiring water is computation
-- over CONTENT and runs after content exists, in `tagCatalogue()`. CLAUDE.md
-- rule 22 — db/020 and db/033 both tagged from a migration, both ran against
-- empty tables on every build forever, and that is the week's founding defect.


-- ── 1 · INSIDE OR OUT ────────────────────────────────────────────────
--
-- An enum by db/001's rule: the value set is closed and structural.
--
-- WITH a 'not_decided', unlike `evening_ending`, and the distinction db/037
-- drew is the one that decides it: an ending is what she THINKS a good evening
-- does, and she has an opinion before she has a venue. This is a FACT ABOUT A
-- PLACE she may not have booked, which is exactly the case db/002 gave the room
-- question an escape hatch for. A host forced to guess writes a false fact into
-- a gate, and a false fact in a gate deletes deliverables silently.
--
-- THREE REAL VALUES AND THE FOURTH ARGUED AND REFUSED. The tempting split is
-- `both` into "mostly inside" and "mostly outside", so that an evening that is
-- really a dinner with drinks on the stoop does not receive a pétanque set. It
-- is refused because the REQUIREMENT vocabulary already draws that line —
-- db/033 §2 built `outdoor_access` as "A GRADE, not a sibling" of
-- `requires_outdoors` precisely so the stoop and the lawn could be told apart —
-- and asking her to draw it again is two vocabularies saying one thing in
-- different words, which is the defect db/033 existed to repair. Rule 2's door
-- test finishes it: a host who says part of her evening is outside CAN host
-- boules, and refusing her is preference-by-square-footage with a feasibility
-- badge on. Flagged for the founder in src/lib/quiz.ts; it is one option and
-- two `host_affordance` rows if she disagrees.

create type indoor_outdoor as enum (
  'indoor',
  'outdoor',
  'both',
  'not_decided'
);

comment on type indoor_outdoor is
  'How much of the evening is under sky, as she answered it. NOT a taste and '
  'never scored: it prunes the pool at stage 3 through host_affordance and it '
  'is refused on a world or a cohort by refuse_environment_tag(). This is the '
  'supply side db/035 asked for in its closing paragraph — until now '
  'requires_outdoors and outdoor_access could only ever prune at the '
  'granularity of a room TYPE.';


-- ── 2 · WHAT WATER THERE IS ──────────────────────────────────────────
--
-- PRESENCE IS NOT USABILITY, which is the founder's second question and the
-- reason this is not simply her four nouns. An ornamental pond, a fountain and
-- a river that is cold and fast are all water and nobody is getting into any of
-- them, and a float sent to a duck pond fails the same way a float sent to an
-- apartment fails. Usability is carried IN THE VALUE rather than in a second
-- conditional question, so the answer is already precise enough to gate on and
-- no host is shown a question that depends on another (see START_HOURS in
-- src/lib/quiz.ts for why that gate is a shape this codebase now avoids).
--
-- 'none' AND 'not_decided' ARE DIFFERENT AND THE DIFFERENCE IS LOAD-BEARING. A
-- host who has not answered is not a host without water. 'none' writes an
-- affordance row saying false; 'not_decided' writes no row at all, so nothing
-- is pruned and she may still receive the float. Encoded as the presence or
-- absence of a row rather than as a third boolean state, which is db/020's own
-- device — "a room with no row for a requirement is treated as AFFORDING it".
--
-- FOUR SWIMMABLE VALUES WHERE THE ENGINE READS ONE FACT, on purpose. `pool`,
-- `swimmable_lake` afford `requires_still_water` and `river` and `sea` DO NOT,
-- which is the founder's own ruling and is argued in section 10. They are four
-- values rather than one boolean precisely because of it: a boolean cannot
-- express "pool and lake yes, river and ocean no", and an item declaring
-- "needs water" would land in a river. The distinction is stored on every
-- response written since this migration, so the day a second requirement needs
-- it — swimming from a dock is a real thing a lake and a river disagree about
-- differently than a float does — it is an insert rather than a question that
-- has to be re-asked of people who have already answered it.

create type water_access as enum (
  'pool',
  'lake',
  'pond',
  'river',
  'sea',
  'not_for_swimming',
  'none',
  'not_decided'
);

comment on type water_access is
  'What water the place has, and whether anybody could get into it. Presence '
  'is not usability: not_for_swimming is water that exists and is ornamental. '
  'NOT a taste and never scored — a host with a pool is not nudged toward Palm '
  'Springs. ''none'' is a stated absence; ''not_decided'' is no information at '
  'all and must never be read as ''none''.';


-- ── 3 · WHETHER ANYBODY IS GETTING IN ────────────────────────────────
--
-- The founder's third question, and a separate fact rather than a finer grade
-- of the second: "a host with a good pool having a long dinner does not want
-- floats." The pool is real, it is swimmable, and the evening is a table. So
-- presence and use are independently necessary and are combined with AND at the
-- point of use — see composeVenue() in src/lib/selection/venue.ts.
--
-- IT IS NOT `swim_late`. GROUP_FUN already offers "Swim long after dark" and
-- the rule-21 question is whether two surfaces must agree about one fact. They
-- must not: `swim_late` is one tile of fourteen under a cap of FOUR, so a host
-- who plans a whole afternoon in the pool and spends her four taps elsewhere
-- has not said no to swimming. An answer given under a cap cannot be read as a
-- complete claim, and gating the floats on it would delete them for a host who
-- was rationing tiles.

create type water_use as enum (
  'in_the_water',
  'beside_it',
  'not_decided'
);

comment on type water_use is
  'Whether the water is part of the evening. Independent of water_access and '
  'ANDed with it: an item requiring water needs both a usable body of water '
  'and a party that goes into it. NOT a taste and never scored.';


-- ── 4 · THE COLUMNS ──────────────────────────────────────────────────
--
-- Nullable, because every response written before today has no answer and is
-- NOT missing one — the contract db/005, db/006, db/016, db/026 and db/037 all
-- established for their own questions. A null here reaches composeVenue() as
-- "no claim", so an application written against 2026-08-g keeps exactly the
-- behaviour it had: pruned by its room type and by nothing else.
--
-- THE ALTERNATIVE READING IS THE DANGEROUS ONE and it is worth naming so nobody
-- "tidies" the nulls later with a default. Reading a null `water_access` as
-- 'none' would delete every water-requiring deliverable from every application
-- ever submitted, silently, with no error and no gap message. Reading a null
-- `indoor_outdoor` as 'indoor' would delete the outdoor half of the catalogue
-- from all of them. Nulls here mean SILENCE, and silence removes nothing.

alter table quiz_response
  add column indoor_outdoor indoor_outdoor,
  add column water_access   water_access,
  add column water_use      water_use;

comment on column quiz_response.indoor_outdoor is
  'Whether the evening is inside, outside or both, as she answered it. Read '
  'ONLY by the venue gate, where it SUPERSEDES the room type for '
  'requires_outdoors and outdoor_access — a host reporting her own party is '
  'better evidence than a row that knows only the word "apartment". Never '
  'scored. Null means she was never asked (quiz_version < 2026-08-h) and '
  'removes nothing.';

comment on column quiz_response.water_access is
  'What water the place has, as she answered it. Read only by the venue gate. '
  'Never scored — venue may eliminate what cannot physically happen and may '
  'never rank what can. Null means she was never asked and removes nothing.';

comment on column quiz_response.water_use is
  'Whether anybody is getting in, as she answered it. ANDed with water_access '
  'by composeVenue(). Never scored. Null means she was never asked and removes '
  'nothing.';


-- ── 5 · FROZEN WITH THE REST OF HER ANSWERS ──────────────────────────
--
-- db/003's guard, restated whole because a plpgsql body cannot be amended in
-- place. Three lines added; the list of MUTABLE columns is unchanged.

create or replace function quiz_response_guard() returns trigger
language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    raise exception
      'quiz_response is append-only: row % may not be deleted. Set status = ''archived''.',
      old.id;
  end if;

  if new.customer_id    is distinct from old.customer_id
     or new.answers          is distinct from old.answers
     or new.quiz_version     is distinct from old.quiz_version
     or new.submission_key   is distinct from old.submission_key
     or new.occasion         is distinct from old.occasion
     or new.occasion_other   is distinct from old.occasion_other
     or new.environment      is distinct from old.environment
     or new.taste_directions is distinct from old.taste_directions
     or new.group_fun        is distinct from old.group_fun
     or new.anti_preferences is distinct from old.anti_preferences
     or new.affinities       is distinct from old.affinities
     or new.secret           is distinct from old.secret
     or new.budget           is distinct from old.budget
     or new.music_service    is distinct from old.music_service
     or new.guest_count_band is distinct from old.guest_count_band
     or new.spend_per_person is distinct from old.spend_per_person
     or new.voice_tones      is distinct from old.voice_tones
     or new.how_made         is distinct from old.how_made
     or new.play_appetite    is distinct from old.play_appetite
     or new.food_plan        is distinct from old.food_plan
     or new.event_month      is distinct from old.event_month
     or new.meal_time        is distinct from old.meal_time
     or new.how_it_ends      is distinct from old.how_it_ends
     -- Added by db/049. Her answers, therefore frozen.
     or new.indoor_outdoor   is distinct from old.indoor_outdoor
     or new.water_access     is distinct from old.water_access
     or new.water_use        is distinct from old.water_use
     or new.created_at       is distinct from old.created_at
  then
    raise exception
      'quiz_response % is immutable: only status, event_date and guest_count_confirmed may change. Insert a new response instead.',
      old.id;
  end if;

  return new;
end;
$$;


-- ── 6 · THE ANSWERS, AS IDENTITIES ───────────────────────────────────
--
-- db/037's registry. One row per (QuizField.id, QuizOption.code) in
-- src/lib/quiz.ts, registered before anything is hung off them.

insert into quiz_option (quiz_field, option_code) values
  ('indoor_outdoor', 'indoor'),
  ('indoor_outdoor', 'outdoor'),
  ('indoor_outdoor', 'both'),
  ('indoor_outdoor', 'not_decided'),
  ('water_access',   'pool'),
  ('water_access',   'lake'),
  ('water_access',   'pond'),
  ('water_access',   'river'),
  ('water_access',   'sea'),
  ('water_access',   'not_for_swimming'),
  ('water_access',   'none'),
  ('water_access',   'not_decided'),
  ('water_use',      'in_the_water'),
  ('water_use',      'beside_it'),
  ('water_use',      'not_decided')
on conflict (quiz_field, option_code) do nothing;


-- ── 7 · THE VOCABULARY, AND WHY IT EXISTS AT ALL ─────────────────────
--
-- These three dimensions are tagged on NOTHING. No destination carries them, no
-- cohort may, no product will, and vector.ts gives them zero weight. So the
-- reasonable question is why they are in `facet` rather than living only as
-- enums and affordance rows.
--
-- THE ANSWER IS db/037'S, VERBATIM, because it made the same argument for
-- `evening_start` and `evening_ending`: "They are in the bridge anyway, and
-- only because they are in the bridge can scripts/check-facets.mjs prove that
-- nothing she can tap means nothing." A question whose answers are outside the
-- vocabulary is a question the drift audit cannot see, and an option that
-- resolves to nothing is CLAUDE.md rule 16's exact shape — she taps a tile and
-- it lands nowhere.
--
-- `environment` is the precedent in every particular: it has been a
-- facet_dimension since db/002, it is tagged on nothing, it is scored at zero,
-- and it is refused on a world by a trigger. These three are its siblings.
--
-- Labels and descriptions are the option's own `label` and `hint` in
-- src/lib/quiz.ts — db/026's convention — so scripts/check-facets.mjs reports
-- zero drift on a clean tree.

insert into facet_dimension (code, label, description, position) values
  ('indoor_outdoor', 'Inside or out',
   'How much of the evening is under sky. A CONSTRAINT on what can physically '
   'happen and never a taste: it prunes the pool at stage 3 through '
   'host_affordance, where it supersedes the room type for requires_outdoors '
   'and outdoor_access, and it is refused on a destination outright. See '
   'db/049.',
   250),
  ('water_access', 'What water there is',
   'What water the place has and whether anybody could get into it. Presence '
   'is not usability. A CONSTRAINT and never a taste — a host with a pool is '
   'not nudged toward the pool rooms, she is simply the only host who can '
   'receive a float. See db/049.',
   260),
  ('water_use', 'Whether anyone gets in',
   'Whether the water is part of the evening. Independent of what water there '
   'is, and ANDed with it: a good pool at a long dinner affords nothing. A '
   'CONSTRAINT and never a taste. See db/049.',
   270);

insert into facet (dimension_code, code, label, description, provenance, notes) values
  ('indoor_outdoor', 'indoor', 'Inside', 'Nothing happens out of doors',
   'quiz', 'Refuses requires_outdoors. Says NOTHING about outdoor_access — an '
   'indoor party in a house still has a door to the garden, and the sparklers '
   'can be lit outside it.'),
  ('indoor_outdoor', 'outdoor', 'Outside', 'All of it, under sky',
   'quiz', 'Affords both outdoor grades, overriding the room type. A host who '
   'says her party is outdoors is not in a sealed hotel room.'),
  ('indoor_outdoor', 'both', 'Both', 'It moves between the two',
   'quiz', 'Affords both outdoor grades. The argument for not splitting this '
   'into mostly-in and mostly-out is in section 1 above.'),
  ('indoor_outdoor', 'not_decided', 'Still deciding', '',
   'quiz', 'NO INFORMATION. Writes no affordance row, so the room type''s own '
   'default stands and nothing new is pruned.'),

  ('water_access', 'pool', 'A pool', '',
   'quiz', 'Affords requires_still_water — a pool holds a float.'),
  ('water_access', 'lake', 'A lake', '',
   'quiz', 'Affords requires_still_water — a lake holds a float.'),
  ('water_access', 'pond', 'A pond you can swim in', '',
   'quiz', 'Affords requires_still_water. The founder named a pond in her '
   'second list and not in the float ruling; a pond is still water like a pool '
   'and a lake, so the ruling extends to it by its own reason rather than by '
   'analogy.'),
  ('water_access', 'river', 'A river', '',
   'quiz', 'REFUSES requires_still_water: a river moves and takes a float '
   'downstream. Swimmable and still not still, which is why the code is named '
   'for stillness rather than for wetness.'),
  ('water_access', 'sea', 'The sea, or a beach', '',
   'quiz', 'REFUSES requires_still_water: surf takes a float out. The '
   'founder''s ruling — pool and lake yes, river and ocean no. Her second list '
   'said "on beach", which is the same body of water and is why the label '
   'carries both words while the code carries one fact.'),
  ('water_access', 'not_for_swimming', 'Water, but nobody is getting in',
   'An ornamental pond, a fountain, a river that is cold and fast',
   'quiz', 'REFUSES requires_still_water. Presence without usability, which is the '
   'founder''s second question and the reason this dimension is not four '
   'nouns.'),
  ('water_access', 'none', 'No water', '',
   'quiz', 'REFUSES requires_still_water. A STATED absence, which is a different '
   'thing from an unanswered question.'),
  ('water_access', 'not_decided', 'Still deciding', '',
   'quiz', 'NO INFORMATION. Writes no affordance row. Must never be read as '
   '''none'' — a host who has not answered is not a host without water.'),

  ('water_use', 'in_the_water', 'People will be in the water', '',
   'quiz', 'Affords requires_still_water.'),
  ('water_use', 'beside_it', 'Nobody is getting in', '',
   'quiz', 'REFUSES requires_still_water. True of a host with no water at all, which '
   'is why this question needs no activeWhen gate.'),
  ('water_use', 'not_decided', 'Still deciding', '',
   'quiz', 'NO INFORMATION. Writes no affordance row.');

-- The bridge. An identity in both directions — the option code IS the facet
-- code — so there is no translation to get wrong, which is the arrangement
-- db/037 chose for the endings and for the same reason.
insert into quiz_option_facet (quiz_field, option_code, facet_id)
select f.dimension_code, f.code, f.id
  from facet f
 where f.dimension_code in ('indoor_outdoor', 'water_access', 'water_use')
on conflict do nothing;


-- ── 8 · THE VIEW ─────────────────────────────────────────────────────
--
-- Three new branches. Restated whole because a view cannot be amended in place;
-- everything above the three marked lines is db/037's, unchanged.

create or replace view quiz_response_facet as
select qr.id          as quiz_response_id,
       qr.customer_id,
       qr.created_at  as observed_at,
       qr.quiz_version,
       src.quiz_field,
       ans.option_code,
       m.facet_id,
       f.dimension_code,
       f.code         as facet_code,
       f.label        as facet_label,
       f.status       as facet_status,
       m.answer_polarity as polarity,
       m.answer_weight   as answer_weight
  from quiz_response qr
  cross join lateral (
    values ('taste_directions', qr.taste_directions),
           ('group_fun',        qr.group_fun),
           ('anti_preferences', qr.anti_preferences),
           ('affinities',       qr.affinities),
           ('voice_tones',      qr.voice_tones),
           ('occasion',         array[qr.occasion::text]),
           ('environment',      array[qr.environment::text]),
           ('budget',           array[qr.budget::text]),
           ('music_service',    array[qr.music_service::text]),
           ('guest_count_band', array[qr.guest_count_band::text]),
           ('spend_per_person', array[qr.spend_per_person::text]),
           ('how_made',         array[qr.how_made::text]),
           ('play_appetite',    array[qr.play_appetite::text]),
           ('food_plan',        array[qr.food_plan::text]),
           ('event_month',      array[qr.event_month::text]),
           ('meal_time',        array[qr.meal_time::text]),
           ('how_it_ends',      array[qr.how_it_ends::text]),
           -- Added by db/049. A null column contributes no row, which is what
           -- "she was never asked" has to look like from every reader.
           ('indoor_outdoor',   array[qr.indoor_outdoor::text]),
           ('water_access',     array[qr.water_access::text]),
           ('water_use',        array[qr.water_use::text])
  ) as src(quiz_field, option_codes)
  cross join lateral unnest(src.option_codes) as ans(option_code)
  join quiz_option_facet m
    on m.quiz_field = src.quiz_field and m.option_code = ans.option_code
  join facet f on f.id = m.facet_id;


-- ── 9 · THE TRIGGER, WIDENED TO THE WHOLE VENUE FAMILY ───────────────
--
-- db/020 refused an `environment` facet on a world or a cohort, and said why:
-- "A comment is what the next person overrides; a trigger is what they have to
-- argue with." Three dimensions have just joined that family and every word of
-- the argument applies to them unchanged — a destination tagged "has a pool" is
-- "party themes that match your space" arriving through a new door.
--
-- READ AS A LIST OF FOUR RATHER THAN A LIST OF ONE, and the list is spelled out
-- here rather than derived, because the property that makes a dimension a venue
-- dimension is a JUDGEMENT about what it describes and not something the schema
-- can compute. A fifth one added later must be added here by hand, and this
-- paragraph is the instruction to do it.

create or replace function refuse_environment_tag() returns trigger
language plpgsql as $$
declare
  v_dimension text;
begin
  select dimension_code into v_dimension from facet where id = new.facet_id;

  if v_dimension in ('environment', 'indoor_outdoor', 'water_access', 'water_use') then
    raise exception using
      errcode = 'check_violation',
      message = format(
        'A %s may not be tagged with a %s facet.', tg_table_name, v_dimension),
      detail =
        'Venue never touches the destination. The destination is where she is '
        'transported to; the venue is where she physically is, and the engine''s '
        'whole job is mapping one onto the other — Havana in a Brooklyn '
        'apartment is the pitch, not a compromise. A destination tagged with a '
        'room, or with a swimming pool, is how that becomes "party themes that '
        'match your space".',
      hint =
        'Where she is goes into venue_affordance, host_affordance and '
        'ingredient_requirement, which prune the POOL at stage 3. See '
        'src/lib/selection/venue.ts.';
  end if;

  return new;
end;
$$;

comment on function refuse_environment_tag() is
  'Refuses a VENUE facet — environment, indoor_outdoor, water_access, '
  'water_use — on anything that scores a destination. The product thesis, '
  'enforced rather than documented. Named for the one dimension it started '
  'with; widened by db/049, and the name is kept because two triggers depend '
  'on it and a rename buys nothing the comment does not.';


-- ── 10 · ONE REQUIREMENT CODE, AND WHAT THE FOUNDER NARROWED IT TO ───
--
-- The first draft of this file minted `requires_water` and would have been
-- wrong. The founder's ruling, which arrived while it was being written:
--
--     "a pool float should only land if the quiz answer is 'has pool' or
--      'lake'"
--
-- POOL AND LAKE YES. RIVER AND OCEAN NO — and the reason is physical rather
-- than editorial, which is why it belongs in the code's own meaning rather than
-- in a note beside it. A FLOAT NEEDS STILL WATER. A river moves and takes the
-- float downstream; the sea has surf and takes it out. Both are unarguably
-- water, and neither will hold a mattress with somebody on it beside a lunch
-- that is still going.
--
-- SO THE CODE IS NAMED FOR WHAT THE OBJECT NEEDS, NOT FOR THE ROOM IT SUITS.
-- `requires_pool` was the obvious name and is refused: it would refuse a
-- perfectly good lake, which is rule 2's forbidden door reached through a
-- name — would this suit a place like hers, rather than can this physically
-- happen here. `requires_still_water` is checkable against the world.
--
-- ── ONE CODE, AND THE SECOND ONE ARGUED AND NOT MINTED ───────────────
--
-- Her rule creates two visible classes: things that need water that HOLDS THEM
-- (floats, anything inflatable), and things that need water AT ALL (towels, a
-- bucket of bottles cooling at the edge, anything about swimming). A river
-- satisfies the second and not the first.
--
-- The second code is NOT minted, and the argument is db/039's own. Rule 15
-- gives an unfed instrument two outcomes and no third; rule 24 says count
-- before you believe. The catalogue holds exactly ONE water-dependent row today
-- — Côte d'Azur's striped floats — and it is in the first class. A second code
-- would be tagged zero times, and db/039 deleted `noise_ceiling` and
-- `deposit_safe` for precisely that: "the pruning half was built and the
-- claiming half never was". Minting a fresh instance of the defect in the same
-- month the lesson was written down would be a poor use of it.
--
-- WHAT MAKES THAT SAFE IS SECTION 11. The four bodies of water are FOUR ANSWERS
-- and they survive into `host_affordance` as four rows with explicit `provided`
-- values and their own notes — the distinction is stored, not collapsed into a
-- boolean. So the second code is an INSERT here plus one four-line block below,
-- with no quiz change, no re-asking, and no re-interpretation of any response
-- written since today. That is the whole reason the affordance table is keyed
-- by the answer rather than by a derived "has usable water" flag.
--
-- WHY THE DEMAND IS WORDED AS IT IS. `demand` completes "it …" in a rejection
-- sentence, and db/020 warns that a name alone gets polarity backwards. "needs
-- still water somebody is getting into" is deliberately the WHOLE condition
-- rather than "needs water", because the gate is a conjunction of two answers
-- and a curator reading the gap sentence has to see both halves.

insert into structural_requirement (code, label, demand, description, position)
values ('requires_still_water', 'Needs still water',
        'needs still water somebody is getting into',
        'Water that HOLDS a thing — a pool or a swimmable lake — and an evening '
        'that goes into it. Both halves, because either alone is a wrong '
        'answer: a decorative pond is water nobody swims in, and a good pool at '
        'a long dinner is a pool nobody is using. A river moves and takes a '
        'float downstream; the sea has surf and takes it out, so neither '
        'affords this however swimmable it is. Pool floats, anything '
        'inflatable, anything that is only a thing while it is sitting on '
        'water. NOT for a bowl of blossoms floated on a table — that is a bowl, '
        'and matching it here on the word "float" is exactly the mistake '
        'CLAUDE.md rule 24 is a list of.', 18)
on conflict (code) do nothing;


-- ── 11 · host_affordance — venue_affordance's SIBLING ────────────────
--
-- db/020's `venue_affordance` is keyed by `environment_type`, one room type per
-- row. The three answers this migration adds are not room types, so they cannot
-- live in it, and widening it would mean either a nullable environment (a table
-- whose primary key is sometimes half absent) or a fourth column that is null
-- on every existing row. A sibling keyed by the ANSWER is the honest shape.
--
-- WHY IT IS NOT ONE TABLE PER AXIS. Rule 19: the registry is the only truth,
-- and three near-identical tables are three places to forget one — the exact
-- argument db/020 made for making `ingredient_requirement` polymorphic rather
-- than five tables. (quiz_field, option_code) is already a registered identity
-- in `quiz_option`, so the foreign key below is free and the axis list is not
-- hand-written anywhere.
--
-- ── THE RULE THAT COMBINES THIS WITH venue_affordance ────────────────
--
-- Stated here because it is the one thing a reader will get wrong, and it is
-- NOT boolean algebra over all the sources:
--
--   HER OWN STATEMENT SUPERSEDES THE ROOM TYPE. Where any host answer speaks to
--   a requirement, the room type is not consulted for that requirement at all.
--   Where no host answer speaks to it, the room type stands exactly as db/020
--   and db/035 left it.
--
--   AMONG HOST ANSWERS, FALSE WINS. Two axes both speak to
--   `requires_still_water` and both must say yes.
--
-- The worked cases, because the reason for supersession is in them:
--
--   apartment + outdoor    requires_outdoors TRUE. db/020 says an apartment has
--                          no outdoors; she says her party is outside, so there
--                          is a roof or a courtyard and the type-level default
--                          was a guess about a building. AND-ing the two would
--                          absorb her answer and not honour it (rule 16).
--   house + indoor         requires_outdoors FALSE. The room affords it and the
--                          evening does not use it. OR-ing the two would ignore
--                          the only answer that was about this party.
--   hotel + indoor         outdoor_access FALSE, from db/035's row, because
--                          `indoor` writes NO outdoor_access claim — an indoor
--                          party in a house still has a door to the garden.
--   pool + beside_it       requires_still_water FALSE. The founder's own case.
--   none + in_the_water    requires_still_water FALSE. Two answers, a
--                          contradiction,
--                          and refusing is the safe direction: sending a float
--                          to a host who says there is no water is the failure
--                          this file exists to stop.
--   not_decided anywhere   NO ROW, so the other axis decides alone, and if both
--                          are undecided nothing is pruned.
--
-- The rule lives in ONE function — composeVenue() in src/lib/selection/venue.ts
-- — which the engine's loader and the gate reporter both call. Rule 21: two
-- surfaces must agree about what a host's room affords, so exactly one of them
-- computes it.

create table host_affordance (
  quiz_field  text not null,
  option_code citext not null,
  requirement text not null references structural_requirement(code) on delete restrict,
  provided    boolean not null,
  -- Why not, in the house's words. Reaches a curator's gap sentence verbatim,
  -- and is written to be true of the ANSWER rather than of the room — "there is
  -- no water here" reads correctly under any environment, which "there is no
  -- outdoors" would not.
  note        text not null default '',
  primary key (quiz_field, option_code, requirement),
  constraint host_affordance_known_option
    foreign key (quiz_field, option_code)
    references quiz_option (quiz_field, option_code) on delete restrict
);

create index host_affordance_by_requirement on host_affordance (requirement);

comment on table host_affordance is
  'What a HOST ANSWER says about what can physically happen — venue_affordance''s '
  'sibling for the axes that are not a room type. An option with NO ROW makes '
  'no claim, which is how ''Still deciding'' is expressed and why it can never '
  'be read as ''none''. Consumed once, by composeVenue() in '
  'src/lib/selection/venue.ts, as a filter over the pool — never as a weight '
  'and never anywhere near the destination.';

comment on column host_affordance.provided is
  'TRUE affords, FALSE refuses, NO ROW says nothing. The third state is the '
  'absence of the row and it is the important one: a host who has not answered '
  'must be pruned by nothing.';

-- ── INSIDE OR OUT ────────────────────────────────────────────────────
--
-- `indoor` refuses requires_outdoors and says NOTHING about outdoor_access, and
-- that asymmetry is the whole reason db/033 made two grades. requires_outdoors
-- is about the EVENING — a clambake cannot happen at a party that is indoors.
-- outdoor_access is about the BUILDING — "somewhere a lit thing and its smoke
-- can be outside", db/035's own words — and a dinner party in a house has a
-- door to the garden whether or not anybody eats out there. Refusing the
-- sparklers to an indoor party would delete a deliverable for a reason that is
-- not true.
insert into host_affordance (quiz_field, option_code, requirement, provided, note) values
  ('indoor_outdoor', 'indoor', 'requires_outdoors', false,
   'this evening is inside, and the thing needs a sky'),
  ('indoor_outdoor', 'outdoor', 'requires_outdoors', true, ''),
  ('indoor_outdoor', 'outdoor', 'outdoor_access',    true, ''),
  ('indoor_outdoor', 'both',    'requires_outdoors', true, ''),
  ('indoor_outdoor', 'both',    'outdoor_access',    true, '');

-- ── THE WATER ────────────────────────────────────────────────────────
--
-- THE FOUNDER'S MATRIX, and it is db/035's shape exactly: an answer ×
-- requirement grid with `provided` true or false per pair, where the false rows
-- are the whole point. db/035 made `outdoor_access` prune by setting one
-- environment false; this sets four answers false, and each carries its own
-- sentence because they are false for four different reasons.
--
-- Pool and lake hold a float. A river moves it and the sea takes it out — both
-- are water and both refuse THIS requirement, which is why the code is named
-- for stillness and not for wetness. `not_for_swimming` is water that exists
-- and is ornamental. `none` is a stated absence.
--
-- `not_decided` appears in neither list, in either axis, and that is the third
-- state: no row, no claim, nothing pruned.
insert into host_affordance (quiz_field, option_code, requirement, provided, note) values
  ('water_access', 'pool',             'requires_still_water', true,  ''),
  ('water_access', 'lake',             'requires_still_water', true,  ''),
  ('water_access', 'pond',             'requires_still_water', true,  ''),
  ('water_access', 'river',            'requires_still_water', false,
   'a river moves, and it takes a float downstream with it'),
  ('water_access', 'sea',              'requires_still_water', false,
   'the sea has surf, and it takes a float out with it'),
  ('water_access', 'not_for_swimming', 'requires_still_water', false,
   'the water here is not water anybody gets into'),
  ('water_access', 'none',             'requires_still_water', false,
   'there is no water here'),
  ('water_use',    'in_the_water',     'requires_still_water', true,  ''),
  ('water_use',    'beside_it',        'requires_still_water', false,
   'the water is not part of this evening');


-- ── 12 · WHAT venue_affordance DELIBERATELY DOES NOT SAY ─────────────
--
-- NO ROWS ARE WRITTEN HERE FOR `requires_still_water`, and the omission is a
-- decision rather than an oversight — db/035 exists because db/033 added a code and not
-- its matrix, so an unwritten affordance is exactly the failure this file is
-- meant to have learned from. It is written down instead.
--
-- `poolside` is the temptation: a host who says her party is poolside has a
-- pool, and one row would say so. It is refused because rule 21 asks who owns
-- the fact, and `water_access` owns it. Two owners drift, and the drift here
-- would be silent and specific — a host who answers `poolside` and then `none`
-- (a drained pool, a pool the rental locked, a "poolside" terrace overlooking
-- somebody else's) would have two rows disagreeing, and which one won would
-- depend on a composition rule nobody wrote down.
--
-- The consequence, stated so it is not discovered: an application from before
-- 2026-08-h has no water answer, so `requires_still_water` has no claim from any
-- source and NOTHING IS PRUNED for it. That is correct. Those hosts were never
-- asked, and db/020's default — "an ingredient that makes no claim is eligible
-- everywhere; a room with no row affords it" — is the safe direction in both
-- directions at once.
--
-- `not_decided` on the room question likewise gains nothing here: db/020
-- already seeds it as affording everything, with the argument that "the
-- alternative would quietly hand the most cautious Revelle in the library to
-- the woman who was least sure".


do $$
declare
  v_host int; v_reqs int; v_opts int; v_facets int;
begin
  select count(*) into v_host   from host_affordance;
  select count(*) into v_reqs   from structural_requirement;
  select count(*) into v_opts   from quiz_option
   where quiz_field in ('indoor_outdoor', 'water_access', 'water_use');
  select count(*) into v_facets from facet
   where dimension_code in ('indoor_outdoor', 'water_access', 'water_use');

  raise notice '[049] % host affordance row(s) over % requirement(s); % answers, % facets',
    v_host, v_reqs, v_opts, v_facets;

  -- THE GUARD db/035 WROTE FOR ITSELF, for the same reason. An affordance table
  -- that refuses nowhere is a grade wearing a column, and the failure is silent
  -- by construction.
  if (select count(*) from host_affordance where not provided) = 0 then
    raise exception '[049] not one host answer REFUSES anything, which is the '
      'thing this migration exists to make possible';
  end if;

  -- Every answer registered must be reachable from the enum, and every enum
  -- value must be registered. A drift here is an option that means nothing
  -- (rule 16) or an affordance keyed to an answer no host can give.
  if v_opts <> (select count(*) from unnest(enum_range(null::indoor_outdoor)))
              + (select count(*) from unnest(enum_range(null::water_access)))
              + (select count(*) from unnest(enum_range(null::water_use)))
  then
    raise exception '[049] quiz_option and the three enums disagree about what '
      'a host can answer';
  end if;
end $$;
