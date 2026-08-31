/**
 * THE COPY RECONCILIATION PASS — what the desk knows before she clicks.
 *
 * ── THE PROBLEM, IN ONE PARAGRAPH ────────────────────────────────────
 *
 * `/api/health` reports `copyAgrees: false` and names twelve rooms whose
 * `world.name`, `world.tagline` or `world.description` differs from
 * `src/lib/destinations.ts`. It is right, it has been right every day since it
 * landed, and it will go on being right forever, because the seeder never
 * overwrites a row that exists and nothing else reconciles the two. A tripwire
 * that has been amber since it was installed is not a tripwire. db/055 gives
 * the pass a place to record a verdict; this module is everything the screen
 * has to know to put one in front of a person.
 *
 * ── WHAT THIS MODULE WILL NOT DO ─────────────────────────────────────
 *
 * IT NEVER PICKS A SIDE. Not a default, not a pre-selection, not a
 * recommendation, not for the rows whose provenance is weakest. Every function
 * below either CLASSIFIES (which pile is this in) or DESCRIBES A RELATION
 * (which of these two dates is earlier). The moment one of them returns
 * something shaped like an answer, the screen stops being an instrument and
 * starts being a ruling with a confirm button on it — and the whole reason the
 * pass exists is that this copy is the founder's to decide.
 *
 * The temptation is real and it is strongest exactly where the evidence is
 * strongest: a room nobody has ever opened, whose registry text was rewritten
 * last week, is a row where "registry wins" is nearly certain. Nearly certain
 * is not the same as decided, and the cost of being wrong is a member reading
 * a sentence nobody chose.
 *
 * ── DATABASE-FREE AND FRAMEWORK-FREE, LIKE ./drift.ts ────────────────
 *
 * Pure functions over values the caller has already fetched. The SQL stays in
 * the page, the comparison stays testable, and the classification can be
 * driven from a test with hand-built evidence — which matters more here than
 * usual, because the database this runs against is unreachable from any
 * laptop (rule 9) and the only way to see these functions work before they
 * meet production is to call them.
 */

import { copyDrift, type ProseDrift } from "@/lib/desk/drift";
import { registryDate, type RegistryDateReading } from "@/lib/desk/registry-dates";

/* ── the vocabulary ─────────────────────────────────────────────────── */

/** The three verdicts db/055 accepts. Exported so the action and the screen
 *  cannot each spell them for themselves. */
export const VERDICTS = ["registry", "database", "merge"] as const;
export type Verdict = (typeof VERDICTS)[number];

export function isVerdict(value: string): value is Verdict {
  return (VERDICTS as readonly string[]).includes(value);
}

/** db/055's `provenance` values, and the same warning its column comment carries. */
export type Provenance = "curator_edit" | "stale_seed" | "indeterminate";

/* ── the ledger, as evidence ────────────────────────────────────────── */

/**
 * One `destination.updated` row, reduced to what provenance needs.
 *
 * `copyChanged` is `detail.copy_changed` — the list of copy fields that save
 * actually altered. It is NULL, not empty, for every row written before
 * `saveDestination` started recording it: an empty array is the positive claim
 * "this save changed no copy", and a row that could not have made that claim
 * must not appear to.
 */
export type DeskEdit = {
  /** ISO 8601. `staff_action.created_at`. */
  at: string;
  copyChanged: readonly string[] | null;
};

/**
 * WHERE THE DATABASE COPY CAME FROM — and how far the ledger can actually see.
 *
 * ── THE MECHANISM ───────────────────────────────────────────────────
 *
 * Exactly one path in this codebase writes `world.name`, `world.tagline` or
 * `world.description` AND records a `staff_action`: `saveDestination` in
 * src/app/desk/(signed-in)/destinations/actions.ts. Every other writer is a
 * script or a migration — `scripts/seed-destinations.mjs` (the create, and the
 * stub completion), `scripts/catalogue-vocabulary.mjs` (the stub itself),
 * `scripts/seed-fixtures.mjs` (bench rows, never in the deploy chain) — and
 * not one of them writes a ledger row, because `recordAction` needs a signed-in
 * staff member and a script has none. Checked across every `update world` and
 * `insert into world` in src/, scripts/ and db/ before this module was written.
 *
 * So a `destination.updated` row means A HUMAN CHOSE THIS. No such row means
 * the copy was only ever seeded.
 *
 * ── AND THE LIMIT, WHICH IS NOT A DETAIL ────────────────────────────
 *
 * `saveDestination` fires on EVERY save of the destination form. A palette
 * tweak, an occasion tick, a note — all of them write `destination.updated`.
 * So the ledger's older rows prove a human touched the ROOM. They do not prove
 * she touched the TAGLINE, and reading them as if they did is precisely the
 * misreading rule 23 is about: the field is not broken, it answers a different
 * question than it appears to.
 *
 * That is why `fieldExact` exists and why the screen prints it. From db/055
 * forward `saveDestination` writes `detail.copy_changed`, so new rows CAN
 * answer the field-level question — including in the negative, which is the
 * useful direction: if every edit on a room carries `copy_changed` and none of
 * them names this field, then a human has saved this room and provably never
 * touched this sentence, and the field belongs in the stale-seed pile.
 *
 * ── THREE VALUES, NEVER TWO ─────────────────────────────────────────
 *
 * `indeterminate` is not decoration. If the ledger cannot be read, the answer
 * is not "nobody edited it" — that is the absence-as-evidence failure rule 3
 * exists to refuse, and here it would push a room into the pile where the
 * registry wins near-automatically on the strength of a failed query.
 */
