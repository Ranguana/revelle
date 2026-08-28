import assert from "node:assert/strict";
import test from "node:test";

import { authoredRooms, roomBySlug } from "../voice-check.ts";
import type { Destination, PieceKind } from "../tokens.ts";
import {
  MAX_ROOMS,
  benchRooms,
  carriedLines,
  defaultCeiling,
  runWritingBench,
  writingErrors,
  type WriterSeam,
  type WritingInput,
} from "./writing.ts";

/**
 * THE BENCH WITHOUT THE NETWORK.
 *
 * ── WHAT CANNOT BE TESTED HERE, SAID FIRST ───────────────────────────
 *
 * ANTHROPIC_API_KEY is set on Render and on nothing else, so the model call
 * itself cannot run from a laptop and does not run here. That is not a gap this
 * file pretends to close. What it closes is everything AROUND the call: the
 * prompt that would be sent, the accounting of what a run spends, the
 * independence of three rooms from one another, and the voice check reading
 * whatever comes back.
 *
 * The seam that makes it possible is `WriterSeam` — the writer arrives as a
 * parameter rather than an import, so a stub can stand where Opus stands. The
 * stub is not a model and does not pretend to be one; it is a function that
 * returns a string, which is exactly the shape the bench has to survive.
 *
 * ── AND THE ONE THING A STUB CAN STILL PROVE ABOUT THE VOICE ─────────
 *
 * A stub that returns "An elevated and authentic experience." proves the guard
 * is WIRED TO THE OUTPUT rather than to a line an agent typed into a test —
 * which is the whole reason the check is on this screen. It does not prove the
 * model would ever say it. Nothing here can.
 */

/* ── the stub ────────────────────────────────────────────────────────── */

type Stub = WriterSeam & { calls: string[] };

/**
 * A writer that answers with whatever `reply` says, and remembers who asked.
 *
 * `reply` returning null throws instead, so a run can be given one room that
 * fails and two that do not — which is the case that matters, because a run
 * that lost two good answers to one timeout would have spent three calls and
 * shown one error.
 */
function stub(reply: (destination: Destination) => string | null): Stub {
  const calls: string[] = [];
  return {
    calls,
    model: "claude-opus-5",
    maxTokens: 4000,
    write: async (destination) => {
      calls.push(destination.key);
      const body = reply(destination);
      if (body === null) throw new Error("The writer could not be reached.");
      return { body, model: "claude-opus-5-20260101" };
    },
  };
}

function input(over: Partial<WritingInput> = {}): WritingInput {
  return {
    slugs: ["nantucket"],
    piece: "invitation",
    ask: "Ask six people to the house for a long weekend.",
    facts: ["Friday at seven", "Dune Road"],
    maxWords: 60,
    generate: true,
    ...over,
  };
}

/* ── what a run costs, and what it leaves ────────────────────────────── */

test("showing the prompts calls nothing and spends nothing", async () => {
  const writer = stub(() => "unreachable");
  const run = await runWritingBench(
    input({ slugs: ["nantucket", "havana"], generate: false }),
    writer
  );

  assert.deepEqual(writer.calls, []);
  assert.equal(run.calls, 0);
  assert.equal(run.generated, false);
  assert.equal(run.rooms.length, 2);
  for (const room of run.rooms) {
    assert.equal(room.written, null);
    assert.equal(room.findings, null);
    assert.equal(room.error, null);
    // The prompt is the point of this mode, and it is the real one.
    assert.ok(room.prompt.includes("Ask six people to the house"));
    assert.ok(room.prompt.includes("Dune Road"));
  }
});

test("one call a room, counted, and the same brief in each", async () => {
  const writer = stub((d) => `Written for ${d.name}.`);
  const run = await runWritingBench(
    input({ slugs: ["nantucket", "havana", "tahiti"] }),
    writer
  );

  assert.deepEqual(writer.calls, ["nantucket", "havana", "tahiti"]);
  assert.equal(run.calls, 3);
  assert.equal(run.requestedModel, "claude-opus-5");
  assert.equal(run.maxTokens, 4000);
  assert.deepEqual(
    run.rooms.map((r) => r.written?.body),
    run.rooms.map((r) => `Written for ${r.name}.`)
  );
  // The model that ANSWERED, which writer.ts's fallback may make different from
  // the one that was asked. A comparison across houses is worthless if two of
  // them were written by different models and the screen did not say so.
  for (const room of run.rooms) {
    assert.equal(room.written?.model, "claude-opus-5-20260101");
  }
});

