/**
 * STAGE 1 — her preference vector.
 *
 * A weighted average of three sources, and emphatically not a model:
 *
 *   what she said this time    always dominant
 *   what we have learned       grows with her history
 *   her cohort's prior         fills the gap when that history is thin
 *
 * ── THE SHRINKAGE ────────────────────────────────────────────────────
 *
 * At application #1 there is no history at all, so the choice is between
 * leaning on the cohort and leaning on nothing. Leaning on nothing means every
 * first-time customer is scored on nine tapped answers, which is exactly the
 * sparsity the cohort table was built to survive.
 *
 * So the non-stated half of the weight is split k/(k+n) to the cohort and
 * n/(n+k) to her own history, where n is how many current signals we hold about
 * her and k is a constant expressing how much cohort evidence is worth. At
 * n = 0 the cohort takes all of it; at n = k they are equal; at n = 40 with
 * k = 8 the cohort is down to a sixth. It recedes on its own, and nobody has to
 * remember to turn it off.
 *
 * ── DEALBREAKERS ARE NOT PART OF THE AVERAGE ─────────────────────────
 *
 * A dealbreaker is a FILTER (spec, stage 2), and a filter has no weight to
 * contribute — mixing it into the vector at any magnitude is precisely the
 * mistake the spec warns about, because a high enough match score would then
 * sneak one through. They come out of this stage as a set of facet ids and are
 * applied by exclusion.
 *
 * Which negatives are dealbreakers is a judgement, and it is made here:
 *
 *   · everything she said in THIS application under "what would ruin it" —
 *     she is answering that question now, about this evening;
 *   · nothing else. A negative from her history or her cohort is a SOFT
 *     negative, scored at a fifth of an equivalent positive.
 *
 * A curator who wants a permanent veto records it as a dealbreaker in her own
 * tool; the engine does not promote a preference to a veto on her behalf.
 *
 * ── SUPERSESSION ─────────────────────────────────────────────────────
 *
 * Excluded upstream: the loader only ever selects `superseded_by is null`. A
 * 2029 preference beats a 2026 one and they are never averaged, which is the
 * spec's rule and db/002's mechanism, and this file simply never sees the old
 * row.
 */

import type {
  CohortAffinity,
  EngineOptions,
  Facet,
  HistorySignal,
  PreferenceVector,
  StatedFacet,
  VectorSource,
  VectorTerm,
} from "./types.ts";

/**
 * ANSWERS THAT ARE NOT A TASTE, and are therefore not in the average.
 *
 * Every one of these still RESOLVES through `quiz_response_facet` — db/002's
 * rule is that a dimension excluded on purpose must be excluded by a named
 * rule rather than by accident of not appearing — and every one of them is
 * consumed somewhere else, as the thing it actually is.
 */
