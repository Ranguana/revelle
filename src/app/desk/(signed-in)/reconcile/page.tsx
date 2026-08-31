import Link from "next/link";

import { query } from "@/lib/db";
import { stamp } from "@/lib/desk/labels";
import {
  PILE_LABEL,
  pileOf,
  reconcileRows,
  unsettled,
  type Pile,
  type ProvenanceReading,
  type ReconcileRow,
  type ReconciliationRecord,
  type RoomCopy,
  type Settlement,
  type TimelineState,
} from "@/lib/desk/reconcile";

import styles from "../../desk.module.css";
import { Empty, Head, Seam } from "../bits";
import { recordVerdict } from "./actions";

/**
 * AGAINST THE FILE, WITH A VERDICT.
 *
 * ── WHY THIS SCREEN AND NOT THE DRIFT PANEL THAT ALREADY EXISTS ─────
 *
 * `/desk/destinations/[id]` already shows one room's drift, in two panes, with
 * the sentence that says neither side is wrong. That panel is right and it
 * stays. What it cannot do is END anything: it has no button by design — "the
 * moment there is a 'make the file match' or a 'make the database match' here,
 * this stops being a report and becomes the overwrite the seeder spent its
 * whole header refusing to do."
 *
 * That refusal was correct for a SCRIPT. It is not an argument against a
 * PERSON. `/api/health` has reported `copyAgrees: false` every day since the
 * detector landed, naming the same twelve rooms, and the only thing anybody
 * could do about it was read it again. A tripwire that has been amber since it
 * was installed is not a tripwire — it is furniture. This is the screen where
 * a person ends it, one field at a time, with the record of what she decided
 * kept where the next run of the detector can read it (db/055).
 *
 * ── NOTHING HERE IS PRE-SELECTED ────────────────────────────────────
 *
 * No radio starts checked. No button is styled as the obvious one. No row is
 * decided in advance, not even the ones in the pile where the answer is nearly
 * certain — a room nobody has ever opened whose registry text was rewritten
 * last week is a strong case and it is still not a decided one, and the cost
 * of being wrong is a member reading a sentence nobody chose.
 *
 * What the screen does instead is put THREE FACTS in front of her: the two
 * texts, where the database's text came from, and when each side was written
 * relative to the other. Then it gets out of the way.
 *
 * ── THE ROWS DO NOT MOVE ────────────────────────────────────────────
 *
 * Rule 18. The sort is pile, then slug, then the registry's own field order —
 * and a verdict changes none of the three, so a row decided by mistake is
 * exactly where it was when the page comes back, with the correction (another
 * verdict) sitting in the same place. A decided row STAYS ON THE SCREEN
 * showing what was decided; it does not vanish into a filter, because the
 * first thing anybody wants after a click is to see what the click did.
 */

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  /** [{ at, copy_changed }] from json_agg. Typed loosely; read defensively. */
  edits: unknown;
};

