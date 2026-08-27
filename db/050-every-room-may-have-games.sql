-- ── 050 · EVERY ROOM MAY HAVE GAMES ─────────────────────────────────
--
-- Applied by scripts/migrate.mjs in filename order, inside one transaction
-- together with its schema_migrations ledger row. Nothing here may be a
-- statement that refuses to run in a transaction.
--
-- New file, never applied anywhere, so no SENTINELS entry in
-- scripts/migrate.mjs.
--
-- THIS MIGRATION CREATES NO TABLE AND CHANGES NO TYPE. It adds two rows to
-- `game_requirement_kind` and writes one ruling into a table comment, and that
-- is deliberately the whole of it: the twenty games this file exists alongside
-- are CONTENT, and content in a migration is content that can only be
-- corrected by another migration. They live in src/lib/games.ts, where a rule
-- the founder wants reworded is a diff a human can read, and
-- scripts/seed-games.mjs moves them into the tables. db/010 makes that
-- argument at length and nothing has changed about it.
--
-- ═════════════════════════════════════════════════════════════════════
-- THE RULING, AND WHY IT NEEDS A COLUMN COMMENT RATHER THAN A COMMIT
-- ═════════════════════════════════════════════════════════════════════
--
-- CLAUDE.md rule 29, founder, twice: "lets not make a blanket rule that a room
-- is gameless", then "i told you that they can have games."
--
-- db/048 already wrote the bank half of this onto `bank_kind`: "nothing
-- anywhere records that a room HAS no game: 'GAMES: none' writes no row and no
-- negative claim, so a room that says none can receive one the day somebody
-- names one." That sentence was correct and it was written on the WRONG TABLE
-- for the question that kept being asked. The question is about the `game`
-- table — whether a room may have a game row — and the answer lived on the
-- comment of the bank's kind enum, where nobody looking at `game` would find
-- it.
--
-- That is CLAUDE.md rule 20's second half, arriving inside this repo's own
-- discipline rather than from outside it: A FINDING THAT LIVES ONLY IN THE
-- FILE WHERE IT WAS FOUND WILL BE REDISCOVERED AT FULL PRICE. It was
-- rediscovered twice in one week — once as a parser routing by heading, and
-- once as two rooms filed as CONTRADICTING THEMSELVES because a stale document
-- line said none and the room's own voice carried a game. Both cost a founder
-- turn. The comment below is where the next reader of this table stands.
--
-- ═════════════════════════════════════════════════════════════════════
-- WHAT WAS ACTUALLY WRONG, COUNTED
-- ═════════════════════════════════════════════════════════════════════
--
-- `game` held SEVEN rows. Every `game_world` row on them named
-- westhampton-1976 — six affinities and one veto, no native claim anywhere —
-- so seventeen rooms had no game written for them.
--
-- Meanwhile src/lib/destinations.ts carried TWENTY `piece: "game_rule"`
-- entries across the eighteen authored rooms, two each at Amalfi and Aspen,
-- each a game in that room's own voice. Not one was a row in `bank_item` or
-- in `game`.
--
-- That is an AUTHORING ABSENCE and never a property of a room, which is rule
-- 29's general form and the third time this week the same shape has appeared:
-- Palm Springs "having no gesture" (it had a weak one), six rooms being
-- "gameless" (a parser routing by heading), and rooms reading as
-- deliverables-disjoint when neither had any dishes. The twenty are now
-- authored in src/lib/games.ts with bounds, host roles, supplies, printed
-- matter, contingencies and runbooks, and they claim `native` on their own
-- room.
--
-- ═════════════════════════════════════════════════════════════════════
-- ZERO IS THE CORRECT ANSWER ON A FRESH DATABASE, AGAIN
-- ═════════════════════════════════════════════════════════════════════
--
-- CLAUDE.md rule 22: `preDeployCommand` runs `migrate` before every seeder, so
-- `game` is EMPTY when this file runs on a database built from the committed
-- chain. Nothing here counts games, asserts a per-room minimum, or derives a
-- row from authored text — every one of those would be the db/020 failure,
-- which ran clean and did nothing on every build for weeks.
--
-- The two requirement kinds below are VOCABULARY and are therefore a
-- migration's business: `game_requirement.requirement` is a foreign key onto
-- this table, and scripts/seed-games.mjs raises by name on a code that is not
-- there. Adding them here is the only order in which the seeder can succeed.
--
-- ═════════════════════════════════════════════════════════════════════
-- THE TWO NEW REQUIREMENT KINDS, AND WHY ONLY TWO
-- ═════════════════════════════════════════════════════════════════════
--
-- db/010 seeded ten kinds and said the list is not finished — "this one needs
-- a projector should be an insert". Four of the twenty new games named a
-- condition of the room that the ten could not say, and they fall into exactly
-- two:
--
--   music              Havana's song game and Acapulco's last song are both
--                      built on music playing and on being able to change it.
--                      `phones` and `signal` are about a network, and a room
--                      with a speaker and no signal runs both of these fine.
--   something_playing  Aspen's two games are played against an episode the
--                      room has been half-watching. It is the condition, not
--                      the equipment: a house with a television nobody has put
--                      anything on is the wrong room for them.
--
-- NEITHER IS `fragile`. db/010's fragile flag means CAN FAIL ON THE NIGHT
-- THROUGH NOBODY'S FAULT — signal drops, an app is pulled, a phone is at four
-- percent. A room with no speaker was always a room with no speaker, and a
-- room where nothing is playing was never going to have anything playing.
-- That is a FILTER and not a RISK, which is the distinction db/010 draws in
-- the column's own comment and the reason The Prep does not warn about these.
--
-- THREE MORE WERE CONSIDERED AND REFUSED, written down so the next author does
-- not re-propose them:
--
--   · `a_second_day`, for the games written at supper and settled at
--     breakfast. Refused because that is a property of the OCCASION and not of
--     the room, and `game_occasion` already says it — both of those games
--     forbid `dinner_party` with the reason in the row. A second vocabulary
--     for a fact one vocabulary already carries is CLAUDE.md rule 21's
--     duplication of authority.
--   · `water`, for Acapulco's swim. Refused because a requirement is a filter
--     that silently removes a game, and the founder's sentence is the room's
--     own material naming the room's own furniture. It is a `caveat` on the
--     row instead — a sentence a host reads and acts on — which is what db/010
--     built `caveat` for.
--   · `a_view_worth_counting`, for Portofino's boats. Same answer, same
--     column, and one instance is not a vocabulary.