export type ProvenanceReading = {
  provenance: Provenance;
  /** True when the ledger can speak about THIS FIELD and not merely this room. */
  fieldExact: boolean;
  /** Newest desk save of this room. Null when there has never been one. */
  editedAt: string | null;
  /** Newest save that names this field in `copy_changed`. Null when none does. */
  fieldEditedAt: string | null;
  /** How many desk saves this room has had. */
  edits: number;
  /** Said on screen, every time. A pile with no stated basis is a guess. */
  why: string;
};

export function provenanceOf(
  field: string,
  edits: readonly DeskEdit[],
  /** False when the `staff_action` read failed. Absence must not read as proof. */
  ledgerReadable = true
): ProvenanceReading {
  const newest = (rows: readonly DeskEdit[]): string | null =>
    rows.length === 0
      ? null
      : rows.reduce((latest, row) => (row.at > latest ? row.at : latest), rows[0].at);

  if (!ledgerReadable) {
    return {
      provenance: "indeterminate",
      fieldExact: false,
      editedAt: null,
      fieldEditedAt: null,
      edits: 0,
      why:
        "The action ledger could not be read, so neither pile is claimable. " +
        "An unreadable ledger is not evidence that nobody edited this — " +
        "treating it as such would put the room in the pile where the " +
        "registry wins on the strength of a failed query.",
    };
  }

  const editedAt = newest(edits);

  if (edits.length === 0) {
    return {
      provenance: "stale_seed",
      fieldExact: true,
      editedAt: null,
      fieldEditedAt: null,
      edits: 0,
      why:
        "No `destination.updated` in the ledger: nobody has ever saved this " +
        "room at the desk. The database copy is what the seeder wrote when it " +
        "created the row, and the registry has been rewritten since.",
    };
  }

  const naming = edits.filter((edit) => edit.copyChanged?.includes(field));
  if (naming.length > 0) {
    return {
      provenance: "curator_edit",
      fieldExact: true,
      editedAt,
      fieldEditedAt: newest(naming),
      edits: edits.length,
      why:
        `A desk save recorded this field in \`copy_changed\`. Somebody ` +
        `changed this ${field} deliberately, in the tool.`,
    };
  }

  // Every save says what copy it touched, and none of them says this field.
  // NEGATIVE EVIDENCE THAT IS ACTUALLY POSITIVE: a human has been in this room
  // and provably left this sentence alone, so the sentence is still the
  // seeder's. This is the only branch where a room somebody has edited belongs
  // in the stale-seed pile, and it is only reachable for saves made after
  // db/055 taught saveDestination to record the field list.
  const everySaveSpeaks = edits.every((edit) => edit.copyChanged !== null);
  if (everySaveSpeaks) {
    return {
      provenance: "stale_seed",
      fieldExact: true,
      editedAt,
      fieldEditedAt: null,
      edits: edits.length,
      why:
        `This room has been saved at the desk ${edits.length} ` +
        `time${edits.length === 1 ? "" : "s"}, and every one of those saves ` +
        `recorded which copy it changed. None of them names the ${field}, so ` +
        `this sentence is still the one the seeder wrote.`,
    };
  }

  return {
    provenance: "curator_edit",
    fieldExact: false,
    editedAt,
    fieldEditedAt: null,
    edits: edits.length,
    why:
      `This room has been saved at the desk ${edits.length} ` +
      `time${edits.length === 1 ? "" : "s"}. THE LEDGER CANNOT SAY WHETHER ` +
      `THIS FIELD WAS ONE OF THEM — those saves predate the desk recording ` +
      `which copy fields a save changed, and \`destination.updated\` fires on ` +
      `any save of the form, including one that only moved a colour.`,
  };
}

