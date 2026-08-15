-- Revelle Société — cohort priors, one shared vocabulary, and first-class "no"
--
-- Applied by scripts/migrate.mjs after 001-schema.sql, inside one transaction
-- together with its schema_migrations ledger row. Same rule as 001: nothing
-- here may be a statement that refuses to run in a transaction.
--
-- This migration is new — it has never been applied anywhere — so it needs no
-- SENTINELS entry in scripts/migrate.mjs. It is picked up by discovery and runs
-- exactly once; the ledger, not `if not exists`, is what makes it idempotent.
--
-- ─────────────────────────────────────────────────────────────────────
-- WHY THIS EXISTS — THE SPARSITY PROBLEM
--
-- Revelle's customer interacts about THREE TIMES A YEAR. Every recommender
-- technique that assumes a behavioural stream — collaborative filtering, a
-- per-user embedding, a session model — is starved at that rate. A per-user
-- model of a woman who has told us nine things is not a model, it is noise with
-- a confidence interval.
--
-- The deployed industry answer to exactly this is COHORT PRIORS: do not model
-- the individual, model a small number of interest GROUPS and represent the
-- individual as a DISTRIBUTION over them, leaning on the group term in
-- proportion to how little you know about her.
--
--   · Alibaba, HIM (arXiv 2012.14770) — explicitly targets users with fewer
--     than three interactions. Each user is a distribution over learned
--     interest groups, drawn toward the max-activation group, with the group
--     term weighted MORE heavily the sparser the individual. A/B'd on Lazada;
--     the gains concentrated in the sparse tail, which is Revelle's whole
--     population.
--   · Taobao, ChoirRec (2025) — reached the same mechanism independently, with
--     the cohorts formed by an LLM rather than learned end to end. +7.24%
--     orders on low-activity users.
--   · Alimama, Cold-Transformer — for cold users, NEGATIVE feedback (an
--     impression that did not convert) is first-class signal, weighted as
--     heavily as a positive. A "no" from someone who has said almost nothing
--     is worth as much as her "yes".
--
-- Revelle has a structural advantage over all three papers: those systems must
-- LEARN their cohorts, so they cannot exist until there is data. Revelle has a
-- human curator who can SEED AND CORRECT cohorts by hand on day one. So the
-- schema is built so that hand-authoring a cohort is as natural as computing
-- one — same table, same columns, `provenance` tells them apart, and nothing in
-- the design requires a single row of behavioural data to be useful.
--
-- What this migration does NOT contain, on purpose: inference, scoring,
-- ranking, matching, any notion of a model. It contains the PLACE those things
-- will read from and write to, and the constraints that keep them honest.
--
-- ─────────────────────────────────────────────────────────────────────
-- THE SECOND IDEA — ONE VOCABULARY, SHARED BY EVERYTHING
--
-- 001 stores taste vocabularies as `text[]` validated only by src/lib/quiz.ts.
-- That was the right call for churn (renaming a taste direction must not be a
-- migration) and it stays right for the immutable evidentiary record. But it
-- buys churn at the cost of INTEGRITY: nothing stops a typo, nothing connects
-- the string 'faded_coastal' in a quiz answer to the string 'faded_coastal' on
-- a product, and matching a catalogue to a customer would mean reconciling free
-- text by hand, forever.
--
-- So this migration promotes the vocabulary to a table — `facet` — WITHOUT
-- taking the churn benefit away:
--
--   · Adding a taste term is still `insert into facet ...`. Not a migration.
--   · Renaming a label is still an update. Codes are permanent, labels are not.
--   · Retiring a term is `status = 'deprecated'`. The row STAYS, so every
--     historical reference to it keeps resolving. Nothing is ever orphaned.
--   · The DIMENSION (taste direction / occasion / mood / season / …) is data
--     too — a row in facet_dimension, not a table per dimension and not an
--     enum. Adding "formality" is an insert.
--
-- And then EVERY pooled ingredient tags against that same table: worlds,
-- products, cohorts today; games, rituals, hosting ideas, music direction,
-- downloadable assets when they get tables. A quiz answer, a world, a cohort
-- and a product that are all "faded coastal" now point at ONE ROW, which is
-- what makes cohort → ingredient matching a set operation later instead of a
-- string-matching research project.
--
-- ─────────────────────────────────────────────────────────────────────
-- WHY PER-TYPE JOIN TABLES AND NOT ONE POLYMORPHIC TAG TABLE
--
-- The obvious shape is one `entity_tag (entity_type, entity_id, facet_id)`
-- table. It is rejected here: PostgreSQL cannot put a foreign key on a
-- polymorphic entity_id, so the one thing this whole migration exists to buy —
-- referential integrity — is the exact thing that shape gives up. A deleted
-- world would leave live tag rows pointing at nothing, and the first bug would
-- be silent rather than loud.
--
-- Instead there is ONE PATTERN, applied by `install_facet_tags(...)`: each
-- taggable entity gets its own `<entity>_facet` join table with real foreign
-- keys on both sides, identical columns, identical indexes. Adding a new
-- ingredient type is two lines (create the table, call the installer), and
-- `facet_tag` — a generated UNION ALL view over the registry — gives back the
-- single cross-ingredient surface that the polymorphic design would have
-- offered, for reads, where integrity is not at stake.
--
-- ─────────────────────────────────────────────────────────────────────
-- CONTENTS
--
--   facet_dimension           the axes of the vocabulary — data, not enums
--   facet                     the vocabulary itself. one row per concept
--   facet_tag_entity          registry of what is taggable
--   <entity>_facet            the join tables, one shape, one installer
--   facet_tag                 read-only union across all of them
--   quiz_option_facet         quiz option code -> facet, by FK
--   quiz_response_facet       a submitted answer, resolved to facets (view)
--   taste_cohort              the priors. hand-authorable with zero data
--   customer_cohort_affinity  the DISTRIBUTION, layered by source
--   taste_signal              every yes and every no, with supersession
--   product                   the first ingredient pool
--
-- ─────────────────────────────────────────────────────────────────────

-- ── enums ────────────────────────────────────────────────────────────
--
-- Same test as 001: an enum only where the value set is genuinely closed and
-- structural. Everything churn-prone below is a row, not an enum value.

-- WHERE A CLAIM ABOUT TASTE CAME FROM. One enum, used by every table in this
-- file that records an opinion, because "who said this" is the same question
-- everywhere and answering it differently per table is how provenance rots.
--
-- The ordering of the values is deliberate and load-bearing: it is the
-- precedence order used by customer_cohort_affinity_effective. A human beats a
-- form, a form beats a guess, and a guess about her beats an assumption
-- borrowed from her cohort.
create type taste_provenance as enum (
  'curator',      -- a person with a point of view said so, and signed it
  'quiz',         -- she said so, in an answer, against a known question set
  'observed',     -- she did so: opened it, bought it, ignored it
  'inferred',     -- computed from her own history by some model version
  'cohort_prior'  -- inherited from a cohort. NOT observed on her at all
);

-- Deprecated is not deleted. A deprecated facet keeps resolving for every row
-- that already references it; it is simply not offered for new tagging.
create type facet_status as enum ('active', 'deprecated');

create type cohort_status as enum ('draft', 'active', 'retired');

create type product_status as enum ('draft', 'active', 'discontinued');

-- Cold-Transformer's point, encoded: a negative is a signal, not the absence of
-- one. There is deliberately no 'neutral' — an observation that carries no
-- information is not recorded. An impression she ignored is a NEGATIVE with a
-- low `strength`, which is a different statement from "we learned nothing".
create type signal_polarity as enum ('positive', 'negative');

-- WHERE she expressed it. This is closed because each context has a different
-- evidential weight and a different renderer in the curator's tool.
--
-- 'curator_direction' is the highest-value row in this system. The brief's flow
-- shows her a world BEFORE she buys; a "no" at that moment is a considered
-- rejection of a specific human proposal, which is worth more than any number
-- of unclicked impressions. It is listed here so that such a rejection is
-- recordable even when the thing rejected never became a `world` row — see
-- taste_signal.subject_label.
create type signal_context as enum (
  'quiz_option',        -- she picked it, or picked it under "what would ruin it"
  'quiz_free_text',     -- the secret, read by a human and turned into a claim
  'curator_direction',  -- a proposal we showed her before purchase
  'world_proposal',     -- a specific world we offered
  'product_offer',      -- a specific item in the edit
  'delivered_revelle',  -- something inside a Revelle she actually received
  'conversation',       -- she said it in an email or on the phone
  'cohort_prior'        -- not observed on her: assumed from her cohort
);

-- What an item in the edit costs, banded. Distinct from budget_band in 001,
-- which is the budget for a whole EVENT — conflating a $40 candle with a $4,000
-- weekend would make both bands useless.
create type price_band as enum (
  'under_25',
  'from_25_to_75',
  'from_75_to_200',
  'from_200_to_500',
  'over_500'
);

-- ── shared helpers ───────────────────────────────────────────────────

-- Like set_updated_at, but also advances a revision counter — for tables where
-- "has this changed since the model last read it" must be answerable without
-- comparing whole rows. The `is not distinct from` guard lets a caller set the
-- revision explicitly (a bulk re-import) without it being double-bumped.
create or replace function bump_revision_and_touch() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  if new.revision is not distinct from old.revision then
    new.revision := old.revision + 1;
  end if;
  return new;
end;
$$;

-- THE CURATOR FLAG.
--
-- Several guards below distinguish "a human is deliberately editing this" from
-- "a batch job is recomputing". The distinction cannot be inferred from the SQL
-- itself, so it is carried on the session:
--
--     set local revelle.curator = 'on';
--
-- `set local` means it lasts one transaction and cannot leak into the next
-- statement on a pooled connection. The curator tool sets it; the recompute job
-- must never set it. That asymmetry is the entire enforcement mechanism, and it
-- is a mechanism rather than a convention because the database raises.
create or replace function curator_session() returns boolean
language sql stable as $$
  select coalesce(current_setting('revelle.curator', true), '') = 'on';
$$;

-- ── facet_dimension ──────────────────────────────────────────────────
--
-- The AXES of the vocabulary, as data.
--
-- Modelling the dimension as rows rather than as separate tables (or an enum)
-- is the difference between "add a formality axis" being an insert and being a
-- migration plus a deploy. The brief's own list — taste direction, environment,
-- occasion, mood, formality, activity type, palette, season — is not finished
-- and will never be finished, which is precisely the argument.

create table facet_dimension (
  -- Permanent, machine-stable. Appears in code and in URLs; never reworded.
  code        text primary key check (code ~ '^[a-z][a-z0-9_]*$'),
  label       text not null,
  description text not null default '',
  -- Presentation order in the curator's tool. Deferrable because reordering a
  -- list means several rows swapping numbers inside one transaction.
  position    integer not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint facet_dimension_position_unique unique (position)
    deferrable initially deferred
);

