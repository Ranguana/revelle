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

### 9. Westhampton at a dinner party — ANSWERED, AND THE QUESTION IS GONE

**SETTLED 2026-09-06.** This section asked whether a third dinner-party game
was worth writing for one room that offered two. It has been overtaken: she
lifted every forbid in the catalogue, so the two the room offered became eight
and the count went from 161 of 162 room × occasion pairs to **162 of 162**.

The old table is kept below because it is the evidence, and because each line
is a sentence somebody may want to argue for again:

| | |
|---|---|
| art battle | was forbidden at a dinner party — twenty minutes of painting is twenty minutes nobody is at the table |
| reverse scavenger hunt | was forbidden — nobody leaves the table |
| secret game cards | was forbidden — there is no underneath at one table |
| the secret auction | was forbidden — a long dinner ends with dessert at midnight |
| the houseguest list, this room's own | was forbidden — it runs for three days |
| **imposter** | **was forbidden at this room specifically** — no links, no apps in 1976 |
| let's make a deal | eligible then and now |
| fishbowl | eligible then and now |

Founder, reading the second line back:

> *"regarding your game questions, lets clear something up - there is no way a
> game shouldnt be offered bc somewhere the revelle is nobody leaves the table
> - that shouldnt be a rule in the first place"*

and on the last:

> *"also forget this limiting rule that we have to be era specific and cannot
> have later tech"*

The paragraph that stood here — "every one of those forbids is argued on its
own terms and none of them is a headcount claim, so none was lifted" — was
true about the arguments and wrong about what they were allowed to do. A
room's CHARACTER may not veto a game. What may still prune one is
`minGuests`, `maxGuests`, the venue affordances and the requirement kinds:
the constraint door, which is the venue rule (CLAUDE.md rule 2) read onto
games. See EVERY FORBID LIFTED at the top of `src/lib/games.ts` and db/066.

---

## D. THE ANNIVERSARY, WHERE THE HOUSE MADE THE CALL — AND WAS OVERRULED

Her ruling was *"let every room have a game"*, and seventeen of the nineteen
anniversary forbids came down on evidence: every note that carried a reason
gave a HEADCOUNT reason, `guest_count_band` is a separate answer with `two` as
one of eight values, and `minGuests` already enforces the thing those notes
were protecting.

**Two were kept on a register argument rather than a headcount one, and both
were the house's reading rather than hers. She lifted both the next day.**

> *"a twenty-five-person anniversary is just a party and entitled to a game
> show. it is not a two person event unless the host says it is and then
> obviously it is not the right game"*

### 10. Let's Make a Deal at an anniversary — LIFTED

The house's argument, kept per rule 14: an anniversary is one evening,
honoured, and `occasion_shape` calls it quieter than a birthday; this game
puts a compere, a running order and a ticket market between the room and the
two people the evening is for.

**What beat it:** an occasion is not a headcount. `db/009` defines the
anniversary as "one evening, honoured" and says nothing about two people. The
forbid fired on the NAME of the occasion regardless of who was coming, which
made it a second authority over a fact the guest band already owns — and the
one of the two that could be wrong. Her second clause is the proof the
mechanism was already right: when she does say two, `minGuests` refuses the
game show on its own.

### 11. The Secret Auction at an anniversary — LIFTED

Same argument, same answer. It is the pool's loudest ending and it ends a
night on a bidding war where an anniversary ends on the two people — true, and
not a reason it cannot be offered to twenty-five people.

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

## F. WHAT THE CATALOGUE CANNOT ANSWER YET

### 13. There is no karaoke game

**Founder, 2026-09-06,** on what the play question should learn: *"we want to
know if they like games, like karaoke, impromptu theater/gorilla theater,
group games, board games... hate games."*

Three of those are now tiles with real tags behind them — `theatre`,
`board_games`, `group_games`. **Karaoke is the fourth and it has no game.**

The tile resolves to `perform` — "Sing badly, on purpose" — which twelve games
carry, so her tap is not wasted and it reaches the performance games: doing
somebody's voice, telling a story wrong on purpose, One Of Them Is Lying,
Fishbowl. A `karaoke` code was refused because it would have been a second
owner of one fact (rule 21) reaching nothing at all (rule 16).

