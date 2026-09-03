# Revelle Société — the drinks

Authored by Jessica. Source of truth for the drinks pool. Twelve destinations,
seventy-six drinks, split out of the twenty-five programmes she wrote. The menus
are the other half of the same drop: docs/menus.md.

Fields per entry: **the drink · its mocktail mirror · what shape of table it is
for · season · how much mixing.**

## The mirror is the whole point

Every entry carries a **mocktail mirror**: the same glass, built from the same
components, arriving at the same time. Not a separate menu, not something asked
for at the bar — a second column of the same record.

The consequence is the reason it exists: **nobody at the table is visibly not
drinking.** A person who is pregnant, driving, in recovery, on antibiotics, or
simply not in the mood is handed the same tall glass with the same lime wheel as
everyone else, and no one has a conversation about it. That is a piece of
hosting, and it is the kind a host is grateful not to have had to think of.

Read the mirrors and you can see the craft: the fruit punch comes from *the same
pitcher fruit*; the citron pressé is *self-mixed at the table*, so the person
drinking it has something to do with their hands; the mocktail sits in a coupe,
a flute, a gimlet glass, a rocks glass — never a tumbler of juice.

So the two columns must never be split into two pool entries. They are one drink
with two builds, chosen at the same moment, or the guarantee is lost.

**How much mixing** uses the same three positions as the menus, in the bar's own
words: *actually mixed · half made · bought and poured*. One axis across the
whole catalogue, so a host who said everything should arrive finished gets a
finished bar as well as a finished table.

---

## How to read a record — the house's note, not hers

Everything above this line is the founder's. Everything in this section is the
conversion describing itself, and it is kept separate on purpose.

Each `###` heading is one of the twenty-five programmes she wrote, by number and
in her own words. The drinks under it were split out of that programme's
cocktails line at the commas she wrote there, and they inherit its meal shape,
its season and its mixing level, because those were her answers about that bar.
`docs/drinks-programmes.md` holds the twenty-five whole.

**Five bullets, position-delimited, with an optional sixth:**

1. **The drink**, in her words, whole.
2. **Its mocktail mirror**, in her words, whole — or the single word
   `Mirror owed`.
3. **What shape of table it is for.** One or more of `Brunch`, `Lunch`,
   `Standing drinks`, `Dinner`, `Late supper`, comma-separated — or `Not said`.
4. **Season**, in her wording.
5. **How much mixing.**
6. Optionally `Also at: <destination>, <destination>`.

**`Mirror owed` means owed. Twenty-one drinks carry it**, and nothing may fill
one in but her. Beer, a neat spirit and a poured wine are the tempting ones,
because "juice" always looks like an answer — and a weak invented mirror is
worse than a named gap, because it *spends* the guarantee at the top of this
file instead of admitting the gap. A drink whose mirror is owed is seeded as a
**draft** and can never reach a table: `db/060`'s `drink_live_has_its_mirror`
makes it impossible to offer one. The list, grouped, is
`docs/drink-explosion.md` §5 batch B.

**`Not said` means she named no shape.** Six drinks carry it, from the two
programmes whose lines are "After a day outside" and "A boat or beach day".
No claims at all means every shape, which is the same default an untagged dish
and an untagged destination carry. It is not a claim that the drink suits
everything; it is the document declining to guess.

**No drink names an occasion, and none may.** Twenty of the twenty-five
programme lines contain a word a naive parser would scope on — `dinner`,
`supper`, `dinner party`, `boat`, `beach day` — and not one is an occasion
claim. Every one is a meal shape. The founder's ruling on how a drink reaches an
occasion is at the bottom of this file, and it is a join, not a field.

---

## Westhampton

### 1 · A summer dinner or cocktail party

**1.1**
- Gin and tonics in tall glasses
- Tonic and lime with cucumber
- Dinner, Standing drinks
- Summer
- Half made

**1.2**
- Whiskey sours
- Sour made with lemonade and egg-white foam
- Dinner, Standing drinks
- Summer
- Half made

**1.3**
- Sangria in a pitcher
- Fruit punch from the same pitcher fruit
- Dinner, Standing drinks
- Summer
- Half made

### 2 · A dressed-up dinner

