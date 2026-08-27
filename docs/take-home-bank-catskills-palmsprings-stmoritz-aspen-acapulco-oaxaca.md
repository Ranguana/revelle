# Take-home bank — proposals for six rooms

**PROPOSAL. Not integrated, not seeded, nothing committed.** Content for the
founder to veto or bless per rule 13. Six rooms, one slot: *the thing they take
home* — the object a GUEST carries out of the party, not a thing the host keeps.

Written against `docs/atmosphere-idea-bank-v1.md` (the 180), the premises in
`src/lib/destinations.ts` (Catskills), the founder drafts in
`docs/voices-draft/` (Acapulco, Oaxaca), the row briefs in
`docs/destination-contrasts.md` (St. Moritz, Aspen, Palm Springs — the three
that still have no prose), and the facet rows in
`data/destination-matrix.json`.

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

| room | slug | items | reached twenty |
|---|---|---|---|
| CATSKILLS, 1963 | `catskills` | 22 | yes |
| PALM SPRINGS, 1965 | `palm-springs-1965` | 15 | **no** |
| ST. MORITZ, 1984 | `st-moritz-1984` | 16 | **no** |
| ASPEN, 1994 | `aspen-1994` | 17 | **no** |
| ACAPULCO, 1959 | `acapulco-1959` | 11 | **no** |
| OAXACA, 1954 | `oaxaca-1954` | 13 | **no** |

**Total 94.** Five of six rooms are short, and each shortfall has a reason
written into its section rather than papered over. The honest headline: the
take-home slot rewards rooms that generate PAPER AND MARKS. Catskills does
nothing else. Acapulco is a spectacle room whose thesis is that the band, the
window and the dancing are the shelf — spectacle does not fit in a handbag, and
that is the whole of its shortfall.

## Four standing notes before the items

**0. AN ITEM MAY CLAIM MORE THAN ONE SLOT, and that is safe.** Recorded here
because a later reader will otherwise assume one row per item is a rule, and
because it changed what this document could propose halfway through writing it.
Founder ruling, on the rock place setting below: *"it can be both."*

`bank_item_slot` is an ELIGIBILITY JOIN (`db/043`, line 431), not a
single-value column on the item. Many rows per item is its normal shape — it
says *this item can fill these slots*, not *this item is this slot*. The
comment above that insert is the exact thing to read: a native claim is a
WHITELIST, and an item carrying any native slot row is eligible only for the
slots it claims. So a second claim WIDENS eligibility and takes nothing away —
which is why this is additive authoring rather than a reclassification. And
`src/lib/selection/fill.ts` keys every placed ingredient into a `used` Set and
skips anything already placed (line 750, `if (state.used.has(key)) continue;`),
so an item eligible for two slots is placed in exactly ONE of them per package.
The obvious worry — a guest's rock counted as both the table and the keepsake
in the same box — cannot happen.

**The consequence for the classifier: its single default is a FLOOR, not a
ceiling.** The trigger writes one claim so that nothing is left unclassified.
A second claim is authoring, added deliberately, one item at a time, with a
reason. Dual claims below are the exception and each says why it is one; they
are marked `slots:` on the item's first line.

