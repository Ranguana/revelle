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
 * ONE PRINTED PIECE PER GAME
 *
 * Founder, ruling on a file that had five pieces on the auction and three on
 * the art battle: "for each game 1 printed matter not 3 for each game,
 * consolidate it. but again it wasnt actually done."
 *
 * So every provided game below carries exactly ONE `printedMatter` row. It is
 * one artwork, set once in the destination's face, and it arrives as one
 * sheet. Where a game needs several things in the room at once, the sheet is
 * PERFORATED and the host separates it — the device fishbowl's slips already
 * used, generalised. Nothing was dropped to reach the number: everything the
 * several rows carried is written into the one that survives, and where the
 * merge changed how an object gets into the room, the runbook step that puts
 * it there was changed with it.
 *
 * THE SUPERSEDED READING, kept per CLAUDE.md rule 14 because it is the one a
 * later agent will re-derive: the pieces used to be split by KIND OF WRITING —
 * a ballot was a `notice`, a door card a `heading`, a paddle a `place_card`,
 * and only the rules were a `game_rule`. db/010's own comment still gives "the
 * writer's prompt for a voting slip knows it is a `notice`" as the reason the
 * `voice_piece` column exists. That was a good argument for a schema and a bad
 * one for a catalogue: it produced three and five objects per game, each its
 * own design job, for a house that prints one thing. The column is unharmed —
 * it now says what the whole sheet is, and the whole sheet is a `game_rule`,
 * because what the house writes on it is the game explained. The blanks a
 * guest fills in are not house writing and never were.
 *
 * WHAT WAS DELIBERATELY NOT DONE: `imposter` still prints nothing, and no row
 * was authored for it. It is RECOMMENDED, db/010's trigger refuses printed
 * matter for a recommended game in both directions, and games.test.ts asserts
 * the count is zero. Rule 29 says an absence is almost never a fact about the
 * thing — this is the exception it leaves room for, because the absence here
 * is a POSITIVE claim the schema enforces rather than an authoring gap: we may
 * name somebody else's game and may not print a card for it.
 *
 * ─────────────────────────────────────────────────────────────────────
 * THE ANNIVERSARY — SEVENTEEN FORBIDS LIFTED, TWO KEPT
 *
 * Founder, ruling on a carousel that was rendering one card at twelve rooms:
 * "let every room have a game."
 *
 * NINETEEN of twenty-seven games forbade `anniversary`, so at an anniversary
 * the whole catalogue offered Fishbowl and, in six rooms, one room game.
 * db/061 gives every occasion exactly one game slot and she chooses from
 * three; at an anniversary there was nothing to choose from.
 *
 * THE EVIDENCE, AND IT IS NOT SYMMETRY (rule 32). Every one of the nineteen
 * notes that carried a reason gave the SAME reason, and it is a headcount
 * claim: "two people and a quiet room", "a vote between two people is not a
 * vote", "two people and a dice cup". Not one gave a register reason.
 *
 * AND THE HEADCOUNT IS NOT THE OCCASION. `guest_count_band` (db/006) is a
 * separate quiz answer with eight values, `two` being one of them, and
 * NOTHING TIES IT TO `occasion`. db/009's own definition of the anniversary
 * is "One evening, honoured. Quieter than a birthday and marked all the
 * same" — it says nothing about two people. A twenty-five-person anniversary
 * is a thing a host may answer for, and half the catalogue was refusing it.
 *
 * SO THE FORBID WAS ANSWERING A DIFFERENT QUESTION THAN IT APPEARED TO
 * (rule 23): it reads as "this game does not suit an anniversary" and means
 * "this game does not work with two people". That second thing is already
 * enforced, correctly and at every occasion, by `minGuests` —
 * src/lib/selection/fill.ts:441 drops any ingredient whose floor is above the
 * group size, with the reason printed. Art Battle's floor of six keeps it
 * away from a table of two whether or not an occasion row says so. The
 * occasion forbid was a duplicate authority (rule 21) over a fact the guest
 * band already owns, and it was the one of the two that could be wrong.
 *
 * THE SEVENTEEN LIFTED, with the argument each one carried, kept per rule 14
 * because a deleted argument gets re-made:
 *
 *   art-battle          "An anniversary is two people and a quiet room, not a
 *                        room of twenty with wet paint on it."
 *   reverse-scavenger-hunt   (no note — an absence-graded forbid, rule 3)
 *   secret-game-cards        (no note)
 *   imposter                 (no note)
 *   westhampton…list    "Two people and a pad is not a tally, it is a
 *                        conversation with a step in the way."
 *   havana…song         "Two people naming songs for each other is a evening,
 *                        not a game with a bowl in it."
 *   las-vegas…supper    "Two people and a dice cup, one of whom buys supper.
 *                        That was going to happen anyway."
 *   nantucket…weather   "Two people, one of whom clears. That is not a game,
 *                        it is Tuesday."
 *   new-orleans…own     "Two people, and the person on your left is the person
 *                        on your right."
 *   catskills…swim      "A vote between two people is not a vote."
 *   cote-dazur…lying    "One of two people is lying, and both of them know
 *                        which."
 *   acapulco…song       "Two people naming the last song, one of whom gets
 *                        thrown in."
 *   amalfi…numbers      "Two people, two cards and a bag of numbers."
 *   amalfi…prizes       "Five prizes and two people. Somebody is opening four
 *                        of them."
 *   palm-springs…line   "Two people, neither of whom may repeat their own
 *                        line."
 *   oaxaca…year         "Two people correcting each other's years is not a
 *                        game, it is a marriage."
 *   st-moritz…light     "Two people paying each other one compliment before
 *                        dark is an evening, not a round."
 *
 * Every one of those sentences is still TRUE of a two-person anniversary and
 * is still enforced — by the floor, not by the occasion.
 *
 * THE TWO KEPT were kept on an argument that survives at any headcount —
 * `lets-make-a-deal` puts a compere and a running order between the room and
 * the two people the evening honours, and `the-secret-auction` ends the night
 * on a bidding war where the honouring belongs. BOTH WERE LIFTED A DAY LATER;
 * the section below says why, and it is the founder saying that the house's
 * reading is not the one that decides.
 *
 * The paragraph that stood here about the dinner-party, getaway, birthday and
 * bridal forbids — "they stay" — was true for one day. It did not survive her
 * next ruling, and the ruling is general rather than a longer list of
 * exceptions.
 *
 * ─────────────────────────────────────────────────────────────────────
 * EVERY FORBID LIFTED — A ROOM'S CHARACTER MAY NOT VETO A GAME
 *
 * Founder, 2026-09-06, reading a forbid note back to us:
 *
 *   "regarding your game questions, lets clear something up - there is no way
 *    a game shouldnt be offered bc somewhere the revelle is nobody leaves the
 *    table - that shouldnt be a rule in the first place"
 *
 * On the two anniversary rows the pass above had kept:
 *
 *   "a twenty-five-person anniversary is just a party and entitled to a game
 *    show. it is not a two person event unless the host says it is and then
 *    obviously it is not the right game"
 *
 * And on the one row that was not a room-character argument at all:
 *
 *   "also forget this limiting rule that we have to be era specific and cannot
 *    have later tech"
 *
 * SO THERE IS NO FORBID LEFT IN THIS FILE. Seventeen occasion forbids and one
 * world forbid, all of them lifted, each read on its own note rather than
 * swept by field (rule 32 — symmetry is not evidence, and the anniversary pass
 * above is the worked example of reading one row at a time and finding they
 * all said the same thing).
 *
 * THE PRINCIPLE, WHICH IS THE VENUE RULE READ ONTO GAMES (CLAUDE.md rule 2).
 * Venue may eliminate what cannot physically happen and may never rank what
 * can. So may a game's eligibility: what is left after this is `minGuests` and
 * `maxGuests`, the venue affordances, and the requirement kinds. "Nobody
 * leaves the table" is a lovely sentence about a dinner party and it is not a
 * fact that makes a game impossible. THE CONSTRAINT DOOR STAYS OPEN; THE TASTE
 * DOOR IS SHUT.
 *
 * AN OCCASION IS NOT A HEADCOUNT, which is the sharper half. db/009 defines
 * the anniversary as "One evening, honoured" and says nothing about two
 * people; `guest_count_band` is a separate answer with eight values, and
 * `minGuests` in src/lib/selection/fill.ts already refuses a game show at a
 * table of two, at every occasion. Her own proof that the mechanism was
 * already right is the second clause: "unless the host says it is and then
 * obviously it is not the right game." The forbid was a second authority over
 * a fact the guest band already owns (rule 21), and it was the one of the two
 * that could be wrong — it fires on the NAME of the occasion regardless of who
 * is coming.
 *
 * THE FOUR THAT SOUNDED LIKE FACTS, named because they are the ones a later
 * agent will want to put back: the weather, the boat count, the temperature
 * and the last night were each forbidden at a dinner party because they
 * "settle tomorrow morning". That sounds structural and is not. A dinner party
 * can have a slip that settles in the morning; what the notes describe is a
 * payoff landing after the guests have gone, which is a thing a host may want.
 * If one of them is ever genuinely unrunnable it comes back as a REQUIREMENT —
 * game_requirement_kind is where "this needs a next morning" belongs, as a
 * fact about the room, pruning through the same door venue uses. It does not
 * come back as a forbid.
 *
 * THE ERA RULING, AND ITS SCOPE. `imposter` was forbidden at westhampton-1976
 * because "the house never mentions anything that did not exist in 1976". The
 * room is a REGISTER, NOT A TIME MACHINE: the member's party happens this year
 * and her guests have phones. 1976 is how the evening reads, not a claim about
 * what may be in the room. NOT TOUCHED, and deliberately: the `never` lines in
 * the Westhampton and Las Vegas voice blocks in src/lib/destinations.ts say
 * the same sentence about how the ROOM WRITES. They are authored voice
 * content, enforced by npm run check:voice-output, and they are a different
 * rule wearing the same words. Hers to rule on separately.
 *
 * AND WHAT THIS LEAVES: the only thing that removes a game from her evening is
 * HER saying she does not want one — `hates_games` on the play question and
 * `play_appetite = 'none'`, both carrying db/014's `no_games`. The house no
 * longer decides on her behalf that her evening is not a games evening. See
 * db/066, which is the other half of this change: removing a claim from this
 * file removes nothing from a database that already holds it.
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

/**
 * db/068's `day_phase` — WHEN A THING HAPPENS, for any pool with an opinion.
 *
 * db/031 minted these values for the bank and db/033 added `dawn`; db/068
 * renamed the type from `bank_phase` and gave games the same column, because
 * "daylight" has to mean one thing across a package that renders both
 * (CLAUDE.md rule 21). A second vocabulary saying the same five words would be
 * rule 19's hand-written list wearing a type name.
 *
 * `all` IS THE DEFAULT AND MEANS NO OPINION — not "every phase" and not
 * "always". db/031's argument, kept verbatim because it is the part that gets
 * lost: "most content has no time of day, and a tag that has to be filled in
 * for every row gets filled in wrongly."
 */
export type DayPhase = "daylight" | "dusk" | "dark" | "dawn" | "all";

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
/**
 * db/010. ONE OF THESE PER PROVIDED GAME, and none at all for a recommended
 * one. See "ONE PRINTED PIECE PER GAME" at the top of this file for the
 * founder's ruling and for what the split rows used to be; games.test.ts
 * counts it in both directions.
 */
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

/**
 * WHICH BEAT A GAME MAY FILL — and since db/061, that is `game` for all of them.
 *
 * A claim here is a WHITELIST: `slotEligibility` in src/lib/selection/occasion.ts
 * reads any `native` row as "these slots and no others". That is why the
 * collapse had to be authored and not merely migrated. db/061 removed the
 * `occasion_slot` rows for `the_moment`, `honouring`, `day_material`,
 * `ambient_game` and `finale`, so eleven games — six ambient, five finale —
 * were left claiming beats no occasion has. They would not have thrown, gone
 * red, or reported anything. They would simply have stopped being placeable,
 * and forty-one per cent of the catalogue would have gone quiet.
 *
 * So every game now claims `game`. The claims on the five retired beats are
 * KEPT (CLAUDE.md rule 14): they are the authored judgement about what kind of
 * thing each game is, they cost nothing while no occasion asks for those
 * slots, and they are what a re-enabled beat would be filled from.
 */
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

  /**
   * db/068. WHEN IT HAPPENS. Omitted means `all`, which is the column default
   * and means NO OPINION — which is what every game authored before the field
   * day means, and it is left off rather than written out for exactly db/031's
   * reason.
   *
   * DESCRIPTIVE. It does not prune and it does not score, exactly as
   * `bank_item.phase` has not since db/031, and CLAUDE.md rule 15 is why that
   * is said here rather than left to be discovered: an instrument in the
   * scoring loop that looks fed is the failure this repo hunts, and this is not
   * in the scoring loop at all. WHAT ACTUALLY KEEPS A DAYTIME GAME OUT OF THE
   * EVENING IS ITS SLOT CLAIM — the field day games claim `day_material` and
   * nothing else, and `slotEligibility` reads a native claim as a whitelist.
   */
  phase?: DayPhase;

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
    "Everyone paints the same prompt and nobody signs it, so nobody knows " +
    "whose is whose. Then each of you stands up and invents what somebody " +
    "else meant by theirs.",
  howItWorks:
    "One prompt, the same for everyone, and twenty minutes to make " +
    "something. Nothing is signed, so nothing on the wall has an artist " +
    "attached to it.\n\n" +
    "The work goes up while the room is out of it. Then everyone draws a " +
    "number and gets one minute on the piece it belongs to, which is never " +
    "their own. Nobody is guessing who painted what: the minute is spent " +
    "inventing what the artist meant by it, in as much confident detail as " +
    "they can manage, and the artist has to stand there and hear it.\n\n" +
    "Then the room votes: Most Beautiful, Funniest, Most Confusing, I'd Hang " +
    "This, and Best Story. Best Story is a vote on the minute somebody spoke, " +
    "not on the painting they spoke about.\n\n" +
    "The twist, and the reason to run it: the winners do not keep their " +
    "work. Every winning piece goes to a guest drawn at random.",
  materials:
    "THE HOUSE PRINTS one sheet a head: the rules, the ballot and five " +
    "prompt tabs, on one perforated page. YOU SUPPLY one identical canvas " +
    "each and two spare, acrylics in the primaries and black, a handful " +
    "of fat markers, a stack of old magazines to collage from, a sheet of " +
    "small numbered stickers, a bowl, a timer, and a wall or a row of " +
    "easels the work can all be looked at from at once.",

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
          "Have somebody tear the five prompt tabs off their sheet, fold " +
          "them, and draw one.",
        detail:
          "You do not pick it. A prompt the host chose is a prompt the host " +
          "is answering for; a prompt the room drew belongs to the room.",
        say: "Pick one and read it out. That is the prompt and there is no second one.",
        minutes: 2,
        printedPiece: "the_sheet",
      },
      {
        step: "the_two_rules",
        phase: "opening",
        instruction: "Say the two rules and start the clock.",
        say: "Nothing gets signed. When I call time, put it down and leave the room.",
        minutes: 1,
        printedPiece: "the_sheet",
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
        printedPiece: "the_sheet",
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
      code: "theatre",
      weight: 0.7,
      note:
        "The minute is spent inventing what somebody else meant, in confident detail, with the artist standing there. That is a performance of a critic, not a painting.",
    },
    {
      dimension: "group_fun",
      code: "group_games",
      weight: 0.9,
      note:
        "Everyone paints, everyone speaks, everyone votes. Nobody sits it out.",
    },
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

  occasions: [],
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
      piece: "the_sheet",
      label: "The sheet",
      description:
        "One a head, perforated. The rules at the head — three rounds and " +
        "the twist, short enough to read aloud. The ballot under them: five " +
        "categories, one line each. Five prompt tabs along the foot, printed " +
        "on the reverse so they read blank face up; somebody tears the five " +
        "off one sheet, folds them, and draws the prompt from those. The " +
        "prompts are written for the destination and are the part a curator " +
        "authors.",
      voicePiece: "game_rule",
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
    "Everybody gets the same printed list of ten things and forty-five " +
    "minutes to collect as much of it as possible. Nothing on the list " +
    "is hidden anywhere, and nothing on it may be taken: every item has " +
    "to be GIVEN to you by somebody else in the room, which means every " +
    "point on the sheet is a conversation you talked your way into.\n\n" +
    "The ten lines and what each is worth are printed on the list. A " +
    "business card and a signature are five. A handwritten compliment, " +
    "a photograph with three strangers and a party hat are ten. A " +
    "recipe, a drawing on a napkin and somebody singing Happy Birthday " +
    "to you are fifteen. A foreign coin and a childhood story are " +
    "twenty. Negotiating and trading are the game — a coin for a " +
    "compliment, two signatures for a hat — and nothing stops one " +
    "person giving the same thing away four times.\n\n" +
    "The host does not play this one. She referees, stays where people " +
    "can find her, and rules on things as they happen, and she settles " +
    "one number before anybody arrives: the bonus, for anything " +
    "genuinely unusual somebody talked their way into. Ten points, " +
    "twenty-five at the most, three of them all night. A bonus with no " +
    "ceiling is an argument at the scoring table; written down " +
    "beforehand it is a ruling.\n\n" +
    "At forty-five minutes she calls everybody in and the lists are " +
    "scored in pairs — each person scores somebody else's, never their " +
    "own and never a partner they hunted with, which takes five minutes " +
    "where one host scoring ten lists takes twenty. Then the three " +
    "bonuses are awarded out loud with the object held up. Highest " +
    "total wins. On a tie, the two hold up the strangest thing they got " +
    "and the room decides by noise.\n\n" +
    "The whole block is an hour: four minutes to call the room, two to " +
    "say the two rules twice, forty-five for the hunt, and the rest to " +
    "score it and pay the winner.",
  materials:
    "THE HOUSE PRINTS the list, one a head: the two rules at the head, " +
    "the ten lines under them, and what each one is worth. YOU SUPPLY a " +
    "pen each and a timer with a face, somewhere the room can see it.",

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
        printedPiece: "point_list",
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
      code: "group_games",
      weight: 1,
      note:
        "The whole room is on its feet asking strangers for things. There is no version of it seated.",
    },
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

  occasions: [],
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
      description:
        "One sheet a head and three spare, because people arrive who were " +
        "not on the list and still want to play. One side only. The two " +
        "rules at the head, set large enough to be read across a room — " +
        "nothing is taken, everything is given, forty-five minutes — and " +
        "under them the ten lines with what each is worth against it, " +
        "ruled so a stranger scoring somebody else's sheet can tick down " +
        "the column and total it at the foot.",
      voicePiece: "game_rule",
      perGuest: true,
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
    "A round works like this. A name is drawn and that person is the " +
    "contestant. They pay three tickets to play, and they choose one door " +
    "and one only. Door A is a real prize. Door B is not — a potato, a " +
    "single sock, a ketchup packet, a fruitcake. Door C is a mystery " +
    "envelope: swap with anyone, double your prize, lose everything, steal a " +
    "prize, or a mystery gift, and the contestant chooses who to swap with " +
    "or steal from. Whatever is behind the door they picked is theirs, and " +
    "the other two are not opened.\n\n" +
    "Before the door opens, the audience gets sixty seconds to buy and sell " +
    "tickets with the contestant, at whatever price the two of them agree, " +
    "and every deal goes through the host. A contestant with no tickets left " +
    "cannot play, which is why the market matters. That market is not a side " +
    "rule; it is why the room is loud.\n\n" +
    "Four rounds, four contestants. Then, at the end, anyone may risk " +
    "everything they hold on one giant mystery box — the first person to say " +
    "yes takes it, it is opened in front of them, and the night stops there.",
  materials:
    "THE HOUSE PRINTS one perforated sheet, cut up before anybody " +
    "arrives: three door cards, five Door C slips, and the tickets that " +
    "are the currency — print the sheet again for more tickets. YOU " +
    "SUPPLY three doors, screens or curtained corners, five plain " +
    "envelopes for the Door C slips, the real prizes and the ridiculous " +
    "ones, and one box big enough to be a problem.",

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
    "and tradeable all night. Three tickets buys a contestant one door. " +
    "Nothing is totalled at the end: what people hold, they hold.",
  currencyLabel: "tickets",
  sourceNote: HOUSE,
  notes:
    "THE PRICE OF A DOOR IS THE HOUSE'S AND IT IS NEW. The founder's own " +
    "account of this game says a contestant spends tickets to choose and " +
    "never says how many, which leaves the one number a host has to say out " +
    "loud before the first round unwritten — and with it, whether the " +
    "sixty-second market is for anything. Three, against a ticket handed out " +
    "on arrival and more all evening, makes the market matter without " +
    "putting a door out of anybody's reach. Four rounds and one door per " +
    "contestant are the house's too; both were implied by the runbook's own " +
    "clock and neither was stated.\n\n" +
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
        instruction:
          "Cut the five Door C slips off the sheet, put them in envelopes, and " +
          "shuffle them.",
        detail:
          "Swap with anyone. Double your prize. Lose everything. Steal a " +
          "prize. A mystery gift. Nothing is written on the outside.",
        printedPiece: "the_sheet",
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
        printedPiece: "the_sheet",
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
        printedPiece: "the_sheet",
      },
      {
        step: "the_market_opens",
        phase: "opening",
        instruction: "Say the price of a door and how the market works, before the first round.",
        detail:
          "Three tickets to play, one door each and one only. Then sixty " +
          "seconds in which the audience may buy and sell tickets with the " +
          "contestant at any price the two of them agree, and then you call " +
          "it closed. It is not a side rule; it is why the room is loud.",
        say: "Three tickets buys you one door. Sixty seconds from now: buy from her, sell to her, any price you like, and every deal goes through me.",
        minutes: 2,
        printedPiece: "the_sheet",
      },
      {
        step: "round_one",
        phase: "playing",
        instruction:
          "Draw a name, take three tickets, open the market, then open the one door they pick.",
        detail:
          "DRAW, do not take volunteers. The same three people volunteer for " +
          "everything and the fourth round is where the room goes quiet. One " +
          "door only and the other two stay shut. Run the first one slowly — " +
          "everybody is learning the market by watching it.",
        minutes: 8,
      },
      {
        step: "the_rest_of_the_rounds",
        phase: "playing",
        instruction: "Three more rounds, a new name each time, faster each time.",
        detail:
          "Cut the talking and not the market. Four contestants is the " +
          "whole of it, and a person already drawn is not drawn again. By " +
          "round three the audience is running the market without you and " +
          "you can just open doors.",
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
      code: "theatre",
      weight: 0.5,
      note:
        "A compere, a running order and a crowd. It is staged, and the staging is the fun.",
    },
    {
      dimension: "group_fun",
      code: "group_games",
      weight: 0.9,
      note:
        "The audience is half the game — they buy their way in from the floor.",
    },
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

  occasions: [],
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
      piece: "the_sheet",
      label: "The sheet",
      description:
        "One sheet, perforated, cut up before anybody arrives. Three door " +
        "cards, large enough to be read across a room, with the rules — " +
        "three doors, the market, and the final gamble — printed on the " +
        "backs that face you. Five Door C slips: swap with anyone, double " +
        "your prize, lose everything, steal a prize, a mystery gift; they go " +
        "into envelopes with nothing written on the outside. And the " +
        "tickets, which are the currency. Print the sheet again for more " +
        "tickets; a room only ever needs one set of doors.",
      voicePiece: "game_rule",
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
    "One card each, drawn face down out of a bowl by the door as people " +
    "arrive, and it is yours for the whole night. The deck is printed one a " +
    "head with spares, and every card is a thing to make happen to somebody " +
    "else without ever saying that you are doing it.\n\n" +
    "Nobody says what is on theirs. There is no enforcement of that and none " +
    "is needed: telling somebody is obviously worse than not, and the secret " +
    "is the game — take it out and the deck is a list of chores.\n\n" +
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
    "for you. Make somebody else do your challenge. Swap scorecards. The " +
    "host never says these exist, and being made to swap scorecards in the " +
    "middle of the kitchen at eleven is the design working.\\n\\n" +
    "YOU MARK YOUR OWN. A card completed is ticked by the guest on their " +
    "own scorecard, and nobody audits it. There is no proof and none is " +
    "asked for: somebody who lies about a conga line has done more work " +
    "than somebody who told the truth about a compliment.\\n\\n" +
    "It takes no block and costs the evening nothing — it runs underneath " +
    "everything else from the door until the end. HOW IT FINISHES DEPENDS " +
    "ON WHAT ELSE IS RUNNING. Where the auction is on, a completed card is " +
    "worth twenty Party Bucks, counted by the guest at the auction and " +
    "never before, because a deck counted at nine o'clock is a scoreboard " +
    "and a scoreboard stops people attempting the hard ones. Where there is " +
    "no auction, it ends near midnight with everybody reading their card " +
    "out loud, going round the room — the only time the deck is ever heard, " +
    "and half of it is people finding out what was being done to them all " +
    "night.",
  materials:
    "THE HOUSE PRINTS one sheet a head, perforated into a challenge card " +
    "and a scorecard and torn apart before anybody arrives. YOU SUPPLY a " +
    "bowl or a hat to draw the cards from, and a pencil or two beside it " +
    "for the scorecards.",

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
        instruction:
          "Tear the sheets apart, then read the whole deck yourself, including " +
          "the wicked ones.",
        detail:
          "Take out anything that will not survive this particular room. You " +
          "are the only person who will ever see all of it, and a card that " +
          "lands badly at eleven cannot be taken back.",
        printedPiece: "the_sheet",
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
        printedPiece: "the_sheet",
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
        printedPiece: "the_sheet",
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
      code: "theatre",
      weight: 0.8,
      note:
        "Every guest is playing a part all evening without saying they are.",
    },
    {
      dimension: "group_fun",
      code: "group_games",
      weight: 0.7,
      note:
        "Everyone has a card. It runs across the whole room rather than at one table.",
    },
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

  occasions: [],
  slots: [
    {
      slotCode: "game",
      fit: "native",
      note: "db/061 collapsed the five game beats into one. This is the beat now, and she chooses among what the room offers.",
    },
    {
      slotCode: "ambient_game",
      fit: "native",
      note: "The only slot it can fill, and the only shape that slot accepts.",
    },
  ],

  supplies: [
    { item: "The deck", source: "printed", perGuest: true, leadTimeDays: 2 },
    { item: "A bowl or a hat to draw from", source: "on_hand", quantity: 1 },
    {
      item: "Pencils",
      detail:
        "Two or three beside the bowl. A scorecard nobody can mark is a " +
        "scorecard nobody marks, and the twenty a card is the whole reason " +
        "to complete one.",
      source: "on_hand",
    },
  ],
  requirements: [
    { requirement: "mixed_room" },
    { requirement: "floor_space" },
    { requirement: "printing" },
  ],
  printedMatter: [
    {
      piece: "the_sheet",
      label: "The sheet",
      description:
        "One a head, perforated into two and torn apart before anybody " +
        "arrives. The card — easy, middling, hard, and the wicked ones mixed " +
        "in unmarked — goes face down in the bowl to be drawn at the door. " +
        "The scorecard sits beside the bowl and is what you mark. They are " +
        "torn apart and never handed over together: a wicked card can make " +
        "somebody swap scorecards, and a scorecard that still had the " +
        "challenge on it would hand over the secret the whole deck runs on.",
      voicePiece: "game_rule",
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
    "THE MONEY COMES FIRST AND MOST OF THE GAME HAPPENS BEFORE THE BLOCK " +
    "DOES. Party Bucks are paid out in cash by the host across the whole " +
    "evening, on the spot, out of her own pocket and never as a tally " +
    "settled later — fifty for winning the art battle, seventy-five for the " +
    "scavenger hunt, twenty for every secret card completed, whatever the " +
    "game show paid out, and ten to thirty at her discretion for party " +
    "spirit. Nobody is told what the money buys. That last payment is the " +
    "mechanism rather than a kindness: it is what keeps a guest who has won " +
    "nothing all night in the room at midnight, and it only works paid out " +
    "loud, where people can see it.\n\n" +
    "The lots sit on a table under a cloth from the start of the night and " +
    "nobody sees one before the auction opens. Eight to ten of them is what " +
    "the half hour is written for. They are put in order beforehand: " +
    "something small and stupid first, the Golden Ticket second to last, " +
    "the best thing last. What has gone under the hammer — good wine, " +
    "restaurant gift cards, trophies that are jokes, mystery boxes, the " +
    "paintings from the art battle that nobody won, and the Golden Ticket, " +
    "which is an automatic win in the first game of next year's party and " +
    "names that game on its face.\n\n" +
    "The cloth comes off once, and that is the reveal. The host says what " +
    "the money was for, flat, and then sells the first lot — small and " +
    "stupid on purpose, because it teaches the room what its money is " +
    "worth.\n\n" +
    "HOW A BID WORKS. Out loud, with numbered paddles, one a head. The host " +
    "says a number and the room goes up from it; there is no sealed bid and " +
    "nothing is written down. Highest paddle takes the lot — she counts " +
    "three and it is done — and the money is handed over BEFORE the lot " +
    "leaves her hand, every time, which is the one rule that stops the last " +
    "twenty minutes of the night becoming an accounting dispute. There are " +
    "no ties at an auction: two people on the same number keep going up, " +
    "and if two paddles genuinely land together she takes the one she heard " +
    "first and means it.\n\n" +
    "The best thing is sold last and the gavel is the end of the night. " +
    "Nothing goes after it — a speech, a round of thanks, one more lot " +
    "somebody found, is the evening ending twice, which means it did not " +
    "end the first time.\n\n" +
    "It is a currency and not a raffle, which is the point: a guest who has " +
    "won nothing all evening still has money and is still in it at midnight.",
  materials:
    "THE HOUSE PRINTS one perforated sheet, cut up before anybody " +
    "arrives: numbered paddles, one a head; the money, in the " +
    "destination's own face, and the sheet is printed again for more of " +
    "it; the Golden Ticket; and the running order of the lots. YOU SUPPLY " +
    "the lots themselves — the real ones, the joke trophies, the mystery " +
    "boxes — and something to bang on a table with.",

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
    "FOUNDER RULING 2026-09-06, on money left unspent when the block closes: it CARRIES TO NEXT YEAR, alongside the Golden Ticket. She does not cash out and the house does not reclaim it — the bucks and the ticket are held and are hers the next time. That answers the open question in docs/games-need-a-human.md and it is a membership mechanic before it is a game one: her own pricing copy says membership is continuity, and this is the game saying the same thing with money. A single Revelle cannot carry anything forward, which is now the difference showing up inside the evening.\n\n" +
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
          "Choose the lots, put them in order, and cover them with a cloth.",
        detail:
          "Nobody sees a lot before the auction opens; that is the whole trick " +
          "and it is the only rule of this game that cannot be recovered from. " +
          "Order them: something small and stupid first, the Golden Ticket " +
          "second to last, the best thing last.",
        supplyItem: "The real lots",
        printedPiece: "the_sheet",
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
        printedPiece: "the_sheet",
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
        printedPiece: "the_sheet",
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
        instruction: "Take the cloth off and say what the money was for.",
        detail:
          "This is the reveal and it only happens once. Say it flat. The room " +
          "has been earning a currency all night without being told what it " +
          "buys, and the objects do the work.",
        say: "Everything you have been paid tonight is spendable, once, on this table. Nothing here goes home with me.",
        minutes: 3,
        printedPiece: "the_sheet",
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
        printedPiece: "the_sheet",
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
        printedPiece: "the_sheet",
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
      code: "group_games",
      weight: 0.8,
      note:
        "The bidding only works with a room in it.",
    },
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

  occasions: [],
  slots: [
    {
      slotCode: "game",
      fit: "native",
      note: "db/061 collapsed the five game beats into one. This is the beat now, and she chooses among what the room offers.",
    },
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
      piece: "the_sheet",
      label: "The sheet",
      description:
        "One sheet, perforated, cut up before anybody arrives — which is " +
        "also what keeps the lots secret, because the only person who ever " +
        "handles it whole is you. The paddles, numbered, one a head. Party " +
        "Bucks, the currency, in the destination's own face; print the sheet " +
        "again for more of them. The Golden Ticket, which names the game it " +
        "wins next year and stays on the sheet uncut if there is no next " +
        "year. The running order of the lots, which nobody sees until the " +
        "cover comes off. And what the money was for, what it buys, and how " +
        "a bid is settled.",
      voicePiece: "game_rule",
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
    "Everybody writes six names or nouns on slips and folds them into the " +
    "bowl. Two teams, counted off round the table.\n\n" +
    "Two teams, and a turn is one minute. One person draws slips and clues " +
    "them to their own team, one after another, and the team keeps every " +
    "slip it gets right. When the minute is up the bowl goes to the other " +
    "team and the next person on that side clues. The round is over when " +
    "the bowl is empty, and then EVERY slip goes back in — the same slips, " +
    "never rewritten — for the next round.\n\n" +
    "TWO THINGS THE ROOM ASKS IN THE FIRST MINUTE, so settle both out loud " +
    "before anybody starts. First, whether a clue-giver may skip a slip she " +
    "cannot get. This genuinely varies wherever the game is played — from " +
    "no skips at all to unlimited — and every version of it agrees on one " +
    "thing, which is that the table settles it BEFORE the first turn rather " +
    "than during one. FOUNDER RULING 2026-09-06: she may skip as many as she " +
    "wants. A skipped slip goes straight back in the bowl, and play passes " +
    "clockwise. (The house default was one skip a turn until she ruled; the " +
    "old default is kept in docs/games-refused.md per rule 14.) Second, the seconds left over " +
    "when the bowl empties mid-turn: they carry, and the same person picks " +
    "up the next round with them still running.\n\n" +
    "First round, you may say anything except the word itself. Second round, " +
    "same slips, and you may only act it out. Third round, same slips again, " +
    "and you get one word. Most slips across the three wins.\n\n" +
    "The third round is funny because of the first two. That is the whole " +
    "design, and it is why the bowl is refilled between rounds rather than " +
    "rewritten.",
  materials:
    "THE HOUSE PRINTS one sheet a head: the rules at the head, six slips " +
    "under them, and a label along the foot for the bowl. YOU SUPPLY the " +
    "bowl, a pen each, and a timer.",

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
  notes:
    "READ AGAINST THE PUBLISHED VERSIONS, 2026-09-05, because it is the one " +
    "game here whose rules exist outside this house and can therefore be " +
    "checked. Three findings, and the first is the one that matters.\n\n" +
    "THE ROUND ORDER HERE IS THE MINORITY READING. This file runs anything " +
    "except the word, then act it out, then one word. The majority of " +
    "published descriptions — and the only commercially codified version, " +
    "and the encyclopaedia entry for Celebrity — run anything except the " +
    "word, then ONE WORD, then act it out, with the charades last. Both " +
    "orders are played by real rooms and both are defensible; the argument " +
    "written into the runbook here (the third round is funny because of the " +
    "first two, and round two is faster because everybody half-remembers " +
    "the bowl) is true either way round. NOTHING WAS CHANGED, because the " +
    "order of the rounds is what the game IS and swapping it is not a " +
    "clarification. docs/games-need-a-human.md asks her.\n\n" +
    "THE SKIP RULE IS UNSETTLED EVERYWHERE. Published versions run the " +
    "whole range — no skips at all, one a turn, one a round, unlimited in " +
    "the first two rounds and none in the last, unlimited always — and " +
    "every one of them says it is a thing the table agrees BEFORE the first " +
    "turn. So the house states it as a default a room may overrule rather " +
    "than as a rule: one skip a turn, and the slip goes back in the bowl. " +
    "Also hers to settle.\n\n" +
    "SIX SLIPS A HEAD IS THE HOUSE'S NUMBER. Published versions cluster on " +
    "three to five each and think in terms of a total bowl of forty to " +
    "fifty slips rather than a per-head count. Six a head reaches the " +
    "published total at eight people and passes it badly at thirty, which " +
    "is what the running-long contingency is for — cut the bowl, never a " +
    "round. Left as six: the runbook argues the number (four and the third " +
    "round is over before it is funny) and that is an authored judgement.",

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
        printedPiece: "the_sheet",
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
        printedPiece: "the_sheet",
      },
      {
        step: "round_one",
        phase: "playing",
        instruction: "Say anything except the word. A minute a turn, alternating teams.",
        detail:
          "Guessed slips are kept by the guessing team. Keep going until the " +
          "bowl is empty, then refill it with the SAME slips.",
        minutes: 10,
        printedPiece: "the_sheet",
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
    {
      dimension: "group_fun",
      code: "board_games",
      weight: 0.9,
      note:
        "A bowl, slips, teams, three rounds and a score. It is a parlour game in the plainest sense.",
    },
    {
      dimension: "group_fun",
      code: "group_games",
      weight: 0.7,
      note:
        "Teams, and everybody is in one.",
    },
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
      piece: "the_sheet",
      label: "The sheet",
      description:
        "One a head, perforated, in the destination's face. The rules at the " +
        "head — three rounds, the same slips, short enough to read aloud. " +
        "Six slips under them, which is the number. And a label along the " +
        "foot for whatever the bowl actually is; one gets torn off and put " +
        "on it.",
      voicePiece: "game_rule",
      perGuest: true,
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
    "THIS ONE IS NOT OURS. It is somebody else's product, it explains " +
    "itself, and the house names it and points at it rather than " +
    "reproducing a word of it. The link on this page is the whole of what " +
    "Revelle provides, and nothing is printed, because printing a card for " +
    "somebody else's game is precisely what the house may not do.\n\n" +
    "WHAT THE HOST DOES IS EVERYTHING AROUND IT. Open the link in the week " +
    "before and check it is still there and still costs what it cost — an " +
    "app can be pulled, paywalled or renamed between the night a party is " +
    "planned and the night it is run, and that is the one failure here " +
    "nobody can fix at nine o'clock. Check the room has signal that holds " +
    "where people will actually be sitting. Ask everybody playing to have " +
    "it open before you start, because installing an app in a circle of " +
    "eight is what kills this. And say at the door that phones stay out for " +
    "this one, which matters where the rest of the evening has been putting " +
    "them in a bowl.\n\n" +
    "Twenty to thirty minutes is what to plan the block against, at four to " +
    "twelve people. The host plays like everybody else; there is nothing " +
    "here for her to run.",
  materials:
    "Nothing is printed and nothing ships. Every player needs a phone " +
    "with the app on it, and it is theirs to install rather than ours to " +
    "send.",

  shape: "scheduled",
  sourcing: "recommended",
  durationMinutes: 20,
  durationMaxMinutes: 30,
  minGuests: 4,
  maxGuests: 12,

  externalName: "Imposter",
  // A BROWSER LINK, NOT A STORE LISTING, and the choice is the recommendation.
  //
  // db/010: "We may NAME it and point a host at it." The name alone was not
  // pointing — there are at least eight apps called some version of Imposter
  // across the two stores, so "look it up" hands her a search result and a
  // guess on the night. Founder ruling 2026-08-31: it gets a link.
  //
  // A store listing would have been the obvious answer and is the wrong one:
  // it is one platform, and a party is not one platform. Half the room
  // installing an iOS link is the failure this points at. This runs in a
  // browser, needs no install and costs nothing, which is what `materials`
  // already says the game needs — a phone each, not an account each.
  externalUrl: "https://imposter.app/",
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
    "which is the argument for never letting a recommended game be " +
    "required.\n\n" +
    "THE LINK, CHECKED 2026-09-05, and the date is the point: the caveat " +
    "says this can be pulled or paywalled, so a check with no date on it is " +
    "a check nobody can tell the age of. Live and reachable. It plays in a " +
    "browser with no install and no account, and there are also iOS and " +
    "Android apps, both free to install with paid upgrades inside them. " +
    "Nothing about how it is played was read, recorded or reproduced here, " +
    "and nothing about it should be: db/010 grants the house two rights " +
    "over somebody else's game and this is the second one being exercised.",

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
      code: "board_games",
      weight: 1,
      note:
        "A phone in the middle of a table and everybody round it. The closest thing in this pool to a boxed game.",
    },
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

  occasions: [],
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
  // LIFTED 2026-09-06 with every other forbid in this file. It said:
  // "The house never mentions anything that did not exist in 1976 — no links,
  // no apps, no confirming online. This is not a low score under this
  // destination, it is a structural no." Founder: "also forget this limiting
  // rule that we have to be era specific and cannot have later tech." The room
  // is a register, not a time machine — see EVERY FORBID LIFTED at the top of
  // this file. The `never` line in Westhampton's VOICE block is a different
  // rule wearing the same words and is untouched.
  worlds: [],
};

