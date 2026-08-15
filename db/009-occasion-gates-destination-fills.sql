-- ─────────────────────────────────────────────────────────────────────
-- OCCASION GATES; DESTINATION FILLS
--
-- The second collection key, decided after docs/selection-spec.md was written
-- and load-bearing for the same reason the first one is.
--
-- The spec's stage 2 makes the DESTINATION the collection key: choose it first,
-- and every later pool is already scoped to it. That is what makes coherence
-- free. But a destination alone cannot say WHAT PARTS a Revelle has. A dinner
-- party has no arrival day. A birthday has a beat where the person is marked,
-- and a getaway has nothing of the kind. A weekend has material for each day
-- and one evening does not.
--
--   THE OCCASION DECIDES WHICH SLOTS EXIST.
--   THE DESTINATION FILLS THEM, IN ITS OWN REGISTER.
--
-- Both halves matter. If the occasion also decided the register, WESTHAMPTON,
-- 1976 would be a birthday destination or a weekend destination and never both,
-- and the catalogue would stop compounding: every new occasion would need its
-- own destinations rather than reusing the ones already authored. Fifty
-- destinations across four occasions is two hundred Revelles' worth of library
-- only if the two axes are genuinely independent.
--
-- ── WHAT THIS FILE ADDS ─────────────────────────────────────────────
--
--   occasion_shape      how long an occasion runs. One row per occasion_type
--   slot_kind           the vocabulary of slots, as DATA
--   occasion_slot       which slots an occasion has, how many, and from which
--                       pool. THE GATE
--   <entity>_occasion   which occasions an ingredient is eligible for
--   <entity>_world      how an ingredient behaves UNDER a destination:
--                       forbidden, or re-weighted. Stage 3 of the spec
--   game                the third ingredient pool — games and rituals
--   revelle_<pool>.slot_code   which slot an issued ingredient filled
--
-- Nothing here scores anything. Every table below is either a FILTER or a
-- WEIGHT that the selection engine reads; the engine lives in
-- src/lib/selection/ and the arithmetic is deliberately not in SQL, so that it
-- is testable without a database. See the note on the eligibility rule below —
-- it is stated in exactly one place and this is not that place.
-- ─────────────────────────────────────────────────────────────────────

-- ── occasion_shape ───────────────────────────────────────────────────
--
-- HOW MANY DAYS. The one number that makes "per-day material" mean anything.
--
-- A table rather than a case expression in code because it is a product
-- decision that a girls' weekend is three days and a bridal is two, and a
-- product decision that lives in a `switch` is a product decision nobody can
-- find. Every occasion_type has a row: an occasion with no shape would silently
-- produce a Revelle with no slots at all.

