# Take-home bank — proposal sheet, six rooms
**PROPOSAL ONLY. Nothing here is approved, nothing here is seeded.** A later
pass moves approved items into the idea bank with founder-pending markers so
they seed as drafts (rule 13: an item carrying a founder question stays draft,
and most items here carry one). Rooms in scope: WESTHAMPTON, 1976 · NEW YORK,
1938 · NEW ORLEANS, 1956 · DOLOMITES, 1956 · HAVANA, 1957 · LAS VEGAS, 1960.

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

## The dual-claim ruling, applied

The founder ruled on a Catskills rock place setting that an item may claim more
than one slot — one row, two claims — and the machinery already supports it:
`bank_item_slot` is an eligibility join, `fill.ts` places an item once per
package and skips it thereafter, so an item eligible for two slots cannot fill
both in one box. db/043's classifier writes ONE claim so that nothing is
unclassified; that default is a floor, and a second claim is authoring.

**This ruling changed the sheet more than any other constraint on it.** The bar
asks for take-homes that carry evidence of the evening — something used, marked,
won or made — rather than merchandise printed in advance. An object that was
USED during the evening and then left with a guest is, by definition, two slots.
So the shape the bar prefers is the shape the ruling just legalised, and I
re-read every item against it before finishing.

What changed concretely:

- **Four items I had marked `thin` are now `fair`,** because their weakness was
  that nothing happened to them as take-homes — and as second claims on
  something that did a job all evening, that objection dissolves. They are the
  record-player rule card, the felt square, the Vegas number off the door
  (still thin — see its entry, it was the one that did not survive), and the
  Dolomites larch sprig (also did not survive).
- **Five items moved up to `strong`** on the same logic: the slip you drew, the
  sixth die, the card that took the last trick, the small glass, and the peg.
- **One row dissolved entirely.** New Orleans's "one of the dark red roses" is
  not a new bank item at all; it is a second claim on the florals row already in
  the bank. That is the ruling's most useful consequence and probably its most
  under-used one: some take-home content is not authoring, it is a claim added
  to a row that already exists.

**23 of the 47 rows below carry two claims.** That is high against "dual claims
stay the exception," and I want to be plain about why rather than trim to hit a
proportion: this is the one slot whose quality test actively selects for the
dual shape. A pass over `the_light` or `the_table_set` would not come back at
half. Every dual below states which claim is primary and why the second is real,
and I dropped the two where the second claim was true but convenient — the
sugared almonds and the paper hat are at each place and could claim
`the_table_set`, but they are thin items and a thin item with two claims is
still a thin item.

## Counts

| room | native rows | of those, dual-claim | claimable here (native + affinity) | reaches twenty |
|---|---|---|---|---|
| westhampton-1976 | 9 | 4 | 14 | no |
| new-york | 10 | 6 | 13 | no |
| new-orleans | 7 | 2 | 12 | no |
| dolomites | 7 | 4 | 12 | no |
| havana | 6 | 2 | 11 | no |
| las-vegas | 8 | 5 | 13 | no |
| **total** | **47** | **23** | | |

**No room reaches twenty and I am not going to pretend otherwise.** Twenty per
room is 120 rows. The bar as written — a guest carries it out, it is period-true
to the room rather than the country, it is cheap enough that everyone gets one,
and it preferably carries evidence of the evening — cuts the field to somewhere
between six and ten per room before affinity, and to eleven to fourteen after.
Forcing 120 produces exactly the thing the bar exists to refuse: merchandise
printed in advance, one object rewritten six ways.

The affinity mechanism does real work here and is the reason the totals are not
worse. Five items are authored once and claimed by four to six rooms: the place
card, the technique card, the prompt slip, the hours card, and the small glass.
Without it those five would have been twenty-eight near-identical rows.

> **MARKED 2026-08-26 — THE PARAGRAPH ABOVE IS WRONG, AND IT IS KEPT PER
> CLAUDE.md RULE 14 BECAUSE THE ERROR IS INSTRUCTIVE.**
>
> **affinity re-weights scoring for already-eligible candidates; it never
> confers eligibility — sharing requires a second native row.**
>
> `claimEligibility` (`src/lib/selection/occasion.ts`) reads a `native` row as
> a WHITELIST: an item with any native row is eligible in its native rooms AND
> NO OTHERS. A `bank_item_world` row that is neither native nor forbidden is
> NOT A CLAIM — its `affinity` is the additive term stage 4 scores with, and an
> item is never scored in a room it is not eligible in. So an "affinity to five
> rooms" line does not put one row in six rooms. It puts one row in ONE room
> and attaches five numbers nothing will ever read.
>
> The mechanism is correct and load-bearing (it is what keeps a game weighted
> toward Westhampton at +0.4 playable everywhere else). It simply answers a
> different question than its name suggests. **The counts table above is
> therefore not what it says it is**: "claimable here (native + affinity)"
> counts rows that are not claimable there at all, and the true figure for
> every room is its native column.
>
> **NOTHING WAS STAGED ON THIS BASIS** — verified 2026-08-26 against a database
> built from the committed migration chain plus the full seeder chain:
> `select count(*) from bank_item_world where native = false` returns 0. So
> this is misleading annotation and not broken output, which is why it is
> marked rather than repaired.
>
> **WHERE A ROW GENUINELY DESERVES A SECOND ROOM, THE INSTRUMENT IS AN
> `Also at:` LINE** in `docs/atmosphere-idea-bank-v1.md`, which `seed:bank`
> parses into a second `native = true` row (FORMAT NOTES in that file). Its one
> constraint decides most of the cases below: **an `Also at:` row shares the
> WHOLE item verbatim — its name and its description travel unchanged.** An
> item whose words name its own room cannot travel, and wants a second row
> authored for the second room instead. Each of the seven decorative affinity
> lines below now carries that judgement inline.

### Rooms whose object world is too narrow for twenty, and why

- **havana (6 native).** The narrowest by a distance, and the room fought me
  hardest. Its goods are host-kept vessels — the brass, the bowls, the domino
  box, the cafecito kit — and its gesture is moving furniture. A room whose
  identity is that nobody leaves until three does not produce objects that
  leave. Three of the six are consumables I have marked thin. The dual-claim
  ruling helped it least of the six, because the vessels it would apply to are
  the ones the host keeps.
- **dolomites (7 native).** The room is times, one pot, and the fire. Almost
  every object in it is shared infrastructure — the copper pot, the throws, the
  lanterns, the poster. Its two strongest take-homes both come from the genepì,
  which is one act, and I have deliberately split it into two rows rather than
  pad elsewhere. The obvious twenty-filler here — a reproduction 1956 lift pass
  wired to a jacket zip — is killed by the room's own "vintage ski/boot decor"
  line, and I did not smuggle it back in.
- **new-orleans (7 native).** Not narrow so much as fenced. The room has more
  souvenir available to it than anything in the library and the premise refuses
  nearly all of it by name. Beads, brass, Bourbon Street, the king cake baby and
  the second-line handkerchief are each a take-home that would work anywhere
  else and cannot work here.

The two widest are **new-york** and **las-vegas**, and for the same reason: both
are rooms where paper is part of the arrangement — a plan of the table, a menu,
a stake in writing, a check for a coat, a slip drawn from a bowl. Paper marked
during an evening is the cheapest strong take-home there is, and it is also
where the dual claims cluster.

## What I noticed in the existing bank

