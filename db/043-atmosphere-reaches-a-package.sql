-- ── 043 · ATMOSPHERE REACHES A PACKAGE ───────────────────────────────
--
-- 174 published bank items and no path by which one of them reaches a
-- member. `src/lib/selection/` contained zero references to `bank_item`;
-- atmosphere was empty on every real package, silently, which is the exact
-- shape CLAUDE.md rule 19 calls the worst this product can produce.
--
-- The read side existed. The desk existed. The write side did not, and three
-- things blocked it. Two were design questions the founder has now ruled on;
-- the third was mechanical.
--
-- ─────────────────────────────────────────────────────────────────────
-- BLOCKER 1 (MECHANICAL) · db/031 CALLED ONE INSTALLER OUT OF FIVE
--
-- It ran `install_revelle_ingredients('bank_item', …)` and nothing else. So
-- `bank_item_facet`, `bank_item_occasion`, `bank_item_slot` and
-- `bank_item_world` did not exist, and `ingredient_pool` carried `bank_item`
-- as the ONLY row with `occasion_table`, `slot_table` and `world_table` all
-- null. `loadIngredients` composes a query from all four of those, so adding
-- `bank_item` to its POOLS list would have failed on the first query.
--
-- db/012 is the canonical five-call shape and `catalogue.ts` names it as the
-- precedent. This file makes the same five calls. Everything below the
-- backfill is a call, exactly as db/002 claimed and db/009 and db/012 tested.
--
-- ─────────────────────────────────────────────────────────────────────
-- BLOCKER 2 · FOUNDER RULING — THE DIRECT FK BECOMES A `_world` JOIN
--
-- `bank_item.world_id` was `uuid not null references world(id)`. Every other
-- pool relates to rooms through `<pool>_world` carrying `forbidden`, `native`
-- and `affinity` (db/009, db/019). The founder's argument, preserved verbatim
-- under CLAUDE.md rule 14 because it is the part that gets lost:
--
--   "The near-duplicates are the tell — six hand-authored lanterns is content
--    debt masquerading as data, and affinity is the dedup mechanism the rest
--    of the schema already uses for exactly this. Second, uniformity is not
--    incidental: the registry work exists to kill the 'this pool is special'
--    bug class, and a direct FK makes `bank_item` structurally special
--    forever — every generic pool consumer grows an if-branch for it. Third,
--    the direct FK encodes a claim ('this lantern belongs to Positano and
--    nowhere else') that the visible duplication proves the authors don't
--    believe. The only reason to keep the FK is if rooms are so aesthetically
--    distinct that sharing is a category error — and 18 rooms with converging
--    candlelight says they aren't."
--
-- WHAT THE OLD SHAPE WAS RIGHT ABOUT, kept rather than deleted: `not null`
-- meant no bank item could ever be homeless, and the new shape does not
-- enforce that. It cannot — `<pool>_world` has no such constraint for any
-- pool and inventing one here would rebuild the specialness this ruling
-- removes. The protection moves instead to where every other pool keeps it:
-- an item with no `native` row is not broken, it is GENERAL, and general
-- atmosphere pools everywhere. That is a widening, not a hole.
--
-- The migration below moves every existing `world_id` in as `native = true`,
-- asserts the counts match row for row, and raises if they do not. Nothing is
-- dropped until after the assertion.
--
-- ─────────────────────────────────────────────────────────────────────
-- BLOCKER 3 · FOUNDER RULING — NAMED SLOTS, NOT ONE GENERIC ATMOSPHERE SLOT
--
--   "The gap reporter is per-slot. One generic atmosphere slot drawing a few
--    means a gap can only ever say 'no atmosphere at all,' which with 174
--    active rows will never fire — re-installing the exact failure mode this
--    thread started with, a coverage check that cannot see the coverage that
--    matters. Named slots make 'Positano has table settings but nothing to
--    take home' a reportable fact. That is what pooling atmosphere is for."
--
-- Four codes, and the fourth is a spill bucket on purpose:
--
--   the_table_set   the table, dressed
--   the_light       what the room is lit by
--   the_take_home   the thing they take home
--   the_atmosphere  general — everything else, and it still pools
--
-- TWO CONSTRAINTS THE FOUNDER PUT ON THIS FILE, so it does not overreach:
--
--   1. THREE KINDS PLUS GENERAL, NOT A TAXONOMY. The general bucket is
--      load-bearing: classifying 180 rows must not be a blocking chore.
--      Anything ambiguous lands in general and still pools, and
--      reclassification is an UPDATE, not a migration. Do NOT add a fifth
--      kind because the content seems to want one.
--
--   2. REQUIREDNESS LIVES ON `occasion_slot`, NOT ON `slot_kind`. Whether a
--      package must include a take-home is per-occasion curation, exactly as
--      courses are (db/022). The kinds only make it expressible.
--
-- ─────────────────────────────────────────────────────────────────────
-- CONTENTS
--
--   the four installs      facet tags, occasion, slot, world
--   the backfill           world_id -> bank_item_world.native, asserted
--   the four slot kinds    and the occasions that carry them
--   the classifier         ONE rule, in SQL, called by nobody twice
--   the default claim      a trigger, on INSERT only
--   bank_item_card         the reading view the desk moves onto
-- ─────────────────────────────────────────────────────────────────────

-- ── the four installs ────────────────────────────────────────────────
--
-- db/031 already ran install_revelle_ingredients, so `ingredient_pool` has a
-- `bank_item` row and the four calls below update it rather than create it.
-- Each rebuild follows its install for db/012's reason: the union views are
-- regenerated by a function so that a new pool is a call and not an edit to a
-- view definition somebody forgets.

select install_facet_tags('bank_item', 'Atmosphere');
select rebuild_facet_tag_view();

select install_occasion_eligibility('bank_item');
select rebuild_ingredient_occasion_view();

select install_slot_eligibility('bank_item');
select rebuild_ingredient_slot_view();

select install_world_affinity('bank_item');
select rebuild_ingredient_world_view();

-- `bank_item_facet` is created EMPTY and stays empty in this file. That is not
-- an unfed instrument under rule 15: an absent tag is not a default-only
-- grade, it is no claim, and an untagged ingredient simply scores zero on the
-- facet term instead of scoring a number nobody supplied. Tagging atmosphere
-- is curator work at the desk and is deliberately not guessed here.

-- ── the backfill · every world_id survives as a native claim ──────────
--
-- Ordered so that nothing is destroyed before the count is proved. If a single
-- row failed to move, this raises and the whole migration rolls back with the
-- column still on the table (scripts/migrate.mjs runs each file in one
-- transaction with its ledger row).

insert into bank_item_world (bank_item_id, world_id, forbidden, native, affinity, note)
select b.id, b.world_id, false, true, 0.000,
       'Migrated from bank_item.world_id by db/043. The direct FK said this '
       'item belongs to this room and nowhere else; native says the same '
       'thing in the vocabulary every other pool already uses.'
  from bank_item b;

do $$
declare
  v_items bigint;
  v_moved bigint;
  v_orphan bigint;
begin
  select count(*) into v_items from bank_item;

  select count(*) into v_moved
    from bank_item_world
   where native and note like 'Migrated from bank_item.world_id by db/043.%';

  if v_moved <> v_items then
    raise exception
      '[043] the FK migration lost rows: % bank_item rows, % native claims '
      'written. Not one row may be dropped on the way into the join table — '
      'this is the whole safety of replacing a not-null FK.',
      v_items, v_moved;
  end if;

  -- The stronger form of the same question, asked the other way: is there any
  -- item whose OWN world_id is not among its native rows? A count can match
  -- while two rows are swapped, and a swapped destination is a lantern in the
  -- wrong room with nothing anywhere saying so.
  select count(*) into v_orphan
    from bank_item b
   where not exists (
     select 1 from bank_item_world bw
      where bw.bank_item_id = b.id
        and bw.world_id = b.world_id
        and bw.native
   );

  if v_orphan <> 0 then
    raise exception
      '[043] % bank_item rows have a world_id that did not arrive as their '
      'own native claim. The counts can agree while the pairings do not.',
      v_orphan;
  end if;

  raise notice '[043] % bank_item world_id values migrated to native claims.',
    v_moved;
end;
$$;

-- Proved. Now the column may go.
--
-- db/033 dropped `bank_item.venue` the same way and for the same reason — one
-- vocabulary instead of a per-pool column — so this is the second time this
-- table has shed a special case, not the first.

drop index if exists bank_item_world_idx;
alter table bank_item drop column world_id;

-- What the dropped index was for, minus the column it can no longer name. The
-- destination half of that lookup now lives on `bank_item_world_world_idx`,
-- which install_world_affinity created.
create index bank_item_kind_status_idx on bank_item (kind, status);

comment on table bank_item_world is
  'Which destinations an atmosphere item is written for. `native` is the '
  'CLAIM and replaces db/031''s direct bank_item.world_id (db/043); '
  '`affinity` is how one lantern serves several rooms instead of six '
  'hand-authored lanterns doing it.';

-- ── the four slot kinds ──────────────────────────────────────────────
--
-- Positions: 30 is `table_object` (db/009), 31-33 the courses (db/022), 35 the
-- menu (db/012), 37 the drinks (db/017), 40 the moment, 50 the honouring, 60
-- the day, 70 the fun, 75 the undercurrent, 80 the soundtrack, 85 the finale.
-- The three `details` codes take 62/64/66, a contiguous block after the day
-- and before the fun; the take-home takes 87, after the finale, because that
-- is when it is handed over.
--
-- `the_table_set` is NOT `table_object` and the labels say so. db/009's
-- `table_object` is "the object the table is built around. One thing, not a
-- scheme" and it draws from `product`. occasion_slot is keyed (occasion,
-- slot_code), so one slot has exactly one pool: reusing that code would have
-- meant atmosphere DISPLACING the product at the centre of the table rather
-- than dressing it. Two codes because they are two questions.
--
-- `excluded_by` is null on all four, deliberately, and this is rule 15 read
-- forward rather than an omission. db/014's exclusions are fed by a quiz
-- answer (`no_food`, `no_games`); no answer in the questionnaire says "no
-- candles" or "no favours", so wiring one of these to an exclusion would
-- create a control nothing supplies. When such an answer exists it arrives
-- with its `update slot_kind set excluded_by = …` in its own migration.

