-- ── 044 · THE EVENING SUPPLIES IT ────────────────────────────────────
--
-- db/043 gave the bank a take-home slot and 152 proposals were staged against
-- it. Twenty could not be described by the vocabulary the schema had, and the
-- founder, ruling on all twenty at once, named the thing they have in common:
--
--   "These are the take-homes that can't be faked: nothing printed in advance,
--    pure residue of the night actually happening. Your rock, industrialized.
--    Admit it."
--
-- THE EVENING SUPPLIES IT is a third category beside stocked goods and
-- owned-if-present props, and she ruled that it behaves unlike either in two
-- structural ways this file has to build in.
--
-- ─────────────────────────────────────────────────────────────────────
-- RULING 1(a) · IT HAS DEPENDENCIES, NOT STOCK
--
--   "A cork exists because the drink program pours bottles; the shell exists
--    because the menu serves the bucket. So a category-3 row needs a
--    `depends_on` pointing at the supplying row. Otherwise a curator swaps
--    Positano's drink program to cocktails next spring and the cork take-home
--    silently dies — the exact quiet-lie shape as everything else this week.
--    The gap reporter should fire when a dependency breaks, which also means
--    take-home coverage for these rooms is DERIVED coverage, and the board
--    should render it as such (covered-via-X, not covered)."
--
-- Then, on being shown what a package actually references, she corrected the
-- shape of the pointer herself, and the correction is the whole design:
--
--   "The dependency for dish-supplied items can't be a static row FK. The cork
--    depends on the drink SLOT — checkable, because `the_drinks` is always
--    filled. But the shell depends on whichever dish filled `the_main` in this
--    package, and that's decided per-package at composition time. A static
--    `depends_on -> revelle_dish.lobster_bucket` is only satisfied when
--    selection happens to draw that dish — which means for these items,
--    take-home availability is CONTINGENT PER PACKAGE, not a fact about the
--    room. That's not a flaw, it's the design: the shell is a take-home because
--    the bucket was served. But it has to be built as slot-level dependency
--    with a predicate ('the_main delivered a dish carrying `yields_shell`' or a
--    supplies tag), resolved at composition time — and the coverage board can
--    only honestly render these as CONDITIONAL coverage. A static dish-row FK
--    would produce exactly what you predicted: a check that looks right and
--    fires on the wrong thing — red when the room is fine, green for a package
--    that drew the ceviche."
--
-- Both halves are preserved under CLAUDE.md rule 14 because the first is the
-- one a later reader will reach for. THE ROW REFERENCE IS THE LOSING CANDIDATE
-- AND HERE IS ITS EPITAPH, verified against a database built by the committed
-- deploy chain rather than reasoned about:
--
--   · `occasion_slot` has ZERO rows whose pool is `menu`. db/022 replaced the
--     set menu with a composed table drawing from `dish`, said in its own words
--     that "the engine no longer has a slot to put a menu in", and set the
--     menu pool's `typical_draw` to 0. A dependency written against a menu row
--     is unsatisfiable forever, and nothing would have said so.
--   · A dependency written against ONE dish row is satisfied only when
--     selection happens to draw that dish. Nantucket serves the bucket in some
--     packages and the fog-day chowder in others. The same row would be a lie
--     in both directions on successive Tuesdays.
--
-- SO A DEPENDENCY IS A SLOT PLUS A PREDICATE. The slot is watched; the
-- predicate is asked of whatever filled it. `bank_item_dependency` below is
-- (item, slot_code, supplies) and nothing else.
--
-- THE PREDICATE IS A TAG ON THE SUPPLYING ROW, not a phrase matched against
-- its description, and that is rule 3 rather than convenience: "this dish
-- yields a shell" is a positive claim somebody makes, and inferring it from the
-- word "clams" appearing in a sentence is precisely the retro-tagging failure
-- this project exists to escape. `supplies_tag` is the vocabulary and
-- `ingredient_supplies` is where a row carries one.
--
-- UNCONDITIONAL VERSUS CONDITIONAL IS DERIVED, NEVER AUTHORED. The founder
-- asked that the two be distinguishable in the data, and the temptation is a
-- `strength` column on the dependency row. It would be wrong within a season:
-- whether a dependency is unconditional is a fact about WHAT ELSE IS IN THE
-- POOL FOR THAT ROOM, and the pool changes under it. Read off the catalogue:
--
--   BROKEN         nothing that can fill the watched slot in this room carries
--                  the tag. Take-home coverage here is a lie and the gap
--                  reporter fires.
--   UNCONDITIONAL  everything that can fill it carries the tag. The room is
--                  covered VIA the watched slot, and the board says via what.
--   CONDITIONAL    some do. Coverage is decided at composition, per package,
--                  and the board may not render it as covered.
--
-- The same three states fall out for free when a curator swaps a room's drink
-- programme to cocktails: the tag goes with the old rows and the derivation
-- moves from unconditional to broken with nobody having to remember this file
-- exists. That is what "the gap reporter should fire when a dependency breaks"
-- has to mean if it is to survive a spring.
--
-- ─────────────────────────────────────────────────────────────────────
-- RULING 1(b) · TWO QUANTITY SEMANTICS, NEVER CONFLATED
--
--   "Corks, bands, labels scale with the dinner — roughly per-guest, with
--    Acapulco's caveat that the ratio is per-bottle, not per-head. The
--    one-of-ones — the trophy, the IOU, the doubling cube, the signed napkin —
--    go to ONE guest. That's not a defect; a prize is a legitimate take-home
--    shape, arguably a great one. But it's a different promise, and selection
--    and the board need the distinction (`per_guest` vs `single_artifact`) so
--    nobody reports a room as having per-guest take-home coverage on the
--    strength of one trophy."
--
-- WHERE IT LIVES, and the alternative that lost. The obvious home is the
-- CLAIM — `bank_item_slot`, the row that says this item can be the take-home —
-- because the broadsheet is one printed article as a table covering and eighty
-- take-homes as a take-home, and quantity plainly differs by which reading you
-- are in. It is not the home chosen, for two reasons. First, `bank_item_slot`
-- is created by `install_slot_eligibility`, the generic installer every pool
-- shares; a column on `bank_item`'s copy alone rebuilds the "this pool is
-- special" bug class db/043 spent a migration removing. Second, the question
-- "how many guests get one" is only ever ASKED of a take-home, so a column on
-- the item that is read only for `the_take_home` is not ambiguous — the
-- broadsheet is `per_guest`, its table-set reading never consults the column,
-- and nothing has to choose.
--
-- NULL MEANS NO PROMISE, which is db/043's own reading of an absent facet tag —
-- "an absent tag is not a default-only grade, it is no claim" — and it is not a
-- DEFAULT-ONLY instrument under rule 15 for exactly that reason. A take-home
-- claim from a row whose quantity is null MAY NOT BE COUNTED as per-guest
-- coverage, and the board must show the unstated ones rather than fold them
-- into a total: rule 16, at the point where the person is standing.
--
-- ─────────────────────────────────────────────────────────────────────
-- RULING 3 · THE BROADSHEET IS A NAMED BOUNDARY CASE
--
--   "The printed-article prohibition, correctly read, bars items that would
--    need their own NEW printed stock, and the broadsheet never needed any.
--    Don't rewrite the rule to accommodate it; record it in the rule's notes as
--    the test case that defines the boundary. Rules warped around their edge
--    cases get leaky; rules with a named boundary case stay sharp."
--
-- So there is NO SCHEMA HERE FOR IT. The Nantucket broadsheet stays a stocked
-- row that gains a second claim on `bank_item_slot`, which db/043 already
-- permits, and the boundary case is written into the comment on the
-- take-home slot below so that the next person to read the rule reads the case
-- with it. A migration that had softened the prohibition would have been the
-- leak she is describing.
--
-- ─────────────────────────────────────────────────────────────────────
-- WHAT THIS FILE DELIBERATELY DOES NOT DO — read before adding to it
--
--   · NO COVERAGE VIEW. The three states above need `worldEligibility` and
--     `slotEligibility`, which live in src/lib/selection/occasion.ts and are
--     wrapped by src/lib/selection/slot-coverage.ts as the ONE authority both
--     the gap reporter and the coverage board call (rule 21). A SQL view
--     restating them would be the second authority that rule exists to
--     prevent, and it could only ever answer the room-level half — the
--     composition-time half is about a package that does not exist yet. A
--     partial unification that looks unified is worse than two honest paths.
--     What this file ships instead is `bank_item_supply_integrity`, which asks
--     a DIFFERENT question with no eligibility in it: does this row's
--     dependency point at a predicate anything in the catalogue carries.
--
--   · NO CONTENT-MATCHING INSERTS, and this one cost a real finding to settle.
--     The first draft tagged four drink rows `yields_cork` by matching the word
--     "champagne" in their own authored text, the way db/020 tagged
--     requirements and db/033 moved venues. Checked against a database built
--     by the committed chain, `ingredient_requirement` is EMPTY — because
--     `preDeployCommand` runs `npm run migrate` BEFORE every seeder, so
--     db/020's inserts matched a `drink` table with nothing in it, and
--     `venueEligibility()` prunes nothing on any database ever built that way.
--     Rule 20's sentence, exactly: a report generated from something other than
--     reality is the most convincing failure this system produces. So
--     `ingredient_supplies` is created EMPTY here and the tagging is named
--     below as work with a home that runs AFTER content exists.
--
--   · NO TRIGGER, NO SQL CLASSIFIER. db/043 needed both because it had 180
--     existing rows to backfill AND every later insert to classify, and one
--     rule with two callers beat two implementations. Here there is nothing to
--     backfill: every one of the 332 rows in the bank today is stocked, which
--     is not an assumption but the bank document's own routing rule — "THE BANK
--     holds only: GOODS (purchasable/placeable objects), HOST ACTS, GAMES and
--     printed cards". So `supply` has exactly ONE writer, scripts/seed-bank.mjs,
--     and there is no second implementation for it to disagree with.
--
--   · NO GENERALISATION TO THE OTHER POOLS. `bank_item_dependency` hangs off
--     `bank_item` and not off an installer. A dish that needed a slot-level
--     dependency would be a real argument someone makes on its own day, against
--     this line; the shape it would take is the installer pattern db/002 sets
--     out, and inventing it now for one pool would be the premature abstraction
--     rule 21 warns is its own disease.
--
-- ─────────────────────────────────────────────────────────────────────
-- CONTENTS
--
--   the two enums          how the object arrives, and who gets one
--   three columns          on bank_item, and what `ships` now means
--   supplies_tag           the predicate vocabulary
--   ingredient_supplies    who carries a predicate — polymorphic, EMPTY
--   bank_item_dependency   (item, watched slot, predicate)
--   the integrity view     a data question, not a coverage question
--   the boundary case      recorded in the take-home slot's own description
-- ─────────────────────────────────────────────────────────────────────


