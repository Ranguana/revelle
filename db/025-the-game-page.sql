-- Revelle Société — THE GAME PAGE
--
-- Applied by scripts/migrate.mjs after 024, inside one transaction together
-- with its schema_migrations ledger row. Same rule as every file before it:
-- nothing here may be a statement that refuses to run in a transaction.
--
-- New file, never applied anywhere, so no SENTINELS entry in
-- scripts/migrate.mjs.
--
-- ─────────────────────────────────────────────────────────────────────
-- WHAT WAS WRONG, IN ONE EXAMPLE
--
-- `game.how_it_works` for the art battle read, in full:
--
--     One prompt, the same for everyone, and twenty minutes to make something.
--     Nothing is signed. The work goes up anonymously. Each artist gets one
--     minute to explain a piece that is not theirs …
--
-- That is a good paragraph and a useless rule sheet. It does not say who writes
-- the prompts, where everyone paints, HOW WORK GOES UP ANONYMOUSLY WHEN
-- EVERYONE WATCHED EACH OTHER PAINT IT, how the explanations are assigned, who
-- counts the ballots, what happens on a tie, or what to do when two of eleven
-- guests will not pick up a brush. A host standing in her own kitchen at nine
-- o'clock cannot run the game from it.
--
-- ── TWO LEVELS, WHICH IS THE FOUNDER'S OWN STRUCTURE ─────────────────
--
--   THE CARD, in her Revelle.  `game.description` — unchanged, and it stays a
--                              teaser: "Everyone paints the same thing, nobody
--                              signs it, and then everyone lies about somebody
--                              else's." It is doing its job and is not
--                              lengthened.
--   THE GAME PAGE.             What she clicks through to. In depth: what she
--                              sets out before anyone arrives, how to start it,
--                              the sequence with timings, how it is judged, how
--                              it ends, what to do when it goes wrong, and
--                              whether she is playing or running it. Plus the
--                              things she has to get and the things she has to
--                              print, LINKED rather than described again.
--
-- `how_it_works` survives untouched and keeps its old job: the prose account of
-- what the game IS, read while choosing. The runbook is how it is RUN. Two
-- documents with two readers, and this file is the second one.
--
-- ── WHY ROWS AND NOT A LONGER TEXT COLUMN ────────────────────────────
--
-- The precedent is in db/010 and it was made deliberately: `game_supply` and
-- `game_requirement` are rows rather than prose because a lead time has to be
-- sortable, a per-head count has to be multiplied by her guest list, and a
-- fragile requirement has to be findable by The Prep. A runbook has the same
-- property in more places — a step has an order, a clock, a phase, and a thing
-- it points at — and a page that must be readable on a phone with people
-- arriving needs to render the steps as steps, not as one wall of text with the
-- timings buried inside the sentences.
--
-- It also makes the timings CHECKABLE. `game_runbook_clock` below adds up what
-- the steps claim and puts it beside what db/010's duration columns claim, so
-- a runbook that says forty-five minutes and describes seventy is a row a
-- curator can see rather than a discovery a host makes at eleven.
--
-- ── WHAT THIS FILE ADDS ─────────────────────────────────────────────
--
--   runbook_phase         the arc of running anything. Rows, not an enum
--   runbook_trouble_kind  the questions a host actually has at nine o'clock
--   game.host_role        is she playing, or running it
--   game_runbook_step     the runbook itself, ordered, timed, phased
--   game_contingency      one answer per kind of trouble
--   game_supply_product   "small canvases" → the thing she can actually buy
--   game_runbook_clock    do the steps agree with the duration
--   game_runbook_gap      what a game has no answer for. The desk reads it
--
-- ─────────────────────────────────────────────────────────────────────
-- THE RULE FROM db/010 THAT STILL APPLIES, RESTATED BECAUSE IT KEEPS BEING
-- MISREAD
--
-- docs/copy-brief.md bans points, streaks, badges and leaderboards in REVELLE'S
-- OWN INTERFACE. It has nothing to say about a scavenger hunt in which a
-- foreign coin is worth twenty, and nothing to say about a step that says "give
-- them ninety seconds". A timing on a runbook step is not a countdown timer in
-- a product; it is the sentence a host reads before she says go. Do not
-- sanitise it.
-- ─────────────────────────────────────────────────────────────────────

