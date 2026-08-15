-- Revelle Société — delivery, not preview, is what binds the uniqueness promise
--
-- Applied by scripts/migrate.mjs after 002, inside one transaction together
-- with its schema_migrations ledger row. Same rule as 001 and 002: nothing here
-- may be a statement that refuses to run in a transaction.
--
-- New file, never applied anywhere, so no SENTINELS entry in
-- scripts/migrate.mjs. Discovery picks it up; the ledger makes it run once.
--
-- ─────────────────────────────────────────────────────────────────────
-- TWO DECISIONS FROM THE FOUNDER
--
-- 002 shipped assemblage uniqueness binding at `status <> 'draft'`, on the
-- assumption that 'preview' meant "shown to the customer before purchase". It
-- does not. Preview is the CURATOR'S WORKSPACE: she builds several previews of
-- the same Revelle to compare them side by side and then chooses one. Under
-- 002's rule the second comparison preview was rejected as a duplicate of the
-- first, which made the intended workflow impossible.
--
--   DECISION 1. Uniqueness binds at DELIVERY, not at preview. Drafts and
--   previews may collide with each other and with anything else, freely and in
--   any number.
--
--   DECISION 2. NO REISSUE, EVER. An assemblage is delivered once, to one
--   person, for good — INCLUDING to the same customer a second time. There is
--   deliberately no same-customer exemption and no supersedes/reissue escape
--   hatch. A legitimate re-delivery requires a curator to vary at least one
--   pooled ingredient first.
--
-- These two pull in opposite directions and the tension is the whole content of
-- this migration. Relaxing the binding point (1) creates a population of
-- colliding previews that were previously impossible; tightening the rule (2)
-- means every one of those previews must still be checked AT THE MOMENT IT IS
-- DELIVERED. A preview that already existed happily alongside its twin must not
-- be waved through on delivery simply because it was allowed to exist. The
-- guard below therefore checks on the TRANSITION, not on the creation.
--
-- ─────────────────────────────────────────────────────────────────────
-- WHY A NEW COLUMN AND NOT JUST A NEW PREDICATE
--
-- The obvious change is to swap the index predicate from `status <> 'draft'` to
-- `status = 'delivered'`. That is wrong, and the reason is worth writing down.
--
-- `revelle_status` is ('draft', 'preview', 'delivered', 'archived'). An
-- archived Revelle is one that WAS delivered and is now out of the way. Under
-- `status = 'delivered'`, archiving a Revelle would release its assemblage back
-- into the pool — which is precisely the reissue escape hatch decision 2
-- forbids, reachable by a one-word status change.
--
-- So the predicate must cover 'archived' too. But `status in ('delivered',
-- 'archived')` over-reaches in the other direction: a discarded comparison
-- preview that a curator archives has never been delivered to anybody, and
-- locking its ingredients away forever would punish exactly the workflow
-- decision 1 exists to permit.
--
-- The honest test is neither status nor `delivered_at`:
--
--   001's `revelle_delivered_has_timestamp` is an EQUALITY —
--       check ((status = 'delivered') = (delivered_at is not null))
--   so `delivered_at` is forced to NULL for any row not currently sitting in
--   'delivered'. It cannot answer "was this ever delivered", because archiving
--   erases it. (That constraint is left alone here — see the note at the foot
--   of this file.)
--
-- What is needed is a fact that is true once and stays true: FIRST DELIVERY.
-- `first_delivered_at` is a RATCHET — set on the first transition into
-- 'delivered', never cleared by any later status change, archival or otherwise.
-- It is the only column in this schema that describes something that happened
-- rather than something that is, which is what makes it the right thing to hang
-- an irrevocable promise on.

alter table revelle
  -- A RATCHET. Set once, by trigger, on the first transition into 'delivered';
  -- never cleared, never moved, not writable by hand — the guard restores any
  -- previous value on every update. This is what "she has this" means, and it
  -- is what the uniqueness promise is enforced against.
  --
  -- Distinct from `delivered_at`, which 001 ties to the CURRENT status and
  -- which therefore goes null again the moment a Revelle is archived.
  add column first_delivered_at timestamptz;

comment on column revelle.first_delivered_at is
  'Ratchet: when this Revelle was first delivered to a customer. Never cleared, '
  'including on archive. The predicate behind revelle_assemblage_unique. '
  'Trigger-maintained — see db/003.';