-- ── the two enums ────────────────────────────────────────────────────

create type bank_supply as enum ('stocked', 'evening_supplied');

comment on type bank_supply is
  'Where the object comes from. `stocked` is everything the bank held before '
  'db/044 — a line on an order, or a thing the house has. `evening_supplied` '
  'is the founder''s third category: nothing printed in advance, pure residue '
  'of the night actually happening. An evening-supplied row has DEPENDENCIES '
  'rather than stock; see bank_item_dependency.';

create type take_home_quantity as enum ('per_guest', 'single_artifact');

comment on type take_home_quantity is
  'How many guests leave with one. `per_guest` scales with the dinner. '
  '`single_artifact` goes to ONE guest — the trophy, the IOU, the doubling '
  'cube — which is a legitimate take-home shape and a DIFFERENT PROMISE. '
  'Nothing may report a room as having per-guest take-home coverage on the '
  'strength of one prize. NULL is neither: this row makes no promise about '
  'how many guests get one, and null may never be counted as per-guest.';


-- ── three columns on bank_item ───────────────────────────────────────
--
-- `supply` defaults to `stocked` and every existing row takes it. That is a
-- real claim about all 332 rows rather than a placeholder, on the bank
-- document's own routing rule, and it is why this file needs no backfill and
-- no classifier.

