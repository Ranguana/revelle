 n# Atmosphere — staging notes

**Status: founder specification, recorded. Not built. Extraction from voice
lexicons begins after founder sign-off.**

---

## What it is

Atmosphere ships as **staging notes** and nothing else. A note is a short
authored instruction about how a room is made to feel — per destination, in that
destination's voice.

## What it is not

**NO `floral`, `lighting` or `linen` slot types.** Atmosphere does not become
another pool the engine fills. `slot_kind` stays the closed list it is, and the
product-fillable codes remain `arrival_welcome`, `arrival_drink`, `table_object`,
`edit_item`, `favour`.

**NEVER SCORED.** A staging note is not a ranking input, not a facet, and not a
tile. It cannot influence which destination a host is given. This is the same
ruling that moved `acquaintance` out of the matrix and kept `environment` out of
stage 2: it describes what happens INSIDE a chosen world, so it belongs to
assembly.

## The properties

| | |
|---|---|
| **per-destination** | a note belongs to one world; it is not a general library |
| **voice-derived** | extracted from that destination's LEXICON, so the note is already in the house's words rather than translated into them |
| **draft / published** | the catalogue gate applies unchanged. Seeders create drafts; a human publishes at `/desk/publish` or on the note's own screen |
| **constraint-tagged** | via the existing `structural_requirement` vocabulary, so a note needing outdoors or open flame prunes with everything else at the venue gate |
| **framed by the plannedness register** | the destination's `schedule` cell governs how a note READS. A `posted` house states a staging note as an instruction with an hour; an `unplanned` house cannot, and a note that sounds scheduled in Havana is written wrong |

## Shoppable atmosphere

A note carries items through a join — **`staging_note_item`** — pointing at
**canonical ingredient rows**, which is to say existing `product` rows. Buyable
atmosphere is therefore a relationship a note HAS, never a second product table
and never a new slot to fill.

## Resolution

**All-or-nothing at assembly.** A note either resolves completely or it does not
appear. A half-staged note — the instruction without the thing, or three of its
four items — reads as an error in a deliverable that is supposed to feel
authored, and a partial atmosphere is worse than none.

**Authored fallbacks** where an item is season- or lead-fragile. If a note
depends on something that will not be available in February or cannot arrive in
time, the fallback is WRITTEN, in voice, rather than computed — the same
discipline as everything else in the catalogue.

## What happens next

1. Founder sign-off on this specification.
2. Extraction from the twelve voice lexicons begins. Nothing is extracted before
   sign-off, because a lexicon read wrongly produces notes in nearly-the-house's
   words, which is worse than none.
3. Schema: `staging_note`, `staging_note_item`, and the reuse of
   `structural_requirement` and `ingredient_requirement` rather than new
   vocabulary.
4. A desk screen, since the gate needs a handle — see `/desk/publish`.

**Recorded in `docs/proposals.md` per the ledger rule: nothing is admitted that
is not in that file.**

---

## Phase — time of day (2026-08-23)

Bank items — **goods, acts and games** — carry a **phase tag**:

`daylight` · `dusk` · `dark` · `all`

**Defaulting to `all`.** Assembly filters by the member's hours within the
room's authored arc. **Phase-lock and turns are unchanged** — this selects what
is eligible; it does not reorder the evening.

That is the whole change.

### The three axes, and what actually exists

With phase, the bank is selectable on every axis a party has:

| axis | what it answers | state |
|---|---|---|
| **season** | time of year | **BUILT** — `season_band`, `season_note`, and a seeded `season` facet dimension |
| **phase** | time of day | proposed here |
| **tier** | place — signature / regional / repertoire | proposed, not built |

**One correction worth making before anyone starts.** The `descent` tag was
cited as the existing precedent, and it is a precedent in DESIGN — a
phase-shaped eligibility tag on an ingredient row, gated on the destination's
`ending` cell — but it does not exist in code. Neither does the tier system.
Both were specified yesterday and neither is in the schema, the seeders or
`docs/dishes.md`.

