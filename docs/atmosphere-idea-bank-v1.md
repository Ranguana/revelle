# Revelle Atmosphere Idea Bank — v1, all eighteen rooms
**v1 — founder-blessed brainstorm output, consolidated for CC. Any copy
without this header is stale; discard unread.**

**PROVENANCE, 2026-08-26 — WHAT IS AND IS NOT HERS.** Everything above the
second `GOODS:` line in each room is v1 as she blessed it, unaltered. Each room
now carries a SECOND `GOODS:` block of TAKE-HOME objects, which are NOT hers:
they are 152 machine-drafted proposals from the three
`docs/take-home-bank-*.md` sheets, admitted under the own-stock ruling of
2026-08-26 (`docs/proposals.md`). Every one of them carries `FOUNDER-PENDING`
inside its own clause, which is what `seed:bank` reads to hold a row in DRAFT,
so none of them can reach a member unread. Delete a `FOUNDER-PENDING` question
and that row goes live on the next deploy. The other 73 proposals are absent on
purpose: 47 did not survive the ruling, and 26 DID survive without any new
stock — as second claims on rows that already exist — which is an action
against `bank_item_world` and not a row for this document.

**CORRECTED 2026-08-26, and the correction matters more than the typo.** That
sentence read "*as second claims on rows that already exist, or as affinity —
which is a desk action against `bank_item_slot`*". Both halves were wrong and
the second hid the first. The table is `bank_item_world`; `bank_item_slot`
holds which BEAT of the evening a row lands in, not which room. And affinity is
not a way to give a row to a second room at all:

> **affinity re-weights scoring for already-eligible candidates; it never
> confers eligibility — sharing requires a second native row.**

`claimEligibility` in `src/lib/selection/occasion.ts` reads a `native` row as a
WHITELIST: any native row makes an item eligible for its native rooms AND NO
OTHERS. A row that is neither native nor forbidden is NOT A CLAIM — its
`affinity` is the additive term stage 4 scores with, and an item never gets as
far as being scored in a room it is not native to. So "native to Côte d'Azur,
affinity to Big Sur" is not a shared row. It is a Côte d'Azur row with a number
attached that nothing at Big Sur will ever read. The mechanism is correct and
load-bearing — it is what keeps a game scoped to Westhampton at +0.4 playable
everywhere else — but it answers a different question than it appears to, and
reading it the other way has already produced one wrong report, one wrong
ruling, and two staged rulings that are inert as written.

**A ROW IS SHARED WITH AN `Also at:` LINE, from the same day.** See FORMAT
NOTES, below.

**THIRD PASS, the same day: FOUR ROWS THAT ARE NOT TAKE-HOMES AT ALL.**
WESTHAMPTON, 1976 carries a THIRD `GOODS:` block, and it is the only room that
does. db/043 makes `the_table_set` REQUIRED at a dinner party, a birthday, an
anniversary, a holiday and a no-reason party, and Westhampton was the one room
of the eighteen with nothing in that slot — live or draft — so every long
dinner thrown in it was marked low-confidence for a hole nobody had noticed.
The four rows dress that table the only way this room dresses one, which is
barely: a cloth off the line, glasses that never were a set, one platter, a
stack of napkins nobody folded. They are NOT hers either — they are authored
against her premise and her voice record — so each carries `FOUNDER-PENDING`
like everything below and none of them can go live unread. The empty slot was
NOT caused by the own-stock ruling: no Westhampton proposal was killed by it,
and the hole predates all three sheets.

**SECOND PASS, the same day: 20 more, and they are a THIRD CATEGORY.** Twenty
of those 73 were HELD rather than killed, and the founder ruled that they are
not a residue of the own-stock rule but the best thing under it — *"the
take-homes that can't be faked: nothing printed in advance, pure residue of the
night actually happening."* They are staged here too, as drafts, and each one
carries her own phrase as its marker:

```
THE EVENING SUPPLIES IT (per guest; from the_drinks yields_cork)
THE EVENING SUPPLIES IT (one guest only; from ambient_game yields_prize)
THE EVENING SUPPLIES IT (per guest; from the night itself)
```

`seed:bank` reads that marker and writes `bank_item.supply`,
`bank_item.take_home_quantity` and the row's `bank_item_dependency` rows —
a SLOT the item watches plus a PREDICATE asked of whatever filled it. The schema
and the whole argument are in `db/044-the-evening-supplies-it.sql`; the rulings
are in `docs/proposals.md` under 2026-08-26. **The two identifiers are checked
by the database, not by the seeder** — `slot_kind(code)` and `supplies_tag(code)`
are real foreign keys, so a typo is a failed insert naming it.

## ROUTING RULES — READ FIRST
The brainstorm mixed food and drink with atmosphere. They do NOT import
together. Route by type:

1. **FOOD → dish pool** (existing system, existing tags). Anything edible
   in this document is listed under "ROUTE TO DISH POOL" per room and
   imports as dish rows with tier/season/level tags — never as atmosphere
   content. This includes the new **`descent` tag**: one deliberately
   humble late plate, till-morn/late rooms only, arrives unannounced as
   the last-phase turn.
2. **DRINKS → drink program** (existing system). Same rule, listed under
   "ROUTE TO DRINK PROGRAM" per room.
3. **THE BANK holds only:** GOODS (purchasable/placeable objects),
   HOST ACTS (performed by the host alone), GAMES (opt-in objects with
   provided content), and printed cards. Where an act *produces* a drink
   (the louche, the espumita, the molinillo, the genepì pour), the ACT
   stays in the bank and points at its drink-program entry — the act and
   the recipe are separate rows in separate systems.
4. Acts and goods are **pool content, per-package selection** (like
   dishes; ~2–3 acts per package). **Only the signature gesture is
   invariant** per room.

**A GAME IN A `GOODS:` LINE IS STILL A GAME — added 2026-08-27, and it is a
correction to how rule 3 above was READ rather than to what it says.** Rule 3
lists GAMES as one of the four things the bank holds. It was read as saying
that a game arrives under a `GAMES:` heading, and only three rooms of eighteen
ever wrote one with content in it — so `seed:bank` produced three `game` rows
in the whole catalogue while twelve more rooms named a game inside a `GOODS:`
line: the dice cups at Vegas, the dominoes at Havana, the tombola kit at
Amalfi, the Bingo kit and the gin deck at Catskills, the cribbage board at
Nantucket, the backgammon board at St. Moritz. Founder: *"fix the parser so the
games become rows."*

- **The routing is a NAMED RULING, not a marker in these clauses and not a
  word-matcher.** `GAME_ROUTINGS` in `scripts/seed-bank.mjs` lists twenty rows
  by slug, each carrying the kind this document derives, the kind the ruling
  gives it, and the words in the clause that are the evidence. Nothing above
  the second `GOODS:` line of any room was touched: the provenance header says
  those clauses are hers unaltered, and a document edited to make a seeder come
  out right destroys the evidence the routing was derived from.
- **A clause yields ONE row of its own kind, plus the cards that ride with
  it.** The liar's-dice, Watten/briscola, scopa and Conquián rules cards are
  still their own `printed_card` rows; what changed is that the thing they ride
  with is a `game` rather than a `good`. Where a clause names an object AND a
  distinct thing somebody does with it — New Orleans' *"tarot deck out …; host
  reads for whoever asks"* — **the deck is the good, the reading is a game, and
  the reading needs a line somebody writes.** It is not split out by machine.
- **`GAMES: none` IS NOT A RULE THAT THE ROOM IS GAMELESS.** Founder: *"lets
  not make a blanket rule that a room is gameless."* The line produces no row,
  no column and no negative claim, and nothing in this catalogue records that a
  room HAS no game. A room that says none can receive one the moment somebody
  names one. Two rooms that say none — Tahiti and Acapulco — carry a
  `piece: "game_rule"` in `src/lib/destinations.ts` written in their own voice;
  those contradictions are **rulings owed** and are booked in `docs/proposals.md`.
- **A killed game may never come back as a routing win.** `KILLED_GAMES` in the
  seeder checks every row against the kills recorded here and in the three
  take-home sheets, by full phrase and never by keyword — *the belote sheet* was
  cut and *belote rules card* is routed, one word apart and opposite decisions.
  A match is a failed run.

## FORMAT NOTES — SAYING A ROW BELONGS TO TWO ROOMS
Every clause in this document belongs to the room whose `##` heading it sits
under. ONE clause may belong to a SECOND room, and there is exactly one way to
say so — an `Also at:` line, borrowed verbatim from `docs/drinks.md`, where it
is the optional sixth bullet of a drink record:

```
the loose dried aromatic — take-home, a handful of wild lavender loose and
never bundled … (Also at: Big Sur) (FOUNDER-PENDING — …);
```

- It is a parenthetical of its own, in the channel this document already uses
  for everything said ABOUT an item rather than in it: `(GESTURE)`,
  `(owned-if-present)`, `(FOUNDER-PENDING — …)`. Position within the clause
  does not matter; being its own bracket does.
- The names are SHORT NAMES — `Big Sur`, `Côte d'Azur`, `St. Moritz` — the keys
  of `DESTINATIONS` in `scripts/catalogue-vocabulary.mjs`. Never the room
  heading `BIG SUR, 1971`: a heading carries a comma and the list is
  comma-separated. Several are allowed: `(Also at: Aspen, St. Moritz)`.
- A name this catalogue does not know is a FAILED RUN naming the line, and so
  is the room the clause already sits under, and so is a clause that says "also
  at" in any other shape. A claim silently read as prose is the failure this
  line exists to end.
- Each name becomes another `native = true` row in `bank_item_world`.

**WHY NATIVE AND NOT AFFINITY, which is the thing to read twice:**

> **affinity re-weights scoring for already-eligible candidates; it never
> confers eligibility — sharing requires a second native row.**

