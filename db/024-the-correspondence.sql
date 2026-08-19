-- Revelle Société — the guest list, and everything the house writes to it
--
-- Applied by scripts/migrate.mjs after 023, inside one transaction together
-- with its schema_migrations ledger row. Same rule as every file before it:
-- nothing here may be a statement that refuses to run in a transaction.
--
-- New file, never applied anywhere, so no SENTINELS entry in
-- scripts/migrate.mjs. Discovery picks it up; the ledger makes it run once.
--
-- ─────────────────────────────────────────────────────────────────────
-- WHAT THIS ADDS AND WHY
--
-- Everything in this repo so far SELECTS. A destination is chosen, a menu is
-- composed, a game is placed. Nothing yet WRITES, and the writing is the only
-- part of a Revelle a guest ever reads. docs/portal-spec.md section 4:
--
--     Everything the host sends her guests is written in the destination's
--     voice. Not a template with her details merged in — actually written, in
--     the register of that destination.
--
-- 004 gave a destination a voice and pinned it to a delivered Revelle. This
-- file gives that voice something to say and someone to say it to. Four
-- tables, and each of them is a promise:
--
--   revelle_guest         who is coming. Needed for the writing, for counting
--                         place cards, and for anything that scales with heads
--   correspondence        one piece: its kind, its facts, the voice it is in
--   correspondence_draft  APPEND-ONLY. what the house wrote AND what she sent
--   correspondence_send   who it actually went to, and what came back
--
-- ─────────────────────────────────────────────────────────────────────
-- THE ONE STRUCTURAL RULE IN THIS FILE
--
-- `breaksCharacterFor` in every destination's voice names what that house
-- never jokes about: anything a guest must act on to arrive or be safe,
-- anything about money, and any message that gives someone a way out. A change
-- of address, a medical note, a cancellation — those go out PLAIN.
--
-- That could have been a warning in the interface. A warning is a thing an
-- interface forgets when somebody adds a second compose screen. So it is a
-- constraint instead:
--
--     constraint correspondence_plain_has_no_voice
--       check (plain = (voice_id is null))
--
-- A plain piece HAS NO VOICE. Not "has a voice it is asked not to use" — has
-- none, in the row. There is therefore no code path anywhere above this table
-- that can put a house's register on a cancellation, because there is nothing
-- to put. The writer takes a voice; a plain piece cannot supply one; the type
-- system upstream (src/lib/correspondence/types.ts) makes the same statement in
-- TypeScript, and this is the copy of it that survives a rewrite of the
-- interface.
--
-- ─────────────────────────────────────────────────────────────────────
-- WHY DRAFTS ARE APPEND-ONLY, WHICH IS THE OTHER HALF OF THE POINT
--
-- The spec is explicit and it is the most valuable sentence in it:
--
--     If she edits, we keep both versions: what the house wrote and what she
--     sent. The difference between those two is the highest-quality voice
--     training data in the system — it is a correction with a known intent,
--     and it should be recorded as such.
--
-- An UPDATE would destroy exactly that. So `correspondence_draft` is an
-- immutable log with a `replaces` edge, and the two things she can do to a
-- piece are two different rows rather than one row twice:
--
--   · SAY IT DIFFERENTLY — a new row, hand 'house', replacing the house row
--     she turned down. Her rejection is the signal, and the rejected line is
--     kept because a rejection with nothing attached to it says nothing.
--   · EDIT DIRECTLY — a new row, hand 'hers', replacing whatever she edited.
--     Both texts survive, side by side, in one place, forever.
--
-- `voice_signal` at the bottom is the read that makes it useful: every pair of
-- what-was-written and what-happened-to-it, with the destination, the voice
-- version and the kind of piece attached. That is the corpus. Losing it to an
-- in-place edit would be the cheapest imaginable mistake and the most
-- expensive one, which is why the trigger refuses rather than the application.
--
-- ─────────────────────────────────────────────────────────────────────
-- WHAT IS NOT HERE, DELIBERATELY
--
-- No model, no prompt, no api key, no temperature. Same rule as 004: the
-- prompt is assembled in TypeScript from the voice data by writerPrompt() in
-- src/lib/tokens.ts, and a row that owned an engineering decision would age
-- out faster than the writing it holds. What IS recorded is `model`, on the
-- draft — not to configure anything, but because "which engine wrote this
-- line" is a fact about a line, and a corpus without it cannot be read back.
--
-- No RSVP flow either. `reply` is somewhere for the host to write down what
-- she has been told in a kitchen or a group chat. Guests do not have accounts
-- here and are not going to get them; a société knows its members, and its
-- members' friends are their own business.
-- ─────────────────────────────────────────────────────────────────────

