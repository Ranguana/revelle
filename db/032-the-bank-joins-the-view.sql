-- ── 032 · THE BANK JOINS THE VIEW ────────────────────────────────────
--
-- db/031 registered `bank_item` as a pool and did not rebuild the view that
-- makes a pool visible to the rest of the engine. Every other pool migration
-- does it on the line after registering — 005, 009, 012, 017 and 021 all call
-- this, and 031 was the first that did not.
--
-- ── WHAT WAS INVISIBLE, AND FOR HOW LONG ─────────────────────────────
--
-- `revelle_ingredient` is rebuilt from `ingredient_pool` rather than written by
-- hand, so a pool that is registered but not rebuilt into it is REGISTERED
-- EVERYWHERE EXCEPT WHERE IT COUNTS: the assemblage fingerprint cannot see the
-- bank, so two Revelles differing only in atmosphere would fingerprint
-- identical; the issuance history cannot see it, so the penalty that spreads
-- the catalogue would never spread a bank item; and assemblage_headroom() would
-- under-count the combinations available.
--
-- None of that would have raised an error. It is the failure this codebase
-- keeps naming: the engine quietly doing less and reporting nothing.
--
-- Caught by the desk agent reading db/031 against its five siblings, which is
-- the argument for writing a migration that looks like the ones before it.

select rebuild_revelle_ingredient_view();

do $$
declare v_has boolean;
begin
  select exists (
    select 1 from information_schema.view_column_usage
     where view_name = 'revelle_ingredient' and table_name = 'bank_item'
  ) into v_has;
  if not v_has then
    raise exception '[032] revelle_ingredient still has no bank_item branch — '
      'the rebuild ran and did not pick the pool up. Check ingredient_pool.';
  end if;
  raise notice '[032] revelle_ingredient now sees bank_item';
end $$;
