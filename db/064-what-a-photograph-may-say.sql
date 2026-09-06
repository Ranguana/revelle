-- ── 064 · WHAT A PHOTOGRAPH MAY SAY, AND WHAT IT MAY NEVER ───────────
--
-- Applied by scripts/migrate.mjs after 063, inside one transaction together
-- with its schema_migrations ledger row.
--
-- Founder, 2026-09-05: "A member is saying: this light, this table, this era,
-- not that one. Your job is to read the photo, map it onto the house, and put
-- the original away." And: "Do not store 'similar Pinterest pins.' Store the
-- attributes."
--
-- So: three tables. The picture she attached, what was read out of it, and one
-- row per CLAIM. Nothing here holds a similarity, an embedding, a neighbour or
-- a room.
--
-- The vocabulary and every rule below are owned by src/lib/photo-extract.ts.
-- This file is the wall the code stands behind, and
-- src/lib/photo-extract.test.ts drives the two ends against each other rather
-- than comparing the code to itself (CLAUDE.md rule 21: the guard must go
-- through the consumers).
--
-- ─────────────────────────────────────────────────────────────────────
-- THIS SCHEMA CANNOT NAME A DESTINATION. THAT IS ITS MAIN FEATURE.
--
-- Founder: "Do not add `destination: string | null`. A nullable slug is an
-- invitation." There is no world_id here, no slug, no room name, nullable or
-- otherwise, and there must never be one. A photograph proposes CELLS. Which
-- room those cells reach is stage 4's arithmetic and the founder's signature,
-- and it happens somewhere else on some other day.
--
-- The one column that would have been added "just for the desk to show" is the
-- one that would end up joined on. src/lib/photo-extract.test.ts fails if this
-- file names `world`, `destination` or `slug` outside a comment.
--
-- ─────────────────────────────────────────────────────────────────────
-- THREE FACETS ARE REFUSED BY A CHECK CONSTRAINT, NOT BY A PROMPT
--
--   `arrival`  is a fingerprint column. `assigned` is Catskills alone (see
--              fedBy in data/destination-matrix.json), so one accepted tap
--              would name a room.
--   `ending`   is already fed, by `how_it_ends`.
--   `starts`   is already fed, by `meal_time`.
--
-- A photograph may not overrule a quiz answer, and a photograph may not
-- fingerprint a room. Those are two different arguments and the constraint
-- serves both. It is a CHECK rather than a comment because the model, the
-- desk, a future script and a hand-written INSERT are four writers and only
-- one of them reads TypeScript.
--
-- Adding a facet to that list later is a migration, deliberately. Under rule
-- 13 a cell reaching a member is founder-signed, and the day `arrival` becomes
-- readable from a picture is a day somebody decides on purpose.
--
-- ─────────────────────────────────────────────────────────────────────
-- HER STRIKE ALWAYS WINS
--
-- Founder: "If she removed `dressed`, the desk cannot put it back on the same
-- photo. They can ask her a question. That is a different act."
--
-- `member_struck_at` and the trigger below are that sentence as a mechanism.
-- Once she has struck a claim it cannot become `accepted` and the strike
-- cannot be lifted — by anybody, from any screen, including a curator with
-- good intentions and a plausible reason. What the desk may do instead is ask
-- her, and her answer arrives as an answer rather than as an override.
--
-- ─────────────────────────────────────────────────────────────────────
-- THE SET IS A VIEW
--
-- Founder: "Do not add `approved_set`. The set is a view." There is no fourth
-- table holding the merged result and there is no materialised column. The
-- merge rule lives in `mergeSet` in src/lib/photo-extract.ts and is computed
-- on read, because a stored set is a fourth record of a fact three tables
-- already hold and it goes stale the first time somebody strikes something.
--
-- ─────────────────────────────────────────────────────────────────────
-- AND NOTHING HERE FEEDS THE RANKER YET
--
-- CLAUDE.md rule 15 in the shape the founder gave it: an accepted cell waits
-- for a `fedBy` entry in data/destination-matrix.json, and no entry is added
-- by this migration. Until one exists these rows are proposals on a desk. The
-- desk screen says so where a curator is standing (rule 16) rather than
-- letting an accepted claim look like a wired one.
--
-- ─────────────────────────────────────────────────────────────────────
-- RULE 33: THIS MIGRATION CONSTRAINS NO SEED-SUPPLIED VALUE
--
-- Every table below is new and empty on the day it runs. There is no
-- backfill to get wrong and no constraint that a later seeder must satisfy,
-- so the scratch-seeded / production-unseeded failure class does not apply.

