# Revelle — standing rules

Read this before working. These are not preferences. Each one cost real work to
find, and each was re-litigated at least once before it was written down.

**The proof that this file is worth keeping:** the venue rule below is the only
rule that got compounded into the code — enforced in three separate places with
its argument written at each — and it is the only one that has never been
re-argued. Everything else on this list has been rediscovered the hard way.

---

## The catalogue and the matrix

**1. Facets describe the EVENING. Properties of her PEOPLE belong to the tiles.**
A guest property travels unchanged to every party that group will ever attend,
so it cannot sort destinations — it can only describe the applicant. Her people
are measured in voice space. This rule killed `no_speeches`, `teasing`, and
`acquaintance`.

**2. No facet may ask WHERE THE PARTY IS HELD.**
"Venue never touches the destination — that's the thesis of the product. Havana
in a Brooklyn apartment isn't a compromise, it's the pitch." Enforced in
`vector.ts` (zero weight), `db/020` (a trigger refuses the tag), and
`selection.test.ts` (fails with the thesis in the message). Venue prunes the
POOL at stage 3 and nothing else.

SAID PRECISELY, because the wall is thinner than "venue never touches the
destination" implies and somebody will later try to "fix" the apparent
contradiction in one direction or the other: VENUE MAY ELIMINATE WHAT CANNOT
PHYSICALLY HAPPEN. IT MAY NEVER RANK WHAT CAN. A public-outdoor venue that
drops four rooms from feasibility HAS changed her reveal — venue affected the
outcome, through the constraint door rather than the taste door. That is
correct and always was; an apartment was never getting the requires-outdoors
rooms either. What is forbidden is the other door: no room may score higher
because her place is grander, no room may be withheld because it is modest.
Feasibility is honest. PREFERENCE-BY-SQUARE-FOOTAGE IS THE SIN. The test for
any new venue-touching code is which door it uses — can this physically happen
here (allowed, and it may eliminate) versus would this suit a place like hers
(forbidden, at any weight, including small ones that look like tie-breaks).

**3. Positive evidence, never inference from silence.**
"The table is pushed back for the dancing" is a fact. "No late-hour material
anywhere" is a claim about what a paragraph did not mention, which is the
retro-tagging failure this project exists to escape. Absence-graded cells are
FLAGGED as such and are the first place to look when a pair collides.

**4. Twins, never triplets. One tiebreak pair per structural corner.**
A room may sit below the gate against exactly one other, under the four
conditions in `docs/destination-contrasts.md`. A room below the gate against two
rooms is a crowded corner, not a pair, and may twin with neither. This is why
Rio and Oaxaca are blocked.

**5. Rows are arithmetic. Thrown-ness is voice. The founder audits the second.**
A premise must read as a party somebody is THROWING, not a scene that OCCURS,
with receipts visible per the room's plannedness register. A row can clear
distance 3 against every other room and still describe a postcard. No audit can
check this and none should pretend to.

**6. Dishes travel by tier.**
`signature` never travels (pesto is Portofino, gumbo is New Orleans).
`regional` travels within its CUISINE, not its country — Ligurian is not
Campanian, and Italian food must not flow freely between Italian rooms or the
plate erases the distinction the matrix defends. `repertoire` goes anywhere the
register fits. Chicken parmesan is Italian-AMERICAN repertoire: New York and
Vegas, never Portofino.

## Working

**7. Distances are quoted ONLY from the committed audit script.**
`npm run check:matrix`, reading `data/destination-matrix.json`. Never from a
scratch run. The matrix forked once precisely because numbers were reported from
throwaway scripts and could not be reconstructed.

**8. Agents and seeders produce DRAFTS. Activation is a human gesture.**
"Deciding that something is offered to a customer is a curator's decision and
not a script's." Deciding what the house may OFFER is ours; deciding what one
member GETS is hers. Never add `--activate` to a deploy.

**9. Never point a person at something that does not exist or cannot be run.**
The database is unreachable from any laptop (`ipAllowList: []`), so a script
nobody can run is worse than no script. An empty screen once told a curator to
run `npm run import:products`, which has never existed.

**10. HOST-AS-AUTHOR. PRODUCT-AS-INSTRUMENT.**
The party is hers. Revelle is the instrument that makes her taste real, and it
never authors AT her. "It arrives written", "we've done everything",
"everything else is written" all FAIL — even short and true. The test: does the
line credit her, or credit us? A line describing how much work the product did
has told her she is a customer of a service rather than the author of an
evening. Governs all copy. Full argument in `docs/copy-brief.md`.

**11. Mine the doctrine before generating copy.**
`destinations.ts`, THE ALLOCATION and the audit doc are written under
truth-pressure, and thesis-grade sentences from them have beaten generated
options twice. `docs/copy-source.md` is that extraction —
`npm run copy:source` — marked for what may face a member and what is house
only. Start there; generate only for what it cannot supply.

