-- Revelle Société — how many people, and what a head
--
-- Applied by scripts/migrate.mjs after 005, inside one transaction together
-- with its schema_migrations ledger row. Same rule as 001–005: nothing here may
-- be a statement that refuses to run in a transaction.
--
-- New file, never applied anywhere, so no SENTINELS entry in
-- scripts/migrate.mjs. Discovery picks it up; the ledger makes it run once.
--
-- ─────────────────────────────────────────────────────────────────────
-- THE ONE IDEA
--
-- A TOTAL IS NOT A NUMBER YOU CAN COMPARE. $100 a head for six people and
-- $100 a head for forty are the same taste and completely different products;
-- $3,000 spent by six and by forty are the same total and completely different
-- products. Only one of the two figures normalises across the size of the
-- evening, and it is the per-head one.
--
--   per head              → the REGISTER. what kind of thing this is.
--   per head × guests     → the CEILING. what the assemblage may cost.
--   guests                → the QUANTITY. place cards, favours, servings.
--
-- The application asked for neither. It asked "roughly what are you spending?"
-- as a single total band, and it never asked how many people were coming at
-- all — `quiz_response.guest_count` existed as a nullable column that staff
-- filled in from the reply email. So the selection layer had a number it could
-- not interpret and a number it did not have.
--
-- This migration gives both a home, and — the part that takes the most words
-- below — does it without letting a single historical row change meaning.
--
-- ─────────────────────────────────────────────────────────────────────
-- BANDS, NOT NUMBERS, AND WHY THAT IS NOT A COMPROMISE
--
-- Guest count is stored as a BAND. Two reasons, and only one of them is about
-- the copy:
--
--   1. Every other answer in the application is a tap. A spinner asking for an
--      exact integer would be the one moment it turns into a form, for a number
--      she usually does not have yet — a guest list at application time is a
--      hope with names attached.
--   2. An exact number would be FALSE PRECISION in this table. quiz_response is
--      append-only: whatever lands here is frozen for good. "Eleven" recorded in
--      March, when four of them are maybes, is not more accurate than "nine to
--      twelve" — it is the same guess with the uncertainty deleted.
--
-- The exactness that genuinely matters — how many place cards to print, how
-- many favours to buy — is needed at DELIVERY, not at application, and it
-- already has a home: `revelle.guest_count`, which is mutable and belongs to
-- one delivery. That is the number a print run reads. This one is what she said
-- when she applied, and the two must never be confused, which is why the old
-- staff column is renamed below rather than reused.
--
-- The bands are nonetheless ARITHMETIC. `quiz_option_range` gives every band a
-- low, a high and a planning number, so "nine to twelve at $150 a head" resolves
-- to a ceiling in SQL rather than in somebody's head. Every closed band spans
-- less than a factor of two, and they widen as they climb, because that is where
-- resolution is worth paying for: at six people two more changes what we buy, at
-- forty it does not.
--
-- ─────────────────────────────────────────────────────────────────────
-- THE MEANING CHANGE, HANDLED IN THE OPEN
--
-- `budget_band` in 001 means TOTAL EVENT SPEND. Its values are the option codes
-- the application shipped with — under_500 … over_6000 — and rows carrying them
-- were submitted by women answering a question about a total.
--
-- Re-expressing those five values as per-head figures inside the same enum
-- would silently rewrite every one of those answers. A row saying `under_500`
-- would start reading as "under $500 a head", which is not merely wrong, it is
-- wrong by roughly the size of her party. quiz.ts states the rule already: if a
-- code's MEANING changes, retire it and add a new one.
--
-- So:
--
--   · `budget_band` and `quiz_response.budget` STAY, untouched, meaning exactly
--     what they meant. The column becomes nullable — it is now a historical
--     answer, and rows submitted after this migration genuinely do not have one.
--   · `spend_per_person_band` is a NEW type with NEW codes. No value appears in
--     both enums, so no answer can be misread even by a query that forgets which
--     column it is looking at.
--   · A constraint says a response is priced exactly ONE way. Not "at least
--     one" — a row with both would be a row where somebody had to decide which
--     to believe.
--   · The old `budget` facets are DEPRECATED rather than deleted, which is
--     002's own mechanism: the rows stay, historical answers keep resolving to
--     vocabulary, and the term no longer offers itself for new tagging.
--
-- No backfill. Dividing an old total by a guest count we never asked for would
-- be inventing an answer and stamping her name on it. An old row is priced the
-- old way, for good, and `quiz_version` on that row says which question set it
-- was shown.
--
-- ─────────────────────────────────────────────────────────────────────
-- CONTENTS
--
--   guest_count_band          how many people. an enum: closed, ordered, banded
--   spend_per_person_band     what a head. an enum: the old ladder, per person
--   quiz_response.*           the two new answers, and the retired one
--   quiz_response_guard       both new answers frozen; the staff column renamed
--   quiz_option_range         what a band means as a number
--   the vocabulary            dimensions, facets, bridge; budget deprecated
--   quiz_response_facet       extended with two branches
--   quiz_response_scale       the ceiling, computed once, in one place