export default async function ReconcilePage({
  searchParams,
}: PageProps<"/desk/reconcile">) {
  const params = await searchParams;
  const refused = one(params.refused);
  const settled = one(params.settled);

  const [rooms, decisions] = await Promise.all([
    // Retired rooms are out, on both sides and for the health route's reason:
    // a retired room is deliberately absent from the working set, so its copy
    // is not a sentence anybody is being sent.
    query<Row>(
      `select w.id::text as id, w.slug::text as slug,
              w.name, w.tagline, w.description,
              (select coalesce(
                        json_agg(json_build_object(
                          'at', a.created_at,
                          'copy_changed',
                          case when a.detail ? 'copy_changed'
                               then a.detail->'copy_changed'
                               else null end)
                        order by a.created_at desc),
                        '[]'::json)
                 from staff_action a
                where a.entity_table = 'world'
                  and a.entity_id = w.id
                  and a.action = 'destination.updated') as edits
         from world w
        where w.status <> 'retired'
        order by w.slug`
    ),
    query<ReconciliationRecord & { world_id: string }>(
      `select c.id::text as id, c.world_id::text as world_id, c.field,
              c.verdict, c.registry_value, c.database_value, c.chosen_value,
              c.provenance, c.note, c.decided_at,
              s.email::text as decided_by_email
         from copy_reconciliation_current c
         left join staff s on s.id = c.decided_by`
    ),
  ]);

  const current = new Map(
    decisions.map((row) => [`${row.world_id}:${row.field}`, row])
  );

  const rows = reconcileRows(
    rooms.map(
      (room): RoomCopy => ({
        worldId: room.id,
        slug: room.slug,
        name: room.name,
        tagline: room.tagline,
        description: room.description,
        edits: readEdits(room.edits),
      })
    ),
    current
  );

  const piles: Pile[] = ["stale_seed", "curator_edit", "indeterminate"];
  const waiting = unsettled(
    rows.map((row) => ({
      slug: row.slug,
      field: row.field,
      settlement: row.settlement,
    }))
  );

  return (
    <>
      <Head eyebrow="The library" title="Reconcile the copy">
        <Link href="/desk/destinations" className={styles.filter}>
          Destinations
        </Link>
        <Link href="/desk/publish" className={styles.filter}>
          Publish
        </Link>
      </Head>

      <p className={styles.note}>
        <strong>The database is what a member reads.</strong> The portal renders{" "}
        <code>world.tagline</code> and <code>world.description</code>, so a room
        that differs from <code>src/lib/destinations.ts</code> is not a fault —
        it is the live text. The file is what seeds a fresh database, and{" "}
        <code>scripts/seed-destinations.mjs</code> never overwrites a row that
        exists, so nothing has ever reconciled the two and nothing ever will
        without a person. This is that person&rsquo;s screen.
      </p>

      <p className={styles.note}>
        Every row below carries three facts and no opinion: what each side says,
        where the database&rsquo;s words came from, and when each side was
        written relative to the other. <strong>Nothing is pre-selected.</strong>{" "}
        A verdict is recorded when you press one of the three buttons and not
        before, and re-deciding a field writes another record rather than
        editing the first — so a mis-click is corrected in the same place, with
        the first verdict still readable underneath.
      </p>

      {refused ? <p className={styles.error}>{refused}</p> : null}
      {settled ? <p className={styles.ok}>Recorded — {settled}.</p> : null}

      <div className={styles.filters}>
        <span className={styles.hint}>
          {rows.length === 0
            ? "nothing differs"
            : `${rows.length} field${rows.length === 1 ? "" : "s"} differ across ` +
              `${new Set(rows.map((row) => row.slug)).size} rooms`}
          {waiting.length > 0
            ? ` · ${waiting.length} still waiting on a verdict`
            : rows.length > 0
              ? " · all settled"
              : ""}
        </span>
      </div>

      {rows.length === 0 ? (
        <Empty>
          Every live room&rsquo;s name, tagline and premise says the same thing
          in the database and in <code>src/lib/destinations.ts</code>.{" "}
          <code>/api/health</code> reports <code>copyAgrees: true</code>.
        </Empty>
      ) : (
        piles.map((pile) => {
          const inPile = rows.filter((row) => pileOf(row) === pile);
          if (inPile.length === 0) return null;
          return (
            <section key={pile} className={styles.panel}>
              <h2 className={styles.panelHead}>
                <span>{PILE_LABEL[pile]}</span>
                <span>
                  {inPile.length} field{inPile.length === 1 ? "" : "s"}
                </span>
              </h2>
              <p className={styles.note}>{PILE_NOTE[pile]}</p>
              {inPile.map((row) => (
                <Field key={`${row.worldId}-${row.field}`} row={row} />
              ))}
            </section>
          );
        })
      )}

      <Seam title="What this screen will not do">
        It will not decide anything. There is no bulk gesture, no &ldquo;take
        the registry everywhere&rdquo;, and no default — the pile a row sits in
        says how much evidence there is about where its words came from, never
        which way it should go. It also does not write to{" "}
        <code>src/lib/destinations.ts</code>: keeping the database&rsquo;s words
        means the file and the row disagree on purpose, and a &ldquo;write it
        back&rdquo; button would emit a data literal over four thousand lines of
        argument. That reconciliation stays a commit somebody writes by hand.
      </Seam>
    </>
  );
}

