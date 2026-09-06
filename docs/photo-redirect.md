# The photograph tool, redirected — tables and palettes

> **Founder, 2026-09-06:** *"Put the photo tool on tables and palettes, not on
> proving `clean_stop` from an empty glass count. That is the bigger issue CC
> keeps stepping around."*

A proposal, not a change. Nothing in `src/lib/photo-extract.ts` has moved.

---

## 1 · The finding that settles it

The aim was never the part that worked, and the evidence is not an opinion
about photography — it is three facts about the tree.

**The matrix aim is unfed at BOTH ends.**

1. **Nothing consumes an accepted claim.** `data/destination-matrix.json`
   contains the string `photo` **zero** times. No facet is `fedBy` a
   photograph, so a cell a curator keeps prunes nothing, ranks nothing and
   reaches no member. The desk banner already says so on screen: *"Nothing
   kept here reaches the ranker yet."* That is CLAUDE.md rule 15's ORPHAN
   state, declared and left standing.
2. **Nothing reaches the upload page.** `/apply/photos` is linked from no
   member surface — not the quiz, not the waiting screen, not an email. A
   repo-wide search finds one mention, in a doc comment. In practice a member
   arrives only by typing the URL.
3. **And the one default in the flow tilts toward the matrix.**
   `src/app/apply/photos/page.tsx:114` is `defaultChecked={index === 1}` —
   `evening_she_wants`, pre-selected. `photo-extract.ts`'s own header forbids
   exactly this: *"defaulting to a role is inventing the member's meaning, and
   the role it would default to is the one that feeds the matrix."* The file
   argued the case and the form does the opposite. **This is a bug regardless
   of which way the redirect goes.**

So: retiring the matrix aim removes **no working behaviour**. There is nothing
downstream to break. That is the cleanest possible redirect and it should be
said plainly rather than discovered later.

**What DOES consume `FacetProposal`:** the exported type is imported by
nothing. Three modules consume `PhotoExtract.facets` — `photo-read.ts` (writes
`photo_claim`), `desk/photos.ts` and `desk/photo-queue.ts` (read it back for
the queue). One live route renders proposed cells with per-cell keep/strike.
So the aim has a real surface; it just has no destination.

---

## 2 · What survives, which is most of it

The machinery is sound and the aim is what changes. Untouched:

| | |
|---|---|
| `PHOTO_EXTRACT_VERSION`, `MAX_PHOTOS`, `PHOTO_LONG_EDGE/THUMB_EDGE` | the rules-id and the caps |
| `PhotoRole`, `ROLE_SAID`, `isPhotoRole`, **`mayPrune`** | the seam. Only her own place may touch feasibility |
| `ProposalStatus`, `DEFAULT_STATUS = "silent"` | silence is the default, not an error |
| `mergeSet` | the set is a view, not a table |
| the constrained-output discipline | forced tool, closed enums, `additionalProperties: false`, `required` |
| **`minItems: 0`** | **matters more than ever — see §5** |
| `silentExtract`, `extractFrom`, `Dropped` | one failure shape, and what the parser threw away |
| `application_photo`, `application_photo_extract` (db/064) | the picture and the reading |
| the member-strike trigger | once she strikes it, nobody unstrikes it |
| `palette()` in `photo-store.ts` | **already counts colour from pixels** |

**The palette is already right.** Founder, in the file: *"VLMs invent #C4A574.
Count pixels."* `palette()` samples 64×64, buckets at three bits a channel,
returns the top five as `{hex, share}`, deterministic. It is already stored on
every extract row. **It is already the correct instrument for the new aim and
it currently feeds nothing.** The redirect is smaller than it sounds.

Likewise `TONE_CUES` (ten closed codes: `daylight`, `late_sun`, `candlelight`,
`electric_night`, `sparse`, `layered`, `warm`, `cool`, `polished`, `worn`) and
`ObjectCue` (*"a low brass lamp"*). Both exist, both are light-and-object
evidence, and both explicitly feed nothing today. **Three of the extract's five
payloads are already the new aim.** Only `facets` was ever pointed at the
matrix.

---

## 3 · What is retired

`FacetProposal`, `MATRIX_LEVELS`/`MATRIX_FACETS` as a proposal vocabulary,
`NEVER_FROM_A_PHOTO`, `PROPOSABLE_FACETS`, `CELL_SAID`/`saidAs`, the `facets`
array in the tool, and `photo_claim`.

**Not deleted in the first commit** (rule 14). The file keeps the superseded
aim and says what beat it, in her words — including the four structural
refusals, which were *correct* and are the best argument in the file for why
the aim was wrong: `arrival` is a fingerprint, `ending` and `starts` are
already fed by her own answers. The house wrote three careful walls around a
room it should not have entered.

`photo_claim` holds member-struck rows carrying a real gesture of hers. Those
are **retired with their reason** (rule 17), never dropped.

---

## 4 · Where a palette lands — and a correction

`Theme.palette` is **17 required keys**; `paletteDark` is `Partial<Palette>`,
in practice the same nine everywhere. Palettes live in `world.tokens` (jsonb),
writable from `/desk/destinations`, and are mirrored in `destinations.ts`.

**The motivating number is right, and it is not about the day palettes.**
Measured with `palette.test.ts`'s own `apart` (mean per-channel RGB), across
the 18 authored rooms:

