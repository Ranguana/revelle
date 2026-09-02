# Refused take-home proposals

A ledger, deliberately NOT in `docs/atmosphere-idea-bank-v1.md`. That file is
a SEED SOURCE and every `##` in it is a room: `scripts/seed-bank.mjs` reads
the headings and refuses one it does not recognise —

    "REFUSED, 2026" is not a room this catalogue knows.
    An unknown heading is a decision, not a typo.

which is exactly right, and is how this ledger got its own file. A record of
what was refused is not a room, and putting it inside the source made the
seeder read a decision as a mistake.

## 2026-09-01 — three take-home proposals

Her ruling, verbatim: **"no on the following: marked cork, corno,
confetti/sugar almonds."**

Removed from the sheet rather than left in draft, because a draft row is a
question still being asked and these are answered. The clauses are preserved
below with the questions they carried, per rule 14 — a refusal keeps its
reasoning, and the next person to propose one of these should read why it did
not survive rather than re-derive it.

Two of the three carried a doubt the drafter had already named, and she
agreed with the drafter:

- **the corno** — `the corno — take-home, a small red horn charm, the ordinary kind against bad luck, one per guest (FOUNDER-PENDING — is this kitsch or is it material culture, it is genuinely period and genuinely Neapolitan and it is also the most souvenir-shaped object on the sheet);`

- **the confetti, in a twist** — `the confetti, in a twist — take-home, sugared almonds in a paper twist, a few each (FOUNDER-PENDING — flagged against itself as pan-Italian rather than this coast, which is precisely the country-not-room failure the matrix exists to catch, probably cut);`

- **the marked cork** — `the marked cork — take-home, THE EVENING SUPPLIES IT (per guest; from the_drinks yields_cork), the cork off the loud opening, with the date on it in pencil, kept by whoever caught it (FOUNDER-PENDING — the cork is native here because the cork is this room's act and St. Moritz gets the wire cage instead, is that split right, and the ratio is one cork per bottle rather than one per head which per_gu`

**Note the confetti's own clause called it: "probably cut."** The drafter
flagged it as pan-Italian rather than this coast — "precisely the
country-not-room failure the matrix exists to catch" — and the founder
agreed. A proposal that argues against itself and is then refused is the
FOUNDER-PENDING mechanism working exactly as designed, not a wasted row.

**These will not return on a reseed.** `scripts/seed-bank.mjs` creates rows
from this document; an item that is not here is not created. Deleting the
row at the desk without removing it here would have brought it back on the
next deploy.

---

## 2026-09-02 — two rulings that move objects rather than kill them

### The shell candles are LIGHT, not a take-home

Founder: **"for the shell candles, these would be all over the table or the
house already as candles."**

So the object is not one-per-guest to carry home. It is many, distributed —
down the table and through the house — and it belongs to the room's LIGHT
rather than to its goods. `scripts/mood-board.mjs` reached the same placement
from the photograph alone, proposing `light` on New York before this ruling
was made, on the grounds that the oysters are opened on the counter as people
arrive and the shells are there anyway.

That also settles the question the tool raised — pour from the party's own
shells, or ship them pre-poured. Light that is *"already all over the house"*
cannot be a favour bag. It is `THE EVENING SUPPLIES IT`, the mechanism
seventeen items already use.

### The corno, the painted tile and the rosolio may be PRIZES

Founder: **"i wrote a note about the corno, painted tile and rosolio that
maybe these would be prizes in games."**

**This supersedes the corno's refusal recorded above** (rule 14 — the refusal
and its reasoning stay, and this is what beat it). The corno was refused as a
per-guest take-home. It is not refused as a prize, and the distinction is not
a technicality: the objection was *"the most souvenir-shaped object on the
sheet"*, which is a defect in something thirty people carry home and precisely
the point of a joke prize.

**There is already a game shaped for this.** `amalfi-the-five-prizes`:

> "Five prizes, wrapped, in a row on the table from the start of the evening
> where everybody can see them. They ascend: the first is a joke and the fifth
> is genuinely good."

Its `materials` line says "five wrapped prizes" and has never said what they
are. The prizes were never authored.

Each of the three answers its own pending question by moving:

- **the corno** — souvenir-shaped is a defect in a take-home and the joke at
  position one.
- **the painted tile** — "cost per tile at crowd scale, and whether
  hand-painted survives that scale" stops mattering at one tile.
- **the rosolio** — "at crowd this is the most expensive thing on the list and
  it is alcohol, does it survive the guest count" — a prize is one bottle and
  one winner, so the question does not need answering, it stops applying.

**Not acted on.** Two prizes of five are still unauthored, and whether the
liqueur can be the fifth prize while also being the room's closer is a real
question nobody has asked yet. Filed, not built.
