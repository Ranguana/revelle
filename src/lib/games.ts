/**
 * THE GAMES — the founder's own, in code.
 *
 * The same argument src/lib/destinations.ts makes, for the same reason: these
 * are the CANONICAL, REVIEWABLE text of a game. A rule the founder wants
 * reworded should be a diff a human can read in a pull request, not migration
 * 037. db/010 holds the SHAPE of a game; scripts/seed-games.mjs moves what is
 * below into the tables the app and the curator's tool read from.
 *
 * Framework-free, like everything it sits beside. No React, no "server-only",
 * so a seed script can import it without starting Next.
 *
 * ─────────────────────────────────────────────────────────────────────
 * WHOSE THESE ARE
 *
 * Five of the seven are the founder's own, written and run at real parties.
 * They are the house's IP and the reason this pool is worth having at all: a
 * game nobody else can send is a thing Revelle has and a Pinterest board does
 * not. The rules below are hers. Wording has been tightened; no mechanic has
 * been added, removed, or softened.
 *
 * Fishbowl is a folk game — the noun game, Salad Bowl, Celebrity, a dozen other
 * names. Nobody owns it, which is exactly why the house may print it, in the
 * destination's own typeface, as a real object.
 *
 * Imposter is somebody else's product. It is RECOMMENDED and never provided:
 * Revelle may name it and point a host at it, and may not reproduce its rules
 * or print a single card for it. db/010 enforces that in both directions.
 *
 * ─────────────────────────────────────────────────────────────────────
 * A SCORE IN A PARTY GAME IS NOT A LEADERBOARD IN A PRODUCT
 *
 * docs/copy-brief.md bans points, streaks, badges and leaderboards. That rule
 * governs REVELLE'S OWN INTERFACE — the page a host reads, the application she
 * fills in — and it exists because congratulating a customer for continuing is
 * what a gimmick does.
 *
 * It has nothing to say about a scavenger hunt in which a foreign coin is worth
 * twenty. Party Bucks accumulating across an evening and spent at an auction at
 * the end is the mechanism that keeps a guest who has won nothing all night in
 * the room at midnight; it is the games working, not a leaderboard leaking in.
 * `scoring` and `currencyLabel` below are printed on game materials and read
 * aloud by a host. Do not sanitise them to satisfy a rule they are not the
 * subject of. The same paragraph is in db/010, because this keeps being
 * misread.
 *
 * ─────────────────────────────────────────────────────────────────────
 * THE FACET VOCABULARY, AND WHERE IT IS SHORT
 *
 * Every tag below is an EXISTING facet from db/002 — the vocabulary a host
 * answers in. That is deliberate and it is the same argument
 * src/lib/destinations.ts makes about tones: describing the catalogue in a
 * richer private vocabulary would leave the join between her handful of taps
 * and that description returning mush, because she was never given a way to
 * make most of those claims.
 *
 * Four things the founder's games genuinely are, that the vocabulary could not
 * say. They were written down rather than worked around, because none of them
 * was worth an insert until a host could ANSWER in it:
 *
 *   1. MAKING SOMETHING. Art Battle is a room of people with paint on their
 *      hands. `group_fun` had cook_together and nothing else physical.
 *   2. WORKING THE ROOM. The Reverse Scavenger Hunt and the Secret Cards run on
 *      persuasion — talking a stranger out of a foreign coin. `compete` is the
 *      nearest term and competition is not persuasion.
 *   3. A SECRET. Two of these games turn on nobody knowing what anybody else is
 *      doing. Nothing expressed concealment.
 *   4. STAKES — objects to win, and the willingness to gamble one. Two games
 *      are built on it.
 *
 * The honest proposal was a `group_fun` question with four more options, not
 * four facets tagged on one side of a join. That is what db/016 did:
 * `make_something`, `work_the_room`, `keep_a_secret` and `play_for_stakes` are
 * now four more tiles on "how does this group actually have fun", and the tags
 * below are the other side of that join. Nothing else about these games moved.
 */

/** db/010. What a game does to an evening. */
export type GameShape = "scheduled" | "ambient" | "finale";

/**
 * db/025. The arc of running a game, and the order the page prints it in.
 *
 *   before    what she sets out. No clock: the deadlines are already lead times
 *   underway  what has to be happening all evening. No clock either
 *   opening   getting the room to stop talking. The hardest moment a host has
 *   playing   the sequence, with the clock on it
 *   deciding  how it is scored or judged
 *   ending    how it stops. A game that peters out is a failure
 */
export type RunbookPhase =
  | "before"
  | "underway"
  | "opening"
  | "playing"
  | "deciding"
  | "ending";

/** db/025. The questions a host actually has at nine o'clock. */
export type TroubleKind =
  | "will_not_play"
  | "under_minimum"
  | "over_size"
  | "odd_number"
  | "running_long"
  | "played_before"
  | "not_landing";

/**
 * db/025. Is she playing, or running it? Several of these cannot be both, and
 * she needs to know before she starts rather than at the moment it begins.
 */
export type HostRole = "runs_it" | "plays_too";

/** db/010. Whether the house may print it, or only point at it. */
export type GameSourcing = "provided" | "recommended";

/** db/010. How a supply arrives. */
export type SupplySource = "printed" | "host_buys" | "on_hand";

/** db/010. Hard prerequisite, or a bonus. */
export type DependencyStrength = "required" | "enriched_by";

/** db/009's occasion_fit, on both eligibility axes. */
export type GameFit = "native" | "forbidden";

/**
 * One facet tag. `dimension` and `code` are resolved to a facet id by the seed,
 * which FAILS if either is unknown — a typo here must be an error and not a
 * row nobody ever matches.
 *
 * Weight runs -1..1 excluding zero, exactly as db/002 defines it: +1 is "this
 * IS the thing", +0.2 is "incidentally so", -1 is "actively repudiates it".
 *
 * The anti_preference tags are the subtle ones and are worth reading twice. A
 * POSITIVE weight on `forced_fun` means this game IS forced participation —
 * which is what makes it disappear for a host who said that ruins an evening.
 * It is not a criticism of the game.
 */
export type GameFacet = {
  dimension: string;
  code: string;
  weight: number;
  note?: string;
};

export type GameSupply = {
  item: string;
  detail?: string;
  source: SupplySource;
  perGuest?: boolean;
  quantity?: number;
  /** Days before the party it must be in hand. Drives The Prep. */
  leadTimeDays?: number;
  note?: string;
};

/** A condition of the room or the people in it. Codes from db/010. */
export type GameRequirement = { requirement: string; note?: string };

/** A real object, set in the destination's palette and face. */
export type GamePrintedPiece = {
  piece: string;
  label: string;
  description?: string;
  /** db/004's voice_piece_kind — what kind of writing goes on it. */
  voicePiece?: string;
  perGuest?: boolean;
  quantity?: number;
  note?: string;
};

export type GameOccasionClaim = {
  occasion: string;
  fit: GameFit;
  note?: string;
};

export type GameSlotClaim = { slotCode: string; fit: GameFit; note?: string };

/**
 * A game that needs another game to have happened.
 *
 * `groupKey` carries the any-of reading argued in db/010: required rows sharing
 * a key are satisfied when ANY ONE of them is present. The auction needs a way
 * for guests to have earned something; it does not need all four earning games.
 */
export type GameDependency = {
  requires: string;
  strength: DependencyStrength;
  groupKey?: string;
  note?: string;
};

/**
 * How a game behaves under one destination — db/009's stage 3, db/019's claim.
 *
 * The three are not degrees of the same thing:
 *
 *   forbidden  a veto. Never here, at any score.
 *   native     WRITTEN FOR HERE. A whitelist — a game with any native scope is
 *              eligible only under the destinations it claims. Leave it off
 *              unless that is what you mean.
 *   affinity   a weight, signed −1..1, added to the score. "The house would
 *              allow it" is an affinity; it is not a claim, and a game carrying
 *              only affinities stays playable everywhere.
 */
export type GameWorldScope = {
  world: string;
  forbidden?: boolean;
  native?: boolean;
  affinity?: number;
  note?: string;
};

/**
 * ONE STEP OF A RUNBOOK — db/025.
 *
 * Four fields carry the writing because they are read at four different
 * speeds. `instruction` is what she finds when she looks down at a phone
 * mid-sentence, so it is an imperative and it is short. `detail` is where the
 * sentences stay hers. `say` is words out loud, and it exists because starting
 * a game is the hardest thing a host does and being handed the sentence is
 * worth more than being handed another rule.
 *
 * `supplyItem` and `printedPiece` POINT at rows that already exist rather than
 * restating them. The seed fails on a pointer to something the game does not
 * have, and so does the database.
 */
export type RunbookStep = {
  /** Machine-stable within a game. Reordering must not change what a step is. */
  step: string;
  phase: RunbookPhase;
  /** The imperative. Short enough to read at a glance. */
  instruction: string;
  /** Why, or the one true detail that makes it land. */
  detail?: string;
  /** Words she may say out loud. Never a script; the sentence she would have found. */
  say?: string;
  /** Minutes of the evening. Only in a phase that has a clock. */
  minutes?: number;
  /** A `supplies[].item` on this same game. */
  supplyItem?: string;
  /** A `printedMatter[].piece` on this same game. */
  printedPiece?: string;
  note?: string;
};

/** What she does when it goes wrong. One answer per kind of trouble. */
export type Contingency = { trouble: TroubleKind; answer: string };

/**
 * THE GAME PAGE.
 *
 * The card in her Revelle is `description` and it stays a teaser. This is what
 * she clicks through to, and it is the one thing in the product read under
 * pressure, standing up, with people waiting. Clarity wins here where clarity
 * and voice conflict — the structure is a runbook and the sentences stay hers.
 */
export type Runbook = {
  hostRole: HostRole;
  /** One sentence about what running it costs her. */
  hostNote?: string;
  steps: readonly RunbookStep[];
  contingencies: readonly Contingency[];
};

