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
| 2026-08-26 | THE TAKE-HOME SHIPS ITS OWN STOCK. Three take-home proposal sheets (225 items, 18 rooms) each asked the same blocking question: may a `the_take_home` claim POINT AT an existing bank row, or must it ship its own stock? Founder: **"its own"**. Applied to all 225: 152 STAGED as drafts, 24 survive as SECOND CLAIMS with no new stock, 25 KILLED, 20 HELD (the ruling does not reach them), 2 affinity, 1 withdrawn, 1 already struck by an existing kill. Reasoning and the two boundary findings below. | founder ruling, relayed in-session | **applied.** Every item marked in place in its sheet (rule 14 — losers marked, not deleted). The 152 survivors are staged into `docs/atmosphere-idea-bank-v1.md`, each carrying `FOUNDER-PENDING`, so `seed:bank` holds them. Verified: `npm run seed:bank -- --dry-run` goes 180 rows / 174 live / 6 draft → 332 rows / **174 live, unchanged** / 158 draft. |
| 2026-08-26 | DID THE 47 CASUALTIES ORPHAN ANY SLOT? — asked of every one of them, not just of `the_take_home`, because an item carrying two claims takes both down with it. **ANSWER: NO. Not one (room, slot) pair was left empty by the ruling.** Method: the 47 split 25 KILLED + 20 HELD + 1 withdrawn + 1 already-struck; the 20 HELD were all staged the same day under the category-3 ruling, so they exist as drafts and orphan nothing. Of the 27 permanent casualties, 9 carried a second claim — portofino/`the_table_set`, cote-dazur/`the_light`, cote-dazur/`the_atmosphere`, nantucket/`the_table_set`, amalfi/`the_atmosphere`, big-sur/`the_table_set` (x2), dolomites/`the_atmosphere` (x2) — plus the withdrawn catskills name tag, which was `the_table_set` only. Every one of those pairs still has at least one other row. **AND IT COULD NOT HAVE GONE OTHERWISE, which is the finding worth keeping:** an own-stock kill fires precisely because the item POINTED AT AN EXISTING ROW, and that row is the one already filling the second slot. The kill removes the pointer, never the thing pointed at. | audit, this session | **verified against a scratch Postgres built from the committed chain (db/001–044) plus the full `preDeployCommand` seeder chain. Nothing to fix.** |
| 2026-08-26 | WESTHAMPTON, 1976 HAD NO DRESSED TABLE — `the_table_set` empty, live AND draft, and db/043 makes that slot REQUIRED at a dinner party, a birthday, an anniversary, a holiday and a no-reason party. So the room low-confidenced every long dinner it was chosen for, silently. The only room of the eighteen with an empty table; the other seventeen carry one to four rows. **NOT caused by the own-stock ruling** — no Westhampton proposal was killed by it, and the hole predates all three sheets. Four rows authored into the room's own register, which dresses a table barely: the cloth off the line, the glasses that do not match, the one platter, the napkins nobody folded. | audit + authoring, this session | **staged as DRAFTS.** Each carries `FOUNDER-PENDING`, so `seed:bank` holds it and the founder publishes from `/desk/publish`. Verified against the scratch chain: `npm run seed:bank -- --dry-run` goes 352 rows / 174 live / 178 draft → 356 rows / **174 live, unchanged** / 182 draft, and all four land in `the_table_set` through `bank_item_default_slot()` with no help. Separately noted, not authored for: `the_light` is empty in EIGHT rooms — amalfi, catskills, havana, new-york, oaxaca, palm-springs, portofino, tahiti — which is not a defect because db/043 makes that slot required nowhere, but it is the next thing anybody looking at this board will ask about. |

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


## 2026-08-26 — The take-home ships its own stock

**The question, asked three times.** Three agents drafted `the_take_home`
proposal sheets — 225 items across all eighteen rooms — and each of them
independently hit the same wall and named it as blocking. The Catskills sheet
put it plainest: *"This needs one ruling, not fifteen: may the take-home slot
POINT AT an existing bank row, or must it ship its own stock?"*

**The founder's answer: "its own".**

### What "its own" decides, and why it is a quantity rule

A table item ships ONE. One arrangement of florals. One banana-leaf runner. One
posted card of the day's hours. One deck. A take-home ships ONE PER GUEST. So a
take-home cannot be satisfied by pointing at a row whose stock is a single
article — which is exactly why New Orleans's *"one of the dark red roses"*
fails. The florals row is one arrangement, not twelve roses, and the sheet that
proposed it had already dissolved it into a second claim on that row. The ruling
says the dissolution was the wrong direction: a take-home there needs its own
stock or it does not exist.

