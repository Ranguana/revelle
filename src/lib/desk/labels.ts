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

/**
 * THE SAME ENUM, ON THE MENU POOL, WHERE THE THIRD VALUE MEANS RETIRED.
 *
 * db/045 retired all thirty-nine menus by founder ruling — db/022 deleted the
 * nine `occasion_slot` rows for `the_menu`, so no package can deliver one. It
 * could not write `status = 'retired'`: `product_status` has no such value,
 * and adding one is impossible inside a single migration (Postgres refuses to
 * USE a new enum value in the transaction that added it) and disproportionate
 * across the six pools that share the type. So the honest available value is
 * `discontinued`, and db/045 argues that at length.
 *
 * What that leaves is a WORD gap, not a data gap: a menu is not discontinued
 * by a supplier, it is retired by a decision. The gap is closed here, in the
 * one place this codebase keeps its vocabulary, rather than by each screen
 * spelling its own third word — which is how two surfaces come to disagree
 * about what a status means (rule 21).
 *
 * `draft` and `active` are POOL_STATUS's, verbatim, because on a menu they
 * mean exactly what they mean everywhere else.
 */
export const MENU_STATUS: Readonly<Record<string, string>> = {
  draft: POOL_STATUS.draft,
  active: POOL_STATUS.active,
  discontinued: "Retired",
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

/* ── the games ──────────────────────────────────────────────────────── */

/**
 * `game_shape` in db/010 — what a game does to an EVENING, not what it is like.
 *
 * Structural and never a facet, for the reason `course` is not one: nobody
 * prefers a scheduled game. It is what stops the filler booking two of them for
 * the same hour, and what makes a duration on an ambient game a contradiction
 * the database refuses rather than a curiosity.
 */
export const GAME_SHAPES: readonly { code: string; label: string }[] = [
  { code: "scheduled", label: "Scheduled" },
  { code: "ambient", label: "Ambient" },
  { code: "finale", label: "The finale" },
];

/**
 * `game_sourcing` in db/010 — whether the house may PRINT it or only point.
 *
 * A recommended game is somebody else's product: Revelle may name it and may
 * not reproduce a rule or a card. db/025 enforces that from the other side by
 * refusing a runbook step that reproduces play.
 */
export const GAME_SOURCING: readonly { code: string; label: string }[] = [
  { code: "provided", label: "Provided" },
  { code: "recommended", label: "Recommended" },
];

/** `host_role` in db/025 — is she playing, or is running it her whole job? */
export const HOST_ROLES: readonly { code: string; label: string }[] = [
  { code: "plays_too", label: "She plays too" },
  { code: "runs_it", label: "She runs it" },
];

/** `supply_source` in db/010 — how a supply arrives. */
export const SUPPLY_SOURCES: Readonly<Record<string, string>> = {
  printed: "Printed",
  host_buys: "She buys it",
  on_hand: "Already on hand",
};

/** `dependency_strength` in db/010. A group of `required` rows reads as any-of. */
export const DEPENDENCY_STRENGTH: Readonly<Record<string, string>> = {
  required: "Needs",
  enriched_by: "Better after",
};

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

/* ── the bank ───────────────────────────────────────────────────────── */

/**
 * `bank_kind` in db/031 — WHAT A CURATOR CALLS IT, and nothing else.
 *
 * The four kinds share one table because their mechanics are identical: per
 * destination, draft/active, a phase, what it needs of the room, a lead time, a
 * technique card. The kind is the word, not the behaviour, which is why it is a
 * filter and a column and never a fifth table.
 *
 * `game` here is a game a HOUSE HAS OUT — backgammon, the good chess set — and
 * is not the authored `game` pool at /desk/games. Two pools may hold the word
 * without holding the same thing, and the hint on the form says so where a
 * curator is choosing.
 */
export const BANK_KINDS: readonly { code: string; label: string }[] = [
  { code: "good", label: "A good" },
  { code: "host_act", label: "A host act" },
  { code: "game", label: "A game in the room" },
  { code: "printed_card", label: "A printed card" },
];

/**
 * `bank_phase` in db/031 — and the whole reason this map exists is `all`.
 *
 * `all` IS THE DEFAULT AND MEANS NO OPINION. It is not "every phase" and it is
 * not "always". Most atmosphere has no time of day, and db/031 chose that
 * default precisely because a tag that must be filled in for every row gets
 * filled in wrongly. A curator who reads the word "All" in a column will tag
 * rows to match it, so the word is never shown: the label is "No opinion" on
 * every screen, and the gloss below is shown wherever there is room for it.
 *
 * ── `dawn`, ADDED BY db/033 ──────────────────────────────────────────
 *
 * DAWN IS NOT DARK, and the migration is blunt about why the value had to
 * exist: "Havana's first-light register is the windows going blue, which is the
 * opposite of deep night, and St. Moritz's breakfast is the same hour. `dark`
 * was the nearest available value and it was false, so both were left at `all`
 * — a content type refusing to lie, which is the right failure and still a
 * loss."
 *
 * ── THE ORDER IS THE DAY, AND THEN THE ABSENCE OF A CLAIM ────────────
 *
 * The four real claims run as the day runs — daylight, dusk, dark, dawn — which
 * is where `dawn` genuinely falls: after the dark it ends, not between `dark`
 * and `all` alphabetically and not first because the word means morning. The
 * default comes last, the way SEASONS puts `year_round` last for the same
 * reason: it is not a fifth time of day, it is the absence of a claim about
 * which one, and a list that mixes it in among the four invites a curator to
 * pick it as though it were one.
 */
export const BANK_PHASES: readonly {
  code: string;
  label: string;
  gloss: string;
}[] = [
  { code: "daylight", label: "Daylight", gloss: "it belongs in the light" },
  { code: "dusk", label: "Dusk", gloss: "it belongs as the light goes" },
  { code: "dark", label: "Dark", gloss: "it belongs after dark" },
  { code: "dawn", label: "Dawn", gloss: "it belongs as the windows go blue" },
  {
    code: "all",
    label: "No opinion",
    gloss:
      "no claim about the time of day — not “every phase”, not “always”",
  },
];

/**
 * `BANK_VENUES` WAS HERE, AND db/033 BEAT IT. Standing rule 12: the argument is
 * kept and what beat it is named, because in six months the reasoning is the
 * part that gets lost and a deleted argument gets re-made.
 *
 * ── WHAT IT SAID ─────────────────────────────────────────────────────
 *
 * It was the desk's map for `bank_venue` in db/031, three grades — "Indoors is
 * fine" for `none`, "Needs a door to somewhere" for `outdoor_access`, "Cannot
 * happen inside" for `requires_outdoors` — and its comment argued, correctly,
 * that they must never be collapsed: "`requires_outdoors` means it CANNOT
 * happen inside. `outdoor_access` is the softer grade the sparklers wanted: it
 * needs a door to somewhere, which most apartments have. The distinction is the
 * whole reason this is not a boolean." Neither label carried the bare word
 * "outdoors": one said what it needs, the other what it cannot do.
 *
 * ── WHAT BEAT IT ─────────────────────────────────────────────────────
 *
 * Not the grades — those survive, and the screens still draw the hard one as a
 * veto and the soft one as plain text. What lost was the SECOND VOCABULARY.
 * `bank_venue` said in its own words what `structural_requirement` had said
 * since db/020, which is why `venueEligibility()` could read a menu's venue and
 * not a bank item's. db/033 moved the two tagged rows into
 * `ingredient_requirement`, dropped the column and dropped the type, and added
 * `outdoor_access` to the real vocabulary as the soft grade it always was. The
 * founder's instruction was "unify the venue vocabulary, don't bridge it", and
 * a hand-written list here beside a table holding the same codes is a bridge.
 *
 * ── WHERE IT WENT ────────────────────────────────────────────────────
 *
 * src/lib/desk/requirements.ts, which reads the vocabulary rather than
 * declaring it. Two consequences worth carrying across:
 *
 *   `none` HAS NO CODE ANY MORE. There is no row that says "indoors is fine";
 *   there is the ABSENCE of a row, and db/020 is explicit that it means "works
 *   anywhere" — not merely indoors, and not a gap. Every screen prints those
 *   words, lower case, under the rule that a capital is a claim.
 *
 *   THE LADDER IS ORDERING, not a pair. `requires_outdoors` sits at position 10
 *   and `outdoor_access` at 15, so printing the vocabulary in `position` order
 *   puts the lesser grade directly under the greater wherever it appears.
 */

/**
 * `bank_item.ships` in db/031, in words, because the boolean is a trap.
 *
 * FALSE IS OWNED-IF-PRESENT: the scene card may GLANCE at it and nothing ships.
 * Turntables, fireplaces, backgammon, the good chess set — a house either has
 * one or the line is not written. It is NOT "out of stock", not "unavailable"
 * and not "we forgot to source it", and a blank cell or an unticked box would
 * read as all three. So it is never drawn as an absence: both states are a
 * sentence, on the form and in the table.
 */
export const BANK_SHIPS: readonly {
  value: boolean;
  label: string;
  short: string;
  gloss: string;
}[] = [
  {
    value: true,
    label: "It ships",
    short: "Ships",
    gloss: "the house sends it, or sends her to buy it",
  },
  {
    value: false,
    label: "Owned if present — nothing ships",
    short: "Owned if present",
    gloss:
      "the scene card may glance at it and nothing is sent: a house either has one or the line is not written",
  },
];

export function shipsWord(ships: boolean | null | undefined): string {
  const entry = BANK_SHIPS.find((row) => row.value === (ships === true));
  return entry ? entry.short : BANK_SHIPS[0].short;
}

/**
 * `bank_item.min_lead_days`, where NULL IS A CLAIM.
 *
 * db/031: "Nulls mean 'no lead time', not 'unknown'." Everywhere else in this
 * tool an em dash means a fact nobody has supplied, so an em dash here would
 * say the opposite of what the null says. Hence a word.
 */
export function leadDays(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "none needed";
  const days = Number(value);
  if (!Number.isFinite(days)) return "none needed";
  return days === 1 ? "1 day ahead" : `${days} days ahead`;
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
 * A duration, from the two columns db/010 stores it in.
 *
 * "45–60 min" when there is a range, "45 min" when the two agree or only the
 * planning figure exists. An ambient game has NEITHER by constraint, and the
 * honest rendering of that is not "0 min" — it is the em dash every other
 * absent fact in this tool uses, with the shape column beside it saying why.
 */
export function minutes(
  low: number | null | undefined,
  high?: number | null
): string {
  if (low === null || low === undefined) {
    return high === null || high === undefined ? "—" : `up to ${high} min`;
  }
  if (high === null || high === undefined || high === low) return `${low} min`;
  return `${low}–${high} min`;
}

/**
 * A guest range, from db/009's two nullable bounds.
 *
 * Null at an end means NO LIMIT at that end, which is a real claim and not a
 * missing value — Art Battle's absent ceiling is the founder writing "6-30+"
 * and meaning the plus. So "6 or more", never "6–null" and never "6".
 */
export function guests(
  min: number | null | undefined,
  max: number | null | undefined
): string {
  if (min === null || min === undefined) {
    return max === null || max === undefined ? "any number" : `up to ${max}`;
  }
  if (max === null || max === undefined) return `${min} or more`;
  return `${min}–${max}`;
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