export type Game = {
  slug: string;
  name: string;
  /** One or two sentences. What it is, in the house's register. THE CARD. */
  description: string;
  /**
   * The prose account of what the game is, read while choosing. NOT the
   * instructions — those are `runbook`, and db/025 says why the two are
   * different documents with different readers.
   */
  howItWorks: string;
  /** The sentence a host reads. game_supply is the same fact, counted. */
  materials?: string;

  shape: GameShape;
  sourcing: GameSourcing;

  /** The planning figure and the top of the range. Null on an ambient game. */
  durationMinutes?: number;
  durationMaxMinutes?: number;

  /** A CONSTRAINT, never a score. Null at either end means no limit there. */
  minGuests?: number;
  maxGuests?: number;

  /** A GAME RULE. Read the note at the top of this file. */
  scoring?: string;
  currencyLabel?: string;

  /** Recommended games only. */
  externalName?: string;
  externalUrl?: string;
  /** What can go wrong that is not ours to fix. */
  caveat?: string;

  sourceNote?: string;
  notes?: string;

  /** db/025. How it is actually run, by a host who has never seen it. */
  runbook: Runbook;

  facets: readonly GameFacet[];
  occasions: readonly GameOccasionClaim[];
  slots: readonly GameSlotClaim[];
  supplies: readonly GameSupply[];
  requirements: readonly GameRequirement[];
  printedMatter: readonly GamePrintedPiece[];
  dependencies: readonly GameDependency[];
  worlds: readonly GameWorldScope[];
};

const HOUSE = "The founder's own. Written and run at real parties.";

/**
 * ART BATTLE.
 *
 * Three rounds and a twist. The twist is the game: the winners do not keep what
 * they won, and the artist does not get to explain their own work.
 */
const ART_BATTLE: Game = {
  slug: "art-battle",
  name: "Art Battle",
  description:
    "Everyone paints the same thing, nobody signs it, and then everyone " +
    "lies about somebody else's.",
  howItWorks:
    "One prompt, the same for everyone, and twenty minutes to make " +
    "something. Nothing is signed.\n\n" +
    "The work goes up anonymously. Each artist gets one minute to explain a " +
    "piece that is not theirs, and the explanation should be ridiculous.\n\n" +
    "Then the room votes: Most Beautiful, Funniest, Most Confusing, I'd Hang " +
    "This, and Best Story. The Best Story vote is not required to be the true " +
    "one.\n\n" +
    "The twist, and the reason to run it: the winners do not keep their " +
    "work. Every winning piece goes to a guest drawn at random.",
  materials:
    "Small canvases or thick paper, paint and markers, something to collage " +
    "with, a timer, and a wall or a row of easels to put the finished work on.",

  shape: "scheduled",
  sourcing: "provided",
  durationMinutes: 45,
  durationMaxMinutes: 60,
  minGuests: 6,
  // No ceiling. The founder wrote "6-30+" and meant the plus: the game gets
  // better with more of it. What actually binds at fifty is the canvases, and
  // that is a supply line and a lead time, not a rule.
  maxGuests: undefined,

  scoring:
    "Five titles, voted by the room: Most Beautiful, Funniest, Most " +
    "Confusing, I'd Hang This, Best Story.",
  sourceNote: HOUSE,
  notes:
    "The prompts are the authored part and are meant to be replaced per " +
    "destination. The five that have been run: The Worst First Date, A " +
    "Secret Superpower, Brooklyn in 2125, Your Inner Monster, An Expensive " +
    "Mistake.",

  /**
   * THE HOLE THIS RUNBOOK HAD TO CLOSE.
   *
   * "The work goes up anonymously" is not a thing that can happen in a room
   * where everyone watched everyone paint. The answer is not a better rule, it
   * is a break: the room leaves, the wall goes up while they are gone, and the
   * only thing that is genuinely anonymous is the BALLOT — numbers on the
   * front, names nowhere, and one person holding the key. The room will
   * recognise some of it, and the runbook says so rather than pretending.
   */
  runbook: {
    hostRole: "plays_too",
    hostNote:
      "You paint in the twenty minutes like everyone else. The three jobs " +
      "that are only yours are the clock, the wall, and the count.",
    steps: [
      {
        step: "clear_the_table",
        phase: "before",
        instruction: "Clear a table long enough for everyone to paint at once.",
        detail:
          "Not in shifts. A room where half the people are waiting for a " +
          "seat spends twenty minutes watching the other half.",
        supplyItem: "Easels, or a long table and a wall",
      },
      {
        step: "lay_out_the_canvases",
        phase: "before",
        instruction:
          "Set out one canvas each and two spare, and put the paint in the middle.",
        detail:
          "Identical canvases. Nothing that identifies whose is whose, which " +
          "is the first half of the anonymity and costs nothing.",
        supplyItem: "Small canvases or thick paper",
      },
      {
        step: "hide_the_stickers",
        phase: "before",
        instruction: "Keep the numbered stickers in your pocket, not on the table.",
        detail:
          "They go on the backs of the finished work while the room is out " +
          "of it. Anyone who sees a number being written knows a number.",
        supplyItem: "Numbered voting stickers",
      },
      {
        step: "write_the_names",
        phase: "before",
        instruction: "Write every guest's name on a slip and fold them into the bowl.",
        detail: "The winners do not keep their work. This is how it is given away.",
        supplyItem: "A bowl",
      },
      {
        step: "call_the_room",
        phase: "opening",
        instruction: "Turn the music off and stand where the light is.",
        detail:
          "Do not raise your voice over the room. Turn the music off, stand " +
          "still, and wait. Six seconds of a host saying nothing does what " +
          "shouting does not.",
        say: "Everyone take a canvas. There is one prompt, it is the same for all of us, and you get twenty minutes.",
        minutes: 2,
      },
      {
        step: "draw_the_prompt",
        phase: "opening",
        instruction:
          "Have somebody draw one prompt card from the five and read it out.",
        detail:
          "You do not pick it. A prompt the host chose is a prompt the host " +
          "is answering for; a prompt the room drew belongs to the room.",
        say: "Pick one and read it out. That is the prompt and there is no second one.",
        minutes: 2,
        printedPiece: "prompt_cards",
      },
      {
        step: "the_two_rules",
        phase: "opening",
        instruction: "Say the two rules and start the clock.",
        say: "Nothing gets signed. When I call time, put it down and leave the room.",
        minutes: 1,
        printedPiece: "rules_card",
      },
      {
        step: "paint",
        phase: "playing",
        instruction: "Twenty minutes. Call ten, five, and one.",
        detail:
          "Paint yourself. The calls are the only job during the block, and " +
          "a host standing over people with a clipboard makes worse paintings.",
        minutes: 20,
        supplyItem: "A timer",
      },
      {
        step: "clear_the_room",
        phase: "playing",
        instruction:
          "Call time, send everyone out for a drink, and hang the work while they are gone.",
        detail:
          "THIS IS THE STEP THAT MAKES IT ANONYMOUS. Number the back of each " +
          "piece with a sticker, keep the list of numbers on you, and hang " +
          "them out of order. The room will still recognise some of it. That " +
          "is fine — the rule is that nobody says so.",
        say: "Brushes down. Drinks are through there. Nobody comes back until I say.",
        minutes: 6,
      },
      {
        step: "draw_the_explanations",
        phase: "playing",
        instruction:
          "Bring them back and draw numbers for who explains what.",
        detail:
          "Draw in front of everyone, out of the same bowl. If somebody draws " +
          "their own, put it back and draw again — the whole round is that " +
          "nobody explains their own work.",
        say: "You have the piece with this number on it. It is not yours. Take a minute and be certain about it.",
        minutes: 2,
      },
      {
        step: "the_explanations",
        phase: "playing",
        instruction: "One minute each. Cut them off at a minute.",
        detail:
          "Twelve is the most this survives. Above twelve people, draw twelve " +
          "numbers and explain those; everything on the wall is still voted on.",
        minutes: 12,
      },
      {
        step: "the_ballot",
        phase: "deciding",
        instruction: "Hand out the ballots and give them five minutes at the wall.",
        detail:
          "They vote by number, not by name. Nobody may vote for their own, " +
          "which is the one thing on the ballot that runs on honour and the " +
          "one nobody has ever broken.",
        say: "Five categories, one number in each. Not your own.",
        minutes: 5,
        printedPiece: "voting_slips",
      },
      {
        step: "the_count",
        phase: "deciding",
        instruction: "Count them with one other person, out loud, away from the room.",
        detail:
          "Two people and a pen is the whole audit, and it is what lets you " +
          "have painted something yourself. On a tie the title is shared and " +
          "both pieces go into the draw. Do not vote again.",
        minutes: 3,
      },
      {
        step: "the_titles_and_the_draw",
        phase: "ending",
        instruction:
          "Read the five titles, then draw a name for each winning piece.",
        detail:
          "The artist does not hand it over and does not get a say. A name " +
          "drawn for their own piece goes back in the bowl. Draw a name once " +
          "and set it aside, so nobody leaves with two while somebody has none.",
        say: "None of the winners keep their work.",
        minutes: 5,
      },
    ],
    contingencies: [
      {
        trouble: "will_not_play",
        answer:
          "Two people who will not paint are the jury. Give them the ballots " +
          "to hold and the titles to read out at the end. Do not coax anyone " +
          "— a room that watches somebody be talked into it paints worse for " +
          "the next twenty minutes.",
      },
      {
        trouble: "under_minimum",
        answer:
          "Below six, five ballots across five categories elects everything. " +
          "Run it with two titles, Most Beautiful and Best Story, or run " +
          "Fishbowl instead.",
      },
      {
        trouble: "over_size",
        answer:
          "Above twelve, draw twelve numbers to be explained rather than " +
          "explaining all of them. Above twenty, hang the work in two rows " +
          "and vote in one pass down each.",
      },
      {
        trouble: "running_long",
        answer:
          "Cut the number of explanations, never the painting. Six is enough " +
          "to establish that nobody explains their own.",
      },
      {
        trouble: "played_before",
        answer:
          "Somebody who has played knows the twist and will paint something " +
          "she is willing to lose. That is the correct way to play it. Say " +
          "nothing.",
      },
      {
        trouble: "not_landing",
        answer:
          "If the room is quiet through the explanations, stop taking them " +
          "and go to the vote. The vote always works: five questions and a pen.",
      },
    ],
  },

  facets: [
    {
      dimension: "group_fun",
      code: "make_something",
      weight: 1,
      note: "The game this term was missing for. A room of people with paint on their hands.",
    },
    { dimension: "affinity", code: "wit", weight: 0.9 },
    {
      dimension: "group_fun",
      code: "compete",
      weight: 0.8,
      note: "Five categories and a vote. It is a competition with a ballot.",
    },
    {
      dimension: "group_fun",
      code: "keep_a_secret",
      weight: 0.5,
      note:
        "Nothing is signed and nobody may explain their own work. The room " +
        "spends round two not knowing who made what.",
    },
    { dimension: "affinity", code: "one_moment", weight: 0.7 },
    {
      dimension: "group_fun",
      code: "perform",
      weight: 0.6,
      note: "Round two is a minute of standing up and inventing something.",
    },
    {
      dimension: "anti_preference",
      code: "forced_fun",
      weight: 0.6,
      note:
        "Everybody paints. There is no way to sit this one out, which is " +
        "precisely what a host who vetoed forced participation is vetoing.",
    },
    {
      dimension: "anti_preference",
      code: "prep_marathon",
      weight: 0.5,
      note: "Canvases, paint and easels for a room. It is a shopping trip.",
    },
    { dimension: "affinity", code: "beauty", weight: 0.4 },
    { dimension: "anti_preference", code: "surprise_cost", weight: 0.3 },
  ],

  occasions: [
    {
      occasion: "dinner_party",
      fit: "forbidden",
      note: "Twenty minutes of painting is twenty minutes nobody is at the table.",
    },
    {
      occasion: "anniversary",
      fit: "forbidden",
      note: "An anniversary is two people and a quiet room, not a room of twenty with wet paint on it.",
    },
  ],
  slots: [
    { slotCode: "game", fit: "native" },
    { slotCode: "the_moment", fit: "native" },
    { slotCode: "day_material", fit: "native" },
  ],

  supplies: [
    {
      item: "Small canvases or thick paper",
      detail: "One each, and two spare.",
      source: "host_buys",
      perGuest: true,
      leadTimeDays: 7,
    },
    {
      item: "Paint, markers, and something to collage with",
      detail:
        "Acrylics in the primaries and black, a handful of fat markers, and " +
        "a stack of old magazines. Nothing that needs washing out of brushes.",
      source: "host_buys",
      leadTimeDays: 7,
    },
    {
      item: "Numbered voting stickers",
      detail: "A sheet of small round ones, numbered, from a stationer.",
      source: "host_buys",
      leadTimeDays: 3,
      note: "The ballot is printed; the stickers that go on the work are bought.",
    },
    {
      item: "Easels, or a long table and a wall",
      detail: "Masking tape and a clear wall is the version that always works.",
      source: "on_hand",
      note: "The work has to be lookable-at all at once, or round two does not happen.",
    },
    {
      item: "A bowl",
      detail: "For the prompt draw, and then for the names.",
      source: "on_hand",
      quantity: 1,
    },
    {
      item: "A timer",
      detail: "The kitchen one, or a phone face down.",
      source: "on_hand",
    },
  ],
  requirements: [
    { requirement: "table_space", note: "Cleared, and enough for everyone at once." },
    { requirement: "wall_or_easel_space" },
    { requirement: "host_to_run_it", note: "Somebody has to call time and run the vote." },
    { requirement: "printing" },
  ],
  printedMatter: [
    {
      piece: "rules_card",
      label: "The rules",
      description: "Three rounds and the twist, short enough to read aloud.",
      voicePiece: "game_rule",
      quantity: 1,
    },
    {
      piece: "prompt_cards",
      label: "The prompts",
      description:
        "One per round, face down. Written for the destination — this is the " +
        "part a curator authors.",
      voicePiece: "notice",
      quantity: 5,
    },
    {
      piece: "voting_slips",
      label: "The ballot",
      description: "Five categories, one line each.",
      voicePiece: "notice",
      perGuest: true,
    },
  ],
  dependencies: [],
  worlds: [
    {
      world: "westhampton-1976",
      affinity: 0.4,
      note: "Wet paint on a porch in a heat wave. The house would allow it.",
    },
  ],
};

