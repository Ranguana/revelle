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
| 2026-08-27 | `taste_direction` HAS NO WORD FOR A WINTER LIVING ROOM — recorded because the founder flagged it herself while writing ASPEN, 1994. "Americana backyard" is the NEAREST of the eleven available directions and it is a **KNOWN STRETCH, not a clean fit**: a backyard in Americana is outdoors, daylight and summer, and the room is indoors, dark by five and winter. The two agree on informality and on being American and on nothing else. Written into `src/lib/destinations.ts` as flagged rather than applied quietly, so that nobody later reads the tag as evidence of anything. **The ask is a vocabulary revision, not a re-tag of the room** — the eleven directions cover coastal, desert, supper club and backyard, and have no term for the indoor-winter register that ASPEN, ST. MORITZ and DOLOMITES all sit in, which is three rooms of eighteen sharing one bad nearest neighbour. It costs nothing today: nothing in the catalogue is tagged in `taste_direction` at all (this ledger, 2026-08-23) and `vector.ts` excludes the dimension from scoring. It costs something the day the tagging pass runs, which is the day to read this row. | founder, in-session (flagged by her, recorded by an agent) | **recorded as flagged. No tag applied, no room re-described.** Owed: either a twelfth direction for the indoor-winter register, or a ruling that the stretch is acceptable and the three rooms share `americana_backyard`. |
| 2026-08-27 | **THE VOICE VOCABULARY IS SHORT THREE WORDS, AND THE EVIDENCE IS THREE ROOMS IN ONE WEEK.** (1) `starts` IS SINGLE-VALUED AND TWO ROOMS ARE NOT. Founder on PALM SPRINGS, 1965: *"palm springs can be day or night."* The facet's levels are morning/afternoon/evening/late and a row holds exactly one, so a room that is legitimately either cannot say so. AMALFI, 1953 hit the same wall from the other side — its spec claims both lunch and dinner and `starts: evening` honours one. (2) `humour` HAS NO VALUE FOR "THE BIT" — ASPEN, 1994, already open as `docs/needs-a-human.md` item 11. (3) `gesture` ASSUMES EXACTLY ONE PER ROOM AND PALM SPRINGS SAYS IT HAS NONE — founder: *"palm springs doesnt have one gesture, this is an example gesture"*, against db/031 line 19's *"a gesture is INVARIANT per destination — the one thing that always happens"*. **Three rooms wanting expressiveness the vocabulary lacks is evidence about the vocabulary, not about the rooms** — CLAUDE.md rule 26 from one step further out: before concluding the rooms are wrong, check the axis can say what they differ on. | authoring, this session (founder rulings relayed in-session) | **recorded, nothing changed.** Each is founder territory and they cost differently: a multi-valued or `either` level on `starts` is a matrix change that moves every distance touching it; a new `HumourMode` is a token change every voice gets re-read against; **a null gesture needs no schema change at all** — db/031 lines 129-130 add `world.gesture` and `world.gesture_note` NULLABLE, so it is a ruling and not a migration. |
| 2026-08-27 | THE `starts` FLIP FOR PALM SPRINGS WAS MEASURED AND THE CELL WAS NOT TOUCHED. Committed: `afternoon`. Her premise says the party starts at dusk; her later ruling says day or night. Method: a byte-identical copy of `scripts/audit-matrix.mjs` taken from HEAD (MD5 `6a895b0ab2f42af0eec705a47ab5e81b`) run in a scratch tree outside the repo against a scratch copy of the matrix — CLAUDE.md rule 7, and the script is being edited by another agent this session. **Flipping to `evening` moves fifteen of this room's seventeen pairs** (only DOLOMITES and CATSKILLS hold, the two `morning` rooms) and costs two undeclared failures — palm-springs/st-moritz 3→2 differing only on schedule and ending, palm-springs/acapulco 3→2 differing only on ending and spectacle — **plus two rule-4 twin violations**, because st-moritz and acapulco each end up below the gate against two rooms and may then twin with neither. It gains palm-springs/aspen 3→4 and drops palm-springs/new-orleans 4→3 onto the gate. Mean 4.93→4.90, undeclared failures 0→2. Separately, `palm-springs-1965.schedule` sits in `founderPending` as provisional `anchored`; **her material settles it as `anchored`** — a start, a shape, an end, no posted order — and it was not changed. | measurement, this session | **`afternoon` is the safer cell by the committed script's own numbers, and it is still not an agent's call.** The cell is a lossy encoding of a day-or-night room either way. Reported, not applied. |
| 2026-08-27 | DISHES FOR THE SIX EMPTY ROOMS — 25 lines authored, verified against the real parser, **NOT placed in `docs/dishes.md`.** Three blockers, none of them an author's to clear: (1) `scripts/seed-dishes.mjs`'s `PER_DESTINATION` manifest fails the run on a room it does not know, and `seed:dishes` is in the pre-deploy chain, so document and manifest must move in one commit — the exact patch is in the section below; (2) **`FOUNDER-PENDING` DOES NOT HOLD A DISH BACK AND NO SUCH MECHANISM EXISTS FOR THIS POOL** — the seeder passes `LIVE` unconditionally and db/036 publishes every draft dish with the marker guard applied to `bank_item` only, so the LIVE count would move by 24, not stay still; (3) no `--dry-run` on `seed:dishes` and no Postgres reachable from a laptop. Rule 6 cut six of the first 31 lines, found by the count and not by reading: `Spaghetti with clams` and `Lemon granita` deduped straight onto Portofino's rows, and `Cheese fondue with bread cubes` onto the alpine plate Dolomites owns. **`acapulco-1959` and `oaxaca-1954` have no deliverables sheet** — Acapulco's food exemplars are marked DRAFTED in `destinations.ts`, and a paragraph circulating this session as Oaxaca's sheet is not in this repository in any form. | authoring + audit, this session | **STAGED HERE, NOT ADMITTED.** 25 of 25 lines parse; 1037→1062 lines matched, 976→1000 deduped rows, season disagreements 3→3. `npm test` was 342 pass / **1 fail** on a clean tree before any edit (`voice.test.ts:453`, marks for the draft tones `bigger_every_telling` and `toasts_everything`) — pre-existing and unrelated. Owed from the founder: food for Acapulco and Oaxaca, and a ruling on whether a dish may be held as a draft at all. |
| 2026-08-27 | `check:voice-output` READS ONLY THE FIRST WORD OF A COMMA-LIST REFUSAL, so a room's `never` rules silently under-enforce. The extractor is `/\b(?:no\|never)\s+(…)(?=[,.]\|\s+and\b\|\s+no\b\|$)/`: **"Never mid-century, retro, mod, vintage, kitsch, swanky or classy" yields exactly ONE term**, and "Never a cocktail party" yields `a cocktail party`, which never matches a line saying "the cocktail party". Found while running the tool against PALM SPRINGS' eight founder-refused words: **one of eight fired.** Rewriting each refusal as its own "never" and dropping the article took it to eight of eight. Also re-confirmed, third room running: the tool does **not** read `voice.banned` at all, and it has **no punctuation pass**, so an exclamation-point rule is unenforceable there and is caught only by shape proximity against a rejected line that happens to carry one. | audit, this session | **worked around in `destinations.ts` for PALM SPRINGS, not fixed in the tool.** The fix is the tool's — split on the list rather than stopping at the first comma — and it is somebody else's file. Until then every room's `never` list is only as strong as its first item, and no room has been re-checked under that reading. |
| 2026-08-27 | **THE SKI-PASS INVITATION AUTHORS AS A PRODUCT-POOL ROW. RECORDED, NOT BUILT — NO ROW WAS CREATED.** Founder, on ST. MORITZ, 1984's deliverables sheet, verbatim: *"the ski-pass invitation authors as a product-pool row (`arrival_welcome`); per-guest by construction (named passholder — the Nantucket boundary case), pre-party print by nature. Faces the publish queue like everything printed — this room's kill history earns it the review, not a pass."* Her three claims check out against the schema and the ledger and are recorded as checked: (1) `arrival_welcome` exists as a **product**-filled slot since db/009 line 127; (2) the Nantucket boundary case is the right citation — db/044 writes it into `slot_kind.description` as *"one printed article that divides into one per seat, each seat's different"*, and a ski pass with a named passholder is exactly that construction rather than merely the same conclusion; (3) the publish queue is rule 13's own answer for anything printed. **ONE THING HER RULING RUNS INTO AND IT IS THE SCHEMA'S, NOT HERS:** db/009 line 732 says *"only multi-day occasions have `arrival_welcome` and `day_material`"*, and `docs/decor-sources.md` says of the slot *"an evening does not have this."* Three of her six claimed occasions are multi-day and carry the slot (`girls_weekend`, `bridal`, `getaway`); **the other three — birthday, holiday, anniversary — are evenings, and on those the ski pass has no slot to land in at all**, while being just as much the invitation. So the row is authorable today for half her occasions and unreachable for the other half. Not resolved here: it is either a second slot for a pre-party printed invitation on a single-evening occasion, or a ruling that the pass is an evening's `table_object`, and both are hers. | founder, relayed in-session; schema check by an agent | **RECORDED AS A PRODUCT-POOL ITEM AWAITING AUTHORING. Nothing created.** The room it belongs to is not wired, its three tones are drafts, and rule 13 puts a printed member-facing artefact behind the publish queue in any case. |
| 2026-08-27 | THE `starts` FLIP FOR ST. MORITZ WAS MEASURED AND THE CELL WAS NOT TOUCHED. Committed: `evening`. **Her material says `afternoon`** — *"What hour it starts: In the afternoon"*, and her premise settles it without ambiguity: *"the party starts while it's still light — on purpose."* Unlike PALM SPRINGS this is not a day-or-night room; it is an afternoon room that moves indoors at sundown, encoded as an evening room. Her `ending` **agrees** with the committed row — *"It goes until morning"* against `until_morning`. Method identical to the Palm Springs pass (rule 7): HEAD copy of `scripts/audit-matrix.mjs`, MD5 verified `6a895b0ab2f42af0eec705a47ab5e81b`, run in a scratch tree outside the repo against a scratch copy of the matrix itself verified identical to HEAD; the repo matrix was not written to. **Fifteen of seventeen pairs move** — only DOLOMITES and CATSKILLS hold, the two `morning` rooms. **It costs ONE undeclared failure** — `palm-springs-1965 / st-moritz-1984` 3→2, differing only on schedule and ending — **and ZERO twin violations**, which is the asymmetry with the flip measured from the other side: Palm Springs' flip to `evening` crashed BOTH palm-springs/st-moritz AND palm-springs/acapulco to 2 and produced two rule-4 crowded corners, while this flip moves the same single pair from the other end and leaves st-moritz below the gate against one room and acapulco against none. It gains st-moritz/aspen 4→3 and st-moritz/acapulco 2→3, opens nantucket 6→7 and tahiti 5→6, and **mean distance goes 4.93 → 4.95, the only flip either way that improves it** (Palm Springs' went 4.93 → 4.90). Undeclared failures 0 → 1. **The two flips collide on one pair and the answer is not symmetric:** both rooms at `afternoon` is the failing configuration whichever of them moved, so this is a cell decision about two rooms at once. | measurement, this session | **REPORTED, NOT APPLIED.** `data/destination-matrix.json` untouched. And it is probably not a `starts` decision at all — the pair would still differ on `schedule` and `ending`, and the honest reading is rule 26's: two rooms underdetermined by nine facets, not a wrong cell. |
| 2026-08-27 | **`audit-matrix.mjs` DOES NOT NOTICE WHEN A FLIP DISSOLVES A DECLARED TWIN.** Found by the St. Moritz `starts` measurement above. The script checks that no UNDECLARED pair sits below the gate, and that no room is declared in two twin pairs. It does **not** check that a DECLARED twin is still below the gate. So flipping `st-moritz-1984.starts` takes `st-moritz-1984 / acapulco-1959` from 2 to 3, the pair silently drops off the DECLARED TWINS list, reappears in ZERO MARGIN with no note that it used to be a twin, and `twinRule.declared` is left describing a relationship that no longer exists — while every downstream reader believes a voice tiebreak is in force between two rooms the matrix now routes apart on its own. Rule 23 exactly: a mechanism that invites misreading is a defect even when it works. The fix is one loop — for each declared pair, if `d >= gate`, say so — and it belongs in the script. | audit, this session | **NOT FIXED. `scripts/audit-matrix.mjs` is another agent's file this session.** No flip has been applied, so nothing is currently mis-declared; this is a trap laid for the next person who applies one. |
| 2026-08-27 | **A DECLARED TWIN'S `voiceAffinity` IN THE MATRIX IS NOW STALE, AND IT IS THE ONE THAT MATTERED.** `data/destination-matrix.json` records `st-moritz-1984 / acapulco-1959` with `voiceAffinity: null`, and `check:matrix` prints *"UNMEASURABLE — a voice is unwritten"*. `docs/voices-draft/VERIFICATION.md` section 6 recorded the same thing as outstanding debt: *"both twin pairs remain zero-of-two written."* **With ST. MORITZ, 1984 authored it is measurable, and it passes: 0.426 against the strict ceiling of 0.58**, `npm run check:voices -- --facets acapulco-1959 st-moritz-1984`. Twin condition 2 is satisfied for the first time since the pair was declared. The number is NOT written into the matrix by this pass: the file is founder territory and hand-typed, and the room whose voice produces the number is not wired. | measurement, this session | **REPORTED, NOT APPLIED.** Owed on the day the room is wired: update that one field, and the remaining `null` is `aspen-1994 / oaxaca-1954`, which is measurable too (0.517) and equally stale. |
| 2026-08-27 | `check:voice-output`'s NEVER-RULE CHANNEL IS SPELLING-LITERAL AND DOES NOT NORMALISE DIACRITICS. Fourth room running against the same tool, and this is the new finding: `"Never apres."` catches `apres` and does **not** catch `après`. The `insteadOf` channel caught both only because ST. MORITZ's lexicon lists both spellings explicitly, which is why the gap would have been invisible to anyone reading the summary line rather than the two channels separately. Worked around in `destinations.ts` with a second `never` clause carrying the accented spelling. **Re-confirmed for the fourth time, unchanged:** the tool does not read `voice.banned` (this room's `amazing`, `memories`, `iconic`, `vibe` and `guys` all pass clean), and it has no punctuation pass (a line with three exclamation marks returns "No banned shapes found", so ST. MORITZ's *"exclamation earned at the door and at the toast"* — the only punctuation licence in the library — is unenforceable there). **What DID work:** writing every refusal as its own "never" per the 2026-08-27 row above took the catch rate to **eight of eight** on the displaced-terms channel and eight of nine on the never-rule channel before the accent fix, first time out. | audit, this session | **worked around in `destinations.ts`, not fixed in the tool.** The fix is a fold of both channels through the same normalisation the displaced-terms channel already has. |

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

