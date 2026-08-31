/**
 * THE VENUE GATE — the fourth filter, and the one the product is built on.
 *
 * The founder, and this is the thesis rather than a preference:
 *
 *   "Venue never touches the destination — that's the thesis of the product.
 *    The destination is where she's transported to; the venue is where she
 *    physically is; the engine's whole job is mapping one onto the other.
 *    Havana in a Brooklyn apartment isn't a compromise, it's the pitch. The
 *    moment venue nudges destination, you're back to 'party themes that match
 *    your space,' which is the Pinterest board you're against."
 *
 * So `environment` has ZERO WEIGHT in stage 2. Not a small one. It is a
 * non-taste dimension in vector.ts beside `guest_count` and `spend_per_person`,
 * db/020 refuses to let an environment facet be tagged onto a destination or a
 * cohort at all, and selection.test.ts fails with the thesis in the message if
 * anybody reconnects it.
 *
 * ── WHAT IT DOES INSTEAD ─────────────────────────────────────────────
 *
 * It prunes the POOL, at stage 3, mechanically identically to the destination's
 * own forbidden rule. An ingredient may carry STRUCTURAL requirements — it
 * needs to be outside, it needs live fire, it needs a real kitchen, it will
 * break a noise ceiling, it will not survive a deposit — and a room either
 * affords those things or it does not.
 *
 * A clambake in a studio apartment is the worked case. The boil-pot menu
 * requires outdoors; a city apartment does not have outdoors; the menu leaves
 * the pool. NANTUCKET does not leave anything, because a destination is not a
 * place — she still gets Nantucket, and what arrives is the fog-day lunch
 * rather than the clambake. That is the mapping the product exists to do.
 *
 * ── UNTAGGED MEANS WORKS ANYWHERE ────────────────────────────────────
 *
 * The same default the destination axis takes (occasion.ts, claimEligibility):
 * an ingredient that makes no claim is eligible everywhere. Tagging is a
 * judgement, and where it is a judgement call the answer is to leave it
 * untagged rather than to guess — a wrong tag deletes a deliverable silently
 * and forever, while a missing tag costs nothing but a curator's second look.
 *
 * The venue side takes the same shape from the other end: a room with no row
 * for a requirement is treated as AFFORDING it. Pruning on something the house
 * has not thought about would delete deliverables for a reason nobody wrote
 * down. db/020 seeds every room against every requirement explicitly, so that
 * default is a safety net rather than the mechanism.
 *
 * `not_decided` — "Still deciding" — affords everything, and that is a real
 * answer rather than a missing one (db/002 says so on the facet itself). She
 * has not chosen a room, so no room has ruled anything out.
 *
 * ── AND WHEN PRUNING LEAVES THE POOL TOO THIN ────────────────────────
 *
 * That is the EXISTING pool-too-thin failure mode: a catalogue gap, a work
 * order, and the house authors something that works in an apartment. It is
 * never a reason to have let the venue steer the destination — a thin pool is
 * a fact about the library, and the fix is to write more library.
 */

import type { EligibilityVerdict } from "./occasion.ts";
import type { HostAffordance, Ingredient, Venue, VenueAnswers } from "./types.ts";

