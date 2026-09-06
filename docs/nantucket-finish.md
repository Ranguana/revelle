# NANTUCKET, 1972 — what it has, what it is owed, what only she can finish

Counted 2026-09-06, pool by pool, from the `ingredient_pool` registry rather
than from a hand-written list of pools (rule 19). **The database is unreachable
from a laptop (rule 9), so every number below is read from the committed
documents and modules the seeders read** — that is the label, per rule 31, and
it is not a production readback.

**Nantucket is not thin. It is one of the better-finished rooms in the
catalogue**, and the two items I was sent to fix are real but are not the
inventory. What follows is the inventory.

---

## The registry, and what a room can hold

`src/lib/pools/registry.ts` (generated; `npm run check:pools` says it is
current) declares **nine** entities. Two are not world-scoped ingredients —
`taste_cohort` and `world` itself — and one, `menu`, was retired by `db/045`.
**So a room can hold six pools**, and this is Nantucket in all six.

| pool | Nantucket has | verdict |
|---|---|---|
| `dish` | **85** — 30 appetizers, 31 mains, 24 desserts | **far above floor** |
| `drink` | **6**, in two programmes (§4 porch night, §5 rainy lunch) | **2 owed by a constraint** |
| `bank_item` | **14** — 4 strong, 8 fair, 2 thin, 5 dual-claim | complete as argued |
| `game` | **1** native (`nantucket-what-the-weather-will-do`) | at the catalogue median |
| `product` | **0** | catalogue-wide, not Nantucket |
| `tracklist` | **0** | catalogue-wide, not Nantucket |

---

## What it is owed BY A RULE

These are not taste. Each is a constraint or a standing ruling.

### 1 · Two drinks cannot go live — `drink_live_has_its_mirror`

`db/060` made `mocktails` nullable where **NULL means owed**, and the
constraint refuses a live drink without its mirror. Two of Nantucket's six say
so in the seeded document itself, in the mirror position:

| # | drink | mirror |
|---|---|---|
| 4.2 | Cold beer in a cooler | **Mirror owed** |
| 5.2 | Whiskey with one ice cube | **Mirror owed** |

The other four have theirs — Cape Codders/cranberry-lime soda, dark rum and
ginger beer/ginger beer with lime, hot buttered rum/hot chocolate, mulled cider
with rum/mulled cider straight.

**This needs her, not me.** A mirror is "same glass, same components, arriving
at the same time" and both of these are hard cases on purpose: a cooler of cold
beer and a whiskey with one ice cube are drinks whose whole character is that
they are unmixed. Writing a mirror for either is authoring in the room's voice,
which rule 3 puts on her side. **I have not drafted one.** What I can say is
what the constraint will accept and what these two are not: a soft drink in a
different glass is not a mirror, and neither is an absence.

### 2 · A season question that turned out to be already answered

I was told the whiskey carries **SEASON-SHOULDER** and an open **MIX?**. Those
flags are real and they are in `docs/drink-explosion.md` — the working
document. **They are already resolved in `docs/drinks.md`, which is the file the
seeder actually reads:** all three of §5 read `Shoulder season and fall` and
`Half made`.

Rule 24, in the direction that saves work rather than the direction that finds
bugs: **the count said the flags were stale.** Two documents, one planning and
one seeded, and the planning one lagged. Nothing is owed here.

*(The same check found a third season-shoulder the brief did not name — 5.1 and
5.3 carry it too, not only 5.2 — and all three are equally resolved in the
seeded file.)*

### 3 · No signature gesture — and this is the whole catalogue, not this room

Rule 27: **every room has one signature gesture.** `db/031` gives `world` a
`gesture` and a `gesture_note` column and argues for them — "an invariant in a
pool of variables eventually gets left out of a package." `scripts/seed-bank.mjs`
reads them from a clause marked `GESTURE:` or `(GESTURE)` in a bank document,
and documents the consequence: "Westhampton's only host act is its gesture, and
Westhampton therefore contributes zero `host_act` rows."

**Counted across all three bank documents: the token `GESTURE:` appears zero
times.** The word "gesture" appears twelve times, every one of them in prose
about the concept. So the parser that routes gestures matches nothing, and
`world.gesture` is NULL for all nineteen rooms.

That is rule 24's shape exactly — a parser whose author described its behaviour
correctly and whose input never contained the token — and it is **not a
Nantucket finding**. It is reported here because "finish Nantucket" surfaced it
and because rule 20 says a finding does not stay in the file where it was found.
CLAUDE.md rule 27 names five gestures in prose (Tahiti's conch, Amalfi's plate,
Aspen's blankets, Oaxaca's stirring, Acapulco's relaid table); **none of the
five is in a form any seeder can read.**

### 4 · Two matrix cells that only she can decide — the real blocker

`data/destination-matrix.json`, `founderPending`:

> `nantucket.ending`: FOUNDER DECIDES. `dissolves` is CC's pass-1 reading;
> `clean_stop` was the original.
>
> `nantucket.starts`: FOUNDER DECIDES. `evening` is CC's pass-1 reading;
> `afternoon` was the original.

**These are the two FED columns.** Of nine facets only `ending` and `starts`
are supplied by a host's answer, so Nantucket's two unsettled cells are the
only two cells in its row that reach a member at all. Every distance touching
them is soft, and the audit says so on every run.

They also hold up a second decision. `docs/destination-contrasts.md` records
`westhampton / nantucket` as a twin pair that "would qualify on all four
conditions" and is deliberately NOT declared, because it "should be resolved by
deciding those rather than excused by a twin." **Deciding these two cells
settles the twin question too.**

**This is the item where "finish Nantucket" stops and waits.** I have not
touched either cell.

---

## What it is owed by TASTE, not by a rule

- **`bank_item` at 14, against an aspirational twenty.** The bank document
  argues the shortfall rather than apologising for it: four of its six rooms are
  "deliberately austere object worlds", and "twenty objects per room is a
  comfortable target in New York or Las Vegas, where the evening is *staged*. It
  is not comfortable here." No founder floor exists for the bank. **I would not
  pad this**, and rule 30 says a room padded with generics has bought a number
  and sold its identity.
- **One game.** That is the catalogue median: thirteen of sixteen rooms with a
  native game have exactly one; only Westhampton and Catskills have six. Not a
  Nantucket gap.
- **`product` and `tracklist` at zero.** `scripts/seed-occasion.mjs` says it
  plainly: "there is no authored product or tracklist in the repo." Zero for
  every room. Catalogue-wide authoring absence (rule 29), not a Nantucket one.

---

## What is already finished, verified rather than assumed

- **Voice** — written, `authored`, in `src/lib/destinations.ts`.
- **Food identity** — declared `table`, from the premise line *"a dinner
  everybody takes apart with their hands"*. Floor 20; it holds 85.
- **Making-axis coverage** — B/H/M present at all three courses. Nantucket is
  one of eleven rooms with **zero** of the 27 course-by-making gaps in the
  catalogue, all but one of which sit in the six unvoiced rooms.
- **Palette, tones, plate, heading** — all present and passing.

---

## The finish list, in the order it blocks on

1. **Decide `nantucket.ending` and `nantucket.starts`.** Hers. Unblocks the row,
   the two fed columns, and the Westhampton twin question.
2. **Write two mocktail mirrors** — cold beer in a cooler, whiskey with one ice
   cube. Hers; the constraint refuses them live until they exist.
3. **Write the signature gesture** — hers, and it is nineteen rooms rather than
   one. The column, the parser and the rule all exist; the clause does not.
4. Bank, games, product, tracklist: **not owed.** Leave them.

Nothing above has been written in her voice, and nothing has been seeded.