**Nine of ninety-four carry a dual claim, and they are all the same shape** —
an object that does a job AT THE TABLE and then leaves with the guest who used
it: the rock (Catskills, founder's), the manila trunk tag and the enamel mug
(Catskills), the anodized tumbler and the Lucite tag (Palm Springs), the place
card (St. Moritz), the tuberose (Acapulco), the copita (Oaxaca), plus the tape
flag (Aspen), which was `thin` as a keepsake and is `fair` as this. Nothing was
retro-fitted beyond that: the other eighty-five are take-home only. If a ninth
appears later it should have to argue the same way.

## Three more standing notes before the items

**1. Some items are the OBJECT HALF of a row that already exists.** The mock
award certificate is announced in the Catskills act; the apology card is sent
in the St. Moritz gesture; the tuberose is already a good at each Acapulco
place. I did not re-author those objects — I claimed the take-home reading of
them, and said so in each founder question. **This needs one ruling, not
fifteen:** may the take-home slot POINT AT an existing bank row, or must it
ship its own stock? Every "object half" question below collapses into that one.

**2. Nothing here is a rental, a hired act, or a host keepsake.** The most
common failure mode by far. The two casualties worth naming: the St. Moritz
colour-tipped fondue fork (the host owns the caquelon set, so the fork goes
back in the drawer) and the Oaxaca molinillo (the host's instrument, and see
note 3).

**3. Food-shaped objects are flagged, not routed.** A sack of dates at the
door, a tablet of drinking chocolate, a twist of worm salt — these are goods
handed over as objects, not dishes landed as courses, so they do not belong in
the dish pool. The routing rules do not cover the case. Founder call.

## How I kept St. Moritz and Aspen apart

They are the catalogue's two most recent years and its two ski rooms, and their
brief in `destination-contrasts.md` is that Aspen must be "the American one:
absorbed rather than ceremonious, unchanged rather than dressed, a house rather
than a hotel." **There are zero affinity links between them in this document.**
That is deliberate, not an oversight.

- **St. Moritz's take-homes are paper and protocol.** The apology card
  received, blank apology stock to take away, the timetable, the dance card,
  the seating plan, the backgammon column. Its material is stationery, and
  every object is about the social arrangement of the room. Formality three,
  worn as irony, produces bureaucracy as a keepsake.
- **Aspen's take-homes are recorded and worn.** Doubles from the camera, the
  dubbed tape, the ticket wired to a zipper, the socks, the sticker, the
  ballot. Its material is film, magnetic tape, a photocopier and gear, and its
  artifacts either arrive by mail a week later or walk out on the guest's body.
- **Two objects could have crossed, and were assigned once each on separate
  grounds.** Recorded music: cassettes existed in both years, but Aspen already
  owns recorded music as its register (the CD wallet, the boombox, the '94
  playlist), so the dub is Aspen's and St. Moritz gets no music object at all.
  Champagne hardware: the cork is Acapulco's, because the loud cork is
  Acapulco's act — so St. Moritz gets the wire cage instead, which is an
  idle-hands object from a long seated dinner and not a punctuation mark.
- **The lift ticket is Aspen's alone.** It is the only ski-specific object in
  either room. St. Moritz's premise is an evening of dress and protocol; its
  guests' skiing is not in the room, and reaching for it would be reaching for
  the country instead of the room (rule 6's logic, applied to objects).
- **Phase does the last of the work.** Aspen is `afternoon` / `clean_stop`, so
  its artifacts leave with the coats in ten minutes or arrive later by post.
  St. Moritz is `evening` / `until_morning`, so its artifacts accumulate across
  a long night and leave at dawn with the eggs.

## How I kept Oaxaca and Acapulco out of souvenir territory

One test, applied to every candidate: **would this object have been in that
room on that night for its own reasons?** Not "would a visitor have bought
one." Everything that survived is one of three kinds.

- **Working ingredients** — the twist of worm salt, the piloncillo and canela,
  the string of dried chiles, the jar pressed on you at the door. These are the
  opposite of souvenirs: they get USED UP in a Brooklyn kitchen in March, which
  is a better kind of survival than a shelf.
- **The vessel that was in her hand** — the clay copita she drank three mezcals
  from, the jícara, the Acapulco coupe. Marked by use, not by printing.
- **Paper made during the afternoon** — the Conquián tally, the recipe in the
  house's hand, the Acapulco request slip and last-song card.

**Explicitly refused, and worth recording so nobody re-proposes them:** the
molinillo (the tourist-shop object par excellence, and the host's instrument
besides); alebrijes; market silver; embroidered textiles other than the working
servilleta that the tortillas actually arrive wrapped in; anything reading
toward Day of the Dead — which is why the marigold is marked `fair` and carries
a question, on association risk alone. At Acapulco: shells and driftwood
(Tahiti owns the conch, Big Sur owns the beach-as-florist, and a shell here is
beachcombing rather than a party), anything bamboo or tiki (already killed in
the bank), and a market-silver anything.

**Acapulco's count is a direct consequence of this test.** Let the market in
and it has thirty items tomorrow. Eleven is what the villa terrace itself
produces, and I would rather report eleven.

---

# CATSKILLS, 1963 — 22 items

The brief was right: this room does not struggle, it overflows. The camp
conceit is a machine for producing markable, winnable, printable objects, and
almost everything below is evidence rather than merchandise. The four that are
merchandise (pennant, patch, pencil, decal) are marked as the weaker kind in
their own lines.

**The first item is the founder's, in her words, and the rest of this section
is calibrated against it.** It is the shape the slot wants: carried out by the
guest, period-plausible, costs almost nothing, and marked with evidence of that
specific table. Items closer to that shape are `strong`. Items that are
merchandise printed in advance before anybody arrived are not, however well
they survive.

### the rock place setting — FOUNDER'S
- **room:** `catskills`  ·  **native or affinity:** native  ·  **slots:** `the_table_set` + `the_take_home`
- **what it is:** *"rock place settings with either twine wrapping or initials of the guest"* — the founder's words, unaltered.
- **why it survives the night:** it is a stone with her initials on it from a specific table, so there is no moment at which throwing it away is the obvious thing to do; it goes on a windowsill and stays there.
- **strength:** strong
- **founder question:** does the twine variant and the initials variant ship as ONE row with a choice at packing, or as two rows? They behave differently — twine is wrapped in advance by the host, initials are written at the table and are therefore the higher-evidence version.
- **own-stock ruling, 2026-08-26:** STAGED — the reference case, and it passes
  for the reason the ruling exists: one rock per guest is per-guest stock, so
  one object honestly holds two claims.

**Two notes on this item rather than a question, because the founder has already
decided both.**

*It claims both slots, and that is her ruling, not the classifier's output.* The
classifier's precedence would have written `the_take_home` alone (destiny beats
surface) and it would not have been wrong — it would have been INCOMPLETE, and
the incompleteness would have been invisible, because a rock filed only as a
keepsake still ships and still reads correctly on the card. The second claim is
authored. See standing note 0 for why one item in two slots cannot double-fill
one package.

*It has a sibling already in the bank, and they are the same instinct.*
Catskills carries `HELLO MY NAME IS tags AS PLACE SETTINGS ONLY` — "host writes
camp names or doesn't; nobody wears anything." The rock is that instinct in a
durable material: a place setting that names the guest and can LEAVE with her,
where the paper tag cannot. They are not competitors and they are not two
ideas. The consequence for the rest of my list, applied below: the paper tag
stays table-set-only, and I have demoted the manila trunk tag accordingly
rather than proposing a third name object for the same place.

### the swim-check tag
- **room:** `catskills`  ·  **native or affinity:** native
- **what it is:** a wooden tag with her camp name on it in grease pencil, hung on a board by the door and flipped when she's in the water, taken off its hook on the way out.
- **why it survives the night:** it is the only object in the room that proves she was in the lake, and it is already shaped like a keepsake — a name on a hook.
- **strength:** strong
- **founder question:** the buddy board only makes sense if the room has water; the premise says "there's a lake if there's a lake" — does the tag ship anyway as a place-marker, or is it lake-conditional the way the pétanque set is outdoor-conditional?
- **own-stock ruling, 2026-08-26:** STAGED — one named tag per guest. Own
  stock.

### the manila trunk tag
- **room:** `catskills`  ·  **native or affinity:** native  ·  **slots:** `the_table_set` + `the_take_home`
- **what it is:** a strung manila shipping tag, camp name printed, her camp name written on by the host, tied to the back of her chair as the place setting and onto a handbag on the way out.
- **why it survives the night:** it is already a luggage tag, so it goes where her bags go and outlives the party by default.
- **strength:** fair
- **founder question:** **demoted from strong once the rock arrived** — the rock does this job in a better material, and three name objects at one place (paper tag, manila tag, rock) is two too many. Is the manila tag the CHEAP ALTERNATIVE to the rock at a tier where stones are impractical, or is it now redundant and cut?
- **own-stock ruling, 2026-08-26:** STAGED — one tag per guest. Own stock;
  dual claim survives.

### the mock award certificate
- **room:** `catskills`  ·  **native or affinity:** native
- **what it is:** the printed certificate with the pre-written category and her name filled in, handed over at dessert when the award is announced.
- **why it survives the night:** it is a document with her name and a joke about her on it, which is the single most bin-proof object a party can produce.
- **strength:** strong
- **founder question:** this is the object half of an act already in the bank — see standing note 1. Also: does it survive if the founder rules the string-lights office as the gesture instead of the awards?
- **own-stock ruling, 2026-08-26:** SECOND CLAIM, NOT STAGED — `mock award
  certificates (pre-written categories + blanks) at dessert` is already a bank
  row and already per-guest. The object half needed a claim, not a row.

### the ribbon
- **room:** `catskills`  ·  **native or affinity:** native
- **what it is:** a pinked-edge satin award ribbon in the standings colours, pinned on when the fake standings are read out.
- **why it survives the night:** ribbons get pinned to corkboards and stay there for a decade; nobody in the history of ribbons has thrown one away the same night.
- **strength:** strong
- **founder question:** none.
- **own-stock ruling, 2026-08-26:** STAGED — one ribbon per guest. Own stock.

### the boondoggle keychain
- **room:** `catskills`  ·  **native or affinity:** native
- **what it is:** plastic lacing in two colours and a keyring, set out in the afternoon; whoever picks it up braids one and keeps it.
- **why it survives the night:** she made it with her hands during the afternoon, badly, and it goes on her keys.
- **strength:** strong
- **founder question:** this is an opt-in craft in the bank's existing sense (Tahiti's lei-making, Nantucket's shucking) — does the take-home slot accept a craft output, or does a take-home have to be handed over rather than made?
- **own-stock ruling, 2026-08-26:** STAGED — lacing and a keyring per guest.
  Own stock.

### the enamel mug
- **room:** `catskills`  ·  **native or affinity:** native  ·  **slots:** `the_table_set` + `the_take_home`
- **what it is:** a speckled enamel mug with her camp name on a strip of adhesive tape, hers from eleven in the morning, hers to take.
- **why it survives the night:** she drank out of it all day and the tape is still on it, which makes it hers rather than a mug.
- **strength:** strong
- **founder question:** enamelware is already committed as goods — is a per-guest mug a cost problem at crowd size, and does it collide with the plates and pot as one enamel object too many?
- **own-stock ruling, 2026-08-26:** STAGED — committed enamelware is plates,
  pot and pitcher; a mug per guest is separate stock. Own row; dual claim
  survives on it.

### the last-day sheet
- **room:** `catskills`  ·  **native or affinity:** native
- **what it is:** a mimeographed sheet, one per guest, passed around the table at dessert for everyone to sign the way a camp yearbook gets signed on the last day.
- **why it survives the night:** it carries the handwriting of everyone who was there, which is the only thing a photograph can't do.
- **strength:** strong
- **founder question:** mimeo purple is exactly 1963 and completely unavailable now — is a printed imitation of a mimeograph honest, or is that the kitsch guard's business?
- **own-stock ruling, 2026-08-26:** STAGED — one sheet per guest. Own stock.

### the marked bingo card
- **room:** `catskills`  ·  **native or affinity:** native
- **what it is:** her own card from the bingo, marked in pencil or with beans, kept because of the near-miss.
- **why it survives the night:** a card one number off a win is a story, and she keeps it to tell it.
- **strength:** fair
- **founder question:** daubers are 1970s, so 1963 is pencil, corn or shutter cards — which does the kit ship, and does the shutter card (reusable, host keeps) kill the take-home entirely?
- **own-stock ruling, 2026-08-26:** SECOND CLAIM, NOT STAGED — conditional:
  conditional on the kit shipping consumable cards. The entry's own
  shutter-card question decides it: a reusable shutter card the host keeps
  would take the claim away again.

### the final standings
- **room:** `catskills`  ·  **native or affinity:** native
- **what it is:** a single printed sheet of the day's invented standings with every camp name on it, handed out when the tummler reads them.
- **why it survives the night:** her name is on it in a rank she didn't earn, and so is everyone else's.
- **strength:** fair
- **founder question:** the standings are read aloud by the host as comedy from the front — does printing them flatten the joke by making it checkable?
- **own-stock ruling, 2026-08-26:** STAGED — one printed sheet per guest. Own
  stock.

### the torn ledger page
- **room:** `catskills`  ·  **native or affinity:** native
- **what it is:** her own page out of the printed camp ledger — the ridiculous pre-filled entries and whatever got written in the blanks — torn out at the end.
- **why it survives the night:** it is the day's only written record, and the blanks were filled in by whoever filled them in.
- **strength:** fair
- **founder question:** does tearing up the ledger cost the host the object she'd otherwise keep, and is the ledger perforated per guest or is this a proposal to redesign it?
- **own-stock ruling, 2026-08-26:** KILLED — `printed Camp [name] ledger` is
  ONE ledger; tearing a page per guest is subtraction from a single article.
  The entry's own question — is the ledger perforated per guest, or is this a
  redesign — is answered: it is a redesign, which is authoring.

### the wooden nickel
- **room:** `catskills`  ·  **native or affinity:** native
- **what it is:** camp canteen scrip — a wooden nickel good for one bug juice, spent or not.
- **why it survives the night:** an unspent token is a small permanent joke, and it lives in a wallet next to the useless foreign coin.
- **strength:** fair
- **founder question:** period-true (resorts and camps both issued scrip) but is it one printed object too many in a room already carrying ledger, tags, certificates, standings and bingo?
- **own-stock ruling, 2026-08-26:** STAGED — one nickel per guest. Own stock.

### the song sheet
- **room:** `catskills`  ·  **native or affinity:** native
- **what it is:** a one-page sheet of camp songs with the corny verses printed out, at each place for the loud part of dinner.
- **why it survives the night:** it folds into a pocket and it is the only evidence of the singing.
- **strength:** fair
- **founder question:** which songs — anything specific risks rights, and inventing camp songs risks preciousness. Is a sheet of genuinely public-domain verses enough?
- **own-stock ruling, 2026-08-26:** STAGED — one sheet at each place. Own
  stock.

### the pencil
- **room:** `catskills`  ·  **native or affinity:** native
- **what it is:** a stamped "Camp [name]" pencil at each place, used to mark the bingo card and sign the last-day sheet.
- **why it survives the night:** it survives because it went in a bag as a pencil, not as a memento — the weakest kind of survival, but real.
- **strength:** fair
- **founder question:** this is merchandise printed in advance and I've marked it so; is a functional favour that becomes evidence by USE worth carrying, or does it dilute the strong items around it?
- **own-stock ruling, 2026-08-26:** STAGED — one pencil at each place. Own
  stock.

### the team bandana
- **room:** `catskills`  ·  **native or affinity:** native
- **what it is:** a cheap cotton bandana in the colour of whichever side the standings put her on, taken from a basket in the afternoon.
- **why it survives the night:** it went in a back pocket and stayed there, and bandanas do not get thrown away.
- **strength:** fair
- **founder question:** costume briefs are killed catalogue-wide — is a thing handed out at the party clearly on the right side of that line, or does it read as the same instruction arriving later?
- **own-stock ruling, 2026-08-26:** STAGED — one bandana per guest from the
  basket. Own stock.

### the postcard, mailed Monday
- **room:** `catskills`  ·  **native or affinity:** native
- **what it is:** a printed camp postcard she writes to herself or to whoever isn't there, dropped in a bowl, stamped and posted by the host on Monday.
- **why it survives the night:** it arrives three days later in her own handwriting, when she has stopped thinking about the party.
- **strength:** fair
- **founder question:** **this breaks a stated exclusivity.** The bank says Aspen is "the only room whose artifact arrives a week after." A letter home is the camp artifact and 1963 is its exact century — but the claim is yours, so: does Aspen keep the mechanism outright, or does it keep only the PHOTOGRAPH arriving late while Catskills gets the letter?
- **own-stock ruling, 2026-08-26:** STAGED — one postcard per guest. Own
  stock. The Aspen exclusivity question is untouched by this ruling.

### the luggage decal
- **room:** `catskills`  ·  **native or affinity:** native
- **what it is:** a gummed camp decal for a suitcase, the kind that got layered on trunks.
- **why it survives the night:** once it is stuck to a suitcase it is there for twenty years, whether she meant it or not.
- **strength:** fair
- **founder question:** merchandise, and marked as such — does a decal read as period-charming or as theme-party supply?
- **own-stock ruling, 2026-08-26:** STAGED — one decal per guest. Own stock.

### the patch
- **room:** `catskills`  ·  **native or affinity:** native
- **what it is:** an embroidered camp patch, the felt-and-chain-stitch kind.
- **why it survives the night:** patches get sewn onto something eventually, and the ones that don't sit in a drawer indefinitely rather than in a bin.
- **strength:** fair
- **founder question:** merchandise printed in advance, the weaker kind — worth it for how well patches actually survive, or cut?
- **own-stock ruling, 2026-08-26:** STAGED — one patch per guest. Own stock.

### the pennant
- **room:** `catskills`  ·  **native or affinity:** native
- **what it is:** a small felt pennant with the camp name, rolled to carry.
- **why it survives the night:** it goes on a wall, which is the highest-survival outcome available and the least earned.
- **strength:** fair
- **founder question:** the kitsch guard on this room is faded-and-mismatched-only — is a crisp new pennant already over that line?
- **own-stock ruling, 2026-08-26:** STAGED — one pennant per guest. Own stock.

### the name tag itself — WITHDRAWN
- **room:** `catskills`  ·  **native or affinity:** native  ·  **slots:** `the_table_set` only
- **what it is:** the HELLO MY NAME IS tag with the camp name the host wrote on it, peeled off the table on the way out.
- **why it survives the night:** it doesn't need to — the rock is this idea in a material that lasts, and proposing the paper version as a keepsake as well is the same idea a third time.
- **strength:** thin
- **founder question:** none. **Kept on the page as a withdrawal, not a proposal** (rule 14 — say what beat it). The tag stays exactly what the bank already says it is: a place setting, table-set-only, nobody wears anything. It gets no take-home claim.
- **own-stock ruling, 2026-08-26:** WITHDRAWN, UNCHANGED — withdrawn by the
  sheet before this ruling and left withdrawn. Nothing to decide; the tag
  stays table-set-only.

### the whistle
- **room:** `catskills`  ·  **native or affinity:** native
- **what it is:** a tin whistle on a braided lanyard, the counsellor's object, handed to whoever ends up running something.
- **why it survives the night:** it doesn't, particularly — it survives on the same terms as any small metal object, which is to say by accident.
- **strength:** thin
- **founder question:** a room full of adults with whistles is either the funniest thing in the catalogue or the most annoying — is that a founder judgement or a real risk?
- **own-stock ruling, 2026-08-26:** STAGED — one whistle per guest. Own stock.
  Thin, unchanged.

### the soap-on-a-rope
- **room:** `catskills`  ·  **native or affinity:** native
- **what it is:** camp-issue soap on a cord, era-exact and completely unserious.
- **why it survives the night:** it gets hung on a hook and used, which is survival of a kind, but there is no evidence of the evening in it at all.
- **strength:** thin
- **founder question:** marked thin on purpose — it is a joke about camp rather than a thing from this camp. Cut?
- **own-stock ruling, 2026-08-26:** STAGED — one bar per guest. Own stock.
  Thin, and the entry's own `cut?` travels with it.

---

# PALM SPRINGS, 1965 — 15 items

**This room does not carry twenty and I will not pretend otherwise.** The bank
itself says the bench is thin and awaiting founder material: three goods and
one gesture is the entire existing inventory. The row compounds it — `bought`
food means no kitchen produces an object, `clean_stop` at sundown means no long
night accumulates paper, and `nothing` on spectacle means nothing is won. What
the room actually owns is the pool, the citrus and the sun, and the fifteen
below are all the objects those three things honestly generate. Six are marked
`fair` for being merchandise and two are `thin`.

### the anodized tumbler in her colour
- **room:** `palm-springs-1965`  ·  **native or affinity:** native  ·  **slots:** `the_table_set` + `the_take_home`
- **what it is:** a jewel-tone anodized aluminium tumbler — the era's poolside glass — handed out one colour per guest, which is how anyone knows whose drink is whose all afternoon, and hers to take.
- **why it survives the night:** it is unbreakable, it is beautiful, and by six o'clock the colour means her.
- **strength:** strong
- **founder question:** poolside glassware is already banked as a good; the proposal here is the colour ASSIGNMENT, not the tumbler. Is per-guest cost defensible at crowd size?
- **own-stock ruling, 2026-08-26:** SECOND CLAIM, NOT STAGED — The entry says
  so itself — `the proposal here is the colour ASSIGNMENT, not the tumbler` —
  and poolside glassware is per-guest by nature. A spec on an existing row,
  not new stock.

### the grapefruit
- **room:** `palm-springs-1965`  ·  **native or affinity:** native
- **what it is:** a whole grapefruit off the citrus bowl, put into her hands at the door as the lights go off.
- **why it survives the night:** it is absurdly heavy in a handbag, which is the joke, and it sits on a counter for a week being looked at.
- **strength:** fair
- **founder question:** citrus flows freely per the bank's exclusivity note, and Oaxaca's orange is a different object for a different reason — do you want them linked as affinity anyway, or kept as two unrelated fruits?
- **own-stock ruling, 2026-08-26:** SECOND CLAIM, NOT STAGED — A DOSE CLAIM on
  a bulk row. The citrus bowl is bulk; the order rises.
- **ruling 2/3, 2026-08-26:** BULK REFINEMENT ADOPTED AS STATED, 2026-08-26.
  The founder adopted the refinement in the words this sheet wrote it in, so
  SECOND CLAIM, NOT STAGED is now a settled verdict rather than a proposal.
  The work is a `bank_item_slot` row on the citrus bowl and a raised order,
  not a bank item.

### the sack of dates
- **room:** `palm-springs-1965`  ·  **native or affinity:** native
- **what it is:** a paper sack of medjools from the bowl — the valley's actual crop, not an import.
- **why it survives the night:** it is the local agricultural fact rather than a resort object, and it gets eaten slowly over a fortnight.
- **strength:** strong
- **founder question:** food-shaped, see standing note 3 — good handed at the door, or does anything edible have to route to the dish pool?
- **own-stock ruling, 2026-08-26:** STAGED — one sack per guest, and dates are
  not in the citrus bowl. Own stock.

### the orange blossom
- **room:** `palm-springs-1965`  ·  **native or affinity:** native
- **what it is:** a sprig of citrus blossom taken off the bowl in the afternoon and worn.
- **why it survives the night:** it dries in a jewellery dish and keeps smelling of the afternoon for a fortnight.
- **strength:** fair
- **founder question:** the catalogue's white flowers are allocated (gardenia/calla to NY, tuberose to Acapulco, tiare to Tahiti) — is citrus blossom free, and is it seasonal enough to need a fallback authored?
- **own-stock ruling, 2026-08-26:** KILLED — The bowl holds fruit, not
  blossom, so there is nothing to take it `off`, and no per-guest quantity is
  declared anywhere in the clause.

### the sunglasses
- **room:** `palm-springs-1965`  ·  **native or affinity:** native
- **what it is:** a tray of cheap sunglasses by the door, take a pair, nobody is checking.
- **why it survives the night:** she wore them for five hours in the sun and they are in the car door pocket forever.
- **strength:** fair
- **founder question:** merchandise, but the only merchandise in this room that gets genuinely USED for the whole party — worth it, or too close to a novelty basket?
- **own-stock ruling, 2026-08-26:** STAGED — a tray per party is per-guest
  stock. Own stock.

### the Lucite tag
- **room:** `palm-springs-1965`  ·  **native or affinity:** native  ·  **slots:** `the_table_set` + `the_take_home`
- **what it is:** a Lucite keyring with her name, doing duty as the place marker at the table before it goes on her keys.
- **why it survives the night:** it is on her keys, which is the highest-frequency object she owns.
- **strength:** fair
- **founder question:** Lucite is 1965-exact and the mechanism is the same as Catskills' manila tag in a completely different material — is that a legitimate register difference or the same idea twice in one catalogue?
- **own-stock ruling, 2026-08-26:** STAGED — one keyring per guest. Own stock;
  dual claim survives.

### the swizzle stick
- **room:** `palm-springs-1965`  ·  **native or affinity:** native
- **what it is:** a printed plastic swizzle in the tumbler, of the kind that people genuinely collected in 1965.
- **why it survives the night:** it ends up in a kitchen drawer, which is where swizzle sticks have always ended up.
- **strength:** fair
- **founder question:** this is the closest thing in my six rooms to New York's matchbooks — same slot, same era-collectible logic. Does that make it a good parallel or a duplication?
- **own-stock ruling, 2026-08-26:** STAGED — one swizzle per guest. Own stock.

### the crate label
- **room:** `palm-springs-1965`  ·  **native or affinity:** native
- **what it is:** a lithographed citrus-crate label from an invented grove, one per guest, in the desert-modern colour register.
- **why it survives the night:** crate labels were already collected as graphics by 1965 and they get framed or pinned rather than binned.
- **strength:** fair
- **founder question:** the grove must be invented, not a real grower's brand — is a fictional label honest, or does a fake antique cross into the theme-supplier territory the brief forbids?
- **own-stock ruling, 2026-08-26:** STAGED — one label per guest. Own stock.

### the pool-rules card
- **room:** `palm-springs-1965`  ·  **native or affinity:** native
- **what it is:** a small printed card of the house's rules for the pool, all of them unenforceable and one of them about the sundown switch-off.
- **why it survives the night:** it is funny, it is small, and it explains the one thing that happened.
- **strength:** fair
- **founder question:** rule 10 — does a card of house rules author AT the guest, or is it clearly the HOST's joke that she is issuing?
- **own-stock ruling, 2026-08-26:** STAGED — one card per guest. Own stock.

### the cocoa butter tin
- **room:** `palm-springs-1965`  ·  **native or affinity:** native
- **what it is:** a small tin of cocoa butter off the circulating tray, era-correct and unbranded.
- **why it survives the night:** it lives in a bag until it is finished.
- **strength:** fair
- **founder question:** monoï is explicitly Tahiti's object — is cocoa butter far enough away, or is any suntan preparation now spoken for?
- **own-stock ruling, 2026-08-26:** STAGED — one tin per guest; the
  circulating tray is the delivery, not the stock. Own stock.

### the signed napkin
- **room:** `palm-springs-1965`  ·  **native or affinity:** native
- **what it is:** a heavy paper cocktail napkin that gets passed around for signatures as a joke about who is here.
- **why it survives the night:** it carries the handwriting of the afternoon, and the joke is on the guest list.
- **strength:** fair
- **founder question:** the room's risk is Westhampton's "questionable guests" — is a mock-autograph card the funny version of that or the cheap version?
- **own-stock ruling, 2026-08-26:** HELD — one napkin passed round is one
  object, and the clause does not say whether every guest keeps one. Held on
  quantity rather than killed, because nothing in the bank is being pointed
  at.
- **category-3 ruling, 2026-08-26:** STAGED — CATEGORY 3, `single_artifact`,
  supplied by the night itself. The HELD verdict above is superseded and
  kept: it held on quantity, and the founder's ruling of 2026-08-26 answers
  quantity by naming a second semantics — one guest gets it, which is a
  different promise rather than a defect. What HELD was right about survives
  as the open half of the founder question: a heavy paper cocktail napkin is
  stock the house could ship, so this is the shakiest of the twenty against
  `nothing printed in advance`.

### the cutting
- **room:** `palm-springs-1965`  ·  **native or affinity:** native
- **what it is:** a rooted cutting from the garden, wrapped in wet newspaper.
- **why it survives the night:** if it lives it is on a windowsill for years, and if it dies it was free.
- **strength:** thin
- **founder question:** marked thin because "party favour plant" is now a wedding cliché — is 1965 far enough upstream of that to rescue it, or is it just twee?
- **own-stock ruling, 2026-08-26:** STAGED — one rooted cutting per guest,
  ordered as such — which is exactly what the Havana cutting does not do. Own
  stock. Thin, unchanged.

### the towel tag
- **room:** `palm-springs-1965`  ·  **native or affinity:** native
- **what it is:** a numbered tag that pairs her with a towel from the stack for the afternoon, kept afterwards.
- **why it survives the night:** barely — it is a cloakroom ticket with no story attached.
- **strength:** thin
- **founder question:** cut? It exists because I wanted a fifteenth, which is exactly the padding the brief warns against, and I would rather flag it than hide it.
- **own-stock ruling, 2026-08-26:** STAGED — one tag per guest. Own stock.
  Thin, and the entry's own `cut?` travels with it.

### the drink flag
- **room:** `palm-springs-1965`  ·  **native or affinity:** native
- **what it is:** a small printed paper flag on a pick, one design per drink on the circulating tray.
- **why it survives the night:** it doesn't reliably; it survives at the same rate as the swizzle and by the same accident.
- **strength:** thin
- **founder question:** parasols and bamboo are already killed at Acapulco as tiki drift — does a paper flag land on the right side of that kill, or is it the same object in a straw hat?
- **own-stock ruling, 2026-08-26:** STAGED — one flag per drink on the tray.
  Own stock. Thin, unchanged.

### the last citrus of the afternoon
- **room:** `palm-springs-1965`  ·  **native or affinity:** native
- **what it is:** whatever is left in the bowl at the sundown switch-off, divided among whoever is still standing there.
- **why it survives the night:** it is the gesture's own leftovers, which makes it the only object in the room that is evidence of the ending rather than of the afternoon.
- **strength:** fair
- **founder question:** is dividing the centrepiece at the door a real host move in this room's register, or does it read as tidying up in front of the guests?
- **own-stock ruling, 2026-08-26:** KILLED — twice over: it is a subtraction
  from the citrus bowl, and `divided among whoever is still standing there` is
  explicitly not per-guest.

---

# ST. MORITZ, 1984 — 16 items

**Short of twenty, and the reason is instructive rather than fatal.** This room
has no prose yet — only the row brief and the bank — so I wrote objects to the
brief: late, dressed, overlapping, a night that does not end when the fire is
banked, and formality three worn as irony. That last clause is the productive
one, and eleven of the sixteen below come out of it: when protocol is the joke,
the paperwork of protocol becomes the keepsake. What the room does NOT have is
a kitchen that hands things over (`bought`), a game that produces winners
beyond backgammon, or any material cheap enough to give away twice — silver is
the register and silver is not a party favour.

### the apology card she received
- **room:** `st-moritz-1984`  ·  **native or affinity:** native
- **what it is:** the pre-written apology card that came across the room attached to a glass of champagne, still in her handbag at dawn.
- **why it survives the night:** somebody chose which apology to send her, and that is the single most re-readable object any of these six rooms produces.
- **strength:** strong
- **founder question:** object half of the gesture, per standing note 1 — and the sharper version: does the take-home ship EXTRA cards so every guest ends up with one, or is it honest that some guests get apologised to and some don't?
- **own-stock ruling, 2026-08-26:** KILLED — as written, and the ruling
  answers the entry's own sharper question. The gesture sends ONE card across
  the room; a keepsake every guest ends up with needs stock, which is the
  blank stock below.

### blank apology stock
- **room:** `st-moritz-1984`  ·  **native or affinity:** native
- **what it is:** three or four unused apology cards from the box, pressed on her at the end for the next time she needs one.
- **why it survives the night:** the joke keeps working after the party, in a desk drawer, for years.
- **strength:** strong
- **founder question:** this is the best answer to the previous question — does it make the received card redundant, or are they two items?
- **own-stock ruling, 2026-08-26:** SECOND CLAIM, NOT STAGED — A DOSE CLAIM on
  a bulk row. `apology-champagne STATIONERY — pre-written apology cards` is
  bulk printed matter; the box carries per-guest blanks and the order rises.
  This is also the answer to the entry above it.
- **ruling 2/3, 2026-08-26:** BULK REFINEMENT ADOPTED AS STATED, 2026-08-26.
  The apology stationery box is bulk printed matter and the order rises.
  Settled; still not a row.

### the mother-of-pearl spoon
- **room:** `st-moritz-1984`  ·  **native or affinity:** native
- **what it is:** her own mother-of-pearl spoon from the caviar service, which nobody admired out loud, taken away in a pocket.
- **why it survives the night:** it is a small correct object she now owns and has no use for, and those never get thrown away.
- **strength:** strong
- **founder question:** per-guest cost on MOP spoons is real but not large — is the room comfortable giving away the one piece of the service that reads as expensive?
- **own-stock ruling, 2026-08-26:** STAGED — the caviar service ships ONE
  spoon, so this cannot be a claim on it. Spoons per guest are their own line.
  Own stock.

### the timetable card
- **room:** `st-moritz-1984`  ·  **native or affinity:** native
- **what it is:** a small printed card of the night's hours — seated at nine, fondue at half eleven, the room changes at one, eggs at half five — which turns out to be accurate.
- **why it survives the night:** it is protocol as comedy, and it is a true record of a night that actually ran to schedule.
- **strength:** strong
- **founder question:** `schedule=posted` is the room's cell and Dolomites also posts times, but Dolomites posts them in a hall and the host keeps the notice — is a per-guest card far enough from that?
- **own-stock ruling, 2026-08-26:** STAGED — one card per guest. Own stock.

### the dance card
- **room:** `st-moritz-1984`  ·  **native or affinity:** native
- **what it is:** a small card on a cord with a pencil, filled in by the people who signed it — nineteenth-century protocol revived in 1984 entirely as a joke.
- **why it survives the night:** it is covered in other people's handwriting and it names who she danced with, which is the whole social record of the night on one card.
- **strength:** strong
- **founder question:** the tweeness risk here is the highest in the document. Formality three worn as irony argues FOR it; a costume-ball reading argues against. Your call, and I could not resolve it.
- **own-stock ruling, 2026-08-26:** STAGED — one card and pencil per guest.
  Own stock.

### the wire cage
- **room:** `st-moritz-1984`  ·  **native or affinity:** affinity: `acapulco-1959`
- **what it is:** the muselet off a champagne bottle, bent into a little chair over the course of a long seated dinner and left standing by her glass.
- **why it survives the night:** she made it with her hands while pretending to listen, it costs nothing, and it goes in a pocket.
- **strength:** strong
- **founder question:** the cork is Acapulco's because the loud cork is Acapulco's act; the cage is here because idle hands need a long seated dinner. Is that split defensible, or is it one champagne artifact stretched across two rooms?
- **own-stock ruling, 2026-08-26:** HELD — one muselet per bottle, and the
  house ships no champagne hardware. Held with the cork family — the own-stock
  ruling does not reach it and the quantity reading does not clear it.
- **category-3 ruling, 2026-08-26:** STAGED — CATEGORY 3, `per_guest`,
  watching `the_drinks` for `yields_muselet`. HELD stands as the reasoning
  it beat: `the house ships no champagne hardware` was read as a defect and
  the ruling reads it as the definition. Verified against a seeded database:
  St. Moritz has NO drink programme in the catalogue at all, so this
  dependency reports BROKEN in its own room until one is written — which is
  the gap reporter doing exactly what she asked it to do.

### the place card
- **room:** `st-moritz-1984`  ·  **native or affinity:** native  ·  **slots:** `the_table_set` + `the_take_home`
- **what it is:** her heavy-stock place card off a table arranged for intrigue.
- **why it survives the night:** the stock alone means it doesn't feel like rubbish, and where she was seated was a decision somebody made about her.
- **strength:** fair
- **founder question:** dual claim on the same logic as the rock — it does a job at the table and then leaves with the guest. But New York already has place cards in stands: does the intrigue framing make this a different object, or is a place card just a place card in every dressed room?
- **own-stock ruling, 2026-08-26:** SECOND CLAIM, NOT STAGED — `heavy-stock
  place cards arranged for intrigue` is already per-guest.

### the seating plan
- **room:** `st-moritz-1984`  ·  **native or affinity:** native
- **what it is:** a printed plan of the table, one per guest, so everyone can see exactly what the host did to them.
- **why it survives the night:** she reads it three times during dinner and takes it home to read again.
- **strength:** fair
- **founder question:** does publishing the arrangement kill the intrigue by making it legible, or is being legible the point of the joke?
- **own-stock ruling, 2026-08-26:** STAGED — one printed plan per guest. Own
  stock.

### the backgammon column
- **room:** `st-moritz-1984`  ·  **native or affinity:** native
- **what it is:** the night's running score sheet, one column per player, torn along the fold so each takes her own.
- **why it survives the night:** it is a number with her name on it, which is what a score is for.
- **strength:** fair
- **founder question:** backgammon is claimed fully for '84 alpine — does the board ship or is it owned-if-present, because a score sheet for a board nobody has is nothing?
- **own-stock ruling, 2026-08-26:** HELD — a score sheet reaches the players,
  not the guests, and the entry's own question about whether the board ships
  at all is unresolved. Held.
- **category-3 ruling, 2026-08-26:** STAGED — CATEGORY 3, `single_artifact`,
  watching `ambient_game` for `yields_score_sheet`. HELD stands: `a score
  sheet reaches the players, not the guests` was the objection, and
  `single_artifact` is the vocabulary that lets the row say so instead of
  being held for saying it. The quantity is the founder's — this entry says
  one column PER PLAYER and she filed it among the one-of-ones, which is a
  rounding the schema records and cannot express.

### the doubling cube
- **room:** `st-moritz-1984`  ·  **native or affinity:** native
- **what it is:** a spare doubling cube given to whoever wins the last game of the night.
- **why it survives the night:** it is a trophy the size of a sugar lump.
- **strength:** fair
- **founder question:** one-of-one rather than per-guest, which the brief warns against — does the take-home slot admit prizes at all, given that Vegas and Amalfi already run wrapped-prize mechanics?
- **own-stock ruling, 2026-08-26:** HELD — one cube to one winner. Not
  per-guest; the ruling does not reach it. Held.
- **category-3 ruling, 2026-08-26:** STAGED — CATEGORY 3, `single_artifact`,
  watching `ambient_game` for `yields_prize`. HELD is superseded outright:
  `not per-guest, the ruling does not reach it` was correct under a
  one-semantics model, and the founder has ruled that a prize is `a
  legitimate take-home shape, arguably a great one`.

### the caviar tin
- **room:** `st-moritz-1984`  ·  **native or affinity:** native
- **what it is:** the emptied tin with its rubber band, given to whoever was rude enough to ask what it was.
- **why it survives the night:** it is a small perfect object and a small permanent insult, together.
- **strength:** fair
- **founder question:** one tin, one guest, and it depends on somebody actually asking — is a take-home allowed to be conditional on the room's behaviour?
- **own-stock ruling, 2026-08-26:** HELD — one tin to one guest, and
  conditional on somebody asking. Held.
- **category-3 ruling, 2026-08-26:** STAGED — CATEGORY 3, `single_artifact`,
  watching `the_appetizer` for `yields_empty_container`. HELD stands on its
  second leg and is answered on its first: one tin to one guest is now
  sayable, and `conditional on somebody asking` is still an open founder
  question — the dependency machinery models conditional-on-the-COURSE and
  has nothing to say about conditional-on-the-ROOM'S-BEHAVIOUR.

### the champagne swizzle
- **room:** `st-moritz-1984`  ·  **native or affinity:** native
- **what it is:** a small stirrer for killing the bubbles, which is a genuine period-luxury object and a genuinely absurd one.
- **why it survives the night:** it is inexplicable, and inexplicable objects are kept.
- **strength:** fair
- **founder question:** too obscure to read as anything at all without the card explaining it? A take-home that needs a footnote may not be a take-home.
- **own-stock ruling, 2026-08-26:** STAGED — one stirrer per guest. Own stock.

### the Grand Marnier miniature
- **room:** `st-moritz-1984`  ·  **native or affinity:** native
- **what it is:** a miniature of the aged closer, handed over with the coats.
- **why it survives the night:** it sits at the back of a cupboard for years, which is survival, and it is the taste of the last hour.
- **strength:** fair
- **founder question:** shipping alcohol is a product-level problem, not a taste one — does the catalogue ship any liquid at all, or does the drink programme handle every drop?
- **own-stock ruling, 2026-08-26:** STAGED — one miniature per guest. Own
  stock.

### the pocket torch
- **room:** `st-moritz-1984`  ·  **native or affinity:** native
- **what it is:** a small torch handed out at dawn for the walk back.
- **why it survives the night:** it is useful, which is the least interesting reason anything survives.
- **strength:** thin
- **founder question:** generic — it would work in any late room in the catalogue, which by rule 6's logic means it belongs to none of them. Cut?
- **own-stock ruling, 2026-08-26:** STAGED — one torch per guest. Own stock.
  Thin, and the entry's own `cut?` travels with it.

### the black-and-white matchbox
- **room:** `st-moritz-1984`  ·  **native or affinity:** native
- **what it is:** a plain black or white matchbox in the room's two-colour palette, on the table for the tapers.
- **why it survives the night:** it goes in a coat pocket and turns up in March.
- **strength:** thin
- **founder question:** **this is New York's mechanism outright** — matchbooks are one of the catalogue's only two existing take-homes and the coat-pocket-in-March line is theirs. I've marked it thin for that reason and I would cut it. Included only so the collision is on the record.
- **own-stock ruling, 2026-08-26:** STAGED — SURVIVES THE RULING — one
  matchbox per guest is its own stock. What kills it, if anything kills it, is
  the New York exclusivity the entry names itself, and that question travels
  with the row.

### the fondue fork
- **room:** `st-moritz-1984`  ·  **native or affinity:** native
- **what it is:** her colour-tipped fork from the chocolate caquelon.
- **why it survives the night:** it doesn't — it goes back in the box with the set.
- **strength:** thin
- **founder question:** **fails the bar and is listed as a warning, not a proposal.** The forks come with the caquelon and the host keeps them. If the founder wants a fondue object, it has to be something bought loose per guest, and I could not find one worth proposing.
- **own-stock ruling, 2026-08-26:** KILLED — not a proposal, and killed
  anyway: the forks come with the caquelon and the host keeps them, which is
  single stock in the plainest form on the sheet.

---

# ASPEN, 1994 — 17 items

**Short of twenty, and the room's own doctrine is the reason.** No florals, no
candles, every light on, the anti-glassware room, `plain` dress and `cooked`
food and a `clean_stop`. That is a deliberately object-poor world — the bank
built it as the catalogue's austerity room against St. Moritz's silver — and a
take-home slot cannot import objects the room has ruled out. What it does have
is 1994's recording technology, which is unusually generous: film that develops
later, tape that dubs, a photocopier, and a Sharpie. Nine of the seventeen come
from that.

The 1994 trap runs backwards from the other rooms: it must not read
generic-modern. Everything below is dated by its FORMAT — double prints,
magnetic tape, wire-loop tickets, photocopies — not by a brand name.

### the doubles
- **room:** `aspen-1994`  ·  **native or affinity:** native
- **what it is:** the second set of prints from the disposable camera, mailed to each guest a week later, because 1994 photo processing gave you two of everything whether you wanted them or not.
- **why it survives the night:** she is in some of them and has no idea which until they arrive.
- **strength:** strong
- **founder question:** the camera is banked as the good and the late arrival as the room's claim — the double-print mechanism is what turns a host keepsake into a per-guest take-home. Does the package cover processing and postage, and who addresses the envelopes?
- **own-stock ruling, 2026-08-26:** STAGED — a second set of prints per guest.
  Own stock.

### the dub
- **room:** `aspen-1994`  ·  **native or affinity:** native
- **what it is:** a cassette copy of the afternoon's tape with the running order written out by hand on the J-card, dubbed on a dual deck and posted with the photographs.
- **why it survives the night:** the handwritten J-card is the part that lasts; people keep tapes they can no longer play for exactly that reason.
- **strength:** strong
- **founder question:** rights on a compiled tape are a real problem the bank has already met with the '94 playlist — does the house ship the J-card and the tape blank, with the host doing the dubbing?
- **own-stock ruling, 2026-08-26:** STAGED — one cassette per guest. Own
  stock.

### the lift ticket
- **room:** `aspen-1994`  ·  **native or affinity:** native
- **what it is:** a printed ticket on a wire loop, twisted onto her coat zipper at the door, from a mountain that does not exist.
- **why it survives the night:** 1994 left them on all season as a boast, layered one over another, and she will not cut it off.
- **strength:** strong
- **founder question:** **the only ski-specific object in either ski room and deliberately not shared with St. Moritz** — see the separation account above. Separate worry: is an invented mountain honest, given that a real one would be impersonation?
- **own-stock ruling, 2026-08-26:** STAGED — one ticket per guest. Own stock.

### the ballot
- **room:** `aspen-1994`  ·  **native or affinity:** native
- **what it is:** a photocopied ballot for the story competition, ranking the falls, filled in and kept.
- **why it survives the night:** it is her judgement of everyone else's worst afternoon, in her own writing.
- **strength:** strong
- **founder question:** the story competition currently resolves by acclaim (worst fall earns the poured round) — does adding ballots make it a game with rules, which is a different bank class?
- **own-stock ruling, 2026-08-26:** STAGED — one photocopied ballot per guest.
  Own stock.

### the socks
- **room:** `aspen-1994`  ·  **native or affinity:** native
- **what it is:** a pair of thick wool socks out of the gear pile, worn all afternoon and not given back.
- **why it survives the night:** they are the warmest socks she owns now, and they were somebody else's.
- **strength:** strong
- **founder question:** the gear pile is banked as "heaped, grabbed, nobody arranged" — does seeding it with giveaway socks arrange it, and does that break the pile's whole point?
- **own-stock ruling, 2026-08-26:** STAGED — socks are a separate article from
  the throws heaped in the gear pile, so this is its own per-guest line rather
  than a subtraction. Own stock; the entry's worry about arranging the pile is
  the live question.

### the recipe, photocopied
- **room:** `aspen-1994`  ·  **native or affinity:** affinity: `oaxaca-1954`
- **what it is:** what is in the pot, in the host's handwriting, run off on a photocopier for whoever asked.
- **why it survives the night:** it goes on a fridge and gets cooked from.
- **strength:** fair
- **founder question:** proposed native to Oaxaca and affinity here, per the affinity rule — but the registers are genuinely different (a standing authority handing something down versus a Post-it run through a copier). Is that one object in two registers, or two objects?
- **own-stock ruling, 2026-08-26:** AFFINITY — rides on the staged Oaxaca
  recipe row as its affinity claim. No stock of its own.
- **RULING WITHDRAWN 2026-08-26 (rule 14 — the AFFINITY ruling above is kept,
  not deleted).** Two things were wrong with it and only one is mechanical.

  The mechanical one:

  > **affinity re-weights scoring for already-eligible candidates; it never
  > confers eligibility — sharing requires a second native row.**

  `claimEligibility` (`src/lib/selection/occasion.ts`) reads a `native` row as
  a whitelist. An affinity row on the Oaxaca recipe would have left that row
  eligible at Oaxaca ONLY and put nothing whatever in Aspen — the ruling was
  inert as written. Nothing was ever staged from it: verified against a
  database built from the committed chain plus the full seeder chain,
  `select count(*) from bank_item_world where native = false` returns 0.

  The instrument that WOULD have made it real now exists — an `Also at:` line
  in `docs/atmosphere-idea-bank-v1.md`, seeding a second `native = true` row —
  **and this row does not get one, on its merits.** An `Also at:` row shares
  the whole item VERBATIM, name and description both. The Oaxaca row is *"the
  recipe written out plainly, the way a kitchen that has done this every Sunday
  since before she was born would write it: no measurements where none are
  needed."* That sentence is Oaxacan and 1954; it arrives in a 1994 Colorado
  ski condo still being both. And the founder question on both rows already
  said so — *"the registers are genuinely different (a standing authority
  handing something down versus a Post-it run through a copier). Is that one
  object in two registers, or two objects?"* Two objects.

  So: not rescued. If Aspen is to have what is in the pot on a photocopier, it
  is its own row with its own words and its own founder call — new stock, an
  authoring pass, not a line on somebody else's row.