/**
 * REVERSE SCAVENGER HUNT.
 *
 * The inversion is the whole design: nothing is hidden, so the game is not
 * about the house. It is about what you can talk somebody out of.
 */
const REVERSE_SCAVENGER_HUNT: Game = {
  slug: "reverse-scavenger-hunt",
  name: "Reverse Scavenger Hunt",
  description:
    "Nothing is hidden and nothing may be taken. Everything on the list has " +
    "to be given to you.",
  howItWorks:
    "Everyone gets the same list. Forty-five minutes to collect as much of " +
    "it as possible, and the only way to get anything is to persuade " +
    "somebody to hand it over.\n\n" +
    "Nothing may be taken. Negotiating and trading are the game. Anything " +
    "genuinely unusual is worth a bonus at the host's discretion.\n\n" +
    "Highest score at the end wins.",
  materials: "The printed list, a pen each, and a timer.",

  shape: "scheduled",
  sourcing: "provided",
  // CORRECTED against the runbook, which is what db/025's clock is for. The
  // founder's forty-five minutes is the HUNT; it was recorded as the block, and
  // the block also has to hold getting a room of at least ten people to stop
  // talking, scoring the lists, and paying the winner. Fifty-five minutes of
  // that were being planned into an evening that had not been given them.
  durationMinutes: 60,
  durationMaxMinutes: 70,
  minGuests: 10,
  maxGuests: undefined,

  scoring:
    "A business card, 5. A signature, 5. A handwritten compliment, 10. A " +
    "photograph with three strangers, 10. A party hat, 10. A recipe, 15. A " +
    "drawing on a napkin, 15. Somebody singing Happy Birthday to you, 15. A " +
    "foreign coin, 20. A childhood story, 20.",
  currencyLabel: "points",
  sourceNote: HOUSE,
  notes:
    "The forty-five minutes is the hunt and not the block. See the duration " +
    "note above and the runbook, which is where the other twenty went.",

  runbook: {
    hostRole: "runs_it",
    hostNote:
      "You are the referee. You cannot be out negotiating for a foreign coin " +
      "and ruling on one, so do not try to do both.",
    steps: [
      {
        step: "print_the_lists",
        phase: "before",
        instruction: "Print one list per guest and three spare.",
        detail: "People arrive who were not on the list. They still want to play.",
        supplyItem: "The point list",
        printedPiece: "point_list",
      },
      {
        step: "fix_the_bonus",
        phase: "before",
        instruction:
          "Decide the bonus before anyone arrives: ten points, twenty-five at " +
          "the most, and three of them all night.",
        detail:
          "A bonus at the host's discretion with no ceiling is an argument at " +
          "the scoring table. Written down beforehand, it is a ruling.",
      },
      {
        step: "pens_and_a_clock",
        phase: "before",
        instruction: "A pen each, and something that will show the time on a wall.",
        supplyItem: "A pen each",
      },
      {
        step: "call_the_room",
        phase: "opening",
        instruction: "Stop the music, hand out the lists face down, and wait.",
        detail:
          "Face down. A room reading a list is a room that has stopped " +
          "listening, and the two rules are the only part that matters.",
        minutes: 4,
      },
      {
        step: "the_two_rules",
        phase: "opening",
        instruction: "Say the two rules, then say them again.",
        detail:
          "They are counter-intuitive and everyone gets them wrong once. " +
          "Nothing is hidden, and nothing may be taken.",
        say: "Nothing is hidden. Nothing may be taken. Everything on that list has to be given to you, by somebody in this room, in the next forty-five minutes.",
        minutes: 2,
        printedPiece: "rules_card",
      },
      {
        step: "the_hunt",
        phase: "playing",
        instruction: "Forty-five minutes. Call the halfway and the last five.",
        detail:
          "Stay where people can find you and rule on things as they happen. " +
          "A ruling made during the hunt takes ten seconds; the same ruling " +
          "made at the scoring table takes ten minutes and somebody sulks.",
        minutes: 45,
        supplyItem: "A timer",
      },
      {
        step: "score_in_pairs",
        phase: "deciding",
        instruction:
          "Call them in, pair everyone off, and have each person score somebody " +
          "else's list.",
        detail:
          "Never their own, and never their partner's if they hunted together. " +
          "Ten people scoring in pairs takes five minutes; one host scoring " +
          "ten lists takes twenty and the room goes flat.",
        minutes: 8,
      },
      {
        step: "settle_the_bonuses",
        phase: "deciding",
        instruction:
          "Take the three best unusual things to the front and award the bonuses.",
        detail:
          "Out loud, with the object held up. The bonus is worth more as a " +
          "moment than as points, which is why it is capped at three.",
        minutes: 4,
      },
      {
        step: "pay_the_winner",
        phase: "ending",
        instruction: "Read the top three, then pay the winner and stop.",
        detail:
          "Seventy-five Party Bucks where the auction is running, and the most " +
          "ridiculous thing in the house where it is not. On a tie the two " +
          "hold up the strangest thing they got and the room decides by noise. " +
          "It takes forty seconds.",
        minutes: 4,
      },
    ],
    contingencies: [
      {
        trouble: "will_not_play",
        answer:
          "Somebody who will not work the room holds the clock and the bonus " +
          "book. It is a real job, it is visible, and it is the only seat in " +
          "the game.",
      },
      {
        trouble: "under_minimum",
        answer:
          "Under ten the list stops working — a photograph with three " +
          "strangers needs strangers. Cut it to the five lines that do not " +
          "need one, run it for twenty minutes, and do not pretend it is the " +
          "same game.",
      },
      {
        trouble: "over_size",
        answer:
          "Above thirty, score in fours instead of pairs and read out only " +
          "the top three. Everything else scales.",
      },
      {
        trouble: "running_long",
        answer:
          "End the hunt on the number; it is the one thing here that must not " +
          "stretch. Cut the scoring instead — take only the lines worth " +
          "fifteen and twenty.",
      },
      {
        trouble: "played_before",
        answer:
          "Somebody who has played arrives with a foreign coin in her pocket. " +
          "Rule it out before you start: everything has to be got tonight, in " +
          "this room, from somebody who chose to hand it over.",
      },
      {
        trouble: "not_landing",
        answer:
          "If the room has not moved after five minutes, read out what one " +
          "person already has. Nothing starts a scavenger hunt like somebody " +
          "else being ahead.",
      },
    ],
  },

  facets: [
    {
      dimension: "group_fun",
      code: "work_the_room",
      weight: 1,
      note:
        "The inversion IS this term: nothing is hidden and nothing may be " +
        "taken, so the only way to get anything is to talk somebody out of it.",
    },
    {
      dimension: "group_fun",
      code: "compete",
      weight: 1,
      note: "A scored list and a clock. This is the competitive one.",
    },
    {
      dimension: "group_fun",
      code: "play_for_stakes",
      weight: 0.4,
      note: "Scored, and the winner takes seventy-five into the auction.",
    },
    {
      dimension: "anti_preference",
      code: "strangers",
      weight: 0.9,
      note:
        "The mechanism IS a stranger. Six old friends at a long dinner have " +
        "nothing to negotiate for, and a host who said more people than we " +
        "know ruins it has ruled this out correctly.",
    },
    {
      dimension: "group_fun",
      code: "long_dinner",
      weight: -0.8,
      note: "Actively repudiates it. Nobody sits down for forty-five minutes.",
    },
    {
      dimension: "anti_preference",
      code: "forced_fun",
      weight: 0.7,
      note: "You are either working the room or you are losing.",
    },
    { dimension: "affinity", code: "wit", weight: 0.6 },
    { dimension: "affinity", code: "one_moment", weight: 0.5 },
    { dimension: "group_fun", code: "perform", weight: 0.4 },
    {
      dimension: "anti_preference",
      code: "photographed",
      weight: 0.4,
      note: "A photograph with three strangers is on the list.",
    },
    {
      dimension: "group_fun",
      code: "talk_deep",
      weight: -0.4,
      note: "The opposite of settling into a corner with one person.",
    },
  ],

  occasions: [
    {
      occasion: "dinner_party",
      fit: "forbidden",
      note: "Nobody leaves the table, and everyone at it already has each other's business cards.",
    },
    { occasion: "anniversary", fit: "forbidden" },
  ],
  slots: [
    { slotCode: "game", fit: "native" },
    { slotCode: "day_material", fit: "native" },
  ],

  supplies: [
    {
      item: "The point list",
      source: "printed",
      perGuest: true,
      leadTimeDays: 1,
    },
    {
      item: "A pen each",
      detail: "Whatever is in the drawer. They come back chewed.",
      source: "on_hand",
      perGuest: true,
    },
    {
      item: "A timer",
      detail: "Something with a face, where the room can see it.",
      source: "on_hand",
    },
  ],
  requirements: [
    {
      requirement: "mixed_room",
      note: "Half the list is impossible among people who already know each other.",
    },
    { requirement: "floor_space" },
    { requirement: "printing" },
    { requirement: "host_to_run_it", note: "Somebody settles the bonuses." },
  ],
  printedMatter: [
    {
      piece: "point_list",
      label: "The list",
      description: "Ten lines and what each is worth.",
      voicePiece: "notice",
      perGuest: true,
    },
    {
      piece: "rules_card",
      label: "The rules",
      description: "Nothing is taken. Everything is given. Forty-five minutes.",
      voicePiece: "game_rule",
      quantity: 1,
    },
  ],
  dependencies: [],
  worlds: [{ world: "westhampton-1976", affinity: 0.2 }],
};

