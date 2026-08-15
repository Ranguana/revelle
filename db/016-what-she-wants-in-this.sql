-- Revelle Société — WHAT SHE ACTUALLY WANTS IN THIS
--
-- Applied by scripts/migrate.mjs after 015, inside one transaction together
-- with its schema_migrations ledger row. Nothing here may be a statement that
-- refuses to run in a transaction. New file, never applied anywhere, so no
-- SENTINELS entry in scripts/migrate.mjs.
--
-- ─────────────────────────────────────────────────────────────────────
-- THREE QUESTIONS, ONE MIGRATION
--
-- They are one piece of work because they are one question asked three ways —
-- what does she want IN this — and because all three land on the same four
-- objects: the vocabulary, the bridge from an answer to that vocabulary, the
-- columns her answer lands in, and the third gate db/014 left open.
--
--   1. THE MAKING AXIS.  How much of the evening is MADE and how much ARRIVES
--      FINISHED. Authored by the founder for menus in docs/menus.md — actually
--      made · mostly made · half made · bought and arranged — and generalised
--      here to govern the whole Revelle, asked once.
--   2. PLAY APPETITE.    Whether there is organised play at all, and how much.
--      Plus the four things the founder's games genuinely are that the
--      vocabulary could not say (src/lib/games.ts names them).
--   3. THE OPT-OUTS.     "Maybe someone won't even be serving food, in that
--      case no menu." db/014 built the whole mechanism and stopped one step
--      short, because nothing in the application could state the fact. This is
--      that step.
--
-- ── A NOTE ON WHAT IS NOT HERE ──────────────────────────────────────
--
-- No new engine behaviour. planSlots already removes an excluded slot before
-- anything is scoped or filled; scopePools already weights rather than
-- eliminates; recordCatalogueGaps already refuses to file work nobody can do.
-- Everything below is vocabulary, a bridge, and somewhere to put her answer.
--
-- ─────────────────────────────────────────────────────────────────────
-- CONTENTS
--
--   quiz_option_facet.answer_weight  an answer with a DEGREE and a SIGN
--   making                           the axis. one bipolar facet
--   play                             the appetite. one bipolar facet
--   food_service                     what is served, and whether
--   group_fun, four more             making · the room · a secret · stakes
--   the columns                      how_made, play_appetite, food_plan
--   the bridge                       every new option, resolved
--   quiz_option_exclusion            an answer that removes a slot
--   quiz_response_exclusion          the read hostExclusions() takes
--   the menu projection, repointed   from menu.cooking onto the new axis
--   good_natured                     a tone that resolved to nothing
-- ─────────────────────────────────────────────────────────────────────


-- ── quiz_option_facet.answer_weight ──────────────────────────────────
--
-- AN ANSWER WITH A DEGREE, AND THE REASON THE MAKING AXIS NEEDS ONE.
--
-- Until now every answer asserted its facet at full strength: quiz_option_facet
-- said WHICH facet and WHETHER the claim was a veto, and src/lib/selection/
-- vector.ts added it at ±statedWeight. That is right for a question whose
-- options are unordered — "old-world Riviera" is not more or less than "desert
-- modern", it is a different thing.
--
-- It is wrong for an ORDINAL question, and the making axis is ordinal. Bought
-- and arranged is nearer half made than it is to actually made. With one facet
-- per value, a host who wants everything to arrive finished would score a
-- half-made menu exactly as she scores a fully cooked one — both are simply
-- facets she did not claim — and the pool would not tilt at all in the middle,
-- which is where most of it lives.
--
-- So: WEIGHT, signed, -1..1, excluding zero. The same convention every tag
-- table in db/002 already uses, applied to the answer side.
--
--   +1.000  she is asking for exactly this
--   +0.400  she leans this way
--   -1.000  she is asking for the opposite of this, AND IS NOT VETOING IT
--
-- ── A NEGATIVE WEIGHT IS NOT A VETO. THIS IS THE WHOLE POINT ────────
--
-- `answer_polarity` and `answer_weight` answer two different questions and must
-- never be collapsed:
--
--   answer_polarity  IS THIS A VETO. 'negative' means she said it would ruin
--                    the evening, and buildVector turns it into a dealbreaker
--                    that ELIMINATES every ingredient carrying that facet.
--                    Only `anti_preferences` is asked that way.
--   answer_weight    HOW MUCH, AND WHICH END. A pull, scored, never a filter.
--
-- If "bought and arranged" were expressed as a negative POLARITY on a
-- made-by-hand facet, every menu that involves cooking would be deleted from
-- her pool and she would be shown an empty table. The founder's instruction is
-- the opposite: show her the most finished versions of what there is. Several
-- of her own menus name their own escape hatch inline — "lobster meat can be
-- bought picked", "chicken can be bought rotisserie", "ordered whole and
-- restaged" — which is a menu bending rather than a menu disqualifying itself.
-- A weight bends. A veto does not.
--
-- The check below makes that structural: a veto has no degree.

