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
