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
| 2026-08-22 | DESCENT COURSE — one humble late plate, tagged `descent`, exclusive to till-morn rooms, arriving unannounced as the last-phase turn. And MUSIC SPLIT THREE WAYS — sequenced set (exists), playback equipment as a constraint-class question, and live answers routed to spectacle rooms as a booking instruction. Full specification below. | founder, in-session | recorded. Not built. |
| 2026-08-22 | WESTHAMPTON RE-FOUNDING — Eothen/Capote rather than Locust Valley; possible rename to THE HAMPTONS, 1976. Cells analysed, six clear rows found, nothing applied. Parked. | founder, in-session | **PARKED.** Analysis below so it is not lost. |
| 2026-08-23 | ATMOSPHERE IDEA BANK v1 — all eighteen rooms, founder-blessed. Routing rules, nine new content classes, per-room goods/acts/games/cards, and a ten-item founder-pending ledger. Copied to `docs/atmosphere-idea-bank-v1.md`. | founder | **in the repo.** Two schema gaps and one resolved pending item, below. |
| 2026-08-23 | TAGGING THE CATALOGUE IN `taste_direction` — **FOUNDER WORK, NOT A SCRIPT'S.** The dimension and its eleven facets have existed since db/002 and NOTHING has ever been tagged in one: not a world, product, menu, drink, dish, game or bank item. Meanwhile "which of these pulls at you" is MANDATORY and asks for two or three, and `facetOverlap` normalises by the vector's total mass — so her unmatched terms sat in the denominator and damped every term that DID match. Answering made her result worse. **The damping is stopped now**, by naming the dimension in `NON_TASTE_DIMENSIONS` (`src/lib/selection/vector.ts`), which is the remedy that file already documents for `environment`; her answer still reaches the catalogue-gap report through `vector.unscored`, so it now names per applicant exactly what the library is missing. **What is NOT done and is the founder's:** deciding which dishes are "faded coastal" and which drinks are "supper club" is an authored judgement over six hundred rows, and a sweep that guesses it is the thing the desk exists to prevent. The exclusion line in vector.ts comes out the day anything carries a tag, and it says so. | founder ruling, in-session | **HOTFIX SHIPPED, TAGGING PENDING — founder-review.** |
| 2026-08-23 | THREE MORE UNCLAIMED DIMENSIONS, FOUND BY THE SAME SWEEP — `occasion`, `play` and `food_service` were damping identically, and are excluded by the same line for a different reason: each is a CONSTRAINT already doing its work elsewhere (db/009's occasion eligibility, db/016's `no_games`, db/022's `no_seated_meal`), so unlike `taste_direction` none of them is waiting to be tagged and none should ever be. Recorded because CLAUDE.md rule 15 says orphans arrive in cohorts and the record of the whole sweep is the useful artefact. The catalogue is tagged in SIX dimensions and no more: `season`, `making`/`cooking`, `voice_tone`, `group_fun`, `anti_preference`, `mood`. | sweep, this session | fixed. Recorded for the record of what the sweep found. |
| 2026-08-23 | `arrival` AND `spectacle` — the two structural matrix columns still unfed after db/037. Ruled: they are wired by an INFORMATION-GAIN RE-SELECTION of the quiz — the question set reconsidered as a whole — and NOT by appending two more questions to the end of it. Both are also fingerprint-risk columns (`arrival = assigned` is the Catskills alone; `spectacle = performed` reaches two rooms of eighteen), so a question that reaches either names a room in one tap unless the set is designed around that. Recorded here so the two are not lost between the audit that found them and the pass that fixes them. `data/destination-matrix.json` carries the same finding per column in its `fedBy` block, with the reason each is not wireable from an answer she already gives. | founder ruling, in-session | **ruled and scheduled. Not started.** |
| 2026-08-23 | `rented_house` AS A QUIZ OPTION — proposed, and **NOT DONE, because the batch it arrived in cancels its own justification.** The case for it: the code is in the `environment_type` enum, it carries `provided = false` refusals that no host can currently trigger, and a rented house is someone else's floors. The check: those refusals are `noise_ceiling` and `deposit_safe` and THERE ARE EXACTLY TWO OF THEM, not three — and both are cut by db/039 in the same batch, on the founder's own ruling, because nothing in the catalogue ever claimed either. After db/039 a rented house affords precisely what a house affords, so adding the option would reach a venue layer with nothing left to say about it. It would also reverse a recorded decision in `src/lib/quiz.ts` — the option was retired because it asks "who owns the building — a fact that changes nothing the house sends" — and that argument is untouched by anything in the batch. Needs a ruling: either the two requirements are wired rather than cut (which is the opposite ruling) and then the option follows, or the option waits for a different reason to exist. | founder ruling (item 5), checked against founder ruling (item 4) | **BLOCKED ON A CONTRADICTION. Not implemented.** |
| 2026-08-23 | `bank_item` INTO THE ENGINE'S `POOLS` — proposed as one line in `src/lib/selection/catalogue.ts` plus a bench proof. **NOT DONE: it is not one line.** `loadIngredients` composes its query from `<table>_facet`, `<table>_occasion`, `<table>_slot` and `<table>_world`, and db/031 called only `install_revelle_ingredients` — so `bank_item_facet`, `bank_item_occasion`, `bank_item_slot` and `bank_item_world` do not exist and the entry would fail at the first query. It also needs a `slot_kind` and `occasion_slot` rows for atmosphere before a bank item can land in a package at all (dishes are the standing example of a pool that loads and has nowhere to go), and `bank_item.world_id` is a direct FK where every other pool uses a `_world` join table carrying `native` and `affinity` — so the world relationship is a design decision, not a copy. Concurrent work in db/038 is in the same area. | audit, this session | **BLOCKED — larger than reported. Needs a migration and a slot decision.** |
| 2026-08-23 | A ROOM THAT BEGINS AT MIDNIGHT — the after-party as its own destination, first course at one in the morning. The catalogue has nothing starting later than dinner: ten of the eighteen rows sit at `starts = evening` and none later. It would be the only `starts = late` row and therefore instantly distinct on that cell, and it extends the DESCENT COURSE register — the deliberately humble late plate, proposed 2026-08-22 and still unbuilt — from one course to a whole party. **A CONCEPT, NOT A SCHEMA CHANGE, AND NOT A ROW.** db/037 declared `late` as a level of `starts` so that a host can name the hour she is actually starting at; it makes such a room POSSIBLE without requiring it, and until one is written the audit will print `DEAD starts.late` and be right to. Like every other proposed room it **needs a voice before it can be a row** — `docs/new-destination.md` step 0, a brief stating the row it must occupy, then prose written to that brief, then the cell. Nothing here authorises re-declaring an existing room's `starts` cell to fill the level. | founder, in-session | admitted as a concept for future authoring. Not scheduled. |
| 2026-08-23 | PHASE TAG on bank items — daylight/dusk/dark/all, defaulting all, assembly filters by member hours within the room's authored arc. Phase-lock and turns unchanged. Completes the three axes: seasons for time of year, phases for time of day, tiers for place. | founder, in-session | recorded in `docs/atmosphere.md`. Not built — and neither is `descent` or the tier system, so this is the second instance of an unbuilt pattern. |

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

### The banned layer is BUILT, and the anti-exemplars are the refusals

`npm run check:voice-output -- <slug> "<line>"` — `scripts/check-voice-output.mjs`.

It is the third of the three QA checks, built first because it needs no model
and no training data: the material already exists, authored, in every
destination's `rejected` list.

**The refusals ARE the anti-exemplars.** A banned WORD list catches "authentic"
and misses "a night of old New York glamour", which uses no banned word and is
the exact failure the house refuses. A rejected example is a banned SHAPE with
the reason attached, and it is the only place in the catalogue where the failure
mode is stated positively. Every packet should carry its room's `rejected` list
for this reason — an exemplar of what not to write is worth more than another
instruction not to write it.

Three checks, none of them clever: DISPLACED TERMS (every `insteadOf` word in
the lexicon, hard bans), NEVER-RULE TERMS, and SHAPE PROXIMITY against each
refusal. The third reports and does not judge — a high score prints the refusal
and its `why` beside the candidate and says "not a verdict". A model will judge
shape better than this eventually; until then a lexical check that never lies
about its confidence beats a clever one that does.

### What this requires that does not exist yet

**Edit capture.** Preference pairs cannot accumulate retroactively — a
correction made before the capture exists is a correction lost. Whatever is
built first, it should be the thing that records the before and after of a
founder edit, or the 200-output threshold starts counting from whenever that
lands rather than from now.


## 2026-08-22 — The descent course, and music in three parts

**Recorded, not built.**

### The descent course

**One deliberately humble late plate.** Tagged `descent` in the dish pool,
**exclusive to till-morn rooms**, arriving **unannounced** as the last-phase
turn.

The six rooms whose `ending` is `until_morning`, computed from the matrix:

`new-orleans` · `havana` · `las-vegas` · `tahiti` · `st-moritz-1984` ·
`acapulco-1959`

Everything about it is already expressible: a tier tag on the ingredient row, a
slot in the last phase, and an eligibility rule reading the destination's
`ending` cell. Unannounced is a property of the RUNBOOK — the plate is not on
the menu card — which is where a "do not print this" instruction belongs.

### Music, in three parts

**1. The sequenced set.** Per room, and it exists — `tracklist` is a real pool
in `ingredient_pool`. Unchanged.

**2. Playback equipment — a CONSTRAINT-CLASS quiz question.** Speaker ·
turntable · hire. It governs which physical kit can be sent, and **records ship
as goods to turntable members**.

**NEVER SCORED, NEVER REQUIRED.** It cannot influence which destination she is
given and no room may demand it. Same ruling as venue, `acquaintance` and
atmosphere: it describes what happens inside a chosen world, so it binds at
assembly and nowhere else. It is a constraint answer under THE SEAM — it
survives the pick and governs what can be issued.

**3. "Live" routes to a booking instruction.** A live answer goes to a
**spectacle room** as a booking instruction carrying an **authored repertoire
brief**.

The two rooms with `spectacle = performed`: **`las-vegas`** and
**`acapulco-1959`**.

**AND THIS RESOLVES THE ACAPULCO SPECTACLE-DELIVERABLE GAP.** `spectacle` was
adopted as a matrix facet today and Acapulco's cell is `performed` — the divers,
the band — but nothing in the catalogue MADE that true. A room could be tagged
for a show it had no way to stage. A booking instruction with a repertoire brief
is the deliverable that closes it, and it is the first thing to give that facet
a physical consequence.

**Rooms whose voice bans performance LOG AND DECLINE the live answer.** Log,
not silently drop — a declined live answer is a fact about that host worth
keeping, and the gap channel already exists for exactly this shape of thing.

**The decline list needs authoring, and an automated pass will not produce it.**
Only ONE room bans performance unambiguously: `westhampton-1976`, which claims
the `never_performs` tone and is alone in doing so. Tahiti is a candidate on
different grounds — humour mode `none`, "there is no joke in this writing." A
text search for performance refusals returns false positives, because "the room
is 1960 and is not doing an impression of 1960" is a rule about PERIOD KITSCH
and appears in Vegas, which plainly does not ban performance. The list is a
founder judgment per room.


## 2026-08-22 — Westhampton re-founding (PARKED)

**Nothing applied. The row and the prose are untouched.**

The proposal: Westhampton stops being Locust Valley dry — drinks-hour, Triscuits
with champagne, a party that half-exists in three other rooms — and becomes
**Eothen and Capote's salons**. The house where the famous come to be off-duty.
Barefoot in designer clothes: the clothes came from the city, the shoes came off
at the door, and both facts matter.

### What the machinery said, run before any prose

`dress` flips to `plain` — the truthful Eothen answer to "did everyone dress up"
is no, they arrived perfect. That removes `dress` from the Westhampton/Nantucket
separating set, and the pair drops below the gate.

`volume` must become `one_conversation` — Capote holding court. **Without it no
configuration clears at all.** With it, Westhampton stops colliding with
Nantucket and starts colliding with PORTOFINO instead: both `absorbed ·
one_conversation · plain · bought · dissolves · few`, separated only by `starts`
and `schedule`. Eothen becomes Portofino at night.

`ending` is the cell that resolves it, and it carries five of the six clear
rows. The old room "turns into something else", which is a dinner dissolving;
this one is indiscreet by ten and legendary by midnight, and goes to first light.

**Six rows clear the gate**, all with `dress = plain` and `volume =
one_conversation`:

| schedule | size | ending |
|---|---|---|
| **standing** | **crowd** | until morning |
| anchored | few | until morning |
| anchored | one_table | until morning |
| anchored | crowd | dissolves |
| unplanned | few | until morning |
| unplanned | one_table | until morning |

**`standing` clears in exactly one configuration** — with `crowd`. So the
founder's `standing` instinct and a small house cannot both hold. CC's
recommendation was `standing · one_conversation · plain · bought ·
until_morning · evening · crowd`, on the grounds that it honours the schedule
instinct and matches the drifting-house scene card.

### The voice-space half, untested

The dry-deadpan tags — `deadpan`, `understated`, `explains_nothing` — were
Locust Valley. The salon is performative, confessional, indiscreet:
`straight_to_gossip`, `one_tells_it`, `nothing_sacred`, possibly
`does_the_voice`. All are real codes, but `does_the_voice` is Las Vegas's alone,
so Westhampton claiming it wants measuring rather than assuming.

Predicted side effect, unverified: St. Moritz/Westhampton was the monitor-tier
worry precisely because both were dry-knowing. A warm-indiscreet-performative
Eothen should separate that pair for free.

### And the rename, which is not a code change

`WESTHAMPTON, 1976` → `THE HAMPTONS, 1976` **cannot ship by editing
destinations.ts.** `seed-destinations` reports `exists — left as it is` for
every authored room and has no `--overwrite`, because the rule protects a
curator's work. Renaming a live destination is a desk action at
`/desk/destinations/[id]`.

The same discovery applies to work already done: **today's year renames never
reached production either.** The database still holds NANTUCKET, AUGUST and
HAVANA, THE SMALL HOURS. The code renamed them; the seeder protected the
database from the code, by design.

The SLUG stays `westhampton-1976` — it is an identifier, not a name, and
`cote-dazur` already calls itself 1962.


## 2026-08-23 — Atmosphere idea bank v1: what it needs that does not exist

The bank is `docs/atmosphere-idea-bank-v1.md`, copied in from the project folder
so there is one copy under version control. Its own header says any copy without
the v1 header is stale, which is an argument for it living here rather than in
three folders.

### Pending item 1 is ANSWERED

> *"Westhampton bench provisional until the Eothen row re-runs."*

**The row re-ran last night and cleared.** Westhampton is now
`absorbed · standing · one_conversation · plain · bought · until_morning ·
evening · crowd`, and every cell is carried by a sentence in the founder's own
scene card. The audit was unchanged by it: one undeclared failure catalogue-wide,
`portofino / cote-dazur` at 1 on `size`. The bench is no longer provisional on
that ground.

The row is in `data/destination-matrix.json` and the VOICE is not yet rewritten —
`destinations.ts` still holds Locust Valley. That mismatch is recorded under
`awaitingVoice` in the matrix.

### GAP 1 — a destination cannot carry a structural requirement

The bank states: *"Tahiti and Palm Springs carry destination-level
requires_outdoors."*

They cannot. `db/020`:

```sql
constraint ingredient_requirement_known_pool
  check (entity_table in ('product', 'game', 'tracklist', 'menu', 'drink'))
```

`world` is excluded deliberately — the same migration refuses to let an
environment facet be tagged onto a destination at all, because venue must never
touch the destination CHOICE. Destination-level presupposition is a different
thing from venue scoring and needs its own expression: a migration allowing
`world`, checked at ASSEMBLY, surfaced as a warning, never a ranking input. That
was scoped when the founder asked "you can't do Palm Springs 1965 without a
pool" and the bank now requires it.

### GAP 2 — `outdoor_access` does not exist

The bank wants a *"softer grade"* for sparklers. `structural_requirement` holds
exactly three codes: `requires_outdoors`, `requires_open_flame`,
`requires_full_kitchen`. A softer grade is a new row, and it is worth naming the
distinction on the way in: `requires_outdoors` means the thing CANNOT happen
inside; `outdoor_access` means it needs a door to somewhere, which most
apartments have.

### NOT A GAP — costume briefs are already dead

*"Costume briefs are killed catalog-wide"* confirms the existing position rather
than asking for a deletion. All seven mentions in the repo are the ANTI-costume
rule: "No clipboards. No costume rule." on the homepage, the dealbreaker filter
in the selection spec, and "a spelling that performs an accent is a costume" in
the authoring guide. Nothing to remove.
