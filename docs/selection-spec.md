# Selection — how a Revelle gets assembled

Draft spec. Everything here follows from the research; the *why* is kept
inline because the reasoning is what makes it defensible later.

---

## What it does

Turns a completed application into a small set of candidate Revelles for a
curator to choose between. It never delivers on its own.

Input: her answers, her taste profile, her cohort affinities.
Output: 2–3 complete candidate assemblages, ranked, each with a plain-language
account of why it was chosen.

---

## Five principles, and where they come from

**1. Coherence by construction, not by search.**
Choose the destination *first*. Every later choice draws from a pool already
scoped to it. This appears independently in tabletop generators, Shopify
collections, procedural level design and the W3C food ontology — and it means
we never need a model that knows tiki glasses clash with linen. Adding an
ingredient costs a few tags, never N compatibility edges.

**2. Correlate, don't roll independently.**
Products are derived *from* the destination rather than picked separately and
checked for clashes. Every degree of freedom removed here is a constraint we
never have to explain to a curator.

**3. Fewer, bigger decisions.**
Ten thousand mathematically distinct bowls of oatmeal still look like oatmeal.
Perceived uniqueness comes from decisions that visibly cascade, not from a large
combination count. One destination choice that changes everything downstream
reads as more bespoke than twelve orthogonal parameters.

**4. Sampling, not optimization.**
We need one valid, tasteful, novel set — quickly. Not the optimum, not a proof.
That reframe is what rules out a constraint solver and makes a beam search in
SQL sufficient.

**5. The explanation is ours to write.**
The layer that says *"dropped the premium glassware to stay under budget"* has
to be our code. No solver produces that sentence, and practitioners
consistently rank transparency over automation.

---

## The pipeline

### Stage 0 — Resolve answers to facets *(built)*

`quiz_option_facet` already maps every option to a facet by FK, carrying
polarity. Produces a weighted positive set, a **dealbreaker** set, and her
free-text answer (held for the curator, not parsed).

Her two **scale** answers — how many people, and roughly what a head — come out
of the same bridge but do not join the vector. They are a constraint and a
multiplier, not a taste, and nothing in the catalogue is tagged in either
dimension so they score against nothing by construction. See stage 4.

### Stage 1 — Build her preference vector

Blend three sources:

| Source | Weight |
|---|---|
| Her stated answers this time | always dominant |
| Her taste profile (past Revelles, corrections) | grows with history |
| Her cohort prior | fills the gap when history is thin |

The cohort term carries most of the weight at application #1 and recedes as
her own evidence accumulates. This is the shrinkage the sparsity research
recommends, and it is a weighted average — not a model.

Superseded signals are excluded. A 2029 preference beats a 2026 one; they are
never averaged.

### Stage 2 — Choose the destination *(the collection key)*

The single most consequential decision.

1. **Hard-exclude** any destination carrying a dealbreaker facet. Not a
   penalty — a filter. If she said no costume rule, no costume rule at any
   score. Dealbreakers dominate at the screening stage; treating them as large
   negative weights lets a high-scoring match sneak one through.
2. **Score** what survives by weighted facet overlap against her vector.
3. **Penalize recently-issued** destinations, so the catalog spreads rather
   than converging on favourites. `ingredient_issuance` already tracks this.
4. **Sample from the top few** rather than taking the highest score. The argmax
   is deterministic, so two similar customers would receive identical Revelles.

   The mechanism is **dithering** — re-rank by `log(rank) + N(0, log ε)` and
   re-sort. It leaves the top few roughly in place while pulling deeper
   candidates up, and ε is the multiplicative fuzz on rank (ε=2 moves a
   rank-10 item to roughly 5–20). Published guidance is ε between 1.5 and 3,
   but treat it as a tuning knob, not a constant.

   **Where the dither is applied matters, and the usual advice is wrong for
   us.** At Netflix scale, exploration is nearly free — the regret is amortized
   over a hundred million members. Revelle's customers are few and each
   deliverable is expensive, so exploring on a *delivered* Revelle is a bad
   trade. **Dither the shortlist the curator sees, not the output.** She absorbs
   the exploration risk, and rejecting a dithered candidate is itself signal.

