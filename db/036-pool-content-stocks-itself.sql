-- ── 036 · POOL CONTENT STOCKS ITSELF ─────────────────────────────────
--
-- The rule this reverses, in its own words, from every seeder in the tree:
--
--   "deciding that something is offered to a customer is a curator's decision
--    and not a script's"
--
-- That rule was right about WHAT IT WAS PROTECTING and wrong about its scope.
-- It was written when the only content was destinations, and a destination is
-- an authored world. A dish is an ingredient. Applying one gate to both meant
-- 372 dishes and 180 bank rows sat in a queue nobody could clear, waiting on a
-- signature that adds nothing — because nobody reads 372 dishes to decide
-- whether a dish may exist.
--
-- ── VETO REPLACES CONSENT, FOR POOL CLASSES ONLY ─────────────────────
--
-- POOL CLASSES stock themselves: dishes, drinks, bank items — goods, host acts,
-- games, printed cards, technique cards. They go live on deploy and the desk
-- becomes an AUDIT FEED: what went live, when, from which seeder, revert in one
-- click. The founder vetoes rather than consents.
--
-- GOVERNED CLASSES do not, and the gate on them is untouched: destinations,
-- gestures, voices, matrix cells, member-facing copy. Those stay founder-signed
-- because each is a claim about a WORLD or about how the house SPEAKS, and one
-- of them reaching a member unread is a different kind of wrong from a dish
-- doing it.
--
-- The hold-back is not an approval queue. An item carrying a founder-pending
-- QUESTION stays draft — and they already know who they are, because the
-- seeder wrote the question into them.
--
-- ── THE LEDGER HAS TO BE ABLE TO SAY "NOBODY" ────────────────────────
--
-- staff_action.staff_id is NOT NULL, which was right when every act had a
-- person behind it. An auto-publish does not. Rather than invent a fake staff
-- row — which would make the ledger lie in the one column people trust — the
-- column becomes nullable and gains an `actor` beside it, so every row still
-- answers WHO, and "nobody, this seeder" is a sayable answer.

alter table staff_action alter column staff_id drop not null;

alter table staff_action
  add column actor text not null default 'staff';

alter table staff_action
  add constraint staff_action_actor_matches_staff
  check ((staff_id is null) = (actor <> 'staff'));

comment on column staff_action.actor is
  'Who acted. ''staff'' means a person, and staff_id names her. Anything else '
  'is a system actor — ''auto: pool-stocking'' — and staff_id is null. The '
  'ledger must never attribute a machine''s act to a person.';

-- ── THE DEBT CLEARS ITSELF ───────────────────────────────────────────

with published as (
  update dish set status = 'active'
   where status = 'draft'
  returning id, name
)
insert into staff_action (staff_id, actor, action, entity_table, entity_id, summary, detail)
select null, 'auto: pool-stocking', 'dish.auto_published', 'dish', id,
       name || ' — offered by db/036',
       jsonb_build_object('migration', '036', 'was', 'draft', 'now', 'active')
  from published;

-- Bank items go live EXCEPT the ones carrying a question. seed-bank wrote the
-- founder-pending text into the row itself, so the hold-back needs no second
-- list to fall out of date.
with published as (
  update bank_item set status = 'active'
   where status = 'draft'
     and description not like '%FOUNDER-PENDING%'
  returning id, name
)
insert into staff_action (staff_id, actor, action, entity_table, entity_id, summary, detail)
select null, 'auto: pool-stocking', 'bank_item.auto_published', 'bank_item', id,
       name || ' — offered by db/036',
       jsonb_build_object('migration', '036', 'was', 'draft', 'now', 'active')
  from published;

do $$
declare v_d int; v_b int; v_held int;
begin
  select count(*) into v_d from dish where status = 'active';
  select count(*) into v_b from bank_item where status = 'active';
  select count(*) into v_held from bank_item
   where status = 'draft' and description like '%FOUNDER-PENDING%';
  raise notice '[036] % dishes and % bank items offered; % held back on a question',
    v_d, v_b, v_held;
end $$;
