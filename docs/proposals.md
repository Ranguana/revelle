# Proposals ledger

**Nothing is admitted that is not in this file.**

Tone proposals, matrix cells and rules travel as PROSE between sessions and
surfaces, and prose does not survive a context boundary. Three artefacts were
acted on in this repo that never existed in it — a tone (`always_next_sunday`),
two voice documents (Aspen, Palm Springs prose), and a whole proposal round —
and one document arrived twice with contradictory contents, which was only
caught because the two versions disagreed loudly enough to measure.

So: paste it here, with a date, before it is acted on. A proposal that is not in
this file did not happen, however clearly it was said somewhere else.

| date | proposal | source | status |
|---|---|---|---|
| 2026-08-22 | `feeds_you_first`, `eat_before_you_speak`, `the_same_stories` — Oaxaca natives | founder, in-session | admitted, draft |
| 2026-08-22 | `marvels_out_loud`, `shows_you_things` — Acapulco natives | founder, in-session | admitted, draft |
| 2026-08-22 | `all_turn_to_watch` — third Acapulco native | **CC substitution** | **STRUCK.** Failed admission: "everybody stops and looks at the same thing" is a fact about whether there is something to watch, which is the EVENING. `spectacle` is already a matrix facet, so this was spectacle wearing a tile. |
| 2026-08-22 | `toasts_everything` — the founder's actual third Acapulco native | founder, out-of-session | admitted, draft. Passes cleanly: some groups raise a glass at any excuse and some never do, true of them at every party. |
| 2026-08-22 | `never_impressed`, `fluent_in_everyone`, `closes_the_bar` — St. Moritz natives | founder, in-session | admitted, draft |
| 2026-08-22 | `finishes_your_sentences`, `bigger_every_telling`, `up_early_anyway` — Aspen natives | founder, in-session | admitted, draft |
| 2026-08-22 | `always_next_sunday` — proposed as the Oaxaca/Havana fix | founder, **out-of-session** | admitted, draft. Replaces `lingers` in Oaxaca. **Did not clear the monitor**: 0.848 → 0.846. Kept because it is the better word for the room; the breach is recorded as kinship below. |
| 2026-08-22 | St. Moritz / Aspen voice document | founder, out-of-session | **arrived TWICE with contradictory tag sets.** Measured both rather than choosing: the coined set trips nothing, the borrowed set trips Aspen/New Orleans at 0.833. Acting on the coined version, which self-identified as superseding. |
| — | Aspen and Palm Springs PROSE | referenced, never received | **not in the repo.** Cannot be acted on. |
| 2026-08-22 | ATMOSPHERE as staging notes — per-destination, voice-derived, draft/published, constraint-tagged, NEVER SCORED, framed by the plannedness register. No floral/lighting/linen slot types; shoppable atmosphere joins via `staging_note_item` to canonical ingredient rows. All-or-nothing at assembly with authored fallbacks. | founder, in-session | specification recorded in `docs/atmosphere.md`. Awaiting sign-off; extraction from voice lexicons begins after. |
| 2026-08-22 | VOICE LAYER upgraded to per-destination voice packets, packet-prompted from one base model, QA'd against the 26-facet profile, with founder edits logged as preference pairs and per-destination fine-tune evaluation at ~200 accepted outputs. Full specification below. | founder, in-session | recorded. Not built. |

## Recorded as truth, not as a failure

**OAXACA 1954 and HAVANA 1957 are kin.** Voice affinity 0.846 against a monitor
ceiling of 0.80, and it did not move under an honest re-tag. Both are warm,
plain, cooked-for courtyard rooms where the night ends without anybody deciding.
That is a real relationship rather than an authoring defect, and the monitor tier
exists to surface echo-authoring — here it surfaced kinship instead.

Structural distance is 3, so routing is unaffected: a host is separated between
them by the evening's shape, which is what the structural layer is for.


## 2026-08-22 — Voice layer: per-destination packets

**Recorded, not built.**

### The packet

One per destination, and it is the whole context a generation gets:

- the **voice document** — speaker, address, cadence, formality, humour, mechanism
- **lexicon-required** — the house's own words, which must appear
- the **banned list** — its `never` rules and the `insteadOf` terms each lexicon
  entry displaces
- **founder-corrected surface exemplars** — real output, corrected by hand, per
  surface. Not invented samples

### Generation

**One base model, packet-prompted, with per-surface templates.** An invitation,
a menu card and a place card are different templates against the same packet.
The destination is not a fine-tune and not a system prompt fragment; it is the
packet.

### QA, before anything reaches a person

Generated output is checked against:

1. **the destination's 26-facet profile** — the same `VOICE_FACETS` vector the
   selection layer already computes, so the check is against the measurement
   that already exists rather than a second opinion about the voice
2. **lexicon-required** — did it use the house's words
3. **banned** — did it use any it must not

### Learning

**Every founder edit is logged as a preference pair, per destination and per
surface.** The pair is the generated text and the corrected text — which means
the correction is the training signal, and an edit that is not captured is data
destroyed.

### Fine-tune, and the bar for adopting one

Evaluation is **triggered per destination at roughly 200 accepted outputs**, and
a fine-tune is **adopted only on a blind comparison win** against the
packet-prompted base. Not on a metric, not on the author's impression of it, and
not because the tuning ran.

### What this requires that does not exist yet

**Edit capture.** Preference pairs cannot accumulate retroactively — a
correction made before the capture exists is a correction lost. Whatever is
built first, it should be the thing that records the before and after of a
founder edit, or the 200-output threshold starts counting from whenever that
lands rather than from now.