alter table bank_item
  add column supply bank_supply not null default 'stocked',
  add column take_home_quantity take_home_quantity,
  add column supply_note text not null default '';

-- WHY `supply_note` IS REQUIRED OF AN EVENING-SUPPLIED ROW, and it is rule 16
-- rather than tidiness. Some of the twenty are supplied by a slot the package
-- fills — the cork by the drinks, the shell by the main. Four are supplied by
-- the NIGHT: a rose hip off the lane, a stone out of the creek, a paper napkin
-- that goes round, a strip of masking tape out of the host's own drawer. Those
-- have no slot to watch and correctly carry ZERO dependency rows.
--
-- Which means "evening-supplied with no dependency" has two meanings — decided,
-- or not yet written — and a state with two meanings and no way to tell them
-- apart is the silent kind of wrong. The words are compulsory, so an
-- evening-supplied row with no dependency always says in a column why it has
-- none, and "nobody has got to it yet" is not a state this table can hold.
alter table bank_item
  add constraint bank_item_evening_supplied_says_how
  check (supply <> 'evening_supplied' or btrim(supply_note) <> '');

-- AND IT SHIPS NOTHING, refused by the database rather than corrected by it.
-- `ships` already means "a line appears on the order"; db/031 gave it one
-- reason to be false (owned-if-present) and this adds a second. A trigger that
-- forced `ships` to false would silently overwrite a value the seeder wrote,
-- which is the shape rule 16 forbids; a CHECK that REFUSES the insert is the
-- form that rule blesses, and it makes the content declare the same fact twice
-- and the database refuse if the two ever disagree.
alter table bank_item
  add constraint bank_item_evening_supplied_ships_nothing
  check (supply <> 'evening_supplied' or ships = false);

comment on column bank_item.ships is
  'FALSE means no line on the order, and since db/044 there are TWO reasons '
  'for that: owned-if-present (the house has one, or the line is not written) '
  'and evening-supplied (the night produces it). `supply` says which. TRUE '
  'means the house ships it.';

comment on column bank_item.supply is
  'Where the object comes from. Written only by scripts/seed-bank.mjs, from '
  'the THE EVENING SUPPLIES IT marker the content carries — one writer, so '
  'there is no second implementation to drift from. db/044.';

comment on column bank_item.take_home_quantity is
  'How many guests leave with one, read ONLY for a the_take_home claim. Null '
  'is no promise and may never be counted as per-guest coverage. db/044.';

comment on column bank_item.supply_note is
  'Why the night supplies this, in words. Compulsory on an evening-supplied '
  'row because zero dependencies is otherwise ambiguous between "supplied by '
  'the night itself, decided" and "nobody has written the dependency yet". '
  'db/044.';


-- ── supplies_tag · the predicate vocabulary ──────────────────────────
--
-- The sibling of `structural_requirement` (db/020) and deliberately the same
-- shape: a short table of codes with their definitions, referenced by a
-- polymorphic tagging table, so that a typo is a foreign-key violation rather
-- than a tag nothing ever matches.
--
-- The difference between the two is worth one sentence, because they will be
-- confused: a REQUIREMENT is what an ingredient needs OF THE ROOM she is
-- standing in, and it prunes. A SUPPLIES TAG is what an ingredient LEAVES
-- BEHIND, and it satisfies somebody else's dependency. One looks outward at the
-- venue, the other looks sideways at another slot.
--
-- Every code below is named by one of the twenty held items in its own words.
-- None is invented for symmetry and there is no code here that nothing asks
-- for. When the twenty are ruled on, codes belonging to killed items are
-- deleted rather than left standing.

create table supplies_tag (
  code        text primary key check (code ~ '^[a-z][a-z0-9_]*$'),
  label       text not null,
  description text not null default '',
  created_at  timestamptz not null default now()
);

comment on table supplies_tag is
  'What an ingredient LEAVES BEHIND that another row can be built out of. The '
  'predicate half of bank_item_dependency: a dependency asks "did whatever '
  'filled this slot carry this tag", never "was this exact row drawn". Sibling '
  'of structural_requirement (db/020), which asks the opposite question — what '
  'an ingredient needs OF THE ROOM. db/044.';

