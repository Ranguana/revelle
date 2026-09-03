/**
 * THE IMAGE BANK — reading a reference photograph, and what may be done with
 * what comes back.
 *
 * Founder, 2026-09-02: "id need to see it on the dashboard somewhere to okay
 * it. also the image bank should be a droppable area on a tab on the desk so
 * Tara and I can drop images".
 *
 * ── WHAT LIVES HERE AND WHY IT IS FRAMEWORK-FREE ────────────────────
 *
 * Everything on /desk/images that is a DECISION rather than a query: what a
 * dropped file has to be before it is kept, what the model is asked, how its
 * reply is read, which stage a picture is at, and what a bank row made from an
 * approved placement looks like. No SQL, no React, no `server-only`, no `@/`.
 *
 * Two callers, and that is the whole reason for the shape:
 *
 *   src/app/desk/(signed-in)/images/*  — the screen and its actions
 *   scripts/mood-board.mjs             — the CLI that did this first
 *
 * The script is a plain node file. It imports this module BY PATH, with the
 * `.ts` extension, exactly as it already imports ../src/lib/destinations.ts
 * and ../src/lib/model.ts. So nothing here may use a specifier only a bundler
 * can resolve — that is not a style rule, it is what keeps CLAUDE.md rule 21
 * true of the prompt: THE PROMPT HAS ONE OWNER AND THIS IS IT. Two copies of
 * "judge the object, not the styling" would drift, and the drift would be
 * invisible: both surfaces would still return placements, and only the
 * catalogue would slowly disagree with itself.
 *
 * ── THE IMAGES ARE OTHER PEOPLE'S PHOTOGRAPHS ───────────────────────
 *
 * Said here and in db/056 and in the view route, at all three places somebody
 * would write the wrong code. A reference image is PRIVATE, STAFF-ONLY
 * REFERENCE. It may be shown to a signed-in member of STAFF_EMAILS and to
 * nobody else — never the portal, never an artifact, never an export, never an
 * email, never a member surface of any kind.
 *
 * WHAT MAY LEAVE IS THE TEXT. `bank_clause` is the house's own words about an
 * object, written in the bank's syntax; that is the only thing an approval
 * copies forward and the only thing a member could ever see. The picture stays
 * on the desk.
 *
 * ── AND A SCRIPT MAY NOT SIGN A CLAIM ABOUT A ROOM ──────────────────
 *
 * CLAUDE.md rule 13. Nothing in this module writes anything. `readingFrom`
 * produces a PROPOSAL; `bankDraftFrom` produces the SHAPE of a row and not the
 * row. A staff click is what turns either into a database write, and what it
 * writes is always a draft carrying the founder's own question — which is how
 * the 179 existing machine-drafted proposals are held, by the same marker, in
 * the same column.
 */

import { createHash } from "node:crypto";

import { DESTINATIONS } from "../destinations.ts";

/* ══ 1 · WHAT A DROPPED FILE HAS TO BE ═══════════════════════════════ */

/**
 * The four the reader accepts. Everything is re-encoded on the way in, so this
 * list is about what can be DECODED, not about what is stored.
 *
 * It matches scripts/mood-board.mjs's MIME table minus nothing, and matches
 * what the model's image block accepts — which is the real constraint, since a
 * file this list admits and the API refuses would be a picture in the bank
 * that can never be read.
 */
export const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;
export type AcceptedType = (typeof ACCEPTED_TYPES)[number];

/**
 * What is written to the row. One value, and it is not a placeholder for a
 * future three: the stored copy is a downscaled JPEG because these are
 * photographs of objects, the column's CHECK in db/056 is wider so that
 * keeping PNG for line art later is a code change and not a migration.
 */
export const STORED_TYPE = "image/jpeg" as const;

/**
 * The cap, on the ORIGINAL upload.
 *
 * 25MB is roughly a 24-megapixel phone photograph at full quality and well
 * past anything a saved pin weighs. It is a guard against a video renamed
 * `.jpg` and against a browser tab that would otherwise sit on a 400MB post,
 * not an opinion about photography.
 */
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

