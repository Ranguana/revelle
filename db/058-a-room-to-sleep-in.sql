-- Revelle Société — A ROOM TO SLEEP IN
--
-- Applied by scripts/migrate.mjs after 057, inside one transaction together
-- with its schema_migrations ledger row.
--
-- ─────────────────────────────────────────────────────────────────────
-- WHAT THIS IS FOR
--
-- Founder, 2026-09-02: "we need a 'needs hotel or rented house'."
--
-- Two items in the bank are about a room a guest STAYS in, and neither can
-- exist where nobody stays:
--
--   LAS VEGAS   the number off the door — a numbered fob matching the room
--               number on the house note, handed over on arrival
--   PORTOFINO   the room's key tag — a plain wooden or brass fob numbered or
--               named for the room a guest slept in, not asked for back
--
-- Portofino's says "the room a guest SLEPT IN", which raised a question worth
-- recording because it was asked and answered rather than assumed: is the
-- predicate the VENUE (rented or hotel) or the STAY (somebody slept)? Those
-- are not the same thing — a hall taken for one evening is rented and nobody
-- sleeps there.
--
-- The founder closed it: "nobody rents a house for less than 24 hrs." A
-- rented house is a night by definition, so venue and stay coincide for every
-- value the quiz can return, and the venue is the one the quiz actually asks.
-- The distinction survives only for a host at HER OWN HOME with houseguests,
-- which this refuses — a false negative, in the safe direction db/020 argues
-- for at length: an item that does not appear costs less than one that
-- appears wrongly.
--
-- MOUNTAINS IS THE OTHER KNOWN FALSE NEGATIVE and is named rather than
-- discovered later. A host who rents a chalet may answer `mountains` instead
-- of `rented_house`; she loses the key tag. Both answers are honest and the
-- quiz cannot tell them apart. If that starts costing something the fix is a
-- question about staying the night, not a guess about what `mountains` meant.
--
-- ── ALL THREE PARTS, IN ONE CHANGE ───────────────────────────────────
--
-- db/035 and db/039 reached the same rule from opposite directions and it is
-- the reason this file also edits the seeder and the document:
--
--     "a code, a full affordance matrix, AND claimants in the same
--      migration. All three or none."
--
-- Half of it is how `outdoor_access` graded nothing for two months (code, no
-- matrix) and how `requires_still_water` sits perfectly wired with nothing
-- claiming it (code and matrix, no claimants). A requirement with no claimant
-- is a gate with nothing behind it, and it reads exactly like a broken one.

-- ── 1. the code ──────────────────────────────────────────────────────
insert into structural_requirement (code, label, clause, description, position) values
  ('requires_lodging', 'Needs somewhere to stay', 'needs somewhere guests sleep',
   'A room a guest stays the night in, with a number or a name on the door. A '
   'hotel or a house taken for the weekend has them; an evening somewhere does '
   'not, however grand the room.', 40)
on conflict (code) do nothing;

-- ── 2. the whole matrix, because a missing row now REFUSES ───────────
--
-- db/052 made silence a refusal and backfilled every pair that existed then.
-- A code added afterwards has no rows at all, so it would refuse everywhere
-- and the gate would look catastrophic rather than absent. Both statements
-- below are required; neither is tidying.
insert into venue_affordance (environment, requirement, provided, note)
select e.environment, 'requires_lodging', true, ''
  from unnest(enum_range(null::environment_type)) as e(environment)
on conflict do nothing;

update venue_affordance set provided = false,
       note = 'nobody sleeps here — there is no room with a number on it'
 where requirement = 'requires_lodging'
   and environment in ('my_home', 'city_apartment', 'beach', 'mountains',
                       'poolside', 'garden', 'restaurant_or_venue');

-- `not_decided` is left affording, deliberately and consistently with every
-- other requirement here: an answer she has not given yet may not prune. See
-- db/049 section 10 for the same argument on water.

-- ── 3. the assertion ─────────────────────────────────────────────────
do $$
declare n_rows integer; n_env integer; n_yes integer;
begin
  select count(*) into n_env from unnest(enum_range(null::environment_type)) t;

  select count(*) into n_rows from venue_affordance
   where requirement = 'requires_lodging';

  select count(*) into n_yes from venue_affordance
   where requirement = 'requires_lodging' and provided;

  if n_rows <> n_env then
    raise exception 'requires_lodging has % rows for % environments', n_rows, n_env;
  end if;

  -- hotel, rented_house, not_decided
  if n_yes <> 3 then
    raise exception 'expected 3 environments to afford requires_lodging, found %', n_yes;
  end if;

  raise notice '[058] requires_lodging: % rows, % affording', n_rows, n_yes;
end $$;
