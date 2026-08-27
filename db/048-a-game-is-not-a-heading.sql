-- ── 048 · A GAME IS NOT A HEADING ───────────────────────────────────
--
-- Applied by scripts/migrate.mjs in filename order, inside one transaction
-- together with its schema_migrations ledger row. Nothing here may be a
-- statement that refuses to run in a transaction.
--
-- New file, never applied anywhere, so no SENTINELS entry in
-- scripts/migrate.mjs.
--
-- THIS MIGRATION CREATES NO TABLE, DROPS NOTHING AND CHANGES NO TYPE. It moves
-- twenty existing rows from one `bank_kind` to another, and it exists for
-- exactly one reason: the same twenty rows already sit in the production
-- database under the kind the old parser gave them, and `scripts/seed-bank.mjs`
-- cannot move them.
--
-- ═════════════════════════════════════════════════════════════════════
-- THE DEFECT
-- ═════════════════════════════════════════════════════════════════════
--
-- `seed-bank` routed a bank row to `bank_kind` BY SECTION HEADING ALONE:
--
--     ["GAMES",           { kind: "game" }],
--     ["GAMES/BOOKINGS",  { kind: "game" }],
--
-- Only three rooms of eighteen ever wrote a `GAMES:` heading with content in
-- it, so the seeder produced three `game` rows in the entire catalogue. Every
-- other game the founder wrote lives inside a `GOODS:` line and could
-- therefore never become a `game` row, however plainly it was one: the leather
-- dice cups and the liar's-dice card at Vegas, the double-nine dominoes at
-- Havana, the tombola kit at Amalfi, the Bingo kit and the gin deck at
-- Catskills, the cribbage board at Nantucket, the backgammon board at
-- St. Moritz.
--
-- A read-only audit counted it: 42 distinct games named in the repo, 3 of them
-- `bank_item` rows of kind `game`, and 22 of the missing 39 already holding a
-- bank row filed as `good` or `printed_card`. Founder: "fix the parser so the
-- games become rows."
--
-- The parser is fixed — section 11 of scripts/seed-bank.mjs, `GAME_ROUTINGS`,
-- twenty rows named by slug with the clause's own words as the evidence. A
-- fresh database therefore inserts them as `game` and needs nothing from this
-- file. THE ONE THAT ALREADY EXISTS IS THE PROBLEM.
--
-- ═════════════════════════════════════════════════════════════════════
-- WHY THE SEEDER CANNOT DO IT, AND WHY THAT IS CORRECT
-- ═════════════════════════════════════════════════════════════════════
--
-- `kind` is inside seed-bank's `differs` comparison, and `differs` without
-- `--overwrite` prints "left as the desk has it" and moves on. That is not an
-- oversight to route around: it is CLAUDE.md's whole discipline about a
-- curator's edit outranking the file, and it means a plain deploy would report
-- twenty differences forever and change nothing.
--
-- The alternative — running `seed:bank -- --overwrite` — is worse than doing
-- nothing, because `--overwrite` lets the file beat the curator on EVERY
-- column of EVERY row: names, descriptions, phases, lead times, supply notes.
-- Twenty kinds is the change that was wanted; three hundred and fifty-six rows
-- of authored text is what would actually move.
--
-- So the move is a migration with the twenty slugs written out, and this is
-- the same shape as db/040's phase retags: a NAMED, BOUNDED correction to rows
-- that already exist, beside a parser change that makes every future insert
-- come out right on its own.
--
-- ═════════════════════════════════════════════════════════════════════
-- THE RESTRAINT, WHICH IS db/043's AND IS THE POINT
-- ═════════════════════════════════════════════════════════════════════
--
-- db/043's slot classifier moved only claims that were STILL THE MACHINE'S
-- OWN, identified by the classifier's own note, and left curator-authored ones
-- untouched. db/044 kept the same discipline when it repaired the hyphen bug.
-- This file keeps it twice over, in the only two forms available here:
--
--   THE KIND. Each row moves only where its kind is STILL EXACTLY THE VALUE
--     THE OLD PARSER WROTE. `bank_item.kind` carries no note, so the value
--     itself is the evidence: `good` on the tombola kit is what seed-bank
--     derived, and anything else is a person having decided otherwise at the
--     desk. A curator who has already made one of these a `host_act` — or a
--     `game` — is not overruled, and is REPORTED so the disagreement is
--     visible rather than resolved by whoever ran the deploy.
--
--   THE SLOT. Changing `kind` changes what `bank_item_default_slot()` would
--     return, because its table-dressing branch is gated on
--     `p_kind in ('good','printed_card')`. db/043's trigger is AFTER INSERT
--     only, deliberately, so an UPDATE here does not re-run it — which means
--     the migrated database and a freshly built one would DISAGREE unless this
--     file follows through. It follows through only for claims still carrying
--     the machine's note.
--
-- ═════════════════════════════════════════════════════════════════════
-- ONE ROW ACTUALLY CHANGES SLOT, AND IT IS THE SECOND DEFECT
-- ═════════════════════════════════════════════════════════════════════
--
-- Nineteen of the twenty land in `the_atmosphere` under either kind, so the
-- slot half of this file is a no-op for them and is written anyway, because a
-- correction that happens to be unnecessary today is not the same thing as one
-- that cannot be needed.
--
-- The twentieth is `las-vegas-celebrity-1960-deck`, and it is worth reading.
-- Its clause is "Celebrity 1960 deck (~80 printed marquee-ticket slips + draw
-- vessel + fishbowl three-round rules)". The classifier's table-dressing
-- vocabulary contains 'bowl' — for the bowls of lemons and the citrus bowls —
-- and "fishbowl" contains "bowl", so a party game has been filed as TABLE
-- DRESSING since db/043. Nothing said anything: it is a plausible slot for a
-- plausible object and the row rendered correctly on the desk.
--
-- That is CLAUDE.md rule 24 arriving from the direction nobody was looking:
-- the count that proved the kind defect also proved a slot defect, and the
-- second one was invisible to inspection because the misfiled row looked
-- entirely at home. The vocabulary is NOT widened here — 'bowl' is right for
-- the bowls and a word-boundary rule is a different change with its own
-- argument — the row simply stops meeting the branch, because a game never did.
--
-- ═════════════════════════════════════════════════════════════════════
-- ZERO IS THE CORRECT ANSWER ON A FRESH DATABASE
-- ═════════════════════════════════════════════════════════════════════
--
-- CLAUDE.md rule 22: `preDeployCommand` runs `migrate` before every seeder, so
-- on a database built from the committed chain `bank_item` IS EMPTY WHEN THIS
-- FILE RUNS and it moves nothing. That is correct and is not the db/020
-- failure — this migration does not DERIVE anything from content, it corrects
-- rows that a previous version of a seeder wrote, and on a database that never
-- ran that version there is nothing to correct. seed-bank then inserts all
-- twenty as `game` directly.
--
-- So there is NO "must have moved rows" guard here; it would fail every fresh
-- build. The guard that belongs to rule 22 checks the END STATE after content
-- exists, and it lives in the only place that can see one — inside seed-bank
-- itself, which runs in `preDeployCommand` after `migrate`. `GAME_ROUTINGS`
-- fails the run if any of its twenty slugs is absent from the parse or is no
-- longer holding the kind the ruling overrules, so a deploy on which the games
-- silently stopped being games cannot succeed. This file raises a NOTICE with
-- what it moved, so a real deploy also says which of the two situations it was
-- in rather than printing nothing either way.

