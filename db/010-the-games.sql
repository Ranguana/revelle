-- ─────────────────────────────────────────────────────────────────────
-- THE GAMES
--
-- db/009 made `game` a pool: a table, a facet join, an occasion axis, a slot
-- axis, a destination axis, and a place in the assemblage fingerprint. What it
-- did not give it is the handful of properties that decide whether a game can
-- actually be RUN on the night it is placed on. This file adds those, and only
-- those.
--
-- No games are inserted here. The founder's games are CONTENT, and content in a
-- migration is content that can only be corrected by another migration — the
-- argument scripts/seed-destinations.mjs makes at length and db/009 makes again
-- about its slot plans ("structure, not content"). The canonical, reviewable
-- text of every game lives in src/lib/games.ts, where a change to a rule is a
-- diff a human can read; scripts/seed-games.mjs moves it into these tables.
--
-- ── WHAT THIS FILE ADDS ─────────────────────────────────────────────
--
--   game.shape            scheduled / ambient / finale. THE LOAD-BEARING ONE
--   game.sourcing         provided (we print it) / recommended (we point at it)
--   game_supply           what it needs, and how many days before
--   game_lead_time        the view The Prep and The Edit read
--   game_requirement      what the room must have. Some of it can fail
--   game_dependency       a game that consumes another game's output
--   game_printed_matter   what gets set in the destination's typeface
--   slot_shape            which shapes a slot will accept. The gate
--   slot_kind             two new slots: the undercurrent, and the ending
--   occasion_shape.scheduled_game_max   how many blocks an occasion has
--
-- ─────────────────────────────────────────────────────────────────────
-- A RULE THAT MUST NOT BE MISAPPLIED — READ THIS BEFORE "FIXING" ANYTHING
--
-- docs/copy-brief.md bans points, streaks, badges, progress bars, percentage
-- complete and leaderboards. That rule is about THE PRODUCT INTERFACE: the page
-- a host reads, the application she fills in, anything Revelle shows her about
-- her own progress through Revelle. It exists because congratulating a customer
-- for continuing is what a gimmick does, and Revelle does not do it.
--
-- IT HAS NOTHING TO SAY ABOUT A PARTY GAME HAVING A SCORE.
--
-- A scavenger hunt in which a foreign coin is worth twenty and a business card
-- is worth five is a scavenger hunt working correctly. Party Bucks accumulating
-- across an evening and spent at an auction at the end is not a leaderboard
-- creeping into the product — it is the entire mechanism of the finale, and the
-- reason a guest who won nothing all night is still in the room at midnight.
-- Removing the scores would not make these games more tasteful. It would leave
-- them without a way to end.
--
-- So `scoring` and `currency_label` below are GAME RULES. They are printed on
-- game materials, read aloud by a host, and settled between guests. Nothing in
-- this file may ever be rendered as a progress bar, a badge, a streak or a
-- leaderboard in Revelle's own interface. Two different objects that happen to
-- share a word. Do not sanitise the games to satisfy a rule they are not the
-- subject of.
-- ─────────────────────────────────────────────────────────────────────

-- ── shape ────────────────────────────────────────────────────────────
--
-- THE DISTINCTION WITHOUT WHICH THE FILLER DOUBLE-BOOKS.
--
-- db/009 gives a birthday three slots that all draw from the game pool —
-- `honouring`, `the_moment` and `game` — and a weekend one per day on top. The
-- filler treats each as an independent pick, so with nothing to stop it, it
-- will place three forty-five-minute games and hand a host an evening that is
-- two and a quarter hours of programming with a dinner somewhere inside it.
-- That is the failure. It is not a taste failure a score could fix; two things
-- cannot occupy the same hour.
--
--   scheduled  Occupies a block. Everyone stops what they are doing, it runs,
--              it ends. An occasion has a small number of these and the number
--              is a property of the occasion, not of the game.
--   ambient    Runs UNDERNEATH everything else and consumes no block at all.
--              A guest carrying a secret task through the whole evening is not
--              spending an hour on it; she is spending the evening differently.
--              An ambient game costs nothing but the deck it is printed on,
--              which is why it may sit alongside a scheduled one.
--   finale     Closes the evening, and may depend on what the earlier games
--              produced. There is at most one, by definition — an evening that
--              ends twice did not end the first time.
--
-- An enum rather than rows because this IS closed and structural: each value
-- carries different rules about what it may be placed in and how many may
-- coexist. Adding a fourth would be a real decision about what a game is.

