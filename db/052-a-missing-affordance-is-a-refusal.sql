-- Revelle Société — A MISSING AFFORDANCE IS A REFUSAL
--
-- Applied by scripts/migrate.mjs after 051, inside one transaction together
-- with its schema_migrations ledger row.
--
-- ─────────────────────────────────────────────────────────────────────
-- THE HOLE THIS CLOSES
--
-- `check:gates` reported:
--
--     INERT — requires_full_kitchen: 17 row(s) claim it and every one of the
--     960 host configurations affords it, so it refuses nothing anywhere.
--
-- The migration source disagrees: db/020 refuses a full kitchen at beach,
-- poolside, garden, hotel and restaurant_or_venue, and a host can choose all
-- five. db/039 states outright that this requirement "really prunes". Both
-- were reading the source. Neither was reading the rows.
--
-- db/020 populates venue_affordance with ONE CROSS JOIN, over the environments
-- that existed the day it ran:
--
--     from unnest(enum_range(null::environment_type)) as e(environment)
--     cross join structural_requirement r
--
-- Anything added to `environment_type` afterwards has NO ROW. And a missing
-- row was read as an affordance, in the engine and in the detector both. So
-- the gate could not fire, and the instrument built to notice gates that
-- cannot fire counted the silence as permission too.
--
-- ── ORDER MATTERS, AND THE CODE CHANGE CAME FIRST ────────────────────
--
-- src/lib/selection/venue.ts now refuses on anything not EXPLICITLY afforded,
-- and src/lib/catalogue/gates.ts counts only explicit affordances, so the two
-- agree about what silence means. That landed before this file on purpose.
--
-- Backfilling alone would have fixed today and left tomorrow broken: the next
-- environment added to the enum would have been silently permissive in exactly
-- the same way, and nothing would have said so. Fail-closed first makes the
-- gate HONEST WHILE INCOMPLETE; the backfill then makes it complete. A missing
-- row is now a visibly wrong answer instead of an invisible yes.
--
-- ── WHY THIS RE-APPLIES EVERY REFUSAL, NOT ONLY THE NEW ONES ─────────
--
-- Idempotent and total, so it is self-correcting: it does not need to know
-- which environments were added after db/020, and a future environment gets
-- correct rows by re-running rather than by someone remembering. The refusals
-- are db/020's own, verbatim, including its notes. Nothing here is a new
-- judgement about what a room affords.

-- ── 0. THE CONFIRMATION, RECORDED BEFORE IT IS REPAIRED ──────────────
--
-- The count of missing pairs, per environment, printed to the deploy log
-- BEFORE the backfill. This is the evidence for the whole diagnosis and it
-- exists exactly once — after this migration runs, the gap is closed and the
-- number can never be observed again. So it is stated here rather than
-- inferred later from a repaired table.
do $$
declare r record; n integer := 0;
begin
  for r in
    select e.environment::text as env, count(*) as missing
      from unnest(enum_range(null::environment_type)) as e(environment)
      cross join structural_requirement q
     where not exists (
             select 1 from venue_affordance v
              where v.environment = e.environment and v.requirement = q.code)
     group by e.environment
     order by e.environment
  loop
    raise notice '[052] BEFORE: environment % has % requirement(s) with no row', r.env, r.missing;
    n := n + 1;
  end loop;
  if n = 0 then
    raise notice '[052] BEFORE: venue_affordance was already complete — the gap was elsewhere';
  end if;
end $$;

-- ── 1. every (environment, requirement) pair gets a row ──────────────
insert into venue_affordance (environment, requirement, provided, note)
select e.environment, r.code, true, ''
  from unnest(enum_range(null::environment_type)) as e(environment)
  cross join structural_requirement r
 where not exists (
         select 1 from venue_affordance v
          where v.environment = e.environment
            and v.requirement = r.code)
on conflict do nothing;

-- ── 2. db/020's refusals, re-applied verbatim ────────────────────────
update venue_affordance set provided = false,
       note = 'there is no outdoors — this is a room, and the thing needs a sky'
 where requirement = 'requires_outdoors'
   and environment in ('city_apartment', 'restaurant_or_venue', 'hotel');

update venue_affordance set provided = false,
       note = 'live fire is not available to her here'
 where requirement = 'requires_open_flame'
   and environment in ('city_apartment', 'hotel', 'restaurant_or_venue');

update venue_affordance set provided = false,
       note = 'there is no kitchen she can cook in'
 where requirement = 'requires_full_kitchen'
   and environment in ('beach', 'poolside', 'garden', 'hotel', 'restaurant_or_venue');

-- ── 3. THE ASSERTION ─────────────────────────────────────────────────
--
-- Completeness is the whole point of the file, so it is checked rather than
-- assumed. If a requirement is added later without rows, this fails on the
-- deploy that adds it — which, with the code now failing closed, is the
-- deploy that would otherwise have quietly refused everything everywhere.
do $$
declare
  n_env  integer;
  n_req  integer;
  n_rows integer;
  n_gap  integer;
begin
  select count(*) into n_env from unnest(enum_range(null::environment_type)) t;
  select count(*) into n_req from structural_requirement;
  select count(*) into n_rows from venue_affordance;

  select count(*) into n_gap
    from unnest(enum_range(null::environment_type)) as e(environment)
    cross join structural_requirement r
   where not exists (
           select 1 from venue_affordance v
            where v.environment = e.environment
              and v.requirement = r.code);

  if n_gap <> 0 then
    raise exception
      'venue_affordance is incomplete: % (environment, requirement) pairs have no row', n_gap;
  end if;

  raise notice '[052] venue_affordance complete: % environments x % requirements = % rows',
    n_env, n_req, n_rows;
end $$;
