-- ── 029 · EVERY DESTINATION CARRIES ITS YEAR ─────────────────────────
--
-- The catalogue is pinned to a period per destination, because the YEAR is what
-- fixes the register a voice is written in and the voice is the medium of every
-- deliverable. A house with no date has no register to be written in. Nine of
-- the twelve were named by a MOMENT — THE SMALL HOURS, NEW YEAR'S, 3 A.M., LAST
-- WEEK OF CAMP — and all twelve are now dated.
--
-- ── WHY THIS IS A MIGRATION AND NOT A SEED ───────────────────────────
--
-- The names were changed in src/lib/destinations.ts on 2026-08-22 and NEVER
-- REACHED PRODUCTION. seed-destinations reports `exists — left as it is` for
-- every authored room and has no --overwrite flag, because the rule protects a
-- curator's work. That rule is right and is not being weakened: this file is
-- the founder deciding, once, for ONE COLUMN, in the only place that can.
--
-- ── ONE COLUMN, DELIBERATELY ─────────────────────────────────────────
--
-- `name` only. Not tagline, not description, not tokens, not status. Those may
-- also differ from the file — Catskills' tagline and premise were rewritten at
-- the desk and have just been moved INTO the file rather than out of it, which
-- is the direction those go. A migration that swept every column would have
-- reverted that work in the same breath as fixing this.
--
-- The desk surfaces the rest at /desk/destinations, field by field, for a
-- person to reconcile deliberately. This is the one field where the decision
-- was already made and only the database had not heard.

update world w
   set name = v.name
  from (values
    ('westhampton-1976', 'WESTHAMPTON, 1976'),
    ('havana', 'HAVANA, 1957'),
    ('las-vegas', 'LAS VEGAS, 1960'),
    ('new-york', 'NEW YORK, 1938'),
    ('nantucket', 'NANTUCKET, 1972'),
    ('new-orleans', 'NEW ORLEANS, 1956'),
    ('catskills', 'CATSKILLS, 1963'),
    ('cote-dazur', 'CÔTE D''AZUR, 1962'),
    ('portofino', 'PORTOFINO, 1961'),
    ('dolomites', 'DOLOMITES, 1956'),
    ('big-sur', 'BIG SUR, 1971'),
    ('tahiti', 'TAHITI, 1961')
  ) as v(slug, name)
 where w.slug = v.slug
   and w.name is distinct from v.name;

do $$
declare v_n int;
begin
  get diagnostics v_n = row_count;
  raise notice '[029] % destination name(s) brought to the file', v_n;
end $$;