## 2026-08-27 — ST. MORITZ, 1984: the product-pool item, and the numbers

### The product-pool item, awaiting authoring

**Nothing was created.** This is the record the ledger row above points at, kept
here so that the item is findable by somebody looking for product-pool work
rather than by somebody reading a destination file.

| | |
|---|---|
| what | the ski-pass invitation |
| room | `st-moritz-1984` |
| slot | `arrival_welcome` (product-filled since db/009 line 127) |
| construction | per-guest — her name as the passholder, your date as the season, punched like it has been worn |
| authority for per-guest | the Nantucket broadsheet boundary case, db/044 → `slot_kind.description`: *one printed article that divides into one per seat, each seat's different* |
| timing | pre-party print |
| publication | the publish queue, like everything printed. Her words: *this room's kill history earns it the review, not a pass* |
| status | **AWAITING AUTHORING. No row exists.** |

Her sheet's own sentence for what it is for: *"Sets the dress code before a word
of it is written."* That is the argument for the item and it is the reason it is
an invitation rather than a favour — the pass does work no line of copy does.

**THE ONE UNRESOLVED THING, and it is the schema's rather than hers.**
`arrival_welcome` is multi-day only — db/009 line 732, *"only multi-day
occasions have `arrival_welcome` and `day_material`"*, and
`docs/decor-sources.md` on the same slot, *"an evening does not have this."*
Her six claimed occasions split three and three:

| occasion | multi-day? | can hold the pass today |
|---|---|---|
| girls' weekend | yes | yes (db/009 line 764) |
| bridal | yes | yes (line 792) |
| a getaway | yes | yes (line 775) |
| birthday | no | **no slot** |
| holiday | no | **no slot** |
| anniversary | no | **no slot** |
| no reason at all | no | **no slot** |

So the item is authorable for the multi-day half of the room and has nowhere to
land on the evening half, where it is exactly as much the invitation. Two ways
out and both are hers: a slot for a pre-party printed invitation on a
single-evening occasion, or a ruling that on an evening the pass is a
`table_object`. **Not chosen here.** Authoring the row into `arrival_welcome`
today would quietly make the room's signature invitation a girls'-weekend
feature.

### The numbers, so they are not re-derived

All from `npm run check:voices`, against the ceiling as recalibrated this
session — strict 0.58 at declared twins and structural distance ≤ 2, monitor
0.92 beyond, tone-hand overlap guard 0.8. **0 breach in both tiers, 0 breach on
the hand guard.**

| pair | affinity | dist | tier | verdict |
|---|---|---|---|---|
| `amalfi-1953 / st-moritz-1984` | 0.721 | 4 | monitor 0.92 | ok — **the room's nearest neighbour, and she did not name it** |
| `havana / st-moritz-1984` | 0.584 | 3 | monitor 0.92 | ok |
| `aspen-1994 / st-moritz-1984` | 0.554 | 4 | monitor 0.92 | ok — her border |
| `acapulco-1959 / st-moritz-1984` | **0.426** | 2 | **strict 0.58** | ok — her border, **the declared twin, measurable for the first time** |
| `palm-springs-1965 / st-moritz-1984` | 0.201 | 3 | monitor 0.92 | ok — her border |
| `st-moritz-1984 / westhampton-1976` | −0.201 | 3 | monitor 0.92 | ok — the furthest pair either room has |