/* ═══════════════════════════════════════════════════════════════════
 * THE TWENTY ROOM GAMES — CLAUDE.md rule 29
 *
 * "EVERY ROOM MAY HAVE GAMES. `GAMES: none` IS NOT A RULING." Founder,
 * twice: "lets not make a blanket rule that a room is gameless", then "i
 * told you that they can have games." Nothing below adjudicates anything.
 *
 * WHERE THESE COME FROM. `src/lib/destinations.ts` carries twenty
 * `piece: "game_rule"` entries across the eighteen authored rooms — two each
 * at Amalfi and Aspen, one everywhere else. Each is a game the founder wrote
 * in that room's own voice. Until this file grew the block below, not one of
 * them was a row: the `game` table held seven rows and every game_world row on
 * them named westhampton-1976, so seventeen rooms had no game written for
 * them. That was an AUTHORING ABSENCE and never a property of a room.
 *
 * ── WHAT IS HERS AND WHAT IS OURS, SEPARATED AT THE SITE ────────────
 *
 * The distinction a prior pass established and this block is written under:
 * A VOICE LINE IS A SENTENCE, AND A `game` ROW NEEDS RULES, BOUNDS, A HOST
 * ROLE AND A RUNBOOK (db/010, db/025). So each game below carries her
 * sentence VERBATIM, in `notes`, under the fixed heading `HER RULE,
 * VERBATIM:`, and prints it on its own rules card as the room writes it.
 * Nothing paraphrases it and nothing improves it.
 *
 * Everything else — how it starts, how long it runs, what the host does, how
 * it ends, how many can play, what it needs — was AUTHORED HERE and is the
 * house's. It is marked as such in the same field, under `AUTHORED HERE:`, so
 * that what she may cut is separable from what she wrote without anybody
 * having to guess which is which. `src/lib/games.test.ts` checks that the
 * quoted sentence is character-for-character a `game_rule` piece of the room
 * the game claims, which is the only part of this block a later edit cannot
 * silently drift.
 *
 * ── NATIVE, AND WHY IT IS NATIVE AND NOT AFFINITY ───────────────────
 *
 * Every one of these claims `native: true` on its own room and nothing else.
 * CLAUDE.md rule 23: `native` is a WHITELIST — a game with any native scope is
 * eligible only under the destinations it claims — and `affinity` is a weight
 * that says nothing at all about eligibility. A game written in one room's
 * voice is the whitelist case exactly. Havana's song game is not a game the
 * house "would allow" at Nantucket; it is Havana's.
 *
 * THE SEVEN EXISTING GAMES ARE NOT RESCOPED. They carry affinities to
 * westhampton-1976 and no native claim, so they stay playable everywhere,
 * which is what an affinity has always meant and what rule 23 exists to stop
 * anyone re-reading.
 *
 * THE CONSEQUENCE, STATED BECAUSE IT BITES: five authored rooms are not keyed
 * into `DESTINATIONS` yet — amalfi-1953, aspen-1994, palm-springs-1965,
 * oaxaca-1954, st-moritz-1984 — so `world` has no row for them when
 * `seed:games` runs. A native claim that cannot resolve is not a harmless
 * skip: it turns a whitelist into NO CLAIM, and a game written for one room
 * becomes eligible in all eighteen, silently, which is CLAUDE.md rule 16's
 * exact shape. scripts/seed-games.mjs therefore HOLDS such a game as a draft
 * and says so, rather than offering it unscoped. Seven of the twenty are in
 * that position on a fresh build and are drafts on purpose.
 *
 * ── RULE 25's THREE TESTS, APPLIED TO EVERY ONE OF THEM ─────────────
 *
 *   1. BOOKABLE AT BACKYARD SIZE. Nothing below needs a boat, a slope, a pool
 *      or a lift that the room's own material does not already establish. The
 *      three that come near it — the boat count, the temperature at the top,
 *      and the swim that ends the last song — are the founder's own sentences
 *      naming the room's own furniture, and each carries a `caveat` saying so
 *      in a line a host can act on before she starts rather than at the moment
 *      somebody has to go in.
 *   2. NO PROPER NOUN A GUEST WOULD NOT SAY AT THE TABLE. No place name, no
 *      brand, no landmark reaches a name, a rule, a step or a printed piece.
 *      Room slugs appear in slugs and in world scopes, which are identifiers
 *      and not writing.
 *   3. NO STAFF. Every host role below is `plays_too`. Not one of these games
 *      spends a person: the calling is done by somebody who is also playing,
 *      which is the founder's own line at Amalfi — "whoever is calling is
 *      playing too" — and Acapulco's structural version of the same rule,
 *      "there is no staff in this voice; things appear, nobody serves them."
 *
 * ── THEY GO LIVE, WITH ONE HELD ─────────────────────────────────────
 *
 * db/038 settled the classification: a game row is SHELF, not WORLD, so the
 * pool stocks itself and the desk vetoes. These are created live like every
 * other pool row. THE ONE EXCEPTION IS NANTUCKET, which carries the
 * founder-pending marker in its own text for a reason written there, and is
 * therefore the first row in this file's history to exercise the hold-back the
 * seeder built before it was needed.
 *
 * ── FIVE STORY GAMES, AND THAT IS A FINDING RATHER THAN A DUPLICATION
 *
 * New Orleans, Catskills, Côte d'Azur, Big Sur and Oaxaca all sit a room down
 * and tell stories, which is the same shape the Fishbowl audit found across
 * the noun-game slips and the Celebrity deck. They are NOT one game in five
 * places, and the difference is the engine rather than the surface: New
 * Orleans passes the ending to the left, Catskills rewards the version
 * furthest from a book nobody opens, Côte d'Azur hides one liar, Big Sur
 * forbids hurrying and forbids checking, and Oaxaca invites the interruption
 * the other four forbid. Written down here so the next audit counts five
 * engines rather than one repetition.
 *
 * ── THE CLARITY PASS, AND WHAT IT SUPERSEDED ────────────────────────
 *
 * Founder, on the whole block: *"rewrite all the games to make the how to
 * play super clear, not abstract."* Every `runbook` and most of the
 * `howItWorks` prose below was rewritten against one test — A HOST WHO HAS
 * NEVER SEEN THE GAME CAN RUN IT FROM THE TEXT ALONE, WITH NOTHING LEFT TO
 * INTERPRET. Her twenty sentences are untouched and the verbatim test still
 * compares them character-for-character against `destinations.ts`.
 *
 * WHAT THE EARLIER DRAFT WAS ACTUALLY MISSING, because the pattern repeated
 * across nearly all twenty and is the thing to check first in the next one:
 *
 *   TURN ORDER. "Round the table" without saying from whom or which way.
 *   Eleven games said it. A round with no stated first player is a round a
 *   host starts by pointing at somebody, which is the one thing several of
 *   these games are built to avoid.
 *
 *   THE TIE. Nearly every game with a winner had no answer for two of them,
 *   and at these table sizes a tie is the ordinary result rather than the
 *   edge case — six to ten names tie at the top of a tally more often than
 *   not. A host settling that in front of everybody is inventing a rule
 *   under the worst possible conditions.
 *
 *   THE ENDING. Several ended on an OBSERVATION rather than a CONDITION:
 *   "the first ending the table repeats back", "the line whose author does
 *   not remember saying it", "when somebody finishes and nobody starts",
 *   "stop one round earlier than the table wants to". Each is a true thing
 *   about a good night and none of them is an instruction — they can fail to
 *   happen, and two of the four were in FINALES, where the failure is the
 *   last thing that happens all evening. Endings are now conditions:
 *   everybody has gone, the bag is empty, the parcels have run out, the
 *   chain has come back to her.
 *
 *   WHO WINS, AND WHAT WINNING IS. Games with no winner did not say so, and
 *   games with one did not say what the winner got. Both now say it plainly;
 *   several of these correctly award nothing at all.
 *
 *   THE MECHANIC ITSELF, in three places, which is the worst of it: the
 *   Vegas table was told to teach a dice game in two minutes and never told
 *   which game; the Amalfi cards named a line, two lines and a full card
 *   without saying how many numbers are on a card; and Aspen's voices were
 *   won by whoever was "guessed fastest", which nobody timed.
 *
 * THE GENERAL FORM, and it is rule 3's shape applied to instructions: THE
 * EARLIER DRAFT WROTE WHAT A GOOD NIGHT LOOKS LIKE AND CALLED IT A RULE.
 * Both are worth having and they are not the same document — the observation
 * belongs in `detail`, where it says why, and the rule belongs in
 * `instruction` and in `howItWorks`, where a host acts on it at nine
 * o'clock with eleven people waiting. Where a rewrite added a mechanic
 * rather than clarifying one, the superseded reasoning is preserved in that
 * game's own `notes` under rule 14, with what beat it.
 *
 * TWO DEFECTS FOUND IN PASSING AND FIXED, both of the same kind — a game
 * whose forfeit cannot be settled because the paper carries no name.
 * Nantucket's guess card was printed as "One line, and no room for a name"
 * while the game turns on which named person was closest, and the Dolomites
 * slips had the same hole. Both cards now carry a name.
 * ═══════════════════════════════════════════════════════════════════ */

/**
 * The provenance line every room game carries, and the separation it makes.
 *
 * One constant rather than twenty copies, because the sentence it makes is a
 * claim about the WHOLE BLOCK and a claim made twenty times drifts nineteen
 * times.
 */
const ROOM_VOICE =
  "The founder's own, from that room's `piece: \"game_rule\"` in " +
  "src/lib/destinations.ts. THE RULE IS HER SENTENCE AND IT IS VERBATIM — " +
  "quoted whole in `notes` and printed on the rules card as she wrote it. " +
  "The bounds, the supplies, the requirements, the runbook and the " +
  "contingencies were AUTHORED HERE and are the house's, marked as such in " +
  "the same field so that what she may cut is separable from what she wrote.";

/**
 * WESTHAMPTON — THE HOUSEGUEST LIST.
 *
 * An ambient game with a score nobody is allowed to see, which is the whole
 * mechanism: the not-knowing is what runs for three days.
 */
const WESTHAMPTON_THE_HOUSEGUEST_LIST: Game = {
  slug: "westhampton-the-houseguest-list",
  name: "The Houseguest List",
  description:
    "Everyone names the houseguest, once, quietly, and nobody may name " +
    "themselves. The house writes it down and does not say what the tally is.",
  howItWorks:
    "Every person in the house comes and says one name to the host, on their " +
    "own, at any point before the last dinner: whoever here is most the " +
    "houseguest. The one who arrives with nothing. The one who never goes to " +
    "bed. The one the house is actually for. It is said out loud, to her " +
    "only, and nothing is written in front of the person saying it.\n\n" +
    "Nobody names themselves. Anybody who tries is told not yourself and " +
    "names somebody else, and that is the whole of the enforcement.\n\n" +
    "The host keeps the names on a pad that lives out of the room, one to a " +
    "line, in the order they were said. She never shows it, never says a " +
    "number, and never uses it to settle anything else.\n\n" +
    "The naming closes when the last dinner is served. She counts alone " +
    "beforehand; if two names are level, the one that reached that count " +
    "first wins, which is why the pad is kept in order. At the table she " +
    "says the winning name once, with no count and no runners-up, and then " +
    "tears the page up in front of everybody. Nobody wins anything and there " +
    "is nothing to collect.",
  materials:
    "THE HOUSE PRINTS one card, for the door. YOU SUPPLY a small pad that " +
    "lives in a drawer in a room the party is not in, and a pencil kept " +
    "with it so writing a name is never a search.",

  shape: "ambient",
  sourcing: "provided",
  minGuests: 6,

  scoring:
    "A private tally. One name per person, counted by whoever holds the pad. " +
    "It is read once, at the end, as a single name and never as a number.",

  sourceNote: ROOM_VOICE,
  notes:
    'HER RULE, VERBATIM: "Everyone names a houseguest. Nobody names ' +
    'themselves. The house keeps score and will not show it."\n\n' +
    "AUTHORED HERE: the ambient shape, the weekend span, the six-guest " +
    "floor, the pad and where it lives, the closing of the naming before the " +
    "last dinner, and every runbook step and contingency. The reading of one " +
    "name at the end is the house's addition and is the first thing to cut " +
    "if she wants the score never shown at all — her sentence permits both " +
    "and does not choose.\n\n" +
    "THE TIE RULE IS NEW AND IS THE HOUSE'S. A tally of six to ten names " +
    "ties at the top more often than not, and the earlier draft named one " +
    "winner without saying what to do when there are two — which left the " +
    "host inventing a rule at the table with everybody watching. Earliest to " +
    "reach the count wins, which is why the pad is now kept in order. Her " +
    "sentence says the house keeps score and does not say how it breaks one.",

  runbook: {
    hostRole: "plays_too",
    hostNote:
      "You name one too, and somebody else writes yours down. The only job " +
      "that is yours alone is the pad, and the pad lives where nobody goes.",
    steps: [
      {
        step: "hide_the_pad",
        phase: "before",
        instruction: "Put the pad somewhere nobody wanders, and keep the pencil with it.",
        detail:
          "A drawer in a room that is not the room. A pad on the counter is " +
          "a pad somebody reads, and the game is over the moment one person " +
          "knows a number.",
        supplyItem: "A pad kept out of sight",
      },
      {
        step: "decide_when_it_closes",
        phase: "before",
        instruction: "Fix the meal the naming closes at, and do not move it once you have said it.",
        detail:
          "The last dinner. Naming closes when those plates go down: nothing " +
          "is taken after that, including from somebody who says they were " +
          "about to. A game that closes when the host feels like closing it " +
          "is a game somebody suspects of being steered.",
      },
      {
        step: "say_it_once",
        phase: "opening",
        instruction: "At the first dinner, with everybody sitting down, say the rule once.",
        detail:
          "Once, at a full table, and never explained again. Say the three " +
          "things it needs: one name each, said to you on your own, and not " +
          "yourself. Repeating it later turns a standing arrangement into a " +
          "running bit.",
        say: "Some time before the last dinner, find me on your own and tell me one name: whoever here is the houseguest. Not yourself. I will not tell anybody what you said.",
        printedPiece: "rules_card",
      },
      {
        step: "take_them_privately",
        phase: "underway",
        instruction: "Take each name where nobody can hear it, and write it on the pad in order.",
        detail:
          "In the kitchen, on the stairs, halfway down the lane. Nothing is " +
          "written in front of the person — you go to the pad afterwards and " +
          "put the name on the next line down, because the order is what " +
          "settles a tie later. A name of somebody who is not in the house " +
          "does not go on the pad.",
        supplyItem: "A pad kept out of sight",
      },
      {
        step: "if_somebody_names_themselves",
        phase: "underway",
        instruction: "Say not yourself, and wait. Do not write anything down until they go again.",
        detail:
          "Two people try it, one of them as a joke. Said flatly and once, " +
          "they name somebody else in four seconds and it costs the weekend " +
          "nothing. It is the only rule in this game that gets enforced at " +
          "all.",
        say: "Not yourself.",
      },
      {
        step: "refuse_the_first_leak",
        phase: "underway",
        instruction: "When somebody asks who is winning, say you have not counted.",
        detail:
          "Somebody asks on the first night, always, and the answer sets the " +
          "tone for three days. You have not counted. You are not going to.",
        say: "I have not counted.",
      },
      {
        step: "catch_whoever_arrives_late",
        phase: "underway",
        instruction: "Say the rule once, on their own, to anybody who arrives after the first dinner.",
        detail:
          "On their own and in the same words, so a person who missed the " +
          "table is not the only one playing a slightly different game. " +
          "Somebody who arrives on the last afternoon still gets asked.",
      },
      {
        step: "chase_the_two_who_forgot",
        phase: "underway",
        instruction: "On the last afternoon, quietly ask anyone who has not named one.",
        detail:
          "Two people will have meant to and not got round to it. Asked " +
          "alone they answer in four seconds; asked at the table they " +
          "perform an answer.",
      },
      {
        step: "count_it_alone_beforehand",
        phase: "deciding",
        instruction: "An hour before the last dinner, count the pad alone and settle any tie yourself.",
        detail:
          "Alone, and once. Most names get one or two, so a tie at the top is " +
          "the usual result rather than the unusual one: THE NAME THAT " +
          "REACHED THAT COUNT FIRST WINS, which the order on the pad tells " +
          "you. Nobody is ever told a tie happened.",
        supplyItem: "A pad kept out of sight",
      },
      {
        step: "read_the_one_name",
        phase: "ending",
        instruction: "At the last dinner, say the one name out loud. No count, no runners-up.",
        detail:
          "One name and no arithmetic. A number invites a recount and a " +
          "recount is the argument this game was built to avoid. Nothing is " +
          "won and nothing is handed over — the name is the whole of it.",
        say: "The houseguest is you. That is all I am saying about it.",
      },
      {
        step: "destroy_the_pad",
        phase: "ending",
        instruction: "Tear the page out in front of everybody and get rid of it.",
        detail:
          "In front of them, before anybody leaves the table, so nobody " +
          "spends the drive home wondering who said what. The paper going is " +
          "the end of the game and there is nothing after it.",
      },
    ],
    contingencies: [
      {
        trouble: "will_not_play",
        answer:
          "Somebody who does not want to name anyone is not named as a " +
          "refuser and is not asked twice. Take the names you have. The " +
          "tally was never going to be published, so a missing one costs " +
          "nothing at all.",
      },
      {
        trouble: "under_minimum",
        answer:
          "Under six, one or two names decide it and everybody can work out " +
          "who said what, which is precisely what the secrecy was for. Below " +
          "six, drop it and keep the pad for the temperature guesses instead.",
      },
      {
        trouble: "over_size",
        answer:
          "A big house is where this is best. Do not read the top name to a " +
          "room of thirty, though: say it to the person, on the way past, " +
          "and let them decide whether the room hears it.",
      },
      {
        trouble: "running_long",
        answer:
          "It cannot run long, but it can run past its ending. If the last " +
          "dinner comes and half the names are missing, close it anyway and " +
          "read the top of what you have.",
      },
      {
        trouble: "played_before",
        answer:
          "A returning guest knows the pad exists and will campaign, badly " +
          "and on purpose. That is the game improving with age. Write the " +
          "campaigning down as a name for whoever is doing it.",
      },
      {
        trouble: "not_landing",
        answer:
          "If nobody is naming anyone by the second night, stop asking. Do " +
          "not announce that it is over — an ambient game that quietly stops " +
          "leaves no hole, and an announced failure leaves one all weekend.",
      },
    ],
  },

  facets: [
    {
      dimension: "group_fun",
      code: "board_games",
      weight: 0.4,
      note:
        "A pad, a pencil and a tally kept by the house. Quiet and sitting down.",
    },
    {
      dimension: "group_fun",
      code: "keep_a_secret",
      weight: 1,
      note: "The whole mechanism is a score nobody is allowed to see.",
    },
    { dimension: "affinity", code: "wit", weight: 0.9 },
    {
      dimension: "group_fun",
      code: "talk_deep",
      weight: 0.6,
      note: "The naming happens on the stairs and in the kitchen, one to one.",
    },
    { dimension: "affinity", code: "one_moment", weight: 0.5 },
    { dimension: "affinity", code: "late", weight: 0.4 },
    {
      dimension: "group_fun",
      code: "compete",
      weight: 0.3,
      note: "There is a top name, and nobody is told how close it was.",
    },
    {
      dimension: "anti_preference",
      code: "forced_fun",
      weight: 0.2,
      note:
        "Everybody is asked, and a guest who says nothing is the only one " +
        "who has opted out of anything all weekend.",
    },
  ],

  occasions: [],
  slots: [
    {
      slotCode: "game",
      fit: "native",
      note: "db/061 collapsed the five game beats into one. This is the beat now, and she chooses among what the room offers.",
    },
    { slotCode: "ambient_game", fit: "native" },
  ],

  supplies: [
    {
      item: "A pad kept out of sight",
      detail: "Small, and in a drawer in a room the party is not in.",
      source: "on_hand",
      quantity: 1,
    },
    {
      item: "A pencil",
      detail: "Kept with the pad, so writing a name is never a search.",
      source: "on_hand",
      quantity: 1,
    },
  ],
  requirements: [
    { requirement: "printing" },
    {
      requirement: "host_to_run_it",
      note: "Somebody holds the pad for three days. She plays as well; the pad is the only part that is hers alone.",
    },
  ],
  printedMatter: [
    {
      piece: "rules_card",
      label: "The rule",
      description:
        "Her sentence, whole, on one card by the door: Everyone names a " +
        "houseguest. Nobody names themselves. The house keeps score and will " +
        "not show it.",
      voicePiece: "game_rule",
      quantity: 1,
    },
  ],
  dependencies: [],
  worlds: [
    {
      world: "westhampton-1976",
      native: true,
      note: "Written in this room's voice. Rule 23: a native claim is a whitelist, so it goes nowhere else.",
    },
  ],
};

/**
 * HAVANA — THE SONG THAT GETS YOU UP.
 *
 * The two halves of her sentence only work together: you name the song that
 * gets somebody up, and you may not name your own, so every song in the queue
 * was chosen for a person by somebody watching them.
 */

/**
 * VEGAS — THE LATE SUPPER.
 *
 * The one game in this block whose object is a take-home: the person who is up
 * at midnight signs the supper away, and the written stake is what a guest
 * keeps. `from game yields_iou` in the take-home bank is aimed at this.
 */
const VEGAS_THE_LATE_SUPPER: Game = {
  slug: "las-vegas-the-late-supper",
  name: "The Late Supper",
  description:
    "Everybody puts in the same and plays for it. Whoever is up at midnight " +
    "buys the late supper, signs for it, and that is the end of it.",
  howItWorks:
    "Everybody puts in the same. Not money — the same handful of counters, " +
    "twenty each, counted out identically before anybody sits down so nobody " +
    "starts richer.\n\n" +
    "Then it is played for at one table, and the house's default is a dice " +
    "game that takes two minutes to teach. Each hand starts with everybody " +
    "pushing one counter into the middle. The cup goes round to the left. On " +
    "your turn you shake five dice out of it, then pick up any of them you " +
    "do not want and throw those once more — one re-throw and no more — and " +
    "what is left in front of you is your hand. Five of a kind beats four of " +
    "a kind, which beats a full house, which beats three of a kind, then two " +
    "pairs, then a pair, then the highest single die. When everybody has " +
    "thrown, the best hand takes the middle. Two equal best hands split it " +
    "and the odd counter stays in the middle for the next one.\n\n" +
    "Anybody who runs out of counters is out of the hands, keeps their seat, " +
    "and is one of the people the supper is being bought for. Any other game " +
    "the room already knows may be swapped in, so long as everybody started " +
    "level and it stops at midnight.\n\n" +
    "At midnight the table stops mid-hand and the piles are counted. Whoever " +
    "is holding the most buys the late supper, signs a card for it in front " +
    "of everybody, and keeps the card. If two piles are level, both of them " +
    "sign and they buy it between them. Nothing is settled in money and " +
    "nothing carries to tomorrow, which is what the last clause of her rule " +
    "is for: every counter goes back in the bag before anybody stands up.",
  materials:
    "THE HOUSE PRINTS one card, the one that gets signed at midnight, and " +
    "it sits face up in the middle all evening. YOU SUPPLY two dice cups " +
    "with five dice each, an identical stake of counters at every place — " +
    "chips, matches, almonds, anything nobody would mistake for money — " +
    "and a bag to put them back in.",

  shape: "scheduled",
  sourcing: "provided",
  durationMinutes: 60,
  durationMaxMinutes: 90,
  minGuests: 4,
  maxGuests: 10,

  scoring:
    "Everybody starts with an identical stake and plays for it. At midnight " +
    "the largest pile buys the late supper. Counters are never converted to " +
    "money and the pile does not travel to another night.",
  currencyLabel: "the stake",

  caveat:
    "It is a game played for something, and a table that has not agreed what " +
    "the late supper costs has agreed to an open number. Say the figure out " +
    "loud before the first throw, and make it the price of a round.",

  sourceNote: ROOM_VOICE,
  notes:
    'HER RULE, VERBATIM: "Everybody puts in the same. Whoever is up at ' +
    'midnight buys the late supper, and that is the end of it."\n\n' +
    "AUTHORED HERE: dice as the default game, the counter stake in place of " +
    "money, the four-to-ten table, the sixty-to-ninety minute block, the " +
    "signed card, and every step and contingency. THE SIGNED CARD IS THE " +
    "LOAD-BEARING ADDITION and the reason to read this row twice: the " +
    "take-home bank's Vegas IOU declares `from game yields_iou`, which is a " +
    "dependency on a game that leaves a written stake behind. Her sentence " +
    "describes the obligation; the card is the house making it an object.\n\n" +
    "THE DICE GAME IS NOW WRITTEN OUT, AND THE EARLIER DRAFT'S REFUSAL TO " +
    "WRITE IT WAS THE DEFECT. It said the table plays whatever game the room " +
    "already knows and that the house does not care which — true as a " +
    "principle and useless at nine o'clock, because the next instruction was " +
    "to teach it in two minutes and nothing anywhere said what IT was. A " +
    "host with dice cups in her hands and no rules is a host who does not " +
    "run this. The default is written out in full: an ante, one throw with " +
    "one re-throw, a hand ranking, and the best hand taking the middle. It " +
    "is a folk dice game, owned by nobody, printable for the same reason " +
    "Fishbowl is, and it was chosen over the hidden-bidding version because " +
    "that one needs a cup in front of every person at once and this row buys " +
    "two. The permission to swap in another game survives as a sentence " +
    "rather than as the whole answer. THREE RULINGS ADDED beside it, each covering " +
    "a thing that happens at every table and had no answer: a player whose " +
    "counters run out keeps their seat and stops playing hands, a latecomer " +
    "buys in for the same twenty until eleven, and level piles at midnight " +
    "both sign and buy it between them rather than throwing for it.",

  runbook: {
    hostRole: "plays_too",
    hostNote:
      "You play, with the same stake as everybody else. The two things that " +
      "are yours are counting the stakes out level at the start and stopping " +
      "the table at midnight whoever is winning.",
    steps: [
      {
        step: "count_the_stakes_out",
        phase: "before",
        instruction: "Count twenty counters into a pile at every place before anybody sits down.",
        detail:
          "Twenty each, counted out in advance, so nobody watches the " +
          "counting and nobody can say a pile started bigger. Leave the rest " +
          "in the bag for anybody who joins later. This is the only part of " +
          "the evening that has to be exactly fair.",
        supplyItem: "A stake of counters, identical for everybody",
      },
      {
        step: "put_the_card_where_it_can_be_seen",
        phase: "before",
        instruction: "Put the unsigned card in the middle of the table, face up.",
        detail:
          "It sits there all evening being the thing somebody is going to " +
          "have to sign. That is most of the pressure this game has.",
        printedPiece: "the_iou",
      },
      {
        step: "say_the_figure",
        phase: "opening",
        instruction: "Say what the late supper costs, out loud, before the first throw.",
        detail:
          "The one sentence that keeps this off a host's conscience. A table " +
          "that agreed to a number is playing a game; a table that did not " +
          "is running a tab.",
        say: "Everybody has the same. Whoever is up at midnight buys the late supper, and the late supper is a round of what we are drinking.",
        minutes: 3,
        printedPiece: "the_iou",
      },
      {
        step: "teach_it_in_two_minutes",
        phase: "opening",
        instruction: "Teach it with the cups in your hands, playing one hand out loud for nothing.",
        detail:
          "Demonstrated, never read. One counter each into the middle. The " +
          "cup goes round to the left; on your turn you shake out five dice, " +
          "pick up any you do not want and throw those once more, and stop " +
          "there. Five of a kind, four of a kind, full house, three of a " +
          "kind, two pairs, a pair, highest die. When the cup has been all " +
          "the way round, the best hand takes the middle, and two equal " +
          "hands split it with the odd counter left in for the next one.",
        minutes: 4,
        supplyItem: "Dice cups, five dice each",
      },
      {
        step: "play_it",
        phase: "playing",
        instruction: "Play hands until midnight. Do not keep a written record of anything.",
        detail:
          "The piles are the record. A written tally invites a recount, and " +
          "a recount at half past eleven is how this ends badly. Anybody who " +
          "runs out of counters keeps their seat and stops playing hands. " +
          "Anybody arriving before eleven buys in for twenty out of the bag; " +
          "after eleven nobody joins.",
        minutes: 45,
      },
      {
        step: "call_midnight",
        phase: "deciding",
        instruction: "At midnight, stop the table mid-hand and have everybody count their own pile.",
        detail:
          "Mid-hand and not at the end of one. The clock is the rule, and a " +
          "table allowed to finish a hand is a table allowed to finish two. " +
          "Each person counts their own out loud and says the number.",
        say: "That is midnight. Hands down, count what you have.",
        minutes: 8,
      },
      {
        step: "sign_it",
        phase: "ending",
        instruction: "The largest pile signs the card, and the table watches it happen.",
        detail:
          "Signed in front of everybody, and then it belongs to whoever is " +
          "buying — not to the house. If two piles are level, both sign the " +
          "same card and buy it between them; there is no play-off and no " +
          "extra throw. It is the only thing that leaves this table with a " +
          "person on it.",
        say: "You are up. Sign it.",
        minutes: 5,
        printedPiece: "the_iou",
      },
      {
        step: "sweep_the_counters",
        phase: "ending",
        instruction: "Put every counter back in the bag in front of the table.",
        detail:
          "This is her last clause made physical. Nothing carries, nothing " +
          "is owed tomorrow, and nobody goes to bed a hundred and forty up.",
        say: "And that is the end of it.",
        minutes: 5,
      },
    ],
    contingencies: [
      {
        trouble: "will_not_play",
        answer:
          "Somebody who will not play for anything is given the clock and " +
          "the card. Calling midnight is a real job and it is the one job " +
          "that has to be done by somebody with nothing at stake.",
      },
      {
        trouble: "under_minimum",
        answer:
          "Under four this is two people and a grudge. Run it as one round " +
          "for the whole table, all in on a single throw, and take the " +
          "hour back.",
      },
      {
        trouble: "over_size",
        answer:
          "Above ten, run two tables with identical stakes and settle it " +
          "between the two largest piles at midnight. Do not run one table " +
          "of fourteen; the wait between throws is where it dies.",
      },
      {
        trouble: "running_long",
        answer:
          "It cannot run long, because midnight ends it. If midnight is too " +
          "far off, move the ending to the hour and say so before the first " +
          "throw rather than after.",
      },
      {
        trouble: "played_before",
        answer:
          "Somebody who has played will start slowly and end enormous, on " +
          "purpose, and will be the person holding the card. That is the " +
          "game being played correctly and it costs them a round.",
      },
      {
        trouble: "not_landing",
        answer:
          "If the table is quiet by the third round, the game is wrong and " +
          "the stake is right. Switch to whatever card game the room " +
          "already knows, keep the piles where they are, and carry on.",
      },
    ],
  },

  facets: [
    {
      dimension: "group_fun",
      code: "board_games",
      weight: 0.8,
      note:
        "A table, a bank, everybody in for the same. Rules and a settlement.",
    },
    { dimension: "group_fun", code: "play_for_stakes", weight: 1 },
    { dimension: "group_fun", code: "compete", weight: 0.9 },
    { dimension: "affinity", code: "late", weight: 0.7 },
    { dimension: "affinity", code: "wit", weight: 0.4 },
    { dimension: "affinity", code: "ritual", weight: 0.3 },
    {
      dimension: "anti_preference",
      code: "surprise_cost",
      weight: 0.9,
      note:
        "One person leaves having bought supper for the table. A host who " +
        "vetoed anything that surprises the wallet is vetoing exactly this, " +
        "and the caveat is what keeps it from being a surprise.",
    },
    {
      dimension: "anti_preference",
      code: "forced_fun",
      weight: 0.3,
      note: "Sitting down at the table is opting in to buying supper.",
    },
  ],

  occasions: [],
  slots: [
    { slotCode: "game", fit: "native" },
    { slotCode: "the_moment", fit: "native" },
  ],

  supplies: [
    {
      item: "Dice cups, five dice each",
      detail: "Two cups is enough for a table of ten passing them round.",
      source: "host_buys",
      quantity: 2,
      leadTimeDays: 7,
    },
    {
      item: "A stake of counters, identical for everybody",
      detail:
        "Chips, matches, almonds. Anything countable that nobody would " +
        "mistake for money, in the same number for each place.",
      source: "host_buys",
      perGuest: true,
      leadTimeDays: 7,
    },
    {
      item: "A bag for the counters",
      detail: "The counters go back into it in front of the table, which is how the game ends.",
      source: "on_hand",
      quantity: 1,
    },
  ],
  requirements: [
    { requirement: "table_space", note: "One table, everybody at it, cups passing." },
    { requirement: "printing" },
    {
      requirement: "prizes",
      note: "The supper is the prize and it is bought rather than won, which is the whole joke.",
    },
  ],
  printedMatter: [
    {
      piece: "the_iou",
      label: "The card that gets signed",
      description:
        "Her sentence, whole, at the head: Everybody puts in the same. " +
        "Whoever is up at midnight buys the late supper, and that is the end " +
        "of it. Under it one line and a rule for a signature. It sits face " +
        "up in the middle all evening and leaves with whoever is up at " +
        "midnight. This is the written stake this room's take-home IOU " +
        "depends on.",
      voicePiece: "game_rule",
      quantity: 1,
    },
  ],
  dependencies: [],
  worlds: [
    {
      world: "las-vegas",
      native: true,
      note: "Written in this room's voice. A whitelist, per rule 23.",
    },
  ],
};

/**
 * NEW YORK — THE LIST.
 *
 * A finale in the strict db/010 sense: it spends what the evening produced and
 * it is the last thing. The destruction is not decoration; it is the reason
 * anybody says anything true.
 */