### the sticker
- **room:** `aspen-1994`  ·  **native or affinity:** native
- **what it is:** a die-cut sticker for the party, from the sheet by the door.
- **why it survives the night:** 1994 put stickers on everything that held still, and once applied a sticker survives as long as its host object.
- **strength:** fair
- **founder question:** merchandise printed in advance and marked so — but sticker culture is genuinely 1994-exact. In or out?
- **own-stock ruling, 2026-08-26:** STAGED — one sticker per guest off the
  sheet. Own stock.

### the koozie
- **room:** `aspen-1994`  ·  **native or affinity:** native
- **what it is:** a foam koozie, completely without dignity, which is the point in the anti-glassware room.
- **why it survives the night:** koozies migrate to cars and cabins and never leave.
- **strength:** fair
- **founder question:** does the room's anti-glamour thesis extend to actively cheap objects, or is there a line between UNFUSSY and BAD that a koozie crosses?
- **own-stock ruling, 2026-08-26:** STAGED — one koozie per guest. Own stock.

### the shot glass
- **room:** `aspen-1994`  ·  **native or affinity:** native
- **what it is:** her glass from the round poured at the story's peak.
- **why it survives the night:** it is small, it is glass, and it was part of the one thing the whole room stopped to do.
- **strength:** fair
- **founder question:** this contradicts the room's own doctrine — "mismatched pint glasses and whatever mugs exist" means matching shot glasses are the wrong object here. Does the round need a vessel that ISN'T uniform, and if so how do you give it away?
- **own-stock ruling, 2026-08-26:** STAGED — one glass per guest. Own stock.
  The doctrine contradiction the entry names is untouched.

