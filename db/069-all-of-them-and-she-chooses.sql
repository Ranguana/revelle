-- ── 069 · ALL OF THEM, AND SHE CHOOSES ───────────────────────────────
--
-- Applied by scripts/migrate.mjs after 068, inside one transaction together
-- with its schema_migrations ledger row.
--
-- Founder, 2026-09-06, three sentences over about two minutes:
--
--   "field day can be multi day or one day - host chooses itinerary, which is
--    a gap we discussed earlier about host ability to edit menus and
--    itineraries. field day games include all and she chooses for the daily
--    newsletter/itinerary."
--
--   "fix the field day."
--
--   "it is a set across different days if host wants it."
--
-- ═════════════════════════════════════════════════════════════════════
-- WHAT WAS WRONG, IN ONE SENTENCE
-- ═════════════════════════════════════════════════════════════════════
--
-- db/068 put the five field day games on `day_material`, a beat that offers
-- ONE candidate per day. So the engine dealt one game per afternoon and she
-- chose nothing. The offer was a sample and her ruling is a set; the placement
-- was the house's and her ruling is hers. Both clauses failed, and the failure
-- was declared in the games themselves rather than hidden — which is why this
-- file exists a day later instead of a year later.
--
-- ═════════════════════════════════════════════════════════════════════
-- THE SHAPE HER THIRD SENTENCE FORCES
-- ═════════════════════════════════════════════════════════════════════
--
-- "It is a set across different days if host wants it" retires the obvious
-- design before it was built. The tempting shape was: five games, one beat,
-- one afternoon, held together by something like `coherence_group` so they
-- land as a lump. THAT IS THE WRONG INVARIANT and it is worth naming because
-- it is the shape a later reader will try to restore.
--
--     THE SET IS AN OFFER AND A NAME. IT IS NOT A PLACEMENT.
--
-- What travels together is the OFFER — all five arrive, one identity, one
-- heading. What she decides is which members run AND WHEN, per member. The
-- rope on Saturday, the egg and the bucket line on Sunday, the sack race not
-- at all. Nothing about that is expressible if the five are welded to one beat,
-- one day index or one slot instance, so none of those is built here.
--
-- ═════════════════════════════════════════════════════════════════════
-- 1 · AN OFFER IS NOT ALWAYS AN OR
-- ═════════════════════════════════════════════════════════════════════
--
-- db/061 built the carousel on a sentence of hers — "as an or not an and" —
-- and everything it wrote is right about the beat it was written for. One game
-- reaches the evening; she is shown three; taking one clears the others. The
-- partial unique index says so, and `src/lib/portal/choice.ts` says so twice
-- more in one `case` expression.
--
-- THE FIELD DAY IS THE OTHER KIND, and it is not a loosening of db/061's rule.
-- It is a second rule alongside it:
--
--   one_of   n candidates, all delivered, EXACTLY ONE runs. db/061's carousel.
--            Every offer this system has ever made. The default.
--   any_of   n candidates, all delivered, ANY NON-EMPTY SUBSET runs, each
--            scheduled independently. "Include all, and she chooses."
--
-- Written as a value on `occasion_slot` and not as a special case for the
-- field day, for db/061's own stated reason about `offer_count`: the mechanism
-- is registered pool-agnostically on the slot, so what it does has to be too.
-- A beat over any pool may one day want the same thing — three side dishes of
-- which she serves two is exactly this shape — and a game-only flag would make
-- that unrecordable while the plan happily produced it (rule 16).
--
-- ── AND THE JOIN ROW STAMPS IT RATHER THAN POINTING AT IT ────────────
--
-- This is the load-bearing schema decision in the file and it looks wrong at
-- first glance, so the argument is written where the column is.
--
-- `revelle_<pool>.offer_exclusive` is a COPY of what the slot said, taken at
-- delivery, not a pointer to what the slot says now. That reads like rule 21's
-- duplication of authority until the narrow test is actually applied: MUST TWO
-- SURFACES AGREE ABOUT THIS?
--
-- NO. THEY MUST BE ALLOWED TO DIFFER. db/003 binds an assemblage at delivery
-- and db/061 binds the OFFER: what she was given is fixed, forever, and a
-- curator changing `occasion_slot.offer_rule` next March must not reach back
-- and turn a Revelle already in somebody's hands into a different kind of
-- promise. If the index read through to the slot, that is exactly what would
-- happen — a host who had chosen three field day games would discover the
-- database now refuses two of them.
--
-- So it is stamped, and it is stamped for the same reason `offer_group` is
-- stamped rather than being a foreign key into `occasion_slot`. db/061 made
-- this decision already; this file only makes the second half of it explicit.
--
-- ═════════════════════════════════════════════════════════════════════
-- 2 · WHEN SHE RUNS IT — `run_day`
-- ═════════════════════════════════════════════════════════════════════
--
-- Her third sentence needs a column and there was not one. A delivered row
-- carried `slot_code`, `slot`, `position`, `offer_group` and `chosen_at`, and
-- none of those can say Saturday.
--
-- `run_day` is 1-based and null means SHE HAS NOT SAID — never "day one".
-- The difference matters at the only place it is read: a morning bulletin for
-- day two must print what she put on day two, and a game she has chosen and
-- not scheduled has to be legible as unscheduled rather than silently landing
-- on the first morning.
--
-- IT IS OUTSIDE THE FINGERPRINT, with `chosen_at`, `slot` and `position`.
-- db/002's judgement note and db/061's argument both apply unchanged: it
-- records where a thing sits in her Revelle, not which things she has. She may
-- move it as often as she likes, forever, and the house has nothing to say.
--
-- THE UPPER BOUND IS A TRIGGER AND NOT A CHECK, because it needs the
-- occasion's own day count and a CHECK cannot join. Stated rather than left
-- implicit: `revelle` reaches `occasion_shape` through `quiz_response`, which
-- is the same path db/010's `scheduled_game_max` gate already walks.
--
-- ═════════════════════════════════════════════════════════════════════
-- 3 · A ONE-DAY FIELD DAY, WITHOUT GIVING A DINNER PARTY A SACK RACE
-- ═════════════════════════════════════════════════════════════════════
--
-- "Field day can be multi day or one day." db/068 gave the day beat where
-- `occasion_shape.days > 1`, and a day count is the wrong instrument for this
-- question — it is an inference, and CLAUDE.md rule 30 has already paid for
-- the general form: A DECLARED IDENTITY, NEVER AN INFERRED ONE. An
-- under-authored table room reading as a healthy incidental room is the same
-- bug as a one-day occasion reading as an occasion with no daylight in it.
--
-- So `occasion_shape.daytime` is DECLARED. Does this occasion have a daytime
-- the house may put material in?
--
-- BACKFILLED TO `days > 1`, which is not a shortcut — it is what the catalogue
-- means today, in its own words. Every one-day occasion db/009 wrote describes
-- itself as an evening: "One table, one evening"; "One evening, and one beat
-- where the person is marked"; "One evening, honoured"; "One evening the
-- calendar chose"; "One evening, nothing to mark"; and `other` "Defaults to
-- one evening, and the engine says so rather than pretending it knew."
--
-- WHICH MEANS THE HONEST ANSWER TO "A ONE-DAY FIELD DAY" IS TWO ANSWERS, AND
-- THE SECOND IS AN AUTHORING ABSENCE RATHER THAN A REFUSAL (rule 29):
--
--   1. ON A MULTI-DAY OCCASION SHE MAY ALREADY RUN A ONE-DAY FIELD DAY, and
--      that is most of what her sentence asks for. The set is offered once,
--      not once per day, and she puts every member she wants on the same
--      `run_day`. One afternoon, five games, her call — or spread over three.
--      That is precisely "multi day or one day - host chooses", and it is why
--      the beat below is NOT `per_day`.
--
--   2. A ONE-EVENING OCCASION STILL HAS NO DAYTIME, and this file does not
--      invent one. Giving every occasion a daytime beat is the flattening that
--      cost db/061 its deletion, and a dinner party is not entitled to a sack
--      race. What is missing is an OCCASION THE CATALOGUE DOES NOT HAVE — a
--      lunch, an afternoon, a day event — and admitting one is hers, not a
--      migration's. The moment such a row exists with `daytime = true`, the
--      predicate below gives it the field day with no edit to this file, which
--      is the whole reason the column is declared rather than derived.
--
-- ═════════════════════════════════════════════════════════════════════
-- 4 · THE BEAT ITSELF, AND WHY IT IS OPTIONAL
-- ═════════════════════════════════════════════════════════════════════
--
-- `field_day`, drawing the game pool, `offer_rule = 'any_of'`, NOT `per_day`,
-- and NOT required.
--
-- NOT `per_day` is her third sentence in one column: a per-day beat would
-- offer the set again every morning and weld each offer to its day, which is
-- the welding she just ruled out. One offer, five members, and the day is a
-- property of the member.
--
-- NOT REQUIRED, and this is a judgement worth its paragraph. Exactly one room
-- in the catalogue has field day games. A required beat would report a gap on
-- every multi-day Revelle in seventeen other rooms, forever, for a set those
-- rooms were never going to have — and CLAUDE.md already knows what that
-- produces: "a tripwire that has been amber since it was installed stops being
-- read, and it is worse than no tripwire, because the amber is now evidence
-- that amber is normal." Rule 15 wants a gap that CAN reach zero. This one
-- cannot, by construction, so it is not made a gap at all.
--
-- `excluded_by = 'no_games'` because a field day is unmistakably games, and a
-- host who said her people hate them should not be handed five.
--
-- ═════════════════════════════════════════════════════════════════════
-- 5 · MOVING THE FIVE, AND THE NEAR-MISS THIS FILE IS MOST EXPOSED TO
-- ═════════════════════════════════════════════════════════════════════
--
-- CLAUDE.md, in this repository's own words: REMOVING A SLOT ORPHANS THE
-- CLAIMS ON IT, AND CLAIMS ARE WHITELISTS. db/061 paid for that sentence and
-- db/068 paid for its mirror. This file does BOTH at once — it takes a claim
-- off `day_material` and puts one on a slot that did not exist a minute ago —
-- so both counts are taken, before and after, in both directions:
--
--   · `day_material` must still be claimed by the ten games that are not the
--     field day. Its beat is untouched and those ten stay exactly as placeable
--     as db/068 left them.
--   · `field_day` must be claimed by five. A brand-new beat nothing claims is
--     the mirror failure, and it is silent: no error, no gap, just a beat that
--     never fills.
--   · No game may be left claiming only beats no occasion has.
--
-- ── RULE 33: SCRATCH-SEEDED VERSUS PRODUCTION-UNSEEDED ───────────────
--
-- Every constraint added here backfills before it constrains, in the same
-- statement or immediately above it:
--
--   occasion_shape.daytime    `not null default false`, then the backfill to
--                             `days > 1`, then it is read. No seeder supplies
--                             it.
--   occasion_slot.offer_rule  `not null default 'one_of'`, which is what every
--                             existing row means.
--   offer_exclusive           BACKFILLED TO true FOR EVERY ROW THAT HAS AN
--                             OFFER, before the check and before the index
--                             that reads it. Every offer delivered before
--                             today was a db/061 carousel and was exclusive;
--                             that is a fact, not a guess.
--   run_day                   starts null everywhere, which means she has not
--                             said. Nothing is invented.
--   game_slot                 the seeder is INSERT-ONLY and will not repair a
--                             row production already holds, so the claim move
--                             is written twice — authored in src/lib/games.ts
--                             for every future build, backfilled below for the
--                             rows production has. db/061 section 4b's exact
--                             pattern, and neither half covers both cases.
--
-- AND WHAT THE COUNTS CANNOT SEE, said plainly: on a scratch build `game` is
-- EMPTY when migrations run, so every claim count below is vacuously zero and
-- proves nothing. It is green there because there is nothing to be wrong
-- about. `src/lib/games.test.ts` and `src/lib/day-material.test.ts` assert the
-- authored half with no database at all.


