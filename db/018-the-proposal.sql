-- Revelle Société — THE PROPOSAL: what the engine chose, before a human agreed
--
-- Applied by scripts/migrate.mjs after 017, inside one transaction together
-- with its schema_migrations ledger row. Same rule as every file before it:
-- nothing here may be a statement that refuses to run in a transaction. New
-- file, never applied anywhere, so no SENTINELS entry in scripts/migrate.mjs.
--
-- ─────────────────────────────────────────────────────────────────────
-- WHY THIS TABLE EXISTS AT ALL
--
-- The selection engine (src/lib/selection/) is pure. It takes a snapshot and
-- returns candidates, and its own header says why persisting one belongs to
-- the caller: "Generation will eventually be a job rather than a request, and
-- an engine that writes as it goes is much harder to retry safely."
--
-- That job now exists — `revelle.generate`, db/008's first real handler — and
-- it needs somewhere to put what it found. Until this file the answer was
-- nowhere: a run happened inside a request, was rendered, and was thrown away.
-- An application landed in the desk inbox and stopped.
--
-- ── WHY NOT JUST WRITE A `revelle` ROW PER CANDIDATE ────────────────
--
-- That is the obvious shape and it is refused by the schema, correctly.
--
--   1. `revelle.quiz_response_id` is UNIQUE (db/001). One application has one
--      Revelle. Three candidates cannot be three Revelles without breaking the
--      one promise that sentence makes.
--   2. A `revelle` row is a thing that exists FOR HER. db/003 draws the line at
--      delivery, but even a draft Revelle is her record — it carries her access
--      token, it is what the portal reads, and `first_delivered_at` hangs off
--      it. A machine's third-best guess is not that.
--
-- So a proposal is its own kind of thing, and the difference is the whole
-- point of the file: BEFORE APPROVAL IT IS A PROPOSAL, AFTER APPROVAL IT IS A
-- REVELLE. Approval is the moment a `revelle` row and its `revelle_<pool>`
-- rows are written, which is also the moment the fingerprint machinery in
-- db/002 starts applying to it and the moment db/003's ratchet becomes
-- reachable. Nothing before that touches either.
--
-- ── WHAT IS STORED, AND WHAT IS DELIBERATELY NOT ────────────────────
--
-- Enough that the desk can show a curator what was chosen and why, and enough
-- that approval can materialise it without re-running anything. That means the
-- picks as rows (approval reads them to write `revelle_<pool>`) and the
-- curator's account as jsonb (nothing queries inside it; it is prose).
--
-- EVERY jsonb COLUMN HERE IS HOUSE-FACING. `explanation`, `gaps`, `dropped`,
-- `swaps`, `budget` and `blocked` are the sentences src/lib/selection/explain.ts
-- writes for a curator, and src/lib/selection/member.ts is explicit that not one
-- of them may reach a member. Nothing in the portal reads this table — it reads
-- `revelle` and the join tables, which is the same wall held at the level of
-- the schema rather than at the level of a component's `if`.
--
-- ── THE FINGERPRINT IS STORED AND NOT CONSTRAINED ───────────────────
--
-- `fingerprint` is the ENGINE's digest (src/lib/selection/novelty.ts), kept so
-- a curator can see that two proposals really are different objects and so the
-- `blocked` verdict can be read back with the thing it is about.
--
-- There is deliberately NO unique index on it. db/003 settled where uniqueness
-- binds and the answer is delivery, not proposal — "Drafts and previews may
-- collide with each other and with anything else, freely and in any number."
-- A proposal is upstream of even a preview. Constraining it here would forbid
-- the comparison workflow db/003 exists to permit, and it would do it with a
-- digest computed by a different sorter than the one the promise is enforced
-- with (see the collation note in novelty.ts).
--
-- ── AT-LEAST-ONCE, WHICH IS WHY (job_id, rank) IS UNIQUE ────────────
--
-- db/008's author was explicit: a slow handler whose lease expires runs twice,
-- and only one of the two can record an outcome but BOTH do the work. So the
-- side effect has to be keyed on the job id.
--
-- Here it is keyed twice over. `job_id` says which run produced a proposal, and
-- `unique (job_id, rank)` means the second run of the same job inserts nothing:
-- the handler's insert is `on conflict do nothing`, and because the handler
-- also derives the engine's SEED from the job id, the second run computes the
-- identical candidates before discovering it has nothing to write. Two runs of
-- one job leave one set of proposals, and they are the same set either way.
--
-- ─────────────────────────────────────────────────────────────────────
-- CONTENTS
--
--   proposal_status        proposed → approved / rejected / superseded
--   revelle_proposal       one candidate from one run
--   revelle_proposal_pick  what was placed in which slot
--   revelle_proposal_live  the current run's proposals (view)
-- ─────────────────────────────────────────────────────────────────────