### the carabiner
- **room:** `aspen-1994`  ·  **native or affinity:** native
- **what it is:** an anodized carabiner keyring off a bowl by the door.
- **why it survives the night:** it goes on a bag loop and stays there for years.
- **strength:** fair
- **founder question:** era-correct and cheap, but it is also the most generic object in this room — does it read 1994 or does it read any-time-since?
- **own-stock ruling, 2026-08-26:** STAGED — one carabiner per guest. Own
  stock.

### the zinc
- **room:** `aspen-1994`  ·  **native or affinity:** native
- **what it is:** a tube of neon zinc, worn on the nose all afternoon by whoever was going to wear it.
- **why it survives the night:** it lives in a coat pocket until it dries out.
- **strength:** fair
- **founder question:** neon zinc is dead-on for 1994 and edges toward costume — is a thing offered rather than instructed clearly outside the killed costume brief?
- **own-stock ruling, 2026-08-26:** STAGED — one tube per guest. Own stock.

### the trail map
- **room:** `aspen-1994`  ·  **native or affinity:** native
- **what it is:** a folded paper trail map of the invented mountain with the afternoon's route drawn on in biro.
- **why it survives the night:** the biro line is a story, and folded paper maps get kept in glove boxes.
- **strength:** fair
- **founder question:** the invented mountain has to carry both this and the lift ticket — is one fictional resort across two objects charming, or is it a theme starting to build itself?
- **own-stock ruling, 2026-08-26:** STAGED — one map per guest. Own stock.

