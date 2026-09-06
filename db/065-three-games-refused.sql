-- Revelle Société — THREE GAMES REFUSED, AND FISHBOWL SETTLED
--
-- Applied by scripts/migrate.mjs after 064, inside one transaction together
-- with its schema_migrations ledger row.
--
-- ─────────────────────────────────────────────────────────────────────
-- THE RULING
--
-- Founder, 2026-09-06, having said it before: "remove the swim test (ive said
-- this before) it makes no sense." And again: "delete the swim test game it is
-- so dumb."
--
-- IT DOES NOT MAKE SENSE, AND THE REASON IS WORTH KEEPING because it is a
-- lesson about authoring rather than about this game. Her rule, verbatim:
--
--     "Everybody tells the story of the swim test. Whoever's version is
--      furthest from the ledger wins, and the ledger stays shut."
--
-- A winner is decided by distance from a book nobody opens. There is no
-- procedure that resolves that, which is why the win condition sat on
-- docs/needs-a-human.md as an open question for weeks and kept coming back:
-- it was never a question anybody could answer. AN UNANSWERABLE ESCALATION IS
-- USUALLY A DEFECT IN THE THING, NOT A DECISION SOMEBODY OWES.
--
-- The house had authored a great deal around it — the ledger as a real object
-- on the table, the show of hands, the rule against voting for your own, the
-- guest floor, the timings, every runbook step — and none of that could repair
-- the centre. Good work built on an incoherent premise is still incoherent,
-- and the volume of it is what made the row look finished.
--
-- ── WHY refused_row AND NOT A BARE DELETE ────────────────────────────
--
-- The game is gone from src/lib/games.ts, so seed:games will not recreate it
-- from the module. But db/057 exists because a delete alone has been undone by
-- a seeder before, and a refusal that depends on nobody re-adding a constant
-- is not a refusal. The slug is recorded; the trigger on `game` skips any
-- insert matching it; the row is deleted.
--
-- To un-refuse: delete the refused_row row. The game returns as an ordinary
-- draft if a module ever declares it again.
--
-- ── WHAT THIS COSTS, SAID OUT LOUD ───────────────────────────────────
--
-- CATSKILLS NOW HAS NO GAME OF ITS OWN. It keeps the seven shared house games,
-- so a carousel of three still fills and no member sees a gap. But the room
-- has nothing only it can claim, which is rule 30's shape — identity lives in
-- what only you can claim — and it sits against her ruling of the same week
-- that every room should have a game.
--
-- Recorded rather than repaired: writing Catskills a replacement game here
-- would be a machine authoring a room's identity, which is hers (rule 13). The
-- gap is real, it is named, and it is an authoring absence rather than a
-- property of the room (rule 29).

-- ── THE SECOND REFUSAL, SAME SESSION ─────────────────────────────────
--
-- Founder: "also delete the song that gets you up - nobody cares."
--
-- HAVANA_THE_SONG_THAT_GETS_YOU_UP. Her own rule was ambiguous and had been
-- on the escalation list for it — "Everybody names the song that gets them
-- up. Nobody names their own" reads two ways, and the house had resolved it
-- toward naming a song FOR somebody else. The ruling makes the question moot.
--
-- IT LEAVES HAVANA WITH NO GAME OF ITS OWN, exactly as the swim test leaves
-- Catskills. Both rooms keep the seven shared house games, so no carousel is
-- short and no member sees a gap — but neither room now has a game only it
-- can claim. Catskills is getting charades by her ruling; Havana is not
-- spoken for.
--
-- AND IT ORPHANS A BANK ITEM. "the song somebody named for you" is a Havana
-- take-home whose whole existence is the slip this game produces — a song
-- chosen for you, in the chooser's handwriting. With the game gone the object
-- has nothing to come from. It is left in place and NOT deleted here: it is
-- pending her review already, and one ruling should not silently take a
-- second row with it. Named so the next reader does not find an orphan and
-- wonder. Rule 23's shape: count what points at a row before removing it.

insert into refused_row (entity_table, slug, refused_by, name_at_refusal, reason)
values (
  'game',
  'catskills-the-swim-test',
  'founder',
  'The Swim Test',
  'Founder ruling 2026-09-06: the win condition is unresolvable — furthest '
  'from a ledger that stays shut. Removed from src/lib/games.ts in the same '
  'change. Catskills is left with no native game; see this migration.'
)
on conflict (entity_table, slug) do nothing;

-- ── THE THIRD ─────────────────────────────────────────────────────────
--
-- Founder: "no clue what Correct The Year is." Then: "delete that game."
--
-- OAXACA_CORRECT_THE_YEAR. Unlike the swim test it was coherent — a story told
-- the long way, interrupted only to argue about which year it happened in —
-- but it needs a table with shared history, since half the room has to be able
-- to argue. That is a narrow room inside a narrow occasion, and the founder
-- did not recognise it as hers on sight.
--
-- Oaxaca keeps the shared house games. Its own game is gone.

insert into refused_row (entity_table, slug, refused_by, name_at_refusal, reason)
values (
  'game',
  'oaxaca-correct-the-year',
  'founder',
  'Correct The Year',
  'Founder ruling 2026-09-06: "no clue what Correct The Year is… delete that '
  'game." Coherent but narrow — it needs a table with shared history. Removed '
  'from src/lib/games.ts in the same change.'
)
on conflict (entity_table, slug) do nothing;

insert into refused_row (entity_table, slug, refused_by, name_at_refusal, reason)
values (
  'game',
  'havana-the-song-that-gets-you-up',
  'founder',
  'The Song That Gets You Up',
  'Founder ruling 2026-09-06: "nobody cares." Removed from src/lib/games.ts '
  'in the same change. Havana is left with no native game, and the bank item '
  '"the song somebody named for you" is orphaned — see this migration.'
)
on conflict (entity_table, slug) do nothing;

delete from game where slug in
  ('catskills-the-swim-test',
   'havana-the-song-that-gets-you-up',
   'oaxaca-correct-the-year');

do $$
declare n_left integer;
begin
  select count(*) into n_left from game where slug in
    ('catskills-the-swim-test',
     'havana-the-song-that-gets-you-up',
     'oaxaca-correct-the-year');
  if n_left <> 0 then
    raise exception '% refused game(s) survived their own deletion', n_left;
  end if;
  raise notice '[065] three games deleted and refused; catskills, havana and oaxaca have no native game';
end $$;
