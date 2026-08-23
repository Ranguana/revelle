-- ── 039 · TWO REQUIREMENTS THAT GRADED NOTHING ───────────────────────
--
-- Applied by scripts/migrate.mjs after 038, inside one transaction together
-- with its schema_migrations ledger row. Nothing here may be a statement that
-- refuses to run in a transaction.
--
-- New file, never applied anywhere, so no SENTINELS entry in
-- scripts/migrate.mjs.
--
-- ─────────────────────────────────────────────────────────────────────
-- WHAT IS CUT, AND IT IS RULE 15'S OTHER ARM
--
-- `noise_ceiling` and `deposit_safe` are removed from `structural_requirement`
-- and from every room's affordance matrix.
--
-- CLAUDE.md rule 15 gives an unfed instrument two outcomes and no third:
-- "Anything unfed is either wired or cut — it does not get to sit in the
-- scoring loop looking like it works." db/035 took the first road for
-- `outdoor_access`, which was refusing nowhere because db/033 added the code
-- and not the matrix; that one had claimants waiting and only needed the rows.
-- These two have the opposite shape. The matrix is complete for both — every
-- environment has a row, and eight of them say `false` — and in the whole life
-- of the catalogue NOTHING HAS EVER CLAIMED EITHER. `ingredient_requirement`
-- holds no row for `noise_ceiling` and none for `deposit_safe`, from any
-- seeder, in any pool.
--
-- So the pruning half was built and the claiming half never was. Eight
-- carefully authored refusals, with notes in the house's voice, hanging off two
-- codes that no dish, drink, menu, game, product or bank item has ever raised
-- its hand for. venueEligibility() has consulted them on every selection since
-- db/020 and they have removed nothing, ever. That is not a dormant feature; it
-- is two columns of scaffolding that make the venue system look one-third more
-- complete than it is, and the cost of leaving them is that the next person to
-- read `venue_affordance` believes loudness is being handled.
--
-- ─────────────────────────────────────────────────────────────────────
-- THE REASONING FOR THEIR EXISTENCE, PRESERVED (CLAUDE.md RULE 14)
--
-- db/020 authored them with care and its argument is worth keeping whole,
-- because it is right about the DISTINCTION and only wrong about the follow-
-- through. In its own words:
--
--     "`demand` is the column that keeps the polarity honest. Two of the five
--      codes are nouns rather than requirements — `noise_ceiling` and
--      `deposit_safe` — and a reader guessing at their direction from the name
--      alone would get `deposit_safe` exactly backwards. The row says what it
--      means."
--
-- And the two rows themselves:
--
--     noise_ceiling  'Breaks a noise ceiling' / 'will be louder than the room
--                    allows' — "It is loud, and it is loud at an hour. Read the
--                    code as the ceiling it BREAKS: a room that has a noise
--                    ceiling cannot hold this."
--     deposit_safe   'Endangers a deposit' / 'will not survive a deposit' —
--                    "It stains, scorches, marks or spills on something
--                    somebody else owns. Read the code as the property it
--                    FAILS: this is not deposit-safe."
--
-- The refusals, likewise, because they are the best short statement anywhere of
-- what those two axes were for and whoever re-proposes them should start here:
--
--     noise_ceiling  false in city_apartment, hotel, rented_house —
--                    "shared walls, and a complaint arrives before the evening
--                     does"
--     deposit_safe   false in rented_house, hotel, restaurant_or_venue —
--                    "somebody else owns the floor and there is a deposit
--                     against it"
--
-- WHAT BEAT IT: nothing was ever tagged. Not a wrong tag — no tag. The axis was
-- authored from the room's side only, and an axis with one side is a filter
-- that filters nothing. The three that survive — `requires_outdoors`,
-- `requires_open_flame`, `requires_full_kitchen` — are claimed by real rows and
-- really prune.
--
-- ── AND WHY THIS IS A CUT RATHER THAN A TAGGING PASS ─────────────────
--
-- Because the tagging pass is a judgement about six hundred rows and not a
-- script's to make (CLAUDE.md rule 8), and because the two codes are the ones
-- whose direction db/020 itself warns is easy to get backwards. A sweep that
-- guesses which dishes "will not survive a deposit" would produce a filter that
-- silently removes food from every rented house on a machine's opinion. The
-- founder ruled: cut.
--
-- ── HOW THEY COME BACK, IF THEY DO ───────────────────────────────────
--
-- The same way `outdoor_access` arrived: a code, a full affordance matrix, AND
-- claimants in the same migration. All three or none — that is the lesson both
-- db/035 and this file are instances of, from the two opposite directions.
--
-- ─────────────────────────────────────────────────────────────────────