Soft negatives — the ones that are preferences rather than vetoes — are scored
at roughly **a fifth** of the weight of an equivalent positive. That ratio is
the classical recommendation and it stops mild dislikes from dominating.

### Stage 3 — Scope every pool

The destination now filters everything downstream. Three mechanisms, all
borrowed from generators that have shipped:

- **Forbidden**: an ingredient can be marked unusable *under this destination*.
  A structural "never," not a low score.
- **Written for here**: an ingredient can *claim* a destination. Claiming any
  makes the set a whitelist — the thing is eligible under the destinations it
  claims and nowhere else. This is what "Havana's daiquiris are not an option
  at the Dolomites" (docs/drinks.md) actually requires, and it is a **filter**
  for the same reason forbidden is: a high enough score would otherwise sneak
  it through. It arrived late — db/019 — and every menu and drink written
  before it was eligible under every destination in the meantime.
- **Re-weighted**: the same ingredient may be common in one destination and
  rare in another. A weight, and *only* a weight: a positive affinity is not a
  claim, because "the house would allow it" is a sentence a curator writes
  about one destination without meaning to withdraw the thing from every other.
- **Inherited facets**: the destination contributes its own facets to the
  preference vector, so downstream scoring pulls toward it automatically.

The first two are the same rule the occasion and slot axes already run — no
claims means eligible everywhere, any claim makes a whitelist, a veto cannot be
outvoted — and it is implemented once, in `claimEligibility()`.

### Stage 4 — Fill the slots

Beam search, most-constrained slot first. For each candidate:

```
score = facet match
      + destination affinity
      − issuance penalty          (spread across customers)
      − similarity to already-chosen   (spread within the set)
```

That last term is the similarity discount — each candidate penalized by how
much it resembles what's already placed. It stops six products from being six
versions of one idea, it's about ten lines, and it is deployed at Airbnb with
published numbers (+0.29% uncancelled bookings, +0.8% booking value). Budget is
carried as a running constraint, not checked at the end — and the next two
sections are what that number actually is.

**The issuance penalty has a documented shape too** — LinkedIn's impression
discounting, running in production over a billion impressions. Two features do
the work: **how recently** an ingredient was last issued, and **how often**.
Each decays independently, and they combine into a single multiplier
`0 < d ≤ 1` applied to the score. Conversion falls monotonically with both, so
the decay is real rather than assumed. Start with exponential decay on each and
fit the weights when there's data.

#### The budget is per head, and the ceiling is per head × guests

The application asks two scale questions, both banded: how many people, and
roughly what a head. `quiz_response_scale` (db/006) turns the two bands into
three numbers, and the difference between them is what the search needs.

| Number | What it is | What it is for |
|---|---|---|
| `budget_planning` | planning-per-head × planning-guests | what to build to |
| `budget_ceiling` | the top of one band × the top of the other | what must not be exceeded |
| `guests_high` | the top of her guest band | how many of anything counted |

**Per head is what makes the constraint comparable at all.** $150 a head is the
same product at six people and at forty; $3,000 is two entirely different
products at those two sizes, and a total on its own tells this stage nothing
until it is divided by a guest count that used to go unasked. Build to
`budget_planning` and carry `budget_ceiling` as the running bound.

**Two kinds of null, and both mean "ask her", not "no limit".**
`budget_ceiling` is null whenever either band is open-topped — "more than
sixty", "over $600 a head" — because the top of an open band is not a number.
Every figure is null when she answered "not sure yet", which carries no numeric
reading on purpose. A candidate built against a null ceiling is one the curator
must price by hand, and stage 6 must say so rather than silently substituting a
middle band.