/**
 * LET'S MAKE A DEAL.
 *
 * A game show with a secondary market in it. The ticket trading is the part
 * that makes the audience play rather than watch.
 */
const LETS_MAKE_A_DEAL: Game = {
  slug: "lets-make-a-deal",
  name: "Let's Make a Deal",
  description:
    "Three doors, one of them holding a potato. The audience can buy their " +
    "way in.",
  howItWorks:
    "Everyone gets a ticket at the door, and earns more by joining anything " +
    "else that happens.\n\n" +
    "A contestant spends tickets to choose. Door A is a real prize. Door B " +
    "is not — a potato, a single sock, a ketchup packet, a fruitcake. Door C " +
    "is a mystery envelope: swap with anyone, double your prize, lose " +
    "everything, steal a prize, or a mystery gift.\n\n" +
    "Before any door opens, the audience may buy and sell tickets from the " +
    "contestant. That market is not a side rule; it is why the room is loud.\n\n" +
    "At the end, anyone may risk everything they hold on one giant mystery " +
    "box.",
  materials:
    "Real prizes and ridiculous ones, three doors or screens, envelopes, and " +
    "one box big enough to be a problem.",

  shape: "scheduled",
  sourcing: "provided",
  // The founder gave no duration for this one. Thirty to forty-five is the
  // planning figure a curator can correct; it is a guess and is recorded as one.
  durationMinutes: 30,
  durationMaxMinutes: 45,
  minGuests: 12,
  maxGuests: undefined,

  scoring:
    "Tickets. One on arrival, more for joining in, and they are spendable " +
    "and tradeable all night.",
  currencyLabel: "tickets",
  sourceNote: HOUSE,
  notes:
    "Duration is inferred, not given. The prize list has been run as: wine, " +
    "a gift certificate and good chocolates behind Door A; a potato, a single " +
    "sock, a ketchup packet and a fruitcake behind Door B. The giant box has " +
    "held premium liquor, cash, an inflatable flamingo, a toilet paper crown " +
    "and a hundred dollars of restaurant.",

  runbook: {
    hostRole: "runs_it",
    hostNote:
      "A compere cannot be a contestant. This is the one game in the pool " +
      "that spends the whole block standing up, and it is the reason it works.",
    steps: [
      {
        step: "load_the_doors",
        phase: "before",
        instruction:
          "Load the three doors before anyone arrives and do not let anyone " +
          "help you.",
        detail:
          "A is real, B is the potato, C is the envelopes. One person who " +
          "knows what is behind B ruins every round.",
        supplyItem: "Three doors, screens, or curtained corners",
      },
      {
        step: "write_the_envelopes",
        phase: "before",
        instruction: "Write the five Door C envelopes and shuffle them.",
        detail:
          "Swap with anyone. Double your prize. Lose everything. Steal a " +
          "prize. A mystery gift. Nothing is written on the outside.",
        printedPiece: "mystery_envelopes",
        supplyItem: "Envelopes",
      },
      {
        step: "hide_the_box",
        phase: "before",
        instruction: "Put the giant box somewhere the room will see it and not reach it.",
        detail:
          "It is the ending, and it works on being visible for an hour first.",
        supplyItem: "The giant mystery box, and what goes in it",
      },
      {
        step: "tickets_at_the_door",
        phase: "before",
        instruction: "One ticket per guest at the door, and more all evening.",
        detail:
          "Hand them out for joining anything — a toast, a photograph, the " +
          "washing up. The market later is only as loud as the number of " +
          "tickets in the room.",
        printedPiece: "tickets",
      },
      {
        step: "call_the_room",
        phase: "opening",
        instruction: "Stand in front of the doors and start naming them.",
        detail:
          "You do not need to ask for quiet. A host standing in front of " +
          "three curtained corners pointing at them is the whole invitation.",
        say: "Door A. Door B. Door C. One of these is worth having and I am the only person who knows which.",
        minutes: 4,
        printedPiece: "door_cards",
      },
      {
        step: "the_market_opens",
        phase: "opening",
        instruction: "Say how the market works before the first door opens.",
        detail:
          "The audience may buy and sell tickets from the contestant, for " +
          "sixty seconds, and then you call it closed. It is not a side rule; " +
          "it is why the room is loud.",
        say: "Sixty seconds. Buy from her, sell to her, and every deal goes through me.",
        printedPiece: "rules_card",
      },
      {
        step: "round_one",
        phase: "playing",
        instruction:
          "Draw a name for the contestant, open the market, then open the door.",
        detail:
          "DRAW, do not take volunteers. The same three people volunteer for " +
          "everything and the fourth round is where the room goes quiet. Run " +
          "the first one slowly — everybody is learning the market by watching it.",
        minutes: 8,
      },
      {
        step: "the_rest_of_the_rounds",
        phase: "playing",
        instruction: "Three more rounds, faster each time.",
        detail:
          "Cut the talking and not the market. By round three the audience is " +
          "running the market without you and you can just open doors.",
        minutes: 18,
      },
      {
        step: "settling_a_trade",
        phase: "deciding",
        instruction:
          "Nothing is counted. What people hold at the end, they hold.",
        detail:
          "There is no tally in this game — the tickets are the score and they " +
          "are in people's hands. You are the only clearing house: a trade is " +
          "done when you say it is done, and nothing settles after a door has " +
          "opened.",
      },
      {
        step: "the_box",
        phase: "ending",
        instruction:
          "Offer the giant box to anyone who will risk everything they hold.",
        detail:
          "Everything: tickets, prizes, the fruitcake. Take the first person " +
          "who says yes and open it in front of them. Then stop — the box is " +
          "the ending and there is nothing after it.",
        say: "One box. Everything you are holding. Anybody.",
        minutes: 6,
      },
    ],
    contingencies: [
      {
        trouble: "will_not_play",
        answer:
          "Nobody has to be a contestant. The audience is the better half of " +
          "this game and the market is where the noise comes from — a person " +
          "who never goes near a door can still end the night holding forty " +
          "tickets.",
      },
      {
        trouble: "under_minimum",
        answer:
          "Under twelve the market is four people and the room goes quiet " +
          "between doors. Run two contestants and go straight to the box.",
      },
      {
        trouble: "over_size",
        answer:
          "Above thirty, stand on something and hand the tickets out in " +
          "advance. Nothing else changes.",
      },
      {
        trouble: "running_long",
        answer: "Cut contestants, never the box. The box is the ending.",
      },
      {
        trouble: "played_before",
        answer:
          "Somebody who has played knows Door B is a potato. Change what is " +
          "behind it — a single sock is not a potato, and the specificity is " +
          "the joke.",
      },
      {
        trouble: "not_landing",
        answer:
          "If the market is silent, do not explain it again. Buy a ticket " +
          "yourself, loudly, for far too much.",
      },
    ],
  },

  facets: [
    {
      dimension: "group_fun",
      code: "play_for_stakes",
      weight: 1,
      note:
        "Three doors, a real prize behind one, and a final gamble of " +
        "everything held on one box. It is the term itself.",
    },
    { dimension: "group_fun", code: "compete", weight: 0.9 },
    {
      dimension: "group_fun",
      code: "work_the_room",
      weight: 0.6,
      note:
        "The ticket market. The audience buying and selling from the " +
        "contestant before a door opens is why the room is loud.",
    },
    {
      dimension: "anti_preference",
      code: "novelty",
      weight: 0.8,
      note:
        "A toilet paper crown and an inflatable flamingo. This is novelty on " +
        "purpose, and a host who ruled out novelty props has ruled this out.",
    },
    { dimension: "affinity", code: "one_moment", weight: 0.8 },
    { dimension: "group_fun", code: "perform", weight: 0.7 },
    { dimension: "affinity", code: "wit", weight: 0.7 },
    {
      dimension: "anti_preference",
      code: "surprise_cost",
      weight: 0.6,
      note: "The real prizes are real money.",
    },
    { dimension: "anti_preference", code: "forced_fun", weight: 0.4 },
    { dimension: "anti_preference", code: "kids_party", weight: 0.35 },
    { dimension: "affinity", code: "late", weight: 0.3 },
  ],

  occasions: [
    { occasion: "anniversary", fit: "forbidden" },
    {
      occasion: "getaway",
      fit: "forbidden",
      note: "A getaway is three unscheduled days. A game show is the most scheduled thing in this pool.",
    },
  ],
  slots: [
    { slotCode: "game", fit: "native" },
    { slotCode: "the_moment", fit: "native" },
    { slotCode: "day_material", fit: "native" },
  ],

  supplies: [
    {
      item: "The real prizes",
      detail: "Wine, a gift certificate, good chocolates.",
      source: "host_buys",
      leadTimeDays: 7,
    },
    {
      item: "The ridiculous prizes",
      detail: "A potato, a single sock, a ketchup packet, a fruitcake.",
      source: "host_buys",
      leadTimeDays: 3,
      note: "Cheap, and the half the room will remember.",
    },
    {
      item: "The giant mystery box, and what goes in it",
      source: "host_buys",
      quantity: 1,
      leadTimeDays: 7,
    },
    { item: "Envelopes", source: "host_buys", quantity: 5, leadTimeDays: 2 },
    {
      item: "Three doors, screens, or curtained corners",
      source: "on_hand",
      quantity: 3,
    },
  ],
  requirements: [
    { requirement: "host_to_run_it", note: "This one genuinely needs a compere." },
    { requirement: "prizes" },
    { requirement: "floor_space" },
    { requirement: "printing" },
  ],
  printedMatter: [
    {
      piece: "tickets",
      label: "The tickets",
      description: "The currency. Handed out at the door and traded all night.",
      voicePiece: "notice",
      perGuest: true,
    },
    {
      piece: "door_cards",
      label: "Door A, Door B, Door C",
      description: "One card per door, large enough to be read across a room.",
      voicePiece: "heading",
      quantity: 3,
    },
    {
      piece: "mystery_envelopes",
      label: "The Door C envelopes",
      description:
        "Swap with anyone. Double your prize. Lose everything. Steal a prize. " +
        "A mystery gift.",
      voicePiece: "notice",
      quantity: 5,
    },
    {
      piece: "rules_card",
      label: "The rules",
      description: "Three doors, the market, and the final gamble.",
      voicePiece: "game_rule",
      quantity: 1,
    },
  ],
  dependencies: [],
  worlds: [
    {
      world: "westhampton-1976",
      affinity: -0.5,
      note:
        "The house is a card left on the hall table by somebody who has gone " +
        "to bed. It does not have a compere.",
    },
  ],
};

