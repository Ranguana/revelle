/**
 * The vocabulary the two authored catalogue documents share.
 *
 *   docs/menus.md   -> scripts/seed-menus.mjs
 *   docs/drinks.md  -> scripts/seed-drinks.mjs
 *   docs/dishes.md  -> scripts/seed-dishes.mjs
 *
 * ─────────────────────────────────────────────────────────────────────
 * WHY THIS FILE EXISTS
 *
 * The documents are one drop. They name the same thirteen destinations and
 * they write seasons in the same words — "Warm weather", "Winter or spring",
 * "Any" appear in both — and each of those words is a JUDGEMENT about which
 * closed value in `season_band` it becomes. A judgement written down twice is a
 * judgement that will be made differently twice, which is the argument db/002
 * makes at length about two representations of one fact and the argument
 * scripts/seed-destinations.mjs makes for reading src/lib/destinations.ts
 * rather than a dump of it.
 *
 * So: one map, one place to argue with it.
 *
 * What is deliberately NOT here is each document's own making vocabulary. The
 * menus say "actually made", the drinks say "actually mixed" and the dishes say
 * "B", "H" and "M"; they are one axis and three sets of words, and the words
 * belong to the pool that speaks them. Each seeder carries its own three
 * phrases, right beside the parser that matches them.
 *
 * The one piece of BEHAVIOUR here rather than data is `ensureWorld`, at the
 * bottom, for the same reason: both seeders have to answer "what do I scope
 * this to when the destination has not been authored yet", and two answers to
 * that would be two answers.
 *
 * Framework-free and database-agnostic apart from that one function, which
 * takes a client rather than opening one.
 */

/**
 * The `## heading` in either document -> the `world.slug` it refers to.
 *
 * A table rather than a slugify() call, because "Vegas" is `las-vegas` and
 * "Westhampton" is `westhampton-1976`, and a rule that gets two of thirteen
 * wrong is worse than a list. An unknown heading is an error, not a skip.
 *
 * The slugs match src/lib/library.ts, which is where the plates for ten of
 * these already live, and src/lib/destinations.ts, which is where the one
 * fully authored destination lives. `havana` is in neither yet — it is the
 * first destination the catalogue asked for rather than the other way round,
 * and it is being written now. It is listed here because the content is
 * authored and has to be scoped somewhere true.
 */
export const DESTINATIONS = {
  Westhampton: "westhampton-1976",
  Nantucket: "nantucket",
  "New York": "new-york",
  "Côte d'Azur": "cote-dazur",
  Vegas: "las-vegas",
  Catskills: "catskills",
  Dolomites: "dolomites",
  Tahiti: "tahiti",
  Havana: "havana",
  "Big Sur": "big-sur",
  "New Orleans": "new-orleans",
  Portofino: "portofino",

  /* ── THE SIX PROPOSED ROOMS ─────────────────────────────────────────
   *
   * Added for docs/atmosphere-idea-bank-v1.md, which is the FIRST authored
   * document to carry all eighteen rooms — the menus, the drinks and the
   * dishes still hold twelve, and docs/needs-a-human.md §C books the missing
   * dish pools as founder writing.
   *
   * The slugs are `proposed` in data/destination-matrix.json and are taken
   * from it verbatim rather than slugified from these keys: `amalfi-1953`
   * carries its year and `st-moritz-1984` does too, which is a rule three of
   * the twelve above already break in the other direction. The matrix is the
   * committed source for a destination's identity (CLAUDE.md rule 7) and a
   * second opinion about a slug is how the matrix forked once already.
   *
   * A world row for any of these does not exist yet. ensureWorld creates a
   * DRAFT STUB, which is never chosen for a customer, and seed-destinations
   * completes it when the room is authored — or the row is dropped if the
   * founder blocks the room, which three of the six are still open questions
   * about (docs/needs-a-human.md, DECISIONS 3 and 4).
   */
  "Amalfi Coast": "amalfi-1953",
  Oaxaca: "oaxaca-1954",
  Acapulco: "acapulco-1959",
  "Palm Springs": "palm-springs-1965",
  "St. Moritz": "st-moritz-1984",
  Aspen: "aspen-1994",
};

/**
 * The `## NAME, YEAR` heading of docs/atmosphere-idea-bank-v1.md -> the key of
 * DESTINATIONS above.
 *
 * ── WHY A SECOND MAP AND NOT A SECOND LIST OF SLUGS ─────────────────
 *
 * The bank document heads its rooms the way db/029 names them — "WESTHAMPTON,
 * 1976", "CÔTE D'AZUR, 1962" — because that migration made "NAME, YEAR" the
 * canonical `world.name` and the founder wrote the bank in the same breath.
 * The other three catalogue documents head theirs "## Westhampton". Two
 * spellings of one room, and exactly the situation this file exists to stop
 * being answered twice.
 *
 * So this map holds the SPELLING and DESTINATIONS holds the SLUG. There is
 * still one place a room's slug is written down, which is the whole point; a
 * new document with a third spelling adds eighteen lines here and no slugs
 * anywhere.
 *
 * Two of the eighteen are not a case change and are why this is a table:
 * "LAS VEGAS, 1960" is `Vegas` and "AMALFI COAST, 1953" is `Amalfi Coast`.
 */
