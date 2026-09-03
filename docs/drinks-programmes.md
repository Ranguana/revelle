# The twenty-five drink programmes — the record, kept whole

**Superseded, not deleted (CLAUDE.md rule 14).** These twenty-five records were
`docs/drinks.md` from the day the drinks were authored until the atomisation.
They are here verbatim — her words, her punctuation, her numbering — because the
seventy-six atomic drinks in `docs/drinks.md` are what these were split *into*,
and in six months the part that gets lost is the reasoning, not the rows.

Nothing reads this file. `scripts/seed-drinks.mjs` reads `docs/drinks.md` and
only that.

## What they were

Five bullets per entry, position-delimited: **cocktails in order · mocktail
mirrors · what it's for · season · how much mixing.** One row bundled several
drinks, their mirrors, a meal shape, a season and a supply mode. Twelve
destinations, twenty-five programmes, seeded as `drink-01` … `drink-25`.

## What beat them

The founder, in one session: *"the drinks were never fixed, still showing as
part of a menu"* — and then *"yes fix drinks"*.

The unit of selection was a whole bar. A room with one programme poured the same
three things at a February birthday and a July anniversary; Big Sur got
margaritas, California red and hot toddies, in that order, forever. That is not
a shallow pool, it is a pool with no combinatorics at all, because the thing
being drawn is the evening's entire bar.

`docs/drink-explosion.md` — committed, counted rather than eyeballed — converted
these twenty-five into **76 atomic drinks: 55 paired with the mirror their
author wrote, 21 whose mirror is owed and was not invented.** `db/060` retires
these rows (`status = 'discontinued'`, with the reason in the column, never
deleted) and `docs/drinks.md` now holds the atomic form.

## What was RIGHT about them, and survived

Three things, and they are the reason this file exists rather than a commit
message.

**The mirror is the whole point, and it is still the whole point.** The opening
essay of the old document is unchanged at the top of the new one. What changed
is only that the atomic grain made twenty-one missing mirrors *visible*; the
programme grain hid them by putting three drinks and two mirrors on one line,
where the arithmetic never had to balance.

**The "what it's for" line was a real fact about a programme.** "A summer dinner
or cocktail party" describes an evening somebody is having. It stopped being a
property of the row only because the row stopped being an evening — a gin and
tonic is not a summer dinner or cocktail party. The sentence did not get poorer;
it is preserved here, and it is what every atomic drink's meal-shape claim was
read from.

**One programme-level answer over three drinks was the right answer to a
programme-level question.** `Half made` across gin and tonics, whiskey sours and
sangria is not sloppy authoring — it is the honest answer to "how much mixing is
this bar", asked of a bar. `docs/drink-explosion.md` §5 batch F lists the
thirteen atomic rows where the inherited value now contradicts the drink in
front of it. **They are inherited unchanged and flagged, not corrected**: which
way each of the thirteen goes is hers, and `making_level` feeds
`made_by_hand_weight()`, so a guess there is a guess that scores.

---

# The twenty-five, verbatim

Fields per entry: **cocktails in order · mocktail mirrors · what it's for ·
season · how much mixing.**

## Westhampton

**1.**
- Gin and tonics in tall glasses, whiskey sours, sangria in a pitcher
- Tonic and lime with cucumber, sour made with lemonade and egg-white foam, fruit punch from the same pitcher fruit
- A summer dinner or cocktail party
- Summer
- Half made

**2.**
- Manhattans, Harvey Wallbangers (vodka, orange juice, vanilla-liqueur float), brandy after dinner
- Cherry-and-orange soda in a coupe, spiced cider warm or cold
- A dressed-up dinner
- Fall
- Actually mixed

**3.**
- Bloody marys, mimosas, cold beer in the fridge door
- Virgin marys, orange juice and soda water
- Brunch
- Summer
- Bought and poured

## Nantucket

**4.**
- Cape Codders (vodka, cranberry, lime), cold beer in a cooler, dark rum and ginger beer with lime
- Cranberry-lime soda, ginger beer with lime
- An outdoor dinner or porch night
- Summer
- Bought and poured

**5.**
- Hot buttered rum, whiskey with one ice cube, mulled cider with rum
- Mulled cider straight, hot chocolate
- A rainy lunch or cozy dinner
- Shoulder season and fall
- Half made

## New York

**6.**
- Manhattans, very dry martinis, sidecars (cognac, orange liqueur, lemon), brandy after
- Lime rickey (lime, soda, a little syrup), bitter lemon soda in a martini glass
- A formal dinner party
- Winter
- Actually mixed

**7.**
- Very cold martinis, negronis, red wine in tumblers with dinner
- Bitter orange soda over ice with an orange peel, grape juice cut with soda in a tumbler
- A loft dinner or long Sunday
- Any
- Half made

