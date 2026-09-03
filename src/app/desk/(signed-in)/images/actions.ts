"use server";

import Anthropic from "@anthropic-ai/sdk";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { query, queryOne, transaction } from "@/lib/db";
import { imageBytes } from "@/lib/desk/image-store";
import {
  PLACEMENT_ASK,
  SLOT_FOR_PLACEMENT,
  STORED_TYPE,
  bankDraftFrom,
  mayApprove,
  parseReply,
  placementSystemPrompt,
  readingFrom,
  type Placement,
} from "@/lib/desk/images";
import { slugify } from "@/lib/desk/labels";
import { MAX_TOKENS, MODEL } from "@/lib/model";
import { recordAction, requireStaff } from "@/lib/staff";

/**
 * READING A PICTURE, AND WHAT SHE DOES ABOUT IT.
 *
 * ── THE ONE RULE THIS FILE IS BUILT AROUND ──────────────────────────
 *
 * A SCRIPT MAY NOT SIGN A CLAIM ABOUT A ROOM. CLAUDE.md rule 13, and it draws
 * the line straight through the middle of this file:
 *
 *   `readImage` spends a model call and writes a PROPOSAL. It creates no
 *   catalogue row, touches no pool, and its output is only ever shown.
 *
 *   `approvePlacement` is the only thing here that reaches the catalogue, it
 *   runs on a click, and what it writes is a DRAFT carrying the founder's own
 *   question — held back by the same marker, in the same column, that holds
 *   the 179 machine-drafted proposals already in the bank.
 *
 * There is no path between the two that does not go through a person.
 *
 * ── AND APPROVING IS CHOOSING A ROOM ────────────────────────────────
 *
 * Not a generic yes. The form posts a CANDIDATE, and db/056 refuses an
 * approval that names none — so "she approved this picture" is not a state
 * this system can be in. What she approved is this object, into this room, as
 * this kind of thing.
 *
 * ── THE PICTURES DO NOT TRAVEL ──────────────────────────────────────
 *
 * The bytes go to the model and nowhere else. What is written to the database
 * from a reading is text: the object named plainly, the styling note, the
 * candidate rooms, the founder question and the bank clause — the house's own
 * words. The photograph stays in `reference_image`, behind the staff-guarded
 * view route, and never reaches a member surface.
 */

const UUID = /^[0-9a-f-]{36}$/i;

/**
 * How many unread pictures one press of the batch button reads.
 *
 * A ceiling and not a page size. A drop of two hundred references would be two
 * hundred model calls in one request, which is a request that dies at a
 * gateway timeout with an unknowable number of them already written — the
 * shape of failure where the only way to find out what happened is to look at
 * the rows afterwards. So the batch does a knowable amount of work, SAYS how
 * many are left, and she presses it again. Rule 16: what it did not do is
 * stated where she is standing, not inferred from a count that stopped moving.
 */
const BATCH = 8;

/* ══ reading ═════════════════════════════════════════════════════════ */

type Reply = { model: string; raw: unknown };

/**
 * One picture, to the model and back.
 *
 * The retry is the CLI's and is here for its reason: the failures actually
 * seen are JSON formatting rather than refusal, and throwing away a good
 * reading of a photograph over a trailing comma is the wrong trade when the
 * re-ask costs one call. `parseReply` repairs the two things that go wrong;
 * this asks again when the repair does not take.
 */
async function look(bytes: Buffer): Promise<Reply> {
  const client = new Anthropic();
  const system = placementSystemPrompt();
  const content: Anthropic.MessageParam["content"] = [
    {
      type: "image",
      source: {
        type: "base64",
        media_type: STORED_TYPE,
        data: bytes.toString("base64"),
      },
    },
    { type: "text", text: PLACEMENT_ASK },
  ];

  let last: unknown = null;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system,
      messages: [{ role: "user", content }],
    });
    // Text blocks only, joined. `content[0]` is not the answer on this model.
    const text = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");
    try {
      return { model: message.model ?? MODEL, raw: parseReply(text) };
    } catch (err) {
      last = err;
    }
  }
  throw new Error(
    `the reply could not be read as JSON twice running: ` +
      `${last instanceof Error ? last.message : String(last)}`
  );
}

