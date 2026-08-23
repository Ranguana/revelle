-- ── 031 · THE BANK ───────────────────────────────────────────────────
--
-- Atmosphere ships as pool-selected content: goods, host acts, games and
-- printed cards, per destination, chosen a few at a time per package.
--
-- ── ONE TABLE, NOT FOUR ──────────────────────────────────────────────
--
-- The four kinds have IDENTICAL MECHANICS — per-destination, draft/active, a
-- phase tag, a venue constraint, a lead time, a technique-card attachment — and
-- differ only in what a curator calls them. Four tables would quadruple the
-- surface (four screens, four seeders, four join tables, four sets of the same
-- query) for zero behavioural difference, and the fifth kind somebody thinks of
-- next would be a migration instead of a value.
--
-- So: one table, a `kind` enum.
--
-- ── WHAT IS NOT IN HERE, ON PURPOSE ──────────────────────────────────
--
-- GESTURES. A gesture is INVARIANT per destination — the one thing that always
-- happens — and the bank is only what SELECTION CHOOSES AMONG. Putting an
-- invariant in a pool of variables is how it eventually gets left out of a
-- package. It lives on the destination record, added below.
--
-- STAGING NOTES, as a separate content type, are folded in. A printed card with
-- a shopping line attached is a bank_item with ingredient links; the shape
-- specified this morning survives exactly, as one less content type.

create type bank_kind as enum ('good', 'host_act', 'game', 'printed_card');

-- daylight/dusk/dark, and `all` meaning NO OPINION rather than "every phase".
-- The default is `all` because most content has no time of day, and a tag that
-- has to be filled in for every row gets filled in wrongly.
create type bank_phase as enum ('daylight', 'dusk', 'dark', 'all');

-- `requires_outdoors` means it CANNOT happen inside. `outdoor_access` is the
-- softer grade the sparklers wanted: it needs a door to somewhere, which most
-- apartments have. The distinction is the whole reason this is not a boolean.
create type bank_venue as enum ('none', 'outdoor_access', 'requires_outdoors');

create table bank_item (
  id           uuid primary key default gen_random_uuid(),
  slug         citext not null unique check (slug ~ '^[a-z][a-z0-9-]*$'),
  world_id     uuid not null references world(id) on delete restrict,
  kind         bank_kind not null,

  name         text not null,
  description  text not null default '',

  phase        bank_phase not null default 'all',
  venue        bank_venue not null default 'none',

  -- Nulls mean "no lead time", not "unknown". A thing that must be ordered says
  -- how long; everything else says nothing.
  min_lead_days integer check (min_lead_days is null or min_lead_days >= 0),

  -- FALSE is owned-if-present: the scene card may GLANCE at it, and nothing
  -- ships. Turntables, fireplaces, backgammon, the good chess set. A house
  -- either has one or the line is not written.
  ships        boolean not null default true,

  -- A technique card is itself a bank_item of kind `printed_card`. One skill per
  -- card, era-correct, in the room's voice, riding with whichever act the
  -- package selected — so the attachment is a self-reference rather than a
  -- fifth table.
  technique_card_id uuid references bank_item(id) on delete set null,

  -- Selection weight, in the sense the rest of the catalogue uses: a nudge, not
  -- a gate. Higher is reached for first.
  weight       numeric(4,3) not null default 1.000 check (weight >= 0 and weight <= 2),

  status       product_status not null default 'draft',

  -- Where the line came from — the bank document, a founder note, a supplier.
  -- Not decoration: an atmosphere line with no provenance is one nobody can
  -- check, and this catalogue's whole discipline is that a claim has a source.
  source_citation text not null default '',

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  -- A technique card cannot carry a technique card, and nothing may point at
  -- itself.
  constraint bank_item_card_not_self check (technique_card_id is distinct from id)
);

create index bank_item_world_idx  on bank_item (world_id, kind, status);
create index bank_item_phase_idx  on bank_item (phase) where phase <> 'all';
create index bank_item_venue_idx  on bank_item (venue) where venue <> 'none';

create trigger bank_item_touch before update on bank_item
  for each row execute function set_updated_at();

-- A technique card must actually be one. Enforced as a trigger rather than a
-- check because it reads another row.
create or replace function bank_item_card_is_a_card() returns trigger
language plpgsql as $$
declare v_kind bank_kind;
begin
  if new.technique_card_id is null then return new; end if;
  select kind into v_kind from bank_item where id = new.technique_card_id;
  if v_kind is distinct from 'printed_card' then
    raise exception 'bank_item %: technique_card_id must point at a printed_card, not a %',
      new.slug, coalesce(v_kind::text, 'missing row');
  end if;
  return new;
end;
$$;
create trigger bank_item_card_kind before insert or update on bank_item
  for each row execute function bank_item_card_is_a_card();

-- ── SHOPPABLE ATMOSPHERE ─────────────────────────────────────────────
--
-- This is staging_note_item under its right name. A good or a printed card may
-- point at canonical product rows; buyable atmosphere is a relationship an item
-- HAS rather than a second product table.

create table bank_item_ingredient (
  bank_item_id uuid not null references bank_item(id) on delete cascade,
  product_id   uuid not null references product(id) on delete restrict,
  note         text not null default '',
  primary key (bank_item_id, product_id)
);

create index bank_item_ingredient_by_product on bank_item_ingredient (product_id);

-- ── GESTURES LIVE ON THE DESTINATION ─────────────────────────────────

alter table world
  add column gesture      text,
  add column gesture_note text;

comment on column world.gesture is
  'The one thing that always happens in this room. INVARIANT — not bank '
  'content, because the bank is what selection chooses among and an invariant '
  'in a pool of variables eventually gets left out of a package.';

-- ── REGISTERED AS A POOL ─────────────────────────────────────────────
--
-- So it appears on /desk/publish and in the connections matrix with no edit to
-- either — both read ingredient_pool rather than a hand-written list.

select install_revelle_ingredients('bank_item', 'Atmosphere', 'name', 'status', 'active', 2);

comment on table bank_item is
  'Pool-selected atmosphere: goods, host acts, games and printed cards. One '
  'table because the four kinds have identical mechanics and differ only in '
  'what a curator calls them. Gestures are NOT here — they are invariant and '
  'live on world.gesture.';
