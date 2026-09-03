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
 * Read by scripts/seed-dishes.mjs and by src/lib/catalogue/tagging.ts, which is
 * the post-seed step that finally writes `drink.season_strict`.
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
 * ── THE FOUR THAT WERE HELD BACK, AND WHAT BEAT THAT (rule 14) ──────
 *
 * This comment used to end:
 *
 *     "The menus' own two-season wordings ("Winter or spring", "Shoulder
 *      season and fall") are deliberately NOT listed: scripts/seed-menus.mjs
 *      takes `season_strict` from a prose list in docs/menus.md and adding
 *      them here would be a silent behaviour change to a pool this drop does
 *      not touch."
 *
 * The caution was right and its ground is gone. `seed-menus` still reads its
 * own prose list and still does not consult this set, so nothing about the menu
 * pool moves either way — and the menu pool is retired besides (db/045). What
 * changed is that a THIRD reader arrived: the post-seed step now derives
 * `drink.season_strict`, which `scripts/seed-drinks.mjs` has never written, and
 * every one of those four wordings is a drinks wording.
 *
 * They are here rather than in a second list beside the drinks because
 * narrowed-ness is a property of THE WORDING, not of the pool that used it, and
 * two lists of narrowed wordings would be two answers to one question the day
 * a wording appeared in both documents — which is the argument at the top of
 * this file, applied to itself.
 *
 * Checked before adding, because a silent behaviour change is exactly what the
 * old sentence was guarding against: none of the four appears in
 * docs/dishes.md, whose only wordings are summer, fall, winter, spring, late
 * summer, early summer, fall/winter and Carnival season. No dish moves.
 *
 *   "Spring and summer"        -> summer.  Two seasons named, one held.
 *   "Spring or summer"         -> summer.  The same wording with a different
 *                                 conjunction (SEASONS says so where it maps
 *                                 it), and listed here so that the two do not
 *                                 read as a distinction somebody drew. No row
 *                                 in any pool uses it today.
 *   "Winter or spring"         -> winter.  Two seasons named, one held.
 *   "Shoulder season and fall" -> shoulder. `shoulder` is spring-or-autumn, so
 *                                 the band and the wording overlap without
 *                                 either containing the other — the narrowest
 *                                 case there is, and a gate on it would refuse
 *                                 the fall she named.
 *   "Warm weather"             -> summer.  Tahiti's rum punch. Warm weather in
 *                                 Tahiti is not three months, and gating on
 *                                 `summer` would delete May from a drink whose
 *                                 whole premise is that the weather is warm.
 */
export const SEASON_NARROWED = new Set([
  "fall/winter",
  "Spring and summer",
  "Spring or summer",
  "Winter or spring",
  "Shoulder season and fall",
  "Warm weather",
]);

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

  /* ── docs/drinks.md ────────────────────────────────────────────────
   *
   * ONE MAP, TWO DOCUMENTS, exactly as SEASONS above holds "Summer",
   * "summer", "Warm weather" and "October" and answers `season_band` for all
   * four. The dishes write a compact letter in a `·`-delimited line; the
   * drinks write a whole bullet and a letter there would be unreadable. Both
   * spell the SAME closed enum, and spelling it twice in two files is how a
   * vocabulary starts to disagree with itself (CLAUDE.md rule 21).
   *
   * THE WORDS ARE THE FOUNDER'S OWN, from the meal-shape ruling of
   * 2026-08-31: "drinks claim what their authors actually wrote (dinner,
   * brunch, late supper, standing drinks)". src/lib/desk/labels.ts labels the
   * same five codes for a curator's screen — "A long dinner", "A late supper"
   * — and the difference is register, not vocabulary: those are read, these
   * are typed.
   *
   * A drink that names no shape writes "Not said" and claims nothing. That
   * token is NOT in this map on purpose: it is not a shape, it is the absence
   * of one, and scripts/drinks-parse.mjs is where the absence is read.
   */
  Dinner: "long_dinner",
  "Standing drinks": "cocktails",
  Brunch: "brunch",
  Lunch: "lunch",
  "Late supper": "late_supper",
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

/* ── stocking the pool, and saying so in the ledger ─────────────────── */

