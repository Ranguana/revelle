# Structuring a room — standing orders for Claude Code

Read this before proposing a destination. Then read `docs/new-destination.md`
for everything that happens *after* the row is eligible: voice object,
tones, plate, menus, drinks, heading map, seeders.

This file is only the **row**. The row is arithmetic. Thrown-ness is voice
(CLAUDE.md rule 5). Admission is a signature (rule 8, rule 13). You produce
a draft. You do not author a world.

A destination is a place–time snapshot of an EVENING. Not a theme. Not an
influencer’s brand. Not a venue. Not a building.

Source of truth for numbers: `data/destination-matrix.json` via
`npm run check:matrix` (rule 7). `docs/destination-contrasts.md` is argument
and may lag. Do not quote a scratch table as the audit.

---

## Point this file from CLAUDE.md

Add under Working, after rule 8:

> When proposing or drafting a destination row, follow
> `docs/room-structure.md`. Do not skip to `destinations.ts`.

---

## What admission actually is

A world is a governed class. Dishes and games stock themselves. A world
does not.

These checks can all be satisfied by whoever wrote the row:

- a distance table that prints clean
- every cell filled
- a lexicon line

None of them admit the room.

**Admitted means a person moved the slug onto `authored`.** Until then
the status is `draft` or `proposed`. Say that in every file you write.
Do not write “gate passed” as if it were the act.

If you cannot run `check:matrix`, say so. Label every number
**UNCOMMITTED**. Do not pretend you verified a cell of a table you did
not run.

---

## Order of work (do not invert)

1. **Place and year.** Slug `place-year`. Working title is this, not a
   handle and not a mood.
2. **The fact that is only this night.** One sentence that cannot be
   said of any authored room. If that fact does not license a *cell*,
   write that down. A row whose only unduplicable claim lives in voice
   is a generic evening with a postcard attached. New York and Amalfi
   will sit at 3 and the ranker can still band them.
3. **Nine cells**, in file order, each licensed by a sentence about the
   PARTY. Not the tower, not the decade, not the neighbour you wish to
   clear.
4. **Hamming to every authored slug.** Full table. Rooms that “feel
   close” are printed even when \(d \ge 6\).
5. **Balls.** Occupants of \(B_2\) (under the gate). Occupants of the
   \(d=3\) shell (load-bearing).
6. **Strike test.** Each load-bearing cell, replaced by that neighbour’s
   value, re-counted. If the sentence cannot survive the strike, the
   row is “legal if,” which is not legal.
7. **Same-kind neighbours.** Among \(d \le 3\), which rooms share the
   same kind of evening (see mask below).
8. **Fingerprint-drop.** If you used `assigned`, `arrived`, or
   `performed`, recompute min-\(d\) with that column ignored. If the
   gate collapses, the fingerprint is parity, not an evening.
9. **Thrown-ness.** A party somebody is THROWING, not a scene that
   OCCURS. The matrix cannot check this.
10. **Venue presuppositions.** What physically cannot happen in an
    apartment. Feasibility may prune later. Preference-by-square-footage
    may not (rule 2).
11. **Voice last.** Never first. Never park the only unique fact here.
12. **Stop.** Write `docs/proposals/rooms/<slug>.md`. Do not edit
    `authored`. Do not activate. Do not seed.

`docs/new-destination.md` begins after step 12.

---

## Closed vocabulary

Nine facets. File order is `STRUCTURAL_FACETS` / the arrays in
`data/destination-matrix.json`. A row is an array. Index \(i\) is
facet \(i\).

| facet | levels | notes |
|---|---|---|
| arrival | ceremony, absorbed, assigned | `assigned` is a fingerprint (Catskills). |
| schedule | posted, anchored, standing, unplanned | Strongest separator. A veto is not a cell. |
| volume | overlapping, one_conversation, quiet | Talk, not headcount. |
| dress | dressed, plain | Rule of *this* evening, not whether her people like clothes. |
| food | bought, cooked, arrived | Provenance. `arrived` is a fingerprint (Tahiti). |
| ending | clean_stop, dissolves, until_morning | What the last hour does. Fed by `how_it_ends`. |
| starts | morning, afternoon, evening | When it begins. **Never `late` on a row.** |
| size | few, one_table, crowd | Bodies this evening is *for*. 8 / 8–16 / 16+. |
| spectacle | performed, nothing | A show the ROOM watches. Toast is ceremony. |

`docs/new-destination.md` §0a still lists eight facets. That page is
stale on the column count. This file wins. `spectacle` is the ninth.

No tenth facet. `speech`, `teasing`, `cuisine`, `audience`,
`acquaintance` are rejected. People stay in voice tiles. Venue never
ranks.

`starts.late` is applicant-side only. The audit printing DEAD
`starts.late` is correct. Late-night character lives on
`ending = until_morning`.

---

## How a cell is allowed to exist

The sentence licenses the LEVEL, not the architecture, not the
clearance.

- `size` is how many bodies the evening is for. An unfinished hotel
  is not `few`. Forty people in the one finished room are a crowd
  in an unfinished building.