insert into supplies_tag (code, label, description) values
  ('yields_cork', 'A cork',
   'This programme opens bottles that are corked. Named by four of the twenty '
   'at once — Acapulco''s loud cork, the Cote d''Azur cork with the hour on '
   'it, New York''s dated cork, and Aspen''s bottle cap, which is the same '
   'shape in a cheaper material.'),

  ('yields_muselet', 'A wire cage',
   'Sparkling wine specifically: the muselet exists only where the bottle is '
   'under pressure. Distinct from yields_cork because a still rose has a cork '
   'and no cage, which is exactly the difference between Cote d''Azur''s cork '
   'and St. Moritz''s bent chair.'),

  ('yields_label', 'A soakable label',
   'Bottles that accumulate on the table and whose labels come off in a basin '
   'of water. Cote d''Azur''s rose labels, handed round wet.'),

  ('yields_bottle_cap', 'A crown cap',
   'Bottles opened with an opener rather than a corkscrew. Aspen''s afternoon '
   'beer.'),

  ('yields_shell', 'A shell',
   'The dinner arrives in its own shell and the shells go in a bucket. '
   'Nantucket''s quahogs and clams. DELIBERATELY NOT INFERRED from the word '
   '"clams" in a dish description — see the note above ingredient_supplies.'),

  ('yields_claw_band', 'A claw band',
   'Whole lobster, banded. The rubber band worn on a wrist for the rest of the '
   'night is the byproduct.'),

  ('yields_empty_container', 'An emptied container worth keeping',
   'The small perfect object the thing came in: St. Moritz''s caviar tin with '
   'its rubber band, Aspen''s 35mm film canister. One tag because the two are '
   'the same shape; they differ only in which slot supplies them.'),

  ('yields_prize', 'One winner''s object',
   'A game that ends with somebody having won and something changing hands. '
   'St. Moritz''s spare doubling cube, Aspen''s ridiculous trophy. Its '
   'take-homes are single_artifact by construction.'),

  ('yields_score_sheet', 'A score kept on paper',
   'A game scored in pencil across an evening, so that paper with numbers on '
   'it exists at the end. St. Moritz''s backgammon column, Oaxaca''s Conquian '
   'tally.'),

  ('yields_iou', 'A written stake',
   'A game whose arrangement is a debt somebody writes down. The Vegas late '
   'supper. Separate from yields_score_sheet because a score is a record and a '
   'stake is an obligation, and the object a guest keeps is the second.');


-- ── ingredient_supplies · who carries a predicate ────────────────────
--
-- POLYMORPHIC ON (entity_table, entity_id), the vocabulary db/011's
-- staff_action and db/020's ingredient_requirement already speak, and for
-- db/020's own stated reason: this is a property of a THING, and seven
-- near-identical tables would be seven places to forget one.
--
-- ONE DEPARTURE FROM db/020, and it is a repair rather than a preference.
-- `ingredient_requirement` polices its pool column with a hand-written CHECK
-- listing five names. That list DRIFTED — three pools were registered after it
-- and db/033 had to repair it, which is CLAUDE.md rule 19's own worked example.
-- `ingredient_pool.entity_table` is a primary key, so a real foreign key is
-- available and a hand-written list is not needed: the registry is the only
-- truth, enforced by the database rather than by whoever remembers.
--
-- `world` is excluded by name — the one hand-written exception, because a CHECK
-- cannot join to read `join_table is null`. It is the same single name db/002's
-- rebuild_revelle_ingredient_view() spells in its own fixed branch, and for the
-- same reason: a destination is the frame an evening is drawn in, not a thing
-- drawn into it, so it supplies nothing to a slot.
--
-- NO FOREIGN KEY ON `entity_id`, exactly as db/011 and db/020 have none. A
-- dangling pointer is not silent here: it is the first thing
-- `bank_item_supply_integrity` below reports.
--
-- CREATED EMPTY, and that is the finding recorded at the top of this file
-- rather than an omission. Tagging belongs in the pool's own seeder, which runs
-- AFTER the content exists; a migration cannot do it because migrations run
-- first. Until a row carries a tag, every dependency naming that tag reports
-- BROKEN, and that is correct and loud — the twenty rows it concerns are drafts
-- carrying a founder-pending question, so nothing reaches a member on an
-- untagged catalogue.

create table ingredient_supplies (
  entity_table text not null references ingredient_pool(entity_table)
                    on delete restrict,
  entity_id    uuid not null,
  supplies     text not null references supplies_tag(code) on delete restrict,
  note         text not null default '',
  created_at   timestamptz not null default now(),

  primary key (entity_table, entity_id, supplies),

  constraint ingredient_supplies_not_the_frame
    check (entity_table <> 'world')
);

create index ingredient_supplies_by_tag on ingredient_supplies (supplies);

comment on table ingredient_supplies is
  'Which rows leave a given thing behind. Read by the dependency resolution in '
  'src/lib/selection/slot-coverage.ts, never by a phrase match against a '
  'description: "this dish yields a shell" is a positive claim somebody makes '
  '(CLAUDE.md rule 3). Untagged means NO CLAIM, which is why an untagged '
  'catalogue reports dependencies as broken rather than as satisfied. db/044.';


