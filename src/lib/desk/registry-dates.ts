/**
 * WHEN THE REGISTRY LAST SAID IT. GENERATED — do not edit.
 *
 *   npm run gen:registry-dates
 *
 * One row per room per copy field, carrying the date the registry text was
 * last written and the text it was written as. The whole argument — why this
 * is generated, how the date is derived, and what it overstates — is in
 * scripts/registry-dates.mjs. Read that before trusting a number here.
 *
 * ── THE ONE THING TO KNOW BEFORE READING A DATE OFF THIS FILE ────────
 *
 * A generated date is a lie the moment the thing it was generated from moves,
 * and this one would be a lie in front of the founder at the moment she
 * decides whether a curator's edit predates a correction. So NOTHING READS
 * `authoredAt` DIRECTLY. `registryDate()` checks the recorded `value`
 * against the live registry first and returns `stale` instead of a date when
 * they have parted — which is a state the screen renders in words, not a blank
 * that would read as "never revised".
 */

import { authoredCopy } from "@/lib/desk/drift";

export type RegistryCopyDate = {
  slug: string;
  /** 'name' | 'tagline' | 'premise' — the registry's own words for them. */
  field: string;
  /** ISO 8601 author date of the newest commit touching the field's lines. */
  authoredAt: string;
  sha: string;
  subject: string;
  /** The registry text this date was computed for. The staleness key. */
  value: string;
  /**
   * How many commits have ever touched these lines. 1 means the sentence has
   * stood unchanged since it was first written, which is the case where "the
   * curator edited against a text that has since been replaced" cannot apply.
   */
  revisions: number;
  /**
   * Null when the field was dated. Otherwise why it was not — a parser miss,
   * or a range with no history. Emitted rather than omitted: an absent row and
   * a room with no history are indistinguishable once both are missing.
   */
  unknown: string | null;
};