-- ── the phases ───────────────────────────────────────────────────────
--
-- THE ARC OF RUNNING ANYTHING, and the reason the page has shape instead of
-- being a numbered list forty items long.
--
-- ROWS AND NOT AN ENUM, which is the opposite of what db/010 chose for
-- game_shape and game_sourcing, so the difference is worth stating:
--
--   · game_shape is three values that carry DIFFERENT RULES — an ambient game
--     may not have a duration, a finale may not be placed twice. A fourth value
--     would be a real decision about what a game is, and the type system should
--     make somebody argue for it.
--   · a phase carries no rule of its own. It is an ordering and a heading, and
--     the list is not finished — "the morning after" is a phase a weekend game
--     will want, and it should be an INSERT.
--
-- There is a second, blunter reason. scripts/migrate.mjs applies each file as
-- ONE transaction, and PostgreSQL refuses to use an enum value added by
-- `alter type … add value` in the same transaction that added it. A migration
-- that wanted a new phase AND wanted to write steps into it could not be one
-- file. Rows have no such problem.

create table runbook_phase (
  code        text primary key check (code ~ '^[a-z][a-z0-9_]*$'),
  -- What the page prints over this group of steps.
  label       text not null,
  description text not null default '',

  -- Does time spent here come out of the evening? Prep does not: the deadlines
  -- for it are already in game_supply.lead_time_days and a second clock for the
  -- same fact would be a second, wrong answer. Everything from the moment she
  -- calls the room does.
  on_the_clock boolean not null default true,

  -- DOES A STEP IN THIS PHASE REPRODUCE THE GAME ITSELF?
  --
  -- The line db/010 draws for printed matter, drawn again for writing. A
  -- recommended game is somebody else's product: the house may say "charge the
  -- phones, check it is still in the store, hand it over", and may not say
  -- "one player does not see the word". The first is the house's own part and
  -- the second is their rules. The guard below refuses the second for a
  -- recommended game, in both directions.
  reproduces_play boolean not null default false,

  -- The canonical order of the VOCABULARY, which the desk lists phases in. It
  -- is deliberately NOT the order of every runbook: the two games with an
  -- `underway` phase want it on opposite sides of `opening`, because the secret
  -- cards are drawn at the door and then the night runs, while the auction's
  -- money is paid out for four hours before anybody calls the room. A runbook
  -- renders in game_runbook_step.position, which is the curator's order. The
  -- one rule — a phase does not come back, so the page prints one heading per
  -- phase — is checked in src/lib/games.test.ts, where a contiguity rule can be
  -- expressed without a window function in a constraint.
  position    integer not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint runbook_phase_position_unique unique (position)
    deferrable initially deferred
);

create trigger runbook_phase_touch before update on runbook_phase
  for each row execute function set_updated_at();

insert into runbook_phase
  (code, label, description, on_the_clock, reproduces_play, position) values
  ('before', 'Before anyone arrives',
   'What she sets out, prepares and prints. The deadlines are already in '
   'game_supply; these are the things she does on the day with nobody watching.',
   false, false, 10),
  -- The phase a finale needs and nothing else does. The Secret Auction is
  -- thirty minutes long and depends on four hours: the money is paid out across
  -- the whole evening, in cash, by a host who is not yet running anything. That
  -- is not preparation and it is not the sequence, and folding it into either
  -- would put a lie in one of them.
  ('underway', 'While the night goes',
   'What has to be true, and kept true, before this game can start. No clock: '
   'it is happening alongside everything else.',
   false, true, 15),
  ('opening', 'Getting the room',
   'Stopping the talking and starting the game. The hardest thirty seconds a '
   'host has, and the phase most likely to be left out of a rule sheet.',
   true, false, 20),
  ('playing', 'The sequence',
   'What happens, in order, with the clock on it.', true, true, 30),
  ('deciding', 'The count',
   'How it is scored or judged. Who holds the ballots, who counts, who '
   'announces.', true, true, 40),
  ('ending', 'The ending',
   'How it stops. A game that peters out is a failure, and several of these '
   'have a real ending built in.', true, false, 50);

