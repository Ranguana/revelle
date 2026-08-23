"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { query, queryOne } from "@/lib/db";
import { setTags, validFacetIds } from "@/lib/desk/facets";
import { slugify } from "@/lib/desk/labels";
import { PLAIN_STATUSES, retirementFrom } from "@/lib/desk/retirement";
import { carryReview } from "@/lib/desk/review";
import { voiceFromForm } from "@/lib/desk/voice-form";
import { recordAction, requireStaff } from "@/lib/staff";

/**
 * Authoring a destination.
 *
 * ── THE ONE RULE THIS FILE EXISTS TO KEEP ───────────────────────────
 *
 * A VOICE THAT HAS BEEN PUBLISHED IS NEVER EDITED. Editing one creates the
 * NEXT VERSION; the row a Revelle was issued under keeps its words forever.
 * db/004 explains why at length and enforces it with a trigger, so the rule
 * cannot be broken from here even by accident — the database raises. What this
 * file does is make the correct path the EASY one, so a curator never runs
 * into that error in the first place:
 *
 *   · There is no "edit the published voice" button. There is "start version
 *     N+1 from this", which copies the text into a fresh draft row.
 *   · A draft is freely editable, freely discardable, and never issued.
 *   · Publishing a draft validates it (validate_voice, in the database) and
 *     supersedes the previous version in the same statement.
 *
 * The look is a different matter and is edited in place: `world.tokens` is not
 * versioned. That asymmetry is deliberate and db/004's closing note argues it —
 * a palette change is visible the moment it happens, a voice change is
 * invisible.
 */

/**
 * THE STATUSES THE PLAIN STATUS BUTTON MAY SET — and the one it may not.
 *
 * This list used to read `["draft", "published", "retired"]`. Nothing on any
 * screen ever sent `retired`, so it was a value the action accepted and no
 * control offered — which was harmless until db/042, and is not any more:
 * `world_retired_has_reason` refuses a retirement that carries no note, so a
 * form post of `status=retired` would now reach a curator as
 * `violates check constraint "world_retired_has_reason"`.
 *
 * It is refused BY NAME instead, in the action below, with the reason — rule
 * 16 — and the transition lives in `retireDestination`, which asks for the
 * words. The list itself is `PLAIN_STATUSES` in src/lib/desk/retirement.ts so
 * that the guard is a value a test can hold rather than a sentence a test has
 * to grep for.
 */
const STATUSES = PLAIN_STATUSES;

const PALETTE_KEYS = [
  "ground", "ground2", "ink", "inkSoft", "inkFaint", "rule", "aqua",
  "oxblood", "gold", "night", "night2", "nightInk", "nightSoft",
  "nightAqua", "nightOxblood", "bone",
] as const;

const DARK_KEYS = [
  "ground", "ground2", "ink", "inkSoft", "inkFaint", "rule", "aqua",
  "oxblood", "gold",
] as const;

export type DestinationState = { error: string | null };

function trimmed(form: FormData, key: string): string {
  return String(form.get(key) ?? "").trim();
}

function nullable(form: FormData, key: string): string | null {
  const value = trimmed(form, key);
  return value.length > 0 ? value : null;
}

/** A hex colour or nothing. Anything else is dropped rather than stored. */
function colour(form: FormData, key: string): string | null {
  const value = trimmed(form, key);
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value.toLowerCase() : null;
}

/**
 * The look, as the token document src/lib/tokens.ts renders to CSS.
 *
 * Built field by field rather than accepted as JSON: `world.tokens` is jsonb
 * and would take anything, and the whole argument for tokens being data is
 * that a token set "can be ugly but cannot leak arbitrary CSS". A textarea of
 * raw JSON would hand that guarantee back.
 */
function looksFrom(form: FormData, key: string) {
  const palette: Record<string, string> = {};
  for (const token of PALETTE_KEYS) {
    const value = colour(form, `palette_${token}`);
    if (value) palette[token] = value;
  }
  const paletteDark: Record<string, string> = {};
  for (const token of DARK_KEYS) {
    const value = colour(form, `dark_${token}`);
    if (value) paletteDark[token] = value;
  }
  return {
    key,
    palette,
    paletteDark,
    type: {
      display: trimmed(form, "type_display"),
      body: trimmed(form, "type_body"),
      mono: trimmed(form, "type_mono"),
    },
  };
}

