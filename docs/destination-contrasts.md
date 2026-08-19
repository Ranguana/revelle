# The contrast pass — deriving the quiz from the voices

**Status: first draft, mechanically audited, not yet corrected by the founder.**

## Why this document exists

The old quiz vocabulary was built first and the destinations were tagged into
it afterwards. Every tag was, in the file's own words, "taken from something the
founder had already written." That is the wrong direction, and it produces
exactly the complaint that started this: *why would no speeches have anything to
do with the destination?*

The reason is structural rather than editorial. Retro-tagging harvests
attributes **present in** a destination's prose. Sorting requires attributes
**absent from all the others**. Those are different sets and they overlap only
by accident. `no_speeches` is true of six destinations and decisively false of
none, so it sorts nobody.

So: author the voices, then derive the questions from what actually separates
them. This document is the derivation.

## The rule this cannot break

**Environment is not a facet and never will be.** No question here may ask where
the party is held. That is enforced in three places — zero weight in
`vector.ts:78`, a database trigger in `db/020`, and a test whose failure message
is the thesis — and the thesis is the product:

> "Venue never touches the destination. Havana in a Brooklyn apartment isn't a
> compromise, it's the pitch. The moment venue nudges destination, you're back
> to 'party themes that match your space,' which is the Pinterest board you're
> against."

Guest count and spend are likewise filters, not taste. They belong to a
different stage and must not leak into this matrix.

## The test a facet has to pass

*Can a host answer it without knowing the destinations exist, and would two
different hosts plausibly answer differently?*

If the answer is a fact about the prose rather than about the host, it is a
writing distinction, not a sorting one. It stays in the voice document and out
of the matrix. This is why `formality`, `address mode` and `humour mode` — the
three stated axes every destination already carries — are **not** facets here:
they are true, they are load-bearing for the writing, and no host can answer
them.

## The draft facet set

Ten facets, each answerable as a scene rather than an adjective.

| facet | levels |
|---|---|
| `arrival` | ceremony · absorbed · assigned a role |
| `schedule` | posted and kept · one fixed anchor · none |
| `speech` | somebody stands and speaks · nobody ever |
| `volume` | overlapping · one conversation · quiet |
| `dress` | everyone dressed up · nobody changes |
| `food` | cooked by us · bought and arranged · whatever arrived |
| `ending` | it stops cleanly · it dissolves · it goes until morning |
| `hour` | early · afternoon · late |
| `size` | few · one table · a crowd |
| `teasing` | the group teases each other · never |

## The matrix

| destination | arrival | schedule | speech | volume | dress | food | ending | hour | size | teasing |
|---|---|---|---|---|---|---|---|---|---|---|
| Westhampton 1976 | absorbed | none | nobody | quiet | dressed | bought | dissolves | late | few | teases |
| Havana 1957 | absorbed | none | nobody | overlapping | unchanged | cooked | until morning | late | crowd | never |
| Las Vegas 1960 | ceremony | posted | speaks | overlapping | dressed | bought | until morning | late | one table | never |
| New York 1938 | ceremony | posted | speaks | one conv | dressed | bought | dissolves | late | one table | never |
| Nantucket 1972 | absorbed | none | nobody | quiet | unchanged | cooked | clean stop | afternoon | few | teases |
| New Orleans 1956 | absorbed | none | nobody | overlapping | unchanged | cooked | until morning | late | crowd | teases |
| Catskills 1963 | assigned | posted | nobody | one conv | unchanged | cooked | dissolves | early | crowd | teases |
| Côte d'Azur 1962 | absorbed | none | nobody | one conv | unchanged | bought | dissolves | afternoon | one table | teases |
| Portofino 1961 | absorbed | none | nobody | one conv | unchanged | bought | dissolves | afternoon | few | teases |
| Dolomites 1956 | absorbed | posted | nobody | quiet | unchanged | cooked | clean stop | early | one table | never |
| Big Sur 1971 | absorbed | none | nobody | quiet | unchanged | cooked | clean stop | afternoon | few | teases |
| Tahiti 1961 | absorbed | none | nobody | quiet | unchanged | arrived | until morning | late | one table | never |

## The audit

Every pair must differ on **at least three** facets. Three is the coding bound
that lets one wrong answer still land on the right destination; at distance one,
a single misread tap flips the result.