/** The reading, written. Returns the refusal to show, or null. */
async function readOne(
  imageId: string,
  staffId: string
): Promise<string | null> {
  const picture = await imageBytes(imageId, "full");
  if (!picture) return "That picture is no longer in the bank.";

  let reply: Reply;
  try {
    reply = await look(picture.bytes);
  } catch (err) {
    // The provider's own sentence. "overloaded" and "domain is not verified"
    // are very different problems and both arrive as an exception.
    return err instanceof Error ? err.message : String(err);
  }

  const result = readingFrom(reply.raw);
  if (!result.ok) return result.refusal;
  const reading = result.reading;

  // The candidate slugs, resolved against the catalogue AS IT IS. A slug that
  // resolves to nothing keeps its row with a null world — the screen shows it
  // and refuses it in words rather than dropping it, because a proposal that
  // vanished looks exactly like one that was never made.
  const slugs = [...new Set(reading.candidates.map((c) => c.roomSlug))];
  const rooms =
    slugs.length === 0
      ? []
      : await query<{ id: string; slug: string }>(
          `select id::text as id, slug::text as slug
             from world where slug = any($1::citext[]) and status <> 'retired'`,
          [slugs]
        );
  const worldBySlug = new Map(rooms.map((room) => [room.slug, room.id]));

  await transaction(async (client) => {
    const { rows } = await client.query<{ id: string }>(
      `insert into reference_image_reading
         (image_id, model, object, styling_note, no_room, question,
          bank_clause, read_by)
       values ($1,$2,$3,$4,$5,$6,$7,$8)
       returning id::text as id`,
      [
        imageId,
        reply.model,
        reading.object,
        reading.stylingNote,
        reading.noRoom,
        reading.question,
        reading.bankClause,
        staffId,
      ]
    );
    const readingId = rows[0].id;

    for (const candidate of reading.candidates) {
      await client.query(
        `insert into reference_image_candidate
           (reading_id, room_slug, world_id, placement, confidence, why, ordinal)
         values ($1,$2,$3,$4,$5,$6,$7)`,
        [
          readingId,
          candidate.roomSlug,
          worldBySlug.get(candidate.roomSlug) ?? null,
          candidate.placement,
          candidate.confidence,
          candidate.why,
          candidate.ordinal,
        ]
      );
    }
  });

  return null;
}

export async function readImage(form: FormData): Promise<void> {
  const staff = await requireStaff();
  const imageId = String(form.get("image_id") ?? "");
  const back = (search: string) => `/desk/images${search}#image-${imageId}`;

  if (!UUID.test(imageId)) {
    redirect(`/desk/images?refused=${encodeURIComponent("No picture was named.")}`);
  }

  const refusal = await readOne(imageId, staff.id);
  if (refusal !== null) {
    redirect(back(`?refused=${encodeURIComponent(refusal)}`));
  }

  await recordAction(staff, {
    action: "reference_image.read",
    entityTable: "reference_image",
    entityId: imageId,
    summary: "read for placement",
  });
  revalidatePath("/desk/images");
  redirect(back("?read=1"));
}

/**
 * Everything unread, up to the ceiling.
 *
 * COUNTED IN BOTH DIRECTIONS AND REPORTED (CLAUDE.md rule 24). A batch that
 * matched nothing and a batch that matched everything look identical from
 * outside and fail in opposite directions — the second re-reads pictures she
 * has already refused, which is the whole reason a refusal is a row. The
 * message on the screen names how many were read, how many refused the reading
 * outright, and how many are still waiting.
 */
export async function readEverythingUnread(): Promise<void> {
  const staff = await requireStaff();

  const waiting = await query<{ id: string }>(
    `select i.id::text as id
       from reference_image i
      where not exists (
        select 1 from reference_image_reading r where r.image_id = i.id)
      order by i.dropped_at asc`
  );

  if (waiting.length === 0) {
    redirect(
      `/desk/images?read=${encodeURIComponent(
        "Nothing was unread. Every picture in the bank has been read at least once."
      )}`
    );
  }

  const batch = waiting.slice(0, BATCH);
  let done = 0;
  const refusals: string[] = [];

  for (const image of batch) {
    const refusal = await readOne(image.id, staff.id);
    if (refusal === null) done += 1;
    else refusals.push(refusal);
  }

  await recordAction(staff, {
    action: "reference_image.read_batch",
    summary: `${done} of ${batch.length} read, ${waiting.length - batch.length} still waiting`,
    detail: { unread_before: waiting.length, read: done, refusals },
  });

  const left = waiting.length - done;
  const said =
    `${done} read` +
    (refusals.length > 0
      ? `, ${refusals.length} would not read (${refusals[0]})`
      : "") +
    (left > 0
      ? `. ${left} still unread — this reads ${BATCH} at a time, so press it again.`
      : ". Nothing is unread now.");

  revalidatePath("/desk/images");
  redirect(`/desk/images?read=${encodeURIComponent(said)}`);
}

