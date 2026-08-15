/**
 * STAGE 6 — the account.
 *
 * "The layer that says 'dropped the premium glassware to stay under budget' has
 * to be our code. No solver produces that sentence, and practitioners
 * consistently rank transparency over automation."
 *
 * Every sentence in this file is assembled from facts the earlier stages
 * recorded as they went. Nothing here re-derives anything, nothing here calls a
 * language model, and nothing here is allowed to say something the engine did
 * not actually do — which is the one rule that makes an explanation worth
 * reading twice.
 *
 * The curator's four questions, in order:
 *
 *   why this destination        the facets that matched
 *   what eliminated the others  the dealbreakers, named
 *   what was forced             the slots that had one candidate
 *   what was dropped, and why   budget, a thin pool, or a collision
 *
 * And her free-text answer, verbatim and prominent — never summarised, never
 * parsed, because it is the one part of the application a machine has no
 * business interpreting.
 *
 * EVERY SENTENCE IN THIS FILE IS FOR THE HOUSE. Not one of them is written for
 * a member, and none of them may be shown to one — including the gap
 * sentences, the drops, and the "do not deliver this one" verdict. That was
 * always the intent; member.ts now makes it structural. If you are building a
 * page she will look at, you want memberRevelle(), and nothing here.
 */

import { formatCents, type SlotPool } from "./fill.ts";
import { humanOccasion } from "./occasion.ts";
import { TONE_DIMENSIONS } from "./tone.ts";
import { topMatches } from "./vector.ts";
import type {
  Application,
  BudgetReport,
  CatalogueGap,
  Destination,
  DroppedPick,
  Emphasis,
  ExcludedSlot,
  Explanation,
  OccasionShape,
  Pick,
  PreferenceVector,
  Elimination,
  Swap,
  Venue,
} from "./types.ts";

export type ExplainInput = {
  application: Application;
  shape: OccasionShape;
  vector: PreferenceVector;
  /** Which deliverable she values. Never part of the vector. */
  emphasis: Emphasis;
  /** The room she is physically in. Null when the house cannot resolve it. */
  venue: Venue | null;
  /** Scoped pools, read only for what the room removed. */
  pools: Map<string, SlotPool>;
  /** How much this destination sounds like her people. Null = not judged. */
  toneMatch: number | null;
  toneThreshold: number;
  destination: Destination;
  destinationScore: number;
  destinationRank: number;
  ditheredRank: number;
  picks: Pick[];
  dropped: DroppedPick[];
  gaps: CatalogueGap[];
  /** Slots she does not have. Never mixed into `gaps`. */
  excluded: ExcludedSlot[];
  swaps: Swap[];
  eliminated: Elimination[];
  budget: BudgetReport;
  lowConfidence: boolean;
  /** Set only by assemblage uniqueness. A gap never sets it. */
  blocked: string | null;
};

