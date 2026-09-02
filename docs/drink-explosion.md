# The drink explosion — the conversion table

**Job 1 of an ordered sequence.** The twenty-five drink programmes are retired
by the founder's ruling (same mechanism as db/022's menus: delete the slot rows,
keep the records as a historical pool, nothing draws them). This document
converts what is inside those twenty-five records into atomic drink rows so that
she can approve or adjust the conversion **in one sitting**, before anything is
built.

**Nothing here is authored.** No drink is invented. Every row below is a phrase
that already exists inside one of the twenty-five programmes in
`docs/drinks.md`. Her instruction governs: *"No drink authoring beyond the
explosion until the enumeration exists — the number of new drinks is the
enumeration's output, not a target."*

**Nothing here is built.** No migration, no seeder change, no schema change.
`docs/dishes.md` is untouched — another agent holds it.

**The enumeration's output is 76**, not the ~80–90 estimated. The estimate
assumed roughly three and a half drinks per programme; the actual mean is 3.04,
because nineteen of the twenty-five lines carry exactly three items. The number
is reported rather than padded.

---

## 1 · The parse counts (CLAUDE.md rule 24)

Her instruction invoked rule 24 by name: *"count what your matching matched
before reporting it done."* The hyphen incident — `'take home'` against
`take-home`, 143 of 152 rows silently misfiled — is the calibration. So the
counting comes before the table, not after it.

| what was counted | count |
|---|---|
| `## Heading` blocks in `docs/drinks.md` that are destinations | **12** |
| numbered programme records found | **25** |
| programmes that parsed to the full five-bullet record shape | **25 of 25** |
| programmes carrying a sixth `Also at:` bullet | **0 of 25** |
| **cocktail items extracted** | **76** |
| **mocktail items extracted** | **55** |
| **pairings made** | **55** |
| **pairings that could NOT be made (mirror owed)** | **21** |
| — of those, twin assigned by *position* (counts equal, order agreeing) | 12 |
| — of those, twin assigned by *unambiguous content* (an ingredient or a glass names it) | 28 |
| — of those, twin assigned by a *judgement between candidates* (flagged `MIRROR-READ`) | 15 |
| source fragments rejected as prose rather than minted as drinks | **1** ("nothing else", programme 8) |
| programmes where cocktail count = mocktail count | **5** (1, 12, 14, 23, 25) |
| programmes where cocktails outnumber mocktails | **20** |
| programmes where mocktails outnumber cocktails | **0** |
| programmes where positional pairing would have MISFILED both rows | **1** (programme 12 — the mirrors are written in reverse order) |
| programme names that name an occasion | **0 of 25** |
| programme names a thesaurus parser would have scoped on | **20 of 25** |
| **occasion claims made** | **0 of 76** |

### The three counts that are the point

**76 = 55 + 21.** Every cocktail item is accounted for. 55 have a twin in their
programme's mocktail line; 21 do not and are flagged **owed**, never invented.
A weak invented mirror is worse than a named gap, and db/017's whole guarantee —
*nobody at the table is visibly not drinking* — is what an invented mirror
quietly spends.