-- ── the guard, restated ──────────────────────────────────────────────
--
-- Replaces the version in 002. Three changes:
--
--   1. It maintains the ratchet: sets first_delivered_at on the first
--      transition into 'delivered', and restores any existing value on every
--      other update so the column cannot be cleared or backdated by a stray
--      write. Doing this in the SAME before-trigger that runs the check is what
--      makes the delivery transition self-checking — the row becomes delivered
--      and is validated in one step, with no window in between.
--
--   2. The exemption is `first_delivered_at is null` rather than `status =
--      'draft'`. Drafts and previews are exempt because they have never been
--      delivered, not because of their name — which means a preview being
--      PROMOTED to delivered is checked on the way through, since the line
--      above has just set its ratchet. Two previews may sit on the same
--      assemblage indefinitely; the first to be delivered takes it, and the
--      second is rejected at its own delivery.
--
--   3. The message reflects decision 2. It no longer implies that archiving,
--      re-issuing, or targeting the same customer is a route around the rule,
--      because none of them is. When the earlier delivery went to the SAME
--      customer the message says so outright — that is the case a curator will
--      otherwise assume is a bug.

create or replace function revelle_assemblage_guard() returns trigger
language plpgsql as $$
declare
  v_fp      text;
  v_other   record;
  v_shared  text;
  v_who     text;
begin
  v_fp := compute_assemblage_fingerprint(new.id, new.world_id);
  new.assemblage_fingerprint := v_fp;

  -- THE RATCHET. This column is owned entirely by this trigger and the three
  -- branches are exhaustive, so no other statement can set, move or clear it:
  --
  --   1. already delivered  -> keep the original value, whatever the write says.
  --      Restoring silently rather than raising is deliberate — ordinary code
  --      that copies a row around should not have to know this column exists,
  --      and the one thing that must never happen is that it gets cleared.
  --   2. becoming delivered -> stamp it, honouring an explicitly supplied value
  --      so that importing a historical delivery with its real date works.
  --   3. anything else      -> null. A draft or preview cannot acquire a
  --      delivery date by a stray write, which would otherwise let a row claim
  --      an assemblage it had never been given to anybody.
  if tg_op = 'UPDATE' and old.first_delivered_at is not null then
    new.first_delivered_at := old.first_delivered_at;
  elsif new.status = 'delivered' then
    new.first_delivered_at :=
      coalesce(new.first_delivered_at, new.delivered_at, now());
  else
    new.first_delivered_at := null;
  end if;

  -- Never delivered, or nothing to hash: outside the promise. This is the line
  -- that lets a curator build five previews of the same assemblage and compare
  -- them.
  if v_fp is null or new.first_delivered_at is null then
    return new;
  end if;

  select r.id, r.customer_id, r.status, r.first_delivered_at, c.email
    into v_other
    from revelle r
    join customer c on c.id = r.customer_id
   where r.assemblage_fingerprint = v_fp
     and r.first_delivered_at is not null
     and r.id <> new.id
   limit 1;

  if not found then
    return new;
  end if;

  select string_agg(ingredient_label(k.entity_table, k.entity_id), ', '
                    order by k.entity_table, k.entity_id)
    into v_shared
    from (
      select 'world'::text as entity_table, new.world_id as entity_id
       where new.world_id is not null
      union
      select i.entity_table, i.entity_id
        from revelle_ingredient i
       where i.revelle_id = new.id and i.entity_table <> 'world'
    ) k;

  -- The same-customer case is called out by name. A curator who is deliberately
  -- rebuilding for someone she has already served will hit this, and "delivered
  -- to bea@example.com" when Bea is the customer in front of her reads as a bug
  -- rather than as the rule doing its job.
  v_who := case
             when v_other.customer_id = new.customer_id
               then format('THIS SAME CUSTOMER (%s)', v_other.email)
             else format('another customer (%s)', v_other.email)
           end;

  raise exception
    'Revelle % would repeat an assemblage that has already been delivered.',
    new.id
    using
      detail = format(
        'Identical pooled ingredients to revelle %s, delivered to %s on %s. '
        'Shared: %s.',
        v_other.id, v_who, v_other.first_delivered_at::date,
        coalesce(v_shared, '(none resolvable)')),
      hint =
        'An assemblage is delivered once, to one person, ever — the same '
        'customer included. Vary at least one pooled ingredient: a different '
        'world, or swap one item in the edit. Nothing else clears this — '
        'archiving or re-statusing the earlier Revelle does not release its '
        'assemblage, and rewording the dedication or any section will not '
        'help, because free text is deliberately not part of the fingerprint.',
      errcode = 'unique_violation';
