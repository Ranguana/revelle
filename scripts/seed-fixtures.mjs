#!/usr/bin/env node
/**
 * FIXTURES. Not the catalogue.
 *
 *   npm run seed:fixtures
 *
 * ─────────────────────────────────────────────────────────────────────
 * WHAT THIS IS FOR, AND WHAT IT IS NOT
 *
 * The real catalogue is one destination — WESTHAMPTON, 1976 — and no products,
 * no games and no soundtracks at all. That is the honest state of the library
 * and it is the true bottleneck (docs/build-checklist.md says so at the top).
 * It is also not enough to run a selection engine against: with a pool of one,
 * every stage returns the same answer and nothing is tested.
 *
 * So this seeds a plausible catalogue to EXERCISE the engine end to end. Every
 * row it writes has a slug beginning `fixture-`, which is how the engine, the
 * curator's tool and anyone reading a table can tell them apart at a glance —
 * and how `npm run seed:fixtures -- --remove` finds them again.
 *
 * NONE OF THIS IS AUTHORED WORK. The taglines are borrowed from
 * src/lib/library.ts, which is catalogue copy for the landing page; the
 * products and games are invented to have the right SHAPE, not the right
 * words. A real destination is a look and a voice and a page of exemplars —
 * see src/lib/destinations.ts for what that actually costs. Do not let a
 * fixture graduate by accident.
 *
 * It does NOT touch WESTHAMPTON, 1976, and in particular does not publish it:
 * publishing a destination is a curator's decision and a seed script has no
 * standing to make it. It reports what state that destination is in and moves
 * on.
 *
 * ─────────────────────────────────────────────────────────────────────
 * SAFETY
 *
 * Refuses to run against a database whose URL does not look local unless
 * --force is passed. Fixtures in a production catalogue would be worse than no
 * fixtures at all.
 *
 * Same connection rules as scripts/migrate.mjs. Needs DATABASE_URL.
 */
import pg from "pg";

const remove = process.argv.includes("--remove");
const force = process.argv.includes("--force");

/** Kept in sync with the same function in scripts/migrate.mjs and src/lib/db.ts. */
function needsSsl(url) {
  if (/sslmode=disable/.test(url)) return false;
  return !/@(localhost|127\.0\.0\.1|\[::1\])/.test(url);
}

function looksLocal(url) {
  return /@(localhost|127\.0\.0\.1|\[::1\])/.test(url);
}

// ─────────────────────────────────────────────────────────────────────
// THE FIXTURES
// ─────────────────────────────────────────────────────────────────────
//
// Facets are written "dimension:code" throughout. The dimension is not
// decoration: 'beach' is a legitimate environment AND a legitimate mood, and
// db/002 made codes unique per dimension precisely so both can exist.

const COHORTS = [
  {
    slug: "fixture-coastal-restraint",
    name: "Coastal restraint",
    description: "Salt, linen, and nothing shiny. Spends on one good thing.",
    curatorNote:
      "She has been to this beach every summer since she was nine and does " +
      "not want it themed. If it looks like a party, she will leave it in the box.",
    facets: {
      "taste_direction:faded_coastal": 0.95,
      "taste_direction:nordic_quiet": 0.6,
      "taste_direction:tropical_maximal": -0.9,
      "anti_preference:novelty": -1.0,
      "affinity:ease": 0.5,
      "group_fun:swim_late": 0.4,
    },
  },
  {
    slug: "fixture-late-and-loud",
    name: "Late, and not sorry",
    description: "The evening is a build. Nobody is home before three.",
    curatorNote:
      "She books the table for nine knowing it will be eleven. The good " +
      "champagne comes out without a speech attached.",
    facets: {
      "taste_direction:disco_after_dark": 0.9,
      "taste_direction:supper_club": 0.5,
      "group_fun:dance": 0.8,
      "affinity:late": 0.9,
      "taste_direction:nordic_quiet": -0.6,
    },
  },
  {
    slug: "fixture-the-long-table",
    name: "The long table",
    description: "One table, five hours, and an argument about the lemons.",
    curatorNote:
      "The point is the conversation. Anything that interrupts it — a game " +
      "with rules, a photographer, a schedule — is a loss.",
    facets: {
      "taste_direction:old_world_riviera": 0.8,
      "group_fun:long_dinner": 0.9,
      "group_fun:talk_deep": 0.7,
      "group_fun:cook_together": 0.5,
      "affinity:beauty": 0.4,
      "group_fun:compete": -0.4,
    },
  },
];

const DESTINATIONS = [
  {
    slug: "fixture-cote-dazur",
    name: "CÔTE D'AZUR, 1962",
    tagline: "Lunch that never ended. Nobody changed for dinner.",
    description:
      "FIXTURE. Catalogue copy from src/lib/library.ts; no authored voice.",
    tasteDirections: ["old_world_riviera", "faded_coastal"],
    fitsOccasions: ["dinner_party", "girls_weekend", "anniversary"],
    facets: {
      "group_fun:long_dinner": 0.9,
      "group_fun:talk_deep": 0.6,
      "group_fun:cook_together": 0.4,
      "affinity:beauty": 0.7,
      "affinity:ease": 0.5,
      "anti_preference:schedule": -0.6,
      "anti_preference:novelty": -0.7,
    },
    occasionClaims: [],
  },
  {
    slug: "fixture-portofino",
    name: "PORTOFINO, 1961",
    tagline: "The harbour to yourselves. Everything shut but the good place.",
    description:
      "FIXTURE. Catalogue copy from src/lib/library.ts; no authored voice.",
    tasteDirections: ["nordic_quiet", "old_world_riviera"],
    fitsOccasions: ["girls_weekend", "getaway"],
    facets: {
      "group_fun:wander": 0.8,
      "group_fun:talk_deep": 0.7,
      "group_fun:long_dinner": 0.5,
      "affinity:ease": 0.8,
      "affinity:beauty": 0.4,
      "anti_preference:loud": -0.8,
      "anti_preference:forced_fun": -0.7,
    },
    // A destination refusing an occasion. Rare, and this is what it is for.
    occasionClaims: [
      {
        occasion: "birthday",
        fit: "forbidden",
        note:
          "the whole idea is that nothing is happening. A birthday needs a " +
          "beat where someone is marked and this destination will not provide one",
      },
    ],
  },
  {
    slug: "fixture-new-orleans",
    name: "NEW ORLEANS, 1956",
    tagline: "Dinner at nine. Nobody's leaving at eleven.",
    description:
      "FIXTURE. Catalogue copy from src/lib/library.ts; no authored voice.",
    tasteDirections: ["supper_club", "disco_after_dark"],
    fitsOccasions: ["birthday", "no_reason", "holiday"],
    facets: {
      "group_fun:dance": 0.9,
      "group_fun:wander": 0.7,
      "group_fun:perform": 0.6,
      "affinity:late": 0.9,
      "affinity:one_moment": 0.6,
      // The tag that makes it eliminable. A destination built on a room too
      // loud to talk over is not a weak match for a woman who vetoed that —
      // it is disqualified.
      "anti_preference:loud": 0.8,
      "anti_preference:photographed": 0.3,
    },
    occasionClaims: [],
  },
  {
    slug: "fixture-port-clyde",
    name: "PORT CLYDE, AUGUST",
    tagline: "Newspaper on the table. Butter in a saucepan.",
    description:
      "FIXTURE. Catalogue copy from src/lib/library.ts; no authored voice.",
    tasteDirections: ["americana_backyard", "faded_coastal"],
    fitsOccasions: ["girls_weekend", "getaway", "no_reason", "dinner_party"],
    facets: {
      "group_fun:cook_together": 0.9,
      "group_fun:swim_late": 0.7,
      "group_fun:talk_deep": 0.6,
      "affinity:ease": 0.9,
      "affinity:ritual": 0.5,
      "anti_preference:novelty": -0.8,
      "anti_preference:schedule": -0.5,
    },
    occasionClaims: [],
  },
  {
    slug: "fixture-las-vegas",
    name: "LAS VEGAS, 1960",
    tagline: "Everyone dressed up. Nobody in a nightclub queue.",
    description:
      "FIXTURE. Catalogue copy from src/lib/library.ts; no authored voice.",
    tasteDirections: ["deco_hotel", "supper_club"],
    fitsOccasions: ["birthday", "anniversary", "no_reason"],
    facets: {
      "group_fun:dress_up": 0.9,
      "group_fun:compete": 0.7,
      "group_fun:toast": 0.6,
      "affinity:one_moment": 0.8,
      "affinity:wit": 0.5,
      // Dressing for it is the whole idea, which is exactly what "a costume
      // rule" means to somebody who vetoed one.
      "anti_preference:costumes": 0.7,
      "anti_preference:novelty": 0.4,
    },
    occasionClaims: [],
  },
];

