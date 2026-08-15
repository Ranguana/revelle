/**
 * How her people talk, as DATA.
 *
 * A destination is a LOOK and a VOICE (src/lib/tokens.ts). The application
 * gathered only look signals — occasion, setting, taste, how the group has fun
 * — so nothing could match the REGISTER of the writing to the people it is
 * written for. A warm, effusive group handed a deadpan invitation reads it as
 * cold, and no palette choice repairs that. See "The voice questions" in
 * docs/build-checklist.md.
 *
 * This module is the two halves of the fix:
 *
 *   TONES        the surface. Fifty things a host recognises about her friends
 *                — "talks almost entirely in in-jokes" — which is what she is
 *                actually shown.
 *   VOICE FACETS the underneath. The structured axes a tone RESOLVES to, drawn
 *                from the closed vocabularies in tokens.ts plus the manner axes
 *                those vocabularies do not carry.
 *
 * ── WHY TWO LAYERS AND NOT ONE ───────────────────────────────────────
 *
 * Neither layer works alone. Asked directly for a `formality` a host has no
 * answer, because nobody thinks about their friends in those words; shown fifty
 * tones with no structure underneath, matching would be string comparison
 * against a destination's prose. So she taps the surface, and the surface
 * resolves — by weighted rows with real foreign keys, see db/007 — into the
 * same vocabulary a destination is tagged in. Matching is then a set operation,
 * which is the entire argument of db/002.
 *
 * ── WHY THE WEIGHTS ARE SIGNED ───────────────────────────────────────
 *
 * The same convention as every other facet tag in this system (db/002,
 * `install_facet_tags`): +1 is "this IS the thing", a small positive is
 * "incidentally so", and a NEGATIVE actively repudiates it. That is what makes
 * "says less than it means" expressible — it is not merely quiet, it is a claim
 * AGAINST theatricality, and a destination that performs must lose points for
 * it rather than simply fail to gain them. Zero is not a weight; a tag that
 * says nothing is not a row.
 *
 * ── WHY THIS IS A MODULE AND ALSO ROWS ───────────────────────────────
 *
 * Same division as src/lib/quiz.ts and db/002: the database is the source of
 * truth for what a term IS and what it resolves to; this module is the source
 * of truth for how it is PRESENTED and the reviewable text of the mapping. A
 * weighting that decides how the product sounds deserves to be argued about in
 * a diff. scripts/check-facets.mjs fails if the two drift.
 *
 * Framework-free, like everything it imports. No React, no "server-only".
 */

import type { AddressMode, Formality, HumourMode, Voice } from "./tokens";

/* ── the voice facets ──────────────────────────────────────────────────
 *
 * The axes. Four groups, and the difference between them is worth stating
 * because it decides how a weight is read:
 *
 *   FORMALITY, ADDRESS, HUMOUR are CATEGORICAL — they mirror the closed unions
 *   in tokens.ts exactly, one facet per member. A voice has one formality, so a
 *   positive weight means "this is the one" and a negative means "not this one".
 *   The correspondence is enforced by the Record types below: add a member to
 *   `Formality` in tokens.ts and this file stops compiling until it has a facet.
 *
 *   CADENCE is categorical in the same way but has no union to mirror —
 *   `Voice.cadence` is free text, deliberately, because a rhythm is an
 *   instruction to a writer and not a checkbox. These four are the shapes that
 *   recur often enough to match on; the prose stays authoritative for writing.
 *
 *   MANNER is BIPOLAR. One facet per axis, signed: `theatricality` at +1 is a
 *   group that performs, at -1 a group that will not get up in front of a room. Two facets
 *   (`theatrical`, `understated`) would be the same axis said twice, and two
 *   representations of one fact drift.
 */

export type VoiceAxis = "formality" | "address" | "humour" | "cadence" | "manner";

export type VoiceFacet = {
  /** Permanent. Stored in the database and in a customer's resolved profile. */
  code: string;
  axis: VoiceAxis;
  /** What a curator reads in the tool. Never shown to a host. */
  label: string;
  /** The gloss. For manner axes it names BOTH ends, because the axis is signed. */
  description: string;
};

