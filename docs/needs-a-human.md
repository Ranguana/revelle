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