-- ── the enums ────────────────────────────────────────────────────────
--
-- Enums rather than text, by 001's rule: "Enums are used only where the value
-- set is genuinely closed and structural." A band ladder is exactly that — the
-- set is closed by arithmetic, not by taste, and changing one IS a product
-- decision that deserves a migration. This is the same argument that made
-- `budget_band` an enum and taste directions text[]; nothing about it changed.
--
-- Values are declared in ascending order. PostgreSQL orders an enum by
-- declaration, so `order by guest_count_band` and `where spend_per_person >
-- 'from_150_to_300'` both mean what they look like — which they would not if
-- these were text.

create type guest_count_band as enum (
  'two',
  'from_3_to_5',
  'from_6_to_8',
  'from_9_to_12',
  'from_13_to_20',
  'from_21_to_35',
  'from_36_to_60',
  'over_60'
);

-- The old ladder re-expressed at a table of eight — 500, 1,500, 3,000 and 6,000
-- divided by eight — then rounded to round numbers that double. Eight because
-- it is the middle of what the application actually receives, and the rounding
-- is deliberate: a band edge at $187.50 would imply a precision no host has.
--
-- 'not_sure' is a real answer and not a missing one, exactly as it was under
-- the old question. It carries no range row below, so it produces no ceiling —
-- which is correct, and forces the selection layer to say so rather than
-- quietly assuming a middle band.
create type spend_per_person_band as enum (
  'under_75',
  'from_75_to_150',
  'from_150_to_300',
  'from_300_to_600',
  'over_600',
  'not_sure'
);

-- ── quiz_response ────────────────────────────────────────────────────

alter table quiz_response
  add column guest_count_band guest_count_band,
  add column spend_per_person spend_per_person_band;

-- The retired total. Nullable now — every response submitted from
-- QUIZ_VERSION 2026-08-b onward answers the per-head question instead, and a
-- null here is not a hole to be backfilled but the honest record that this row
-- was never asked that question.
alter table quiz_response
  alter column budget drop not null;

-- THE RENAME. `guest_count` was staff scratch: 001 says outright "Not asked in
-- the v1 quiz … staff fill them in from the reply email until there is a
-- question for them". There is a question for it now, and it is
-- `guest_count_band`. Leaving a column called `guest_count` beside it would
-- guarantee that somebody, eventually, reads the staff number as her answer or
-- her answer as the number to print from. Renaming makes that impossible to do
-- by accident, and costs nothing: it is a scratch column with no reader in src/.
alter table quiz_response
  rename column guest_count to guest_count_confirmed;

alter table quiz_response
  rename constraint quiz_response_guest_count_check
                 to quiz_response_guest_count_confirmed_check;

comment on column quiz_response.guest_count_band is
  'How many people, as SHE answered it. Frozen with every other answer. '
  'Numbers for the band live in quiz_option_range. Null on responses '
  'submitted before db/006, when the question did not exist.';

comment on column quiz_response.spend_per_person is
  'What she is spending A HEAD. The ceiling is this times the guest band; see '
  'quiz_response_scale. Null on responses priced the retired way, in `budget`.';

comment on column quiz_response.guest_count_confirmed is
  'The exact number once staff have it from the reply email — NOT her answer, '
  'which is guest_count_band, and not what a print run reads either, which is '
  'revelle.guest_count. Mutable on purpose: a fact we learn, not a thing she '
  'said.';

