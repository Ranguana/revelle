-- Revelle Société — ONE GAME, AND SHE PICKS IT
--
-- Applied by scripts/migrate.mjs after 060, inside one transaction together
-- with its schema_migrations ledger row.
--
-- ─────────────────────────────────────────────────────────────────────
-- THE RULING
--
-- Founder, 2026-09-04, two sentences made together:
--
--     "there shouldnt be more than one ga[m]e"
--     "what i do want to do is give a host three ga[m]es to choose from.
--      as an or not an and. like a carousel look."
--
-- and then, cutting short a question about venue constraints and binding
-- semantics: "just give her three".
--
-- ONE GAME REACHES THE EVENING, AND SHE CHOOSES IT FROM THREE. That is the
-- whole of it. No new gate, no venue requirement, no question added to the
-- application — she declined that scope by name and this file does not
-- smuggle it back in.
--
-- ── WHAT SHE SAW ────────────────────────────────────────────────────
--
-- A Westhampton dinner party came out of the engine carrying Art Battle (in
-- `the_moment`) AND Fishbowl (in `game`). Two games, neither wrong, both
-- placed by a system doing exactly what it was told. The count below is the
-- rest of the answer: SEVEN OF NINE OCCASIONS DRAW FROM THE GAME POOL MORE
-- THAN ONCE, and a birthday draws from it five times.
--
--     occasion       game-pool slots today
--     birthday       5   honouring, the_moment, game, ambient_game, finale
--     bridal         5   honouring, day_material, game, ambient_game, finale
--     girls_weekend  4   day_material, the_moment, ambient_game, finale
--     holiday        3   game, ambient_game, finale
--     no_reason      3   game, ambient_game, finale
--     anniversary    2   honouring, the_moment
--     dinner_party   2   the_moment, game
--     getaway        2   day_material, the_moment
--     other          1   game
--
-- Twenty-seven rows. Nine survive this file.
--
-- ── WHAT HAPPENS TO THE OTHER FIVE BEATS ────────────────────────────
--
-- They stop drawing from `game`, and their `occasion_slot` rows go. Not
-- re-pointed at another pool, not quietly left drawing games, not filled by a
-- pool invented here to keep the shape tidy. CLAUDE.md rule 32: symmetry is
-- not evidence, and "a requirement lost its claimants, so re-point it at
-- whatever replaced them" is the exact move that rule refuses.
--
-- The case against keeping any of them, per beat, because the reasons differ:
--
--   the_moment    slot_kind, verbatim: "The thing they retell. Staged, never
--                 announced." A GAME GETS ANNOUNCED — somebody explains the
--                 rules, that is what starting a game is. The slot has been
--                 drawing from a pool whose defining act contradicts its own
--                 description since db/009. This one is not a casualty of the
--                 ruling; the ruling found it.
--
--   honouring     "How the person is marked... required to be a ritual rather
--                 than a purchase." The intent is right and the pool was
--                 wrong: a ritual is not a party game, and drawing one from
--                 `game` is how a birthday ended up with a game in the beat
--                 where her sister gets toasted. src/lib/games.test.ts already
--                 asserts that NO AUTHORED GAME CLAIMS THIS SLOT — the pool
--                 has been declining the job for as long as the slot has
--                 existed, and db/010 left the gap visible on purpose.
--
--   day_material  "Material for one day of something that runs longer than an
--                 evening." A weekend's Saturday is not a game either, and
--                 per_day made it the single largest multiplier of games in
--                 the catalogue: three days of a getaway, three draws.
--
--   ambient_game  A deck carried through the evening is unmistakably a game.
--   finale        So is the auction that spends what the evening produced.
--
-- The last two are the ones a clever reading would keep: db/010 argues an
-- ambient game "consumes no block at all" and may therefore sit alongside a
-- scheduled one, so one could claim they are not "more than one game" in the
-- sense she meant. THAT READING IS REFUSED HERE. She was shown two games and
-- said one. An ambient game is announced, played, printed and remembered as a
-- game; a finale is the most game-like thing in the catalogue. Carving an
-- exception she did not ask for, on an argument about blocks rather than about
-- what a guest experiences, is how a ruling gets eroded by the people
-- implementing it.
--
-- WHAT THE ABSENCE MEANS, said once and plainly (CLAUDE.md rule 29): a beat
-- with no occasion_slot row is an AUTHORING GAP, not a property of the
-- occasion. There is no pool today that authors a ritual, a retold moment, or
-- a day's material, and inventing one in a migration would be content in a
-- migration. Somebody may author that pool. Until then the beat is absent, and
-- it is absent LOUDLY: section 1 below prints every deleted row to the deploy
-- log, and `slot_kind` keeps all five rows so re-enabling any of them is an
-- insert rather than a migration reconstructing a deleted slot. That is db/022's
-- treatment of `the_menu`, followed deliberately.
--
-- db/014's paragraph — "`honouring`, `the_moment` and `day_material` draw from
-- the same pool and are NOT removed [by no_games]... a woman who does not want
-- games still wants her sister toasted" — is PRESERVED AND NOW MOOT (rule 14).
-- It was right about the principle and it was arguing over a pool assignment
-- that this file deletes. Those three slots draw from nothing now, so nothing
-- removes them and nothing fills them.
--
-- ── THE CAROUSEL ────────────────────────────────────────────────────
--
-- `occasion_slot.offer_count`. One beat, three candidates, one of them hers.
--
-- A COLUMN ON occasion_slot, not a constant in the filler, for db/009's own
-- stated reason about occasion_shape.days: "a product decision that lives in a
-- `switch` is a product decision nobody can find". Three is a product decision
-- and it is now a number a curator can change with an update.
--
-- Pool-agnostic, defaulting to 1, because `occasion_slot.pool` is a foreign key
-- into the registry and every mechanism hung on this table has to be
-- (CLAUDE.md rule 19). Setting offer_count = 3 on a product slot must be
-- RECORDABLE even though nothing offers products today — a column that could
-- only hold the answer for one pool would absorb the other answers and drop
-- them (rule 16). Only the nine game rows carry 3 today.
--
-- ── HOW THE CHOICE BINDS. THE LOAD-BEARING DECISION IN THIS FILE ─────
--
-- She was not asked, so it is decided here and the reasoning is the point.
--
-- db/003: "An assemblage is delivered once, to one person, for good", binding
-- at DELIVERY and never released. The question a carousel raises is what that
-- promise is about when the member chooses AFTER delivery.
--
-- THE ANSWER: ALL THREE ARE DELIVERED. THE OFFER IS THE ASSEMBLAGE. THE CHOICE
-- IS NOT PART OF IT.
--
-- Every offered game is written into `revelle_game` at approval, so all three
-- are inside `compute_assemblage_fingerprint` and no two members ever receive
-- the same trio. Her pick is recorded as `chosen_at` on the join row — a
-- column db/002 already classes as outside the fingerprint, alongside `slot`
-- and `position`, for the same reason: it records where a thing sits in her
-- Revelle, not which things she has.
--
-- The alternative was to deliver nothing in the beat and write the game she
-- picks. IT IS REFUSED, and this is the argument:
--
--   1. IT WOULD LET THE HOUSE REFUSE HER. Writing the ingredient after
--      delivery mutates the fingerprint of a row whose ratchet has already
--      fired. Two members offered overlapping trios could pick their way into
--      the same assemblage, and the guard — correctly, doing its job — would
--      raise on the second one's click. A product that offers a choice and
--      can then decline it has absorbed input it does not honour, which is
--      rule 16 in its plainest form. The offer must be unrefusable, so the
--      thing that binds must be fixed before she touches it.
--
--   2. IT WOULD MAKE HER MIND-CHANGE A DELIVERY EVENT. Under db/003 the
--      delivered set is final; changing it later is exactly the reissue the
--      founder's decision 2 forbids. Under the offer-binds rule, changing her
--      mind moves one timestamp and touches nothing the promise is made of.
--      She may change it as often as she likes, forever, and the system has
--      nothing to say about it.
--
--   3. IT WOULD MAKE "WHAT WAS SHE GIVEN" UNANSWERABLE. The house delivered
--      three games. A record that stored only the survivor would lose the two
--      she was offered the moment she chose — and the two she declined are the
--      most interesting rows in the table for anybody asking later what the
--      catalogue is doing.
--
-- SO: THE CHOICE BINDS HER EVENING AND NOT HER ASSEMBLAGE. It is reversible
-- without limit, it can never be refused, and it never moves a fingerprint.
--
-- AND THE UNCHOSEN TWO STAY VISIBLE. CLAUDE.md rule 18: between a mistake and
-- its fix, the thing being corrected stays exactly where it was. Hiding the
-- other two on choosing would not merely relocate the target of the correction
-- — it would DELETE it, leaving her no way back. `position` is stamped at
-- approval and nothing re-sorts on a choice, so the card she wants is where it
-- was the first time she looked. The house also does not get to tidy away what
-- it gave her: all three are hers.
--
-- ── WHAT THIS FILE ADDS ─────────────────────────────────────────────
--
--   occasion_slot.offer_count       how many candidates a beat offers
--   revelle_<pool>.offer_group      which alternatives a row belongs to
--   revelle_<pool>.chosen_at        when she took this one. Null = not taken
--   revelle_proposal_pick.offer_group   so approval can carry it across
--   slot_shape                      `game` now accepts all three shapes
--   revelle_game_load               counts an offer once, not three times
--
-- ── RULE 33: SCRATCH-SEEDED VERSUS PRODUCTION-UNSEEDED ───────────────
--
-- Read db/053's header. A constraint over seed-supplied data must backfill
-- before it constrains, in the same migration, and must name what it cannot
-- repair. Every check added below is either satisfied by a DEFAULT applied to
-- existing rows (`offer_count` defaults to 1, which is what every slot means
-- today) or is conditional on a column that starts NULL everywhere
-- (`chosen_at`, `offer_group`), so there is no value a seeder must supply for
-- this migration to pass against production data as it stands.
--
-- WHAT IT CANNOT REPAIR, NAMED RATHER THAN INVENTED: Revelles already
-- delivered carry ONE game row with `offer_group` null. They were placed by
-- the house, before choosing existed, and nothing here backfills them into a
-- choice she never made. A null offer_group reads as "placed, not offered" —
-- the portal renders it as her game and asks her nothing, which is the truth
-- about how it got there. No row is retro-marked `chosen_at`; a fabricated
-- decision is worse than an honest absence of one.
--
-- The deletes below are safe against issued Revelles for db/022's reason,
-- restated because it is not obvious: `revelle_<pool>.slot_code` references
-- `slot_kind(code)`, never `occasion_slot`. Removing an occasion's claim on a
-- slot does not orphan anything already issued into it.
-- ─────────────────────────────────────────────────────────────────────


