/**
 * The quiz, as DATA.
 *
 * One module, imported by three things that must never disagree: the client
 * that renders the steps, the route handler that validates the submission, and
 * (later) the internal tool that reads a response back. If the vocabulary lived
 * in JSX, validating it on the server would mean writing it twice.
 *
 * Framework-free on purpose — no React, no "server-only" — so it can be
 * imported anywhere, including a script.
 *
 * ── Images ────────────────────────────────────────────────────────────
 * There is no image library yet. Every option therefore carries an OPTIONAL
 * `image`, and the renderer already branches on its presence: adding pictures
 * later is a data change in this file plus files in /public, not a rewrite of
 * the quiz. Do not make `image` required, and do not put the picture in the
 * component.
 *
 * ── Codes are permanent ───────────────────────────────────────────────
 * `code` is what lands in the database and in a customer's history. Labels are
 * free to be reworded; codes are not free to change. If a code's MEANING
 * changes, retire it and add a new one, and bump QUIZ_VERSION so old rows stay
 * interpretable against the question set they were actually shown.
 */

// The tone vocabulary lives in src/lib/voice.ts because it is half a mapping:
// every tone carries the voice facets it resolves to, and splitting the label
// from the meaning would leave two lists to keep in step. This module still
// owns how it is asked. The one dependency this file has, and it points at
// another framework-free module.
//
// Imported WITH the .ts extension, like src/lib/music/*, because this module is
// loaded directly by `node --test` and by scripts/check-facets.mjs, and Node
// resolves real files with no extension-guessing step. See the note on
// allowImportingTsExtensions in tsconfig.json.
import { TONE_GROUPS, TONES } from "./voice.ts";

/**
 * Stamped onto every submission. Bump on any change that alters what an answer
 * MEANS — a reworded question, a removed option, a changed min/max. Adding a
 * new option is additive and does not require a bump.
 *
 * 2026-08-c adds the voice question. A response written against 2026-08-b has
 * no `voice_tones` and is not missing one.
 */
export const QUIZ_VERSION = "2026-08-c";

export type QuizOption = {
  /** Permanent. Stored in the database. */
  code: string;
  label: string;
  /** One short line under the label. No italics, ever. */
  hint?: string;
  /** Not used yet. See the note above. */
  image?: { src: string; alt: string };
  /**
   * Which run of options this belongs to, when its field is grouped. The key of
   * an entry in `MultiField.groups`. Ignored otherwise.
   */
  group?: string;
};

/** A heading over a run of options. See MultiField.groups. */
export type OptionGroup = { key: string; label: string };

type BaseField = {
  id: string;
  /** Rendered above the options when a step has more than one field. */
  label?: string;
};

export type SingleField = BaseField & {
  type: "single";
  options: readonly QuizOption[];
  /**
   * The option that means "none of these" and opens a free-text box. The
   * database enforces the same pairing (see quiz_response_other_needs_text).
   */
  revealsTextField?: string;
};

export type MultiField = BaseField & {
  type: "multi";
  options: readonly QuizOption[];
  min: number;
  max: number;
  /**
   * How the options are drawn. "rows" — the default — is the full-width menu
   * every other question uses. "tiles" is a mark and a short label, for a field
   * whose options are too many to read as a list and short enough not to need
   * one. It is a presentation choice on DATA, not a component someone picks:
   * the renderer branches on it exactly as it branches on `image`.
   */
  layout?: "rows" | "tiles";
  /**
   * Headings that break a long field into runs. Options carry a matching
   * `group`. Any option whose group is missing from this list is drawn last,
   * under no heading, so a new option cannot vanish from the page.
   */
  groups?: readonly OptionGroup[];
  /**
   * Keep the footer quiet. The running "choose one more" line is right for a
   * field of ten she is filling in and wrong for a field of fifty she is
   * browsing — counting is the one thing docs/copy-brief.md forbids outright,
   * and a tally that appears the moment she taps a tile turns a browse into a
   * form. The ceiling still holds; it is enforced by replacement, silently.
   */
  quiet?: boolean;
};

export type TextField = BaseField & {
  type: "text";
  placeholder: string;
  maxLength: number;
  /** Optional fields let her move on with an empty answer. */
  optional: boolean;
  rows?: number;
};

export type EmailField = BaseField & { type: "email"; maxLength: number };

export type QuizField = SingleField | MultiField | TextField | EmailField;