### the film canister
- **room:** `aspen-1994`  ·  **native or affinity:** native
- **what it is:** the little black 35mm canister the exposed roll came out of, used to carry something small home in.
- **why it survives the night:** everyone kept these for everything, and nobody has ever decided to.
- **strength:** fair
- **founder question:** it only exists if the camera is developed by the host, which happens after the guests leave — can a take-home be handed over at all, or does it have to go in the post with the doubles?
- **own-stock ruling, 2026-08-26:** HELD — one canister per roll, and the
  camera is one. Not per-guest. Held.
- **category-3 ruling, 2026-08-26:** STAGED — CATEGORY 3, `single_artifact`,
  watching `the_atmosphere` for `yields_empty_container`. HELD stands as the
  reasoning it beat: `one canister per roll, and the camera is one. Not
  per-guest` is precisely the observation the second semantics exists to
  record.

### the trophy
- **room:** `aspen-1994`  ·  **native or affinity:** native
- **what it is:** one ridiculous object — a snapped pole basket, a taped goggle — handed to whoever won the worst-fall story and kept until somebody falls harder.
- **why it survives the night:** it is a trophy, and it comes with an obligation to bring it back.
- **strength:** fair
- **founder question:** one-of-one, and it also implies a NEXT party, which is a claim about recurrence the product may not want to make. Does it?
- **own-stock ruling, 2026-08-26:** HELD — one-of-one by design. Not
  per-guest. Held.
