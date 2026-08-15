-- Revelle Société — a destination has a VOICE, and it is versioned
--
-- Applied by scripts/migrate.mjs after 003, inside one transaction together
-- with its schema_migrations ledger row. Same rule as 001, 002 and 003:
-- nothing here may be a statement that refuses to run in a transaction.
--
-- New file, never applied anywhere, so no SENTINELS entry in
-- scripts/migrate.mjs. Discovery picks it up; the ledger makes it run once.
--
-- ─────────────────────────────────────────────────────────────────────
-- WHAT THIS ADDS AND WHY
--
-- 001 gave a world a LOOK: `world.tokens`, a jsonb token set with the same
-- discipline as src/lib/tokens.ts — data, not CSS, so it can be ugly but not
-- dangerous. That is half of what a destination is. docs/copy.md names the
-- other half outright:
--
--     A destination is a LOOK and a VOICE. The look is palette and type; the
--     voice is how everything reads — what the invitation says, what the menu
--     calls the drinks, how a note to her guests sounds.
--
-- The voice is the half that survives being copied. Anyone can generate a mood
-- board; producing every written piece of a weekend in ONE consistent register
-- is the thing that takes a system. This migration gives that register a home,
-- a vocabulary, and — the part that matters most — a version.
--
-- ─────────────────────────────────────────────────────────────────────
-- WHY NOT `world.voice jsonb`, BESIDE `world.tokens`
--
-- That is the obvious shape and it is wrong, for one reason: a voice that can
-- be edited in place drifts, and a Revelle that has already been ISSUED in a
-- voice is a promise about how her weekend sounds.
--
-- 001 already draws this line for the writing: "Editing a world's sections
-- does NOT retroactively change a delivered revelle — a delivered experience
-- is frozen the moment it is cloned." Sections are frozen by CLONING (per
-- Revelle). A voice cannot be cloned per Revelle without making a hundred
-- copies of the same paragraph, and it must not be shared mutably either. So
-- it is frozen by VERSIONING: the voice lives in its own table, one immutable
-- row per published version, and a delivered Revelle points at the exact row
-- it was written in.
--
-- The consequence is the point of the whole file. A curator may rewrite the
-- voice of WESTHAMPTON, 1976 whenever she likes; every Revelle already in the
-- world keeps the words it was issued with, and can be reprinted years later
-- from the row it was pinned to. Nothing drifts silently, and nothing has to be
-- remembered by a person.
--
-- ─────────────────────────────────────────────────────────────────────
-- CONTENTS
--
--   voice_piece_kind   the kinds of written piece. rows, not an enum
--   voice_status       draft → published → superseded. an enum: closed
--   world_voice        one immutable row per published version of a voice
--   validate_voice()   the shape gate, applied at PUBLISH, not at save
--   world_current_voice  the voice in force for new Revelles
--   revelle.voice_id   the pin. set at delivery, never moved afterwards
--
-- ─────────────────────────────────────────────────────────────────────
-- WHAT IS NOT HERE, DELIBERATELY
--
-- No generation, no model, no prompt. The prompt is assembled in TypeScript
-- from this same data (writerPrompt in src/lib/tokens.ts) and is a pure
-- function, so the thing a curator approves is a string she can read. Putting
-- prompt scaffolding in the database would make the row own an engineering
-- decision that changes far faster than a voice does.
-- ─────────────────────────────────────────────────────────────────────

-- ── voice_piece_kind ─────────────────────────────────────────────────
--
-- The kinds of written piece a destination produces: an invitation line, a
-- name on the menu, a notice for the hall table, a sign-off.
--
-- ROWS, NOT AN ENUM, and this is the same test 001 and 002 apply. The set is
-- not closed and is not structural: docs/copy.md is explicit that the pieces
-- are the host's to choose and that a multi-day getaway "could include
-- something each morning". A vocabulary that grows on taste is an insert.
--
-- It carries no renderer and no behaviour. Its whole job is to be the thing an
-- exemplar is TAGGED with, so that "show me every invitation line this house
-- has ever approved" is a query and the writer can be handed the four lines
-- that matter instead of all twenty.
--
-- Mirrors facet_dimension deliberately: permanent code, reworda-ble label,
-- deprecation instead of deletion. facet_status is reused rather than a second
-- two-value enum invented, because it means exactly the same thing here.