export const REGISTRY_COPY_DATES: readonly RegistryCopyDate[] = [
  {"slug":"westhampton-1976","field":"name","authoredAt":"2026-08-15T09:09:40-04:00","sha":"ab62705fa706f74533272650bfb9504f92235d34","subject":"Build the landing page, and give destinations a voice","value":"WESTHAMPTON, 1976","revisions":1,"unknown":null},
  {"slug":"westhampton-1976","field":"tagline","authoredAt":"2026-08-31T17:41:22-04:00","sha":"931a140ddb1db2b4d8538672000ca304f944d26c","subject":"Westhampton's tagline: the room's day, not a verdict on its guests","value":"Vintage summer glamour. Easy, beachy, no fuss. Tennis at 8 am and cocktails at 5.","revisions":2,"unknown":null},
  {"slug":"westhampton-1976","field":"premise","authoredAt":"2026-08-15T09:09:40-04:00","sha":"ab62705fa706f74533272650bfb9504f92235d34","subject":"Build the landing page, and give destinations a voice","value":"Dune Road, Labor Day weekend, 1976. A rented house that sleeps six, a heat wave that does not break, and a long dinner that turns into something else.","revisions":1,"unknown":null},
  {"slug":"havana","field":"name","authoredAt":"2026-08-18T22:06:18-04:00","sha":"171f952cf8bbf6cb08ca5c2b8d0d769aeb1fd992","subject":"Pin every destination to a year","value":"HAVANA, 1957","revisions":2,"unknown":null},
  {"slug":"havana","field":"tagline","authoredAt":"2026-08-15T13:04:18-04:00","sha":"fed373ecf32a26a1964541bdbdf1967dd91e51b6","subject":"The tone icons, the drinks, Havana, and the inside of an occasion","value":"The table is pushed back for the dancing. Supper again at three.","revisions":1,"unknown":null},
  {"slug":"havana","field":"premise","authoredAt":"2026-08-15T13:04:18-04:00","sha":"fed373ecf32a26a1964541bdbdf1967dd91e51b6","subject":"The tone icons, the drinks, Havana, and the inside of an occasion","value":"A house on Tejadillo with a courtyard, a fan that turns and does not cool, and a night with two halves. Dinner runs until the table is carried back against the wall. What follows the dancing is a second supper nobody planned and everybody expects.","revisions":1,"unknown":null},
  {"slug":"las-vegas","field":"name","authoredAt":"2026-08-18T22:06:18-04:00","sha":"171f952cf8bbf6cb08ca5c2b8d0d769aeb1fd992","subject":"Pin every destination to a year","value":"LAS VEGAS, 1960","revisions":2,"unknown":null},
  {"slug":"las-vegas","field":"tagline","authoredAt":"2026-08-15T16:18:12-04:00","sha":"c50116a9fd3a20a40bb6704a7f8fa83ca429a1bc","subject":"Eleven voices, generation, scoping, and the three decisions","value":"Everyone dressed up. Nobody in a nightclub queue.","revisions":1,"unknown":null},
  {"slug":"las-vegas","field":"premise","authoredAt":"2026-08-15T16:18:12-04:00","sha":"c50116a9fd3a20a40bb6704a7f8fa83ca429a1bc","subject":"Eleven voices, generation, scoping, and the three decisions","value":"A suite on a high floor, everybody ready an hour before anything opens, and a table held until midnight. One game, one stake, agreed upstairs so the night cannot get away from anybody. It ends in a booth at four in the morning with the good clothes still on.","revisions":1,"unknown":null},
  {"slug":"new-york","field":"name","authoredAt":"2026-08-18T22:06:18-04:00","sha":"171f952cf8bbf6cb08ca5c2b8d0d769aeb1fd992","subject":"Pin every destination to a year","value":"NEW YORK, 1938","revisions":2,"unknown":null},
  {"slug":"new-york","field":"tagline","authoredAt":"2026-08-15T16:18:12-04:00","sha":"c50116a9fd3a20a40bb6704a7f8fa83ca429a1bc","subject":"Eleven voices, generation, scoping, and the three decisions","value":"A rooftop, briefly. A long table, mostly.","revisions":1,"unknown":null},
  {"slug":"new-york","field":"premise","authoredAt":"2026-08-15T16:18:12-04:00","sha":"c50116a9fd3a20a40bb6704a7f8fa83ca429a1bc","subject":"Eleven voices, generation, scoping, and the three decisions","value":"An apartment with a table long enough to need a plan, coats piled on the bed, and oysters opened on the counter as people arrive. Dinner is served, one person stands up at midnight, and the last hour is the lights low and side two on.","revisions":1,"unknown":null},
  {"slug":"nantucket","field":"name","authoredAt":"2026-08-18T22:06:18-04:00","sha":"171f952cf8bbf6cb08ca5c2b8d0d769aeb1fd992","subject":"Pin every destination to a year","value":"NANTUCKET, 1972","revisions":2,"unknown":null},
  {"slug":"nantucket","field":"tagline","authoredAt":"2026-08-15T16:18:12-04:00","sha":"c50116a9fd3a20a40bb6704a7f8fa83ca429a1bc","subject":"Eleven voices, generation, scoping, and the three decisions","value":"Newspaper on the table. Butter in a saucepan.","revisions":1,"unknown":null},
  {"slug":"nantucket","field":"premise","authoredAt":"2026-08-15T16:18:12-04:00","sha":"c50116a9fd3a20a40bb6704a7f8fa83ca429a1bc","subject":"Eleven voices, generation, scoping, and the three decisions","value":"A shingled house at the end of a lane, a porch with a bucket of ice on it, and a dinner everybody takes apart with their hands. Sweaters come out at eight whatever the day did. The night ends on the dock, watching nothing happen on the water.","revisions":1,"unknown":null},
  {"slug":"new-orleans","field":"name","authoredAt":"2026-08-18T22:06:18-04:00","sha":"171f952cf8bbf6cb08ca5c2b8d0d769aeb1fd992","subject":"Pin every destination to a year","value":"NEW ORLEANS, 1956","revisions":2,"unknown":null},
  {"slug":"new-orleans","field":"tagline","authoredAt":"2026-08-15T16:18:12-04:00","sha":"c50116a9fd3a20a40bb6704a7f8fa83ca429a1bc","subject":"Eleven voices, generation, scoping, and the three decisions","value":"Dinner at nine. Nobody's leaving at eleven.","revisions":1,"unknown":null},
  {"slug":"new-orleans","field":"premise","authoredAt":"2026-08-15T16:18:12-04:00","sha":"c50116a9fd3a20a40bb6704a7f8fa83ca429a1bc","subject":"Eleven voices, generation, scoping, and the three decisions","value":"A courtyard behind a corner house, drinks made badly and made again, and a dinner nobody sits down to on time. At midnight there is coffee and something fried, and then everybody goes back out. It ends walking home in a loose line with the argument still running.","revisions":1,"unknown":null},
  {"slug":"catskills","field":"name","authoredAt":"2026-08-18T22:06:18-04:00","sha":"171f952cf8bbf6cb08ca5c2b8d0d769aeb1fd992","subject":"Pin every destination to a year","value":"CATSKILLS, 1963","revisions":2,"unknown":null},
  {"slug":"catskills","field":"tagline","authoredAt":"2026-08-23T10:21:34-04:00","sha":"6e7de44b162cb4906b014eac2b39c38362be4275","subject":"Catskills reconciled, and every destination carries its year","value":"It's never too late to experience sleepaway camp.","revisions":2,"unknown":null},
  {"slug":"catskills","field":"premise","authoredAt":"2026-08-23T10:21:34-04:00","sha":"6e7de44b162cb4906b014eac2b39c38362be4275","subject":"Catskills reconciled, and every destination carries its year","value":"Eleven in the morning and the bell's already been rung once, just to test it. The first tray of food is out before anyone's hungry, and the trays don't really stop after that.\n\nThe afternoon spreads out on its own — there's a lake if there's a lake, and if there is, someone's in it before they meant to be. Someone's asleep in the sun. Someone's been teasing the same person since noon, which is how you know they're friends now.\n\nAt dusk the string lights come on between the trees and the whole day changes gears without anyone saying so. Dinner is long and loud and too much.\n\nBy dark it's down to the people who always stay. Whoever's up last turns off the lights.","revisions":2,"unknown":null},
  {"slug":"cote-dazur","field":"name","authoredAt":"2026-08-15T16:18:12-04:00","sha":"c50116a9fd3a20a40bb6704a7f8fa83ca429a1bc","subject":"Eleven voices, generation, scoping, and the three decisions","value":"CÔTE D'AZUR, 1962","revisions":1,"unknown":null},
  {"slug":"cote-dazur","field":"tagline","authoredAt":"2026-08-15T16:18:12-04:00","sha":"c50116a9fd3a20a40bb6704a7f8fa83ca429a1bc","subject":"Eleven voices, generation, scoping, and the three decisions","value":"Lunch that never ended. Nobody changed for dinner.","revisions":1,"unknown":null},
  {"slug":"cote-dazur","field":"premise","authoredAt":"2026-08-15T16:18:12-04:00","sha":"c50116a9fd3a20a40bb6704a7f8fa83ca429a1bc","subject":"Eleven voices, generation, scoping, and the three decisions","value":"A terrace above the road, a table that gets carried outside at the last minute, and a lunch that is still going at seven. There is one cocktail and everybody has it. The last hour is on the steps, when the good bottle is opened and it stops being a party.","revisions":1,"unknown":null},
  {"slug":"portofino","field":"name","authoredAt":"2026-08-18T22:06:18-04:00","sha":"171f952cf8bbf6cb08ca5c2b8d0d769aeb1fd992","subject":"Pin every destination to a year","value":"PORTOFINO, 1961","revisions":2,"unknown":null},
  {"slug":"portofino","field":"tagline","authoredAt":"2026-08-15T16:18:12-04:00","sha":"c50116a9fd3a20a40bb6704a7f8fa83ca429a1bc","subject":"Eleven voices, generation, scoping, and the three decisions","value":"The harbour to yourselves. Everything shut but the good place.","revisions":1,"unknown":null},
  {"slug":"portofino","field":"premise","authoredAt":"2026-08-15T16:18:12-04:00","sha":"c50116a9fd3a20a40bb6704a7f8fa83ca429a1bc","subject":"Eleven voices, generation, scoping, and the three decisions","value":"A house above a harbour in the month nobody comes. One restaurant is open and it is the good one. The walk happens before the bags are unpacked, lunch takes the whole of Saturday, and the way home in the dark is in whatever order the group falls into.","revisions":1,"unknown":null},
  {"slug":"dolomites","field":"name","authoredAt":"2026-08-18T22:06:18-04:00","sha":"171f952cf8bbf6cb08ca5c2b8d0d769aeb1fd992","subject":"Pin every destination to a year","value":"DOLOMITES, 1956","revisions":2,"unknown":null},
  {"slug":"dolomites","field":"tagline","authoredAt":"2026-08-15T16:18:12-04:00","sha":"c50116a9fd3a20a40bb6704a7f8fa83ca429a1bc","subject":"Eleven voices, generation, scoping, and the three decisions","value":"The first gondola at eight. Lunch halfway down.","revisions":1,"unknown":null},
  {"slug":"dolomites","field":"premise","authoredAt":"2026-08-15T16:18:12-04:00","sha":"c50116a9fd3a20a40bb6704a7f8fa83ca429a1bc","subject":"Eleven voices, generation, scoping, and the three decisions","value":"A house at the bottom of the run with a stove, a drying room and the times posted in the hall. The day is early and the light goes at four. Dinner is one pot on a long table, grappa is taken standing, and the cards go on until the fire is banked.","revisions":1,"unknown":null},
  {"slug":"big-sur","field":"name","authoredAt":"2026-08-18T22:06:18-04:00","sha":"171f952cf8bbf6cb08ca5c2b8d0d769aeb1fd992","subject":"Pin every destination to a year","value":"BIG SUR, 1971","revisions":2,"unknown":null},
  {"slug":"big-sur","field":"tagline","authoredAt":"2026-08-15T16:18:12-04:00","sha":"c50116a9fd3a20a40bb6704a7f8fa83ca429a1bc","subject":"Eleven voices, generation, scoping, and the three decisions","value":"Fog until noon. Nobody has a signal.","revisions":1,"unknown":null},
  {"slug":"big-sur","field":"premise","authoredAt":"2026-08-15T16:18:12-04:00","sha":"c50116a9fd3a20a40bb6704a7f8fa83ca429a1bc","subject":"Eleven voices, generation, scoping, and the three decisions","value":"A cabin at the end of a road, cars parked facing out, and a fog that lifts when it lifts. Dinner is cooked over a fire and eaten off a tailgate. The evening is one story at a time, told long, until the fog comes back in and everybody goes inside.","revisions":1,"unknown":null},
  {"slug":"tahiti","field":"name","authoredAt":"2026-08-18T22:06:18-04:00","sha":"171f952cf8bbf6cb08ca5c2b8d0d769aeb1fd992","subject":"Pin every destination to a year","value":"TAHITI, 1961","revisions":2,"unknown":null},
  {"slug":"tahiti","field":"tagline","authoredAt":"2026-08-15T16:18:12-04:00","sha":"c50116a9fd3a20a40bb6704a7f8fa83ca429a1bc","subject":"Eleven voices, generation, scoping, and the three decisions","value":"Torches lit before anyone is hungry. The tide comes to the table.","revisions":1,"unknown":null},
  {"slug":"tahiti","field":"premise","authoredAt":"2026-08-15T16:18:12-04:00","sha":"c50116a9fd3a20a40bb6704a7f8fa83ca429a1bc","subject":"Eleven voices, generation, scoping, and the three decisions","value":"A table set on sand, a fire beside it, and torches that go up one at a time long before anybody is hungry. Dinner is whatever came in today, eaten late and slowly. The last people move down to the sand and stay there, and nothing is cleared until morning.","revisions":1,"unknown":null},
  {"slug":"acapulco-1959","field":"name","authoredAt":"2026-08-27T14:35:08-04:00","sha":"0cf0bd628155872ecbc299df490b4f01fb98398c","subject":"OAXACA gets written, and the voice ceilings stop being round numbers","value":"ACAPULCO, 1959","revisions":1,"unknown":null},
  {"slug":"acapulco-1959","field":"tagline","authoredAt":"2026-08-27T14:35:08-04:00","sha":"0cf0bd628155872ecbc299df490b4f01fb98398c","subject":"OAXACA gets written, and the voice ceilings stop being round numbers","value":"Lunch never exactly ends. Nobody checks a clock again once the candles are lit.","revisions":1,"unknown":null},
  {"slug":"acapulco-1959","field":"premise","authoredAt":"2026-08-27T14:35:08-04:00","sha":"0cf0bd628155872ecbc299df490b4f01fb98398c","subject":"OAXACA gets written, and the voice ceilings stop being round numbers","value":"Acapulco, December 1959. Lunch never exactly ends — the table gets reset around whoever refuses to leave it, and somebody's in the water instead of dressing. Salt on skin under silk. Dinner starts when the last of you wanders back, and not before, and nobody checks a clock again once the candles are lit. This is the party where your people stop performing — where the photograph, if anyone takes one, catches everybody mid-sentence.","revisions":1,"unknown":null},
  {"slug":"amalfi-1953","field":"name","authoredAt":"2026-08-27T14:35:08-04:00","sha":"0cf0bd628155872ecbc299df490b4f01fb98398c","subject":"OAXACA gets written, and the voice ceilings stop being round numbers","value":"AMALFI COAST, 1953","revisions":1,"unknown":null},
  {"slug":"amalfi-1953","field":"tagline","authoredAt":"2026-08-27T14:35:08-04:00","sha":"0cf0bd628155872ecbc299df490b4f01fb98398c","subject":"OAXACA gets written, and the voice ceilings stop being round numbers","value":"Everything on the table at once. Your plate fills while you are talking.","revisions":1,"unknown":null},
  {"slug":"amalfi-1953","field":"premise","authoredAt":"2026-08-27T14:35:08-04:00","sha":"0cf0bd628155872ecbc299df490b4f01fb98398c","subject":"OAXACA gets written, and the voice ceilings stop being round numbers","value":"A long table under striped umbrellas, laid for more people than were asked, and everything on it before anybody sits down. The fish sliced thin with lemon on it, tomatoes, bread you will be told to finish. Your plate is filled again while you are still talking. The game is called after dark, the small glasses come out at the end and nobody asked for them, and it thins out into the kitchen rather than ending.","revisions":1,"unknown":null},
  {"slug":"aspen-1994","field":"name","authoredAt":"2026-08-27T14:35:08-04:00","sha":"0cf0bd628155872ecbc299df490b4f01fb98398c","subject":"OAXACA gets written, and the voice ceilings stop being round numbers","value":"ASPEN, 1994","revisions":1,"unknown":null},
  {"slug":"aspen-1994","field":"tagline","authoredAt":"2026-08-27T14:35:08-04:00","sha":"0cf0bd628155872ecbc299df490b4f01fb98398c","subject":"OAXACA gets written, and the voice ceilings stop being round numbers","value":"Half of you can recite the movie. Everybody ends up under the same two blankets.","revisions":1,"unknown":null},
  {"slug":"aspen-1994","field":"premise","authoredAt":"2026-08-27T14:35:08-04:00","sha":"0cf0bd628155872ecbc299df490b4f01fb98398c","subject":"OAXACA gets written, and the voice ceilings stop being round numbers","value":"The blankets come out of the closet before anybody arrives and the good chocolate was bought for tonight. It's dark by five and nobody is going anywhere.\n\nDinner is one pot, made while everybody dances in the kitchen and gets in the way. Garlic bread. Box wine, promoted to glasses. Cocoa if it snows.\n\nThen the movie, and half of you can recite it, and the half that can does. However many blankets this house owns, everybody ends up under the same two.\n\nSomebody says one more episode. Somebody's asleep. Nobody goes to bed until the last one does, and whoever said they were up early is up early anyway.","revisions":1,"unknown":null},
  {"slug":"palm-springs-1965","field":"name","authoredAt":"2026-08-27T14:35:08-04:00","sha":"0cf0bd628155872ecbc299df490b4f01fb98398c","subject":"OAXACA gets written, and the voice ceilings stop being round numbers","value":"PALM SPRINGS, 1965","revisions":1,"unknown":null},
  {"slug":"palm-springs-1965","field":"tagline","authoredAt":"2026-08-27T14:35:08-04:00","sha":"0cf0bd628155872ecbc299df490b4f01fb98398c","subject":"OAXACA gets written, and the voice ceilings stop being round numbers","value":"The pool is lit. So is everyone.","revisions":1,"unknown":null},
  {"slug":"palm-springs-1965","field":"premise","authoredAt":"2026-08-27T14:35:08-04:00","sha":"0cf0bd628155872ecbc299df490b4f01fb98398c","subject":"OAXACA gets written, and the voice ceilings stop being round numbers","value":"Palm Springs, October 1965. The heat breaks at dusk and the party starts exactly then — ice cracking into glasses, the pool glowing from below, everyone sharper-dressed than a backyard requires. The drinks are cold, strong, and correctly made; the good line gets repeated across the patio within the minute. This is the party where everybody shows up polished — where the gossip is excellent, the outfits were committed to, and nobody pretends they didn't try.","revisions":1,"unknown":null},
  {"slug":"oaxaca-1954","field":"name","authoredAt":"2026-08-27T14:35:08-04:00","sha":"0cf0bd628155872ecbc299df490b4f01fb98398c","subject":"OAXACA gets written, and the voice ceilings stop being round numbers","value":"OAXACA, 1954","revisions":1,"unknown":null},
  {"slug":"oaxaca-1954","field":"tagline","authoredAt":"2026-08-27T14:35:08-04:00","sha":"0cf0bd628155872ecbc299df490b4f01fb98398c","subject":"OAXACA gets written, and the voice ceilings stop being round numbers","value":"Sunday since yesterday.","revisions":1,"unknown":null},
  {"slug":"oaxaca-1954","field":"premise","authoredAt":"2026-08-27T14:35:08-04:00","sha":"0cf0bd628155872ecbc299df490b4f01fb98398c","subject":"OAXACA gets written, and the voice ceilings stop being round numbers","value":"The mole has been going since yesterday and everyone knows it — that is the whole schedule, and nobody has ever written it down. The courtyard door stands open from noon; nobody greets you, you are seated, and a plate arrives before your name does. The comida starts around two and is still the afternoon at six: three generations talking at once down a table that grows chairs as cousins of cousins come through the door. Nothing is performed and nothing is announced — the food is the only thing presented, and it is presented like an argument won years ago. At dusk it dissolves into the courtyard, chairs pulled to the wall, café de olla, the same stories retold with the same corrections, and nobody calls it an ending because Sunday does not end, it recedes.","revisions":1,"unknown":null},
  {"slug":"st-moritz-1984","field":"name","authoredAt":"2026-08-27T14:35:08-04:00","sha":"0cf0bd628155872ecbc299df490b4f01fb98398c","subject":"OAXACA gets written, and the voice ceilings stop being round numbers","value":"ST. MORITZ, 1984","revisions":1,"unknown":null},
  {"slug":"st-moritz-1984","field":"tagline","authoredAt":"2026-08-27T14:35:08-04:00","sha":"0cf0bd628155872ecbc299df490b4f01fb98398c","subject":"OAXACA gets written, and the voice ceilings stop being round numbers","value":"Champagne in the snow, sunglasses on.","revisions":1,"unknown":null},
  {"slug":"st-moritz-1984","field":"premise","authoredAt":"2026-08-27T14:35:08-04:00","sha":"0cf0bd628155872ecbc299df490b4f01fb98398c","subject":"OAXACA gets written, and the voice ceilings stop being round numbers","value":"St. Moritz, January 1984. The party starts while it's still light — on purpose. Champagne outside in the cold, sunglasses and good jewelry at the same time, everyone flushed and golden and talking to everyone. The light off the snow does half the work; the fur collars do the rest. When the sun drops, the party moves inside all at once, glowing, and gets its second wind. This is the party that catches the golden hour — where everybody looks lit from within, and the photographs from tonight will be the good ones for years.","revisions":1,"unknown":null},
  {"slug":"hong-kong-1963","field":"name","authoredAt":"2026-09-06T12:27:10-04:00","sha":"0bbfeced6e3eef1da7171d331843daf31f7472e8","subject":"Hong Kong gets a mouth, and it clears New York at 0.575","value":"HONG KONG, 1963","revisions":1,"unknown":null},
  {"slug":"hong-kong-1963","field":"tagline","authoredAt":"2026-09-06T12:27:10-04:00","sha":"0bbfeced6e3eef1da7171d331843daf31f7472e8","subject":"Hong Kong gets a mouth, and it clears New York at 0.575","value":"Your name is at the desk. The roof at seven, and the table at eight.","revisions":1,"unknown":null},
  {"slug":"hong-kong-1963","field":"premise","authoredAt":"2026-09-06T12:27:10-04:00","sha":"0bbfeced6e3eef1da7171d331843daf31f7472e8","subject":"Hong Kong gets a mouth, and it clears New York at 0.575","value":"A table booked in a hotel that opened last year. You give your name at the desk and somebody takes you up. Drinks on the roof while the dining room is still dark, then down to dinner nobody in this party cooked. Afterwards the bar, which has other people's evenings in it, and the night ends because the room does.","revisions":1,"unknown":null},
];

