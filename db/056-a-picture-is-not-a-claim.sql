-- Revelle Société — A PICTURE IS NOT A CLAIM
--
-- Applied by scripts/migrate.mjs after 055, inside one transaction together
-- with its schema_migrations ledger row.
--
-- ─────────────────────────────────────────────────────────────────────
-- WHAT THIS IS FOR
--
-- Founder, 2026-09-02: "id need to see it on the dashboard somewhere to okay
-- it. also the image bank should be a droppable area on a tab on the desk so
-- Tara and I can drop images".
--
-- scripts/mood-board.mjs already does the reading. It takes a folder of
-- reference photographs, asks what OBJECT is in each one with the photograph's
-- styling stripped off, proposes rooms, and writes a markdown sheet. Its
-- header is the specification for that half and none of it changes here.
--
-- What it cannot do is the half the founder asked for. A markdown sheet is on
-- somebody's laptop, which is the one place this pipeline is not allowed to
-- depend on (CLAUDE.md rule 9, and MEMORY's standing constraint). Two curators
-- cannot drop into it. And an accepted line still had to be hand-pasted into
-- docs/atmosphere-idea-bank-v1.md and wait for a deploy, which is a hand
-- translation, which is where a register slips.
--
-- So the three tables below are: the picture, what was read out of it, and
-- what she decided. In that order, because each one is evidence for the next.
--
-- ─────────────────────────────────────────────────────────────────────
-- THE IMAGES ARE OTHER PEOPLE'S PHOTOGRAPHS AND STAY THAT WAY
--
-- Said here because a schema is where the next person learns what a table is
-- allowed to do. `reference_image.bytes` is PRIVATE REFERENCE. It is readable
-- by a signed-in member of STAFF_EMAILS and by nothing else: not the portal,
-- not an artifact, not a member-facing route, not an export, not an email.
-- Nothing in the product ever renders one.
--
-- What CAN ship is the text — the house's own words about an object, which is
-- what `reference_image_reading.bank_clause` holds and what an approved
-- verdict copies into a bank row. That distinction is the whole licence story
-- and it is repeated at the two places somebody would write the wrong code:
-- src/app/desk/(signed-in)/images/[id]/view/route.ts, which is the only reader
-- of the bytes, and src/lib/desk/images.ts, which is the only writer.
--
-- ─────────────────────────────────────────────────────────────────────
-- WHY POSTGRES AND NOT OBJECT STORAGE
--
-- There are no R2/S3 credentials in this service and introducing a second
-- store for two curators' scrapbook would be a new failure mode, a new secret
-- and a new thing that can be reachable from a laptop when the database is
-- not. The volume is hundreds of files, not millions, and every one is
-- downscaled to a long edge of 1600px before it is written — call it 200-400KB
-- each, so the whole bank is comfortably inside a few hundred megabytes.
--
-- The list view is cheap for a reason worth writing down, because it looks
-- like the obvious defect of this design: Postgres TOASTs a large `bytea` out
-- of line, so a `select id, filename, dropped_at …` that does not name `bytes`
-- or `thumb` never reads them. The list query below is exactly that, and the
-- pixels arrive one request at a time through a route that names one image.
--
-- `thumb` is a separate, small column rather than a resize at read time
-- because the alternative is decoding a 1600px JPEG on every card of every
-- render — the only expensive thing about this shape, bought once at upload.
--
-- ─────────────────────────────────────────────────────────────────────
-- CLAUDE.md RULE 33, ASKED AND ANSWERED
--
-- "A constraint over seed-supplied data must BACKFILL before it constrains."
-- Every table here is CREATED EMPTY by this file. No seeder writes any of
-- them, none is in render.yaml's chain, and there is no existing row anywhere
-- that any CHECK below can meet. So there is nothing to backfill and the
-- scratch-seeded/production-unseeded gap does not open — not because the
-- check passed in scratch, but because the tables cannot hold a row until
-- somebody drags a file onto a screen that does not exist yet.
--
-- The one place this file DOES touch existing data is nothing at all: it adds
-- no column to `bank_item`, changes no constraint on it, and writes no row.
-- An approved verdict inserts an ordinary draft `bank_item` at run time,
-- through the same statement the desk form already uses.

-- ─────────────────────────────────────────────────────────────────────
-- 1 · THE PICTURE

create table reference_image (
  id           uuid primary key default gen_random_uuid(),

  -- THE DEDUPE. Two curators saving from the same feed will drop the same
  -- picture, and the same person will drop a folder twice. A second upload of
  -- identical bytes is the SAME PIN, not a second one — it must not become a
  -- second card, a second reading and a second model call.
  --
  -- Over the ORIGINAL bytes as uploaded, not over the downscaled copy: the
  -- resize is this system's decision and could change with a library version,
  -- and a dedupe key that moves when a dependency moves is a dedupe key that
  -- silently stops working. lower-case hex, 64 characters.
  sha256       text not null unique check (sha256 ~ '^[0-9a-f]{64}$'),

  -- As the file was called on her machine. Kept because it is often the only
  -- provenance a saved picture has, and it is shown on the card.
  filename     text not null default '',

  -- What is STORED, which is not necessarily what was uploaded: a PNG screen
  -- grab is written back as a JPEG. The four the reader accepts and the two
  -- the writer emits are both narrower than this list; it is spelled out so a
  -- row can never hold a type the view route would have to guess at.
  media_type   text not null
                 check (media_type in ('image/jpeg', 'image/png', 'image/webp')),
  bytes        bytea not null,

  -- The card-sized copy. Not nullable: a row whose thumbnail failed to build
  -- is a row the list cannot draw, and half a picture in the bank is worse
  -- than a refused upload — the upload is refused instead.
  thumb        bytea not null,
  thumb_media_type text not null
                 check (thumb_media_type in ('image/jpeg', 'image/webp')),

  -- Of the stored copy, for the view route's headers and for the desk to be
  -- able to say what this bank costs without reading the bytes.
  width        integer not null check (width > 0),
  height       integer not null check (height > 0),
  byte_size    integer not null check (byte_size > 0),
  -- What it weighed before the downscale. The only evidence that the
  -- downscale is doing anything at all — CLAUDE.md rule 24: count what it
  -- matched. A bank where these two columns are equal on every row is a bank
  -- whose resize never ran.
  original_byte_size integer not null check (original_byte_size > 0),

  -- WHO DROPPED IT. Two curators, and the founder asked for this screen so
  -- that she and Tara could both use it — so "who put this here" is the first
  -- thing a card has to be able to say. `restrict`, like every other
  -- attribution in this schema: an attribution that can be deleted away is
  -- not one.
  dropped_by   uuid not null references staff(id) on delete restrict,
  dropped_at   timestamptz not null default now()
);

-- The list: newest first, and that is the only order this screen has.
create index reference_image_dropped_idx on reference_image (dropped_at desc);

comment on table reference_image is
  'A reference photograph two curators dropped onto /desk/images. PRIVATE, '
  'STAFF-ONLY, AND NEVER MEMBER-FACING: these are other people''s pictures '
  'held as reference, and the only thing this system may ever ship out of one '
  'is the house''s own words about the object in it. Deduplicated by sha256 '
  'over the ORIGINAL upload. Downscaled on the way in; `thumb` is the card '
  'copy so a list render reads no full-size bytes.';

comment on column reference_image.sha256 is
  'Hex sha-256 of the bytes AS UPLOADED, before the downscale. Over the '
  'original and not the stored copy on purpose: the resize is this system''s '
  'choice and would move with a library version, and a dedupe key that moves '
  'with a dependency stops deduplicating without saying so.';

-- ─────────────────────────────────────────────────────────────────────
-- 2 · WHAT WAS READ OUT OF IT
--
-- ── ONE ROW PER READING, NOT ONE PER IMAGE ──────────────────────────
--
-- A picture can be read again — a new model, a wider catalogue, a room that
-- did not exist the first time. The second reading does not overwrite the
-- first, for CLAUDE.md rule 14's reason and for a sharper one: a verdict was
-- made against a particular reading, and a verdict whose evidence has been
-- edited underneath it is a verdict about text nobody can see any more. So
-- `reference_image_verdict` points at the reading it answered, and the
-- newest reading is the one the screen shows.

create table reference_image_reading (
  id           bigint generated always as identity primary key,
  image_id     uuid not null references reference_image(id) on delete cascade,

  -- What read it, verbatim from the response. src/lib/model.ts names one
  -- model and there must never be a second, but what a row records is what
  -- ANSWERED, which can differ (writer.ts already carries a server-side
  -- fallback for exactly this reason).
  model        text not null,

  -- The four fields the prompt asks for, under their own names. `object` is
  -- the load-bearing one and the reason the script exists: what the thing IS,
  -- with the photograph's styling stripped off.
  object       text not null,
  styling_note text not null default '',

  -- NO ROOM IS A CORRECT AND COMMON ANSWER, and the prompt says so twice. A
  -- reading that refuses is a finished reading, not a failed one — it is
  -- stored, it is shown, and it stops the image being read again forever.
  no_room      boolean not null,

  -- The one thing a founder would have to decide before this ships. It is
  -- what rides into a bank row's description behind the FOUNDER-PENDING
  -- marker if she approves, which is how the row holds itself in draft.
  question     text not null default '',

  -- The item written in the bank's own syntax. THE ONLY THING HERE THAT COULD
  -- EVER SHIP: it is the house's words, not the photographer's picture.
  bank_clause  text not null default '',

  -- Reading a picture is not a claim about a room, so this is not a governed
  -- act — but it spends money and it is attributable, and the desk shows who
  -- pressed it.
  read_by      uuid not null references staff(id) on delete restrict,
  read_at      timestamptz not null default now(),

  -- A refusal is a reading. A reading with no object at all is not: the
  -- prompt's first and load-bearing instruction is to name the object, so a
  -- reply that named none did not do the one thing that was asked and must
  -- not be recorded as a completed read.
  constraint reference_image_reading_says_something
    check (btrim(object) <> '')
);

create index reference_image_reading_newest_idx
  on reference_image_reading (image_id, read_at desc, id desc);

comment on table reference_image_reading is
  'One placement reading of one reference image. Append-only in practice: a '
  're-read INSERTS another row and the newest is the one in force, because a '
  'verdict already recorded points at the reading it answered and evidence '
  'edited under a decision is evidence nobody can check. The prompt lives in '
  'src/lib/desk/images.ts and is shared with scripts/mood-board.mjs.';

-- ── the candidate rooms ──────────────────────────────────────────────
--
-- A child table rather than a jsonb array, for one reason that decides it:
-- APPROVAL PICKS A CANDIDATE. The founder does not approve an image, she
-- approves this object INTO THIS ROOM — so the thing she clicks has to be a
-- row a verdict can point at, or the record of what she approved is an index
-- into an array that a re-read would renumber.

create table reference_image_candidate (
  id           bigint generated always as identity primary key,
  reading_id   bigint not null
                 references reference_image_reading(id) on delete cascade,

  -- The slug the model named, kept as it was said even when it resolves to
  -- nothing. CLAUDE.md rule 16: a proposal naming a room this catalogue does
  -- not have is REFUSED VISIBLY on the screen, not dropped on the floor —
  -- dropping it would make a five-candidate reading render as four with
  -- nothing anywhere saying why.
  room_slug    text not null check (btrim(room_slug) <> ''),
  -- Null when the slug names no live room. Such a candidate cannot be
  -- approved and the screen says so in words.
  world_id     uuid references world(id) on delete cascade,

  -- The prompt's own vocabulary. `none` is in the list because the model is
  -- allowed to say it and a row that says it is a row the screen must not
  -- offer a button for.
  placement    text not null
                 check (placement in ('take_home', 'table_set', 'atmosphere',
                                      'light', 'act', 'none')),
  confidence   text not null check (confidence in ('strong', 'possible', 'weak')),
  why          text not null default '',

  -- The order the reading gave them, which is the order they are shown in.
  -- NOT a ranking the screen may act on: nothing is pre-selected, nothing is
  -- styled as the obvious one, and `strong` is a label the founder reads
  -- rather than a default the screen takes.
  --
  -- `ordinal` and not `position`, which is what it wanted to be called:
  -- POSITION is a SQL function keyword (`position(x in y)` — db/043's slot
  -- classifier uses it eleven times), and a bare `position >= 0` inside a
  -- CHECK is a parse this file has no reason to gamble on.
  ordinal      integer not null check (ordinal >= 0),

  unique (reading_id, ordinal)
);

create index reference_image_candidate_world_idx
  on reference_image_candidate (world_id) where world_id is not null;

comment on table reference_image_candidate is
  'One proposed room for one reading. A row, not an array element, because a '
  'verdict points at the candidate the founder approved and an array index '
  'renumbers on the next read. `world_id` is null when the model named a slug '
  'this catalogue does not have — the candidate is still SHOWN, refused in '
  'words, because a silently dropped proposal is indistinguishable from one '
  'that was never made.';

comment on column reference_image_candidate.ordinal is
  'Display order, from the reading. NOT a ranking anything may act on. '
  'Nothing on /desk/images is pre-selected — see the head of the page.';

-- ─────────────────────────────────────────────────────────────────────
-- 3 · WHAT SHE DECIDED
--
-- ── APPEND-ONLY, LIKE staff_action AND copy_reconciliation ──────────
--
-- CLAUDE.md rule 14. A refusal reversed six months later is exactly the sort
-- of decision whose first version somebody needs, and rule 18's cheap
-- correction depends on it: the undo for a mis-click is another click on the
-- same card, with the first verdict still readable under it.
--
-- ── AND WHY A REFUSAL IS A ROW AT ALL ───────────────────────────────
--
-- Because the alternative is that the picture is read again next week and
-- proposed again, forever. A refusal is the only thing that can stop that,
-- and CLAUDE.md rule 17's shape applies even though this is not a governed
-- class: a "no" with nothing written down is an adjudication with the opinion
-- torn off, and the next agent re-derives it at full price.
--
-- The image is KEPT on a refusal. Deleting it would lose the dedupe key, and
-- the same picture dropped again next month would arrive as new.

create table reference_image_verdict (
  id           bigint generated always as identity primary key,
  image_id     uuid not null references reference_image(id) on delete cascade,

  -- WHICH READING SHE ANSWERED. Not decoration: a re-read after a refusal is
  -- a new proposal about the same picture, and the screen has to be able to
  -- say "you refused the reading from Tuesday, this is a different one".
  reading_id   bigint not null
                 references reference_image_reading(id) on delete cascade,

  verdict      text not null check (verdict in ('approved', 'refused')),

  -- APPROVING IS CHOOSING A ROOM. There is no generic yes on this screen and
  -- the constraint below is what makes that structural rather than a habit of
  -- the UI: an approval with no candidate is refused by the database.
  candidate_id bigint references reference_image_candidate(id) on delete restrict,

  -- The draft it created. `set null` rather than `restrict`: deleting a
  -- refused draft at /desk/bank is a gesture the founder already has
  -- (deleteBankItem), and it must not be blocked by this row — but the fact
  -- that this approval DID create one stays true, which is why the row
  -- survives with a null pointer rather than being deleted with it.
  bank_item_id uuid references bank_item(id) on delete set null,

  note         text not null default '',

  decided_by   uuid not null references staff(id) on delete restrict,
  decided_at   timestamptz not null default now(),

  constraint reference_image_verdict_approval_names_a_room check (
    case verdict
      when 'approved' then candidate_id is not null
      else candidate_id is null
    end
  )
);

create index reference_image_verdict_current_idx
  on reference_image_verdict (image_id, decided_at desc, id desc);

create or replace function reference_image_verdict_guard() returns trigger
language plpgsql as $$
begin
  raise exception
    'reference_image_verdict is append-only: row % may not be %.',
    coalesce(old.id, new.id), lower(tg_op)
    using errcode = 'restrict_violation',
          hint = 'Changing your mind INSERTS another verdict; the newest is '
                 'the one in force. CLAUDE.md rule 14 — superseded reasoning '
                 'is preserved, never deleted — and rule 18: the correction '
                 'for a mis-click is another click on the same card, with the '
                 'first verdict still readable under it.';
end;
$$;

create trigger reference_image_verdict_no_edit
  before update or delete on reference_image_verdict
  for each row execute function reference_image_verdict_guard();

comment on table reference_image_verdict is
  'One row per founder gesture on one reference image. Append-only; the '
  'newest row per image is the one in force. An approval NAMES A CANDIDATE — '
  'there is no generic yes — and the bank row it creates is always a DRAFT '
  'carrying a FOUNDER-PENDING question (CLAUDE.md rule 13). A refusal keeps '
  'the image, so the same picture is not read and proposed again forever.';

-- The verdict in force, one per image. Same idiom and same reason as
-- copy_reconciliation_current in db/055: `distinct on` over the index above,
-- a view and not a materialised one, because the superseded rows are shown
-- under the card rather than thrown away.

create or replace view reference_image_verdict_current as
select distinct on (image_id)
       id, image_id, reading_id, verdict, candidate_id, bank_item_id,
       note, decided_by, decided_at
  from reference_image_verdict
 order by image_id, decided_at desc, id desc;

comment on view reference_image_verdict_current is
  'The verdict in force for each reference image — the newest row only. The '
  'superseded ones stay in reference_image_verdict and are shown under the '
  'card, because a reversed decision without its predecessor is an '
  'adjudication with the opinion torn off (CLAUDE.md rule 17).';