create table voice_piece_kind (
  -- Permanent, machine-stable. Appears in PIECE_KINDS in src/lib/tokens.ts.
  code        text primary key check (code ~ '^[a-z][a-z0-9_]*$'),
  label       text not null,
  description text not null default '',
  -- Presentation order in the curator's tool. Deferrable because reordering
  -- means several rows swapping numbers inside one transaction.
  position    integer not null,
  status      facet_status not null default 'active',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint voice_piece_kind_position_unique unique (position)
    deferrable initially deferred
);

create trigger voice_piece_kind_touch before update on voice_piece_kind
  for each row execute function set_updated_at();

insert into voice_piece_kind (code, label, description, position) values
  ('invitation', 'Invitation line',
   'The ask itself. Where the destination is established in one breath.', 1),
  ('menu_item',  'Menu item',
   'What a dish or a drink is CALLED here. Not a description of it.', 2),
  ('notice',     'Notice',
   'A line posted for everyone. The house register: stated, not requested.', 3),
  ('house_note', 'Note to a guest',
   'Left in a room or handed over. The one place the voice may be warm.', 4),
  ('place_card', 'Place card',
   'A name and, at most, one clause.', 5),
  ('game_rule',  'Game rule',
   'How a game is explained. Short enough to be read aloud.', 6),
  ('bulletin',   'Morning bulletin',
   'The line at the top of a day, for a getaway that runs more than one.', 7),
  ('heading',    'Heading',
   'A section head on printed matter. Caps, no punctuation.', 8),
  ('sign_off',   'Sign-off',
   'How a piece ends. The house''s equivalent of a signature.', 9);

comment on table voice_piece_kind is
  'The kinds of written piece a destination produces. Rows, not an enum: the '
  'set grows on taste. Kept in step with PIECE_KINDS in src/lib/tokens.ts.';

-- ── voice_status ─────────────────────────────────────────────────────
--
-- An enum, because unlike the piece kinds this IS closed and structural: three
-- states, one direction, and each has different rules about what may be
-- written. Adding a fourth would be a real decision about what a voice is.
--
--   draft       being written. Freely editable, freely deletable, never used.
--   published   in force. Immutable. Exactly one per destination.
--   superseded  was in force. Immutable, kept forever, still pinned to every
--               Revelle issued while it was current.
--
-- There is no 'retired'. A voice cannot be withdrawn, because withdrawing it
-- would break the reprint of a Revelle that was issued in it. Retire the
-- DESTINATION (world.status) instead — that stops new Revelles without
-- rewriting old ones.

create type voice_status as enum ('draft', 'published', 'superseded');

-- ── world_voice ──────────────────────────────────────────────────────
--
-- One row per version of one destination's voice.
--
-- MUST BE USEFUL WITH ZERO DATA, exactly like taste_cohort in 002: every
-- column is fillable by a person with an opinion and no dataset, `provenance`
-- distinguishes a hand-authored voice from one a model proposed, and the
-- hand-authored one is not a stand-in for anything.
--
-- The voice itself is jsonb rather than columns for the same reason
-- world.tokens is: it is a document with a shape, it is versioned as a UNIT,
-- and half of it (the exemplars) is a list of hand-written lines that no
-- column decomposition would improve. The shape is not unchecked — see
-- validate_voice() below — it is checked at the moment it stops being private.
--
-- The canonical text of a voice lives in src/lib/destinations.ts, where it can
-- be read in a diff and argued about in a pull request. This table is where it
-- is issued from. scripts/seed-destinations.mjs moves it from one to the other
-- and REFUSES to edit a published row, which is the same rule stated in code.

