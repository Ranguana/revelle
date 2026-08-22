# Adding a destination — the protocol

What a new destination needs before it can be offered to anybody, in order,
with the reason for each step. Nothing here is ceremony: every item is
something that has already gone wrong once.

A destination is a **look** and a **voice**, and a pool of things scoped to it.
Miss any part and it fails in a specific way named below.

---


## 0. THE ADMISSION TEST — before a word is written

The catalogue grows continuously, so a destination is ADMITTED before it is
authored. Every step below happens in this order and the first failure stops the
work. This exists because writing a room and then discovering it duplicates an
existing one wastes the expensive half.

### 0a. Claim a row in the matrix

Fill in all eight facets from `docs/destination-contrasts.md` for the room you
intend to write. Eight cells, before any prose:

`arrival` · `schedule` · `volume` · `dress` · `food` · `ending` · `starts` · `size`

No blanks. A blank is a destination abdicating from a distinction, and it will
be the one that never wins or always wins.

### 0b. Clear distance 3 against EVERY existing row

The room must differ from every already-authored destination on at least three
facets. Three is the coding bound that lets one wrong quiz answer still land the
host correctly; at distance 1, a single misread tap flips the result.

**Below 3, the room is not admitted.** The options are to re-place it in open
space, or to conclude it is an existing room written twice — which is what
happened to CAP FERRAT, and folding it in was the right outcome rather than a
defeat.

### 0c. Know that there is plenty of room, and place deliberately

The facet space holds **about 131 rooms** at minimum distance 3. Twelve are
authored. So a collision is never the matrix running out — it is a room written
into an occupied slot while a hundred sat empty.

Two consequences. A destination that fails 0b should be MOVED rather than
argued for. And a new room is cheapest to write when its row is chosen first, in
open space, and the voice is written to the row.

### 0d. Pass the thrown-ness test, which the matrix cannot check

**A premise must read as a party somebody is THROWING, not a scene that
OCCURS.** Weather, a view, or a place behaving as itself is not a party. A row
can clear distance 3 against every other room and still describe a postcard.

Rows are arithmetic. Thrown-ness is voice. Both must pass and neither
substitutes for the other. The founder audits the second.

### 0e. Declare what the deliverable presupposes

If the room cannot be delivered without a feature of the venue — water, snow,
outdoors — say so now. Venue never touches the DESTINATION CHOICE, which is the
thesis of the product, but a room whose whole content prunes away in an
apartment ships hollow and nobody is told.

A room that presupposes many features is probably a location rather than a
world, and that is worth knowing before it is written.

### 0f. If it fails, record the block and stop

A refused destination gets its proof written down, not a shrug — see RIO DE
JANEIRO 1947 in `docs/destination-contrasts.md`, which is blocked with the
distances that block it and the two conditions that would release it. A block
with a proof is reusable. A block without one gets re-litigated every quarter.

## 1. The writing, first

Author it in `src/lib/destinations.ts` to the standard of WESTHAMPTON, 1976
and HAVANA, 1957. The complete object: key, name, tagline, premise,
look, voiceVersion, and the whole voice — speaker, address, register,
formality, cadence, punctuation, orthography, humour, lexicon, formulae,
banned, signOffs, always, never, breaksCharacterFor, exemplars, and `rejected`.

**`rejected` is not decoration.** It is where the obvious bad line goes, with
the reason it was cut, so nobody writes it back in six months from now. Havana
records the 1957-casino version there; Westhampton records four.

**The tagline follows the house rule:** a place and a time, then two concrete
details, never an adjective naming the feeling. Test it against the examples
in `docs/copy.md`.

**Two rules that catch every destination set somewhere real:**

- **No accent on the page.** The house speaks as a house — not as an
  impersonation of a nationality. Real nouns are the opposite of caricature: a
  courtyard, a fan, the ice, the last coffee. A real name is a fact; a spelling
  that performs an accent is a costume.
- **No period kitsch.** Every destination is pinned to a year, because the year
  is what fixes the register the voice is written in. The year is a period, not
  a pitch. Havana is named 1957 and is still forbidden to write "the last good
  year" — where a date would turn somebody else's country into a playground,
  the ban belongs in that destination's `rejected` list, not in its name.