const NON_TASTE_DIMENSIONS = new Set([
  "guest_count",
  "spend_per_person",
  "music_service",
  // Retired by db/006. It resolves, so it must be excluded on purpose rather
  // than by accident of not appearing.
  "budget",

  /*
   * THE VENUE, AND THIS ONE IS THE PRODUCT THESIS.
   *
   *   "Venue never touches the destination — that's the thesis of the product.
   *    The destination is where she's transported to; the venue is where she
   *    physically is; the engine's whole job is mapping one onto the other.
   *    Havana in a Brooklyn apartment isn't a compromise, it's the pitch. The
   *    moment venue nudges destination, you're back to 'party themes that
   *    match your space,' which is the Pinterest board you're against."
   *
   * ZERO WEIGHT, not a small one, and the difference is not academic. Before
   * this line an environment term sat in the vector at the full stated weight.
   * Even with no destination tagged in the dimension it changed every score,
   * because facetOverlap normalises by the vector's total mass — so the room
   * she was in was already quietly damping how well every destination matched
   * her. And the day a curator tagged a world `beach`, the beach would have
   * started picking destinations.
   *
   * It becomes a stage-3 POOL FILTER instead: src/lib/selection/venue.ts, over
   * the structural requirements in db/020. db/020 also refuses, at the database,
   * to let an environment facet be tagged onto a destination or a cohort, so
   * this rule cannot be undone from the data side either.
   */
  "environment",

  /*
   * THE OTHER THREE VENUE ANSWERS — db/049, and every word above applies to
   * them without amendment.
   *
   * Inside or out, what water there is, whether anybody gets in. The founder
   * asked for all three in one afternoon, and each one is a fact about the
   * physical world she is standing in rather than a taste. They are here for
   * the same reason `environment` is, and the temptation is sharper: a host who
   * says "a pool, and yes, people will be in it" LOOKS like a host who should
   * be shown Palm Springs, and shipping that instinct as a small positive
   * weight is exactly the sin rule 2 names — "PREFERENCE-BY-SQUARE-FOOTAGE",
   * "at any weight, including small ones that look like tie-breaks".
   *
   * The correct behaviour is the one that reads as under-using the answer: her
   * eighteen destinations rank identically whether she has a pool or not, and
   * the ONLY consequence of the answer is which objects can be sent to her.
   * Havana in a Brooklyn apartment is the pitch; Palm Springs without a pool is
   * the same pitch, and the room arrives with the things that work in her
   * garden instead of the things that float.
   *
   * db/049 widens db/020's trigger so all four are refused on a world and on a
   * cohort at the database, which is why this list cannot be quietly undone
   * from the data side.
   */
  "indoor_outdoor",
  "water_access",
  "water_use",

  /*
   * "WHAT DO YOU WANT MORE OF", WHICH IS AN EMPHASIS AND NOT A WEIGHT.
   *
   *   "Each answer points at a slot, and this question shouldn't feed the
   *    preference vector at all. It's the only question on the quiz that tells
   *    you which deliverable she values, and averaging it into taste weights
   *    discards exactly that."
   *
   * It is read instead by src/lib/selection/emphasis.ts, which turns each
   * answer into the deliverable it names — a guaranteed slot, an instruction to
   * the writer, a flag on her member record, or an owed follow-up. That file
   * carries the whole mapping and the argument for it.
   */
  "affinity",

  /*
   * WHICH MEAL, AND WHETHER SHE HAS PICKED A MONTH — db/026, and both are
   * facts about the evening rather than opinions about it.
   *
   * `meal_shape` is consumed at stage 3 as a claims filter over `dish_meal`,
   * which is a claims table and not a tag table: nothing in the catalogue is
   * ever tagged in this dimension, so it would contribute nothing to a score
   * even if it were left in. It is named here anyway, because a dimension
   * excluded by accident of not appearing is a dimension somebody will tag
   * something in.
   *
   * `event_timing` has one member — "still deciding" — and its inertness is
   * load-bearing rather than incidental. It is where an answer about WHEN goes
   * when it is not a season, and it exists precisely so that a host with no
   * month is scored as though the question had not been asked.
   *
   * THE MONTHS THEMSELVES ARE NOT HERE, and that is the point. They resolve to
   * `season`, which IS a taste dimension and IS tagged across the menu, drink
   * and dish pools — so a July host is pulled toward summer food by exactly the
   * mechanism every other answer uses, and no line in this file had to be
   * written to make it happen.
   */
  "meal_shape",
  "event_timing",

  /*
   * THE TWO STRUCTURAL COLUMNS THE APPLICATION NOW FEEDS — db/037, and they are
   * out for a different reason from everything above them.
   *
   * `evening_ending` is how she thinks a night should end and `evening_start`
   * is what hour it begins, and both are real preferences about the evening
   * rather than facts of scale or routing. What keeps them out of the vector is
   * not that they are uninteresting — it is that THE COMPARISON IS THE WRONG
   * SHAPE FOR THIS FILE.
   *
   * A preference vector is weights, and facetOverlap is a normalised dot
   * product over shared facet rows: two things either carry a facet or they do
   * not. The matrix is LEVELS, and the comparison has an asymmetric case in it
   * — her `late` sits near a room's `evening`, and a room's `evening` is never
   * near a `late` that no room holds. There is no weight that says that. Trying
   * would flatten a level distance into a tag match, which is a quieter version
   * of the averaging THE SEAM forbids: the structural axis would stop being an
   * axis and become a handful of extra points a room could score on.
   *
   * So they are read by src/lib/selection/structure.ts instead, which owns the
   * level table and the argument, and they are named HERE — not merely absent —
   * because this file's rule is that a dimension excluded on purpose must be
   * excluded by a named rule. Nothing in the catalogue is tagged in either
   * dimension today, so today the line changes no number. The day a curator
   * tags a world `until_morning`, it is the line that stops the ending from
   * quietly picking destinations twice.
   */
  "evening_ending",
  "evening_start",

  /*
   * THE TASTE DIRECTIONS — AND THIS ONE IS A HOTFIX, NOT A THESIS.
   *
   * READ THIS BEFORE ASSUMING IT BELONGS WITH THE OTHERS. Every entry above is
   * excluded because it is the WRONG KIND of answer for a preference vector.
   * This one is exactly the right kind and is excluded because THE CATALOGUE
   * DOES NOT ANSWER IT YET. The line comes out; the ones above it do not.
   *
   * ── WHAT WAS ACTUALLY WRONG ─────────────────────────────────────────
   *
   * "Which of these pulls at you" is MANDATORY and asks for two or three of
   * eleven. db/002 gave all eleven facet rows, and no world, product, menu,
   * drink, dish or bank item is tagged in the dimension — no seeder writes one
   * and no migration projects one. So her two or three terms matched nothing,
   * ever.
   *
   * That is not merely inert, and the difference is the whole reason this line
   * exists. facetOverlap (src/lib/selection/score.ts) divides by the vector's
   * TOTAL MASS, so an unmatched term is not skipped — it sits in the
   * denominator and shrinks the score of every term that DID match. Answering
   * the question made her result worse, on every pool, for everybody. It is the
   * mechanism this file already documents and refuses two entries up, under
   * `environment`: "Even with no destination tagged in the dimension it changed
   * every score, because facetOverlap normalises by the vector's total mass."
   * Same failure, same remedy, and no second remedy invented for it.
   *
   * ── WHY NOT TAG THE CATALOGUE INSTEAD ───────────────────────────────
   *
   * Because that is the founder's work and not a script's. "Sun-bleached" or
   * "supper club" is an authored judgement about six hundred dishes, and a
   * sweep that guesses it is precisely what the desk exists to prevent —
   * CLAUDE.md rule 8, and rule 13's line about member-facing claims. Recorded
   * as founder work in docs/proposals.md, 2026-08-23.
   *
   * ── HOW THIS LINE LEAVES ────────────────────────────────────────────
   *
   * Delete it the day anything in the catalogue carries a `taste_direction`
   * tag, and not before. Until then her answer still REACHES the engine — it is
   * kept on `vector.unscored`, and voiceClashGap() in destination.ts reports
   * the aesthetic she asked for as a catalogue gap, which is now the only thing
   * that answer does and the most useful thing it could do while nothing is
   * tagged: it names, per applicant, exactly what is missing.
   */
  "taste_direction",

  /*
   * THE THREE THE SWEEP FOUND, and they are here because of the rule at the end
   * of CLAUDE.md 15: "Run the trace whole rather than per-suspicion: orphans
   * arrive in cohorts, and the second one is always found by the sweep that was
   * looking for the first."
   *
   * The trace, run over every dimension a quiz answer resolves into, against
   * every place the catalogue is actually tagged. THE CATALOGUE IS TAGGED IN
   * SIX DIMENSIONS AND NO MORE: `season` and `making`/`cooking` (projected onto
   * menus, drinks and dishes by db/012, db/017 and db/021), `voice_tone` (worlds,
   * by scripts/seed-destinations.mjs), `group_fun` and `anti_preference` (games,
   * from src/lib/games.ts), and `mood` (one menu tag, `cooking_smell`). Every
   * other dimension her answers reach was a term in the denominator and nothing
   * in the numerator.
   *
   *   `occasion`      — consumed as a GATE. db/009's occasion eligibility is a
   *                     claims table (ingredient_occasion), not a tag table, and
   *                     occasionEligibility() reads it. A birthday is a fact
   *                     about the evening that decides what may be issued; it
   *                     was never a taste.
   *   `play`          — consumed as an EXCLUSION. db/016 hangs `no_games` off
   *                     "none at all", and the game slots are removed before
   *                     anything is scored. What KIND of play she wants is
   *                     `group_fun`, which IS tagged and stays in.
   *   `food_service`  — consumed as an EXCLUSION, the same way. `standing`
   *                     carries `no_seated_meal` (db/022) and that is what the
   *                     answer does. It is `meal_shape`'s sibling, and that one
   *                     was already named here for the identical reason.
   *
   * All three are CONSTRAINTS ALREADY DOING THEIR WORK SOMEWHERE ELSE, so
   * nothing is lost and the damping stops. Unlike `taste_direction` above, none
   * of these is waiting for the catalogue to be tagged: tagging a dish
   * `birthday` would be db/009's gate written a second time in the wrong
   * vocabulary, which db/009 and db/019 both refuse at length.
   */
  "occasion",
  "play",
  "food_service",
]);

