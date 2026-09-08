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

/* ══ THE FRAME PROPOSES. THIS ARITHMETIC DISPOSES. ═══════════════════ */

/**
 * A COUNTED COLOUR, structurally. Deliberately not imported from
 * `photo-extract.ts`.
 *
 * `PaletteSwatch` there is the vocabulary of a READING; this file is colour
 * arithmetic and knows nothing about photographs. Declaring the shape
 * structurally keeps the dependency from pointing the wrong way — a measurement
 * module that imports a reading module is a measurement module that cannot be
 * used on anything else, and the first thing anyone will want to measure this
 * way is a palette somebody typed in by hand.
 */
export type CountedColour = { hex: string; share: number };

/**
 * PROPOSING A PALETTE FROM COUNTED COLOUR.
 *
 * ── THE DIVISION THIS FUNCTION EXISTS TO ENFORCE ─────────────────────
 *
 * Founder, on why the palette was never in the tool schema: *"VLMs invent
 * #C4A574. Count pixels."* `palette()` in `src/lib/photo-store.ts` does the
 * counting and has since the beginning. What was missing is the second half:
 * a frame full of colour is not a palette, and turning one into the other is
 * arithmetic that has to be written down somewhere it can be argued with.
 *
 *     THE FRAME SUPPLIES CANDIDATES. THE CONTRAST RULES DO THE CHOOSING.
 *
 * No model is asked for a hex at any point in this path, and no hex is
 * invented, adjusted, blended or nudged here either. Every value that comes
 * out of this function was counted off real pixels. **That is the whole
 * design and it is the thing to protect** — the moment somebody "helpfully"
 * darkens a candidate by 8% to get it over 7:1, the palette stops being
 * evidence and becomes a plausible lie with six digits of precision, which is
 * exactly what counting was chosen to avoid.
 *
 * ── AN UNSUPPLIED TOKEN IS ABSENT, NEVER DEFAULTED ───────────────────
 *
 * `minItems: 0` is the rule of the whole photograph feature and it reaches
 * here intact. If no counted colour clears a token's floor, THE FRAME DOES NOT
 * SUPPLY THAT TOKEN. It is reported in `unsupplied` with the best ratio the
 * frame could manage, and no value is put in its place. A photograph that says
 * nothing about an ink says nothing about an ink.
 *
 * That is why the return type is partial by construction rather than a
 * `Palette` with holes patched from somewhere: a patched palette is
 * indistinguishable from a read one once it is stored.
 *
 * ── WHY SHARE BREAKS THE TIE, AND NOT HEADROOM ───────────────────────
 *
 * Among the candidates that clear a floor, the one taken is the one MOST
 * PRESENT IN THE FRAME, not the one with the best ratio. Optimising for
 * headroom walks every palette toward black-on-white — it would produce
 * technically excellent, mutually identical palettes, which is the exact
 * defect the dark registry already has. Faithfulness to the photograph is the
 * point; the floors are a floor, not a score.
 */
export type PaletteProposal = {
  side: "palette" | "paletteDark";
  /** Counted, never invented. Null when no candidate could serve as a ground. */
  ground: string | null;
  /** Only the tokens the frame actually supplied. */
  tokens: Readonly<Record<string, string>>;
  /** What the frame could not supply, and how close it came. */
  unsupplied: { token: string; floor: number; best: number | null }[];
};

/**
 * Is this candidate dark enough (or light enough) to be a ground for its side?
 *
 * The threshold is WCAG relative luminance 0.5, which is not a taste judgement
 * — it is the point at which the contrast floors below become satisfiable in
 * one direction rather than the other. A "dark" palette built on a light ground
 * would pass nothing and propose nothing, which is a correct but useless
 * answer arrived at expensively.
 */
function servesAsGround(hex: string, side: "palette" | "paletteDark"): boolean {
  const l = luminance(hex);
  return side === "paletteDark" ? l < 0.5 : l >= 0.5;
}

export function paletteFrom(
  counted: readonly CountedColour[],
  side: "palette" | "paletteDark" = "palette"
): PaletteProposal {
  // MOST PRESENT FIRST, and ties broken by hex so the same frame always
  // produces the same proposal. Determinism is what makes this evidence
  // rather than decoration — the same argument `palette()` makes about its
  // own bucket ordering.
  const ranked = [...counted].sort(
    (a, b) => b.share - a.share || (a.hex < b.hex ? -1 : a.hex > b.hex ? 1 : 0)
  );

  const ground = ranked.find((c) => servesAsGround(c.hex, side))?.hex ?? null;
  if (ground === null) {
    return {
      side,
      ground: null,
      tokens: {},
      unsupplied: Object.entries(CONTRAST_FLOORS).map(([token, floor]) => ({
        token,
        floor,
        best: null,
      })),
    };
  }

  const tokens: Record<string, string> = {};
  const unsupplied: PaletteProposal["unsupplied"] = [];
  const taken = new Set<string>([ground]);

  for (const [token, floor] of Object.entries(CONTRAST_FLOORS)) {
    // A TOKEN IS NEVER THE GROUND AND NEVER ANOTHER TOKEN. Six roles filled by
    // four distinct colours is a palette with three invisible tokens, and the
    // contrast test would not catch it — every one of them would clear its
    // floor against the ground while being the same colour as its neighbour.
    const candidates = ranked.filter(
      (c) => !taken.has(c.hex) && contrast(c.hex, ground) >= floor
    );
    const best = ranked
      .filter((c) => !taken.has(c.hex))
      .reduce<number | null>(
        (top, c) => Math.max(top ?? 0, contrast(c.hex, ground)),
        null
      );

    if (candidates.length === 0) {
      unsupplied.push({ token, floor, best });
      continue;
    }
    tokens[token] = candidates[0].hex;
    taken.add(candidates[0].hex);
  }

  return { side, ground, tokens, unsupplied };
}

/**
 * WOULD THIS PROPOSED GROUND BE A NEAR-DUPLICATE OF A ROOM WE ALREADY HAVE?
 *
 * The separation half, and the reason it is a separate call: a proposal can be
 * perfectly readable and still be the 147th pair below the floor. Contrast and
 * separation fail independently and a path that checked only one of them would
 * ship exactly the defect the dark registry already carries.
 *
 * Returns every room the proposal collides with, nearest first. EMPTY MEANS
 * CLEAR. `slug` is excluded so a room may be re-proposed against itself.
 */
export function proposalCollisions(
  hex: string,
  rooms: Readonly<
    Record<
      string,
      { look: { palette: Record<string, string>; paletteDark?: Record<string, string> } }
    >
  >,
  side: "palette" | "paletteDark" = "palette",
  slug?: string
): SeparationReading[] {
  const out: SeparationReading[] = [];
  for (const [other, room] of Object.entries(rooms)) {
    if (other === slug) continue;
    const theirs = side === "palette" ? room.look.palette : room.look.paletteDark;
    if (!theirs) continue;
    const distance = apart(hex, theirs.ground);
    if (distance < GROUND_FLOOR) out.push({ other, distance, ok: false });
  }
  return out.sort((a, b) => a.distance - b.distance);
}