create table world_voice (
  id            uuid primary key default gen_random_uuid(),
  world_id      uuid not null references world(id) on delete cascade,

  -- Assigned by the guard below when omitted: next after the highest version
  -- this destination has. Passed explicitly only by a restore.
  version       integer not null,

  -- The voice, as data. Shape documented by the Voice type in
  -- src/lib/tokens.ts and enforced by validate_voice() at publish.
  voice         jsonb not null default '{}'::jsonb,

  status        voice_status not null default 'draft',

  -- Hand-authored or derived, on the same two-value restriction as
  -- taste_cohort: 'quiz' and 'observed' describe a customer's statement, not
  -- the origin of a register, and 'cohort_prior' would be meaningless here.
  provenance    taste_provenance not null default 'curator'
    check (provenance in ('curator', 'inferred')),
  -- Which run proposed it. Null for hand-authored, always.
  model_version text,

  -- Who signed it. A voice is an opinion and opinions have authors.
  authored_by   text not null default 'curator',
  -- Internal. Why this version exists — the changelog entry for a register.
  note          text not null default '',

  published_at   timestamptz,
  superseded_at  timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint world_voice_version_unique unique (world_id, version),
  constraint world_voice_version_positive check (version >= 1),
  constraint world_voice_hand_authored_has_no_model
    check ((provenance = 'inferred') or model_version is null),
  -- Not equalities: a superseded version must keep the date it went live, the
  -- way taste_cohort_active_has_timestamp does for a retired cohort.
  constraint world_voice_published_has_timestamp
    check (status = 'draft' or published_at is not null),
  constraint world_voice_superseded_has_timestamp
    check ((status = 'superseded') = (superseded_at is not null)),
  constraint world_voice_is_object check (jsonb_typeof(voice) = 'object')
);

create trigger world_voice_touch before update on world_voice
  for each row execute function set_updated_at();

-- THE ONE-IN-FORCE RULE. A destination has exactly one published voice at a
-- time; every earlier one is superseded and every later one is a draft. A
-- partial unique index rather than a constraint because the predicate is what
-- makes it true, and because drafts must be free to exist in any number.
create unique index world_voice_one_published
  on world_voice (world_id) where status = 'published';

create index world_voice_world_idx on world_voice (world_id, version desc);
create index world_voice_status_idx on world_voice (status, updated_at desc);

comment on table world_voice is
  'One immutable row per published version of a destination''s voice. A '
  'delivered Revelle pins the row it was written in (revelle.voice_id), so a '
  'later rewrite cannot change how an issued Revelle reads. See db/004.';

-- ── validate_voice ───────────────────────────────────────────────────
--
-- THE SHAPE GATE, AND WHERE IT IS APPLIED.
--
-- Not on save. A curator must be able to type a speaker and three lines, walk
-- away, and come back tomorrow — a validator that fires on every keystroke of
-- a draft is a validator that gets worked around. It fires at PUBLISH, which
-- is the moment the voice stops being private and starts being a promise.
--
-- What it insists on is narrow on purpose. It does not have opinions about the
-- writing; it checks that the fields a writer cannot work without are present
-- and are the right kind of thing, and that every closed value is one of the
-- values that exists. Two rules are worth defending:
--
--   · AT LEAST THREE EXEMPLARS. This is the one quality bar in the file, and
--     it is here because examples are what actually steer a generated line.
--     "Dry, clipped, faintly disreputable" describes half the destinations we
--     will ever write; "The house sleeps six and has slept nine." describes
--     one. A voice published with adjectives and no lines is a voice that will
--     produce competent copy for the wrong house.
--   · EVERY EXEMPLAR IS TAGGED WITH A PIECE KIND THAT EXISTS. That is what
--     makes the prompt assembler able to put invitation lines in front of a
--     writer asked for an invitation, and it is a lookup against
--     voice_piece_kind, which is why this is a function called from a trigger
--     rather than a check constraint.
--
-- Raises rather than returns false, so the reason arrives with the failure.