export const VOICE_FACETS = [
  // ── formality ── mirrors Formality in tokens.ts
  {
    code: "formality_ceremonial",
    axis: "formality",
    label: "Ceremonial",
    description: "Engraved. Third person, no contractions, nothing casual.",
  },
  {
    code: "formality_formal",
    axis: "formality",
    label: "Formal",
    description: "A good hotel's notice board.",
  },
  {
    code: "formality_cordial",
    axis: "formality",
    label: "Cordial",
    description: "A well-written note between people who know each other.",
  },
  {
    code: "formality_plain",
    axis: "formality",
    label: "Plain",
    description: "Says the thing.",
  },
  {
    code: "formality_familiar",
    axis: "formality",
    label: "Familiar",
    description: "The way these people actually talk.",
  },

  // ── address ── mirrors AddressMode in tokens.ts
  {
    code: "address_second_person",
    axis: "address",
    label: "Second person",
    description: "You are expected Friday.",
  },
  {
    code: "address_third_person",
    axis: "address",
    label: "Third person",
    description: "Guests are reminded that.",
  },
  {
    code: "address_collective_first",
    axis: "address",
    label: "Collective first person",
    description: "We do not discuss the second night.",
  },
  {
    code: "address_impersonal",
    axis: "address",
    label: "Impersonal",
    description: "Breakfast is theoretical.",
  },

  // ── humour ── mirrors HumourMode in tokens.ts
  {
    code: "humour_none",
    axis: "humour",
    label: "No joke",
    description: "The writing carries no joke at all, and is not the poorer.",
  },
  {
    code: "humour_dry",
    axis: "humour",
    label: "Dry",
    description: "The joke is a fact, stated and not returned to.",
  },
  {
    code: "humour_deadpan",
    axis: "humour",
    label: "Deadpan",
    description: "The outrageous thing in the same tone as the hour of dinner.",
  },
  {
    code: "humour_arch",
    axis: "humour",
    label: "Arch",
    description: "Says one thing and means the other, and trusts you to hear it.",
  },
  {
    code: "humour_warm",
    axis: "humour",
    label: "Warm",
    description: "The joke is affection. Nobody is the target except a friend.",
  },
  {
    code: "humour_absurd",
    axis: "humour",
    label: "Absurd",
    description: "Commits to a ridiculous premise and does not blink.",
  },

  // ── cadence ── no union in tokens.ts to mirror; see the note above
  {
    code: "cadence_clipped",
    axis: "cadence",
    label: "Clipped",
    description: "Short declaratives. A noun phrase is a whole sentence.",
  },
  {
    code: "cadence_unhurried",
    axis: "cadence",
    label: "Unhurried",
    description: "Long lines that take their time and are not in a hurry to land.",
  },
  {
    code: "cadence_rapid",
    axis: "cadence",
    label: "Rapid",
    description: "Quick, overlapping, one thing on top of the last.",
  },
  {
    code: "cadence_ornate",
    axis: "cadence",
    label: "Ornate",
    description: "Builds. Subordinate clauses, and a list that arrives in three.",
  },

  // ── manner ── bipolar. The description names both ends.
  {
    code: "warmth",
    axis: "manner",
    label: "Warmth",
    description:
      "Positive: says the fond thing out loud. Negative: keeps a pleasant distance.",
  },
  {
    code: "volume",
    axis: "manner",
    label: "Volume",
    description:
      "Positive: several people at once. Negative: one voice at a time, low.",
  },
  {
    code: "irreverence",
    axis: "manner",
    label: "Irreverence",
    description:
      "Positive: nothing is sacred, including each other. Negative: nobody is ever rude.",
  },
  {
    code: "precision",
    axis: "manner",
    label: "Precision",
    description:
      "Positive: the exact word, the exact hour. Negative: near enough, roughly.",
  },
  {
    code: "knowingness",
    axis: "manner",
    label: "Knowingness",
    description:
      "Positive: assumes you were there and explains nothing. Negative: tells you properly.",
  },
  {
    code: "earnestness",
    axis: "manner",
    label: "Earnestness",
    description:
      "Positive: means it, plainly, with no armour. Negative: everything through irony.",
  },
  {
    code: "theatricality",
    axis: "manner",
    label: "Theatricality",
    description:
      "Positive: performs it, and performs it twice. Negative: says less than it means.",
  },
] as const satisfies readonly VoiceFacet[];

export type VoiceFacetCode = (typeof VOICE_FACETS)[number]["code"];

/** Facet by code. Built once. */
export const VOICE_FACET: Readonly<Record<VoiceFacetCode, VoiceFacet>> =
  Object.fromEntries(VOICE_FACETS.map((f) => [f.code, f])) as Record<
    VoiceFacetCode,
    VoiceFacet
  >;