So a phase tag is not copying a working pattern; it is the SECOND instance of a
pattern nobody has built once. That argues for building `descent` and `phase`
together, since they are the same mechanism twice — an enum on an ingredient
row, a default that means "no opinion", and one clause in the assembly candidate
query — and the second is nearly free once the first exists.

Season is the only one of the three that is real today, and it is worth reading
its implementation first: it already distinguishes a HARD filter from a SOFT
weight, and phase will need the same distinction. A candle at dusk is a
preference; a game that only works in the dark is a constraint.


---

## The take-home slot — one per guest (2026-08-26)

**Read this before authoring anything for `the_take_home`.** It is the rule an
author will get wrong, because the wrong version is cheaper and reads as
elegant.

### The rule

> **A take-home ships its own stock.** Founder ruling, 2026-08-26, answering the
> question all three take-home proposal sheets asked at once: may a take-home be
> a second claim on an existing bank row, or must it ship its own stock? — *"its
> own"*.

The reason is quantity, and it is the whole rule. **A table item ships ONE. A
take-home ships ONE PER GUEST.** One arrangement of florals, one banana-leaf
runner, one posted card of the day's hours, one deck, one kit. Twelve roses is
not that arrangement, so New Orleans's "one of the dark red roses" is not a
take-home — it is a subtraction from a centrepiece wearing a slot claim.

### The dual-claim boundary, which this does NOT reverse

An item may still claim more than one slot. The founder's Catskills rock is a
place setting AND a keepsake — one object, shipped once — and the reason it
works is the boundary:

> **A dual claim survives only where the object it sits on is ALREADY
> per-guest.** Otherwise the take-home needs its own row with its own stock.

So `place cards in stands`, `menu cards … at each place`, `tuberose — one stem
at each place`, `half-coconut bowls`, `church fans at places`, `stoneware
copitas` and the printed slips inside a game kit all take a second claim for
free. A deck, a kit, an arrangement, a single posted card and a caviar
service's one spoon never can, at any price.

**One refinement, ADOPTED AS STATED on 2026-08-26.** Where the existing row's
stock is BULK — lemons at full dose, pampas, loose lavender, a sack of beans, a
box of stationery, sparklers inside the kit — the per-guest slot can be carried
by raising the order on that row. That is still the take-home shipping its own
stock; it is just stock on a line that already exists. Bulk saves the Amalfi
lemon and still kills the New Orleans rose, which is the test any wording here
has to pass. The founder's note on adopting it, recorded because it is the part
that gets lost: *the agent's inability to find another formulation that does
both is itself evidence this is the right line.* It decides eight items, all of
them `SECOND CLAIM, NOT STAGED` — the Palm Springs grapefruit, St. Moritz's
blank apology stock, Acapulco's spare sparklers, the Amalfi lemon and beans, the
Dolomites larch sprig, and Havana's fruit and coffee.

### The named boundary case — the Nantucket broadsheet (2026-08-26)

The printed-article prohibition has one case that tests it, and the founder
ruled that the case is RECORDED rather than accommodated:

> *"The printed-article prohibition, correctly read, bars items that would need
> their own NEW printed stock, and the broadsheet never needed any. Don't
> rewrite the rule to accommodate it; record it in the rule's notes as the test
> case that defines the boundary. Rules warped around their edge cases get
> leaky; rules with a named boundary case stay sharp."*

One reproduction summer-1972 front page dresses the Nantucket table for eighty
and then leaves with all eighty of them, torn along the folds, every sheet
buttered and marked differently because everybody sat somewhere else. It is a
SINGLE PRINTED ARTICLE that is per-guest BY CONSTRUCTION. The wording above is
therefore unchanged and the broadsheet stays `SECOND CLAIM, NOT STAGED` — an
already-stocked row doing double duty.