/**
 * WHAT REPLACED "A SEEDER PRODUCES DRAFTS", AND WHAT SURVIVED OF IT.
 *
 * Every seeder in this tree used to carry one sentence:
 *
 *   "deciding that something is offered to a customer is a curator's decision
 *    and not a script's"
 *
 * It is kept here, whole, because it was RIGHT ABOUT WHAT IT PROTECTED and
 * wrong about its scope. It was written when the only content was destinations,
 * and a destination is an authored world: a look, a voice, a claim about how an
 * evening feels. A dish is an ingredient. Holding both behind one signature
 * meant 372 dishes and 180 bank rows sat in a queue nobody could clear, waiting
 * on a gesture that adds nothing — because nobody reads 372 dishes to decide
 * whether a dish may exist.
 *
 * db/036 split the two and CLAUDE.md rule 13 states the split:
 *
 *   POOL CLASSES stock themselves — dish, drink, menu, bank_item, game,
 *   product, tracklist. They go live on deploy and the founder VETOES at the
 *   desk.
 *
 *   `game` joined that list one round late, and the delay is worth keeping:
 *   rule 13 first named its classes by name, the `game` table was not among
 *   them, and a seeder that read the rule wider than it was written would have
 *   made the identical scope mistake with the sign flipped. What settled it was
 *   not a wider reading but a FACT — `bank_kind = 'game'` (the tombola kit, the
 *   dice cups) was already stocking itself out of seed-bank while the `game`
 *   table stayed governed, so one product category was split across two
 *   publication regimes and a member could receive the shipped kit for a game
 *   whose rules sat in draft. Rule 13 now carries the test that decides the
 *   next one without a stop-and-ask: POOL means selection CHOOSES AMONG rows,
 *   GOVERNED means a row DEFINES WHAT A MEMBER CAN BE PROMISED.
 *
 *   GOVERNED CLASSES keep the old rule word for word — `world` (a destination,
 *   its gesture) and `world_voice`. Each is a claim about a world or about how
 *   the house speaks, and one of those reaching a member unread is a different
 *   kind of wrong from a dish doing it. src/lib/governed.test.ts fails the
 *   build if a seeder here signs for either.
 *
 * So the sentence did not lose an argument. It lost a jurisdiction.
 *
 * ── THE LEDGER HAS TO BE ABLE TO SAY "NOBODY" ────────────────────────
 *
 * A veto is only possible if the veto-er can SEE what happened, so every
 * auto-publish writes a `staff_action` row: `staff_id` null, `actor` the system
 * actor below, and a dotted verb in the same convention a person's act uses.
 * db/036 made `staff_id` nullable and added `actor` beside it precisely so the
 * ledger never has to attribute a machine's act to a person — there is a CHECK
 * on the table that keeps the two columns honest about each other.
 */
export const POOL_STOCKING_ACTOR = "auto: pool-stocking";

/**
 * The `product_status` values a seeder ever writes, named once.
 *
 * `product_status` (db/002) is shared by dish, drink, menu, product, game and
 * bank_item, and `ingredient_pool.active_value` is where the DESK reads which
 * value means offered. A seeder writes the enum literal directly — it is
 * inserting into a known table with a known column — so the set is named here
 * rather than spelled into six INSERT statements that would have to be found
 * and changed together if the enum ever grew a fourth position.
 *
 * `RETIRED` was the third to arrive and it is the enum's own `discontinued`.
 * db/045 argues at length why that word rather than a new one: the value cannot
 * be added and used inside one transaction, and re-typing six pools' status
 * columns to spell one of them differently is a schema-wide migration wearing a
 * one-pool decision. What closes the gap between the word and the act is the
 * reason column beside it, never the word.
 */
export const LIVE = "active";
export const HELD = "draft";
export const RETIRED = "discontinued";

/**
 * THE MARKER THAT HOLDS A ROW BACK, spelled ONCE for the whole house.
 *
 * The hold-back is not an approval queue and there is no list of held slugs
 * anywhere. A row that must not go out CARRIES THE FOUNDER'S QUESTION IN ITS
 * OWN TEXT, and this string is how the question announces itself — to the
 * seeder that is about to write the row, to the migration that clears an
 * existing backlog, and to the curator reading the row at the desk, who cannot
 * miss it because it is inline in the prose she is already reading.
 *
 * A list would be a thing that falls out of date. Text cannot: delete the
 * question and the row goes out on the next run of the seeder that owns it.
 *
 * IT LIVES HERE BECAUSE TWO PLACES MUST MAKE THE SAME TEST. scripts/seed-bank
 * holds new rows with it, db/036 cleared the bank's backlog with it, and
 * db/038 cleared the games' — and a divergence between them would mean a row
 * the migration would have held and the seeder offers. It used to be a `const`
 * inside seed-bank; the second pool that needed it is what moved it.
 *
 * The SQL side cannot import this, so it spells the literal. Any migration
 * testing for it must write the same eleven characters, and it is worth
 * grepping for the string before changing it.
 */