create type game_shape as enum ('scheduled', 'ambient', 'finale');

-- ── sourcing ─────────────────────────────────────────────────────────
--
-- WHOSE GAME IT IS, AND THEREFORE WHAT WE MAY DO WITH IT.
--
--   provided     The house supplies it. Either the founder's own work or a folk
--                game nobody owns — Fishbowl, charades, the noun game under its
--                twelve names. We write the rules, we print the materials, and
--                they are set in the destination's own typeface. This is what
--                makes The Printed Matter a real deliverable rather than a list
--                of links.
--   recommended  Somebody else's product. We may NAME it and point a host at
--                it. We may not reproduce its rules, print its materials, or
--                render it in the destination's typeface, and a Revelle that
--                includes one is a Revelle with a dependency the house does not
--                control. `caveat` is where that is stated plainly instead of
--                being discovered on the night.
--
-- The distinction is enforced downward: game_printed_matter refuses a row for a
-- recommended game, and `game` refuses to become recommended while printed
-- matter exists for it. Both directions, because a one-way check is a check
-- somebody routes around by doing it in the other order.

create type game_sourcing as enum ('provided', 'recommended');

alter table game
  add column shape game_shape not null default 'scheduled',
  add column sourcing game_sourcing not null default 'provided',

  -- The top of the range when a game has one. db/009's `duration_minutes` is
  -- the low, typical figure — what to plan the evening against; this is what it
  -- runs to when it is going well. Two columns rather than a range type because
  -- every other band in this schema (guest_count, spend_per_person) is a low
  -- and a high, and the filler's arithmetic is the poorer for a special case.
  add column duration_max_minutes integer
    check (duration_max_minutes is null
           or duration_max_minutes between 1 and 600),

  -- HOW A SCORE IS KEPT, if one is. A game rule, printed on game materials.
  -- Read the note at the top of this file before deciding this violates
  -- docs/copy-brief.md. It does not.
  add column scoring text,
  -- What the game calls its currency: 'Party Bucks', 'points', 'tickets'. Null
  -- when nothing is counted, which is most games and a good answer.
  add column currency_label text,

  -- Recommended games only. What it is actually called, and where a host finds
  -- it. Null for anything the house provides.
  add column external_name text,
  add column external_url  text,

  -- What can go wrong that is not ours to fix, in a sentence a host can act on.
  -- An app can be pulled from a store between the day a Revelle is designed and
  -- the day it is run, and the honest place to say so is here rather than in
  -- an apology afterwards.
  add column caveat text,

  add constraint game_duration_range_ordered
    check (duration_minutes is null or duration_max_minutes is null
           or duration_max_minutes >= duration_minutes),

  -- An ambient game consumes no block, so a duration on one would be a lie
  -- about the only thing this column is read for. It runs as long as the
  -- evening does.
  add constraint game_ambient_has_no_duration
    check (shape <> 'ambient'
           or (duration_minutes is null and duration_max_minutes is null)),

  -- A provided game has no external product to name. A recommended one must
  -- name what it is, or a host cannot find it and the recommendation is noise.
  add constraint game_external_matches_sourcing
    check ((sourcing = 'recommended') or
           (external_name is null and external_url is null)),
  add constraint game_recommended_is_named
    check (sourcing <> 'recommended' or external_name is not null);

comment on column game.shape is
  'scheduled occupies a block; ambient runs underneath and consumes none; '
  'finale closes the evening. See db/010 — this is what stops the filler '
  'booking two scheduled games for one hour.';
comment on column game.scoring is
  'A GAME RULE, printed on game materials. Not a product-interface score. '
  'docs/copy-brief.md''s ban on points and leaderboards is about Revelle''s '
  'own interface and does not reach a party game. See db/010.';

create index game_shape_idx on game (shape, status);
create index game_sourcing_idx on game (sourcing) where sourcing = 'recommended';

-- ── supplies, and the deadline they carry ────────────────────────────
--
-- `game.materials` is free text: what a host reads. This is the same fact in a
-- shape the system can count, and the two are not duplicates of each other —
-- one is the sentence in The Fun, the other is the line item in The Edit and
-- the date in The Prep.
--
-- LEAD TIME IS THE POINT. A game that needs a printed list needs a printer and
-- a day. A game that needs small canvases, paints and easels for twenty is a
-- shopping trip, and a shopping trip has a deadline that is not the day of the
-- party. A host who learns on Friday that Saturday's game needed canvases has
-- been handed a failure by the system that designed her evening.
--
--   printed    We render it and she prints it, or it arrives printed. Short
--              lead, and it is only ever a provided game's material.
--   host_buys  She buys it. This is the line that appears in The Edit and the
--              number that drives the deadline in The Prep.
--   on_hand    A pen, a bowl, the kitchen timer. Named because "nothing to
--              buy" and "we forgot to say you need a bowl" look identical
--              until the night.

