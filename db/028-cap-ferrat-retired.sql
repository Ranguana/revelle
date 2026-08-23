-- ── 028 · CAP FERRAT, RETIRED ────────────────────────────────────────
--
-- Cap Ferrat is ON the Côte d'Azur. The two were authored as a contrast pair —
-- villa and private versus public stage — which made them one coast written
-- twice, so the destination was folded in and removed from
-- src/lib/destinations.ts on 2026-08-22.
--
-- ── WHY THE DATABASE DID NOT NOTICE ──────────────────────────────────
--
-- Every seeder in this repo INSERTS AND UPDATES. Not one of them deletes, and
-- seed-destinations refuses even to update an existing row, because that rule
-- protects a curator's work. So removing a destination from the code removes it
-- from the CODE. The `world` row stays, published, and
-- src/lib/selection/catalogue.ts reads PUBLISHED WORLD ROWS rather than
-- DESTINATIONS — which means the engine could still propose a destination that
-- has no voice left to write anybody's invitation in.
--
-- That is the whole reason this file exists. A fold is a code change plus a
-- migration, and the code change alone looks complete.
--
-- ── RETIRED, NOT DELETED ─────────────────────────────────────────────
--
-- `world_status` already has 'retired' and that is the honest state. Deleting
-- is also impossible on purpose: `revelle.world_id` and
-- `revelle_proposal.world_id` are ON DELETE RESTRICT, because a destination
-- somebody has actually been given must not evaporate from her record. If a
-- Cap Ferrat was ever issued, it stays issued and stays true.
--
-- ── THE CLAIMS MOVE FIRST ────────────────────────────────────────────
--
-- Menus, drinks and dishes are scoped to a world through the `*_world` tables
-- the shared installer generates. Cap Ferrat's claims are re-pointed at Côte
-- d'Azur where Côte d'Azur does not already hold the same claim, and dropped
-- where it does — the docs were re-filed under Côte d'Azur in the same fold, so
-- the seeders have already written most of these and the remainder are
-- duplicates of a claim that now exists twice.
--
-- Done as dynamic SQL over information_schema because the `*_world` tables are
-- generated rather than declared, and a hand-listed set here would silently
-- miss the seventh one somebody adds later.

do $$
declare
  v_cap  uuid;
  v_cote uuid;
  v_tbl  text;
  v_moved int;
  v_dropped int;
begin
  select id into v_cap  from world where slug = 'cap-ferrat';
  select id into v_cote from world where slug = 'cote-dazur';

  if v_cap is null then
    raise notice '[028] no cap-ferrat world row — nothing to retire';
    return;
  end if;
  if v_cote is null then
    raise exception '[028] cap-ferrat exists but cote-dazur does not. Refusing to '
      'orphan its claims — the fold has a destination and it is missing.';
  end if;

  for v_tbl in
    select c.table_name
      from information_schema.columns c
      join information_schema.tables t
        on t.table_name = c.table_name and t.table_schema = c.table_schema
     where c.table_schema = 'public'
       and c.column_name  = 'world_id'
       and c.table_name like '%\_world'
       and t.table_type = 'BASE TABLE'
     order by c.table_name
  loop
    -- Drop the ones Côte d'Azur already holds: re-pointing them would collide
    -- with its own claim, and the claim it already has is the authored one.
    execute format(
      'delete from %I a where a.world_id = $1 and exists ('
      '  select 1 from %I b where b.world_id = $2'
      '   and b.%I = a.%I)',
      v_tbl, v_tbl,
      (select column_name from information_schema.columns
        where table_schema='public' and table_name=v_tbl
          and column_name <> 'world_id' and column_name like '%\_id' limit 1),
      (select column_name from information_schema.columns
        where table_schema='public' and table_name=v_tbl
          and column_name <> 'world_id' and column_name like '%\_id' limit 1)
    ) using v_cap, v_cote;
    get diagnostics v_dropped = row_count;

    execute format('update %I set world_id = $2 where world_id = $1', v_tbl)
      using v_cap, v_cote;
    get diagnostics v_moved = row_count;

    if v_moved > 0 or v_dropped > 0 then
      raise notice '[028] %: % moved to cote-dazur, % dropped as duplicates',
        v_tbl, v_moved, v_dropped;
    end if;
  end loop;

  -- Facet tags and voice rows belong to the retired destination and stay with
  -- it. They are not Côte d'Azur's opinions and merging them would put words in
  -- its mouth.
  update world set status = 'retired' where id = v_cap;
  raise notice '[028] cap-ferrat retired. Its voice and tags stay with it.';
end $$;
