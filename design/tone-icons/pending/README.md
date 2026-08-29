# Drawn, not yet shipped

**Empty as of 2026-08-29.** All nine marks that waited here have shipped.

This directory is the holding bay for art that is CUT but whose tone is
still `draft: true` in `src/lib/voice.ts`. It exists because
`src/lib/voice.test.ts` enforces the vocabulary in BOTH directions: a
shipped tone must have a mark, and **a mark must not exist for a tone no
host can be shown**. Its words: *"an unclaimed drawing is how a retired
tone comes back."* That guard is right, and it is one of the few in this
codebase that has always worked.

So the art waits on the rooms rather than the other way round. To ship one:
clear its `draft` flag in `voice.ts`, move the file up one directory, run
`npm run build:tone-marks`, and register a destination that claims it —
all four in the same commit, because a promoted tone claimed by no
registered room fails a different assertion.

## What has gone through that gate

- **2026-08-27** — `toasts_everything`, `bigger_every_telling`, with
  `ACAPULCO_1959`.
- **2026-08-29** — the nine this file used to list, in one commit with the
  last five rooms:
  `feeds_you_first`, `eat_before_you_speak`, `marvels_out_loud`,
  `the_same_stories`, `finishes_your_sentences`, `shows_you_things` (with
  `AMALFI_1953`); `closes_the_bar`, `up_early_anyway` (with `ASPEN_1994`);
  `fluent_in_everyone` (with `PALM_SPRINGS_1965`). `OAXACA_1954` and
  `ST_MORITZ_1984` owed no art at all — every tone they claim had already
  come up with an earlier room in the same commit.

## What is still draft, and has no art here

Two tones carry `draft: true` and are **not** drawn: `never_impressed` and
`always_next_sunday`. No registered room claims either, so neither may be
promoted — a cleared flag with no claimer fails *"every tone is claimed by
at least one destination"*. They are words waiting for their rooms, which
is the state this flag is for. Do not cut art for them ahead of the room
that wants them; that is how a drawing arrives before the decision it
illustrates, and this directory is the answer to that, not an invitation
to it.

The directory stays. Emptiness here is the catalogue having caught up, not
a folder that has outlived its job — the nineteenth room will very likely
coin a tone before it is wired, and this is where its mark waits.
