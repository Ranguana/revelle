-- ── 068 · THE DAY COMES BACK, AND A GAME KNOWS THE HOUR ──────────────
--
-- Applied by scripts/migrate.mjs after 067, inside one transaction together
-- with its schema_migrations ledger row.
--
-- Two founder rulings of 2026-09-06, made in the same conversation and landed
-- together because the second one has nowhere to be true without the first.
--
--     "day_material should come back for multi-day occasions only"
--     "field days are daytime games"
--
-- ═════════════════════════════════════════════════════════════════════
-- PART ONE — THE DAY BEAT COMES BACK
-- ═════════════════════════════════════════════════════════════════════
--
-- ── WHAT db/061 ACTUALLY DELETED, AND WHY IT WAS WRONG ───────────────
--
-- db/061 is CORRECT and is not reversed here. Its ruling was
--
--     "there shouldnt be more than one ga[m]e"
--
-- said about a Westhampton DINNER PARTY that came out of the engine carrying
-- Art Battle and Fishbowl on the same night. One evening, two games. She said
-- one.
--
-- THE BRIEFING THAT REACHED db/061 FLATTENED "ONE EVENING" INTO "ONE REVELLE",
-- and that is the error this file corrects. It was a briefing error and not
-- her ruling; it is recorded here in the plainest words available so that the
-- next reader does not re-derive the flattening from db/061's own confident
-- prose:
--
--   ONE GAME PER EVENING.        db/061. The `game` beat. UNCHANGED BY THIS
--                                FILE — still one row per occasion, still
--                                min 1 max 1, still offering three.
--
--   MATERIAL PER DAY.            `day_material`. A different beat, about the
--                                DAYTIME of an occasion that has days. It is
--                                not a second game for the evening and it
--                                never was.
--
-- A three-day getaway is three days AND three evenings. db/009 wrote the
-- distinction into `slot_kind` on the day it invented both beats —
-- `day_material` is "Material for one day of something that runs longer than
-- an evening", `game` is "A game or a ritual". Reading the first as a second
-- helping of the second is what cost the deletion.
--
-- ── WHAT THE DELETION COST, COUNTED ──────────────────────────────────
--
-- Ten of the twenty-seven authored games carry
-- `{ slotCode: "day_material", fit: "native" }` in src/lib/games.ts. Since
-- db/061 those ten claims have pointed at a beat no occasion has. They did not
-- go red — they could not, because every one of those games ALSO claims
-- `game`, so nothing was stranded and nothing reported anything. The claims
-- were simply inert. This file makes them reachable again, and section 1.3
-- counts them rather than asserting it.
--
-- ── AND THE MIRROR RISK, WHICH IS THE ONE THIS FILE OWNS ─────────────
--
-- CLAUDE.md's near-miss entry says: before DELETING a row that other rows
-- point at, count what points at it. RESTORING one has the opposite failure
-- and it is just as quiet — A SLOT NOTHING CLAIMS. A required beat drawing
-- from a pool no row can fill produces a Revelle with a gap, reported as a
-- catalogue shortfall rather than as a schema mistake, and somebody spends a
-- day looking in the wrong place.
--
-- So section 1.3 counts in BOTH directions (rule 24) and says what it cannot
-- see: on a scratch build the `game` table is EMPTY when migrations run —
-- migrate comes before every seeder — so the claim count is vacuously zero
-- there and proves nothing. It is green because there is nothing to be wrong
-- about. src/lib/games.test.ts asserts the authored half on every run, with no
-- database at all, which is the half a scratch build cannot speak to.
--
-- ── A FINDING CARRIED OVER FROM db/067, CREDITED ─────────────────────
--
-- db/067 (untracked, superseded, left on disk with its reasoning) took the
-- other road — `per_day = true` on the `game` beat — and it is not taken here,
-- because multiplying the evening's game is a change she has not made and it
-- would put a sack race where the charades goes. But it found something true
-- and worth keeping:
--
--     `per_day` IS DEAD IN PRODUCTION RIGHT NOW. The only occasion_slot rows
--     that ever carried it were the three `day_material` rows — girls_weekend,
--     getaway, bridal — and db/061 deleted all three. So db/061 did not only
--     reduce a count; it removed the product's only per-day mechanism and left
--     `src/lib/selection/occasion.ts`'s day loop reachable by nothing.
--
-- That makes this migration an instance of CLAUDE.md rule 24's corollary:
-- "NEVER USED" MEANS "NEVER TESTED AGAINST THE TABLES IT WILL ACTUALLY MEET."
-- Restoring these three rows is the first thing to exercise `per_day` since
-- db/061, so the exercise is forced early rather than discovered on a deploy:
-- `src/lib/day-material.test.ts` drives `planSlots` with the replayed rows and
-- asserts three day beats with the day indices on them.
--
-- ═════════════════════════════════════════════════════════════════════
-- PART TWO — A GAME KNOWS ITS HOUR
-- ═════════════════════════════════════════════════════════════════════
--
-- Games carried `shape` — ambient, scheduled, finale — which says WHAT A GAME
-- DOES TO AN EVENING, and nothing at all about WHEN IT HAPPENS. Every other
-- pool with an opinion about the hour has had one since db/031.
--
-- ── THE VOCABULARY IS SHARED, NOT MINTED ─────────────────────────────
--
-- CLAUDE.md rule 21: every fact two surfaces must agree on has exactly one
-- owner, and the narrow test is MUST TWO SURFACES AGREE ABOUT THIS. They must.
-- "Daylight" has to mean the same thing on a bank item and on a game or a
-- package that renders both is telling a host two different times of day in
-- one document. A second enum saying the same five words in a different order
-- is rule 19's hand-written list wearing a type name.
--
-- So games take db/031's enum, whole, with db/033's `dawn` in it:
--
--     daylight · dusk · dark · dawn · all
--
-- and db/031's argument for the default comes with it, unchanged and quoted
-- because it is the part that gets lost:
--
--     "`all` meaning NO OPINION rather than 'every phase'. The default is
--      `all` because most content has no time of day, and a tag that has to
--      be filled in for every row gets filled in wrongly."
--
-- ── SO THE TYPE IS RENAMED ───────────────────────────────────────────
--
-- `bank_phase` was an honest name while the bank was the only pool that had
-- one. A column reading `game.phase bank_phase` is CLAUDE.md rule 23's exact
-- shape — the field is not broken, the name promises a different thing — and
-- the next reader would either mint a parallel enum to avoid it or assume the
-- game pool is somehow part of the bank. Renamed to `day_phase`, which is what
-- it has always described. Nothing about the values, their order or their
-- meaning changes; `bank_item.phase` keeps every row it had.
--
-- The rename reaches code in the same commit, because a cast is a name:
-- src/app/desk/(signed-in)/bank/actions.ts, .../images/actions.ts,
-- scripts/seed-bank.mjs, and `BANK_PHASES` in src/lib/desk/labels.ts, which is
-- now `DAY_PHASES` and is read by the game desk as well as the bank one.
-- src/lib/seed-binds.test.ts keeps `::bank_phase` inside one string on purpose:
-- it is a verbatim fixture of a statement as it was once committed, kept to
-- prove the bind scanner still catches it, and it is never executed.
--
-- ── WHAT `game.phase` DOES, SAID AT THE FIELD BECAUSE THE NAME INVITES
--    THE OTHER READING (rule 23) ─────────────────────────────────────
--
-- IT DESCRIBES. IT DOES NOT PRUNE AND IT DOES NOT SCORE. It is the same kind
-- of column `bank_item.phase` has been since db/031: a curator sets it, the
-- desk filters on it, a host reads it, and no line of `src/lib/selection`
-- looks at it.
--
-- That is stated LOUDLY rather than left to be discovered, because CLAUDE.md
-- rule 15 hunts exactly this shape — an instrument sitting in the scoring loop
-- looking like it works. This one is not in the scoring loop at all, and the
-- distinction is the whole of its honesty.
--
-- WHAT ACTUALLY KEEPS A DAYTIME GAME OUT OF THE EVENING IS THE SLOT CLAIM.
-- The field day games claim `day_material` natively and nothing else, and
-- `slotEligibility` reads a native claim as a whitelist, so they are eligible
-- for the day beat and refused for the evening one. The phase column agrees
-- with that arrangement and does not cause it. If the day beat is ever to
-- REFUSE a `dark` game, that is a gate somebody authors on purpose — a
-- `slot_phase` table alongside `slot_shape` — and it is not smuggled in here
-- under a column that reads descriptive.
--
-- ── RULE 33: SCRATCH-SEEDED VERSUS PRODUCTION-UNSEEDED ───────────────
--
-- Read db/053's header. Every constraint this file adds over seed-supplied
-- data backfills before it constrains, in the same statement:
--
--   game.phase       `not null default 'all'`, so every row production already
--                    holds acquires the value that means NO OPINION — which is
--                    the truth about every game authored before today. No
--                    seeder must supply anything for this migration to pass
--                    against production as it stands.
--
--   occasion_slot    inserts only, of rows whose every column is given.
--                    `per_day` is the column being restored and it is written
--                    explicitly rather than defaulted.
--
-- WHAT IT CANNOT REPAIR, NAMED RATHER THAN INVENTED (rule 32): the field day
-- games do not exist in a production database until scripts/seed-games.mjs
-- next runs, and that seeder is INSERT-ONLY — it skips a slug it already has.
-- So a game already in production keeps `phase = 'all'` even if this file's
-- authors later give it an hour in src/lib/games.ts. Nothing here backfills a
-- phase onto an existing row from the source file, because guessing which of
-- twenty-seven existing games meant `daylight` is inventing content in a
-- migration. Every one of them means `all` today, which is what they get.