/**
 * Products. `slots` and `occasions` are the two eligibility axes from db/009;
 * an empty `occasions` means "any occasion", which is the default and the right
 * default for most objects — a crate of lemons does not care what is being
 * marked.
 *
 * `worlds` is stage 3: a signed affinity, and `false` becomes forbidden.
 */
const PRODUCTS = [
  {
    slug: "fixture-cold-rose-service",
    name: "Cold rosé, poured before anyone sits down",
    description: "Two bottles on ice and the glasses already out.",
    price: 4200,
    slots: ["arrival_drink", "edit_item"],
    occasions: [],
    facets: {
      "taste_direction:old_world_riviera": 0.9,
      "taste_direction:faded_coastal": 0.4,
      "affinity:ease": 0.3,
    },
    worlds: {
      "fixture-cote-dazur": 0.6,
      "fixture-portofino": 0.4,
      "fixture-las-vegas": -0.5,
    },
  },
  {
    slug: "fixture-sazerac-kit",
    name: "Sazeracs, made badly and enthusiastically",
    description: "Rye, absinthe, the bitters, and no jigger.",
    price: 6800,
    slots: ["arrival_drink", "edit_item"],
    occasions: [],
    facets: {
      "taste_direction:supper_club": 0.8,
      "taste_direction:disco_after_dark": 0.3,
      "affinity:late": 0.4,
    },
    worlds: { "fixture-new-orleans": 0.9, "fixture-port-clyde": -0.6 },
  },
  {
    slug: "fixture-martini-trolley",
    name: "The martini trolley",
    description: "Wheeled in at seven whether or not anyone asked.",
    price: 18500,
    slots: ["arrival_drink", "table_object"],
    occasions: [],
    facets: {
      "taste_direction:deco_hotel": 0.9,
      "taste_direction:supper_club": 0.6,
      "group_fun:dress_up": 0.4,
    },
    worlds: { "fixture-las-vegas": 0.9, "fixture-port-clyde": false },
  },
  {
    slug: "fixture-beer-bucket",
    name: "Beer in a bucket of ice on the porch",
    description: "The bucket is the point. Nobody is offered anything.",
    price: 3400,
    slots: ["arrival_drink", "edit_item"],
    occasions: [],
    facets: {
      "taste_direction:americana_backyard": 0.9,
      "affinity:ease": 0.6,
      "taste_direction:faded_coastal": 0.3,
    },
    worlds: { "fixture-port-clyde": 0.9, "fixture-las-vegas": -0.8 },
  },
  {
    slug: "fixture-negroni-batch",
    name: "A batch negroni, made the day before",
    description: "One bottle, one measure, poured over a big cube.",
    price: 5600,
    slots: ["arrival_drink", "edit_item"],
    occasions: [],
    facets: {
      "taste_direction:old_world_riviera": 0.6,
      "taste_direction:supper_club": 0.5,
      "affinity:ease": 0.7,
      "anti_preference:prep_marathon": -0.5,
    },
    worlds: {},
  },
  {
    slug: "fixture-vermouth-tray",
    name: "Vermouth, ice, one lemon",
    description: "A tray with three things on it and nothing else.",
    price: 3900,
    slots: ["arrival_drink"],
    occasions: [],
    facets: {
      "taste_direction:nordic_quiet": 0.8,
      "affinity:ease": 0.5,
      "affinity:beauty": 0.3,
    },
    worlds: { "fixture-portofino": 0.7 },
  },
  {
    slug: "fixture-linen-house-set",
    name: "Linen, folded on the bed, with a note",
    description: "Enough for every room, and one spare set nobody mentions.",
    price: 21000,
    slots: ["arrival_welcome"],
    occasions: [
      { occasion: "girls_weekend", fit: "native" },
      { occasion: "getaway", fit: "native" },
      { occasion: "bridal", fit: "native" },
    ],
    facets: {
      "taste_direction:faded_coastal": 0.8,
      "taste_direction:nordic_quiet": 0.5,
      "affinity:ease": 0.6,
    },
    worlds: { "fixture-port-clyde": 0.5, "fixture-portofino": 0.5 },
  },
  {
    slug: "fixture-market-basket",
    name: "A basket, filled before anyone arrives",
    description: "Bread, salt, tomatoes, and the good oil.",
    price: 9500,
    slots: ["arrival_welcome", "edit_item"],
    occasions: [
      { occasion: "girls_weekend", fit: "native" },
      { occasion: "getaway", fit: "native" },
      { occasion: "bridal", fit: "native" },
    ],
    facets: {
      "taste_direction:old_world_riviera": 0.7,
      "group_fun:cook_together": 0.6,
      "affinity:ease": 0.8,
    },
    worlds: { "fixture-cote-dazur": 0.6, "fixture-portofino": 0.6 },
  },
  {
    slug: "fixture-house-robes",
    name: "Robes, one per room",
    description: "Heavy, unbranded, and never returned.",
    price: 32000,
    slots: ["arrival_welcome"],
    occasions: [
      { occasion: "girls_weekend", fit: "native" },
      { occasion: "bridal", fit: "native" },
      { occasion: "getaway", fit: "native" },
    ],
    facets: {
      "taste_direction:deco_hotel": 0.7,
      "affinity:beauty": 0.5,
      "affinity:ease": 0.4,
    },
    worlds: { "fixture-las-vegas": 0.6 },
  },
  {
    slug: "fixture-lemon-centrepiece",
    name: "A crate of lemons, and nothing else",
    description: "Unarranged. It is a crate.",
    price: 5200,
    slots: ["table_object", "edit_item"],
    occasions: [],
    facets: {
      "taste_direction:old_world_riviera": 0.9,
      "affinity:beauty": 0.6,
      "taste_direction:faded_coastal": 0.3,
    },
    worlds: { "fixture-cote-dazur": 0.8, "fixture-portofino": 0.5 },
  },
  {
    slug: "fixture-hurricane-lamps",
    name: "Hurricane lamps, four of them",
    description: "Lit at seven and left alone.",
    price: 14800,
    slots: ["table_object", "edit_item"],
    occasions: [],
    facets: {
      "taste_direction:faded_coastal": 0.7,
      "taste_direction:english_country": 0.4,
      "affinity:beauty": 0.5,
    },
    worlds: {},
  },
  {
    slug: "fixture-brass-candelabra",
    name: "Brass, marble, one candelabra",
    description: "Too heavy to move once it is down.",
    price: 27500,
    slots: ["table_object", "edit_item"],
    occasions: [],
    facets: {
      "taste_direction:deco_hotel": 0.9,
      "taste_direction:supper_club": 0.5,
      "affinity:beauty": 0.7,
    },
    worlds: { "fixture-las-vegas": 0.8, "fixture-port-clyde": -0.7 },
  },
  {
    slug: "fixture-newspaper-cloth",
    name: "Newspaper on the table, butter in a saucepan",
    description: "The cloth is yesterday's paper. This is not a shortcut.",
    price: 1800,
    slots: ["table_object", "edit_item"],
    occasions: [],
    facets: {
      "taste_direction:americana_backyard": 0.9,
      "affinity:ease": 0.7,
      "group_fun:cook_together": 0.5,
    },
    worlds: { "fixture-port-clyde": 0.9, "fixture-las-vegas": false },
  },
  {
    slug: "fixture-single-stem",
    name: "One perfect thing on the table",
    description: "A single stem in a glass, replaced daily.",
    price: 3200,
    slots: ["table_object"],
    occasions: [],
    facets: {
      "taste_direction:nordic_quiet": 0.95,
      "affinity:beauty": 0.6,
      "affinity:ease": 0.3,
    },
    worlds: { "fixture-portofino": 0.7 },
  },
  {
    slug: "fixture-mirror-tiles",
    name: "Mirror down the middle of the table",
    description: "Everything doubles, including the candles.",
    price: 8900,
    slots: ["table_object", "edit_item"],
    occasions: [],
    facets: {
      "taste_direction:disco_after_dark": 0.9,
      "affinity:beauty": 0.4,
      // The tag that gets it vetoed by anyone who said no novelty props.
      "anti_preference:novelty": 0.5,
    },
    worlds: { "fixture-new-orleans": 0.7 },
  },
  {
    slug: "fixture-matchbooks",
    name: "Matchbooks, printed with the house rule",
    description: "One rule, four words, and it is about the record player.",
    price: 450,
    slots: ["favour", "edit_item"],
    occasions: [],
    facets: { "affinity:wit": 0.8, "taste_direction:supper_club": 0.3 },
    worlds: {},
  },
  {
    slug: "fixture-cotton-napkin",
    name: "One napkin each, monogrammed",
    description: "Not with her initials. With the weekend's.",
    price: 2200,
    slots: ["favour"],
    occasions: [],
    facets: {
      "taste_direction:english_country": 0.6,
      "affinity:beauty": 0.5,
      "affinity:ritual": 0.4,
    },
    worlds: {},
  },
  {
    slug: "fixture-tiny-bottle",
    name: "A small bottle of the house drink",
    description: "Corked, labelled by hand, sent home in a coat pocket.",
    price: 1600,
    slots: ["favour", "edit_item"],
    occasions: [],
    facets: { "taste_direction:supper_club": 0.5, "affinity:wit": 0.4 },
    worlds: {},
  },
  {
    // Expensive on purpose. A catalogue where nothing costs anything never
    // exercises the running budget constraint, and a budget constraint that has
    // never bound in a test is a budget constraint nobody has tested.
    slug: "fixture-coupe-glasses",
    name: "Coupe glasses, set of twelve",
    description: "Thin, cold, and two will not survive the weekend.",
    price: 34000,
    slots: ["edit_item", "table_object"],
    occasions: [],
    facets: {
      "taste_direction:deco_hotel": 0.8,
      "taste_direction:supper_club": 0.6,
      "affinity:beauty": 0.5,
    },
    worlds: { "fixture-las-vegas": 0.7, "fixture-port-clyde": -0.6 },
  },
  {
    slug: "fixture-monogrammed-coasters",
    name: "Coasters, monogrammed with the wrong initials",
    description: "Nobody notices until the third drink.",
    price: 1800,
    slots: ["favour", "edit_item"],
    occasions: [],
    facets: {
      "affinity:wit": 0.7,
      "taste_direction:deco_hotel": 0.4,
      "affinity:beauty": 0.3,
    },
    worlds: {},
  },
  {
    slug: "fixture-ice-bucket",
    name: "The ice, which is the standing problem",
    description: "A bucket large enough that it stops being one.",
    price: 24000,
    slots: ["edit_item", "table_object"],
    occasions: [],
    facets: {
      "taste_direction:deco_hotel": 0.5,
      "affinity:wit": 0.6,
      "affinity:ease": 0.5,
    },
    worlds: {},
  },
  {
    slug: "fixture-record-crate",
    name: "A crate of records, and the rule about them",
    description: "Forty sides, in an order somebody will argue with.",
    price: 12000,
    slots: ["edit_item"],
    occasions: [],
    facets: {
      "taste_direction:disco_after_dark": 0.5,
      "taste_direction:supper_club": 0.4,
      "affinity:wit": 0.7,
    },
    worlds: {},
  },
  {
    slug: "fixture-striped-umbrella",
    name: "A striped umbrella somebody will move",
    description: "And will not say who.",
    price: 19500,
    slots: ["edit_item"],
    occasions: [],
    facets: {
      "taste_direction:old_world_riviera": 0.7,
      "taste_direction:faded_coastal": 0.5,
      "affinity:beauty": 0.3,
    },
    worlds: { "fixture-cote-dazur": 0.7 },
  },
  {
    slug: "fixture-paper-plates",
    name: "Paper plates, on purpose",
    description: "The good kind, which still cost nothing.",
    price: 900,
    slots: ["edit_item"],
    occasions: [],
    facets: {
      "taste_direction:americana_backyard": 0.8,
      "affinity:ease": 0.9,
    },
    worlds: { "fixture-las-vegas": -0.9 },
  },
  {
    slug: "fixture-swim-towels",
    name: "The good towels, which go to the beach",
    description: "A decision the house stands by.",
    price: 8800,
    slots: ["edit_item", "arrival_welcome"],
    occasions: [],
    facets: {
      "taste_direction:faded_coastal": 0.8,
      "group_fun:swim_late": 0.6,
      "affinity:ease": 0.4,
    },
    worlds: {},
  },
  {
    slug: "fixture-place-cards",
    name: "Place cards, one per seat",
    description: "Each one says where, and one says why.",
    price: 300,
    slots: ["favour", "edit_item"],
    occasions: [],
    facets: {
      "affinity:wit": 0.6,
      "group_fun:long_dinner": 0.5,
      "affinity:ritual": 0.3,
    },
    worlds: {},
  },
];