export async function saveDestination(
  _previous: DestinationState,
  form: FormData
): Promise<DestinationState> {
  const staff = await requireStaff();

  const id = trimmed(form, "id");
  const name = trimmed(form, "name");
  const tagline = trimmed(form, "tagline");
  if (name.length === 0) return { error: "It needs a name." };
  if (tagline.length === 0) return { error: "It needs a tagline." };

  const slug = slugify(trimmed(form, "slug") || name);
  const occasions = form.getAll("occasion").map((value) => String(value));
  const tokens = looksFrom(form, slug);

  const facets = await validFacetIds(
    form.getAll("facet").map((value) => String(value))
  );

  let worldId = id;
  try {
    if (id) {
      await query(
        `update world
            set slug = $1, name = $2, tagline = $3, description = $4,
                tokens = $5::jsonb, cover_image_url = $6,
                fits_occasions = $7::occasion_type[], notes = $8
          where id = $9`,
        [
          slug,
          name,
          tagline,
          trimmed(form, "description"),
          JSON.stringify(tokens),
          nullable(form, "cover_image_url"),
          occasions,
          nullable(form, "notes"),
          id,
        ]
      );
    } else {
      // Always a DRAFT. Deciding that a destination is offered is a decision,
      // not a side effect of typing its name — the same rule
      // scripts/seed-destinations.mjs states.
      const rows = await query<{ id: string }>(
        `insert into world
           (slug, name, tagline, description, tokens, cover_image_url,
            fits_occasions, notes, status)
         values ($1,$2,$3,$4,$5::jsonb,$6,$7::occasion_type[],$8,'draft')
         returning id`,
        [
          slug,
          name,
          tagline,
          trimmed(form, "description"),
          JSON.stringify(tokens),
          nullable(form, "cover_image_url"),
          occasions,
          nullable(form, "notes"),
        ]
      );
      worldId = rows[0].id;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      error: message.includes("world_slug_key")
        ? `Another destination already has the slug "${slug}".`
        : message,
    };
  }

  await setTags("world", worldId, facets);

  await recordAction(staff, {
    action: id ? "destination.updated" : "destination.created",
    entityTable: "world",
    entityId: worldId,
    summary: name,
    detail: { slug, occasions, facets: facets.length },
  });

  revalidatePath("/desk/destinations");
  revalidatePath(`/desk/destinations/${worldId}`);
  // A save mid-review lands back INSIDE the review. Without this the strip
  // disappears the first time she edits anything, which is exactly when a
  // review is most likely to be running. src/lib/desk/review.ts.
  redirect(carryReview(form, `/desk/destinations/${worldId}?saved=1`));
}

/**
 * Publishing, and the one thing that can refuse it.
 *
 * db/019 puts a trigger on `world` that will not let a destination with no
 * PUBLISHED voice move into 'published'. A destination is a look and a voice;
 * everything a Revelle contains — the invitation, the menu card, the prep list
 * — is written in that voice and there is no fallback by design, so a mute
 * destination that reaches the engine's shortlist can only produce proposals
 * nobody is able to approve.
 *
 * The refusal is CAUGHT AND SHOWN, not allowed to become a stack trace. Its
 * words are the database's, verbatim, with the hint — the same rule the voice
 * form states a few functions down: validate_voice() explains itself, and
 * rewriting its sentence into something friendlier here would make it less
 * true, and would put a second copy of the rule in TypeScript.
 *
 * The redirect lands on the destination's own page whichever button was
 * pressed, including the one in the library list, because that page is where
 * the link to write the voice is.
 */
export async function setDestinationStatus(form: FormData): Promise<void> {
  const staff = await requireStaff();
  const id = String(form.get("id") ?? "");
  const status = String(form.get("status") ?? "");
  // REFUSED BY NAME, not dropped. A silent `return` on a status this action
  // will not perform is rule 16's failure exactly: the post succeeded, the page
  // re-rendered, and nothing anywhere says the room is still published. The
  // refusal names the reason and points at the door that does work.
  if (status === "retired") {
    const said =
      "A retirement carries its reason (CLAUDE.md rule 17), and this button " +
      "carries only a status. Retire the room from its own page, where there " +
      "is somewhere to write why.";
    await recordAction(staff, {
      action: "destination.status_refused",
      entityTable: "world",
      entityId: id,
      summary: "refused → retired (no reason given)",
      detail: { status, refusal: said },
    });
    redirect(
      carryReview(
        form,
        `/desk/destinations/${id}?refused=${encodeURIComponent(said)}`
      )
    );
  }
  if (!STATUSES.includes(status)) return;

  try {
    // world_published_has_timestamp: the pair must move together or the CHECK
    // refuses the row. Doing it in one statement is what keeps that honest.
    await query(
      `update world
          set status = $2::world_status,
              published_at = case when $2 = 'published'
                                  then coalesce(published_at, now())
                                  else null end
        where id = $1`,
      [id, status]
    );
  } catch (err) {
    const refusal = err as { message?: string; hint?: string };
    const said = [refusal?.message ?? String(err), refusal?.hint]
      .filter(Boolean)
      .join(" ");
    await recordAction(staff, {
      action: "destination.status_refused",
      entityTable: "world",
      entityId: id,
      summary: `refused → ${status}`,
      detail: { status, refusal: said },
    });
    redirect(
      carryReview(
        form,
        `/desk/destinations/${id}?refused=${encodeURIComponent(said)}`
      )
    );
  }

  await recordAction(staff, {
    action: "destination.status_changed",
    entityTable: "world",
    entityId: id,
    summary: `→ ${status}`,
    detail: { status },
  });

  revalidatePath("/desk/destinations");
  revalidatePath(`/desk/destinations/${id}`);
}

