-- Revelle Société — A NO THAT STAYS NO
--
-- Applied by scripts/migrate.mjs after 056, inside one transaction together
-- with its schema_migrations ledger row.
--
-- ─────────────────────────────────────────────────────────────────────
-- THE HOLE THIS CLOSES
--
-- Founder, 2026-09-02: "i keep saying no to certain items and they just pop
-- back up when i return to the list." And then, on being offered retirement
-- instead: "i want these deleted otherwise its confusing, need a delete or no
-- button for dishes, games, drinks etc."
--
-- Both halves are right and the second is the harder one.
--
-- A seeder creates a pool row when its slug is absent — seed-bank's
-- `select ... from bank_item where slug = $1`, and the same shape in
-- seed-dishes, seed-drinks, seed-games. They run on every deploy from
-- documents that still describe the item. So DELETE alone is not a refusal;
-- it is a pause until the next push. The row comes back with a new id and no
-- memory of having been refused.
--
-- Retiring fixes that by leaving the row in the way, and it was the wrong
-- answer: a list of refused things wearing a Retired pill is a list a curator
-- has to read past forever. She asked for them gone. Gone is correct.
--
-- ── SO: THE ROW GOES, AND THE NO STAYS ───────────────────────────────
--
-- `refused_row` remembers the slug. The row itself is deleted. A seeder that
-- tries to recreate it is stopped at the table, not asked to check first.
--
-- ── WHY A TRIGGER AND NOT SIX SEEDER EDITS ───────────────────────────
--
-- Because six seeders means six chances to forget, and the seventh pool
-- arrives with none of them. This is rule 21 in its plainest form: "every fact
-- two surfaces must agree on has exactly one owner". The fact is "this slug
-- was refused" and the owner is this table. A BEFORE INSERT trigger that
-- returns NULL skips the row silently at the only point every creation path
-- must pass through — the insert itself. No seeder can route around it,
-- including one written next year by somebody who never read this file.
--
-- It RAISES A NOTICE on the way past, so the deploy log says what it declined
-- to build. A guard that works invisibly is a guard nobody can debug (rule
-- 23), and the seeder printing "created 0" with no reason is exactly the kind
-- of silence that cost two days on requires_full_kitchen.
--
-- ── AND HOW A REFUSAL IS UNDONE ──────────────────────────────────────
--
-- Delete the refused_row. The next deploy recreates the item from the document
-- as an ordinary draft. That is deliberate: a refusal is a decision and a
-- decision may be reversed, the same way the corno's refusal was superseded
-- on 2026-09-02 when it turned out to be a prize rather than a take-home.
-- Nothing here is permanent except the record that it happened.

create table refused_row (
  -- Which pool. Checked against ingredient_pool below rather than an enum, so
  -- a seventh pool needs no edit here.
  entity_table text not null references ingredient_pool(entity_table)
                 on delete restrict,
  -- The slug, which is the identity a seeder recreates by. Not the id: the id
  -- dies with the row and a recreated row would have a new one, which is
  -- precisely how the old delete failed to stick.
  slug         citext not null,

  refused_by   text not null,
  refused_at   timestamptz not null default now(),
  -- What it was called when it was refused, so the ledger reads as a list of
  -- objects rather than a list of slugs.
  name_at_refusal text not null default '',
  -- Free text. A refusal that carries its reason is db/042's rule, and the
  -- reason is the only part of this a person will ever want back.
  reason       text not null default '',

  primary key (entity_table, slug)
);

comment on table refused_row is
  'Slugs a curator has refused. The pool row itself is DELETED; this is what '
  'stops a seeder recreating it from the document on the next deploy. Delete '
  'a row here to un-refuse: the item returns as an ordinary draft.';

create index refused_row_when on refused_row (refused_at desc);


-- ── the guard ────────────────────────────────────────────────────────
--
-- BEFORE INSERT, returning NULL, which in PostgreSQL skips the row without
-- failing the statement. A seeder inserting fifty items where one is refused
-- writes forty-nine and carries on — the refusal is not an error and must not
-- fail a deploy.

create or replace function refuse_recreated() returns trigger
language plpgsql
as $$
declare v_name text;
begin
  select name_at_refusal into v_name
    from refused_row
   where entity_table = tg_table_name and slug = new.slug;

  if found then
    raise notice '[refused] % / % was refused and is not being recreated (%)',
      tg_table_name, new.slug, coalesce(nullif(v_name, ''), 'no name recorded');
    return null;
  end if;

  return new;
end $$;

comment on function refuse_recreated is
  'BEFORE INSERT on every pool table: skips a row whose slug is in '
  'refused_row, and says so in the log. Returning NULL skips without failing '
  'the statement, so a seeder writing fifty rows where one is refused writes '
  'the other forty-nine.';


-- ── install it on every pool, from the registry ──────────────────────
--
-- Driven by ingredient_pool so a seventh pool is guarded the day it is
-- registered. `menu` is included even though its pool is retired: a retired
-- pool is not a deleted table, and a refusal made before retirement should
-- still hold if it is ever brought back.
do $$
declare p record;
begin
  for p in select entity_table from ingredient_pool order by entity_table loop
    -- Only tables that actually carry a slug; the guard has nothing to match on
    -- without one, and saying so is better than installing a trigger that can
    -- never fire.
    if exists (
      select 1 from information_schema.columns
       where table_name = p.entity_table and column_name = 'slug'
    ) then
      execute format(
        'create trigger %I before insert on %I
           for each row execute function refuse_recreated()',
        p.entity_table || '_refusal_guard', p.entity_table);
      raise notice '[057] guard installed on %', p.entity_table;
    else
      raise notice '[057] % has no slug column — no guard, and nothing to key one on', p.entity_table;
    end if;
  end loop;
end $$;