1. **Several existing GOODS already qualify and need a SECOND CLAIM, not a new
   row.** Under the old single-slot reading I listed these as "reflag"; under the
   ruling the correct action is exact — add `the_take_home` to a row that already
   holds `the_table_set` or `the_atmosphere`. I have not re-authored any of them:
   Vegas's **one stem at each place** and its **wrapped Pick-a-Number prize**
   ("everyone wins eventually" means every guest leaves holding one); New
   Orleans's **church fans at places**, its **go-cups at the door**, and its
   **dark red roses**; the Dolomites' **Watten/briscola rules card**. Six second
   claims, no new content, and they cost a founder decision rather than an
   authoring pass.
2. **New York's custom matchbooks should carry affinity to at least four of my
   six rooms** — westhampton, las-vegas, havana, new-orleans. A 1960 Vegas
   matchbook and a 1976 Dune Road matchbook are the same object, and the bank
   currently reads as though only New York has one. The Dolomites case is
   different enough to argue: a box of long stove matches is not a bar
   matchbook. I did not author either; this is a flag on the existing row.
3. **The prompt-slip family is the largest latent duplication in the bank.**
   Six of my rooms have a game whose content is a written or drawn slip — The
   Game 1938, the 1956 charades deck, Celebrity 1960, Havana's song naming,
   Westhampton's houseguest naming, the Dolomites' temperature guess. Six
   take-home rows for "the slip you kept" would have been six rewrites of one
   object. It is one row below, native to Vegas, dual-claimed, affinity to five.
4. **The bank is written mostly from the host's side.** Goods are what she
   places, acts are what she does. Almost nothing in 180 items is described from
   the position of a person walking out the door at two in the morning, which is
   probably why only two items qualified. The ruling reframes that finding: the
   gap may be less an authoring gap than a classification one — a number of
   existing goods are take-homes that were never claimed as such because the
   classifier writes one claim and nobody added the second.
5. **One structural risk I hit twice and flagged rather than hid.** "A small
   glass you drank from, kept" and "a cutting from the house plant, kept" both
   want to exist in two rooms with one ingredient swapped. That is the exact
   single-substitution failure named in CLAUDE.md's not-yet-ratified section. I
   collapsed each into one row with affinity, and said so in the entries.

---

## WESTHAMPTON, 1976
**9 native, 4 dual-claim.** The house explains nothing, so nothing here is
presented, labelled or handed over with a line. The good take-homes in this room
are all things a guest ends up with rather than things a guest is given.

### the Polaroid you are in
- **room:** westhampton-1976  ·  **native or affinity:** native
- **what it is:** The camera on the side table is already a good; this is the print — every guest leaves with one they are in, and the back is written on or it is not.
- **why it survives the night:** It is the only object in the room that could not have existed before the weekend, and nobody throws away a photograph of themselves at twenty-nine.
- **strength:** strong
- **founder question:** The bank has the photos accumulating on the side table, which is a house artifact. Does the house keep the pile and give one to each guest, or does the pile go and the guests take everything? Those are two different rooms.
- **own-stock ruling, 2026-08-26:** STAGED — the print is per-guest and
  consumed film; the camera row stays where it is. Own stock.

### the paperback nobody asks about
- **room:** westhampton-1976  ·  **native or affinity:** native
- **what it is:** A period paperback per guest, put on the shelf before anyone arrives, gone by Monday, and the house does not mention it.
- **why it survives the night:** A book with somebody else's sand in it stays on a shelf for thirty years, and it is the one take-home a guest can convince themselves they stole.
- **strength:** strong
- **founder question:** Sourcing at volume — used 1970s paperbacks are cheap but not consistent. Does the house choose which title goes to which guest, or is it a shelf and whatever happens happens?
- **own-stock ruling, 2026-08-26:** STAGED — one paperback per guest, ordered
  as such. Own stock.

### the pampas plume
- **room:** westhampton-1976  ·  **native or affinity:** native
- **what it is:** One dried plume per guest out of the pampas the room already ships, cut short enough to carry on a train; the fallback is a dried hydrangea head off the hedge.
- **why it survives the night:** Dried pampas lasts years in a jar and asks nothing, and a 1976 plume standing in an apartment in 2026 is the joke without anybody making it.
- **strength:** strong
- **founder question:** Pampas is already a placed good. Under the ruling, is this a per-guest row at all, or is the right move a second claim on the existing pampas row — the same plumes, some of which leave? I lean second claim and would rather the founder decided than I authored a duplicate.
- **own-stock ruling, 2026-08-26:** STAGED — the clause names a per-guest
  quantity, so it is its own line. The second-claim option this entry asked
  about is CLOSED: the placed pampas is one arrangement and cannot carry a
  per-guest slot.

### the tag off the car keys
- **room:** westhampton-1976  ·  **native or affinity:** native
- **slots:** the_atmosphere + the_take_home  ·  **why both:** The tag exists to do a job during the evening — cars face the road because someone always leaves early — and the job is over the moment the keys go in a pocket, which is where the tag then lives.
- **what it is:** A numbered cardboard tag on a string, tied to each set of keys at the door so cars can be moved without waking anybody, and it goes home on the ring.
- **why it survives the night:** It stays on the keyring because taking it off is a job, and it is still there two cars later.
- **strength:** strong
- **founder question:** This is the same mechanism as New York's cloakroom check. Two rooms, two reasons — coats on a bed there, cars facing the road here. Does that read as one idea twice, or as the same object doing its actual job in two houses? Primary claim is `the_atmosphere`; the take-home claim is the authored one.
- **own-stock ruling, 2026-08-26:** STAGED — one tag per set of keys, new
  stock, no existing row involved. Dual claim survives because the per-guest
  stock satisfies both slots.

### the score, sealed
- **room:** westhampton-1976  ·  **native or affinity:** native
- **slots:** the_atmosphere + the_take_home  ·  **why both:** The envelope's first life is the game — the house keeps score and will not show it — and its second life is that the guest is holding the only copy of their own line.
- **what it is:** Each guest leaves with their line from the naming game in a sealed envelope, and it is their business whether it gets opened.
- **why it survives the night:** An envelope you have not opened is harder to bin than one you have.
- **strength:** fair
- **founder question:** Is this clever at the house's expense? The room's rule is that the house does not explain, and a sealed envelope is arguably a wink dressed as a refusal. The dual claim removes my merchandise objection but not this one.
- **own-stock ruling, 2026-08-26:** STAGED — one envelope per guest. Dual
  claim survives on that stock. Noted on the way past: the naming game it is
  the residue of is not a bank row in any room, so the good ships ahead of the
  game.

### the day's bulletin
- **room:** westhampton-1976  ·  **native or affinity:** native
- **slots:** the_atmosphere + the_take_home  ·  **why both:** The bulletin is posted on the hall table and read by the house all day, which is its primary job; taking one is the residue of that, not a separate object printed for the purpose.
- **what it is:** The printed bulletin off the hall table — Saturday's, with the heat and the umbrella on it — taken by whoever wants one.
- **why it survives the night:** It is the house's voice at its shortest, on card, and it dates itself.
- **strength:** fair
- **founder question:** Pre-generated per the slips rule, so it cannot name what actually happened. Does a bulletin that is true in register but not in fact still count as evidence of the evening?
- **own-stock ruling, 2026-08-26:** STAGED — printed per guest; the copy on
  the hall table comes off the same stack, so the dual claim rides on
  per-guest stock rather than on one posted card.