create or replace function validate_voice(p_voice jsonb) returns void
language plpgsql stable as $$
declare
  v_missing   text[];
  v_key       text;
  v_exemplars jsonb;
  v_item      jsonb;
  v_i         integer := 0;
  v_kind      text;
begin
  if jsonb_typeof(p_voice) is distinct from 'object' then
    raise exception 'voice must be a json object, got %', coalesce(jsonb_typeof(p_voice), 'null')
      using errcode = 'invalid_parameter_value';
  end if;

  -- Present and non-empty. Every one of these appears in the assembled writer
  -- prompt; a missing one is a silent hole in the instructions.
  v_missing := '{}';
  foreach v_key in array array[
    'speaker', 'audience', 'register', 'formality', 'cadence',
    'punctuation', 'orthography'
  ] loop
    if coalesce(btrim(p_voice ->> v_key), '') = '' then
      v_missing := v_missing || v_key;
    end if;
  end loop;

  foreach v_key in array array[
    'selfReference', 'lexicon', 'formulae', 'banned', 'signOffs',
    'always', 'never', 'breaksCharacterFor', 'exemplars', 'rejected'
  ] loop
    if jsonb_typeof(p_voice -> v_key) is distinct from 'array' then
      v_missing := v_missing || (v_key || ' (must be an array)');
    end if;
  end loop;

  foreach v_key in array array['address', 'humour', 'sentence'] loop
    if jsonb_typeof(p_voice -> v_key) is distinct from 'object' then
      v_missing := v_missing || (v_key || ' (must be an object)');
    end if;
  end loop;

  if cardinality(v_missing) > 0 then
    raise exception 'voice cannot be published: missing or malformed %',
      array_to_string(v_missing, ', ')
      using errcode = 'invalid_parameter_value',
            hint = 'See the Voice type in src/lib/tokens.ts. A draft may be '
                   'incomplete; a published voice may not.';
  end if;

  -- Closed vocabularies. Held here rather than as enums because they are
  -- properties of a document, not of a table — but they are still closed, and
  -- a typo in one of them silently drops a whole instruction from the prompt.
  if (p_voice -> 'address' ->> 'mode') is null
     or (p_voice -> 'address' ->> 'mode') not in
        ('second_person', 'third_person', 'collective_first', 'impersonal') then
    raise exception 'voice.address.mode must be one of second_person, '
      'third_person, collective_first, impersonal (got %)',
      coalesce(p_voice -> 'address' ->> 'mode', 'null')
      using errcode = 'invalid_parameter_value';
  end if;

  if (p_voice ->> 'formality') not in
     ('ceremonial', 'formal', 'cordial', 'plain', 'familiar') then
    raise exception 'voice.formality must be one of ceremonial, formal, '
      'cordial, plain, familiar (got %)', p_voice ->> 'formality'
      using errcode = 'invalid_parameter_value';
  end if;

  if (p_voice -> 'humour' ->> 'mode') is null
     or (p_voice -> 'humour' ->> 'mode') not in
        ('none', 'dry', 'deadpan', 'arch', 'warm', 'absurd') then
    raise exception 'voice.humour.mode must be one of none, dry, deadpan, '
      'arch, warm, absurd (got %)',
      coalesce(p_voice -> 'humour' ->> 'mode', 'null')
      using errcode = 'invalid_parameter_value';
  end if;

  if coalesce(btrim(p_voice -> 'humour' ->> 'mechanism'), '') = '' then
    raise exception 'voice.humour.mechanism is required: the mode names the '
      'family, the mechanism is what makes the joke reproducible'
      using errcode = 'invalid_parameter_value';
  end if;

  -- The rhythm numbers. Internal, never rendered to a customer — the "never
  -- count anything" rule in docs/copy-brief.md governs her copy, not ours.
  if (p_voice -> 'sentence' ->> 'typicalWords') !~ '^[0-9]+$'
     or (p_voice -> 'sentence' ->> 'maxWords') !~ '^[0-9]+$'
     or (p_voice -> 'sentence' ->> 'typicalWords')::integer < 1
     or (p_voice -> 'sentence' ->> 'typicalWords')::integer
        > (p_voice -> 'sentence' ->> 'maxWords')::integer then
    raise exception 'voice.sentence needs whole numbers with typicalWords <= '
      'maxWords (got % and %)',
      coalesce(p_voice -> 'sentence' ->> 'typicalWords', 'null'),
      coalesce(p_voice -> 'sentence' ->> 'maxWords', 'null')
      using errcode = 'invalid_parameter_value';
  end if;

  -- The bar. See the note above.
  v_exemplars := p_voice -> 'exemplars';
  if jsonb_array_length(v_exemplars) < 3 then
    raise exception 'a published voice needs at least three exemplar lines '
      '(got %)', jsonb_array_length(v_exemplars)
      using errcode = 'invalid_parameter_value',
            hint = 'Examples steer a generated line further than adjectives '
                   'do. Three real lines, tagged by the piece they belong to.';
  end if;

  for v_item in select * from jsonb_array_elements(v_exemplars) loop
    v_i := v_i + 1;

    if coalesce(btrim(v_item ->> 'text'), '') = '' then
      raise exception 'voice.exemplars[%] has no text', v_i
        using errcode = 'invalid_parameter_value';
    end if;

    select k.code into v_kind
      from voice_piece_kind k
     where k.code = (v_item ->> 'piece') and k.status = 'active';

    if v_kind is null then
      raise exception 'voice.exemplars[%] is tagged "%", which is not an '
        'active voice_piece_kind', v_i, coalesce(v_item ->> 'piece', 'null')
        using errcode = 'foreign_key_violation',
              hint = 'Adding a kind of piece is an insert into '
                     'voice_piece_kind, not a migration.';
    end if;
  end loop;
