/**
 * THE ORDER THE HOUSE PRESENTS A DESTINATION IN — which is not the order the
 * database stores one in, and the difference is the whole reason this file
 * exists.
 *
 * `slot_kind.position` (db/009) is the order the ENGINE fills slots: the
 * welcome, the drink, the table, the menu, the moment, the honouring, the day,
 * the game, the music, the edit, the favour. It is a good filling order and a
 * bad reading order — it puts the table before the moment, and it splits the
 * table in two, because `table_object` sits at 30 and `day_material` at 60
 * with three other slots between them.
 *
 * The reading order is the one the house has always used, in
 * src/lib/library.ts's DELIVERABLES and on the landing page: the look, the
 * arrival, the moment, the ending, the fun, the soundtrack, the table, the
 * edit, the printed matter, the prep. That list is the customer-facing
 * sequence and it is what she is shown here.
 *
 * ── THE NAMES ARE THE HOUSE'S, NOT THE SCHEMA'S ──────────────────────
 *
 * `details` is a section_kind. THE TABLE is what it is called. Nothing on a
 * member's screen is ever named after a column, and in particular `world`
 * renders as THE LOOK — docs/copy-brief.md bans the word "world" in anything a
 * customer reads, and says in as many words that THE WORLD becomes THE LOOK.
 *
 * Framework-free. No React, no server-only: a script or a print job needs the
 * same order and must not have to start Next to get it.
 */

import type { SectionKind } from "../selection/types.ts";

/**
 * The reading order, and the only place it is written down.
 *
 * A section absent from this list would silently vanish from her page, so the
 * type is `Record<SectionKind, …>` — adding a value to the enum is a compile
 * error here until somebody decides where it reads.
 */
export const SECTION_NAMES: Record<SectionKind, string> = {
  world: "The Look",
  arrival: "The Arrival",
  moment: "The Moment",
  ending: "The Ending",
  fun: "The Fun",
  soundtrack: "The Soundtrack",
  details: "The Table",
  edit: "The Edit",
  downloads: "The Printed Matter",
  make_it_happen: "The Prep",
};

export const SECTION_ORDER: readonly SectionKind[] = [
  "world",
  "arrival",
  "moment",
  "ending",
  "fun",
  "soundtrack",
  "details",
  "edit",
  "downloads",
  "make_it_happen",
];

/**
 * Regroup anything carrying a section into the house's order.
 *
 * Returns only sections that HAVE something. There is no empty group in the
 * result and therefore no way for a caller to print a heading over nothing —
 * the same discipline `memberRevelle` uses when it hangs the heading on the
 * piece instead of on a list of slots.
 */
export function inHouseOrder<T extends { section: SectionKind }>(
  items: readonly T[]
): { section: SectionKind; name: string; items: T[] }[] {
  const out: { section: SectionKind; name: string; items: T[] }[] = [];
  for (const section of SECTION_ORDER) {
    const items_ = items.filter((item) => item.section === section);
    if (items_.length === 0) continue;
    out.push({ section, name: SECTION_NAMES[section], items: items_ });
  }
  return out;
}

/**
 * A small count in words.
 *
 * Words rather than digits because docs/copy-brief.md bans counting the
 * EXPERIENCE, and a numeral sitting beside an object reads as a tally even
 * when it is a fact about the object. "Five prompt cards" is a description;
 * "5" beside a heading is a badge. Above twelve it is a numeral again, because
 * "twenty-seven" is worse than 27 and nothing in this catalogue is that big.
 */
const WORDS = [
  "no",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
];

export function inWords(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "";
  const whole = Math.round(n);
  return whole < WORDS.length ? WORDS[whole] : String(whole);
}

/**
 * A date the way the house says one: a day by name and a month by name, no
 * ordinal suffix and no year unless it is not this one.
 *
 * Built in UTC from the calendar parts rather than parsed, because
 * `new Date("2026-09-05")` is midnight UTC and renders as the fourth to
 * anybody west of Greenwich — which is where the founder and most of the
 * membership are.
 *
 * An undated Revelle returns the empty string. There is no "date to be
 * confirmed": a date that has not been fixed is not news to the person who has
 * not fixed it.
 */
export function longDate(iso: string | null, now = new Date()): string {
  if (!iso) return "";
  const parts = iso.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return "";
  const [year, month, day] = parts;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: year === now.getFullYear() ? undefined : "numeric",
    timeZone: "UTC",
  });
}
