# Acapulco 1959 and Oaxaca 1954 — verification result

**NOT INTEGRATED. Both fail the voice-separation test as tagged.** The drafts are
in this directory. Nothing has been written into `src/lib/destinations.ts`,
because doing so would fail `npm test`.

## 1. Tone tags — all 14 are real

No substitutions needed. Every proposed code exists in `TONES`.

## 2. Voice affinity — four breaches of the 0.65 ceiling

`voice.test.ts` asserts that no two destinations exceed **0.65**. As tagged:

| pair | affinity |
|---|---|
| Oaxaca / **Catskills** | **0.876** |
| Oaxaca / Havana | 0.760 |
| Acapulco / Havana | 0.682 |
| Acapulco / **Oaxaca** | 0.676 |

The cause is mechanical and is the retro-tagging trap in a new coat: **the tags
were chosen from what each voice IS, not from what separates it.**

- Four of Oaxaca's seven are Catskills' tags: `nicknames`, `in_jokes`,
  `sentimental`, `teasing`.
- Four of Acapulco's seven are Havana's: `good_natured`, `laughs_first`,
  `lingers`, `says_it_out_loud`.

## 3. The prescribed fix was tried and did not work

Re-tagging toward the stated distinguishing axes — Acapulco theatricality-
positive, Oaxaca pace/familial — produced DIFFERENT breaches, not fewer:

| | worst pair | new-room breaches |
|---|---|---|
| as drafted | 0.876 Catskills/Oaxaca | 5 |
| re-tagged as prescribed | **0.864 Las Vegas/Acapulco** | 5 |

Theatricality-positive IS Las Vegas's territory. Pace/familial is Tahiti's,
Nantucket's and Catskills'. Every direction these two rooms move in is occupied.

**No further tag combinations were tried on purpose.** Searching for a tag set
that passes the test is optimising to a number rather than tagging what the
voice says, which is the exact failure this project exists to escape.

## 4. The structural reason

Every one of the 51 tones is claimed by at least one of the twelve rooms, and
**35 are claimed by exactly one**. So the distinctive tones are the ones that
pull hardest toward their owner, and the shared ones (`unhurried` at six rooms,
`comfortable_silence` at four) are shared because they are generic. There is no
empty region to move into.

This is the voice-space version of the finding that blocked Rio: the corner is
full.

## 5. The tension the founder has to resolve

Two rules in this repo now contradict each other at eighteen rooms:

> **The founder, on this work:** "the fix is re-tagging toward each room's
> distinguishing axis, not loosening anything."

> **`src/lib/selection/types.ts`, on the sibling threshold:** "REFIT IT WHEN THE
> LIBRARY GROWS. The right number is a property of how densely the catalogue
> covers the voice space, not a constant of nature."

The 0.65 ceiling was set against **thirteen** destinations. Adding six rooms to
the same 26-facet space raises every pairwise affinity mechanically. Either the
ceiling refits as the library grows — which the code anticipated in writing — or
eighteen rooms do not fit in this voice space and some of them cannot coexist.
Re-tagging cannot resolve that, and this document does not choose.

## 6. The twin claims are STILL unmeasurable

Writing these two verified nothing about their twins. **St. Moritz 1984 and
Aspen 1994 have no voice and no tone tags**, so:

- `acapulco-1959 / st-moritz-1984` — cannot be measured
- `oaxaca-1954 / aspen-1994` — cannot be measured

Both twin pairs remain zero-of-two written. The condition exists to guarantee
the other instrument can separate the pair, and for both pairs that guarantee is
entirely deferred.

## 7. Stated triples — both unique

The founder's mode names were mapped to the real enums:

| room | as written | mapped | collides? |
|---|---|---|---|
| Acapulco | cordial / direct / delighted | `cordial` / `second_person` / `warm` | unique |
| Oaxaca | plain / familial-imperative / fond | `plain` / `second_person` / `warm` | unique |

`direct, demonstrative` → `second_person`; `delighted` and `fond` both → `warm`,
the nearest real humour mode. **Neither "delighted" nor "fond" exists in the
enum**, and mapping both to `warm` is a loss the founder should see: it takes
`humour = warm` to five of fourteen rooms, thinning a stated axis that
`statedVoiceFacets` derives from.

## 8. Outstanding debt

The bijection test needs a host group per destination. Two are owed for these
rooms, and two more for St. Moritz and Amalfi when their voices land.
