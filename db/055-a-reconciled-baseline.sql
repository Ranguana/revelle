-- Revelle Société — A RECONCILED BASELINE
--
-- Applied by scripts/migrate.mjs after 054, inside one transaction together
-- with its schema_migrations ledger row.
--
-- ─────────────────────────────────────────────────────────────────────
-- THE STATE THIS ENDS
--
-- /api/health has reported `copyAgrees: false` since the detector landed
-- (28f3c7b), naming twelve rooms whose `world.name`, `world.tagline` or
-- `world.description` disagrees with `src/lib/destinations.ts`. Every one of
-- those twelve was seeded once, long ago, and the registry has been rewritten
-- since — and `scripts/seed-destinations.mjs` never overwrites a row that
-- already exists, which is the correct rule (a script has no standing to
-- reverse a judgement made in the tool) doing exactly what it says.
--
-- So the detector is right, it has nothing to say about which side wins, and
-- it will say the same thing every day forever. A tripwire that has been
-- amber since it was installed stops being read. That is the failure this
-- table exists to prevent: not the drift, THE PERMANENT AMBER.
--
-- ── WHAT IS NOT WRONG HERE, SAID FIRST ───────────────────────────────
--
-- THE DATABASE IS AUTHORITATIVE FOR COPY. It is what a member reads —
-- src/app/portal/page.tsx and occasions/[id]/page.tsx render `world.tagline`
-- and `world.description` — so a row that differs from the file is not a
-- defect, it is the live text. Nothing in this migration presumes the registry
-- is right, and nothing in it moves a single character of anybody's copy. The
-- verdicts are made one at a time by a person at /desk/reconcile, and the
-- table below is where each one is written down.
--
-- ─────────────────────────────────────────────────────────────────────
-- WHY A TABLE AND NOT A LEDGER ROW
--
-- `staff_action` already records that something happened, and it will record
-- these too. What it cannot do is answer the question the detector has to ask
-- on its NEXT run: has this field been settled, and if so, against WHICH TWO
-- TEXTS? A jsonb `detail` blob can hold that and nothing can query it as a
-- baseline — the point of the whole pass is that tomorrow's comparison starts
-- from a decided position rather than from the same ambiguity.
--
-- THREE STATES, WHICH IS THE ENTIRE DESIGN REQUIREMENT:
--
--   NEVER RECONCILED   no row for this (world, field). The detector's amber
--                      means what it has always meant: nobody has looked.
--
--   SETTLED            the registry still says `registry_value` and the row
--                      still says `chosen_value`. A difference that survives
--                      here is a DECIDED difference — 'database wins' and
--                      'merge' both leave the file and the row disagreeing on
--                      purpose, forever, and that has to be distinguishable
--                      from nobody having looked.
--
--   DRIFTED AGAIN      one of those two no longer holds. Somebody edited a
--                      side after the verdict, so the verdict was about
--                      different text and does not carry.
--
-- ── WHICH COLUMN IS THE BASELINE, BECAUSE IT IS NOT THE OBVIOUS ONE ──
--
-- The database side of the baseline is `chosen_value`, NOT `database_value`.
-- Read them as before-and-after and it is obvious; read them as two sides of a
-- comparison and it is wrong in a way that would look right:
--
--   'registry' wins → the row is REWRITTEN to the file's words. The database
--                     now says `chosen_value`, and `database_value` is the
--                     superseded text.
--   'database' wins → nothing is written. `chosen_value` = `database_value`,
--                     so the distinction does not arise.
--   'merge'         → the row is rewritten to a sentence that is neither
--                     side's. `database_value` is superseded IMMEDIATELY, and
--                     a baseline compared against it would report every merged
--                     field as "drifted again" the second after it was
--                     settled — a detector that goes amber because it worked.
--
-- So `database_value` is kept for rule 14 and for nothing else: it is what was
-- there before, which is the part a later reader loses first. The comparison
-- uses `chosen_value`, and src/lib/desk/reconcile.ts is the only place that
-- comparison is written.
--
-- That is why both sides are stored as they stood, and it is the only reason
-- they are. Storing the verdict alone would produce a baseline that cannot
-- tell a settled disagreement from a stale one, which is the same shape of
-- defect as `status = 'retired'` with the opinion torn off (rule 17).
--
-- ─────────────────────────────────────────────────────────────────────
-- APPEND-ONLY, LIKE staff_action AND FOR RULE 14'S REASON
--
-- A verdict is never edited and never deleted. Re-deciding a field writes
-- ANOTHER ROW, and the newest row is the one in force. CLAUDE.md rule 14:
-- superseded reasoning is preserved, never deleted — and a reconciliation is
-- exactly the kind of decision that gets reversed six months later by somebody
-- who needs to know what the first ruling was reasoning about. An `update`
-- here would delete that and leave a table that looks like it never happened.
--
-- It also makes the correction cheap in the way rule 18 requires: the undo for
-- a mis-click is another click on the same row, in the same place, with the
-- first verdict still visible under it.
--
-- ─────────────────────────────────────────────────────────────────────
-- WHY THERE IS NO `reason text not null`
--
-- Rule 17 says a status change on a governed class carries its reason in a
-- column, and `world` is a governed class. This is not a status change, and
-- the rule's mechanism is honoured rather than its letter: THE ROW IS THE
-- REASON. It holds both texts as they stood, which side won, whether a human
-- had ever edited this room at the desk, when that edit happened, and when the
-- registry text it disagrees with was written. Read back in a year that is a
-- complete argument without an archaeologist, which is the whole test rule 17
-- sets.
--
-- A mandatory free-text box would have bought nothing and cost the pass: there
-- are nineteen of these and the founder's own estimate is ten seconds each
-- once the side-by-side exists. `note` is here for the case where the record
-- does not speak for itself, and a merge is the case where it usually does not
-- — though a merge also carries the merged sentence, which is an argument
-- written in the only language that matters here.
--
-- ─────────────────────────────────────────────────────────────────────
-- THE PROVENANCE COLUMN, AND ITS HONEST LIMIT
--
-- `provenance` records how the row was CLASSIFIED at the moment of decision,
-- from `staff_action`: a `destination.updated` row against this world means a
-- human saved this room at the desk; no such row means it was only ever
-- seeded. That is the whole basis of the two piles on /desk/reconcile.
--
-- IT IS A ROOM-LEVEL FACT WEARING A FIELD-LEVEL LABEL, and this is stated in
-- the column comment as well as here because the misreading is the exact shape
-- rule 23 warns about. `saveDestination` records `destination.updated` on
-- EVERY save of the destination form — a palette change, an occasion tick, a
-- note. So the ledger proves a human touched the ROOM. It does not prove she
-- touched the TAGLINE. The screen says so where a person would otherwise
-- assume it, and `src/app/desk/(signed-in)/destinations/actions.ts` now writes
-- the changed copy fields into `detail.copy_changed`, so rows saved from today
-- forward are field-exact. Rows saved before that are not, and no migration
-- can invent the evidence backwards.
--
-- `indeterminate` exists for the case where even the room-level fact cannot be
-- established. It must never be spelled as `stale_seed`, which is a positive
-- claim that nobody ever edited.

