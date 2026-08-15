-- ─────────────────────────────────────────────────────────────────────
-- SLOTS SHE DOES NOT HAVE
--
-- "Maybe someone won't even be serving food, in that case no menu."
--
-- THE THIRD GATE, and the narrowest. db/009 gave the occasion gate — which
-- slots exist for a birthday — and the destination decides their register.
-- This is the gate that is hers: a fact about her evening that removes a slot
-- from her plan altogether.
--
-- ── WHY THIS IS NOT A DEALBREAKER ────────────────────────────────────
--
-- A dealbreaker is a DISLIKE. db/002 carries it as a negative facet, the
-- engine eliminates ingredients that carry it, and the whole mechanism is
-- about taste. "I am not serving food" is not a dislike. She has nothing
-- against menus. There is simply no dinner, and asking her to phrase a fact as
-- a veto to get the right answer is asking her to speak the engine's language.
--
-- ── WHY THIS IS NOT A CATALOGUE GAP ──────────────────────────────────
--
-- A gap is a WORK ORDER: her occasion has a slot, the pool could not fill it,
-- and the house must author something. Nobody can act on "she is not serving
-- food" — there is nothing to write. If the two shared a list, the curator's
-- gap list would fill with rows nobody can act on and would stop being read,
-- and the gap list is the only thing telling the house what to write next.
--
-- So an excluded slot is removed BEFORE the fill runs. It is not filled and
-- discarded; it was never in the plan. No gap, no drop, no sentence for her.
--
-- ── AND WHY THE MEMBER CANNOT TELL THE DIFFERENCE ────────────────────
--
-- To her the two are identical, and deliberately: the deliverable is absent.
-- No heading, no empty state, no "no menu selected". See
-- src/lib/selection/member.ts — an unfillable slot and a slot she does not
-- have both come out the same way, which is silence.
--
-- ── WHAT THIS FILE ADDS ─────────────────────────────────────────────
--
--   slot_exclusion          the vocabulary: which facts remove slots
--   slot_kind.excluded_by   which fact removes THIS slot
--
-- What it deliberately does NOT add is anywhere to record her answer, because
-- the question does not exist yet. See the seam at the bottom.
-- ─────────────────────────────────────────────────────────────────────

-- ── slot_exclusion ───────────────────────────────────────────────────
--
-- A TABLE, not an enum, by db/001's own rule: this set is open. The next one
-- is "no alcohol", and it is a product decision somebody will want to make
-- with an INSERT rather than a migration and a deploy. Same argument
-- slot_shape made in db/010 for which shapes a slot accepts.
--
-- `question` is the part that keeps this honest. An exclusion nobody can state
-- is an exclusion that never fires, and writing the question down beside the
-- code is what stops a curator inventing a derivation from an answer that
-- means something else. It is prose for a human, not a key.

create table slot_exclusion (
  code        text primary key check (code ~ '^[a-z][a-z0-9_]*$'),
  label       text not null,
  description text not null default '',
  -- The question a member must be able to answer for this to ever be true.
  question    text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger slot_exclusion_touch before update on slot_exclusion
  for each row execute function set_updated_at();

insert into slot_exclusion (code, label, description, question) values
  ('no_food', 'No food',
   'She is not serving food. Not a preference about menus — there is no meal '
   'for a menu to describe. The slot is removed; nothing is authored.',
   'Are you serving food?'),
  ('no_games', 'No games',
   'She does not want games. A FACT about the evening, and distinct from the '
   'anti-preference "forced participation", which is a dislike and is already '
   'carried as a dealbreaker. A woman can dislike forced fun and still want a '
   'game; a woman who says no games is not expressing a taste at all.',
   'Do you want games?');

comment on table slot_exclusion is
  'Facts about her evening that remove a slot from her plan entirely. NOT '
  'dealbreakers (those are dislikes, and they are scored) and NOT catalogue '
  'gaps (those are work orders for the house). See db/014.';

-- ── slot_kind.excluded_by ────────────────────────────────────────────
--
-- WHICH FACT REMOVES WHICH SLOT — on the slot table, so that making a new slot
-- excludable is an UPDATE rather than a list somewhere in the engine that has
-- to be kept in step with this one by hand. src/lib/selection/occasion.ts
-- reads the column and removes the rule; it knows no slot codes.
--
-- Null on every slot no answer can remove, which is most of them. The arrival
-- drink is not optional in this sense: an evening with people in it has a
-- first drink, even if it is water.

alter table slot_kind
  add column excluded_by text references slot_exclusion(code) on delete restrict;

comment on column slot_kind.excluded_by is
  'The slot_exclusion code that removes this slot from a member''s plan. Read '
  'by planSlots before anything is scoped or filled, so an excluded slot never '
  'becomes a gap. Null when no answer can remove it. See db/014.';

create index slot_kind_excluded_by_idx on slot_kind (excluded_by)
  where excluded_by is not null;

update slot_kind set excluded_by = 'no_food' where code = 'the_menu';

-- THE GAMES, AND THE THREE SLOTS THAT ARE NOT GAMES.
--
-- `game`, `ambient_game` and `finale` are games by name and by nature: a block
-- of the evening given to one, a deck that runs underneath it, and the thing
-- that closes the night. A woman who says no games means these.
--
-- `honouring`, `the_moment` and `day_material` draw from the same pool and are
-- NOT removed, and the distinction is worth the paragraph. They are the
-- occasion's ritual beats — how the person is marked, the thing they retell,
-- material for one day of something longer. A woman who does not want games
-- still wants her sister toasted. Removing the honouring beat because she
-- declined charades would delete the most personal part of a birthday over an
-- answer about party games, and she would never learn why.
--
-- If a beat can only be filled by something that is unmistakably a game, that
-- is a fact about the pool and it is fixed by authoring a ritual, not by
-- widening this list.
update slot_kind set excluded_by = 'no_games'
 where code in ('game', 'ambient_game', 'finale');

-- ── the seam ─────────────────────────────────────────────────────────
--
-- NOTHING IN THE APPLICATION CAN STATE EITHER FACT TODAY. src/lib/quiz.ts was
-- read for this: occasion, environment, taste directions, how her people have
-- fun, their voice, anti-preferences, affinities, the secret, guest band,
-- spend band, music service, email. None of them asks whether there is food or
-- whether she wants games.
--
-- The near misses are refused on purpose, and each refusal is a decision:
--
--   environment = 'restaurant_or_venue'  says WHERE, not WHETHER. The back
--     room of a restaurant is still a dinner she may be choosing food for.
--     Inferring 'no_food' from a room would silently delete a deliverable she
--     wanted, and she would never learn a menu had been planned and dropped.
--   anti_preferences = 'forced_fun'      a dislike, already carried as a
--     dealbreaker where it belongs. It weights the game pool down. Treating it
--     as 'no_games' would make her dislikes structural.
--
-- So this migration ships the vocabulary and the wiring, and every member's
-- exclusion set is empty until the question exists. That is the correct state,
-- not an unfinished one: the engine already takes the set as an input and
-- already handles it being empty, so adding the question later touches the
-- application and the loader and nothing else.
--
-- WHOEVER ADDS THE QUESTION adds three things:
--
--   1. the question itself, in QUIZ_STEPS (src/lib/quiz.ts);
--   2. somewhere to record the answer against the response — the shape
--      quiz_response_facet uses, keyed on slot_exclusion.code. Deliberately
--      not created here: a table with no writer and no reader is a guess about
--      a question nobody has written yet;
--   3. one line in hostExclusions() (src/lib/selection/exclusions.ts) to read
--      it. Nothing else in the engine changes.
