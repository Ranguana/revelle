/**
 * The library, as the landing page shows it.
 *
 * Seven plates. Each one is a destination the house has designed, described
 * the way the page needs to describe it: a name, a number, the occasion it was
 * built for, its tagline, and four rows of evidence.
 *
 * ── Why this is not src/lib/destinations.ts ──────────────────────────
 *
 * A `Destination` (src/lib/tokens.ts) is a LOOK and a VOICE, and both halves
 * are authored by hand before the thing exists — a palette, a lexicon, a page
 * of exemplars, a list of lines that were rejected. WESTHAMPTON, 1976 and
 * HAVANA, THE SMALL HOURS have all of that. The rest have a poster and a
 * description, which is what a catalogue page needs and nowhere near what a
 * writer needs.
 *
 * Stubbing half-specified `Destination` objects to get them onto this page
 * would put unauthored voices in the module a curator reviews, so they live
 * here instead, in the shape the page actually consumes. When one of them is
 * written end to end it graduates to destinations.ts and this file keeps only
 * the catalogue copy.
 *
 * The poster artwork is deliberately NOT here: art is presentation and lives
 * in src/app/plates.tsx, keyed by the same slug.
 *
 * ── Vocabulary ───────────────────────────────────────────────────────
 *
 * "Destination", never "world". The second is how the house talks to itself
 * and it means nothing to someone reading the page for the first time. See
 * docs/copy-brief.md.
 */

/** One row of evidence under a plate: what it is called, and what it is. */
export type PlateRow = {
  label: string;
  detail: string;
};

export type Plate = {
  /** Matches the key in src/app/plates.tsx and, one day, world.slug. */
  slug: string;
  /** Set large on the plate itself. */
  name: string;
  /** The short form under the poster. A plate is captioned, not titled. */
  caption: string;
  /** Light numbering, in the register of a house that keeps an archive. */
  number: string;
  /** Which of the four occasions this one was built for. */
  occasion: string;
  /** A place and a time, then two concrete details. Never the feeling named. */
  tagline: string;
  rows: readonly PlateRow[];
};