/**
 * SECRET GAME CARDS — the ambient one.
 *
 * The only game in the pool that costs the evening nothing. Everyone is playing
 * from the door; nobody has stopped doing anything else. That is what `ambient`
 * means in db/010 and this is the game the distinction was written for.
 */
const SECRET_GAME_CARDS: Game = {
  slug: "secret-game-cards",
  name: "Secret Game Cards",
  description:
    "One card each, at the door. Nobody says what is on theirs, and " +
    "everybody spends the night wondering.",
  howItWorks:
    "Every guest draws one card on arrival and must complete it without " +
    "telling anyone what it says.\n\n" +
    "The easy ones: three selfies with strangers. Get complimented on your " +
    "outfit. Get somebody to tell you a childhood story. Make five people " +
    "laugh. Teach somebody a dance move.\n\n" +
    "The middling ones: have somebody introduce you to a stranger. Start a " +
    "group photo. Get somebody to toast with you. Have somebody draw you in " +
    "thirty seconds. Get two people arguing about pineapple on pizza.\n\n" +
    "The hard ones: convince somebody you once met a celebrity. Get four " +
    "strangers chanting your name. Get a dramatic reading of a cocktail " +
    "menu. Start a conga line. Get six people into one photograph.\n\n" +
    "Wicked cards are mixed into the deck and are not marked: trade cards " +
    "with somebody without either of you speaking. Give away a drink ticket. " +
    "Lose everything you have completed unless you persuade somebody to lie " +
    "for you. Make somebody else do your challenge. Swap scorecards.",
  materials: "The deck, a scorecard each, and something to draw from.",

  shape: "ambient",
  sourcing: "provided",
  // No duration, by construction. See db/010's game_ambient_has_no_duration.
  minGuests: 10,
  maxGuests: undefined,

  scoring: "Twenty Party Bucks for every card completed, spendable at the auction.",
  currencyLabel: "Party Bucks",
  sourceNote: HOUSE,
  notes:
    "The wicked cards are the design. Without them the deck is a list of " +
    "chores; with them, half the room is quietly being sabotaged.",

  runbook: {
    hostRole: "plays_too",
    hostNote:
      "You draw one at the door like everybody else. A host holding the only " +
      "card nobody wonders about is the one person not playing.",
    steps: [
      {
        step: "read_the_deck",
        phase: "before",
        instruction: "Read the whole deck yourself, including the wicked ones.",
        detail:
          "Take out anything that will not survive this particular room. You " +
          "are the only person who will ever see all of it, and a card that " +
          "lands badly at eleven cannot be taken back.",
        printedPiece: "the_deck",
      },
      {
        step: "the_bowl_at_the_door",
        phase: "before",
        instruction:
          "Put the deck face down in a bowl by the door, with the scorecards beside it.",
        detail:
          "By the door, not on the table. A card handed over at the moment " +
          "somebody arrives is a card they carry all night; a card found at " +
          "half past ten is a chore.",
        supplyItem: "A bowl or a hat to draw from",
        printedPiece: "scorecards",
      },
      {
        step: "one_each_at_the_door",
        phase: "opening",
        instruction: "One card each, drawn face down, as people come in.",
        detail:
          "Nine words and then let them past. This is not a briefing and the " +
          "deck does not need one.",
        say: "Take one. Don't read it out. It's yours all night.",
      },
      {
        step: "nobody_says",
        phase: "underway",
        instruction: "Nobody says what is on theirs. There is no enforcement and none is needed.",
        detail:
          "The secret is the game — take it out and the deck is a list of " +
          "chores. The only thing that keeps it is that telling somebody is " +
          "obviously worse than not.",
      },
      {
        step: "mark_your_own",
        phase: "underway",
        instruction: "A completed card is marked by the guest, on their own scorecard.",
        detail:
          "You do not audit this and you do not ask for proof. Somebody who " +
          "lies about a conga line has done more work than somebody who told " +
          "the truth about a compliment.",
      },
      {
        step: "the_wicked_ones",
        phase: "underway",
        instruction: "Say nothing about the wicked cards, ever.",
        detail:
          "They are not marked and they are not announced. Somebody being " +
          "made to swap scorecards in the middle of the kitchen is the whole " +
          "design working, and explaining it beforehand removes it.",
      },
      {
        step: "ask_once",
        phase: "underway",
        instruction: "Around the middle of the night, ask one person out loud how theirs is going.",
        detail:
          "The single failure mode of an ambient game is being forgotten. One " +
          "question, in front of other people, restarts the whole deck.",
      },
      {
        step: "twenty_a_card",
        phase: "deciding",
        instruction: "Twenty Party Bucks a card, counted by the guest, at the auction.",
        detail:
          "Not before. A deck counted at nine o'clock is a scoreboard, and a " +
          "scoreboard makes people stop doing the hard ones.",
        printedPiece: "scorecards",
      },
      {
        step: "read_them_out",
        phase: "ending",
        instruction:
          "Where there is no auction, end it near midnight: everyone reads their card out.",
        detail:
          "Going round the room, out loud. It is the only time the deck is " +
          "ever heard, and half of it is people discovering what was being " +
          "done to them all night.",
        say: "Everybody read yours out. We'll work out who managed it.",
      },
    ],
    contingencies: [
      {
        trouble: "will_not_play",
        answer:
          "A card can be refused at the door and the deck does not notice. Do " +
          "not offer a second one and do not explain what they are missing.",
      },
      {
        trouble: "under_minimum",
        answer:
          "Under ten the hard cards are impossible — four strangers chanting " +
          "your name needs four strangers. Deal only the easy and the middling " +
          "ones and leave the wicked cards in.",
      },
      {
        trouble: "over_size",
        answer: "Print more. Nothing else about it changes with the room.",
      },
      {
        trouble: "running_long",
        answer:
          "It cannot run long; it runs as long as the evening. What it can do " +
          "is be forgotten, which is what the question in the middle of the " +
          "night is for.",
      },
      {
        trouble: "played_before",
        answer:
          "Somebody who has played will recognise a wicked card on sight. " +
          "Deal her one — they are better in the hands of a person who knows " +
          "exactly what she is holding.",
      },
      {
        trouble: "not_landing",
        answer:
          "If nobody is doing them by the second hour, complete one of yours " +
          "visibly and badly. It gives the room permission, which is the only " +
          "thing it was waiting for.",
      },
    ],
  },

  facets: [
    {
      dimension: "group_fun",
      code: "keep_a_secret",
      weight: 1,
      note:
        "One card each and nobody says what is on theirs. Take the secret out " +
        "and the deck is a list of chores.",
    },
    { dimension: "affinity", code: "wit", weight: 1 },
    {
      dimension: "group_fun",
      code: "work_the_room",
      weight: 0.9,
      note:
        "Convince somebody you met a celebrity; get four strangers chanting " +
        "your name; persuade somebody to lie for you.",
    },
    {
      dimension: "group_fun",
      code: "perform",
      weight: 0.9,
      note: "A conga line and four strangers chanting your name.",
    },
    {
      dimension: "group_fun",
      code: "play_for_stakes",
      weight: 0.5,
      note: "Twenty Party Bucks a card, and a wicked card can take the lot.",
    },
    {
      dimension: "anti_preference",
      code: "photographed",
      weight: 0.8,
      note:
        "Three selfies, a group photo, six people in one frame. A host who " +
        "said being photographed all night ruins it has ruled this out, and " +
        "she is right.",
    },
    {
      dimension: "anti_preference",
      code: "strangers",
      weight: 0.8,
      note: "Most of the deck needs somebody you have not met.",
    },
    { dimension: "affinity", code: "one_moment", weight: 0.6 },
    { dimension: "group_fun", code: "dance", weight: 0.5 },
    { dimension: "anti_preference", code: "forced_fun", weight: 0.5 },
    { dimension: "group_fun", code: "compete", weight: 0.4 },
    { dimension: "group_fun", code: "toast", weight: 0.4 },
    { dimension: "affinity", code: "late", weight: 0.3 },
  ],

  occasions: [
    {
      occasion: "dinner_party",
      fit: "forbidden",
      note: "There is no underneath at one table. Everyone is already in the only conversation.",
    },
    { occasion: "anniversary", fit: "forbidden" },
  ],
  slots: [
    {
      slotCode: "ambient_game",
      fit: "native",
      note: "The only slot it can fill, and the only shape that slot accepts.",
    },
  ],

  supplies: [
    { item: "The deck", source: "printed", perGuest: true, leadTimeDays: 2 },
    { item: "A bowl or a hat to draw from", source: "on_hand", quantity: 1 },
  ],
  requirements: [
    { requirement: "mixed_room" },
    { requirement: "floor_space" },
    { requirement: "printing" },
  ],
  printedMatter: [
    {
      piece: "the_deck",
      label: "The deck",
      description:
        "One card per guest, drawn at the door. Easy, middling, hard, and the " +
        "wicked ones mixed in unmarked.",
      voicePiece: "game_rule",
      perGuest: true,
    },
    {
      piece: "scorecards",
      label: "The scorecards",
      description:
        "What you have completed. A wicked card can make somebody swap theirs " +
        "with yours, so they have to be real objects.",
      voicePiece: "notice",
      perGuest: true,
    },
  ],
  dependencies: [],
  worlds: [],
};

