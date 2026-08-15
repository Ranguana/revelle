-- ─────────────────────────────────────────────────────────────────────
-- THE ROOM, THE EMPHASIS, AND THE VOICE
--
-- Three product decisions, stated by the founder, landing together because
-- each of them is the same shape of correction: a question she answers was
-- being averaged into a taste vector, and the answer's actual meaning was
-- being destroyed on the way in.
--
--   1. VENUE NEVER TOUCHES THE DESTINATION.
--   2. "WHAT DO YOU WANT MORE OF" IS AN EMPHASIS, NOT A TASTE WEIGHT.
--   3. VOICE IS A FILTER, AESTHETIC IS A RANK.
--
-- The engine side of all three is src/lib/selection/. This file is the part
-- that has to be data — the structural vocabulary, what each room affords,
-- what each ingredient needs of a room, and the member-level record of the
-- one answer that is a business fact rather than a design one.
--
-- Decision 3 needs no schema at all. Its whole mechanism is a threshold and a
-- filter in src/lib/selection/destination.ts, and the catalogue gap a hard
-- clash produces travels the desk_todo channel db/013 already built. It is
-- named here only so that somebody reading the migration list in a year finds
-- all three decisions in one place.
-- ─────────────────────────────────────────────────────────────────────


-- ═════════════════════════════════════════════════════════════════════
-- 1. VENUE NEVER TOUCHES THE DESTINATION
-- ═════════════════════════════════════════════════════════════════════
--
-- The founder, and this is the product thesis rather than a preference:
--
--   "Venue never touches the destination — that's the thesis of the product.
--    The destination is where she's transported to; the venue is where she
--    physically is; the engine's whole job is mapping one onto the other.
--    Havana in a Brooklyn apartment isn't a compromise, it's the pitch. The
--    moment venue nudges destination, you're back to 'party themes that match
--    your space,' which is the Pinterest board you're against."
--
-- ── WHAT WAS ACTUALLY HAPPENING ──────────────────────────────────────
--
-- `quiz_response_facet` resolves `qr.environment` into an `environment` facet
-- with positive polarity, exactly like a taste direction, and
-- src/lib/selection/vector.ts put it into the preference vector at the full
-- stated weight. Two consequences, and the first one was live even though no
-- destination has ever been tagged in the dimension:
--
--   · `facetOverlap` normalises by the vector's total mass, so an environment
--     term with weight 0.55 was already damping every destination's score. The
--     room she was in changed how well every destination matched her.
--   · the day a curator tagged a world `beach` — which nothing stopped, and
--     which the desk's own facet editor would have made a two-click operation
--     — the beach would have started choosing destinations.
--
-- ── THE FIX HAS TWO HALVES AND BOTH ARE STRUCTURAL ───────────────────
--
-- The code half: `environment` joins `guest_count` and `spend_per_person` in
-- src/lib/selection/vector.ts's non-taste list, so it contributes nothing to
-- any score anywhere.
--
-- The data half is below: a destination and a cohort are REFUSED an
-- environment tag outright. A comment is what the next person overrides; a
-- trigger is what they have to argue with.

create or replace function refuse_environment_tag() returns trigger
language plpgsql as $$
declare
  v_dimension text;
begin
  select dimension_code into v_dimension from facet where id = new.facet_id;

  if v_dimension = 'environment' then
    raise exception using
      errcode = 'check_violation',
      message = format(
        'A %s may not be tagged with an environment facet.', tg_table_name),
      detail =
        'Venue never touches the destination. The destination is where she is '
        'transported to; the venue is where she physically is, and the engine''s '
        'whole job is mapping one onto the other — Havana in a Brooklyn '
        'apartment is the pitch, not a compromise. A destination tagged with a '
        'room is how that becomes "party themes that match your space".',
      hint =
        'Where she is goes into venue_affordance and ingredient_requirement, '
        'which prune the POOL at stage 3. See src/lib/selection/venue.ts.';
  end if;

  return new;
end;
$$;

comment on function refuse_environment_tag() is
  'Refuses an environment facet on anything that scores a destination. The '
  'product thesis, enforced rather than documented — see db/020.';

create trigger world_facet_no_environment
  before insert or update on world_facet
  for each row execute function refuse_environment_tag();

create trigger taste_cohort_facet_no_environment
  before insert or update on taste_cohort_facet
  for each row execute function refuse_environment_tag();