export const ROOM_HEADINGS = {
  "WESTHAMPTON, 1976": "Westhampton",
  "NEW YORK, 1938": "New York",
  "NEW ORLEANS, 1956": "New Orleans",
  "DOLOMITES, 1956": "Dolomites",
  "HAVANA, 1957": "Havana",
  "LAS VEGAS, 1960": "Vegas",
  "PORTOFINO, 1961": "Portofino",
  "TAHITI, 1961": "Tahiti",
  "CÔTE D'AZUR, 1962": "Côte d'Azur",
  "CATSKILLS, 1963": "Catskills",
  "PALM SPRINGS, 1965": "Palm Springs",
  "BIG SUR, 1971": "Big Sur",
  "NANTUCKET, 1972": "Nantucket",
  "AMALFI COAST, 1953": "Amalfi Coast",
  "OAXACA, 1954": "Oaxaca",
  "ACAPULCO, 1959": "Acapulco",
  "ST. MORITZ, 1984": "St. Moritz",
  "ASPEN, 1994": "Aspen",
};

/**
 * Her season wording -> the closed value in season_band (db/012).
 *
 * Her words are kept verbatim in `season_note` beside it. This mapping exists
 * only so the selection layer has something to filter and weight on; where the
 * two disagree in richness, hers is the one a human reads.
 *
 * Six of these are judgements and each is one line, here, where it can be
 * argued with:
 *
 *   "Late August"              summer, not high_summer — the menu it belongs to
 *                              is a porch dinner at the end of summer.
 *   "Warm weather"             summer. Not a month but a condition, and
 *                              `year_round` would put a Tahitian beach lunch in
 *                              a February in Brooklyn.
 *   "Fall, works year-round"   year_round. The second clause is the operative
 *                              one, exactly as it was for the retired wording
 *                              "Winter, works year-round".
 *   "Winter or spring"         winter. `season_band` has no winter-into-spring
 *                              value and cannot grow one usefully; she names
 *                              winter first, and both entries that carry it are
 *                              the dressed-up New Orleans dinner.
 *   "Shoulder season and fall" shoulder. She names shoulder first, and on this
 *                              coast autumn IS the shoulder.
 *   "Spring and summer"        summer. The half of it that is a beach lunch is
 *                              unambiguous, and `spring` would put the wider
 *                              answer outside high season.
 *
 * A NEW WORDING IS A DECISION AND NOT A DEFAULT. Every seeder fails loudly and
 * names the line rather than guessing, which is the only behaviour that keeps a
 * seed from quietly inventing content.
 *
 * ─────────────────────────────────────────────────────────────────────
 * docs/dishes.md ADDS EIGHT WORDINGS, FOUR OF THEM ONLY A CASE APART
 *
 * That document writes its seasons in lower case inside parentheses —
 * "· M (summer)" — rather than as a capitalised bullet. Four of the eight are
 * therefore words the map already holds with a capital, and they are listed
 * again rather than case-folded on the way in: folding is a rule, a rule is a
 * guess, and this file's whole argument is that a wording is a decision. The
 * cost of the rule being wrong once is a season silently changed; the cost of
 * listing four extra keys is four extra lines.
 *
 * The other four are judgements and are argued one line each, below.
 */