**2.1**
- Manhattans
- Cherry-and-orange soda in a coupe
- Dinner
- Fall
- Actually mixed

**2.2**
- Harvey Wallbangers (vodka, orange juice, vanilla-liqueur float)
- Mirror owed
- Dinner
- Fall
- Actually mixed

**2.3**
- Brandy after dinner
- Spiced cider warm or cold
- Dinner
- Fall
- Actually mixed

### 3 · Brunch

**3.1**
- Bloody marys
- Virgin marys
- Brunch
- Summer
- Bought and poured

**3.2**
- Mimosas
- Orange juice and soda water
- Brunch
- Summer
- Bought and poured

**3.3**
- Cold beer in the fridge door
- Mirror owed
- Brunch
- Summer
- Bought and poured

## Nantucket

### 4 · An outdoor dinner or porch night

**4.1**
- Cape Codders (vodka, cranberry, lime)
- Cranberry-lime soda
- Dinner
- Summer
- Bought and poured

**4.2**
- Cold beer in a cooler
- Mirror owed
- Dinner
- Summer
- Bought and poured

**4.3**
- Dark rum and ginger beer with lime
- Ginger beer with lime
- Dinner
- Summer
- Bought and poured

### 5 · A rainy lunch or cozy dinner

**5.1**
- Hot buttered rum
- Hot chocolate
- Lunch, Dinner
- Shoulder season and fall
- Half made

**5.2**
- Whiskey with one ice cube
- Mirror owed
- Lunch, Dinner
- Shoulder season and fall
- Half made

**5.3**
- Mulled cider with rum
- Mulled cider straight
- Lunch, Dinner
- Shoulder season and fall
- Half made

## New York

### 6 · A formal dinner party

**6.1**
- Manhattans
- Mirror owed
- Dinner
- Winter
- Actually mixed

**6.2**
- Very dry martinis
- Bitter lemon soda in a martini glass
- Dinner
- Winter
- Actually mixed

**6.3**
- Sidecars (cognac, orange liqueur, lemon)
- Lime rickey (lime, soda, a little syrup)
- Dinner
- Winter
- Actually mixed

**6.4**
- Brandy after
- Mirror owed
- Dinner
- Winter
- Actually mixed

### 7 · A loft dinner or long Sunday

**7.1**
- Very cold martinis
- Mirror owed
- Dinner
- Any
- Half made

**7.2**
- Negronis
- Bitter orange soda over ice with an orange peel
- Dinner
- Any
- Half made

**7.3**
- Red wine in tumblers with dinner
- Grape juice cut with soda in a tumbler
- Dinner
- Any
- Half made

### 8 · A late supper after a show

**8.1**
- Champagne
- Mirror owed
- Late supper
- Winter
- Bought and poured

**8.2**
- Champagne cocktails (sugar cube, bitters)
- Sparkling cider with a sugar cube and orange peel
- Late supper
- Winter
- Bought and poured

## Côte d'Azur

### 9 · A long lunch or garden drinks

**9.1**
- Kir (white wine, crème de cassis)
- Sparkling water with cassis syrup
- Lunch, Standing drinks
- Summer
- Bought and poured

**9.2**
- Pastis with water
- Citron pressé (fresh lemon, sugar, cold water, self-mixed at the table)
- Lunch, Standing drinks
- Summer
- Bought and poured

**9.3**
- Cold rosé through lunch
- Mirror owed
- Lunch, Standing drinks
- Summer
- Bought and poured

### 10 · A quiet off-season dinner

**10.1**
- Red wine with dinner
- Mirror owed
- Dinner
- October
- Bought and poured

**10.2**
- Cognac after
- Chilled verbena tea
- Dinner
- October
- Bought and poured

**10.3**
- A small sweet wine with dessert
- Poached-pear syrup with soda
- Dinner
- October
- Bought and poured

### 11 · A dressed-up dinner or beach lunch

**11.1**
- Kir royales
- Sparkling grape juice with cassis syrup
- Dinner, Lunch
- Spring and summer
- Half made

**11.2**
- French 75s (gin, lemon, champagne)
- Lemon soda in a flute
- Dinner, Lunch
- Spring and summer
- Half made

**11.3**
- Cold rosé
- Mirror owed
- Dinner, Lunch
- Spring and summer
- Half made

