# What "hundreds of rooms" actually costs

Measured 2026-09-06 against a nineteen-row matrix, by the subagent that wrote
`docs/proposed-tokyo-1964.md`. Every number here is reproducible: the matrix
numbers come from the committed distance function in `src/lib/matrix.ts` (the
one owner, which `check:matrix` and `voice.test.ts` also consume), the tone
numbers from the committed `voiceAffinity` in `src/lib/voice.ts`, the palette
numbers from the arithmetic in `src/lib/palette.test.ts`, and the dish numbers
from `docs/dishes.md` itself.

**The headline, because it is not what anyone expects: the matrix is not what
breaks. It is the third thing to break, and the first two are already broken.**

---

## 1. The distance-3 gate does not close. It is not the problem.

The facet space is 3 × 4 × 3 × 2 × 3 × 3 × 4 × 3 × 2 = **15,552** rows, less
`starts.late` which no row may hold by founder ruling → **11,664 usable**.

| | |
|---|---|
| sphere-packing ceiling at distance 3 (ball radius 1 = 18) | **648 rooms** |
| Gilbert–Varshamov floor (ball radius 2 = 145) | 81 rooms |
| greedy pack keeping the existing 19, 40 random orders | **274–290** |
| greedy pack keeping the existing 19, lexicographic order | **338** |

**`docs/new-destination.md` step 0c says "about 131 rooms at minimum distance 3."
That number is stale by roughly 2.3×.** It was computed before `spectacle` was
adopted and before `schedule` split to four levels. The gate admits somewhere
between 286 and 338 rooms in practice and cannot exceed 648.

So "hundreds" is available. What is not available is finding a row late:

| rooms placed | rows still admissible, of 11,664 | |
|---|---|---|
| 19 | 9,606 | 82% |
| 25 | 8,654 | 74% |
| 50 | 5,993 | 51% |
| 75 | 4,056 | 35% |
| 100 | 2,705 | 23% |
| 150 | 1,018 | 8.7% |
| 200 | **345** | **3.0%** |
| 250 | 68 | 0.6% |
| 286 | 0 | saturated |

**The collapse is quadratic and it inverts the workflow.** Under 100 rooms an
author can write a room and then find a row for it — four times in five, the
row it needs is free. Past 150 the odds are under one in ten, and *"if dusk is
true, say dusk"* means the cell may not be moved to clear. Past that point the
house issues the row and commissions the room to it, or refusals become the
ordinary outcome rather than the exception. Step 0c already prescribes choosing
the row first; at 200 rooms it stops being the cheap way and becomes the only
way.

### Raising the gate is not an option. Adding a column is.

| change | capacity |
|---|---|
| gate 4 | **91** |
| gate 3 (today) | 286–338 |
| gate 2 | 2,916 |
| + one 2-level facet | **635** |
| + one 3-level facet | **868** |
| + one 4-level facet | **1,086** |
| release `starts.late` for rows | 414 |

**This is CLAUDE.md rule 26 as arithmetic. Two numbers that each mean something
beat one that means neither — and a wider first number is not on the table at
all**: moving the gate from 3 to 4 costs 70% of the catalogue. One extra binary
column roughly doubles capacity. That is the whole trade, and it is not close.

### What does get worse, and it is not the count

Every room in a dense pack sits at the floor against somebody.

| rooms | pairs | pairs at exactly 3 | rooms with no margin | mean zero-margin partners |
|---|---|---|---|---|
| 19 (today) | 171 | 29 (17%) | 12 of 19 | 3.1 |
| 50 | 1,225 | 263 (21%) | **50 of 50** | 10.5 |
| 100 | 4,950 | 664 (13%) | **100 of 100** | 13.3 |
| 286 | 55,611 | 3,316 (6.0%) | **286 of 286** | 19.9 |

**By 50 rooms, no room has margin anywhere.** Today six cells sit in
`founderPending` and the audit says every distance touching them is soft; at 100
rooms one cell revision breaks the gate against ~13 rooms at once, and at 286 it
is ~20. Cell revision stops being a local edit and becomes a global one. The
computation is nothing — 20,000 pairs is milliseconds — but a human adjudication
of twenty broken pairs per flipped cell is not.

**Mitigation that is cheap and is not in place:** every row should ship with the
single-cell-flip sweep that `docs/proposed-tokyo-1964.md` § 0b-i runs, so
"legal if" is caught at authoring time rather than at revision time. Seventeen
runs of an existing script.

---

## 2. THE SUPPLY SIDE IS ALREADY BROKEN, AND MORE ROOMS MAKE IT WORSE

