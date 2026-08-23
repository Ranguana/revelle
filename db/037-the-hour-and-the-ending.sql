-- ── 037 · THE HOUR AND THE ENDING ────────────────────────────────────
--
-- Applied by scripts/migrate.mjs after 036, inside one transaction together
-- with its schema_migrations ledger row. Same rule as every file before it:
-- nothing here may be a statement that refuses to run in a transaction.
--
-- New file, never applied anywhere, so no SENTINELS entry in
-- scripts/migrate.mjs.
--
-- ─────────────────────────────────────────────────────────────────────
-- THE HOLE THIS CLOSES, AND IT IS THE ONE THE STANDING RULES NAME
--
-- CLAUDE.md rule 15, written the same week as this migration:
--
--     "NOTHING GRADES THAT DOES NOT PRUNE. EVERY INSTRUMENT TRACES TO A
--      SUPPLIER. … `starts`/`ending` ranked all eighteen rows while no answer
--      fed either, so the reveal claimed nine facets and used seven."
--
-- The structural matrix in data/destination-matrix.json has nine columns. Two
-- of them had no question anywhere in the application. `ending` — it stops
-- cleanly, it dissolves, it goes until morning — is filled in for every one of
-- the eighteen rooms, splits them 7 / 7 / 4, and is the column that separates
-- Las Vegas from New York and holds the whole until-morning corner. Nobody was
-- ever asked. `starts` had a question, and could not reach most of the people
-- it was ranking. This migration supplies both.
--
-- ── THE SECOND BUG IS BIGGER THAN THE FIRST ──────────────────────────
--
-- db/026 asked which meal, and held it behind
--
--     activeWhen: { field: "food_plan", is: ["sit_down"] }
--
-- on an argument that was correct about what it was looking at:
--
--     "A host having a cocktail party is never asked which meal it is, because
--      her food answer already said."
--
-- Her food answer said THERE IS NO TABLE. It did not say WHAT TIME ANYONE
-- ARRIVES, and the gate treated those as one fact because at the time the only
-- reader was mealShape(). So a cocktail party, a booked restaurant and a
-- drinks-only evening — three of the four food plans — STATED NO HOUR ANYWHERE
-- IN THE SYSTEM. Not a wrong hour: none. Anything downstream that wanted one
-- got a fallback identical for every such applicant, which is rule 15's
-- DEFAULT-ONLY state and the sneaky one, because it looks fed.
--
-- Nothing the old argument protected is lost. `no_seated_meal` still wins in
-- mealShape() and is checked FIRST, so a standing party that says midday is
-- still a cocktail party and not a lunch. The gate was doing that job at the
-- question, where it also deleted the hour; the exclusion does it where it
-- belongs. See src/lib/selection/table.ts, where both halves of this are
-- written out beside the code.
--
-- ─────────────────────────────────────────────────────────────────────
-- WHY THE ENDING IS ONE QUESTION AND NOT A CONDITION ON ANOTHER
--
-- EVERY HOST HAS AN OPINION ABOUT HOW A PARTY SHOULD END, and no other answer
-- implies one. A dinner at a table can stop cleanly at eleven or run to five; a
-- cocktail party can do either; a birthday and an anniversary say nothing about
-- it. There is no answer she has already given that settles this, which is the
-- test the meal question failed for two migrations, and this one carries no
-- `activeWhen` for exactly that reason.
--
-- THE THREE OPTIONS ARE THE FOUNDER'S SENTENCES. They were authored in
-- docs/destination-contrasts.md as forced-choice SCENES rather than adjectives,
-- and they ship in the words they were written in. Each carries its own
-- judgement — "everyone leaves at once, and it's perfect", "the last hour is
-- the best", "if it ends before very late, something went wrong" — so she is
-- agreeing with a host rather than grading an evening. "An early night" against
-- "a long one" would ask the same question and get a worse answer.
--
-- AND IT DESCRIBES THE EVENING, NOT THE GUESTS, which is the acceptance test
-- that killed `teasing` and `no_speeches`. The same six people throw a Sunday
-- lunch that stops cleanly and a birthday that goes until morning, so this
-- cannot be read off them and travels with the party instead.
--
-- ─────────────────────────────────────────────────────────────────────
-- ONE ANSWER, TWO VOCABULARIES — AND THE PRIMARY KEY HAD TO MOVE
--
-- db/002 keyed quiz_option_facet on (quiz_field, option_code), which says: an
-- answer means exactly one thing. That held for thirty-five migrations and
-- stops holding here. "It starts at lunchtime" is one fact with two
-- consequences — the table is a LUNCH (db/023's meal_shape, read by the
-- composed table) and the evening BEGINS IN THE AFTERNOON (the matrix's
-- `starts`, read by the structural ranker) — and neither reader wants the
-- other's vocabulary.
--
-- THE ALTERNATIVES WERE BOTH WORSE.
--
--   A SECOND QUESTION asking the same thing in different words. It would put
--   two answers on the page that cannot disagree without one of them being
--   wrong, which is the duplicate-fact failure db/002 warns about on every page
--   and db/026 refused for the date.
--
--   A DERIVATION IN TYPESCRIPT — a line in src/lib/selection/ saying that a
--   late supper starts late. db/026 settled this shape when it put the calendar
--   in rows: "There is exactly one place that says August is high summer, and
--   it is a row." The same argument, unchanged, says there should be exactly
--   one place that says a late supper starts late, and it should be a row.
--
-- So the key widens to (quiz_field, option_code, facet_id) — and the widening
-- pulls one more table in with it, because db/006's `quiz_option_range` has a
-- foreign key to the old key and that key is about to stop being unique. The
-- answer is a `quiz_option` registry, argued where it is created below. It is
-- the largest thing in this file and it was not in the first draft, which is
-- why the first draft failed to apply.
--
-- MANY-TO-ONE was
-- already legal and is how twelve months reach five seasons; this makes
-- ONE-TO-MANY legal too, and the two together are just "the bridge is a
-- mapping". Nothing that reads the bridge assumes one row per answer:
-- quiz_response_facet unnests and joins, resolveFacets() in src/lib/desk/bench.ts
-- joins the same way, and both hand back a LIST of stated facets that callers
-- already filter by dimension. record_quiz_signals writes one taste_signal per
-- resolved facet, which is what it did for a multi-select already.
--
-- WHAT DOES HAVE TO CHANGE IS scripts/check-facets.mjs, which indexed the
-- bridge by (field, option) into a Map and would silently keep the last row of
-- a one-to-many answer. It groups now, and skips the label comparison where an
-- answer resolves to more than one vocabulary — for the same reason it already
-- skips it where the codes differ: the option's words cannot be both facets'
-- words, and they are not supposed to be.
--
-- ─────────────────────────────────────────────────────────────────────
-- WHAT THIS DOES NOT DO, STATED FIRST BECAUSE IT IS THE THING TO KNOW
--
-- IT DOES NOT MAKE THE MATRIX RANK. Nothing in src/ reads
-- data/destination-matrix.json — its only reader is scripts/audit-matrix.mjs —
-- and scripts/seed-destinations.mjs writes `voice_tone` rows into world_facet
-- and nothing else. So chooseDestinations() scores every survivor with
-- facetOverlap() against a set of tags that contains no structural facet, and
-- has returned 0 for every destination since it was written. src/lib/destinations.ts
-- said so before this migration existed: "the ranking stage is inert and there
-- is an empty socket the matrix happens to fit."
--
-- This migration fills the SUPPLY side of that socket completely. Her answers
-- about the hour and the ending are recorded, frozen, resolved through the
-- bridge into the matrix's own level vocabulary, and available to any reader.
-- The consuming side is one wiring change in
-- src/lib/selection/destination.ts — between the aesthetic score and the dither
-- — and it is NOT made here, because writing eighteen rooms' structural cells
-- into world_facet is the change that makes the matrix live for the first time,
-- and a matrix cell is a GOVERNED CLASS under db/036 and CLAUDE.md rule 13. It
-- is founder-signed or it does not happen.
--
-- The question still earns its place on the day it ships: every answer from now
-- on is recorded correctly, so the column is fed before it is read rather than
-- after — which is the order rule 15 was written to enforce.
--
-- ─────────────────────────────────────────────────────────────────────
-- CONTENTS
--
--   evening_ending           how she thinks a night should end. an enum
--   quiz_response.how_it_ends her answer
--   quiz_response_guard      frozen with the rest of her answers
--   quiz_option              the registry the schema has been faking
--   quiz_option_range        its foreign key, repointed at the registry
--   quiz_option_facet        the key widens: one answer may mean two things
--   evening_ending, evening_start   two dimensions, neither a taste
--   the bridge               three identities and four translations
--   quiz_response_facet      one new branch
--   quiz_response.meal_time  its comment, superseded in place
-- ─────────────────────────────────────────────────────────────────────