/**
 * Games and rituals. This pool fills four different slots — honouring, the
 * moment, the fun, and per-day material — which is exactly why the slot axis
 * exists: without it a toast written to mark somebody could be placed as
 * day-two material and nothing would object.
 */
const GAMES = [
  {
    slug: "fixture-toast-in-absentia",
    name: "The toast nobody asked for",
    howItWorks:
      "Somebody who was not warned gives it. The house decides who, and " +
      "tells them four minutes beforehand.",
    price: null,
    minGuests: 4,
    maxGuests: null,
    slots: ["honouring"],
    occasions: [
      { occasion: "birthday", fit: "native" },
      { occasion: "anniversary", fit: "native" },
    ],
    facets: {
      "group_fun:toast": 0.9,
      "affinity:wit": 0.6,
      "affinity:one_moment": 0.5,
    },
    worlds: {},
  },
  {
    slug: "fixture-year-in-nine-objects",
    name: "Nine objects, one year",
    howItWorks:
      "Everyone brings one object from the year. They go on the table in " +
      "the order they happened, and nobody explains theirs.",
    price: 2400,
    minGuests: 3,
    maxGuests: 16,
    slots: ["honouring"],
    occasions: [
      { occasion: "birthday", fit: "native" },
      { occasion: "anniversary", fit: "native" },
      { occasion: "bridal", fit: "native" },
    ],
    facets: {
      "affinity:ritual": 0.8,
      "group_fun:talk_deep": 0.6,
      "affinity:one_moment": 0.7,
    },
    worlds: {},
  },
  {
    slug: "fixture-letters-read-aloud",
    name: "Letters, read aloud, badly",
    howItWorks:
      "Collected in advance, read by the wrong people, in no order.",
    // Deliberately unpriced. A curator has not costed the printing, and the
    // engine says so rather than inventing a number.
    price: null,
    minGuests: 4,
    maxGuests: 30,
    slots: ["honouring"],
    occasions: [
      { occasion: "birthday", fit: "native" },
      { occasion: "bridal", fit: "native" },
      { occasion: "anniversary", fit: "native" },
    ],
    facets: {
      "group_fun:talk_deep": 0.7,
      "group_fun:perform": 0.5,
      "affinity:ritual": 0.6,
    },
    worlds: {},
  },
  {
    slug: "fixture-parasol-photograph",
    name: "The staged photograph under the parasol",
    howItWorks:
      "Golden hour, one frame, everyone claims it was their idea.",
    price: 4800,
    minGuests: 4,
    maxGuests: 20,
    slots: ["the_moment"],
    occasions: [],
    facets: {
      "affinity:beauty": 0.8,
      "affinity:one_moment": 0.9,
      "anti_preference:photographed": 0.5,
    },
    worlds: { "fixture-cote-dazur": 0.6 },
  },
  {
    slug: "fixture-second-wind",
    name: "The second wind, engineered",
    howItWorks:
      "Coffee and something fried at midnight, then back out.",
    price: 3200,
    minGuests: 4,
    maxGuests: null,
    slots: ["the_moment"],
    occasions: [],
    facets: {
      "affinity:late": 0.9,
      "affinity:one_moment": 0.7,
      "group_fun:dance": 0.4,
    },
    worlds: { "fixture-new-orleans": 0.8 },
  },
  {
    slug: "fixture-twelve-minutes-on-the-roof",
    name: "Twelve minutes on the roof",
    howItWorks:
      "In the cold, then back down before anyone gets sentimental.",
    price: null,
    minGuests: 2,
    maxGuests: 24,
    slots: ["the_moment"],
    occasions: [
      {
        occasion: "getaway",
        fit: "forbidden",
        note: "a getaway is not somewhere with a roof you can stand on",
      },
    ],
    facets: { "affinity:one_moment": 0.8, "affinity:wit": 0.5 },
    worlds: {},
  },
  {
    slug: "fixture-name-a-houseguest",
    name: "Everyone names a houseguest",
    howItWorks:
      "Nobody names themselves. The house keeps score and will not show it.",
    price: null,
    minGuests: 4,
    maxGuests: 14,
    slots: ["game", "day_material"],
    occasions: [],
    facets: {
      "affinity:wit": 0.9,
      "group_fun:compete": 0.5,
      "group_fun:talk_deep": 0.3,
    },
    worlds: {},
  },
  {
    slug: "fixture-the-fixed-stake",
    name: "One table, one game, a fixed stake",
    howItWorks:
      "Agreed in advance, so the night cannot get away from anybody.",
    price: 4500,
    minGuests: 4,
    maxGuests: 10,
    slots: ["game"],
    occasions: [],
    facets: {
      "group_fun:compete": 0.9,
      "taste_direction:deco_hotel": 0.4,
      "affinity:wit": 0.3,
    },
    worlds: { "fixture-las-vegas": 0.9 },
  },
  {
    slug: "fixture-sing-badly-on-purpose",
    name: "Sing, badly, on purpose",
    howItWorks: "One song each. The rule is that nobody is good.",
    price: 1200,
    minGuests: 4,
    maxGuests: null,
    slots: ["game"],
    occasions: [],
    facets: {
      "group_fun:perform": 0.9,
      "group_fun:dance": 0.5,
      // Vetoed by anyone who said music too loud to talk over.
      "anti_preference:loud": 0.6,
    },
    worlds: { "fixture-new-orleans": 0.7 },
  },
  {
    slug: "fixture-the-long-argument",
    name: "The right way to eat a lobster",
    howItWorks:
      "Nobody wins. Somebody's mother is invoked within four minutes.",
    price: null,
    minGuests: 3,
    maxGuests: 20,
    slots: ["game", "day_material"],
    occasions: [],
    facets: {
      "group_fun:cook_together": 0.8,
      "taste_direction:americana_backyard": 0.6,
      "group_fun:talk_deep": 0.5,
    },
    worlds: { "fixture-port-clyde": 0.9 },
  },
  {
    slug: "fixture-cards-on-the-terrace",
    name: "Cards on the terrace",
    howItWorks:
      "The record player rule is in force. Lights out when the music stops.",
    price: 1800,
    minGuests: 2,
    maxGuests: 8,
    slots: ["game", "day_material"],
    occasions: [],
    facets: {
      "group_fun:compete": 0.6,
      "group_fun:talk_deep": 0.5,
      "affinity:late": 0.4,
    },
    worlds: {},
  },
  {
    slug: "fixture-morning-swim",
    name: "A swim before six, nobody greeted formally",
    howItWorks: "It is not announced. It just happens, and some people go.",
    price: null,
    minGuests: 2,
    maxGuests: null,
    slots: ["day_material"],
    occasions: [
      { occasion: "girls_weekend", fit: "native" },
      { occasion: "getaway", fit: "native" },
      { occasion: "bridal", fit: "native" },
    ],
    facets: {
      "group_fun:swim_late": 0.5,
      "affinity:ease": 0.8,
      "taste_direction:faded_coastal": 0.6,
    },
    worlds: {},
  },
  {
    slug: "fixture-the-walk-back",
    name: "The walk back in the dark, in order",
    howItWorks:
      "In whatever order the group naturally falls into. Nobody arranges it.",
    price: null,
    minGuests: 3,
    maxGuests: null,
    slots: ["day_material", "the_moment"],
    occasions: [],
    facets: { "group_fun:wander": 0.8, "group_fun:talk_deep": 0.6 },
    worlds: { "fixture-portofino": 0.8 },
  },
  {
    slug: "fixture-market-morning",
    name: "The market, and whoever speaks the least Italian",
    howItWorks: "They order for the table. There is no appeal.",
    price: 6500,
    minGuests: 2,
    maxGuests: 12,
    slots: ["day_material"],
    occasions: [],
    facets: {
      "taste_direction:old_world_riviera": 0.8,
      "group_fun:cook_together": 0.6,
      "group_fun:wander": 0.4,
    },
    worlds: { "fixture-portofino": 0.7, "fixture-cote-dazur": 0.6 },
  },
  {
    slug: "fixture-nothing-planned",
    name: "An afternoon with nothing in it",
    howItWorks:
      "Written into the plan so that nobody fills it. That is the whole device.",
    price: null,
    minGuests: 1,
    maxGuests: null,
    slots: ["day_material"],
    occasions: [],
    facets: {
      "affinity:ease": 0.95,
      "anti_preference:schedule": -0.8,
      "group_fun:talk_deep": 0.4,
    },
    worlds: {},
  },
];

