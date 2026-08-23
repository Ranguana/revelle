-- ── 042 · A RETIREMENT CARRIES ITS REASON ────────────────────────────
--
-- CLAUDE.md rule 17, given the column it asks for.
--
-- `db/028` set `world.status = 'retired'` on Cap Ferrat and wrote the reason
-- NOWHERE THE DATABASE COULD SEE. Read that file: it is four screens of
-- argument — the two rooms were one coast written twice, the claims moved to
-- Côte d'Azur, the register is RESERVED for a duration tier if that tier is
-- ever built. Every word of it is in a SQL comment. A comment is not a column.
-- The desk cannot render it, `select` cannot find it, and "Cap Ferrat was
-- folded into Côte d'Azur" survived only in a conversation until somebody
-- reconstructed it by hand.
--
-- A desk agent asked to render the fold refused to invent a column or hardcode
-- the sentence, which was the correct refusal, and it is what got this file
-- authorised.
--
-- ── TWO COLUMNS, BECAUSE THEY ANSWER TWO QUESTIONS ───────────────────
--
--   superseded_by     LINEAGE. Machine-readable. Which room absorbed this one.
--   retirement_note   THE WHY, in words.
--
-- The founder's framing, kept verbatim because it is the whole test for
-- whether a future transition has done enough:
--
--   A REASON THAT CANNOT BE QUERIED IS A NOTE.
--   A POINTER WITH NO WORDS IS A FACT WITH NO ARGUMENT.
--
-- One column would have been cheaper and would have failed in one of two
-- predictable directions. Free text alone cannot be followed — the desk would
-- have to parse a room's name out of a sentence to draw a link, which is the
-- kind of thing that works until somebody writes the name differently. An FK
-- alone records that a fold happened and destroys the reasoning for it, which
-- is rule 14's failure with a foreign key on top.
--
-- ── THE FOUR CONSTRAINTS, AND WHY EACH ONE ───────────────────────────
--
-- Each is argued at its own line below. The summary, because the SET of them
-- is the design and reading them one at a time hides it:
--
--   1. A note is never blank.        Whitespace is silence with a column.
--   2. Retired implies a note.       The rule, in the schema.
--   3. Lineage implies a note.       The founder's second sentence, in SQL.
--   4. Nothing supersedes itself.
--
-- And the two things deliberately NOT constrained, which matter as much:
--
--   A NON-RETIRED ROW MAY CARRY BOTH. `world_published_has_timestamp` in
--   db/001 is an IFF — `(status = 'published') = (published_at is not null)` —
--   and following its shape exactly would mean that bringing a room back as a
--   draft NULLS ITS RETIREMENT NOTE. That is rule 14 with the argument deleted
--   by a CHECK constraint, and it defeats one of the two reasons this file
--   gives for the FK in the first place: "a future un-retirement knows its own
--   history". A timestamp of publication is STATE — it is meaningless when the
--   thing is not published. A retirement note is a RECORD — it stays true
--   after the retirement ends, in the past tense.
--
--   So the shape is followed in its demanding half and refused in its erasing
--   half: retired ⇒ note, and the note survives coming back. The desk renders
--   a returned room's record as history rather than as a state, which is what
--   rule 16 requires of a column that is populated and not shown.
--
--   A SUCCESSOR MAY ITSELF BE RETIRED. If Côte d'Azur is ever folded into
--   something, Cap Ferrat's pointer at it is still TRUE, and the two ways of
--   forbidding it are both worse: refuse Côte d'Azur's retirement (a room
--   cannot be retired because something once pointed at it), or rewrite Cap
--   Ferrat's lineage to skip a hop (falsify history to keep a link tidy). A
--   CHECK cannot see another row anyway; this would be a trigger, and the
--   trigger's correct behaviour is to do nothing. The chain is real and the
--   desk says so out loud — see the retirement panel on a destination.
--
--   NOT GUARDED, NAMED RATHER THAN PRETENDED AWAY: a cycle. A -> B and B -> A
--   satisfies all four constraints. Catching it needs a trigger that walks the
--   chain on every write to defend against a two-step mistake nobody has made,
--   and the rendering side is bounded independently — src/lib/desk/retirement.ts
--   follows the chain a fixed number of hops and stops — so a cycle is wrong
--   data that cannot hang a page. One real guard beats three partial ones.