Two of those are worth a sentence each.

**ACAPULCO, the pair she asked to have verified.** Her prose — *"two golden
rooms: wet, salted, clockless vs polished, deliberate, dressed"* — is legible in
the facet contributions and the metric agrees with her line by line. `volume`
0.144, `theatricality` 0.140 and `warmth` 0.113 carry 0.397 of the 0.426: that
is "two golden rooms". `irreverence` is **negative**, −0.079, Acapulco at +1.65
against this room at −1.16: that is "wet and clockless versus polished and
deliberate", and it comes from `impeccably_polite` and `rises_to_greet`, the two
pure-manners tones in her ten. Remove either and the border she named begins to
close.

**WESTHAMPTON, and a prediction on this ledger that is now falsified.** The
parked Westhampton re-founding analysis says *"St. Moritz/Westhampton was the
monitor-tier worry precisely because both were dry-knowing."* It was written
before this room had a voice, and the room turns out not to be dry-knowing at
all. At −0.201 the two are the furthest-apart pair either of them has. **The
worry is discharged by the founder's tone list, not by the Eothen re-founding
that was proposed to fix it** — which is worth knowing before that proposal is
un-parked, since it removes one of the reasons given for it.

---

# Dishes for the six empty rooms — STAGED, NOT ADMITTED — 2026-08-27