insert into slot_kind (code, label, description, section, per_guest, position) values
  ('the_table_set', 'The table, dressed',
   'What the table is dressed with — linen, glass, cards at each place, what '
   'is set down and not eaten. Distinct from `table_object`, which is the one '
   'object the table is built around and comes from the product pool.',
   'details', false, 62),

  ('the_light', 'The light',
   'What the room is lit by, and the act of lighting it. Its own slot because '
   'every one of the eighteen rooms answers "on what" — chrome and glass at '
   'New York, clay at Oaxaca, lanterns at the Dolomites — and a room that '
   'answers it with nothing is a fact worth reporting.',
   'details', false, 64),

  ('the_atmosphere', 'The atmosphere',
   'Everything else the bank holds: host acts, opt-in crafts, the games that '
   'ship with their own content, the printed cards that ride with an act. The '
   'GENERAL bucket, and it is load-bearing — an item nobody has classified '
   'still pools, and reclassifying it is an update rather than a migration.',
   'details', false, 66),

  ('the_take_home', 'The thing they take home',
   'The one thing that leaves with a guest. Matchbooks, the lei, the card '
   'somebody keeps. Named rather than folded into the general bucket because '
   'the gap reporter is per-slot: "this room has a dressed table and nothing '
   'to take home" is only sayable if the take-home has a name.',
   'ending', false, 87);