/* ══ the two gestures ════════════════════════════════════════════════ */

/**
 * APPROVE ONE CANDIDATE INTO ONE ROOM.
 *
 * ── WHAT IT WRITES, AND WHY IT IS A DRAFT ───────────────────────────
 *
 * A `bank_item` with `status = 'draft'` whose description carries the reading's
 * FOUNDER-PENDING question. That is not a courtesy — it is the mechanism.
 * db/036 and scripts/seed-bank.mjs both test `description like
 * '%FOUNDER-PENDING%'` and hold such a row back, and there is no list of
 * held-back slugs anywhere: THE ROW KNOWS IT IS HELD BECAUSE THE QUESTION IS
 * IN IT. A reading that asked no question therefore produces no row at all,
 * refused by name in `bankDraftFrom` — writing one would be a machine's
 * proposal going live because a field was empty.
 *
 * ── AND WHY IT CLAIMS ITS OWN SLOT ──────────────────────────────────
 *
 * db/043's trigger gives every new bank row the slot
 * `bank_item_default_slot()` computes from its words, which is right for a row
 * that makes no claim. This row makes one: the button she pressed named the
 * placement. db/048 is explicit that a claim carrying a curator's own note is
 * hers and later migrations do not overrule it, so the machine's default is
 * replaced rather than argued with — and the note says who wrote it.
 *
 * ── WHAT IT DELIBERATELY DOES NOT SET, SAID OUT LOUD ────────────────
 *
 * `supply`. db/044's column comment: "Written only by scripts/seed-bank.mjs,
 * from the THE EVENING SUPPLIES IT marker the content carries — one writer, so
 * there is no second implementation to drift from." The prompt's fifth
 * instruction asks the reading to PREFER an object the evening already
 * produces, so a clause arriving here can say exactly that — and this action
 * still leaves `supply` at its `stocked` default.
 *
 * That is a real gap and it is named rather than closed. Closing it here means
 * a second reader of the same marker, in a second language, over a different
 * input — rule 21's drift, bought to save one field on a draft somebody is
 * about to open anyway. So the screen SAYS the draft arrives as `stocked` and
 * points at /desk/bank, which is rule 16's requirement: the thing that was not
 * honoured is stated where the person is standing.
 */