create type supply_source as enum ('printed', 'host_buys', 'on_hand');

create table game_supply (
  game_id     uuid not null references game(id) on delete cascade,
  -- 'Small canvases'. Natural key: a game does not list the same item twice,
  -- and if it wants to, the two lines were one line.
  item        text not null check (length(btrim(item)) > 0),
  detail      text not null default '',
  source      supply_source not null,

  -- Counted per head, from the TOP of her guest band. docs/selection-spec.md:
  -- a place card too few is a person without a seat, and the cost of one spare
  -- is nothing. The same is true of a canvas.
  per_guest   boolean not null default false,
  -- A fixed count, when it is not per head. Null and not per_guest means "some"
  -- — a curator has not counted, which is honest and common for consumables.
  quantity    integer check (quantity is null or quantity >= 1),

  -- Days BEFORE the party this must be in hand. Zero is a thing she can pick up
  -- on the way home; seven is a delivery that has to be ordered.
  lead_time_days integer not null default 0
    check (lead_time_days between 0 and 90),

  position    integer not null default 0,
  note        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  primary key (game_id, item),
  -- A per-head item's count comes from her guest band, so writing a number here
  -- would be a second, wrong answer to a question already answered.
  constraint game_supply_per_guest_has_no_fixed_count
    check (not per_guest or quantity is null)
);

create trigger game_supply_touch before update on game_supply
  for each row execute function set_updated_at();

create index game_supply_lead_idx on game_supply (game_id, lead_time_days desc);

-- THE PREP AND THE EDIT, in one row per game.
--
-- A view and not a maintained column on `game`, for the reason db/002 gives for
-- ingredient_issuance: at this volume the aggregate is free, and a cached
-- number is a drift risk with no upside — the first time a curator edits a
-- supply row, a stored lead time is wrong and nothing says so.
create view game_lead_time as
select g.id                                             as game_id,
       g.slug,
       g.name,
       -- The deadline. The longest lead of anything that has to be acquired.
       coalesce(max(s.lead_time_days), 0)               as lead_time_days,
       -- Split, because they are two different jobs on two different days.
       coalesce(max(s.lead_time_days)
                filter (where s.source = 'host_buys'), 0) as shopping_lead_days,
       coalesce(max(s.lead_time_days)
                filter (where s.source = 'printed'), 0)   as printing_lead_days,
       count(*) filter (where s.source = 'host_buys')     as items_to_buy,
       count(*) filter (where s.source = 'printed')       as items_to_print,
       count(*) filter (where s.per_guest)                as items_per_guest
  from game g
  left join game_supply s on s.game_id = g.id
 group by g.id, g.slug, g.name;

comment on view game_lead_time is
  'What The Prep and The Edit read. lead_time_days is the deadline: the '
  'longest lead of anything this game needs in hand. See db/010.';

-- ── what the room must have ──────────────────────────────────────────
--
-- Distinct from supplies, which are things she acquires. These are conditions
-- of the room and the people in it — and some of them CAN FAIL ON THE NIGHT
-- through nobody's fault, which is a fact a host is entitled to know in advance
-- rather than discover.
--
-- Rows and not an enum, for the reason db/002 gives for facet_dimension: the
-- list is not finished and "this one needs a projector" should be an insert.

create table game_requirement_kind (
  code        text primary key check (code ~ '^[a-z][a-z0-9_]*$'),
  label       text not null,
  description text not null default '',
  -- Can this fail on the night, through nobody's fault? Signal drops. An app
  -- is pulled from a store. A phone is at four percent. A room that is the
  -- wrong shape does not fail — it was always the wrong shape, and that is a
  -- filter, not a risk.
  fragile     boolean not null default false,
  position    integer not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint game_requirement_kind_position_unique unique (position)
    deferrable initially deferred
);

create trigger game_requirement_kind_touch before update on game_requirement_kind
  for each row execute function set_updated_at();