alter table quiz_option_facet
  add column answer_weight numeric(4,3) not null default 1.000;

alter table quiz_option_facet
  add constraint quiz_option_facet_weight_signed
    check (answer_weight >= -1 and answer_weight <= 1 and answer_weight <> 0),
  add constraint quiz_option_facet_veto_has_no_degree
    check (answer_polarity = 'positive' or answer_weight = 1.000);

comment on column quiz_option_facet.answer_weight is
  'How strongly, and in WHICH DIRECTION, choosing this option claims the facet. '
  'Signed -1..1, never zero, exactly as every tag table in db/002. A NEGATIVE '
  'weight is a preference for the other end of an ordinal axis and is scored; '
  'it is not a veto. Vetoes are answer_polarity = ''negative'' and only '
  '''anti_preferences'' is asked that way. See db/016.';


-- ─────────────────────────────────────────────────────────────────────
-- 1. THE MAKING AXIS
-- ─────────────────────────────────────────────────────────────────────
--
-- "How much cooking" is the founder's, and it is good. docs/menus.md carries
-- it on every one of the twenty menus with four values, and db/012 promoted
-- those four to a `cooking` dimension projected one-for-one from menu.cooking.
--
-- What this migration does is take that axis off the plate. The same question
-- governs the printed matter (letterpress that arrives versus a PDF she runs
-- off and folds), the edit (a finished object versus materials), the table
-- (arranged by her versus delivered), and the games (a game that is a shopping
-- trip versus a bowl and a pen). It is ONE fact about how she wants to spend
-- her hands, and asking it four times would be four ways to contradict herself.
--
-- ── IT IS NOT A BUDGET QUESTION ─────────────────────────────────────
--
-- `spend_per_person` (db/006) asks about money and this does not. The two are
-- independent in both directions and the catalogue has to hold both: a host can
-- spend a great deal and want to make everything herself, in expensive
-- materials, with her own hands; and a host can spend very little and want
-- every last thing to arrive finished. If "luxury" is ever implemented as
-- "expensive" here, the wrong thing has been built. Luxury on this axis means
-- SOMEBODY ELSE DID THE WORK AND IT SHOWS IN THE FINISH.
--
-- ── WHY ONE SIGNED FACET AND NOT THE FOUR AUTHORED VALUES ───────────
--
-- The brief said to start from the founder's four and to argue any change, so:
-- the four values survive intact where they are read. They are still the
-- `cooking_level` enum on every menu, still the four sentences a curator sees,
-- and still the four answers a host chooses between — the labels she taps ARE
-- the founder's four. What changes is only the internal representation, from
-- four independent terms to one signed axis, for two reasons:
--
--   1. ORDER. Four facets cannot say that half made is nearer to bought than
--      to actually made. One signed axis says it for free, and that ordering is
--      the entire behaviour the founder asked for: not "eliminate", but "show
--      her the most finished versions of them".
--   2. PRECEDENT. db/007 made exactly this call for `theatricality`, and stated
--      it: "MANNER is BIPOLAR. One facet per axis, signed. Two facets would be
--      the same axis said twice, and two representations of one fact drift."
--
-- The four `cooking` facets are therefore DEPRECATED rather than deleted, at
-- the bottom of this file, and the menu projection is repointed. Nothing that
-- references them stops resolving; they are simply not tagged again.

insert into facet_dimension (code, label, description, position) values
  ('making', 'How much is made',
   'How much of the evening is MADE and how much ARRIVES FINISHED. The '
   'founder''s "how much cooking" (docs/menus.md), generalised off the plate to '
   'govern the menu, the printed matter, the edit, the table and the games. '
   'NOT a budget: money is spend_per_person in db/006, and the two are '
   'independent — expensive materials worked by hand sit at one end of this '
   'axis, cheap things that arrive finished at the other. See db/016.',
   180);

insert into facet (dimension_code, code, label, description, provenance, notes) values
  ('making', 'made_by_hand', 'Made by hand',
   'Positive: made here, and the making is part of the evening. Negative: it '
   'arrives finished, and the finish is the point.',
   'curator',
   'Bipolar, like db/007''s theatricality. Projected onto menus from '
   'menu.cooking by menu_project_facets(); hand-tagged on every other pool. A '
   'WEIGHT and never a filter — see the note on answer_weight in db/016.');


-- ─────────────────────────────────────────────────────────────────────
-- 2. PLAY APPETITE
-- ─────────────────────────────────────────────────────────────────────
--
-- "The questions have to gauge how interactive they want any games to be and
-- what kind of games they like."
--
-- Three things, and they are not one question:
--
--   APPETITE      does she want organised play at all. This one can be an
--                 outright no, and the no is a FACT — it removes the game
--                 slots. That is the `play` dimension below plus the
--                 `no_games` exclusion further down.
--   PERFORMING    NOTHING IS ADDED FOR THIS, because it is already asked, twice
--                 and correctly. `group_fun.perform` ("Sing, badly, on
--                 purpose") is what actually weights the game pool — every game
--                 in src/lib/games.ts carries a `perform` tag. And the voice
--                 question (db/007) carries a whole `performance` group of
--                 seven tones, including `never_performs` at theatricality
--                 -1.0, which is a group that would rather die than get up.
--                 A third question would be a third representation of one fact,
--                 and the first two already disagree usefully: one is about the
--                 room, the other about the writing.
--   WHAT KIND     four options on the existing "how does this group actually
--                 have fun" question, below — not four hidden facets. A facet
--                 only earns its place when a host can ANSWER in it, which is
--                 the argument src/lib/games.ts makes at length about its own
--                 four missing terms.

insert into facet_dimension (code, label, description, position) values
  ('play', 'How much play',
   'Whether the evening is programmed at all, and how much. Distinct from '
   'group_fun, which says what KIND of fun her people have — a group can be '
   'wildly competitive and still want nothing organised. Distinct again from '
   'the anti-preference "forced participation", which is a dislike and is '
   'scored as a veto. See db/016.',
   190);

insert into facet (dimension_code, code, label, description, provenance, notes) values
  ('play', 'organised_play', 'Organised play',
   'Positive: the evening has things that are run, with rules and a moment '
   'they start. Negative: nothing is organised and the evening runs itself.',
   'curator',
   'Bipolar. A negative answer here also carries the slot_exclusion '
   '''no_games'' through quiz_option_exclusion — the weight and the fact are '
   'two different things and both are recorded.');