-- ── bank_item_dependency · a slot, and a predicate over its filler ───
--
-- (item, watched slot, predicate). No pool column: `occasion_slot.pool` already
-- says which pool fills a slot and one slot has exactly one pool, so a pool
-- here would be a second opinion kept current by hand — rule 21.
--
-- Many rows per item, and that is the same widening db/043 made one layer down
-- when it replaced `bank_item.world_id` with a join table. A cork is supplied
-- by the drinks in whichever room it is native to; an item NATIVE TO TWO ROOMS
-- — one row, two `bank_item_world` claims, which is what an `Also at:` line in
-- docs/atmosphere-idea-bank-v1.md writes — is supplied by a different slot's
-- filler in each of them. A single FK would have had to choose one and been
-- wrong in the other, which is the claim the visible duplication proves the
-- authors do not believe.
--
-- THE EXAMPLE THAT WAS HERE, kept per CLAUDE.md rule 14 because the correction
-- is worth more than the sentence: "the wire cage is native to St. Moritz and
-- affinity to Acapulco and its supplier differs by room." That scenario cannot
-- occur, and the paragraph's argument never depended on it.
--
--   affinity re-weights scoring for already-eligible candidates; it never
--   confers eligibility — sharing requires a second native row.
--
-- `claimEligibility` (src/lib/selection/occasion.ts) reads a `native` row as a
-- WHITELIST: any native row makes an item eligible for its native rooms and no
-- others. A row that is neither native nor forbidden IS NOT A CLAIM; its
-- `affinity` is the additive term stage 4 scores with, and an item is never
-- scored in a room it is not eligible in. So an item native to St. Moritz and
-- merely weighted at Acapulco is never placed at Acapulco at all, and has no
-- supplier there to differ. The widening this table needs is REAL — it just
-- comes from a second NATIVE claim, not from an affinity weight.
--
-- ALL of an item's dependencies must be satisfied. This is an AND, not an OR:
-- a row that names two predicates needs both, because it named both.

create table bank_item_dependency (
  bank_item_id uuid not null references bank_item(id) on delete cascade,

  -- WHAT IS WATCHED. A real FK, so a typo in a content marker is a failed
  -- insert with the slot name in the message rather than a dependency that
  -- watches nothing.
  slot_code    text not null references slot_kind(code) on delete restrict,

  -- WHAT IS ASKED OF WHATEVER FILLED IT.
  supplies     text not null references supplies_tag(code) on delete restrict,

  note         text not null default '',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  primary key (bank_item_id, slot_code, supplies)
);

create index bank_item_dependency_by_slot
  on bank_item_dependency (slot_code, supplies);

create trigger bank_item_dependency_touch before update on bank_item_dependency
  for each row execute function set_updated_at();

comment on table bank_item_dependency is
  'What the evening has to do for this item to exist. A SLOT plus a PREDICATE '
  'over whatever filled it — never a row reference, because what fills '
  'the_main is decided per package at composition time and a static dish FK '
  'would be red when the room is fine and green for a package that drew '
  'something else. Zero rows on an evening-supplied item means the NIGHT '
  'supplies it rather than a slot, and bank_item.supply_note says so in words. '
  'db/044.';

comment on column bank_item_dependency.slot_code is
  'The slot watched. Which pool fills it comes from occasion_slot, never from '
  'a column here — one slot has exactly one pool and a second copy of that '
  'fact would drift (rule 21).';

comment on column bank_item_dependency.supplies is
  'Asked of whatever filled the slot in THIS package: did it carry this tag. '
  'Not "was this exact row drawn". An item with two dependency rows needs '
  'BOTH satisfied.';


-- ── the integrity view · a data question, not a coverage question ────
--
-- Named so that nobody mistakes it for the coverage answer. It contains no
-- destination, no occasion and no eligibility, and it therefore cannot drift
-- from src/lib/selection/slot-coverage.ts, which owns those. What it answers is
-- whether the DATA is answerable at all:
--
--   unwatched         evening-supplied, no dependency. Legitimate — the night
--                     supplies it — and `supply_note` says why. Listed so a
--                     curator can see how many there are.
--   nothing_supplies  the dependency names a predicate NO row in the catalogue
--                     carries. Today that is every dependency, because
--                     ingredient_supplies is empty by design; it is the tagging
--                     work order and it is meant to be visible.
--   contradiction     a stocked row carrying a dependency, or an evening-
--                     supplied row that also claims to ship. The second cannot
--                     happen (there is a CHECK); the first can, if a curator
--                     moves an item back to stocked, and it is reported rather
--                     than refused so that the move is not blocked by a row she
--                     is about to delete.
--   ok                the predicate is carried by at least one row somewhere.
--                     Whether it is carried by a row THIS ROOM can draw is the
--                     coverage question and is answered in TypeScript.

create view bank_item_supply_integrity as
select b.id                as bank_item_id,
       b.slug,
       b.name,
       b.status::text      as status,
       b.supply::text      as supply,
       b.take_home_quantity::text as take_home_quantity,
       b.supply_note,
       d.slot_code,
       d.supplies,
       case
         when b.supply = 'stocked' and d.slot_code is not null then 'contradiction'
         when b.supply = 'evening_supplied' and d.slot_code is null then 'unwatched'
         when d.supplies is null then 'ok'
         when not exists (
           select 1 from ingredient_supplies s where s.supplies = d.supplies
         ) then 'nothing_supplies'
         else 'ok'
       end                 as verdict
  from bank_item b
  left join bank_item_dependency d on d.bank_item_id = b.id
 where b.supply = 'evening_supplied'
    or d.slot_code is not null;

comment on view bank_item_supply_integrity is
  'Is this row''s supply story ANSWERABLE — one line per dependency, plus one '
  'for every evening-supplied row that has none. Deliberately not a coverage '
  'view: it holds no destination and no eligibility, so it cannot become a '
  'second opinion about what "covered" means. Coverage is '
  'src/lib/selection/slot-coverage.ts and nowhere else. db/044.';


