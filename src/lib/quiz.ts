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
import { TONE_GROUPS, TONES, type Tone } from "./voice.ts";

/**
 * Stamped onto every submission. Bump on any change that alters what an answer
 * MEANS — a reworded question, a removed option, a changed min/max. Adding a
 * new option is additive and does not require a bump.
 *
 * 2026-08-c adds the voice question. A response written against 2026-08-b has
 * no `voice_tones` and is not missing one.
 *
 * 2026-08-d adds three: what is being eaten, where games sit, and how much of
 * it she wants to make. It also adds four options to "how does this group
 * actually have fun", which is additive and would not on its own need a bump.
 *
 * 2026-08-e RETIRES one option — "Made by hand, mostly" — because the authored
 * catalogue collapsed the making axis to three positions and a fourth answer
 * would point at a rung nothing in the library sits on. A removed option is
 * exactly the change this stamp exists for: a response written against
 * 2026-08-d may carry `mostly_made` and is not wrong, it was asked a different
 * question. The code keeps resolving; see db/016 and db/017.
 *
 * 2026-08-f asks WHEN — a month, and which meal when there is a table. Adding
 * questions is additive and would not on its own need a bump; what forces it is
 * that a response written against 2026-08-e has no `event_month` and is NOT
 * missing one. It was never asked, and everything downstream treats an
 * unanswered calendar the way it treats "still deciding": season weights
 * nothing and excludes nothing. See db/026.
 *
 * 2026-08-g asks HOW IT ENDS, and takes the gate off the hour.
 *
 * The new question is additive and would not on its own force a bump. What
 * forces it is the OTHER half: `meal_time` was asked only of a host who had
 * said there was a table, and it is now asked of everybody and worded as a
 * START HOUR rather than as a course. Both halves of the stamp's own test are
 * met — a reworded question, and a changed condition on who is shown it — and
 * the consequence is that the same code means slightly different things on
 * either side of this line. A `late_supper` written against 2026-08-f is a host
 * who had a table and chose the late one; against 2026-08-g it may be a
 * cocktail party that starts at eleven. Both resolve, and `quiz_version` on the
 * row says which question she was actually shown. See db/037.
 *
 * 2026-08-h asks THREE QUESTIONS ABOUT THE PHYSICAL WORLD she is standing in:
 * whether the evening is inside, outside or both; what water the place has; and
 * whether anybody is getting into it.
 *
 * Adding questions is additive and would not on its own force a bump. What
 * forces it is the same thing that forced 2026-08-f: a response written against
 * 2026-08-g has no `indoor_outdoor` and is NOT missing one. It was never asked,
 * and everything downstream must read the absence as no-information rather than
 * as "indoors, no water, nobody swimming" — which is the reading that would
 * silently delete the outdoor half of the catalogue from every existing
 * application. The absence is expressed as the absence of an affordance row
 * (see `composeVenue` in src/lib/selection/venue.ts and db/049), so the older
 * response keeps exactly the behaviour it had.
 *
 * NONE OF THE THREE IS A TASTE. They prune the pool at stage 3 and they never
 * reach the destination ranking — the same wall `environment` stands behind,
 * enforced in the same three places. See db/049.
 *
 * 2026-09-a REWRITES "how does this group actually have fun" into one question
 * about APPETITE FOR PLAY, and it is the largest change this stamp has ever
 * carried: NINE OF FOURTEEN OPTIONS ARE RETIRED FROM THE OFFER and four are
 * added. The retired nine — `long_dinner`, `dance`, `toast`, `dress_up`,
 * `talk_deep`, `wander`, `swim_late`, `cook_together`, `work_the_room` — keep
 * their facet rows and their quiz_option_facet bridges, so a response written
 * against 2026-08-h still resolves every code it carries. What it does NOT do
 * is mean the same thing: the older response answered a question about the
 * whole evening and this one answers a question about play, and `quiz_version`
 * on the row is what says which she was shown. Codes are permanent; the OFFER
 * is not. See db/066 and the note above GROUP_FUN.
 */
export const QUIZ_VERSION = "2026-09-a";

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
  /**
   * ON A MULTI FIELD: choosing this means choosing nothing else. "They hate
   * games" cannot sit beside "they play for something worth winning".
   *
   * Rule 16 in one flag. Without it the contradicting taps are ACCEPTED,
   * stored, scored against a pool that a later gate then deletes — input
   * absorbed and not honoured, with nothing anywhere saying so. Three readers
   * enforce it off this one declaration, the way `activeWhen` is enforced:
   * `stepErrors` refuses the combination, QuizFlow's toggle replaces rather
   * than adds, and the route validates the submission with the same function.
   *
   * Ignored on a single field, where it is meaningless. More than one exclusive
   * option in a field is legal and each excludes the rest.
   */
  exclusive?: boolean;
};

/** A heading over a run of options. See MultiField.groups. */
export type OptionGroup = { key: string; label: string };

