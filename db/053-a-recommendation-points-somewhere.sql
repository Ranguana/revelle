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

alter table game
  add constraint game_recommended_points_somewhere
  check (sourcing <> 'recommended' or external_url is not null);

comment on constraint game_recommended_points_somewhere on game is
  'A recommended game must point at the thing it recommends. db/010 grants '
  'the house exactly two rights over somebody else''s game — to name it and '
  'to point a host at it — and until db/053 only the naming was enforced, so '
  'a recommendation could exist with nowhere to go.';
