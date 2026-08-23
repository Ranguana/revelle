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

**12. Superseded reasoning is PRESERVED, never deleted.**
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
