-- Revelle Société — ONE DOOR: one way in, for both kinds of person
--
-- Applied by scripts/migrate.mjs after 014, inside one transaction together
-- with its schema_migrations ledger row. Nothing here may be a statement that
-- refuses to run in a transaction. New file, never applied anywhere, so no
-- SENTINELS entry in scripts/migrate.mjs.
--
-- ─────────────────────────────────────────────────────────────────────
-- WHY THIS IS A GENERALISATION AND NOT A SECOND SYSTEM
--
-- db/011 built passwordless sign-in for the desk, and built it correctly: the
-- token is stored as a digest, redemption is a single `update … where` so a
-- link cannot be spent twice, expiry is short, the session is hashed and
-- revocable. It said so itself — "a magic link, the same shape the member
-- portal will use". The member portal now needs one.
--
-- The wrong move is a second pair of tables named `member_*`. Two auth systems
-- in one codebase is how a hole survives: each reviewer assumes the other one
-- is the real one, and a fix applied to one is not applied to the other. So
-- the desk's tables are RENAMED and WIDENED rather than copied. There is one
-- token table, one session table, and one module (src/lib/session.ts) that
-- reads and writes them.
--
-- ── ONE TABLE, TWO SUBJECTS ─────────────────────────────────────────
--
-- A token or a session belongs to exactly one of two registers:
--
--     staff_id set, customer_id null    someone who works the desk
--     customer_id set, staff_id null    a member, in her portal
--
-- Enforced by a check on num_nonnulls, not by convention. The two registers
-- stay separate tables because they are separate facts: `staff` exists so a
-- change has an author (db/011), `customer` is the business record. A single
-- `person` table would merge two things that are only accidentally alike, and
-- it would put staff addresses — which deliberately live outside git, in
-- STAFF_EMAILS — into the same pool as customers.
--
-- WHICH KIND SOMEONE IS IS NOT DECIDED HERE, and is not a column. It is the
-- STAFF_EMAILS environment variable read in src/lib/staff.ts, which fails
-- closed when unset, for the three reasons db/011 gives. This file only
-- records which register a live token points at.
--
-- ── WHY A MEMBER'S SESSION LIVES BESIDE A CURATOR'S ─────────────────
--
-- Because they are the same object with the same rules: a hashed bearer token
-- with an absolute expiry and a revoke time. Anything true of one is true of
-- the other, and a fix to the redemption predicate must land on both. Nothing
-- about the desk's session is more privileged than a member's — the authority
-- question is asked at read time, against the allowlist, on every request.
--
-- ─────────────────────────────────────────────────────────────────────
-- CONTENTS
--
--   sign_in_token        was staff_sign_in_token. now either subject
--   login_session        was staff_session. now either subject
--   customer.accepted_at the fact that makes an applicant a member
--   sign_in_attempt      the throttle. hashed keys, swept
-- ─────────────────────────────────────────────────────────────────────

-- ── the rename ───────────────────────────────────────────────────────
--
-- `alter table … rename` preserves every row, so a curator who is signed in
-- when this deploys stays signed in. Indexes and constraints do NOT follow a
-- table rename, so they are renamed by hand below; leaving them would mean a
-- table called sign_in_token carrying an index called staff_sign_in_token_*,
-- which is the kind of thing that makes a schema unreadable in two years.

alter table staff_sign_in_token rename to sign_in_token;
alter table staff_session       rename to login_session;

alter index staff_sign_in_token_pkey     rename to sign_in_token_pkey;
alter index staff_sign_in_token_live_idx rename to sign_in_token_staff_idx;
alter index staff_session_pkey           rename to login_session_pkey;
alter index staff_session_live_idx       rename to login_session_live_idx;
alter index staff_session_staff_idx      rename to login_session_staff_idx;

alter table sign_in_token
  rename constraint staff_sign_in_token_token_hash_key to sign_in_token_token_hash_key;
alter table login_session
  rename constraint staff_session_token_hash_key to login_session_token_hash_key;

-- ── the second subject ───────────────────────────────────────────────
--
-- `on delete cascade` on both, matching what db/011 chose for staff: deleting
-- a customer must not leave a live session pointing at nobody. It is the one
-- place a cascade is right — a session is not a record of anything, it is a
-- key that must stop working.

alter table sign_in_token alter column staff_id drop not null;
alter table sign_in_token
  add column customer_id uuid references customer(id) on delete cascade;
alter table sign_in_token
  add constraint sign_in_token_one_subject
    check (num_nonnulls(staff_id, customer_id) = 1);

alter table login_session alter column staff_id drop not null;
alter table login_session
  add column customer_id uuid references customer(id) on delete cascade;
alter table login_session
  add constraint login_session_one_subject
    check (num_nonnulls(staff_id, customer_id) = 1);

-- The staff-side indexes db/011 created are still the right ones for staff and
-- are now partial in effect (staff_id is null for half the rows). These are
-- their opposite numbers.
create index sign_in_token_customer_idx
  on sign_in_token (customer_id, created_at desc) where customer_id is not null;
create index login_session_customer_idx
  on login_session (customer_id, created_at desc) where customer_id is not null;

comment on table sign_in_token is
  'Magic links, for the desk and for the portal alike. Stores a sha256 of the '
  'token, never the token: a dump of this table yields nothing that can be '
  'clicked. Single use, short lived. Exactly one of staff_id / customer_id. '
  'See db/015 and src/lib/session.ts.';

