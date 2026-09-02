import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import test from "node:test";

import {
  ACCEPTED_TYPES,
  FOUNDER_PENDING,
  MAX_UPLOAD_BYTES,
  PLACEMENTS,
  SLOT_FOR_PLACEMENT,
  SNIFF_BYTES,
  bankDraftFrom,
  carriesFounderQuestion,
  checkUpload,
  mayApprove,
  nameFromClause,
  newDigests,
  parseReply,
  placementSystemPrompt,
  readingFrom,
  sha256Hex,
  sniffImage,
  stageOf,
  unread,
  type Stage,
} from "./images.ts";

/**
 * THE INSTRUMENT, TESTED. THE VERDICTS ARE NOT — THERE ARE NONE TO TEST.
 *
 * Everything below is either a case this module would get wrong in a way
 * nothing else could catch, or one of the guards that exists to stop a later
 * edit turning an instrument into a ruling. The database this runs against is
 * unreachable from any laptop (CLAUDE.md rule 9), so calling the functions is
 * the only way to see them work before they meet production.
 *
 * `images.ts` reaches its one dependency by a relative path with the `.ts`
 * extension, so no alias hook is needed here — the same property that lets
 * scripts/mood-board.mjs import it.
 */

const ROOT = new URL("../../../", import.meta.url).pathname;

/* ══ what a dropped file has to be ═══════════════════════════════════ */

const JPEG_HEAD = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
const PNG_HEAD = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0,
]);
const GIF_HEAD = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0, 0, 0, 0, 0, 0]);
/** RIFF····WEBP — the two windows, which is why WebP is not one signature. */
const WEBP_HEAD = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
]);
/** RIFF····WAVE. A sound file. The first four bytes are a WebP's. */
const WAVE_HEAD = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x41, 0x56, 0x45,
]);

test("the four types are sniffed from their bytes", () => {
  assert.equal(sniffImage(JPEG_HEAD), "image/jpeg");
  assert.equal(sniffImage(PNG_HEAD), "image/png");
  assert.equal(sniffImage(GIF_HEAD), "image/gif");
  assert.equal(sniffImage(WEBP_HEAD), "image/webp");
});

test("RIFF alone is not a WebP — the second window is the whole point", () => {
  assert.equal(sniffImage(WAVE_HEAD), null);
});

test("a short read cannot be believed", () => {
  // Eight bytes is enough for a PNG and not for a WebP. Anything reading fewer
  // than SNIFF_BYTES would classify a WAVE as an image.
  assert.equal(sniffImage(WEBP_HEAD.subarray(0, 8)), null);
  assert.ok(SNIFF_BYTES >= 12);
});

test("a video renamed .jpg is refused, and the refusal names both readings", () => {
  const check = checkUpload({
    filename: "pin.jpg",
    declared: "image/jpeg",
    size: 4096,
    head: WAVE_HEAD,
  });
  assert.equal(check.ok, false);
  assert.match(check.ok ? "" : check.refusal, /first bytes are not any image/i);
});

test("a disagreement between the label and the bytes is refused, not resolved", () => {
  const check = checkUpload({
    filename: "shell.png",
    declared: "image/png",
    size: 4096,
    head: JPEG_HEAD,
  });
  assert.equal(check.ok, false);
  assert.match(
    check.ok ? "" : check.refusal,
    /calls itself image\/png and its bytes say image\/jpeg/
  );
});

test("image/jpg is not a media type and is accepted anyway", () => {
  const check = checkUpload({
    filename: "shell.jpg",
    declared: "image/jpg",
    size: 4096,
    head: JPEG_HEAD,
  });
  assert.deepEqual(check, { ok: true, type: "image/jpeg" });
});

test("empty and oversize are refused in words a person can act on", () => {
  const empty = checkUpload({
    filename: "x.jpg",
    declared: "image/jpeg",
    size: 0,
    head: JPEG_HEAD,
  });
  assert.equal(empty.ok, false);
  assert.match(empty.ok ? "" : empty.refusal, /is empty/);

  const big = checkUpload({
    filename: "x.jpg",
    declared: "image/jpeg",
    size: MAX_UPLOAD_BYTES + 1,
    head: JPEG_HEAD,
  });
  assert.equal(big.ok, false);
  assert.match(big.ok ? "" : big.refusal, /reference photograph, not a master/);
});

