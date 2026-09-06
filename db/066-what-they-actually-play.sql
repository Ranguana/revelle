-- Revelle Société — WHAT THEY ACTUALLY PLAY
--
-- Applied by scripts/migrate.mjs after 065, inside one transaction together
-- with its schema_migrations ledger row.
--
-- ─────────────────────────────────────────────────────────────────────
-- THE RULING
--
-- Founder, 2026-09-06, on a question of fourteen options that was doing at
-- least three different jobs:
--
--   "keep appetite for play questions and add my questions (or similar)
--    regarding games, karaoke, etc. forget the people traits for this. if
--    hates games, get rid of game option - very simple."
--
-- and, on what she wants to learn from it:
--
--   "we want to know if they like games, like karaoke, impromptu
--    theater/gorilla theater, group games, board games... hate games"
--
-- So `group_fun` becomes ONE question about APPETITE FOR PLAY. Five of the
-- fourteen already were that and are kept; four were matrix facets in disguise
-- and three were properties of her people (CLAUDE.md rule 1); nine are retired
-- from the OFFER. This file adds what the new offer needs and removes nothing.
--
-- ─────────────────────────────────────────────────────────────────────
-- WHAT THIS FILE DOES, AND WHAT IT DELIBERATELY DOES NOT
--
--   1. three new facets in `group_fun` — theatre, board_games, group_games
--   2. four new `quiz_option` rows, including `hates_games`
--   3. the bridges: three onto their own facets, `hates_games` onto
--      play/organised_play at -1 exactly as `play_appetite = 'none'` is
--   4. `hates_games` -> `no_games` in quiz_option_exclusion
--   5. quiz_response_exclusion learns to read `group_fun`
--   6. every `forbidden` row in game_occasion and game_world, deleted
--
-- IT RETIRES NOTHING FROM THE VOCABULARY. `long_dinner`, `dance`, `toast`,
-- `dress_up`, `talk_deep`, `wander`, `swim_late`, `cook_together` and
-- `work_the_room` keep their `facet` rows and their `quiz_option_facet`
-- bridges, because A CODE IS PERMANENT (the contract at the top of
-- src/lib/quiz.ts, and the whole reason db/037 built the `quiz_option`
-- registry). A stored `group_fun` array written under 2026-08-h still resolves
-- every code in it, still projects into taste_signal, and still reads on the
-- desk. Retirement here means one thing only: src/lib/quiz.ts stops OFFERING
-- them, and scripts/check-facets.mjs reports them as retired rather than
-- missing. Same mechanism db/016 used for `mostly_made`, argued there.
--
-- WHAT RETIRING THEM COSTS, COUNTED RATHER THAN ASSUMED (rule 24). Thirty of
-- the seventy-five `game_facet` rows written from src/lib/games.ts carry one
-- of the nine, so thirty authored tags become unreachable: no host can state
-- the term any more, and a term nobody can state scores zero for everybody
-- (rule 15's DEFAULT-ONLY). They are NOT deleted — they are the authored
-- judgement about what each game is, they cost nothing while nothing asks for
-- them, and a later question about the table or the dancing re-feeds them
-- without re-authoring a line. What WAS checked before proceeding is the one
-- thing that would have been a real loss: whether any game is left with no
-- reachable `group_fun` tag at all. Two were — `palm-springs-the-best-line`
-- and `st-moritz-before-the-light-goes`, whose only tags were `talk_deep` and
-- `toast` — and both are tagged `group_games` in the same pass, so every game
-- in the catalogue still answers this question.
--
-- ─────────────────────────────────────────────────────────────────────
-- 1 · THE THREE NEW TERMS
--
-- Each was admitted on the same test, and it is rule 15's: WHAT READS IT. A
-- tile that grades nothing is worse than no tile, because she spends attention
-- on it and the vector carries it into the denominator of every score
-- (src/lib/selection/score.ts normalises by total mass, which is why an
-- unmatched term makes her result worse rather than merely not better).
--
--   theatre      impromptu / guerrilla theatre, named by the founder. Reaches
--                the games that are somebody inventing a thing and playing it
--                straight — Somebody's Voice, One Of Them Is Lying, Nobody
--                Finishes Their Own, and Art Battle's minute of invented art
--                criticism.
--   board_games  a table, rules and pieces. Reaches Imposter, The Numbers
--                After Dark, Fishbowl, The Late Supper.
--   group_games  the whole room up at once. Reaches the Reverse Scavenger
--                Hunt, Art Battle, Let's Make a Deal and both finales.
--
-- THE LAST TWO ARE HER OWN SPLIT — "group games, board games" — and it is a
-- real axis in this pool rather than a second spelling of `game.shape`. Shape
-- says whether a game takes a block of the evening; these say whether her
-- people would rather sit round a table with it or be on their feet.
--
-- KARAOKE IS NOT HERE, AND THAT IS THE ANSWER RATHER THAN AN OMISSION. She
-- named it; `perform` — "Sing badly, on purpose" — is what the house has
-- always called it and twelve games carry the tag. A `karaoke` facet would be
-- a second owner of one fact (rule 21) and the new one would reach nothing.
-- The tile names karaoke in its hint and resolves to `perform`. What the
-- catalogue genuinely lacks is a karaoke game as such; that is an authoring
-- absence (rule 29), filed in docs/games-need-a-human.md, not papered over
-- with a term.

insert into facet (dimension_code, code, label, description, provenance, notes) values
  ('group_fun', 'theatre', 'Put on something they made up',
   'Invented on the spot and played straight',
   'quiz',
   'Impromptu / guerrilla theatre, named by the founder 2026-09-06. Tagged in '
   'src/lib/games.ts on the games that are somebody inventing a thing and '
   'playing it straight-faced. Distinct from `perform`, which is singing: a '
   'room can do voices without anybody singing and the reverse.'),
  ('group_fun', 'board_games', 'Sit round a table and play',
   'Rules, pieces, somebody keeping score',
   'quiz',
   'Half of the founder''s "group games, board games" split. NOT a second '
   'spelling of game.shape: shape says whether a game takes a block of the '
   'evening, this says whether her people want to be sitting down with it.'),
  ('group_fun', 'group_games', 'Get the whole room playing',
   'Nobody sits this one out',
   'quiz',
   'The other half of the same split. Reaches the games that need the room on '
   'its feet. Also what keeps palm-springs-the-best-line and '
   'st-moritz-before-the-light-goes reachable after the nine retirements — '
   'both had only `talk_deep` and `toast` before this.')
on conflict (dimension_code, code) do nothing;


-- ── 2 · THE ANSWERS, AS IDENTITIES ───────────────────────────────────
--
-- db/037's registry, and its rule: REGISTER THE OPTION FIRST, THEN BRIDGE IT.
-- `hates_games` is registered here like any other answer even though it
-- carries no taste of its own — the registry "carries no meaning of its own"
-- by its own comment, and an answer outside it is an answer the drift audit
-- cannot see.

insert into quiz_option (quiz_field, option_code) values
  ('group_fun', 'theatre'),
  ('group_fun', 'board_games'),
  ('group_fun', 'group_games'),
  ('group_fun', 'hates_games')
on conflict (quiz_field, option_code) do nothing;


-- ── 3 · THE BRIDGES ──────────────────────────────────────────────────
--
-- The three new terms bridge onto themselves, which is the arrangement db/002
-- chose for the whole `group_fun` dimension: the option code IS the facet
-- code, so there is no translation to get wrong.

insert into quiz_option_facet (quiz_field, option_code, facet_id, answer_polarity)
select 'group_fun', f.code, f.id, 'positive'::signal_polarity
  from facet f
 where f.dimension_code = 'group_fun'
   and f.code in ('theatre', 'board_games', 'group_games')
on conflict do nothing;

-- `hates_games` bridges onto the SAME facet `play_appetite = 'none'` does, at
-- the same weight, because it is the same claim about the same axis. Three
-- things make that correct rather than a duplication (rule 21):
--
--   · the fact has one owner and it is this bridge. An answer is EVIDENCE for
--     the fact, and `no_food` has been carried by two answers since db/016.
--   · `play` is in NON_TASTE_DIMENSIONS in src/lib/selection/vector.ts, so
--     organised_play never enters the preference vector from either answer.
--     There is no double-counting to worry about because there is no counting.
--   · check-facets.mjs treats an option with no facet mapping as MISSING and
--     exits non-zero. An answer she can tap must resolve to vocabulary, and
--     this is the vocabulary it resolves to.

insert into quiz_option_facet
  (quiz_field, option_code, facet_id, answer_polarity, answer_weight)
select 'group_fun', 'hates_games', f.id, 'positive'::signal_polarity, -1.000
  from facet f
 where f.dimension_code = 'play' and f.code = 'organised_play'
on conflict do nothing;


-- ── 4 · AND IT REMOVES THE GAME ──────────────────────────────────────
--
-- "if hates games, get rid of game option - very simple."
--
-- THE CONSTRAINT DOOR, NOT THE TASTE DOOR. This does not rank games down; it
-- removes the beat from her plan before anything is chosen, so she is not
-- dealt three cards she does not want and there is no gap, no drop and no
-- sentence for her (db/014, and src/lib/selection/exclusions.ts). The slot
-- kind already carries `excluded_by = 'no_games'` — db/014 set it on `game`,
-- `ambient_game` and `finale`, and db/061 collapsed the last two into the
-- first — so nothing about the gate changes. What changes is that a second
-- answer can now state the fact.

insert into quiz_option_exclusion (quiz_field, option_code, exclusion_code, note) values
  ('group_fun', 'hates_games', 'no_games',
   'Her people hate games. The founder''s own option, 2026-09-06: "if hates '
   'games, get rid of game option - very simple." The second answer to carry '
   'no_games, alongside play_appetite = ''none'' — which is the shape '
   'exclusions.ts describes, not a duplicate authority: many options may '
   'carry one exclusion and this table''s primary key says so. Still NOT the '
   'anti-preference ''forced participation'', which is a dislike and is '
   'scored; a woman can veto forced fun and still want a game.')
on conflict do nothing;


-- ── 5 · quiz_response_exclusion READS group_fun ──────────────────────
--
-- One more line in the `values` list, which is exactly what db/016 said the
-- next exclusion-carrying field would cost. Restated whole because a view
-- cannot be amended in place; everything else is db/016's, unchanged.
--
-- `group_fun` is a text[] and the other two are single-select enums cast into
-- one-element arrays, so the branch is SIMPLER here than the ones it joins:
-- the column is already the shape the unnest wants. A null or empty array
-- contributes no rows, which is the same behaviour an unanswered question has
-- had since db/016.

create or replace view quiz_response_exclusion as
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
           ('play_appetite', array[qr.play_appetite::text]),
           -- Added by db/066.
           ('group_fun',     qr.group_fun)
  ) as src(quiz_field, option_codes)
  cross join lateral unnest(src.option_codes) as ans(option_code)
  join quiz_option_exclusion x
    on x.quiz_field = src.quiz_field and x.option_code = ans.option_code
  join slot_exclusion e on e.code = x.exclusion_code;