create table copy_reconciliation (
  id           bigint generated always as identity primary key,
  world_id     uuid not null references world(id) on delete cascade,

  -- The registry's own word for the field, not the column's. `premise` maps to
  -- `world.description`, and the two names are reconciled in exactly three
  -- places: the insert in scripts/seed-destinations.mjs, ROW_FIELDS in
  -- src/lib/desk/drift.ts, and here. Written down again because a reader of
  -- this table will look for `premise` and find a column called something else.
  field        text not null check (field in ('name', 'tagline', 'premise')),

  -- registry — take the file's words, and write them onto the row.
  -- database — keep what the desk has. The file and the row stay apart, on
  --            purpose, and this row is the record that they were meant to.
  -- merge    — neither, exactly. The founder typed the sentence.
  verdict      text not null check (verdict in ('registry', 'database', 'merge')),

  -- THE TWO SIDES AS THEY STOOD. See THREE STATES above: without these the
  -- baseline cannot tell a settled disagreement from a stale verdict.
  registry_value text not null,
  database_value text not null,
  -- What went onto the row. Constrained against the verdict below, so a
  -- 'registry wins' that wrote something else is refused rather than recorded.
  chosen_value   text not null,

  -- How the row was classified when the decision was made. See THE PROVENANCE
  -- COLUMN above for what this can and cannot prove.
  provenance   text not null
                 check (provenance in ('curator_edit', 'stale_seed', 'indeterminate')),

  -- ── THE TIMELINE, AS IT STOOD ──────────────────────────────────────
  --
  -- Founder, 2026-08-31: "'database wins' is not a live option even if a
  -- staff_action row exists, because any desk edit predates corrections you
  -- made deliberately and later… the timeline belongs in front of you when you
  -- click."
  --
  -- So the two dates are recorded beside the verdict, because in a year the
  -- question about any of these rows will be "did she know the registry had
  -- been rewritten when she kept the database copy?" and the answer has to be
  -- in the row rather than reconstructed from a commit log and a ledger.
  --
  -- Both are nullable and their nulls mean different things, which is why they
  -- are two columns and not a computed verdict:
  --   edited_at null            no human has ever saved this room at the desk.
  --   registry_authored_at null the generated dates could not date this field
  --                             — see src/lib/desk/registry-dates.ts, which
  --                             distinguishes "stale" from "unknown" and never
  --                             lets either read as "never revised".
  edited_at              timestamptz,
  registry_authored_at   timestamptz,

  -- Optional. See WHY THERE IS NO `reason text not null`.
  note         text not null default '',

  -- WHO. Not nullable, and not an email: db/011's ledger already learned that
  -- an attribution worth anything points at a row that cannot be edited away.
  decided_by   uuid not null references staff(id) on delete restrict,
  decided_at   timestamptz not null default now(),

  -- A verdict that did not write what it says it wrote is a record of nothing.
  -- 'merge' is the one case where the chosen text is neither side's, and the
  -- only thing that can be checked about it is that it is not empty — a merge
  -- to blank would silently erase member-facing copy, which is the one
  -- irreversible mistake this screen can make.
  constraint copy_reconciliation_chose_what_it_says check (
    case verdict
      when 'registry' then chosen_value = registry_value
      when 'database' then chosen_value = database_value
      else btrim(chosen_value) <> ''
    end
  ),

  -- A verdict on a field that does not differ is not a reconciliation, it is a
  -- click on nothing. Refused, because a table full of them would report a
  -- backlog cleared that was never there.
  constraint copy_reconciliation_had_something_to_settle check (
    registry_value <> database_value
  )
);

