-- ═══════════════════════════════════════════════════════════════════════
-- db/070 — JACKETS, OR NOT. The third fed column.
--
-- Founder, 2026-09-06:
--
--   "Ask two more evening questions and write them into `fedBy`. Next, in this
--    order: Dress — 'this evening, jackets or not.' Weakest separator, most
--    legible question, not `group_fun`/`dress_up` (that is her people).
--    ...
--    Until those two questions exist, growing the catalogue and tightening
--    gate 3 are housekeeping. The pick is still a coin among whoever shares
--    her `how_it_ends` and `meal_time`."
--
-- ── WHAT THE COIN LOOKS LIKE, COUNTED ────────────────────────────────
--
-- Two of nine matrix columns are fed. Twenty rooms therefore sort into SEVEN
-- groups, and the largest holds SEVEN ROOMS — Westhampton, New Orleans,
-- Havana, Las Vegas, Tahiti, St. Moritz and Acapulco are indistinguishable to
-- the structural ranker. For a host in that bucket the engine narrows twenty
-- rooms to seven and picks one, and cannot say why. Her sentence is the
-- product requirement: "she can be told why."
--
-- ── WHY DRESS IS FIRST, AND IT IS NOT BECAUSE IT IS THE BEST ─────────
--
-- It is the WEAKEST separator that is worth having. Measured by
-- `npm run check:matrix` over the current twenty rows:
--
--   schedule 145 · ending 133 · size 124 · volume 119 · starts 108
--   food 107 · arrival 92 · DRESS 84 · spectacle 36        (of 190 pairs)
--
-- Eighth of nine. It goes first because it is the most legible question that
-- can be asked of a host and because it has TWO levels, so the bridge is four
-- rows and the question is one screen. It proves the mechanism end to end
-- before `schedule` — the strongest separator at 145, and the one the founder
-- names as the worst thing to fake — is attempted.
--
-- ── THE TRAP, WHICH IS THE WHOLE REASON THIS IS A NEW QUESTION ───────
--
-- There is already a tile that looks like an answer. `group_fun` carries
-- `dress_up`, "commit to an outfit", and it would be one line of SQL to bridge
-- it onto this column. THAT LINE WOULD BE A LIE, twice over:
--
--   1. IT IS HER PEOPLE, NOT HER EVENING. A host whose friends love dressing
--      up has stated a property that travels unchanged to every party they
--      will ever attend. CLAUDE.md rule 1 exists because `no_speeches`,
--      `teasing` and `acquaintance` all died of this, and `fedBy`'s own
--      standard says an entry is "a promise that a HOST STATES THIS LEVEL, not
--      that a level could be guessed from something she said."
--
--   2. IT WOULD DOUBLE-COUNT. `group_fun` already feeds the tone vector. A tap
--      bridged here would move a room twice — once as taste, once as shape —
--      and the two layers would be scoring the same fact against each other.
--
-- So this migration adds a QUESTION, and the question is written in the idiom
-- of `how_it_ends`: a scene she recognises, not a preference she rates and not
-- a dislike she vetoes.
--
-- ── THE FOUR-PLACE RULE, WHICH THIS MIGRATION IS ONLY ONE OF ─────────
--
-- src/app/api/quiz/route.ts already records what it cost to learn:
-- "The three-place rule for a new quiz answer is: the column (a migration),
-- the projection (the view), and THIS LIST. Two of the three are easy to
-- remember." db/037 added `how_it_ends` everywhere except that list, so every
-- host answered the question, watched it be accepted, and had it stored only
-- in jsonb where nothing read it — CLAUDE.md rule 16 in its purest form.
--
-- All three are done here and in the same commit, plus the two that live
-- outside the database: the `fedBy` entry in data/destination-matrix.json and
-- the supplier in src/lib/selection/structure.ts. A test asserts those two
-- agree, so none of the five can drift alone.
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1 · THE LEVEL SET ────────────────────────────────────────────────
--
-- An enum, by db/001's rule: closed and structural. TWO values, and they are
-- the matrix's own `dress` levels spelled the same way, so every bridge below
-- is an identity and scripts/check-facets.mjs reports no translation.

create type evening_dress as enum ('dressed', 'plain');

comment on type evening_dress is
  'Whether THIS EVENING has a dress rule. The `dress` column of the structural '
  'matrix, values identical to its levels. NOT whether her people enjoy '
  'dressing up, which is group_fun/dress_up, is a property of the guests, and '
  'is measured in voice space (CLAUDE.md rule 1). Added by db/070.';