-- ── which occasions carry them ───────────────────────────────────────
--
-- The judgement, stated so it can be argued with, and it is per-occasion
-- curation exactly as the founder ruled.
--
-- THE TABLE, DRESSED is required on the five occasions that ARE one evening
-- around a table, for db/012's reason applied one layer out: an evening whose
-- table is undressed is not a weaker Revelle, it is an unfinished one. It is
-- optional and per-day on the occasions that run longer, where some of those
-- days are spent out of the house.
--
-- THE LIGHT, THE ATMOSPHERE and THE TAKE-HOME are required NOWHERE, on
-- purpose. A garden lunch needs no candles; a dinner for four needs no
-- favours. But optional is not silent: fill.ts records a catalogue gap for any
-- slot the pool could not fill whether or not it was required, and only
-- `required` gaps additionally mark the Revelle low-confidence. So an empty
-- take-home reaches the desk as a work order and does not degrade a package
-- that never wanted one — which is the precise behaviour ruling 2 asks for.
--
-- max_count 2 on the general bucket and 1 elsewhere: the bank document says
-- "~2-3 acts per package" and `ingredient_pool.typical_draw` for this pool is
-- 2 (db/031). Three named slots at one each plus a general at up to two lands
-- in that band without any slot being able to flood a package on its own.