**Neither answer is scored.** No destination, product or soundtrack is ever
tagged in the `guest_count` or `spend_per_person` dimensions, so they contribute
nothing to any facet overlap. They bind as a constraint and a multiplier, which
is the only way a scale should act: a woman spending $75 a head has not
expressed a taste for cheap things.

#### Guest count is also a quantity

Anything counted per person is sized from the guest band and not from the
budget: place cards, favours, game materials, servings, and the multiples in the
shopping edit. Quantities use `guests_high`, never `guests_planning` — a place
card too few is a person without a seat, and the cost of one spare is nothing.
Where `guests_high` is null, the count is confirmed with her before anything is
printed or bought.

That makes guest count the most consequential answer after the destination: it
moves the ceiling and it moves every quantity underneath it, which is why it is
asked rather than guessed from the occasion.

The exact number a print run reads is `revelle.guest_count`, set at delivery
when it is finally known. The band is what she said when she applied, and it is
frozen with every other answer.

### Stage 5 — Novelty

Fingerprint the assemblage and check it against everything issued. **On
collision, backtrack locally** — swap the least load-bearing ingredient — do
not restart.

This matters more than it looks. Local rules propagate cheaply, but a rule
spanning the whole set (budget ceiling, one-from-each-category, never-issued)
is a *global* constraint, and restart-on-failure falls off a cliff there:
researchers took the same problem from zero conflicts to unable-to-finish by
adding a single global rule. Uniqueness is exactly that class of rule. The fix
is local backtracking in code we own, not a bigger solver.

### Stage 6 — Present to the curator

2–3 complete candidates, each with:

- why this destination (the facets that matched, the dealbreakers that
  eliminated others)
- which choices were forced, and by what
- what was dropped and why
- her free-text answer, verbatim and prominent

The curator picks, edits, or rejects. **Every edit is a signal** — a swapped
product is a negative on what came out and a positive on what went in, and
those are the highest-value observations in the system.

---

## Explicitly not building

| Not building | Why |
|---|---|
| Learned compatibility | Needs a co-occurrence corpus we don't have; the field's only good dataset is dead and legally encumbered, and its reference code hasn't run since 2018 |
| A constraint solver (CP-SAT, Clingo, Z3) | Optimization machinery for a sampling problem. Revisit only if a global constraint genuinely binds |
| Vector embeddings / semantic search | Hundreds of items with explicit human tags. Embeddings would replace a vocabulary a curator can read and correct with one she can't |
| An LLM choosing from the catalog | Confidently selects items that don't exist. It writes the justification; it does not select |
| Learned ranking | No training data for years. Curator corrections are how we'd eventually get it |

---

## How the human scales

Curation moves from **outputs** to **the library**. Authoring fifty
destinations serves five thousand customers; reviewing every delivery does not.
Review becomes a sample plus anything flagged low-confidence — a weak facet
match, an unusual free-text answer, a first Revelle in a new cohort.

The early exhaustive-review phase is not waste. It generates the correction
data that justifies reducing it.

---

## The soundtrack — delivery

**Our catalog is the source of record. Spotify and Apple are delivery
channels.** The engine selects the tracks; a streaming playlist is a rendering
of that selection, never its origin. Print renders from the same record — song
titles and artist names are facts, and facts carry no obligation to anyone.

**Ask in the application which service she uses**, and route:

| She has | She gets |
|---|---|
| Spotify Premium | A public playlist on the société's own account. She follows a link; no login, no OAuth. |
| Apple Music | The same selection built via MusicKit. |
| Neither | A printed setlist, and a line in The Prep. |

**Why the question is necessary.** On Spotify's free tier, mobile playback
forces shuffle and injects Spotify's own tracks between yours, with ads. The
sequenced arc does not survive contact with a free account, and there is no fix
on our side. But this is a routing problem, not a membership one — gating
membership on one component of one deliverable is the wrong layer, and a
subscription requirement sits badly in an application that promises no
clipboards.