alter table quiz_response
  add column what_they_wear evening_dress;

comment on column quiz_response.what_they_wear is
  'Her answer to "Jackets, or not?". Null on every response written before '
  'db/070, which is what "she was never asked" has to look like from every '
  'reader — a null contributes no row to quiz_response_facet and therefore '
  'costs no room any distance (CLAUDE.md rule 3: silence is not evidence).';

-- ── 2 · THE DIMENSION ────────────────────────────────────────────────

insert into facet_dimension (code, label, description, position) values
  ('evening_dress', 'Jackets, or not',
   'Whether this evening has a dress rule — everyone dresses, or nobody '
   'changes. The `dress` column of the structural matrix, and a CONSTRAINT on '
   'which world fits rather than a taste: nothing in the catalogue is tagged '
   'here and the comparison is a level distance rather than a weight. '
   'DELIBERATELY NOT group_fun/dress_up, which describes her guests and feeds '
   'the tone vector. See db/070.',
   250);

-- ── 3 · THE TWO LEVELS ───────────────────────────────────────────────
--
-- Labels and descriptions are the option's own `label` and `hint` from
-- src/lib/quiz.ts, which is db/026's convention and is what lets
-- scripts/check-facets.mjs report zero drift on a clean tree.

insert into facet (dimension_code, code, label, description, provenance, notes) values
  ('evening_dress', 'dressed', 'Everyone dresses',
   'Somebody asks what to wear, and there is a real answer',
   'quiz',
   'Five rooms of twenty: New York, Las Vegas, Palm Springs, St. Moritz, '
   'Acapulco and Hong Kong. The minority level, and the one that splits the '
   'seven-room until-morning/evening pile.'),
  ('evening_dress', 'plain', 'Nobody changes',
   'People come from wherever they were, and that is the point',
   'quiz',
   'Fourteen rooms of twenty. The default shape of this catalogue, which is '
   'why the facet is a weak separator overall and still splits the one bucket '
   'that most needed splitting.');

-- ── 4 · THE ANSWER, REGISTERED BEFORE IT IS BRIDGED ──────────────────

insert into quiz_option (quiz_field, option_code) values
  ('what_they_wear', 'dressed'),
  ('what_they_wear', 'plain');

-- ── 5 · THE BRIDGE ───────────────────────────────────────────────────
--
-- An identity: the option code is the facet code is the matrix level. Three
-- files spelling one word the same way, which is the property db/037 wanted
-- and got for `how_it_ends` and could not get for the hour.
--
-- `answer_weight` 1.000 and polarity positive, like every structural bridge.
-- The weight is inert here — nothing in the catalogue is tagged in this
-- dimension, so it never reaches facetOverlap — and it is written rather than
-- left null because the column is not nullable and a structural row that
-- pretended to a weight of zero would look like a refusal.

insert into quiz_option_facet (quiz_field, option_code, facet_id, answer_polarity, answer_weight)
select v.quiz_field, v.option_code, f.id, 'positive', 1.000
  from (values
         ('what_they_wear', 'dressed', 'evening_dress', 'dressed'),
         ('what_they_wear', 'plain',   'evening_dress', 'plain')
       ) as v(quiz_field, option_code, dimension_code, facet_code)
  join facet f
    on f.dimension_code = v.dimension_code and f.code = v.facet_code;

-- ── 6 · THE PROJECTION ───────────────────────────────────────────────
--
-- The second of the three places. A column that is not in this view resolves
-- to no facet, and the engine ranks every room against a default while the
-- question looks answered from both ends — db/037's defect, which cost every
-- host's ending for weeks.

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
           ('indoor_outdoor',   array[qr.indoor_outdoor::text]),
           ('water_access',     array[qr.water_access::text]),
           ('water_use',        array[qr.water_use::text]),
           -- Added by db/070. Null contributes no row: a host who answered
           -- before this question existed is silent here, not `plain`.
           ('what_they_wear',   array[qr.what_they_wear::text])
  ) as src(quiz_field, option_codes)
  cross join lateral unnest(src.option_codes) as ans(option_code)
  join quiz_option_facet m
    on m.quiz_field = src.quiz_field and m.option_code = ans.option_code
  join facet f on f.id = m.facet_id;