-- ── 0. THE COUNT, BEFORE ─────────────────────────────────────────────

do $$
declare
  v_games   integer;
  v_day     integer;
  v_offers  integer;
  v_daytime integer;
begin
  select count(*) into v_games from game;
  select count(*) into v_day
    from game_slot where slot_code = 'day_material' and fit = 'native';
  select count(*) into v_daytime from occasion_shape where days > 1;

  execute
    'select count(*) from revelle_game where offer_group is not null'
    into v_offers;

  raise notice
    'db/069 BEFORE — % game(s) in the catalogue, % claiming day_material; '
    '% occasion(s) will be declared daytime; % delivered game row(s) sit in '
    'an offer.', v_games, v_day, v_daytime, v_offers;

  if exists (select 1 from slot_kind where code = 'field_day') then
    raise exception 'db/069: a `field_day` slot already exists.'
      using hint = 'This file creates it. Read both before deleting a check.';
  end if;
end;
$$;


-- ── 1. AN OCCASION DECLARES WHETHER IT HAS A DAYTIME ─────────────────

create type offer_rule as enum ('one_of', 'any_of');

alter table occasion_shape
  add column daytime boolean not null default false;

comment on column occasion_shape.daytime is
  'DOES THIS OCCASION HAVE A DAYTIME the house may put material in? DECLARED, '
  'never inferred from `days` — a day count answers a different question, and '
  'an occasion that runs one day may still be an afternoon. Read by db/069''s '
  'field day beat and by anything else that needs daylight. See db/069.';

