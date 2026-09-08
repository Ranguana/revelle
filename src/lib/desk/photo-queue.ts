/**
 * THE ORDER THE DESK READS APPLICATIONS IN.
 *
 * Framework-free, like src/lib/photo-extract.ts and for the same reason: this
 * is the sort, and a sort that lives inside a page component is a sort no test
 * can drive. src/lib/desk/photos.ts does the SQL and calls this; the screen
 * renders whatever comes back.
 *
 * ── THE FOUNDER'S ORDER, AND WHAT EACH BAND IS FOR ───────────────────
 *
 * "Sorted: conflicts, then `place_she_has` with a venue cue, then fingerprint
 * attempts, then ordinary proposals, then objects."
 *
 *   1 CONFLICT     two accepted claims disagree about one column. The set is
 *                  silent on that column until somebody resolves it, and the
 *                  resolution is a QUESTION TO HER rather than a vote.
 *
 *   2 HER PLACE    a `place_she_has` frame carrying a venue cue. The most
 *                  consequential row on the screen: this is the only kind of
 *                  photograph that can ever reach feasibility, and the founder
 *                  called setting the role "the dangerous one".
 *
 *   3 FINGERPRINT  the model tried to propose `arrival`, `ending` or `starts`.
 *                  The claim was refused three times over — it is not in the
 *                  tool enum, `extractFrom` drops it, and db/064 would refuse
 *                  the row — so nothing is at risk. It is HIGH in the queue
 *                  anyway, because a reader reaching for a fingerprint column
 *                  is evidence about the prompt, and a guard whose catches
 *                  nobody ever reads is a guard nobody is checking (rule 24).
 *
 *   4 PROPOSALS    ordinary open work: claims nobody has decided.
 *
 *   5 OBJECTS      an application whose photographs only name things. Nothing
 *                  here proposes a cell, so it is last.
 *
 *   6 SETTLED      no open claim, no conflict, nothing waiting. It stays on
 *                  the screen saying so rather than vanishing into a filter —
 *                  a queue that hides finished work is a queue nobody can
 *                  check a decision in.
 *
 * ── THIS SORT IS NOT STABLE UNDER REVIEW, AND THAT IS WHY THERE IS NO
 *    NEXT BUTTON ───────────────────────────────────────────────────────
 *
 * CLAUDE.md rule 18, read the way it asks to be read. Accepting a second
 * contradicting claim CREATES a conflict, which moves an application to the
 * top of the list; striking the last open claim moves it to the bottom. So the
 * ordering genuinely reshuffles under a review pass, and rule 18 is explicit
 * that such a screen may not host a Next button: "excluding such a screen is
 * the correct reading, not a gap to be closed later".
 *
 * What rule 18 forbids is applying a correction TO A DIFFERENT ROW, and that
 * is prevented by the shape of the actions rather than by the sort: every
 * keep and every strike carries the claim's own id, so the target of the
 * gesture is named and cannot be inherited by whatever moved into that
 * position. There is no "approve all" — the founder's reason is that "a bulk
 * keep on seven pictures is how `arrival: assigned` sneaks in" — and there is
 * no per-application accept either, for the same reason at a smaller scale.
 */

import {
  MATRIX_FACETS,
  NEVER_FROM_A_PHOTO,
  mayPropose,
  type Dropped,
  type MatrixFacet,
  type ObjectCue,
  type PaletteSwatch,
  type PhotoRole,
  type ProposalStatus,
  type SetFacet,
  type StatedCell,
  type ToneCue,
  type VenueCue,
  mergeSet,
} from "../photo-extract.ts";

/* ══ 1 · WHAT A ROW HOLDS ═══════════════════════════════════════════ */

/** One reading, as the desk needs it. */
export type QueueExtract = {
  id: string;
  version: string;
  model: string;
  role: PhotoRole | null;
  mayPrune: boolean;
  outcome: "read" | "silent";
  silence: string | null;
  palette: readonly PaletteSwatch[];
  venue: readonly VenueCue[];
  tone: readonly ToneCue[];
  objects: readonly ObjectCue[];
  dropped: readonly Dropped[];
  readAt: string;
};

export type QueuePhoto = {
  id: string;
  ordinal: number;
  filename: string;
  role: PhotoRole | null;
  /** The newest reading, or null when nothing has read it yet. */
  extract: QueueExtract | null;
};

export type QueueClaim = {
  id: string;
  photoId: string;
  facet: MatrixFacet;
  level: string;
  evidence: string;
  status: ProposalStatus;
  /** Set when SHE struck it. The desk cannot undo this one. */
  memberStruck: boolean;
  /** Audit only. NEVER rendered — it makes people rubber-stamp 0.91. */
  confidence: number;
};

/** Her night, in the codes she actually answered in. */
export type NightCodes = {
  occasion: string;
  environment: string;
  budget: string;
  /** Feeds `ending`. */
  howItEnds: string | null;
  /** Feeds `starts`. */
  mealTime: string | null;
  tasteDirections: readonly string[];
  groupFun: readonly string[];
  antiPreferences: readonly string[];
};

