/**
 * PALETTE MEASUREMENT — the one owner of luminance, contrast and separation.
 *
 * ── WHY THIS FILE EXISTS ─────────────────────────────────────────────
 *
 * `luminance`, `contrast` and `apart` were module-private helpers inside
 * `src/lib/palette.test.ts`, which was correct while that test was the only
 * surface that measured a palette. It stopped being correct the moment
 * `npm run room:check` had to report the same three numbers on a page the
 * founder signs off from: a private helper cannot be composed, so the only way
 * to build the page was to copy the arithmetic.
 *
 * Rule 21's narrow test — MUST TWO SURFACES AGREE ABOUT THIS? — answers yes
 * without argument. A contrast ratio quoted on the room page and a contrast
 * ratio asserted in the build have to be the same number or the page is
 * lying. And the failure mode is already on the record in this project: "0.65
 * everywhere" was a threshold that drifted from the thing it measured because
 * two places computed it. So this is an EXTRACTION, not an abstraction, and
 * `palette.test.ts` is a consumer of it rather than a sibling — which is the
 * half of rule 21 that usually gets skipped.
 *
 * ── WHAT `apart` IS, PRECISELY ───────────────────────────────────────
 *
 * MEAN PER-CHANNEL ABSOLUTE DIFFERENCE, not Euclidean distance. A floor of 8
 * is therefore an L1 distance of 24 across the three channels. It is written
 * here because every reader so far has assumed Euclidean and been wrong by a
 * factor of about 1.7.
 *
 * ── THE DARK PALETTES WERE NEVER MEASURED ────────────────────────────
 *
 * `palette.test.ts` checks `look.palette` and has never once looked at
 * `look.paletteDark`. Every room ships both. The day-side registry was
 * deduplicated in 2026-09-04 after it was found to be very nearly one palette;
 * the dark side got none of that pass, and it shows — see `paletteDarkAudit`.
 */

/** WCAG relative luminance of a `#rrggbb` hex. */
export function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const parts = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const lin = parts.map((c) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  );
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

/** WCAG contrast ratio between two hexes, 1..21. Order-independent. */
export function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/**
 * MEAN PER-CHANNEL ABSOLUTE DIFFERENCE between two hexes. Not Euclidean.
 * The registry floor of 8 on `ground` is expressed in this unit.
 */
export function apart(a: string, b: string): number {
  const rgb = (hex: string) =>
    [0, 2, 4].map((i) => parseInt(hex.replace("#", "").slice(i, i + 2), 16));
  const [x, y] = [rgb(a), rgb(b)];
  return x.reduce((n, v, i) => n + Math.abs(v - y[i]), 0) / 3;
}

/** The floor two grounds must clear. Refuses duplicates, not taste. */
export const GROUND_FLOOR = 8;

/** Contrast floors per token, against that palette's own ground. */
export const CONTRAST_FLOORS: Readonly<Record<string, number>> = {
  ink: 7,
  inkSoft: 4.5,
  inkFaint: 3,
  aqua: 3,
  oxblood: 3,
  gold: 3,
};

export type ContrastReading = {
  token: string;
  ratio: number;
  floor: number;
  ok: boolean;
};

/** Every token's contrast against its own ground, with the floor it must clear. */
export function contrastReadings(
  palette: Readonly<Record<string, string>>
): ContrastReading[] {
  return Object.entries(CONTRAST_FLOORS).map(([token, floor]) => {
    const value = palette[token];
    const ratio = value === undefined ? NaN : contrast(value, palette.ground);
    return { token, ratio, floor, ok: Number.isFinite(ratio) && ratio >= floor };
  });
}

export type SeparationReading = {
  other: string;
  distance: number;
  ok: boolean;
};

/**
 * One room's ground against every other room's, nearest first.
 *
 * `side` selects the day registry or the dark one. THE DARK SIDE IS NOT
 * GATED BY ANY TEST TODAY — reported so that the gap is visible rather than
 * inferred, which is rule 15's whole argument for a floor that can go red.
 */
export function groundSeparation(
  slug: string,
  rooms: Readonly<Record<string, { look: { palette: Record<string, string>; paletteDark?: Record<string, string> } }>>,
  side: "palette" | "paletteDark" = "palette"
): SeparationReading[] {
  const mineRoom = rooms[slug];
  const mine = side === "palette" ? mineRoom?.look.palette : mineRoom?.look.paletteDark;
  if (!mine) return [];
  const out: SeparationReading[] = [];
  for (const [other, room] of Object.entries(rooms)) {
    if (other === slug) continue;
    const theirs = side === "palette" ? room.look.palette : room.look.paletteDark;
    if (!theirs) continue;
    const distance = apart(mine.ground, theirs.ground);
    out.push({ other, distance, ok: distance >= GROUND_FLOOR });
  }
  return out.sort((a, b) => a.distance - b.distance);
}

/**
 * THE DARK REGISTRY, MEASURED — the check that did not exist.
 *
 * Returns the mean pairwise ground separation, the closest pair, and every
 * pair that is BYTE-IDENTICAL across all nine dark fields. The last one is the
 * finding: two rooms can differ on the day side and render as literally the
 * same room after dark, and nothing in the build would say so.
 */
export function paletteDarkAudit(
  rooms: Readonly<Record<string, { look: { paletteDark?: Record<string, string> } }>>
): {
  measured: number;
  mean: number;
  closest: { a: string; b: string; distance: number } | null;
  identical: { a: string; b: string; fields: number }[];
  belowFloor: { a: string; b: string; distance: number }[];
} {
  const keys = Object.keys(rooms).filter((k) => rooms[k].look.paletteDark);
  const distances: number[] = [];
  let closest: { a: string; b: string; distance: number } | null = null;
  const identical: { a: string; b: string; fields: number }[] = [];
  const belowFloor: { a: string; b: string; distance: number }[] = [];
  for (let i = 0; i < keys.length; i++)
    for (let j = i + 1; j < keys.length; j++) {
      const a = rooms[keys[i]].look.paletteDark as Record<string, string>;
      const b = rooms[keys[j]].look.paletteDark as Record<string, string>;
      const d = apart(a.ground, b.ground);
      distances.push(d);
      if (!closest || d < closest.distance)
        closest = { a: keys[i], b: keys[j], distance: d };
      if (d < GROUND_FLOOR) belowFloor.push({ a: keys[i], b: keys[j], distance: d });
      const fields = Object.keys(a);
      if (fields.length === Object.keys(b).length && fields.every((f) => a[f] === b[f]))
        identical.push({ a: keys[i], b: keys[j], fields: fields.length });
    }
  return {
    measured: keys.length,
    mean: distances.length ? distances.reduce((s, d) => s + d, 0) / distances.length : 0,
    closest,
    identical,
    belowFloor,
  };
}