An item with any `native` row is eligible in its native rooms AND NO OTHERS
(`claimEligibility`, `src/lib/selection/occasion.ts`). An `affinity` weight on
a room the item is not native to changes a score the item is never in the
running for. It is a real mechanism doing a real job — it is how a game native
to nowhere is nudged toward Westhampton — but it is not a way to put a row in a
second room, and it has been read as one three times in one week.

**THE ROW TRAVELS WHOLE, WHICH IS THE CONSTRAINT ON WHAT MAY CARRY THIS LINE.**
There is ONE row and it is claimed twice: the same name, the same description,
the same phase, the same cards riding with it. There is no per-room text and
there cannot be, because the row IS the text. So:

- **An item whose words name its own room cannot travel.** "The recipe written
  out the way a kitchen that has done this every Sunday since before she was
  born would write it" arrives in a 1994 ski condo still being Oaxacan. Where
  two rooms need different words, that is TWO ROWS, authored separately, and it
  is the founder's call — an `Also at:` line is not a way to avoid making it.
- **A substitution written INTO the line does travel**, because it is part of
  the row's own words: "wild lavender … with dried eucalyptus off the foraged
  pile as the Big Sur substitution" says what it becomes in the second room and
  says it in one sentence, in both rooms.
- A `(GESTURE)` clause may never carry the line. A gesture is a column on the
  room and the signature gesture is invariant per room (routing rule 4).

**KNOWN HAZARD, and it is a screen rather than this document:** the bank item
form at the desk has ONE destination select, and saving it deletes every other
`native` row. Until that screen grows a second selection, editing a shared item
at the desk destroys its second claim. Booked in `docs/needs-a-human.md`; every
`seed:bank` run that writes a second claim says so again at the end.

## NEW CONTENT CLASSES (schema-relevant)
- **Technique cards:** one skill per card, era-correct spec, written in
  the room's voice; rides with whichever act the package selects.
- **Opt-in crafts:** host sets up, guests join or don't (trofie lesson,
  lei-making, shucking). Legal because joining is the guest's move.
- **Owned-if-present:** never shipped; the scene card may glance
  (turntables, fireplaces, backgammon at NY, mah-jongg, chess, boards).
- **The slips rule:** any game with player-generated content ships
  pre-generated (all prompt decks, Smorfia sheet, award categories,
  bingo calls, stakes lists). The member never fills a blank; the era
  does.
- **Digestivo-closer family:** a host-poured closer per room where
  assigned (genepì, marc, lemon liqueur, Grand Marnier). Acts in bank;
  liquids in drink program.
- **Candle-surface dimension:** every candle line answers "on what" —
  NY: chrome/glass holders · Oaxaca: clay · Westhampton: amber votives/
  hurricanes · Dolomites: lanterns · Côte d'Azur: mismatched saucers ·
  Acapulco: silver/glass tapers + clear hurricanes · St. Moritz: silver
  · Big Sur: improvised · Aspen & NOLA & Catskills & Nantucket: none/
  minimal. Feeds check:staging.
- **Venue:** Tahiti and Palm Springs carry destination-level
  requires_outdoors (drop/mark at reveal). Big Sur explicitly survives
  indoors. Sparklers need outdoor_access (softer grade) + NYC-legality
  flag on card. Venue never scores.
- **Exclusivity:** identity-carriers only (gestures, signature dishes,
  games, one-of-one objects). Common materials (citrus, candles, olives,
  wool, wine) flow freely; rooms differ by register and dose.
- **Invitation dress line:** any room may carry ONE optional dress
  sentence in the invitation, in-voice ("wear your best sweater").
  Never a wardrobe list. Costume briefs are killed catalog-wide.

---