## 2. The tones, chosen against the whole library

Six to ten of the 51 in `src/lib/voice.ts`, added to `DESTINATION_TONES`, with
a comment pointing each tag at a specific line of that destination's voice.

This is the join between a host's taps and the library, and it only works if
the destinations **spread**. So:

- Check what is thin before choosing. Ten destinations that are all dry and
  unhurried make the tone question decorative.
- **The overlap rule:** two destinations may share tones on one axis, but must
  then differ on at least two other groups. Overlap on one axis is texture;
  overlap on three is a duplicate wearing a different name.
- `src/lib/voice.test.ts` asserts no two destinations sit within a small cosine
  of each other. If the new one trips it, the tags are wrong — not the test.

## 3. The plate

A poster in `src/app/plates.tsx` and an entry in `src/lib/library.ts` with an
unused `No.`. Tokens only, never a literal hex: a poster that names a colour
can drift from the palette and cannot be repainted.

## 4. The content, in her four documents

Each is a markdown file the seeders read directly, under a `## Heading` that
matches the destination.

| file | shape |
|---|---|
| `docs/menus.md` | dishes in order · what it's for · season · how much making |
| `docs/drinks.md` | cocktails · **mocktail mirrors** · what it's for · season · how much mixing |
| `docs/dishes.md` | ~50: 18 appetizers, 18 mains, 14 desserts. `name · B/H/M` plus a season only where it binds |

**How much making has exactly three values** — *actually made · half made ·
bought and arranged* (the bar says *actually mixed · bought and poured*). One
axis across the whole catalogue, so one answer from a host governs the table
and the bar together.

**Every drink carries its mocktail mirror.** Same glass, same components,
arriving at the same time — so nobody at the table is visibly not drinking.
The schema will not accept a drink without one.

## 5. Register the heading — the step that fails the deploy

Add the `## Heading → slug` line to `DESTINATIONS` in
`scripts/catalogue-vocabulary.mjs`.

The seeders **fail on an unknown heading rather than skipping it**, which is
correct — a typo in a destination name silently dropping a menu would be far
worse — but it means a new section without a map entry fails the pre-deploy
step and blocks the deploy. This has already nearly happened once, with
Portofino.

## 6. Check the coverage, or it is invisible to half your hosts

A destination is only available to a host whose answers it can actually serve.
Before calling it done, check the spread across the three axes the engine
selects on:

- **Occasion** — a long dinner, standing drinks, a lunch, a brunch, a late
  supper. Four menus that are all long dinners is one menu.
- **Season** — a year-round destination needs a winter table and a summer one,
  or it is unavailable for half the year.
- **How much making** — **this is the one that gets missed.** A destination
  whose menus are all *actually made* is invisible to a host who said she wants
  everything to arrive finished. She will be matched to it and find nothing on
  the table she can have. Every destination needs at least one of each.

## 7. Seed, then say yes

```
npm run seed:destinations     # look, voice, tones
npm run seed:menus
npm run seed:drinks
npm run seed:games
npm run seed:destinations     # again: adopts stubs the content seeders made
npm run activate:catalogue    # dry run; add -- --yes to apply
```

On the live site this runs inside Render — the database has no public access —
either as the preDeployCommand or via `POST /api/desk/seed`.

Everything arrives as a **draft**. That is deliberate: deciding something is
offered to a customer is a curator's decision, not a script's. `activate` is
how you say yes, and it is a separate gesture on purpose.

## 8. The gate that cannot be bypassed

**A destination is published only if it has a published voice.**

A house with a look and no voice cannot write an invitation, a menu card or a
place card — there is nothing to write it in. Generation will still propose it
and record it as a catalogue gap, which is how the authoring queue gets
written; approval will refuse it, in words a curator can act on.

So a half-finished destination is safe to have in the library. It simply
cannot be given to anybody until the writing is done.

---

## The order that actually works

The catalogue may lead. Havana was the first destination the catalogue asked
for rather than the other way round: two menus and two drink programmes were
authored before it had a name, and the voice was written **to them** — the
late supper after dancing is the fact the whole destination is built on.

That is a good order. Write the food and the bar, see what the place turns out
to be, then write the house that serves it.
