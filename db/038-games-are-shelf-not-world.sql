-- ── 038 · GAMES ARE SHELF, NOT WORLD ─────────────────────────────────
--
-- db/036 moved pool content to auto-publish and left the governed classes
-- founder-signed. Every pool seeder followed it except one: seed-games kept
-- creating drafts, and it kept doing so ON PURPOSE, with the argument written
-- into its own header. That argument was:
--
--   rule 13 names the classes it moved — "dishes, drinks, bank items, menus,
--   products and tracklists" — and the `game` TABLE is not among them. What
--   the rule's bank list calls "games" is `bank_kind = 'game'`, a line in the
--   atmosphere bank. The rule db/036 replaced was right about what it
--   protected and wrong about its SCOPE; reading the new rule wider than it
--   was written would be the same mistake with the sign flipped.
--
-- The restraint was correct and the conclusion was wrong, and it is kept here
-- whole (CLAUDE.md rule 14) because the thing that beat it is a FACT the
-- argument did not have rather than a better reading of the rule.
--
-- ── THE INCOHERENCE THIS CLOSES ──────────────────────────────────────
--
-- `bank_kind = 'game'` and the `game` table are ONE PRODUCT CATEGORY SPLIT
-- ACROSS TWO TABLES. The bank holds the physical goods — the tombola kit, the
-- dice cups, the printed card decks — and seed-bank has been stocking them
-- LIVE since db/036. The `game` table holds the playable content for those
-- same games: rules, bounds, runbook steps, contingencies, host role.
--
-- So one category sat under two publication regimes, and the bug that makes is
-- specific and silent: A MEMBER COULD RECEIVE THE SHIPPED KIT FOR A GAME WHOSE
-- RULES CONTENT SAT IN DRAFT. Neither table would have said anything was
-- wrong. Each was obeying its own rule.
--
-- ── THE TEST THAT SORTS THE NEXT ONE ─────────────────────────────────
--
-- Rule 13 now carries it, so the next new content type is classified by
-- principle instead of by another stop-and-ask:
--
--   POOL      selection CHOOSES AMONG rows.
--   GOVERNED  a row DEFINES WHAT A MEMBER CAN BE PROMISED.
--
-- A game row is SHELF, not WORLD. Assembly selects among games; a room filters
-- which are eligible (game_world, db/019); a dealbreaker never touches one; no
-- voice depends on one. That a game is walked through live by somebody reading
-- it aloud — the true observation in the old argument — is a fact about how a
-- game is USED at a party, not about whether the house may offer it.
--
-- ── THE HOLD-BACK IS THE ROW'S OWN TEXT ──────────────────────────────
--
-- Same as the bank's, and the same marker string. A game whose authored prose
-- carries a founder-pending question stays draft, and it needs no second list
-- to fall out of date because it announces itself.
--
-- THE COLUMNS BELOW ARE THE SAME COLUMNS scripts/seed-games.mjs READS — its
-- `PROSE` list, in the same order, argued there: every free-text column the
-- seeder writes, and not the game's children. A step, a contingency and a
-- supply note are prose too, but a step is not the game. If that list changes,
-- this test changes with it or a game the migration holds is one the seeder
-- offers.
--
-- No game carries the marker today. The predicate is written anyway, because a
-- hold-back added on the day it is first needed is a hold-back written under
-- pressure.

with published as (
  update game set status = 'active'
   where status = 'draft'
     and concat_ws(' ', description, how_it_works, materials, scoring,
                        caveat, source_note, notes, host_note)
         not like '%FOUNDER-PENDING%'
  returning id, name
)
insert into staff_action (staff_id, actor, action, entity_table, entity_id, summary, detail)
select null, 'auto: pool-stocking', 'game.auto_published', 'game', id,
       name || ' — offered by db/038',
       jsonb_build_object('migration', '038', 'was', 'draft', 'now', 'active')
  from published;