-- ── proposal_status ──────────────────────────────────────────────────
--
-- An enum, and this is the case db/001's note reserves them for: a lifecycle
-- whose value set is closed and structural, exactly like `job_status`. Adding a
-- state changes what the desk must do with it and deserves a migration.
--
-- The four, and why there are not three or five:
--
--   proposed    the engine's output, waiting for a human.
--   approved    a curator agreed. A `revelle` row exists and is named in
--               revelle_id. Terminal.
--   rejected    a curator said no to THIS one. Its siblings are untouched and
--               still approvable — "reject it and ask for another" is two
--               different asks and this is the cheaper one.
--   superseded  not chosen, and no longer choosable: either a sibling was
--               approved, or a later run replaced the whole set. Distinct from
--               `rejected` because nobody judged it, and a queue that conflates
--               "she said no" with "it stopped being relevant" throws away the
--               only negative signal in the system worth having
--               (docs/selection-spec.md: "Every edit is a signal").

create type proposal_status as enum (
  'proposed',
  'approved',
  'rejected',
  'superseded'
);


-- ── revelle_proposal ─────────────────────────────────────────────────

create table revelle_proposal (
  id               uuid primary key default gen_random_uuid(),

  -- Whose application. `on delete cascade` because a proposal about a response
  -- that no longer exists is about nothing — and quiz_response is append-only
  -- and never deleted in practice, so this is a statement rather than a policy.
  quiz_response_id uuid not null references quiz_response(id) on delete cascade,

  -- WHICH RUN MADE IT. The at-least-once key; see the note above.
  --
  -- `on delete restrict`, not cascade: the job row is the evidence of how this
  -- proposal came to exist, including its error log and how many attempts it
  -- took. Losing the proposals because somebody tidied the queue would destroy
  -- the record and the work in one statement.
  job_id           uuid not null references job(id) on delete restrict,

  -- The engine's own rank, 1 being what it would choose. Not a score: two
  -- proposals from one run are ordered by this and by nothing else.
  rank             integer not null check (rank >= 1),

  -- restrict, matching revelle.world_id in db/001: a destination somebody has
  -- been proposed cannot be deleted out from under the proposal. Retire it.
  world_id         uuid not null references world(id) on delete restrict,

  -- What the run was, reproducibly. The seed is derived from job_id by the
  -- handler, so this column also documents that derivation for anyone trying to
  -- explain a candidate a year from now.
  seed             bigint not null,

  destination_score numeric(6,4) not null,
  -- The sum of the picks' scores. Comparable within a run and meaningless
  -- across runs, which is why nothing indexes or orders by it.
  score             numeric(10,4) not null,

  -- The engine's digest of the assemblage. See the note above: stored, never
  -- constrained, never compared with the database's own digest.
  fingerprint      text,

  -- MANDATORY CURATOR REVIEW. Not a downgrade and not a reason to withhold.
  low_confidence   boolean not null default false,

  -- WHY THIS ONE MUST NOT GO OUT, or null when it may. The only thing that
  -- ever sets it is assemblage uniqueness — this exact set has already been
  -- delivered to someone. A catalogue gap NEVER sets it. The approval path
  -- refuses a proposal carrying this, and its wording never leaves the house.
  blocked          text,

  -- The curator's account, verbatim from explain(). HOUSE ONLY, every field.
  explanation      jsonb not null default '{}'::jsonb
                     check (jsonb_typeof(explanation) = 'object'),
  budget           jsonb not null default '{}'::jsonb
                     check (jsonb_typeof(budget) = 'object'),
  -- WORK ORDERS for the house. Also written to desk_todo through
  -- src/lib/desk/gaps.ts, which is where a human actually reads them; kept here
  -- as well so a proposal can be explained without joining to a to-do list that
  -- may since have been dismissed.
  gaps             jsonb not null default '[]'::jsonb
                     check (jsonb_typeof(gaps) = 'array'),
  -- SLOTS SHE DOES NOT HAVE (db/014). NOT work orders, and never mixed into
  -- the list above — that distinction is the engine's and is consumed here,
  -- never re-derived.
  excluded         jsonb not null default '[]'::jsonb
                     check (jsonb_typeof(excluded) = 'array'),
  dropped          jsonb not null default '[]'::jsonb
                     check (jsonb_typeof(dropped) = 'array'),
  swaps            jsonb not null default '[]'::jsonb
                     check (jsonb_typeof(swaps) = 'array'),

  status           proposal_status not null default 'proposed',

  -- Who decided, and when. A decision with no author is not a decision; db/011
  -- built `staff` so that a change has one, and this is a change.
  decided_at       timestamptz,
  decided_by       uuid references staff(id) on delete set null,
  -- Why she said no, in her words. The highest-value observation in the system
  -- per docs/selection-spec.md, and there is nowhere else for it.
  decision_note    text,

  -- What approval produced. Null until then.
  revelle_id       uuid references revelle(id) on delete set null,

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  -- One row per rank per run. THE IDEMPOTENCY KEY — see the note above.
  constraint revelle_proposal_run_rank_unique unique (job_id, rank),

  constraint revelle_proposal_decided_is_whole
    check ((decided_at is null) = (decided_by is null)),
  -- A decision is a human act. `superseded` is not one — it happens TO a
  -- proposal — so it is the one non-'proposed' status that may carry no author.
  constraint revelle_proposal_judged_has_author
    check (status in ('proposed', 'superseded') or decided_by is not null),
  -- Approval IS the Revelle. There is no approved proposal without one, and
  -- nothing but approval may name one.
  constraint revelle_proposal_approved_is_a_revelle
    check ((status = 'approved') = (revelle_id is not null))
);