Rule 26 warns against concluding the space is full when you are measuring the
wrong dimension. Run in the other direction it says something sharper here:
**do not congratulate the matrix on 286 open rows until you check whether the
quiz can reach them.**

**Seven of the nine facets are UNFED.** The matrix's own `fedBy` block says so,
with a reason written at each. Only `ending` (from `how_it_ends`) and `starts`
(from `meal_time`) are supplied by an answer a host gives. The structural ranker
therefore sorts the entire catalogue through a **3 × 3 grid of nine cells**, of
which six are occupied:

| ending / starts | rooms today |
|---|---|
| `until_morning` / `evening` | **7** |
| `dissolves` / `evening` | 3 |
| `dissolves` / `afternoon` | 3 |
| `clean_stop` / `afternoon` | 3 |
| `clean_stop` / `morning` | 1 |
| `dissolves` / `morning` | 1 |
| `clean_stop` / `evening` | 0 |
| `until_morning` / `morning` | 0 |
| `until_morning` / `afternoon` | 0 |

Seven rooms — Westhampton, New Orleans, Havana, Las Vegas, Tahiti, St. Moritz,
Acapulco — are **structurally indistinguishable from each other**. Not close:
identical, on every column the quiz feeds. What separates them for a real
applicant is tone space and the venue prune, and nothing else.

Project that forward. Rooms per reachable cell, if nothing is wired:

| rooms | cells reachable | rooms per cell |
|---|---|---|
| 19 | 9 | 2.1 (6 occupied → 3.2) |
| 50 | 9 | 5.6 |
| 100 | 9 | 11.1 |
| 200 | 9 | **22.2** |
| 500 | 9 | 55.6 |

**Every room added past here makes the reveal less discriminating, not more.**
The gate of 3 defends a separation the applicant cannot express, and rule 15's
own test applies to the seven columns directly: they grade, and nothing prunes
on them.

Each facet wired multiplies the reachable space:

| fed facets | cells | rooms per cell at 200 |
|---|---|---|
| 2 (today) | 9 | 22.2 |
| + `schedule` (4) | 36 | 5.6 |
| + `size` (3) | 108 | 1.9 |
| + `volume` (3) | 324 | 0.6 |

**To hold today's ~3 rooms per occupied cell at 200 rooms takes two more
questions. At 500 it takes three.** The `fedBy` block already names which are
wireable and what each one costs — `schedule` carries the most separation in the
audit and is the strongest candidate; `size` is the closest to wireable and is a
seam decision rather than a boundary one.

**This is the finding to act on first.** It is cheaper than any of the others
and it is the only one where doing nothing actively degrades the product.

---

## 3. THE TONE VOCABULARY HAS A HARD CEILING AT 120, AND NOTHING NAMES IT

`src/lib/voice.test.ts` asserts that no two destinations state the same
formality, address mode and humour mode. The comment beside it explains why —
"two houses that are both cordial, impersonal and dry have thrown away the three
cheapest axes" — and it is right. But it is also, unstated, a capacity limit:

**formality 5 × address 4 × humour 6 = 120 unique triples. Eighteen are used.**

**The catalogue cannot reach 121 rooms without widening one of those three axes
or retiring that assertion.** That is the hardest ceiling in the system, it is
half the matrix's capacity, and it appears nowhere in
`docs/new-destination.md`. Widening humour to eight levels takes it to 160;
widening address to six takes it to 180. Both are vocabulary decisions and both
are hers.

### The soft ceiling is already biting

`voiceAffinity` is a cosine over tone facets. The ceilings are 0.58 strict
(declared twins and structural distance ≤ 2) and **0.92 monitor** (distance ≥ 3).

The authored field today: mean pairwise affinity **0.259**, sd **0.268**,
maximum **0.853**. That is **0.067 of headroom** on a measure that gets one more
draw per pair, and pairs grow as N².

On the observed distribution, P(a random pair ≥ 0.92) ≈ 0.007, so expected
breaches ≈ 0.0035 N²:

| rooms | pairs | expected breaches of 0.92 |
|---|---|---|
| 19 | 171 | ~1 (observed 0) |
| 50 | 1,225 | ~8 |
| 100 | 4,950 | ~34 |
| 200 | 19,900 | ~138 |

Every breach is a human adjudication — the failure message itself says
re-tagging is not automatically the fix and asks whether the pair is echo or
kinship. **At 200 rooms that is ~138 judgement calls, and they arrive as a wall
rather than one at a time.**