const NEW_YORK_THE_LIST: Game = {
  slug: "new-york-the-list",
  name: "The List",
  description:
    "Each guest names one thing that will not be repeated. The list is read " +
    "at midnight, and then it is destroyed in front of everybody.",
  howItWorks:
    "A bowl, slips and pencils sit out from the start of the evening. One " +
    "slip each, written whenever a person feels like it and folded into the " +
    "bowl. On it goes one thing that will not be repeated: not a resolution " +
    "and not a regret — a thing that happened, or was said, or was worn, and " +
    "is not going to happen again. One line, no names, nothing signed.\n\n" +
    "At midnight one person reads. The reader takes the slips out one at a " +
    "time and reads every one aloud, flat and in their own voice, in the " +
    "order they come out. Nobody says whose is whose, nobody guesses out " +
    "loud, and nothing is skipped — including the blank ones, which are read " +
    "as blank and passed over without comment.\n\n" +
    "Nobody wins. There is no vote on the best one and no prize.\n\n" +
    "Then the reader tears the slips up into the bowl in front of everybody, " +
    "and the evening is over. That is the part that makes the first part " +
    "possible: everybody writes a truer slip when they have watched last " +
    "year's go.",
  materials:
    "THE HOUSE PRINTS the slips, one a head, cut so they tear cleanly. " +
    "YOU SUPPLY a wide bowl for the middle of the table and pencils in " +
    "three places, so writing one is never a search.",

  shape: "finale",
  sourcing: "provided",
  durationMinutes: 10,
  durationMaxMinutes: 20,
  minGuests: 4,

  sourceNote: ROOM_VOICE,
  notes:
    'HER RULE, VERBATIM: "Each guest names one thing that will not be ' +
    'repeated. The list is read at midnight and then it is destroyed."\n\n' +
    "AUTHORED HERE: the finale shape, the anonymity of the slips, the " +
    "ten-to-twenty minute block, the four-guest floor, tearing rather than " +
    "burning, and every step and contingency. TEARING IS A DELIBERATE " +
    "SUBSTITUTION and the one place this row departs from the obvious " +
    "reading: destroyed suggests a flame, and a flame is a thing an " +
    "apartment cannot honour. Rule 25's first test decides it — the game has " +
    "to work in the smallest room that books this evening.\n\n" +
    "THE READER IS NOW NAMED IN ADVANCE AND IS NOT THE HOST. The earlier " +
    "draft said the job could be handed to anybody at the table, which is a " +
    "decision made at five to midnight in front of everybody, and the " +
    "obvious person to hand it to is whoever looks least likely to have " +
    "written anything. Chosen before the evening, it is nothing. It also " +
    "answers the one question this game invites and had no answer for — " +
    "somebody guessing out loud whose slip is whose — because the reader has " +
    "a line to say and reads on. This is a finale, and the last five minutes " +
    "of an evening are not where a host should be inventing procedure.",

  runbook: {
    hostRole: "plays_too",
    hostNote:
      "You write one and it goes in the bowl unsigned like everybody " +
      "else's. Reading is the only job in the game and it is better given " +
      "away before the evening starts than taken by you at midnight.",
    steps: [
      {
        step: "set_the_bowl_out_early",
        phase: "before",
        instruction: "Put the bowl, the slips and the pencils out before anybody arrives.",
        detail:
          "Out early and never announced, so that writing one is something " +
          "people drift over to rather than something that starts. One slip " +
          "per person and four spare, because somebody always wants a second " +
          "go at theirs.",
        supplyItem: "A bowl",
        printedPiece: "list_slips",
      },
      {
        step: "decide_who_reads",
        phase: "before",
        instruction: "Decide now who reads at midnight, and let it be somebody other than you.",
        detail:
          "One reader for the whole list, chosen before the evening rather " +
          "than at five to twelve. Yours goes in the bowl too, so a reader " +
          "who is not the host is one more person who cannot be watched for " +
          "a reaction to their own slip.",
      },
      {
        step: "say_it_once_at_the_table",
        phase: "opening",
        instruction: "Say what the bowl is for, once, while everybody is seated.",
        detail:
          "Once, at the table, and then leave it alone. Say the four things " +
          "it needs: one slip each, one line on it, nothing signed, and the " +
          "hour they get read. Chasing slips afterwards turns a confession " +
          "into homework.",
        say: "There is a bowl by the door. One thing on a slip that will not be repeated, one line, do not sign it. At midnight every one of them gets read out and then they get torn up.",
        minutes: 2,
        printedPiece: "list_slips",
      },
      {
        step: "let_them_write_all_evening",
        phase: "opening",
        instruction: "Leave the bowl alone until five to midnight, and tell latecomers at the door.",
        detail:
          "The good slips are written at eleven by somebody standing at the " +
          "sideboard on their own, and nothing you do before then improves " +
          "them. Anybody arriving after the table has been told gets the same " +
          "sentence quietly at the door.",
        minutes: 2,
      },
      {
        step: "read_them",
        phase: "playing",
        instruction: "At midnight the reader takes them out one at a time and reads every one aloud.",
        detail:
          "Every one, in the order they come out, flat and in the reader's " +
          "own voice, including the blank ones — which are read as blank and " +
          "passed. Nothing is skipped and nothing is commented on. Editing " +
          "the list is the only way to break this game: a room that suspects " +
          "a slip was skipped stops believing the bowl.",
        minutes: 8,
        supplyItem: "A bowl",
      },
      {
        step: "nobody_guesses_out_loud",
        phase: "playing",
        instruction: "If somebody starts guessing whose a slip was, say the one rule and read the next.",
        detail:
          "It happens on the third or fourth slip, once. Said lightly and " +
          "once, it does not happen again. The list is anonymous by " +
          "agreement, not by handwriting, and everybody knows that.",
        say: "We do not do that with these.",
        minutes: 2,
      },
      {
        step: "tear_it_up",
        phase: "ending",
        instruction: "Tear the slips into the bowl where the room can see it, and say nothing more.",
        detail:
          "All of them, at the table, the moment the last one is read. " +
          "Nothing is won here, nothing is voted on and nothing is kept. The " +
          "tearing is the sentence, and a host who follows it with a toast " +
          "has explained a thing that did not need it.",
        minutes: 4,
      },
    ],
    contingencies: [
      {
        trouble: "will_not_play",
        answer:
          "An empty slip goes in the bowl and is read as an empty slip. " +
          "Nobody is asked why. A room where one blank goes past without " +
          "comment is a room where the next person writes a real one.",
      },
      {
        trouble: "under_minimum",
        answer:
          "Under four, anonymity is gone and the slips will be careful. Say " +
          "them out loud round the table instead and do not pretend the bowl " +
          "is hiding anything.",
      },
      {
        trouble: "over_size",
        answer:
          "Above twenty the reading is longer than the moment. Draw twelve " +
          "and tear the rest unread, and say that is what you are doing " +
          "before you start.",
      },
      {
        trouble: "running_long",
        answer:
          "Stop reading at eight minutes wherever you are and tear the " +
          "remainder. A list that outlasts the room has become a recital.",
      },
      {
        trouble: "played_before",
        answer:
          "A house that does this every year has guests who arrive with the " +
          "slip already written. That is the game working, and the returning " +
          "guest is the one who makes the first slip a good one.",
      },
      {
        trouble: "not_landing",
        answer:
          "If the first four are jokes, read them straight and keep going. " +
          "The room corrects itself by the sixth, and a host who asks for " +
          "sincerity gets none.",
      },
    ],
  },

  facets: [
    {
      dimension: "group_fun",
      code: "group_games",
      weight: 0.6,
      note:
        "Every guest names one, and the reading at midnight is to the whole room.",
    },
    { dimension: "affinity", code: "one_moment", weight: 1 },
    { dimension: "affinity", code: "ritual", weight: 0.9 },
    {
      dimension: "group_fun",
      code: "keep_a_secret",
      weight: 0.7,
      note: "Unsigned, read aloud, and destroyed. Three separate guarantees of the same thing.",
    },
    { dimension: "group_fun", code: "talk_deep", weight: 0.6 },
    { dimension: "affinity", code: "wit", weight: 0.5 },
    { dimension: "group_fun", code: "toast", weight: 0.4 },
    {
      dimension: "anti_preference",
      code: "forced_fun",
      weight: 0.4,
      note: "Everybody is expected to have written one, and the bowl is in the middle of the room.",
    },
  ],

  occasions: [],
  slots: [
    {
      slotCode: "game",
      fit: "native",
      note: "db/061 collapsed the five game beats into one. This is the beat now, and she chooses among what the room offers.",
    },
    { slotCode: "finale", fit: "native" },
  ],

  supplies: [
    {
      item: "A bowl",
      detail: "Wide, so a folded slip does not have to be pushed in, and it goes in the middle.",
      source: "on_hand",
      quantity: 1,
    },
    {
      item: "Pencils",
      detail: "One at the bowl and two more elsewhere, so writing one is never a search.",
      source: "on_hand",
    },
  ],
  requirements: [
    { requirement: "printing" },
    { requirement: "table_space", note: "Somewhere the bowl can sit all evening without being moved." },
  ],
  printedMatter: [
    {
      piece: "list_slips",
      label: "The slips",
      description:
        "One a head, cut so they tear cleanly. Her sentence, whole, at the " +
        "head: Each guest names one thing that will not be repeated. The " +
        "list is read at midnight and then it is destroyed. Under it one " +
        "line and no space for a name.",
      voicePiece: "game_rule",
      perGuest: true,
    },
  ],
  dependencies: [],
  worlds: [
    {
      world: "new-york",
      native: true,
      note: "Written in this room's voice. A whitelist, per rule 23.",
    },
  ],
};

/**
 * NANTUCKET — WHAT THE WEATHER WILL DO. HELD, AND THE ONLY ONE.
 *
 * READ THE `notes` BEFORE PUBLISHING THIS ROW. `docs/atmosphere-idea-bank-v1.md`
 * records `KILLED: the weather-forecast act.` under Nantucket's HOST ACTS
 * block, and this room's `game_rule` is a weather guess. The kill and the game
 * are different mechanisms and the kill list is enforced against `bank_item`
 * names, which this is not — but that is a reading, not an establishment, and
 * a game written on a reading of a kill is exactly the thing that must not be
 * published quietly. So the row carries the founder-pending marker and the
 * seeder holds it as a draft. It is the first row in this file to do so.
 */
const NANTUCKET_WHAT_THE_WEATHER_WILL_DO: Game = {
  slug: "nantucket-what-the-weather-will-do",
  name: "What The Weather Will Do",
  description:
    "Everybody writes down what the weather will do tomorrow. In the " +
    "morning, whoever was closest does not have to clear.",
  howItWorks:
    "At supper, one card each, already at the place. On it goes your name " +
    "and, under it, tomorrow: what the weather will do, in as many words as " +
    "it takes. Fog until ten. Rain by four and then it lifts. Nothing all " +
    "day. One card each and no second attempt.\n\n" +
    "The cards are collected face down and go under something heavy in the " +
    "middle of the table. Nobody looks at them again that night and nobody " +
    "reads a forecast out loud.\n\n" +
    "In the morning, before anybody says what it is doing outside, the cards " +
    "come out and are read aloud, one after another, in the order they were " +
    "collected. Then the room argues and agrees, out loud and roughly, which " +
    "one was closest. There is no instrument and no arbitration — the " +
    "argument is most of the game. If it is still going after five minutes, " +
    "the two closest both win and the clearing is split between everybody " +
    "else.\n\n" +
    "Whoever wins does not clear: not the breakfast plates, not the supper " +
    "ones from the night before, not anything until the next meal. That is " +
    "the whole prize. Nothing is scored and nothing carries to the next day.",
  materials:
    "THE HOUSE PRINTS the cards, one a head, and they go out at each " +
    "place before supper. YOU SUPPLY a pencil at each place and something " +
    "heavy to keep the collected cards under overnight.",

  shape: "ambient",
  sourcing: "provided",
  minGuests: 4,

  scoring:
    "One guess each, written once. The room agrees in the morning which was " +
    "closest. Nothing is measured and nothing is written down twice.",

  sourceNote: ROOM_VOICE,
  notes:
    'HER RULE, VERBATIM: "Everybody says what the weather will do tomorrow. ' +
    'Whoever is closest does not have to clear."\n\n' +
    "AUTHORED HERE: the written card, the overnight span, the room settling " +
    "it by agreement rather than by instrument, the four-guest floor, and " +
    "every step and contingency.\n\n" +
    "A CARD THAT COULD NOT BE WON, CORRECTED. The earlier draft printed the " +
    "guess card as `One line, and no room for a name` while the game turns " +
    "entirely on which named person was closest — a forfeit decided from " +
    "anonymous cards, which cannot be done. The card now carries a name at " +
    "the top and the reading is by name. The order was undefined too, and is " +
    "now the order the cards were collected in, so nobody chooses to be read " +
    "last. AND THE ARGUMENT HAS A FLOOR: five minutes, and then the two " +
    "closest both win. Her sentence says whoever is closest and does not say " +
    "what happens when a room of eight cannot agree who that is, which it " +
    "will not, because that is the part she wrote it for.\n\n" +
    "FOUNDER-PENDING — DOES THE KILL REACH THIS GAME. " +
    "docs/atmosphere-idea-bank-v1.md records `KILLED: the weather-forecast " +
    "act.` in Nantucket's HOST ACTS block, immediately after three other " +
    "host acts, and `KILLED_GAMES` in scripts/seed-bank.mjs enforces it by " +
    "name against `bank_item` rows. THE EVIDENCE FOR IT BEING A HOST ACT AND " +
    "NOT THIS: it is filed under HOST ACTS beside the pot-dump and the " +
    "chowder ladle, all of which are one person performing something; the " +
    "kill list is checked against bank rows and a `game` row is not one; and " +
    "the mechanism differs — a forecast performed by one person is not " +
    "everybody guessing once in writing with a forfeit attached. THE " +
    "EVIDENCE AGAINST: both are the weather, tomorrow, at Nantucket, and a " +
    "kill written that broadly may well have meant the whole idea. IT IS NOT " +
    "ESTABLISHED FROM THE FILES. The instruction was to write it and flag it " +
    "rather than silently doing either, so it is written, and this marker " +
    "holds it as a draft until she says which.",

  runbook: {
    hostRole: "plays_too",
    hostNote:
      "You write a card too, and yours is judged with the rest. The only " +
      "thing that is yours is putting the cards under something at supper " +
      "and getting them out again at breakfast.",
    steps: [
      {
        step: "cut_the_cards",
        phase: "before",
        instruction: "Put a card and a pencil at every place before supper, and two spare at the end.",
        detail:
          "At the place, not passed round. A card already sitting there gets " +
          "written on; a card handed out has to be introduced. The spare two " +
          "are for whoever comes down late.",
        printedPiece: "guess_cards",
      },
      {
        step: "find_the_heavy_thing",
        phase: "before",
        instruction: "Decide now what the cards go under, and put it on the table.",
        detail:
          "A stone off the beach, the good dish, the tide book. It has to be " +
          "in the room all night, visibly holding something down.",
        supplyItem: "Something heavy to put them under",
      },
      {
        step: "say_it_at_supper",
        phase: "opening",
        instruction: "Ask the question once, at supper, with everybody sitting down and eating.",
        detail:
          "Asked while people are eating it gets an answer in thirty " +
          "seconds. Asked afterwards it gets a discussion about whether " +
          "anybody has looked. Say all three parts: their name at the top, " +
          "the weather underneath, and what the winner gets out of.",
        say: "Cards. Your name at the top, and under it what the weather does tomorrow. Whoever is closest does not clear anything until lunch.",
        printedPiece: "guess_cards",
      },
      {
        step: "under_the_stone",
        phase: "underway",
        instruction: "Collect the cards face down, in one pile, and put them under the heavy thing.",
        detail:
          "Face down and in front of everybody. Keep the pile in the order " +
          "you picked them up, because that is the order they get read in " +
          "and it stops anybody choosing to go last. Anybody who wants to " +
          "change theirs later has to move a stone in a quiet house.",
        supplyItem: "Something heavy to put them under",
      },
      {
        step: "nobody_looks",
        phase: "underway",
        instruction: "Do not let anybody check a forecast out loud for the rest of the night.",
        detail:
          "One person reading a phone screen to the room ends it. This is " +
          "the only rule in the game that has to be defended, and it is " +
          "defended once, lightly, the first time somebody tries.",
        say: "Not out loud.",
      },
      {
        step: "read_them_at_breakfast",
        phase: "ending",
        instruction: "In the morning, read every card out before anybody says what it is doing.",
        detail:
          "Before, not after, and in the order they came off the table. Read " +
          "the name and then the guess. Cards read after the room has looked " +
          "out of the window are cards everybody has already scored. Anybody " +
          "still asleep has their card read anyway and can win it in bed.",
      },
      {
        step: "let_the_room_settle_it",
        phase: "ending",
        instruction: "Let the room argue and agree on one card. Do not decide it yourself.",
        detail:
          "The argument is the game. A host who adjudicates has taken the " +
          "only entertaining part of it away and made herself a referee. " +
          "Give it five minutes by the clock; if it is still going, the two " +
          "closest both win and the clearing is split between everybody else.",
        say: "Somebody is not clearing. Settle it between you.",
      },
      {
        step: "the_stone_goes_back",
        phase: "ending",
        instruction: "Say who is not clearing, put the cards in the bin, and put the stone back.",
        detail:
          "Out loud, once, and then it is finished. Nothing is kept, no " +
          "record is made from one morning to the next, and the winner has " +
          "won a morning off and nothing else.",
      },
    ],
    contingencies: [
      {
        trouble: "will_not_play",
        answer:
          "A blank card is a card and it loses. Nobody is chased for one, " +
          "and somebody who did not write a guess is quietly not part of the " +
          "argument in the morning, which is punishment enough.",
      },
      {
        trouble: "under_minimum",
        answer:
          "Under four, the clearing is done by two people whatever happens " +
          "and the forfeit means nothing. Keep the guesses, drop the stake, " +
          "and let it be a thing said at supper.",
      },
      {
        trouble: "over_size",
        answer:
          "Above twelve the reading takes the whole of breakfast. Say at " +
          "supper that the reading starts at a stated hour and that cards " +
          "are read whether their writer is at the table or not, so nobody " +
          "loses by sleeping and nobody waits for them.",
      },
      {
        trouble: "running_long",
        answer:
          "The only thing that runs long is the morning argument. Give it " +
          "five minutes and then name the two closest and split the clearing " +
          "between everybody else.",
      },
      {
        trouble: "played_before",
        answer:
          "Somebody who has stayed here before will hedge, in writing, at " +
          "length. Rule that a guess longer than the card loses on length, " +
          "and say so before the cards go out next time.",
      },
      {
        trouble: "not_landing",
        answer:
          "If the cards come back empty at supper, do not run it at " +
          "breakfast. Put the stone back and say nothing; there is no " +
          "announcement to make about a game nobody started.",
      },
    ],
  },

  facets: [
    { dimension: "affinity", code: "ritual", weight: 0.9 },
    {
      dimension: "group_fun",
      code: "compete",
      weight: 0.6,
      note: "A forfeit, argued over at breakfast by people who have not had coffee.",
    },
    { dimension: "affinity", code: "wit", weight: 0.6 },
    { dimension: "group_fun", code: "talk_deep", weight: 0.3 },
    { dimension: "affinity", code: "ease", weight: 0.4 },
    {
      dimension: "anti_preference",
      code: "forced_fun",
      weight: 0.2,
      note: "One line on a card at supper. It is close to the floor of what forced participation can mean.",
    },
  ],

  occasions: [],
  slots: [
    {
      slotCode: "game",
      fit: "native",
      note: "db/061 collapsed the five game beats into one. This is the beat now, and she chooses among what the room offers.",
    },
    { slotCode: "ambient_game", fit: "native" },
  ],

  supplies: [
    {
      item: "Something heavy to put them under",
      detail: "A stone off the beach, the good dish, whatever the house already has on the table.",
      source: "on_hand",
      quantity: 1,
    },
    {
      item: "Pencils",
      detail: "One at each place. Pencil and not pen, so a guess can be crossed out and rewritten before supper ends.",
      source: "on_hand",
    },
  ],
  requirements: [
    { requirement: "printing" },
    { requirement: "table_space", note: "Everybody at one table for the asking, and again for the reading." },
  ],
  printedMatter: [
    {
      piece: "guess_cards",
      label: "The cards",
      description:
        "One a head. Her sentence, whole, at the head: Everybody says what " +
        "the weather will do tomorrow. Whoever is closest does not have to " +
        "clear. Under it a rule for a name and one line for the guess. They " +
        "go face down under something heavy and are read out by name in the " +
        "morning.",
      voicePiece: "game_rule",
      perGuest: true,
    },
  ],
  dependencies: [],
  worlds: [
    {
      world: "nantucket",
      native: true,
      note: "Written in this room's voice. A whitelist, per rule 23.",
    },
  ],
};
/**
 * NEW ORLEANS — NOBODY FINISHES THEIR OWN.
 *
 * The first of the five story games, and the one whose engine is the handover:
 * the ending belongs to the person on your left and they are going to get it
 * wrong on purpose.
 */
const NEW_ORLEANS_NOBODY_FINISHES_THEIR_OWN: Game = {
  slug: "new-orleans-nobody-finishes-their-own",
  name: "Nobody Finishes Their Own",
  description:
    "Everybody starts a story and nobody finishes it. The person on your " +
    "left takes it over and gets it wrong, and the wrongness is the point.",
  howItWorks:
    "Round the table to the left, one at a time, starting with the host. You " +
    "start a story — a real one, about you — and you get one minute of it. " +
    "At the minute somebody taps a glass and you stop, wherever you are, " +
    "mid-sentence if that is where the minute lands.\n\n" +
    "The person on your left finishes it, and gets a minute as well. They " +
    "were not there. They are not guessing, they are inventing, and they are " +
    "doing it with total confidence in front of the person it happened to. " +
    "The person it happened to says nothing at all while it is going on. If " +
    "the person on your left actually was there, they invent anyway, and it " +
    "is usually the best ending of the night.\n\n" +
    "Then the next person to the left starts theirs, and so on. THE ROUND " +
    "ENDS WHEN EVERYBODY HAS STARTED ONE. Nobody starts a second.\n\n" +
    "After that, back round the table in the same direction: each person " +
    "gets one sentence — one — to say what actually happened in theirs. Some " +
    "of them do not use it, which is the best outcome the game has. Nothing " +
    "is scored and nobody wins.",
  materials:
    "THE HOUSE PRINTS one card, which is everything it prints. YOU SUPPLY " +
    "a table and a spoon and a glass, or anything else that makes a noise " +
    "the table already knows.",

  shape: "scheduled",
  sourcing: "provided",
  durationMinutes: 25,
  durationMaxMinutes: 40,
  minGuests: 5,
  maxGuests: 14,

  sourceNote: ROOM_VOICE,
  notes:
    'HER RULE, VERBATIM: "Everybody starts a story. Nobody finishes their ' +
    'own. The person on your left finishes it and gets it wrong."\n\n' +
    "AUTHORED HERE: the minute, the one sentence of correction at the end, " +
    "the five-to-fourteen table, the twenty-five-to-forty minute block, and " +
    "every step and contingency. The single sentence of correction is the " +
    "house's addition and is the first thing to cut: her rule does not " +
    "promise the truth ever comes out, and there is a reading in which it " +
    "never should.\n\n" +
    "THE ENDING WAS A FEELING AND IS NOW A CONDITION. The earlier draft " +
    "ended the game at `the first ending the table repeats back to " +
    "somebody`, which is a nice observation and not an instruction: it can " +
    "fail to happen, it can happen in the second minute, and it contradicts " +
    "her own first sentence, which says EVERYBODY starts a story. The round " +
    "now ends when everybody has started one and the sentences have gone " +
    "round once. TWO OTHER SILENCES FILLED: the finisher gets a minute as " +
    "well — the earlier draft timed only the teller, so half of every turn " +
    "had no clock on it at all — and a finisher who was actually there " +
    "invents anyway rather than being swapped out.",

  runbook: {
    hostRole: "plays_too",
    hostNote:
      "You start one and somebody finishes yours. The only job is the " +
      "minute, and it is a spoon against a glass rather than a phone.",
    steps: [
      {
        step: "seat_them_so_left_means_something",
        phase: "before",
        instruction: "Seat the table so that everybody has somebody on their left they know well.",
        detail:
          "The handover is to the left and it is the whole game. Two " +
          "strangers side by side produce a polite ending, which is the only " +
          "kind that does not work.",
      },
      {
        step: "find_the_glass",
        phase: "before",
        instruction: "Put something you can tap where you can reach it without standing.",
        detail:
          "A spoon and a glass. A phone timer makes the table look at a " +
          "screen, and the minute stops being a joke and becomes a rule.",
        supplyItem: "A spoon and a glass",
      },
      {
        step: "say_the_rule",
        phase: "opening",
        instruction: "Say the rule once, and say the second half twice.",
        detail:
          "Everybody hears the first half. Half the table does not hear that " +
          "they are finishing somebody else's, and finds out at the moment " +
          "it is their turn. Say the three timings too: a minute to start, a " +
          "minute to finish, and it goes to the left.",
        say: "A minute each of a true story about you. At the minute I tap the glass and you stop, wherever you are, and the person on your left finishes it — and they were not there. Then they start theirs.",
        minutes: 2,
        printedPiece: "rules_card",
      },
      {
        step: "go_first",
        phase: "opening",
        instruction: "Start one yourself and stop dead on the minute, mid-word if it lands there.",
        detail:
          "Going first is how you show that the minute is real and that " +
          "stopping mid-sentence is allowed. Nobody believes it until they " +
          "have watched it happen once, and the person on your left now has " +
          "to do the same job in front of everybody.",
        minutes: 3,
      },
      {
        step: "round_the_table",
        phase: "playing",
        instruction: "Left round the table: a minute to start, a minute for the left to finish it.",
        detail:
          "Tap at a minute whoever is speaking and however good it is, on " +
          "both halves. The person the story happened to says nothing while " +
          "it is being finished. If the finisher was actually there, they " +
          "invent anyway. The one cut off mid-sentence gets the best ending " +
          "every time, because the person on their left has nothing to work " +
          "with.",
        minutes: 22,
        supplyItem: "A spoon and a glass",
      },
      {
        step: "one_sentence_each",
        phase: "deciding",
        instruction: "When everybody has started one, go round again: one sentence of what really happened.",
        detail:
          "One sentence, same direction, and a person may pass. A story " +
          "corrected at length is a story taken back, and the invented " +
          "ending was the better one anyway. Nothing is voted on and nobody " +
          "wins this.",
        minutes: 5,
      },
      {
        step: "everybody_has_gone",
        phase: "ending",
        instruction: "Stop when the sentences have gone round once. Do not start a second round.",
        detail:
          "The round is over when everybody has started a story and had " +
          "their sentence, and that is the whole of the ending — not a good " +
          "moment somebody has to spot. A table that goes round twice is a " +
          "table doing the same thing again knowing how it goes.",
        minutes: 5,
      },
    ],
    contingencies: [
      {
        trouble: "will_not_play",
        answer:
          "Somebody who will not tell one still finishes the story of the " +
          "person on their right, which is the easier half and the funnier " +
          "job. Skip their turn to start and never mention it.",
      },
      {
        trouble: "under_minimum",
        answer:
          "Under five the handover comes back round too fast and everybody " +
          "is finishing the person who just finished them. Play it as one " +
          "story that goes round the whole table in minute pieces instead.",
      },
      {
        trouble: "over_size",
        answer:
          "Above fourteen it is fifty minutes of waiting for a turn. Split " +
          "into two tables, run them at the same time, and let the two best " +
          "endings be retold to the whole room at the end.",
      },
      {
        trouble: "running_long",
        answer:
          "Cut the sentence of correction, not the stories. It is the part " +
          "the table will not miss and the part that adds five minutes " +
          "nobody counted.",
      },
      {
        trouble: "played_before",
        answer:
          "Somebody who has played will start a story designed to be " +
          "impossible to finish. Let them. The person on their left will " +
          "invent something better than the truth, which is the game working.",
      },
      {
        trouble: "not_landing",
        answer:
          "If two endings in a row are careful and accurate, the table has " +
          "decided this is a memory exercise. Say out loud that the ending " +
          "is meant to be wrong, and then take the next turn yourself and " +
          "be spectacularly wrong.",
      },
    ],
  },

  facets: [
    {
      dimension: "group_fun",
      code: "theatre",
      weight: 1,
      note:
        "Each person takes over somebody else's story and plays it wrong on purpose. That is the game.",
    },
    { dimension: "group_fun", code: "perform", weight: 0.9 },
    { dimension: "group_fun", code: "long_dinner", weight: 0.9 },
    { dimension: "affinity", code: "wit", weight: 0.9 },
    { dimension: "group_fun", code: "talk_deep", weight: 0.5 },
    { dimension: "affinity", code: "one_moment", weight: 0.5 },
    { dimension: "affinity", code: "late", weight: 0.4 },
    {
      dimension: "anti_preference",
      code: "forced_fun",
      weight: 0.7,
      note: "Everybody speaks, twice, in turn, in front of the whole table. There is no version of this that is opt-out.",
    },
  ],

  occasions: [],
  slots: [
    { slotCode: "game", fit: "native" },
    { slotCode: "the_moment", fit: "native" },
  ],

  supplies: [
    {
      item: "A spoon and a glass",
      detail: "For the minute. Anything that makes a noise the table already knows.",
      source: "on_hand",
      quantity: 1,
    },
  ],
  requirements: [
    { requirement: "table_space", note: "One table, everybody at it, and a left that means something." },
    { requirement: "printing" },
  ],
  printedMatter: [
    {
      piece: "rules_card",
      label: "The rule",
      description:
        "One card, standing in the middle of the table for the whole round, " +
        "printed one side only. Her sentence, whole: Everybody starts a " +
        "story. Nobody finishes their own. The person on your left finishes " +
        "it and gets it wrong. Nothing else on it — no order of play, no " +
        "clock — because the rule is the only thing the table has to hold " +
        "and the minute is called by somebody tapping a glass.",
      voicePiece: "game_rule",
      quantity: 1,
    },
  ],
  dependencies: [],
  worlds: [
    {
      world: "new-orleans",
      native: true,
      note: "Written in this room's voice. A whitelist, per rule 23.",
    },
  ],
};

/**
 * CATSKILLS — THE SWIM TEST.
 *
 * The story game whose engine is a book nobody opens: the ledger is on the
 * table all evening and being shut is the entire mechanism. Anything that
 * cannot be checked can be claimed.
 */

/**
 * THE CAMP — WHAT HAPPENED TODAY.
 *
 * Charades, dealt rather than drawn, about a day everybody was at.
 *
 * Founder, 2026-09-06: "give charades to catskills." The room lost its own
 * game the same day — its rule turned on a ledger that stays shut, which is
 * unresolvable as an instruction — and it keeps the shared house games either
 * way, so no carousel is short. What it lacked was a game only it can claim
 * (rule 30), and this is that.
 *
 * ── IT IS NOT FISHBOWL'S SECOND ROUND, AND THAT WAS THE TEST ────────
 *
 * CLAUDE.md's unratified section: for machine-generated content, check
 * SINGLE SUBSTITUTION against what exists — same frame, one ingredient
 * swapped — because that is what found eight real duplicates when a
 * word-overlap sweep found nothing usable. Fishbowl's middle round is
 * charades, so the check was run against it deliberately rather than after
 * the fact. Five things differ, and they are mechanics rather than dressing:
 *
 *   1. ONE SLIP EACH, NOT SIX, and the bowl is never refilled. There are no
 *      rounds and nothing is played twice.
 *   2. WHAT IS ON THE SLIP. Fishbowl takes names and nouns from anywhere.
 *      Every slip here is something that happened TODAY, to these people,
 *      seen by at least two of them. It cannot be played by a room that was
 *      not together all afternoon, which is the whole reason it belongs to
 *      this room and to no other.
 *   3. NOBODY ACTS HER OWN AND NOBODY LEARNS WHOSE SHE HAD. Fishbowl's
 *      clue-giver draws blind from a shared bowl and whose slip it is never
 *      matters. Here the slips are DEALT, the camp assigns, and you are
 *      acting somebody else's noticing rather than your own joke.
 *   4. NO TEAMS AND NO CLOCK. Fishbowl is two teams and a minute a turn. A
 *      turn here ends when it is got or when the actor sits down, and she may
 *      sit down whenever she likes.
 *   5. NOTHING IS SCORED. Fishbowl's most slips wins. This one writes the
 *      guessed slips into the ledger and puts the ledger away, which is the
 *      room's own joke and its warmest fact at once.
 *
 * What the two share is the physical act — a written prompt acted in silence
 * — and that is charades, which nobody owns. If a later pass finds these two
 * scoring as near-duplicates on a deliverables measure, the measure is
 * reading the act and not the game; the list above is the argument.
 *
 * ── THE ROOM ────────────────────────────────────────────────────────
 *
 * Its voice assigns rather than invites, reports a procedure straight and
 * lets the affection show through the seriousness, and holds one line above
 * everything else: the ledger is written carefully and never read again. This
 * game is that sentence made playable. It also honours the two `never` lines
 * that bear on it — nothing here can be failed, and nothing is a competition.
 */