**12. A seeder not in `preDeployCommand` is a seeder that silently did not
happen.** It raises nothing and logs nothing; the catalogue is just smaller
than the repo says. `seed:bank` sat out every deploy and surfaced only as
eighteen destinations in the file against thirteen on the dashboard, which
flickered through three reports before anyone traced it. `src/lib/deploy.test.ts`
now fails if a `seed:*` script is neither in the chain nor listed as manual with
a reason.

THE COROLLARY, which cost a near-miss to learn: an unwired seeder does not
merely fail to run — IT SHIELDS ITS OWN BUGS FROM EVER SURFACING. `seed-bank`
carried off-by-one bind placeholders left by db/033; Postgres would have
refused the bind on the first row, and it was found only because somebody
opened the file for an unrelated reason. So the day rule 12 landed, every
previously-unwired seeder became a first-run risk, all at once. A seeder
entering the chain for the first time therefore gets one dry run against a
scratch schema before it is trusted with a deploy.

**13. POOL CONTENT STOCKS ITSELF. GOVERNED CLASSES DO NOT.**
Dishes, drinks, bank items, menus, games, products and tracklists go live on
deploy;
the desk is an audit feed and the founder VETOES rather than consents. An item
carrying a founder-pending question stays draft, and it knows who it is because
the seeder wrote the question into it.

Destinations, gestures, voices, matrix cells and member-facing copy stay
founder-signed. Each is a claim about a WORLD or about how the house SPEAKS,
and one of those reaching a member unread is a different kind of wrong from a
dish doing it. `src/lib/governed.test.ts` fails the build if a seeder gives
`world` or `world_voice` a live status — rule 12's sibling: that one catches a
seeder that never runs, this one catches a seeder that runs and signs something
it may not.

THE CLASSIFICATION TEST, so the next new content type is sorted by principle
instead of by another stop-and-ask: POOL means selection CHOOSES AMONG rows.
GOVERNED means a row DEFINES WHAT A MEMBER CAN BE PROMISED. Ask it of the row,
not of the word on the label — `game` was held back one round because rule 13
did not name it, while `bank_kind = 'game'` (the tombola kit, the dice cups)
was already stocking itself. One product category, two publication regimes, and
a member could receive the shipped kit for a game whose rules sat in draft. The
stop-and-ask was correct; a rule you must guess at is a rule with a hole, and
this paragraph is the patch.

The older rule — "deciding that something is offered to a customer is a
curator's decision and not a script's" — was right about what it protected and
wrong about its scope. It was written when the only content was destinations.

**14. Superseded reasoning is PRESERVED, never deleted.**
When a decision reverses, keep the old argument and say what beat it. See the
year decisions in `src/lib/destinations.ts` and the "she does not pick" section
in `docs/selection-spec.md`. In six months the reasoning is the part that gets
lost, and a deleted argument gets re-made.

---

## Not yet ratified — proposed from this week, awaiting the founder

- **A facet that memorises the answer key is not a facet.** Cuisine separated
  every pair perfectly by reaching one room per level. A zero-failure audit is a
  warning when one column is nearly a unique ID.
- **For machine-generated content, check single-substitution against what
  exists.** A word-overlap sweep flagged 113 pairs and was useless; "same frame,
  one ingredient swapped" found 8 real duplicates.

## Where things live

| | |
|---|---|
| the matrix | `data/destination-matrix.json` |
| the audit | `npm run check:matrix` → `scripts/audit-matrix.mjs` |
| the argument | `docs/destination-contrasts.md` |
| admission of a new room | `docs/new-destination.md`, step 0 |
| what is blocked on a person | `docs/needs-a-human.md` |
| the selection architecture | THE SEAM, in `src/lib/destinations.ts` |

**15. NOTHING GRADES THAT DOES NOT PRUNE. EVERY INSTRUMENT TRACES TO A SUPPLIER.**
Every matrix facet, every constraint tag and every scored column must trace to a
quiz answer or a named data source. Anything unfed is either wired or cut — it
does not get to sit in the scoring loop looking like it works. The failure is
silent by construction: an unfed instrument still returns a number, the reveal
still renders, no test goes red, and the room is ranked on a facet she was
never asked about. Twice found the hard way — `outdoor_access` graded without
pruning until db/035 gave it `venue_affordance`, and `starts`/`ending` ranked
all eighteen rows while no answer fed either, so the reveal claimed nine facets
and used seven. Three states, not two: FED, DEFAULT-ONLY (a hardcoded value
identical for every applicant — the sneaky one, since it looks fed), ORPHAN.
DEFAULT-ONLY counts as unfed. The mirror-image bug is a question whose answer
nothing reads; that costs her attention and buys nothing, and is cut on sight.
Run the trace whole rather than per-suspicion: orphans arrive in cohorts, and
the second one is always found by the sweep that was looking for the first.

