/**
 * A DESTINATION'S LOOK, READ BACK OUT OF THE DATABASE — and the one place
 * that is allowed to trust it.
 *
 * `world.tokens` is jsonb. src/lib/tokens.ts turns a Theme into CSS by
 * interpolating its values into a rule block, which is exactly right for the
 * two themes that live in TypeScript and exactly wrong for a value that came
 * out of a column: `#fff; } body { display: none } .x {` is a legal string and
 * would end the rule and start another. The landing page never had this
 * problem because it renders a module constant. The portal paints a
 * destination a curator can edit at the desk, so the problem is now real.
 *
 * So nothing crosses from jsonb into CSS without matching a pattern here.
 *
 * ── WHY IT FALLS BACK RATHER THAN FAILING ────────────────────────────
 *
 * A malformed token set is a house problem — somebody pasted a gradient into a
 * colour field — and a member opening her Revelle on the day of her party is
 * the worst possible person to hand it to. An unusable value is dropped and
 * the house's own value stands in its place, so the page is always painted and
 * always painted with something legible. The failure is silent to her and
 * loud in the only place it can be acted on: the curator's tool renders the
 * same tokens and shows what it stored.
 *
 * Framework-free, like tokens.ts, so a script can check a token set without
 * starting Next.
 */

import { HOUSE, type Palette, type Theme, type TypeRoles } from "../tokens.ts";

/**
 * A colour, conservatively.
 *
 * Hex in its four lengths, plus the four functional forms a curator might
 * reasonably paste. The functional forms are bounded in length and admit only
 * digits, separators and the unit characters — no `url(`, no nested
 * parentheses, no semicolon, no brace, and therefore nothing that can leave
 * the declaration it sits in.
 */
const HEX = /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const FUNCTIONAL = /^(?:rgb|rgba|hsl|hsla)\([0-9a-zA-Z.,%/\s+-]{1,64}\)$/;

function colour(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > 72) return null;
  if (HEX.test(trimmed)) return trimmed;
  if (FUNCTIONAL.test(trimmed)) return trimmed;
  return null;
}

/**
 * A font stack, conservatively.
 *
 * Family names, the generic keywords, quotes, commas and spaces. Anything else
 * — a parenthesis, a semicolon, a brace, a backslash — takes the whole stack
 * out, because a font stack is the one token whose grammar is loose enough
 * that a partial repair could still be a valid injection.
 */
const STACK = /^[-A-Za-z0-9 ,."'_]{1,200}$/;

function stack(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  return STACK.test(trimmed) ? trimmed : null;
}

/** The palette keys, taken from the house's own so the two cannot drift. */
const PALETTE_KEYS = Object.keys(HOUSE.palette) as (keyof Palette)[];
const TYPE_KEYS = Object.keys(HOUSE.type) as (keyof TypeRoles)[];

/**
 * What was thrown away, for the house.
 *
 * Returned rather than logged: a caller that wants to tell a curator can, and
 * a caller rendering a member's page ignores it. Nothing in here reaches her.
 */
export type TokenComplaint = {
  field: string;
  /** The offending value, truncated. Never rendered to a member. */
  value: string;
};

export type ReadTheme = {
  theme: Theme;
  /** True when every value in the column was usable. */
  clean: boolean;
  complaints: TokenComplaint[];
};

/**
 * Read a stored token set, merged over the house's.
 *
 * Merged rather than replaced because `paletteDark` is a partial by design
 * (see tokens.ts) and because a destination authored before a token was added
 * to Palette must still produce a complete set. The house's value is the floor
 * under every key; the destination's wins wherever it is usable.
 */
export function readTheme(
  stored: unknown,
  key = "destination"
): ReadTheme {
  const complaints: TokenComplaint[] = [];
  const source = (stored ?? {}) as Record<string, unknown>;

  const note = (field: string, value: unknown) => {
    complaints.push({ field, value: String(value).slice(0, 64) });
  };

  const palette = { ...HOUSE.palette };
  const rawPalette = (source.palette ?? {}) as Record<string, unknown>;
  for (const name of PALETTE_KEYS) {
    if (!(name in rawPalette)) continue;
    const value = colour(rawPalette[name]);
    if (value === null) {
      note(`palette.${name}`, rawPalette[name]);
      continue;
    }
    palette[name] = value;
  }

  // The dark set is the destination's OWN overrides where it has any, and the
  // house's whole set where it has none. Not merged: tokens.ts renders only
  // the keys named here, everything else inheriting the light value, so mixing
  // two authors' dark keys produces a surface that is half inverted — a dark
  // ground under dark ink. One author or the other, never both.
  const rawDark = (source.paletteDark ?? {}) as Record<string, unknown>;
  const own: Partial<Palette> = {};
  let sawDark = false;
  for (const name of PALETTE_KEYS) {
    if (!(name in rawDark)) continue;
    sawDark = true;
    const value = colour(rawDark[name]);
    if (value === null) {
      note(`paletteDark.${name}`, rawDark[name]);
      continue;
    }
    own[name] = value;
  }
  const paletteDark: Partial<Palette> = sawDark ? own : { ...HOUSE.paletteDark };

  const type = { ...HOUSE.type };
  const rawType = (source.type ?? {}) as Record<string, unknown>;
  for (const name of TYPE_KEYS) {
    if (!(name in rawType)) continue;
    const value = stack(rawType[name]);
    if (value === null) {
      note(`type.${name}`, rawType[name]);
      continue;
    }
    type[name] = value;
  }

  return {
    theme: { key, palette, paletteDark, type },
    clean: complaints.length === 0,
    complaints,
  };
}