test("more rooms than the ceiling are refused, and refused again in the run", async () => {
  const four = ["nantucket", "havana", "tahiti", "catskills"];
  const errors = writingErrors(input({ slugs: four }));
  assert.ok(
    errors.some((e) => e.includes(String(MAX_ROOMS))),
    `errors were ${errors.join(" / ")}`
  );

  // And the function defends itself even when a caller ignores the errors —
  // the ceiling is about money, and a validation step is not where money
  // should be protected.
  const writer = stub(() => "one line");
  const run = await runWritingBench(input({ slugs: four }), writer);
  assert.equal(run.calls, MAX_ROOMS);
  assert.equal(writer.calls.length, MAX_ROOMS);
});

test("a room whose call fails does not lose the rooms that answered", async () => {
  const writer = stub((d) => (d.key === "havana" ? null : `Written for ${d.name}.`));
  const run = await runWritingBench(
    input({ slugs: ["nantucket", "havana", "tahiti"] }),
    writer
  );

  const failed = run.rooms.find((r) => r.slug === "havana");
  assert.ok(failed);
  assert.equal(failed.written, null);
  assert.equal(failed.findings, null);
  assert.match(failed.error ?? "", /could not be reached/);

  for (const slug of ["nantucket", "tahiti"]) {
    const ok = run.rooms.find((r) => r.slug === slug);
    assert.ok(ok?.written, `${slug} lost its answer to another room's failure`);
    assert.equal(ok.error, null);
  }
  // Three calls were made. The failed one still cost something.
  assert.equal(run.calls, 3);
});

/* ── the guard, on what came back ────────────────────────────────────── */

test("the banned-shapes check runs on the model's output, not on a fixture", async () => {
  const writer = stub(() => "An elevated and authentic experience.");
  const run = await runWritingBench(input(), writer);

  const findings = run.rooms[0].findings;
  assert.ok(findings, "no findings on a generated room");
  assert.ok(findings.flagged > 0, "the guard passed a line it exists to catch");
  assert.ok(
    findings.houseWide.some((h) => h.term === "authentic"),
    `house-wide refusals were ${findings.houseWide.map((h) => h.term).join(", ")}`
  );
});

test("a line the house would not object to comes back clean", async () => {
  const writer = stub(() => "The tide is out until four. Take the long way.");
  const run = await runWritingBench(input(), writer);

  const findings = run.rooms[0].findings;
  assert.ok(findings);
  assert.equal(findings.flagged, 0);
});

/* ── what the prompt carried ─────────────────────────────────────────── */

/** A room and a piece that room has authored lines for. */
function roomWithExemplarsFor(): { room: Destination; piece: PieceKind } {
  for (const room of authoredRooms()) {
    const exemplar = room.voice.exemplars[0];
    if (exemplar) return { room, piece: exemplar.piece };
  }
  throw new Error("no authored exemplars anywhere in the catalogue");
}

test("the exemplars matching the piece are the ones the model reads first", async () => {
  const { room, piece } = roomWithExemplarsFor();
  const writer = stub(() => "a line");
  const run = await runWritingBench(
    input({ slugs: [room.key], piece, generate: false }),
    writer
  );

  const carried = run.rooms[0].exemplarsCarried;
  assert.ok(carried.length > 0, `${room.key} carried no exemplars`);
  assert.equal(
    carried[0].piece,
    piece,
    `the first line the model reads for a ${piece} was a ${carried[0].piece}. ` +
      `voicePrompt hoists the matching kind, and this reads the order off the ` +
      `assembled prompt rather than assuming it.`
  );
  // The hoisted ones are contiguous at the front, which is what "hoisted" means.
  const firstOther = carried.findIndex((l) => l.piece !== piece);
  if (firstOther >= 0) {
    assert.ok(
      carried.slice(firstOther).every((l) => l.piece !== piece),
      "a matching exemplar was left behind the others"
    );
  }
});

/**
 * RULE 24, IN BOTH DIRECTIONS. Every authored line reaching the prompt is the
 * claim the screen makes, so it is counted rather than assumed — across every
 * room, because a single room passing says nothing about the seventeen others.
 */
