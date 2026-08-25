"use server";

/**
 * EVERYTHING SHE CAN DO TO THE CORRESPONDENCE.
 *
 * Every action re-guards. `requireMember()` is called first in each one and
 * the Revelle is re-resolved against her id, because a Server Action is its
 * own entry point and is reachable without anybody rendering the page whose
 * form contains it — the same rule the portal layout's comment states.
 *
 * ── WHAT THESE RETURN ────────────────────────────────────────────────
 *
 * A sentence, or nothing. Never a code, never a stack, and never a thrown
 * error rendered as a red box: the desk's convention, and the right one here
 * too. "The writing desk is not open." is something she can act on. "500" is
 * not.
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireMember } from "@/lib/members";
import { composePlain } from "@/lib/correspondence/plain";
import { choiceFor, factsFrom } from "@/lib/correspondence/pieces";
import { deliver } from "@/lib/correspondence/mail";
import {
  addGuest,
  addHerDraft,
  addHouseDraft,
  currentDraft,
  listGuests,
  markSent,
  readCorrespondent,
  readPiece,
  recordSend,
  rejectedLines,
  recipientsFor,
  removeGuest,
  setReply,
  startPiece,
} from "@/lib/correspondence/store";
import { canWrite, writePiece } from "@/lib/correspondence/writer";
import type { PlainRequest, VoicedRequest } from "@/lib/correspondence/types";
import { queryOne } from "@/lib/db";

export type ComposeState = { error: string | null };

function trimmed(form: FormData, key: string): string {
  return String(form.get(key) ?? "").trim();
}

/** The room, or a redirect out of it. One answer for not-hers and not-there. */
async function room(revelleId: string) {
  const member = await requireMember();
  const correspondent = await readCorrespondent(member.id, revelleId);
  if (!correspondent) redirect("/portal");
  return { member, correspondent };
}

function back(revelleId: string): string {
  return `/portal/occasions/${revelleId}/correspondence`;
}

/* ── the guest list ──────────────────────────────────────────────────── */

export async function addGuestAction(form: FormData): Promise<void> {
  const revelleId = trimmed(form, "revelleId");
  const { correspondent } = await room(revelleId);

  const name = trimmed(form, "name");
  if (name.length === 0) return;

  // An address is optional and an unusable one is worse than none: a guest
  // whose address does not parse would sit on the list looking like a
  // recipient and silently never be one.
  const email = trimmed(form, "email");
  const usable =
    email.length > 0 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ? email : null;

  await addGuest(correspondent.revelleId, name, usable, trimmed(form, "note"));
  revalidatePath(back(revelleId));
}

export async function removeGuestAction(form: FormData): Promise<void> {
  const revelleId = trimmed(form, "revelleId");
  const { correspondent } = await room(revelleId);
  await removeGuest(correspondent.revelleId, trimmed(form, "guestId"));
  revalidatePath(back(revelleId));
}

export async function setReplyAction(form: FormData): Promise<void> {
  const revelleId = trimmed(form, "revelleId");
  const { correspondent } = await room(revelleId);
  const reply = trimmed(form, "reply");
  if (reply !== "unknown" && reply !== "coming" && reply !== "not_coming") return;
  await setReply(correspondent.revelleId, trimmed(form, "guestId"), reply);
  revalidatePath(back(revelleId));
}

/* ── composing ───────────────────────────────────────────────────────── */

/**
 * WRITE ONE PIECE.
 *
 * The branch on `choice.route` is the only place the two roads meet, and they
 * part again immediately: a plain piece never reaches `writePiece` (its
 * argument type forbids it), and a voiced piece never reaches `composePlain`
 * (which has no voice to be given). See src/lib/correspondence/types.ts.
 */
export async function composeAction(
  _previous: ComposeState,
  form: FormData
): Promise<ComposeState> {
  const revelleId = trimmed(form, "revelleId");
  const { correspondent } = await room(revelleId);

  const { destination, days } = correspondent;
  const ask = trimmed(form, "ask");
  const facts = factsFrom(String(form.get("facts") ?? ""));

  if (ask.length === 0 && facts.length === 0) {
    return { error: "Say what it has to carry, and the house will write it." };
  }

  // A destination with no published voice has nothing to write with. Said in
  // words a curator or a member can act on, before anything is attempted.
  if (!destination) {
    return {
      error:
        `${correspondent.destinationName} has no published voice yet. ` +
        `Nothing can be written in it until one is published.`,
    };
  }

  if (days === null) {
    // Same gap the page handles by withholding the day-numbered choices. If
    // one is submitted anyway, refuse it by name rather than defaulting the
    // count — CLAUDE.md rule 16: never absorb input you cannot honour.
    return {
      error:
        "We cannot tell how many days this occasion runs, so the pieces that " +
        "depend on the count are not available. Nothing has been lost; it has " +
        "been raised with us.",
    };
  }

  const choice = choiceFor(destination.voice, days, trimmed(form, "choice"));
  if (!choice) return { error: "Choose what it is first." };

  if (choice.route === "plain") {
    const request: PlainRequest = {
      route: "plain",
      reason: choice.reason ?? "",
      ask,
      facts,
    };
    const id = await startPiece(
      correspondent.revelleId,
      request,
      composePlain(request),
      null,
      null
    );
    revalidatePath(back(revelleId));
    redirect(`${back(revelleId)}/${id}`);
  }

  if (!canWrite()) {
    return {
      error:
        "The writing desk is not open. Anything a guest has to act on can " +
        "still go out plain.",
    };
  }

  const request: VoicedRequest = {
    route: "voiced",
    kind: choice.kind!,
    ask,
    facts,
    dayIndex: choice.kind === "bulletin" ? await nextMorning(correspondent.revelleId) : null,
    maxWords: choice.maxWords,
  };

  let written;
  try {
    written = await writePiece(destination, request);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Nothing came back." };
  }

  const voiceId = await pinnedVoiceId(correspondent.revelleId);
  const id = await startPiece(
    correspondent.revelleId,
    request,
    written.body,
    voiceId,
    written.model
  );
  revalidatePath(back(revelleId));
  redirect(`${back(revelleId)}/${id}`);
}

