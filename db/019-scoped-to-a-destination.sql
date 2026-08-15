-- ─────────────────────────────────────────────────────────────────────
-- SCOPED TO A DESTINATION
--
-- docs/drinks.md, in the founder's own words:
--
--   "A drink is scoped to a destination the way a menu is. Havana's daiquiris
--    are not an option at the Dolomites, and the mulled wine is not an option
--    in Tahiti."
--
-- That is not what the code did. db/009 gave every pool an `<entity>_world`
-- table with two columns — `forbidden`, a structural never, and `affinity`, a
-- signed re-weighting — and stage 3 of docs/selection-spec.md consumes affinity
-- as an ADDITIVE TERM in the score. So a menu written for HAVANA and tagged
-- there at full affinity stayed eligible under every other published
-- destination; it merely scored a point lower. Withdraw its competitors and it
-- is placed. Every zero anybody has ever seen in that column was HAVANA losing
-- on score, never a guarantee, and it has been true of menus since db/012, of
-- drinks since db/017, and of the three older pools since db/009 itself.
--
-- The rule that WAS decided, and decided once, is in
-- src/lib/selection/occasion.ts as claimEligibility():
--
--   · NO CLAIMS AT ALL   eligible everywhere on that axis. An untagged
--                        ingredient makes no claim, and a catalogue that starts
--                        empty must not start ineligible.
--   · ANY 'native' CLAIM those values and no others. Naming one is opting into
--                        a whitelist.
--   · A 'forbidden' ROW  never, whatever else is claimed. A veto that can be
--                        outvoted is not a veto.
--
-- It already governs the occasion axis and the slot axis. This file makes the
-- DESTINATION axis the third caller of that same function. Nothing about the
-- rule is re-implemented here or anywhere else — db/009 says at length that
-- writing it a second time in SQL is the disease db/002 exists to cure, and
-- that argument is unchanged.
--
-- ── WHAT THIS FILE ADDS: ONE COLUMN, `native` ────────────────────────
--
-- The rule needs three states per row — claims it, vetoes it, has an opinion
-- about the weight and nothing more — and `<entity>_world` had two. So:
--
--   forbidden = true    a veto. Unchanged.
--   native    = true    A NATIVE CLAIM. "This was written for this
--                       destination." An ingredient with any native row is
--                       eligible ONLY under the destinations it claims.
--   neither             a WEIGHT and only a weight. `affinity` pulls the score
--                       toward or away from this destination and changes
--                       nothing about eligibility.
--
-- ── WHY A COLUMN AND NOT "ANY POSITIVE AFFINITY IS A CLAIM" ──────────
--
-- Because it is not true of the catalogue that exists, and the real rows say so
-- plainly. Read them before arguing with this:
--
--   ART BATTLE, scoped to WESTHAMPTON, 1976 at +0.4, with the curator's own
--   note attached to the row: "Wet paint on a porch in a heat wave. THE HOUSE
--   WOULD ALLOW IT." That is a permission, not an ownership claim. Under a
--   positive-means-native rule that game becomes unplayable at every other
--   destination in the library, on the strength of a sentence that says the
--   opposite.
--
--   FISHBOWL at +0.6 — "A bowl, a pen, and an argument. Nothing in it postdates
--   1976." A period-fit remark about one destination, not a statement that a
--   bowl and a pen belong nowhere else.
--
--   REVERSE SCAVENGER HUNT at +0.2, with no note at all. A nudge.
--
-- Sixteen of twenty-six products and seven of fifteen fixture games carry a
-- single positive world row between +0.2 and +0.9. Reading those as whitelists
-- deletes each of them from four destinations out of five, and it does it by
-- inferring an intention from a MAGNITUDE that has never meant anything but
-- weight. That is the same overload db/002 refuses everywhere else: one number
-- cannot mean two things and stay honest. A threshold ("1.0 is a claim, 0.9 is
-- not") is the same mistake with a decimal point in it — and it is a live trap,
-- because the deliverables desk hands a curator a free-text affinity field
-- where 1 plainly means "as strongly as I can say it", not "and nowhere else".
--
-- So the claim gets its own column, a curator gets to say both things, and the
-- eligibility rule reads a boolean instead of guessing at an intention.
--
-- ── THE BACKFILL, AND ITS ONE JUDGEMENT ──────────────────────────────
--
--   update … set native = true where affinity >= 1.000 and not forbidden
--
-- Exactly 1.000 is not a threshold dressed up. It is the value three writers
-- ALREADY use to mean "written for this destination", and they are the only
-- three things that write it:
--
--   · scripts/seed-menus.mjs and scripts/seed-drinks.mjs, which read
--     docs/menus.md and docs/drinks.md — documents whose entries sit UNDER a
--     destination heading — and insert at affinity 1.000. Sixty-odd rows.
--   · the desk's menu and drink forms, whose label is literally "which
--     destinations it was written for", inserting 1.000.
--   · tracklist_world_project() in db/009, which projects `tracklist.world_id`
--     — db/005's column for "the destination this soundtrack was written for"
--     — at affinity 1.000 and calls it exactly that.
--
-- Nothing hand-scoped at the deliverables desk has ever been 1.000, and no
-- authored product or game is. The backfill therefore promotes the sixty rows
-- that already meant a claim and leaves every re-weighting alone, which is why
-- this change can be adopted destination by destination without a re-tagging
-- pass: an untagged ingredient stays global, a re-weighted one stays global,
-- and only content that was authored FOR somewhere becomes exclusive to it.
--
-- ── AND A DESTINATION THAT CANNOT SPEAK ──────────────────────────────
--
-- The second half of this file is unrelated to the first and is here because it
-- is the same class of hole: a promise made in prose that nothing enforced.
-- See the trigger at the bottom.
-- ─────────────────────────────────────────────────────────────────────


-- ── the column, on every pool that has a world table ─────────────────
--
-- A loop over the registry rather than five hand-written statements — db/009's
-- own device, for its own reason: the sixth pool must not depend on anybody
-- remembering. The installer is updated below so it never needs to.

do $$
declare
  p record;
begin
  for p in select * from ingredient_pool where world_table is not null loop
    execute format(
      'alter table %I
         add column native boolean not null default false,
         add constraint %I check (not (forbidden and native))',
      p.world_table, p.world_table || '_fit_is_one_thing');

    execute format(
      'comment on column %I.native is %L',
      p.world_table,
      'A NATIVE CLAIM: this was written for this destination. Any native row '
      'makes the ingredient eligible ONLY under the destinations it claims. '
      'Distinct from a positive affinity, which is a weight and nothing more. '
      'The rule is claimEligibility() in src/lib/selection/occasion.ts. '
      'See db/019.');
  end loop;
end;
$$;

-- "Everything NATIVE to this destination" — the read the new rule makes hot,
-- and the one the desk's deliverables screen asks for.
do $$
declare
  p record;
begin
  for p in select * from ingredient_pool where world_table is not null loop
    execute format(
      'create index %I on %I (world_id) where native',
      p.world_table || '_native_idx', p.world_table);
  end loop;
end;
$$;


-- ── the installer, so the sixth pool gets it for free ────────────────
--
-- Byte for byte db/009's function with the column, the constraint and the index
-- added. Replacing it whole rather than patching it from outside is what keeps
-- "a pool is a table plus three calls" true.

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
      -- WRITTEN FOR this destination. A whitelist claim, not a weight: an
      -- ingredient with any native row is eligible only where it claims.
      -- db/019.
      native     boolean not null default false,
      -- Signed, -1..1. Zero is allowed here (unlike a facet tag's weight)
      -- because a row may exist to carry `forbidden` and say nothing about
      -- weight at all.
      affinity   numeric(4,3) not null default 0.000
                   check (affinity >= -1 and affinity <= 1),
      note       text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),

      primary key (%I, world_id),
      -- The three states of claimEligibility() are exclusive. A row that both
      -- claims and vetoes one destination is not a contradiction the engine
      -- should have to resolve; it is a typo.
      constraint %I check (not (forbidden and native))
    )$ddl$,
    v_table, v_column, p_entity_table, v_column,
    v_table || '_fit_is_one_thing');

  -- "Everything scoped to this destination" — the read stage 3 lives on.
  execute format(
    'create index %I on %I (world_id, forbidden, affinity desc)',
    v_table || '_world_idx', v_table);

  -- "Everything NATIVE to this destination" — the read the whitelist makes hot.
  execute format(
    'create index %I on %I (world_id) where native',
    v_table || '_native_idx', v_table);

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


