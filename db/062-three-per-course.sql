-- Revelle Société — THREE PER COURSE, AND SHE PICKS ONE OF EACH
--
-- Applied by scripts/migrate.mjs after 061, inside one transaction together
-- with its schema_migrations ledger row.
--
-- ─────────────────────────────────────────────────────────────────────
-- THE RULING
--
-- Founder, 2026-09-05:
--
--     "we had talked about making the menu changeable, lets give 3 menu
--      options (if member wants) like we do for games"
--
-- and, asked whether that meant three whole composed menus or three per
-- course:
--
--     "three per course"
--
-- THREE APPETIZERS, THREE MAINS, THREE DESSERTS. SHE PICKS ONE OF EACH.
-- Nine cards, three choices, one table.
--
-- ── THIS FILE EXTENDS db/061. IT ADDS NO MECHANISM ──────────────────
--
-- CLAUDE.md rule 21, and the reason this migration is short enough to read in
-- one sitting: everything a carousel needs already exists and none of it is
-- about games.
--
--   occasion_slot.offer_count      db/061, pool-agnostic ON PURPOSE — "a
--                                  column that could only hold the answer for
--                                  one pool would absorb the other answers and
--                                  drop them (rule 16)". This file is the
--                                  second pool, and the column was built for
--                                  exactly this day.
--   revelle_<pool>.offer_group     added by a loop over `ingredient_pool`, so
--   revelle_<pool>.chosen_at       `revelle_dish` already carries both, with
--                                  the partial unique index and the
--                                  chosen-was-offered check already on it.
--   revelle_proposal_pick.offer_group   already copied across approval for
--                                  every pool.
--
-- So the whole of the ruling, in schema terms, is ONE UPDATE OF TWENTY-SEVEN
-- ROWS. If that reads as too little work for a founder ruling, that is db/061
-- having been built right rather than this file cutting a corner — and it is
-- the difference between extending a mechanism and growing a second one.
--
-- ── HOW THE CHOICE BINDS. UNCHANGED, AND DELIBERATELY SO ────────────
--
-- db/061's load-bearing decision governs dishes word for word: THE OFFER
-- BINDS, THE CHOICE DOES NOT.
--
-- All nine dishes are written into `revelle_dish` at approval, so the nine are
-- inside `compute_assemblage_fingerprint` and no two members receive the same
-- nine. Her three picks are `chosen_at` timestamps on rows she already has —
-- a column db/002 classes as outside the fingerprint.
--
-- The consequence is the one that matters to a host holding a phone in a
-- kitchen: SHE MAY CHANGE HER MIND ABOUT ANY COURSE, AS OFTEN AS SHE LIKES,
-- FOREVER, AND THE HOUSE CAN NEVER REFUSE A CARD IT DEALT HER. A product that
-- offers a choice and can then decline it is CLAUDE.md rule 16 at its plainest,
-- and db/061 argues the alternative — writing the ingredient after delivery —
-- out at length. Nothing about dishes disturbs that argument.
--
-- ── THE THING DISHES HAVE THAT GAMES DO NOT: THEY ANSWER EACH OTHER ─
--
-- A game is one unit. Three courses are meant to sit on one table, and
-- mix-and-match raises a question the game ruling never had to face: can she
-- pair a main with a dessert the house would never have put together?
--
-- SHE CANNOT PAIR THEM WRONGLY ON THE TWO AXES THE HOUSE ACTUALLY DEFENDS,
-- because db/022's coherence group already binds the SET and not the pick.
-- `slot_kind.coherence_group = 'the_table'` on all three courses, enforced in
-- fillSlots() (src/lib/selection/fill.ts): every dish placed into a group must
-- agree with what the group has already committed to on SEASON and on the RUNG
-- OF THE MAKING AXIS. That commitment is made by the first card placed and
-- binds every card after it, offered or not — so all nine dishes land on one
-- season and one rung.
--
-- Which means all twenty-seven combinations she can assemble are ONE TABLE, in
-- her month, at her level of effort. Nothing here had to be added for that to
-- be true, and nothing here weakens it. THAT IS THE ANSWER TO "WHAT IF SHE
-- PAIRS THEM BADLY": the axes a mismatch would show up on are the two the
-- table already agrees about, and what is left — a heavy main beside a rich
-- dessert — is a matter of taste, which is hers. She was given three per course
-- knowing that. Rule 10: the product is the instrument, and it does not
-- second-guess the author.
--
-- ── RULE 23: COUNT WHAT POINTS AT THESE ROWS BEFORE TOUCHING THEM ───
--
-- db/061's near-miss, written into CLAUDE.md's unratified section the same day:
-- deleting `occasion_slot` rows orphaned the `game_slot` claims pointing at
-- them, and a `fit = 'native'` claim is a WHITELIST, not a preference — so
-- eleven of twenty-seven games were left claiming beats no occasion had, with
-- nothing red anywhere.
--
-- THAT DEFECT CANNOT ARISE HERE, and the reason is worth stating rather than
-- assuming: THIS FILE DELETES NO ROW AND MOVES NO BEAT. The three course slots
-- keep their codes, their occasions, their pool and their counts. `dish_slot`
-- claims — projected one-way from `dish.course` by db/022's trigger — still
-- point at exactly the slots they pointed at yesterday.
--
-- Section 0 counts them anyway, into the deploy log, because "it cannot arise"
-- is a reading and a count is a fact (rule 24). If a future file ever does move
-- a course beat, the number it has to preserve is printed here.
--
-- ── RULE 33: SCRATCH-SEEDED VERSUS PRODUCTION-UNSEEDED ──────────────
--
-- Read db/053's header. NO CONSTRAINT IS ADDED BY THIS FILE, so there is
-- nothing to backfill before: `offer_count` was added by db/061 as `not null
-- default 1 check (offer_count >= 1)`, every existing row carries 1, and 3
-- satisfies the check that already stands. The update below is the whole
-- schema change and it meets production data in exactly the state CI meets it.
--
-- WHAT IT CANNOT REPAIR, NAMED RATHER THAN INVENTED (db/061's own treatment,
-- followed): Revelles already delivered carry THREE dish rows, one per course,
-- each with `offer_group` null. They were placed by the house before choosing
-- existed. Nothing here backfills them into an offer she was never made or a
-- choice she never expressed — a null offer_group reads as "placed, not
-- offered", the portal renders it as her course and asks her nothing, and that
-- is the truth about how it got there.
--
-- ── WHERE FEWER THAN THREE ARE ELIGIBLE ─────────────────────────────
--
-- SHOW WHAT EXISTS. Nothing pads, repeats or fails, and the mechanism is
-- db/061's unchanged: planSlots expands the beat into three unit slots of which
-- ONLY THE FIRST carries `required`, so a room with one eligible dessert fills
-- the first and drops the other two the way any optional slot is dropped.
--
-- The dish pool is deep — 1088 active rows — so this bites in fewer places than
-- it did for games, but it does bite, and the rooms are named rather than
-- assumed (counted from docs/dishes.md, which is what the seeder writes):
--
--     St. Moritz     5 appetizers ·  1 main    ·  1 dessert
--     Palm Springs   8 appetizers ·  0 mains   ·  3 desserts
--     Aspen          4 appetizers ·  4 mains   ·  4 desserts
--     Amalfi Coast   6 appetizers · 12 mains   ·  4 desserts
--     Oaxaca        10 appetizers · 20 mains   ·  6 desserts
--     Acapulco       8 appetizers ·  9 mains   ·  7 desserts
--
-- St. Moritz offers one main and one dessert; Palm Springs offers no main at
-- all, which is not a fault this file may fix — CLAUDE.md rule 30, founder's
-- ruling: "Palm Springs refusing a main course is the room working, not a gap",
-- and authoring dishes to hit a number is the failure the number was built to
-- detect. Every other room clears three at every course before the season and
-- the rung narrow it further, and those narrow per host, not per room.
--
-- A ROOM WITH ONE DESSERT IS A ROOM WITH ONE DESSERT. The portal says so
-- plainly, in her own arithmetic — "one to choose between" is never written,
-- because an offer of one is not an offer and she is simply given it.
-- ─────────────────────────────────────────────────────────────────────