-- ── THE REPAIR NOBODY ASKED FOR, AND WHY IT IS HERE ──────────────────
--
-- Found while proving the above against a database built by the committed
-- deploy chain, and it is the largest thing this file does.
--
--   152 bank rows carry the words "take-home" in their own text — every
--   take-home proposal db/043's week staged. NINE of them are claimed by the
--   take-home slot. The other 143 are in `the_atmosphere`, `the_table_set` and
--   `the_light`.
--
-- The cause is eleven characters. `bank_item_default_slot()` spells its first
-- phrase `'take home'`, with a space; the document spells it `take-home`, with
-- a hyphen, in all 152 clauses. `position('take home' in 'take-home')` is 0, so
-- the branch never fired and every one of them fell through to the general
-- bucket, which db/043 built to be load-bearing and which duly bore them.
--
-- IT IS EXACTLY THE FAILURE db/043 WROTE THE SLOT TO PREVENT. Its own words:
-- "Named rather than folded into the general bucket because the gap reporter is
-- per-slot: 'this room has a dressed table and nothing to take home' is only
-- sayable if the take-home has a name." The name existed and 143 of 152 rows
-- were folded into the general bucket anyway — and nothing was wrong, nothing
-- threw, and the coverage board would have shown eighteen rooms with no
-- take-home while the pool held a hundred and fifty of them. Rule 16's test,
-- verbatim: if this stopped working, how would anyone find out.
--
-- WHAT IS REPAIRED, AND WHAT IS DELIBERATELY LEFT
--
-- The function's vocabulary is corrected, so every row inserted after today
-- classifies correctly. That is the part that must happen; without it the
-- twenty rows this file exists for would land in the general bucket too and the
-- whole model would be decorative.
--
-- The existing claims are moved ONLY where the claim is still the machine's
-- own — identified by the note `bank_item_default_slot()` writes, which db/043
-- authored and which no desk edit reproduces. The founder ruled that
-- reclassification is a curator's UPDATE, so a claim a curator has written is
-- not touched by this file at any cost, and the WHERE clause is how that ruling
-- is honoured rather than a sentence promising it.
--
-- SECOND CLAIMS ARE NOT AUTHORED HERE. Thirty of the 152 say in their own text
-- that they are "take-home and table set" or "take-home and atmosphere" — the
-- founder's rock among them. db/043 is explicit that the machine's single
-- default is A FLOOR, NOT A CEILING and that a second claim is "authoring,
-- added deliberately, one item at a time, with a reason". Thirty of them at
-- once, by a migration, is neither deliberate nor one at a time. They keep the
-- take-home claim their destiny earns them under db/043's own precedence, and
-- the second claim is DESK WORK with a query that finds it:
--
--   select b.slug, b.description
--     from bank_item b
--    where lower(b.description) like '%take-home and %'
--      and not exists (select 1 from bank_item_slot s
--                       where s.bank_item_id = b.id and s.slot_code <> 'the_take_home');

create or replace function bank_item_default_slot(
  p_kind        bank_kind,
  p_name        text,
  p_description text
) returns text
language plpgsql immutable as $$
declare
  v_text text := lower(coalesce(p_name, '') || ' ' || coalesce(p_description, ''));
  v_phrase text;
begin
  -- 1 · THE THING THEY TAKE HOME. Destiny beats surface.
  --
  -- THE HYPHENATED FORMS ARE db/044'S REPAIR and they are first in the list
  -- because they are what the document actually writes: every one of the 152
  -- take-home clauses reads "— take-home,". db/043 spelled only the spaced
  -- form and matched nine rows out of a hundred and fifty-two.
  foreach v_phrase in array array[
    'take-home', 'takes-home', 'take-homes',
    'take home', 'takes home', 'taken home', 'to take home', 'go home',
    'goes home', 'send home', 'sent home', 'favor', 'favour', 'keepsake',
    'matchbook', 'lives on her shelf after', 'parting gift'
  ] loop
    if position(v_phrase in v_text) > 0 then return 'the_take_home'; end if;
  end loop;

  -- 2 · THE LIGHT. The one category an act may also be.
  foreach v_phrase in array array[
    'candle', 'candlelight', 'candlelit', 'votive', 'hurricane', 'taper',
    'lantern', 'lamp', 'sparkler', 'torch', 'luminaria', 'oil light',
    'firelight', 'fireplace', 'bonfire', 'flame', 'lit by'
  ] loop
    if position(v_phrase in v_text) > 0 then return 'the_light'; end if;
  end loop;

  -- 3 · THE TABLE, DRESSED. Objects only — see db/043 on why an act cannot
  -- reach this branch.
  if p_kind in ('good', 'printed_card') then
    foreach v_phrase in array array[
      'place card', 'menu card', 'place setting', 'table setting',
      'at each place', 'at places', 'napkin', 'linen', 'tablecloth',
      'runner', 'trivet', 'centrepiece', 'centerpiece', 'floral', 'flowers',
      'stemware', 'glassware', 'tumbler', 'coupe', 'decanter', 'charger',
      'platter', 'plate', 'bowl', 'seat pad', 'throw over', 'chargers'
    ] loop
      if position(v_phrase in v_text) > 0 then return 'the_table_set'; end if;
    end loop;
  end if;

  -- 4 · GENERAL, and it still pools.
  return 'the_atmosphere';