alter table world
  add column superseded_by uuid references world(id) on delete restrict,
  add column retirement_note text;

comment on column world.superseded_by is
  'LINEAGE. The room this one was folded into, when a retirement was a merge '
  'rather than a deletion. Nullable because most retirements supersede '
  'nothing. Kept after an un-retirement: it is a record of what happened, not '
  'a description of the current state. CLAUDE.md rule 17.';

comment on column world.retirement_note is
  'THE WHY, in words, in the founder''s or the curator''s own sentence. '
  'Required whenever status = ''retired'' (world_retired_has_reason) and '
  'whenever superseded_by is set (world_lineage_has_words). CLAUDE.md rule 17: '
  'a reason that cannot be queried is a note; a pointer with no words is a '
  'fact with no argument.';

-- ── THE ORDER OF WHAT FOLLOWS IS THE POINT ───────────────────────────
--
-- COLUMNS, THEN BACKFILL, THEN CONSTRAINTS. Written the other way round this
-- file is unapplicable on the only database that matters: `world_retired_has_
-- reason` is checked against every existing row the moment it is added, and
-- Cap Ferrat is retired with no note — that is the whole reason this migration
-- exists. It would raise on the real database, `npm run migrate` exits
-- non-zero, and per the ORDERING RULE in scripts/migrate.mjs the deploy fails
-- and nothing after this file ever runs. db/032 did exactly that and cost four
-- migrations and seven seeders that never applied.
--
-- A migration that adds a constraint has to leave the table SATISFYING it
-- before it asks for it. There is no version of this that can be tested by
-- reading; it is tested by running it on a database that has db/028's row in
-- it, which is what the scratch cluster is for.

