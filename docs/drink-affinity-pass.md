# The drink affinity pass

One question: of the twenty-five drink programmes that exist, which ones
legitimately belong in a room other than the one they were written under.

Nothing here is authored. No new programme is proposed and no existing row is
changed. Six claims are recommended, nineteen programmes are recommended never
to travel at all, and the reasons for both are below.

Sources read: `docs/drinks.md` (the twenty-five entries), `scripts/seed-drinks.mjs`
(the parser and the claim writer), `scripts/catalogue-vocabulary.mjs` (the slug
map and the season map), `data/destination-matrix.json` (rows, gate, twin rule),
`src/lib/destinations.ts` (the twelve authored premises, per room),
`src/lib/selection/occasion.ts` and `src/lib/selection/fill.ts` (what a claim
actually does), `db/019-scoped-to-a-destination.sql`, `db/026-when-is-it.sql`,
`docs/destination-contrasts.md`, `docs/decor-sources.md`,
`docs/take-home-bank-*.md`, `docs/proposals.md`, `docs/needs-a-human.md`.

---

## 1 · The instrument is wrong, and this has to be said first

**The task asked for `native = false` affinity rows. Those rows would do
nothing.** Not "less than hoped" — nothing. They would be written, they would
render at the desk, no test would go red, and no member would ever get a drink
out of one.

The chain, verified end to end:

- `scripts/seed-drinks.mjs` writes `native = true, affinity 1.000` for every
  destination heading an entry sits under. All twenty-five programmes therefore
  carry at least one native row. (Confirmed: zero non-native `drink_world` rows
  exist.)
- `worldEligibility()` → `claimEligibility()` in `src/lib/selection/occasion.ts`:
  *"any 'native' claim → those values and no others. Naming one is opting into a
  whitelist."* And, on the world axis specifically: *"neither → **NOT A CLAIM**.
  `affinity` re-weights the score and says nothing about eligibility."*
- `src/lib/selection/fill.ts:461` reads `scope?.affinity` **only for candidates
  that already cleared eligibility.**

So an affinity row on a programme that is natively claimed somewhere else is a
weight applied to a candidate that was already rejected. It is
`db/019`'s own argument, stated there at length, arriving from the other
direction: db/019 exists precisely because affinity used to be *"a weight
pretending to be a filter"*, and it is now a filter that a weight cannot reach.

This is **CLAUDE.md rule 16** in its exact shape — an input that looks honoured
from every angle: the row inserted, the column populated, the desk rendering it,
nothing thrown. And **rule 20**: a report generated from something other than
reality is the most convincing failure this system produces. Thirty affinity
rows would be a coverage board reporting a bar that does not pour.

**The instrument that works already exists and is unused.** `seed-drinks.mjs`
parses an optional sixth bullet:

```
- Also at: Catskills, Aspen
```

and writes a second `native = true` row. Its header says so and says the
current state plainly: *"NOTHING IN `docs/drinks.md` USES EITHER TODAY. Seeding
the file as it stands produces twenty-five programmes with one destination
each."*

**Every claim below should be authored as an `Also at:` line in
`docs/drinks.md`, not as an affinity row.** That keeps the founder's own
document the source (rule 8 — the file is where a human decides), keeps the
claim inside the parser's own failure modes, and produces a row the selection
engine actually reads. I have kept the requested block format, and each block
says which instrument it means.

### One thing an `Also at:` line does NOT fix, and it constrains the whole pass

The second native row shares **the entire programme row**, verbatim:
`cocktails`, `mocktails`, `name`, `season`, `season_note`, `making`. There is no
per-room override anywhere in `db/017` or the desk forms.

Two consequences that decided several verdicts below:

- **The `name` travels.** `name` is her sentence — *"A summer dinner or lake
  day"*, *"A boat or beach day"*, *"A cabin dinner"* — and `db/026` refused a
  `meal_shape` column specifically because *"both already say what they are for
  in a `name`, in her own words, and that sentence is richer than an enum."* A
  programme whose name states its native geography cannot travel; a guest reading
  "or lake day" in a French Quarter courtyard has found the seam. **This is the
  test that killed drink 15 and half-killed drink 7.**
