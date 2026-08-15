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

/** How a game behaves under one destination — db/009's stage 3. */
export type GameWorldScope = {
  world: string;
  forbidden?: boolean;
  affinity?: number;
  note?: string;
};

export type Game = {
  slug: string;
  name: string;
  /** One or two sentences. What it is, in the house's register. */
  description: string;
  /** How it is actually run. This is what gets printed into The Fun. */
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
      source: "host_buys",
      leadTimeDays: 7,
    },
    {
      item: "Numbered voting stickers",
      source: "host_buys",
      leadTimeDays: 3,
      note: "The ballot is printed; the stickers that go on the work are bought.",
    },
    {
      item: "Easels, or a long table and a wall",
      source: "on_hand",
      note: "The work has to be lookable-at all at once, or round two does not happen.",
    },
    { item: "A timer", source: "on_hand" },
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
  durationMinutes: 45,
  durationMaxMinutes: 45,
  minGuests: 10,
  maxGuests: undefined,

  scoring:
    "A business card, 5. A signature, 5. A handwritten compliment, 10. A " +
    "photograph with three strangers, 10. A party hat, 10. A recipe, 15. A " +
    "drawing on a napkin, 15. Somebody singing Happy Birthday to you, 15. A " +
    "foreign coin, 20. A childhood story, 20.",
  currencyLabel: "points",
  sourceNote: HOUSE,

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
    { item: "A pen each", source: "on_hand", perGuest: true },
    { item: "A timer", source: "on_hand" },
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