**16. NOTHING ABSORBS INPUT IT DOES NOT HONOUR.**
If the system takes something in and does not act on it, it says so at the
point of use — loudly, where the person is standing. Silence there is the most
expensive thing this codebase builds, because the input LOOKS honoured from
every angle: the flag was accepted, the tile was picked, the column is
populated, nothing throws. Three instances taught it. A `--activate` flag left
as a silent no-op once `active` became the default would be indistinguishable
from not passing it, so it is REFUSED BY NAME and exits non-zero — an old
runbook or a shell-history recall still reads as if it controlled something.
A draft tone tile rendered in the quiz is picked by a real host and dropped by
an inner join, so she has spent attention on a code that resolves to nothing.
A DEFAULT-ONLY facet (rule 15) grades every applicant identically while looking
fed from both ends. Refuse it, drop it visibly, or honour it. Never take it in
quietly. The test is not "does this work" but "if this stopped working, how
would anyone find out" — and if the answer is a person eventually noticing the
output looks wrong, that is not an answer.

**17. A STATUS CHANGE ON A GOVERNED CLASS CARRIES ITS REASON.**
Retirement, supersession, un-drafting a world — every transition writes WHY,
in the same statement that writes the status, in a column. Not in the migration
prose, not in the commit message, not in a conversation: a column, because the
desk has to render it and a person six months out has to read it without an
archaeologist. The whole premise of this system is that decisions keep their
reasoning attached, and `status = 'retired'` on its own is AN ADJUDICATION WITH
THE OPINION TORN OFF. Twice learned: correction-pass-1 flipped four cells with
no explanation, and `db/028` retired Cap Ferrat writing nothing at all — no
note, no pointer — so "folded into Côte d'Azur" survived only in this
conversation and had to be reconstructed. Two columns, because they answer two
questions: a nullable FK for LINEAGE, which is machine-readable and lets the
desk render the successor as a link and a future un-retirement know its own
history; and free text for the WHY IN WORDS. A reason that cannot be queried is
a note; a pointer with no words is a fact with no argument. Governed classes
get both.

**18. THE UI NEVER MOVES THE TARGET OF A CORRECTION.**
Between a mistake and its fix, the thing being corrected stays exactly where it
was. No auto-advance after an act, no reordering under the cursor, no list that
reshuffles because the row was just touched. Publish and Withdraw sit next to
each other and the second is the correction for the first; a screen that
advances on the first click applies the correction TO A DIFFERENT ROW — A DATA
BUG WEARING CONVENIENCE. This is rule 16's physical-safety half: rule 16 says
never absorb input you do not honour, and this says never relocate the target
between the input and its undo. It also decides which screens may carry a
review pass at all — an unstable ordering (`order by updated_at desc`, where
saving a row moves it) cannot host a Next button, because "next" over a list
that reorders itself silently skips rows. Excluding such a screen is the
correct reading, not a gap to be closed later; if it ever needs a pass, it
gains a stable-sort toggle first.

**19. THE REGISTRY IS THE ONLY TRUTH. HAND-WRITTEN LISTS OF POOLS LIE IN WAIT.**
`ingredient_pool` and `facet_tag_entity` know what the pools are and what each
one's join, world, slot and occasion tables are called. Any code that instead
spells a pool list out by hand, or builds a table name by concatenation
(`revelle_${table}`, `${table}_facet`, `/desk/${table}s`), is correct exactly
until the next pool is registered — and then it is wrong WITHOUT BEING BROKEN,
which is the dangerous half. Four instances so far: the desk, the publish
action, `db/020`'s requirement CHECK (which had already drifted and needed
db/033 to repair it), and `portal/occasions.ts`, whose five-pool list omitted
`dish` and `bank_item` on the MEMBER-FACING read — her package would have
rendered minus its dishes with no error and no gap message. That last one is
the worst shape this product can produce: the slot-minimum rule exists so a
member never receives silently thinned goods, and a read-side omission guts a
perfectly assembled package anyway. So the loud form is part of the rule, not a
nicety: IF A POOL THE REGISTRY KNOWS ABOUT RETURNS ROWS A SURFACE CANNOT
RENDER, THAT IS AN ERROR STATE, NOT AN EMPTY SECTION. When you find one of
these, grep for its siblings in the same pass — they arrive in families,
because whoever wrote one wrote the others.

