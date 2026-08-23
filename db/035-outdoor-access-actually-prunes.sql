-- ── 035 · outdoor_access ACTUALLY PRUNES ─────────────────────────────
--
-- db/033 added the code and not the matrix, so `venue_affordance` has NO ROWS
-- for it — not even the default-true ones, because db/020 seeded the matrix
-- with a `cross join` that ran years before this code existed. venueEligibility
-- prunes on `provided = false`; a missing row is not false, so the grade has
-- pruned nothing anywhere, including a hotel room with sealed windows.
--
-- A TAG THAT NEVER PRUNES IS A COMMENT WEARING A COLUMN, and worse than
-- useless: it teaches the next author that venue grades are decorative, which
-- is how the hard flag's authority erodes too.
--
-- ── THE HONEST MATRIX ────────────────────────────────────────────────
--
-- The grade was minted for sparklers and means: SOMEWHERE A LIT THING AND ITS
-- SMOKE CAN BE OUTSIDE. A balcony, a terrace, a stoop, a yard, roof access, an
-- openable window onto a fire escape — all of them satisfy it. Nearly every real
-- venue has one. A hotel room characteristically does not, and that is not a
-- judgement call: sealed windows plus a lit thing is a smoke alarm and an
-- evacuation. The physical world already votes no and the matrix should agree.
--
-- So: every environment affords it EXCEPT `hotel`.
--
-- ── THE ONE I LEFT TRUE AND WOULD ARGUE ABOUT ────────────────────────
--
-- `restaurant_or_venue`. In practice it is as sealed as a hotel and she cannot
-- arrange the sidewalk — the same reasoning db/020 already applies to it for
-- requires_outdoors, "somebody else's building". It is left TRUE here because
-- the founder named the hotel case and only the hotel case, and a migration
-- that quietly extends a decision is how a small rule becomes a large one. Flip
-- it in a line if the argument holds.
--
-- ── WHAT TURNS ON, NAMED ─────────────────────────────────────────────
--
-- ONE bank item carries this grade today: Acapulco's SPARKLER KIT. Its fallback
-- is already authored in the same line — "cork-and-window" — so a hotel booking
-- loses the sparklers and keeps the gesture. Nothing else in the catalogue
-- inherits the tag, so nothing else can silently vanish from a package when the
-- pruning starts.
--
-- ── AND WHAT THIS STILL CANNOT SEE ───────────────────────────────────
--
-- The quiz asks WHERE, not WHAT IT HAS: "A house", "An apartment", "A hotel".
-- There is no option meaning "any outdoor access at all, even small", so a city
-- apartment with a balcony and one without are the same answer, and this grade
-- can only ever prune at the granularity of a room TYPE. That is a limit of
-- what the member can report, not of this table — the fix is a quiz option, and
-- it is worth having before anything subtler than sparklers carries the grade.

insert into venue_affordance (environment, requirement, provided, note)
select e.environment, 'outdoor_access', true, ''
  from unnest(enum_range(null::environment_type)) as e(environment)
on conflict (environment, requirement) do nothing;

update venue_affordance
   set provided = false,
       note = 'there is nowhere here a lit thing and its smoke can be outside'
 where requirement = 'outdoor_access'
   and environment = 'hotel';

do $$
declare v_rows int; v_no int;
begin
  select count(*) into v_rows from venue_affordance where requirement = 'outdoor_access';
  select count(*) into v_no   from venue_affordance where requirement = 'outdoor_access' and not provided;
  raise notice '[035] outdoor_access: % environments, % refusing', v_rows, v_no;
  if v_no = 0 then
    raise exception '[035] the grade still refuses nowhere, which is the thing '
      'this migration exists to fix';
  end if;
end $$;