test("a PDF is refused on both halves at once", () => {
  const check = checkUpload({
    filename: "board.pdf",
    declared: "application/pdf",
    size: 900,
    head: new Uint8Array([0x25, 0x50, 0x44, 0x46, 0, 0, 0, 0, 0, 0, 0, 0]),
  });
  assert.equal(check.ok, false);
  assert.match(check.ok ? "" : check.refusal, /Only pictures go in the image bank/);
});

test("every accepted type can actually be sniffed", () => {
  // The mirror-image bug: a list that admits a type nothing can recognise
  // would refuse every file of it with a message about its own bytes.
  const sniffable = new Set(
    [JPEG_HEAD, PNG_HEAD, GIF_HEAD, WEBP_HEAD].map((head) => sniffImage(head))
  );
  for (const type of ACCEPTED_TYPES) assert.ok(sniffable.has(type), type);
});

/* ══ the dedupe ══════════════════════════════════════════════════════ */

test("the digest is sha-256 of the bytes, and it is stable", () => {
  assert.equal(
    sha256Hex(new Uint8Array([])),
    "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  );
  assert.equal(
    sha256Hex(new TextEncoder().encode("abc")),
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
  );
});

test("the same picture twice in one drop is one row", () => {
  const known = new Set(["a".repeat(64)]);
  const { fresh, duplicate } = newDigests(known, [
    "b".repeat(64),
    "b".repeat(64),
    "a".repeat(64),
    "c".repeat(64),
  ]);
  assert.deepEqual(fresh, ["b".repeat(64), "c".repeat(64)]);
  assert.equal(duplicate.length, 2);
});

/* ══ the prompt ══════════════════════════════════════════════════════ */

test("the prompt still says the two things it exists to say", () => {
  const prompt = placementSystemPrompt();
  assert.match(prompt, /NAME THE OBJECT, NOT THE PHOTOGRAPH/);
  assert.match(prompt, /NO ROOM IS A CORRECT AND COMMON ANSWER/);
  assert.match(prompt, /If nothing fits, set no_room true/);
});

test("the rooms come from the registry, not from a list beside the prompt", () => {
  // Rule 19. If a nineteenth room is authored and the prompt does not name it,
  // this fails — which is the only way anybody would find out.
  const prompt = placementSystemPrompt();
  assert.match(prompt, /- amalfi-1953 — /);
  assert.match(prompt, /- tahiti — /);
  const rooms = prompt.match(/^- [a-z0-9-]+ — /gm) ?? [];
  assert.ok(rooms.length >= 18, `${rooms.length} rooms in the prompt`);
});

test("THE PROMPT HAS ONE OWNER: mood-board.mjs imports it and holds no copy", () => {
  const script = readFileSync(`${ROOT}scripts/mood-board.mjs`, "utf8");
  assert.match(script, /placementSystemPrompt/);
  assert.ok(
    !script.includes("NAME THE OBJECT, NOT THE PHOTOGRAPH"),
    "scripts/mood-board.mjs has grown a second copy of the prompt. Two " +
      "copies drift invisibly — both surfaces go on returning placements and " +
      "only the catalogue disagrees with itself. CLAUDE.md rule 21."
  );
});

/* ══ reading the reply ═══════════════════════════════════════════════ */

test("a trailing comma does not lose a good reading of a photograph", () => {
  const raw = parseReply(`{"object": "a shell with wax in it", "no_room": false,}`);
  assert.deepEqual(raw, { object: "a shell with wax in it", no_room: false });
});

test("a reply with no JSON in it throws rather than returning nothing", () => {
  assert.throws(() => parseReply("I could not read this image."), /no JSON in reply/);
});

test("a reading that named no object is not a reading", () => {
  const result = readingFrom({ object: "   ", no_room: true });
  assert.equal(result.ok, false);
  assert.match(result.ok ? "" : result.refusal, /named no object/);
});

test("no_room is believed even when placements came with it", () => {
  const result = readingFrom({
    object: "a printed cotton napkin",
    no_room: true,
    placements: [
      { room: "amalfi", as: "table_set", why: "lemons", confidence: "strong" },
    ],
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.reading.noRoom, true);
  assert.deepEqual(result.reading.candidates, []);
});

test("an empty placement list IS a refusal, however the flag was set", () => {
  const result = readingFrom({ object: "a corner of a tablecloth", placements: [] });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.reading.noRoom, true);
});

test("a candidate naming a room this catalogue lacks is KEPT, not dropped", () => {
  const result = readingFrom({
    object: "a brass ice bucket",
    placements: [
      { room: "atlantis", as: "table_set", why: "—", confidence: "possible" },
      { room: "havana", as: "atmosphere", why: "—", confidence: "strong" },
    ],
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.reading.candidates.length, 2);
  assert.deepEqual(
    result.reading.candidates.map((c) => c.roomSlug),
    ["atlantis", "havana"]
  );
  assert.deepEqual(
    result.reading.candidates.map((c) => c.ordinal),
    [0, 1]
  );
});

test("a candidate with a placement outside the vocabulary is dropped", () => {
  const result = readingFrom({
    object: "a paper lantern",
    placements: [
      { room: "havana", as: "centrepiece", why: "—", confidence: "strong" },
      { room: "havana", as: "light", why: "—", confidence: "strong" },
    ],
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.reading.candidates.length, 1);
  assert.equal(result.reading.candidates[0].placement, "light");
  // Renumbered from zero, so `ordinal` is a display order and never an index
  // into whatever the model happened to send.
  assert.equal(result.reading.candidates[0].ordinal, 0);
});

/* ══ where a picture stands ══════════════════════════════════════════ */

test("the four stages", () => {
  assert.deepEqual(stageOf({ reading: null, verdict: null }), { state: "unread" });
  assert.deepEqual(
    stageOf({ reading: { id: 7, noRoom: false }, verdict: null }),
    { state: "read", noRoom: false }
  );
  assert.deepEqual(
    stageOf({
      reading: { id: 7, noRoom: false },
      verdict: { id: 1, readingId: 7, verdict: "approved" },
    }),
    { state: "approved", staleVerdict: false }
  );
  assert.deepEqual(
    stageOf({
      reading: { id: 7, noRoom: false },
      verdict: { id: 1, readingId: 7, verdict: "refused" },
    }),
    { state: "refused", staleVerdict: false }
  );
});

test("a verdict about an OLDER reading does not cover the newer one", () => {
  // The failure this catches is silent: a refusal from Tuesday quietly
  // standing over a proposal made on Friday that nobody has seen.
  const stage = stageOf({
    reading: { id: 9, noRoom: false },
    verdict: { id: 1, readingId: 7, verdict: "refused" },
  });
  assert.deepEqual(stage, { state: "refused", staleVerdict: true });
});

test("the batch read touches unread pictures and nothing else", () => {
  const stages: Stage[] = [
    { state: "unread" },
    { state: "read", noRoom: false },
    { state: "refused", staleVerdict: false },
    { state: "unread" },
    { state: "approved", staleVerdict: false },
  ];
  const images = stages.map((stage, index) => ({ id: index, stage }));
  const picked = unread(images);
  // CLAUDE.md rule 24: count it. A batch that matched everything and one that
  // matched nothing look identical from outside and fail in opposite
  // directions — the first re-reads what she already refused.
  assert.equal(picked.length, 2);
  assert.deepEqual(
    picked.map((image) => image.id),
    [0, 3]
  );
});

/* ══ approval ════════════════════════════════════════════════════════ */

test("a candidate whose room does not exist cannot be approved, and says why", () => {
  const check = mayApprove({
    placement: "table_set",
    worldId: null,
    roomSlug: "atlantis",
  });
  assert.equal(check.ok, false);
  assert.match(check.ok ? "" : check.refusal, /not a room in this catalogue/);
});

test("`as: none` is information and is not approvable", () => {
  const check = mayApprove({
    placement: "none",
    worldId: "0f7c8a5e-0000-4000-8000-000000000001",
    roomSlug: "havana",
  });
  assert.equal(check.ok, false);
});

test("A WEAK CANDIDATE IS APPROVABLE. Confidence is a label, never a gate", () => {
  // The temptation is strongest exactly where the evidence is thinnest, and a
  // screen that refused weak candidates would be deciding on her behalf there.
  // `mayApprove` does not take a confidence at all, which is the guard.
  const check = mayApprove({
    placement: "atmosphere",
    worldId: "0f7c8a5e-0000-4000-8000-000000000001",
    roomSlug: "havana",
  });
  assert.deepEqual(check, { ok: true });

  const source = readFileSync(new URL("./images.ts", import.meta.url), "utf8");
  const body = source.slice(source.indexOf("export function mayApprove"));
  const end = body.indexOf("\n}\n");
  assert.ok(
    !body.slice(0, end).includes("confidence"),
    "mayApprove has started reading confidence. It is a word the founder " +
      "reads, not a gate this module applies."
  );
});

/* ══ the bank row an approval would make ═════════════════════════════ */

const CLAUSE =
  "the knife you learned on — take-home, a cheap wooden-handled oyster " +
  "knife, one per person who joined the shucking, kept";

test("the name is the clause cut at its first em dash; the description is the clause whole", () => {
  const made = bankDraftFrom({
    bankClause: CLAUSE,
    question: "does the house ship knives, or is this the evening's own?",
    placement: "take_home",
    source: "reference image 9f2c…, /desk/images",
  });
  assert.equal(made.ok, true);
  if (!made.ok) return;

  // seed-bank.mjs section 5, the two facts the two paths must agree on.
  assert.equal(made.draft.name, "the knife you learned on");
  assert.ok(made.draft.description.startsWith(CLAUSE));
  assert.equal(made.draft.kind, "good");
  assert.equal(made.draft.phase, "all");
});

test("the founder's question rides into the description behind the marker", () => {
  const made = bankDraftFrom({
    bankClause: CLAUSE,
    question: "does the house ship knives?",
    placement: "take_home",
    source: "reference image 9f2c…, /desk/images",
  });
  assert.equal(made.ok, true);
  if (!made.ok) return;
  assert.match(made.draft.description, /FOUNDER-PENDING — does the house ship knives\?/);
  assert.ok(carriesFounderQuestion(made.draft.description));
});

test("NO QUESTION MEANS NO ROW. The marker is the only hold-back there is", () => {
  const made = bankDraftFrom({
    bankClause: CLAUSE,
    question: "   ",
    placement: "take_home",
    source: "x",
  });
  assert.equal(made.ok, false);
  assert.match(made.ok ? "" : made.refusal, /holds the row in draft/);
});

test("no clause means no row", () => {
  const made = bankDraftFrom({
    bankClause: "",
    question: "anything",
    placement: "take_home",
    source: "x",
  });
  assert.equal(made.ok, false);
});

test("an act becomes a host act; nothing ever becomes a printed card by guess", () => {
  const made = bankDraftFrom({
    bankClause: "somebody is sent to stir — atmosphere, the pot is checked by whoever is nearest",
    question: "whose act is this?",
    placement: "act",
    source: "x",
  });
  assert.equal(made.ok, true);
  if (!made.ok) return;
  assert.equal(made.draft.kind, "host_act");

  const card = bankDraftFrom({
    bankClause: "the technique card — printed card, how to open a coconut",
    question: "which room?",
    placement: "table_set",
    source: "x",
  });
  assert.equal(card.ok, true);
  if (!card.ok) return;
  assert.equal(card.draft.kind, "good");
});

test("parentheticals come off the name and stay in the record", () => {
  assert.equal(
    nameFromClause("the conch (pū) — object + act, lives on her shelf after"),
    "the conch"
  );
  assert.equal(nameFromClause("a bowl of shells,"), "a bowl of shells");
});

/* ══ the guards ══════════════════════════════════════════════════════ */

test("ONE MARKER, THREE FILES: db/036, catalogue-vocabulary.mjs, images.ts", () => {
  // These three cannot import one another — one is SQL, one is a script
  // outside src/. So the guard goes through the consumers (rule 21): a
  // divergence would mean a row db/036 would hold and this screen would offer.
  const sql = readFileSync(
    `${ROOT}db/036-pool-content-stocks-itself.sql`,
    "utf8"
  );
  const vocabulary = readFileSync(
    `${ROOT}scripts/catalogue-vocabulary.mjs`,
    "utf8"
  );
  assert.ok(sql.includes(`'%${FOUNDER_PENDING}%'`), "db/036 no longer tests for it");
  assert.ok(
    vocabulary.includes(`export const FOUNDER_PENDING = "${FOUNDER_PENDING}"`),
    "scripts/catalogue-vocabulary.mjs spells the marker differently"
  );
});

test("every placement maps to a slot db/043 actually created", () => {
  const sql = readFileSync(
    `${ROOT}db/043-atmosphere-reaches-a-package.sql`,
    "utf8"
  );
  for (const placement of PLACEMENTS) {
    const slot = SLOT_FOR_PLACEMENT[placement];
    if (slot === null) continue;
    assert.ok(
      sql.includes(`('${slot}',`),
      `${placement} claims the slot ${slot}, which db/043 does not create`
    );
  }
  // `none` is the one that must map to nothing — a slot for it would be a
  // bucket for objects no room does anything with.
  assert.equal(SLOT_FOR_PLACEMENT.none, null);
});

test("NOTHING ON THE SCREEN IS PRE-SELECTED", () => {
  // The same guard /desk/reconcile carries, for the same reason: a default
  // here is the screen deciding what belongs in a room. Checked against the
  // markup rather than against a helper, because the bypass this exists to
  // catch is somebody adding an attribute next month.
  const page = readFileSync(
    `${ROOT}src/app/desk/(signed-in)/images/page.tsx`,
    "utf8"
  );
  for (const attribute of ["defaultChecked", "defaultValue", "autoFocus"]) {
    assert.ok(
      !page.includes(attribute),
      `/desk/images has grown a ${attribute}. Nothing on this screen is ` +
        `pre-selected — approving is choosing a room, and a default is the ` +
        `screen choosing it.`
    );
  }
  // Attribute forms only — the page's own prose says "pre-selected" four
  // times, which is the opposite of the thing being looked for.
  assert.ok(
    !/(?<![-\w])selected(\s*=|\s*\/?>)/.test(page),
    "a pre-selected option appeared on /desk/images"
  );
  assert.ok(
    !/(?<![-\w])checked(\s*=|\s*\/?>)/.test(page),
    "a pre-checked input appeared on /desk/images"
  );
});

test("THE PICTURES NEVER REACH A MEMBER SURFACE", () => {
  // The one licence fact in this feature, guarded where it can be: nothing
  // under src/app/portal or src/app/apply may name the bytes or the route
  // that serves them.
  const surfaces = ["src/app/portal", "src/app/apply", "src/lib/portal"];
  for (const surface of surfaces) {
    const found = grepTree(`${ROOT}${surface}`, /reference_image|desk\/images/);
    assert.deepEqual(
      found,
      [],
      `${surface} names the reference image bank. These are other people's ` +
        `photographs held as private staff reference; only the house's own ` +
        `words about an object may ever ship.`
    );
  }
});

function grepTree(dir: string, pattern: RegExp): string[] {
  const hits: string[] = [];
  const walk = (path: string) => {
    let entries: string[];
    try {
      entries = readdirSync(path);
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = `${path}/${entry}`;
      if (statSync(full).isDirectory()) {
        walk(full);
        continue;
      }
      if (!/\.(ts|tsx)$/.test(entry)) continue;
      if (pattern.test(readFileSync(full, "utf8"))) hits.push(full);
    }
  };
  walk(dir);
  return hits;
}