-- ── the twenty, and the kind each one currently holds ────────────────
--
-- Written out rather than derived. A predicate that FOUND these rows would be
-- the word-matcher section 11 of the seeder refuses by name: "deck" reaches
-- four playing-card decks that are goods and one prompt deck that is a game,
-- and "bowl" is what put the Celebrity deck on the table in the first place.
-- Twenty slugs cannot drift.

create temporary table games_that_were_goods (
  slug     text primary key,
  was_kind bank_kind not null
) on commit drop;

insert into games_that_were_goods (slug, was_kind) values
  ('new-york-the-game-1938-prompt-slips',                  'printed_card'),
  ('new-york-backgammon-owned-if-present',                 'good'),
  ('new-orleans-1956-charades-prompt-deck',                'printed_card'),
  ('dolomites-northern-italian-pattern-card-deck',         'good'),
  ('havana-double-nine-dominoes-in-wooden-box',            'good'),
  ('las-vegas-leather-dice-cups-five-dice-each',           'good'),
  ('las-vegas-celebrity-1960-deck',                        'good'),
  ('las-vegas-pick-a-number-kit',                          'good'),
  ('cote-dazur-belote-rules-card',                         'printed_card'),
  ('cote-dazur-petanque-set',                              'good'),
  ('catskills-bingo-kit-with-corny-pre-written-call-card', 'good'),
  ('catskills-gin-deck',                                   'good'),
  ('catskills-mah-jongg-owned-if-present',                 'good'),
  ('big-sur-noun-game-1971-slips',                         'printed_card'),
  ('nantucket-cribbage-board',                             'good'),
  ('nantucket-chess-owned-if-present',                     'good'),
  ('amalfi-1953-tombola-kit',                              'good'),
  ('amalfi-1953-napoletane-pattern-40-card-deck',          'good'),
  ('oaxaca-1954-baraja-espanola-40-card-deck',             'good'),
  ('st-moritz-1984-backgammon-board',                      'good');

-- ── the move ─────────────────────────────────────────────────────────
--
-- `and b.kind = g.was_kind` is the restraint, in the WHERE clause rather than
-- in a sentence promising it. A row a curator has already reclassified is not
-- touched at any cost, and the notice below counts what was skipped so the
-- silence is not mistaken for agreement.

create temporary table games_moved (slug text primary key) on commit drop;

with moved as (
  update bank_item b
     set kind = 'game'
    from games_that_were_goods g
   where b.slug = g.slug
     and b.kind = g.was_kind
  returning b.slug
)
insert into games_moved (slug) select slug from moved;