Six rooms hold zero dishes: `acapulco-1959`, `amalfi-1953`, `aspen-1994`,
`oaxaca-1954`, `palm-springs-1965`, `st-moritz-1984`. The consequence is
measured: `scripts/deliverables.mjs` returns `unknown` for every pair involving
them, so rule 26's second number cannot speak, and the founder's position —
*"once the drinks and food are added they r different enough"* — is neither true
nor false yet.

**The dish lines below are written and verified against the real parser. They
are NOT in `docs/dishes.md`, and the reason is three blockers, none of which an
author can clear.** They are staged here because this file's own law is that
nothing is admitted that is not in it, and because a dish line living only in a
session transcript is a dish line that gets re-derived at full price.

## Blocker 1 — a dish added to the document breaks the deploy until a manifest in `scripts/` is edited in the same commit

`scripts/seed-dishes.mjs` holds `PER_DESTINATION`, an exact per-room count
checked before anything is written, and it fails the run on a room it does not
know:

>     `${destination} is not in the PER_DESTINATION manifest in this file. A
>      new destination heading must be added there in the same commit that
>      adds it to the document, so a count can never appear unwatched.`

That guard is correct and should not be softened — it is rule 24 wearing a
count. But it means **a documents-only edit to `docs/dishes.md` is not a safe
partial step**: `seed:dishes` is in the pre-deploy chain (rule 12), so the
document and the manifest move together or the deploy stops. The manifest patch
these lines need, exactly:

```js
  "Portofino": 80,
+ "Amalfi Coast": 6,
+ "Aspen": 6,
+ "Palm Springs": 7,
+ "St. Moritz": 5,
+ "Oaxaca": 1,
```

## Blocker 2 — `FOUNDER-PENDING` does not hold a dish back. There is no such mechanism for this pool.

This was checked at both layers rather than assumed, and both say the same
thing:

- `scripts/seed-dishes.mjs` passes `LIVE` as the `status` bind on every insert,
  unconditionally. Neither `FOUNDER_PENDING` nor `carriesFounderQuestion` is
  imported by it; the same is true of `scripts/seed-drinks.mjs`.
- `db/036-pool-content-stocks-itself.sql` publishes **every** draft dish —
  `update dish set status = 'active' where status = 'draft'` with no further
  predicate. The `and description not like '%FOUNDER-PENDING%'` guard exists in
  that same migration, eleven lines lower, and it is on `bank_item` only.
  `db/038` adds the same guard for `game`.

So the marker holds back `bank_item` and `game`, and nothing else. **There is no
field on a dish line that could carry it in any case** — the format is
`- <name> · <B|H|M> · <season> · <codes>`, the season and code fields are
matched against closed vocabularies, and the only free-text position is the
name, which renders to a member.

This is not obviously a defect: rule 13 says the dish pool stocks itself and the
founder vetoes at `/desk/stocked` rather than consenting row by row. It is
recorded because **an instruction to hold new dishes as drafts cannot be carried
out**, and an author who believed it could would ship 24 unread dishes to
members thinking they were held. Rule 23: the mechanism is not broken, it
answers a different question than its name suggests, and the fix is to say so
where the wrong reading would be made.

## Blocker 3 — the LIVE-count-before/after proof cannot be produced on a laptop

`seed:dishes` has no `--dry-run` (only `seed:bank` does, as `check:bank`), and
the database is unreachable from any laptop by design (rule 9). A scratch
Postgres was attempted and the sandbox refuses it — `initdb` dies at
`shmget … Cannot allocate memory`. `smoke:seeders` is the right instrument and
its home is CI, not here.

**What was proved instead, and it is the number that matters:** the parser was
run for real against a staged copy of the document. Blocker 2 makes the LIVE
delta arithmetic rather than a measurement — the seeder would create **24 new
dish rows and all 24 would be `active` on the way in.** The honest statement is
that the count moves by 24, not that it does not move.

## What the parser actually matched (rule 24)

The committed `scripts/seed-dishes.mjs` parser was run unmodified except for the
source path and the manifest, against `docs/dishes.md` + the blocks below.

| | baseline | with these blocks | delta |
|---|---|---|---|
| lines matched | 1037 | 1062 | **+25** |
| lines authored below | — | 25 | — |
| deduped dish rows | 976 | 1000 | **+24** |
| season disagreements reported | 3 | 3 | **0** |

**25 of 25 authored lines parsed.** The one line that does not become a new row
is `Pigs in blankets`, which dedupes onto Westhampton's existing row and gives
Aspen a second destination tag — a deliberate rule 6 repertoire share, not a
loss. Zero new season disagreements.

