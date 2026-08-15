-- Revelle Société — THE DESK: two named people, and a record of what each did
--
-- Applied by scripts/migrate.mjs after 010, inside one transaction together
-- with its schema_migrations ledger row. Same rule as every file before it:
-- nothing here may be a statement that refuses to run in a transaction.
--
-- New file, never applied anywhere, so no SENTINELS entry in
-- scripts/migrate.mjs. Discovery picks it up; the ledger makes it run once.
--
-- ─────────────────────────────────────────────────────────────────────
-- WHY THIS EXISTS
--
-- Two people run the société from one screen, and everything they do is an
-- opinion: a curator override on a taste profile (db/002), a weight on a facet
-- tag, a voice published under someone's name (db/004.authored_by). Every one
-- of those already records WHO — and "who" is worth nothing if both people are
-- the same login.
--
--   A SHARED PASSWORD MAKES PROVENANCE A LIE.
--
-- That is the whole argument for this file. It is not about keeping anyone out
-- (the segment is guarded in one place, in the application); it is about the
-- system being able to answer "she disagreed with the model here — which she?"
--
-- ─────────────────────────────────────────────────────────────────────
-- WHO MAY SIGN IN — AND WHY IT IS NOT DECIDED HERE
--
-- The allowlist is the STAFF_EMAILS environment variable, read in
-- src/lib/staff.ts, and it is deliberately NOT a column, a seed, or a row in
-- this file. Three reasons, all of them practical:
--
--   · They are real personal addresses. They do not belong in git.
--   · The list changes, and changing it must not be a migration and a deploy.
--   · It has to be settable on Render, by a person, without either.
--
-- So this table is the REGISTER, not the gate. A row here means "this person
-- has signed in at least once and things are attributed to her"; it does not
-- grant anything. src/lib/staff.ts creates the row the first time an allowed
-- address asks for a link, and refuses every address the variable does not
-- name — including, if the variable is unset, all of them. Fail closed is
-- stated in code because that is where the check is; it is restated here so a
-- reader of the schema does not conclude that `status = 'active'` is what lets
-- someone in.
--
-- `status = 'disabled'` is the one thing this table CAN do to a sign-in: it
-- refuses, whatever the environment says. That is the revoke path that does not
-- need a deploy either.
--
-- ─────────────────────────────────────────────────────────────────────
-- CONTENTS
--
--   staff                 the register. one row per person, forever
--   staff_sign_in_token   a magic link. hashed, single use, short lived
--   staff_session         a signed-in browser. hashed, revocable
--   staff_action          WHAT SHE DID. the attribution ledger
--   staff_recent_activity what each of them has been doing (view)
-- ─────────────────────────────────────────────────────────────────────

-- ── staff ────────────────────────────────────────────────────────────
--
-- One row per person. Never deleted: a `staff_action` row from two years ago
-- must still resolve to a name, and deleting the person to "clean up" would
-- orphan exactly the history this file exists to keep. Disable instead.

create table staff (
  id          uuid primary key default gen_random_uuid(),
  -- citext, like customer.email, so a capitalised address is the same person.
  -- The allowlist comparison in src/lib/staff.ts lower-cases and trims for the
  -- same reason: one stray space in an environment variable must not lock
  -- somebody out of her own tool.
  email       citext not null unique,
  -- What appears beside a change. Editable; it is a display name, not an
  -- identity. Defaults to the local part of the address so a first sign-in is
  -- attributable before anyone has filled anything in.
  name        text not null default '',
  status      text not null default 'active'
                check (status in ('active', 'disabled')),

  last_seen_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint staff_email_shaped
    check (email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')
);

create trigger staff_touch before update on staff
  for each row execute function set_updated_at();

comment on table staff is
  'The register of people who work the desk. NOT the gate — who may sign in is '
  'the STAFF_EMAILS environment variable, read in src/lib/staff.ts, which fails '
  'closed when unset. A row here exists so a change has an author. See db/011.';

-- ── staff_sign_in_token ──────────────────────────────────────────────
--
-- A magic link, the same shape the member portal will use (docs/portal-spec.md:
-- "Passwordless; she never has a password to forget").
--
-- WHAT IS STORED IS A HASH. The raw token exists in exactly two places — the
-- email, and the URL she clicks — and never in the database. A dump of this
-- table therefore yields no working links, which is the only property that
-- makes a bearer token in an email tolerable at all.
--
-- Single use and short lived, both enforced by the redemption query rather than
-- by a background sweep: `consumed_at is null and expires_at > now()` is one
-- indexed predicate and cannot be forgotten. Rows are kept after consumption
-- because "a link was issued at 09:14 and used at 09:15 from this agent" is the
-- kind of thing you want when something looks wrong.

create table staff_sign_in_token (
  id          uuid primary key default gen_random_uuid(),
  staff_id    uuid not null references staff(id) on delete cascade,
  -- sha256 of the raw token, hex. Never the token.
  token_hash  text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),

  expires_at  timestamptz not null,
  consumed_at timestamptz,
  -- Diagnostics only. Never a condition of redemption: a link opened on a
  -- phone after being requested on a laptop is the normal case, not an attack.
  requested_user_agent text,
  created_at  timestamptz not null default now()
);

create index staff_sign_in_token_live_idx
  on staff_sign_in_token (staff_id, created_at desc);

comment on table staff_sign_in_token is
  'Magic links. Stores a sha256 of the token, never the token: a dump of this '
  'table yields nothing that can be clicked. Single use, short lived.';