type BaseField = {
  id: string;
  /** Rendered above the options when a step has more than one field. */
  label?: string;
  /**
   * SHOWN ONLY WHEN ANOTHER ANSWER SAYS SO — conditionality as DATA.
   *
   * `{ field: "occasion", is: ["other"] }` means this field appears when she has
   * chosen "something else" and not otherwise. It is validated, rendered and
   * cleared off this one declaration, so a question that depends on another is
   * a property of the question rather than a branch three files know about.
   *
   * Absent means always shown, which is what almost every field is.
   */
  activeWhen?: { field: string; is: readonly string[] };
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
  /**
   * Asked BEFORE the rest of them, on its own screen, and answered by signing
   * up rather than by tapping through the flow.
   *
   * Exactly one step carries this. It is not a rendering hint: the step it
   * marks is still a real step with real fields, still in QUIZ_STEPS, and
   * still validated by `allErrors` — which is the whole reason the flag exists
   * rather than the step being lifted out of the array. A submission is
   * complete or it is not, and the server must be able to say so by reading
   * one list. What the flag decides is only WHERE it is asked.
   */
  signUp?: boolean;
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

/**
 * INSIDE OR OUT — the supply side of a gate that has existed since db/020 and
 * has never once been asked about.
 *
 * THE PRIMARY ONE OF THE THREE, and the founder said so when she was asked how
 * the water questions should sit together:
 *
 *     "regarding water — we need to know if an event is outdoors. It also helps
 *      to know if by lake, pool, pond, on beach."
 *
 * NEED against HELPS, and the structure follows the distinction exactly. This
 * question is UNCONDITIONAL and it is asked on the setting screen, beside the
 * room, before any water question exists. It is not reachable through the water
 * question and it is not gated on anything, because A HOST WITH NO WATER AT ALL
 * STILL HAS TO STATE THAT HER PARTY IS OUTSIDE — that is the fact
 * `requires_outdoors` has been waiting for since db/020, and hanging it off the
 * water question would leave every waterless host unable to say it. That is the
 * `meal_time` failure precisely: a gate at the question, deleting the answer for
 * a whole class of host, which this quiz made once and removed (see START_HOURS
 * below).
 *
 * The water detail is the secondary half, and "it also helps" is what licenses
 * it to be a screen of its own after this one rather than a fact competing with
 * this one for the same screen.
 *
 * `requires_outdoors` and `outdoor_access` are both `structural_requirement`
 * codes, both consulted by `venueEligibility()` on every selection, and until
 * this question the ONLY thing feeding either of them was `environment` — a
 * room TYPE. db/035 said so itself, in the paragraph it closed with:
 *
 *     "The quiz asks WHERE, not WHAT IT HAS: 'A house', 'An apartment', 'A
 *      hotel'. There is no option meaning 'any outdoor access at all, even
 *      small', so a city apartment with a balcony and one without are the same
 *      answer, and this grade can only ever prune at the granularity of a room
 *      TYPE. That is a limit of what the member can report, not of this table —
 *      THE FIX IS A QUIZ OPTION."
 *
 * This is that option. It is the fix db/035 named and left for somebody.
 *
 * ── WHY IT IS NOT THE ROOM QUESTION AGAIN ───────────────────────────
 *
 * `environment` names a PLACE and this names how much of the evening is under
 * sky, and the two come apart in both directions. A house holds a party that
 * never leaves the dining room. An apartment holds one that lives on the roof.
 * Neither fact is recoverable from the other answer, which is the test
 * `meal_time` failed for two migrations (see START_HOURS below) and the test
 * this question is written to pass.
 *
 * HER ANSWER BEATS THE ROOM TYPE, and that is the whole mechanical point. See
 * `composeVenue()` in src/lib/selection/venue.ts: where she has stated this,
 * her statement supersedes db/020's type-level default for these two grades,
 * because a host reporting her own party is better evidence than a row that
 * knows only the word "apartment".
 *
 * ── THREE VALUES, AND THE FOURTH ONE ARGUED AND REFUSED ─────────────
 *
 * The tempting fourth is a split of `both` — "mostly inside, drinks on the
 * stoop" against "mostly outside" — on the worry that a mostly-inside evening
 * should not be sent a pétanque set.
 *
 * IT IS REFUSED, and the reason is that the requirement vocabulary ALREADY
 * makes that distinction and asking her to make it again would be two
 * vocabularies saying one thing in different words — the exact defect db/033 §2
 * was written to repair. `requires_outdoors` means the thing cannot happen
 * inside; `outdoor_access` is the lesser grade, a terrace, a stoop, a door to
 * somewhere. A "both" evening has a door to somewhere by construction, and it
 * can also host boules: she said part of it is outside. CLAUDE.md rule 2's door
 * test settles it — CAN this physically happen here, not WOULD it suit a place
 * like hers. Refusing an outdoor deliverable to a host who has told us her
 * party is partly outdoors is preference-by-square-footage wearing a
 * feasibility badge.
 *
 * FLAGGED FOR THE FOUNDER rather than settled by me: if she wants "both" split,
 * it is one option and two `host_affordance` rows. The argument above is why it
 * was not split on my authority.
 *
 * `not_decided` is a real answer and it means NO INFORMATION, never "indoor".
 * It writes no affordance row at all, so the room type's own default stands and
 * nothing new is pruned — the same shape db/020 gave `not_decided` on the room
 * question, for the same reason.
 */
const INDOOR_OUTDOOR: readonly QuizOption[] = [
  { code: "indoor", label: "Inside", hint: "Nothing happens out of doors" },
  { code: "outdoor", label: "Outside", hint: "All of it, under sky" },
  { code: "both", label: "Both", hint: "It moves between the two" },
  { code: "not_decided", label: "Still deciding" },
];

/**
 * IS THERE WATER — and the half of the question that presence does not answer.
 *
 * The founder: "we need to add a question to the quiz: is there a pool, lake,
 * river lake?" and then, immediately, the harder half — "is it a swimmable lake
 * or pond?"
 *
 * PRESENCE IS NOT USABILITY, and that is why the options are not her four nouns
 * on their own. An ornamental pond, a fountain, a river that is cold and fast
 * are all water, and nobody is getting into any of them. A float sent to a
 * house with a duck pond is the same failure as a float sent to an apartment,
 * and a vocabulary that only asked "is there water" would not be able to tell
 * the two apart. So usability is carried IN THE VALUE rather than in a second
 * conditional question — she picks the water she has, described the way she
 * would describe it, and the answer is already precise enough to gate on.
 *
 * ── WHY THIS IS NOT A FACET, AT ANY WEIGHT ──────────────────────────
 *
 * CLAUDE.md rule 2, said the way rule 2 says it: this may ELIMINATE what cannot
 * physically happen and it may NEVER RANK what can. A host with a pool is not
 * nudged toward Palm Springs; a host with none is simply never offered a float.
 * `water_access` joins `environment` in vector.ts's non-taste list, and db/049
 * extends db/020's trigger so a destination or a cohort tagged with a water
 * facet is REFUSED by the database rather than merely discouraged by a comment.
 * The wall is three-deep for the room question and it is three-deep for this
 * one, deliberately, because a new axis is exactly where the thesis gets
 * eroded by somebody who means well.
 *
 * ── HER LIST, RECONCILED ────────────────────────────────────────────
 *
 * She named the water twice and the two lists differ:
 *
 *     "is there a pool, lake, river lake?"
 *     "it also helps to know if by lake, pool, pond, on beach"
 *
 * The second adds `pond` and drops `river` and `ocean` from her phrasing. The
 * options below are the UNION, and the union rather than the later list is a
 * decision with a reason: dropping `river` and `sea` would leave a host on a
 * river with nothing true to tap, and her only remaining answer would be "No
 * water" — A FALSE FACT WRITTEN INTO A GATE, which is the one thing this axis
 * must never collect. CLAUDE.md rule 3, from the quiz's side: absence of an
 * option is not evidence of absence of water. They are kept, and what they
 * afford is where her ruling does the work.
 *
 * `beach` is folded into `sea` rather than given a code of its own, because
 * `beach` is already an `environment` value meaning WHERE THE PARTY IS HELD,
 * and one word answering two questions in one quiz is the misreading rule 23 is
 * about. The label carries her word; the code says which fact it is.
 *
 * ── THE FOUR BODIES ARE NOT INTERCHANGEABLE — THE FOUNDER'S RULING ──
 *
 *     "a pool float should only land if the quiz answer is 'has pool' or
 *      'lake'"
 *
 * POOL AND LAKE YES, RIVER AND OCEAN NO, and the reason is physical rather than
 * editorial: A FLOAT NEEDS STILL WATER. A river moves and takes it downstream;
 * the sea has surf and takes it out. So the requirement db/049 mints is
 * `requires_still_water`, named for what the object needs rather than for the
 * room it suits — `requires_pool` would refuse a perfectly good lake, which is
 * rule 2's forbidden door reached through a name.
 *
 * A POND AFFORDS IT TOO, and she did not say so. She named a pond in the second
 * list and not in the float ruling, and the extension is made on the ruling's
 * OWN REASON rather than by analogy: a pond is still water, a float sits on it,
 * and the rule was never about the noun. `not_for_swimming` is there for the
 * ornamental pond, so nothing is being assumed about a duck pond either.
 *
 * THIS IS WHY THE FOUR NOUNS SURVIVE AS FOUR VALUES rather than collapsing into
 * one "is there water" boolean. A boolean cannot express her rule, and an item
 * declaring "needs water" would land in a river. Each of the four is its own
 * row in `host_affordance` with its own verdict and its own sentence, so the
 * next requirement — swimming from a dock is a real thing a lake and a river
 * disagree about differently than a float does — is an insert rather than a
 * question re-asked of hosts who have already answered it.
 *
 * ── SINGLE-SELECT, WHICH WAS NOT THE FIRST ANSWER ───────────────────
 *
 * Multi looks obviously right: a house can have a pool and back onto a river,
 * and forcing a choice between two true things is the kind of small lie that
 * costs trust. It was built that way first and then cut.
 *
 * THE PRICE IS THE ARGUMENT. Multi needs `none` and `not_decided` to become
 * mutually exclusive with the rest — a host cannot have no water AND a pool —
 * which is validation machinery in this file, a deselect rule in the renderer,
 * and a constraint in the bench's random host. Three surfaces of new machinery,
 * bought for a case the gate resolves the same way either way: under her
 * still-water rule a pool-and-river host is a pool host, because the pool is
 * what the float lands in and the river changes no verdict beside it.
 *
 * WHAT WOULD REVERSE IT, written down so the reversal is an edit rather than a
 * rediscovery: the day a requirement is afforded by a body she DID NOT name as
 * her single answer — an item for moving water, wanted by the host who has both
 * — this becomes multi and the two absent-cases become exclusive. Until then
 * she names the water her party will actually use, which is the fact the gate
 * reads.
 *
 * `not_decided` is NO INFORMATION and must never resolve to `none`. A host who
 * has not answered is not a host without water: she writes no affordance row,
 * so nothing is pruned and she may still receive the float. `none` writes a row
 * saying false, and that is the difference between the two.
 */
const WATER_ACCESS: readonly QuizOption[] = [
  { code: "pool", label: "A pool" },
  { code: "lake", label: "A lake" },
  { code: "pond", label: "A pond you can swim in" },
  { code: "river", label: "A river" },
  { code: "sea", label: "The sea, or a beach" },
  {
    code: "not_for_swimming",
    label: "Water, but nobody is getting in",
    hint: "An ornamental pond, a fountain, a river that is cold and fast",
  },
  { code: "none", label: "No water" },
  { code: "not_decided", label: "Still deciding" },
];

/**
 * AND WHETHER ANYBODY IS ACTUALLY GETTING IN.
 *
 * The founder's third question, and it is a separate fact rather than a finer
 * grade of the second: "a host with a good pool having a long dinner does not
 * want floats." The pool is real, it is swimmable, and the evening is a table.
 * Presence and use are independently necessary, so they are asked independently
 * and combined with AND at the point of use — an item that requires water needs
 * BOTH a usable body of water AND a party that goes into it.
 *
 * ── IT DESCRIBES THE EVENING, WHICH IS WHY IT IS ALLOWED TO EXIST ───
 *
 * CLAUDE.md rule 1's test: a facet describes the EVENING, a property of her
 * PEOPLE belongs to the tiles. "Will anyone swim" travels with the party, not
 * with the guest list — the same six people have a swimming afternoon in July
 * and a dinner in October. So it is a legitimate question about the evening.
 *
 * IT STILL DOES NOT RANK. Being allowed to be a facet is not being required to
 * be one, and there is no `water` column in the matrix for it to sort on. A
 * "yes, swimming" answer that lifted the pool rooms would be rule 2's forbidden
 * door reached from a direction rule 2 did not anticipate — it would nudge her
 * toward the rooms that suit her property. It prunes and nothing else.
 *
 * ── AND IT IS NOT `swim_late`, WHICH IS THE NEAR MISS ───────────────
 *
 * GROUP_FUN already offers "Swim long after dark", and the rule-21 question is
 * whether two surfaces must agree about one fact. THEY MUST NOT: `swim_late` is
 * one tile of fourteen under a cap of four, so a host who plans a whole
 * afternoon in the pool and spends her four taps elsewhere has not said no to
 * swimming — she has said four other things are more them. An answer under a
 * cap cannot be read as a complete claim, and reading it as one would gate the
 * floats on a tile she was rationing. Two questions, two facts, no duplication.
 *
 * ── NO `activeWhen`, AND IT WAS OFFERED ─────────────────────────────
 *
 * The founder's "it also helps to know" licenses a conditional on the water
 * DETAIL, and the mechanism would work here with no new machinery at all —
 * `water_access` is single-select, which is the only shape `isFieldActive`
 * reads, so gating this field on it is one line. It is still not gated, and the
 * reason is which half of her sentence this field belongs to.
 *
 * THIS IS NOT THE DETAIL. It is her own third question — "will there be water
 * activities" — and it prunes INDEPENDENTLY of presence: a host with a perfectly
 * good pool who is having a long dinner does not want floats, and that is a
 * refusal no answer about what water exists can produce. A fact that prunes on
 * its own is not a follow-up to another fact.
 *
 * And the cost of gating is the `meal_time` cost, which this quiz has already
 * paid once: a host who answers "No water" would never state whether the
 * evening involves swimming ANYWHERE, and the class of host who is later found
 * to have needed it is always larger than it looked when the gate was written.
 *
 * The test the wording had to pass instead is the one the hour question passed
 * — every option must be TRUE for every host who can be shown it — and "Nobody
 * is getting in" is true, unstrained, of a host with no water at all. The tap
 * costs her a second and buys a fact nothing else supplies.
 *
 * FLAGGED, because she licensed the other choice: if the extra tap is not worth
 * it, `activeWhen: { field: "water_access", is: [...] }` on the field below is
 * the whole change, and `fieldsInvalidatedBy` already clears a stale answer.
 */
const WATER_USE: readonly QuizOption[] = [
  { code: "in_the_water", label: "People will be in the water" },
  { code: "beside_it", label: "Nobody is getting in" },
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

/*
 * APPETITE FOR PLAY — ONE QUESTION DOING ONE JOB.
 *
 * Founder, 2026-09-06, on a field of fourteen: "keep appetite for play
 * questions and add my questions (or similar) regarding games, karaoke, etc.
 * forget the people traits for this. if hates games, get rid of game option -
 * very simple." And what she wants out of it: "we want to know if they like
 * games, like karaoke, impromptu theater/gorilla theater, group games, board
 * games... hate games."
 *
 * ── WHAT THE FOURTEEN WERE ACTUALLY DOING ───────────────────────────
 *
 * Three jobs, which is why the answer was hard to use. FOUR WERE MATRIX FACETS
 * IN DISGUISE — "Commit to an outfit" is `dress`, "Split into corners and talk
 * properly" is `volume`, "Sit at the table for five hours" is nearer
 * `schedule`, "Crowd into the kitchen" is `food` — and a facet that describes
 * the EVENING belongs in the column that already sorts rooms by it, not as a
 * tile about her friends. THREE WERE PEOPLE TRAITS: dancing without being
 * asked, making speeches, talking a stranger into something. Rule 1 is the
 * reason those cannot sort a destination, and the founder's "forget the people
 * traits for this" is the reason they are not in a question about play either.
 * FIVE WERE APPETITE FOR PLAY, and they are the five kept below.
 *
 * ── WHAT THE ANSWER FEEDS, STATED SO IT CANNOT DRIFT (rule 15) ──────
 *
 * `group_fun` is one of the SIX dimensions the catalogue is actually tagged in
 * (the sweep is written out in src/lib/selection/vector.ts), and the tagged
 * side is src/lib/games.ts — seventy-odd `game_facet` rows. So this question
 * scores THE GAME CAROUSEL: db/061 gives every occasion one game beat with
 * three candidates, and until now those three were chosen by room and occasion
 * alone. Nothing else reads it; in particular no destination carries a
 * `group_fun` tag and this question has never sorted a room. It is not
 * supposed to.
 *
 * EVERY OPTION BELOW HAS A CONSUMER, and that was the admission test. Where the
 * catalogue could not answer a kind of play she named, the answer is not a tile
 * that grades nothing (rule 16) — it is either an existing code that genuinely
 * means it, or an authoring gap written down in docs/games-need-a-human.md.
 *
 * KARAOKE IS `perform`, NOT A NEW CODE. She named karaoke; "Sing badly, on
 * purpose" is what the house has always called it, twelve games carry the tag,
 * and a second code meaning the same thing would be two owners of one fact
 * (rule 21) with the new one grading nothing. So the tile names karaoke in its
 * hint and resolves to the code that already reaches the singing games. What
 * the catalogue does NOT have is a karaoke game as such; that is an authoring
 * absence (rule 29) and it is filed, not papered over.
 *
 * ── THE THREE ADDED, AND WHAT EACH REACHES ──────────────────────────
 *
 *   theatre      impromptu / guerrilla theatre. Reaches the games that are
 *                somebody inventing and playing a thing straight-faced —
 *                Somebody's Voice, One Of Them Is Lying, Nobody Finishes Their
 *                Own, Art Battle's minute of invented art criticism.
 *   board_games  a table, rules and pieces. Reaches Imposter, The Numbers
 *                After Dark, Fishbowl, The Late Supper.
 *   group_games  the whole room up at once. Reaches the Reverse Scavenger
 *                Hunt, Art Battle, Let's Make a Deal, the two finales.
 *
 * The last two are the split her own list draws — "group games, board games" —
 * and it is a real one in this pool rather than a restatement of `shape`. Shape
 * says whether a game takes a block of the evening; these say whether her
 * people would rather sit round a table with it or be on their feet.
 *
 * ── AND `hates_games`, WHICH IS A FILTER AND NOT A TASTE ────────────
 *
 * It carries `no_games` (db/014's slot exclusion) through
 * quiz_option_exclusion, exactly the way `play_appetite = 'none'` has since
 * db/016, and the game beat is removed from her plan before anything is scored.
 * The constraint door, not the taste door: it does not rank a game down, it
 * says the beat is not in her evening.
 *
 * IT IS THE SECOND ANSWER THAT CARRIES THAT CODE, AND THAT IS THE DESIGNED
 * SHAPE, NOT A DUPLICATE AUTHORITY. `no_food` has been carried by two options
 * since db/016 — `eating_out` and `drinks_only` — and exclusions.ts says in so
 * many words that "a second answer that means 'no menu' is an INSERT". The one
 * owner of the fact is the bridge; the answers are evidence for it, and
 * hostExclusions unions them. What is left visible rather than hidden: a host
 * who taps this is still shown "Where do games sit in this?" and will say
 * "None at all", which is the same fact twice. Gating that step on this one
 * needs `activeWhen` to learn multi-select and a negative form, and that is a
 * change with its own argument to make.
 *
 * `exclusive` on the tile is what keeps rule 16 honest inside this one field:
 * without it she could say her people hate games AND that they play for stakes,
 * and the second tap would be absorbed and then deleted along with the beat.
 */
const GROUP_FUN: readonly QuizOption[] = [
  { code: "compete", label: "Get genuinely competitive" },
  {
    code: "perform",
    label: "Sing badly, on purpose",
    hint: "Karaoke, and nobody is embarrassed",
  },
  {
    code: "theatre",
    label: "Put on something they made up",
    hint: "Invented on the spot and played straight",
  },
  {
    code: "board_games",
    label: "Sit round a table and play",
    hint: "Rules, pieces, somebody keeping score",
  },
  {
    code: "group_games",
    label: "Get the whole room playing",
    hint: "Nobody sits this one out",
  },
  { code: "make_something", label: "Make something with their hands" },
  { code: "keep_a_secret", label: "Keep something to themselves all night" },
  { code: "play_for_stakes", label: "Play for something worth winning" },
  {
    code: "hates_games",
    label: "They hate games",
    hint: "No game in the plan",
    exclusive: true,
  },
];

/**
 * WHAT IS BEING EATEN — and, in two of its four answers, whether there is a
 * menu at all.
 *
 * "Maybe someone won't even be serving food, in that case no menu." Nothing in
 * the application could state that until now, and db/014 refused every near
 * miss rather than infer it: a restaurant is a ROOM, and a room says where and
 * not whether. This asks.
 *
 * The other two answers earn their place separately: the menu pool already
 * distinguishes a dinner from a standing party in the author's own words —
 * menu 2 in docs/menus.md is "a cocktail party, standing, not dinner" — so the
 * same tap that states the fact also weights the pool.
 */
const FOOD_PLANS: readonly QuizOption[] = [
  {
    code: "sit_down",
    label: "Dinner at a table",
    hint: "Courses, and nobody gets up",
  },
  {
    code: "standing",
    label: "Things to pick at, standing up",
    hint: "A cocktail party, not a dinner",
  },
  {
    code: "eating_out",
    label: "A table booked somewhere else",
    hint: "Somebody else is choosing the food",
  },
  {
    code: "drinks_only",
    label: "Drinks, and nothing that needs a plate",
  },
];

/**
 * WHEN IT IS — a month, and deliberately not a date.
 *
 * The engine has carried `season_band` on every menu since db/012, on every
 * drink since db/017 and on every dish since db/021, and `season_strict` beside
 * it, and none of it did anything: nothing in the application said when the
 * evening was, so a dish written for August was as eligible in February as in
 * August. This is that question.
 *
 * ── WHY NOT A CALENDAR ──────────────────────────────────────────────
 *
 * The full argument is at the top of db/026; the two that decide it:
 *
 *   1. THE EXACT DATE ALREADY EXISTS AND IS SOMEBODY ELSE'S. `event_date` on
 *      quiz_response is MUTABLE and is filled in by staff from the reply mail.
 *      It is `guest_count_confirmed` again, and this is `guest_count_band`
 *      again: her answer is a band, frozen; the exact fact is learned later and
 *      may move. A second frozen copy of a fact we already know how to learn is
 *      two representations of one thing, which is what db/002 warns about.
 *   2. quiz_response IS APPEND-ONLY. A host who means "sometime in June" and is
 *      made to pick the 13th has been made to lie, permanently — db/006's
 *      argument about the guest count, unchanged.
 *
 * And the plain one: nothing downstream reads a day. The engine reads a season.
 *
 * ── WHAT A MONTH RESOLVES TO ────────────────────────────────────────
 *
 * A season facet — db/026's bridge — because the catalogue is already tagged in
 * that dimension. So the calendar becomes a soft weight with no new scoring
 * code, and the only thing left in TypeScript is the hard gate on the dishes
 * and menus a curator marked strict.
 *
 * The mapping itself is a row and not a line of code. This file does not know
 * which season August is in, and neither does src/lib/selection/.
 *
 * ── AND STILL DECIDING IS AN ANSWER ─────────────────────────────────
 *
 * The same grace the room question extends, for the same reason: a host who has
 * not booked a house has not lied about the month, she has declined to invent
 * one. It resolves to an inert facet, so she is scored exactly as she was
 * before this question existed and nothing is excluded on a season. Absence is
 * a route, not a fault.
 */
const EVENT_MONTHS: readonly QuizOption[] = [
  { code: "january", label: "January" },
  { code: "february", label: "February" },
  { code: "march", label: "March" },
  { code: "april", label: "April" },
  { code: "may", label: "May" },
  { code: "june", label: "June" },
  { code: "july", label: "July" },
  { code: "august", label: "August" },
  { code: "september", label: "September" },
  { code: "october", label: "October" },
  { code: "november", label: "November" },
  { code: "december", label: "December" },
  { code: "not_decided", label: "Still deciding" },
];

/**
 * WHAT HOUR IT STARTS — asked of everyone, and it is the same four answers.
 *
 * db/023 gave a table five shapes and could reach two of them. Standing food
 * makes it a cocktail party, everything else fell through to a long dinner, and
 * `brunch`, `lunch` and `late_supper` were shapes nothing could produce — so a
 * dish tagged for brunch was not narrowed to brunch, it was removed from every
 * table the engine could set.
 *
 * ── WHY THE OCCASION CANNOT ANSWER IT ───────────────────────────────
 *
 * It was checked first, which is the right order: a second question that
 * duplicates an answer she already gave is worse than no question. Of the nine
 * occasions only "a dinner party" names its meal. A birthday can be a brunch, an
 * anniversary can be a late supper, and db/023 refused to fold the two axes
 * together for exactly that reason — an occasion is WHY, a meal shape is WHAT.
 *
 * ── SUPERSEDED, AND KEPT: "ASKED ONCE, OF THE HOSTS IT APPLIES TO" ──
 *
 * The argument this question shipped with, verbatim, because it was right about
 * the thing it was looking at:
 *
 *     "`activeWhen` holds it to a host who has said there is a table. Somebody
 *      throwing a cocktail party is never shown it, because her food answer
 *      already settled it — `standing` carries the `no_seated_meal` exclusion
 *      and that IS the cocktail party. One fact, stated once, by whichever
 *      question got there first."
 *
 * WHAT BEAT IT: the food answer settles WHETHER THERE IS A TABLE. It does not
 * settle WHAT TIME ANYONE ARRIVES, and the old argument silently treated those
 * as one fact because, at the time, the only reader was `mealShape()`. They are
 * two facts, and the second one had no other supplier: with the gate in place a
 * cocktail party, a booked restaurant and a drinks-only evening never stated an
 * hour ANYWHERE in the system. That is CLAUDE.md rule 15's DEFAULT-ONLY failure
 * in its purest form — the matrix ranked `starts` against all eighteen rows for
 * every applicant, and for a standing party the value it ranked was a fallback.
 *
 * Nothing the old argument protected is lost. `mealShape()` still refuses to
 * call a standing party a lunch: `no_seated_meal` wins there and is checked
 * FIRST, so her hour cannot invent a table she said she was not setting. The
 * gate was doing that job in the wrong place — at the question, where it also
 * deleted the hour — and the exclusion does it in the right one.
 *
 * ── SO IT IS WORDED OFF "MEAL" ──────────────────────────────────────
 *
 * "Brunch" is a course, and a woman throwing a cocktail party at noon cannot
 * answer a question about courses without being made to lie. So the labels name
 * HOURS — late morning, midday, evening, late — and the four still carry db/023's
 * `meal_shape` codes underneath, because a code is permanent and this one is
 * still the right code: an evening that starts at midday and has a table IS a
 * lunch. The hint is what does the double duty, and each of the four is written
 * to be true of a dinner and of a standing party alike.
 *
 * The field id stays `meal_time` for the same reason the codes do. It is the
 * name of a column (db/026) and of a bridge row, and renaming it would retire a
 * question that has not changed its subject — only its reach and its wording.
 *
 * The codes are the values of `meal_shape` in db/023, so the answer casts
 * straight into quiz_response.meal_time — the same arrangement `music_service`
 * has with soundtrack_delivery, and for the same reason: a derivation nobody has
 * to read is a derivation nobody can get wrong. db/037 adds a SECOND resolution
 * of the same four codes, onto the matrix's `starts` levels, so the hour she
 * names reaches the structural ranker as well as the table.
 */
const START_HOURS: readonly QuizOption[] = [
  {
    code: "brunch",
    label: "Late morning",
    hint: "It starts before noon and runs long",
  },
  {
    code: "lunch",
    label: "Midday",
    hint: "It starts at lunchtime and nobody is in a hurry after",
  },
  { code: "long_dinner", label: "Evening", hint: "Dark by the time it fills up" },
  {
    code: "late_supper",
    label: "Late",
    hint: "After the show, or after the dancing",
  },
];

/**
 * HOW IT ENDS — the other end of the clock, and everybody has an opinion.
 *
 * The matrix has carried an `ending` column since the contrast pass, with all
 * eighteen rows filled and a level split of seven / seven / four that no other
 * facet matches for balance. Nothing asked. It ranked every applicant on a cell
 * she had never been given a chance to fill in, which is exactly the failure
 * CLAUDE.md rule 15 was written for.
 *
 * ── THE OPTIONS ARE THE FOUNDER'S SENTENCES, NOT A PARAPHRASE ───────
 *
 * The facet was authored in docs/destination-contrasts.md as forced-choice
 * SCENES rather than adjectives, and the three below are those scenes in the
 * words they were written in. They are the copy. A tidier rewrite — "an early
 * night", "a long one" — would lose the thing that makes the question
 * answerable: each one contains its own judgement, so she is agreeing with a
 * host rather than grading an evening.
 *
 * ── NO `activeWhen`, AND THAT IS THE POINT ──────────────────────────
 *
 * Every host has an opinion about how a party should end, and none of the other
 * answers implies one. A dinner at a table can stop cleanly at eleven or run to
 * five; a cocktail party can do either. There is no answer she has already given
 * that settles this, which is the test `meal_time` failed for two migrations and
 * this question is written not to repeat.
 *
 * ── AND IT IS NOT "WOULD YOU LIKE A LATE NIGHT" ─────────────────────
 *
 * It passes the two acceptance tests in docs/destination-contrasts.md. It is
 * answerable without knowing the destinations exist; and it describes the
 * EVENING rather than the guests, because the same group throws a Sunday lunch
 * that stops cleanly and a birthday that goes until morning. That is the test
 * `teasing` failed and it is why this facet may sort rooms and that one may not.
 *
 * The codes are the matrix's own levels, so the answer resolves to the facet
 * without a translation step. See db/037 and src/lib/selection/structure.ts.
 */
const ENDINGS: readonly QuizOption[] = [
  {
    code: "clean_stop",
    label: "It stops cleanly",
    hint: "Everyone leaves at once, and it is perfect",
  },
  {
    code: "dissolves",
    label: "It dissolves",
    hint: "It thins out slowly and the last hour is the best",
  },
  {
    code: "until_morning",
    label: "It goes until morning",
    hint: "If it ends before very late, something went wrong",
  },
];

/**
 * WHERE GAMES SIT — appetite, and it can be an outright no.
 *
 * Distinct from "what would ruin it", where `forced_fun` lives, and the
 * distinction is db/014's: a woman can veto forced participation and still want
 * a game. One is a dislike, scored; this is a fact about the evening, and
 * "none at all" removes the game slots before anything is chosen.
 *
 * Distinct again from "how does this group actually have fun", which says what
 * KIND. A wildly competitive group can still want nothing organised.
 *
 * WHETHER THEY WILL PERFORM IS NOT ASKED HERE, because it is already asked
 * twice: `perform` on the question above, which is what actually weights the
 * game pool, and the whole `performance` group of tones on the voice question,
 * which includes "Will not get up in front of a room".
 */
const PLAY_APPETITES: readonly QuizOption[] = [
  { code: "none", label: "None at all", hint: "The evening runs itself" },
  {
    code: "one_thing",
    label: "One, at the right moment",
    hint: "It starts, it ends, everyone goes back to the table",
  },
  {
    code: "underneath",
    label: "Something running underneath",
    hint: "Nobody has to stop what they are doing",
  },
  {
    code: "the_point",
    label: "The games are the night",
    hint: "This is what they came for",
  },
];

/**
 * HOW MUCH OF IT SHE WANTS TO MAKE.
 *
 * The founder's four values, authored for menus in docs/menus.md — actually
 * made, mostly made, half made, bought and arranged — asked once and applied to
 * everything: the menu, the printed matter, the edit, the table.
 *
 * IT IS NOT A BUDGET QUESTION. `spend_per_person` asks about money and this
 * does not, and the two are independent in both directions: expensive materials
 * worked by hand sit at one end of this axis and cheap things that arrive
 * finished sit at the other. On this axis, finished means somebody else did the
 * work and it shows in the finish.
 *
 * db/016 carries it as ONE signed facet rather than four, so that the middle of
 * the ladder is ordered — bought and arranged is nearer half made than it is to
 * actually made, and four separate terms could not say so.
 */
/*
 * THREE POSITIONS, AND THE CATALOGUE HAS THE SAME THREE.
 *
 * docs/menus.md and docs/drinks.md both carry exactly three: actually made ·
 * half made · bought and arranged, said at the bar as actually mixed · half
 * made · bought and poured. This question is the host's end of that one axis,
 * so it offers the same three and no more.
 *
 * `mostly_made` was asked up to QUIZ_VERSION 2026-08-d and is RETIRED rather
 * than deleted, which is the rule db/016 wrote down for exactly this: the value
 * stays in `making_level` forever, its quiz_option_facet row stays so a stored
 * answer keeps resolving, and it is simply never offered again.
 * scripts/check-facets.mjs reports it as retired and does not fail.
 */
const MAKING_LEVELS: readonly QuizOption[] = [
  {
    code: "actually_made",
    label: "Made by hand, all of it",
    hint: "The afternoon before is part of the evening",
  },
  {
    code: "half_made",
    label: "Half made, half arranged",
    hint: "One real dish and a good table",
  },
  {
    code: "bought_and_arranged",
    label: "Bought and arranged",
    hint: "Nothing is cooked. The plates are the work",
  },
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
/*
 * DRAFTS ARE NOT SHOWN, and this filter is CLAUDE.md rule 16 in one line.
 *
 * A draft tone is a word coined for a room that is not authored yet —
 * src/lib/voice.ts says so on the flag — and until that room lands the tone is
 * claimed by no destination, has no mark cut for it in design/tone-icons, and
 * has no `facet` row in any migration. Rendered on the page it was a blank tile
 * that a real host taps, that lands in quiz_response.voice_tones, and that
 * `quiz_response_facet`'s inner join then drops on the floor. She spent one of
 * seven taps on a code that resolves to nothing, and every surface in between
 * reported success.
 *
 * The tones themselves stay in src/lib/voice.ts, drafts and all, because that
 * file is the vocabulary and a word waiting for its room is not a mistake. What
 * changes is that the QUIZ SURFACE takes only what it can honour.
 */
// Read through the declared type, exactly as src/lib/voice.test.ts does and for
// the same reason: TONES is `as const`, so the compiler knows each entry as a
// literal and a literal without the optional `draft` key has no such property
// to test. The widening is what makes the flag readable at all.
const VOICE_TONES: readonly QuizOption[] = (TONES as readonly Tone[])
  .filter((tone) => !tone.draft)
  .map((tone) => ({
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
  // ── THE SIGN-UP, AND IT USED TO BE LAST ──────────────────────────────
  //
  // Founder, 2026-09-05: "when they apply for membership, need a fun page
  // where they sign up and confirm email not just to the quiz." This step is
  // that page. Its eyebrow and its title are unchanged and unmoved as words —
  // only their position in the flow moved, from the seventeenth screen to the
  // first, which is what makes signing up a moment rather than a footer.
  //
  // THE HELP LINE IS THE ONE THING THAT HAD TO CHANGE, and the original is
  // kept here because rule 14 says a superseded line is preserved rather than
  // deleted:
  //
  //     "The only thing we ask you for."
  //
  // It was true as the LAST screen — everything else had been asked by then,
  // and the address was the only thing left that was hers rather than her
  // party's. As the FIRST screen it is simply false: a whole flow follows it.
  // A line that became untrue by being moved has to move with the truth, so
  // what stands there now says what actually happens next.
  //
  // Nothing else about the step changed. It has the same key, the same single
  // email field, the same maxLength, and it is still in this array — so
  // `FIELDS` still knows about `email` and `allErrors` still refuses a
  // submission without one. See ASKED_STEPS below for the half the flow walks.
  {
    key: "email",
    eyebrow: "The delivery",
    title: "Where should we send it?",
    help: "A note goes there first, so we know it reaches you.",
    fields: [{ id: "email", type: "email", maxLength: 254 }],
    signUp: true,
  },
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
        activeWhen: { field: "occasion", is: ["other"] },
      },
    ],
  },
  // TWO FIELDS, AND THEY ARE ONE QUESTION IN TWO HALVES — the standard the
  // `when` screen set (the month and the hour are both "when") and the contrast
  // screen before it. The place and how much of it is under sky are both
  // "where", and splitting them would make the shorter of the two a whole
  // screen asking whether a party is indoors.
  //
  // The order within the screen is the order of the sentence: the room first,
  // then what is done with it. `indoor_outdoor` is second because it reads as a
  // qualification of the answer above it, which is what it is.
  {
    key: "environment",
    eyebrow: "The setting",
    title: "Where does it happen?",
    help: "If it is not settled, say so — it changes what we send.",
    fields: [
      { id: "environment", type: "single", label: "The place", options: ENVIRONMENTS },
      {
        id: "indoor_outdoor",
        type: "single",
        label: "Inside or out",
        options: INDOOR_OUTDOOR,
      },
    ],
  },
  // AFTER the setting screen, and that order is the founder's: "we need to know
  // if an event is outdoors. It also helps to know if by lake, pool, pond, on
  // beach." The necessary question is answered on the screen before this one,
  // unconditionally; this screen is the "also helps".
  //
  // Straight after the room and before the food, because it is the last fact
  // about the PLACE and the screen after it moves to what is on the table.
  //
  // NOT a third field on the screen above. The room and inside-or-out are one
  // question about where she will be standing; whether the property has water
  // is a different subject, and three option grids on one screen is more than
  // this quiz has ever asked of a host — the two-field screens are two halves,
  // never three thirds.
  //
  // ITS OWN TWO FIELDS ARE two halves, by that same test: what water there is
  // and whether anybody goes in are one question, and an item that requires
  // water needs both answers to say yes. Asking them on separate screens would
  // make the second read as a new subject when it is the completion of the
  // first.
  //
  // Before anything about taste, with the other facts. This describes the
  // evening; the direction, the voice and the line describe how it should feel.
  {
    key: "water",
    eyebrow: "The water",
    title: "Is there water?",
    help: "A pool, a lake, the sea. If nobody is getting in, say so — it changes what we send.",
    fields: [
      { id: "water_access", type: "single", label: "What there is", options: WATER_ACCESS },
      { id: "water_use", type: "single", label: "Whether anyone gets in", options: WATER_USE },
    ],
  },
  // Straight after the room, because it is the same subject: what the room is
  // for. And before anything about taste, because two of its answers remove a
  // deliverable, and a question that can delete the menu should be asked while
  // she is still describing the evening rather than decorating it.
  {
    key: "food",
    eyebrow: "The food",
    title: "What are they eating?",
    fields: [{ id: "food_plan", type: "single", options: FOOD_PLANS }],
  },
  // Straight after the food, with the other facts about the evening: what she
  // is planning, where it is, what is eaten, when.
  //
  // IT USED TO HAVE TO BE HERE and now merely belongs here. The original reason
  // was mechanical — the second field was conditional on the food answer, and a
  // field that depends on an answer she has not given yet cannot appear at all —
  // and that constraint is gone with the gate (see START_HOURS). The order does
  // not change, because the editorial reason it was also right survives: these
  // four screens are the facts, and taste starts on the screen after them.
  //
  // TWO FIELDS ON ONE SCREEN, which only the contrast question does, and it
  // earns it by being a single question in two halves. So is this one. The month
  // and the hour are both "when", and splitting them would make the shorter of
  // the two a whole screen asking what time a party starts.
  {
    key: "when",
    eyebrow: "The calendar",
    title: "When is it?",
    help: "The month is enough. The hour is when it starts, not when it ends.",
    fields: [
      { id: "event_month", type: "single", label: "The month", options: EVENT_MONTHS },
      { id: "meal_time", type: "single", label: "The hour", options: START_HOURS },
    ],
  },
  // Straight after "when is it", because it is the rest of that sentence. The
  // screen before it asks what hour the evening starts and says so in its own
  // help line — "not when it ends" — and this is the question that line is
  // making room for. Splitting the clock across two screens rather than adding
  // a third field to the one before it, because the two are not one question in
  // two halves the way the month and the hour are: an hour is a fact she reads
  // off a plan, and this is a judgement about what a good night does.
  //
  // Before anything about taste, and that is the same rule the three screens
  // above follow. This describes the evening; the direction, the voice and the
  // line describe how it should feel. The facts come first.
  //
  // NOT beside "where do games sit in this", which is the other question about
  // shape rather than look. That one is about what happens in the middle and is
  // read as a pair with "what would ruin it"; putting the ending next to it
  // would turn two separate subjects into a programming screen.
  {
    key: "ending",
    eyebrow: "The end of it",
    title: "How does it end?",
    help: "You already know this one.",
    fields: [{ id: "how_it_ends", type: "single", options: ENDINGS }],
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
    title: "What do they actually play?",
    help: "Not what they should. What they do.",
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
  // After "what would ruin it" and not before it. She has just said whether
  // forced participation is a dealbreaker; this asks the different question of
  // whether there is anything organised at all, and the two read as a pair
  // rather than as the same question twice.
  {
    key: "play",
    eyebrow: "The games",
    title: "Where do games sit in this?",
    fields: [{ id: "play_appetite", type: "single", options: PLAY_APPETITES }],
  },
  // Beside the games and nowhere near the spend question, deliberately. This is
  // about her hands, that one is about her money, and putting them on adjacent
  // screens is how "luxury" quietly comes to mean "expensive".
  {
    key: "making",
    eyebrow: "The making",
    title: "How much of this do you want to make?",
    help: "The food, the table, the paper — one answer covers all of it.",
    fields: [{ id: "how_made", type: "single", options: MAKING_LEVELS }],
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
];

/** Field id -> field, across every step. Built once. */
export const FIELDS: Readonly<Record<string, QuizField>> = Object.fromEntries(
  QUIZ_STEPS.flatMap((step) => step.fields.map((f) => [f.id, f] as const))
);

/**
 * The one step that is answered by signing up. Null would be a bug, and the
 * type says so rather than making every caller check.
 */
export const SIGN_UP_STEP: QuizStep = (() => {
  const marked = QUIZ_STEPS.filter((step) => step.signUp);
  if (marked.length !== 1) {
    // Not a soft failure. A second marked step would silently vanish from the
    // walked flow AND from the sign-up screen, which renders only the first —
    // a question absorbed and never asked, and nothing would go red.
    throw new Error(
      `exactly one QUIZ_STEP may carry signUp; found ${marked.length}`
    );
  }
  return marked[0];
})();

/**
 * WHAT THE FLOW WALKS. Everything except the step she has already answered.
 *
 * QUIZ_STEPS is the QUESTION SET — what a complete submission must contain,
 * and what `allErrors` checks. This is the SCREENS, in order. Keeping them as
 * two readings of one array rather than two arrays is deliberate: a second
 * list is a second authority, and the day somebody adds a question to one of
 * them it would be asked and never validated, or validated and never asked.
 *
 * The order is also why an application half-finished under the old flow
 * survives this change. The sign-up step moved to the FRONT of QUIZ_STEPS, so
 * removing it leaves the remaining screens in exactly the positions they had
 * when the email step was last — an old draft's `stepIndex` still points at
 * the same question. The single exception is a draft that stopped ON the email
 * screen, whose index is now out of range and is clamped to the last screen by
 * the flow. She loses no answer either way.
 */
export const ASKED_STEPS: readonly QuizStep[] = QUIZ_STEPS.filter(
  (step) => !step.signUp
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
        // An exclusive option is the whole answer or it is not in it. See
        // QuizOption.exclusive: the client already enforces this by
        // replacement, and this is the half that a hand-built POST meets.
        const exclusive = field.options
          .filter((o) => o.exclusive === true && chosen.includes(o.code))
          .map((o) => o.label);
        if (exclusive.length > 0 && chosen.length > 1) {
          errors.push(`"${exclusive[0]}" cannot be chosen with anything else.`);
        }
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
 * A field can be conditional on another answer.
 *
 * This used to name `occasion_other` and read `answers.occasion` directly. Two
 * conditional fields is one too many for that: the second question that depends
 * on another — which meal, asked only where there is a table — would have been a
 * second hard-coded branch here, a second one in the renderer that clears a
 * stale answer, and a third in the bench that does the same. So the condition
 * moved onto the field, as `activeWhen`, and every reader consults the data.
 *
 * THE SECOND CONDITIONAL FIELD IS GONE. db/037 took the gate off `meal_time`,
 * so `occasion_other` is once again the only field in the quiz that is not
 * always shown. The mechanism stays exactly as it is: it was built because one
 * hard-coded branch had already proved it would be copied, and a declaration
 * three readers consult is right at one conditional field as it was at two. It
 * is also what makes taking a gate off a one-line change rather than a hunt.
 *
 * A field with no `activeWhen` is always active, which is every field but one.
 */
export function isFieldActive(field: QuizField, answers: QuizAnswers): boolean {
  const gate = field.activeWhen;
  if (!gate) return true;
  const value = answers[gate.field];
  return typeof value === "string" && gate.is.includes(value);
}

/**
 * The fields that must be forgotten when `fieldId` changes to `code`.
 *
 * Answering a question can un-ask another one, and the answer to a question
 * that is no longer asked must not be submitted: it would be a claim she was
 * never given the chance to make. The client clears them as she taps, the
 * bench clears them when it rolls a host, and `stepErrors` ignores them either
 * way — three readers, one rule, stated here.
 */
export function fieldsInvalidatedBy(
  fieldId: string,
  code: string
): readonly string[] {
  return Object.values(FIELDS)
    .filter(
      (field) =>
        field.activeWhen?.field === fieldId && !field.activeWhen.is.includes(code)
    )
    .map((field) => field.id);
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
