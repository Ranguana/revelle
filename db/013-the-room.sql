-- Revelle Société — THE ROOM: two curators talking, and the work that follows
--
-- Applied by scripts/migrate.mjs after 012, inside one transaction together
-- with its schema_migrations ledger row. Nothing here may be a statement that
-- refuses to run in a transaction. New file, so no SENTINELS entry.
--
-- ─────────────────────────────────────────────────────────────────────
-- WHAT THIS IS FOR
--
-- Two people are authoring a catalogue side by side. They need to leave each
-- other notes on the thing they are arguing about, and they need somewhere the
-- work lands. That is all this is: it is not a support inbox, not a customer
-- surface, and not a project management tool.
--
-- ── ONE ANCHOR, TWO FEATURES ────────────────────────────────────────
--
-- A message and a to-do both point at a thing or at nothing:
--
--     (subject_table, subject_id) both null   the general thread / the list
--     (subject_table, subject_id) both set    a comment on that record
--
-- "This menu's third course is wrong" belongs on that menu, not in an
-- undifferentiated stream — and a comment on a record is the SAME mechanism as
-- a message in the general thread with the subject left null. Two tables for
-- that would be two things to keep in step forever.
--
-- NO FOREIGN KEY on the anchor, the same compromise db/011 makes for
-- staff_action and for the same reason: a real key would mean one column per
-- pool, and a cascade would erase the argument about a thing along with the
-- thing. A message must survive its subject.
--
-- ── APPEND-ONLY, WITH A HISTORY ─────────────────────────────────────
--
-- db/001 makes quiz_response append-only because "editing history would
-- corrupt it". The same argument holds here for a smaller reason that is still
-- a real one: a curator's reversal is signal about the catalogue. "Make the
-- clams the opener" replaced by "no, the soup" is an argument, and the
-- argument is what produced the current text. Editing in place keeps the
-- conclusion and throws away the reasoning.
--
-- So a message may be edited, and the previous text is kept, by a trigger, in
-- desk_message_revision. Nothing is ever deleted.
--
-- ─────────────────────────────────────────────────────────────────────
-- CONTENTS
--
--   desk_message           the thread. append-only, anchored or general
--   desk_message_revision  what it used to say
--   desk_read              where each person stopped, per thread
--   desk_todo              the work, including the work the engine found
--   desk_todo_open         not done, not dismissed (view)
--   desk_thread            one row per thread, newest message first (view)
-- ─────────────────────────────────────────────────────────────────────

-- ── desk_message ─────────────────────────────────────────────────────

create table desk_message (
  id           bigint generated always as identity primary key,
  staff_id     uuid not null references staff(id) on delete restrict,

  -- The anchor. See above; no foreign key on purpose.
  subject_table text check (subject_table ~ '^[a-z][a-z0-9_]*$'),
  subject_id    uuid,

  body         text not null check (btrim(body) <> ''),

  -- Set the first time the text changes. The old text is in the revisions.
  edited_at    timestamptz,
  created_at   timestamptz not null default now(),

  constraint desk_message_anchor_is_whole
    check ((subject_table is null) = (subject_id is null))
);

-- THE THREAD KEY. Generated rather than written, because a thread is not a
-- thing anyone creates — it is the set of messages that share an anchor, and a
-- key computed from the anchor cannot disagree with it. '~general' sorts after
-- every real table name and is not a legal table name, so it cannot collide.
alter table desk_message
  add column thread_key text
    generated always as
      (coalesce(subject_table || ':' || subject_id::text, '~general')) stored;

create index desk_message_thread_idx on desk_message (thread_key, id desc);
create index desk_message_recent_idx on desk_message (created_at desc);
create index desk_message_staff_idx on desk_message (staff_id, created_at desc);

create table desk_message_revision (
  id          bigint generated always as identity primary key,
  message_id  bigint not null references desk_message(id) on delete restrict,
  -- What it said BEFORE the edit that created this row.
  body        text not null,
  -- When that text stopped being current.
  superseded_at timestamptz not null default now()
);