create table occasion_shape (
  occasion    occasion_type primary key,
  -- What the house calls it internally. Not customer-facing copy.
  label       text not null,
  -- Nights plus one, near enough: the number of days that carry material.
  -- 1 for anything that is one evening.
  days        integer not null default 1 check (days between 1 and 14),
  -- Read by the curator's tool and by the explanation, so that "this occasion
  -- has no arrival day" is a sentence and not an inference from a missing row.
  note        text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger occasion_shape_touch before update on occasion_shape
  for each row execute function set_updated_at();

insert into occasion_shape (occasion, days, label, note) values
  ('birthday',      1, 'The birthday',
   'One evening, and one beat where the person is marked.'),
  ('girls_weekend', 3, 'The weekend away',
   'Three days. Arrival is its own event and each day carries material.'),
  ('dinner_party',  1, 'The long dinner',
   'One table, one evening. No arrival day, no per-day material.'),
  ('getaway',       3, 'The getaway',
   'Three days, deliberately unscheduled. Material per day, nothing honoured.'),
  ('anniversary',   1, 'The anniversary',
   'One evening, honoured. Quieter than a birthday and marked all the same.'),
  ('holiday',       1, 'The holiday',
   'One evening the calendar chose.'),
  ('bridal',        2, 'Something bridal',
   'Two days, and the person is unmistakably the subject.'),
  ('no_reason',     1, 'No reason at all',
   'One evening, nothing to mark. The purest case.'),
  ('other',         1, 'Something else',
   'Shape unknown until a human reads her words. Defaults to one evening, and '
   'the engine says so rather than pretending it knew.');

-- ── slot_kind ────────────────────────────────────────────────────────
--
-- THE VOCABULARY OF SLOTS, AS DATA — the same argument facet_dimension makes in
-- db/002. "Add an honouring beat" must be an insert, not a migration and a
-- deploy, because the list of parts a Revelle can have is not finished and will
-- never be finished.
--
-- `section` ties a slot to the block it renders into (section_kind, db/001), so
-- a new slot arrives already knowing where it appears. Several slots can share
-- a section: the arrival drink and the thing waiting in her room are both part
-- of THE ARRIVAL and are chosen separately.
--
-- `per_guest` is a QUANTITY rule, not a score. Anything true here is counted
-- from the guest band's HIGH — see docs/selection-spec.md: a place card too few
-- is a person without a seat, and the cost of one spare is nothing.

create table slot_kind (
  code        text primary key check (code ~ '^[a-z][a-z0-9_]*$'),
  label       text not null,
  description text not null default '',
  -- Which block of her Revelle this lands in.
  section     section_kind not null,
  -- Counted once per head. Multiplies cost and multiplies the print run.
  per_guest   boolean not null default false,
  position    integer not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint slot_kind_position_unique unique (position)
    deferrable initially deferred
);

create trigger slot_kind_touch before update on slot_kind
  for each row execute function set_updated_at();

insert into slot_kind (code, label, description, section, per_guest, position) values
  ('arrival_welcome', 'The welcome',
   'What is waiting when she walks in, on the first day of something that has '
   'more than one. An evening does not have this.',
   'arrival', false, 10),
  ('arrival_drink', 'The first drink',
   'What is in their hand before anyone has said hello properly.',
   'arrival', false, 20),
  ('table_object', 'The table',
   'The object the table is built around. One thing, not a scheme.',
   'details', false, 30),
  ('the_moment', 'The moment',
   'The thing they retell. Staged, never announced.',
   'moment', false, 40),
  ('honouring', 'The honouring',
   'How the person is marked. Birthdays, anniversaries and anything bridal '
   'have this beat; a getaway does not, and giving it one is how a weekend '
   'starts to feel like a kids'' party.',
   'moment', false, 50),
  ('day_material', 'The day',
   'Material for one day of something that runs longer than an evening. '
   'Multiplied by the occasion''s days.',
   'details', false, 60),
  ('game', 'The fun',
   'A game or a ritual, matched to how these particular people behave.',
   'fun', false, 70),
  ('soundtrack', 'The soundtrack',
   'One selection, sequenced for the arc of the night.',
   'soundtrack', false, 80),
  ('edit_item', 'The edit',
   'The short, opinionated list of things to buy.',
   'edit', false, 90),
  ('favour', 'What they take home',
   'One per head, and therefore counted from the top of her guest band.',
   'edit', true, 100);

-- ── occasion_slot ────────────────────────────────────────────────────
--
-- THE GATE. Which slots this occasion has, how many of each, and which pool
-- fills them.
--
-- `required` is the difference between a Revelle that is incomplete and one
-- that is merely smaller. A dinner party with no soundtrack is broken; a dinner
-- party with no favour is a dinner party. Required slots are what the beam
-- search must fill and what a catalogue gap is reported against; optional slots
-- are the slack the budget is allowed to spend, and the first thing dropped
-- when it cannot.
--
-- `per_day` multiplies the count by occasion_shape.days. It exists so that
-- "material for each day" is one row rather than three near-identical ones, and
-- so that changing a weekend from three days to two does not require touching
-- this table at all.

create table occasion_slot (
  occasion   occasion_type not null,
  slot_code  text not null references slot_kind(code) on delete restrict,
  -- Which pool fills it. A real foreign key into the pool registry, so a slot
  -- cannot name a pool that does not exist.
  pool       text not null references ingredient_pool(entity_table) on delete restrict,

  min_count  integer not null default 1 check (min_count >= 0),
  max_count  integer not null check (max_count >= 1),
  required   boolean not null default true,
  -- Count is per day of the occasion. See occasion_shape.days.
  per_day    boolean not null default false,

  position   integer not null,
  note       text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  primary key (occasion, slot_code),
  constraint occasion_slot_counts_ordered check (max_count >= min_count),
  -- A required slot that asks for nothing is a contradiction, and it is the
  -- kind of contradiction that produces a Revelle missing a part with no error
  -- anywhere.
  constraint occasion_slot_required_asks_for_one check (not required or min_count >= 1)
);

create trigger occasion_slot_touch before update on occasion_slot
  for each row execute function set_updated_at();

create index occasion_slot_order_idx on occasion_slot (occasion, position);

comment on table occasion_slot is
  'THE OCCASION GATE. Which slots exist for an occasion, how many, and from '
  'which pool. The destination does not appear here on purpose: the same '
  'destination must be able to carry every occasion, or the catalogue stops '
  'compounding. See db/009.';

-- ── the new pool: games and rituals ──────────────────────────────────
--
-- The third pool, and the first added since the installers in db/002 were
-- written — which is the test of whether "adding a pool is a table plus three
-- calls" was true or merely claimed. It is: everything below the table
-- definition is calls.
--
-- Games carry two things products do not, and both are CONSTRAINTS rather than
-- tastes: a group size that a parlour game for four genuinely cannot exceed,
-- and a duration a long dinner has room for and a rooftop hour does not.

create table game (
  id           uuid primary key default gen_random_uuid(),
  slug         citext not null unique check (slug ~ '^[a-z][a-z0-9-]*$'),
  name         text not null,
  description  text not null default '',

  -- How it is actually run, in the curator's words. This is what gets printed
  -- into The Fun, so it is writing and not a note.
  how_it_works text not null default '',
  -- What it needs. Null means nothing to buy, which is a common and good
  -- answer — the best games in this catalogue need a pen.
  materials    text,

  duration_minutes integer
    check (duration_minutes is null or duration_minutes between 1 and 600),

  -- The group this works for. Null at either end means no limit that end.
  -- A CONSTRAINT: a game for four at a party of forty is not a weak match, it
  -- is an impossibility, and the selection engine filters on it rather than
  -- scoring it down.
  min_guests   integer check (min_guests is null or min_guests >= 1),
  max_guests   integer check (max_guests is null or max_guests >= 1),

  -- What the materials cost, if anything. Same shape as product so the budget
  -- arithmetic is one function across every pool.
  price_cents  integer check (price_cents is null or price_cents >= 0),
  currency     text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),

  source_note  text,
  notes        text,

  status       product_status not null default 'draft',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint game_guest_range_ordered
    check (min_guests is null or max_guests is null or max_guests >= min_guests)
);