export type QuizStep = {
  key: string;
  /** The small mono line: "01 / The occasion". */
  eyebrow: string;
  title: string;
  /** One line of guidance under the title. Optional. */
  help?: string;
  fields: readonly QuizField[];
};

const OCCASIONS: readonly QuizOption[] = [
  { code: "birthday", label: "A birthday", hint: "Yours, or one you are throwing" },
  { code: "girls_weekend", label: "A girls' weekend", hint: "Two nights, one house" },
  { code: "dinner_party", label: "A dinner party", hint: "One table, one evening" },
  { code: "getaway", label: "A getaway", hint: "Somewhere that is not home" },
  { code: "anniversary", label: "An anniversary", hint: "A year worth marking" },
  { code: "holiday", label: "A holiday", hint: "The calendar made you do it" },
  { code: "bridal", label: "Something bridal", hint: "Shower, weekend, the night before" },
  { code: "no_reason", label: "No reason at all", hint: "The best kind" },
  { code: "other", label: "Something else", hint: "Tell us in a word or two" },
];

/*
 * The question is where it happens, so every answer names a PLACE. An earlier
 * version offered "My home" against "A rented house", which asked who owns the
 * building — a fact that changes nothing the house sends. What the answer is
 * actually for is the kind of room: is there a kitchen and a table, or is
 * somebody else cooking and clearing.
 *
 * `rented_house` is retired rather than deleted. Codes are permanent (see the
 * note above): a stored answer still resolves through src/lib/desk/labels.ts,
 * it simply is not offered again.
 */
const ENVIRONMENTS: readonly QuizOption[] = [
  { code: "my_home", label: "A house" },
  { code: "city_apartment", label: "An apartment" },
  { code: "beach", label: "The beach" },
  { code: "mountains", label: "The mountains" },
  { code: "poolside", label: "Poolside" },
  { code: "garden", label: "A garden" },
  { code: "restaurant_or_venue", label: "A restaurant or venue" },
  { code: "hotel", label: "A hotel" },
  { code: "not_decided", label: "Still deciding" },
];

const TASTE_DIRECTIONS: readonly QuizOption[] = [
  { code: "old_world_riviera", label: "Old-world Riviera", hint: "Linen, lemons, a lunch that runs long" },
  { code: "desert_modern", label: "Desert modern", hint: "Low furniture, high sun, hard shadows" },
  { code: "disco_after_dark", label: "Disco after dark", hint: "Mirror, low light, a floor that fills" },
  { code: "english_country", label: "English country", hint: "Candles, chintz, dogs on the good sofa" },
  { code: "supper_club", label: "Supper club", hint: "Red leather, martinis, someone at the piano" },
  { code: "tropical_maximal", label: "Tropical maximalism", hint: "Print on print. Rum. Nothing restrained" },
  { code: "nordic_quiet", label: "Nordic quiet", hint: "Pale wood, one perfect thing on the table" },
  { code: "deco_hotel", label: "Deco hotel", hint: "Brass, marble, a bar that knows the order" },
  { code: "americana_backyard", label: "Americana backyard", hint: "Checked cloth, corn, a very good pie" },
  { code: "moroccan_dusk", label: "Moroccan dusk", hint: "Lanterns, low cushions, mint after dinner" },
  { code: "faded_coastal", label: "Faded coastal", hint: "Salt on everything, bare feet by eight" },
];

const GROUP_FUN: readonly QuizOption[] = [
  { code: "long_dinner", label: "Sit at the table for five hours" },
  { code: "dance", label: "Dance without being asked twice" },
  { code: "compete", label: "Get genuinely competitive" },
  { code: "toast", label: "Make speeches and toasts" },
  { code: "dress_up", label: "Commit to an outfit" },
  { code: "perform", label: "Sing, badly, on purpose" },
  { code: "talk_deep", label: "Split into corners and talk properly" },
  { code: "wander", label: "End up somewhere unplanned" },
  { code: "swim_late", label: "Swim long after dark" },
  { code: "cook_together", label: "Crowd into the kitchen" },
];

const ANTI_PREFERENCES: readonly QuizOption[] = [
  { code: "forced_fun", label: "Forced participation" },
  { code: "costumes", label: "A costume rule" },
  { code: "schedule", label: "A schedule that runs the day" },
  { code: "loud", label: "Music too loud to talk over" },
  { code: "novelty", label: "Novelty props and balloons" },
  { code: "photographed", label: "Being photographed all night" },
  { code: "surprise_cost", label: "Anything that surprises the wallet" },
  { code: "strangers", label: "More people than we know" },
  { code: "kids_party", label: "Anything that feels like a kids' party" },
  { code: "prep_marathon", label: "A project plan the day before" },
];

