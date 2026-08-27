# Take-home proposals — Portofino · Tahiti · Côte d'Azur · Nantucket · Amalfi · Big Sur
**Draft for founder review. Nothing here is seeded, nothing is published, and
every item carrying a founder question stays draft under rule 13.**

Slot: `the_take_home` (db/043) — "the one thing that leaves with a guest."
The bar applied to every line below: a guest can physically carry it out; it is
true to the year; it is true to the ROOM rather than to the country; it is small
and cheap enough that everyone gets one; and it is weighted toward objects that
carry evidence of the evening — used, marked, won or made — over merchandise
printed in advance.

---

## The own-stock ruling, applied — 2026-08-26

**The founder was asked, by all three sheets at once, whether a take-home may
be a second claim on an existing bank row or must ship its own stock. She
answered: "its own".**

What that decides, item by item, is QUANTITY. A table item ships ONE — one
arrangement of florals, one banana-leaf runner, one posted card, one deck. A
take-home ships ONE PER GUEST. So a take-home cannot be satisfied by pointing
at a row whose stock is a single article, which is why New Orleans's "one of
the dark red roses" fails: the florals row is one arrangement and not twelve
roses.

**This does NOT reverse the earlier ruling that an item may claim two slots.**
The founder's Catskills rock is a place setting AND a keepsake — one object,
shipped once — and it works precisely because it is ALREADY one per guest. So:

> A dual claim survives only where the object it sits on is already per-guest.
> Otherwise the take-home needs its own row with its own stock.

**One refinement the ruling forced, recorded because it decides eight items.**
Where a row's stock is BULK — lemons at full dose, pampas, wild lavender, the
beans in the tombola sack, the apology stationery — a per-guest slot can be
carried by raising the order on the row that already exists. That is still the
take-home shipping its own stock; it is just stock on an existing line. Where
the row's stock is ONE ARTICLE — an arrangement, a deck, a kit, a ledger, a
posted card, a caviar spoon — it cannot. Bulk saves the Amalfi lemon and still
kills the New Orleans rose, which is the test that ruling has to pass.

**Every item below now carries an `own-stock ruling` line.** Losers are marked,
not deleted (rule 14). Verdicts:

| verdict | what it means |
|---|---|
| `STAGED` | ships its own per-guest stock. Added to `docs/atmosphere-idea-bank-v1.md` as a DRAFT, carrying a FOUNDER-PENDING question so `seed:bank` holds it back. |
| `SECOND CLAIM, NOT STAGED` | survives as a claim on a row that is already per-guest, or as a dose rise on a bulk row. No new stock, so there is nothing to stage — the work is a `bank_item_slot` row, not a bank item. |
| `KILLED` | points at a row whose stock is one article. |
| `HELD` | the ruling does not reach it: one-per-guest is not established, or the house ships nothing at all. Kept for the founder, not staged. |
| `AFFINITY` | rides on a staged parent row. |
## The three rulings of 2026-08-26, applied a second time

The founder ruled again the same day, on the twenty items this sheet HELD and on
the two questions attached to them. **Nothing above is deleted.** Every entry the
second pass touched now carries an extra line under its `own-stock ruling` line:

| line | what it means |
|---|---|
| `category-3 ruling` | RULING 1. The item is `THE EVENING SUPPLIES IT` — the third category, beside stocked goods and owned-if-present props. It is STAGED into `docs/atmosphere-idea-bank-v1.md` as a draft with its supply, its quantity semantics (`per_guest` or `single_artifact`) and its dependency (a SLOT it watches plus a PREDICATE asked of whatever filled that slot, or `the night itself`). Schema: `db/044-the-evening-supplies-it.sql`. |
| `ruling 2/3` | RULING 2, the bulk refinement, ADOPTED AS STATED — the eight dose-claim entries are now settled rather than proposed; or RULING 3, the broadsheet as the NAMED BOUNDARY CASE, which changes the rule's notes and not its wording. |

The three rulings in full, with the founder's words, are in `docs/proposals.md`
under 2026-08-26; the reader-facing rule is `docs/atmosphere.md`.


**Where the ruling and the sheet disagree, the sheet is left as it was and the
disagreement is written in the ruling line.** Four entries had their own
reasoning reversed: the Nantucket oyster knife (a claim on a one-knife kit, now
its own line), the Nantucket dried hydrangea head (a strength move the ruling
takes back), the Big Sur hand-thrown cup (not "the object you were already
given"), and the New Orleans magnolia leaf (the twin of the rose this sheet
already dissolved, and it was kept).

## Counts

| room | slug | items | strong | fair | thin | dual-claim |
|---|---|---|---|---|---|---|
| Portofino, 1961 | `portofino` | 15 | 5 | 8 | 2 | 3 |
| Tahiti, 1961 | `tahiti` | 14 | 5 | 6 | 3 | 3 |
| Côte d'Azur, 1962 | `cote-dazur` | 14 | 4 | 7 | 3 | 5 |
| Nantucket, 1972 | `nantucket` | 14 | 4 | 8 | 2 | 5 |
| Amalfi Coast, 1953 | `amalfi-1953` | 14 | 3 | 8 | 3 | 5 |
| Big Sur, 1971 | `big-sur` | 13 | 4 | 7 | 2 | 5 |
| | | **84** | **25** | **44** | **15** | **26** |

*(Strengths above are POST-RULING. Before the dual-claim ruling this table read
20 strong / 45 fair / 19 thin; six items moved up a grade because a second slot
claim answered the objection that was holding them down, and the moves are
itemised in the section below. CLAUDE.md rule 14 — the earlier count is kept
rather than overwritten.)*

**No room in this set reached twenty, and I do not think padding to twenty would
survive a read.** The shortfall is not uniform and it is not laziness — it is a
property of the six rooms I was given, stated per room at the top of each
section. Four of the six are deliberately austere object worlds (a town that is
shut; a shore where nothing is arranged; a house that decided in advance not to
be impressive; a coast whose thesis is that nobody prepared anything). Twenty
objects per room is a comfortable target in New York or Las Vegas, where the
evening is *staged*. It is not comfortable here. What I have instead is 20 items
I would defend in front of a guest and 19 I have marked `thin` because they are
either merchandise with no connection to the night, or a good idea I could not
get past a cost or a period check.

**Amalfi is the one room where I am working without a premise.** There is no
`AMALFI` block in `src/lib/destinations.ts` — it is one of the five unwritten
rooms (`docs/destination-contrasts.md`, "The five unwritten rooms"). Everything
in that section is built from three sources only: the bank's Amalfi entry, the
matrix row (`ceremony · unplanned · overlapping · plain · bought · dissolves ·
evening · crowd`), and the contrast brief's instruction that the room reach for
*vertical rather than level, arrival by boat or by steps, and a crowd rather
than a few*. I have invented no world facts. If the founder writes that voice
and it goes somewhere else, this section is re-read, not kept.

---

## How I kept Portofino, Amalfi and Côte d'Azur apart

This was the hard part and it deserves its own accounting, because
`docs/decor-sources.md` already names the failure in plain terms: *"The honest
structural problem: the four Riviera-adjacent destinations blur… 28 of 80 rows
serve both Portofino and Côte d'Azur."* An object catalogue that blurs is
exactly what rule 6 forbids on the plate, applied one layer out.

**Five walls, in the order I trust them.**

**1. The dose split, which the bank already made and which I let govern.**
The bank states it outright: lemons are at FULL dose in Amalfi (bowls, mantel,
prize) and at a SPARSE dose in Portofino (one small bowl). So *a lemon from the
bowl* is Amalfi's take-home and Portofino gets no lemon item at all, not even a
weak one. That is the cleanest instrument I had and I used it hardest.

**2. The vessel register, likewise already split.** Portofino is stoneware,
Amalfi is majolica and painted ceramic, Côte d'Azur is mismatched saucers and
plain glass out of a cupboard. Every ceramic take-home in this document went to
Amalfi (the painted tile). Portofino's vessel item is an unglazed stoneware
beaker and nothing else. Côte d'Azur's are a thick plain short glass and a
mismatched cupboard teaspoon. No room got two.

**3. National material culture used as a wall, not a shortcut.** Pastis, belote,
marc, Marseille soap, wild lavender and a melon de Cavaillon are French and do
not travel. The Smorfia, the corno, the santino and the Napoletane deck are
Neapolitan and do not travel. Taggiasca olives, trofie, mortar pesto and the
shut-out-of-season harbour are Ligurian and do not travel. Rule 6 says regional
travels within a CUISINE and not a country; I read the same sentence about
objects and it holds — a Neapolitan luck charm in Portofino is chicken parmesan
in Portofino.

**4. Each room's EVIDENCE has a different physics, and the take-homes follow.**
Portofino's evidence is *counting and handwriting*: the boats, the order written
out by whoever speaks the least Italian. Côte d'Azur's evidence is
*accumulation* — the afternoon proves itself by how much has piled up, so its
take-homes are the labels, the wax, the cork with the hour on it. Amalfi's
evidence is *play*: the marked cartella, the card dealt at the door, the prize
won. Three coasts, three different ways of leaving a trace, and the objects fall
out of that rather than out of geography.

**5. Size, which sets the economics before taste gets a vote.** Portofino is
`few`, Côte d'Azur is `one_table`, Amalfi is `crowd`. A crowd cannot be given
anything that costs real money, which is why Amalfi's list is paper, a lemon, a
tile and a charm; and `few` is why Portofino may keep a small ceramic and a jar.

**I used ZERO affinity between these three rooms, and zero shared dual claims.**
Not one. If the founder
sees an affinity tag joining Portofino to Côte d'Azur in a later pass, it did
not come from here, and the burden should be on whoever adds it.

### Where I did use affinity, and the one same-frame collision I could not dissolve

