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

# Dishes for the six empty rooms — LANDED 2026-08-27

> **LANDED 2026-08-27.** Everything below was written while these lines were
> staged and un-admitted. They are now in `docs/dishes.md` and
> `PER_DESTINATION` moved with them in the same commit. **The blockers are
> resolved, not forgotten** — read the section at the end of this block,
> "What landed them, and what the founder changed on the way", before acting on
> anything here. Three claims below are now false and are marked in place:
> Blocker 2 was answered by a ruling, the no-pasta cut was reversed, and
> `Spaghetti with clams` turned out to be a shared row rather than a collision.
> The reasoning is kept whole because rule 14 says the losing argument is the
> part that gets lost.

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
  **[REVERSED 2026-08-27 — see the landing section at the end of this block.
  The founder: "anyplace like ny, las vegas and italy have to allow pasta,"
  and "th[ey] both can use spaghetti w clams, as can westhampton." The half of
  this bullet about `Lemon granita` STANDS.]**
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

---

## What landed them, and what the founder changed on the way — 2026-08-27

### The ruling that cleared Blocker 2

> **"no holdback for food or drinks, if there are problems i will fix later."**

Blocker 2 above is correct about the mechanism and was correct to stop on it:
`FOUNDER-PENDING` cannot hold a dish back, and there is no field on a dish line
that could carry it. The previous agent was right not to ship content she had
not agreed to see live. **She has now agreed.** The dishes went into
`docs/dishes.md` unmarked and unstaged, exactly as rule 13 describes — live on
deploy, vetoed at `/desk/stocked` rather than consented to row by row. Nothing
was built to hold them back, because building it would have been building the
mechanism she had just said she did not want.

### The pasta reversal, and the argument that lost

The staged block cut all pasta from Amalfi with this reasoning, which is worth
keeping because it is a good argument that lost on the founder's authority
rather than on its merits:

> *Both cut, and no pasta was substituted, because Amalfi's sheet names no
> pasta and reaching for one is precisely how a room becomes generically
> Italian.*

**What beat it, 2026-08-27:** *"anyplace like ny, las vegas and italy have to
allow pasta."* The cut was reasoning from silence about a sheet — rule 3's
shape, applied to a menu rather than a matrix cell — and she has supplied the
positive evidence it was missing.

**Her ruling and rule 6 compose; neither is bent to fit the other.** Rule 6
still decides WHICH pasta, and it says `regional` travels within its CUISINE:

- **New York and Vegas** — Italian-American repertoire, which rule 6 already
  names. **Both already had pasta and needed none added.** New York holds six
  rows (Sunday gravy over rigatoni, spaghetti and meatballs, lasagna, pasta
  with spring vegetables, linguine with white clam sauce, shrimp scampi) and
  Vegas two (shrimp scampi, spaghetti with butter and parmesan, late). Checked
  rather than assumed, because she named the two rooms specifically and their
  absence would have been a gap she had just asked about.
- **Amalfi** takes Campanian pasta and gets exactly one of its own:
  **`Spaghetti with fried zucchini and provolone`** — spaghetti alla Nerano,
  from the Amalfi peninsula itself. `regional`, Campanian, `summer`, and
  marked as an extension rather than her words.
- **Portofino keeps Liguria** — trofie with pesto, lasagne with pesto, ravioli
  with walnut sauce — and gains nothing from this ruling.

**One pasta and not three.** A first pass added a second Campanian line
(`Paccheri with tomatoes and basil`) and it was withdrawn before commit: with
the shared vongole row below, three pasta mains would have been a third of a
nine-dish pool, in a room whose sheet names fish, tomatoes and mozzarella,
bread and a lemon liqueur. A ruling that pasta is ALLOWED is not an instruction
to fill the room with it.

### `Spaghetti with clams` is a shared row, not a mis-assignment

The staged block cut it from Amalfi because it deduped onto Portofino, and read
that dedupe as a rule 6 violation about to happen. A second reading suspected
the opposite — that spaghetti alle vongole is Campanian and PORTOFINO held it
wrongly. **Both readings were wrong, and the founder settled it:**

> **"th[ey] both can use spaghetti w clams, as can westhampton."**

So it is one dish three houses serve, and it is written under three headings
and deduped to one row at import — the document's own convention, stated at its
top, and the same mechanism `Pigs in blankets` uses for Westhampton and Aspen.
Verified: `spaghetti-with-clams` is a single `main` row claimed by Westhampton,
Portofino and Amalfi Coast. **Nothing was moved.** Portofino's authored row was
left exactly where it was; the two new lines join it.

**Its tier is `repertoire`,** and rule 6's definitions leave nothing else. It is
not `signature` — no room's most recognisable fact. It is not `regional` —
`regional` travels within one CUISINE, and this crosses Ligurian, Campanian and
a 1976 Long Island house. That leaves *"anywhere the register fits,"* and three
coastal rooms that serve clams is exactly that.

**AND THIS IS EVIDENCE ABOUT RULE 6 ITSELF, which is why it is written here.**
Rule 6's only worked example runs one direction: *"Chicken parmesan is
Italian-AMERICAN repertoire: New York and Vegas, never Portofino"* — a dish
crossing INTO American rooms and being refused BY an Italian one. Spaghetti
alle vongole runs the other way: two Italian rooms of different cuisines plus
an American one, admitted. The rule is unchanged and predicts both. But a
future reader deriving the rule from its example alone would get this case
wrong, because the example set contains only the refusal and never the
admission. **A rule whose examples all point one way is a rule that will be
half-learned.**

Written but NOT applied, because it is not an agent's call: `Linguine with
clams` sits at Nantucket as a separate row, and whether it and
`Spaghetti with clams` are one dish under two names is **founder-owed**,
alongside the two adjacent pairs already flagged above (Amalfi's raw fish
beside Portofino's crudo, Palm Springs' devilled eggs beside Westhampton's
deviled eggs with paprika).

### What the count said, run against the real document (rule 24)

The committed parser, unmodified except for having its write half cut off, run
against `docs/dishes.md` before and after:

| | baseline | landed | delta |
|---|---|---|---|
| lines matched | 1037 | 1065 | **+28** |
| bullet lines in the file | 1037 | 1065 | — |
| lines the parser skipped | 0 | **0** | 0 |
| deduped dish rows | 976 | 1001 | **+25** |
| destinations | 12 | 17 | +5 |
| season disagreements | 3 | 3 | **0** |

28 lines, 25 new rows: `Pigs in blankets` and `Spaghetti with clams` (twice)
dedupe onto rows that already exist. The three reported season disagreements
are the same three as before — ambrosia, strawberry shortcake, fried chicken —
and none of the new lines added a fourth.

### One finding the count produced that reading would not have

**`Garlic bread` changes slug in production, and nothing about it looks wrong.**
Aspen's line puts garlic bread under **Mains**; New York and Vegas already hold
it under **Appetizers**. The key is `(name, course)`, so those are two rows —
correct, and the same shape as `Papaya with lime`, which is a Tahiti dessert and
a Havana appetizer today. But `assignSlugs` appends the course to **both** rows
once a name spans two courses, deliberately, so that neither is arbitrarily
"the real one". The live `garlic-bread` row therefore becomes
`garlic-bread-appetizer` plus a new `garlic-bread-main`, and the old slug is
left behind as an ORPHAN — reported by name on the run, never deleted, exactly
as the seeder's comment promises for a rename.

Consequences, stated so nobody rediscovers them at full price: the first deploy
after this commit creates **26** dish rows rather than 25 (the 25 above plus the
re-slugged appetizer), and prints one orphan line for `garlic-bread`. Any
curator edit made against the old `garlic-bread` row stays on the orphan and
does not follow. **This is the seeder working as designed and is not a defect
to fix here** — but it is the second cross-course name in the catalogue, and if
a third arrives the orphan list becomes a place people stop reading.

The meal-shape field was left OFF both new `Spaghetti with clams` lines on
purpose. Meal claims are UNIONED across the lines of a deduped dish and a union
can only narrow, so writing Amalfi's house style (`· · L, D`) onto a row
Portofino and Westhampton already share would have quietly removed their
spaghetti from every other meal shape. The row keeps its "no claim, so
anywhere".

### Still founder-owed after this pass

- **Acapulco: food.** Zero dishes written, and it is deliberately absent from
  `PER_DESTINATION` — it has no `##` heading, so the count check never sees it.
  The reasoning above stands unchanged: its `menu_item` exemplars are an
  agent's draft, and transcribing them into the pool under her name is
  retro-tagging with a byline on it.