-- ── 0. THE COUNT, RECORDED BEFORE IT IS CHANGED ──────────────────────
--
-- CLAUDE.md rule 24: count what it matched, and count it BEFORE the repair,
-- because after this file runs the number can never be observed again. db/052
-- does the same thing for the same reason.
--
-- This is also the guard against the diagnosis being wrong. If production does
-- not hold twenty-seven game-pool rows across nine occasions, the deploy log
-- says so and somebody reads this file again instead of trusting its table.

do $$
declare
  r       record;
  v_total integer := 0;
  v_kept  integer := 0;
begin
  raise notice 'db/061 — game-pool slots BEFORE the collapse:';
  for r in
    select occasion, count(*) as n,
           string_agg(slot_code, ', ' order by position) as slots
      from occasion_slot
     where pool = 'game'
     group by occasion
     order by count(*) desc, occasion
  loop
    v_total := v_total + r.n;
    raise notice '  %  %  (%)', rpad(r.occasion::text, 14), r.n, r.slots;
  end loop;

  select count(*) into v_kept from occasion_slot
   where pool = 'game' and slot_code = 'game';

  raise notice 'db/061 — % game-pool rows across % occasions; % of them are '
               'the `game` slot itself and survive.',
               v_total,
               (select count(distinct occasion) from occasion_slot
                 where pool = 'game'),
               v_kept;

  if v_total = 0 then
    raise exception
      'db/061 found NO occasion_slot rows drawing from `game`. This file '
      'exists to collapse several into one; against an empty set it would '
      'silently do nothing and report success.'
      using hint = 'A database that has never run the db/009 and db/010 '
                   'inserts is not the database this migration was written '
                   'against. Do not "fix" this by deleting the check.';
  end if;