### the sunglasses out of the bowl
- **room:** westhampton-1976  ·  **native or affinity:** native
- **what it is:** A bowl of cheap drugstore sunglasses by the door, taken on the way to the beach and worn out on Monday.
- **why it survives the night:** Nobody returns sunglasses.
- **strength:** fair
- **founder question:** Merchandise or evidence? They were used, but they were bought in advance and nothing happened to them. Single-claim deliberately: a bowl by the door is not dressing a table and is not an act.
- **own-stock ruling, 2026-08-26:** STAGED — a bowl per party is per-guest
  stock. Own stock.

### the forty-five picked for you
- **room:** westhampton-1976  ·  **native or affinity:** native
- **what it is:** A 45 rpm single per guest, chosen by whoever is running the record player, handed over without comment.
- **why it survives the night:** A single is a small flat object with a year printed on it and it files itself.
- **strength:** fair
- **founder question:** Sourcing and cost — used 45s are a few dollars each but supply is not uniform. Also: does this collide with the LP pressings already shipping as goods for turntable members?
- **own-stock ruling, 2026-08-26:** STAGED — one single per guest. Own stock.

### the rule about the record player, on a card
- **room:** westhampton-1976  ·  **native or affinity:** native
- **slots:** the_table_set + the_take_home  ·  **why both:** It is a card at each place, which is what it is for and where db/043's classifier would already put it; the take-home claim is the second and weaker one, and it only exists because the line on it is good enough to keep.
- **what it is:** A small card carrying the house's one rule, at each place, taken or not.
- **why it survives the night:** Sometimes it does not. This is a printed line before it is an object.
- **strength:** fair
- **founder question:** I had this as thin and the ruling moved it, because as table dressing it earns its keep regardless of whether anybody pockets it. Is that the right use of a second claim, or is it a thin item being rescued by a mechanism?
- **own-stock ruling, 2026-08-26:** STAGED — a card at each place is per-guest
  by construction, so the table-set claim and the take-home claim sit on the
  same stock.

**Also claimable here (native elsewhere):** the place card out of its stand
(new-york) · the card for the thing you watched somebody do (new-york) · the
slip you drew (las-vegas) · your story in somebody else's hand (new-orleans) ·
the cutting off the courtyard plant (havana). Plus the existing New York
matchbook row, if it gains affinity.

---

## NEW YORK, 1938
**10 native, 6 dual-claim.** The widest of the six, because ceremony runs on
paper and paper takes a mark. It also carries the most dual claims of any room
here, and that is a fact about the room rather than an artefact of the pass:
this room's take-homes ARE its table dressing, because everything at a New York
place is printed and everything printed at a New York place has a name on it.

### the cloakroom check
- **room:** new-york  ·  **native or affinity:** native
- **slots:** the_atmosphere + the_take_home  ·  **why both:** The check has a real job all evening — it is how a coat comes back off the bed — and the stub in the pocket afterwards is that job's residue, not a favour handed out at the door.
- **what it is:** A numbered duplicate ticket handed over as the coat goes to the bed, torn from a book, and the stub goes home in a pocket.
- **why it survives the night:** The room's own joke is that the bed is not a cloakroom and is treated as one; the check is that sentence as an object, and it costs pennies.
- **strength:** strong
- **founder question:** none.
- **own-stock ruling, 2026-08-26:** STAGED — one numbered stub per guest, torn
  from a book the house ships. Own stock.

### the menu, signed round the table
- **room:** new-york  ·  **native or affinity:** native
- **slots:** the_table_set + the_take_home  ·  **why both:** The menu card is already the table dressed — the classifier sends "menu card" to `the_table_set` on sight — and the signing is what converts the same object into the thing that leaves. This is the founder's Catskills ruling in its cleanest form.
- **what it is:** The part-French menu card already at each place, passed round after dessert so everyone signs everyone's.
- **why it survives the night:** Ten signatures and a date turn a printed card into a document, and it is period-exact — people did this to menus all through the thirties.
- **strength:** strong
- **founder question:** Does the passing need a card telling people to do it, which makes it a game, or does the host simply start it, which makes it a host act with a good attached?
- **own-stock ruling, 2026-08-26:** SECOND CLAIM, NOT STAGED — `menu cards
  part-French at each place` is already one per place, so the take-home needs
  no stock of its own. Add the claim to that row; do not write a second one.

### the plan of the table
- **room:** new-york  ·  **native or affinity:** native
- **slots:** the_table_set + the_take_home  ·  **why both:** A diagram at each place is table dressing on the night and a record of who somebody sat beside forever after; neither claim is the whole object.
- **what it is:** A small printed diagram of the seating with every name on it, one at each place.
- **why it survives the night:** It is the only object in the library that records who a guest spent an evening beside, and that is the thing people want back in ten years.
- **strength:** strong
- **founder question:** Needs real names printed per party. Place cards prove the print path already carries names, but confirm the plan can be laid out from the same source without a human typesetting it.
- **own-stock ruling, 2026-08-26:** STAGED — one printed diagram at each
  place. Own stock.

### the place card out of its stand
- **room:** new-york  ·  **native or affinity:** native — affinity: westhampton-1976, las-vegas, new-orleans, havana, dolomites
- **AFFINITY LINE MARKED 2026-08-26 (rule 14, not deleted):** the five rooms
  named are NOT claims — affinity re-weights scoring for already-eligible
  candidates and never confers eligibility. As one row this reaches New York
  only. **Verdict: not an `Also at:` candidate as written.** The description
  is New York's card — heavy stock in a stand, in the host's hand — and the
  founder question on this very row says Westhampton's cards carry a line as
  well as a name. A row that travels travels verbatim; these are two objects
  and want two rows. It is the closest of the seven to earning a shared row,
  because its identity is *your name in somebody's handwriting* rather than a
  material — but that is a re-authoring, not a line.
- **slots:** the_table_set + the_take_home  ·  **why both:** This is the exact shape the founder ruled on. The card dresses the place during dinner and has the guest's name on it afterwards, and db/043 already gives it `the_table_set` by default — the take-home claim is the authored second one.
- **what it is:** The card with a guest's name on it in the host's hand, taken from the stand on the way out.
- **why it survives the night:** It has their name on it and somebody wrote it for them; that is the whole mechanism and it is why this is one row and not six.
- **strength:** strong
- **founder question:** New York is the native claim because the plan of the table is the room's thesis and the card is heavy stock in a stand. Is that right, or does Westhampton have the better claim because its cards carry a line as well as a name?
- **own-stock ruling, 2026-08-26:** SECOND CLAIM, NOT STAGED — `place cards in
  stands` is already per-guest. This is the founder's rock in the bank's
  existing furniture.

### the card for the thing you watched somebody do
- **room:** new-york  ·  **native or affinity:** native — affinity: westhampton-1976, new-orleans, dolomites, havana, las-vegas
- **AFFINITY LINE MARKED 2026-08-26 (rule 14, not deleted):** affinity confers
  no eligibility; as written this reaches New York only. **Verdict: not an
  `Also at:` candidate.** The row's own words are the 1938 martini spec, and
  every other room's technique card is a DIFFERENT card. One row claimed twice
  would deliver the martini spec to the Dolomites. Six rooms, six cards, six
  rows.