### The dual-claim boundary — this ruling does NOT reverse the earlier one

The founder's Catskills rock place setting is a place setting AND a keepsake:
one object, shipped once, claiming two slots. That still stands, and it works
for a reason worth naming, because the reason is the boundary:

> **A dual claim survives only where the object it sits on is ALREADY
> per-guest. Otherwise the take-home needs its own row with its own stock.**

The rock is one per guest before anybody claims anything. So are `menu cards
part-French at each place`, `place cards in stands`, `church fans at places`,
`go-cups at the door`, `half-coconut bowls`, `tuberose — one stem at each
place`, `stoneware copitas`, the Celebrity 1960 slips, the tombola cartelle and
the 1971 noun slips. Those take the second claim and cost nothing. A tarot deck,
a Napoletane deck, a shucking kit's one knife, a caviar service's one spoon, a
posted card on a board, a printed camp ledger, a foraged centrepiece and an
arrangement of roses do not, and never can.

### The one refinement the ruling forced

Recorded because it decides eight items and because getting it wrong in either
direction is visible. **Where an existing row's stock is BULK, a per-guest slot
can be carried by raising the order on that row.** Lemons at FULL dose, pampas
grass, wild lavender, the sack of beans in the tombola kit, the box of apology
stationery, the sparklers in the sparkler kit: more on the order IS the
take-home's own stock, it just lives on a line that already exists. Where the
stock is ONE ARTICLE it cannot be.

This is the test the wording has to pass, because it has to save the Amalfi
lemon and still kill the New Orleans rose, and "bulk versus one article" is the
only formulation found that does both.

### Where the ruling and a sheet disagreed

Four entries had their own reasoning reversed, and the disagreement is written
into the sheet beside the entry rather than silently applied:

- **Nantucket, the oyster knife.** The sheet made it a second claim on the
  existing shucking kit. The kit ships one knife; the clause says one per person
  who joined. It is its own line.
- **Nantucket, the dried hydrangea head.** The sheet moved it fair → strong on
  the second claim. The jar is one jar at a deliberately careless-SMALL dose,
  and raising that dose is also the move that would collapse the dose wall
  against Westhampton's careless-abundant. Killed.
- **Big Sur, the hand-thrown cup.** *"it is not an extra object, it is the
  object you were already given"* does not hold — the plates are plates. It is
  its own per-guest row, so the per-head cost objection the second claim was
  answering comes back.
- **New Orleans, the magnolia leaf.** The same object as the rose the sheet
  dissolved on its own initiative, off the same single arrangement, and kept.
  Killed.

### The boundary the ruling does not reach — 20 items HELD, not killed

**A family of proposed take-homes points at NO bank row and ships NOTHING**, so
"its own stock" has nothing to bite on: the champagne cork, the muselet cage
(twice — St. Moritz and Acapulco), the soaked-off rosé labels, the spent
sparkler wire, the shell out of the shucking bucket, the rubber bands off the
lobster claws, the creek stone, the rose hips, the bottle cap, the film
canister. Their supply is BOTTLES, or the dinner, or the ground — not the guest
count. Acapulco's sheet says it outright: *"one cork per bottle, so this is not
per-guest."*

Alongside them sit the one-of-ones: the Vegas IOU (one person owes), the St.
Moritz doubling cube and caviar tin, the Aspen trophy, the belote sheet and the
backgammon column (players, not guests), the signed napkin, the Conquián tally,
Aspen's tape flag (whose own question is whether anything ships at all).

**These are HELD, not staged and not killed.** The quantity reading says they
should die; the ruling as spoken does not say so, and killing twenty items on an
extension of two words is not a machine's call. **This is the open question to
take back to her.**

### The counts

| | items |
|---|---|
| STAGED — ships its own per-guest stock | **152** |
| SECOND CLAIM — survives on an already-per-guest or bulk row, no new stock | **24** |
| KILLED — points at a row whose stock is one article | **25** |
| HELD — the ruling does not reach it (see above) | **20** |
| AFFINITY — rides on a staged parent row | 2 |
| WITHDRAWN by its own sheet / already struck by an existing kill | 2 |
| **total proposed** | **225** |