/* ── the timeline ───────────────────────────────────────────────────── */

/**
 * WHICH CAME FIRST: THE DESK EDIT, OR THE REGISTRY SENTENCE IT DISAGREES WITH.
 *
 * Founder, 2026-08-31, and this whole section is her requirement:
 *
 *   "'database wins' is not a live option even if a staff_action row exists,
 *    because any desk edit predates corrections you made deliberately and
 *    later. The pass should surface the dates — staff_action timestamp beside
 *    the registry file's last-authored commit — so the verdict screen shows
 *    not just who chose the database copy but when relative to the registry's
 *    supersession. A human choice from before the correction cycle is a stale
 *    choice; the no-preselection rule stands, but the timeline belongs in
 *    front of you when you click."
 *
 * Note what she asked for and what she did not. THE STALE CHOICE IS A STATE
 * THIS FUNCTION NAMES. It is not a state this function acts on, and there is
 * no branch below that returns a verdict, weights one, or orders the buttons.
 * "The no-preselection rule stands" is the sentence that decides the shape of
 * the return type: five states, all of them descriptions, none of them a
 * recommendation.
 *
 * `undatable` and `no_edit` are separate for rule 16's reason. A blank where a
 * date should be reads as "no edit" to every reader, and the two are opposite
 * facts: one says nobody chose this, the other says somebody did and we cannot
 * say when.
 */
export type TimelineState =
  /** No desk save has ever touched this room. Nothing to place in time. */
  | { state: "no_edit" }
  /** The desk edit is OLDER than the registry sentence. The stale choice. */
  | { state: "edit_precedes_registry"; editedAt: string; registryAt: string }
  /** The desk edit came after. Somebody saw this registry text and kept hers. */
  | { state: "edit_follows_registry"; editedAt: string; registryAt: string }
  /** Both dates exist and neither is usefully before the other. */
  | { state: "same_day"; editedAt: string; registryAt: string }
  /** One of the two dates could not be established. Said, never blank. */
  | { state: "undatable"; editedAt: string | null; why: string };

/**
 * The registry side comes from `registryDate`, which has its own three states
 * — dated, stale, unknown — and NONE of them is silently folded into a date
 * here. A `stale` reading means the generated dates were computed against a
 * sentence the registry no longer holds, so the date is real and belongs to
 * text nobody is looking at; putting it on the screen would be the most
 * convincing failure this system produces (rule 20).
 */
export function timelineOf(
  provenance: ProvenanceReading,
  registry: RegistryDateReading
): TimelineState {
  // The field-exact date when there is one: it is the moment somebody touched
  // THIS sentence, which is the comparison the founder asked for. Otherwise
  // the room-level date, which overstates — and the screen says it overstates,
  // because `fieldExact` travels beside it.
  const editedAt = provenance.fieldEditedAt ?? provenance.editedAt;

  if (editedAt === null) {
    return registry.state === "unknown" || registry.state === "stale"
      ? {
          state: "undatable",
          editedAt: null,
          why: registryWhy(registry),
        }
      : { state: "no_edit" };
  }

  if (registry.state !== "dated") {
    return { state: "undatable", editedAt, why: registryWhy(registry) };
  }

  const registryAt = registry.at.authoredAt;
  const edit = Date.parse(editedAt);
  const written = Date.parse(registryAt);
  if (!Number.isFinite(edit) || !Number.isFinite(written)) {
    return {
      state: "undatable",
      editedAt,
      why:
        "One of the two timestamps is not a date this desk can read, so they " +
        "cannot be put in order.",
    };
  }

  // A day, because the resolution of the question is a day. Two changes inside
  // one afternoon are not "before" and "after" in the sense she is asking
  // about — the point of the comparison is whether a correction cycle has
  // happened in between, and a correction cycle takes longer than lunch.
  const DAY = 24 * 60 * 60 * 1000;
  if (Math.abs(edit - written) < DAY) {
    return { state: "same_day", editedAt, registryAt };
  }
  return edit < written
    ? { state: "edit_precedes_registry", editedAt, registryAt }
    : { state: "edit_follows_registry", editedAt, registryAt };
}

function registryWhy(registry: RegistryDateReading): string {
  if (registry.state === "stale") {
    return (
      "The registry sentence has been rewritten since src/lib/desk/" +
      "registry-dates.ts was generated, so the date on file belongs to text " +
      "nobody is looking at. Run `npm run gen:registry-dates`. Until then " +
      "there is no honest date for this field, and a wrong one under your " +
      "cursor is worse than none."
    );
  }
  if (registry.state === "unknown") return registry.why;
  return "";
}