create trigger game_touch before update on game
  for each row execute function set_updated_at();

create index game_status_idx on game (status, name);
create index game_guests_idx on game (min_guests, max_guests);

comment on table game is
  'Games and rituals — the third ingredient pool. min_guests/max_guests are '
  'constraints, not preferences: a game outside her group size is filtered, '
  'never merely scored down. Added by db/009.';

select install_facet_tags('game', 'Games and rituals');
select rebuild_facet_tag_view();

-- ── revelle_<pool>.slot_code ─────────────────────────────────────────
--
-- The join tables already carry `slot section_kind` — which BLOCK an ingredient
-- appears in. That is not enough to record what the engine decided: the arrival
-- drink and the welcome are both 'arrival', and "which of this occasion's slots
-- did this ingredient fill" is the question a curator asks when she wants to
-- swap one.
--
-- Added to every existing pool by a loop over the registry rather than by three
-- hand-written statements, and added to the installer so the fourth pool gets it
-- without anyone remembering. Nullable: an ingredient placed by hand in the
-- curator's tool need not name a slot.

do $$
declare
  p record;
begin
  for p in select * from ingredient_pool where join_table is not null loop
    execute format(
      'alter table %I add column slot_code text
         references slot_kind(code) on delete restrict',
      p.join_table);
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
      position    integer,
      note        text,
      created_at  timestamptz not null default now(),

      primary key (revelle_id, %I)
    )$ddl$,
    v_join, v_column, p_entity_table, v_column);

  execute format(
    'create index %I on %I (%I)', v_join || '_ingredient_idx', v_join, v_column);

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

select install_revelle_ingredients(
  'game', 'Games and rituals', 'name', 'status', 'active', 2);
select rebuild_revelle_ingredient_view();

-- ── the two scoping registries ───────────────────────────────────────
--
-- Both are installed the same way facet tags are, for the same reasons stated
-- in db/002: one shape, one installer, real foreign keys on both sides, and no
-- polymorphic entity_id anywhere a delete could orphan a row.
--
-- They are registered on `ingredient_pool` rather than in two more registry
-- tables, because a pool is one thing and the questions "how is it tagged",
-- "how is it scoped to an occasion" and "how does it behave under a
-- destination" are three columns of one answer.

alter table ingredient_pool
  -- '<entity>_occasion', or null for a pool with no occasion rules.
  add column occasion_table text unique,
  -- '<entity>_slot', or null. Which SLOTS a thing may fill.
  add column slot_table text unique,
  -- '<entity>_world', or null. Null for `world` itself, which cannot have an
  -- affinity to a destination because it IS the destination.
  add column world_table text unique;