create trigger facet_dimension_touch before update on facet_dimension
  for each row execute function set_updated_at();

-- ── facet ────────────────────────────────────────────────────────────
--
-- THE CONTROLLED VOCABULARY. One row per concept, and every part of the system
-- that has an opinion about taste points at these rows.
--
-- Read the "ONE VOCABULARY" note at the top for why this exists at all. Three
-- rules govern it:
--
--   1. `code` is PERMANENT within its dimension, exactly like a quiz option
--      code in src/lib/quiz.ts. Labels are free to be reworded at any time;
--      codes are not. If a code's MEANING changes, deprecate it and add a new
--      one — do not redefine it underneath the history that references it.
--   2. Deprecating NEVER orphans. `status = 'deprecated'` hides a facet from
--      new tagging; every existing reference keeps resolving to the same row
--      with the same meaning. Every foreign key pointing here is `on delete
--      restrict`, so the delete that would orphan history simply fails.
--   3. Adding a term is an INSERT. That is the whole reason this table can
--      replace `text[]` without giving up what `text[]` was chosen for.

create table facet (
  id             uuid primary key default gen_random_uuid(),
  dimension_code text not null references facet_dimension(code) on delete restrict,
  -- Unique within the dimension, not globally: 'beach' is a legitimate
  -- environment AND a legitimate mood, and forcing them to differ would mean
  -- inventing ugly prefixes for a collision the dimension already resolves.
  code           citext not null check (code ~ '^[a-z][a-z0-9_]*$'),
  label          text not null,
  -- The hint line from the quiz, or the curator's gloss. This is what a human
  -- reads when deciding whether a product is "faded coastal".
  description    text not null default '',

  status         facet_status not null default 'active',
  -- 'curator' for a hand-authored term, 'inferred' for one a clustering job
  -- proposed. Seeded rows below are 'quiz' — they are the vocabulary the quiz
  -- was already shipping, promoted rather than invented.
  provenance     taste_provenance not null default 'curator',

  -- Internal only. Never rendered to a customer.
  notes          text,

  deprecated_at  timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint facet_code_unique_in_dimension unique (dimension_code, code),
  constraint facet_deprecated_has_timestamp
    check ((status = 'deprecated') = (deprecated_at is not null))
);

create trigger facet_touch before update on facet
  for each row execute function set_updated_at();

create index facet_dimension_idx on facet (dimension_code, status, label);
create index facet_active_idx on facet (status) where status = 'active';

-- ── the tagging pattern ──────────────────────────────────────────────
--
-- See "WHY PER-TYPE JOIN TABLES" at the top. One installer, one shape, real
-- foreign keys on both sides.

create table facet_tag_entity (
  -- The table being tagged, e.g. 'world'.
  entity_table text primary key check (entity_table ~ '^[a-z][a-z0-9_]*$'),
  -- Always entity_table || '_facet'. Stored rather than recomputed so the
  -- union view below can be generated from this table alone.
  join_table   text not null unique,
  -- What a curator calls this pool: "Creative worlds", "The edit".
  label        text not null,
  created_at   timestamptz not null default now()
);

-- Creates `<entity>_facet` with a foreign key to <entity>(id) and to facet(id),
-- a weight, provenance, and its indexes; then registers it.
--
-- `weight` is signed and runs -1..1, excluding zero:
--
--   +1.0  this IS the thing. A world that is the definition of faded coastal.
--   +0.2  incidentally so. It would not look wrong at that party.
--   -1.0  actively repudiates it. This is what makes a cohort like "Coastal
--         restraint" expressible: strongly `faded_coastal`, strongly NOT
--         `tropical_maximal`. A tag with weight zero says nothing, so it is
--         not a row.
--
-- Adding a new ingredient pool (games, rituals, hosting ideas, music
-- direction, downloadable assets) is: create its table with a uuid `id`, call
-- this function, call rebuild_facet_tag_view(). Nothing else in this file
-- changes and nothing that reads `facet_tag` needs to know it happened.
create or replace function install_facet_tags(p_entity_table text, p_label text)
returns void
language plpgsql as $$
declare
  v_join   text := p_entity_table || '_facet';
  v_column text := p_entity_table || '_id';
begin
  execute format($ddl$
    create table %I (
      %I          uuid not null references %I(id) on delete cascade,
      facet_id    uuid not null references facet(id) on delete restrict,
      weight      numeric(4,3) not null default 1.000,
      provenance  taste_provenance not null default 'curator',
      -- Why this tag, in the curator's words. Optional, and worth more than it
      -- looks: it is the only place the reasoning behind a hand tag survives.
      note        text,
      created_at  timestamptz not null default now(),
      updated_at  timestamptz not null default now(),

      primary key (%I, facet_id),
      constraint %I check (weight >= -1 and weight <= 1 and weight <> 0)
    )$ddl$,
    v_join, v_column, p_entity_table, v_column, v_join || '_weight_signed');

  -- Entity -> facets is the primary key. This is the other direction:
  -- "everything tagged faded coastal, strongest first", which is the read the
  -- eventual matcher lives on.
  execute format(
    'create index %I on %I (facet_id, weight desc)',
    v_join || '_facet_idx', v_join);

  execute format(
    'create trigger %I before update on %I
       for each row execute function set_updated_at()',
    v_join || '_touch', v_join);

  insert into facet_tag_entity (entity_table, join_table, label)
  values (p_entity_table, v_join, p_label);
end;
$$;

-- Regenerates the read-only `facet_tag` view across every registered pool.
-- Called at the bottom of this file and by any future migration that installs
-- another pool. `create or replace view` is safe here because the column list
-- is fixed by this function — only the number of UNION branches changes.
create or replace function rebuild_facet_tag_view() returns void
language plpgsql as $$
declare
  v_sql text;
begin
  select string_agg(
           format(
             'select %L::text as entity_table, %I as entity_id, facet_id, ' ||
             'weight, provenance, note, created_at from %I',
             e.entity_table, e.entity_table || '_id', e.join_table),
           e'\n  union all\n'
           order by e.entity_table)
    into v_sql
    from facet_tag_entity e;

  if v_sql is null then
    raise exception 'rebuild_facet_tag_view: no pools registered — nothing to union';
  end if;

  execute format('create or replace view facet_tag as %s', v_sql);
end;
$$;

-- ── quiz_option_facet ────────────────────────────────────────────────
--
-- THE BRIDGE. A quiz option code resolves to a facet by foreign key, so an
-- answer resolves to vocabulary automatically and a typo in a seed is a
-- constraint violation rather than a row nobody ever matches.
--
-- What deliberately does NOT change: quiz_response keeps its `text[]` columns
-- and stays append-only. Those arrays are the EVIDENTIARY record of what she
-- was shown and picked, against `quiz_version`. Rewriting them into facet ids
-- would destroy exactly the property 001 was built to protect, and would make a
-- later vocabulary change silently rewrite history. The arrays are what
-- happened; this table is what it MEANS; the view below joins the two on
-- demand. Deprecating a facet therefore cannot alter a single stored answer.
--
-- src/lib/quiz.ts keeps its option list for ordering, hints, images and
-- client-side validation. The database is the source of truth for what a term
-- IS; the module is the source of truth for how it is PRESENTED. scripts/
-- check-facets.mjs fails loudly if the two drift.

create table quiz_option_facet (
  -- QuizField.id in src/lib/quiz.ts — 'taste_directions', 'occasion', …
  quiz_field      text not null check (quiz_field ~ '^[a-z][a-z0-9_]*$'),
  -- QuizOption.code. Permanent by the contract already stated in quiz.ts.
  option_code     citext not null,
  facet_id        uuid not null references facet(id) on delete restrict,

  -- What CHOOSING this option asserts. The contrast question is the reason this
  -- column exists: picking 'costumes' under "what would ruin it" is a NEGATIVE
  -- about the same facet that another woman picks positively elsewhere. Without
  -- this, resolving her answers to facets would silently invert half of them.
  answer_polarity signal_polarity not null default 'positive',

  created_at      timestamptz not null default now(),

  primary key (quiz_field, option_code)
);

create index quiz_option_facet_facet_idx on quiz_option_facet (facet_id);

-- ── taste_cohort ─────────────────────────────────────────────────────
--
-- THE PRIORS.
--
-- A named taste grouping — "Coastal restraint", "Maximalist nostalgia" — that
-- a customer can be partly a member of. This is the table the sparsity argument
-- at the top of this file is about: when a woman has told us nine things, the
-- useful statement is not "here is her model" but "she is 0.6 this kind of
-- person, 0.3 that kind, 0.1 the other", and the cohort carries the taste that
-- her own nine data points cannot.
--
-- MUST BE USEFUL WITH ZERO DATA. Every column below is fillable by a human with
-- an opinion and no dataset. `provenance = 'curator'` and `provenance =
-- 'inferred'` sit in the same table with the same shape on purpose: when a
-- clustering job eventually proposes cohorts, they arrive as peers of the
-- hand-authored ones and a curator can retire, rename, or re-characterise them
-- with the same tools. There is no "real" cohort table that the hand-authored
-- ones are a stand-in for.
--
-- A cohort characterises itself in taste_cohort_facet — the SAME vocabulary
-- products and worlds are tagged with. That is deliberate and is the point of
-- the whole facet layer: cohort → ingredient matching later is a set operation
-- over shared rows, not a fuzzy match over strings.

create table taste_cohort (
  id            uuid primary key default gen_random_uuid(),
  -- Stable, human-typeable, used in internal URLs and in the jsonb payload
  -- accepted by replace_cohort_affinity(). Never reused.
  slug          citext not null unique check (slug ~ '^[a-z][a-z0-9-]*$'),
  -- "Coastal restraint"
  name          text not null,
  -- What the group is, for anyone who has to use it.
  description   text not null default '',
  -- THE CURATOR'S CHARACTERISATION, in her own voice — the paragraph that says
  -- what this woman is like, which no weight vector will ever say. Kept
  -- separate from `description` because one is documentation and the other is
  -- the creative brief a writer works from.
  curator_note  text not null default '',

  -- Hand-authored or derived. Constrained to those two: 'quiz' and 'observed'
  -- describe an individual's statement, not the origin of a group, and
  -- 'cohort_prior' would be circular.
  provenance    taste_provenance not null default 'curator'
    check (provenance in ('curator', 'inferred')),
  -- Which clustering run proposed it. Null for hand-authored, always.
  model_version text,

  status        cohort_status not null default 'draft',
  -- Bumped by trigger on every edit. A cached affinity computed against
  -- revision 3 of a cohort is stale when the cohort reaches revision 4, and
  -- that is answerable without diffing rows.
  revision      integer not null default 1,

  created_by    text not null default 'curator',
  activated_at  timestamptz,
  retired_at    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint taste_cohort_hand_authored_has_no_model
    check ((provenance = 'inferred') or model_version is null),
  -- Not written as an equality (unlike world_published_has_timestamp in 001)
  -- because a cohort has THREE states and a retired cohort must keep the date
  -- it went live. An equality here would force us to erase that on retirement.
  constraint taste_cohort_active_has_timestamp
    check (status <> 'active' or activated_at is not null),
  constraint taste_cohort_retired_has_timestamp
    check ((status = 'retired') = (retired_at is not null))
);

