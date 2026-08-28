import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { DESTINATIONS } from "./destinations.ts";
import {
  PROXIMITY_FLOOR,
  authoredRooms,
  isServable,
  roomBySlug,
  voiceFindings,
} from "./voice-check.ts";

/**
 * THE ADAPTER, AND THE GUARD THAT GOES THROUGH BOTH CONSUMERS.
 *
 * src/lib/voice-check.ts adds no rule to scripts/check-voice-output.mjs — it
 * imports the script's `checkVoiceOutput` and gives it types and a serializable
 * shape. So the interesting question is not whether the adapter agrees with the
 * function it calls (it cannot disagree; that would be testing a function
 * against itself, which rule 21 says CANNOT FAIL and should not be written).
 *
 * The interesting question is whether the CLI a curator runs at a terminal and
 * the screen at /desk/writing reach the same verdict on the same line. Those
 * are two consumers with two entry points, and the way to know is to drive both
 * the way production drives them: spawn the script as a command, call the
 * adapter as a module, compare. If somebody later gives the bench its own copy
 * of the rules, this is the test that goes red.
 */

const SCRIPT = fileURLToPath(
  new URL("../../scripts/check-voice-output.mjs", import.meta.url)
);

/** The CLI's own verdict: exit 1 when it found something, 0 when it did not. */
function cliFlagged(slug: string, text: string): boolean {
  const run = spawnSync(process.execPath, [SCRIPT, slug, text], {
    encoding: "utf8",
  });
  assert.notEqual(
    run.status,
    2,
    `the CLI refused the room "${slug}": ${run.stderr}`
  );
  assert.ok(
    run.status === 0 || run.status === 1,
    `the CLI exited ${run.status}: ${run.stderr}`
  );
  return run.status === 1;
}

/* ── the two surfaces agree ──────────────────────────────────────────── */

const CASES: readonly { slug: string; text: string; why: string }[] = [
  {
    slug: "nantucket",
    text: "An authentic and elevated experience.",
    why: "three house-wide refusals in one line",
  },
  {
    slug: "nantucket",
    text: "The tide is out until four. Take the long way round.",
    why: "a plain line that refuses nothing",
  },
  {
    slug: "havana",
    text: "A curated evening of unforgettable glamour.",
    why: "house-wide refusals in a second room",
  },
];

for (const one of CASES) {
  test(`the CLI and the bench agree — ${one.why}`, () => {
    const room = roomBySlug(one.slug);
    assert.ok(room, `no room ${one.slug}`);
    const bench = voiceFindings(room, one.text).flagged > 0;
    assert.equal(
      bench,
      cliFlagged(one.slug, one.text),
      `the bench and \`npm run check:voice-output -- ${one.slug}\` disagree ` +
        `about "${one.text}". One of them has grown its own copy of the rules.`
    );
  });
}

/* ── the adapter's own two decisions ─────────────────────────────────── */

test("a line reaching for a banned word is flagged, with the refusal that carries it", () => {
  const room = roomBySlug("nantucket");
  assert.ok(room);
  const findings = voiceFindings(room, "An authentic and elevated experience.");

  assert.ok(findings.flagged > 0, "nothing was flagged");
  const terms = findings.houseWide.map((h) => h.term);
  assert.ok(
    terms.includes("authentic"),
    `house-wide refusals were ${terms.join(", ")}`
  );
  // Every finding carries the argument for itself. A ban with no reason beside
  // it is an adjudication with the opinion torn off (rule 17's shape).
  for (const hit of findings.houseWide) {
    assert.ok(hit.why.length > 0, `"${hit.term}" arrived with no reason`);
  }
});

test("the nearest refusal is kept only above the floor the CLI prints at", () => {
  const room = roomBySlug("nantucket");
  assert.ok(room);

  // A line lifted almost intact from this room's own rejected list must come
  // back close. This is the channel that tells a curator the model reproduced a
  // shape the house already turned down.
  const refused = room.voice.rejected[0];
  const near = voiceFindings(room, refused.text);
  assert.ok(near.nearest, "an authored refusal did not match itself");
  assert.ok(
    near.nearest.score >= PROXIMITY_FLOOR,
    `scored ${near.nearest.score}`
  );
  assert.equal(near.nearest.text, refused.text);

  // And a line with nothing in common carries no nearest at all, rather than
  // the least-far one dressed up as a finding.
  const far = voiceFindings(room, "Quiet.");
  assert.equal(far.nearest, null);
});

test("findings are plain data, so they survive a Server Action boundary", () => {
  const room = roomBySlug("nantucket");
  assert.ok(room);
  const findings = voiceFindings(room, "An authentic clambake experience.");
  assert.deepEqual(findings, JSON.parse(JSON.stringify(findings)));
});

/* ── the roster ──────────────────────────────────────────────────────── */

test("every authored room is a Destination, and the cast in the adapter is honest", () => {
  const rooms = authoredRooms();
  assert.ok(rooms.length >= 13, `only ${rooms.length} rooms`);
  for (const room of rooms) {
    assert.equal(typeof room.key, "string", "a room with no key");
    assert.equal(typeof room.name, "string", `${room.key} has no name`);
    assert.equal(typeof room.tagline, "string", `${room.key} has no tagline`);
    assert.equal(typeof room.voiceVersion, "number", `${room.key} has no voice version`);
    assert.ok(Array.isArray(room.voice.exemplars), `${room.key} has no exemplars`);
    assert.ok(Array.isArray(room.voice.rejected), `${room.key} has no rejected list`);
    assert.ok(room.look.palette, `${room.key} has no look`);
  }
});

/**
 * THE FACT THIS BENCH IS BUILT ON, asserted rather than assumed.
 *
 * More rooms are authored than are servable, and the difference is the five the
 * bench offers under a label. `DESTINATIONS` is the authority on which rooms a
 * member can be sent; `authoredRooms()` is the authority on which exist. Both
 * are read here, so a room being wired — Acapulco was, on 2026-08-27 — moves it
 * from one list to the other with nothing to edit.
 */
test("servable means keyed into DESTINATIONS, and nothing else does", () => {
  const servable = authoredRooms()
    .filter(isServable)
    .map((room) => room.key)
    .sort();
  assert.deepEqual(servable, Object.keys(DESTINATIONS).sort());

  const unwired = authoredRooms().filter((room) => !isServable(room));
  assert.ok(
    unwired.length > 0,
    "no unwired rooms — if the catalogue really did catch up, delete the " +
      "labelled group on /desk/writing rather than leaving it drawing nothing"
  );
  for (const room of unwired) {
    assert.ok(
      !(room.key in DESTINATIONS),
      `${room.key} reads as unwired and is keyed`
    );
  }
});