-- ── 0. THE COUNT, RECORDED BEFORE IT IS CHANGED ──────────────────────
--
-- Rule 24: reading the code tells you what it was meant to match, only counting
-- tells you what it did. Both directions, because they fail identically from
-- outside — a predicate matching nothing leaves every course placed by the
-- house, and a predicate matching too much would offer three of something
-- nobody ruled on.

do $$
declare
  v_courses  integer;
  v_offering integer;
  v_claims   integer;
  r          record;
begin
  select count(*) into v_courses
    from occasion_slot
   where pool = 'dish'
     and slot_code in ('the_appetizer', 'the_main', 'the_dessert');

  select count(*) into v_offering
    from occasion_slot
   where pool = 'dish' and offer_count > 1;

  -- RULE 23'S COUNT. What points at these slots, before anything touches them.
  -- `dish_slot.fit = 'native'` is a whitelist: a dish carrying one is eligible
  -- at those slots AND NO OTHERS. Nothing below deletes a slot, so this number
  -- must be identical afterwards — it is printed so that a future file that
  -- does move a course beat has the number it is obliged to preserve.
  select count(*) into v_claims
    from dish_slot
   where slot_code in ('the_appetizer', 'the_main', 'the_dessert')
     and fit = 'native';

  raise notice 'db/062 — % course slots across the occasions, % already '
               'offering, % native dish claims on them.',
               v_courses, v_offering, v_claims;

  for r in
    select slot_code, count(*) as n
      from occasion_slot
     where pool = 'dish'
       and slot_code in ('the_appetizer', 'the_main', 'the_dessert')
     group by slot_code
     order by slot_code
  loop
    raise notice 'db/062 —   % : % occasions', r.slot_code, r.n;
  end loop;
