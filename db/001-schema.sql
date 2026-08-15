-- Revelle Société — initial schema
--
-- Applied by scripts/migrate.mjs, inside one transaction together with its
-- schema_migrations ledger row. Nothing in this file may be a statement that
-- refuses to run in a transaction (`create index concurrently`, `vacuum`).
--
-- ─────────────────────────────────────────────────────────────────────
-- THE SHAPE OF THE BUSINESS, AND THEREFORE OF THIS FILE
--
--   customer          who she is
--   quiz_response     what she told us, ONCE, and never edited afterwards
--   taste_profile     what we have learned about her over time (derived)
--   world             the proprietary IP: a reusable creative world
--   world_section     a world's default content blocks — the template
--   revelle           one customer's delivered experience = quiz + world
--   revelle_section   her content blocks, cloned from the world then edited
--
-- The load-bearing idea is that a WORLD is reusable and a REVELLE is not.
-- Worlds are the asset that compounds; a revelle is one performance of one.
--
-- ─────────────────────────────────────────────────────────────────────
-- ENUM vs TEXT[] — read this before adding a question to the quiz
--
-- Enums are used only where the value set is genuinely closed and structural:
-- lifecycle statuses, occasion, environment, budget band. Changing one of
-- those is a real product decision and deserves a migration.
--
-- The TASTE VOCABULARIES — taste directions, how a group has fun, what would
-- ruin it — are deliberately `text[]`, NOT enums. That vocabulary is the part
-- of the product most likely to change, seasonally and on taste, and an enum
-- turns "rename a taste direction" into a migration plus a rewrite of every
-- historical row. The authoritative list lives in src/lib/quiz.ts (options are
-- data, with an optional image), the API validates against it, and `answers`
-- below preserves exactly what she was shown and picked. GIN indexes make
-- "everyone who chose X" as fast as an enum would.
--
-- ─────────────────────────────────────────────────────────────────────

create extension if not exists citext;    -- case-insensitive email
create extension if not exists pgcrypto;  -- gen_random_bytes for share tokens

-- ── shared helpers ───────────────────────────────────────────────────

create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- URL-safe, 128 bits of entropy, no ambiguity about base64 padding in a path.
create or replace function new_access_token() returns text
language sql volatile as $$
  select encode(gen_random_bytes(16), 'hex');
$$;

-- ── enums ────────────────────────────────────────────────────────────

create type occasion_type as enum (
  'birthday',
  'girls_weekend',
  'dinner_party',
  'getaway',
  'anniversary',
  'holiday',
  'bridal',
  'no_reason',
  'other'
);

create type environment_type as enum (
  'my_home',
  'rented_house',
  'city_apartment',
  'beach',
  'mountains',
  'poolside',
  'garden',
  'restaurant_or_venue',
  'hotel',
  'not_decided'
);

create type budget_band as enum (
  'under_500',
  'from_500_to_1500',
  'from_1500_to_3000',
  'from_3000_to_6000',
  'over_6000',
  'not_sure'
);

-- Staff workflow for an inbound quiz. V1 has no recommendation engine: a human
-- reads these in order and builds the revelle by hand.
create type quiz_status as enum (
  'new',
  'in_progress',
  'delivered',
  'archived'
);

create type world_status as enum ('draft', 'published', 'retired');

-- `preview` is the state where she can see the world but not the whole
-- experience. Payment is deliberately NOT modelled here yet — when it is, it
-- belongs in its own table (order/payment), not as a column on this enum.
create type revelle_status as enum ('draft', 'preview', 'delivered', 'archived');

-- The anatomy of a Revelle. Ordering is data (see the `position` column), but
-- the vocabulary of block types is closed — each kind has its own renderer.
create type section_kind as enum (
  'world',
  'arrival',
  'moment',
  'ending',
  'fun',
  'soundtrack',
  'details',
  'edit',
  'downloads',
  'make_it_happen'
);

-- ── customer ─────────────────────────────────────────────────────────