create trigger revelle_proposal_touch before update on revelle_proposal
  for each row execute function set_updated_at();

-- The desk's read: this application's proposals, best first.
create index revelle_proposal_application_idx
  on revelle_proposal (quiz_response_id, created_at desc, rank);

-- "What is waiting for a human" — the only unqualified list anyone wants.
create index revelle_proposal_open_idx
  on revelle_proposal (created_at desc) where status = 'proposed';

create index revelle_proposal_revelle_idx
  on revelle_proposal (revelle_id) where revelle_id is not null;

comment on table revelle_proposal is
  'What the selection engine chose, before a human agreed. Written by the '
  'revelle.generate job (src/lib/revelle/generate.ts), one row per candidate '
  'per run, keyed on the job id so a job that runs twice writes one set. '
  'Approval materialises it into revelle + revelle_<pool>. Every jsonb column '
  'is house-facing and none of it may reach a member. See db/018.';


-- ── revelle_proposal_pick ────────────────────────────────────────────
--
-- WHAT WAS PLACED, IN WHICH SLOT. Rows rather than jsonb, for one reason that
-- decides it: approval reads this table and writes `revelle_<pool>` from it,
-- and a materialisation step that has to parse json to find a foreign key is a
-- materialisation step that will one day insert a uuid that is not there.
--
-- `pool` is a real foreign key into db/002's registry, exactly as
-- occasion_slot.pool is, so a pick cannot name a pool that does not exist.
-- `entity_id` deliberately has NO foreign key — it is polymorphic across five
-- tables, and the alternative is five nullable columns and a check constraint
-- nobody would keep in step. The same compromise db/013 makes for an anchor and
-- db/011 for staff_action, and the exposure is bounded: an ingredient retired
-- between proposal and approval fails LOUDLY at the `revelle_<pool>` insert,
-- which has a real key, rather than quietly.
--
-- The slot fields are copied rather than joined because they are what the
-- engine DECIDED, not what the tables say today: `occasion_slot` may be edited
-- between the run and the approval, and a proposal that silently re-describes
-- itself is a proposal a curator cannot trust twice.

