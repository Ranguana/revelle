"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { query, queryOne, transaction } from "@/lib/db";
import { authoredCopy } from "@/lib/desk/drift";
import {
  provenanceOf,
  timelineOf,
  verdictFrom,
  type DeskEdit,
} from "@/lib/desk/reconcile";
import { registryDate } from "@/lib/desk/registry-dates";
import { recordAction, requireStaff } from "@/lib/staff";

/**
 * RECORDING A VERDICT ON ONE ROOM'S COPY.
 *
 * ── WHAT THIS ACTION IS ALLOWED TO DECIDE: NOTHING ──────────────────
 *
 * The verdict arrives from a button the founder pressed. There is no default
 * here, no fallback, no "if the provenance is stale-seed then take the
 * registry". A post with no verdict on it is REFUSED BY NAME (rule 16) rather
 * than resolved into the likely one — a click that quietly did something other
 * than what it looked like is worse on this screen than on any other, because
 * what it writes is a sentence a member reads.
 *
 * ── AND THE TWO VALUES DO NOT COME FROM THE FORM ────────────────────
 *
 * Only the room, the field, the verdict, the merged sentence and the note
 * travel in the post. The registry text and the database text are re-read
 * SERVER-SIDE at the moment of the write, from `authoredCopy` and from the
 * `world` row.
 *
 * Two reasons, and the second is the one that matters. The obvious one is that
 * a form value is whatever the browser sent. The real one is that the baseline
 * db/055 records has to be the text that was true WHEN THE ROW WAS WRITTEN,
 * not when the page was rendered: a stale tab posting a verdict against a
 * premise somebody rewrote an hour ago would record a settlement that is
 * already false, and the detector would call it settled and never mention it
 * again. Re-reading turns that into a refusal she can see.
 *
 * ── ONE STATEMENT'S WORTH OF ATOMICITY ──────────────────────────────
 *
 * The copy write and the reconciliation row are one fact and must not
 * half-exist: a `world` row rewritten with no record of why is the state this
 * whole pass exists to end, and a record of a decision that did not land is a
 * baseline that lies. So they go in one transaction. `staff_action` is written
 * after it commits, deliberately — `recordAction` swallows its own failures
 * (db/011's ledger must never be the thing that fails a curator's save), and
 * putting it inside would make a ledger hiccup roll back a decision.
 *
 * ── WRITING COPY IS A CURATOR ACTION ON A GOVERNED CLASS ────────────
 *
 * `world` is governed (rule 13) and this is a member-facing sentence, which is
 * named in the same paragraph. So it may only be written by a signed-in person
 * — `requireStaff` — and it is recorded twice: in `copy_reconciliation`, which
 * is the queryable baseline, and in `staff_action`, which is who and when.
 */

/** `premise` in the registry, `description` in the schema. Reconciled here,
 *  in the third and last place — see db/055's `field` column comment. */
const COLUMN: Readonly<Record<string, string>> = {
  name: "name",
  tagline: "tagline",
  premise: "description",
};

const UUID = /^[0-9a-f-]{36}$/i;