-- The question every read asks: what is the verdict in force for this field.
create index copy_reconciliation_current_idx
  on copy_reconciliation (world_id, field, decided_at desc);

-- APPEND-ONLY, exactly as staff_action is (db/011) and for rule 14's reason: a
-- record of a decision is worth nothing if the decision can be rewritten, and
-- the superseded verdict is the part a later reader needs most.
create or replace function copy_reconciliation_guard() returns trigger
language plpgsql as $$
begin
  raise exception
    'copy_reconciliation is append-only: row % may not be %.',
    coalesce(old.id, new.id), lower(tg_op)
    using errcode = 'restrict_violation',
          hint = 'Re-deciding a field INSERTS another row; the newest is the '
                 'one in force. CLAUDE.md rule 14 — superseded reasoning is '
                 'preserved, never deleted, and a reconciliation is exactly '
                 'the kind of ruling somebody reverses later needing to know '
                 'what the first one was reasoning about.';
end;
$$;

create trigger copy_reconciliation_no_edit
  before update or delete on copy_reconciliation
  for each row execute function copy_reconciliation_guard();

comment on table copy_reconciliation is
  'One row per verdict on one room''s member-facing copy field. Append-only; '
  'the newest row per (world_id, field) is the one in force. Both sides are '
  'stored AS THEY STOOD so the drift detector can tell three states apart: '
  'never reconciled (no row), settled (recorded values still match today), and '
  'drifted again (they do not). Written by /desk/reconcile, read by '
  'src/lib/desk/reconcile.ts and /api/health.';

