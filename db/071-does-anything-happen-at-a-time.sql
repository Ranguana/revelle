-- ═══════════════════════════════════════════════════════════════════════
-- db/071 — DOES ANYTHING HAPPEN AT A TIME. The fourth fed column, and the
-- strongest one.
--
-- Founder, 2026-09-06:
--
--   "Schedule — a scene question in the idiom of `how_it_ends`, not the veto
--    'I hate a schedule that runs the day.' That veto is one level unwanted;
--    it does not choose among posted / anchored / standing. Schedule is the
--    facet that already splits the most pairs. FAKE-WIRING IT IS THE WORST
--    CHEAT."
--
-- ── HER CLAIM, VERIFIED BEFORE THIS WAS WRITTEN ──────────────────────
--
-- `npm run check:matrix` over the current twenty rows, pairs separated of 190:
--
--   SCHEDULE 145 · ending 133 · size 124 · volume 119 · starts 108
--   food 107 · arrival 92 · dress 84 · spectacle 36
--
-- First of nine, and by twelve pairs. It also carries the most load: twenty
-- pairs would drop below the gate without it, more than any other column.
--
-- ── SO THE CHEAT WAS AVAILABLE AND IS REFUSED IN WRITING ─────────────
--
-- `anti_preferences` already carries the option `schedule`, labelled "A
-- schedule that runs the day". Bridging it onto this column is one INSERT and
-- it would have produced a `fedBy` entry that looked exactly like the two
-- honest ones.
--
-- IT IS NEGATIVE EVIDENCE ABOUT ONE LEVEL. A host who says that has ruled out
-- `posted`. She has said NOTHING about whether her evening is `anchored`
-- (Westhampton's drinks hour), `standing` (Cote d'Azur's eternal lunch) or
-- `unplanned` (it became a party). Three of four levels unaddressed, and the
-- ranker would have been sorting the catalogue's most powerful column on a
-- dislike.
--
-- `fedBy`'s own standard, written before this migration and binding it: an
-- entry is "a promise that a HOST STATES THIS LEVEL, not that a level could be
-- guessed from something she said. ... a veto ('a schedule that runs the day')
-- is negative evidence about one level and does not state a cell." The block
-- names this exact temptation and then says: "It is also the facet carrying
-- the most separation in the audit, which makes it the strongest candidate for
-- the next question and the worst one to fake."
--
-- A COLUMN FED FROM A VETO IS WORSE THAN AN UNFED COLUMN. An unfed column is
-- visibly unfed and the reveal does not claim it. A column fed from a veto is
-- claimed, ranked on, and wrong — rule 15's DEFAULT-ONLY failure with a
-- supplier bolted to the front of it.
--
-- ── THE QUESTION IS THE MATRIX'S OWN SENTENCE ────────────────────────
--
-- `facetNotes.schedule` closes with: "A named hour and an unnamed habit are
-- different answers to 'DOES ANYTHING HAPPEN AT A TIME?'" That is the title of
-- the screen, and the four options are that note's four glosses written as
-- scenes rather than as definitions.
--
-- The note also records that `anchored` and `standing` were briefly ONE level,
-- on the argument that a host cannot tell them apart, and that this was wrong:
-- Westhampton/Nantucket failed on [dress, food] with no schedule contribution,
-- "which is impossible if those two houses keep time differently — and they
-- do." So the options must land the distinction a host can actually state, and
-- it is NAMING: "drinks at six" is named to somebody, "it always goes this way"
-- is not.
--
-- ── WHAT IT DOES TO THE PICK ─────────────────────────────────────────
--
--   two fed columns    20 rooms -> 7 groups · largest 7 · mean 2.86
--   + dress (db/070)   20 rooms -> 11 groups · largest 4 · mean 1.82
--   + schedule         20 rooms -> 16 groups · largest 3 · mean 1.25
--
-- Thirteen of twenty rooms become singletons: for those hosts the structural
-- ranker names one room rather than handing the aesthetic score a tie. The
-- largest bucket is three.
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1 · THE LEVEL SET ────────────────────────────────────────────────

create type evening_schedule as enum ('posted', 'anchored', 'standing', 'unplanned');

comment on type evening_schedule is
  'Whether anything in this evening happens at a named hour. The `schedule` '
  'column of the structural matrix, values identical to its levels. NOT '
  'anti_preferences/schedule, which is a VETO on `posted` alone and states no '
  'cell (CLAUDE.md rule 3, and the fedBy note this column carried while it was '
  'unfed). Added by db/071.';

alter table quiz_response
  add column how_it_keeps_time evening_schedule;

comment on column quiz_response.how_it_keeps_time is
  'Her answer to "Does anything happen at a time?". Null on every response '
  'written before db/071 — a null contributes no row to quiz_response_facet '
  'and costs no room any distance, which is what "she was never asked" has to '
  'look like from every reader.';

-- ── 2 · THE DIMENSION ────────────────────────────────────────────────

insert into facet_dimension (code, label, description, position) values
  ('evening_schedule', 'Does anything happen at a time',
   'Whether the evening has named hours, one named hour, an unannounced habit, '
   'or nothing at all. The `schedule` column of the structural matrix and the '
   'strongest separator in it — 145 of 190 pairs. A CONSTRAINT on which world '
   'fits rather than a taste: nothing in the catalogue is tagged here and the '
   'comparison is a level distance. DELIBERATELY NOT anti_preferences/schedule, '
   'which vetoes one level and chooses among none. See db/071.',
   -- POSITION IS DERIVED, NOT CHOSEN. db/070 first shipped `250` and wedged
   -- the deploy on `facet_dimension_position_unique`: db/049 already held
   -- 250, 260 and 270, and the reading that said 240 was the maximum came
   -- from a matcher that only saw single-row inserts. db/049's is multi-row.
   -- A literal here is a claim about every row that already exists, made by
   -- someone who cannot see them; the subquery asks the table instead.
   (select coalesce(max(position), 0) + 10 from facet_dimension));

-- ── 3 · THE FOUR LEVELS ──────────────────────────────────────────────
--
-- Labels and descriptions are the option's own `label` and `hint` from
-- src/lib/quiz.ts (db/026's convention), so scripts/check-facets.mjs reports
-- zero drift on a clean tree. The notes carry the matrix's own worked examples,
-- because `anchored` and `standing` are the pair a reader will collapse.

insert into facet (dimension_code, code, label, description, provenance, notes) values
  ('evening_schedule', 'posted', 'The hours are on the invitation',
   'People know when to come and when to sit down before they arrive',
   'quiz',
   'Six rooms. THE ONLY LEVEL anti_preferences/schedule speaks to, and it '
   'speaks against it — which is the whole reason that veto could not feed '
   'this column.'),
  ('evening_schedule', 'anchored', 'One thing has an hour',
   'Drinks at six, or something at midnight. The rest finds its own time',
   'quiz',
   'The matrix''s own examples: Westhampton''s drinks hour, New Orleans'' '
   'second wind at midnight. ONE thing happens at its hour and the rest finds '
   'its own.'),
  ('evening_schedule', 'standing', 'Nothing is announced, and it always goes the same way',
   'Nobody is told the order. Everybody somehow knows it',
   'quiz',
   'The house''s own unannounced rhythms — Nantucket, Cote d''Azur''s eternal '
   'lunch. Briefly merged with `anchored` on the argument that a host cannot '
   'tell them apart; that was wrong and the matrix records how it was caught. '
   'The distinction a host CAN state is whether the hour is NAMED to anybody.'),
  ('evening_schedule', 'unplanned', 'Nobody decided anything',
   'It became a party. There was never a plan to keep',
   'quiz',
   'Nobody decided anything; it became a party. Havana and Amalfi.');

-- ── 4 · THE ANSWER, REGISTERED BEFORE IT IS BRIDGED ──────────────────

insert into quiz_option (quiz_field, option_code) values
  ('how_it_keeps_time', 'posted'),
  ('how_it_keeps_time', 'anchored'),
  ('how_it_keeps_time', 'standing'),
  ('how_it_keeps_time', 'unplanned');

-- ── 5 · THE BRIDGE ───────────────────────────────────────────────────
--
-- An identity in both directions: option code = facet code = matrix level.

insert into quiz_option_facet (quiz_field, option_code, facet_id, answer_polarity, answer_weight)
select v.quiz_field, v.option_code, f.id, 'positive', 1.000
  from (values
         ('how_it_keeps_time', 'posted',    'evening_schedule', 'posted'),
         ('how_it_keeps_time', 'anchored',  'evening_schedule', 'anchored'),
         ('how_it_keeps_time', 'standing',  'evening_schedule', 'standing'),
         ('how_it_keeps_time', 'unplanned', 'evening_schedule', 'unplanned')
       ) as v(quiz_field, option_code, dimension_code, facet_code)
  join facet f
    on f.dimension_code = v.dimension_code and f.code = v.facet_code;

-- ── 6 · THE PROJECTION ───────────────────────────────────────────────

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
           ('what_they_wear',   array[qr.what_they_wear::text]),
           -- Added by db/071.
           ('how_it_keeps_time', array[qr.how_it_keeps_time::text])
  ) as src(quiz_field, option_codes)
  cross join lateral unnest(src.option_codes) as ans(option_code)
  join quiz_option_facet m
    on m.quiz_field = src.quiz_field and m.option_code = ans.option_code
  join facet f on f.id = m.facet_id;
