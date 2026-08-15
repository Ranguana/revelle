-- Revelle Société — the soundtrack is ours; Spotify and Apple are couriers
--
-- Applied by scripts/migrate.mjs after 004, inside one transaction together
-- with its schema_migrations ledger row. Same rule as 001–004: nothing here may
-- be a statement that refuses to run in a transaction.
--
-- New file, never applied anywhere, so no SENTINELS entry in
-- scripts/migrate.mjs. Discovery picks it up; the ledger makes it run once.
--
-- ─────────────────────────────────────────────────────────────────────
-- THE ONE IDEA
--
-- OUR CATALOGUE IS THE SOURCE OF RECORD. A streaming playlist is a RENDERING
-- of a selection we already hold, never its origin.
--
-- Everything in this file follows from that sentence. The curator chooses the
-- tracks and writes the arc; `tracklist` and `tracklist_track` are what she
-- writes into; `tracklist_rendering` records that on some date we handed a copy
-- of that selection to Spotify, or to Apple, or to a printer. Delete every
-- rendering row and nothing of value is lost — the selection is still here and
-- can be handed over again.
--
-- The alternative — "the playlist IS the soundtrack, stored as a Spotify id" —
-- fails the first time Spotify changes its mind. In one announcement it removed
-- Audio Features, Audio Analysis, Recommendations, Related Artists and the
-- 30-second preview url from every new application. A business whose product
-- lives inside another company's product gets to find out about decisions like
-- that by reading a changelog. Song titles and artist names, held here, are
-- facts, and facts carry no obligation to anybody.
--
-- The portability key is the ISRC — see tracklist_track.isrc. It is what makes
-- "the same evening, on a different service" a lookup rather than a research
-- project, and it is why it is a first-class column and not a scrap of jsonb.
--
-- ─────────────────────────────────────────────────────────────────────
-- SEQUENCING IS AUTHORED, NOT COMPUTED
--
-- The obvious build orders tracks by tempo and energy. Those endpoints are
-- gone for new applications, and their absence costs nothing: the arc of an
-- evening — arrival, dinner, the moment, late, ending — is a taste judgement.
-- `arc_segment` is a closed enum because those five ARE the shape of a night
-- and each one means something different to whoever is choosing; `position` is
-- the authored order within it. A constraint trigger below enforces the only
-- structural fact about the two: an evening does not go arrival, late, dinner.
--
-- ─────────────────────────────────────────────────────────────────────
-- A SOUNDTRACK IS A POOLED INGREDIENT, AND THAT IS THE POINT
--
-- db/002 ends with the combinatorial headroom argument, and its conclusion is
-- explicit: "the cheapest lever is adding another DRAWN dimension (a playlist,
-- a ritual, a game) rather than adding items to a dimension already in the
-- product". This is that dimension. So `tracklist` is not a special case — it
-- is an ordinary pool, installed with the two installers 002 provides:
--
--     select install_facet_tags('tracklist', 'Soundtracks');
--     select install_revelle_ingredients('tracklist', 'Soundtracks', ...);
--
-- which gives it facet tagging, a place in the assemblage fingerprint, a place
-- in issuance history, and a place in the headroom arithmetic, with no change
-- to anything that reads those.
--
-- ONE WARNING, because it is the way this gets quietly broken. If every
-- customer receives a soundtrack cut from scratch for her, then every
-- assemblage fingerprint differs by construction and the uniqueness index can
-- never fire — the same "constraint that cannot fail" failure db/002 refuses
-- for free text. Soundtracks belong in the LIBRARY and are meant to be reused.
-- A bespoke one is legal and sometimes right; a bespoke one every time means
-- the uniqueness promise is being carried by the soundtrack alone, which is not
-- what it is for.
--
-- ─────────────────────────────────────────────────────────────────────
-- CONTENTS
--
--   soundtrack_delivery   how a soundtrack reaches her. an enum: closed
--   arc_segment           the five parts of an evening. an enum: closed
--   tracklist_status      draft → active → retired
--   rendering_status      rendered / failed. a failure is a row, not a silence
--   tracklist             the pool. one soundtrack, authored once, reusable
--   tracklist_track       the selection, in order, with its ISRC
--   track_resolution      what a service says this recording is, per service
--   tracklist_rendering   we handed a copy to a courier on this date
--   quiz_response.music_service   the routing answer, asked in the application
--   facets + bridge       the answer, resolved into the shared vocabulary
--
-- ─────────────────────────────────────────────────────────────────────

-- ── enums ────────────────────────────────────────────────────────────
--
-- Same test as 001, 002 and 004: an enum only where the value set is genuinely
-- closed and structural. Both of these pass it, and the reasons differ.