-- ─────────────────────────────────────────────────────────────────────
-- 0 · THE VOCABULARIES

-- The three things a member can mean by attaching a picture. An enum rather
-- than text because these three are structural — `place_she_has` is the only
-- one that may touch feasibility, and a fourth value would be a decision about
-- the seam rather than a new label.
create type photo_role as enum (
  'place_she_has',
  'evening_she_wants',
  'object_to_find'
);

comment on type photo_role is
  'What a member meant by attaching a picture. `place_she_has` is EVIDENCE '
  'ABOUT HER ROOM and the only role that may light may_prune. '
  '`evening_she_wants` is taste and may only propose cells. `object_to_find` '
  'proposes nothing. See src/lib/photo-extract.ts.';

-- What has happened to one proposed cell.
create type photo_claim_status as enum (
  'proposed',
  'accepted',
  'struck',
  'silent'
);

comment on type photo_claim_status is
  'proposed: the extractor wrote it, nobody has looked. accepted: a person '
  'kept it. struck: a person removed it. silent: it states nothing and never '
  'will. SILENT IS THE COLUMN DEFAULT — a row arriving with no status states '
  'nothing rather than counting as a proposal nobody made.';

-- ─────────────────────────────────────────────────────────────────────
-- 1 · THE PICTURE SHE ATTACHED

create table application_photo (
  id           uuid primary key default gen_random_uuid(),

  -- THE APPLICATION, which in this schema is a quiz_response. Not the
  -- customer: a host may bring the house a second occasion (db/063 says so
  -- about the pass), and the photographs she attaches to the second one are
  -- about that night and not about her.
  quiz_response_id uuid not null
                     references quiz_response(id) on delete cascade,

  -- THE CAP, STRUCTURALLY. MAX_PHOTOS = 7 in src/lib/photo-extract.ts, and it
  -- is here as well because a cap enforced by `select count(*)` before an
  -- insert loses every race it is ever in. Two tabs uploading at once cannot
  -- produce an eighth.
  ordinal      smallint not null check (ordinal between 1 and 7),

  -- The dedupe, over the ORIGINAL bytes as uploaded, for db/056's reason: the
  -- resize is this system's decision and a dedupe key that moves when a
  -- dependency moves is one that silently stops working. Scoped to the
  -- application — the same picture on two applications is two facts.
  sha256       text not null check (sha256 ~ '^[0-9a-f]{64}$'),

  filename     text not null default '',
  media_type   text not null
                 check (media_type in ('image/jpeg', 'image/png', 'image/webp')),
  bytes        bytea not null,
  thumb        bytea not null,
  thumb_media_type text not null
                 check (thumb_media_type in ('image/jpeg', 'image/webp')),

  width        integer not null check (width > 0),
  height       integer not null check (height > 0),
  byte_size    integer not null check (byte_size > 0),
  -- What it weighed before the downscale. The only evidence the downscale ran
  -- at all (rule 24): a table where these two are equal on every row has a
  -- resize that stopped working and said nothing.
  original_byte_size integer not null check (original_byte_size > 0),

  -- WHAT SHE MEANT BY IT. Nullable, and the nullability is the design: a
  -- photograph whose role nobody has stated is a photograph whose role nobody
  -- has stated. Defaulting it to `evening_she_wants` would invent her meaning,
  -- and the role it would invent is the one that proposes cells.
  role         photo_role,
  -- Set whenever `role` moves, by the member or by the desk. Rule 25's shape
  -- for a ledger: the act has a time, and staff_action carries who.
  role_set_at  timestamptz,

  uploaded_at  timestamptz not null default now(),

  constraint application_photo_one_pin unique (quiz_response_id, sha256),
  constraint application_photo_one_slot unique (quiz_response_id, ordinal),
  constraint application_photo_role_has_a_time
    check ((role is null) = (role_set_at is null))
);