const TRACKLISTS = [
  {
    slug: "fixture-the-long-lunch",
    name: "THE LONG LUNCH",
    description: "Four hours that were meant to be two.",
    world: "fixture-cote-dazur",
    facets: {
      "taste_direction:old_world_riviera": 0.9,
      "group_fun:long_dinner": 0.7,
      "affinity:ease": 0.4,
    },
    tracks: [
      ["arrival", "Françoise Hardy", "Le temps de l'amour"],
      ["dinner", "Stan Getz", "Corcovado"],
      ["moment", "Nina Simone", "Feeling Good"],
      ["late", "Serge Gainsbourg", "Requiem pour un con"],
      ["ending", "Chet Baker", "But Not for Me"],
    ],
  },
  {
    slug: "fixture-three-am",
    name: "THREE A.M.",
    description: "The build, and what happens after the build.",
    world: "fixture-new-orleans",
    facets: {
      "taste_direction:disco_after_dark": 0.9,
      "affinity:late": 0.9,
      "group_fun:dance": 0.8,
    },
    tracks: [
      ["arrival", "Dr. John", "Right Place Wrong Time"],
      ["dinner", "Allen Toussaint", "Southern Nights"],
      ["moment", "Chic", "I Want Your Love"],
      ["late", "Sister Sledge", "Lost in Music"],
      ["ending", "Bill Withers", "Grandma's Hands"],
    ],
  },
  {
    slug: "fixture-the-house-set",
    name: "THE HOUSE SET",
    description: "Suits more than one destination. Deliberately unscoped.",
    world: null,
    facets: {
      "taste_direction:faded_coastal": 0.6,
      "affinity:ease": 0.5,
      "group_fun:talk_deep": 0.3,
    },
    tracks: [
      ["arrival", "Bobbie Gentry", "Mornin' Glory"],
      ["dinner", "Astrud Gilberto", "Água de Beber"],
      ["moment", "Roberta Flack", "Feel Like Makin' Love"],
      ["late", "Curtis Mayfield", "Move On Up"],
      ["ending", "Judee Sill", "The Kiss"],
    ],
  },
  {
    slug: "fixture-brass-and-marble",
    name: "BRASS AND MARBLE",
    description: "A bar that knows the order.",
    world: "fixture-las-vegas",
    facets: {
      "taste_direction:deco_hotel": 0.9,
      "taste_direction:supper_club": 0.7,
      "group_fun:dress_up": 0.5,
    },
    tracks: [
      ["arrival", "Nancy Wilson", "You've Got Your Troubles"],
      ["dinner", "Antônio Carlos Jobim", "Wave"],
      ["moment", "Shirley Bassey", "Something"],
      ["late", "Sammy Davis Jr.", "I've Gotta Be Me"],
      ["ending", "Peggy Lee", "Is That All There Is?"],
    ],
  },
  {
    slug: "fixture-porch-and-dock",
    name: "PORCH AND DOCK",
    description: "Sweaters by eight, whatever the forecast said.",
    world: "fixture-port-clyde",
    facets: {
      "taste_direction:americana_backyard": 0.8,
      "taste_direction:faded_coastal": 0.5,
      "affinity:ease": 0.6,
    },
    tracks: [
      ["arrival", "John Prine", "Illegal Smile"],
      ["dinner", "Emmylou Harris", "Boulder to Birmingham"],
      ["moment", "The Band", "It Makes No Difference"],
      ["late", "Little Feat", "Willin'"],
      ["ending", "Bonnie Raitt", "Guilty"],
    ],
  },
];