comment on column copy_reconciliation.provenance is
  'How the row was classified WHEN THE DECISION WAS MADE, from staff_action: '
  'a destination.updated row means a human saved this room at the desk, its '
  'absence means it was only ever seeded. IT IS A ROOM-LEVEL FACT: '
  'saveDestination records destination.updated for any save of the destination '
  'form, including one that changed only the palette, so it proves a human '
  'touched the ROOM and not the FIELD. Rows saved from db/055 forward carry '
  'detail.copy_changed and are field-exact; earlier ones cannot be, and no '
  'migration can invent that evidence backwards. indeterminate is the third '
  'value and must never be spelled stale_seed — that one is a positive claim '
  'that nobody ever edited.';

comment on column copy_reconciliation.registry_value is
  'src/lib/destinations.ts as it stood at the moment of the verdict, through '
  'the same normalisation the detector uses (copyDrift in '
  'src/lib/desk/drift.ts). Compared against the registry today to tell a '
  'settled difference from a stale verdict.';

comment on column copy_reconciliation.database_value is
  'The world row as it stood BEFORE the verdict — what a member was reading '
  'when the decision was made. Kept for CLAUDE.md rule 14 and for nothing '
  'else: it is NOT the database side of the baseline. chosen_value is, '
  'because registry and merge both rewrite the row and this column is '
  'superseded the instant they do. See WHICH COLUMN IS THE BASELINE in db/055.';

comment on column copy_reconciliation.chosen_value is
  'What went onto the world row. The DATABASE SIDE OF THE BASELINE: a later '
  'run compares the row against this, not against database_value. Equal to '
  'registry_value under a registry verdict, to database_value under a database '
  'verdict, and to neither under a merge.';

comment on column copy_reconciliation.registry_authored_at is
  'When the registry sentence this verdict disagreed with was last written, '
  'from git, via src/lib/desk/registry-dates.ts. Null means the date could not '
  'be established, NEVER that the text has never been revised.';

comment on column copy_reconciliation.edited_at is
  'The staff_action.created_at of the newest destination.updated on this room '
  'at the time of the verdict. Null means no human has ever saved this room at '
  'the desk. Beside registry_authored_at it is the founder''s stale-choice '
  'test: a desk edit older than the registry text it disagrees with was made '
  'against a sentence that has since been deliberately replaced.';

-- ── THE VERDICT IN FORCE ─────────────────────────────────────────────
--
-- `distinct on` rather than a window function: it is the idiom this schema
-- already uses for "the newest row per key", and the index above is exactly
-- its ordering, so it is a scan of one entry per pair.
--
-- A view and not a materialised one. There are nineteen fields in play and
-- there will never be many more — the table has one row per verdict on one of
-- three fields on a catalogue of eighteen rooms — and a materialised view is a
-- second copy of a fact that would need refreshing, which is rule 21's defect
-- bought for no gain.

create or replace view copy_reconciliation_current as
select distinct on (world_id, field)
       id, world_id, field, verdict,
       registry_value, database_value, chosen_value,
       provenance, edited_at, registry_authored_at, note,
       decided_by, decided_at
  from copy_reconciliation
 order by world_id, field, decided_at desc, id desc;

comment on view copy_reconciliation_current is
  'The verdict in force for each (world, field) — the newest row only. The '
  'superseded ones stay in copy_reconciliation and are shown under the row on '
  '/desk/reconcile, because a reversed decision without its predecessor is an '
  'adjudication with the opinion torn off.';