insert into game_requirement_kind (code, label, description, fragile, position) values
  ('music', 'Music, and a way to change it',
   'Something playing and something to play it on, within reach of whoever is '
   'sitting down. Distinct from ''signal'': a house with a speaker and no '
   'network satisfies this completely. Not fragile — a room with nothing to '
   'play music on was always the wrong room, which is a filter and not a risk.',
   false, 110),
  ('something_playing', 'Something already on that everybody half-knows',
   'An episode, a match, a film the room has seen enough times to call a line '
   'from. It is a condition of the evening and not a piece of equipment: a '
   'television with nothing on it does not satisfy this. Not fragile, for the '
   'same reason as ''music''.',
   false, 120);

-- ── the ruling, where the next reader of this table stands ───────────
--
-- REPLACES db/009's comment and keeps its two sentences whole, because they
-- are still the load-bearing fact about min_guests and max_guests and a
-- `comment on table` overwrites rather than appends. CLAUDE.md rule 14:
-- superseded text is preserved, and this is the narrower case of text that was
-- never superseded at all and would have been lost to the mechanism.

comment on table game is
  'Games and rituals — the third ingredient pool. min_guests/max_guests are '
  'constraints, not preferences: a game outside her group size is filtered, '
  'never merely scored down. Added by db/009. '
  'EVERY ROOM MAY HAVE GAMES, and no room anywhere is recorded as having none '
  '(db/050, CLAUDE.md rule 29). A room with no game row has an AUTHORING '
  'ABSENCE and never a property: "GAMES: none" in the bank document writes no '
  'row, no column and no negative claim, and no mechanism here may be '
  '"completed" by writing gamelessness down. Where that document and a room''s '
  'own piece: "game_rule" in src/lib/destinations.ts disagree, the voice wins '
  'and the room has the game. The canonical text of every game is '
  'src/lib/games.ts; scripts/seed-games.mjs moves it here.';

comment on table game_requirement_kind is
  'What a game needs OF THE ROOM, as opposed to what a host acquires — that is '
  'game_supply. `fragile` means it can fail on the night through nobody''s '
  'fault (signal, an app, a battery); a condition the room either has or has '
  'never had is a FILTER and is not fragile. Rows and not an enum because the '
  'list is not finished: db/010 seeded ten, db/050 added two. See db/010.';

-- ── what happened ────────────────────────────────────────────────────
--
-- A NOTICE AND NOT AN ASSERTION. There is nothing here that can be true or
-- false on a fresh build: `game` is empty when this runs and the two kinds
-- were just inserted. A guard over the games themselves would be a guard over
-- content that does not exist yet, which is the failure rule 22 names, and it
-- lives instead in src/lib/games.test.ts — where it runs on a laptop with no
-- Postgres and fails the build rather than the deploy.

do $$
declare
  v_kinds     bigint;
  v_games     bigint;
  v_scoped    bigint;
  v_native    bigint;
begin
  select count(*) into v_kinds from game_requirement_kind;
  select count(*) into v_games from game;
  select count(distinct world_id) into v_scoped from game_world;
  select count(*) into v_native from game_world where native;

  raise notice
    '[050] game_requirement_kind now holds % kinds. EVERY ROOM MAY HAVE '
    'GAMES is on the game table comment, where the next reader of this table '
    'stands rather than on the bank''s kind enum.', v_kinds;

  raise notice
    '[050] % game rows here, scoped across % destinations, % of those claims '
    'native. ZERO ACROSS THE BOARD IS THE CORRECT ANSWER ON A DATABASE BUILT '
    'FROM THE COMMITTED CHAIN: migrate runs before every seeder (CLAUDE.md '
    'rule 22), so seed-games writes all of it afterwards. A number here means '
    'this database already had a catalogue when the file ran.',
    v_games, v_scoped, v_native;
end;
$$;