-- ── the four things the founder's games are ──────────────────────────
--
-- src/lib/games.ts wrote these down and refused to insert them until a host
-- could answer in them. She can now: they are four more options on the
-- existing `group_fun` question, which is where a curator would look for them
-- and where they join the ten already there.
--
-- They are NOT a new dimension. group_fun is "how the group has fun" and every
-- one of these is a way of having fun; a `game_kind` dimension would split one
-- question in two and leave the engine joining across both.

insert into facet (dimension_code, code, label, description, provenance, notes) values
  ('group_fun', 'make_something', 'Make something with their hands',
   '', 'quiz',
   'Art Battle is a room of people with paint on their hands. Before this the '
   'nearest term was cook_together, which is the only other physical one. '
   'Named in src/lib/games.ts as the first of four the vocabulary could not say.'),
  ('group_fun', 'work_the_room', 'Talk a stranger into something',
   '', 'quiz',
   'The Reverse Scavenger Hunt and the Secret Cards run on persuasion. '
   '`compete` was the nearest term and competition is not persuasion.'),
  ('group_fun', 'keep_a_secret', 'Keep something to themselves all night',
   '', 'quiz',
   'Two of the founder''s games turn on nobody knowing what anybody else is '
   'doing. Nothing in the vocabulary expressed concealment.'),
  ('group_fun', 'play_for_stakes', 'Play for something worth winning',
   '', 'quiz',
   'Objects to win and the willingness to gamble one. Two games are built on '
   'it, and the Party Bucks economy exists because of it.');