### And rule 26's escape hatch is not armed

Rule 26's answer to a tone-close pair is the second number: tone-close AND
deliverables-close is a confusion risk; tone-close AND deliverables-disjoint is
two rooms that are neighbours in register. **The deliverables measure currently
refuses nothing** — its "close" threshold sits at 0.2 and the observed maximum
across the catalogue is 0.136. It is calibrated above the range it is measuring,
so it cannot fire, and it will still not fire on the first fifty breaches.

Rule 28 said the sequence matters and the measure moves with the catalogue, not
ahead of it. The catalogue has moved. **Recalibrating that threshold against the
observed distribution is the prerequisite for every tone verdict after about
room 40**, and doing it after the breaches arrive means adjudicating them by
hand first.

---

## 4. THE PALETTE DOES NOT BREAK. IT IS THE ONE THING WITH ROOM.

`apart()` in `src/lib/palette.test.ts` is the **mean per-channel absolute
difference**, floored at 8 — which is an L1 distance of 24 in a 256³ cube, not a
Euclidean one.

| | |
|---|---|
| L1 ball of radius 12 | ≈ 2,304 colours |
| cube 16,777,216 ÷ 2,304 | **≈ 7,282 grounds** |
| restricted to grounds that can host any ink at 7:1 (61.3% of the cube) | **≈ 4,464 grounds** |
| closest existing pair today | 11.0 |

**The 8-unit floor admits thousands. It will never be the binding constraint.**

The real constraint is the ink floor, and it is worth stating because it is what
makes palette authoring feel hard:

> A ground whose relative luminance falls between **0.10 and 0.30** can host NO
> ink at 7:1 — not pure black (which needs L ≥ 0.30) and not pure white (which
> needs L ≤ 0.10). **That band is 38.7% of the RGB cube**, and it is precisely
> where muted mid-tones live.

So the palette advice for a room author is one sentence: **commit to light or
commit to dark; the middle is unusable and no amount of picking will fix it.**
Seven of the eighteen existing grounds are dark and eleven are light, and none
is in the band.

### Two gaps found in passing

- **`paletteDark` is not tested at all** — not for separation, not for contrast.
  **Havana and Acapulco ship the identical dark `ground` and `ground2` today.**
  The light palettes were deduplicated; the dark ones were not.
- The `No.` on the library shelf is a small integer with no uniqueness test.

---

## 5. THE DISH POOL: THE DETECTOR EXISTS AND CANNOT FIRE

`docs/dishes.md` today: **1,150 lines, 1,085 distinct (name, course) pairs, 55
names claimed by more than one room — 4.8%.** The collisions are exactly what
rule 30 predicts: `oysters on the half shell` (4 rooms), `jumbo shrimp
cocktail`, `spaghetti with clams`, `baked alaska`, `chocolate mousse`, `peach
melba`, `lemon sorbet` (3 each). Category generics, every one.

At 200 rooms and today's ~64 lines per room that is ~12,800 lines, and the
generic-collision rate rises because the generics are a fixed-size set being
divided among more rooms. **Nothing will report it.** The food-identity floors
(20 / 12 / 6 per declared identity) refuse zero rooms today, and the
deliverables-overlap measure is the same one that is calibrated out of range in
§ 3.

The one measurement that does bite is coverage, and it bites now:

**27 of the 162 course × making cells across eighteen rooms are empty**, and
**26 of the 27 are in the six rooms with no wired voice.** Palm Springs has no
main at any rung (correct — the room refuses a main). Amalfi has no half-made
anything and no bought main. St. Moritz has five holes. A host who said she
wants everything to arrive finished is matched to those rooms and finds no main
course she can have.

**This is per-room work that no amount of parallelism removes**, and it is the
axis `docs/new-destination.md` § 6 already names as the one that gets missed. It
is right.

---

## 6. WHAT PARALLELISES AND WHAT DOES NOT

**Parallelises cleanly — N agents, no coordination, no shared state:**
the premise and voice, the `rejected` list, the dish list, the drinks
programme, the plate SVG, the coverage check, the host-act pool.

**Does NOT parallelise. Each is a write to one shared artifact with a global
invariant, and none has a reservation mechanism:**

| the claim | the space | what collides |
|---|---|---|
| the matrix row | 11,664, 82% free today | two rooms within distance 2 |
| the tone hand | pairwise cosine vs all | either breaches 0.92 against the other |
| the **stated triple** | **120, 102 free** | exact repeat — hard assertion failure |
| the palette ground | ~4,464 | within 8 of each other |
| the `No.` on the shelf | small integers | exact repeat, untested |
| the heading map | one file | merge conflict, and a miss fails the deploy |