-- ── occasion eligibility ─────────────────────────────────────────────
--
-- WHERE THE RULE LIVES. Not here.
--
-- These tables hold CLAIMS: this thing is native to a birthday; this thing must
-- never appear at a dinner party. Turning a set of claims into a yes or a no is
-- one rule, and it is stated exactly once, in src/lib/selection/occasion.ts,
-- where it can be tested without a database. Writing it a second time as a SQL
-- function would be two implementations of one rule, which is the disease
-- db/002 exists to cure.
--
-- The rule, for a reader of this file only — the code is authoritative:
--
--   · NO ROWS AT ALL           eligible for every occasion. An untagged
--                              ingredient makes no claim, and a catalogue that
--                              starts empty must not start ineligible.
--   · ANY 'native' ROW         those occasions and no others. Naming one is
--                              opting into a whitelist.
--   · A 'forbidden' ROW        never, for that occasion, whatever else is
--                              claimed. "Everything except a kids' party" is
--                              one row.

create type occasion_fit as enum ('native', 'forbidden');

create or replace function install_occasion_eligibility(p_entity_table text)
returns void
language plpgsql as $$
declare
  v_table  text := p_entity_table || '_occasion';
  v_column text := p_entity_table || '_id';
begin
  execute format($ddl$
    create table %I (
      %I         uuid not null references %I(id) on delete cascade,
      occasion   occasion_type not null,
      fit        occasion_fit not null default 'native',
      -- Why. The only place a curator's reasoning about a scoping decision
      -- survives, and the sentence the explanation quotes when this row is
      -- what eliminated something.
      note       text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),

      primary key (%I, occasion)
    )$ddl$,
    v_table, v_column, p_entity_table, v_column);

  -- "Everything eligible for a birthday" — the selection read.
  execute format(
    'create index %I on %I (occasion, fit)', v_table || '_occasion_idx', v_table);

  execute format(
    'create trigger %I before update on %I
       for each row execute function set_updated_at()',
    v_table || '_touch', v_table);

  update ingredient_pool set occasion_table = v_table
   where entity_table = p_entity_table;

  if not found then
    raise exception
      'install_occasion_eligibility: % is not a registered ingredient pool.',
      p_entity_table;
  end if;
end;
$$;

-- ── slot eligibility ─────────────────────────────────────────────────
--
-- THE SECOND AXIS, AND THE SAME RULE.
--
-- The occasion says a birthday has an honouring beat AND a game AND per-day
-- material. All three draw from the same pool, so without this a toast written
-- to mark the person could be placed as day-two material and nothing would
-- object. The occasion decides which slots EXIST; this decides which slots a
-- given ingredient can FILL.
--
-- Identical shape and identical rule to occasion eligibility — no rows means
-- any slot, a 'native' row makes it a whitelist, a 'forbidden' row vetoes —
-- and the rule is implemented ONCE, in src/lib/selection/occasion.ts, over both
-- axes. Two tables, one shape, one rule, no second copy of it anywhere.
--
-- `world` gets no slot table: a destination is not placed in a slot, it is the
-- thing the slots are filled in the register of.

create or replace function install_slot_eligibility(p_entity_table text)
returns void
language plpgsql as $$
declare
  v_table  text := p_entity_table || '_slot';
  v_column text := p_entity_table || '_id';
begin
  execute format($ddl$
    create table %I (
      %I         uuid not null references %I(id) on delete cascade,
      slot_code  text not null references slot_kind(code) on delete restrict,
      fit        occasion_fit not null default 'native',
      note       text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),

      primary key (%I, slot_code)
    )$ddl$,
    v_table, v_column, p_entity_table, v_column);

  execute format(
    'create index %I on %I (slot_code, fit)', v_table || '_slot_idx', v_table);

  execute format(
    'create trigger %I before update on %I
       for each row execute function set_updated_at()',
    v_table || '_touch', v_table);

  update ingredient_pool set slot_table = v_table
   where entity_table = p_entity_table;

  if not found then
    raise exception
      'install_slot_eligibility: % is not a registered ingredient pool.',
      p_entity_table;
  end if;
end;
$$;

-- ── destination scoping ──────────────────────────────────────────────
--
-- STAGE 3 OF docs/selection-spec.md, as two columns.
--
--   forbidden   a structural "never under this destination". Not a low score —
--               a filter, for the same reason a dealbreaker is a filter: a high
--               enough score would otherwise sneak it through.
--   affinity    the re-weighting. Signed -1..1, exactly like a facet tag's
--               weight, and consumed as an ADDITIVE term so that the beam
--               search's score reads the way the spec writes it:
--               `facet match + destination affinity − …`. No row means zero,
--               which means neutral: the ingredient is neither pulled toward
--               this destination nor away from it.
--
-- The third mechanism the spec names — INHERITED FACETS — needs no table. A
-- destination already characterises itself in world_facet, and the engine adds
-- those facets to her preference vector before it scores a single ingredient.