-- THE BACKFILL, AND IT IS THE CATALOGUE'S OWN WORDS RATHER THAN A GUESS.
-- Every one-day occasion db/009 wrote describes itself as an evening.
update occasion_shape set daytime = (days > 1);

do $$
declare r record;
begin
  for r in select occasion, days, daytime from occasion_shape order by occasion
  loop
    raise notice 'db/069 — % (% day(s)) daytime = %', r.occasion, r.days, r.daytime;
  end loop;
end;
$$;


-- ── 2. AN OFFER SAYS WHETHER IT IS AN OR ─────────────────────────────

alter table occasion_slot
  add column offer_rule offer_rule not null default 'one_of';

comment on column occasion_slot.offer_rule is
  'WHAT KIND OF CHOICE THIS BEAT ASKS FOR. `one_of` is db/061''s carousel — n '
  'delivered, exactly one runs, taking one clears the rest. `any_of` is '
  '"include all and she chooses" — n delivered, any non-empty subset runs, '
  'each scheduled independently on its own run_day. The default is `one_of`, '
  'which is what every offer made before db/069 was.';


-- ── 3. THE FIELD DAY BEAT ────────────────────────────────────────────

insert into slot_kind (code, label, description, section, per_guest, position)
values
  ('field_day', 'The field day',
   'The whole set of field day games, offered together. She says which of them '
   'run and on which day — they need not all be on the same one, and they need '
   'not all run. A beat that is a NAME and an OFFER rather than a placement.',
   'details', false, 65);

