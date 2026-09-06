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
| **the itinerary** | she picks HOW MANY, WHICH, and IN WHAT ORDER | all of them | **no** |

The third is genuinely different and cannot be reached by turning
`offer_count` up. `offer_count = n` still resolves to ONE running item per
beat — db/061's partial unique index says so in the schema: at most one
`chosen_at` per `(revelle_id, offer_group)`. An itinerary is many items, on
days she assigns, in an order she sets. That is a different shape and the
index would refuse it.

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

## Where the field day sits today, honestly

The field day games in `src/lib/games.ts` claim `day_material` natively and
nothing else. That means:

- They are placeable on the multi-day occasions and nowhere else.
- The ENGINE deals one per day beat. **She does not choose them and she does
  not order them.** "All the field day games are offered and she picks" is
  NOT what happens.

That is stated here and in the games themselves rather than papered over,
because a mechanism that looks like it honours her choice and does not is
CLAUDE.md rule 16's most expensive failure. Two consequences of the gap, both
real today:

1. **A ONE-DAY FIELD DAY IS UNREACHABLE.** She said it may be one day. A
   single-evening occasion has no `day_material` beat, so the field day games
   cannot be placed there at all. The fix is not to give every occasion a day
   beat — that is the flattening again — it is the itinerary, where she says
   "these four, Saturday afternoon" regardless of how the house counted days.
2. **A FIELD DAY IS A SET AND THE ENGINE DEALS SINGLES.** Sack race, tug of
   war, three-legged race, egg and spoon and the bucket brigade are an
   AFTERNOON, not five interchangeable candidates for one slot. Nothing in the
   selection engine can express "these belong together"; `coherence_group` on
   `occasion_slot` is the nearest existing idea and it groups a slot's
   candidates, not a slot's ITEMS.

---

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

## The three questions for her

1. **Does the house still propose a day, or does she start empty?** A proposed
   itinerary she rearranges is a different product from a blank grid, and it
   decides whether `added_by = 'house'` rows exist at all.
2. **May she add something she was not given** — a game from the catalogue that
   was not in her offer? Today the answer has to be no, because the assemblage
   binds at delivery. If the answer is yes, that is a second delivery event and
   db/003's decision 2 has to be revisited on purpose rather than by accident.
3. **Is the field day a NAMED SET or five separate games?** They are written as
   five rows, which is what "all the field day games" says. If a field day is
   one thing a host puts on an afternoon, the catalogue needs a way to say "a
   set that travels together" and nothing does.