-- ── the structural vocabulary ────────────────────────────────────────
--
-- The founder's list, verbatim, and the list is closed only in the sense that
-- adding to it is an INSERT rather than a migration — the same argument
-- facet_dimension makes in db/002.
--
-- THESE ARE NOT FACETS, and the separation is load-bearing. A facet is
-- something she can have an opinion about and something a destination can be
-- tagged with. "Needs a kitchen" is neither: nobody prefers a kitchen, and a
-- destination does not have one. Keeping them out of `facet` is also what
-- stops them being scored by accident — `facetOverlap` and `similarity` in
-- src/lib/selection/score.ts both read an ingredient's facet tags, and two
-- menus that both want an oven are not thereby similar to each other.
--
-- `demand` is the column that keeps the polarity honest. Two of the five codes
-- are nouns rather than requirements — `noise_ceiling` and `deposit_safe` —
-- and a reader guessing at their direction from the name alone would get
-- `deposit_safe` exactly backwards. The row says what it means.

create table structural_requirement (
  code        text primary key,
  label       text not null,
  -- Completes "it …" in a rejection sentence. "needs to be outdoors."
  demand      text not null,
  description text not null,
  position    integer not null default 0
);

comment on table structural_requirement is
  'What an ingredient may need of the room it happens in. NOT a facet and '
  'never scored: a requirement is a fact about physics, not a taste. See '
  'src/lib/selection/venue.ts.';

insert into structural_requirement (code, label, demand, description, position) values
  ('requires_outdoors', 'Needs outdoors', 'needs to be outdoors',
   'There is no indoor version. A boil pot on a beach is not a saucepan in a kitchen.', 10),
  ('requires_open_flame', 'Needs open flame', 'needs live fire',
   'A fire, a grill, a flamed dish. Not a candle — a candle is decor and every room has one.', 20),
  ('requires_full_kitchen', 'Needs a full kitchen', 'needs a full kitchen',
   'An oven and a hob and somewhere to put things down. A menu that is actually made needs one; a menu that is bought and arranged does not.', 30),
  ('noise_ceiling', 'Breaks a noise ceiling', 'will be louder than the room allows',
   'It is loud, and it is loud at an hour. Read the code as the ceiling it BREAKS: a room that has a noise ceiling cannot hold this.', 40),
  ('deposit_safe', 'Endangers a deposit', 'will not survive a deposit',
   'It stains, scorches, marks or spills on something somebody else owns. Read the code as the property it FAILS: this is not deposit-safe.', 50);


-- ── what each room affords ───────────────────────────────────────────
--
-- Every value of environment_type against every requirement, explicitly, so
-- that the loader's "a missing row means the room affords it" default is a
-- safety net rather than the mechanism. A default nobody exercises is a
-- default nobody has to reason about.
--
-- `not_decided` affords everything, and that is a real answer rather than a
-- missing one — db/002 says so on the facet itself. She has not chosen a room,
-- so no room has ruled anything out, and the alternative (prune on the
-- intersection of every room) would quietly hand the most cautious Revelle in
-- the library to the woman who was least sure.

create table venue_affordance (
  environment environment_type not null,
  requirement text not null references structural_requirement(code),
  provided    boolean not null,
  -- Why not, in the house's words. Reaches a curator's gap sentence verbatim.
  note        text not null default '',
  primary key (environment, requirement)
);

comment on table venue_affordance is
  'What a room can physically do. Consumed ONCE, at stage 3, as a filter over '
  'the pool — never as a weight and never anywhere near the destination.';

insert into venue_affordance (environment, requirement, provided, note)
select e.environment, r.code,
       -- The default is generous: a room affords a requirement unless there is
       -- a reason it cannot. Overridden row by row below.
       true, ''
  from unnest(enum_range(null::environment_type)) as e(environment)
  cross join structural_requirement r;

-- OUTDOORS. Four rooms are outside; four are inside; a hotel and a restaurant
-- are somebody else's building and the answer is about what she can arrange
-- rather than whether a terrace exists somewhere on the property.
update venue_affordance set provided = false,
       note = 'there is no outdoors — this is a room, and the thing needs a sky'
 where requirement = 'requires_outdoors'
   and environment in ('city_apartment', 'restaurant_or_venue', 'hotel');

-- OPEN FLAME. An apartment and a hotel will not have it; a restaurant has one
-- and it belongs to the kitchen, not to her.
update venue_affordance set provided = false,
       note = 'live fire is not available to her here'
 where requirement = 'requires_open_flame'
   and environment in ('city_apartment', 'hotel', 'restaurant_or_venue');