create index application_photo_application_idx
  on application_photo (quiz_response_id, ordinal);

comment on table application_photo is
  'A photograph a member attached to her application. PRIVATE. Readable by a '
  'signed-in member of STAFF_EMAILS and by the applicant herself through her '
  'own application pass, and by nobody else — never the portal, never an '
  'export, never an email, never an artifact. At most seven per application, '
  'enforced by the ordinal CHECK rather than by a count. What the product may '
  'ever ship out of one is the house''s own words about it. See db/064.';

comment on column application_photo.role is
  'NULL means nobody has said what this picture is for. That is not '
  '`evening_she_wants` and must never be read as it: only `place_she_has` may '
  'light application_photo_extract.may_prune, and inventing a role is how a '
  'saved terrace becomes evidence about her house.';

-- ─────────────────────────────────────────────────────────────────────
-- 2 · WHAT WAS READ OUT OF IT

create table application_photo_extract (
  id           uuid primary key default gen_random_uuid(),
  photo_id     uuid not null references application_photo(id) on delete cascade,

  -- Which set of rules produced this. PHOTO_EXTRACT_VERSION in
  -- src/lib/photo-extract.ts. Rule 17 from the other end: a claim whose rules
  -- cannot be recovered is a reading with the opinion torn off.
  version      text not null,
  -- Whatever the API said it was. Never assumed from src/lib/model.ts, which
  -- is what was ASKED for; a server-side fallback can answer with another.
  model        text not null default '',

  -- The role AS IT STOOD when the frame was read. Kept on the extract as well
  -- as on the photo because the desk changing a role later must not silently
  -- re-mean a reading that was taken under the old one.
  role         photo_role,

  -- THE SEAM. Founder: "That flag is the whole seam." Set by
  -- `mayPrune(role)` in src/lib/photo-extract.ts and by nothing else — never
  -- by the model, which has no way to reach it, and never by the desk. The
  -- CHECK below is the belt for that brace: even a hand-written INSERT cannot
  -- light this flag on a photograph that is not her place.
  may_prune    boolean not null default false,

  -- `read` carries claims. `silent` carries none and says why.
  outcome      text not null check (outcome in ('read', 'silent')),
  -- The reason, in words, for a silent reading. A malformed reply, a refusal,
  -- a network failure and an empty frame all land here, because from the
  -- matrix's side they are one fact. Founder: "Do not retry with a looser
  -- prompt. A retry that 'just works' is how `assigned` appears."
  silence      text,

  -- COUNTED FROM THE PIXELS, NEVER ASKED OF THE MODEL. Founder: "VLMs invent
  -- #C4A574. Count pixels." [{ "hex": "#rrggbb", "share": 0.21 }, …]
  palette      jsonb not null default '[]'::jsonb
                 check (jsonb_typeof(palette) = 'array'),

  -- What the place can physically DO, and only as a positive: there is a sky,
  -- there is a fire, there is a kitchen. THERE IS NO WAY TO RECORD AN ABSENCE
  -- (CLAUDE.md rule 3), and this array is empty unless may_prune is true.
  venue        jsonb not null default '[]'::jsonb
                 check (jsonb_typeof(venue) = 'array'),
  -- The light and the density, in the ten closed codes TONE_CUES holds. These
  -- are the words the MEMBER reads back on her own screen. They grade nothing.
  tone         jsonb not null default '[]'::jsonb
                 check (jsonb_typeof(tone) = 'array'),
  -- Things in the frame, named plainly. For `object_to_find`. Proposes no
  -- cell, reaches no pool, feeds no ranker; it is her evidence, kept, for
  -- whoever later builds the edit.
  objects      jsonb not null default '[]'::jsonb
                 check (jsonb_typeof(objects) = 'array'),

  -- How many entries the parser threw away. Rule 24: a validator that has
  -- never reported a drop is a validator nobody has checked.
  dropped      jsonb not null default '[]'::jsonb
                 check (jsonb_typeof(dropped) = 'array'),

  read_at      timestamptz not null default now(),

  -- THE SEAM, AS A CONSTRAINT.
  constraint application_photo_extract_prune_needs_her_place
    check (may_prune = false or role = 'place_she_has'),
  -- A venue cue is only ever evidence about HER place.
  constraint application_photo_extract_venue_needs_prune
    check (may_prune = true or venue = '[]'::jsonb),
  -- A silence carries its reason, always (rule 17).
  constraint application_photo_extract_silence_has_a_reason
    check ((outcome = 'silent') = (silence is not null
                                   and length(btrim(silence)) > 0))
);