export function explain(input: ExplainInput): Explanation {
  const {
    application,
    shape,
    vector,
    emphasis,
    venue,
    pools,
    destination,
    destinationScore,
    picks,
    dropped,
    gaps,
    excluded,
    swaps,
    eliminated,
    budget,
  } = input;

  const occasion = humanOccasion(application.occasion);

  const headline =
    `${destination.name} for a ${occasion}` +
    (shape.days > 1 ? ` over ${shape.days} days` : "") +
    `, ${picks.length} ingredient${picks.length === 1 ? "" : "s"} placed.`;

  // ── why this destination ───────────────────────────────────────────
  //
  // TWO TIERS, REPORTED AS TWO TIERS. The voice sentence comes first and says
  // "cleared"; the aesthetic sentence says "ranked". Reporting them as one
  // number would be the averaging the tier replaced, printed.
  const matches = topMatches(vector, destination.facets, 8).filter(
    (m) => !TONE_DIMENSIONS.has(m.facet.dimension)
  );
  const positives = matches.filter((m) => !m.agreesOnANo).slice(0, 5);
  const agreements = matches.filter((m) => m.agreesOnANo).slice(0, 5);
  const why: string[] = [];

  why.push(
    input.toneMatch === null
      ? `Voice first, EXCEPT THAT IT COULD NOT BE JUDGED HERE: either she named ` +
        `no tones or ${destination.name} carries none. Silence is not a failing ` +
        `score, so it was not filtered out — but nothing has checked that this ` +
        `destination sounds like her people, and a curator should. Tagging its ` +
        `tones in src/lib/destinations.ts is what fixes it for everybody.`
      : `Voice first: ${destination.name} sounds like her people at ` +
        `${input.toneMatch.toFixed(2)} against a bar of ` +
        `${input.toneThreshold.toFixed(2)}. That is a FILTER — it decided which ` +
        `destinations were still in the room, and the ranking below could not ` +
        `have brought back one that failed it.`
  );

  if (positives.length > 0) {
    why.push(
      `${destination.name} then ranked on ${list(positives.map((m) => m.facet.label.toLowerCase()))} — ` +
        `${(destinationScore * 100).toFixed(0)} against the look half of her ` +
        `preference vector. The voice half is not in that number; it was already spent.`
    );
  } else {
    why.push(
      `${destination.name} scored ${(destinationScore * 100).toFixed(0)} and shares no ` +
        `named facet with her answers. Worth a second look before it goes out.`
    );
  }

  if (agreements.length > 0) {
    why.push(
      `It also repudiates ${list(agreements.map((m) => m.facet.label.toLowerCase()))}, ` +
        `which she is against. Agreeing about a no counts.`
    );
  }

  const stated = positives.filter((m) =>
    vector.terms[m.facet.id]?.contributions.some(
      (c) => c.source === "stated" && c.weight > 0
    )
  );
  if (stated.length > 0) {
    why.push(
      `She asked for ${list(stated.map((m) => m.facet.label.toLowerCase()))} by name.`
    );
  }

  // "Came mostly from her cohort" has to MEAN mostly. A facet she tapped
  // herself, which her cohort also happens to carry, is hers — saying otherwise
  // tells a curator to distrust the strongest signal in the whole vector.
  const fromCohort = positives.filter((m) => {
    const contributions = vector.terms[m.facet.id]?.contributions ?? [];
    const share = (source: string) =>
      contributions
        .filter((c) => c.source === source)
        .reduce((sum, c) => sum + Math.abs(c.weight), 0);
    return share("cohort") > share("stated") + share("history");
  });
  if (fromCohort.length > 0 && vector.evidenceCount < 12) {
    why.push(
      `${list(fromCohort.map((m) => m.facet.label.toLowerCase()))} came mostly from her cohort — ` +
        `she has ${vector.evidenceCount} signal${vector.evidenceCount === 1 ? "" : "s"} of her own, ` +
        `so the prior is carrying ${(vector.blend.cohort * 100).toFixed(0)}% of the weight.`
    );
  }

  if (input.ditheredRank !== input.destinationRank) {
    why.push(
      `On merit it ranked ${ordinal(input.destinationRank)}; the shortlist is ` +
        `dithered, so it is shown ${ordinal(input.ditheredRank)}. The shuffle is on ` +
        `this list only — nothing is dithered on the way to a customer.`
    );
  }

  // ── what eliminated the others ─────────────────────────────────────
  const ruledOut = eliminated.map(
    (entry) => `${entry.destinationName} — ${entry.reason}.`
  );

  // ── which deliverable she values ───────────────────────────────────
  //
  // Its own section, because it is the only question on the quiz that says what
  // she is BUYING, and because two of its six answers cannot be satisfied by
  // choosing anything at all — they are owed follow-ups and instructions to the
  // writer, and a curator who does not see them will not do them.
  const emphasisSentences: string[] = [];
  if (emphasis.codes.length === 0) {
    emphasisSentences.push(
      `She named nothing under "what do you want more of". No slot is guaranteed ` +
        `and the writer gets no attention instruction.`
    );
  } else {
    emphasisSentences.push(...emphasis.notes);

    const placed = new Set(picks.map((pick) => pick.slot.slotCode));
    for (const slotCode of emphasis.guaranteed) {
      const planned = [...pools.values()].some(
        (pool) => pool.slot.slotCode === slotCode
      );
      if (!planned) {
        emphasisSentences.push(
          `She emphasised "${slotCode.replace(/_/g, " ")}" and a ` +
            `${occasion} has no such slot. Her answer decides what matters, never ` +
            `what exists, so nothing was invented.`
        );
      } else if (!placed.has(slotCode)) {
        emphasisSentences.push(
          `GUARANTEED AND STILL EMPTY: "${slotCode.replace(/_/g, " ")}" is the ` +
            `deliverable she asked for by name and the pool could not fill it. ` +
            `That is a required-slot work order, above.`
        );
      }
    }

    if (emphasis.needsHerMaterial) {
      emphasisSentences.push(
        application.secret && application.secret.trim().length > 0
          ? `FOLLOW-UP OWED, and there is something to work from: her free-text ` +
            `answer is below and it is the material. Nothing in the catalogue was ` +
            `selected to stand in for an inside joke, and nothing ever will be.`
          : `FOLLOW-UP OWED, and there is NOTHING to work from: she asked for an ` +
            `inside joke made real and left the free-text answer empty. Ask her ` +
            `for the joke before this goes out. The catalogue cannot supply one.`
      );
    }
  }

  // ── what the occasion decided ──────────────────────────────────────
  const forced: string[] = [];
  forced.push(
    `A ${occasion} has ${countSlots(picks)}. ${shapeSentence(shape, application)}`
  );

  for (const pick of picks) {
    if (pick.slot.guaranteed) {
      forced.push(
        `"${pick.slot.label}" was not optional here: she emphasised it, so it was ` +
          `promoted to required and paid for out of the ceiling rather than out of ` +
          `what she is building to.`
      );
    }
  }

  for (const pick of picks) {
    if (pick.forced) {
      forced.push(
        `"${pick.slot.label}" was forced: ${pick.ingredient.name} is the only ` +
          `thing in the ${pick.slot.pool} pool that fits this destination and this occasion.`
      );
    }
  }

  for (const pick of picks) {
    if (pick.slot.perGuest) {
      forced.push(
        `${pick.ingredient.name} is counted per head: ${pick.slot.quantity} of them` +
          (budget.guestsAreConfirmed
            ? `, from the top of her guest band.`
            : `, from her planning number — her band has no top, so confirm the ` +
              `count with her before anything is printed or bought.`)
      );
    }
  }

  // ── what was dropped ───────────────────────────────────────────────
  // One line per thing dropped, not one per slot it was dropped from. The
  // beam evaluates the same unaffordable item against every optional slot in a
  // repeated group, and three identical sentences read as three separate
  // events.
  const seenDrops = new Set<string>();
  const dropSentences: string[] = [];
  for (const entry of dropped) {
    const key = `${entry.ingredientName}|${entry.reason}`;
    if (seenDrops.has(key)) continue;
    seenDrops.add(key);
    dropSentences.push(`${entry.ingredientName} — ${entry.detail}`);
  }

  // ── what moved, and why ────────────────────────────────────────────
  const swapSentences = swaps.map(
    (swap) =>
      `${swap.slotLabel}: ${swap.from} → ${swap.to}. ${capitalise(swap.reason)}`
  );

  // ── the money ──────────────────────────────────────────────────────
  const money = budgetSentences(budget);

  // ── the catalogue's own problems ───────────────────────────────────
  // WORK ORDERS. Every sentence here names something the house must author,
  // and every one of them stops at the curator: what she receives is one piece
  // smaller and carries no trace of the slot.
  const gapSentences = gaps.map(
    (gap) =>
      `${gap.required ? "REQUIRED" : "Optional"} slot "${gap.slotLabel}" is unfilled. ${gap.detail}`
  );

  // ── the slots she does not have ────────────────────────────────────
  // NOT work orders, and kept out of the list above on purpose. A gap list
  // padded with things nobody can act on is a gap list nobody reads, and it is
  // the only signal telling the house what to write next.
  const excludedSentences = excluded.map((slot) => slot.detail);

  // ── the room she is actually in ────────────────────────────────────
  //
  // ONLY EVER WHAT IT REMOVED. There is deliberately no sentence here about
  // why a destination was chosen, because the venue had nothing to do with
  // that: "the destination is where she's transported to; the venue is where
  // she physically is". A line in this section explaining a destination would
  // be the first crack in the thesis, and it is the kind of line somebody adds
  // in good faith while making the page read better.
  const venueSentences: string[] = [];
  if (venue === null) {
    venueSentences.push(
      `The house could not resolve her answer to a room, so nothing was pruned ` +
        `for it. Pruning on an unknown is how a deliverable disappears for a ` +
        `reason nobody can name.`
    );
  } else {
    const removed = new Map<string, { label: string; names: string[] }>();
    for (const pool of pools.values()) {
      if (pool.prunedByVenue.length === 0) continue;
      if (removed.has(pool.slot.slotCode)) continue;
      removed.set(pool.slot.slotCode, {
        label: pool.slot.pool,
        names: [...pool.prunedByVenue],
      });
    }

    if (removed.size === 0) {
      venueSentences.push(
        `${venue.label} ruled nothing out. The destination was chosen without it ` +
          `either way — venue never touches the destination.`
      );
    } else {
      for (const [, entry] of removed) {
        venueSentences.push(
          `${venue.label} removed ${list(entry.names)} from the ${entry.label} pool. ` +
            `The destination is unchanged by it: she is still going where she is ` +
            `going, and this is the part of it that fits in the room.`
        );
      }
    }
  }

  // ── when a human must look ─────────────────────────────────────────
  const confidence: string[] = [];
  if (input.lowConfidence) {
    confidence.push(
      `Weak match overall (${(destinationScore * 100).toFixed(0)}). Mandatory review, ` +
        `whatever the sampling rate.`
    );
  }
  if (vector.evidenceCount === 0) {
    confidence.push(
      `First Revelle — nothing of her own in the profile yet, so this is her ` +
        `answers and a cohort prior and nothing else.`
    );
  }
  if (application.occasion === "other" && application.occasionOther) {
    confidence.push(
      `The occasion is her own words — "${application.occasionOther}" — and the ` +
        `slot plan is the default one. A human should read it and change the plan.`
    );
  }
  if (gaps.some((gap) => gap.required)) {
    confidence.push(
      `A required slot could not be filled. That is a catalogue gap, not a ` +
        `customer-facing error, and it is the house's problem to author out. ` +
        `It does not hold the Revelle back: she receives what there was and ` +
        `never learns the slot existed.`
    );
  }
  // The one verdict that DOES withhold, and its wording lives here rather than
  // anywhere a member-facing surface could reach. See member.ts, which refuses
  // to build a view of a blocked candidate at all.
  if (input.blocked !== null) {
    confidence.push(input.blocked);
  }

  return {
    headline,
    destination: why,
    eliminated: ruledOut,
    forced,
    dropped: dropSentences,
    swapped: swapSentences,
    budget: money,
    gaps: gapSentences,
    excluded: excludedSentences,
    emphasis: emphasisSentences,
    venue: venueSentences,
    confidence,
    secret: application.secret,
  };
}