const CATSKILLS_WHAT_HAPPENED_TODAY: Game = {
  slug: "catskills-what-happened-today",
  name: "What Happened Today",
  description:
    "Charades, except every slip is something that happened here this " +
    "afternoon. Nobody acts her own and nobody finds out whose she had.",
  howItWorks:
    "One slip each, written before dinner. Something that actually happened " +
    "today, to these people, that at least two of you saw. Six words at " +
    "most. Folded once and into the tin by the door.\n\n" +
    "After dinner the office splits the table where it is already sitting. " +
    "The two halves of it are the two sides. Nobody is picked and nobody " +
    "picks, and if the number is odd the office takes the short side.\n\n" +
    "Then the slips are dealt out, face down, one each. Nobody " +
    "draws for herself. Anybody holding her own says so and swaps with the " +
    "person on her left, once, and neither of them explains why. You will " +
    "not find out whose slip you had and you do not ask afterwards.\n\n" +
    "Then, in the order people are already sitting, one at a time, you stand " +
    "up and act it. No words and no mouthing. Two more rules, and they are " +
    "the ones that stop it being over in a single gesture: you may not point " +
    "at the person it happened to, and you may not pick up anything that is " +
    "on the table. YOUR SIDE guesses, out loud, over each other. The other " +
    "side has worked it out by now and says nothing, which is most of the " +
    "difficulty.\n\n" +
    "THERE IS NO CLOCK. A turn ends when somebody on your side says it near " +
    "enough that you nod, and the slip is yours — or when you sit down, and " +
    "you may sit down whenever you like and nobody argues about it. A slip " +
    "you sat down on crosses to the other side for one guess, made together " +
    "and said once. If they have it, it is theirs. If they do not, it " +
    "belongs to the evening and to nobody. Then the next person stands " +
    "up.\n\n" +
    "The side holding more slips at the end of it wins the night. If the two " +
    "finish level, it goes to whichever of them guessed the first slip of " +
    "the evening; they were ahead once and that is enough.\n\n" +
    "Every slip that got guessed is read out at the end and written into the " +
    "ledger, in the order it was acted, with the name of whoever acted it " +
    "and the side that took it, and the count at the foot of the page. Then " +
    "the ledger goes back in the drawer until next year, when the last page " +
    "is read out before the first slip is written.\n\n" +
    "The last slip is the office's own and it is written before anybody " +
    "arrives: the bell, rung once, just to test it. It is the first thing " +
    "that happened today and every single person saw it. Both sides say it " +
    "at once, in about four seconds, so it counts for both and changes " +
    "nothing — which is how the game ENDS rather than merely stops.\n\n" +
    "The reason it works is that nothing in the tin is trivia. The room is " +
    "not being tested on anything — it is being handed back an afternoon it " +
    "has just had, in the wrong person's handwriting, and the good part is " +
    "how differently two people noticed the same twenty minutes. The side " +
    "that wins is the side that noticed it the same way.",
  materials:
    "THE HOUSE PRINTS one sheet a head, perforated across the middle: the " +
    "rules at the head and one slip to tear off underneath. YOU SUPPLY a " +
    "pencil each, a tin or a bowl to stand by the door from the afternoon " +
    "on, and a notebook for the ledger.",

  shape: "scheduled",
  sourcing: "provided",
  durationMinutes: 25,
  durationMaxMinutes: 40,
  // Under five, the handwriting gives every slip away and the deal is
  // pointless. Above twenty, a person waits forty minutes for one turn.
  minGuests: 5,
  maxGuests: 20,

  scoring:
    "TWO SIDES, split along the table where it already sits. A slip guessed " +
    "by the actor's own side counts for that side. A slip she sits down on " +
    "crosses to the other side for one shared guess and counts for them if " +
    "they have it, and for nobody if they do not. The bell counts for both " +
    "and moves nothing. The higher count wins the night; a level night goes " +
    "to whichever side guessed the first slip. The result is written into " +
    "the ledger under the slips and read out the following year.",

  sourceNote:
    "Founder ruling, 2026-09-06: \"give charades to catskills.\" Charades is " +
    "a folk game with no owner, so the house may print the rules in full. " +
    "The form is nobody's; everything below it — the dealt slips, the day " +
    "as the only subject, the missing clock, the ledger — is the house's, " +
    "authored to this room and separable from her instruction.\n\n" +
    "SECOND RULING, same day: \"groups do win charades.\" The first draft of " +
    "this game said \"Nobody wins. There are no teams and nothing is " +
    "counted.\" She overruled it, and rule 14 keeps the reasoning that lost " +
    "rather than deleting it: the unscored design was argued from Catskills' " +
    "own never-line, \"never make the swim test a competition, and never " +
    "write a rule that somebody could fail.\" That was an over-reading in " +
    "two ways. The competition half is about the swim test, a game deleted " +
    "the same day. The failure half survives intact and this rewrite is " +
    "built to it: the sides are the table split where it already sits, so " +
    "nobody is picked and nobody picks, and a side that loses a night of " +
    "charades has not failed anything. Teams and a count are the change; " +
    "the slips, the deal, the missing clock, the ledger and the bell are " +
    "all carried through.",
  notes:
    "NO RULE OF HERS: the founder assigned this room a game — \"give charades " +
    "to catskills\" — and did not write the rule, so there is no sentence to " +
    "quote and nothing below is hers except the choice of game. That heading " +
    "is fixed and games.test.ts reads it: a room game either quotes her " +
    "sentence verbatim or says in these words that there is not one, because " +
    "the difference between what she wrote and what the house added is the " +
    "one thing a later edit must not be able to blur.\n\n" +
    "THE ROOM HAD NO `piece: \"game_rule\"` TO WRITE FROM, which is why this " +
    "one is not marked ROOM_VOICE like the other nineteen. Its own game was " +
    "refused on 2026-09-06 (db/065) because the rule turned on reading a " +
    "ledger the room says is never read. This is a replacement for it and " +
    "not a rewrite of it: nothing of the old rule survives here except the " +
    "ledger, which was always the room's and not that game's.\n\n" +
    "THE SIX-WORD LIMIT IS THE HOUSE'S AND IS THE LOAD-BEARING NUMBER. " +
    "Longer and the slip becomes a scene with three parts, which cannot be " +
    "acted and cannot be guessed; shorter and everything reads as one of " +
    "four things that happen at every party. Six is what makes it a moment " +
    "rather than a category.\n\n" +
    "TWO WITNESSES IS THE OTHER ONE, and it is the fix for the only way this " +
    "game dies: a slip about something only the writer and one other person " +
    "saw is unguessable and the room goes quiet. Said out loud at the top, " +
    "and it is also the contingency.\n\n" +
    "NOT SCORED, ON PURPOSE AND NOT BY OVERSIGHT. This room's voice carries " +
    "\"never write a rule that somebody could fail\", and a charades score " +
    "is exactly such a rule wearing a party hat. The ledger is the joke that " +
    "replaces it and it is the room's own: written carefully, never read.",

  runbook: {
    hostRole: "plays_too",
    hostNote:
      "You write a slip and act one like everybody else. The two jobs that " +
      "are only yours are dealing the tin out and going last with the bell, " +
      "and neither takes you out of the game.",
    steps: [
      {
        step: "the_tin_by_the_door",
        phase: "before",
        instruction: "Put the tin by the door in the afternoon, with the pencils beside it.",
        detail:
          "It has to be standing there for hours before anybody writes " +
          "anything. A tin produced at nine o'clock asks the room to " +
          "remember on demand; a tin that has been by the door since two " +
          "gets filled by people on their way past.",
        supplyItem: "A tin",
        printedPiece: "the_sheet",
      },
      {
        step: "write_the_last_slip_first",
        phase: "before",
        instruction: "Write the office's own slip now and keep it out of the tin: the bell, rung once to test it.",
        detail:
          "This is the ending and it has to exist before the game starts. " +
          "Everybody saw it, so it is guessed instantly, and a game that " +
          "finishes on a laugh everybody is already in has ended rather than " +
          "run out.",
      },
      {
        step: "deal_them_out",
        phase: "opening",
        instruction: "Deal the tin round face down, one each. Nobody takes her own.",
        detail:
          "Anybody who gets her own says so and swaps with her left, once. " +
          "Neither of them explains why, and nobody asks.",
        minutes: 4,
        supplyItem: "A tin",
      },
      {
        step: "say_the_two_rules",
        phase: "opening",
        instruction: "Say the two rules out loud, and say that a slip needed two witnesses.",
        detail:
          "No pointing at the person it happened to, and nothing picked up " +
          "off the table. Both exist because either one ends a turn in a " +
          "single gesture.",
        say: "One each, and none of them is yours. No talking, no pointing at whoever it happened to, and do not pick anything up. There is no clock and nobody is counting.",
        minutes: 2,
        printedPiece: "the_sheet",
      },
      {
        step: "round_the_room",
        phase: "playing",
        instruction: "Stand up in the order people are sitting, one at a time, and let the room shout.",
        detail:
          "A turn ends when somebody gets it near enough that the actor " +
          "nods, or when the actor sits down. She may sit down whenever she " +
          "likes and that is not a forfeit, because there is nothing to " +
          "forfeit.",
        minutes: 20,
      },
      {
        step: "the_bell_goes_last",
        phase: "playing",
        instruction: "When it has been all the way round, stand up and act the bell.",
        detail:
          "Yours is the only slip nobody wrote and the only one everybody " +
          "already knows. Do it badly. It will be got before you have " +
          "finished.",
        minutes: 2,
      },
      {
        step: "write_the_ledger",
        phase: "deciding",
        instruction: "Read the guessed slips back out and write them in the ledger in order, with who acted each.",
        detail:
          "This is the whole of the scoring and it settles nothing. Read " +
          "them straight, in the order they were acted, and do not rank " +
          "them or say which was best.",
        minutes: 5,
        supplyItem: "The ledger",
      },
      {
        step: "put_the_ledger_away",
        phase: "ending",
        instruction: "Close the ledger, put it back in the drawer, and say that it is never read again.",
        detail:
          "Say it plainly and do not make a joke of it afterwards. The " +
          "sentence is the end of the game and it is also the reason " +
          "everybody wrote something true down.",
        say: "That is all of them. It goes in the drawer and nobody reads it again.",
        minutes: 2,
        supplyItem: "The ledger",
      },
    ],
    contingencies: [
      {
        trouble: "will_not_play",
        answer:
          "Somebody who will not stand up deals the tin and rules on whether " +
          "a guess was near enough. Both jobs are real, both are argued " +
          "over, and neither requires getting out of a chair.",
      },
      {
        trouble: "under_minimum",
        answer:
          "Under five the handwriting gives every slip away and the deal " +
          "means nothing. Have two slips each and ask whoever is dealing to " +
          "copy them all out in one hand before they go back in the tin.",
      },
      {
        trouble: "over_size",
        answer:
          "Above twenty somebody waits forty minutes for one turn. Split the " +
          "slips into two tins and run both ends of the table at once. The " +
          "ledger is still one ledger and it is read out once.",
      },
      {
        trouble: "running_long",
        answer:
          "It runs long when the guessing is good, which is not a problem. " +
          "Take the slips that are left out of the tin and go straight to " +
          "the bell. Never shorten a turn — the turns are the game.",
      },
      {
        trouble: "played_before",
        answer:
          "Somebody who has played writes something small and exact instead " +
          "of the obvious thing, which is what the game wanted from " +
          "everybody. Say the six words out loud again and let her.",
      },
      {
        trouble: "not_landing",
        answer:
          "Two turns in silence means the slips are too private — somebody " +
          "wrote a thing only she and one other person saw. Say the two " +
          "witnesses rule again and let anybody swap her slip once.",
      },
    ],
  },

  facets: [
    {
      dimension: "group_fun",
      code: "theatre",
      weight: 1,
      note: "Standing up and playing somebody else's afternoon, in silence, for a room that was there.",
    },
    {
      dimension: "group_fun",
      code: "group_games",
      weight: 0.9,
      note: "Everybody writes, everybody acts, everybody guesses. There is no way to sit it out except by choosing the dealing job.",
    },
    { dimension: "group_fun", code: "perform", weight: 0.6 },
    {
      dimension: "group_fun",
      code: "keep_a_secret",
      weight: 0.5,
      note: "Whose slip you had is never said, before or after.",
    },
    {
      dimension: "group_fun",
      code: "compete",
      weight: 0.5,
      note: "FLIPPED FROM -0.4 ON 2026-09-06 by the founder's \"groups do win charades.\" The negative was correct arithmetic against the unscored first draft — nothing counted, so a host who says she wants to compete was steered elsewhere. There are two sides and a count now, so the same arithmetic has to point the other way or the engine hides a competitive game from the person who asked for one. Positive but not maximal: the sides are the seating, there is no clock, and the prize is a line in a ledger.",
    },
    { dimension: "affinity", code: "one_moment", weight: 0.7 },
    { dimension: "affinity", code: "wit", weight: 0.5 },
    {
      dimension: "anti_preference",
      code: "forced_fun",
      weight: 0.7,
      note: "Everybody stands up in turn. A host who vetoes forced participation should not be offered this, and the positive weight is what makes it disappear for her.",
    },
    {
      dimension: "anti_preference",
      code: "kids_party",
      weight: 0.4,
      note: "It is charades, and a host is entitled to know that before it is put in front of her.",
    },
  ],

  occasions: [],
  slots: [
    {
      slotCode: "game",
      fit: "native",
      note: "db/061 collapsed the five game beats into one. This is the beat now, and she chooses among what the room offers.",
    },
    { slotCode: "day_material", fit: "native" },
  ],

  supplies: [
    {
      item: "A tin",
      detail:
        "Or a bowl. It stands by the door from the afternoon on, with the pencils beside it, and it is filled by people going past.",
      source: "on_hand",
      quantity: 1,
    },
    {
      item: "A pencil each",
      source: "on_hand",
      perGuest: true,
    },
    {
      item: "The ledger",
      detail:
        "Any notebook, and the plainer the better. It is written in carefully and never read again.",
      source: "on_hand",
      quantity: 1,
    },
  ],
  requirements: [
    {
      requirement: "floor_space",
      note: "Somewhere in front of the table to stand up and be seen from every seat.",
    },
    { requirement: "printing" },
  ],
  printedMatter: [
    {
      piece: "the_sheet",
      label: "The rules, and your slip",
      description:
        "One sheet a head, perforated across the middle. The rules sit at " +
        "the head of it and stay wherever she was sitting, so nobody has to " +
        "ask twice. The slip tears off underneath, takes six words and a " +
        "fold, and goes in the tin by the door. Nothing is printed on the " +
        "back of the slip, so one held up to a lamp does not read through.",
      voicePiece: "game_rule",
      perGuest: true,
    },
  ],
  dependencies: [],
  worlds: [
    {
      world: "catskills",
      native: true,
      note: "Written in this room's voice. A whitelist, per rule 23.",
    },
  ],
};

/**
 * CÔTE D'AZUR — ONE OF THEM IS LYING.
 *
 * The story game whose engine is a card drawn in secret. Her second sentence
 * is a warning to the room and it is also, precisely, how the liar is chosen:
 * at random, so that it genuinely is not the one you think.
 */
const COTE_DAZUR_ONE_OF_THEM_IS_LYING: Game = {
  slug: "cote-dazur-one-of-them-is-lying",
  name: "One Of Them Is Lying",
  description:
    "Everybody tells the story of this afternoon. One card in the pack is " +
    "marked, and whoever drew it is inventing the whole thing.",
  howItWorks:
    "One card each, dealt face down, from a pack cut to exactly one card per " +
    "person. One of those cards has a mark on the back. Everybody looks at " +
    "their own without reacting and puts it back face down.\n\n" +
    "Whoever has the marked card is the liar, and the liar's job is to " +
    "describe an afternoon that did not happen — somewhere else, doing " +
    "something else — and to pass it off as this one. Nobody else knows who " +
    "it is, including the host, who drew a card as well.\n\n" +
    "Then it goes round the table to the left, starting with whoever is on " +
    "the dealer's left: the story of this afternoon, from where you were " +
    "sitting, one each, no interruptions. Nobody may ask anybody a question " +
    "at any point. The true ones are boring, which is the difficulty — the " +
    "truth is a person saying that the wind moved the table and the good " +
    "bottle stayed standing, and it sounds exactly as flat as that.\n\n" +
    "When the last person has finished, everybody points at once on a count " +
    "of three, with no talking beforehand. Nobody may point at themselves, " +
    "including the liar. Count the fingers on each person: if MORE THAN HALF " +
    "the table is pointing at the liar, the room wins; anything less than " +
    "that, including exactly half, and the liar wins.\n\n" +
    "The liar turns their card over. Nothing is scored and nothing is " +
    "awarded, and nobody goes back through who said what.",
  materials:
    "THE HOUSE PRINTS one card. YOU SUPPLY an ordinary pack of playing " +
    "cards, counted down to exactly one card per person, with a crease " +
    "put in the corner of one of them.",

  shape: "scheduled",
  sourcing: "provided",
  durationMinutes: 25,
  durationMaxMinutes: 40,
  minGuests: 5,
  maxGuests: 12,

  scoring:
    "Everybody points at once, once, and nobody points at themselves. More " +
    "than half the table on the liar and the room wins; anything less, " +
    "including exactly half, and the liar wins. No second vote, no " +
    "discussion before the pointing, and nothing is awarded either way.",

  sourceNote: ROOM_VOICE,
  notes:
    'HER RULE, VERBATIM: "Everybody tells the story of this afternoon. One ' +
    'of them is lying, and it is not the one you think."\n\n' +
    "AUTHORED HERE: the marked card, the simultaneous pointing, the " +
    "half-the-table threshold, the ban on questions during the round, the " +
    "five-to-twelve table, the twenty-five-to-forty minute block, and every " +
    "step and contingency. THE MARKED CARD IS THE INTERPRETIVE CHOICE: her " +
    "second sentence reads as a promise to the room, and the house has made " +
    "it a mechanism, because a liar chosen by the host is a liar the host " +
    "has an opinion about. Drawn at random it is genuinely not the one you " +
    "think, including for her.\n\n" +
    "CHECKED AGAINST THE KILLS: this room's two killed items are the belote " +
    "sheet and the cochonnet. Neither is named, needed or implied here — the " +
    "pack is an ordinary pack and one card has a mark on the back.\n\n" +
    "EXACTLY HALF WAS UNDEFINED AND IS NOW THE LIAR'S. The earlier draft " +
    "said the liar wins on fewer than half and the room wins on more than " +
    "half, and said nothing about the case in between — which at a table of " +
    "six or eight or ten is the single most likely count there is. The room " +
    "needs MORE THAN HALF; anything under that, exactly half included, is " +
    "the liar's, on the reasoning that a table which did not agree did not " +
    "catch anybody. TWO SMALLER THINGS FIXED WITH IT: the round now starts " +
    "at the dealer's left rather than at an unspecified point in an " +
    "unspecified seating order, and the liar's job is stated as inventing a " +
    "whole afternoon rather than as the earlier draft's `did not have the " +
    "afternoon everybody else had`, which describes a state of affairs and " +
    "not a thing to do.",

  runbook: {
    hostRole: "plays_too",
    hostNote:
      "You draw a card like everybody else and you may be the one lying. " +
      "The only job is marking a card before anybody arrives and not " +
      "looking at what anybody draws.",
    steps: [
      {
        step: "mark_one_card",
        phase: "before",
        instruction: "Mark the back of one card so it can be told by touch, not by sight.",
        detail:
          "A thumbnail crease in one corner. Anything visible from across " +
          "the table gets spotted while it is being dealt, and the round is " +
          "over before it starts.",
        supplyItem: "A pack of cards",
      },
      {
        step: "count_the_pack_down",
        phase: "before",
        instruction: "Take the pack down to exactly one card per person, marked one included.",
        detail:
          "Exactly one each. A pack with spares in it means the marked card " +
          "might not be dealt, and a round with no liar in it is twenty " +
          "minutes nobody gets back.",
        supplyItem: "A pack of cards",
      },
      {
        step: "deal_and_say_the_rule",
        phase: "opening",
        instruction: "Deal one card face down each, then say the rule before anybody looks.",
        detail:
          "Dealt first, explained second. A table that knows what it is " +
          "looking for watches the dealing instead of listening.",
        say: "One card each, one of them is marked. Look at yours now, do not react, and put it back face down. Whoever has the mark is telling us about an afternoon that did not happen.",
        minutes: 3,
        printedPiece: "rules_card",
      },
      {
        step: "the_no_questions_rule",
        phase: "opening",
        instruction: "Say that nobody may ask anybody anything until the pointing, and say how it is won.",
        detail:
          "Both, before the first story. No questions is what keeps it a " +
          "story game rather than an interrogation — questions find the liar " +
          "in four minutes and nothing interesting is said for the rest of " +
          "it. And a table that knows more than half of them have to agree " +
          "listens differently from one that thinks a single good guess wins.",
        say: "Nobody asks anybody anything until the end. Then we all point at once, and it takes more than half of us on the same person to catch them.",
        minutes: 3,
      },
      {
        step: "round_the_table",
        phase: "playing",
        instruction: "Left from whoever is on the dealer's left. One story each, and no interruptions.",
        detail:
          "Seating order and not volunteers, so the liar cannot choose to go " +
          "last and build on six true accounts. The person who goes first " +
          "has the hardest job whichever card they hold. The round is over " +
          "when it has gone all the way round once.",
        minutes: 22,
      },
      {
        step: "point_at_once",
        phase: "deciding",
        instruction: "Count to three and everybody points. No talking first, and nobody points at themselves.",
        detail:
          "At once, with no discussion beforehand — a table that confers " +
          "arrives at one answer, and the whole information in this game is " +
          "how the table splits. Then count the fingers on each person out " +
          "loud. More than half on one person and the room has them; " +
          "anything less, exactly half included, and the liar has won.",
        say: "On three. Do not say anything first, and do not point at yourself.",
        minutes: 6,
      },
      {
        step: "turn_the_card_over",
        phase: "ending",
        instruction: "The liar turns their card over, nothing is awarded, and nobody explains anything.",
        detail:
          "Whichever way it went, there is no prize and no score kept. No " +
          "post-mortem and no going back through who said what: the table " +
          "wants to, and it is the thing that ends the evening ten minutes " +
          "early.",
        say: "Turn it over. And nobody go back through it.",
        minutes: 4,
      },
    ],
    contingencies: [
      {
        trouble: "will_not_play",
        answer:
          "Somebody who will not tell a version does not draw a card and " +
          "counts the pointing instead. It is a real job and they are the " +
          "only person at the table who can be believed afterwards.",
      },
      {
        trouble: "under_minimum",
        answer:
          "Under five, one liar against three is found immediately. Mark " +
          "two cards instead and let the two of them be lying " +
          "independently, neither knowing about the other.",
      },
      {
        trouble: "over_size",
        answer:
          "Above twelve the round is forty minutes of listening. Mark two " +
          "cards, keep the same clock, and cut each version to a minute.",
      },
      {
        trouble: "running_long",
        answer:
          "Put a minute on each version from wherever you are and say so. " +
          "The pointing is the part that must not be cut; a round that ends " +
          "without one is a round that ended.",
      },
      {
        trouble: "played_before",
        answer:
          "A guest who has played will tell a true story badly on purpose to " +
          "draw the pointing. That is the best thing that can happen to this " +
          "game and it is why the marked card is drawn rather than assigned.",
      },
      {
        trouble: "not_landing",
        answer:
          "If three versions in a row are two sentences long, the table is " +
          "protecting itself. Go next, tell a long and specific one, and the " +
          "person after you will match it.",
      },
    ],
  },

  facets: [
    {
      dimension: "group_fun",
      code: "theatre",
      weight: 0.9,
      note:
        "One guest invents an entire afternoon and has to hold it under questioning.",
    },
    {
      dimension: "group_fun",
      code: "board_games",
      weight: 0.6,
      note:
        "A pack with one marked card, dealt round a table.",
    },
    { dimension: "group_fun", code: "keep_a_secret", weight: 1 },
    { dimension: "affinity", code: "wit", weight: 0.9 },
    { dimension: "group_fun", code: "perform", weight: 0.7 },
    { dimension: "group_fun", code: "long_dinner", weight: 0.7 },
    { dimension: "group_fun", code: "compete", weight: 0.5 },
    { dimension: "affinity", code: "one_moment", weight: 0.4 },
    {
      dimension: "anti_preference",
      code: "forced_fun",
      weight: 0.6,
      note: "Everybody speaks in turn and everybody is pointed at.",
    },
  ],

  occasions: [],
  slots: [
    { slotCode: "game", fit: "native" },
    { slotCode: "the_moment", fit: "native" },
  ],

  supplies: [
    {
      item: "A pack of cards",
      detail:
        "Any pack. One card gets a crease in the corner and the pack goes " +
        "down to one card per person.",
      source: "on_hand",
      quantity: 1,
    },
  ],
  requirements: [
    { requirement: "table_space", note: "Everybody seated in an order, because the round goes in it." },
    { requirement: "printing" },
  ],
  printedMatter: [
    {
      piece: "rules_card",
      label: "The rule",
      description:
        "One card, propped in the middle of the table where the dealing " +
        "happens, printed one side only. Her sentence, whole, and nothing " +
        "else on it: Everybody tells the story of this afternoon. One of " +
        "them is lying, and it is not the one you think. It is read by the " +
        "table rather than aloud by the host, so it is set to be legible " +
        "upside down from across a table of twelve.",
      voicePiece: "game_rule",
      quantity: 1,
    },
  ],
  dependencies: [],
  worlds: [
    {
      world: "cote-dazur",
      native: true,
      note: "Written in this room's voice. A whitelist, per rule 23.",
    },
  ],
};

/**
 * PORTOFINO — THE BOAT COUNT.
 *
 * An ambient game that costs one line of writing and settles itself on the way
 * back. What is counted is the room's own furniture and her sentence names it;
 * the caveat says so where a host will read it.
 */
const PORTOFINO_THE_BOAT_COUNT: Game = {
  slug: "portofino-the-boat-count",
  name: "The Boat Count",
  description:
    "Everybody writes down the count before anybody leaves. Whoever is " +
    "furthest out at the end buys the espresso.",
  howItWorks:
    "Before anybody goes anywhere, while people are still finding shoes and " +
    "keys, everybody writes one number on a slip: how many are out there. " +
    "The host says in four words what is being counted before anybody " +
    "writes. Nobody goes and counts properly and nobody is allowed to; the " +
    "whole thing takes eight seconds and each person folds their own slip " +
    "into their own pocket. Nobody collects them.\n\n" +
    "The count is settled on the way back, out loud, by whoever is walking " +
    "at the front. Whatever they say is the number, the group argues it down " +
    "to one in about a minute, and it is almost certainly wrong. Nobody goes " +
    "back to check.\n\n" +
    "At the bar, everybody pulls their slip out and reads their number, " +
    "going round. Whoever is furthest from the agreed number buys the " +
    "espresso. If two are equally far out, they buy a round each. There is " +
    "no second place, nobody keeps a record from one day to the next, and if " +
    "the group is not going anywhere with a bar in it, the forfeit is the " +
    "coffee at the house and the loser makes it.",
  materials:
    "THE HOUSE PRINTS the slips, one a head, small enough to go in a " +
    "pocket. YOU SUPPLY two pencils by the door, and something out there " +
    "worth counting.",

  shape: "ambient",
  sourcing: "provided",
  minGuests: 3,

  scoring:
    "One number each, written before leaving. Furthest from the count the " +
    "group agrees on afterwards buys the espresso, and two equally far out " +
    "buy a round each. Nothing carries to the next day.",

  caveat:
    "It counts what is out there, and the room's own material is what " +
    "supplies it. A house with nothing to count from where the group starts " +
    "cannot run this one, and a host is better told that now than at the " +
    "moment she asks for a number.",

  sourceNote: ROOM_VOICE,
  notes:
    'HER RULE, VERBATIM: "Everybody writes down the boat count before we ' +
    'leave. Whoever is furthest out buys the espresso."\n\n' +
    "AUTHORED HERE: the written slip, the count being settled by agreement " +
    "on the way back rather than by anybody counting properly, the " +
    "three-guest floor, the ambient shape, the caveat, and every step and " +
    "contingency. RULE 25's FIRST TEST, ANSWERED PLAINLY: her sentence names " +
    "boats and this room's whole voice is a house above a harbour, so the " +
    "room's own material establishes what is counted. Nothing here adds a " +
    "boat to a room that has none.\n\n" +
    "TWO ADDITIONS, BOTH OF THEM THINGS A HOST HITS ON THE FIRST RUN. A tie " +
    "for furthest out: both buy, one round each, rather than a play-off " +
    "over a coffee. And a group not walking to a bar: the loser makes the " +
    "coffee at the house. The earlier draft named the bar as the place the " +
    "forfeit is paid without saying what to do when there is not one, which " +
    "leaves the smallest stake in the catalogue unpayable in an apartment — " +
    "rule 25's first test, arriving through a side door.",

  runbook: {
    hostRole: "plays_too",
    hostNote:
      "You write a number too, and yours is as wrong as everybody else's. " +
      "The only job is asking for the numbers before anybody has their shoes " +
      "on.",
    steps: [
      {
        step: "cut_the_slips",
        phase: "before",
        instruction: "Put slips and a pencil by the door, where people stop to find keys.",
        detail:
          "By the door and not on the table. This has to happen in the " +
          "thirty seconds when everybody is already standing up.",
        printedPiece: "count_slips",
      },
      {
        step: "decide_what_counts",
        phase: "before",
        instruction: "Decide before you ask what is being counted, and be able to say it in four words.",
        detail:
          "Everything out there, or only the moored ones, or only the ones " +
          "you can see from the step. A rule invented after the numbers are " +
          "written is a rule somebody lost by.",
      },
      {
        step: "ask_for_it_at_the_door",
        phase: "opening",
        instruction: "Ask for the number while people are putting shoes on, and do not wait.",
        detail:
          "Eight seconds each. Anybody who wants to go and look properly is " +
          "told no, which is the only enforcement this game has and the " +
          "reason it is quick.",
        say: "A number each on a slip before we go, and it is everything you can see from the step. Do not go and count. Keep your own slip.",
        printedPiece: "count_slips",
      },
      {
        step: "pockets",
        phase: "underway",
        instruction: "Everybody folds their own slip into their own pocket. You do not collect them.",
        detail:
          "Collected slips are a list you have to carry and produce. Kept " +
          "slips get pulled out of a pocket at the right moment by the " +
          "person who wrote one. It runs entirely on trust, which is what a " +
          "coffee is worth.",
      },
      {
        step: "settle_it_walking_back",
        phase: "underway",
        instruction: "On the way back, ask whoever is at the front what the count is.",
        detail:
          "Whoever is walking in front, and whatever they say. The group " +
          "will argue it down to one number in about a minute and that " +
          "number is the truth for the purposes of an espresso. Nobody goes " +
          "back to look, whatever anybody claims.",
      },
      {
        step: "the_espresso",
        phase: "ending",
        instruction: "At the bar, everybody reads their slip out, and the furthest from the number pays.",
        detail:
          "Going round, out loud, slips held up. At the bar and not on the " +
          "walk — the paying has to happen where the paying happens, or it " +
          "is a result rather than a forfeit. Two people equally far out buy " +
          "a round each. Where there is no bar, the loser makes the coffee " +
          "at the house.",
        say: "Slips out. Furthest is buying.",
      },
      {
        step: "nothing_carries",
        phase: "ending",
        instruction: "Throw the slips away at the table and do not keep a running record.",
        detail:
          "There is no standing champion and no ledger of who has bought " +
          "what. It is a coffee, and a group that starts keeping score has " +
          "turned a walk into a league.",
      },
    ],
    contingencies: [
      {
        trouble: "will_not_play",
        answer:
          "Somebody who will not write a number is the one who settles the " +
          "count on the way back, which is a better job and comes with " +
          "nobody able to accuse them of anything.",
      },
      {
        trouble: "under_minimum",
        answer:
          "Under three, one person buys and the other watches, which is not " +
          "a game. Guess together, out loud, and let the walk be the walk.",
      },
      {
        trouble: "over_size",
        answer:
          "Above twelve, the reading of the slips takes longer than the " +
          "espresso. Take four numbers from whoever offers first and settle " +
          "it between those.",
      },
      {
        trouble: "running_long",
        answer:
          "It has no length. What runs long is the argument about the count, " +
          "and the answer is that whoever is walking in front decides it and " +
          "the walk carries on.",
      },
      {
        trouble: "played_before",
        answer:
          "A guest who has done this before will write a number so absurd it " +
          "cannot be furthest, because everybody else will bracket the " +
          "truth. Let them. It works once.",
      },
      {
        trouble: "not_landing",
        answer:
          "If nobody produces a slip at the bar, buy the espresso yourself " +
          "and do not mention it. An ambient game that is quietly dropped " +
          "leaves nothing behind.",
      },
    ],
  },

  facets: [
    { dimension: "affinity", code: "ease", weight: 0.9 },
    { dimension: "affinity", code: "wit", weight: 0.7 },
    { dimension: "group_fun", code: "wander", weight: 0.8 },
    { dimension: "group_fun", code: "compete", weight: 0.4 },
    { dimension: "affinity", code: "ritual", weight: 0.4 },
    {
      dimension: "anti_preference",
      code: "surprise_cost",
      weight: 0.2,
      note: "One person buys coffee. It is the smallest stake in this catalogue and it is still a stake.",
    },
    {
      dimension: "anti_preference",
      code: "schedule",
      weight: -0.6,
      note: "It takes eight seconds and adds nothing to the day. It is the opposite of a schedule that runs the day.",
    },
  ],

  occasions: [],
  slots: [
    {
      slotCode: "game",
      fit: "native",
      note: "db/061 collapsed the five game beats into one. This is the beat now, and she chooses among what the room offers.",
    },
    { slotCode: "ambient_game", fit: "native" },
  ],

  supplies: [
    {
      item: "Pencils",
      detail: "Two by the door. Nobody is going to look for one.",
      source: "on_hand",
    },
  ],
  requirements: [{ requirement: "printing" }],
  printedMatter: [
    {
      piece: "count_slips",
      label: "The slips",
      description:
        "One a head, small enough for a pocket. Her sentence, whole, at the " +
        "head: Everybody writes down the boat count before we leave. Whoever " +
        "is furthest out buys the espresso. Under it room for one number and " +
        "nothing else.",
      voicePiece: "game_rule",
      perGuest: true,
    },
  ],
  dependencies: [],
  worlds: [
    {
      world: "portofino",
      native: true,
      note: "Written in this room's voice. A whitelist, per rule 23.",
    },
  ],
};

/**
 * DOLOMITES — THE TEMPERATURE AT THE TOP.
 *
 * The same shape as the boat count and a different bet: a number written at
 * breakfast and settled by whatever the top says. The prize is a job rather
 * than an object, which is the room being itself.
 */
const DOLOMITES_THE_TEMPERATURE_AT_THE_TOP: Game = {
  slug: "dolomites-the-temperature-at-the-top",
  name: "The Temperature At The Top",
  description:
    "Everybody writes down what it will be at the top before the first car. " +
    "Whoever is closest reads the map at lunch.",
  howItWorks:
    "At breakfast, one slip each, already on the table. The room agrees out " +
    "loud which unit it is guessing in before a single number is written. " +
    "Then each person writes their name and, under it, what it will be at " +
    "the top.\n\n" +
    "Nobody may look anything up, out loud or otherwise. The slips are " +
    "handed to one person — somebody who is going up, and not the host — and " +
    "stay in that pocket until the top.\n\n" +
    "At the top, whoever carried them reads the real number first, from " +
    "whatever the top uses, and only then reads the slips out by name. " +
    "Whatever the top says is the number and there is no appeal against it.\n\n" +
    "Whoever is closest reads the map at lunch: they decide where lunch is " +
    "and what the afternoon does, until dinner, and nobody overrules them. " +
    "If two are equally close, both of them read it and lunch goes wherever " +
    "the two of them agree. Nothing else is won and nothing carries to the " +
    "next morning.",
  materials:
    "THE HOUSE PRINTS the slips, one a head, out on the breakfast table. " +
    "YOU SUPPLY two pencils, the map the day is actually planned from, " +
    "and a number at the top to settle it against — the posted reading, " +
    "the dial in the station, or a thermometer somebody carries up.",

  shape: "ambient",
  sourcing: "provided",
  minGuests: 3,

  scoring:
    "One number each, written before leaving. Closest to the number at the " +
    "top wins, and the prize is the map at lunch rather than an object.",

  caveat:
    "It needs a top with a number on it — a posted reading, a dial in the " +
    "station, or a thermometer somebody carries. A group that arrives at the " +
    "top with no way to settle the bet has a round of guesses and no result, " +
    "and that is worth knowing at breakfast rather than at eleven.",

  sourceNote: ROOM_VOICE,
  notes:
    'HER RULE, VERBATIM: "Everybody writes down the temperature at the top ' +
    'before the first car. Whoever is closest reads the map at lunch."\n\n' +
    "AUTHORED HERE: the written slip, agreeing the unit before anybody " +
    "writes, one person carrying all the slips, the ban on looking it up, " +
    "the three-guest floor, the ambient shape, the caveat, and every step " +
    "and contingency. Reading the map at lunch is read here as a REAL " +
    "PRIVILEGE — the winner decides the afternoon — which is the house " +
    "making her prize mean something. Her sentence permits the smaller " +
    "reading in which it is only a chore.\n\n" +
    "THE SLIPS NOW CARRY A NAME, AND THE TIE HAS A RULE. Printed as `one " +
    "number each` and carried in somebody else's pocket, a winning slip " +
    "belonged to nobody — the same defect Nantucket's card had, and both " +
    "are fixed the same way. The tie ruling was previously written down only " +
    "as advice inside the over-size contingency, where a host running a " +
    "group of six would never read it; two equally close both read the map " +
    "and agree lunch between them, and it is now a rule of the game. THE " +
    "PRIVILEGE ALSO HAS AN END: until dinner. It had none, and a prize with " +
    "no end is a prize somebody takes back at half past one.",

  runbook: {
    hostRole: "plays_too",
    hostNote:
      "You write a number and you can lose the map like everybody else. The " +
      "only job is asking at breakfast, before the boots.",
    steps: [
      {
        step: "cut_the_slips",
        phase: "before",
        instruction: "Put slips and a pencil on the breakfast table before anybody comes down.",
        detail:
          "On the table with the coffee. This is a thirty-second game and it " +
          "only happens if the paper is already there.",
        printedPiece: "guess_slips",
      },
      {
        step: "pick_the_pocket",
        phase: "before",
        instruction: "Decide who carries the slips, and make it somebody who is going up.",
        detail:
          "Not you, unless you are going. A pocket that stays at the house " +
          "is a bet that cannot be settled, and the person carrying them is " +
          "the one who reads them out.",
      },
      {
        step: "agree_the_unit",
        phase: "opening",
        instruction: "Agree the unit out loud, then say the rule: a name and a number on each slip.",
        detail:
          "Half the table thinks in one and half in the other, and a bet " +
          "settled across two units is an argument at the top in the wind. " +
          "The name matters as much as the number, because the slips are " +
          "read out by name at the top and an unsigned one cannot win.",
        say: "Same scale for everybody, say which before you write. Then your name on the slip and the number under it, and hand it in.",
        printedPiece: "guess_slips",
      },
      {
        step: "no_looking",
        phase: "underway",
        instruction: "Nobody looks anything up. Say it once and mean it.",
        detail:
          "One person reading a forecast aloud ends the game before the " +
          "first car. It is the only rule here that needs defending and it " +
          "is defended lightly, the first time.",
        say: "Not out loud, and not quietly either.",
      },
      {
        step: "read_them_at_the_top",
        phase: "underway",
        instruction: "At the top, read the real number first, then read every slip out by name.",
        detail:
          "The number first, and it is whatever the top says with no appeal " +
          "against it. Slips read first turn into a discussion about what " +
          "the number probably is, and somebody adjusts theirs out loud. " +
          "Whoever carried them reads them, not you.",
        supplyItem: "Whatever the top uses for a number",
      },
      {
        step: "hand_over_the_map",
        phase: "ending",
        instruction: "Give the winner the map, say how long it is theirs, and do not take it back.",
        detail:
          "Theirs until dinner: they choose where lunch is and what the " +
          "afternoon does, and nobody overrules them. Two equally close and " +
          "both of them read it, with lunch going wherever the two of them " +
          "agree. A host who overrules the map at half past one has taken " +
          "the stake out of the game for the rest of the week.",
        say: "You read it. We go where you say, until dinner.",
        supplyItem: "The map",
      },
    ],
    contingencies: [
      {
        trouble: "will_not_play",
        answer:
          "Somebody who will not guess carries the slips and reads them out " +
          "at the top. It is the one job in this game with no stake attached " +
          "and it has to be done by somebody.",
      },
      {
        trouble: "under_minimum",
        answer:
          "Under three, two guesses and one map is not a bet. Both read the " +
          "map, take one half of the day each, and drop the slips.",
      },
      {
        trouble: "over_size",
        answer:
          "Above fifteen, two people will tie and neither will give way. " +
          "Say at breakfast that a tie means both of them read it and lunch " +
          "goes wherever the two of them agree.",
      },
      {
        trouble: "running_long",
        answer:
          "The only thing that runs long is agreeing the unit. Give it one " +
          "minute, pick one yourself if it is still going, and hand out the " +
          "pencils.",
      },
      {
        trouble: "played_before",
        answer:
          "A guest who has done this will write a number they know is close " +
          "and then not want the map. Let them have it anyway; the map is " +
          "the prize and refusing it is not one of the rules.",
      },
      {
        trouble: "not_landing",
        answer:
          "If nobody writes one at breakfast, do not raise it at the top. " +
          "There is nothing to announce and nothing was lost.",
      },
    ],
  },

  facets: [
    { dimension: "affinity", code: "ease", weight: 0.8 },
    { dimension: "group_fun", code: "compete", weight: 0.6 },
    { dimension: "affinity", code: "ritual", weight: 0.6 },
    { dimension: "affinity", code: "wit", weight: 0.4 },
    { dimension: "group_fun", code: "wander", weight: 0.5 },
    {
      dimension: "anti_preference",
      code: "schedule",
      weight: 0.4,
      note:
        "The winner decides the afternoon, which means the afternoon is " +
        "decided. A host who vetoed a schedule running the day is entitled " +
        "to see this coming.",
    },
  ],

  occasions: [],
  slots: [
    {
      slotCode: "game",
      fit: "native",
      note: "db/061 collapsed the five game beats into one. This is the beat now, and she chooses among what the room offers.",
    },
    { slotCode: "ambient_game", fit: "native" },
  ],

  supplies: [
    {
      item: "Whatever the top uses for a number",
      detail:
        "The posted reading, the dial in the station, or a small thermometer " +
        "somebody puts in a pocket. Agreed at breakfast, not found at the top.",
      source: "on_hand",
      quantity: 1,
    },
    {
      item: "The map",
      detail: "The one the day is actually planned from, and it changes hands at the top.",
      source: "on_hand",
      quantity: 1,
    },
    {
      item: "Pencils",
      detail: "Two on the breakfast table.",
      source: "on_hand",
    },
  ],
  requirements: [{ requirement: "printing" }],
  printedMatter: [
    {
      piece: "guess_slips",
      label: "The slips",
      description:
        "One a head, out on the breakfast table. Her sentence, whole, at the " +
        "head: Everybody writes down the temperature at the top before the " +
        "first car. Whoever is closest reads the map at lunch. Under it a " +
        "rule for a name and one for the number, small enough that all of " +
        "them go in one person's pocket for the morning and are read out by " +
        "name at the top.",
      voicePiece: "game_rule",
      perGuest: true,
    },
  ],
  dependencies: [],
  worlds: [
    {
      world: "dolomites",
      native: true,
      note: "Written in this room's voice. A whitelist, per rule 23.",
    },
  ],
};
/**
 * BIG SUR — THE LONG WAY.
 *
 * The story game whose engine is the two prohibitions rather than a mechanic:
 * nobody may hurry anybody, and nobody can check a single fact. The second
 * clause is the room's own no-signal condition doing the work, which is why
 * this game does not travel.
 */