-- ── THE FOLD, WRITTEN DOWN AT LAST ───────────────────────────────────
--
-- Both rooms are found BY SLUG. Hardcoding either uuid would tie this file to
-- one database — the ids are `gen_random_uuid()` defaults and differ between
-- the live database and every scratch one — and it would be a silent tie: the
-- update would match nothing and report success.
--
-- ── AND THE THREE ANSWERS THIS BLOCK CAN GIVE ────────────────────────
--
-- Distinguished on purpose, because they mean different things and a single
-- "did it work" would collapse two of them into the third:
--
--   cap-ferrat ABSENT        Fine, and normal. On a fresh database `world` is
--                            empty at migrate time, and after
--                            seed:destinations Cap Ferrat is STILL absent — it
--                            was removed from src/lib/destinations.ts in the
--                            same fold db/028 recorded, so no seeder will ever
--                            write it. Notice and move on, exactly as db/028
--                            does for the same reason.
--
--   cap-ferrat PRESENT,      REFUSE. This is the loud failure the task of this
--   cote-dazur ABSENT        file demands and it is db/028's own refusal,
--                            re-armed: pointing lineage at a room that is not
--                            there is not possible, and pretending the
--                            backfill "found nothing" would be the silent
--                            no-op class this codebase spent a day hunting.
--                            db/032's guard LOOKED like this and could never
--                            fire; this one is a real disjunction between two
--                            reachable states.
--
--   cap-ferrat PRESENT,      HELD, not overwritten. A room somebody has
--   not retired             already brought back is not carrying a retirement
--                            today, and a migration written before she acted
--                            does not get to re-assert one. db/040's `phase =
--                            r.was` guard is the same instinct: move a row only
--                            from the state it was reasoned about.
do $$
declare
  v_cap    uuid;
  v_cote   uuid;
  v_status text;
  v_note   text;
begin
  select id, status::text into v_cap, v_status from world where slug = 'cap-ferrat';
  select id into v_cote from world where slug = 'cote-dazur';

  if v_cap is null then
    raise notice '[042] no cap-ferrat row — nothing to backfill. Expected on a '
      'fresh database: the fold removed it from src/lib/destinations.ts, so no '
      'seeder writes it either.';
  elsif v_cote is null then
    raise exception '[042] cap-ferrat exists and cote-dazur does not. The room '
      'it was folded into is missing, so its lineage cannot be recorded and '
      'this file will not pretend it wrote one. Same refusal as db/028.';
  elsif v_status <> 'retired' then
    raise notice '[042] HELD — cap-ferrat reads ''%'' and not ''retired''. '
      'Somebody has brought it back; the retirement record is left unwritten '
      'rather than re-asserted over her.', v_status;
  else
    -- THE FOUNDER'S OWN WORDS, VERBATIM. Not paraphrased and not expanded:
    -- this sentence is the argument, and db/028's four screens are the working
    -- that produced it. Both halves of rule 17 land in ONE statement, which is
    -- the rule's own wording — "in the same statement that writes the status" —
    -- and here also the only way the constraints added below can be satisfied
    -- by a row that is already retired.
    update world
       set superseded_by   = v_cote,
           retirement_note = 'the two were the same coast twice; merged per '
             'the separability audit; register reserved for the duration tier '
             'per proposals.md.'
     where id = v_cap;

    insert into staff_action
      (staff_id, actor, action, entity_table, entity_id, summary, detail)
    values
      (null, 'auto: founder ruling', 'destination.retirement_recorded',
       'world', v_cap,
       'Cap Ferrat — folded into Côte d''Azur, recorded by db/042',
       jsonb_build_object(
         'migration', '042',
         'superseded_by_slug', 'cote-dazur',
         'retirement_note', (select retirement_note from world where id = v_cap),
         'why', 'db/028 retired it and recorded the reason only in SQL '
                'comments. Rule 17 requires a column; this is the backfill.'
       ));

    raise notice '[042] cap-ferrat -> cote-dazur, with the reason in a column.';
  end if;
end $$;

-- ── ANY OTHER RETIRED ROOM WITH NOTHING WRITTEN DOWN ─────────────────
--
-- Cap Ferrat is the only retirement this repo has ever performed, and that is
-- exactly why this sweep exists: the belief is unverifiable from a laptop
-- (rule 9 — the database is unreachable), so the constraint below would be
-- added on faith. If the faith is wrong the deploy dies at this file and, per
-- migrate.mjs, every later migration and every seeder in the chain dies with
-- it, on a database nobody can connect to and fix.
--
-- ── WHY A SENTENCE AND NOT AN EXCEPTION ──────────────────────────────
--
-- Refusing would be defensible and it is the wrong trade here: the cost of
-- refusing is a wedged pipeline with no way in, and the thing being refused is
-- a row whose reason was ALREADY lost before this file was written. Nothing is
-- recoverable by stopping.
--
-- ── AND WHY NOT A NICER SENTENCE ─────────────────────────────────────
--
-- What is written below is not an explanation and must never read as one. It
-- says that no reason was recorded, which is the only true thing available.
-- Inventing a plausible reason — "folded into another room", "superseded" —
-- would put words in a curator's mouth and would be indistinguishable, six
-- months out, from a reason somebody actually gave. That is worse than the
-- silence it replaces, because silence at least announces itself.
--
-- `NOT VALID` was the other candidate: add the constraint, leave old rows
-- unchecked, validate later. Rejected — it would leave the desk rendering a
-- null for a row that is retired, which is rule 16's failure (a column
-- populated by nothing, shown as nothing, explained by nothing), and "validate
-- later" on an unreachable database means never.
do $$
declare
  r        record;
  v_count  int := 0;
begin
  for r in
    select id, slug::text as slug, name
      from world
     where status = 'retired'
       and (retirement_note is null or btrim(retirement_note) = '')
     order by slug
  loop
    update world
       set retirement_note =
             'No reason was recorded. This room was retired before db/042 '
             'required one, and this sentence is the migration saying so — it '
             'is not an explanation, and nobody has written one.'
     where id = r.id;

    insert into staff_action
      (staff_id, actor, action, entity_table, entity_id, summary, detail)
    values
      (null, 'auto: db/042', 'destination.retirement_unrecorded',
       'world', r.id,
       r.name || ' — retired with no reason on record',
       jsonb_build_object(
         'migration', '042',
         'slug', r.slug,
         'why', 'Retired before rule 17 existed. The placeholder marks the '
                'absence; it does not fill it. Somebody who knows why should '
                'replace it at the desk.'
       ));

    v_count := v_count + 1;
    raise notice '[042] UNRECORDED — % (%) was retired with no reason. '
      'Placeholder written; the desk shows it as unrecorded.', r.name, r.slug;
  end loop;

  if v_count = 0 then
    raise notice '[042] every retired room carries a reason. Constraints can land.';
  else
    raise notice '[042] % retired room(s) had no reason on record.', v_count;
  end if;
end $$;

-- ── 1 · A NOTE IS NEVER BLANK ────────────────────────────────────────
--
-- `''` and `'   '` satisfy `is not null` and say nothing, so without this the
-- rule below is satisfiable by pressing space. This is the same failure as the
-- one rule 17 names — the opinion torn off — wearing a non-null column, and it
-- is worse than a null because it looks answered from every angle.
--
-- Applies to every row and not only to retired ones: a blank string is never
-- the right value for this column in any state. Null means "no retirement
-- record"; a note means "here is the record". There is no third thing.
alter table world
  add constraint world_retirement_note_not_blank
  check (retirement_note is null or btrim(retirement_note) <> '');

-- ── 2 · RETIRED IMPLIES A REASON ─────────────────────────────────────
--
-- Rule 17 as a CHECK. This is the guard the whole file is for: after this
-- line, `update world set status = 'retired'` — from the desk, from a seeder,
-- from a future migration hand-writing an UPDATE, from a psql session — raises
-- unless the reason moves with it.
--
-- One direction only, and the asymmetry with `world_published_has_timestamp`
-- is deliberate and argued at the head of this file: retirement REQUIRES the
-- record, un-retirement does not ERASE it.
alter table world
  add constraint world_retired_has_reason
  check (status <> 'retired' or retirement_note is not null);

-- ── 3 · A POINTER WITH NO WORDS IS A FACT WITH NO ARGUMENT ───────────
--
-- The founder's sentence, in SQL. Lineage without a note records THAT a fold
-- happened and loses WHY, which is the failure of db/028 with a foreign key on
-- top — the desk could draw the link and still not say what it means.
--
-- The converse is NOT required and that is not an oversight: a note without a
-- pointer is a complete and common retirement. Most rooms that close are not
-- absorbed by another one; they were wrong, or they were duplicated, or nobody
-- could write the voice. "Both, or neither" is the rule for a MERGE. A plain
-- retirement gets words and has nothing to point at.
alter table world
  add constraint world_lineage_has_words
  check (superseded_by is null or retirement_note is not null);

-- ── 4 · NOTHING SUPERSEDES ITSELF ────────────────────────────────────
--
-- A room folded into itself is not a lineage, it is a loop with one node, and
-- it would render on the desk as "folded into Cap Ferrat" on Cap Ferrat's own
-- page. The FK cannot catch it — `world(id)` includes this row. Cheap, exact,
-- and the only cycle a single-row CHECK is able to see; the longer ones are
-- named as unguarded at the head of this file rather than half-guarded here.
alter table world
  add constraint world_superseded_by_is_another_room
  check (superseded_by is null or superseded_by <> id);

-- Partial, because the column is null on almost every row. It serves two
-- readers: the FK's own ON DELETE RESTRICT check, and the desk asking the
-- reverse question — "what was folded into THIS room" — which a destination's
-- page shows so that a successor knows what it absorbed.
create index world_superseded_by_idx on world (superseded_by)
  where superseded_by is not null;

-- ── WHAT ACTUALLY HAPPENED, SAID OUT LOUD ────────────────────────────
--
-- The deploy log is the only place this run is ever seen (rule 9). A migration
-- that moves authored content and prints nothing is a migration nobody can
-- check — db/040's closing block makes the same argument and this one follows
-- it deliberately.
do $$
declare
  v_slug  citext;
  v_note  text;
  v_into  text;
  v_total int;
begin
  select count(*)::int into v_total from world where status = 'retired';

  select w.slug, w.retirement_note, s.name
    into v_slug, v_note, v_into
    from world w
    left join world s on s.id = w.superseded_by
   where w.slug = 'cap-ferrat';

  if v_slug is null then
    raise notice '[042] rule 17 is in the schema. % retired room(s), all with '
      'a reason. No cap-ferrat here to backfill.', v_total;
    return;
  end if;

  if v_note is null then
    raise exception '[042] cap-ferrat came through this file with no '
      'retirement note. The backfill above did not do what it claims and the '
      'constraints should have refused it — something is wrong with this file.';
  end if;

  raise notice '[042] rule 17 is in the schema. % retired room(s), all with a '
    'reason. cap-ferrat -> %', v_total, coalesce(v_into, '(no successor)');
end $$;