/** Longest edge of the stored copy. */
export const LONG_EDGE = 1600;
/** Longest edge of the card copy in `thumb`. */
export const THUMB_EDGE = 480;

/**
 * MAGIC BYTES, BECAUSE A CONTENT TYPE IS WHATEVER THE BROWSER SAID.
 *
 * The `type` on a File comes from the operating system's guess about an
 * extension. It is not evidence, it is a label, and a route that trusts it is
 * a route that will decode an arbitrary upload as an image one day. So a file
 * has to pass BOTH: a declared type this house accepts, and a header that says
 * the same thing.
 *
 * Refusing the disagreement rather than preferring the sniff is deliberate.
 * When the two differ, what happened is either a renamed file or a confused
 * browser, and neither is a thing to guess about silently (rule 16) — the
 * refusal names both readings, so the person holding the file can see which
 * half was wrong.
 */
const SIGNATURES: readonly {
  type: AcceptedType;
  at: number;
  bytes: readonly number[];
  /** WEBP carries "RIFF" then four size bytes then "WEBP" — two windows. */
  also?: { at: number; bytes: readonly number[] };
}[] = [
  { type: "image/jpeg", at: 0, bytes: [0xff, 0xd8, 0xff] },
  {
    type: "image/png",
    at: 0,
    bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  },
  {
    type: "image/webp",
    at: 0,
    bytes: [0x52, 0x49, 0x46, 0x46],
    also: { at: 8, bytes: [0x57, 0x45, 0x42, 0x50] },
  },
  { type: "image/gif", at: 0, bytes: [0x47, 0x49, 0x46, 0x38] },
];

/** How many bytes `sniffImage` needs. Nothing may read fewer and believe it. */
export const SNIFF_BYTES = 12;

/** What the bytes themselves say this is, or null. */
export function sniffImage(head: Uint8Array): AcceptedType | null {
  for (const signature of SIGNATURES) {
    if (!matches(head, signature.at, signature.bytes)) continue;
    if (signature.also && !matches(head, signature.also.at, signature.also.bytes)) {
      continue;
    }
    return signature.type;
  }
  return null;
}

function matches(head: Uint8Array, at: number, bytes: readonly number[]): boolean {
  if (head.length < at + bytes.length) return false;
  for (let index = 0; index < bytes.length; index += 1) {
    if (head[at + index] !== bytes[index]) return false;
  }
  return true;
}

export type UploadCheck =
  | { ok: true; type: AcceptedType }
  | { ok: false; refusal: string };

/**
 * Is this a picture, and may it be kept?
 *
 * `declared` is the browser's `File.type`; `head` is the first SNIFF_BYTES of
 * the file. Both are required — see MAGIC BYTES above for why neither alone
 * is enough.
 */
export function checkUpload(input: {
  filename: string;
  declared: string;
  size: number;
  head: Uint8Array;
}): UploadCheck {
  const name = input.filename.trim() || "that file";

  if (input.size <= 0) {
    return { ok: false, refusal: `${name} is empty.` };
  }
  if (input.size > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      refusal:
        `${name} is ${megabytes(input.size)}MB, and the bank takes ` +
        `${megabytes(MAX_UPLOAD_BYTES)}MB at most. It is a reference ` +
        `photograph, not a master.`,
    };
  }

  const declared = normaliseType(input.declared);
  const sniffed = sniffImage(input.head);

  if (declared === null && sniffed === null) {
    return {
      ok: false,
      refusal:
        `${name} is not a JPEG, PNG, WebP or GIF — neither what the browser ` +
        `called it ("${input.declared || "nothing"}") nor what is actually in ` +
        `it says so. Only pictures go in the image bank.`,
    };
  }
  if (sniffed === null) {
    return {
      ok: false,
      refusal:
        `${name} says it is ${declared}, and its first bytes are not any ` +
        `image this house reads. A file renamed to .jpg is still whatever it ` +
        `was.`,
    };
  }
  if (declared === null) {
    return {
      ok: false,
      refusal:
        `${name} came through as "${input.declared || "nothing"}", which is ` +
        `not a picture, although its bytes look like ${sniffed}. Nothing is ` +
        `guessed here — rename it and drop it again.`,
    };
  }
  if (declared !== sniffed) {
    return {
      ok: false,
      refusal:
        `${name} calls itself ${declared} and its bytes say ${sniffed}. One ` +
        `of the two is wrong and this does not pick.`,
    };
  }

  return { ok: true, type: sniffed };
}