-- ── evening_ending ───────────────────────────────────────────────────
--
-- An enum by db/001's rule: the value set is closed and structural. It is the
-- matrix's `ending` column, value for value, and it is declared in the order
-- the question offers it — shortest night first — so `order by how_it_ends`
-- means something.
--
-- NO 'not_decided'. The room question and the calendar both offer one because a
-- host who has not booked a house has not lied about the month. This is
-- different in kind: she is not being asked to report a fact she may not have
-- yet, she is being asked what she thinks a good evening does, and she has an
-- opinion about that before she has a venue. An escape hatch here would collect
-- shrugs from people who had an answer.

create type evening_ending as enum (
  'clean_stop',
  'dissolves',
  'until_morning'
);

comment on type evening_ending is
  'How she thinks the evening should END, as she answered it. The `ending` '
  'column of data/destination-matrix.json, value for value — the option codes '
  'ARE the matrix levels, so the bridge to facet space is an identity and '
  'there is no translation to get wrong. See db/037.';


-- ── the column ───────────────────────────────────────────────────────
--
-- Nullable, because every response written before today has no answer and is
-- not missing one — the contract db/005, db/006, db/016 and db/026 all
-- established for their own questions.

alter table quiz_response
  add column how_it_ends evening_ending;

comment on column quiz_response.how_it_ends is
  'HOW IT ENDS, as she answered it: it stops cleanly, it dissolves, or it goes '
  'until morning. Asked of everyone — no other answer implies one, which is '
  'why it carries no activeWhen in src/lib/quiz.ts. Frozen with every other '
  'answer. Null on responses submitted before db/037, when the question did '
  'not exist; those rows state no level and are scored on the columns they did '
  'answer, never against a guessed one.';

