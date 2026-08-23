-- ── 033 · ONE VENUE VOCABULARY, AND DAWN ─────────────────────────────
--
-- Four gaps found by trying to use the schema, and they share a shape: every
-- one is THE VENUE SYSTEM ALMOST-BUT-NOT-QUITE REACHING A CONTENT TYPE. They
-- are fixed together because fixing them apart is what produced two vocabularies
-- in the first place.
--
-- The sweep for the next one, asked while this was open: `drink` and `tracklist`
-- are already in the CHECK. `dish` and `bank_item` were the only pools missing.
-- After this, every registered pool can carry a venue requirement and none
-- carries it twice.

-- ── 1 · DAWN ─────────────────────────────────────────────────────────
--
-- DAWN IS NOT DARK. Havana's first-light register is the windows going blue,
-- which is the opposite of deep night, and St. Moritz's breakfast is the same
-- hour. `dark` was the nearest available value and it was false, so both were
-- left at `all` — a content type refusing to lie, which is the right failure
-- and still a loss.

alter type bank_phase add value if not exists 'dawn' after 'dark';

-- ── 2 · outdoor_access JOINS THE REAL VOCABULARY ─────────────────────
--
-- It was invented as a `bank_venue` value three hours ago because
-- structural_requirement had no soft grade. That created a second vocabulary
-- saying the same things in different words, which is why venueEligibility()
-- could read a menu's venue and not a bank item's.
--
-- A GRADE, not a sibling: requires_outdoors needs real outdoor hosting;
-- outdoor_access is satisfied by a terrace, a stoop, a yard — the lesser tier.
-- Anything that clears the full flag clears this one.

insert into structural_requirement (code, label, demand, description, position)
values ('outdoor_access', 'Needs a door to somewhere', 'needs a door to somewhere',
        'A lesser grade of requires_outdoors: a terrace, a stoop, a balcony, a '
        'yard. Anything that satisfies requires_outdoors satisfies this, and most '
        'apartments do besides. Use requires_outdoors only when the thing '
        'genuinely cannot happen inside.', 15)
on conflict (code) do nothing;

-- ── 3 · dish AND bank_item MAY CARRY ONE ─────────────────────────────
--
-- Big Sur's s'mores is the proof case for dish and will not be the last: any
-- fire-dependent or outdoor-dependent dish needs the tag the venue filter
-- already respects. bank_item needs it because that is what "one vocabulary"
-- means — the alternative is the column added in db/031, which is the bridge.

alter table ingredient_requirement
  drop constraint ingredient_requirement_known_pool;
alter table ingredient_requirement
  add constraint ingredient_requirement_known_pool
  check (entity_table in
    ('product', 'game', 'tracklist', 'menu', 'drink', 'dish', 'bank_item'));

-- The two bank rows that carried a venue move to the real vocabulary before the
-- column that held them goes.
insert into ingredient_requirement (entity_table, entity_id, requirement, note)
select 'bank_item', id, b.venue::text,
       'moved from bank_item.venue by db/033'
  from bank_item b
 where b.venue <> 'none'
on conflict do nothing;

alter table bank_item drop column venue;
drop type if exists bank_venue;

-- ── 4 · A DESTINATION MAY PRESUPPOSE A ROOM ──────────────────────────
--
-- Homeless through three separate reports. Tahiti and Palm Springs have carried
-- `requires_outdoors` in a MARKDOWN HEADING since the idea bank was written,
-- which is not data and cannot be read by anything.
--
-- THIS IS NOT VENUE TOUCHING THE DESTINATION CHOICE. That thesis stands and is
-- enforced in three places: `environment` has zero weight in stage 2, db/020
-- refuses an environment facet on a world, and selection.test.ts fails with the
-- thesis in the message. Havana in a Brooklyn apartment is still the pitch.
--
-- What this is: a destination declaring what its DELIVERABLE PRESUPPOSES, read
-- at the reveal's eligibility pass and surfaced, never scored. A room whose
-- whole content prunes away in an apartment ships hollow and nobody is told —
-- that is the failure this closes, and it is a different failure from ranking.

alter table world
  add column venue_requirement text
    references structural_requirement(code) on delete restrict;

comment on column world.venue_requirement is
  'What this destination''s deliverable PRESUPPOSES — read at the reveal and '
  'surfaced, NEVER scored. Venue must never touch the destination choice '
  '(vector.ts, db/020, selection.test.ts); this is the separate question of '
  'whether the room can be delivered at all in the space she has.';

update world set venue_requirement = 'requires_outdoors'
 where slug in ('tahiti', 'palm-springs-1965');

do $$
declare v_bank int; v_world int;
begin
  select count(*) into v_bank from ingredient_requirement where entity_table = 'bank_item';
  select count(*) into v_world from world where venue_requirement is not null;
  raise notice '[033] % bank requirement(s) moved, % destination(s) declaring one', v_bank, v_world;
end $$;