function megabytes(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, "");
}

/** `image/jpg` is not a media type and half the world sends it anyway. */
function normaliseType(raw: string): AcceptedType | null {
  const value = raw.trim().toLowerCase().split(";")[0];
  const fixed = value === "image/jpg" ? "image/jpeg" : value;
  return (ACCEPTED_TYPES as readonly string[]).includes(fixed)
    ? (fixed as AcceptedType)
    : null;
}

/**
 * THE DEDUPE KEY — over the bytes AS UPLOADED.
 *
 * Two curators save from the same feed and the same person drops a folder
 * twice; the same picture must be one row, one reading and one model call. It
 * is hashed BEFORE the downscale for db/056's reason: the resize is this
 * system's choice and would move with a library version, and a dedupe key that
 * moves when a dependency moves stops deduplicating without saying so.
 */
export function sha256Hex(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

/**
 * Which of these are new, in the order they arrived, first occurrence winning.
 *
 * Both halves matter and only one of them is obvious. `known` is what the
 * database already holds; the local `seen` is the SAME FILE TWICE IN ONE DROP,
 * which a per-file `insert … on conflict` would handle as two round trips and
 * two "already here" messages for one gesture.
 */
export function newDigests(
  known: ReadonlySet<string>,
  incoming: readonly string[]
): { fresh: string[]; duplicate: string[] } {
  const seen = new Set(known);
  const fresh: string[] = [];
  const duplicate: string[] = [];
  for (const digest of incoming) {
    if (seen.has(digest)) {
      duplicate.push(digest);
      continue;
    }
    seen.add(digest);
    fresh.push(digest);
  }
  return { fresh, duplicate };
}

/* ══ 2 · THE PROMPT ══════════════════════════════════════════════════ */

/**
 * WHAT THE READING IS ASKED, WORD FOR WORD.
 *
 * Lifted unchanged from scripts/mood-board.mjs, which is where it was written
 * and argued. Its header is the specification and stays the specification; the
 * only thing that changed is that the text now lives in one place instead of
 * being about to live in two.
 *
 * THE TWO RULES IT EXISTS TO ENFORCE, kept in front of whoever edits it:
 *
 *   JUDGE THE OBJECT, NOT THE STYLING. An oyster shell poured as a candle was
 *   dismissed as craft-fair because it was photographed on satin with pearls
 *   round it. The styling was 2024; the object was a shell with wax in it,
 *   which is as old as shells, and this catalogue already routes shells twice.
 *   A matcher that reads photographs instead of things makes that mistake on
 *   every image, so the prompt asks first and separately what the thing IS.
 *
 *   NO ROOM IS A VALID ANSWER, and it is said twice on purpose. A matcher that
 *   always finds a home has stopped measuring (rule 15), and forcing a fit is
 *   how the confetti got into Amalfi as a pan-Italian object that the
 *   country-not-room test then had to catch (rule 32).
 *
 * The rooms come from the registry rather than a list kept here (rule 19), so
 * a nineteenth room is matchable the day it is authored and nobody edits this.
 */
export function roomBrief(): string {
  return Object.entries(DESTINATIONS)
    .map(
      ([slug, room]) =>
        `- ${slug} — ${room.name}\n    ${room.tagline}\n    ${room.premise}`
    )
    .join("\n");
}

export function placementSystemPrompt(): string {
  return `You place objects from a mood board into a catalogue of eighteen authored
party destinations. Each room is a specific place in a specific year.

THE ROOMS:
${roomBrief()}

HOW TO READ AN IMAGE — this is the part people get wrong.

1. NAME THE OBJECT, NOT THE PHOTOGRAPH. Strip the styling: the backdrop, the
   props, the lighting, the era of the photography itself. A shell with wax in
   it photographed on satin with pearls is not a 2024 object; it is a shell
   with wax in it. Say what the thing IS in plain words, as if describing it to
   someone holding it.

2. THEN ask whether that OBJECT is plausible in a candidate room's year and
   place. A modern photograph of an old object is fine. An object that could
   not exist in the year, or belongs to a different country than the room, is
   not — a pan-Italian sweet is not an Amalfi-coast object, and a Campanian
   liqueur is not a Ligurian one. Region matters as much as period.

3. NO ROOM IS A CORRECT AND COMMON ANSWER. Many mood-board images are
   atmosphere with no object in them at all, or an object no room can claim.
   Say so. Do not stretch. A forced placement is worse than an empty one,
   because somebody then has to find it and take it out.

4. NEVER a brand name. If the image shows branded goods, name the generic
   object or refuse it.

5. Prefer THE EVENING SUPPLIES IT where it is true: an object the party
   already produces — the cork from a bottle opened anyway, a shell from the
   oysters served — rather than something bought and shipped in.

Reply as JSON only, no prose around it:
{
  "object": "what it is, plainly, styling stripped",
  "styling_note": "what about the photograph is period-wrong or misleading, if anything",
  "placements": [
    {"room": "<slug>", "as": "take_home | table_set | atmosphere | light | act | none",
     "why": "one sentence tying it to that room's premise or year",
     "confidence": "strong | possible | weak"}
  ],
  "no_room": false,
  "question": "the one thing a founder would have to decide before this ships",
  "bank_clause": "the item written in the bank's own syntax: '<lower-case name> — <take-home | table set | take-home and table set | atmosphere>, <what it is in a clause or two>, <one per guest | one per house | quantity>' — no FOUNDER-PENDING, that is added for you. Match the register of: 'the knife you learned on — take-home, a cheap wooden-handled oyster knife, one per person who joined the shucking, kept'"
}
If nothing fits, set no_room true and placements to [].`;
}

/** What the reading asks about one picture. */
export const PLACEMENT_ASK = "Place this, or refuse it.";

/* ══ 3 · READING THE REPLY ═══════════════════════════════════════════ */

/**
 * The model writes prose about objects for a living, and the prose it is best
 * at contains apostrophes, em dashes and quoted phrases — which is exactly
 * what makes hand-written JSON fragile. One image in three failed on the first
 * CLI run with "Expected ',' or ']'", and the reply was otherwise perfect.
 *
 * So: repair the two things that actually go wrong, and let the caller re-ask
 * once if the repair does not take. Throwing away a good reading of a
 * photograph over a trailing comma is the wrong trade when the retry costs one
 * call.
 */
export function parseReply(text: string): unknown {
  const block = text.match(/\{[\s\S]*\}/);
  if (!block) throw new Error(`no JSON in reply: ${text.slice(0, 200)}`);
  const raw = block[0];
  try {
    return JSON.parse(raw);
  } catch {
    // trailing commas before a close, and literal newlines inside strings
    const repaired = raw
      .replace(/,(\s*[}\]])/g, "$1")
      .replace(/"(?:[^"\\]|\\.)*"/g, (match) => match.replace(/\n/g, " "));
    return JSON.parse(repaired);
  }
}