insert into occasion_slot
  (occasion, slot_code, pool, min_count, max_count, required, per_day, position, note)
values
  -- the table, dressed
  ('dinner_party',  'the_table_set', 'bank_item', 1, 1, true,  false, 62,
   'The long dinner is a table. An undressed one is unfinished, not thin.'),
  ('birthday',      'the_table_set', 'bank_item', 1, 1, true,  false, 62, ''),
  ('anniversary',   'the_table_set', 'bank_item', 1, 1, true,  false, 62, ''),
  ('holiday',       'the_table_set', 'bank_item', 1, 1, true,  false, 62, ''),
  ('no_reason',     'the_table_set', 'bank_item', 1, 1, true,  false, 62, ''),
  ('other',         'the_table_set', 'bank_item', 1, 1, false, false, 62,
   'Shape unknown until a human reads her words; offered, not insisted on.'),
  ('girls_weekend', 'the_table_set', 'bank_item', 1, 1, false, true,  62, ''),
  ('getaway',       'the_table_set', 'bank_item', 1, 1, false, true,  62, ''),
  ('bridal',        'the_table_set', 'bank_item', 1, 1, false, true,  62, ''),

  -- the light
  ('dinner_party',  'the_light', 'bank_item', 1, 1, false, false, 64, ''),
  ('birthday',      'the_light', 'bank_item', 1, 1, false, false, 64, ''),
  ('anniversary',   'the_light', 'bank_item', 1, 1, false, false, 64, ''),
  ('holiday',       'the_light', 'bank_item', 1, 1, false, false, 64, ''),
  ('no_reason',     'the_light', 'bank_item', 1, 1, false, false, 64, ''),
  ('other',         'the_light', 'bank_item', 1, 1, false, false, 64, ''),
  ('girls_weekend', 'the_light', 'bank_item', 1, 1, false, false, 64, ''),
  ('getaway',       'the_light', 'bank_item', 1, 1, false, false, 64, ''),
  ('bridal',        'the_light', 'bank_item', 1, 1, false, false, 64, ''),

  -- the atmosphere — the general bucket, and the one that draws two
  ('dinner_party',  'the_atmosphere', 'bank_item', 1, 2, false, false, 66, ''),
  ('birthday',      'the_atmosphere', 'bank_item', 1, 2, false, false, 66, ''),
  ('anniversary',   'the_atmosphere', 'bank_item', 1, 2, false, false, 66, ''),
  ('holiday',       'the_atmosphere', 'bank_item', 1, 2, false, false, 66, ''),
  ('no_reason',     'the_atmosphere', 'bank_item', 1, 2, false, false, 66, ''),
  ('other',         'the_atmosphere', 'bank_item', 1, 2, false, false, 66, ''),
  ('girls_weekend', 'the_atmosphere', 'bank_item', 1, 2, false, true,  66, ''),
  ('getaway',       'the_atmosphere', 'bank_item', 1, 2, false, true,  66, ''),
  ('bridal',        'the_atmosphere', 'bank_item', 1, 2, false, true,  66, ''),

  -- the thing they take home
  ('dinner_party',  'the_take_home', 'bank_item', 1, 1, false, false, 87, ''),
  ('birthday',      'the_take_home', 'bank_item', 1, 1, false, false, 87, ''),
  ('anniversary',   'the_take_home', 'bank_item', 1, 1, false, false, 87, ''),
  ('holiday',       'the_take_home', 'bank_item', 1, 1, false, false, 87, ''),
  ('no_reason',     'the_take_home', 'bank_item', 1, 1, false, false, 87, ''),
  ('other',         'the_take_home', 'bank_item', 1, 1, false, false, 87, ''),
  ('girls_weekend', 'the_take_home', 'bank_item', 1, 1, false, false, 87, ''),
  ('getaway',       'the_take_home', 'bank_item', 1, 1, false, false, 87, ''),
  ('bridal',        'the_take_home', 'bank_item', 1, 1, false, false, 87, '');

