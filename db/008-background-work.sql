-- ─────────────────────────────────────────────────────────────────────
-- BACKGROUND WORK — one jobs table, claimed by the web process itself
--
-- Applied by scripts/migrate.mjs after 007, inside one transaction together
-- with its schema_migrations ledger row. Same rule as every file before it:
-- nothing here may be a statement that refuses to run in a transaction.
--
-- New file, never applied anywhere, so no SENTINELS entry in
-- scripts/migrate.mjs. Discovery picks it up; the ledger makes it run once.
--
-- ── WHY THIS EXISTS, BEFORE THERE IS ANYTHING TO RUN ─────────────────
--
-- Assembling a Revelle is arithmetic and takes milliseconds — that is what
-- src/lib/selection/ does, and it can happily live inside a request. WRITING
-- one cannot. The invitation, the menu, the tracklist card and the prep list
-- are each a chain of language-model calls in the destination's voice, and a
-- chain of those runs for minutes, not for the seconds a web request should
-- hold a connection open for. Worse, Render replaces the instance on every
-- deploy, and anything mid-flight in that instance dies with it.
--
-- There is deliberately NO SEPARATE WORKER SERVICE. render.yaml describes one
-- web service and one database, and the rule that file exists to enforce — no
-- step of the pipeline may depend on a developer's machine — is satisfied by
-- keeping the moving parts to a minimum, not by adding a second one. So the
-- compensating design is this table: a request writes a row and returns; the
-- web process itself claims the row and runs it; the customer's page asks the
-- database where the work has got to.
--
-- Postgres is the queue. No Redis, no SQS, no broker. `for update skip locked`
-- is the whole of the concurrency mechanism and it has been the idiomatic
-- answer since 9.5.
--
-- ── THE ONE DESIGN DECISION WORTH ARGUING ABOUT ──────────────────────
--
-- THE UNIT OF WORK IS A PIECE, NOT A REVELLE.
--
-- The naive shape is one row per generation: run it, and if any call inside it
-- flakes, run the whole thing again. That is wrong in a way that costs real
-- money and real time — the menu succeeded, the tracklist card timed out, and
-- retrying rewrites the menu too. It also rewrites it DIFFERENTLY, because
-- these calls are not deterministic, so a retry silently changes work a curator
-- may already have read.
--
-- So a piece is a row. It fails alone, backs off alone, retries alone, and
-- carries its own error. What makes that more than a list of independent rows
-- is `parent_id`: a parent job fans out into pieces, goes to `waiting`, and is
-- woken by the database itself when the last of its pieces settles. The parent
-- is then re-queued rather than completed, so its handler gets another turn —
-- which is how a JOIN step (assemble the finished pieces into the Revelle) and
-- a SECOND WAVE (pick the tracklist first, then write the card about it) are
-- the same mechanism rather than two.
--
-- ── WHAT ONE ROW IS ──────────────────────────────────────────────────
--
--   job          one unit of work: either a piece, or the parent of pieces.
--                Self-referential, exactly two levels deep (see the depth
--                guard). Nothing else is added here — a queue that needs four
--                tables is a queue nobody will read.
--
-- The runner is src/lib/jobs/. The arithmetic that decides how long to wait
-- before a retry is deliberately NOT in this file — same discipline as
-- selection: see the note above job_status.
-- ─────────────────────────────────────────────────────────────────────


-- ── job_status ───────────────────────────────────────────────────────
--
-- An enum, and this is exactly the case 001's note reserves them for: a
-- lifecycle whose value set is genuinely closed and structural. Adding a state
-- to a queue is not a taste decision, it changes what the runner must do, and
-- it deserves a migration. Contrast `job.type` below, which is text.
--
-- The six, and why there are not five or seven:
--
--   queued     claimable, once run_after has passed. Covers BOTH "ready now"
--              and "waiting out a backoff" — there is no separate `retrying`
--              state because run_after already says everything a `retrying`
--              state would, and a status that means the same as another status
--              plus a timestamp is a status people get wrong.
--   running    claimed. run_after is now the LEASE DEADLINE — see the claim.
--   waiting    fanned out; has pieces that have not all settled. NOT claimable,
--              and the only state a row cannot leave under its own power: the
--              trigger on its children moves it.
--   succeeded  terminal.
--   failed     terminal, out of attempts, last_error says why. The state a
--              human is meant to find.
--   cancelled  terminal, stopped on purpose. Distinct from failed because
--              "we changed our mind" and "it broke" want different reactions,
--              and a queue that conflates them trains people to ignore failures.

