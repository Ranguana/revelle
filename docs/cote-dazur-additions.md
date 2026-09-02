# CÔTE D'AZUR, 1962 — four founder items, written for paste

**Status: written, not landed.** Nothing here has been pasted into
`docs/atmosphere-idea-bank-v1.md` or `docs/dishes.md`; both were being edited by
other agents when this was authored. Everything below is paste-ready verbatim
and says exactly where it goes.

**Source, verbatim, 2026-08-27 — the founder's four:**

> 1) glass bottles w water at each place setting w rosemary and lemons/oranges
> 2) striped tableclothes (yellow, orange, or red)
> 3) vintage icecream and cones
> 4) striped pool floats for pool party

And her ruling on how they were to be handled:

> *"the stripes are diff colors and they fit. the tablescape for cote dazur
> cannot be the same!!!!!!!!! nothing can be the same, will need many diff
> tablescapes for the pool. why isnt this being considered seriously"*

All four are written. The separation from the neighbouring rooms is inside the
words of each clause and not in a permission slip, which is what she asked for.

---

## 1 · WHAT GOES WHERE

| her line | lands as | slot it will be classified into |
|---|---|---|
| glass bottles at each place | `bank_item` `good`, one clause | `the_table_set` |
| striped tablecloths | `bank_item` `good`, one clause | `the_table_set` |
| vintage ice cream and cones | **splits** — object to the bank, edible to the dish pool | `the_atmosphere` + one dish line |
| striped pool floats | `bank_item` `good`, one clause | `the_atmosphere` |

The ice cream split follows this document's own `ROUTE TO DISH POOL:`
convention and routing rule 1 — anything edible leaves the bank. The cones, the
tubs, the tin and the scoop are objects and stay; the ice cream itself is a
dessert and goes to the pool.

---

## 2 · THE BANK CLAUSES — paste verbatim

These go into `docs/atmosphere-idea-bank-v1.md` under `## CÔTE D'AZUR, 1962`
as a **THIRD `GOODS:` block**, placed after the existing second `GOODS:` block
and before the `HOST ACTS:` line.

A third block is not a new mechanism: WESTHAMPTON, 1976 already carries one and
`scripts/seed-bank.mjs` iterates `room.blocks` without any count guard
(`seed-bank.mjs:2108`), so the parse is unaffected. A third block is used here
rather than an append to either existing block because the provenance header
divides this document by AUTHORSHIP, and these four are a third authorship:
neither the v1 brainstorm above the second `GOODS:` line nor the machine-drafted
take-home proposals below it.

### 2a · The header paragraph — paste immediately above the block

```
FOURTH PASS, 2026-08-27: FOUR ITEMS THAT ARE HERS, AND ONE ROOM CARRIES THEM.
CÔTE D'AZUR, 1962 carries a THIRD `GOODS:` block on the Westhampton precedent.
Its four clauses are the founder's own, given in four lines on 2026-08-27 —
glass bottles of water at each place setting with rosemary and citrus, striped
tablecloths in yellow, orange or red, vintage ice cream with cones, and striped
pool floats. THE OBJECTS ARE HERS AND THE SENTENCES ARE AN AGENT'S: she named
each thing and the staging around it is authored against her premise, her voice
record and the room's existing bench, item by item in `docs/cote-dazur-additions.md`.
They carry NO `FOUNDER-PENDING` marker, deliberately — a pending question is
how a machine proposal asks her permission, and these are the things she asked
for. Under rule 13 they publish on the next deploy. The ice cream itself is not
here: it is edible and went to the dish pool, per routing rule 1, and the
`ROUTE TO DISH POOL:` line below carries it.
```

### 2b · The block — paste verbatim

```
GOODS: the bottle at each place — table set, plain glass, one to a place
setting rather than a carafe or a pitcher shared down the middle, tap water
with a sprig of rosemary and a wheel of lemon or orange standing in the neck,
filled in the morning and still cold at four, and the clay pitchers stay where
they are and do the refilling so nothing at a place ever has to leave it; the
striped tablecloth — table set, a cotton tablecloth in a wide stripe, YELLOW,
ORANGE OR RED and never blue and never navy, the colours this coast puts on an
awning rather than the ones the other coast puts on an umbrella, washed soft
and sun-faded so the stripe is the colour the summer left rather than the
colour it was sold in; the cone stack — plain wafer cones standing point-down
in a tall glass beside two or three tubs sunk in a tin of ice, the scoop the
heavy old lever kind and already in the tub, nobody scooping for anybody, put
out while the table is still sitting so the end of the lunch and the start of
the ice cream are the same hour; the striped floats — two or three flat
mattresses of the canvas-over-rubber kind, striped in the same yellow, orange
and red as the cloth, put on the water before anybody arrives and left there
with mostly nobody on them, so the water is dressed the way the table is and
the swimming is one person at a time in the middle of a lunch that is still
going.
```