create or replace function install_world_affinity(p_entity_table text)
returns void
language plpgsql as $$
declare
  v_table  text := p_entity_table || '_world';
  v_column text := p_entity_table || '_id';
begin
  if p_entity_table = 'world' then
    raise exception
      'install_world_affinity: a destination cannot have an affinity to a '
      'destination. It IS one.';
  end if;

  execute format($ddl$
    create table %I (
      %I         uuid not null references %I(id) on delete cascade,
      world_id   uuid not null references world(id) on delete cascade,

      -- Unusable under this destination. Structural.
      forbidden  boolean not null default false,
      -- Signed, -1..1. Zero is allowed here (unlike a facet tag's weight)
      -- because a row may exist to carry `forbidden` and say nothing about
      -- weight at all.
      affinity   numeric(4,3) not null default 0.000
                   check (affinity >= -1 and affinity <= 1),
      note       text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),

      primary key (%I, world_id)
    )$ddl$,
    v_table, v_column, p_entity_table, v_column);

  -- "Everything scoped to this destination" — the read stage 3 lives on.
  execute format(
    'create index %I on %I (world_id, forbidden, affinity desc)',
    v_table || '_world_idx', v_table);

  execute format(
    'create trigger %I before update on %I
       for each row execute function set_updated_at()',
    v_table || '_touch', v_table);

  update ingredient_pool set world_table = v_table
   where entity_table = p_entity_table;

  if not found then
    raise exception
      'install_world_affinity: % is not a registered ingredient pool.',
      p_entity_table;
  end if;
end;
$$;

-- ── the union views ──────────────────────────────────────────────────
--
-- Same pattern, and the same reason, as facet_tag in db/002: the engine reads
-- one relation per concept and does not need to know how many pools exist. Both
-- are regenerated by a function so that installing a fifth pool is a call and
-- not an edit to a view definition somebody will forget.

create or replace function rebuild_ingredient_occasion_view() returns void
language plpgsql as $$
declare
  v_sql text;
begin
  select string_agg(
           format(
             'select %L::text as entity_table, %I as entity_id, occasion, fit, '
             || 'note, created_at from %I',
             p.entity_table, p.entity_table || '_id', p.occasion_table),
           e'\n  union all\n'
           order by p.entity_table)
    into v_sql
    from ingredient_pool p
   where p.occasion_table is not null;

  if v_sql is null then
    raise exception
      'rebuild_ingredient_occasion_view: no pool has occasion eligibility installed.';
  end if;

  execute format('create or replace view ingredient_occasion as %s', v_sql);
end;
$$;

create or replace function rebuild_ingredient_slot_view() returns void
language plpgsql as $$
declare
  v_sql text;
begin
  select string_agg(
           format(
             'select %L::text as entity_table, %I as entity_id, slot_code, fit, '
             || 'note, created_at from %I',
             p.entity_table, p.entity_table || '_id', p.slot_table),
           e'\n  union all\n'
           order by p.entity_table)
    into v_sql
    from ingredient_pool p
   where p.slot_table is not null;

  if v_sql is null then
    raise exception
      'rebuild_ingredient_slot_view: no pool has slot eligibility installed.';
  end if;

  execute format('create or replace view ingredient_slot as %s', v_sql);
end;
$$;

create or replace function rebuild_ingredient_world_view() returns void
language plpgsql as $$
declare
  v_sql text;
begin
  select string_agg(
           format(
             'select %L::text as entity_table, %I as entity_id, world_id, '
             || 'forbidden, affinity, note, created_at from %I',
             p.entity_table, p.entity_table || '_id', p.world_table),
           e'\n  union all\n'
           order by p.entity_table)
    into v_sql
    from ingredient_pool p
   where p.world_table is not null;

  if v_sql is null then
    raise exception
      'rebuild_ingredient_world_view: no pool has destination scoping installed.';
  end if;

  execute format('create or replace view ingredient_world as %s', v_sql);
end;
$$;