/**
 * Four applications, chosen to hit four different corners of the engine:
 *
 *   nora   a long dinner, two vetoes that eliminate two destinations, a
 *          comfortable budget
 *   bea    a birthday on a genuinely tight per-head budget — the case where
 *          something has to be dropped
 *   iris   a weekend away with an OPEN-TOPPED spend band, so there is no
 *          ceiling to check against and the curator has to price it
 *   vale   a getaway for two who said "not sure yet" — every scale number is
 *          null, the group is tiny, and one of her taste directions has no
 *          destination at all
 */
const APPLICATIONS = [
  {
    key: "nora",
    email: "fixture-nora@example.invalid",
    name: "Nora (fixture)",
    occasion: "dinner_party",
    environment: "my_home",
    tasteDirections: ["old_world_riviera", "nordic_quiet"],
    groupFun: ["long_dinner", "talk_deep"],
    antiPreferences: ["novelty", "loud"],
    affinities: ["beauty", "ease"],
    guests: "from_9_to_12",
    spend: "from_150_to_300",
    music: "spotify",
    foodPlan: "sit_down",
    playAppetite: "one_thing",
    howMade: "actually_made",
    secret:
      "Her sister will bring a guitar. Nobody has told her not to bring the guitar.",
    cohorts: { "fixture-the-long-table": 0.7, "fixture-coastal-restraint": 0.3 },
    // A curator's note from a phone call, recorded as a signal. It is not a
    // veto — the engine does not promote a preference to a veto — so it shows
    // up as a soft negative at a fifth of the weight.
    signals: [
      {
        facet: "taste_direction:disco_after_dark",
        polarity: "negative",
        strength: 0.8,
        note: "Said she has had enough of anything with a mirror ball in it.",
      },
    ],
  },
  {
    key: "bea",
    email: "fixture-bea@example.invalid",
    name: "Bea (fixture)",
    occasion: "birthday",
    environment: "rented_house",
    tasteDirections: ["deco_hotel", "supper_club"],
    groupFun: ["dress_up", "compete", "toast"],
    antiPreferences: ["kids_party", "forced_fun"],
    affinities: ["one_moment", "wit"],
    guests: "from_13_to_20",
    spend: "under_75",
    music: "apple_music",
    // Under $75 a head AND everything arriving finished — the pair that proves
    // the two axes are independent. She is not spending much and she is not
    // cooking either, and neither answer implies the other.
    foodPlan: "standing",
    playAppetite: "the_point",
    howMade: "bought_and_arranged",
    secret:
      "It is her fortieth and she has told exactly two people. The other eleven think it is a Tuesday.",
    cohorts: { "fixture-late-and-loud": 0.6, "fixture-the-long-table": 0.4 },
    signals: [],
  },
  {
    key: "iris",
    email: "fixture-iris@example.invalid",
    name: "Iris (fixture)",
    occasion: "girls_weekend",
    environment: "beach",
    tasteDirections: ["faded_coastal", "americana_backyard"],
    groupFun: ["swim_late", "cook_together", "wander"],
    antiPreferences: ["schedule", "photographed"],
    affinities: ["ease", "ritual"],
    guests: "from_6_to_8",
    spend: "over_600",
    music: "print",
    // The other half of that pair: over $600 a head and making it herself.
    foodPlan: "sit_down",
    playAppetite: "underneath",
    howMade: "actually_made",
    secret:
      "Two of them have not spoken since March. Both are coming and neither knows the other is.",
    cohorts: { "fixture-coastal-restraint": 0.8 },
    signals: [
      {
        facet: "taste_direction:faded_coastal",
        polarity: "positive",
        strength: 1.0,
        note: "Kept the linen from the last one. Said so twice.",
      },
    ],
  },
  {
    key: "vale",
    email: "fixture-vale@example.invalid",
    name: "Vale (fixture)",
    occasion: "getaway",
    environment: "mountains",
    tasteDirections: ["nordic_quiet", "desert_modern"],
    groupFun: ["talk_deep", "wander"],
    antiPreferences: ["novelty", "loud", "forced_fun"],
    affinities: ["ease"],
    guests: "two",
    spend: "not_sure",
    music: "print",
    // Both opt-outs, in one fixture. Dinner is booked somewhere else and
    // nothing is organised: her plan has no menu and no games, neither is a
    // gap, and neither reaches the desk's list.
    foodPlan: "eating_out",
    playAppetite: "none",
    howMade: "bought_and_arranged",
    secret: "",
    cohorts: { "fixture-coastal-restraint": 0.5 },
    signals: [],
  },
];