export const FOUNDER_PENDING = "FOUNDER-PENDING";

/**
 * Does any of this row's own text carry a question with the founder's name?
 *
 * `texts` is whatever prose the row holds — one string per authored field,
 * nulls welcome. The caller decides WHICH fields count, because that differs
 * per pool and is a claim about where an author would write such a question;
 * the caller must also make sure the migration that clears its backlog reads
 * the same fields.
 */
export function carriesFounderQuestion(texts) {
  return texts.some(
    (text) => typeof text === "string" && text.includes(FOUNDER_PENDING)
  );
}

/**
 * One id for one run of one seeder, so the desk can group a deploy's work.
 *
 * The wall clock rather than a random id, because the value is read by a human
 * on /desk/stocked and "which run was that" is a question about WHEN. Two
 * seeders in one deploy get two runs on purpose: the feed's unit is "seed-dishes
 * put 41 dishes out", not "a deploy happened".
 */
export function stockingRun() {
  return new Date().toISOString();
}

/**
 * Refuse `--activate` by name.
 *
 * seed:menus, seed:drinks and seed:dishes each took the flag when `draft` was
 * the default; `active` is the default now, so the flag has nothing left to
 * mean. It is REFUSED rather than ignored: a flag that silently means nothing
 * is worse than one that is gone, because an old runbook, an old shell history
 * entry or an old habit still types it and still reads as if it controlled
 * something. Exiting here is the only way the person finds out.
 *
 * seed:bank never had the flag (its header argues why at length) and refuses it
 * too, for the same reason — it was silently ignored there before.
 */
export function refuseActivateFlag(seeder) {
  if (!process.argv.includes("--activate")) return;
  console.error(
    `[${seeder}] --activate is gone. Pool content stocks itself now: rows this ` +
      `seeder creates\nare live on the way in (db/036, CLAUDE.md rule 13), so ` +
      `the flag has nothing left to mean.\nWhat went live is at /desk/stocked, ` +
      `where one row or a whole run goes back to draft.\nA row that must NOT go ` +
      `live carries a founder-pending question in its own text; see\n` +
      `scripts/seed-bank.mjs for the only pool that has any today.`
  );
  process.exit(2);
}

/**
 * Record that a seeder — not a person — put a row in front of members.
 *
 * Called INSIDE the seeder's transaction, with the same client, so a row and
 * the record of it going live commit together or not at all. A published row
 * with no ledger entry is invisible to the veto, which is the one failure this
 * whole arrangement cannot afford.
 *
 * It does not swallow errors, unlike `recordAction` in src/lib/staff.ts. That
 * function is right to: a person's edit is worth more than the note about it.
 * Here the note is the ONLY thing standing between an auto-publish and nobody
 * ever knowing, so a ledger failure must roll the publish back with it.
 *
 * @param client   an open pg client, mid-transaction
 * @param table    the entity table: 'dish', 'drink', 'menu', 'bank_item'
 * @param id       the row's uuid
 * @param name     what to call it in the feed
 * @param seeder   'seed-dishes' — which script did it
 * @param run      `stockingRun()`, once per process
 * @param source   the authored document the row came out of
 */
export async function recordAutoPublish(
  client,
  { table, id, name, seeder, run, source }
) {
  await client.query(
    `insert into staff_action
       (staff_id, actor, action, entity_table, entity_id, summary, detail)
     values (null, $1, $2, $3, $4::uuid, $5, $6::jsonb)`,
    [
      POOL_STOCKING_ACTOR,
      // db/011's CHECK on `action`: dotted, lower case, past tense. db/036
      // writes 'dish.auto_published' and 'bank_item.auto_published'; a seeder
      // writing a different verb for the same event would split the feed.
      `${table}.auto_published`,
      table,
      id,
      `${name} — stocked by ${seeder}`,
      JSON.stringify({ run, seeder, source, created: true, went: "live" }),
    ]
  );
}

/**
 * IS THIS POOL STILL OFFERED, AND IF NOT, WHY NOT.
 *
 * `ingredient_pool` is the registry and rule 19 makes it the only truth about
 * what pools are; db/045 gave it `retired_at`, `superseded_by` and
 * `retirement_note` so it is also the only truth about which of them the house
 * still stocks. A seeder ASKS rather than knowing: the day the founder brings
 * the set menu back she clears one column, and the next deploy stocks live
 * again with no script to remember to edit.
 *
 * It throws on an unregistered pool rather than defaulting to "live". A seeder
 * pointed at a table the registry has never heard of is a seeder about to write
 * rows nothing can see, and guessing the friendly answer is how that stays
 * invisible.
 */