-- ── 0. THE COUNT, RECORDED BEFORE IT IS CHANGED ──────────────────────
--
-- CLAUDE.md rule 24, and db/061 section 0's own precedent: after this file
-- runs the before-number can never be observed again.

do $$
declare
  v_game_slots integer;
  v_day_slots  integer;
  v_multi      integer;
  v_claims     integer;
  v_games      integer;
begin
  select count(*) into v_game_slots from occasion_slot where slot_code = 'game';
  select count(*) into v_day_slots  from occasion_slot where slot_code = 'day_material';
  select count(*) into v_multi      from occasion_shape where days > 1;
  select count(*) into v_games      from game;
  select count(*) into v_claims
    from game_slot where slot_code = 'day_material' and fit = 'native';

  raise notice
    'db/068 BEFORE — % occasions run more than one day; day_material has % '
    'occasion_slot row(s) and % native game claim(s); the game beat has % '
    'row(s) across % game(s) in the catalogue.',
    v_multi, v_day_slots, v_claims, v_game_slots, v_games;

  -- The diagnosis, checked rather than assumed. If day_material still has
  -- rows, db/061 did not run here and this file is about to insert duplicates
  -- into a table it does not understand.
  if v_day_slots <> 0 then
    raise exception
      'db/068 expected day_material to have NO occasion_slot rows — db/061 '
      'deleted them — and found %.', v_day_slots
      using hint = 'Either db/061 never ran against this database or somebody '
                   'has already restored the beat. Read both files before '
                   'deleting this check.';
  end if;

  if v_multi = 0 then
    raise exception
      'db/068 found no occasion running more than one day. This file exists '
      'to give those occasions a day beat; against an empty set it would '
      'silently do nothing and report success.'
      using hint = 'occasion_shape is seeded by db/009 and is not content. An '
                   'empty result means the migration chain is not the chain '
                   'this file was written against.';
  end if;
