-- Revelle Société — WHEN IS IT
--
-- Applied by scripts/migrate.mjs after 025, inside one transaction together
-- with its schema_migrations ledger row. Same rule as every file before it:
-- nothing here may be a statement that refuses to run in a transaction.
--
-- New file, never applied anywhere, so no SENTINELS entry in
-- scripts/migrate.mjs.
--
-- ─────────────────────────────────────────────────────────────────────
-- THE HOLE THIS CLOSES
--
-- `season_band` has been on a menu since db/012, on a drink since db/017 and on
-- a dish since db/021. `season_strict` — "the season she wrote is a hard gate"
-- — has been on all three for as long, and db/021 wrote down exactly why it did
-- nothing:
--
--     "src/lib/selection/ reads `season` on any pool, and the application asks
--      no question that establishes WHEN the evening is, so there is nothing to
--      filter a season against."
--
-- db/023 said the same thing about the other axis it could not reach:
--
--     "src/lib/quiz.ts never asks the time of day, so nothing can currently
--      produce `brunch`, `lunch` or `late_supper`."
--
-- Both are one missing question, and the consequences of its absence are not
-- symmetrical with the consequences of a wrong answer. A dish tagged strictly
-- to summer was eligible in February — the Nantucket clambake at a winter
-- dinner — and a dish tagged for brunch was eligible NOWHERE, because a claim
-- narrows and there was no shape for it to claim. One question fixes both.
--
-- ─────────────────────────────────────────────────────────────────────
-- WHY A MONTH AND NOT A DATE, ARGUED
--
-- The obvious answer is a calendar. It is the wrong one, for five reasons in
-- descending order of force:
--
--   1. THE EXACT DATE ALREADY HAS A HOME, AND IT IS THE RIGHT ONE.
--      `quiz_response.event_date` exists since db/001, is MUTABLE by name in
--      the append-only guard, and is filled in by staff from the reply email
--      (src/app/desk/(signed-in)/applications/[id] has the field). It is the
--      exact sibling of `guest_count_confirmed`, and db/006 wrote the rule this
--      migration follows to the letter: her ANSWER is a band and is frozen; the
--      exact fact is learned afterwards, is mutable, and is a different column.
--      Putting a date picker in the application would be a second, frozen copy
--      of a fact we already know how to learn — and the two would disagree the
--      first time she moved the party.
--
--   2. quiz_response IS APPEND-ONLY, so a precise date is FALSE PRECISION.
--      db/006, on the guest count, and every word of it applies here:
--      "'Eleven' recorded in March, when four of them are maybes, is not more
--      accurate than 'nine to twelve' — it is the same guess with the
--      uncertainty deleted." A host applying for "sometime in June" who is
--      forced to pick the 13th has been made to lie, permanently.
--
--   3. NOTHING DOWNSTREAM CONSUMES A DAY. The engine reads `season_band`, which
--      is five bands and two answers about bands. A month resolves a season
--      exactly; a day resolves nothing further. Lead time is the one other
--      thing a date would buy and no code in src/ computes one — when it does,
--      it will want `event_date`, which is where a confirmed date lives.
--
--   4. EVERY OTHER ANSWER IS A TAP. A calendar widget is the one moment the
--      application turns into a form, which is db/006's argument against a
--      guest-count spinner and docs/copy-brief.md's against anything that
--      "frames the experience as a task". Twelve months and "still deciding" is
--      the same shape as the nine rooms and the eight guest bands.
--
--   5. IT WOULD BE EXEMPT FROM THE ONE CHECK THAT MATTERS.
--      scripts/check-facets.mjs walks `single` and `multi` fields and proves
--      every option resolves to vocabulary. A date field has no options, so it
--      would resolve to nothing and no check would say so — which is precisely
--      the silent failure db/002 built the facet layer to prevent.
--
-- A SEASON WOULD HAVE ASKED LESS AND SAID LESS. "Summer" is not something a
-- host says; a month is. And a season answer would have made the four hosts who
-- mean August indistinguishable from the ones who mean June, which is the one
-- distinction db/012 bothered to author (`high_summer`).
--
-- ─────────────────────────────────────────────────────────────────────
-- WHY THE MONTHS RESOLVE TO SEASON FACETS
--
-- Because the catalogue is already tagged in that dimension and in no other.
-- db/012, db/017 and db/021 each project their `season` column one-for-one into
-- a `season` facet by trigger, so a host whose answer resolves to `season/
-- winter` is scored against every winter thing in the library by facetOverlap
-- with no new scoring code anywhere. That is the whole design of db/002's facet
-- layer working as intended: the calendar becomes a soft weight for free, and
-- what is left for TypeScript is only the hard gate.
--
-- It also puts the CALENDAR ITSELF in the database rather than in a module. The
-- mapping from a month to a season is a fact about the world that
-- src/lib/selection/table.ts never has to know: it reads the resolved facet
-- code off her answer. There is exactly one place that says August is high
-- summer, and it is a row.
--
-- ── AUGUST IS ITS OWN SEASON, AND THAT IS db/012's CALL, NOT A NEW ONE ──
--
-- db/012 authored `high_summer` with the gloss "August. Heat that does not
-- break, and food that concedes to it." So August resolves to `high_summer` and
-- June and July to `summer`. Nothing is lost by this at the gate: `summer`
-- CONTAINS `high_summer` (src/lib/selection/table.ts holds the one ladder), so
-- every summer dish is still in season in August. What it buys is the reverse —
-- a dish or a menu written for August only is out of season in June, which is
-- the finer of the two claims and the one a curator took the trouble to make.
--
-- ── AND `shoulder` IS NEVER A MONTH ─────────────────────────────────
--
-- `shoulder` and `year_round` are answers ABOUT season rather than seasons
-- (db/012 says so). No month resolves to either. A shoulder dish reaches a
-- spring or an autumn table through the containment ladder, and a year-round
-- dish reaches every table because it claims nothing.
--
-- ─────────────────────────────────────────────────────────────────────
-- STILL DECIDING IS AN ANSWER, AND IT MUST CHANGE NOTHING
--
-- `not_decided` is offered here for the reason the room question offers it:
-- a host who has not booked a house has not lied about the month, she has
-- declined to invent one, and the application must not make that impossible.
--
-- It resolves to `event_timing/not_decided`, a dimension NOTHING IN THE
-- CATALOGUE IS EVER TAGGED WITH. That is deliberate and it is the whole point:
-- an inert facet contributes exactly nothing to any facet-overlap score, so a
-- host who answered "still deciding" gets the behaviour she got the day before
-- this migration — no season weight, and nothing excluded on a season. db/006
-- established the pattern for `guest_count` and `spend_per_person` and argued
-- it there; db/005 did it first for `music_service`.
--
-- It would have been easy and wrong to resolve it to `season/year_round`. That
-- facet is carried by 516 of the 618 authored dishes, so the answer "I do not
-- know when" would have become a real pull toward things that do not care when
-- — a preference she never expressed, applied at full strength, to most of the
-- library.
--
-- ─────────────────────────────────────────────────────────────────────
-- AND WHICH MEAL, ASKED ONLY WHERE THE OCCASION DOES NOT ALREADY SAY
--
-- db/023 derives the meal shape from the one answer that already implies one:
-- `food_plan = 'standing'` (and eating out, and drinks only) carries the
-- `no_seated_meal` exclusion, and that is a cocktail party. Everything else
-- fell through to `long_dinner` because nothing could say otherwise.
--
-- THE OCCASION DOES NOT SAY. `occasion_type` is why she is having people over —
-- a birthday, an anniversary, a bridal weekend — and db/023 refused to collapse
-- the two axes for exactly this reason: "A birthday can be a brunch and an
-- anniversary can be a late supper, and collapsing the two would make one of
-- those unsayable." Only `dinner_party` implies its meal, and one occasion out
-- of nine is not a derivation.
--
-- So it is asked, ONCE, and only of a host who has said there is a table:
-- src/lib/quiz.ts makes the field conditional on `food_plan = 'sit_down'`, the
-- way "in your words" is conditional on `occasion = 'other'`. A host having a
-- cocktail party is never asked which meal it is, because her food answer
-- already said.
--
-- THE OPTION CODES ARE THE `meal_shape` VALUES, so her answer casts straight
-- into the column — the same trick db/005 used for `music_service` and for the
-- same reason: a derivation nobody has to read is a derivation nobody can get
-- wrong. `cocktails` is the one value the question does not offer, because the
-- food question already produces it.
--
-- ─────────────────────────────────────────────────────────────────────
-- CONTENTS
--
--   event_month              which month. an enum: closed, ordered, hers
--   quiz_response.*          the two new answers
--   quiz_response_guard      both frozen (and three of db/016's, which were not)
--   event_timing             one inert facet: still deciding
--   meal_shape               the five shapes as vocabulary
--   the bridge               every new option, resolved
--   quiz_response_facet      two new branches
-- ─────────────────────────────────────────────────────────────────────


-- ── event_month ──────────────────────────────────────────────────────
--
-- An enum by db/001's rule: the value set is closed and structural. There are
-- twelve months and there will be twelve months. Declared in calendar order, so
-- `order by event_month` means what it looks like, with `not_decided` last
-- because it is not a month — the same position `not_sure` takes at the bottom
-- of `spend_per_person_band`.
--
-- NO YEAR. A month is a season and a season is what the catalogue is tagged
-- with; which August she means changes nothing any reader here computes. The
-- year arrives with `event_date` when staff confirm it, and that is also the
-- column a lead-time calculation would read.

create type event_month as enum (
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
  'not_decided'
);

comment on type event_month is
  'Which month the evening falls in, as SHE answered it. Resolves to a '
  'season_band through quiz_option_facet — see db/026 for why this is a month '
  'and not a date, and quiz_response.event_date for where an exact date lives.';


-- ── the columns ──────────────────────────────────────────────────────
--
-- Nullable, because every response written before today has no answer and is
-- not missing one — the contract db/005, db/006 and db/016 all established for
-- their own questions.

alter table quiz_response
  add column event_month event_month,
  add column meal_time   meal_shape;

comment on column quiz_response.event_month is
  'WHEN, as she answered it: a month, or ''not_decided''. Frozen with every '
  'other answer. NOT the same column as event_date, which is the exact date '
  'staff learn afterwards and may change — see db/006 on the identical '
  'guest_count_band / guest_count_confirmed pair. Null on responses submitted '
  'before db/026, when the question did not exist.';

comment on column quiz_response.meal_time is
  'WHICH MEAL the table is, when there is a table. Asked only of a host whose '
  'food_plan is ''sit_down''; ''cocktails'' is produced by the food question '
  'instead and is never written here. Null when she was not asked, and the '
  'engine falls back to ''long_dinner'' — see src/lib/selection/table.ts.';

-- "Show me every February application" and "everything that is a brunch". Both
-- are reads the desk will want the first week this question is live.
create index quiz_response_when_idx on quiz_response (event_month, meal_time);


-- ── the immutability guard, restated ─────────────────────────────────
--
-- db/001 lists the frozen columns explicitly "so that adding a column is a
-- deliberate choice about which side of this line it falls on". The choice:
-- `event_month` and `meal_time` are HER ANSWERS, so both are frozen. If the
-- party moves to March she applies again — the same rule `guest_count_band`
-- lives under, and the reason the taste profile can be rebuilt from history.
--
-- THREE MORE LINES THAN THAT, AND THEY ARE A CORRECTION.
--
-- db/016 added `how_made`, `play_appetite` and `food_plan` to quiz_response and
-- did not add them here. They are her answers by every argument that file makes
-- about them — `how_made` is projected into her taste history by
-- record_quiz_signals, and `food_plan` decides which deliverables her Revelle
-- has at all — so their absence from the guard is an omission rather than a
-- decision, and leaving it in place would mean the evidentiary record could be
-- edited under three questions and not under the other eleven. Nothing updates
-- them today (the only writers of quiz_response set `status`, `event_date` and
-- `guest_count_confirmed`), so freezing them now costs nothing and closes the
-- hole before something does.
--
-- Everything else is db/007's function verbatim: `create or replace` is the
-- only way PostgreSQL offers. The error message is unchanged, because the set
-- of MUTABLE columns is unchanged.

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
     -- Added by db/016 and left out of this list there. Her answers, therefore
     -- frozen. See the note above.
     or new.how_made         is distinct from old.how_made
     or new.play_appetite    is distinct from old.play_appetite
     or new.food_plan        is distinct from old.food_plan
     -- Added by db/026. Her answers, therefore frozen.
     or new.event_month      is distinct from old.event_month
     or new.meal_time        is distinct from old.meal_time
     or new.created_at       is distinct from old.created_at
  then
    raise exception
      'quiz_response % is immutable: only status, event_date and guest_count_confirmed may change. Insert a new response instead.',
      old.id;
  end if;

  return new;
end;
$$;


-- ── the vocabulary ───────────────────────────────────────────────────
--
-- TWO DIMENSIONS, AND NEITHER IS A TASTE. db/005 argued the case once and db/006
-- twice: a dimension no ingredient is ever tagged with contributes exactly
-- nothing to any facet-overlap score, so it is queryable and inert. Both are
-- named in NON_TASTE_DIMENSIONS in src/lib/selection/vector.ts, because that
-- file's rule is that a dimension excluded on purpose must be excluded by a
-- named rule rather than by accident of not appearing.
--
-- They are in the bridge anyway, and only because they are in the bridge can
-- scripts/check-facets.mjs prove that nothing she can tap means nothing.
--
-- NO `season` DIMENSION IS ADDED. It exists (db/012, position 110) and it is
-- the one the twelve months resolve to. That is the entire mechanism by which
-- the calendar becomes a weight.

insert into facet_dimension (code, label, description, position) values
  ('meal_shape', 'Which meal',
   'What the table IS — brunch, lunch, standing drinks, a long dinner, a late '
   'supper. The host side of db/023''s meal_shape. A CONSTRAINT, not a taste: '
   'a dish claims a shape in `dish_meal`, which is a claims table and not a '
   'tag table, so nothing in the catalogue is ever tagged in this dimension '
   'and it contributes nothing to any score. See db/026.',
   210),
  ('event_timing', 'When it is',
   'Where an answer about WHEN goes when it is not a season. One member: '
   '''still deciding''. The twelve months resolve to the `season` dimension '
   'instead, because that is the dimension the catalogue is tagged in. A '
   'CONSTRAINT, not a taste, and nothing is ever tagged here. See db/026.',
   220);

-- The five shapes, verbatim from db/023's enum and in the order a day runs.
-- All five, including `cocktails`, which the meal question does not offer:
-- the dimension is the vocabulary of what a table can BE, and a vocabulary with
-- a hole in it where an answer already exists is a vocabulary that will be
-- filled in by a guess. `cocktails` is reached through the food question.
--
-- Labels and descriptions are the option's own `label` and `hint` in
-- src/lib/quiz.ts, so scripts/check-facets.mjs reports zero drift on a clean
-- tree. `cocktails` has no option and therefore takes db/023's own words.
insert into facet (dimension_code, code, label, description, provenance, notes) values
  ('meal_shape', 'brunch', 'Brunch', 'The morning after, and it runs long',
   'quiz', 'What she answered. Nothing is tagged in this dimension.'),
  ('meal_shape', 'lunch', 'Lunch', 'Midday, and nobody is in a hurry',
   'quiz', 'What she answered. Nothing is tagged in this dimension.'),
  ('meal_shape', 'cocktails', 'Standing drinks',
   'Food that is picked at standing, and no course anybody sits down for.',
   'curator',
   'NOT OFFERED on the meal question. It is produced by the food answer — '
   '''standing'' carries the no_seated_meal exclusion (db/022) and that is '
   'what makes an evening a cocktail party. Here so the vocabulary is whole.'),
  ('meal_shape', 'long_dinner', 'Dinner', 'The table, after dark',
   'quiz', 'What she answered. Nothing is tagged in this dimension.'),
  ('meal_shape', 'late_supper', 'A late supper', 'After the show, or after dancing',
   'quiz', 'What she answered. Nothing is tagged in this dimension.');

insert into facet (dimension_code, code, label, description, provenance, notes) values
  ('event_timing', 'not_decided', 'Still deciding', '', 'quiz',
   'A real answer, not a missing one — the same status ''not sure yet'' has '
   'under spend_per_person. It resolves HERE rather than to season/year_round '
   'on purpose: year_round is carried by most of the dish pool, so resolving '
   'it there would turn "I do not know when" into a preference for things that '
   'do not care when. Inert, so a host who has not picked a month is scored '
   'exactly as she was before db/026 and nothing is excluded on a season.');


-- ── the bridge ───────────────────────────────────────────────────────
--
-- THE CALENDAR, AS ROWS. This is the only place in the system that says which
-- season a month is in. src/lib/selection/ reads the resolved facet code off
-- her answer and never computes it.
--
-- Weight 1.000 on every row: unlike the making axis (db/016) this is not an
-- ordinal question with a signed middle. February is not less of an answer than
-- July, and the twelve are twelve different facts rather than twelve points on
-- one ladder.
--
-- Several options share one facet — three months are winter — which is a
-- MANY-TO-ONE bridge and the second kind scripts/check-facets.mjs knows about.
-- It skips the label comparison exactly where the mapping is not one-to-one,
-- because the facet's words describe the season and the option's words name the
-- month, and they differ on purpose and always will.

insert into quiz_option_facet (quiz_field, option_code, facet_id, answer_polarity, answer_weight)
select v.quiz_field, v.option_code, f.id, 'positive', 1.000
  from (values
         ('event_month', 'january',   'season', 'winter'),
         ('event_month', 'february',  'season', 'winter'),
         ('event_month', 'march',     'season', 'spring'),
         ('event_month', 'april',     'season', 'spring'),
         ('event_month', 'may',       'season', 'spring'),
         ('event_month', 'june',      'season', 'summer'),
         ('event_month', 'july',      'season', 'summer'),
         -- db/012: "High summer — August. Heat that does not break." Every
         -- `summer` thing is still in season in August through the containment
         -- ladder in src/lib/selection/table.ts; what this buys is that an
         -- August-only thing is out of season in June.
         ('event_month', 'august',    'season', 'high_summer'),
         ('event_month', 'september', 'season', 'autumn'),
         ('event_month', 'october',   'season', 'autumn'),
         ('event_month', 'november',  'season', 'autumn'),
         ('event_month', 'december',  'season', 'winter'),

         -- Not a season. See the note on the facet.
         ('event_month', 'not_decided', 'event_timing', 'not_decided'),

         -- Which meal. The option code IS the meal_shape value.
         ('meal_time',   'brunch',      'meal_shape', 'brunch'),
         ('meal_time',   'lunch',       'meal_shape', 'lunch'),
         ('meal_time',   'long_dinner', 'meal_shape', 'long_dinner'),
         ('meal_time',   'late_supper', 'meal_shape', 'late_supper')
       ) as v(quiz_field, option_code, dimension, facet_code)
  join facet f on f.dimension_code = v.dimension and f.code = v.facet_code;


-- ── quiz_response_facet, extended ────────────────────────────────────
--
-- Two branches added. `create or replace` keeps the column list identical,
-- which it must — record_quiz_signals() and taste_profile_current both read
-- this view. Everything else is byte for byte what db/016 left.
--
-- A null single-select unnests to one null, which joins nothing, so a response
-- written before this question existed contributes no rows here rather than
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
           ('how_made',         array[qr.how_made::text]),
           ('play_appetite',    array[qr.play_appetite::text]),
           ('food_plan',        array[qr.food_plan::text]),
           -- Added by db/026.
           ('event_month',      array[qr.event_month::text]),
           ('meal_time',        array[qr.meal_time::text])
  ) as src(quiz_field, option_codes)
  cross join lateral unnest(src.option_codes) as ans(option_code)
  join quiz_option_facet m
    on m.quiz_field = src.quiz_field and m.option_code = ans.option_code
  join facet f on f.id = m.facet_id;