- **slots:** the_atmosphere + the_take_home  ·  **why both:** A technique card's first job is riding with the act it belongs to, which is where the bank already keeps it; a per-guest copy that was in a hand while the drink was made is the same object doing a second thing.
- **what it is:** A per-guest copy of whichever technique card the package selected — here the 1938 martini spec, roughly two to one, stirred, lemon twist.
- **why it survives the night:** It ends up taped inside a cabinet door, which is the only place a recipe actually lives, and it is the take-home that makes a guest do the thing again.
- **strength:** strong
- **founder question:** Technique cards currently ride with the act, host-side. Does a per-guest copy dilute the act — the point being that somebody in the room knows how and does it in front of you — or does it extend it?
- **own-stock ruling, 2026-08-26:** STAGED — the DUAL CLAIM DIES — a technique
  card rides with the act and ships once, which is single stock. The per-guest
  copy survives only as its own row, which is what is staged, single-claim.

### the message taken for you at the door
- **room:** new-york  ·  **native or affinity:** native
- **what it is:** A slip off the telephone message pad already by the door, filled in during the evening by whoever answered, real or otherwise, and handed over.
- **why it survives the night:** Somebody else's handwriting saying somebody rang for you at half past ten is evidence, and it is funny straight.
- **strength:** fair
- **founder question:** Do not name a branded pad form — the standard printed message pads are later than 1938. Confirm the wording on the slip is generic to the period. Also: is a message a guest knows is invented a joke the room would refuse? Single-claim: the PAD is the existing good and could take a second claim, but the slip torn off it is its own thing.
- **own-stock ruling, 2026-08-26:** STAGED — the pad is the existing good; the
  slips torn off it are per-guest consumable stock ordered for the purpose.

### the buttonhole
- **room:** new-york  ·  **native or affinity:** native
- **slots:** the_table_set + the_take_home  ·  **why both:** A single stem at each place is the table dressed — it is how Vegas already uses the same object — and here it is worn out of the apartment at the end of the night.
- **what it is:** A single white carnation or gardenia per guest, at the place and then in the lapel.
- **why it survives the night:** It gets pressed in a book or it does not; half survive, and the half that do survive a long time.
- **strength:** fair
- **founder question:** Period accuracy — the white carnation buttonhole is firmly correct with white tie and morning dress, less certain with black tie in 1938. Worth checking before this ships as a claim about the year.
- **own-stock ruling, 2026-08-26:** STAGED — the DUAL CLAIM ON THE FLORALS
  DIES — `single-variety white florals in low glass or chrome` is one
  arrangement. A stem per guest at the place is its own line, and the
  table-set claim rides on that new per-guest stock.

### the cork, dated
- **room:** new-york  ·  **native or affinity:** native
- **what it is:** A champagne cork with the date written on it in pencil at the table, one per guest from the bottles the room opens anyway.
- **why it survives the night:** Corks with dates on them end up in a drawer, and the room already opens more champagne than seems reasonable.
- **strength:** fair
- **founder question:** Acapulco owns the loud cork as punctuation. Different use, same object — does this collide, or is a marked cork sufficiently not a fired cork?
- **own-stock ruling, 2026-08-26:** HELD — the own-stock ruling does not reach
  it: it points at no bank row and the house ships nothing. `one per guest
  from the bottles the room opens anyway` makes the supply bottles, not
  guests. Held for the founder with the rest of the cork-and-cage family.
- **category-3 ruling, 2026-08-26:** STAGED — CATEGORY 3, `per_guest`,
  watching `the_drinks` for `yields_cork`. HELD stands. New York has three
  eligible drinks and one of them names champagne, so this is CONDITIONAL on
  today's catalogue — the first of the twenty whose dependency can be
  satisfied at all.

### the paper hat
- **room:** new-york  ·  **native or affinity:** native
- **what it is:** Period New Year's table favors — a paper hat, a cardboard noisemaker — one per place at midnight.
- **why it survives the night:** Rarely. It is true to 1938 and it does not last the week.
- **strength:** thin
- **founder question:** The genuine risk is that this is the one object that turns the room into a set, which its own rejected list refuses by name. I could give it `the_table_set` as a second claim and technically be right, and I have not, because a thin item with two claims is still thin.
- **own-stock ruling, 2026-08-26:** STAGED — one favor per place. Own stock.
  Thin, and thin is not what this ruling decides.

### the twist of sugared almonds
- **room:** new-york  ·  **native or affinity:** native
- **what it is:** A small paper twist of sugared almonds or chocolates at each place.
- **why it survives the night:** It does not — it gets eaten. Period-correct and honestly a favor rather than a keepsake.
- **strength:** thin
- **founder question:** none. This is the weaker kind and I am saying so. Same reasoning as the hat on why I did not give it a second claim.
- **own-stock ruling, 2026-08-26:** STAGED — one twist at each place. Own
  stock. Thin, unchanged.

**Also claimable here (native elsewhere):** the hours, on a card (dolomites) ·
the slip you drew (las-vegas). Plus the existing matchbook row, which is native
here already.

---

## NEW ORLEANS, 1956
**7 native, 2 dual-claim.** The room refuses more take-homes than it offers.
Everything that survived is either something a guest made during the evening or
something specific to this city in this decade rather than to the souvenir
version of it. One row that stood here in my first pass is gone — see the note
at the end of the section, which is the ruling doing its best work on this sheet.

### your story in somebody else's hand
- **room:** new-orleans  ·  **native or affinity:** native — affinity: westhampton-1976
- **AFFINITY LINE MARKED 2026-08-26 (rule 14, not deleted):** affinity confers
  no eligibility; as written this reaches New Orleans only. **Verdict: not an
  `Also at:` candidate.** The description IS the New Orleans game — everybody
  starts a story and the person on your left gets the ending wrong.
  Westhampton's naming game leaves a different residue and wants its own row.
- **slots:** the_atmosphere + the_take_home  ·  **why both:** The slips are the game, which is where the bank keeps games with their own content; the ending somebody else wrote is what the game leaves behind, and it did not exist before the evening.
- **what it is:** The room's game is that everybody starts a story and the person on your left finishes it and gets it wrong; each guest leaves with the wrong ending, written down, in that person's handwriting.
- **why it survives the night:** It is pure evidence, it costs a slip of paper, and it is unreadable to anybody who was not there.
- **strength:** strong
- **founder question:** The slips rule says the member never fills a blank, but that rule is about game CONTENT being pre-generated. Here the prompt is pre-generated and the guest writes the ending, which is the game itself. Confirm that reading before this seeds.
- **own-stock ruling, 2026-08-26:** STAGED — per-guest slips, ordered as such,
  and no bank row is being pointed at. Dual claim survives on that stock.

### the card that came up for you
- **room:** new-orleans  ·  **native or affinity:** native
- **slots:** the_atmosphere + the_take_home  ·  **why both:** The deck is out and read from all evening, which is the act; the single card that came up is marked to one person by chance and leaves with them.
- **what it is:** The tarot deck is already out and the host reads for whoever asks; the card that came up stays with the person it came up for.
- **why it survives the night:** Object plus act, marked to one person by chance, and it goes in a wallet or on a shelf and stays there.
- **strength:** strong
- **founder question:** This breaks up a deck — ten guests, ten cards gone. Does the kit ship a second sacrificial deck, or does the good deck get consumed by design over several parties? The second reading is better and cheaper but needs saying on the card.
- **own-stock ruling, 2026-08-26:** STAGED — the DUAL CLAIM ON THE TAROT ROW
  DIES — one deck is one article and ten cards out of it is the rose shape.
  The ruling ANSWERS this entry's own question in the sacrificial-deck
  direction: the take-home ships a second deck as its own stock.