**Also amend the provenance header**, whose boundary sentence stops being true
the moment a third block exists in a second room. One sentence, paste after the
existing THIRD PASS paragraph:

```
A FOURTH PASS, 2026-08-27, adds a third `GOODS:` block to CÔTE D'AZUR, 1962 as
well. Westhampton is no longer the only room with three. The boundary the first
paragraph draws — everything above the SECOND `GOODS:` line is v1 as she
blessed it — is unchanged and still exact; a third block is below that line and
is marked with its own authorship note.
```

---

## 3 · THE DISH LINE — paste verbatim, AND THE MANIFEST MOVES WITH IT

Into `docs/dishes.md`, under `## Côte d'Azur` → `### Desserts`:

```
- Ice cream in a cone, eaten on the steps · B (summer)
```

**This cannot be a documents-only edit.** `PER_DESTINATION` in
`scripts/seed-dishes.mjs:244` holds an exact per-room count and fails the run on
any disagreement, and `seed:dishes` is in the pre-deploy chain (rule 12), so the
deploy stops until the manifest moves. The patch, exactly:

```js
-  "Côte d'Azur": 119,
+  "Côte d'Azur": 120,
```

Verified against the file as it stands: `"Côte d'Azur": 119`.

**Two facts about this line before it is pasted, both checked rather than
assumed:**