**20. THE FILE THAT DESCRIBES THE DEPLOY IS NOT THE DEPLOY.**
`render.yaml` is a blueprint applied once; the live service is not linked to
it, so the two drift and the SERVICE wins. `src/lib/deploy.test.ts` enforced
rule 12 against the file, which meant rule 12 was GREEN IN THE REPO AND FALSE
IN PRODUCTION: the committed chain listed `seed:bank`, the running chain did
not, migrations landed for weeks while that seeder never once ran, and six
destinations were missing from the desk with nothing reporting it. Anything
that asserts a property of production must read PRODUCTION, or say plainly
which of the two it checked. Same family as db/032's guard that tested a table
name that could never match, and as a `DATABASE_URL` placeholder that let a
seeder build 180 rows and print a convincing report before failing at connect:
A REPORT GENERATED FROM SOMETHING OTHER THAN REALITY IS THE MOST CONVINCING
FAILURE THIS SYSTEM PRODUCES.

And its second half, which cost more than the first: **A FINDING THAT LIVES
ONLY IN THE FILE WHERE IT WAS FOUND WILL BE REDISCOVERED AT FULL PRICE.**
`src/app/api/desk/seed/route.ts` already documented this exact drift — "the
committed blueprint is aspirational and the Render API refuses to change the
command" — and it was rediscovered from first principles anyway, because it
was written where only someone already looking would find it. When a session
learns something structural, it goes HERE the same day, in the file every
agent reads before working. The route was the workaround; this paragraph is
the memory.

**21. EVERY FACT TWO SURFACES MUST AGREE ON HAS EXACTLY ONE OWNER.**
A registry for lists, the schema for names, an exported function for logic.
The defect is DUPLICATION OF AUTHORITY, not duplication of code, and the
distinction is the whole rule: two files may share a helper and still hold two
authorities (each hardcoding the same four slot kinds), while one authority can
serve a dozen call sites happily. Read as "don't repeat yourself" this becomes
DRY zealotry and produces premature abstraction, which is its own disease.

THE TEST IS NARROW ON PURPOSE: MUST TWO SURFACES AGREE ABOUT THIS? If they are
allowed to differ, extraction is optional and probably wrong. If they must
agree and each computes its own answer, they will drift, and the failure is
exquisite — both look right and mean different things, so the day is spent
discovering that "coverage" meant two things in two files. Three instances in
one week: hand-written pool lists (rule 19), table names built by
concatenation, and a coverage board about to grow its own copy of the gap
reporter's logic.

THE GUARD MUST GO THROUGH THE CONSUMERS. A test that calls the shared function
twice and compares it to itself CANNOT FAIL — it is testing the function
against itself while reporting safety it does not provide, and the bypass it
exists to catch is somebody adding a second path next month, which by
definition does not call the shared function. Seed the case, drive both
surfaces the way production drives them, compare verdicts. Then break one
deliberately and watch it go red before you believe it.

AND A PARTIAL UNIFICATION THAT LOOKS UNIFIED IS WORSE THAN TWO HONEST PATHS —
the same reason `(no longer in the catalogue)` was worse than an error. This is
the week's whole theme in one line: SURFACES THAT CLAIM MORE CERTAINTY THAN
THEY HAVE, whether the surface is prose, a coverage number, a green test, or an
architecture diagram. Stopping and reporting that a unification is bigger than
the task is the system working, not the task failing.

**22. MIGRATIONS OWN SCHEMA. SEEDERS OWN CONTENT. ANYTHING COMPUTED OVER
CONTENT RUNS AFTER CONTENT EXISTS.** Rule 21's other axis: 21 asks WHO OWNS
THIS FACT, this asks WHEN MAY IT BE COMPUTED, and they fail differently.
`preDeployCommand` runs `migrate` before every seeder, so a migration that
derives rows by matching authored text runs against EMPTY TABLES — not once, on
every build, forever. db/020 and db/033 tag `ingredient_requirement` that way,
which is why it is empty on any database built from the committed chain and why
`venueEligibility()` prunes nothing: open-flame, full-kitchen and outdoor
requirements constrain no package in production today. The migration looked
right, ran clean, raised nothing, and did nothing — the week's founding defect,
sitting inside the gate built to enforce a rule.

So content-dependent computation is a POST-SEED STEP, never a migration. And it
carries the week's standard guard, in two parts because they catch different
lies: a build test that FAILS IF THE DERIVED TABLE IS EMPTY after a full build,
and a detector for A GATE THAT PRUNES ZERO ROWS ACROSS THE WHOLE CATALOGUE. The
first catches the tagger never running; the second catches it running and
matching nothing, which reads identically from the outside and is why one guard
is not enough. Rule 15 says nothing grades that does not prune; this is how you
find out whether it actually pruned.