insert into game_requirement_kind (code, label, description, fragile, position) values
  ('phones', 'A phone each',
   'Every player needs their own, charged, and out on the table.', true, 10),
  ('signal', 'Signal or wifi that holds',
   'A rented house on a dune road is exactly where this is not true.', true, 20),
  ('app_store', 'An app somebody else maintains',
   'It can be pulled, renamed, paywalled or broken by an update between the '
   'day a Revelle is designed and the night it is run. Nothing on our side '
   'prevents it.', true, 30),
  ('host_to_run_it', 'Someone willing to run it',
   'A host, or a guest handed the job in advance. Not the same as a game that '
   'runs itself once the cards are dealt.', false, 40),
  ('mixed_room', 'People who do not all already know each other',
   'The whole mechanism of some games is a stranger. Six old friends are the '
   'wrong room for them, and no amount of enthusiasm fixes it.', false, 50),
  ('table_space', 'Table space to work on',
   'Cleared, and enough of it for everyone at once.', false, 60),
  ('wall_or_easel_space', 'Somewhere to display finished work',
   'A wall, a mantel, a row of easels. Anything that lets a room look at a '
   'dozen things at the same time.', false, 70),
  ('floor_space', 'Room to move about',
   'People crossing the room, finding each other, forming a line.', false, 80),
  ('printing', 'Something printed beforehand',
   'The materials exist and are rendered in the destination''s typeface, but '
   'somebody has to put paper in a printer.', false, 90),
  ('prizes', 'Objects to win',
   'Real ones and ridiculous ones. The ridiculous ones matter more.', false, 100);

create table game_requirement (
  game_id     uuid not null references game(id) on delete cascade,
  requirement text not null
                references game_requirement_kind(code) on delete restrict,
  -- What it means for THIS game, in the curator's words. The sentence The Prep
  -- prints, and the only place her reasoning survives.
  note        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  primary key (game_id, requirement)
);

create trigger game_requirement_touch before update on game_requirement
  for each row execute function set_updated_at();

create index game_requirement_kind_idx on game_requirement (requirement);

-- Everything a Revelle's games need the house to have warned about, in one
-- read. The `fragile` half is what The Prep says out loud.
create view game_fragility as
select g.id as game_id, g.slug, g.name,
       count(*) filter (where k.fragile)      as fragile_requirements,
       string_agg(k.label, '; ' order by k.position)
         filter (where k.fragile)             as fragile_detail
  from game g
  left join game_requirement r on r.game_id = g.id
  left join game_requirement_kind k on k.code = r.requirement
 group by g.id, g.slug, g.name;

-- ── dependencies ─────────────────────────────────────────────────────
--
-- A GAME THAT CONSUMES ANOTHER GAME'S OUTPUT.
--
-- The finale is the case this exists for: an auction whose lots include the
-- artwork made earlier in the evening, paid for in a currency the earlier games
-- were the way of earning. Placed on its own it is an auction with nothing to
-- sell and nobody able to bid.
--
--   required     The finale genuinely cannot run without this.
--   enriched_by  It is better with it and works without it. A soft term the
--                filler may take as a bonus; never a filter.
--
-- ── THE ANY-OF READING, AND WHY IT IS A JUDGEMENT ───────────────────
--
-- The founder's material says the auction's currency is earned "across the
-- night" and lists four games that pay it. It does not say whether all four are
-- required or whether one will do. Read strictly — every row a hard
-- prerequisite — the auction becomes unplaceable unless four other games are
-- placed with it, which no single evening has room for. So `group_key` carries
-- the other reading:
--
--   · a `required` row with a NULL group_key must be met on its own;
--   · `required` rows sharing a group_key are met when ANY ONE of them is
--     present.
--
-- Stated here because it is an interpretation and not a rule anybody wrote
-- down, and the next person is entitled to disagree with it in one place.

create type dependency_strength as enum ('required', 'enriched_by');

create table game_dependency (
  game_id          uuid not null references game(id) on delete cascade,
  -- restrict, not cascade: deleting a game that another game is built on top of
  -- should fail loudly. Retire it instead.
  requires_game_id uuid not null references game(id) on delete restrict,
  strength         dependency_strength not null default 'required',
  -- See the any-of note above. Null means this row stands alone.
  group_key        text check (group_key is null or group_key ~ '^[a-z][a-z0-9_]*$'),
  note             text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  primary key (game_id, requires_game_id),
  constraint game_dependency_not_self check (game_id <> requires_game_id),
  -- A group is a choice between alternatives, which only 'required' rows make.
  -- Grouping soft bonuses would say nothing.
  constraint game_dependency_group_is_required
    check (group_key is null or strength = 'required')
);

create trigger game_dependency_touch before update on game_dependency
  for each row execute function set_updated_at();