const AFFINITIES: readonly QuizOption[] = [
  { code: "one_moment", label: "One moment they retell for years" },
  { code: "ease", label: "Everything already handled" },
  { code: "beauty", label: "A table worth photographing" },
  { code: "ritual", label: "A ritual we repeat next year" },
  { code: "wit", label: "An inside joke, made real" },
  { code: "late", label: "Permission to stay up" },
];

/**
 * HOW HER PEOPLE TALK.
 *
 * The one question about the VOICE rather than the look. Everything else the
 * application asks decides what her Revelle looks like; nothing until now
 * decided how it reads, and the writing is the half her guests actually hold in
 * their hands. See "The voice questions" in docs/build-checklist.md.
 *
 * The vocabulary is not repeated here. It is src/lib/voice.ts, where each tone
 * also carries the voice facets it resolves to — one list, so a tone cannot
 * exist on the page without a meaning underneath it, and a meaning cannot be
 * edited without the label beside it.
 */
const VOICE_TONES: readonly QuizOption[] = TONES.map((tone) => ({
  code: tone.code,
  label: tone.label,
  group: tone.group,
}));

/**
 * How many people. A BAND, not a number typed into a box.
 *
 * Every other answer here is a tap, and a spinner asking for an exact integer
 * would be the one moment the application turns into a form — for a number she
 * usually does not have yet. A band she can answer today.
 *
 * The bands are still ARITHMETIC. Each one carries a low, a high and a planning
 * number in `quiz_option_range` (db/006), so "$150 a head, nine to twelve"
 * resolves to a real ceiling. They widen as they climb because that is where
 * the resolution is actually needed: at six people two more changes what we
 * buy, at forty it does not. Every closed band spans less than a factor of two.
 *
 * The exact number, when it is finally known, is `revelle.guest_count` — the
 * count you print place cards from. This is what she said when she applied.
 */
const GUEST_COUNTS: readonly QuizOption[] = [
  { code: "two", label: "Two of us" },
  { code: "from_3_to_5", label: "Three to five" },
  { code: "from_6_to_8", label: "Six to eight" },
  { code: "from_9_to_12", label: "Nine to twelve" },
  { code: "from_13_to_20", label: "Thirteen to twenty" },
  { code: "from_21_to_35", label: "Twenty-one to thirty-five" },
  { code: "from_36_to_60", label: "Thirty-six to sixty" },
  { code: "over_60", label: "More than sixty" },
];

/**
 * What she is spending A HEAD.
 *
 * This replaces a total-spend question — field `budget`, codes `under_500` …
 * `over_6000`, asked up to QUIZ_VERSION 2026-08-a and retired rather than
 * reworded, because the codes would otherwise have quietly changed meaning.
 * $100 a head at six people and at forty are different products; a total is not
 * comparable across sizes and tells the selection layer nothing until it is
 * divided by a guest count nobody asked for. Per head is the register, and per
 * head times guests is the ceiling.
 *
 * The ladder is the old one re-expressed at a table of eight — 500, 1,500,
 * 3,000 and 6,000 divided by eight — then rounded to round numbers that double.
 */
const SPEND_PER_PERSON: readonly QuizOption[] = [
  { code: "under_75", label: "Under $75" },
  { code: "from_75_to_150", label: "$75 to $150" },
  { code: "from_150_to_300", label: "$150 to $300" },
  { code: "from_300_to_600", label: "$300 to $600" },
  { code: "over_600", label: "Over $600" },
  { code: "not_sure", label: "Not sure yet", hint: "We will show you what each level buys" },
];

/**
 * WHERE THE MUSIC PLAYS. A routing question, not a preference.
 *
 * The soundtrack is sequenced — arrival, dinner, the moment, late, ending — and
 * the answer here decides how that sequence reaches her room: a link to a
 * playlist on the société's own account, the same evening built on Apple, or a
 * setlist printed with the rest of the paper. All three are real deliveries.
 * See "The soundtrack — delivery" in docs/selection-spec.md and db/005.
 *
 * WHY PREMIUM IS NAMED. On Spotify's free tier, mobile playback forces shuffle
 * and injects Spotify's own tracks between ours, with advertising. A sequenced
 * arc does not survive that and there is no fix on our side, so the free tier is
 * a DIFFERENT ROUTE rather than a worse version of the same one — she is better
 * served by paper. The label says "Premium" because that is the only way she can
 * answer the question correctly without being told any of this.
 *
 * It is not a membership requirement. Gating membership on one component of one
 * deliverable is the wrong layer.
 *
 * Codes are the values of soundtrack_delivery in db/005, so the answer casts
 * straight into quiz_response.music_service.
 */