66 pairs. Min 0, max 10, mean 5.59. **Four pairs fail.**

| distance | pair | verdict |
|---|---|---|
| **0** | Nantucket 1972 / Big Sur 1971 | the matrix cannot tell them apart at all |
| **1** | Havana 1957 / New Orleans 1956 | separated only by `teasing` |
| **1** | Côte d'Azur 1962 / Portofino 1961 | separated only by `size` |
| **2** | Las Vegas 1960 / New York 1938 | separated only by `volume` and `ending` |

A failure means one of two things, and they need different fixes:

**The facet set is missing a distinction the writing actually carries.** That is
Nantucket/Big Sur. These are obviously different parties — one is a newspaper on
the table and butter in a saucepan, the other is a fog-bound cabin where nobody
has a signal and one story gets told long. What the ten facets miss is
*reachability* and *whether the evening has a teller*. Add those and the pair
separates without touching a word of either voice.

**The two destinations really are the same party.** That is the Cap Ferrat case,
and it was resolved by merging. Côte d'Azur/Portofino needs deciding on those
terms: at distance 1 they are one Mediterranean afternoon written twice, and
Amalfi 1953 is about to become a third.

## Candidate facets the failures argue for

| facet | levels | rescues |
|---|---|---|
| `reach` | easy to get to · a journey · genuinely remote | Nantucket / Big Sur |
| `telling` | one person tells it long · everyone talks over each other · neither | Big Sur / Nantucket, Havana / New Orleans |
| `who cooks` | a host cooks · everyone brings · nobody cooks | Havana / New Orleans |
| `spectacle` | something is performed for the room · nothing is | Las Vegas / New York |

Adding these takes the set to fourteen, which is above the eight-to-twelve band
that is comfortable. The cut should come from the weakest discriminators —
`speech` separates only 20 of 66 pairs and is close to free-riding on `arrival`.

## Discrimination carried by each facet

Out of 66 pairs:

```
47  volume        44  hour          35  teasing       29  arrival
47  ending        41  food          32  schedule      27  dress
47  size                                              20  speech
```

`speech` is the weakest and is the likeliest cut. `dress` is weak but earns its
place because it is the single most legible question to ask a host.

## The five unwritten rooms

St. Moritz 1984, Aspen 1994, Palm Springs 1965, Rio de Janeiro 1947 and Amalfi
Coast 1953 cannot be contrasted, because there is nothing yet to contrast. What
they get instead is the inverse: a **brief** stating the row each must occupy to
clear the gate, written before the voice so the voice is written to it.

This is the discipline that would have caught Cap Ferrat before a word of it
existed, and it matters more with each addition — the catalogue is being built
to grow, and every new room makes the next one harder to separate.

- **Amalfi Coast 1953** — must clear Portofino 1961 and Côte d'Azur 1962, which
  currently sit at distance 1 from each other. The distinguishing material the
  premise should reach for: vertical rather than level, arrival by boat or by
  steps rather than by road, and a crowd rather than a few. If it cannot be
  written apart from Portofino, the honest outcome is one Italian coast, not two.
- **St. Moritz 1984** — must clear Dolomites 1956 and Aspen 1994. Dolomites is
  early, quiet, posted, one pot, clean stop. St. Moritz should be its opposite
  on the axes that matter: late, dressed, overlapping, and a night that does not
  end when the fire is banked.
- **Aspen 1994** — must clear St. Moritz 1984 and Dolomites 1956. The plausible
  niche is the American one: absorbed rather than ceremonious, unchanged rather
  than dressed, a house rather than a hotel.
- **Palm Springs 1965** — the least contested. Its risk is Westhampton 1976,
  which is also a rented house with questionable guests.
- **Rio de Janeiro 1947** — the risk is Havana 1957 and New Orleans 1956, which
  already sit at distance 1 from each other. A third late, loud, crowded,
  cooked-for room is the same failure a third time.

## What is not done

- The 66 pairwise sentences themselves. This draft derived facets from the
  structured voice fields — speaker, address, cadence, humour, lexicon, tones —
  which is faster and demonstrably thinner: the four failures are partly an
  artifact of that shortcut.
- No question has been written. Facets first, then scenes.
- The matrix is one person's reading of twelve voice documents and should be
  corrected by their author before anything is built on it.