- **`the loose dried aromatic`** is authored ONCE, native to `cote-dazur`
  (wild lavender, loose, which the bank already stages there), with
  `affinity: big-sur` and a named substitution (dried eucalyptus off the
  foraged pile). I nearly wrote it twice — lavender in one room, eucalyptus in
  the other — and stopped, because that is precisely the "same frame, one
  ingredient swapped" shape that the proposed-rule note in `CLAUDE.md` says
  found eight real duplicates. One row, one substitution, two rooms.

  **RE-AUTHORED 2026-08-26 — the instinct was right and the mechanism was
  wrong, and the sentence above is kept per CLAUDE.md rule 14.**

  > **affinity re-weights scoring for already-eligible candidates; it never
  > confers eligibility — sharing requires a second native row.**

  `claimEligibility` (`src/lib/selection/occasion.ts`) reads a `native` row as
  a whitelist: an item with any native row is eligible in its native rooms and
  no others. `affinity: big-sur` would have left the row eligible at Côte
  d'Azur ONLY, with a number attached that Big Sur never reads — "one row, one
  substitution, two rooms" would have shipped as one row, one substitution,
  ONE room, silently. Verified on a scratch build: with the row published and
  an affinity row for Big Sur in place, Big Sur's take-home cell on the
  coverage board still reads `none` and `worldEligibility` still refuses it.

  The claim now stands as `(Also at: Big Sur)` on the row itself in
  `docs/atmosphere-idea-bank-v1.md`, which `seed:bank` writes as a second
  `native = true` row. **This row is the one item on all three sheets that
  earns it**, and the reason is the constraint that kills the others: an
  `Also at:` row shares the whole item verbatim, and this row's own words
  already carry its second room — "with dried eucalyptus off the foraged pile
  as the Big Sur substitution". It arrives at Big Sur saying what it is there.
- **The collision I did NOT dissolve, flagged rather than hidden:** Amalfi's
  *cartella you marked* and Big Sur's *noun slip that was yours* are the same
  frame — "the paper from the game you played, kept." I authored both anyway,
  because the games are already separate shipped rows, the paper is a byproduct
  of playing rather than a designed object, and 1953 Neapolitan tombola graphics
  and a 1971 noun slip are not the same object in any sense a guest would feel.
  But it IS the frame twice and the founder should know that I looked at it and
  chose to keep both. If one has to go, cut the Big Sur one; the cartella is
  load-bearing for a room with no other cheap take-home at crowd scale.
- Two further affinity candidates I deliberately did not claim, because they
  point at rooms a sibling agent is writing and a speculative claim across an
  agent boundary is a foreign key waiting to fail: *what was played, in order*
  (`big-sur`) plausibly reaches Westhampton's record flip and Acapulco's named
  first song; *the dried hydrangea head* (`nantucket`) plausibly reaches
  Westhampton. Named here, not tagged.

### Standing exclusivity checks I ran, and what they killed

- **Matchbooks are New York's.** Portofino and Big Sur both wanted one. Both
  refused. It is an identity-carrier under the bank's exclusivity rule and the
  catalogue only gets one matchbook.
- **The Polaroid is Westhampton's.** Nantucket wanted a photograph of the
  pot-dump. Refused for the same reason.
- **Hand fans are dead catalogue-wide** (church fans are New Orleans'; the
  abanico blurs Havana). A majolica-pattern paper fan for Amalfi was the obvious
  cheap crowd item and it is not available to me.
- **The reading of cards is New Orleans'.** Big Sur's Thoth deck is object-only,
  so giving a guest a card out of it is both a step toward the reading and the
  breaking of a deck. Refused.
- **Shell and driftwood scatter was reassigned to Big Sur.** I claim the shell
  take-home for Nantucket anyway — Nantucket has shell BUCKETS natively and the
  shell in question is one a guest ate out of, which is a different object from a
  scattered one. Stated so it can be argued with.

---

## The dual-claim ruling, and what it did to this list

**The ruling: an atmosphere item may claim more than one slot. One item, two
claims — not two rows.** Twenty-six of the eighty-four items below now carry a
second claim, written as `- **slots:** … + …  ·  **why both:** …`.

**What I checked before using it, since a mechanism that costs nothing is
exactly the kind that gets over-used.**

- `bank_item_slot` is an eligibility join, so many rows per item is its normal
  shape. `fill.ts` keys placed ingredients into a `used` set and skips anything
  already placed, so an item eligible for two slots is placed in ONE per package.
  A guest cannot receive the same object as both the table and the keepsake.
- db/043's own note says the default claim is written by a trigger so that
  nothing is unclassified, and that "reclassifying is an UPDATE, never a
  migration." A second claim is therefore authoring on top of a floor, which is
  what I have done — deliberately, item by item, with a reason each time.
- **A constraint I have obeyed and which the ruling does not remove:** db/043
  states that host acts and games can claim only the light or the general
  bucket, because *"the table and the take-home are OBJECTS — something set
  down, something carried out — and an act is neither."* So no dual claim below
  turns an act into a keepsake. Where the take-home comes out of an act — the
  trofie lesson, the shucking, the tombola — the claim is on the OBJECT the act
  produces or uses, never on the act.
- **Precedence, also db/043's:** take-home beats light beats table, "a thing is
  classified by its destiny before its surface." So `the_take_home` is the
  PRIMARY claim on every dual item below, and the second claim is where the
  object spends the evening before it leaves.

**Tahiti's conch is the model and it is worth saying why.** It is object AND
act, used at dusk to call dinner, and it "lives on her shelf after" — used
during the evening, then kept. That is the shape, and it is why the conch is the
best take-home in a catalogue of 180. The lei-making kit is the same shape a
second time in the same room: made in daylight, worn that night, carried away.
Both were already in the bank. The ruling means the catalogue can now SAY so
instead of choosing.

**Six items moved up a grade, and each move has one cause: the second claim
answered the objection that was holding the item down.**

| item | room | was | now | what the second claim answered |
|---|---|---|---|---|
| the stoneware beaker | `portofino` | fair | strong | merchandise → it is the vessel already on the table |
| the wax out of the saucer | `cote-dazur` | fair | strong | cost of shipping saucers → they are the room's light |
| the half coconut you drank from | `tahiti` | fair | strong | "is this a new row?" → no, a second claim on an existing one |
| the dried hydrangea head | `nantucket` | fair | strong | merchandise → it is the room's only floral |
| the hand-thrown cup | `big-sur` | fair | strong | per-head cost → not an extra object, the one already given |
| the sprig off the jug | `portofino` | thin | fair | ditto — it IS the greenery, not an extra |

Four more moved thin → fair on the same logic (the between-us card, the jar with
a stem, the tombola beans, the poured candle). **Nothing moved up merely because
a second claim was available.** Eleven items I could have dual-claimed and did
not: the tin from the good place, the boat count card, the santino, the corno,
the map, bay leaves, the shell out of the bucket, the vanilla bean, the labels,
the cork with the hour on it, the shells you strung. Each of those either
belongs to one moment only or is genuinely not on the table, and inventing a
second claim for them would be the padding the ruling explicitly is not.

**And the guard rail the coordinator named, answered in numbers.** A dual claim
is not a licence to let one object serve three coasts. The three Mediterranean
rooms take five dual claims each at most, and the vessel claims are the test
case: Portofino dual-claims a STONEWARE BEAKER, Côte d'Azur a PLAIN SHORT GLASS,
Amalfi a PAINTED TILE. Three rooms, three vessels, three registers, zero shared
rows and zero affinity between them. The mechanism let each coast's own object
do two jobs; it did not let one object do three coasts.

---

# PORTOFINO, 1961

**Fifteen, not twenty, and this is the room where I am most comfortable saying
so.** The premise is a town in the month nobody comes, with one thing open. An
object world is not what this room has; what it has is a small group, a long
lunch and a walk in the dark. Four items I would defend hard, and they are all
things that happened at the table. The rest is honest padding-adjacent and
marked. Note also that `few` is doing real work: with six or eight people the
per-head budget is the loosest in my set, which is why a beaker and a jar are
allowed here and would be impossible at Amalfi.

### the trofie you rolled
- **room:** `portofino`  ·  **native or affinity:** native
- **what it is:** the trofie a guest twisted at the pasta board during the
  lesson, floured and folded into a paper twist to take away, not cooked.
- **why it survives the night:** it is the only thing in the room made by the
  guest's own hands, it is misshapen in a way that identifies whose it is, and
  it sits in a kitchen for a month before anyone can bring themselves to boil it.
- **strength:** strong
- **founder question:** does an uncooked flour-and-water good belong in the bank
  as a take-home, or does the routing rule push it at the dish pool the moment
  it becomes edible?
- **own-stock ruling, 2026-08-26:** STAGED — one paper twist per guest. Own
  stock.

### the order leaf
- **room:** `portofino`  ·  **native or affinity:** native
- **what it is:** a carbon duplicate order pad on the table; whoever is ordering
  for everybody writes the table's lunch on it, and the leaves are torn off and
  handed round at the end.
- **why it survives the night:** it is the whole joke of the room in one piece of
  paper — what we actually ate, in the handwriting of the person who speaks the
  least Italian — and nobody bins a thing with their friend's handwriting on it.