const MUSIC_SERVICES: readonly QuizOption[] = [
  {
    code: "spotify",
    label: "Spotify Premium",
    hint: "A link that opens in order, and stays in order",
  },
  {
    code: "apple_music",
    label: "Apple Music",
    hint: "The same evening, where you already listen",
  },
  {
    code: "print",
    label: "Neither",
    hint: "Then it arrives printed — the evening in order, on paper",
  },
];

export const QUIZ_STEPS: readonly QuizStep[] = [
  {
    key: "occasion",
    eyebrow: "The occasion",
    title: "What are you planning?",
    fields: [
      { id: "occasion", type: "single", options: OCCASIONS, revealsTextField: "other" },
      {
        id: "occasion_other",
        type: "text",
        label: "In your words",
        placeholder: "A divorce party, a housewarming, a Tuesday",
        maxLength: 120,
        optional: false,
        rows: 2,
      },
    ],
  },
  {
    key: "environment",
    eyebrow: "The setting",
    title: "Where does it happen?",
    help: "If it is not settled, say so — it changes what we send.",
    fields: [{ id: "environment", type: "single", options: ENVIRONMENTS }],
  },
  {
    key: "taste",
    eyebrow: "The direction",
    title: "Which of these pulls at you?",
    help: "Pick two or three. Contradicting yourself is allowed.",
    fields: [
      { id: "taste_directions", type: "multi", options: TASTE_DIRECTIONS, min: 2, max: 3 },
    ],
  },
  {
    key: "fun",
    eyebrow: "Your people",
    title: "How does this group actually have fun?",
    help: "Not how they should. How they do.",
    fields: [{ id: "group_fun", type: "multi", options: GROUP_FUN, min: 1, max: 4 }],
  },
  // Immediately after how they have fun, because it is the same subject seen
  // from the other side and she is already thinking about the same six people.
  // Before "what would ruin it", because that question is about the evening and
  // this one is still about them.
  //
  // THE CEILING IS SEVEN, and it is a judgement rather than a round number. A
  // tone resolves to two or three voice facets, so seven tones make roughly
  // eighteen claims across a vocabulary of twenty-six — enough to describe a
  // voice that is dry AND warm AND loud, which real groups are, while leaving
  // most of the space unclaimed. At a dozen almost every facet has been touched
  // by something and the profile stops telling the difference between two
  // destinations, which is the only job it has. The floor is one because one
  // is a real answer: a group that is only deadpan is a group.
  {
    key: "voice",
    eyebrow: "The voice",
    title: "How do these people talk to each other?",
    help: "Whatever sounds like them. They can be several of these at once.",
    fields: [
      {
        id: "voice_tones",
        type: "multi",
        options: VOICE_TONES,
        groups: TONE_GROUPS,
        layout: "tiles",
        quiet: true,
        min: 1,
        max: 7,
      },
    ],
  },
  {
    key: "contrast",
    eyebrow: "The line",
    title: "What would ruin it?",
    help: "Tap what you never want to see, then what you want more of.",
    fields: [
      {
        id: "anti_preferences",
        type: "multi",
        label: "Not this",
        options: ANTI_PREFERENCES,
        min: 1,
        max: 5,
      },
      {
        id: "affinities",
        type: "multi",
        label: "More this",
        options: AFFINITIES,
        min: 1,
        max: 3,
      },
    ],
  },
  {
    key: "secret",
    eyebrow: "The part only you know",
    title: "Tell us one thing we could not possibly know.",
    help: "A history, a rivalry, a rule, a person. Optional — and the one that makes it yours.",
    fields: [
      {
        id: "secret",
        type: "text",
        placeholder:
          "My sister will bring a guitar. Nobody has told her not to bring the guitar.",
        maxLength: 1000,
        optional: true,
        rows: 5,
      },
    ],
  },
  // Guests immediately before spend, and in that order. She cannot answer "what
  // a head" until she has a number in her head, and the two together are what
  // give selection a ceiling. Both are single-select rather than one combined
  // step: two option grids on one screen is the contrast question's shape, and
  // that one earns it by being a single question in two halves. These are two
  // questions.
  {
    key: "guests",
    eyebrow: "The table",
    title: "How many of you are there?",
    help: "As it stands today. Guest lists move.",
    fields: [{ id: "guest_count_band", type: "single", options: GUEST_COUNTS }],
  },
  {
    key: "spend",
    eyebrow: "The scale",
    title: "Roughly what are you spending a head?",
    help: "Everything except travel and the house itself.",
    fields: [{ id: "spend_per_person", type: "single", options: SPEND_PER_PERSON }],
  },
  // Last before the address, with the other practical answers, because it is
  // one: it decides how a thing gets to her, not what the thing is. Deliberately
  // NOT beside "how does this group have fun" — that step is about her people,
  // and a question about subscriptions in the middle of it would read as a
  // clipboard.
  {
    key: "music",
    eyebrow: "The music",
    title: "Where does the music play?",
    help: "It runs in order, from the door to the last song. This is how it reaches the room.",
    fields: [{ id: "music_service", type: "single", options: MUSIC_SERVICES }],
  },
  {
    key: "email",
    eyebrow: "The delivery",
    title: "Where should we send it?",
    help: "The only thing we ask you for.",
    fields: [{ id: "email", type: "email", maxLength: 254 }],
  },
];

