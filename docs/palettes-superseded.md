# The palettes, replaced — and the five refusals she lifted

**2026-09-04.** `src/lib/destinations.ts` now carries the registry delivered as
`design_handoff_revelle_portal_v3 2/palettes.revised.json`, verified room by
room against the file. This records what it replaced, because the old values
came with prose and the prose is hers.

## Why they were replaced, measured rather than argued

The authored palettes were very nearly one palette. Measured across all
eighteen rooms:

| | before | after |
|---|---|---|
| distinct ground hexes | 16 of 18 | **18 of 18** |
| mean pairwise ground distance | 7.9 RGB units | **95.0** |
| closest two grounds | **0.0 — exact duplicates** | 11.0 |
| dark rooms | 0 | 7 |

Two pairs shared a ground exactly: **Côte d'Azur / Palm Springs** and
**Havana / Acapulco**. So even after the portal learned to read a palette —
which it never had — four rooms would have rendered as two. Eighteen
destinations were one room, which defeats the premise that opening an occasion
means entering *that* world.

Every room in the new set clears its floors, computed: ink ≥7:1 on ground,
inkSoft ≥4.5:1, inkFaint and the three accents ≥3:1.

## THE FIVE REFUSALS, AND THE RULING THAT LIFTED THEM

Five palette notes were not descriptions. They were standing refusals about
what a room may never be, and they would have outlived any hex change:

- **havana** — The house palette turned warm and one shade deeper: rose-ochre plaster, the green-blue every shutter on the street is painted, brass under a bulb, and the red of a roof tile. Recognisably the same seven colours the other eleven plates are drawn in — no turquoise, no hot pink, nothing that belongs on a postcard. This is a courtyard at three in the morning.

- **las-vegas** — Desert dusk seen from a high floor: sand, brass, and the red of a banquette. Gold is the loudest thing here and it is still the house's gold — no neon, no purple, nothing that belongs on a slot machine.

- **tahiti** — Green shade, coral, black sand and lamp oil. Deep aqua and a hot oxblood, and no turquoise anywhere — this is a working shore at dusk, not a postcard.

- **westhampton-1976** — Sun-bleached canvas, awning green, brass, and the tomato red of a lipstick left on a glass. Nothing avocado; this is the Atlantic, not a kitchen appliance.

The new registry breaks two of them plainly — **Las Vegas is now purple**
(`#2B1733`) and **Tahiti is now turquoise** (`#124A4A`, aqua `#5FC6BC`) — and
Havana's deep teal `#0E4F51` sits at the edge of a third.

Put to the founder with the collisions named. Her ruling, 2026-09-04:

> **"yes they are all allowed to be their now colors"**

So the refusals are SUPERSEDED, not deleted (rule 14): the argument is kept
here and the ruling that beat it is recorded beside it. A later reader finds
that Tahiti once refused turquoise and that the refusal was lifted on purpose,
rather than finding a rule nobody can explain or no rule at all.

**Worth noting how close this came to being missed.** The designer had
`destinations.ts` in the handoff and reasonably did not read ten thousand lines
to find five comments buried inside colour blocks. A constraint that lives only
where it was written gets broken by the next person to touch the thing it
governs — rule 20, one layer down. If refusals like these are written again,
they belong somewhere a person looks BEFORE choosing a colour.

## The other seven notes

Descriptions of hexes that no longer exist. Kept here and removed from the
registry, where they would have described colours that are gone:

- **big-sur** — Fog, redwood, dry grass and a poppy. The greyest-green ground in the library: everything here is seen through weather.

- **catskills** — Canvas, pine, and the warm bulb of a string light. The greenest aqua in the set and a gold that is a lit bulb rather than brass.

- **cote-dazur** — Light off the water at four in the afternoon: bleached linen, a deep sea blue rather than a swimming-pool one, terracotta, and brass.

- **dolomites** — Snow light, stone, loden, and the copper of a pot on a stove. The coldest ground in the library, warmed only where the fire is.

- **nantucket** — Weathered shingle, fog, a navy that has been washed, and cranberry. The greyest ground in the library, which is the point: this is the house that does not dress for dinner.

- **new-orleans** — Courtyard green, old brick, brass on a door, and a night that goes violet rather than blue. Warm ground, hot oxblood, and the darkest night2 in the library — this destination is named after an hour.

- **new-york** — Engraved stationery and black tie: paper, ink that is nearly black, a cold window blue, and the oxblood of a good chair. The least warm ground in the library, on purpose — this is the only destination in it that is properly dressed.

- **portofino** — Harbour water under cloud, ochre and rose plaster, shutters green with the paint gone. Cooler and greyer than the other Mediterranean plates, because the season is over and that is the whole proposition.


---

## 2026-09-06 — Havana and Acapulco keep their shared night

The games pass measured the palettes live and found that while all eighteen
rooms have distinct DAY grounds, only seventeen dark grounds are distinct:
**`havana` and `acapulco-1959` share `#0E1B18`.**

Put to the founder. Her ruling: **"let havana and acapulco use what they have."**

So the shared night ground STANDS. Recorded here because it is exactly the
kind of thing a later reader — or a later agent — will find and try to fix,
having read the argument three sections above that two rooms sharing a ground
are one room twice.

**Why that argument does not reach this case.** It was made about DAY grounds,
where two rooms rendered identically in the light a member reads them in, and
where the duplicate was accidental — nobody chose it. This one is neither
accidental nor invisible: the two rooms are the founder's own declared twins
in the matrix, they are separated on every other axis the house measures, and
she looked at the collision and kept it.

**`src/lib/palette.test.ts` checks day grounds only, and that is now
deliberate rather than an oversight.** Extending it to night grounds would
fail on a ruling. If it is ever extended, this pair is the exception and this
paragraph is why.