-- "Show me every application that wants to go until morning" is a read the desk
-- will want in the first week, and it is also the cohort the until-morning
-- corner of the catalogue exists for.
create index quiz_response_ending_idx on quiz_response (how_it_ends);


-- ── the immutability guard, restated ─────────────────────────────────
--
-- db/001 lists the frozen columns explicitly "so that adding a column is a
-- deliberate choice about which side of this line it falls on". The choice:
-- `how_it_ends` is HER ANSWER, so it is frozen. If she changes her mind about
-- what a good night does, she applies again — the same rule `guest_count_band`
-- lives under, and the reason the taste profile can be rebuilt from history.
--
-- Everything else is db/026's function verbatim; `create or replace` is the
-- only way PostgreSQL offers. The error message is unchanged, because the set
-- of MUTABLE columns is unchanged.
--
-- `meal_time` STAYS FROZEN AND ITS MEANING HAS WIDENED, which is not a
-- contradiction. The column still holds the answer she gave to the question she
-- was shown; `quiz_version` on the row says which question that was.

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
     -- Added by db/037. Her answer, therefore frozen.
     or new.how_it_ends      is distinct from old.how_it_ends
     or new.created_at       is distinct from old.created_at
  then
    raise exception
      'quiz_response % is immutable: only status, event_date and guest_count_confirmed may change. Insert a new response instead.',
      old.id;
  end if;

  return new;
end;
$$;