end;
$$;

-- ── the guard ────────────────────────────────────────────────────────
--
-- Four jobs, in one before-trigger so that a publish is validated, numbered,
-- dated and made exclusive in a single step with no window in between:
--
--   1. NUMBERING. Version omitted means next after the highest this
--      destination has. A curator inserts a voice; she does not do arithmetic.
--   2. THE SHAPE GATE, at the transition into 'published' only.
--   3. SUCCESSION. Publishing supersedes whatever was published before, in
--      this same statement, so that world_voice_one_published never sees two.
--      It is done in the BEFORE trigger rather than an AFTER one precisely
--      because a partial unique INDEX cannot be deferred — the old row must
--      already be demoted by the time the new row is written. The demotion
--      re-enters this function for that row, sees a move to 'superseded', and
--      falls straight through; there is no recursion to bound.
--   4. IMMUTABILITY. A published or superseded row is frozen except for the
--      status move that supersedes it. This is what "issued in this voice"
--      means, and it is enforced rather than agreed.
--
-- Backwards moves are refused outright. A published voice does not go back to
-- draft; write the next version.

create or replace function world_voice_guard() returns trigger
language plpgsql as $$
declare
  v_now timestamptz := now();
begin
  if tg_op = 'DELETE' then
    if old.status <> 'draft' then
      raise exception 'world_voice % (version %) has been published and may '
        'not be deleted. Revelles may have been issued in it.',
        old.id, old.version
        using errcode = 'restrict_violation',
              hint = 'Publish a new version instead. Nothing is ever removed '
                     'from the record of how a destination sounded.';
    end if;
    return old;
  end if;

  if tg_op = 'INSERT' then
    if new.version is null then
      select coalesce(max(v.version), 0) + 1 into new.version
        from world_voice v where v.world_id = new.world_id;
    end if;
    if new.status = 'superseded' then
      raise exception 'a voice cannot be inserted as superseded'
        using errcode = 'invalid_parameter_value';
    end if;
  else
    -- Frozen once it has been published. Listed explicitly, the way 001's
    -- quiz_response_guard is, so that adding a column is a deliberate choice
    -- about which side of this line it falls on.
    if old.status <> 'draft' then
      if new.world_id      is distinct from old.world_id
         or new.version       is distinct from old.version
         or new.voice         is distinct from old.voice
         or new.provenance    is distinct from old.provenance
         or new.model_version is distinct from old.model_version
         or new.authored_by   is distinct from old.authored_by
         or new.note          is distinct from old.note
         or new.published_at  is distinct from old.published_at
         or new.created_at    is distinct from old.created_at
      then
        raise exception 'world_voice % (version %) is published and immutable. '
          'Only its supersession may still be recorded.', old.id, old.version
          using errcode = 'restrict_violation',
                hint = 'Insert the next version and publish that. A voice a '
                       'Revelle was issued in never changes underneath her.';
      end if;
    end if;

    if old.status = 'published' and new.status = 'draft' then
      raise exception 'world_voice % cannot go back to draft', old.id
        using errcode = 'invalid_parameter_value';
    end if;
    if old.status = 'superseded' and new.status <> 'superseded' then
      raise exception 'world_voice % is superseded and cannot be revived', old.id
        using errcode = 'invalid_parameter_value',
              hint = 'Insert a new version carrying the same text.';
    end if;
  end if;

  -- The transition into force.
  if new.status = 'published'
     and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    perform validate_voice(new.voice);
    new.published_at := coalesce(new.published_at, v_now);

    update world_voice v
       set status = 'superseded', superseded_at = v_now
     where v.world_id = new.world_id
       and v.status = 'published'
       and v.id is distinct from new.id;
  end if;

  if new.status = 'superseded' then
    new.superseded_at := coalesce(new.superseded_at, v_now);
  end if;

  return new;