test("every authored exemplar and refusal reaches the prompt, in every room", async () => {
  const writer = stub(() => "a line");
  for (const room of authoredRooms()) {
    if (room.voice.exemplars.length === 0) continue;
    const run = await runWritingBench(
      input({ slugs: [room.key], generate: false }),
      writer
    );
    const outcome = run.rooms[0];
    assert.deepEqual(
      outcome.exemplarsMissing.map((l) => l.text),
      [],
      `${room.key}: exemplars did not reach the prompt`
    );
    assert.deepEqual(
      outcome.rejectedMissing.map((l) => l.text),
      [],
      `${room.key}: refusals did not reach the prompt`
    );
    assert.equal(
      outcome.exemplarsCarried.length + outcome.exemplarsMissing.length,
      room.voice.exemplars.length
    );
    assert.equal(
      outcome.rejectedCarried.length + outcome.rejectedMissing.length,
      room.voice.rejected.length
    );
  }
});

test("a line the prompt does not carry is reported missing, not dropped", () => {
  const room = roomBySlug("nantucket");
  assert.ok(room);

  // The channel has never fired against a real prompt, because voicePrompt
  // renders everything. Fired here against a prompt that carries nothing, so
  // that "it has never gone off" is not the only evidence it works.
  const found = carriedLines(room, "A prompt with none of this house in it.");
  assert.deepEqual(found.exemplarsCarried, []);
  assert.deepEqual(found.rejectedCarried, []);
  assert.equal(found.exemplarsMissing.length, room.voice.exemplars.length);
  assert.equal(found.rejectedMissing.length, room.voice.rejected.length);
  for (const line of found.rejectedMissing) {
    // Every refusal keeps the argument for itself, missing or carried. A
    // refusal with the reason torn off is the thing rule 17 refuses.
    assert.ok((line.why ?? "").length > 0, "a refusal arrived with no reason");
  }
});

/* ── the rooms and the pieces ────────────────────────────────────────── */

test("the picker offers every authored room, servable ones first", () => {
  const rooms = benchRooms();
  assert.equal(rooms.length, authoredRooms().length);

  const firstUnwired = rooms.findIndex((r) => !r.servable);
  assert.ok(firstUnwired > 0, "no servable rooms at the top of the list");
  assert.ok(
    rooms.slice(firstUnwired).every((r) => !r.servable),
    "a servable room is sorted below an unwired one"
  );
  // The unwired ones are OFFERED. Omitting them would hide exactly the voices
  // nobody has read a line out of.
  assert.ok(rooms.some((r) => !r.servable), "the unwired rooms are missing");
});

test("an unwired room can be written in, and says it is not servable", async () => {
  const unwired = benchRooms().find((r) => !r.servable);
  assert.ok(unwired, "no unwired room to check");

  const writer = stub(() => "a line");
  const run = await runWritingBench(
    input({ slugs: [unwired.slug] }),
    writer
  );
  assert.equal(run.rooms[0].servable, false);
  assert.ok(run.rooms[0].written, "the writer refused an authored room");
});

test("the word ceiling for a piece is the one the member's screen uses", () => {
  // A place card is a card. src/lib/correspondence/pieces.ts owns that fact and
  // this reads it rather than restating it.
  assert.equal(defaultCeiling("place_card"), 12);
  assert.equal(defaultCeiling("invitation"), 60);
  // The three pieces a member is never offered have no ceiling there and get
  // none here, rather than an invented one.
  assert.equal(defaultCeiling("heading"), null);
  assert.equal(defaultCeiling("sign_off"), null);
  assert.equal(defaultCeiling("game_rule"), null);
});

/* ── refusals ────────────────────────────────────────────────────────── */

test("a brief that cannot be run is refused in words, before anything is spent", () => {
  assert.match(
    writingErrors(input({ slugs: [] })).join(" "),
    /Pick a room/
  );
  assert.match(
    writingErrors(input({ slugs: ["atlantis"] })).join(" "),
    /no room called atlantis/
  );
  assert.match(
    writingErrors(input({ ask: "   " })).join(" "),
    /what the piece has to do/
  );
  assert.match(
    writingErrors(input({ maxWords: -4 })).join(" "),
    /cannot be negative/
  );
  assert.deepEqual(writingErrors(input()), []);
});

/* ── the boundary ────────────────────────────────────────────────────── */

test("a run is plain data, so it survives a Server Action boundary", async () => {
  const writer = stub(() => "a line");
  const run = await runWritingBench(
    input({ slugs: ["nantucket", "havana"] }),
    writer
  );
  assert.deepEqual(run, JSON.parse(JSON.stringify(run)));
});