/* ── the baseline ───────────────────────────────────────────────────── */

/** A row of `copy_reconciliation_current`, as the page selects it. */
export type ReconciliationRecord = {
  id: string;
  field: string;
  verdict: string;
  registry_value: string;
  database_value: string;
  chosen_value: string;
  provenance: string;
  note: string;
  decided_at: string;
  decided_by_email: string | null;
};

/**
 * HAS THIS FIELD BEEN SETTLED, AND DOES THE SETTLEMENT STILL HOLD.
 *
 * The three states db/055 was designed around, and the reason the detector can
 * start from zero: a difference that survives a verdict is a DECIDED
 * difference, and it must be distinguishable from nobody having looked.
 *
 * THE DATABASE SIDE OF THE COMPARISON IS `chosen_value`, NOT `database_value`.
 * db/055 argues it at length under WHICH COLUMN IS THE BASELINE; the short
 * version is that a registry verdict and a merge both REWRITE the row, so
 * `database_value` is superseded the instant they land, and comparing against
 * it would report every merged field as drifted-again one second after it was
 * settled — a detector going amber because it worked.
 */
export type Settlement =
  | { state: "never" }
  | { state: "settled"; record: ReconciliationRecord }
  | { state: "drifted_again"; record: ReconciliationRecord; moved: string[] };

export function settlementOf(
  record: ReconciliationRecord | null,
  registryNow: string,
  databaseNow: string
): Settlement {
  if (!record) return { state: "never" };
  const moved: string[] = [];
  if (record.registry_value !== registryNow) moved.push("the registry");
  if (record.chosen_value !== databaseNow) moved.push("the database");
  return moved.length === 0
    ? { state: "settled", record }
    : { state: "drifted_again", record, moved };
}

/* ── what the detector is allowed to call clear ─────────────────────── */

/** One field of one room, as the pass sees it. */
export type PendingField = {
  slug: string;
  field: string;
  settlement: Settlement;
};

/**
 * The rooms and fields still waiting on a person: drifting, and either never
 * reconciled or reconciled against text that has since moved.
 *
 * This is the number `/api/health` reports as `copyUnsettled`, and it is the
 * one that has to reach zero. `copyDrift` cannot: a `database wins` verdict
 * leaves the file and the row disagreeing forever, on purpose, and a detector
 * that demanded THAT reach zero would be demanding the founder's decision be
 * reversed to make a light go green.
 */
export function unsettled(fields: readonly PendingField[]): string[] {
  const byRoom = new Map<string, string[]>();
  for (const item of fields) {
    if (item.settlement.state === "settled") continue;
    const list = byRoom.get(item.slug) ?? [];
    list.push(
      item.settlement.state === "drifted_again"
        ? `${item.field} (drifted again since it was settled)`
        : item.field
    );
    byRoom.set(item.slug, list);
  }
  return [...byRoom.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([slug, list]) => `${slug} (${list.join(", ")})`);
}

/* ── the verdict a form submitted ───────────────────────────────────── */

export type VerdictDraft =
  | { error: string; value: null }
  | {
      error: null;
      value: { verdict: Verdict; chosenValue: string; note: string };
    };

/**
 * A posted verdict, checked before any query runs.
 *
 * The same shape and the same reasoning as `retirementFrom`: refuse in words a
 * curator can act on, here, and leave to the database the refusals only it can
 * make. db/055's CHECK constraints are the backstop and they say the same
 * things — `copy_reconciliation_chose_what_it_says` would refuse a registry
 * verdict that wrote something else — but a constraint violation is not a
 * sentence anybody wants to read on a screen.
 *
 * NOTHING IS DEFAULTED. There is no fallback verdict, no "if nothing was
 * ticked assume the registry", no empty-merge-means-keep-the-database. A form
 * that arrives without a verdict is refused by name, because the alternative
 * is a click that quietly did something other than what it looked like.
 */