| | mean | min | pairs under the test's floor of 8 |
|---|---|---|---|
| `palette.ground` (day) | **95.0** | 11.0 | **0 of 153** |
| `paletteDark.ground` | **4.6** | 0.0 | **137 of 153** |
| `paletteDark`, all 9 fields pooled | **7.9** | 0.0 | — |

**7.9 is `paletteDark` pooled — the figure quoted, confirmed, and now
attributed.** So:

- **The day palettes are healthy and do not need a photograph.** They pass
  their own separation rule with room to spare.
- **`paletteDark` is not eighteen palettes. It is one near-black with eighteen
  labels.** All 18 rooms sit within 8 units of another room; every room would
  fail the day palette's own floor.
- **Havana and Acapulco are byte-identical across all nine dark fields** —
  ground, ground2, ink, inkSoft, inkFaint, rule, aqua, oxblood, gold. Not a
  near-collision. The same palette twice.
- **Nothing tests any of it.** `palette.test.ts` reads `room.look.palette` only;
  the string `paletteDark` does not appear in it.

**Which changes the order of work.** A photograph proposing dark palettes
against no test would ship the same collision with better provenance. So:

> **The first move is a test, not a photograph.** Extend `palette.test.ts` to
> `paletteDark` — separation and contrast. **It will fail on all 18 rooms**,
> and that is the point: a gap that can go red is worth more than one quietly
> filled. Then the photograph has something to pass.

**Then the palette lands like this, and the shape matters:** the frame supplies
*candidates*; the contrast rules do the *choosing*. Frequency ranking alone is
wrong — the commonest colour is a plausible `ground`, but `ink` and the accents
are contrast roles, not popularity roles. The model is never asked for a hex at
any point. Nothing ships that does not clear the gates.

One rule-21 note: `luminance`, `contrast` and `apart` are module-private inside
`palette.test.ts`. If a proposal path needs them they must be **extracted, not
copied** — two surfaces would have to agree about the floors.

---

## 5 · Where a table lands

`bank_item`, `kind = 'good'`, destination via a `native` `bank_item_world` row,
`phase` cast `::day_phase`, plus `slug` and `source_citation`. Two existing
doors: the seeder, or `/desk/bank/new` with its `"Offer it" / "Withdraw"`
gesture. **Neither is rebuilt** — a proposal arrives as a draft and a person
says yes, which is the flow she already specified and CLAUDE.md rule 13's
governed/pool split unchanged.

Her register already exists, verbatim, in `docs/deliverables-sheets.md`:

> *The table: oilcloth or the good embroidered one, marigolds if they're in
> season, clay dishes that have done this before. Candles as the light goes.*

> *The setting: nothing set until the last minute, then everything at once —
> the table dressed while people are already there. White cloth or bare wood,
> hibiscus dropped in a bowl of water, not arranged…*

A photograph proposing *cloth or bare wood, what the light is, what the dishes
are, whether the flowers are arranged or dropped* is proposing the same **kind**
of thing she writes by hand. That is the test this passes and the matrix aim
failed: **a photograph is being asked about what is in the frame.**

**`minItems: 0` is the whole guard here.** A frame with a bare table and no
flowers proposes no flowers. It does not propose "no flowers" — the type must
have no way to say a thing is absent, exactly as `VenueCue` has none today.

---

## 6 · What the gold set becomes

`docs/photo-gold-set.md`'s apparatus is good and mostly survives. Groups change
from `evening` / `place` / `trap` to **`palette` / `table` / `trap`**.

**The traps survive nearly verbatim and get stronger.** `trap-01` (a marble
lobby, empty) and `trap-03` (an empty beach, nobody in it) are *already*
arguments against structural inference. Under the new aim they become traps
against over-reading a palette or a setting: the lobby has a real palette and
states nothing about a table; the beach has a real palette and is not her place.

**The scoring survives.** Schema validity scored alone; false-positive rate as
the number that must be low; silence precision as the number that must be high;
recall reported and never the headline.

**And one thing gets materially better.** The palette half is **deterministic**
— counted pixels plus contrast arithmetic — so it can be scored with **no
labels from her at all**. Today twenty of thirty cases need her judgement
before they measure anything. After the redirect, only the table cases do.

**She has not supplied the 30 photographs.** Redesigning now costs almost
nothing; after she shoots them it costs her a day.

---

## 7 · Proposed order

1. **`palette.test.ts` covers `paletteDark`.** Fails on 18 rooms. No photograph
   involved. This is the real bug and it is fixable today.
2. **Havana/Acapulco.** One of them gets its own dark palette — a founder call,
   or the first honest use of a counted palette.
3. **Extract the colour helpers** into one owner both the test and any proposal
   path read.
4. **Point the counted palette at a proposal**, gated by (1).
5. **Tables** → `bank_item` draft via the existing path.
6. **Retire the matrix aim**, preserving its argument and its rows.
7. **Fix the role default** (`defaultChecked`) and decide whether
   `/apply/photos` should be reachable at all.

Items 1–3 are worth doing whatever she rules on the rest.

---

## 8 · What needs her

1. **Does the member still upload photographs, or is this a curator's tool?**
   If the aim is the house's palettes and the house's tables, the evidence may
   be the house's own reference shots — and `/apply/photos` being unreachable
   stops being a bug and becomes a decision.
2. **Do the three roles survive?** `place_she_has` / `evening_she_wants` /
   `object_to_find` were written for the matrix aim. `object_to_find` already
   fits tables. The other two may want different words.
3. **Havana or Acapulco** — which room keeps the dark palette they share.