### the bitters, in a bottle small enough to pocket
- **room:** new-orleans  ·  **native or affinity:** native
- **what it is:** A small bottle of Peychaud's per guest, so the Sazerac rinse can be done again at home.
- **why it survives the night:** A bitters bottle sits in a cupboard for ten years and gets used four times, which is longer than most objects in this document last.
- **strength:** fair
- **founder question:** Two things: cost per guest at volume, and whether bitters count as alcohol for shipping. Also — this is New Orleans-native rather than Louisiana-generic, which is the rule 6 reading I want confirmed.
- **own-stock ruling, 2026-08-26:** STAGED — one bottle per guest. Own stock.

### the roux, written out
- **room:** new-orleans  ·  **native or affinity:** native
- **what it is:** A card carrying the roux and nothing else, given to whoever was arguing about it, which by the end is everybody.
- **why it survives the night:** It is the thing a guest actually wants from this room, and the room's own bulletin says two people are still arguing about it and neither is cooking.
- **strength:** fair
- **founder question:** Printed in advance, or written out by the host in the moment? Printed makes it a technique card, and under the ruling it should then be a second claim on the New York technique-card row rather than a row of its own. Written makes it a host act with an object, which is stronger and does not scale. This is the cleanest test case on the sheet for when a second claim replaces authoring.
- **own-stock ruling, 2026-08-26:** STAGED — the ruling settles the entry's
  own test case: the New York technique-card row ships one, so the second
  claim is not available and the roux card is its own per-guest line.

### the token for the ride nobody takes
- **room:** new-orleans  ·  **native or affinity:** native
- **what it is:** A period transit token pressed into a hand at the gate, for a walk home everybody does on foot anyway.
- **why it survives the night:** It is metal, it is small, and it turns up in a coat pocket, which is the whole specification.
- **strength:** fair
- **founder question:** Period accuracy — by 1956 much of the New Orleans network had gone to buses, so confirm which token is correct for the year before this is described as one. Also confirm sourcing at ten per party.
- **own-stock ruling, 2026-08-26:** STAGED — one token per guest. Own stock.

### the saint's card out of a wallet
- **room:** new-orleans  ·  **native or affinity:** native
- **what it is:** A small devotional card at each place, the kind that lives in a wallet in this city in this decade.
- **why it survives the night:** They stay in wallets for decades, which is the single best survival record of any object on this sheet.
- **strength:** fair
- **founder question:** The real one: is this respectful or is it a religious object used as a party favor? It is materially true to 1956 New Orleans and it is not the souvenir city, but it is somebody's faith on a table. I am genuinely unsure and would not ship it without a decision.
- **own-stock ruling, 2026-08-26:** STAGED — one card at each place. Own
  stock. The ethical question is untouched by this ruling.

### the magnolia leaf with a line on it
- **room:** new-orleans  ·  **native or affinity:** native
- **what it is:** A magnolia leaf off the arrangement, written on in ink, which magnolia leaves hold.
- **why it survives the night:** It dries stiff and keeps the writing, and it is the cheapest object here.
- **strength:** thin
- **founder question:** Too twee? I think probably yes, and I have marked it thin rather than argue for it.
- **own-stock ruling, 2026-08-26:** KILLED — and it is the same object as the
  rose the sheet already dissolved. `tight classical florals` is one
  arrangement; a leaf taken off it is a subtraction from single stock, not a
  per-guest line. The sheet caught the rose and kept its twin.
- **ruling 2/3, 2026-08-26:** KILLED, CONFIRMED 2026-08-26. The bulk
  refinement is adopted as stated and it does not reach this: `tight
  classical florals` is one arrangement, not bulk material, so a leaf off it
  is a subtraction from a single article. Kept, not deleted, because it is
  the twin of the rose and the pair is what the test was calibrated against.

**Dissolved by the ruling, not authored:** "one of the dark red roses" stood
here as a row in my first pass and should not. The florals are already a bank
item; a stem taken from the arrangement on the way out is a SECOND CLAIM on that
row — `the_table_set + the_take_home` — and writing it as a new item would have
been the content debt this mechanism exists to kill. Recommend the same reading
for the **church fans at places** and the **go-cups at the door**: second claims
on rows that already exist, not new content.

**Also claimable here (native elsewhere):** the place card out of its stand
(new-york) · the card for the thing you watched somebody do (new-york) · the
slip you drew (las-vegas).

---

## DOLOMITES, 1956
**7 native, 4 dual-claim.** Narrow by construction. The room's objects are
shared — the pot, the throws, the lanterns, the poster — and almost nothing in
it is per-person except what somebody's name gets written on. The ruling helped
here, because a house that posts things and hands out tools is a house whose
objects have jobs before they have owners.

### the hours, on a card
- **room:** dolomites  ·  **native or affinity:** native — affinity: new-york, havana, las-vegas
- **AFFINITY LINE MARKED 2026-08-26 (rule 14, not deleted):** affinity confers
  no eligibility, so "one row with affinity" was never the four-room object
  the founder question asks about. **Moot either way — the row is KILLED
  below**, and a per-guest card of the day's hours would be different content
  in each of the four rooms in any case (an order of the evening, printed
  hours, a table held until midnight, a lift report are four cards).
- **slots:** the_atmosphere + the_take_home  ·  **why both:** The card is pinned on the board and consulted all day, which is the room's whole identity; unpinning it at the end is a second life for the same card and not a printed souvenir of it.
- **what it is:** The card off the board — the day's times, the conditions, the hour of the last car — unpinned at the end and taken.
- **why it survives the night:** The Dolomites are the only room in the library whose identity IS the posted card, and a card of hours for a day that has already happened is a better keepsake than a card of hours for one that has not.
- **strength:** strong
- **founder question:** Native here is right, but three other rooms want the same object for different reasons — New York's order of the evening, Havana's printed hours, Vegas's table held until midnight. Confirm one row with affinity is the intent rather than four differently-worded cards.
- **own-stock ruling, 2026-08-26:** KILLED — as written. The card on the board
  is ONE card; `unpinned at the end and taken` cannot reach ten guests. A
  per-guest printed card of the day's hours would be its own stock — but it
  would also be a different object, because the evidence here is that it hung
  on the board. That is an authoring pass, not a staging one.

### the peg with your name on it
- **room:** dolomites  ·  **native or affinity:** native
- **slots:** the_atmosphere + the_take_home  ·  **why both:** The peg does a real job from the moment the coats come off — it is how the room is orderly without anybody being told — and it has the guest's name on it, so it leaves.
- **what it is:** A wooden peg with a guest's name on it, used on the coats or the wet things at the door, taken home at the end.
- **why it survives the night:** A wooden peg with a person's name on it lives in a kitchen drawer indefinitely and nobody can bring themselves to bin it.
- **strength:** strong
- **founder question:** Does the peg have a job in a room that has no drying room? Coats at the door works anywhere, but then it is a coat peg rather than a drying-room peg and the room's identity gets thinner. Worth deciding which claim the card makes.
- **own-stock ruling, 2026-08-26:** STAGED — one named peg per guest, new
  stock, no row pointed at. Dual claim survives.

