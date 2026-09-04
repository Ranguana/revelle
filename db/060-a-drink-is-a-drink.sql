-- Revelle Société — A DRINK IS A DRINK, AND A PROGRAMME WAS AN EVENING
--
-- Applied by scripts/migrate.mjs after 059, inside one transaction together
-- with its schema_migrations ledger row. Same rule as every file before it:
-- nothing here may be a statement that refuses to run in a transaction.
--
-- New file, never applied anywhere, so no SENTINELS entry in
-- scripts/migrate.mjs.
--
-- ─────────────────────────────────────────────────────────────────────
-- THE FOUNDER, TWICE, IN ONE SESSION
--
--   "the drinks were never fixed, still showing as part of a menu"
--   "yes fix drinks"
--
-- `docs/drinks.md` held twenty-five PROGRAMMES. One row bundled a cocktails
-- line, a mocktail line, a meal shape, a season and a supply mode, so the unit
-- of selection was a whole bar and a gin and tonic could not be chosen, only a
-- bar that happened to contain one. `docs/drink-explosion.md` — committed,
-- counted rather than eyeballed — converted the twenty-five into SEVENTY-SIX
-- atomic drinks. This file is the schema half of that conversion.
--
-- THE THREE COUNTS, from the explosion doc and reproduced by the seeder's
-- --dry-run, because rule 24 says count what you matched before reporting it
-- done:
--
--     76 atomic drinks  =  55 paired  +  21 mirrors OWED
--
-- ─────────────────────────────────────────────────────────────────────
-- CONTENTS
--
--   I    drink.retirement_note   rule 17 on a pool row, db/045's shape
--   II   the twenty-five programme rows, retired with their reason
--   III  the mirror: NOT NULL becomes NOT NULL WHILE LIVE, and why that is
--        the same guarantee said at the grain it is actually about
--   IV   drink.mirror_self       the one state in which the two lines agree
--   V    drink_meal              which shapes of table a drink claims
--   VI   occasion_meal           each occasion declares its meal shape(s) once
-- ─────────────────────────────────────────────────────────────────────


-- ─────────────────────────────────────────────────────────────────────
-- I · THE RULING THIS FILE IMPLEMENTS, AND THE TWO IT REVERSES
-- ─────────────────────────────────────────────────────────────────────
--
-- ── THE MEAL-SHAPE RULING, founder, 2026-08-31, filed verbatim at the end of
-- docs/drinks.md. The operative half:
--
--     "drinks gain a meal-shape axis of their own, and occasion scoping
--      derives through it. […] drinks claim what their authors actually wrote
--      (dinner, brunch, late supper, standing drinks), each occasion declares
--      its meal shape(s) once — most already imply it — and occasion→drink
--      eligibility is a join, not an authoring pass."
--
-- ── WHAT IT REVERSES (CLAUDE.md rule 14: keep the argument, name what beat
-- it). db/023, under WHAT THIS DELIBERATELY DOES NOT DO:
--
--     "NO `meal_shape` ON A MENU OR A DRINK. Both already say what they are
--      for in a `name` column, in her own words, and that sentence is richer
--      than any enum — 'A long Sunday afternoon into dinner' is two shapes and
--      a mood. […] A drink programme is a real candidate and could earn one;
--      it is not added here because the founder tagged dishes and not drinks,
--      and a column the catalogue does not fill is a column that will be
--      filled by a guess."
--
-- Every word of that was true of a PROGRAMME. The `name` column held "A summer
-- dinner or cocktail party" and the sentence was richer than the enum. What
-- beat it is that the unit changed: at the atomic grain the `name` column holds
-- "Gin and tonics in tall glasses", and A GIN AND TONIC IS NOT "A SUMMER DINNER
-- OR COCKTAIL PARTY". The sentence did not get poorer; it stopped being a
-- property of the row. db/023's own caveat is honoured rather than overridden:
-- the column is not filled by a guess, it is filled from the twenty-five lines
-- the founder wrote, by db/023's own published foldings (a dressed-up dinner is
-- a long dinner, a beach lunch is a lunch, a midnight breakfast is a late
-- supper), and where she named no shape THE DRINK CLAIMS NONE — six of the
-- seventy-six, from programmes 17 and 25, whose lines are "After a day outside"
-- and "A boat or beach day". Rule 3: absence is flagged, never inferred into a
-- claim.
--
-- ── WHY NOT AN OCCASION FIELD, since `drink_occasion` is the table that is
-- empty. Her ruling answers it and the answer is quoted rather than
-- paraphrased: an occasion field "would mean inventing 76 occasion claims that
-- mostly just restate the meal-shape mapping, a second authority for one fact."
-- `docs/drink-explosion.md` §1 re-derived the evidence by hand: twenty of the
-- twenty-five programme names contain a word a naive parser would scope on and
-- NOT ONE IS AN OCCASION CLAIM — every hit is `dinner`, `supper`, `dinner
-- party`, `boat` or `beach day`, all of them db/023's meal-shape axis.
-- `drink_occasion` therefore stays at zero rows, deliberately, and
-- src/lib/catalogue/tagging.ts keeps counting what a naive parser would have
-- matched so that the refusal stays a measured finding rather than a silence.


