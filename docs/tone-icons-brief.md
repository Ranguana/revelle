# Tone icons — design brief

**For Claude Design. Fifty-one icons, one per tone.**

These sit in the Revelle Société membership application, on the step that asks
**"How do these people talk to each other?"** A host taps the ones that sound
like her friends. Her taps are the only thing that tells the house what
register to write her invitations, menus and place cards in — so these tiles
carry more weight than their size suggests.

---

## What is wrong with the current set, so it is not repeated

The set on the site today draws **conversation**, not feeling: a line is a
spoken phrase, a dot is a person, a gap is a silence, an arc is loudness. It is
internally consistent and completely unreadable. Nobody looking at a tile can
tell what it means without reading the label, which makes the icon decoration.

**These should be icons of feelings and tones.** A host should be able to scan
the grid and feel the difference between *deadpan* and *warm* before she reads
a word. The label confirms the feeling; it should not have to supply it.

---

## The set, as a set

This is the hard part and it matters more than any single icon. Fifty-one
drawings must read as **one commissioned set** — the same hand, the same
weight, the same level of abstraction throughout. Two icons at different levels
of literalness look like an accident.

- **64 × 64 viewBox.** The tile renders at roughly 40–48px, so nothing may
  depend on detail below about 2px.
- **Stroke-led, ~1.25 units**, consistent everywhere. Fills only as a small
  solid accent (a dot, a filled shape), never a large mass.
- **No text**, no letterforms, no numerals, no emoji, no clip art.
- Legible in a single glance at tile size, on a warm cream ground.

## Palette

Every stroke must use one of these. Do not introduce a colour.

| role | hex | use |
|---|---|---|
| ink | `#26251C` | the primary drawing |
| oxblood | `#A83E24` | the accent — one element per icon, at most |
| aqua | `#1F6B7A` | the secondary accent, used sparingly |
| gold | `#C9922F` | warmth and light, used sparingly |
| ground | `#FBF4E7` | the cream ground behind — never drawn on |

The existing occasion icons on the landing page are the closest reference for
line quality: engraved, restrained, hairline, never cute.

## Delivery

One SVG per tone, **named by its code** (`deadpan.svg`, `dry_aside.svg`, …),
64 × 64 viewBox, no `width`/`height` attributes, no `<style>` blocks, no
external references, no raster. Colours as literal hexes from the table above —
they are swapped for CSS tokens on the way in.

---

## The fifty-one tones

Grouped as the host sees them. The right-hand column is the exact text printed
under the icon, so the drawing must agree with that sentence and not with the
code name.

### When something is funny

| code | the tile says |
|---|---|
| `deadpan` | Says the outrageous thing with a straight face |
| `dry_aside` | The best line is muttered, not announced |
| `teasing` | Teases the people it loves the most |
| `in_jokes` | Talks almost entirely in in-jokes |
| `absurd` | Follows a stupid idea all the way to the end |
| `self_deprecating` | Gets there first about themselves |
| `nothing_sacred` | Nothing is off limits, including each other |
| `good_natured` | Funny without anyone being the joke |

### How loud a room they are

| code | the tile says |
|---|---|
| `all_at_once` | Four conversations, all at once |
| `interrupts` | Finishes each other's sentences |
| `one_conversation` | One conversation, and everyone in it |
| `across_the_room` | Will shout something across the room |
| `low_voices` | Says the important part quietly |
| `laughs_first` | Laughs before the end of the sentence |

### How much ceremony they can take

| code | the tile says |
|---|---|
| `toasts` | Someone always stands up to say something |
| `rises_to_greet` | Stands up when someone new arrives |
| `seating_plan` | Wants to know where they are sitting |
| `no_speeches` | Would rather nobody made a speech |
| `dressed_up` | Dresses for dinner without being asked |
| `first_names` | First names from the first minute |

### How they say the kind thing

| code | the tile says |
|---|---|
| `says_it_out_loud` | Says the loving thing out loud, sober |
| `nicknames` | Everyone has a name only this group uses |
| `asks_properly` | Asks how you are and waits for the answer |
| `warm_not_loud` | Fond of each other and quiet about it |
| `compliments_plainly` | Pays a compliment without hiding it in a joke |
| `sentimental` | Cries at the toast and is not embarrassed |

### How exact they are

| code | the tile says |
|---|---|
| `exact_word` | Hunts for the exact word and finds it |
| `will_look_it_up` | Settles the argument with a phone |
| `corrects_gently` | Corrects the year, kindly, every time |
| `understated` | Says less than it means and lets it sit |
| `roughly_eight` | Says around eight and means somewhere after nine |
| `long_way_round` | Tells it the long way, with the detours |

### How fast the evening moves

| code | the tile says |
|---|---|
| `unhurried` | Nobody hurries anybody |
| `talks_fast` | Talks fast and expects you to keep up |
| `arrives_late` | Arrives when it arrives |
| `lingers` | Still at the table two hours after the plates |
| `no_dead_air` | Never lets a silence sit |
| `comfortable_silence` | Can sit in a silence without filling it |

### What they assume you already know

| code | the tile says |
|---|---|
| `leans_in` | Leans in to say the good part |
| `explains_nothing` | Explains nothing, on principle |
| `straight_to_gossip` | Gets to the good part before the coats are off |
| `means_the_other_thing` | Says one thing, means the other, everyone knows |
| `between_us` | What is said at this table stays at this table |
| `spells_it_out` | Would rather everyone were told properly |

### How much they perform

| code | the tile says |
|---|---|
| `makes_an_entrance` | Someone always makes an entrance |
| `does_the_voice` | Will do the voice, and do it twice |
| `one_tells_it` | One of them tells it and the rest let her |
| `nothing_by_halves` | Nothing here is done by halves |
| `never_performs` | Will not get up in front of a room |
| `swears_fondly` | Swears, warmly, in company |
| `impeccably_polite` | Impeccably polite at three in the morning |

---

## Four that are worth extra thought

**`good_natured` — "Funny without anyone being the joke."** The clean one, and
the only tone in its group that is not funny *at* something. It has to be
visibly warmer than `teasing` and `nothing_sacred` sitting beside it, or the
distinction the host is being offered does not exist.

**`deadpan` vs `dry_aside`.** Both are dry and they must not be twins. Deadpan
is an outrageous thing delivered flat; a dry aside is quieter, sideways, and
not addressed to the room.

**`nothing_sacred` vs `swears_fondly`.** Both irreverent. The first is a group
with no limits; the second is affection that happens to be profane.

**`impeccably_polite` — "Impeccably polite at three in the morning."** The joke
is the hour. If the icon says only "polite" it loses the tone entirely.

---

## The one test

Cover the labels. Hand someone the grid and ask them to point at the group that
laughs the loudest, the group that stands on ceremony, and the group that says
the important thing quietly. If they can, the set works.
