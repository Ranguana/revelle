-- ── 030 · ARCHIVE THE TEST APPLICATIONS ──────────────────────────────
--
-- Six rows in the inbox are test traffic from mid-August, sitting beside real
-- applications with nothing marking them apart:
--
--   portal-preview@example.invalid   (x2, one of them "Nora Vance")
--   throttle-probe@revellery.com     (x3, seconds apart — a rate-limit probe)
--   test@example.com                 (x1)
--
-- ── WHY THEY ARE ARCHIVED AND NOT DELETED ────────────────────────────
--
-- `quiz_response` is append-only, and the trigger in db/001 says exactly what to
-- do instead:
--
--   'quiz_response is append-only: row % may not be deleted.
--    Set status = ''archived''.'
--
-- That rule is right and this file obeys it rather than working around it. An
-- application is a record of somebody having asked, and a system that can
-- silently unask is a system whose history cannot be trusted. Two of these even
-- produced delivered Revelles — that happened, and pretending otherwise would
-- put a hole in the only record of what the engine has ever actually done.
--
-- ── MATCHED NARROWLY, ON PURPOSE ─────────────────────────────────────
--
-- Three exact patterns rather than anything clever. A rule like "archive
-- anything that looks like a test" is how a real member with an unusual address
-- gets swept out of her own inbox. `throttle-probe@` is matched at the start of
-- the local part so a member cannot collide with it by accident.
--
-- If this recurs, the fix is not a broader pattern here — it is that test
-- traffic should not reach the production database, which is a question about
-- how the probes were run rather than about this table.
--
-- THE EMAIL IS ON `customer`, NOT ON `quiz_response`. The first version of this
-- file assumed otherwise and failed the deploy with `column "email" does not
-- exist`, which is the pre-deploy doing its job: a bad migration took the whole
-- chain down and the old instance kept serving. db/001 is explicit about why
-- the column lives there — "Name is not asked at quiz time (the email is the
-- whole ask)" — so an application reaches its address through customer_id.

update quiz_response q
   set status = 'archived'
  from customer c
 where c.id = q.customer_id
   and q.status <> 'archived'
   and (
        c.email like '%@example.invalid'
     or c.email like '%@example.com'
     or c.email like 'throttle-probe@%'
   );

-- ── THEIR REVELLES STAY DELIVERED ────────────────────────────────────
--
-- An earlier version of this file also archived the Revelles these
-- applications produced, so the more visible half of the pair would stop
-- reading as real work. THE DATABASE REFUSED IT:
--
--   new row for relation "revelle" violates check constraint
--   "revelle_delivered_has_timestamp"
--
-- The constraint is `(status = 'delivered') = (delivered_at is not null)`, and
-- it was right. A Revelle that was delivered HAS a delivery timestamp, and
-- moving it to 'archived' while the timestamp stands would have made the row
-- lie about itself.
--
-- It also caught this file contradicting its own argument two paragraphs up.
-- The applications are archived rather than deleted because a system that can
-- silently unask cannot be trusted — and then it tried to un-deliver two
-- Revelles for tidiness. They were delivered. That is the only record of what
-- the engine has ever actually produced, and it stays.
--
-- The applications leave the inbox; their Revelles remain true.

do $$
declare v_q int;
begin
  select count(*) into v_q from quiz_response q join customer c on c.id = q.customer_id
   where q.status = 'archived'
     and (c.email like '%@example.invalid' or c.email like '%@example.com'
          or c.email like 'throttle-probe@%');
  raise notice '[030] % test application(s) archived', v_q;
end $$;
