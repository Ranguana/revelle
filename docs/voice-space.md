# Voice space — the founder's account, filed verbatim

**Hers, 2026-09-06, transcribed the session it was given**, per the rule
`docs/deliverables-sheets.md` establishes: founder material that lives only in
a conversation is indistinguishable from an agent's invention to everybody who
comes after.

**It arrived as the answer to a question that had been asked wrong.** Hong Kong
1963 sits two cells from New York on the matrix, and the room had been kept
legal by a researched detail — water counted at a party in a drought. She had
already refused that (`CLAUDE.md` rules 34 and 35). The open question was
whether Hong Kong was therefore a register on New York. **This is her answer:
it is neither a register nor a room that needs a third structural difference.
It is a room that needs a different mouth**, and the mechanism is one the house
already has and has already proved.

**Nothing below is edited.** The only change is that two tables arrived with
their formatting flattened by the paste and are set here as tables. Where a
line contradicts something already in the repository, the contradiction stands
and is recorded rather than reconciled.

---

Voice space is where people live. The matrix is where the evening's shape
lives. The file says that in one sentence: facets describe the evening;
properties of her people belong to the tone tiles and are measured here, never
there.

That split is why Hong Kong and New York can be different nights while sitting
close on nine evening cells. Everything a guest hears is this space.

## Two layers, because one does not work

**Tones — what she taps.** About fifty tiles a host can picture a friend doing:
talks in in-jokes, says less than it means. Grouped so a phone is a browse, not
a wall.

**Voice facets — what those taps resolve to.** Five axes:

| Axis | Kind | What it is |
|---|---|---|
| Formality | one of five | ceremonial → familiar |
| Address | one of four | you / they / we / the house |
| Humour | one of six | none, dry, deadpan, arch, warm, absurd |
| Cadence | one of four | clipped, unhurried, rapid, ornate |
| Manner | seven signed sliders | warmth, volume, irreverence, precision, knowingness, earnestness, theatricality |

Manner is bipolar on purpose. "Says less than it means" is not "quiet." It is a
claim against theatricality. A Vegas room that performs should lose points, not
merely fail to gain them. Weights are signed, never zero.

She never sees the axes. She taps friends. The taps become a vector. Matching
is then a set operation against how each destination is tagged.

A destination also states three things outright in its Voice object (formality,
address, humour). Those are derived, not hand-tagged twice. Cadence and manner
are tagged from the prose.

## The number people quote

`voiceAffinity` is cosine of two profiles, −1 to 1. Cosine so a host who taps
seven tiles does not beat one who taps two. Missing facets count as zero: no
claim.

The house already measured that this one number cannot do every job:

- Nineteen of twenty-six facets are one-hot. Disagreement adds zero, not a
  minus. So formality/address/humour barely move the score.
- The seven manner sliders dominate. Two warm rooms hit ~0.8 by arithmetic even
  when the mouths are different.
- A copied tone list with one stated facet flipped still looks like kinship on
  cosine.

So they split the instrument (same idea as "two numbers that each mean
something"):

| Number | What it refuses |
|---|---|
| **STRICT 0.58** | Twins and structurally close pairs (*d* ≤ 2). Observed max of the wired field (Nantucket/Portofino). Havana/NOLA is 0.172 — plenty of room. |
| **MONITOR 0.92** | Distant pairs that are still an echo (same stated triple, same hand). |
| **Tone-hand overlap 0.80** | Copied tile list, ignoring weights. Sharing more than 80% of the smaller room's codes. |
| **Same stated triple** | Same formality + address + humour. Cosine is blind to this; the test is not. Aspen/Catskills is the live case. |

Old "0.65 everywhere" was a round number above the field. It was not a
measurement. `check:voices` is the audit. Do not quote a scratch cosine.

## What voice space is for

- **Match her people to a mouth.** Warm group + deadpan invitation reads as
  cold. Palette cannot fix that.
- **Split twins.** Same evening shape, different world. Havana vs New Orleans
  is the proof: distance 1 on the matrix, affinity 0.172. That is the mechanism
  HK/NY should use instead of a drought cell.
- **Catch an echo.** Someone rewrote Portofino with two tones swapped. Hand
  overlap and the stated-triple test catch that when cosine will not.

It is not for proving two snapshots are different cities. Year, plate, print,
lexicon do that. Voice only has to be a different mouth.

## How a room gets a voice

1. Write the evening (or admit the shape is shared).
2. Write the Voice object: speaker, address, register, formality, cadence,
   humour, lexicon, banned, rejected.
3. Pick six to ten tones, each pointed at a line of that prose. Overlap on one
   tone group is texture; overlap on three is a duplicate name.
4. Run `check:voices`. If you sit above 0.58 with a close-shaped neighbour, the
   mouth is not doing the twin's job.
5. Do not write voice and row in one pass. Do not park the only unique fact
   here while the row scrapes a gate you have already decided is the wrong
   test.

Influencer path: her answers are tones and manner, not nine matrix cells first.
The GUI should collect the same axes. The house still signs the object.

## The honest limit

Voice space does not contain Hong Kong. It contains how Hong Kong speaks. If
two rooms share a mouth, the box will feel like one product with two postcards.
If they do not, a guest can live in the same evening shape and still know which
night they are in. That is the whole mechanic.