**8.**
- Champagne, champagne cocktails (sugar cube, bitters), nothing else
- Sparkling cider with a sugar cube and orange peel
- A late supper after a show
- Winter
- Bought and poured

## Côte d'Azur

**9.**
- Kir (white wine, crème de cassis), pastis with water, cold rosé through lunch
- Citron pressé (fresh lemon, sugar, cold water, self-mixed at the table), sparkling water with cassis syrup
- A long lunch or garden drinks
- Summer
- Bought and poured

**10.**
- Red wine with dinner, cognac after, a small sweet wine with dessert
- Poached-pear syrup with soda, chilled verbena tea
- A quiet off-season dinner
- October
- Bought and poured

**11.**
- Kir royales, French 75s (gin, lemon, champagne), cold rosé
- Sparkling grape juice with cassis syrup, lemon soda in a flute
- A dressed-up dinner or beach lunch
- Spring and summer
- Half made

**12.**
- Champagne, brandy alexanders after dessert (cognac, chocolate liqueur, cream)
- Chocolate cream shake in a coupe with nutmeg, sparkling cider
- A midnight supper
- Winter
- Actually mixed

## Vegas

**13.**
- Martinis, old fashioneds, whiskey sours, a gimlet or two (gin, lime cordial)
- Shirley Temples with extra cherries, lime cordial and soda in a gimlet glass, bitters and soda
- A steakhouse dinner
- Year-round
- Actually mixed

**14.**
- Champagne and orange juice separately or together, bloody marys, black coffee
- Orange juice in a flute, virgin marys, black coffee
- A midnight breakfast
- Year-round
- Bought and poured

## Catskills

**15.**
- Tom Collinses, whiskey sours, seltzer with everything
- Lime rickeys, seltzer with fruit syrups in the same tall glasses
- A summer dinner or lake day
- Summer
- Half made

**16.**
- Mulled cider with apple brandy, hot toddies, whiskey by the fire
- Mulled cider straight, hot lemon and honey
- A cabin dinner
- Fall
- Half made

## Dolomites

**17.**
- Hot spiced wine, bombardino (warm egg liqueur, brandy, whipped cream), grappa after dinner
- Hot spiced grape juice, hot chocolate with whipped cream in the same mug
- After a day outside
- Winter
- Half made

## Tahiti

**18.**
- Rum punch in a pitcher, mai tais (rum, lime, orange liqueur, almond syrup), cold beer
- Pineapple-lime-coconut punch from the same pitcher fruit, coconut water with lime
- An outdoor dinner or beach lunch
- Warm weather
- Half made

## Havana

**19.**
- Daiquiris shaken (rum, lime, sugar), mojitos, Cuba libres
- Fresh limeade with mint in the same glass, lime and cola with a lime wheel
- A long dinner party
- Year-round
- Actually mixed

**20.**
- Rum old fashioneds, cold beer, strong sweet coffee
- Spiced ginger soda over ice with orange peel, the same coffee
- A late supper after dancing
- Year-round
- Half made

## Big Sur

**21.**
- Margaritas at sunset, California red by the fire, hot toddies when the fog comes in
- Hibiscus iced tea with lime in the same glass, hot honey-lemon
- A fire-lit dinner
- Year-round
- Half made

## New Orleans

**22.**
- Sazeracs (rye, sugar, bitters, anise rinse), vieux carrés (rye, cognac, vermouth), wine with dinner
- Cold sweet tea with lemon peel in the same rocks glass, sparkling water with peach syrup
- A dressed-up dinner
- Winter or spring
- Actually mixed

**23.**
- Milk punch (bourbon, milk, vanilla, nutmeg), ramos gin fizzes, mimosas
- Vanilla milk with nutmeg in the same glass, orange-cream fizz, orange juice in a flute
- A late brunch
- Any
- Actually mixed

## Portofino

**24.**
- Spritzes at golden hour, negronis, cold white wine with dinner, icy lemon liqueur after
- Italian bitter-orange soda over ice with an orange slice, sparkling lemonade in the wine glass, icy lemon-sugar cordial in the same tiny glass
- Golden-hour drinks into dinner
- Summer
- Half made

**25.**
- Cold white wine, cold beer, a thermos of espresso
- Sparkling lemonade, chinotto (Italian bitter cola), the same espresso
- A boat or beach day
- Summer
- Bought and poured

---

## The one fragment that was never a drink

Programme 8's cocktails line ends *"…champagne cocktails (sugar cube, bitters),
nothing else"*. **"Nothing else" is rejected as prose**, not minted as a
seventy-seventh row. It is an authorial closure on the line — a comma-splitter
mints it and produces a drink called "nothing else". This is the one rejection
the conversion made, and it is recorded here because a future reader counting
commas will otherwise find 77 where the catalogue says 76.