export async function recordVerdict(form: FormData): Promise<void> {
  const staff = await requireStaff();

  const worldId = String(form.get("world_id") ?? "");
  const field = String(form.get("field") ?? "");
  const verdict = String(form.get("verdict") ?? "");

  // WHERE SHE WAS. The row is the anchor, so the page comes back with the row
  // she just acted on under her cursor and not at the top — rule 18: the UI
  // never moves the target of a correction, and the correction for a verdict
  // is another verdict on the same row.
  const anchor = `#${worldId}-${field}`;
  const back = (search: string) => `/desk/reconcile${search}${anchor}`;
  const refuse = async (said: string) => {
    await recordAction(staff, {
      action: "copy.reconcile_refused",
      entityTable: "world",
      entityId: UUID.test(worldId) ? worldId : undefined,
      summary: `refused — ${field}`,
      detail: { field, verdict, refusal: said },
    });
    redirect(back(`?refused=${encodeURIComponent(said)}`));
  };

  if (!UUID.test(worldId) || !Object.hasOwn(COLUMN, field)) {
    await refuse(
      "Nothing was recorded. That post did not name a room and one of the " +
        "three copy fields this desk reconciles."
    );
    return;
  }

  const room = await queryOne<{
    slug: string;
    name: string;
    tagline: string;
    description: string;
  }>(
    `select w.slug::text as slug, w.name, w.tagline, w.description
       from world w where w.id = $1`,
    [worldId]
  );
  if (!room) {
    await refuse("Nothing was recorded. There is no room with that id.");
    return;
  }

  const registryValue = authoredCopy(room.slug, field);
  if (registryValue === null) {
    await refuse(
      `Nothing was recorded. src/lib/destinations.ts authors no room with the ` +
        `slug ${room.slug}, so there is no registry side to this comparison. ` +
        `A room started at the desk has nothing to reconcile against.`
    );
    return;
  }

  const databaseValue = normalise(
    field === "premise" ? room.description : field === "name" ? room.name : room.tagline
  );

  const draft = verdictFrom(
    verdict,
    registryValue,
    databaseValue,
    String(form.get("merged") ?? ""),
    String(form.get("note") ?? "")
  );
  if (draft.error !== null) {
    await refuse(draft.error);
    return;
  }
  const chosen = draft.value;

  /*
   * THE EVIDENCE IS RE-READ, NOT CARRIED IN THE POST, for the same reason the
   * two texts are: what db/055 records has to be the provenance as it stood at
   * the moment of the decision. It is also the only honest thing to store —
   * a classification the browser sent is a classification anybody can post.
   */
  const edits = await query<{ at: string; copy_changed: string[] | null }>(
    `select a.created_at as at,
            case when a.detail ? 'copy_changed'
                 then array(select jsonb_array_elements_text(a.detail->'copy_changed'))
                 else null end as copy_changed
       from staff_action a
      where a.entity_table = 'world'
        and a.entity_id = $1
        and a.action = 'destination.updated'
      order by a.created_at desc`,
    [worldId]
  );
  const evidence: DeskEdit[] = edits.map((row) => ({
    at: new Date(row.at).toISOString(),
    copyChanged: row.copy_changed,
  }));
  const provenance = provenanceOf(field, evidence);
  const timeline = timelineOf(provenance, registryDate(room.slug, field));

  const registryAt =
    timeline.state === "edit_precedes_registry" ||
    timeline.state === "edit_follows_registry" ||
    timeline.state === "same_day"
      ? timeline.registryAt
      : null;

  try {
    await transaction(async (client) => {
      // The copy first. A `database` verdict changes nothing and the statement
      // is still run: it is a no-op write that keeps the two branches one
      // shape, and `where id = $2` with an unchanged value costs nothing.
      await client.query(
        `update world set ${COLUMN[field]} = $1 where id = $2`,
        [chosen.chosenValue, worldId]
      );
      await client.query(
        `insert into copy_reconciliation
           (world_id, field, verdict, registry_value, database_value,
            chosen_value, provenance, edited_at, registry_authored_at, note,
            decided_by)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [
          worldId,
          field,
          chosen.verdict,
          registryValue,
          databaseValue,
          chosen.chosenValue,
          provenance.provenance,
          provenance.fieldEditedAt ?? provenance.editedAt,
          registryAt,
          chosen.note,
          staff.id,
        ]
      );
    });
  } catch (err) {
    // The database's own words, verbatim, with the hint — the rule every
    // refusal on this desk follows. db/055's CHECK constraints explain
    // themselves, and rewriting one into something friendlier here would make
    // it less true and put a second copy of the rule in TypeScript.
    const refusal = err as { message?: string; hint?: string };
    await refuse(
      [refusal?.message ?? String(err), refusal?.hint].filter(Boolean).join(" ")
    );
    return;
  }

  await recordAction(staff, {
    action: "copy.reconciled",
    entityTable: "world",
    entityId: worldId,
    summary: `${room.slug} · ${field} → ${chosen.verdict}`,
    detail: {
      slug: room.slug,
      field,
      verdict: chosen.verdict,
      provenance: provenance.provenance,
      field_exact: provenance.fieldExact,
      timeline: timeline.state,
      note: chosen.note,
    },
  });

  // Every surface that reads this copy is now stale, and the two that matter
  // most are the ones a member reads. Listed rather than revalidating a
  // segment, so /desk/reconcile is certainly fresh — she is about to read her
  // own receipt off it.
  revalidatePath("/desk/reconcile");
  revalidatePath("/desk/destinations");
  revalidatePath(`/desk/destinations/${worldId}`);
  revalidatePath("/portal");

  redirect(back(`?settled=${encodeURIComponent(`${room.slug} · ${field}`)}`));
}

/** The same fold `copyDrift` applies, so the two sides are compared on equal
 *  terms. Trailing whitespace is not a curator's judgement. */
function normalise(value: string | null): string {
  return (value ?? "").replace(/\r\n/g, "\n").trim();
}