end;
$$;

-- ── the ratchet, backfilled, and the index it now carries ────────────
--
-- Ordered deliberately: the trigger above is replaced FIRST, so the backfill
-- below is performed by the same logic that will maintain the column forever
-- rather than by a one-off statement that could disagree with it. Anything
-- currently sitting in 'delivered' has a trustworthy delivered_at, and that is
-- the whole recoverable population — 001's equality constraint has already
-- erased the date from anything archived, so a Revelle delivered and then
-- archived before this migration cannot be recovered and will not claim its
-- assemblage. On a pre-launch database that set is empty.

update revelle set status = status where delivered_at is not null;

-- Partial on the FACT of delivery rather than on current status. Drafts and
-- previews are outside it entirely and may collide freely; a delivered Revelle
-- stays inside it forever, through archival and any later status change.
drop index revelle_assemblage_unique;

create unique index revelle_assemblage_unique
  on revelle (assemblage_fingerprint)
  where assemblage_fingerprint is not null and first_delivered_at is not null;

-- Finding the earlier delivery of a given assemblage, which is what the guard
-- does on every delivery. Also the "what have we actually shipped" read.
create index revelle_delivered_idx on revelle (first_delivered_at)
  where first_delivered_at is not null;

-- ── the two derived views, brought into agreement ────────────────────
--
-- Both were written in 002 against `status <> 'draft'`, which meant "issued"
-- when preview meant "shown to her". It no longer does, and leaving them would
-- make a pooled ingredient look issued because it sat in a comparison preview
-- the curator threw away — which is worse than a wrong number, because
-- `ingredient_issuance` is the read a future selection algorithm is meant to
-- use to bias away from recently used elements.

create or replace view ingredient_issuance as
select i.entity_table,
       i.entity_id,
       count(*)                            as issue_count,
       min(r.first_delivered_at)           as first_issued_at,
       max(r.first_delivered_at)           as last_issued_at,
       count(distinct r.customer_id)       as customer_count
  from revelle_ingredient i
  join revelle r on r.id = i.revelle_id
 where r.first_delivered_at is not null
 group by i.entity_table, i.entity_id;

-- `issued_assemblages` likewise counts deliveries, so it can be compared
-- directly against customers_before_1pct_collision_risk — the two numbers are
-- only meaningful side by side if they count the same kind of thing.
create or replace view assemblage_headroom_summary as
select case when h.ln_n is null then 0
            when h.ln_n > 300000 then null
            else round(exp(h.ln_n)) end
         as distinct_assemblages,
       case when h.ln_n is null then 0
            when h.ln_n > 300000 then null
            else floor(0.1418 * exp(h.ln_n / 2)) end
         as customers_before_1pct_collision_risk,
       h.issued_assemblages,
       h.pools_with_nothing_available
  from (
    select sum(ln(nullif(combinations, 0)))         as ln_n,
           (select count(*) from revelle
             where first_delivered_at is not null
               and assemblage_fingerprint is not null)
                                                    as issued_assemblages,
           count(*) filter (where combinations = 0) as pools_with_nothing_available
      from assemblage_headroom()
  ) h;

-- ─────────────────────────────────────────────────────────────────────
-- WHAT THIS DOES NOT FIX, DELIBERATELY
--
-- 001's `revelle_delivered_has_timestamp` is an equality:
--
--     check ((status = 'delivered') = (delivered_at is not null))
--
-- so `update revelle set status = 'archived'` on a delivered Revelle FAILS
-- unless the same statement also nulls `delivered_at`. That is a pre-existing
-- wart, not something this migration introduces, and it is left alone here
-- because relaxing a constraint from 001 is a decision about what `delivered_at`
-- means rather than a consequence of the two decisions above.
--
-- It is now harmless to the promise — `first_delivered_at` survives the
-- archival either way, so the assemblage stays claimed and no delivery record
-- is lost. But archiving a delivered Revelle still costs its `delivered_at`,
-- and the fix, when someone wants it, is one line in a later migration:
--
--     alter table revelle drop constraint revelle_delivered_has_timestamp,
--       add constraint revelle_delivered_has_timestamp
--         check (status <> 'delivered' or delivered_at is not null);
--
-- which widens it to "delivered implies a date" and lets an archived Revelle
-- keep the date it was delivered on.
-- ─────────────────────────────────────────────────────────────────────