### 12 · A midnight supper

**12.1**
- Champagne
- Sparkling cider
- Late supper
- Winter
- Actually mixed

**12.2**
- Brandy alexanders after dessert (cognac, chocolate liqueur, cream)
- Chocolate cream shake in a coupe with nutmeg
- Late supper
- Winter
- Actually mixed

## Vegas

### 13 · A steakhouse dinner

**13.1**
- Martinis
- Mirror owed
- Dinner
- Year-round
- Actually mixed

**13.2**
- Old fashioneds
- Bitters and soda
- Dinner
- Year-round
- Actually mixed

**13.3**
- Whiskey sours
- Shirley Temples with extra cherries
- Dinner
- Year-round
- Actually mixed

**13.4**
- A gimlet or two (gin, lime cordial)
- Lime cordial and soda in a gimlet glass
- Dinner
- Year-round
- Actually mixed

### 14 · A midnight breakfast

**14.1**
- Champagne and orange juice separately or together
- Orange juice in a flute
- Late supper
- Year-round
- Bought and poured

**14.2**
- Bloody marys
- Virgin marys
- Late supper
- Year-round
- Bought and poured

**14.3**
- Black coffee
- Black coffee
- Late supper
- Year-round
- Bought and poured

## Catskills

### 15 · A summer dinner or lake day

**15.1**
- Tom Collinses
- Lime rickeys
- Dinner
- Summer
- Half made

**15.2**
- Whiskey sours
- Mirror owed
- Dinner
- Summer
- Half made

**15.3**
- Seltzer with everything
- Seltzer with fruit syrups in the same tall glasses
- Dinner
- Summer
- Half made

### 16 · A cabin dinner

**16.1**
- Mulled cider with apple brandy
- Mulled cider straight
- Dinner
- Fall
- Half made

**16.2**
- Hot toddies
- Hot lemon and honey
- Dinner
- Fall
- Half made

**16.3**
- Whiskey by the fire
- Mirror owed
- Dinner
- Fall
- Half made

## Dolomites

### 17 · After a day outside

**17.1**
- Hot spiced wine
- Hot spiced grape juice
- Not said
- Winter
- Half made

**17.2**
- Bombardino (warm egg liqueur, brandy, whipped cream)
- Hot chocolate with whipped cream in the same mug
- Not said
- Winter
- Half made

**17.3**
- Grappa after dinner
- Mirror owed
- Not said
- Winter
- Half made

## Tahiti

### 18 · An outdoor dinner or beach lunch

**18.1**
- Rum punch in a pitcher
- Pineapple-lime-coconut punch from the same pitcher fruit
- Dinner, Lunch
- Warm weather
- Half made

**18.2**
- Mai tais (rum, lime, orange liqueur, almond syrup)
- Coconut water with lime
- Dinner, Lunch
- Warm weather
- Half made

**18.3**
- Cold beer
- Mirror owed
- Dinner, Lunch
- Warm weather
- Half made

## Havana

### 19 · A long dinner party

**19.1**
- Daiquiris shaken (rum, lime, sugar)
- Mirror owed
- Dinner
- Year-round
- Actually mixed

**19.2**
- Mojitos
- Fresh limeade with mint in the same glass
- Dinner
- Year-round
- Actually mixed

**19.3**
- Cuba libres
- Lime and cola with a lime wheel
- Dinner
- Year-round
- Actually mixed

### 20 · A late supper after dancing

**20.1**
- Rum old fashioneds
- Spiced ginger soda over ice with orange peel
- Late supper
- Year-round
- Half made

**20.2**
- Cold beer
- Mirror owed
- Late supper
- Year-round
- Half made

**20.3**
- Strong sweet coffee
- The same coffee
- Late supper
- Year-round
- Half made

## Big Sur

### 21 · A fire-lit dinner

**21.1**
- Margaritas at sunset
- Hibiscus iced tea with lime in the same glass
- Dinner
- Year-round
- Half made

**21.2**
- California red by the fire
- Mirror owed
- Dinner
- Year-round
- Half made

**21.3**
- Hot toddies when the fog comes in
- Hot honey-lemon
- Dinner
- Year-round
- Half made

## New Orleans

