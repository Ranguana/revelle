import assert from "node:assert/strict";
import { test } from "node:test";

import { DESTINATIONS } from "./destinations.ts";

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

function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const parts = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const lin = parts.map((c) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  );
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function apart(a: string, b: string): number {
  const rgb = (hex: string) =>
    [0, 2, 4].map((i) => parseInt(hex.replace("#", "").slice(i, i + 2), 16));
  const [x, y] = [rgb(a), rgb(b)];
  return x.reduce((n, v, i) => n + Math.abs(v - y[i]), 0) / 3;
}

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
