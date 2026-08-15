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
import type { Ingredient, Venue } from "./types.ts";

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

  const unmet = requirements.filter(
    (requirement) => venue.provides[requirement.code] === false
  );
  if (unmet.length === 0) return { eligible: true, reason: "" };

  const first = unmet[0];
  const clause = venue.notes[first.code];

  return {
    eligible: false,
    reason:
      `impossible in ${venue.label.toLowerCase()}: it ${joinWords(
        unmet.map((r) => r.demand)
      )}` + (clause ? ` — ${clause}` : ``),
  };
}

function joinWords(words: readonly string[]): string {
  if (words.length === 0) return "";
  if (words.length === 1) return words[0];
  return `${words.slice(0, -1).join(", ")} and ${words[words.length - 1]}`;
}