comment on table login_session is
  'A signed-in browser, staff or member. The cookie holds the raw token, this '
  'holds its digest. Absolute expiry, never sliding. revoked_at rather than a '
  'delete, so signing out is a fact with a time on it. See db/015.';

-- ── who has a portal ─────────────────────────────────────────────────
--
-- AN APPLICANT IS NOT A MEMBER, and the sign-in path is where that stops being
-- a sentiment and becomes a rule. Someone who has applied has a customer row
-- (the quiz insert in src/app/api/quiz/route.ts creates one) and an address we
-- will happily mail. She does not have a portal, and asking for a link must
-- not give her one.
--
-- ── WHY A TIMESTAMP AND NOT A STATUS ────────────────────────────────
--
-- Because there is exactly one fact here and it happened at a moment: the
-- house took her on. A status column would invite a vocabulary — pending,
-- accepted, waitlisted, lapsed — invented against no evidence, and the portal
-- spec's dues and renewals are a TABLE when they arrive, not three more values
-- in an enum. null means applicant. Not null means member, and says when.
--
-- Revocation is deliberately absent for the same reason. There is no evidence
-- yet about what ending a membership means (does her archive stay readable?),
-- and guessing produces a column that has to be re-thought the first time it
-- is used. When it exists it is `ended_at` beside this, and the read in
-- src/lib/members.ts is the only place that has to learn about it.

alter table customer add column accepted_at timestamptz;

comment on column customer.accepted_at is
  'When the house accepted her. null means she has applied and nothing more — '
  'no portal, and a sign-in request for her address sends nothing. Set by the '
  'desk. See db/015 and src/lib/members.ts.';

-- Backfill from the evidence already in the database. A customer with a
-- `revelle` row is someone the house has started building for, which is
-- acceptance by conduct; recording it as a null would sign out people who are
-- plainly members the moment this ships. Deliberately NOT keyed on
-- quiz_response.status: 'in_progress' is desk workflow, and workflow must not
-- quietly grant a portal.
update customer c
   set accepted_at = coalesce(
         (select min(r.created_at) from revelle r where r.customer_id = c.id),
         now()
       )
 where exists (select 1 from revelle r where r.customer_id = c.id);

-- The portal read: her row by address, only if she is a member.
create index customer_member_idx on customer (email) where accepted_at is not null;

-- ── the throttle ─────────────────────────────────────────────────────
--
-- A sign-in endpoint that is not rate limited is a mail cannon: an address is
-- all it takes, the message is sent by us, from our domain, at our cost, and
-- the person being buried in it is a customer. It is also the only remaining
-- way to probe this door at any useful rate. db/011 did not have this and
-- neither did /api/quiz; this table is the shared answer.
--
-- ── WHY IN POSTGRES ─────────────────────────────────────────────────
--
-- Because there is nothing else. There is no Redis, and there must not be a
-- counter in process memory: Render runs more than one instance, each would
-- keep its own count, and the limit would be multiplied by the instance count
-- in a way nobody would notice. A row per attempt in the database the request
-- is already talking to is the honest version.
--
-- ── WHY THE KEY IS HASHED ───────────────────────────────────────────
--
-- The key is an email address or an IP address. Stored plainly, this table
-- would be a list of everyone who has tried to sign in — including people who
-- are not customers, which is a record we have no business keeping. The digest
-- supports the only operation a throttle needs (equality inside a window) and
-- supports nothing else. It is not a strong protection on its own — an address
-- can be guessed and hashed — which is why rows are also swept: the window is
-- minutes, and what is not needed is deleted rather than kept.

create table sign_in_attempt (
  id         bigint generated always as identity primary key,
  -- Which limit this counts against: 'request_email', 'request_ip',
  -- 'redeem_ip'. Free text with a shape, like staff_action.action, so adding a
  -- limit is not a migration.
  bucket     text not null check (bucket ~ '^[a-z][a-z0-9_]*$'),
  -- sha256 of the address or the IP, hex. Never the value.
  key_hash   text not null check (key_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now()
);

-- The only read: how many in this bucket, for this key, since a moment.
create index sign_in_attempt_window_idx
  on sign_in_attempt (bucket, key_hash, created_at desc);
-- The sweep, which walks by age and nothing else.
create index sign_in_attempt_age_idx on sign_in_attempt (created_at);

comment on table sign_in_attempt is
  'The sign-in throttle, by address and by IP. Keys are sha256 digests, never '
  'the value, and rows are swept once they are older than the longest window. '
  'See src/lib/rate-limit.ts.';

-- ─────────────────────────────────────────────────────────────────────
-- WHAT THIS DELIBERATELY DOES NOT DO
--
--   · No `person` table merging staff and customers. See above.
--   · No role column on the session. Which door someone came through is not
--     authority; authority is re-read on every request, against STAFF_EMAILS
--     and against accepted_at, so removing either ends the session at the next
--     click rather than at expiry.
--   · No expiry sweep for tokens or sessions, for the reason db/011 gives: a
--     consumed token and a dead session are both refused by predicate, and
--     deleting them destroys the only trace they existed. sign_in_attempt is
--     the exception because its rows are not evidence of anything worth
--     keeping and are about people who may not be customers.
--   · No membership table. Dues, renewals and receipts (docs/portal-spec.md)
--     are their own file when they exist.
-- ─────────────────────────────────────────────────────────────────────