export async function approvePlacement(form: FormData): Promise<void> {
  const staff = await requireStaff();

  const imageId = String(form.get("image_id") ?? "");
  const candidateId = String(form.get("candidate_id") ?? "");
  const anchor = `#image-${imageId}`;
  const refuse = async (said: string) => {
    await recordAction(staff, {
      action: "reference_image.approve_refused",
      entityTable: "reference_image",
      entityId: UUID.test(imageId) ? imageId : undefined,
      summary: "nothing was written",
      detail: { candidate_id: candidateId, refusal: said },
    });
    redirect(`/desk/images?refused=${encodeURIComponent(said)}${anchor}`);
  };

  if (!UUID.test(imageId) || !/^\d+$/.test(candidateId)) {
    await refuse(
      "Nothing was written. That post did not name a picture and one of its " +
        "candidate rooms."
    );
    return;
  }

  const candidate = await queryOne<{
    id: string;
    reading_id: string;
    room_slug: string;
    world_id: string | null;
    world_slug: string | null;
    placement: Placement;
    bank_clause: string;
    question: string;
    object: string;
    filename: string;
    sha256: string;
  }>(
    `select c.id::text as id, c.reading_id::text as reading_id,
            c.room_slug, c.world_id::text as world_id,
            w.slug::text as world_slug,
            c.placement,
            r.bank_clause, r.question, r.object,
            i.filename, i.sha256
       from reference_image_candidate c
       join reference_image_reading r on r.id = c.reading_id
       join reference_image i on i.id = r.image_id
       left join world w on w.id = c.world_id
      where c.id = $1 and i.id = $2`,
    [candidateId, imageId]
  );
  if (!candidate) {
    await refuse("Nothing was written. That candidate is not on that picture.");
    return;
  }

  const allowed = mayApprove({
    placement: candidate.placement,
    worldId: candidate.world_id,
    roomSlug: candidate.room_slug,
  });
  if (!allowed.ok) {
    await refuse(allowed.refusal);
    return;
  }

  const made = bankDraftFrom({
    bankClause: candidate.bank_clause,
    question: candidate.question,
    placement: candidate.placement,
    // Provenance in the marker's parenthetical, in the idiom seed-bank uses
    // for the bank document. A row read back in a year says which picture it
    // came out of without an archaeologist.
    source: `reference image ${candidate.sha256.slice(0, 12)}${
      candidate.filename ? ` — ${candidate.filename}` : ""
    }, /desk/images`,
  });
  if (!made.ok) {
    await refuse(made.refusal);
    return;
  }

  const worldSlug = candidate.world_slug ?? candidate.room_slug;
  const slug = slugify(`${worldSlug}-${made.draft.name}`);
  const slot = SLOT_FOR_PLACEMENT[candidate.placement];

  let bankItemId = "";
  try {
    await transaction(async (client) => {
      const inserted = await client.query<{ id: string }>(
        `insert into bank_item
           (slug, kind, name, description, phase, status, source_citation)
         values ($1,$2::bank_kind,$3,$4,'all'::bank_phase,'draft'::product_status,$5)
         returning id::text as id`,
        [
          slug,
          made.draft.kind,
          made.draft.name,
          made.draft.description,
          `Reference image ${candidate.sha256.slice(0, 12)} at /desk/images, ` +
            `read as "${candidate.object}", approved into ${worldSlug} by ` +
            `${staff.email}.`,
        ]
      );
      bankItemId = inserted.rows[0].id;

      // db/043: the destination is a `native` claim, not a column.
      await client.query(
        `insert into bank_item_world (bank_item_id, world_id, native, note)
         values ($1, $2, true, 'Approved from a reference image at /desk/images.')`,
        [bankItemId, candidate.world_id]
      );

      if (slot !== null) {
        // The trigger has just written the machine's default. Hers replaces it
        // — db/048's own carve-out for a claim that carries a curator's note.
        await client.query(
          `delete from bank_item_slot
            where bank_item_id = $1
              and slot_code <> $2
              and (note like 'Classified by db/043 through bank_item_default_slot().%'
                or note like 'Default claim from bank_item_default_slot()%')`,
          [bankItemId, slot]
        );
        await client.query(
          `insert into bank_item_slot (bank_item_id, slot_code, fit, note)
           values ($1, $2, 'native', $3)
           on conflict (bank_item_id, slot_code) do update set note = excluded.note`,
          [
            bankItemId,
            slot,
            `Claimed at /desk/images: the placement on the button ${staff.email} ` +
              `pressed. A curator's claim, not bank_item_default_slot()'s.`,
          ]
        );
      }

      await client.query(
        `insert into reference_image_verdict
           (image_id, reading_id, verdict, candidate_id, bank_item_id, note,
            decided_by)
         values ($1,$2,'approved',$3,$4,$5,$6)`,
        [
          imageId,
          candidate.reading_id,
          candidate.id,
          bankItemId,
          String(form.get("note") ?? "").trim().slice(0, 2000),
          staff.id,
        ]
      );
    });
  } catch (err) {
    // The database's own words, with its hint. A slug collision is the one a
    // curator will actually meet — approving the same object into the same
    // room twice — and `bank_item_slug_key` is not a sentence, so it is the
    // one message rewritten. Everything else is quoted.
    const failure = err as { message?: string; hint?: string };
    const message = failure?.message ?? String(err);
    await refuse(
      message.includes("bank_item_slug_key")
        ? `A bank item already has the slug "${slug}" — this object is ` +
            `already in ${worldSlug}. Nothing was written. Edit the existing ` +
            `row at /desk/bank, or refuse this picture.`
        : [message, failure?.hint].filter(Boolean).join(" ")
    );
    return;
  }

  await recordAction(staff, {
    action: "reference_image.approved",
    entityTable: "reference_image",
    entityId: imageId,
    summary: `${candidate.object} → ${worldSlug} (draft, founder-pending)`,
    detail: {
      room: worldSlug,
      placement: candidate.placement,
      bank_item_id: bankItemId,
      slug,
      question: candidate.question,
    },
  });

  revalidatePath("/desk/images");
  revalidatePath("/desk/bank");
  revalidatePath("/desk/publish");
  redirect(
    `/desk/images?approved=${encodeURIComponent(
      `${made.draft.name} → ${worldSlug}`
    )}${anchor}`
  );
}