-- ── the classifier · ONE RULE, AND IT LIVES HERE ─────────────────────
--
-- WHERE THE KIND IS ASSIGNED, AND WHY IT IS ASSIGNED HERE.
--
-- The obvious options were: in scripts/seed-bank.mjs from the source
-- document's own GOODS/HOST ACTS/GAMES headers; in this migration over the
-- 180 rows already in the table; or in both. The brief allowed any of the
-- three and warned about the failure mode of the third — "the seeder and the
-- migration must agree, or the next sync silently undoes the migration", which
-- a prior agent hit with db/040.
--
-- BOTH IS RIGHT AND TWO IMPLEMENTATIONS IS WRONG, so this is one
-- implementation with two callers. The rule is a SQL function; the migration
-- backfills through it and a trigger applies it to every row inserted after
-- today. seed-bank.mjs therefore contains NO classification code at all — it
-- inserts a bank_item exactly as it did before and the claim appears. There is
-- nothing for the two to disagree about, which is a stronger guarantee than
-- running both and diffing the output, because a diff proves today and a
-- shared function proves every day.
--
-- The document's headers were the losing candidate and deserve their sentence:
-- GOODS/HOST ACTS/GAMES describe WHO PERFORMS a thing, which is `bank_kind`
-- and is already a column. The slot asks WHERE IT LANDS IN THE EVENING. Both
-- lanterns and the lighting of them are the light; the header separates them
-- and the slot must not.
--
-- PRECEDENCE — take-home, then light, then table, then general. A thing is
-- classified by its destiny before its surface: a matchbook sits on the table
-- all night and is still the thing they take home, and a candle on that same
-- table is the light rather than the linen.
--
-- HOST ACTS AND GAMES CAN ONLY BE LIGHT OR GENERAL. The table and the take-home
-- are OBJECTS — something set down, something carried out — and an act is
-- neither. Lighting is the exception because the act and the object are the
-- same beat: "the lanterns are lit" is the room's light however it is filed.
--
-- The vocabularies are short and literal on purpose. `table` is NOT among the
-- table phrases: it appears in half the host acts in the document ("the table
-- is pushed back for the dancing") and would have swept them all into a slot
-- they do not belong in. A phrase that is not here yields `the_atmosphere`,
-- the item still pools, and a curator moves it with one UPDATE.

create or replace function bank_item_default_slot(
  p_kind        bank_kind,
  p_name        text,
  p_description text
) returns text
language plpgsql immutable as $$
declare
  v_text text := lower(coalesce(p_name, '') || ' ' || coalesce(p_description, ''));
  v_phrase text;
begin
  -- 1 · THE THING THEY TAKE HOME. Destiny beats surface.
  foreach v_phrase in array array[
    'take home', 'takes home', 'taken home', 'to take home', 'go home',
    'goes home', 'send home', 'sent home', 'favor', 'favour', 'keepsake',
    'matchbook', 'lives on her shelf after', 'parting gift'
  ] loop
    if position(v_phrase in v_text) > 0 then return 'the_take_home'; end if;
  end loop;

  -- 2 · THE LIGHT. The one category an act may also be.
  foreach v_phrase in array array[
    'candle', 'candlelight', 'candlelit', 'votive', 'hurricane', 'taper',
    'lantern', 'lamp', 'sparkler', 'torch', 'luminaria', 'oil light',
    'firelight', 'fireplace', 'bonfire', 'flame', 'lit by'
  ] loop
    if position(v_phrase in v_text) > 0 then return 'the_light'; end if;
  end loop;

  -- 3 · THE TABLE, DRESSED. Objects only — see the note above on why an act
  -- cannot reach this branch.
  if p_kind in ('good', 'printed_card') then
    foreach v_phrase in array array[
      'place card', 'menu card', 'place setting', 'table setting',
      'at each place', 'at places', 'napkin', 'linen', 'tablecloth',
      'runner', 'trivet', 'centrepiece', 'centerpiece', 'floral', 'flowers',
      'stemware', 'glassware', 'tumbler', 'coupe', 'decanter', 'charger',
      'platter', 'plate', 'bowl', 'seat pad', 'throw over', 'chargers'
    ] loop
      if position(v_phrase in v_text) > 0 then return 'the_table_set'; end if;
    end loop;
  end if;

  -- 4 · GENERAL, and it still pools.
  return 'the_atmosphere';
end;
$$;

comment on function bank_item_default_slot(bank_kind, text, text) is
  'The ONE rule that says which named atmosphere slot a bank item lands in. '
  'Called by db/043''s backfill and by the bank_item_slot_default trigger, so '
  'the migration and every later insert cannot disagree. Ambiguous rows get '
  'the_atmosphere and still pool; reclassifying is an update to '
  'bank_item_slot, never a migration. See db/043.';

-- ── the backfill of claims ───────────────────────────────────────────
--
-- One `native` claim per row. `claimEligibility` (src/lib/selection/occasion.ts)
-- reads a native claim as a WHITELIST: an item with any native slot row is
-- eligible only for the slots it claims. That is what makes the four buckets a
-- real partition rather than four names over one undivided pool — and it is
-- what lets "this room has nothing to take home" be true.

insert into bank_item_slot (bank_item_id, slot_code, fit, note)
select b.id,
       bank_item_default_slot(b.kind, b.name, b.description),
       'native',
       'Classified by db/043 through bank_item_default_slot().'
  from bank_item b
on conflict (bank_item_id, slot_code) do nothing;

do $$
declare
  v_items bigint;
  v_claimed bigint;
begin
  select count(*) into v_items from bank_item;
  select count(distinct bank_item_id) into v_claimed from bank_item_slot;

  if v_claimed <> v_items then
    raise exception
      '[043] % bank_item rows, % of them with a slot claim. Every row gets '
      'one — the general bucket exists precisely so that none can be left '
      'out.', v_items, v_claimed;
  end if;
end;
$$;

-- ── the default claim, for every row written after today ─────────────
--
-- AFTER INSERT ONLY, and the "only" is the whole design. db/012's
-- menu_project_facets is a one-way projection that overwrites on every update,
-- because a menu's season is DERIVED and a curator edits the column. A slot
-- claim is the opposite: the founder ruled that reclassification is an UPDATE,
-- so a trigger that re-ran on update would undo the curator's move on her next
-- edit to the row's description. Same discipline the seeder already keeps with
-- `gesture = coalesce(gesture, …)` and with technique-card attachments: the
-- file proposes once, the desk owns it after.

create or replace function bank_item_claim_default_slot() returns trigger
language plpgsql as $$
begin
  insert into bank_item_slot (bank_item_id, slot_code, fit, note)
  values (new.id,
          bank_item_default_slot(new.kind, new.name, new.description),
          'native',
          'Default claim from bank_item_default_slot() — db/043. Move it with '
          'an update; nothing writes this row again.')
  on conflict (bank_item_id, slot_code) do nothing;
  return null;
end;
$$;

create trigger bank_item_slot_default after insert on bank_item
  for each row execute function bank_item_claim_default_slot();

-- ── the reading view ─────────────────────────────────────────────────
--
-- The sibling of `menu_card` (db/012) and it exists for a reason this file
-- created: the desk read `bank_item b join world w on w.id = b.world_id`, and
-- that column is gone. `dish_card` already publishes `world_slugs` as an array
-- and `dishList` already filters with `$? = any(d.world_slugs)`, so the desk
-- moves onto the shape it uses for the pool most like this one instead of
-- growing a bank-shaped special case — which is the same specialness ruling 1
-- removed one layer down.
--
-- `home_name` is the ordering key: the alphabetically first destination this
-- item claims, or null where it claims none. A stable sort, which is what
-- CLAUDE.md rule 18 requires of any list a review pass walks.

create view bank_item_card as
select b.id,
       b.slug,
       b.name,
       b.description,
       b.kind,
       b.phase,
       b.min_lead_days,
       b.ships,
       b.technique_card_id,
       b.weight,
       b.status,
       b.source_citation,
       b.created_at,
       b.updated_at,
       coalesce(w.slugs, '{}') as world_slugs,
       coalesce(w.names, '{}') as world_names,
       w.home_name,
       w.home_id,
       coalesce(s.slot_code, 'the_atmosphere') as slot_code
  from bank_item b
  left join lateral (
    select array_agg(wd.slug::text order by wd.name) as slugs,
           array_agg(wd.name order by wd.name)       as names,
           min(wd.name)                              as home_name,
           (array_agg(wd.id order by wd.name))[1]    as home_id
      from bank_item_world bw
      join world wd on wd.id = bw.world_id
     where bw.bank_item_id = b.id and bw.native
  ) w on true
  left join lateral (
    select bs.slot_code
      from bank_item_slot bs
     where bs.bank_item_id = b.id and bs.fit = 'native'
     order by bs.slot_code
     limit 1
  ) s on true;

comment on view bank_item_card is
  'An atmosphere item with the destinations it claims and the slot it lands '
  'in. Replaces the desk''s join through bank_item.world_id, which db/043 '
  'dropped. world_slugs is an array because an item may now be native to more '
  'than one room — that is the point of db/043''s first ruling.';

comment on table bank_item is
  'Pool-selected atmosphere: goods, host acts, games and printed cards. One '
  'table because the four kinds have identical mechanics and differ only in '
  'what a curator calls them. Its destinations live in bank_item_world '
  '(db/043) and its slot in bank_item_slot; gestures are NOT here — they are '
  'invariant and live on world.gesture.';

-- ─────────────────────────────────────────────────────────────────────
-- WHAT THIS DELIBERATELY DOES NOT DO
--
--   · NO FIFTH SLOT KIND. The founder named three plus a spill bucket and
--     said the bucket is load-bearing. The content will look like it wants
--     "the sound", "the scent", "the doorway"; each of those is a migration
--     somebody argues for on its own, against this line.
--   · NO REQUIREDNESS ON slot_kind. It is per-occasion curation and lives in
--     occasion_slot above, where a curator can change it with an update.
--   · NO FACET TAGS. bank_item_facet is installed and empty. Tagging 180 rows
--     by machine would be the retro-tagging CLAUDE.md rule 3 exists to escape.
--   · NO CONTENT. Every bank item is content and lives in
--     docs/atmosphere-idea-bank-v1.md, moved in by scripts/seed-bank.mjs —
--     content in a migration can only be corrected by another migration.
--   · NO UNIQUENESS ON native. One native row per item is what today's data
--     has and what the desk form writes; the schema permits more, because
--     "one lantern serves Positano and Amalfi" is the outcome ruling 1 is for.
-- ─────────────────────────────────────────────────────────────────────