create trigger taste_cohort_bump before update on taste_cohort
  for each row execute function bump_revision_and_touch();

create index taste_cohort_status_idx on taste_cohort (status, name);
create index taste_cohort_provenance_idx on taste_cohort (provenance, status);

-- ── product ──────────────────────────────────────────────────────────
--
-- THE FIRST INGREDIENT POOL.
--
-- The brief's proprietary library is many pools — creative worlds (already in
-- 001), visual systems, games, social rituals, hosting ideas, personal hooks,
-- music direction, product edits, downloadable assets. Products are the one
-- being built first, and they are built as an ordinary pool so that the next
-- eight are a table plus one call to install_facet_tags().
--
-- Only three pools are given join tables in this migration — world, product,
-- taste_cohort — because those are the three that exist. Creating six empty
-- speculative tables would not make the seventh cheaper; the installer is what
-- makes it cheap.
--
-- There is deliberately NO matching, scoring or ranking here. What this table
-- guarantees is that when the selection algorithm is written, it can be
-- deterministic: the customer's cohorts and the product's tags are rows in the
-- same vocabulary, so "which products suit her" is a join, not a judgement call
-- rendered in code.

create table product (
  id            uuid primary key default gen_random_uuid(),
  slug          citext not null unique check (slug ~ '^[a-z][a-z0-9-]*$'),
  name          text not null,
  description   text not null default '',

  -- Where she actually buys it. Not a checkout — Revelle sends her to the
  -- source, so this is the whole commerce integration for now.
  external_url  text,
  image_url     text,

  -- Band for filtering, exact figure for the edit's line items. Both nullable:
  -- a curator adds a thing she saw before she has looked up the price.
  price_band    price_band,
  price_cents   integer check (price_cents is null or price_cents >= 0),
  currency      text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),

  -- Who it comes from, and anything internal about getting it: lead time,
  -- affiliate terms, the fact that it sells out every June.
  supplier      text,
  source_note   text,

  status        product_status not null default 'draft',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger product_touch before update on product
  for each row execute function set_updated_at();

create index product_status_idx on product (status, name);
create index product_price_idx on product (price_band, status);

-- ── the pools, tagged ────────────────────────────────────────────────
--
-- world already carries `taste_directions text[]` from 001. It is NOT dropped
-- here. The array stays as the staff filter the current tooling reads, and
-- world_facet becomes the integrity-bearing version; a later migration can drop
-- the array once nothing reads it. Removing a column that working code depends
-- on, in the same migration that introduces its replacement, is how a schema
-- change becomes an outage.

select install_facet_tags('world', 'Creative worlds');
select install_facet_tags('product', 'The edit');
select install_facet_tags('taste_cohort', 'Taste cohorts');

select rebuild_facet_tag_view();

-- ── customer_cohort_affinity ─────────────────────────────────────────
--
-- THE DISTRIBUTION, NOT AN ASSIGNMENT.
--
-- A customer is not "in" a cohort. She is 0.6 one, 0.3 another, 0.1 a third —
-- that is the HIM formulation, and it is the difference between a system that
-- degrades gracefully on someone it barely knows and one that guesses hard and
-- is wrong.
--
-- ── HOW A CURATOR OVERRIDE SURVIVES A RECOMPUTE ─────────────────────
--
-- This is the design decision the table is shaped around, and it is solved
-- structurally rather than by hoping the recompute job remembers.
--
-- The primary key includes `source`. A customer therefore has up to one row per
-- cohort PER LAYER: what the quiz implies, what a model inferred, and what the
-- curator says. These are not competing values of one field, they are separate
-- claims by separate authorities, and they coexist.
--
--   · A recompute rewrites ONLY ITS OWN LAYER:
--         delete from customer_cohort_affinity
--          where customer_id = $1 and source = 'inferred';
--     The curator's row is not in that statement's scope. It is not "protected
--     from" the delete; it is not addressed by it.
--
--   · A recompute that FORGETS the source filter — the actual failure mode,
--     the one that silently erases a person's judgement six months after she
--     recorded it — hits customer_cohort_affinity_protect_curator() and
--     RAISES. The job fails loudly at 3am instead of quietly deleting taste.
--     Editing or deleting a curator row requires `set local revelle.curator =
--     'on'`, which the curator tool sets and a batch job has no reason to.
--
--   · Reads go through customer_cohort_affinity_effective, which picks one row
--     per cohort in taste_provenance order — curator first. So an override
--     wins at read time even while the inferred layer keeps being rewritten
--     underneath it, and the moment the curator row is deleted the computed
--     value reappears rather than leaving a hole.
--
-- ── WHY THE WEIGHTS ARE NOT CONSTRAINED TO SUM TO 1 ─────────────────
--
-- Because a cross-row sum constraint would make single-row editing impossible:
-- a curator adding a fourth cohort at 0.1 would have to rebalance the other
-- three in the same statement, and any partial edit would be rejected. Worse,
-- the layers would have to sum to 1 independently, which is meaningless for a
-- curator who wants to say one thing and leave the rest computed.
--
-- The distribution is therefore DEFINED BY THE VIEW: `weight_share` normalises
-- across whatever the effective rows turn out to be. Storage holds claims;
-- normalisation is a read-time concern. `weight` stays 0..1 so that a raw
-- number is still interpretable on its own.

create table customer_cohort_affinity (
  customer_id   uuid not null references customer(id) on delete cascade,
  cohort_id     uuid not null references taste_cohort(id) on delete restrict,
  -- Part of the key. See above — this is the whole override mechanism.
  source        taste_provenance not null,

  weight        numeric(6,5) not null check (weight >= 0 and weight <= 1),
  -- How much we trust THIS claim, distinct from how strong it is. A curator who
  -- has met her: weight 0.8, confidence 0.95. A model on two quiz answers:
  -- weight 0.8, confidence 0.2. The sparser the individual, the lower this
  -- gets, and it is what a blender would use to lean on the cohort term.
  confidence    numeric(4,3) not null default 0.500
                  check (confidence >= 0 and confidence <= 1),

  -- Why. For a curator row this is the argument; for an inferred row, the
  -- features that drove it. Free text, because an explanation that fits a
  -- schema is usually not an explanation.
  rationale     text,
  -- A person's name for 'curator'; the job name for everything else.
  set_by        text not null default 'system',
  set_at        timestamptz not null default now(),
  -- Which derivation produced it. Null for curator rows, always.
  model_version text,
  -- The cohort revision this was computed against. When the cohort is edited
  -- past this, the row is stale — answerable without recomputing anything.
  cohort_revision integer,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  primary key (customer_id, cohort_id, source),

  constraint customer_cohort_affinity_curator_has_no_model
    check (source <> 'curator' or model_version is null),
  constraint customer_cohort_affinity_curator_is_signed
    check (source <> 'curator' or (set_by is not null and btrim(set_by) <> ''))
);

create trigger customer_cohort_affinity_touch before update on customer_cohort_affinity
  for each row execute function set_updated_at();

-- The read: her whole distribution, heaviest first.
create index customer_cohort_affinity_customer_idx
  on customer_cohort_affinity (customer_id, weight desc);
-- The inverse read: who is in this cohort. Needed to build a cohort's
-- aggregate behaviour later, and to answer "who did I hand-place here".
create index customer_cohort_affinity_cohort_idx
  on customer_cohort_affinity (cohort_id, source, weight desc);
-- Recompute's own scan: "every row this layer owns".
create index customer_cohort_affinity_source_idx
  on customer_cohort_affinity (source, model_version);

-- The guard described above. Note it fires on UPDATE and DELETE only: a
-- recompute may freely INSERT its own layer, and inserting a 'curator' row is
-- how the curator tool creates an override in the first place.
create or replace function customer_cohort_affinity_protect_curator()
returns trigger
language plpgsql as $$
begin
  if old.source <> 'curator' or curator_session() then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  raise exception
    'customer % has a curator override on cohort % (set by %, %). A recompute '
    'must scope itself with `and source = ''inferred''` — human judgement is '
    'not recomputed. To edit it deliberately: set local revelle.curator = ''on''.',
    old.customer_id, old.cohort_id, old.set_by, old.set_at::date;
end;
$$;

create trigger customer_cohort_affinity_no_clobber
  before update or delete on customer_cohort_affinity
  for each row execute function customer_cohort_affinity_protect_curator();

-- THE EFFECTIVE DISTRIBUTION. One row per (customer, cohort), highest-authority
-- layer winning, normalised across whatever survives.
--
-- Precedence is the declaration order of taste_provenance, which is why that
-- enum's order is written the way it is. `weight_share` is the number a
-- downstream blender should use; `weight` is the raw claim.
create view customer_cohort_affinity_effective as
with picked as (
  select distinct on (a.customer_id, a.cohort_id) a.*
    from customer_cohort_affinity a
   order by a.customer_id, a.cohort_id, a.source, a.set_at desc
)
select p.customer_id,
       p.cohort_id,
       c.slug   as cohort_slug,
       c.name   as cohort_name,
       c.status as cohort_status,
       p.source,
       p.weight,
       p.weight / nullif(sum(p.weight) over (partition by p.customer_id), 0)
         as weight_share,
       p.confidence,
       p.rationale,
       p.set_by,
       p.set_at,
       -- True when a human has overruled whatever the machine said. Surfaced so
       -- the curator's tool can show it without re-deriving the precedence
       -- rule, and so a recompute can report how much of its output is unused.
       exists (
         select 1 from customer_cohort_affinity o
          where o.customer_id = p.customer_id
            and o.cohort_id   = p.cohort_id
            and o.source     <> p.source
       ) as has_other_layers
  from picked p
  join taste_cohort c on c.id = p.cohort_id;