/**
 * SAY IT DIFFERENTLY.
 *
 * A new house draft replacing the one she turned down — never an update. Every
 * line she has already declined goes back to the writer as what it was, so the
 * second attempt is a second attempt rather than the same request made twice.
 */
export async function againAction(form: FormData): Promise<void> {
  const revelleId = trimmed(form, "revelleId");
  const pieceId = trimmed(form, "pieceId");
  const { member, correspondent } = await room(revelleId);

  const piece = await readPiece(member.id, correspondent.revelleId, pieceId);
  if (!piece || piece.plain) return;
  const current = currentDraft(piece);
  if (!current || !correspondent.destination || !canWrite()) return;

  const request: VoicedRequest = {
    route: "voiced",
    kind: piece.kind as VoicedRequest["kind"],
    ask: piece.ask,
    facts: piece.facts,
    dayIndex: piece.dayIndex,
    maxWords: null,
  };

  const turnedDown = [...rejectedLines(piece), current.body];

  try {
    const written = await writePiece(
      correspondent.destination,
      request,
      turnedDown
    );
    await addHouseDraft(
      piece.id,
      written.body,
      current.id,
      await pinnedVoiceId(correspondent.revelleId),
      written.model
    );
  } catch {
    // Nothing was written, so nothing is recorded. She still has the line she
    // had, which is the safe failure: the page re-renders unchanged.
  }
  revalidatePath(`${back(revelleId)}/${pieceId}`);
}

/**
 * HER WORDS.
 *
 * Recorded ALONGSIDE the house's, never over them. The pair is the corpus —
 * see the essay at the top of db/024 and the `voice_signal` view it ends on.
 */
export async function editAction(form: FormData): Promise<void> {
  const revelleId = trimmed(form, "revelleId");
  const pieceId = trimmed(form, "pieceId");
  const { member, correspondent } = await room(revelleId);

  const body = String(form.get("body") ?? "").trim();
  if (body.length === 0) return;

  const piece = await readPiece(member.id, correspondent.revelleId, pieceId);
  if (!piece) return;
  const current = currentDraft(piece);
  if (!current || current.body === body) return;

  await addHerDraft(piece.id, body, current.id);
  revalidatePath(`${back(revelleId)}/${pieceId}`);
}

/* ── sending ─────────────────────────────────────────────────────────── */

/**
 * SEND, and the guardrails around it.
 *
 * Three, and none of them is a warning:
 *
 *   · The words that go are the ones on the page. `draftId` is submitted from
 *     the form that rendered them, and a mismatch with what is now current
 *     stops the send — she cannot send a line she has not read.
 *   · The recipients are named. This action is reachable only from a
 *     confirmation panel that lists every address it is about to use, and it
 *     re-derives them here rather than trusting a hidden field.
 *   · One person is a first-class case, not an afterthought: `to` is either an
 *     address or the word everyone, and there is no default.
 */
export async function sendAction(form: FormData): Promise<void> {
  const revelleId = trimmed(form, "revelleId");
  const pieceId = trimmed(form, "pieceId");
  const { member, correspondent } = await room(revelleId);

  const piece = await readPiece(member.id, correspondent.revelleId, pieceId);
  if (!piece) return;
  const current = currentDraft(piece);
  if (!current) return;

  // The words she read. If the piece has moved on since the page rendered,
  // nothing goes.
  if (trimmed(form, "draftId") !== current.id) {
    redirect(`${back(revelleId)}/${pieceId}?stale=1`);
  }

  const guests = await listGuests(correspondent.revelleId);
  const to = trimmed(form, "to");
  const recipients = recipientsFor(guests, to);
  if (recipients.length === 0) {
    redirect(`${back(revelleId)}/${pieceId}?nobody=1`);
  }

  const deliveries = await deliver(
    piece.plain ? null : correspondent.destination,
    piece.plain,
    current.body,
    recipients,
    member.email
  );

  let anyLanded = false;
  for (const delivery of deliveries) {
    await recordSend(
      piece.id,
      current.id,
      delivery.recipient.guestId,
      delivery.recipient.email,
      delivery.providerId,
      delivery.error
    );
    if (delivery.error === null) anyLanded = true;
  }
  if (anyLanded) await markSent(piece.id);

  revalidatePath(`${back(revelleId)}/${pieceId}`);
  redirect(`${back(revelleId)}/${pieceId}`);
}

/* ── small reads ─────────────────────────────────────────────────────── */

/** The voice this Revelle was issued in. Never the destination's current one. */
async function pinnedVoiceId(revelleId: string): Promise<string | null> {
  const row = await queryOne<{ voice_id: string | null }>(
    `select voice_id from revelle where id = $1`,
    [revelleId]
  );
  return row?.voice_id ?? null;
}

/**
 * WHICH MORNING THIS BULLETIN IS.
 *
 * The next one after the last that was written, rather than a field she has to
 * fill in. A getaway's mornings arrive in order and she writes them in order;
 * asking her to number them would be asking her to do the system's arithmetic.
 */
async function nextMorning(revelleId: string): Promise<number> {
  const row = await queryOne<{ next: number }>(
    `select coalesce(max(day_index), 0) + 1 as next
       from correspondence
      where revelle_id = $1 and piece = 'bulletin'`,
    [revelleId]
  );
  return row?.next ?? 1;
}