comment on view quiz_response_exclusion is
  'One row per slot_exclusion a response states. Read by '
  'src/lib/selection/catalogue.ts and passed verbatim into hostExclusions() as '
  '`recorded`, which is the one line db/014 said would be needed. Three '
  'fields can carry one today: food_plan, play_appetite and group_fun.';


-- ─────────────────────────────────────────────────────────────────────
-- 6 · EVERY FORBID LIFTED
--
-- Founder, 2026-09-06, in the same session:
--
--   "regarding your game questions, lets clear something up - there is no way
--    a game shouldnt be offered bc somewhere the revelle is nobody leaves the
--    table - that shouldnt be a rule in the first place"
--
-- and, on the anniversary rows the previous pass had kept:
--
--   "a twenty-five-person anniversary is just a party and entitled to a game
--    show. it is not a two person event unless the host says it is and then
--    obviously it is not the right game"
--
-- and, on the one row that was not a room-character argument at all:
--
--   "also forget this limiting rule that we have to be era specific and cannot
--    have later tech"
--
-- THE PRINCIPLE, AND IT IS THE VENUE RULE'S (CLAUDE.md rule 2) READ ONTO
-- GAMES: a room's CHARACTER may not veto a game. "Nobody leaves the table" is
-- a lovely sentence about a dinner party and it is not a fact that makes a
-- game impossible. What may still prune is what is physically or factually
-- impossible — and after this file, that is `minGuests`/`maxGuests`, the
-- venue affordances, and nothing else. The constraint door stays open; the
-- taste door is shut.
--
-- AN OCCASION IS NOT A HEADCOUNT, which is the second clause and the sharper
-- one. db/009 defines the anniversary as "One evening, honoured" and says
-- nothing about two people. `guest_count_band` (db/006) is a separate answer
-- with eight values, and `minGuests` in src/lib/selection/fill.ts already
-- refuses a game show at a table of two, at every occasion, without any help
-- from a forbid. Her own proof that the mechanism was already right: "unless
-- the host says it is and then obviously it is not the right game." So the
-- forbid was a SECOND AUTHORITY over a fact the guest band already owns
-- (rule 21) — and the one of the two that could be wrong, because it fires on
-- the name of the occasion regardless of who is actually coming.
--
-- AND AFTER THIS, THE ONLY THING THAT REMOVES A GAME IS HER SAYING SO. That is
-- the interaction with section 4 above and it is the point: a host's stated
-- refusal prunes, a room's temperament does not.
--
-- ── WHY A MIGRATION AND NOT ONLY THE FILE ───────────────────────────
--
-- Rule 33's two-sided repair, the same one db/061 wrote. The claims are
-- authored in src/lib/games.ts for every future build, and scripts/seed-games.
-- mjs writes them with `on conflict do nothing` — so REMOVING A CLAIM FROM THE
-- FILE REMOVES NOTHING FROM A DATABASE THAT ALREADY HOLDS IT. A production row
-- forbidding Art Battle at a dinner party would survive every deploy, silently,
-- and the file would say otherwise. Neither half covers both cases.
--
-- ── THE SEVENTEEN OCCASION FORBIDS, WITH THEIR ARGUMENTS (rule 14) ──
--
-- Kept here because a deleted argument gets re-made. Each is TRUE as a
-- sentence about a room and none of them is a reason a game cannot happen:
--
--   art-battle / dinner_party
--     "Twenty minutes of painting is twenty minutes nobody is at the table."
--   reverse-scavenger-hunt / dinner_party
--     "Nobody leaves the table, and everyone at it already has each other's
--      business cards."  ← the sentence she quoted back at us
--   lets-make-a-deal / anniversary
--     a compere, a running order and a ticket market between the room and the
--     two people the evening is for
--   lets-make-a-deal / getaway
--     "A getaway is three unscheduled days. A game show is the most scheduled
--      thing in this pool."
--   secret-game-cards / dinner_party
--     "There is no underneath at one table. Everyone is already in the only
--      conversation."
--   the-secret-auction / dinner_party
--     "A long dinner ends with dessert at midnight, which is the opposite of
--      an auction."
--   the-secret-auction / anniversary
--     the pool's loudest ending, ending a night on a bidding war where the
--     honouring belongs
--   the-secret-auction / getaway
--     "The occasion that most resists being decorated."
--   westhampton-the-houseguest-list / dinner_party
--     "It runs for three days. One evening cannot hold a secret long enough
--      for it to be one."
--   new-york-the-list / bridal
--     "A list of things that will not be repeated, at a shower, reads as a
--      warning."
--   nantucket-what-the-weather-will-do / dinner_party
--     "It settles tomorrow morning, and a dinner party does not have one."
--   portofino-the-boat-count / dinner_party
--     "It is written before leaving and settled on the way back, and a dinner
--      party does neither."
--   dolomites-the-temperature-at-the-top / dinner_party
--     "It is written at breakfast and settled at the top of a mountain."
--   big-sur-the-long-way / birthday
--     "An hour of long stories in a circle is the opposite of what a birthday
--      room is doing."
--   tahiti-the-last-night / dinner_party
--     "The forfeit is cooking tomorrow, and a dinner party has no tomorrow to
--      cook for."
--   aspen-somebodys-voice / dinner_party
--     "It needs a screen everybody has been half-watching, which a dinner
--      party does not have."
--   aspen-the-next-line / dinner_party
--     "It needs something playing that everybody is half-watching, which is
--      not a dinner party."
--
-- THE FOUR THAT ARE ABOUT A CLOCK RATHER THAN A CHARACTER — the weather, the
-- boat count, the temperature, the last night — read as the sharpest of the
-- seventeen, because "it settles tomorrow morning" sounds like a fact. It is
-- not one. A dinner party can perfectly well have a slip that settles in the
-- morning; what those notes describe is a game whose payoff lands after the
-- guests have gone, which is a thing a host may want and not a thing the
-- house may decide for her. If any of them turns out to be genuinely
-- unrunnable it comes back as a REQUIREMENT — game_requirement_kind is where
-- "this needs a next morning" would live, as a fact about the room, and it
-- would prune through the same door venue does. It does not come back as a
-- forbid.
--
-- ── AND THE ONE WORLD FORBID ────────────────────────────────────────
--
--   imposter @ westhampton-1976
--     "The house never mentions anything that did not exist in 1976 — no
--      links, no apps, no confirming online."
--
-- Lifted on her ruling above. THE ROOM IS A REGISTER, NOT A TIME MACHINE: the
-- member's party happens this year and her guests have phones. 1976 is how the
-- evening READS, not a claim about what may physically be in the room.
--
-- WHAT IS DELIBERATELY NOT TOUCHED: the `never` lines in the Westhampton and
-- Las Vegas voice blocks in src/lib/destinations.ts, which say the same
-- sentence about the same year. Those govern HOW THE ROOM WRITES — they are
-- authored voice content, enforced by npm run check:voice-output — and they
-- are a different rule wearing the same words. They are hers to rule on
-- separately and they stand.

