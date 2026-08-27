-- ── 045 · THE MENU POOL, RETIRED ─────────────────────────────────────
--
-- The founder's ruling, recorded in docs/needs-a-human.md under "THE MENU POOL
-- HAS NO SLOT": RETIRE the menus. Not delete. Two alternatives were considered
-- and rejected — repurpose them as authoring templates that seed dish
-- selection, and restore a slot for signature occasions as a declared hybrid.
-- Both are still buildable; neither is what she chose.
--
-- ── WHAT MADE THE POOL UNDELIVERABLE ─────────────────────────────────
--
-- `db/022-the-table-composed.sql` replaced the set menu with a composed table —
-- `the_appetizer`, `the_main`, `the_dessert`, all drawing from `dish` — and at
-- its line 513 deleted the nine `occasion_slot` rows for `the_menu`, one per
-- occasion. It said so plainly: "the engine no longer has a slot to put a menu
-- in, so it no longer places one." It set `typical_draw = 0` in the same file.
--
-- Verified on a scratch database built from the committed chain plus the whole
-- `preDeployCommand` seeder chain, rather than assumed from reading:
--
--     select count(*) from occasion_slot where slot_code = 'the_menu';  -- 0
--     select typical_draw from ingredient_pool where entity_table='menu'; -- 0
--     select count(*) from menu where status = 'active';                -- 39
--
-- Thirty-nine menus, live, on the desk, in the registry, in the engine's
-- catalogue read — and NO PACKAGE CAN DELIVER ONE. That is not a pool with a
-- shallow slot. It is a pool with no slot at all.
--
-- ── WHY THEY WERE KEPT UNTIL NOW, WHICH IS NOT THE SAME QUESTION ─────
--
-- CLAUDE.md rule 14: a reversed decision keeps the argument it reversed. The
-- menus were kept ON PURPOSE and the argument was good.
--
-- db/021 refused to treat a dish as a smaller menu — "neither is derived from
-- the other and neither replaces the other". A MENU IS AN EVENING. A DISH IS A
-- PLATE. Composition can assemble three plates that agree with each other; it
-- cannot author the evening somebody wrote, and db/022 says so itself under
-- WHAT COMPOSITION LOSES. So db/022 was split into its own file precisely so
-- that composition could be REVERTED while the pool stayed whole, and it listed
-- what it was keeping: the `menu` table and all thirty-nine rows, `menu_world`,
-- `menu_facet`, `menu_card`, `scripts/seed-menus.mjs`, `/desk/menus`, the pool's
-- registration in `ingredient_pool` and in `src/lib/selection/catalogue.ts`,
-- and `slot_kind.the_menu` itself.
--
-- ── THE HEDGE SURVIVES THIS FILE. SAID ONCE, PLAINLY ────────────────
--
-- NOTHING IN THAT LIST IS DELETED HERE. A retired menu keeps its text, its
-- name, its season, its `dishes` line, its facets, its destinations, its
-- lineage and its reason. Every one of the thirty-nine is still readable at
-- /desk/menus behind one link, exactly as Cap Ferrat is still readable at
-- /desk/destinations.
--
-- RESTORING THE SET MENU IS TWO GESTURES AND NEITHER IS A RECONSTRUCTION:
--
--   1. `update menu set status = 'active'` over the rows to bring back, and
--      `update ingredient_pool set retired_at = null` on the `menu` row so the
--      seeder stocks live again (see THE SEEDER READS THE REGISTRY below).
--   2. Re-insert the nine `occasion_slot` rows db/022 deleted. They are quoted
--      verbatim in db/012 at the section headed "which occasions have a menu,
--      and whether it is required", with the min/max/required/per_day/position
--      values and her notes, so this is a copy rather than a judgement remade.
--
-- A FUTURE READER MUST NOT THINK THE FALLBACK WAS DESTROYED. It was not. What
-- this file ends is the standing invitation to misuse.
--
-- ── AND THAT INVITATION ALREADY PRODUCED A DEFECT ────────────────────
--
-- CLAUDE.md rule 15's shape, on the surface built to prevent it: `/desk/coverage`
-- answered "can this room serve dinner?" with menu rows no package can deliver.
-- A room could read as COVERED for the table while being unable to fill
-- `the_dessert`. The board claimed a certainty it did not have, because thirty-
-- nine rows sat in the catalogue looking exactly like stock.
--
-- Serve-coverage now measures the three dish slots; that half is fixed
-- elsewhere. This file removes the rows that made the mistake available. A pool
-- that looks live and cannot be delivered will be read as live again by the
-- next surface that counts it, and the one after that.
--
-- ─────────────────────────────────────────────────────────────────────
-- I · WHAT A MENU ACTUALLY HAS, AND WHY 'retired' IS NOT AVAILABLE
-- ─────────────────────────────────────────────────────────────────────
--
-- Established before designing anything, because db/042 put its columns on
-- `world` and it would be easy to assume `menu` inherited them. It did not.
--
-- `menu` (db/012) carries: id, slug, name, dishes, season, season_note,
-- season_strict, cooking, cooking_note, source_note, notes, status, created_at,
-- updated_at. NO retirement columns. NO `superseded_by`. NO `retired_at`.
--
-- And its `status` is `product_status`, which db/002 declares as
--
--     create type product_status as enum ('draft', 'active', 'discontinued');
--
-- There is no 'retired'. THE OBVIOUS MOVE IS UNAVAILABLE, and for a reason
-- worth writing down rather than discovering twice:
--
--   `alter type product_status add value 'retired'` is legal inside a
--   transaction on Postgres 12+, but THE NEW VALUE CANNOT BE USED UNTIL THAT
--   TRANSACTION COMMITS. scripts/migrate.mjs wraps each file in one
--   transaction together with its ledger row — deliberately, so a half-applied
--   migration is impossible — so adding the value and writing it are two
--   migrations, forever, and this is one file. Tried on the scratch cluster
--   rather than argued from memory; Postgres answers
--   "unsafe use of new value 'retired' of enum type product_status".
--
-- The other route — build a new enum, `alter table … type`, drop the old — is a
-- change to SIX POOLS (product, game, menu, drink, dish, bank_item) and to
-- every view over their status columns, to spell one word differently in one of
-- them. Refused. That is a schema-wide migration wearing a one-pool decision.
--
-- ── SO: `discontinued`, AND THE GAP IN THE WORD IS NAMED ─────────────
--
-- db/005 is right that this enum's third value is a supplier's fact: "nobody
-- discontinues a song", which is why `tracklist_status` has 'retired' instead.
-- A menu has no supplier either. The word is weaker than the act.
--
-- It is still the honest value available, for three reasons that are about the
-- system rather than about the dictionary:
--
--   · it means NOT OFFERED, which is exactly true here;
--   · every surface already reads it that way —
--     `src/lib/selection/catalogue.ts` gates each pool on `t.status = 'active'`,
--     `publish()` moves only `draft`, `revert()` moves only `active`, and
--     /desk/menus already has a filter for it. Nothing has to learn a new word;
--   · and the gap between the word and the act is precisely what the note
--     column below exists to close. `status = 'discontinued'` on its own would
--     be CLAUDE.md rule 17's "an adjudication with the opinion torn off".
--
-- ─────────────────────────────────────────────────────────────────────
-- II · RULE 17 ON A POOL CLASS, AND WHERE THE LINEAGE HONESTLY GOES
-- ─────────────────────────────────────────────────────────────────────
--
-- Rule 17 is written for GOVERNED classes, and by rule 13's own classification
-- test `menu` is a POOL class: selection CHOOSES AMONG menus, a menu does not
-- DEFINE WHAT A MEMBER CAN BE PROMISED. Read literally, rule 17 does not reach
-- this file at all.
--
-- It is applied anyway, and the reason is the distinction rule 13 draws rather
-- than an override of it. THIS IS NOT A CURATOR WITHDRAWING A ROW. It is the
-- closing of a whole pool by a founder's ruling, which is a decision about what
-- the catalogue IS — the class of decision rule 17 was written for, arriving at
-- a table rule 17 did not anticipate. db/028 lost exactly this kind of reasoning
-- by leaving it in comments, and rule 17 is the scar.
--
-- ── THE FK HALF DOES NOT FIT A MENU ROW, AND IS NOT FORCED ──────────
--
-- db/042 gives `world.superseded_by` as a nullable FK to `world(id)`: the room
-- this one was folded into. The equivalent question here has no answer AT THE
-- ROW GRAIN, and every way of pretending otherwise is a falsehood:
--
--   · `superseded_by uuid references menu(id)` — no menu was folded into
--     another menu. It would be null on all thirty-nine, forever, with no
--     writer anywhere: a pointer with nothing to point at, which is schema
--     theatre and the sort of unfed instrument rule 15 exists to refuse.
--   · a pointer at a `dish` — no single dish replaced menu 12. Three dishes and
--     three slots did, and choosing one of them would record a fact that is not
--     true.
--   · a pointer at a `world` — db/042's own column type, and meaningless: a
--     menu is not superseded by a destination.
--
-- WHAT IS ACTUALLY TRUE IS A POOL-LEVEL FACT. The `menu` POOL was superseded by
-- the `dish` POOL plus db/022's three courses. That sentence has a subject and
-- an object that both exist as rows — in `ingredient_pool`, the registry rule
-- 19 calls the only truth — so the lineage goes there, where it is true, rather
-- than being smeared thirty-nine times across rows it is not true of.
--
-- Both halves of rule 17 are therefore satisfied, at the two grains the two
-- facts actually have:
--
--   LINEAGE, machine-readable   ingredient_pool.superseded_by = 'dish'
--                               ingredient_pool.retirement_note
--   THE WHY, in words, per row  menu.retirement_note
--
-- The founder's own test, quoted in db/042 and still the whole standard:
--
--     A REASON THAT CANNOT BE QUERIED IS A NOTE.
--     A POINTER WITH NO WORDS IS A FACT WITH NO ARGUMENT.
--
-- ── WHY THE PER-ROW NOTE IS NOT REDUNDANT WITH THE POOL'S ───────────
--
-- Thirty-nine copies of one sentence looks like duplication, and rule 21 would
-- be the objection. It is not the same fact twice. `menu.status` moves PER ROW,
-- and rule 17's wording is "in the same statement that writes the status". More
-- concretely: without it, a menu somebody discontinues by hand next spring is
-- indistinguishable from one of these thirty-nine, and the desk cannot say
-- which of the two it is looking at. The pool's note answers "why is this pool
-- closed". The row's note answers "why is THIS row out". Two questions.
--
-- ─────────────────────────────────────────────────────────────────────
-- III · THE ORDER OF THIS FILE IS db/042'S, AND FOR ITS REASON
-- ─────────────────────────────────────────────────────────────────────
--
-- COLUMNS, THEN BACKFILL, THEN CONSTRAINTS. A constraint is checked against
-- every existing row the moment it is added, so a migration that adds one has
-- to leave the table SATISFYING it first. Written the other way round this file
-- raises on the only database that matters, `npm run migrate` exits non-zero,
-- and per the ORDERING RULE in scripts/migrate.mjs every later migration and
-- every seeder in the chain dies with it. db/032 did exactly that and cost four
-- migrations and seven seeders that never applied.