-- ── install, for every pool that exists ──────────────────────────────
--
-- `world` gets occasion eligibility and nothing else. A destination CAN say it
-- refuses an occasion — a destination built entirely around a costume rule has
-- no business at a wedding-adjacent brunch — but it is emphatically not
-- required to, and the default is that it carries every occasion. That default
-- is the whole point of this file: WESTHAMPTON, 1976 should be reachable for a
-- birthday, a dinner and a weekend, in three different shapes.

select install_occasion_eligibility('world');
select install_occasion_eligibility('product');
select install_occasion_eligibility('tracklist');
select install_occasion_eligibility('game');
select rebuild_ingredient_occasion_view();

select install_slot_eligibility('product');
select install_slot_eligibility('tracklist');
select install_slot_eligibility('game');
select rebuild_ingredient_slot_view();

select install_world_affinity('product');
select install_world_affinity('tracklist');
select install_world_affinity('game');
select rebuild_ingredient_world_view();

-- ── tracklist.world_id, projected ────────────────────────────────────
--
-- db/005 gave `tracklist` a nullable `world_id` meaning "written for this
-- destination". `tracklist_world` now expresses the same fact more richly, and
-- TWO REPRESENTATIONS OF ONE FACT DRIFT — db/002 says so at length and then
-- solves it with a ONE-WAY PROJECTION rather than a sync.
--
-- Same resolution here. `tracklist.world_id` stays authoritative for the row it
-- describes: setting it writes a tracklist_world row at full affinity, clearing
-- it removes that row, and any OTHER tracklist_world row — a curator saying
-- this house soundtrack also suits two other destinations — is untouched,
-- because world_id makes no claim about those.

create or replace function tracklist_world_project() returns trigger
language plpgsql as $$
begin
  -- No longer the destination it was written for.
  delete from tracklist_world tw
   where tw.tracklist_id = new.id
     and tw.note = 'Projected from tracklist.world_id.'
     and (new.world_id is null or tw.world_id <> new.world_id);

  if new.world_id is not null then
    insert into tracklist_world (tracklist_id, world_id, affinity, note)
    values (new.id, new.world_id, 1.000, 'Projected from tracklist.world_id.')
    on conflict do nothing;
  end if;

  return null;
end;
$$;

create trigger tracklist_world_projection
  after insert or update of world_id on tracklist
  for each row execute function tracklist_world_project();

-- The backfill, written as an update that changes nothing so the trigger above
-- is the single implementation of the rule. Same device as db/002's
-- `update world set taste_directions = taste_directions`.
update tracklist set world_id = world_id where world_id is not null;

-- ── the slot plans ───────────────────────────────────────────────────
--
-- Structure, not content — which is why it is in a migration and the fixtures
-- in scripts/seed-fixtures.mjs are not. What parts a birthday has is a product
-- decision of the same kind as what a facet dimension is.
--
-- Read the differences between the blocks, because the differences are the
-- feature:
--
--   · Only multi-day occasions have `arrival_welcome` and `day_material`.
--   · Only birthday, anniversary and bridal have `honouring`.
--   · A dinner party has the densest table and no arrival day at all.
--   · A getaway has no honouring and no table object required — it is the
--     occasion that most resists being decorated.

insert into occasion_slot
  (occasion, slot_code, pool, min_count, max_count, required, per_day, position, note)