export const LIBRARY: readonly Plate[] = [
  {
    slug: "cote-dazur",
    name: "CÔTE D'AZUR, 1962",
    caption: "Côte d'Azur",
    number: "No. 02",
    occasion: "The long dinner",
    tagline: "Lunch that never ended. Nobody changed for dinner.",
    rows: [
      {
        label: "The Arrival",
        detail:
          "Cold rosé poured before anyone sits down. Shoes off at the door, by suggestion rather than sign.",
      },
      {
        label: "The Moment",
        detail:
          "The table moved outside at the last minute, plates carried out by whoever is standing.",
      },
      {
        label: "The Table",
        detail:
          "Anchovies, bread, too much lemon. One cocktail: the Ferrat, in short glasses.",
      },
      {
        label: "The Ending",
        detail:
          "The last hour on the steps, the good bottle opened when it stops being a party.",
      },
    ],
  },
  {
    slug: "portofino",
    name: "PORTOFINO, OFF-SEASON",
    caption: "Portofino",
    number: "No. 05",
    occasion: "The weekend away",
    tagline: "The harbour to yourselves. Everything shut but the good place.",
    rows: [
      {
        label: "The Arrival",
        detail:
          "A walk before the house is unpacked. Coats on, one drink standing up, the boats counted.",
      },
      {
        label: "The Moment",
        detail:
          "Saturday's long lunch, ordered for the table by whoever speaks the least Italian.",
      },
      {
        label: "The Table",
        detail:
          "Fish, one bowl of pasta more than needed, sharp white wine. Espresso standing at the bar.",
      },
      {
        label: "The Ending",
        detail:
          "The walk back in the dark, in the order the group naturally falls into.",
      },
    ],
  },
  {
    slug: "new-orleans",
    name: "NEW ORLEANS, 3 A.M.",
    caption: "New Orleans",
    number: "No. 03",
    occasion: "The birthday",
    tagline: "Dinner at nine. Nobody's leaving at eleven.",
    rows: [
      {
        label: "The Arrival",
        detail:
          "Sazeracs made badly and enthusiastically in the courtyard, before anyone has said hello properly.",
      },
      {
        label: "The Moment",
        detail:
          "The second wind, engineered: coffee and something fried at midnight, then back out.",
      },
      {
        label: "The Table",
        detail:
          "Oysters, cold beer, too much butter. The good champagne opened without a speech.",
      },
      {
        label: "The Ending",
        detail:
          "The walk home in a loose line, everyone still talking, nobody quite sure who paid.",
      },
    ],
  },
  {
    slug: "nantucket",
    name: "NANTUCKET, AUGUST",
    caption: "Nantucket",
    number: "No. 08",
    occasion: "The weekend away",
    tagline: "Newspaper on the table. Butter in a saucepan.",
    rows: [
      {
        label: "The Arrival",
        detail:
          "Beer in a bucket of ice on the porch. Sweaters by eight, whatever the forecast said.",
      },
      {
        label: "The Moment",
        detail:
          "The whole table shelling lobster with their hands, arguing about the right way to do it.",
      },
      {
        label: "The Table",
        detail:
          "Corn, lemon, drawn butter, paper plates on purpose. One pie, bought not made.",
      },
      {
        label: "The Ending",
        detail:
          "Down to the dock with the last drinks to watch nothing happen on the water.",
      },
    ],
  },
  {
    slug: "las-vegas",
    name: "LAS VEGAS, 1968",
    caption: "Las Vegas",
    number: "No. 14",
    occasion: "The birthday",
    tagline: "Everyone dressed up. Nobody in a nightclub queue.",
    rows: [
      {
        label: "The Arrival",
        detail:
          "Martinis in the suite, not the lobby. Everyone ready an hour before anything opens.",
      },
      {
        label: "The Moment",
        detail:
          "One table, one game, a fixed stake agreed in advance so the night can't get away from you.",
      },
      {
        label: "The Table",
        detail:
          "Steak at midnight, shrimp cocktail unironically, the good champagne on ice in the room.",
      },
      {
        label: "The Ending",
        detail:
          "Breakfast at four in the morning in a booth, still dressed, counting what's left.",
      },
    ],
  },
  {
    slug: "new-york",
    name: "NEW YORK, NEW YEAR'S",
    caption: "New York",
    number: "No. 17",
    occasion: "The long dinner",
    tagline: "A rooftop, briefly. A long table, mostly.",
    rows: [
      {
        label: "The Arrival",
        detail:
          "Coats piled on the bed, oysters open on the counter, one drink pressed into every hand.",
      },
      {
        label: "The Moment",
        detail:
          "Twelve minutes on the roof in the cold, then back down before anyone gets sentimental.",
      },
      {
        label: "The Table",
        detail:
          "Oysters, cold roast beef, bread and butter. Champagne, more than seems reasonable.",
      },
      {
        label: "The Ending",
        detail:
          "The last hour with the lights low and side two on, coats still on the bed.",
      },
    ],
  },

  /*
   * The three below are the sporty end of the library — occasions where the
   * day is the thing and dinner is what happens afterwards. They are the first
   * plates whose art arrived finished rather than being drawn in plates.tsx.
   *
   * The taglines follow the house rule and are worth checking against it,
   * because it is the rule these three could most easily break: a place and a
   * time, then two concrete details, and never an adjective naming the
   * feeling. "Bracing", "invigorating" and "adventurous" are exactly the words
   * a sporty destination invites and exactly the ones that would kill it.
   */
  {
    slug: "big-sur",
    name: "BIG SUR, JUNE",
    caption: "Big Sur",
    number: "No. 06",
    occasion: "The getaway",
    tagline: "Fog until noon. Nobody has a signal.",
    rows: [
      {
        label: "The Arrival",
        detail:
          "Everyone parks facing out. Coffee from a thermos on the hood, before anyone has said good morning.",
      },
      {
        label: "The Moment",
        detail:
          "The pull-off past the bridge at the hour the light goes. Someone calls a spout and everyone agrees they saw it.",
      },
      {
        label: "The Table",
        detail:
          "Sourdough, a hard cheese, beer left in the creek. Dinner on the tailgate.",
      },
      {
        label: "The Ending",
        detail:
          "The fire until the fog comes in, which it does, and then the cabin.",
      },
    ],
  },
  {
    slug: "catskills",
    name: "CATSKILLS, LAST WEEK OF CAMP",
    caption: "Catskills",
    number: "No. 09",
    occasion: "The weekend away",
    tagline: "Everyone swims before breakfast. The tent is decorative.",
    rows: [
      {
        label: "The Arrival",
        detail:
          "Bunk assignments on a card, hers included. Bug spray by the door, which is where it stays.",
      },
      {
        label: "The Moment",
        detail:
          "The swim test. Timed, witnessed, and entered in a ledger nobody will ever read again.",
      },
      {
        label: "The Table",
        detail:
          "Corn and foil packets in the coals, drinks in enamel mugs. Marshmallows, without irony.",
      },
      {
        label: "The Ending",
        detail:
          "The dock after dark. Whoever is last up turns off the string lights.",
      },
    ],
  },
  {
    slug: "dolomites",
    name: "DOLOMITES, FIRST SNOW",
    caption: "Dolomites",
    number: "No. 19",
    occasion: "The getaway",
    tagline: "The first gondola at eight. Lunch halfway down.",
    rows: [
      {
        label: "The Arrival",
        detail:
          "Boots by the stove in a row. Something hot poured before the coats come off.",
      },
      {
        label: "The Moment",
        detail:
          "The last car up, taken for the view and not the run. Nobody talks for a minute.",
      },
      {
        label: "The Table",
        detail:
          "One pot on the table, bread and a knife beside it. Grappa afterwards, standing.",
      },
      {
        label: "The Ending",
        detail: "Cards at the long table until the fire goes down.",
      },
    ],
  },
  /*
   * The only plate on this shelf whose destination is written end to end —
   * look, voice, exemplars and all — in src/lib/destinations.ts. It is here
   * for the same reason the other eleven are: this file is the catalogue copy,
   * and a plate needs a caption whether or not a writer has been given a
   * lexicon. The name, the tagline and the occasion are the same words in both
   * files on purpose; if they ever disagree, destinations.ts is the authored
   * one and this is the one that drifted.
   */
  {
    slug: "havana",
    name: "HAVANA, THE SMALL HOURS",
    caption: "Havana",
    number: "No. 15",
    occasion: "The long dinner",
    tagline: "The table is pushed back for the dancing. Supper again at three.",
    rows: [
      {
        label: "The Arrival",
        detail:
          "Nobody is early. The first daiquiri is shaken to order and handed over in the courtyard, where the fan turns and does not help.",
      },
      {
        label: "The Moment",
        detail:
          "The table carried back against the wall between the flan and the coffee. Nobody is asked to help and everybody does.",
      },
      {
        label: "The Table",
        detail:
          "Pork with garlic and citrus since the afternoon, black beans, rice, plantains sweet then green. Coffee small and sweet, at every hour.",
      },
      {
        label: "The Ending",
        detail:
          "The second supper at three: sandwiches pressed flat, coconut ice cream, and the last coffee taken standing up.",
      },
    ],
  },
  {
    slug: "tahiti",
    name: "TAHITI, THE LONG WAY",
    caption: "Tahiti",
    number: "No. 12",
    occasion: "The long dinner",
    tagline: "Torches lit before anyone is hungry. The tide comes to the table.",
    rows: [
      {
        label: "The Arrival",
        detail:
          "Shoes left at the edge of the sand, whether or not anyone said to. Something cold and green, handed over rather than offered.",
      },
      {
        label: "The Moment",
        detail:
          "The torches lit one at a time, by whoever is nearest, in no particular order and with no announcement.",
      },
      {
        label: "The Table",
        detail:
          "Raw fish in lime and coconut, grilled whatever came in, rice, and too much fruit. Rum, and one bottle of something better.",
      },
      {
        label: "The Ending",
        detail:
          "The last people move to the sand and stay there. Nobody clears anything until morning.",
      },
    ],
  },
];

