/**
 * The house theme — the entire style surface of Revelle, as DATA.
 *
 * Why a closed set of named values rather than CSS: a world's look is data, and
 * it will one day be authored per world (see world.tokens in db/001-schema.sql)
 * and merged over this. A token set that conforms to this shape can be ugly,
 * but it cannot leak arbitrary CSS or break a layout. Anything that could break
 * layout — spacing scale, grid, measure — is deliberately NOT here; that
 * belongs to the stylesheet, which owns whether the page still fits.
 *
 * Framework-free on purpose. No next/font, no React.
 *
 * ── The two hard rules of this identity ───────────────────────────────
 *  1. NO ITALICS. Anywhere. The owner reads a slanted face as machine-made.
 *     This is enforced three ways: no italic @font-face is declared, so the
 *     browser has nothing real to reach for; a global rule sets font-style to
 *     normal on em/i/cite/address/blockquote so it cannot synthesise an
 *     oblique either; and there is no italic token here to ask for.
 *  2. Restraint. One or two elements, never a stack of shapes. The bone arc is
 *     approved and stays; it is the only ornament in the system.
 */

export type Palette = {
  /** Daylight — plaster, terracotta, brass. */
  ground: string;
  ground2: string;
  ink: string;
  inkSoft: string;
  inkFaint: string;
  rule: string;
  aqua: string;
  oxblood: string;
  gold: string;
  /** Dusk — used by any surface that commits to dark in both themes. */
  night: string;
  night2: string;
  nightInk: string;
  nightSoft: string;
  nightAqua: string;
  nightOxblood: string;
  /** The arc. Bone, always. */
  bone: string;
};

export type TypeRoles = {
  display: string;
  body: string;
  mono: string;
};

export type Theme = {
  key: string;
  palette: Palette;
  /** Only the dark-mode overrides; everything else is inherited from palette. */
  paletteDark: Partial<Palette>;
  type: TypeRoles;
};

/**
 * Every stack begins with a face this repo ships itself (public/fonts, built by
 * scripts/build-fonts.py and content-hashed). The system names behind it are
 * for the moment a webfont fails, not for normal service.
 */
const TYPE: TypeRoles = {
  display: '"Bodoni Moda", Didot, "Bodoni MT", Georgia, serif',
  body: '"Karla", "Helvetica Neue", Arial, sans-serif',
  mono: '"Space Mono", ui-monospace, Menlo, monospace',
};

export const HOUSE: Theme = {
  key: "house",
  type: TYPE,
  palette: {
    ground: "#EFE3D2",
    ground2: "#E7D7C1",
    ink: "#2A2018",
    inkSoft: "#5E5245",
    inkFaint: "#8E8173",
    rule: "#D4C3AC",
    aqua: "#2F6675",
    oxblood: "#B4522C",
    gold: "#B98B33",
    night: "#16242E",
    night2: "#101B23",
    nightInk: "#F0E4D3",
    nightSoft: "#B0A492",
    nightAqua: "#6FB3C2",
    nightOxblood: "#E08050",
    bone: "#EDEBE3",
  },
  paletteDark: {
    ground: "#101B23",
    ground2: "#16242E",
    ink: "#F0E4D3",
    inkSoft: "#B0A492",
    inkFaint: "#7E7466",
    rule: "#2E3F4B",
    aqua: "#6FB3C2",
    oxblood: "#E08050",
    gold: "#DFAE55",
  },
};

/** camelCase token name -> the CSS custom property it becomes. */
function cssName(key: string): string {
  return `--${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`;
}

function declarations(values: Partial<Palette>): string {
  return Object.entries(values)
    .map(([k, v]) => `  ${cssName(k)}: ${v};`)
    .join("\n");
}

/**
 * The theme as a stylesheet.
 *
 * Written once into the document head by the root layout rather than kept as a
 * hand-maintained :root block, so that the TypeScript above is the only place a
 * colour is decided. When a world brings its own tokens, this same function
 * renders them under a scoped selector.
 *
 * Dark handling follows the three-state rule: the full light palette on bare
 * :root, only the overrides under prefers-color-scheme (guarded so an explicit
 * light choice wins), and the same overrides again under [data-theme="dark"].
 */
export function themeCss(theme: Theme = HOUSE, selector = ":root"): string {
  const dark = declarations(theme.paletteDark);
  return `${selector} {
${declarations(theme.palette)}
  --display: ${theme.type.display};
  --body: ${theme.type.body};
  --mono: ${theme.type.mono};
}

@media (prefers-color-scheme: dark) {
  ${selector}:not([data-theme="light"]) {
${dark}
  }
}

${selector}[data-theme="dark"] {
${dark}
}`;
}