comment on table runbook_phase is
  'The arc of running a game. Rows and not an enum: a phase carries no rule of '
  'its own and the list is not finished. See db/025.';

-- ── the trouble ──────────────────────────────────────────────────────
--
-- THE QUESTIONS A HOST ACTUALLY HAS AT NINE O'CLOCK, as a shared vocabulary.
--
-- Free text per game would have been shorter and would have lost the only thing
-- worth having: with a fixed set of kinds, `game_runbook_gap` can say that a
-- game has no answer for somebody who will not play, which is a hole a curator
-- can close before it is a host's problem. It is exactly the argument db/010
-- makes for game_requirement_kind, and rows for the same reason — "somebody has
-- brought a child" is an insert, not a schema change.

create table runbook_trouble_kind (
  code        text primary key check (code ~ '^[a-z][a-z0-9_]*$'),
  -- The heading on the page, in her words rather than a category name.
  label       text not null,
  description text not null default '',

  -- Should every game answer this one? A refusal, a thin room and a game that
  -- overruns can happen to anything. An odd number cannot happen to a game with
  -- no teams. The check is advisory and lives in the module test and the desk,
  -- never in a constraint — see the note at the foot of this file.
  universal   boolean not null default false,

  position    integer not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint runbook_trouble_kind_position_unique unique (position)
    deferrable initially deferred
);

create trigger runbook_trouble_kind_touch before update on runbook_trouble_kind
  for each row execute function set_updated_at();

insert into runbook_trouble_kind
  (code, label, description, universal, position) values
  ('will_not_play', 'Somebody will not play',
   'One or two people who are not going to pick up a brush, leave the sofa, or '
   'be given a card. The commonest thing that happens and the one least often '
   'written down.', true, 10),
  ('under_minimum', 'Fewer people than it wants',
   'Half the list did not come, or came late. The minimum is a real constraint '
   'and the answer is what to run instead of it, or what to change.', true, 20),
  ('over_size', 'More people than it was built for',
   'Thirty in a room the game was written for twelve of. Usually a matter of '
   'splitting it, and occasionally a matter of not running it.', false, 30),
  ('odd_number', 'The numbers do not divide',
   'Teams, pairs, or a rotation that wants an even room.', false, 40),
  ('running_long', 'It is running long',
   'Where to cut, said in advance, so the cut is a decision and not a '
   'collapse.', true, 50),
  ('played_before', 'Somebody has played it before',
   'A guest who knows the twist, or a house that runs this every year.',
   true, 60),
  ('not_landing', 'It is not landing',
   'The room is polite and quiet and it is not working. How to end it early '
   'without announcing that it failed.', false, 70);

-- ── is she playing, or running it ────────────────────────────────────
--
-- THE FACT SHE NEEDS BEFORE SHE STARTS, and several of these games cannot be
-- both. An auctioneer is not bidding. A referee settling what a foreign coin is
-- worth is not out negotiating for one. Learning that at the moment the game
-- begins is learning it too late.
--
-- An enum, unlike the two tables above, and by the same test: each value
-- carries a different rule about the night. `runs_it` means the game needs a
-- person and that person is spent. `plays_too` means the job is a clock and a
-- pair of hands and she is in it like everyone else. A third value would be a
-- real decision — "hand it to a guest in advance" looked like one and turned
-- out to be a contingency, which is where it now lives.

