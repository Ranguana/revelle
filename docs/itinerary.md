# The itinerary — the gap she has now named three times

Written 2026-09-06, from a ruling about a field day. It is a SPEC, not a
build: nothing described here exists, and the reason it is a document rather
than a migration is that the surface is large and she has not scoped it.

---

## The ruling

> "field day can be multi day or one day - host chooses itinerary, which is a
> gap we discussed earlier about host ability to edit menus and itineraries.
> field day games include all and she chooses for the daily
> newsletter/itinerary"

Three sentences, and the middle one is the important one: **she has raised
this before, about menus, and it is the same feature.** That is the whole
argument for writing one document instead of building three half-mechanisms —
CLAUDE.md rule 21. If "she edits the menu", "she edits the newsletter" and
"she picks which field day games run on which day" are built separately, they
will be three authorities over one fact — WHAT HAPPENS ON DAY TWO — and they
will drift.

---

## What this is NOT, so the scope is legible

It is not a second selection engine. The house still assembles. What is
missing is the step after assembly: **the member rearranging what she was
given.**

And it is not the carousel. Three patterns are now on the table and only two
of them exist:

| pattern | who chooses | how many are delivered | exists? |
|---|---|---|---|
| the game carousel — db/061 | she picks ONE of three | all three | yes |
| three per course — db/062 | she picks one of three, per course | all three | yes |
| the set — db/069 | she picks HOW MANY, WHICH, and WHICH DAY | all of them | **yes** |
| **the itinerary** | the above, over *every* pool, with an order within a day | all of them | no |

The third row was written as impossible and **half of it has since been
built**, which is worth reading before designing the rest. The obstacle named
here was real: `offer_count = n` resolved to ONE running item per beat, because
db/061's partial unique index allowed at most one `chosen_at` per
`(revelle_id, offer_group)`.

db/069 did not turn `offer_count` up. It said what the index had never been
asked: **an offer is not always an OR.** The index now applies to exclusive
offers only, the kind is stamped on the delivered row, and `run_day` carries
the day. So "many items, on days she assigns" exists today for one beat.

**What the fourth row still wants** is the part db/069 deliberately did not
reach: the same thing across *every* pool at once, and an ORDER WITHIN A DAY
rather than only a day. `run_day` says Saturday; nothing says the sack race
comes before the rope. That ordering is the remaining gap, and it is the one
the morning bulletin needs.

---

## What the itinerary holds

