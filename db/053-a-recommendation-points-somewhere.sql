-- Revelle Société — A RECOMMENDATION POINTS SOMEWHERE
--
-- Applied by scripts/migrate.mjs after 052, inside one transaction together
-- with its schema_migrations ledger row.
--
-- ─────────────────────────────────────────────────────────────────────
-- THE HOLE THIS CLOSES
--
-- db/010 states what the house may do with somebody else's game:
--
--     "We may NAME it and point a host at it. We may not reproduce its
--      rules, print its materials, or render it in the destination's
--      typeface"
--
-- and it enforced only the first half. `game_recommended_is_named` requires
-- external_name; nothing required external_url. So a recommendation could be
-- a name and no destination — and `imposter` was exactly that, from the day
-- it was written until 2026-08-31.
--
-- The comment on the existing constraint says why that is not cosmetic:
--
--     "A recommended one must name what it is, or a host cannot find it and
--      the recommendation is noise."
--
-- A NAME IS NOT FINDING IT. There are at least eight products called some
-- version of Imposter across the two app stores. The row named one of them
-- and pointed at none, so the host's last step was a search box on the night,
-- which is the moment this game is least able to survive a wrong guess.
--
-- Founder ruling, 2026-08-31: "imposter should have a link to the app."
--
-- ── WHY A CONSTRAINT AND NOT JUST A VALUE ────────────────────────────
--
-- Because the value alone is today's fix. `imposter` is currently the only
-- recommended game in the pool, and the next one added would repeat this
-- exactly — named, unreachable, and passing every check — for the same reason
-- the tone vocabulary and the venue affordances did. Rule 15: the gap has to
-- be able to go red.

-- ── ORDER: BACKFILL, THEN CONSTRAIN. THIS FILE GOT IT WRONG ONCE ─────
--
-- The first version of this migration added the constraint and nothing else.
-- It passed CI and failed the production deploy:
--
--     migration 053 failed: check constraint
--     "game_recommended_points_somewhere" of relation "game" is violated by
--     some row
--
-- Because MIGRATIONS RUN BEFORE SEEDERS. render.yaml's chain is migrate first,
-- then the eight seeders — so a constraint that requires a value only a seeder
-- supplies is validated against the row as it stands, which is the row without
-- the value. The deploy stopped, the old code kept serving, and nothing was
-- lost; that is the pre-deploy guard working. But the file was wrong.
--
-- WHY CI COULD NOT CATCH IT, WHICH IS THE MORE USEFUL HALF. scripts/
-- smoke-seeders.mjs builds a SCRATCH database every run: this migration ran
-- against an EMPTY `game` table, where a check constraint is satisfied
-- vacuously, and the seeder then inserted imposter WITH its url. Green.
--
-- A from-scratch check can never catch a migration that fails against
-- existing data. It is not a gap in the smoke test's coverage of what it
-- tests; it is a class of defect outside what it tests at all, and it will
-- happen again to the next constraint added over authored data. Recorded here
-- because a finding that lives only where it was found gets rediscovered at
-- full price (rule 20).

-- One-time reconciliation, not a second owner. src/lib/games.ts is where this
-- value lives and scripts/seed-drinks-style seeders keep it current; this
-- statement exists only so the constraint below has data it can pass against
-- on an instance seeded before the value was authored. Founder ruling
-- 2026-08-31, and the reasoning for a browser page over a store listing is in
-- games.ts beside the value.
update game
   set external_url = 'https://imposter.app/'
 where sourcing = 'recommended'
   and external_name = 'Imposter'
   and external_url is null;

-- ── ANYTHING STILL UNPOINTED IS AN AUTHORING GAP, NAMED ──────────────
--
-- If another recommended game exists here without a link, this stops the
-- deploy with its NAME rather than with a bare constraint violation — and it
-- does NOT invent a url for it. Rule 32: symmetry is not evidence, and a
-- machine guessing where to send a host on the night is exactly the guess
-- db/010 refuses. The answer is a founder's, and this says so out loud.
do $$
declare v_unpointed text;
begin
  select string_agg(slug || ' (' || coalesce(external_name, 'unnamed') || ')', ', ')
    into v_unpointed
    from game
   where sourcing = 'recommended' and external_url is null;

  if v_unpointed is not null then
    raise exception
      'recommended game(s) with no link: %. db/010 grants the house two rights '
      'over somebody else''s game — name it and point a host at it. A link is '
      'authored, never guessed: add it to src/lib/games.ts and re-deploy.',
      v_unpointed;
  end if;
end $$;

alter table game
  add constraint game_recommended_points_somewhere
  check (sourcing <> 'recommended' or external_url is not null);

comment on constraint game_recommended_points_somewhere on game is
  'A recommended game must point at the thing it recommends. db/010 grants '
  'the house exactly two rights over somebody else''s game — to name it and '
  'to point a host at it — and until db/053 only the naming was enforced, so '
  'a recommendation could exist with nowhere to go.';