-- ── the registry gains a retirement ──────────────────────────────────
--
-- `ingredient_pool` has no status column of any kind — it is a registry of what
-- exists, and until today nothing that was registered had ever stopped being
-- offered. `retired_at` is the marker rather than a boolean because WHEN is the
-- question a person asks next, and a timestamp answers both.

alter table ingredient_pool
  add column retired_at      timestamptz,
  add column superseded_by   text references ingredient_pool(entity_table)
                               on delete restrict,
  add column retirement_note text;

comment on column ingredient_pool.retired_at is
  'When this pool stopped being offered. Null on a live pool. A retired pool '
  'keeps every row, every join table and its registration: what ends is the '
  'stocking, not the record. Read by scripts/seed-menus.mjs to decide what '
  'status a NEW row arrives in — see db/045.';

comment on column ingredient_pool.superseded_by is
  'LINEAGE, at the grain the fact is true: the POOL that took this pool''s '
  'work. Nullable because most retirements supersede nothing. Kept after an '
  'un-retirement — it is a record of what happened, not a description of the '
  'current state. CLAUDE.md rule 17, following db/042''s shape on `world`.';

comment on column ingredient_pool.retirement_note is
  'THE WHY, in words. Required whenever retired_at is set and whenever '
  'superseded_by is set. CLAUDE.md rule 17: a reason that cannot be queried is '
  'a note; a pointer with no words is a fact with no argument.';