- **category-3 ruling, 2026-08-26:** STAGED — CATEGORY 3, `single_artifact`,
  watching `game` for `yields_prize`. HELD superseded on the same ground as
  the doubling cube. The recurrence question in the entry is untouched by
  the ruling and stays open.

### the tape flag
- **room:** `aspen-1994`  ·  **native or affinity:** native  ·  **slots:** `the_table_set` + `the_take_home`
- **what it is:** the strip of masking tape with her name on it in Sharpie, which is how anyone knew which mismatched glass was hers, peeled off at the end.
- **why it survives the night:** on its own it barely does — but it is the only place setting this room can have, and a name written at the table is the same evidence the rock carries.
- **strength:** fair
- **founder question:** **upgraded from thin once dual claims were available** — as a keepsake it is nothing, as the anti-glassware room's answer to a place setting it is exactly right, and the founder's rock is the proof that those can be one row. Does the package ship anything for this at all, or is masking tape and a Sharpie simply what the host already has in a drawer — in which case the row is a scene-card note, not a good?
- **own-stock ruling, 2026-08-26:** HELD — the DUAL CLAIM DIES and the entry
  killed it itself: `is masking tape and a Sharpie simply what the host
  already has in a drawer — in which case the row is a scene-card note, not a
  good?` If nothing ships there is no stock, and a take-home with no stock is
  what this ruling forbids.
- **category-3 ruling, 2026-08-26:** STAGED — CATEGORY 3, `per_guest`,
  supplied by the night itself. THIS ONE REVERSES. HELD killed it with `if
  nothing ships there is no stock, and a take-home with no stock is what
  this ruling forbids` — and the founder's third category is the case where
  nothing ships BY DESIGN. The dual claim stays dead: the take-home reading
  survives on its own and nothing here revives `the_table_set`.

### the bottle cap
- **room:** `aspen-1994`  ·  **native or affinity:** native
- **what it is:** a cap off the afternoon's beer with the date scratched into the cork liner.
- **why it survives the night:** it is free and it is small, which is the entire argument for it.
- **strength:** thin
- **founder question:** cut? It is here because seventeen felt better than sixteen, which is the wrong reason, and I would rather say so.
- **own-stock ruling, 2026-08-26:** HELD — per bottle, not per guest, and
  nothing shipped. Held. Thin, unchanged.
- **category-3 ruling, 2026-08-26:** STAGED — CATEGORY 3, `per_guest`,
  watching `the_drinks` for `yields_bottle_cap`. HELD stands and so does
  `thin, unchanged` — the category admits it, the sheet's own argument
  against it is untouched, and the FOUNDER-PENDING question carries the
  sheet's `cut it` verbatim. Aspen likewise has no drink programme, so this
  reports BROKEN in its own room.