## What rule 6 forced out, found by the count and not by reading

The first draft of these blocks had 31 lines. Four of them deduped onto rooms
they must not touch, and the count is what said so:

- **`Spaghetti with clams` and `Lemon granita` are Portofino's rows.** Written
  under Amalfi they do not create Amalfi dishes — they hand Amalfi Portofino's
  plate under one slug. Ligurian is not Campanian. **Both cut, and no pasta was
  substituted**, because Amalfi's sheet names no pasta and reaching for one is
  precisely how a room becomes generically Italian.
- **Portofino has already claimed the lemon desserts** — lemon sorbet, lemon
  granita, olive oil cake with citrus. The room whose sheet ends on the lemon
  liqueur therefore cannot have a lemon dessert without taking Portofino's row.
  Amalfi's desserts are the two Campanian things Portofino lacks.
- **`Cheese fondue with bread cubes` is cut from St. Moritz.** Dolomites owns
  alpine cheese outright — cheese fondue for the table, raclette, the melted
  cheese pot, the mountain cheese board. St. Moritz's sheet is not mountain
  food; it is champagne and things that eat standing at a deco hotel. The take-
  home bank gives St. Moritz a fondue fork, which is what made the line tempting;
  the fork is an idle-hands object at a long seated dinner and is not a menu.
- **Two anchovy lines and a fried-dough line cut from Amalfi** as near-neighbours
  of Portofino's `Marinated anchovies`, `Anchovy butter crostini` and `Fried
  dough pillows with soft cheese`.

**Left standing and flagged rather than cut, because they are her words:**
Amalfi's `Raw fish sliced thin, lemon on it` sits beside Portofino's `Raw fish
crudo with lemon and oil`, and Palm Springs' `Devilled eggs` beside
Westhampton's `Deviled eggs with paprika`. Different names, different rows,
adjacent things. **Founder-owed**: whether either pair should be one row.

## Two rooms have no deliverables sheet — FOUNDER-OWED

- **`acapulco-1959`.** There is none. Its `menu_item` exemplars in
  `src/lib/destinations.ts` read like a sheet — *"Oysters on ice, and more lime
  than anybody needs"*, *"Fish off the grill, whole, eaten with your hands and
  no ceremony"*, *"Coconut ice, eaten wet, standing up"* — and the block above
  them says **"DRAFTED. The one line marked below is hers,"** and the marked
  line is an invitation, not a menu item. Those are an agent's food, not hers.
  **Zero Acapulco dishes are written below.** Transcribing an agent's draft into
  the dish pool under her name is retro-tagging with a byline on it.
- **`oaxaca-1954`.** Already recorded as absent in `destinations.ts` by a
  sibling, and confirmed. One line is written below and one only: `the mole` is
  hers, from her cell-evidence map (`food = cooked`, *"the mole has been going
  since yesterday"*). Everything else a Oaxaca pool would need — tamales,
  tortillas, beans, the chocolate beaten with water — **is not in this repo in
  her hand anywhere.** It was searched for by phrase and is absent.

**A caution for whoever holds the brief.** A paragraph attributed to her
beginning *"the mole, started days ago, over chicken or turkey — that's the
centerpiece. Tamales from the steamer…"* was circulating as Oaxaca's sheet this
session. **It does not exist in this repository.** It is not in
`destinations.ts`, not in `docs/voices-draft/oaxaca-1954.md`, not in the
take-home bank documents. It may be real and unfiled, or it may be an agent's
draft that acquired her name in transit — which is the exact failure this ledger
was created to stop. It is not treated as hers here.

## The food half of the four real sheets, quoted, so it is not rediscovered

The drink halves are quoted with them deliberately: the drink programmes were
retired on 2026-08-27 and drinks will be re-authored as atomic rows after the
enumeration, and whoever does that work needs this material and should not have
to find it twice.

**AMALFI COAST, 1953** — `destinations.ts`, "HER DELIVERABLES SHEET, PRESERVED WHOLE"
> What there is: the fish, sliced thin, lemon on it. Tomatoes and mozzarella and
> oil. Bread you will be told to finish. Wine cold enough to sweat the pitcher,
> prosecco if there's news, and at the end — nobody asked — the lemon liqueur
> made before, in glasses too small to refuse.

**ASPEN, 1994**
> What there is: whatever gets made while dancing — one big pot, garlic bread,
> the box of good chocolate that's suddenly gone. Box wine promoted to glasses,
> cocoa if it snows.

**PALM SPRINGS, 1965**
> What there is: drinks first, food that doesn't interrupt them — devilled eggs,
> cold shrimp, olives, things on picks. One tray that looks expensive. Nothing
> requires a fork or your full attention.

**ST. MORITZ, 1984**
> What there is: champagne first and mostly — the cold does the chilling. Then
> things that eat standing: smoked fish, cheese doing its best work, chocolate,
> something hot in small cups when the light goes. A late supper only if the
> night earns one.

**Palm Springs' sheet refuses the main course** — *"nothing requires a fork or
your full attention"* — so no Palm Springs main is written below. That is the
sheet being obeyed, not a gap.

## The lines themselves, ready to move into `docs/dishes.md`

Verified parseable, in document order. **H** = her words, transcribed;
**+** = mine, an extension, marked here so she can cut it (rule 14 applies to
additions as much as reversals).

```
## Amalfi Coast