-- ── the menu row gains its own reason ────────────────────────────────
--
-- Deliberately ONE column and not two: the row-grain question is "why is this
-- row out", and the row-grain answer to "what replaced it" is the pool's, three
-- inches up. See II above for why a per-row FK would have to be invented.

alter table menu
  add column retirement_note text;

comment on column menu.retirement_note is
  'Why this menu is not offered, in words, written in the same statement that '
  'wrote the status. Required whenever status = ''discontinued'' '
  '(menu_discontinued_has_reason). Kept if the menu is brought back: it is a '
  'record of what happened, not a description of the current state — db/042 '
  'argues that asymmetry at length. CLAUDE.md rule 17.';

-- ─────────────────────────────────────────────────────────────────────
-- IV · THE BACKFILL — THE POOL FIRST, THEN THE ROWS, FROM THE POOL
-- ─────────────────────────────────────────────────────────────────────
--
-- THE ORDER INSIDE THE BACKFILL IS ALSO LOAD-BEARING, and for rule 21 rather
-- than for the constraints. There is ONE sentence explaining this retirement
-- and it is written ONCE, on the registry row. Every menu row copies it, and so
-- does `scripts/seed-menus.mjs` when it creates a menu into a retired pool on a
-- fresh build. Writing it here and again in the seeder would be two texts for
-- one fact, drifting the day somebody improves one of them — and the two
-- readers would be a curator on the live database and a curator on a rebuilt
-- one, looking at the same menu and being told different things.
--
-- Distinguished on purpose, because collapsing them into one "did it work"
-- would hide the two that matter:
--
--   THE POOL IS EMPTY      Fine, and NORMAL — this is what a fresh database
--                          does, on every build, forever. `preDeployCommand`
--                          runs `npm run migrate` BEFORE `npm run seed:menus`,
--                          so on any database built from the committed chain
--                          this file runs against an empty `menu` table.
--                          CLAUDE.md rule 22 exactly. It is why the registry
--                          block that follows is not decoration: it is the ONLY
--                          part of this decision that survives a rebuild, and
--                          it is what the seeder reads a few seconds later.
--
--   ROWS PRESENT           The live case. Every menu not already discontinued
--                          moves, carrying the founder's sentence. `draft` rows
--                          move too — a draft menu has the same nowhere to go,
--                          and leaving it would leave /desk/publish inviting a
--                          curator to offer a row into a slot that does not
--                          exist, which is rule 16's failure with a button.
--
--   ALREADY DISCONTINUED,  Held. A row somebody withdrew by hand carries her
--   NO REASON RECORDED     decision, not this one, and this file does not get
--                          to re-attribute it. It gets the same placeholder
--                          db/042 wrote for Cap Ferrat's silent siblings: a
--                          sentence that says NO REASON WAS RECORDED and is not
--                          an explanation. Inventing a plausible one would put
--                          words in a curator's mouth and would be
--                          indistinguishable, six months out, from a reason
--                          somebody actually gave. That is worse than the
--                          silence it replaces, because silence announces
--                          itself.

