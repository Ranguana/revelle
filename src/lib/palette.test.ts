import assert from "node:assert/strict";
import { test } from "node:test";

import { DESTINATIONS } from "./destinations.ts";
// EXTRACTED 2026-09-06. These three were module-private here, which meant the
// room page could only have them by copying the arithmetic — rule 21's exact
// defect, and the way "0.65 everywhere" happened. src/lib/palette.ts is the
// one owner now and this test is a consumer of it.
import {
  luminance,
  contrast,
  apart,
  contrastReadings,
  paletteDarkAudit,
  GROUND_FLOOR,
} from "./palette.ts";

/**
 * THE PALETTES ARE READABLE, AND THEY ARE EIGHTEEN PALETTES.
 *
 * Both halves were false until 2026-09-04, and neither had anything watching.
 *
 * ── WHY THIS TEST EXISTS ─────────────────────────────────────────────
 *
 * The authored registry was very nearly ONE palette. Measured across all
 * eighteen rooms: sixteen distinct ground hexes, a mean pairwise ground
 * distance of 7.9 RGB units, and TWO EXACT DUPLICATES — Côte d'Azur with Palm
 * Springs, Havana with Acapulco. So even after the portal learned to read a
 * palette (which it never had), four rooms would have rendered as two.
 *
 * Nothing caught that, because nothing was measuring it. The matrix guards
 * how a room SOUNDS (voice affinity) and what it SERVES (deliverables
 * overlap), and eighteen rooms could collapse into one LOOK with every check
 * green. This is that third axis, and it is the cheapest of the three.
 *
 * ── THE FLOORS ARE THE DESIGNER'S, COMPUTED NOT EYEBALLED ────────────
 *
 * Ink ≥7:1 on its ground, inkSoft ≥4.5:1, inkFaint and the three accents
 * ≥3:1 — WCAG contrast ratios. Kept as a test rather than a comment because
 * a floor that cannot go red is a floor nobody is standing on (rule 15).
 *
 * The distance floor is deliberately low. It refuses DUPLICATES and near
 * duplicates; it does not adjudicate taste. Two rooms may be close and both
 * be right — what they may not be is the same room twice.
 */




test("every room's writing is readable on its own ground", () => {
  for (const [slug, room] of Object.entries(DESTINATIONS)) {
    const p = room.look.palette;
    const on = (token: string) => contrast(p[token as keyof typeof p], p.ground);

    assert.ok(
      on("ink") >= 7,
      `${slug}: ink on ground is ${on("ink").toFixed(1)}:1, below 7:1. ` +
        `This is body text a member reads on a phone in a room with the lights down.`
    );
    assert.ok(
      on("inkSoft") >= 4.5,
      `${slug}: inkSoft on ground is ${on("inkSoft").toFixed(1)}:1, below 4.5:1.`
    );
    for (const token of ["inkFaint", "aqua", "oxblood", "gold"]) {
      assert.ok(
        on(token) >= 3,
        `${slug}: ${token} on ground is ${on(token).toFixed(1)}:1, below 3:1.`
      );
    }
  }
});

test("no two rooms share a ground, and none is a near-duplicate", () => {
  const rooms = Object.entries(DESTINATIONS).map(
    ([slug, room]) => [slug, room.look.palette.ground] as const
  );

  const grounds = new Set(rooms.map(([, g]) => g));
  assert.equal(
    grounds.size,
    rooms.length,
    `${rooms.length - grounds.size} room(s) share a ground hex with another. ` +
      `Two rooms that render identically are one room twice.`
  );

  for (let i = 0; i < rooms.length; i++) {
    for (let j = i + 1; j < rooms.length; j++) {
      const d = apart(rooms[i][1], rooms[j][1]);
      assert.ok(
        d >= 8,
        `${rooms[i][0]} and ${rooms[j][0]} are ${d.toFixed(1)} RGB units ` +
          `apart — indistinguishable. The old registry averaged 7.9 across ` +
          `every pair, which is how eighteen destinations became one room.`
      );
    }
  }
});

/**
 * THE DARK REGISTRY, MEASURED FOR THE FIRST TIME — AND IT IS NOT CLEAN.
 *
 * Every room ships `paletteDark` and nothing has ever looked at it. The day
 * side was deduplicated on 2026-09-04 after it was found to be very nearly one
 * palette; the dark side got none of that pass. Measured now:
 *
 *   mean pairwise ground separation  4.91   (the day floor is 8)
 *   pairs below that floor           146 of 171
 *   BYTE-IDENTICAL across all nine dark fields   havana / acapulco-1959
 *
 * SO THIS TEST DOES NOT APPLY THE DAY FLOOR, and that is deliberate rather than
 * a softening. Asserting >= 8 here would fail 146 pairs on the first run, which
 * is not a guard — it is a red build with no owner and no next action, and the
 * thing it would be "catching" is that the dark registry was never designed to
 * that number. CLAUDE.md's own account of `copyAgrees` is the precedent: a
 * tripwire that has been amber since it was installed stops being read.
 *
 * WHAT IT DOES INSTEAD IS PIN THE STATE SO IT CANNOT GET WORSE. One identical
 * pair is a known, recorded defect. A SECOND one is a new defect and goes red
 * the day it lands. The number the detector reports can reach zero, which is
 * the property CLAUDE.md demands of a detector: fix Havana/Acapulco and this
 * assertion is edited down to 0, and it can never drift up quietly.
 *
 * `npm run room:check <slug>` prints the full dark reading per room, including
 * the separation figure this test does not gate.
 */