/* ── the correspondence with tokens.ts ─────────────────────────────────
 *
 * These three Records are the mechanical proof that the facet vocabulary covers
 * the closed part of a Voice. They are exhaustive by their own type, so a new
 * `HumourMode` in tokens.ts is a compile error here rather than a destination
 * that quietly matches nobody.
 */

export const FORMALITY_FACET: Readonly<Record<Formality, VoiceFacetCode>> = {
  ceremonial: "formality_ceremonial",
  formal: "formality_formal",
  cordial: "formality_cordial",
  plain: "formality_plain",
  familiar: "formality_familiar",
};

export const ADDRESS_FACET: Readonly<Record<AddressMode, VoiceFacetCode>> = {
  second_person: "address_second_person",
  third_person: "address_third_person",
  collective_first: "address_collective_first",
  impersonal: "address_impersonal",
};

export const HUMOUR_FACET: Readonly<Record<HumourMode, VoiceFacetCode>> = {
  none: "humour_none",
  dry: "humour_dry",
  deadpan: "humour_deadpan",
  arch: "humour_arch",
  warm: "humour_warm",
  absurd: "humour_absurd",
};

/** A facet and how strongly it is claimed. Signed, -1..1, never zero. */
export type FacetWeight = { code: VoiceFacetCode; weight: number };

/**
 * The three facets a destination's voice states OUTRIGHT.
 *
 * Derived rather than hand-tagged, because they are already written down: a
 * voice that says `formality: "cordial"` has made the claim, and asking a
 * curator to repeat it in a tag table would be two representations of one fact.
 * Everything else about a voice — its cadence and its manner — is prose, and is
 * hand-tagged per destination in src/lib/destinations.ts.
 */
export function statedVoiceFacets(voice: Voice): FacetWeight[] {
  return [
    { code: FORMALITY_FACET[voice.formality], weight: 1 },
    { code: ADDRESS_FACET[voice.address.mode], weight: 1 },
    { code: HUMOUR_FACET[voice.humour.mode], weight: 1 },
  ];
}

/* ── the tones ─────────────────────────────────────────────────────────
 *
 * WHAT MAKES A GOOD TONE. Every label below is a thing a host can picture one
 * of her friends doing. "Talks almost entirely in in-jokes" is recognisable;
 * "familiar" is a category, and nobody has ever looked at a word like that and
 * seen a person. The abstraction is what the tone RESOLVES to, and she never
 * sees it.
 *
 * They are grouped, and the groups are not decoration: fifty tiles on a phone
 * is a long scroll, and a scroll with eight landmarks in it is a browse while
 * an undifferentiated grid is a wall. The group headings are also the only
 * place the axes are named out loud, in the house's register rather than in
 * this file's.
 *
 * Codes are PERMANENT. Same contract as a quiz option code, for the same
 * reason: they land in quiz_response and in a customer's history. Reword a
 * label freely; retire a code rather than redefining it.
 */

export type ToneGroupKey =
  | "funny"
  | "volume"
  | "ceremony"
  | "kindness"
  | "precision"
  | "pace"
  | "knowing"
  | "performance";

export type ToneGroup = { key: ToneGroupKey; label: string };

/** Presentation order. The heading above each run of tiles. */
export const TONE_GROUPS: readonly ToneGroup[] = [
  { key: "funny", label: "When something is funny" },
  { key: "volume", label: "How loud a room they are" },
  { key: "ceremony", label: "How much ceremony they can take" },
  { key: "kindness", label: "How they say the kind thing" },
  { key: "precision", label: "How exact they are" },
  { key: "pace", label: "How fast the evening moves" },
  { key: "knowing", label: "What they assume you already know" },
  { key: "performance", label: "How much they perform" },
];

export type Tone = {
  /** Permanent. Stored in quiz_response.voice_tones. */
  code: string;
  /** What she reads on the tile. Concrete, and about people. */
  label: string;
  group: ToneGroupKey;
  /** At least one. Signed, -1..1, never zero. */
  facets: readonly FacetWeight[];
};