/**
 * CLOSING A ROOM, WITH THE REASON ATTACHED.
 *
 * The only door from the desk into `status = 'retired'`, and the reason it is
 * a separate action rather than a third value on the status button: a
 * retirement is not a status change with a different word in it. It is an
 * ADJUDICATION, and CLAUDE.md rule 17 says an adjudication that arrives without
 * its opinion is not one. db/028 retired Cap Ferrat and the argument lived in a
 * SQL comment, so "folded into Côte d'Azur" had to be reconstructed out of a
 * conversation a year later. That is the failure this function exists to make
 * impossible from here.
 *
 * ── ONE STATEMENT, WHICH IS THE RULE'S OWN WORDING ──────────────────
 *
 * "every transition writes WHY, in the same statement that writes the status".
 * The status, the note and the lineage move together in one UPDATE — not
 * because it is tidier, but because db/042's CHECK is evaluated per row per
 * statement: split into two statements, the first one is a retirement with no
 * reason and the database refuses it. The rule and the mechanism agree, which
 * is what makes this the easy path rather than the disciplined one.
 *
 * `published_at` is nulled in the same breath, because
 * `world_published_has_timestamp` (db/001) is an IFF and would refuse the row
 * otherwise. The retirement note is NOT nulled on the way back out — see
 * db/042 — which is the asymmetry between STATE and RECORD.
 *
 * ── WHAT IS VALIDATED HERE AND WHAT IS LEFT TO THE DATABASE ─────────
 *
 * `retirementFrom` refuses a blank reason and a room folded into itself, in
 * words a curator can act on, before any query runs. Everything else — a
 * successor that does not exist, a successor deleted underneath her — is the
 * database's to refuse, and its refusal is shown VERBATIM, the same rule
 * db/019's voice guard is handled under a few functions up.
 */
export async function retireDestination(form: FormData): Promise<void> {
  const staff = await requireStaff();
  const id = String(form.get("id") ?? "");

  const draft = retirementFrom(
    String(form.get("retirement_note") ?? ""),
    String(form.get("superseded_by") ?? ""),
    id
  );

  const refuse = async (said: string) => {
    await recordAction(staff, {
      action: "destination.retirement_refused",
      entityTable: "world",
      entityId: id,
      summary: "refused → retired",
      detail: { refusal: said },
    });
    redirect(
      carryReview(
        form,
        `/desk/destinations/${id}?refused=${encodeURIComponent(said)}`
      )
    );
  };

  // `refuse` redirects, which throws, so the return below never runs. It is
  // written anyway because the compiler cannot know that, and the alternative
  // is a non-null assertion on the line after — which is the same claim made
  // where nothing can check it.
  if (draft.error !== null) {
    await refuse(draft.error);
    return;
  }
  const record = draft.value;

  try {
    await query(
      `update world
          set status = 'retired',
              published_at = null,
              retirement_note = $2,
              superseded_by = $3
        where id = $1`,
      [id, record.note, record.successorId]
    );
  } catch (err) {
    const refusal = err as { message?: string; hint?: string };
    await refuse(
      [refusal?.message ?? String(err), refusal?.hint].filter(Boolean).join(" ")
    );
  }

  await recordAction(staff, {
    action: "destination.retired",
    entityTable: "world",
    entityId: id,
    // The reason travels into the ledger as well as into the column. The column
    // is what the desk renders; the ledger is what says WHO decided and when,
    // which the column cannot hold and db/027 exists to answer.
    summary: `→ retired — ${record.note}`,
    detail: {
      status: "retired",
      retirement_note: record.note,
      superseded_by: record.successorId,
    },
  });

  revalidatePath("/desk/destinations");
  revalidatePath(`/desk/destinations/${id}`);
  redirect(carryReview(form, `/desk/destinations/${id}`));
}