-- ─────────────────────────────────────────────────────────────────────
-- 3. WHAT IS SERVED, AND WHETHER
-- ─────────────────────────────────────────────────────────────────────
--
-- The question exists to state a FACT — is there food — and while it is being
-- asked it may as well say what shape the food takes, because the menu pool
-- already distinguishes them: menu 2 in docs/menus.md is "a cocktail party,
-- standing, not dinner" in the author's own words, and menus 14 and 17 are the
-- same. One question, two useful answers, no second screen.
--
-- `seated_dinner` is bipolar for the reason above: standing food does not
-- merely fail to be a seated dinner, it is the other end of the same axis.
-- `table_elsewhere` and `no_meal` are separate terms rather than further points
-- on it, because they are not degrees of dinner — they are facts about who is
-- cooking and whether anybody is. Both are tagged on nothing today. That is
-- honest: they are what her answer MEANS, and the pool that will carry them
-- (coupes, ice, a bar cart, an edit for an evening with no plates) is not
-- authored yet.

insert into facet_dimension (code, label, description, position) values
  ('food_service', 'What is served',
   'Whether there is a meal, and what shape it takes. The dimension the '
   '''no_food'' exclusion is answered in — see db/014, which refused to infer '
   'it from the room she is in.',
   200);

insert into facet (dimension_code, code, label, description, provenance, notes) values
  ('food_service', 'seated_dinner', 'Everyone sits down',
   'Positive: a table, courses, and nobody standing up between them. Negative: '
   'food that is picked at standing, which docs/menus.md authors as its own '
   'kind of menu rather than as a lesser dinner.',
   'curator', 'Bipolar.'),
  ('food_service', 'table_elsewhere', 'A table booked somewhere else',
   'Somebody else is choosing the food', 'curator',
   'Carries the ''no_food'' exclusion: the house cannot compose a menu it is '
   'not choosing. Distinct from environment = ''restaurant_or_venue'', which '
   'db/014 refused because a room says WHERE and not WHETHER. This says '
   'whether, in her own answer.'),
  ('food_service', 'no_meal', 'Drinks, and nothing that needs a plate',
   '', 'curator',
   'Nothing is served. Carries the ''no_food'' exclusion. Label and hint are '
   'the option''s own words, because this facet maps one-to-one onto one '
   'answer — scripts/check-facets.mjs compares them and should stay quiet.');


-- ─────────────────────────────────────────────────────────────────────
-- THE COLUMNS
-- ─────────────────────────────────────────────────────────────────────
--
-- Three single-select answers, three enum-typed columns, exactly like
-- occasion_type, environment_type, guest_count_band, spend_per_person_band and
-- soundtrack_delivery before them. Nullable, because every response written
-- before today has no answer and is not missing one — the same contract db/005
-- and db/006 established for their own questions.
--
-- ADDING A VALUE LATER is `alter type … add value`, which PostgreSQL permits
-- inside a transaction as long as the new value is not USED in the same
-- transaction. Retiring one is what db/016's sibling question already
-- demonstrates: leave the value in the enum forever, stop offering the option
-- in src/lib/quiz.ts, and every stored answer keeps resolving.

create type making_level as enum (
  'actually_made',
  'mostly_made',
  'half_made',
  'bought_and_arranged'
);

comment on type making_level is
  'How much of the evening she wants to make. The founder''s four values from '
  'docs/menus.md, in descending order of work — deliberately the same four '
  'names as cooking_level in db/012, because it is the same axis generalised '
  'off the plate. See db/016.';

create type play_appetite as enum (
  'none',
  'one_thing',
  'underneath',
  'the_point'
);

create type food_plan as enum (
  'sit_down',
  'standing',
  'eating_out',
  'drinks_only'
);

alter table quiz_response
  add column how_made      making_level,
  add column play_appetite play_appetite,
  add column food_plan     food_plan;

comment on column quiz_response.how_made is
  'How much of it she wants to make. NOT a budget — see db/016.';
comment on column quiz_response.play_appetite is
  'Whether the evening is programmed at all. ''none'' removes the game slots '
  'through quiz_option_exclusion, and is a FACT rather than a dislike.';
comment on column quiz_response.food_plan is
  'What is served. ''eating_out'' and ''drinks_only'' both remove the menu.';


-- ─────────────────────────────────────────────────────────────────────
-- THE BRIDGE
-- ─────────────────────────────────────────────────────────────────────
--
-- Every option of every new question, resolved to a facet, so that
-- scripts/check-facets.mjs can prove that nothing she can tap means nothing.
-- The weights are the whole design of the making axis and are worth reading as
-- a ladder rather than as four rows.

insert into quiz_option_facet (quiz_field, option_code, facet_id, answer_polarity, answer_weight)
select v.quiz_field, v.option_code, f.id, 'positive', v.weight
  from (values
         -- The making axis. +1 at the made end, -1 at the finished end, and
         -- the two middle values inside them, so that a host at either extreme
         -- prefers the near middle to the far one.
         ('how_made',      'actually_made',       'making', 'made_by_hand',    1.000),
         ('how_made',      'mostly_made',         'making', 'made_by_hand',    0.400),
         ('how_made',      'half_made',           'making', 'made_by_hand',   -0.400),
         ('how_made',      'bought_and_arranged', 'making', 'made_by_hand',   -1.000),

         -- Play appetite. 'none' is a real -1 and not merely an absence: a
         -- host who wants nothing organised should also be pulled away from a
         -- deck of cards in her edit, and the game slots she no longer has are
         -- removed by the exclusion below rather than by this weight.
         ('play_appetite', 'none',                'play', 'organised_play',   -1.000),
         ('play_appetite', 'one_thing',           'play', 'organised_play',    0.300),
         ('play_appetite', 'underneath',          'play', 'organised_play',    0.500),
         ('play_appetite', 'the_point',           'play', 'organised_play',    1.000),

         -- What is served.
         ('food_plan',     'sit_down',      'food_service', 'seated_dinner',   1.000),
         ('food_plan',     'standing',      'food_service', 'seated_dinner',  -0.800),
         ('food_plan',     'eating_out',    'food_service', 'table_elsewhere', 1.000),
         ('food_plan',     'drinks_only',   'food_service', 'no_meal',         1.000)
       ) as v(quiz_field, option_code, dimension, facet_code, weight)
  join facet f on f.dimension_code = v.dimension and f.code = v.facet_code;

-- The four new ways to have fun. Generated from the dimension exactly as
-- db/002, 005, 006 and 007 generate theirs — the facet code IS the option code,
-- because both come from the same list.
insert into quiz_option_facet (quiz_field, option_code, facet_id, answer_polarity)
select 'group_fun', f.code, f.id, 'positive'
  from facet f
 where f.dimension_code = 'group_fun'
   and f.code in ('make_something', 'work_the_room', 'keep_a_secret',
                  'play_for_stakes');


-- ─────────────────────────────────────────────────────────────────────
-- quiz_option_exclusion — AN ANSWER THAT REMOVES A SLOT
-- ─────────────────────────────────────────────────────────────────────
--
-- db/014 built the third gate and named exactly what was missing: "somewhere to
-- record the answer against the response — the shape quiz_response_facet uses,
-- keyed on slot_exclusion.code. Deliberately not created here: a table with no
-- writer and no reader is a guess about a question nobody has written yet."
--
-- The question is now written, so here is the table, in that shape.
--
-- ── WHY THIS IS A SECOND BRIDGE AND NOT A COLUMN ON THE FIRST ───────
--
-- Because a facet and an exclusion are different KINDS of consequence, and one
-- option can have both. "Drinks, and nothing that needs a plate" asserts a
-- facet (no_meal, which the edit can be tagged against) AND states a fact (no
-- menu, which removes a slot before anything is scored). Hanging the exclusion
-- off quiz_option_facet would make every future exclusion require a facet to
-- carry it, and would put a structural fact inside the table whose entire job
-- is taste.
--
-- MANY OPTIONS MAY CARRY ONE EXCLUSION and one option may carry several: the
-- primary key is all three columns. Two different answers about food both mean
-- no menu, and neither is more true than the other.

create table quiz_option_exclusion (
  -- QuizField.id in src/lib/quiz.ts.
  quiz_field     text not null check (quiz_field ~ '^[a-z][a-z0-9_]*$'),
  -- QuizOption.code. Permanent, by the contract in quiz.ts.
  option_code    citext not null,
  exclusion_code text not null references slot_exclusion(code) on delete restrict,
  -- Why this answer means this fact, for whoever reads the row in five years.
  note           text not null default '',
  created_at     timestamptz not null default now(),

  primary key (quiz_field, option_code, exclusion_code)
);

create index quiz_option_exclusion_code_idx
  on quiz_option_exclusion (exclusion_code);

comment on table quiz_option_exclusion is
  'The bridge from an ANSWER to a slot_exclusion — the second half of db/014, '
  'which built the gate and left this seam open because no question could '
  'state the fact yet. Distinct from quiz_option_facet: that table says what an '
  'answer MEANS about taste, this one says what it removes from her plan.';

insert into quiz_option_exclusion (quiz_field, option_code, exclusion_code, note) values
  ('food_plan', 'drinks_only', 'no_food',
   'Nothing is served. There is no meal for a menu to describe, and nothing '
   'for the house to author — this is not a gap.'),
  ('food_plan', 'eating_out', 'no_food',
   'The table is booked and somebody else is choosing the food. Note that this '
   'is HER answer about food, not an inference from the room: db/014 refused '
   'environment = ''restaurant_or_venue'' for exactly that reason and the '
   'refusal stands.'),
  ('play_appetite', 'none', 'no_games',
   'She does not want games. A fact about the evening, and not the dislike '
   '''forced participation'' — a woman can veto forced fun and still want a '
   'game, which is why the two are asked separately and carried separately.');