/**
 * The four occasions, in the order the page shows them.
 *
 * These are pictures, not descriptions: concrete nouns, three beats, no feeling
 * named. docs/copy-brief.md keeps them as the pattern every other card on this
 * site has to match, so they are approved text and are not to be reworded.
 */
export type Occasion = {
  /** Matches the icon key in src/app/plates.tsx. */
  slug: string;
  name: string;
  line: string;
};

export const OCCASIONS: readonly Occasion[] = [
  {
    slug: "getaway",
    name: "The getaway",
    line: "A house, a heat wave, and a cast of characters you already know.",
  },
  {
    slug: "weekend-away",
    name: "The weekend away",
    line: "Three days, one house, and a photograph you'll all fight over.",
  },
  {
    slug: "long-dinner",
    name: "The long dinner",
    line: "One table, a rule about the record player, dessert at midnight.",
  },
  {
    slug: "birthday",
    name: "The birthday",
    line: "The good champagne, everyone dressed up, and not a single speech.",
  },
];

/**
 * What arrives. Eleven pieces, shown as a section and never behind a `+`.
 *
 * The deliverables are the argument — they are the difference between a mood
 * board and a night that happens — so The Edit and The Printed Matter sit in
 * the open with the rest rather than at positions nine and ten of an accordion.
 * See docs/copy-brief.md, "Structure".
 */
export type Deliverable = {
  name: string;
  line: string;
};

export const DELIVERABLES: readonly Deliverable[] = [
  { name: "The Look", line: "The palette, the type, the references." },
  {
    name: "The Voice",
    line: "How the invitation reads, what the menu calls things, how it all sounds.",
  },
  {
    name: "The Arrival",
    line: "What's playing, what's in their hand, what they see first.",
  },
  { name: "The Moment", line: "The one they retell. Staged, never announced." },
  {
    name: "The Ending",
    line: "How a night closes on purpose, not by attrition.",
  },
  {
    name: "The Fun",
    line: "Games matched to how these particular people behave.",
  },
  { name: "The Soundtrack", line: "Sequenced for the arc of the night." },
  { name: "The Table", line: "Styling, cocktails, specific enough to shop." },
  { name: "The Edit", line: "A short, opinionated list of things to buy." },
  {
    name: "The Printed Matter",
    line: "Invitations, menus, place cards, game materials.",
  },
  { name: "The Prep", line: "A short list. Not a project plan." },
];

/** The two columns. No header above them, and no thesis line — the lists are
 *  the argument. docs/copy.md is explicit that both were cut. */
export const NOT_THIS: readonly string[] = [
  "A forty-tab Pinterest board",
  "A themed party with a costume rule",
  "A planner with a clipboard and an invoice",
  "A chatbot's list of fifty ideas",
  "A schedule that runs your weekend",
];

export const MORE_THIS: readonly string[] = [
  "One destination, chosen for these people",
  "Details that land like an inside joke",
  "A moment they retell for years",
  "Games your friends will actually play",
  "Everything ready — and still yours to run",
];