/**
 * REFUSE A PICTURE, AND KEEP IT.
 *
 * The image stays. Deleting it would lose the digest, and the same picture
 * dropped again next month would arrive as new, be read again, be proposed
 * again and be refused again — a loop with a cost per turn.
 *
 * And the refusal is VISIBLE. The card stays on the screen saying what was
 * refused and when, because a "no" that makes something disappear is a "no"
 * nobody can check and nobody can reverse. The reversal is another click in
 * the same place: a later verdict supersedes this one and this one stays
 * readable underneath (db/056 is append-only, CLAUDE.md rules 14 and 18).
 */
/**
 * DELETE A PICTURE OUTRIGHT — the wrong-upload case.
 *
 * Founder: "should have a delete button next to read it just in case we
 * upload a wrong photo."
 *
 * ── WHY THIS IS NOT `refuseImage` ────────────────────────────────────
 *
 * Refusing keeps the image and records that she looked and said no, so the
 * same picture is never read and proposed at her twice. That is right for a
 * picture she considered.
 *
 * A wrong upload was never considered. Keeping it would leave a permanent
 * record of a mis-drop in a list she has to read past, which is the opposite
 * of what refusal is for — and it would report as a refusal she never made.
 * Two different acts, two buttons.
 *
 * ── THE BYTES GO TOO ─────────────────────────────────────────────────
 *
 * db/056's readings, candidates and verdicts are all `on delete cascade`, so
 * one statement takes the picture and everything derived from it. Deliberate,
 * and safe here in a way it is not for a pool row: a reference image is
 * PRIVATE REFERENCE that never reaches a member, so nothing was ever issued
 * from it and nothing can be left pointing at it.
 *
 * The ledger keeps the fact, per db/042 — a deletion carries its reason — so
 * the act is recoverable as a record even though the bytes are not.
 */
export async function deleteImage(form: FormData): Promise<void> {
  const staff = await requireStaff();
  const id = String(form.get("image_id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;

  const before = await queryOne<{ filename: string | null }>(
    `select filename from reference_image where id = $1`,
    [id]
  );
  if (!before) return;

  await query(`delete from reference_image where id = $1`, [id]);

  await recordAction(staff, {
    action: "reference_image.deleted",
    entityTable: "reference_image",
    entityId: id,
    summary: `${before.filename ?? "a picture"} — deleted as a wrong upload, not refused`,
  });

  revalidatePath("/desk/images");
}

export async function refuseImage(form: FormData): Promise<void> {
  const staff = await requireStaff();

  const imageId = String(form.get("image_id") ?? "");
  const anchor = `#image-${imageId}`;
  if (!UUID.test(imageId)) {
    redirect(`/desk/images?refused=${encodeURIComponent("No picture was named.")}`);
  }

  const reading = await queryOne<{ id: string; object: string }>(
    `select id::text as id, object
       from reference_image_reading
      where image_id = $1
      order by read_at desc, id desc
      limit 1`,
    [imageId]
  );
  if (!reading) {
    redirect(
      `/desk/images?refused=${encodeURIComponent(
        "That picture has not been read yet, so there is no proposal to " +
          "refuse. Read it first, or leave it."
      )}${anchor}`
    );
  }

  const note = String(form.get("note") ?? "").trim().slice(0, 2000);

  await query(
    `insert into reference_image_verdict
       (image_id, reading_id, verdict, note, decided_by)
     values ($1, $2, 'refused', $3, $4)`,
    [imageId, reading.id, note, staff.id]
  );

  await recordAction(staff, {
    action: "reference_image.refused",
    entityTable: "reference_image",
    entityId: imageId,
    summary: `${reading.object} — refused`,
    detail: { note, reading_id: reading.id },
  });

  revalidatePath("/desk/images");
  redirect(
    `/desk/images?refusedOk=${encodeURIComponent(reading.object)}${anchor}`
  );
}
