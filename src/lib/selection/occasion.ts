/**
 * THE OCCASION GATE.
 *
 * Two rules, and both live only here.
 *
 *   1. Is this ingredient eligible for this occasion at all?
 *   2. Which slots does this occasion have, and how many of each?
 *
 * The second collection key, and the counterpart to the destination. The
 * destination decides the REGISTER — what an arrival drink is at WESTHAMPTON,
 * 1976 versus at PORTOFINO, OFF-SEASON. The occasion decides the PARTS — that
 * there is an arrival drink at all, that a birthday has a beat where the person
 * is marked, that a weekend has material for each of its days and a dinner does
 * not.
 *
 * Keeping them separate is what lets the catalogue compound: every destination
 * already authored becomes available to every occasion, in that occasion's
 * shape, without anybody writing anything new.
 */

import type {
  EligibilityClaim,
  OccasionClaim,
  OccasionCode,
  OccasionShape,
  Scale,
  SlotClaim,
  SlotRule,
  UnitSlot,
} from "./types.ts";

export type EligibilityVerdict = {
  eligible: boolean;
  /** A sentence, for the explanation. Empty when nothing had to be said. */
  reason: string;
};

/**
 * THE ELIGIBILITY RULE — stated once, here, and nowhere in SQL.
 *
 * It runs over TWO axes, which is why it is written once and parameterised
 * rather than twice and kept in step by hand:
 *
 *   the OCCASION axis  may this thing appear at a birthday at all
 *   the SLOT axis      may this thing fill the honouring beat, or is it
 *                      day-two material that happens to live in the same pool
 *
 * The rule itself:
 *
 *   · no claims at all   eligible everywhere on that axis. An untagged
 *                        ingredient makes no claim, and a catalogue that starts
 *                        empty must not start ineligible — which is not a
 *                        concession, it is the state this catalogue is in.
 *   · any 'native' claim those values and no others. Naming one is opting into
 *                        a whitelist, which is what a curator means when she
 *                        writes "this is a birthday thing".
 *   · a 'forbidden' claim never, whatever else is claimed. So "everything
 *                        except a kids' party" is one row, and a contradiction
 *                        between the two resolves to no, because a veto that
 *                        can be outvoted is not a veto.
 */
export function claimEligibility(
  claims: readonly EligibilityClaim[],
  value: string,
  describe: (key: string) => string
): EligibilityVerdict {
  if (claims.length === 0) return { eligible: true, reason: "" };

  const forbidden = claims.find(
    (c) => c.key === value && c.fit === "forbidden"
  );
  if (forbidden) {
    return {
      eligible: false,
      reason: forbidden.note
        ? `never ${describe(value)} — ${forbidden.note}`
        : `never ${describe(value)}`,
    };
  }

  const natives = claims.filter((c) => c.fit === "native");
  if (natives.length === 0) return { eligible: true, reason: "" };

  if (natives.some((c) => c.key === value)) return { eligible: true, reason: "" };

  return {
    eligible: false,
    reason:
      `written for ${natives.map((c) => describe(c.key)).join(", ")}` +
      `, not ${describe(value)}`,
  };
}

export function occasionEligibility(
  claims: readonly OccasionClaim[],
  occasion: OccasionCode
): EligibilityVerdict {
  return claimEligibility(
    claims.map((c) => ({ key: c.occasion, fit: c.fit, note: c.note })),
    occasion,
    (key) => `at a ${humanOccasion(key)}`
  );
}

export function slotEligibility(
  claims: readonly SlotClaim[],
  slotCode: string
): EligibilityVerdict {
  return claimEligibility(
    claims.map((c) => ({ key: c.slotCode, fit: c.fit, note: c.note })),
    slotCode,
    (key) => `as ${key.replace(/_/g, " ")}`
  );
}

/**
 * THE SLOT PLAN — occasion_slot expanded into one entry per pick.
 *
 * A slot asking for one to three items becomes three unit slots: the first
 * required, the rest optional. A per-day slot becomes one per day of the
 * occasion. Everything downstream then works on a flat list, so "fill the
 * slots" is a single pass and "how many did we place" is a count.
 *
 * The optional tail is not padding. It is the slack the budget is allowed to
 * spend and the first thing dropped when it cannot — which is what makes
 * "dropped the second edit item to stay under the ceiling" a sentence the
 * engine can write truthfully.
 *
 * QUANTITY, which is a different number from COUNT. A per-guest slot is one
 * pick and many objects: the count is one, the quantity is the top of her guest
 * band. `guests_high`, never `guests_planning` — a place card too few is a
 * person without a seat. Where the band is open-topped there is no high, and
 * the quantity falls back to the planning number with the fact recorded, so
 * stage 6 can tell the curator to confirm it before anything is printed.
 */
export function planSlots(
  rules: readonly SlotRule[],
  shape: OccasionShape,
  scale: Scale
): UnitSlot[] {
  const guests = scale.guestsHigh ?? scale.guestsPlanning ?? null;
  const slots: UnitSlot[] = [];

  const ordered = [...rules].sort((a, b) => a.position - b.position);

  for (const rule of ordered) {
    const days = rule.perDay ? Math.max(1, shape.days) : 1;

    for (let day = 1; day <= days; day += 1) {
      for (let n = 0; n < rule.maxCount; n += 1) {
        slots.push({
          key: `${rule.slotCode}:${day}:${n}`,
          slotCode: rule.slotCode,
          label: rule.perDay
            ? `${rule.label} — day ${day}`
            : rule.maxCount > 1
              ? `${rule.label} ${n + 1}`
              : rule.label,
          section: rule.section,
          pool: rule.pool,
          required: rule.required && n < rule.minCount,
          quantity: rule.perGuest ? Math.max(1, Math.round(guests ?? 1)) : 1,
          perGuest: rule.perGuest,
          dayIndex: rule.perDay ? day : null,
          position: rule.position * 100 + day * 10 + n,
          note: rule.note,
        });
      }
    }
  }

  return slots;
}

/** For a sentence, not for a customer. The house's own names. */
export function humanOccasion(occasion: string): string {
  switch (occasion) {
    case "birthday":
      return "birthday";
    case "girls_weekend":
      return "weekend away";
    case "dinner_party":
      return "long dinner";
    case "getaway":
      return "getaway";
    case "anniversary":
      return "anniversary";
    case "holiday":
      return "holiday";
    case "bridal":
      return "bridal weekend";
    case "no_reason":
      return "evening for no reason";
    default:
      return "occasion";
  }
}