**Two agents can each pass every check in isolation and fail on merge**, and the
stated triple is the likeliest: 120 slots, and two agents each reaching for "the
obvious unused one" is not a small probability. Nothing in the repository lets an
author claim a row, a ground, a triple or a number before doing the work.

**A claim step is the single highest-leverage piece of infrastructure for
hundreds** — a file that reserves the six values above with a slug and a date,
checked by the same audit that already reads the matrix. It is small, and it is
the difference between N agents working and N agents redoing each other's work.

**Per-room manual work that cannot be removed, only budgeted:** the founder's
signature (rule 13, and this is the point rather than the overhead), her
deliverables sheet, the signature gesture, and the making-axis coverage check.

### And the constants nobody will remember

Five test files hold hand-edited catalogue-size numbers, each of which every new
room must update by hand:

- `src/lib/food-identity.test.ts` — `18` rooms, and the `12 / 4 / 2` identity split
- `src/lib/selection/structure.test.ts` — the ending split (was `7 / 7 / 4`, now `7 / 7 / 5`)
- `src/lib/games.test.ts` — `29` provided games
- `src/lib/drinks-seed.test.ts` — seven corpus counts
- `scripts/catalogue-vocabulary.mjs` — the heading map, which fails the deploy if missed

At 200 rooms that is roughly a thousand hand-edits of numbers that are all
derivable from the matrix and the content documents. Rule 21's test applies
directly: must two surfaces agree about this? They must, and each computes its
own answer.

---

## THE ORDER TO FIX THEM IN

1. **Wire two more facets** before ~50 rooms. Nothing else on this list makes
   the product worse while you wait; this one does, every room.
2. **Decide the 120 ceiling** before ~100 rooms — widen an axis or retire the
   assertion. It is half the matrix's capacity and it is currently invisible.
3. **Build the claim step.** Six values, one file, checked by the existing audit.
   Without it, parallel authoring does not work at all.
4. **Recalibrate the deliverables-overlap threshold** against the observed
   distribution, before the tone breaches arrive rather than after.
5. **Derive the five test constants** from the matrix and the documents.
6. **Test `paletteDark`**, and fix Havana/Acapulco.
7. **Correct `docs/new-destination.md`, which is stale in four places.**
   Step 0c's "about 131 rooms" is 286–338. Step 2's "six to ten of the 51 in
   `src/lib/voice.ts`" is six to THIRTEEN of SIXTY-FOUR — the cap is
   `DESTINATION_TONE_MAX = 13` and the vocabulary is 64 tones, and a room
   author reading the doc will under-claim by three. Step 4 still lists
   `docs/menus.md` as one of the four content documents; the menu pool was
   retired by `db/045` and anything written there seeds `discontinued`. And the
   heading "THE ADMISSION TEST" says what she has now refused: a world is
   admitted when it is signed.

Items 3, 5, 6 and 7 are small. Items 1, 2 and 4 are hers.

---

## HOW EVERY NUMBER ABOVE WAS PRODUCED

Rule 31: where a number is read from is a fact to establish first, and it
belongs in the label. All of this is a build-time reading against a clean
worktree; none of it is production, and none of it needs to be.

| number | read from |
|---|---|
| distances, pair counts, the gate | `npm run check:matrix`, and `matrixDistance` in `src/lib/matrix.ts` for the packing sweeps |
| packing capacity, saturation curve, facet-addition arithmetic | greedy codes over the declared facet levels, using that same distance function |
| fed vs unfed facets, the 3 × 3 grid | the `fedBy` block in `data/destination-matrix.json`, which is the authority by its own note |
| tone ceilings, mean 0.259, sd 0.268, max 0.853 | `voiceAffinity` and the exported ceilings in `src/lib/voice.ts` over the 153 authored pairs |
| the 120 triples | the `Formality`, `AddressMode` and `HumourMode` level lists in `src/lib/voice.ts`, multiplied |
| palette floors and contrast | the `apart` and `contrast` functions in `src/lib/palette.test.ts`, applied to `look.palette` |
| the 38.7% dead band | luminance over the RGB cube at every second level per channel |
| dish counts | `docs/dishes.md` parsed directly; 1,150 lines, cross-checked against `grep -c "^- "` |
| floors, "NO FLOOR REFUSES A PAIR TODAY", the 0.2 threshold above an observed 0.136 | `npm run check:voices`, quoting its own output |
| the test constants | the assertions themselves |