export function buildVector(
  stated: readonly StatedFacet[],
  history: readonly HistorySignal[],
  cohorts: readonly CohortAffinity[],
  facets: Record<string, Facet>,
  options: EngineOptions
): PreferenceVector {
  const terms: Record<string, VectorTerm> = {};
  /**
   * What she SAID and this vector does not SCORE. See PreferenceVector.unscored:
   * a reader that needs to know what she asked for — the catalogue-gap report
   * does — must not be told she asked for nothing.
   */
  const unscored: Facet[] = [];
  const noteUnscored = (facet: Facet): void => {
    if (!unscored.some((f) => f.id === facet.id)) unscored.push(facet);
  };

  const add = (
    facetId: string,
    weight: number,
    source: VectorSource,
    because: string
  ): void => {
    if (weight === 0) return;
    const facet = facets[facetId];
    if (!facet) return;
    if (NON_TASTE_DIMENSIONS.has(facet.dimension)) return;

    const term = (terms[facetId] ??= { facet, weight: 0, contributions: [] });
    term.weight += weight;
    term.contributions.push({ source, weight, because });
  };

  // ── the blend ──────────────────────────────────────────────────────
  const evidence = history.filter((s) => s.facetId !== null).length;
  const k = options.cohortPriorStrength;
  const rest = 1 - options.statedWeight;
  const cohortShare = rest * (k / (k + evidence));
  const historyShare = rest - cohortShare;

  // ── what she said this time ────────────────────────────────────────
  const dealbreakers = new Set<string>();

  for (const answer of stated) {
    if (NON_TASTE_DIMENSIONS.has(answer.dimension)) {
      // Kept out of the weights and kept on the record. "She did not say" and
      // "we do not score what she said" are different facts and the second one
      // has readers. See PreferenceVector.unscored.
      const facet = facets[answer.facetId];
      if (facet) noteUnscored(facet);
      continue;
    }

    if (answer.polarity === "negative") {
      dealbreakers.add(answer.facetId);
      // `weight` is 1 on every veto — db/016 constrains it, because a veto has
      // no degree — so the arithmetic below is unchanged by its existence.
      // Recorded in the vector too, at the soft-negative ratio, so that a
      // destination merely LEANING toward something she vetoed also scores
      // worse than one that is silent about it. The veto does the eliminating;
      // this only orders what survives.
      add(
        answer.facetId,
        -options.statedWeight * options.softNegativeRatio,
        "stated",
        `she said this would ruin it`
      );
      continue;
    }

    // THE ANSWER'S OWN WEIGHT, and the reason this is a multiplication rather
    // than a constant.
    //
    // Most questions are unordered: old-world Riviera is not more or less than
    // desert modern, so every one of those answers carries weight 1 and this is
    // exactly what it was before db/016. An ORDINAL question is different. "How
    // much of this do you want to make" has four answers on one axis, and a
    // host at the finished end is making a claim AGAINST making things by hand
    // — a negative term in her vector, which pulls the pool toward the most
    // finished things in it and eliminates nothing.
    //
    // That is deliberately not a dealbreaker. A veto is what she said would
    // ruin the evening; this is a preference with a direction, and confusing
    // the two would empty her menu pool over an answer about her afternoon.
    add(
      answer.facetId,
      options.statedWeight * answer.weight,
      "stated",
      answer.weight < 0
        ? `she asked for the other end of this`
        : `she asked for it`
    );
  }

  // ── what we have learned about her ─────────────────────────────────
  if (historyShare > 0) {
    for (const signal of history) {
      if (!signal.facetId) continue;
      const magnitude = signal.strength * signal.confidence;
      const sign =
        signal.polarity === "negative" ? -options.softNegativeRatio : 1;
      add(
        signal.facetId,
        historyShare * magnitude * sign,
        "history",
        `${signal.polarity === "negative" ? "she turned this down" : "she took to this"}` +
          ` (${signal.source}, ${signal.observedAt.slice(0, 10)})`
      );
    }
  }

  // ── her cohort ─────────────────────────────────────────────────────
  if (cohortShare > 0) {
    for (const cohort of cohorts) {
      const share = cohort.weightShare * cohort.confidence;
      if (share <= 0) continue;
      for (const facetId in cohort.facets) {
        const w = cohort.facets[facetId];
        const sign = w < 0 ? options.softNegativeRatio : 1;
        add(
          facetId,
          cohortShare * share * w * sign,
          "cohort",
          `her cohort ${cohort.name} (${cohort.weightShare.toFixed(2)})`
        );
      }
    }
  }

  const weights: Record<string, number> = {};
  for (const facetId in terms) weights[facetId] = terms[facetId].weight;

  return {
    weights,
    terms,
    dealbreakers: [...dealbreakers],
    blend: {
      stated: options.statedWeight,
      history: historyShare,
      cohort: cohortShare,
    },
    evidenceCount: evidence,
    unscored,
  };
}

