# Revelle Société — page copy

Draft. Not committed.

**Retired:** the bone arc. **Retired:** the word *world* — the thing is a
**destination**.

---

## Hero — SUPERSEDED 2026-09-05, and the old one is kept below

Founder: *"it shouldnt open with westhampton 1976. just move this line up:
Westhampton, 1976. Portofino, off-season. Your dining room, Saturday."*

The hero as recorded below opened with one destination's name, in that
destination's palette. That sells a location, which is the one thing this
product does not sell — CLAUDE.md rule 2, read from the front of the house.
What ships now leads with the three settings and ends on her own dining room,
on the HOUSE ground; the destination's name and its index moved to the worked
example lower down, where they were already running.

The version below is preserved rather than edited, because the argument for it
was good and is the argument somebody will make again.

> **Revelle Société**
>
> # WESTHAMPTON, 1976
> Vintage summer glamour. Very questionable houseguests.
>
> A société for people who host.
>
> **[ Apply for membership ]**
> Every party is a destination.

The hero *is* a destination, set like a plate, with the photography behind it.
No headline explaining the service, no promise of escape — just escape. It shows
what a Revelle is in the first second instead of spending three lines defining
it, and it rotates each season without a rewrite.

---

## Where to

*No caption. A house does not explain its collection.*

> **The getaway**
> A house, a heat wave, and a cast of characters you already know.
>
> **The weekend away**
> Three days, one house, and a photograph you'll all fight over.
>
> **The long dinner**
> One table, a rule about the record player, dessert at midnight.
>
> **The birthday**
> The good champagne, everyone dressed up, and not a single speech.

---

## The destinations — CUT 2026-09-05

Founder: *"you have all the destinations on the landing page but they dont
click anywhere, I think its better we dont show the destinations (except for
westhampton i guess as an example toward the bottom)."*

Two faults, and the second is the one that matters. None of the plates linked
anywhere, so a visitor who tried one got nothing. And a menu of named rooms
asks *which one do I want?*, when she does not pick — the house assigns the
room from her answers (`docs/selection-spec.md`, "she does not pick"). The
shelf was quietly teaching the opposite of how the product works.

The section below is the copy as it stood. Nothing was deleted from the
codebase: `LIBRARY`, `POSTERS` and `DestinationPlates.tsx` are all still there,
and a route that gives a destination a page of its own is what would bring the
shelf back.

> **Destination No. 02 — The long dinner**
> **Destination No. 07 — …**

Seven plates. Numbering is light, in the register of a house that keeps an
archive — not a collectible-series device.

---

## A destination, in full

> Labor Day. Six friends. A rented house.
>
> # WESTHAMPTON, 1976
> Vintage summer glamour. Very questionable houseguests.
>
> They wanted glamour without a theme, and a long dinner that turned into
> something else. So: a cast of characters, one staged photograph, and a rule
> about the record player.

---

## What arrives

*Shown as objects — the printed stack photographed in the destination's own
palette and typeface. Not a list, and not behind an accordion.*

> **The Look** — the palette, the type, the references.
>
> **The Voice** — how the invitation reads, what the menu calls things, how it
> all sounds.
>
> **The Arrival** — what's playing, what's in their hand, what they see first.
>
> **The Moment** — the one they retell. Staged, never announced.
>
> **The Ending** — how a night closes on purpose, not by attrition.
>
> **The Fun** — games matched to how these particular people behave.
>
> **The Soundtrack** — sequenced for the arc of the night.
>
> **The Table** — styling, cocktails, specific enough to shop.
>
> **The Edit** — a short, opinionated list of things to buy.
>
> **The Printed Matter** — invitations, menus, place cards, game materials.
>
> **The Prep** — a short list. Not a project plan.

Closing line for the section:

> Everything you send them sounds like it came from the same place. Because it
> did.

---

## (no header)

*"The difference" and "Taste is the product. Technology just makes it yours."
are both cut. The header announced an argument; the line was an investor
statement in customer clothes. The columns need neither.*

> **Not this**
> A forty-tab Pinterest board
> A themed party with a costume rule
> A planner with a clipboard and an invoice
> A chatbot's list of fifty ideas
> A schedule that runs your weekend
>
> **More this**
> One destination, chosen for these people
> Details that land like an inside joke
> A moment they retell for years
> Games your friends will actually play
> Everything ready — and still yours to run

---

## Membership

> **Members are known.**
>
> Every Revelle is bespoke — designed for these people, this occasion, and
> issued once. Membership is what makes it better each time: the société learns
> your taste, your people, and what you'd never do twice, so the third is
> sharper than the first.
>
> Apply once. Dues annually.
>
> **[ Apply ]**

---

## Footer

> Revelle Société

**The page ends on the door.** No closing statement, no defence. A magazine
closes with a statement; a club closes with an invitation.

---

## The rule for writing a destination

**A place and a time, then two concrete details. Never an adjective naming the
feeling.**

The atmosphere lives in the *when*:

> Westhampton, **1976**. Positano, **off-season**. Dessert **at midnight**. A
> **heat wave**.

Not one adjective among them. "Positano" is a place; "Positano, off-season" is a
mood, and it cost one word. Naming a feeling kills it — the moment you write
*romantic* or *glamorous*, you have told her instead of transported her.

The line beneath a destination's name is where the atmosphere goes, and it does
the job with noun phrases and a joke:

> Vintage summer glamour. Very questionable houseguests.

---

## The voice is half the destination

A destination is a **look** and a **voice**. The look is palette and type; the
voice is how everything reads — what the invitation says, what the menu calls
the drinks, how a note to her guests sounds.

This is the least copyable thing in the product. Anyone can generate a mood
board. Producing every written piece in one consistent voice *and* one
consistent typeface takes an engine, and that engine already exists — it is
what the daily-program app was, before we knew what it was for. WESTHAMPTON,
1976 does not merely look like 1976; it sounds like it.

**Which pieces she gets is hers to choose.** The engine can produce anything
written the occasion needs — and for a multi-day getaway that could include
something each morning — but nothing is prescribed. A host who wants an
invitation and a menu and nothing else gets exactly that, in the same voice.

---

## Notes

**Bespoke** sits in Membership, where being known is already the subject. It is
load-bearing on two database guarantees: *issued once* is the assemblage
uniqueness constraint, and *better each time* is the taste profile carrying
forward. Both are built. If either is dropped, this line changes with it.

**Open — the hero.** Two candidates:

1. **Destination-led** (above). Opens *in* a place rather than describing the
   service. Strongest show-don't-explain version, rotates seasonally.
2. **The invitation** — *Where would you like to go?* over *A société for
   people who host.* Warmer, puts her in the driver's seat, but explains where
   the first simply arrives.

**Rejected heroes, so they don't return:** *Take them somewhere.* — vague, and
the third beat ("your dining room, Saturday") landed her back home when the
brief is transport. *You bring the occasion. We create the experience.* — splits
the work and gives her the trivial half. *You host. They'll think you spent a
year on it.* — makes the product about fooling her friends. *Cut to your taste
and no one else's* — tailoring jargon; keep that metaphor internal.