end;
$$;


-- ── 1. THREE PER COURSE ──────────────────────────────────────────────
--
-- THE ONLY SCHEMA CHANGE IN THIS FILE.
--
-- Named by slot_code rather than by `pool = 'dish'`, and the difference is not
-- style. db/061 could write `where pool = 'game'` because the game pool has
-- exactly one beat and the ruling was about all of it. The dish pool's beats
-- are the three courses TODAY; a fourth course, or some later slot that draws
-- dishes for a different purpose, would be silently swept into a ruling that
-- was made about courses. Rule 32: symmetry is not evidence, and "it draws
-- dishes, so it must offer three" is the shape that rule refuses.
--
-- Three is a product decision and it lives in a column a curator can change
-- with an update — db/009's own argument about `occasion_shape.days`: "a
-- product decision that lives in a `switch` is a product decision nobody can
-- find."
--
-- AN OR, NEVER AN AND. `min_count` and `max_count` are untouched at 1: the beat
-- still contains ONE appetizer. What changes is how many candidates she is
-- shown for it.

update occasion_slot
   set offer_count = 3
 where pool = 'dish'
   and slot_code in ('the_appetizer', 'the_main', 'the_dessert');


-- ── 2. WHAT IT MATCHED, AGAINST WHAT WAS EXPECTED ────────────────────
--
-- Nine occasions × three courses = twenty-seven. Stated as an assertion rather
-- than a notice, because a course beat that quietly failed to become an offer
-- would look exactly like a course the house places — which is what every
-- course looked like yesterday, and is therefore invisible.

do $$
declare
  v_offering integer;
  v_occ      integer;
  v_bad      text;