export function verdictFrom(
  verdict: string,
  registryValue: string,
  databaseValue: string,
  merged: string,
  note: string
): VerdictDraft {
  if (!isVerdict(verdict)) {
    return {
      error:
        "Nothing was recorded. That is not one of the three verdicts this " +
        "desk knows — the registry's words, the database's words, or a merge " +
        "you type yourself.",
      value: null,
    };
  }

  if (registryValue === databaseValue) {
    return {
      error:
        "Nothing was recorded. These two say the same thing now, so there is " +
        "nothing to settle — somebody else reconciled this field, or the copy " +
        "moved, between this page loading and the button being pressed.",
      value: null,
    };
  }

  if (verdict === "merge") {
    const said = merged.replace(/\r\n/g, "\n").trim();
    if (said.length === 0) {
      return {
        error:
          "Nothing was recorded. A merge is the sentence you type; an empty " +
          "one would put blank copy in front of a member, which is the only " +
          "thing on this screen that cannot be taken back by another click.",
        value: null,
      };
    }
    return { error: null, value: { verdict, chosenValue: said, note: note.trim() } };
  }

  return {
    error: null,
    value: {
      verdict,
      chosenValue: verdict === "registry" ? registryValue : databaseValue,
      note: note.trim(),
    },
  };
}

/* ── assembling one row of the screen ───────────────────────────────── */

/** Everything the page has fetched about one room, before it is sorted. */
export type RoomCopy = {
  worldId: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  edits: readonly DeskEdit[];
};

/** One drifting field, with all three facts attached. Nothing decided. */
export type ReconcileRow = {
  worldId: string;
  slug: string;
  /** The room's name as the DATABASE has it — this screen shows the live desk. */
  roomName: string;
  field: string;
  label: string;
  /** Where the live half lives. `premise` is `world.description`. */
  where: string;
  registry: string;
  database: string;
  provenance: ProvenanceReading;
  timeline: TimelineState;
  settlement: Settlement;
};

/**
 * Every drifting field of every room handed in, with its evidence.
 *
 * The drift half is `copyDrift` and is not recomputed here — rule 21, and the
 * specific failure it prevents is a field this module calls drifted while
 * /api/health calls it clean, which could never be reconciled because it would
 * never appear on the screen that reconciles it.
 *
 * SORTED, STABLY, AND NOT BY ANYTHING THE ACT CHANGES. Rule 18: the target of
 * a correction does not move between the mistake and the fix. Pile, then slug,
 * then the file's own field order — none of which a verdict alters, so a row
 * decided by mistake is still exactly where it was when the page comes back.
 */
export function reconcileRows(
  rooms: readonly RoomCopy[],
  current: ReadonlyMap<string, ReconciliationRecord>,
  ledgerReadable = true
): ReconcileRow[] {
  const rows: ReconcileRow[] = [];

  for (const room of rooms) {
    const drift: ProseDrift[] = copyDrift({
      slug: room.slug,
      name: room.name,
      tagline: room.tagline,
      description: room.description,
    });
    for (const item of drift) {
      const provenance = provenanceOf(item.key, room.edits, ledgerReadable);
      rows.push({
        worldId: room.worldId,
        slug: room.slug,
        roomName: room.name,
        field: item.key,
        label: item.label,
        where: item.where,
        registry: item.file,
        database: item.live,
        provenance,
        timeline: timelineOf(provenance, registryDate(room.slug, item.key)),
        settlement: settlementOf(
          current.get(`${room.worldId}:${item.key}`) ?? null,
          item.file,
          item.live
        ),
      });
    }
  }

  return rows.sort(
    (a, b) =>
      PILE_ORDER[pileOf(a)] - PILE_ORDER[pileOf(b)] ||
      a.slug.localeCompare(b.slug) ||
      FIELD_ORDER.indexOf(a.field) - FIELD_ORDER.indexOf(b.field)
  );
}

/** The registry's own order, so a room reads name, tagline, premise. */
const FIELD_ORDER = ["name", "tagline", "premise"];

/**
 * The two piles the founder asked the screen to be sorted into, plus the one
 * she did not ask for because it should not exist and sometimes will.
 *
 * A PILE IS NOT A VERDICT. It says how much evidence there is about where the
 * database copy came from, which decides how long she should spend on the row
 * — not which way it goes.
 */
export type Pile = "stale_seed" | "curator_edit" | "indeterminate";

export function pileOf(row: ReconcileRow): Pile {
  return row.provenance.provenance;
}

const PILE_ORDER: Record<Pile, number> = {
  // The quick pile first: these are the rows where the evidence is one
  // sentence long, and clearing them leaves the screen showing only what
  // actually needs her eye.
  stale_seed: 0,
  curator_edit: 1,
  // Last, and never silently merged into either: a row here is a row whose
  // evidence failed to load, and it must not sit in a pile that implies a fact.
  indeterminate: 2,
};

export const PILE_LABEL: Record<Pile, string> = {
  stale_seed: "Only ever seeded",
  curator_edit: "Somebody chose this at the desk",
  indeterminate: "Provenance could not be established",
};