-- ── the pool itself, retired, with its lineage and THE sentence ──────
--
-- `update`, never `insert`: `src/lib/pools/derive.ts` reads the migrations to
-- build the pool union and treats `insert into ingredient_pool … values ('x'`
-- as a pool registration. A registration here would invent a pool. The pool
-- being retired is a fact ABOUT an existing row.
--
-- `typical_draw` is left at 0 — db/022 already set it, and for this reason:
-- nothing draws from the pool, so C(n, 0) = 1 and it contributes a factor of
-- one to `assemblage_headroom()`. The arithmetic was already telling the truth.

do $$
declare
  v_rows int;
begin
  update ingredient_pool
     set retired_at    = now(),
         superseded_by = 'dish',
         -- THE FOUNDER'S OWN SENTENCE, and the only copy of it. db/022's four
         -- screens are the working that produced it; this is the finding.
         retirement_note =
           'Superseded by db/022''s composed table — the appetizer, the main '
           'and the dessert, all drawn from the dish pool. The engine has no '
           'slot to put a menu in: db/022 deleted the nine occasion_slot rows '
           'for the_menu, so no package can deliver a menu. Preserved rather '
           'than deleted so the sequencing judgement stays readable, and so '
           'composition can still be reverted — a menu is an evening and a dish '
           'is a plate, and db/021 was right that neither replaces the other. '
           'To bring the set menu back: clear retired_at here, un-retire the '
           'rows, and re-insert db/012''s nine occasion_slot rows.'
   where entity_table = 'menu'
     and retired_at is null;
  get diagnostics v_rows = row_count;

  if v_rows = 1 then
    raise notice '[045] ingredient_pool.menu retired, superseded_by = dish.';
  elsif exists (select 1 from ingredient_pool
                 where entity_table = 'menu' and retired_at is not null) then
    -- db/040's `phase = r.was` instinct: move a row only from the state it was
    -- reasoned about. A pool somebody has already retired by hand carries her
    -- sentence, and the rows below will copy HERS rather than this file's.
    raise notice '[045] HELD — the menu pool was already carrying a '
      'retirement. Left exactly as it is rather than restamped.';
  else
    -- Not a notice. db/012 registers this pool at migrate time on every
    -- database, so its absence means the chain did not do what this file
    -- assumes, and a silent no-op here would leave the seeder stocking live
    -- menus forever with nothing reporting it.
    raise exception '[045] there is no ingredient_pool row for ''menu''. '
      'db/012 registers it at migrate time, so the chain has not done what '
      'this file assumes. Refusing to pretend the retirement was recorded.';
  end if;