-- A FULL KITCHEN. The beach, poolside and a garden have none; a hotel room has
-- none; a restaurant has one and somebody else is cooking in it.
update venue_affordance set provided = false,
       note = 'there is no kitchen she can cook in'
 where requirement = 'requires_full_kitchen'
   and environment in ('beach', 'poolside', 'garden', 'hotel', 'restaurant_or_venue');

-- THE NOISE CEILING. Shared walls and shared floors: an apartment and a hotel.
-- A rented house is somebody else's neighbours too, and the founder's whole
-- reason for the axis is the complaint that arrives at eleven.
update venue_affordance set provided = false,
       note = 'shared walls, and a complaint arrives before the evening does'
 where requirement = 'noise_ceiling'
   and environment in ('city_apartment', 'hotel', 'rented_house');

-- THE DEPOSIT. Anywhere she does not own: a rented house, a hotel, a venue.
update venue_affordance set provided = false,
       note = 'somebody else owns the floor and there is a deposit against it'
 where requirement = 'deposit_safe'
   and environment in ('rented_house', 'hotel', 'restaurant_or_venue');

-- The join the loader reads, so that the label a curator sees comes from the
-- one place that already holds the room's vocabulary: `facet`, dimension
-- `environment`, seeded in db/002 from src/lib/quiz.ts. A second list of room
-- names here is the drift db/002 exists to prevent.
create view venue_affordance_labelled as
select v.environment,
       coalesce(f.label, v.environment::text) as label,
       v.requirement,
       v.provided,
       v.note
  from venue_affordance v
  left join facet f
    on f.dimension_code = 'environment' and f.code = v.environment::text;

comment on view venue_affordance_labelled is
  'venue_affordance with the room''s display name joined from the facet '
  'vocabulary. Read by src/lib/selection/catalogue.ts.';


-- ── what each ingredient needs ───────────────────────────────────────
--
-- Polymorphic on (entity_table, entity_id), exactly like ingredient_issuance,
-- because a requirement is a property of a THING and five near-identical
-- tables would be five places to forget one.
--
-- UNTAGGED MEANS WORKS ANYWHERE, and that is the founder's instruction as well
-- as the safe default: "Where it is a judgement call, leave it untagged rather
-- than guess — untagged means 'works anywhere', which is the safe default and
-- matches how world scoping degrades." A wrong tag deletes a deliverable
-- silently and forever; a missing tag costs a curator a second look.

create table ingredient_requirement (
  entity_table text not null,
  entity_id    uuid not null,
  requirement  text not null references structural_requirement(code),
  note         text not null default '',
  primary key (entity_table, entity_id, requirement),
  constraint ingredient_requirement_known_pool
    check (entity_table in ('product', 'game', 'tracklist', 'menu', 'drink'))
);

create index ingredient_requirement_by_requirement
  on ingredient_requirement (requirement);

comment on table ingredient_requirement is
  'What this ingredient needs of the room. No row means it works anywhere, '
  'which is the safe default and the one to take whenever it is a judgement '
  'call. Consumed by venueEligibility() in src/lib/selection/venue.ts.';


-- ── tagging the real catalogue ───────────────────────────────────────
--
-- Only where it is OBVIOUS, which is the whole brief. Each block below names
-- the words in docs/menus.md, docs/drinks.md or src/lib/games.ts that make the
-- requirement a fact rather than an opinion, and anything that needed an
-- argument was left alone.
--
-- Matched on the authored text rather than on slugs, so that a re-seed that
-- renumbers the catalogue does not silently tag the wrong dish.

-- A CLAMBAKE IS THE WORKED EXAMPLE, and it is the founder's own:
--
--   "a clambake in a studio apartment. The boil-pot menu dies on
--    requires_outdoors; NANTUCKET survives; she gets the fog-day lunch."
--
-- Menu 5 in docs/menus.md — steamed clams, boiled lobsters, corn, red
-- potatoes, Portuguese sausage — is authored as "A big outdoor dinner". A boil
-- pot is not a saucepan; there is no indoor version of it. Menu 6, the
-- rainy-day lunch of chowder and lobster rolls, carries nothing at all, which
-- is why she still gets Nantucket.
insert into ingredient_requirement (entity_table, entity_id, requirement, note)
select 'menu', m.id, 'requires_outdoors',
       'A boil pot. Authored as "' || m.name || '"; there is no indoor version.'
  from menu m
 where m.dishes ilike '%steamed clams%'
   and m.dishes ilike '%boiled lobster%'
