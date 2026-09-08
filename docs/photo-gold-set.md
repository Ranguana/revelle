# The photograph bench

Thirty frames, three groups, two numbers that decide whether the reader is
safe to point at a member's application.

The structure, the thirty slots, every trap's falsifiable half and the scorer
are built and tested. **The photographs and twenty of the thirty labels are
not, and cannot be written by a machine.** This document is the sheet.

---

## What it is for

`src/lib/photo-extract.ts` reads one photograph into cells of the destination
matrix. The question the bench answers is not "is it clever" but "how often
does it state a cell that is not there".

That is the only failure mode that matters here, and it is a quiet one. A
proposed cell arrives with a plausible evidence sentence attached, on a screen,
next to a Keep button, in front of a person who has read forty of them that
morning. CLAUDE.md rule 3 exists because this house has already paid for the
retro-tagging version of this mistake once.

So the bench scores three things, and keeps them apart on purpose.

### 1 · Schema validity, scored alone

Did a reading come back at all, and how much of it did the parser have to throw
away? Reported as `read`, `entries dropped`, `fingerprint attempts` and
`seam breaches`.

Kept separate from claim correctness because a reader that returns well-formed
rubbish and a reader that returns malformed truth are two problems with two
fixes, and one number covering both tells you to do neither.

`seam breaches` must be **0**. It counts readings where `mayPrune` disagreed
with the case's role, or where a venue cue survived on a frame that is not her
place. That is a bug, not a score, and the bench exits non-zero on it.

### 2 · False-positive rate — **the number that has to be low**

Of everything proposed, what share would a reviewer strike?

A reader at 0.9 recall and 0.5 false positives is worse than useless: it trains
the desk to rubber-stamp, and a desk that rubber-stamps is how `arrival:
assigned` reaches a member.

### 3 · Silence precision — **the number that has to be high**

Of the columns that should have been left empty, what share were?

Its floor is the trap group, which is built so that a reader reaching for the
obvious answer scores zero on it.

Recall is reported and is **not** the headline. A photograph that states
nothing is a correct answer. A bench that punishes silence will be optimised
into exactly the behaviour the schema refuses.

---

## The three groups

| group | n | role | what it tests |
|---|---|---|---|
| `palette` | 10 | `evening_she_wants` | can colour be counted out of it, and does the proposal stay inside what was counted |
| `table` | 10 | 5 × `place_she_has`, 5 × `evening_she_wants` | can it read cloth, service and flowers — and does `mayPrune` hold |
| `trap` | 10 | mixed | does it refuse the obvious wrong answer |

**REDESIGNED 2026-09-08, before she shot anything.** The groups were
`evening` / `place` / `trap`, which was the right bench for the aim the tool
used to have. Founder: *"Put the photo tool on tables and palettes, not on
proving `clean_stop` from an empty glass count."* A brief rewritten today costs
a paragraph; ten frames shot against the old briefs and then found to be the
wrong evidence costs her a day and cannot be undone by code. See
`docs/photo-redirect.md`.

**The `table` group carries the seam.** `mayPrune` is true for `place_she_has`
and false for everything else, and it is the one property here that is a seam
rather than a score — a saved terrace must never become evidence about the room
she actually has. The redirect nearly deleted it by accident: a palette is a
palette whoever's room it is, so for a while every case was
`evening_she_wants`. A table is where the distinction is real, so the split
lives there and a test holds it.

The briefs are in `src/lib/photo-gold-set.ts` and each names one file:
`palette-01.jpg` … `trap-10.jpg`. `npm run bench:photos -- --dry-run` prints
the whole shot list with its briefs.

### The traps, and why they can be written without the picture

A trap's label is not "what this frame states". It is **what this frame invites
and must not produce**, which is a property of the trap's design rather than of
the photograph. So `mustNotPropose` is already written for every one of the ten,
and a trap scores today even unlabelled.

The founder named the first three:

| id | the frame | what it invites | must be silent on |
|---|---|---|---|
| `trap-01` | a marble hotel lobby, empty | grandeur reads as formality, and nothing is laid | `table`, `facets` |
| `trap-02` | one person with a raised glass | reads as spectacle; a room attending to one person it knows is CEREMONY | `facets` |
| `trap-03` | an empty beach, nobody in it | "she has a beach" — it is a saved picture, and states a palette and nothing else | `venue`, `table`, `facets` |
| `trap-05` | a BLACK-AND-WHITE photograph of a laid table | there is no colour to count; a ground returned here was invented | `palette`, `facets` |
| `trap-06` | a heavily filtered image | the palette that can be counted is the FILTER'S, not the room's | `palette`, `facets` |
| `trap-07` | a screenshot of a grid of saved pictures | several rooms, several palettes, one frame | `palette`, `table`, `facets` |

**The founder's own three survived the redirect**, and that is evidence they
were built on something more durable than the old aim. `trap-01` and `trap-03`
were written as arguments against STRUCTURAL INFERENCE — against reading an
evening out of a frame containing no evening — and every word holds against
over-reading a palette or a table. Only what they must be silent ON changed.

Seven more are built on the same principle: a restaurant mid-service reading as
`food = cooked`, a wedding reading as `size = crowd`, a 2am bar reading as
`starts = late` (a column no photograph may propose at all), name cards reading
as `arrival = assigned`, a styled magazine shot, a close crop with no room in
it, and a single object on a plain ground that should propose nothing whatever.

---

## What still needs her

**1 · Thirty photographs.** One per brief, dropped into a folder as
`<id>.jpg`. They do not go in the repository — they are other people's pictures
or her own, and the bench reads them off disk.

**2 · Labels for the TEN table cases — and only those.**

This is the redirect's dividend and it is worth stating as a number: **it was
twenty of thirty, and it is ten.**

A palette reading is DETERMINISTIC. `palette()` counts the same pixels the same
way every run and `paletteFrom` selects against fixed contrast floors, so a
palette case is scoreable the day the photograph exists, with no judgement from
anybody:

- every proposed value was one of the counted colours — nothing invented;
- every proposed token clears its floor against the proposed ground;
- the proposed ground does not collide with a room already in the registry;
- a frame that supplies no ink proposes no ink.

What still needs her is TASTE — *is this the right ground for this room* — and
that is a curator's yes at the desk, not a bench number.

The ten `table-*` cases need her list of which `TABLE_CUES` terms the frame
actually states, written into `expectedTable`. Every cue she does not list is a
cue the reading must be **silent** on. Listing fewer is the stricter test.

**3 · The seven unnamed traps' own briefs**, if the ones drafted are not the
seven she wants. They are guesses at the shape of her three, and the shape is
the part that matters.

A label looks like this:

```ts
slot("evening-01", "evening", "evening_she_wants", "One long table, …"),
// becomes
{
  ...slot("evening-01", "evening", "evening_she_wants", "One long table, …"),
  labelled: true,
  expected: [
    { facet: "size", level: "one_table" },
    { facet: "volume", level: "one_conversation" },
  ],
},
```

Every column she does not list is a column the frame must be **silent** on,
and that is what silence precision measures. Listing fewer cells is not
laziness — it is the stricter test.

---

## Running it

```
npm run bench:photos -- --dry-run        what is missing, by name
npm run bench:photos -- ./photos         every case in that folder
npm run bench:photos -- ./photos trap    one group
```

It reads through **exactly** the code path the product uses — the same tool
schema, the same system rule, the same parser, one image per call, temperature
0, no retry. A bench more forgiving than production measures a reader nobody
ships.

It writes nothing. No database, no rows, no ledger: the bench measures the
reader, it does not act on anybody's application.

It refuses to pretend. No folder, no pictures, or no `ANTHROPIC_API_KEY` and it
says which and exits non-zero, rather than scoring nine cases and printing a
percentage as though it had scored thirty (CLAUDE.md rules 9 and 20).

---

## What the bench does not measure

- **Whether a cell should reach a destination.** Nothing in this feature is
  wired to the ranker, no `fedBy` entry exists, and the bench has no opinion
  about rooms — it never sees one.
- **The palette.** Counted from the pixels in `src/lib/photo-store.ts`, never
  asked of the model, so there is nothing here to score.
- **Whether the member agrees.** That is her strike screen, and her no is the
  only judgement in this system that outranks a curator's.