create index desk_message_revision_idx
  on desk_message_revision (message_id, superseded_at desc);

-- The guard. Two jobs, in one before-trigger:
--
--   1. A message is never deleted and never changes hands. Only its body may
--      change, and only the person who wrote it may change it — that last part
--      is enforced in the Server Action rather than here, because the database
--      has no idea who is at the desk and inventing a session variable to tell
--      it would be a second, weaker copy of a check the action already makes.
--   2. An edit files the old text first. In the same statement, so there is no
--      window in which the previous wording does not exist anywhere.
create or replace function desk_message_guard() returns trigger
language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    raise exception
      'desk_message % may not be deleted. The argument is the point.', old.id
      using errcode = 'restrict_violation';
  end if;

  if new.staff_id is distinct from old.staff_id
     or new.subject_table is distinct from old.subject_table
     or new.subject_id is distinct from old.subject_id
     or new.created_at is distinct from old.created_at then
    raise exception
      'desk_message %: only the body may change.', old.id
      using errcode = 'restrict_violation';
  end if;

  if new.body is distinct from old.body then
    insert into desk_message_revision (message_id, body) values (old.id, old.body);
    new.edited_at := now();
  end if;

  return new;
end;
$$;

create trigger desk_message_no_delete before delete on desk_message
  for each row execute function desk_message_guard();
create trigger desk_message_edit before update on desk_message
  for each row execute function desk_message_guard();

comment on table desk_message is
  'The desk thread. A comment on a record and a message in the general thread '
  'are the same row with the anchor set or null. Append-only: an edit files '
  'the previous text in desk_message_revision. See db/013.';

-- ── desk_read ────────────────────────────────────────────────────────
--
-- Where each person stopped, per thread. One row per person per thread she has
-- ever looked at; the absence of a row means she has never opened it, which is
-- the correct starting state and needs no backfill.
--
-- Deliberately a MARK and not a COUNT. docs/copy-brief.md's ban on gimmick
-- mechanics applies to the tool too, and a number in a badge is a number two
-- people will start working to. `last_read_id` answers "is there anything new"
-- with a boolean, which is the only question either of them has.

create table desk_read (
  staff_id     uuid not null references staff(id) on delete cascade,
  thread_key   text not null,
  last_read_id bigint not null default 0,
  read_at      timestamptz not null default now(),

  primary key (staff_id, thread_key)
);