/**
 * THE SECRET AUCTION — the finale.
 *
 * The founder's reason for it, in her words: currency rather than raffle
 * tickets, so guests who won nothing stay competitive. That is a real design
 * decision and the whole argument for a finale as a shape.
 */
const THE_SECRET_AUCTION: Game = {
  slug: "the-secret-auction",
  name: "The Secret Auction",
  description:
    "Nobody knows what is for sale until the end. Everyone has been earning " +
    "the money for it all night without being told what it buys.",
  howItWorks:
    "Party Bucks are earned across the whole evening and nobody is shown the " +
    "lots until the auction opens.\n\n" +
    "What has gone under the hammer: good wine, restaurant gift cards, " +
    "trophies that are jokes, the artwork made earlier in the night, mystery " +
    "boxes, and a Golden Ticket — an automatic win in the first game of next " +
    "year.\n\n" +
    "It is a currency and not a raffle, which is the point: a guest who has " +
    "won nothing all evening still has money and is still in it at midnight.",
  materials:
    "The lots, the printed money, and something to bang on a table with.",

  shape: "finale",
  sourcing: "provided",
  // Not given by the founder. Half an hour is the planning figure.
  durationMinutes: 30,
  durationMaxMinutes: 45,
  minGuests: 12,
  maxGuests: undefined,

  scoring:
    "Fifty for winning the art battle. Seventy-five for winning the " +
    "scavenger hunt. Twenty for every secret card completed. Whatever Let's " +
    "Make a Deal paid out. And ten to thirty at the host's discretion, for " +
    "party spirit.",
  currencyLabel: "Party Bucks",
  sourceNote: HOUSE,
  notes:
    "Duration is inferred, not given. The Golden Ticket is the one lot that " +
    "reaches into next year, and it is the reason the auction is a ritual " +
    "rather than a prize-giving.",

  /**
   * The machinery is real and most of it happens before the block starts: a
   * currency paid out across four hours, a dependency on whichever earning
   * games ran, and one lot that only means anything if there is a next year.
   * The `underway` phase exists in db/025 for this game.
   */
  runbook: {
    hostRole: "runs_it",
    hostNote:
      "You are the auctioneer and the bank for the whole block. Neither job " +
      "can be done while bidding, and the bank is the one that cannot be " +
      "faked.",
    steps: [
      {
        step: "check_the_money_exists",
        phase: "before",
        instruction:
          "Check that at least one of the earning games is actually running tonight.",
        detail:
          "The secret cards, the art battle, the scavenger hunt, or the game " +
          "show. Any one of them is enough. Without one there is nothing to " +
          "spend, and this is a prize-giving with extra steps.",
      },
      {
        step: "write_the_rate",
        phase: "before",
        instruction: "Write the rate down and put it in your pocket.",
        detail:
          "Fifty for winning the art battle. Seventy-five for the scavenger " +
          "hunt. Twenty a card. Whatever the game show paid out. Ten to thirty " +
          "for party spirit, at your discretion. A rate remembered is a rate " +
          "argued about at midnight.",
      },
      {
        step: "hide_the_lots",
        phase: "before",
        instruction:
          "Choose the lots, put them in order, and cover them with a sheet.",
        detail:
          "Nobody sees a lot before the auction opens; that is the whole trick " +
          "and it is the only rule of this game that cannot be recovered from. " +
          "Order them: something small and stupid first, the Golden Ticket " +
          "second to last, the best thing last.",
        supplyItem: "The real lots",
        printedPiece: "the_lot_list",
      },
      {
        step: "the_artwork_as_lots",
        phase: "before",
        instruction:
          "If the art battle ran, the pieces nobody won go under the hammer.",
        detail:
          "Only those. The five that won titles are already somebody else's, " +
          "given away at random an hour ago, and taking them back would undo " +
          "the best thing that happened all night.",
      },
      {
        step: "decide_about_next_year",
        phase: "before",
        instruction:
          "Decide whether there is a next year before you print the Golden Ticket.",
        detail:
          "It buys an automatic win in the first game of next year's party. " +
          "Name that game on the ticket, or it is an argument in twelve " +
          "months. If there is no next year, leave it out — a ticket to " +
          "nothing is the one lot that can make the whole currency look silly.",
        printedPiece: "golden_ticket",
      },
      {
        step: "pay_in_cash",
        phase: "underway",
        instruction:
          "Pay Party Bucks on the spot, all night, out of your own pocket.",
        detail:
          "Never a tally, never settled later. The stack stays on you and not " +
          "on a table. A guest holding money she can feel plays differently " +
          "from a guest who has been told a number.",
        printedPiece: "party_bucks",
      },
      {
        step: "pay_for_spirit",
        phase: "underway",
        instruction:
          "Pay ten to thirty for party spirit, and do it where people can see.",
        detail:
          "This is the mechanism that keeps a guest who has won nothing in " +
          "the room at midnight, and it only works in public. Paid quietly it " +
          "is charity; paid out loud it is a title.",
      },
      {
        step: "call_the_room",
        phase: "opening",
        instruction:
          "Stand on something, bang the table twice, and wait for the second silence.",
        detail:
          "The first silence is people stopping. The second is people turning " +
          "round. An auction is the one game here that comes with the right " +
          "instrument for this.",
        minutes: 2,
        supplyItem: "Something to bang on a table with",
      },
      {
        step: "the_reveal",
        phase: "opening",
        instruction: "Take the sheet off and say what the money was for.",
        detail:
          "This is the reveal and it only happens once. Say it flat. The room " +
          "has been earning a currency all night without being told what it " +
          "buys, and the objects do the work.",
        say: "Everything you have been paid tonight is spendable, once, on this table. Nothing here goes home with me.",
        minutes: 3,
        printedPiece: "bidding_paddles",
      },
      {
        step: "the_first_lot",
        phase: "playing",
        instruction: "Sell something small and stupid first.",
        detail:
          "The first lot teaches the room how to bid and what its money is " +
          "worth. Spend it on a trophy nobody needs; a room that overpays for " +
          "a joke has understood the currency.",
        minutes: 4,
        supplyItem: "The trophies",
      },
      {
        step: "the_middle",
        phase: "playing",
        instruction: "Work through the middle lots, and take the money before the lot leaves your hand.",
        detail:
          "Every time, no exceptions. It is the one rule that stops the last " +
          "twenty minutes of the night becoming an accounting dispute.",
        minutes: 14,
        supplyItem: "Mystery boxes",
      },
      {
        step: "the_golden_ticket",
        phase: "playing",
        instruction: "Sell the Golden Ticket second to last.",
        detail:
          "Say what it is, once, and then say nothing. It is the only lot that " +
          "reaches into next year and it should be the most expensive thing " +
          "in the room.",
        minutes: 4,
        printedPiece: "golden_ticket",
      },
      {
        step: "how_a_bid_is_settled",
        phase: "deciding",
        instruction: "Highest paddle. You count three and it is done.",
        detail:
          "There are no ties at an auction — two people shouting the same " +
          "number keep going up. If two paddles genuinely land together, take " +
          "the one you heard first and mean it. Nobody has ever gone back over " +
          "an auctioneer who sounded certain.",
        printedPiece: "rules_card",
      },
      {
        step: "the_last_lot",
        phase: "ending",
        instruction: "Sell the best thing last, then stop and do not fill the silence.",
        detail:
          "The gavel is the end of the night. Anything after it — a speech, a " +
          "round of thanks, one more lot somebody found — is the evening " +
          "ending twice, which means it did not end the first time.",
        say: "That's the last one. Spend what's left on each other.",
        minutes: 5,
      },
    ],
    contingencies: [
      {
        trouble: "will_not_play",
        answer:
          "Somebody who does not want to bid can be the bank: they take the " +
          "money and hand over the lot, and you never touch either. It is the " +
          "best seat in the game and it is worth offering before anyone asks.",
      },
      {
        trouble: "under_minimum",
        answer:
          "Under twelve there is not enough money in the room and the lots go " +
          "for nothing. Halve the number of lots rather than the prices — a " +
          "short auction where things went for everything somebody had is the " +
          "same evening.",
      },
      {
        trouble: "over_size",
        answer:
          "Above thirty, sell some lots in pairs — two of a thing, both to the " +
          "top two bids — or half the room never wins anything and leaves.",
      },
      {
        trouble: "running_long",
        answer:
          "Cut lots out of the middle. Never the Golden Ticket and never the " +
          "last one; those are the ending and the reason for next year.",
      },
      {
        trouble: "played_before",
        answer:
          "Somebody holding last year's Golden Ticket redeems it in the first " +
          "game of tonight, not here. Ask at the door whether anyone has one — " +
          "a ticket nobody remembers is a ticket that was not worth printing.",
      },
      {
        trouble: "not_landing",
        answer:
          "If the bidding is flat, stop describing the lot. An auctioneer " +
          "explaining what something is has already lost the room. Say a " +
          "number and wait.",
      },
    ],
  },

  facets: [
    {
      dimension: "group_fun",
      code: "play_for_stakes",
      weight: 1,
      note:
        "A currency and not a raffle, spent on lots nobody has seen. The " +
        "founder's own reason for the game is this term.",
    },
    { dimension: "group_fun", code: "compete", weight: 1 },
    { dimension: "affinity", code: "one_moment", weight: 0.9 },
    {
      dimension: "affinity",
      code: "ritual",
      weight: 0.7,
      note: "The Golden Ticket is an automatic win in next year's first game. It only means anything if there is a next year.",
    },
    { dimension: "anti_preference", code: "surprise_cost", weight: 0.7 },
    { dimension: "affinity", code: "late", weight: 0.6 },
    { dimension: "affinity", code: "wit", weight: 0.6 },
    { dimension: "group_fun", code: "perform", weight: 0.5 },
    { dimension: "anti_preference", code: "forced_fun", weight: 0.3 },
  ],

  occasions: [
    {
      occasion: "dinner_party",
      fit: "forbidden",
      note: "A long dinner ends with dessert at midnight, which is the opposite of an auction.",
    },
    { occasion: "anniversary", fit: "forbidden" },
    {
      occasion: "getaway",
      fit: "forbidden",
      note: "The occasion that most resists being decorated. See db/009.",
    },
  ],
  slots: [
    {
      slotCode: "finale",
      fit: "native",
      note: "There is at most one ending. An evening that ends twice did not end the first time.",
    },
  ],

  supplies: [
    {
      item: "The real lots",
      detail: "Wine, restaurant gift cards, one thing worth wanting.",
      source: "host_buys",
      leadTimeDays: 7,
    },
    {
      item: "The trophies",
      detail: "Jokes, and the more specific the better.",
      source: "host_buys",
      leadTimeDays: 7,
    },
    { item: "Mystery boxes", source: "host_buys", leadTimeDays: 3 },
    { item: "Something to bang on a table with", source: "on_hand", quantity: 1 },
  ],
  requirements: [
    { requirement: "host_to_run_it", note: "An auctioneer. It does not run itself." },
    { requirement: "prizes" },
    { requirement: "floor_space" },
    { requirement: "printing" },
  ],
  printedMatter: [
    {
      piece: "party_bucks",
      label: "Party Bucks",
      description:
        "The currency, printed in the destination's own face. A stack of them.",
      voicePiece: "notice",
    },
    {
      piece: "the_lot_list",
      label: "The lots",
      description: "Face down until the auction opens. That is the whole trick.",
      voicePiece: "heading",
      quantity: 1,
    },
    {
      piece: "golden_ticket",
      label: "The Golden Ticket",
      description: "An automatic win in the first game of next year. One only.",
      voicePiece: "notice",
      quantity: 1,
    },
    {
      piece: "bidding_paddles",
      label: "The paddles",
      description: "Numbered, one each.",
      voicePiece: "place_card",
      perGuest: true,
    },
    {
      piece: "rules_card",
      label: "The rules",
      description: "What the money was for, and what it buys.",
      voicePiece: "game_rule",
      quantity: 1,
    },
  ],

  // Any ONE of these satisfies it — see the any-of note in db/010. The auction
  // needs guests to have earned something, not all four earning games.
  dependencies: [
    {
      requires: "secret-game-cards",
      strength: "required",
      groupKey: "earning",
      note: "Twenty a card, and the deck runs underneath everything else, so it costs the evening nothing.",
    },
    {
      requires: "art-battle",
      strength: "required",
      groupKey: "earning",
      note: "Fifty to the winner, and the artwork itself becomes a lot.",
    },
    {
      requires: "reverse-scavenger-hunt",
      strength: "required",
      groupKey: "earning",
      note: "Seventy-five to the winner. The largest single payout of the night.",
    },
    {
      requires: "lets-make-a-deal",
      strength: "required",
      groupKey: "earning",
      note: "Pays out variably, which is what keeps the ticket market honest.",
    },
  ],
  worlds: [
    {
      world: "westhampton-1976",
      affinity: -0.3,
      note: "The house does not announce things. An auction is entirely announcement.",
    },
  ],
};