end;
$$;

create trigger world_voice_guard before insert or update on world_voice
  for each row execute function world_voice_guard();

create trigger world_voice_no_delete before delete on world_voice
  for each row execute function world_voice_guard();

-- The voice in force for a destination — what a new Revelle will be pinned to,
-- and what the curator's tool shows as "current".
create view world_current_voice as
select w.id           as world_id,
       w.slug,
       w.name,
       v.id           as voice_id,
       v.version,
       v.voice,
       v.authored_by,
       v.published_at
  from world w
  join world_voice v on v.world_id = w.id and v.status = 'published';

comment on view world_current_voice is
  'The published voice of each destination. Empty for a destination whose '
  'voice has not been written yet — which is legal, and means look only.';

-- ── the pin ──────────────────────────────────────────────────────────
--
-- A Revelle records the exact voice it was written in.
--
-- Nullable, and legal to leave null: a destination may have a look and no
-- voice yet, and every Revelle delivered before this migration has one. Null
-- means "issued without a voice", which is a true statement about those rows
-- and not a hole to be backfilled with today's text — backfilling it would be
-- precisely the retroactive change this file exists to prevent.

alter table revelle
  add column voice_id uuid references world_voice(id) on delete restrict,
  -- Per-customer adjustment, shallow-merged over the pinned voice at write
  -- time. The same idea as tokens_override in 001 and, like the pin itself,
  -- frozen once she has been delivered.
  add column voice_override jsonb not null default '{}'::jsonb
    check (jsonb_typeof(voice_override) = 'object');

comment on column revelle.voice_id is
  'The exact world_voice row this Revelle was written in. Set on first '
  'delivery, never moved afterwards. Null means it was issued with no voice.';