### the photocopied playlist
- **room:** `aspen-1994`  ·  **native or affinity:** native
- **what it is:** the running order alone, without the tape, run off for people who won't wait for the post.
- **why it survives the night:** it doesn't much — it is the dub with the good part removed.
- **strength:** thin
- **founder question:** does this exist at all, or is it just the J-card doing double duty? I lean toward cutting it into the dub.
- **own-stock ruling, 2026-08-26:** STAGED — one photocopy per guest. Own
  stock. Thin, and the entry's own lean toward cutting it travels with the
  row.

---

# ACAPULCO, 1959 — 11 items

**This room will not carry twenty, and the shortfall is structural rather than
a failure of effort.** Its own bank line says it: *"GAMES: none — the band, the
window, and the dancing are the shelf."* A room whose thesis is that the
spectacle IS the keepsake has, by construction, almost nothing in a handbag.
Everything else it owns is either consumed (champagne, sparklers, the tapers),
host-kept (the silver tray, the long white cloth, the hurricanes), or served
(the platters up from town, and nobody in this house has seen the kitchen).
`bought` food means no kitchen hands anything over; minimum protocol means no
paperwork; `spectacle=performed` means the good part happens in the air.

Eleven is what the terrace itself produces once the market is refused. I would
rather report eleven honest ones than reach for silver bracelets, and the
refused list is in the souvenir account above.

### the tuberose
- **room:** `acapulco-1959`  ·  **native or affinity:** native  ·  **slots:** `the_table_set` + `the_take_home`
- **what it is:** the single stem from her own place, taken away at the end.
- **why it survives the night:** it goes in a glass by the bed and scents the whole room for two days, which is longer than most objects manage.
- **strength:** strong
- **founder question:** object half of an existing good, per standing note 1 — and does a flower count as surviving, given that its survival is measured in days rather than years?
- **own-stock ruling, 2026-08-26:** SECOND CLAIM, NOT STAGED — the cleanest
  survivor on this sheet. `tuberose — one stem at each place` is already
  per-guest, so the object half needed a claim and never needed a row.

### the spare sparklers
- **room:** `acapulco-1959`  ·  **native or affinity:** native
- **what it is:** a pair of unlit long-burn gold sparklers from the kit, sent home with her for her own window.
- **why it survives the night:** it is the room's signature gesture, unspent, waiting in a drawer for a night that deserves it.
- **strength:** strong
- **founder question:** the NYC-legality flag is already on the sparkler card — does sending guests home with them multiply that problem across five boroughs, or is the card enough?
- **own-stock ruling, 2026-08-26:** SECOND CLAIM, NOT STAGED — A DOSE CLAIM on
  a bulk row. Sparklers are bulk inside the kit; the kit ships more. The
  NYC-legality flag rides with the claim and gets louder, which is the entry's
  own question.
- **ruling 2/3, 2026-08-26:** BULK REFINEMENT ADOPTED AS STATED, 2026-08-26.
  Sparklers are bulk inside the kit and the kit ships more. Settled; still
  not a row, and the NYC-legality flag rides with the claim and gets louder.

### the spent wire
- **room:** `acapulco-1959`  ·  **native or affinity:** native
- **what it is:** the sparkler she held at dusk, burnt down to bare wire, dropped in a handbag rather than the sand bowl.
- **why it survives the night:** it is pure evidence of the one fixed moment in the night, and it costs nothing.
- **strength:** fair
- **founder question:** honestly — is a burnt wire a keepsake or is it litter that a sentimental person kept for a week? I could not decide, and I have marked it fair rather than strong for that reason.
- **own-stock ruling, 2026-08-26:** SECOND CLAIM, NOT STAGED — Every guest is
  handed a sparkler already, so the burnt wire is a disposition of per-guest
  stock that exists. Nothing new is ordered.

### the coupe
- **room:** `acapulco-1959`  ·  **native or affinity:** native
- **what it is:** the coupe she drank from and ate the ceviche out of, taken home.
- **why it survives the night:** it is on a shelf, and it is the object the bank says dates the room.
- **strength:** fair
- **founder question:** cost per guest at crowd size is the whole question. Coupes are cheap in bulk but not free, and "the glass dates the room" is an argument for keeping the set intact as much as for giving it away.
- **own-stock ruling, 2026-08-26:** SECOND CLAIM, NOT STAGED — `champagne
  COUPES` is per-guest by nature; giving them away is a quantity decision on
  that row, which is the entry's own cost question.

### the marked cork
- **room:** `acapulco-1959`  ·  **native or affinity:** native
- **what it is:** the cork off the loud opening, with the date on it in pencil, kept by whoever caught it.
- **why it survives the night:** corks are kept by default, and this one is attached to the loudest noise of the evening.
- **strength:** fair
- **founder question:** the cork is native here because the cork is this room's act, and St. Moritz gets the wire cage instead. Is that split right? Also: one cork per bottle, so this is not per-guest.
- **own-stock ruling, 2026-08-26:** HELD — the entry says it itself — `one
  cork per bottle, so this is not per-guest`. Held with the rest of the cork
  family.
- **category-3 ruling, 2026-08-26:** STAGED — CATEGORY 3, `per_guest`,
  watching `the_drinks` for `yields_cork`. HELD stands as the reasoning it
  beat, and the founder named its residue herself: `roughly per-guest, with
  Acapulco's caveat that the ratio is per-bottle, not per-head`. `per_guest`
  is therefore ROUNDER THAN THIS ENTRY IS, and the caveat lives in a note
  nothing reads.

### the request slip
- **room:** `acapulco-1959`  ·  **native or affinity:** native
- **what it is:** the slip she wrote a song on and handed up to the band, taken back with the band's tick on it at the end.
- **why it survives the night:** it is proof that the thing she asked for got played.
- **strength:** fair
- **founder question:** the room's games line is "none, on purpose" — is a request slip band infrastructure, or is it a game arriving through the back door?
- **own-stock ruling, 2026-08-26:** STAGED — one slip per guest. Own stock.

### the last-song card
- **room:** `acapulco-1959`  ·  **native or affinity:** native
- **what it is:** a small card carrying the first song, named by the host at the start, with the last song written in by hand as people leave.
- **why it survives the night:** it brackets the whole night on one piece of card in two different hands.
- **strength:** fair
- **founder question:** it requires the host to write the same line thirty times at five in the morning when the boats are going out — is that a real host act or a chore I have invented for her?
- **own-stock ruling, 2026-08-26:** STAGED — one card per guest. Own stock.

### the wire cage, kept
- **room:** `acapulco-1959`  ·  **native or affinity:** affinity: `st-moritz-1984`
- **what it is:** the muselet from a bottle, taken as it comes off.
- **why it survives the night:** small metal, pocket, done.
- **strength:** fair
- **founder question:** listed as affinity to make the mechanism visible — the cage is proposed native to St. Moritz where a long seated dinner gives idle hands time to bend it into something. Is a plain unbent cage here worth a separate row at all, or should Acapulco simply hold the cork?
- **own-stock ruling, 2026-08-26:** HELD — held with its St. Moritz parent,
  for the same reason.
- **category-3 ruling, 2026-08-26:** STAGED — CATEGORY 3, `per_guest`,
  watching `the_drinks` for `yields_muselet`, with its St. Moritz parent and
  for the same reason. Acapulco has no drink programme in the catalogue
  either.

### the white taper
- **room:** `acapulco-1959`  ·  **native or affinity:** native
- **what it is:** an unburnt taper from the pair on the table, sent home to be lit at her own window.
- **why it survives the night:** it gets lit eventually, on a night she decides is worth it.
- **strength:** thin
- **founder question:** this is the sparkler's argument, weaker, and the room has already got the sparkler. Cut?
- **own-stock ruling, 2026-08-26:** KILLED — `tall white tapers in
  silver/glass` is a pair on the table, not per-guest stock, and no per-guest
  quantity is declared.

### the coaster she wrote on
- **room:** `acapulco-1959`  ·  **native or affinity:** native
- **what it is:** a heavy paper coaster off the threshold tray with something written on it during the night by somebody.
- **why it survives the night:** depends entirely on what got written, which is not something the house can supply.
- **strength:** thin
- **founder question:** the slips rule says any object with player-generated content ships pre-generated and the member never fills a blank. Does that rule reach a coaster, and does it kill this?
- **own-stock ruling, 2026-08-26:** STAGED — heavy paper coasters are
  per-guest consumable stock the house would order. Own stock. Thin, and the
  slips-rule question travels with it.

### the tin of the evening's cigarettes
- **room:** `acapulco-1959`  ·  **native or affinity:** native
- **what it is:** a small flat tin from the table, emptied and kept.
- **why it survives the night:** tins survive better than what is in them.
- **strength:** thin
- **founder question:** ashtray-era goods were killed at New York with matchbooks surviving only as favours — does that kill travel, and if so is this out on arrival? I suspect it is, and have marked it thin accordingly.
- **own-stock ruling, 2026-08-26:** ALREADY STRUCK — already struck:
  `ashtray-era goods` were KILLED at New York with matchbooks surviving as
  favours only, and a kill is a decision. The entry suspected as much. The
  own-stock ruling never has to reach it.

---

# OAXACA, 1954 — 13 items

**Short of twenty, and the shortfall is the price of the souvenir test.** Every
candidate this room generates easily — the molinillo, the alebrije, the market
textile, the little clay figure — fails on the question of whether it would
have been in that house on that Sunday for its own reasons. What passes is
narrow and, I think, better: working ingredients from a kitchen that has been
going since yesterday, the vessel that was in her hand, and paper made during
the afternoon.

One more constraint shapes the list: the voice doc carries a live founder edit
that **mole is one dish and not the room's identity**, so nothing below leans
on mole. The jar sent home is written generally, as the house's standing
gesture rather than as a mole delivery mechanism.