Dual and second claims: **64 proposed, 47 survive, 17 die** — 58 written as
`slots:` lines on the sheets, plus six the Westhampton/Vegas sheet recommended
against rows already in the bank (the church fans, the go-cups and the dark red
roses at New Orleans, the Watten/briscola rules card at Dolomites, Vegas's one
stem at each place and its wrapped Pick-a-Number prize — of which the fans, the
go-cups and the stem survive and the other three do not).

**Per room, and the shortfall is not evenly spread.**

| room | proposed | staged | 2nd claim | killed | held | other |
|---|---|---|---|---|---|---|
| westhampton-1976 | 9 | 9 | — | — | — | — |
| new-york | 10 | 7 | 2 | — | 1 | — |
| new-orleans | 7 | 6 | — | 1 | — | — |
| dolomites | 7 | 4 | 1 | 2 | — | — |
| havana | 6 | 3 | 2 | 1 | — | — |
| las-vegas | 8 | 5 | 2 | — | 1 | — |
| portofino | 15 | 14 | — | 1 | — | — |
| tahiti | 14 | 11 | 1 | 2 | — | — |
| cote-dazur | 14 | 9 | — | 3 | 2 | — |
| nantucket | 14 | 8 | 1 | 2 | 3 | — |
| amalfi-1953 | 14 | 9 | 3 | 2 | — | — |
| big-sur | 13 | 8 | 1 | 2 | 1 | 1 affinity |
| catskills | 22 | 18 | 2 | 1 | — | 1 withdrawn |
| palm-springs-1965 | 15 | 10 | 2 | 2 | 1 | — |
| st-moritz-1984 | 16 | 8 | 2 | 2 | 4 | — |
| aspen-1994 | 17 | 12 | — | — | 4 | 1 affinity |
| acapulco-1959 | 11 | 3 | 4 | 1 | 2 | 1 struck |
| oaxaca-1954 | 13 | 8 | 1 | 3 | 1 | — |
| **total** | **225** | **152** | **24** | **25** | **20** | **4** |

**The rooms that lost most are the ones whose objects are shared
infrastructure or borrowed from a bottle.** St. Moritz loses six of sixteen
(two killed, four held) because silver is the register and silver is not a
party favour, so half its take-homes were one-of-ones and champagne hardware.
Acapulco stages only three of eleven — but loses just four, because four more
survive as claims on rows that were already per-guest, which is the ruling
working rather than failing. Côte d'Azur and Nantucket lose five each. Dolomites
stages four of seven; Havana three of six.

**The rooms that lost nothing are the ones that put things in writing.**
Westhampton nine of nine, Portofino fourteen of fifteen, Catskills twenty of
twenty-two surviving. Paper is per-guest by nature and never points at a
centrepiece.

### What was staged, and what deliberately was not

Only the 152 own-stock survivors are in
`docs/atmosphere-idea-bank-v1.md`. **The 24 second claims are NOT staged, on
purpose** — a second claim is a `bank_item_slot` row against a row that already
exists, and writing a bank item for it would create the duplicate stock this
ruling exists to prevent. They are listed in their sheets under
`SECOND CLAIM, NOT STAGED` and are a desk action, not a seeder one.

