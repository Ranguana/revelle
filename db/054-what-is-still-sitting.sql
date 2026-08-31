-- Revelle Société — WHAT IS STILL SITTING
--
-- Applied by scripts/migrate.mjs after 053, inside one transaction together
-- with its schema_migrations ledger row.
--
-- ─────────────────────────────────────────────────────────────────────
-- THE QUESTION THIS ANSWERS, AND WHY IT NEEDED ASKING TWICE
--
-- Founder, 2026-08-31: "What happened to the publish queue — the 158 drafts,
-- Westhampton's four table settings, Oaxaca's 32 dishes? Either they were
-- published somewhere in these missing days, or they're still drafts and this
-- report's framing has quietly renamed the queue to the part that's nearly
-- empty."
--
-- It was a fair catch. A status report had said "THE QUEUE: 1", meaning the
-- engine's decision queue, while the publish backlog — the number a curator
-- actually feels — was not measured anywhere a person could read it.
--
-- The POLICY answer exists and is good: db/036 and CLAUDE.md rule 13 made pool
-- classes stock themselves, so a dish or drink a seeder creates is live on the
-- way in and the founder vetoes at /desk/stocked instead of consenting at
-- /desk/publish. src/lib/desk/publish.ts: "this module did not lose its job,
-- it lost its BACKLOG."
--
-- BUT A POLICY IS NOT A COUNT. Rows created before db/036, and any row a
-- curator drafted by hand, are unaffected by it and would still be sitting.
-- Answering "how many" from the policy rather than from the table is exactly
-- the move that made `requires_full_kitchen` look inert for two days: reading
-- the argument instead of the number. See CLAUDE.md rule 24.
--
-- ── THE SAME IDIOM AS assemblage_headroom(), DELIBERATELY ────────────
--
-- db/002 already counts a pool through the registry's column/value pair:
--
--     format('t.%I::text = %L', p.active_column, p.active_value)
--
-- and the registry stores a PAIR rather than a predicate string precisely so
-- that counting a pool is not an injection surface "in every function that
-- counts a pool". This function uses that idiom unchanged.
--
-- It is a separate function and not an extension of headroom because they
-- answer different questions: headroom asks how many combinations the
-- catalogue can still produce, and this asks how many rows are waiting for a
-- person. Sharing the counting idiom without merging the questions is the
-- distinction rule 21 actually asks for — one owner per FACT, not one
-- function per table.

create or replace function pool_standing()
returns table (
  entity_table text,
  total        bigint,
  issuable     bigint,
  sitting      bigint
)
language plpgsql
stable
as $$
declare
  p record;
  v_total bigint;
  v_live  bigint;
begin
  for p in
    select ip.entity_table, ip.active_column, ip.active_value
      from ingredient_pool ip
     where ip.retired_at is null
     order by ip.entity_table
  loop
    execute format('select count(*) from %I', p.entity_table) into v_total;

    execute format('select count(*) from %I t where %s',
                   p.entity_table,
                   case when p.active_column is null then 'true'
                        else format('t.%I::text = %L', p.active_column, p.active_value)
                   end)
       into v_live;

    entity_table := p.entity_table;
    total        := v_total;
    issuable     := v_live;
    -- What a person still has to look at. Zero is the healthy answer for a
    -- pool that stocks itself; anything else is either pre-db/036 or hand-made.
    sitting      := v_total - v_live;
    return next;
  end loop;
end $$;

comment on function pool_standing is
  'Per pool: how many rows exist, how many may be issued today, and how many '
  'are still waiting for a person. Registry-driven, so a seventh pool appears '
  'here without an edit. Read by /api/health so the publish backlog is a '
  'number somebody can see rather than an argument from policy.';
