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
  ExcludedSlot,
  OccasionClaim,
  OccasionCode,
  OccasionShape,
  Scale,
  SlotClaim,
  SlotRule,
  UnitSlot,
  WorldScope,
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
 *   the DESTINATION    may Havana's daiquiris be poured at the Dolomites
 *                      (db/019 — the third axis, and the last one that was
 *                      still a weight pretending to be a filter)
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
        ? `never for ${describe(value)} — ${forbidden.note}`
        : `never for ${describe(value)}`,
    };
  }

  const natives = claims.filter((c) => c.fit === "native");
  if (natives.length === 0) return { eligible: true, reason: "" };

  if (natives.some((c) => c.key === value)) return { eligible: true, reason: "" };

  return {
    eligible: false,
    reason:
      `written for ${natives.map((c) => describe(c.key)).join(", ")}` +
      `, not for ${describe(value)}`,
  };
}

/**
 * `describe` returns a bare noun phrase on both axes — "a birthday", "the
 * moment" — so that one template reads correctly for both. Building the
 * preposition into the describer is what produced "written for at a birthday".
 */
export function occasionEligibility(
  claims: readonly OccasionClaim[],
  occasion: OccasionCode
): EligibilityVerdict {
  return claimEligibility(
    claims.map((c) => ({ key: c.occasion, fit: c.fit, note: c.note })),
    occasion,
    (key) => {
      const noun = humanOccasion(key);
      return `${/^[aeiou]/i.test(noun) ? "an" : "a"} ${noun}`;
    }
  );
}

export function slotEligibility(
  claims: readonly SlotClaim[],
  slotCode: string
): EligibilityVerdict {
  return claimEligibility(
    claims.map((c) => ({ key: c.slotCode, fit: c.fit, note: c.note })),
    slotCode,
    (key) => key.replace(/_/g, " ")
  );
}

/**
 * THE DESTINATION AXIS — the same rule, third caller.
 *
 * docs/drinks.md: "A drink is scoped to a destination the way a menu is.
 * Havana's daiquiris are not an option at the Dolomites, and the mulled wine is
 * not an option in Tahiti." That was prose and nothing enforced it, because
 * `<entity>_world` (db/009) held a `forbidden` flag and an `affinity` weight
 * and no way at all to say "written for here". So a menu authored for HAVANA
 * stayed eligible everywhere and merely scored a point lower; withdraw its
 * competitors and it was placed. db/019 adds the missing third state and this
 * is where it becomes a filter.
 *
 * The three states of a world row map one-to-one onto the three states the rule
 * already knows:
 *
 *   forbidden        a veto, unchanged. It cannot be outvoted by any claim.
 *   native           a CLAIM. Any native row makes the ingredient eligible only
 *                    under the destinations it claims.
 *   neither          NOT A CLAIM. `affinity` re-weights the score and says
 *                    nothing about eligibility — which is what keeps a game
 *                    scoped to Westhampton at +0.4 ("the house would allow it")
 *                    playable everywhere else, and what makes this change safe
 *                    to adopt one destination at a time.
 *
 * `affinity` is untouched by all of this. It is still the additive term stage 4
 * scores with; the two questions are simply no longer the same column.
 */
export function worldEligibility(
  scopes: Readonly<Record<string, WorldScope>>,
  worldId: string,
  /** The destination being scoped to, by name, for the sentence. */
  here: string
): EligibilityVerdict {
  const claims: EligibilityClaim[] = [];
  for (const [id, scope] of Object.entries(scopes)) {
    if (scope.forbidden) claims.push({ key: id, fit: "forbidden", note: scope.note });
    else if (scope.native) claims.push({ key: id, fit: "native", note: scope.note });
  }

  return claimEligibility(claims, worldId, (key) =>
    key === worldId ? here : (scopes[key]?.name ?? "another destination")
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
 *
 * ── AND THE SLOTS SHE DOES NOT HAVE ──────────────────────────────────
 *
 * `exclusions` removes a rule from the plan ENTIRELY, before anything is
 * scoped, filled or dropped. She is not serving food, so the menu is not a
 * slot that went unfilled — it is a slot her Revelle never had, and the
 * distinction is the difference between a work order for the house and noise
 * in the work order list. See exclusions.ts.
 *
 * Her answer beats `required`. Required describes the occasion's shape, not an
 * obligation on her. The removal is recorded so the curator can see it if she
 * looks; it is not something to act on, and it is never a gap.
 *
 * ── AND THE SLOTS SHE ASKED FOR BY NAME ──────────────────────────────
 *
 * `guaranteed` is the other direction, and it is where "what do you want more
 * of" lands. An emphasised slot is PROMOTED from optional to required, which is
 * what a slot weight actually means in a beam search — see the long note in
 * emphasis.ts on why a multiplier would have been a no-op. It can only promote
 * a slot the occasion already has: her answer decides what matters, never what
 * exists, and emphasising an ending at an occasion with no ending changes
 * nothing.
 */
export type SlotPlan = {
  slots: UnitSlot[];
  /** Removed because she said she does not have them. Not gaps. */
  excluded: ExcludedSlot[];
};

export function planSlots(
  rules: readonly SlotRule[],
  shape: OccasionShape,
  scale: Scale,
  exclusions: readonly string[] = [],
  /** slot_kind codes her emphasis promotes. See emphasis.ts. */
  guarantees: readonly string[] = []
): SlotPlan {
  const guests = scale.guestsHigh ?? scale.guestsPlanning ?? null;
  const slots: UnitSlot[] = [];
  const excluded: ExcludedSlot[] = [];
  const excludedCodes = new Set(exclusions);
  const guaranteedCodes = new Set(guarantees);

  const ordered = [...rules].sort((a, b) => a.position - b.position);

  for (const rule of ordered) {
    if (rule.excludedBy !== null && excludedCodes.has(rule.excludedBy)) {
      excluded.push({
        slotCode: rule.slotCode,
        slotLabel: rule.label,
        pool: rule.pool,
        requiredByOccasion: rule.required,
        exclusion: rule.excludedBy,
        detail:
          `"${rule.label}" was never planned: she said ${rule.excludedBy}. ` +
          `Nothing to author — this is not a gap` +
          (rule.required
            ? `, and it outranks the occasion asking for it. Required is the ` +
              `shape of a ${humanOccasion(shape.occasion)}, not an obligation ` +
              `on her.`
            : `.`),
      });
      continue;
    }

    const days = rule.perDay ? Math.max(1, shape.days) : 1;
    // A guarantee cannot be removed by exclusion and cannot invent a slot: it
    // is read AFTER the exclusion check above, and only inside a rule the
    // occasion already carries.
    const guaranteed = guaranteedCodes.has(rule.slotCode);

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
          required: (rule.required || guaranteed) && n < rule.minCount,
          quantity: rule.perGuest ? Math.max(1, Math.round(guests ?? 1)) : 1,
          perGuest: rule.perGuest,
          dayIndex: rule.perDay ? day : null,
          position: rule.position * 100 + day * 10 + n,
          note: rule.note,
          guaranteed: guaranteed && n < rule.minCount,
        });
      }
    }
  }

  return { slots, excluded };
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