end $$;

-- ── and now the rows, saying what the pool says ──────────────────────

do $$
declare
  v_note      text;
  v_moved     int;
  v_from_draft int;
  v_silent    int;
  v_total     int;
begin
  -- READ, not written. One sentence, one owner: see the head of section IV.
  select retirement_note into v_note
    from ingredient_pool where entity_table = 'menu';

  if v_note is null then
    raise exception '[045] the menu pool is retired with no reason on record. '
      'The block above should have made that impossible.';
  end if;

  select count(*) into v_total from menu;

  -- 1 · The silent ones first, so the constraint below has nothing left to
  --     refuse. Same sweep, same reasoning and nearly the same words as db/042.
  update menu
     set retirement_note =
           'No reason was recorded. This menu was withdrawn before db/045 '
           'required one, and this sentence is the migration saying so — it is '
           'not an explanation, and nobody has written one.'
   where status = 'discontinued'
     and (retirement_note is null or btrim(retirement_note) = '');
  get diagnostics v_silent = row_count;

  -- 2 · The ruling.
  select count(*) into v_from_draft from menu where status = 'draft';

  update menu
     set status          = 'discontinued',
         retirement_note = v_note
   where status <> 'discontinued';
  get diagnostics v_moved = row_count;

  -- One ledger row per menu, for the same reason db/036 wrote one per dish: a
  -- veto is only possible if the veto-er can see what happened, and
  -- /desk/stocked joins the ledger back to the row to read its status now.
  insert into staff_action
    (staff_id, actor, action, entity_table, entity_id, summary, detail)
  select null, 'auto: founder ruling', 'menu.retired', 'menu', m.id,
         m.name || ' — retired by db/045',
         jsonb_build_object(
           'migration', '045',
           'was', 'offered',
           'now', 'discontinued',
           'slug', m.slug::text,
           'superseded_by_pool',
             (select superseded_by from ingredient_pool
               where entity_table = 'menu'),
           'retirement_note', m.retirement_note,
           'why', 'db/022 deleted the nine occasion_slot rows for the_menu, so '
                  'no package can deliver a menu. The rows are kept: '
                  'restoring is un-retiring them plus re-inserting those nine.'
         )
    from menu m
   where m.retirement_note = v_note;

  if v_total = 0 then
    raise notice '[045] the menu table is empty — nothing to retire here, and '
      'that is EXPECTED on a fresh database: migrate runs before seed:menus. '
      'The retirement lives on the ingredient_pool row above, which the seeder '
      'reads a few seconds from now. See rule 22.';
  else
    raise notice '[045] % of % menu(s) retired (% of them were draft). % '
      'already discontinued with no reason on record; placeholder written.',
      v_moved, v_total, v_from_draft, v_silent;
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────────────
-- V · THE CONSTRAINTS, EACH ARGUED AT ITS OWN LINE
-- ─────────────────────────────────────────────────────────────────────
--
-- db/042's four, read again against this table and kept where they still hold.
-- The two it argues for NOT constraining are kept unconstrained here too, and
-- for its reasons: A NON-RETIRED ROW MAY CARRY A NOTE (the note is a RECORD and
-- stays true in the past tense after a return, so bringing a menu back must not
-- null its history), and A SUCCESSOR MAY ITSELF BE RETIRED (if the dish pool is
-- ever folded into something, `menu -> dish` is still true).