create type host_role as enum ('runs_it', 'plays_too');

alter table game
  add column host_role host_role not null default 'plays_too',
  -- One sentence, in the curator's words, about what running it costs her.
  -- Null where the role says everything.
  add column host_note text;

comment on column game.host_role is
  'runs_it: running this game spends a person and she is not playing. '
  'plays_too: the job is a clock and she is in it like everyone else. '
  'See db/025.';

-- ── the runbook ──────────────────────────────────────────────────────
--
-- ONE STEP. The unit the page renders and the unit a curator edits.
--
-- Four fields carry the writing and they are separate on purpose, because they
-- are read differently and at different speeds:
--
--   instruction  the imperative, short. What she DOES. This is the line she
--                finds when she looks down at a phone mid-sentence.
--   detail       the sentences that stay hers. Why, or the one true detail that
--                makes the step land. Optional, and a step is not worse for
--                having none.
--   say          WORDS TO SAY OUT LOUD, if there are any. Set apart because
--                they are quoted on the page and because starting a game is the
--                hardest moment a host has: being handed the sentence is worth
--                more than being handed another rule. Never a script she must
--                follow — the words she would have found herself, thirty
--                seconds earlier.
--   minutes      what this takes out of the evening.
--
-- ── AND TWO POINTERS, SO NOTHING IS SAID TWICE ──────────────────────
--
-- `supply_item` and `printed_piece` point at rows that already exist. A step
-- that says "set out the canvases" names the game_supply row rather than
-- restating what it is, how many, and when it had to be bought — all three of
-- which are already columns with a lead time attached. The page resolves the
-- pointer and prints the real thing, including the product link where there is
-- one. A runbook that repeated it would be a second copy that goes stale on the
-- first edit.

create table game_runbook_step (
  game_id     uuid not null references game(id) on delete cascade,
  -- 'hang_the_wall', 'call_the_room'. Machine-stable within a game, so a
  -- curator can reorder without changing what a step IS.
  step        text not null check (step ~ '^[a-z][a-z0-9_]*$'),
  phase       text not null references runbook_phase(code) on delete restrict,

  position    integer not null,

  instruction text not null check (length(btrim(instruction)) > 0),
  detail      text not null default '',
  say         text not null default '',

  -- Minutes of the evening. Null where there is no clock — every step before
  -- anyone arrives, and every step of an ambient game, which runs as long as
  -- the evening does.
  minutes     integer check (minutes is null or minutes between 1 and 600),

  -- The game_supply row this step is about, and the game_printed_matter piece
  -- it hands out. Both optional, both within this same game — enforced below
  -- rather than by a foreign key, because the pair (game_id, item) cascades
  -- from two directions and a composite FK here would make deleting a supply
  -- silently delete the step that tells her to set it out.
  supply_item   text,
  printed_piece text,

  note        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  primary key (game_id, step),
  -- Deferrable: reordering a runbook swaps two positions and the intermediate
  -- state is always a collision.
  constraint game_runbook_step_position_unique unique (game_id, position)
    deferrable initially deferred
);

create trigger game_runbook_step_touch before update on game_runbook_step
  for each row execute function set_updated_at();

create index game_runbook_step_order_idx
  on game_runbook_step (game_id, position);
create index game_runbook_step_phase_idx on game_runbook_step (phase);

comment on table game_runbook_step is
  'THE GAME PAGE. One row per step, ordered, phased and timed. Rows rather '
  'than a longer game.how_it_works for the reason db/010 made game_supply '
  'rows: the structure is what the page renders and what the clock checks. '
  'See db/025.';

-- Everything a step can be wrong about, in one place, so the message names the
-- file the curator has to edit rather than a constraint name.
create or replace function game_runbook_step_guard() returns trigger
language plpgsql as $$
declare
  v_phase   runbook_phase%rowtype;
  v_shape   game_shape;
  v_source  game_sourcing;