-- ── quiz_response_exclusion ──────────────────────────────────────────
--
-- What hostExclusions() reads. A view rather than a table for the same reason
-- quiz_response_facet is a view: it must not be able to disagree with
-- quiz_response, which is append-only and is the evidentiary record.
--
-- The `values` list is the set of fields that can carry an exclusion, and it is
-- deliberately short rather than a copy of quiz_response_facet's list. An
-- exclusion carried by some other field in the future is one more line here.

create view quiz_response_exclusion as
select qr.id         as quiz_response_id,
       qr.customer_id,
       qr.created_at as observed_at,
       qr.quiz_version,
       src.quiz_field,
       ans.option_code,
       x.exclusion_code,
       e.label       as exclusion_label,
       e.description as exclusion_description,
       x.note
  from quiz_response qr
  cross join lateral (
    values ('food_plan',     array[qr.food_plan::text]),
           ('play_appetite', array[qr.play_appetite::text])
  ) as src(quiz_field, option_codes)
  cross join lateral unnest(src.option_codes) as ans(option_code)
  join quiz_option_exclusion x
    on x.quiz_field = src.quiz_field and x.option_code = ans.option_code
  join slot_exclusion e on e.code = x.exclusion_code;

comment on view quiz_response_exclusion is
  'One row per slot_exclusion a response states. Read by '
  'src/lib/selection/catalogue.ts and passed verbatim into hostExclusions() as '
  '`recorded`, which is the one line db/014 said would be needed.';