/** The prompt's own vocabulary for what an object would be in a room. */
export const PLACEMENTS = [
  "take_home",
  "table_set",
  "atmosphere",
  "light",
  "act",
  "none",
] as const;
export type Placement = (typeof PLACEMENTS)[number];

export const PLACEMENT_LABEL: Readonly<Record<Placement, string>> = {
  take_home: "something they take home",
  table_set: "the table, dressed",
  atmosphere: "the atmosphere",
  light: "the light",
  act: "a host act",
  none: "nothing this room does",
};

/**
 * Which named slot an approved placement claims — db/043's four buckets.
 *
 * db/043's trigger gives every new bank row the slot
 * `bank_item_default_slot()` computes from its words, and that function stays
 * the authority for a row that makes NO claim. This map is not a second
 * authority over the same question: a row created here carries an explicit
 * claim, because the founder clicked a candidate whose placement is named on
 * the button. db/048 says in as many words that a claim carrying a curator's
 * own note is hers and is not overruled.
 *
 * `act` lands in `the_atmosphere` because there is no acts bucket — the four
 * are take-home, table set, light and the general one, and a host act that is
 * not a lighting is general. Said rather than guessed at.
 */
export const SLOT_FOR_PLACEMENT: Readonly<Record<Placement, string | null>> = {
  take_home: "the_take_home",
  table_set: "the_table_set",
  atmosphere: "the_atmosphere",
  light: "the_light",
  act: "the_atmosphere",
  none: null,
};

