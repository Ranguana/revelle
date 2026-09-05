-- ── 063 · SHE SIGNS UP BEFORE SHE ANSWERS ────────────────────────────
--
-- Founder, 2026-09-05: "when they apply for membership, need a fun page where
-- they sign up and confirm email not just to the quiz."
--
-- Until now /apply dropped a visitor straight into the questions and asked for
-- her address on the LAST screen. So there was no sign-up: she answered
-- everything and only then learned what she had joined, and the address she
-- typed was never proved — anybody could put anybody's inbox on an
-- application. This migration is the schema half of moving that moment to the
-- front.
--
-- ── THE RULE THIS MIGRATION IS WRITTEN UNDER ─────────────────────────
--
-- ONE WAY TO PROVE AN ADDRESS. db/015 already built it — mint a 256-bit token,
-- store only its sha256, spend it exactly once inside `expires_at > now()`,
-- and never write the raw value to a column. A second such mechanism is how a
-- hole survives: each reviewer assumes the other one is the real one, and a fix
-- applied to one is not applied to both (src/lib/session.ts says so at the
-- top). So a confirmation link is a `sign_in_token` row, not a new table.
--
-- What it needs is a way to say WHICH KIND it is, which is the column below.
--
-- ── WHY `purpose` AND NOT "THEY ARE ALL JUST TOKENS" ─────────────────
--
-- Without it the two redeemers eat each other's tokens. A confirmation link
-- pasted into /login/[token] would be consumed there and then fail; a member's
-- sign-in link submitted to the confirm route would confirm an address. Both
-- need the raw token, so neither is a hole — but both are rule 23 exactly: the
-- field is not broken, it answers a different question than it appears to, and
-- the table's own diagnostic value ("a link was issued at 09:14 and used at
-- 09:15") stops meaning anything when it cannot say used FOR WHAT.
--
-- The default is 'sign_in' and it is the right backfill rather than a
-- convenience: every row that exists on the day this runs is a sign-in link,
-- because nothing else has ever written this table. The check is therefore
-- satisfied by every existing row before it is added, which is the shape
-- CLAUDE.md rule 33 asks for — this migration constrains no value that a
-- seeder is expected to supply later, so it cannot be green in scratch and
-- wedged in production.

alter table sign_in_token
  add column purpose text not null default 'sign_in'
    check (purpose in ('sign_in', 'confirm'));

comment on column sign_in_token.purpose is
  'What this link is for. sign_in opens a session (src/lib/login.ts). confirm '
  'proves an applicant''s address and opens NOTHING (src/lib/application.ts) — '
  'an applicant is not a member and a confirmation must never become a portal. '
  'Each redeemer filters on this column, so neither can spend the other''s '
  'token. See db/063.';

-- The confirm path looks a row up by token_hash, which is already unique, so
-- no index is owed here. The customer index from db/015 still serves "every
-- link ever issued to this person", which is the only other read.

-- ── customer.email_confirmed_at ──────────────────────────────────────
--
-- WHY A TIMESTAMP AND NOT A BOOLEAN, for the same reason db/015 gave for
-- accepted_at: there is exactly one fact here and it happened at a moment. A
-- boolean throws away when, and when is what tells you whether a confirmation
-- is minutes old or from a campaign eighteen months ago.
--
-- AND WHY IT IS NOT accepted_at. These are two different facts and conflating
-- them would blur the line db/015 was written to draw. Confirming an address
-- proves the inbox is hers. Acceptance is the house taking her on. She can have
-- the first without the second forever, and most applicants will.
--
-- null means she has not pressed the button in the note — which is also every
-- customer created before this ships, correctly: none of them was ever asked.

alter table customer add column email_confirmed_at timestamptz;

comment on column customer.email_confirmed_at is
  'When she pressed the button in the confirmation note, proving the inbox is '
  'hers. null means she has not, including every row created before db/063 — '
  'those were never asked. NOT the same fact as accepted_at: this says the '
  'address is real, that says the house took her on. See db/063.';

-- ── application_pass ─────────────────────────────────────────────────
--
-- A browser that is allowed to answer the questions.
--
-- ── WHY THIS IS NOT A login_session ──────────────────────────────────
--
-- Because an applicant is not a member, and a `login_session` row carrying her
-- customer_id is a member session by another name — `subjectForSession` would
-- hand it back as `kind: "member"`. It would be inert (the policy layer re-asks
-- `accepted_at` on every read and refuses), and that is exactly the problem:
-- the row would look like access, behave like nothing, and be indistinguishable
-- from a bug for as long as anybody stared at it. db/015 spent a whole comment
-- block drawing this line. Nothing here crosses it.
--
-- ── WHY IT IS NOT A sign_in_token EITHER ─────────────────────────────
--
-- One column's worth of difference, and it is the load-bearing one. Every row
-- in that table is SPENT ONCE — that is the property the whole design rests on
-- and the reason the redemption is a single `update … where consumed_at is
-- null`. A pass is read on every page load for as long as it lives, so it has
-- no `consumed_at` at all. Putting a never-consumed row in a single-use table
-- would be rule 23 again: a field that answers a different question than it
-- appears to. The hashing rule, the token shape and the expiry predicate are
-- the same because they are the same good ideas, not because the two things
-- are the same thing.
--
-- ── WHAT IT DOES AND DOES NOT PROVE ──────────────────────────────────
--
-- It proves nothing on its own. A pass points at a customer; whether that
-- customer's address is confirmed is read from `email_confirmed_at` at the
-- moment it matters, never copied here. So a pass minted at sign-up (before
-- the note has been opened) and a pass minted at the click are the same row,
-- and the browser she typed her address into starts working the moment the
-- confirmation lands somewhere else — which is what makes it safe for the note
-- to open in a different browser from the one holding her answers.
--
-- ── ITS LIFE ─────────────────────────────────────────────────────────
--
-- Thirty days, absolute. Long, because the thing it is protecting is a
-- half-finished application that lives in her browser and may sit through a
-- fortnight of ordinary life; short enough that a shared laptop does not carry
-- a way into somebody else's application forever. It is NOT consumed at
-- submission: quiz_response is append-only and a host may bring the house a
-- second occasion, so burning the pass would refuse her the next one.

create table application_pass (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customer(id) on delete cascade,
  -- sha256 of the raw token, hex. Never the token. Same rule as db/011.
  token_hash  text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),

  expires_at  timestamptz not null,
  -- Diagnostics only, never a condition of the read: a pass created on a phone
  -- and used on a laptop is the normal case, not an attack.
  user_agent  text,
  created_at  timestamptz not null default now()
);

create index application_pass_customer_idx
  on application_pass (customer_id, created_at desc);

comment on table application_pass is
  'A browser that may answer the application questions. Holds a sha256 of the '
  'token, never the token. NOT a session: it grants no portal and no desk, and '
  'it says nothing about whether the address is confirmed — that is read from '
  'customer.email_confirmed_at every time it matters. NOT a sign_in_token '
  'either: it is read many times and never consumed. See db/063 and '
  'src/lib/application.ts.';