-- ─────────────────────────────────────────────────────────────────────
-- quiz_response_facet, REDEFINED
-- ─────────────────────────────────────────────────────────────────────
--
-- Three new fields in the source list, and `answer_weight` exposed alongside
-- `polarity` so that the vector can carry a degree. Everything else is byte for
-- byte what db/007 left.
--
-- A null single-select unnests to one null, which joins nothing — so a response
-- written before these questions existed contributes no rows here rather than
-- wrong ones.

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
           -- Added by db/016.
           ('how_made',         array[qr.how_made::text]),
           ('play_appetite',    array[qr.play_appetite::text]),
           ('food_plan',        array[qr.food_plan::text])
  ) as src(quiz_field, option_codes)
  cross join lateral unnest(src.option_codes) as ans(option_code)
  join quiz_option_facet m
    on m.quiz_field = src.quiz_field and m.option_code = ans.option_code
  join facet f on f.id = m.facet_id;

-- ── record_quiz_signals, corrected for the sign ──────────────────────
--
-- The projection into taste_signal has to carry the direction of the claim or
-- it records the opposite of what she said. A woman who answered "bought and
-- arranged" — made_by_hand at -1 — would otherwise enter her own history as a
-- POSITIVE signal for making things by hand, and every later Revelle would be
-- built against it.
--
-- polarity here is the SIGN OF THE CLAIM, which is not the same question as
-- whether it is a veto. That distinction is deliberate and is db/002's: a
-- negative in taste_signal is a soft negative, scored at a fifth of an
-- equivalent positive by src/lib/selection/vector.ts, and a veto lives only in
-- this application's own `anti_preferences`. A negative-weight answer therefore
-- becomes a soft negative in her history, which is exactly what it is.

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
   where v.quiz_response_id = p_quiz_response_id;

  get diagnostics v_written = row_count;
  return v_written;