**23. A MECHANISM THAT INVITES MISREADING IS A DEFECT, EVEN WHEN IT WORKS.**
The auditor's sentence, kept verbatim because it is the general lesson: **THE
FIELD ISN'T BROKEN; IT ANSWERS A DIFFERENT QUESTION THAN IT APPEARS TO.** That
is subtler than a bug and costlier, because nothing goes red: `affinity` is a
correct, load-bearing additive weight in stage-4 scoring, and it says NOTHING
about eligibility — any `native` row is a whitelist, and a non-native row is
not a claim at all. Sharing therefore requires A SECOND NATIVE ROW; an affinity
row inserts, renders on the desk, throws nothing, and never travels. The name
promises the other thing. In one week that misreading produced a wrong report
from an agent, a wrong ruling from the founder acting on it, and two inert rows
staged under that ruling — three failures, one absent sentence.

So the fix is never only the label. WHERE A NAME INVITES THE WRONG READING,
STATE THE FACT AT EVERY PLACE THE WRONG READING WOULD BE MADE — in the doc an
author writes from, in the migration a reader learns the schema from, beside
the field itself. Correcting a table name without stating what the field does
just invites the next agent to re-derive the same misreading from another
direction. And when the discovery lands, AUDIT WHAT WAS ALREADY BUILT ON THE
MISREADING rather than only fixing forward: the count of things already written
wrong is the real size of the defect, and it is never zero.

**24. COUNT WHAT IT MATCHED. ASSUME YOUR MATCHING IS WRONG UNTIL YOU HAVE.**
Reading the code tells you what it was meant to match. Only counting tells you
what it did. Three times in one week, counting caught what reading missed, and
each was invisible to inspection: `bank_item_default_slot()` spelled
`'take home'` with a space while every authored clause said `take-home`, so 143
of 152 rows landed in the general bucket and NOTHING SAID ANYTHING; `ingredient_
requirement` was empty on every build because a migration matched authored text
against tables that do not exist yet, so a gate that reads as working pruned
nothing; and `seed-drinks.mjs`'s `Also at:` wrote `on conflict do nothing`,
which against an existing non-native row leaves the claim inert WHILE PRINTING
THE DESTINATION IT DID NOT GRANT. All three passed review. All three fell to a
count.

So the procedure, not the sentiment: after any matching, tagging, parsing or
classifying step, COUNT THE ROWS IT TOUCHED AND COMPARE THAT NUMBER TO WHAT YOU
EXPECTED. A tagger that matched 9 of 152 is not a tagger that worked. And count
in BOTH directions, because they fail differently and look identical from
outside — a gate that matches EVERYTHING prunes nothing and is invisible, and a
gate that matches NOTHING prunes everything and is member-facing. The second is
the one that turns a thin catalogue into an empty package.

Its corollary for tooling: **"NEVER USED" MEANS "NEVER TESTED AGAINST THE
TABLES IT WILL ACTUALLY MEET."** The drinks `Also at:` line had only ever run
against emptiness, where broken and correct are indistinguishable. An
instrument's first real use is its first test unless you force an earlier one —
so force one, on a build that holds the rows production holds.

**25. THE THREE RULES A PREMISE IS WRITTEN UNDER.** Founder's, 2026-08-27,
governing every room still unwritten:

  1. **THE PREMISE SELLS THE REGISTER AT ITS MOST BOOKABLE SIZE.** A backyard
     in August must be able to honour every line. A premise only a villa can
     satisfy has sold a location, and this product does not sell locations —
     rule 10, from the other end: Havana in a Brooklyn apartment is the pitch.
  2. **NO PROPER NOUN A GUEST WOULD NOT SAY AT THE TABLE.** Place names,
     brand names and landmarks are the postcard writing itself. What survives
     is what somebody would actually name out loud while eating.

     **A DISH'S OWN NAME IS A TABLE WORD, IN ANY LANGUAGE.** Decided 2026-08-28
     when the founder handed the call over, and it settles both Mexican rooms
     at once. The test is not whether a Brooklyn guest recognises the word —
     it is whether somebody AT THAT TABLE, IN THAT YEAR, would say it. In a
     Oaxaca valley kitchen in 1954, `higaditos` is simply what the dish is
     called; there is no other name for it, and refusing it would leave the
     room unable to name its own food. So `segueza`, `chintextle`, `higaditos`,
     `nicuatole`, `morisqueta`, `escabeche` all pass, exactly as her own ruling
     already passed `mole`, `tamales` and `tortillas`.

     What the clause actually refuses is a proper noun doing MARKETING work: a
     restaurant's name (`Tagliolini Antica Trattoria` — cut), a region deployed
     as a brand, a producer, an appellation. The distinction is whether the
     name IDENTIFIES the thing or SELLS it. `Provolone del Monaco` and a
     `Sorrento` orange identify — they are what the cheese and the fruit are
     called — and both were kept.

     **And the name is never left to do the work alone**, because a member is
     reading a card: the dish line carries the name AND says plainly what it
     is. `Higaditos` tells her nothing; the line that names it and then
     describes it tells her everything, in the room's own register, without
     translating the food into somebody else's.
  3. **NO LABOUR OR STAFF THE HOST DOES NOT HAVE.** The moment a line implies
     somebody carrying a tray, it has described a restaurant and handed the
     evening to staff who do not exist. Acapulco says it structurally — "there
     is no staff in this voice; things appear, nobody serves them" — and that
     is the test for every room.

     **THE TEST IS SERVICE. IT IS NOT DIFFICULTY AND IT IS NOT TIMING.** Twice
     in one day this clause was misread into a constraint on the FOOD rather
     than on the SERVING, and both readings are retired by founder ruling:
     "the host can of course make all of those things", and "get rid of the
     constraint globally 'or have been finished hours ago'." A host may cook
     anything ambitious, and she may cook it DURING the party — a pot going
     while people arrive, a fire lit at nine, a thing that only works hot.
     What she cannot do is have somebody else plate it to order and carry it
     out while she is at her own table.

     The phrase "made in advance" survives only as a DESCRIPTION of how many
     rooms happen to work, never as a requirement. An agent inferring a menu
     limit from an imagined kitchen — "the room gets one fire, so it does not
     have fifteen mains" — has invented a constraint the founder did not write
     and has shrunk her catalogue to fit it. Rule 29's shape again: absence is
     the catalogue being unfinished, not a fact about the room.

