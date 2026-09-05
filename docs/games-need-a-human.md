# The games — what needs a human

Written 2026-09-05, doing the game pages once and for all. Everything here
was found while making twenty-seven games runnable by somebody who has never
seen one, and every item is a place where the work stopped rather than
guessed.

The line it stopped at is CLAUDE.md rule 3 and the founder's own instruction:
filling in "a round runs about five minutes" is reasonable, and **deciding how
somebody wins, when nobody has, is hers.** Where a rule could be recovered
from the runbook it was promoted into the page and is not listed here. Where
it could be looked up, it was, and the finding is in `src/lib/games.ts` beside
the game. What is below is what neither of those reached.

`docs/needs-a-human.md` is the older list and carries nothing about games.
This file is its sibling, not its replacement.

---

## A. HER RULE, AND THE HOUSE'S READING OF IT

Twenty games are native to a room and quote her sentence verbatim under
`HER RULE, VERBATIM:` in `notes` — `games.test.ts` compares that quote to the
room's own voice piece character for character, so the quoting cannot drift.
What can drift is the READING, and three rows carry an interpretive choice the
house made because her sentence does not resolve without one. Each is already
stated in the row so a later reader can disagree with it in one place; each
needs a yes or a no.

### 1. The Swim Test — what winning gets you

> Her rule: *"Everybody tells the story of the swim test. Whoever's version is
> furthest from the ledger wins, and the ledger stays shut."*

Her sentence says a version WINS and never says what winning gets you. The row
says plainly that being named furthest from the record is the whole of it —
nothing is handed over, there is no second prize, and the ledger is not opened
to settle it.

**The house's reason:** a host improvising a prize at the end of this one has
given an object to the biggest liar in the room, which is a different game. But
"nobody wins anything" is a rule, not a clarification, and it is hers.

**The question: is being named the whole prize, or is there something?**

### 2. The Song That Gets You Up — whose name is on the slip

> Her rule: *"Everybody names the song that gets them up. Nobody names their
> own. We play them in order."*

The two halves only resolve if the song is chosen FOR somebody, so the row puts
a NAME on the slip beside the song: you write somebody else in this room, and
under it the song that gets THAT person up.

**The alternative reading nobody has ruled out:** each person names the song
that gets THEM up, and "nobody names their own" means nobody may name a song
already claimed. That is a different game — a queue of self-selected songs
rather than a room of people being watched — and it needs no slip and no name.

**The question: is the slip a claim about somebody else, or about yourself?**

### 3. Correct The Year — how the second story is chosen

The row says two stories and no third: the first chosen by the host before the
evening, the second going to whoever argued hardest about the first. "Argued
hardest" is the host's judgement with no test on it, and the row does not say
what happens if two people did.

**The question: does she want a rule there, or is a host's call the point?**

---

## B. RULES THAT DO NOT EXIST YET AND A HOST WILL BE ASKED FOR

### 4. Fishbowl's round order — the house plays the minority version

The one game here whose rules exist outside the house and can be checked
against something. Checked 2026-09-05.

| | round 1 | round 2 | round 3 |
|---|---|---|---|
| **this file** | anything except the word | act it out | one word |
| the majority of published versions, the one commercially codified version, and the encyclopaedia entry | anything except the word | **one word** | **act it out** |

Both orders are played by real rooms. The argument written into this runbook —
the third round is funny because of the first two, and round two is faster
because everybody half-remembers the bowl — is true either way round, so the
file does not settle it and neither does the research.

**Nothing was changed.** The order of the rounds is what the game IS.

**The question: does the house play it her way, or the common way?** If hers, a
line saying so is worth having, because the next person to check will find the
same discrepancy and re-derive this page.

### 5. Fishbowl's skip rule — genuinely unsettled everywhere

Published versions run the whole range: no skips at all, one a turn, one a
round, unlimited in the first two rounds and none in the last, unlimited
always. Every single one of them says it is a thing the table agrees BEFORE the
first turn rather than during one — which is itself the most reliable finding.

The file now states one skip a turn, with the slip going back in the bowl,
**as a default a room may overrule** rather than as a rule. A host is asked
this in the first minute and needs an answer.

**The question: is one skip a turn right, and does the house have a rule here
at all or does it hand the room the choice?**

### 6. Unspent Party Bucks at the auction

The money is paid in cash across the evening and spent at the auction. What
happens to what is left is not written anywhere. Her ending line is
*"That's the last one. Spend what's left on each other"*, which is a good line
and three different rules.

Three readings, none of them safe to pick:

- it is worth nothing after the gavel and is simply kept as paper;
- it carries to next year alongside the Golden Ticket;
- it is spendable between guests after the auction, which is what the line
  most literally says and which would keep the game running past its own
  ending.

**The question: what is a Party Buck worth at half past midnight?**

### 7. How many lots the auction sells

Not stated anywhere. The block's own arithmetic implies eight to ten — one
small lot, fourteen minutes of middle lots, the Golden Ticket, the last one —
and the page now says "eight to ten of them is what the half hour is written
for", flagged as a planning figure and not a rule. The under-minimum
contingency says to halve the number of lots, which means a number exists.

**The question: confirm eight to ten, or give the number.**

---

## C. TWO STRUCTURAL FINDINGS, NOT WRITING