**The test, for anything that argues from it:** show the same CONSTRUCTION — one
article that divides into one per seat, each seat's different — not merely the
same conclusion. db/044 writes this note into `slot_kind.description` for
`the_take_home`, so the desk renders the case beside the rule rather than
leaving it in a document only somebody already looking would open.

### THE EVENING SUPPLIES IT — the third category (2026-08-26)

Twenty of the 172 proposals could not be described by "ships its own stock" at
all, and the founder ruled that they are not a residue of the rule but the best
thing under it:

> *"These are the take-homes that can't be faked: nothing printed in advance,
> pure residue of the night actually happening. Your rock, industrialized. Admit
> it."*

Corks, muselet cages, soaked-off rosé labels, the shell out of the bucket,
lobster-claw bands, a creek stone, rose hips, a bottle cap, a film canister —
and the one-of-ones: the Vegas IOU, the doubling cube, the caviar tin, the Aspen
trophy, the backgammon column, the signed napkin, the Conquián tally, the tape
flag. db/044 is the schema. Two consequences, and neither is optional.

**(a) IT HAS DEPENDENCIES, NOT STOCK — a SLOT plus a PREDICATE, never a row.**
A cork exists because the drink programme pours bottles; the shell exists
because the main course was the bucket. The pointer is `bank_item_dependency`,
which is `(item, slot_code, supplies)`: the slot is watched and the predicate —
a `supplies_tag` such as `yields_cork` or `yields_shell` — is asked of whatever
filled it. It is deliberately NOT a reference to a supplying row, in the
founder's own correction:

> *"A static `depends_on → revelle_dish.lobster_bucket` is only satisfied when
> selection happens to draw that dish … A static dish-row FK would produce
> exactly what you predicted: a check that looks right and fires on the wrong
> thing — red when the room is fine, green for a package that drew the ceviche."*