export const TONES = [
  // ── when something is funny ────────────────────────────────────────
  {
    code: "deadpan",
    label: "Says the outrageous thing with a straight face",
    group: "funny",
    facets: [
      { code: "humour_deadpan", weight: 1 },
      { code: "theatricality", weight: -0.5 },
      { code: "earnestness", weight: -0.3 },
    ],
  },
  {
    code: "dry_aside",
    label: "The best line is muttered, not announced",
    group: "funny",
    facets: [
      { code: "humour_dry", weight: 0.9 },
      { code: "volume", weight: -0.5 },
      { code: "theatricality", weight: -0.6 },
      { code: "cadence_clipped", weight: 0.4 },
    ],
  },
  {
    code: "teasing",
    label: "Teases the people it loves the most",
    group: "funny",
    facets: [
      { code: "humour_warm", weight: 0.8 },
      { code: "irreverence", weight: 0.5 },
      { code: "formality_familiar", weight: 0.6 },
      { code: "warmth", weight: 0.5 },
    ],
  },
  {
    code: "in_jokes",
    label: "Talks almost entirely in in-jokes",
    group: "funny",
    facets: [
      { code: "knowingness", weight: 1 },
      { code: "formality_familiar", weight: 0.8 },
      { code: "address_collective_first", weight: 0.5 },
    ],
  },
  {
    code: "absurd",
    label: "Follows a stupid idea all the way to the end",
    group: "funny",
    facets: [
      { code: "humour_absurd", weight: 1 },
      { code: "theatricality", weight: 0.4 },
      { code: "precision", weight: -0.3 },
    ],
  },
  {
    code: "self_deprecating",
    label: "Gets there first about themselves",
    group: "funny",
    facets: [
      { code: "humour_dry", weight: 0.6 },
      { code: "warmth", weight: 0.4 },
      { code: "theatricality", weight: -0.3 },
    ],
  },
  {
    code: "nothing_sacred",
    label: "Nothing is off limits, including each other",
    group: "funny",
    facets: [
      { code: "irreverence", weight: 1 },
      { code: "formality_familiar", weight: 0.6 },
      { code: "humour_arch", weight: 0.4 },
    ],
  },
  /*
   * The clean one, and the group was wrong without it.
   *
   * Every other tone here is funny AT something — a straight face over an
   * outrage, a muttered aside, a tease, an in-joke, a stupid premise, a
   * pre-emptive strike at oneself, nothing off limits. A group that is warmly,
   * plainly funny had no tile to tap, so the only way to say "we laugh a lot"
   * was to also say "and someone is usually the target", which for many
   * groups is simply untrue.
   *
   * It is the one tone in the group with `irreverence` NEGATIVE, and that sign
   * is the whole point: it is not merely the absence of an edge, it is a
   * positive preference against one. A host who taps this and nothing else
   * gets writing that is funny and that nobody could be stung by — which is
   * also the correct default for a birthday, a bridal anything, or any room
   * holding somebody's mother.
   */
  {
    code: "good_natured",
    label: "Funny without anyone being the joke",
    group: "funny",
    facets: [
      { code: "humour_warm", weight: 1 },
      { code: "warmth", weight: 0.7 },
      { code: "earnestness", weight: 0.4 },
      { code: "irreverence", weight: -0.6 },
    ],
  },

  // ── how loud a room they are ───────────────────────────────────────
  {
    code: "all_at_once",
    label: "Four conversations, all at once",
    group: "volume",
    facets: [
      { code: "volume", weight: 1 },
      { code: "cadence_rapid", weight: 0.7 },
      { code: "formality_familiar", weight: 0.4 },
    ],
  },
  {
    code: "interrupts",
    label: "Finishes each other's sentences",
    group: "volume",
    facets: [
      { code: "cadence_rapid", weight: 0.9 },
      { code: "volume", weight: 0.5 },
      { code: "knowingness", weight: 0.4 },
    ],
  },
  {
    code: "one_conversation",
    label: "One conversation, and everyone in it",
    group: "volume",
    facets: [
      { code: "volume", weight: -0.6 },
      { code: "cadence_unhurried", weight: 0.5 },
      { code: "precision", weight: 0.3 },
    ],
  },
  {
    code: "across_the_room",
    label: "Will shout something across the room",
    group: "volume",
    facets: [
      { code: "volume", weight: 0.9 },
      { code: "theatricality", weight: 0.5 },
      { code: "irreverence", weight: 0.4 },
    ],
  },
  {
    code: "low_voices",
    label: "Says the important part quietly",
    group: "volume",
    facets: [
      { code: "volume", weight: -0.9 },
      { code: "theatricality", weight: -0.5 },
      { code: "cadence_clipped", weight: 0.3 },
    ],
  },
  {
    code: "laughs_first",
    label: "Laughs before the end of the sentence",
    group: "volume",
    facets: [
      { code: "warmth", weight: 0.7 },
      { code: "humour_warm", weight: 0.6 },
      { code: "volume", weight: 0.5 },
    ],
  },

  // ── how much ceremony they can take ────────────────────────────────
  {
    code: "toasts",
    label: "Someone always stands up to say something",
    group: "ceremony",
    facets: [
      { code: "formality_formal", weight: 0.7 },
      { code: "theatricality", weight: 0.6 },
      { code: "earnestness", weight: 0.5 },
    ],
  },
  {
    code: "rises_to_greet",
    label: "Stands up when someone new arrives",
    group: "ceremony",
    facets: [
      { code: "formality_ceremonial", weight: 0.7 },
      { code: "address_third_person", weight: 0.4 },
      { code: "irreverence", weight: -0.5 },
    ],
  },
  {
    code: "seating_plan",
    label: "Wants to know where they are sitting",
    group: "ceremony",
    facets: [
      { code: "formality_formal", weight: 0.6 },
      { code: "precision", weight: 0.6 },
      { code: "address_third_person", weight: 0.3 },
    ],
  },
  {
    code: "no_speeches",
    label: "Would rather nobody made a speech",
    group: "ceremony",
    facets: [
      { code: "formality_ceremonial", weight: -0.8 },
      { code: "theatricality", weight: -0.6 },
      { code: "formality_plain", weight: 0.5 },
    ],
  },
  {
    code: "dressed_up",
    label: "Dresses for dinner without being asked",
    group: "ceremony",
    facets: [
      { code: "formality_ceremonial", weight: 0.6 },
      { code: "formality_formal", weight: 0.5 },
      { code: "theatricality", weight: 0.3 },
    ],
  },
  {
    code: "first_names",
    label: "First names from the first minute",
    group: "ceremony",
    facets: [
      { code: "formality_familiar", weight: 0.8 },
      { code: "address_second_person", weight: 0.5 },
      { code: "formality_ceremonial", weight: -0.5 },
    ],
  },

  // ── how they say the kind thing ────────────────────────────────────
  {
    code: "says_it_out_loud",
    label: "Says the loving thing out loud, sober",
    group: "kindness",
    facets: [
      { code: "warmth", weight: 1 },
      { code: "earnestness", weight: 0.8 },
      { code: "humour_warm", weight: 0.4 },
    ],
  },
  {
    code: "nicknames",
    label: "Everyone has a name only this group uses",
    group: "kindness",
    facets: [
      { code: "formality_familiar", weight: 0.9 },
      { code: "warmth", weight: 0.7 },
      { code: "knowingness", weight: 0.6 },
    ],
  },
  {
    code: "asks_properly",
    label: "Asks how you are and waits for the answer",
    group: "kindness",
    facets: [
      { code: "warmth", weight: 0.8 },
      { code: "earnestness", weight: 0.7 },
      { code: "cadence_unhurried", weight: 0.4 },
    ],
  },
  {
    code: "warm_not_loud",
    label: "Fond of each other and quiet about it",
    group: "kindness",
    facets: [
      { code: "warmth", weight: 0.4 },
      { code: "theatricality", weight: -0.7 },
      { code: "formality_cordial", weight: 0.6 },
    ],
  },
  {
    code: "compliments_plainly",
    label: "Pays a compliment without hiding it in a joke",
    group: "kindness",
    facets: [
      { code: "earnestness", weight: 0.9 },
      { code: "warmth", weight: 0.6 },
      { code: "humour_none", weight: 0.3 },
    ],
  },
  {
    code: "sentimental",
    label: "Cries at the toast and is not embarrassed",
    group: "kindness",
    facets: [
      { code: "earnestness", weight: 1 },
      { code: "warmth", weight: 0.8 },
      { code: "humour_none", weight: 0.3 },
      { code: "theatricality", weight: 0.4 },
    ],
  },

  // ── how exact they are ─────────────────────────────────────────────
  {
    code: "exact_word",
    label: "Hunts for the exact word and finds it",
    group: "precision",
    facets: [
      { code: "precision", weight: 1 },
      { code: "cadence_ornate", weight: 0.4 },
      { code: "formality_formal", weight: 0.3 },
    ],
  },
  {
    code: "will_look_it_up",
    label: "Settles the argument with a phone",
    group: "precision",
    facets: [
      { code: "precision", weight: 0.8 },
      { code: "humour_arch", weight: 0.3 },
      { code: "earnestness", weight: 0.3 },
    ],
  },
  {
    code: "corrects_gently",
    label: "Corrects the year, kindly, every time",
    group: "precision",
    facets: [
      { code: "precision", weight: 0.7 },
      { code: "humour_dry", weight: 0.4 },
      { code: "warmth", weight: 0.3 },
    ],
  },
  {
    code: "understated",
    label: "Says less than it means and lets it sit",
    group: "precision",
    facets: [
      { code: "theatricality", weight: -0.9 },
      { code: "cadence_clipped", weight: 0.7 },
      { code: "humour_dry", weight: 0.5 },
      { code: "knowingness", weight: 0.5 },
      { code: "address_impersonal", weight: 0.3 },
    ],
  },
  {
    code: "roughly_eight",
    label: "Says around eight and means somewhere after nine",
    group: "precision",
    facets: [
      { code: "precision", weight: -0.9 },
      { code: "cadence_unhurried", weight: 0.4 },
      { code: "formality_familiar", weight: 0.4 },
    ],
  },
  {
    code: "long_way_round",
    label: "Tells it the long way, with the detours",
    group: "precision",
    facets: [
      { code: "cadence_ornate", weight: 0.8 },
      { code: "cadence_unhurried", weight: 0.6 },
      { code: "theatricality", weight: 0.4 },
    ],
  },

  // ── how fast the evening moves ─────────────────────────────────────
  {
    code: "unhurried",
    label: "Nobody hurries anybody",
    group: "pace",
    facets: [
      { code: "cadence_unhurried", weight: 0.9 },
      { code: "formality_cordial", weight: 0.3 },
      { code: "volume", weight: -0.3 },
    ],
  },
  {
    code: "talks_fast",
    label: "Talks fast and expects you to keep up",
    group: "pace",
    facets: [
      { code: "cadence_rapid", weight: 0.9 },
      { code: "precision", weight: 0.4 },
      { code: "volume", weight: 0.3 },
    ],
  },
  {
    code: "arrives_late",
    label: "Arrives when it arrives",
    group: "pace",
    facets: [
      { code: "precision", weight: -0.7 },
      { code: "formality_ceremonial", weight: -0.5 },
      { code: "cadence_unhurried", weight: 0.4 },
    ],
  },
  {
    code: "lingers",
    label: "Still at the table two hours after the plates",
    group: "pace",
    facets: [
      { code: "cadence_unhurried", weight: 0.8 },
      { code: "warmth", weight: 0.4 },
      { code: "formality_cordial", weight: 0.4 },
    ],
  },
  {
    code: "no_dead_air",
    label: "Never lets a silence sit",
    group: "pace",
    facets: [
      { code: "cadence_rapid", weight: 0.7 },
      { code: "volume", weight: 0.6 },
      { code: "theatricality", weight: 0.3 },
    ],
  },
  {
    code: "comfortable_silence",
    label: "Can sit in a silence without filling it",
    group: "pace",
    facets: [
      { code: "cadence_unhurried", weight: 0.7 },
      { code: "volume", weight: -0.6 },
      { code: "theatricality", weight: -0.4 },
    ],
  },

  // ── what they assume you already know ──────────────────────────────
  {
    code: "leans_in",
    label: "Leans in to say the good part",
    group: "knowing",
    facets: [
      { code: "knowingness", weight: 0.9 },
      { code: "volume", weight: -0.5 },
      { code: "humour_arch", weight: 0.4 },
    ],
  },
  {
    code: "explains_nothing",
    label: "Explains nothing, on principle",
    group: "knowing",
    facets: [
      { code: "knowingness", weight: 1 },
      { code: "cadence_clipped", weight: 0.6 },
      { code: "humour_deadpan", weight: 0.4 },
      { code: "address_impersonal", weight: 0.4 },
    ],
  },
  {
    code: "straight_to_gossip",
    label: "Gets to the good part before the coats are off",
    group: "knowing",
    facets: [
      { code: "knowingness", weight: 0.7 },
      { code: "cadence_rapid", weight: 0.5 },
      { code: "irreverence", weight: 0.5 },
    ],
  },
  {
    code: "means_the_other_thing",
    label: "Says one thing, means the other, everyone knows",
    group: "knowing",
    facets: [
      { code: "humour_arch", weight: 0.9 },
      { code: "knowingness", weight: 0.8 },
      { code: "earnestness", weight: -0.5 },
    ],
  },
  {
    code: "between_us",
    label: "What is said at this table stays at this table",
    group: "knowing",
    facets: [
      { code: "address_collective_first", weight: 0.8 },
      { code: "knowingness", weight: 0.6 },
      { code: "formality_familiar", weight: 0.3 },
    ],
  },
  {
    code: "spells_it_out",
    label: "Would rather everyone were told properly",
    group: "knowing",
    facets: [
      { code: "knowingness", weight: -0.8 },
      { code: "precision", weight: 0.5 },
      { code: "earnestness", weight: 0.5 },
      { code: "address_second_person", weight: 0.4 },
    ],
  },

  // ── how much they perform ──────────────────────────────────────────
  {
    code: "makes_an_entrance",
    label: "Someone always makes an entrance",
    group: "performance",
    facets: [
      { code: "theatricality", weight: 1 },
      { code: "volume", weight: 0.5 },
      { code: "formality_ceremonial", weight: 0.3 },
    ],
  },
  {
    code: "does_the_voice",
    label: "Will do the voice, and do it twice",
    group: "performance",
    facets: [
      { code: "theatricality", weight: 0.9 },
      { code: "humour_absurd", weight: 0.6 },
      { code: "volume", weight: 0.4 },
    ],
  },
  {
    code: "one_tells_it",
    label: "One of them tells it and the rest let her",
    group: "performance",
    facets: [
      { code: "theatricality", weight: 0.6 },
      { code: "cadence_ornate", weight: 0.6 },
      { code: "volume", weight: -0.3 },
    ],
  },
  {
    code: "nothing_by_halves",
    label: "Nothing here is done by halves",
    group: "performance",
    facets: [
      { code: "theatricality", weight: 0.7 },
      { code: "irreverence", weight: 0.4 },
      { code: "volume", weight: 0.4 },
    ],
  },
  {
    code: "never_performs",
    // Was "Would rather die than perform". A tile a host taps about her own
    // friends should not spend a death to make a small joke — and the plain
    // version is the better line anyway: it is a picture rather than a
    // flourish, which is the rule every other option on this page follows.
    // The CODE is unchanged; labels are free to be reworded, codes are not.
    label: "Will not get up in front of a room",
    group: "performance",
    facets: [
      { code: "theatricality", weight: -1 },
      { code: "formality_plain", weight: 0.5 },
      { code: "humour_deadpan", weight: 0.3 },
    ],
  },
  {
    code: "swears_fondly",
    label: "Swears, warmly, in company",
    group: "performance",
    facets: [
      { code: "irreverence", weight: 0.9 },
      { code: "formality_familiar", weight: 0.7 },
      { code: "warmth", weight: 0.4 },
    ],
  },
  {
    code: "impeccably_polite",
    label: "Impeccably polite at three in the morning",
    group: "performance",
    facets: [
      { code: "irreverence", weight: -0.9 },
      { code: "formality_formal", weight: 0.7 },
      { code: "formality_ceremonial", weight: 0.4 },
      { code: "address_third_person", weight: 0.3 },
    ],
  },
] as const satisfies readonly Tone[];