create table revelle_proposal_pick (
  proposal_id  uuid not null
                 references revelle_proposal(id) on delete cascade,

  -- One expanded unit slot's key — 'edit_item#2', 'day_material@3'. Unique
  -- within a proposal because that is exactly what a unit slot is.
  slot_key     text not null,

  pool         text not null
                 references ingredient_pool(entity_table) on delete restrict,
  entity_id    uuid not null,

  slot_code    text not null references slot_kind(code) on delete restrict,
  slot_label   text not null,
  section      section_kind not null,
  required     boolean not null,
  -- How many of the object. Her guest count on a per-head slot, else 1.
  quantity     integer not null check (quantity >= 1),
  per_guest    boolean not null,
  -- 1-based, on an occasion that runs over days. Null on an evening.
  day_index    integer check (day_index is null or day_index >= 1),
  position     integer not null,

  -- True when this slot had exactly one eligible ingredient, and how many
  -- others could have filled it. The two facts a curator needs before she
  -- overrules the engine: "there was nothing else" is a different conversation
  -- from "there were seventeen".
  forced       boolean not null default false,
  alternatives integer not null default 0 check (alternatives >= 0),

  unit_cost_cents integer check (unit_cost_cents is null or unit_cost_cents >= 0),
  line_cost_cents integer check (line_cost_cents is null or line_cost_cents >= 0),
  score           numeric(10,4) not null default 0,

  created_at   timestamptz not null default now(),

  primary key (proposal_id, slot_key)
);

-- "Where has this ingredient been proposed" — the read behind a curator asking
-- why the same product keeps turning up.
create index revelle_proposal_pick_ingredient_idx
  on revelle_proposal_pick (pool, entity_id);

comment on table revelle_proposal_pick is
  'One placed ingredient of one proposal. Read by approval to write '
  'revelle_<pool>. Slot facts are copied, not joined: they record what the '
  'engine decided, not what occasion_slot says today. See db/018.';


-- ── the live set ─────────────────────────────────────────────────────
--
-- THE CURRENT RUN, and nothing older. Regenerating supersedes the previous
-- run's proposals outright, so "still proposed" and "from the newest run" are
-- the same set in practice — but only in practice, and the desk should not be
-- the thing that has to remember that.

create view revelle_proposal_live as
select p.*,
       w.slug        as world_slug,
       w.name        as world_name,
       w.tagline     as world_tagline,
       w.status      as world_status,
       -- WHETHER THIS DESTINATION CAN SPEAK.
       --
       -- Joined at READ TIME rather than stamped on the row when the proposal
       -- was made, and the difference matters: eleven of twelve destinations
       -- have a look and no voice today, and one of them acquires a published
       -- voice the moment a curator finishes writing it. A column would freeze
       -- yesterday's answer and make a proposal permanently un-approvable for a
       -- reason that stopped being true. See db/004's world_current_voice.
       v.voice_id,
       v.version     as voice_version
  from revelle_proposal p
  join world w on w.id = p.world_id
  left join world_current_voice v on v.world_id = p.world_id;

comment on view revelle_proposal_live is
  'Proposals with their destination and whether that destination has a '
  'published voice. The voice is joined at read time on purpose — a '
  'destination that gains a voice tomorrow makes today''s proposal '
  'approvable. See db/018 and db/004.';


-- ── finding a run ────────────────────────────────────────────────────
--
-- The desk needs the JOB behind an application's proposals: whether it is
-- still running, what it last failed with, and — when the engine's dealbreakers
-- eliminated every destination — the impasse sentence, which is a fact about
-- the run and not about any candidate, because there are none.
--
-- An expression index rather than a column on `job`, because `payload` is
-- db/008's deliberate answer to "what is this job about" and adding a
-- quiz_response_id column beside revelle_id would be a second one. Partial, so
-- it costs nothing on any other job type.

create index job_generate_application_idx
  on job ((payload ->> 'quizResponseId'))
  where type = 'revelle.generate';


-- ─────────────────────────────────────────────────────────────────────
-- WHAT THIS DELIBERATELY DOES NOT DO
--
--   · No uniqueness on `fingerprint`. Settled by db/003 at delivery. See above.
--   · No `voice_id` column on a proposal. Joined at read time; see the view.
--   · No preview/approval token, no customer-facing anything. A proposal is
--     house work and there is no surface on which she could see one.
--   · No trigger materialising an approved proposal into a `revelle`. It is
--     four inserts that must happen with an authenticated staff id and a
--     staff_action row beside them, and a trigger has no idea who is at the
--     desk — the same argument db/013 makes for author-only edits.
--   · No scores on the alternatives that were NOT picked for a slot. The count
--     is here (`alternatives`); the list is not, because it is the pool minus
--     one and can be recomputed exactly by anyone who wants it.
-- ─────────────────────────────────────────────────────────────────────