**20 of 25, independently reproduced.** The prior pass's finding is not taken on
trust. `matchedOccasionWords()` in `src/lib/catalogue/tagging.ts` was re-run by
hand against all twenty-five `name` lines using its own `TEMPTING_WORDS` list.
Twenty match. The five that do not: programme 3 ("Brunch"), 9 ("A long lunch or
garden drinks"), 14 ("A midnight breakfast"), 17 ("After a day outside"),
23 ("A late brunch"). The hits are `dinner` (16), `supper` (3), `dinner party`
(2), `boat` (1), `beach day` (1). **Not one of the twenty is a legitimate
occasion claim** — every one is db/023's meal-shape axis, which is a different
question from `occasion_type`. So all 76 rows carry **no occasion claim and a
flag**, exactly as instructed.

**Programme 12 is the proof that positional pairing is unsafe.** Its cocktails
are *"Champagne, brandy alexanders after dessert"* and its mirrors are
*"Chocolate cream shake in a coupe with nutmeg, sparkling cider"* — written in
the opposite order. A positional splitter pairs champagne with a chocolate
shake, produces two rows, throws nothing, and reads correct from every angle.
One programme in twenty-five is 4%; the hyphen incident was 94%, and the reason
this one is small is that somebody counted rather than sampled.

### One count that does NOT reproduce, and is flagged rather than repeated

`docs/proposals.md` §3 states: *"Six of the twenty staged rows watch
`the_drinks` in a room with no drink programme."* Counted against the three
committed `docs/take-home-bank-*.md` files, the category-3 rulings give
**7 rows watching `the_drinks`**, of which **4** sit in rooms with no drink
programme. See §7.3 for the enumeration. The figure `6` is not reproducible from
the committed documents and is reported as a discrepancy rather than repeated.

---

## 2 · The conversion table

**76 rows.** One per atomic drink. Read the flag column — it is where the
decisions are.

Column notes:

- **room native** — inherited from the `##` heading the source programme sits
  under. This is a `native` claim: a whitelist (CLAUDE.md rule 23).
- **`Also at:`** — a **second native row**. An affinity row confers no
  eligibility and would never travel. Every entry in this column is a
  *proposal* re-derived from `docs/drink-affinity-pass.md` in §7.1 and is
  **not yet ruled**.
- **season** — the five-value vocabulary (`spring / summer / fall / winter /
  any`). One programme has no target; see §6.
- **mixing** — inherited from the programme's `making` field. Every programme
  has one, so nothing is absent — but the value was authored over a whole line,
  not over one drink. `MIX?` flags rows where the inherited value contradicts
  the drink in front of it. See batch F.
- **mirror** — an em dash means **owed**, never invented.

### Westhampton

| # | drink | mirror | native | Also at: | occasion | season | mixing | flags |
|---|---|---|---|---|---|---|---|---|
| 1.1 | Gin and tonics in tall glasses | Tonic and lime with cucumber | westhampton-1976 | *(Palm Springs — proposed)* | none | summer | half made | OCC-NONE · TEMPT:dinner · MIX? |
| 1.2 | Whiskey sours | Sour made with lemonade and egg-white foam | westhampton-1976 | *(Palm Springs — proposed)* | none | summer | half made | OCC-NONE · TEMPT:dinner · MIX? · COLLIDE |
| 1.3 | Sangria in a pitcher | Fruit punch from the same pitcher fruit | westhampton-1976 | — *(withheld)* | none | summer | half made | OCC-NONE · TEMPT:dinner · PITCHER |
| 2.1 | Manhattans | Cherry-and-orange soda in a coupe | westhampton-1976 | | none | fall | actually mixed | OCC-NONE · TEMPT:dinner · MIRROR-READ · COLLIDE |
| 2.2 | Harvey Wallbangers (vodka, orange juice, vanilla-liqueur float) | — | westhampton-1976 | | none | fall | actually mixed | OCC-NONE · TEMPT:dinner · **MIRROR-OWED** |
| 2.3 | Brandy after dinner | Spiced cider warm or cold | westhampton-1976 | | none | fall | actually mixed | OCC-NONE · TEMPT:dinner · MIRROR-READ · AFTER · MIX? |
| 3.1 | Bloody marys | Virgin marys | westhampton-1976 | *(Catskills — proposed)* | none | summer | bought and poured | OCC-NONE · MIX? · COLLIDE |
| 3.2 | Mimosas | Orange juice and soda water | westhampton-1976 | *(Catskills — proposed)* | none | summer | bought and poured | OCC-NONE · COLLIDE |
| 3.3 | Cold beer in the fridge door | — | westhampton-1976 | *(Catskills — held, see §7.1)* | none | summer | bought and poured | OCC-NONE · **MIRROR-OWED** |

### Nantucket

| # | drink | mirror | native | Also at: | occasion | season | mixing | flags |
|---|---|---|---|---|---|---|---|---|
| 4.1 | Cape Codders (vodka, cranberry, lime) | Cranberry-lime soda | nantucket | | none | summer | bought and poured | OCC-NONE · TEMPT:dinner |
| 4.2 | Cold beer in a cooler | — | nantucket | | none | summer | bought and poured | OCC-NONE · TEMPT:dinner · **MIRROR-OWED** |
| 4.3 | Dark rum and ginger beer with lime | Ginger beer with lime | nantucket | | none | summer | bought and poured | OCC-NONE · TEMPT:dinner |
| 5.1 | Hot buttered rum | Hot chocolate | nantucket | | none | **?** | half made | OCC-NONE · TEMPT:dinner · MIRROR-READ · **SEASON-SHOULDER** |
| 5.2 | Whiskey with one ice cube | — | nantucket | | none | **?** | half made | OCC-NONE · TEMPT:dinner · **MIRROR-OWED** · **SEASON-SHOULDER** · MIX? |
| 5.3 | Mulled cider with rum | Mulled cider straight | nantucket | | none | **?** | half made | OCC-NONE · TEMPT:dinner · **SEASON-SHOULDER** |

### New York

| # | drink | mirror | native | Also at: | occasion | season | mixing | flags |
|---|---|---|---|---|---|---|---|---|
| 6.1 | Manhattans | — | new-york | | none | winter | actually mixed | OCC-NONE · TEMPT:dinner party · **MIRROR-OWED** · COLLIDE |
| 6.2 | Very dry martinis | Bitter lemon soda in a martini glass | new-york | | none | winter | actually mixed | OCC-NONE · TEMPT:dinner party |
| 6.3 | Sidecars (cognac, orange liqueur, lemon) | Lime rickey (lime, soda, a little syrup) | new-york | | none | winter | actually mixed | OCC-NONE · TEMPT:dinner party · MIRROR-READ *(weak)* |
| 6.4 | Brandy after | — | new-york | | none | winter | actually mixed | OCC-NONE · TEMPT:dinner party · **MIRROR-OWED** · AFTER · MIX? |
| 7.1 | Very cold martinis | — | new-york | | none | any | half made | OCC-NONE · TEMPT:dinner · **MIRROR-OWED** |
| 7.2 | Negronis | Bitter orange soda over ice with an orange peel | new-york | | none | any | half made | OCC-NONE · TEMPT:dinner · COLLIDE · YEAR? *(see §7.1)* |
| 7.3 | Red wine in tumblers with dinner | Grape juice cut with soda in a tumbler | new-york | | none | any | half made | OCC-NONE · TEMPT:dinner · MIX? |
| 8.1 | Champagne | — | new-york | *(Acapulco — proposed)* | none | winter | bought and poured | OCC-NONE · TEMPT:supper · **MIRROR-OWED** · **COLLIDE** |
| 8.2 | Champagne cocktails (sugar cube, bitters) | Sparkling cider with a sugar cube and orange peel | new-york | *(Acapulco — proposed)* | none | winter | bought and poured | OCC-NONE · TEMPT:supper |

> *"nothing else"* — the third fragment of programme 8's cocktails line — is
> **rejected as prose**, not minted as a drink. It is an authorial closure on
> the line, not an item. A comma-splitter mints it and produces a 77th row named
> "nothing else". This is the one rejection the parse made.

### Côte d'Azur

| # | drink | mirror | native | Also at: | occasion | season | mixing | flags |
|---|---|---|---|---|---|---|---|---|
| 9.1 | Kir (white wine, crème de cassis) | Sparkling water with cassis syrup | cote-dazur | | none | summer | bought and poured | OCC-NONE · MIRROR-READ |
| 9.2 | Pastis with water | Citron pressé (fresh lemon, sugar, cold water, self-mixed at the table) | cote-dazur | | none | summer | bought and poured | OCC-NONE · MIRROR-READ · MIX? |
| 9.3 | Cold rosé through lunch | — | cote-dazur | | none | summer | bought and poured | OCC-NONE · **MIRROR-OWED** |
| 10.1 | Red wine with dinner | — | cote-dazur | *(Dolomites — proposed)* | none | fall | bought and poured | OCC-NONE · TEMPT:dinner · **MIRROR-OWED** · SEASON-NOTE |
| 10.2 | Cognac after | Chilled verbena tea | cote-dazur | — *(withheld, see §7.1)* | none | fall | bought and poured | OCC-NONE · TEMPT:dinner · MIRROR-READ · AFTER · SEASON-NOTE |
| 10.3 | A small sweet wine with dessert | Poached-pear syrup with soda | cote-dazur | *(Dolomites — proposed)* | none | fall | bought and poured | OCC-NONE · TEMPT:dinner · AFTER · SEASON-NOTE |
| 11.1 | Kir royales | Sparkling grape juice with cassis syrup | cote-dazur | | none | summer | half made | OCC-NONE · TEMPT:dinner · SEASON-NOTE |
| 11.2 | French 75s (gin, lemon, champagne) | Lemon soda in a flute | cote-dazur | | none | summer | half made | OCC-NONE · TEMPT:dinner · SEASON-NOTE |
| 11.3 | Cold rosé | — | cote-dazur | | none | summer | half made | OCC-NONE · TEMPT:dinner · **MIRROR-OWED** · SEASON-NOTE |
| 12.1 | Champagne | Sparkling cider | cote-dazur | *(St. Moritz — proposed)* | none | winter | actually mixed | OCC-NONE · TEMPT:supper · **MIRROR-REVERSED** · **COLLIDE** |
| 12.2 | Brandy alexanders after dessert (cognac, chocolate liqueur, cream) | Chocolate cream shake in a coupe with nutmeg | cote-dazur | *(St. Moritz — proposed)* | none | winter | actually mixed | OCC-NONE · TEMPT:supper · **MIRROR-REVERSED** · AFTER |

### Vegas

| # | drink | mirror | native | Also at: | occasion | season | mixing | flags |
|---|---|---|---|---|---|---|---|---|
| 13.1 | Martinis | — | las-vegas | | none | any | actually mixed | OCC-NONE · TEMPT:dinner · **MIRROR-OWED** |
| 13.2 | Old fashioneds | Bitters and soda | las-vegas | | none | any | actually mixed | OCC-NONE · TEMPT:dinner · MIRROR-READ *(contested)* |
| 13.3 | Whiskey sours | Shirley Temples with extra cherries | las-vegas | | none | any | actually mixed | OCC-NONE · TEMPT:dinner · MIRROR-READ *(contested)* · COLLIDE |
| 13.4 | A gimlet or two (gin, lime cordial) | Lime cordial and soda in a gimlet glass | las-vegas | | none | any | actually mixed | OCC-NONE · TEMPT:dinner |
| 14.1 | Champagne and orange juice separately or together | Orange juice in a flute | las-vegas | | none | any | bought and poured | OCC-NONE · **SPLIT?** *(one item or two)* |
| 14.2 | Bloody marys | Virgin marys | las-vegas | | none | any | bought and poured | OCC-NONE · COLLIDE |
| 14.3 | Black coffee | Black coffee | las-vegas | | none | any | bought and poured | OCC-NONE · **MIRROR-SELF** · AFTER |

### Catskills

| # | drink | mirror | native | Also at: | occasion | season | mixing | flags |
|---|---|---|---|---|---|---|---|---|
| 15.1 | Tom Collinses | Lime rickeys | catskills | | none | summer | half made | OCC-NONE · TEMPT:dinner · MIRROR-READ |
| 15.2 | Whiskey sours | — | catskills | | none | summer | half made | OCC-NONE · TEMPT:dinner · **MIRROR-OWED** · COLLIDE |
| 15.3 | Seltzer with everything | Seltzer with fruit syrups in the same tall glasses | catskills | | none | summer | half made | OCC-NONE · TEMPT:dinner · **MIRROR-SELF** |
| 16.1 | Mulled cider with apple brandy | Mulled cider straight | catskills | *(Aspen — proposed)* | none | fall | half made | OCC-NONE · TEMPT:dinner |
| 16.2 | Hot toddies | Hot lemon and honey | catskills | *(Aspen — proposed)* | none | fall | half made | OCC-NONE · TEMPT:dinner |
| 16.3 | Whiskey by the fire | — | catskills | *(Aspen — proposed)* | none | fall | half made | OCC-NONE · TEMPT:dinner · **MIRROR-OWED** · MIX? |

### Dolomites

| # | drink | mirror | native | Also at: | occasion | season | mixing | flags |
|---|---|---|---|---|---|---|---|---|
| 17.1 | Hot spiced wine | Hot spiced grape juice | dolomites | | none | winter | half made | OCC-NONE |
| 17.2 | Bombardino (warm egg liqueur, brandy, whipped cream) | Hot chocolate with whipped cream in the same mug | dolomites | | none | winter | half made | OCC-NONE · YEAR? *(see §7.1)* |
| 17.3 | Grappa after dinner | — | dolomites | | none | winter | half made | OCC-NONE · **MIRROR-OWED** · AFTER · MIX? |

### Tahiti

| # | drink | mirror | native | Also at: | occasion | season | mixing | flags |
|---|---|---|---|---|---|---|---|---|
| 18.1 | Rum punch in a pitcher | Pineapple-lime-coconut punch from the same pitcher fruit | tahiti | | none | summer | half made | OCC-NONE · TEMPT:dinner · PITCHER · SEASON-NOTE |
| 18.2 | Mai tais (rum, lime, orange liqueur, almond syrup) | Coconut water with lime | tahiti | | none | summer | half made | OCC-NONE · TEMPT:dinner · MIRROR-READ *(weak)* · SEASON-NOTE |
| 18.3 | Cold beer | — | tahiti | | none | summer | half made | OCC-NONE · TEMPT:dinner · **MIRROR-OWED** · **COLLIDE** · SEASON-NOTE |

### Havana

| # | drink | mirror | native | Also at: | occasion | season | mixing | flags |
|---|---|---|---|---|---|---|---|---|
| 19.1 | Daiquiris shaken (rum, lime, sugar) | — | havana | | none | any | actually mixed | OCC-NONE · TEMPT:dinner party · **MIRROR-OWED** |
| 19.2 | Mojitos | Fresh limeade with mint in the same glass | havana | | none | any | actually mixed | OCC-NONE · TEMPT:dinner party · MIRROR-READ |
| 19.3 | Cuba libres | Lime and cola with a lime wheel | havana | | none | any | actually mixed | OCC-NONE · TEMPT:dinner party |
| 20.1 | Rum old fashioneds | Spiced ginger soda over ice with orange peel | havana | | none | any | half made | OCC-NONE · TEMPT:supper |
| 20.2 | Cold beer | — | havana | | none | any | half made | OCC-NONE · TEMPT:supper · **MIRROR-OWED** · **COLLIDE** |
| 20.3 | Strong sweet coffee | The same coffee | havana | | none | any | half made | OCC-NONE · TEMPT:supper · **MIRROR-SELF** · AFTER |

### Big Sur

| # | drink | mirror | native | Also at: | occasion | season | mixing | flags |
|---|---|---|---|---|---|---|---|---|
| 21.1 | Margaritas at sunset | Hibiscus iced tea with lime in the same glass | big-sur | | none | any | half made | OCC-NONE · TEMPT:dinner · **FLAME?** |
| 21.2 | California red by the fire | — | big-sur | | none | any | half made | OCC-NONE · TEMPT:dinner · **MIRROR-OWED** · MIX? · **FLAME?** |
| 21.3 | Hot toddies when the fog comes in | Hot honey-lemon | big-sur | | none | any | half made | OCC-NONE · TEMPT:dinner · **FLAME?** |

### New Orleans

| # | drink | mirror | native | Also at: | occasion | season | mixing | flags |
|---|---|---|---|---|---|---|---|---|
| 22.1 | Sazeracs (rye, sugar, bitters, anise rinse) | Cold sweet tea with lemon peel in the same rocks glass | new-orleans | | none | winter | actually mixed | OCC-NONE · TEMPT:dinner · MIRROR-READ · SEASON-NOTE |
| 22.2 | Vieux carrés (rye, cognac, vermouth) | — | new-orleans | | none | winter | actually mixed | OCC-NONE · TEMPT:dinner · **MIRROR-OWED** · SEASON-NOTE |
| 22.3 | Wine with dinner | Sparkling water with peach syrup | new-orleans | | none | winter | actually mixed | OCC-NONE · TEMPT:dinner · MIRROR-READ *(contested)* · MIX? · SEASON-NOTE |
| 23.1 | Milk punch (bourbon, milk, vanilla, nutmeg) | Vanilla milk with nutmeg in the same glass | new-orleans | | none | any | actually mixed | OCC-NONE · PITCHER? |
| 23.2 | Ramos gin fizzes | Orange-cream fizz | new-orleans | | none | any | actually mixed | OCC-NONE |
| 23.3 | Mimosas | Orange juice in a flute | new-orleans | | none | any | actually mixed | OCC-NONE · COLLIDE |

### Portofino

| # | drink | mirror | native | Also at: | occasion | season | mixing | flags |
|---|---|---|---|---|---|---|---|---|
| 24.1 | Spritzes at golden hour | Italian bitter-orange soda over ice with an orange slice | portofino | | none | summer | half made | OCC-NONE · TEMPT:dinner · MIRROR-READ *(contested with 24.2)* |
| 24.2 | Negronis | — | portofino | | none | summer | half made | OCC-NONE · TEMPT:dinner · **MIRROR-OWED** · **COLLIDE** |
| 24.3 | Cold white wine with dinner | Sparkling lemonade in the wine glass | portofino | | none | summer | half made | OCC-NONE · TEMPT:dinner · MIX? |
| 24.4 | Icy lemon liqueur after | Icy lemon-sugar cordial in the same tiny glass | portofino | | none | summer | half made | OCC-NONE · TEMPT:dinner · AFTER · CUISINE? *(Campanian; see §7.1)* |
| 25.1 | Cold white wine | Sparkling lemonade | portofino | | none | summer | bought and poured | OCC-NONE · TEMPT:boat, beach day |
| 25.2 | Cold beer | Chinotto (Italian bitter cola) | portofino | | none | summer | bought and poured | OCC-NONE · TEMPT:boat, beach day · **COLLIDE** |
| 25.3 | A thermos of espresso | The same espresso | portofino | | none | summer | bought and poured | OCC-NONE · TEMPT:boat, beach day · **MIRROR-SELF** · AFTER |

### Rows per room

| room | programmes before | atomic rows after | change |
|---|---|---|---|
| cote-dazur | 4 | 11 | +7 |
| westhampton-1976 | 3 | 9 | +6 |
| new-york | 3 | 9 | +6 |
| las-vegas | 2 | 7 | +5 |
| portofino | 2 | 7 | +5 |
| nantucket | 2 | 6 | +4 |
| catskills | 2 | 6 | +4 |
| havana | 2 | 6 | +4 |
| new-orleans | 2 | 6 | +4 |
| dolomites | 1 | 3 | +2 |
| tahiti | 1 | 3 | +2 |
| big-sur | 1 | 3 | +2 |
| **acapulco-1959** | 0 | **0** | — |
| **st-moritz-1984** | 0 | **0** | — |
| **aspen-1994** | 0 | **0** | — |
| **palm-springs-1965** | 0 | **0** | — |
| **amalfi-1953** | 0 | **0** | — |
| **oaxaca-1954** | 0 | **0** | — |
| | **25** | **76** | |

**The explosion does not fix the six empty rooms and must not be read as
fixing them.** Six of eighteen rooms have zero drinks before this conversion and
zero after it. Atomization multiplies what exists; it creates nothing. Those six
rooms need authoring or a ruled `Also at:` line, and §7.3 shows four take-home
dependencies already reporting `broken` because of it.

---

## 3 · The finding that changes the shape of the build

**Seven drink names occur verbatim in more than one programme.** The existing
seeder's collapse rule — *"two entries are ONE programme when their cocktails
line and their mocktail line MATCH"* — was written for whole five-bullet
records, where writing the same record twice was a deliberate authorial act.
Applied unchanged at the atomic level it would silently merge these:

| text | programmes | rooms it would become native to |
|---|---|---|
| Whiskey sours | 1, 13, 15 | westhampton-1976 · las-vegas · catskills |
| Cold beer | 18, 20, 25 | tahiti · havana · portofino |
| Manhattans | 2, 6 | westhampton-1976 · new-york |
| Mimosas | 3, 23 | westhampton-1976 · new-orleans |
| Bloody marys | 3, 14 | westhampton-1976 · las-vegas |
| Champagne | 8, 12 | new-york · cote-dazur |
| **Negronis** | 7, 24 | **new-york · portofino** |

**16 rows would collapse into 7, giving 67 records instead of 76 — and minting
9 cross-room native claims nobody authored.**

That is rule 24's other direction: a matcher that matches *everything*. A
programme-level repeat was her saying "this bar belongs in two houses". An
atomic-level repeat is two rooms independently pouring a common drink. The
negroni case makes it plain: `docs/drink-affinity-pass.md` §8.3 separately flags
the negroni in New York 1938 as an anachronism in the room it already lives in —
and string collision would hand it to Portofino for free.

The mirror side has the same collisions: *"Virgin marys"* (3, 14), *"Orange
juice in a flute"* (14, 23), *"Mulled cider straight"* (5, 16).

**Recommendation: do not collapse on identical text at the atomic level.** Keep
76 rows — one per (programme, drink) pair — and let sharing stay her decision,
expressed as an `Also at:` line, exactly as the seeder header already argues.
The seven collision groups are flagged `COLLIDE` in the table so she can rule
the opposite way on any of them individually. **Her call, batch A below.**

---

## 4 · Proposed draw counts, argued

### What is being replaced

`the_drinks` draws **exactly 1 on all nine occasions** — `min_count 1,
max_count 1` on every row (db/017). Required on the five one-evening occasions;
optional and `per_day` on `girls_weekend`, `getaway`, `bridal`; optional on
`other`.

The consequence, in her words: **a room with one programme pours the same thing
at a February birthday and a July anniversary.** Three rooms are in that state
today — Dolomites, Tahiti, Big Sur — and every Big Sur party ever thrown gets
margaritas, California red and hot toddies, in that order, forever. That is not
a shallow pool; it is a pool with no combinatorics at all, because the unit of
draw is the whole bar.

### The proposal

| occasion | `the_pour` | `the_pitcher` | `the_after` | required | per day |
|---|---|---|---|---|---|
| dinner_party | **2** | 0–1 | 0–1 | pour only | no |
| birthday | **2** | 0–1 | 0–1 | pour only | no |
| anniversary | **1–2** | 0–1 | 0–1 | pour only | no |
| holiday | **2** | 0–1 | 0–1 | pour only | no |
| no_reason | **1** | 0–1 | 0–1 | pour only | no |
| other | 0–1 | 0–1 | 0 | nothing | no |
| girls_weekend | **1–2** | 0–1 | 0–1 | nothing | yes |
| getaway | **1** | 0–1 | 0–1 | nothing | yes |
| bridal | **1–2** | 0–1 | 0–1 | nothing | yes |

`min_count` on `the_pour` stays **1** everywhere it is required. The mirror is
not a slot: it rides on the row it is paired to, which is the only shape that
keeps db/017's guarantee intact.

### The argument, per slot

**`the_pour` draws 1–2 because 1 is what failed and 3 is what the pool cannot
serve.** At 2 draws, the three-row rooms give 3 distinct pairs where they gave 1
fixed programme; Côte d'Azur at 11 rows gives 55. That is the whole point of the
retirement and it is bought at the lowest count that buys it. Requiring 2 would
break nothing today — the thinnest room has 3 rows — but it would break the
moment a `season_strict` gate fires: Dolomites' three rows are all `winter`, so
a July Dolomites party has **zero** eligible pours and a hard `min_count 2`
turns that into a failed package rather than a thin one. `min 1 / max 2` fails
soft. The three occasions set to a flat 1 (`no_reason`, `getaway`, `other`) are
the ones whose own notes already say the bar is not constitutive.

**`the_pitcher` is 0–1 and required nowhere, because the pool holds four
candidates.** Counted: *sangria in a pitcher* (1.3, Westhampton), *rum punch in
a pitcher* (18.1, Tahiti), *milk punch* (23.1, New Orleans — contested, it is
served in a glass), and arguably *seltzer with everything* (15.3, Catskills,
which is a bucket rather than a pitcher). **Three rooms of twelve can fill it.**
Requiring it anywhere would break nine rooms on day one — the failure db/045
records for the menus, repeated at a smaller scale. A slot with three suppliers
is a slot that must be allowed to stay empty, loudly (rule 16: the package says
so at the point of use, it does not silently omit).

**`the_after` is 0–1 and required nowhere, because the pool holds nine and they
cluster.** Counted from the source text: *brandy after dinner* (2.3), *brandy
after* (6.4), *cognac after* (10.2), *a small sweet wine with dessert* (10.3),
*brandy alexanders after dessert* (12.2), *black coffee* (14.3), *grappa after
dinner* (17.3), *strong sweet coffee* (20.3), *icy lemon liqueur after* (24.4),
*a thermos of espresso* (25.3) — **ten rows across seven rooms**. Westhampton,
New York, Côte d'Azur, Vegas, Dolomites, Havana, Portofino have one; Nantucket,
Catskills, Tahiti, Big Sur, New Orleans have none. Five rooms of twelve cannot
close an evening, so `the_after` cannot be required either.

**Note what this exposes and does not hide:** the two new slots make the
catalogue's real thinness *visible per slot*, where the single `the_drinks`
column hid it inside a programme that happened to contain a digestif. A coverage
board that shows nine empty `the_after` cells is telling the truth for the first
time. That is §7.4's whole subject.

**Total draw per evening** goes from 1 programme (3 drinks, fixed, always the
same in a one-programme room) to 1–4 rows chosen independently, each carrying its
mirror.

---

## 5 · Every flagged ambiguity, grouped for one ruling

Grouped so she can rule on batches rather than rows.

### Batch A · Cross-room string collisions — 7 groups, 16 rows

Listed in §3. **One ruling:** *do not collapse identical text at the atomic
level* (recommended), or *collapse and accept 9 unauthored cross-room native
claims*, or *collapse case-by-case*. Negronis (7.2 / 24.2) is the one worth a
separate look either way.

### Batch B · Mirrors owed — 21 rows

**Nothing here is invented.** These 21 cocktail items have no twin in their
programme's mocktail line:

| | |
|---|---|
| **spirits poured neat** (4) | 5.2 whiskey with one ice cube · 6.4 brandy after · 16.3 whiskey by the fire · 17.3 grappa after dinner |
| **beer** (4) | 3.3 cold beer in the fridge door · 4.2 cold beer in a cooler · 18.3 cold beer · 20.2 cold beer |
| **wine and champagne, poured** (5) | 8.1 champagne · 9.3 cold rosé through lunch · 10.1 red wine with dinner · 11.3 cold rosé · 21.2 California red by the fire |
| **mixed drinks** (8) | 2.2 Harvey Wallbangers · 6.1 Manhattans · 7.1 very cold martinis · 13.1 martinis · 15.2 whiskey sours · 19.1 daiquiris shaken · 22.2 vieux carrés · 24.2 negronis |

4 + 4 + 5 + 8 = 21.

The four groups fail differently and may want different rulings. Beer, neat
spirits and poured wine are the *easy* gaps — a non-alcoholic beer, a cold
ginger ale in the same bottle, a good grape juice in the same glass — and they
are also the ones where a weak mirror is most tempting, because "juice" always
looks like an answer. The eight mixed drinks are the *real* authoring: a daiquiri
without rum is lime and sugar, and making that a drink somebody actually wants
is the craft `docs/drinks.md` names in its own opening.

**Ruling wanted:** author all 21 as part of job 2, author the 13 easy ones and
hold the 8 mixed, or ship rows with a declared gap. **A row shipped with an
empty mirror breaks db/017's NOT NULL and the guarantee behind it**, so option
three is a schema decision, not a content one.

### Batch C · Mirrors assigned by a judgement between candidates — 15 rows

Where a programme's two lines have unequal counts, more than one twin was
available. Each of these is a *reading*, and she may disagree with any of them.
Twelve where one reading is clearly better:

- 2.1 Manhattans ↔ cherry-and-orange soda in a coupe *(the garnish and the glass)*
- 2.3 brandy after dinner ↔ spiced cider warm or cold *(the after)*
- 5.1 hot buttered rum ↔ hot chocolate *(hot and rich)*
- 6.3 sidecars ↔ lime rickey *(citrus and sugar; **weak** — the sidecar is lemon, the rickey lime)*
- 9.1 kir ↔ sparkling water with cassis syrup *(cassis names it)*
- 9.2 pastis with water ↔ citron pressé *(both self-diluted at the table)*
- 10.2 cognac after ↔ chilled verbena tea *(the after)*
- 13.2 old fashioneds ↔ bitters and soda *(bitters and sugar)*
- 15.1 Tom Collinses ↔ lime rickeys *(tall, citrus, fizz)*
- 18.2 mai tais ↔ coconut water with lime *(**weak** — lime is the only join)*
- 19.2 mojitos ↔ fresh limeade with mint *(mint decides it)*
- 22.1 sazeracs ↔ cold sweet tea with lemon peel in the same rocks glass *(the glass and the peel)*

**Three are genuinely contested** and are separated out because two readings each
have a real claim:

| row | the contest |
|---|---|
| 13.2 / 13.3 | *Shirley Temples with extra cherries* mirrors the **old fashioned** (the cherry) or the **whiskey sour** (sweet-sour, no bitters). Placed on the sour; the old fashioned took *bitters and soda*. |
| 22.2 / 22.3 | *Sparkling water with peach syrup* mirrors the **vieux carré** or **wine with dinner**. Placed on the wine, leaving the vieux carré owed. |
| 24.1 / 24.2 | *Italian bitter-orange soda over ice with an orange slice* mirrors the **spritz** (orange slice) or the **negroni** (bitter). Placed on the spritz, leaving the negroni owed. |

### Batch D · Structural cases in the source text — 4 rows

| row | the question |
|---|---|
| 8 (`nothing else`) | **Rejected as prose.** Confirm that "nothing else" is a closure on the line and not a drink. |
| 12.1 / 12.2 | **Mirrors written in reverse order.** Confirm champagne ↔ sparkling cider and brandy alexander ↔ chocolate cream shake. Positional splitting gets both wrong. |
| 14.1 | *"Champagne and orange juice separately or together"* — **one row or two?** Read as one (it is one authored phrase describing a choice). Splitting it gives champagne + orange juice and makes the total 77. |
| 15.3, 14.3, 20.3, 25.3 | **`MIRROR-SELF` — the drink is already non-alcoholic.** Seltzer, black coffee, strong sweet coffee, espresso. Their mirrors in the source are themselves ("the same coffee", "the same espresso"). Confirm this is a legitimate state and not an empty mirror in disguise. |

### Batch E · Season — see §6 for the itemisation

One row group with no target (`5.1–5.3`, shoulder) and six wordings that say
more than their band.

### Batch F · Mixing level inherited from a programme aggregate — 13 rows

`making` was authored over a whole line, not over one drink. Inheriting it is
defensible for 64 rows and visibly wrong for these:

| row | programme says | the drink is |
|---|---|---|
| 1.1 gin and tonics in tall glasses | half made | bought and poured |
| 1.2 whiskey sours *(egg-white foam mirror)* | half made | actually mixed |
| 2.3 brandy after dinner | actually mixed | bought and poured |
| 3.1 bloody marys | bought and poured | actually mixed |
| 5.2 whiskey with one ice cube | half made | bought and poured |
| 6.4 brandy after | actually mixed | bought and poured |
| 7.3 red wine in tumblers | half made | bought and poured |
| 9.2 pastis with water | bought and poured | half made *(and the mirror is mixed by the guest)* |
| 16.3 whiskey by the fire | half made | bought and poured |
| 17.3 grappa after dinner | half made | bought and poured |
| 21.2 California red by the fire | half made | bought and poured |
| 22.3 wine with dinner | actually mixed | bought and poured |
| 24.3 cold white wine with dinner | half made | bought and poured |

This is not a defect in her authoring — a programme-level answer over three
drinks was the right answer to a programme-level question. It becomes wrong only
because the unit changed. **Ruling wanted:** inherit and correct these 13 by
hand, inherit all 76 unchanged, or derive per-drink and flag the derivation.
Note the axis is load-bearing: `making_level` feeds `made_by_hand_weight()` and
a host who said everything should arrive finished is scored on it.

### Batch G · Claims inherited from other passes, now landing on atomic rows

| row(s) | inherited flag |
|---|---|
| 21.1–21.3 | **`FLAME?`** — the `requires_open_flame` requirement currently sits on programme 21 by matching its *name*, "A fire-lit dinner". Atomization deletes the string it matches. See §7.5. |
| 7.2 negronis | **`YEAR?`** — flagged in `docs/drink-affinity-pass.md` §8.3 as near-unknown in America in 1938. A native claim; not this pass's to move. |
| 17.2 bombardino | **`YEAR?`** — §8.4 dates its Alpine spread to the 1970s–80s against a 1956 room. |
| 24.4 icy lemon liqueur | **`CUISINE?`** — §8.5: Campanian liqueur in a Ligurian room, while the Campanian room has no bar. |

---

## 6 · What the five-value season vocabulary collapses, itemised

**First, the enumeration she asked for: every distinct season string actually
present in the source.** Nine, not five:

| authored wording | programmes | count | current `season_band` | five-value target |
|---|---|---|---|---|
| `Summer` | 1, 3, 4, 9, 15, 24, 25 | 7 | `summer` | **summer** |
| `Year-round` | 13, 14, 19, 20, 21 | 5 | `year_round` | **any** |
| `Winter` | 6, 8, 12, 17 | 4 | `winter` | **winter** |
| `Fall` | 2, 16 | 2 | `autumn` | **fall** |
| `Any` | 7, 23 | 2 | `year_round` | **any** |
| `Spring and summer` | 11 | 1 | `summer` | **summer** |
| `Warm weather` | 18 | 1 | `summer` | **summer** |
| `October` | 10 | 1 | `autumn` | **fall** |
| `Winter or spring` | 22 | 1 | `winter` | **winter** |
| **`Shoulder season and fall`** | **5** | **1** | **`shoulder`** | **NO TARGET** |

`high_summer` is **not used by any drink**. The prior report that mentions it
was reading `SEASONS` in `scripts/catalogue-vocabulary.mjs`, which carries the
whole catalogue's wordings — `"High summer"` is a **dish** wording. Reported
because the correction matters: the drinks lose nothing to `high_summer`.

### The collapse, stated as losses rather than performed silently (rule 14)

**Loss 1 — `shoulder` has no target in the five-value vocabulary.** One
programme, Nantucket 5, three atomic rows: hot buttered rum, whiskey with one
ice cube, mulled cider with rum. Her wording is *"Shoulder season and fall"*.
`fall` honours half of it and deletes the spring half; `any` honours neither and
makes a hot-buttered-rum bar legal in July. **Her call. The table leaves the
cell as `?` rather than guessing.**

**Loss 2 — the five-value vocabulary is narrower than `season_band`, which the
dishes also use.** `season_band` (db/012) has seven members: `spring`, `summer`,
`high_summer`, `autumn`, `winter`, `shoulder`, `year_round`. The five-value
vocabulary drops `high_summer` and `shoulder` and renames `autumn`→`fall`,
`year_round`→`any`. **Is this a drinks-only vocabulary or a catalogue-wide
one?** Drinks-only means two season vocabularies in one catalogue — CLAUDE.md
rule 21's exact failure shape, two surfaces each computing "season" and drifting.
Catalogue-wide means dropping `high_summer` and `shoulder` from ~600 dishes,
which is not this job's to propose. **Named, not decided.**

**Loss 3 — and this one is load-bearing: dropping `season_note` un-derives the
season gate.** `src/lib/catalogue/tagging.ts` writes `drink.season_strict` for
**14 of 25** programmes today, and the rule is *strict where the band holds the
whole of her wording, a lean where the band is only part of it*. The input is
`season_note` — her exact words — checked against `SEASON_NARROWED`. Verified by
re-deriving all 25 by hand: 14 strict (programmes 1, 2, 3, 4, 6, 8, 9, 10, 12,
15, 16, 17, 24, 25), 11 soft (5, 7, 11, 13, 14, 18, 19, 20, 21, 22, 23).

If the atomic row carries only a five-value band and not her wording, those four
`SEASON_NARROWED` judgements have nothing to read:

| row(s) | wording | why it currently leans instead of gating |
|---|---|---|
| 5.1–5.3 | `Shoulder season and fall` | band and wording overlap without either containing the other |
| 11.1–11.3 | `Spring and summer` | gating on `summer` deletes May from a drink she wrote for May |
| 18.1–18.3 | `Warm weather` | *"warm weather in Tahiti is not three months"* |
| 22.1–22.3 | `Winter or spring` | two seasons named, one held |

Twelve rows would flip from lean to gate, or from gate to nothing, depending on
which way the loss falls — **silently, because nothing goes red when a
derivation loses its input.** That is the defect this whole area was built to
fix: `season_strict` defaulted `false` for months and a February party was
offered the summer bar with "Summer" printed on the sheet.

**Recommendation: keep `season_note` — her exact wording — as a field on every
atomic row, alongside the five-value band.** It costs a text column and it is the
only thing keeping the gate derivable. Rows 10.1–10.3 are the clearest case:
"October" is the only month named anywhere in the drinks, and `fall` cannot
say it.

---

## 7 · The five known intersections — checked, not assumed

### 7.1 · The drink-affinity pass's six claims, re-scoped to atomic rows

None dissolves entirely. **Two of the six are materially improved by
atomization, and both were improved in the same way: the objection was always to
one word, and atomization is what lets the word stay home.**

| claim | at programme level | at atomic level |
|---|---|---|
| **drink 3 → catskills** *(strong)* | 3 drinks travel together as a morning bar | **Survives, with a caveat.** 3.1 bloody marys and 3.2 mimosas carry mirrors and travel clean. **3.3 cold beer in the fridge door has no mirror** — sharing it doubles an existing gap into a second room. Recommend 3.1 + 3.2 travel now, 3.3 when its mirror is authored. |
| **drink 8 → acapulco-1959** *(fair)* | "Champagne and nothing else" | **Survives.** 8.1 + 8.2 both travel; the coupe-and-cork argument attaches to both. Note the claim's own phrase "and nothing else" was rhetoric on a line, not an item — the parse rejects it as prose (batch D) and the claim's force is unchanged. **8.1 champagne is a `COLLIDE` row** (see 7.1 note below). |
| **drink 12 → st-moritz-1984** *(fair)* | 2 drinks; argued as *"the one Côte d'Azur programme with nothing Provençal in it"* | **Survives, and the cuisine argument gets sharper.** At atomic level the claim need not carry the whole programme: 12.2 brandy alexanders is the row the St. Moritz argument actually rests on (the ironic-formal after-dessert order). 12.1 champagne is generic and is also a `COLLIDE` row. |
| **drink 16 → aspen-1994** *(fair)* | 3 drinks, "the only programme built entirely for mugs" | **Survives whole** — all three are mug drinks and the argument is about the whole line. 16.3 whiskey by the fire is mirror-owed; same caveat as 3.3. |
| **drink 10 → dolomites** *(thin)* | Held back by one word: the programme says **cognac** and Dolomites has already declared **grappa**. The pass recommended declining it and writing two lines instead. | **The objection dissolves.** Atomized, 10.1 red wine with dinner and 10.3 a small sweet wine with dessert travel; **10.2 cognac after stays in Côte d'Azur.** The room gets its off-season dinner without contradicting its own digestif. The pass's own recommendation — *"commission a Dolomites shoulder programme with grappa in it"* — becomes a smaller job: one atomic row, not a programme. |
| **drink 1 → palm-springs-1965** *(thin)* | Held back by one word: **sangria** is one year old in a 1965 room. | **The objection dissolves the same way.** 1.1 gin and tonics in tall glasses and 1.2 whiskey sours travel — both 19th century, both squarely 1965 — and **1.3 sangria in a pitcher stays in Westhampton.** The pass called this "one contestable word and one narrowed gap"; atomization removes the word and leaves only the gap, which is the corner-test question and hers. |

**The claims' room-distance and corner tests are NOT re-derived here.** CLAUDE.md
rule 7: distances are quoted only from `npm run check:matrix`. This document
quotes no distance number. The six corner tests stand as written in
`docs/drink-affinity-pass.md` and should be re-run against atomic rows before
any of these is committed, because a claim that now moves 2 rows instead of 3
may cross a corner differently.

**One new interaction the pass could not have seen:** claims on 8.1 (→ Acapulco)
and 12.1 (→ St. Moritz) both land on rows whose text is the single word
*"Champagne"*. If batch A is ruled toward collapsing identical text, those two
become **one row native to New York, Côte d'Azur, Acapulco and St. Moritz** —
four rooms from two claims. If batch A is ruled toward keeping 76, they stay two
rows and each claim does exactly what it says. **Batches A and 7.1 must be ruled
together.**

### 7.2 · The `Also at:` instrument — the fix is present, verified

**Confirmed fixed at root.** `scripts/seed-drinks.mjs`, lines 506–528:

```sql
insert into drink_world (drink_id, world_id, native, affinity, note)
values ($1, $2, true, 1.000, $3)
on conflict (drink_id, world_id) do update
   set native = true, note = excluded.note
 where not drink_world.native and not drink_world.forbidden
```

`do update set native = true` replaced `do nothing` on 2026-08-26. The
sibling's finding was real: against an existing non-native row, `do nothing`
left the claim inert **while the run printed the destination it had not
granted** — rule 24's third instance verbatim.

**And the fix carries a second half worth naming, because it is what makes it
trustworthy:** immediately after the upsert the seeder reads the row back and
throws if `native` is still false, which is the `forbidden` case the `where`
clause deliberately refuses to overwrite. A veto that can be outvoted is not a
veto. So the instrument now fails loudly in the one case it cannot satisfy,
rather than reporting success.

**What still needs saying for atomic rows:** the instrument has still only ever
run against emptiness — `docs/drinks.md` carries zero `Also at:` lines today, so
the `on conflict` branch has never fired in production. CLAUDE.md rule 24's
corollary applies directly: *"never used" means "never tested against the tables
it will actually meet."* The first `Also at:` line to land will be the fix's
first real test. **Force an earlier one** — a dry run against a scratch database
holding pre-existing non-native and `forbidden` `drink_world` rows, before job 2
writes any sharing line. That is a one-off test, not a build.

### 7.3 · Category-3 take-home dependencies watching `the_drinks`

**Seven**, enumerated from the committed `docs/take-home-bank-*.md` category-3
rulings (all dated 2026-08-26, all `STAGED`, all `per_guest`):

| bank item | room | predicate | status today | must watch instead |
|---|---|---|---|---|
| the cork, dated | `new-york` | `yields_cork` | works — New York has 3 programmes | **`the_pour`** |
| the cork with the hour on it | `cote-dazur` | `yields_cork` | works — Côte d'Azur has 4 | **`the_pour`** |
| the labels off the bottles | `cote-dazur` | `yields_label` | works | **`the_pour`** |
| the wire cage | `st-moritz-1984` | `yields_muselet` | **broken** — no drinks | **`the_pour`**, still broken |
| the wire cage, kept | `acapulco-1959` | `yields_muselet` | **broken** — no drinks | **`the_pour`**, still broken |
| the marked cork | `acapulco-1959` | `yields_cork` | **broken** — no drinks | **`the_pour`**, still broken |
| the bottle cap | `aspen-1994` | `yields_bottle_cap` | **broken** — no drinks | **`the_pour`**, still broken |

**All seven re-point at `the_pour` and none at `the_pitcher` or `the_after`.**
The reason is physical and worth writing down rather than deciding by symmetry:
a cork, a wire cage, a soaked-off label and a crown cap all come off a **bottle
that gets opened and poured**. A pitcher is filled from bottles that were opened
somewhere else and never reach the table; a digestif is poured from a bottle
that is opened once and stays. `the_pour` is the slot where bottles are opened
in front of people, so it is the only one of the three that can supply this
family.

**Four report `broken` today, not six.** The claim in `docs/proposals.md` §3 is
six; the committed documents give four, in three rooms (St. Moritz, Aspen,
Acapulco ×2). Palm Springs, Oaxaca and Amalfi have no drinks either but stage no
`the_drinks` dependency. Flagged as a discrepancy per §1 — someone should
reconcile it against the seeded database, which this document cannot reach
(rule 9: the database is unreachable from any laptop).

**And the explosion does not repair any of the four.** Atomization gives the six
empty rooms zero rows. Only a ruled `Also at:` line does: three of the six
affinity claims land in exactly these rooms — 8→Acapulco, 12→St. Moritz,
16→Aspen — and would turn three of the four broken dependencies into working
ones. That is a concrete argument for ruling batch 7.1 rather than deferring it,
and it is an argument about *deliverability*, not taste.

**One sequencing hazard, because it bites before anything else does:** the
migration that deletes the nine `the_drinks` `occasion_slot` rows must insert
the new slot rows **in the same statement or the same transaction**.
`slotsFor()` in `src/lib/desk/coverage.ts` throws by design when a pool has a
slot table and zero `occasion_slot` rows. A migration that deletes first and
inserts second leaves a window in which `/desk/coverage` raises rather than
renders. The message is already written and is correct; the point is that it
will fire.

### 7.4 · The coverage board's drink column → per-slot

**Checked in `src/lib/desk/coverage.ts`. The change is small and the machinery
already exists**, because atmosphere did it first (db/043).

Today: `standing("drinks", "Drinks")` at line 326 and
`drinks: poolCell(destination.id, "drink", "drinks", myDrinks)` at line 352 —
one column, one number per room.

What it becomes: a third `SlotBlock` beside `serve` and `atmosphere` —

```
const bar: SlotBlock = {
  key: "bar",
  heading: "The bar · claims per slot",
  slots: await slotsFor("drink"),
  items: drinks,
  href: "/desk/drinks",
};
```

— then `block(bar)` in place of `standing("drinks", …)`, and
`...blockCells(destination.id, destination.name, bar)` in place of the
`drinks:` cell. The board grows one column per bar slot plus an
`In all · distinct` total, keyed `bar:the_pour` etc. by the existing
`blockSlotKey` / `blockTotalKey` convention.

**Four things this requires, none of them building:**

1. **`slotsFor("drink")` already works.** `drink` has a slot table
   (`install_slot_eligibility('drink')`, db/017) and its `draw` per slot is read
   from `max(occasion_slot.max_count)`. Nothing in `coverage.ts` hardcodes slot
   names or counts — the slots come out of the database, which is rule 19 and
   rule 21 already satisfied. **No registry change is needed.**
2. **The `draw` floor becomes real.** `slotsFor` returns `draw` per slot and the
   cell judges `thin` against it. Under the proposal `the_pour` has draw 2, so a
   room with one eligible pour reads `thin` instead of covered — which is the
   truth the single column could not tell.
3. **`seasonCell` and `occasionCell` still read `myDrinks` flat.** They take
   `[...myDishes, ...myDrinks]` and count spread, not slots. 76 rows instead of
   25 changes those numbers substantially and they should be re-read before
   anyone concludes coverage improved. **A count that moves because the unit
   changed is not coverage that improved.**
4. **`src/lib/desk/coverage.db.test.ts` asserts on per-slot blocks by count**
   (line 331 checks how many blocks exist). Adding a third block will move that
   assertion. Expected, not a regression.

### 7.5 · Gate work already built against programmes

Checked against `src/lib/catalogue/tagging.ts`. Three findings, and the first is
a live trap.

**(a) The venue requirement on programme 21 breaks silently.** The tagger is:

```sql
insert into ingredient_requirement (entity_table, entity_id, requirement, note)
select 'drink', d.id, 'requires_open_flame', 'Authored as "' || d.name || '".'
  from drink d
 where d.name ilike '%fire-lit%'
```

It matches on `drink.name`, and `drink.name` is the **third bullet** — *"A
fire-lit dinner"* — not the drink. **Atomization replaces `name` with the drink
itself** (*"Margaritas at sunset"*, *"California red by the fire"*, *"Hot
toddies when the fog comes in"*). None contains `fire-lit`. **The match returns
zero, the insert succeeds, nothing throws, and the catalogue's only drink-side
venue requirement disappears.**

This is exactly db/022's failure re-run: a statement that looks right, runs
clean, raises nothing and does nothing. The tagger does have a guard —
`tagVenueRequirements` counts rows by requirement code and the build test fails
on an empty derived table — but the table will not be empty; it will be short by
one, from menus that still match. **A count that is smaller than it was is
invisible unless somebody wrote down what it was.** Recommend: before job 2
runs, record the current per-code counts, and add the drink-side count as its own
assertion.

Where the requirement must go is a genuine question, and it is not obvious:
"A fire-lit dinner" describes **the evening**, not any one of the three drinks.
21.2 *California red by the fire* and 21.3 *hot toddies when the fog comes in*
both name the fire; 21.1 *margaritas at sunset* does not. All three rows are
flagged `FLAME?` rather than tagged. **Her call**, and the honest options are:
tag 21.2 and 21.3 only, tag all three, or accept that a programme-level venue
requirement has no atomic home and let it lapse with the programme — which is a
real answer, since retiring the programmes retires the evening the requirement
described.

**(b) `drink_occasion` stays at zero, and the argument survives atomization
unchanged — in fact it gets stronger.** The tagger writes zero rows *deliberately*
and counts what a naive parser would have matched so the refusal is a measured
finding rather than a silence (20 of 25; re-derived in §1). At the atomic level
the argument is stronger, not weaker: the "what it's for" line was at least a
property of the programme. It is not a property of a gin and tonic. **A gin and
tonic is not "a summer dinner or cocktail party".**

What moves is *where the line goes*. It cannot be the atomic row's `name` — that
is the drink — and it must not become an occasion claim. **Recommendation: it
becomes a provenance field on the row** (the programme it came from and that
programme's meal shape), so that the desk can still show a curator *"this row
came from 'A summer dinner or cocktail party'"* without any part of the system
reading it as a claim. That keeps rule 16 satisfied: the input is carried and
visibly not honoured as a claim, rather than absorbed quietly.

`matchedOccasionWords()` and `occasionClaim()` need no change — they take a
string. What changes is that they will be called 76 times instead of 25, and the
tempted-row count will move. **Whoever changes the unit must re-record that
number**, or the desk to-do (`drink:occasion-unclaimed`) will report a count
nobody can reconcile.

**(c) `season_strict`: 14 of 25 today, re-derived and confirmed.** Programmes 1,
2, 3, 4, 6, 8, 9, 10, 12, 15, 16, 17, 24, 25 derive strict; 5, 7, 11, 13, 14, 18,
19, 20, 21, 22, 23 derive soft. On atomic rows this becomes **14 programmes' worth
= 43 of 76 rows strict, 33 soft**, if the derivation is carried unchanged. The
derivation only ever tightens and never retracts without `--overwrite`, which is
rule 16 honoured — and it reads `season_note`, which §6 Loss 3 says must survive
onto the atomic row or the whole derivation goes mute.

---

## 8 · Verification

**`npm test` is NOT at 343 pass / 0 fail.** Confirmed rather than assumed, per
instruction. Run twice on `0cf0bd6`:

```
1..425
# tests 425   # pass 342   # fail 1   # skipped 77   # todo 5
```

The one failure is **pre-existing and unrelated to drinks**:

```
not ok 415 - every shipped tone has a mark, and every mark has a tone
  src/lib/voice.test.ts:453
  a mark exists for a DRAFT tone no host can be shown:
  bigger_every_telling, toasts_everything.
```

`git status` shows the cause: two untracked tone-icon SVGs
(`design/tone-icons/bigger_every_telling.svg`,
`design/tone-icons/toasts_everything.svg`) and a modified
`design/tone-icons/labels.json` in the working tree. Art was added for two tones
that are still `draft`. **This belongs to whoever is doing the tone-icon work,
not to this pass**, and it is reported rather than touched. This document
changes no code, so the count is unchanged by it — but "343 / 0" was not the
baseline when this job started, and reporting it as if it were would be a report
generated from something other than reality.

**The conversion table was counted mechanically, not eyeballed.** The table in
§2 was re-read by column and every total cross-checked against the source
programmes:

| check | table says | source says |
|---|---|---|
| atomic rows | 76 | 76 |
| rows with an em-dash mirror | 21 | 21 owed |
| rows flagged `MIRROR-OWED` | 21 | — *(the two must agree, and do)* |
| rows flagged `TEMPT:` | 61 | 61 *(the 20 tempted programmes' row counts, summed)* |
| rows flagged `OCC-NONE` | 76 | all of them |
| season `summer / any / winter / fall / ?` | 28 / 22 / 14 / 9 / 3 | 28 / 22 / 14 / 9 / 3 |
| mixing `half made / actually mixed / bought and poured` | 34 / 22 / 20 | 34 / 22 / 20 |
| rows per room | 9·6·9·11·7·6·3·3·6·3·6·7 | same, and sums to 76 |

Two errors were found this way and corrected before this document was finished:
a `TEMPT:dinner` flag on row 17.3 (the *drink* says "after dinner"; its
programme's name is "After a day outside" and matches nothing — the flag belongs
to the programme name, never to the drink), and a batch B grouping that filed
Manhattans and martinis under "spirits poured neat". Both were invisible to
reading and fell to a count, which is the whole of rule 24.

**Distances and affinity numbers:** none quoted (rule 7). `npm run check:matrix`
was not run because nothing here needed a distance; the six corner tests behind
the affinity claims are cited to `docs/drink-affinity-pass.md` and flagged in
§7.1 as needing re-running against atomic rows before any claim is committed.

**One documentation error found in passing:** `docs/drinks.md` line 3 says
*"Thirteen destinations, twenty-five programmes."* There are **twelve**
destination headings in the file, and line 244 of the same document says twelve.
The thirteenth was Cap Ferrat, retired by db/028. Not corrected here — that file
is hers.

---

## 9 · What job 2 needs from her, in one list

1. **Batch A** — collapse identical text at the atomic level, or keep 76 rows?
   *(Recommend: keep 76.)* Rule this together with §7.1.
2. **Batch B** — author 21 owed mirrors: all 21 / the easy 13 only / none?
3. **Batch C** — confirm or overturn 15 judgement-assigned mirrors, of which 3
   are contested by name.
4. **Batch D** — "nothing else" rejected; programme 12 reversed; 14.1 as one row;
   4 self-mirrors legitimate.
5. **Batch E / §6** — where does `shoulder` go? Is the five-value vocabulary
   drinks-only or catalogue-wide? **Does `season_note` survive onto the row?**
   *(Recommend: yes, or the 14-of-25 gate goes mute.)*
6. **Batch F** — 13 rows whose inherited mixing level contradicts the drink.
7. **Draw counts** — §4's table, or her own numbers.
8. **§7.1** — the six affinity claims, now re-scoped; two of them (drinks 1 and
   10) had their only objection removed by atomization.
9. **§7.5(a)** — where the `requires_open_flame` requirement goes when
   "A fire-lit dinner" stops being a row's name.
