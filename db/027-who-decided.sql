-- ── 027 · WHO DECIDED ────────────────────────────────────────────────
--
-- There is no curator. The engine ranks, the member is shown two or three, and
-- she taps one. Her pick is the record, and the DIVERGENCE between what the
-- engine ranked first and what she chose is the calibration data the whole
-- selection design exists to collect — see THE SEAM in src/lib/destinations.ts.
--
-- ── THE DEFECT THIS FIXES ────────────────────────────────────────────
--
-- `revelle_proposal.decided_by` is `uuid references staff(id)`. It is not
-- merely overloaded, it is STRUCTURALLY staff-only: a member cannot be recorded
-- in it, because a member is not staff. So under the new design the column
-- silently answers a question nobody is asking any more, and the question that
-- matters — WHO decided, and was it even a person — has no column at all.
--
-- The fix is not to widen `decided_by`. A foreign key that points at two tables
-- depending on a sibling column is how a join starts lying. `decided_by` stays
-- exactly what it is and keeps pointing at staff.
--
-- ── WHY system_default IS THE VALUE THAT MATTERS ─────────────────────
--
-- The reveal has an abandonment path: pick pending, ranking preserved, and on
-- timeout the TOP-RANKED destination becomes the default. A timeout is a
-- decision and it must be recorded as one — but it is not agreement.
--
-- Five hundred rows of "the member chose rank 1" that were actually five
-- hundred people who never came back would poison the divergence measure
-- precisely where it looks healthiest: the model would appear to be agreed with
-- exactly when it was not being read. That is the failure this enum exists to
-- prevent, and it is the reason the column is NOT NULL for any decided row.
--
-- The member's identity needs no column. A proposal reaches its customer
-- through quiz_response, so 'member' plus the existing link is unambiguous.

create type decision_kind as enum (
  'member',           -- she was shown the reveal and tapped one. The record.
  'system_default',   -- nobody tapped. Top rank taken on timeout. NOT agreement.
  'founder_override'  -- a person overrode the engine. Rare, and always staffed.
);

alter table revelle_proposal
  add column decided_by_kind decision_kind;

-- A decided row must say who decided it, and only a founder override may name a
-- staff member. A member pick or a timeout with a staff id in `decided_by` is a
-- contradiction, and contradictions in provenance are worse than nulls.
alter table revelle_proposal
  add constraint revelle_proposal_decision_provenance check (
    case
      when status in ('approved', 'rejected')
        then decided_by_kind is not null
      else true
    end
    and (decided_by_kind = 'founder_override' or decided_by is null)
  );

comment on column revelle_proposal.decided_by_kind is
  'Who decided, and whether it was a person at all. system_default is a '
  'timeout taking rank 1 and must never be read as agreement — the divergence '
  'between predicted rank and actual pick is the calibration signal, and '
  'timeouts recorded as member picks would poison it exactly where it looks '
  'healthiest.';

comment on column revelle_proposal.decided_by is
  'Staff only, and only for founder_override. A member pick records '
  'decided_by_kind = member and reaches its customer through quiz_response; '
  'this column is never widened to hold both.';