export const CONFIDENCES = ["strong", "possible", "weak"] as const;
export type Confidence = (typeof CONFIDENCES)[number];

export type CandidateDraft = {
  roomSlug: string;
  placement: Placement;
  confidence: Confidence;
  why: string;
  ordinal: number;
};

export type ReadingDraft = {
  object: string;
  stylingNote: string;
  noRoom: boolean;
  question: string;
  bankClause: string;
  candidates: CandidateDraft[];
};

export type ReadingResult =
  | { ok: true; reading: ReadingDraft }
  | { ok: false; refusal: string };

/**
 * The reply, turned into rows — or refused by name.
 *
 * ── WHAT IS DROPPED AND WHAT IS NOT ─────────────────────────────────
 *
 * A candidate naming a slug this catalogue does not have is KEPT, with its
 * slug as it was said. scripts/mood-board.mjs filtered those out because it
 * was writing a sheet for a person to read; a screen may not, because a
 * five-candidate reading rendered as four with nothing saying why is exactly
 * the silence rule 16 forbids. The screen shows it and refuses it in words,
 * and the approve button is simply not there.
 *
 * Same for `as: "none"`. It is the model saying "this object, but not as
 * anything this room does", which is information; it renders and cannot be
 * approved.
 *
 * ── AND `no_room` IS BELIEVED ───────────────────────────────────────
 *
 * If the reply says no room, the candidates are dropped and the count is
 * reported to the caller. A reply that says both — no_room true AND three
 * placements — is a reply that contradicts itself, and taking the refusal is
 * the reading that cannot invent a claim about a room.
 */
export function readingFrom(raw: unknown): ReadingResult {
  if (typeof raw !== "object" || raw === null) {
    return { ok: false, refusal: "The reply was not an object." };
  }
  const record = raw as Record<string, unknown>;

  const object = text(record.object);
  if (object.length === 0) {
    return {
      ok: false,
      refusal:
        "The reply named no object. Naming the thing with the photograph's " +
        "styling stripped off is the one instruction the prompt is built " +
        "around, so a reply without it is not a reading.",
    };
  }

  const noRoom = record.no_room === true;
  const candidates: CandidateDraft[] = [];

  if (!noRoom && Array.isArray(record.placements)) {
    for (const entry of record.placements) {
      if (typeof entry !== "object" || entry === null) continue;
      const item = entry as Record<string, unknown>;
      const roomSlug = text(item.room);
      if (roomSlug.length === 0) continue;
      const placement = oneOf(PLACEMENTS, item.as);
      const confidence = oneOf(CONFIDENCES, item.confidence);
      if (placement === null || confidence === null) continue;
      candidates.push({
        roomSlug,
        placement,
        confidence,
        why: text(item.why),
        ordinal: candidates.length,
      });
    }
  }

  return {
    ok: true,
    reading: {
      object,
      stylingNote: text(record.styling_note),
      noRoom: noRoom || candidates.length === 0,
      question: text(record.question),
      bankClause: text(record.bank_clause),
      candidates: noRoom ? [] : candidates,
    },
  };
}