export const SEASONS = {
  Spring: "spring",
  "Spring and summer": "summer",
  // Portofino 35. Follows "Spring and summer" above rather than splitting the
  // difference into `shoulder`, which would take it out of high season — and
  // stuffed baked vegetables and berries are summer food wherever else they
  // appear in the catalogue.
  "Spring or summer": "summer",
  Summer: "summer",
  "High summer": "high_summer",
  "Late August": "summer",
  "Warm weather": "summer",
  Fall: "autumn",
  October: "autumn",
  Winter: "winter",
  "Winter or spring": "winter",
  "Shoulder season": "shoulder",
  "Shoulder season and fall": "shoulder",
  "Spring or fall": "shoulder",
  "Year-round": "year_round",
  Any: "year_round",
  "Fall, works year-round": "year_round",
  // Retired wordings. Menu 10 said this until the current drop; kept so that an
  // older copy of the document still seeds rather than failing on a phrase
  // whose meaning was never in doubt.
  "Winter, works year-round": "year_round",

  /* ── docs/dishes.md ────────────────────────────────────────────────
   *
   * The four that are the same word in lower case. No judgement in any of
   * them; they are here because this map is matched exactly.
   */
  spring: "spring",
  summer: "summer",
  fall: "autumn",
  winter: "winter",

  /* The four that are judgements. */

  // "early summer"  June. Soft-shell crabs, strawberry shortcake, cherry
  //                 clafoutis — the front of the season, not the end of spring.
  //                 `summer` and not `spring`: none of the three is spring food,
  //                 and `season_band` splits summer only at the top end
  //                 (`high_summer` is "August. Heat that does not break"), so
  //                 the front of summer has exactly one band it can be in.
  "early summer": "summer",

  // "late summer"   Figs, blackberries, plums, corn. Follows the existing
  //                 "Late August" -> summer judgement rather than reaching for
  //                 `high_summer`: high summer is the heat itself, and this is
  //                 the produce at the tail of it sliding toward autumn. The
  //                 alternative reading (high_summer) is defensible and was
  //                 rejected only for consistency with the line above it.
  "late summer": "summer",

  // "fall/winter"   She names two seasons and `season_band` holds one. `autumn`
  //                 by the rule the map already follows twice — "Winter or
  //                 spring" -> winter and "Shoulder season and fall" ->
  //                 shoulder, both on the strength of which she named FIRST —
  //                 and autumn is also the earlier of the two, so a dish tagged
  //                 with it is available from the first cold weekend.
  //                 `shoulder` is wrong: that value means spring-or-autumn.
  //                 THIS ONE IS ALSO NARROWED — see SEASON_NARROWED below.
  "fall/winter": "autumn",

  // "Carnival season"  King cake, New Orleans, and the only line in 650 whose
  //                 season is not a season. Carnival opens on Twelfth Night, 6
  //                 January, and closes on Mardi Gras, which moves between 3
  //                 February and 9 March — a movable feast, entirely inside
  //                 winter in all but its last days. `winter` is the closest
  //                 true statement `season_band` can make, her two words are
  //                 kept verbatim in season_note beside it, and db/021 argues
  //                 at length why a calendar-gate mechanism is NOT built for
  //                 one dish: a gate needs a date, and the application does not
  //                 ask for one.
  "Carnival season": "winter",
};

/**
 * The wordings the mapped band only PARTLY covers.
 *
 * Read by scripts/seed-dishes.mjs, and by nothing else today.
 *
 * ── THE RULE, AND WHY IT NEEDS A SECOND LIST ────────────────────────
 *
 * `season_strict` is db/012's hard filter: the difference between "a clambake
 * in February is a weak match" and "a clambake in February is wrong". A dish
 * carries a season only where it BINDS — docs/dishes.md says so at the top —
 * so an authored season is a hard filter, and that is the seeder's default.
 *
 * Except where the band is smaller than what she wrote. "fall/winter" maps to
 * `autumn` because the enum has no two-season value; hard-filtering on `autumn`
 * would then delete JANUARY from a dish she wrote for January, which is not a
 * narrower reading of her sentence but a contradiction of it. So a narrowed
 * wording is a WEIGHT: it pulls toward the season it names and excludes nothing.
 *
 * The reverse case needs no entry. "early summer" -> `summer` and "Carnival
 * season" -> `winter` both map to a band WIDER than the wording, and a hard
 * filter on a wider band can never exclude a month she wanted — only include a
 * few she did not, which is the honest failure direction.
 *
 * The menus' own two-season wordings ("Winter or spring", "Shoulder season and
 * fall") are deliberately NOT listed: scripts/seed-menus.mjs takes
 * `season_strict` from a prose list in docs/menus.md and adding them here would
 * be a silent behaviour change to a pool this drop does not touch.
 */
export const SEASON_NARROWED = new Set(["fall/winter"]);

/**
 * WHAT A DISH IS FOR — her letter codes -> `meal_shape` (db/023).
 *
 * The fourth position on a dish line, and the only one of the four that is not
 * already implied by where the line sits in the document. Read by
 * scripts/seed-dishes.mjs.
 *
 * FIVE SHAPES, DERIVED FROM HER OWN CATALOGUE rather than invented: the "what
 * it's for" lines across docs/menus.md (39) and docs/drinks.md (25) cluster
 * into exactly these and no more. db/023 lists which line lands in which, and
 * argues the three foldings — a dressed-up dinner is a long dinner at a
 * different register, a beach lunch is a lunch in a room db/020 already models,
 * and a midnight breakfast is a late supper with eggs.
 *
 * The codes are position-delimited and may repeat letters across fields without
 * colliding, which is why `B` can mean "bought and arranged" in the making
 * position and `BR` can mean brunch in this one.
 *
 * SEVERAL ARE ALLOWED, comma-separated: `- Deviled eggs · M ·  · C, BR`. A dish
 * that honestly suits two shapes should say so rather than being filed under
 * the likelier one.
 *
 * AN EMPTY FIELD MEANS ANYWHERE and is the common case — all 650 lines are
 * three fields long today. No claims at all means eligible everywhere, which is
 * claimEligibility()'s own default and db/019's rule for destinations.
 */
