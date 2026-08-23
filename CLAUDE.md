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