- **Oaxaca: everything but the mole.** One line, hers. The tamales, tortillas,
  beans and the chocolate beaten with water are still not in this repo in her
  hand, and the paragraph that was circulating as her Oaxaca sheet **still does
  not exist in this repository.**
- **The three adjacency pairs** named above, plus linguine-versus-spaghetti
  with clams.
- **The thinness itself, and it is the finding that matters most.**
  8, 6, 7, 5, 1 against 77–119. **THESE DISHES DO NOT UNMUTE RULE 26'S SECOND
  NUMBER, and it would be easy to believe they did.** `EVIDENCE_FLOOR` in
  `scripts/deliverables.mjs` is **12**, it is a floor on the SMALLER room, and
  all five of these rooms are under it — 8, 6, 7, 5, 1. So `overlap()` still
  returns `null` for every pair involving them, `deliverablesVerdict` still
  reads `unknown`, and rule 26 still forbids reading `unknown` as `disjoint`.
  Checked rather than assumed, because "the rooms have food now" is exactly
  the sentence that would carry an unearned verdict.

  The consequence for rule 28 is direct and should be said plainly: the founder's
  *"once the drinks and food are added they r different enough"* is **still
  neither true nor false**, and the tone cap still must not move. Amalfi is
  closest — 8 of 12 — and would clear the floor on four more lines from her
  sheet. Oaxaca, at 1, is nowhere near.


---

# 2026-08-27 — The games become rows, and two rooms contradict themselves

**LANDED.** Founder, on being shown the count: *"fix the parser so the games
become rows. lets not make a blanket rule that a room is gameless."* Both
halves are done. Nothing here is a proposal awaiting a signature except the two
rulings owed at the bottom, which are hers alone.

## The defect, in one sentence

`scripts/seed-bank.mjs` routed a bank row to `bank_kind` **by section heading
only** — `GAMES:` and `GAMES/BOOKINGS:` became `game`, everything else did not.
Only three rooms of eighteen ever wrote a `GAMES:` heading with content in it,
so the seeder produced **three `game` rows in the whole catalogue** while
twelve more rooms named a game inside a `GOODS:` line. A read-only audit
counted 42 distinct games in the repo, 3 of them `game` rows, and 22 of the
missing 39 already holding a bank row filed as `good` or `printed_card`.

The header did not lie — it answered a different question than it appeared to
(rule 23). `GAMES:` is a block she wrote when she had a game to list
*separately*, and its absence was never a claim that the room had none.

## The mechanism, and the two that were refused

**A NAMED RULING TABLE KEYED BY SLUG** — `GAME_ROUTINGS` in
`scripts/seed-bank.mjs`, twenty rows, each carrying the kind the document
derives today (`was`), the kind the ruling gives it, and **the words in the
clause that are the evidence**, quoted, so a reader can check the ruling
against the document without trusting the file. It is the shape `PHASE_RULINGS`
already uses in the same file and its argument transfers unchanged: derivation
stays honest and a ruling sits beside it in the open, two authorities, never
one pretending to be the other.

- **A per-clause `(GAME)` marker in the document was refused by the document
  itself.** Its provenance header says everything above the second `GOODS:`
  line in each room is *"v1 as she blessed it, unaltered"*, and the phase
  rulings say why that matters: a v1 edited to make a seeder come out right
  destroys the only evidence of what the routing was derived from.
- **Content matching was refused by rule 24, and one row proves it.** Vegas's
  Celebrity deck reads *"~80 printed marquee-ticket slips + draw vessel +
  fishbowl three-round rules"*: a matcher must hit "fishbowl" without hitting
  "bowl", and "deck" reaches four playing-card decks that are goods and one
  prompt deck that is a game. That is the hyphen incident waiting to happen.

**A ruling table can match 20 of 20 or it can fail. It cannot quietly match
nine.** Every entry must find its row and find it holding `was`, or the run
stops.

## The count, which is the part that matters (rule 24)

| | before | after |
|---|---|---|
| `game` rows | 3 | **23** |
| `good` | 292 | 276 |
| `printed_card` | 29 | 25 |
| `host_act` | 32 | 32 |
| total rows | 356 | 356 |
| rooms with a game row | 3 | **13 of 18** |
| rows that changed kind | — | **exactly 20** |
| rows LIVE / held in draft | 174 / 182 | **174 / 182, unchanged** |