do $$
declare r record; v_occ integer := 0; v_world integer := 0;
begin
  -- Named on the way out, one line per row. A delete that prints nothing is a
  -- delete nobody can audit afterwards (rule 16, and db/061 on the same
  -- argument).
  for r in
    select g.slug, o.occasion::text as occasion, o.note
      from game_occasion o join game g on g.id = o.game_id
     where o.fit = 'forbidden'
     order by g.slug, o.occasion
  loop
    v_occ := v_occ + 1;
    raise notice 'db/066 — lifting forbid: % at % (was: %)',
      r.slug, r.occasion, coalesce(nullif(r.note, ''), 'no note');
  end loop;

  for r in
    select g.slug, w.slug as world, gw.note
      from game_world gw
      join game g on g.id = gw.game_id
      join world w on w.id = gw.world_id
     where gw.forbidden
     order by g.slug, w.slug
  loop
    v_world := v_world + 1;
    raise notice 'db/066 — lifting world forbid: % at % (was: %)',
      r.slug, r.world, coalesce(nullif(r.note, ''), 'no note');
  end loop;

  raise notice 'db/066 — % occasion forbids and % world forbids to lift.',
    v_occ, v_world;
end;
$$;

delete from game_occasion where fit = 'forbidden';

-- A world scope may carry a native claim or a weight as well as the veto, so
-- the veto is cleared rather than the row dropped, and only a row left saying
-- NOTHING is removed. Today that is one row and both statements are correct
-- for it; written generally because the next one may not be.
update game_world set forbidden = false where forbidden;
delete from game_world
 where not forbidden and not native and affinity = 0;

do $$
declare v_occ integer; v_world integer;
begin
  select count(*) into v_occ from game_occasion where fit = 'forbidden';
  select count(*) into v_world from game_world where forbidden;
  if v_occ <> 0 or v_world <> 0 then
    raise exception
      'db/066 left % occasion forbids and % world forbids standing.',
      v_occ, v_world;
  end if;
  raise notice 'db/066 — no forbid remains in the game catalogue.';
end;
$$;