create index application_photo_extract_photo_idx
  on application_photo_extract (photo_id, read_at desc);

comment on table application_photo_extract is
  'One reading of one frame. `silent` is a complete, storable reading that '
  'says nothing about the evening and carries the reason — not an error state '
  'handled elsewhere. There is NO destination column here and there must '
  'never be one: a photograph proposes cells, and which room those cells '
  'reach is stage 4''s arithmetic and the founder''s signature. See db/064.';

comment on column application_photo_extract.may_prune is
  'Whether this reading may eliminate what cannot physically happen where she '
  'is. TRUE only for a `place_she_has` frame, enforced by CHECK. A saved '
  'terrace off the internet is taste, and taste never reaches feasibility '
  '(CLAUDE.md rule 2''s constraint door). Nothing consumes this yet: venue '
  'prunes at stage 3 from quiz_response.environment, and a cue read off a '
  'picture does not join that path until the founder wires it.';

-- ─────────────────────────────────────────────────────────────────────
-- 3 · ONE ROW PER CLAIM

create table photo_claim (
  id           uuid primary key default gen_random_uuid(),
  extract_id   uuid not null
                 references application_photo_extract(id) on delete cascade,
  -- Denormalised on purpose and not a second authority: every read of this
  -- table is per-photograph or per-application, and the alternative is a join
  -- on every strike. The FK cascade keeps them honest.
  photo_id     uuid not null references application_photo(id) on delete cascade,

  -- THE SIX. The three that are missing are missing on purpose; see the essay
  -- at the top. src/lib/photo-extract.test.ts parses this list out of this
  -- file and compares it to PROPOSABLE_FACETS, from both ends.
  facet        text not null
                 check (facet in ('schedule', 'volume', 'dress', 'food',
                                  'size', 'spectacle')),

  -- A level OF ITS FACET. The pairing, which a flat enum in a tool schema
  -- cannot express and which is therefore stated here as well as checked in
  -- `isLevelOf`. Copied from data/destination-matrix.json; the test fails if
  -- the two ever disagree, which is what stops this becoming a stale list.
  level        text not null,
  constraint photo_claim_level_belongs_to_facet check (
       (facet = 'schedule'  and level in ('posted', 'anchored', 'standing', 'unplanned'))
    or (facet = 'volume'    and level in ('overlapping', 'one_conversation', 'quiet'))
    or (facet = 'dress'     and level in ('dressed', 'plain'))
    or (facet = 'food'      and level in ('bought', 'cooked', 'arrived'))
    or (facet = 'size'      and level in ('few', 'one_table', 'crowd'))
    or (facet = 'spectacle' and level in ('performed', 'nothing'))
  ),

  -- WHAT IN THE FRAME SAYS SO. Not nullable and not allowed to be blank.
  -- CLAUDE.md rule 3: positive evidence, never inference from silence. A cell
  -- with no receipt is the retro-tagging failure this catalogue exists to
  -- escape, and the review screen prints this sentence beside every
  -- keep/strike so a reviewer is judging the evidence and not the label.
  evidence     text not null check (length(btrim(evidence)) > 0),

  -- KEPT FOR AUDIT AND NEVER RENDERED. Founder: "It makes people rubber-stamp
  -- 0.91." It is in the row so a bench run can ask whether the claims a
  -- reviewer struck were the low ones; it is not on the screen because a
  -- number beside a decision becomes the decision.
  confidence   numeric(3,2) not null default 0
                 check (confidence >= 0 and confidence <= 1),

  -- SILENT IS THE DEFAULT. The extractor writes 'proposed' explicitly; every
  -- other path fails into silence rather than into a proposal nobody made.
  status       photo_claim_status not null default 'silent',

  -- HER STRIKE. Once set, this claim can never be accepted and this column can
  -- never be cleared — see the trigger below.
  member_struck_at timestamptz,

  decided_at   timestamptz,
  created_at   timestamptz not null default now(),

  -- One reading proposes a given cell once.
  constraint photo_claim_one_per_reading unique (extract_id, facet, level)
);