Together they are rule 5's arithmetic made checkable: a row can clear distance
3 against every other room and still describe a postcard, and these are the
three ways the postcard gets in.

**26. BEFORE CONCLUDING THE SPACE IS FULL, CHECK YOU ARE MEASURING THE
DIMENSION THE THINGS DIFFER ON.** Three new rooms breached the voice ceiling
and the tempting reading was pigeonhole arithmetic — eighteen rooms will not
fit a vocabulary sized for twelve, so the space is crowded and something must
give. That reading is wrong, and it is seductive precisely because it is
arithmetic. THE VOCABULARY WAS NOT RUNNING OUT OF DISTANCE. `voiceAffinity` is
cosine over tone facets, so it measures TEMPERAMENT and nothing else; four of
the new rooms are TABLE ROOMS, and table rooms converge in tone space by
nature. Havana and Oaxaca score 0.848 because both are warm, and differ
completely in the dimension nobody was measuring: one pours rum in a nightclub,
the other serves mole at a family table.

The proof that the measure is not broken is that it SUCCEEDS where it was
feared — Amalfi/Portofino 0.116 and Amalfi/Côte d'Azur 0.055, between rooms
sharing coast, decade, lemons and half their decor. It separates what shares
MATERIAL and collides what shares TEMPERAMENT, exactly as written.

So the remedy is a second number, not a wider first one: TWO NUMBERS THAT EACH
MEAN SOMETHING BEAT ONE THAT MEANS NEITHER. Tone-close AND deliverables-close
is a genuine confusion risk. Tone-close AND deliverables-disjoint is two rooms
that are neighbours in register and distinct in experience — admitted, and
RECORDED as admitted on the second number so a later reader can see which
verdicts rested on it.

Its trap, which is rule 24 again: a pair can read as disjoint because NEITHER
ROOM HAS ANYTHING. Absence is not distinctness. Any measure computed over a
catalogue still being authored needs a minimum-evidence floor below which the
answer is `unknown`, and `unknown` must never be allowed to read as `disjoint`.

**27. EVERY ROOM HAS ONE SIGNATURE GESTURE, AND EVERY ROOM HAS TWENTY.**
Founder ruling, made repeatedly and re-litigated every time because it lived
only in conversation. BOTH, never either — and an agent offering the founder a
choice between "one invariant" and "a pool" has misread this rule and wasted
her turn.

THE ONE is the signature: the thing that always happens, the room's most
recognisable single fact. Tahiti's conch at dusk. Amalfi's plate refilled
mid-sentence. Aspen's blanket migration. Oaxaca's somebody sent to stir.
Acapulco's table relaid around whoever never left it. `db/031`'s "invariant per
destination" is TRUE of this one and stays.

THE TWENTY are what selection draws from — lesser acts the room can do on any
given night. `bank_kind = 'host_act'` already holds them: 32 exist across
eighteen rooms, one to four each, and roughly 360 are wanted. Tahiti's conch
being simultaneously `world.gesture` AND a bank host act is not duplication to
resolve; it is the signature also being in the pool, which is correct.

