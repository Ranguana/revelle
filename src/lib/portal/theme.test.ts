/**
 * THE ONE PLACE A COLUMN BECOMES CSS.
 *
 * `world.tokens` is jsonb a curator edits at the desk, and `themeCss`
 * interpolates its values straight into a rule block. Everything below is one
 * question asked in several ways: can a string in that column leave the
 * declaration it was put in?
 *
 * These are unit tests and they run without a database, which is the point —
 * the rule they protect must be checkable on every commit rather than on the
 * one day somebody remembers to look at a rendered page.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { HOUSE, themeCss } from "../tokens.ts";
import { readTheme } from "./theme.ts";

/** The look Westhampton actually ships, as it is stored. */
const WESTHAMPTON = {
  key: "westhampton-1976",
  type: {
    display: '"Bodoni Moda", Didot, "Bodoni MT", Georgia, serif',
    body: '"Karla", "Helvetica Neue", Arial, sans-serif',
    mono: '"Space Mono", ui-monospace, Menlo, monospace',
  },
  palette: { ground: "#E9DCC4", ink: "#26251C", aqua: "#2C6157" },
  paletteDark: { ground: "#0F1512", ink: "#EDE2CC" },
};

test("a destination's own tokens come through unchanged", () => {
  const { theme, clean } = readTheme(WESTHAMPTON, "westhampton-1976");

  assert.equal(clean, true, "nothing authored by hand should be refused");
  assert.equal(theme.palette.ground, "#E9DCC4");
  assert.equal(theme.palette.aqua, "#2C6157");
  assert.equal(theme.type.display, WESTHAMPTON.type.display);
  assert.equal(theme.paletteDark.ground, "#0F1512");
});

test("and what it does not say is the house's, so the set is always complete", () => {
  const { theme } = readTheme(WESTHAMPTON);

  // Westhampton's stored set above names three colours. Every other token has
  // to have a value or the page renders with an unset custom property, which
  // is transparent text on a transparent ground.
  assert.equal(theme.palette.gold, HOUSE.palette.gold);
  assert.equal(theme.palette.bone, HOUSE.palette.bone);
  assert.ok(
    Object.values(theme.palette).every((v) => typeof v === "string" && v.length > 0)
  );
});

test("nothing in a token set can end its own declaration", () => {
  const attack = {
    palette: {
      // The whole attack in one string: close the value, close the rule, open
      // a new one against a selector of the attacker's choosing.
      ground: "#fff; } body { display: none } .x {",
      ink: "red; position: fixed",
      aqua: "url(https://elsewhere.example/x.png)",
      gold: "var(--anything)",
      oxblood: "expression(alert(1))",
    },
    type: {
      display: 'serif; } * { content: "no" } .y {',
      body: "sans-serif) ; @import url(https://elsewhere.example/x.css); (",
    },
  };

  const { theme, clean, complaints } = readTheme(attack);

  assert.equal(clean, false);
  assert.equal(complaints.length, 7, "every bad value is reported to the house");

  // The house's own values stood in for all of them.
  assert.equal(theme.palette.ground, HOUSE.palette.ground);
  assert.equal(theme.palette.ink, HOUSE.palette.ink);
  assert.equal(theme.type.display, HOUSE.type.display);

  // And the proof that matters: the rendered stylesheet contains no brace or
  // semicolon that this module did not put there. `themeCss` emits exactly
  // three rule blocks and a media query; anything the attacker added would
  // show up as an extra opening brace.
  const css = themeCss(theme, ".page");
  assert.ok(!css.includes("display: none"));
  assert.ok(!css.includes("@import"));
  assert.ok(!css.includes("url("));
  assert.equal(
    (css.match(/\{/g) ?? []).length,
    4,
    "three scoped blocks and one media query, and nothing smuggled in"
  );
});

test("a curator may still write a colour the ordinary ways", () => {
  const { theme, clean } = readTheme({
    palette: {
      ground: "#eee",
      ground2: "#EEDDCCFF",
      ink: "rgb(38 37 28)",
      inkSoft: "hsl(160 40% 28% / 0.9)",
    },
  });

  assert.equal(clean, true);
  assert.equal(theme.palette.ground, "#eee");
  assert.equal(theme.palette.ground2, "#EEDDCCFF");
  assert.equal(theme.palette.ink, "rgb(38 37 28)");
  assert.equal(theme.palette.inkSoft, "hsl(160 40% 28% / 0.9)");
});

test("garbage in the column is a page that still renders", () => {
  for (const stored of [null, undefined, 42, "not an object", [], {}]) {
    const { theme } = readTheme(stored);
    assert.equal(theme.palette.ground, HOUSE.palette.ground);
    assert.equal(theme.type.body, HOUSE.type.body);
  }
});

test("a destination's dark set is its own, never half of two", () => {
  // Half-inverted is the failure this guards: a dark ground taken from the
  // destination with the house's dark ink over it, or worse, a dark ground
  // with the destination's LIGHT ink still inherited.
  const { theme } = readTheme({
    palette: { ground: "#E9DCC4", ink: "#26251C" },
    paletteDark: { ground: "#0F1512", ink: "#EDE2CC" },
  });

  assert.deepEqual(Object.keys(theme.paletteDark).sort(), ["ground", "ink"]);
  assert.equal(theme.paletteDark.rule, undefined, "not merged with the house's");
});

test("a destination with no dark set borrows the house's whole one", () => {
  const { theme } = readTheme({ palette: { ground: "#E9DCC4" } });

  assert.deepEqual(theme.paletteDark, HOUSE.paletteDark);
});
