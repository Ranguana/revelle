/**
 * Turning codes back into words, for the desk.
 *
 * Everything a customer chose is stored as a permanent CODE (src/lib/quiz.ts:
 * "Labels are free to be reworded; codes are not"). The desk has to show her
 * answers to a human, so it needs the reverse map — and it must be the SAME
 * list she was shown, not a second copy of it that drifts. Hence: derived from
 * the quiz module and the voice module, never typed out again.
 *
 * Framework-free. No React, no "server-only" — a script may want it too.
 */

import { FIELDS } from "@/lib/quiz";
import { TONE } from "@/lib/voice";

/**
 * The label for one option of one field. Falls back to the code itself, which
 * is the honest answer for a retired option a live row still references — see
 * the `budget` question, asked up to 2026-08-a and never rewritten.
 */
export function optionLabel(fieldId: string, code: string | null): string {
  if (!code) return "—";
  const field = FIELDS[fieldId];
  if (field && (field.type === "single" || field.type === "multi")) {
    const found = field.options.find((option) => option.code === code);
    if (found) return found.label;
  }
  return code;
}

export function optionLabels(
  fieldId: string,
  codes: readonly string[] | null
): string[] {
  return (codes ?? []).map((code) => optionLabel(fieldId, code));
}

/** How her people talk. The fifty tones live in src/lib/voice.ts. */
export function toneLabel(code: string): string {
  return TONE[code]?.label ?? code;
}

/** Staff workflow on an application. quiz_status in db/001. */
export const APPLICATION_STATUS: Readonly<Record<string, string>> = {
  new: "New",
  in_progress: "In progress",
  delivered: "Delivered",
  archived: "Archived",
};

/** product_status in db/002, shared by product, game and menu. */
export const POOL_STATUS: Readonly<Record<string, string>> = {
  draft: "Draft",
  active: "Active",
  discontinued: "Discontinued",
};

/** world_status in db/001. */
export const WORLD_STATUS: Readonly<Record<string, string>> = {
  draft: "Draft",
  published: "Published",
  retired: "Retired",
};

/** price_band in db/002. Distinct from an EVENT budget — see the comment there. */
export const PRICE_BANDS: readonly { code: string; label: string }[] = [
  { code: "under_25", label: "Under $25" },
  { code: "from_25_to_75", label: "$25 – $75" },
  { code: "from_75_to_200", label: "$75 – $200" },
  { code: "from_200_to_500", label: "$200 – $500" },
  { code: "over_500", label: "Over $500" },
];

/** season_band in db/012. */
export const SEASONS: readonly { code: string; label: string }[] = [
  { code: "spring", label: "Spring" },
  { code: "summer", label: "Summer" },
  { code: "high_summer", label: "High summer" },
  { code: "autumn", label: "Autumn" },
  { code: "winter", label: "Winter" },
  { code: "shoulder", label: "Shoulder season" },
  { code: "year_round", label: "Year-round" },
];

/**
 * THE MAKING AXIS, IN THE WORDS OF THE POOL THAT SPEAKS IT.
 *
 * One axis, three positions, two vocabularies — docs/menus.md and docs/drinks.md
 * are explicit about both halves of that. A menu is actually made; the same
 * position at the bar is actually mixed. Nothing downstream can tell them
 * apart: db/017 projects both onto the single `made_by_hand` facet, and
 * `bought and poured` is `bought_and_arranged` said over ice.
 *
 * `retired` is the fourth rung the catalogue used to have. It is kept in the
 * list, marked, for one reason: a select that does not contain the value a row
 * currently holds silently rewrites that row on the next save. A curator sees
 * it, can move a menu off it, and cannot arrive at it by accident.
 */
export type MakingLevel = { code: string; label: string; retired?: true };

/** cooking_level in db/012 — the values as authored in docs/menus.md. */
export const COOKING_LEVELS: readonly MakingLevel[] = [
  { code: "actually_made", label: "Actually made" },
  { code: "half_made", label: "Half made" },
  { code: "bought_and_arranged", label: "Bought and arranged" },
  { code: "mostly_made", label: "Mostly made (retired)", retired: true },
];