/** The sentence under each pile heading. Said every time, not in a tooltip. */
const PILE_NOTE: Record<Pile, string> = {
  stale_seed:
    "Nobody has ever chosen these words at the desk — either the room has " +
    "never been saved here at all, or every save it has had recorded which " +
    "copy it changed and none of them named this field. What is in the " +
    "database is what the seeder wrote when it created the row, and the " +
    "registry has been rewritten since. The evidence is one sentence long; " +
    "the decision is still yours.",
  curator_edit:
    "Somebody saved this room at the desk. Read the timeline on each row " +
    "before you decide: an edit made BEFORE the registry sentence it " +
    "disagrees with was chosen against text that has since been deliberately " +
    "replaced, which is a different situation from an edit made after.",
  indeterminate:
    "The action ledger could not be read for these, so neither pile is " +
    "claimable. An unreadable ledger is not evidence that nobody edited them.",
};

/* ── one field ──────────────────────────────────────────────────────── */

function Field({ row }: { row: ReconcileRow }) {
  const anchor = `${row.worldId}-${row.field}`;
  const settled = row.settlement.state !== "never";

  return (
    <div id={anchor}>
      <p className={styles.driftField}>
        <Link href={`/desk/destinations/${row.worldId}`} className={styles.link}>
          {row.roomName}
        </Link>{" "}
        · {row.label} <span className={styles.when}>{row.where}</span>
      </p>

      <Evidence provenance={row.provenance} timeline={row.timeline} />
      <Settled settlement={row.settlement} />

      <div className={styles.driftPair}>
        <div className={styles.driftSide}>
          <span className={styles.label}>
            The registry — src/lib/destinations.ts
          </span>
          <pre className={styles.driftText}>{row.registry || "—"}</pre>
        </div>
        <div className={styles.driftSide}>
          <span className={styles.label}>
            The database — what a member reads today
          </span>
          <pre className={styles.driftText}>{row.database || "—"}</pre>
        </div>
      </div>

      {/*
        THREE BUTTONS, ONE FORM, NOTHING CHECKED.

        Three submit buttons sharing a `verdict` name rather than radios and a
        Save: a radio group has a state before it is submitted, and a state is
        a thing a person can leave half-set and a browser can restore. A button
        has no state at all — the verdict exists at the instant she presses one
        and not before, which is the closest a form gets to "no default".

        The merge box is empty and stays empty. Pre-filling it with either side
        would be a pre-selection wearing a textarea, and an empty merge is
        refused by name rather than falling back to anything.
      */}
      <form action={recordVerdict} className={styles.form}>
        <input type="hidden" name="world_id" value={row.worldId} />
        <input type="hidden" name="field" value={row.field} />

        <div className={styles.field}>
          <label className={styles.label} htmlFor={`${anchor}-merged`}>
            A merge — only if you type one
          </label>
          <textarea
            id={`${anchor}-merged`}
            name="merged"
            className={styles.textarea}
            rows={3}
            placeholder="Neither of the above, exactly. What goes in front of a member."
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor={`${anchor}-note`}>
            Why, if the record will not say it for you
          </label>
          <input
            id={`${anchor}-note`}
            name="note"
            className={styles.input}
            placeholder="Optional. Both texts, the dates and the verdict are already kept."
          />
        </div>

        <div className={styles.buttonRow}>
          <button name="verdict" value="registry" className={styles.buttonQuiet}>
            The registry wins
          </button>
          <button name="verdict" value="database" className={styles.buttonQuiet}>
            The database wins
          </button>
          <button name="verdict" value="merge" className={styles.buttonQuiet}>
            Take my merge
          </button>
          <span className={styles.hint}>
            {settled
              ? "Recording again supersedes the verdict above and keeps it."
              : "Writes the chosen words onto the room and records the decision."}
          </span>
        </div>
      </form>
    </div>
  );
}

/* ── the three facts ────────────────────────────────────────────────── */

function Evidence({
  provenance,
  timeline,
}: {
  provenance: ProvenanceReading;
  timeline: TimelineState;
}) {
  return (
    <ul className={styles.legend}>
      <li className={styles.legendLead}>
        {provenance.editedAt === null
          ? "Never saved at this desk"
          : `Last saved at this desk ${stamp(provenance.editedAt)}`}
        {provenance.fieldExact ? "" : " · room-level evidence only"}
      </li>
      <li>
        <span>{provenance.why}</span>
      </li>
      <li>
        <span>{timelineSaid(timeline)}</span>
      </li>
    </ul>
  );
}