create index game_dependency_requires_idx on game_dependency (requires_game_id);

-- A cycle is a set of games none of which can ever be placed first, and the
-- filler would loop looking for one. Checked AFTER the row lands so the new
-- edge is part of the graph being walked; `union` rather than `union all`
-- terminates the recursion on a repeat.
create or replace function game_dependency_acyclic() returns trigger
language plpgsql as $$
declare
  v_cycle boolean;
begin
  with recursive reach(id) as (
    select new.requires_game_id
    union
    select d.requires_game_id
      from game_dependency d
      join reach r on d.game_id = r.id
  )
  select exists (select 1 from reach where id = new.game_id) into v_cycle;

  if v_cycle then
    raise exception
      '% cannot depend on %: it closes a cycle.',
      ingredient_label('game', new.game_id),
      ingredient_label('game', new.requires_game_id)
      using
        hint = 'Every game in a cycle is waiting for another one to go first, '
               'so none of them can ever be placed. Break the loop — usually '
               'the softer edge should be enriched_by, or not a dependency at '
               'all.',
        errcode = 'check_violation';
  end if;
  return null;
end;
$$;

create constraint trigger game_dependency_no_cycles
  after insert or update on game_dependency
  deferrable initially immediate
  for each row execute function game_dependency_acyclic();

-- ── printed matter ───────────────────────────────────────────────────
--
-- WHAT GETS SET IN THE DESTINATION'S TYPEFACE.
--
-- The deliverable docs/copy-brief.md says is the argument and is currently
-- buried: "Invitations, menus, place cards, game materials." The game materials
-- are the half nothing else in this schema described. A deck of secret cards is
-- literally a deck; a scavenger hunt is a point list; an art battle is prompt
-- cards and voting slips. Each is a real object, in the destination's palette
-- and face, and the reason a Revelle feels like a thing rather than a document.
--
-- `voice_piece` ties the WRITING on a piece to db/004's vocabulary, so the
-- writer's prompt for a voting slip knows it is a `notice` and not an
-- `invitation`, and a destination that bans exclamation points bans them here
-- too.
--
-- Nothing is rendered for a recommended game — see the guard below. That is not
-- caution, it is the line: we may name somebody else's game and may not print
-- it.

create table game_printed_matter (
  game_id     uuid not null references game(id) on delete cascade,
  -- 'prompt_cards', 'voting_slips', 'the_deck'. Machine-stable within a game.
  piece       text not null check (piece ~ '^[a-z][a-z0-9_]*$'),
  label       text not null,
  description text not null default '',

  -- Which kind of writing goes on it. db/004's voice_piece_kind.
  voice_piece text references voice_piece_kind(code) on delete restrict,

  -- One per head, counted from the top of her guest band — the same rule
  -- docs/selection-spec.md states for place cards and favours.
  per_guest   boolean not null default false,
  -- A fixed count when it is not per head: five prompt cards, three door cards.
  quantity    integer check (quantity is null or quantity >= 1),

  position    integer not null default 0,
  note        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  primary key (game_id, piece),
  constraint game_printed_matter_per_guest_has_no_fixed_count
    check (not per_guest or quantity is null)
);

create trigger game_printed_matter_touch before update on game_printed_matter
  for each row execute function set_updated_at();

-- Both directions. A one-way check is a check somebody routes around by doing
-- the two operations in the other order.
create or replace function game_printed_matter_provided_only() returns trigger
language plpgsql as $$
begin
  if (select sourcing from game where id = new.game_id) = 'recommended' then
    raise exception
      'Printed matter cannot be authored for %, which is recommended, not provided.',
      ingredient_label('game', new.game_id)
      using
        hint = 'A recommended game is somebody else''s product. Revelle may '
               'name it and point a host at it; it may not reproduce its rules '
               'or set its materials in a destination''s typeface. If the house '
               'genuinely owns this game, change game.sourcing first.',
        errcode = 'check_violation';
  end if;
  return null;
end;
$$;

create constraint trigger game_printed_matter_sourcing
  after insert or update on game_printed_matter
  for each row execute function game_printed_matter_provided_only();

create or replace function game_sourcing_release_guard() returns trigger
language plpgsql as $$
begin
  if new.sourcing = 'recommended' and old.sourcing <> 'recommended'
     and exists (select 1 from game_printed_matter where game_id = new.id) then
    raise exception
      'Cannot mark % recommended: printed matter already exists for it.',
      ingredient_label('game', new.id)
      using
        hint = 'Delete the game_printed_matter rows first, deliberately. '
               'Materials rendered for a game we no longer claim to provide '
               'would keep shipping in every reprint of a Revelle that has it.',
        errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger game_sourcing_release before update of sourcing on game
  for each row execute function game_sourcing_release_guard();