export type QueueApplication = {
  id: string;
  email: string;
  createdAt: string;
  night: NightCodes;
  photos: readonly QueuePhoto[];
  claims: readonly QueueClaim[];
};

/* ══ 2 · THE BANDS ══════════════════════════════════════════════════ */

export const QUEUE_BANDS = [
  "conflict",
  "her_place",
  "fingerprint",
  "proposals",
  "objects",
  "settled",
] as const;
export type QueueBand = (typeof QUEUE_BANDS)[number];

/** What the badge says, and it says WHY rather than naming the band. */
export const BAND_SAID: Readonly<Record<QueueBand, string>> = {
  conflict: "Two kept claims disagree. The column is silent until she is asked.",
  her_place: "A picture of her own place, carrying what it can physically do.",
  fingerprint:
    "The reader reached for a column a photograph may never propose. It was " +
    "refused; this is here so the refusal gets read.",
  proposals: "Claims nobody has decided.",
  objects: "Things she would like. Nothing here proposes a cell.",
  settled: "Nothing open.",
};

export type Ranked = {
  application: QueueApplication;
  band: QueueBand;
  /** The merged set — computed, never stored (the founder: "the set is a view"). */
  set: ReturnType<typeof mergeSet>;
  /** Fingerprint columns the reader reached for, if any. */
  reachedFor: readonly string[];
};

/**
 * Which band one application is in.
 *
 * First match wins, in the founder's order. The bands are deliberately not
 * scores that add up: an application with a conflict AND a venue cue is a
 * conflict, because the conflict is what somebody has to do something about.
 */
export function bandOf(application: QueueApplication): Ranked {
  const set = mergeSet(
    application.id,
    application.photos
      .map((photo) => photo.extract)
      .filter((extract): extract is QueueExtract => extract !== null)
      .map((extract) => ({
        version: extract.version,
        model: extract.model,
        role: extract.role,
        mayPrune: extract.mayPrune,
        outcome: extract.outcome,
        silence: extract.silence,
        facets: [],
        venue: extract.venue,
        tone: extract.tone,
        // The queue reads the facet side only — `mergeSet` merges cells and
        // nothing else — so the payloads it does not consult are passed empty
        // rather than plumbed through a type that has never carried them.
        table: [],
        objects: extract.objects,
        palette: extract.palette,
      })),
    application.claims.map((claim) => ({
      facet: claim.facet,
      level: claim.level,
      status: claim.status,
    }))
  );

  const reachedFor = [
    ...new Set(
      application.photos
        .flatMap((photo) => photo.extract?.dropped ?? [])
        .filter((drop) => drop.kind === "fingerprint")
        .map((drop) => drop.facet ?? "")
        .filter((facet) => facet !== "")
    ),
  ].sort();

  const band = ((): QueueBand => {
    if (set.conflicts.length > 0) return "conflict";
    if (
      application.photos.some(
        (photo) =>
          photo.role === "place_she_has" && (photo.extract?.venue.length ?? 0) > 0
      )
    ) {
      return "her_place";
    }
    if (reachedFor.length > 0) return "fingerprint";
    if (application.claims.some((claim) => claim.status === "proposed")) {
      return "proposals";
    }
    if (
      application.photos.some((photo) => (photo.extract?.objects.length ?? 0) > 0)
    ) {
      return "objects";
    }
    return "settled";
  })();

  return { application, band, set, reachedFor };
}

/**
 * The queue, in the founder's order.
 *
 * The secondary sort is the application's own age, oldest first, and it never
 * moves. Two applications in the same band therefore keep their relative
 * position across every act on this screen, which is as much of rule 18 as a
 * band-ordered list can honestly offer.
 */
export function sortQueue(
  applications: readonly QueueApplication[]
): Ranked[] {
  return applications
    .map(bandOf)
    .sort(
      (a, b) =>
        QUEUE_BANDS.indexOf(a.band) - QUEUE_BANDS.indexOf(b.band) ||
        (a.application.createdAt < b.application.createdAt ? -1 : 1)
    );
}

/* ══ 3 · WHAT THE COLUMNS SAY ═══════════════════════════════════════ */

/**
 * The three matrix columns a photograph may never reach, with the reason,
 * for the review screen's footer.
 *
 * Rendered rather than left implicit, because "why is `starts` not on this
 * list" is the question a curator will have on her second day, and the answer
 * being visible is what stops somebody adding it (rule 23: state the fact at
 * every place the wrong reading would be made).
 */
export function refusedColumns(): readonly { facet: string; why: string }[] {
  return MATRIX_FACETS.filter((facet) => !mayPropose(facet)).map((facet) => ({
    facet,
    why: NEVER_FROM_A_PHOTO[facet] ?? "",
  }));
}

/**
 * Which facets a set states, as a flat list for the summary line.
 *
 * Only `stated` counts. A pending claim states nothing and a conflict states
 * nothing; both are visible on the screen as themselves.
 */
export function statedCells(
  facets: readonly SetFacet[]
): readonly { facet: string; level: string }[] {
  return facets
    .filter((entry): entry is StatedCell => entry.state === "stated")
    .map((entry) => ({ facet: entry.facet, level: entry.level }));
}