create type job_status as enum (
  'queued',
  'running',
  'waiting',
  'succeeded',
  'failed',
  'cancelled'
);


-- ── job ──────────────────────────────────────────────────────────────

create table job (
  id            uuid primary key default gen_random_uuid(),

  -- The fan-out link. Null for a root job; set for a piece.
  --
  -- `on delete cascade` because a piece has no meaning without its parent —
  -- there is no orphan piece worth keeping, and the alternative (restrict) puts
  -- a foot in the door of every cleanup.
  parent_id     uuid references job(id) on delete cascade,

  -- WHAT TO RUN. Text, not an enum, and for the reason 001 gives at length:
  -- enums are for closed sets. The vocabulary of job types is the opposite of
  -- closed — every new piece of a Revelle adds one, and turning "add a job
  -- type" into a migration is exactly the friction that gets routed around with
  -- a generic `misc` type carrying a discriminator in the payload.
  --
  -- The registry of live types lives in src/lib/jobs/registry.ts, the same way
  -- the taste vocabulary lives in src/lib/quiz.ts. The check below enforces the
  -- SHAPE — namespaced, `area.verb` — so that the table is greppable by area
  -- and a typo is a constraint violation rather than a job nobody runs.
  type          text not null,

  -- The arguments, verbatim. Small by intention: an id and a couple of
  -- switches. Anything large belongs in its own table with the payload
  -- referencing it, because this column is read by every claim.
  payload       jsonb not null default '{}'::jsonb,

  -- What the handler produced. This is how a piece hands its work to the
  -- parent's join step without inventing a side channel: the parent selects its
  -- children and reads their results.
  result        jsonb,

  status        job_status not null default 'queued',

  -- Attempts counts CLAIMS, not failures — a job whose runner was killed
  -- mid-flight has genuinely been attempted, and not counting that is how a
  -- process-crashing job loops forever.
  --
  -- It is also what bounds the number of fan-out WAVES a parent can run, since
  -- each wave costs the parent one claim. That is deliberate and it is the
  -- reason there is no separate wave counter: a handler that returns "waiting"
  -- forever cannot spin, it runs out of attempts and fails visibly. A parent
  -- that legitimately needs many waves is told to raise its own max_attempts.
  attempts      integer not null default 0,
  max_attempts  integer not null default 5,

  -- NOT BEFORE. One column doing two jobs, which is the small trick this whole
  -- table turns on:
  --
  --   status = 'queued'   -> do not claim before this. Backoff lives here.
  --   status = 'running'  -> THE LEASE DEADLINE. Past it, the claim takes the
  --                          row back on the assumption its runner is dead.
  --
  -- Collapsing "retry not before" and "lease expires" into one column means the
  -- claim has ONE predicate and ONE index, and — more to the point — it means
  -- deploy survival is not a separate mechanism that can rot from disuse. A
  -- Render deploy that kills an instance mid-generation leaves rows in
  -- `running` with a deadline; the next instance picks them up by the same
  -- query it uses for everything else.
  run_after     timestamptz not null default now(),

  -- How long a claim is good for. Per job rather than global because the spread
  -- is real — a confirmation email is seconds, a four-call generation chain is
  -- minutes — and a single lease long enough for the slowest job would leave
  -- the fastest one stuck for that long after a crash.
  --
  -- Too short is the dangerous direction: the lease expires while the work is
  -- still running, a second runner claims it, and the job runs twice. Handlers
  -- must therefore be written to tolerate that (see src/lib/jobs/README of the
  -- runner module header) and leases set with room to spare.
  lease_seconds integer not null default 180,

  -- Which runner instance holds it. Purely for the human reading the table
  -- after an incident: "everything stuck was held by the instance that
  -- restarted at 04:12" is the sentence this column exists to make possible.
  claimed_by    text,
  claimed_at    timestamptz,

  -- IDEMPOTENCE AT THE DOOR. Unique among live jobs only (see the index), so
  -- "generate for revelle X" cannot be queued twice by a double-clicked button,
  -- while a later, deliberate regeneration of the same Revelle is free to reuse
  -- the key once the first one has settled.
  dedupe_key    text,

  -- WHAT IT IS ABOUT — and a real foreign key rather than a polymorphic
  -- (entity_table, entity_id) pair like facet_tag_entity in 002.
  --
  -- That pattern earns its keep where the same tag has to reach a dozen
  -- ingredient pools. Here there is exactly one subject anyone polls for: a
  -- customer sitting on a page waiting for her Revelle. A real FK gives the
  -- cheap indexed lookup that page needs, gives cascade-delete for free, and
  -- cannot point at a row that does not exist. When a second pollable subject
  -- appears, a second nullable FK column is still cheaper — to read and to
  -- query — than a polymorphic table plus a union view.
  --
  -- Null for work that is about nothing in particular (a nightly sweep).
  revelle_id    uuid references revelle(id) on delete cascade,

  -- THE THING SOMEONE DEBUGS FROM. Never cleared by a later success — see the
  -- implication constraint below, which is deliberately not an equality.
  last_error    text,
  last_error_at timestamptz,

  -- Every failure this job has had, oldest first, capped by job_append_error().
  -- `last_error` is what you read; this is what you read when the last error is
  -- not the interesting one — three timeouts followed by a 401 is a different
  -- story from a 401 followed by three timeouts, and only the history tells it.
  error_log     jsonb not null default '[]'::jsonb,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- First claim, ever. Not moved by a retry: the gap between created_at and
  -- started_at is queue latency, and a retry overwriting it would erase the one
  -- number that says whether the runner is keeping up.
  started_at    timestamptz,
  finished_at   timestamptz,

  -- `area.verb`, lowercase, at least one dot. Shape only — the vocabulary is
  -- the registry's business, not the database's.
  constraint job_type_shaped
    check (type ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$'),

  constraint job_attempts_sane
    check (attempts >= 0 and max_attempts >= 1),

  -- Long enough that no plausible handler finishes inside a lease it cannot
  -- renew; short enough that a dead instance's work comes back the same hour.
  constraint job_lease_sane
    check (lease_seconds between 5 and 3600),

  -- AN EQUALITY, unlike revelle's delivered_has_timestamp which 003 calls a
  -- wart. Here it is right: leaving a terminal state is a deliberate act (an
  -- operator re-queues a failed job), and a re-queued job MUST lose its
  -- finished_at, because it has not finished.
  constraint job_terminal_has_finished
    check ((status in ('succeeded', 'failed', 'cancelled')) = (finished_at is not null)),

  constraint job_finished_implies_started
    check (finished_at is null or started_at is not null),

  -- AN IMPLICATION, not an equality, and the asymmetry is the point: a failed
  -- job must say why, but a job that failed twice and then succeeded KEEPS its
  -- last_error. Forcing that to null on success would delete the evidence that
  -- the thing is flaky, which is the evidence worth having.
  constraint job_failed_has_error
    check (status <> 'failed' or last_error is not null),

  constraint job_not_own_parent
    check (parent_id is distinct from id)
);

comment on table job is
  'Background work. One row per unit; a piece is a unit and so is the parent '
  'that fans out into pieces. Claimed with for-update-skip-locked by the web '
  'process itself — there is no worker service. See db/008.';

comment on column job.run_after is
  'Not before. While queued: the backoff deadline. While running: the LEASE '
  'deadline, past which another runner may take the row back. One column '
  'because retry-later and lease-expiry are the same question.';

comment on column job.attempts is
  'Claims, not failures. Bounds retries AND fan-out waves, since a parent '
  'spends one claim per wave.';


-- ── the touch trigger ────────────────────────────────────────────────
--
-- Same set_updated_at() as everything since 001. Note that a claim is an
-- update, so updated_at is also "when something last happened to this row",
-- which is the column an operator will sort by without being told to.

create trigger job_touch before update on job
  for each row execute function set_updated_at();


-- ── indexes ──────────────────────────────────────────────────────────

-- THE CLAIM INDEX. Everything about the shape of this table was chosen so that
-- this index is the only one the hot path touches.
--
-- Partial on the two live statuses, so settled rows — which is nearly all rows,
-- forever — are not in it at all. The queue stays the size of the backlog
-- rather than the size of history, which is what keeps `order by run_after` a
-- cheap ordered scan of a handful of pages a year from now.
--
-- Note what is NOT in it: `type`. A runner that filters by type pays a filter
-- on a small ordered result, which is the right trade for not carrying a
-- second column through every insert and update. If a real hot type-filtered
-- claim appears, it gets its own partial index for that type by name.
create index job_runnable_idx on job (run_after, created_at)
  where status in ('queued', 'running');

-- Fan-in. Read by settle_job_parent() on every piece that settles, and by the
-- status view once per poll.
create index job_parent_idx on job (parent_id)
  where parent_id is not null;

-- "Where is this Revelle's generation up to." The whole point of the FK.
create index job_revelle_idx on job (revelle_id, created_at desc)
  where revelle_id is not null;

-- Idempotence at the door, live jobs only. Once a job settles its key is
-- released, so a deliberate regeneration months later is not blocked by the
-- ghost of the first one.
create unique index job_dedupe_live_idx on job (dedupe_key)
  where dedupe_key is not null
    and status in ('queued', 'running', 'waiting');

-- The operator's read: what has actually broken, most recent first. Partial, so
-- it costs nothing on a healthy queue — an empty index on an empty set.
create index job_failed_idx on job (finished_at desc)
  where status = 'failed';

-- EVERY LIVE ROW, for counting. Overlaps job_runnable_idx and is not a
-- duplicate of it: that one omits `waiting` deliberately, because a waiting job
-- is not claimable and carrying it through the claim's index would make the hot
-- path read pages it can never use. This one exists so that job_queue_health
-- can count the queue without touching history — which is the difference
-- between an operator view that stays fast and one that gets slower every week
-- the service runs.
create index job_live_idx on job (status, run_after)
  where status in ('queued', 'running', 'waiting');


-- ── job_append_error ─────────────────────────────────────────────────
--
-- Appends one failure to error_log and keeps the tail. A function rather than
-- an expression inlined into the runner's UPDATE because the capping arithmetic
-- is the kind of thing that gets copied wrong the second time it is needed, and
-- because `set error_log = job_append_error(error_log, ...)` reads as what it
-- is at the call site.
--
-- Capped because a job retried into the ground under a provider outage would
-- otherwise carry an unbounded array through every read of the row. Ten is
-- enough to see a pattern; the pattern is the reason to keep any of them.

create or replace function job_append_error(
  p_log     jsonb,
  p_attempt integer,
  p_error   text
) returns jsonb
language sql immutable as $$
  select coalesce(jsonb_agg(entry order by ord), '[]'::jsonb)
    from (
      select entry, ord
        from jsonb_array_elements(
               coalesce(p_log, '[]'::jsonb)
               || jsonb_build_array(jsonb_build_object(
                    'attempt', p_attempt,
                    'at',      to_char(now() at time zone 'utc',
                                       'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
                    'error',   p_error))
             ) with ordinality as t(entry, ord)
       order by ord desc
       limit 10
    ) kept;
$$;


-- ── the depth guard ──────────────────────────────────────────────────
--
-- EXACTLY TWO LEVELS. A parent may have pieces; a piece may not.
--
-- This is a restriction on purpose, not an oversight. Everything a generation
-- needs — fan out, join, fan out again — is expressible at one level, because
-- the parent gets another turn after each wave. What arbitrary depth would buy
-- is a recursive progress query, and a recursive progress query is the kind of
-- thing that is subtly wrong for a year: the view below aggregates DIRECT
-- children, and if a grandchild could exist the progress bar would quietly stop
-- counting some of the work.
--
-- So the constraint and the view agree by construction. Hitting this error is
-- better than reading a number that is a lie. If real depth is ever needed it
-- is a later migration plus a recursive view, decided together.
--
-- The second half is a different bug, caught in the same place: enqueueing a
-- piece under a parent that has already given up. That happens when a handler
-- keeps working after its lease expired and its job was failed out from under
-- it, and the piece it creates would never be joined by anyone.

create or replace function job_depth_guard() returns trigger
language plpgsql as $$
declare
  v_parent record;
begin
  if new.parent_id is null then
    return new;
  end if;

  select id, parent_id, status, type into v_parent
    from job where id = new.parent_id;

  if v_parent.parent_id is not null then
    raise exception
      'Job % cannot be a piece of %, which is itself a piece.', new.type, v_parent.type
      using
        hint = 'The job tree is exactly two levels deep. A parent that needs '
               'another round of work returns waiting again and gets another '
               'turn — see the fan-out note in db/008.';
  end if;

  if v_parent.status in ('succeeded', 'failed', 'cancelled') then
    raise exception
      'Job % cannot be added to parent %, which has already settled as %.',
      new.type, v_parent.id, v_parent.status
      using
        hint = 'Nothing would ever join this piece. The usual cause is a '
               'handler still running after its lease expired and its job was '
               'reaped — check job.claimed_by and job.run_after.';
  end if;

  return new;
end;
$$;

create trigger job_depth before insert or update of parent_id on job
  for each row execute function job_depth_guard();


-- ── settle_job_parent ────────────────────────────────────────────────
--
-- THE FAN-IN. Called for a parent whose pieces may all have settled, and the
-- one piece of logic in this file that had to be thought about twice.
--
-- WHAT IT DECIDES
--
--   any piece still open      -> nothing. Someone else will be last.
--   any piece failed          -> parent fails, naming the piece and carrying
--                                its error up. A Revelle missing its menu is
--                                not a delivered Revelle.
--   any piece cancelled       -> parent cancels.
--   all succeeded             -> parent goes back to QUEUED, not to succeeded.
--                                Its handler gets another turn: it either
--                                assembles the finished pieces and declares
--                                itself done, or fans out a second wave.
--   no pieces at all          -> parent fails. A handler that says "I am
--                                waiting" and enqueued nothing would otherwise
--                                spin: waiting, woken, waiting, woken.
--   out of attempts           -> parent fails rather than being re-queued into
--                                a claim it is no longer eligible for.
--
-- WHY THE `for update`, WHICH IS THE PART THAT MATTERS
--
-- Two transactions race here and both orders must work:
--
--   A. the last piece settles, and its trigger calls this
--   B. the runner marks the parent `waiting` and calls this
--
-- If B commits first, A finds `waiting` and resolves the parent. If A runs
-- first it finds the parent still `running`, does nothing, and commits —
-- releasing the row lock B was blocked on, so B then sees the piece as settled
-- and resolves it itself. Without the lock there is an interleaving where each
-- sees the other as unfinished and the parent waits forever with nothing left
-- to wake it. That failure is invisible: no error, no retry, just a Revelle
-- that never appears.
--
-- The lock is taken here, in one place, so that both callers get it whether or
-- not they remember to.

create or replace function settle_job_parent(p_parent uuid) returns void
language plpgsql as $$
declare
  v_parent      record;
  v_total       integer;
  v_open        integer;
  v_failed      integer;
  v_cancelled   integer;
  v_culprit     record;
begin
  if p_parent is null then
    return;
  end if;

  -- Serialises the two callers above. See the note.
  select id, status, attempts, max_attempts, type
    into v_parent
    from job
   where id = p_parent
     for update;

  if not found or v_parent.status <> 'waiting' then
    return;
  end if;

  select count(*),
         count(*) filter (where status in ('queued', 'running', 'waiting')),
         count(*) filter (where status = 'failed'),
         count(*) filter (where status = 'cancelled')
    into v_total, v_open, v_failed, v_cancelled
    from job
   where parent_id = p_parent;

  if v_open > 0 then
    return;
  end if;

  if v_total = 0 then
    update job
       set status        = 'failed',
           finished_at   = now(),
           last_error    = 'declared itself waiting but enqueued no pieces',
           last_error_at = now(),
           error_log     = job_append_error(error_log, attempts,
                             'declared itself waiting but enqueued no pieces')
     where id = p_parent;
    return;
  end if;

  if v_failed > 0 then
    -- The first piece to fail, which is usually the cause rather than a
    -- casualty of it. Its error is carried up verbatim: the parent's error
    -- should be readable without a second query.
    select id, type, last_error into v_culprit
      from job
     where parent_id = p_parent and status = 'failed'
     order by finished_at
     limit 1;

    update job
       set status        = 'failed',
           finished_at   = now(),
           last_error    = format('piece %s (%s) failed: %s',
                                  v_culprit.type, v_culprit.id,
                                  coalesce(v_culprit.last_error, 'no error recorded')),
           last_error_at = now(),
           error_log     = job_append_error(error_log, attempts,
                             format('piece %s (%s) failed: %s',
                                    v_culprit.type, v_culprit.id,
                                    coalesce(v_culprit.last_error, 'no error recorded')))
     where id = p_parent;
    return;
  end if;

  if v_cancelled > 0 then
    update job
       set status      = 'cancelled',
           finished_at = now()
     where id = p_parent;
    return;
  end if;

  -- Every piece succeeded. Out of attempts is still a failure — re-queueing
  -- here would put the row in a state the claim will not touch, which is the
  -- silent-stall shape this whole function exists to avoid.
  if v_parent.attempts >= v_parent.max_attempts then
    update job
       set status        = 'failed',
           finished_at   = now(),
           last_error    = format(
             'all %s pieces succeeded but the parent had no attempts left '
             '(%s of %s used) to join them',
             v_total, v_parent.attempts, v_parent.max_attempts),
           last_error_at = now(),
           error_log     = job_append_error(error_log, attempts, format(
             'all %s pieces succeeded but the parent had no attempts left', v_total))
     where id = p_parent;
    return;
  end if;

  update job
     set status    = 'queued',
         run_after = now()
   where id = p_parent;
end;
$$;


-- ── job_mark_waiting ─────────────────────────────────────────────────
--
-- A runner whose handler has fanned out calls THIS, not a bare update, and the
-- reason is a Postgres subtlety worth stating rather than rediscovering.
--
-- The two things that must happen together are "mark the parent waiting" and
-- "check whether its pieces already all settled" — see the race in the note
-- above settle_job_parent. Together means one transaction, and a caller holding
-- a POOL rather than a client cannot promise two statements land on the same
-- connection.
--
-- The obvious fix — one statement with a data-modifying CTE — is WRONG here.
-- Every sub-statement of a single SQL statement sees the same snapshot, so
-- settle_job_parent() would read the row as it was BEFORE the CTE's update,
-- find it still 'running', and return without doing anything. The parent would
-- wait forever.
--
-- Inside plpgsql each statement takes its own snapshot under read committed, so
-- the `perform` below genuinely sees the update above it. One `select
-- job_mark_waiting(...)` from a pool is one implicit transaction containing
-- both, which is exactly what is needed and nothing more.
--
-- The attempt argument is a FENCING TOKEN — see the note in src/lib/jobs/
-- queue.ts. A runner whose lease quietly expired mid-handler no longer owns
-- this row; another instance has claimed it, which incremented `attempts`, and
-- the stale runner must not be able to move it. Returns false in that case,
-- which is the runner's signal to drop the work on the floor rather than fight
-- for it.

create or replace function job_mark_waiting(
  p_job     uuid,
  p_attempt integer
) returns boolean
language plpgsql as $$
begin
  update job
     set status    = 'waiting',
         run_after = now()
   where id = p_job
     and status = 'running'
     and attempts = p_attempt;

  if not found then
    return false;
  end if;

  perform settle_job_parent(p_job);
  return true;
end;
$$;


-- Fires only on the transition INTO a terminal state, and only for a piece.
-- `when` rather than an early return inside the function so that the ordinary
-- case — a claim, which is an update — never enters plpgsql at all.

create or replace function job_settled() returns trigger
language plpgsql as $$
begin
  perform settle_job_parent(new.parent_id);
  return null;
end;
$$;

create trigger job_settle_parent after update on job
  for each row
  when (new.parent_id is not null
        and old.status is distinct from new.status
        and new.status in ('succeeded', 'failed', 'cancelled'))
  execute function job_settled();


-- ── cancel_job ───────────────────────────────────────────────────────
--
-- Stops a job and everything under it. A function rather than an update in the
-- application because the tree walk and the terminal-state bookkeeping must not
-- be re-derived at each call site, and because cancelling a parent without its
-- pieces leaves pieces running for a Revelle nobody is waiting for — which is
-- the exact mistake this makes unavailable.
--
-- Already-settled rows are left alone: a piece that succeeded before the
-- cancellation did succeed, and rewriting it to `cancelled` would lose the
-- result it produced (which the next attempt may well be able to reuse).
--
-- Returns how many rows it actually stopped, so a caller can say "already
-- finished" rather than pretending it did something.

create or replace function cancel_job(p_job uuid, p_reason text default null)
returns integer
language plpgsql as $$
declare
  v_count integer;
begin
  -- LOCK ORDER, and it is not arbitrary. A piece settling takes its own row
  -- first (the update that settles it) and the parent second (the `for update`
  -- inside settle_job_parent). If this function took them the other way round —
  -- parent first, then pieces — a cancellation landing at the same moment as a
  -- piece finishing would deadlock, and Postgres would abort one of them at
  -- random. Taking pieces before the parent, in the same order the trigger
  -- does, means the two can only ever queue behind each other.
  perform 1 from job where parent_id = p_job order by id for update;
  perform 1 from job where id = p_job for update;

  with stopped as (
    update job
       set status      = 'cancelled',
           finished_at = now(),
           last_error  = coalesce(p_reason, last_error),
           last_error_at = case when p_reason is null then last_error_at else now() end
     where (id = p_job or parent_id = p_job)
       and status in ('queued', 'running', 'waiting')
    returning 1
  )
  select count(*) into v_count from stopped;

  return v_count;
end;
$$;

comment on function cancel_job(uuid, text) is
  'Cancel a job and its unsettled pieces. Leaves settled rows alone. Returns '
  'the number of rows stopped.';


-- ── revelle_generation_status ────────────────────────────────────────
--
-- THE POLL. One row per root job about a Revelle, with its pieces counted.
--
-- This is the query a customer's page runs every couple of seconds while she
-- waits, so it must not scan: `job_revelle_idx` finds the root jobs for one
-- Revelle, and `job_parent_idx` counts each one's pieces. Both are partial
-- indexes over the small live-ish subsets, and the lateral means the piece
-- counts are computed for the handful of rows that survived the where clause,
-- not for the table.
--
-- What the UI actually needs, and therefore what is here:
--
--   done?            status = 'succeeded'
--   in progress?     status in ('queued','running','waiting'), and
--                    pieces_succeeded / pieces_total is an honest progress bar
--   failed, and why? status = 'failed', last_error, and — because the parent's
--                    error is a summary — piece_error, the failing piece's own
--                    words
--   should I keep polling? next_attempt_at, which is NULL EXACTLY WHEN THE JOB
--                    IS TERMINAL and otherwise the soonest moment anything is
--                    due to happen.
--
-- That last one is worth spelling out, because the obvious definition is wrong
-- and was wrong here first. Reading it off the parent's own run_after gives
-- null while the parent sits in `waiting` — which is most of a generation, and
-- exactly when the page must keep polling. A parent that is waiting has no
-- attempt of its own scheduled; its PIECES do. So the column takes the earliest
-- of the two, and a page can use the simple rule (poll until it is null)
-- instead of the compound one nobody would remember.

create view revelle_generation_status as
select j.revelle_id,
       j.id                as job_id,
       j.type,
       j.status,
       j.attempts,
       j.max_attempts,
       j.created_at,
       j.started_at,
       j.finished_at,
       -- Null if and only if this job has settled. Otherwise the soonest
       -- moment anything will happen — the parent's own next attempt, or the
       -- earliest of its pieces', whichever comes first. `least` ignores
       -- nulls; the coalesce covers the instant where the parent is awake but
       -- nothing is scheduled yet, which reads as "any moment now".
       case
         when j.status in ('succeeded', 'failed', 'cancelled') then null
         else coalesce(
           least(
             case when j.status in ('queued', 'running') then j.run_after end,
             p.next_piece_at),
           now())
       end                 as next_attempt_at,
       j.last_error,
       coalesce(p.total, 0)      as pieces_total,
       coalesce(p.succeeded, 0)  as pieces_succeeded,
       coalesce(p.running, 0)    as pieces_running,
       coalesce(p.pending, 0)    as pieces_pending,
       coalesce(p.failed, 0)     as pieces_failed,
       p.failed_piece_type,
       p.piece_error
  from job j
  left join lateral (
    select count(*)                                              as total,
           count(*) filter (where c.status = 'succeeded')        as succeeded,
           count(*) filter (where c.status = 'running')           as running,
           count(*) filter (where c.status in ('queued', 'waiting')) as pending,
           count(*) filter (where c.status = 'failed')            as failed,
           min(c.run_after) filter (
             where c.status in ('queued', 'running'))             as next_piece_at,
           (array_agg(c.type order by c.finished_at)
              filter (where c.status = 'failed'))[1]              as failed_piece_type,
           (array_agg(c.last_error order by c.finished_at)
              filter (where c.status = 'failed'))[1]              as piece_error
      from job c
     where c.parent_id = j.id
  ) p on true
 where j.revelle_id is not null
   and j.parent_id is null;

comment on view revelle_generation_status is
  'Where a Revelle''s generation has got to: one row per root job, its pieces '
  'counted, the failing piece''s own error carried alongside the parent''s '
  'summary. Index-driven — this is polled from a page.';


-- ── job_queue_health ─────────────────────────────────────────────────
--
-- The operator's one-line answer to "is the queue alive". Deliberately tiny.
--
-- `oldest_runnable_age` is the number that matters and the only one worth
-- alerting on: if it grows past a few minutes the runner is not running, and
-- every other symptom of that — a page that never finishes, an email that
-- never sends — is downstream of it.
--
-- WHY SEVEN SUBQUERIES AND NOT ONE AGGREGATE WITH SEVEN FILTERS.
--
-- The obvious form — `select count(*) filter (…), … from job` — reads better
-- and is a sequential scan of the whole table, because one aggregate over one
-- FROM has to visit every row before it can filter anything. That is fine for a
-- week and slower every week after: this table keeps its history, so the cost
-- of asking "is the queue alive" would grow with how long the service has been
-- alive, which is precisely backwards.
--
-- Split into subqueries, each one is index-driven — the live counts by
-- job_live_idx, the failure numbers by job_failed_idx — and the cost tracks the
-- size of the BACKLOG rather than the size of the archive.
--
-- The failure count is bounded to a day for the same reason. "How many jobs
-- have ever failed" is a number that only goes up and that nobody can act on;
-- "how many failed today" is the one worth putting on a dashboard.

create view job_queue_health as
select (select count(*) from job where status = 'queued')  as queued,
       (select count(*) from job where status = 'running') as running,
       (select count(*) from job where status = 'waiting') as waiting,
       (select count(*) from job
         where status = 'running' and run_after < now())   as leases_expired,
       (select now() - min(run_after) from job
         where status in ('queued', 'running')
           and run_after <= now())                         as oldest_runnable_age,
       (select count(*) from job
         where status = 'failed'
           and finished_at > now() - interval '24 hours')  as failed_last_day,
       (select max(finished_at) from job
         where status = 'failed')                          as last_failure_at;

comment on view job_queue_health is
  'Is the queue alive. oldest_runnable_age growing past a few minutes means '
  'nothing is claiming — that is the alert. Index-driven, so it does not get '
  'slower as history accumulates.';