-- ── revelle_guest ────────────────────────────────────────────────────
--
-- Who is coming.
--
-- The email is NULLABLE and that is the interesting decision. Half a real
-- guest list is people who will be told in person, and a list that demands an
-- address for a name is a list that gets kept somewhere else instead. A guest
-- with no address is still a head to count and still a place card to set; she
-- simply is not a recipient.
--
-- `citext` for the address, matching customer.email in 001, so that two
-- spellings of the same person's inbox are one person.

create type guest_reply as enum ('unknown', 'coming', 'not_coming');

create table revelle_guest (
  id          uuid primary key default gen_random_uuid(),
  revelle_id  uuid not null references revelle(id) on delete cascade,

  name        text not null check (btrim(name) <> ''),
  -- Null is legal and common. See above.
  email       citext,

  reply       guest_reply not null default 'unknown',
  replied_at  timestamptz,

  -- Hers. "Bringing the dog", "allergic to shellfish", "arriving late".
  note        text not null default '',

  -- Presentation order. Deferrable because reordering a list means several
  -- rows swapping numbers inside one transaction.
  position    integer not null default 0,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint revelle_guest_email_shaped
    check (email is null or email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  -- A reply she has been given has a date; silence does not.
  constraint revelle_guest_reply_has_timestamp
    check ((reply = 'unknown') = (replied_at is null))
);

create trigger revelle_guest_touch before update on revelle_guest
  for each row execute function set_updated_at();

-- One address once per occasion. Partial, because several guests may have no
-- address at all and NULLs would otherwise be free to repeat anyway — stated
-- explicitly so the intent survives a future Postgres default.
create unique index revelle_guest_address_once
  on revelle_guest (revelle_id, email) where email is not null;

create index revelle_guest_list_idx
  on revelle_guest (revelle_id, position, name);

comment on table revelle_guest is
  'Her guest list for one Revelle. The address is optional: a guest who will '
  'be told in person is still a head and still a place card. See db/024.';

-- ── correspondence ───────────────────────────────────────────────────
--
-- One piece of writing. An invitation, a note before, a bulletin for Saturday
-- morning, a change of address.
--
-- `piece` is a foreign key into voice_piece_kind (004) rather than an enum,
-- for the reason 004 gives: the vocabulary grows on taste, and a vocabulary
-- that grows on taste is an insert.
--
-- `facts` is text[] and not prose. She gives FACTS — Friday, seven o'clock,
-- Dune Road, bring a swimsuit — and the house writes the sentence. That is the
-- whole product, and the column shape is the product's shape: an array of
-- things that must appear, handed to writerPrompt() as `brief.facts`. `ask`
-- beside it is the job in her own words, which is the other half of the brief
-- and the half that is allowed to be a sentence.

create type correspondence_status as enum ('draft', 'sent');

create table correspondence (
  id           uuid primary key default gen_random_uuid(),
  revelle_id   uuid not null references revelle(id) on delete cascade,

  piece        text not null references voice_piece_kind(code) on delete restrict,

  -- THE PIN, and the plain rule. See the essay at the top.
  --
  -- Not merely a copy of revelle.voice_id: a piece written today for a Revelle
  -- delivered in March must use the voice that was pinned in March, and the
  -- application reads it from the Revelle — but it is recorded HERE too,
  -- because a correspondence row has to be able to say what it was written in
  -- without depending on a column somebody could later decide to move.
  voice_id     uuid references world_voice(id) on delete restrict,
  plain        boolean not null default false,
  -- Which of the voice's breaksCharacterFor lines this is. Recorded so the
  -- house can see what it is actually being asked to say straight.
  plain_reason text not null default '',

  -- The brief.
  ask          text not null default '',
  facts        text[] not null default '{}',

  -- 1-based, on an occasion that runs over days — a bulletin is one per
  -- morning and the mornings are ordered. Null on an evening, and on every
  -- piece that is not a bulletin.
  day_index    integer check (day_index is null or day_index >= 1),

  status       correspondence_status not null default 'draft',
  sent_at      timestamptz,

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  -- THE RULE. A plain piece has no voice; a voiced piece has one.
  constraint correspondence_plain_has_no_voice
    check (plain = (voice_id is null)),
  -- And a reason only when it is plain, so the column cannot quietly become a
  -- note field on ordinary pieces.
  constraint correspondence_reason_belongs_to_plain
    check (plain or btrim(plain_reason) = ''),
  constraint correspondence_sent_has_timestamp
    check ((status = 'sent') = (sent_at is not null))
);

create trigger correspondence_touch before update on correspondence
  for each row execute function set_updated_at();

create index correspondence_revelle_idx
  on correspondence (revelle_id, created_at desc);
create index correspondence_voice_idx
  on correspondence (voice_id) where voice_id is not null;

comment on table correspondence is
  'One written piece for one Revelle. A piece with no voice_id is PLAIN — the '
  'breaksCharacterFor route — and the check constraint is what makes that '
  'structural rather than a warning. See db/024.';

comment on column correspondence.facts is
  'What the piece must carry, as facts and not prose: Friday, seven o''clock, '
  'Dune Road. She is never asked to write in the voice herself.';

-- ── correspondence_draft ─────────────────────────────────────────────
--
-- APPEND-ONLY. Every version of the words, in order, with the hand that wrote
-- them and the thing each one replaced. See the essay at the top for why this
-- is not one mutable `body` column.

create type draft_hand as enum ('house', 'hers');

create table correspondence_draft (
  id                uuid primary key default gen_random_uuid(),
  correspondence_id uuid not null
    references correspondence(id) on delete cascade,

  -- 1, 2, 3. Assigned by the guard when omitted, so the application never does
  -- arithmetic against a table it is racing.
  ordinal           integer not null,

  hand              draft_hand not null,
  body              text not null check (btrim(body) <> ''),

  -- What this one replaced. Null on the first draft of a piece.
  --
  --   hand='house' + replaces set  → she said "say it differently", and the
  --                                  row it points at is the line she turned
  --                                  down. That rejection is the signal.
  --   hand='hers'  + replaces set  → she edited. Both texts survive.
  replaces          uuid references correspondence_draft(id) on delete restrict,

  -- Which engine wrote it. Null for anything in her hand, always — the same
  -- shape as world_voice.model_version in 004 and the same reason.
  model             text,
  -- The voice this line was actually written in. Null on a plain piece and on
  -- anything she wrote.
  voice_id          uuid references world_voice(id) on delete restrict,

  created_at        timestamptz not null default now(),

  constraint correspondence_draft_ordinal_unique
    unique (correspondence_id, ordinal),
  constraint correspondence_draft_ordinal_positive check (ordinal >= 1),
  constraint correspondence_draft_hers_has_no_model
    check (hand = 'house' or model is null),
  constraint correspondence_draft_hers_has_no_voice
    check (hand = 'house' or voice_id is null),
  constraint correspondence_draft_replaces_is_not_self
    check (replaces is distinct from id)
);

create index correspondence_draft_piece_idx
  on correspondence_draft (correspondence_id, ordinal desc);
create index correspondence_draft_replaces_idx
  on correspondence_draft (replaces) where replaces is not null;

comment on table correspondence_draft is
  'Every version of one piece, append-only. What the house wrote and what she '
  'sent are two rows, never one row twice — the difference between them is '
  'the corpus. See voice_signal and db/024.';

-- The guard: number it, and refuse to lose it.
--
-- Immutability is enforced here rather than agreed in the application because
-- the value of this table is entirely in the rows nobody wanted to keep. An
-- ORM's save(), a "tidy up old drafts" job, or a well-meant UPDATE on the
-- latest row would each destroy the only record of what the house got wrong.

create or replace function correspondence_draft_guard() returns trigger
language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'correspondence_draft % may not be deleted', old.id
      using errcode = 'restrict_violation',
            hint = 'Drafts are the record of what the house wrote and what '
                   'she sent instead. Nothing is ever removed from it.';
  end if;

  if tg_op = 'UPDATE' then
    raise exception 'correspondence_draft % is immutable', old.id
      using errcode = 'restrict_violation',
            hint = 'Write the next draft. An edit that overwrites the line it '
                   'corrects destroys the only signal the correction carried.';
  end if;

  if new.ordinal is null then
    select coalesce(max(d.ordinal), 0) + 1 into new.ordinal
      from correspondence_draft d
     where d.correspondence_id = new.correspondence_id;
  end if;

  -- A draft may only replace one of its own piece's drafts. Cross-wiring two
  -- pieces would put one host's rejected invitation in another's corpus.
  if new.replaces is not null then
    perform 1 from correspondence_draft d
      where d.id = new.replaces
        and d.correspondence_id = new.correspondence_id;
    if not found then
      raise exception 'draft % is not part of correspondence %',
        new.replaces, new.correspondence_id
        using errcode = 'foreign_key_violation';
    end if;
  end if;

  return new;
end;
$$;

create trigger correspondence_draft_number before insert on correspondence_draft
  for each row execute function correspondence_draft_guard();

create trigger correspondence_draft_immutable
  before update or delete on correspondence_draft
  for each row execute function correspondence_draft_guard();

-- ── correspondence_send ──────────────────────────────────────────────
--
-- Who it went to, which words went, and what the provider said.
--
-- One row per RECIPIENT rather than per send, because "did Nora get the change
-- of address" is the question that actually gets asked, and a send with three
-- addresses in a column cannot answer it.
--
-- The address is copied rather than joined. A guest removed from the list
-- afterwards does not un-receive her invitation, and the record of where a
-- piece went must not depend on a row somebody can delete.

create table correspondence_send (
  id                uuid primary key default gen_random_uuid(),
  correspondence_id uuid not null
    references correspondence(id) on delete cascade,
  -- The exact words that went. Not "the latest draft" — the one she read.
  draft_id          uuid not null
    references correspondence_draft(id) on delete restrict,

  -- Who, when she is still on the list. Null when she is not, or was never
  -- on it — a piece may be sent to one address by hand.
  guest_id          uuid references revelle_guest(id) on delete set null,
  email             citext not null,

  -- Resend's id. Worth recording: delivery webhooks reference it.
  provider_id       text,
  -- The provider's sentence when it refused. Null on success.
  error             text,

  sent_at           timestamptz not null default now(),

  constraint correspondence_send_email_shaped
    check (email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  constraint correspondence_send_has_an_outcome
    check ((provider_id is null) <> (error is null))
);

create index correspondence_send_piece_idx
  on correspondence_send (correspondence_id, sent_at desc);
create index correspondence_send_guest_idx
  on correspondence_send (guest_id) where guest_id is not null;

comment on table correspondence_send is
  'One row per recipient per send. The address is copied, not joined: a guest '
  'removed from the list afterwards does not un-receive her invitation.';

-- A send must carry words that belong to the piece it is a send of.
create or replace function correspondence_send_guard() returns trigger
language plpgsql as $$
begin
  perform 1 from correspondence_draft d
    where d.id = new.draft_id
      and d.correspondence_id = new.correspondence_id;
  if not found then
    raise exception 'draft % is not part of correspondence %',
      new.draft_id, new.correspondence_id
      using errcode = 'foreign_key_violation',
            hint = 'A send records the words that actually went. They have to '
                   'be this piece''s words.';
  end if;
  return new;
end;
$$;

create trigger correspondence_send_belongs before insert or update
  on correspondence_send
  for each row execute function correspondence_send_guard();

-- ── voice_signal ─────────────────────────────────────────────────────
--
-- THE CORPUS. Every line the house wrote that did not survive contact with the
-- woman it was written for, and what happened to it.
--
--   kind='rejected'   she asked for it differently. The house wrote both.
--   kind='corrected'  she edited. The house wrote one, she sent the other.
--
-- Both are training data and they are not the same training data, which is
-- why the view distinguishes them rather than returning a pile of pairs. A
-- rejection says "not this"; a correction says "this instead", and the second
-- is worth more precisely because it carries the answer.
--
-- Every row is anchored to a destination and a voice VERSION, so a signal
-- collected against version 2 is never silently read as evidence about
-- version 3. That is the same promise db/004 makes about a delivered Revelle,
-- pointed at the feedback rather than at the words.

create view voice_signal as
select later.id                       as signal_id,
       case later.hand
         when 'house' then 'rejected'
         else 'corrected'
       end                            as kind,
       c.id                           as correspondence_id,
       c.piece,
       c.ask,
       c.facts,
       w.id                           as world_id,
       w.slug                         as world_slug,
       v.id                           as voice_id,
       v.version                      as voice_version,
       earlier.body                   as house_wrote,
       later.body                     as she_has,
       earlier.model,
       later.created_at
  from correspondence_draft later
  join correspondence_draft earlier on earlier.id = later.replaces
  join correspondence c on c.id = later.correspondence_id
  join revelle r on r.id = c.revelle_id
  join world w on w.id = r.world_id
  left join world_voice v on v.id = c.voice_id;

comment on view voice_signal is
  'Every line the house wrote that she rejected or edited, paired with what '
  'replaced it, anchored to the destination and the voice version it was '
  'written against. The highest-quality voice training data in the system.';

-- What is in force for a piece: the newest draft.
create view correspondence_current as
select c.id                 as correspondence_id,
       c.revelle_id,
       c.piece,
       c.status,
       c.plain,
       d.id                 as draft_id,
       d.ordinal,
       d.hand,
       d.body
  from correspondence c
  join lateral (
    select d.* from correspondence_draft d
     where d.correspondence_id = c.id
     order by d.ordinal desc
     limit 1
  ) d on true;

comment on view correspondence_current is
  'The words currently in force for each piece: its newest draft. A piece '
  'with no draft yet is absent, which is true — nothing has been written.';

-- ─────────────────────────────────────────────────────────────────────
-- WHAT THIS DOES NOT DO, DELIBERATELY
--
-- Nothing sends itself. There is no queue, no schedule, no trigger that mails
-- anything, and a bulletin for Saturday morning does not go out on Saturday
-- morning by itself. docs/portal-spec.md: nothing generated goes out without
-- her reading it first. A scheduler is one row and a job (db/008 already has
-- the queue) the day somebody decides an unread piece may leave the building,
-- and that is a product decision rather than a missing feature.
--
-- There is also no delivery status beyond what the provider said at the
-- moment of sending. Resend's webhooks reference `provider_id`, which is
-- recorded here for exactly that reason; consuming them is another table and
-- another endpoint, and pretending to know that a message was opened would be
-- worse than not knowing.
-- ─────────────────────────────────────────────────────────────────────