/**
 * FISHBOWL.
 *
 * A folk game. The noun game, Salad Bowl, Celebrity — nobody owns it and
 * nobody ever has, which is exactly why the house may set it in a
 * destination's own typeface and hand it over as a real object.
 *
 * It is also the one game in this pool that is right for a long dinner: it
 * works at a table, at six people, with a bowl and a pen.
 */
const FISHBOWL: Game = {
  slug: "fishbowl",
  name: "Fishbowl",
  description:
    "Everyone writes names into a bowl, and then the same slips get harder " +
    "three times over.",
  howItWorks:
    "Everybody writes a few names or nouns on slips and folds them into the " +
    "bowl. Two teams.\n\n" +
    "First round, you may say anything except the word itself. Second round, " +
    "same slips, and you may only act it out. Third round, same slips again, " +
    "and you get one word.\n\n" +
    "The third round is funny because of the first two. That is the whole " +
    "design and it is why the slips must not be replaced between rounds.",
  materials: "Paper, a bowl, a pen each, a timer.",

  shape: "scheduled",
  sourcing: "provided",
  durationMinutes: 30,
  durationMaxMinutes: 45,
  minGuests: 6,
  maxGuests: 30,

  scoring: "Each team keeps the slips it guesses. Most slips at the end wins.",
  sourceNote:
    "Folk game. No owner, no rights, no attribution owed — which is why it " +
    "may be printed. Known as the noun game, Salad Bowl, Celebrity and a " +
    "dozen other names.",

  runbook: {
    hostRole: "plays_too",
    hostNote:
      "You are on a team. The only job that is yours is starting the clock, " +
      "and the other team will do that for you once it is going.",
    steps: [
      {
        step: "slips_and_bowl",
        phase: "before",
        instruction: "Six slips and a pen at every place, and the bowl in the middle.",
        detail:
          "Six is the number. Four and the third round is over before it is " +
          "funny; ten and the first round never ends.",
        supplyItem: "Slips of paper",
        printedPiece: "slip_sheets",
      },
      {
        step: "make_the_teams",
        phase: "opening",
        instruction: "Count off round the table, one two one two. Do not let people pick.",
        detail:
          "Couples on opposite teams. A room that picks its own teams picks " +
          "the same teams it already talks to.",
        minutes: 3,
      },
      {
        step: "everyone_writes",
        phase: "opening",
        instruction: "Six each, folded, into the bowl.",
        detail:
          "Anything somebody in this room could guess. Say that out loud — it " +
          "is the only thing that keeps the bowl playable, and it is the fix " +
          "for a first round that dies.",
        say: "Six each. Anything a person at this table could guess. Fold them in half.",
        minutes: 6,
        supplyItem: "A bowl",
        printedPiece: "bowl_label",
      },
      {
        step: "round_one",
        phase: "playing",
        instruction: "Say anything except the word. A minute a turn, alternating teams.",
        detail:
          "Guessed slips are kept by the guessing team. Keep going until the " +
          "bowl is empty, then refill it with the SAME slips.",
        minutes: 10,
        printedPiece: "rules_card",
      },
      {
        step: "round_two",
        phase: "playing",
        instruction: "Same slips. Act it out, no words.",
        detail:
          "It is faster than round one because everybody now half-remembers " +
          "what is in the bowl. That is the design, not an accident.",
        minutes: 8,
      },
      {
        step: "round_three",
        phase: "playing",
        instruction: "Same slips. One word each.",
        detail:
          "The third round is funny because of the first two, which is why the " +
          "slips must never be replaced between them.",
        minutes: 7,
      },
      {
        step: "count_the_slips",
        phase: "deciding",
        instruction: "Each team counts the slips it kept. Most slips wins.",
        detail:
          "Count once, out loud. If it is still tied it is tied, and a tie is " +
          "the correct result of Fishbowl.",
        minutes: 2,
      },
      {
        step: "the_last_slip",
        phase: "ending",
        instruction: "Read out the worst slip anybody wrote, then put the bowl away.",
        detail:
          "There is always one nobody could get in any round. It is the ending " +
          "and it costs two minutes.",
        minutes: 2,
      },
    ],
    contingencies: [
      {
        trouble: "will_not_play",
        answer:
          "Somebody can write slips and never take a turn. They still count " +
          "for their team, and nobody at the table has to be told.",
      },
      {
        trouble: "under_minimum",
        answer:
          "Under six it is two against two and the same person clues every " +
          "round. Play it anyway with four slips each — it is the one game " +
          "here that survives being too small.",
      },
      {
        trouble: "over_size",
        answer:
          "Above thirty the wait between turns is longer than the turns. " +
          "Split into four teams and run two bowls at two ends of the room.",
      },
      {
        trouble: "odd_number",
        answer: "The extra player goes to the team that goes second.",
      },
      {
        trouble: "running_long",
        answer:
          "Three rounds is the design and none may be cut. Cut the bowl " +
          "instead: take half the slips out before round one starts.",
      },
      {
        trouble: "played_before",
        answer:
          "Everybody has played this and it is no advantage. The slips are " +
          "new every time and they are written by the room.",
      },
      {
        trouble: "not_landing",
        answer:
          "It always lands by round two. A flat first round means the slips " +
          "are too hard — take out anything nobody has heard of before you " +
          "refill the bowl.",
      },
    ],
  },

  facets: [
    { dimension: "group_fun", code: "perform", weight: 0.9 },
    { dimension: "affinity", code: "wit", weight: 0.8 },
    { dimension: "group_fun", code: "compete", weight: 0.8 },
    {
      dimension: "anti_preference",
      code: "prep_marathon",
      weight: -0.8,
      note:
        "Actively repudiates it. Paper, a bowl, a pen. This is the game to " +
        "reach for when a host said a project plan the day before ruins it.",
    },
    {
      dimension: "affinity",
      code: "ease",
      weight: 0.7,
      note: "Nothing to buy and nothing to explain twice.",
    },
    {
      dimension: "group_fun",
      code: "long_dinner",
      weight: 0.6,
      note: "It works at the table, with everyone still sitting down.",
    },
    { dimension: "anti_preference", code: "forced_fun", weight: 0.4 },
    { dimension: "affinity", code: "one_moment", weight: 0.4 },
    { dimension: "affinity", code: "ritual", weight: 0.3 },
  ],

  // No occasion rows at all. It makes no claim, which db/009's rule reads as
  // eligible everywhere — and it genuinely is.
  occasions: [],
  slots: [
    { slotCode: "game", fit: "native" },
    { slotCode: "the_moment", fit: "native" },
    { slotCode: "day_material", fit: "native" },
  ],

  supplies: [
    { item: "Slips of paper", source: "printed", perGuest: true, leadTimeDays: 1 },
    { item: "A bowl", source: "on_hand", quantity: 1 },
    { item: "A pen each", source: "on_hand", perGuest: true },
    { item: "A timer", source: "on_hand" },
  ],
  requirements: [
    { requirement: "table_space" },
    { requirement: "printing", note: "Slips and a bowl label. An hour and a printer." },
  ],
  printedMatter: [
    {
      piece: "slip_sheets",
      label: "The slips",
      description: "Perforated, in the destination's face. Six to a guest.",
      voicePiece: "notice",
      perGuest: true,
    },
    {
      piece: "bowl_label",
      label: "The bowl",
      description: "A label for whatever the bowl actually is.",
      voicePiece: "heading",
      quantity: 1,
    },
    {
      piece: "rules_card",
      label: "The rules",
      description: "Three rounds, same slips. Short enough to read aloud.",
      voicePiece: "game_rule",
      quantity: 1,
    },
  ],
  dependencies: [],
  worlds: [
    {
      world: "westhampton-1976",
      affinity: 0.6,
      note: "A bowl, a pen, and an argument. Nothing in it postdates 1976.",
    },
  ],
};

