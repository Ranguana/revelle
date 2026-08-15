/**
 * The vocabulary the two authored catalogue documents share.
 *
 *   docs/menus.md   -> scripts/seed-menus.mjs
 *   docs/drinks.md  -> scripts/seed-drinks.mjs
 *
 * ─────────────────────────────────────────────────────────────────────
 * WHY THIS FILE EXISTS
 *
 * The two documents are one drop. They name the same thirteen destinations and
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
 * menus say "actually made" and the drinks say "actually mixed"; they are one
 * axis and two sets of words, and the words belong to the pool that speaks
 * them. Each seeder carries its own three phrases, right beside the parser that
 * matches them.
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
  "Cap Ferrat": "cap-ferrat",
  "Côte d'Azur": "cote-dazur",
  Vegas: "las-vegas",
  Catskills: "catskills",
  Dolomites: "dolomites",
  Tahiti: "tahiti",
  Havana: "havana",
  "Big Sur": "big-sur",
  "New Orleans": "new-orleans",
  Portofino: "portofino",
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
 * A NEW WORDING IS A DECISION AND NOT A DEFAULT. Both seeders fail loudly and
 * name the line rather than guessing, which is the only behaviour that keeps a
 * seed from quietly inventing content.
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
 * @returns {{ id: string, slug: string, created: boolean }}
 */
export async function ensureWorld(client, heading, by) {
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
    [slug, heading, `${STUB_NOTE} Created by ${by}.`]
  );
  return { id: rows[0].id, slug, created: true };
}