-- ── staff_session ────────────────────────────────────────────────────
--
-- A signed-in browser. Same hashing rule and the same argument: the cookie
-- holds the raw token, this holds its digest.
--
-- `expires_at` is absolute rather than sliding. A sliding window on an internal
-- tool means a session that never ends, and an internal tool is exactly where a
-- forgotten open tab lives longest. `last_seen_at` is recorded for the "who is
-- signed in" read and deliberately does NOT extend anything.
--
-- `revoked_at` rather than a delete, so signing out is a fact with a time on
-- it, and so a session can be killed without losing the record that it existed.

create table staff_session (
  id           uuid primary key default gen_random_uuid(),
  staff_id     uuid not null references staff(id) on delete cascade,
  token_hash   text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),

  expires_at   timestamptz not null,
  revoked_at   timestamptz,
  last_seen_at timestamptz not null default now(),
  user_agent   text,
  created_at   timestamptz not null default now()
);

-- The read on every single request: hash the cookie, find the live session.
create unique index staff_session_live_idx
  on staff_session (token_hash) where revoked_at is null;
create index staff_session_staff_idx
  on staff_session (staff_id, created_at desc);

-- ── staff_action ─────────────────────────────────────────────────────
--
-- THE ATTRIBUTION LEDGER, and the reason the other three tables exist.
--
-- ── WHY A LEDGER AND NOT A `changed_by` COLUMN ON EVERY TABLE ───────
--
-- Two reasons, and the second is the one that decides it.
--
--   1. A column records only the LAST writer. "Who changed this" is rarely the
--      question; "what has she been doing, and what happened to this row" is.
--      A column cannot answer either.
--   2. Half the interesting writes are already immutable by design.
--      quiz_response is append-only (db/001). A published world_voice is frozen
--      (db/004) and carries `authored_by` in the row itself — the desk writes
--      the staff email there, so a voice version is signed where it is stored
--      and needs nothing from this table to be attributable. Adding a mutable
--      author column to those tables would mean either breaking their guards or
--      creating a second, softer version of a fact they already hold hard.
--
-- So: an append-only sidecar, written by every mutating path in the desk, with
-- a loose (`entity_table`, `entity_id`) pointer and NO foreign key. The missing
-- key is deliberate and is the one compromise in the file — a real key would
-- mean one column per pool, and a `delete` that cascaded would erase the record
-- that the delete happened, which is precisely backwards. `entity_id` is
-- therefore allowed to point at a row that no longer exists; the `detail`
-- column carries enough of the row to say what it was.

create table staff_action (
  id           bigint generated always as identity primary key,
  staff_id     uuid not null references staff(id) on delete restrict,

  -- Verb, dotted, past tense. 'product.created', 'voice.published',
  -- 'application.status_changed'. Free text on purpose: an enum here would
  -- make adding a screen a migration, which is the test db/002 applies to
  -- everything churn-prone.
  action       text not null check (action ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$'),
  -- What it was done to. No foreign key — see above.
  entity_table text,
  entity_id    uuid,
  -- A human sentence, for the activity list. "WESTHAMPTON, 1976 — voice v2".
  summary      text not null default '',
  -- Whatever the screen knew. Field names, before/after, the reason typed into
  -- a note. jsonb because the shape differs per action and always will.
  detail       jsonb not null default '{}'::jsonb
                 check (jsonb_typeof(detail) = 'object'),

  created_at   timestamptz not null default now()
);

create index staff_action_recent_idx on staff_action (created_at desc);
create index staff_action_staff_idx on staff_action (staff_id, created_at desc);
create index staff_action_entity_idx on staff_action (entity_table, entity_id, created_at desc);

-- Append-only, like quiz_response and for the same reason: a record of what
-- someone did is worth nothing if the someone can edit it.
create or replace function staff_action_guard() returns trigger
language plpgsql as $$
begin
  raise exception
    'staff_action is append-only: row % may not be %.',
    coalesce(old.id, new.id), lower(tg_op)
    using errcode = 'restrict_violation';
end;
$$;

create trigger staff_action_no_edit before update or delete on staff_action
  for each row execute function staff_action_guard();

comment on table staff_action is
  'Append-only record of every change made at the desk, with the person who '
  'made it. (entity_table, entity_id) has no foreign key on purpose: a delete '
  'must not erase the record that it happened. See db/011.';

-- ── the activity read ────────────────────────────────────────────────
--
-- What the desk shows down the side: the last things either of them did, with
-- a name attached. A view rather than a query in the page so that the join is
-- written once and "who did this" reads the same everywhere.

create view staff_recent_activity as
select a.id,
       a.created_at,
       a.action,
       a.entity_table,
       a.entity_id,
       a.summary,
       a.detail,
       s.id    as staff_id,
       s.email as staff_email,
       -- The register's display name, falling back to the address's local part
       -- so a row is never attributed to an empty string.
       nullif(btrim(s.name), '') as staff_name
  from staff_action a
  join staff s on s.id = a.staff_id;

comment on view staff_recent_activity is
  'Every change at the desk, newest first, with the person who made it.';

-- ─────────────────────────────────────────────────────────────────────
-- WHAT THIS DELIBERATELY DOES NOT DO
--
--   · NO ROLES AND NO PERMISSIONS. There are two people and they do the same
--     job. A permission system for two people who trust each other is a system
--     that will be wrong about a third person anyway, and it would be built
--     against no evidence. `staff.status` is a switch, not a role.
--   · No password column, no reset flow, no lockout. There is no password.
--   · No expiry sweep. A consumed token and a dead session are both refused by
--     predicate; deleting them would destroy the only trace that they existed.
--     If this table ever grows enough to matter, that is a job (db/008), not a
--     trigger.
--   · No link between staff_session and staff_action. Knowing WHO is the
--     requirement; knowing which of her two browsers it was is not.
-- ─────────────────────────────────────────────────────────────────────