create index photo_claim_photo_idx on photo_claim (photo_id);
create index photo_claim_open_idx on photo_claim (status) where status = 'proposed';

comment on table photo_claim is
  'One proposed cell, from one photograph. NO DESTINATION COLUMN, nullable or '
  'otherwise — the founder''s words: "a nullable slug is an invitation". '
  '`arrival`, `ending` and `starts` are refused by CHECK: one is a fingerprint '
  'column, two are already fed by quiz answers, and a photograph does not '
  'overrule her. The merged set across an application is COMPUTED on read by '
  'mergeSet() in src/lib/photo-extract.ts and stored nowhere. See db/064.';

comment on column photo_claim.member_struck_at is
  'When the applicant herself removed this claim. HER STRIKE ALWAYS WINS: the '
  'trigger below refuses to move such a row to accepted and refuses to clear '
  'this column, from any screen, for anybody. The desk''s remedy is to ask her '
  'a question, which is a different act with a different record.';

-- ─────────────────────────────────────────────────────────────────────
-- 4 · HER STRIKE ALWAYS WINS, AS A TRIGGER
--
-- Founder: "If she removed `dressed`, the desk cannot put it back on the same
-- photo. They can ask her a question. That is a different act."
--
-- A trigger rather than a guard in the action, because there are already two
-- writers (the member's screen and the desk's) and there will be a third. A
-- rule enforced in every caller is a rule the next caller will not know about.

create or replace function photo_claim_member_strike_wins() returns trigger
language plpgsql as $$
begin
  if old.member_struck_at is not null then
    if new.member_struck_at is null then
      raise exception
        'photo_claim %: a member''s strike cannot be lifted. Ask her.',
        old.id using errcode = 'restrict_violation';
    end if;
    if new.member_struck_at <> old.member_struck_at then
      raise exception
        'photo_claim %: a member''s strike does not move.',
        old.id using errcode = 'restrict_violation';
    end if;
    if new.status = 'accepted' then
      raise exception
        'photo_claim %: she struck % = %. The desk may ask her a question; it may not put it back on this photograph.',
        old.id, old.facet, old.level using errcode = 'restrict_violation';
    end if;
  end if;
  return new;
end;
$$;

create trigger photo_claim_hers_wins before update on photo_claim
  for each row execute function photo_claim_member_strike_wins();

comment on function photo_claim_member_strike_wins() is
  'CLAUDE.md''s house rule for this table, in the founder''s words: her strike '
  'always wins. A trigger and not a check in the action, because two screens '
  'already write here and a rule enforced per-caller is a rule the third '
  'caller will not know about.';