end;
$$;


-- ── 1.1 THE DAY BEAT, WHERE THE OCCASION HAS DAYS ────────────────────
--
-- DRIVEN OFF occasion_shape, NEVER OFF A LIST OF OCCASION NAMES (rule 19 and
-- db/009's own argument for the column: "so that changing a weekend from three
-- days to two does not require touching this table at all"). A tenth occasion
-- admitted next month with days > 1 gets its day beat from the same predicate
-- and needs no migration; a hand-written ('girls_weekend', 'getaway',
-- 'bridal') would be correct until exactly that day and then wrong without
-- being broken.
--
-- The values are db/009's own, restored as they were rather than re-decided:
-- one per day, required, per_day true, position 60 — which is `slot_kind`'s
-- own position for this beat and puts the day before the evening's game at 70.
-- Changing `required` or the counts in the same statement that restores the
-- row would be a second ruling wearing a repair.
--
-- `offer_count` IS NOT SET AND THEREFORE DEFAULTS TO 1 — the house places the
-- day's material. That is deliberate and it is the conservative reading: db/061
-- gave the carousel to the beat she was looking at, which was the evening's
-- game, and nothing she has said extends it to the day. What she DID say about
-- choosing per day — "host chooses itinerary... field day games include all and
-- she chooses" — is a different mechanism from offer_count (which resolves to
-- exactly one running item per beat, enforced by db/061's partial unique index)
-- and it is specified in docs/itinerary.md rather than half-built here.

insert into occasion_slot
  (occasion, slot_code, pool, min_count, max_count, required, per_day,
   position, note)
select sh.occasion, 'day_material', 'game', 1, 1, true, true, 60,
       'Material for one day of an occasion that has days. RESTORED by '
       'db/068: db/061 deleted this beat on a briefing that read her "one '
       'game" as one game per Revelle, and she meant one game per EVENING. '
       'The evening''s `game` beat is untouched and still offers three. One '
       'per day; occasion_shape.days does the multiplying.'
  from occasion_shape sh
 where sh.days > 1
on conflict (occasion, slot_code) do nothing;


-- ── 1.2 AND THE EVENING'S GAME IS NOT TOUCHED ────────────────────────
--
-- No update, no delete, no insert against `slot_code = 'game'` anywhere in
-- this file. Said as a comment because the absence of a statement is not
-- something a later reader can see, and db/061's ruling is the thing most at
-- risk from a file that reopens the table it closed.


-- ── 1.3 COUNT WHAT IT MATCHED, IN BOTH DIRECTIONS ────────────────────

do $$
declare
  v_multi     integer;
  v_day       integer;
  v_single    integer;
  v_game      integer;
  v_occ       integer;
  v_claims    integer;
  v_games     integer;
  v_stranded  integer;
  r           record;
begin
  select count(*) into v_multi from occasion_shape where days > 1;
  select count(*) into v_occ   from occasion_shape;

  select count(*) into v_day
    from occasion_slot os join occasion_shape sh on sh.occasion = os.occasion
   where os.slot_code = 'day_material' and sh.days > 1;

  -- THE OTHER DIRECTION. "for multi-day occasions ONLY" is half of the ruling
  -- and it is the half a predicate typo would silently break.
  select count(*) into v_single
    from occasion_slot os join occasion_shape sh on sh.occasion = os.occasion
   where os.slot_code = 'day_material' and sh.days = 1;

  select count(*) into v_game from occasion_slot where pool = 'game' and slot_code = 'game';

  if v_day <> v_multi then
    raise exception
      'db/068: % occasions run more than one day and % of them have a day '
      'beat.', v_multi, v_day;
  end if;

  if v_single <> 0 then
    raise exception
      'db/068 gave a day beat to % one-evening occasion(s). She said multi-day '
      'ONLY, and an evening does not have a day to carry material.', v_single
      using hint = 'The predicate is occasion_shape.days > 1. Do not widen it '
                   'to make a coverage report go quiet.';
  end if;

  -- db/061'S INVARIANT, RE-ASSERTED BY THE FILE MOST LIKELY TO BREAK IT.
  if v_game <> v_occ then
    raise exception
      'db/068 disturbed db/061: % occasions, % `game` beats. This file adds a '
      'DAY beat and must never add, remove or multiply the evening''s game.',
      v_occ, v_game;
  end if;

  for r in
    select os.occasion, sh.days
      from occasion_slot os join occasion_shape sh on sh.occasion = os.occasion
     where os.slot_code = 'day_material'
     order by os.occasion
  loop
    raise notice 'db/068 — % gets % day beat(s), one per day.', r.occasion, r.days;
  end loop;

  -- ── THE MIRROR RISK: A SLOT NOTHING CLAIMS ──────────────────────────
  select count(*) into v_games from game;
  select count(*) into v_claims
    from game_slot where slot_code = 'day_material' and fit = 'native';

  -- And the number that matters more, which is the one nobody goes looking
  -- for: a game left with no reachable beat at all. `slotEligibility` reads a
  -- native claim as a whitelist, so a game whose every native slot claim names
  -- a beat no occasion has is unplaceable and says nothing about it.
  select count(*) into v_stranded
    from game g
   where exists (select 1 from game_slot gs
                  where gs.game_id = g.id and gs.fit = 'native')
     and not exists (
       select 1 from game_slot gs
         join occasion_slot os on os.slot_code = gs.slot_code
        where gs.game_id = g.id and gs.fit = 'native' and os.pool = 'game');

  raise notice
    'db/068 — day_material is claimed natively by % of % game(s); % game(s) '
    'claim only beats no occasion has.', v_claims, v_games, v_stranded;

  if v_stranded > 0 then
    raise exception
      'db/068 leaves % game(s) claiming only beats no occasion has.',
      v_stranded
      using hint = 'This file only ADDS a beat, so it cannot have caused '
                   'this. Read db/061 section 4b — the condition it checks '
                   'for is the same one.';
  end if;

  -- A REQUIRED BEAT NOTHING CAN FILL IS A GAP REPORTED IN THE WRONG PLACE.
  -- Refused rather than warned about, but ONLY where the question can be
  -- asked: see the honest note below.
  if v_games > 0 and v_claims = 0 then
    raise exception
      'db/068 restored a required day beat and NO game claims it. Every '
      'Revelle for a multi-day occasion would carry a gap, reported as a thin '
      'catalogue rather than as this migration.'
      using hint = 'Ten authored games carry '
                   '{ slotCode: "day_material", fit: "native" } in '
                   'src/lib/games.ts. If none of them reached the database, '
                   'the seeder is the thing to look at.';
  end if;

  -- WHAT THIS CHECK CANNOT SEE, SAID PLAINLY RATHER THAN DISCOVERED LATER
  -- (rule 33, from the honest end). On a scratch build the `game` table is
  -- EMPTY when this migration runs — migrate comes before every seeder — so
  -- both counts above are zero and the guard passes vacuously. It is green
  -- there because there is nothing to be wrong about, not because it proved
  -- anything. src/lib/games.test.ts asserts the authored half with no database
  -- at all, and that is the half a scratch build cannot speak to.
  if v_games = 0 then
    raise notice
      'db/068 — the game table is empty, so the claim counts above prove '
      'nothing. This is a scratch build; the seeders have not run yet.';
  end if;
end;
$$;


-- ── 2.1 ONE VOCABULARY FOR THE TIME OF DAY ───────────────────────────

alter type bank_phase rename to day_phase;

comment on type day_phase is
  'THE TIME OF DAY, for any pool that has an opinion about one. daylight, '
  'dusk, dark, dawn — and `all`, which is the default and means NO OPINION '
  'rather than "every phase" or "always". Named bank_phase from db/031 until '
  'db/068 gave it a second pool; the values, their order and their meaning are '
  'db/031''s and db/033''s, unchanged.';


-- ── 2.2 A GAME MAY SAY WHEN IT HAPPENS ───────────────────────────────

alter table game
  add column phase day_phase not null default 'all';

comment on column game.phase is
  'WHEN THIS GAME HAPPENS, or `all` for no opinion — which is the default and '
  'what every game authored before db/068 means. DESCRIPTIVE: it does not '
  'prune and it does not score, exactly as bank_item.phase has not since '
  'db/031. What keeps a daytime game out of the evening beat is its '
  'game_slot claim, which slotEligibility reads as a whitelist. See db/068.';

create index game_phase_idx on game (phase, status) where phase <> 'all';


-- ── 2.3 THE ROWS THAT MEAN SOMETHING BY IT ───────────────────────────
--
-- None here. Content is the seeder's (rule 22), and the authored value travels
-- from src/lib/games.ts through scripts/seed-games.mjs. Every game production
-- already holds means `all`, which is exactly what the DEFAULT above gave it —
-- so there is no backfill to write and no value to invent (rule 32: the only
-- argument for writing one would be symmetry with the field day games, and
-- symmetry is not evidence).