But NOT ONE GAME IN THE CATALOGUE IS SINGING. That is an authoring absence and
never a property of the pool (rule 29), and it is the kind of absence that
looks handled: the question is asked, the answer resolves, and a host who says
her people do karaoke is offered charades.

**The question: is a singing game worth writing, and is it a house game or one
room's?**

---

### 14. The camp's charades — she named the game and the house wrote all of it

**Founder, 2026-09-06:** *"give charades to catskills."* Four words, and they
are the whole of what is hers in `catskills-what-happened-today`. Every other
room game quotes a sentence she wrote under `HER RULE, VERBATIM:`; this one
declares `NO RULE OF HERS:` instead, and `games.test.ts` reads that heading so
the difference cannot blur.

Three decisions in it are the house's and each is arguable in one line:

1. **Every slip is something that happened today, seen by at least two
   people.** This is what makes it the camp's game and not charades with a
   name on it — and it is also the constraint that makes it unplayable by a
   room that was not together all afternoon.
2. **Nothing is scored and nobody wins.** — **ANSWERED, AND OVERRULED.**
   See below.
3. **There is no clock.** A turn ends when it is got or when the actor sits
   down, whenever she likes. **Still the house's, still standing.**

**The question was: is a charades that nobody wins still the game she meant?**

**Founder, 2026-09-06: *"groups do win charades."* The answer is no.**

The house's reasoning is preserved rather than deleted (rule 14), because the
way it was wrong is the useful part. It argued from Catskills' own never-line,
*"never make the swim test a competition, and never write a rule that somebody
could fail"*, and read it as a ban on scoring. That is an over-reading in two
separate ways:

- **The competition half is about the swim test**, a game refused in db/065 the
  same day. It was never a general rule against games having a result.
- **The failure half survives and is not the same claim.** A side that loses a
  night of charades has not failed anything. The line forbids a rule a *person*
  can be measured against and found short — which is what a swim test is, and
  is not what a score is.

So the rewrite is built to the surviving half rather than around it: the two
sides are the table split where it is already sitting, **nobody is picked and
nobody picks**, and if the number is odd the office takes the short side. The
one place a person could have been made to fail is team selection, and the
design removes it.

What carried through unchanged: the slips written before dinner, six words,
two witnesses; the deal that stops anyone acting her own; no words and no
mouthing; no pointing and nothing picked up off the table; no clock; the
ledger; and the bell as the last slip, guessed in four seconds, which is how
the game ends rather than merely stops. The bell is now said by both sides at
once and counts for both, so the ending stays exactly as authored and moves
nothing.

One consequence beyond the prose, because it is the kind of thing that goes
unnoticed: the game carried a **`compete` facet at weight −0.4**, a deliberate
negative whose note said *"nothing is counted and nobody wins, so a room that
says it gets genuinely competitive should be offered something else."* That
arithmetic was correct against the old draft and is backwards against this one.
It is now **+0.5** — positive, but not maximal, since the sides are the seating,
there is no clock, and the prize is a line in a ledger. Left at −0.4 it would
have hidden a competitive game from the one host who asked for one.

### 14b. The field day — the part of her ruling a migration cannot fill

**Founder, same day:** *"re catskills multi day event gets all the field day
games."*

The structural half is done: `db/067` puts the multi-day occasions back on
`per_day`, so a three-day getaway draws a game **each day**, three different
ones, each offered as three candidates. (Finding recorded there: `per_day` was
dead in production — the only rows that ever carried it were the three
`day_material` rows db/061 deleted — so this restores the mechanism as well as
the count.)

**What it cannot do is supply the games.** Catskills has exactly **one** native
game today, `catskills-what-happened-today`, after the swim test was refused in
db/065. A multi-day Catskills fills its other days from the world-agnostic pool,
which works and is not nothing. But *"all the field day games"* read literally —
**a named set, authored to this room, played in an afternoon, in the plural** —
is an authoring order, and rule 3 forbids inventing it from four words.

**The question: is the field day a set of Catskills games you want authored —
and if so, is it a set of separate games, or one game with events inside it?**
The distinction matters before anything is written: a field day with four
events is one slot, and four field day games is four.

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