/**
 * ── THE ROOM IS NO LONGER THE ONLY THING SHE CAN REPORT — db/049 ─────
 *
 * Everything above this line was written when `environment` was the whole of
 * what the application knew about the physical world, and db/035 closed by
 * naming the limit that created:
 *
 *     "The quiz asks WHERE, not WHAT IT HAS … a city apartment with a balcony
 *      and one without are the same answer, and this grade can only ever prune
 *      at the granularity of a room TYPE. That is a limit of what the member
 *      can report, not of this table — THE FIX IS A QUIZ OPTION."
 *
 * There are now three more answers — inside or out, what water there is,
 * whether anybody is getting in — and `composeVenue` below is the single place
 * that turns four answers into one room's affordances.
 *
 * ── ONE AUTHORITY, AND THE REASON IS RULE 21'S NARROW TEST ───────────
 *
 * MUST TWO SURFACES AGREE ABOUT THIS? Yes, and not optionally: the engine's
 * loader (`loadVenue` in catalogue.ts) and the gate reporter (`gateReport` in
 * catalogue/gates.ts) both have to say the same thing about what a host's
 * answers afford, or `check:gates` reports a prune count for a rule the engine
 * does not run. So the rule lives here, exported, and both of them call it. The
 * guard for it goes THROUGH the consumers — see gates.db.test.ts, which drives
 * the loader and the reporter over the same seeded host and compares verdicts,
 * rather than calling this function twice and comparing it to itself.
 *
 * ── THE COMPOSITION RULE, WHICH IS NOT BOOLEAN ALGEBRA ───────────────
 *
 *   HER OWN STATEMENT SUPERSEDES THE ROOM TYPE. Where any host answer speaks to
 *   a requirement, the room type is not consulted for that requirement at all.
 *   Where none speaks to it, db/020's and db/035's rows stand untouched.
 *
 *   AMONG HOST ANSWERS, FALSE WINS. Two axes speak to `requires_still_water`
 *   and both must say yes.
 *
 *   AN ANSWER WITH NO ROW SAYS NOTHING. That is "Still deciding", and it is
 *   also every response written before db/049 — a null column produces no
 *   claim, so an older application keeps precisely the behaviour it had.
 *
 * Neither pure AND nor pure OR over all four sources is right, and it is worth
 * one paragraph on why, because both look plausible and both are wrong in a
 * direction that reaches a member.
 *
 * AND-ING EVERYTHING breaks the apartment-with-a-roof-deck. db/020 says an
 * apartment has no outdoors; she says her party is outside; AND refuses her the
 * pétanque set. Her answer was absorbed and not honoured (rule 16), and the
 * refusal is preference-by-square-footage wearing feasibility's badge — the
 * room type was a GUESS ABOUT A BUILDING and she has just reported the fact.
 *
 * OR-ING EVERYTHING breaks the house-that-stays-indoors. The room affords
 * outdoors, the evening does not use it, and OR sends the clambake to a dinner
 * party in a dining room — ignoring the one answer that was about this party.
 *
 * So: the more specific source wins, and it wins by REPLACING rather than by
 * combining. Rule 21 again, from its other end — a fact with two owners drifts,
 * and the drift here is silent and specific.
 */

/** What one environment row of `venue_affordance_labelled` carries. */
export type EnvironmentAffordance = {
  readonly requirement: string;
  readonly provided: boolean;
  readonly note: string;
};

/**
 * WHICH HOST ANSWERS SPEAK — the one place the four answers are read as a list.
 *
 * Rule 19's shape rather than a hand-written list of fields: the pairs come out
 * of `VenueAnswers` by name, so adding a fifth venue axis means adding it to
 * the type and to db/049's trigger list, and this function does not change.
 * `environment` is deliberately NOT among them — it is the base, not an
 * overlay, and putting it here would make it supersede itself.
 */
export function statedAnswers(
  answers: VenueAnswers
): readonly { quizField: string; optionCode: string }[] {
  const pairs: { quizField: string; optionCode: string }[] = [];
  const push = (quizField: string, optionCode: string | null) => {
    // A null column is a question she was never asked; an empty string is a
    // half-written row. Neither is an answer, and neither may prune.
    if (typeof optionCode === "string" && optionCode.length > 0) {
      pairs.push({ quizField, optionCode });
    }
  };
  push("indoor_outdoor", answers.indoorOutdoor);
  push("water_access", answers.waterAccess);
  push("water_use", answers.waterUse);
  return pairs;
}

/**
 * FOUR ANSWERS, ONE ROOM. The rule above, executed.
 *
 * `hostClaims` must already be scoped to the answers she actually gave —
 * `statedAnswers` says which those are, and the loader's query filters on them.
 * Passing the whole table would mean every host afforded everything, which is
 * the failure mode this function is least able to notice on its own.
 */
export function composeVenue(input: {
  readonly environment: string;
  readonly label: string;
  readonly environmentRows: readonly EnvironmentAffordance[];
  readonly hostClaims: readonly HostAffordance[];
}): Venue {
  const provides: Record<string, boolean> = {};
  const notes: Record<string, string> = {};
  const refusedBy: Record<string, string> = {};

  for (const row of input.environmentRows) {
    provides[row.requirement] = row.provided;
    if (row.note.length > 0) notes[row.requirement] = row.note;
    if (!row.provided) refusedBy[row.requirement] = "environment";
  }

  // The overlay. Grouped first so that "some host answer spoke" and "every host
  // answer that spoke said yes" are two separate questions — collapsing them
  // into one pass would let a single `true` claim erase a `false` one from
  // another axis depending on row order, which is the kind of bug that only
  // shows up when somebody adds an `order by`.
  const byRequirement = new Map<string, HostAffordance[]>();
  for (const claim of input.hostClaims) {
    const list = byRequirement.get(claim.requirement) ?? [];
    list.push(claim);
    byRequirement.set(claim.requirement, list);
  }

  for (const [requirement, claims] of byRequirement) {
    const refusal = claims.find((claim) => !claim.provided);

    // REPLACE, never combine. Her statement supersedes the room type — see the
    // two worked failures in the header.
    provides[requirement] = refusal === undefined;

    if (refusal === undefined) {
      delete notes[requirement];
      delete refusedBy[requirement];
      continue;
    }
    refusedBy[requirement] = refusal.quizField;
    if (refusal.note.length > 0) notes[requirement] = refusal.note;
    else delete notes[requirement];
  }

  return {
    environment: input.environment,
    label: input.label,
    provides,
    notes,
    refusedBy,
  };
}