comment on column quiz_response.budget is
  'RETIRED. Total event spend, as asked up to QUIZ_VERSION 2026-08-a. Its '
  'values mean totals and must never be read as per-head figures; the per-head '
  'answer is spend_per_person. Null on everything submitted since db/006.';

-- Priced one way or the other, never both and never neither. `num_nonnulls`
-- says it in one line and says it as an assertion about the row rather than as
-- a rule some insert path is trusted to follow.
alter table quiz_response
  add constraint quiz_response_priced_one_way
    check (num_nonnulls(budget, spend_per_person) = 1);

-- A per-head figure without a guest count is not a ceiling, it is a register
-- with nothing to multiply. The two questions were introduced together and are
-- answered together; this keeps that true for every row rather than for every
-- row the current client happens to write.
alter table quiz_response
  add constraint quiz_response_per_person_needs_guests
    check ((spend_per_person is not null) = (guest_count_band is not null));

-- The staff read this replaces: "show me every beach girls-weekend over $3k"
-- becomes "over $150 a head, nine or more". Both columns, in the order they
-- are filtered.
create index quiz_response_scale_idx
  on quiz_response (spend_per_person, guest_count_band);

-- ── the immutability guard, restated ─────────────────────────────────
--
-- 001 lists the frozen columns explicitly "so that adding a column is a
-- deliberate choice about which side of this line it falls on". Two choices,
-- made:
--
--   `guest_count_band` and `spend_per_person` are HER ANSWERS. Frozen. If the
--   party grows she applies again — the same rule every other answer lives
--   under, and the reason the taste profile can be rebuilt from history.
--
--   `guest_count_confirmed` stays MUTABLE, and it is worth being precise about
--   why that is not a contradiction. What changed is that the count is now an
--   answer; what did not change is that this column was never the answer. It is
--   a staff-entered fact learned after the fact, which is the same category as
--   `event_date`, and it is the only category the exemption was ever for. The
--   answer it sits beside is frozen, so the evidentiary record is intact.
--
-- The error message names the columns that may change, so it must be renamed
-- with them — a guard that misdescribes its own rule is worse than no comment.
--
-- Everything else is 005's function verbatim: `create or replace` is the only
-- way PostgreSQL offers, and a diff against 005 should show two added lines and
-- one changed string.

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
     -- Retired, and frozen for the same reason it was always frozen: it is
     -- what she answered, under a question that no longer exists.
     or new.budget           is distinct from old.budget
     -- Added by db/005. Her answer, therefore frozen.
     or new.music_service    is distinct from old.music_service
     -- Added by db/006. Her answers, therefore frozen.
     or new.guest_count_band is distinct from old.guest_count_band
     or new.spend_per_person is distinct from old.spend_per_person
     or new.created_at       is distinct from old.created_at
  then
    raise exception
      'quiz_response % is immutable: only status, event_date and guest_count_confirmed may change. Insert a new response instead.',
      old.id;
  end if;

  return new;
end;
$$;