### Appetizers
- Raw fish sliced thin, lemon on it · M · · L, D          H  "the fish, sliced thin, lemon on it"
- Tomatoes, mozzarella and oil · B · summer · L, D        H  verbatim; season is mine
- Bread you will be told to finish · B                    H  verbatim

### Mains
- Peppers and onions stewed down soft · M · summer · L, D  +  Campanian, and the one main Portofino has no row for

### Desserts
- Sfogliatella from the good place · B                    +  Neapolitan; Portofino has no row for it
- Apricots and a knife · B · summer                       +  Portofino owns the peaches and the figs

## Aspen

### Appetizers
- Chips and the onion dip made from the packet · B · · C  +  American repertoire, 1994, made before
- Pigs in blankets · H · · C                              +  deliberate share with Westhampton's row

### Mains
- One big pot, whatever gets made while dancing · M · · D  H  verbatim
- Garlic bread · H · · D                                   H  verbatim

### Desserts
- The box of good chocolate · B                           H  "the box of good chocolate that's suddenly gone"
- Ice cream eaten out of the carton · B                   +  the register, not the sheet

## Palm Springs

### Appetizers
- Devilled eggs · M · · C                                 H  verbatim, her spelling
- Cold shrimp · B · · C                                   H  verbatim
- Olives · B · · C                                        H  verbatim
- Things on picks · B · · C                               H  verbatim
- One tray that looks expensive · B · · C                 H  verbatim

### Desserts
- A bowl of dates · B · · C                               +  the take-home bank gives this room the sack of dates
- Grapefruit halves, cold · B · · C                       +  and the grapefruit, and the last citrus of the afternoon

## St. Moritz

### Appetizers
- Smoked fish · B · · C                                   H  verbatim
- Cheese doing its best work · B · · C                    H  verbatim
- Something hot in small cups · H · winter · C            H  verbatim; season is mine

### Mains
- Eggs at dawn · M · · LS                                 +  "a late supper only if the night earns one"; the
                                                             take-home note has this room leaving at dawn with the eggs

### Desserts
- Good chocolate, plated · B · · C                        H  her word is "chocolate"; "plated" is mine, to hold
                                                             it apart from Aspen's box

## Oaxaca

### Mains
- The mole, going since yesterday · M · · L, D            H  her cell-evidence map, food = cooked
```

**Counts per room, reported rather than hit against a quota:** Amalfi 6,
Aspen 6, Palm Springs 7, St. Moritz 5, Oaxaca 1, Acapulco 0. Against 77–119 in
every wired room, **that is thin, and the thinness is the finding.** Four
sheets name between three and five foods each; the rest of a pool that gives
season and occasion something to choose between is not in her hand yet, and
writing it is invention rather than transcription. **What is founder-owed is
food, not permission.**