-- ─────────────────────────────────────────────────────────────────────
-- WHAT THIS DELIBERATELY DOES NOT DO
--
--   · NO DATE PICKER, and no `event_month_confirmed` beside it either. The
--     exact date is `event_date`, it is mutable, staff fill it in, and there is
--     a field for it at the desk already. Two columns for one fact is the thing
--     db/002 warns about on every page; the reason this is a lineage rather
--     than a duplicate is that a curator seeds the date from the month she
--     said and from then on the date is the one that binds.
--
--   · NO BACKFILL. A response written before today was never asked when, and
--     inferring a month from `created_at` would be inventing an answer and
--     stamping her name on it. Those rows carry null, resolve to no season
--     facet, and are handled by the same route "still deciding" takes: nothing
--     is excluded on a season. `quiz_version` on the row says which question
--     set she was actually shown.
--
--   · NO `season_strict` ENFORCEMENT IN SQL. The gate is one branch in
--     src/lib/selection/fill.ts, beside the destination, venue, occasion and
--     slot gates, and it reads the same containment ladder the composed table
--     reads. db/009 says at length that writing an eligibility rule a second
--     time in SQL is the disease db/002 exists to cure, and db/019 and db/023
--     both refused again. So does this.
--
--   · NO `meal_shape` COLUMN ON A MENU OR A DRINK. db/023 refused it and the
--     refusal stands: both already say what they are for in a `name`, in her
--     own words, and that sentence is richer than an enum.
--
--   · NO SEASON WEIGHT ON A DESTINATION. Nothing here tags a world, and nothing
--     should: a destination is not a place and not a date. WESTHAMPTON, 1976 in
--     February is a February Westhampton, and what changes is what is on the
--     table — which is the same thesis db/020 states about the room and
--     src/lib/selection/vector.ts enforces for `environment`.
-- ─────────────────────────────────────────────────────────────────────