function text(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function oneOf<T extends string>(
  allowed: readonly T[],
  value: unknown
): T | null {
  if (typeof value !== "string") return null;
  const found = allowed.find((item) => item === value.trim().toLowerCase());
  return found ?? null;
}

/* ══ 4 · WHERE A PICTURE STANDS ══════════════════════════════════════ */

export type StoredReading = { id: number; noRoom: boolean };
export type StoredVerdict = {
  id: number;
  readingId: number;
  verdict: "approved" | "refused";
};

/**
 * The four states a card can be in, and the one that is easy to get wrong.
 *
 * `staleVerdict` is that one. A picture read on Tuesday, refused on Tuesday
 * and read again on Friday has a verdict AND an unanswered reading, and those
 * are not the same card as "refused". Collapsing them would mean a refusal
 * silently covering a proposal she has never seen — which is the same defect
 * db/055 built three states to avoid, arriving through a different door.
 */
export type Stage =
  | { state: "unread" }
  | { state: "read"; noRoom: boolean }
  | { state: "approved"; staleVerdict: boolean }
  | { state: "refused"; staleVerdict: boolean };

export function stageOf(input: {
  reading: StoredReading | null;
  verdict: StoredVerdict | null;
}): Stage {
  const { reading, verdict } = input;
  if (reading === null) return { state: "unread" };
  if (verdict === null) return { state: "read", noRoom: reading.noRoom };
  const staleVerdict = verdict.readingId !== reading.id;
  return verdict.verdict === "approved"
    ? { state: "approved", staleVerdict }
    : { state: "refused", staleVerdict };
}

/** Plain words for the card, so no screen invents its own. */
export const STAGE_SAID: Readonly<Record<Stage["state"], string>> = {
  unread: "Not read yet",
  read: "Read — waiting on you",
  approved: "Approved into a room",
  refused: "Refused",
};

/**
 * Which pictures the batch read would touch, and NOTHING ELSE.
 *
 * Unread only. A refused picture is never re-read — that is what the refusal
 * is for — and an approved one has been answered. CLAUDE.md rule 24: the
 * caller reports this number against what it expected, because a batch that
 * matched nothing and a batch that matched everything look identical from
 * outside and fail in opposite directions.
 */
export function unread<T extends { stage: Stage }>(images: readonly T[]): T[] {
  return images.filter((image) => image.stage.state === "unread");
}

export type ApprovalCheck = { ok: true } | { ok: false; refusal: string };

/**
 * THE ROOM THE READING MEANT.
 *
 * Founder, on a reading that could not be approved: the model had named
 * `dolomites-1956` and `new-york-1938`, and neither is a slug.
 *
 * ── THE CAUSE IS OURS, NOT THE MODEL'S ───────────────────────────────
 *
 * `DESTINATIONS` does not agree with itself about whether a key carries the
 * year. Seven do — westhampton-1976, acapulco-1959, amalfi-1953, aspen-1994,
 * oaxaca-1954, palm-springs-1965, st-moritz-1984 — and eleven do not: havana,
 * las-vegas, new-york, nantucket, new-orleans, catskills, cote-dazur,
 * portofino, dolomites, big-sur, tahiti.
 *
 * So a model shown "DOLOMITES, 1956" beside a slug list where seven of
 * eighteen end in a year has no convention to follow, and picks one. It is
 * not hallucinating a room; it is resolving an ambiguity we left in the data,
 * and it picked the wrong half of a split that should not exist.
 *
 * ── WHY REPAIR HERE RATHER THAN RENAME THE KEYS ──────────────────────
 *
 * Renaming eleven keys would touch `world.slug` in production, every
 * `*_world` join row, every bank and dish claim written against them, and
 * every slug printed in a document. That is a migration with a long blast
 * radius to fix a naming inconsistency nobody is otherwise hurt by. The
 * ambiguity is cheap to absorb and expensive to remove.
 *
 * ── AND IT ONLY RESOLVES WHAT IS UNAMBIGUOUS ─────────────────────────
 *
 * Both directions are tried — the year stripped off, and the year added back
 * — and a match counts only if it lands on EXACTLY ONE known room. If a
 * future catalogue held both `aspen` and `aspen-1994`, this returns null and
 * the reading stays refused on screen, which is the honest answer. It never
 * guesses between two rooms (rule 32: symmetry is not evidence).
 */
export function resolveRoomSlug(
  named: string,
  knownSlugs: readonly string[]
): string | null {
  const wanted = named.trim().toLowerCase();
  if (!wanted) return null;

  const known = new Set(knownSlugs);
  if (known.has(wanted)) return wanted;

  const candidates = new Set<string>();

  // `dolomites-1956` -> `dolomites`
  const stripped = wanted.replace(/-\d{4}$/, "");
  if (stripped !== wanted && known.has(stripped)) candidates.add(stripped);

  // `westhampton` -> `westhampton-1976`, without needing to know the year
  for (const slug of knownSlugs) {
    if (slug.replace(/-\d{4}$/, "") === stripped) candidates.add(slug);
  }

  return candidates.size === 1 ? [...candidates][0] : null;
}

/**
 * May this candidate be approved into its room?
 *
 * Note what is NOT here. Confidence is not consulted: `weak` is a label she
 * reads, never a gate this module applies, and a screen that refused weak
 * candidates would be deciding on her behalf exactly where the evidence is
 * thinnest. Neither is the stage — re-approving after a refusal is the
 * correction rule 18 requires, and it writes another verdict rather than
 * being blocked.
 */
export function mayApprove(candidate: {
  placement: Placement;
  worldId: string | null;
  roomSlug: string;
}): ApprovalCheck {
  if (candidate.worldId === null) {
    return {
      ok: false,
      refusal:
        `The reading named "${candidate.roomSlug}", which is not a room in ` +
        `this catalogue. Nothing can be approved into it. The proposal is ` +
        `left on screen rather than hidden, because a dropped one looks the ` +
        `same as one that was never made.`,
    };
  }
  if (candidate.placement === "none") {
    return {
      ok: false,
      refusal:
        "The reading placed the object in this room as nothing the room " +
        "does. There is no bank row to make from that.",
    };
  }
  return { ok: true };
}

/* ══ 5 · THE BANK ROW AN APPROVAL WOULD MAKE ═════════════════════════ */

/**
 * The marker that holds a row in draft.
 *
 * ONE STRING, AND IT IS NOT SPELLED TWICE IN A PLACE THAT MATTERS. db/036's
 * SQL (`description not like '%FOUNDER-PENDING%'`), scripts/
 * catalogue-vocabulary.mjs's `FOUNDER_PENDING`, and this constant are the same
 * test, and a divergence would mean a row the migration would have held and
 * this screen offers. The three cannot import one another — one is SQL, one is
 * a script outside src/ — so images.test.ts reads the other two files and
 * fails if any of the three drifts. That is CLAUDE.md rule 21's guard going
 * through the consumers rather than comparing a function to itself.
 */
export const FOUNDER_PENDING = "FOUNDER-PENDING";

export type BankDraft = {
  /** The handle: the clause cut at its first em dash. */
  name: string;
  /** The record: the clause verbatim, then the founder's question. */
  description: string;
  /** `bank_kind`. */
  kind: "good" | "host_act";
  /** `bank_phase`. `all` means NO OPINION — see BANK_PHASES in labels.ts. */
  phase: "all";
};

export type BankDraftResult =
  | { ok: true; draft: BankDraft }
  | { ok: false; refusal: string };

/**
 * An approved placement, as the row it becomes.
 *
 * ── THE TWO RULES IT SHARES WITH scripts/seed-bank.mjs ──────────────
 *
 * Section 5 of that file, and this module holds itself to the same two:
 *
 *   name        = the clause, parentheticals removed, cut at the first em dash
 *   description = THE CLAUSE VERBATIM, whole, in its own punctuation
 *
 * "The name is a handle and the description is the record. Nothing the parser
 * shortens is lost, because the un-shortened line is in the row beside it."
 *
 * IT IS NOT THE SAME PARSER AND DOES NOT PRETEND TO BE. seed-bank reads a
 * 385-line prose document and needs peeled parentheses, extracted technique
 * cards, `Also at:` lines, gesture detection and an ellipsis refusal. What
 * arrives here is one clause emitted against a prompt that dictates its
 * syntax. Rebuilding that machinery over a different input would be a partial
 * unification that looks unified, which CLAUDE.md rule 21 says plainly is
 * worse than two honest paths. The two facts above are the ones that must
 * agree, they are cheap, and images.test.ts asserts them.
 *
 * ── AND WHY A MISSING QUESTION IS A REFUSAL ─────────────────────────
 *
 * The marker IS the hold-back. There is no list of held-back slugs anywhere —
 * the row knows it is held because the question is in its description. So a
 * reading that produced no question cannot produce a held row, and writing one
 * anyway would create a bank_item that the next `activate:catalogue` treats as
 * ordinary. Rule 13, and the failure would be silent in the worst direction:
 * a machine-proposed object going live because a field was empty.
 */
export function bankDraftFrom(input: {
  bankClause: string;
  question: string;
  placement: Placement;
  /** Where it came from, for the marker's parenthetical. */
  source: string;
}): BankDraftResult {
  const clause = input.bankClause.replace(/\s+/g, " ").trim().replace(/\.$/, "");
  if (clause.length === 0) {
    return {
      ok: false,
      refusal:
        "The reading wrote no bank clause, so there is nothing to put in the " +
        "room. Read the picture again, or write the row at /desk/bank.",
    };
  }

  const question = input.question.replace(/\s+/g, " ").trim();
  if (question.length === 0) {
    return {
      ok: false,
      refusal:
        `The reading asked no question, and the question is what holds the ` +
        `row in draft — a bank item is held because ${FOUNDER_PENDING} is in ` +
        `its description and for no other reason. Rather than write a row ` +
        `nothing would hold back, nothing is written. Read it again, or add ` +
        `the item at /desk/bank where you can say what is undecided.`,
    };
  }

  const name = nameFromClause(clause);
  if (name.length === 0) {
    return {
      ok: false,
      refusal:
        "Nothing is left of the clause once its parentheses come off, so " +
        "there is no name for the row.",
    };
  }

  const marker = `${FOUNDER_PENDING} — ${question} (${input.source})`;

  return {
    ok: true,
    draft: {
      name,
      description: `${clause}\n\n${marker}`,
      // An act is a host act; everything else is a good. `printed_card` is
      // never guessed at — db/031 makes a card the anchor of a self-reference
      // and a wrongly-typed one is a trigger failure on some other row's save.
      kind: input.placement === "act" ? "host_act" : "good",
      phase: "all",
    },
  };
}

/**
 * The clause's handle. seed-bank's rule, on a clause that has already been
 * normalised to one line: drop depth-zero parentheticals, cut at the first em
 * dash, and take the trailing punctuation off.
 */
export function nameFromClause(clause: string): string {
  const withoutParens = clause.replace(/\([^)]*\)/g, " ").replace(/\s+/g, " ");
  return withoutParens
    .split(" — ")[0]
    .trim()
    .replace(/[.,;:]+$/, "")
    .trim();
}

/** Does this row carry a question with the founder's name on it? */
export function carriesFounderQuestion(...texts: (string | null)[]): boolean {
  return texts.some(
    (value) => typeof value === "string" && value.includes(FOUNDER_PENDING)
  );
}