One row per THING SHE HAS PUT ON A DAY. Not per delivered ingredient — the
delivered set is `revelle_<pool>` and is fixed at delivery (db/003, and
db/061's "the offer binds, the choice does not"). This is the arrangement laid
over it.

    revelle_id      whose
    day_index       1-based, and never above occasion_shape.days
    position        order within the day. Hers, and re-orderable
    pool            the registry's entity_table (rule 19 — never a hand list)
    entity_id       the row in that pool
    slot_code       which beat it came from, or null when she added it herself
    added_by        'house' | 'host'
    dropped_at      when she took it off the day. Null while it is on

Four properties it must have, each of which is a rule already written down:

1. **IT NEVER MOVES THE FINGERPRINT.** db/061 settled this for the carousel
   and the argument transfers whole: what she was GIVEN is the assemblage, and
   how she ARRANGES it is not. If arranging could change the fingerprint, two
   members could arrange their way into a collision and the ratchet would
   refuse one of them a card the house had already dealt her. So this table is
   outside `compute_assemblage_fingerprint`, exactly as `slot`, `position` and
   `chosen_at` are.
2. **DROPPING IS NOT DELETING.** `dropped_at`, never a delete. CLAUDE.md rule
   18: between a mistake and its fix, the thing stays where it was. A field day
   game she took off Saturday must still be there to put back on Sunday, in
   the place she last saw it.
3. **SHE MAY NOT ARRANGE WHAT SHE WAS NOT GIVEN.** The mirror of db/061's
   `chosen_was_offered` check. `entity_id` must exist in the matching
   `revelle_<pool>` row for that Revelle, or the itinerary is a promise about
   goods nobody shipped.
4. **`day_index <= occasion_shape.days`.** The span is already data (db/009)
   and this must read it rather than trusting the UI.

---

## How it relates to `day_material`

`day_material` is the beat. The itinerary is the arrangement of what fills it.
They are not alternatives and one does not replace the other.

- `occasion_slot` says a three-day getaway has three day beats. That is the
  HOUSE deciding how much material a weekend gets, and it is a product
  decision that belongs in a table a curator can edit (db/009's own argument
  about `days`).
- The itinerary says which of the delivered things is on Saturday and in what
  order. That is HERS.

**The distinction that keeps getting flattened, said plainly because it has
cost a deletion once:** ONE GAME PER EVENING is db/061 and is about the
evening's game beat. PER-DAY MATERIAL is `day_material` and is about the
daytime of an occasion that has days. They are separate beats and neither
number constrains the other. db/061 deleted `day_material` on a briefing that
read "one game per Revelle"; the ruling was "one game per EVENING", and the
deletion orphaned ten authored claims.

---

## Where the field day sits — BUILT, 2026-09-06

**Founder: *"fix the field day."*** It is fixed, and this section records what
that cost so the next reader knows which parts of this document are a spec and
which are a description.

`db/069` gave the field day its own beat and a second kind of offer:

| | |
|---|---|
| `occasion_slot.offer_rule` | `one_of` — db/061's carousel, n delivered, exactly one runs. `any_of` — n delivered, **any non-empty subset** runs. |
| `occasion_shape.daytime` | **Declared**, not inferred from `days`. The field day goes where there is a daytime. |
| `revelle_<pool>.offer_exclusive` | Stamped at delivery. What kind of offer she actually received. |
| `revelle_<pool>.run_day` | Which day **she** put this member on. Null means she has not said. |

**The two defects this document named are gone.** All five are offered, she
takes any number of them from one to five, she puts each on whichever day she
likes, and she can put any of them back. The lead line above the cards says the
true thing for each kind of offer, and the day control is drawn only where the
question exists.

**The invariant that did NOT get built, and must not be:** the five do not have
to land together. Founder, correcting the house's first reading within the
minute — *"it is a set across different days if host wants it."* So the set is
an **offer and a name, never a placement**: what travels together is the offer,
and what she decides is which members run and when, per member. A later pass
reaching for `coherence_group` to make a field day occupy one afternoon would be
restoring the invariant she retired.

### What is still not reachable, and why it is an authoring absence

**A field day on a one-evening occasion.** She said it may be one day, and on a
multi-day occasion that is already hers — put every member on the same
`run_day`. What cannot happen is a field day at a dinner party, and that is
correct rather than missing: giving every occasion a daytime beat is the
flattening that cost db/061 its deletion.

What is genuinely absent is **an occasion the catalogue does not have.** Every
one-day occasion db/009 wrote describes itself as an evening, in its own words
— *"One table, one evening"*, *"One evening, honoured"*, *"One evening the
calendar chose"*. There is no lunch, no afternoon and no day event. Admitting
one is hers, not a migration's; `occasion_shape.daytime` is declared precisely
so that the moment such a row exists it gets the field day with no edit to the
predicate.

## The daily newsletter reads from it

The newsletter already exists in the correspondence system and is further
along than anybody remembers:

- `voice_piece_kind` has **`bulletin`** — "Morning bulletin" (db/004), and
  Catskills already writes one: *"Thursday. Water at sixty-six. Two of the
  string lights are out at the far end and nobody has owned up."*
- `correspondence.day_index` exists for exactly this: "1-based, on an occasion
  that runs over days — a bulletin is one per morning and the mornings are
  ordered" (db/024).
- `correspondence.facts` is `text[]`, and the house's whole method is that
  **she gives facts and the house writes the sentence.**

So the newsletter does not need a new mechanism. It needs a SUPPLIER for
`facts`, and the itinerary is it: the day's rows, in her order, rendered as
the facts of that morning. Today a bulletin's facts are typed by hand, which
means the paper and the plan can disagree and nothing notices.

**And the join must go through the registry, not a hand-written pool list.**
Rule 19's worst instance was `portal/occasions.ts` omitting `dish` and
`bank_item` on a member-facing read, and a bulletin assembling its facts from
five of the nine pools would reproduce it on paper.

---

## What to reuse, so this is not built twice

| need | what already exists |
|---|---|
| how many days | `occasion_shape.days` (db/009) — never a `switch` |
| which pools exist | `ingredient_pool` (rule 19) |
| what she was given | `revelle_<pool>`, with `slot_code`, `slot`, `position` |
| a choice that does not bind | `chosen_at` / `offer_group` (db/061) |
| a per-day written piece | `correspondence` + `day_index` + `bulletin` |
| the reading order of a day | `src/lib/portal/sections.ts` `inHouseOrder` |
| a status change carrying its reason | rule 17's two columns |

---

## The three questions — ALL RULED, 2026-09-06

Kept with their answers rather than deleted, because the answers are short and
the questions are the reason the design is the shape it is (rule 14).

1. **Does the house still propose a day, or does she start empty?**
   **THE HOUSE PROPOSES ALL FIVE AND SHE DEDUCTS.** *"Include all"* is a full
   proposal she edits down — any number from one to all five, hers to reduce.
   Not a dealt single, and not a blank grid.
2. **May she add something she was not given?**
   **NO, AND THE QUESTION IS SHUT.** Every field day game is already in the
   offer, so there is nothing to add, and db/003's decision 2 is not reopened.
   A design that finds itself needing a second delivery event has gone wrong
   somewhere earlier and should stop rather than open it.
3. **Does a field day TRAVEL TOGETHER?**
   **YES, AS AN OFFER — AND NO, AS A PLACEMENT.** *"It is a set across
   different days if host wants it."* The whole set arrives, one identity, one
   heading; the members are then independent. She may run two on Saturday, two
   on Sunday, and none of the fifth. So the grouping is about **identity and
   offer**, never co-location, and `coherence_group` is the wrong instrument
   for it.

## What is still open, and it is one thing

**An order within a day.** `run_day` says Saturday. Nothing says the sack race
comes before the rope, and the morning bulletin needs exactly that — it prints
a day, in order, as facts. The itinerary table specified above is still the
answer, and it is now a smaller build than when this document was written:
`offer_rule`, `offer_exclusive` and `run_day` already exist and already bind,
so what remains is the ordering and the extension of the same gesture to the
other pools.
