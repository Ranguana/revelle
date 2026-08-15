"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { query, queryOne } from "@/lib/db";
import { setTags, validFacetIds } from "@/lib/desk/facets";
import { slugify } from "@/lib/desk/labels";
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

const STATUSES = ["draft", "published", "retired"];

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
  redirect(`/desk/destinations/${worldId}?saved=1`);
}

export async function setDestinationStatus(form: FormData): Promise<void> {
  const staff = await requireStaff();
  const id = String(form.get("id") ?? "");
  const status = String(form.get("status") ?? "");
  if (!STATUSES.includes(status)) return;

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
    redirect(`/desk/destinations/${worldId}/voice`);
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
  redirect(`/desk/destinations/${worldId}/voice`);
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
  redirect(`/desk/destinations/${worldId}/voice`);
}