- **strength:** strong
- **founder question:** does a carbon pad breach the slips rule ("the member
  never fills a blank; the era does"), or is that rule about GAME content only
  and a guest writing an order is outside it?
- **own-stock ruling, 2026-08-26:** STAGED — a carbon pad is per-guest
  consumable stock. Own stock.

### the room's key tag
- **room:** `portofino`  ·  **native or affinity:** native
- **what it is:** a plain wooden or brass fob, numbered or named for the room a
  guest slept in, handed over at arrival and not asked for back.
- **why it survives the night:** the voice already names it — second person
  appears in this house "only for a room, a key or a step in the dark" — and a
  key tag on a keyring is the longest-lived small object anybody owns.
- **strength:** strong
- **founder question:** does a houseguest object work when the occasion is a
  dinner rather than a stay, or does this become a getaway-only take-home?
- **own-stock ruling, 2026-08-26:** STAGED — one fob per guest. Own stock.

### breakfast, in wax paper
- **room:** `portofino`  ·  **native or affinity:** native
- **what it is:** focaccia col d'oro wrapped in wax paper and pressed on people
  as they go, for whoever gets up second.
- **why it survives the night:** it does not survive the night, it survives until
  about nine the next morning, which in this house is the point — the register is
  literally a note left for whoever gets up second.
- **strength:** strong
- **founder question:** a take-home that is eaten by breakfast may fail the slot
  on principle. Is "the thing they take home" allowed to be consumed, or must it
  outlive the weekend?
- **own-stock ruling, 2026-08-26:** STAGED — one wrapped focaccia per guest.
  Own stock.

### the boat count card
- **room:** `portofino`  ·  **native or affinity:** native
- **what it is:** a small stiff card, one per person, ruled for two numbers —
  the boats counted on the way out and the boats counted on the way back.
- **why it survives the night:** the two numbers never match, which is the
  room's own dry joke, and a card with a private disagreement written on it goes
  into a coat pocket rather than a bin.
- **strength:** fair
- **founder question:** is this too clever by half — a joke that needs the party
  to explain it — and does it die in a pocket in March instead of landing?
- **own-stock ruling, 2026-08-26:** STAGED — one card per person, ruled. Own
  stock.

### the bar token
- **room:** `portofino`  ·  **native or affinity:** native
- **what it is:** a printed cardboard cassa token, the kind paid for at the till
  and handed to the barman, good for one espresso taken standing.
- **why it survives the night:** the espresso at the bar, standing, on the way
  past, is one of the four things this room actually does, and a token is the
  right size to forget in a wallet for two years.
- **strength:** fair
- **founder question:** I have this as period-correct — the pay-at-the-cassa
  ticket long predates the fiscal receipt of the 1980s — but I would like it
  checked by somebody who has held one.
- **own-stock ruling, 2026-08-26:** STAGED — one token per guest. Own stock.

### the whole schedule
- **room:** `portofino`  ·  **native or affinity:** native
- **what it is:** a card, one per guest, listing what is open and on which days,
  which is a very short list.
- **why it survives the night:** it reads as a joke and is actually a fact, it is
  in the house's own formula ("That is the whole schedule"), and it is the most
  matchbook-shaped object this room produces.
- **strength:** fair
- **founder question:** printed in advance, so it carries no evidence of the
  evening — does that make it the weaker kind, or does the joke earn it?
- **own-stock ruling, 2026-08-26:** STAGED — one card per guest. Own stock.

### the tin from the good place
- **room:** `portofino`  ·  **native or affinity:** native
- **what it is:** one small tin each — Taggiasca olives in oil, or salted
  anchovies — with nothing printed on it but what it is.
- **why it survives the night:** it sits at the back of a cupboard until a night
  somebody needs an anchovy, and Taggiasca is signature-tier Ligurian, so it
  cannot drift to another room.
- **strength:** fair
- **founder question:** merchandise, plainly. Worth a slot, or is it the item
  that proves the room only has fourteen?
- **own-stock ruling, 2026-08-26:** STAGED — one small tin each. Own stock.

### the mortar pesto, in a jar
- **room:** `portofino`  ·  **native or affinity:** native
- **what it is:** what came out of the mortar during the lesson, spooned into
  small jars, one each.
- **why it survives the night:** it was made in the room, in front of everybody,
  by hand rather than by machine, and it gets eaten in the guest's own kitchen
  four days later, which is a second evening the party paid for.
- **strength:** fair
- **founder question:** same routing question as the trofie, plus a real one
  about food safety and how long a fresh basil pesto is honestly good for.
- **own-stock ruling, 2026-08-26:** STAGED — one jar each. Own stock.

### the phrases
- **room:** `portofino`  ·  **native or affinity:** native
- **what it is:** a card of the handful of things the person ordering actually
  said, printed straight, with no translation offered.
- **why it survives the night:** the joke is on us and reported without heat,
  which is exactly the room's humour mechanism, and it is small enough to keep.
- **strength:** fair
- **founder question:** does printing somebody's bad Italian read as fond or as
  mockery, given the humour rule that the target is never outside the group?
- **own-stock ruling, 2026-08-26:** STAGED — one card per guest. Own stock.

### the stoneware beaker
- **room:** `portofino`  ·  **native or affinity:** native
- **slots:** the_take_home + the_table_set  ·  **why both:** it is the vessel on the table all afternoon and then it is the vessel in somebody's bathroom, and the stoneware register is doing the Portofino/Amalfi wall either way.
- **what it is:** a small unglazed stoneware cup, one per guest, from the same
  register as the jugs the rosemary is in.
- **why it survives the night:** it holds a toothbrush or an espresso for a
  decade, and the stoneware register is the wall between this room and Amalfi's
  painted ceramic.
- **strength:** strong
- **founder question:** at `few` this is affordable; is it still affordable at
  the top of the guest range, and does a plain beaker read as anything at all?
- **own-stock ruling, 2026-08-26:** STAGED — one beaker per guest, new stock;
  the jugs are shared and are not what this claims. Dual claim survives.

### the sprig off the jug
- **room:** `portofino`  ·  **native or affinity:** native
- **slots:** the_take_home + the_table_set  ·  **why both:** the rosemary and olive ARE the table's greenery here — there is no floral — so the sprig is the centrepiece before it is the thing in the drawer.
- **what it is:** rosemary and a little olive off the table jugs, tied with
  kitchen string as people leave.
- **why it survives the night:** rosemary keeps its smell dry for a year in a
  drawer, and it costs nothing.
- **strength:** fair
- **founder question:** olive branch is the single most-shared material across
  the three coasts. Is even a sprig too close to Côte d'Azur, or does keeping
  the LAVENDER out of Portofino buy me this?
- **own-stock ruling, 2026-08-26:** KILLED — `rosemary + olive branches in
  stoneware jugs` is a placement at a sparse dose, and the entry's own `why
  both` says the jugs ARE the table's greenery. Raising the dose to per-guest
  is also the one move that would breach the Portofino / Cote d'Azur wall this
  sheet spent five pages building.

### the between-us card
- **room:** `portofino`  ·  **native or affinity:** native
- **slots:** the_take_home + the_table_set  ·  **why both:** it sits at a place through lunch, which is what a card at each place is, and the line only means anything once the lunch has happened.
- **what it is:** a small card at each place carrying the house's one line about
  what stays at the table, said once and not repeated.
- **why it survives the night:** it is the room's most distinctive tone tag made
  portable.
- **strength:** fair
- **founder question:** this is the most twee thing in my six rooms and I nearly
  cut it. Kill it?
- **own-stock ruling, 2026-08-26:** STAGED — one card at each place. Own
  stock; dual claim survives on it.

### the off-season timetable
- **room:** `portofino`  ·  **native or affinity:** native
- **what it is:** a printed boat timetable for the months half the town is shut,
  folded to pocket size.
- **why it survives the night:** it goes into a book as a bookmark and is found
  years later, which is the exact shape of the take-home the founder described.
- **strength:** thin
- **founder question:** is a timetable readable as an object, or is it just paper
  with numbers on it that nobody will keep?
- **own-stock ruling, 2026-08-26:** STAGED — one folded timetable per guest.
  Own stock. Thin, unchanged.

### the olive-wood spoon
- **room:** `portofino`  ·  **native or affinity:** native
- **what it is:** a small turned olive-wood spoon, one each.
- **why it survives the night:** olive wood does not wear out and a small spoon
  lives in a sugar bowl forever.
- **strength:** thin
- **founder question:** flagged AGAINST myself: olive wood is the most reflexive
  three-coast object there is and I would cut it before I would defend it. It is
  here so the founder can see what the bottom of this room's list looks like.
- **own-stock ruling, 2026-08-26:** STAGED — one spoon each. Own stock. Thin,
  unchanged.

**Cut from Portofino, with reasons:** a matchbook (New York's, exclusivity); a
candle for the walk back (the dark walk is the room's best moment and shipping a
light for it stages something the premise leaves unstaged); a harbour postcard
(the premise is the month nobody comes — a postcard is the picturesque register
the voice bans by name).

---

# TAHITI, 1961

**Fourteen.** The conch stays exactly where it is and nothing below competes
with it — but the conch lives on HER shelf, so a guest-side take-home is still
missing, which is what this section is for. The widened arc helps enormously:
three daylight items already exist, so an object MADE in the afternoon is
well-founded here in a way it is not in the other five rooms. Two constraints
shaped this list hard. First, the costume risk is the highest in the library and
the voice bans `lei`, `tiki`, `hula` and `aloha` outright — so nothing below
uses those words and nothing borrows Hawaiian material for a Polynesian island
four thousand miles away. Second, the room is `evening`→`until morning` with a
daylight front end and NO clock, so anything shaped like a schedule is out.

### the vanilla bean
- **room:** `tahiti`  ·  **native or affinity:** native
- **what it is:** one Tahitian vanilla bean per guest, in a plain paper sleeve
  with its name on it and nothing else.
- **why it survives the night:** it perfumes a drawer for a year whether or not
  anybody uses it, it costs very little, and it is a real export of a real
  working island rather than a picture of one.
- **strength:** strong
- **founder question:** none.
- **own-stock ruling, 2026-08-26:** STAGED — one bean per guest in its own
  sleeve. Own stock.

### the pearl-shell disc
- **room:** `tahiti`  ·  **native or affinity:** native
- **slots:** the_take_home + the_table_set  ·  **why both:** it is what marks where a person sits — this room has no place cards and would refuse them — and the disc is still a disc afterwards.
- **what it is:** a polished round of black-lipped pearl shell, one at each
  place on the sand, doubling as the marker for where a person sits.
- **why it survives the night:** nacre does not degrade, it is the correct
  material for these particular islands rather than a generic tropical one, and
  a shell disc on a shelf a year later is the founder's own image of what this
  slot is for.
- **strength:** strong
- **founder question:** sourcing at scale — is there a supplier who cuts pearl
  shell offcuts cheaply, and does the founder want the shell polished or left as
  it comes?
- **own-stock ruling, 2026-08-26:** STAGED — one disc at each place. Own
  stock; dual claim survives on it.

### the shells you strung
- **room:** `tahiti`  ·  **native or affinity:** native
- **what it is:** small shells threaded on cotton in the afternoon, alongside the
  blossoms, and worn or pocketed the same night.
- **why it survives the night:** it was made by the guest, in daylight, sitting
  down, and unlike blossoms it is still there in five years.
- **strength:** strong
- **founder question:** this overlaps the bank's existing shell-lei good, which
  ships with a high `min_lead_days`. Is this a distinct row (the guest strings
  it) or a variant of that one, and does claiming it here break the fallback that
  was already authored?
- **own-stock ruling, 2026-08-26:** STAGED — the shells and thread are ordered
  per guest and the existing lei row does not carry them. Own stock.

### what came in, written down
- **room:** `tahiti`  ·  **native or affinity:** native
- **what it is:** a card per guest naming what the boat brought today, written
  the same afternoon, no hour on it.
- **why it survives the night:** the menu here is decided by a boat rather than a
  plan, so the card records something that could not have been printed in
  advance and could not be true of any other night.
- **strength:** strong
- **founder question:** the host writes the name of a fish — is that a blank the
  member fills, and does it fail the slips rule?
- **own-stock ruling, 2026-08-26:** STAGED — one card per guest. Own stock.

### the needle
- **room:** `tahiti`  ·  **native or affinity:** native
- **what it is:** the long needle from the flower-stringing, thread still wound
  on it, kept by whoever used it.
- **why it survives the night:** the garland is brown by Tuesday and the needle
  is not, and a tool you learned something with gets kept.
- **strength:** fair
- **founder question:** does this split an existing kit into two bank rows, and
  is the founder happy for a shipped kit to leave the house in pieces?
- **own-stock ruling, 2026-08-26:** KILLED — It points at the lei-making kit,
  which ships once, and `kept by whoever used it` declares no per-guest
  quantity. The entry's own question — may a shipped kit leave the house in
  pieces — is answered no by the ruling.

### the small monoï
- **room:** `tahiti`  ·  **native or affinity:** native
- **what it is:** a guest-sized bottle of monoï, one each, named for what it is
  and never for an appellation.
- **why it survives the night:** it is used up slowly over months, so the smell
  of the evening keeps arriving in a bathroom for half a year.
- **strength:** fair
- **founder question:** the bank already carries monoï as a placed object. Is a
  small bottle per guest a second row or is this double-counting?
- **own-stock ruling, 2026-08-26:** STAGED — the ruling answers the entry's
  question: the placed monoi is one object, so a bottle per guest is its own
  line and not double-counting.

### the sky for that night
- **room:** `tahiti`  ·  **native or affinity:** native
- **what it is:** a printed card of what was overhead on the guest's actual date,
  in the wayfinder framing, one per person.
- **why it survives the night:** it is specific to one night in a way nothing else
  printed can be, and it ends up inside a book.
- **strength:** fair
- **founder question:** the star kit is already the catalogue's one digital good
  and carries a card for HER. Is the guest card a separate item, or is this the
  same row asked to do two jobs?
- **own-stock ruling, 2026-08-26:** STAGED — the ruling answers the entry's
  question: the star kit's card is hers and ships once, so the guest card is
  its own per-guest row.

### the pearl-shell lure
- **room:** `tahiti`  ·  **native or affinity:** native
- **what it is:** a small shell-and-hook bonito lure of the kind actually fished
  from these islands, one each.
- **why it survives the night:** it is a tool rather than a souvenir, and it
  hangs on a nail in somebody's hallway for twenty years.
- **strength:** fair
- **founder question:** where exactly does this sit on the costume line — a real
  working object, or jewellery pretending to be one? I could argue it either way
  and I would rather the founder drew it.
- **own-stock ruling, 2026-08-26:** STAGED — one lure each. Own stock.

### the blossom, pressed into the card
- **room:** `tahiti`  ·  **native or affinity:** native
- **what it is:** the flower a guest wore, flattened into the lore card that came
  with it, on the way out.
- **why it survives the night:** the card outlives the flower and the flower
  makes the card specific, and the left-ear-taken/right-ear-looking lore is the
  bit people repeat afterwards.
- **strength:** fair
- **founder question:** does pressing a flower into an existing card make a new
  bank row, or is it an instruction that belongs on the card already shipping?
- **own-stock ruling, 2026-08-26:** KILLED — as written. The blossom bowl
  ships ONE lore card; pressing a flower into it cannot reach every guest. A
  per-guest lore card with a blossom in it would be its own stock, and writing
  it is authoring.

### the plaited square
- **room:** `tahiti`  ·  **native or affinity:** native
- **slots:** the_take_home + the_table_set  ·  **why both:** it goes under a plate on sand, where a mat is not decoration but the only thing between the plate and the ground.
- **what it is:** a hand-width of plaited pandanus, made sitting down in the
  afternoon, taken away flat.
- **why it survives the night:** plaited pandanus lasts decades and it is
  genuinely the material of these islands rather than a stand-in for it.
- **strength:** fair
- **founder question:** this is a SECOND daylight craft competing with the flower
  stringing for the same hours. One room, two crafts — too many?
- **own-stock ruling, 2026-08-26:** STAGED — one plaited square per guest,
  made in the afternoon. Own stock; dual claim survives.

### the half coconut you drank from
- **room:** `tahiti`  ·  **native or affinity:** native
- **slots:** the_take_home + the_table_set  ·  **why both:** the bowls are the table's vessels for the whole evening; taking yours is the same object one beat later.
- **what it is:** the coconut bowl a guest was handed a drink in, rinsed and
  taken.
- **why it survives the night:** you drank out of it, which is the cheapest
  possible way to make an object evidence.
- **strength:** strong
- **founder question:** none. "And it goes home" is a second claim on the
  existing bowls row, which is precisely what the ruling is for.
- **own-stock ruling, 2026-08-26:** SECOND CLAIM, NOT STAGED — and it is the
  model. `half-coconut bowls` is already one per guest by construction, so the
  keepsake needs no stock of its own. The entry said exactly this and was
  right.

### the cord
- **room:** `tahiti`  ·  **native or affinity:** native
- **what it is:** a coiled length of coconut-fibre cord, one each.
- **why it survives the night:** it is the correct period material and it is
  useful, which is the only reason anything gets kept in a house.
- **strength:** thin
- **founder question:** too obscure to read as anything without a card
  explaining it, which this room's voice will not do?
- **own-stock ruling, 2026-08-26:** STAGED — one coil each. Own stock. Thin,
  unchanged.

### the black sand
- **room:** `tahiti`  ·  **native or affinity:** native
- **what it is:** a small stoppered vial of the black sand the table stood on.
- **why it survives the night:** it is the one material fact about this shore
  that a photograph never conveys.
- **strength:** thin
- **founder question:** vial-of-sand is very close to gift-shop. Twee, or saved
  by the sand actually being black?
- **own-stock ruling, 2026-08-26:** STAGED — one vial each. Own stock. Thin,
  unchanged.

### the tamanu nut
- **room:** `tahiti`  ·  **native or affinity:** native
- **what it is:** one dried tamanu nut, the tree the oil comes from, per guest.
- **why it survives the night:** it is odd, hard, and lives on a windowsill for
  years because nobody knows what to do with it.
- **strength:** thin
- **founder question:** does an object nobody can identify do any work at all?
- **own-stock ruling, 2026-08-26:** STAGED — one nut per guest. Own stock.
  Thin, unchanged.

**Cut from Tahiti, with reasons:** tapa cloth (bark cloth was effectively out of
production in Tahiti by 1961 — it would be a Tongan or Fijian object wearing
Tahiti's name, which is the exact borrowing the voice bans); a banana-leaf place
marker with a name cut into it (the leaf is brown in two days, so it fails the
survives-the-night test outright); the fresh blossom on its own (same reason,
and it is already a staged good); a pareu (per-guest cost and straight into
costume).

---

# CÔTE D'AZUR, 1962

**Fourteen.** The premise is a lunch at one that is still going at seven and a
last hour on the steps — a room whose evidence is DURATION, and duration is hard
to hand somebody. What saved this list is that the bank already stages
accumulation ("empty rosé bottles accumulating" as scene evidence, not staging),
so the strongest items here are what the accumulation leaves behind. Everything
French below is French on purpose and stays here.

### the short glass
- **room:** `cote-dazur`  ·  **native or affinity:** native
- **slots:** the_take_home + the_table_set  ·  **why both:** the classifier already reads a tumbler as the table, and this room has ONE drink in ONE glass, so the glass is the table setting for six hours before it is anything else.
- **what it is:** the thick plain short glass a guest drank the one cocktail
  out of all afternoon, taken away as it stands.
- **why it survives the night:** there is one drink and everybody has it, so the
  glass is the single object every guest touched for six hours, and a heavy
  little tumbler lives in a kitchen forever.
- **strength:** strong
- **founder question:** none.
- **own-stock ruling, 2026-08-26:** STAGED — one glass per guest. Flagged: the
  pastis kit also lists short glasses, so confirm this is a separate line
  rather than the kit's set being given away. Dual claim survives on the
  per-guest stock.

### the labels off the bottles
- **room:** `cote-dazur`  ·  **native or affinity:** native
- **what it is:** the rosé labels soaked off the accumulated empties in a basin
  at the end, and handed round wet.
- **why it survives the night:** the pile of empties is the room's proof of how
  long the afternoon ran, and a label goes flat into a book and is found again in
  a decade.
- **strength:** strong
- **founder question:** soaking labels is an ACT performed by somebody. Does that
  make this a host act pointing at a good, the way the louche points at pastis?
- **own-stock ruling, 2026-08-26:** HELD — the ruling does not reach it — no
  bank row, no shipped stock — but the supply is bottles rather than guests.
  Held with the cork-and-cage family.
- **category-3 ruling, 2026-08-26:** STAGED — CATEGORY 3, `per_guest`,
  watching `the_drinks` for `yields_label`. HELD stands and its sentence is
  the ruling in advance: `no bank row, no shipped stock — but the supply is
  bottles rather than guests`. Côte d'Azur has four eligible drinks and two
  of them name champagne, so on today's catalogue this is a CONDITIONAL
  dependency.

### the cork with the hour on it
- **room:** `cote-dazur`  ·  **native or affinity:** native
- **what it is:** a cork per guest, marked with the hour its bottle was opened,
  from a table that opened bottles from one o'clock until it got dark.
- **why it survives the night:** a row of hours written on corks is the only
  honest record of a lunch that was also dinner, and a cork is pocket-sized.
- **strength:** strong
- **founder question:** the terrace never mentions the clock and the voice says
  to let the hour do the work — does writing hours on things say the quiet part
  out loud?
- **own-stock ruling, 2026-08-26:** HELD — same family. `a cork per guest` is
  declared, but corks arrive one per bottle and the house ships none. Held
  rather than killed, because the ruling has nothing to say about it.
- **category-3 ruling, 2026-08-26:** STAGED — CATEGORY 3, `per_guest`,
  watching `the_drinks` for `yields_cork`. HELD stands. Same conditional
  reading as the labels.

### the wax out of the saucer
- **room:** `cote-dazur`  ·  **native or affinity:** native
- **slots:** the_take_home + the_light  ·  **why both:** the mismatched saucer is this room's whole answer to "on what" — it IS the light — and the disc that comes out of it is what the light leaves behind.
- **what it is:** the cooled disc of beeswax lifted out of a guest's mismatched
  candle saucer at the end, with the wick still in it.
- **why it survives the night:** the disc is exactly as thick as the evening was
  long, and it is free.
- **strength:** strong
- **founder question:** with the second claim, is the SAUCER now the item and the
  wax disc merely what is in it? Shipping mismatched saucers stopped being an
  extra cost the moment they are also the light, so this is worth re-deciding.
- **own-stock ruling, 2026-08-26:** KILLED — as written. The bank stages
  `thick white beeswax pillars ON MISMATCHED SAUCERS` as the room's light, not
  as per-guest stock. The entry's own founder question already asks whether
  the saucer is now the item; under the ruling it has to be, per guest, which
  is the cost decision it names.

### the mismatched teaspoon
- **room:** `cote-dazur`  ·  **native or affinity:** native
- **slots:** the_take_home + the_table_set  ·  **why both:** it is laid at a place and eaten with, and it is wrong forever afterwards in somebody else's drawer.
- **what it is:** one old mismatched teaspoon per guest, none of them a pair.
- **why it survives the night:** it goes into a drawer with the other spoons and
  is the wrong one forever, which means it is noticed for years.
- **strength:** fair
- **founder question:** cheap in bulk from a flea lot, but sourcing eighty
  genuinely mismatched spoons is somebody's afternoon. Practical at scale?
- **own-stock ruling, 2026-08-26:** STAGED — one spoon per guest. Own stock;
  dual claim survives.

### the melon seeds
- **room:** `cote-dazur`  ·  **native or affinity:** native
- **what it is:** seeds from the melon eaten with port in the hollow, dried and
  folded into a paper packet, one per guest.
- **why it survives the night:** somebody plants it in March, which is the
  longest possible tail an object in this catalogue can have.
- **strength:** fair
- **founder question:** two real ones — will seed off a table melon actually
  come true, and does a seed packet cross an agricultural border cleanly?
- **own-stock ruling, 2026-08-26:** STAGED — one packet per guest. Own stock.

### the loose dried aromatic
- **room:** `cote-dazur`  ·  **native or affinity:** native  ·  claimed also by
  `affinity: big-sur`
- **what it is:** a handful of wild lavender, loose and never bundled or
  ribboned, pressed into a paper cone as people go; at Big Sur the same row
  substitutes dried eucalyptus off the foraged pile.
- **why it survives the night:** it keeps its smell in a drawer for a year or
  more and costs almost nothing, and it comes off the table it was staged on
  rather than out of a box.
- **strength:** fair
- **founder question:** lavender-in-a-paper-cone is one step from the Provence
  gift-shop sachet the room would hate. Does "loose, never bundled" hold the line,
  or is the whole material compromised?
- **own-stock ruling, 2026-08-26:** STAGED — lavender is bulk and the paper
  cone is a per-guest article. Own stock. Carries the Big Sur eucalyptus
  substitution with it.

### the crock
- **room:** `cote-dazur`  ·  **native or affinity:** native
- **slots:** the_take_home + the_table_set  ·  **why both:** the crocks are the centre of the table all afternoon; the second claim is just where the crock is at midnight.
- **what it is:** the small glazed crock a guest's anchoïade or tapenade was in,
  taken with whatever is left in it.
- **why it survives the night:** it becomes the thing on a shelf that holds
  paperclips, and it is a French glazed crock rather than a majolica or a
  stoneware vessel, so it does not drift.
- **strength:** fair
- **founder question:** does a per-guest crock fight the staging, which has the
  crocks as shared centre-of-table objects?
- **own-stock ruling, 2026-08-26:** STAGED — the staged crocks are shared
  centre-of-table objects, so the dual claim cannot sit on them. A crock per
  guest is its own line, which is what the entry proposed, and the table-set
  claim rides on that stock.

### the savon de Marseille
- **room:** `cote-dazur`  ·  **native or affinity:** native
- **what it is:** a small cube of Marseille soap, stamped, one each.
- **why it survives the night:** it lasts months in use and years in a linen
  drawer, and nobody has ever thrown one away.
- **strength:** fair
- **founder question:** merchandise, with no connection to the evening at all —
  the weaker kind, and I am marking it as such. Does its sheer longevity buy it
  a place anyway?
- **own-stock ruling, 2026-08-26:** STAGED — one cube each. Own stock.

### the belote sheet
- **room:** `cote-dazur`  ·  **native or affinity:** native
- **slots:** the_take_home + the_atmosphere  ·  **why both:** the sheet rides with the belote rules card, which is already an atmosphere row, and the numbers on it only exist because the game was played.
- **what it is:** the paper the afternoon's belote was scored on, folded and
  given to whoever was on it.
- **why it survives the night:** the numbers are an argument in shorthand and
  the people who lost keep it longer than the people who won.
- **strength:** fair
- **founder question:** this only reaches the four people who played. Does a
  take-home that not everybody gets fail the slot on principle?
- **own-stock ruling, 2026-08-26:** KILLED — The dual claim points at the
  belote rules card, which ships once, and the item reaches four players
  rather than every guest. Both halves fail.

### the louche card
- **room:** `cote-dazur`  ·  **native or affinity:** native
- **what it is:** the technique card for the louche — water first, never ice
  first — one per guest rather than one per table.
- **why it survives the night:** it is a skill somebody watched being done and
  can now do, and a card that teaches something gets pinned up.
- **strength:** fair
- **founder question:** the technique card already rides with the act. Is
  multiplying it to one-per-guest a new row or a quantity change on an old one?
- **own-stock ruling, 2026-08-26:** STAGED — the ruling answers the entry's
  question: the act's technique card ships one, so the per-guest copy is a new
  row with its own stock, not a quantity change.

### the marc, small
- **room:** `cote-dazur`  ·  **native or affinity:** native
- **what it is:** a miniature of the marc that closes the evening, carried off.
- **why it survives the night:** an unopened miniature sits in a cupboard for
  years waiting for an occasion that matches.
- **strength:** thin
- **founder question:** cost and alcohol shipping at any real guest count —
  probably fails before taste gets a vote. Confirm and cut?
- **own-stock ruling, 2026-08-26:** STAGED — one miniature each. Own stock.
  Thin, unchanged.

### the fig leaf
- **room:** `cote-dazur`  ·  **native or affinity:** native
- **what it is:** a leaf off the green figs, dried flat.
- **why it survives the night:** it goes stiff and keeps a green smell, and it is
  the seasonal item the bank already names.
- **strength:** thin
- **founder question:** the figs carry an authored seasonal fallback already —
  does the leaf need one too, and is a leaf an object?
- **own-stock ruling, 2026-08-26:** KILLED — The bank ships figs, not fig
  leaves, and the leaf is a subtraction from a placed seasonal bowl with no
  per-guest quantity anywhere in the clause.

### the come-up card
- **room:** `cote-dazur`  ·  **native or affinity:** native
- **what it is:** a card with the road on it and the reply convention printed
  under it, nobody counted.
- **why it survives the night:** it is the room's most-quoted line in the hand.
- **strength:** thin
- **founder question:** this is invitation material doing a take-home's job.
  Cut it and let the invitation carry the line?
- **own-stock ruling, 2026-08-26:** STAGED — one card per guest. Own stock.
  Thin, unchanged.

**Cut from Côte d'Azur, with reasons:** the cochonnet from the pétanque set
(there is exactly one, and a take-home that goes to a single guest is not a
take-home); a postcard of the road (the postcard is the precise failure mode the
premise doc names for this room — "what it must not become is the postcard"); an
olive sprig (given to Portofino instead, and giving it to both is the collapse
this document is defending against); anything with a cigarette on or near it
(the ashtray-era goods were killed at New York and only matchbooks survived).

---

# NANTUCKET, 1972

**Fourteen.** This room felt like it would carry twenty and it does not, for a
reason worth saying: it is a house that has DECIDED not to be impressive, and
almost everything you would hand a guest reads as a small act of trying. The
items that work are the ones the dinner produces as a byproduct. The newsprint
table covering is the single best structural gift in my six rooms, because it
turns the table itself into eighty take-homes at no extra cost.

### the front page you sat at
- **room:** `nantucket`  ·  **native or affinity:** native
- **slots:** the_take_home + the_table_set  ·  **why both:** the broadsheet IS the table covering — this is the clearest dual claim in my six rooms, because one printed object dresses the table for eighty people and then leaves with all eighty of them.
- **what it is:** the sheet of the reproduction summer-'72 broadsheet directly
  in front of a guest — buttered, marked, torn off along the fold at the end of
  supper and taken.
- **why it survives the night:** it is dated to one summer, stained by one
  dinner, and everybody's is different because everybody sat somewhere else;
  Fischer–Spassky under a lobster claw is not a thing you put in a bin.
- **strength:** strong
- **founder question:** none.
- **own-stock ruling, 2026-08-26:** SECOND CLAIM, NOT STAGED — and it is the
  sharpest edge of the whole ruling. The broadsheet is ONE printed article,
  which normally kills a take-home; here the single article is per-guest BY
  CONSTRUCTION, because a table covering divides into one sheet per seat and
  every seat's is different. Flagged for the founder as the case that tests
  the wording.
- **ruling 2/3, 2026-08-26:** THE NAMED BOUNDARY CASE, 2026-08-26 — the
  founder's ruling, and it is a ruling about the RULE rather than about this
  item. SECOND CLAIM, NOT STAGED stands unchanged. Her words: *“The
  printed-article prohibition, correctly read, bars items that would need
  their own NEW printed stock, and the broadsheet never needed any. Don't
  rewrite the rule to accommodate it; record it in the rule's notes as the
  test case that defines the boundary. Rules warped around their edge cases
  get leaky; rules with a named boundary case stay sharp.”* So the wording
  of the prohibition is untouched and the case is now written into
  `slot_kind.description` for `the_take_home` by db/044, where the desk
  renders it beside the rule. Anything arguing from the broadsheet must show
  the same CONSTRUCTION — one article that divides into one per seat, each
  different — and not merely the same conclusion.

### the shell out of the bucket
- **room:** `nantucket`  ·  **native or affinity:** native
- **what it is:** a quahog or clam shell picked out of the shell bucket and
  rinsed at the outside tap on the way to the car.
- **why it survives the night:** it is free, it is a thing the guest ate out of,
  and a shell on a windowsill a year later is the founder's own definition of
  this slot.
- **strength:** strong
- **founder question:** shell scatter was reassigned to Big Sur as staging. Does
  claiming the shell TAKE-HOME for Nantucket, where the buckets already live,
  cross that line or respect it?
- **own-stock ruling, 2026-08-26:** HELD — the house ships nothing here: the
  shells arrive with the dinner. Per-guest is satisfied and own-stock is not,
  because there is no stock. Held — and worth saying that a bank row for it
  would be a row for nothing, since the bank holds purchasable or placeable
  objects.
- **category-3 ruling, 2026-08-26:** STAGED — CATEGORY 3, `per_guest`,
  watching `the_main` for `yields_shell`. HELD is superseded by the ruling
  it predicted: `a bank row for it would be a row for nothing, since the
  bank holds purchasable or placeable objects` — the bank now holds a third
  thing. This is the founder's own worked example of a CONDITIONAL
  dependency: a take-home only in the packages whose main course was the
  bucket, resolved at composition and rendered as conditional rather than
  covered.

### the knife you learned on
- **room:** `nantucket`  ·  **native or affinity:** native
- **slots:** the_take_home + the_atmosphere  ·  **why both:** the knife is half of an opt-in craft that already ships as an atmosphere row, and the whole point of learning on a tool is that you keep the tool.
- **what it is:** a cheap wooden-handled oyster knife, one per person who joined
  the shucking, kept.
- **why it survives the night:** it is a skill and the tool of the skill in one
  object, and an oyster knife stays in a kitchen drawer for thirty years being
  the thing that opens paint tins.
- **strength:** strong
- **founder question:** none on the row question — the ruling makes it a second
  claim on the existing kit rather than a second knife. The live question is
  whether the towel below should be folded into this same item.
- **own-stock ruling, 2026-08-26:** STAGED — the entry's reading is REVERSED.
  `oyster knife + kitchen towel kit` ships one knife, so this cannot be a
  second claim on it. `one per person who joined the shucking` is a per-guest
  quantity, so it is its own line — which is the ruling working, not against
  it.

### the towel it was done with
- **room:** `nantucket`  ·  **native or affinity:** native
- **what it is:** the striped kitchen towel used for the hinge grip — towel,
  never palm — folded up butter-stained and taken.
- **why it survives the night:** a kitchen towel is used weekly for a decade,
  which is more use than any other object in this document gets.
- **strength:** fair
- **founder question:** should the knife and the towel be ONE take-home rather
  than two? I have split them because each stands alone, but the founder may
  reasonably want one row.
- **own-stock ruling, 2026-08-26:** KILLED — It points at the kit's single
  towel and declares no per-guest quantity of its own.

### the pick
- **room:** `nantucket`  ·  **native or affinity:** native
- **slots:** the_take_home + the_table_set  ·  **why both:** it is at every place before dinner, which is a place setting by any reading, and it is in a kitchen drawer by Tuesday.
- **what it is:** a wooden lobster pick or mallet, one at every place.
- **why it survives the night:** the argument about the right way to take a
  lobster apart is part of dinner here, and the pick is the instrument of
  whichever side the guest was on.
- **strength:** fair
- **founder question:** is a lobster pick generic New England rather than this
  room specifically — the same failure shape rule 6 catches on the plate?
- **own-stock ruling, 2026-08-26:** STAGED — one at every place. Own stock;
  dual claim survives.

### the chowder card
- **room:** `nantucket`  ·  **native or affinity:** native
- **what it is:** a plain index card with the chowder on it, handed to whoever
  asks, which is everybody.
- **why it survives the night:** the chowder was never announced — the smell did
  it — so the card is the answer to a question the guest actually asked, and a
  recipe card is a period-correct object that lives in a tin.
- **strength:** fair
- **founder question:** does a recipe card belong to the bank or to the dish
  pool, given the routing rule that anything edible goes to dishes?
- **own-stock ruling, 2026-08-26:** STAGED — one card per guest. Own stock.

### the dried hydrangea head
- **room:** `nantucket`  ·  **native or affinity:** native
- **slots:** the_take_home + the_table_set  ·  **why both:** the jar of short hydrangeas is the room's only floral, so the head is the table before it is the dried thing, and the dose is what keeps it off Westhampton.
- **what it is:** a single hydrangea head, cut short, taken out of the mason jar
  on the way out and left to dry.
- **why it survives the night:** August hydrangea dries hard and holds its shape
  for years, and Nantucket's are careless-SMALL against Westhampton's
  careless-abundant, so the dose keeps the two islands apart.
- **strength:** strong
- **founder question:** Westhampton is a sibling agent's room; I have not tagged
  an affinity across that boundary. Should this be one row with an affinity, or
  two rooms' separate flowers?
- **own-stock ruling, 2026-08-26:** KILLED — and this reverses the
  fair-to-strong move the sheet made on it. `hydrangeas cut SHORT in a mason
  jar (careless-small) or nothing` is one jar at a deliberately small dose.
  Raising the dose to per-guest is also the move that would collapse the
  careless-small / careless-abundant wall against Westhampton, which the sheet
  itself calls load-bearing.

### the right way
- **room:** `nantucket`  ·  **native or affinity:** native
- **what it is:** a card on how a lobster is taken apart, ending with the plain
  note that everybody has a different one.
- **why it survives the night:** it settles nothing, which is the point, and it
  is small enough to keep as ammunition.
- **strength:** fair
- **founder question:** printed in advance, so the weaker kind. Does the last
  line earn it?
- **own-stock ruling, 2026-08-26:** STAGED — one card per guest. Own stock.

### the week's tide chart
- **room:** `nantucket`  ·  **native or affinity:** native
- **what it is:** a folded tide table covering the days a guest was on the
  island, one each.
- **why it survives the night:** it goes into a book as a bookmark and dates
  itself precisely.
- **strength:** fair
- **founder question:** does this belong to the take-home slot or to the
  arrival, where a tide is safety information the voice breaks character for?
- **own-stock ruling, 2026-08-26:** STAGED — one folded chart per guest. Own
  stock.

### the beach plum jelly
- **room:** `nantucket`  ·  **native or affinity:** native
- **what it is:** a very small jar of beach plum jelly, one each.
- **why it survives the night:** beach plum is genuinely the island's own late
  summer fruit rather than a New England generic, and jam gets eaten slowly at
  somebody's own breakfast.
- **strength:** fair
- **founder question:** beach plum is August–September; the room is written as
  August. Does a season band handle that, or does this need an authored fallback?
- **own-stock ruling, 2026-08-26:** STAGED — one small jar each. Own stock.

### the rose hip
- **room:** `nantucket`  ·  **native or affinity:** native
- **what it is:** a few hips off the beach roses along the lane, dried.
- **why it survives the night:** they hold their colour for a season in a bowl
  and they cost nothing.
- **strength:** fair
- **founder question:** is this the same frame as the hydrangea — two dried
  plants from one room — and should one of them go?
- **own-stock ruling, 2026-08-26:** HELD — foraged, no per-guest quantity
  declared and nothing on the order. Held.
- **category-3 ruling, 2026-08-26:** STAGED — CATEGORY 3, `per_guest`,
  supplied by the night itself. HELD stands as the reasoning it beat:
  `foraged, no per-guest quantity declared and nothing on the order` is the
  category's definition read as a fault. Nothing in a package supplies a
  beach rose, which is a real answer and not a missing dependency.

### the jar with a stem in it
- **room:** `nantucket`  ·  **native or affinity:** native
- **slots:** the_take_home + the_table_set  ·  **why both:** a jar with a stem in it is literally what this room's floral IS; the take-home claim only says nobody collects them at the end.
- **what it is:** a small mason jar, one per guest, with one short stem in it.
- **why it survives the night:** the jar outlives the stem by decades and holds
  screws.
- **strength:** fair
- **founder question:** the staging is one jar, careless and small. Does putting
  a jar at every place turn a decision into a scheme? The second claim makes it
  cheaper but not more honest, which is why it is only fair.
- **own-stock ruling, 2026-08-26:** STAGED — `a small mason jar, one per
  guest` declares its own stock, which is why this survives where the
  hydrangea head above does not. The entry's own worry — that a jar at every
  place turns a decision into a scheme — is the live question and travels with
  the row.

### the bands
- **room:** `nantucket`  ·  **native or affinity:** native
- **what it is:** the rubber bands off the lobster claws, worn on a wrist for
  the rest of the night and taken home on it.
- **why it survives the night:** it is free, it is ridiculous, and the teasing
  register here is what belonging sounds like.
- **strength:** thin
- **founder question:** is this a joke the house makes or a joke the house
  explains? The second one dies.
- **own-stock ruling, 2026-08-26:** HELD — a byproduct of the dinner, nothing
  shipped. Held. Thin, unchanged.
- **category-3 ruling, 2026-08-26:** STAGED — CATEGORY 3, `per_guest`,
  watching `the_main` for `yields_claw_band`. HELD stands, `thin, unchanged`
  stands, and the entry's own question — a joke the house makes or a joke
  the house explains — is untouched by the ruling.

### the ferry stub
- **room:** `nantucket`  ·  **native or affinity:** native
- **what it is:** a reproduction 1972 ferry ticket stub, one per guest.
- **why it survives the night:** it is the right size and shape to survive in a
  wallet.
- **strength:** thin
- **founder question:** the guests did not take the ferry. Is a prop stub for a
  crossing nobody made a lie the room would refuse?
- **own-stock ruling, 2026-08-26:** STAGED — one reproduction stub per guest.
  Own stock. Thin, unchanged.

**Cut from Nantucket, with reasons:** scrimshaw or anything whaling (ivory,
plus it is the nautical costume the voice bans by name — no ahoy, no anchors, no
whale on anything); a lightship basket (the island's real craft, but it is
expensive and it is precisely the old-money joke the voice refuses); a Polaroid
of the pot-dump (the Polaroid is Westhampton's identity-carrier); a bay scallop
shell (the season is November to March and the room is written as August — an
anachronism of the calendar rather than the decade, but the same failure); a
printed Fischer–Spassky game-six scoresheet (too clever, and it explains the
front page instead of letting the front page do it).

---

# AMALFI COAST, 1953

**Fourteen, and read the caveat at the top of this file first — this is the room
with no written premise.** Everything here is built from the bank entry, the
matrix row and the contrast brief, and no world fact has been invented. Two
structural facts governed the list. First, `crowd`: whatever goes home has to be
affordable eighty times, which is why this section is paper, a lemon, a tile and
a charm rather than a jar and a bottle. Second, the tombola: the five wrapped
prizes ARE take-homes but they reach five people, so they cannot fill this slot
— the cartella every player marked can.

### the cartella you marked
- **room:** `amalfi-1953`  ·  **native or affinity:** native
- **slots:** the_take_home + the_atmosphere  ·  **why both:** the tombola kit is already an atmosphere row and the cartelle ship inside it — this is the ruling working exactly as described, one item with two claims instead of a second row arguing with the first.
- **what it is:** the printed tombola card a guest played all evening, still
  carrying the dried beans' marks, folded into a pocket at the end.
- **why it survives the night:** everybody has one, it is already printed and
  already paid for, and it is marked by exactly which numbers were called on one
  particular night in one particular room.
- **strength:** strong
- **founder question:** none. This was my double-counting worry and the
  dual-claim ruling dissolves it: one item, two claims, and `fill.ts` places it
  in one slot per package so a host cannot receive the cartella twice.
- **own-stock ruling, 2026-08-26:** SECOND CLAIM, NOT STAGED — `printed
  cartelle` inside the tombola kit are already one per player. Conditional on
  the kit carrying them as consumables rather than as a set the host keeps.

### a lemon from the bowl
- **room:** `amalfi-1953`  ·  **native or affinity:** native
- **slots:** the_take_home + the_table_set  ·  **why both:** the bowls and the mantel of lemons at full dose are the room's colour; taking one is subtraction from a centrepiece rather than a separate object.
- **what it is:** one large lemon, leaf still on it, taken from a bowl on the way
  down the steps.
- **why it survives the night:** it sits in a fruit bowl for two weeks scenting a
  kitchen and then becomes a drink, and the FULL dose is the wall between this
  room and Portofino's sparse one — this item could not exist there.
- **strength:** strong
- **founder question:** none.
- **own-stock ruling, 2026-08-26:** SECOND CLAIM, NOT STAGED — A DOSE CLAIM on
  a bulk row. Lemons at FULL dose are bulk, so the order rises by one per
  guest and the take-home has its own stock on the row that already exists.
  This is the distinction that saves the lemon and still kills the New Orleans
  rose: bulk material can carry a per-guest slot, one arrangement cannot.
- **ruling 2/3, 2026-08-26:** BULK REFINEMENT ADOPTED AS STATED, 2026-08-26
  — and this is the entry the refinement was written to save. Lemons at FULL
  dose are bulk, the order rises by one per guest, and the same test still
  kills the New Orleans rose because one arrangement is a single article.
  The founder's note, recorded because it is the part that gets lost: *the
  agent's inability to find another formulation that does both is itself
  evidence this is the right line.*

### the painted tile
- **room:** `amalfi-1953`  ·  **native or affinity:** native
- **slots:** the_take_home + the_table_set  ·  **why both:** the classifier reads a trivet as the table, and a painted tile under a hot dish is a trivet all evening before it is a coaster for thirty years.
- **what it is:** a single hand-painted ceramic tile, one per guest, from the
  bright-vessel register rather than the stoneware one.
- **why it survives the night:** it becomes a coaster or a trivet and is used
  for thirty years, and painted coastal-Campanian ceramic is a real regional
  craft rather than a generic Italian one.
- **strength:** strong
- **founder question:** cost per tile at crowd scale, and whether hand-painted
  survives that scale or becomes transfer-printed — at which point it is a
  souvenir and I would want to know.
- **own-stock ruling, 2026-08-26:** STAGED — one tile per guest. Own stock;
  dual claim survives on it.

### the corno
- **room:** `amalfi-1953`  ·  **native or affinity:** native
- **what it is:** a small red horn charm, the ordinary kind against bad luck,
  one per guest.
- **why it survives the night:** it goes onto a keyring and stays there for
  years, and it belongs to the same world as the Smorfia the room already plays
  with — numbers, luck, and a table shouting back.
- **strength:** fair
- **founder question:** is this kitsch or is this material culture? It is
  genuinely period and genuinely Neapolitan, and it is also the most
  souvenir-shaped object in this document.
- **own-stock ruling, 2026-08-26:** STAGED — one charm per guest. Own stock.

### your card from the door
- **room:** `amalfi-1953`  ·  **native or affinity:** native
- **slots:** the_take_home + the_atmosphere  ·  **why both:** the Napoletane deck ships as a game row; dealing one at the door and not asking for it back is a disposition of that same object.
- **what it is:** one card off a Napoletane forty-card deck, handed to each guest
  as they arrive and applauded in, and kept.
- **why it survives the night:** it does double duty as the thing that gets you
  a seat and the thing you leave with, the graphics are unmistakably of this
  region and this era, and a playing card is the exact size that survives in a
  wallet.
- **strength:** fair
- **founder question:** does a card at the door collide with St. Moritz's
  heavy-stock place cards or Vegas's decks? And does breaking decks up to hand
  out fight the scopa game the same deck is for?
- **own-stock ruling, 2026-08-26:** KILLED — A Napoletane forty-card deck is
  one article and dealing it out at the door consumes it — the same shape as
  the New Orleans tarot and the Dolomites trick card. The entry's own question
  about breaking decks is answered.

### the Smorfia slip
- **room:** `amalfi-1953`  ·  **native or affinity:** native
- **what it is:** a small printed slip with one number and what it means, one per
  guest, from the same sheet the tomboliere is calling off.
- **why it survives the night:** it is a number with a meaning attached, which is
  the shape of a thing people keep and show other people.
- **strength:** fair
- **founder question:** twee risk — is this a fortune cookie in period dress?
- **own-stock ruling, 2026-08-26:** STAGED — the kit's Smorfia TRANSLATION
  SHEET ships once, but this clause declares a printed slip per guest, which
  is separate stock. Own row.

### the song sheet
- **room:** `amalfi-1953`  ·  **native or affinity:** native
- **what it is:** a printed sheet of the words to the one everybody sang, one per
  guest, in period setting.
- **why it survives the night:** printed song sheets were a real object people
  really bought, and it is evidence that a room full of people sang, which is
  not a thing you can fake afterwards.
- **strength:** fair
- **founder question:** rights on any lyric still in copyright, which for
  canzone napoletana varies wildly by song. Which titles are clear?
- **own-stock ruling, 2026-08-26:** STAGED — one printed sheet per guest. Own
  stock.

### the rosolio
- **room:** `amalfi-1953`  ·  **native or affinity:** native
- **what it is:** a very small bottle of the lemon liqueur she made a month
  earlier, one each, never called by a brand name.
- **why it survives the night:** it was made by the host on a lead time she
  committed to, which is the most host-as-author object available to this room,
  and an unopened miniature waits in a freezer for a year.
- **strength:** fair
- **founder question:** at `crowd` this is the most expensive thing on the list
  and it is alcohol. Does it survive the guest count, or is it the take-home for
  the small end of the range only?
- **own-stock ruling, 2026-08-26:** STAGED — one small bottle each. Own stock.
  The crowd-scale cost question stands.

### the santino
- **room:** `amalfi-1953`  ·  **native or affinity:** native
- **what it is:** a small printed holy card of the kind that was in every wallet
  and every missal in 1953 southern Italy.
- **why it survives the night:** it is flat, it is beautiful, it costs nothing,
  and it is the object of this exact time and place most likely to still be in
  somebody's wallet in 2026.
- **strength:** fair
- **founder question:** a real one, and I am not going to pretend otherwise:
  does religious material belong in a party product at all? It is
  unimpeachably period and it could read badly. Founder decides, not me.
- **own-stock ruling, 2026-08-26:** STAGED — one printed card per guest. Own
  stock. The founder's decision on religious material is untouched by this
  ruling.

### the beans
- **room:** `amalfi-1953`  ·  **native or affinity:** native
- **slots:** the_take_home + the_atmosphere  ·  **why both:** the beans are the tombola kit's markers and belong to it; the claim is only that the ones on your card are yours at the end.
- **what it is:** the dried beans a guest marked their cartella with, twisted
  into a paper.
- **why it survives the night:** they are the physical count of how close
  somebody came, and they cost nothing.
- **strength:** fair
- **founder question:** with both this and the cartella now claiming
  the_atmosphere as well, is the bean a separate item at all, or should it be one
  line inside the cartella's row?
- **own-stock ruling, 2026-08-26:** SECOND CLAIM, NOT STAGED — A DOSE CLAIM on
  a bulk row. A sack of dried beans is bulk inside the kit; the kit carries
  enough to lose some. Not a row.
- **ruling 2/3, 2026-08-26:** BULK REFINEMENT ADOPTED AS STATED, 2026-08-26.
  A sack of dried beans is bulk inside the tombola kit. Settled; still not a
  row.

### the bract
- **room:** `amalfi-1953`  ·  **native or affinity:** native
- **what it is:** a bougainvillea bract off the staging, pressed flat.
- **why it survives the night:** it is papery already, so it presses and keeps
  its colour for years.
- **strength:** thin
- **founder question:** the bank already treats bougainvillea as conditional —
  "if the florist can, else the lemons are the colour." Does a take-home that
  may not exist belong in a slot at all?
- **own-stock ruling, 2026-08-26:** KILLED — Bougainvillea is conditional
  staging (`if the florist can, else the lemons are the colour`) and the bract
  is a subtraction from it with no per-guest quantity. The entry's own doubt
  was right.

### the ticket up
- **room:** `amalfi-1953`  ·  **native or affinity:** native
- **what it is:** a reproduction cardboard boat ticket, one per guest, since the
  brief has arrival by boat or by steps.
- **why it survives the night:** it is wallet-shaped and it names the one thing
  that makes this coast vertical rather than level.
- **strength:** thin
- **founder question:** same objection as Nantucket's ferry stub — nobody took a
  boat. Is a prop ticket for a crossing that did not happen beneath this house?
- **own-stock ruling, 2026-08-26:** STAGED — one reproduction ticket per
  guest. Own stock. Thin, unchanged.

### the confetti, in a twist
- **room:** `amalfi-1953`  ·  **native or affinity:** native
- **what it is:** sugared almonds in a paper twist, a few each.
- **why it survives the night:** they keep for months in a drawer.
- **strength:** thin
- **founder question:** flagged against myself — this is pan-Italian rather than
  this coast, which is precisely the country-not-room failure the matrix exists
  to catch. Probably cut.
- **own-stock ruling, 2026-08-26:** STAGED — a few each in a twist. Own stock.
  Thin, and the entry's own `probably cut` travels with it.

### the closer's card
- **room:** `amalfi-1953`  ·  **native or affinity:** native
- **what it is:** the technique card for the homemade lemon liqueur, one per
  guest rather than one per house, with the lead time on it.
- **why it survives the night:** it is a recipe with a thirty-day commitment in
  it, which means keeping it is a decision rather than a habit.
- **strength:** fair
- **founder question:** the card already ships with the act. Is the per-guest
  version a new row or a quantity change?
- **own-stock ruling, 2026-08-26:** STAGED — the ruling answers the entry's
  question: the act's card ships one, so the per-guest version is a new row
  with its own stock.

**Cut from Amalfi, with reasons:** a majolica-pattern paper fan (hand fans are
dead catalogue-wide — church fans are New Orleans', and the abanico was killed at
Havana for blurring); a tambourine (cost at crowd, and straight into folk
costume); a 45rpm record (era-legal in 1953 but far too expensive per head at
crowd scale); a coral bead (Torre del Greco coral is genuinely of this coast and
of this era, and sourcing it today is a mess I do not want the founder to
inherit); a wooden tombola token (there are ninety of them and they belong to the
kit — pulling them out breaks the game for the next party).

---

# BIG SUR, 1971

**Thirteen, and this is the room whose shortfall I am most confident about.**
The whole thesis is that nothing was arranged: the centrepiece is foraged, the
candle surfaces are improvised, the beer is in a creek because that is the
refrigeration system. A manufactured take-home is an argument against the room.
So the strong items here are all things picked up off the ground or produced by
the game, and the merchandise-shaped ones are marked thin on principle rather
than reluctantly. Note also that the voice's never-list disqualified my single
favourite idea in this whole document; it is in the cut notes.

### the noun slip that was yours
- **room:** `big-sur`  ·  **native or affinity:** native
- **slots:** the_take_home + the_atmosphere  ·  **why both:** the slips already ship as the game; the take-home claim is that the pile is not collected.
- **what it is:** the slip a guest drew in the noun game — the fog is a card —
  kept rather than returned to the pile.
- **why it survives the night:** it is a single word on a piece of paper that
  only means anything to the eight people who were there, which is the exact
  shape of the thing found in a coat pocket in March.
- **strength:** strong
- **founder question:** same frame as Amalfi's cartella, flagged in the header.
  If one of the two goes, this is the one.
- **own-stock ruling, 2026-08-26:** SECOND CLAIM, NOT STAGED — `noun-game 1971
  slips` are already printed per player; the claim is only that the pile is
  not collected.

### bay leaves, a handful
- **room:** `big-sur`  ·  **native or affinity:** native
- **what it is:** California bay picked off the trees along the road, a handful
  each, tied or loose.
- **why it survives the night:** it is violently aromatic, it dries in a week,
  and somebody cooks with it for a year — a foraged thing that becomes useful is
  the most Big Sur object available.
- **strength:** strong
- **founder question:** California bay is much stronger than the Mediterranean
  leaf people expect. Does the card have to say so, and does saying so turn a
  fact into an instruction?
- **own-stock ruling, 2026-08-26:** STAGED — `a handful each` is a per-guest
  quantity on an order of dried bay. Own stock.

### the map with the pull-off marked
- **room:** `big-sur`  ·  **native or affinity:** native
- **what it is:** a folded paper map of the road with the one past the bridge
  marked on it, one per car or per guest.
- **why it survives the night:** there is no signal, so paper is a fact rather
  than nostalgia, and a folded map lives in a glove box until the car is sold.
- **strength:** strong
- **founder question:** is this arrival material rather than a take-home? The
  road is one of the things this voice breaks character for, and a map that is
  ALSO safety information may belong at the front of the evening.
- **own-stock ruling, 2026-08-26:** STAGED — one folded map per guest. Own
  stock.

### what was played, in order
- **room:** `big-sur`  ·  **native or affinity:** native
- **what it is:** a card listing the records that got named aloud at the fire,
  in the order they were played, with the one line each got.
- **why it survives the night:** "this is for the fog" written next to a record
  is a thing somebody goes and buys the record because of.
- **strength:** fair
- **founder question:** affinity candidates exist across the set — Westhampton's
  record flip, Acapulco's named first song — but both are other agents' rooms
  this round, so I have not tagged them. Should this be one row across three
  rooms?
- **own-stock ruling, 2026-08-26:** STAGED — one card per guest. Own stock.

### the hand-thrown cup
- **room:** `big-sur`  ·  **native or affinity:** native
- **slots:** the_take_home + the_table_set  ·  **why both:** the hand-thrown plates are already the room's table register and a cup off the same wheel is the same claim, which is also the answer to the cost objection — it is not an extra object, it is the object you were already given.
- **what it is:** a small hand-thrown stoneware cup, one each, from the same
  hands that made the plates.
- **why it survives the night:** studio pottery from 1971 California is the
  correct object for this room down to the year, and a cup somebody made is used
  every morning for a decade.
- **strength:** strong
- **founder question:** the cost objection largely dissolves under the second
  claim — this is the vessel the guest was already given, not an extra one — but
  I would still want a real per-unit number at the top of the guest range.
- **own-stock ruling, 2026-08-26:** STAGED — the entry's `it is not an extra
  object, it is the object you were already given` DOES NOT HOLD — the plates
  are plates and a cup is separate stock. It survives as its own per-guest
  row, which means the cost objection the second claim was answering comes
  back, exactly as the entry half-suspected.

### dried eucalyptus
- **room:** `big-sur`  ·  **native or affinity:** `affinity: cote-dazur`
- **what it is:** the Côte d'Azur loose-aromatic row, substituting dried
  eucalyptus off the foraged pile for wild lavender.
- **why it survives the night:** same reason as the parent row — it keeps its
  smell in a drawer for a year and costs nothing — and here it comes off the
  centrepiece the beach was the florist for.
- **strength:** fair
- **founder question:** is one row with a substitution the right call, or does
  the founder want two native rows and accept the same-frame duplication?
- **own-stock ruling, 2026-08-26:** AFFINITY — rides on the staged Cote d'Azur
  loose-aromatic row as the named substitution. No stock of its own and none
  needed.
- **RULING RE-AUTHORED 2026-08-26 (rule 14 — the AFFINITY ruling above is kept,
  not deleted):** it was inert as written. Affinity re-weights scoring for
  already-eligible candidates; it never confers eligibility — sharing requires
  a second native row — so "rides on the staged Côte d'Azur row as its
  affinity" would have put nothing at Big Sur at all. **KEPT AND RE-AUTHORED**
  as `(Also at: Big Sur)` on the Côte d'Azur row in
  `docs/atmosphere-idea-bank-v1.md`, which seeds a second `native = true` row.
  The judgement that this deserves a shared row is UPHELD on its merits: the
  parent row's own sentence names the eucalyptus substitution, so the whole
  item travels verbatim and still reads true in the second room, which is the
  test. Still no stock of its own and none needed.

### the abalone shell
- **room:** `big-sur`  ·  **native or affinity:** native
- **what it is:** an abalone shell, the era's dish-and-ashtray-and-everything,
  one per guest or one per couple.
- **why it survives the night:** it is the single most 1971-California object
  there is and it lasts forever on a shelf.
- **strength:** fair
- **founder question:** the honest problem is now, not then — the red abalone
  fishery has been closed since 2018 and two other species are endangered, so
  legal sourcing today is genuinely unclear. Can this be bought clean at
  quantity? If not, cut it, and it should be cut loudly rather than quietly.
- **own-stock ruling, 2026-08-26:** STAGED — one shell per guest. Own stock.
  The sourcing legality question stands and is louder than the ruling.

### a redwood cone
- **room:** `big-sur`  ·  **native or affinity:** native
- **what it is:** a coast redwood cone, which is startlingly small for the tree,
  one per guest.
- **why it survives the night:** it is odd enough that people show it to other
  people, and it lives on a windowsill indefinitely.
- **strength:** fair
- **founder question:** none.
- **own-stock ruling, 2026-08-26:** STAGED — one cone per guest. Own stock.

### driftwood off the pile
- **room:** `big-sur`  ·  **native or affinity:** native
- **slots:** the_take_home + the_table_set  ·  **why both:** same as the fern — the beach is the florist, the pile is the centrepiece, and the take-home claim is only that it is not put back in the car.
- **what it is:** a piece off the foraged centrepiece, taken when the table is
  cleared.
- **why it survives the night:** it costs nothing and it ends up on a shelf.
- **strength:** fair
- **founder question:** this and the creek stone are nearly the same item. Keep
  both, or keep one?
- **own-stock ruling, 2026-08-26:** KILLED — The foraged centrepiece is one
  assembled article; taking it apart at the end is subtraction, not stock.
  Same verdict as the fern beside it.

### the pressed fern
- **room:** `big-sur`  ·  **native or affinity:** native
- **slots:** the_take_home + the_table_set  ·  **why both:** the foraged centrepiece IS the fern, so the second claim is where the fern was before somebody flattened it.
- **what it is:** a sword fern frond off the centrepiece, pressed flat between
  two cards.
- **why it survives the night:** ferns press well and keep their shape for
  decades, and this one grew where the party was.
- **strength:** fair
- **founder question:** does pressing require an act somebody performs, and if
  so does this become a host act pointing at a good?
- **own-stock ruling, 2026-08-26:** KILLED — same reason as the driftwood:
  `the foraged centrepiece IS the fern` is the entry's own sentence, and a
  centrepiece is one article.

### the creek stone
- **room:** `big-sur`  ·  **native or affinity:** native
- **what it is:** a stone out of the creek the beer was kept in.
- **why it survives the night:** it is a stone, so it survives everything.
- **strength:** thin
- **founder question:** river stones are already staging here. Is the take-home
  version anything more than picking one up?
- **own-stock ruling, 2026-08-26:** HELD — picked up off the ground; nothing
  on the order. Held. Thin, unchanged.
- **category-3 ruling, 2026-08-26:** STAGED — CATEGORY 3, `per_guest`,
  supplied by the night itself. HELD stands, `thin, unchanged` stands. The
  founder named it in her list, which is what admits it; nothing in the
  sheet's argument for it improved.

### the bandana
- **room:** `big-sur`  ·  **native or affinity:** native
- **what it is:** a plain cotton bandana, one each, used for the pan handle at
  the fire and kept.
- **why it survives the night:** it is cheap, useful, and smells of smoke for
  weeks.
- **strength:** thin
- **founder question:** how close is this to the 1971 costume the premise
  refuses? I think one step too close, which is why it is thin.
- **own-stock ruling, 2026-08-26:** STAGED — one bandana each. Own stock.
  Thin, unchanged.

### the poured candle
- **room:** `big-sur`  ·  **native or affinity:** native
- **slots:** the_take_home + the_light  ·  **why both:** the improvised candle surface is this room's light, and a jar poured at the fire is that light in a form somebody can carry.
- **what it is:** wax poured into a jar at the fire and carried off once set.
- **why it survives the night:** it burns in somebody's kitchen months later.
- **strength:** fair
- **founder question:** the improvised candle surface is the room's whole
  candle answer and it is improvised BY HER. Does shipping a pouring craft
  contradict it?
- **own-stock ruling, 2026-08-26:** STAGED — the jars and the wax are
  per-guest stock the house would order; the improvised candle surface is not
  what this claims. Dual claim survives on the new stock.

**Cut from Big Sur, with reasons, and the first one hurt:** a printed card
certifying that the bearer saw the spout. It is the funniest idea I had for any
of the six rooms and the voice kills it twice on its own never-list — *"Never
turn the spout into an activity"* and *"never mark it as a joke."* A card that
certifies the sighting confirms the joke, and this room's humour works by never
doing that. Also cut: a Thoth tarot card (the deck is object-only here, the
reading belongs to New Orleans, and giving cards away breaks a deck); a matchbook
(New York's); a cassette of the fire's records (period-legal in 1971, but the
music rights are a different system and the tracklist card does the job); a
mussel shell off the rocks (the quarantine season runs May to October, which is
when this room happens — the shell is fine but sourcing the story around it is
not); a pressed California poppy (the petals shatter within a day, so it fails
the survives-the-night test literally).