-- ── quiz_option: THE REGISTRY THE SCHEMA HAS BEEN FAKING ─────────────
--
-- This table exists because the first draft of this migration did not have it,
-- was wrong, and failed on the first cluster it was ever run against with
--
--     cannot drop constraint quiz_option_facet_pkey because other objects
--     depend on it
--
-- and the object is db/006's `quiz_option_range`, which carries
--
--     foreign key (quiz_field, option_code)
--       references quiz_option_facet (quiz_field, option_code) on delete restrict
--
-- for a reason it states plainly: "so a range can only exist for an option that
-- resolves to vocabulary." That is a real guarantee and it is worth keeping.
-- What it depends on is that (quiz_field, option_code) is UNIQUE in the bridge,
-- which is exactly the property this migration needs to give up.
--
-- KEEP THE PROSE ABOVE. It is CLAUDE.md rule 12's corollary in one paragraph: a
-- migration that has never actually run against a schema is hiding its own
-- bugs, and this one was caught by a sibling's dry run rather than by a deploy.
--
-- ── WHY A REGISTRY RATHER THAN A CASCADE OR A TRIGGER ────────────────
--
-- `drop ... cascade` was available and is the wrong answer twice over: it
-- deletes the foreign key silently, so nobody learns that db/006's guarantee
-- has been given up, and the loss surfaces later as a range row pointing at an
-- option no question asks. Replacing the foreign key with a trigger was
-- available too — db/031 has a precedent for a check that reads another row —
-- and it is a downgrade: the whole argument for the facet layer, in db/002's
-- own words, is that it "buys referential integrity", and swapping a constraint
-- the database enforces for a function somebody has to remember is the trade
-- that argument was made against.
--
-- So the third option, which is what the schema has been pretending it had:
-- (quiz_field, option_code) IS AN IDENTITY, and it deserves a table. There was
-- never a `quiz_option` row anywhere; `quiz_option_facet` was standing in as
-- the registry because it happened to be keyed the same way, and everything
-- downstream inherited that accident. Naming it costs one table and gives
-- db/006's foreign key a target that does not change when the bridge stops
-- being one-to-one.
--
-- POPULATED FROM THE BRIDGE, so no option is invented and none is lost: the set
-- of registered options after this runs is exactly the set that resolved before
-- it. `quiz_option_exclusion` (db/016) is deliberately NOT repointed here — it
-- has never had a foreign key, by its own design, and giving it one is a
-- separate decision with its own argument to make.
--
-- ── WHAT A FUTURE MIGRATION HAS TO DO ───────────────────────────────
--
-- REGISTER THE OPTION FIRST, THEN BRIDGE IT. One extra insert per new question,
-- and the foreign key below means forgetting it is a failed migration rather
-- than a silent hole. That is the trade this table is for.

create table quiz_option (
  -- QuizField.id in src/lib/quiz.ts. Same check as everywhere else the pair
  -- appears, so the three tables cannot disagree about what a field id is.
  quiz_field  text not null check (quiz_field ~ '^[a-z][a-z0-9_]*$'),
  -- QuizOption.code. Permanent by the contract stated at the top of quiz.ts.
  option_code citext not null,
  created_at  timestamptz not null default now(),
  primary key (quiz_field, option_code)
);

comment on table quiz_option is
  'EVERY ANSWER A HOST CAN GIVE, as an identity. One row per '
  '(QuizField.id, QuizOption.code) in src/lib/quiz.ts, including retired '
  'options — a code is permanent so that a stored answer stays interpretable. '
  'It carries no meaning of its own: what an answer MEANS is quiz_option_facet, '
  'what it REMOVES is quiz_option_exclusion, and what it is WORTH numerically '
  'is quiz_option_range. Added by db/037, when the bridge became one-to-many '
  'and stopped being able to serve as the registry it had been standing in for.';

insert into quiz_option (quiz_field, option_code)
select distinct quiz_field, option_code from quiz_option_facet;

-- The three answers this migration adds, registered before they are bridged.
insert into quiz_option (quiz_field, option_code) values
  ('how_it_ends', 'clean_stop'),
  ('how_it_ends', 'dissolves'),
  ('how_it_ends', 'until_morning');


-- ── the two foreign keys, repointed and added ────────────────────────
--
-- db/006's guarantee, restated against the registry: a range may only exist for
-- an option that EXISTS. It used to say "for an option that RESOLVES", and the
-- difference is one this migration has to be honest about — under a
-- one-to-many bridge, "resolves" is "has at least one row", which no foreign
-- key in any database can express. The part that is not lost: an option that
-- resolves to nothing is still fatal, in scripts/check-facets.mjs, which is
-- where db/006 pointed for that proof in the first place.
--
-- Constraint names are looked up rather than assumed. PostgreSQL's defaults are
-- predictable and a default is not a contract, and this file has already been
-- wrong once about what it could take for granted.

do $$
declare v_fkey text;
begin
  select con.conname into v_fkey
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
   where rel.relname = 'quiz_option_range'
     and con.contype = 'f'
     and con.confrelid = 'quiz_option_facet'::regclass;

  if v_fkey is null then
    raise exception
      '[037] quiz_option_range has no foreign key to quiz_option_facet. '
      'Has db/006 been applied, or has something already changed it?';
  end if;

  execute format('alter table quiz_option_range drop constraint %I', v_fkey);
end $$;