-- 1 · A NOTE IS NEVER BLANK.
--
-- `''` and `'   '` satisfy `is not null` and say nothing, so without this the
-- rule below is satisfiable by pressing space — the opinion torn off, wearing a
-- non-null column, which is worse than a null because it looks answered from
-- every angle. Applies in every state: null means "no retirement record", a
-- note means "here is the record", and there is no third thing.
alter table menu
  add constraint menu_retirement_note_not_blank
  check (retirement_note is null or btrim(retirement_note) <> '');

alter table ingredient_pool
  add constraint ingredient_pool_retirement_note_not_blank
  check (retirement_note is null or btrim(retirement_note) <> '');

-- 2 · NOT OFFERED IMPLIES A REASON.
--
-- The guard this file is for. After this line `update menu set status =
-- 'discontinued'` raises unless the reason moves with it — from the desk, from
-- a seeder, from a psql session, from a future migration hand-writing an
-- UPDATE. src/app/desk/(signed-in)/menus/actions.ts refuses it first, in words,
-- so a curator meets a sentence rather than a constraint error; this is the
-- backstop for every path that is not that form.
--
-- One direction only, and the asymmetry is deliberate: withdrawal REQUIRES the
-- record, return does not ERASE it.
alter table menu
  add constraint menu_discontinued_has_reason
  check (status <> 'discontinued' or retirement_note is not null);

alter table ingredient_pool
  add constraint ingredient_pool_retired_has_reason
  check (retired_at is null or retirement_note is not null);

-- 3 · A POINTER WITH NO WORDS IS A FACT WITH NO ARGUMENT.
--
-- The founder's sentence, in SQL. Lineage without a note records THAT a
-- supersession happened and loses WHY, which is db/028's failure with a foreign
-- key on top. The converse is NOT required: a note without a pointer is a
-- complete retirement, and most closures are absorbed by nothing.
alter table ingredient_pool
  add constraint ingredient_pool_lineage_has_words
  check (superseded_by is null or retirement_note is not null);