-- ── the union view, with the claim in it ─────────────────────────────

create or replace function rebuild_ingredient_world_view() returns void
language plpgsql as $$
declare
  v_sql text;
begin
  -- `native` is APPENDED rather than slotted in beside `forbidden`, so that
  -- `create or replace view` still works: replacing a view may add columns at
  -- the end and may not reorder the ones already there. Dropping and recreating
  -- would be tidier to read and would take out anything that ever comes to
  -- depend on this view, which is a bad trade for a column position.
  select string_agg(
           format(
             'select %L::text as entity_table, %I as entity_id, world_id, '
             || 'forbidden, affinity, note, created_at, native from %I',
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

select rebuild_ingredient_world_view();

comment on view ingredient_world is
  'Every pool''s destination scoping in one relation. `forbidden` vetoes, '
  '`native` claims, `affinity` weighs, and no row at all means eligible '
  'everywhere at neutral weight. The rule over these three states is stated '
  'once, in src/lib/selection/occasion.ts. See db/009 and db/019.';


-- ── the backfill ─────────────────────────────────────────────────────
--
-- Argued at the top of this file. Sixty-odd rows written by three writers that
-- all already meant "written for this destination", and nothing else.

update product_world   set native = true where affinity >= 1.000 and not forbidden;
update game_world      set native = true where affinity >= 1.000 and not forbidden;
update tracklist_world set native = true where affinity >= 1.000 and not forbidden;
update menu_world      set native = true where affinity >= 1.000 and not forbidden;
update drink_world     set native = true where affinity >= 1.000 and not forbidden;


-- ── tracklist.world_id, still the same one fact ──────────────────────
--
-- db/009 made `tracklist.world_id` a ONE-WAY PROJECTION into tracklist_world at
-- full affinity, because "the destination this soundtrack was written for" and
-- "how this soundtrack behaves under that destination" were two representations
-- of one fact and two representations of one fact drift. That argument is
-- unchanged and the projection now carries the claim as well, because the claim
-- is precisely what `world_id` always meant.

create or replace function tracklist_world_project() returns trigger
language plpgsql as $$
begin
  -- No longer the destination it was written for.
  delete from tracklist_world tw
   where tw.tracklist_id = new.id
     and tw.note = 'Projected from tracklist.world_id.'
     and (new.world_id is null or tw.world_id <> new.world_id);

  if new.world_id is not null then
    -- `do nothing`, exactly as db/009 wrote it: a row a curator scoped by hand
    -- outranks the projection and is not silently promoted to a claim.
    insert into tracklist_world (tracklist_id, world_id, native, affinity, note)
    values (new.id, new.world_id, true, 1.000,
            'Projected from tracklist.world_id.')
    on conflict do nothing;
  end if;

  return null;
end;
$$;

-- The backfill, written as an update that changes nothing so the trigger above
-- is the single implementation of the rule. db/009's device, unchanged.
update tracklist set world_id = world_id where world_id is not null;


-- ─────────────────────────────────────────────────────────────────────
-- A DESTINATION THAT CANNOT SPEAK MUST NOT BE PROMOTED
-- ─────────────────────────────────────────────────────────────────────
--
-- `setDestinationStatus` in the desk flips `world.status` to 'published' with
-- no check that a published `world_voice` exists. Ten destinations in the real
-- catalogue have plates, menus and drinks written for them and no voice at all.
-- Publishing one puts it into the engine's shortlist — src/lib/selection/
-- catalogue.ts reads `where w.status = 'published'` and nothing else — where it
-- can win a customer's application and produce proposals that can never be
-- approved.
--
-- ── WHAT ALREADY CATCHES THIS, AND WHY IT IS NOT ENOUGH ──────────────
--
-- Two things downstream already refuse, and they are correct and stay:
--
--   · approve() in src/lib/revelle/proposals.ts refuses a proposal whose
--     destination has no published voice, with a sentence, at the first moment
--     a human is present to read it.
--   · deliver() refuses again after the transition, because db/004's guard pins
--     `voice_id` and a Revelle that came out with none was issued in no voice.
--
-- So a customer cannot in fact receive a house that cannot speak. What she can
-- receive is nothing at all, slowly: a generation run spends itself on a
-- destination that was never deliverable, a curator opens a proposal she cannot
-- approve, and the only signal she is given arrives at the end. The refusal
-- belongs at the moment of the decision, which is the publish.
--
-- ── WHY THE TRANSITION AND NOT THE STATE ─────────────────────────────
--
-- This fires on the UPDATE into 'published' and NOT on an insert that is born
-- published, and the distinction is deliberate rather than an oversight:
--
--   · db/004 decided, at length, that a destination MAY have a look and no
--     voice — "which is legal, and means look only" — and rows that predate
--     this file are entitled to that ruling. Validating on the transition is
--     db/004's own pattern; validate_voice() fires when a voice moves into
--     'published' and never re-litigates a row already there.
--   · A row inserted already published is a fixture or a test asserting a state
--     on purpose. scripts/seed-fixtures.mjs writes five of them, and
--     src/lib/revelle/proposals.db.test.ts writes one specifically to prove that
--     generation does NOT filter an unvoiced destination out and that approval
--     refuses it. That test is the reason the downstream refusal is trustworthy
--     and it must keep being able to build the state it tests.
--   · The desk has exactly one way to publish a destination and it is an
--     UPDATE. `saveDestination` hard-codes 'draft' on insert and
--     scripts/seed-destinations.mjs creates drafts. So the transition is the
--     whole of the curator's path, and closing it closes the door a human can
--     walk through.
--
-- Unpublishing is never refused. A destination that turns out to be wrong must
-- be able to leave the shortlist immediately, and a guard that made it argue
-- first would be a guard that keeps a bad destination live.

create or replace function world_publish_needs_a_voice() returns trigger
language plpgsql as $$
begin
  if new.status = 'published'
     and old.status is distinct from 'published'
     and not exists (
       select 1 from world_voice v
        where v.world_id = new.id and v.status = 'published')
  then
    raise exception
      '% cannot be published: it has a look and no voice. Everything in a '
      'Revelle — the invitation, the menu card, the prep list — is written IN '
      'the destination''s voice, and there is no fallback voice by design.',
      new.name
      using errcode = 'invalid_parameter_value',
            hint = 'Write and publish its voice first, then publish the '
                   'destination. A draft voice is not enough: the version a '
                   'Revelle is issued under has to be one that can never '
                   'change afterwards.';
  end if;

  return new;
end;
$$;

create trigger world_publish_needs_a_voice
  before update of status on world
  for each row execute function world_publish_needs_a_voice();

comment on function world_publish_needs_a_voice() is
  'Refuses the transition into published for a destination with no published '
  'world_voice. Fires on the update only — see the essay in db/019 for why an '
  'insert born published is left alone.';


-- ─────────────────────────────────────────────────────────────────────
-- WHAT THIS DELIBERATELY DOES NOT DO
--
--   · No eligibility rule in SQL. `native` is a CLAIM; turning claims into a
--     yes or a no happens once, in src/lib/selection/occasion.ts, over all
--     three axes. db/009 refused to write it here and this file refuses again.
--   · No retagging of anything below 1.000. Sixteen products and seven games
--     carry a positive world row that means "suits it", and every one of them
--     stays eligible everywhere. If the founder wants ART BATTLE to be a
--     Westhampton game and nowhere else, that is a tick in the deliverables
--     screen, one row at a time, with her eyes on it.
--   · No `native` on `world_occasion`. A destination's occasion rows are
--     already the occasion axis and already have `fit`; this column exists
--     because <entity>_world had no fit column, not because worlds need two.
--   · No backfill of `native` from `forbidden`. A veto is not a claim — an
--     ingredient forbidden at one destination and silent everywhere else stays
--     eligible everywhere else, exactly as an occasion veto does.
--   · No retro-validation of already-published voiceless destinations. See the
--     transition argument above; db/004's ruling stands for rows that predate
--     this one.
-- ─────────────────────────────────────────────────────────────────────