alter table quiz_option_range
  add constraint quiz_option_range_option_fkey
  foreign key (quiz_field, option_code)
    references quiz_option (quiz_field, option_code) on delete restrict;


-- ── and only now may the bridge become one-to-many ───────────────────
--
-- The widened key is strictly weaker than the old one, so no existing row can
-- violate it. quiz_option_facet_facet_idx (db/002) already indexes facet_id on
-- its own, so "everything that resolves to this facet" stays a single index
-- scan.

do $$
declare v_pkey text;
begin
  select con.conname into v_pkey
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
   where rel.relname = 'quiz_option_facet' and con.contype = 'p';

  if v_pkey is null then
    raise exception
      '[037] quiz_option_facet has no primary key to widen. Has db/002 been applied?';
  end if;

  execute format('alter table quiz_option_facet drop constraint %I', v_pkey);
end $$;

alter table quiz_option_facet
  add constraint quiz_option_facet_pkey
  primary key (quiz_field, option_code, facet_id);

alter table quiz_option_facet
  add constraint quiz_option_facet_option_fkey
  foreign key (quiz_field, option_code)
    references quiz_option (quiz_field, option_code) on delete restrict;

comment on table quiz_option_facet is
  'THE BRIDGE: one quiz option, the vocabulary it resolves to, the sign and the '
  'degree. The key is (quiz_field, option_code, facet_id), so the mapping may '
  'be MANY-TO-ONE — twelve months reach five seasons (db/026) — and, since '
  'db/037, ONE-TO-MANY: `meal_time` says both what the table IS (meal_shape) '
  'and what hour the evening BEGINS (evening_start). An answer resolving to two '
  'vocabularies is one fact with two consequences, not two facts; readers '
  'filter by dimension and take the resolution they are for.';


-- ── the vocabulary ───────────────────────────────────────────────────
--
-- TWO DIMENSIONS, AND NEITHER IS A TASTE, in exactly the sense db/005 argued
-- once and db/006 and db/026 argued again: nothing in the CATALOGUE is ever
-- tagged in either, so neither contributes anything to a facet-overlap score.
-- Both are named in NON_TASTE_DIMENSIONS in src/lib/selection/vector.ts,
-- because that file's rule is that a dimension excluded on purpose must be
-- excluded by a NAMED RULE rather than by accident of not appearing.
--
-- THEY ARE NOT INERT, and this is where they differ from `event_timing`. A
-- destination's structural cells are not `world_facet` tags today and may
-- become them; the reason these two are out of the preference vector is that
-- the matrix comparison is a LEVEL DISTANCE with an asymmetric case in it
-- (src/lib/selection/structure.ts), and a cosine over facet weights cannot
-- express "her `late` is near a room's `evening`, and a room's `evening` is
-- never near a `late` that no room holds". Averaging them into the taste vector
-- would be THE SEAM's forbidden averaging, arriving one layer down.
--
-- They are in the bridge anyway, and only because they are in the bridge can
-- scripts/check-facets.mjs prove that nothing she can tap means nothing.

insert into facet_dimension (code, label, description, position) values
  ('evening_ending', 'How it ends',
   'What she thinks a good evening does with its last hour — it stops cleanly, '
   'it dissolves, or it goes until morning. The `ending` column of the '
   'structural matrix, and a CONSTRAINT on which world fits rather than a '
   'taste: nothing in the catalogue is tagged here, and the comparison is a '
   'level distance rather than a weight. See db/037.',
   230),
  ('evening_start', 'What hour it starts',
   'WHEN THE THING BEGINS, and only that — how late it runs is `evening_ending` '
   'and one facet may not answer two questions. The `starts` column of the '
   'structural matrix. Resolved from the same answer that gives `meal_shape` '
   'its value, because the hour and the shape of the table are one fact with '
   'two consequences. See db/037.',
   240);