-- ── STAFF_RECENT_ACTIVITY IS A PARTIAL LENS, AND NOW SAYS SO ─────────
--
-- db/011 built `staff_recent_activity` as `staff_action JOIN staff`. An INNER
-- join, written when every act at the desk had a person behind it. db/036 made
-- `staff_id` nullable so a seeder could act, and from that moment the view
-- silently dropped EVERY auto-publish row — 372 dishes, 180 bank rows, and now
-- the games.
--
-- src/lib/desk/stocked.ts already knew this and reads `staff_action` directly,
-- with the reason written at the read. But that knowledge lived in one module's
-- comment, and the failure it protects against is the worst shape there is: the
-- view still returns rows, the rows are plausible, and nothing is missing that
-- a reader could see. The next screen built on it would have inherited a
-- partial answer and no warning.
--
-- SO THE COMPLETE LEDGER GETS A NAME, and the partial one becomes a filter over
-- it rather than an accident of a join:
--
--   desk_activity          every act, human or machine, with `actor`.
--   staff_recent_activity  the same view WHERE actor = 'staff'.
--
-- Two things were rejected. A COMMENT ALONE, because a comment does not stop
-- the next author writing `from staff_recent_activity` and getting a plausible
-- answer — it only helps whoever thinks to go looking. AN UNUSED LEFT-JOIN
-- VARIANT, because a view nothing reads is debt that goes stale beside the one
-- everybody reads, and a name that differs by a suffix is exactly what gets
-- picked by autocomplete. Redefining the old view in terms of the new one
-- leaves nothing unused and no second opinion about the same rows.
--
-- The row set of `staff_recent_activity` DOES NOT CHANGE. db/036's CHECK
-- constraint keeps `(staff_id is null) = (actor <> 'staff')`, so `actor =
-- 'staff'` selects exactly what the inner join selected. /desk/thread — its
-- only reader, and it is asking the right question there: "what have the two of
-- them been doing" — sees the same list it saw yesterday.

create or replace view desk_activity as
select a.id,
       a.created_at,
       a.action,
       a.entity_table,
       a.entity_id,
       a.summary,
       a.detail,
       a.actor,
       a.staff_id,
       s.email as staff_email,
       -- The register's display name, falling back to the address's local part
       -- so a row with a person on it is never attributed to an empty string.
       -- Both are NULL for a machine's act, which is what `actor` is for.
       nullif(btrim(s.name), '') as staff_name
  from staff_action a
  left join staff s on s.id = a.staff_id;

comment on view desk_activity is
  'Every act recorded at the desk, human and machine, newest first. LEFT join: '
  'a seeder''s auto-publish has staff_id null (db/036) and must not fall out. '
  'Read `actor` to tell them apart — ''staff'' means staff_email and staff_name '
  'are populated, anything else is a system actor and both are null.';

create or replace view staff_recent_activity as
select id,
       created_at,
       action,
       entity_table,
       entity_id,
       summary,
       detail,
       staff_id,
       staff_email,
       staff_name
  from desk_activity
 where actor = 'staff';

comment on view staff_recent_activity is
  'THE HUMAN HALF of the desk ledger: every change one of them made, newest '
  'first, with the person who made it. IT CANNOT SEE AUTO-PUBLISHES — a seeder '
  'stocking a pool writes staff_action with staff_id null and actor '
  '''auto: pool-stocking'' (db/036), and the filter here excludes it, as the '
  'INNER JOIN it replaced did silently. That is correct for /desk/thread and '
  'wrong for anything asking what the CATALOGUE did: use desk_activity for the '
  'whole ledger, or see src/lib/desk/stocked.ts, which reads staff_action '
  'directly because it joins each entry back to its own pool table.';

do $$
declare v_live int; v_held int; v_ledger int; v_hidden int;
begin
  select count(*) into v_live from game where status = 'active';
  select count(*) into v_held from game
   where status = 'draft'
     and concat_ws(' ', description, how_it_works, materials, scoring,
                        caveat, source_note, notes, host_note)
         like '%FOUNDER-PENDING%';
  select count(*) into v_ledger from staff_action
   where action = 'game.auto_published';
  select count(*) into v_hidden from desk_activity where actor <> 'staff';
  raise notice '[038] % games offered, % held back on a question, % ledger rows',
    v_live, v_held, v_ledger;
  raise notice '[038] desk_activity now names the % rows staff_recent_activity cannot see',
    v_hidden;
end $$;