-- ── quiz_option_range ────────────────────────────────────────────────
--
-- WHAT A BAND MEANS AS A NUMBER.
--
-- "Nine to twelve" is presentation; 9, 12 and 11 are the fact. The fact belongs
-- in the database for the same reason the vocabulary does (002: "The database
-- is the source of truth for what a term IS; the module is the source of truth
-- for how it is PRESENTED") and for one more: the arithmetic is done in SQL, by
-- the selection layer, and a constant that lives in a TypeScript module cannot
-- be joined to.
--
-- Keyed on (quiz_field, option_code) — the same key as the bridge, with a
-- foreign key to it — so a range can only exist for an option that resolves to
-- vocabulary, and so this table generalises to any future banded question
-- without another table or another migration.
--
-- An option with NO row here has no numeric reading. That is a real state, not
-- an omission: 'not_sure' is a genuine answer and the absence of a range is
-- what makes "we cannot compute a ceiling for her" a fact the schema states
-- rather than a null somebody has to remember to check.

create type quiz_range_unit as enum ('guests', 'usd_per_person');

create table quiz_option_range (
  quiz_field   text not null,
  option_code  citext not null,
  unit         quiz_range_unit not null,

  -- Inclusive. `high` is null for an open-topped band, and that null is
  -- load-bearing: an assemblage for "more than sixty" has no ceiling anybody
  -- can compute, and the curator must ask. Do not coalesce it to a guess.
  low          numeric(12,2) not null check (low >= 0),
  high         numeric(12,2),

  -- The number to PLAN against: the midpoint, rounded up. Rounded up because
  -- planning short is the expensive direction — a place card too few is a
  -- person without a seat. Anything that must not run short should use `high`,
  -- and handle its null.
  typical      numeric(12,2) not null,

  created_at   timestamptz not null default now(),

  primary key (quiz_field, option_code),
  foreign key (quiz_field, option_code)
    references quiz_option_facet (quiz_field, option_code) on delete restrict,

  constraint quiz_option_range_ordered
    check (high is null or high >= low),
  constraint quiz_option_range_typical_within
    check (typical >= low and (high is null or typical <= high))
);

comment on table quiz_option_range is
  'The numeric reading of a banded quiz option. No row means the option has no '
  'numeric reading at all — see "not sure". Added by db/006.';

-- ── the vocabulary ───────────────────────────────────────────────────
--
-- Two new dimensions. Neither is a taste, and 005 already argued this case for
-- `music_service`: a dimension no ingredient is ever tagged with contributes
-- exactly nothing to any facet-overlap score, so it is queryable and inert.
-- The same safeguard applies here and matters more, because a scale is the one
-- thing that must act as a CONSTRAINT and never as a preference. Nothing in the
-- catalogue is tagged 'from_9_to_12'; the ceiling binds through
-- quiz_response_scale, not through the score.
--
-- They are in the bridge anyway because scripts/check-facets.mjs fails a build
-- when a quiz option resolves to no facet, and exempting a field from the bridge
-- would exempt it from that check.

insert into facet_dimension (code, label, description, position) values
  ('guest_count', 'How many people',
   'The size of the evening, banded. A CONSTRAINT, not a taste — it scales quantities and, with spend_per_person, sets the ceiling. No ingredient is ever tagged in this dimension; see db/006.',
   130),
  ('spend_per_person', 'Spend per person',
   'What she is spending a head. Replaces the `budget` dimension, which was a total and is deprecated. A CONSTRAINT, not a taste; no ingredient is tagged in this dimension.',
   140);

-- Labels and descriptions copied verbatim from each option's `label` and `hint`
-- in src/lib/quiz.ts, including where the hint is empty, so
-- scripts/check-facets.mjs reports zero drift on a clean tree.
insert into facet (dimension_code, code, label, description, provenance) values
  -- guest_count — GUEST_COUNTS in src/lib/quiz.ts
  ('guest_count', 'two',           'Two of us',                 '', 'quiz'),
  ('guest_count', 'from_3_to_5',   'Three to five',             '', 'quiz'),
  ('guest_count', 'from_6_to_8',   'Six to eight',              '', 'quiz'),
  ('guest_count', 'from_9_to_12',  'Nine to twelve',            '', 'quiz'),
  ('guest_count', 'from_13_to_20', 'Thirteen to twenty',        '', 'quiz'),
  ('guest_count', 'from_21_to_35', 'Twenty-one to thirty-five', '', 'quiz'),
  ('guest_count', 'from_36_to_60', 'Thirty-six to sixty',       '', 'quiz'),
  ('guest_count', 'over_60',       'More than sixty',           '', 'quiz'),

  -- spend_per_person — SPEND_PER_PERSON in src/lib/quiz.ts
  ('spend_per_person', 'under_75',        'Under $75',    '', 'quiz'),
  ('spend_per_person', 'from_75_to_150',  '$75 to $150',  '', 'quiz'),
  ('spend_per_person', 'from_150_to_300', '$150 to $300', '', 'quiz'),
  ('spend_per_person', 'from_300_to_600', '$300 to $600', '', 'quiz'),
  ('spend_per_person', 'over_600',        'Over $600',    '', 'quiz'),
  ('spend_per_person', 'not_sure',        'Not sure yet',
   'We will show you what each level buys', 'quiz');

update facet
   set notes = 'A real answer, not a missing one. It carries no row in '
               'quiz_option_range, so no ceiling can be computed and the '
               'curator is told so rather than shown a guess.'
 where dimension_code = 'spend_per_person' and code = 'not_sure';

update facet
   set notes = 'Open-topped. quiz_option_range gives it a floor and a planning '
               'number but no high, so anything counted must be confirmed with '
               'her before it is printed or bought.'
 where dimension_code = 'guest_count' and code = 'over_60';

-- The bridge, generated from the dimension-to-field correspondence the way 002
-- and 005 generate it: the facet code IS the option code, because both come
-- from the same module.
insert into quiz_option_facet (quiz_field, option_code, facet_id, answer_polarity)
select m.quiz_field, f.code, f.id, 'positive'
  from facet f
  join (values
         ('guest_count',      'guest_count_band'),
         ('spend_per_person', 'spend_per_person')
       ) as m(dimension_code, quiz_field)
    on m.dimension_code = f.dimension_code;

-- The retired vocabulary. 002's own mechanism, stated there: "Retiring a term
-- is `status = 'deprecated'`. The row STAYS, so every reference keeps
-- resolving." Every historical answer of `under_500` still joins to a facet and
-- still reads "Under $500" — a total, as it always did — and the term stops
-- offering itself for new tagging.
--
-- The quiz_option_facet rows are left in place deliberately: they are what
-- makes quiz_response_facet still resolve an old row, and
-- scripts/check-facets.mjs reports them as retired rather than failing, which is
-- exactly the case it was written for.
update facet
   set status = 'deprecated',
       deprecated_at = now(),
       notes = coalesce(notes || ' ', '') ||
               'Retired by db/006. A TOTAL, not a per-head figure. The '
               'question this answered was replaced by spend_per_person; the '
               'row stays so historical answers keep resolving.'
 where dimension_code = 'budget';

update facet_dimension
   set description = description ||
                     ' RETIRED by db/006 — replaced by spend_per_person. Kept '
                     'so that answers given before 2026-08-b still resolve.'
 where code = 'budget';

-- ── quiz_response_facet, extended ────────────────────────────────────
--
-- Two branches added. `create or replace` keeps the column list identical,
-- which it must — record_quiz_signals() and taste_profile_current both read
-- this view.
--
-- The `budget` branch stays. Old rows must keep resolving; new rows have a null
-- there, and array[null] unnests to one null which joins nothing, so a retired
-- question contributes no row rather than a wrong one. The same is true in
-- reverse for the two new branches on an old row.

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
       m.answer_polarity as polarity
  from quiz_response qr
  cross join lateral (
    values ('taste_directions', qr.taste_directions),
           ('group_fun',        qr.group_fun),
           ('anti_preferences', qr.anti_preferences),
           ('affinities',       qr.affinities),
           ('occasion',         array[qr.occasion::text]),
           ('environment',      array[qr.environment::text]),
           -- Retired. Null on everything submitted since db/006; the rows that
           -- have it resolve to deprecated facets, which is visible in
           -- facet_status rather than hidden.
           ('budget',           array[qr.budget::text]),
           ('music_service',    array[qr.music_service::text]),
           ('guest_count_band', array[qr.guest_count_band::text]),
           ('spend_per_person', array[qr.spend_per_person::text])
  ) as src(quiz_field, option_codes)
  cross join lateral unnest(src.option_codes) as ans(option_code)
  join quiz_option_facet m
    on m.quiz_field = src.quiz_field and m.option_code = ans.option_code
  join facet f on f.id = m.facet_id;

-- ── quiz_response_scale ──────────────────────────────────────────────
--
-- THE CEILING, DEFINED ONCE.
--
-- This is arithmetic, not selection. It chooses nothing and ranks nothing; it
-- turns two bands into the numbers every downstream reader would otherwise
-- derive for itself, differently, in three places. docs/selection-spec.md
-- carries budget as a running constraint through the beam search — this is the
-- number that constraint is against.
--
-- Three figures, and the difference between them is the whole point:
--
--   budget_planning   what to build to. Both planning numbers multiplied.
--                     Always available when she gave a priced answer.
--   budget_ceiling    what must not be exceeded. Both HIGHS multiplied, and
--                     therefore NULL when either band is open-topped. A null
--                     ceiling means "ask her", not "no limit".
--   guests_high       what to count for anything printed or bought per head.
--                     Null for "more than sixty", same rule.
--
-- Left joins throughout: every response appears, including one priced the
-- retired way, whose numbers are all null and whose `retired_budget_band` says
-- why.

create view quiz_response_scale as
select qr.id            as quiz_response_id,
       qr.customer_id,
       qr.created_at,
       qr.quiz_version,

       qr.guest_count_band,
       g.low            as guests_low,
       g.high           as guests_high,
       g.typical        as guests_planning,

       qr.spend_per_person,
       s.low            as per_person_low,
       s.high           as per_person_high,
       s.typical        as per_person_planning,

       s.typical * g.typical as budget_planning,
       s.high    * g.high    as budget_ceiling,

       -- Priced the retired way. Null for everything submitted since db/006,
       -- and the reason the columns above are null when it is not.
       qr.budget        as retired_budget_band
  from quiz_response qr
  left join quiz_option_range g
    on g.quiz_field = 'guest_count_band'
   and g.option_code = qr.guest_count_band::text
  left join quiz_option_range s
    on s.quiz_field = 'spend_per_person'
   and s.option_code = qr.spend_per_person::text;

comment on view quiz_response_scale is
  'Her two scale answers as numbers. budget_planning is what to build to; '
  'budget_ceiling is what must not be exceeded and is NULL when a band is '
  'open-topped, which means ask her, not no limit. Added by db/006.';

-- ── the ranges themselves ────────────────────────────────────────────
--
-- Last, because the foreign key needs the bridge rows above.
--
-- Guests: every closed band spans less than a factor of two, and they widen as
-- they climb. `typical` is the midpoint rounded up.
--
-- The floor of 'over_60' is 61 and its planning number 75, which is a judgement
-- and not a derivation — it is the number to plan against when someone says
-- "more than sixty", and it has no high on purpose.

insert into quiz_option_range (quiz_field, option_code, unit, low, high, typical) values
  ('guest_count_band', 'two',           'guests',  2,    2, 2),
  ('guest_count_band', 'from_3_to_5',   'guests',  3,    5, 4),
  ('guest_count_band', 'from_6_to_8',   'guests',  6,    8, 7),
  ('guest_count_band', 'from_9_to_12',  'guests',  9,   12, 11),
  ('guest_count_band', 'from_13_to_20', 'guests', 13,   20, 17),
  ('guest_count_band', 'from_21_to_35', 'guests', 21,   35, 28),
  ('guest_count_band', 'from_36_to_60', 'guests', 36,   60, 48),
  ('guest_count_band', 'over_60',       'guests', 61, null, 75),

  -- Dollars a head. 'under_75' has a floor of zero because "under" has no other
  -- honest floor. 'not_sure' is absent, which is what makes it unpriced.
  ('spend_per_person', 'under_75',        'usd_per_person',   0,   75,  50),
  ('spend_per_person', 'from_75_to_150',  'usd_per_person',  75,  150, 113),
  ('spend_per_person', 'from_150_to_300', 'usd_per_person', 150,  300, 225),
  ('spend_per_person', 'from_300_to_600', 'usd_per_person', 300,  600, 450),
  ('spend_per_person', 'over_600',        'usd_per_person', 600, null, 800);

-- ─────────────────────────────────────────────────────────────────────
-- WHAT THIS DELIBERATELY DOES NOT DO
--
--   · No backfill of `spend_per_person` from `budget`. See above; it would be
--     inventing an answer.
--   · No trigger keeping `revelle.guest_count` in step with
--     `guest_count_confirmed` or with the band. They answer different
--     questions at different times, and 002's warning about two representations
--     of one fact applies to a SYNC, not to a lineage: a curator seeds the
--     delivery count from what she said, and from then on the delivery count is
--     the one that prints.
--   · No ceiling ENFORCEMENT. quiz_response_scale states the number; where and
--     how hard it binds is docs/selection-spec.md's problem, and it is still
--     open there.