**Sequencing is a taste judgment.** The audio-analysis endpoints that would have
supplied tempo and energy are gone for new applications. That costs nothing:
the arc — arrival, dinner, the moment, late, ending — is authored, not computed.

**Keep the streaming calls behind a thin client** with the account id as a
parameter. Not for the cap (see below) but because Spotify deprecated half its
API in a single announcement and will do it again.

---

## Failure modes, and what happens

| Failure | Response |
|---|---|
| Dealbreakers eliminate every destination | Report which constraints conflict and which to relax. Never silently drop one |
| Assemblage collides with an issued one | Local backtrack; swap the least load-bearing ingredient |
| Budget can't be met | Return the closest candidate with the overage stated plainly, per head as well as in total — "$40 a head over" is a sentence a host can act on |
| No ceiling exists — she said "not sure yet", or a band is open-topped | Build to the register and hand the curator the number to confirm. Never invent a middle band |
| A pool is too thin to fill a slot | Surface as a catalog gap, not a customer-facing error |
| Confidence is low across the board | Flag for mandatory curator review regardless of sampling rate |
| House Spotify account reaches its 11,000-playlist ceiling | Add a second account — a config change, since the account id is already a parameter. Decades away at realistic membership; no design hours now |
| House account's refresh token lapses (six-month lifetime) | Playlist creation fails silently. Alarm on it |

---

## Open questions

1. **Slot counts.** Six products is a placeholder inherited from the headroom
   arithmetic. Real counts change the combinatorics materially.
2. **How many candidates** the curator sees. Three is a guess; two may be
   plenty and cheaper to generate.
3. **Where budget binds.** A hard ceiling and a "one from each category" rule
   together are what trigger the global-constraint cliff. If budget is soft,
   most of stage 5's complexity is unnecessary. Bands help here: the ceiling is
   a range rather than a point, and the gap between `budget_planning` and
   `budget_ceiling` is slack the search can spend before it has to backtrack.
4. **What a null ceiling costs.** Open-topped bands and "not sure yet" both
   produce candidates no rule can check. If that turns out to be a large share
   of applications, the answer is a follow-up question at the curator's desk,
   not a default band in the code.
## Settled — she does not pick the destination

**Decided for v1, and the reason is measurement, not mystique.**

If she chooses from a shortlist, the profile learns her **self-image** — what
she would like to be seen wanting. If the curator chooses and she reacts, it
learns her **taste**. Those diverge, and the second is the product. Revelle's
whole promise is knowing her better than she can articulate; a picker would
teach the system her self-presentation and nothing else.

There is a mechanical consequence too. If she picks, she never sees the
destinations she would have rejected, so no negative signal is generated at all
— and negatives carry disproportionate weight when positives are scarce. She
pre-filters, and the system inherits her filter instead of learning past it.

**The shortlist goes to the curator. The customer sees one destination, before
she pays.** Her response is the measurement: buying is a strong positive,
asking for a change is a precise negative with a reason attached, and walking
away is the clearest signal of all. The purchase gate is the instrument.

---

## Three decisions the founder made, and the reasoning that has to survive them

Each of these is a decision somebody will otherwise "fix" back, so the argument
is written down here and again in the code that implements it. In six months
the reasoning is the part that gets lost.

### 1. Venue never touches the destination

> "Venue never touches the destination — that's the thesis of the product. The
> destination is where she's transported to; the venue is where she physically
> is; the engine's whole job is mapping one onto the other. Havana in a
> Brooklyn apartment isn't a compromise, it's the pitch. The moment venue
> nudges destination, you're back to 'party themes that match your space,'
> which is the Pinterest board you're against."

`environment` has **zero weight in stage 2**, not a small one. It joins
`guest_count` and `spend_per_person` in the non-taste dimensions
(`src/lib/selection/vector.ts`), and db/020 refuses at the database to let an
environment facet be tagged onto a destination or a cohort at all.

