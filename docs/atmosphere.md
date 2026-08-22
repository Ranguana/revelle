# Atmosphere — staging notes

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
