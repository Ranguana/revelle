# Handoff: Revelle Société — tone icons

## Overview
Fifty-one icons, one per tone, for the membership-application step that asks
**"How do these people talk to each other?"** The host taps the tones that sound like her
friends, and those taps are the *only* signal telling the house what register to write her
invitations, menus and place cards in — so these tiles carry more weight than their size
suggests. Treat them as content, not chrome.

The tiles render at roughly **40–48px**. Nothing in any icon depends on detail below ~2px.

## About the Design Files
These are **design references created in HTML** — the SVGs are final production assets, but
`Tone Icons.dc.html` is a review harness, not code to ship. Recreate the picker in the target
codebase using its own framework and styling conventions.

Prototype-only conventions, do NOT carry over:
- All styling is inline (an environment constraint). Move to the codebase's styling layer.
- `Tone Icons.dc.html` uses a small custom template runtime (`support.js`, `<sc-for>`,
  `<sc-if>`, `{{ }}` holes, `class Component extends DCLogic`). `support.js` is included only
  so the file opens in a browser — do not port it.
- The harness paints each icon as a CSS `background-image` rather than an `<img>`. That is a
  workaround for the prototype runtime emitting unresolved template holes as URLs; in a real
  build, use `<img>` or inline SVG normally.

**The 51 files in `tones/` are the deliverable and ship as-is.**

## Fidelity
**Production assets.** Final geometry, final colours, final proportions.

## The assets
`tones/<code>.svg` — 51 files, named by tone code (`deadpan.svg`, `dry_aside.svg`, …).
- `viewBox="0 0 64 64"`, **no** `width`/`height` attributes — size them from CSS.
- No `<style>` blocks, no external references, no raster, no `<text>`, no letterforms or numerals.
- Colours are literal hexes, ready to swap for CSS tokens on the way in.
- `tones/labels.json` — `{ code: sentence }` for all 51, the exact text printed under each tile.

### Palette
| role | hex | use |
| --- | --- | --- |
| ink | `#26251C` | the primary drawing |
| oxblood | `#A83E24` | the accent — one element per icon, at most |
| aqua | `#1F6B7A` | secondary accent, used sparingly |
| gold | `#C9922F` | warmth and light, used sparingly |
| ground | `#FBF4E7` | the cream behind — never drawn on |

Swap by string replacement on those five hexes. No icon introduces a colour outside the table.

## ⚠ The one thing not to break: normalization
Every icon is fitted to the **same 46-unit optical box, centred at 32,32**, by a transform on
the root `<g>`:

```xml
<g transform="translate(TX TY) scale(S)" fill="none" stroke="#26251C"
   stroke-width="W" stroke-linecap="round" stroke-linejoin="round">
```

where **`W = 1.5 ÷ S`**, so all 51 render at an identical **1.5-unit visual stroke weight**
regardless of how far each drawing was scaled to fit. Scale factors range **0.77–1.61**.

Consequences for the implementation:
- **Do not** normalize, prettify, or re-minify these files with a tool that flattens transforms
  into path data without recomputing stroke-width — that silently destroys the uniform weight.
- **Do not** set a global `stroke-width` in CSS. It would override the per-file compensation and
  the set would immediately look like 51 unrelated drawings at 51 different weights.
- If you re-scale an icon by hand, preserve `stroke-width × scale === 1.5`.
- SVGO is safe only with `convertPathData`/`convertTransform` collapsing disabled.

Note on the brief: it asked for ~1.25 units. The set ships at **1.5 rendered**, uniformly. At
1.25 the icons were frail at 44px, and with scale factors spanning 0.77–1.61 a fixed authored
1.25 would have rendered between 0.8 and 2 units of apparent weight across the set. One
rendered weight was chosen over one authored number. Reversing it is a single constant.

## Level of abstraction
Each icon is **one small object or gesture from the dinner-table world** — glass, candle, chair,
card, clock, door, bell, hourglass. None of them diagram conversation (no "line = phrase,
dot = person, gap = silence"); that approach was explicitly rejected as unreadable. The feeling
should arrive before the label; the label only confirms it.

If new tones are added later, draw them as objects at this same level of literalness and fit
them to the same 46-unit box, or they will read as an accident.

## The picker UI to build
- Grid of tiles, icon above the sentence from `labels.json`. Multi-select; no minimum, no maximum.
- Grouped in this order, with these exact group headings:
  1. **When something is funny** — deadpan, dry_aside, teasing, in_jokes, absurd, self_deprecating, nothing_sacred, good_natured
  2. **How loud a room they are** — all_at_once, interrupts, one_conversation, across_the_room, low_voices, laughs_first
  3. **How much ceremony they can take** — toasts, rises_to_greet, seating_plan, no_speeches, dressed_up, first_names
  4. **How they say the kind thing** — says_it_out_loud, nicknames, asks_properly, warm_not_loud, compliments_plainly, sentimental
  5. **How exact they are** — exact_word, will_look_it_up, corrects_gently, understated, roughly_eight, long_way_round
  6. **How fast the evening moves** — unhurried, talks_fast, arrives_late, lingers, no_dead_air, comfortable_silence
  7. **What they assume you already know** — leans_in, explains_nothing, straight_to_gossip, means_the_other_thing, between_us, spells_it_out
  8. **How much they perform** — makes_an_entrance, does_the_voice, one_tells_it, nothing_by_halves, never_performs, swears_fondly, impeccably_polite
- Selected state: keep it quiet — a hairline oxblood border or ground shift. **No** checkmarks,
  counters, progress, percentages, celebration or "you're almost there" states anywhere. The
  application never congratulates the applicant for continuing.
- Tap target ≥44px even though the icon may render smaller.
- The tone codes are the API contract. Persist codes, never labels or indices.
- Accessibility: each tile's accessible name is its sentence from `labels.json` (the icons are
  decorative once the sentence is read out). Selected state must be announced (`aria-pressed`).

## Notes on specific icons
- **good_natured** — two glasses meeting under a gold glow. Deliberately the warmest in its
  group and the only one with no target, so the distinction from **teasing** (a pin at a
  balloon) and **nothing_sacred** (a fence with a plank missing) is visible before reading.
- **deadpan** vs **dry_aside** — deadpan is an outrageous burst above a dead-level line;
  dry_aside is two glasses with a low remark curving away from the room, off to one side. Not twins.
- **nothing_sacred** vs **swears_fondly** — a boundary with a gap in it, versus a rose with one
  thorn. Limits versus affection that happens to sting.
- **impeccably_polite** — the clock reads three and the bow tie is still on. The hour is the joke;
  if the clock is ever cropped out, the tone is lost.
- **Watch these two:** `low_voices` is a bell with a damper across it and can read as a food
  cloche at small sizes; `dressed_up` and `impeccably_polite` share the bow-tie form, with the
  clock carrying the difference. Both are flagged for a second pass if user testing trips on them.

## The acceptance test
Cover the labels. Hand someone the grid and ask them to point at the group that laughs the
loudest, the group that stands on ceremony, and the group that says the important thing quietly.
If they can, the set works. Re-run this after any styling change — a global stroke override or an
aggressive SVG optimizer will fail it.

## Files
- `tones/*.svg` — the 51 production icons.
- `tones/labels.json` — code → sentence.
- `Tone Icons.dc.html` — review harness: hide-labels toggle (for the test above), 28/44/64px
  sizes, tile-bounds outlines. Reference only.
- `support.js` — prototype runtime. Do not port.