-- ─────────────────────────────────────────────────────────────────────
-- II · A RETIRED ROW CARRIES ITS REASON — db/045's column, on `drink`
-- ─────────────────────────────────────────────────────────────────────
--
-- The twenty-five programmes do not survive as selectable rows: a pool holding
-- both a programme and its own three drinks would draw the programme, which is
-- the defect the founder reported. They are RETIRED, not deleted, exactly as
-- db/045 retired the menus and db/042 retired Cap Ferrat — the record and the
-- reasoning stay readable at /desk/drinks behind one filter.
--
-- `product_status` has no 'retired' value and cannot gain one in this
-- transaction; db/045 established that at length and the argument is not
-- repeated here. `discontinued` means NOT OFFERED, which is exactly true, and
-- every surface already reads it that way.
--
-- ── ONE COLUMN, AND NO CHECK CONSTRAINT BESIDE IT. THIS IS A DEPARTURE FROM
-- db/045 AND IT IS DELIBERATE (CLAUDE.md rule 32: symmetry is not evidence).
--
-- db/045 added `menu_discontinued_has_reason`, and it could do that because the
-- ONLY way a menu leaves the catalogue is `saveMenu`, one form, which grew a
-- reason field in the same change. A drink has two doors: `saveDrink` and
-- `setDrinkStatus`, and the second is a one-click status button with no form
-- and nowhere to type. A check constraint added here would meet a curator as a
-- raw constraint name after a click — rule 16's failure with a button, which is
-- the thing db/045's own error path exists to avoid.
--
-- So: the column, written in the same statement as the status below (rule 17
-- satisfied for the ruling this file carries), and the constraint left for
-- whoever gives the drinks desk its reason field. NAMED, not quietly skipped.

alter table drink
  add column retirement_note text;

comment on column drink.retirement_note is
  'Why this drink is not offered, in words, written in the same statement that '
  'wrote the status. Kept if the drink is brought back: it is a record of what '
  'happened, not a description of the current state — db/042 argues that '
  'asymmetry at length. CLAUDE.md rule 17. No `discontinued ⇒ reason` check '
  'yet, and db/060 §II says why.';

alter table drink
  add constraint drink_retirement_note_not_blank
  check (retirement_note is null or btrim(retirement_note) <> '');