/**
 * May this ingredient be placed in this room?
 *
 * A sibling of `worldEligibility` rather than a fourth caller of
 * `claimEligibility`, and the difference is worth one line: the other three
 * axes ask "does this thing claim, or refuse, this value" — one key, one
 * verdict. This one asks "does this room afford EVERY requirement this thing
 * carries", which is a conjunction over a set. Forcing it through the same
 * function would mean inventing a forbidden claim per unmet requirement, which
 * is a rule wearing another rule's clothes.
 *
 * The verdict shape is shared, so the sentence lands in the catalogue gap
 * beside the other three with no special case.
 */
export function venueEligibility(
  ingredient: Ingredient,
  venue: Venue | null
): EligibilityVerdict {
  // No venue on the snapshot means the house does not know the room. Nothing
  // is pruned, because pruning on an unknown is how a deliverable disappears
  // for a reason nobody can name.
  if (!venue) return { eligible: true, reason: "" };

  const requirements = ingredient.requirements ?? [];
  if (requirements.length === 0) return { eligible: true, reason: "" };

  // ── SILENCE IS A REFUSAL, NOT A PERMISSION ──────────────────────────
  //
  // This read `=== false`, so a requirement with NO ROW was `undefined`, and
  // `undefined === false` is false: not refused, therefore allowed. That was
  // deliberate and it is preserved here because the reasoning was sound and
  // the mechanism was not — db/020's default IS generous, but it expresses
  // that generosity by INSERTING `provided = true` rows, one per environment,
  // in a cross join that ran once. Restating the default in code as well made
  // the code the second owner of it (rule 21), and when the rows and the code
  // disagreed the code won silently.
  //
  // WHAT BEAT IT: db/020's cross join ran against the environments that
  // existed the day it ran. Anything added to `environment_type` afterwards
  // has no row at all, and every requirement was therefore afforded there —
  // which is how `requires_full_kitchen` came to be claimed by 17 rows,
  // refused for beach, poolside, garden, hotel and restaurant in the
  // migration source, and still afforded by all 960 configurations the house
  // models. A gate that cannot fire.
  //
  // `!== true` fails CLOSED: an affordance nobody has stated refuses, loudly,
  // and the backfill that follows is then a correction of a visible wrong
  // answer rather than the only thing standing between a gate and silence.
  // Backfilling alone would have left the NEXT environment silently
  // permissive. See CLAUDE.md rule 15.
  const unmet = requirements.filter(
    (requirement) => venue.provides[requirement.code] !== true
  );
  if (unmet.length === 0) return { eligible: true, reason: "" };

  const first = unmet[0];
  const clause = venue.notes[first.code];

  // WHERE THE SENTENCE PUTS THE BLAME — db/049.
  //
  // "impossible in a house" was always true while the room was the only thing
  // that could refuse anything. It is now sometimes a lie that costs a curator
  // an afternoon: a float refused because she has no pool has nothing to do
  // with her house, and a gap sentence blaming the house sends whoever reads it
  // to author an indoor variant of a thing that needed a pool.
  //
  // Untagged provenance falls back to the room, which is correct for every
  // refusal that existed before today and for every hand-built Venue in a test.
  const source = venue.refusedBy?.[first.code] ?? "environment";
  const where =
    source === "environment"
      ? `in ${venue.label.toLowerCase()}`
      : `at this party`;

  return {
    eligible: false,
    reason:
      `impossible ${where}: it ${joinWords(unmet.map((r) => r.demand))}` +
      (clause ? ` — ${clause}` : ``),
  };
}

function joinWords(words: readonly string[]): string {
  if (words.length === 0) return "";
  if (words.length === 1) return words[0];
  return `${words.slice(0, -1).join(", ")} and ${words[words.length - 1]}`;
}