-- 4 · NOTHING SUPERSEDES ITSELF.
--
-- A pool folded into itself is a loop with one node, and the FK cannot catch it
-- because `ingredient_pool(entity_table)` includes this row. Cheap, exact, and
-- the only cycle a single-row CHECK can see; longer ones are named as unguarded
-- rather than half-guarded, exactly as db/042 named them, and for the same
-- reason — the rendering side does not walk this chain at all.
alter table ingredient_pool
  add constraint ingredient_pool_superseded_by_is_another_pool
  check (superseded_by is null or superseded_by <> entity_table);

-- NO INDEX ON `superseded_by`, and the absence is a decision. db/042 indexed
-- `world.superseded_by` because `world` grows and a destination's page asks the
-- reverse question. `ingredient_pool` holds EIGHT ROWS and is read once per
-- screen; an index on it is a thing to maintain in exchange for nothing
-- measurable. `menu` gets none either — it has no lineage column to index.

-- ── the reading view carries the reason ──────────────────────────────
--
-- /desk/menus reads `menu_card` and nothing else, so a column the screen must
-- render has to be here. Appended at the END: `create or replace view` may add
-- columns but may not reorder or retype the ones already there. db/016 replaced
-- this same view for the same kind of reason and is the precedent.

create or replace view menu_card as
select m.id,
       m.slug,
       m.name,
       m.dishes,
       m.season,
       m.season_note,
       m.season_strict,
       m.cooking,
       m.cooking_note,
       m.status,
       m.created_at,
       m.updated_at,
       coalesce(w.worlds, '{}') as world_slugs,
       coalesce(o.occasions, '{}') as native_occasions,
       coalesce(t.tags, '{}') as tags,
       m.retirement_note
  from menu m
  left join lateral (
    select array_agg(wd.slug::text order by wd.slug) as worlds
      from menu_world mw
      join world wd on wd.id = mw.world_id
     where mw.menu_id = m.id and not mw.forbidden
  ) w on true
  left join lateral (
    select array_agg(mo.occasion::text order by mo.occasion) as occasions
      from menu_occasion mo
     where mo.menu_id = m.id and mo.fit = 'native'
  ) o on true
  left join lateral (
    select array_agg(f.label order by f.label) as tags
      from menu_facet mf
      join facet f on f.id = mf.facet_id
     where mf.menu_id = m.id
       and f.dimension_code not in ('season', 'cooking', 'making')
  ) t on true;

-- ─────────────────────────────────────────────────────────────────────
-- VI · THE SEEDER READS THE REGISTRY — OR THIS FILE UNDOES ITSELF
-- ─────────────────────────────────────────────────────────────────────
--
-- The most important paragraph here, and it is not about SQL.
--
-- `scripts/seed-menus.mjs` creates a menu that does not exist LIVE, because
-- db/036 and rule 13 made pool content stock itself. It leaves EXISTING rows
-- alone — `--overwrite` rewrites the words and writes no status at all — so on
-- the live database this retirement holds and no seeder can reverse it. That
-- was checked against the file rather than assumed, and against the two other
-- automated paths: `publish()` moves only `draft` rows, `revert()` at
-- /desk/stocked moves only `active` ones, so neither can touch a discontinued
-- menu either.
--
-- BUT A FRESH DATABASE HAS NO EXISTING ROWS. `preDeployCommand` is
-- `migrate && seed:destinations && seed:menus && …`, so this file runs against
-- an empty table and `seed-menus` then CREATES all thirty-nine, live, seconds
-- later. Retirement by UPDATE alone is retirement that lasts until the next
-- rebuild — the exact failure shape this week is named for, and the reason the
-- verification for this file re-runs the seeder instead of trusting the counts.
--
-- So the decision is recorded where the seeder can see it. `seed-menus` now
-- asks `ingredient_pool` whether its pool is retired and, if it is, creates the
-- row `discontinued` carrying the pool's own note. It hard-codes nothing:
-- clear `retired_at` and the next run stocks live again, which is what keeps
-- restoring the set menu a decision rather than a rewrite.
--
-- Rule 22's line, put the other way round: MIGRATIONS OWN SCHEMA, SEEDERS OWN
-- CONTENT. The pool's retirement is schema-shaped and belongs here. The status
-- of a row that does not exist yet is content-shaped and belongs to the seeder.
-- Trying to own both from this file is what would fail silently, on every
-- build, forever.