### 22 · A dressed-up dinner

**22.1**
- Sazeracs (rye, sugar, bitters, anise rinse)
- Cold sweet tea with lemon peel in the same rocks glass
- Dinner
- Winter or spring
- Actually mixed

**22.2**
- Vieux carrés (rye, cognac, vermouth)
- Mirror owed
- Dinner
- Winter or spring
- Actually mixed

**22.3**
- Wine with dinner
- Sparkling water with peach syrup
- Dinner
- Winter or spring
- Actually mixed

### 23 · A late brunch

**23.1**
- Milk punch (bourbon, milk, vanilla, nutmeg)
- Vanilla milk with nutmeg in the same glass
- Brunch
- Any
- Actually mixed

**23.2**
- Ramos gin fizzes
- Orange-cream fizz
- Brunch
- Any
- Actually mixed

**23.3**
- Mimosas
- Orange juice in a flute
- Brunch
- Any
- Actually mixed

## Portofino

### 24 · Golden-hour drinks into dinner

**24.1**
- Spritzes at golden hour
- Italian bitter-orange soda over ice with an orange slice
- Standing drinks, Dinner
- Summer
- Half made

**24.2**
- Negronis
- Mirror owed
- Standing drinks, Dinner
- Summer
- Half made

**24.3**
- Cold white wine with dinner
- Sparkling lemonade in the wine glass
- Standing drinks, Dinner
- Summer
- Half made

**24.4**
- Icy lemon liqueur after
- Icy lemon-sugar cordial in the same tiny glass
- Standing drinks, Dinner
- Summer
- Half made

### 25 · A boat or beach day

**25.1**
- Cold white wine
- Sparkling lemonade
- Not said
- Summer
- Bought and poured

**25.2**
- Cold beer
- Chinotto (Italian bitter cola)
- Not said
- Summer
- Bought and poured

**25.3**
- A thermos of espresso
- The same espresso
- Not said
- Summer
- Bought and poured

---

## Notes for the catalogue

**A drink is scoped to a destination** the way a menu is. Havana's daiquiris are
not an option at the Dolomites, and the mulled wine is not an option in Tahiti.

**Every destination now has a bar, and a table.** Menus and drinks cover the
same twelve places, so no occasion can be given a table with nothing to
drink at it — or a bar with nothing to eat beside it.

**Havana now has a look, a voice and a plate** — HAVANA, 1957,
`havana` — written to these two programmes rather than the other way round. A
bar that shakes rather than stirs and serves coffee at every hour, including
after midnight, is most of what the destination knows about itself.

---

## What the atomisation changed, and what it did not — the house's note

**The counts, and they are counted rather than estimated** (`CLAUDE.md` rule
24; `npm run seed:drinks -- --dry-run` prints them without touching a
database):

| | |
|---|---|
| programmes read | 25 |
| atomic drinks | **76** |
| paired with the mirror their author wrote | **55** |
| mirror owed, and never invented | **21** |
| drinks whose author named no meal shape | 6 |
| occasion claims | **0** |

**Three things this document deliberately did not do**, each of which would have
been easy and wrong:

- **It invented no mirror.** Twenty-one is the number; twenty-one is what it
  says.
- **It merged no two drinks that share a name.** Whiskey sours appear in
  programmes 1, 13 and 15 and stay three rows. A repeated PROGRAMME was her
  saying "this bar belongs in two houses"; a repeated drink name is two rooms
  independently pouring a common thing, and collapsing on identical text would
  have minted nine cross-room claims nobody authored (`docs/drink-explosion.md`
  §3).
- **It corrected no mixing level.** Thirteen of the seventy-six inherit a value
  authored over a whole bar that reads oddly against one drink — a gin and tonic
  is not "half made". They inherit it unchanged and the thirteen are listed in
  `docs/drink-explosion.md` §5 batch F, because `making_level` is scored and a
  guess there is a guess that scores.

**One line of the old document was wrong and is corrected here:** it opened
"Thirteen destinations". There are twelve headings, and the file's own notes
section said twelve. The thirteenth was Cap Ferrat, retired by `db/028`.