/**
 * Every tone code, as a type.
 *
 * This is what makes a destination's tags checkable at compile time: a
 * destination tagged with a tone that does not exist is a build failure rather
 * than a row that matches nobody. See DESTINATION_TONES in
 * src/lib/destinations.ts.
 */
export type ToneCode = (typeof TONES)[number]["code"];

/** Tone by code. Built once. */
export const TONE: Readonly<Record<string, Tone>> = Object.fromEntries(
  TONES.map((t) => [t.code, t])
);

/* ── resolution ────────────────────────────────────────────────────────
 *
 * The same arithmetic the database does in `quiz_response_voice` (db/007), kept
 * here so that a curator's tool, a test, and a script can all reach it without
 * a connection. If the two ever disagree the database wins on what is stored;
 * this is what makes the mapping reviewable and testable.
 *
 * ── WHAT A TONE SHE DID NOT TAP MEANS ────────────────────────────────
 *
 * NOTHING. Not a mild dislike, not a zero, not a row.
 *
 * She is shown fifty tiles and taps a handful. The forty-odd she leaves are
 * overwhelmingly ones she never considered — she stopped reading, she found
 * three that were right, she was on a train. Reading them as soft negatives
 * would fill the vector with claims she never made and drown the few she did,
 * and the negative weights that DO exist here — `understated` really is a claim
 * against theatricality — would then be indistinguishable from phantoms.
 *
 * So a negative only ever arrives inside a tone she CHOSE. Absence is silence.
 *
 * The consequence, stated once so nobody has to rediscover it: this question
 * cannot produce a veto. "She would hate a theatrical destination" is not
 * knowable from tiles she did not tap, and inferring it would be inventing an
 * answer. Vetoes come from the question that asks for them — "what would ruin
 * it", `anti_preferences`, which carries `answer_polarity = 'negative'` in the
 * bridge precisely so that the two kinds of statement never get confused.
 */