update slot_kind set excluded_by = 'no_games' where code = 'field_day';

insert into slot_shape (slot_code, shape, note) values
  ('field_day', 'scheduled',
   'A race occupies an afternoon the way a scheduled game occupies an hour. '
   'db/010''s only shape for a beat that takes a block.');

-- DRIVEN OFF `daytime`, NEVER OFF A LIST OF OCCASION NAMES AND NEVER OFF THE
-- DAY COUNT (rule 19, and section 3 of the header for why the day count is the
-- wrong question). A tenth occasion declared daytime gets the field day here
-- with no edit to this file.
--
-- `offer_count` IS A CEILING ON AN `any_of` BEAT, not a target — "up to this
-- many, and the room supplies what it has". Eight rather than five so the set
-- may grow without a migration, and `src/lib/games.test.ts` fails if the
-- authored set ever outgrows it, which is the number that can actually reach
-- zero. Unfilled units drop exactly as db/061 specified: no gap, no error, no
-- padding, and the portal says plainly how many the room offered.
insert into occasion_slot
  (occasion, slot_code, pool, min_count, max_count, required, per_day,
   offer_count, offer_rule, position, note)
select sh.occasion, 'field_day', 'game', 1, 1, false, false, 8, 'any_of', 65,
       'All the field day games the room has, offered together. She chooses '
       'which run and on which day; they are a SET by identity and not by '
       'placement, so nothing here makes them land on the same afternoon. '
       'Optional because one room in the catalogue has them and a required '
       'beat seventeen rooms cannot fill is a tripwire that is amber forever. '
       'See db/069.'
  from occasion_shape sh
 where sh.daytime;


-- ── 4. WHERE THE CHOICE AND THE DAY LIVE ─────────────────────────────
--
-- On every join table by a loop over the registry and on the installer, for
-- db/061's reason: the mechanism is registered pool-agnostically on
-- `occasion_slot`, so the record of what it did has to be too.