end;
$$;


-- ─────────────────────────────────────────────────────────────────────
-- THE MENU PROJECTION, REPOINTED
-- ─────────────────────────────────────────────────────────────────────
--
-- EVERY MENU MAPS ONTO THE NEW AXIS FROM ITS AUTHORED VALUE, AND NOTHING IS
-- RE-AUTHORED. docs/menus.md is untouched by this migration; menu.cooking is
-- still the authored field and still the thing a curator edits. This function
-- is still the one-way projection db/012 built, pointed at one facet instead of
-- four.
--
-- ── THE ESCAPE HATCH, AND WHY IT IS NOT DERIVED HERE ────────────────
--
-- "Several menus name an escape hatch inline (lobster bought picked, rotisserie
-- chicken, jarred fish soup, the clambake ordered whole). Those belong on the
-- menu record, not in a separate tier — they are how the menu bends."
--
-- The bending is what this axis DOES: her answer weights the pool and never
-- filters it, so a host who wants everything to arrive finished is shown the
-- most finished menus there are rather than an empty table. That is the
-- behaviour the escape hatches describe, and it is now true of every menu
-- whether or not it has one.
--
-- What is NOT done here is softening a particular menu's weight because its
-- `cooking_note` is non-empty, and the reason is worth recording so nobody
-- adds it later thinking it was overlooked. The note is PROSE, and it is not
-- only escape hatches:
--
--     menu-01  "lobster meat can be bought picked"          an escape hatch
--     menu-03  "all of it"                                  the opposite
--     menu-07  "grill required"                             a requirement
--     menu-09  "ambitious"                                  a warning
--     menu-12  "starts before noon"                         a schedule
--
-- Reading a hatch out of that means matching on words, which is a guess applied
-- to somebody's writing — precisely what db/012 refused when it declined to
-- split `dishes` on commas. Softening menu-03 because the author wrote "all of
-- it" would move the MOST made menu in the catalogue toward the finished end.
--
-- THE SEAM, for whoever wants it structural: it is a column — `bends_to
-- cooking_level`, null on most menus — set by a curator against the four
-- docs/menus.md itself names in "Notes for the catalogue". Then the projection
-- takes the midpoint of the two levels and nothing is guessed. That is
-- authoring work and it is hers, not a migration's.

create or replace function menu_project_facets() returns trigger
language plpgsql as $$
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

  -- How much is made. The four authored values as four points on one signed
  -- axis. `do update` rather than `do nothing`, because unlike season this is
  -- one facet whose WEIGHT changes when a curator moves a menu up or down the
  -- ladder — leaving the old weight in place would be the drift a one-way
  -- projection exists to prevent.
  insert into menu_facet (menu_id, facet_id, weight, provenance, note)
  select new.id, f.id,
         case new.cooking
           when 'actually_made'       then  1.000
           when 'mostly_made'         then  0.400
           when 'half_made'           then -0.400
           when 'bought_and_arranged' then -1.000
         end,
         'curator', 'Projected from menu.cooking.'
    from facet f
   where f.dimension_code = 'making' and f.code = 'made_by_hand'
  on conflict (menu_id, facet_id) do update
        set weight = excluded.weight,
            note   = excluded.note;

  return null;
end;
$$;