/**
 * The founder's third fact, in a sentence.
 *
 * IT NAMES THE STALE CHOICE AND STOPS. "A human choice from before the
 * correction cycle is a stale choice" is her ruling and it is written here as
 * plainly as she said it — and then nothing acts on it. The buttons below this
 * line are in the same order, the same size and the same colour whatever this
 * sentence says.
 */
function timelineSaid(timeline: TimelineState): string {
  switch (timeline.state) {
    case "no_edit":
      return (
        "No desk edit to place in time — the only date this field has is the " +
        "registry's."
      );
    case "edit_precedes_registry":
      return (
        `THE DESK EDIT IS OLDER THAN THE REGISTRY SENTENCE IT DISAGREES WITH. ` +
        `Saved here ${stamp(timeline.editedAt)}; the registry text was written ` +
        `${stamp(timeline.registryAt)}. Whoever chose these words was choosing ` +
        `against a sentence that has since been deliberately replaced, so the ` +
        `choice may be stale — that is for you to say, not for this screen.`
      );
    case "edit_follows_registry":
      return (
        `The desk edit came AFTER the registry sentence. Saved here ` +
        `${stamp(timeline.editedAt)}; the registry text was written ` +
        `${stamp(timeline.registryAt)}. Whoever chose these words could have ` +
        `seen the registry's and kept these.`
      );
    case "same_day":
      return (
        `Both within a day of each other — saved here ` +
        `${stamp(timeline.editedAt)}, registry written ` +
        `${stamp(timeline.registryAt)}. Too close to put in order, and a ` +
        `correction cycle takes longer than an afternoon.`
      );
    case "undatable":
      return `The two dates cannot be put in order. ${timeline.why}`;
  }
}

/** What was decided here before, if anything. Never hidden once it exists. */
function Settled({ settlement }: { settlement: Settlement }) {
  if (settlement.state === "never") return null;
  const { record } = settlement;
  const said = VERDICT_SAID[record.verdict] ?? record.verdict;

  return (
    <p className={settlement.state === "settled" ? styles.ok : styles.error}>
      {settlement.state === "settled" ? (
        <>
          Settled {stamp(record.decided_at)}
          {record.decided_by_email ? ` by ${record.decided_by_email}` : ""} —{" "}
          <strong>{said}</strong>. The two still say exactly what they said
          then, so this difference is a decided one and{" "}
          <code>/api/health</code> counts it as settled rather than waiting.
        </>
      ) : (
        <>
          Decided {stamp(record.decided_at)} — <strong>{said}</strong> — and{" "}
          {settlement.moved.join(" and ")} {settlement.moved.length === 1 ? "has" : "have"}{" "}
          moved since. That verdict was about different text and does not
          carry. Decide it again.
        </>
      )}
      {record.note ? <> {record.note}</> : null}
    </p>
  );
}

const VERDICT_SAID: Readonly<Record<string, string>> = {
  registry: "the registry's words",
  database: "the database's words",
  merge: "a merge",
};

/* ── reading the query back ─────────────────────────────────────────── */

function one(value: string | string[] | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * The `json_agg` of desk edits, read the way src/lib/desk/drift.ts reads tone
 * tags: assuming nothing. This value crossed a jsonb column and a JSON
 * aggregate, and a malformed entry must be dropped rather than guessed at —
 * a guessed `copy_changed` would move a room between the two piles.
 *
 * `copyChanged` stays NULL when the row carries no list. Null and empty are
 * different claims here and the classifier depends on the difference: empty
 * says "this save changed no copy", null says "this save could not say".
 */
function readEdits(value: unknown): { at: string; copyChanged: string[] | null }[] {
  if (!Array.isArray(value)) return [];
  const out: { at: string; copyChanged: string[] | null }[] = [];
  for (const item of value) {
    if (typeof item !== "object" || item === null) continue;
    const record = item as Record<string, unknown>;
    const at = typeof record.at === "string" ? record.at : null;
    if (at === null) continue;
    const changed = record.copy_changed;
    out.push({
      at,
      copyChanged: Array.isArray(changed)
        ? changed.filter((entry): entry is string => typeof entry === "string")
        : null,
    });
  }
  return out;
}