-- ── two new slots ────────────────────────────────────────────────────
--
-- db/009's slot list has one `game` slot, `the_moment`, `honouring` and
-- `day_material` — all of them blocks. There was nowhere to put a game that
-- takes no block, and nowhere to put the thing that ends the night, so both
-- would have competed for a block they do not need.
--
-- `ambient_game` renders into `fun` alongside the scheduled game. `finale`
-- renders into `ending`, which section_kind has carried since db/001 and
-- nothing had yet filled — the deliverable docs/copy.md calls "how a night
-- closes on purpose, not by attrition".

insert into slot_kind (code, label, description, section, per_guest, position) values
  ('ambient_game', 'The undercurrent',
   'A game that runs underneath the whole evening and takes no time out of it. '
   'Everyone is playing; nobody has stopped doing anything else.',
   'fun', false, 75),
  ('finale', 'The ending',
   'How the night closes, on purpose. May spend what the earlier games '
   'produced, which is what makes it an ending rather than one more game.',
   'ending', false, 85);

-- ── slot_shape: which shapes a slot will accept ──────────────────────
--
-- THE GATE, and the reason the founder's distinction is mechanical rather than
-- advisory. A slot that has a block to give accepts scheduled games. The
-- undercurrent accepts only ambient ones — so the deck that runs all evening
-- can never be booked into the hour the art battle owns, and the art battle can
-- never be placed as an undercurrent it has no way of being.
--
-- Data, not a check constraint, because "the moment may also be a finale" is a
-- product decision somebody will want to make with an INSERT.
--
-- Enforced on `game_slot` by the guard below, so a mis-tag is a constraint
-- violation at the moment a curator makes it rather than a strange Revelle
-- three weeks later.

create table slot_shape (
  slot_code  text not null references slot_kind(code) on delete cascade,
  shape      game_shape not null,
  note       text not null default '',
  created_at timestamptz not null default now(),

  primary key (slot_code, shape)
);

insert into slot_shape (slot_code, shape, note) values
  ('game',         'scheduled', 'The block the evening gives to a game.'),
  ('the_moment',   'scheduled',
   'The thing they retell. Staged, and it takes the time it takes.'),
  ('honouring',    'scheduled',
   'A ritual marking the person. Short, and still a block.'),
  ('day_material', 'scheduled', 'One block per day of something longer.'),
  ('ambient_game', 'ambient',
   'Takes no block. This is the only slot an ambient game may fill, and the '
   'only shape this slot accepts.'),
  ('finale',       'finale',    'At most one, and it is the last thing.');

create or replace function game_slot_shape_guard() returns trigger
language plpgsql as $$
declare
  v_shape game_shape;
  v_ok    boolean;
begin
  select shape into v_shape from game where id = new.game_id;

  -- A slot nothing has claimed a shape for makes no claim about shapes. A pool
  -- that later fills a non-game slot must not be blocked by silence here.
  if not exists (select 1 from slot_shape where slot_code = new.slot_code) then
    return null;
  end if;

  select exists (
    select 1 from slot_shape
     where slot_code = new.slot_code and shape = v_shape
  ) into v_ok;

  if not v_ok then
    raise exception
      '% cannot fill the slot "%": its shape is %.',
      ingredient_label('game', new.game_id), new.slot_code, v_shape
      using
        detail = format('"%s" accepts: %s.', new.slot_code,
                        (select string_agg(shape::text, ', ' order by shape)
                           from slot_shape where slot_code = new.slot_code)),
        hint = 'An ambient game takes no block and belongs in the undercurrent; '
               'a scheduled game takes one and cannot run underneath an '
               'evening. Change game.shape, or claim a different slot.',
        errcode = 'check_violation';
  end if;
  return null;
end;
$$;

create constraint trigger game_slot_shape
  after insert or update on game_slot
  for each row execute function game_slot_shape_guard();

-- The same rule from the other side: changing a game's shape must not leave
-- slot claims behind that the new shape cannot honour.
create or replace function game_shape_change_guard() returns trigger
language plpgsql as $$
declare
  v_bad text;