do $$
declare p record;
begin
  for p in select * from ingredient_pool where join_table is not null loop
    execute format(
      'alter table %I
         add column offer_exclusive boolean,
         add column run_day         integer',
      p.join_table);

    -- BACKFILL BEFORE CONSTRAINING (rule 33). Every offer delivered before
    -- today was a db/061 carousel, so every row that has an offer group had an
    -- exclusive one. A fact, not a guess.
    execute format(
      'update %I set offer_exclusive = true where offer_group is not null',
      p.join_table);

    execute format(
      'comment on column %I.offer_exclusive is %L',
      p.join_table,
      'WHAT KIND OF OFFER THIS ROW ARRIVED IN, stamped at delivery from '
      'occasion_slot.offer_rule and never read back through to it. True = one '
      'of them runs (db/061). False = she runs any of them. Null = no offer, '
      'the house placed it. STAMPED AND NOT A POINTER, because a curator '
      'changing the slot must not turn a delivered Revelle into a different '
      'kind of promise. See db/069.');

    execute format(
      'comment on column %I.run_day is %L',
      p.join_table,
      'WHICH DAY OF HER OCCASION she is running this on, 1-based. Null means '
      'SHE HAS NOT SAID and never "day one". Outside the assemblage '
      'fingerprint with slot, position and chosen_at: it records where a thing '
      'sits in her Revelle, not which things she has. See db/069.');

    -- AN OFFER HAS A KIND, AND A ROW WITH NO OFFER HAS NONE. Both directions,
    -- because a null kind on an offered row would read as "not exclusive" to
    -- the index below and quietly let a carousel hold two chosen cards.
    execute format(
      'alter table %I add constraint %I
         check ((offer_group is null) = (offer_exclusive is null))',
      p.join_table, p.join_table || '_offer_has_a_kind');

    -- YOU CANNOT SCHEDULE WHAT YOU ARE NOT RUNNING. The same shape as db/061's
    -- `chosen_was_offered`, one step further down the same chain.
    execute format(
      'alter table %I add constraint %I
         check (run_day is null or (run_day >= 1 and chosen_at is not null))',
      p.join_table, p.join_table || '_day_belongs_to_a_choice');

    -- ── db/061'S INDEX, NARROWED TO THE OFFERS IT WAS WRITTEN FOR ────
    --
    -- It said "at most one chosen per offer" of every offer there was, which
    -- was every offer db/061 could make. It now says the same thing of the
    -- exclusive ones and says nothing about the others, which is the whole
    -- mechanical content of `any_of`.
    execute format('drop index %I', p.join_table || '_one_choice');
    execute format(
      'create unique index %I on %I (revelle_id, offer_group)
         where offer_group is not null and chosen_at is not null
           and offer_exclusive',
      p.join_table || '_one_choice', p.join_table);
  end loop;
end;
$$;

-- AND THE DAY SHE PICKS IS A DAY HER OCCASION HAS. A trigger and not a check,
-- because the bound lives in `occasion_shape` and a check cannot join. The path
-- from a delivered row to its occasion is revelle -> quiz_response -> occasion,
-- which is the path db/010's game cap already walks.
create or replace function revelle_run_day_in_range() returns trigger
language plpgsql as $$
declare v_days integer;
begin
  if new.run_day is null then return new; end if;

  select os.days into v_days
    from revelle r
    join quiz_response qr on qr.id = r.quiz_response_id
    join occasion_shape os on os.occasion = qr.occasion
   where r.id = new.revelle_id;

  if v_days is null then
    raise exception
      'Cannot schedule a Revelle ingredient: its occasion has no shape row.'
      using hint = 'occasion_shape has one row per occasion_type by '
                   'construction (db/009). A missing one is a broken chain, '
                   'not a member''s mistake.';
  end if;

  if new.run_day > v_days then
    raise exception
      'Day % is outside this occasion, which runs % day(s).',
      new.run_day, v_days
      using hint = 'run_day is 1-based and bounded by occasion_shape.days. '
                   'Null means she has not said, which is always allowed.';
  end if;

  return new;
end;
$$;

do $$
declare p record;
begin
  for p in select * from ingredient_pool where join_table is not null loop
    execute format(
      'create constraint trigger %I after insert or update of run_day on %I
         deferrable initially deferred
         for each row when (new.run_day is not null)
         execute function revelle_run_day_in_range()',
      p.join_table || '_run_day', p.join_table);
  end loop;
end;
$$;


-- ── 5. THE INSTALLER, SO THE NEXT POOL ARRIVES KNOWING ───────────────