-- THE THREE ENDINGS. Codes identical to the option codes AND to the matrix
-- levels, so the bridge below is an identity in both directions. Labels and
-- descriptions are the option's own `label` and `hint` in src/lib/quiz.ts —
-- db/026's convention — so scripts/check-facets.mjs reports zero drift on a
-- clean tree.
insert into facet (dimension_code, code, label, description, provenance, notes) values
  ('evening_ending', 'clean_stop', 'It stops cleanly',
   'Everyone leaves at once, and it is perfect',
   'quiz',
   'The founder''s own scene, from docs/destination-contrasts.md, shipped in '
   'the words it was written in. Four rooms: the Dolomites, Big Sur, Palm '
   'Springs and Aspen.'),
  ('evening_ending', 'dissolves', 'It dissolves',
   'It thins out slowly and the last hour is the best',
   'quiz',
   'Seven rooms, and the level Nantucket''s cell is founder-pending on. See '
   'flipLog in data/destination-matrix.json.'),
  ('evening_ending', 'until_morning', 'It goes until morning',
   'If it ends before very late, something went wrong',
   'quiz',
   'Seven rooms, and the corner the twin rule exists for: Havana and New '
   'Orleans sit in it together and are separated by voice rather than by '
   'shape.');

-- THE FOUR HOURS. These codes are the matrix's `starts` levels and are NOT the
-- option codes — the option says "late", the facet says which end of the day —
-- so scripts/check-facets.mjs reports this bridge as a TRANSLATION and does not
-- compare the words, exactly as it does for a month landing on a season.
--
-- `late` IS DECLARED AND NO DESTINATION HOLDS IT. That is deliberate and the
-- audit prints it as a DEAD level, correctly: not one of the eighteen rooms is
-- authored as beginning at midnight, and moving a cell to populate a level is
-- fitting the evidence to the column. She still gets to say it, because "a late
-- supper" is an hour she can name and the three daylight levels had nowhere to
-- put it — which is the DEFAULT-ONLY failure rule 15 names. The comparison is
-- asymmetric as a result and src/lib/selection/structure.ts holds the table and
-- the argument. The room that BEGINS at midnight is a proposal, not a row: see
-- docs/proposals.md, 2026-08-23.
insert into facet (dimension_code, code, label, description, provenance, notes) values
  ('evening_start', 'morning', 'In the morning',
   'It begins before noon.', 'curator',
   'Two rooms: the Dolomites and the Catskills.'),
  ('evening_start', 'afternoon', 'In the afternoon',
   'It begins in the middle of the day and the light changes while it runs.',
   'curator',
   'Six rooms, including both Mediterranean afternoons.'),
  ('evening_start', 'evening', 'In the evening',
   'It begins after dark, or close enough that the lamps are on.', 'curator',
   'Ten of the eighteen rooms. The default shape of a party, which is why the '
   'level is crowded and why it is not evidence of much on its own.'),
  ('evening_start', 'late', 'Late',
   'It begins after most parties have finished.', 'curator',
   'NO DESTINATION HOLDS THIS LEVEL. It exists on the applicant''s side so a '
   'host who is starting at eleven can say so instead of being recorded as an '
   'ordinary evening. It scores as near-to-`evening`, with the residual '
   'cancelled against a room whose ending is `until_morning`. The rooms that '
   'ARE late-night are reached through evening_ending and not through this.');


-- ── the bridge ───────────────────────────────────────────────────────
--
-- Weight 1.000 on every row. Neither of these is an ordinal question with a
-- signed middle the way `how_made` is (db/016) — "it dissolves" is not half of
-- "it goes until morning", it is a different answer — so nothing here carries a
-- sign and nothing sits at zero.
--
-- Polarity is positive on all seven. Only "what would ruin it" is asked
-- negatively (db/002), and neither of these questions is.

insert into quiz_option_facet (quiz_field, option_code, facet_id, answer_polarity, answer_weight)
select v.quiz_field, v.option_code, f.id, 'positive', 1.000
  from (values
         -- HOW IT ENDS. An identity: the option code is the facet code is the
         -- matrix level. Three files spelling one word the same way.
         ('how_it_ends', 'clean_stop',    'evening_ending', 'clean_stop'),
         ('how_it_ends', 'dissolves',     'evening_ending', 'dissolves'),
         ('how_it_ends', 'until_morning', 'evening_ending', 'until_morning'),

         -- THE HOUR. The SECOND resolution of an answer that already has one:
         -- db/026 already maps these four codes onto `meal_shape` and those
         -- rows are untouched. This is the row that says a late supper starts
         -- late, and it is the only place in the system that says it.
         ('meal_time',   'brunch',      'evening_start', 'morning'),
         ('meal_time',   'lunch',       'evening_start', 'afternoon'),
         ('meal_time',   'long_dinner', 'evening_start', 'evening'),
         ('meal_time',   'late_supper', 'evening_start', 'late')
       ) as v(quiz_field, option_code, dimension, facet_code)
  join facet f on f.dimension_code = v.dimension and f.code = v.facet_code;


