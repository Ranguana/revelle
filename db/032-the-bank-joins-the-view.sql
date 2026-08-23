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

-- ── THE ASSERTION BELOW WAS WRONG, AND ONLY A SCRATCH RUN FOUND IT ───
--
-- It read `table_name = 'bank_item'`, and it can never be true. The view is
-- built branch per branch out of `ingredient_pool.join_table`, so what it
-- REFERENCES is `revelle_bank_item` — the join table — and never `bank_item`
-- itself. The check therefore raised on every database it was ever run
-- against, which wedges `npm run migrate` at this file and, since migrate
-- stops at the first failure, means 033 onward could not apply behind it.
--
-- It survived because nothing ever ran it on a fresh database. That is
-- CLAUDE.md rule 12's corollary in its purest form: an assertion that has
-- never executed has never been wrong. `npm run smoke:seeders` is the thing
-- that executes it — see scripts/smoke-seeders.mjs — and this is the first bug
-- it caught, on its first run.
--
-- The original line is kept here rather than deleted, per rule 14, because the
-- shape of the mistake is the lesson: the migration asserted on the name of
-- the POOL when the view is assembled from the name of the JOIN TABLE, and the
-- two are one string apart.
--
--   where view_name = 'revelle_ingredient' and table_name = 'bank_item'

select rebuild_revelle_ingredient_view();

do $$
declare v_has boolean; v_join text;
begin
  -- Asked of the registry rather than hardcoded, so this reads the same way
  -- the rebuild does and cannot drift from it if a join table is ever renamed.
  select join_table into v_join from ingredient_pool where entity_table = 'bank_item';
  if v_join is null then
    raise exception '[032] bank_item is not registered as a pool with a join '
      'table — db/031 did not do what this file assumes. Check ingredient_pool.';
  end if;

  select exists (
    select 1 from information_schema.view_column_usage
     where view_name = 'revelle_ingredient' and table_name = v_join
  ) into v_has;
  if not v_has then
    raise exception '[032] revelle_ingredient still has no % branch — '
      'the rebuild ran and did not pick the pool up. Check ingredient_pool.', v_join;
  end if;
  raise notice '[032] revelle_ingredient now sees bank_item, via %', v_join;
end $$;
