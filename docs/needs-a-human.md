# What needs a human

Everything below is blocked on a person. Machines can measure, tag and
re-run; they cannot decide whether a room exists or write a voice. Split into
DECISIONS (minutes each) and WRITING (hours each, and only the founder can).

Nothing here is a bug. It is the list of places where the work has been taken
as far as it can go without a judgement.

---

## DECISIONS — a sentence each is enough

### 1. Nantucket `ending` and `starts` — pick a direction
Two cells, one choice. Both were flipped by CC in correction pass 1 and the
founder has not run her own pass. All four directions measured:

| ending / starts | consequence |
|---|---|
| `dissolves` / `evening` (CC's reading) | Nantucket sits at 2 from **Westhampton** |
| `clean_stop` / `evening` | Nantucket sits at 2 from **Big Sur** |
| `clean_stop` / `afternoon` (original) | 1 from Big Sur — the WORST option |
| `dissolves` / `afternoon` | three pairs at 2 — worst by count |

Evidence for CC's reading: "The night ends on the dock, watching nothing happen
on the water"; "Sweaters come out at eight whatever the day did"; hours run
six o'clock, half past eight, after dark. **The original reading is not a safe
fallback — it is the worst of the four.**

### 2. Palm Springs `schedule`, and Amalfi `schedule`
Both provisional and marked `founderPending`. Amalfi was set to `unplanned`
from "none" in the founder's row; confirm that is what was meant under the
three-level scheme (posted · anchored · unplanned).

### 3. OAXACA 1954 — admit, move, or block?
Fails **New Orleans at 2** (`ending`, `starts`) and **Aspen at 2** (`schedule`,
`ending`). The stated differentiator — dissolves-afternoon against
second-wind-night — is exactly two facets, one short of the gate. No cell was
bent. Options: find a third differentiator, move the row, or block it with a
proof as Rio was.

### 4. ACAPULCO 1959 — admit, move, or block?
Fails **St. Moritz at 2** (`schedule`, `spectacle`). It has Rio's problem: the
until-morning, dressed, crowd, bought corner is full. Clears Vegas at 3 and
Havana at 4.

### 5. Does PORTOFINO exist?
Three instruments have flagged it. It fails Côte d'Azur at 1 on `size` alone,
and under the headcount redefinition **Portofino has no headcount evidence at
all** — so the pair is a weakly-evidenced room against an unevidenced one. This
is the Cap Ferrat question and only the founder can answer it.

### 6. `size` — repair or replace
It carries 12 dependent pairs, the heaviest load in the set, on the least sound
column. Redefining it as pure headcount clarified the defect without fixing it.

### 7. The cuisine question — adopt the reveal design?
Proposed: cuisine is a bad ranker (11 levels for 16 rooms, 7 reaching exactly
one room — it memorises the answer key) but the best EXPLAINER. So: the reveal
states each finalist's cuisine and the facets they differ on, and a cuisine
question exists only as a COVERAGE CONSTRAINT — if she names one, guarantee a
room of that cuisine appears among the two or three — with "not sure" as the
default. Never ranks, never reorders.

### 8. Dietary exclusion — a separate question, and a real gap
"Nothing I don't eat" is a constraint, not a preference. 1,037 dishes with no
dietary handling.

### 9. `db/027` — retire Cap Ferrat's ghost row
The seeders only insert and update. Production still has a published
`cap-ferrat` world with its old menus and drinks, and `loadDestinations` reads
published rows rather than the code. Low urgency with no subscribers.

### 10. Product images — hotlink or not
`product.image_url` exists in the schema, and all 80 sourced rows carry
supplier CDN URLs. Displaying them rather than linking out is a copyright,
trade-mark and ToS question. No image was ever downloaded.

---

## WRITING — only the founder

### A. Six missing reply conventions
`audience` failed re-derivation because six destinations have no reply
convention in their lexicon: **Las Vegas, Catskills, Portofino, Dolomites,
Big Sur, Tahiti**. Every other destination has one — `regrets only`, `the door
is open`, `come up`, `come when you come`, `come at nine`, `kindly reply` — and
they are the cleanest permeability evidence in the catalogue, with no room fact
in them. These six are gaps in those voice documents.

### B. Four voices, plus two if admitted
Amalfi 1953, Palm Springs 1965, St. Moritz 1984, Aspen 1994 — rows locked, no
prose. Oaxaca 1954 and Acapulco 1959 have briefs but fail the gate.

Each must pass THROWN-NESS, which no audit can check: a premise must read as a
party somebody is throwing, not a scene that occurs.

### C. Amalfi's dish pool — about 50 dishes, inheriting nothing
Campanian, and it must not take Portofino's Ligurian section. Italian food must
not flow freely between Italian rooms or the plate erases the distinction the
matrix is defending.

### D. The remaining correction cells
Pass 1 covered eight. The rest are a confirmation sweep — no failing pair
depends on them — but the matrix is still one person's reading of twelve voice
documents.

### E. A cuisine label per destination
The labels used in analysis were derived by reading dish sections. Nothing in
the schema records them, and they are not authored.

### F. Portofino re-read against its own menus and drinks
Its comment has always said the voice should be read again once a menu and a
drinks programme existed. They now do. The debt is overdue rather than
hypothetical.

### G. The Aspen and Palm Springs prose that exists outside this repo
Referenced in conversation, not present in `src/lib/destinations.ts` or
`docs/`. It needs bringing under the same version control as everything else.

### 11. THE HUMOUR-MODE ENUM IS TOO SMALL, and it has now broken something

Deferred as a schema question, and no longer only stylistic. Five mode names
across the four new rooms have no enum value:

| room | written as | enum home |
|---|---|---|
| Acapulco | *delighted* | none — coerced to `warm` |
| Oaxaca | *fond* | none — coerced to `warm` |
| Oaxaca | *familial imperative* | none — coerced to `second_person` |
| Aspen | *self-deprecating bravado* | none — coerced to `warm` |
| Aspen | *first names, immediately* | none — coerced to `second_person` |

**The consequence is concrete: ASPEN and OAXACA now hold the identical stated
triple `plain/second_person/warm` — and they are DECLARED TWINS.**
`voice.test.ts` asserts every triple is distinct, so they cannot both be seeded
as written. Their TONE affinity is fine (0.288, comfortably inside the strict
cap); it is the stated axes that collapse, because `warm` is being asked to mean
delighted, fond, and self-deprecating bravado at once.

`humour = warm` would reach five of sixteen rooms. Either the enum grows, or two
of these rooms are re-stated onto existing values. Not solved here.

### 12. TILE ART DEBT — twelve marks to cut

Every accepted new tone needs a mark drawn and fitted through
`scripts/build-tone-marks.mjs`, to the same 46-unit optical box at 1.5-unit
visual weight as the existing 51. Twelve are coined and marked `draft: true`:

`feeds_you_first` · `eat_before_you_speak` · `the_same_stories` ·
`marvels_out_loud` · `shows_you_things` · `all_turn_to_watch` ·
`never_impressed` · `fluent_in_everyone` · `closes_the_bar` ·
`finishes_your_sentences` · `bigger_every_telling` · `up_early_anyway`

A founder or commission task. Note the silent-failure risk already recorded:
nothing asserts that the tone codes and the SVG filenames match, so a mark that
is never cut simply renders nothing.

### 13. The copy of twelve rooms — nineteen verdicts, at `/desk/reconcile`
`/api/health` reports `copyAgrees: false` and names twelve rooms whose
`world.tagline` or `world.description` differs from
`src/lib/destinations.ts` — seven taglines and twelve premises. The database
is what a member reads, the file is what seeds a fresh database, and
`scripts/seed-destinations.mjs` never overwrites a row that exists, so
nothing reconciles them without a person.

The screen puts three facts on each field and no opinion: both texts side by
side; whether a human ever saved that room at the desk (a
`destination.updated` row in `staff_action` — no script can write one) or it
was only ever seeded; and the desk edit's date beside the date that
registry sentence was last written, so a choice made against text that has
since been replaced is visible as one. Rows are sorted into those two piles.

Three buttons per field — the registry wins, the database wins, or a merge
you type. Nothing is pre-selected and nothing is applied until a button is
pressed. Each verdict writes `copy_reconciliation` (db/055) and a
`staff_action`, so the next run of the detector compares against a settled
baseline: `copyUnsettled` in `/api/health` is the number that reaches zero,
and `copyAgrees` will stay false wherever the database deliberately won.

Re-deciding a field writes another row and keeps the first (rule 14). The
rows do not move when one is decided (rule 18).

## 2026-08-26 — THE MENU POOL HAS NO SLOT. **RULED: retired. db/045.**

39 active menus, on the desk, in the registry, and **no package can deliver
one**. `db/022-the-table-composed.sql` replaced the set menu with a composed
table — `the_appetizer`, `the_main`, `the_dessert`, all drawing from `dish` —
said so at line 490 ("the engine no longer has a slot to put a menu in"), and
set `typical_draw = 0` at line 533. `occasion_slot` carries zero rows for
`menu`, confirmed against a seeded database.

The immediate consequence is already fixed: `/desk/coverage` counted "something
to serve" as menu coverage, so a room could read as covered while unable to
fill `the_dessert`. Serve-coverage now measures the three dish slots. That was
the board claiming certainty it did not have — the week's named defect, on the
surface built to prevent it.

What remained was a PRODUCT decision, and it belonged to the founder. The three
options as they stood, kept whole because rule 14 keeps the argument a decision
was made against:

  1. RETIRE the menus, via db/028's Cap Ferrat mechanism — retired with lineage
     and a reason, never deleted (rule 17).
  2. REPURPOSE them as authoring templates that seed dish selection, so the
     composed table inherits the thinking that built the set menus.
  3. RESTORE a slot for signature occasions, as a DECLARED hybrid — set menu
     where a set menu is the point, composed everywhere else.

**THE RULING — 2026-08-26: option 1.** All thirty-nine are retired by
`db/045-the-menu-pool-retired.sql`. 2 and 3 were considered and rejected, and
neither is closed by this: retirement does not spend either option, it stops the
pool pretending to be stock while they are undecided.

WHAT WAS BUILT, in the terms the ruling was given in:

  · **Retired, not deleted.** Not one row of `menu`, `menu_world`, `menu_facet`
    or `revelle_menu` is gone. Every menu keeps its text, season, dishes line,
    destinations, facets and a reason. `slot_kind.the_menu`, the pool's
    registration, the render path and `scripts/seed-menus.mjs` all stay.
    Restoring the set menu is un-retiring the rows, clearing one column on the
    registry, and re-inserting db/012's nine `occasion_slot` rows — which are
    quoted verbatim in that file. **The hedge survives.**
  · **Rule 17, at the grain each fact is true.** `product_status` has no
    'retired' and cannot grow one inside a single migration (Postgres refuses to
    USE a new enum value in the transaction that added it — checked, not
    assumed), so the rows carry `discontinued` plus `menu.retirement_note`, with
    a CHECK that refuses the status without the words. The LINEAGE is
    pool-level, because that is where it is true: no menu was folded into
    another menu, the `menu` POOL was superseded by the `dish` POOL. So
    `ingredient_pool` gained `retired_at`, `superseded_by` and
    `retirement_note`, with db/042's four constraints.
  · **AND IT WOULD HAVE UNDONE ITSELF.** A migration can only retire the rows
    that exist when it runs, and `preDeployCommand` runs `migrate` before
    `seed:menus` — so on every fresh build db/045 retired nothing and the seeder
    created all thirty-nine, live, seconds later. Reproduced on a scratch
    cluster before it was fixed. This is rule 22 exactly, and it is why the
    decision lives on the registry: `seed-menus` now ASKS `ingredient_pool` and
    creates a row into a retired pool as `discontinued`, carrying the pool's own
    sentence. Nothing hard-codes that menus are retired.

Nothing is open here any more. What is worth a person's attention next is
whether option 2 is ever taken — the menus are the only place the house has
written down what a whole EVENING of food is, and composition does not know it.

## 2026-08-27 — THE VENUE GATE IS INERT IN PRODUCTION. **BUILT: db/047.** What is left is below it.

**The section that follows is kept exactly as it was written** (rule 14) —
it is the brief the work was done against. What it asked for now exists:

  · `src/lib/catalogue/tagging.ts` — `tagCatalogue()`, the post-seed step. It
    writes the venue requirement tags db/020 and db/033 could not, sets
    `world.venue_requirement` (a **third** inert derivation of the same shape,
    found while moving the other two — db/033's `update world … where slug in
    ('tahiti', 'palm-springs-1965')` also ran against an empty table on every
    build), and derives `drink.season_strict`.
  · One exported function, two callers: `render.yaml`'s `preDeployCommand` and
    `/desk/stocked`'s sync button, both through
    `scripts/tag-catalogue.mjs`, both LAST in the chain.
  · The two-part guard: `npm run check:gates` and
    `src/lib/catalogue/gates.db.test.ts`, each half broken on purpose in a
    rolled-back transaction so that it has been watched going red.

**Measured on a full scratch build.** Before: `ingredient_requirement` 0 rows,
`world.venue_requirement` 0, `drink.season_strict` true on 0 of 25,
`drink_occasion` 0. After: 35 requirement rows, 2 destinations declaring one,
14 of 25 drinks season-gated, `drink_occasion` still 0 **and that is a
decision** — see FOUR below.

Four things came out of it that only a person can settle. They are the reason
this heading is not simply closed.

### ONE. The season gate now takes eleven room × season pairs to ZERO.

This is the founder's own "filters nothing becomes filters to zero", arriving
on the season axis instead of the occasion axis nobody had watched it on. The
gate is right and the ruling stands — a sheet that says Summer at a February
party is what the member reads — but the consequence is a room with **no drink
at all**, and it is worse than the thing it fixes in three of the eleven:

| room | seasons with no drink |
|---|---|
| **PORTOFINO, 1961** | autumn, spring, winter |
| **DOLOMITES, 1956** | autumn, spring, summer, high summer |
| CATSKILLS, 1963 | spring, winter |
| WESTHAMPTON, 1976 | spring, winter |

Portofino is the room the ruling named by name, and it is now the room the
ruling empties: both its programmes say Summer, so a November Portofino party
has nothing to pour. **Every one of these is an authoring brief, not a bug** —
each needs one off-season programme written for that room, exactly as the
existing off-season entries do it (drink 10, "A quiet off-season dinner",
October, Côte d'Azur, is the model). Until then the engine reports a catalogue
gap, loudly, which is the correct failure and still a failure.

The decision, if writing four programmes is not what happens next: does
`season_strict` ship on for drinks now, or does it wait behind those four?
`npm run check:gates` prints the list on any database.

### TWO. The venue gate is honest and nearly weightless, because the food left.

35 requirement rows are written and **three refusals** exist in the entire
catalogue: drink 21, "A fire-lit dinner", refused in a city apartment, a hotel
and a restaurant. Thirty-four of the thirty-five rows are on MENUS, and db/045
retired the menu pool — so they sit on rows the engine cannot draw, and prune
nothing. The gate is no longer inert; it is nearly empty, which is a different
thing and needs saying out loud.

It takes one room to zero: **BIG SUR in a city apartment, a hotel or a
restaurant has no drink**, because its only programme is the fire-lit one.

**The judgement, and it is not a script's** (rule 8): db/020's food predicates
were written against `menu.dishes`, and db/022 moved the food to `dish`, and
db/033 admitted `dish` to the requirement CHECK saying "Big Sur's s'mores is
the proof case for dish and will not be the last". Moving the predicate with
the food would tag, measured:

  · **48 active dishes** on `ilike '%grilled%'` — and the list includes
    *Grilled bread with olive oil* and *Grilled bread rubbed with tomato*,
    which are griddle-pan food. db/020's own rule is "leave it untagged rather
    than guess", and 48 dishes leaving every apartment on a substring is a
    guess.
  · 3 on flamed / bananas foster / cherries jubilee — obvious, and three rows.
  · 1 s'mores, which is the case db/033 named.
  · 541 on `making = 'actually_made'`, if the full-kitchen rule travelled too.
    That one would remove more than half the food pool from a beach.

Nothing was tagged. db/039's precedent is the reason: the founder cut two
requirements rather than let a sweep guess which dishes "will not survive a
deposit", and this is the same shape. **What is needed is a ruling on the four
groups above, not a pass.**

### TWO(b). A curator who CLEARS a derived venue tag gets it back next sync.

`src/lib/catalogue/tagging.ts` re-asserts the derived tags on every deploy and
every sync with `on conflict do nothing` — db/020's own contract, and the
reason a re-run is free. It cannot tell a tag nobody has looked at from a tag
`clearRequirement()` at `/desk` deliberately removed. So clearing one of the
**derived** tags holds until the next sync and no longer. (A requirement a
curator DECLARES is safe: nothing else writes it.)

Same shape as `seed:bank` section 10's `Also at:` guard, and the same answer:
**it is a screen decision, not a patch.** Either the derivation records that a
human overruled it — a provenance column, so a cleared derived tag stays
cleared — or the form stops offering to clear the derived ones and says why.
Stated at the point of use in `src/lib/desk/requirements.ts` meanwhile.

The same is true, once, of `world.venue_requirement` on Tahiti and Palm
Springs.

### THREE. `ingredient_supplies` is the next one of these, untouched.

db/044 creates it empty and names tagging as seeder work. It is derived over
content by nothing, so it is where `ingredient_requirement` was. The post-seed
step is now the place it goes; what it should CONTAIN is authoring.

### FOUR. `drink_occasion` holds zero rows, and the parser was refused.

Asked before writing one, and the answer was clearer than "some are vibes":
**not one of the twenty-five programme names names an occasion.** They are all
on a different axis, and the house had already ruled on exactly these lines.
db/023, about the "what it's for" lines across docs/menus.md and docs/drinks.md:

> deliberately NOT a value of `occasion_type`: an occasion is why she is having
> people over — a birthday, an anniversary — and a meal shape is what the table
> is. A birthday can be a brunch and an anniversary can be a late supper, and
> collapsing the two would make one of those unsayable.

A drink record is five bullets — cocktails · mocktail mirrors · what it's for ·
season · how much mixing — and there is no occasion among them. So:

| | |
|---|---|
| genuinely occasion SCOPES | **0 of 25** |
| meal-shape lines (db/023's axis) | **25 of 25** |
| lines a word-matching parser would have scoped anyway | **20 of 25** |

The twenty are the finding, counted rather than assumed, because a parser that
declines everything is indistinguishable from a parser that is broken.
Nineteen contain "dinner" or "supper"; two of those nineteen contain the
literal words **"dinner party"**
("A formal dinner party", "A long dinner party") against an `occasion_type`
member spelled `dinner_party`; one is "A boat or beach day" against `getaway`.
Every one of those would have been a claim the author did not make — the
classifier-hyphen incident with a thesaurus. The sharper calibration case is
next door in docs/menus.md: **"A steakhouse birthday dinner"**, which a word
parser scopes to a birthday and which is a long dinner with a candle in it.

Nothing was written. All 25 rows are read on every tagging run, none is
claimed, and one to-do is filed on the desk. **An unclaimed drink behaves
exactly as it did before — room-scoped, occasion-blind — so turning the
machinery on removed nothing a member could have had.**

**THE DECISION.** Two ways to make the drinks answer this, and they are not the
same question:

  1. **docs/drinks.md grows an occasion field.** Then the parser is real and the
     enumeration below becomes live. Before that happens, read the next
     paragraph.
  2. **The drinks gain a meal-shape axis of their own** — a `drink_meal` table
     beside `dish_meal`, which is the axis the twenty-five lines ACTUALLY
     speak. This is probably the true answer: "a programme named Brunch is
     equally eligible at a dinner" is a meal-shape complaint, and today the
     drink pool has no meal axis at all (`POOLS.drink.meals` is null in
     src/lib/selection/catalogue.ts), so `mealAgrees` never fires for a drink.

### AND THE LIST THE FOUNDER ASKED FOR BEFORE ANY OF THAT SHIPS

Every room × occasion pair with **zero eligible drinks**, on a full scratch
build, `npm run check:gates`. 18 rooms × 9 occasions = 162 pairs; **54 at
zero**, and all 54 are one fact:

| room | occasions at zero | why |
|---|---|---|
| ACAPULCO, 1959 | all 9 | no drink is written for it |
| AMALFI COAST, 1953 | all 9 | no drink is written for it |
| ASPEN, 1994 | all 9 | no drink is written for it |
| OAXACA, 1954 | all 9 | no drink is written for it |
| PALM SPRINGS, 1965 | all 9 | no drink is written for it |
| ST. MORITZ, 1984 | all 9 | no drink is written for it |

The twelve authored rooms are covered at all nine occasions, because nothing
is occasion-claimed. **The six are the six draft stubs `seed:bank` creates**,
and every one of them is already on the WRITING list above (B: four voices plus
two if admitted). This is that list arriving from the other direction: a room
with a voice and no bar is a room that cannot be delivered.

And the reason this list is the point rather than a footnote — the eleven
rooms holding three drinks or fewer:

| drinks held | rooms |
|---|---|
| 1 | Big Sur · Dolomites · Tahiti |
| 2 | Catskills · Havana · Las Vegas · Nantucket · New Orleans · Portofino |
| 3 | New York · Westhampton |

**One occasion claim written onto Big Sur's single programme takes Big Sur to
zero at eight occasions in one edit.** That is why the claims are not being
minted from text nobody wrote.

---

## 2026-08-27 — THE VENUE GATE IS INERT IN PRODUCTION. First item, ahead of Westhampton.

`ingredient_requirement` is EMPTY on any database built from the committed
chain, so `venueEligibility()` prunes nothing. Open-flame, full-kitchen and
outdoor requirements constrain no package in production today.

The cause is authority placement, and it is CLAUDE.md rule 22:
`preDeployCommand` runs `npm run migrate` BEFORE every seeder, and db/020 and
db/033 tag by matching authored text against tables that are empty at migration
time. The migration looked right, ran clean, raised nothing, and did nothing —
on every build, forever.

THE FIX, decided in principle and needing only execution:

  · Tagging moves OUT of the migration chain into a POST-SEED step. Migrations
    own schema; seeders own content; computation over content runs after
    content exists.
  · It carries a two-part guard, because the two failures read identically from
    outside: a build test that FAILS IF `ingredient_requirement` IS EMPTY after
    a full build, and a detector for A GATE THAT PRUNES ZERO ROWS across the
    whole catalogue. The first catches the tagger never running; the second
    catches it running and matching nothing.
  · The same question must then be asked of `ingredient_supplies` (db/044
    creates it empty and names tagging as seeder work) and of anything else
    derived by text-matching in a migration.

Ahead of Westhampton's missing table setting: a room that low-confidences a
dinner is one room, and an inert venue gate is every package.

### Its sibling, fixed in the same motion: `season_strict` IS NEVER WRITTEN

`seed-drinks.mjs` never writes `season_strict`; the column defaults false. So no
drink is season-gated, and a February party is offered the summer bar with
"Summer" printed on the sheet — in Portofino, whose premise is explicitly
off-season, and whose two programmes both say Summer.

THIS IS THE SAME DEFECT AS THE VENUE GATE, not a second one. Both are gates
that cannot fire: `ingredient_requirement` is empty because a migration
computed over content before content existed (rule 22), and `season_strict` is
false because a seeder never writes it. Empty-at-migration-time and
never-written-by-the-seeder produce the identical outcome — a filter that
matches everything and therefore filters nothing.

So they are fixed together:

  · the post-seed step that populates venue tags ALSO writes `season_strict`;
  · the "gate prunes zero rows across the whole catalogue" detector watches
    BOTH, because both fail the same silent way.

`season_strict` outranks the venue gate on triage: an inert venue gate is
curator-facing until a package is impossible to stage, while a sheet that says
Summer at a February party IS WHAT THE MEMBER READS. Member-facing beats
curator-facing.

---

## 2026-08-26 — THE BANK ITEM FORM HAS ONE DESTINATION SELECT, AND A SHARED ROW NOW HAS TWO

`docs/atmosphere-idea-bank-v1.md` gained an `Also at:` line (FORMAT NOTES in
that file), which `seed:bank` parses into a second `native = true` row in
`bank_item_world` — the only kind of row that makes an item available in a
second room:

> **affinity re-weights scoring for already-eligible candidates; it never
> confers eligibility — sharing requires a second native row.**

`src/app/desk/(signed-in)/bank/actions.ts` was written when a bank item had
exactly one room (`bank_item.world_id`, before db/043). Its save still says so:

```sql
delete from bank_item_world where bank_item_id = $1 and native and world_id <> $2
```

So **saving any edit to a shared item at the desk silently destroys its second
claim.** The form is not wrong about its own intent — a room deselected there
must stop being claimed, which is CLAUDE.md rule 16 — it simply cannot express
a set. The next `seed:bank` re-asserts the `Also at:` claim, so the loss is
temporary in the file's direction and permanent in hers: a curator who wanted
to drop one of two rooms cannot, and one who wanted neither gets one back.

**What it needs is a person's call, not a patch:** does the item form grow a
multi-room selection (and with it the question of which room is "home" for the
slug), or does the second claim become read-only at the desk and editable only
in the document? Either answer is a screen decision.

Until then: the seeder reports every second claim it writes at the end of every
run, and `scripts/seed-bank.mjs` section 10 carries the same warning where a
reader of the write path will meet it. **The day this screen is fixed, section
10's `Also at:` write guard must be revisited** — it currently re-asserts a
second claim whenever the pair has no row, on the argument that the desk has no
gesture that means "drop one of two rooms". A multi-room editor is that
gesture, and the guard would then be overriding her.