-- ── quiz_response_facet, extended ────────────────────────────────────
--
-- One branch added. `create or replace` keeps the column list identical, which
-- it must — record_quiz_signals() and taste_profile_current both read this
-- view. Everything else is byte for byte what db/026 left.
--
-- A null single-select unnests to one null, which joins nothing, so a response
-- written before this question existed contributes no rows here rather than
-- wrong ones.
--
-- THE `meal_time` BRANCH IS UNCHANGED AND NOW RETURNS TWO ROWS, because the
-- join is on (quiz_field, option_code) and the bridge holds two matches. That
-- is the whole mechanism, and it needed no edit here — which is the argument
-- for having widened the key rather than adding a second question.

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
           -- Added by db/037.
           ('how_it_ends',      array[qr.how_it_ends::text])
  ) as src(quiz_field, option_codes)
  cross join lateral unnest(src.option_codes) as ans(option_code)
  join quiz_option_facet m
    on m.quiz_field = src.quiz_field and m.option_code = ans.option_code
  join facet f on f.id = m.facet_id;


-- ── meal_time's comment, superseded in place ─────────────────────────
--
-- CLAUDE.md rule 14: the old reasoning is preserved and beaten, never deleted.
-- db/026's comment on this column said, correctly for the world it was written
-- in: "Asked only of a host whose food_plan is 'sit_down'; 'cocktails' is
-- produced by the food question instead and is never written here." The first
-- clause is now false and the second is still true.

comment on column quiz_response.meal_time is
  'WHAT HOUR IT STARTS, as she answered it, and — where there is a table — '
  'which meal that makes it. Asked of EVERYONE since db/037. db/026 asked it '
  'only of a host whose food_plan was ''sit_down'', on the argument that her '
  'food answer had already settled it; that was wrong, because the food answer '
  'settles whether there is a table and not what time anyone arrives, and the '
  'gate left three of the four food plans stating no hour anywhere in the '
  'system. ''cocktails'' is still never written here: it is produced by the '
  'food question through the no_seated_meal exclusion, and mealShape() checks '
  'that FIRST, so a standing party that says midday is still a cocktail party. '
  'Resolves to TWO facets — meal_shape for the composed table, evening_start '
  'for the structural matrix. Null when she was not asked, and the engine '
  'falls back to ''long_dinner'' for the shape — see src/lib/selection/table.ts.';


-- ─────────────────────────────────────────────────────────────────────
-- WHAT THIS DELIBERATELY DOES NOT DO
--
--   · NO world_facet ROWS, AND NO STRUCTURAL TAGS ON A DESTINATION. This is
--     the whole reason the socket is still empty and it is not an oversight.
--     Writing eighteen rooms' nine cells into world_facet is the change that
--     makes the matrix live, a matrix cell is a GOVERNED CLASS under db/036,
--     and db/002's own rule holds: deciding what a WORLD claims is a curator's
--     decision and not a script's. It arrives founder-signed or it does not
--     arrive.
--
--   · NO SECOND QUESTION FOR `starts`. The hour question exists and now reaches
--     everybody. A second one would put two answers on the page that cannot
--     disagree without one being wrong.
--
--   · NO BACKFILL, on either column. A response written before today was never
--     asked how the evening ends, and inferring it from her occasion or her
--     tones would be inventing an answer and stamping her name on it — db/026's
--     refusal, verbatim. Those rows state no level, and structuralDistance()
--     charges nothing for a column nobody filled in (CLAUDE.md rule 3).
--
--   · NO ROW MOVED TO `starts = late`. The level is declared and claimed by
--     nobody, the audit says so out loud, and that is the catalogue reporting
--     accurately that a room beginning at one in the morning has not been
--     written. Populating a level by re-declaring a cell is fitting the
--     evidence to the column, which is the retro-tagging failure this project
--     exists to escape.
--
--   · NO NEW LEVEL ON `evening_ending`. Three is what the matrix declares and
--     what all eighteen rooms are filled in with. A fourth would have no room
--     to reach and would waste a quarter of a tap.
--
--   · NOTHING TOUCHED IN dish_meal OR ANY CLAIMS TABLE. `meal_shape` means
--     exactly what db/023 said it means; only who gets asked has changed.
-- ─────────────────────────────────────────────────────────────────────