begin
  select * into v_phase from runbook_phase where code = new.phase;
  select shape, sourcing into v_shape, v_source from game where id = new.game_id;

  if new.minutes is not null and not v_phase.on_the_clock then
    raise exception
      'Step "%" of % is in the "%" phase and cannot have a clock.',
      new.step, ingredient_label('game', new.game_id), new.phase
      using
        hint = 'Time spent before anyone arrives does not come out of the '
               'evening, and its deadline is already game_supply.lead_time_days. '
               'A second clock for the same fact is a second, wrong answer.',
        errcode = 'check_violation';
  end if;

  if new.minutes is not null and v_shape = 'ambient' then
    raise exception
      'Step "%" of % has a clock, and an ambient game has none.',
      new.step, ingredient_label('game', new.game_id)
      using
        hint = 'db/010: an ambient game consumes no block and runs as long as '
               'the evening does. Its runbook says when things happen relative '
               'to the night, never how many minutes it takes.',
        errcode = 'check_violation';
  end if;

  if v_phase.reproduces_play and v_source = 'recommended' then
    raise exception
      'Step "%" of % is in the "%" phase, and % is recommended, not provided.',
      new.step, ingredient_label('game', new.game_id), new.phase,
      ingredient_label('game', new.game_id)
      using
        hint = 'A recommended game is somebody else''s product. The house may '
               'write its own part — what to set out, how to start it, how to '
               'hand it over, what to do when the signal drops — and may not '
               'write how the game is played or scored. If the house genuinely '
               'owns this game, change game.sourcing first.',
        errcode = 'check_violation';
  end if;

  if new.supply_item is not null
     and not exists (select 1 from game_supply s
                      where s.game_id = new.game_id and s.item = new.supply_item) then
    raise exception
      'Step "%" of % points at a supply that game does not have: "%".',
      new.step, ingredient_label('game', new.game_id), new.supply_item
      using
        hint = 'A step names a game_supply row rather than restating it, so '
               'the page can print the count, the lead time and the product '
               'link from the row that already holds them.',
        errcode = 'foreign_key_violation';
  end if;

  if new.printed_piece is not null
     and not exists (select 1 from game_printed_matter p
                      where p.game_id = new.game_id and p.piece = new.printed_piece) then
    raise exception
      'Step "%" of % hands out printed matter that game does not have: "%".',
      new.step, ingredient_label('game', new.game_id), new.printed_piece
      using
        hint = 'Add the game_printed_matter row first, or point at one that '
               'exists. A step telling her to hand out a thing nothing renders '
               'is the failure this pointer exists to prevent.',
        errcode = 'foreign_key_violation';
  end if;

  return null;
end;
$$;

create constraint trigger game_runbook_step_valid
  after insert or update on game_runbook_step
  deferrable initially immediate
  for each row execute function game_runbook_step_guard();

-- The same line from the other side, exactly as db/010 does for printed matter.
-- A one-way check is a check somebody routes around by doing the two operations
-- in the other order.
create or replace function game_sourcing_release_runbook() returns trigger
language plpgsql as $$
declare
  v_steps text;
begin
  if new.sourcing <> 'recommended' or old.sourcing = 'recommended' then
    return new;
  end if;

  select string_agg(s.step, ', ' order by s.position)
    into v_steps
    from game_runbook_step s
    join runbook_phase p on p.code = s.phase
   where s.game_id = new.id and p.reproduces_play;

  if v_steps is not null then
    raise exception
      'Cannot mark % recommended: its runbook still plays the game (%).',
      ingredient_label('game', new.id), v_steps
      using
        hint = 'Delete those steps first, deliberately. Instructions for how '
               'somebody else''s game is played would keep shipping in every '
               'reprint of a Revelle that has it.',
        errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger game_sourcing_release_runbook_steps
  before update of sourcing on game
  for each row execute function game_sourcing_release_runbook();