### the twist of worm salt
- **room:** `oaxaca-1954`  ·  **native or affinity:** native
- **what it is:** a spoonful of sal de gusano folded into a paper twist off the mezcal plate, because she liked it and the house does not explain itself.
- **why it survives the night:** it gets used on an orange in March, which is a better survival than a shelf — the object completes itself somewhere else, months later.
- **strength:** strong
- **founder question:** none. This is the item I am most confident of in the whole document.
- **own-stock ruling, 2026-08-26:** STAGED — one paper twist per guest; the
  salt is bulk and the twist is the article. Own stock.

### the copita
- **room:** `oaxaca-1954`  ·  **native or affinity:** native  ·  **slots:** `the_table_set` + `the_take_home`
- **what it is:** the small clay copita she drank the three mezcals from, hers to take.
- **why it survives the night:** it is marked by use rather than by printing, and clay copitas cost pennies.
- **strength:** strong
- **founder question:** object half of an existing good, per standing note 1 — and does a copita read as a working vessel or has "little clay cup" already been claimed by every mezcal bar since?
- **own-stock ruling, 2026-08-26:** SECOND CLAIM, NOT STAGED — `stoneware
  copitas` are per-guest by nature — one in her hand for three mezcals is
  exactly the shape the ruling permits.

### the jar sent home
- **room:** `oaxaca-1954`  ·  **native or affinity:** native
- **what it is:** a jar of whatever the kitchen has been cooking since yesterday, pressed on her at the door whether she resists or not.
- **why it survives the night:** it is the house's standing authority in object form — you are not asked, you are given — and it gets eaten on Tuesday.
- **strength:** strong
- **founder question:** how does this ship? The host cooks it, so the package supplies the jar and the label, not the contents — is a take-home allowed to be a container the host fills, or does the slot require the house to supply the whole object?
- **own-stock ruling, 2026-08-26:** STAGED — one jar and label per guest,
  house-supplied and host-filled. Own stock. The entry's question about who
  supplies the contents stands.

### the string of chiles
- **room:** `oaxaca-1954`  ·  **native or affinity:** native
- **what it is:** a twist of dried chiles off the kitchen string.
- **why it survives the night:** it hangs in her kitchen for a year and gets used down slowly.
- **strength:** strong
- **founder question:** which chiles — pasilla de Oaxaca is the regional one and is genuinely hard to source; is a substitution honest, or does it quietly become "generic Mexican dried chile" and fail rule 6?
- **own-stock ruling, 2026-08-26:** STAGED — one twist per guest; the kitchen
  string is not a bank row. Own stock.

### the piloncillo and canela
- **room:** `oaxaca-1954`  ·  **native or affinity:** native
- **what it is:** a cone of piloncillo and a stick of true canela tied in paper — the two things that make the café de olla she drank at dusk against the wall.
- **why it survives the night:** she can make the thing she drank, which is a different and better promise than a memento.
- **strength:** strong
- **founder question:** food-shaped, per standing note 3 — and does giving away the ingredients undercut the drink programme's own café de olla entry, or complete it?
- **own-stock ruling, 2026-08-26:** STAGED — one cone and one stick per guest,
  tied in paper. Own stock.

### the recipe in the house's hand
- **room:** `oaxaca-1954`  ·  **native or affinity:** native (affinity: `aspen-1994`)
- **what it is:** the recipe written out plainly, the way a kitchen that has done this every Sunday since before she was born would write it: no measurements where none are needed.
- **why it survives the night:** handwriting survives, and this one settles an argument won years ago.
- **strength:** strong
- **founder question:** proposed native here and affinity to Aspen, per the affinity rule — the two registers really are different (handed down versus photocopied). Is one row with two claims right, or two rows?
- **own-stock ruling, 2026-08-26:** STAGED — one recipe per guest, and it
  carries the Aspen photocopy as its affinity. Own stock.
- **AMENDED 2026-08-26 (rule 14 — the ruling above is kept, not deleted):** the
  second half of it does nothing. Affinity re-weights scoring for
  already-eligible candidates; it never confers eligibility — sharing requires
  a second native row — so "carries the Aspen photocopy as its affinity" put
  nothing in Aspen. It was NOT re-authored as an `Also at:` line either, and
  that is a judgement rather than an oversight: an `Also at:` row travels
  verbatim, and this row's words are a Oaxacan kitchen's. The Aspen ruling is
  withdrawn in that sheet. **The staging of this row is unaffected** — one
  recipe per guest, native to Oaxaca, own stock, exactly as it seeds today.

### the chocolate tablet
- **room:** `oaxaca-1954`  ·  **native or affinity:** native
- **what it is:** a round tablet of the drinking chocolate the molinillo was whisking, wrapped in paper, one per guest.
- **why it survives the night:** it gets grated into hot milk in December, months later, by which point it is the only thing left from that Sunday.
- **strength:** fair
- **founder question:** the weaker kind — bought in advance and unmarked by the evening. Does its connection to the dusk act rescue it, or is it merchandise with a good story?
- **own-stock ruling, 2026-08-26:** STAGED — one tablet per guest; the
  molinillo kit ships once and is not what this claims. Own stock.

### the jícara
- **room:** `oaxaca-1954`  ·  **native or affinity:** native
- **what it is:** the half-gourd cup the chocolate was drunk from at the chairs-to-the-wall turn.
- **why it survives the night:** it is light, odd, and unmistakably from a specific afternoon.
- **strength:** fair
- **founder question:** honestly, is two vessel take-homes one too many for one room? If only one survives, I would keep the copita, because three mezcals with one sentence each is the stronger act.
- **own-stock ruling, 2026-08-26:** STAGED — one gourd cup per guest, and it
  is not in the bank already. Own stock. The two-vessels question stands.

### the servilleta
- **room:** `oaxaca-1954`  ·  **native or affinity:** native
- **what it is:** the woven cotton cloth the tortillas arrived wrapped in, folded and given away.
- **why it survives the night:** it is a working object with a job, and it goes into her kitchen and does that job.
- **strength:** fair
- **founder question:** **the closest call in this room.** It passes the souvenir test on function — the tortillas genuinely arrive in it — and fails on appearance, because a woven textile is exactly what a visitor buys. Does function beat appearance here, or does the appearance decide it?
- **own-stock ruling, 2026-08-26:** STAGED — one cloth per guest. Own stock.
  The function-versus-appearance question is untouched by this ruling.

### the Conquián tally
- **room:** `oaxaca-1954`  ·  **native or affinity:** native
- **what it is:** the running score kept in pencil on whatever paper was to hand during the long middle of the afternoon.
- **why it survives the night:** it is the only written record of a room whose whole premise is that nothing is written down.
- **strength:** fair
- **founder question:** that contradiction is either the best joke in the room or a violation of `schedule=standing` — the house does not schedule, it remembers. Which?
- **own-stock ruling, 2026-08-26:** HELD — one tally, kept by the players, and
  nothing is shipped for it. Held.
- **category-3 ruling, 2026-08-26:** STAGED — CATEGORY 3, `single_artifact`,
  watching `ambient_game` for `yields_score_sheet`. HELD stands: `nothing is
  shipped for it` was the objection and is now the category. The
  schedule=standing contradiction in the entry is untouched and stays open.

### the orange
- **room:** `oaxaca-1954`  ·  **native or affinity:** native
- **what it is:** a whole orange off the mezcal plate, taken on the way out.
- **why it survives the night:** it sits in a bowl for a week and then gets eaten.
- **strength:** fair
- **founder question:** Palm Springs also sends a citrus fruit home for a completely different reason. Two rooms, one gesture, no shared object — is that acceptable, or does one of them have to give it up?
- **own-stock ruling, 2026-08-26:** KILLED — The mezcal plate carries orange
  SLICES, not whole oranges, so there is no row to subtract from and no
  per-guest quantity declared.

### the clay candleholder
- **room:** `oaxaca-1954`  ·  **native or affinity:** native
- **what it is:** the small clay holder from her end of the table with the night's wax still set in it.
- **why it survives the night:** the wax is the evidence and the clay is the object, and neither is worth anything.
- **strength:** fair
- **founder question:** the bank's candle-surface dimension gives Oaxaca clay — does giving the surface away break the staging check, since the host now has fewer of them each time?
- **own-stock ruling, 2026-08-26:** KILLED — The clay holders ARE the room's
  candle-surface staging; giving them away is subtraction from the light. The
  entry's own question about the staging check answers itself.

### the marigold
- **room:** `oaxaca-1954`  ·  **native or affinity:** native
- **what it is:** a cempasúchil head taken from the clay pots on the way out.
- **why it survives the night:** it dries hard and keeps its colour for a year, which almost nothing else does.
- **strength:** fair
- **founder question:** **association risk is the only thing wrong with it.** Marigolds are already banked as standing for this room, so they belong on the table — but a marigold going home in a guest's hand reads toward Day of the Dead in a way the same flower in a pot does not. Marked fair for that alone. Your call.
- **own-stock ruling, 2026-08-26:** KILLED — `marigolds in clay (standing)` is
  a standing planting rather than bulk material, so a head per guest is a
  subtraction from it. The association risk the entry flags is a separate and
  unresolved matter.

---

## What is NOT here, and why

- **No matchbooks in any of the six rooms.** New York owns the mechanism and
  the coat-pocket-in-March argument. The one I wrote (St. Moritz) is marked
  `thin` and I recommend cutting it; it is on the page so the collision is
  recorded rather than quietly avoided.
- **No shells, driftwood or beach objects at Acapulco.** Tahiti owns the conch
  and Big Sur owns the beach-as-florist.
- **No certificate at Aspen.** The printed award is Catskills' move and the two
  rooms would have converged on it immediately.
- **No place cards at Acapulco.** Resort-formal is maximum dress and MINIMUM
  protocol; the paperwork keepsakes are St. Moritz's, and reaching for them
  here would have collapsed the twin distance the Acapulco draft is explicitly
  defending.
- **No molinillo at Oaxaca.** See the souvenir account.
- **No cassette at St. Moritz, no lift ticket at St. Moritz, no affinity links
  between St. Moritz and Aspen at all.** See the separation account.
