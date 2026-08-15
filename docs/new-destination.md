# Adding a destination — the protocol

What a new destination needs before it can be offered to anybody, in order,
with the reason for each step. Nothing here is ceremony: every item is
something that has already gone wrong once.

A destination is a **look** and a **voice**, and a pool of things scoped to it.
Miss any part and it fails in a specific way named below.

---

## 1. The writing, first

Author it in `src/lib/destinations.ts` to the standard of WESTHAMPTON, 1976
and HAVANA, THE SMALL HOURS. The complete object: key, name, tagline, premise,
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
- **No period kitsch.** Where a year genuinely helps, use it. Where it would be
  somebody else's country as a playground, use an hour instead — that is why
  Havana is THE SMALL HOURS and not 1957.

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