A ROOM MISSING ITS SIGNATURE IS NOT A ROOM WITHOUT ONE — it is a room whose
signature has not been found yet, and a weak one must be rejected rather than
kept for tidiness. Palm Springs offered lights-at-dusk; a switch being flipped
is a utility wearing the costume of a ritual, and the founder threw it out
rather than let the field be filled. The hard case is a room whose character is
a BEHAVIOUR — wit moving across a patio — because a behaviour cannot be staged
as an act; that difficulty is a sign the signature is still unfound, never
licence to skip it.

**28. HER TONES ARE NOT CUT TO FIT A CAP.** Founder ruling: *"i dont want to
cut tones. once the drinks and food are added they r different enough."* The
ten-tone cap is a PROXY for distinctness — a room claiming most of the
vocabulary stops being tellable from its neighbours — and a proxy is retired
when the thing it stands in for becomes measurable, not defended for its own
sake. Rule 26 supplies the real measure: tone affinity says how a room SOUNDS,
deliverables overlap says what it SERVES, and two rooms alike in temperament
and opposite in food are neighbours in register, distinct in experience.

The cap has no argument written beside it — a bare number, exactly as `0.65`
was before it was calibrated, and it fails five of the six new rooms while
the recalibrated ceilings fail none of them. That is a proxy outliving the risk
it was hired for.

BUT THE SEQUENCE MATTERS AND IS NOT OPTIONAL: the deliverables measure is MUTE
while six rooms have no dishes and no drinks — every pair involving them
returns `unknown`, which rule 26 forbids reading as `disjoint`. Raising the cap
before the food and drink exist removes a guard and puts nothing in its place.
So the cap moves WITH the catalogue, not ahead of it, and the change is
measured the way the ceiling was: build near-duplicate rooms, count what the
new configuration refuses, and show it refuses MORE than the old one did.

**29. EVERY ROOM MAY HAVE GAMES. `GAMES: none` IS NOT A RULING.**
Founder, twice: *"lets not make a blanket rule that a room is gameless"*, then
*"i told you that they can have games."* It does not get asked a third time.

The bank document's `GAMES: none` lines at Tahiti (*"none, on purpose"*) and
Acapulco (*"none — the band, the window, and the dancing are the shelf"*) are
STALE, not authoritative. Both rooms carry a `piece: "game_rule"` in their own
voice — Tahiti's *"Everybody says what they would want on the last night"*,
Acapulco's *"Everybody names the last song. Whoever names one already played
goes in the water."* Those are the games. An agent finding a document and a
voice in disagreement about whether a room has games resolves it toward HAVING
them, and does not file it as a contradiction for her to adjudicate.

`none` writes no row, no column and no negative claim — it never did, and no
mechanism may be "completed" by writing gamelessness down. A room with no game
row has an AUTHORING ABSENCE, never a property.