end;
$$;

-- The move. Two statements, because a row that somehow already holds a
-- take-home claim must lose the stale default rather than collide with it on
-- (bank_item_id, slot_code).

delete from bank_item_slot s
 where s.slot_code <> 'the_take_home'
   and s.note like 'Default claim from bank_item_default_slot()%'
   and bank_item_default_slot(
         (select b.kind from bank_item b where b.id = s.bank_item_id),
         (select b.name from bank_item b where b.id = s.bank_item_id),
         (select b.description from bank_item b where b.id = s.bank_item_id)
       ) = 'the_take_home'
   and exists (select 1 from bank_item_slot t
                where t.bank_item_id = s.bank_item_id
                  and t.slot_code = 'the_take_home');

update bank_item_slot s
   set slot_code = 'the_take_home',
       note = 'Moved to the take-home slot by db/044. db/043''s classifier '
              'spelled "take home" with a space and this row''s clause spells '
              'it "take-home" with a hyphen, so the branch never fired and the '
              'row fell through to the general bucket. Still the machine''s '
              'claim, not a curator''s — move it with an update.'
  from bank_item b
 where b.id = s.bank_item_id
   and s.slot_code <> 'the_take_home'
   and s.note like 'Default claim from bank_item_default_slot()%'
   and bank_item_default_slot(b.kind, b.name, b.description) = 'the_take_home';

do $$
declare
  v_says   bigint;
  v_claims bigint;
  v_stuck  bigint;
  v_dual   bigint;
begin
  select count(*) into v_says
    from bank_item b
   where bank_item_default_slot(b.kind, b.name, b.description) = 'the_take_home';

  select count(*) into v_claims
    from bank_item b
    join bank_item_slot s on s.bank_item_id = b.id
   where s.slot_code = 'the_take_home';

  -- Anything the corrected classifier calls a take-home that is STILL filed
  -- elsewhere under a claim the machine wrote. Must be zero: a claim a curator
  -- wrote carries her note and is excluded above by design, so a survivor here
  -- means the move did not cover its own predicate.
  select count(*) into v_stuck
    from bank_item b
    join bank_item_slot s on s.bank_item_id = b.id
   where s.slot_code <> 'the_take_home'
     and s.note like 'Default claim from bank_item_default_slot()%'
     and bank_item_default_slot(b.kind, b.name, b.description) = 'the_take_home';

  if v_stuck <> 0 then
    raise exception
      '[044] % rows the corrected classifier calls take-homes are still filed '
      'elsewhere under a claim nobody authored. The repair did not cover its '
      'own predicate, which would leave the slot half-populated — worse than '
      'leaving it empty, because half a slot looks like a curated one.',
      v_stuck;
  end if;

  select count(*) into v_dual
    from bank_item b
   where lower(b.description) like '%take-home and %'
     and not exists (select 1 from bank_item_slot s
                      where s.bank_item_id = b.id
                        and s.slot_code <> 'the_take_home');

  raise notice
    '[044] % rows read as take-homes; % take-home claims after the repair. '
    '% of them declare a SECOND claim in their own text and do not have one — '
    'that is desk authoring, deliberately not done here.',
    v_says, v_claims, v_dual;
end;
$$;

comment on function bank_item_default_slot(bank_kind, text, text) is
  'The ONE rule that says which named atmosphere slot a bank item lands in. '
  'Called by db/043''s backfill and by the bank_item_slot_default trigger, so '
  'the migration and every later insert cannot disagree. db/044 added the '
  'HYPHENATED take-home forms, which is what the document actually writes — '
  'without them 143 of 152 take-home proposals sat in the general bucket and '
  'every room read as having nothing to take home. Ambiguous rows get '
  'the_atmosphere and still pool; reclassifying is an update to '
  'bank_item_slot, never a migration.';