-- ── desk_todo ────────────────────────────────────────────────────────
--
-- The work. Four facts and no more: what it is, whose it is, whether it is
-- done, and when it was made.
--
-- NO PRIORITY, NO DUE DATE, NO LABELS, NO STATUS LADDER. Two people do not
-- need a project management tool, and every extra field is a field that goes
-- stale and then lies. The one thing beyond those four is `dismissed_at`, and
-- it earns its place below.
--
-- ── WHY THE ENGINE WRITES HERE ──────────────────────────────────────
--
-- The selection engine already discovers, precisely and mechanically, what the
-- catalogue is missing: "no game in the pool is an honouring ritual, and
-- birthday requires one". Those statements are the authoring queue, and until
-- now they existed only inside a run nobody read.
--
-- They matter more than they look, because an unfilled slot is SILENT to the
-- member — she simply does not receive that deliverable and is never told a
-- slot existed. This table is therefore the only place a gap becomes visible
-- to anybody at all. It is the primary output of the gap machinery, not a
-- convenience.
--
--   `gap_key`      what the gap IS — pool plus slot, not this run of it. The
--                  same gap fires on every selection for every applicant; one
--                  row is the correct number of rows.
--   `dismissed_at` "we are not doing this". A dismissed gap must not come back
--                  on the next run, and it does not: the row still exists, so
--                  the insert that would recreate it hits the unique index and
--                  does nothing. Dismissal is a fact that persists, which is
--                  exactly why the row is kept rather than deleted.
--
-- A gap that exists because the HOST opted out of a deliverable ("she is not
-- serving food, so there is no menu") is NOT work and must never reach this
-- table. That distinction is the engine's to make and is consumed, not
-- re-derived — see src/lib/desk/gaps.ts.

create table desk_todo (
  id            bigint generated always as identity primary key,

  body          text not null check (btrim(body) <> ''),

  -- Jessica, Tara, or nobody yet. Nobody yet is a real state and the default.
  assignee_id   uuid references staff(id) on delete set null,

  -- The same anchor as a message.
  subject_table text check (subject_table ~ '^[a-z][a-z0-9_]*$'),
  subject_id    uuid,

  -- Where it came from. 'curator' typed it; 'gap' means the engine found it.
  source        text not null default 'curator'
                  check (source in ('curator', 'gap')),
  -- Null for anything a person typed. Unique among gaps — see above.
  gap_key       text,
  -- Whatever the engine knew: the pool, the slot, the reason it gave.
  detail        jsonb not null default '{}'::jsonb
                  check (jsonb_typeof(detail) = 'object'),

  created_by    uuid references staff(id) on delete set null,
  created_at    timestamptz not null default now(),

  done_at       timestamptz,
  done_by       uuid references staff(id) on delete set null,

  dismissed_at  timestamptz,
  dismissed_by  uuid references staff(id) on delete set null,

  constraint desk_todo_anchor_is_whole
    check ((subject_table is null) = (subject_id is null)),
  constraint desk_todo_gap_key_matches_source
    check ((source = 'gap') = (gap_key is not null)),
  -- A person typed it, or the engine found it. Never neither.
  constraint desk_todo_has_an_origin
    check (source = 'gap' or created_by is not null),
  constraint desk_todo_done_is_whole
    check ((done_at is null) = (done_by is null)),
  constraint desk_todo_dismissed_is_whole
    check ((dismissed_at is null) = (dismissed_by is null))
);

-- One row per distinct gap, forever. This index is what makes "do not
-- resurrect a dismissed gap" free rather than a rule somebody has to remember.
create unique index desk_todo_gap_unique on desk_todo (gap_key)
  where gap_key is not null;

create index desk_todo_open_idx on desk_todo (created_at desc)
  where done_at is null and dismissed_at is null;
create index desk_todo_assignee_idx on desk_todo (assignee_id, done_at);
create index desk_todo_subject_idx on desk_todo (subject_table, subject_id);

comment on table desk_todo is
  'The authoring queue. Four fields on purpose. Rows with source = ''gap'' are '
  'written by the selection engine through src/lib/desk/gaps.ts and deduped on '
  'gap_key, so a dismissed gap never returns. See db/013.';

-- ── the two reads ────────────────────────────────────────────────────

create view desk_todo_open as
select t.*,
       a.email::text as assignee_email,
       nullif(btrim(a.name), '') as assignee_name
  from desk_todo t
  left join staff a on a.id = t.assignee_id
 where t.done_at is null and t.dismissed_at is null;

comment on view desk_todo_open is
  'Everything still to do. Dismissed gaps and finished work are both out.';

-- One row per thread: what it is about, how many messages, and the last one.
-- The count is for ordering the list, never for a badge.
create view desk_thread as
select m.thread_key,
       max(m.subject_table)  as subject_table,
       max(m.subject_id::text)::uuid as subject_id,
       count(*)              as message_count,
       max(m.id)             as last_message_id,
       max(m.created_at)     as last_message_at
  from desk_message m
 group by m.thread_key;

-- ─────────────────────────────────────────────────────────────────────
-- WHAT THIS DELIBERATELY DOES NOT DO
--
--   · No notifications, no push, no websockets, no polling table. Two people
--     do not need real time, and the moment there is a nudge worth sending,
--     Resend is already wired (src/lib/email.ts).
--   · No reactions, no threads-within-threads, no mentions. There are two
--     people; a mention is the word "you".
--   · No unread COUNTS. A mark, not a number. See desk_read.
--   · No delete, anywhere. A message is kept, a to-do is done or dismissed.
-- ─────────────────────────────────────────────────────────────────────