Every staged clause carries the literal marker `FOUNDER-PENDING` inside its own
text, which is the only hold-back test there is (`FOUNDER_PENDING` in
`scripts/catalogue-vocabulary.mjs`, read by `carriesFounderQuestion`, matched in
SQL by db/036's `description not like '%FOUNDER-PENDING%'`). Where the sheet
raised a real question it is kept verbatim in substance; where the sheet wrote
`founder question: none`, the row carries the standing one rather than an
invented one.

**Verified rather than assumed**, per rule 20 — a report generated from
something other than reality is the most convincing failure this system
produces:

```
before  180 bank_item rows · 174 LIVE · 6 draft
after   332 bank_item rows · 174 LIVE · 158 draft
```

The live count is IDENTICAL. All 152 additions are held, and the only other six
held rows are the pre-existing founder-pending ledger items. 17 printed-card
rows before and 17 after, so no clause spawned a card row whose description
would have missed the marker.

### Two things this pass did not paper over

**AMALFI COAST, 1953 HAS NO PREMISE.** There is no `AMALFI` block in
`src/lib/destinations.ts` — it is one of the five unwritten rooms. Its nine
staged take-homes are built from the bank entry, the matrix row and the contrast
brief only, and no world fact was invented. The room's heading in the idea bank
now says so, so a curator reading a staged Amalfi row at the desk cannot miss
it. If the founder writes that voice and it goes somewhere else, those nine are
re-read, not kept.

**`seed:bank` now reports 100 "printed matter, uncaught" notes** (up from
roughly a dozen). That is the seeder working as designed — it reports every
clause that sounds printed and that `PRINTED_MATTER` does not catch by phrase,
so that a person extends the phrase table rather than a regex guessing. The
take-home slot is disproportionately paper, so the list got long. Nothing is
misfiled; the vocabulary is just now visibly behind the content.

---

## 2026-08-26 — Three rulings on the twenty held take-homes

The founder ruled on the twenty items the previous entry HELD, and on the two
questions attached to them. All three are recorded here; the schema is
`db/044-the-evening-supplies-it.sql` and the reader-facing rule is in
`docs/atmosphere.md`.

### Ruling 1 — THE EVENING SUPPLIES IT is a third category, and it is the best one

> *"These are the take-homes that can't be faked: nothing printed in advance,
> pure residue of the night actually happening. Your rock, industrialized. Admit
> it."*

The previous entry read the twenty as a boundary the ruling did not reach and
said so; the correct reading was that they are a category the vocabulary could
not name. **What the HELD verdicts were right about is preserved item by item in
the three sheets** — each now carries a `category-3 ruling` line beneath its
`own-stock ruling` line saying what beat it and what survived. Several of them
described the category exactly while calling it a fault: *"the house ships
nothing here"*, *"foraged, no per-guest quantity declared and nothing on the
order"*, *"a bank row for it would be a row for nothing, since the bank holds
purchasable or placeable objects"*. The bank now holds a third thing.

**(a) Dependencies, not stock — and NOT a row reference.** The first draft of
this model pointed `depends_on` at a supplying row, polymorphically through
`ingredient_pool`. The founder corrected it before it was built:

> *"The cork depends on the drink SLOT — checkable, because `the_drinks` is
> always filled. But the shell depends on whichever dish filled `the_main` in
> this package, and that's decided per-package at composition time. A static
> `depends_on → revelle_dish.lobster_bucket` is only satisfied when selection
> happens to draw that dish … A static dish-row FK would produce exactly what
> you predicted: a check that looks right and fires on the wrong thing — red
> when the room is fine, green for a package that drew the ceviche."*

So `bank_item_dependency` is `(item, slot_code, supplies)` — a slot watched, and
a predicate asked of whatever filled it. The predicate is a `supplies_tag`
carried by the supplying row (`ingredient_supplies`, polymorphic on
`(entity_table, entity_id)`, the vocabulary `staff_action` and
`ingredient_requirement` already speak). Two things the losing candidate would
have done, verified against a database built by the committed deploy chain
rather than reasoned about:

- **A menu reference could never be satisfied.** `occasion_slot` has ZERO rows
  whose pool is `menu`. db/022 replaced the set menu with a composed table
  drawing from `dish`, said "the engine no longer has a slot to put a menu in",
  and set the menu pool's `typical_draw` to 0.
- **A dish reference would be a lie in both directions on successive Tuesdays.**
  Nantucket serves the bucket in some packages and the fog-day chowder in
  others.

**Unconditional / conditional / broken is DERIVED, never authored.** Whether a
dependency is unconditional is a fact about what else is in the pool for that
room, and the pool changes under it — which is exactly the swap the founder
named ("a curator swaps Positano's drink program to cocktails next spring").
Read off the catalogue, a `strength` column would be stale within a season.

**(b) Two quantity semantics.** `bank_item.take_home_quantity` is `per_guest`,
`single_artifact`, or NULL for no promise. Twelve of the twenty are per-guest,
eight are one-of-ones. **Null may never be counted as per-guest coverage**, and
the board must show the unstated ones rather than fold them into a total.

### Ruling 2 — the bulk refinement is adopted as stated

Adopted in the words the sheets wrote it in, with her note recorded because it
is the part that gets lost: *the agent's inability to find another formulation
that does both is itself evidence this is the right line.*

It decides eight items, all of them `SECOND CLAIM, NOT STAGED` — a dose rise on
a row that already exists, not a bank item:

| item | room | the bulk row |
|---|---|---|
| the grapefruit | Palm Springs | the citrus bowl |
| blank apology stock | St. Moritz | the apology-champagne stationery box |
| the spare sparklers | Acapulco | sparklers inside the kit |
| a lemon from the bowl | Amalfi | lemons at FULL dose |
| the beans | Amalfi | the tombola kit's bean sack |
| the larch sprig | Dolomites | larch/pine branches |
| something off the fruit pile | Havana | the piled whole fruit |
| a pot's worth of coffee, in paper | Havana | the cafecito kit |

Two deaths are confirmed by the same test and kept rather than deleted: New
Orleans's **dark red rose** (dissolved in the previous pass) and its twin the
**magnolia leaf** — `tight classical florals` is one arrangement, not bulk. The
Amalfi lemon lives and the New Orleans rose dies, which is the test the wording
had to pass.

### Ruling 3 — the broadsheet is a NAMED BOUNDARY CASE, not a rule change

> *"Don't rewrite the rule to accommodate it; record it in the rule's notes as
> the test case that defines the boundary. Rules warped around their edge cases
> get leaky; rules with a named boundary case stay sharp."*

The prohibition's wording is untouched, the Nantucket broadsheet stays `SECOND
CLAIM, NOT STAGED`, and db/044 writes the case into
`slot_kind.description` for `the_take_home` — in the rule, where the desk
renders it, rather than in a document only somebody already looking would open
(rule 20's second half). Anything arguing from the broadsheet must show the same
CONSTRUCTION — one printed article that divides into one per seat, each seat's
different — and not merely the same conclusion.

### Staged, and the live count did not move

`npm run seed:bank -- --dry-run`, before and after:

```
before  332 bank_item rows · 174 LIVE · 158 draft
after   352 bank_item rows · 174 LIVE · 178 draft
```

Also run for real, against a scratch Postgres built by the committed chain:
20 rows created, 0 went live, 20 stayed in draft; `bank_item` afterwards is 174
active + 158 draft stocked and 20 draft evening-supplied.

Every one of the twenty carries the founder's own phrase as its marker, which is
what the seeder reads:

```
THE EVENING SUPPLIES IT (per guest; from the_drinks yields_cork)
THE EVENING SUPPLIES IT (one guest only; from ambient_game yields_prize)
THE EVENING SUPPLIES IT (per guest; from the night itself)
```

### Three findings this pass did not paper over

**1 · 143 OF 152 TAKE-HOME PROPOSALS WERE IN THE WRONG SLOT, and the cause is
eleven characters.** `bank_item_default_slot()` (db/043) spells its first phrase
`'take home'`, with a space; every one of the 152 clauses spells it `take-home`,
with a hyphen. The branch never fired and they fell through to the general
bucket. It is exactly the failure db/043 named the slot to prevent — "this room
has a dressed table and nothing to take home" is only sayable if the take-home
has a name — and the name existed while the coverage board would have shown
eighteen empty take-home cells over a pool holding a hundred and fifty of them.
db/044 corrects the vocabulary and moves only the claims that are still the
machine's own, identified by the note the classifier writes; a claim a curator
authored is untouched, because reclassification is her update. **Thirty rows
declare a SECOND claim in their own text and do not have one** — the founder's
rock among them — and that is desk authoring, deliberately not done by a
migration; the query that finds them is in db/044.

**2 · `ingredient_requirement` IS EMPTY ON ANY DATABASE BUILT BY THE COMMITTED
CHAIN, so `venueEligibility()` prunes nothing.** `preDeployCommand` runs `npm
run migrate` BEFORE every seeder, and db/020 and db/033 tag requirements by
matching authored text — against tables that are empty at migration time. Rule
20's sentence, exactly: a report generated from something other than reality is
the most convincing failure this system produces. It is why db/044 creates
`ingredient_supplies` EMPTY and names the tagging as seeder work rather than
doing it in a migration, and it is a live defect in the venue apparatus that
rule 2, rule 15 and db/035 all argue about. **Not fixed here — it is somebody
else's file and it needs its own migration and a decision about where tagging
lives.**

**3 · `the_drinks` IS NOT ALWAYS FILLED.** The ruling assumes it is
("checkable, because `the_drinks` is always filled"). On a seeded database six
of the eighteen rooms have NO eligible drink at all — Acapulco, St. Moritz,
Aspen, Palm Springs, Oaxaca, Amalfi — and every drink carries a native claim
somewhere, so nothing is general and nothing pools into them. Six of the twenty
staged rows watch `the_drinks` in a room with no drink programme, and they will
report BROKEN. That is the dependency machinery telling the truth on its first
day: the cork exists because the drink programme pours bottles, and in Acapulco
it does not pour anything.
