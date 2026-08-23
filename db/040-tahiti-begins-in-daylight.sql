-- ── 040 · TAHITI BEGINS IN DAYLIGHT ──────────────────────────────────
--
-- READ THIS FIRST, BECAUSE THE SHAPE OF IT INVITES THE WRONG READING: three
-- bank rows change their phase tag below, and NONE OF THEM WAS EVER WRONG.
-- Nobody mistagged anything. The tags were correct for the room that existed
-- when they were written, and the room changed underneath them.
--
-- ── WHAT CHANGED WAS THE ROOM ────────────────────────────────────────
--
-- TAHITI, 1961 was an evening party. By founder ruling on 2026-08-23 it is an
-- AFTERNOON-THROUGH-MORNING ARC: it now begins in daylight and runs until
-- morning. The ruling is recorded against `tahiti.starts` and the Tahiti
-- premise cell in data/destination-matrix.json, and its bank consequence is
-- written there in one line — "staging arc gains the daylight phase formally".
--
-- Every Tahiti bank row was authored against the old, narrower room. An item
-- made, arranged or floated while the sun is up had nowhere to say so, because
-- in an evening-only room there was no sun to be up in. So those items took
-- `all`, which db/031 glosses as NO OPINION rather than "every phase" — the
-- honest tag for a room with no daylight in it. The widening gives them an
-- hour they can actually name, and this migration lets them name it.
--
-- THE OLD REASONING, KEPT WHOLE, per CLAUDE.md rule 14: the three rows below
-- read `all` because the source document (docs/atmosphere-idea-bank-v1.md,
-- TAHITI, 1961) uses no time word for them, and CLAUDE.md rule 3 forbids
-- inference from silence — a seeder does not invent an hour a curator did not
-- write. That argument was right and is STILL right about the document. What
-- beat it is not a better reading of the document; it is a person, ruling on
-- the room, after the document was written. The derivation in seed-bank.mjs is
-- untouched and still declines to infer. The ruling sits beside it, named.
--
-- ── THE HINGE DOES NOT MOVE ──────────────────────────────────────────
--
-- The turn of this evening is the torches lit in full daylight — "torches that
-- go up one at a time long before anybody is hungry", in the room's own
-- tagline and premise (src/lib/destinations.ts, TAHITI). The founder ruled it
-- NEITHER ALTERED NOR MOVED by the widening, and nothing here can move it:
-- Tahiti carries no candle or torch bank row at all. The candle-surface
-- dimension in the source document names eleven rooms and Tahiti is not one of
-- them, so the hinge lives on the destination record, where the widening found
-- it and where it stays. A retag that implied the torches went up earlier or
-- later would be the wrong retag; none of the three touches them.
--
-- ── WHY THIS IS A REPLACEMENT AND NOT AN ADDITION ────────────────────
--
-- `bank_item.phase` is ONE VALUE PER ROW: a scalar `bank_phase` column in
-- db/031, not an array and not a join table. "Include daylight" is therefore
-- only expressible as a replacement, and that is safe here for exactly one
-- reason, which is worth spelling out because it will not hold next time:
--
--   ALL THREE ROWS CURRENTLY READ `all`, WHICH IS NO OPINION.
--
-- Replacing no-opinion with daylight destroys no claim. It makes one where
-- none stood. Had any of them read `dusk`, this migration could not have run
-- on it without deleting a real statement about the evening, and the right
-- answer would have been a schema change argued on its own merits rather than
-- a quiet narrowing smuggled in under a retag.
--
-- Tahiti has exactly one row that reads `dusk` — `tahiti-the-conch-blown-at-
-- dusk`, the room's gesture (db/034, "The conch at dusk"), the line that calls
-- dinner. Its `dusk` is the founder's own words in the source document and not
-- an artefact of the old arc. It is untouched, and the check at the bottom of
-- this file fails loudly if anything ever touches it.
--
-- ── WHAT IS NOT HERE, AND WHY THAT LIST MATTERS ──────────────────────
--
-- The founder named three items: the blossom bowl, the lei craft, the floated
-- flowers. Three is what this file changes. The qualifier was "where it is
-- obvious", and nine other Tahiti rows were considered and declined — the
-- finished leis, both technique cards, the conch, the star kit, the runner,
-- the coconut bowls, the monoï. The reasons are enumerated row by row in
-- scripts/seed-bank.mjs (PHASE_RULINGS_DECLINED), printed on every seeder run,
-- and two of them are open questions rather than settled noes.
--
-- That restraint is not fastidiousness. CLAUDE.md rule 13 makes bank items
-- POOL CONTENT: they stock themselves and reach a member on the next deploy
-- with nobody in between. An item that merely COULD happen in daylight is not
-- an item whose character is daylight, and the cost of guessing is an authored
-- claim about her party that no human approved.
--
-- ── THE SEEDER MAKES THE SAME THREE CHANGES ──────────────────────────
--
-- scripts/seed-bank.mjs carries the same ruling as a named table and applies it
-- after derivation, asserting the derived value it overrules. That is what
-- keeps this migration from being undone: `npm run seed:bank` runs after
-- `npm run migrate` on every deploy, and a seeder that still produced `all`
-- would report these three rows as "differs" forever — and on a fresh database,
-- where this migration finds nothing to update, the seeder is the ONLY thing
-- that writes the tag at all.