### the forty days, in an envelope
- **room:** dolomites  ·  **native or affinity:** native
- **what it is:** Dried genepì and the forty-forty-forty on a card, one envelope per guest, so the forty days start when they get home.
- **why it survives the night:** It is a take-home with a date attached — the guest either does it or looks at the envelope in March and remembers not doing it, and both of those are the object working.
- **strength:** strong
- **founder question:** Sourcing dried genepì at per-guest volume, and whether the plant material has any import or sale restriction. If it does not clear, this is the item I would fight hardest to keep, so it is worth checking properly.
- **own-stock ruling, 2026-08-26:** STAGED — one envelope per guest. The
  genepi KIT ships once; this is separate stock, which is exactly what the
  ruling requires.

### the genepì, in a small bottle, dated
- **room:** dolomites  ·  **native or affinity:** native
- **what it is:** A small corked bottle per guest of the genepì the host started forty days ago, with the date it was started written on it.
- **why it survives the night:** Homemade liqueur in a small bottle survives in a cupboard for years, and the date on it is the whole story the gesture tells.
- **strength:** strong
- **founder question:** Yield — does the kit make enough for ten small bottles plus the pour at the table? If not, this and the envelope above are one item, not two, and the count here drops to six.
- **own-stock ruling, 2026-08-26:** STAGED — one bottle per guest. Own stock.
  The yield question stands.

### the card that took the last trick
- **room:** dolomites  ·  **native or affinity:** native
- **slots:** the_atmosphere + the_take_home  ·  **why both:** The deck is the game and the game runs until the fire is banked; one card leaves because somebody won it, which is a different event from the deck being put away.
- **what it is:** From the northern-Italian deck already shipping: whoever takes the last trick keeps the card.
- **why it survives the night:** It is a thing that was won rather than given, and a single Trevigiane card is unmistakably not a poker card, which does the room's work without a word.
- **strength:** strong
- **founder question:** Same deck-integrity question as the New Orleans tarot — sacrificial second deck, or the good deck wears down over parties?
- **own-stock ruling, 2026-08-26:** KILLED — twice over. It points at the one
  shipped deck, and it reaches ONE guest rather than every guest. Neither half
  survives the ruling.

### the felt square under the glass
- **room:** dolomites  ·  **native or affinity:** native
- **slots:** the_table_set + the_take_home  ·  **why both:** Cut from the same felt as the runners and trivets already shipping, so it is table dressing first and it was under a glass all evening before anybody pocketed it.
- **what it is:** A cut felt coaster per guest, off the room's existing felt.
- **why it survives the night:** It is useful and small, and it spent the evening doing something.
- **strength:** fair
- **founder question:** I had this as thin and the ruling moved it. Is that legitimate, or should it be a second claim on the existing felt runners row rather than a per-guest item of its own? I lean toward its own row only because a runner and a coaster are cut differently, and I am not certain.
- **own-stock ruling, 2026-08-26:** STAGED — the ruling answers the entry's
  own uncertainty: the felt runners and trivets are shared stock, so a coaster
  per guest is its own line. Dual claim survives on that new per-guest stock.

### the larch sprig
- **room:** dolomites  ·  **native or affinity:** native
- **what it is:** A cut sprig off the larch and pine already in the room, taken on the way out.
- **why it survives the night:** It smells right for two weeks and then it is a stick.
- **strength:** thin
- **founder question:** none. Weak, and included only because the room's count is honest rather than padded. The ruling did not rescue this one: the branches are already a placed good, so if anything survives here it is a second claim on that row and not this.
- **own-stock ruling, 2026-08-26:** SECOND CLAIM, NOT STAGED — A DOSE CLAIM on
  a bulk row, and only that. `larch/pine branches` is bulk material, so more
  branches on the order is stock the take-home can have. That is the ruling's
  answer; the sheet's own withdrawal on quality stands and nothing is staged.
- **ruling 2/3, 2026-08-26:** BULK REFINEMENT ADOPTED AS STATED, 2026-08-26.
  `larch/pine branches` is bulk material, so the ruling's answer is a dose
  rise — and the sheet's own withdrawal on quality stands beside it,
  unchanged. Nothing is staged.

**Also claimable here (native elsewhere):** the place card out of its stand
(new-york) · the card for the thing you watched somebody do (new-york) · the
small glass, kept (havana — here it is the grappa glass, taken standing) · the
slip you drew (las-vegas). Plus the existing **Watten/briscola rules card**,
which should take `the_take_home` as a second claim.

**Cut from this room, deliberately:** a reproduction 1956 Cortina lift pass
wired to a jacket zip. It is the single most period-true object available and it
is exactly the "vintage ski/boot decor" the room already killed. Also cut: a
wool boot-sock, on cost, at roughly eight dollars a guest.

---

## HAVANA, 1957
**6 native, 2 dual-claim, and this room fought me hardest.** Its goods are
vessels the host keeps and its gesture is furniture. Three of the six below are
consumables and are marked thin. I would rather hand over six than pad this to
twenty. The ruling helped this room least, because the objects it would apply
to — the brass, the bowls, the domino box — are precisely the ones that stay.

### the small glass, kept
- **room:** havana  ·  **native or affinity:** native — affinity: dolomites
- **AFFINITY LINE MARKED 2026-08-26 (rule 14, not deleted):** affinity confers
  no eligibility; as written this reaches Havana only. **Verdict: not an
  `Also at:` candidate.** The founder question on this row answers it — a
  porcelain tacita the espumita went into and a stemless grappa glass taken
  standing are two materials and two rooms' words. This is the
  single-substitution shape CLAUDE.md's not-yet-ratified note names, and the
  substitution is not written into the row the way Côte d'Azur's loose dried
  aromatic writes its Big Sur eucalyptus.
- **slots:** the_table_set + the_take_home  ·  **why both:** The tacita is what the coffee is served in, which is table dressing and would be classified there on the word alone; the espumita is whipped into it at three in the morning and then it goes home. Same object, both jobs real.
- **what it is:** The tacita the espumita was whipped into, one per guest, kept.
- **why it survives the night:** A tiny cup makes a person make coffee differently at home, and it lives on a shelf where it is looked at rather than in a cupboard where it is not.
- **strength:** strong
- **founder question:** Two. Cost — small porcelain cups at ten per party is the most expensive item on this sheet. And the affinity: the Dolomites want the same row as a stemless grappa glass, taken standing. Different material, same idea. Is that one row with two materials, or did I collapse two real items into one?
- **own-stock ruling, 2026-08-26:** STAGED — the cafecito KIT ships once, so
  the dual claim cannot sit on it. Per-guest tacitas are their own line, and
  the table-set claim rides on that stock.

### the cutting off the courtyard plant
- **room:** havana  ·  **native or affinity:** native — affinity: westhampton-1976
- **AFFINITY LINE MARKED 2026-08-26 (rule 14, not deleted):** affinity confers
  no eligibility, so the entry's fallback — "the affinity claim survives on
  its own" if monstera reads 2019 — would have survived as nothing at all.
  **Moot either way: the row is KILLED below**, and a hydrangea cutting off a
  Westhampton hedge is a different object with different words.