-- ── the pin's guard ──────────────────────────────────────────────────
--
-- Three rules:
--
--   1. A pin must point at a voice of THIS destination, and never at a draft.
--      A draft is by definition something a curator is still arguing with.
--   2. On the delivery transition, an unpinned Revelle takes the destination's
--      currently published voice. Automatic, because the alternative is a
--      human remembering, and the failure mode of that is silent.
--   3. After first delivery, neither the pin nor the override may change. Not
--      to a newer version, not to an older one, not from null to something.
--      first_delivered_at (the ratchet from 003) is the test, so archiving does
--      not release it — the same fact that carries the uniqueness promise
--      carries this one.
--
-- Rule 2 keys off the status transition rather than off first_delivered_at so
-- that it does not depend on this trigger firing after revelle_assemblage.
-- Trigger order within an event is alphabetical, which is a fact about names,
-- and a promise this size should not rest on one.

create or replace function revelle_voice_guard() returns trigger
language plpgsql as $$
declare
  v_voice record;
begin
  if new.voice_id is not null then
    select v.world_id, v.status, v.version into v_voice
      from world_voice v where v.id = new.voice_id;

    if v_voice.world_id <> new.world_id then
      raise exception 'revelle % is in destination %, but voice % belongs to '
        'destination %', new.id, new.world_id, new.voice_id, v_voice.world_id
        using errcode = 'foreign_key_violation';
    end if;

    if v_voice.status = 'draft' then
      raise exception 'voice % (version %) is a draft and may not be issued',
        new.voice_id, v_voice.version
        using errcode = 'invalid_parameter_value',
              hint = 'Publish it first. A draft is a voice still being argued '
                     'with.';
    end if;
  end if;

  if tg_op = 'UPDATE' and old.first_delivered_at is not null then
    if new.voice_id is distinct from old.voice_id then
      raise exception 'revelle % was delivered on %; its voice cannot be '
        'changed afterwards', old.id, old.first_delivered_at
        using errcode = 'restrict_violation',
              hint = 'She has the printed matter. Publishing a new version of '
                     'the destination''s voice does not, and must not, reach '
                     'a Revelle already issued.';
    end if;
    if new.voice_override is distinct from old.voice_override then
      raise exception 'revelle % was delivered on %; its voice override cannot '
        'be changed afterwards', old.id, old.first_delivered_at
        using errcode = 'restrict_violation';
    end if;
  end if;

  if new.status = 'delivered'
     and (tg_op = 'INSERT' or old.status is distinct from 'delivered')
     and new.voice_id is null then
    select v.id into new.voice_id
      from world_voice v
     where v.world_id = new.world_id and v.status = 'published';
  end if;

  return new;
end;
$$;

-- Named for what it protects, not for when it runs. It happens to sort after
-- revelle_assemblage, but nothing above depends on that.
create trigger revelle_voice before insert or update on revelle
  for each row execute function revelle_voice_guard();

-- Finding every Revelle issued in a given version of a voice — the read behind
-- "what did we change, and who already has the old words".
create index revelle_voice_idx on revelle (voice_id) where voice_id is not null;

-- ─────────────────────────────────────────────────────────────────────
-- WHAT THIS DOES NOT DO, DELIBERATELY
--
-- The LOOK is still not versioned. `world.tokens` remains editable in place,
-- so recolouring a destination does change how an already-delivered Revelle
-- renders on the web. That asymmetry is deliberate for now and worth stating:
-- a palette change is visible the moment it happens and is reversible by
-- another palette change, whereas a voice change is invisible — the same
-- invitation, reprinted, would simply come back worded differently, and
-- nobody would know which version she was sent. Versioning the look is the
-- same three columns and a table when someone wants it, and the pin on
-- `revelle` is where it would hang.
--
-- There is also no validation of the voice held in `revelle.voice_override`.
-- An override is a fragment, not a document — requiring it to satisfy
-- validate_voice() would mean restating the whole voice to change one
-- sign-off. It is merged in TypeScript, over a base that has been validated.
-- ─────────────────────────────────────────────────────────────────────