- **One wrong word cannot be edited out.** Drink 10 is a near-perfect Dolomites
  programme except that it says *cognac* where the Dolomites take *grappa
  standing*. Sharing the row imports the cognac. That is why it is marked thin
  rather than fair.

### And a note-column correction

`seed-drinks.mjs` writes the same note on every claim it makes: *"Written for
this destination. `docs/drinks.md`."* On a second native row derived from
affinity that sentence is **false** — the programme was not written for that
destination, it was found to fit it. In the spirit of rule 17 (a claim carries
its reason, in a column, not in a commit message), a travelled claim needs its
own note. Suggested wording is given in each block.

---

## 2 · What is actually in the pool

Twenty-five programmes, twenty-five claims, all native, zero affinity rows,
thirteen headings in `docs/drinks.md` mapping to twelve authored rooms plus
Westhampton.

The brief's claim tally omitted two rooms. For the record, from the file:

| room | claims | season bands held |
|---|---|---|
| cote-dazur | 4 | summer ×2, autumn, winter |
| new-york | 3 | winter ×2, year_round |
| westhampton-1976 | 3 | summer ×2, autumn |
| catskills | 2 | summer, autumn |
| havana | 2 | year_round ×2 |
| las-vegas | 2 | year_round ×2 |
| nantucket | 2 | summer, shoulder |
| new-orleans | 2 | winter, year_round |
| portofino | 2 | summer ×2 |
| big-sur | 1 | year_round |
| dolomites | 1 | winter |
| tahiti | 1 | summer |
| **acapulco-1959** | **0** | — |
| **amalfi-1953** | **0** | — |
| **aspen-1994** | **0** | — |
| **oaxaca-1954** | **0** | — |
| **palm-springs-1965** | **0** | — |
| **st-moritz-1984** | **0** | — |

18 + 7 = 25. `docs/proposals.md` §3 already found the consequence: *"six of the
eighteen rooms have NO eligible drink at all… the cork exists because the drink
programme pours bottles, and in Acapulco it does not pour anything."*

### The season mechanism, stated correctly, because it changes what the fix is

`season_strict` is **never written by the seeder** — `seed-drinks.mjs` says so
in the `--overwrite` branch: *"`docs/drinks.md` names no hard-filter list, so the
file has nothing to say about it."* It defaults `false` (`db/017:203`), and
`fill.ts:386` gates on season *only when strict is true.*

**So no drink in this catalogue is season-gated today.** The February party does
not get an empty bar; it gets the summer bar, pouring gin and tonics in tall
glasses, with `season_note` reading "Summer" on the sheet.

That means the founder's complaint is not a filter defect. It is a content
defect: a room with one programme has nothing *else* to offer, whatever the
date. And `db/026` settles the framing — *"NO SEASON WEIGHT ON A DESTINATION.
A destination is not a place and not a date. WESTHAMPTON, 1976 in February is a
February Westhampton, and what changes is what is on the table."* A room is not
a winter room. A room needs a bar that spans bands. Section 5 counts the gaps on
that basis.

---

## 3 · The tests every claim below had to pass

1. **The year test.** Every drink named in the `cocktails` line existed, and was
   plausibly ordered, in the receiving room's year and place. Stated per claim.
2. **The name test.** The programme's `name` must not name the native room's
   geography, meal shape or weather in a way the receiving room contradicts.
3. **The corner test.** No claim may be shared between two rooms already at or
   below the gate (3) in `data/destination-matrix.json`. This is CLAUDE.md rule 4
   applied to the bar, and it killed more candidates than the year test did.
4. **The cuisine test.** Rule 6, transposed: a drink travels within its *drinking
   culture*, not its temperature. "Cosy alpine warmth" is not a cuisine, and hot
   buttered rum is Anglo-American whatever the altitude.
5. **The signature test.** A programme the room was written *to* does not leave.

### The corners the matrix already has, which govern half of this pass

From `docs/destination-contrasts.md`, gate = 3:

| distance | pair | consequence for drinks |
|---|---|---|
| **0** | Nantucket 1972 / Big Sur 1971 | *"the matrix cannot tell them apart at all."* No drink may be shared. |
| 1 | Havana 1957 / New Orleans 1956 | declared twin. No drink may be shared. |
| 1 | Côte d'Azur 1962 / Portofino 1961 | *"the open question of whether Portofino exists."* No drink may be shared. |
| 2 | Las Vegas 1960 / New York 1938 | undeclared sub-gate pair. No drink may be shared. |
| 2 | Westhampton 1976 / Nantucket 1972 | qualifies, deliberately not declared. No drink may be shared. |
| 2 | St. Moritz 1984 / Acapulco 1959 | declared twin, UNVERIFIED. No drink may be shared. |
| 2 | Aspen 1994 / Oaxaca 1954 | declared twin, UNVERIFIED. No drink may be shared. |

Seven corners. Between them they close off almost every pairing that *felt*
obvious on first read, which is the point: the rooms that want to share a bar are
exactly the rooms the matrix is already struggling to keep apart. `docs/decor-sources.md`
records what happens when this is not enforced — *"28 of 80 rows serve both
Portofino and Côte d'Azur… If the selection engine is meant to make those two
feel like different places, this catalogue will not do it."*

---

## 4 · The claims

Six. Four into rooms that currently have no bar at all.

### Bloody marys, mimosas, cold beer (drink 3) → catskills

- **from:** westhampton-1976 · **claim:** second native row, `Also at: Catskills`
- **why it belongs:** Catskills is the only room in the catalogue whose authored
  day *starts in the morning* — *"Eleven in the morning and the bell's already
  been rung once, just to test it"* — and it has no morning programme; bloody
  marys, mimosas and cold beer in the fridge door is what a camp office puts out
  before the first tray.
- **year test:** 1976 → 1963 is eleven years backwards, so the risk is
  anachronism *forward*, and there is none: the bloody mary is 1939, the mimosa
  1925, cold beer is not dated. Nothing in the line is a 1970s order.
- **corner test:** Westhampton / Catskills sit at distance 5 (arrival, schedule,
  food, ending, starts). Clear.
- **name test:** the `name` is the single word "Brunch". Nothing in it names Dune
  Road.
- **confidence:** strong
- **note to write:** *"A camp morning, not a beach morning. Shared from
  Westhampton because Catskills starts at eleven and had no morning bar."*

### Champagne, champagne cocktails, nothing else (drink 8) → acapulco-1959