// ─────────────────────────────────────────────────────────────────────

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("[seed-fixtures] DATABASE_URL is not set.");
  process.exit(1);
}

if (!looksLocal(url) && !force) {
  console.error(
    "[seed-fixtures] REFUSING: DATABASE_URL does not look local.\n" +
      "  Fixtures in a real catalogue are worse than no fixtures. Pass --force " +
      "if you genuinely mean it."
  );
  process.exit(1);
}

const client = new pg.Client({
  connectionString: url,
  ssl: needsSsl(url) ? { rejectUnauthorized: false } : undefined,
  application_name: "revelle-seed-fixtures",
});

await client.connect();

const facetIds = new Map();

async function loadFacetIds() {
  const { rows } = await client.query(
    `select id, dimension_code, code from facet`
  );
  for (const row of rows) facetIds.set(`${row.dimension_code}:${row.code}`, row.id);
}

function facet(key) {
  const id = facetIds.get(key);
  if (!id) throw new Error(`No facet ${key} — check the dimension prefix.`);
  return id;
}

async function tag(joinTable, column, entityId, facets, note) {
  for (const [key, weight] of Object.entries(facets)) {
    await client.query(
      `insert into ${joinTable} (${column}, facet_id, weight, provenance, note)
       values ($1, $2, $3, 'curator', $4)
       on conflict (${column}, facet_id) do update set weight = excluded.weight`,
      [entityId, facet(key), weight, note]
    );
  }
}

async function claimOccasions(table, column, entityId, claims) {
  for (const claim of claims) {
    await client.query(
      `insert into ${table} (${column}, occasion, fit, note)
       values ($1, $2, $3, $4)
       on conflict (${column}, occasion) do update
         set fit = excluded.fit, note = excluded.note`,
      [entityId, claim.occasion, claim.fit, claim.note ?? null]
    );
  }
}