- `starts` is when the night begins. Dusk is dusk. Do not write
  “evening because afternoon would hit Côte.” If the true hour
  collides, the snapshot fails. That is the gate working.
- `ending` is what the last hour does. A counted glass in a drought
  can license `clean_stop`. A ferry home licenses `dissolves`. Do
  not pick the one that clears New York.
- `spectacle` is a show the room watches — floor show, cliff divers,
  the band that is the point. The room attending to someone it knows
  is not an audience.
- Absence is not evidence (rule 3). “The paragraph never mentioned
  a band” does not make `nothing`.

Fingerprint levels require an exclusion note in the draft or they
are refused.

Positive evidence only. A cell graded from silence is flagged, and
it is the first place to look when a pair collides.

---

## Gate, balls, twins

`gate: 3` in the matrix file.

Hamming distance \(d(R,N)\) is the number of facets where the symbols
differ. All-or-nothing per cell. No weights on the catalogue side.
Host-vs-row scoring in `src/lib/selection/structure.ts` is a different
instrument and is not this table.

### Balls

\[
B_2(R) = \{ N \text{ authored} : d(R,N) \le 2 \}
\]

- \(|B_2|=0\) — eligible on structure. No twin needed.
- \(|B_2|=1\) — twin *candidate*. Then the four conditions. You may
  propose. You may not declare.
- \(|B_2|\ge 2\) — crowded corner. Change a cell or kill the snapshot.
  Rio is the proof.

Do not put \(d=3\) rooms in the ball. Three is legal. The \(d=3\)
shell is load-bearing, not collision.

### Twin conditions (from `twinRule`)

1. \(d \ge 1\). Zero is one room written twice.
2. Voice affinity \(< 0.65\).
3. The pair is DECLARED in the matrix file.
4. One twin per room.

Havana / New Orleans is the precedent. Forcing a structural facet
between them would smuggle a guest property back into the matrix.

Westhampton / Nantucket must not be excused by a twin while two
cells are founder-decides. Decide the cells.

### Designed distance, not a decoder

The gate is a *designed* minimum, in the BCH sense: a law you chose,
not a typical gap. Most pairs sit at 5–6. Load-bearing lives on the
pairs that *meet* the design.

You are packing evenings so one substitution cannot turn Portofino
into Côte without a declared seam. You are not encoding a message
with parity bits. Do not add columns to improve \(d_{\min}\). Do not
implement Reed–Solomon or a generator polynomial on slugs.

Puncturing one column (the fingerprint-drop) is the only coding
operation that belongs in this house: if dropping `spectacle`
collapses a pair from 3 to 2, that column was parity holding two
near-duplicates apart.

---

## Load-bearing cells

A cell \(c\) of \(R\) is load-bearing against authored \(N\) when
striking it — treating \(R_c = N_c\) — drops \(d(R,N)\) below 3.

Therefore:

- every differing cell on a \(d=3\) neighbour is load-bearing
- no single cell on a \(d=4\) neighbour is
- \(d \le 2\) is not load-bearing; it is already under the gate

List them. For each, name who falls if the cell is struck.

A pending or soft sentence on a load-bearing cell makes the row
**legal if**. That is not eligible. Hong Kong’s first `few` was this:
the sentence argued from plywood upstairs; strike the cell and New
York sat at 2.

**Pair-braces** (\(d=4\): any two of the four diffs struck together
go under) stay in the draft, off the influencer page, and only when
the author is about to change two cells at once.

### Strike test (required)

For each load-bearing cell, write one line:

> strike `ending` → New York at 2. The night still stops because
> the water does. Stands.

or:

> strike `size` → New York at 2. The sentence was the building.
> Does not stand.

Tokyo 1964’s proposal already does this as `0b-i`. Copy that habit.

---

## Same-kind neighbours

Eligibility is not separation in use.

Among rooms at \(d \le 3\), apply the kind mask

`{ arrival, dress, food, ending }`

If those four match, the rooms are the same *kind* of evening
(ceremonial bought dinner that stops; unplanned cooked night that
does not; etc.). Name the kind.

Two 3s against the same kind is the floor of the gate, not tightness.
Say so before anyone signs.

Do not use this mask as a second gate.

---

## Occupancy, not vibes

The space is large. Collision is a room written into an occupied
slot, not the matrix running out.

When generating rather than witnessing:

1. List vacant vectors whose min-\(d\) to authored is \(\ge 3\).
2. Ask for a place–year that can license one vector.
3. If no true night fits the vector, the answer is “no room,” not a
   softer row.

Do not average two rooms to invent a third. Do not complete the
grid (`starts.late` on a row because the column looks empty).

---

## Influencer drafts

Same artifact. Same gate. Same signature.

She answers the nine cells plus a scene sentence each, then voice.
If her answers land in \(B_2\) of one authored room, she wrote that
room: offer a register on it, or a cell she can defend. Do not mint
a slug to flatter her.

If \(B_2\) has two occupants, the corner is full.

The GUI must not declare twins. The GUI must not compute Hamming as
truth; a server action reads the same JSON as `check:matrix`.

Questions live in `src/lib/atelier.ts` (when that file is in the
repo). Membership `/apply` stays her occasion. `/atelier` is a
snapshot.

