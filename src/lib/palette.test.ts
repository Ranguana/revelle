import assert from "node:assert/strict";
import { test } from "node:test";

import { DESTINATIONS } from "./destinations.ts";
// EXTRACTED 2026-09-06. These three were module-private here, which meant the
// room page could only have them by copying the arithmetic — rule 21's exact
// defect, and the way "0.65 everywhere" happened. src/lib/palette.ts is the
// one owner now and this test is a consumer of it.
import { luminance, contrast, apart, paletteDarkAudit } from "./palette.ts";

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