-- ── the slot that follows the kind ───────────────────────────────────
--
-- Only for rows this file actually moved, and only where the claim is STILL
-- THE MACHINE'S. Both note spellings are matched because db/043 wrote two: the
-- backfill's ('Classified by db/043 through bank_item_default_slot().') and
-- the trigger's ('Default claim from bank_item_default_slot() — db/043. …').
-- A claim a curator wrote carries her words and is excluded here by design.
--
-- Two statements, the same shape db/044 needed: a row that already holds a
-- claim on the destination slot must lose the stale one rather than collide
-- with it on (bank_item_id, slot_code).

delete from bank_item_slot s
 using bank_item b, games_moved m
 where b.id = s.bank_item_id
   and b.slug = m.slug
   and (s.note like 'Classified by db/043 through bank_item_default_slot().%'
     or s.note like 'Default claim from bank_item_default_slot()%')
   and s.slot_code <> bank_item_default_slot(b.kind, b.name, b.description)
   and exists (
     select 1 from bank_item_slot t
      where t.bank_item_id = b.id
        and t.slot_code = bank_item_default_slot(b.kind, b.name, b.description));

update bank_item_slot s
   set slot_code = bank_item_default_slot(b.kind, b.name, b.description),
       note = 'Re-slotted by db/048 when the row became a game. '
              'bank_item_default_slot()''s table-dressing branch is gated on '
              'kind in (''good'',''printed_card''), and db/043''s trigger is '
              'AFTER INSERT only — so a kind change moves what the classifier '
              'would return and moves nothing on its own. Still the machine''s '
              'claim, not a curator''s; move it with an update.'
  from bank_item b, games_moved m
 where b.id = s.bank_item_id
   and b.slug = m.slug
   and (s.note like 'Classified by db/043 through bank_item_default_slot().%'
     or s.note like 'Default claim from bank_item_default_slot()%')
   and s.slot_code <> bank_item_default_slot(b.kind, b.name, b.description);

-- ── what happened, and the one thing that must be true after ─────────

do $$
declare
  v_present bigint;
  v_moved   bigint;
  v_already bigint;
  v_curated bigint;
  v_stuck   bigint;
begin
  select count(*) into v_present
    from bank_item b join games_that_were_goods g on g.slug = b.slug;

  select count(*) into v_moved from games_moved;

  select count(*) into v_already
    from bank_item b join games_that_were_goods g on g.slug = b.slug
   where b.kind = 'game'
     and not exists (select 1 from games_moved m where m.slug = b.slug);

  select count(*) into v_curated
    from bank_item b join games_that_were_goods g on g.slug = b.slug
   where b.kind <> 'game' and b.kind <> g.was_kind;

  -- THE ONE ASSERTION. Every row this file moved must now hold the slot a
  -- FRESHLY BUILT database would give it, unless a curator's own claim is
  -- standing in the way — which is allowed and is why her note is excluded.
  -- A survivor here means the follow-through did not cover its own predicate,
  -- and the two databases would silently disagree from this deploy onward.
  select count(*) into v_stuck
    from bank_item b
    join games_moved m on m.slug = b.slug
    join bank_item_slot s on s.bank_item_id = b.id
   where (s.note like 'Classified by db/043 through bank_item_default_slot().%'
       or s.note like 'Default claim from bank_item_default_slot()%')
     and s.slot_code <> bank_item_default_slot(b.kind, b.name, b.description);

  if v_stuck <> 0 then
    raise exception
      '[048] % rows moved to kind ''game'' still carry a machine-written slot '
      'claim that disagrees with bank_item_default_slot(). A migrated '
      'database and a fresh build would then classify the same row two ways, '
      'which is the db/040 failure this file exists downstream of.',
      v_stuck;
  end if;

  if v_curated <> 0 then
    raise notice
      '[048] % of the twenty are held at a kind NOBODY here wrote — a curator '
      'moved them at the desk and this file does not overrule her. They are '
      'left exactly as they are, and the disagreement is now on the record '
      'rather than settled by whoever ran the deploy.', v_curated;
  end if;

  raise notice
    '[048] % of the twenty named rows exist here; % moved to kind ''game'', '
    '% already were. ZERO IS THE CORRECT ANSWER ON A DATABASE BUILT FROM THE '
    'COMMITTED CHAIN: migrate runs before every seeder, so bank_item is empty '
    'when this file runs and seed-bank inserts all twenty as games directly '
    '(CLAUDE.md rule 22). A number here means this is the database that ran '
    'the old parser.',
    v_present, v_moved, v_already;
end;
$$;

comment on type bank_kind is
  'What a bank row IS — good, host_act, game, printed_card. NOT which block '
  'of docs/atmosphere-idea-bank-v1.md it was written under: the founder names '
  'games inside GOODS lines in twelve rooms, and reading the heading as the '
  'answer left the catalogue with three game rows across eighteen rooms until '
  'db/048. The routing lives in GAME_ROUTINGS in scripts/seed-bank.mjs, by '
  'slug, with the clause''s own words as the evidence. A clause yields ONE row '
  'of its own kind plus the cards that ride with it — a rules card is still a '
  'printed_card, riding with a game. And nothing anywhere records that a room '
  'HAS no game: "GAMES: none" writes no row and no negative claim, so a room '
  'that says none can receive one the day somebody names one.';