- **from:** new-york · **claim:** second native row, `Also at: Acapulco`
- **why it belongs:** Acapulco's arrival act *is* a cold glass — *"no door to
  arrive at — the terrace absorbs you, hands you something cold"* — its declared
  vessel is the champagne **coupe** (*"the era's glass — St. Moritz gets flutes;
  the glass dates the room"*), its host act is *"the loud cork as punctuation"*,
  and its evening runs divers-at-dusk → dinner → band, which is a late supper
  after a show in all but the word.
- **year test:** 1938 → 1959. The champagne cocktail (sugar cube, bitters) is
  1860s and was still a hotel-bar standard in 1959; the coupe is the 1959 glass,
  not a revival. Nothing in the line postdates either year.
- **corner test:** New York / Acapulco differ on six facets (arrival, schedule,
  volume, ending, size, spectacle). New York's dangerous neighbour is Las Vegas
  at 2, and this claim does not go there.
- **name test:** *"A late supper after a show"* names no city and no weather, and
  is arguably truer of a room whose `spectacle` cell is `performed` than of New
  York, whose cell is `nothing`.
- **confidence:** fair — held back from strong by the `season` band, which reads
  Winter and will print "Winter" on a tropical room's sheet. It gates nothing
  (`season_strict` is false) but it reads wrong, and a per-room season override
  does not exist.
- **note to write:** *"Champagne and nothing else, for the room whose glass is
  the coupe and whose act is the cork. Season band is New York's; read it as the
  hour, not the month."*

### Champagne, brandy alexanders after dessert (drink 12) → st-moritz-1984

- **from:** cote-dazur · **claim:** second native row, `Also at: St. Moritz`
- **why it belongs:** St. Moritz's own route to a drink programme is *"champagne;
  espresso + aged Grand Marnier"*, its evening is *"dinner → fondue → the
  room-change turn → dancing → dawn eggs"*, and its register is *"formality
  three: dress AND protocol, worn as irony"* — a brandy alexander after dessert
  in 1984 is exactly the ironic-formal order that room places.
- **year test:** 1962 → 1984. Both drinks predate 1962 (brandy alexander, 1920s)
  and both are alive in 1984 — the brandy alexander deliberately so, as a dated
  drink ordered knowingly, which is the room's whole posture.
- **corner test:** Côte d'Azur / St. Moritz differ on six facets. Critically,
  this does **not** touch the Portofino / Côte d'Azur corner at 1: the claim goes
  north, not along the coast.
- **cuisine test — and why this one and not another Côte d'Azur programme:**
  drink 12 is the only one of the four with nothing Provençal in it. No kir, no
  cassis, no pastis, no rosé, no citron pressé. Champagne and a brandy alexander
  are international hotel-bar repertoire — the `repertoire` tier of rule 6, not
  the `regional` one. Drinks 9 and 11 are the room's spine and stay.
- **name test:** *"A midnight supper"* is fully generic and is the hour St.
  Moritz's row (`evening` / `until_morning`) actually occupies.
- **confidence:** fair — the one seam is the glass. A brandy alexander is served
  in a coupe, and `take-home-bank-catskills-…` assigns coupes to Acapulco and
  flutes to St. Moritz on the grounds that *"the glass dates the room."* The
  programme names no vessel, so nothing is written down wrong, but the bar will
  reach for one.
- **note to write:** *"The one Côte d'Azur programme with nothing Provençal in
  it. Shared north for the midnight hour, not for the coast."*

### Mulled cider with apple brandy, hot toddies, whiskey by the fire (drink 16) → aspen-1994

- **from:** catskills · **claim:** second native row, `Also at: Aspen`
- **why it belongs:** Aspen is *"the anti-glassware room — mismatched pint
  glasses and whatever mugs exist"*, and this is the only programme in the
  catalogue built entirely for mugs; *"whiskey by the fire"* is the room's own
  declared whiskey line, and its host act is *"the round poured at the story's
  peak."*
- **year test:** 1963 → 1994, thirty-one years forward, and every drink in it is
  older than both dates — mulled cider is medieval, the hot toddy 18th century,
  applejack colonial American and nationally distributed long before 1994.
  Nothing in the line reads as a 1963 period piece.
- **corner test:** Catskills / Aspen differ on four facets (arrival, volume,
  ending, starts) — above the gate but the narrowest margin in this pass, and
  worth saying out loud. Aspen's sub-gate partner is Oaxaca at 2, which this
  claim does not touch.
- **name test:** *"A cabin dinner"* — Aspen's contrast brief asks for *"a house
  rather than a hotel"*, which is the same sentence.
- **confidence:** fair. Two reservations, both stated rather than smoothed:
  the `season` band is autumn, which for a ski room is mud season and the wrong
  half of the year; and this is emphatically **not** the Aspen signature, which
  the bank already names (*"era shot pours — Jägermeister, peppermint schnapps
  (pre-Red-Bull; no anachronistic bombs)"*). It gives the room a fireside bar,
  not its own bar.
- **note to write:** *"Mugs, not glasses — shared for the room that owns no
  glassware. Its own programme is still owed."*

### Red wine with dinner, cognac after, a small sweet wine (drink 10) → dolomites

- **from:** cote-dazur · **claim:** second native row, `Also at: Dolomites`
- **why it belongs:** the Dolomites is the only authored room in the catalogue
  with exactly one programme *and* exactly one season band, and it is winter; a
  September Dolomites party currently gets hot spiced wine and bombardino. This
  is the file's only quiet off-season dinner, and *"one pot on a long table"* in
  a house at the bottom of a closed run in October is that dinner.
- **year test:** 1962 → 1956, six years backwards, and the programme names
  nothing dated at all — red wine, a digestif, a dessert wine. No period
  objection in either direction.
- **corner test:** Côte d'Azur / Dolomites differ on six facets. Clear, and again
  it does not touch the Riviera corner.
- **confidence:** **thin**, and here is plainly why it is still worth the
  founder's attention. The seam is one word: the programme says **cognac**, and
  the Dolomites' own drink 17 says *"grappa after dinner"*. Putting a French
  digestif into a room that has already declared an Italian one is the room
  contradicting itself at its own bar — the drinks equivalent of rule 6's
  chicken parmesan in Portofino. A second native row cannot edit that word out.
  **It is worth her attention anyway, because it makes the choice explicit:**
  either accept an imperfect off-season bar in the room that most needs one, or
  commission a Dolomites shoulder programme with grappa in it — which is a
  two-line authoring job and the answer I would actually recommend. Do not adopt
  this silently; adopt it as a stopgap with a date on it, or decline it and
  write the two lines.
- **note to write:** *"Off-season cover, borrowed. The digestif is wrong for this
  house and this row retires when a Dolomites shoulder programme is written."*

### Gin and tonics in tall glasses, whiskey sours, sangria (drink 1) → palm-springs-1965

- **from:** westhampton-1976 · **claim:** second native row, `Also at: Palm Springs`
- **why it belongs:** Palm Springs is the most bar-forward room in the catalogue
  and has no bar — its declared objects are *"circulating trays; citrus bowl;
  poolside glassware"*, the anodized aluminium tumbler *"the era's poolside
  glass"*, a printed swizzle stick and a drink flag. "Gin and tonics in tall
  glasses" is the tumbler; the mocktail line's *"fruit punch from the same
  pitcher fruit"* is the citrus bowl; the `name` is "A summer dinner or cocktail
  party" and the room is an afternoon cocktail party by a pool.
- **year test:** this is the load-bearing check and it is close. Gin and tonic
  and the whiskey sour are 19th century and were both squarely fashionable in
  1965. **Sangria is the problem**: it enters American use around the 1964 New
  York World's Fair, which makes it *one year old* in a 1965 room. That is either
  exactly right — a Palm Springs modernist party is precisely where a
  just-arrived drink would land first — or a year too early. **This is a founder
  call, not a research call.**
- **corner test:** Westhampton / Palm Springs differ on five facets. But
  `take-home-bank-catskills-…` separately names *Westhampton 1976* as Palm
  Springs' **contest risk**, and the two rooms converge exactly here: both
  `bought`, both `crowd`, both coloured-glass. A shared bar narrows a gap a human
  has already flagged by hand.
- **confidence:** **thin**, and worth her attention for one reason: Palm Springs
  reports BROKEN today. `docs/proposals.md` §3 — *"Six of the twenty staged rows
  watch `the_drinks` in a room with no drink programme."* This claim turns a
  broken dependency into a working one for the cost of one contestable word and
  one narrowed gap. **My recommendation is to hold it and let the sibling author
  a Palm Springs programme instead** — the bank already specifies it down to the
  glassware — and to adopt this only if that authoring will not land soon.

---

## 5 · Rooms still thin after the pass

Claims go from 25 to 31. No room loses anything; six rooms gain one.

| room | before | after | still missing |
|---|---|---|---|
| cote-dazur | 4 | 4 | shoulder. The best-covered room in the file. |
| new-york | 3 | 3 | summer, autumn — but `year_round` covers every date |
| westhampton-1976 | 3 | 3 | **all cold-weather cover.** See below. |
| catskills | 2 | **3** | winter, shoulder, year_round — **the count moved, the seasons did not** |
| dolomites | 1 | **2** | summer, spring, year_round |
| **acapulco-1959** | 0 | **1** | everything but winter |
| **aspen-1994** | 0 | **1** | everything but autumn — including **winter**, in a ski room |
| **palm-springs-1965** | 0 | **1** | everything but summer |
| **st-moritz-1984** | 0 | **1** | everything but winter |
| havana | 2 | 2 | nothing that matters — both `year_round` |
| las-vegas | 2 | 2 | nothing that matters — both `year_round` |
| nantucket | 2 | 2 | winter, autumn, year_round |
| new-orleans | 2 | 2 | **summer.** A New Orleans courtyard with no summer bar. |
| portofino | 2 | 2 | everything but summer — see below |
| **big-sur** | 1 | **1** | nothing by date (`year_round`), everything by variety |
| **tahiti** | 1 | **1** | everything but summer |
| **amalfi-1953** | 0 | **0** | everything |
| **oaxaca-1954** | 0 | **0** | everything |

**Rooms that stay at one programme or fewer: six.** Big Sur, Tahiti, plus the
four stubs that gain exactly one, plus Amalfi and Oaxaca at zero. Two of these
are authored rooms that have been shipping for some time.

- **big-sur stays at one, and the count hides how well it is doing.** Drink 21 is
  `year_round` and internally seasonal in its own line — margaritas at sunset,
  California red by the fire, hot toddies when the fog comes in. No date breaks
  it. What breaks is repetition: every Big Sur party ever thrown pours the same
  three things. It cannot be helped from the pool, because its only structurally
  legal neighbours are its distance-0 partner Nantucket and rooms with nothing
  Californian in them. **This room needs a second programme authored, not
  claimed.**
- **tahiti stays at one, and is the worst-defended room in the catalogue.** One
  `summer` programme, and it is the room's Polynesian signature. Nothing in the
  file can serve it: Havana's rum is Cuban, Big Sur's margaritas are Californian.
  A February Tahiti gets mai tais and nothing else, forever.
- **catskills is the honest illustration of why counts lie.** It goes 2 → 3 and
  its season gaps are *identical* — drink 3 is `summer`, and Catskills already
  had a summer programme. The claim adds a *meal shape* (a morning) that the room
  demonstrably has and the pool did not. That is real value and it is invisible
  in the count, which is the argument for reporting both.
- **westhampton-1976 cannot be helped, and the reason is structural.** Its three
  programmes are summer, summer, autumn; it has no cold-weather bar of any kind.
  The two programmes in the file that would fix it — drink 5 (hot buttered rum,
  mulled cider) and drink 4 (Cape Codders, cooler beer) — are **both Nantucket's,
  and Westhampton / Nantucket sit at distance 2**, an undeclared sub-gate pair
  that `destination-contrasts.md` says is deliberately not declared because
  declaring it *"would answer a live question by default instead of on purpose."*
  Sharing their bar answers it. Declined on that ground alone.
- **portofino has a season problem its programmes do not know about.** Its
  premise is *"A house above a harbour in the month nobody comes. One restaurant
  is open."* — an explicitly **off-season** room — and both its programmes are
  `Summer`. Drink 10 ("a quiet off-season dinner") is the single best fit for
  that premise anywhere in the file, and it is Côte d'Azur's, at distance 1.
  **Declined.** Making that pair share their off-season dinner is precisely the
  29th of 80 rows `decor-sources.md` warned about, and a Ligurian off-season
  dinner should be authored with an amaro rather than borrowed with a cognac.
- **new-orleans has no summer bar.** Both candidates failed cleanly: drink 1's
  sangria postdates 1956 by eight years, and drink 15 ("a summer dinner or **lake
  day**") fails the name test in a French Quarter courtyard. Needs authoring.

---

## 6 · Programmes that should never travel — nineteen of twenty-five

Not "did not find a home this pass." Should not have one.

**Signature — the room was written to it, or the drink names the region (15):**

| # | programme | why it stays |
|---|---|---|
| 6 | New York, formal dinner party | the engraved card and the long table; the room's centre |
| 7 | New York, loft dinner | see the flag in §7 — it barely fits where it already is |
| 9 | Côte d'Azur, long lunch | kir, pastis, citron pressé — Provençal, and the room's spine |
| 11 | Côte d'Azur, dressed-up dinner | kir royale, French 75 — same |
| 13 | Las Vegas, steakhouse dinner | the room's centre, and Vegas/New York sit at 2 |
| 14 | Las Vegas, midnight breakfast | *"ends in a booth at four in the morning"* — that is the premise, poured |
| 17 | Dolomites, after a day outside | bombardino, grappa, vin brûlé — Italian-Alpine. The bank's own alpine split is *"cheese fondue stays Dolomites' — the mountain pot split"*, and reaching for it from St. Moritz or Aspen would be *"reaching for the country instead of the room"* |
| 18 | Tahiti, outdoor dinner | mai tai and rum punch are Polynesian-pop; also the room's only programme |
| 19 | Havana, long dinner party | `docs/drinks.md` itself: Havana's look, voice and plate were *"written to these two programmes rather than the other way round"* |
| 20 | Havana, late supper after dancing | same |
| 21 | Big Sur, fire-lit dinner | California red and the fog; and its only legal neighbour is its distance-0 partner |
| 22 | New Orleans, dressed-up dinner | sazerac and vieux carré are rule 6's gumbo exactly |
| 23 | New Orleans, late brunch | milk punch and the ramos gin fizz, same |
| 24 | Portofino, golden hour | spritz, negroni, the icy lemon liqueur — and see the flag in §7 |
| 25 | Portofino, boat or beach day | **chinotto is Ligurian** (the myrtle-leaved orange is Savonese). This is the one word that keeps drink 25 out of Amalfi, and it is a good word |

**Blocked by a matrix corner rather than by content (2):**

| # | programme | why it stays |
|---|---|---|
| 4 | Nantucket, Cape Codders | Nantucket sits at **0** from Big Sur and **2** from Westhampton — the only two rooms whose register would take it. Also a place-name drink |
| 5 | Nantucket, hot buttered rum | the same two corners. On content alone this was the best claim in the pass — Big Sur is *"fog until noon"* and drink 21 already says *"hot toddies when the fog comes in"*, one year apart, both `few`/`quiet`/`plain`/`cooked`. **Declined anyway**, because sharing a bar between the two rooms `destination-contrasts.md` says *"the matrix cannot tell them apart at all"* is the worst available move in this file |

**Locked by its own text (2):**

| # | programme | why it stays |
|---|---|---|
| 2 | Westhampton, dressed-up dinner | the **Harvey Wallbanger** dates it to 1969 at the earliest. Only four rooms are period-open (Big Sur 71, Nantucket 72, St. Moritz 84, Aspen 94) and it is a `dressed` programme, which leaves only St. Moritz — whose declared idiom is champagne and aged Grand Marnier, and where a Wallbanger reads as suburban 1973 rather than ironic 1984. A clean year-test kill |
| 15 | Catskills, summer dinner | *"a summer dinner or **lake day**"*. A Tom Collins in a New Orleans courtyard in July is right on every other axis and the `name` names a lake. The name travels; the claim cannot |

---

## 7 · The six stub rooms — what the sibling still has to write

Short answer: **four of the six can be given one working programme from the
existing pool. Two cannot be given anything at all. None of the six gets its
signature this way.**

| room | from the pool | what still must be authored |
|---|---|---|
| acapulco-1959 | drink 8 (champagne) — fair | its cold-arrival drink, and a warm-weather band. The bank already specifies the coupe and the cork |
| st-moritz-1984 | drink 12 (midnight supper) — fair | the espresso + aged Grand Marnier closer, and the dawn-eggs bar. Flutes, not coupes |
| aspen-1994 | drink 16 (mulled cider) — fair | **its own programme.** The bank names it: era shot pours, Jägermeister, peppermint schnapps, *"pre-Red-Bull; no anachronistic bombs"*. Nothing in the pool is that |
| palm-springs-1965 | drink 1 (G&T, sangria) — **thin**, and I recommend holding it | the poolside afternoon programme. The room is specified down to the anodized tumbler and the swizzle stick; this is the easiest of the six to write and should not be borrowed |
| **amalfi-1953** | **nothing** | everything |
| **oaxaca-1954** | **nothing** | everything |

**amalfi-1953 gets nothing, and the near-misses are instructive.** Its own route
is *"lemon liqueur/rosolio closer (homemade technique card — genepì's southern
cousin, shorter lead; **never 'limoncello' as brand for 1953**)"* with *"carafe
wine, unlabeled register"* and majolica.

- Drink 24 carries *"icy lemon liqueur after"* — which is the Amalfi closer,
  arriving from the wrong room. It fails three ways at once: the spritz is
  Veneto, not Ligurian and certainly not Campanian; 1961 → 1953 is backwards past
  the spritz's own spread; and the programme's mocktail line names *"the wine
  glass"* and *"the same tiny glass"*, which is Portofino's stoneware register
  against Amalfi's majolica — the bank's second wall, verbatim.
- Drink 25 is the file's most repertoire-tier Italian programme and reads
  Mediterranean-generic — until **chinotto**, which is Ligurian, and *"cold white
  wine"* against Amalfi's declared *carafe, unlabeled*.

Both declines are rule 6 in its own words: *Ligurian is not Campanian, and
Italian food must not flow freely between Italian rooms.* The bank's five walls
(dose, vessel, national material culture, physics of evidence, size economics)
were built to hold exactly this line, and a shared bar goes under all five.

**oaxaca-1954 gets nothing, and there is no near-miss.** Its route is *"mezcal
(espadín + one wilder), Oaxacan hot chocolate, café de olla"* in clay copitas.
The catalogue contains no Mexican drink anywhere. The only tequila in the file is
Big Sur's *"margaritas at sunset"*, which is Californian-border and Big Sur's
signature, and a margarita in Oaxaca in 1954 is a norteño drink in a mezcal city
— rule 6's error with the country changed. This room is a clean authoring job
with nothing to inherit.

**And the temptation I want to name loudest: Havana → Acapulco.** Two years
apart, both tropical, both `overlapping` / `until_morning` / `crowd`, both with a
rum culture — it is the most natural-looking share in the whole file. It is
wrong four times over. The two rooms are at distance 4 and Acapulco's *voice*
tags already breach the ceiling against Havana at 0.682 (`docs/proposals.md`), so
they are converging in the one space that was supposed to separate them; Acapulco
is a **declared twin of St. Moritz**, so it may not sit close to a third room at
all (rule 4 — twins, never triplets); Havana's two programmes are the ones its
look, voice and plate were written *to*; and Acapulco's own declared drink is
champagne in a coupe, not a daiquiri. **Do not pour Havana in Acapulco.**

---

## 8 · Five things found in the existing data, none of them mine to fix

Recorded here rather than left where they were found — rule 20's second half.

1. **`the_drinks` draws one programme and six rooms cannot supply one.** Already
   found in `docs/proposals.md` §3 and repeated because this pass only moves it
   to four. Two rooms (Amalfi, Oaxaca) will still report BROKEN after any
   affinity pass whatsoever.
2. **Portofino's premise is off-season and both its programmes say Summer.**
   §5. The room whose whole idea is *"the month nobody comes"* has no bar for
   that month.
3. **New York 1938, drink 7: "a loft dinner", with negronis.** A loft as a party
   space is a SoHo idea of the late 1960s and the negroni was close to unknown in
   America in 1938. This is a *native* claim and I am not touching it, but it is
   the same year test I applied to every claim above, and it fails in the room
   it already lives in.
4. **Dolomites, drink 17: bombardino in 1956.** The drink's spread through
   Alpine resort bars is generally dated to the 1970s–80s. If that reading is
   right, drink 17 is a better 1984 programme than a 1956 one — which is a
   question about its **native** claim, not a reason to move it, and worth one
   founder sentence either way.
5. **Portofino, drink 24: the lemon liqueur is Campanian.** By rule 6's own line
   it sits in a Ligurian room while Amalfi, the Campanian room, has no bar at
   all. Not a reason to move it — moving it would collapse the Riviera pair — but
   the reason Amalfi's authored closer should be the *rosolio*, made a different
   way, so that the two lemons are not one lemon.

---

## 9 · Summary

- **6 claims proposed** (4 fair or strong, 2 thin and both argued): drink 3 →
  catskills, drink 8 → acapulco-1959, drink 12 → st-moritz-1984, drink 16 →
  aspen-1994, drink 10 → dolomites, drink 1 → palm-springs-1965.
- **19 of 25 programmes should never travel at all** — 15 signature, 2 blocked by
  a matrix corner, 2 locked by their own text.
- **The requested instrument does not work.** Affinity rows on natively-claimed
  drinks are inert; these must be `Also at:` lines in `docs/drinks.md`, which the
  seeder already parses and nothing currently uses.
- **Claims 25 → 31. Rooms with a bar 12 → 16. Rooms with more than one programme
  9 → 10** (Dolomites is the only room the pass lifts off one).
- **Six rooms still stand at one programme or none**, and two of those — Big Sur
  and Tahiti — are authored, shipping rooms that the pool cannot help. They need
  writing, not claiming.