-- Changing a game's shape to ambient must not leave a runbook full of clocks,
-- for the same reason db/010's game_shape_change_guard exists.
create or replace function game_shape_change_runbook_guard() returns trigger
language plpgsql as $$
declare
  v_clocked integer;
begin
  if new.shape = old.shape or new.shape <> 'ambient' then
    return new;
  end if;

  select count(*) into v_clocked
    from game_runbook_step where game_id = new.id and minutes is not null;

  if v_clocked > 0 then
    raise exception
      'Cannot make % ambient: its runbook still puts a clock on its steps.',
      ingredient_label('game', new.id)
      using
        hint = 'An ambient game takes no block. Clear the minutes from its '
               'steps first — what is left should say when things happen '
               'relative to the night, not how long they take.',
        errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger game_shape_change_runbook before update of shape on game
  for each row execute function game_shape_change_runbook_guard();

-- ── what to do when it goes wrong ────────────────────────────────────
--
-- One answer per kind of trouble. Separate from the steps because it is read
-- differently: the sequence is scrolled, and this is LOOKED UP, at speed, by
-- somebody whose evening has just developed a problem. On a phone it is the
-- part she opens; on the page it is never mixed into the steps, where it would
-- be six paragraphs of hypothetical between "go" and "call time".

create table game_contingency (
  game_id    uuid not null references game(id) on delete cascade,
  trouble    text not null
               references runbook_trouble_kind(code) on delete restrict,
  -- What she does. Written as an instruction, not as reassurance.
  answer     text not null check (length(btrim(answer)) > 0),
  position   integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  primary key (game_id, trouble)
);

create trigger game_contingency_touch before update on game_contingency
  for each row execute function set_updated_at();

create index game_contingency_trouble_idx on game_contingency (trouble);

-- ── the shopping edit, meeting the games ─────────────────────────────
--
-- "Small canvases or thick paper" is a sentence. The `product` pool is a thing
-- she can actually buy, with a supplier, a price and an external_url — and the
-- two have never been joined, so The Edit and The Prep have been two lists of
-- overlapping objects that do not know about each other.
--
-- A JOIN AND NOT A COLUMN ON game_supply, for two reasons. One supply is
-- several products often enough — paint, markers and something to collage with
-- is a line and a basket — and one product serves several games, which is the
-- whole reason a pool exists.
--
-- OPTIONAL, and deliberately so. A supply with no product row is not
-- incomplete: "a bowl" and "a timer" are things she has, and the page says
-- plainly what to get rather than sending her shopping for a kitchen timer.

create table game_supply_product (
  game_id    uuid not null,
  item       text not null,
  product_id uuid not null references product(id) on delete cascade,
  -- Why this one. 'The size the founder has actually run it with.'
  note       text,
  position   integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  primary key (game_id, item, product_id),
  -- The pair IS the supply's identity, so this one can be a real foreign key:
  -- deleting the game cascades to the supply, and the supply to this.
  foreign key (game_id, item) references game_supply (game_id, item)
    on update cascade on delete cascade
);

create trigger game_supply_product_touch before update on game_supply_product
  for each row execute function set_updated_at();

create index game_supply_product_product_idx on game_supply_product (product_id);

comment on table game_supply_product is
  'Where a game''s supply is a thing in The Edit, this is the link. Optional: '
  'a supply with no product is a plain instruction to go and get something, '
  'which is the right answer for a bowl. See db/025.';

-- ── does the runbook agree with the duration ─────────────────────────
--
-- THE CHECK THE WHOLE STRUCTURE BUYS.
--
-- db/010's duration_minutes is what the filler plans the evening against, and a
-- runbook is the only thing that knows whether it is true. Adding up the steps
-- and putting the total beside the claim turns "forty-five minutes" from a
-- number somebody typed into a number somebody can be wrong about in public.
--
-- A VIEW AND NOT A CONSTRAINT, and this is db/010's policy holding rather than
-- being ducked: a curator editing a runbook passes through a dozen states where
-- the steps do not add up, and a trigger would turn her afternoon into a fight.
-- The module test in src/lib/games.test.ts fails the build when the AUTHORED
-- runbooks disagree, which is the moment where being strict costs nothing.