-- ── what actually happened, said out loud ────────────────────────────
--
-- The deploy log is the only place this run is ever seen (rule 9), and a
-- migration that moves authored content and prints nothing is a migration
-- nobody can check.

do $$
declare
  v_offered int;
  v_out     int;
  v_reasoned int;
  v_slots   int;
  v_into    text;
begin
  select count(*) filter (where status = 'active'),
         count(*) filter (where status = 'discontinued'),
         count(*) filter (where retirement_note is not null)
    into v_offered, v_out, v_reasoned
    from menu;

  select count(*) into v_slots from occasion_slot where slot_code = 'the_menu';

  select superseded_by into v_into
    from ingredient_pool where entity_table = 'menu';

  if v_offered > 0 then
    raise exception '[045] % menu(s) are still offered after this file ran. '
      'The backfill did not do what it claims and the constraints should have '
      'refused it — something is wrong with this file.', v_offered;
  end if;

  if v_out <> v_reasoned then
    raise exception '[045] % menus are out and only % carry a reason. Rule 17 '
      'is not satisfied and menu_discontinued_has_reason should have refused '
      'the write.', v_out, v_reasoned;
  end if;

  raise notice '[045] the menu pool is retired: % offered, % out, all with a '
    'reason. superseded_by = %. slot_kind.the_menu is KEPT and occasion_slot '
    'holds % row(s) for it — restoring the set menu is un-retiring rows plus '
    're-inserting db/012''s nine.', v_offered, v_out, coalesce(v_into, '(none)'),
    v_slots;
end $$;

-- ─────────────────────────────────────────────────────────────────────
-- WHAT THIS DELIBERATELY DOES NOT DO
--
--   · NO DELETE. Not one row of `menu`, `menu_world`, `menu_facet`,
--     `menu_occasion`, `menu_slot` or `revelle_menu`. A menu somebody was
--     actually issued stays issued and stays true — `revelle_menu` is ON DELETE
--     RESTRICT for that reason and it is the same argument db/028 made about a
--     retired destination.
--   · NO DEREGISTRATION. The `ingredient_pool` row stays, the entry in
--     `src/lib/selection/catalogue.ts` stays, and db/022 already argued why:
--     "a pool the engine cannot see reports a phantom gap forever". A retired
--     pool the engine can see returns zero candidates; an absent one returns a
--     mystery.
--   · `slot_kind.the_menu` IS NOT TOUCHED. db/022 kept it so that already-issued
--     `revelle_menu` rows still name a slot that exists and so that re-enabling
--     is nine inserts. Both reasons survive this file unchanged.
--   · NO SEEDER DELETED. `seed:menus` stays in `preDeployCommand` and stays
--     correct: it keeps docs/menus.md and the database in agreement, which is
--     what makes the pool restorable at all. Removing it would be quietly
--     deciding the second gesture above can never be taken.
--   · NOTHING SAID ABOUT `the_drinks`, `dish`, or db/022's three courses. They
--     are untouched and their counts are unchanged; the verification for this
--     file checks that rather than assuming it.
--   · NO OPINION ON THE TWO REJECTED ALTERNATIVES. Repurposing the menus as
--     authoring templates and restoring a slot for signature occasions are both
--     still open, both still cheap, and both are recorded in
--     docs/needs-a-human.md. Retirement does not close them; it stops the pool
--     pretending to be stock while they are undecided.
-- ─────────────────────────────────────────────────────────────────────