end;
$$;


-- ── 1. THE COLLAPSE ──────────────────────────────────────────────────
--
-- Every occasion_slot row drawing from `game` goes, EXCEPT the `game` slot
-- itself. Named in the log on the way out, one line per row: a delete of
-- twenty-one rows that prints nothing is a delete nobody can audit afterwards
-- (rule 16, and db/057's notice on the same argument).

do $$
declare r record; n integer := 0;
begin
  for r in
    select occasion, slot_code, required
      from occasion_slot
     where pool = 'game' and slot_code <> 'game'
     order by slot_code, occasion
  loop
    n := n + 1;
    raise notice 'db/061 — dropping % from % (was %)',
      r.slot_code, r.occasion,
      case when r.required then 'required' else 'optional' end;
  end loop;
  raise notice 'db/061 — % beats stop drawing from the game pool.', n;
end;
$$;

delete from occasion_slot where pool = 'game' and slot_code <> 'game';

-- The five slot_kind rows are KEPT, exactly as db/022 kept `the_menu`. They
-- name slots that issued Revelles still reference, and re-enabling any of them
-- against a pool somebody authors later is an insert.


-- ── 2. EVERY OCCASION HAS THE ONE GAME SLOT ──────────────────────────
--
-- Six occasions already carry `game`. Three do not — girls_weekend, getaway
-- and anniversary drew their games through `day_material`, `the_moment` and
-- `honouring`, all of which just went. Without these three rows the collapse
-- would take those occasions from four, two and two games to NONE, which is a
-- different ruling from the one she made.
--
-- REQUIRED ON ALL NINE, including the getaway. db/009 called the getaway "the
-- occasion that most resists being decorated" and that argument is intact —
-- but it was written when a getaway drew three day-material games plus a
-- moment. One game, chosen by her, is less decoration than the getaway has
-- ever had. Required is also what makes a thin pool a work order the house can
-- see (rule 15) instead of a silence nobody reports.

insert into occasion_slot
  (occasion, slot_code, pool, min_count, max_count, required, per_day,
   position, note)
values
  ('girls_weekend', 'game', 'game', 1, 1, true, false, 45,
   'The one game of the weekend, chosen by her from what the room offers. '
   'Replaces db/009''s per-day draw and db/010''s undercurrent and ending. '
   'See db/061.'),
  ('getaway', 'game', 'game', 1, 1, true, false, 35,
   'One game, and it is hers to choose. The getaway resists decoration and '
   'this is less of it than the three day-material draws it used to get. '
   'See db/061.'),
  ('anniversary', 'game', 'game', 1, 1, true, false, 45,
   'Two people and a quiet room still get one game, offered rather than '
   'assigned. See db/061.')
on conflict (occasion, slot_code) do nothing;

-- The six that already had it: `bridal` had it OPTIONAL, which was correct
-- when a bridal also drew four other games and is not correct when this is the
-- only one. All nine now say the same thing.
update occasion_slot
   set required = true, min_count = 1, max_count = 1
 where slot_code = 'game' and pool = 'game';

do $$
declare v_n integer; v_occ integer;
begin
  select count(*) into v_n from occasion_slot where pool = 'game';
  select count(*) into v_occ from occasion_shape;
  if v_n <> v_occ then
    raise exception
      'db/061 expected exactly one game slot per occasion: % occasions, % '
      'game-pool slots.', v_occ, v_n
      using hint = 'Either an occasion has no game slot (she gets no game at '
                   'all) or one has two (the ruling this file implements is '
                   'violated by the file implementing it).';
  end if;
  raise notice 'db/061 — % occasions, one game slot each.', v_occ;
end;
$$;


-- ── 3. THE CAROUSEL, AS A NUMBER ─────────────────────────────────────

alter table occasion_slot
  -- HOW MANY CANDIDATES THIS BEAT OFFERS HER. 1 — the default, and what every
  -- other slot means — is the house placing it. More than one means she
  -- chooses, every candidate offered is delivered, and exactly one of them is
  -- hers at a time.
  --
  -- This is an OR, never an AND: offer_count does not multiply what she
  -- receives in the beat, it multiplies what she is shown. min_count and
  -- max_count are untouched and still say how many items the beat contains.
  add column offer_count integer not null default 1 check (offer_count >= 1);

comment on column occasion_slot.offer_count is
  'How many candidates are OFFERED for this beat. 1 = the house places it. '
  'n > 1 = she chooses one of n, and all n are delivered to her. An OR, not '
  'an AND: it does not change how many items the beat contains. See db/061.';

update occasion_slot set offer_count = 3 where pool = 'game';

-- WHERE FEWER THAN THREE ARE ELIGIBLE, SHOW WHAT EXISTS. Nothing here pads,
-- repeats or fails. The second and third candidates are expanded as OPTIONAL
-- units by src/lib/selection/occasion.ts, so a room with one eligible game
-- fills the required unit and drops the other two the way any optional slot is
-- dropped — no gap, no error, and the portal says plainly how many the room
-- offered. A room with one game is a room with one game; it is not a fault and
-- it is not hidden.


-- ── 4. THE ONE SLOT ACCEPTS ALL THREE SHAPES ─────────────────────────
--
-- db/010 gave `game` the single shape `scheduled`, which was right when four
-- other slots existed to take the ambient decks and the endings. It is wrong
-- now: with one game slot and no others, every ambient and every finale game
-- in the catalogue becomes unplaceable, and a ruling about how MANY games she
-- gets would have silently decided WHICH KINDS exist. That is a catalogue
-- shrinking nobody voted for (rule 16 — it would look like nothing happened).
--
-- So the one beat takes whatever a game is. The house offers her a deck that
-- runs all evening, a block that stops the table, or a thing that ends the
-- night, and she picks the one she wants. That is a better carousel than three
-- variations on charades.
--
-- `game_placement`'s slot_codes fallback (db/010) reads slot_shape, so this
-- insert is also what makes ambient and finale games eligible for the slot.

insert into slot_shape (slot_code, shape, note) values
  ('game', 'ambient',
   'The one game may be an undercurrent. db/061 collapsed ambient_game into '
   'this slot; without this row every ambient game became unplaceable.'),
  ('game', 'finale',
   'The one game may be the ending. Same argument. At most one exists per '
   'Revelle by construction now — there is only one game slot.')
on conflict (slot_code, shape) do nothing;


-- ── 4b. THE BEAT MOVED, SO THE CLAIMS MOVE WITH IT ───────────────────
--
-- RULE 33, AND THE MOST DANGEROUS THING IN THIS FILE. Widening `slot_shape`
-- is necessary and NOT SUFFICIENT, and believing otherwise is a two-line
-- reading of db/010 that would have shipped.
--
-- `game_placement`'s slot_codes column falls back to `slot_shape` only for a
-- game with NO `game_slot` rows — and every one of the twenty-seven authored
-- games has them. `slotEligibility` (src/lib/selection/occasion.ts) reads a
-- `native` claim as a whitelist. So the eleven games that claim only
-- `ambient_game` or only `finale` were, the moment section 1 ran, claiming
-- beats that no occasion has:
--
--   ambient   secret-game-cards, westhampton-the-houseguest-list,
--             nantucket-what-the-weather-will-do, portofino-the-boat-count,
--             dolomites-the-temperature-at-the-top, aspen-the-next-line
--   finale    the-secret-auction, new-york-the-list, acapulco-the-last-song,
--             amalfi-the-five-prizes, palm-springs-the-best-line
--
-- Eleven of twenty-seven. A ruling about HOW MANY games she gets would have
-- silently decided WHICH KINDS exist, four rooms would have lost their only
-- native game, and nothing would have gone red — the pool would just have
-- been smaller than the catalogue says, which is rule 12's failure shape
-- arriving through a different door.
--
-- THE CLAIM IS AUTHORED IN src/lib/games.ts AND THIS IS THE BACKFILL, in
-- db/053's exact order: backfill in the same migration, before the structure
-- depends on it. Both halves are needed and neither is redundant — the file
-- is the owner of the claim going forward (db/010: content in a migration can
-- only be corrected by another migration), and this repairs the rows already
-- in production, which the seeder would not reach until it next runs.
--
-- IT IS NOT AN AUTHORING JUDGEMENT AND MUST NOT GROW INTO ONE. It does not
-- decide that Portofino's boat count is a game; games.ts already said it was a
-- game and named the beat it fills. The beat moved, so the claim follows it.
-- Nothing here invents a claim for a game that had none, and nothing here
-- touches the claims on the five retired beats — those stay, as the record of
-- what kind of thing each game is (rule 14).

insert into game_slot (game_id, slot_code, fit, note)
select g.id, 'game', 'native',
       'db/061 collapsed the five game beats into one. Backfilled from this '
       'game''s existing claim on a beat no occasion has any more.'
  from game g
 where exists (select 1 from game_slot gs
                where gs.game_id = g.id and gs.fit = 'native')
   and not exists (select 1 from game_slot gs
                    where gs.game_id = g.id and gs.slot_code = 'game')
on conflict (game_id, slot_code) do nothing;

do $$
declare v_stranded integer;
begin
  -- CLAUDE.md rule 24, in both directions. A game whose every native claim
  -- names a beat no occasion has can never be placed, and it says nothing
  -- about it.
  select count(*) into v_stranded
    from game g
   where exists (select 1 from game_slot gs
                  where gs.game_id = g.id and gs.fit = 'native')
     and not exists (
       select 1 from game_slot gs
         join occasion_slot os on os.slot_code = gs.slot_code
        where gs.game_id = g.id and gs.fit = 'native' and os.pool = 'game');

  raise notice 'db/061 — % game(s) claim only beats no occasion has.', v_stranded;

  if v_stranded > 0 then
    raise exception
      'db/061 would strand % game(s): every slot they claim is a beat this '
      'file just removed, so they become unplaceable without going red.',
      v_stranded
      using hint = 'The backfill above should have given each of them the '
                   '`game` claim. If it did not, do not delete this check — '
                   'find out which games it missed.';
  end if;
end;
$$;

-- AND WHAT THAT CHECK CANNOT SEE, said plainly rather than discovered later
-- (rule 33 again, from the honest end). On a scratch build the `game` table is
-- EMPTY when this migration runs — migrate comes before the seeders — so the
-- backfill touches nothing and the stranding check passes vacuously. It is
-- green there because there is nothing to be wrong about, not because it
-- proved anything. The two paths still land in the same place, and this is why
-- both halves exist: scripts/seed-games.mjs writes the `game` claim from
-- src/lib/games.ts on a fresh database, and the backfill above repairs the
-- rows a production database already holds. Neither one covers both cases.
-- src/lib/games.test.ts asserts the authored half on every run.


-- db/010's `scheduled_game_max` IS NOW UNREACHABLE, and is kept rather than
-- deleted. Stated here so a later gates sweep reads it as a known consequence
-- and not a discovery: one slot cannot place more than one scheduled game, and
-- every occasion's cap is at least 1, so the cap refuses nothing. It stays
-- because it is the guard that becomes load-bearing again the moment a second
-- game beat is ever authored, and deleting it would delete db/010's argument
-- with it (rule 14). It is inert BY CONSTRUCTION, which is a different thing
-- from the inert-by-accident gates rule 15 hunts.


-- ── 5. WHERE THE OFFER AND THE CHOICE LIVE ───────────────────────────
--
-- On the join tables, added by a loop over the registry and to the installer,
-- exactly as db/009 added `slot_code`. Two columns on every pool rather than
-- two columns on `revelle_game`, for the reason section 3 gives about
-- offer_count: the mechanism is registered pool-agnostically on occasion_slot,
-- so the record of what it did has to be too. A game-only column would make an
-- offer over any other pool unrecordable while the plan happily produced one.
--
-- Nullable everywhere, and null is the meaningful value: a row with no
-- offer_group was PLACED — the house chose it, there was never an alternative,
-- and the portal asks her nothing about it. Every Revelle delivered before
-- today is in exactly that state and is left there (see rule 33 above).

do $$
declare p record;
begin
  for p in select * from ingredient_pool where join_table is not null loop
    execute format(
      'alter table %I
         add column offer_group text,
         add column chosen_at   timestamptz',
      p.join_table);

    execute format(
      'comment on column %I.offer_group is %L',
      p.join_table,
      'Which set of alternatives this row belongs to, or null when the house '
      'simply placed it. Rows sharing a (revelle_id, offer_group) are an OR: '
      'she receives all of them and one of them runs. See db/061.');

    execute format(
      'comment on column %I.chosen_at is %L',
      p.join_table,
      'When she took this one. Null means not taken. NOT part of the '
      'assemblage fingerprint, on purpose: the offer binds, the choice does '
      'not, so changing her mind can never be refused. See db/061.');

    -- AT MOST ONE CHOSEN PER OFFER. The whole mechanical content of "an or,
    -- not an and", and the only thing about a choice this schema enforces.
    -- Partial, so the two she has not taken are unconstrained and any number
    -- of rows may sit outside an offer entirely.
    execute format(
      'create unique index %I on %I (revelle_id, offer_group)
         where offer_group is not null and chosen_at is not null',
      p.join_table || '_one_choice', p.join_table);

    -- YOU CANNOT CHOOSE WHAT YOU WERE NOT OFFERED. A chosen_at on a row with
    -- no offer_group would be a decision about something that was never a
    -- decision, and it is the shape a well-meaning backfill takes.
    execute format(
      'alter table %I add constraint %I
         check (chosen_at is null or offer_group is not null)',
      p.join_table, p.join_table || '_chosen_was_offered');
  end loop;
end;
$$;

create or replace function install_revelle_ingredients(
  p_entity_table  text,
  p_label         text,
  p_label_column  text default 'name',
  p_active_column text default null,
  p_active_value  text default null,
  p_typical_draw  integer default 1
) returns void
language plpgsql as $$
declare
  v_join   text := 'revelle_' || p_entity_table;
  v_column text := p_entity_table || '_id';
begin
  execute format($ddl$
    create table %I (
      revelle_id  uuid not null references revelle(id) on delete cascade,
      -- restrict, not cascade: a pooled ingredient that has been issued to
      -- somebody cannot be deleted out from under her Revelle. Retire it.
      %I          uuid not null references %I(id) on delete restrict,
      -- Where it sits in her Revelle. Recorded, but NOT part of the assemblage
      -- fingerprint — see the judgement note in db/002.
      slot        section_kind,
      -- WHICH SLOT OF HER OCCASION it filled. Finer than `slot`, which is the
      -- block it renders into. Added by db/009.
      slot_code   text references slot_kind(code) on delete restrict,
      -- WHICH SET OF ALTERNATIVES, or null when the house simply placed it.
      -- Added by db/061.
      offer_group text,
      -- WHEN SHE TOOK THIS ONE. Null means not taken. Outside the fingerprint
      -- on purpose: the offer binds, the choice does not. Added by db/061.
      chosen_at   timestamptz,
      position    integer,
      note        text,
      created_at  timestamptz not null default now(),

      primary key (revelle_id, %I),
      constraint %I check (chosen_at is null or offer_group is not null)
    )$ddl$,
    v_join, v_column, p_entity_table, v_column,
    v_join || '_chosen_was_offered');

  execute format(
    'create index %I on %I (%I)', v_join || '_ingredient_idx', v_join, v_column);

  -- At most one chosen per offer. See db/061.
  execute format(
    'create unique index %I on %I (revelle_id, offer_group)
       where offer_group is not null and chosen_at is not null',
    v_join || '_one_choice', v_join);

  execute format(
    'create trigger %I after insert or update or delete on %I
       for each row execute function revelle_ingredient_changed()',
    v_join || '_fingerprint', v_join);

  insert into ingredient_pool
    (entity_table, join_table, label, label_column, active_column, active_value,
     typical_draw)
  values (p_entity_table, v_join, p_label, p_label_column, p_active_column,
          p_active_value, p_typical_draw);
end;
$$;

-- The proposal carries it across approval. db/018's argument for copying slot
-- facts onto the pick rather than joining them holds unchanged: this records
-- what the ENGINE decided, and occasion_slot may be edited before a curator
-- approves.
alter table revelle_proposal_pick
  add column offer_group text;

comment on column revelle_proposal_pick.offer_group is
  'Which set of alternatives this pick belongs to, or null when the slot '
  'offered one candidate. Copied to revelle_<pool>.offer_group at approval. '
  'See db/061.';


-- ── 6. THE LOAD VIEW COUNTS AN OFFER ONCE ────────────────────────────
--
-- db/010's `revelle_game_load` counts every row of `revelle_game`, which was
-- right when every row was a game that runs. Under an offer it is wrong in the
-- member-facing direction: three offered scheduled games would read as three
-- blocks and the view would report `overbooked` on a perfectly ordinary
-- evening. Rule 16 — the number would look fed and mean something else.
--
-- WHAT RUNS, stated once: for an offer, the row she chose; where she has not
-- chosen yet, one row of the offer standing in for the decision she will make;
-- for anything outside an offer, itself. `two_endings` gets the same treatment
-- and for a sharper reason — an evening cannot end twice, and three offered
-- finales are not three endings, they are one ending not yet picked.
--
-- The stand-in row is the lowest `position` in the offer, which is the first
-- card she sees. It is a count, not a claim about her taste.

create or replace view revelle_game_load as
with runs as (
  select distinct on (rg.revelle_id, coalesce(rg.offer_group, rg.game_id::text))
         rg.revelle_id,
         rg.game_id
    from revelle_game rg
   order by rg.revelle_id,
            coalesce(rg.offer_group, rg.game_id::text),
            -- Her choice first; then the top of the carousel.
            (rg.chosen_at is null),
            rg.position nulls last,
            rg.game_id
)
select r.id                                            as revelle_id,
       qr.occasion,
       os.days,
       os.scheduled_game_max,
       count(*) filter (where g.shape = 'scheduled')   as scheduled_games,
       count(*) filter (where g.shape = 'ambient')     as ambient_games,
       count(*) filter (where g.shape = 'finale')      as finale_games,
       coalesce(sum(coalesce(g.duration_max_minutes, g.duration_minutes))
                filter (where g.shape = 'scheduled'), 0)
                                                       as scheduled_minutes,
       (count(*) filter (where g.shape = 'scheduled') > os.scheduled_game_max)
                                                       as overbooked,
       (count(*) filter (where g.shape = 'finale') > 1) as two_endings
  from revelle r
  join quiz_response qr on qr.id = r.quiz_response_id
  join occasion_shape os on os.occasion = qr.occasion
  join runs on runs.revelle_id = r.id
  join game g on g.id = runs.game_id
 group by r.id, qr.occasion, os.days, os.scheduled_game_max;

comment on view revelle_game_load is
  'Is this Revelle''s evening physically runnable? Counts what RUNS: one row '
  'per offer (hers if she has chosen, else the first card), plus anything '
  'placed outside an offer. overbooked means more block-occupying games than '
  'the occasion has blocks. Ambient games never count toward it. See db/010, '
  'recounted by db/061.';


-- ── 7. THE HEADROOM ARITHMETIC, TOLD THE TRUTH ───────────────────────
--
-- db/009 registered the game pool with typical_draw 2, which was a fair
-- average of a catalogue where occasions drew between one and five. A Revelle
-- now draws three games — the offer, not the choice, because the offer is what
-- is issued and what assemblage_headroom() is counting is issued sets.
--
-- The number goes UP as the number of games she plays goes DOWN, which reads
-- backwards until you say what headroom measures: how many distinct
-- assemblages the catalogue can still produce. Offering three from a pool of
-- twenty-seven produces far more distinct trios than placing two games did,
-- and the collision risk db/002 worries about falls accordingly. That is a
-- real gain and it belongs in the number rather than in this comment alone.

update ingredient_pool set typical_draw = 3 where entity_table = 'game';


-- ─────────────────────────────────────────────────────────────────────
-- WHAT THIS DELIBERATELY DOES NOT DO
--
--   · NO VENUE REQUIREMENT ON GAMES, and no new gate of any kind. She was
--     asked and declined the scope: "just give her three". A game that needs
--     a garden is an authoring question with a founder's answer, and
--     `ingredient_requirement` already exists for the day she gives one.
--
--   · NO REPLACEMENT POOL for the five collapsed beats. Rule 32: the only
--     argument for pointing `honouring` at `bank_item`'s host acts is that it
--     would be consistent, and there is no row that says so. The gap is an
--     authoring absence, which is a finding.
--
--   · NO BACKFILL OF EXISTING REVELLES INTO AN OFFER. Named in the rule-33
--     section above. Their single game was placed, not chosen, and the schema
--     says so by leaving offer_group null.
--
--   · NO DELETION OF slot_kind ROWS, slot_shape ROWS FOR THE FIVE BEATS, OR
--     occasion_shape.scheduled_game_max. Every one of them is an argument
--     somebody made, and rule 14 keeps arguments.
-- ─────────────────────────────────────────────────────────────────────