/**
 * STAGE 3, THE THIRD MECHANISM — inherited facets.
 *
 * The destination contributes its own tags to her vector before a single
 * ingredient is scored, so everything downstream pulls toward it automatically
 * rather than each pool needing its own rule about coherence. This is the whole
 * of "correlate, don't roll independently", and it is nine lines.
 *
 * Returns a new object; the original vector is reused for the other candidates
 * and must not acquire one destination's facets on the way past.
 */
export function inheritDestination(
  vector: PreferenceVector,
  destinationFacets: Record<string, number>,
  options: EngineOptions
): Record<string, number> {
  const scoped: Record<string, number> = { ...vector.weights };
  for (const facetId in destinationFacets) {
    scoped[facetId] =
      (scoped[facetId] ?? 0) +
      options.inheritedFacetWeight * destinationFacets[facetId];
  }
  return scoped;
}

/**
 * The facets that drove a match, strongest first.
 *
 * `agreesOnANo` is the case that has to be reported differently or the sentence
 * is a lie. A destination tagged −0.8 on novelty props, for a woman whose
 * vector carries novelty at −0.11, produces a POSITIVE contribution — the two
 * of them agree, and that agreement is worth points. But "it matched on novelty
 * props and balloons" reads as though the destination has them. It repudiates
 * them, which is why it scored.
 */
export function topMatches(
  vector: PreferenceVector,
  tags: Record<string, number>,
  limit: number
): { facet: Facet; contribution: number; agreesOnANo: boolean }[] {
  const scored: {
    facet: Facet;
    contribution: number;
    agreesOnANo: boolean;
  }[] = [];

  for (const facetId in tags) {
    const v = vector.weights[facetId];
    if (v === undefined) continue;
    const term = vector.terms[facetId];
    if (!term) continue;
    scored.push({
      facet: term.facet,
      contribution: v * tags[facetId],
      agreesOnANo: v < 0 && tags[facetId] < 0,
    });
  }

  return scored
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, limit)
    .filter((entry) => entry.contribution > 0);
}