function budgetSentences(budget: BudgetReport): string[] {
  const lines: string[] = [];

  if (budget.unbounded) {
    lines.push(
      `No ceiling exists — ${
        budget.planning === null
          ? `she said "not sure yet"`
          : `one of her bands is open-topped`
      }. Built to the register; the curator prices this by hand. Nothing was ` +
        `substituted for a middle band.`
    );
  }

  lines.push(
    `${formatCents(budget.totalCents)} of pooled ingredients` +
      (budget.totalPerHeadCents !== null
        ? `, ${formatCents(budget.totalPerHeadCents)} a head`
        : "") +
      (budget.planning !== null
        ? ` against ${formatDollars(budget.planning)} planned`
        : "") +
      (budget.ceiling !== null
        ? ` and a ${formatDollars(budget.ceiling)} ceiling.`
        : ".")
  );

  if (budget.overage !== null && budget.overage > 0) {
    lines.push(
      `OVER by ${formatDollars(budget.overage)}` +
        (budget.overagePerHead !== null
          ? ` — ${formatDollars(budget.overagePerHead)} a head`
          : "") +
        `. This is the closest complete candidate; the required slots could not ` +
        `be filled for less.`
    );
  }

  if (budget.unpricedItems.length > 0) {
    lines.push(
      `Not counted, because nobody has priced ${
        budget.unpricedItems.length === 1 ? "it" : "them"
      } yet: ${list(budget.unpricedItems)}.`
    );
  }

  return lines;
}

function shapeSentence(shape: OccasionShape, application: Application): string {
  if (application.occasion === "other") {
    return `Shape unknown until someone reads her words, so it is planned as one evening.`;
  }
  return shape.note;
}

function countSlots(picks: readonly Pick[]): string {
  const bySlot = new Map<string, number>();
  for (const pick of picks) {
    bySlot.set(pick.slot.slotCode, (bySlot.get(pick.slot.slotCode) ?? 0) + 1);
  }
  const parts = [...bySlot.entries()].map(([code, n]) =>
    n === 1 ? code.replace(/_/g, " ") : `${n} × ${code.replace(/_/g, " ")}`
  );
  return list(parts);
}

function list(words: readonly string[]): string {
  if (words.length === 0) return "nothing";
  if (words.length === 1) return words[0];
  return `${words.slice(0, -1).join(", ")} and ${words[words.length - 1]}`;
}

function ordinal(n: number): string {
  const suffix =
    n % 100 >= 11 && n % 100 <= 13
      ? "th"
      : n % 10 === 1
        ? "st"
        : n % 10 === 2
          ? "nd"
          : n % 10 === 3
            ? "rd"
            : "th";
  return `${n}${suffix}`;
}

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatDollars(amount: number): string {
  return `$${amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}