### 8. TWO GAMES CARRY REQUIRED DEPENDENCIES THAT ONE GAME SLOT CANNOT SATISFY

This is db/061's shape again — the same family as the note already in
CLAUDE.md about removing a slot orphaning the claims on it — and it is not
caught by anything.

`the-secret-auction` carries four `required` dependencies under one group key:
it needs the secret cards, the art battle, the scavenger hunt or the game show
to have run, because that is where its currency comes from. `amalfi-the-five-prizes`
carries one: it needs a game that produced winners, because the parcels are
handed out as they are won.

**db/061 gave every occasion exactly one game slot.** One game reaches the
evening. So a second game can never be placed, and neither dependency can ever
be satisfied — at any occasion, in any room.

Nothing goes red. `src/lib/selection/` does not read `game_dependency` at all,
and db/010 says so on purpose: *"No enforcement that a finale's dependencies
were actually placed. Both are the engine's job."* The engine never grew that
job. So both games are placeable today and would be dealt as one of her three
cards, and a host who took the auction would run an auction where nobody has
any money.

**Three ways out and they are not the same decision:**

1. **The dependency is honoured as a filter** — the two games become
   ineligible wherever the earning game is not also placed, which under one
   slot means they are ineligible everywhere and the pool loses two games.
2. **The dependency is downgraded to `enriched_by`** — both games stay
   playable and the auction is run with money paid for party spirit alone,
   which the auction's own text already describes as the mechanism that
   matters. This is the smallest change and it changes what the auction is.
3. **The one-game rule gains an exception for a finale that spends an
   earlier game.** Which reopens the ruling she just made.

**This was not decided here.** Inventing an answer would be a machine deciding
what two of her games are for.

### 9. Westhampton at a dinner party offers two games, not three

After the anniversary work, 161 of the 162 room × occasion pairs offer three
or more games. This is the one that does not.

| | |
|---|---|
| art battle | forbidden at a dinner party — twenty minutes of painting is twenty minutes nobody is at the table |
| reverse scavenger hunt | forbidden — nobody leaves the table |
| secret game cards | forbidden — there is no underneath at one table |
| the secret auction | forbidden — a long dinner ends with dessert at midnight |
| the houseguest list, this room's own | forbidden — it runs for three days |
| **imposter** | **forbidden at this room specifically** |
| let's make a deal | eligible |
| fishbowl | eligible |

Every one of those forbids is argued on its own terms and none of them is a
headcount claim, so none was lifted. **This is an authoring absence and not a
property of the room** (CLAUDE.md rule 29): the room is one game short of a
carousel at one occasion, and the fill is a game, not a lifted forbid.

**The question: is a third dinner-party game worth writing, or does this room
offer two cards at a long dinner?**

---

## D. THE ANNIVERSARY, WHERE THE HOUSE MADE THE CALL

Her ruling was *"let every room have a game"*, and seventeen of the nineteen
anniversary forbids came down on evidence: every note that carried a reason
gave a HEADCOUNT reason, `guest_count_band` is a separate answer with `two` as
one of eight values, and `minGuests` already enforces the thing those notes
were protecting. The full argument and all nineteen original sentences are in
the block comment at the top of `src/lib/games.ts`.

**Two were kept, and both are the house's reading rather than hers.** They are
here because a kept forbid is as much a ruling as a lifted one.

### 10. Let's Make a Deal at an anniversary

Kept. An anniversary is one evening, honoured, and `occasion_shape` calls it
quieter than a birthday. This game puts a compere, a running order and a ticket
market between the room and the two people the evening is for. That argument
holds at forty guests as much as at two, which is why it survived when the
headcount arguments did not.

### 11. The Secret Auction at an anniversary

Kept. It is the pool's loudest ending and it ends a night on a bidding war,
where an anniversary ends on the two people. Same shape as above.

**The question on both: is that right, or is a twenty-five-person anniversary
just a party and entitled to a game show?**

---

## E. ONE LEGAL QUESTION

### 12. Imposter's card describes the rule the game turns on

`db/010` grants the house exactly two rights over somebody else's game: name it
and point a host at it. It may not reproduce the rules, print a card, or write
how it is played. Everything written this pass respected that — the page is now
the host's own part and the link, and not one word of theirs.

The `description` field, which predates this and is the CARD a member reads,
says: *"A phone game. Everyone gets the same word except one person, who has to
get through the round without ever having heard it."*

That is either naming the game the way a person would name it to a friend, or
it is the game's central mechanic reproduced in a sentence. It was **not
changed** — rewriting her card copy on a legal opinion nobody asked for is
worse than asking.

**The question: does that sentence stay?** If it goes, the card can name it as
a phone game the room plays and stop there, and nothing else on the page moves.

---

## What is NOT here, and why

**Everything that could be recovered from a runbook was promoted, not
escalated.** The auction never said how a bid works; the answer was three steps
down its own runbook and is now on the page. The scavenger hunt's tie-break,
the secret cards' proof rule and both of its endings, the same. Those were not
questions, they were writing in the wrong document.

**Anything that could be looked up was looked up.** Fishbowl is the only game
in the pool with rules outside this house, and what the search settled is
written into the row rather than into this list. What it could not settle is
items 4 and 5 above.

**Nothing here is a bug.** It is the list of places where a machine got as far
as a machine honestly can.