- **what it is:** A cutting off the monstera already in the room, wrapped wet, taken home and put in a jar of water.
- **why it survives the night:** It roots. In four years it is a large plant in somebody's apartment and it still has a date attached to it, which no other object here manages.
- **strength:** strong
- **founder question:** The real risk is that monstera reads 2019 rather than 1957 — it is the most photographed houseplant of the last decade and the room may be borrowing that rather than its own courtyard. If that is the verdict, the affinity claim survives on its own: Westhampton's version is a hydrangea cutting off the hedge and carries none of that problem. Note this is NOT a second claim on the plant row — the plant stays and the cutting leaves, which is one object becoming two.
- **own-stock ruling, 2026-08-26:** KILLED — as written, and this is the
  ruling's hardest bite on this sheet. One placed monstera cannot yield a
  cutting per guest, and the entry declares no per-guest quantity of its own.
  It is revivable the moment the house orders rooted cuttings as their own
  line — but writing that line is authoring.

### the song somebody named for you
- **room:** havana  ·  **native or affinity:** native
- **slots:** the_atmosphere + the_take_home  ·  **why both:** The slips are the game and the game builds the order the records get played in, which is a job that lasts all night; the slip with your song on it leaves afterwards.
- **what it is:** The room's game is that everybody names the song that gets somebody else up and nobody names their own; the slip with your song on it, in their handwriting, goes home with you.
- **why it survives the night:** Somebody else decided what gets you out of a chair and wrote it down, and that is not a thing a person throws away.
- **strength:** fair
- **founder question:** Honest flag: this is the New Orleans story-slip frame with one ingredient swapped — a slip another guest wrote about you. I have argued it is different because one is a narrative and one is a list, but I am not certain, and if the founder disagrees this becomes an affinity claim on the New Orleans row and Havana drops to five native.
- **own-stock ruling, 2026-08-26:** STAGED — per-guest slips, own stock. Dual
  claim survives.

### the second supper, wrapped, for the walk
- **room:** havana  ·  **native or affinity:** native
- **what it is:** A pressed sandwich wrapped in paper, handed over at the door at four, which makes it the third feeding in a house that promises two.
- **why it survives the night:** It does not. It is eaten on the way home, and it is the warmest thing this room does.
- **strength:** thin
- **founder question:** Does a consumable belong in this slot at all, or does it belong in the dish pool with a note that it travels? I lean pool, and have marked it thin here for that reason.
- **own-stock ruling, 2026-08-26:** STAGED — one wrapped sandwich per guest.
  Own stock. The routing question stands.

### something off the fruit pile
- **room:** havana  ·  **native or affinity:** native
- **what it is:** A piece of the whole ripe fruit already piled as the centerpiece, taken on the way out for the morning.
- **why it survives the night:** It does not, and it is not pretending to.
- **strength:** thin
- **founder question:** Under the ruling this is arguably a second claim on the existing fruit-centerpiece row rather than a row at all — the pile is the centrepiece and some of it leaves. If the founder agrees, Havana drops to five native, and that is the right number rather than a worse one.
- **own-stock ruling, 2026-08-26:** SECOND CLAIM, NOT STAGED — A DOSE CLAIM on
  a bulk row. The piled whole fruit is bulk, so the order rises and some of it
  leaves. That is the reading the entry itself proposed, and it is right.
- **ruling 2/3, 2026-08-26:** BULK REFINEMENT ADOPTED AS STATED, 2026-08-26.
  The piled whole fruit is bulk. Settled; Havana drops to five native, which
  the entry itself calls the right number.

### a pot's worth of coffee, in paper
- **room:** havana  ·  **native or affinity:** native
- **what it is:** Enough ground coffee for one pot, twisted in paper, from the kit already shipping.
- **why it survives the night:** One morning, and then the paper is in the bin.
- **strength:** thin
- **founder question:** none. Included for count honesty; cut it without argument if the founder wants only what lasts.
- **own-stock ruling, 2026-08-26:** SECOND CLAIM, NOT STAGED — A DOSE CLAIM on
  a bulk row. Coffee is bulk inside the cafecito kit; the kit carries more.
  Not a row of its own.
- **ruling 2/3, 2026-08-26:** BULK REFINEMENT ADOPTED AS STATED, 2026-08-26.
  Coffee is bulk inside the cafecito kit. Settled; still not a row.

**Also claimable here (native elsewhere):** the place card out of its stand
(new-york) · the card for the thing you watched somebody do (new-york) · the
hours, on a card (dolomites) · the slip you drew (las-vegas). Plus the existing
matchbook row, if it gains affinity.

**Cut from this room, deliberately:** a single domino from the double-nine set
— it breaks a shipped kit, and a kit that arrives incomplete for the next party
is a defect wearing a keepsake. Also cut: a small bottle of the rum, on cost and
because the room refuses to measure the night in what is in the glass.

---

## LAS VEGAS, 1960
**8 native, 5 dual-claim.** The second widest, because this room puts things in
writing and plays one game with a fixed stake, and both of those produce marked
paper and small hard objects. Almost every strong item here spent the evening
being used, which is why the dual-claim proportion is what it is.

### the chip you did not spend
- **room:** las-vegas  ·  **native or affinity:** native
- **slots:** the_atmosphere + the_take_home  ·  **why both:** The chips ARE the one game with the one agreed stake — they are the game's instrument for the whole night — and one leaves in a pocket at four in the morning.
- **what it is:** One chip per guest out of the one game with the one agreed stake, kept — spent or unspent, won or not.
- **why it survives the night:** A chip is the most durable small object on this sheet and it turns up in coat pockets for decades. It also carries the room's actual ethic: there was a stake, it was fixed, and this is what is left of it.
- **strength:** strong
- **founder question:** Does the chip carry a mark? Unmarked, it is a chip. Marked, it becomes merchandise printed in advance, which is the failure the bar names. My instinct is unmarked, and that the stake card below is where the writing goes.
- **own-stock ruling, 2026-08-26:** STAGED — chips are per-guest by
  construction and no chip row exists yet. Own stock; dual claim survives.

### the stake, signed
- **room:** las-vegas  ·  **native or affinity:** native
- **slots:** the_atmosphere + the_take_home  ·  **why both:** The stakes card already ships with the dice kit and governs the night from upstairs onward; signed and split into copies, the same card is what each guest walks out holding.
- **what it is:** The agreed number, written on a small card upstairs before anybody goes down, signed by everyone, one copy each.
- **why it survives the night:** It is the room's kindest arrangement in its plainest words with everybody's name under it, and it is the only take-home here that is a document.
- **strength:** strong
- **founder question:** The room's rule is that money is never a joke. Does a signed stake card read as straight, or does printing it turn a kindness into a bit? Check the wording against the room's own line before this ships.
- **own-stock ruling, 2026-08-26:** STAGED — the existing `era
  stakes-suggestion card` is one card. A signed copy each is separate stock
  and a different document. Own row; dual claim survives on it.

### the swizzle stick
- **room:** las-vegas  ·  **native or affinity:** native
- **what it is:** A plastic swizzle out of the drink, one per guest, taken.
- **why it survives the night:** This is the most-kept small object of the era. They are in drawers everywhere sixty years later and nobody can say why they kept them.
- **strength:** strong
- **founder question:** Same question as the chip: unbranded, or marked? The room refuses neon and casino register, so anything printed on it has to be the house's gold rather than a property's name. Single-claim deliberately — a swizzle stirs a drink, which is not really a job, and I would rather not stretch the ruling to cover it.
- **own-stock ruling, 2026-08-26:** STAGED — one swizzle per guest. Own stock.

