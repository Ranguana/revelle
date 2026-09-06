# Adding a destination — the protocol

What a new destination needs before it can be offered to anybody, in order,
with the reason for each step. Nothing here is ceremony: every item is
something that has already gone wrong once.

A destination is a **look** and a **voice**, and a pool of things scoped to it.
Miss any part and it fails in a specific way named below.

---


## 0. THE ROW — follow `docs/room-structure.md`

**The row formula lives in `docs/room-structure.md`. Go there first, do all
twelve of its steps, and come back here at §1.**

This section used to hold the row work and is replaced rather than edited,
because it was wrong in two ways that a drafter could not see from inside it.

**It said eight cells. There are nine.** `spectacle` was adopted after this page
was written and never added, so a row drafted from §0a arrived one column short
— and a short row is not a caught error, it is a silently different distance to
every other room.

**And it called itself an admission test.** It is not one. **A world is admitted
when a person moves the slug onto `authored`. Matrix green is a precondition,
not the act.** The old heading invited the reading that a clean distance table
had authored something, which is the exact failure `room-structure.md` was
written to stop.

`room-structure.md` ends at its step 12 — `docs/proposals/rooms/<slug>.md`
written, nothing seeded, nothing signed. **This page begins after that**, and
begins after a founder pass. The two are deliberately not merged: a drafter
working one continuous document reaches the voice object having never been
stopped, and the gate that should have refused the row reads as a formatting
step it already cleared.

### The distance the gate is written in — and the one it is not

Corrected here because the old §0b conflated two different instruments, and the
conflation is the reason "one wrong tap" gets quoted as an argument for the gate.

**CATALOGUE HAMMING is room-vs-row.** Symmetric, all-or-nothing per cell, no
weights, owned by `src/lib/matrix.ts` and reported only by `npm run check:matrix`
(rule 7). It is what `gate: 3` is expressed in. Three is a **designed minimum**
in the BCH sense — a law chosen so that one substitution cannot turn Portofino
into Côte d'Azur without a declared seam. It is not a decoder and there are no
parity bits; see the "Designed distance, not a decoder" section of
`room-structure.md`, and do not add a column to raise it.

**HOST-VS-ROW SCORING is a different instrument.** It lives in
`src/lib/selection/structure.ts`, it is **asymmetric**, it has a NEAR band, and
it compares a member's stated answers against a room. Its own comment says so:
"The matrix's own distance is Hamming ... Nothing below changes it."

The old sentence — *"three is the coding bound that lets one wrong quiz answer
still land the host correctly; at distance 1, a single misread tap flips the
result"* — describes the second instrument and offers it as the reason for a
threshold in the first. **A host's mistap is scored by `structure.ts`, which the
gate does not govern**, and the gate defends room-vs-room separation whether or
not anybody ever taps anything. Kept here rather than deleted (rule 14) so the
argument is not re-made from the same confusion.

The same sentence stands, uncorrected, in `docs/destination-contrasts.md` § "The
audit" and is reported rather than edited: that page is argument and is scoped
separately.

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

Six to **thirteen** of the **64** in `src/lib/voice.ts`, added to
`DESTINATION_TONES`, with a comment pointing each tag at a specific line of that
destination's voice.

*(Was "six to ten of the 51" — stale in both numbers, and stale in the direction
that costs: a drafter reading it under-claims by three tones from a vocabulary a
fifth larger than stated. The bound the build actually enforces is
`tones.length >= 6` and `DESTINATION_TONE_MAX = 13` in `src/lib/voice.test.ts`;
the vocabulary is 64. Corrected 2026-09-06, same class of staleness as §0a's
eight facets.)*

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

## 4. The content, in her documents

Each is a markdown file the seeders read directly, under a `## Heading` that
matches the destination.

| file | shape |
|---|---|
| ~~`docs/menus.md`~~ | **RETIRED. Do not write one.** The menu pool was retired by `db/045`; a new section here seeds `discontinued` and reaches nobody. The composed table draws from `docs/dishes.md`. Left in the table rather than deleted so the next drafter knows it was retired and not forgotten (rule 14). |
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