It becomes a **second stage-3 filter dimension** instead, mechanically
identical to the destination's own forbidden rule. Ingredients carry structural
requirements — `requires_outdoors`, `requires_open_flame`,
`requires_full_kitchen`, `noise_ceiling`, `deposit_safe` — and a room either
affords them or it does not. Untagged means works anywhere, which is the safe
default and the one to take whenever tagging is a judgement call.

The worked case: **a clambake in a studio apartment.** The boil-pot menu dies on
`requires_outdoors`; NANTUCKET survives, because a destination is not a place;
she gets the fog-day lunch instead.

If venue pruning leaves a pool too thin, that is the **existing** pool-too-thin
failure mode — a catalogue gap, a work order — and never a reason to have let
the venue steer selection.

### 2. "What do you want more of" is an emphasis, not a taste weight

> "Each answer points at a slot, and this question shouldn't feed the preference
> vector at all. It's the only question on the quiz that tells you which
> deliverable she values, and averaging it into taste weights discards exactly
> that."

| Answer | What it does |
|---|---|
| One moment they retell | The Moment gets guaranteed inclusion and the voice layer's centrepiece attention |
| Everything already handled | the effort answer wearing a costume: forces the sleight-of-hand tier, weights The Prep toward brevity |
| A table worth photographing | The Table and The Edit, product budget shifted toward tabletop |
| A ritual we repeat next year | The Ending, plus a **repeatability flag** — design something annualizable |
| An inside joke made real | only works with her material, so it triggers a follow-up and raises her free-text answer's weight in the voice prompt; it **cannot** be satisfied from the catalogue |
| Permission to stay up | structure, not products: the Soundtrack arc extends, the Ending moves late |

`affinity` is out of the preference vector entirely. The emphasis is consumed at
stage 4 as slot weights — which, in a beam search over required and optional
slots, means **promoting a slot to required**; a multiplier would be a no-op,
because every candidate in a slot moves together — and by the voice layer as
attention allocation.

**"A ritual we repeat next year" is the highest-LTV answer on the quiz**: she is
asking for Revelle #2 before #1 has shipped. It is therefore recorded on the
**member record** (`member_emphasis`, db/020, written by a trigger) and not only
on the application, because it is still true next spring.

### 3. Voice is a filter, aesthetic is a rank

> "Voice wins because (a) the voice is the medium of every deliverable — the
> invitation, the menu, the sequencing all speak, while the look touches fewer
> surfaces; (b) errors split asymmetrically — a wrong look reads as 'not what I
> pictured' and gets forgiven, a wrong voice reads as 'this isn't us' and churns
> the member; (c) tone icons describe her people, aesthetic picks describe an
> image she's seen somewhere — the people are ground truth, the image is usually
> borrowed."

**Not a bigger weight — a tier.** Tone facets threshold-filter destinations in
stage 2; aesthetic facets rank within the survivors; the two are never averaged,
because averaging produces the destination that is middling on both, which is
the compromise that is nobody's.

The **dither operates within the tone-surviving set**. Exploration may trade one
voice-true destination for another; it may never resurrect an aesthetic winner
the tone filter killed.

A hard clash is **first a catalogue-gap entry and only second an engine
decision**:

> "supper club, disco after dark, warm, loud, sentimental isn't actually a
> contradiction — it's a wedding-reception-register party humans throw
> constantly. The conflict exists only because your catalog lacks that
> destination."

The gap goes through the existing `recordCatalogueGaps` seam, keyed on the look
that has to be authored in her voice. When it fires, the engine falls back to
the **closest voice**, never to the best-looking destination — otherwise the
tier collapses into a weight at exactly the moment the tier is load-bearing.

Silence is never a failing score, on either side: a host who was never shown the
voice question, and a destination nobody has tagged yet, both pass unfiltered
and are reported as unjudged.

The threshold is **0.20**, argued from the real catalogue on
`EngineOptions.toneThreshold`; `npm run check:tone-threshold` reprints the
table it was picked from.