const BIG_SUR_THE_LONG_WAY: Game = {
  slug: "big-sur-the-long-way",
  name: "The Long Way",
  description:
    "One story each, told the long way, with the detours left in. Nobody " +
    "may hurry anybody and nobody can check a single fact.",
  howItWorks:
    "Everybody sits in a circle. Phones go in a bowl. The host goes first " +
    "and then it goes to the left, one story each, all the way round once.\n\n" +
    "The rule is that a story is told the long way. The detour about the car " +
    "is in. The two paragraphs about the person who is not in the story are " +
    "in. Anything that would normally be cut for time stays. There is no " +
    "clock on a story and nobody says how many are left to go.\n\n" +
    "Nobody may hurry anybody. Not with a look, not with a question that " +
    "moves it along, not by finishing a sentence. The room enforces it, not " +
    "the host: somebody says the rule out loud, lightly, and the story " +
    "carries on. If nobody in the room does it by the third story, the host " +
    "does it once and then goes back to not doing it.\n\n" +
    "And nobody can check a single fact, which here is a condition of the " +
    "place rather than a rule anyone imposes. A story that cannot be " +
    "verified is a story that gets told the way the teller remembers it.\n\n" +
    "Anybody may pass. A pass is a pass — it goes to the next person with no " +
    "comment and nobody comes back to them. THE GAME ENDS WHEN THE CIRCLE " +
    "HAS GONE ROUND ONCE, and the gap after the last story is left alone " +
    "until it turns into ordinary conversation. Nobody wins and nothing is " +
    "voted on.",
  materials:
    "THE HOUSE PRINTS one card. YOU SUPPLY somewhere everybody can sit in " +
    "a circle and a bowl for the phones, and yours goes in it first.",

  shape: "scheduled",
  sourcing: "provided",
  durationMinutes: 40,
  durationMaxMinutes: 60,
  minGuests: 4,
  maxGuests: 10,

  sourceNote: ROOM_VOICE,
  notes:
    'HER RULE, VERBATIM: "One story each, told the long way, with the ' +
    "detours. Nobody may hurry anybody and nobody can check a single " +
    'fact."\n\n' +
    "AUTHORED HERE: the four-to-ten group, the forty-to-sixty minute block, " +
    "the ordering by whoever is nearest the fire, the room rather than the " +
    "host enforcing the no-hurrying rule, and every step and contingency. " +
    "THE HOUSE'S ONE WORRY, WRITTEN DOWN RATHER THAN DESIGNED AWAY: this " +
    "room already carries a founder flag about preciousness risk on reading " +
    "aloud, and a circle of people telling long stories is a step from the " +
    "same cliff. The defence in this row is that nothing is read, nothing is " +
    "prepared, and the only instruction is to leave the boring parts in.\n\n" +
    "CHECKED AGAINST THE KILLS: this room's killed item is the Thoth tarot " +
    "card, with the deck surviving as an object. Nothing here uses a deck, " +
    "a card or a reading of any kind.\n\n" +
    "THE ENDING IS ONE LAP, NOT A SILENCE. The earlier draft ended it at " +
    "`when somebody finishes and nobody starts` — which is the same failure " +
    "the founder named: a game that stops when it fizzles. Worse here than " +
    "elsewhere, because a circle with no stated end and no clock is a circle " +
    "in which the last four people privately work out whether they are still " +
    "meant to go. Once round, passes counted as gone, and then the gap. THE " +
    "PASS IS ALSO A RULE NOW rather than an answer buried in a contingency, " +
    "and the no-hurrying rule says what the host does when the room does not " +
    "enforce it — she says it once, which is not the same as running it.",

  runbook: {
    hostRole: "plays_too",
    hostNote:
      "You tell one, and yours should be the longest, because whoever goes " +
      "first sets how long long is. There is no timing job in this game at " +
      "all.",
    steps: [
      {
        step: "make_the_circle",
        phase: "before",
        instruction: "Arrange the seating so everybody can see everybody without turning round.",
        detail:
          "A circle and not a table with ends. A person telling a long story " +
          "to the back of somebody's head shortens it without deciding to.",
      },
      {
        step: "put_the_phones_somewhere",
        phase: "before",
        instruction: "Put a bowl out for phones and put yours in it first.",
        detail:
          "Yours first and without a speech. Half the room follows and the " +
          "other half does not, and the half that does is enough to stop " +
          "anybody looking anything up.",
        supplyItem: "A bowl for phones",
      },
      {
        step: "say_the_two_rules",
        phase: "opening",
        instruction: "Say both rules, and say that the second one is not yours to enforce.",
        detail:
          "Nobody hurries anybody, and nothing can be checked. The second is " +
          "a fact about where you are, and saying so is what stops it " +
          "sounding like a house rule about phones.",
        say: "One story each, going left, told the long way with the detours left in. Nobody hurries anybody, and you can pass. There is no signal, so none of it can be checked.",
        minutes: 3,
        printedPiece: "rules_card",
      },
      {
        step: "go_first_and_go_long",
        phase: "opening",
        instruction: "Go first, and put a detour in that everybody can see is a detour.",
        detail:
          "The detour is the demonstration. Until somebody has watched a " +
          "story stop dead for two minutes about a car, everybody tells a " +
          "normal-length story and the game does not exist. Then it goes to " +
          "the person on your left, and left round from there.",
        minutes: 2,
      },
      {
        step: "round_the_fire",
        phase: "playing",
        instruction: "Left round the circle, one story each, no clock and nobody called on.",
        detail:
          "No clock anywhere and no announcement of how many are left — a " +
          "room that knows there are four to go starts editing on behalf of " +
          "the queue. A person who passes is passed with no comment and is " +
          "not returned to. If somebody hurries a teller and nobody in the " +
          "room says so, say it once yourself and then stop policing it.",
        minutes: 40,
      },
      {
        step: "let_it_stop",
        phase: "ending",
        instruction: "The circle goes round once and stops. Do not start a second lap.",
        detail:
          "Once round is the whole game, passes included. When the last " +
          "person finishes, leave the gap alone: it lasts about eight " +
          "seconds and then becomes a conversation. Nobody won anything and " +
          "there is nothing to say about it.",
        minutes: 5,
      },
    ],
    contingencies: [
      {
        trouble: "will_not_play",
        answer:
          "Nobody is called on. The circle goes round and a person who " +
          "passes is passed, once, with no comment and no coming back to " +
          "them later. Two of them usually tell one anyway at the end.",
      },
      {
        trouble: "under_minimum",
        answer:
          "Under four the circle comes back round in twenty minutes and " +
          "everybody has to find a second story. Let it be a conversation " +
          "and keep only the no-hurrying rule.",
      },
      {
        trouble: "over_size",
        answer:
          "Above ten, the last three people wait an hour and shorten their " +
          "stories to apologise for the wait. Split the circle in two and " +
          "let the halves rejoin whenever they finish.",
      },
      {
        trouble: "running_long",
        answer:
          "Do not cut a story. Cut the number of them: stop when the hour " +
          "is up, whoever has not gone, and say that they go first tomorrow. " +
          "Hurrying one person to fit the rest in breaks the only rule.",
      },
      {
        trouble: "played_before",
        answer:
          "Somebody who has done this before will tell the same story again, " +
          "longer. That is correct and it is the version to want; the " +
          "detours grow every year and that is the whole pleasure of it.",
      },
      {
        trouble: "not_landing",
        answer:
          "If three stories in a row come in under two minutes, the room is " +
          "being polite. Ask one question of the next person, about the " +
          "detour and not about the ending, and then say nothing for a while.",
      },
    ],
  },

  facets: [
    {
      dimension: "group_fun",
      code: "theatre",
      weight: 0.4,
      note:
        "One story each, told the long way with the detours left in, and nobody may hurry it.",
    },
    { dimension: "group_fun", code: "talk_deep", weight: 1 },
    { dimension: "affinity", code: "late", weight: 0.7 },
    { dimension: "group_fun", code: "long_dinner", weight: 0.7 },
    { dimension: "affinity", code: "ease", weight: 0.6 },
    { dimension: "affinity", code: "wit", weight: 0.4 },
    { dimension: "group_fun", code: "perform", weight: 0.3 },
    {
      dimension: "anti_preference",
      code: "photographed",
      weight: -0.7,
      note: "Phones are in a bowl. It is the opposite of an evening spent being photographed.",
    },
    {
      dimension: "anti_preference",
      code: "forced_fun",
      weight: 0.3,
      note: "The circle comes round to everybody, and passing is visible even when it is allowed.",
    },
  ],

  occasions: [],
  slots: [
    { slotCode: "game", fit: "native" },
    { slotCode: "day_material", fit: "native" },
  ],

  supplies: [
    {
      item: "A bowl for phones",
      detail: "Anything. It is not about the bowl, it is about yours going in it first.",
      source: "on_hand",
      quantity: 1,
    },
  ],
  requirements: [
    { requirement: "floor_space", note: "A circle everybody can see across, which a table with ends is not." },
    { requirement: "printing" },
  ],
  printedMatter: [
    {
      piece: "rules_card",
      label: "The rule",
      description:
        "One card, one side, propped in the middle of the circle against " +
        "the bowl the phones went into — the only object this game has, " +
        "and the reason the card has somewhere to stand. Her sentence, " +
        "whole: One story each, told the long way, with the detours. " +
        "Nobody may hurry anybody and nobody can check a single fact. The " +
        "second half is the half the room enforces on itself, so it is " +
        "set to be read from any seat in the circle rather than from one.",
      voicePiece: "game_rule",
      quantity: 1,
    },
  ],
  dependencies: [],
  worlds: [
    {
      world: "big-sur",
      native: true,
      note: "Written in this room's voice. A whitelist, per rule 23.",
    },
  ],
};

/**
 * TAHITI — THE LAST NIGHT.
 *
 * The bank document says GAMES: none, on purpose. CLAUDE.md rule 29 says that
 * line is stale and not a ruling, and that a room whose voice carries a game
 * resolves toward having one. This is that game, and the founder wrote it.
 */
const TAHITI_THE_LAST_NIGHT: Game = {
  slug: "tahiti-the-last-night",
  name: "The Last Night",
  description:
    "Everybody says what they would want on the last night. Name something " +
    "already on the table and you are cooking tomorrow.",
  howItWorks:
    "It runs at a full table, once, going left from whoever is on the host's " +
    "left. One turn each, out loud, no conferring and no changing an answer " +
    "once it is said. THE ROUND ENDS WHEN IT HAS GONE ALL THE WAY ROUND.\n\n" +
    "On your turn you say one thing you would want on the last night — the " +
    "meal you would ask for if this were the end of it. The catch is what is " +
    "in front of you: name something that is already on this table and you " +
    "cook tomorrow.\n\n" +
    "Whether a thing is on the table is settled by looking at it, not by " +
    "arguing about it. An ingredient of something is not the something. If " +
    "the table is genuinely split, it is not on the table and the person is " +
    "safe. Two people naming the same thing are both caught, or both safe, " +
    "together.\n\n" +
    "Nobody wins. There is only the forfeit: everybody caught cooks " +
    "tomorrow, and where that is two or three people they cook it together. " +
    "If nobody is caught, nobody cooks, and that is a good round rather than " +
    "a failed one.\n\n" +
    "Somebody writes the answers down while the round goes, because they are " +
    "the next three days of eating and nobody remembers them in the morning.",
  materials:
    "THE HOUSE PRINTS one card. YOU SUPPLY a full table with the food " +
    "already on it, and the back of anything to write the answers down on " +
    "— they are what the house cooks for the rest of the week.",

  shape: "scheduled",
  sourcing: "provided",
  durationMinutes: 10,
  durationMaxMinutes: 20,
  minGuests: 4,

  scoring:
    "One forfeit and no points, and nobody wins: anybody who names something " +
    "already on the table cooks tomorrow. More than one is allowed and they " +
    "cook together. Nobody caught means nobody cooks.",

  sourceNote: ROOM_VOICE,
  notes:
    'HER RULE, VERBATIM: "Everybody says what they would want on the last ' +
    "night. Whoever names something already on the table cooks " +
    'tomorrow."\n\n' +
    "AUTHORED HERE: the four-guest floor, the ten-to-twenty minute block, " +
    "going round rather than volunteering, more than one person being able " +
    "to lose, somebody writing the names down, and every step and " +
    "contingency. Writing the answers down is the house's addition and the " +
    "one worth arguing with: her sentence is a forfeit game and nothing " +
    "more, and the list of wants that comes out of it is a use somebody " +
    "found for it afterwards.\n\n" +
    "WHAT COUNTS AS ON THE TABLE IS NOW RULED. The whole game is one " +
    "judgement — is that thing on this table — and the earlier draft never " +
    "said who makes it or how. Settled by looking, an ingredient is not the " +
    "dish, and a genuinely split table means safe. NOBODY CAUGHT IS ALSO " +
    "ANSWERED, because it is a likely outcome at a careful table and the " +
    "earlier draft ended on a step that assumed at least one loser: nobody " +
    "cooks, and the round was a good one.\n\n" +
    "ON GAMES: NONE. docs/atmosphere-idea-bank-v1.md carries the line " +
    '"GAMES: none, on purpose" for this room. CLAUDE.md rule 29 rules that ' +
    "stale rather than authoritative: `none` writes no row and no negative " +
    "claim, and a room whose own voice carries a game_rule has a game. That " +
    "is not adjudicated here; it is applied.",

  runbook: {
    hostRole: "plays_too",
    hostNote:
      "You go somewhere in the middle and you can lose. Going last is the " +
      "only thing that would be unfair, because by then you have heard " +
      "everything that is safe to say.",
    steps: [
      {
        step: "let_the_table_fill_first",
        phase: "before",
        instruction: "Do not run it until the table is full. The food is the hazard.",
        detail:
          "Everything already out is a trap somebody can fall into, and a " +
          "half-laid table has half the game in it.",
      },
      {
        step: "put_a_pencil_by_your_plate",
        phase: "before",
        instruction: "Keep something to write on beside you, out of the way.",
        detail:
          "The answers are the next three days of eating. Nobody remembers " +
          "them in the morning and nobody thinks to write them down at the " +
          "time.",
        supplyItem: "Something to write the answers on",
      },
      {
        step: "ask_it_between_courses",
        phase: "opening",
        instruction: "Ask it when the table has stopped moving, not while food is arriving.",
        detail:
          "It needs everybody looking at the same table at the same moment. " +
          "Asked while a dish is coming out, half the room has not seen what " +
          "is on it yet.",
        say: "One each, going left: what would you want on the last night. Name anything that is already on this table and you are cooking tomorrow, so look before you answer.",
        minutes: 2,
        printedPiece: "rules_card",
      },
      {
        step: "start_left_and_go_round",
        phase: "opening",
        instruction: "Start with whoever is on your left and go round once. No volunteers.",
        detail:
          "In order, and the round is over when it comes back to you. " +
          "Volunteers means the confident people go first and everybody else " +
          "answers a question that has already been answered six times.",
        minutes: 2,
      },
      {
        step: "the_round",
        phase: "playing",
        instruction: "One each, out loud, no conferring, and write down what they say as they say it.",
        detail:
          "Nobody gets to change an answer once it is said. Whether a thing " +
          "is on the table is settled by looking, in two seconds: an " +
          "ingredient of something is not the something, and a table that is " +
          "genuinely split means the person is safe. Two people naming the " +
          "same thing are both caught or both safe together.",
        minutes: 10,
        supplyItem: "Something to write the answers on",
      },
      {
        step: "name_tomorrows_cook",
        phase: "ending",
        instruction: "When the round is back to you, say who is cooking tomorrow. Name all of them.",
        detail:
          "Two or three cook together, which is better than any of them " +
          "cooking alone, and nobody is let off for being close. If nobody " +
          "was caught, say so and let it stand: nobody cooks, nobody wins, " +
          "and the list of answers is still the week's food.",
        say: "That is on the table. You are cooking tomorrow.",
        minutes: 4,
      },
    ],
    contingencies: [
      {
        trouble: "will_not_play",
        answer:
          "Somebody who will not answer is skipped and is not the person " +
          "cooking. It is a ten-minute round and there is nothing to be " +
          "gained by pressing anybody in front of a full table.",
      },
      {
        trouble: "under_minimum",
        answer:
          "Under four, everybody cooks anyway and the forfeit is not one. " +
          "Ask the question, write the answers down, and skip the penalty.",
      },
      {
        trouble: "over_size",
        answer:
          "Above fifteen the round is longer than the course. Ask one half " +
          "of the table tonight and the other half tomorrow, and the second " +
          "night is harder because the table is fuller.",
      },
      {
        trouble: "running_long",
        answer:
          "It runs long when people justify their answers. Ask for the thing " +
          "and not the reason, and move on before the reason starts.",
      },
      {
        trouble: "played_before",
        answer:
          "Somebody who has played will name something absurd and " +
          "unobtainable to be safe. Allow it. They are cooking tomorrow " +
          "anyway if it turns out somebody brought one.",
      },
      {
        trouble: "not_landing",
        answer:
          "If four people in a row name something nobody could get, the " +
          "round has become a competition to be clever. Say the next answer " +
          "yourself and make it something plain and true.",
      },
    ],
  },

  facets: [
    {
      dimension: "group_fun",
      code: "group_games",
      weight: 0.6,
      note:
        "It goes round the whole table and everybody has to say one.",
    },
    { dimension: "group_fun", code: "long_dinner", weight: 1 },
    { dimension: "affinity", code: "ritual", weight: 0.7 },
    { dimension: "group_fun", code: "cook_together", weight: 0.6 },
    { dimension: "affinity", code: "wit", weight: 0.5 },
    { dimension: "group_fun", code: "compete", weight: 0.3 },
    { dimension: "affinity", code: "ease", weight: 0.4 },
    {
      dimension: "anti_preference",
      code: "forced_fun",
      weight: 0.5,
      note: "It goes round the table and everybody answers in turn, in front of everybody.",
    },
  ],

  occasions: [],
  slots: [
    { slotCode: "game", fit: "native" },
    { slotCode: "day_material", fit: "native" },
  ],

  supplies: [
    {
      item: "Something to write the answers on",
      detail: "The back of anything. The answers are what the house cooks for the rest of the week.",
      source: "on_hand",
      quantity: 1,
    },
  ],
  requirements: [
    { requirement: "table_space", note: "Everybody at one table, and the table already laid." },
    { requirement: "printing" },
  ],
  printedMatter: [
    {
      piece: "rules_card",
      label: "The rule",
      description:
        "One card, one side, standing in the middle of a table that " +
        "already has the food on it — so it is set to survive being " +
        "moved, splashed and put back. Her sentence, whole: Everybody " +
        "says what they would want on the last night. Whoever names " +
        "something already on the table cooks tomorrow. The forfeit is " +
        "the half people check twice, so it never falls below a fold.",
      voicePiece: "game_rule",
      quantity: 1,
    },
  ],
  dependencies: [],
  worlds: [
    {
      world: "tahiti",
      native: true,
      note: "Written in this room's voice. A whitelist, per rule 23.",
    },
  ],
};

/**
 * ACAPULCO — THE LAST SONG.
 *
 * A finale in the strict sense: it decides how the night ends, and it spends
 * something the whole evening produced — the list of what has already played.
 * The room's document also says GAMES: none. Rule 29 again: stale, not a
 * ruling.
 */
const ACAPULCO_THE_LAST_SONG: Game = {
  slug: "acapulco-the-last-song",
  name: "The Last Song",
  description:
    "Everybody names the last song. Name one that has already played and " +
    "you are going in the water.",
  howItWorks:
    "A card lives by the speaker all night and whoever changes the music " +
    "writes down what they put on. Nobody is in charge of it and it is never " +
    "read out until the end. It will have holes in it, and THE CARD IS THE " +
    "ONLY EVIDENCE THERE IS: if a song is not written on it, it did not " +
    "play, whatever anybody remembers.\n\n" +
    "At the end, the host holds the card up where everyone can see it and " +
    "goes round the room to the left, starting on her left. One name each, " +
    "out loud, fast: the last song. Not a song they like — the one that " +
    "should be the last thing anybody hears tonight.\n\n" +
    "Name one that is on the card and you go in the water. Everybody caught " +
    "goes in, together, and their name is out of the choosing. Nobody caught " +
    "means nobody goes in.\n\n" +
    "Then the host reads the surviving names back, one at a time, and the " +
    "room shouts for the one it wants. She says which was loudest and there " +
    "is no second round; if she genuinely cannot tell, she plays the one " +
    "named by whoever went in the water.\n\n" +
    "The swim happens first and the song second. Then it plays, and nothing " +
    "goes on after it. Nobody wins anything.",
  materials:
    "THE HOUSE PRINTS one card: the rule at the head and the ruled list " +
    "under it, and it lives by the speaker all night. YOU SUPPLY a pencil " +
    "beside it that will still be there at midnight, the music, and the " +
    "water the forfeit needs.",

  shape: "finale",
  sourcing: "provided",
  durationMinutes: 10,
  durationMaxMinutes: 20,
  minGuests: 5,

  scoring:
    "One forfeit and one choice, and nobody wins. Anybody who names " +
    "something written on the card goes in and is out of the choosing; the " +
    "room picks the last song from what is left, by the loudest shout rather " +
    "than by a count, and the host says which was loudest.",

  caveat:
    "The forfeit is a swim, and the room's own material is what supplies the " +
    "water. A host running this where there is none should know that before " +
    "she starts rather than at the moment somebody has to go in — the rule " +
    "is the founder's and the substitution, if there has to be one, is hers " +
    "to make and not the house's.",

  sourceNote: ROOM_VOICE,
  notes:
    'HER RULE, VERBATIM: "Everybody names the last song. Whoever names one ' +
    'already played goes in the water."\n\n' +
    "AUTHORED HERE: the card by the speaker that makes the forfeit " +
    "checkable, the finale shape, the five-guest floor, the " +
    "ten-to-twenty minute block, the room choosing the last song from what " +
    "survives, the caveat, and every step and contingency. THE CARD IS THE " +
    "LOAD-BEARING ADDITION: her rule turns on what has already played, and " +
    "without a written list the forfeit is decided by whoever remembers " +
    "loudest, which is an argument rather than a game.\n\n" +
    "AND THE CARD IS NOW THE ONLY EVIDENCE, WHICH THE EARLIER DRAFT STOPPED " +
    "SHORT OF SAYING. It admitted the card would be missing four or five " +
    "songs and called that fine, then hung a forfeit on it without ruling " +
    "what happens when the room remembers a song the card does not. Not on " +
    "the card, did not play. It is the only version that can be settled at " +
    "one in the morning. THE CHOOSING WAS ALSO UNRUNNABLE: `the room picks " +
    "by the loudest agreement` is not an instruction — the names are now " +
    "read back one at a time, the room shouts, the host calls it, and a " +
    "genuine dead heat goes to whoever is going in the water. AND NOBODY IS " +
    "PUT IN WATER WHO SAYS NO: they are out of the choosing instead, which " +
    "keeps a cost on it without a host pushing a guest off a step. This is " +
    "a finale, and every one of these was a decision it left to be improvised " +
    "at the last minute of the night.\n\n" +
    "ON GAMES: NONE, AND ON STAFF. docs/atmosphere-idea-bank-v1.md carries " +
    '"GAMES: none — the band, the window, and the dancing are the shelf" ' +
    "for this room. CLAUDE.md rule 29 rules that stale rather than " +
    "authoritative. And this room states rule 25's third test structurally — " +
    "there is no staff in this voice, things appear and nobody serves them — " +
    "so nobody runs this game: the card is written on by whoever happens to " +
    "be near the speaker, and the host plays.",

  runbook: {
    hostRole: "plays_too",
    hostNote:
      "You name one and you can go in the water. Nobody runs this: the card " +
      "gets written on by whoever is nearest, which is how the room already " +
      "works.",
    steps: [
      {
        step: "put_the_card_by_the_speaker",
        phase: "before",
        instruction: "Put a card and a pencil where the music is, and write the first song on it yourself.",
        detail:
          "The first line has to be written by somebody or the card stays " +
          "empty all night. After the first one it keeps itself.",
        printedPiece: "the_played_card",
      },
      {
        step: "do_not_explain_it",
        phase: "before",
        instruction: "Say nothing about the card until the end.",
        detail:
          "A card everybody knows is evidence is a card people consult " +
          "before they answer, and the round stops being a round.",
      },
      {
        step: "let_it_fill",
        phase: "underway",
        instruction: "Let whoever changes the music write the song down. Do not chase it.",
        detail:
          "It will be missing four or five and that is fine — a card with " +
          "holes in it lets somebody get away with one, which is better than " +
          "a card that catches everybody. What is written on it is settled, " +
          "and what is not on it did not play.",
        printedPiece: "the_played_card",
      },
      {
        step: "call_it_late",
        phase: "opening",
        instruction: "Call it when the room has thinned but the floor has not emptied.",
        detail:
          "Too early and there is a lot of night after the last song. Too " +
          "late and there is nobody to hear it.",
        say: "Last song. One each, going round from here, and it had better not be on this card.",
        minutes: 2,
        printedPiece: "the_played_card",
      },
      {
        step: "round_the_room",
        phase: "playing",
        instruction: "Left from whoever is beside you. One name each, fast, with the card held up.",
        detail:
          "Held up and visible, so everybody watches the same list. The card " +
          "is the only evidence: a song not written on it did not play, " +
          "whatever anybody remembers, and that is not open to argument. The " +
          "round is over when it has been round once.",
        minutes: 8,
        printedPiece: "the_played_card",
      },
      {
        step: "pick_it_from_what_is_left",
        phase: "deciding",
        instruction: "Read the surviving names back one at a time and let the room shout for one.",
        detail:
          "Anybody caught is out of the choosing. You say which was loudest " +
          "and there is no second round; if you genuinely cannot tell, play " +
          "the one named by whoever is going in the water. Nobody caught " +
          "means nobody is out and you pick from the whole list.",
        say: "Shout for the one you want. I am only asking once.",
        minutes: 3,
      },
      {
        step: "the_water",
        phase: "ending",
        instruction: "Everybody caught goes in together, and nobody who says no is made to.",
        detail:
          "The song is already chosen; it is not played until they are out " +
          "of the water, so the song is the last thing rather than the " +
          "punishment being it. Somebody who will not go in " +
          "says so and nothing more is said about it — being out of the " +
          "choosing is the whole of what it costs them.",
        say: "That is on the card. In you go.",
        minutes: 3,
      },
      {
        step: "play_it_and_stop",
        phase: "ending",
        instruction: "Play the one the room shouted for and put nothing on after it.",
        detail:
          "Nothing after it, and nothing is awarded to anybody. The whole " +
          "game is that the night has an ending somebody chose, and one more " +
          "song makes it a night that ran out.",
        minutes: 4,
      },
    ],
    contingencies: [
      {
        trouble: "will_not_play",
        answer:
          "Somebody who will not name one holds the card and reads it. That " +
          "is the job with the power in it and it takes them out of the " +
          "water without anybody saying so.",
      },
      {
        trouble: "under_minimum",
        answer:
          "Under five, one person goes in and four people watch, which is " +
          "not the same game. Drop the forfeit, keep the round, and let the " +
          "room pick the last song.",
      },
      {
        trouble: "over_size",
        answer:
          "Above twenty the round takes twenty minutes at the end of a long " +
          "night. Take names from whoever is still on the floor and let " +
          "everybody else listen.",
      },
      {
        trouble: "running_long",
        answer:
          "Cut the round, not the ending. Six names is enough to find " +
          "somebody who has not been listening, and the last song is the " +
          "part that cannot be skipped.",
      },
      {
        trouble: "played_before",
        answer:
          "A guest who has done this will spend the evening memorising the " +
          "card, and will name something so obscure that the room refuses it " +
          "as a last song. Let the room refuse it. That is the room playing.",
      },
      {
        trouble: "not_landing",
        answer:
          "If the first four names are all safe and nobody is going in, stop " +
          "the round and play whichever of them the room liked best. The " +
          "ending is the point and the forfeit is the decoration.",
      },
    ],
  },

  facets: [
    {
      dimension: "group_fun",
      code: "group_games",
      weight: 0.8,
      note:
        "Everybody names one and the room is what catches a repeat.",
    },
    { dimension: "group_fun", code: "dance", weight: 0.9 },
    { dimension: "affinity", code: "late", weight: 0.9 },
    { dimension: "affinity", code: "one_moment", weight: 0.7 },
    { dimension: "group_fun", code: "swim_late", weight: 0.8 },
    { dimension: "affinity", code: "wit", weight: 0.5 },
    { dimension: "group_fun", code: "compete", weight: 0.3 },
    {
      dimension: "anti_preference",
      code: "forced_fun",
      weight: 0.6,
      note: "Everybody names one, and the forfeit for getting it wrong is getting wet in front of the party.",
    },
    {
      dimension: "anti_preference",
      code: "loud",
      weight: 0.5,
      note: "It happens at the end of a night of music at dancing volume.",
    },
  ],

  occasions: [],
  slots: [
    {
      slotCode: "game",
      fit: "native",
      note: "db/061 collapsed the five game beats into one. This is the beat now, and she chooses among what the room offers.",
    },
    { slotCode: "finale", fit: "native" },
  ],

  supplies: [
    {
      item: "A pencil by the speaker",
      detail: "Tied to something if the room is that kind of room. It has to still be there at midnight.",
      source: "on_hand",
      quantity: 1,
    },
  ],
  requirements: [
    {
      requirement: "music",
      note: "Music all evening, and something to write beside it. The card is only useful if the songs pass it.",
    },
    { requirement: "printing" },
  ],
  printedMatter: [
    {
      piece: "the_played_card",
      label: "What has played",
      description:
        "Her sentence, whole, at the head: Everybody names the last song. " +
        "Whoever names one already played goes in the water. Under it a " +
        "ruled card that lives by the speaker all night and is written on by " +
        "whoever changes the music. It is the evidence the forfeit runs on, " +
        "and the rule is on the same card so it is held up with it.",
      voicePiece: "game_rule",
      quantity: 1,
    },
  ],
  dependencies: [],
  worlds: [
    {
      world: "acapulco-1959",
      native: true,
      note: "Written in this room's voice. A whitelist, per rule 23.",
    },
  ],
};

/**
 * AMALFI, ONE OF TWO — THE NUMBERS, AFTER DARK.
 *
 * Her sentence contains rule 25's third test in the founder's own words:
 * whoever is calling is playing too. There is no caller in this house who is
 * not also holding a card, and that is the whole reason it is not a bingo hall.
 */
const AMALFI_THE_NUMBERS_AFTER_DARK: Game = {
  slug: "amalfi-the-numbers-after-dark",
  name: "The Numbers, After Dark",
  description:
    "The numbers are called after dark, with beans for markers. Whoever is " +
    "calling is playing too, which is what stops it being a hall.",
  howItWorks:
    "Everybody has a card of fifteen numbers, printed in three rows of five, " +
    "and a handful of dried beans. The tokens run from one to ninety and " +
    "come out of a cloth bag one at a time. The caller says the number, then " +
    "says what the sheet in the middle of the table claims that number " +
    "means, and everybody who has it puts a bean on it.\n\n" +
    "There are three things to win, in this order. A LINE is any one row of " +
    "five covered. TWO LINES is any two rows. A FULL CARD is all fifteen, " +
    "and it ends the round. You claim by shouting, the caller checks your " +
    "beans against the tokens already out of the bag, and a wrong claim just " +
    "carries on playing. Two people claiming on the same number both win it.\n\n" +
    "Where the evening has the row of wrapped parcels on the table, every " +
    "rung won takes the next one, unopened, and the winner keeps it on their " +
    "lap until they are all opened at the end of the night. Where there are " +
    "no parcels, a rung is won, said out loud, and nothing changes hands.\n\n" +
    "The caller is playing. She has her own card in front of her, she covers " +
    "her own numbers between calls, and she loses as often as anybody. When " +
    "a full card goes, the bag passes to whoever won it before anything " +
    "else, and they call the next round. Calling is a turn, not a role.\n\n" +
    "Play rounds until the parcels have run out, or until three full cards " +
    "have gone where there are none. That is the end of it, and the sheet of " +
    "what the numbers mean is where most of the shouting comes from all " +
    "evening.",
  materials:
    "THE HOUSE PRINTS the cards, one a head and two spare: fifteen " +
    "numbers in three rows of five on the front, what the numbers mean on " +
    "the back. YOU SUPPLY ninety numbered wooden tokens, a cloth bag " +
    "nobody can see into, and a handful of dried beans for every person.",

  shape: "scheduled",
  sourcing: "provided",
  durationMinutes: 45,
  durationMaxMinutes: 75,
  minGuests: 6,

  scoring:
    "A line of five, then two lines, then a full card, in that order, each " +
    "taking the next wrapped parcel unopened. Claimed by shouting and " +
    "checked against the tokens drawn; two claims on the same number both " +
    "win. Beans on the numbers and nothing written down. The caller plays " +
    "her own card and can win it.",

  sourceNote: ROOM_VOICE,
  notes:
    'HER RULE, VERBATIM: "The numbers are called after dark. Beans for ' +
    'markers, and whoever is calling is playing too."\n\n' +
    "AUTHORED HERE: the line, two lines and full card ladder, the bag " +
    "passing on a win so calling is a turn and not a role, the six-guest " +
    "floor, the forty-five-to-seventy-five minute block, and every step and " +
    "contingency. THE BAG PASSING IS THE HOUSE MAKING HER LAST CLAUSE " +
    "MECHANICAL: whoever is calling is playing too is a statement about " +
    "staff, and a caller who never stops calling is staff however many cards " +
    "she is holding.\n\n" +
    "THE CARD AND THE BAG NOW HAVE NUMBERS ON THEM. The earlier draft named " +
    "the rungs — a line, two lines, a full card — without ever saying how " +
    "many numbers are on a card or how a line is made of them, so a line was " +
    "a word rather than a thing anybody could look down and see. Fifteen " +
    "numbers in three rows of five, ninety tokens in the bag, and a line is " +
    "any one row. HOW A WIN IS CLAIMED was missing too: you shout, the " +
    "caller checks the beans against the tokens already out, a wrong claim " +
    "carries on, and two claims on the same number both win. AND THE ROUNDS " +
    "NOW END SOMEWHERE — the parcels running out, or three full cards where " +
    "the evening has no parcels — in place of `stop one round earlier than " +
    "the table wants to`, which is a good instinct and not a stopping rule.\n\n" +
    "TWO TABLES, ONE CATEGORY, AND THAT IS CORRECT. The bank already holds " +
    "this room's kit as a `bank_kind = 'game'` row: the board, the tokens, " +
    "the cloth bag, the printed cards. This row is the PLAYABLE CONTENT for " +
    "the same evening. db/038 argued that split at length and it is the " +
    "reason both tables now publish under one regime.",

  runbook: {
    hostRole: "plays_too",
    hostNote:
      "You call the first round and you play it. When somebody fills a " +
      "card, the bag goes to them and you are just a person with beans.",
    steps: [
      {
        step: "lay_the_cards_out",
        phase: "before",
        instruction: "Put a card and a small pile of beans at every place, including yours.",
        detail:
          "Including yours, and set out before anybody sits. A caller " +
          "fetching her own card after the first number is a caller who is " +
          "not really playing.",
        supplyItem: "Dried beans",
        printedPiece: "number_cards",
      },
      {
        step: "put_the_meanings_out",
        phase: "before",
        instruction:
          "Put a spare card in the middle, meanings side up, where two " +
          "people can reach it.",
        detail:
          "It gets picked up and read out at volume about nine times an " +
          "hour. That is not a distraction from the game, it is most of it.",
        printedPiece: "number_cards",
      },
      {
        step: "wait_for_dark",
        phase: "opening",
        instruction: "Do not start until it is actually dark. Her rule says after dark.",
        detail:
          "It is the one thing about the timing that is hers and it is worth " +
          "keeping. A round called in daylight is a card game; called in the " +
          "dark with the lights on it is an event.",
        say: "The numbers are after dark, and it is dark.",
        minutes: 3,
        printedPiece: "number_cards",
      },
      {
        step: "say_the_three_things_to_win",
        phase: "opening",
        instruction: "Say the three rungs, how a win is claimed, and that the caller plays too.",
        detail:
          "A line is any row of five, two lines is any two rows, a full card " +
          "is all fifteen and ends the round. You claim by shouting and the " +
          "caller checks the beans against the tokens out of the bag. Say " +
          "also that the bag moves when a card fills, so nobody spends the " +
          "first round waiting to be told the host is running it. Nobody is " +
          "running it.",
        say: "A line of five, then two lines, then the full card. Shout when you have it and I will check it. Whoever fills a card takes the bag off me and calls the next one.",
        minutes: 3,
        supplyItem: "A bag for the tokens",
      },
      {
        step: "call_them",
        phase: "playing",
        instruction: "One token at a time, slowly, the number first and then what the sheet says.",
        detail:
          "Slowly enough to cover your own card between calls. If you cannot " +
          "keep up with your own card, you are calling too fast for the " +
          "oldest person at the table as well. A wrong claim is checked, " +
          "waved off and the round carries on; nobody is out for one.",
        minutes: 45,
        supplyItem: "A bag for the tokens",
      },
      {
        step: "hand_the_parcel_over",
        phase: "deciding",
        instruction: "Where there are parcels, each rung won takes the next one, unopened, on a lap.",
        detail:
          "Unopened, and it stays that way until they are all opened at the " +
          "end of the night. Two people claiming the same rung on the same " +
          "number both take one. Where the evening has no parcels, the rung " +
          "is said out loud and nothing changes hands, which costs the game " +
          "nothing.",
        minutes: 4,
      },
      {
        step: "the_bag_moves",
        phase: "deciding",
        instruction: "When somebody fills a card, hand them the bag before anything else.",
        detail:
          "Before the parcel, before the beans are cleared. Everybody sweeps " +
          "their beans off, the tokens go back in the bag, and the new " +
          "caller starts the next round. The bag moving is the visible fact " +
          "that this house has no caller.",
        minutes: 5,
      },
      {
        step: "stop_when_the_parcels_are_gone",
        phase: "ending",
        instruction: "Stop when the parcels have run out, or after three full cards where there are none.",
        detail:
          "A stated number of rounds and nothing to judge. If a round is " +
          "still running when the last parcel goes, play it out to the full " +
          "card and stop there. Then the bag goes away, whoever is holding " +
          "it, and the beans go back in the jar.",
        minutes: 3,
      },
    ],
    contingencies: [
      {
        trouble: "will_not_play",
        answer:
          "Somebody who will not take a card reads the meanings out. It is " +
          "the loudest job at the table and it does not require them to " +
          "cover a single number.",
      },
      {
        trouble: "under_minimum",
        answer:
          "Under six, a full card comes up in four minutes and the ladder " +
          "collapses. Give everybody two cards each and play only for the " +
          "full one.",
      },
      {
        trouble: "over_size",
        answer:
          "Above twenty, calling has to be loud enough that it stops being " +
          "warm. Split into two tables with two bags and let the two full " +
          "cards play a last round against each other.",
      },
      {
        trouble: "running_long",
        answer:
          "Drop the two-lines rung. A line and then a full card is the same " +
          "round twenty minutes shorter, and nobody notices it has gone.",
      },
      {
        trouble: "played_before",
        answer:
          "Somebody who has played will know the meanings by heart and will " +
          "call them before the caller does. That is the room working. Hand " +
          "them the bag as soon as anybody wins.",
      },
      {
        trouble: "not_landing",
        answer:
          "If the first round is silent, the calling is too fast. Slow down " +
          "by half, say the meaning first and the number second, and wait " +
          "for somebody to argue with it.",
      },
    ],
  },

  facets: [
    {
      dimension: "group_fun",
      code: "board_games",
      weight: 1,
      note:
        "Cards, called numbers and beans for markers. A board game with the board handed out.",
    },
    { dimension: "affinity", code: "ritual", weight: 1 },
    { dimension: "group_fun", code: "compete", weight: 0.7 },
    { dimension: "group_fun", code: "long_dinner", weight: 0.7 },
    { dimension: "affinity", code: "wit", weight: 0.6 },
    { dimension: "group_fun", code: "play_for_stakes", weight: 0.5 },
    { dimension: "affinity", code: "late", weight: 0.5 },
    {
      dimension: "anti_preference",
      code: "prep_marathon",
      weight: 0.5,
      note: "A kit, cards for everybody, beans and five wrapped prizes. It is a shopping trip and a wrapping evening.",
    },
    {
      dimension: "anti_preference",
      code: "kids_party",
      weight: 0.4,
      note: "Numbers called out with beans on a card is a shape a host may associate with a church hall, and she is entitled to the warning.",
    },
  ],

  occasions: [],
  slots: [
    { slotCode: "game", fit: "native" },
    { slotCode: "the_moment", fit: "native" },
  ],

  supplies: [
    {
      item: "A bag of numbered tokens",
      detail: "Ninety of them, wooden, in a cloth bag, and drawn without looking.",
      source: "host_buys",
      quantity: 1,
      leadTimeDays: 10,
    },
    {
      item: "Dried beans",
      detail: "A handful each. The cheapest marker there is and the only one that sounds right on a card.",
      source: "host_buys",
      perGuest: true,
      leadTimeDays: 3,
    },
    {
      item: "A bag for the tokens",
      detail: "Cloth, so nobody can see in. It passes to whoever wins.",
      source: "on_hand",
      quantity: 1,
    },
  ],
  requirements: [
    { requirement: "table_space", note: "A card, a pile of beans and an elbow for everybody at once." },
    { requirement: "printing" },
  ],
  printedMatter: [
    {
      piece: "number_cards",
      label: "The cards",
      description:
        "One a head and two spare, set in the destination's face. Her " +
        "sentence, whole, at the head: The numbers are called after dark. " +
        "Beans for markers, and whoever is calling is playing too. Under it " +
        "fifteen numbers between one and ninety, in three rows of five, with " +
        "room for a bean on every one — the rows are what a line means. On " +
        "the back, what the numbers mean; a spare card goes in the middle of " +
        "the table that side up, to be picked up and read out at volume and " +
        "argued with, which is the point of printing it at all.",
      voicePiece: "game_rule",
      perGuest: true,
    },
  ],
  dependencies: [],
  worlds: [
    {
      world: "amalfi-1953",
      native: true,
      note: "Written in this room's voice. A whitelist, per rule 23.",
    },
  ],
};