### the slip you drew
- **room:** las-vegas  ·  **native or affinity:** native — affinity: new-york, new-orleans, dolomites, westhampton-1976, havana
- **AFFINITY LINE MARKED 2026-08-26 (rule 14, not deleted):** this is the row
  that argues "one row here replaces six near-identical ones", and as written
  it replaces none of them: affinity confers no eligibility, so the row
  reaches Vegas only and the other five rooms have nothing. **Verdict: not an
  `Also at:` candidate as written** — the description names the Celebrity 1960
  marquee ticket and the vessel it was drawn from, and shipping that wording
  to New York's The Game 1938 is the failure the verbatim rule exists to stop.
  The dedup instinct is RIGHT and this is the second-best candidate on the
  sheet: a row re-authored room-neutrally — the slip you drew from whatever
  the house was playing, kept — could carry `Also at:` lines to all six. That
  is an authoring pass and a founder call, not an annotation.
- **slots:** the_atmosphere + the_take_home  ·  **why both:** The slips are the game's shipped content, which is where the bank keeps them; the one a guest drew and played in front of people is marked by that and leaves with them.
- **what it is:** The marquee-ticket slip a guest drew from the Celebrity 1960 vessel and played, kept — and, in the affinity rooms, whichever pre-generated slip that room's game hands over.
- **why it survives the night:** It was drawn by chance and played in front of people, so it is evidence rather than a printed card, and one row here replaces six near-identical ones.
- **strength:** strong
- **founder question:** I had this as fair on the grounds that it was printed in advance; the second claim is what answers that, because the object's first life is the game and the take-home is the residue. Native to Vegas because the Celebrity slips are the most object-like of the family — printed as marquee tickets, drawn from a vessel. Is that right, or should the native claim sit with New York's The Game 1938?
- **own-stock ruling, 2026-08-26:** SECOND CLAIM, NOT STAGED — The Celebrity
  1960 deck ships ~80 printed slips — already plural, already per-player.
  Flagged on the way past: keeping them still consumes the kit for the next
  party, which the entry does not say.

### the sixth die
- **room:** las-vegas  ·  **native or affinity:** native
- **slots:** the_atmosphere + the_take_home  ·  **why both:** The dice cups and their five dice are the game and are already in the bank as one; shipping a sixth means the set survives intact and one die goes home having been thrown all night.
- **what it is:** One die out of the leather cup, kept, with the cup shipping six so the set of five survives.
- **why it survives the night:** A single die is the cheapest hard object that reads instantly as one specific night.
- **strength:** strong
- **founder question:** If only one of the chip and the die ships, it is the chip — the chip carries the stake and the die only carries the game. Is that the right order?
- **own-stock ruling, 2026-08-26:** SECOND CLAIM, NOT STAGED — and it is the
  cleanest example on all three sheets of what the ruling asks for. `the cup
  shipping six so the set of five survives` IS the take-home shipping its own
  stock, added to the row that already exists rather than duplicating it.

### the IOU for the late supper
- **room:** las-vegas  ·  **native or affinity:** native
- **slots:** the_atmosphere + the_take_home  ·  **why both:** The form is part of the game's arrangement — whoever is up at midnight buys the late supper — and the filled-in copy is what the person who owes it keeps.
- **what it is:** A small pre-printed form, filled in at the table, kept by whoever owes.
- **why it survives the night:** It is a debt in somebody's handwriting for steak and eggs at four, which is a better object than anything printed in advance.
- **strength:** fair
- **founder question:** Money is never a joke in this room. Written straight and in the fewest words, does an IOU clear that, or is the form itself the joke?
- **own-stock ruling, 2026-08-26:** HELD — the DUAL CLAIM DIES on quantity:
  one person owes, so one form is filled. The own-stock ruling does not reach
  the rest of it — the form could be printed per guest — so it is held rather
  than killed.
- **category-3 ruling, 2026-08-26:** STAGED — CATEGORY 3, `single_artifact`,
  watching `game` for `yields_iou`. HELD's first half is answered — one
  person owes, and that is now a promise rather than a defect. ITS SECOND
  HALF IS A PROBLEM THE RULING DOES NOT SOLVE: `the form could be printed
  per guest`, and a pre-printed form IS printed in advance, which is the one
  thing the founder said this category never is. Staged as she named it,
  flagged as the weakest fit of the twenty.

### the photograph somebody else took
- **room:** las-vegas  ·  **native or affinity:** native
- **what it is:** The souvenir folder photograph — taken at the table by somebody whose job it is, handed over in a card folder before the night ends.
- **why it survives the night:** The folder is the object, not the print; folders stand on shelves and photographs go in drawers.
- **strength:** fair
- **founder question:** Three rooms now have a photo mechanism — Westhampton's Polaroid, Aspen's disposable camera developed a week later, and this. Three is probably one too many. Vegas's is materially the most distinct because somebody else takes it and it arrives in a folder, but the founder should decide whether the catalogue carries three.
- **own-stock ruling, 2026-08-26:** STAGED — one folder photograph per guest.
  Own stock.

### the number off the door
- **room:** las-vegas  ·  **native or affinity:** native
- **what it is:** A numbered fob tag matching the room number on the house note, handed over on arrival.
- **why it survives the night:** Weakly. Nothing happened to it and it opens nothing.
- **strength:** thin
- **founder question:** This is the one item the ruling did NOT rescue, and it is worth saying why: a second claim requires the object to have had a job, and a tag for a door that does not exist never had one. Compare Westhampton's key tag, which does a real job at a real door. Cut it?
- **own-stock ruling, 2026-08-26:** STAGED — SURVIVES THE RULING, which is
  worth saying plainly: it ships one fob per guest, so it has its own stock.
  The ruling is about stock and not about quality; the entry's own `cut it?`
  is untouched and travels with the row.

**Also claimable here (native elsewhere):** the place card out of its stand
(new-york) · the card for the thing you watched somebody do (new-york) · the
hours, on a card (dolomites). Plus two existing bank rows that should take
`the_take_home` as a second claim — the **one stem at each place** and the
**wrapped Pick-a-Number prize** — and the existing matchbook row, if it gains
affinity.

**Cut from this room, deliberately:** a silver dollar, which is what a 1960
Vegas floor actually paid out in and is the best object this room could offer,
at twenty-five dollars and up a guest today. Also cut: a keno card and its
crayon — real, cheap, and it adds a second game to a room whose whole
arrangement is that there is one.

---

## Where the decisions cluster

Five items carry "none" as their founder question: the cloakroom check, the
sunglasses (question stated, but not blocking), the twist of sugared almonds,
the larch sprig, and a pot's worth of coffee. Three of those are marked thin,
which is the correct pattern — a weak item has nothing to resolve.

The questions that block the most content, in order:

1. **Second claim or new row.** The ruling created a test I hit five times and
   could not settle alone: the Westhampton pampas plume, the New Orleans roux
   card, the Dolomites felt square and larch sprig, and the Havana fruit. Each
   is either a per-guest item or a second claim on a row that already exists.
   One principle settles all five, and settling it wrong in the generous
   direction is how a bank gets fat.
2. **Deck integrity** — the New Orleans tarot card and the Dolomites trick card
   both consume a shipped deck. One answer covers both.
3. **The photo mechanism count** — Westhampton, Vegas and Aspen. One decision
   settles two of my rows.
4. **Marked or unmarked** — the Vegas chip and the swizzle stick. The line
   between evidence and merchandise runs straight through both.
5. **Whether a per-guest technique card dilutes the act** — one answer decides
   an item that six rooms claim.
6. **The saint's card** — a decision I should not make.