- **`FOUNDER-PENDING` does not hold a dish back and there is no field on a dish
  line that could carry it.** `scripts/seed-dishes.mjs` binds `LIVE`
  unconditionally, and `db/036` publishes every draft dish with the marker guard
  applied to `bank_item` only. The dish line is member-facing the day it lands.
  (This is `docs/proposals.md`'s Blocker 2, still true.)
- **The name is not generic on purpose.** The dish pool dedupes on
  `(name, COURSE)`, so a plain "Ice cream in a cone" would be a row any room
  could later claim. *On the steps* is this room's own place — the lexicon entry
  reads *"the steps: where the last hour is, once the terrace has emptied"* —
  and no other room has steps. Côte d'Azur's dessert bench already holds honey
  ice cream, lemon sorbet, melon sorbet and meringue glacée; this line is the
  cone and not a second ice cream.

**AGENT'S EXTENSION, marked:** *eaten on the steps* and *(summer)* are mine. She
said "vintage icecream and cones" and nothing about the hour or the season.

---

## 4 · HOW THE FOUR COMPOSE — AND WHAT STOPS THEM COMPOSING TODAY

They are one table, not four candidates. Read across the room's existing bench:

- the **striped tablecloth** is the ground — her colours, faded, the thing every
  other object sits on;
- the **bottle at each place** is what a setting gets that a shared carafe cannot
  give it — a place has its own water, its own rosemary and its own citrus, and
  the room's existing clay pitchers stop being the vessel and become the refill;
- the **cone stack** is the hour where the lunch stops being lunch without
  anybody announcing it, which is this room's whole proposition;
- the **striped floats** repeat the cloth's stripe on the water, so the terrace
  and whatever it looks down at are dressed as one thing.

The citrus, the stripe and the colour run through all four. That is the
tablescape.

### The structural fact that stops it

**`the_table_set` draws `max_count 1`** — verified in
`db/043-atmosphere-reaches-a-package.sql:279`, one row per package on every one
of the nine occasions. `the_light` is also 1. `the_atmosphere` is the only slot
that draws two.

So a package can hold **the cloth OR the bottles, never both**, and Côte d'Azur
has a third row already competing for that seat.

**Counted rather than assumed** (rule 24). I ran `bank_item_default_slot()`'s
phrase lists from `db/044-the-evening-supplies-it.sql:609` over every clause in
Côte d'Azur's two existing `GOODS:` blocks. Twenty-one clauses:

| slot | rows | which |
|---|---|---|
| `the_take_home` | 11 | the entire second block — "take-home" beats every other branch |
| `the_atmosphere` | 9 | pastis kit, crocks, rosé-in-bucket, clay pitchers, lavender, beeswax pillars, faded cloth, belote card, pétanque set |
| `the_table_set` | **1** | **green figs in bowls**, matched on the word `bowl` |

So the room's REQUIRED table-set slot at a dinner party, a birthday, an
anniversary, a holiday and a no-reason party is currently filled by **a bowl of
figs**, and the faded imperfect cloth — an actual cloth — does not reach the
slot at all, because `cloth` is not in the phrase list and `tablecloth` is.
Adding her two rows makes it three rows for one seat.

**Landing this set therefore needs `the_table_set` to draw more than one.** That
is a founder/architecture decision and it is the coordinator's, not mine — it is
recorded here and NOT built. The composed table she describes in every
deliverables sheet ("The table: lemons in terracotta, bougainvillea where it
falls…") has no home in the schema as it stands, and that is why two of her
items keep looking like rivals.

### Two adjacent findings, reported and not fixed

- **`thick white beeswax pillars ON MISMATCHED SAUCERS` does not reach
  `the_light`.** The phrase list holds `candle`, `taper`, `votive`, `lantern`
  and thirteen more, and none of them is `pillar` or `beeswax`. The room's
  candle row is in the general bucket. This is `bank_item_default_slot()`'s
  `'take home'`-with-a-space failure in another spelling, and Côte d'Azur is
  named in the NEW CONTENT CLASSES candle-surface list, so the room is supposed
  to have a light row.
- **`cone` now appears twice at Côte d'Azur** in two unrelated senses — the
  existing take-home *"pressed into a paper cone as people go"* (lavender) and
  the new *cone stack* (wafer). Neither is a game and neither is on any kill
  list, so nothing fails; it is flagged because the next person greping for
  "cone" in this room will find two things.

---

## 5 · PER-ITEM NOTES — what is hers, what is mine, and what routes the slot

### the bottle at each place → `the_table_set`, matched on `place setting`
- **Hers:** glass bottles, water, at each place setting, rosemary, lemons or
  oranges.
- **Mine:** *plain glass*; *one to a place setting rather than a carafe or a
  pitcher shared down the middle*; *tap water*; *a wheel of*; *standing in the
  neck*; *filled in the morning and still cold at four*; the whole final clause
  about the clay pitchers.
- **Why it is not the room's existing water twice.** Côte d'Azur's bench holds
  *"clay pitchers of tap water"* and *"rosé in bucket alternating with water
  bottles down the table"*. Her bottle is a **refinement**, not a third vessel:
  it takes the water bottles out of the down-the-table alternation and stands
  one at each setting. The clay pitchers are demoted to the refill and the
  clause says so in its own words, so the demotion travels with the row and no
  later reader has to reconstruct it. The rosé bucket is untouched.
- **Why it does not read as the neighbouring coast's carafe.** That one is a
  shared vessel in the middle holding nothing but water. This is a per-setting
  vessel holding rosemary and citrus, filled hours early, that never leaves its
  place. The clause states the contrast in its first line — *rather than a
  carafe or a pitcher shared down the middle* — so the difference is in the row
  and not in a note beside it.
- **Rule 25:** a backyard can do this (bottles, tap water, a herb, a lemon); no
  proper noun; the refilling is done by whoever is nearest, and the clause says
  the bottle never leaves the place precisely so that nobody has to carry it.

### the striped tablecloth → `the_table_set`, matched on `tablecloth`
- **Hers:** striped tablecloths; yellow, orange or red.
- **Mine:** *cotton*; *a wide stripe*; *never blue and never navy*; the awning
  line; *washed soft and sun-faded*; the last clause.
- **The colour is written into the row as the room's, in caps, on purpose.** The
  founder has settled that the stripes are different colours and they fit. Her
  colours are stated as a spec rather than as a preference so that a later
  author editing this row cannot quietly make Côte d'Azur's cloth navy and
  collapse it into the other coast's umbrella. `YELLOW, ORANGE OR RED` follows
  the document's own convention for a staging constraint — *wild lavender LOOSE
  in low stoneware*, *ON MISMATCHED SAUCERS*, *never bundled/ribboned*.
- **Against the room's own bench:** the v1 line *"faded imperfect cloth"* is not
  contradicted. The stripe is what the faded cloth is faded FROM, and the last
  clause says exactly that — *the colour the summer left rather than the colour
  it was sold in*. Two rows, one cloth doctrine.
- **Rule 25:** buyable; no proper noun; nothing to serve.

### the cone stack → `the_atmosphere` (no take-home, light or table phrase)
- **Hers:** vintage, ice cream, cones.
- **Mine:** *point-down in a tall glass*; *two or three tubs sunk in a tin of
  ice*; *the heavy old lever kind*; *nobody scooping for anybody*; the last
  clause about the hour.
- **Where the "vintage" went.** Into the apparatus — the lever scoop, the tin,
  the wafer cone — and not into the ice cream, which is a dish and carries no
  period claim.
- **Rule 25.3 did real work here.** A vintage ice cream CART, or anybody
  standing behind one, is a restaurant and hands the evening to staff who do not
  exist. So the whole thing is set down and self-served, and the clause says
  *nobody scooping for anybody* out loud rather than leaving it to be inferred.
  That phrasing is mine and it is the load-bearing part of the row.
- **Rule 25.1:** a stack of cones, tubs and a tin of ice is backyard-sized.
- **Rule 27:** this is a pool good and NOT a gesture. Côte d'Azur's signature is
  already taken and it is *the refusal to end* — the host never once suggests
  moving. Nothing here proposes a second signature, and the cone stack is
  deliberately written as something set out rather than something performed, so
  it cannot drift into one.

### the striped floats → `the_atmosphere`
- **Hers:** striped pool floats.
- **Mine:** *two or three*; *flat mattresses of the canvas-over-rubber kind*;
  *the same yellow, orange and red as the cloth*; *put on the water before
  anybody arrives and left there with mostly nobody on them*; the whole last
  clause.
- **The stripe ties to the cloth deliberately**, so the two rows are visibly one
  set and a later editor changing one colour has to see the other.
- **What I did NOT import, and it is her call to overrule.** She wrote *"for
  pool party."* I have not written a pool party into this room. Côte d'Azur is a
  lunch that never ended — `starts: afternoon`, `ending: dissolves`, premise *"a
  lunch that is still going at seven"* — and the last clause makes the water a
  thing beside the lunch rather than the event: *the swimming is one person at a
  time in the middle of a lunch that is still going*. Written as a pool party
  this row would have become the other room, which is the outcome she was
  explicitly ruling against. The floats are in; the party framing is not, and
  that is an authoring call, marked, so she can reverse it in one sentence.
- **Rule 25.1 — the one honest flag on this item, and it is real.** A backyard
  in August can honour a cloth, bottles and a cone stack. It cannot honour a
  float without water. **There is no structural requirement code for water.**
  `structural_requirement` holds `requires_outdoors`, `requires_open_flame` and
  `requires_full_kitchen` — `db/039` cut `noise_ceiling` and `deposit_safe`, and
  nothing pool-shaped has ever existed. So this row **ships ungated**: it can be
  selected into a package for a city apartment and nothing will stop it or
  report it. That is a rule-16 silence, and it is stated here rather than
  discovered later. Two ways to close it, both above an author's pay grade:
  a new `requires_pool` code with its nine `venue_affordance` rows, or the
  founder accepting an ungated float. **Recorded, not built, and not a reason to
  hold the clause** — she has ruled that the item is written.

---

## 6 · PUBLICATION — READ BEFORE PASTING

**These clauses carry no `FOUNDER-PENDING` marker, and that is a decision.**

The marker is what `db/036` reads to hold a `bank_item` in draft, and every one
of the 152 machine-drafted take-homes in this document carries one because a
machine proposing an object to the founder must ask. These four are not
proposals. She named them. A pending question on her own four lines would be the
product asking her permission for her own taste — rule 10 from the wrong end.

**The consequence, stated plainly: the moment this block is pasted and
`seed:bank` runs on a deploy, all four rows are LIVE and member-facing.** Under
rule 13 that is correct and intended — pool content stocks itself and the
founder vetoes at the desk rather than consenting row by row. It is written here
so that nobody pastes it thinking there is a second gate.

The dish line is the same and worse: there is no marker for a dish at all, and
`seed-dishes` binds `LIVE` unconditionally. It publishes on the same deploy.

---

## 7 · WHAT IS OWED, AND TO WHOM

| # | owed | to whom | why it is not an author's call |
|---|---|---|---|
| 1 | `the_table_set` drawing more than one | founder / architecture | `max_count 1`, verified. Her tablescape cannot compose in the schema as it stands. Coordinator is taking this separately. |
| 2 | a ruling on the float's venue gate | founder | no `requires_pool` code exists; the row ships ungated or a new structural requirement is added with its nine affordance rows. Rule 16 says the silence must not stand unnamed. |
| 3 | the pool-party framing on the floats | founder | I wrote the floats as the water beside a long lunch rather than as a party at the pool, to keep the room its own. One sentence from her reverses it. |
| 4 | `bank_item_default_slot()` missing `pillar`/`beeswax` | separate fix | Côte d'Azur's candle row does not reach `the_light`. Found in passing; not touched. |
| 5 | `PER_DESTINATION` 119 → 120 | same commit as the dish line | rule 12 — `seed:dishes` is in the pre-deploy chain and the guard is correct. |

**Nothing was refused.** All four of her items are written.

---

## 8 · FILES NOT TOUCHED

`docs/atmosphere-idea-bank-v1.md`, `docs/dishes.md`, `scripts/seed-dishes.mjs`,
`scripts/seed-bank.mjs`, and every migration. Nothing committed, nothing
deployed.