-- The four cooking facets: deprecated, never deleted. Every reference keeps
-- resolving to the same row with the same meaning; they are simply not tagged
-- again. Same treatment `rented_house` got in src/lib/quiz.ts.
delete from menu_facet mf
 using facet f
 where f.id = mf.facet_id and f.dimension_code = 'cooking';

update facet
   set status = 'deprecated',
       deprecated_at = now(),
       notes = 'Superseded by making/made_by_hand in db/016, which says the '
               'same four things on one signed axis so that the middle of the '
               'ladder is ordered. The four VALUES are not retired — they are '
               'still cooking_level on every menu and still the four answers a '
               'host chooses between. Only this representation is.'
 where dimension_code = 'cooking';

update facet_dimension
   set label = 'How much cooking (retired)',
       description = 'RETIRED by db/016 in favour of the `making` dimension, '
                     'which is the same axis generalised off the plate. Kept '
                     'so that nothing which referenced it stops resolving.'
 where code = 'cooking';

-- Re-run the projection over every menu. `update … set cooking = cooking` fires
-- an `update of cooking` trigger whether or not the value changed, which is
-- exactly what is wanted: the authored value is unchanged and the derived row
-- is rebuilt from it.
update menu set cooking = cooking;

-- menu_card lists HAND-APPLIED tags only, and the making facet is projected, so
-- it joins season and cooking in the exclusion list. Byte for byte db/012's
-- view otherwise.
create or replace view menu_card as
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
       and f.dimension_code not in ('season', 'cooking', 'making')
  ) t on true;


-- ─────────────────────────────────────────────────────────────────────
-- good_natured — A TONE THAT RESOLVED TO NOTHING
-- ─────────────────────────────────────────────────────────────────────
--
-- Not part of this piece of work, and fixed here because it makes
-- scripts/check-facets.mjs fail before it reaches the questions above.
--
-- src/lib/voice.ts carries fifty-one tones; db/007 inserted fifty. The tone
-- `good_natured` ("Funny without anyone being the joke") has a tile, a mark in
-- tone-marks.tsx and four authored weights in the module, and no rows anywhere
-- — which is precisely the failure db/007 exists to prevent: she can tap it, it
-- is stored, and it means nothing to the rest of the system.
--
-- The weights below are copied verbatim from src/lib/voice.ts, where they were
-- authored. Nothing is invented here.

insert into facet (dimension_code, code, label, description, provenance) values
  ('voice_tone', 'good_natured', 'Funny without anyone being the joke', '', 'quiz');

insert into quiz_option_facet (quiz_field, option_code, facet_id, answer_polarity)
select 'voice_tones', f.code, f.id, 'positive'
  from facet f
 where f.dimension_code = 'voice_tone' and f.code = 'good_natured';

insert into voice_tone_facet (tone_facet_id, voice_facet_id, weight)
select t.id, v.id, m.weight
  from (values
         ('good_natured', 'humour_warm',   1.0),
         ('good_natured', 'warmth',        0.7),
         ('good_natured', 'earnestness',   0.4),
         ('good_natured', 'irreverence',  -0.6)
       ) as m(tone, facet, weight)
  join facet t on t.dimension_code = 'voice_tone' and t.code = m.tone
  join facet v on v.dimension_code = 'voice'      and v.code = m.facet;


-- ─────────────────────────────────────────────────────────────────────
-- WHAT THIS DELIBERATELY DOES NOT DO
--
--   · No question about whether her people will PERFORM. Asked already, twice:
--     group_fun.perform weights the game pool, and db/007's whole `performance`
--     group of tones weights the writing. A third would be a third copy.
--   · No exclusion derived from an answer that means something else. db/014
--     refused environment = 'restaurant_or_venue' and anti_preferences =
--     'forced_fun', and both refusals stand — the rows in
--     quiz_option_exclusion come only from questions that ask the fact.
--   · No new slot made excludable. `honouring`, `the_moment` and
--     `day_material` draw from the game pool and are NOT games: a woman who
--     wants no games still wants her sister toasted. db/014 argues it at
--     length and nothing here widens that list.
--   · No price on the making axis. It is not a budget question, and any join
--     between it and spend_per_person would make it one.
-- ─────────────────────────────────────────────────────────────────────