And a menu reference would be worse than wrong: `occasion_slot` has ZERO rows
whose pool is `menu` (db/022 composed the table out of dishes and set the menu
pool's `typical_draw` to 0), so a dependency written against a menu could never
be satisfied and nothing would say so.

**The three states are DERIVED, never authored,** because whether a dependency
is unconditional is a fact about what else is in the pool for that room, and the
pool changes under it:

| state | what it means | what the board may say |
|---|---|---|
| `unconditional` | everything that can fill the watched slot in this room carries the tag | **covered VIA** the watched slot — never plain "covered" |
| `conditional` | some do. Decided per package at composition | conditional. **Does not count as covered** |
| `broken` | nothing that can fill it here carries the tag | a gap, and the reporter fires |
| `unwatched` | evening-supplied with no dependency at all | legitimate — see below |

**`unwatched` is an answer, not a hole.** Four of the twenty are supplied by the
NIGHT rather than by a slot: a rose hip off the lane, a stone out of the creek,
a napkin that goes round, a strip of the host's own masking tape. Nothing in a
package supplies those. `bank_item.supply_note` is therefore COMPULSORY on an
evening-supplied row, so that "decided: the night supplies it" and "nobody has
written the dependency yet" cannot look identical in the data.

**(b) TWO QUANTITY SEMANTICS, NEVER CONFLATED.**

> *"Corks, bands, labels scale with the dinner — roughly per-guest, with
> Acapulco's caveat that the ratio is per-bottle, not per-head. The one-of-ones
> — the trophy, the IOU, the doubling cube, the signed napkin — go to ONE guest.
> That's not a defect; a prize is a legitimate take-home shape, arguably a great
> one. But it's a different promise, and selection and the board need the
> distinction (`per_guest` vs `single_artifact`) so nobody reports a room as
> having per-guest take-home coverage on the strength of one trophy."*

`bank_item.take_home_quantity` is `per_guest`, `single_artifact`, or NULL. **Null
is no promise and may never be counted as per-guest coverage** — the same reading
db/043 gives an absent facet tag. Twelve of the twenty are `per_guest` and eight
are `single_artifact`.

It lives on the ITEM rather than on the slot claim, and the broadsheet is why
that is safe: the column is only ever consulted for a `the_take_home` claim, so
one printed article that is a single article as a table covering and per-guest
as a take-home has nothing to choose between. Putting it on `bank_item_slot`
would have meant a column on one pool's copy of a table every pool shares, which
is the "this pool is special" bug db/043 spent a migration removing.

**A test the third category does NOT pass, recorded rather than smoothed over:**
the Vegas IOU is a small PRE-PRINTED form, and the signed napkin is heavy paper
the house could ship. Both are named in her list and both are printed or
purchasable in advance, which is the one thing she said this category never is.
They are staged as she named them and flagged in their sheet entries as the
weakest fits of the twenty.

### Three tests, in order, for a proposed take-home

1. **Count it.** Can the house put one per guest on an order? If not, it is not
   a take-home, whatever else it is.
2. **Ask what it points at.** If it points at an existing row, is that row's
   stock per-guest or bulk? If it is one article, the take-home needs its own
   row.
3. **Only then claim slots.** `the_take_home` is the primary claim (db/043:
   take-home beats light beats table, "a thing is classified by its destiny
   before its surface"); the second claim is where the object spent the evening.
   And per db/043, host acts and games may claim only the light or the general
   bucket — the table and the take-home are OBJECTS, and an act is neither, so a
   take-home that comes out of an act claims the OBJECT the act produces or
   uses, never the act.

### Which spec on this page is current

**This section, and the phase section above it, describe things that exist.**
`bank_item` shipped in db/031; db/043 gave it `bank_item_slot` with the four
slot codes `the_take_home` · `the_atmosphere` · `the_table_set` · `the_light`,
and put atmosphere into the selection engine. The rule above is about that
table.

**The `staging_note` / `staging_note_item` specification at the top of this
page is NOT what got built**, and its own "Not built" banner is still accurate
as written — it is preserved rather than rewritten, per rule 14, because the
argument in it (never scored, voice-derived, framed by the plannedness register,
all-or-nothing at assembly, authored fallbacks) is what survived into the thing
that did ship. What did not survive is the SHAPE: there is no `staging_note`
table and no `staging_note_item` join. Shoppable atmosphere is `bank_item` and
`bank_item_ingredient`. **If the two disagree about a table name, db/031 and
db/043 are the truth and the top of this page is the argument that produced
them.**

### Where the current take-home content is

Not published, and deliberately not. 152 machine-drafted take-home objects were
staged into `docs/atmosphere-idea-bank-v1.md` on 2026-08-26, and the 20
evening-supplied rows joined them the same day — 172 in all. Four more rows
joined on 2026-08-26 that are NOT take-homes: WESTHAMPTON, 1976 had nothing at
all in `the_table_set`, live or draft, and db/043 makes that slot REQUIRED at a
dinner party, a birthday, an anniversary, a holiday and a no-reason party, so
every long dinner in that room read low-confidence for an empty slot. It was
the only room of the eighteen with an empty table, and no Westhampton proposal
was killed by the own-stock ruling — the hole predates all three sheets. That
is **356 bank rows in the document, 174 live and 182 draft.** Each carries a
`FOUNDER-PENDING` question in its own text, which is what holds a row in draft
(`FOUNDER_PENDING` in `scripts/catalogue-vocabulary.mjs`; db/036 makes the same
test in SQL). `npm run seed:bank -- --dry-run` reports them as held. The
reasoning, the 47 casualties, the 26 that survive with no new stock as second
claims or affinity, and the counts are all in `docs/proposals.md`, 2026-08-26; the item-by-item verdicts are in the three
`docs/take-home-bank-*.md` sheets. **Delete a FOUNDER-PENDING question and that
row goes live on the next deploy — that is the whole mechanism, and it is why
nobody edits those clauses casually.**