## WESTHAMPTON, 1976 *(Eothen re-founding pending row re-run — bench
provisional until cells settle)*
GOODS: hurricane lamps + amber votives (amber is Westhampton's pair);
hedge hydrangeas, careless-abundant, in whatever was near; pampas grass;
the Polaroid on the side table (photos accumulate); era LP pressings as
goods for turntable members.
GOODS: the Polaroid you are in — take-home, one print per guest, the
back written on or not (FOUNDER-PENDING — does the house keep the
accumulating pile and give one to each guest, or does the pile go and
the guests take everything, those are two different rooms); the
paperback nobody asks about — take-home, one period paperback per guest,
on the shelf before anyone arrives, gone by Monday, never mentioned
(FOUNDER-PENDING — sourcing at volume, and does the house choose which
title goes to which guest or is it a shelf and whatever happens
happens); the pampas plume — take-home, one dried plume per guest cut
short enough to carry on a train, dried hydrangea head as the fallback
(FOUNDER-PENDING — the own-stock ruling closes the second-claim option
because the placed pampas is one arrangement, so this is its own
per-guest line and the founder signs the row rather than the shortcut);
the tag off the car keys — take-home and atmosphere, a numbered
cardboard tag on a string tied to each set of keys at the door so cars
can be moved without waking anybody (FOUNDER-PENDING — this is the same
mechanism as New York's cloakroom check, one idea twice or the same
object doing its actual job in two houses); the score, sealed —
take-home and atmosphere, each guest leaves with their line from the
naming game in a sealed envelope (FOUNDER-PENDING — is a sealed envelope
a wink dressed as a refusal in a room whose rule is that the house
explains nothing, and note the naming game it is the residue of is not a
bank row in any room yet); the day's bulletin — take-home and
atmosphere, the printed bulletin off the hall table, one per guest,
taken by whoever wants one (FOUNDER-PENDING — pre-generated per the
slips rule so it cannot name what actually happened, does a bulletin
true in register but not in fact still count as evidence of the
evening); the sunglasses out of the bowl — take-home, a bowl of cheap
drugstore sunglasses by the door, worn out on Monday (FOUNDER-PENDING —
merchandise or evidence, they were used but they were bought in advance
and nothing happened to them); the forty-five picked for you —
take-home, one 45 rpm single per guest chosen by whoever is running the
record player, handed over without comment (FOUNDER-PENDING — sourcing
and cost, used singles are a few dollars but supply is not uniform, and
does this collide with the LP pressings already shipping as goods for
turntable members); the rule about the record player, on a card —
take-home and table set, a small card carrying the house's one rule at
each place, taken or not (FOUNDER-PENDING — is this a thin item rescued
by a second claim, or does table dressing earn its keep regardless of
whether anybody pockets it).
GOODS: the cloth off the line — table set, one bleached cotton
tablecloth washed soft and still creased where it was pegged, put down
unironed (FOUNDER-PENDING — nobody irons in a heat wave is the
argument, but a crease reads as a mistake as easily as it reads as a
fact, so does the house ship it creased or ship it flat and let the
weekend do the rest); the glasses that do not match — table set, thin
tumblers and two or three coupes out of the rented house's cupboard,
nothing that was ever a set (FOUNDER-PENDING — a deliberate mismatch is
harder to source than a matching dozen and costs more, and buying
mismatched glassware may be the styled version of not caring, which is
the one thing this room cannot be); the one platter — table set, a
single large white oval, everything served off it, set down in the
middle and not moved again (FOUNDER-PENDING — the product pool already
ships the one object a table is built around, so rule on whether a
serving platter is a table row at all or whether it is that object
under another name); the napkins nobody folded — table set, a stack of
unbleached cotton napkins put down at one end and used as needed
(FOUNDER-PENDING — the stack is the point and a stack is also
indistinguishable from an oversight, and this is the room that explains
nothing, so there may be no way to say which it is without saying it).
HOST ACTS: the record flip (GESTURE).
ROUTE TO DRINK PROGRAM: one pale batched pitcher drink (host never plays
bartender).
KILLED: shell/driftwood scatter (reassigned Big Sur), visible shop
boxes, midnight eggs, lamp doctrine.

## NEW YORK, 1938
GOODS: menu cards part-French at each place (R-month oyster line); place
cards in stands; cheesecloth-wrapped lemon halves (presentation good);
bar tray as furniture (shaker, bitters, decanter); single-variety white
florals — calla, gardenia, or white carnation — in low glass or chrome;
custom matchbooks; telephone message pad by the door; The Game 1938
prompt slips; backgammon owned-if-present.
GOODS: the cloakroom check — take-home and atmosphere, a numbered
duplicate ticket torn from a book as the coat goes to the bed, the stub
home in a pocket (FOUNDER-PENDING — the sheet asks nothing here, so the
row is carrying the standing question instead, does it ship); the plan
of the table — take-home and table set, a small printed diagram of the
seating with every name on it, one at each place (FOUNDER-PENDING —
needs real names printed per party, place cards prove the print path
carries names, confirm the plan lays out from the same source without a
human typesetting it); the card for the thing you watched somebody do —
take-home, a per-guest copy of whichever technique card the package
selected, here the 1938 martini spec (FOUNDER-PENDING — technique cards
ride with the act host-side and the own-stock ruling makes the per-guest
copy its own row, so the live question is whether a copy each dilutes
the act or extends it); the message taken for you at the door —
take-home, a slip off the telephone message pad already by the door,
filled in during the evening by whoever answered (FOUNDER-PENDING — do
not name a branded pad form, the standard printed message pads are later
than 1938, and is a message a guest knows is invented a joke this room
would refuse); the buttonhole — take-home and table set, a single white
carnation or gardenia per guest, at the place and then in the lapel
(FOUNDER-PENDING — the white carnation buttonhole is firmly correct with
white tie and morning dress and less certain with black tie in 1938,
worth checking before this ships as a claim about the year); the paper
hat — take-home, period New Year's table favors, one paper hat or
cardboard noisemaker per place at midnight (FOUNDER-PENDING — the
genuine risk is that this is the one object that turns the room into a
set, which the room's own rejected list refuses by name); the twist of
sugared almonds — take-home, a small paper twist of sugared almonds or
chocolates at each place (FOUNDER-PENDING — the sheet marks it the
weaker kind and asks nothing, so the row carries the standing question,
does it ship at all); the cork, dated — take-home, THE EVENING SUPPLIES
IT (per guest; from the_drinks yields_cork), a champagne cork with the
date written on it in pencil at the table, from the bottles the room
opens anyway (FOUNDER-PENDING — Acapulco owns the loud cork as
punctuation, different use and the same object, does this collide or is
a marked cork sufficiently not a fired cork).
HOST ACTS: martini made in the room, first round shaken by host
(+technique card: 1938 spec — ~2:1, stirred, lemon twist); "dinner is
served" announced; the midnight toast (GESTURE).
ROUTE TO DISH POOL: oysters on crushed ice as landed first course;
savoury-after-pudding (pooled, low weight).
ROUTE TO DRINK PROGRAM: the 1938 martini spec.
KILLED: eggs, menu read aloud, ashtray-era goods (matchbooks survive as
favors only).

## NEW ORLEANS, 1956
GOODS: tight classical florals — dark red roses, magnolias, PRESERVED
Spanish moss (never fresh — chiggers) around candle bases; tarot deck
out (Marseille or Rider-Waite; host reads for whoever asks); 1956
charades prompt deck; church fans at places.
GOODS: your story in somebody else's hand — take-home and atmosphere,
everybody starts a story and the person on your left finishes it wrong,
each guest leaves with the wrong ending in that person's handwriting
(FOUNDER-PENDING — the slips rule says the member never fills a blank,
here the prompt is pre-generated and the guest writes the ending,
confirm that reading before this seeds); the card that came up for you —
take-home, the card that came up in the reading stays with the person it
came up for, off a second sacrificial deck (FOUNDER-PENDING — the
own-stock ruling says the good deck cannot be consumed, so the second
deck is the answer, confirm that is the intent and that the card says
so); the bitters, in a bottle small enough to pocket — take-home, a
small bottle of Peychaud's per guest so the Sazerac rinse can be done
again at home (FOUNDER-PENDING — cost per guest at volume, whether
bitters count as alcohol for shipping, and confirm the New
Orleans-native rather than Louisiana-generic reading of rule 6); the
roux, written out — take-home, a card carrying the roux and nothing
else, one per guest, given to whoever was arguing about it
(FOUNDER-PENDING — printed in advance or written out by the host in the
moment, the own-stock ruling closes the second-claim option because the
technique-card row ships one); the token for the ride nobody takes —
take-home, a period transit token pressed into a hand at the gate
(FOUNDER-PENDING — by 1956 much of the New Orleans network had gone to
buses, confirm which token is correct for the year, and confirm sourcing
at ten per party); the saint's card out of a wallet — take-home, a small
devotional card at each place, the kind that lives in a wallet in this
city in this decade (FOUNDER-PENDING — is this respectful or is it a
religious object used as a party favor, it is materially true to 1956
and it is still somebody's faith on a table, do not ship without a
decision).
HOST ACTS: the ghost's glass (poured and set aside, unexplained); the
Sazerac rinse (+technique card); go-cups at the door; Café Brûlot
(+card, small flame); the second pot (GESTURE — timing lives in dish
pool).
GAMES/BOOKINGS: hired tarot reader as optional booking (spectacle
pipeline).
ROUTE TO DISH POOL: second-pot timing ritual; brûlot components.
ROUTE TO DRINK PROGRAM: brandy milk punch; Sazerac; brûlot recipe.

## DOLOMITES, 1956
GOODS: wool/loden throws over chairs; sheepskin/fur SEAT PADS (underlayer
tier of the mountain-fur split); copper pot as serving vessel; felt
runners/trivets; tumblers or steins (no stemware); northern-Italian
pattern card deck + Watten/briscola rules card; larch/pine branches, no
florals; candle lanterns; Cortina 1956 Olympics reproduction poster
(the one wall object).
GOODS: the peg with your name on it — take-home and atmosphere, a wooden
peg carrying a guest's name, used on the coats or the wet things at the
door, taken home at the end (FOUNDER-PENDING — does the peg have a job
in a room that has no drying room, and which claim does the card make,
coat peg or drying-room peg); the forty days, in an envelope —
take-home, dried genepì and the forty-forty-forty written out, one
envelope per guest, so the forty days start when they get home
(FOUNDER-PENDING — sourcing dried genepì at per-guest volume, and
whether the plant material carries any import or sale restriction); the
genepì, in a small bottle, dated — take-home, a small corked bottle per
guest of what the host started forty days ago, the start date written on
it (FOUNDER-PENDING — yield, does the kit make enough for ten small
bottles as well as the pour at the table, and if not this and the
envelope are one item and not two); the felt square under the glass —
take-home and table set, a cut felt coaster per guest off the room's own
felt (FOUNDER-PENDING — the own-stock ruling makes this its own
per-guest line rather than a claim on the shared runners, and the sheet
is not certain a runner and a coaster are cut differently enough to be
two rows).
HOST ACTS: naming where things came from (one sentence per thing); the
caffè corretto offer (bottle over the cup, raised eyebrow); the genepì
pour with the 40/40/40 story (GESTURE) — genepì KIT ships at
min_lead_days ~40 (member makes it), bought fallback + story card.
ROUTE TO DISH POOL: fixed sequence (broth/canederli → the pot → simple
dessert); bread landed whole (no chest-cut); NO descent course — early
clean stop is the luxury.
ROUTE TO DRINK PROGRAM: hot VOV (not "Bombardino" — 1970s name), vin
brulé, corretto, genepì recipe.
KILLED: vintage ski/boot decor, costume brief (→ one dress line),
chest-cut bread.

## HAVANA, 1957
GOODS: monstera + real cut palm fronds in brass; hibiscus floated in
bowls; whole ripe fruit piled as centerpiece; double-nine dominoes in
wooden box; cafecito kit (tacitas, sugar bowl, pot).
GOODS: the small glass, kept — take-home and table set, the tacita the
espumita was whipped into, one per guest (FOUNDER-PENDING — cost, small
porcelain cups at ten per party is the most expensive item on the sheet,
and is the Dolomites grappa glass the same row in another material or
two real items collapsed into one); the song somebody named for you —
take-home and atmosphere, everybody names the song that gets somebody
else up and nobody names their own, the slip with your song on it goes
home in their handwriting (FOUNDER-PENDING — this is the New Orleans
story-slip frame with one ingredient swapped, if the founder disagrees
it becomes an affinity claim on that row and Havana drops one); the
second supper, wrapped, for the walk — take-home, a pressed sandwich
wrapped in paper handed over at the door, the third feeding in a house
that promises two (FOUNDER-PENDING — does a consumable belong in this
slot at all, or does it belong in the dish pool with a note that it
travels).
HOST ACTS: the espumita whip — cafecito served WITH dessert (launches
the dancing; dawn-pour variant pooled) +technique card; the good bottle
held back and produced late; the table pushed back (GESTURE).
ROUTE TO DISH POOL: second supper (existing); dawn timing.
ROUTE TO DRINK PROGRAM: cafecito; the rum pour.
KILLED: hand fans (church fans are NOLA's; abanico blurs), all "Havana
Nights" prop content (standing kill).

## LAS VEGAS, 1960
GOODS: relish tray presentation; red-glass votives; one stem at each
place (rose translation, ungendered); leather dice cups + five dice
each + liar's-dice rules card + era stakes-suggestion card; Celebrity
1960 deck (~80 printed marquee-ticket slips + draw vessel + fishbowl
three-round rules); Pick-a-Number kit (rules card + a wrapped prize —
"everyone wins eventually; that's the game").
GOODS: the chip you did not spend — take-home and atmosphere, one chip
per guest out of the one game with the one agreed stake, spent or
unspent, won or not (FOUNDER-PENDING — does the chip carry a mark,
unmarked it is a chip and marked it becomes merchandise printed in
advance, which is the failure the bar names); the stake, signed —
take-home and atmosphere, the agreed number written on a small card
upstairs before anybody goes down, signed by everyone, one copy each
(FOUNDER-PENDING — money is never a joke in this room, does a signed
stake card read as straight or does printing it turn a kindness into a
bit); the swizzle stick — take-home, a plastic swizzle out of the drink,
one per guest (FOUNDER-PENDING — unbranded or marked, the room refuses
neon and casino register so anything printed on it has to be the house's
gold rather than a property's name); the photograph somebody else took —
take-home, the souvenir folder photograph taken at the table by somebody
whose job it is, handed over in a card folder before the night ends
(FOUNDER-PENDING — three rooms now carry a photo mechanism,
Westhampton's Polaroid, Aspen's camera developed a week later and this
one, and three is probably one too many); the number off the door —
take-home, a numbered fob tag matching the room number on the house
note, handed over on arrival (FOUNDER-PENDING — the sheet marks it thin
and asks to cut it, nothing happened to it and it opens nothing, and the
own-stock ruling reaches stock rather than quality so the question is
still open); the IOU for the late supper — take-home, THE EVENING
SUPPLIES IT (one guest only; from game yields_iou), a small pre-printed
form, filled in at the table, kept by whoever owes, a debt in somebody's
handwriting for steak and eggs at four (FOUNDER-PENDING — money is never
a joke in this room, written straight and in the fewest words does an
IOU clear that, and the harder question the third category raises is
that the form itself is PRINTED IN ADVANCE, which is the one thing she
said this category never is, so confirm that the writing rather than the
paper is what makes it evening-supplied).
HOST ACTS: tableside Caesar (pool act, +technique card) OR flaming
dessert — ONE table presentation per package, never both; flaming
dessert is the GESTURE; Pick a Number as the host's game.
ROUTE TO DISH POOL: relish tray as landed course; flambé desserts
(existing); late diner-hour plates (`descent`).
KILLED: none — research bench held.

## PORTOFINO, 1961
GOODS: glass carafes of tap water; small bowl of lemons (sparse dose);
rosemary + olive branches in stoneware jugs; oyster... no — pasta
board, flour scoop for the lesson.
GOODS: the trofie you rolled — take-home, the trofie a guest twisted at
the pasta board during the lesson, floured and folded into a paper
twist, not cooked (FOUNDER-PENDING — does an uncooked flour-and-water
good belong in the bank as a take-home, or does the routing rule push it
at the dish pool the moment it becomes edible); the order leaf —
take-home, a carbon duplicate order pad on the table, the leaves torn
off and handed round at the end (FOUNDER-PENDING — does a carbon pad
breach the slips rule, or is that rule about game content only and a
guest writing an order outside it); the room's key tag — take-home, a
plain wooden or brass fob numbered or named for the room a guest slept
in, not asked for back (FOUNDER-PENDING — does a houseguest object work
when the occasion is a dinner rather than a stay, or does this become a
getaway-only take-home); breakfast, in wax paper — take-home, focaccia
col d'oro wrapped in wax paper and pressed on people as they go
(FOUNDER-PENDING — is the thing they take home allowed to be consumed,
or must it outlive the weekend); the boat count card — take-home, a
small stiff card per person ruled for two numbers, the boats counted on
the way out and the boats counted on the way back (FOUNDER-PENDING — is
this too clever by half, a joke that needs the party to explain it, and
does it die in a pocket in March instead of landing); the bar token —
take-home, a printed cardboard cassa token of the kind paid for at the
till, good for one espresso taken standing (FOUNDER-PENDING — held as
period-correct since the pay-at-the-cassa ticket long predates the
fiscal receipt of the 1980s, but the sheet wants it checked by somebody
who has held one); the whole schedule — take-home, a card per guest
listing what is open and on which days, which is a very short list
(FOUNDER-PENDING — printed in advance so it carries no evidence of the
evening, does that make it the weaker kind or does the joke earn it);
the tin from the good place — take-home, one small tin each of Taggiasca
olives in oil or salted anchovies, nothing printed on it but what it is
(FOUNDER-PENDING — merchandise plainly, worth a slot or is it the item
that proves the room only has fourteen); the mortar pesto, in a jar —
take-home, what came out of the mortar during the lesson spooned into
small jars, one each (FOUNDER-PENDING — the same routing question as the
trofie, plus a real one about food safety and how long a fresh basil
pesto is honestly good for); the phrases — take-home, a card of the
handful of things the person ordering actually said, printed straight
with no translation offered (FOUNDER-PENDING — does printing somebody's
bad Italian read as fond or as mockery, given the humour rule that the
target is never outside the group); the stoneware beaker — take-home and
table set, a small unglazed stoneware cup per guest from the same
register as the jugs the rosemary is in (FOUNDER-PENDING — affordable at
few, is it still affordable at the top of the guest range and does a
plain beaker read as anything at all); the between-us card — take-home
and table set, a small card at each place carrying the house's one line
about what stays at the table, said once and not repeated
(FOUNDER-PENDING — the sheet calls this the most twee thing in its six
rooms and asks whether to kill it); the off-season timetable —
take-home, a printed boat timetable for the months half the town is
shut, folded to pocket size (FOUNDER-PENDING — is a timetable readable
as an object, or is it just paper with numbers on it that nobody will
keep); the olive-wood spoon — take-home, a small turned olive-wood
spoon, one each (FOUNDER-PENDING — the sheet flags this against itself,
olive wood is the most reflexive three-coast object there is and it
would be cut before it was defended).
HOST ACTS: host orders for the table, menu never opened (GESTURE);
trofie lesson as opt-in craft (+technique card: trofie + mortar pesto).
ROUTE TO DISH POOL: Focaccia di Recco (signature, travels nowhere),
focaccia col d'oro, Taggiasca olives, salted anchovies.
ROUTE TO DRINK PROGRAM: Americano (build on card), Vermentino.

## TAHITI, 1961 *(destination-level requires_outdoors)*
GOODS: the conch (pū) — object + act, lives on her shelf after; blossom
bowl of single tiare/tuberose + lore card (left, taken; right,
looking); lei-making kit — needle, cotton thread, blossoms (+kui-method
technique card, opt-in craft); single-flower or shell leis
(min_lead_days high, shell/single-bloom fallback authored); star kit —
the catalog's one DIGITAL good: named app + "what's overhead" card for
her date, wayfinder framing; banana-leaf runner; floated blossoms;
half-coconut bowls; monoï as object (never appellation).
GOODS: the vanilla bean — take-home, one Tahitian vanilla bean per guest
in a plain paper sleeve with its name on it and nothing else
(FOUNDER-PENDING — the sheet raises no question, so the row carries the
standing one, does it ship); the pearl-shell disc — take-home and table
set, a polished round of black-lipped pearl shell at each place,
doubling as the marker for where a person sits (FOUNDER-PENDING —
sourcing at scale, is there a supplier who cuts pearl shell offcuts
cheaply, and polished or left as it comes); the shells you strung —
take-home, small shells threaded on cotton in the afternoon alongside
the blossoms, worn or pocketed the same night (FOUNDER-PENDING — this
overlaps the shell-lei good already shipping, is it a distinct row and
does claiming it break the fallback that was already authored); what
came in, written down — take-home, a card per guest naming what the boat
brought that day, written the same afternoon, no hour on it
(FOUNDER-PENDING — the host writes the name of a fish, is that a blank
the member fills and does it fail the slips rule); the small monoï —
take-home, a guest-sized bottle of monoï, one each, named for what it is
and never for an appellation (FOUNDER-PENDING — the own-stock ruling
makes the per-guest bottle its own line rather than a claim on the
placed monoï, confirm that is wanted rather than double-counting); the
sky for that night — take-home, a printed card of what was overhead on
the guest's actual date, in the wayfinder framing, one per person
(FOUNDER-PENDING — the star kit's card is hers and ships once, so the
own-stock ruling makes the guest card its own row, confirm that is the
intent); the pearl-shell lure — take-home, a small shell-and-hook bonito
lure of the kind actually fished from these islands, one each
(FOUNDER-PENDING — where exactly does this sit on the costume line, a
real working object or jewellery pretending to be one); the plaited
square — take-home and table set, a hand-width of plaited pandanus made
sitting down in the afternoon, taken away flat (FOUNDER-PENDING — this
is a second daylight craft competing with the flower stringing for the
same hours, one room and two crafts, too many); the cord — take-home, a
coiled length of coconut-fibre cord, one each (FOUNDER-PENDING — too
obscure to read as anything without a card explaining it, which this
room's voice will not do); the black sand — take-home, a small stoppered
vial of the black sand the table stood on (FOUNDER-PENDING —
vial-of-sand is very close to gift-shop, twee or saved by the sand
actually being black); the tamanu nut — take-home, one dried tamanu nut
per guest, off the tree the oil comes from (FOUNDER-PENDING — does an
object nobody can identify do any work at all).
HOST ACTS: the conch blown at dusk — dinner called (the room's "dinner
is served"; card notes three tries are the charm).
GAMES: none, on purpose.
ROUTE TO DISH POOL: existing pool; NO earth oven in any form (killed).

## CÔTE D'AZUR, 1962
GOODS: pastis kit (bottle, water carafe, short glasses); anchoïade/
tapenade crocks with raw vegetables; rosé in bucket alternating with
water bottles down the table; clay pitchers of tap water; green figs in
bowls (seasonal; fallback = the ripe fruit of the moment); wild
lavender LOOSE in low stoneware (never bundled/ribboned) + olive
branches; thick white beeswax pillars ON MISMATCHED SAUCERS from the
cupboard (never directly on cloth, never in wine bottles); faded
imperfect cloth; belote rules card; pétanque set (requires_outdoors, no
indoor fallback).
GOODS: the short glass — take-home and table set, the thick plain short
glass a guest drank the one cocktail out of all afternoon, taken away as
it stands (FOUNDER-PENDING — the pastis kit already lists short glasses,
so confirm the per-guest glass is its own line rather than the kit's set
being given away); the mismatched teaspoon — take-home and table set,
one old mismatched teaspoon per guest, none of them a pair
(FOUNDER-PENDING — cheap in bulk from a flea lot, but sourcing eighty
genuinely mismatched spoons is somebody's afternoon, practical at
scale); the melon seeds — take-home, seeds from the melon eaten with
port in the hollow, dried and folded into a paper packet, one per guest
(FOUNDER-PENDING — will seed off a table melon actually come true, and
does a seed packet cross an agricultural border cleanly); the loose
dried aromatic — take-home, a handful of wild lavender loose and never
bundled or ribboned, pressed into a paper cone as people go, with dried
eucalyptus off the foraged pile as the Big Sur substitution (Also at:
Big Sur) (FOUNDER-PENDING — lavender in a paper cone is one step from
the Provence gift-shop sachet the room would hate, does loose and never
bundled hold the line, and the Also at line makes Big Sur a second
native claim on this one row rather than the affinity the sheet
proposed — affinity would have left it ineligible there); the crock — take-home and table set, the small
glazed crock a guest's anchoïade or tapenade was in, one per guest,
taken with whatever is left in it (FOUNDER-PENDING — does a per-guest
crock fight the staging, which has the crocks as shared centre-of-table
objects, and the own-stock ruling makes it its own line either way); the
savon de Marseille — take-home, a small stamped cube of Marseille soap,
one each (FOUNDER-PENDING — merchandise, with no connection to the
evening at all, does its sheer longevity buy it a place anyway); the
louche card — take-home, the louche technique card one per guest rather
than one per table, water first and never ice first (FOUNDER-PENDING —
the own-stock ruling makes the per-guest copy its own row, confirm that
is wanted rather than a quantity change on the act's card); the marc,
small — take-home, a miniature of the marc that closes the evening,
carried off (FOUNDER-PENDING — cost and alcohol shipping at any real
guest count, this probably fails before taste gets a vote, confirm and
cut); the come-up card — take-home, a card with the road on it and the
reply convention printed under it, nobody counted (FOUNDER-PENDING —
this is invitation material doing a take-home's job, cut it and let the
invitation carry the line); the labels off the bottles — take-home, THE
EVENING SUPPLIES IT (per guest; from the_drinks yields_label), the rosé
labels soaked off the accumulated empties in a basin at the end and
handed round wet, flat into a book and found again in a decade
(FOUNDER-PENDING — soaking labels is an ACT performed by somebody, does
that make this a host act pointing at a good the way the louche points
at pastis, and the supply is bottles rather than guests); the cork with
the hour on it — take-home, THE EVENING SUPPLIES IT (per guest; from
the_drinks yields_cork), a cork marked with the hour its bottle was
opened, from a table that opened bottles from one o'clock until it got
dark (FOUNDER-PENDING — the terrace never mentions the clock and the
voice says to let the hour do the work, does writing hours on things say
the quiet part out loud).
HOST ACTS: the louche (+technique card — water then never ice first);
aïoli mounted in the mortar (pool act, +card); coffee-and-marc carried
elsewhere to close; the refusal to end (GESTURE — the host never once
suggests moving).
SCENE-CARD EVIDENCE (not staged): empty rosé bottles accumulating.
ROUTE TO DISH POOL: melon de Cavaillon with port in the hollow; the
bridge cheese (named on menu, before dessert); fruit floated in cold
water to close; NO descent (afternoon room).
ROUTE TO DRINK PROGRAM: pastis, marc, the rosé.

## CATSKILLS, 1963 *(year stays 1963 — decided)*
GOODS: enamelware committed (plates, speckled pot, pitcher); printed
"Camp [name]" ledger, pre-filled ridiculously + blanks; HELLO MY NAME
IS tags AS PLACE SETTINGS ONLY (host writes camp names or doesn't;
nobody wears anything); bell, gong, or triangle — the dinner call;
faded checked oilcloth (kitsch guard: faded/mismatched only);
wildflowers in a jar or milk glass, minimal; string lights; Bingo kit
with corny pre-written call card; gin deck; mah-jongg owned-if-present.
GOODS: the rock place setting — take-home and table set, rock place
settings with either twine wrapping or the initials of the guest, the
founder's own words unaltered (FOUNDER-PENDING — does the twine variant
and the initials variant ship as one row with a choice at packing or as
two rows, they behave differently, twine is wrapped in advance and
initials are written at the table); the swim-check tag — take-home, a
wooden tag with her camp name on it in grease pencil, hung on a board by
the door and taken off its hook on the way out (FOUNDER-PENDING — the
buddy board only makes sense if the room has water and the premise says
there is a lake if there is a lake, does the tag ship anyway as a
place-marker or is it lake-conditional); the manila trunk tag —
take-home and table set, a strung manila shipping tag with her camp name
written on by the host, tied to the back of her chair and onto a handbag
on the way out (FOUNDER-PENDING — demoted once the rock arrived, is the
manila tag the cheap alternative at a tier where stones are impractical,
or is it now redundant and cut); the ribbon — take-home, a pinked-edge
satin award ribbon in the standings colours, pinned on when the fake
standings are read out (FOUNDER-PENDING — the sheet raises no question,
so the row carries the standing one, does it ship); the boondoggle
keychain — take-home, plastic lacing in two colours and a keyring set
out in the afternoon, whoever picks it up braids one badly and keeps it
(FOUNDER-PENDING — does the take-home slot accept a craft output, or
does a take-home have to be handed over rather than made); the enamel
mug — take-home and table set, a speckled enamel mug with her camp name
on a strip of adhesive tape, hers from eleven in the morning and hers to
take (FOUNDER-PENDING — enamelware is already committed as goods, is a
per-guest mug a cost problem at crowd size and does it collide with the
plates and the pot as one enamel object too many); the last-day sheet —
take-home, a mimeographed sheet per guest, passed round the table at
dessert for everyone to sign (FOUNDER-PENDING — mimeo purple is exactly
1963 and completely unavailable now, is a printed imitation of a
mimeograph honest or is that the kitsch guard's business); the final
standings — take-home, a single printed sheet of the day's invented
standings with every camp name on it, handed out when the tummler reads
them (FOUNDER-PENDING — the standings are comedy from the front, does
printing them flatten the joke by making it checkable); the wooden
nickel — take-home, camp canteen scrip, a wooden nickel good for one bug
juice, spent or not (FOUNDER-PENDING — period-true since resorts and
camps both issued scrip, but is it one printed object too many in a room
already carrying ledger, tags, certificates, standings and bingo); the
song sheet — take-home, a one-page sheet of camp songs with the corny
verses printed out, at each place for the loud part of dinner
(FOUNDER-PENDING — which songs, anything specific risks rights and
inventing camp songs risks preciousness, is a sheet of genuinely
public-domain verses enough); the pencil — take-home, a stamped Camp
pencil at each place, used to mark the bingo card and sign the last-day
sheet (FOUNDER-PENDING — this is merchandise printed in advance and the
sheet says so, is a functional favour that becomes evidence by use worth
carrying or does it dilute the strong items around it); the team bandana
— take-home, a cheap cotton bandana in the colour of whichever side the
standings put her on, taken from a basket in the afternoon
(FOUNDER-PENDING — costume briefs are killed catalogue-wide, is a thing
handed out at the party clearly on the right side of that line or does
it read as the same instruction arriving later); the postcard, mailed
Monday — take-home, a printed camp postcard she writes to herself or to
whoever is not there, dropped in a bowl, stamped and posted by the host
on Monday (FOUNDER-PENDING — this breaks a stated exclusivity since
Aspen is the only room whose artifact arrives a week after, does Aspen
keep the mechanism outright or keep only the photograph); the luggage
decal — take-home, a gummed camp decal for a suitcase, the kind that got
layered on trunks (FOUNDER-PENDING — merchandise, does a decal read as
period-charming or as theme-party supply); the patch — take-home, an
embroidered camp patch, the felt-and-chain-stitch kind (FOUNDER-PENDING
— merchandise printed in advance and the weaker kind, worth it for how
well patches actually survive, or cut); the pennant — take-home, a small
felt pennant with the camp name, rolled to carry (FOUNDER-PENDING — the
kitsch guard on this room is faded-and-mismatched-only, is a crisp new
pennant already over that line); the whistle — take-home, a tin whistle
on a braided lanyard, the counsellor's object, handed to whoever ends up
running something (FOUNDER-PENDING — a room full of adults with whistles
is either the funniest thing in the catalogue or the most annoying, and
the sheet cannot tell which); the soap-on-a-rope — take-home, camp-issue
soap on a cord, era-exact and completely unserious (FOUNDER-PENDING —
marked thin on purpose, it is a joke about camp rather than a thing from
this camp, cut it).
HOST ACTS: tummler bits — invented awards announced, fake standings
read aloud (comedy from the front, zero participation required); mock
award certificates (pre-written categories + blanks) at dessert.
GESTURE: FOUNDER DECIDES — mock awards vs. last-up-turns-off-the-
string-lights (currently staged as the latter; awards proposed as more
this-room; teasing register = belonging, per the voice).
ROUTE TO DISH POOL: comic-abundance course landing; fruit cup opener;
afternoon watermelon/ice-cream-sandwich register; NO descent.
ROUTE TO DRINK PROGRAM: "bug juice" (named spiked punch, card carries
the name); egg creams.

## PALM SPRINGS, 1965 *(destination-level requires_outdoors — BENCH
THIN, founder to feed)*
GOODS: circulating trays; citrus bowl; poolside glassware.
GOODS: the sack of dates — take-home, a paper sack of medjools, the
valley's actual crop rather than an import (FOUNDER-PENDING —
food-shaped, is this a good handed at the door or does anything edible
have to route to the dish pool, the routing rules do not cover the
case); the sunglasses — take-home, a tray of cheap sunglasses by the
door, take a pair, nobody is checking (FOUNDER-PENDING — merchandise,
but the only merchandise in this room that gets genuinely used for the
whole party, worth it or too close to a novelty basket); the Lucite tag
— take-home and table set, a Lucite keyring with her name, the place
marker at the table before it goes on her keys (FOUNDER-PENDING — the
mechanism is Catskills' manila tag in a completely different material,
is that a legitimate register difference or the same idea twice in one
catalogue); the swizzle stick — take-home, a printed plastic swizzle in
the tumbler, of the kind people genuinely collected in 1965
(FOUNDER-PENDING — this is the closest thing in the room to New York's
matchbooks, same slot and same era-collectible logic, a good parallel or
a duplication); the crate label — take-home, a lithographed citrus-crate
label from an invented grove, one per guest, in the desert-modern colour
register (FOUNDER-PENDING — the grove must be invented rather than a
real grower's brand, is a fictional label honest or does a fake antique
cross into the theme-supplier territory the brief forbids); the
pool-rules card — take-home, a small printed card of the house's rules
for the pool, all of them unenforceable and one of them about the
switch-off (FOUNDER-PENDING — rule 10, does a card of house rules author
at the guest, or is it clearly the host's joke that she is issuing); the
cocoa butter tin — take-home, a small unbranded tin of cocoa butter off
the circulating tray, era-correct (FOUNDER-PENDING — monoï is explicitly
Tahiti's object, is cocoa butter far enough away or is any suntan
preparation now spoken for); the cutting — take-home, a rooted cutting
from the garden per guest, wrapped in wet newspaper (FOUNDER-PENDING —
marked thin because party-favour plant is now a wedding cliché, is 1965
far enough upstream of that to rescue it or is it just twee); the towel
tag — take-home, a numbered tag pairing her with a towel from the stack
for the afternoon, kept afterwards (FOUNDER-PENDING — cut, it exists
because the sheet wanted a fifteenth, which is exactly the padding the
brief warns against, and the sheet flags that rather than hiding it);
the drink flag — take-home, a small printed paper flag on a pick, one
design per drink on the circulating tray (FOUNDER-PENDING — parasols and
bamboo are already killed at Acapulco as tiki drift, does a paper flag
land on the right side of that kill or is it the same object in a straw
hat); the signed napkin — take-home, THE EVENING SUPPLIES IT (one guest
only; from the night itself), a heavy paper cocktail napkin passed round
for signatures as a joke about who is here, carrying the handwriting of
the afternoon (FOUNDER-PENDING — the room's risk is Westhampton's
questionable guests, is a mock-autograph napkin the funny version of
that or the cheap version, and the own-stock ruling held it on quantity
because one napkin passed round is one object while the founder has
since filed it among the one-of-ones, so the promise recorded here is
hers rather than the sheet's, and the second half needs her too because
a heavy paper napkin IS stock the house could ship).
HOST ACTS: the sundown switch-off (GESTURE).
Everything else pending founder material.

## BIG SUR, 1971 *(explicitly survives indoors; game night legal)*
GOODS: cast iron/dutch oven as serving vessel + trivet; wool blanket
pile; jug wine or magnums, passed; improvised candle surfaces (jar,
saucer, the finished jug's neck — the one room where bottle-candles
live honestly); hand-thrown stoneware plates + heavy earthy linen
napkins; foraged centerpiece — ferns, dried eucalyptus, river stones,
driftwood ("the beach is the florist"); noun-game 1971 slips (nouns can
be things — the fog is a card); Thoth tarot deck out (1969, object
only, no reader — NOLA owns the reading).
GOODS: bay leaves, a handful — take-home, California bay picked off the
trees along the road, a handful each, tied or loose (FOUNDER-PENDING —
California bay is much stronger than the Mediterranean leaf people
expect, does the card have to say so and does saying so turn a fact into
an instruction); the map with the pull-off marked — take-home, a folded
paper map of the road with the one past the bridge marked on it, one per
guest (FOUNDER-PENDING — is this arrival material rather than a
take-home, the road is one of the things this voice breaks character for
and a map that is also safety information may belong at the front of the
evening); what was played, in order — take-home, a card listing the
records that got named aloud at the fire, in the order they were played,
with the one line each got (FOUNDER-PENDING — affinity candidates exist
at Westhampton's record flip and Acapulco's named first song, should
this be one row across three rooms); the hand-thrown cup — take-home and
table set, a small hand-thrown stoneware cup, one each, from the same
hands that made the plates (FOUNDER-PENDING — the sheet argued this is
the vessel the guest was already given and it is not, a cup is not one
of the plates, so the per-head cost objection comes back and wants a
real number at the top of the guest range); the abalone shell —
take-home, an abalone shell, the era's dish and ashtray and everything,
one per guest (FOUNDER-PENDING — the red abalone fishery has been closed
since 2018 and two other species are endangered, can this be bought
clean at quantity, and if not it should be cut loudly rather than
quietly); a redwood cone — take-home, a coast redwood cone per guest,
startlingly small for the tree (FOUNDER-PENDING — the sheet raises no
question, so the row carries the standing one, does it ship); the
bandana — take-home, a plain cotton bandana, one each, used for the pan
handle at the fire and kept (FOUNDER-PENDING — how close is this to the
1971 costume the premise refuses, the sheet thinks one step too close,
which is why it is thin); the poured candle — take-home and light, wax
poured into a jar at the fire and carried off once set (FOUNDER-PENDING
— the improvised candle surface is the room's whole candle answer and it
is improvised by her, does shipping a pouring craft contradict it); the
creek stone — take-home, THE EVENING SUPPLIES IT (per guest; from the
night itself), a stone out of the creek the beer was kept in
(FOUNDER-PENDING — river stones are already staging here, is the
take-home version anything more than picking one up).
HOST ACTS: the one-pan supper landed whole; the record named aloud
("this is for the fog"); reading aloud (pooled, LOW weight — founder
flag: preciousness risk); the seeded story (GESTURE — she asks the
question she knows the answer to and stops the music; whether the room
takes it is the party's business).
CANNABIS: owned-if-present GLANCE only — nothing shipped, sourced, or
instructed; if glanced, the one line is "labeled and separate from the
food." Founder + counsel decide whether even the glance ships.
ROUTE TO DISH POOL: cookies/brownies warm from the pan (`descent`);
s'mores (requires_outdoors).
ROUTE TO DRINK PROGRAM: the jug wine note.

## NANTUCKET, 1972
GOODS: THE PRINTED '72 BROADSHEET — reproduction summer-1972 front
pages as the table covering (Fischer–Spassky, early Watergate, Orr;
guests read the table); small battered saucepan (butter served in it);
shell buckets; paper plates ON PURPOSE (note says so — no upgrades);
oyster knife + kitchen towel kit; hydrangeas cut SHORT in a mason jar
(careless-small — Westhampton's are careless-abundant) or nothing;
candle stubs on a saucer or none; transistor-register sound; cribbage
board (ship cheap or owned); chess owned-if-present (scene-card glance
— it's on the front page).
GOODS: the knife you learned on — take-home, a cheap wooden-handled
oyster knife, one per person who joined the shucking, kept
(FOUNDER-PENDING — the own-stock ruling reverses the sheet's reading,
the shucking kit ships one knife so this cannot be a second claim on it
and is its own per-guest line, and the live question is whether the
towel folds into the same item); the pick — take-home and table set, a
wooden lobster pick or mallet at every place (FOUNDER-PENDING — is a
lobster pick generic New England rather than this room specifically,
which is the failure shape rule 6 catches on the plate); the chowder
card — take-home, a plain index card with the chowder on it, handed to
whoever asks, which is everybody (FOUNDER-PENDING — does a recipe card
belong to the bank or to the dish pool, given the routing rule that
anything edible goes to dishes); the right way — take-home, a card on
how a lobster is taken apart, ending with the plain note that everybody
has a different one (FOUNDER-PENDING — printed in advance so the weaker
kind, does the last line earn it); the week's tide chart — take-home, a
folded tide table covering the days a guest was on the island, one each
(FOUNDER-PENDING — does this belong to the take-home slot or to the
arrival, where a tide is safety information the voice breaks character
for); the beach plum jelly — take-home, a very small jar of beach plum
jelly, one each, the island's own late summer fruit (FOUNDER-PENDING —
beach plum is August into September and the room is written as August,
does a season band handle that or does this need an authored fallback);
the jar with a stem in it — take-home and table set, a small mason jar,
one per guest, with one short stem in it (FOUNDER-PENDING — the staging
is one jar, careless and small, does putting a jar at every place turn a
decision into a scheme, and the second claim makes it cheaper without
making it more honest); the ferry stub — take-home, a reproduction 1972
ferry ticket stub, one per guest (FOUNDER-PENDING — the guests did not
take the ferry, is a prop stub for a crossing nobody made a lie the room
would refuse); the shell out of the bucket — take-home, THE EVENING
SUPPLIES IT (per guest; from the_main yields_shell), a quahog or clam
shell picked out of the shell bucket and rinsed at the outside tap on
the way to the car (FOUNDER-PENDING — shell scatter was reassigned to
Big Sur as staging, does claiming the shell take-home for Nantucket
where the buckets already live cross that line or respect it, and this
is the founder's own worked example of a CONDITIONAL dependency because
it is a take-home only in the packages whose main course was the
bucket); the rose hip — take-home, THE EVENING SUPPLIES IT (per guest;
from the night itself), a few hips off the beach roses along the lane,
dried, holding their colour for a season in a bowl (FOUNDER-PENDING — is
this the same frame as the hydrangea, two dried plants from one room,
and should one of them go); the bands — take-home, THE EVENING SUPPLIES
IT (per guest; from the_main yields_claw_band), the rubber bands off the
lobster claws, worn on a wrist for the rest of the night and taken home
on it (FOUNDER-PENDING — is this a joke the house makes or a joke the
house explains, the second one dies).
HOST ACTS: the pot-dump onto the headlines (GESTURE); chowder ladled at
the stove (nothing announced — the smell does it); shucking as opt-in
craft (+technique card: hinge, towel grip — towel, never palm).
ROUTE TO DISH POOL: chowder-first sequence; pie on the same paper (no
reset); NO descent (ends with the kitchen lamp).
KILLED: the weather-forecast act.

## AMALFI COAST, 1953 *(no premise in src/lib/destinations.ts — one of
the five unwritten rooms, so every take-home line below is built from this
bank entry, the matrix row and the contrast brief only, and none of it is a
world fact)*
GOODS: TOMBOLA KIT — tombolone board, wooden tokens in cloth bag,
printed cartelle, Smorfia translation sheet (period graphics), sack of
dried beans as markers, FIVE wrapped prizes in ascending tiers (ambo =
a lemon; cinquina = genuinely nice — the unwrapping paces the night);
Napoletane-pattern 40-card deck + scopa rules card (early/side game,
2–4 players, while the table grows); majolica/painted ceramic (bright-
vessel register vs. Portofino's stoneware); lemons at FULL dose (bowls,
mantel, prize); carafe wine, unlabeled register; string bulbs;
bougainvillea if the florist can, else the lemons are the color.
GOODS: the painted tile — take-home and table set, a single hand-painted
ceramic tile per guest, from the bright-vessel register rather than the
stoneware one (FOUNDER-PENDING — cost per tile at crowd scale, and
whether hand-painted survives that scale or becomes transfer-printed, at
which point it is a souvenir and the founder should know); the Smorfia slip —
take-home, a small printed slip with one number and what it means, one
per guest, off the same sheet the tomboliere is calling from
(FOUNDER-PENDING — twee risk, is this a fortune cookie in period dress);
the song sheet — take-home, a printed sheet of the words to the one
everybody sang, one per guest, in period setting (FOUNDER-PENDING —
rights on any lyric still in copyright, which for canzone napoletana
varies wildly by song, which titles are clear); the rosolio — take-home,
a very small bottle of the lemon liqueur she made a month earlier, one
each, never called by a brand name (FOUNDER-PENDING — at crowd this is
the most expensive thing on the list and it is alcohol, does it survive
the guest count or is it the take-home for the small end of the range
only); the santino — take-home, a small printed holy card of the kind
that was in every wallet and every missal in 1953 southern Italy
(FOUNDER-PENDING — does religious material belong in a party product at
all, it is unimpeachably period and it could read badly, the founder
decides and not the sheet); the ticket up — take-home, a reproduction
cardboard boat ticket, one per guest, since the brief has arrival by
boat or by steps (FOUNDER-PENDING — the same objection as Nantucket's
ferry stub, nobody took a boat, is a prop ticket for a crossing that did
not happen beneath this house); 
the closer's card — take-home, the lemon-liqueur technique card one per
guest rather than one per house, with the lead time on it
(FOUNDER-PENDING — the own-stock ruling makes the per-guest version its
own row, confirm that is wanted rather than a quantity change on the
act's card).
HOST ACTS: the TOMBOLIERE — host pulls tokens and calls the Smorfia
meanings, the table shouts back (GESTURE); arrivals applauded (standing
act — host claps first); "ancora una" — one small plate added late,
protest waved off.
ROUTE TO DISH POOL: supper-expands register; ancora-una plate; NO
descent (the prize tiers pace the late night).
ROUTE TO DRINK PROGRAM: lemon liqueur/rosolio closer (homemade
technique card — genepì's southern cousin, shorter lead; never
"limoncello" as brand for 1953).
SOUND: canzone napoletana lean.

## OAXACA, 1954 *(voice-doc edit flagged: mole is one dish, not the
room's identity — mechanism line softens to the comida/Sunday itself
before staging citations extract)*
GOODS: barro negro (black clay — San Bartolo Coyotepec; the burnished
technique is period) + red clay plates + stoneware copitas; sal de
gusano + orange slices (rides the mezcal); molinillo + chocolate kit;
Baraja española 40-card deck + Conquián rules card (matching games as
the easy option, same card); marigolds in clay (standing); papel
picado — FOUNDER CALL (era-true vs. theme-party-saturated).
GOODS: the twist of worm salt — take-home, a spoonful of sal de gusano
folded into a paper twist, one per guest, because she liked it and the
house does not explain itself (FOUNDER-PENDING — the sheet raises no
question and calls this the item it is most confident of, so the row
carries the standing one, does it ship); the jar sent home — take-home,
a jar of whatever the kitchen has been cooking since yesterday, pressed
on her at the door whether she resists or not (FOUNDER-PENDING — how
does this ship, the host cooks it so the package supplies the jar and
the label rather than the contents, is a take-home allowed to be a
container the host fills); the string of chiles — take-home, a twist of
dried chiles off the kitchen string, one per guest (FOUNDER-PENDING —
which chiles, pasilla de Oaxaca is the regional one and genuinely hard
to source, is a substitution honest or does it quietly become generic
Mexican dried chile and fail rule 6); the piloncillo and canela —
take-home, a cone of piloncillo and a stick of true canela tied in
paper, the two things that make the café de olla (FOUNDER-PENDING —
food-shaped, and does giving away the ingredients undercut the drink
programme's own café de olla entry or complete it); the recipe in the
house's hand — take-home, the recipe written out plainly with no
measurements where none are needed, carrying the Aspen photocopy as its
affinity (FOUNDER-PENDING — the two registers really are different, a
standing authority handing something down against a page run through a
copier, is one row with two claims right or is it two rows); the
chocolate tablet — take-home, a round tablet of the drinking chocolate
the molinillo was whisking, wrapped in paper, one per guest
(FOUNDER-PENDING — the weaker kind, bought in advance and unmarked by
the evening, does its connection to the whisking act rescue it or is it
merchandise with a good story); the jícara — take-home, the half-gourd
cup the chocolate was drunk from at the chairs-to-the-wall turn, one per
guest (FOUNDER-PENDING — is two vessel take-homes one too many for one
room, and if only one survives the sheet would keep the copita because
three mezcals with one sentence each is the stronger act); the
servilleta — take-home, the woven cotton cloth the tortillas arrived
wrapped in, folded and given away (FOUNDER-PENDING — the closest call in
this room, it passes the souvenir test on function because the tortillas
genuinely arrive in it and fails on appearance because a woven textile
is exactly what a visitor buys); the Conquian tally — take-home, THE
EVENING SUPPLIES IT (one guest only; from ambient_game
yields_score_sheet), the running score kept in pencil on whatever paper
was to hand during the long middle of the afternoon, the only written
record of a room whose whole premise is that nothing is written down
(FOUNDER-PENDING — that contradiction is either the best joke in the
room or a violation of schedule=standing, the house does not schedule it
remembers, which is it).
HOST ACTS: the mezcal flight — three copitas, one sentence each
(+story card); the molinillo chocolate whisked to froth (dusk act —
pairs with or replaces café de olla at the chairs-to-wall turn;
selection picks one); chairs to the wall (GESTURE).
ROUTE TO DISH POOL: pan de yema (B, bakery); mole as ONE option in the
comida's abundance; NO descent (light-locked).
ROUTE TO DRINK PROGRAM: mezcal (espadín + one wilder), Oaxacan hot
chocolate, café de olla.

## ACAPULCO, 1959 *(resort-formal: maximum dress, minimum protocol)*
GOODS: long white cloth, bare-decorated (the window is the
centerpiece); champagne COUPES (the era's glass — St. Moritz gets
flutes; the glass dates the room); silver/mirror tray at the threshold
(drink before hello); tuberose — one stem at each place (Acapulco's
white flower; NY keeps gardenia/calla in chrome); CLEAR hurricane
lamps (amber is Westhampton's) + tall white tapers in silver/glass;
SPARKLER KIT — long-burn gold, sand bowl, outdoor_access tag +
NYC-legality flag on card (banned in the five boroughs; fallback =
cork-and-window).
GOODS: the request slip — take-home, the slip she wrote a song on and
handed up to the band, taken back with the band's tick on it at the end
(FOUNDER-PENDING — the room's games line is none on purpose, is a
request slip band infrastructure or is it a game arriving through the
back door); the last-song card — take-home, a small card carrying the
first song named by the host at the start, with the last song written in
by hand as people leave (FOUNDER-PENDING — it requires the host to write
the same line thirty times at five in the morning when the boats are
going out, is that a real host act or a chore invented for her); the
coaster she wrote on — take-home, a heavy paper coaster off the
threshold tray with something written on it during the night by somebody
(FOUNDER-PENDING — the slips rule says any object with player-generated
content ships pre-generated and the member never fills a blank, does
that rule reach a coaster and does it kill this); the wire cage,
kept — take-home, THE EVENING SUPPLIES IT (per guest; from the_drinks
yields_muselet), the muselet from a bottle, taken as it comes off, small
metal, pocket, done (FOUNDER-PENDING — is a plain unbent cage here worth
a separate row at all or should Acapulco simply hold the cork, and
Acapulco likewise has no drink programme in the catalogue so the
dependency reports broken in its own room).
HOST ACTS: the dusk call to the window + sparklers lit and handed off
(GESTURE; spectacle deliverable tier 1 — closes the ◊ pending founder
signature); the loud cork as punctuation (sabrage on the technique
card as optional flourish, spoon variant, founder-flagged); the first
song named (the dressed cousin of Big Sur's record act).
SPECTACLE TIERS: sparklers (default) · loud cork (punctuation) · live
musician booking + era repertoire brief (full tier, per the music
split).
GAMES: none — the band, the window, and the dancing are the shelf.
ROUTE TO DISH POOL: ceviche a la Acapulqueña SERVED IN THE COUPE
(regional, Pacific-Mexican — distinct from Havana's vinegar-marinade
line); late tacos / pressed sandwiches (`descent` — white jackets
eating with their hands at 2 a.m. is the thesis).
KILLED: bamboo-wrapped anything (tiki drift), fireworks, amber
hurricanes here, lamp doctrine (4th strike).

## ST. MORITZ, 1984 *(formality three: dress AND protocol, worn as
irony)*
GOODS: silver everything (bucket, trays, candlesticks — the silver
room as NY is chrome); black-and-white table palette (no other room's);
FLUTES; heavy-stock place cards arranged for intrigue; caviar service
small and unexplained (tin, blini, mother-of-pearl spoon — nothing
admired out loud); full glamour faux-fur throw (statement tier);
black or white tapers in silver; caquelon + long forks + ANGULAR-cut
dippers; backgammon board (claimed fully — '84 alpine is its decade);
apology-champagne STATIONERY — pre-written apology cards ("for the
weekend," "for what I said about the funicular," + blanks).
GOODS: the mother-of-pearl spoon — take-home, a mother-of-pearl spoon
per guest off the caviar service, taken away in a pocket
(FOUNDER-PENDING — the own-stock ruling makes these per-guest spoons
rather than the service's one, per-guest cost is real but not large, is
the room comfortable giving away the piece of the service that reads as
expensive); the timetable card — take-home, a small printed card of the
night's hours, seated at nine and the room changing at one, which turns
out to be accurate (FOUNDER-PENDING — schedule posted is this room's
cell and Dolomites also posts times, but Dolomites posts them in a hall
and the host keeps the notice, is a per-guest card far enough from
that); the dance card — take-home, a small card on a cord with a pencil,
filled in by the people who signed it, nineteenth-century protocol
revived entirely as a joke (FOUNDER-PENDING — the tweeness risk here is
the highest in the document, formality three worn as irony argues for it
and a costume-ball reading argues against, the sheet could not resolve
it); the seating plan — take-home, a printed plan of the table, one per
guest, so everyone can see exactly what the host did to them
(FOUNDER-PENDING — does publishing the arrangement kill the intrigue by
making it legible, or is being legible the point of the joke); the
champagne swizzle — take-home, a small stirrer for killing the bubbles,
a genuine period-luxury object and a genuinely absurd one
(FOUNDER-PENDING — too obscure to read as anything at all without the
card explaining it, and a take-home that needs a footnote may not be a
take-home); the Grand Marnier miniature — take-home, a miniature of the
aged closer, handed over with the coats (FOUNDER-PENDING — shipping
alcohol is a product-level problem rather than a taste one, does the
catalogue ship any liquid at all or does the drink programme handle
every drop); the pocket torch — take-home, a small torch handed out for
the walk back (FOUNDER-PENDING — generic, it would work in any late room
in the catalogue, which by rule 6's logic means it belongs to none of
them, cut it); the black-and-white matchbox — take-home, a plain black
or white matchbox in the room's two-colour palette, on the table for the
tapers (FOUNDER-PENDING — this is New York's mechanism outright and the
sheet recommends cutting it, included so the collision is on the record
rather than quietly avoided); the wire cage — take-home, THE EVENING
SUPPLIES IT (per guest; from the_drinks yields_muselet), the muselet off
a champagne bottle, bent into a little chair over the course of a long
seated dinner and left standing by her glass (FOUNDER-PENDING — the cork
is Acapulco's because the loud cork is Acapulco's act and the cage is
here because idle hands need a long seated dinner, is that split
defensible or is it one champagne artifact stretched across two rooms,
and note that St. Moritz has no drink programme in the catalogue at all
so this dependency reports broken in its own room until one is written);
the backgammon column — take-home, THE EVENING SUPPLIES IT (one guest
only; from ambient_game yields_score_sheet), the night's running score
sheet, one column per player, torn along the fold so each takes her own
(FOUNDER-PENDING — backgammon is claimed fully for '84 alpine, does the
board ship or is it owned-if-present because a score sheet for a board
nobody has is nothing, and the sheet says one column per PLAYER while
the founder filed this among the one-of-ones, so single_artifact here is
her ruling and not the content's); the doubling cube — take-home, THE
EVENING SUPPLIES IT (one guest only; from ambient_game yields_prize), a
spare doubling cube given to whoever wins the last game of the night, a
trophy the size of a sugar lump (FOUNDER-PENDING — the founder has ruled
that a prize is a legitimate take-home shape so the slot question is
closed, and what is left open is whether a spare cube is stock the house
buys or a piece broken out of a set that then arrives incomplete for the
next party); the caviar tin — take-home, THE EVENING SUPPLIES IT (one
guest only; from the_appetizer yields_empty_container), the emptied tin
with its rubber band, given to whoever was rude enough to ask what it
was, a small perfect object and a small permanent insult together
(FOUNDER-PENDING — it is conditional twice over, on caviar being served
at all and on somebody asking, is a take-home allowed to be conditional
on the room's behaviour, and nothing in the dish pool carries
yields_empty_container so this reports broken until a curator tags the
course it comes off).
HOST ACTS: the apology champagne sent across the room with card
attached (GESTURE); the nine o'clock seating held to the minute
(starting without stragglers, cheerfully); the dawn breakfast — the
INVERTED descent: the only room whose late plate goes UP-register
(eggs, pastries, sent-up).
ROUTE TO DISH POOL: dark Swiss chocolate fondue (era-legal by 1984;
cheese fondue stays Dolomites' — the mountain pot split) with
strawberries, banana, angular pound cake, candied orange peel; caviar;
dawn breakfast plates.
ROUTE TO DRINK PROGRAM: champagne; espresso + aged Grand Marnier
poured by the host (closer family).
SEQUENCE NOTE (runsheet framing): dinner → fondue → the room-change
turn → dancing → dawn eggs.

## ASPEN, 1994
GOODS: CD wallet/boombox register (playlist '94: Beasties,
Cranberries, Snoop, Petty); disposable camera in a bowl by the door
(develops LATER — the only room whose artifact arrives a week after);
mismatched pint glasses and whatever mugs exist (the anti-glassware
room); bowls stacked by the pot; wool + faux-fur GEAR PILE (heaped,
grabbed, nobody arranged — the mountain-fur middle tier); shot-ski —
FOUNDER CALL: ships or owned-if-present (vintage ski with mounted
glasses; hangs on the wall between parties); NO florals, NO candles,
every light on (completes the catalog's light spectrum against St.
Moritz's dark).
GOODS: the doubles — take-home, the second set of prints from the
disposable camera, mailed to each guest a week later because 1994
processing gave you two of everything (FOUNDER-PENDING — does the
package cover processing and postage, and who addresses the envelopes);
the dub — take-home, a cassette copy of the afternoon's tape with the
running order written out by hand on the J-card, posted with the
photographs (FOUNDER-PENDING — rights on a compiled tape are a real
problem the bank has already met, does the house ship the J-card and the
tape blank with the host doing the dubbing); the lift ticket —
take-home, a printed ticket on a wire loop twisted onto her coat zipper
at the door, from a mountain that does not exist (FOUNDER-PENDING — is
an invented mountain honest, given that a real one would be
impersonation); the ballot — take-home, a photocopied ballot for the
story competition, ranking the falls, filled in and kept
(FOUNDER-PENDING — the story competition resolves by acclaim, does
adding ballots make it a game with rules, which is a different bank
class); the socks — take-home, a pair of thick wool socks out of the
gear pile, worn all afternoon and not given back (FOUNDER-PENDING — the
gear pile is banked as heaped and grabbed and nobody arranged, does
seeding it with giveaway socks arrange it and break the pile's whole
point); the sticker — take-home, a die-cut sticker for the party, from
the sheet by the door (FOUNDER-PENDING — merchandise printed in advance
and marked so, but sticker culture is genuinely 1994-exact, in or out);
the koozie — take-home, a foam koozie, completely without dignity, which
is the point in the anti-glassware room (FOUNDER-PENDING — does the
room's anti-glamour thesis extend to actively cheap objects, or is there
a line between unfussy and bad that a koozie crosses); the shot glass —
take-home, her glass from the round poured at the story's peak
(FOUNDER-PENDING — this contradicts the room's own doctrine, mismatched
pint glasses and whatever mugs exist means matching shot glasses are the
wrong object here, does the round need a vessel that is not uniform);
the carabiner — take-home, an anodized carabiner keyring off a bowl by
the door (FOUNDER-PENDING — era-correct and cheap, but the most generic
object in this room, does it read 1994 or does it read any-time-since);
the zinc — take-home, a tube of neon zinc, worn on the nose all
afternoon by whoever was going to wear it (FOUNDER-PENDING — neon zinc
is dead-on for 1994 and edges toward costume, is a thing offered rather
than instructed clearly outside the killed costume brief); the trail map
— take-home, a folded paper trail map of the invented mountain with the
afternoon's route drawn on in biro (FOUNDER-PENDING — the invented
mountain has to carry both this and the lift ticket, is one fictional
resort across two objects charming or is it a theme starting to build
itself); the photocopied playlist — take-home, the running order alone
without the tape, run off for people who will not wait for the post
(FOUNDER-PENDING — does this exist at all or is it just the J-card doing
double duty, the sheet leans toward cutting it into the dub); the film
canister — take-home, THE EVENING SUPPLIES IT (one guest only; from
the_atmosphere yields_empty_container), the little black 35mm canister
the exposed roll came out of, used to carry something small home in
(FOUNDER-PENDING — it only exists if the camera is developed by the
host, which happens after the guests leave, so can a take-home be handed
over at all or does it have to go in the post with the doubles); the
trophy — take-home, THE EVENING SUPPLIES IT (one guest only; from game
yields_prize), one ridiculous object, a snapped pole basket or a taped
goggle, handed to whoever won the worst-fall story and kept until
somebody falls harder (FOUNDER-PENDING — it comes with an obligation to
bring it back, which implies a NEXT party and is a claim about
recurrence the product may not want to make, does it); the tape flag —
take-home, THE EVENING SUPPLIES IT (per guest; from the night itself),
the strip of masking tape with her name on it in Sharpie, which is how
anyone knew which mismatched glass was hers, peeled off at the end
(FOUNDER-PENDING — the own-stock ruling killed its dual claim on the
grounds that if nothing ships there is no stock, and the founder's third
category is precisely the case where nothing ships, so this line
restores it as evening-supplied and asks her to confirm that masking
tape and a Sharpie out of the host's own drawer is a take-home the house
may name at all); the bottle cap — take-home, THE EVENING SUPPLIES IT
(per guest; from the_drinks yields_bottle_cap), a cap off the
afternoon's beer with the date scratched into the cork liner
(FOUNDER-PENDING — the sheet marks it thin and says outright that it is
here because seventeen felt better than sixteen, which is the wrong
reason, so cut it, and note that Aspen has no drink programme in the
catalogue so the dependency reports broken in its own room).
HOST ACTS: the round poured at the story's peak — glasses lined on the
counter for whoever's standing there (opt-in by geography); the stop
(GESTURE — called at the moment, coats found, glasses left, out in
ten; the row polices the bench: this party structurally cannot become
its 2 a.m. self).
GAMES: the story competition (worst fall earns the poured round); TV
muted, glanced.
ROUTE TO DISH POOL: the pot (existing); chips-and-salsa counter
honesty (B); cookies register shared with Big Sur.
ROUTE TO DRINK PROGRAM: era shot pours — Jägermeister, peppermint
schnapps (pre-Red-Bull; no anachronistic bombs), the whiskey line.

---

## FOUNDER-PENDING LEDGER (from this bank)
1. Westhampton bench provisional until the Eothen row re-runs.
2. Catskills gesture: awards vs. string-lights office.
3. Vegas: confirm flaming dessert as gesture, Caesar as pool act (as
   written above).
4. Amalfi: tomboliere locked as gesture per founder "ok on the
   tombola" — applause demoted to standing act.
5. Acapulco: sparkler-as-spectacle signature closes the ◊; sabrage
   card optional.
6. Oaxaca: papel picado in or out; mole mechanism-line edit in the
   voice doc.
7. Big Sur: reading-aloud stays pooled?; cannabis glance — founder +
   counsel.
8. Aspen: shot-ski ships or glances.
9. Palm Springs: bench needs founder material.
10. Child-presence question (raised via sparklers): product-level,
    needs its own answer — rooms are written adult.