export async function poolRetirement(client, entityTable) {
  let rows;
  try {
    ({ rows } = await client.query(
      `select retired_at is not null as retired, retirement_note, superseded_by
         from ingredient_pool where entity_table = $1`,
      [entityTable]
    ));
  } catch (err) {
    // 42703 undefined_column. `preDeployCommand` always runs `npm run migrate`
    // first so this cannot happen on a deploy; it happens to a person pointing
    // a seeder at an older database, and the useful thing to say is which
    // migration is missing rather than which column.
    if (err && err.code === "42703") {
      throw new Error(
        `ingredient_pool has no retirement columns. Has db/045 been applied? ` +
          `Run npm run migrate first — the seeder reads the registry to decide ` +
          `what status a new row arrives in.`
      );
    }
    throw err;
  }
  if (rows.length === 0) {
    throw new Error(
      `ingredient_pool has no row for '${entityTable}'. The pool is not ` +
        `registered, so nothing downstream can see what this seeder writes. ` +
        `Check that the migration calling install_revelle_ingredients ran.`
    );
  }
  return {
    retired: rows[0].retired,
    note: rows[0].retirement_note,
    supersededBy: rows[0].superseded_by,
  };
}

/**
 * WHAT STATUS A NEW ROW ARRIVES IN, AND THE WORDS THAT TRAVEL WITH IT.
 *
 * The whole of the decision, in one place, so it can be TESTED rather than
 * inspected. It was a ternary inside a seeder's INSERT for about an hour, and
 * the guard written over it could not fail — a test that reads a source file
 * for a token is testing a spelling, and the spelling next to it was enough to
 * keep the test green while the behaviour was reverted. CLAUDE.md rule 21's
 * closing paragraph, learned again: break it deliberately and watch it go red
 * before you believe it.
 *
 * @param pool  a `poolRetirement()` result
 * @returns `{ status, retirementNote }` — pass both straight into the insert.
 */
export function stockingStatus(pool) {
  if (!pool.retired) return { status: LIVE, retirementNote: null };
  if (!pool.note || pool.note.trim() === "") {
    // db/045's `ingredient_pool_retired_has_reason` should make this
    // unreachable. It is checked anyway because the alternative is writing
    // rows out of the catalogue with nothing on them saying why — an
    // adjudication with the opinion torn off, which is the failure rule 17
    // exists to prevent, arriving through the one door the CHECK does not
    // cover: a database older than the constraint.
    throw new Error(
      "this pool is retired and carries no reason. Refusing to write rows " +
        "out of the catalogue with nothing saying why (CLAUDE.md rule 17)."
    );
  }
  return { status: RETIRED, retirementNote: pool.note };
}

/**
 * Record that a seeder created a row INTO A RETIRED POOL.
 *
 * The sibling of `recordAutoPublish`, and a separate function rather than a
 * flag on that one, because the two record opposite events and a function
 * called `recordAutoPublish` that can record a non-publish is a name that
 * lies. /desk/stocked filters the feed on `actor <> 'staff'` rather than on the
 * verb, so both land in the same audit feed — which is right: a row arriving
 * retired is exactly as much a thing the founder should be able to see as a row
 * arriving live.
 *
 * `went: "retired"` in the detail, so the feed can tell the two apart without
 * parsing a sentence, and the pool's own reason travels with it.
 */
export async function recordAutoRetired(
  client,
  { table, id, name, seeder, run, source, reason }
) {
  await client.query(
    `insert into staff_action
       (staff_id, actor, action, entity_table, entity_id, summary, detail)
     values (null, $1, $2, $3, $4::uuid, $5, $6::jsonb)`,
    [
      POOL_STOCKING_ACTOR,
      // Same convention as the verb above: dotted, lower case, past tense.
      // db/045 writes 'menu.retired' for the rows it moved; this is the same
      // event arriving by the other door, so it is the same verb.
      `${table}.retired`,
      table,
      id,
      `${name} — created into a retired pool by ${seeder}`,
      JSON.stringify({
        run,
        seeder,
        source,
        created: true,
        went: "retired",
        retirement_note: reason,
      }),
    ]
  );
}