/** A voice as a signed vector over the facet vocabulary. */
export type VoiceProfile = Partial<Record<VoiceFacetCode, number>>;

/**
 * A tone and how strongly a destination claims it.
 *
 * Only the CATALOGUE side is weighted. A host taps a tile or does not; asking
 * her how strongly she means it would be a form. A destination is authored, and
 * a curator can say that Westhampton is definitively deadpan and only faintly
 * disreputable — the same +1 / +0.2 convention as every other facet tag.
 */
export type ToneWeight = { code: ToneCode; weight: number };

/**
 * Weighted tone tags, resolved and summed into one profile.
 *
 * The product of the two weights: how strongly the thing claims the tone, times
 * how strongly the tone claims the facet. A destination faintly tagged
 * `nothing_sacred` (0.4) picks up irreverence at 0.4, not at 1.
 */
export function taggedToneProfile(tags: readonly ToneWeight[]): VoiceProfile {
  const profile: VoiceProfile = {};
  for (const tag of tags) {
    const tone = TONE[tag.code];
    if (!tone) continue;
    for (const { code: facet, weight } of tone.facets) {
      profile[facet] = (profile[facet] ?? 0) + weight * tag.weight;
    }
  }
  return profile;
}

/**
 * Her chosen tones, summed into one profile. Unknown codes are ignored.
 *
 * Every chosen tone counts the same, because that is exactly what she told us.
 * See the note above on what the unchosen ones count for.
 */