export const MEALS = {
  D: "long_dinner",
  C: "cocktails",
  BR: "brunch",
  L: "lunch",
  LS: "late_supper",
};

/**
 * The note a stub destination carries, and the string that identifies one.
 *
 * A STUB IS NOT A DESTINATION. It is a `world` row created by a catalogue seed
 * so that authored menus and drinks could be scoped to something true, and it
 * has no look, no voice and no tagline. It is always `status = 'draft'`, which
 * is what keeps it out of a customer's hands: src/lib/selection/catalogue.ts
 * reads `where w.status = 'published'`, so a draft destination can never be
 * chosen for anybody while its content sits in the pool as an ordinary member.
 *
 * scripts/seed-destinations.mjs COMPLETES a stub from src/lib/destinations.ts
 * when the destination is finally authored — which is the one exception to its
 * rule that an existing world is left alone. The rule protects a curator's
 * work, and a stub is not a curator's work; it says so in its own notes column.
 */
export const STUB_NOTE =
  "STUB — created by a catalogue seed so authored content could be scoped. " +
  "No look, no voice, no tagline. Draft, and therefore never issuable. " +
  "Authoring it is src/lib/destinations.ts plus npm run seed:destinations.";

export function isStubRow(row) {
  return (
    typeof row?.notes === "string" &&
    row.notes.startsWith("STUB — created by a catalogue seed")
  );
}

/**
 * The `world` row a piece of authored content is scoped to, creating a draft
 * stub when the destination has not been written yet.
 *
 * ── WHY A STUB AND NOT "LEAVE IT GENERAL" ───────────────────────────
 *
 * Because general is not true, and a menu with no world rows at all is eligible
 * under EVERY published destination — which is precisely how Havana's plantains
 * would end up on a table in the Dolomites.
 *
 * Scoping it to a draft stub is the honest answer and it costs nothing:
 *
 *   · the content is attached to the destination it was written for;
 *   · the destination cannot be issued to anybody, because
 *     src/lib/selection/catalogue.ts reads `where w.status = 'published'`;
 *   · the row is visibly a placeholder and says so in its own notes column,
 *     so the authoring pass completes it rather than working around it.
 *
 * AND IT NOW FIXES THE OTHER HALF TOO. This note used to end by saying that
 * affinity is a weight, so a menu scoped to a stub was not forbidden elsewhere
 * — merely pulled toward a destination nobody could choose. db/019 settled
 * that: the seeders write `native`, a CLAIM, and an ingredient that claims any
 * destination is eligible only under the ones it claims. So the stub is no
 * longer a holding pen, it is the real scoping, and "Havana's daiquiris are not
 * an option at the Dolomites" (docs/drinks.md) is enforced rather than likely.
 *
 * ── `displayName` ───────────────────────────────────────────────────
 *
 * Optional, and it defaults to the heading, so nothing that called this
 * function before it existed behaves differently.
 *
 * It exists because db/029 made "NAME, YEAR" the canonical `world.name` for
 * every destination — "WESTHAMPTON, 1976", not "Westhampton" — and one
 * document, docs/atmosphere-idea-bank-v1.md, heads its rooms that way. A stub
 * created from that document can therefore be created with the name it will
 * keep, instead of with a shorter one somebody has to correct by hand later.
 * The heading is still what the DESTINATIONS lookup is keyed on; this changes
 * only what goes in the `name` column.
 *
 * @returns {{ id: string, slug: string, created: boolean }}
 */
export async function ensureWorld(client, heading, by, displayName = heading) {
  const slug = DESTINATIONS[heading];
  if (!slug) {
    throw new Error(
      `"${heading}" is not a destination this catalogue knows. Add it to ` +
        `DESTINATIONS in scripts/catalogue-vocabulary.mjs — an unknown heading ` +
        `is a decision, not a skip.`
    );
  }

  const { rows: existing } = await client.query(
    `select id from world where slug = $1`,
    [slug]
  );
  if (existing.length > 0) {
    return { id: existing[0].id, slug, created: false };
  }

  const { rows } = await client.query(
    `insert into world (slug, name, tagline, description, status, notes)
     values ($1, $2, '', '', 'draft', $3)
     returning id`,
    // The heading as she wrote it, and nothing else. A stub has no display
    // name of its own to invent: naming a destination is authoring, and the
    // seed that completes this row sets the real one.
    [slug, displayName, `${STUB_NOTE} Created by ${by}.`]
  );
  return { id: rows[0].id, slug, created: true };
}
