# Drawn, not yet shipped

Nine marks, cut to `../HANDOFF.md`'s spec, for tones that are still
`draft: true` in `src/lib/voice.ts`.

They are held here rather than beside the other 53 because
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

`toasts_everything` and `bigger_every_telling` went through that gate on
2026-08-27 with ACAPULCO_1959 and are shipped.