begin
  if new.shape = old.shape then
    return new;
  end if;

  select string_agg(gs.slot_code, ', ' order by gs.slot_code)
    into v_bad
    from game_slot gs
   where gs.game_id = new.id
     and exists (select 1 from slot_shape ss where ss.slot_code = gs.slot_code)
     and not exists (
       select 1 from slot_shape ss
        where ss.slot_code = gs.slot_code and ss.shape = new.shape);

  if v_bad is not null then
    raise exception
      'Cannot change % to shape %: it still claims %.',
      ingredient_label('game', new.id), new.shape, v_bad
      using
        hint = 'Remove or re-point the game_slot rows first. A shape change '
               'that silently invalidated them would leave the filler placing '
               'it somewhere it cannot run.',
        errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger game_shape_change before update of shape on game
  for each row execute function game_shape_change_guard();

-- ── how many blocks an occasion has ──────────────────────────────────
--
-- The other half of the double-booking answer. `slot_shape` stops an ambient
-- game taking a block; this is the number that stops THREE SCHEDULED GAMES
-- taking three of them.
--
-- On occasion_shape rather than on slot_kind because it is a property of the
-- evening and not of any one slot: a long dinner has room for exactly one
-- thing that stops the table, whatever slot it is placed in, and a weekend has
-- one per day because it has days.
--
-- A NUMBER, NOT A CONSTRAINT. db/009 states the policy and it holds here: this
-- file is filters and weights, the arithmetic is src/lib/selection/, and a
-- trigger that refused a curator's third game would turn her judgement into an
-- error at the worst moment. revelle_game_load below is how the engine and the
-- curator's tool see it.

alter table occasion_shape
  add column scheduled_game_max integer not null default 1
    check (scheduled_game_max between 0 and 14);

comment on column occasion_shape.scheduled_game_max is
  'How many block-occupying games this occasion has room for. Read by the '
  'filler; deliberately not enforced by a constraint. See db/010.';

update occasion_shape set scheduled_game_max = 1
 where occasion in ('dinner_party', 'anniversary', 'holiday', 'no_reason', 'other');
update occasion_shape set scheduled_game_max = 2
 where occasion in ('birthday', 'bridal');
-- One per day. The days are the blocks.
update occasion_shape set scheduled_game_max = 3
 where occasion in ('girls_weekend', 'getaway');

-- WHAT THE FILLER AND THE CURATOR READ.
--
-- One row per Revelle that has any games at all. `overbooked` is the sentence
-- the founder's distinction exists to prevent, said as a boolean; `two_endings`
-- is the other way this goes wrong and is worth its own column because it fails
-- differently — an evening that ends twice did not end the first time.
--
-- The occasion comes through quiz_response, which is where a Revelle's occasion
-- lives; `revelle` has no occasion column and must not grow one.
create view revelle_game_load as
select r.id                                            as revelle_id,
       qr.occasion,
       os.days,
       os.scheduled_game_max,
       count(*) filter (where g.shape = 'scheduled')   as scheduled_games,
       count(*) filter (where g.shape = 'ambient')     as ambient_games,
       count(*) filter (where g.shape = 'finale')      as finale_games,
       -- The evening's programmed minutes, at the top of every range. Ambient
       -- games contribute nothing, which is the whole point of them.
       coalesce(sum(coalesce(g.duration_max_minutes, g.duration_minutes))
                filter (where g.shape = 'scheduled'), 0)
                                                       as scheduled_minutes,
       (count(*) filter (where g.shape = 'scheduled') > os.scheduled_game_max)
                                                       as overbooked,
       (count(*) filter (where g.shape = 'finale') > 1) as two_endings
  from revelle r
  join quiz_response qr on qr.id = r.quiz_response_id
  join occasion_shape os on os.occasion = qr.occasion
  join revelle_game rg on rg.revelle_id = r.id
  join game g on g.id = rg.game_id
 group by r.id, qr.occasion, os.days, os.scheduled_game_max;

comment on view revelle_game_load is
  'Is this Revelle''s evening physically runnable? overbooked means more '
  'block-occupying games than the occasion has blocks. Ambient games never '
  'count toward it. See db/010.';

-- ── the two new slots, in the occasion plans ─────────────────────────
--
-- Every row here is OPTIONAL. A Revelle with no undercurrent is not incomplete,
-- and an evening that simply ends is a real ending. Required would make both a
-- catalogue gap the moment the pool is thin, which is a message to the house
-- about a part of the night that was never promised.
--
-- Read the omissions, they are the content:
--
--   · The long dinner gets NEITHER. There is no "underneath" at one table —
--     everyone is already in the only conversation — and an auction is the
--     opposite of dessert at midnight.
--   · The getaway gets neither, for db/009's stated reason: it is the occasion
--     that most resists being decorated.
--   · The anniversary gets neither. Two people and a quiet room.