values
  -- ── the long dinner ───────────────────────────────────────────────
  ('dinner_party', 'arrival_drink', 'product',   1, 1, true,  false, 10, ''),
  ('dinner_party', 'table_object',  'product',   1, 1, true,  false, 20,
   'The densest table of any occasion. This is the one that has to be right.'),
  ('dinner_party', 'the_moment',    'game',      1, 1, false, false, 30, ''),
  ('dinner_party', 'game',          'game',      1, 1, true,  false, 40, ''),
  ('dinner_party', 'soundtrack',    'tracklist', 1, 1, true,  false, 50, ''),
  ('dinner_party', 'edit_item',     'product',   1, 3, false, false, 60, ''),

  -- ── the birthday ──────────────────────────────────────────────────
  ('birthday', 'arrival_drink', 'product',   1, 1, true,  false, 10, ''),
  ('birthday', 'honouring',     'game',      1, 1, true,  false, 20,
   'The beat a getaway does not have. Required, and required to be a ritual '
   'rather than a purchase.'),
  ('birthday', 'table_object',  'product',   1, 1, true,  false, 30, ''),
  ('birthday', 'the_moment',    'game',      1, 1, false, false, 40, ''),
  ('birthday', 'game',          'game',      1, 1, true,  false, 50, ''),
  ('birthday', 'soundtrack',    'tracklist', 1, 1, true,  false, 60, ''),
  ('birthday', 'edit_item',     'product',   1, 3, false, false, 70, ''),
  ('birthday', 'favour',        'product',   1, 1, false, false, 80,
   'One per head. Counted from the top of her guest band, never the middle.'),

  -- ── the weekend away ──────────────────────────────────────────────
  ('girls_weekend', 'arrival_welcome', 'product',   1, 1, true,  false, 10,
   'Arrival is its own event when there is a day after it.'),
  ('girls_weekend', 'arrival_drink',   'product',   1, 1, true,  false, 20, ''),
  ('girls_weekend', 'day_material',    'game',      1, 1, true,  true,  30,
   'One per day. occasion_shape.days does the multiplying.'),
  ('girls_weekend', 'the_moment',      'game',      1, 1, false, false, 40, ''),
  ('girls_weekend', 'table_object',    'product',   1, 1, false, false, 50, ''),
  ('girls_weekend', 'soundtrack',      'tracklist', 1, 1, true,  false, 60, ''),
  ('girls_weekend', 'edit_item',       'product',   1, 3, false, false, 70, ''),

  -- ── the getaway ───────────────────────────────────────────────────
  ('getaway', 'arrival_welcome', 'product',   1, 1, true,  false, 10, ''),
  ('getaway', 'day_material',    'game',      1, 1, true,  true,  20, ''),
  ('getaway', 'the_moment',      'game',      1, 1, false, false, 30, ''),
  ('getaway', 'soundtrack',      'tracklist', 1, 1, true,  false, 40, ''),
  ('getaway', 'edit_item',       'product',   1, 3, false, false, 50,
   'The occasion that most resists being decorated. Nothing here is required '
   'beyond arrival, the days and the music.'),

  -- ── the anniversary ───────────────────────────────────────────────
  ('anniversary', 'arrival_drink', 'product',   1, 1, true,  false, 10, ''),
  ('anniversary', 'honouring',     'game',      1, 1, true,  false, 20, ''),
  ('anniversary', 'table_object',  'product',   1, 1, true,  false, 30, ''),
  ('anniversary', 'the_moment',    'game',      1, 1, false, false, 40, ''),
  ('anniversary', 'soundtrack',    'tracklist', 1, 1, true,  false, 50, ''),
  ('anniversary', 'edit_item',     'product',   1, 2, false, false, 60, ''),

  -- ── something bridal ──────────────────────────────────────────────
  ('bridal', 'arrival_welcome', 'product',   1, 1, true,  false, 10, ''),
  ('bridal', 'arrival_drink',   'product',   1, 1, true,  false, 20, ''),
  ('bridal', 'honouring',       'game',      1, 1, true,  false, 30, ''),
  ('bridal', 'day_material',    'game',      1, 1, true,  true,  40, ''),
  ('bridal', 'game',            'game',      1, 1, false, false, 50, ''),
  ('bridal', 'soundtrack',      'tracklist', 1, 1, true,  false, 60, ''),
  ('bridal', 'edit_item',       'product',   1, 3, false, false, 70, ''),
  ('bridal', 'favour',          'product',   1, 1, false, false, 80, ''),

  -- ── the holiday ───────────────────────────────────────────────────
  ('holiday', 'arrival_drink', 'product',   1, 1, true,  false, 10, ''),
  ('holiday', 'table_object',  'product',   1, 1, true,  false, 20, ''),
  ('holiday', 'game',          'game',      1, 1, true,  false, 30, ''),
  ('holiday', 'soundtrack',    'tracklist', 1, 1, true,  false, 40, ''),
  ('holiday', 'edit_item',     'product',   1, 3, false, false, 50, ''),

  -- ── no reason at all ──────────────────────────────────────────────
  ('no_reason', 'arrival_drink', 'product',   1, 1, true,  false, 10, ''),
  ('no_reason', 'table_object',  'product',   1, 1, true,  false, 20, ''),
  ('no_reason', 'game',          'game',      1, 1, true,  false, 30, ''),
  ('no_reason', 'soundtrack',    'tracklist', 1, 1, true,  false, 40, ''),
  ('no_reason', 'edit_item',     'product',   1, 2, false, false, 50, ''),

  -- ── something else ────────────────────────────────────────────────
  -- The same shape as "no reason at all", and the engine SAYS SO in the
  -- explanation rather than presenting a guess as a plan. A human reads her
  -- words and edits the plan; that is the correct amount of automation for an
  -- occasion nobody has named.
  ('other', 'arrival_drink', 'product',   1, 1, true,  false, 10,
   'Defaulted. The occasion is free text and a curator has not read it yet.'),
  ('other', 'table_object',  'product',   1, 1, true,  false, 20, ''),
  ('other', 'game',          'game',      1, 1, true,  false, 30, ''),
  ('other', 'soundtrack',    'tracklist', 1, 1, true,  false, 40, ''),
  ('other', 'edit_item',     'product',   1, 2, false, false, 50, '');