The general form, and it is the third time this week: A ROOM'S ABSENCE OF
SOMETHING IS ALMOST NEVER A FACT ABOUT THE ROOM. It was Palm Springs having "no
gesture" (rule 27 — it had a weak one), it was six rooms being "gameless"
(a parser routing by heading), and it was rooms reading as deliverables-disjoint
when neither had any dishes (rule 26's `unknown`). Absence is the catalogue
being unfinished. Treat it as a gap to fill, and bring the founder the fill,
not the question.

**30. IDENTITY LIVES IN WHAT ONLY YOU CAN CLAIM. FLOORS ARE PER-IDENTITY.**
The dish-pool form of the discriminative-vocabulary result, and the same law
holds in both places. A room cannot reach a coverage floor by enumerating
generics, because the generics are already taken: reaching twelve at St. Moritz
meant listing species under "smoked fish" against six existing "smoked salmon"
rows and four "smoked trout"; reaching twelve at Palm Springs meant unpacking
"one tray that looks expensive" into caviar and pâté the wired rooms already
hold. **The rooms that clear a floor clear it on DISTINCTIVE food** — Acapulco's
morisqueta, Amalfi's scialatielli — and a room padded with generics has bought
a number and sold its identity.

**PERIOD GENERICS ARE NOT CLAIMED, AND THAT IS THE WAY THROUGH.** 1965 cocktail
food is a real genre with names no other room can take: rumaki, clams casino,
stuffed celery, onion dip in the good bowl. Era-specific beats category-generic
every time, and it is available wherever a room has a year.

**AND A UNIFORM FLOOR IS ITSELF THE ERROR.** Rooms differ on food identity —
some are table rooms and some are food-incidental — so a single number applied
to all of them manufactures dishes nobody's party needs. Founder ruling: FLOORS
ARE PER FOOD-IDENTITY. Table rooms carry twenty and more; incidental rooms
carry fewer and are not short. Palm Springs refusing a main course is the room
working, not a gap, and **authoring to hit a metric is the failure the metric
was built to detect.**

**A DECLARED IDENTITY, NEVER AN INFERRED ONE.** The floor per identity is only
a guard if the identity is a CLAIM the room makes — `table` / `expression` /
`incidental`, the three values the matrix work already uses, authored once and
consumed twice. If the measure instead infers "incidental" from a low row
count, then AN UNDER-AUTHORED TABLE ROOM READS AS A HEALTHY INCIDENTAL ROOM and
the floor stops catching the exact defect it exists for — rule 22's gate that
cannot fire, arriving through a back door. The room declares; the floor
enforces. Table rooms owe twenty and more, expression rooms twelve, incidental
rooms six to eight.

**AND COUNTING DEFENDS TRUE DISTINCTIONS, NOT ONLY FALSE MATCHES.** The
hyphen lesson's positive twin (rule 24): Havana's *"Buñuelos in anise syrup"*
and Oaxaca's *"Buñuelos, fried and sugared, made in quantity"* survived as two
rows only because a count proved they did not dedupe. **Read side by side,
anyone would have merged them** — and merging them would have collapsed the
founder's own validation pair. The count is what said they were different; the
eye said they were the same.

Its sibling trap, and the reason "it fits the structure" is never enough: a
dish that matches a room's SHAPE may still be the wrong region. Pozole is a
long-simmered pot and so is a mole, but pozole is Guerrero-and-north and putting
it in Oaxaca is Mexico-generic — the ceviche-in-Amalfi error wearing a pot.
STRUCTURE-FIT IS HOW WRONG-COUNTRY DISHES ARRIVE. Evidence of rootedness, never
resemblance of form.

---

**31. AN UNOBSERVABLE COMMIT IS VERIFIED BY ITS OBSERVABLE NEIGHBOUR.**
A commit that touches only documentation compiles to nothing and cannot be
found in a deployed artifact — not because the deploy failed, but *by
construction*. Verify it through the nearest commit that did emit output:
if `HEAD~1` rewrote something served, and that something is present, then
`HEAD` is live too, because they built together.

Worked example, 2026-08-29. `e6d3e9d` changed only this file. Its parent
`0dc55c8` had rewritten SVG path geometry in `src/app/apply/tone-marks.tsx`,
which `QuizFlow.tsx` imports into a PUBLIC page. Pulling the chunks behind
`/apply` and grepping them: four pre-change path strings absent, four
post-change strings present. Clean in both directions, so the build is
`0dc55c8`-or-later, and "`0dc55c8` is live" and "`e6d3e9d` is live" are the
same observable claim.

**Both directions or it is not evidence.** Finding the new strings alone
proves far less than also finding the old ones gone — a partial deploy, a
cached chunk, or a coincidental match all survive a one-directional check.

And the rule this pairs with: **verify the readback path exists before
demanding a readback.** The same day, four numbers were promised "from
production" against machinery that serves none of them — `check:matrix` and
the deliverables overlap are CLI scripts no route imports, and `voiceAffinity`
scores a guest's answers against rooms, never two rooms against each other. It
was not a failure to fetch; the reading did not exist. **Where a number is
read from is a fact to establish first, and it belongs in the label** — a
build-time authoring gate read locally against a clean worktree is correct and
should say so, not apologise for not being production.

`/api/health` exists so this is never re-derived: `sha`, `registry`, `worlds`,
`seeded`, and the slugs that differ. See rule 21 for why it reports both
authorities rather than picking one.

---

**32. SYMMETRY IS NOT EVIDENCE.**
That two things resemble each other is not a reason to treat them the same.
The tempting move is always to "finish the job": one pool is tagged, so tag
the neighbour; one room got a gesture, so give them all one; a requirement
lost its claimants, so re-point it at whatever replaced them.

Worked example, 2026-08-31. `requires_full_kitchen` is claimed only by menus
(db/020, `where m.cooking = 'actually_made'`), and db/045 retired the menu
pool — so the requirement had no live demand and the gate report called it
inert. The obvious repair was to claim it for dishes, which are what menus
became. That would have been a machine inventing demand so a gate looked
busy, and `src/lib/catalogue/tagging.ts` had already refused it in writing:

    "This comment exists so that the next person does not 'finish the job'
     by symmetry: symmetry is not evidence."

Whether an atomised dish needs a full kitchen is an AUTHORING question with a
founder's answer. The same reasoning decided the drinks in the same session:
twenty of twenty-five programmes contain an occasion-shaped word and not one
is an occasion claim, so the corpus was taken at its word rather than tidied
into the shape a parser expected.

**The test: can you point at the row that says so?** If the only argument is
that it would be consistent, stop — and say the gap is an authoring absence,
which is a finding, not a failure. See rule 15 for why a gap that can go red
is worth more than a gap quietly filled.