/* ── the voice ──────────────────────────────────────────────────────── */

export type VoiceState = { error: string | null; hint: string | null };

/**
 * The message a curator sees when the database refuses a publish.
 *
 * Shown VERBATIM, with the hint. validate_voice() names the missing field and
 * explains itself ("a published voice needs at least three exemplar lines" …
 * "Examples steer a generated line further than adjectives do"), and rewriting
 * that into something friendlier would make it less true. There is deliberately
 * no second copy of those rules in TypeScript.
 */
function dbError(err: unknown): VoiceState {
  const error = err as { message?: string; hint?: string };
  return {
    error: error?.message ?? String(err),
    hint: error?.hint ?? null,
  };
}

/** Copy the published voice into a fresh draft. The ONLY way to revise one. */
export async function startVoiceDraft(form: FormData): Promise<void> {
  const staff = await requireStaff();
  const worldId = String(form.get("world_id") ?? "");

  const existing = await queryOne<{ id: string }>(
    `select id from world_voice where world_id = $1 and status = 'draft'`,
    [worldId]
  );
  if (existing) {
    redirect(carryReview(form, `/desk/destinations/${worldId}/voice`));
  }

  await query(
    `insert into world_voice (world_id, voice, status, authored_by, note)
     select $1,
            coalesce((select v.voice from world_voice v
                       where v.world_id = $1 and v.status = 'published'),
                     '{}'::jsonb),
            'draft', $2,
            case when exists (select 1 from world_voice v
                               where v.world_id = $1 and v.status = 'published')
                 then 'Started from the version in force.'
                 else 'First voice.' end`,
    [worldId, staff.email]
  );

  await recordAction(staff, {
    action: "voice.draft_started",
    entityTable: "world",
    entityId: worldId,
    summary: "Started a new voice draft",
  });

  revalidatePath(`/desk/destinations/${worldId}/voice`);
  redirect(carryReview(form, `/desk/destinations/${worldId}/voice`));
}

export async function saveVoiceDraft(
  _previous: VoiceState,
  form: FormData
): Promise<VoiceState> {
  const staff = await requireStaff();
  const worldId = String(form.get("world_id") ?? "");
  const voiceId = String(form.get("voice_id") ?? "");
  const publish = String(form.get("intent") ?? "") === "publish";

  const voice = voiceFromForm(form);
  const note = String(form.get("note") ?? "").trim();

  try {
    // The status move and the text land in ONE statement. db/004's trigger
    // validates on the transition into 'published' and supersedes the previous
    // version in the same step, so there is no window where two are in force.
    await query(
      `update world_voice
          set voice = $2::jsonb,
              note = $3,
              authored_by = $4,
              status = case when $5 then 'published'::voice_status else status end
        where id = $1 and status = 'draft'`,
      [voiceId, JSON.stringify(voice), note, staff.email, publish]
    );
  } catch (err) {
    return dbError(err);
  }

  const version = await queryOne<{ version: number }>(
    `select version from world_voice where id = $1`,
    [voiceId]
  );

  await recordAction(staff, {
    action: publish ? "voice.published" : "voice.draft_saved",
    entityTable: "world_voice",
    entityId: voiceId,
    summary: publish
      ? `Published voice v${version?.version ?? "?"}`
      : `Saved voice draft v${version?.version ?? "?"}`,
    detail: { worldId, note },
  });

  revalidatePath(`/desk/destinations/${worldId}/voice`);
  revalidatePath(`/desk/destinations/${worldId}`);
  return { error: null, hint: null };
}

/** A draft is workspace. Deleting one is legal; deleting anything else is not. */
export async function discardVoiceDraft(form: FormData): Promise<void> {
  const staff = await requireStaff();
  const worldId = String(form.get("world_id") ?? "");
  const voiceId = String(form.get("voice_id") ?? "");

  await query(`delete from world_voice where id = $1 and status = 'draft'`, [
    voiceId,
  ]);

  await recordAction(staff, {
    action: "voice.draft_discarded",
    entityTable: "world",
    entityId: worldId,
    summary: "Discarded a voice draft",
  });

  revalidatePath(`/desk/destinations/${worldId}/voice`);
  redirect(carryReview(form, `/desk/destinations/${worldId}/voice`));
}