/**
 * AMALFI, TWO OF TWO — THE FIVE PRIZES.
 *
 * The second of this room's two game_rule pieces, and it is a finale rather
 * than a second game: it spends what the numbers produced. db/010 built
 * `game_dependency` for exactly this and it has had one user until now.
 */
const AMALFI_THE_FIVE_PRIZES: Game = {
  slug: "amalfi-the-five-prizes",
  name: "The Five Prizes",
  description:
    "Five prizes, opened one at a time in front of everybody, in order. The " +
    "last one is worth having and everybody can see it from the start.",
  howItWorks:
    "Five prizes, wrapped, in a row on the table from the start of the " +
    "evening where everybody can see them. They ascend: the first is a joke " +
    "and the fifth is genuinely good, and nobody is told which is which " +
    "except by the size and the order.\n\n" +
    "Across the evening, the game that is running hands them out as they are " +
    "won — the first parcel to the first winner, and on down the row. They " +
    "are handed over unopened and stay that way, on a lap, however long that " +
    "is. Nothing is opened away from the table.\n\n" +
    "At the end, they are opened one at a time, by whoever is holding them, " +
    "in the order they were won: first parcel first, fifth last. The room " +
    "watches each one and nobody talks over an unwrapping. One person " +
    "holding two opens both, in their order, and there is no rule against " +
    "having won twice.\n\n" +
    "If the evening only produced three winners, three are opened and the " +
    "two left in the row are not opened at all — they go back in the " +
    "cupboard for next time. THE FIFTH PARCEL IS ALWAYS THE LAST THING: if " +
    "it was never won, the room opens it together and it belongs to the " +
    "house.\n\n" +
    "Nothing is won here. The unwrapping is what paces the last quarter of " +
    "an hour: five separate small events, ending on the one that was " +
    "obviously worth having from the moment it went on the table. After the " +
    "last one there is no speech and nothing else happens.",
  materials:
    "THE HOUSE PRINTS one card, propped at the end of the row. YOU SUPPLY " +
    "five prizes ascending from a joke to something somebody would " +
    "actually keep, the paper and string to wrap them the day before, and " +
    "a clear length of table to line them up on.",

  shape: "finale",
  sourcing: "provided",
  durationMinutes: 15,
  durationMaxMinutes: 30,
  minGuests: 6,

  scoring:
    "No score of its own and nobody wins it. It spends whatever the " +
    "evening's game produced, in the order it was produced; unwon parcels " +
    "stay wrapped, and the fifth is opened last whatever happened.",

  sourceNote: ROOM_VOICE,
  notes:
    'HER RULE, VERBATIM: "Five prizes, opened one at a time in front of ' +
    'everybody. The last one is worth having."\n\n' +
    "AUTHORED HERE: the finale shape, the dependency on a game that produced " +
    "winners, the prizes being visible from the start, the six-guest floor, " +
    "the fifteen-to-thirty minute block, and every step and contingency. THE " +
    "DEPENDENCY IS THE INTERPRETIVE CHOICE: her sentence is a prize ladder " +
    "and does not say what is being won. Read as a second scheduled game it " +
    "is an hour of unwrapping with nothing behind it, so it is read here as " +
    "the ending of the evening the numbers ran, which is what db/010 built " +
    "`game_dependency` for. It carries a group key so any later game that " +
    "produces winners satisfies it, rather than only this one.\n\n" +
    "RULE 25's FIRST TEST: five prizes is a backyard number. The first is a " +
    "lemon off the table and the fifth is a thing somebody would actually " +
    "want, and nothing in between has to cost anything.\n\n" +
    "FEWER THAN FIVE WINNERS IS THE NORMAL CASE AND HAD NO ANSWER. The " +
    "earlier draft described five parcels opened by five winners and left a " +
    "host holding two unclaimed ones at the end of a finale with nothing to " +
    "do about them. Unwon parcels are not opened and go back in the " +
    "cupboard, EXCEPT the fifth, which is always the last thing that happens " +
    "and is opened by the room if nobody won it — because her sentence is " +
    "about the last one being worth having, and an evening that ends with " +
    "the good parcel quietly put away has not honoured it. A person who won " +
    "twice opens both, in order, which the earlier draft's under-minimum " +
    "answer treated as a failure rather than as a thing that happens.",

  runbook: {
    hostRole: "plays_too",
    hostNote:
      "You can win one. Wrapping them is the only job and it happens the " +
      "day before, with nobody watching.",
    steps: [
      {
        step: "wrap_them_ascending",
        phase: "before",
        instruction: "Wrap five prizes so the order is obvious from the shape and the size.",
        detail:
          "Obvious on purpose. The whole tension is that everybody can see " +
          "which one is the good one and cannot do anything about it.",
        supplyItem: "Five prizes, wrapped",
      },
      {
        step: "line_them_up_early",
        phase: "before",
        instruction: "Put them out in a row before the evening starts and never move them.",
        detail:
          "Out from the beginning, so they are furniture by the time they " +
          "matter. Prizes that arrive at the end are a bit; prizes that have " +
          "been sitting there for four hours are a threat.",
      },
      {
        step: "say_the_order",
        phase: "opening",
        instruction: "Say that they open in order and that nothing is opened away from the table.",
        detail:
          "The one rule that has to be enforced. Somebody will take theirs " +
          "into the kitchen, and the whole evening loses one of its five " +
          "small events.",
        say: "Nothing gets opened until the end, and then in the order they were won, at this table, one at a time. The last one is worth having.",
        minutes: 2,
        printedPiece: "rules_card",
      },
      {
        step: "hand_them_out_as_they_are_won",
        phase: "opening",
        instruction: "Give each parcel to its winner unopened, in row order, and tell them to wait.",
        detail:
          "First parcel to the first winner and on down the row, unopened " +
          "and held. A person sitting with a wrapped thing on their lap for " +
          "an hour is doing more for the room than the prize is. Somebody " +
          "who wins twice takes two.",
        minutes: 2,
      },
      {
        step: "open_them_one_at_a_time",
        phase: "playing",
        instruction: "At the end, open them in the order they were won, one at a time, room watching.",
        detail:
          "First won opens first, and a person holding two opens both in " +
          "their order. Nobody talks over an unwrapping. Five separate small " +
          "events, which is what her sentence is asking for and what opening " +
          "them together would destroy.",
        minutes: 15,
        supplyItem: "Five prizes, wrapped",
      },
      {
        step: "the_fifth",
        phase: "ending",
        instruction: "The fifth is opened last, whoever holds it, and then nothing else happens.",
        detail:
          "Always last. If it was never won, the room opens it together and " +
          "it stays with the house. Parcels nobody won are not opened at all " +
          "and go back in the cupboard. No speech afterwards: the fifth " +
          "being obviously good is the ending of the night, and anything " +
          "said after it is the host adding a second one.",
        minutes: 5,
      },
    ],
    contingencies: [
      {
        trouble: "will_not_play",
        answer:
          "Nobody has to do anything here except open a parcel. Somebody who " +
          "does not want theirs opened in front of the room can hand it to " +
          "whoever is beside them to open, and that is usually better.",
      },
      {
        trouble: "under_minimum",
        answer:
          "Under six, five prizes across four people means somebody wins " +
          "twice and the ladder stops meaning anything. Cut it to three " +
          "prizes and keep the last one exactly as good.",
      },
      {
        trouble: "over_size",
        answer:
          "Above twenty, five prizes in a room of thirty is five people " +
          "having a night. Add a rung rather than a prize: let the fifth be " +
          "opened by the table it was won at.",
      },
      {
        trouble: "running_long",
        answer:
          "It cannot be shortened by opening two at once. Shorten it by " +
          "handing out the first two before dinner and keeping only three " +
          "for the ending.",
      },
      {
        trouble: "played_before",
        answer:
          "A house that does this every year has guests who arrive already " +
          "looking at the fifth parcel. That is the whole thing working, and " +
          "the only rule is that the fifth is never the same object twice.",
      },
      {
        trouble: "not_landing",
        answer:
          "If the first two open flat, say nothing and go straight to the " +
          "fifth. The ladder is a nicety and the last one is the reason " +
          "anybody is still at the table.",
      },
    ],
  },

  facets: [
    {
      dimension: "group_fun",
      code: "group_games",
      weight: 0.7,
      note:
        "Opened one at a time in front of everybody. The room watching is the mechanism.",
    },
    { dimension: "group_fun", code: "play_for_stakes", weight: 0.9 },
    { dimension: "affinity", code: "ritual", weight: 0.8 },
    { dimension: "affinity", code: "one_moment", weight: 0.7 },
    { dimension: "group_fun", code: "compete", weight: 0.5 },
    { dimension: "affinity", code: "beauty", weight: 0.4 },
    {
      dimension: "anti_preference",
      code: "prep_marathon",
      weight: 0.6,
      note: "Five prizes bought, chosen in an order, and wrapped the day before.",
    },
    {
      dimension: "anti_preference",
      code: "novelty",
      weight: 0.4,
      note: "The first prize is a joke object, on purpose. A host who vetoed novelty props is vetoing the bottom of the ladder.",
    },
  ],

  occasions: [],
  slots: [
    {
      slotCode: "game",
      fit: "native",
      note: "db/061 collapsed the five game beats into one. This is the beat now, and she chooses among what the room offers.",
    },
    { slotCode: "finale", fit: "native" },
  ],

  supplies: [
    {
      item: "Five prizes, wrapped",
      detail:
        "Ascending. A lemon off the table at the bottom and something " +
        "somebody would actually keep at the top, and nothing in the middle " +
        "that has to cost anything.",
      source: "host_buys",
      quantity: 5,
      leadTimeDays: 7,
    },
    {
      item: "Paper and string",
      detail: "Wrapped the day before, so the sizes give the order away.",
      source: "host_buys",
      leadTimeDays: 7,
    },
  ],
  requirements: [
    { requirement: "prizes", note: "Five, in an order, and the fifth genuinely worth having." },
    { requirement: "table_space", note: "A clear length of it to line five parcels up on for the whole evening." },
    { requirement: "printing" },
  ],
  printedMatter: [
    {
      piece: "rules_card",
      label: "The rule",
      description:
        "Her sentence, whole, propped at the end of the row: Five prizes, " +
        "opened one at a time in front of everybody. The last one is worth " +
        "having.",
      voicePiece: "game_rule",
      quantity: 1,
    },
  ],
  dependencies: [
    {
      requires: "amalfi-the-numbers-after-dark",
      strength: "required",
      groupKey: "somebody_won_something",
      note:
        "A prize ladder with nothing behind it is five parcels and no reason. " +
        "The group key carries db/010's any-of reading: any later game that " +
        "produces winners satisfies this, and it does not have to be this one.",
    },
  ],
  worlds: [
    {
      world: "amalfi-1953",
      native: true,
      note: "Written in this room's voice. A whitelist, per rule 23.",
    },
  ],
};
/**
 * ASPEN, ONE OF TWO — SOMEBODY'S VOICE.
 *
 * The scheduled half of this room's pair. It is impressions rather than
 * charades and it is worth saying so: the bank's New Orleans prompt deck is a
 * charades deck, and the two would collapse into each other in an audit that
 * counted surfaces rather than engines.
 */
const ASPEN_SOMEBODYS_VOICE: Game = {
  slug: "aspen-somebodys-voice",
  name: "Somebody's Voice",
  description:
    "Everybody does somebody's voice, from whatever is on. Whoever gets " +
    "guessed first picks the next episode.",
  howItWorks:
    "Everybody does a voice. Not a character from anywhere — a character " +
    "from the thing that is already on, which everybody in the room has " +
    "watched eleven times.\n\n" +
    "The host goes first and then it goes left, one line each, all the way " +
    "round once. That is the whole round and nobody gets a second turn.\n\n" +
    "The room shouts names over each other and the FIRST name shouted is the " +
    "one that counts. If that first name is right, that voice was got clean. " +
    "If it is wrong, the voice is not clean however quickly somebody gets it " +
    "afterwards.\n\n" +
    "At the end, of everybody who was got clean, the one who went earliest " +
    "in the round takes the remote. If nobody was got clean, the room shouts " +
    "for its favourite and the loudest takes it. Either way the host says " +
    "who it is and there is no second round.\n\n" +
    "The remote is the whole prize and it lasts one episode: they pick, " +
    "whatever they pick, and nobody negotiates.\n\n" +
    "The reason it works is that nobody is good at it. A bad impression of " +
    "somebody everybody knows is funnier than a good one, and a room that " +
    "has watched the same thing all week can identify a character from four " +
    "syllables and a posture.",
  materials:
    "THE HOUSE PRINTS one card. YOU SUPPLY whatever is already on and " +
    "everybody has watched eleven times, and the remote, which is the " +
    "prize and is down the side of the sofa.",

  shape: "scheduled",
  sourcing: "provided",
  durationMinutes: 15,
  durationMaxMinutes: 25,
  minGuests: 4,
  maxGuests: 12,

  scoring:
    "The first name shouted at a voice is the one that counts. A voice got " +
    "right on that first name is clean; of the clean ones, whoever went " +
    "earliest in the round wins. No clean ones and the room shouts for a " +
    "favourite. The prize is the remote and it lasts exactly one episode.",

  sourceNote: ROOM_VOICE,
  notes:
    'HER RULE, VERBATIM: "Everybody does somebody\'s voice. Whoever gets ' +
    'guessed first picks the next episode."\n\n' +
    "AUTHORED HERE: the one line each, the voices being drawn from whatever " +
    "is already on, the four-to-twelve room, the fifteen-to-twenty-five " +
    "minute block, and every step and contingency. Restricting the voices to " +
    "the thing that is playing is the house's reading and the one to argue " +
    "with: her sentence says somebody's voice and does not say whose, and " +
    "the wider reading — anybody in the room, anybody at all — is a " +
    "different and probably meaner game.\n\n" +
    "GUESSED FIRST IS NOW A RULE INSTEAD OF A FEELING, AND IT IS READ " +
    "LITERALLY FROM HER SENTENCE. The earlier draft said `guessed fastest " +
    "wins, judged by the room and not by a clock`, which asks a sofa to " +
    "compare two things nobody timed and would be settled by whoever argues " +
    "hardest. Her word is FIRST, so: the first name shouted at a voice is " +
    "the one that counts, a voice got right on that first name is clean, and " +
    "the earliest clean one in the round takes the remote. Nothing is " +
    "measured and nothing is compared. The fallback where no voice is got " +
    "clean is the house's and is the only judged part left.\n\n" +
    "NOT THE SAME GAME AS THE CHARADES DECK. New Orleans has a bank row for " +
    "a charades prompt deck and this is not a second copy of it: a charade " +
    "is a prompt drawn and acted silently, and this is a line said out loud " +
    "from a shared text everybody in the room already has. Written down " +
    "because the Fishbowl audit found one folk game in three places and the " +
    "next audit should not count this as a fourth.",

  runbook: {
    hostRole: "plays_too",
    hostNote:
      "You do one, and you can lose the remote like everybody else. There " +
      "is no judging job here at all; the room shouts and the room is right.",
    steps: [
      {
        step: "have_something_on_first",
        phase: "before",
        instruction: "Do not run this cold. It needs an episode already watched tonight.",
        detail:
          "The voices come out of what the room has just been half-watching. " +
          "Run from a standing start, everybody reaches for something from " +
          "years ago and nobody guesses anything.",
      },
      {
        step: "find_the_remote",
        phase: "before",
        instruction: "Find the remote and put it on the table where everybody can see it.",
        detail:
          "The remote is the prize, so it has to be a visible object rather " +
          "than a concept. It is down the side of the sofa.",
        supplyItem: "The remote",
      },
      {
        step: "pause_it",
        phase: "opening",
        instruction: "Pause whatever is on, do not turn it off, and say the rule.",
        detail:
          "Paused and not off. A black screen makes an occasion of it; a " +
          "frozen frame keeps the thing everybody is about to imitate " +
          "sitting there.",
        say: "One line each, somebody from this, starting with me and going left. The first name anybody shouts is the one that counts, and if it is right you are still in it. Whoever gets there first picks what we watch next.",
        minutes: 2,
        printedPiece: "rules_card",
      },
      {
        step: "go_first_and_be_bad",
        phase: "opening",
        instruction: "Go first and do a deliberately poor one, then hand the turn to your left.",
        detail:
          "This is the whole permission structure. A host who does a good " +
          "impression first has set a standard, and four people will now " +
          "pass rather than be worse than her. Going first is also the best " +
          "seat, and you have given it away by taking it.",
        minutes: 2,
      },
      {
        step: "round_the_sofa",
        phase: "playing",
        instruction: "Left round the room, one line each, and let the room shout over each other.",
        detail:
          "No hands up and no order to the guessing. The mess is the game. " +
          "The first name shouted at a voice is the one that counts, even " +
          "when three people say it at once: right first time and that voice " +
          "is clean, wrong first time and it is not, however fast the second " +
          "shout is. Remember who was clean and in what order.",
        minutes: 14,
      },
      {
        step: "hand_over_the_remote",
        phase: "ending",
        instruction: "When it has been round once, give the remote to the earliest clean one.",
        detail:
          "The earliest in the round of everybody who was got right first " +
          "time. If nobody was, ask the room to shout for a favourite and " +
          "take the loudest. Say the name yourself, once, and take nothing " +
          "back — they pick, whatever they pick, and a room that overrules " +
          "the winner has made the prize into a suggestion.",
        say: "You were first. You pick, and nobody argues with it.",
        minutes: 3,
        supplyItem: "The remote",
      },
    ],
    contingencies: [
      {
        trouble: "will_not_play",
        answer:
          "Somebody who will not do a voice is the one who says which name " +
          "was shouted first, which is a genuinely contested job and puts " +
          "them at the centre of every round.",
      },
      {
        trouble: "under_minimum",
        answer:
          "Under four, every voice is got right first time and the earliest " +
          "one always wins, which makes the seating the game. Play it as two " +
          "voices each and let the room shout for a favourite instead.",
      },
      {
        trouble: "over_size",
        answer:
          "Above twelve, half the room cannot hear the line. Move to the " +
          "front of the sofa to do it, one at a time, and stop when a round " +
          "has gone round once.",
      },
      {
        trouble: "running_long",
        answer:
          "Stop after one round even if people want a second. The remote can " +
          "only be handed over once, and a second round is playing for " +
          "nothing.",
      },
      {
        trouble: "played_before",
        answer:
          "Somebody who has played will have a voice they always do, and the " +
          "room will name it on the first shout. That makes them clean, and " +
          "they win it if they went early enough, which is the game " +
          "rewarding a running joke correctly.",
      },
      {
        trouble: "not_landing",
        answer:
          "If two go past with silence, the room does not know the thing " +
          "well enough. Put the episode back on, watch ten minutes, and try " +
          "again with what just happened.",
      },
    ],
  },

  facets: [
    {
      dimension: "group_fun",
      code: "theatre",
      weight: 1,
      note:
        "Doing somebody's voice from whatever is on, until the room guesses whose.",
    },
    { dimension: "group_fun", code: "perform", weight: 1 },
    { dimension: "affinity", code: "wit", weight: 0.8 },
    { dimension: "group_fun", code: "compete", weight: 0.5 },
    { dimension: "affinity", code: "ease", weight: 0.6 },
    { dimension: "group_fun", code: "talk_deep", weight: -0.4 },
    {
      dimension: "anti_preference",
      code: "forced_fun",
      weight: 0.8,
      note: "Standing up and doing a voice in front of everybody is the purest form of the thing a host vetoes here.",
    },
    {
      dimension: "anti_preference",
      code: "kids_party",
      weight: 0.3,
      note: "It is doing voices on a sofa, and a host is entitled to know that before it is offered.",
    },
  ],

  occasions: [],
  slots: [
    { slotCode: "game", fit: "native" },
    { slotCode: "day_material", fit: "native" },
  ],

  supplies: [
    {
      item: "The remote",
      detail: "The prize. It is down the side of the sofa and it has to be found before anybody starts.",
      source: "on_hand",
      quantity: 1,
    },
  ],
  requirements: [
    {
      requirement: "something_playing",
      note: "An episode of something the whole room has been half-watching, paused rather than switched off.",
    },
    { requirement: "printing" },
  ],
  printedMatter: [
    {
      piece: "rules_card",
      label: "The rule",
      description:
        "One card, one side, that stands on top of the screen or leans " +
        "against it — where the room is already looking, because there is " +
        "no table in this one. Her sentence, whole: Everybody does " +
        "somebody's voice. Whoever gets guessed first picks the next " +
        "episode.",
      voicePiece: "game_rule",
      quantity: 1,
    },
  ],
  dependencies: [],
  worlds: [
    {
      world: "aspen-1994",
      native: true,
      note: "Written in this room's voice. A whitelist, per rule 23.",
    },
  ],
};

/**
 * ASPEN, TWO OF TWO — THE NEXT LINE.
 *
 * The ambient half. It takes no block at all, which is what makes it able to
 * sit alongside the voices game in the same evening — db/010's whole reason
 * for having a shape column.
 */
const ASPEN_THE_NEXT_LINE: Game = {
  slug: "aspen-the-next-line",
  name: "The Next Line",
  description:
    "Say the next line before it happens. Miss it and you are the one " +
    "getting up for the garlic bread.",
  howItWorks:
    "It runs underneath the whole evening and takes nothing out of it. " +
    "Anybody on the sofa, at any time, may say the next line out loud before " +
    "the screen says it. Nobody is called on and nobody has to.\n\n" +
    "It does not have to be word for word. If the room agrees that was the " +
    "line, it was the line, and the room settles that in four seconds with " +
    "the loudest person being right. Nobody adjudicates and nothing is " +
    "replayed to check.\n\n" +
    "Get it right and nothing happens, which is correct — being right is its " +
    "own thing and does not need a prize. Get it wrong and you are on garlic " +
    "bread: you get up now, go to the kitchen, and come back with it. If two " +
    "people call at once and one of them is right, the wrong one goes. If " +
    "both are wrong, they go together and the trip is a shorter one.\n\n" +
    "Nobody keeps a tally and nobody wins. The forfeit is the whole of the " +
    "score, it is paid the moment it is called, and it is the only reason " +
    "there is ever anything to eat after ten o'clock.\n\n" +
    "It ends when the freezer is empty or when the screen goes off, " +
    "whichever comes first, and nobody announces either.",
  materials:
    "THE HOUSE PRINTS one card. YOU SUPPLY more garlic bread than the " +
    "evening could need, in the freezer, and an oven somebody is willing " +
    "to turn on four or five times.",

  shape: "ambient",
  sourcing: "provided",
  minGuests: 3,

  scoring:
    "Nobody counts anything and nobody wins. Whoever calls a line wrong gets " +
    "up for the garlic bread, once, and the debt is settled the moment it is " +
    "on the table. Close enough counts, the room decides, and two people " +
    "calling at once both go if both were wrong.",

  sourceNote: ROOM_VOICE,
  notes:
    'HER RULE, VERBATIM: "Say the next line before it happens. Miss it and ' +
    'you\'re on garlic bread."\n\n' +
    "AUTHORED HERE: the ambient shape, the three-guest floor, the forfeit " +
    "being paid immediately rather than tallied, the garlic bread being in " +
    "the freezer before anybody sits down, and every step and contingency. " +
    "PAYING IMMEDIATELY IS THE HOUSE'S ADDITION and it is the one that keeps " +
    "this from becoming a running scoreboard, which docs/copy-brief.md would " +
    "not reach but the room would not survive.\n\n" +
    "WHAT COUNTS AS GETTING IT RIGHT IS NOW WRITTEN DOWN: close enough, " +
    "settled by the room in four seconds, and never by replaying anything. " +
    "The earlier draft told the host not to adjudicate without ever saying " +
    "what the standard was, so the first contested call of the night was " +
    "going to be an argument about whether the game meant word for word. TWO " +
    "PEOPLE CALLING AT ONCE is ruled the same way — the wrong one goes, and " +
    "both wrong means both go. AND THE ENDING IS AN EVENT INSTEAD OF AN " +
    "HOUR OF SILENCE: the empty freezer or the screen going off. Ambient " +
    "games in this file end by being forgotten, and that stays true; what " +
    "changes is that a host can now tell somebody when it finished.",

  runbook: {
    hostRole: "plays_too",
    hostNote:
      "You are on garlic bread as often as anybody. There is no job here " +
      "and there must not be one, because a person adjudicating lines is a " +
      "person not watching the thing.",
    steps: [
      {
        step: "put_it_in_the_freezer",
        phase: "before",
        instruction: "Have more garlic bread in the freezer than the evening could possibly need.",
        detail:
          "Two is not enough. The forfeit is paid four or five times on a " +
          "good night and running out is how the game ends at nine.",
        supplyItem: "Garlic bread",
      },
      {
        step: "turn_the_oven_on_early",
        phase: "before",
        instruction: "Put the oven on low before anybody sits down.",
        detail:
          "A cold oven adds twelve minutes to the forfeit and everybody " +
          "stops calling lines rather than lose that much of the episode.",
      },
      {
        step: "say_it_once_and_leave_it",
        phase: "opening",
        instruction: "Say the rule once, at the start of the first episode, and never repeat it.",
        detail:
          "Once. It is a rule about a room, not a round, and explaining it " +
          "twice makes it into something that has started.",
        say: "Say the next line before it happens, any time, anybody. Close enough counts. Miss it and you are on garlic bread, and you go now.",
        printedPiece: "rules_card",
      },
      {
        step: "get_it_wrong_first",
        phase: "underway",
        instruction: "Call a line early and be wrong, on purpose, in the first ten minutes.",
        detail:
          "The game needs somebody to go to the kitchen before anybody " +
          "believes the forfeit is real. Better it is you, once, than " +
          "nobody at all.",
      },
      {
        step: "never_adjudicate",
        phase: "underway",
        instruction: "Do not rule on close calls. Let the room shout it out and take four seconds.",
        detail:
          "Close enough counts and word for word is not required. A host who " +
          "decides what counts has made herself a referee and the game has " +
          "acquired staff. The room settles it in four seconds and the " +
          "loudest person is right. Nothing is ever replayed to check.",
      },
      {
        step: "when_two_people_call_at_once",
        phase: "underway",
        instruction: "Two at once and one right: the wrong one goes. Both wrong and they go together.",
        detail:
          "It happens most nights and the room will look at somebody to " +
          "settle it. Two people in the kitchen is the better outcome " +
          "anyway; the trip is shorter and the bread comes back faster.",
      },
      {
        step: "let_it_stop_by_itself",
        phase: "ending",
        instruction: "It ends at the empty freezer or the screen going off, and neither is announced.",
        detail:
          "Whichever comes first. Nobody wins it, nothing was counted, and " +
          "an ambient game announced as finished leaves a hole where it was. " +
          "This one ends with garlic bread on the table and no ceremony " +
          "attached to it.",
      },
    ],
    contingencies: [
      {
        trouble: "will_not_play",
        answer:
          "Nobody has to call a line, and somebody who never calls one has " +
          "not opted out of anything visible. They still get given garlic " +
          "bread, which is the entire benefit of the game.",
      },
      {
        trouble: "under_minimum",
        answer:
          "Under three, the same person goes to the kitchen every time and " +
          "the forfeit becomes a chore. Drop the forfeit and just call the " +
          "lines.",
      },
      {
        trouble: "over_size",
        answer:
          "In a big room the forfeit gets called on somebody who was not " +
          "even watching. Rule that only people on the sofa are in it, and " +
          "say so the first time it happens.",
      },
      {
        trouble: "running_long",
        answer:
          "It runs as long as the evening does and costs nothing. What runs " +
          "out is the garlic bread, and the answer is that the game ends " +
          "when the freezer does.",
      },
      {
        trouble: "played_before",
        answer:
          "Somebody who knows the thing by heart will call every line " +
          "correctly and never go to the kitchen. That is a person who has " +
          "won and the correct response is to make them the one who decides " +
          "close calls.",
      },
      {
        trouble: "not_landing",
        answer:
          "If nobody calls a line in the first episode, the room does not " +
          "know it well enough. Put on the one everybody has seen and do not " +
          "mention the game again; it starts itself.",
      },
    ],
  },

  facets: [
    { dimension: "affinity", code: "ease", weight: 1 },
    { dimension: "affinity", code: "wit", weight: 0.8 },
    { dimension: "group_fun", code: "perform", weight: 0.4 },
    { dimension: "group_fun", code: "compete", weight: 0.3 },
    { dimension: "affinity", code: "ritual", weight: 0.4 },
    {
      dimension: "anti_preference",
      code: "forced_fun",
      weight: -0.6,
      note:
        "Nobody has to do anything and nothing goes round the room. It is " +
        "close to the opposite of forced participation, which is why it is " +
        "worth a negative weight rather than no tag.",
    },
    {
      dimension: "anti_preference",
      code: "schedule",
      weight: -0.7,
      note: "It takes no block and nothing has to start. An evening that ran itself would still contain it.",
    },
  ],

  occasions: [],
  slots: [
    {
      slotCode: "game",
      fit: "native",
      note: "db/061 collapsed the five game beats into one. This is the beat now, and she chooses among what the room offers.",
    },
    { slotCode: "ambient_game", fit: "native" },
  ],

  supplies: [
    {
      item: "Garlic bread",
      detail: "More than the evening could need, in the freezer. The forfeit is paid four or five times on a good night.",
      source: "host_buys",
      leadTimeDays: 1,
    },
  ],
  requirements: [
    {
      requirement: "something_playing",
      note: "Something everybody has seen enough times to call a line from.",
    },
    { requirement: "printing" },
  ],
  printedMatter: [
    {
      piece: "rules_card",
      label: "The rule",
      description:
        "One card, one side, and it lives on the kitchen counter beside " +
        "the oven rather than in the room the game is played in — the " +
        "forfeit is paid in the kitchen four or five times a night and " +
        "the card is what somebody reads while it heats. Her sentence, " +
        "whole: Say the next line before it happens. Miss it and you're " +
        "on garlic bread.",
      voicePiece: "game_rule",
      quantity: 1,
    },
  ],
  dependencies: [],
  worlds: [
    {
      world: "aspen-1994",
      native: true,
      note: "Written in this room's voice. A whitelist, per rule 23.",
    },
  ],
};

/**
 * PALM SPRINGS — THE BEST LINE.
 *
 * A finale that spends the evening itself: it cannot be played early because
 * what it is made of has not been said yet.
 */