/** making_level in db/016 — the same axis, as authored in docs/drinks.md. */
export const MIXING_LEVELS: readonly MakingLevel[] = [
  { code: "actually_made", label: "Actually mixed" },
  { code: "half_made", label: "Half made" },
  { code: "bought_and_arranged", label: "Bought and poured" },
  { code: "mostly_made", label: "Mostly mixed (retired)", retired: true },
];

/**
 * making_level in db/016 on a DISH — docs/dishes.md's B · H · M.
 *
 * THE SAME LIST as COOKING_LEVELS, aliased rather than copied, because a dish
 * is food and speaks the menus' words: her document glosses its own letters as
 * "B = bought and arranged · H = half made · M = actually made", which is the
 * menu vocabulary exactly. The alias exists so that a reader of the dish
 * screens is not left wondering why a `making_level` column is labelled from a
 * constant named for `cooking_level`. Writing the three words out a third time
 * is how a vocabulary starts to disagree with itself.
 */
export const DISH_LEVELS: readonly MakingLevel[] = COOKING_LEVELS;

/**
 * `meal_shape` in db/023 — what a table IS, in the order a day runs.
 *
 * Derived from the founder's own "what it's for" lines across docs/menus.md and
 * docs/drinks.md rather than invented; db/023 lists which line lands in which
 * and argues the three foldings. Her letter codes are the fourth field of a
 * dish line and are carried here so the desk and the document agree on sight.
 *
 * NO CLAIM MEANS EVERY SHAPE, which is why a dish with none of these ticked is
 * complete rather than unfinished.
 */
export const MEAL_SHAPES: readonly {
  code: string;
  label: string;
  letter: string;
}[] = [
  { code: "brunch", label: "Brunch", letter: "BR" },
  { code: "lunch", label: "Lunch", letter: "L" },
  { code: "cocktails", label: "Standing drinks", letter: "C" },
  { code: "long_dinner", label: "A long dinner", letter: "D" },
  { code: "late_supper", label: "A late supper", letter: "LS" },
];

/**
 * `course` in db/021 — closed and structural, exactly as season_band is.
 *
 * In the order a meal runs. Not a facet and never offered in a tag picker:
 * nobody prefers appetizers, and db/016's test for whether a term earns a facet
 * is whether a host can answer in it. db/022 projects it into `dish_slot` as a
 * native claim, which is how an appetizer stays out of the main course.
 */
export const COURSES: readonly { code: string; label: string }[] = [
  { code: "appetizer", label: "Appetizer" },
  { code: "main", label: "Main" },
  { code: "dessert", label: "Dessert" },
];

/** occasion_type in db/001, in the order the application offers them. */
export const OCCASIONS: readonly string[] = [
  "birthday",
  "girls_weekend",
  "dinner_party",
  "getaway",
  "anniversary",
  "holiday",
  "bridal",
  "no_reason",
  "other",
];

/** section_kind in db/001 — the anatomy of a Revelle. */
export const SECTION_KINDS: readonly { code: string; label: string }[] = [
  { code: "world", label: "The destination" },
  { code: "arrival", label: "The arrival" },
  { code: "moment", label: "The moment" },
  { code: "ending", label: "The ending" },
  { code: "fun", label: "The fun" },
  { code: "soundtrack", label: "The soundtrack" },
  { code: "details", label: "The table" },
  { code: "edit", label: "The edit" },
  { code: "downloads", label: "The downloads" },
  { code: "make_it_happen", label: "The prep" },
];

export function sectionLabel(code: string): string {
  return SECTION_KINDS.find((s) => s.code === code)?.label ?? code;
}

/* ── numbers and dates ──────────────────────────────────────────────── */

export function money(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "—";
  return `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Whole dollars, for the ceilings out of quiz_response_scale. */
export function dollars(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return "—";
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

/**
 * The absolute date, always. A relative one ("2 days ago") is friendlier and
 * useless the moment two people compare notes about which application they
 * mean.
 */
export function stamp(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function day(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** A slug from a name, for a curator who should not have to think about one. */
export function slugify(input: string): string {
  const slug = input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  // The CHECK constraints on every pool insist a slug starts with a letter.
  return /^[a-z]/.test(slug) ? slug : `x-${slug}`;
}