**The pairings are readings, and fifteen of them are judgements.** Where a
programme's two lines had unequal counts more than one twin was available;
`docs/drink-explosion.md` §5 batch C lists all fifteen with the reason each was
read that way, and names the three that are genuinely contested. Programme 12 is
the proof that this could not be done by position: its mirrors are written in
the opposite order to its cocktails, so a positional splitter pairs champagne
with a chocolate shake, throws nothing, and reads correct from every angle.

---

# THE MEAL-SHAPE RULING — how a drink reaches an occasion

**Founder ruling, 2026-08-31, transcribed in the session it was made.** It
closes the only open item in the engine's decision queue, written by the
engine on 2026-08-29:

> No drink is scoped to an occasion, and none can be from the document as it
> stands: all 25 programmes name a MEAL SHAPE and `docs/drinks.md` has no
> occasion field. db/023 ruled these two are different axes. Either the
> document grows an occasion field, or the drinks gain a meal-shape axis of
> their own — **a decision, not a patch.**

## The ruling

> "drinks gain a meal-shape axis of their own, and occasion scoping derives
> through it. The evidence in the explosion doc decides it — 20 of 25
> programmes name meal shapes, zero name occasions, so the authored truth of
> this corpus is meal shape; adding an occasion field to the document would
> mean inventing 76 occasion claims that mostly just restate the meal-shape
> mapping, a second authority for one fact. Instead: drinks claim what their
> authors actually wrote (dinner, brunch, late supper, standing drinks), each
> occasion declares its meal shape(s) once — most already imply it — and
> occasion→drink eligibility is a join, not an authoring pass. db/023's
> two-axes ruling is respected because the axes stay separate and connect by
> mapping. If a genuinely occasion-specific drink ever appears (champagne
> claiming Something Bridal regardless of meal), that's a narrow additive
> field later, on evidence."

## Why this is the conservative answer, not the clever one

The other branch — an occasion field on the document — reads as the direct
fix and is the expensive one. It would require **76 occasion claims that
nobody wrote**, each mostly restating the meal-shape mapping, which is a
second authority for one fact (`CLAUDE.md` rule 21) and 76 opportunities for
an agent's guess to acquire the founder's name (rule 3).

The ruling instead takes the corpus at its word. `docs/drink-explosion.md`
re-derived the finding by hand rather than trusting the prior pass: twenty of
twenty-five programme names contain a word a naive parser would scope on, and
**not one is a legitimate occasion claim** — every hit is `dinner`, `supper`,
`dinner party`, `boat` or `beach day`, all of them db/023's meal-shape axis.

## What it requires, and the order

`meal_shape` already exists as a closed enum (db/023): `brunch`, `lunch`,
`cocktails`, `long_dinner`, `late_supper`. Nothing maps an occasion to it yet.

1. **Drinks claim a meal shape** — from what their authors wrote, never inferred.
2. **Each occasion declares its meal shape(s), once.** Most already imply it.
3. **Eligibility is the join.** No third table, no per-drink occasion field.

**BUILT, AS OF `db/060`.** The paragraph that stood here said "NOT BUILT YET,
AND DELIBERATELY" and it was right on the day it was written: the 76 atomised
drinks lived in an untracked document, and building the axis before the rows
existed would have produced a gate with no claimants — the
`requires_still_water` situation, and the shape of the defect that made
`requires_full_kitchen` unreadable for two days. The rows now exist, in this
file, so the axis lands with them:

- `drink_meal` — which shapes each drink claims, written by
  `scripts/seed-drinks.mjs` from bullet 3, seventy of seventy-six claiming
  something and six claiming nothing because she named nothing.
- `occasion_meal` — each occasion's declaration, all nine of them, in the
  migration. Eight declare all five shapes and only `dinner_party` narrows,
  which is reported rather than tidied: a table that prunes one occasion is a
  table that prunes one occasion.
- The join is read where the per-occasion question is actually asked — the room
  × occasion drink watch in `src/lib/catalogue/gates.ts` — and **not** in the
  selection engine, which already has one owner for what kind of table tonight
  is: the host's own answer. An occasion declares what it can be; she says what
  it is.

## The escape hatch, stated so it is not reinvented

A genuinely occasion-specific drink — champagne claiming Something Bridal
regardless of meal — gets **a narrow additive field, later, on evidence**. Not
now, and not by symmetry.