-- ─────────────────────────────────────────────────────────────────────
-- III · THE TWENTY-FIVE PROGRAMMES, RETIRED
-- ─────────────────────────────────────────────────────────────────────
--
-- BY SLUG PATTERN, `drink-NN`, which is the seed key db/017 gave the programmes
-- and nothing else in this table has: the atomic rows are `drink-NN-MM` (the
-- programme and the drink's place in it), so the two spaces cannot collide and
-- a re-seed cannot mistake one for the other. A drink a curator wrote at the
-- desk gets a slug from its name and is not touched here.
--
-- THREE CASES, DISTINGUISHED ON PURPOSE — db/045's shape, because collapsing
-- them into "did it work" hides the two that matter:
--
--   THE TABLE IS EMPTY     Fine, and NORMAL. `preDeployCommand` runs
--                          `npm run migrate` BEFORE `npm run seed:drinks`, so
--                          on any database built from the committed chain this
--                          block runs against an empty `drink` table and moves
--                          nothing. CLAUDE.md rule 22. It is also the state of
--                          production for this service's whole life so far
--                          (rule 33), so ZERO IS THE EXPECTED ANSWER THERE and
--                          a zero here is not evidence that anything failed.
--   ROWS PRESENT           The live case: a database somebody has already
--                          seeded. Twenty-five rows move, carrying the reason.
--                          Draft ones move too — a draft programme has the same
--                          nowhere to go, and leaving it would leave
--                          /desk/publish inviting a curator to offer a row the
--                          conversion has replaced.
--   ALREADY DISCONTINUED   Held. A row somebody withdrew by hand carries HER
--                          decision, not this one, and this file does not get
--                          to re-attribute it.
--
-- The count is RAISED AS A NOTICE rather than asserted, because both 0 and 25
-- are correct answers on different databases and an exception on either would
-- be a migration deciding which database it was allowed to meet.

do $$
declare
  v_note   constant text :=
    'Retired by db/060. The twenty-five programmes each bundled several drinks '
    'into one row, so the unit of selection was a whole bar: the founder — '
    '"the drinks were never fixed, still showing as part of a menu" — and a '
    'room with one programme poured the same three things at a February '
    'birthday and a July anniversary. docs/drink-explosion.md converted the '
    'twenty-five into 76 atomic drinks (55 paired with the mirror their author '
    'wrote, 21 carrying a named debt), which are seeded as drink-NN-MM from '
    'docs/drinks.md. Preserved rather than deleted: the programmes are what '
    'the atomic rows were split FROM, and docs/drinks-programmes.md keeps them '
    'whole and readable. To reverse: re-activate these rows and retire the '
    'atomic ones — but read docs/drinks.md''s conversion note first, because '
    'the mirror pairings are the part that cost the work.';
  v_moved  int;
  v_silent int;
  v_total  int;
begin
  select count(*) into v_total from drink where slug ~ '^drink-[0-9]{2}$';

  -- The silent ones first, exactly as db/042 and db/045 did: a row withdrawn
  -- before a reason was required gets a sentence that SAYS no reason was
  -- recorded, and is not an explanation. Inventing a plausible one would put
  -- words in a curator's mouth.
  update drink
     set retirement_note =
           'No reason was recorded. This drink was withdrawn before db/060 '
           'added a column to hold one, and this sentence is the migration '
           'saying so — it is not an explanation, and nobody has written one.'
   where status = 'discontinued'
     and (retirement_note is null or btrim(retirement_note) = '');
  get diagnostics v_silent = row_count;

  update drink
     set status          = 'discontinued',
         retirement_note = v_note
   where slug ~ '^drink-[0-9]{2}$'
     and status <> 'discontinued';
  get diagnostics v_moved = row_count;

  -- One ledger row per programme, for db/036's reason: a veto is only possible
  -- if the veto-er can see what happened, and /desk/stocked joins the ledger
  -- back to the row to read its status now.
  insert into staff_action
    (staff_id, actor, action, entity_table, entity_id, summary, detail)
  select null, 'auto: founder ruling', 'drink.retired', 'drink', d.id,
         d.name || ' — retired by db/060',
         jsonb_build_object(
           'migration', '060',
           'was', 'offered',
           'now', 'discontinued',
           'slug', d.slug::text,
           'superseded_by', 'the atomic drinks seeded as drink-NN-MM')
    from drink d
   where d.slug ~ '^drink-[0-9]{2}$'
     and d.retirement_note = v_note;

  raise notice '[060] % programme row(s) present, % retired, % silent '
    'discontinuations given a placeholder. Zero is the expected answer on a '
    'database built from the committed chain — migrate runs before seed.',
    v_total, v_moved, v_silent;
end $$;


-- ─────────────────────────────────────────────────────────────────────
-- IV · THE MIRROR — THE SAME GUARANTEE, SAID AT THE GRAIN IT IS ABOUT
-- ─────────────────────────────────────────────────────────────────────
--
-- READ THE TOP OF db/017 BEFORE TOUCHING THIS SECTION. Its guarantee is the
-- best thing in the catalogue and this file does not weaken it:
--
--     "nobody at the table is visibly not drinking. A person who is pregnant,
--      driving, in recovery, on antibiotics, or simply not in the mood is
--      handed the same tall glass with the same lime wheel as everyone else,
--      and no one has a conversation about it."
--
-- db/017 kept that with `mocktails text not null`, and it was right: at the
-- programme grain every one of the twenty-five records had a mocktail line, so
-- NOT NULL cost nothing and refused the one thing worth refusing.
--
-- ── WHAT THE ATOMIC GRAIN FOUND, WHICH THE PROGRAMME GRAIN HID ──────
--
-- Twenty-one of the seventy-six cocktail items have NO TWIN in their
-- programme's mocktail line. They are not a parsing failure and they are not
-- her forgetting: the mocktail lines are shorter than the cocktail lines in
-- twenty of the twenty-five programmes, and the gaps cluster — four neat
-- spirits, four beers, five poured wines and champagnes, eight mixed drinks.
-- The programme row hid this by putting three drinks and two mirrors on one
-- line, where the arithmetic never had to balance.
--
-- THE ONE THING THAT MAY NOT HAPPEN IS INVENTING THEM. docs/drink-explosion.md:
-- "A weak invented mirror is worse than a named gap, and db/017's whole
-- guarantee is what an invented mirror quietly spends." A daiquiri without rum
-- is lime and sugar; making that a drink somebody actually wants is authoring,
-- and authoring is hers.
--
-- ── SO: NOT NULL BECOMES NOT NULL WHILE LIVE ────────────────────────
--
-- The guarantee was never about rows. It is about what reaches a table. A drink
-- that is `active` is a drink the engine can put in a package, and THAT is the
-- row that may not lack a mirror — so the constraint is written where the
-- guarantee actually lives, and the twenty-one owed rows land as `draft`,
-- which is the state db/036 and CLAUDE.md rule 13 already define for an item
-- carrying a founder-pending question. They are visible at /desk/drinks, they
-- carry the question in their notes, and NOTHING CAN OFFER ONE.
--
-- The alternative was to seed 55 and silently drop 21 authored drinks. That is
-- rule 16's exact failure — an input absorbed and not honoured, with the
-- catalogue looking complete from every angle — and it would have made the
-- twenty-one gaps invisible to the only person who can close them.
--
-- ORDER: the check is added AFTER the column is weakened and while every
-- existing row still satisfies it (they all carry a mocktail line). rule 33:
-- a constraint over seed-supplied data must be satisfiable by the data as it
-- stands, in the same migration, and this one is satisfied both by an empty
-- table (production) and by twenty-five programme rows (a seeded scratch).

alter table drink
  alter column mocktails drop not null;

comment on column drink.mocktails is
  'THE MOCKTAIL MIRROR — the same glass, the same components, arriving at the '
  'same time. NULL means OWED: her author wrote no twin for this drink and '
  'nobody may invent one. Such a row is held at `draft` and '
  'drink_live_has_its_mirror makes it impossible to offer. Selected with the '
  'cocktail because it is the same row — never two rows, never a mirror table. '
  'See db/017 for the guarantee and db/060 §IV for why the NOT NULL moved.';

alter table drink
  add constraint drink_live_has_its_mirror
  check (status <> 'active' or mocktails is not null);

comment on constraint drink_live_has_its_mirror on drink is
  'db/017''s guarantee, at the grain it is about: nobody at the table is '
  'visibly not drinking, so no drink that can reach a table may lack its '
  'mirror. A drink whose mirror is owed is a draft and cannot be offered.';


-- ── drink.mirror_self ────────────────────────────────────────────────
--
-- ONE ROW USES THIS TODAY and it is derived, not judged. Vegas 14's mocktail
-- line and its cocktail line both contain "black coffee" — the author wrote the
-- same thing in both columns, because the drink has no alcohol in it and the
-- same glass goes to everybody. That is a mirror, and the strongest kind: there
-- is nothing to tell apart.
--
-- db/017's `drink_mirror_is_not_the_cocktail` would refuse it. That check was
-- right about what it was catching — "it catches the one way NOT NULL can be
-- satisfied without answering", a curator pasting the cocktail line into the
-- mirror field — and at the programme grain no honest row could ever have hit
-- it, because a whole three-drink line could not equal a whole mocktail line by
-- accident. At the atomic grain one honest row does. So the check is not
-- dropped, it is qualified: the lines may agree ONLY where the row says that is
-- what it means, and a row that says so must actually have them agree. The lazy
-- paste is still refused, because a paste does not tick a box.
--
-- The three other drinks docs/drink-explosion.md flags MIRROR-SELF — seltzer,
-- strong sweet coffee, a thermos of espresso — need nothing here: their author
-- wrote a different sentence in the mirror column ("the same coffee", "the same
-- espresso"), so the texts differ and the original check passes them. Rule 32:
-- they are not given a flag for looking similar to one that needs it.

alter table drink
  add column mirror_self boolean not null default false;

comment on column drink.mirror_self is
  'TRUE where the author wrote the same line in both columns — a drink with no '
  'alcohol in it, so the same glass goes to everybody. The ONLY state in which '
  'mocktails may equal cocktails. Set by scripts/seed-drinks.mjs from the '
  'document, never inferred. db/060 §IV.';

alter table drink
  drop constraint drink_mirror_is_not_the_cocktail;

alter table drink
  add constraint drink_mirror_is_not_the_cocktail
  check (mirror_self
         or mocktails is null
         or btrim(lower(mocktails)) <> btrim(lower(cocktails)));

alter table drink
  add constraint drink_mirror_self_is_the_same_glass
  check (not mirror_self
         or (mocktails is not null
             and btrim(lower(mocktails)) = btrim(lower(cocktails))));


-- ─────────────────────────────────────────────────────────────────────
-- V · drink_meal — WHICH SHAPES OF TABLE A DRINK CLAIMS
-- ─────────────────────────────────────────────────────────────────────
--
-- `dish_meal`'s twin, and deliberately identical to it in shape, defaults and
-- omissions: NO ROWS MEANS EVERY SHAPE, any row makes the set a whitelist, and
-- there is no `forbidden` half. That rule is written once, in
-- claimEligibility() and mealAgrees() (src/lib/selection/), and nothing here
-- re-implements it in SQL — db/009 says at length that writing it a second time
-- in SQL is the disease db/002 exists to cure, and db/019 and db/023 both
-- refused again.
--
-- WHY A TWIN TABLE AND NOT A COLUMN ON `drink`: a drink claims one shape or
-- two. Programme 1 is "A summer dinner or cocktail party" and programme 5 is "A
-- rainy lunch or cozy dinner" — she named two shapes in each, and a
-- `meal_shape` column would force one of the two to be dropped.
--
-- NINETEEN of the seventy-six rows claim two shapes. This line said TWENTY-TWO
-- until the seeder was wired and the count was actually taken (CLAUDE.md rule
-- 24: reading tells you what it was meant to match, only counting tells you
-- what it did). Six programmes name two shapes and the rows are their drinks:
-- 1 (Dinner, Standing drinks) ×3, 5 (Lunch, Dinner) ×3, 9 (Lunch, Standing
-- drinks) ×3, 11 (Dinner, Lunch) ×3, 18 (Dinner, Lunch) ×3, 24 (Standing
-- drinks, Dinner) ×4 — 19. The remaining split is 51 rows claiming one shape
-- and 6 claiming none, which sums to 76 and to the 89 claims
-- `npm run check:drinks` reports. The wrong number is recorded rather than
-- quietly replaced because it is evidence about the method: 22 was arrived at
-- by reading the conversion table, 19 by running the parser over it.
--
-- THE CLAIMS ARE CONTENT AND ARE NOT WRITTEN HERE. CLAUDE.md rule 22:
-- migrations own schema, seeders own content, and a migration that derives rows
-- by matching authored text runs against empty tables on every build forever.
-- scripts/seed-drinks.mjs writes them, from a bullet in the document, and
-- --dry-run counts them before a database is involved.

create table drink_meal (
  drink_id   uuid not null references drink(id) on delete cascade,
  meal       meal_shape not null,
  -- Where the claim came from. The seeder writes the programme's own "what it
  -- is for" line, so the record says what was read and by whom.
  note       text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  primary key (drink_id, meal)
);

create trigger drink_meal_touch before update on drink_meal
  for each row execute function set_updated_at();

create index drink_meal_meal_idx on drink_meal (meal);

comment on table drink_meal is
  'Which shapes of table a drink claims — db/023''s meal_shape, on the drink '
  'pool, by the founder''s ruling of 2026-08-31 (filed in docs/drinks.md). NO '
  'ROWS MEANS EVERY SHAPE, the same default dish_meal, dish_world and '
  'dish_occasion carry: six of the seventy-six drinks come from programmes '
  'whose author named no shape ("After a day outside", "A boat or beach day") '
  'and they claim nothing rather than being guessed at. See db/060.';

create view drink_meal_card as
select d.id,
       coalesce(
         (select array_agg(dm.meal::text order by dm.meal)
            from drink_meal dm where dm.drink_id = d.id),
         '{}') as meals
  from drink d;

comment on view drink_meal_card is
  'Every drink with the meal shapes it claims, empty meaning all of them. '
  'dish_meal_card''s twin (db/023).';


-- ─────────────────────────────────────────────────────────────────────
-- VI · occasion_meal — EACH OCCASION DECLARES ITS MEAL SHAPE(S) ONCE
-- ─────────────────────────────────────────────────────────────────────
--
-- The second half of the ruling, and the half without which the first is a gate
-- with no claimants — `requires_still_water`'s situation, and the shape of the
-- defect that made `requires_full_kitchen` unreadable for two days. Her words:
-- "each occasion declares its meal shape(s) once — most already imply it — and
-- occasion→drink eligibility is a join, not an authoring pass."
--
-- ── EVERY OCCASION HAS ROWS. SILENCE IS NOT A DECLARATION ───────────
--
-- This table breaks with `dish_meal`'s "no rows means everything" convention,
-- on purpose, and the reason is that the two tables answer different kinds of
-- question. A dish that claims nothing is an UNTAGGED dish and the catalogue is
-- honest about being unfinished. An occasion that declares nothing is a product
-- decision NOBODY MADE, and reading it as "all five" would be inference from
-- silence — CLAUDE.md rule 3, the failure this project exists to escape. So all
-- nine occasions carry rows, the assertion at the bottom of this section
-- refuses a database where one does not, and a tenth occasion_type added later
-- will fail that assertion until somebody decides what it is.
--
-- ── AND EIGHT OF THE NINE DECLARE ALL FIVE. THAT IS THE FINDING ─────
--
-- Reported rather than tidied (rule 24: count in both directions, because a
-- gate that matches everything prunes nothing and is invisible). Only
-- `dinner_party` narrows, and it narrows because db/009 already said so in its
-- own label and note — "The long dinner", "One table, one evening". The other
-- eight are genuinely open, and db/023 says why in one sentence: "A birthday
-- can be a brunch and an anniversary can be a late supper, and collapsing the
-- two would make one of those unsayable."
--
-- So this table prunes ONE occasion's drinks today. That is not a table earning
-- its keep by volume; it is the authority for a fact that had no owner, in the
-- one place a later ruling ("a bridal is never a late supper") is an INSERT
-- rather than a migration and a deploy.
--
-- ── WHERE IT IS READ, AND WHERE IT DELIBERATELY IS NOT ──────────────
--
-- READ BY: src/lib/catalogue/gates.ts, in the room × occasion watch the founder
-- required as the other half of this pair — "the tagging step writes the
-- claims, and the gap reporter must watch drink coverage per-occasion BEFORE
-- the gate goes live". That watch asks a per-OCCASION question — can this room
-- pour anything at all at a dinner party — and this table is the join that
-- answers it.
--
-- NOT READ BY: the selection engine's stage-3 filter. That asks a different
-- question — what kind of table is THIS evening — and it already has one owner,
-- `mealShape()` in src/lib/selection/table.ts, resolved from the host's own
-- `meal_time` answer (db/026). Reading this table there as well would be two
-- authorities for one fact and the stricter of the two would win silently,
-- which is CLAUDE.md rule 21's exact failure shape. An occasion declares what
-- it CAN be; the host says what it IS.

create table occasion_meal (
  occasion   occasion_type not null,
  meal       meal_shape not null,
  -- Why this occasion can be this shape, in words. A declaration nobody can
  -- read the argument for is rule 17's adjudication with the opinion torn off.
  note       text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  primary key (occasion, meal)
);

create trigger occasion_meal_touch before update on occasion_meal
  for each row execute function set_updated_at();

comment on table occasion_meal is
  'WHICH SHAPES OF TABLE AN OCCASION CAN BE — db/023''s meal_shape against '
  'db/001''s occasion_type, declared once per occasion by the founder''s '
  'ruling of 2026-08-31. Every occasion_type has at least one row and silence '
  'is NOT read as "all five": an occasion with no rows is a decision nobody '
  'made. Read by the room × occasion drink watch in src/lib/catalogue/gates.ts '
  'and NOT by the selection engine, which resolves the evening''s shape from '
  'the host''s own answer. See db/060 §VI.';

insert into occasion_meal (occasion, meal, note) values
  -- The one that narrows. db/009's own label for it is "The long dinner" and
  -- its note is "One table, one evening. No arrival day, no per-day material."
  -- A dinner party that is a brunch is a brunch.
  ('dinner_party', 'long_dinner',
   'db/009: "The long dinner. One table, one evening." The occasion names the '
   'shape, which is why this is the only one of the nine that narrows.'),

  -- db/023, verbatim: "A birthday can be a brunch and an anniversary can be a
  -- late supper, and collapsing the two would make one of those unsayable."
  ('birthday', 'brunch',      'db/023: a birthday can be a brunch.'),
  ('birthday', 'lunch',       'A birthday lunch is a birthday.'),
  ('birthday', 'cocktails',   'Standing drinks and a cake is a birthday.'),
  ('birthday', 'long_dinner', 'The common case, and not the only one.'),
  ('birthday', 'late_supper', 'A birthday that starts after the show.'),

  ('anniversary', 'brunch',      'The morning after counts.'),
  ('anniversary', 'lunch',       'A long lunch, honoured, is an anniversary.'),
  ('anniversary', 'cocktails',   'Two people and a bottle is an anniversary.'),
  ('anniversary', 'long_dinner', 'The common case.'),
  ('anniversary', 'late_supper',
   'db/023: "an anniversary can be a late supper", named in the sentence that '
   'made these two axes separate.'),

  ('holiday', 'brunch',      'Christmas morning is a brunch.'),
  ('holiday', 'lunch',       'The holiday table is as often midday as evening.'),
  ('holiday', 'cocktails',   'New Year''s Eve, standing.'),
  ('holiday', 'long_dinner', 'The common case.'),
  ('holiday', 'late_supper', 'After midnight mass, after the fireworks.'),

  ('no_reason', 'brunch',      'The purest case has no shape of its own.'),
  ('no_reason', 'lunch',       'The purest case has no shape of its own.'),
  ('no_reason', 'cocktails',   'The purest case has no shape of its own.'),
  ('no_reason', 'long_dinner', 'The purest case has no shape of its own.'),
  ('no_reason', 'late_supper', 'The purest case has no shape of its own.'),

  -- The three that run longer than an evening. A weekend HAS a brunch and a
  -- dinner; declaring one shape for it would delete the other.
  ('girls_weekend', 'brunch',      'Three days carry every shape there is.'),
  ('girls_weekend', 'lunch',       'Three days carry every shape there is.'),
  ('girls_weekend', 'cocktails',   'Three days carry every shape there is.'),
  ('girls_weekend', 'long_dinner', 'Three days carry every shape there is.'),
  ('girls_weekend', 'late_supper', 'Three days carry every shape there is.'),

  ('getaway', 'brunch',      'Three days, deliberately unscheduled.'),
  ('getaway', 'lunch',       'Three days, deliberately unscheduled.'),
  ('getaway', 'cocktails',   'Three days, deliberately unscheduled.'),
  ('getaway', 'long_dinner', 'Three days, deliberately unscheduled.'),
  ('getaway', 'late_supper', 'Three days, deliberately unscheduled.'),

  ('bridal', 'brunch',      'Two days, and the morning one is usually a brunch.'),
  ('bridal', 'lunch',       'Two days, and either can be the midday one.'),
  ('bridal', 'cocktails',   'Two days, and one of them often stands up.'),
  ('bridal', 'long_dinner', 'Two days, and one of them is usually the dinner.'),
  ('bridal', 'late_supper', 'Two days, and the first can end late.'),

  -- db/009: "Shape unknown until a human reads her words. Defaults to one
  -- evening, and the engine says so rather than pretending it knew." The same
  -- honesty here: unknown means every shape is still possible, and this row set
  -- says that out loud rather than leaving the table silent.
  ('other', 'brunch',      'Shape unknown until a human reads her words.'),
  ('other', 'lunch',       'Shape unknown until a human reads her words.'),
  ('other', 'cocktails',   'Shape unknown until a human reads her words.'),
  ('other', 'long_dinner', 'Shape unknown until a human reads her words.'),
  ('other', 'late_supper', 'Shape unknown until a human reads her words.');

-- Every occasion_type declares something. This is the guard that makes the
-- table's break with the "no rows means everything" convention safe: without
-- it, a tenth occasion added by a later migration would read as "no rows" and
-- silently mean whatever the reader assumed.
do $$
declare
  v_missing text;
begin
  select string_agg(t.code, ', ' order by t.code) into v_missing
    from (select unnest(enum_range(null::occasion_type))::text as code) t
   where not exists (select 1 from occasion_meal om
                      where om.occasion::text = t.code);

  if v_missing is not null then
    raise exception '[060] these occasions declare no meal shape: %. Every '
      'occasion_type must declare at least one — silence is not a declaration '
      '(CLAUDE.md rule 3), and a reader would take it for "all five".',
      v_missing;
  end if;
end $$;


-- ─────────────────────────────────────────────────────────────────────
-- WHAT THIS DELIBERATELY DOES NOT DO
--
--   · NO NEW SLOTS. docs/drink-explosion.md §4 proposes splitting `the_drinks`
--     into `the_pour`, `the_pitcher` and `the_after` with argued draw counts.
--     That is a change to nine occasion_slot rows and to seven staged take-home
--     dependencies, and the founder has ruled on the ATOMISATION, not on the
--     draw. `the_drinks` still draws exactly 1, from 76 rows instead of 25,
--     which is already the difference between a room pouring the same three
--     things forever and a room with a bar. §7.3's sequencing hazard — the
--     delete and the insert must be one statement — is left written down where
--     whoever does it will meet it.
--
--   · NO `requires_open_flame` REPAIR. The tagger matches `drink.name ilike
--     '%fire-lit%'`, and that string was programme 21's name, "A fire-lit
--     dinner". The atomic rows are called "Margaritas at sunset", "California
--     red by the fire" and "Hot toddies when the fog comes in"; two name the
--     fire and one does not, and WHICH of the three the requirement belongs to
--     is an authoring question with a founder's answer (explosion doc §7.5a).
--     Re-pointing it by symmetry is rule 32 exactly. What is NOT left silent is
--     the count: src/lib/catalogue/tagging.ts already counts rows per
--     requirement code, and the drink side of `requires_open_flame` goes from
--     one to zero on this change. Said out loud here so that a smaller number
--     is not mistaken for a stable one (rule 24).
--
--   · NO `discontinued ⇒ reason` CHECK ON `drink`. §II.
--
--   · NO OCCASION CLAIM ON ANY DRINK. `drink_occasion` stays at zero rows and
--     that is the ruling, not an omission.
-- ─────────────────────────────────────────────────────────────────────
