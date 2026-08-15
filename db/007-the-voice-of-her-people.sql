-- Revelle Société — how her people talk
--
-- Applied by scripts/migrate.mjs after 006, inside one transaction together
-- with its schema_migrations ledger row. Same rule as 001–006: nothing here may
-- be a statement that refuses to run in a transaction.
--
-- New file, never applied anywhere, so no SENTINELS entry in
-- scripts/migrate.mjs. Discovery picks it up; the ledger makes it run once.
--
-- ─────────────────────────────────────────────────────────────────────
-- THE ONE IDEA
--
-- A DESTINATION IS A LOOK AND A VOICE, AND THE APPLICATION ONLY ASKED ABOUT
-- THE LOOK. Occasion, setting, taste direction, how the group has fun, what
-- would ruin it, the table, the scale — every one of those decides what her
-- Revelle looks like. Nothing asked how her people TALK, and the writing is the
-- half her guests actually hold in their hands.
--
-- That gap is not cosmetic. WESTHAMPTON, 1976 speaks as the house: dry, clipped,
-- never explains a joke. For some groups that is exactly right and for others it
-- reads as cold, and no palette choice repairs it. See "The voice questions" in
-- docs/build-checklist.md, which asked for this in the form it takes here: a
-- voice dimension in the facet vocabulary, so matching a register is the same
-- set operation as matching a taste.
--
-- ─────────────────────────────────────────────────────────────────────
-- TWO LAYERS, AND WHY NEITHER WORKS ALONE
--
--   TONES        fifty things a host recognises about her friends. "Talks
--                almost entirely in in-jokes." This is all she is ever shown.
--   VOICE FACETS the twenty-six axes a tone resolves to — the closed
--                vocabularies of src/lib/tokens.ts (formality, address, humour
--                mode) plus the cadence and manner axes those do not carry.
--
-- Asked directly for a `formality` a host has no answer, because nobody thinks
-- about their friends in that word. Shown fifty tones with nothing underneath
-- them, matching would be string comparison against a destination's prose. So
-- she taps the surface, `voice_tone_facet` resolves it, and both sides of the
-- eventual match are expressed in one vocabulary with real foreign keys.
--
-- ─────────────────────────────────────────────────────────────────────
-- WHAT A TONE SHE DID NOT TAP MEANS. NOTHING.
--
-- Read this before adding rows to anything below.
--
-- She is shown fifty tiles and taps a handful. The forty-odd she leaves are
-- overwhelmingly ones she never considered — she found three that were right
-- and stopped reading. A tone she did not choose is therefore SILENCE, and it
-- must produce NO ROW: not a negative, and not a zero-weight row "for
-- completeness", which is the shape this mistake will arrive in. A vector that
-- carries forty claims she never made is a vector where the seven she did make
-- cannot be seen, and the genuine negatives below — `understated` really is a
-- claim against theatricality — become indistinguishable from phantoms.
--
-- So: a negative weight only ever arrives INSIDE a tone she chose. Absence is
-- absence. `quiz_response_voice` produces rows only for tones in the array.
--
-- THE COROLLARY, because it will be tempting: this question cannot produce a
-- veto. "She would hate somewhere theatrical" is not knowable from tiles she
-- did not tap. Vetoes come from the question that asks for one — "what would
-- ruin it", `anti_preferences`, whose bridge rows carry `answer_polarity =
-- 'negative'` precisely so the two kinds of statement never get confused. That
-- question stays exactly where it is and this one does not encroach on it.
--
-- ─────────────────────────────────────────────────────────────────────
-- WHY THE CATALOGUE IS TAGGED IN THE SAME FIFTY WORDS
--
-- The tones are the entire semantic bandwidth between a host and this library.
-- If a destination were characterised in a richer private vocabulary — its own
-- facet weights, hand-tuned across all twenty-six axes — the join between her
-- handful of taps and that description would return mush, because she was never
-- given a way to make most of those claims.
--
-- So a destination is tagged with TONES, in `world_facet`, at whatever weight a
-- curator thinks true; its voice profile is those tags resolved through the same
-- table her answers go through, plus the three facets its voice states outright.
-- That makes the vocabulary falsifiable: a destination whose voice cannot be
-- written in six to ten tones is one this question cannot match, and the answer
-- is to fix the tones rather than to describe around them. WESTHAMPTON, 1976 is
-- nine — see DESTINATION_TONES in src/lib/destinations.ts.
--
-- ─────────────────────────────────────────────────────────────────────
-- CONTENTS
--
--   quiz_response.voice_tones  what she tapped. frozen with every other answer
--   the vocabulary             two dimensions, fifty tones, twenty-six axes
--   voice_tone_facet           the resolution, weighted and signed
--   voice_token_facet          the three facets a voice states outright
--   quiz_response_facet        extended with one branch
--   quiz_response_voice        her tones as a voice profile
--   world_voice_profile        a destination's, in the same shape

-- ── quiz_response ────────────────────────────────────────────────────
--
-- text[] and not an enum, for the reason 001 gives for taste_directions: this
-- is a multi-select over a vocabulary that grows on taste, and the array is the
-- EVIDENTIARY record of what she picked. What it MEANS lives in the facet
-- tables, and the two are joined on demand — so retiring a tone cannot rewrite
-- a single stored answer.
--
-- Default '{}' rather than null, matching every other multi-select here. An
-- empty array on a response from before QUIZ_VERSION 2026-08-c means the
-- question did not exist, not that she declined it; `quiz_version` on the row
-- says which. The client requires at least one and the server validates the
-- same rule, so an empty array cannot arrive from a live submission.

alter table quiz_response
  add column voice_tones text[] not null default '{}';

comment on column quiz_response.voice_tones is
  'How her people talk, as SHE tapped it. Only chosen tones appear: a tone that '
  'is absent was not rejected, it was not considered. Never infer a dislike '
  'from this column — anti_preferences is where vetoes live. Empty on '
  'responses submitted before QUIZ_VERSION 2026-08-c.';

-- The ceiling from src/lib/quiz.ts, restated as an assertion about the row.
--
-- Seven is a judgement rather than a round number: a tone resolves to two or
-- three voice facets, so seven make roughly eighteen claims across twenty-six
-- axes — enough for a group that is dry AND warm AND loud, which real groups
-- are, while leaving most of the space unclaimed. At a dozen almost every axis
-- has been touched by something and the profile stops telling two destinations
-- apart, which is the only job it has.
--
-- Not a floor of one, deliberately: rows written before this migration have
-- none, and a constraint that historical rows violate is a constraint that
-- cannot be added. The floor is the client's and the route handler's.
alter table quiz_response
  add constraint quiz_response_voice_tones_count
    check (cardinality(voice_tones) <= 7);

-- "Everyone who said her people talk in in-jokes." Same access pattern, and the
-- same index type, as taste_directions and group_fun.
create index quiz_response_voice_tones_idx
  on quiz_response using gin (voice_tones);

-- ── the immutability guard, restated ─────────────────────────────────
--
-- 001 lists the frozen columns explicitly "so that adding a column is a
-- deliberate choice about which side of this line it falls on". The choice:
-- `voice_tones` is HER ANSWER, so it is frozen with the rest. If her people
-- turn out to be louder than she said, she applies again.
--
-- Everything else is 006's function verbatim — `create or replace` is the only
-- way PostgreSQL offers — and a diff against 006 should show two added lines
-- and nothing else. The error message is unchanged because the set of mutable
-- columns is unchanged.

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
     -- Added by db/007. Her answer, therefore frozen.
     or new.voice_tones      is distinct from old.voice_tones
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
-- Two dimensions, and they are not the same kind of thing.
--
-- `voice_tone` is a QUIZ VOCABULARY, like taste_direction: she picks from it,
-- and the catalogue is tagged in it. Both sides, one list — see the note above.
--
-- `voice` is a RESOLUTION vocabulary. Nobody picks from it and nothing is
-- tagged in it by hand; it is what a tone means, and it exists as rows rather
-- than as an enum for the reason db/002 gives for every dimension: "add a
-- formality axis" should be an insert.
--
-- The existing `formality` dimension (002, position 90, empty by design) is
-- about how DRESSED an evening is. This is about how a sentence is built. Codes
-- are unique within a dimension, so `formality_formal` here and a future
-- `black_tie` there cannot collide, and neither can be mistaken for the other.

insert into facet_dimension (code, label, description, position) values
  ('voice_tone', 'How her people talk',
   'The fifty tones a host is shown, and the same fifty a destination is tagged with. The surface of the voice question; what a tone MEANS is the voice dimension, resolved by voice_tone_facet. See db/007.',
   150),
  ('voice', 'Voice',
   'The axes a tone resolves to: the closed vocabularies of src/lib/tokens.ts — formality, address, humour mode — plus cadence and the signed manner axes. A RESOLUTION vocabulary: nothing is tagged in it by hand and nobody is shown it. See db/007.',
   160);

-- The axes. Labels and descriptions are VOICE_FACETS in src/lib/voice.ts, which
-- is where they are argued about; these are the same words in rows.
--
-- The manner descriptions name BOTH ENDS, because those facets are bipolar and
-- a weight of -0.9 on `theatricality` is a real claim rather than a missing
-- one. Formality, address and humour are categorical instead — a voice has one
-- of each — so a negative there means "not this one".
insert into facet (dimension_code, code, label, description, provenance) values
  -- formality
  ('voice', 'formality_ceremonial',    'Ceremonial',              'Engraved. Third person, no contractions, nothing casual.', 'curator'),
  ('voice', 'formality_formal',        'Formal',                  'A good hotel''s notice board.', 'curator'),
  ('voice', 'formality_cordial',       'Cordial',                 'A well-written note between people who know each other.', 'curator'),
  ('voice', 'formality_plain',         'Plain',                   'Says the thing.', 'curator'),
  ('voice', 'formality_familiar',      'Familiar',                'The way these people actually talk.', 'curator'),
  -- address
  ('voice', 'address_second_person',   'Second person',           'You are expected Friday.', 'curator'),
  ('voice', 'address_third_person',    'Third person',            'Guests are reminded that.', 'curator'),
  ('voice', 'address_collective_first', 'Collective first person', 'We do not discuss the second night.', 'curator'),
  ('voice', 'address_impersonal',      'Impersonal',              'Breakfast is theoretical.', 'curator'),
  -- humour
  ('voice', 'humour_none',             'No joke',                 'The writing carries no joke at all, and is not the poorer.', 'curator'),
  ('voice', 'humour_dry',              'Dry',                     'The joke is a fact, stated and not returned to.', 'curator'),
  ('voice', 'humour_deadpan',          'Deadpan',                 'The outrageous thing in the same tone as the hour of dinner.', 'curator'),
  ('voice', 'humour_arch',             'Arch',                    'Says one thing and means the other, and trusts you to hear it.', 'curator'),
  ('voice', 'humour_warm',             'Warm',                    'The joke is affection. Nobody is the target except a friend.', 'curator'),
  ('voice', 'humour_absurd',           'Absurd',                  'Commits to a ridiculous premise and does not blink.', 'curator'),
  -- cadence
  ('voice', 'cadence_clipped',         'Clipped',                 'Short declaratives. A noun phrase is a whole sentence.', 'curator'),
  ('voice', 'cadence_unhurried',       'Unhurried',               'Long lines that take their time and are not in a hurry to land.', 'curator'),
  ('voice', 'cadence_rapid',           'Rapid',                   'Quick, overlapping, one thing on top of the last.', 'curator'),
  ('voice', 'cadence_ornate',          'Ornate',                  'Builds. Subordinate clauses, and a list that arrives in three.', 'curator'),
  -- manner
  ('voice', 'warmth',                  'Warmth',                  'Positive: says the fond thing out loud. Negative: keeps a pleasant distance.', 'curator'),
  ('voice', 'volume',                  'Volume',                  'Positive: several people at once. Negative: one voice at a time, low.', 'curator'),
  ('voice', 'irreverence',             'Irreverence',             'Positive: nothing is sacred, including each other. Negative: nobody is ever rude.', 'curator'),
  ('voice', 'precision',               'Precision',               'Positive: the exact word, the exact hour. Negative: near enough, roughly.', 'curator'),
  ('voice', 'knowingness',             'Knowingness',             'Positive: assumes you were there and explains nothing. Negative: tells you properly.', 'curator'),
  ('voice', 'earnestness',             'Earnestness',             'Positive: means it, plainly, with no armour. Negative: everything through irony.', 'curator'),
  ('voice', 'theatricality',           'Theatricality',           'Positive: performs it, and performs it twice. Negative: says less than it means.', 'curator');

-- The tones. Labels are copied verbatim from TONES in src/lib/voice.ts and the
-- descriptions are empty because the tiles carry no hint line — so
-- scripts/check-facets.mjs reports zero drift on a clean tree, which is the
-- only kind of drift check anyone reads. What a tone means to a curator is in
-- `notes` below, and what it means to the system is voice_tone_facet.
insert into facet (dimension_code, code, label, description, provenance) values
  -- When something is funny
  ('voice_tone', 'deadpan',               'Says the outrageous thing with a straight face',    '', 'quiz'),
  ('voice_tone', 'dry_aside',             'The best line is muttered, not announced',          '', 'quiz'),
  ('voice_tone', 'teasing',               'Teases the people it loves the most',               '', 'quiz'),
  ('voice_tone', 'in_jokes',              'Talks almost entirely in in-jokes',                 '', 'quiz'),
  ('voice_tone', 'absurd',                'Follows a stupid idea all the way to the end',      '', 'quiz'),
  ('voice_tone', 'self_deprecating',      'Gets there first about themselves',                 '', 'quiz'),
  ('voice_tone', 'nothing_sacred',        'Nothing is off limits, including each other',       '', 'quiz'),
  -- How loud a room they are
  ('voice_tone', 'all_at_once',           'Four conversations, all at once',                   '', 'quiz'),
  ('voice_tone', 'interrupts',            'Finishes each other''s sentences',                  '', 'quiz'),
  ('voice_tone', 'one_conversation',      'One conversation, and everyone in it',              '', 'quiz'),
  ('voice_tone', 'across_the_room',       'Will shout something across the room',              '', 'quiz'),
  ('voice_tone', 'low_voices',            'Says the important part quietly',                   '', 'quiz'),
  ('voice_tone', 'laughs_first',          'Laughs before the end of the sentence',             '', 'quiz'),
  -- How much ceremony they can take
  ('voice_tone', 'toasts',                'Someone always stands up to say something',         '', 'quiz'),
  ('voice_tone', 'rises_to_greet',        'Stands up when someone new arrives',                '', 'quiz'),
  ('voice_tone', 'seating_plan',          'Wants to know where they are sitting',              '', 'quiz'),
  ('voice_tone', 'no_speeches',           'Would rather nobody made a speech',                 '', 'quiz'),
  ('voice_tone', 'dressed_up',            'Dresses for dinner without being asked',            '', 'quiz'),
  ('voice_tone', 'first_names',           'First names from the first minute',                 '', 'quiz'),
  -- How they say the kind thing
  ('voice_tone', 'says_it_out_loud',      'Says the loving thing out loud, sober',             '', 'quiz'),
  ('voice_tone', 'nicknames',             'Everyone has a name only this group uses',          '', 'quiz'),
  ('voice_tone', 'asks_properly',         'Asks how you are and waits for the answer',         '', 'quiz'),
  ('voice_tone', 'warm_not_loud',         'Fond of each other and quiet about it',             '', 'quiz'),
  ('voice_tone', 'compliments_plainly',   'Pays a compliment without hiding it in a joke',     '', 'quiz'),
  ('voice_tone', 'sentimental',           'Cries at the toast and is not embarrassed',         '', 'quiz'),
  -- How exact they are
  ('voice_tone', 'exact_word',            'Hunts for the exact word and finds it',             '', 'quiz'),
  ('voice_tone', 'will_look_it_up',       'Settles the argument with a phone',                 '', 'quiz'),
  ('voice_tone', 'corrects_gently',       'Corrects the year, kindly, every time',             '', 'quiz'),
  ('voice_tone', 'understated',           'Says less than it means and lets it sit',           '', 'quiz'),
  ('voice_tone', 'roughly_eight',         'Says around eight and means somewhere after nine',  '', 'quiz'),
  ('voice_tone', 'long_way_round',        'Tells it the long way, with the detours',           '', 'quiz'),
  -- How fast the evening moves
  ('voice_tone', 'unhurried',             'Nobody hurries anybody',                            '', 'quiz'),
  ('voice_tone', 'talks_fast',            'Talks fast and expects you to keep up',             '', 'quiz'),
  ('voice_tone', 'arrives_late',          'Arrives when it arrives',                           '', 'quiz'),
  ('voice_tone', 'lingers',               'Still at the table two hours after the plates',     '', 'quiz'),
  ('voice_tone', 'no_dead_air',           'Never lets a silence sit',                          '', 'quiz'),
  ('voice_tone', 'comfortable_silence',   'Can sit in a silence without filling it',           '', 'quiz'),
  -- What they assume you already know
  ('voice_tone', 'leans_in',              'Leans in to say the good part',                     '', 'quiz'),
  ('voice_tone', 'explains_nothing',      'Explains nothing, on principle',                    '', 'quiz'),
  ('voice_tone', 'straight_to_gossip',    'Gets to the good part before the coats are off',    '', 'quiz'),
  ('voice_tone', 'means_the_other_thing', 'Says one thing, means the other, everyone knows',   '', 'quiz'),
  ('voice_tone', 'between_us',            'What is said at this table stays at this table',    '', 'quiz'),
  ('voice_tone', 'spells_it_out',         'Would rather everyone were told properly',          '', 'quiz'),
  -- How much they perform
  ('voice_tone', 'makes_an_entrance',     'Someone always makes an entrance',                  '', 'quiz'),
  ('voice_tone', 'does_the_voice',        'Will do the voice, and do it twice',                '', 'quiz'),
  ('voice_tone', 'one_tells_it',          'One of them tells it and the rest let her',         '', 'quiz'),
  ('voice_tone', 'nothing_by_halves',     'Nothing here is done by halves',                    '', 'quiz'),
  ('voice_tone', 'never_performs',        'Would rather die than perform',                     '', 'quiz'),
  ('voice_tone', 'swears_fondly',         'Swears, warmly, in company',                        '', 'quiz'),
  ('voice_tone', 'impeccably_polite',     'Impeccably polite at three in the morning',         '', 'quiz');

update facet
   set notes = 'Presentation order and the group headings are TONE_GROUPS in '
               'src/lib/voice.ts; the engraved mark on the tile is TONE_MARKS '
               'in src/app/quiz/tone-marks.tsx. A tone with no mark still '
               'renders — the label is the content.'
 where dimension_code = 'voice_tone';

-- The bridge, generated from the dimension-to-field correspondence exactly as
-- 002, 005 and 006 generate it: the facet code IS the option code, because both
-- come from the same module.
--
-- `answer_polarity` is 'positive' for every row, and that is the whole point of
-- the note at the top of this file. Choosing a tone is a POSITIVE statement
-- about her people. The negatives in this feature live one layer down, inside
-- the tones themselves, where they belong to a claim she actually made.
insert into quiz_option_facet (quiz_field, option_code, facet_id, answer_polarity)
select 'voice_tones', f.code, f.id, 'positive'
  from facet f
 where f.dimension_code = 'voice_tone';

-- ── voice_tone_facet ─────────────────────────────────────────────────
--
-- THE RESOLUTION. What a tone MEANS, as rows.
--
-- ── why a table and not a column of jsonb ────────────────────────────
--
-- Because the selection layer joins on it. A weighting kept in a jsonb blob (or
-- in the TypeScript module alone) cannot be joined, cannot be constrained, and
-- cannot be corrected by a curator without a deploy. This is the same argument
-- db/002 makes for the facet vocabulary itself and db/006 makes for
-- quiz_option_range.
--
-- ── why the two composite foreign keys ───────────────────────────────
--
-- They make the DIMENSIONS structural. Without them nothing stops a tone
-- resolving to another tone, or a voice axis resolving to an occasion, and the
-- error would surface as a match that is quietly wrong rather than as an insert
-- that fails. `facet` gains a redundant unique (id, dimension_code) so the
-- constant columns below can point at it; the constants can only hold one value
-- each, so the check plus the foreign key together say "this column references a
-- facet, and that facet is in this dimension".

alter table facet
  add constraint facet_id_dimension_unique unique (id, dimension_code);

create table voice_tone_facet (
  tone_facet_id  uuid not null references facet(id) on delete restrict,
  voice_facet_id uuid not null references facet(id) on delete restrict,

  -- Constant. See above — these exist to be the second half of a composite
  -- foreign key, and a check that pins them is what makes them constant.
  tone_dimension  text not null default 'voice_tone'
    check (tone_dimension = 'voice_tone'),
  voice_dimension text not null default 'voice'
    check (voice_dimension = 'voice'),

  -- Signed, -1..1, never zero: the same scale and the same reasoning as every
  -- facet tag in this system (install_facet_tags in db/002).
  --
  --   +1.0  the tone IS this axis. "Explains nothing, on principle" is
  --         knowingness and nothing else.
  --   +0.3  incidentally so.
  --   -0.9  the tone is a claim AGAINST the axis. "Says less than it means" is
  --         not merely un-theatrical, it repudiates theatricality, and a
  --         destination that performs must lose for it rather than merely fail
  --         to gain. This is the only place a negative may originate, and it
  --         belongs to a tone SHE CHOSE. See the note at the top.
  weight numeric(4,3) not null
    check (weight >= -1 and weight <= 1 and weight <> 0),

  -- Why this weight, in the curator's words. Optional, and the only place the
  -- reasoning behind a hand-tuned number survives.
  note       text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  primary key (tone_facet_id, voice_facet_id),
  foreign key (tone_facet_id, tone_dimension)
    references facet (id, dimension_code),
  foreign key (voice_facet_id, voice_dimension)
    references facet (id, dimension_code)
);

create trigger voice_tone_facet_touch before update on voice_tone_facet
  for each row execute function set_updated_at();

-- "Everything that resolves to knowingness, strongest first" — the read the
-- matcher lives on, and the opposite direction from the primary key.
create index voice_tone_facet_voice_idx
  on voice_tone_facet (voice_facet_id, weight desc);

comment on table voice_tone_facet is
  'What a tone MEANS. Fifty tones resolve to twenty-six voice axes, weighted '
  'and signed. Authored in src/lib/voice.ts, where the weights are reviewable '
  'in a diff; scripts/check-facets.mjs fails if the two drift. Added by db/007.';

-- Joined by code rather than listed with uuids, so this reads as the mapping it
-- is and a typo is a missing join rather than a wrong row. The count is
-- asserted at the end of the file.
insert into voice_tone_facet (tone_facet_id, voice_facet_id, weight)
select t.id, v.id, m.weight
  from (values
         -- When something is funny
         ('deadpan',               'humour_deadpan',           1.0::numeric),
         ('deadpan',               'theatricality',           -0.5),
         ('deadpan',               'earnestness',             -0.3),
         ('dry_aside',             'humour_dry',               0.9),
         ('dry_aside',             'volume',                  -0.5),
         ('dry_aside',             'theatricality',           -0.6),
         ('dry_aside',             'cadence_clipped',          0.4),
         ('teasing',               'humour_warm',              0.8),
         ('teasing',               'irreverence',              0.5),
         ('teasing',               'formality_familiar',       0.6),
         ('teasing',               'warmth',                   0.5),
         ('in_jokes',              'knowingness',              1.0),
         ('in_jokes',              'formality_familiar',       0.8),
         ('in_jokes',              'address_collective_first', 0.5),
         ('absurd',                'humour_absurd',            1.0),
         ('absurd',                'theatricality',            0.4),
         ('absurd',                'precision',               -0.3),
         ('self_deprecating',      'humour_dry',               0.6),
         ('self_deprecating',      'warmth',                   0.4),
         ('self_deprecating',      'theatricality',           -0.3),
         ('nothing_sacred',        'irreverence',              1.0),
         ('nothing_sacred',        'formality_familiar',       0.6),
         ('nothing_sacred',        'humour_arch',              0.4),
         -- How loud a room they are
         ('all_at_once',           'volume',                   1.0),
         ('all_at_once',           'cadence_rapid',            0.7),
         ('all_at_once',           'formality_familiar',       0.4),
         ('interrupts',            'cadence_rapid',            0.9),
         ('interrupts',            'volume',                   0.5),
         ('interrupts',            'knowingness',              0.4),
         ('one_conversation',      'volume',                  -0.6),
         ('one_conversation',      'cadence_unhurried',        0.5),
         ('one_conversation',      'precision',                0.3),
         ('across_the_room',       'volume',                   0.9),
         ('across_the_room',       'theatricality',            0.5),
         ('across_the_room',       'irreverence',              0.4),
         ('low_voices',            'volume',                  -0.9),
         ('low_voices',            'theatricality',           -0.5),
         ('low_voices',            'cadence_clipped',          0.3),
         ('laughs_first',          'warmth',                   0.7),
         ('laughs_first',          'humour_warm',              0.6),
         ('laughs_first',          'volume',                   0.5),
         -- How much ceremony they can take
         ('toasts',                'formality_formal',         0.7),
         ('toasts',                'theatricality',            0.6),
         ('toasts',                'earnestness',              0.5),
         ('rises_to_greet',        'formality_ceremonial',     0.7),
         ('rises_to_greet',        'address_third_person',     0.4),
         ('rises_to_greet',        'irreverence',             -0.5),
         ('seating_plan',          'formality_formal',         0.6),
         ('seating_plan',          'precision',                0.6),
         ('seating_plan',          'address_third_person',     0.3),
         ('no_speeches',           'formality_ceremonial',    -0.8),
         ('no_speeches',           'theatricality',           -0.6),
         ('no_speeches',           'formality_plain',          0.5),
         ('dressed_up',            'formality_ceremonial',     0.6),
         ('dressed_up',            'formality_formal',         0.5),
         ('dressed_up',            'theatricality',            0.3),
         ('first_names',           'formality_familiar',       0.8),
         ('first_names',           'address_second_person',    0.5),
         ('first_names',           'formality_ceremonial',    -0.5),
         -- How they say the kind thing
         ('says_it_out_loud',      'warmth',                   1.0),
         ('says_it_out_loud',      'earnestness',              0.8),
         ('says_it_out_loud',      'humour_warm',              0.4),
         ('nicknames',             'formality_familiar',       0.9),
         ('nicknames',             'warmth',                   0.7),
         ('nicknames',             'knowingness',              0.6),
         ('asks_properly',         'warmth',                   0.8),
         ('asks_properly',         'earnestness',              0.7),
         ('asks_properly',         'cadence_unhurried',        0.4),
         ('warm_not_loud',         'warmth',                   0.4),
         ('warm_not_loud',         'theatricality',           -0.7),
         ('warm_not_loud',         'formality_cordial',        0.6),
         ('compliments_plainly',   'earnestness',              0.9),
         ('compliments_plainly',   'warmth',                   0.6),
         ('compliments_plainly',   'humour_none',              0.3),
         ('sentimental',           'earnestness',              1.0),
         ('sentimental',           'warmth',                   0.8),
         ('sentimental',           'humour_none',              0.3),
         ('sentimental',           'theatricality',            0.4),
         -- How exact they are
         ('exact_word',            'precision',                1.0),
         ('exact_word',            'cadence_ornate',           0.4),
         ('exact_word',            'formality_formal',         0.3),
         ('will_look_it_up',       'precision',                0.8),
         ('will_look_it_up',       'humour_arch',              0.3),
         ('will_look_it_up',       'earnestness',              0.3),
         ('corrects_gently',       'precision',                0.7),
         ('corrects_gently',       'humour_dry',               0.4),
         ('corrects_gently',       'warmth',                   0.3),
         ('understated',           'theatricality',           -0.9),
         ('understated',           'cadence_clipped',          0.7),
         ('understated',           'humour_dry',               0.5),
         ('understated',           'knowingness',              0.5),
         ('understated',           'address_impersonal',       0.3),
         ('roughly_eight',         'precision',               -0.9),
         ('roughly_eight',         'cadence_unhurried',        0.4),
         ('roughly_eight',         'formality_familiar',       0.4),
         ('long_way_round',        'cadence_ornate',           0.8),
         ('long_way_round',        'cadence_unhurried',        0.6),
         ('long_way_round',        'theatricality',            0.4),
         -- How fast the evening moves
         ('unhurried',             'cadence_unhurried',        0.9),
         ('unhurried',             'formality_cordial',        0.3),
         ('unhurried',             'volume',                  -0.3),
         ('talks_fast',            'cadence_rapid',            0.9),
         ('talks_fast',            'precision',                0.4),
         ('talks_fast',            'volume',                   0.3),
         ('arrives_late',          'precision',               -0.7),
         ('arrives_late',          'formality_ceremonial',    -0.5),
         ('arrives_late',          'cadence_unhurried',        0.4),
         ('lingers',               'cadence_unhurried',        0.8),
         ('lingers',               'warmth',                   0.4),
         ('lingers',               'formality_cordial',        0.4),
         ('no_dead_air',           'cadence_rapid',            0.7),
         ('no_dead_air',           'volume',                   0.6),
         ('no_dead_air',           'theatricality',            0.3),
         ('comfortable_silence',   'cadence_unhurried',        0.7),
         ('comfortable_silence',   'volume',                  -0.6),
         ('comfortable_silence',   'theatricality',           -0.4),
         -- What they assume you already know
         ('leans_in',              'knowingness',              0.9),
         ('leans_in',              'volume',                  -0.5),
         ('leans_in',              'humour_arch',              0.4),
         ('explains_nothing',      'knowingness',              1.0),
         ('explains_nothing',      'cadence_clipped',          0.6),
         ('explains_nothing',      'humour_deadpan',           0.4),
         ('explains_nothing',      'address_impersonal',       0.4),
         ('straight_to_gossip',    'knowingness',              0.7),
         ('straight_to_gossip',    'cadence_rapid',            0.5),
         ('straight_to_gossip',    'irreverence',              0.5),
         ('means_the_other_thing', 'humour_arch',              0.9),
         ('means_the_other_thing', 'knowingness',              0.8),
         ('means_the_other_thing', 'earnestness',             -0.5),
         ('between_us',            'address_collective_first', 0.8),
         ('between_us',            'knowingness',              0.6),
         ('between_us',            'formality_familiar',       0.3),
         ('spells_it_out',         'knowingness',             -0.8),
         ('spells_it_out',         'precision',                0.5),
         ('spells_it_out',         'earnestness',              0.5),
         ('spells_it_out',         'address_second_person',    0.4),
         -- How much they perform
         ('makes_an_entrance',     'theatricality',            1.0),
         ('makes_an_entrance',     'volume',                   0.5),
         ('makes_an_entrance',     'formality_ceremonial',     0.3),
         ('does_the_voice',        'theatricality',            0.9),
         ('does_the_voice',        'humour_absurd',            0.6),
         ('does_the_voice',        'volume',                   0.4),
         ('one_tells_it',          'theatricality',            0.6),
         ('one_tells_it',          'cadence_ornate',           0.6),
         ('one_tells_it',          'volume',                  -0.3),
         ('nothing_by_halves',     'theatricality',            0.7),
         ('nothing_by_halves',     'irreverence',              0.4),
         ('nothing_by_halves',     'volume',                   0.4),
         ('never_performs',        'theatricality',           -1.0),
         ('never_performs',        'formality_plain',          0.5),
         ('never_performs',        'humour_deadpan',           0.3),
         ('swears_fondly',         'irreverence',              0.9),
         ('swears_fondly',         'formality_familiar',       0.7),
         ('swears_fondly',         'warmth',                   0.4),
         ('impeccably_polite',     'irreverence',             -0.9),
         ('impeccably_polite',     'formality_formal',         0.7),
         ('impeccably_polite',     'formality_ceremonial',     0.4),
         ('impeccably_polite',     'address_third_person',     0.3)
       ) as m(tone, facet, weight)
  join facet t on t.dimension_code = 'voice_tone' and t.code = m.tone
  join facet v on v.dimension_code = 'voice'      and v.code = m.facet;

-- ── voice_token_facet ────────────────────────────────────────────────
--
-- THE THREE FACETS A VOICE STATES OUTRIGHT.
--
-- `world_voice.voice` already carries a formality, an address mode and a humour
-- mode, and db/004 validates all three against exactly these value sets. They
-- are therefore FREE and EXACT, and asking a curator to re-tag them would be
-- one fact written twice — which is how two copies of it start to disagree.
--
-- This table is the database's half of FORMALITY_FACET, ADDRESS_FACET and
-- HUMOUR_FACET in src/lib/voice.ts, which are exhaustive Records over the
-- unions in src/lib/tokens.ts: adding a HumourMode there is a compile error
-- until it has a facet, and a missing row here is a destination that silently
-- claims nothing on that axis.
--
-- `token_path` is the jsonb path within a voice, written the way a person reads
-- it. Three paths today and no reason to expect a fourth soon — the other Voice
-- fields are prose, deliberately.

create table voice_token_facet (
  token_path  text not null check (token_path ~ '^[a-z][a-z0-9_.]*$'),
  token_value text not null,
  facet_id    uuid not null references facet(id) on delete restrict,

  voice_dimension text not null default 'voice'
    check (voice_dimension = 'voice'),

  created_at  timestamptz not null default now(),

  primary key (token_path, token_value),
  foreign key (facet_id, voice_dimension) references facet (id, dimension_code)
);

comment on table voice_token_facet is
  'The three voice tokens a destination states outright — formality, '
  'address.mode, humour.mode — mapped to the facets they mean. Mirrors the '
  'exhaustive Records in src/lib/voice.ts. Added by db/007.';

insert into voice_token_facet (token_path, token_value, facet_id)
select m.path, m.value, f.id
  from (values
         ('formality',    'ceremonial',       'formality_ceremonial'),
         ('formality',    'formal',           'formality_formal'),
         ('formality',    'cordial',          'formality_cordial'),
         ('formality',    'plain',            'formality_plain'),
         ('formality',    'familiar',         'formality_familiar'),
         ('address.mode', 'second_person',    'address_second_person'),
         ('address.mode', 'third_person',     'address_third_person'),
         ('address.mode', 'collective_first', 'address_collective_first'),
         ('address.mode', 'impersonal',       'address_impersonal'),
         ('humour.mode',  'none',             'humour_none'),
         ('humour.mode',  'dry',              'humour_dry'),
         ('humour.mode',  'deadpan',          'humour_deadpan'),
         ('humour.mode',  'arch',             'humour_arch'),
         ('humour.mode',  'warm',             'humour_warm'),
         ('humour.mode',  'absurd',           'humour_absurd')
       ) as m(path, value, facet)
  join facet f on f.dimension_code = 'voice' and f.code = m.facet;

-- ── quiz_response_facet, extended ────────────────────────────────────
--
-- One branch added. `create or replace` keeps the column list identical, which
-- it must — record_quiz_signals() and taste_profile_current both read this view.
--
-- This resolves her tones to the TONE facets, which is the evidentiary layer:
-- what she was shown and what she picked. Their MEANING is one join further on,
-- in quiz_response_voice below. Keeping them separate is what lets a weighting
-- be corrected later without any implication that she answered differently.

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
           -- Added by db/007. Empty on responses that predate the question, and
           -- an empty array unnests to nothing, so an old row contributes no
           -- rows here rather than wrong ones.
           ('voice_tones',      qr.voice_tones),
           ('occasion',         array[qr.occasion::text]),
           ('environment',      array[qr.environment::text]),
           ('budget',           array[qr.budget::text]),
           ('music_service',    array[qr.music_service::text]),
           ('guest_count_band', array[qr.guest_count_band::text]),
           ('spend_per_person', array[qr.spend_per_person::text])
  ) as src(quiz_field, option_codes)
  cross join lateral unnest(src.option_codes) as ans(option_code)
  join quiz_option_facet m
    on m.quiz_field = src.quiz_field and m.option_code = ans.option_code
  join facet f on f.id = m.facet_id;

-- ── quiz_response_voice ──────────────────────────────────────────────
--
-- HER VOICE PROFILE. One row per response per axis she said something about.
--
-- The arithmetic is a sum: every tone she tapped counts once, at the weight the
-- tone claims. Cosine normalisation is deliberately NOT done here — it is a
-- comparison-time concern, and doing it in the view would bake in the assumption
-- that the only reader is a similarity score. `weight` is the raw claim, the
-- same division of labour as customer_cohort_affinity in db/002.
--
-- NOTHING APPEARS FOR A TONE SHE DID NOT TAP. Not a zero row, not a soft
-- negative. This is the property the note at the top of this file is about, and
-- it is a property of the join: unnest over her array reaches only her tones.
-- Anyone tempted to left-join the vocabulary to "fill in the gaps" should read
-- that note first.

create view quiz_response_voice as
select qr.id             as quiz_response_id,
       qr.customer_id,
       qr.created_at     as observed_at,
       qr.quiz_version,
       v.id              as voice_facet_id,
       v.code            as voice_facet_code,
       v.label           as voice_facet_label,
       sum(r.weight)     as weight,
       -- Which of her taps produced this axis, for a curator who wants to know
       -- why the system thinks her friends are loud.
       array_agg(t.code::text order by r.weight desc) as from_tones
  from quiz_response qr
  cross join lateral unnest(qr.voice_tones) as ans(tone_code)
  join facet t
    on t.dimension_code = 'voice_tone' and t.code = ans.tone_code
  join voice_tone_facet r on r.tone_facet_id = t.id
  join facet v on v.id = r.voice_facet_id
 group by qr.id, qr.customer_id, qr.created_at, qr.quiz_version,
          v.id, v.code, v.label;

comment on view quiz_response_voice is
  'How her people talk, resolved onto the voice axes. Rows exist only for axes '
  'her chosen tones make a claim about — silence is not a zero. Added by '
  'db/007.';

-- ── world_voice_profile ──────────────────────────────────────────────
--
-- THE SAME SHAPE, FOR A DESTINATION. This is the other half of the join, and it
-- is deliberately built from the SAME tone vocabulary a host answers in.
--
-- Two sources, unioned:
--
--   the tags   world_facet rows in the voice_tone dimension, resolved through
--              voice_tone_facet. The curator's weight times the tone's weight:
--              a destination faintly tagged `nothing_sacred` (0.35) picks up
--              irreverence at 0.35, not at 1.
--   the tokens the three facets its published voice states outright, at 1.
--
-- The tokens WIN where both speak, by `distinct on` in the token's favour. They
-- are exact and the tags are an approximation of the same thing; a destination
-- tagged with three dry tones must not end up claiming dryness at 2.4 and
-- outscoring a destination that simply is dry.
--
-- Only the PUBLISHED voice is read. A draft is not in force and must not affect
-- what anything matches — see db/004.

create view world_voice_profile as
select distinct on (world_id, voice_facet_id)
       world_id, voice_facet_id, voice_facet_code, voice_facet_label,
       weight, source
  from (
    -- The tokens. Listed first so that `distinct on` prefers them.
    select w.id            as world_id,
           f.id            as voice_facet_id,
           f.code          as voice_facet_code,
           f.label         as voice_facet_label,
           1::numeric      as weight,
           'stated'::text  as source,
           0               as precedence
      from world w
      join world_voice wv on wv.world_id = w.id and wv.status = 'published'
      cross join lateral (
        values ('formality',    wv.voice ->> 'formality'),
               ('address.mode', wv.voice -> 'address' ->> 'mode'),
               ('humour.mode',  wv.voice -> 'humour'  ->> 'mode')
      ) as tok(token_path, token_value)
      join voice_token_facet m
        on m.token_path = tok.token_path and m.token_value = tok.token_value
      join facet f on f.id = m.facet_id

    union all

    -- The tags.
    select wf.world_id,
           v.id,
           v.code,
           v.label,
           sum(wf.weight * r.weight),
           'tones'::text,
           1
      from world_facet wf
      join facet t on t.id = wf.facet_id and t.dimension_code = 'voice_tone'
      join voice_tone_facet r on r.tone_facet_id = t.id
      join facet v on v.id = r.voice_facet_id
     group by wf.world_id, v.id, v.code, v.label
  ) as sources
 order by world_id, voice_facet_id, precedence;

comment on view world_voice_profile is
  'How a destination sounds, on the same axes a host''s answers resolve to. '
  'Built from the tones it is tagged with in world_facet, plus the three facets '
  'its published voice states outright, which win. Added by db/007.';

-- ── the count, asserted ──────────────────────────────────────────────
--
-- Every one of the joins above is by code, which is exactly right for
-- readability and exactly wrong for catching a code that does not exist: a
-- mistyped tone simply produces no row, silently. These assertions are the
-- cheapest possible fix and they run once, at migration time.
--
-- If one fires, the numbers are in src/lib/voice.ts: TONES.length,
-- VOICE_FACETS.length, and the total of every tone's `facets`.

do $$
declare
  v_tones integer;
  v_axes  integer;
  v_links integer;
begin
  select count(*) into v_tones from facet where dimension_code = 'voice_tone';
  select count(*) into v_axes  from facet where dimension_code = 'voice';
  select count(*) into v_links from voice_tone_facet;

  if v_tones <> 50 or v_axes <> 26 or v_links <> 158 then
    raise exception
      'db/007 seeded % tones, % axes and % resolutions; expected 50, 26 and 158. '
      'A code in one of the joins above does not match src/lib/voice.ts.',
      v_tones, v_axes, v_links;
  end if;

  -- The check scripts/check-facets.mjs would make, made here as well, because a
  -- tone that resolves to nothing is a tile she can tap that means nothing.
  if exists (
    select 1 from facet f
     where f.dimension_code = 'voice_tone'
       and not exists (
         select 1 from voice_tone_facet r where r.tone_facet_id = f.id)
  ) then
    raise exception 'db/007: a tone resolves to no voice facet.';
  end if;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- WHAT THIS DELIBERATELY DOES NOT DO
--
--   · No zero-weight rows, anywhere, for either side. See the note at the top;
--     it is the single most important thing in this file.
--   · No negative polarity on any quiz_option_facet row for `voice_tones`. A
--     tap is a positive statement. Vetoes remain the job of anti_preferences.
--   · No RANK on her tones. A tiered answer — these two most of all — would be
--     better signal, and the interactions that gather it (a second tap that
--     promotes, a "choose your strongest" screen) are all either undiscoverable
--     or a form, and docs/copy-brief.md rules out the form. If a tier is ever
--     gathered it arrives as a new column beside this array, never as a
--     reinterpretation of its ORDER: the order in the array is the order she
--     happened to scroll past them, which is a fact about the layout and not
--     about her friends.
--   · No backfill. A response submitted before this question existed has an
--     empty array and no voice profile, and that is the honest record.
--   · No matching. This file states both sides in one vocabulary; which
--     destination wins, and how heavily voice counts against look, is
--     docs/selection-spec.md's problem and is still open there.