-- ── refuse to delete something that is in use ────────────────────────
--
-- The whole premise of this migration is that nothing claims either code. If
-- that has stopped being true between the reading and the deploy, the right
-- outcome is a failed migration and not a silent unTAGGING: the foreign key
-- from ingredient_requirement would refuse anyway, and this turns that into a
-- sentence somebody can act on.

do $$
declare v_claims integer;
begin
  select count(*) into v_claims
    from ingredient_requirement
   where requirement in ('noise_ceiling', 'deposit_safe');

  if v_claims > 0 then
    raise exception
      '[039] % ingredient(s) now claim noise_ceiling or deposit_safe. This '
      'migration cuts two requirements ON THE GROUND THAT NOTHING CLAIMS THEM, '
      'and something does. Decide which is right before running it: either the '
      'claims are the wiring rule 15 asks for and the cut is wrong, or they are '
      'a mistake and should be removed deliberately.', v_claims;
  end if;

  raise notice '[039] nothing claims either code, as expected';
end $$;


-- ── the affordance rows ──────────────────────────────────────────────
--
-- Deleted first, because they reference the codes. Ten rows: every value of
-- environment_type against each of the two.

delete from venue_affordance
 where requirement in ('noise_ceiling', 'deposit_safe');


-- ── the codes ────────────────────────────────────────────────────────

delete from structural_requirement
 where code in ('noise_ceiling', 'deposit_safe');


-- ── and prove it ─────────────────────────────────────────────────────
--
-- db/035's shape, inverted: that one refused to finish while its grade still
-- pruned nowhere, and this one refuses to finish while either code is still
-- anywhere. A migration that says what it did and checks that it did it is the
-- only kind worth writing for a deletion.

do $$
declare
  v_codes integer;
  v_rows  integer;
  v_left  integer;
begin
  select count(*) into v_codes from structural_requirement
   where code in ('noise_ceiling', 'deposit_safe');
  select count(*) into v_rows from venue_affordance
   where requirement in ('noise_ceiling', 'deposit_safe');

  if v_codes <> 0 or v_rows <> 0 then
    raise exception
      '[039] % code(s) and % affordance row(s) survived the cut', v_codes, v_rows;
  end if;

  select count(*) into v_left from structural_requirement;
  raise notice
    '[039] noise_ceiling and deposit_safe cut. % requirements remain, and every '
    'one of them is claimed by something.', v_left;
end $$;


-- ─────────────────────────────────────────────────────────────────────
-- WHAT THIS DELIBERATELY DOES NOT DO
--
--   · NO CHANGE TO THE THREE THAT REMAIN. `requires_outdoors`,
--     `requires_open_flame` and `requires_full_kitchen` are claimed, prune, and
--     are untouched. `outdoor_access` (db/033, matrixed by db/035) likewise.
--
--   · NO COLUMN DROPPED, NO TABLE DROPPED. `structural_requirement` and
--     `venue_affordance` are the mechanism and the mechanism is sound; what was
--     wrong was two rows in it. Removing the machine because two of its five
--     inputs were never connected is the overcorrection this codebase warns
--     about whenever it removes anything.
--
--   · NO ENUM TOUCHED. `structural_requirement.code` is a text primary key and
--     not an enum, so a cut is a delete and there is no value left stranded in
--     a type. This is the reason db/020 made it a table rather than an enum,
--     and the first time that decision has paid.
--
--   · NOTHING SAID ABOUT `rented_house`. Both cut codes carry a refusal for
--     that environment, and it is the only environment whose ONLY refusals are
--     these two — so after this migration a rented house affords exactly what a
--     house affords. Whether the quiz should offer it as a room is therefore a
--     LIVE QUESTION rather than a consequence of this file, and it is not
--     answered here. See docs/proposals.md, 2026-08-23.
-- ─────────────────────────────────────────────────────────────────────