async function claimSlots(table, column, entityId, slots) {
  for (const slot of slots) {
    await client.query(
      `insert into ${table} (${column}, slot_code, fit)
       values ($1, $2, 'native')
       on conflict (${column}, slot_code) do nothing`,
      [entityId, slot]
    );
  }
}

async function scopeWorlds(table, column, entityId, worlds, worldIds) {
  for (const [slug, value] of Object.entries(worlds)) {
    const worldId = worldIds.get(slug);
    if (!worldId) throw new Error(`No world ${slug}`);
    const forbidden = value === false;
    await client.query(
      `insert into ${table} (${column}, world_id, forbidden, affinity, note)
       values ($1, $2, $3, $4, 'FIXTURE')
       on conflict (${column}, world_id) do update
         set forbidden = excluded.forbidden, affinity = excluded.affinity`,
      [entityId, worldId, forbidden, forbidden ? 0 : value]
    );
  }
}

/**
 * Take the fixtures back out.
 *
 * ── WHY THE CUSTOMERS STAY ──────────────────────────────────────────
 *
 * `quiz_response` is append-only and the database means it: the guard in
 * db/001 refuses a delete outright, and `customer` cascades into it — so
 * `delete from customer` fails with "row may not be deleted. Set status =
 * 'archived'." That is not an obstacle to work around, it is the schema
 * enforcing the property the taste profile is rebuilt from, and a seed script
 * is exactly the wrong place to be the first caller that argues with it.
 *
 * So the CATALOGUE fixtures are deleted and the fixture APPLICATIONS are
 * archived, which is what the guard's own error message tells you to do. Four
 * archived rows against `fixture-…@example.invalid` are visibly fixtures and
 * harm nothing.
 *
 * Revelles must go first: a delivered one holds its ingredients by `restrict`,
 * which correctly refuses to let a fixture product be deleted out from under
 * an assemblage somebody was given.
 */
async function removeFixtures() {
  const counts = {};
  for (const [label, sql] of [
    ["revelle", `delete from revelle r using customer c
                  where c.id = r.customer_id and c.email like 'fixture-%'`],
    ["quiz_response archived", `update quiz_response set status = 'archived'
                        where status <> 'archived'
                          and customer_id in
                            (select id from customer where email like 'fixture-%')`],
    ["game", `delete from game where slug like 'fixture-%'`],
    ["product", `delete from product where slug like 'fixture-%'`],
    ["tracklist", `delete from tracklist where slug like 'fixture-%'`],
    ["world", `delete from world where slug like 'fixture-%'`],
    // Before the cohorts themselves: customer_cohort_affinity holds them by
    // `restrict`, and the fixture customers are staying. Scoped to source =
    // 'quiz' because that is the layer this script wrote — the same discipline
    // db/002 demands of a recompute, and the reason the curator-protect trigger
    // never fires here.
    ["cohort_affinity", `delete from customer_cohort_affinity
                          where source = 'quiz'
                            and customer_id in
                              (select id from customer where email like 'fixture-%')`],
    ["taste_cohort", `delete from taste_cohort where slug like 'fixture-%'`],
  ]) {
    const result = await client.query(sql);
    counts[label] = result.rowCount;
  }
  console.log("[seed-fixtures] removed", counts);
  console.log(
    "[seed-fixtures] fixture customers and their applications were ARCHIVED, " +
      "not deleted — quiz_response is append-only and the database says so."
  );
}