-- The correct way to rewrite one layer, provided so that the correct way is
-- also the easy way. Deletes and re-inserts ONLY `p_source`; a curator layer is
-- outside its scope by construction, so it cannot erase judgement even if
-- called carelessly.
--
--   select replace_cohort_affinity(
--     '<customer uuid>', 'inferred',
--     '{"coastal-restraint": 0.6, "maximalist-nostalgia": 0.3}'::jsonb,
--     'v1-quiz-overlap', 0.35);
--
-- Keyed by cohort SLUG rather than uuid so the payload is legible in a log and
-- writable by hand. An unknown slug raises rather than being skipped: a
-- recompute that silently drops a cohort is worse than one that fails.
create or replace function replace_cohort_affinity(
  p_customer      uuid,
  p_source        taste_provenance,
  p_weights       jsonb,
  p_model_version text default null,
  p_confidence    numeric default 0.500
) returns integer
language plpgsql as $$
declare
  v_written integer;
begin
  if p_source = 'curator' then
    raise exception
      'replace_cohort_affinity is for computed layers. Curator rows are written '
      'one at a time, with a rationale and a name attached.';
  end if;

  delete from customer_cohort_affinity
   where customer_id = p_customer and source = p_source;

  insert into customer_cohort_affinity
    (customer_id, cohort_id, source, weight, confidence, set_by, model_version,
     cohort_revision)
  select p_customer, c.id, p_source, (w.value)::numeric, p_confidence,
         coalesce(p_model_version, p_source::text), p_model_version, c.revision
    from jsonb_each_text(p_weights) as w(key, value)
    join taste_cohort c on c.slug = w.key;

  get diagnostics v_written = row_count;

  if v_written <> (select count(*) from jsonb_each_text(p_weights)) then
    raise exception 'replace_cohort_affinity: unknown cohort slug in %', p_weights;
  end if;

  return v_written;
end;
$$;