on conflict do nothing;

-- ANYTHING GRILLED OVER FIRE, from either document. "Grilled" in the dishes is
-- the fact; a grill is live fire and it is outside.
insert into ingredient_requirement (entity_table, entity_id, requirement, note)
select 'menu', m.id, r.code,
       'Grilled over fire: "' || left(m.dishes, 60) || '…"'
  from menu m
  cross join (values ('requires_open_flame'), ('requires_outdoors')) as r(code)
 where m.dishes ilike '%grilled%'
   and m.dishes not ilike '%grilled cheese%'
on conflict do nothing;

-- A FIRE-LIT DINNER, and the flamed cherries. docs/drinks.md authors drink 21
-- as "A fire-lit dinner"; anything flamed at the table is live fire by
-- definition. Neither is outdoors — a fireplace is indoors — so only the flame
-- is claimed, which is exactly the "tag what is obvious" rule doing its job.
insert into ingredient_requirement (entity_table, entity_id, requirement, note)
select 'drink', d.id, 'requires_open_flame',
       'Authored as "' || d.name || '".'
  from drink d
 where d.name ilike '%fire-lit%'
on conflict do nothing;

insert into ingredient_requirement (entity_table, entity_id, requirement, note)
select 'menu', m.id, 'requires_open_flame',
       'Flamed at the table: "' || left(m.dishes, 60) || '…"'
  from menu m
 where m.dishes ilike '%flamed%' or m.dishes ilike '%bananas foster%'
    or m.dishes ilike '%cherries jubilee%'
on conflict do nothing;

-- A MENU THAT IS ACTUALLY MADE NEEDS A KITCHEN. `cooking = 'actually_made'` is
-- the author's own value and it means the afternoon before is part of the
-- evening — which is not something that happens on a beach with no oven.
-- `half_made` deliberately does not claim it: half of it arrives finished, and
-- a hob is not a full kitchen. `bought_and_arranged` claims nothing at all,
-- which is the whole point of that rung.
insert into ingredient_requirement (entity_table, entity_id, requirement, note)
select 'menu', m.id, 'requires_full_kitchen',
       'Authored as actually made — the afternoon before is part of the evening.'
  from menu m
 where m.cooking = 'actually_made'
on conflict do nothing;

-- A DRINK THAT IS ACTUALLY MIXED DOES NOT NEED A KITCHEN. A bar is a table
-- with ice on it. Nothing is tagged from the drinks' making axis, and this
-- comment exists so that the next person does not "finish the job" by
-- symmetry: symmetry is not evidence.


-- ═════════════════════════════════════════════════════════════════════
-- 2. "WHAT DO YOU WANT MORE OF" IS AN EMPHASIS, NOT A TASTE WEIGHT
-- ═════════════════════════════════════════════════════════════════════
--
-- The founder:
--
--   "Each answer points at a slot, and this question shouldn't feed the
--    preference vector at all. It's the only question on the quiz that tells
--    you which deliverable she values, and averaging it into taste weights
--    discards exactly that."
--
-- The engine half is src/lib/selection/emphasis.ts, which turns each of the six
-- answers into the deliverable it names, and the `affinity` entry in
-- vector.ts's non-taste list, which is what stops it being a weight.
--
-- The `affinity` facets and the quiz_option_facet bridge STAY. db/002's rule is
-- that a dimension excluded on purpose must be excluded by a named rule rather
-- than by failing to appear, and emphasis.ts reads the same resolved rows the
-- vector deliberately ignores.
--
-- ── AND THE ONE THAT IS A BUSINESS FACT ──────────────────────────────
--
-- The founder, and this was not optional:
--
--   "'a ritual we repeat next year' is the highest-LTV answer on the quiz —
--    she is telling you she wants Revelle #2 before #1 ships. Tag it on the
--    MEMBER RECORD, not just the application."
--
-- An application is a snapshot of one evening. "I want to do this every year"
-- is a statement about HER, it is still true next spring, and it is the single
-- most commercially valuable sentence in the whole quiz. On the application
-- alone it would be findable only by whoever thought to look inside a frozen
-- answer array from eleven months ago.
--
-- So it lands on a table keyed by customer, written by a TRIGGER on
-- quiz_response rather than by the application handler — because "the handler
-- also writes this" is a thing a second entry point (an import, a backfill, a
-- curator entering an application by hand) silently does not do.