-- One statement, so the ledger cannot disagree with the rows.
--
-- The `phase = r.was` guard is the defensive half: it means this file moves a
-- row only from the value it was reasoned about. A curator who has already set
-- something else at the desk beats a migration written before she did — the
-- row is left exactly as she has it and named in the notice below, rather than
-- silently overwritten by a script that thinks it knows the room better.
with ruling (slug, was, becomes, why) as (
  values
    ('tahiti-blossom-bowl-of-single-tiare-tuberose', 'all', 'daylight',
     'Blossoms arranged in a bowl, with the left-taken/right-looking lore on ' ||
     'the card beside it. Arranged in the light, read in the light.'),
    ('tahiti-lei-making-kit', 'all', 'daylight',
     'The craft the founder named: needle, thread, blossoms, a table of ' ||
     'people making things. The widened room has an afternoon to do it in.'),
    ('tahiti-floated-blossoms', 'all', 'daylight',
     'Blossoms floated on water — done while the sun is up and seen while ' ||
     'the sun is up.')
),
retagged as (
  update bank_item b
     set phase = r.becomes::bank_phase
    from ruling r
   where b.slug = r.slug::citext
     and b.phase = r.was::bank_phase
  returning b.id, b.name, r.slug as ruled_slug, r.was, r.becomes, r.why
)
insert into staff_action
  (staff_id, actor, action, entity_table, entity_id, summary, detail)
select null,
       'auto: founder ruling',
       'bank_item.retagged',
       'bank_item',
       id,
       name || ' — phase ' || was || ' -> ' || becomes || ', db/040',
       jsonb_build_object(
         'migration', '040',
         'field', 'phase',
         'was', was,
         'now', becomes,
         'why', why,
         'ruling', 'TAHITI widened to an afternoon-through-morning arc, ' ||
                   'founder, 2026-08-23. Not a correction: the tag was ' ||
                   'right for the room that used to exist.'
       )
  from retagged;

-- ── WHAT ACTUALLY HAPPENED, SAID OUT LOUD ────────────────────────────
--
-- The database is unreachable from any laptop (CLAUDE.md rule 9), so the deploy
-- log is the only place anyone will ever see this run. A migration that moves
-- authored content and prints nothing is a migration nobody can check.
--
-- Three states are reported separately on purpose, because they mean different
-- things: MOVED is the intended one; ABSENT is fine on a fresh database (this
-- runs before seed:bank, which will write `daylight` itself on the way in);
-- HELD is the one worth reading — the row exists and reads something other
-- than `all`, so a person has been here and this file deferred to her.
do $$
declare
  r          record;
  v_moved    int := 0;
  v_absent   int := 0;
  v_held     int := 0;
  v_conch    text;
begin
  for r in
    select *
      from (values
        ('tahiti-blossom-bowl-of-single-tiare-tuberose'),
        ('tahiti-lei-making-kit'),
        ('tahiti-floated-blossoms')
      ) as t (slug)
  loop
    declare
      v_phase text;
    begin
      select phase::text into v_phase
        from bank_item where slug = r.slug::citext;

      if v_phase is null then
        v_absent := v_absent + 1;
        raise notice '[040] ABSENT % — no such row yet; seed:bank writes it as daylight', r.slug;
      elsif v_phase = 'daylight' then
        v_moved := v_moved + 1;
      else
        v_held := v_held + 1;
        raise notice '[040] HELD   % reads ''%'' and not ''all'' — left as the desk has it', r.slug, v_phase;
      end if;
    end;
  end loop;

  raise notice '[040] tahiti daylight retag: % now daylight, % absent, % left alone',
    v_moved, v_absent, v_held;

  -- THE HINGE CHECK. Not paranoia: this is the one Tahiti row with a real
  -- phase claim, it is the room's gesture, and the entire risk of a retagging
  -- migration is that it reaches one row too many. If the conch has moved,
  -- something else in this deploy moved it and the deploy should stop.
  select phase::text into v_conch
    from bank_item where slug = 'tahiti-the-conch-blown-at-dusk';

  if v_conch is null then
    raise notice '[040] the conch act is not seeded yet — nothing to check';
  elsif v_conch <> 'dusk' then
    raise exception
      '[040] tahiti-the-conch-blown-at-dusk reads ''%'' and must read ''dusk''. '
      'The conch at dusk is the room''s gesture (db/034) and the widened arc '
      'added an afternoon in front of it — it did not move it.', v_conch;
  else
    raise notice '[040] the conch is still at dusk. The hinge did not move.';
  end if;
end $$;