begin
  select count(*) into v_offering
    from occasion_slot
   where pool = 'dish'
     and slot_code in ('the_appetizer', 'the_main', 'the_dessert')
     and offer_count = 3;

  select count(distinct occasion) into v_occ
    from occasion_slot
   where pool = 'dish'
     and slot_code in ('the_appetizer', 'the_main', 'the_dessert');

  if v_offering <> 27 or v_occ <> 9 then
    raise exception
      'db/062: expected 27 course beats offering three across 9 occasions, '
      'found % across %.', v_offering, v_occ
      using hint = 'db/022 wrote three course rows for each of the nine '
                   'occasions. A different number means a migration between '
                   'that file and this one changed the composed table without '
                   'this file knowing.';
  end if;

  -- AND EVERY OCCASION HAS ALL THREE COURSES OFFERING. An occasion holding two
  -- offered courses and one placed one would hand a host a choice of appetizer,
  -- a choice of dessert, and a main the house simply gave her — which reads as
  -- a bug in the page rather than as the ruling half-applied.
  select string_agg(occasion || ' (' || n || ')', ', ' order by occasion)
    into v_bad
    from (select occasion, count(*) as n
            from occasion_slot
           where pool = 'dish'
             and slot_code in ('the_appetizer', 'the_main', 'the_dessert')
             and offer_count = 3
           group by occasion) counted
   where n <> 3;

  if v_bad is not null then
    raise exception
      'db/062: these occasions do not offer three at all three courses: %.',
      v_bad;
  end if;

  raise notice 'db/062 — % course beats offer three, across % occasions.',
               v_offering, v_occ;
end;
$$;


-- ── 3. THE HEADROOM ARITHMETIC, TOLD THE TRUTH ───────────────────────
--
-- db/022 set `typical_draw = 3` for dishes when a Revelle drew three courses.
-- A Revelle now draws NINE — the offer, not the choice, because what
-- `assemblage_headroom()` counts is ISSUED sets and all nine are issued.
--
-- The number goes UP as the number of dishes she eats stays the same, which
-- reads backwards until you say what headroom measures: how many distinct
-- assemblages the catalogue can still produce before two members collide.
-- Drawing nine from a pool of a thousand produces vastly more distinct sets
-- than drawing three did, and the collision risk db/002 worries about falls
-- accordingly. db/061 made the identical move for games and its note is the
-- fuller version of this one.

update ingredient_pool set typical_draw = 9 where entity_table = 'dish';


-- ─────────────────────────────────────────────────────────────────────
-- WHAT THIS DELIBERATELY DOES NOT DO
--
--   · NO SECOND MECHANISM. Everything above is db/061's carousel pointed at a
--     second pool. There is no dish-specific offer table, no dish-specific
--     choice column and no dish-specific settled rule — `settledSql` in
--     src/lib/portal/choice.ts remains the ONE owner of "which unit is
--     settled", read by the page, the prep list and the dependency check
--     (rule 21).
--
--   · NO REVIVAL OF THE MENU POOL. The founder's word was "menu options", and
--     a menu has not been an object since db/045 retired the pool: a menu is
--     these three courses. Her follow-up settles it — "three per course" is
--     three of each course, not three composed menus, and reading it the other
--     way would have un-retired thirty-nine rows on an agent's inference. The
--     pool stays exactly where db/022 and db/045 left it, preserved and
--     undrawn, and the live question about it is still parked in
--     docs/needs-a-human.md.
--
--   · NO NEW COHERENCE RULE. db/022's `the_table` group already binds the nine
--     to one season and one rung, which is argued above. Adding a second rule
--     about which main "goes with" which dessert would be the house authoring
--     her taste — rule 10 — and no row says so (rule 32).
--
--   · NO PADDING WHERE A ROOM IS THIN. St. Moritz offers one main and Palm
--     Springs offers none. Both are the catalogue telling the truth, and
--     rule 30 forbids authoring dishes to make a number.
--
--   · NO BACKFILL OF EXISTING REVELLES INTO AN OFFER, and no retro-marked
--     `chosen_at`. Named in the rule-33 section above.
-- ─────────────────────────────────────────────────────────────────────