const PALM_SPRINGS_THE_BEST_LINE: Game = {
  slug: "palm-springs-the-best-line",
  name: "The Best Line",
  description:
    "Everyone repeats the best line they have heard tonight, and nobody may " +
    "claim their own. It is the last thing that happens.",
  howItWorks:
    "It happens where the last of the party is already standing, at the end, " +
    "and it is never gathered into a circle. The host starts it by saying " +
    "one line somebody else said tonight, out loud, attributing it to " +
    "nobody, and then waiting.\n\n" +
    "After that, anybody says one, whenever they have got one. There is no " +
    "order, nobody is called on and nobody has to go. One line each, in the " +
    "words it was said in, and NOBODY MAY CLAIM THEIR OWN — somebody always " +
    "tries in the first three, and the host says not your own, once, and it " +
    "becomes the funniest part of the round.\n\n" +
    "Nothing is written down beforehand, which is what makes it work: what " +
    "comes out is what actually stayed, and half of it is something the " +
    "person who said it does not remember saying. The room usually works out " +
    "who said each one, and sometimes it is wrong, and nobody corrects it.\n\n" +
    "It ends on the host's line, which is always the last one. She says hers " +
    "the moment a line gets repeated by somebody who did not hear it the " +
    "first time, or the moment the gaps get longer than the lines. Once she " +
    "has said hers, nobody else goes.\n\n" +
    "Nothing is scored, nothing is voted on and nobody wins. It takes about " +
    "a quarter of an hour and it is the last thing before people start " +
    "finding their coats.",
  materials:
    "THE HOUSE PRINTS one card and that is the whole of it. YOU SUPPLY " +
    "nothing: no object, no list, nothing bought and nothing written down " +
    "beforehand.",

  shape: "finale",
  sourcing: "provided",
  durationMinutes: 10,
  durationMaxMinutes: 20,
  minGuests: 5,

  scoring:
    "Nothing is scored. One line each, nobody may claim their own, and the " +
    "room does not vote on which was best.",

  sourceNote: ROOM_VOICE,
  notes:
    'HER RULE, VERBATIM: "Everyone repeats the best line they have heard ' +
    'tonight. Nobody may claim their own."\n\n' +
    "AUTHORED HERE: the finale shape, the five-guest floor, the " +
    "ten-to-twenty minute block, nothing being written down in advance, the " +
    "absence of any vote, and every step and contingency. THE ABSENCE OF A " +
    "VOTE IS DELIBERATE AND IS THE HOUSE'S: her sentence names no winner, " +
    "and a room that ranks the lines has turned the last quarter of an hour " +
    "into a competition somebody comes last in.\n\n" +
    "THE ENDING WAS UNRUNNABLE AND IS NOW THE HOST'S OWN LINE. The earlier " +
    "draft ended it at `the line whose author does not remember saying it`, " +
    "asserted that there is always one, and left a host waiting for a thing " +
    "that may not arrive — in the last quarter of an hour of the evening, " +
    "with no order to fall back on, because nothing here goes round and " +
    "nobody is called on. It now ends on her line, which is always the last " +
    "one, said when a line comes back round or when the gaps get longer than " +
    "the lines. That costs her one more line to keep in her head all " +
    "evening, and it means the finale cannot fail to finish. THE REPEATED " +
    "LINE, which had no ruling at all, is the same mechanism read from the " +
    "other side: the second saying stands, and it is the signal.",

  runbook: {
    hostRole: "plays_too",
    hostNote:
      "You say the first line and the last one, and both of them are " +
      "somebody else's, like everybody else's. There is nothing to run: the " +
      "only two decisions are when to start it and when to close it.",
    steps: [
      {
        step: "notice_things_all_evening",
        phase: "before",
        instruction: "Keep two lines of your own in your head from about halfway through.",
        detail:
          "Two, because you say one to start it and one to end it, and you " +
          "will have spent the evening hosting rather than listening. Two " +
          "lines kept from halfway is the whole of the preparation.",
      },
      {
        step: "decide_where_it_happens",
        phase: "before",
        instruction: "Pick the spot everybody drifts to at the end, and do not move them.",
        detail:
          "Wherever the last eight people are already standing. Gathering a " +
          "room into a circle to do this makes it a ceremony, and it is not " +
          "one.",
      },
      {
        step: "start_it_without_announcing_it",
        phase: "opening",
        instruction: "Say one somebody else said tonight, out loud, and wait.",
        detail:
          "Do not explain the game first. Say a line, attribute it to " +
          "nobody, and the second person understands what is happening " +
          "without a rule being read.",
        say: "The best thing anybody said tonight was not mine.",
        minutes: 2,
        printedPiece: "rules_card",
      },
      {
        step: "say_the_one_rule",
        phase: "opening",
        instruction: "When somebody claims their own, say the one rule and move on.",
        detail:
          "Somebody always does, in the first three. Said lightly and once, " +
          "it becomes the funniest part of the round rather than a " +
          "correction.",
        say: "Not your own.",
        minutes: 2,
      },
      {
        step: "round_the_patio",
        phase: "playing",
        instruction: "One line each, in no order. Nobody is called on and nobody has to go.",
        detail:
          "People go when they have got one, and the gaps between are where " +
          "the room works out who said what. If two people repeat the same " +
          "line, the second one stands and it is the signal that this is " +
          "nearly over.",
        minutes: 11,
      },
      {
        step: "say_yours_last",
        phase: "ending",
        instruction: "Say your own line last, and once you have said it nobody else goes.",
        detail:
          "You close it, and this is the only part of it you decide. Say " +
          "yours when a line comes back round from somebody who did not hear " +
          "it the first time, or when the gaps get longer than the lines. " +
          "Then nothing: no summing up, no vote, nobody won anything, and " +
          "anything said after it is a second ending for an evening that had " +
          "just finished itself.",
        minutes: 4,
      },
    ],
    contingencies: [
      {
        trouble: "will_not_play",
        answer:
          "Nobody is called on, so somebody who does not want to has already " +
          "opted out without anybody noticing. Do not go round in an order " +
          "and there is nothing to refuse.",
      },
      {
        trouble: "under_minimum",
        answer:
          "Under five, everybody knows whose line is whose and the not-your-" +
          "own rule leaves two options each. Say them anyway and let it be a " +
          "conversation rather than a round.",
      },
      {
        trouble: "over_size",
        answer:
          "In a big room, run it with whoever is left at the end rather than " +
          "with everybody. Twenty lines is a recital and eight is a good " +
          "quarter of an hour.",
      },
      {
        trouble: "running_long",
        answer:
          "It runs long when people explain the context. Ask for the line " +
          "and nothing else, and repeat the last good one yourself to show " +
          "how short it should be.",
      },
      {
        trouble: "played_before",
        answer:
          "A house that ends this way every time has guests who spend the " +
          "evening listening harder, which is the best thing this game does " +
          "and it happens hours before the game starts.",
      },
      {
        trouble: "not_landing",
        answer:
          "If the first two are polite compliments rather than lines, say a " +
          "genuinely unflattering one somebody said and the register " +
          "corrects itself immediately.",
      },
    ],
  },

  facets: [
    {
      dimension: "group_fun",
      code: "group_games",
      weight: 0.8,
      note:
        "Everyone repeats one and nobody may claim their own, so it needs the whole room to have been listening.",
    },
    { dimension: "affinity", code: "wit", weight: 1 },
    { dimension: "affinity", code: "one_moment", weight: 0.7 },
    { dimension: "group_fun", code: "talk_deep", weight: 0.6 },
    { dimension: "affinity", code: "ritual", weight: 0.6 },
    { dimension: "group_fun", code: "toast", weight: 0.5 },
    { dimension: "affinity", code: "ease", weight: 0.5 },
    {
      dimension: "anti_preference",
      code: "forced_fun",
      weight: -0.3,
      note: "Nobody is called on and there is no order. A guest who says nothing has not visibly refused anything.",
    },
  ],

  occasions: [],
  slots: [
    {
      slotCode: "game",
      fit: "native",
      note: "db/061 collapsed the five game beats into one. This is the beat now, and she chooses among what the room offers.",
    },
    { slotCode: "finale", fit: "native" },
  ],

  supplies: [],
  requirements: [{ requirement: "printing" }],
  printedMatter: [
    {
      piece: "rules_card",
      label: "The rule",
      description:
        "Her sentence, whole, and it is the only printed thing this game " +
        "has: Everyone repeats the best line they have heard tonight. Nobody " +
        "may claim their own.",
      voicePiece: "game_rule",
      quantity: 1,
    },
  ],
  dependencies: [],
  worlds: [
    {
      world: "palm-springs-1965",
      native: true,
      note: "Written in this room's voice. A whitelist, per rule 23.",
    },
  ],
};

/**
 * OAXACA — CORRECT THE YEAR.
 *
 * The fifth story game, and the only one whose engine is the interruption. Big
 * Sur forbids hurrying anybody; this room invites the whole table to argue
 * about a date in the middle of a sentence, and both are correct.
 */

/**
 * ST. MORITZ — BEFORE THE LIGHT GOES.
 *
 * The shortest game in the catalogue and the one with the least machinery. It
 * is placed at dusk because her sentence places it there, and the light going
 * is the clock.
 */
const ST_MORITZ_BEFORE_THE_LIGHT_GOES: Game = {
  slug: "st-moritz-before-the-light-goes",
  name: "Before The Light Goes",
  description:
    "Everyone pays one compliment out loud, to a face, before the light " +
    "goes. One each, and it has to be said to the person.",
  howItWorks:
    "It happens in the last of the daylight and nowhere else, which is the " +
    "only difficult thing about it: somebody has to notice the light going " +
    "and start it ten minutes before they think.\n\n" +
    "One compliment each, out loud, to a face. Not about somebody who is " +
    "across the room, not to the room in general, and not in the third " +
    "person. Said to them, by name, with everybody listening.\n\n" +
    "IT RUNS AS A CHAIN, and the chain is what makes it work. The host pays " +
    "the first one, to anybody. Whoever has just been paid one pays the " +
    "next, to somebody who has not had one yet. Then that person pays the " +
    "next, and on round the group. Nobody chooses in advance, nobody is paid " +
    "twice because the pool of people who have not had one gets smaller " +
    "every time, and nobody is left out because the chain cannot end until " +
    "everybody is in it.\n\n" +
    "The last person left un-paid is the host, so the chain comes back to " +
    "her. WHEN SHE HAS BEEN PAID ONE, IT IS OVER. Nobody says so and nobody " +
    "sums it up; the group goes back inside.\n\n" +
    "If somebody will not say one, the person who paid them names the next " +
    "one instead and the chain carries on without comment. Anybody who " +
    "arrives while it is running joins the pool and can be picked. Nothing " +
    "is scored and nobody wins.",
  materials:
    "THE HOUSE PRINTS one card. YOU SUPPLY nothing else, and somebody who " +
    "will notice the light going ten minutes before they think they need " +
    "to.",

  shape: "scheduled",
  sourcing: "provided",
  durationMinutes: 10,
  durationMaxMinutes: 20,
  minGuests: 4,
  maxGuests: 16,

  scoring:
    "Nothing is scored and nobody wins. The only rule with any force is that " +
    "nobody is paid two and nobody is paid none, and the chain enforces both " +
    "without anybody keeping a list.",

  sourceNote: ROOM_VOICE,
  notes:
    'HER RULE, VERBATIM: "Everyone pays one compliment out loud, to a face, ' +
    'before the light goes."\n\n' +
    "AUTHORED HERE: the rule that nobody is paid twice and nobody is paid " +
    "none, the four-to-sixteen group, the ten-to-twenty minute block, the " +
    "placement at dusk, and every step and contingency. NOBODY IS PAID NONE " +
    "IS THE HOUSE'S ADDITION and it is the whole of the difficulty in " +
    "running this: her sentence guarantees that everybody gives one and says " +
    "nothing about anybody receiving one, and a round in which one person is " +
    "the only one nobody chose is the worst quarter of an hour this " +
    "catalogue could produce.\n\n" +
    "THE CHAIN REPLACES THE HOST'S SILENT COUNT, AND THIS IS THE LARGEST " +
    "CHANGE IN THE FILE. The earlier draft ran it in no order, asked the " +
    "host to keep track of who had been paid one WITHOUT LETTING IT SHOW, " +
    "and had her pay the last one herself to whoever nobody chose. Three " +
    "things are wrong with that and each of them lands on the person it was " +
    "trying to protect: in a group of twelve, four people are paid before " +
    "she can stop the second compliment to the same face; the guarantee " +
    "depends entirely on her arithmetic in failing light; and the person she " +
    "catches at the end is publicly the one nobody chose, which is the exact " +
    "outcome the rule exists to prevent. THE CHAIN MAKES IT MECHANICAL: " +
    "whoever was just paid one pays the next, to somebody who has not had " +
    "one. Nobody is paid twice because the pool only shrinks, nobody is " +
    "missed because the chain cannot end while anybody is outside it, and " +
    "the last person left is always the host — so the ending is a fact " +
    "rather than a thing she has to notice. She keeps only the two rules and " +
    "the light. The preserved argument for the old shape: an order-free " +
    "round feels less like a round, and that was worth something; it was not " +
    "worth the guarantee.\n\n" +
    "WHAT THIS ROW DOES NOT DO. This room's take-home sheet declares two " +
    "dependencies on an ambient game — a score kept on paper, and a prize " +
    "changing hands. This game is neither: it is scheduled, it keeps no " +
    "score and it produces no object. Those two take-homes remain aimed at " +
    "nothing and are not fixed by mis-shaping this row to reach them.",

  runbook: {
    hostRole: "plays_too",
    hostNote:
      "You pay the first one and somebody pays you the last one. The only " +
      "job is watching the light and starting it, and it has to be started " +
      "ten minutes before you think.",
    steps: [
      {
        step: "work_out_when_the_light_goes",
        phase: "before",
        instruction: "Find out when the light actually goes here, and take ten minutes off it.",
        detail:
          "It goes faster than anybody expects, and a round started at the " +
          "right moment finishes in the dark. Ten minutes early is on time.",
      },
      {
        step: "count_the_room",
        phase: "before",
        instruction: "Count who is outside, and remember the number.",
        detail:
          "The chain is that many links long and it comes back to you at the " +
          "end of it, so the count is how you know roughly how long you have " +
          "and whether the light will hold.",
      },
      {
        step: "start_it_by_paying_one",
        phase: "opening",
        instruction: "Say one to somebody, by name, and do not explain what is happening first.",
        detail:
          "Started rather than announced. A round introduced as an exercise " +
          "in compliments produces compliments that sound like an exercise.",
        say: "Before the light goes. I am starting.",
        minutes: 2,
        printedPiece: "rules_card",
      },
      {
        step: "say_how_it_passes",
        phase: "opening",
        instruction: "After the first one lands, say the two rules and hand the chain to whoever got it.",
        detail:
          "To a face, and to somebody who has not had one. Said after the " +
          "first rather than before, so the group has already heard what the " +
          "register is and knows exactly what it is being asked for.",
        say: "To their face, and to somebody who has not had one yet. You have just had one, so you go next.",
        minutes: 2,
      },
      {
        step: "let_the_chain_run",
        phase: "playing",
        instruction: "Whoever was just paid one pays the next, to somebody who has not had one.",
        detail:
          "The chain does the bookkeeping and you do none: the pool of " +
          "people who have not had one gets smaller every time, so nobody is " +
          "paid twice and nobody is missed. If somebody will not say one, " +
          "whoever paid them names the next person instead and it carries " +
          "on. Anybody who comes outside while it runs joins the pool.",
        minutes: 11,
      },
      {
        step: "it_comes_back_to_you",
        phase: "ending",
        instruction: "You are the last one left. When somebody pays you one, it is over.",
        detail:
          "The chain cannot end anywhere else, which is the whole reason for " +
          "running it this way. Say nothing afterwards, do not sum it up, " +
          "and go back inside. Nobody won anything and nobody is thanked.",
        minutes: 3,
      },
    ],
    contingencies: [
      {
        trouble: "will_not_play",
        answer:
          "Somebody who will not say one is still paid one, and nothing is " +
          "said about the fact that they did not. Nobody is asked twice and " +
          "nobody is counted out loud.",
      },
      {
        trouble: "under_minimum",
        answer:
          "Under four, everybody pays everybody and it is a conversation " +
          "rather than a round. That is fine and it is what to run instead.",
      },
      {
        trouble: "over_size",
        answer:
          "Above sixteen, keeping track of who has been paid one is beyond " +
          "anybody. Split into two groups of eight, at opposite ends, and " +
          "count your own.",
      },
      {
        trouble: "running_long",
        answer:
          "The light is the clock and it cannot be extended. If half the " +
          "room has not gone when it is dark, stop and pay the rest yourself " +
          "on the way in, one at a time, quietly.",
      },
      {
        trouble: "played_before",
        answer:
          "A house that does this every year has people who have been " +
          "thinking about theirs since the drive up. That is not cheating, " +
          "it is the best version, and the prepared ones are the ones people " +
          "remember.",
      },
      {
        trouble: "not_landing",
        answer:
          "If the first two are jokes, let them be and pay the third one " +
          "straight. One sincere compliment in a row of three changes the " +
          "register for everything after it.",
      },
    ],
  },

  facets: [
    {
      dimension: "group_fun",
      code: "group_games",
      weight: 0.8,
      note:
        "One each, said to a face, all the way round before the light goes.",
    },
    { dimension: "affinity", code: "one_moment", weight: 0.9 },
    { dimension: "affinity", code: "ritual", weight: 0.9 },
    { dimension: "group_fun", code: "toast", weight: 0.8 },
    { dimension: "group_fun", code: "talk_deep", weight: 0.6 },
    { dimension: "affinity", code: "beauty", weight: 0.5 },
    { dimension: "affinity", code: "wit", weight: 0.3 },
    {
      dimension: "anti_preference",
      code: "forced_fun",
      weight: 0.7,
      note: "Everybody says something sincere out loud with the whole group listening. For some rooms this is the hardest thing in the catalogue.",
    },
  ],

  occasions: [],
  slots: [
    { slotCode: "game", fit: "native" },
    { slotCode: "day_material", fit: "native" },
  ],

  supplies: [],
  requirements: [
    { requirement: "printing" },
    {
      requirement: "floor_space",
      note: "Everybody outside and able to hear one person speaking without a circle being formed.",
    },
  ],
  printedMatter: [
    {
      piece: "rules_card",
      label: "The rule",
      description:
        "One card, one side, small enough to go in a pocket and be " +
        "carried outside — this one does not happen indoors and the card " +
        "leaves the house with whoever starts it. Her sentence, whole: " +
        "Everyone pays one compliment out loud, to a face, before the " +
        "light goes. It has to be legible in the last of the daylight, " +
        "which is the one real constraint on this piece.",
      voicePiece: "game_rule",
      quantity: 1,
    },
  ],
  dependencies: [],
  worlds: [
    {
      world: "st-moritz-1984",
      native: true,
      note: "Written in this room's voice. A whitelist, per rule 23.",
    },
  ],
};

/* ═══════════════════════════════════════════════════════════════════
 * THE FIELD DAY — FIVE GAMES, ONE AFTERNOON, AND NOBODY IS OUT
 *
 * Founder, 2026-09-06: "catskills multi day event gets all the field day
 * games", and then, when asked how they are placed: "field day can be multi
 * day or one day - host chooses itinerary... field day games include all and
 * she chooses for the daily newsletter/itinerary."
 *
 * ── WHY FIVE ROWS AND NOT ONE ───────────────────────────────────────
 *
 * "ALL the field day games" is plural, and the second sentence settles what
 * the plural means mechanically: you cannot choose among events INSIDE one
 * game. A host putting things on Saturday is choosing between GAMES. So each
 * is its own row with its own rules, its own supplies and its own printed
 * piece, exactly as the last pass established across the catalogue.
 *
 * ── WHAT THE HOUSE MAY PRINT ────────────────────────────────────────
 *
 * These are folk games with no owner — a sack, a rope, a spoon, an ankle tied
 * to another ankle. Nobody holds them, so the house prints the rules in full
 * and `sourcing` is `provided`, on fishbowl's precedent. The FORM is nobody's.
 * Everything on top of it is the house's and is written to this room: the
 * bunks as the sides, the office with the watch, the ledger, the line that
 * ends the afternoon.
 *
 * ── THE TWO `never` LINES THIS ROOM HOLDS, AND HOW FIVE RACES HONOUR
 *    THEM ───────────────────────────────────────────────────────────
 *
 * The room says "Never make the swim test a competition, and never write a
 * rule that somebody could fail." A field day is unmistakably a competition,
 * so the second half is where the work is, and it is answered the same way in
 * all five:
 *
 *   NOBODY IS ELIMINATED AND NOBODY SITS OUT. Nothing here has an "out". A
 *   dropped egg is picked up. A pair that falls gets up. There is no last
 *   round with two people left in it while everybody watches.
 *
 *   THE TIME GOES TO THE BUNK, NEVER TO THE PERSON. The ledger records which
 *   bunk and what it took, and no individual name is written next to a
 *   number. Losing with your bunk is not failing; it is the afternoon.
 *
 *   THE SIDES ARE ASSIGNED. The bunk list already exists and is already on the
 *   door with everybody on it. Nobody is picked and nobody picks, which is the
 *   room's own kindness — "the camp assigns rather than invites... nobody has
 *   to decide anything" — and it is also the only version of team games that
 *   does not reproduce the worst two minutes of a childhood.
 *
 * ── 1963, NOT AN AWAY-DAY ───────────────────────────────────────────
 *
 * CLAUDE.md rule 30: era-specific beats category-generic, and it is available
 * wherever a room has a year. Nothing below has a coach, a briefing, a
 * facilitator, a scoreboard or a prize anybody bought. It has a rope, a line
 * drawn with a heel, potato sacks the kitchen had anyway, and somebody's aunt
 * with a watch. The prize, where there is one, is not having to clear after
 * dinner.
 *
 * ── WHERE THEY ARE PLACED — ALL OF THEM, AND SHE CHOOSES ────────────
 *
 * Each claims `field_day` NATIVELY and claims nothing else, so
 * `slotEligibility` reads it as a whitelist: eligible for the field day beat
 * db/069 built, refused for the evening's game, and refused for
 * `day_material` — which matters, because `day_material` deals ONE candidate
 * per day and dealing one anonymous race on a Tuesday is the behaviour db/069
 * exists to end.
 *
 * THE BEAT IS AN `any_of` OFFER. All five are delivered together under one
 * `offer_group`, and she runs any non-empty subset of them. That is her two
 * clauses in one sentence — *"field day games include all and she chooses"* —
 * and it is a different mechanism from db/061's carousel, which delivers three
 * and runs exactly one. `occasion_slot.offer_rule` is what tells them apart.
 *
 * THE SET IS AN OFFER AND A NAME, NOT A PLACEMENT. Founder, correcting the
 * house's first reading within the minute: *"it is a set across different days
 * if host wants it."* So each delivered member carries its own `run_day` and
 * they are independent of each other — the rope on Saturday, the egg and the
 * bucket line on Sunday, the sack race not at all. NOTHING HERE WELDS THEM
 * TOGETHER, and a later pass reaching for `coherence_group` to make them land
 * on one afternoon would be restoring the invariant she just retired.
 *
 * WHAT IS STILL NOT TRUE, said here rather than discovered, because a
 * mechanism that looks like it honours her choice and does not is CLAUDE.md
 * rule 16's most expensive failure: a ONE-EVENING occasion still has no
 * daytime and therefore no field day. That is not a refusal, it is an
 * authoring absence (rule 29) — the catalogue has no lunch, no afternoon and
 * no day event, and `occasion_shape.daytime` is declared precisely so that
 * admitting one gives it the field day with no migration. On a multi-day
 * occasion a one-day field day is already hers: put every member on the same
 * `run_day`.
 *
 * AND ONE VOCABULARY GAP, RECORDED WHERE AN AUTHOR WILL MEET IT: these games
 * genuinely cannot happen indoors, and `game_requirement_kind` has no outdoor
 * term — the venue vocabulary lives in `structural_requirement`, which
 * `src/lib/games.ts` has no field for. They say it through `floor_space` and a
 * note, which is the precedent the last-light game already set. It is an
 * authoring absence in the requirement vocabulary, not a fact about the games.
 * ═══════════════════════════════════════════════════════════════════ */

/** What the five say in the same words, because it is one afternoon. */
const FIELD_DAY_SOURCE =
  "Founder ruling, 2026-09-06: \"catskills multi day event gets all the " +
  "field day games\", and \"field days are daytime games\". A field day is " +
  "folk material with no owner, so the house prints the rules in full. The " +
  "form is nobody's; the bunks as the sides, the office with the watch and " +
  "the ledger are the house's, authored to this room.";

const FIELD_DAY_WORLD =
  "Written in this room's voice, for its afternoon. A whitelist, per rule 23.";

const FIELD_DAY_SLOT =
  "db/069's own beat, offered whole. It claims this and nothing else, so the " +
  "whitelist refuses it the evening's game and refuses it the anonymous " +
  "one-a-day deal `day_material` would have given it. The set is an OFFER and " +
  "a NAME, never a placement: she says which members run and on which day, " +
  "and nothing here makes them land on the same afternoon.";

/**
 * THE SACK RACE.
 *
 * The one everybody can already picture, and the reason to write it down is
 * the part nobody pictures: what happens to the sack between two people.
 */
const CATSKILLS_THE_SACK_RACE: Game = {
  slug: "catskills-the-sack-race",
  name: "The Sack Race",
  description:
    "One sack a bunk, and everybody in it once. The bunk with the sack goes " +
    "up the field and back, and the office writes down what it took.",
  howItWorks:
    "One sack for each bunk and one line drawn at each end of a flat piece " +
    "of grass, about twenty paces apart. The sacks are the kind potatoes " +
    "come in, and there is one spare because there is always one spare.\n\n" +
    "Each bunk lines up behind the near line in whatever order it likes. " +
    "The first person gets in the sack, holds it at the waist, and goes to " +
    "the far line and back. At the near line she gets out of it and the next " +
    "person gets in, and so on until everybody in that bunk has been in the " +
    "sack once. The office starts a watch when the first person moves and " +
    "stops it when the last one is back over the line.\n\n" +
    "Two rules, and they are the only two. You may not run out of the sack " +
    "and carry it, and you may not be lifted. If you go over, get up where " +
    "you fell and carry on from there; nobody is out and nothing is " +
    "restarted.\n\n" +
    "All the bunks go, one at a time, and each one is timed. THE TIME " +
    "BELONGS TO THE BUNK. No individual is timed and no name is written next " +
    "to a number, which is the difference between a bunk being slower and a " +
    "person being slow.\n\n" +
    "The quickest bunk does not clear after dinner. That is the whole prize " +
    "and it is a real one.",
  materials:
    "THE HOUSE PRINTS one notice, to be pinned where the sacks are: the " +
    "rules at the head and a ruled table underneath with room for a bunk and " +
    "a time. YOU SUPPLY one hessian or heavy paper sack per bunk and one " +
    "spare, a watch with a second hand, and a flat piece of grass about " +
    "twenty paces long.",

  shape: "scheduled",
  sourcing: "provided",
  phase: "daylight",
  durationMinutes: 20,
  durationMaxMinutes: 30,
  // Under six there are not two bunks in it and a relay against nobody is a
  // person hopping alone. No ceiling: more bunks is a longer afternoon, which
  // is what an afternoon is for.
  minGuests: 6,
  maxGuests: undefined,

  scoring:
    "One time per bunk, taken from the first person moving to the last one " +
    "back over the line, written on the notice. No individual is timed. The " +
    "quickest bunk does not clear after dinner.",

  sourceNote: FIELD_DAY_SOURCE,
  notes:
    "NO RULE OF HERS: the founder named the material — \"catskills multi day " +
    "event gets all the field day games\" — and did not write the rule, so " +
    "there is no sentence to quote and everything below the form is the " +
    "house's. That heading is fixed and games.test.ts reads it.\n\n" +
    "EVERYBODY IN THE SACK ONCE IS THE LOAD-BEARING RULE, and it is not how " +
    "a sack race is usually run. The ordinary version is everybody at once in " +
    "a line, which produces one winner, one long tail and eleven people " +
    "watching the last two. As a bunk relay nobody is watching anybody: your " +
    "own bunk is shouting at you and the other bunks are waiting their turn.\n\n" +
    "GET UP WHERE YOU FELL is the room's \"never write a rule that somebody " +
    "could fail\" made mechanical. There is no disqualification in this game. " +
    "Falling over is the game.",

  runbook: {
    hostRole: "plays_too",
    hostNote:
      "You are in a bunk and you get in the sack like everybody else. The " +
      "watch passes to whoever is not running, which is the bunk waiting its " +
      "turn.",
    steps: [
      {
        step: "draw_the_two_lines",
        phase: "before",
        instruction: "Mark a line at each end of a flat piece of grass, about twenty paces apart.",
        detail:
          "A heel dragged through the grass is the line. Twenty paces is far " +
          "enough to be a race and short enough that the slowest person is " +
          "not out there alone.",
        supplyItem: "A flat piece of grass",
      },
      {
        step: "count_the_sacks",
        phase: "before",
        instruction: "Put out one sack per bunk and one spare, at the near line.",
        detail:
          "The spare is not optional. A sack goes at some point in the " +
          "afternoon and a field day that stops for want of one is a field " +
          "day that stopped.",
        supplyItem: "A sack per bunk",
        printedPiece: "the_notice",
      },
      {
        step: "read_the_two_rules",
        phase: "opening",
        instruction: "Say the two rules, and say that nobody is out.",
        detail:
          "No running out of the sack and carrying it, and no lifting " +
          "anybody. Then the third thing, which is the one that matters: if " +
          "you go over, get up where you fell.",
        say: "One sack a bunk and everybody in it once. Do not carry the sack and do not lift anybody. If you go over, get up where you went over and carry on. Nobody is out of this.",
        minutes: 3,
        printedPiece: "the_notice",
      },
      {
        step: "run_the_bunks",
        phase: "playing",
        instruction: "Send one bunk at a time and time it from the first person moving to the last one back.",
        detail:
          "The bunk lines up in whatever order it likes and sorts that out " +
          "itself. One watch, one bunk, one number. Whoever is holding the " +
          "watch is holding it for a bunk that is not theirs.",
        minutes: 18,
        supplyItem: "A watch with a second hand",
      },
      {
        step: "write_the_times",
        phase: "deciding",
        instruction: "Write each bunk and its time on the notice, in the order they went.",
        detail:
          "Bunks and times, nothing else. No names beside a number, which is " +
          "the whole reason the time belongs to the bunk.",
        minutes: 2,
        printedPiece: "the_notice",
      },
      {
        step: "say_who_is_not_clearing",
        phase: "ending",
        instruction: "Read the times out and say which bunk is not clearing after dinner.",
        detail:
          "Read them all, quickest last. Then say the sentence and go and do " +
          "the next thing; a field day that stops to congratulate itself has " +
          "become a ceremony.",
        say: "That is the sack race. Bunk 3 is not clearing after dinner.",
        minutes: 2,
      },
    ],
    contingencies: [
      {
        trouble: "will_not_play",
        answer:
          "Somebody who will not get in a sack holds the watch and writes the " +
          "times. It is a real job, it is argued over, and the bunk she is " +
          "timing is not hers.",
      },
      {
        trouble: "under_minimum",
        answer:
          "Under six there are not two bunks in it. Run it as one line " +
          "against the watch, everybody once, and write the one time down. " +
          "The afternoon still has a number in the ledger.",
      },
      {
        trouble: "over_size",
        answer:
          "Above about thirty a bunk waits a long time for its turn. Draw a " +
          "second pair of lines alongside and run two bunks at once, on two " +
          "watches. Nothing else changes.",
      },
      {
        trouble: "running_long",
        answer:
          "It runs long when the bunks are big. Send the last two bunks " +
          "together on parallel lines rather than shortening anybody's turn. " +
          "The turns are the game.",
      },
      {
        trouble: "played_before",
        answer:
          "Everybody has done a sack race and nobody has done it as a relay " +
          "with a watch on the bunk. Say that part out loud and it is a " +
          "different afternoon.",
      },
      {
        trouble: "not_landing",
        answer:
          "If it is flat, the ground is too smooth or the distance is too " +
          "short. Move the far line ten paces further out. A sack race is " +
          "funny in direct proportion to how far there is left to go.",
      },
    ],
  },

  facets: [
    {
      dimension: "group_fun",
      code: "compete",
      weight: 0.9,
      note: "It is a timed race between sides and the time is written down. A host who said her people get genuinely competitive is the host this is for.",
    },
    {
      dimension: "group_fun",
      code: "group_games",
      weight: 1,
      note: "Everybody is in the sack once. There is no way to sit it out except by taking the watch, which is also a job.",
    },
    { dimension: "affinity", code: "ease", weight: 0.5 },
    {
      dimension: "anti_preference",
      code: "forced_fun",
      weight: 0.8,
      note: "Everybody takes a turn in front of everybody. A host who vetoes forced participation should not be offered this, and the positive weight is what makes it disappear for her.",
    },
    {
      dimension: "anti_preference",
      code: "kids_party",
      weight: 0.6,
      note: "It is a sack race, and a host is entitled to know that before it is put in front of her.",
    },
  ],

  occasions: [],
  slots: [{ slotCode: "field_day", fit: "native", note: FIELD_DAY_SLOT }],

  supplies: [
    {
      item: "A sack per bunk",
      detail:
        "Hessian or heavy paper, the kind potatoes come in, waist high on the shortest person. One spare, always.",
      source: "host_buys",
      leadTimeDays: 7,
    },
    {
      item: "A watch with a second hand",
      detail: "Anything that counts seconds and can be handed to somebody else.",
      source: "on_hand",
      quantity: 1,
    },
    {
      item: "A flat piece of grass",
      detail: "About twenty paces of it, with room at both ends for people to stand.",
      source: "on_hand",
      quantity: 1,
    },
  ],
  requirements: [
    {
      requirement: "floor_space",
      note: "Twenty paces of flat grass outdoors, with room at both ends. This one cannot happen indoors and there is no outdoor term in game_requirement_kind to say so with.",
    },
    { requirement: "printing" },
  ],
  printedMatter: [
    {
      piece: "the_notice",
      label: "The sack race",
      description:
        "One sheet, pinned where the sacks are, set in the room's own face. " +
        "The rules at the head in the fewest words that can be read at ten " +
        "paces, and a ruled table underneath with a column for the bunk and a " +
        "column for the time. It is the scoring, the rules and the ledger " +
        "page in one object, which is what stops a field day needing three.",
      voicePiece: "game_rule",
      quantity: 1,
    },
  ],
  dependencies: [],
  worlds: [{ world: "catskills", native: true, note: FIELD_DAY_WORLD }],
};

/**
 * THE ROPE.
 *
 * Tug of war, and the two decisions that make it a game rather than a
 * stalemate: the sides swap ends, and the rope has a handkerchief on it.
 */