/** Field id -> field, across every step. Built once. */
export const FIELDS: Readonly<Record<string, QuizField>> = Object.fromEntries(
  QUIZ_STEPS.flatMap((step) => step.fields.map((f) => [f.id, f] as const))
);

export type QuizAnswers = Record<string, string | string[] | undefined>;

/**
 * Is this step complete enough to advance?
 *
 * Used by the client to enable the button AND by the server to reject a
 * submission — same rules, one implementation, so a hand-rolled POST cannot
 * write a half-answered response.
 */
export function stepErrors(step: QuizStep, answers: QuizAnswers): string[] {
  const errors: string[] = [];

  for (const field of step.fields) {
    if (!isFieldActive(field, answers)) continue;
    const value = answers[field.id];

    switch (field.type) {
      case "single": {
        const chosen = typeof value === "string" ? value : "";
        if (!chosen) errors.push("Choose one.");
        else if (!field.options.some((o) => o.code === chosen)) {
          errors.push(`Unknown choice: ${chosen}`);
        }
        break;
      }
      case "multi": {
        const chosen = Array.isArray(value) ? value : [];
        const unknown = chosen.filter(
          (c) => !field.options.some((o) => o.code === c)
        );
        if (unknown.length) errors.push(`Unknown choice: ${unknown.join(", ")}`);
        if (new Set(chosen).size !== chosen.length) errors.push("Duplicate choice.");
        if (chosen.length < field.min) {
          errors.push(
            field.min === 1
              ? "Pick at least one."
              : `Pick at least ${field.min}.`
          );
        }
        if (chosen.length > field.max) errors.push(`Pick at most ${field.max}.`);
        break;
      }
      case "text": {
        const text = typeof value === "string" ? value.trim() : "";
        if (!field.optional && !text) errors.push("This one is needed.");
        if (text.length > field.maxLength) errors.push("That is too long.");
        break;
      }
      case "email": {
        const email = typeof value === "string" ? value.trim() : "";
        if (!isEmail(email)) errors.push("That does not look like an email address.");
        if (email.length > field.maxLength) errors.push("That is too long.");
        break;
      }
    }
  }

  return errors;
}

/**
 * A field can be conditional on another answer — today only the "something
 * else" text box, which appears when its parent single-select is on the code
 * named by `revealsTextField`.
 */
export function isFieldActive(field: QuizField, answers: QuizAnswers): boolean {
  if (field.id !== "occasion_other") return true;
  return answers.occasion === "other";
}

/**
 * Deliberately loose. Real validation of an email address is delivery: the
 * confirmation either arrives or it does not. This only catches typing that
 * cannot possibly be an address, and matches the CHECK constraint in
 * db/001-schema.sql so the two never disagree about what to reject.
 */
export function isEmail(value: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value) && value.length <= 254;
}

export function allErrors(answers: QuizAnswers): string[] {
  return QUIZ_STEPS.flatMap((step) => stepErrors(step, answers));
}