try {
  await client.query("begin");
  await loadFacetIds();

  if (remove) {
    await removeFixtures();
    await client.query("commit");
    await client.end();
    process.exit(0);
  }

  // ── cohorts ────────────────────────────────────────────────────────
  const cohortIds = new Map();
  for (const cohort of COHORTS) {
    const { rows } = await client.query(
      `insert into taste_cohort
         (slug, name, description, curator_note, status, activated_at, created_by)
       values ($1, $2, $3, $4, 'active', now(), 'fixture')
       on conflict (slug) do update set name = excluded.name
       returning id`,
      [cohort.slug, cohort.name, cohort.description, cohort.curatorNote]
    );
    cohortIds.set(cohort.slug, rows[0].id);
    await tag(
      "taste_cohort_facet",
      "taste_cohort_id",
      rows[0].id,
      cohort.facets,
      "FIXTURE"
    );
  }
  console.log(`[seed-fixtures] cohorts      ${cohortIds.size}`);

  // ── destinations ───────────────────────────────────────────────────
  const worldIds = new Map();
  for (const destination of DESTINATIONS) {
    const { rows } = await client.query(
      `insert into world
         (slug, name, tagline, description, taste_directions, fits_occasions,
          notes, status, published_at)
       values ($1, $2, $3, $4, $5, $6::occasion_type[],
               'FIXTURE — scripts/seed-fixtures.mjs. Not authored work.',
               'published', now())
       on conflict (slug) do update
         set taste_directions = excluded.taste_directions,
             fits_occasions   = excluded.fits_occasions
       returning id`,
      [
        destination.slug,
        destination.name,
        destination.tagline,
        destination.description,
        destination.tasteDirections,
        destination.fitsOccasions,
      ]
    );
    worldIds.set(destination.slug, rows[0].id);
    await tag("world_facet", "world_id", rows[0].id, destination.facets, "FIXTURE");
    await claimOccasions(
      "world_occasion",
      "world_id",
      rows[0].id,
      destination.occasionClaims
    );
  }
  console.log(`[seed-fixtures] worlds       ${worldIds.size} (published)`);

  const { rows: westhampton } = await client.query(
    `select slug, status from world where slug = 'westhampton-1976'`
  );
  console.log(
    westhampton.length === 0
      ? `[seed-fixtures] WESTHAMPTON, 1976 is not in this database. Run ` +
          `npm run seed:destinations first if you want it.`
      : `[seed-fixtures] WESTHAMPTON, 1976 is '${westhampton[0].status}' and was ` +
          `NOT touched. The engine only considers published destinations; ` +
          `publishing one is a curator's decision.`
  );

  // ── products ───────────────────────────────────────────────────────
  for (const product of PRODUCTS) {
    const { rows } = await client.query(
      `insert into product
         (slug, name, description, price_cents, source_note, status)
       values ($1, $2, $3, $4, 'FIXTURE — scripts/seed-fixtures.mjs', 'active')
       on conflict (slug) do update set price_cents = excluded.price_cents
       returning id`,
      [product.slug, product.name, product.description, product.price]
    );
    const id = rows[0].id;
    await tag("product_facet", "product_id", id, product.facets, "FIXTURE");
    await claimOccasions("product_occasion", "product_id", id, product.occasions);
    await claimSlots("product_slot", "product_id", id, product.slots);
    await scopeWorlds("product_world", "product_id", id, product.worlds, worldIds);
  }
  console.log(`[seed-fixtures] products     ${PRODUCTS.length}`);

  // ── games ──────────────────────────────────────────────────────────
  for (const game of GAMES) {
    const { rows } = await client.query(
      `insert into game
         (slug, name, description, how_it_works, price_cents,
          min_guests, max_guests, notes, status)
       values ($1, $2, '', $3, $4, $5, $6,
               'FIXTURE — scripts/seed-fixtures.mjs', 'active')
       on conflict (slug) do update set how_it_works = excluded.how_it_works
       returning id`,
      [
        game.slug,
        game.name,
        game.howItWorks,
        game.price,
        game.minGuests,
        game.maxGuests,
      ]
    );
    const id = rows[0].id;
    await tag("game_facet", "game_id", id, game.facets, "FIXTURE");
    await claimOccasions("game_occasion", "game_id", id, game.occasions);
    await claimSlots("game_slot", "game_id", id, game.slots);
    await scopeWorlds("game_world", "game_id", id, game.worlds, worldIds);
  }
  console.log(`[seed-fixtures] games        ${GAMES.length}`);

  // ── tracklists ─────────────────────────────────────────────────────
  for (const tracklist of TRACKLISTS) {
    const { rows } = await client.query(
      `insert into tracklist
         (slug, name, description, world_id, status, activated_at, authored_by, notes)
       values ($1, $2, $3, $4, 'active', now(), 'fixture',
               'FIXTURE — scripts/seed-fixtures.mjs')
       on conflict (slug) do update set description = excluded.description
       returning id`,
      [
        tracklist.slug,
        tracklist.name,
        tracklist.description,
        tracklist.world ? worldIds.get(tracklist.world) : null,
      ]
    );
    const id = rows[0].id;
    await client.query(`delete from tracklist_track where tracklist_id = $1`, [id]);
    let position = 1;
    for (const [segment, artist, title] of tracklist.tracks) {
      await client.query(
        `insert into tracklist_track (tracklist_id, position, segment, artist, title)
         values ($1, $2, $3, $4, $5)`,
        [id, position, segment, artist, title]
      );
      position += 1;
    }
    await tag("tracklist_facet", "tracklist_id", id, tracklist.facets, "FIXTURE");
    await claimSlots("tracklist_slot", "tracklist_id", id, ["soundtrack"]);
  }
  console.log(`[seed-fixtures] tracklists   ${TRACKLISTS.length}`);

  // ── applications ───────────────────────────────────────────────────
  const applicationIds = new Map();
  for (const application of APPLICATIONS) {
    const { rows: customer } = await client.query(
      `insert into customer (email, name) values ($1, $2)
       on conflict (email) do update set name = excluded.name
       returning id`,
      [application.email, application.name]
    );
    const customerId = customer[0].id;

    await client.query(
      `insert into taste_profile (customer_id) values ($1)
       on conflict (customer_id) do nothing`,
      [customerId]
    );

    const answers = {
      occasion: application.occasion,
      environment: application.environment,
      taste_directions: application.tasteDirections,
      group_fun: application.groupFun,
      anti_preferences: application.antiPreferences,
      affinities: application.affinities,
      guest_count_band: application.guests,
      spend_per_person: application.spend,
      music_service: application.music,
      food_plan: application.foodPlan,
      play_appetite: application.playAppetite,
      how_made: application.howMade,
      secret: application.secret,
      email: application.email,
    };

    const submissionKey = `fixture-${application.key}-v1`;
    const { rows: response } = await client.query(
      `insert into quiz_response
         (customer_id, answers, quiz_version, submission_key, occasion,
          environment, taste_directions, group_fun, anti_preferences, affinities,
          secret, guest_count_band, spend_per_person, music_service,
          food_plan, play_appetite, how_made)
       values ($1, $2::jsonb, '2026-08-d', $3, $4, $5, $6, $7, $8, $9, $10, $11,
               $12, $13, $14::food_plan, $15::play_appetite, $16::making_level)
       on conflict (submission_key) do update set status = quiz_response.status
       returning id`,
      [
        customerId,
        JSON.stringify(answers),
        submissionKey,
        application.occasion,
        application.environment,
        application.tasteDirections,
        application.groupFun,
        application.antiPreferences,
        application.affinities,
        application.secret || null,
        application.guests,
        application.spend,
        application.music,
        // db/016. Vale is the one who says no to both: dinner is booked
        // elsewhere and nothing is organised, so her plan has no menu slot and
        // no game slots — and neither absence is a gap.
        application.foodPlan,
        application.playAppetite,
        application.howMade,
      ]
    );
    const responseId = response[0].id;
    applicationIds.set(application.key, responseId);

    // The same projection the real submission path performs.
    await client.query(`select record_quiz_signals($1)`, [responseId]);

    await client.query(
      `delete from customer_cohort_affinity
        where customer_id = $1 and source = 'quiz'`,
      [customerId]
    );
    const weights = {};
    for (const [slug, weight] of Object.entries(application.cohorts)) {
      weights[slug] = weight;
    }
    await client.query(
      `select replace_cohort_affinity($1, 'quiz', $2::jsonb, $3, $4)`,
      [customerId, JSON.stringify(weights), "fixture-v1", 0.6]
    );

    for (const signal of application.signals) {
      // A curator signal is PERMANENT by db/002's rule — it may not be deleted,
      // only superseded — so a seeder that inserts one on every run silently
      // doubles her evidence each time and moves the blend. Checked rather than
      // upserted, because there is no natural key here and inventing one would
      // be inventing a claim about when two observations are the same.
      const { rows: already } = await client.query(
        `select 1 from taste_signal
          where customer_id = $1 and facet_id = $2 and note = $3
            and source = 'curator'`,
        [customerId, facet(signal.facet), signal.note]
      );
      if (already.length > 0) continue;

      await client.query(
        `insert into taste_signal
           (customer_id, facet_id, polarity, strength, confidence, context,
            source, note, observed_at)
         values ($1, $2, $3, $4, 0.9, 'conversation', 'curator', $5,
                 now() - interval '40 days')`,
        [
          customerId,
          facet(signal.facet),
          signal.polarity,
          signal.strength,
          signal.note,
        ]
      );
    }
  }

  console.log(
    `[seed-fixtures] applications ${applicationIds.size}\n` +
      [...applicationIds.entries()]
        .map(([key, id]) => `                 ${key.padEnd(6)} ${id}`)
        .join("\n")
  );

  await client.query("commit");
  console.log("[seed-fixtures] done");
} catch (err) {
  await client.query("rollback");
  console.error(`\n[seed-fixtures] FAILED: ${err.message}`);
  process.exitCode = 1;
} finally {
  await client.end();
}