-- HOW A SOUNDTRACK REACHES HER. Closed because each value is an
-- IMPLEMENTATION, exactly like section_kind in 001 ("each kind has its own
-- renderer"). Adding 'tidal' is not a taste decision, it is a client in
-- src/lib/music/ plus credentials plus an account; a migration is the honest
-- price of that and it will be the smallest part of the work.
--
-- 'print' is a first-class member and not a null. The printed setlist is a
-- real deliverable — it renders from the same tracklist rows, and for a woman
-- with no streaming subscription it is the whole soundtrack. Modelling it as
-- "no service" would make the commonest fallback the one case the schema
-- cannot describe.
create type soundtrack_delivery as enum (
  'spotify',
  'apple_music',
  'print'
);

-- THE ARC OF AN EVENING. Closed because these five are the shape of a night as
-- the house understands it, and because the value is what a curator SORTS BY —
-- the declaration order below is the order of the evening, which is what makes
-- the ordering trigger a comparison rather than a lookup table.
--
-- Deliberately NOT section_kind (001), which shares three of the words.
-- section_kind names the BLOCKS of a Revelle's page, each with its own
-- component; these name POSITIONS IN AN EVENING. 'dinner' and 'late' have no
-- block and never will, 'fun' and 'downloads' are not moments in a night, and
-- borrowing one enum for both would mean every future addition to either had to
-- make sense in the other.
create type arc_segment as enum (
  'arrival',
  'dinner',
  'moment',
  'late',
  'ending'
);

-- draft → active → retired, on the same reasoning as cohort_status in 002.
-- NOT product_status, whose third value is 'discontinued': that is a fact about
-- a supplier, and nobody discontinues a song.
create type tracklist_status as enum ('draft', 'active', 'retired');

-- A FAILED RENDERING IS A ROW. The failure mode named in the spec is that the
-- house account's refresh token lapses and playlist creation "fails silently".
-- It cannot fail silently if failing writes a row: this enum is what an alarm
-- reads, and it is why tracklist_rendering is not simply "the playlist we made".
create type rendering_status as enum ('rendered', 'failed');

-- ── tracklist ────────────────────────────────────────────────────────
--
-- THE POOL. One soundtrack: a name, an optional destination it was written
-- for, and rows of tracks in order.
--
-- MUST BE USEFUL WITH ZERO DATA, like taste_cohort in 002 and world_voice in
-- 004. A curator with a notebook and no API credentials can author a complete
-- soundtrack here: every column below is fillable by hand, ISRC included, and
-- nothing in this file requires a single call to any streaming service. The
-- resolution step (src/lib/music/) fills in what she did not know; it never
-- decides what is in the evening.

create table tracklist (
  id           uuid primary key default gen_random_uuid(),
  -- Stable, human-typeable, used in internal URLs. Never reused.
  slug         citext not null unique check (slug ~ '^[a-z][a-z0-9-]*$'),
  -- "THE LONG LUNCH, WESTHAMPTON"
  name         text not null,
  -- What this evening sounds like, in the curator's words. Read by a human
  -- choosing between soundtracks, and by the writer of the printed setlist.
  description  text not null default '',

  -- The destination this was written for, if it was written for one.
  --
  -- Nullable and `on delete restrict`: null means a house soundtrack that suits
  -- more than one destination, which is a real and useful thing to author. This
  -- is the "coherence by construction" rule from docs/selection-spec.md applied
  -- to music — a soundtrack scoped to a destination is one the selection engine
  -- never has to check for clashes, because the scoping already did it.
  world_id     uuid references world(id) on delete restrict,

  -- The whole selection, as one line, for the printed piece and for the
  -- streaming playlist's description. Optional; the renderer falls back to
  -- `description`. Held rather than generated because a line that has to fit
  -- on a card is a piece of writing.
  setlist_note text not null default '',

  -- Internal only; never rendered to a customer.
  notes        text,

  status       tracklist_status not null default 'draft',
  -- Hand-authored or proposed by some run. Same two-value restriction as
  -- taste_cohort and world_voice, for the same reason: 'quiz' and 'observed'
  -- describe a customer's statement, not the origin of a selection.
  provenance   taste_provenance not null default 'curator'
    check (provenance in ('curator', 'inferred')),
  model_version text,
  -- A selection is a point of view and points of view have authors.
  authored_by  text not null default 'curator',

  activated_at timestamptz,
  retired_at   timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint tracklist_hand_authored_has_no_model
    check ((provenance = 'inferred') or model_version is null),
  -- Three states, so not an equality: a retired soundtrack keeps the date it
  -- went into service. Same shape as taste_cohort_active_has_timestamp in 002.
  constraint tracklist_active_has_timestamp
    check (status <> 'active' or activated_at is not null),
  constraint tracklist_retired_has_timestamp
    check ((status = 'retired') = (retired_at is not null))
);

create trigger tracklist_touch before update on tracklist
  for each row execute function set_updated_at();

create index tracklist_status_idx on tracklist (status, name);
-- "What can this destination be sent out with" — the selection read.
create index tracklist_world_idx on tracklist (world_id, status)
  where world_id is not null;

comment on table tracklist is
  'A soundtrack, authored once and reusable. The SOURCE OF RECORD: a Spotify '
  'or Apple playlist is a rendering of these rows (see tracklist_rendering), '
  'never the other way round. See db/005.';

-- ── tracklist_track ──────────────────────────────────────────────────
--
-- THE SELECTION, IN ORDER.
--
-- ── ON THE ISRC ─────────────────────────────────────────────────────
--
-- The International Standard Recording Code identifies a RECORDING — this
-- performance of this song, not the song and not the release. It is the column
-- that makes this table portable: every streaming service indexes by it, so
-- "build this evening on Apple instead" is a lookup, and a service that
-- disappears takes nothing with it.
--
-- It is NULLABLE, and that is deliberate rather than lax. A curator writing an
-- evening at a kitchen table knows the artist and the title; she does not know
-- the ISRC, and a NOT NULL here would mean she could not record her own
-- selection without an API key. Resolution fills it in afterwards. What is
-- enforced is the SHAPE when a value is present, because a mistyped ISRC is
-- worse than an absent one: it resolves confidently to the wrong recording.
--
-- Two recordings of the same song are two different ISRCs, and that is correct.
-- The 1974 take and the remaster are not interchangeable in an evening.
--
-- ── WHY THE HUMAN-READABLE FIELDS ARE NOT OPTIONAL ──────────────────
--
-- artist and title are NOT NULL even once an ISRC is known, because the
-- PRINTED setlist is rendered from this table and must never depend on a
-- service being reachable. If the only durable identifier were a code, then
-- printing a setlist would require calling Spotify, which is precisely the
-- dependency this file exists to avoid.

create table tracklist_track (
  id           uuid primary key default gen_random_uuid(),
  tracklist_id uuid not null references tracklist(id) on delete cascade,

  -- The authored order. Authoritative — `segment` labels it, `position` sets
  -- it. Deferred so a renumber can happen inside one transaction without
  -- tripping over itself, exactly as world_section does in 001.
  position     integer not null check (position >= 1),
  -- Where in the evening this sits. See the arc note at the top.
  segment      arc_segment not null,

  -- The facts. These are what gets printed.
  artist       text not null check (btrim(artist) <> ''),
  title        text not null check (btrim(title) <> ''),
  album        text,
  -- Of the RECORDING, not of the song. 1877 is Edison's phonograph; there is no
  -- recorded music before it, and a four-digit typo is the error this catches.
  release_year integer
    check (release_year is null or release_year between 1877 and 2200),
  -- Milliseconds, because that is what every service reports. Used to sanity
  -- check a match (a three-minute single is not the eleven-minute live version)
  -- and to tell a curator how long the arrival music actually lasts.
  duration_ms  integer check (duration_ms is null or duration_ms > 0),

  -- THE PORTABILITY KEY. Stored normalised: upper case, no hyphens, twelve
  -- characters — two-letter country, three-character registrant, two-digit
  -- year, five-digit designation.
  isrc         text
    check (isrc is null or isrc ~ '^[A-Z]{2}[A-Z0-9]{3}[0-9]{7}$'),
  -- Which catalogue told us the ISRC. Provenance where it matters: an ISRC a
  -- curator typed off a sleeve and one a search matched are not equally
  -- trustworthy, and when a match turns out to be the wrong recording this is
  -- the column that says where to go and look.
  isrc_source  soundtrack_delivery,
  isrc_at      timestamptz,

  -- Why this track is here, and anything the writer needs. "The one her sister
  -- will demand." Internal.
  note         text,

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint tracklist_track_position_unique unique (tracklist_id, position)
    deferrable initially deferred,
  -- A hand-typed ISRC has no source; a resolved one must say where it came
  -- from. Keeps `isrc_source` from decaying into "sometimes filled in".
  constraint tracklist_track_isrc_source_needs_isrc
    check (isrc is not null or (isrc_source is null and isrc_at is null)),
  constraint tracklist_track_isrc_source_is_a_catalogue
    check (isrc_source is null or isrc_source <> 'print')
);

create trigger tracklist_track_touch before update on tracklist_track
  for each row execute function set_updated_at();

create index tracklist_track_order_idx on tracklist_track (tracklist_id, position);
-- "Which evenings already use this recording" — the read that stops the house
-- putting the same song in every soundtrack it owns. Also the join a future
-- selection engine uses to spread the catalogue.
create index tracklist_track_isrc_idx on tracklist_track (isrc)
  where isrc is not null;

-- The same recording twice in one evening is a mistake, not a choice. Partial,
-- because unresolved tracks have no ISRC yet and must not collide with each
-- other. If a soundtrack ever legitimately wants a reprise, this index is the
-- one line to drop — and dropping it should be an argument someone makes.
create unique index tracklist_track_no_repeats
  on tracklist_track (tracklist_id, isrc) where isrc is not null;

comment on column tracklist_track.isrc is
  'The recording''s ISRC — the portability key. Normalised upper case, no '
  'hyphens. Nullable so a curator can author an evening without an API key; '
  'resolution fills it in. See db/005.';

-- ── the arc runs forwards ────────────────────────────────────────────
--
-- The one structural fact about the pairing of `position` and `segment`: an
-- evening does not go arrival, late, dinner. Enum values compare in declaration
-- order, so this is a comparison and not a lookup table — which is the second
-- reason arc_segment is an enum.
--
-- A CONSTRAINT trigger, deferred to commit, because the check spans rows: any
-- reorder that touches two rows is briefly inconsistent in the middle, and a
-- row-by-row check would reject the first statement of a legitimate edit. It
-- fires per row and re-checks the whole tracklist, which at the size of an
-- evening costs nothing.
--
-- What it does NOT insist on: that every segment appears, or that they appear
-- in equal measure. A soundtrack that is all dinner is a legitimate soundtrack.

create or replace function tracklist_arc_is_ordered() returns trigger
language plpgsql as $$
declare
  v_tracklist uuid := coalesce(new.tracklist_id, old.tracklist_id);
  v_bad       record;
begin
  select t.position, t.segment, t.prev_segment, t.prev_position
    into v_bad
    from (
      select position,
             segment,
             lag(segment)  over (order by position) as prev_segment,
             lag(position) over (order by position) as prev_position
        from tracklist_track
       where tracklist_id = v_tracklist
    ) t
   where t.prev_segment is not null and t.segment < t.prev_segment
   limit 1;

  if found then
    raise exception
      'tracklist % is out of order: position % is "%" but position % was "%"',
      v_tracklist, v_bad.position, v_bad.segment,
      v_bad.prev_position, v_bad.prev_segment
      using errcode = 'check_violation',
            hint = 'The evening runs arrival, dinner, moment, late, ending. '
                   'Renumber the tracks — the check is deferred to commit, so '
                   'a reorder inside one transaction is fine.';
  end if;

  return null;
end;
$$;

create constraint trigger tracklist_track_arc
  after insert or update or delete on tracklist_track
  deferrable initially deferred
  for each row execute function tracklist_arc_is_ordered();

-- ── track_resolution ─────────────────────────────────────────────────
--
-- WHAT A SERVICE SAYS THIS RECORDING IS.
--
-- One row per (track, service). Three jobs, and the third is the one that
-- justifies the table:
--
--   1. It caches the service-native id, so re-rendering an evening does not
--      re-search a catalogue that may answer differently today than it did
--      last month.
--   2. It is where an Apple implementation lands with no change to anything
--      else — a second row against the same track, not a second column.
--   3. IT MAKES A BAD MATCH AUDITABLE. `service_artist` and `service_title` are
--      what the service believes it gave us, stored beside what we asked for.
--      The expensive failure in this whole feature is not an error, it is a
--      playlist that quietly contains a karaoke cover of the right song, and
--      the only way to catch that is to keep both sides of the comparison.
--
-- Derived and disposable: delete every row here and the next render rebuilds
-- them. Losing this table costs API calls, not truth.

create table track_resolution (
  track_id       uuid not null references tracklist_track(id) on delete cascade,
  service        soundtrack_delivery not null check (service <> 'print'),

  -- The service's own identifier. For Spotify this is the track URI
  -- ('spotify:track:...'), because that is what the add-to-playlist endpoint
  -- takes; storing the bare id would mean reassembling the URI at every call
  -- site and getting it wrong in one of them.
  external_id    text not null check (btrim(external_id) <> ''),
  -- Where a human can go and listen to exactly this. Nullable: not every
  -- service exposes a public url for every catalogue item.
  external_url   text,

  -- What the service says it is. See job 3 above.
  service_artist text,
  service_title  text,
  service_album  text,
  duration_ms    integer check (duration_ms is null or duration_ms > 0),
  isrc           text
    check (isrc is null or isrc ~ '^[A-Z]{2}[A-Z0-9]{3}[0-9]{7}$'),

  -- How the match was made: 'isrc' when the catalogue was queried by code and
  -- can only be right, 'search' when it was matched on words and could be
  -- wrong, 'curator' when a human pasted the link herself. Text rather than an
  -- enum because it describes OUR method, which will change more often than the
  -- set of services will.
  matched_by     text not null default 'isrc'
    check (matched_by in ('isrc', 'search', 'curator')),
  -- 0..1. What the matcher thought of its own answer. 1.000 for an ISRC hit;
  -- lower for a word match, and low enough is not stored at all — an unresolved
  -- track is better than a wrong one.
  confidence     numeric(4,3) not null default 1.000
    check (confidence > 0 and confidence <= 1),

  resolved_at    timestamptz not null default now(),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  primary key (track_id, service)
);

create trigger track_resolution_touch before update on track_resolution
  for each row execute function set_updated_at();

-- "Everything we matched on words rather than on a code, weakest first" — the
-- review queue for the failure that has no error message.
create index track_resolution_review_idx
  on track_resolution (matched_by, confidence)
  where matched_by <> 'isrc';

-- ── tracklist_rendering ──────────────────────────────────────────────
--
-- WE HANDED A COPY TO A COURIER ON THIS DATE.
--
-- A rendering is an EVENT, not a state: it says that on some date, this
-- selection was built on that service, on that account, and here is where it
-- landed. Re-rendering writes another row. Nothing is ever updated except the
-- moment a rendering is marked broken.
--
-- ── WHY THE SNAPSHOT ────────────────────────────────────────────────
--
-- `tracks` holds the selection AS IT STOOD when it was handed over. This is
-- not a second copy of tracklist_track drifting beside the first — it is the
-- same discipline 001 states for the writing ("Editing a world's sections does
-- NOT retroactively change a delivered revelle") and 004 states for the voice.
-- Sections freeze by cloning, a voice freezes by versioning, and a rendering
-- freezes by snapshot. Without it, reprinting a customer's setlist two years
-- later would print today's edit of the soundtrack and nobody would know.
--
-- ── WHY THE ACCOUNT ID IS A COLUMN ──────────────────────────────────
--
-- A Spotify account holds about eleven thousand playlists. At Revelle's
-- volume that is decades away and no design hours are owed to it — but the
-- account id is a parameter everywhere in src/lib/music/ anyway, and recording
-- WHICH account each playlist was made on is what turns "add a second account"
-- into a config change rather than an archaeology project. It is one text
-- column and it is the difference between a cheap answer and an expensive one.
--
-- ── WHY A FAILURE IS A ROW ──────────────────────────────────────────
--
-- The house account's refresh token lives six months and refreshing an access
-- token does not extend it. When it lapses, every render fails. `status =
-- 'failed'` with the error text is what makes that visible on a dashboard
-- instead of visible in a customer's disappointment.

create table tracklist_rendering (
  id                uuid primary key default gen_random_uuid(),
  tracklist_id      uuid not null references tracklist(id) on delete cascade,
  -- Who it was rendered for. Nullable: the house renders a destination's
  -- soundtrack once for its own library, before anybody is holding it.
  revelle_id        uuid references revelle(id) on delete cascade,

  service           soundtrack_delivery not null,
  status            rendering_status not null default 'rendered',

  -- THE HOUSE ACCOUNT this playlist lives on. Not a constant anywhere in this
  -- system. Null for print, which has no account.
  account_id        text,
  -- The service's playlist identifier, and the link she follows. The url is
  -- nullable even for a streaming rendering, and deliberately so: Spotify
  -- returns a public url for every playlist, but a playlist created in a user's
  -- Apple Music library has an identifier and no public link at all. Requiring
  -- a url here would encode a Spotify assumption as a schema rule and make the
  -- Apple implementation impossible to record honestly.
  external_id       text,
  external_url      text,

  -- THE SNAPSHOT. An array of objects, one per track, in the order handed over.
  -- Shape mirrors the Track type in src/lib/music/index.ts.
  tracks            jsonb not null default '[]'::jsonb,
  -- Selected but not found in that service's catalogue. Recorded rather than
  -- dropped: a hole in a sequenced evening is a fact about the delivery and the
  -- curator is the only one who can decide what to do about it.
  unresolved        jsonb not null default '[]'::jsonb,

  -- For a failure: what went wrong, in the words the service used. The first
  -- line an alarm shows a human.
  error             text,

  rendered_at       timestamptz not null default now(),
  created_at        timestamptz not null default now(),

  constraint tracklist_rendering_tracks_is_array
    check (jsonb_typeof(tracks) = 'array'),
  constraint tracklist_rendering_unresolved_is_array
    check (jsonb_typeof(unresolved) = 'array'),
  -- Print has no account, ever. Not written as an equality with `account_id is
  -- null`, deliberately: that would also REQUIRE an account on a failed
  -- streaming rendering, and the commonest failure — the refresh token lapsed —
  -- happens at the token endpoint before an account is ever addressed. A
  -- constraint that can stop a failure being recorded defeats the reason
  -- failures are recorded at all.
  constraint tracklist_rendering_print_has_no_account
    check (service <> 'print' or account_id is null),
  -- A rendering that SUCCEEDED on a service names the account it landed on and
  -- the playlist it created, or it did not happen.
  constraint tracklist_rendering_streaming_is_identified
    check (status <> 'rendered' or service = 'print'
           or (external_id is not null and account_id is not null)),
  constraint tracklist_rendering_failure_says_why
    check ((status = 'failed') = (error is not null))
);

create index tracklist_rendering_tracklist_idx
  on tracklist_rendering (tracklist_id, rendered_at desc);
create index tracklist_rendering_revelle_idx
  on tracklist_rendering (revelle_id, rendered_at desc)
  where revelle_id is not null;
-- THE ALARM'S READ. Every failure, newest first — see the refresh-token note
-- above. Partial, so it stays small no matter how many renderings succeed.
create index tracklist_rendering_failed_idx
  on tracklist_rendering (rendered_at desc) where status = 'failed';

comment on table tracklist_rendering is
  'One event per handover of a selection to a service or a printer. Derived '
  'from tracklist_track — losing this table costs API calls, not truth, except '
  'for `tracks`, which is the frozen copy a reprint renders from. See db/005.';

-- The rendering in force: the newest successful one per (tracklist, revelle,
-- service). What a curator's tool shows as "her playlist", and what a re-send
-- links to.
create view tracklist_current_rendering as
select distinct on (r.tracklist_id, r.revelle_id, r.service)
       r.id as rendering_id,
       r.tracklist_id,
       r.revelle_id,
       r.service,
       r.account_id,
       r.external_id,
       r.external_url,
       jsonb_array_length(r.tracks)     as track_count,
       jsonb_array_length(r.unresolved) as unresolved_count,
       r.rendered_at
  from tracklist_rendering r
 where r.status = 'rendered'
 order by r.tracklist_id, r.revelle_id, r.service, r.rendered_at desc;

-- ── the pool, registered ─────────────────────────────────────────────
--
-- Two calls, both from db/002, and this is the whole reason they were written
-- as installers. `tracklist_facet` lets a soundtrack be tagged in the SAME
-- vocabulary a destination, a product and a cohort are tagged in, so "which
-- soundtrack suits her" is a set operation. `revelle_tracklist` puts the
-- soundtrack into the assemblage fingerprint, into issuance history, and into
-- the headroom arithmetic — which is the added DRAWN dimension db/002's
-- closing argument asks for.
--
-- typical_draw = 1: one soundtrack per Revelle. Correct it the day that stops
-- being true; it feeds nothing but the headroom sum.

select install_facet_tags('tracklist', 'Soundtracks');
select rebuild_facet_tag_view();

select install_revelle_ingredients(
  'tracklist', 'Soundtracks', 'name', 'status', 'active', 1);
select rebuild_revelle_ingredient_view();

-- ── the routing question ─────────────────────────────────────────────
--
-- WHY THIS IS ASKED AT ALL.
--
-- On Spotify's free tier, mobile playback forces shuffle and injects tracks of
-- Spotify's choosing between ours, with advertising. A sequenced arc does not
-- survive that, and there is nothing we can do about it from this side. So the
-- application asks which service she uses and the answer ROUTES the delivery:
-- a public playlist on the house account, the same selection built on Apple, or
-- a printed setlist and a line in The Prep.
--
-- It is a routing question and not a membership requirement. Gating membership
-- on one component of one deliverable is the wrong layer, and a subscription
-- requirement sits badly in an application that promises no clipboards.
--
-- NULLABLE, and null is not a hole to be backfilled. Every response submitted
-- before this question existed genuinely has no answer, and the honest
-- treatment of "we do not know" is the same as the honest treatment of
-- "neither": send the printed setlist. Nothing in this schema converts one to
-- the other, because they are different facts.

alter table quiz_response
  add column music_service soundtrack_delivery;

comment on column quiz_response.music_service is
  'How her soundtrack should be delivered, as she answered it. Null means the '
  'question had not been asked yet — route to print. See db/005.';

-- Delivery routing, and the staff read "everyone still on print".
create index quiz_response_music_idx on quiz_response (music_service);

-- ── the immutability guard, restated ─────────────────────────────────
--
-- 001's quiz_response_guard freezes every column that is her ANSWER and leaves
-- only staff workflow mutable, and it lists them explicitly "so that adding a
-- column is a deliberate choice about which side of this line it falls on".
-- This is that choice, made: `music_service` is her answer. If she changes
-- service she answers again, and the new response supersedes the old one the
-- same way every other answer does.
--
-- Only the frozen list changes below. Everything else is 001's function
-- verbatim, because replacing it wholesale is the only way PostgreSQL offers
-- and a diff against 001 should show exactly one addition.

create or replace function quiz_response_guard() returns trigger
language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    raise exception
      'quiz_response is append-only: row % may not be deleted. Set status = ''archived''.',
      old.id;
  end if;

  if new.customer_id    is distinct from old.customer_id
     or new.answers          is distinct from old.answers
     or new.quiz_version     is distinct from old.quiz_version
     or new.submission_key   is distinct from old.submission_key
     or new.occasion         is distinct from old.occasion
     or new.occasion_other   is distinct from old.occasion_other
     or new.environment      is distinct from old.environment
     or new.taste_directions is distinct from old.taste_directions
     or new.group_fun        is distinct from old.group_fun
     or new.anti_preferences is distinct from old.anti_preferences
     or new.affinities       is distinct from old.affinities
     or new.secret           is distinct from old.secret
     or new.budget           is distinct from old.budget
     -- Added by db/005. Her answer, therefore frozen.
     or new.music_service    is distinct from old.music_service
     or new.created_at       is distinct from old.created_at
  then
    raise exception
      'quiz_response % is immutable: only status, event_date and guest_count may change. Insert a new response instead.',
      old.id;
  end if;

  return new;
end;
$$;

-- ── the vocabulary ───────────────────────────────────────────────────
--
-- A CAPABILITY, NOT A TASTE — and it still belongs in the same table.
--
-- Every other facet dimension describes what she LIKES. This one describes what
-- she HAS, which is a different kind of fact, and it is worth being explicit
-- about why it is modelled the same way anyway:
--
--   · scripts/check-facets.mjs fails a build when a quiz option resolves to no
--     facet, because an answer that means nothing to the rest of the system is
--     the exact failure db/002 exists to prevent. Exempting one field from the
--     bridge would mean exempting it from that check too.
--   · "Everyone we are still sending printed setlists to" then answers itself
--     from taste_profile_current, with a date on it and with supersession —
--     which matters, because this is the one fact in her profile that changes
--     for reasons that have nothing to do with her taste.
--
-- The safeguard is that NO DESTINATION, PRODUCT OR SOUNDTRACK IS EVER TAGGED
-- with a music_service facet. Facet matching is an overlap between her vector
-- and an ingredient's tags, so a dimension no ingredient carries contributes
-- exactly nothing to any score. It is queryable and inert, which is what a
-- capability recorded in a taste vocabulary should be.

insert into facet_dimension (code, label, description, position) values
  ('music_service', 'Music service',
   'What she listens on. A CAPABILITY, not a taste — it routes the delivery of the soundtrack and must never be scored. No ingredient is tagged in this dimension; see db/005.',
   120);

-- Labels and descriptions are copied verbatim from the option's `label` and
-- `hint` in src/lib/quiz.ts, so scripts/check-facets.mjs reports zero drift on
-- a clean tree. Codes match soundtrack_delivery's values so that the answer
-- casts straight into the column.
insert into facet (dimension_code, code, label, description, provenance) values
  ('music_service', 'spotify',     'Spotify Premium', 'A link that opens in order, and stays in order', 'quiz'),
  ('music_service', 'apple_music', 'Apple Music',     'The same evening, where you already listen', 'quiz'),
  ('music_service', 'print',       'Neither',         'Then it arrives printed — the evening in order, on paper', 'quiz');

update facet
   set notes = 'No streaming service. Routes the soundtrack to a printed '
               'setlist and a line in The Prep. A real answer, not a missing '
               'one.'
 where dimension_code = 'music_service' and code = 'print';

update facet
   set notes = 'Premium specifically. On the free tier mobile playback forces '
               'shuffle and injects Spotify''s own tracks, which destroys the '
               'sequence — there is no fix on our side, so it is a different '
               'route, not a worse version of this one.'
 where dimension_code = 'music_service' and code = 'spotify';

-- The bridge, generated the same way db/002 generates it: the facet code IS the
-- option code, because both come from the same module.
insert into quiz_option_facet (quiz_field, option_code, facet_id, answer_polarity)
select 'music_service', f.code, f.id, 'positive'
  from facet f
 where f.dimension_code = 'music_service';

-- ── quiz_response_facet, extended ────────────────────────────────────
--
-- One branch added. `create or replace` keeps the column list identical, which
-- it must — record_quiz_signals() and taste_profile_current both read this view
-- and neither needs to know it happened.
--
-- A consequence worth stating plainly: record_quiz_signals() will now write one
-- taste_signal per submission recording which service she uses. That is
-- intended. It is dated, it supersedes the way every other signal does, and by
-- the argument above it scores against nothing.

create or replace view quiz_response_facet as
select qr.id          as quiz_response_id,
       qr.customer_id,
       qr.created_at  as observed_at,
       qr.quiz_version,
       src.quiz_field,
       ans.option_code,
       m.facet_id,
       f.dimension_code,
       f.code         as facet_code,
       f.label        as facet_label,
       f.status       as facet_status,
       m.answer_polarity as polarity
  from quiz_response qr
  cross join lateral (
    values ('taste_directions', qr.taste_directions),
           ('group_fun',        qr.group_fun),
           ('anti_preferences', qr.anti_preferences),
           ('affinities',       qr.affinities),
           ('occasion',         array[qr.occasion::text]),
           ('environment',      array[qr.environment::text]),
           ('budget',           array[qr.budget::text]),
           -- Null when the question had not been asked yet. array[null]
           -- unnests to one null, which joins nothing — so an unanswered
           -- routing question contributes no row, exactly like an unchosen
           -- option.
           ('music_service',    array[qr.music_service::text])
  ) as src(quiz_field, option_codes)
  cross join lateral unnest(src.option_codes) as ans(option_code)
  join quiz_option_facet m
    on m.quiz_field = src.quiz_field and m.option_code = ans.option_code
  join facet f on f.id = m.facet_id;

-- ── the read that routes a delivery ──────────────────────────────────
--
-- Everything the soundtrack step of a delivery needs, in one row per
-- (Revelle, soundtrack): who she is, how she wants it, what she is getting, and
-- whether it has been handed over yet.
--
-- `delivery` coalesces a null answer to 'print'. That is the routing decision
-- stated once, here, rather than repeated in every caller — and print is the
-- right default because it is the only channel that cannot fail for a reason
-- outside the house.

create view revelle_soundtrack as
select r.id            as revelle_id,
       r.customer_id,
       c.email,
       r.status        as revelle_status,
       r.first_delivered_at,
       t.id            as tracklist_id,
       t.slug          as tracklist_slug,
       t.name          as tracklist_name,
       coalesce(qr.music_service, 'print') as delivery,
       qr.music_service is null as delivery_unasked,
       (select count(*) from tracklist_track tt where tt.tracklist_id = t.id)
         as track_count,
       cur.rendering_id,
       cur.external_url,
       cur.rendered_at,
       cur.unresolved_count
  from revelle r
  join customer c        on c.id = r.customer_id
  join quiz_response qr  on qr.id = r.quiz_response_id
  join revelle_tracklist rt on rt.revelle_id = r.id
  join tracklist t       on t.id = rt.tracklist_id
  left join tracklist_current_rendering cur
    on cur.tracklist_id = t.id
   and cur.revelle_id   = r.id
   and cur.service      = coalesce(qr.music_service, 'print');

comment on view revelle_soundtrack is
  'One row per Revelle per soundtrack: how she wants it delivered, and whether '
  'that handover has happened. `delivery` is null-coalesced to print — the one '
  'channel that cannot fail for a reason outside the house.';

-- ─────────────────────────────────────────────────────────────────────
-- FOR THE CURATOR, ON DAY ONE
--
-- No credentials are needed for any of this. A complete soundtrack is two
-- statements, and it is deliverable as a printed setlist the moment they run.
--
--   -- 1. Name the evening, and say which destination it belongs to.
--   insert into tracklist (slug, name, description, world_id, status,
--                          activated_at, authored_by)
--   select 'westhampton-long-lunch', 'THE LONG LUNCH, WESTHAMPTON',
--          'Starts at the door and never quite gets up from the table.',
--          w.id, 'active', now(), 'jessica'
--     from world w where w.slug = 'westhampton-1976';
--
--   -- 2. Write the arc. Position is the order; segment is the part of the
--   --    evening. The ISRC can wait — resolution fills it in.
--   insert into tracklist_track (tracklist_id, position, segment, artist, title,
--                                album, release_year)
--   select t.id, v.position, v.segment::arc_segment, v.artist, v.title,
--          v.album, v.year
--     from tracklist t
--     join (values (1, 'arrival', 'Nina Simone', 'Feeling Good', 'I Put a Spell on You', 1965),
--                  (2, 'dinner',  'Astrud Gilberto', 'Água de Beber', 'Getz/Gilberto', 1963),
--                  (3, 'moment',  'Chic', 'I Want Your Love', 'C''est Chic', 1978)
--          ) as v(position, segment, artist, title, album, year) on true
--    where t.slug = 'westhampton-long-lunch';
--
--   -- 3. Tag it in the same words everything else is tagged in, so the
--   --    selection engine can find it.
--   insert into tracklist_facet (tracklist_id, facet_id, weight, note)
--   select t.id, f.id, 0.9, 'the whole idea'
--     from tracklist t, facet f
--    where t.slug = 'westhampton-long-lunch'
--      and f.dimension_code = 'taste_direction' and f.code = 'old_world_riviera';
--
--   -- 4. Give it to somebody. This is what puts it in the fingerprint.
--   insert into revelle_tracklist (revelle_id, tracklist_id, slot)
--   values ($1, $2, 'soundtrack');
--
-- And the reads that matter:
--
--   -- Of the Revelles that HAVE a soundtrack, which have not had it handed
--   -- over yet, and how it should reach her. (A Revelle with no soundtrack at
--   -- all is not in this view — that is a curation gap, a different question,
--   -- and `ingredient_inventory()` is where it shows up.)
--   select * from revelle_soundtrack where rendering_id is null;
--
--   -- Anything a search matched on words rather than on a code. This is the
--   -- review queue for the failure that has no error message.
--   select * from track_resolution where matched_by = 'search'
--    order by confidence;
--
--   -- THE ALARM. The house account's refresh token lives six months and
--   -- refreshing an access token does not extend it. When it lapses this fills
--   -- up, and nothing else says so.
--   select rendered_at, service, error from tracklist_rendering
--    where status = 'failed' order by rendered_at desc;
-- ─────────────────────────────────────────────────────────────────────