test("the dark registry does not get worse than it already is", () => {
  const audit = paletteDarkAudit(DESTINATIONS);

  assert.equal(
    audit.identical.length,
    1,
    "A dark palette became byte-identical to another room's, or the known one " +
      "was fixed. Known: havana / acapulco-1959, all nine fields. Two rooms " +
      "that render identically after dark are one room twice, exactly as on " +
      "the day side — and nothing but this line is watching."
  );
  assert.deepEqual(
    audit.identical.map((p) => [p.a, p.b].sort().join(" / ")),
    ["acapulco-1959 / havana"],
    "the identical pair is not the one on the record"
  );
  assert.ok(
    audit.measured === Object.keys(DESTINATIONS).length,
    `${audit.measured} of ${Object.keys(DESTINATIONS).length} rooms carry a paletteDark; ` +
      "a room without one renders on the host's own ground after dark"
  );

  /*
   * AND THE NEAR-DUPLICATES ARE PINNED BY COUNT, which is the half that gives
   * a PROPOSAL something to fail against.
   *
   * Byte-identical is the extreme case and it is rare. The ordinary way the
   * dark registry gets worse is one more pair landing at 3.2 units — invisible
   * to the identity check above, invisible to a reviewer, and indistinguishable
   * from the 146 that are already there. A photograph proposing a ground is
   * exactly the mechanism that would produce one, at volume, with good
   * provenance.
   *
   * EXACT EQUALITY, NOT `<=`, and for the same reason the identical pin uses
   * it: a number that may drift down silently is a number nobody records. Fix
   * a palette, watch this go red, edit it down, and the diff carries how many
   * pairs the fix actually bought. That is the only place that figure is ever
   * written.
   */
  assert.equal(
    audit.belowFloor.length,
    146,
    `${audit.belowFloor.length} dark pairs sit below the day floor of ` +
      `${GROUND_FLOOR}, and 146 is the recorded state. UP means a new ` +
      `near-duplicate landed — most likely a proposed palette that cleared ` +
      `contrast and was never checked for separation. DOWN means somebody ` +
      `fixed one: edit this number and say so in the commit.`
  );
});

/**
 * THE DARK SIDE IS READABLE, AND THAT FLOOR IS GATED RATHER THAN PINNED.
 *
 * ── WHY THIS ONE IS AN ASSERTION AND THE SEPARATION IS A PIN ─────────
 *
 * They are two different findings and they deserve two different mechanisms,
 * which is the whole reason this test is separate from the one below it.
 *
 * Measured on 2026-09-08, across all nineteen rooms and all six floors:
 * ZERO FAILURES. The dark palettes are perfectly readable. What they are not
 * is DISTINCT — that is the separation finding, it is 146 pairs deep, and it
 * is pinned below because it cannot be fixed by a build.
 *
 * So contrast costs nothing to gate today and must be gated today, because it
 * is the floor a PROPOSED palette has to clear. A photograph is about to start
 * supplying candidate grounds and inks (docs/photo-redirect.md); the frame
 * proposes and this arithmetic disposes. Without this test the first proposed
 * dark palette could ship unreadable text and the build would be green — and
 * "the day side had a contrast test and the dark side did not" is exactly the
 * asymmetry that let the dark registry collapse in the first place.
 *
 * IT READS `contrastReadings` RATHER THAN RE-DERIVING THE FLOORS. Rule 21: the
 * floors live in src/lib/palette.ts, one copy, consumed by this test, by
 * `npm run room:check`, and by the proposal path. A second list of numbers here
 * is how "0.65 everywhere" happened.
 */
test("every room's writing is readable on its own DARK ground", () => {
  for (const [slug, room] of Object.entries(DESTINATIONS)) {
    const dark = room.look.paletteDark;
    assert.ok(dark, `${slug} ships no paletteDark`);

    for (const reading of contrastReadings(dark)) {
      assert.ok(
        reading.ok,
        `${slug}: ${reading.token} on the DARK ground is ` +
          `${reading.ratio.toFixed(1)}:1, below ${reading.floor}:1. This is a ` +
          `member reading her own Revelle at night, which is when most of them ` +
          `open it.`
      );
    }
  }
});

test("the palette measurement has ONE owner, and this file consumes it", () => {
  // Rule 21's guard has to go through the consumers. These three functions used
  // to be private here; `npm run room:check` now quotes the same numbers, so a
  // second implementation would let the page and the build disagree while both
  // looked right. Asserted against hand-computed values rather than against the
  // functions themselves, so the test cannot pass by comparing them to
  // themselves.
  assert.equal(apart("#000000", "#000018"), 8);        // 0 + 0 + 24, / 3
  assert.equal(apart("#ffffff", "#ffffff"), 0);
  assert.equal(Math.round(contrast("#000000", "#ffffff")), 21);
  assert.equal(contrast("#123456", "#123456"), 1);
  assert.ok(Math.abs(luminance("#ffffff") - 1) < 1e-9);
  assert.equal(luminance("#000000"), 0);
});