---

## Draft artifact

Write only `docs/proposals/rooms/<slug>.md`.

```markdown
# PROPOSED — <PLACE>, <YEAR>

slug:
status: draft
author: claude-code | influencer:<id>
signed: no
check:matrix: not run | run <sha / date>

## 0. The fact that is only this night
One sentence. If it does not license a cell, say which cell it
fails to reach.

## 0a. The row
| facet | level | sentence |

## 0b. Distances
UNCOMMITTED | FROM check:matrix
| slug | d | differing cells |
Every authored slug. No "others ≥ 6".

## 0b-ball
B2 occupants:
d=3 shell (load-bearing):
| cell | if struck, who falls |

## 0b-i. Strike test
One line per load-bearing cell.

## 0b-ii. Fingerprint-drop
Column ignored: none | assigned | arrived | performed
min-d without it:

## 0b-iii. Same-kind neighbours
Kind mask and the rooms that share it at d ≤ 3.

## 0b-bis. Twin
none | proposed against <slug> (you may not declare)

## 0c. Where the row sits
Consequence of the cells, not a travel paragraph.

## 0d. Thrown-ness
A party thrown. Receipts visible.

## 0e. Venue presuppositions
What cannot physically happen in an apartment.
Feasibility only.

## 0f. Not this
The postcard if the year is stripped.
The rooms this is not. Keep the refusal (rule 14).

## Voice
UNWRITTEN until the row is eligible.

## Admission
Not signed. Mechanical checks are not the act.
```

Member-facing lines, if any, follow `docs/copy-brief.md`. This file
is house-only.

After eligibility and a founder pass, continue at
`docs/new-destination.md` §1.

---

## Worked correction — Hong Kong 1963

First draft hung legality on `few` justified by an unfinished
650-room hotel, parked counted water in the voice notes, omitted
Havana from a sampled table, and picked `evening` partly because
afternoon would hit Côte.

That row was legal-if.

Revised cells, still unsigned, UNCOMMITTED until `check:matrix`:

```
ceremony, anchored, overlapping, dressed, bought,
clean_stop, evening, one_table, nothing
```

The unique fact (water counted at a party in a drought) licenses
`ending = clean_stop`. Size is the table, not the tower. Starts is
dusk because the roof hour is dusk.

Load-bearing against New York: `schedule`, `volume`, `ending`.
Strike `ending` and New York is at 2 — so the water sentence has
to stand. \(B_2\) empty. Same-kind warning: New York and Amalfi
are still ceremonial bought evenings that do not run until morning.

Do not copy this row into `authored`.

---

## What existing code and docs should change

These are recommendations. Do not perform them as a side effect of
drafting a room.

### Docs

- `docs/new-destination.md` §0a lists eight facets and omits
  `spectacle`. Point §0 at this file. Keep §1 onward.
- The “131 rooms” occupancy line is a packing estimate, not an
  audit number. Do not quote it as `check:matrix`.
- The line that gate 3 exists so “one wrong quiz answer still lands
  the host” confuses catalogue Hamming with host-vs-row scoring.
  Catalogue Hamming is row-vs-row. Host scoring is `structure.ts`
  and is asymmetric. Fix the sentence when that page is edited.
- `docs/destination-contrasts.md` still mentions distances and
  facets the JSON has left behind. Argument stays. Numbers come
  from the script.

### Ranker

- `src/lib/selection/structure.ts` is written. If
  `chooseDestinations` does not call `rankByStructure`, the matrix
  is half-unplugged. Wire it as a sort key on **fed** columns only
  (`fedBy` in the JSON). Do not rank on unfed cells.
- Adding a supplier is an entry in `fedBy` plus a bridge row. It is
  not a special case in the chooser.

### Audit

- `scripts/audit-matrix.mjs` / `check:matrix` should emit, for each
  row: \(B_2\), the \(d=3\) shell, load-bearing cells, and a
  fingerprint-drop line. That stops drafts from sampling Havana
  out of the table.
- Distances remain quoted only from that script.

### Do not build

- A Reed–Solomon or BCH encoder on slugs.
- A tenth facet to raise \(d_{\min}\).
- Client-side Hamming as source of truth.
- Auto-declare twins.
- `starts.late` on any row.

---

## Forbidden

- Calling a green table admission.
- Averaging two rooms to invent a third.
- Filling `starts.late` on a row.
- Picking a level because it clears a neighbour.
- Justifying `size` from architecture.
- Quoting a sample of distances.
- Hiding the unique fact in voice while the row scrapes the gate.
- Writing voice and row in one pass.
- Activating a world.
- Editing `authored`.
- Pointing a person at a script that cannot run from a laptop
  (rule 9) and then treating its absence as a verified number.

---

## The test

Read the draft and ask:

1. Is the unique fact in a cell, or only in voice?
2. Does every load-bearing sentence describe the party?
3. If the founder strikes one load-bearing cell, is the snapshot
   still a night, or a postcard of New York?
4. Did you print every authored slug?
5. Did you claim to sign it?

If 5 is yes, delete that sentence.
```