-- ── taste_signal ─────────────────────────────────────────────────────
--
-- EVERY YES AND EVERY NO, WITH A DATE ON IT.
--
-- Before this table, a rejection lived inside quiz_response.answers as an
-- element of an `anti_preferences` array — unqueryable except by digging
-- through jsonb, unweightable, and impossible to record at all unless it
-- happened during the quiz. That last part is the expensive one: the brief's
-- flow shows her a WORLD BEFORE SHE BUYS, and her "no" at that moment is the
-- single highest-value signal the business generates. It is a considered
-- rejection of a specific human proposal by a woman who is paying attention.
-- There was nowhere to put it.
--
-- Now every reaction — hers or a curator's claim about her — is a row:
-- WHAT (facet, and/or the concrete thing), HOW STRONGLY, IN WHAT CONTEXT,
-- FROM WHOM, and WHEN.
--
-- ── SUPERSESSION ────────────────────────────────────────────────────
--
-- Tastes change. Averaging a 2026 preference with a 2029 one produces a number
-- that describes nobody. So a later signal may SUPERSEDE an earlier one:
-- `superseded_by` points at the row that replaced it, the old row is RETAINED
-- and remains readable, and every "what does she like now" read filters on
-- `superseded_by is null`.
--
-- Retained, not deleted, because the history is the evidence — "she loved
-- disco in 2026 and stopped by 2029" is a different and more useful fact than
-- "she does not like disco", and only one of them survives a delete.
--
-- ── WHAT MAY BE DELETED ─────────────────────────────────────────────
--
-- The rule, enforced by taste_signal_guard():
--
--   IF IT CAN BE REBUILT FROM IMMUTABLE HISTORY, IT MAY BE DELETED.
--   IF IT IS ITSELF THE ONLY RECORD, IT MAY NOT.
--
--   deletable   'quiz'         — regenerable from quiz_response, which is
--                                append-only and cannot lie
--               'inferred'     — a model's output; a new model version
--                                replaces it wholesale
--               'cohort_prior' — an assumption, not an observation
--
--   permanent   'curator'      — a person's judgement, recorded once
--               'observed'     — something she actually did, which happened
--                                once and is not re-derivable from anything
--
-- This is the same principle 001 states for taste_profile ("losing it costs
-- compute, not truth"), applied one level down. Substantive columns are frozen
-- after insert for every source; only supersession and the note may change.

create table taste_signal (
  id            uuid primary key default gen_random_uuid(),
  customer_id   uuid not null references customer(id) on delete cascade,

  -- The vocabulary term this is about. `on delete restrict` — see rule 2 on
  -- facet: deprecating never orphans, and deleting is simply not possible once
  -- anything references it.
  facet_id      uuid references facet(id) on delete restrict,
  -- What she said when the vocabulary had no word for it yet. This is the
  -- intake queue for new facets: a curator reads these and promotes the ones
  -- that recur into facet rows. Without it, the controlled vocabulary would
  -- quietly discard everything it cannot already express.
  free_text     text,

  polarity      signal_polarity not null,
  -- How strongly. An impression she scrolled past is a negative at 0.1; "not
  -- that, ever" is a negative at 1.0. Strictly positive because a zero-strength
  -- signal is the absence of a signal and should not be a row.
  strength      numeric(4,3) not null default 1.000
                  check (strength > 0 and strength <= 1),
  -- How sure we are that the signal is real, as opposed to how strong it is.
  -- A curator inferring distaste from a one-line email: strength 0.8,
  -- confidence 0.3.
  confidence    numeric(4,3) not null default 1.000
                  check (confidence > 0 and confidence <= 1),

  context       signal_context not null,
  source        taste_provenance not null,

  -- The concrete thing she reacted to, when there is one. All nullable and not
  -- mutually exclusive: a curator direction can legitimately cite a world AND
  -- an item from its edit in one breath.
  quiz_response_id uuid references quiz_response(id) on delete restrict,
  world_id         uuid references world(id) on delete restrict,
  revelle_id       uuid references revelle(id) on delete cascade,
  product_id       uuid references product(id) on delete restrict,
  cohort_id        uuid references taste_cohort(id) on delete restrict,
  -- The proposal that has no row anywhere — the sketch in an email, the idea
  -- described on a call. "A brass-and-marble bar cart with a hired pianist."
  -- Requiring a foreign key here would mean the most valuable rejections in the
  -- system are the ones we cannot record, so this column exists precisely to
  -- keep pre-purchase curator directions recordable before they are built.
  subject_label    text,

  -- The reasoning, the quote, the exact words she used.
  note          text,
  -- Which derivation produced it, for 'inferred'.
  model_version text,

  -- When it HAPPENED, versus when we wrote it down. A curator entering a
  -- three-week-old phone call must be able to date it correctly, or
  -- supersession orders itself by data-entry order instead of by taste.
  observed_at   timestamptz not null default now(),
  recorded_at   timestamptz not null default now(),

  superseded_by uuid references taste_signal(id) on delete set null,
  superseded_at timestamptz,

  -- A signal about nothing is not a signal. At least one of: a vocabulary term,
  -- her own words, a named proposal, or a concrete thing.
  constraint taste_signal_has_a_subject check (
    facet_id is not null or free_text is not null or subject_label is not null
    or world_id is not null or product_id is not null or cohort_id is not null
  ),
  constraint taste_signal_supersession_paired
    check ((superseded_by is null) = (superseded_at is null)),
  constraint taste_signal_not_self_superseding
    check (superseded_by is distinct from id),
  constraint taste_signal_inferred_has_model
    check (source <> 'inferred' or model_version is not null)
);

-- Her history, newest first.
create index taste_signal_customer_idx on taste_signal (customer_id, observed_at desc);
-- THE profile read: what is true about her now.
create index taste_signal_current_idx on taste_signal (customer_id, facet_id)
  where superseded_by is null;
-- Cold-Transformer's read, given its own index because negatives are first
-- class here and not a filtered afterthought: "who else rejected this, and how
-- recently".
create index taste_signal_negative_idx on taste_signal (facet_id, observed_at desc)
  where polarity = 'negative' and superseded_by is null;
-- "Show me every pre-purchase direction that was turned down" — the review that
-- tells a curator what she keeps getting wrong.
create index taste_signal_context_idx on taste_signal (context, polarity, observed_at desc);
create index taste_signal_supersedes_idx on taste_signal (superseded_by)
  where superseded_by is not null;

create or replace function taste_signal_guard() returns trigger
language plpgsql as $$
declare
  v_successor taste_signal%rowtype;
begin
  if tg_op = 'DELETE' then
    if old.source in ('quiz', 'inferred', 'cohort_prior') then
      return old;
    end if;
    raise exception
      'taste_signal % is a % signal: it is the only record of what happened and '
      'may not be deleted. Supersede it instead.', old.id, old.source;
  end if;

  -- Frozen after insert. Listed explicitly, in the same spirit as
  -- quiz_response_guard in 001, so that adding a column is a deliberate
  -- decision about which side of this line it falls on.
  if new.customer_id   is distinct from old.customer_id
     or new.facet_id      is distinct from old.facet_id
     or new.free_text     is distinct from old.free_text
     or new.polarity      is distinct from old.polarity
     or new.strength      is distinct from old.strength
     or new.confidence    is distinct from old.confidence
     or new.context       is distinct from old.context
     or new.source        is distinct from old.source
     or new.subject_label is distinct from old.subject_label
     or new.observed_at   is distinct from old.observed_at
     or new.recorded_at   is distinct from old.recorded_at
  then
    raise exception
      'taste_signal % is a record of a moment: only supersession and the note '
      'may change. Insert a new signal instead.', old.id;
  end if;

  -- Keep the supersession pair honest without making every caller remember it.
  if new.superseded_by is null then
    new.superseded_at := null;
  elsif new.superseded_at is null then
    new.superseded_at := now();
  end if;

  if new.superseded_by is not null then
    select * into v_successor from taste_signal where id = new.superseded_by;

    if v_successor.customer_id <> old.customer_id then
      raise exception
        'taste_signal %: a signal may only be superseded by another signal '
        'about the SAME customer.', old.id;
    end if;

    -- Strictly earlier is the error; equal is allowed, because two signals
    -- written in one transaction share now(). Without this a backfill entered
    -- out of order could make a 2026 opinion overrule a 2029 one.
    if v_successor.observed_at < old.observed_at then
      raise exception
        'taste_signal %: superseded by % which was observed EARLIER (% < %). '
        'Tastes move forwards.',
        old.id, v_successor.id, v_successor.observed_at, old.observed_at;
    end if;
  end if;

  return new;
end;
$$;

create trigger taste_signal_no_delete before delete on taste_signal
  for each row execute function taste_signal_guard();

create trigger taste_signal_no_rewrite before update on taste_signal
  for each row execute function taste_signal_guard();

-- ── quiz_response_facet ──────────────────────────────────────────────
--
-- An immutable answer, resolved through the bridge into vocabulary — with the
-- contrast question's "not this" half arriving as NEGATIVES, automatically.
--
-- A view rather than a table because it must not be able to disagree with
-- quiz_response. It is also the definition of record for "what would rebuilding
-- her quiz signals produce", which is what makes source = 'quiz' rows in
-- taste_signal safe to delete and regenerate.

create view quiz_response_facet as
select qr.id          as quiz_response_id,
       qr.customer_id,
       qr.created_at  as observed_at,
       qr.quiz_version,
       src.quiz_field,
       ans.option_code,
       m.facet_id,
       f.dimension_code,
       f.code         as facet_code,
       f.label        as facet_label,
       f.status       as facet_status,
       m.answer_polarity as polarity
  from quiz_response qr
  cross join lateral (
    values ('taste_directions', qr.taste_directions),
           ('group_fun',        qr.group_fun),
           ('anti_preferences', qr.anti_preferences),
           ('affinities',       qr.affinities),
           ('occasion',         array[qr.occasion::text]),
           ('environment',      array[qr.environment::text]),
           ('budget',           array[qr.budget::text])
  ) as src(quiz_field, option_codes)
  cross join lateral unnest(src.option_codes) as ans(option_code)
  join quiz_option_facet m
    on m.quiz_field = src.quiz_field and m.option_code = ans.option_code
  join facet f on f.id = m.facet_id;

-- Materialises a quiz submission into taste_signal rows. Mechanical projection,
-- not inference: it copies what the view already says. Safe to re-run — it
-- deletes the 'quiz' layer for that response first, which the guard permits
-- precisely because quiz_response is append-only and can always rebuild it.
create or replace function record_quiz_signals(p_quiz_response_id uuid)
returns integer
language plpgsql as $$
declare
  v_written integer;
begin
  delete from taste_signal
   where quiz_response_id = p_quiz_response_id and source = 'quiz';

  insert into taste_signal
    (customer_id, facet_id, polarity, strength, confidence, context, source,
     quiz_response_id, observed_at)
  select v.customer_id, v.facet_id, v.polarity, 1.000, 1.000,
         'quiz_option', 'quiz', v.quiz_response_id, v.observed_at
    from quiz_response_facet v
   where v.quiz_response_id = p_quiz_response_id;

  get diagnostics v_written = row_count;
  return v_written;
end;
$$;

-- ── taste_profile, revisited ─────────────────────────────────────────
--
-- 001 created this as an empty landing place with the right instincts: derived,
-- versioned, reconstructible. Two things were missing, and both are about the
-- curator.
--
--   1. PROVENANCE AND SUPERSESSION PER SIGNAL. A blob of jsonb cannot say where
--      a preference came from, when, how confident we are, or that a later
--      statement replaced it. That is now taste_signal's job — one row per
--      claim, each dated and attributed — and `signals` here becomes purely a
--      cached ROLLUP of those rows. It stays reconstructible, and now it is
--      reconstructible from something that itself has provenance.
--
--   2. THE CURATOR COULD NOT WRITE HERE. She still should not write into
--      `signals` (it is derived, and a recompute would flatten her). She writes
--      taste_signal rows with source = 'curator', which are permanent, and
--      `curator_note` here for the prose that belongs to the person rather than
--      to any single signal. `is_locked` is the blunt instrument for the case
--      the model is embarrassing itself about a specific customer: the profile
--      is frozen until a human unlocks it, enforced below rather than
--      documented and hoped for.

alter table taste_profile
  -- The curator's standing note about this customer, in her own voice.
  add column curator_note text not null default '',
  -- Recompute must skip this row. Enforced by taste_profile_respect_lock().
  add column is_locked boolean not null default false,
  add column locked_by text,
  add column locked_at timestamptz,
  -- The newest taste_signal.observed_at that fed `signals`. Makes "is this
  -- profile behind her history" a comparison rather than a rebuild.
  add column signal_watermark timestamptz,
  add constraint taste_profile_lock_is_dated
    check (is_locked = (locked_at is not null));

comment on column taste_profile.signals is
  'Cached rollup of taste_signal rows where superseded_by is null. DERIVED — '
  'always rebuildable from taste_signal, which is itself rebuildable from '
  'quiz_response for the quiz layer. Losing this column costs compute, not '
  'truth. Curators do not write here; they write taste_signal rows.';

create or replace function taste_profile_respect_lock() returns trigger
language plpgsql as $$
begin
  if not old.is_locked or curator_session() then
    return new;
  end if;

  if new.signals       is distinct from old.signals
     or new.model_version is distinct from old.model_version
     or new.revision      is distinct from old.revision
     or new.computed_at   is distinct from old.computed_at
  then
    raise exception
      'taste_profile for customer % is locked by % since %. A recompute must '
      'skip locked profiles (`where not is_locked`). To edit deliberately: '
      'set local revelle.curator = ''on''.',
      old.customer_id, old.locked_by, old.locked_at::date;
  end if;

  return new;
end;
$$;

-- Ordering matters: this must run before taste_profile_touch bumps updated_at,
-- and PostgreSQL fires same-event triggers in name order. 'taste_profile_lock'
-- sorts before 'taste_profile_touch'.
create trigger taste_profile_lock before update on taste_profile
  for each row execute function taste_profile_respect_lock();

-- WHAT SHE LIKES NOW — the reconstructible profile, as rows.
--
-- Everything current, nothing superseded, every claim carrying its own
-- provenance and date. This is what a rollup job reads, and what a curator
-- reads when she wants to know why the system believes something.
create view taste_profile_current as
select ts.customer_id,
       ts.facet_id,
       f.dimension_code,
       f.code   as facet_code,
       f.label  as facet_label,
       f.status as facet_status,
       ts.polarity,
       ts.strength,
       ts.confidence,
       ts.source,
       ts.context,
       ts.observed_at,
       ts.subject_label,
       ts.note
  from taste_signal ts
  left join facet f on f.id = ts.facet_id
 where ts.superseded_by is null;

-- ── seed: the vocabulary the quiz already ships ──────────────────────
--
-- These are not invented terms — they are exactly the option lists in
-- src/lib/quiz.ts, promoted from strings in a TypeScript module to rows with
-- referential integrity. `provenance = 'quiz'` records that origin honestly.
--
-- Labels and descriptions are copied from the module's `label` and `hint`. If
-- the two ever drift, scripts/check-facets.mjs fails; the database wins on what
-- a term IS, the module wins on how it is PRESENTED.

insert into facet_dimension (code, label, description, position) values
  ('taste_direction', 'Taste direction',
   'The visual and emotional register of the thing. The quiz''s "which of these pulls at you".', 10),
  ('occasion', 'Occasion',
   'What is being marked. Mirrors occasion_type in 001.', 20),
  ('environment', 'Environment',
   'Where it happens. Mirrors environment_type in 001.', 30),
  ('group_fun', 'How the group has fun',
   'Observed behaviour of her people, not aspiration.', 40),
  ('anti_preference', 'Ruins it',
   'Things that end an evening. Referenced with negative polarity from the quiz, but the facets themselves are neutral concepts — one woman''s costume rule is another''s whole idea.', 50),
  ('affinity', 'Wants more of',
   'What she is buying, underneath the occasion.', 60),
  ('budget', 'Budget band',
   'Event-level spend. Mirrors budget_band in 001; distinct from a product''s price_band.', 70),
  -- Deliberately EMPTY on day one. They exist so that the first curator who
  -- needs "formality: black tie" inserts one row rather than writing a
  -- migration — which is the entire argument for dimensions being data.
  ('mood', 'Mood',
   'The feeling in the room. Empty until a curator needs it — add rows, not migrations.', 80),
  ('formality', 'Formality',
   'How dressed the evening is. Empty by design.', 90),
  ('palette', 'Palette',
   'Colour direction, shared between worlds and products. Empty by design.', 100),
  ('season', 'Season',
   'When a thing belongs. Empty by design.', 110);

insert into facet (dimension_code, code, label, description, provenance) values
  -- taste_direction — TASTE_DIRECTIONS in src/lib/quiz.ts
  ('taste_direction', 'old_world_riviera',  'Old-world Riviera',    'Linen, lemons, a lunch that runs long', 'quiz'),
  ('taste_direction', 'desert_modern',      'Desert modern',        'Low furniture, high sun, hard shadows', 'quiz'),
  ('taste_direction', 'disco_after_dark',   'Disco after dark',     'Mirror, low light, a floor that fills', 'quiz'),
  ('taste_direction', 'english_country',    'English country',      'Candles, chintz, dogs on the good sofa', 'quiz'),
  ('taste_direction', 'supper_club',        'Supper club',          'Red leather, martinis, someone at the piano', 'quiz'),
  ('taste_direction', 'tropical_maximal',   'Tropical maximalism',  'Print on print. Rum. Nothing restrained', 'quiz'),
  ('taste_direction', 'nordic_quiet',       'Nordic quiet',         'Pale wood, one perfect thing on the table', 'quiz'),
  ('taste_direction', 'deco_hotel',         'Deco hotel',           'Brass, marble, a bar that knows the order', 'quiz'),
  ('taste_direction', 'americana_backyard', 'Americana backyard',   'Checked cloth, corn, a very good pie', 'quiz'),
  ('taste_direction', 'moroccan_dusk',      'Moroccan dusk',        'Lanterns, low cushions, mint after dinner', 'quiz'),
  ('taste_direction', 'faded_coastal',      'Faded coastal',        'Salt on everything, bare feet by eight', 'quiz'),

  -- occasion — OCCASIONS, and the values of occasion_type in 001
  ('occasion', 'birthday',      'A birthday',        'Hers, or one she is throwing', 'quiz'),
  ('occasion', 'girls_weekend', 'A girls'' weekend', 'Two nights, one house', 'quiz'),
  ('occasion', 'dinner_party',  'A dinner party',    'One table, one evening', 'quiz'),
  ('occasion', 'getaway',       'A getaway',         'Somewhere that is not home', 'quiz'),
  ('occasion', 'anniversary',   'An anniversary',    'A year worth marking', 'quiz'),
  ('occasion', 'holiday',       'A holiday',         'The calendar made her do it', 'quiz'),
  ('occasion', 'bridal',        'Something bridal',  'Shower, weekend, the night before', 'quiz'),
  ('occasion', 'no_reason',     'No reason at all',  'The best kind', 'quiz'),
  ('occasion', 'other',         'Something else',    'Tell us in a word or two', 'quiz'),

  -- environment — ENVIRONMENTS, and the values of environment_type in 001
  ('environment', 'my_home',             'My home',             '', 'quiz'),
  ('environment', 'rented_house',        'A rented house',      '', 'quiz'),
  ('environment', 'city_apartment',      'A city apartment',    '', 'quiz'),
  ('environment', 'beach',               'The beach',           '', 'quiz'),
  ('environment', 'mountains',           'The mountains',       '', 'quiz'),
  ('environment', 'poolside',            'Poolside',            '', 'quiz'),
  ('environment', 'garden',              'A garden',            '', 'quiz'),
  ('environment', 'restaurant_or_venue', 'A restaurant or venue', '', 'quiz'),
  ('environment', 'hotel',               'A hotel',             '', 'quiz'),
  ('environment', 'not_decided',         'Still deciding',      '', 'quiz'),

  -- group_fun — GROUP_FUN
  ('group_fun', 'long_dinner',   'Sit at the table for five hours', '', 'quiz'),
  ('group_fun', 'dance',         'Dance without being asked twice', '', 'quiz'),
  ('group_fun', 'compete',       'Get genuinely competitive',       '', 'quiz'),
  ('group_fun', 'toast',         'Make speeches and toasts',        '', 'quiz'),
  ('group_fun', 'dress_up',      'Commit to an outfit',             '', 'quiz'),
  ('group_fun', 'perform',       'Sing, badly, on purpose',         '', 'quiz'),
  ('group_fun', 'talk_deep',     'Split into corners and talk properly', '', 'quiz'),
  ('group_fun', 'wander',        'End up somewhere unplanned',      '', 'quiz'),
  ('group_fun', 'swim_late',     'Swim long after dark',            '', 'quiz'),
  ('group_fun', 'cook_together', 'Crowd into the kitchen',          '', 'quiz'),

  -- anti_preference — ANTI_PREFERENCES. Neutral concepts; the POLARITY lives on
  -- the mapping, because the quiz asks about them in the negative.
  ('anti_preference', 'forced_fun',     'Forced participation',              '', 'quiz'),
  ('anti_preference', 'costumes',       'A costume rule',                    '', 'quiz'),
  ('anti_preference', 'schedule',       'A schedule that runs the day',      '', 'quiz'),
  ('anti_preference', 'loud',           'Music too loud to talk over',       '', 'quiz'),
  ('anti_preference', 'novelty',        'Novelty props and balloons',        '', 'quiz'),
  ('anti_preference', 'photographed',   'Being photographed all night',      '', 'quiz'),
  ('anti_preference', 'surprise_cost',  'Anything that surprises the wallet', '', 'quiz'),
  ('anti_preference', 'strangers',      'More people than we know',          '', 'quiz'),
  ('anti_preference', 'kids_party',     'Anything that feels like a kids'' party', '', 'quiz'),
  ('anti_preference', 'prep_marathon',  'A project plan the day before',     '', 'quiz'),

  -- affinity — AFFINITIES
  ('affinity', 'one_moment', 'One moment they retell for years', '', 'quiz'),
  ('affinity', 'ease',       'Everything already handled',       '', 'quiz'),
  ('affinity', 'beauty',     'A table worth photographing',      '', 'quiz'),
  ('affinity', 'ritual',     'A ritual we repeat next year',     '', 'quiz'),
  ('affinity', 'wit',        'An inside joke, made real',        '', 'quiz'),
  ('affinity', 'late',       'Permission to stay up',            '', 'quiz'),

  -- budget — BUDGETS, and the values of budget_band in 001
  ('budget', 'under_500',         'Under $500',        '', 'quiz'),
  ('budget', 'from_500_to_1500',  '$500 to $1,500',    '', 'quiz'),
  ('budget', 'from_1500_to_3000', '$1,500 to $3,000',  '', 'quiz'),
  ('budget', 'from_3000_to_6000', '$3,000 to $6,000',  '', 'quiz'),
  ('budget', 'over_6000',         'Over $6,000',       '', 'quiz'),
  ('budget', 'not_sure',          'Not sure yet',      'We will show you what each level buys', 'quiz');

-- `description` above is copied verbatim from each option's `hint` in
-- src/lib/quiz.ts, including where that hint is empty, so that
-- scripts/check-facets.mjs reports ZERO drift on a clean tree — a drift check
-- with expected noise in it is a drift check nobody reads. Anything we want to
-- say about a term that the customer should not see goes in `notes`.
update facet set notes = 'Free text. The words she typed live in quiz_response.occasion_other.'
 where dimension_code = 'occasion' and code = 'other';
update facet set notes = 'A real answer, not a missing one — it changes what we send.'
 where dimension_code = 'environment' and code = 'not_decided';

-- The bridge, generated from the dimension-to-field correspondence rather than
-- listed option by option: every facet code in a dimension IS the option code
-- in its field, because both were seeded from the same module. Listing 60 pairs
-- by hand would be 60 chances to typo something no constraint could catch.
--
-- Note the polarity column: 'anti_preferences' is the only field whose codes
-- mean the opposite of choosing them.
insert into quiz_option_facet (quiz_field, option_code, facet_id, answer_polarity)
select m.quiz_field, f.code, f.id, m.answer_polarity
  from facet f
  join (values
         ('taste_direction', 'taste_directions', 'positive'::signal_polarity),
         ('occasion',        'occasion',         'positive'),
         ('environment',     'environment',      'positive'),
         ('group_fun',       'group_fun',        'positive'),
         ('anti_preference', 'anti_preferences', 'negative'),
         ('affinity',        'affinities',       'positive'),
         ('budget',          'budget',           'positive')
       ) as m(dimension_code, quiz_field, answer_polarity)
    on m.dimension_code = f.dimension_code;

-- ── keeping world.taste_directions and world_facet honest ───────────
--
-- 001's `world` carries `taste_directions text[]` and `fits_occasions
-- occasion_type[]`, and the existing tooling writes them. world_facet is the
-- integrity-bearing version of the same fact, and TWO REPRESENTATIONS OF ONE
-- FACT DRIFT — which is the exact disease this migration exists to cure, so
-- introducing a fresh case of it would be absurd.
--
-- The resolution is a ONE-WAY PROJECTION, not a sync. For the taste_direction
-- and occasion dimensions the ARRAY IS AUTHORITATIVE: the trigger below makes
-- world_facet match it on every write, adding and removing as needed. Any
-- world_facet row in ANY OTHER dimension — a palette, a mood, a season a
-- curator tagged by hand — is untouched, because the arrays make no claim
-- about those.
--
-- So existing code keeps writing arrays and gets correct facet rows for free,
-- new code can read facets exclusively, and when nothing reads the arrays any
-- more a later migration drops them and this trigger with them. That is the
-- ordering that makes replacing a column a non-event instead of an outage.
--
-- The `::text` casts are deliberate: facet.code is citext, and leaving the
-- comparison to implicit resolution makes case-sensitivity depend on which side
-- PostgreSQL decides to cast. Codes are lowercase by CHECK constraint, so an
-- explicit text comparison is both correct and unambiguous.

create or replace function world_facet_project() returns trigger
language plpgsql as $$
begin
  -- Gone from the array, so gone from the projection.
  delete from world_facet wf
   using facet f
   where wf.world_id = new.id
     and wf.facet_id = f.id
     and f.dimension_code = 'taste_direction'
     and not (f.code::text = any (new.taste_directions));

  delete from world_facet wf
   using facet f
   where wf.world_id = new.id
     and wf.facet_id = f.id
     and f.dimension_code = 'occasion'
     and not (f.code::text = any (new.fits_occasions::text[]));

  -- Present in the array, so present in the projection. An array element with
  -- no facet is skipped by the join rather than raising: a world carrying a
  -- term that never existed is a data problem to find with a query, not a
  -- reason to fail somebody's save.
  insert into world_facet (world_id, facet_id, weight, provenance, note)
  select new.id, f.id, 1.000, 'curator',
         'Projected from world.taste_directions.'
    from unnest(new.taste_directions) as t(code)
    join facet f
      on f.dimension_code = 'taste_direction' and f.code::text = t.code
  on conflict do nothing;

  insert into world_facet (world_id, facet_id, weight, provenance, note)
  select new.id, f.id, 1.000, 'curator',
         'Projected from world.fits_occasions.'
    from unnest(new.fits_occasions) as o(code)
    join facet f
      on f.dimension_code = 'occasion' and f.code::text = o.code::text
  on conflict do nothing;

  return null;
end;
$$;

create trigger world_facet_projection
  after insert or update of taste_directions, fits_occasions on world
  for each row execute function world_facet_project();

-- And the backfill for every world that already exists. Written as an UPDATE
-- that changes nothing so that the trigger above is the single implementation
-- of the projection rule — a second, hand-written copy of the same logic here
-- would be one more thing to keep in step. It does bump world.updated_at once,
-- which is honest: what the row means to the rest of the system did change.
update world set taste_directions = taste_directions;

-- ─────────────────────────────────────────────────────────────────────
-- ASSEMBLAGE UNIQUENESS — "no two customers receive the same Revelle"
--
-- The founder's promise is that no two customers ever receive the same Revelle.
-- The strategy — a large ingredient pool, so combinations effectively never
-- repeat — is combinatorially sound but it is a PROBABILITY. A promise that
-- rests on a probability is a marketing claim. This section turns it into a
-- constraint the database enforces, which is a different kind of statement.
--
-- ── WHAT "THE SAME" MEANS. THE LOAD-BEARING JUDGEMENT ────────────────
--
-- The fingerprint covers POOLED, REUSABLE ingredients ONLY — the elements that
-- could genuinely repeat across customers because they are drawn from a shared
-- library: the world, the products in the edit, and (as they get tables) the
-- games, rituals, hosting ideas, playlists, detail sets and downloads.
--
-- It deliberately EXCLUDES everything written for one woman:
--
--   revelle.dedication, title_override, tagline_override, tokens_override,
--   and every word of revelle_section.body and .content.
--
-- The reason is that including them would make the constraint THEATRE. Free
-- text is unique by construction — a single different comma yields a different
-- digest — so every Revelle would trivially pass and the index would never fire
-- once, while appearing to guarantee something. A constraint that cannot fail
-- guarantees nothing. Excluding free text means the fingerprint answers the
-- only question worth asking: did we hand two customers the same ingredients
-- and write different words over the top?
--
-- Two further judgements, recorded here so they are auditable:
--
--   · ORDER AND SLOT ARE EXCLUDED. The digest is over the SET. Two Revelles
--     built from an identical set of ingredients, with two of them swapped
--     between the arrival and the ending, are treated as THE SAME assemblage
--     and the second is rejected. This is the strong reading, chosen because
--     the near-miss — same nine things, rearranged — is exactly what the
--     promise should also exclude. `slot` is still recorded on every ingredient
--     row; it is simply not part of identity.
--   · THE DIGEST IS VERSIONED. Every value is prefixed 'a1:'. If the rule above
--     is ever revised, the new rule emits 'a2:' and a backfill rewrites every
--     row — so old and new digests can never be compared as if they meant the
--     same thing, which is the failure mode that would silently break the
--     guarantee.
--
-- ── HOW IT IS ENFORCED ──────────────────────────────────────────────
--
--   · compute_assemblage_fingerprint() sorts the ingredient keys before
--     hashing, so row order cannot affect the result; each key carries its pool
--     name, so a product uuid can never be mistaken for a world uuid; and
--     adding any genuinely new element changes the input string and therefore
--     the digest.
--   · A trigger keeps revelle.assemblage_fingerprint correct on every change to
--     the revelle or to any of its ingredient rows. It is never written by hand.
--   · A PARTIAL unique index enforces it for status <> 'draft'. Drafts are
--     workspace and may collide freely; the guarantee binds the moment a
--     Revelle is shown to a customer ('preview'), and keeps binding after it is
--     archived, because an archived Revelle was still issued.
--   · The same trigger checks for the collision FIRST and raises a message
--     naming the other Revelle and the shared ingredients — see requirement 4.
--     The unique index stays as the race-proof backstop, because two concurrent
--     transactions can both pass a trigger's lookup.

alter table revelle
  -- Maintained entirely by trigger. Do not write this column by hand; anything
  -- you set is recomputed from the ingredient rows before the statement lands.
  add column assemblage_fingerprint text;

comment on column revelle.assemblage_fingerprint is
  'Order-independent digest of the POOLED ingredients only (see db/002). '
  'Trigger-maintained. Unique across every non-draft Revelle.';

-- The guarantee. Partial on two axes: null fingerprints (a revelle with no
-- resolvable ingredients) and drafts are both outside it.
create unique index revelle_assemblage_unique
  on revelle (assemblage_fingerprint)
  where assemblage_fingerprint is not null and status <> 'draft';

-- ── the ingredient pools ─────────────────────────────────────────────
--
-- Same argument as facet tagging: one pattern, real foreign keys, no
-- polymorphic entity_id anywhere a delete could orphan a row.
--
-- `world` is registered but has no join table — 001 already carries the chosen
-- world as revelle.world_id, and duplicating it into a join table would create
-- two places for one fact. rebuild_revelle_ingredient_view() has a fixed branch
-- for it. Every other pool gets `revelle_<entity>`.

create table ingredient_pool (
  entity_table text primary key check (entity_table ~ '^[a-z][a-z0-9_]*$'),
  -- 'revelle_' || entity_table, or NULL when the reference lives on revelle
  -- itself (world, today, and probably only ever world).
  join_table   text unique,
  label        text not null,

  -- Which column holds a human name, for error messages and the curator's
  -- inventory. Used through format(%I) — an identifier, never interpolated raw.
  label_column text not null default 'name',
  -- The rows that may be issued today, as a column/value pair rather than a SQL
  -- predicate string: a predicate column would be an injection surface in every
  -- function that counts a pool, for no expressiveness anyone needs.
  active_column text,
  active_value  text,

  -- How many of this pool a typical Revelle draws. Used ONLY by
  -- assemblage_headroom() to compute combinatorial capacity — not enforced,
  -- because a curator who wants eight products in one edit should have eight.
  typical_draw integer not null default 1 check (typical_draw >= 0),

  created_at   timestamptz not null default now(),

  constraint ingredient_pool_active_pair
    check ((active_column is null) = (active_value is null))
);

-- Creates `revelle_<entity>` and registers the pool. Adding games, rituals,
-- hosting ideas, playlists or downloadable assets later is: create the pool
-- table with a uuid `id`, call install_facet_tags(), call this, then call
-- rebuild_revelle_ingredient_view(). The fingerprint, the issuance history and
-- the headroom arithmetic all pick it up with no further change.
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
      -- fingerprint — see the judgement note above.
      slot        section_kind,
      position    integer,
      note        text,
      created_at  timestamptz not null default now(),

      primary key (revelle_id, %I)
    )$ddl$,
    v_join, v_column, p_entity_table, v_column);

  -- "Everywhere this ingredient has been issued" — the issuance history read.
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

-- Regenerates the union of every pool into one queryable surface. Fixed world
-- branch first, then one branch per registered join table.
create or replace function rebuild_revelle_ingredient_view() returns void
language plpgsql as $$
declare
  v_sql text;
begin
  v_sql :=
    'select ''world''::text as entity_table, r.world_id as entity_id, ' ||
    'r.id as revelle_id, null::section_kind as slot, r.created_at ' ||
    'from revelle r where r.world_id is not null';

  select v_sql || coalesce(string_agg(
           format(
             e'\n  union all\n' ||
             'select %L::text, j.%I, j.revelle_id, j.slot, j.created_at from %I j',
             p.entity_table, p.entity_table || '_id', p.join_table),
           '' order by p.entity_table), '')
    into v_sql
    from ingredient_pool p
   where p.join_table is not null;

  execute format('create or replace view revelle_ingredient as %s', v_sql);
end;
$$;

-- Built once here with only the world branch, because the SQL-language function
-- below is parsed at CREATE time and must find the view already present. It is
-- rebuilt at the bottom of this section once the product pool is registered.
select rebuild_revelle_ingredient_view();

-- ── the fingerprint ──────────────────────────────────────────────────

-- Human-readable name of one pooled ingredient, for error messages and the
-- curator's inventory. Dynamic because the pools are a registry, safe because
-- both the table and the column arrive through format(%I) from a staff-only
-- registry — never from a request.
create or replace function ingredient_label(p_entity_table text, p_entity_id uuid)
returns text
language plpgsql stable as $$
declare
  v_column text;
  v_name   text;
begin
  select label_column into v_column
    from ingredient_pool where entity_table = p_entity_table;

  if v_column is null then
    return format('%s %s', p_entity_table, p_entity_id);
  end if;

  execute format('select %I::text from %I where id = $1', v_column, p_entity_table)
     into v_name using p_entity_id;

  if v_name is null then
    return format('%s %s', p_entity_table, p_entity_id);
  end if;
  return format('%s "%s"', p_entity_table, v_name);
end;
$$;

-- THE DIGEST.
--
-- `p_world_id` is passed rather than read back from `revelle` so that this
-- works inside a BEFORE INSERT trigger, where the row does not yet exist in the
-- table it is about to join.
--
-- Stability, point by point:
--   · `order by 1` on the key list before joining — reordering the same set is
--     the same string, therefore the same digest.
--   · `distinct` — listing an ingredient twice cannot change the result, so the
--     digest is over a SET and not a multiset.
--   · every key is 'pool:uuid' — two pools can never collide on a uuid, and a
--     new element (any element) lengthens the string and changes the hash.
--   · null when there is nothing to hash, so the partial unique index ignores
--     an empty assemblage rather than treating "empty" as a reserved identity
--     that only one Revelle in the system may hold.
--   · 'a1:' names the rule that produced it. See the versioning note above.
create or replace function compute_assemblage_fingerprint(
  p_revelle uuid, p_world_id uuid
) returns text
language sql stable as $$
  select case
           when count(*) = 0 then null
           else 'a1:' || encode(
                  sha256(convert_to(string_agg(k.key, '|' order by k.key), 'utf8')),
                  'hex')
         end
    from (
      select distinct 'world:' || p_world_id::text as key
       where p_world_id is not null
      union
      select distinct i.entity_table || ':' || i.entity_id::text
        from revelle_ingredient i
       where i.revelle_id = p_revelle
         and i.entity_table <> 'world'
         and i.entity_id is not null
    ) k;
$$;

create or replace function refresh_revelle_fingerprint(p_revelle uuid)
returns void
language plpgsql as $$
declare
  v_world uuid;
  v_fp    text;
begin
  select world_id into v_world from revelle where id = p_revelle;
  if not found then return; end if;

  v_fp := compute_assemblage_fingerprint(p_revelle, v_world);

  -- The `is distinct from` guard keeps a no-op ingredient edit from writing to
  -- revelle and re-running the collision check for nothing.
  update revelle set assemblage_fingerprint = v_fp
   where id = p_revelle and assemblage_fingerprint is distinct from v_fp;
end;
$$;

create or replace function revelle_ingredient_changed() returns trigger
language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    perform refresh_revelle_fingerprint(old.revelle_id);
    return old;
  end if;

  perform refresh_revelle_fingerprint(new.revelle_id);
  if tg_op = 'UPDATE' and new.revelle_id is distinct from old.revelle_id then
    perform refresh_revelle_fingerprint(old.revelle_id);
  end if;
  return new;
end;
$$;

-- Recomputes the fingerprint on the row itself, then makes a collision a
-- SENTENCE rather than a unique-violation.
--
-- Requirement 4, and the reason this exists at all: `duplicate key value
-- violates unique constraint "revelle_assemblage_unique"` tells a curator
-- nothing she can act on. She needs to know WHICH Revelle she has duplicated
-- and WHICH ingredients they share, because her fix is to vary exactly one of
-- them. DETAIL and HINT carry that; the index behind it carries the guarantee.
create or replace function revelle_assemblage_guard() returns trigger
language plpgsql as $$
declare
  v_fp      text;
  v_other   record;
  v_shared  text;
begin
  v_fp := compute_assemblage_fingerprint(new.id, new.world_id);
  new.assemblage_fingerprint := v_fp;

  if v_fp is null or new.status = 'draft' then
    return new;
  end if;

  select r.id, r.customer_id, r.status, r.delivered_at, c.email
    into v_other
    from revelle r
    join customer c on c.id = r.customer_id
   where r.assemblage_fingerprint = v_fp
     and r.status <> 'draft'
     and r.id <> new.id
   limit 1;

  if not found then
    return new;
  end if;

  select string_agg(ingredient_label(k.entity_table, k.entity_id), ', '
                    order by k.entity_table, k.entity_id)
    into v_shared
    from (
      select 'world'::text as entity_table, new.world_id as entity_id
       where new.world_id is not null
      union
      select i.entity_table, i.entity_id
        from revelle_ingredient i
       where i.revelle_id = new.id and i.entity_table <> 'world'
    ) k;

  raise exception
    'Revelle % would repeat an assemblage already issued to another customer.',
    new.id
    using
      detail = format(
        'Identical pooled ingredients to revelle %s (customer %s, status %s%s). '
        'Shared: %s.',
        v_other.id, v_other.email, v_other.status,
        case when v_other.delivered_at is null then ''
             else ', delivered ' || v_other.delivered_at::date end,
        coalesce(v_shared, '(none resolvable)')),
      hint =
        'Vary one pooled ingredient — a different world, or swap one item in '
        'the edit — and the fingerprint changes. Free text is deliberately not '
        'part of the fingerprint, so rewording will not clear this.',
      errcode = 'unique_violation';
end;
$$;

-- Fires on INSERT too: a Revelle created directly in 'preview' must be checked,
-- not only one that is promoted into it.
create trigger revelle_assemblage before insert or update on revelle
  for each row execute function revelle_assemblage_guard();

-- Products are the first pool with a join table. `typical_draw = 6` is the
-- house assumption about how many items an edit carries; it feeds nothing but
-- the headroom arithmetic and should be corrected the moment reality disagrees.
select install_revelle_ingredients('product', 'The edit', 'name', 'status', 'active', 6);

-- world has no join table (see above), so it is registered by hand.
insert into ingredient_pool
  (entity_table, join_table, label, label_column, active_column, active_value,
   typical_draw)
values ('world', null, 'Creative worlds', 'name', 'status', 'published', 1);

select rebuild_revelle_ingredient_view();

-- ── issuance history ─────────────────────────────────────────────────
--
-- Two consumers, one shape:
--
--   · the CURATOR, who needs to see an ingredient going stale — issued eleven
--     times this quarter, or not once since March;
--   · a future SELECTION ALGORITHM, which should bias away from recently
--     issued elements. That algorithm is explicitly not built here. What is
--     built is the number it will need.
--
-- A VIEW rather than a maintained counter column, on purpose. At Revelle's
-- volume — a few interactions per customer per year — this aggregate is free,
-- and a cached counter is a drift risk with no upside: the first time a
-- backfill or a manual fix touches an ingredient row, the counter is wrong and
-- nothing says so. Promote it to a materialised view when the scan stops being
-- free, which is a good problem.
--
-- Drafts are excluded: an ingredient sitting in an unfinished draft has not
-- been issued to anybody and must not look stale.

create view ingredient_issuance as
select i.entity_table,
       i.entity_id,
       count(*)                                        as issue_count,
       min(coalesce(r.delivered_at, r.created_at))      as first_issued_at,
       max(coalesce(r.delivered_at, r.created_at))      as last_issued_at,
       count(distinct r.customer_id)                    as customer_count
  from revelle_ingredient i
  join revelle r on r.id = i.revelle_id
 where r.status <> 'draft'
 group by i.entity_table, i.entity_id;

-- Every item in every pool, issued or not, with its stats. The zero-count rows
-- are the point: "what have I never used" is the question a library answers and
-- a log does not.
create or replace function ingredient_inventory()
returns table (
  entity_table    text,
  entity_id       uuid,
  label           text,
  is_available    boolean,
  issue_count     bigint,
  first_issued_at timestamptz,
  last_issued_at  timestamptz,
  customer_count  bigint
)
language plpgsql stable as $$
declare
  p record;
begin
  for p in select * from ingredient_pool order by entity_table loop
    return query execute format($q$
      select %L::text,
             t.id,
             ingredient_label(%L, t.id),
             %s,
             coalesce(s.issue_count, 0),
             s.first_issued_at,
             s.last_issued_at,
             coalesce(s.customer_count, 0)
        from %I t
        left join ingredient_issuance s
          on s.entity_table = %L and s.entity_id = t.id
    $q$,
      p.entity_table, p.entity_table,
      case when p.active_column is null then 'true'
           else format('(t.%I::text = %L)', p.active_column, p.active_value) end,
      p.entity_table, p.entity_table);
  end loop;
end;
$$;

-- ── combinatorial headroom ───────────────────────────────────────────
--
-- THE NUMBER THE FOUNDER SHOULD WATCH.
--
-- The unique index guarantees that a repeat cannot be ISSUED. It does not
-- guarantee that a repeat is never ATTEMPTED — and an attempt is a failed
-- issuance that a curator has to resolve by hand at the worst possible moment.
-- So the real question is not "is the promise safe" (it is, mechanically) but
-- "how big must the pool be before the promise stops costing anybody anything".
--
-- The arithmetic:
--
--   distinct assemblages  N = Π over pools of  C(available_p, typical_draw_p)
--
-- With one world from 12 published and six products from 40 active:
--
--   N = C(12,1) × C(40,6) = 12 × 3,838,380 ≈ 4.6 × 10^7
--
-- The trap is thinking that 46 million assemblages makes repetition impossible
-- at 10,000 customers because 10,000 << 46,000,000. It does not. Collisions
-- follow the BIRTHDAY BOUND, not the ratio:
--
--   P(at least one collision among C customers) ≈ 1 − exp(−C² / 2N)
--
-- so the customer count at which a collision becomes likely grows with √N, not
-- N. Setting P = 1% and solving:
--
--   C ≈ √(2N × 0.01005) ≈ 0.1418 × √N
--
-- At N = 4.6 × 10^7 that is ≈ 960 customers before there is a 1% chance of one
-- collision anywhere in the book — not 46 million, and not 10,000. To carry
-- 10,000 customers at the same 1% risk the pool needs N ≈ 5 × 10^9, which is
-- roughly six products drawn from 100 rather than from 40 (C(100,6) ≈ 1.2 ×
-- 10^9, × 12 worlds ≈ 1.4 × 10^10 — comfortable).
--
-- The lesson to carry into catalogue planning: pool size buys headroom
-- QUADRATICALLY SLOWLY relative to customer count, and the cheapest lever is
-- adding another DRAWN dimension (a playlist, a ritual, a game) rather than
-- adding items to a dimension already in the product.
--
-- assemblage_headroom() computes the per-pool half; assemblage_headroom_summary
-- multiplies it out and applies the bound above.

create or replace function n_choose_k(p_n bigint, p_k integer) returns numeric
language plpgsql immutable as $$
declare
  v numeric := 1;
  i integer;
begin
  if p_n < 0 or p_k < 0 or p_k > p_n then return 0; end if;
  for i in 1..p_k loop
    v := v * (p_n - p_k + i) / i;
  end loop;
  return round(v);
end;
$$;

create or replace function assemblage_headroom()
returns table (
  pool         text,
  label        text,
  available    bigint,
  typical_draw integer,
  combinations numeric
)
language plpgsql stable as $$
declare
  p record;
  v_available bigint;
begin
  for p in select * from ingredient_pool order by entity_table loop
    execute format('select count(*) from %I t where %s',
                   p.entity_table,
                   case when p.active_column is null then 'true'
                        else format('t.%I::text = %L', p.active_column, p.active_value)
                   end)
      into v_available;

    pool         := p.entity_table;
    label        := p.label;
    available    := v_available;
    typical_draw := p.typical_draw;
    combinations := n_choose_k(v_available, p.typical_draw);
    return next;
  end loop;
end;
$$;

-- Everything stays in NUMERIC. The obvious implementation multiplies the
-- per-pool combinations in double precision, and it raises `out of range` the
-- moment the catalogue gets genuinely large — which is to say it breaks exactly
-- when the answer is "you have nothing to worry about". numeric's ln/exp carry
-- the product to any size the founder will ever have, and the cap below turns
-- the truly absurd case into a null rather than an error.
--
-- The product is taken as exp(Σ ln x) because SQL has no product aggregate; and
-- √N is exp((Σ ln x) / 2), which avoids ever materialising N just to take its
-- square root.
create view assemblage_headroom_summary as
select case when h.ln_n is null then 0
            when h.ln_n > 300000 then null
            else round(exp(h.ln_n)) end
         as distinct_assemblages,
       -- C ≈ 0.1418 √N. See the derivation above.
       case when h.ln_n is null then 0
            when h.ln_n > 300000 then null
            else floor(0.1418 * exp(h.ln_n / 2)) end
         as customers_before_1pct_collision_risk,
       h.issued_assemblages,
       h.pools_with_nothing_available
  from (
    select sum(ln(nullif(combinations, 0)))          as ln_n,
           (select count(*) from revelle
             where status <> 'draft' and assemblage_fingerprint is not null)
                                                     as issued_assemblages,
           count(*) filter (where combinations = 0)   as pools_with_nothing_available
      from assemblage_headroom()
  ) h;

-- ─────────────────────────────────────────────────────────────────────
-- FOR THE CURATOR, ON DAY ONE
--
-- There is no data. That is fine — none of this needs any. A useful cohort is
-- four statements, and the fourth is the one that matters.
--
--   -- 1. Name the kind of woman.
--   insert into taste_cohort (slug, name, description, curator_note,
--                             status, activated_at)
--   values ('coastal-restraint', 'Coastal restraint',
--           'Salt, linen, and nothing shiny. Spends on one good thing.',
--           'She has been to this beach every summer since she was nine and '
--           'does not want it themed. If it looks like a party, she will leave '
--           'it in the box.',
--           'active', now());
--
--   -- 2. Say what she is in the SAME words products and worlds are tagged in.
--   --    Negative weights are half the definition: what she is NOT is usually
--   --    sharper than what she is.
--   insert into taste_cohort_facet (taste_cohort_id, facet_id, weight, note)
--   select c.id, f.id, w.weight, w.note
--     from taste_cohort c
--     join (values ('faded_coastal',    0.95, 'the whole idea'),
--                  ('nordic_quiet',     0.60, 'the restraint half'),
--                  ('tropical_maximal', -0.90, 'the exact wrong turning'),
--                  ('novelty',          -1.00, 'never')
--          ) as w(code, weight, note) on true
--     join facet f on f.code = w.code
--    where c.slug = 'coastal-restraint';
--
--   -- 3. Place a customer, by hand, on the strength of one conversation.
--   insert into customer_cohort_affinity
--     (customer_id, cohort_id, source, weight, confidence, set_by, rationale)
--   select $1, c.id, 'curator', 0.80, 0.90, 'jessica',
--          'She said "no balloons" twice in one phone call.'
--     from taste_cohort c where c.slug = 'coastal-restraint';
--
--   -- 4. Record what she turned down. This is the highest-value row in the
--   --    system and it does not need the thing to exist yet.
--   insert into taste_signal
--     (customer_id, facet_id, polarity, strength, context, source,
--      subject_label, note)
--   select $1, f.id, 'negative', 1.000, 'curator_direction', 'curator',
--          'Palm-print table, tiki glasses, rum bar',
--          'Shown before purchase. "Absolutely not." Verbatim.'
--     from facet f where f.code = 'tropical_maximal';
--
-- When a clustering job eventually proposes cohorts, they land in the same
-- table with provenance = 'inferred', and everything above still reads and
-- edits exactly the same way. Nothing here is a placeholder for the real
-- version; this IS the version.
--
-- And two reads that answer the questions the library raises:
--
--   -- What have I never used, and what am I leaning on too hard?
--   select * from ingredient_inventory()
--    where is_available
--    order by issue_count desc, last_issued_at desc nulls last;
--
--   -- How much room is left before the promise starts costing me anything?
--   select * from assemblage_headroom();
--   select * from assemblage_headroom_summary;
-- ─────────────────────────────────────────────────────────────────────