create or replace function install_revelle_ingredients(
  p_entity_table  text,
  p_label         text,
  p_label_column  text default 'name',
  p_active_column text default null,
  p_active_value  text default null,
  p_typical_draw  integer default 1
) returns void
language plpgsql as $$
declare
  v_join   text := 'revelle_' || p_entity_table;
  v_column text := p_entity_table || '_id';
begin
  execute format($ddl$
    create table %I (
      revelle_id  uuid not null references revelle(id) on delete cascade,
      -- restrict, not cascade: a pooled ingredient that has been issued to
      -- somebody cannot be deleted out from under her Revelle. Retire it.
      %I          uuid not null references %I(id) on delete restrict,
      -- Where it sits in her Revelle. Recorded, but NOT part of the assemblage
      -- fingerprint — see the judgement note in db/002.
      slot        section_kind,
      -- WHICH SLOT OF HER OCCASION it filled. Finer than `slot`, which is the
      -- block it renders into. Added by db/009.
      slot_code   text references slot_kind(code) on delete restrict,
      -- WHICH SET OF ALTERNATIVES, or null when the house simply placed it.
      -- Added by db/061.
      offer_group text,
      -- WHAT KIND OF OFFER, stamped at delivery and never read back through to
      -- occasion_slot. True = one of them runs; false = she runs any of them;
      -- null = no offer. Added by db/069.
      offer_exclusive boolean,
      -- WHEN SHE TOOK THIS ONE. Null means not taken. Outside the fingerprint
      -- on purpose: the offer binds, the choice does not. Added by db/061.
      chosen_at   timestamptz,
      -- WHICH DAY she is running it on, 1-based. Null means she has not said.
      -- Outside the fingerprint, with chosen_at. Added by db/069.
      run_day     integer,
      position    integer,
      note        text,
      created_at  timestamptz not null default now(),

      primary key (revelle_id, %I),
      constraint %I check (chosen_at is null or offer_group is not null),
      constraint %I check ((offer_group is null) = (offer_exclusive is null)),
      constraint %I check (run_day is null
                           or (run_day >= 1 and chosen_at is not null))
    )$ddl$,
    v_join, v_column, p_entity_table, v_column,
    v_join || '_chosen_was_offered',
    v_join || '_offer_has_a_kind',
    v_join || '_day_belongs_to_a_choice');

  execute format(
    'create index %I on %I (%I)', v_join || '_ingredient_idx', v_join, v_column);

  -- At most one chosen per EXCLUSIVE offer. db/061 wrote it; db/069 narrowed
  -- it to the offers db/061 was written for.
  execute format(
    'create unique index %I on %I (revelle_id, offer_group)
       where offer_group is not null and chosen_at is not null
         and offer_exclusive',
    v_join || '_one_choice', v_join);

  execute format(
    'create constraint trigger %I after insert or update of run_day on %I
       deferrable initially deferred
       for each row when (new.run_day is not null)
       execute function revelle_run_day_in_range()',
    v_join || '_run_day', v_join);

  execute format(
    'create trigger %I after insert or update or delete on %I
       for each row execute function revelle_ingredient_changed()',
    v_join || '_fingerprint', v_join);

  insert into ingredient_pool
    (entity_table, join_table, label, label_column, active_column, active_value,
     typical_draw)
  values (p_entity_table, v_join, p_label, p_label_column, p_active_column,
          p_active_value, p_typical_draw);
end;
$$;


-- ── 6. THE CLAIMS MOVE WITH THE BEAT ─────────────────────────────────
--
-- db/061 section 4b's pattern exactly, and its warning restated because this
-- file is the one most exposed to it: `slotEligibility` reads a `native` claim
-- as a WHITELIST, so a claim left pointing at the wrong beat is a game that
-- silently stops being placeable. Authored in src/lib/games.ts for every
-- future build; backfilled here for the rows production already holds.
--
-- IT IS NOT AN AUTHORING JUDGEMENT. It does not decide that the sack race is a
-- field day game — games.ts already said so. The beat moved, so the claim
-- follows it.

insert into game_slot (game_id, slot_code, fit, note)
select g.id, 'field_day', 'native',
       'db/069 gave the field day its own beat, offered whole. Backfilled '
       'from this game''s day_material claim.'
  from game g
 where g.slug in ('catskills-the-sack-race', 'catskills-the-rope',
                  'catskills-tied-at-the-ankle', 'catskills-egg-and-spoon',
                  'catskills-the-bucket-line')
