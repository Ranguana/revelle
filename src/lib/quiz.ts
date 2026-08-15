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

/**
 * Stamped onto every submission. Bump on any change that alters what an answer
 * MEANS — a reworded question, a removed option, a changed min/max. Adding a
 * new option is additive and does not require a bump.
 */
export const QUIZ_VERSION = "2026-08-a";

export type QuizOption = {
  /** Permanent. Stored in the database. */
  code: string;
  label: string;
  /** One short line under the label. No italics, ever. */
  hint?: string;
  /** Not used yet. See the note above. */
  image?: { src: string; alt: string };
};

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
  { code: "birthday", label: "A birthday", hint: "Hers, or one she is throwing" },
  { code: "girls_weekend", label: "A girls' weekend", hint: "Two nights, one house" },
  { code: "dinner_party", label: "A dinner party", hint: "One table, one evening" },
  { code: "getaway", label: "A getaway", hint: "Somewhere that is not home" },
  { code: "anniversary", label: "An anniversary", hint: "A year worth marking" },
  { code: "holiday", label: "A holiday", hint: "The calendar made her do it" },
  { code: "bridal", label: "Something bridal", hint: "Shower, weekend, the night before" },
  { code: "no_reason", label: "No reason at all", hint: "The best kind" },
  { code: "other", label: "Something else", hint: "Tell us in a word or two" },
];

const ENVIRONMENTS: readonly QuizOption[] = [
  { code: "my_home", label: "My home" },
  { code: "rented_house", label: "A rented house" },
  { code: "city_apartment", label: "A city apartment" },
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

const BUDGETS: readonly QuizOption[] = [
  { code: "under_500", label: "Under $500" },
  { code: "from_500_to_1500", label: "$500 to $1,500" },
  { code: "from_1500_to_3000", label: "$1,500 to $3,000" },
  { code: "from_3000_to_6000", label: "$3,000 to $6,000" },
  { code: "over_6000", label: "Over $6,000" },
  { code: "not_sure", label: "Not sure yet", hint: "We will show you what each level buys" },
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
          "Her sister will bring a guitar. Nobody has told her not to bring the guitar.",
        maxLength: 1000,
        optional: true,
        rows: 5,
      },
    ],
  },
  {
    key: "budget",
    eyebrow: "The scale",
    title: "Roughly what are you spending?",
    help: "Everything except travel and the house itself.",
    fields: [{ id: "budget", type: "single", options: BUDGETS }],
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