-- ── destination_facet_coverage ───────────────────────────────────────
--
-- THE REVIEW CRITERION FOR A TAGGED DESTINATION.
--
-- Everything in stage 2 is a join between what she answered and how a
-- destination is tagged. That join is only as good as the tagging, and there
-- are exactly two ways for the tagging to be bad in a way nothing else catches:
--
--   THIN      a destination carrying three facets is being described in a
--             private vocabulary — the curator knows what it is and the shared
--             facet set does not. Every customer scores about the same against
--             it, which is mush wearing a number.
--   LOPSIDED  a destination where one facet holds most of the weight is
--             effectively a single-facet destination. It will win for the women
--             who tapped that one thing and be invisible to everyone else,
--             which looks like a scoring bug and is a tagging one.
--
-- NARROW is the third and softer flag: everything on one axis. A destination
-- tagged only in taste_direction has nothing to say about how her people
-- behave, so the group_fun and affinity halves of her vector fall through it.
--
-- `concentration` is the Herfindahl index over the weights — 1.0 means one
-- facet holds everything, 1/n means they are even. It is reported alongside
-- `top_facet_share` because the two fail differently: two facets at 0.45 each
-- do not trip the share test and are still a two-facet destination.
--
-- Right now the founder tags every destination personally, so this cannot
-- drift. The moment anyone else tags one, this is the review. Read it with
-- scripts/check-destination-facets.mjs (npm run check:coverage), which exits
-- non-zero on a published destination that trips a flag.

create view destination_facet_coverage as
with tagged as (
  select w.id, w.slug, w.name, w.status,
         wf.facet_id, f.dimension_code, abs(wf.weight) as weight
    from world w
    left join world_facet wf on wf.world_id = w.id
    left join facet f on f.id = wf.facet_id
),
rolled as (
  select id, slug, name, status,
         count(facet_id)                   as facet_count,
         count(distinct dimension_code)    as dimension_count,
         coalesce(sum(weight), 0)          as weight_total,
         coalesce(max(weight), 0)          as weight_max
    from tagged
   group by id, slug, name, status
),
concentrated as (
  select t.id,
         sum(power(t.weight / nullif(r.weight_total, 0), 2)) as concentration
    from tagged t
    join rolled r on r.id = t.id
   where t.facet_id is not null
   group by t.id
)
select r.id,
       r.slug,
       r.name,
       r.status,
       r.facet_count,
       r.dimension_count,
       round(r.weight_total, 3) as weight_total,
       round(coalesce(r.weight_max / nullif(r.weight_total, 0), 0), 3)
         as top_facet_share,
       round(coalesce(c.concentration, 0), 3) as concentration,
       -- Fewer than six terms is not a description, it is a label.
       (r.facet_count < 6)                                    as thin,
       (coalesce(r.weight_max / nullif(r.weight_total, 0), 0) > 0.5) as lopsided,
       (r.dimension_count < 3)                                as narrow
  from rolled r
  left join concentrated c on c.id = r.id;

comment on view destination_facet_coverage is
  'Is this destination described in the SHARED vocabulary, richly enough to '
  'join against a host''s answers? thin / lopsided / narrow are the three ways '
  'it is not. See db/009 and npm run check:coverage.';

-- ─────────────────────────────────────────────────────────────────────
-- WHAT THIS DELIBERATELY DOES NOT DO
--
--   · No scoring, anywhere. Every number above is a bound or a weight the
--     engine reads. The arithmetic is in src/lib/selection/, without a
--     database, because a scoring rule that can only be tested by inserting
--     rows is a scoring rule nobody will change.
--   · No enforcement that a delivered Revelle actually filled its occasion's
--     required slots. The curator may deliberately withhold a part, and a
--     constraint that fires at delivery would turn her judgement into an
--     error. The engine reports an unfilled required slot as a CATALOGUE GAP,
--     which is a message to the house rather than to the customer.
--   · No occasion column on `world`. It is the whole point that there is not
--     one. `world.fits_occasions` stays what db/001 made it — a positive
--     signal that SCORES, projected into world_facet by db/002 — and
--     world_occasion is the separate, rarely-used veto.
-- ─────────────────────────────────────────────────────────────────────