create table customer (
  id          uuid primary key default gen_random_uuid(),
  email       citext not null unique,
  -- Name is not asked at quiz time (the email is the whole ask). Staff fill it
  -- in, or a later step does.
  name        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint customer_email_shaped check (email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')
);

create trigger customer_touch before update on customer
  for each row execute function set_updated_at();

-- ── quiz_response ────────────────────────────────────────────────────
--
-- IMMUTABLE / APPEND-ONLY. A customer may take the quiz many times; every
-- submission is a new row and no row is ever rewritten. Two reasons:
--
--   1. `answers` is the evidentiary record of what she actually submitted,
--      against the question set she was actually shown (`quiz_version`). If we
--      reword a question next month, last month's rows must not silently start
--      meaning something else.
--   2. The future per-customer taste profile ("mini model") is derived from the
--      full history of her submissions. Editing history would corrupt it.
--
-- The only mutable column is `status`, which is staff workflow rather than her
-- answer. The trigger below enforces exactly that, and forbids deletes.
--
-- Structured columns exist alongside `answers` so staff can query ("show me
-- every beach girls-weekend over $3k"). `answers` is the truth; the columns are
-- a projection of it, written by the same insert.

create table quiz_response (
  id             uuid primary key default gen_random_uuid(),
  customer_id    uuid not null references customer(id) on delete cascade,

  -- The whole submitted payload, verbatim. Never derived from, never patched.
  answers        jsonb not null,
  -- Which question set produced `answers`. Bump it in src/lib/quiz.ts whenever
  -- a question's meaning changes.
  quiz_version   text not null,

  -- Client-generated, stable across retries of the same submission. This is
  -- what stops a flaky network turning one quiz into three rows.
  submission_key text not null unique,

  -- ── the projection ──────────────────────────────────────────────
  occasion            occasion_type not null,
  occasion_other      text,                    -- set only when occasion = 'other'
  environment         environment_type not null,
  -- 2–3 chosen. See the ENUM vs TEXT[] note at the top of this file.
  taste_directions    text[] not null default '{}',
  -- how her group actually has fun
  group_fun           text[] not null default '{}',
  -- the "not this" half of the contrast question: what would ruin it
  anti_preferences    text[] not null default '{}',
  -- the "more this" half
  affinities          text[] not null default '{}',
  -- the one free-text question: "tell us one thing we couldn't possibly know"
  secret              text,
  budget              budget_band not null,

  -- Not asked in the v1 quiz. Nullable on purpose: delivery needs both, and
  -- staff fill them in from the reply email until there is a question for them.
  event_date          date,
  guest_count         integer check (guest_count is null or guest_count > 0),

  status         quiz_status not null default 'new',
  created_at     timestamptz not null default now(),

  constraint quiz_response_other_needs_text
    check ((occasion = 'other') = (occasion_other is not null and length(btrim(occasion_other)) > 0)),
  constraint quiz_response_taste_count
    check (cardinality(taste_directions) between 1 and 5)
);

-- Staff queue: the oldest unhandled quiz first.
create index quiz_response_queue_idx on quiz_response (status, created_at);
create index quiz_response_customer_idx on quiz_response (customer_id, created_at desc);
create index quiz_response_occasion_idx on quiz_response (occasion);
create index quiz_response_taste_idx on quiz_response using gin (taste_directions);
create index quiz_response_group_fun_idx on quiz_response using gin (group_fun);
create index quiz_response_anti_idx on quiz_response using gin (anti_preferences);

create or replace function quiz_response_guard() returns trigger
language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    raise exception
      'quiz_response is append-only: row % may not be deleted. Set status = ''archived''.',
      old.id;
  end if;

  -- Everything except workflow state is frozen. Listed explicitly rather than
  -- compared with row equality so that adding a column is a deliberate choice
  -- about which side of this line it falls on.
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
     or new.created_at       is distinct from old.created_at
  then
    raise exception
      'quiz_response % is immutable: only status, event_date and guest_count may change. Insert a new response instead.',
      old.id;
  end if;

  return new;
end;
$$;

create trigger quiz_response_no_delete before delete on quiz_response
  for each row execute function quiz_response_guard();

create trigger quiz_response_no_edit before update on quiz_response
  for each row execute function quiz_response_guard();

-- ── taste_profile ────────────────────────────────────────────────────
--
-- THE MINI MODEL — a placeholder with a purpose, not a feature.
--
-- The intent: over time, each subscriber accumulates signals (which worlds she
-- was given, which sections she opened, what she bought from the edit, what she
-- said next time) and those signals personalise her FUTURE Revelles. That
-- inference is explicitly NOT built now — v1 is human taste, end to end.
--
-- What exists now is the place for it to land, created empty the moment she
-- first submits, so no code ever has to ask "does she have a profile yet". The
-- shape is jsonb rather than columns because the signals are the part we cannot
-- yet name; when a signal proves itself, promote it to a column in a migration.
--
-- `revision` and `computed_at` are here so a rebuild of every profile after a
-- model change is a routine, resumable operation rather than an outage. The
-- profile is DERIVED — it must always be reconstructible from quiz_response
-- and behavioural history, so losing this table costs compute, not truth.

create table taste_profile (
  customer_id  uuid primary key references customer(id) on delete cascade,
  signals      jsonb not null default '{}'::jsonb,
  -- Which version of the derivation produced `signals`. Rows older than the
  -- current version are stale and safe to recompute.
  model_version text not null default 'v0-empty',
  revision     integer not null default 0,
  computed_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger taste_profile_touch before update on taste_profile
  for each row execute function set_updated_at();

create index taste_profile_stale_idx on taste_profile (model_version, computed_at);

-- ── world ────────────────────────────────────────────────────────────
--
-- The library. This is the proprietary asset — worlds are written by people
-- with a point of view and reused across many customers.

create table world (
  id            uuid primary key default gen_random_uuid(),
  -- Stable, human-typeable, used in internal URLs. Never reused.
  slug          citext not null unique,
  -- "WESTHAMPTON, 1976"
  name          text not null,
  -- "Vintage summer glamour. Very questionable houseguests."
  tagline       text not null,
  -- The long-form point of view: why this world exists and who it is for.
  description   text not null default '',

  -- The visual direction as DATA, not CSS: palette, type roles, the mark's
  -- arrangement. Same discipline as src/lib/tokens.ts — a generated or
  -- hand-authored token set can be ugly but cannot leak arbitrary CSS.
  tokens        jsonb not null default '{}'::jsonb,
  cover_image_url text,

  -- Staff matching aids. Not a recommendation engine — a filter for the human
  -- who is choosing. Same text[] reasoning as quiz_response.
  fits_occasions   occasion_type[] not null default '{}',
  taste_directions text[] not null default '{}',

  -- Internal only; never rendered to a customer.
  notes         text,

  status        world_status not null default 'draft',
  published_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint world_published_has_timestamp
    check ((status = 'published') = (published_at is not null))
);

create trigger world_touch before update on world
  for each row execute function set_updated_at();

create index world_status_idx on world (status, name);
create index world_occasion_idx on world using gin (fits_occasions);
create index world_taste_idx on world using gin (taste_directions);

-- ── world_section ────────────────────────────────────────────────────
--
-- A world's default content blocks: the reusable half of the writing. Cloning
-- these into revelle_section is what makes a world an asset instead of a name.
-- Editing a world's sections does NOT retroactively change a delivered
-- revelle — a delivered experience is frozen the moment it is cloned.

create table world_section (
  id          uuid primary key default gen_random_uuid(),
  world_id    uuid not null references world(id) on delete cascade,
  kind        section_kind not null,
  -- Overrides the kind's default heading ("THE MOMENT") when a world wants its
  -- own words for it.
  heading     text,
  body        text not null default '',
  -- Kind-specific structure: tracks for the soundtrack, line items for the
  -- edit, files for the downloads. Rendered by the block's own component.
  content     jsonb not null default '{}'::jsonb,
  position    integer not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  -- Deferred so a reorder can renumber inside one transaction without
  -- tripping over itself.
  constraint world_section_position_unique unique (world_id, position)
    deferrable initially deferred
);

create trigger world_section_touch before update on world_section
  for each row execute function set_updated_at();

create index world_section_order_idx on world_section (world_id, position);

-- ── revelle ──────────────────────────────────────────────────────────
--
-- One customer's delivered experience. Links her quiz to a world and holds
-- everything that is true for HER and not for the world in general.

create table revelle (
  id               uuid primary key default gen_random_uuid(),
  customer_id      uuid not null references customer(id) on delete cascade,
  -- One revelle per quiz response. She can take the quiz again for another
  -- occasion; that is a new response and a new revelle.
  quiz_response_id uuid not null unique references quiz_response(id),
  -- restrict, not cascade: a world that has been delivered to someone cannot
  -- be deleted out from under her. Retire it instead.
  world_id         uuid not null references world(id) on delete restrict,

  -- Per-customer customisation. Null means "use the world's".
  title_override   text,
  tagline_override text,
  -- Shallow-merged over world.tokens at render time.
  tokens_override  jsonb not null default '{}'::jsonb,
  -- The private note from the creative director to her, above the fold.
  dedication       text,

  event_date       date,
  guest_count      integer check (guest_count is null or guest_count > 0),

  -- Her URL. Unguessable, so she can reach her Revelle from a phone in a
  -- kitchen without an account, and share it with the friend who is helping.
  -- Rotatable: change this column and the old link is dead.
  access_token     text not null unique default new_access_token(),

  status           revelle_status not null default 'draft',
  delivered_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint revelle_delivered_has_timestamp
    check ((status = 'delivered') = (delivered_at is not null))
);

create trigger revelle_touch before update on revelle
  for each row execute function set_updated_at();

create index revelle_customer_idx on revelle (customer_id, created_at desc);
create index revelle_world_idx on revelle (world_id);
create index revelle_status_idx on revelle (status, created_at);

-- ── revelle_section ──────────────────────────────────────────────────
--
-- Her content blocks. Cloned from world_section at build time, then edited.
-- The structure of a Revelle is DATA: which blocks appear, in what order, and
-- whether one is hidden are all rows here, not a hardcoded list in a component.

create table revelle_section (
  id          uuid primary key default gen_random_uuid(),
  revelle_id  uuid not null references revelle(id) on delete cascade,
  kind        section_kind not null,
  heading     text,
  body        text not null default '',
  content     jsonb not null default '{}'::jsonb,
  position    integer not null,
  -- Staff can withhold a block without deleting the writing.
  is_visible  boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint revelle_section_position_unique unique (revelle_id, position)
    deferrable initially deferred
);

create trigger revelle_section_touch before update on revelle_section
  for each row execute function set_updated_at();

create index revelle_section_order_idx on revelle_section (revelle_id, position);