-- ── the boundary case, recorded in the rule it bounds ────────────────
--
-- The founder's instruction, applied literally: the prohibition is NOT
-- rewritten and the case is written into its notes. `slot_kind.description` is
-- the take-home rule's home — it is what the desk renders and what db/043
-- authored the slot with — so the boundary case goes there rather than into
-- this file's prose, where only somebody already looking would find it
-- (rule 20's second half).

update slot_kind
   set description = description || E'\n\n'
     || 'WHAT MAY FILL IT — the own-stock ruling, 2026-08-26, with its '
     || 'boundary case. A take-home ships its own per-guest stock; it may not '
     || 'be satisfied by pointing at a row whose stock is a single article. '
     || 'BULK IS THE REFINEMENT: where the existing row''s stock is bulk — '
     || 'lemons at full dose, loose lavender, the beans in the tombola sack, '
     || 'the apology stationery box, sparklers inside the kit — a per-guest '
     || 'draw is absorbed by raising the order, and that IS the take-home '
     || 'shipping its own stock, at a different quantity. A single article '
     || 'cannot do it. The test the refinement has to pass: it saves the '
     || 'Amalfi lemon and still kills the New Orleans rose, whose florals row '
     || 'is one arrangement and not twelve roses. '
     || E'\n\n'
     || 'THE NAMED BOUNDARY CASE IS THE NANTUCKET BROADSHEET, and it is '
     || 'recorded here rather than accommodated in the wording. One '
     || 'reproduction summer-1972 front page dresses the table for eighty and '
     || 'then leaves with all eighty, torn along the folds — a single printed '
     || 'article that is per-guest BY CONSTRUCTION. Read correctly the '
     || 'prohibition bars items that would need their own NEW printed stock, '
     || 'and the broadsheet never needed any. The rule is not widened to let '
     || 'it in: "rules warped around their edge cases get leaky; rules with a '
     || 'named boundary case stay sharp." Anything arguing from the broadsheet '
     || 'must show the same construction, not merely the same conclusion.'
 where code = 'the_take_home';


-- ── what moved, asserted ─────────────────────────────────────────────

do $$
declare
  v_rows   bigint;
  v_stock  bigint;
  v_tags   bigint;
  v_note   text;
begin
  select count(*) into v_rows  from bank_item;
  select count(*) into v_stock from bank_item where supply = 'stocked';

  if v_rows <> v_stock then
    raise exception
      '[044] % bank_item rows, % of them stocked. This file adds a column '
      'with a default and backfills nothing; every existing row must take the '
      'default, because the bank has only ever held purchasable or placeable '
      'objects.', v_rows, v_stock;
  end if;

  select count(*) into v_tags from supplies_tag;
  if v_tags = 0 then
    raise exception
      '[044] the supplies vocabulary is empty. A dependency can only name a '
      'code that exists, so an empty vocabulary means no dependency can ever '
      'be written.';
  end if;

  select description into v_note from slot_kind where code = 'the_take_home';
  if v_note is null or position('NAMED BOUNDARY CASE' in v_note) = 0 then
    raise exception
      '[044] the take-home slot did not take the boundary-case note. The '
      'ruling is that the case is recorded IN THE RULE; a migration that '
      'silently missed it would leave the rule with no boundary and the next '
      'reader would widen the wording instead.';
  end if;

  raise notice
    '[044] % bank_item rows are stocked; % supplies codes registered; '
    'ingredient_supplies is empty on purpose — tagging runs after content '
    'exists, never in a migration.', v_stock, v_tags;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- WHAT HAS TO HAPPEN NEXT, AND WHERE — for the agent that owns the engine
--
-- This file cannot wire itself. Named precisely so the work is a change to
-- known functions rather than a rediscovery:
--
-- 1 · src/lib/selection/catalogue.ts, loadIngredients()
--     `supply`, `take_home_quantity` and `supply_note` join the bank_item
--     spec; `bank_item_dependency` loads as an array on the Ingredient the way
--     `requirements` already does; `ingredient_supplies` loads for EVERY pool
--     exactly as `ingredient_requirement` does at line ~213, keyed
--     `entity_table:entity_id`. Add `supplies: readonly string[]` and
--     `dependencies: readonly {slotCode, supplies}[]` to Ingredient in
--     ./types.ts, both optional, both absent-means-empty, so every hand-built
--     fixture stays valid.
--
-- 2 · src/lib/selection/slot-coverage.ts — THE ONE AUTHORITY, one new export:
--
--       dependencyStatus(item, candidatesForWatchedSlot)
--         -> 'satisfied' | 'unconditional' | 'conditional' | 'broken' | 'unwatched'
--
--     The caller supplies the candidate list for the watched slot because only
--     the caller knows whether it is asking about a ROOM (every eligible row)
--     or a PACKAGE (the one row that was placed). Same function, two questions,
--     no second copy of the rule — which is the containment this file's
--     neighbour already states as an invariant.
--
-- 3 · src/lib/selection/fill.ts — resolution at composition time, and the
--     ordering problem it has to solve. `fillSlots` sorts MOST-CONSTRAINED
--     FIRST (line ~579), NOT by position, so the take-home is not guaranteed to
--     be decided after the drinks or the main. Do not reorder the search to fix
--     it — the lookahead's suffix sums assume that order and every occasion
--     would change behaviour. Validate on the COMPLETED state instead, where
--     `best.picks` is already assembled: for each placed bank_item, ask
--     dependencyStatus against what actually filled the watched slot, and where
--     it comes back `broken`, DROP the pick through the existing `withDrop`
--     path and file a CatalogueGap. Dropping rather than rejecting the state,
--     because the take-home is optional on every occasion db/043 wrote and
--     losing a whole state over an optional slot would cost a package its
--     other picks.
--
-- 4 · src/lib/desk/gaps.ts — `IngestibleGap` gains nothing structurally; the
--     new gaps arrive through `recordCatalogueGaps` like every other, and
--     `gapKey` (pool + slotCode) already dedupes them correctly. What it needs
--     is that the engine's sentence NAMES THE BROKEN DEPENDENCY: "the marked
--     cork needs the drinks to yield a cork, and nothing Acapulco can pour
--     carries it" is actionable; "no take-home" is not.
--
-- 5 · src/lib/desk/coverage.ts — `atmosphereCell` may no longer report a
--     take-home cell as `filled` on the strength of claims it has not resolved:
--
--       · a claim whose item is evening_supplied and whose dependency is
--         UNCONDITIONAL renders as COVERED VIA the watched slot's label, not as
--         covered — the founder's "covered-via-X, not covered";
--       · CONDITIONAL renders as conditional and DOES NOT COUNT toward the
--         cell's filled state, because it is a fact about a package;
--       · BROKEN counts as nothing and reads as the gap it is;
--       · and the cell must split per-guest from single_artifact, so that a
--         room whose only take-home is one trophy cannot read as covered. A
--         null `take_home_quantity` counts as neither and is shown.
--
--     `pool()` at line ~532 is where the three new columns and the dependency
--     rows join the `Scoped` row. Nothing in that file may compute eligibility
--     inline — the note above `atmosphereCell` already says so.
-- ─────────────────────────────────────────────────────────────────────