insert into occasion_slot
  (occasion, slot_code, pool, min_count, max_count, required, per_day, position, note)
values
  ('birthday', 'ambient_game', 'game', 1, 1, false, false, 55,
   'Runs underneath the whole evening and takes none of it.'),
  ('birthday', 'finale',       'game', 1, 1, false, false, 65,
   'Closes the night on purpose. Spends what the earlier games produced.'),

  ('girls_weekend', 'ambient_game', 'game', 1, 1, false, false, 55,
   'Three days is long enough for a secret to be worth carrying.'),
  ('girls_weekend', 'finale',       'game', 1, 1, false, false, 65, ''),

  ('bridal', 'ambient_game', 'game', 1, 1, false, false, 55, ''),
  ('bridal', 'finale',       'game', 1, 1, false, false, 65, ''),

  ('holiday', 'ambient_game', 'game', 1, 1, false, false, 35, ''),
  ('holiday', 'finale',       'game', 1, 1, false, false, 45, ''),

  ('no_reason', 'ambient_game', 'game', 1, 1, false, false, 35, ''),
  ('no_reason', 'finale',       'game', 1, 1, false, false, 45, '');

-- ── the read the filler does ─────────────────────────────────────────
--
-- Everything about a game that is a FILTER, in one row, so that "what can this
-- host actually be given" is a query and not five joins written slightly
-- differently in three places. Facet scoring is not here and must not come
-- here: db/009 says the arithmetic lives in src/lib/selection/ where it can be
-- tested without a database, and that has not changed.

create view game_placement as
select g.id                as game_id,
       g.slug,
       g.name,
       g.shape,
       g.sourcing,
       g.status,
       g.min_guests,
       g.max_guests,
       g.duration_minutes,
       g.duration_max_minutes,
       lt.lead_time_days,
       lt.items_to_buy,
       lt.items_to_print,
       fr.fragile_requirements,
       fr.fragile_detail,
       (select count(*) from game_printed_matter p where p.game_id = g.id)
                           as printed_pieces,
       (select count(*) from game_dependency d
         where d.game_id = g.id and d.strength = 'required')
                           as required_dependencies,
       -- The slots it may fill, resolved through the shape gate. A game with no
       -- game_slot rows makes no claim and may fill any slot its SHAPE allows,
       -- which is the rule src/lib/selection/occasion.ts implements and this
       -- view must not contradict.
       coalesce(
         (select array_agg(gs.slot_code order by gs.slot_code)
            from game_slot gs
           where gs.game_id = g.id and gs.fit = 'native'),
         (select array_agg(ss.slot_code order by ss.slot_code)
            from slot_shape ss where ss.shape = g.shape)
       )                   as slot_codes
  from game g
  left join game_lead_time lt on lt.game_id = g.id
  left join game_fragility fr on fr.game_id = g.id;

comment on view game_placement is
  'Every FILTER on a game in one row: shape, sourcing, group bounds, duration, '
  'lead time, fragility, and the slots it may fill. No scoring — that is '
  'src/lib/selection/. See db/010.';

-- ─────────────────────────────────────────────────────────────────────
-- WHAT THIS DELIBERATELY DOES NOT DO
--
--   · No games. Content lives in src/lib/games.ts and arrives through
--     scripts/seed-games.mjs. A rule the founder wants reworded should be a
--     diff in a module, not migration 037.
--   · No new facet dimension and no new facet. Every game the house has is
--     describable in the vocabulary db/002 seeded — how these people have fun,
--     what she is buying underneath the occasion, and what ends an evening.
--     Where the vocabulary is genuinely short, the gap is written down and
--     proposed rather than worked around with a private axis; see the note at
--     the top of src/lib/games.ts.
--   · No enforcement of scheduled_game_max, and no enforcement that a finale's
--     dependencies were actually placed. Both are the engine's job, for the
--     reason db/009 gives: a constraint that fires at delivery turns a
--     curator's judgement into an error.
--   · No honouring ritual. Nothing in the house's game pool fills db/009's
--     `honouring` slot, which birthday, anniversary and bridal all require.
--     That is a real catalogue gap and it is left visible on purpose — the
--     engine reports it to the house, which is what a gap is for. Mis-tagging
--     a party game as an honouring beat to make the report go quiet would be
--     the actual bug.
-- ─────────────────────────────────────────────────────────────────────