on conflict (game_id, slot_code) do nothing;

-- AND THE OLD CLAIM GOES, because a field day game that still claims
-- `day_material` is eligible to be dealt as one anonymous card on a Tuesday
-- afternoon, which is the exact behaviour this file exists to end. The other
-- ten claims on that beat are untouched.
delete from game_slot gs
 using game g
 where gs.game_id = g.id
   and gs.slot_code = 'day_material'
   and g.slug in ('catskills-the-sack-race', 'catskills-the-rope',
                  'catskills-tied-at-the-ankle', 'catskills-egg-and-spoon',
                  'catskills-the-bucket-line');


-- ── 7. COUNT WHAT IT MATCHED, IN BOTH DIRECTIONS ─────────────────────

do $$
declare
  v_games     integer;
  v_day       integer;
  v_field     integer;
  v_beats     integer;
  v_daytime   integer;
  v_stranded  integer;
  v_offer_cap integer;
begin
  select count(*) into v_games from game;
  select count(*) into v_daytime from occasion_shape where daytime;
  select count(*) into v_beats from occasion_slot where slot_code = 'field_day';

  if v_beats <> v_daytime then
    raise exception
      'db/069: % occasion(s) declare a daytime and % got a field day beat.',
      v_daytime, v_beats;
  end if;

  -- The other direction: no occasion without a daytime may have one.
  if exists (
    select 1 from occasion_slot os
      join occasion_shape sh on sh.occasion = os.occasion
     where os.slot_code = 'field_day' and not sh.daytime)
  then
    raise exception
      'db/069 gave a field day to an occasion with no daytime. A dinner party '
      'is not entitled to a sack race.';
  end if;

  select count(*) into v_day
    from game_slot where slot_code = 'day_material' and fit = 'native';
  select count(*) into v_field
    from game_slot where slot_code = 'field_day' and fit = 'native';

  raise notice
    'db/069 AFTER — day_material claimed by % game(s), field_day by %, out of '
    '% in the catalogue.', v_day, v_field, v_games;

  -- THE db/061 NEAR-MISS, CHECKED FROM BOTH ENDS.
  if v_games > 0 and v_field = 0 then
    raise exception
      'db/069 created a beat and NOTHING claims it. A slot no row can fill '
      'never reports anything; it simply never fills.'
      using hint = 'Five games carry { slotCode: "field_day" } in '
                   'src/lib/games.ts. If none reached the database, the '
                   'seeder is the thing to look at.';
  end if;

  if v_games > 0 and v_day = 0 then
    raise exception
      'db/069 emptied day_material. Ten games that are not the field day claim '
      'that beat and db/068 made it required on every multi-day occasion.'
      using hint = 'This file deletes exactly five day_material claims, by '
                   'slug. If it took more, read the delete in section 6.';
  end if;

  select count(*) into v_stranded
    from game g
   where exists (select 1 from game_slot gs
                  where gs.game_id = g.id and gs.fit = 'native')
     and not exists (
       select 1 from game_slot gs
         join occasion_slot os on os.slot_code = gs.slot_code
        where gs.game_id = g.id and gs.fit = 'native' and os.pool = 'game');

  if v_stranded > 0 then
    raise exception
      'db/069 leaves % game(s) claiming only beats no occasion has.', v_stranded
      using hint = 'Read db/061 section 4b. Claims are whitelists and a '
                   'stranded game goes quiet without going red.';
  end if;

  -- THE CEILING IS A CEILING AND MUST NOT BE A LIMIT (rule 24, both
  -- directions: a beat offering fewer than the set silently deals a subset).
  select offer_count into v_offer_cap
    from occasion_slot where slot_code = 'field_day' limit 1;

  if v_games > 0 and v_field > v_offer_cap then
    raise exception
      'db/069: % field day games and an offer ceiling of %. "Include all" is '
      'her ruling and this beat would show a subset.', v_field, v_offer_cap
      using hint = 'Raise occasion_slot.offer_count on the field_day beat. It '
                   'is a number a curator can change with an update, which is '
                   'db/061''s own argument for the column.';
  end if;

  if v_games = 0 then
    raise notice
      'db/069 — the game table is empty, so every claim count above proves '
      'nothing. This is a scratch build; the seeders have not run yet.';
  end if;
end;
$$;