export function toneProfile(codes: readonly string[]): VoiceProfile {
  return taggedToneProfile(
    codes
      .filter((code) => code in TONE)
      .map((code) => ({ code: code as ToneCode, weight: 1 }))
  );
}

/**
 * How close two voices are, -1..1.
 *
 * Cosine rather than a dot product because a host who taps seven tones must not
 * out-score one who taps two — the question asks what her people are like, not
 * how many tiles she felt like touching. Facets absent from a profile count as
 * zero, which is the honest reading: no claim either way.
 */
export function voiceAffinity(a: VoiceProfile, b: VoiceProfile): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const facet of VOICE_FACETS) {
    const x = a[facet.code] ?? 0;
    const y = b[facet.code] ?? 0;
    dot += x * y;
    normA += x * x;
    normB += y * y;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / Math.sqrt(normA * normB);
}

/** A hand-authored list of weights as a profile. Later entries win. */
export function profileOf(facets: readonly FacetWeight[]): VoiceProfile {
  const profile: VoiceProfile = {};
  for (const { code, weight } of facets) profile[code] = weight;
  return profile;
}

/**
 * A destination's voice as a profile, in the SAME vocabulary a host answers in.
 *
 * ── WHY A DESTINATION IS TAGGED IN TONES ─────────────────────────────
 *
 * The fifty tones are the entire semantic bandwidth between a host and the
 * catalogue. If a destination were characterised in a richer private vocabulary
 * — its own facet weights, hand-tuned, twenty-six axes wide — the join between
 * her handful of taps and that description would return mush: she cannot make a
 * claim about `cadence_ornate` because she was never shown it. Tagging both
 * sides with tones keeps the two halves commensurable, and it makes the
 * vocabulary FALSIFIABLE: a destination whose voice cannot be said in six to
 * ten tones is a destination this question cannot match, and the right response
 * is to fix the tones rather than to describe around them.
 *
 * The three stated facets are added on top because they are free and exact —
 * the voice has already written down its formality, its address and its humour
 * mode, and a tone tag is a weaker way of saying something already said
 * precisely. They may not be restated by a tone tag; they are merged last.
 */
export function destinationVoiceProfile(
  voice: Voice,
  tones: readonly ToneWeight[]
): VoiceProfile {
  return { ...taggedToneProfile(tones), ...profileOf(statedVoiceFacets(voice)) };
}