/** What `registryDate` can say. Three states, never two. */
export type RegistryDateReading =
  | { state: "dated"; at: RegistryCopyDate }
  | { state: "stale"; at: RegistryCopyDate }
  | { state: "unknown"; why: string };

/**
 * The date the registry text now in force was written, or why there is none.
 *
 * STALE IS NOT A DATE AND IS NOT A BLANK. It means this file was generated
 * against a different sentence than the one the registry holds today — so the
 * date is real and belongs to text nobody is looking at. Returning it would
 * put a wrong number under the founder's cursor; returning nothing would read
 * as "never revised", which is the opposite of the truth. It gets its own
 * state and the screen says so in words.
 */
export function registryDate(slug: string, field: string): RegistryDateReading {
  const row = REGISTRY_COPY_DATES.find(
    (entry) => entry.slug === slug && entry.field === field
  );
  if (!row) {
    return {
      state: "unknown",
      why:
        `No row for ${slug}.${field} in the generated dates. Either the room ` +
        `is newer than the last \`npm run gen:registry-dates\`, or the parser ` +
        `does not recognise its shape.`,
    };
  }
  if (row.unknown !== null) return { state: "unknown", why: row.unknown };

  const live = authoredCopy(slug, field);
  if (live === null) {
    return {
      state: "unknown",
      why: `The registry no longer authors a room with the slug ${slug}.`,
    };
  }
  if (live !== row.value) return { state: "stale", at: row };
  return { state: "dated", at: row };
}