/**
 * IMPOSTER — recommended, never provided.
 *
 * Somebody else's product. Revelle may name it and point a host at it. It may
 * not reproduce the rules, print a card, or set anything about it in a
 * destination's typeface, and db/010 refuses printed matter for it in both
 * directions rather than trusting anyone to remember.
 *
 * The constraints are real and are stated rather than discovered: it needs a
 * phone each, it needs signal, and it can be pulled from an app store between
 * the day a Revelle is designed and the night it is run.
 */
const IMPOSTER: Game = {
  slug: "imposter",
  name: "Imposter",
  description:
    "A phone game. Everyone gets the same word except one person, who has to " +
    "get through the round without ever having heard it.",
  howItWorks:
    "The app runs it and explains itself. Revelle points at it and does not " +
    "reprint it.",
  materials: "A phone each.",

  shape: "scheduled",
  sourcing: "recommended",
  durationMinutes: 20,
  durationMaxMinutes: 30,
  minGuests: 4,
  maxGuests: 12,

  externalName: "Imposter",
  caveat:
    "Not ours. It needs a phone each and signal that holds, and it can be " +
    "pulled or paywalled between the day this is designed and the night it " +
    "is run. Check it is still there in the week before.",
  sourceNote:
    "Third-party application. Recommended only: named and pointed at, never " +
    "reproduced and never printed.",
  notes:
    "The one game in the pool the house does not control. If it disappears, " +
    "the slot is refilled from the provided games and nothing else changes — " +
    "which is the argument for never letting a recommended game be required.",

  /**
   * THE ONE RUNBOOK THAT IS ALLOWED TO BE THIN, AND THE DATABASE ENFORCES IT.
   *
   * db/025 refuses a `playing` or `deciding` step for a recommended game, in
   * both directions, exactly as db/010 refuses printed matter. The house may
   * write its own part — check it still exists, charge the phones, hand it
   * over, decide when to stop — and may not write how somebody else's game is
   * played. There is nothing missing below; there is a line.
   */
  runbook: {
    hostRole: "plays_too",
    hostNote:
      "The app runs it. You are a player, and the only job that is yours is " +
      "deciding when to stop.",
    steps: [
      {
        step: "check_it_still_exists",
        phase: "before",
        instruction: "Open the store in the week before and check it is still there.",
        detail:
          "It can be pulled, renamed, paywalled or broken by an update between " +
          "the day this was designed and tonight. Nothing on the house's side " +
          "prevents it.",
      },
      {
        step: "ask_them_to_install_it",
        phase: "before",
        instruction: "Ask people to have it before they arrive.",
        detail:
          "Twelve people downloading the same thing at once is four minutes " +
          "of a silent room looking down, which is the exact opposite of what " +
          "the game is for.",
      },
      {
        step: "charged_and_out",
        phase: "before",
        instruction: "Phones charged, and a charger out where people can see it.",
        detail:
          "The whole game is one phone each. A dead one is a person watching.",
      },
      {
        step: "hand_it_over",
        phase: "opening",
        instruction: "Hand it to somebody who already has it open and sit down.",
        detail:
          "It explains itself, and a host reading out rules that are on the " +
          "screen in front of everybody is a host who has misunderstood which " +
          "game this is.",
        say: "Phones out. Whoever has it open is running it.",
        minutes: 2,
      },
      {
        step: "stop_at_three",
        phase: "ending",
        instruction: "Three rounds, then put the phones away.",
        detail:
          "This is the only game in the pool with no ending of its own, so you " +
          "have to give it one. Stop while people still want a fourth.",
      },
    ],
    contingencies: [
      {
        trouble: "will_not_play",
        answer:
          "It needs a phone and there is no version of it for somebody without " +
          "one. Do not run it in a room where one person would be watching.",
      },
      {
        trouble: "under_minimum",
        answer:
          "Under four there is nobody to hide among and the game does not " +
          "work. It is not a smaller version of itself.",
      },
      {
        trouble: "over_size",
        answer:
          "Above twelve, split the room and run it twice. Do not add players " +
          "to make one big round.",
      },
      {
        trouble: "running_long",
        answer:
          "Three rounds. It is a twenty-minute game that will happily eat an " +
          "hour, and at the end of that hour everybody is on their phones.",
      },
      {
        trouble: "played_before",
        answer:
          "People who have played are better at it, which is fine. Somebody " +
          "explaining the strategy out loud is not; ask them not to.",
      },
      {
        trouble: "not_landing",
        answer:
          "If the signal is gone, it is gone, and no amount of standing near " +
          "a window fixes it. Have the Fishbowl bowl in the cupboard.",
      },
    ],
  },

  facets: [
    {
      dimension: "group_fun",
      code: "keep_a_secret",
      weight: 1,
      note:
        "One person has not heard the word and has to get through the round " +
        "without anybody finding out. That is the entire game.",
    },
    { dimension: "group_fun", code: "compete", weight: 0.7 },
    { dimension: "affinity", code: "wit", weight: 0.7 },
    {
      dimension: "anti_preference",
      code: "prep_marathon",
      weight: -0.9,
      note: "Repudiates it entirely. There is nothing to prepare and nothing to buy.",
    },
    { dimension: "affinity", code: "ease", weight: 0.6 },
    {
      dimension: "group_fun",
      code: "long_dinner",
      weight: 0.5,
      note: "It works at the table without anybody getting up.",
    },
    { dimension: "group_fun", code: "perform", weight: 0.5 },
  ],

  occasions: [{ occasion: "anniversary", fit: "forbidden" }],
  slots: [
    { slotCode: "game", fit: "native" },
    { slotCode: "day_material", fit: "native" },
  ],

  supplies: [],
  requirements: [
    { requirement: "phones", note: "One each, charged, and out on the table." },
    {
      requirement: "signal",
      note: "A rented house on a dune road is exactly where this is not true.",
    },
    { requirement: "app_store" },
  ],
  // Empty, and the database will refuse to let it stop being empty while
  // sourcing is 'recommended'.
  printedMatter: [],
  dependencies: [],
  worlds: [
    {
      world: "westhampton-1976",
      forbidden: true,
      note:
        "The house never mentions anything that did not exist in 1976 — no " +
        "links, no apps, no confirming online. This is not a low score under " +
        "this destination, it is a structural no.",
    },
  ],
};

/**
 * Every game that exists, by slug — the same slug as `game.slug`.
 *
 * A plain object rather than an array so a missing key is a compile error
 * rather than a runtime undefined, and so a dependency written against a slug
 * that does not exist is caught by the seed on the first run.
 */
export const GAMES = {
  "art-battle": ART_BATTLE,
  "reverse-scavenger-hunt": REVERSE_SCAVENGER_HUNT,
  "lets-make-a-deal": LETS_MAKE_A_DEAL,
  "secret-game-cards": SECRET_GAME_CARDS,
  "the-secret-auction": THE_SECRET_AUCTION,
  fishbowl: FISHBOWL,
  imposter: IMPOSTER,
} as const satisfies Record<string, Game>;

export type GameKey = keyof typeof GAMES;

export const ALL_GAMES: readonly Game[] = Object.values(GAMES);