create view game_runbook_clock as
select g.id                                        as game_id,
       g.slug,
       g.name,
       g.shape,
       g.duration_minutes                          as claimed_low,
       g.sourcing,
       g.duration_max_minutes                      as claimed_high,
       count(s.*)                                  as steps,
       count(s.*) filter (where s.minutes is not null) as timed_steps,
       coalesce(sum(s.minutes), 0)                 as planned_minutes,
       -- Null where there is nothing to compare: an ambient game, or a runbook
       -- nobody has put a clock on yet. False is a claim; null is silence.
       case
         -- A recommended game's runbook is the house's own part only: check
         -- the app, charge the phones, decide when to stop. The play is
         -- somebody else's and the house does not write it, so it cannot add
         -- it up either. Silence, not a false claim.
         when g.sourcing = 'recommended' then null
         when g.duration_max_minutes is null then null
         when count(s.*) filter (where s.minutes is not null) = 0 then null
         else coalesce(sum(s.minutes), 0) > g.duration_max_minutes
           or coalesce(sum(s.minutes), 0) < coalesce(g.duration_minutes, 0)
       end                                         as disagrees
  from game g
  left join game_runbook_step s on s.game_id = g.id
 group by g.id, g.slug, g.name, g.shape, g.sourcing,
          g.duration_minutes, g.duration_max_minutes;

comment on view game_runbook_clock is
  'planned_minutes is what the steps add up to; claimed_low/high is what '
  'db/010 says. disagrees is the sentence a host would otherwise discover at '
  'eleven o''clock. Not enforced — see db/025.';

-- WHAT A GAME HAS NO ANSWER FOR.
--
-- The reason runbook_trouble_kind is a vocabulary and not free text. A game
-- with a runbook and no answer for somebody who will not play has a hole, and a
-- hole a query can find is a hole the desk can show before it is a host's
-- problem at nine o'clock.
create view game_runbook_gap as
select g.id as game_id, g.slug, g.name,
       k.code  as trouble,
       k.label as trouble_label
  from game g
  cross join runbook_trouble_kind k
 where k.universal
   and exists (select 1 from game_runbook_step s where s.game_id = g.id)
   and not exists (select 1 from game_contingency c
                    where c.game_id = g.id and c.trouble = k.code);

comment on view game_runbook_gap is
  'One row per universal kind of trouble a game with a runbook does not answer. '
  'Empty is the goal. See db/025.';

-- ─────────────────────────────────────────────────────────────────────
-- WHAT THIS DELIBERATELY DOES NOT DO
--
--   · No runbooks. Content lives in src/lib/games.ts and arrives through
--     scripts/seed-games.mjs, for the reason db/010 states at length: a rule
--     the founder wants reworded should be a diff a human can read in a pull
--     request, not migration 037.
--   · It does not touch game.description or game.how_it_works. The card is
--     good and the founder said so; the prose account is a different document
--     with a different reader. Nothing here replaces either.
--   · No constraint on the clock, and none on the gaps. Both are reports. A
--     database that refused a curator's half-finished runbook would be a
--     database she edits somewhere else.
--   · No per-destination runbooks. A game is run the same way in Westhampton
--     and in Havana; what changes is the typeface on the ballot and the words
--     on the prompt cards, and both of those are already game_printed_matter
--     joined to db/004's voice. A second axis here would be a second place for
--     the rules to drift.
--   · No ordering between a runbook step and the evening's other slots. "Do
--     this after dinner" is a property of the plan, not of the game, and the
--     place for it is db/009's slot positions.
-- ─────────────────────────────────────────────────────────────────────