const CATSKILLS_THE_ROPE: Game = {
  slug: "catskills-the-rope",
  name: "The Rope",
  description:
    "Two bunks, one rope, a handkerchief tied at the middle of it. Best of " +
    "three, and the sides swap ends between pulls so the ground is nobody's.",
  howItWorks:
    "One long rope, thick enough to hold without it cutting, with a " +
    "handkerchief tied at the exact middle. A line is drawn in the grass and " +
    "the handkerchief is held over it to start.\n\n" +
    "Two bunks take an end each, in any order, with the heaviest at the " +
    "back. If the bunks are uneven the bigger one lends a person to the " +
    "smaller one and that person pulls for the side she is lent to, which is " +
    "settled before anybody picks up the rope and is not argued about " +
    "afterwards.\n\n" +
    "The office says pull. It is over when the handkerchief has crossed the " +
    "line and stayed across it while somebody counts to three out loud. " +
    "Nobody lets go on purpose to make somebody fall, and anybody who sits " +
    "down is standing on their own feet again before the next pull.\n\n" +
    "THEN THE SIDES SWAP ENDS AND PULL AGAIN. This is the rule the ordinary " +
    "version leaves out, and it is the one that makes the result mean " +
    "something: grass has a slope, and a side that won at the high end has " +
    "not beaten anybody yet. Best of three, and the third pull is at " +
    "whichever end the first was.\n\n" +
    "With more than two bunks, they take it in turns and the winner of each " +
    "meeting stays on the rope. A bunk that has pulled twice in a row sits " +
    "the next one out, because the rope is heavier the second time and much " +
    "heavier the third.",
  materials:
    "THE HOUSE PRINTS one notice for the rope: the rules, and a ruled table " +
    "for which bunk beat which. YOU SUPPLY a rope about fifteen paces long " +
    "and thick enough to hold comfortably, a handkerchief or a strip of cloth " +
    "to tie at its middle, and flat grass with a line drawn across it.",

  shape: "scheduled",
  sourcing: "provided",
  phase: "daylight",
  durationMinutes: 15,
  durationMaxMinutes: 25,
  minGuests: 8,
  maxGuests: undefined,

  scoring:
    "Best of three pulls, ends swapped between them. With more than two " +
    "bunks the winner stays on the rope and nobody pulls three in a row. " +
    "Which bunk beat which goes on the notice; nothing is added up.",

  sourceNote: FIELD_DAY_SOURCE,
  notes:
    "NO RULE OF HERS: the founder named the material and did not write the " +
    "rule. Everything below the form is the house's.\n\n" +
    "SWAPPING ENDS IS THE HOUSE'S AND IT IS THE WHOLE GAME. Every lawn has a " +
    "slope and the side at the top of it wins without pulling harder. One " +
    "swap turns an argument about the ground into a result, and it costs " +
    "thirty seconds.\n\n" +
    "THE LENT PERSON is the other one. Uneven sides are the normal case at a " +
    "party and the ordinary fix — send somebody over — is exactly the moment " +
    "a person gets picked last in front of everybody. So it is decided by " +
    "the office before the rope is touched, it is announced as a loan, and " +
    "the person goes back to her own bunk for the next meeting.\n\n" +
    "COUNTING TO THREE OUT LOUD is not fussiness. Without it every pull ends " +
    "in a disagreement about whether it had really crossed, and a field day " +
    "that turns on adjudication has stopped being a field day.",

  runbook: {
    hostRole: "plays_too",
    hostNote:
      "You are on the rope with your bunk. The only job that is yours is " +
      "saying pull and counting to three, and both can be handed to whoever " +
      "is sitting the pull out.",
    steps: [
      {
        step: "tie_the_handkerchief",
        phase: "before",
        instruction: "Find the middle of the rope and tie a handkerchief there.",
        detail:
          "Fold the rope in half to find the middle rather than measuring it. " +
          "The knot is what the whole game is watching.",
        supplyItem: "A rope",
      },
      {
        step: "draw_the_line",
        phase: "before",
        instruction: "Draw a line across flat grass and note which end is higher.",
        detail:
          "There is always a higher end. Knowing which it is before anybody " +
          "pulls is what makes the swap uncontroversial when it happens.",
        supplyItem: "Flat grass with a line across it",
        printedPiece: "the_notice",
      },
      {
        step: "settle_the_sides",
        phase: "opening",
        instruction: "Put two bunks on the ends and settle any loan before the rope is picked up.",
        detail:
          "If one bunk is bigger, it lends a person to the other one and says " +
          "so out loud. Decided first, announced as a loan, and not revisited " +
          "when somebody starts losing.",
        say: "Bunk 2 at the top end, Bunk 4 at the bottom. Bunk 2 is lending Bunk 4 a person for this one. Heaviest at the back.",
        minutes: 3,
      },
      {
        step: "pull_and_swap",
        phase: "playing",
        instruction: "Say pull. It is over when the handkerchief crosses the line and stays across for a count of three.",
        detail:
          "Then swap ends and pull again, and if it is one each, pull a third " +
          "at the end the first one was. With more bunks the winner stays on " +
          "and nobody pulls three in a row.",
        minutes: 14,
        supplyItem: "A rope",
      },
      {
        step: "write_who_beat_whom",
        phase: "deciding",
        instruction: "Write which bunk beat which on the notice. Nothing is added up.",
        detail:
          "A list of meetings, not a table of points. The rope produces an " +
          "afternoon of small results and adding them together would invent a " +
          "champion nobody played for.",
        minutes: 1,
        printedPiece: "the_notice",
      },
      {
        step: "put_the_rope_away",
        phase: "ending",
        instruction: "Coil the rope, say who won the last one, and stop there.",
        detail:
          "The rope goes away while people still want another pull. That is " +
          "the right time and it is always ten minutes before anybody thinks " +
          "it is.",
        say: "Bunk 4 took the last one. The rope goes away now.",
        minutes: 2,
        supplyItem: "A rope",
      },
    ],
    contingencies: [
      {
        trouble: "will_not_play",
        answer:
          "Somebody who will not pull says pull and counts to three, and both " +
          "of those are argued with, which is the point of them.",
      },
      {
        trouble: "under_minimum",
        answer:
          "Under eight there are not two ends. Run it as three against three " +
          "with everybody swapping in after each pull, and let the loan rule " +
          "do the arithmetic.",
      },
      {
        trouble: "odd_number",
        answer:
          "An odd number is what the loan is for. The bigger bunk lends one " +
          "person, decided before the rope is touched and announced as a loan.",
      },
      {
        trouble: "over_size",
        answer:
          "Above about thirty the rope runs out before the people do. Cap " +
          "each end at eight and rotate the rest in between pulls; a bunk of " +
          "twelve pulling at once is mostly people holding a rope.",
      },
      {
        trouble: "running_long",
        answer:
          "Stop at the meeting somebody is already arguing about. A field day " +
          "with an unfinished argument in it is a better afternoon than one " +
          "that ran everybody out.",
      },
      {
        trouble: "played_before",
        answer:
          "Everybody has pulled a rope and almost nobody has swapped ends. " +
          "Say why the swap is there and the second pull is a different game " +
          "from the first.",
      },
      {
        trouble: "not_landing",
        answer:
          "A pull that ends in four seconds is a mismatch, not a game. Move " +
          "one person across as a loan and pull it again rather than moving " +
          "on; the rope is only good when it is close.",
      },
    ],
  },

  facets: [
    {
      dimension: "group_fun",
      code: "compete",
      weight: 1,
      note: "Two sides and a rope. There is nothing else in the catalogue this literal about competing, and it should be reached for first by a host who asked for it.",
    },
    {
      dimension: "group_fun",
      code: "group_games",
      weight: 0.9,
      note: "Everybody who is on the rope is pulling. Nobody stands in the middle of this one.",
    },
    { dimension: "affinity", code: "one_moment", weight: 0.4 },
    {
      dimension: "anti_preference",
      code: "forced_fun",
      weight: 0.7,
      note: "The sides are assigned and everybody on a side pulls. Positive on purpose: this is what a host who vetoes forced participation is vetoing.",
    },
    {
      dimension: "anti_preference",
      code: "kids_party",
      weight: 0.5,
      note: "It is a tug of war. Said plainly so a host can decline it on sight.",
    },
  ],

  occasions: [],
  slots: [{ slotCode: "field_day", fit: "native", note: FIELD_DAY_SLOT }],

  supplies: [
    {
      item: "A rope",
      detail:
        "About fifteen paces, thick enough to hold without it cutting into anybody's hands. Natural fibre if there is a choice.",
      source: "host_buys",
      leadTimeDays: 10,
    },
    {
      item: "A handkerchief",
      detail: "Or any strip of cloth, tied at the exact middle of the rope. It is what everybody watches.",
      source: "on_hand",
      quantity: 1,
    },
    {
      item: "Flat grass with a line across it",
      detail: "Drawn with a heel. Note which end is higher before anybody pulls.",
      source: "on_hand",
      quantity: 1,
    },
  ],
  requirements: [
    {
      requirement: "floor_space",
      note: "Fifteen paces of flat grass outdoors with standing room at both ends. It cannot happen indoors and game_requirement_kind has no term for that.",
    },
    { requirement: "printing" },
  ],
  printedMatter: [
    {
      piece: "the_notice",
      label: "The rope",
      description:
        "One sheet in the room's face, pinned where the rope is. The rules " +
        "short enough to read while holding something, the swap explained in " +
        "one line because it is the rule nobody expects, and a ruled table " +
        "underneath for which bunk beat which. No column for a total, on " +
        "purpose.",
      voicePiece: "game_rule",
      quantity: 1,
    },
  ],
  dependencies: [],
  worlds: [{ world: "catskills", native: true, note: FIELD_DAY_WORLD }],
};

/**
 * TIED AT THE ANKLE.
 *
 * The three-legged race, with the one change that makes it the camp's: the
 * pairs are drawn out of the tin rather than chosen.
 */
const CATSKILLS_TIED_AT_THE_ANKLE: Game = {
  slug: "catskills-tied-at-the-ankle",
  name: "Tied At The Ankle",
  description:
    "Names out of a tin, two at a time, and whoever comes out together is " +
    "tied together. Up the field and back, and nobody chooses a partner.",
  howItWorks:
    "Everybody's name goes in the tin. The office draws two at a time and " +
    "those two are a pair, tied at the ankle with a strip of cloth, and that " +
    "is the whole of how partners are decided. Nobody picks and nobody is " +
    "picked. If the last name out has nobody to go with, it goes with " +
    "whoever drew it.\n\n" +
    "Tie the inside ankles together, above the bone and not tight enough to " +
    "mark. Inside arms round each other's backs is the way that works and " +
    "nobody has to be told twice.\n\n" +
    "All the pairs line up behind the same line and go at once, to the far " +
    "line and back. There is no clock and no heats. The first pair back is " +
    "the first pair back, and every other pair finishes, which is the rule " +
    "that matters: NOTHING ENDS UNTIL THE LAST PAIR IS OVER THE LINE, and " +
    "the last pair gets the loudest of it.\n\n" +
    "If you go down, get up where you fell. Nobody may be carried and nobody " +
    "may be dragged. A pair that comes untied stops, ties it again, and goes " +
    "on from there.\n\n" +
    "Run it twice, and redraw the tin between. Two draws is what makes it a " +
    "draw rather than a verdict on the first one.",
  materials:
    "THE HOUSE PRINTS one notice: the rules, and a ruled space to write the " +
    "pairs as they come out of the tin. YOU SUPPLY strips of soft cloth about " +
    "an arm long, one per pair and two spare, a tin or a bowl for the names, " +
    "paper and a pencil, and a flat piece of grass about twenty paces long.",

  shape: "scheduled",
  sourcing: "provided",
  phase: "daylight",
  durationMinutes: 20,
  durationMaxMinutes: 30,
  minGuests: 6,
  maxGuests: 30,

  scoring:
    "The first pair back is the first pair back, and it is said out loud and " +
    "not written down. What goes on the notice is who was tied to whom, both " +
    "times, because that is the part anybody wants to read.",

  sourceNote: FIELD_DAY_SOURCE,
  notes:
    "NO RULE OF HERS: the founder named the material and did not write the " +
    "rule. Everything below the form is the house's.\n\n" +
    "THE TIN IS THE WHOLE DEPARTURE AND IT IS THIS ROOM'S OWN DEVICE. A " +
    "three-legged race normally begins with everybody choosing, which takes " +
    "four minutes and ends with two people left over. The camp assigns — it " +
    "is the room's first principle, stated in its own voice, and it is the " +
    "kindness as much as the joke. It is also the reason to run it twice: " +
    "one draw is a coincidence and two is the tin doing it on purpose.\n\n" +
    "NOTHING ENDS UNTIL THE LAST PAIR IS IN. Written as a rule rather than " +
    "left to manners, because the moment a field day goes wrong is the moment " +
    "the winners start talking while two people are still coming up the " +
    "grass.\n\n" +
    "ABOVE THE BONE AND NOT TIGHT is the only piece of safety writing in " +
    "these five and it is in the rules rather than in a note, because it is " +
    "the thing a host says out loud while people are already tying.",

  runbook: {
    hostRole: "plays_too",
    hostNote:
      "Your name is in the tin like everybody else's. The only thing that is " +
      "yours is drawing it, and you can hand that over as soon as your own " +
      "name is out.",
    steps: [
      {
        step: "cut_the_cloth",
        phase: "before",
        instruction: "Cut soft cloth into strips about an arm long, one per pair and two spare.",
        detail:
          "An old sheet is right. Soft, wide and long enough to go round two " +
          "ankles twice and still knot.",
        supplyItem: "Strips of soft cloth",
      },
      {
        step: "fill_the_tin",
        phase: "before",
        instruction: "Write everybody's name on a slip and put them in the tin.",
        detail:
          "Yours as well. A tin somebody is not in is a tin somebody is " +
          "running.",
        supplyItem: "A tin",
        printedPiece: "the_notice",
      },
      {
        step: "draw_the_pairs",
        phase: "opening",
        instruction: "Draw two at a time and read both names out. Write them on the notice as they come.",
        detail:
          "Read them together, not one and then the other. If the last name " +
          "has nobody to go with, it goes with whoever is drawing.",
        say: "Names out of the tin, two at a time. You do not choose and you are not chosen. Whoever comes out with you is who you are tied to.",
        minutes: 5,
        supplyItem: "A tin",
      },
      {
        step: "tie_and_run",
        phase: "playing",
        instruction: "Tie the inside ankles above the bone, line everybody up, and go together to the far line and back.",
        detail:
          "Inside arms round each other's backs. Everybody starts at once, " +
          "there is no clock, and if you go down you get up where you fell.",
        minutes: 8,
        supplyItem: "Strips of soft cloth",
      },
      {
        step: "wait_for_the_last_pair",
        phase: "playing",
        instruction: "Nothing is announced until the last pair is over the line.",
        detail:
          "This is a rule and not a courtesy. Everybody stays turned that way " +
          "and the last pair gets the loudest of it.",
        minutes: 2,
      },
      {
        step: "redraw_and_run_again",
        phase: "playing",
        instruction: "Put the names back in the tin, draw again, and run it once more.",
        detail:
          "Two draws is what makes it a draw. The second set of pairs is " +
          "always better than the first and nobody knows why.",
        minutes: 10,
        supplyItem: "A tin",
      },
      {
        step: "write_the_pairs_down",
        phase: "deciding",
        instruction: "Check both sets of pairs are on the notice, and say which pair came back first.",
        detail:
          "The pairs are the record. The winners are said out loud once and " +
          "not written, which is the right way round for a race nobody was " +
          "timed in.",
        minutes: 2,
        printedPiece: "the_notice",
      },
      {
        step: "untie_everybody",
        phase: "ending",
        instruction: "Untie, collect the cloth, and stop.",
        detail:
          "Collect the strips yourself. Otherwise they are in the grass for " +
          "the rest of the week and one of them is somebody's good sheet.",
        say: "That is both draws. Give me the strips back and go and get a drink.",
        minutes: 2,
        supplyItem: "Strips of soft cloth",
      },
    ],
    contingencies: [
      {
        trouble: "will_not_play",
        answer:
          "Somebody who will not be tied to anybody draws the tin and writes " +
          "the pairs down. She sees every pair before anybody else does, " +
          "which is the best seat in this one.",
      },
      {
        trouble: "under_minimum",
        answer:
          "Under six the tin is not a draw, it is a list. Run it as one race " +
          "of two or three pairs and draw twice anyway; the second draw is " +
          "what people remember.",
      },
      {
        trouble: "odd_number",
        answer:
          "The last name out goes with whoever is drawing. If that is also " +
          "you, it goes with the person who has already finished and is " +
          "nearest.",
      },
      {
        trouble: "over_size",
        answer:
          "Above thirty the line is wider than the grass. Run it in two " +
          "halves, drawn from the same tin, and do not time either of them.",
      },
      {
        trouble: "running_long",
        answer:
          "Drop the second draw rather than shortening the first race. One " +
          "good draw run whole beats two run in a hurry.",
      },
      {
        trouble: "played_before",
        answer:
          "Everybody has run one and chosen their own partner. Say that this " +
          "one comes out of a tin and watch the room work out what that " +
          "means before the first pair is out.",
      },
      {
        trouble: "not_landing",
        answer:
          "It is not landing because the pairs are too polite. Redraw and " +
          "read the two names out together, loudly, instead of handing the " +
          "slips round; the announcement is half the game.",
      },
    ],
  },

  facets: [
    {
      dimension: "group_fun",
      code: "group_games",
      weight: 1,
      note: "Every name is in the tin. There is no version of this in which somebody is not paired with somebody.",
    },
    {
      dimension: "group_fun",
      code: "compete",
      weight: 0.6,
      note: "There is a first pair back and it is said out loud. Lower than the rope because nothing is timed and nothing is written down.",
    },
    { dimension: "affinity", code: "ease", weight: 0.6 },
    { dimension: "affinity", code: "one_moment", weight: 0.4 },
    {
      dimension: "anti_preference",
      code: "forced_fun",
      weight: 0.9,
      note: "You are assigned a partner and tied to her. The highest positive on this facet in the pool, and it is the honest number.",
    },
    {
      dimension: "anti_preference",
      code: "strangers",
      weight: 0.5,
      note: "A drawn pair can be two people who have not spoken. That is the point of it and a host who said her people do not want that should not be offered it.",
    },
    {
      dimension: "anti_preference",
      code: "kids_party",
      weight: 0.5,
    },
  ],

  occasions: [],
  slots: [{ slotCode: "field_day", fit: "native", note: FIELD_DAY_SLOT }],

  supplies: [
    {
      item: "Strips of soft cloth",
      detail:
        "An old sheet torn into strips about an arm long, one per pair and two spare. Soft and wide, so nothing marks anybody.",
      source: "on_hand",
    },
    {
      item: "A tin",
      detail: "Or a bowl. The same one the slips go in, if the camp has one out already.",
      source: "on_hand",
      quantity: 1,
    },
    {
      item: "Paper and a pencil",
      detail: "For the names. Small slips, folded once.",
      source: "on_hand",
      quantity: 1,
    },
    {
      item: "A flat piece of grass",
      detail: "About twenty paces, wide enough for every pair to start in one line.",
      source: "on_hand",
      quantity: 1,
    },
  ],
  requirements: [
    {
      requirement: "floor_space",
      note: "Twenty paces of flat grass outdoors, wide enough for one starting line. It cannot happen indoors and game_requirement_kind has no term for that.",
    },
    { requirement: "printing" },
  ],
  printedMatter: [
    {
      piece: "the_notice",
      label: "Tied at the ankle",
      description:
        "One sheet in the room's face. The rules at the head, with the ankle " +
        "line said plainly because it is read aloud while people are already " +
        "tying, and two ruled columns underneath for the pairs as they come " +
        "out of the tin — one column per draw. The pairs are the thing " +
        "anybody wants to read afterwards, which is why the sheet has room " +
        "for them and no room for a result.",
      voicePiece: "game_rule",
      quantity: 1,
    },
  ],
  dependencies: [],
  worlds: [{ world: "catskills", native: true, note: FIELD_DAY_WORLD }],
};

/**
 * EGG AND SPOON.
 *
 * The slow one, and the reason a field day needs a slow one: everything else
 * is decided by whoever is quickest.
 */
const CATSKILLS_EGG_AND_SPOON: Game = {
  slug: "catskills-egg-and-spoon",
  name: "Egg And Spoon",
  description:
    "A spoon each, an egg on it, and a walk to the far line and back. " +
    "Running is the one thing you may not do, and a dropped egg is picked up " +
    "where it fell.",
  howItWorks:
    "One spoon each and one egg each, raw and in its shell. Everybody lines " +
    "up behind the near line, holding the spoon by the very end of the " +
    "handle, one hand only, and walks to the far line and back.\n\n" +
    "Three rules. YOU MAY NOT RUN, and running is defined out loud before " +
    "anybody starts: both feet off the ground at once. You may not touch the " +
    "egg with your other hand at any point. And if the egg goes down, you " +
    "stop, pick it up where it fell, put it back on the spoon and carry on " +
    "from that spot. Nobody is out and nobody starts again.\n\n" +
    "It is over when everybody is back over the near line, and the order " +
    "people come back in is the order they came back in. Nothing is timed.\n\n" +
    "The eggs are raw and everybody is told so at the start. A hard-boiled " +
    "egg makes it a walking race; a raw one makes it the only game of the " +
    "afternoon where the slowest person can win, because the fast ones are " +
    "the ones who drop it.\n\n" +
    "Whoever gets round without dropping it at all gets their egg back at " +
    "breakfast, cooked however they like it.",
  materials:
    "THE HOUSE PRINTS one notice: the three rules and a ruled space for who " +
    "got round without dropping it. YOU SUPPLY one dessert spoon per person, " +
    "one raw egg per person and half a dozen spare, and a flat piece of grass " +
    "about fifteen paces long. Nothing here is worth doing on a hard floor.",

  shape: "scheduled",
  sourcing: "provided",
  phase: "daylight",
  durationMinutes: 15,
  durationMaxMinutes: 25,
  minGuests: 4,
  maxGuests: 30,

  scoring:
    "No clock and no places. The names of whoever got round without dropping " +
    "the egg go on the notice, and each of them gets that egg back at " +
    "breakfast, cooked however they like it.",

  sourceNote: FIELD_DAY_SOURCE,
  notes:
    "NO RULE OF HERS: the founder named the material and did not write the " +
    "rule. Everything below the form is the house's.\n\n" +
    "RAW, AND THE ROOM IS TOLD SO. This is the load-bearing decision and it " +
    "is the one a nervous author reverses. Hard-boiled removes the whole " +
    "game: the egg cannot be lost, so the fastest walker wins and it is a " +
    "walking race with a prop. Raw is what makes carefulness beat speed, " +
    "which is the only event of the five where that is true and is the reason " +
    "this one is in the set.\n\n" +
    "PICK IT UP WHERE IT FELL, AGAIN. Same rule as the sack, said again " +
    "because it is the room's own line about never writing a rule somebody " +
    "could fail. A dropped egg on a lawn is a mess and not a verdict.\n\n" +
    "THE EGG AT BREAKFAST is the house's, and it is deliberately not a prize " +
    "anybody bought. It is the same egg, it is the following morning, and it " +
    "is the smallest possible way of saying that yesterday afternoon " +
    "happened.\n\n" +
    "SIX SPARE EGGS is a real number and not a flourish. In a room of twelve " +
    "about four eggs do not survive the first crossing.",

  runbook: {
    hostRole: "plays_too",
    hostNote:
      "You walk it with a spoon like everybody else. The only thing that is " +
      "yours is saying what running means before anybody starts, and it takes " +
      "one sentence.",
    steps: [
      {
        step: "get_the_eggs_out",
        phase: "before",
        instruction: "Put out one spoon and one raw egg each, and six spare eggs beside them.",
        detail:
          "Dessert spoons, not tablespoons: a spoon an egg sits comfortably " +
          "in has taken the game out.",
        supplyItem: "An egg each, and six spare",
      },
      {
        step: "mark_fifteen_paces",
        phase: "before",
        instruction: "Draw a line at each end of flat grass, about fifteen paces apart.",
        detail:
          "Shorter than the sack race on purpose. This one is slow and " +
          "fifteen paces there and back is already a long way with an egg on " +
          "a spoon.",
        supplyItem: "A flat piece of grass",
        printedPiece: "the_notice",
      },
      {
        step: "say_what_running_is",
        phase: "opening",
        instruction: "Say the three rules, and define running before anybody argues about it.",
        detail:
          "Both feet off the ground at once is running. One hand on the " +
          "spoon, at the end of the handle. Egg down means pick it up where " +
          "it fell and carry on.",
        say: "One hand, at the end of the handle. Running is both feet off the ground at once, and you may not. If the egg goes down, pick it up where it went down and carry on from there. The eggs are raw.",
        minutes: 3,
        printedPiece: "the_notice",
      },
      {
        step: "walk_it",
        phase: "playing",
        instruction: "Everybody goes at once, to the far line and back over the near one.",
        detail:
          "No heats and no clock. The order people come back in is the order " +
          "they came back in, and the ones still out there have the whole " +
          "field watching them, which is the good part.",
        minutes: 12,
        supplyItem: "A spoon each",
      },
      {
        step: "write_the_clean_rounds",
        phase: "deciding",
        instruction: "Write down whoever got round without dropping it once.",
        detail:
          "Names, not places. It is usually nobody or it is usually three " +
          "people, and both of those are a good notice.",
        minutes: 2,
        printedPiece: "the_notice",
      },
      {
        step: "promise_the_breakfast",
        phase: "ending",
        instruction: "Tell whoever got round clean that they are getting that egg back at breakfast.",
        detail:
          "Say it to them and then say it to the field, and keep the eggs. " +
          "The promise is only worth anything if somebody actually cooks them " +
          "in the morning.",
        say: "Three of you got round without dropping it. Those are your eggs and you are getting them back in the morning.",
        minutes: 2,
        supplyItem: "An egg each, and six spare",
      },
    ],
    contingencies: [
      {
        trouble: "will_not_play",
        answer:
          "Somebody who will not carry an egg stands at the far line and " +
          "rules on whether anybody ran. It is the most argued-with job on " +
          "the field.",
      },
      {
        trouble: "under_minimum",
        answer:
          "Under four it is a walk with a friend. Move the far line out to " +
          "twenty-five paces and go twice; the distance is what makes it a " +
          "game when the numbers do not.",
      },
      {
        trouble: "over_size",
        answer:
          "Above thirty the line is wider than the grass and the eggs run " +
          "out. Go in two waves from the same line and buy another dozen.",
      },
      {
        trouble: "running_long",
        answer:
          "It runs long when several people keep dropping it near the end. " +
          "Say that anybody still out may finish while the notice is being " +
          "written, and start writing.",
      },
      {
        trouble: "played_before",
        answer:
          "Everybody has done it at school with a hard-boiled egg and a " +
          "teacher. Say the eggs are raw and that nobody is out, and it is " +
          "not the same game at all.",
      },
      {
        trouble: "not_landing",
        answer:
          "If nobody is dropping anything, the spoons are too deep. Swap to " +
          "the shallowest ones in the drawer and send everybody again.",
      },
    ],
  },

  facets: [
    {
      dimension: "group_fun",
      code: "group_games",
      weight: 0.9,
      note: "Everybody walks at the same time, which is what stops it being a queue.",
    },
    {
      dimension: "group_fun",
      code: "compete",
      weight: 0.4,
      note: "The lowest of the five on purpose: nothing is timed, there are no places, and carefulness beats speed.",
    },
    { dimension: "affinity", code: "ease", weight: 0.7 },
    { dimension: "affinity", code: "wit", weight: 0.3 },
    {
      dimension: "anti_preference",
      code: "forced_fun",
      weight: 0.6,
    },
    {
      dimension: "anti_preference",
      code: "kids_party",
      weight: 0.7,
      note: "It is the school sports day event, and a host is entitled to see that coming.",
    },
  ],

  occasions: [],
  slots: [{ slotCode: "field_day", fit: "native", note: FIELD_DAY_SLOT }],

  supplies: [
    {
      item: "A spoon each",
      detail: "Dessert spoons, and the shallowest ones in the drawer. A deep spoon takes the game out.",
      source: "on_hand",
      perGuest: true,
    },
    {
      item: "An egg each, and six spare",
      detail:
        "Raw and in the shell. Six spare is a real number: in a room of twelve about four do not survive the first crossing.",
      source: "host_buys",
      leadTimeDays: 2,
    },
    {
      item: "A flat piece of grass",
      detail: "About fifteen paces. Not a hard floor — a dropped egg on flagstones is a different afternoon.",
      source: "on_hand",
      quantity: 1,
    },
  ],
  requirements: [
    {
      requirement: "floor_space",
      note: "Fifteen paces of flat grass outdoors. Grass specifically, not a hard floor, and game_requirement_kind has no term for either.",
    },
    { requirement: "printing" },
  ],
  printedMatter: [
    {
      piece: "the_notice",
      label: "Egg and spoon",
      description:
        "One sheet in the room's face. Three rules at the head, with what " +
        "running means written out, because that is the only thing anybody " +
        "argues about. Underneath, a ruled space headed for whoever got round " +
        "without dropping it, and a line at the foot about breakfast. Names " +
        "and no places: the sheet has nowhere to write a first, a second or a " +
        "third.",
      voicePiece: "game_rule",
      quantity: 1,
    },
  ],
  dependencies: [],
  worlds: [{ world: "catskills", native: true, note: FIELD_DAY_WORLD }],
};

/**
 * THE BUCKET LINE.
 *
 * The wet one. Every field day has a wet one and it is always last, because
 * nothing dry can follow it.
 */
const CATSKILLS_THE_BUCKET_LINE: Game = {
  slug: "catskills-the-bucket-line",
  name: "The Bucket Line",
  description:
    "Each bunk in a line, a full bucket at one end and an empty one at the " +
    "other, and one cup that goes hand to hand over your heads. Most water " +
    "in the far bucket wins.",
  howItWorks:
    "Each bunk stands in a line, an arm's length apart. At the head of the " +
    "line is a full bucket; at the far end is an empty one with a mark drawn " +
    "on the inside of it about a third of the way up.\n\n" +
    "One enamel cup per line. The person at the head fills the cup and " +
    "passes it back OVER HER HEAD, without turning round. Everybody passes it " +
    "the same way, over the head, facing the front. The person at the end " +
    "tips whatever is left into the empty bucket and sends the cup back down " +
    "the line at knee height, which is the fast way and is why the line does " +
    "not stop.\n\n" +
    "Nobody moves their feet. That is the only prohibition and it is the one " +
    "everybody breaks, so it is said twice.\n\n" +
    "It runs for four minutes on the watch. When time is called, the line " +
    "with the most water in the far bucket wins, and if two are close the " +
    "office tips one into the other and looks. There is no measuring and " +
    "there is no arithmetic.\n\n" +
    "Everybody gets wet and the person at the head of the line gets the least " +
    "of it, which is why the head of the line changes for the second run.",
  materials:
    "THE HOUSE PRINTS one notice for the water: the rules and a ruled space " +
    "for which line won. YOU SUPPLY two buckets per bunk, one enamel or tin " +
    "cup per bunk, a watch, water, and a piece of grass nobody minds being " +
    "soaked. Towels near the house, not at the field.",

  shape: "scheduled",
  sourcing: "provided",
  phase: "daylight",
  durationMinutes: 15,
  durationMaxMinutes: 25,
  minGuests: 8,
  maxGuests: undefined,

  scoring:
    "Four minutes on the watch. Most water in the far bucket wins, judged by " +
    "eye and settled by tipping one into the other. Nothing is measured and " +
    "nothing is added up.",

  sourceNote: FIELD_DAY_SOURCE,
  notes:
    "NO RULE OF HERS: the founder named the material and did not write the " +
    "rule. Everything below the form is the house's.\n\n" +
    "OVER THE HEAD, FACING THE FRONT is the rule that makes it a game. Passed " +
    "hand to hand at waist height it is a chore and it is dry; passed " +
    "overhead without looking it is most of a cup down the back of the person " +
    "in front, which is the entire point and is why every version of this " +
    "ever played does it that way.\n\n" +
    "FOUR MINUTES, AND A WATCH. A bucket line with no clock runs until people " +
    "are cold. Four minutes is long enough for a line to find its rhythm and " +
    "lose it twice, and short enough that the second run is still wanted.\n\n" +
    "JUDGED BY EYE, ON PURPOSE. Measuring water is the moment this stops " +
    "being a camp and becomes a laboratory. Tipping one bucket into the " +
    "other in front of everybody is both the measurement and the best ten " +
    "seconds of it.\n\n" +
    "IT GOES LAST, and the runbook says so rather than leaving a host to find " +
    "out. Nothing dry can follow it.",

  runbook: {
    hostRole: "plays_too",
    hostNote:
      "You are in a line and you are getting wet. The watch goes to whoever " +
      "is not in a line, and if everybody is in a line it goes on a stump " +
      "where two people can see it.",
    steps: [
      {
        step: "fill_the_buckets",
        phase: "before",
        instruction: "Set two buckets per bunk: one full at the head of the line, one empty at the far end.",
        detail:
          "Draw a mark inside each empty bucket about a third of the way up. " +
          "It gives the line something to aim at and it makes the judging " +
          "quicker.",
        supplyItem: "Two buckets per bunk",
      },
      {
        step: "put_the_towels_by_the_house",
        phase: "before",
        instruction: "Put the towels by the house, not at the field.",
        detail:
          "Towels at the field end it early: somebody dries off and stops. " +
          "Towels at the house mean the whole line walks back together, wet, " +
          "which is the end of the afternoon rather than the end of a game.",
      },
      {
        step: "say_the_one_prohibition",
        phase: "opening",
        instruction: "Line the bunks up an arm apart and say the one rule twice: nobody moves their feet.",
        detail:
          "Then show the pass rather than describing it — over the head, " +
          "facing the front, and the cup comes back at knee height.",
        say: "Over your head, facing forwards, and do not turn round. The cup comes back low. Nobody moves their feet, and I am saying that twice because everybody moves their feet.",
        minutes: 4,
      },
      {
        step: "four_minutes",
        phase: "playing",
        instruction: "Four minutes on the watch, then call it and everybody stops where they are.",
        detail:
          "The line finds a rhythm in the first minute and loses it twice " +
          "after that. Do not coach anybody; a line that has worked it out is " +
          "the thing worth watching.",
        minutes: 5,
        supplyItem: "A watch",
      },
      {
        step: "swap_the_head_and_go_again",
        phase: "playing",
        instruction: "Move whoever was at the head to the back and run it once more.",
        detail:
          "The head of the line stays driest and everybody knows it by now. " +
          "One swap and nobody has to say anything about fairness.",
        minutes: 6,
      },
      {
        step: "tip_one_into_the_other",
        phase: "deciding",
        instruction: "Judge by eye, and where two are close tip one bucket into the other in front of everybody.",
        detail:
          "No measuring and no arithmetic. The tipping is the judging and it " +
          "is also the best ten seconds of the game.",
        minutes: 3,
        printedPiece: "the_notice",
      },
      {
        step: "walk_back_wet",
        phase: "ending",
        instruction: "Write the winning line on the notice and walk everybody back to the towels together.",
        detail:
          "This one goes last. Nothing dry can follow it and nobody should " +
          "be asked to sit down and play something else while wet.",
        say: "Bunk 1, by about two inches. Towels are at the house. That is the field day.",
        minutes: 2,
        printedPiece: "the_notice",
      },
    ],
    contingencies: [
      {
        trouble: "will_not_play",
        answer:
          "Somebody who will not get wet holds the watch, calls the four " +
          "minutes and does the tipping at the end. That job decides the " +
          "result, which is more than anybody in the line does.",
      },
      {
        trouble: "under_minimum",
        answer:
          "Under eight there is no line, there is a short queue. Move the " +
          "buckets further apart so the cup has further to travel, and run " +
          "one bunk against the mark on the bucket instead of against another " +
          "bunk.",
      },
      {
        trouble: "over_size",
        answer:
          "Above about thirty, a line is too long for one cup to be " +
          "interesting. Split each bunk into two lines with their own bucket " +
          "and let them share the result.",
      },
      {
        trouble: "running_long",
        answer:
          "Drop the second run rather than shortening the four minutes. The " +
          "clock is what stops it being a chore and it should not be touched.",
      },
      {
        trouble: "played_before",
        answer:
          "Somebody has done it at school with a sponge. Say the cup goes " +
          "over the head and nobody turns round, and it is a different game " +
          "in about fifteen seconds.",
      },
      {
        trouble: "not_landing",
        answer:
          "A dry line means the cup is being handed at waist height. Stop, " +
          "show the overhead pass once yourself, and start the four minutes " +
          "again from nothing.",
      },
    ],
  },

  facets: [
    {
      dimension: "group_fun",
      code: "compete",
      weight: 0.8,
      note: "Two lines, a clock and a result judged in front of everybody.",
    },
    {
      dimension: "group_fun",
      code: "group_games",
      weight: 1,
      note: "A line is only as good as the person in it who is not paying attention, which is what makes this the most collective of the five.",
    },
    { dimension: "affinity", code: "one_moment", weight: 0.5 },
    {
      dimension: "anti_preference",
      code: "forced_fun",
      weight: 0.8,
      note: "Everybody is in a line and everybody gets wet. Positive on purpose.",
    },
    {
      dimension: "anti_preference",
      code: "kids_party",
      weight: 0.6,
    },
    {
      dimension: "anti_preference",
      code: "photographed",
      weight: -0.4,
      note: "A NEGATIVE, and the only one in the five: this is the most photographed thing that will happen all week, so a host who does not want the day photographed is not being handed the reason it gets photographed.",
    },
  ],

  occasions: [],
  slots: [{ slotCode: "field_day", fit: "native", note: FIELD_DAY_SLOT }],

  supplies: [
    {
      item: "Two buckets per bunk",
      detail:
        "One full, one empty with a mark drawn inside about a third of the way up. Metal if there is a choice, because they get dropped.",
      source: "host_buys",
      leadTimeDays: 7,
    },
    {
      item: "An enamel cup per bunk",
      detail: "The same mugs everything else is drunk out of. One per line and one spare.",
      source: "on_hand",
    },
    {
      item: "A watch",
      detail: "Four minutes, twice. Anything that counts.",
      source: "on_hand",
      quantity: 1,
    },
    {
      item: "Towels, at the house",
      detail: "At the house and not at the field. Towels at the field end the game early.",
      source: "on_hand",
    },
  ],
  requirements: [
    {
      requirement: "floor_space",
      note: "Grass nobody minds being soaked, and a tap or a lake to fill from. It cannot happen indoors and game_requirement_kind has no term for that.",
    },
    { requirement: "printing" },
  ],
  printedMatter: [
    {
      piece: "the_notice",
      label: "The bucket line",
      description:
        "One sheet in the room's face, and it is the one sheet of the five " +
        "that will get wet, so it is pinned at the house rather than at the " +
        "field. The rules at the head with the overhead pass drawn rather " +
        "than described, the one prohibition printed twice because it is said " +
        "twice, and a ruled space at the foot for which line won and by about " +
        "how much.",
      voicePiece: "game_rule",
      quantity: 1,
    },
  ],
  dependencies: [],
  worlds: [{ world: "catskills", native: true, note: FIELD_DAY_WORLD }],
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

  // ── THE TWENTY ROOM GAMES — CLAUDE.md rule 29 ──────────────────────
  //
  // One per `piece: "game_rule"` in src/lib/destinations.ts, in the order
  // that file writes them, so the two lists can be read side by side. Two
  // rooms have two: Amalfi and Aspen.
  "westhampton-the-houseguest-list": WESTHAMPTON_THE_HOUSEGUEST_LIST,
  "las-vegas-the-late-supper": VEGAS_THE_LATE_SUPPER,
  "new-york-the-list": NEW_YORK_THE_LIST,
  "nantucket-what-the-weather-will-do": NANTUCKET_WHAT_THE_WEATHER_WILL_DO,
  "new-orleans-nobody-finishes-their-own": NEW_ORLEANS_NOBODY_FINISHES_THEIR_OWN,
  // The one room game with no `piece: "game_rule"` behind it. Founder, 2026-09-06:
  // "give charades to catskills." Placed in destination order like the rest.
  "catskills-what-happened-today": CATSKILLS_WHAT_HAPPENED_TODAY,
  "cote-dazur-one-of-them-is-lying": COTE_DAZUR_ONE_OF_THEM_IS_LYING,
  "portofino-the-boat-count": PORTOFINO_THE_BOAT_COUNT,
  "dolomites-the-temperature-at-the-top": DOLOMITES_THE_TEMPERATURE_AT_THE_TOP,
  "big-sur-the-long-way": BIG_SUR_THE_LONG_WAY,
  "tahiti-the-last-night": TAHITI_THE_LAST_NIGHT,
  "acapulco-the-last-song": ACAPULCO_THE_LAST_SONG,
  "amalfi-the-numbers-after-dark": AMALFI_THE_NUMBERS_AFTER_DARK,
  "amalfi-the-five-prizes": AMALFI_THE_FIVE_PRIZES,
  "aspen-somebodys-voice": ASPEN_SOMEBODYS_VOICE,
  "aspen-the-next-line": ASPEN_THE_NEXT_LINE,
  "palm-springs-the-best-line": PALM_SPRINGS_THE_BEST_LINE,
  "st-moritz-before-the-light-goes": ST_MORITZ_BEFORE_THE_LIGHT_GOES,

  // THE FIELD DAY, in the order it is run. Last on purpose: the bucket line
  // is the wet one and nothing dry follows it.
  "catskills-the-sack-race": CATSKILLS_THE_SACK_RACE,
  "catskills-the-rope": CATSKILLS_THE_ROPE,
  "catskills-tied-at-the-ankle": CATSKILLS_TIED_AT_THE_ANKLE,
  "catskills-egg-and-spoon": CATSKILLS_EGG_AND_SPOON,
  "catskills-the-bucket-line": CATSKILLS_THE_BUCKET_LINE,
} as const satisfies Record<string, Game>;

export type GameKey = keyof typeof GAMES;

export const ALL_GAMES: readonly Game[] = Object.values(GAMES);