**THE AUDIT SAID 22 AND THIS RULING CONVERTS 20.** The difference is not
rounded away: every candidate that was looked at and refused is in
`GAME_ROUTINGS_DECLINED`, printed on every run with its reason, so the two
missing rows can be read rather than guessed at. The likeliest of them is
**Vegas's `Pick a Number as the host's game`** — the clause literally says
"game", and it sits under `HOST ACTS:`, where the header genuinely does say who
performs the thing. Its kit is already routed, so making the act a second game
row would give one game two rows in one room. **One line in `GAME_ROUTINGS`
overrules that if the intent was both.**

## The object-versus-game split, decided

**One clause yields ONE row of its own kind, plus the cards that ride with
it.** The liar's-dice, Watten/briscola, scopa and Conquián rules cards are
still their own `printed_card` rows; what changed is that the thing they ride
with is a `game` rather than a `good`. This is `IS_A_KIT`'s argument one level
up — *a kit is a good even when it contains printed matter* becomes *a game is
a game even when it contains an object and a card*.

**A clause is never split into two rows of different kinds by machine.** Where
a clause names an object AND a distinct thing somebody else does with it, the
activity is a missing authored line and is reported as one. New Orleans:
*"tarot deck out (Marseille or Rider-Waite; host reads for whoever asks)"* —
the deck is a good, **the reading is a game and has no row**, and pulling it
out of the middle of the deck's sentence is the guess the seeder already
refuses for a gesture that also names a kit. Big Sur's Thoth deck stays a good
for the opposite and stronger reason: its clause says *"object only, no
reader"* — positive evidence that it is **not** a game, which is rule 3 working
in the direction nobody expects.

**So the document must contain more than it does.** Twelve rooms now have a
game row for the object on the shelf. The reading at New Orleans, the naming
game Westhampton's sealed score is the residue of, and the games that live only
as voice lines are **authoring, not parsing**.

## A second defect the count found on the way

`las-vegas-celebrity-1960-deck` has been filed in **`the_table_set` slot**
since db/043, because `bank_item_default_slot()`'s table-dressing vocabulary
contains `'bowl'` — for the bowls of lemons and the citrus bowls — and
*fishbowl* contains *bowl*. A party game has been shipping as table dressing
and nothing said anything, because the row looked entirely at home. It stops
meeting the branch now, since that branch is gated on
`kind in ('good','printed_card')` and a game never was one. **The vocabulary is
not widened** — `'bowl'` is right for the bowls, and a word-boundary rule is a
different change with its own argument.

## db/048, and what it does not do

`db/048-a-game-is-not-a-heading.sql` moves the same twenty rows in a database
that already holds them, because the seeder cannot: `kind` is inside its
`differs` comparison, so a plain deploy would report twenty differences forever
and change nothing, and `--overwrite` would let the file beat the curator on
every column of every row rather than on twenty kinds.

**It keeps db/043's restraint, which was explicitly praised, in both forms
available here.** A row moves only where its kind is *still exactly the value
the old parser wrote* — a curator who has already reclassified one is not
overruled and the disagreement is raised as a notice rather than settled by
whoever ran the deploy. And the slot that follows the kind is moved only where
the claim still carries the machine's own note.

**Zero moved rows is the correct answer on a fresh database** (rule 22):
`migrate` runs before every seeder, so `bank_item` is empty when db/048 runs
and `seed-bank` inserts all twenty as games directly. There is deliberately no
"must have moved rows" guard, because it would fail every fresh build.

**NOT VERIFIED AGAINST A LIVE DATABASE.** `initdb` fails on this machine with
`shmget … Cannot allocate memory` — the same failure a sibling reported, and it
reproduces with the sandbox disabled, so it is the machine and not the harness.
db/048 has been read and argued but never executed.

## Checked, and it holds: the kill list

`KILLED_GAMES` in the seeder checks every row against the kills recorded in the
bank document and the three take-home sheets — keno, the weather-forecast act,
the card that took the last trick, the belote sheet, the cochonnet, your card
from the door, a Thoth tarot card, the Fischer–Spassky scoresheet, a single
domino, costume briefs catalogue-wide. **No row carries any of them**, and a
match is a failed run rather than a warning: a killed game reappearing as a
routing win would look exactly like the fix working.

**Full phrases, never keywords, and that is the whole care in the list.** *The
belote sheet* was cut from Côte d'Azur and *belote rules card* is routed to
`game` — one word apart, opposite decisions. A keyword check on "belote" would
have refused a live routing and read as diligence while doing it.

## "Let's not make a blanket rule that a room is gameless"

`GAMES: none` produces **no row, no column and no negative claim.** Nothing in
this catalogue records that a room *has* no game, and nothing may. The report
now says so on every run, so that nobody later "completes" the mechanism by
writing the fact down. A room that says none can receive a game the moment
somebody names one — in a `GAMES:` block or in `GAME_ROUTINGS` — without
touching the parser.

Five rooms still have no game row: Westhampton, Portofino, Tahiti, Palm Springs
and Acapulco. **That is an absence of authoring, not a property of the room.**

## RULINGS OWED — two rooms contradict themselves

> **WITHDRAWN 2026-08-27, NOT ANSWERED — see the pass at the end of this file.**
> Neither was a contradiction for her to settle. CLAUDE.md rule 29 was written
> for exactly this: `GAMES: none` is a stale document line and not a ruling, a
> room whose document and whose voice disagree resolves toward **having** the
> game, and it does not get asked a third time. Both rooms are now rows —
> `tahiti-the-last-night` and `acapulco-the-last-song`. Kept whole per rule 14
> because the instinct to stop and ask was not wrong; what beat it is a
> standing ruling the section did not have.

Only the founder can settle these. The voice record and the bank record
disagree and nothing has been changed in either direction.

1. **TAHITI.** `docs/atmosphere-idea-bank-v1.md` says **"GAMES: none, on
   purpose"**, while `src/lib/destinations.ts` carries a `piece: "game_rule"`
   for the room: *"Everybody says what they would want on the last night.
   Whoever names something already on the table cooks tomorrow."*
2. **ACAPULCO.** **"GAMES: none — the band, the window, and the dancing are the
   shelf"**, against its own voice line: *"Everybody names the last song.
   Whoever names one already played goes in the water."*

Either the bank line is stale and the room has a game, or the voice line is a
turn of phrase rather than a game and the `game_rule` piece is the wrong
container for it. Both readings are defensible from the files; neither is
resolvable from them.

## The seam nobody has crossed yet — reported, not touched

**`src/lib/destinations.ts` carries 20 `piece: "game_rule"` entries, one in
each of the eighteen rooms and two each at Amalfi and Aspen.** (The audit said
21 across 17; the corrected count is 20 entries across 18 rooms — the
twenty-first occurrence of the string is prose in a comment.) Each is a game
written in the room's own voice; **none is a row in `bank_item` or in the
`game` table.** That is where most of the catalogue's games live.

Routing them is **not** a parser change. A voice line is a sentence; a `game`
row needs rules, bounds, a host role and a runbook (db/010). It is authoring,
in the game table's own seeder, and it is a decision about whether eighteen
one-line rituals are eighteen games or eighteen sentences.

### Three take-home dependencies still aimed at nothing

**This fix satisfies none of them, and it is worth saying why rather than
leaving it to be re-derived.**

- Vegas's IOU — `from game yields_iou`
- Oaxaca's Conquián tally and St. Moritz's backgammon column —
  `from ambient_game yields_score_sheet`
- St. Moritz's doubling cube — `from ambient_game yields_prize`

Those slots are filled from the **`game` table**. A `bank_kind = 'game'` row
fills one of the four **atmosphere** slots (db/043) and does not feed them. And
they would still be aimed at nothing if all twenty were game-table rows,
because `ingredient_supplies` is empty on every database the committed chain
builds (db/044) — no pool has tagged its rows yet.

### The `game` table is still Westhampton's alone

> **CLOSED 2026-08-27 — see the pass at the end of this file.** Twenty room
> games are authored in `src/lib/games.ts`, each `native` to its own room, so
> all eighteen authored rooms now have a game written for them. The seven
> original rows were **not** rescoped and stay playable everywhere, which is
> what their affinities always meant.

All of its rows are scoped to `westhampton-1976`, so **seventeen rooms have no
eligible game-table row.** This work does not change that and does not claim
to: it moved rows inside the bank, which is the shelf, and left the shelf's
sibling table exactly where it was.

---

# 2026-08-27 — AMALFI'S SECOND SHEET, AND RULE 26'S SECOND NUMBER SPEAKS

**LANDED.** The founder sent fifteen Amalfi foods in one message. Fourteen are
new; the fifteenth was written this morning. `docs/dishes.md` goes **8 -> 22**
at Amalfi and `PER_DESTINATION` moved with it in the same commit.

**The result she was waiting on: AMALFI CLEARS THE EVIDENCE FLOOR.** At 22
claims against a floor of 12 it is the first of the six thin rooms to become
measurable, and `npm run check:voices` now prints a number instead of `unknown`
for all twelve of its pairs with wired rooms.

## What her list was, and what happened to every line of it

Her message was **plainly pasted from a restaurant menu** — one line carried a
price and one carried a restaurant's name — so it was mined, not transcribed.
Fifteen items, fifteen written. **Nothing was cut.**

| her line | written as | course | tier |
|---|---|---|---|
| gelato | `Gelato` | dessert | repertoire |
| pizza | `Pizza` | main | regional (Campanian) |
| chargrilled octopus | `Chargrilled octopus` | appetizer | repertoire |
| Spaghetti alla Nerano | *already on Amalfi* as `Spaghetti with fried zucchini and provolone` | main | regional |
| Spaghetti al Limone | `Spaghetti with lemon` | main | regional (Campanian) |
| Scialatielli ai Frutti Di Mare | `Scialatielli with seafood` | main | **signature** |
| Zucchini flowers with ricotta cheese, ham, fried in light batter, served with zucchini sauce and smoked cheese | `Zucchini flowers with ricotta and ham, fried in light batter, with zucchini sauce and smoked cheese` | appetizer | regional (Campanian) |
| Tagliolini Antica Trattoria with lemon cream sauce, red prawns | `Tagliolini with lemon cream and red prawns` | main | regional (Campanian) |
| lumpfish on creamed spinach | `Lumpfish on creamed spinach` | main | repertoire |
| lemon sorbet | `Lemon sorbet` — **joins an existing row** | dessert | repertoire |
| Turbot fish leek and potato purée, fried leeks and coffee powder | `Turbot with leek and potato purée, fried leeks and coffee powder` | main | repertoire |
| Veal fillet in pistachio flour crust, blanched spinach, Sorrento orange reduction, baked baby potatoes | `Veal fillet in a pistachio crust with blanched spinach, Sorrento orange and baked baby potatoes` | main | regional (Campanian) |
| Lamb chops € 43 breaded with herbs, mustard and Provolone del Monaco cheese sauce, paprika sweet potato puree and fried green beans | `Lamb chops breaded with herbs and mustard, Provolone del Monaco sauce, paprika sweet potato purée and fried green beans` | main | regional (Campanian) |
| Beet salad almond cream, walnuts and mediterranean herbs | `Beet salad with almond cream, walnuts and herbs` | appetizer | repertoire |
| Risotto with leeks, candied lemon, basil and wild fennel | `Risotto with leeks, candied lemon, basil and wild fennel` | main | repertoire |

## THE FILTER THAT WAS APPLIED, AND THE ONE THAT WAS WITHDRAWN

**Rule 25.3 was nearly misapplied, and the correction is the most valuable
thing on this page.** Four of her lines — the turbot, the pistachio-crusted
veal, the lamb chops with three garnishes, the lumpfish — were on their way to
being "honestly reduced" as plated-to-order restaurant compositions a host
cannot make for twelve people. **The founder stopped it:**

> **"the host can of course make all of those things."**

**Rule 25.3 is about STAFF, not about culinary difficulty.** Its own words are
*"abundance is MADE IN ADVANCE, never SERVED"* and *"the moment a line implies
somebody carrying a tray"* — a test on SERVICE. A host can crust a veal fillet
in pistachio, reduce an orange, breadcrumb a lamb chop and make a cheese sauce;
that requires a cook, and **the host IS the cook.** What the rule forbids is a
dish that cannot exist without somebody plating it to order and carrying it out
while she is at her own party.

This is worth keeping because the misreading is attractive and repeatable: an
ambitious dish LOOKS like a restaurant, and an agent applying 25.3 by aesthetic
rather than by its text will quietly delete the founder's food and report it as
rule compliance. **The test is whether the dish can be MADE IN ADVANCE, not
whether it is hard.** The single word removed under 25.3 across all fifteen
lines is `served` — "served with zucchini sauce" became "with zucchini sauce" —
which is the service verb and costs no content.

## The three proper-noun calls (rule 25.2)

Rule 25.2 is *"no proper noun a guest would not say at the table."* The test is
whether somebody would name it out loud while eating, and it cuts differently
three times in one list:

- **`Antica Trattoria` — CUT.** It names a restaurant. A restaurant's name in a
  dish name is the menu it was pasted from, still attached. Nobody at her table
  says it, and the dish is a tagliolini with lemon cream and red prawns
  whatever the trattoria calls it.
- **`Provolone del Monaco` — KEPT.** It is a CHEESE. A guest asks what the
  sauce is and is told the name of the cheese; that is exactly a table word.
  That it is also a DOP from the Monti Lattari — the Amalfi peninsula's own
  ridge — makes it the most Campanian noun in her list.
- **`Sorrento` — KEPT.** A place a guest would say, and here it is doing an
  ingredient's work: a Sorrento orange is a kind of orange, the way a Meyer
  lemon is a kind of lemon.
- **`mediterranean herbs` — trimmed to `herbs`,** and this is the same call in
  its least obvious costume. It is not a proper noun that names a thing; it is
  a menu adjective that makes a plate sound like a region. A guest says
  "herbs". Content cost: none.
- **`€ 43` — CUT.** Menu furniture. Not a judgement call.

## Tiers, and the one that is not obvious

Rule 6: `signature` never travels · `regional` travels within its CUISINE ·
`repertoire` goes anywhere the register fits. Amalfi is the catalogue's only
Campanian room, so `regional` here means "stays until a second Campanian room
exists", and that is the point of tiering rather than hardcoding.

- **`Scialatielli with seafood` is the one `signature`.** Scialatielli is a
  pasta cut from the Amalfi peninsula itself and from nowhere else. Every other
  line on her list can be imagined on another Italian table; this one names the
  coast in the shape of the pasta. Rule 6's examples — pesto is Portofino,
  gumbo is New Orleans — are exactly this shape.
- **`Pizza` is `regional`, not `repertoire`, and the distinction is load-bearing.**
  It is deliberately NOT free to travel: pizza in a New York room is a
  different object with the same name, and `repertoire` would license precisely
  the drift rule 6 exists to stop. Checked: the word `pizza` appears nowhere
  else in `docs/dishes.md`, so this is a clean new row and not a claim on
  somebody else's.
- **The four continental plates — turbot, lumpfish, beet salad, risotto — are
  `repertoire`**, argued rather than assumed. None is distinctively Campanian;
  they are fine coastal-Italian cooking that would sit honestly at Portofino or
  the Côte d'Azur. Calling them `regional` would fence food that is not fenced
  in life. Calling the *veal* and the *lamb* repertoire would be the mirror
  error — a Sorrento orange and a Provolone del Monaco sauce are Campanian by
  their ingredients, not by their technique.
- **`Gelato` and `Lemon sorbet` are `repertoire`**, and the second one is the
  interesting case below.

## `Lemon sorbet` deliberately joins a row it does not own

`- Lemon sorbet · B` already existed at **Côte d'Azur AND Portofino**. Written
under Amalfi it dedupes to **one dessert row claimed by three houses** — the
document's own convention, stated at its top, and the exact shape the founder
ruled correct for `Spaghetti with clams` earlier today.

**This is the line a previous pass cut, and the reasoning that cut it is worth
keeping (rule 14).** That pass wrote: *"Portofino has already claimed the lemon
desserts… the room whose sheet ends on the lemon liqueur therefore cannot have
a lemon dessert without taking Portofino's row"*, and cut `Lemon granita` on
that basis. **What beat it: she named lemon sorbet for Amalfi herself.** The
cut was an inference from Portofino's silence about sharing — rule 3's shape —
and she has supplied the positive evidence it lacked. `Lemon granita` stays
cut; she did not name it.

That the row was ALREADY shared between a French room and a Ligurian one is the
argument for `repertoire` rather than a problem to solve: it was travelling
before Amalfi touched it.

**No meal-shape codes were written on it, on purpose.** Meal claims are UNIONED
across a deduped dish's lines and a union can only narrow, so writing Amalfi's
house style (`· · L, D`) onto a row two other rooms share would have quietly
removed their lemon sorbet from cocktails and late suppers. Same reasoning the
`Spaghetti with clams` lines were written under. The row keeps its "no claim,
so anywhere".

## What the count said (rule 24)

The committed `scripts/seed-dishes.mjs` parser, run against the real document
before and after with only its write half cut off:

| | baseline | after | delta |
|---|---|---|---|
| lines matched | 1065 | 1079 | **+14** |
| bullet lines in the file | 1065 | 1079 | — |
| lines the parser skipped | 0 | **0** | 0 |
| deduped dish rows | 1001 | 1014 | **+13** |
| destinations | 17 | 17 | 0 |
| season disagreements | 3 | 3 | **0** |

**14 lines, 13 new rows.** The one line that becomes no new row is `Lemon
sorbet`. The three season disagreements are the same three as ever — ambrosia,
strawberry shortcake, fried chicken — and none of the fourteen added a fourth.

**Checked and clean, because these are how this seeder bites:** no new name
spans two courses, so nothing re-slugs and no live row is orphaned the way
`garlic-bread` was. The only two cross-course names in the catalogue are still
`Garlic bread` and `Papaya with lime`. No making-level disagreement: the shared
`Lemon sorbet` is `B` at all three houses, and a disagreement there is a hard
failure rather than a widening.

**Not verified, and said plainly rather than claimed:** no database was
touched. `initdb` still dies at `shmget … Cannot allocate memory` on this
machine, `seed:dishes` has no `--dry-run`, and the live catalogue is
unreachable by design (rule 9). The LIVE delta is therefore arithmetic, not a
measurement: the seeder would create **13 dish rows, all `active` on the way
in** (rule 13), plus one new `dish_world` row attaching Amalfi to the existing
`lemon-sorbet`.

## THE FLOOR RESULT — what actually changed about rule 26

`npm run check:voices`, before and after:

| | before | after |
|---|---|---|
| measurable pairs | 66 | **78** |
| `unknown` pairs | 87 | **75** |
| rooms with no measurable pool | acapulco (0), **amalfi (8)**, aspen (6), oaxaca (1), palm-springs (7), st-moritz (5) | acapulco (0), aspen (6), oaxaca (1), palm-springs (7), st-moritz (5) |

**Amalfi's twelve pairs with the wired rooms all read a number now.** The three
that are not zero:

| pair | tone | deliverables | shared |
|---|---|---|---|
| `amalfi / portofino` | 0.116 | **0.091** | spaghetti with clams · lemon sorbet |
| `amalfi / cote-dazur` | 0.055 | 0.045 | lemon sorbet |
| `amalfi / westhampton` | −0.119 | 0.045 | spaghetti with clams |

**Her own validation case half-lands, and the honest reading is that it points
the right way without settling anything.** `deliverables.mjs` says the number
would be evidenced when *"Amalfi/Portofino should read HIGH (same coast, shared
plate) and Oaxaca/Havana LOW"*. Amalfi/Portofino is now Amalfi's highest pair
by a factor of two and the **second-highest in the entire field** (behind
las-vegas/new-york at 0.112) — the measure does find the shared plate between
the two rooms that share a coast. **But 0.091 is nowhere near the 0.2
threshold, and the other half of her case is still unmeasurable** because
Oaxaca holds one dish. `DELIVERABLES_CLOSE` therefore stays FOUNDER-PENDING and
untuned, and this pass did not move it.

**What this does NOT do, stated because it is the sentence somebody will
otherwise write:** it does not release the ten-tone cap. Rule 28's sequence
holds. Amalfi is measurable against the twelve WIRED rooms only — the floor is
on the SMALLER room, so `amalfi / st-moritz` (0.721, and Amalfi is that room's
nearest neighbour), `amalfi / oaxaca` (0.781), `amalfi / aspen`, `amalfi /
palm-springs` and `amalfi / acapulco` **all still read `unknown`**, and rule 26
forbids reading `unknown` as `disjoint`. Five rooms remain under the floor.
`ADMITTED ON THE SECOND NUMBER` is still **0**, because no Amalfi pair is
tone-close in the first place: its highest is havana at 0.817, under the 0.92
monitor ceiling.

**The one thing that IS newly true, and it is hers:** *"once the drinks and food
are added they r different enough"* was neither true nor false this morning for
every pair in the catalogue. It is now **testable for Amalfi against twelve
rooms, and it holds in all twelve** — including against `havana`, Amalfi's
nearest neighbour in tone at 0.817, where the deliverables number is **0.000**.
Two rooms that sound alike and share not one dish is exactly the configuration
her ruling describes. One room down, five to go, and the five that are left are
the ones the cap is actually waiting on.

## Founder-owed after this pass

- **Four adjacency pairs, up from three.** Each is two rows that are nearly one
  dish, and merging or separating them is hers, not an agent's:
  - `Gelato` (Amalfi) beside `Gelato assortment` (Portofino). **New this pass.**
    Written as a separate row because she wrote the bare word and "assortment"
    is Portofino's authored claim, not hers — but they may be one thing.
  - `Veal fillet in a pistachio crust…` (Amalfi) beside `Roast veal with
    hazelnuts` (Portofino). **New this pass, and it is the exact shape this
    ledger's unratified rule warns about — "same frame, one ingredient
    swapped".** Both are veal with a nut. They are genuinely different dishes
    and both are authored, so neither was touched.
  - `Raw fish sliced thin, lemon on it` (Amalfi) beside `Raw fish crudo with
    lemon and oil` (Portofino) — carried forward.
  - `Devilled eggs` (Palm Springs) beside `Deviled eggs with paprika`
    (Westhampton) — carried forward, as is
    `Linguine with clams` versus `Spaghetti with clams`.
- **`Zucchini flowers with ricotta and ham…` (Amalfi) beside `Fried zucchini
  blossoms` (Côte d'Azur + Portofino).** Deliberately NOT filed as an adjacency
  pair: stuffed-and-battered against plain-fried is a real difference in the
  kitchen, not a wording difference. Recorded so the next reader does not have
  to re-derive that it was considered.
- **The pasta balance, reported rather than adjudicated.** Amalfi's 22 run
  6 appetizers / 12 mains / 4 desserts, and **six of the twelve mains are pasta
  or rice** — Nerano, vongole, al limone, scialatielli, tagliolini, the risotto.
  A previous pass withdrew a second Campanian pasta before commit on the
  grounds that three pastas would be a third of a nine-dish pool. That
  arithmetic has changed (6 of 22 is 27% of the room, not 33%) and **every one
  of the six is on her list or her ruling** — none is an agent reaching for a
  pasta. But it is a main-heavy, pasta-heavy room against the document's own
  ~18/18/14 shape, and if that is not what she wants, the cut is hers.
- **Period.** Scialatielli is generally dated to the 1970s and the room is
  AMALFI COAST, **1953**. Nothing in the pool checks a year and no other room's
  food has been audited for one, so this was not acted on — but she named it,
  and if period fidelity binds the plate the way it binds the voice, it binds
  more rooms than this one.
- **Unchanged and still owed: Acapulco's food** (zero dishes, deliberately
  absent from `PER_DESTINATION`) and **Oaxaca's everything-but-the-mole.**

---

# 2026-08-27 — The twenty become rows, and `GAMES: none` stops being asked

**Landed.** `src/lib/games.ts` now holds **27 games**: the original seven, and
**twenty room games**, one for every `piece: "game_rule"` the founder wrote in
`src/lib/destinations.ts` — one per room, two each at Amalfi and Aspen. The
migration is `db/050`. The count is asserted in both directions in
`src/lib/games.test.ts` and it is twenty, not nineteen.

## There was nothing to adjudicate, and that is the ruling

CLAUDE.md rule 29, founder, twice: *"lets not make a blanket rule that a room
is gameless"*, then *"i told you that they can have games."*

The two entries filed above under **RULINGS OWED — two rooms contradict
themselves** are **withdrawn, not answered.** They were never a contradiction
for her to settle. `docs/atmosphere-idea-bank-v1.md`'s `GAMES: none` lines at
Tahiti and Acapulco are **stale document lines**; both rooms carry a game in
their own voice, and rule 29 says a room whose document and whose voice
disagree resolves toward **having** the game. Both are now rows:

- **TAHITI** — `tahiti-the-last-night`
- **ACAPULCO** — `acapulco-the-last-song`

`none` still writes no row, no column and no negative claim. `db/050` moves
that sentence onto the **`game` table's own comment**, where db/048 had put the
bank half of it on `bank_kind` — the right sentence on the wrong table for the
question that kept being asked, which is rule 20's second half arriving inside
this repo's own discipline.

## The twenty, per room

Her sentence is the rule and it is **verbatim**, quoted whole in each row's
`notes` under the fixed heading `HER RULE, VERBATIM:` and printed on the game's
own rules card. Everything else — shape, bounds, host role, supplies,
requirements, printed matter, runbook, contingencies — is **authored here** and
marked `AUTHORED HERE:` in the same field, so what she may cut is separable
from what she wrote without anybody guessing.

| room | game | shape | what the house added on top of her sentence |
|---|---|---|---|
| Westhampton | The Houseguest List | ambient | the pad kept out of the room, the closing before the last dinner, one name read at the end |
| Havana | The Song That Gets You Up | scheduled 30–45 | the slip carrying a NAME beside the song, the bowl, the ban on introducing a song before it plays |
| Vegas | The Late Supper | scheduled 60–90 | counters in place of money, the figure said out loud first, **the signed card** |
| New York | The List | finale 10–20 | anonymity, tearing rather than burning, reading every slip including the flat ones |
| Nantucket | What The Weather Will Do | ambient | the written card under something heavy, the room settling it by argument — **HELD, see below** |
| New Orleans | Nobody Finishes Their Own | scheduled 25–40 | the minute, one sentence of correction at the end |
| Catskills | The Swim Test | scheduled 20–35 | the ledger as a real object on the table, the show of hands, no voting for your own |
| Côte d'Azur | One Of Them Is Lying | scheduled 25–40 | the marked card drawn at random, simultaneous pointing, no questions during the round |
| Portofino | The Boat Count | ambient | the slip kept in a pocket, the count settled by whoever walks in front |
| Dolomites | The Temperature At The Top | ambient | the unit agreed before anybody writes, the map as a real privilege |
| Big Sur | The Long Way | scheduled 40–60 | the circle, the bowl for phones, the room rather than the host enforcing no-hurrying |
| Tahiti | The Last Night | scheduled 10–20 | going round rather than volunteering, more than one person able to lose, writing the answers down |
| Acapulco | The Last Song | finale 10–20 | **the card by the speaker** that makes the forfeit checkable, the room choosing from what survives |
| Amalfi | The Numbers, After Dark | scheduled 45–75 | the line / two lines / full card ladder, **the bag passing on a win** |
| Amalfi | The Five Prizes | finale 15–30 | the dependency on the numbers, prizes visible from the start |
| Aspen | Somebody's Voice | scheduled 15–25 | voices drawn only from what is already on, one line each |
| Aspen | The Next Line | ambient | the forfeit paid immediately rather than tallied, bread in the freezer first |
| Palm Springs | The Best Line | finale 10–20 | **no vote** — her sentence names no winner and a ranking makes somebody last |
| Oaxaca | Correct The Year | scheduled 25–40 | the correction restricted to the YEAR, the argument finishing before the story goes on |
| St. Moritz | Before The Light Goes | scheduled 10–20 | **nobody is paid none** — she guarantees everybody gives one and says nothing about receiving |

**Twenty written, twenty scoped, eighteen rooms covered.** Nothing was skipped
and nothing was rounded.

## `native`, and the defect it surfaced in the seeder

Each of the twenty claims `native: true` on its own room and nothing else,
because rule 23 says `native` is a **whitelist** and `affinity` is a weight
that says nothing about eligibility. A game written in one room's voice is the
whitelist case exactly.

**The seven original games are not rescoped.** They carry affinities to
`westhampton-1976` and no native claim, so they stay playable everywhere, and
`src/lib/games.test.ts` now fails if anybody gives one of them a native room.

**THE DEFECT THIS SURFACED, AND IT WOULD HAVE SHIPPED SILENTLY.**
`scripts/seed-games.mjs` skipped a world scope whose destination did not exist
and logged one line. That is correct for `forbidden` and for `affinity`, both
of which mean nothing when the world is absent. **It is not correct for
`native`, and `native` did not exist on any game when it was written.** A
skipped native claim does not fail safe — it **inverts**: the row lands with no
world claim at all, no claim means eligible everywhere, and a game written for
one room is offered in eighteen with nothing anywhere saying so. Rule 16's
exact shape.

The seeder now resolves every world **before** the insert loop and creates such
a game as a **draft**, with its own message. Rule 16 gives three options —
honour it, refuse it, drop it visibly. Honouring is impossible (no world to
point at); refusing would fail every fresh deploy; dropping it visibly is what
is left, and a draft is how this system says a row is not offered.

## Games go LIVE, and one is held

**Checked rather than assumed:** `db/038` classified a `game` row as SHELF, not
WORLD, and moved this pool to auto-publish. The founder's later ruling that
there is no hold-back for food or drinks did not need to reach games, because
games had already moved. The hold-back is the row's own text and nothing else.

**One game carries the marker.** `scripts/seed-games.mjs` and `db/038` both
said *"no game carries the marker today — the mechanism is in place before it
is needed."* That claim is now false and is **corrected in the seeder rather
than deleted** (rule 14), because the argument it made about ORDER was right
and has been paid off: nothing had to be invented under pressure.

### The Nantucket kill — not established, so written and flagged

`docs/atmosphere-idea-bank-v1.md` line 967 reads `KILLED: the weather-forecast
act.` and this room's `game_rule` is a weather guess. **Establishing whether
the kill reaches the game was not possible from the files**, so per the
instruction the game is written and flagged rather than silently published or
silently dropped. The reasoning is in the row, which is the only place a
hold-back is allowed to live.

- **For it being the host act only:** it is filed under `HOST ACTS:`, directly
  after the pot-dump, the chowder ladle and the shucking — all of them one
  person performing something. `KILLED_GAMES` is enforced by name against
  `bank_item` rows and a `game` row is not one. And the mechanism differs: a
  forecast performed by one person is not everybody guessing once, in writing,
  with a forfeit.
- **Against:** both are the weather, tomorrow, at Nantucket, and a kill written
  that broadly may have meant the whole idea.

**The founder answers this one.** The row is at `/desk/publish`.

## What the seeder will do, and what could not be verified

**`initdb` fails on this machine** — `could not create shared memory segment:
shmget … Cannot allocate memory` — and the production database is unreachable
from any laptop (rule 9). **No LIVE count before and after was produced, and
seed-games has no `--dry-run` to produce one.** Saying so plainly is the whole
of what can honestly be reported about a database.

What IS computable from the module and the committed chain, and was computed:

| | |
|---|---|
| games in the module | 27 |
| LIVE on a fresh build | **19** (7 originals + 12 room games) |
| HELD on the founder marker | **1** — `nantucket-what-the-weather-will-do` |
| HELD for a native room that does not exist yet | **7** — Amalfi ×2, Aspen ×2, Palm Springs, Oaxaca, St. Moritz |

The seven are held because those five rooms are **not keyed into
`DESTINATIONS`**, so `seed:destinations` does not create them, and `seed:bank`
— which creates their draft stubs — runs **after** `seed:games` in
`preDeployCommand`. On the deploy after the stubs exist, the scoping lands and
the rows are published at the desk. They are drafts on purpose.

**What stands in for the dry run:** `src/lib/games.test.ts` gained seven tests
that make the seeder's and the database's hard failures fail `npm test` on a
laptop with no Postgres — unknown facet, unknown requirement kind, unknown
voice piece, unknown slot, unknown occasion, a slot the shape cannot fill, a
dangling dependency, a duration on an ambient game, a per-head supply with a
fixed count. Each was **broken deliberately and watched go red** before being
trusted. The vocabularies are parsed out of `db/*.sql` rather than restated as
literals (rule 19), with a floor assertion on each so a parser that matched
nothing cannot pass by having nothing to compare against (rule 24).

**One parsing bug the count found on the way**, and it is rule 24 exactly: a
naive split of the SQL on `;` truncates db/010's `slot_kind` insert inside the
string *"Everyone is playing; nobody has stopped doing anything else."*, loses
the `finale` slot, and reports a vocabulary gap that is entirely its own. The
test uses a scanner that respects quoted strings.

## The take-home dependencies — one is now aimed at something

Reported honestly, in both directions.

| take-home | watches | satisfied by content? | resolves? |
|---|---|---|---|
| Vegas's IOU | `game yields_iou` | **YES** — `las-vegas-the-late-supper` is `scheduled`, so it fills the `game` slot, and its signed card is a written stake | **no** |
| Oaxaca's Conquián tally | `ambient_game yields_score_sheet` | no | no |
| St. Moritz's backgammon column | `ambient_game yields_score_sheet` | no | no |
| St. Moritz's doubling cube | `ambient_game yields_prize` | no | no |

**The three that remain aimed at nothing are aimed at nothing on CONTENT
grounds, not on plumbing grounds, and that is the useful half.** Oaxaca's voice
line is a story game and St. Moritz's is a round of compliments: neither keeps
a score on paper and neither produces an object. **Mis-shaping either row to
reach a dependency would be the mis-tag db/010 warns about** — a game bent to
make a report go quiet. They need a second game each, or a founder ruling that
those take-homes are supplied some other way.

**AND VEGAS'S DOES NOT RESOLVE EITHER, for the reason `seed-bank` already
prints:** `ingredient_supplies` is **empty on every database the committed
chain builds** (db/044 creates it empty; tagging belongs in a pool's own
seeder, which runs after content exists — rule 22). So the dependency reports
BROKEN even though the game that satisfies it now exists.

**Deliberately not fixed here.** `seed-games` could write the
`ingredient_supplies` row and close it, but `scripts/seed-bank.mjs` prints the
claim *"they would still be aimed at nothing … because `ingredient_supplies` is
empty on every database the committed chain builds"*, and that file is outside
this pass's territory. Closing the gap while leaving a false sentence printed
on every deploy is worse than leaving both consistent. **It is one row and a
`yields` field on the `Game` type**, and it should be done in the same pass
that corrects the bank seeder's report.

## Five story games, five engines — a finding, not a duplication

New Orleans, Catskills, Côte d'Azur, Big Sur and Oaxaca all sit a room down and
tell stories. That is the same surface the Fishbowl audit found across the
noun-game slips and the Celebrity deck, **and it is not the same finding.** The
engines differ, and each one is the whole game:

- **New Orleans** hands the ending to the person on your left.
- **Catskills** rewards the version furthest from a book nobody opens.
- **Côte d'Azur** hides one liar, drawn at random.
- **Big Sur** forbids hurrying and forbids checking.
- **Oaxaca** invites the interruption the other four forbid.

Written into the module so the next audit counts engines and not surfaces. One
adjacency IS worth watching: **Aspen's Somebody's Voice and the bank's New
Orleans charades deck** are impressions against a shared text versus a prompt
drawn and acted silently — different, and close enough to be miscounted.

## What db/050 does, and what it deliberately does not

Two `game_requirement_kind` rows (`music`, `something_playing`), the rule-29
sentence on the `game` table comment, and a notice. Nothing else, because the
games are CONTENT and content in a migration can only be corrected by another
migration (db/010's argument, unchanged).

**Zero is the correct answer on a fresh database**, again: `migrate` runs
before every seeder, so `game` is empty when db/050 runs. It counts nothing,
asserts no per-room minimum and derives no row from authored text — each of
which would be the db/020 failure that ran clean and did nothing for weeks. The
guard over the games lives in `src/lib/games.test.ts`, where it fails the build
instead of the deploy.

**Three requirement kinds were considered and refused**, written down so they
are not re-proposed: `a_second_day` (that is a property of the OCCASION and
`game_occasion` already says it — rule 21), `water` for Acapulco's swim, and
`a_view_worth_counting` for Portofino's boats. The last two are `caveat` lines
instead: a requirement is a filter that silently removes a game, and the
founder's own sentence naming the room's own furniture should warn a host, not
delete her evening.

## Rule 25, applied to every one of the twenty

1. **Bookable at backyard size.** Nothing needs a boat, a slope or a pool that
   the room's own material does not already establish. The three that come near
   it — the boat count, the temperature at the top, the swim that ends the last
   song — are **her sentences naming her rooms' own furniture**, and each
   carries a `caveat` a host reads before she starts rather than at the moment
   somebody has to go in. New York's list is **torn, not burned**, because an
   apartment cannot honour a flame.
2. **No proper noun a guest would not say at the table.** No place name, brand
   or landmark reaches a name, a rule, a step or a printed piece. Amalfi's kit
   is "the cards", "the board" and "the meanings sheet".
3. **No staff.** Every one of the twenty is `hostRole: "plays_too"`, **asserted
   by a test**. Amalfi's own rule states it — *whoever is calling is playing
   too* — and the bag passes on a win so that calling is a turn and not a role.
   Acapulco states it structurally and nobody runs that game at all.

## Kills — checked, and none resurrected

None of the twenty names, needs or implies keno, the card that took the last
trick, the belote sheet, the cochonnet, your card from the door, a Thoth tarot
card, the Fischer–Spassky scoresheet, a single domino, or a costume brief.
Côte d'Azur uses an ordinary pack with a crease in one corner; Big Sur uses
nothing at all. The weather-forecast act is the one open question and it is
above.

## Still founder-owed after this pass

1. **Does the Nantucket kill reach the game, or only the host act?** One row is
   held on it.
2. **Oaxaca and St. Moritz need a second game each** — an ambient one that
   keeps a score on paper or leaves an object — or a ruling that those three
   take-homes are supplied another way. Not invented here.
3. **`ingredient_supplies` is empty catalogue-wide.** Vegas's IOU is the first
   dependency with a game behind it and it still will not resolve. One pass,
   across `seed-games` and `seed-bank` together.
4. **Nothing in the pool fills the `honouring` slot**, which birthday,
   anniversary and bridal all require. Twenty new games did not close it and
   none was bent to look as though it had — db/010 says mis-tagging a party
   game as an honouring beat to quiet the report is the actual bug.

---

# 2026-08-28 — FIVE ROOMS GET THEIR FOOD, AND TWO RULINGS RETIRE TWO CONSTRAINTS

## The counts, before and after

| room | before | after | clears `EVIDENCE_FLOOR` (12) |
|---|---|---|---|
| Acapulco | 0, no `##` heading at all | **24** | yes |
| Oaxaca | 1 | **4** | no |
| Palm Springs | 7 | **11** | no |
| St. Moritz | 5 | **7** | no |
| Aspen | 6 | **12** | yes |

Amalfi Coast was NOT touched — a sibling landed her second sheet at 22 and it
stands. Document total 1079 → 1118 lines.

**Three rooms are still under the floor**, so every pair involving Oaxaca, Palm
Springs or St. Moritz still returns `unknown` from `overlapFraction`, and rule
26 forbids reading `unknown` as `disjoint`. That is the finding to act on, and
each room's reason is written beside its entry in `PER_DESTINATION` rather than
summarised away here.

## The two rulings, and exactly what each one voided

1. **"so the answer is more dishes."** Rule 25.3 is about STAFF, not difficulty
   — *"the host can of course make all of those things."*
2. **"also get rid of the constraint globally 'or have been finished hours
   ago'."** The made-ahead requirement is retired catalogue-wide. THE TEST IS
   SERVICE and nothing else: no dish may imply somebody plating to order and
   carrying it out while she is at her own table.

**What they voided, named so the reversal is legible (rule 14).**
`docs/acapulco-1959-food.md` reasoned that its mains *"will not honestly grow
much past seven"* because *"the room gets exactly one fire and everything else
has to be cold or have been finished hours ago"*, concluding *"a room that
allows one fire does not have fifteen mains."* Both halves are void; the
paragraph is kept in that file, unedited, because its reasoning about the
room's texture is still the best description of it. Three mains were added on
the strength of the reversal.

**What they did NOT void.** Rule 3, absolutely. Rule 6's tiers and borders. The
Oaxaca/Acapulco wall — *heat and masa on one side, cold and lime on the other*.
St. Moritz taking no alpine cheese, which Dolomites owns outright. And every
cut in the Acapulco document's "Cut, and why" list, each of which rests on rule
6 or on period.

## The earlier ruling this pass reverses, quoted (rule 14)

This ledger said on 2026-08-27: **"Zero Acapulco dishes are written below.
Transcribing an agent's draft into the dish pool under her name is retro-tagging
with a byline on it."**

That was **correct about what it examined** and is not what landed. It was
judging the room's `menu_item` exemplars in `destinations.ts`, which are
explicitly agent-drafted. What landed instead is `docs/acapulco-1959-food.md` —
a sourced research pass with citations, period checks, rule-6 tiers and a
stated border test per line. The distinction that matters: **a sheet is not the
only kind of evidence.** Rule 13 settles where such lines may sit — dishes are
POOL content that stocks itself, and the founder VETOES at the desk rather than
consenting in advance.

## What landed from the Acapulco document, and the one that did not

**21 of 22 blocks converted**, plus 3 new mains the rulings freed = 24 lines.
Its three strongest all landed: *morisqueta*, *ceviche in a glass with
saltines*, and *fish fried yesterday and left in vinegar and onions, eaten
cold*.

**Held: "Whatever lunch left, put back out cold when dinner starts."** Three
grounds that stack. It names no food. It has no making level to give — its own
entry says *"making: none, twice"* — and B/H/M are the only three values a dish
line may carry, so it cannot be written without inventing an answer to the one
axis the host is asked about by name. And it is already **THE RESET**, this
room's signature gesture, which `destinations.ts` records as owed a
`world.gesture` row in the shape of db/034. As a dish row it would fill a
member's dish slot with a mechanism instead of food. **Founder's to route:**
`world.gesture`, a `bank_kind = 'host_act'` row, or overrule and pool it.

## RULINGS OWED

1. **`pozole verde de Guerrero` — reinstate?** The Acapulco document calls it
   *"the hardest cut in the file and the one most likely to be overruled"*, and
   part of its context (the one-fire argument) is now void. **Its other two
   grounds still stand independently**: it is a pot going for hours, which is
   Oaxaca's entire structure and the axis rule 26 says to keep disjoint; and it
   is nixtamalized corn, and masa is the wall. Not resurrected here, because a
   cut she has not reversed is not an agent's to reverse. If she wants it, it
   should come in as Acapulco's and be removed from anything Oaxaca might later
   claim.
2. **Does "more dishes" reach Palm Springs' mains?** Asked rather than decided,
   because it contradicts a sentence she wrote. Her sheet says *"nothing
   requires a fork or your full attention"* — a statement about the PARTY, not
   an inference about labour, so neither ruling touches it. It was obeyed: no
   mains were written. **This is now load-bearing beyond taste** — the three
   dish slots are required on every occasion with no exclusion for a standing
   party, so a room with no mains fails a required slot everywhere. The fix
   proposed is a `standing drinks` exclusion, not invented mains.
3. **Every founder question in `docs/acapulco-1959-food.md` travels with its
   landed line and is still open.** The ones that would change a line if
   answered: the ceviche's dating (the recipe is documented in a 1969 printing
   of a title first published in 1947); whether the cold *pulpo* stands on the
   file's thinnest evidence; whether *morisqueta* and the escabeche keep their
   table words or become plain English (rule 25.2); whether the garlic shrimp
   should exist at both appetizer and main size; whether *langosta* reads as
   the room or as the hotel next to it; whether `Mangoes … · summer` may sit in
   a December room given rule 25.1 books it in August; and whether `Flan, cold,
   cut badly` keeps a place it earns only by elimination.
4. **Oaxaca needs food, not permission.** It reached 4 and stopped. `mole`,
   `tamales` and `tortillas` are named in HER OWN ruling — *"the dishes may
   always be named — mole, tamales, tortillas, mezcal are table words. They may
   never be adjectived"* — which is simultaneously the licence for the two new
   lines and the CAP on them: a filling or a style would be an adjective on a
   table word, so each noun gets one line. `mezcal` is the fourth table word
   and is a drink. The appetizer is the mezcal plate's other half, which the
   take-home bank establishes carries orange slices and a twist of worm salt.
   **Beans, rice, the chocolate beaten with water and "the mole over chicken or
   turkey" remain absent from this repository in her hand** — this ledger
   already recorded that the paragraph carrying them *"does not exist in this
   repository"* — so rule 3 forbids writing them. The drinking chocolate IS
   evidenced (the chocolate tablet, the jícara, the molinillo at the
   chairs-to-the-wall turn) and is a DRINK. **The fix that worked for Acapulco
   is the fix here: a sourced research pass, or a sheet.**
5. **St. Moritz's half-past-eleven course is a real hole.** The room's own
   timetable card in the take-home bank reads *"seated at nine, fondue at half
   eleven, the room changes at one, eggs at half five"* — and **rule 6 refuses
   the fondue**, because Dolomites owns alpine cheese outright. That refusal
   stands and leaves the 11:30 course unwritten. Her sheet also names *"a late
   supper only if the night earns one"* without naming its food; only the eggs
   are evidenced, from the same card and from the bank's *"leave at dawn with
   the eggs"*.

## What the count found that reading would not have (rule 24)

Four Aspen candidates and four Palm Springs candidates were dropped by a grep of
the document, not by taste:

- **`Brownies from the pan` already EXISTS at Big Sur as `M`.** An Aspen `H`
  would have hit the seeder's level-disagreement failure — *"two answers for one
  dish is one of the lines being wrong, not a nuance"* — and stopped the deploy.
- **`Campfire chili` and `Venison chili` are both Big Sur's**, so a third chili
  was the single-substitution duplicate the unratified section names.
- **`Pickled okra and pepper jelly with cream cheese` is New Orleans'**, which
  killed the cream-cheese-and-pepper-jelly line.
- At Palm Springs: `Olives stuffed with almonds` against Vegas' `Blue
  cheese-stuffed olives` and Côte d'Azur's `Green olive and almond bowls`;
  `Radishes with butter and salt` against TWO existing rows; `Lime sherbet`
  against three `Lemon sorbet` rows and a `Melon sorbet`; `Chocolate mints`
  against `Mints in silver dishes`.

**And the finding that changes how the thin rooms should be grown.** The
obvious way to take St. Moritz to twelve is to enumerate species under "smoked
fish". The count refuses it: the twelve wired rooms already hold **six** "smoked
salmon + a carrier" rows and **four** "smoked trout + a carrier" rows. A seventh
and a fifth would hand this room another room's plate under a new slug — the
same reasoning that cut two anchovy lines from Amalfi. The same is true of Palm
Springs' `One tray that looks expensive`, whose contents her sheet never names:
1965's answers are smoked salmon, caviar and pâté, and the wired rooms hold six,
seven and three rows of those. **THE EXPENSIVE TRAY CANNOT BE ENUMERATED
WITHOUT TAKING ANOTHER ROOM'S PLATE.** That is a genuine constraint on those two
rooms, not an authoring failure, and it is why they stopped where they did.

## The parse (rule 24)

Run before and after with the committed instruments — `scripts/seed-dishes.mjs`
for the strict gate and `dishClaims()` from `scripts/deliverables.mjs` for the
per-room claim sets.

| | before | after |
|---|---|---|
| lines matched | 1079 | **1118** |
| deduped rows (name + course) | 1014 | **1053** |
| rows under more than one room | 55 | **55** |
| lines skipped | 0 | **0** |
| unknown `##` headings | 0 | **0** |
| season disagreements | 3 | **3** |
| level disagreements | 0 | **0** |

The three season disagreements are the known ones and are unchanged: `Ambrosia`
(Westhampton unseasoned / New Orleans winter), `Strawberry shortcake`
(Nantucket early summer / Vegas unseasoned / New Orleans spring), `Fried
chicken` (Catskills summer / New Orleans unseasoned).

**39 lines added produced 39 new deduped rows and no new shared rows.** That is
the number worth reading: not one of the 39 collapsed onto an existing dish, so
no room was handed another room's plate by accident. It is also what makes the
Acapulco/Oaxaca border checkable — the two Mexican rooms share **zero** rows.

**THE DATABASE HALF OF THIS WAS NOT RUN, AND SAYING SO IS THE POINT.** `initdb`
fails on this machine — `shmget … Cannot allocate memory` — so there is no
Postgres to seed against. `scripts/seed-dishes.mjs` was run with `DATABASE_URL`
unset, which exercises **every gate before the connection**: the line parser,
the per-room `PER_DESTINATION` manifest, the level-disagreement check, the
duplicate-within-a-room check, the season-wording map and slug assignment. It
reaches `DATABASE_URL is not set` and stops there. What was **not** verified is
anything only Postgres can see — enum literals, CHECK constraints, bind counts
on the insert path. That is `npm run smoke:seeders` in CI, against the
`postgres:17` service container, and it has not run here.