create table member_emphasis (
  customer_id       uuid not null references customer(id) on delete cascade,
  emphasis          text not null,
  -- The first time she said it, and the most recent. A woman who has asked for
  -- an annual ritual three years running is a different conversation from one
  -- who said it once, and a single boolean cannot tell them apart.
  first_stated_at   timestamptz not null,
  last_stated_at    timestamptz not null,
  times_stated      integer not null default 1,
  -- The application that said it most recently, for the curator who wants the
  -- rest of the answers around it.
  quiz_response_id  uuid references quiz_response(id),
  primary key (customer_id, emphasis)
);

comment on table member_emphasis is
  'What a MEMBER values, accumulated across her applications. Distinct from '
  'quiz_response.affinities, which is frozen to one evening. Written by a '
  'trigger so no caller can forget it. See db/020.';

comment on column member_emphasis.times_stated is
  'How many applications have carried it. A woman who has asked for an annual '
  'ritual three years running is a different conversation from one who said it '
  'once.';

create or replace function record_member_emphasis() returns trigger
language plpgsql as $$
begin
  insert into member_emphasis
    (customer_id, emphasis, first_stated_at, last_stated_at, times_stated,
     quiz_response_id)
  select new.customer_id, e.code, new.created_at, new.created_at, 1, new.id
    from unnest(new.affinities) as e(code)
  on conflict (customer_id, emphasis) do update
    set last_stated_at   = greatest(member_emphasis.last_stated_at, excluded.last_stated_at),
        first_stated_at  = least(member_emphasis.first_stated_at, excluded.first_stated_at),
        times_stated     = member_emphasis.times_stated + 1,
        quiz_response_id = excluded.quiz_response_id;

  return new;
end;
$$;

create trigger quiz_response_record_member_emphasis
  after insert on quiz_response
  for each row execute function record_member_emphasis();

-- Backfill, in the same statement order the trigger would have produced.
insert into member_emphasis
  (customer_id, emphasis, first_stated_at, last_stated_at, times_stated,
   quiz_response_id)
select qr.customer_id, e.code, min(qr.created_at), max(qr.created_at), count(*),
       (array_agg(qr.id order by qr.created_at desc))[1]
  from quiz_response qr
  cross join lateral unnest(qr.affinities) as e(code)
 group by qr.customer_id, e.code
on conflict (customer_id, emphasis) do nothing;

-- THE LIST THE HOUSE SHOULD BE WORKING. Every member who has asked for
-- something annual, newest first, with enough beside her to start the
-- conversation. A view rather than a report, so that the desk page that
-- eventually shows it cannot invent a different definition of the same thing.
create view member_wants_a_ritual as
select me.customer_id,
       c.email,
       me.first_stated_at,
       me.last_stated_at,
       me.times_stated,
       me.quiz_response_id,
       qr.occasion,
       qr.secret
  from member_emphasis me
  join customer c on c.id = me.customer_id
  left join quiz_response qr on qr.id = me.quiz_response_id
 where me.emphasis = 'ritual'
 order by me.last_stated_at desc;

comment on view member_wants_a_ritual is
  'The highest-LTV answer on the quiz, as a list. She asked for Revelle #2 '
  'before #1 shipped; this is who, and when she said it.';


-- ═════════════════════════════════════════════════════════════════════
-- 3. VOICE IS A FILTER, AESTHETIC IS A RANK — no schema, on purpose
-- ═════════════════════════════════════════════════════════════════════
--
--   "Not a bigger weight — a TIER."
--
-- Tone facets threshold-filter destinations in stage 2; aesthetic facets rank
-- within the survivors; the dither operates within the tone-surviving set and
-- can never resurrect an aesthetic winner the tone filter killed. All of that
-- is arithmetic over a snapshot and lives in src/lib/selection/destination.ts
-- and src/lib/selection/tone.ts, where the threshold can be argued with in a
-- test instead of in a query.
--
-- The one thing that could have been schema is the catalogue gap a hard clash
-- produces — "the house has no wedding-reception-register destination" — and it
-- deliberately is not. db/013's desk_todo already takes free text, a jsonb
-- detail and a dedupe key, src/lib/desk/gaps.ts is structural rather than
-- enumerated, and generate.ts already hands it `result.gaps`. A second work
-- order mechanism beside the sanctioned one is exactly the crossing that file
-- warns about.
