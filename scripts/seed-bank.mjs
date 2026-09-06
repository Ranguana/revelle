#!/usr/bin/env node
/**
 * Put the authored atmosphere bank into the database.
 *
 *   npm run seed:bank
 *   npm run seed:bank -- --dry-run    parse and REPORT, touch no database
 *   npm run seed:bank -- --overwrite  let the file beat the curator's edits
 *
 * The sibling of scripts/seed-dishes.mjs and scripts/seed-drinks.mjs,
 * deliberately: same refusal to guess, same rule that a curator's edit at the
 * desk outranks the file, same shared vocabulary in
 * scripts/catalogue-vocabulary.mjs rather than a second copy of the destination
 * map, same "left as the desk has it" reporting. Read seed-dishes' header for
 * the argument; only the differences are written out here, and there are seven
 * of them.
 *
 * ─────────────────────────────────────────────────────────────────────
 * 1. THE HOLD-BACK IS THE ROW'S OWN TEXT, NOT A FLAG AND NOT A QUEUE
 *
 * THE OLD RULE, KEPT WHOLE. This section used to be headed "THERE IS NO
 * `--activate`, AND THAT IS NOT AN OVERSIGHT", and it read:
 *
 *   "Every other pool seeder has one. This one does not, on the founder's
 *    instruction for this drop, verbatim: 'Everything is created as
 *    status = draft. No exceptions.' The bank is a brainstorm consolidated in
 *    one pass; nothing in it has been costed, sourced or legally read, and
 *    three of its lines are open questions with the founder's name on them.
 *    CLAUDE.md rule 8 already says activation is a human gesture — here the
 *    flag is absent as well, so that not even a typo in a deploy can offer a
 *    draft to a member. Activation happens at the desk."
 *
 * WHAT BEAT IT, AND WHAT DID NOT. db/036 and CLAUDE.md rule 13 make bank items
 * a POOL CLASS: they stock themselves on deploy and the founder vetoes at
 * /desk/stocked rather than consenting row by row. Rule 8 was right about what
 * it protected — a world, a voice, a claim about how the house speaks — and
 * wrong about its scope. 180 rows sat behind a signature that adds nothing,
 * because nobody reads 180 party favours to decide whether a party favour may
 * exist.
 *
 * BUT THE REAL ARGUMENT IN THAT PARAGRAPH SURVIVES INTACT, and it is the last
 * sentence of it: three of these lines are OPEN QUESTIONS WITH THE FOUNDER'S
 * NAME ON THEM. Those do not go live, and the way they are held back is the
 * part worth reading twice:
 *
 *   AN ITEM CARRYING A FOUNDER-PENDING QUESTION STAYS DRAFT, AND IT KNOWS WHO
 *   IT IS BECAUSE SECTION 7 BELOW WROTE THE QUESTION INTO ITS DESCRIPTION.
 *
 * There is no second list of held-back slugs anywhere — not in this file, not
 * in a table, not in db/036, which does the same thing with the same test
 * (`description not like '%FOUNDER-PENDING%'`). A list would be a thing that
 * falls out of date the day somebody edits the ledger; the marker cannot,
 * because it IS the content. Answer the question, remove the marker from the
 * row at the desk, and the item becomes ordinary — that is the whole mechanism.
 *
 * `--activate` is still absent, and is now REFUSED BY NAME rather than silently
 * ignored: it did nothing here before and it would do nothing now, and a flag
 * that silently means nothing is worse than one that says so and exits.
 *
 * ─────────────────────────────────────────────────────────────────────
 * 2. `--dry-run` EXISTS BECAUSE THE DATABASE IS UNREACHABLE
 *
 * render.yaml sets `ipAllowList: []`, so no laptop can connect and CLAUDE.md
 * rule 9 forbids pointing a person at something that cannot be run. A parser
 * for a 385-line prose document is exactly the kind of code that must be
 * readable BEFORE it writes, so `--dry-run` prints every row it would create,
 * every gesture it would set, every food and drink line it would route, and —
 * the part that matters most — every clause it could NOT classify.
 *
 * The report is the deliverable of a dry run. Read the UNCLASSIFIED section
 * first: it is the list of places where this script refused to guess.
 *
 * ─────────────────────────────────────────────────────────────────────
 * 3. ROUTE BY HEADER. THE DOCUMENT SAYS SO AT THE TOP AND IT IS RIGHT.
 *
 * docs/atmosphere-idea-bank-v1.md opens with ROUTING RULES, and they are the
 * whole parser:
 *
 *   GOODS:                  -> bank_item kind `good`
 *   HOST ACTS:              -> bank_item kind `host_act`
 *   GAMES: / GAMES/BOOKINGS -> bank_item kind `game`
 *   GESTURE: or "(GESTURE)" -> world.gesture / world.gesture_note, NOT a row
 *   ROUTE TO DISH POOL:     -> the dish pool. Not the bank. Emitted, see 6.
 *   ROUTE TO DRINK PROGRAM: -> the drink program. Not the bank. Emitted.
 *
 * Printed matter named anywhere becomes `printed_card` regardless of the header
 * it sits under, which is the one place the header does not decide — a rules
 * card listed among GOODS is still a card. The vocabulary that makes that call
 * is PRINTED_MATTER below, one phrase per line, argued where it is a judgement.
 *
 * AN UNKNOWN BLOCK LABEL IS AN ERROR, NOT A SKIP, exactly as an unknown `##`
 * heading is in seed-dishes. A label nobody has mapped is a paragraph of the
 * founder's thinking that would otherwise vanish silently, and silence is the
 * failure this house cares about.
 *
 * ─────────────────────────────────────────────────────────────────────
 * 4. THE GESTURE IS NOT IN THE BANK, AND THIS IS WHERE IT COULD BE LOST
 *
 * db/031 puts gestures on `world` and says why: "an invariant in a pool of
 * variables eventually gets left out of a package." So a clause carrying the
 * token GESTURE produces NO bank row at all — Westhampton's only host act is
 * its gesture, and Westhampton therefore contributes zero `host_act` rows. That
 * looks like a parser that lost a line and is not one; it is reported as such
 * on every run so the two can never be confused.
 *
 * Where a gesture clause ALSO names shippable matter — Dolomites' genepì pour
 * carries a kit at min_lead_days ~40, a bought fallback and a story card inside
 * the same sentence — nothing is extracted. Pulling a good out of the middle of
 * an invariant is precisely the guess this script does not make. It is REPORTED
 * under UNCLASSIFIED with the whole sentence, for a person to split by hand.
 *
 * ─────────────────────────────────────────────────────────────────────
 * 5. NAMES COME FROM HER PUNCTUATION, AND NOTHING IS EVER DISCARDED
 *
 * She writes an item as `<the thing> — <what it is>`, consistently, across all
 * eighteen rooms: "TOMBOLA KIT — tombolone board, wooden tokens…", "the conch
 * (pū) — object + act, lives on her shelf after". So:
 *
 *   name        = the clause, parentheticals removed, cut at the first em dash
 *   description = THE CLAUSE VERBATIM, whole, in her punctuation
 *
 * The name is a handle and the description is the record. Nothing the parser
 * shortens is lost, because the un-shortened line is in the row beside it. A
 * clause containing an ellipsis is the one exception: "oyster... no — pasta
 * board" is the founder changing her mind mid-line, and a machine that resolves
 * that is a machine inventing content. It creates no row and reports the line.
 *
 * ─────────────────────────────────────────────────────────────────────
 * 6. FOOD AND DRINK ARE EMITTED FOR A HUMAN, NOT WRITTEN INTO THE DOCUMENTS
 *
 * The brief allowed either. Emitting is right, for four reasons, and the fourth
 * is the one that decides it:
 *
 *   · THE LINES ARE NOT DISHES. "second-pot timing ritual", "supper-expands
 *     register", "NO descent (afternoon room)", "the pot (existing)" are notes
 *     ABOUT a pool, not entries in one. docs/dishes.md holds `- <name> ·
 *     <B|H|M>` and every line must carry a making level; none of these does,
 *     and inventing one is the guess seed-dishes refuses by name ("a new
 *     wording is a decision, not a default").
 *   · SIX ROOMS HAVE NO SECTION TO WRITE INTO. Amalfi, Oaxaca, Acapulco, St.
 *     Moritz, Aspen and Palm Springs appear in neither docs/dishes.md nor
 *     docs/drinks.md, and docs/needs-a-human.md §C already books Amalfi's fifty
 *     dishes as founder WRITING. Opening a section with three lines in it would
 *     turn "not written yet" into "written, and short".
 *   · THE MANIFEST WOULD HAVE TO LIE. seed-dishes' PER_DESTINATION exists so a
 *     count can never move unwatched. Adding rooms to it in the same commit
 *     would bless a number nobody authored as the expected count.
 *   · EVERY DRINK NEEDS A MIRROR. docs/drinks.md's guarantee is that "nobody at
 *     the table is visibly not drinking", and seed-drinks "fails rather than
 *     writing a drink whose mirror is missing or blank". The bank supplies no
 *     mirrors. There is no honest way to write these lines into that file, and
 *     a half-written entry would break the one promise the file makes.
 *
 * So the run prints a ROUTED-OUT section, per room, per destination heading,
 * grouped by whether the line names a dish or describes the pool — ready to
 * paste, with the manifest edit named. A person decides; that is the point.
 *
 * ─────────────────────────────────────────────────────────────────────
 * 7. THE FOUNDER-PENDING LEDGER IS ATTACHED, NEVER SKIPPED
 *
 * The founder: "flag every item on the founder-pending ledger as
 * draft-with-question rather than skipping it."
 *
 * So each of the ten ledger lines is matched to the room it names and to the
 * item it is about, and the line goes VERBATIM into that item's description
 * behind a `FOUNDER-PENDING —` marker, where a curator reviewing the row cannot
 * miss it. Three of the ten are not about a bank item at all — a matrix row
 * re-run, a bench with no material in it yet, and a product-level question
 * about children — and those are reported by name with the reason no row is
 * their right home. Inventing a `good` called "Westhampton bench provisional"
 * would put a non-item in a pool selection reads from, which is the same
 * mistake db/031 refuses for gestures.
 *
 * ─────────────────────────────────────────────────────────────────────
 * 8. THE DESTINATION IS A CLAIM NOW, AND THE SLOT IS NOT THIS FILE'S BUSINESS
 *
 * db/043 replaced `bank_item.world_id` with `bank_item_world`, carrying
 * `native` and `affinity` like every other pool. So the insert below no longer
 * writes a world column and `claimDestination` writes the native row instead.
 * Same content, same room, one less special case.
 *
 * THE SLOT — which of the four named atmosphere slots an item lands in — IS
 * DELIBERATELY ABSENT FROM THIS FILE, and its absence is the mechanism.
 *
 * The obvious place to classify was right here: this parser already knows the
 * document's GOODS / HOST ACTS / GAMES headers and could map them. It must
 * not, for two reasons.
 *
 *   · THE HEADERS ANSWER A DIFFERENT QUESTION. GOODS/HOST ACTS/GAMES say who
 *     performs a thing, which is `bank_kind` and is already a column. A slot
 *     says where it lands in the evening. The lanterns and the lighting of
 *     them are both the light; the header separates them and the slot must
 *     not.
 *   · TWO IMPLEMENTATIONS OF ONE RULE IS THE db/040 FAILURE. A rule written
 *     here and again in a migration drifts, and the drift is silent: the next
 *     sync quietly undoes the migration's classification and nothing reports
 *     it. So the rule is a SQL function — `bank_item_default_slot()` — and
 *     db/043 hangs an AFTER INSERT trigger on `bank_item` that applies it.
 *     This seeder inserts a row and the claim appears. There is nothing for
 *     the two to disagree about, which is stronger than agreeing today.
 *
 * The consequence worth knowing when you read a dry run: the report below says
 * nothing about slots, because this script genuinely does not decide them. To
 * see what a row was classified as, read `bank_item_card.slot_code`.
 *
 * 9. THE EVENING SUPPLIES IT — db/044, AND WHY THE RULE IS *HERE* THIS TIME
 *
 * db/044 added the founder's third category: an item the night produces rather
 * than one the house ships. A row in it carries `supply = 'evening_supplied'`,
 * a `take_home_quantity` of per_guest or single_artifact, a compulsory
 * `supply_note`, and zero or more `bank_item_dependency` rows — a SLOT it
 * watches plus a PREDICATE asked of whatever filled that slot.
 *
 * Section 8 above says a classification rule belongs in SQL, and this one does
 * the opposite. The difference is the number of callers, not a change of mind.
 * db/043 had to classify 180 EXISTING rows and every later insert, so it had
 * two callers and needed one shared implementation. db/044 backfills nothing —
 * every row in the bank today is stocked, on the document's own routing rule —
 * so `supply` has exactly ONE writer, which is this file, and there is no
 * second implementation for it to drift from. A trigger here would be a rule
 * with one caller wearing the costume of a rule with two.
 *
 * IT IS READ FROM THE CONTENT, NOT INFERRED FROM IT. The clause says
 *
 *     THE EVENING SUPPLIES IT (per guest; from the_drinks yields_cork)
 *     THE EVENING SUPPLIES IT (one guest only; from game yields_prize)
 *     THE EVENING SUPPLIES IT (per guest; from the night itself)
 *
 * — the founder's own phrase for the category, so the marker reads as English
 * in the document a person reads, exactly as FOUNDER-PENDING does. The two
 * identifiers are machine names on purpose: this file does NOT keep a list of
 * slot codes or supplies codes to check them against (rule 19). db/044 gives
 * `bank_item_dependency` real foreign keys to `slot_kind` and `supplies_tag`,
 * so a typo is a failed insert naming the bad code, and the registry stays the
 * only truth. A dry run can only check the SHAPE, and says so.
 *
 * `ships` GOES FALSE, and the database also refuses the alternative.
 * db/044's CHECK forbids an evening-supplied row that claims to ship, so the
 * two facts are declared twice and disagreement is an error rather than a
 * silent correction. Every such row is listed in the report under its own
 * heading; nothing is set quietly.
 *
 * ─────────────────────────────────────────────────────────────────────
 * 10. `Also at:` — ONE ITEM, TWO ROOMS, WITHOUT A SECOND COPY OF IT
 *
 * THE FACT THIS SECTION EXISTS TO STATE, because it has now been misread
 * three times in one week — once in a report, once in a ruling, and twice as
 * two rows that were written and do nothing:
 *
 *   AFFINITY RE-WEIGHTS SCORING FOR ALREADY-ELIGIBLE CANDIDATES; IT NEVER
 *   CONFERS ELIGIBILITY — SHARING REQUIRES A SECOND NATIVE ROW.
 *
 * `claimEligibility` (src/lib/selection/occasion.ts) reads a native row as a
 * WHITELIST: any `native` row makes an item eligible for its native rooms AND
 * NO OTHERS. A row that is not native and not forbidden IS NOT A CLAIM AT
 * ALL — `affinity` is the additive term stage 4 scores with (fill.ts:461) and
 * says nothing whatever about eligibility. So "native to Côte d'Azur, affinity
 * to Big Sur" does not make the item available at Big Sur. It makes it
 * available at Côte d'Azur, and adds a number that nothing at Big Sur will
 * ever get to use, because the item never clears the gate there.
 *
 * That mechanism is correct and load-bearing — it is what keeps a game scoped
 * to Westhampton at +0.4 playable everywhere else. It is not a bug. It just
 * answers a different question than its name suggests, which is why the fact
 * is stated here rather than left to be re-derived.
 *
 * THE INSTRUMENT. db/043 made the room a join rather than a column precisely
 * so a shared lantern would stop being six hand-authored lanterns — and then
 * the document had no way to say it, so the debt stayed. This is the way:
 *
 *   the loose dried aromatic — take-home, … (Also at: Big Sur)
 *   (FOUNDER-PENDING — …)
 *
 * A depth-0 parenthetical of the clause, reading `Also at: <destination>,
 * <destination>`. The LINE is verbatim docs/drinks.md's, where seed-drinks
 * parses the same words out of a sixth bullet; only the delimiter differs,
 * because a bank record is one semicolon-delimited clause and not five
 * bullets. Each name is a key of DESTINATIONS in
 * scripts/catalogue-vocabulary.mjs — the short name, "Big Sur", never the room
 * heading "BIG SUR, 1971", whose comma would be read as a list separator.
 *
 * Each name becomes another `native = true` row. Not an affinity weight: this
 * file has never known how strongly an item leans toward a room, and a number
 * invented here would be a weight nobody authored driving a score nobody
 * checks — which is the failure above, wearing the other hat.
 *
 * IT SHARES THE WHOLE ITEM, VERBATIM — the name, the description, the phase,
 * the cards riding with it. There is one row and it is claimed twice; there is
 * no per-room text and there cannot be one, because the row IS the text. So an
 * item whose words name its own room cannot travel: "the Oaxacan recipe in the
 * house's hand" arrives at Aspen still saying Oaxaca. Where the two rooms
 * genuinely need different words, that is TWO ROWS, authored separately, and
 * the founder decides it — an `Also at:` line is not a way to avoid making
 * that call.
 *
 * WHAT GETS WRITTEN AND WHEN, which is two rules and not one:
 *
 *   THE HOME ROOM — the heading the clause sits under — is written only where
 *     the item has NO native claim at all. Unchanged from db/043 and for its
 *     reason: moving a lantern from Positano to Amalfi is a curator's decision
 *     and the file must not undo it on the next deploy.
 *
 *   AN `Also at:` ROOM is written whenever that PAIR has no row, even where
 *     the item already carries native claims — otherwise a line added to an
 *     item that already exists in the database would do nothing at all, on
 *     every deploy, silently, which is the entire failure this section is
 *     about. It is the treatment `claimDependencies` already gives a
 *     dependency and for the same argument: this is a conjunction the ITEM
 *     declares about itself, not a single fact the desk owns, and the desk has
 *     no gesture today that means "drop one of two rooms" — its editor has one
 *     select, which can only choose a home. THE DAY THE DESK GROWS A
 *     MULTI-ROOM EDITOR THIS GUARD MUST CHANGE, or a removal there will be
 *     re-added here.
 *
 *   AN EXISTING NON-NATIVE ROW FOR THE PAIR IS UPGRADED to native rather than
 *     left alone. `on conflict do nothing` would leave the inert affinity row
 *     inert and report a claim it did not make. A `forbidden` row is NOT
 *     upgraded — a veto that can be outvoted is not a veto — and the collision
 *     is a hard failure naming the item, never a silent skip.
 *
 * KNOWN, AND NOT FIXED HERE: src/app/desk/(signed-in)/bank/actions.ts saves
 * the item form with `delete from bank_item_world where native and world_id <>
 * $2`, so saving ANY edit to a shared item at the desk destroys its second
 * claim. That form was written when an item had exactly one room. It is
 * reported at the end of every run that writes a second claim, and it is
 * booked in docs/needs-a-human.md; it is a screen, and a screen is a person's
 * call.
 *
 * ─────────────────────────────────────────────────────────────────────
 * 11. A GAME IS NOT A HEADING — ROUTE BY CONTENT, WITH A NAMED RULING
 *
 * SECTION 3 ABOVE IS KEPT WHOLE AND IS STILL RIGHT ABOUT WHAT IT PROTECTED.
 * It reads "ROUTE BY HEADER. THE DOCUMENT SAYS SO AT THE TOP AND IT IS RIGHT",
 * and for GOODS / HOST ACTS / GESTURE / ROUTE TO … it is: those labels say who
 * performs a thing and the label is the founder's own word for it.
 *
 * WHAT BEAT IT, counted rather than argued: only THREE rooms of eighteen ever
 * wrote a `GAMES:` heading with content in them, and the parser produced
 * exactly three `game` rows in the whole catalogue. Meanwhile the document
 * names a game inside a `GOODS:` line in TWELVE rooms — the dice cups and the
 * liar's-dice rules card at Vegas, the double-nine dominoes at Havana, the
 * tombola kit at Amalfi, the Bingo kit and the gin deck at Catskills, the
 * cribbage board at Nantucket, the backgammon board at St. Moritz. Every one
 * of those was filed `good` or `printed_card` and no room but three had a game
 * at all. The founder, on being shown the count: "fix the parser so the games
 * become rows."
 *
 * The header did not lie. IT ANSWERED A DIFFERENT QUESTION THAN IT APPEARED TO
 * (CLAUDE.md rule 23): `GAMES:` is a block she wrote when she had a game to
 * list SEPARATELY, and its absence is not a claim that the room has none — the
 * game was in the goods line, because that is where the object is.
 *
 * ── WHY A RULING TABLE AND NOT A MARKER, AND NOT A MATCHER ───────────
 *
 * Three mechanisms were available and the file already contains the argument
 * that decides between them.
 *
 *   A PER-CLAUSE MARKER in the document — `(GAME)` beside `(GESTURE)` — is the
 *     channel this document uses for everything said ABOUT an item, and it
 *     would have been the obvious answer. IT IS REFUSED BY THE DOCUMENT
 *     ITSELF. The provenance header says "everything above the second `GOODS:`
 *     line in each room is v1 as she blessed it, unaltered", and the phase
 *     rulings below say why that matters: "this is a v1 and is not edited to
 *     make a seeder come out right — rewriting the record to move a tag would
 *     destroy the only evidence of what the tag was derived FROM." Marking her
 *     clauses would make the derivation unfalsifiable, because the document
 *     would then say what the parser needed it to say.
 *
 *   CONTENT MATCHING — a vocabulary of game words, the way PRINTED_MATTER is a
 *     vocabulary of printed things — is refused by CLAUDE.md rule 24 and by
 *     one concrete row. Vegas's Celebrity deck is described as "~80 printed
 *     marquee-ticket slips + draw vessel + fishbowl three-round rules": a
 *     matcher looking for game words has to hit "fishbowl" without hitting
 *     "bowl", and a matcher looking for "deck" hits four PLAYING-card decks
 *     that are goods and one prompt deck that is a game. That is the hyphen
 *     incident waiting to happen — 'take home' against `take-home`, 143 of 152
 *     rows misfiled with every check green.
 *
 *   A RULING TABLE KEYED BY SLUG is what the file already does for the one
 *     other case where a PERSON decided something the document does not say:
 *     PHASE_RULINGS. Its argument transfers unchanged. "Derivation stays
 *     honest, and a ruling sits beside it in the open, named, dated, and
 *     printed on every run. Two authorities, never one pretending to be the
 *     other." So GAME_ROUTINGS below is twenty named rows, each carrying the
 *     kind the document DERIVES (`was`), the kind the ruling gives it, and the
 *     words in the clause that are the evidence. A row that no longer exists
 *     fails the run; a row whose derived kind has moved fails the run. It can
 *     match 20 of 20 or it can fail. It cannot quietly match nine.
 *
 * ── THE OBJECT-VERSUS-GAME SPLIT, DECIDED ────────────────────────────
 *
 * Several clauses are more than one thing at once. "Leather dice cups + five
 * dice each + liar's-dice rules card" is a physical object, a printed card and
 * a game in one sentence. THE RULE, and it needs no new machinery because the
 * file already had half of it:
 *
 *   ONE CLAUSE YIELDS ONE ROW OF ITS OWN KIND, PLUS THE CARDS THAT RIDE WITH
 *   IT. A card is already pulled out as its own `printed_card` row by
 *   `extractCards`, and that stays exactly as it was — the liar's-dice rules
 *   card, the Watten/briscola card, the scopa card and the Conquián card are
 *   cards, riding with a game. What CHANGES is the kind of the thing they ride
 *   with: the cups-and-dice are not a good with a card, they are A GAME with a
 *   card. This is IS_A_KIT's argument one level up — "a kit is a good even
 *   when it contains printed matter" becomes "a game is a game even when it
 *   contains an object and a card", and for the same reason: the boxed thing
 *   ships as one line and filing it by its packaging misfiles the board, the
 *   tokens, the beans and the five wrapped prizes with it.
 *
 * A CLAUSE IS NEVER SPLIT INTO TWO ROWS OF DIFFERENT KINDS HERE. Where a
 * clause names an object AND a distinct activity somebody else performs on it,
 * THE ACTIVITY IS A MISSING AUTHORED LINE AND IS REPORTED AS ONE. The founder's
 * audit put it exactly: at New Orleans "the deck is a good, the reading is a
 * game and has no row." Pulling the reading out of the middle of the deck's
 * sentence is the same guess section 4 refuses for a gesture that also names a
 * kit. So `new-orleans-tarot-deck-out` stays a good and the reading is booked
 * as an absence, and `big-sur-thoth-tarot-deck-out` stays a good because its
 * clause says "object only, no reader" in her own words — positive evidence
 * that it is NOT a game, which is rule 3 working in the direction nobody
 * expects.
 *
 * WHAT THE DOCUMENT MUST THEREFORE CONTAIN, said plainly because this decision
 * changes it: for a game to exist as playable content rather than as a shipped
 * object, SOMEBODY HAS TO WRITE THE LINE. Twelve rooms now have a `game` row
 * for the object on the shelf. The reading at New Orleans, the naming game
 * Westhampton's sealed score is the residue of, and the seventeen other games
 * that live only in `src/lib/destinations.ts` as `piece: "game_rule"` are
 * authoring, not parsing, and the report names them every run.
 *
 * ── "LET'S NOT MAKE A BLANKET RULE THAT A ROOM IS GAMELESS" ──────────
 *
 * The founder's second instruction, and the harder one. Two rooms declare
 * `GAMES: none` — Tahiti "none, on purpose" and Acapulco "none — the band, the
 * window, and the dancing are the shelf" — and BOTH CONTRADICT THEMSELVES
 * ELSEWHERE: each carries a `piece: "game_rule"` in `src/lib/destinations.ts`,
 * written in the room's own voice.
 *
 * So `none` produces NO ROW, NO COLUMN AND NO NEGATIVE CLAIM. It never has and
 * it now says so: `readClause` returns `declined`, the run reports the line
 * under its own heading, and nothing anywhere records that a room HAS no game.
 * That is not a happy accident to be left unwritten — it is the mechanism, and
 * the report states it on every run so that nobody later "completes" it by
 * writing the fact down. A room whose document says none can receive a game
 * the moment somebody names one, in a `GAMES:` block or in this table, without
 * touching the parser.
 *
 * The two contradictions are RULINGS OWED. The voice record and the bank
 * record disagree and only the founder can say which is right; this file
 * reports them on every run, docs/proposals.md books them under 2026-08-27,
 * and neither resolves them.
 *
 * ─────────────────────────────────────────────────────────────────────
 * Same connection rules as scripts/migrate.mjs. Needs DATABASE_URL unless
 * --dry-run.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import pg from "pg";

import {
  DESTINATIONS,
  FOUNDER_PENDING,
  HELD,
  LIVE,
  ROOM_HEADINGS,
  carriesFounderQuestion,
  ensureWorld,
  recordAutoPublish,
  refuseActivateFlag,
  stockingRun,
} from "./catalogue-vocabulary.mjs";

const SOURCE = fileURLToPath(
  new URL("../docs/atmosphere-idea-bank-v1.md", import.meta.url)
);
const SOURCE_NAME = "docs/atmosphere-idea-bank-v1.md";
const DISHES_DOC = fileURLToPath(new URL("../docs/dishes.md", import.meta.url));
const DRINKS_DOC = fileURLToPath(new URL("../docs/drinks.md", import.meta.url));

refuseActivateFlag("seed-bank");
const dryRun = process.argv.includes("--dry-run");
const overwrite = process.argv.includes("--overwrite");

/** One id for this run, so /desk/stocked can group what it put out. */
const RUN = stockingRun();

/**
 * Does this row carry a question with the founder's name on it?
 *
 * The same test db/036 makes in SQL (`description not like '%FOUNDER-PENDING%'`)
 * and it must stay the same test: the migration cleared the backlog with it and
 * this seeder holds new rows with it, so a divergence would mean a row that the
 * migration would have held and the seeder offers.
 *
 * THE MARKER ITSELF USED TO BE A `const` RIGHT HERE, and it moved to
 * scripts/catalogue-vocabulary.mjs when seed-games became the second pool that
 * needed it (db/038). The argument for spelling it once did not change — it is
 * the only hold-back list there is and it lives in the content rather than
 * beside it, per section 1 — it just now has two readers instead of one.
 *
 * Section 7 writes it into the description of every item a ledger entry names,
 * which is why only `description` is read here.
 */
function isHeldBack(row) {
  return carriesFounderQuestion(row.description);
}

/**
 * THE DESTINATION, AS A CLAIM RATHER THAN A COLUMN — db/043, section 8 above.
 *
 * The HOME room is written only where the item claims NO destination at all,
 * which is the same shape as `gesture = coalesce(gesture, $2)` at the bottom of
 * this file and the same reason: the desk outranks the file for a curator's
 * decision, and moving a lantern from Positano to Amalfi is one. An
 * `on conflict do nothing` alone would not do — it would re-add the room she
 * had just removed, silently, on the next deploy.
 *
 * `native` because that is what `bank_item.world_id` meant, and because
 * `native` is the only thing that grants eligibility at all. `affinity` stays
 * at the default 0.000: the file has never said how strongly an item leans
 * toward a room it was not written for, and a number invented here would be a
 * weight nobody authored driving a score nobody checked.
 *
 * Returns the world ids it actually wrote a claim for, so the report can say
 * which second claims landed and which were already there.
 */
async function claimDestination(client, bankItemId, worldId, alsoWorldIds = []) {
  const written = [];

  const { rowCount } = await client.query(
    `insert into bank_item_world (bank_item_id, world_id, native, note)
     select $1, $2, true, $3
      where not exists (select 1 from bank_item_world
                         where bank_item_id = $1 and native)`,
    [
      bankItemId,
      worldId,
      `Written for this destination in ${SOURCE_NAME}, by seed-bank.`,
    ]
  );
  if (rowCount > 0) written.push(worldId);

  // SECTION 10. A second room is not governed by the guard above: an item that
  // already carries its home claim would otherwise never gain a claim the file
  // added afterwards, which is the whole point of the line.
  //
  // `do update` rather than `do nothing`, and the difference is the section's
  // entire subject: a pre-existing row for this pair that is NOT native is an
  // affinity weight, and an affinity weight is not a claim. Leaving it would
  // report a share that the eligibility gate does not honour. `where not
  // forbidden` protects the veto, and the check after it turns the one case
  // this cannot resolve into a failure with the item's name in it.
  for (const alsoId of alsoWorldIds) {
    const { rows: before } = await client.query(
      `select native, forbidden from bank_item_world
        where bank_item_id = $1 and world_id = $2`,
      [bankItemId, alsoId]
    );

    if (before.length > 0 && before[0].forbidden) {
      throw new Error(
        `an "Also at:" line claims a destination this item is already ` +
          `FORBIDDEN at (bank_item ${bankItemId}, world ${alsoId}). A veto ` +
          `that can be outvoted is not a veto, so the claim was refused ` +
          `rather than written over it. Remove one of the two — the line in ` +
          `${SOURCE_NAME} or the forbidden row at the desk.`
      );
    }
    if (before.length > 0 && before[0].native) continue;

    await client.query(
      `insert into bank_item_world (bank_item_id, world_id, native, note)
       values ($1, $2, true, $3)
       on conflict (bank_item_id, world_id) do update
          set native = true, note = excluded.note
        where not bank_item_world.forbidden`,
      [
        bankItemId,
        alsoId,
        `Also at this destination, per the "Also at:" line in ${SOURCE_NAME}, ` +
          `by seed-bank. A second NATIVE claim: affinity would not make the ` +
          `item eligible here.`,
      ]
    );
    written.push(alsoId);
  }

  return written;
}

/**
 * WHAT THE EVENING HAS TO DO — db/044, section 9 above.
 *
 * `on conflict do nothing` and nothing else, which is deliberately WEAKER than
 * claimDestination's guard. There the file must not re-add a room a curator
 * removed, because `world_id` was a single fact and re-adding it undoes her.
 * Here a dependency is a conjunction the item declared about itself — a cork
 * needs bottles whatever a curator thinks — and the desk's move is to fix the
 * CONTENT rather than to delete the row's reason for existing. So the file
 * re-asserts what it said and adds nothing it did not say; a dependency the
 * desk added is left alone because this only ever inserts.
 *
 * Both codes go in unvalidated by this file, on purpose. db/044's foreign keys
 * to `slot_kind` and `supplies_tag` are the check, so a typo fails the insert
 * naming the bad code — and a list of valid codes kept here would be the
 * hand-written copy of a registry that CLAUDE.md rule 19 is entirely about.
 */
async function claimDependencies(client, bankItemId, dependencies) {
  for (const dependency of dependencies) {
    await client.query(
      `insert into bank_item_dependency (bank_item_id, slot_code, supplies, note)
       values ($1, $2, $3, $4)
       on conflict (bank_item_id, slot_code, supplies) do nothing`,
      [
        bankItemId,
        dependency.slotCode,
        dependency.supplies,
        `Declared by the clause in ${SOURCE_NAME}, by seed-bank.`,
      ]
    );
  }
}

/** Kept in sync with the same function in scripts/migrate.mjs and src/lib/db.ts. */
function needsSsl(url) {
  if (/sslmode=disable/.test(url)) return false;
  return !/@(localhost|127\.0\.0\.1|\[::1\])/.test(url);
}

function fail(message) {
  console.error(`\n[seed-bank] FAILED: ${message}`);
  process.exit(1);
}

/* ── the document's own vocabulary ───────────────────────────────────
 *
 * Everything below is a table and not a rule, for the reason DESTINATIONS and
 * COURSES are tables in the two seeders beside this one: a rule that gets one
 * entry of twelve wrong is worse than a list, and a list can be argued with.
 */

/**
 * The block label -> what the router does with it.
 *
 * `kind` names the bank_kind the block's clauses become. `null` means the block
 * is REAL CONTENT THAT IS NOT BANK CONTENT: it is parsed, kept, reported and
 * written nowhere, which is a different thing from being ignored.
 *
 * The six routed labels are the document's own ROUTING RULES. The six unrouted
 * ones are argued one line each, because each is a place where a reader would
 * reasonably expect a row and does not get one.
 */
const BLOCKS = new Map([
  ["GOODS", { kind: "good" }],
  ["HOST ACTS", { kind: "host_act" }],
  ["GAMES", { kind: "game" }],
  ["GAMES/BOOKINGS", { kind: "game" }],

  // Not a bank row. db/031: an invariant in a pool of variables eventually gets
  // left out of a package. Goes to world.gesture.
  ["GESTURE", { kind: null, sink: "gesture" }],

  // Food and drink. Routed out of the bank entirely; see 6 in the header.
  ["ROUTE TO DISH POOL", { kind: null, sink: "dish" }],
  ["ROUTE TO DRINK PROGRAM", { kind: null, sink: "drink" }],

  // A kill is a decision that something does NOT exist. Recording it as a draft
  // row would resurrect exactly what the founder struck out.
  ["KILLED", { kind: null, sink: "killed" }],

  // "(not staged)" is in the label. The scene card may describe empty rosé
  // bottles accumulating; nothing ships, so there is nothing to put in a pool
  // of shippable things.
  ["SCENE-CARD EVIDENCE", { kind: null, sink: "scene_card" }],

  // "nothing shipped, sourced, or instructed", and founder + counsel have not
  // decided whether even the glance ships. A draft row is still a row.
  ["CANNABIS", { kind: null, sink: "counsel" }],

  // Its three tiers are already rows: sparklers and the loud cork are host acts
  // above it, and the live-musician booking belongs to the music split, not the
  // bank. Writing them again here would double-count two of the three.
  ["SPECTACLE TIERS", { kind: null, sink: "spectacle" }],

  // Runsheet framing — the ORDER of an evening, which is db/025's runbook and
  // db/022's table, not an item anybody selects.
  ["SEQUENCE NOTE", { kind: null, sink: "runsheet" }],

  // The soundtrack is db/005 and has its own pool.
  ["SOUND", { kind: null, sink: "sound" }],
]);

/**
 * The three `##` sections that are not rooms.
 *
 * Listed rather than detected, so that a nineteenth room whose heading is
 * mistyped fails loudly instead of being read as prose.
 */
const NOT_A_ROOM = new Set([
  "ROUTING RULES — READ FIRST",
  "FORMAT NOTES — SAYING A ROW BELONGS TO TWO ROOMS",
  "NEW CONTENT CLASSES (schema-relevant)",
  "FOUNDER-PENDING LEDGER (from this bank)",
]);

/**
 * PRINTED MATTER, AS PHRASES AND NOT AS THE WORD "CARD".
 *
 * The brief: "Printed matter named anywhere (ledgers, call cards, award
 * certificates, prompt decks, Smorfia sheets, bingo calls, stakes lists,
 * technique cards) -> kind printed_card."
 *
 * A bare `\bcard\b` test cannot do this. Four rooms carry a PLAYING-card deck —
 * "Napoletane-pattern 40-card deck", "Baraja española 40-card deck",
 * "northern-Italian pattern card deck", the Thoth tarot — and a deck of playing
 * cards is an object a house owns, not printed matter this catalogue authors.
 * The distinction is the whole difference between shipping a deck and writing
 * one.
 *
 * So: phrases. Each is a thing the house PRINTS.
 */
const PRINTED_MATTER = [
  "technique card",
  "rules card",
  "story card",
  "lore card",
  "call card",
  "prompt deck",
  "prompt slips",
  "stakes-suggestion card",
  "menu cards",
  "place cards",
  "translation sheet",
  "cartelle",
  "certificates",
  "stationery",
  "apology cards",
  "broadsheet",
  "ledger",
  // Big Sur's "noun-game 1971 slips" and Vegas's "~80 printed marquee-ticket
  // slips". A slip is printed matter by definition — the slips rule in the
  // document is about nothing else.
  "slips",
];

/**
 * Words that SOUND like printed matter and are not caught above.
 *
 * Not used to classify anything. Every clause that matches one of these and no
 * PRINTED_MATTER phrase is REPORTED, so the vocabulary above can be extended by
 * a person who has looked at the line rather than by a regex that guessed at
 * it. This is the list that keeps a phrase table honest.
 */
const SOUNDS_PRINTED = /\bcards?\b|\bdecks?\b|\bsheets?\b|\bprinted\b|\bposter\b|\bpad\b|\btags\b|\bpaper\b/i;

/**
 * A KIT IS A GOOD EVEN WHEN IT CONTAINS PRINTED MATTER.
 *
 * "Bingo kit with corny pre-written call card", "Pick-a-Number kit (rules card
 * + a wrapped prize)", "TOMBOLA KIT — … printed cartelle, Smorfia translation
 * sheet …". A kit is one boxed thing that ships as one line on an order, and
 * filing it as a printed card because there is paper inside it would misfile
 * the board, the tokens, the beans and the five wrapped prizes with it.
 *
 * Every kit's printed contents are reported, because a curator may well want
 * the card broken out as its own row later — that is her call and not this
 * script's.
 */
const IS_A_KIT = /\bkits?\b/i;

/**
 * OWNED-IF-PRESENT -> ships = false.
 *
 * db/031: "FALSE is owned-if-present: the scene card may GLANCE at it, and
 * nothing ships." The document writes it two ways — the tag itself, and the
 * verb "glance" — and both are the same decision. "TV muted, glanced" at Aspen
 * carries no tag and is unmistakably the same thing.
 *
 * "ship cheap or owned" (Nantucket's cribbage board) is NOT here. It is an
 * unresolved either/or, `ships` defaults true, and the line is reported.
 */
const OWNED_IF_PRESENT = /owned-if-present|\bglanced\b|\bglance only\b|\bglance\b/i;

/**
 * THE EVENING SUPPLIES IT — db/044's third category, read off the clause.
 *
 * The marker is the founder's own name for the category so that it reads as a
 * sentence in a document she reads, and the parenthetical carries the two facts
 * the schema needs:
 *
 *     THE EVENING SUPPLIES IT (per guest; from the_drinks yields_cork)
 *     THE EVENING SUPPLIES IT (one guest only; from ambient_game yields_prize)
 *     THE EVENING SUPPLIES IT (per guest; from the_main yields_shell + the night itself)
 *     THE EVENING SUPPLIES IT (per guest; from the night itself)
 *
 * `from the night itself` is a REAL ANSWER and not a missing one: a rose hip
 * off the lane, a stone out of the creek, a strip of the host's own masking
 * tape. Those have no slot to watch and correctly produce zero dependency
 * rows — which is why db/044 makes `supply_note` compulsory, so that "decided:
 * the night supplies it" and "nobody has written the dependency yet" cannot
 * look the same in the data.
 *
 * The codes are NOT validated against a list here. db/044 gives the dependency
 * table foreign keys to `slot_kind(code)` and `supplies_tag(code)`; a list in
 * this file would be the hand-written copy CLAUDE.md rule 19 is about, and it
 * would be wrong the day a slot is added rather than the day it is removed. A
 * dry run checks the SHAPE — two lowercase identifiers — and says plainly that
 * the names are the database's to judge.
 */
const EVENING_SUPPLIES = /THE EVENING SUPPLIES IT\s*\(([^)]*)\)/;

/** `per guest` / `one guest only` -> db/044's take_home_quantity. */
const SUPPLY_QUANTITY = new Map([
  ["per guest", "per_guest"],
  ["one guest only", "single_artifact"],
]);

/** One `slot_code supplies_code` pair, or the night itself. */
const A_DEPENDENCY = /^([a-z][a-z0-9_]*)\s+([a-z][a-z0-9_]*)$/;
const THE_NIGHT_ITSELF = /^the night itself$/i;

/**
 * Read the marker, or return null for the 312 rows that do not carry it.
 *
 * Every failure here is a FAILURE, not a shrug: a clause that says the evening
 * supplies it and then cannot say how is the exact ambiguity db/044's
 * compulsory note exists to forbid, and letting it through as a stocked row
 * would put an item with no stock on an order.
 */
function readSupply(clause, name) {
  const marked = EVENING_SUPPLIES.exec(clause);
  if (!marked) return null;

  const inner = marked[1].trim();
  const at = inner.indexOf(";");
  if (at === -1) {
    fail(
      `"${name}" is marked THE EVENING SUPPLIES IT but its parenthesis has no ` +
        `";" separating the quantity from the supply: "${inner}". The shape is ` +
        `"(per guest; from the_drinks yields_cork)".`
    );
  }

  const quantity = SUPPLY_QUANTITY.get(inner.slice(0, at).trim().toLowerCase());
  if (!quantity) {
    fail(
      `"${name}" is marked THE EVENING SUPPLIES IT with quantity ` +
        `"${inner.slice(0, at).trim()}", which is neither "per guest" nor ` +
        `"one guest only". db/044 has two quantity semantics and they must ` +
        `never be conflated — a room does not have per-guest take-home ` +
        `coverage on the strength of one trophy.`
    );
  }

  const source = inner.slice(at + 1).trim().replace(/^from\s+/i, "");
  if (source.length === 0) {
    fail(
      `"${name}" is marked THE EVENING SUPPLIES IT and says nothing after ` +
        `the ";". Say "from the night itself" if nothing in the package ` +
        `supplies it — that is an answer, and silence is not.`
    );
  }

  const dependencies = [];
  let theNight = false;
  for (const part of source.split("+").map((p) => p.trim())) {
    if (THE_NIGHT_ITSELF.test(part)) {
      theNight = true;
      continue;
    }
    const pair = A_DEPENDENCY.exec(part);
    if (!pair) {
      fail(
        `"${name}" names a supply "${part}", which is neither "the night ` +
          `itself" nor a "slot_code supplies_code" pair. db/044 watches a ` +
          `SLOT and asks a PREDICATE of whatever filled it; it never points ` +
          `at a row.`
      );
    }
    dependencies.push({ slotCode: pair[1], supplies: pair[2] });
  }

  if (dependencies.length === 0 && !theNight) {
    fail(`"${name}" is marked THE EVENING SUPPLIES IT and watches nothing.`);
  }

  return { quantity, dependencies, note: source };
}

/**
 * PHASE, FROM WORDS SHE ACTUALLY WROTE.
 *
 * `day_phase` (db/031's `bank_phase`, renamed by db/068) defaults to `all`,
 * which db/031 glosses as NO OPINION rather
 * than "every phase", and CLAUDE.md rule 3 forbids inference from silence. So
 * the map is small on purpose: five phrases, each of which names a time of day
 * outright.
 *
 * `dawn` IS DELIBERATELY ABSENT and is a finding rather than an omission — see
 * the GAPS section of the report. Havana's dawn pour and St. Moritz's dawn
 * breakfast are real content and `day_phase` has no value for them; `dark` is
 * the nearest and is not true, because dawn is the moment dark ends.
 */
const PHASE_WORDS = [
  ["at dusk", "dusk"],
  ["dusk act", "dusk"],
  ["dusk call", "dusk"],
  ["sundown", "dusk"],
  ["midnight", "dark"],
];

/** Time words the document uses that PHASE_WORDS does not map. Reported. */
const TIME_WORDS = /\bdawn\b|\bmidnight\b|\bdusk\b|\bsundown\b|\bafternoon\b|\bnine o'clock\b|\b2 a\.m\.\b|\blate-phase\b/i;

/**
 * PHASE RULINGS — the few rows whose phase a PERSON decided, not the document.
 *
 * PHASE_WORDS above reads the words she wrote. This table is the other source,
 * and it exists because a ROOM can change after the document was written while
 * the document stays exactly as it was. `docs/atmosphere-idea-bank-v1.md` is a
 * v1 and is not edited to make a seeder come out right — it is the record of
 * what was said in one pass, and rewriting the record to move a tag would
 * destroy the only evidence of what the tag was derived FROM.
 *
 * So: derivation stays honest, and a ruling sits beside it in the open, named,
 * dated, and printed on every run. Two authorities, never one pretending to be
 * the other.
 *
 * ── WHY THERE ARE THREE OF THEM, AND WHY THEY ARE TAHITI'S ───────────
 *
 * TAHITI WIDENED. The founder's ruling of 2026-08-23 (recorded against
 * `tahiti.starts` and the Tahiti premise cell in data/destination-matrix.json)
 * turns the room from an evening party into an AFTERNOON-THROUGH-MORNING ARC:
 * it now begins in daylight and runs until morning. The staging arc formally
 * gains the daylight phase. The phase enum has carried `daylight` since db/031,
 * so nothing about the schema changed — only which value is true.
 *
 * The founder named three items by hand: the blossom bowl, the lei craft, the
 * floated flowers. All three are things MADE, ARRANGED OR FLOATED WHILE THE SUN
 * IS UP — the daylight is not a circumstance they tolerate, it is what they
 * are. The rest of Tahiti's twelve rows are left alone and the reason is in
 * the report: "could happen in daylight" is not the test, and rule 13 means a
 * retag here reaches a member on the next deploy with nobody in between.
 *
 * ── WHAT THIS TABLE CANNOT SAY, SAID PLAINLY ─────────────────────────
 *
 * `bank_item.phase` is ONE VALUE PER ROW — a scalar `day_phase` column in
 * db/031, not an array and not a join table. "Include daylight" is therefore
 * expressible only as a REPLACEMENT. That is harmless for all three rows here
 * and only because all three read `all`, which db/031 glosses as NO OPINION
 * rather than "every phase": replacing no-opinion with daylight destroys no
 * claim, it makes one where none stood.
 *
 * It would NOT be harmless for a row that already says `dusk`. Tahiti has one
 * of those — `tahiti-the-conch-blown-at-dusk` — and it is deliberately not in
 * this table. See the report section, and db/034: the conch at dusk is the
 * room's gesture. Anything that wants to be daylight AND dusk at once needs a
 * schema change, and it does not get invented here.
 *
 * ── THE HINGE DOES NOT MOVE ──────────────────────────────────────────
 *
 * The turn of Tahiti's evening is the torches lit in full daylight — "torches
 * that go up one at a time long before anybody is hungry", the room's tagline
 * and premise in src/lib/destinations.ts. The founder ruled it unaltered and
 * unmoved by the widening. No row below touches it: Tahiti carries no candle
 * or torch bank item at all (the NEW CONTENT CLASSES candle-surface line in the
 * source document lists eleven rooms and Tahiti is not one of them), so the
 * hinge lives in the destination record where the widening left it.
 *
 * `was` is not decoration. It is the derivation this ruling is overruling, and
 * it is asserted rather than assumed: if the document ever gains a phase word
 * for one of these lines, the premise of the ruling has changed and the run
 * FAILS instead of quietly winning the argument.
 */
const PHASE_RULINGS = [
  {
    slug: "tahiti-blossom-bowl-of-single-tiare-tuberose",
    was: "all",
    phase: "daylight",
    why:
      "A bowl of single blossoms, arranged, with the left/taken-right/looking " +
      "lore riding on a card beside it. It is arranged in the light and it is " +
      "read in the light.",
  },
  {
    slug: "tahiti-lei-making-kit",
    was: "all",
    phase: "daylight",
    why:
      "The craft the founder named: needle, thread, blossoms, an opt-in table " +
      "of people making things. Threading a lei is daylight work and the room " +
      "now has an afternoon to do it in.",
  },
  {
    slug: "tahiti-floated-blossoms",
    was: "all",
    phase: "daylight",
    why:
      "Blossoms floated on water, which is a thing done while the sun is up " +
      "and seen while the sun is up.",
  },
];

/**
 * Tahiti rows the widened arc did NOT reach, and why — printed on every run.
 *
 * This list is as much of the ruling as the one above it. "Where it is
 * obvious" was the founder's own qualifier, and a table of retags with no
 * record of what was considered and declined reads, six months from now, as
 * though nothing else was considered at all.
 */
const PHASE_RULINGS_DECLINED = [
  {
    slug: "tahiti-the-conch-blown-at-dusk",
    phase: "dusk",
    why:
      "Not a daylight item and never was. The conch at dusk is the room's " +
      "GESTURE (db/034) and the line that calls dinner; `dusk` here is the " +
      "founder's own words in the source document, not an artefact of the old " +
      "evening-only arc. Widening the arc added an afternoon in front of this " +
      "moment; it did not move the moment.",
  },
  {
    slug: "tahiti-single-flower-or-shell-leis",
    phase: "all",
    why:
      "The lei CRAFT was named. The finished leis were not, and a lei is worn " +
      "at whatever hour it is handed over. A question for the founder rather " +
      "than a guess.",
  },
  {
    slug: "tahiti-lore-card",
    phase: "all",
    why:
      "Rides with the blossom bowl, which is now daylight — but a printed card " +
      "is read whenever it is picked up, and following a parent row's tag is " +
      "inference, not evidence (CLAUDE.md rule 3). Left `all`, and flagged: a " +
      "daylight bowl with a no-opinion card is a real question about whether " +
      "an attachment should inherit a phase at all.",
  },
  {
    slug: "tahiti-kui-method-technique-card",
    phase: "all",
    why: "Rides with the lei-making kit. Same reasoning as the lore card.",
  },
  {
    slug: "tahiti-star-kit",
    phase: "all",
    why:
      "\"What's overhead\" is if anything a DARK line, and the widened arc is " +
      "no licence to tag it — nobody ruled on it. Left at NO OPINION.",
  },
  {
    slug: "tahiti-the-conch",
    phase: "all",
    why: "An object that lives on her shelf afterwards. It has no hour.",
  },
  {
    slug: "tahiti-banana-leaf-runner",
    phase: "all",
    why:
      "Laid on the table and there for the whole party. Could be laid in " +
      "daylight; so could most of the room. Not obvious.",
  },
  {
    slug: "tahiti-half-coconut-bowls",
    phase: "all",
    why: "Serving vessels, in use from the first plate to the last. Not obvious.",
  },
  {
    slug: "tahiti-monoi-as-object",
    phase: "all",
    why: "An object on a surface, with no hour of its own.",
  },
];

/**
 * THE GAMES THE HEADER COULD NOT SEE — section 11.
 *
 * Twenty rows, each a game the founder wrote inside a `GOODS:` line. Same
 * shape and same guarantees as PHASE_RULINGS above, for the same reason: the
 * document derives one thing, a person ruled another, and the two authorities
 * sit side by side rather than one being quietly edited to look like the
 * other.
 *
 *   `was`   the kind the document derives TODAY, asserted rather than assumed.
 *           If a clause is reworded so that PRINTED_MATTER or IS_A_KIT reads
 *           it differently, the premise of the ruling has changed and the run
 *           FAILS instead of letting this table win an argument it was not
 *           given. Exactly PHASE_RULINGS' `was`, and it has already earned its
 *           keep once there.
 *   `why`   the words IN THE CLAUSE that make it a game. Not a justification
 *           written afterwards — a quotation, so a reader can check it against
 *           the document without trusting this file.
 *
 * THE COUNT IS THE POINT (CLAUDE.md rule 24). A read-only audit found 22 rows
 * misfiled by this defect. This table converts TWENTY, and the gap is reported
 * by name every run rather than rounded away — see GAME_ROUTINGS_DECLINED,
 * which holds every candidate that was looked at and refused, with the reason.
 * A ruling table cannot match "most" of anything: every entry must find its
 * row and find it holding `was`, or the run fails.
 *
 * NOTHING HERE IS A NEW ROW. Every slug already exists; the ruling moves its
 * kind and touches nothing else. The rows that ride WITH these — the rules
 * cards `extractCards` pulls out — are untouched and stay `printed_card`.
 */
const GAME_ROUTINGS = [
  {
    slug: "new-york-the-game-1938-prompt-slips",
    was: "printed_card",
    why:
      '"The Game 1938 prompt slips". The Game IS the slips — there is no ' +
      "board and no other object, and the slips rule in NEW CONTENT CLASSES " +
      'names "all prompt decks" as game content that ships pre-generated. ' +
      "Filed as printed matter it was a card explaining nothing.",
  },
  {
    slug: "new-york-backgammon-owned-if-present",
    was: "good",
    why:
      '"backgammon owned-if-present". A game the house does not ship. ' +
      "`ships` is its own column and already says false; `kind` says WHAT " +
      "IT IS, and what it is is backgammon.",
  },
  {
    slug: "new-orleans-1956-charades-prompt-deck",
    was: "printed_card",
    why:
      '"1956 charades prompt deck". A prompt deck under the slips rule: the ' +
      "printed thing is the whole game, not a card that accompanies one.",
  },
  {
    slug: "dolomites-northern-italian-pattern-card-deck",
    was: "good",
    why:
      '"northern-Italian pattern card deck + Watten/briscola rules card". ' +
      "The clause names what is played with it in the same breath, and the " +
      "rules card rides with it as its own printed_card row. Deck plus " +
      'provided content is the document\'s own definition of a game — ' +
      '"opt-in objects with provided content", routing rule 3.',
  },
  {
    slug: "havana-double-nine-dominoes-in-wooden-box",
    was: "good",
    why:
      '"double-nine dominoes in wooden box". A boxed game. Nothing about ' +
      "the box makes it furniture.",
  },
  {
    slug: "las-vegas-leather-dice-cups-five-dice-each",
    was: "good",
    why:
      '"leather dice cups + five dice each + liar\'s-dice rules card + era ' +
      'stakes-suggestion card". The founder\'s own example. Both cards are ' +
      "already separate printed_card rows riding with it; what is left is " +
      "liar's dice.",
  },
  {
    slug: "las-vegas-celebrity-1960-deck",
    was: "good",
    why:
      '"Celebrity 1960 deck (~80 printed marquee-ticket slips + draw vessel ' +
      '+ fishbowl three-round rules)". Slips, a vessel and three rounds of ' +
      "rules. This is the row a word-matcher would have filed by the word " +
      '"bowl"; it is here by name instead.',
  },
  {
    slug: "las-vegas-pick-a-number-kit",
    was: "good",
    why:
      '"Pick-a-Number kit (rules card + a wrapped prize — everyone wins ' +
      'eventually; that\'s the game)". The clause ends with the words "that\'s ' +
      'the game". IS_A_KIT kept it out of printed_card and was right to; a ' +
      "kit is a good rather than a card, and this kit is a game.",
  },
  {
    slug: "cote-dazur-belote-rules-card",
    was: "printed_card",
    why:
      '"belote rules card", standing alone in the goods line with no deck ' +
      "beside it. THE WEAKEST ROUTING IN THIS TABLE and it is marked so: " +
      "unlike the Dolomites, Amalfi and Oaxaca cards, this one rides with " +
      "nothing, so as printed_card it was a card about a game the bank does " +
      "not hold. Routed because the card is the only belote the room ships, " +
      "and the missing 32-card deck is reported as an authoring absence.",
  },
  {
    slug: "cote-dazur-petanque-set",
    was: "good",
    why:
      '"pétanque set (requires_outdoors, no indoor fallback)". A set of ' +
      "boules is a game; the venue tag rides with it untouched.",
  },
  {
    slug: "catskills-bingo-kit-with-corny-pre-written-call-card",
    was: "good",
    why:
      '"Bingo kit with corny pre-written call card". The call card is ' +
      "pre-written under the slips rule, which is the rule about GAMES with " +
      "player-generated content. The kit is the game.",
  },
  {
    slug: "catskills-gin-deck",
    was: "good",
    why: '"gin deck". A deck named for the game played with it.',
  },
  {
    slug: "catskills-mah-jongg-owned-if-present",
    was: "good",
    why:
      '"mah-jongg owned-if-present". Same as New York\'s backgammon: not ' +
      "shipped, still a game.",
  },
  {
    slug: "big-sur-noun-game-1971-slips",
    was: "printed_card",
    why:
      '"noun-game 1971 slips (nouns can be things — the fog is a card)". The ' +
      'room\'s heading says "game night legal" outright. The slips are the ' +
      "game.",
  },
  {
    slug: "nantucket-cribbage-board",
    was: "good",
    why:
      '"cribbage board (ship cheap or owned)". The unresolved ship-or-own ' +
      "either/or is untouched and still reported; it is a question about " +
      "`ships`, not about what the object is.",
  },
  {
    slug: "nantucket-chess-owned-if-present",
    was: "good",
    why:
      '"chess owned-if-present (scene-card glance — it\'s on the front ' +
      'page)". Glanced rather than shipped, and still chess.',
  },
  {
    slug: "amalfi-1953-tombola-kit",
    was: "good",
    why:
      '"TOMBOLA KIT — tombolone board, wooden tokens in cloth bag, printed ' +
      "cartelle, Smorfia translation sheet, sack of dried beans as markers, " +
      'FIVE wrapped prizes in ascending tiers". A board, tokens, cards, ' +
      "markers and prizes. The room's gesture is somebody CALLING it.",
  },
  {
    slug: "amalfi-1953-napoletane-pattern-40-card-deck",
    was: "good",
    why:
      '"Napoletane-pattern 40-card deck + scopa rules card (early/side game, ' +
      '2–4 players, while the table grows)". The clause says "game" and ' +
      "gives the player count.",
  },
  {
    slug: "oaxaca-1954-baraja-espanola-40-card-deck",
    was: "good",
    why:
      '"Baraja española 40-card deck + Conquián rules card (matching games ' +
      'as the easy option, same card)". The clause says "games".',
  },
  {
    slug: "st-moritz-1984-backgammon-board",
    was: "good",
    why:
      '"backgammon board (claimed fully — \'84 alpine is its decade)". ' +
      "Claimed fully means it ships; New York's is the owned-if-present " +
      "cousin. Both are backgammon.",
  },
];

/**
 * EVERY CANDIDATE THAT WAS LOOKED AT AND REFUSED, AND WHY.
 *
 * The other half of the ruling, exactly as PHASE_RULINGS_DECLINED is the other
 * half of the phase ruling: a table of conversions with no record of what was
 * considered and declined reads, six months out, as though nothing else was
 * considered at all — and here it is also the honest form of the count. The
 * audit said 22 and this file converts 20; these are the rows the difference
 * could be hiding in, named, so the founder can overrule any of them in one
 * line instead of re-deriving the question.
 *
 * `kind` is asserted the same way `was` is above. A decline that has silently
 * become something else is a decline nobody can see is dead.
 */
const GAME_ROUTINGS_DECLINED = [
  {
    slug: "new-orleans-tarot-deck-out",
    kind: "good",
    why:
      "THE AUDIT'S OWN WORDS: \"the deck is a good, the reading is a game " +
      'and has no row." The clause is "tarot deck out (Marseille or ' +
      'Rider-Waite; host reads for whoever asks)" — an object, plus a thing ' +
      "the HOST does with it. Splitting the reading out of the middle of the " +
      "deck's sentence is the guess section 4 refuses for gestures. The " +
      "reading is an authoring absence and is reported as one.",
  },
  {
    slug: "big-sur-thoth-tarot-deck-out",
    kind: "good",
    why:
      '"Thoth tarot deck out (1969, object only, no reader — NOLA owns the ' +
      'reading)". POSITIVE EVIDENCE THAT IT IS NOT A GAME, in her own words. ' +
      "Rule 3 cuts this way as well as the other.",
  },
  {
    slug: "las-vegas-pick-a-number-as-the-host-s-game",
    kind: "host_act",
    why:
      "THE CLOSEST CALL, and the likeliest of the two rows between this " +
      'table and the audit\'s 22. The clause literally says "Pick a Number as ' +
      'the host\'s game" — but it sits under HOST ACTS, and the header there ' +
      "is not guessing: it says who performs the thing, which is what " +
      "`bank_kind` is for. The room's game row is the Pick-a-Number KIT, " +
      "routed above; making the act a second game row would give one game two " +
      "rows in one room. Overrule this in one line if the intent was both.",
  },
  {
    slug: "las-vegas-liar-s-dice-rules-card",
    kind: "printed_card",
    why:
      "Rides with the dice cups, which are now the game. A rules card is " +
      "printed matter the house authors — that is the whole PRINTED_MATTER " +
      "vocabulary and it was never wrong. Same for the three below.",
  },
  {
    slug: "las-vegas-era-stakes-suggestion-card",
    kind: "printed_card",
    why:
      'Rides with the dice cups. "Stakes lists" are named in the slips rule ' +
      "as game CONTENT, which is what a card riding with a game is.",
  },
  {
    slug: "dolomites-watten-briscola-rules-card",
    kind: "printed_card",
    why: "Rides with the northern-Italian deck, which is now the game.",
  },
  {
    slug: "amalfi-1953-scopa-rules-card",
    kind: "printed_card",
    why: "Rides with the Napoletane deck, which is now the game.",
  },
  {
    slug: "oaxaca-1954-conquian-rules-card",
    kind: "printed_card",
    why: "Rides with the Baraja española, which is now the game.",
  },
  {
    slug: "catskills-printed-camp-name-ledger-pre-filled-ridiculously-blanks",
    kind: "printed_card",
    why:
      "Pre-filled with blanks under the slips rule, which is why it looks " +
      "like game content — but nobody plays a ledger. It is the room's " +
      "running joke in printed form, and PRINTED_MATTER has it right.",
  },
  {
    slug: "oaxaca-1954-the-conquian-tally",
    kind: "good",
    why:
      "The SCORE of a game, not the game. An evening-supplied take-home " +
      "watching `ambient_game yields_score_sheet` — routing it to `game` " +
      "would file a piece of paper as the thing it records.",
  },
  {
    slug: "st-moritz-1984-the-backgammon-column",
    kind: "good",
    why: "Same as the Conquián tally: the score sheet, not the board.",
  },
  {
    slug: "aspen-1994-the-ballot",
    kind: "good",
    why:
      "A take-home ballot for the story competition, which is ALREADY a " +
      "`game` row from Aspen's own GAMES block. Its own clause asks whether " +
      'adding ballots makes the competition "a game with rules, which is a ' +
      'different bank class" — an open founder question, not a routing.',
  },
  {
    slug: "aspen-1994-shot-ski",
    kind: "good",
    why:
      "A drinking device on a wall, and a live FOUNDER CALL about whether it " +
      "ships at all (ledger entry 8). Not a game, and not a row to move " +
      "while its own question is open.",
  },
];

/**
 * KILLED GAMES — checked against every routing, on every run.
 *
 * The document and the three take-home sheets record kills explicitly, and a
 * kill is a decision that something does NOT exist. A killed game reappearing
 * as a routing win would be the worst possible failure of this table: it would
 * look like the fix working.
 *
 * FULL PHRASES, NOT KEYWORDS, and that is the whole care in this list. "the
 * belote sheet" was cut from Côte d'Azur and "belote rules card" is routed to
 * `game` five entries above — one word apart and opposite decisions. A
 * keyword check on "belote" would refuse a live routing and read as diligence
 * while doing it.
 *
 * The check is catalogue-wide: any ROW whose name matches a kill is a hard
 * failure, and a routed row matching one is the same failure with a louder
 * message. Every phrase is printed on every run with what it matched, so
 * "nothing matched" is a reading rather than a section that quietly did not
 * appear.
 */
const KILLED_GAMES = [
  { phrase: "keno", where: "Vegas — take-home sheet, cut with its bench" },
  { phrase: "weather-forecast act", where: "Nantucket — KILLED, in the document" },
  { phrase: "the card that took the last trick", where: "Dolomites — take-home sheet" },
  { phrase: "belote sheet", where: "Côte d'Azur — take-home sheet" },
  { phrase: "cochonnet", where: "Côte d'Azur — take-home sheet" },
  { phrase: "your card from the door", where: "Amalfi — take-home sheet" },
  { phrase: "thoth tarot card", where: "Big Sur — take-home sheet (the DECK survives, object only)" },
  { phrase: "fischer–spassky scoresheet", where: "Nantucket — take-home sheet" },
  { phrase: "fischer-spassky scoresheet", where: "Nantucket — the ASCII-hyphen spelling of the same kill" },
  { phrase: "a single domino", where: "Havana — take-home sheet (the SET survives)" },
  { phrase: "costume brief", where: "catalogue-wide, NEW CONTENT CLASSES" },
];

/**
 * VENUE, FROM THE TAG AND NOTHING ELSE.
 *
 * db/031's two grades are already the document's own words — pétanque says
 * `requires_outdoors`, the sparkler kit says `outdoor_access` — so there is
 * nothing to translate and no judgement to make. Anything that merely sounds
 * outdoor stays `none`, which is the safe default db/020 argues for at length:
 * a wrong tag deletes a deliverable silently and forever.
 */
const VENUE_TAGS = [
  ["requires_outdoors", "requires_outdoors"],
  ["outdoor_access", "outdoor_access"],
  // db/058. Two items are about a room a guest sleeps in — Las Vegas's fob
  // off the door and Portofino's key tag — and neither can exist where nobody
  // stays. Added here as a word the document says, on the same terms as the
  // two above: "there is nothing to translate and no judgement to make."
  ["requires_lodging", "requires_lodging"],
];

/**
 * ONE VENUE REQUIREMENT PER ITEM, and it is the FIRST match that wins.
 *
 * The loop below breaks, so an item naming two codes carries only the one
 * listed earliest here rather than both. That is a real ceiling and it is
 * fine today — nothing in the document needs two — but an object that is
 * genuinely outdoors AND needs lodging would lose half its gate silently,
 * which is the class of failure db/035 spent two months inside. Recorded so
 * the next person adding a code knows the shape of the thing they are
 * extending rather than discovering it (rule 20).
 */

/**
 * The one graded word in the document.
 *
 * Big Sur: "reading aloud (pooled, LOW weight — founder flag: preciousness
 * risk)". `weight` in db/031 is "a nudge, not a gate", and 0.5 is half of the
 * default rather than a number with a theory behind it. It is reported on every
 * run for that reason.
 */
const LOW_WEIGHT = 0.5;

/**
 * The short names the NEW CONTENT CLASSES section uses -> the DESTINATIONS key.
 *
 * The candle-surface line writes "NY" and "NOLA" where the room headings write
 * "NEW YORK, 1938" and "NEW ORLEANS, 1956". Six lines rather than a rule.
 */
const SHORT_NAMES = new Map([
  ["NY", "New York"],
  ["NOLA", "New Orleans"],
  ["Oaxaca", "Oaxaca"],
  ["Westhampton", "Westhampton"],
  ["Dolomites", "Dolomites"],
  ["Côte d'Azur", "Côte d'Azur"],
  ["Acapulco", "Acapulco"],
  ["St. Moritz", "St. Moritz"],
  ["Big Sur", "Big Sur"],
  ["Aspen", "Aspen"],
  ["Catskills", "Catskills"],
  ["Nantucket", "Nantucket"],
]);

/** What a candle-surface note is appended to. */
const A_CANDLE = /\bcandles?\b|\bvotives?\b|\btapers?\b|\bhurricanes?\b|\blanterns?\b|\bpillars?\b|\bcandlesticks?\b/i;

/**
 * The founder-pending ledger -> the room, and the words that find the item.
 *
 * Ten entries, ten lines. `room` is the DESTINATIONS key the entry is about;
 * `match` is the phrase that identifies the item inside that room, tested
 * against the item's NAME. `match: null` means the entry is not about a bank
 * item at all and says why — those are reported rather than invented into rows.
 *
 * A ledger entry that matches NO item is an error and not a skip, for the same
 * reason an unknown heading is: the founder asked for every one of these to be
 * carried through, and an entry that quietly found nothing to attach to is an
 * entry that was skipped.
 */
const LEDGER = [
  { n: 1, room: "Westhampton", match: null,
    why: "A matrix row re-run, not a bank item. Belongs beside the Eothen " +
         "row in data/destination-matrix.json and docs/needs-a-human.md." },
  // The question IS the gesture, and db/031 keeps gestures off the bank. It
  // rides on world.gesture_note, with world.gesture left NULL until she picks.
  { n: 2, room: "Catskills", match: ["FOUNDER DECIDES"] },
  { n: 3, room: "Vegas", match: ["flaming dessert", "tableside Caesar"] },
  { n: 4, room: "Amalfi Coast", match: ["TOMBOLIERE", "arrivals applauded"] },
  { n: 5, room: "Acapulco", match: ["the loud cork", "sparklers lit"] },
  { n: 6, room: "Oaxaca", match: ["papel picado"] },
  { n: 7, room: "Big Sur", match: ["reading aloud"] },
  { n: 8, room: "Aspen", match: ["shot-ski"] },
  { n: 9, room: "Palm Springs", match: null,
    why: "A bench with no material in it yet. There is nothing to attach a " +
         "question to; the room's three goods and one gesture are all the " +
         "document holds." },
  { n: 10, room: null, match: null,
    why: "Product-level and catalogue-wide, raised by the sparklers. Not a " +
         "property of any one room, so no row is its right home." },
];

/* ── the parser ─────────────────────────────────────────────────────── */

/**
 * A slug from a name.
 *
 * Not imported from src/lib/desk/labels.ts for the reason seed-dishes gives:
 * that one truncates at 60 for a curator typing into a box, and truncation is
 * how two long names collide silently. `bank_item.slug` has no length limit, so
 * neither does this.
 */
function slugify(name) {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Split on a character only where the parentheses are balanced.
 *
 * The document nests semicolons inside parentheses in three rooms — Tahiti's
 * "(left, taken; right, looking)", Vegas's "everyone wins eventually; that's
 * the game", Acapulco's "(GESTURE; spectacle deliverable tier 1 …)" — so a
 * plain split on ";" would cut three items in half and lose the second half of
 * each. Depth-aware costs four lines and cannot make that mistake.
 */
function splitDepthZero(text, separator) {
  const parts = [];
  let depth = 0;
  let current = "";
  for (const char of text) {
    if (char === "(") depth += 1;
    if (char === ")") depth = Math.max(0, depth - 1);
    if (char === separator && depth === 0) {
      parts.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  parts.push(current);
  return parts.map((part) => part.trim()).filter((part) => part.length > 0);
}

/** The depth-0 parentheticals of a clause, and the clause without them. */
function peelParentheses(text) {
  const parens = [];
  let depth = 0;
  let spine = "";
  let current = "";
  for (const char of text) {
    if (char === "(") {
      depth += 1;
      if (depth === 1) continue;
    }
    if (char === ")") {
      depth -= 1;
      if (depth === 0) {
        parens.push(current.trim());
        current = "";
        continue;
      }
    }
    if (depth === 0) spine += char;
    else current += char;
  }
  return { spine: spine.replace(/\s+/g, " ").trim(), parens };
}

/**
 * Join the document's hard-wrapped lines back into one string.
 *
 * She wraps at about 72 columns, and the wrap falls inside a hyphenated word
 * four times ("last-up-turns-off-the-" / "string-lights", "bright-" / "vessel",
 * "theme-party-" / "saturated") and after a solidus once ("anchoïade/" /
 * "tapenade"). Joining those with a space produces "the- string-lights", which
 * is a different word. So a line ending in `-` or `/` joins with nothing and
 * every other line joins with a space.
 */
function joinWrapped(previous, line) {
  if (previous.length === 0) return line;
  if (/[-/]$/.test(previous)) return previous + line;
  return `${previous} ${line}`;
}

/**
 * A block is finished when its text has reached a full stop OUTSIDE a
 * parenthesis.
 *
 * The depth test is not fussiness. Aspen wraps mid-parenthesis on "…the
 * catalog's light spectrum against St." — an abbreviation, at the end of a
 * line, inside a bracket that has not closed — and a rule that read the full
 * stop as the end of the block would drop "Moritz's dark)." on the floor and
 * ship a good whose description stops mid-word. A sentence cannot end while a
 * bracket is open, so the two conditions together are the honest test.
 */
function isClosed(text) {
  if (text.length === 0) return true;
  if (!/\.$/.test(text)) return false;
  let depth = 0;
  for (const char of text) {
    if (char === "(") depth += 1;
    if (char === ")") depth = Math.max(0, depth - 1);
  }
  return depth === 0;
}

const LABEL = /^([A-Z][A-Z0-9/'’ -]*[A-Z])(\s*\([^)]*\))?:\s*(.*)$/;
const ROOM = /^##\s+(.+?),\s*(\d{4})\s*(.*)$/;
const SECTION = /^##\s+(.+?)\s*$/;

/**
 * The document -> rooms, each holding labelled blocks of joined text.
 *
 * The three structural hazards, each handled where it occurs:
 *
 *   A ROOM HEADING'S NOTE WRAPS. Four headings carry a `*(…)*` aside that runs
 *     onto the next line. The continuation is consumed until the `)*` closes,
 *     rather than being read as an orphan sentence.
 *
 *   A CONTINUATION LINE CAN LOOK LIKE A LABEL. Aspen wraps onto "FOUNDER CALL:
 *     ships or owned-if-present", which matches the label pattern exactly. A
 *     label therefore only opens a block when the block above it has REACHED A
 *     FULL STOP; mid-sentence, it is what it is, a continuation.
 *
 *   A SENTENCE CAN BELONG TO NO BLOCK. Palm Springs ends with "Everything else
 *     pending founder material." under no label at all. It is not swallowed
 *     into HOST ACTS — which would corrupt that room's gesture — it is recorded
 *     as an orphan and reported.
 */
function parse(text) {
  const lines = text.split("\n");
  const rooms = [];
  const orphans = [];
  const ledgerLines = [];
  let candleLine = null;

  let room = null;
  let section = null;
  let block = null;

  const closeBlock = () => {
    if (block && block.text.length > 0) room.blocks.push(block);
    block = null;
  };

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    /* ── headings ── */
    if (line.startsWith("## ")) {
      closeBlock();
      const asRoom = ROOM.exec(line);
      const asSection = SECTION.exec(line);

      if (asRoom) {
        let heading = `${asRoom[1]}, ${asRoom[2]}`;
        let note = asRoom[3] ?? "";
        // A wrapped `*( … )*` aside.
        while (note.includes("*(") && !note.includes(")*") && i + 1 < lines.length) {
          i += 1;
          note = joinWrapped(note, lines[i].trim());
        }
        const key = ROOM_HEADINGS[heading];
        if (!key) {
          fail(
            `line ${i + 1}: "${heading}" is not a room this catalogue knows. ` +
              `Add it to ROOM_HEADINGS in scripts/catalogue-vocabulary.mjs — ` +
              `an unknown heading is a decision, not a skip, and ` +
              `docs/new-destination.md §5 is about exactly this step.`
          );
        }
        if (!Object.hasOwn(DESTINATIONS, key)) {
          fail(
            `line ${i + 1}: ROOM_HEADINGS maps "${heading}" to "${key}", ` +
              `which is not in DESTINATIONS. The two maps must agree.`
          );
        }
        room = {
          heading,
          key,
          slug: DESTINATIONS[key],
          note: note.replace(/^\*\(|\)\*$/g, "").replace(/\*/g, "").trim(),
          line: i + 1,
          blocks: [],
        };
        rooms.push(room);
        section = null;
        continue;
      }

      const name = asSection ? asSection[1] : line.slice(3).trim();
      if (!NOT_A_ROOM.has(name)) {
        fail(
          `line ${i + 1}: "${name}" is a "##" heading that is neither a room ` +
            `("NAME, YEAR") nor one of the document's three non-room ` +
            `sections. An unknown section is a decision, not a skip.`
        );
      }
      room = null;
      section = name;
      continue;
    }

    if (line.length === 0 || line === "---" || line.startsWith("# ")) {
      closeBlock();
      continue;
    }

    /* ── the two non-room sections that carry data ── */
    if (section === "NEW CONTENT CLASSES (schema-relevant)") {
      if (line.includes("Candle-surface dimension")) {
        let joined = line;
        while (!/\bFeeds check:staging\.?/.test(joined) && i + 1 < lines.length) {
          i += 1;
          joined = joinWrapped(joined, lines[i].trim());
        }
        candleLine = joined;
      }
      continue;
    }
    if (section === "FOUNDER-PENDING LEDGER (from this bank)") {
      const numbered = /^(\d+)\.\s+(.*)$/.exec(line);
      if (numbered) {
        ledgerLines.push({ n: Number(numbered[1]), text: numbered[2], line: i + 1 });
      } else if (ledgerLines.length > 0) {
        const last = ledgerLines[ledgerLines.length - 1];
        last.text = joinWrapped(last.text, line);
      } else {
        orphans.push({ room: null, line: i + 1, text: line });
      }
      continue;
    }
    if (section !== null) continue;
    if (room === null) continue;

    /* ── labelled blocks ── */
    const label = LABEL.exec(line);
    if (label && isClosed(block ? block.text : "")) {
      closeBlock();
      const name = label[1];
      if (!BLOCKS.has(name)) {
        fail(
          `line ${i + 1}: "${name}:" is a block label nobody has mapped, in ` +
            `${room.heading}. Add it to BLOCKS in this file and say what the ` +
            `router does with it — an unmapped label is a paragraph of the ` +
            `founder's thinking that would otherwise vanish silently.`
        );
      }
      block = {
        label: name,
        qualifier: (label[2] ?? "").trim(),
        text: label[3].trim(),
        line: i + 1,
      };
      continue;
    }

    if (block === null || isClosed(block.text)) {
      closeBlock();
      orphans.push({ room: room.heading, line: i + 1, text: line });
      continue;
    }

    block.text = joinWrapped(block.text, line);
  }

  closeBlock();

  if (rooms.length === 0) fail(`no rooms found in ${SOURCE_NAME}`);
  return { rooms, orphans, ledgerLines, candleLine };
}

/* ── clause -> row ──────────────────────────────────────────────────── */

/** Is this clause's name printed matter the house authors? */
function isPrintedMatter(name) {
  if (IS_A_KIT.test(name)) return false;
  const lower = name.toLowerCase();
  return PRINTED_MATTER.some((phrase) => lower.includes(phrase));
}

/**
 * The cards riding with an item, pulled out of the clause.
 *
 * Two shapes, both hers:
 *
 *   `(+technique card: 1938 spec — ~2:1, stirred, lemon twist)`  a parenthetical
 *       that OPENS with a plus. Everything after the colon is the card's spec.
 *
 *   `… + Watten/briscola rules card`  a trailing segment of the spine that ends
 *       in "card" AND names what kind of card it is. The second half of that
 *       test is load-bearing: Acapulco's sparkler kit ends "+ NYC-legality flag
 *       on card", which is a note ABOUT the kit's card, not a second card, and
 *       a rule that only looked at the last word would have made one up.
 */
const CARD_KINDS = /\b(technique|rules|story|lore|call|prompt|translation|apology|stakes)\b/i;

function extractCards(spine, parens) {
  const cards = [];
  const keptParens = [];

  for (const paren of parens) {
    // The plus is not always first. "(pool act, +card)" and "(pool act,
    // +technique card)" put a note before it, so the card is everything from
    // the plus to the end of the parenthesis and the note is what came before.
    const plus = paren.indexOf("+");
    if (plus === -1) {
      keptParens.push(paren);
      continue;
    }
    const before = paren.slice(0, plus).replace(/[,;\s]+$/, "").trim();
    const body = paren.slice(plus + 1).trim();
    // She separates a card's NAME from its SPEC three ways — a colon, an em
    // dash, or a comma — and uses all three within four rooms of each other:
    // "+technique card: 1938 spec", "+technique card — water then never ice
    // first", "+card, small flame". First one wins.
    const at = [/:/, / — /, /,/]
      .map((pattern) => {
        const found = pattern.exec(body);
        return found ? { index: found.index, length: found[0].length } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.index - b.index)[0];
    const phrase = at ? body.slice(0, at.index).trim() : body;
    const spec = at ? body.slice(at.index + at.length).trim() : "";

    // A plus inside a parenthesis is not always a card. Catskills writes
    // "(pre-written categories + blanks)" and St. Moritz writes "('for the
    // weekend,' … + blanks)" — both are parts of the thing, not cards riding
    // with it. So the text after the plus has to SAY it is a card.
    if (!/\bcards?\b/i.test(phrase)) {
      keptParens.push(paren);
      continue;
    }
    if (before.length > 0) keptParens.push(before);
    cards.push({ phrase, spec, from: "parenthetical" });
  }

  const segments = splitDepthZero(spine, "+");
  const kept = [];
  for (let index = 0; index < segments.length; index++) {
    const segment = segments[index];
    if (index > 0 && /cards?$/i.test(segment) && CARD_KINDS.test(segment)) {
      cards.push({ phrase: segment, spec: "", from: "spine" });
      continue;
    }
    kept.push(segment);
  }

  return { spine: kept.join(" + "), parens: keptParens, cards };
}

/**
 * THE `Also at:` LINE — section 10.
 *
 * A depth-0 parenthetical, so it rides in the channel this document already
 * uses for everything said ABOUT an item rather than in it: `(GESTURE)`,
 * `(owned-if-present)`, `(FOUNDER-PENDING — …)`. The words inside are verbatim
 * docs/drinks.md's sixth bullet.
 */
const ALSO_AT = /\(\s*Also at:?\s*([^)]*)\)/i;

/** Anything else that says "also at" and is not the line. See `readAlsoAt`. */
const SOUNDS_LIKE_ALSO_AT = /\balso\s+at\b/i;

/**
 * The rooms an `Also at:` line names, and the clause with the line removed.
 *
 * REMOVED, because the line is a claim about the row and not part of it. Every
 * other reader downstream — the name, the description that reaches a member,
 * the FOUNDER-PENDING test, the `differs` comparison against what the database
 * already holds — sees the clause exactly as it read before the line was
 * added. So adding one to an existing item changes its rooms and NOTHING else,
 * and does not need `--overwrite` to land. Same treatment seed-drinks gives
 * its sixth bullet, for the same reason.
 *
 * A clause that says "also at" anywhere else is a hard failure rather than a
 * skip: a line the author believed was a claim and the parser silently read as
 * prose is precisely the shape of failure section 10 exists to end.
 */
function readAlsoAt(clause, roomKey, context) {
  const match = ALSO_AT.exec(clause);
  if (!match) {
    if (SOUNDS_LIKE_ALSO_AT.test(clause)) {
      fail(
        `${context} "${clause}" says "also at" but not as its own ` +
          `parenthetical. The only form this file reads is ` +
          `"(Also at: <destination>, <destination>)" — see section 10. A ` +
          `phrase that looks like a claim and is read as prose is worse than ` +
          `a failed run.`
      );
    }
    return { also: [], clause };
  }

  const also = [];
  for (const raw of match[1].split(",")) {
    const heading = raw.trim();
    if (heading.length === 0) continue;
    if (!Object.hasOwn(DESTINATIONS, heading)) {
      const asRoom = Object.hasOwn(ROOM_HEADINGS, heading.toUpperCase());
      fail(
        `${context} "Also at" names "${heading}", which is not a destination ` +
          `this catalogue knows. ` +
          (asRoom
            ? `Write the short name — the key of DESTINATIONS in ` +
              `scripts/catalogue-vocabulary.mjs — and not the room heading: a ` +
              `heading carries a comma and this list is comma-separated.`
            : `Add it to DESTINATIONS in scripts/catalogue-vocabulary.mjs — ` +
              `docs/new-destination.md §5 is about exactly this step.`)
      );
    }
    if (heading === roomKey) {
      fail(
        `${context} "Also at" names ${heading}, which is the room the clause ` +
          `already sits under.`
      );
    }
    if (!also.includes(heading)) also.push(heading);
  }

  if (also.length === 0) {
    fail(`${context} "${match[0]}" names no destination at all.`);
  }

  return {
    also,
    clause: clause.replace(ALSO_AT, "").replace(/\s+/g, " ").trim(),
  };
}

/**
 * The clause -> everything the row needs, or a refusal.
 *
 * Returns `{ skip, reason }` where the parser will not commit to a row.
 */
function readClause(raw, context, roomKey) {
  const withAlso = raw.replace(/\.$/, "").trim();
  // Before anything else reads the clause, so that no downstream reader — the
  // name, the description, the hold-back test — ever sees the line.
  const { also, clause } = readAlsoAt(withAlso, roomKey, context);

  // Her own thinking-out-loud. "oyster... no — pasta board, flour scoop for the
  // lesson" is a line being changed mid-write, and a machine that picks one of
  // the two halves is a machine authoring content.
  if (/\.\.\./.test(clause)) {
    return { skip: true, reason: "the line changes its mind mid-sentence ('…')" };
  }

  const isGesture = /\bGESTURE\b/.test(clause);

  const peeled = peelParentheses(clause);
  const extracted = extractCards(peeled.spine, peeled.parens);

  let name = extracted.spine.split(" — ")[0].trim();
  name = name.replace(/[.,;:]+$/, "").trim();

  if (name.length === 0) {
    return { skip: true, reason: "nothing is left of the clause once its parentheses come off" };
  }

  if (/^none\b/i.test(name)) {
    return { skip: true, reason: "the room says none, on purpose", declined: true };
  }

  const lower = clause.toLowerCase();

  let phase = "all";
  for (const [word, value] of PHASE_WORDS) {
    if (lower.includes(word)) {
      phase = value;
      break;
    }
  }

  let venue = "none";
  for (const [tag, value] of VENUE_TAGS) {
    if (clause.includes(tag)) {
      venue = value;
      break;
    }
  }

  const lead = /min_lead_days\s*~?\s*(\d+)/.exec(clause);
  const leadNamed = /min_lead_days/.test(clause);

  // db/044. Null for everything that is not in the third category, which is
  // every row the bank held before today.
  const supply = readSupply(clause, name);

  return {
    skip: false,
    raw: clause,
    name,
    also,
    isGesture,
    cards: extracted.cards,
    phase,
    venue,
    minLeadDays: lead ? Number(lead[1]) : null,
    leadNamedWithoutNumber: leadNamed && !lead,
    // An evening-supplied row has no stock, so there is no line on the order.
    // db/044's CHECK refuses the other combination rather than correcting it,
    // and the report names every row this touched.
    ships: !OWNED_IF_PRESENT.test(clause) && supply === null,
    weight: /\blow weight\b/i.test(clause) ? LOW_WEIGHT : 1,
    supply,
    context,
  };
}

/* ── the build ──────────────────────────────────────────────────────── */

const document = readFileSync(SOURCE, "utf8");
const { rooms, orphans, ledgerLines, candleLine } = parse(document);

if (ledgerLines.length !== LEDGER.length) {
  fail(
    `the founder-pending ledger has ${ledgerLines.length} entries and this ` +
      `file's LEDGER table expects ${LEDGER.length}. A ledger entry that is ` +
      `not in the table is one nobody carried through — add it, with the room ` +
      `it names and the words that find its item.`
  );
}

/** The candle surfaces, read off the NEW CONTENT CLASSES line. */
const candleSurfaces = new Map();
const candleUnmapped = [];
if (candleLine) {
  const body = candleLine.replace(/^.*?answers "on what" — /, "").replace(/Feeds check:staging\.?$/, "");
  for (const piece of body.split("·")) {
    const at = piece.indexOf(":");
    if (at === -1) continue;
    const label = piece.slice(0, at).trim();
    const surface = piece.slice(at + 1).trim().replace(/[.\s]+$/, "");
    for (const part of label.split("&").map((p) => p.trim())) {
      const key = SHORT_NAMES.get(part);
      if (!key) {
        candleUnmapped.push(part);
        continue;
      }
      candleSurfaces.set(key, surface);
    }
  }
}
if (candleUnmapped.length > 0) {
  fail(
    `the candle-surface line names ${candleUnmapped.join(", ")}, which ` +
      `SHORT_NAMES in this file does not map. Add it — a room whose candles ` +
      `have no surface is a check:staging line that cannot be written.`
  );
}

const items = [];
const gestures = [];
const routed = { dish: [], drink: [] };
const notBank = [];
const unclassified = [];
const notes = [];
const declined = [];

const takenSlugs = new Map();
function claimSlug(worldSlug, name, what) {
  const slug = `${worldSlug}-${slugify(name)}`;
  if (!/^[a-z][a-z0-9-]*$/.test(slug)) {
    fail(
      `"${name}" becomes the slug "${slug}", which bank_item.slug's CHECK in ` +
        `db/031 refuses ('^[a-z][a-z0-9-]*$').`
    );
  }
  const clash = takenSlugs.get(slug);
  if (clash) {
    fail(
      `"${name}" (${what}) and "${clash}" both become the slug "${slug}". ` +
        `bank_item.slug is unique across the whole catalogue — reword one of ` +
        `them in ${SOURCE_NAME}.`
    );
  }
  takenSlugs.set(slug, name);
  return slug;
}

for (const room of rooms) {
  const surface = candleSurfaces.get(room.key) ?? null;

  // Destination-level requires_outdoors, from the heading's own aside. NOT
  // applied to the rooms' items: db/031's `venue` is a property of an ITEM, and
  // stamping every good in Tahiti with requires_outdoors would say that a
  // banana-leaf runner cannot be laid indoors, which is false. Reported.
  if (/requires_outdoors/.test(room.note)) {
    notes.push({
      room: room.heading,
      kind: "destination-level venue",
      text:
        `The heading carries destination-level requires_outdoors ` +
        `("${room.note}"). NOTHING IN THE SCHEMA CAN HOLD IT: db/020's ` +
        `ingredient_requirement is CHECKed to ` +
        `('product','game','tracklist','menu','drink') and does not admit ` +
        `'world', and db/031's bank_item.venue is per item. No column was ` +
        `invented and no item was stamped.`,
    });
  }

  for (const block of room.blocks) {
    const spec = BLOCKS.get(block.label);
    const citation = `${SOURCE_NAME} — ${room.heading}, ${block.label}:`;

    if (spec.sink === "dish" || spec.sink === "drink") {
      for (const clause of splitDepthZero(block.text, ";")) {
        routed[spec.sink].push({
          room: room.heading,
          key: room.key,
          text: clause.replace(/\.$/, "").trim(),
          line: block.line,
        });
      }
      continue;
    }

    if (spec.kind === null && spec.sink !== "gesture") {
      notBank.push({
        room: room.heading,
        label: block.label + (block.qualifier ? ` ${block.qualifier}` : ""),
        sink: spec.sink,
        text: block.text.trim(),
        line: block.line,
      });
      continue;
    }

    if (spec.sink === "gesture") {
      // A `GESTURE:` block of its own — only Catskills has one, and it is a
      // question rather than an answer.
      gestures.push({
        room: room.heading,
        key: room.key,
        slug: room.slug,
        gesture: null,
        note: block.text.trim(),
        citation,
        line: block.line,
        undecided: /FOUNDER DECIDES/.test(block.text),
      });
      continue;
    }

    for (const raw of splitDepthZero(block.text, ";")) {
      const read = readClause(raw, citation, room.key);
      if (read.skip) {
        if (read.declined) {
          declined.push({ room: room.heading, label: block.label, text: raw.trim() });
        } else {
          unclassified.push({
            room: room.heading,
            label: block.label,
            line: block.line,
            text: raw.trim(),
            reason: read.reason,
          });
        }
        continue;
      }

      if (read.isGesture) {
        // A gesture is `world.gesture`, a column on the room — there is no row
        // for a second room to claim. "Only the signature gesture is
        // invariant" per room (the document's own routing rule 4), so two
        // rooms sharing one is a contradiction rather than a saving.
        if (read.also.length > 0) {
          fail(
            `${citation} "${read.name}" is a GESTURE and carries an ` +
              `"Also at:" line. A gesture is a column on the room, not a row ` +
              `in a pool, so there is nothing for a second room to claim — ` +
              `and the document's routing rule 4 makes the signature gesture ` +
              `invariant per room.`
          );
        }
        gestures.push({
          room: room.heading,
          key: room.key,
          slug: room.slug,
          // Seventeen rooms mark the gesture with a parenthesis, which peels
          // off with every other parenthesis. Vegas marks it with a sentence —
          // "flaming dessert is the GESTURE" — and the sentence is not the
          // gesture's name. One documented trim, and the whole clause is in
          // gesture_note either way.
          gesture: read.name.replace(/\s+is the GESTURE$/, "").trim(),
          note: read.raw,
          citation,
          line: block.line,
          undecided: false,
        });
        // Anything shippable named INSIDE an invariant is not extracted. See 4
        // in the header.
        if (read.cards.length > 0 || /\bKIT\b|min_lead_days/.test(read.raw)) {
          unclassified.push({
            room: room.heading,
            label: block.label,
            line: block.line,
            text: read.raw,
            reason:
              "a GESTURE clause that also names shippable matter (" +
              [
                read.cards.length > 0 ? `${read.cards.length} card(s)` : null,
                /\bKIT\b/.test(read.raw) ? "a kit" : null,
                /min_lead_days/.test(read.raw) ? "a lead time" : null,
              ]
                .filter(Boolean)
                .join(", ") +
              "). The gesture goes to world.gesture; splitting a good out of " +
              "the middle of an invariant is a decision a person makes",
          });
        }
        continue;
      }

      const kind = isPrintedMatter(read.name) ? "printed_card" : spec.kind;

      const description = [read.raw];
      if (surface && A_CANDLE.test(read.raw)) {
        description.push(
          `Candle surface: ${surface}. (${SOURCE_NAME}, NEW CONTENT CLASSES — ` +
            `candle-surface dimension. Feeds check:staging.)`
        );
      }

      const item = {
        room: room.heading,
        key: room.key,
        worldSlug: room.slug,
        // Section 10. Keys of DESTINATIONS, resolved to worlds at write time.
        also: read.also,
        label: block.label,
        line: block.line,
        kind,
        name: read.name,
        description,
        phase: read.phase,
        venue: read.venue,
        minLeadDays: read.minLeadDays,
        ships: read.ships,
        weight: read.weight,
        // db/044. `stocked` for every row that does not carry the marker, which
        // is not a guess: the bank document's own routing rule says the bank
        // holds purchasable or placeable objects.
        supply: read.supply ? "evening_supplied" : "stocked",
        takeHomeQuantity: read.supply ? read.supply.quantity : null,
        supplyNote: read.supply ? read.supply.note : "",
        dependencies: read.supply ? read.supply.dependencies : [],
        citation,
        cards: [],
        raw: read.raw,
      };

      for (const card of read.cards) {
        // A generic "+technique card" has no name of its own; a named one does.
        const generic = /^(\+?\s*)?(technique )?cards?$/i.test(card.phrase.trim());
        const cardName = generic
          ? `${read.name} — ${card.phrase.trim() || "card"}`
          : card.phrase.trim();
        item.cards.push({
          name: cardName,
          spec: card.spec,
          from: card.from,
        });
      }

      if (read.leadNamedWithoutNumber) {
        notes.push({
          room: room.heading,
          kind: "lead time without a number",
          text:
            `"${read.name}" says min_lead_days but names no number ` +
            `("${read.raw}"). db/031: "Nulls mean no lead time, not unknown", ` +
            `so NULL would be a lie here. Left NULL and reported rather than ` +
            `guessed at.`,
        });
      }
      if (read.weight !== 1) {
        notes.push({
          room: room.heading,
          kind: "weight",
          text: `"${read.name}" is written "low weight"; ${LOW_WEIGHT} is half the default and has no theory behind it.`,
        });
      }
      if (!read.ships) {
        notes.push({
          room: room.heading,
          // TWO REASONS A LINE IS NOT ON THE ORDER since db/044, and the note
          // says which. Reporting both under "owned-if-present" would have made
          // a cork look like a turntable the house hopes she owns.
          kind: read.supply ? "the evening supplies it" : "owned-if-present",
          text: `"${read.name}" ships = false. ${read.raw}`,
        });
      }
      if (/\bowned\b/i.test(read.raw) && read.ships) {
        unclassified.push({
          room: room.heading,
          label: block.label,
          line: block.line,
          text: read.raw,
          reason:
            "says 'owned' but not 'owned-if-present' — an unresolved " +
            "either/or (ships cheap OR the house has one). Left ships = true, " +
            "which is the direction that costs a curator a second look rather " +
            "than deleting a deliverable",
        });
      }
      // Only where NOTHING was pulled out. A clause that already produced its
      // card is a clause the vocabulary handled, and reporting it again would
      // bury the sixteen that nobody has looked at under thirty-two that
      // somebody has.
      if (kind !== "printed_card" && item.cards.length === 0 && SOUNDS_PRINTED.test(read.raw)) {
        notes.push({
          room: room.heading,
          kind: "printed matter, uncaught",
          text:
            `"${read.name}" (${kind}) names something that sounds printed and ` +
            `PRINTED_MATTER does not catch: "${read.raw}". Extend the phrase ` +
            `table if it should be a card of its own.`,
        });
      }
      if (TIME_WORDS.test(read.raw)) {
        notes.push({
          room: room.heading,
          kind: "time of day",
          text: `"${read.name}" -> phase ${item.phase}. ${read.raw}`,
        });
      }

      items.push(item);
    }
  }
}

/* ── the founder-pending ledger, attached ───────────────────────────── */

const pending = [];
for (const entry of LEDGER) {
  const authored = ledgerLines.find((l) => l.n === entry.n);
  if (!authored) {
    fail(`the ledger has no entry ${entry.n}; the LEDGER table in this file expects one.`);
  }
  const record = {
    n: entry.n,
    room: entry.room,
    question: authored.text.trim(),
    line: authored.line,
    attached: [],
    why: entry.why ?? null,
  };
  if (entry.match) {
    // The marker and the hold-back are the SAME STRING, on purpose: what
    // section 1 calls "the row knows who it is" is this constant appearing in
    // the description, and `isHeldBack`, beside that constant, is the only
    // test there is.
    const flag = `${FOUNDER_PENDING} — ${authored.text.trim()} (${SOURCE_NAME}, ${FOUNDER_PENDING} LEDGER ${entry.n}.)`;
    for (const phrase of entry.match) {
      const needle = phrase.toLowerCase();
      const found = items.filter(
        (item) => item.key === entry.room && item.name.toLowerCase().includes(needle)
      );
      // Four of the ten ledger entries are about the room's GESTURE rather than
      // about anything in the pool — Catskills' whole entry is which gesture it
      // has, and Amalfi's and Acapulco's each name a gesture and an act in one
      // sentence. A gesture is not a bank row, so the flag goes where db/031
      // put the gesture: world.gesture_note.
      const onGesture = gestures.filter(
        (gesture) =>
          gesture.key === entry.room &&
          `${gesture.gesture ?? ""} ${gesture.note}`.toLowerCase().includes(needle)
      );
      if (found.length === 0 && onGesture.length === 0) {
        fail(
          `founder-pending ledger ${entry.n} names "${phrase}" at ` +
            `${entry.room}, and neither a parsed item nor the room's gesture ` +
            `carries it. The founder asked that every ledger item be flagged ` +
            `rather than skipped, so an entry that finds nothing to attach to ` +
            `is one that was skipped. Fix LEDGER in this file or the document.`
        );
      }
      // One ledger line can name two things that turn out to be ONE clause —
      // Vegas's "confirm flaming dessert as gesture, Caesar as pool act" is a
      // single sentence in the document, "tableside Caesar … OR flaming
      // dessert". The question is asked once, so it is written once.
      for (const item of found) {
        if (item.description.includes(flag)) continue;
        item.description.push(flag);
        record.attached.push(`${item.worldSlug}: ${item.name}`);
      }
      for (const gesture of onGesture) {
        if (gesture.note.includes(flag)) continue;
        gesture.note += ` ${flag}`;
        record.attached.push(`${gesture.slug}: world.gesture_note`);
      }
    }
  }
  pending.push(record);
}

/* ── slugs, and the cards as rows of their own ──────────────────────── */

const cardRows = [];
for (const item of items) {
  item.slug = claimSlug(item.worldSlug, item.name, item.kind);
}
for (const item of items) {
  item.cardSlugs = [];
  for (const [index, card] of item.cards.entries()) {
    const row = {
      room: item.room,
      key: item.key,
      worldSlug: item.worldSlug,
      // A card RIDES WITH its item (db/031's technique_card_id), so it goes
      // wherever the item goes. An item eligible in two rooms whose card was
      // claimed by one of them would be placed in the second with its card
      // pruned out from under it.
      also: item.also,
      kind: "printed_card",
      name: card.name,
      description: [
        card.spec.length > 0 ? card.spec : `As written: "${item.raw}"`,
        `Rides with: ${item.name}.`,
      ],
      phase: "all",
      venue: "none",
      minLeadDays: null,
      ships: true,
      weight: 1,
      // A card is printed matter the house authors, so it is stocked by
      // definition — including a card riding with an evening-supplied act. The
      // cork is not printed; the card explaining it would be.
      supply: "stocked",
      takeHomeQuantity: null,
      supplyNote: "",
      dependencies: [],
      citation: item.citation,
      ridesWith: item.slug,
      // db/031 holds ONE technique_card_id per row. A second card can be
      // created but cannot be attached, and that is a schema finding rather
      // than something to solve by picking a favourite.
      attachable: index === 0,
      label: item.label,
      line: item.line,
    };
    row.slug = claimSlug(item.worldSlug, card.name, "printed_card");
    item.cardSlugs.push(row.slug);
    if (index > 0) {
      notes.push({
        room: item.room,
        kind: "two cards, one attachment",
        text:
          `"${item.name}" rides with ${item.cards.length} cards. ` +
          `db/031's technique_card_id is a single self-reference, so ` +
          `"${card.name}" is created and left UNATTACHED rather than ` +
          `displacing "${item.cards[0].name}".`,
      });
    }
    cardRows.push(row);
  }
}

const allRows = [...cardRows, ...items];

/* ── the phase rulings, applied once, over the finished rows ────────── */

// After the slugs exist and before anything is reported or written, so that
// every later reader — the report, the dry run, the insert, the `differs`
// comparison against what is already in the database — sees one phase per row
// and not a derived value that something downstream quietly corrects.
for (const ruling of PHASE_RULINGS) {
  const row = allRows.find((candidate) => candidate.slug === ruling.slug);
  if (!row) {
    fail(
      `the phase ruling for "${ruling.slug}" names a row this document no ` +
        `longer produces. A ruling about a row that does not exist is a ` +
        `ruling nobody can see is dead — reword it or remove it, but it does ` +
        `not get to sit here looking applied.`
    );
  }
  if (row.phase !== ruling.was) {
    fail(
      `the phase ruling for "${ruling.slug}" overrules a derived phase of ` +
        `'${ruling.was}' and the document now derives '${row.phase}'. The ` +
        `ruling's premise has changed: decide again with a person, rather ` +
        `than letting the table win an argument it was not given.`
    );
  }
  row.phase = ruling.phase;
}

for (const declined of PHASE_RULINGS_DECLINED) {
  const row = allRows.find((candidate) => candidate.slug === declined.slug);
  if (!row) {
    fail(
      `the declined-ruling note for "${declined.slug}" names a row this ` +
        `document no longer produces. The declines are the other half of the ` +
        `ruling and go stale the same way the retags do.`
    );
  }
  if (row.phase !== declined.phase) {
    fail(
      `"${declined.slug}" is recorded as LEFT AT '${declined.phase}' by the ` +
        `widened-arc ruling and now reads '${row.phase}'. Something retagged ` +
        `a row the ruling declined to retag.`
    );
  }
}

/* ── the game routings, applied in the same place and the same way ───── */

// Section 11. After the slugs exist and before anything is reported or
// written, so that the report, the dry run, the insert and the `differs`
// comparison all see ONE kind per row. Same position as the phase rulings
// above and for the identical reason.

const routedToGame = [];
for (const ruling of GAME_ROUTINGS) {
  const row = allRows.find((candidate) => candidate.slug === ruling.slug);
  if (!row) {
    fail(
      `the game routing for "${ruling.slug}" names a row this document no ` +
        `longer produces. A ruling about a row that does not exist is a ` +
        `ruling nobody can see is dead — reword it or remove it, but it does ` +
        `not get to sit here looking applied.`
    );
  }
  if (row.kind !== ruling.was) {
    fail(
      `the game routing for "${ruling.slug}" overrules a derived kind of ` +
        `'${ruling.was}' and the document now derives '${row.kind}'. The ` +
        `ruling's premise has changed: decide again with a person, rather ` +
        `than letting the table win an argument it was not given.`
    );
  }
  row.kind = "game";
  routedToGame.push({ ...ruling, name: row.name, room: row.room });
}

for (const declined of GAME_ROUTINGS_DECLINED) {
  const row = allRows.find((candidate) => candidate.slug === declined.slug);
  if (!row) {
    fail(
      `the declined game routing for "${declined.slug}" names a row this ` +
        `document no longer produces. The declines are the other half of the ` +
        `ruling and go stale the same way the routings do — and here they are ` +
        `also the honest form of the count.`
    );
  }
  if (row.kind !== declined.kind) {
    fail(
      `"${declined.slug}" is recorded as LEFT AT kind '${declined.kind}' by ` +
        `the game ruling and now reads '${row.kind}'. Something reclassified ` +
        `a row the ruling declined to reclassify.`
    );
  }
}

// THE KILL CHECK. Catalogue-wide, and a routed row matching a kill is the same
// failure with a louder message: a killed game reappearing as a routing win
// would look exactly like the fix working.
const killMatches = [];
for (const killed of KILLED_GAMES) {
  // The phrase whole, at word boundaries. Not a `includes`: "keno" is four
  // letters and would sit inside a longer word one day, and a kill check that
  // fails a run for a coincidence is a check somebody eventually deletes.
  const whole = new RegExp(
    `\\b${killed.phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
    "i"
  );
  const hits = allRows.filter((row) => whole.test(row.name));
  killMatches.push({ ...killed, hits });
  for (const hit of hits) {
    const wasRouted = routedToGame.some((r) => r.slug === hit.slug);
    fail(
      `"${hit.slug}" carries the name of a KILLED item — "${killed.phrase}" ` +
        `(${killed.where})` +
        (wasRouted
          ? `, and the game routing table just made it a game. A kill is a ` +
            `decision that something does NOT exist, and resurrecting one as ` +
            `a routing win is this table's worst failure because it looks ` +
            `like the fix working.`
          : `. A kill is a decision that something does NOT exist; a row ` +
            `carrying its name is a decision being undone silently.`)
    );
  }
}

/* ── the report ─────────────────────────────────────────────────────── */

const KINDS = ["good", "host_act", "game", "printed_card"];

function section(title) {
  console.log(`\n${"─".repeat(72)}\n${title}\n${"─".repeat(72)}`);
}

function report() {
  console.log(
    `[seed-bank] ${SOURCE_NAME}: ${rooms.length} rooms, ` +
      `${allRows.length} bank_item rows (${items.length} from clauses, ` +
      `${cardRows.length} printed cards pulled out of them), ` +
      `${gestures.length} gestures, ` +
      `${routed.dish.length} dish lines and ${routed.drink.length} drink ` +
      `lines routed out.` + (dryRun ? " DRY RUN — nothing was written." : "")
  );

  section("EVERY ROW, PER DESTINATION");
  for (const room of rooms) {
    const mine = allRows.filter((row) => row.key === room.key);
    const counts = KINDS.map((kind) => `${kind} ${mine.filter((r) => r.kind === kind).length}`).join(" · ");
    console.log(`\n## ${room.heading}  [${room.slug}]  ${mine.length} rows — ${counts}`);
    if (mine.length === 0) console.log("   (no bank rows — see the gestures and the not-bank sections)");
    for (const row of mine) {
      const flags = [
        `phase=${row.phase}`,
        `ships=${row.ships}`,
        row.minLeadDays === null ? null : `lead=${row.minLeadDays}d`,
        row.weight === 1 ? null : `weight=${row.weight.toFixed(3)}`,
        row.ridesWith ? `rides-with=${row.ridesWith}${row.attachable ? "" : " (UNATTACHED)"}` : null,
        row.cardSlugs && row.cardSlugs.length > 0 ? `card=${row.cardSlugs[0]}` : null,
      ]
        .filter(Boolean)
        .join(" ");
      console.log(`   [${row.kind.padEnd(12)}] ${row.slug}`);
      console.log(`       name  ${row.name}`);
      console.log(`       ${flags}`);
      for (const paragraph of row.description) console.log(`       desc  ${paragraph}`);
      console.log(`       cite  ${row.citation}`);
    }
  }

  section("GESTURES — world.gesture / world.gesture_note, NOT bank rows");
  for (const gesture of gestures) {
    console.log(`\n${gesture.slug}`);
    console.log(`   gesture       ${gesture.gesture ?? "NULL — the founder has not decided"}`);
    console.log(`   gesture_note  ${gesture.note} [${gesture.citation}]`);
  }
  const missing = rooms.filter((room) => !gestures.some((g) => g.key === room.key));
  if (missing.length > 0) {
    console.log(
      `\nNO GESTURE AT ALL: ${missing.map((r) => r.heading).join(", ")}. ` +
        `The document marks a gesture in seventeen of eighteen rooms; this one ` +
        `is not marked and none was inferred.`
    );
  }

  section("ROUTED OUT — FOOD");
  console.log(
    `Emitted, not written. docs/dishes.md holds "- <name> · <B|H|M>" lines and\n` +
      `every line must carry a making level; none of these does. Paste under the\n` +
      `destination heading named, add the making level, and update\n` +
      `PER_DESTINATION in scripts/seed-dishes.mjs IN THE SAME COMMIT.`
  );
  reportRoutes(routed.dish, DISHES_DOC, "docs/dishes.md");

  section("ROUTED OUT — DRINK");
  console.log(
    `Emitted, not written. docs/drinks.md entries are five bullets and the\n` +
      `second is the MOCKTAIL MIRROR; seed-drinks fails rather than writing a\n` +
      `drink whose mirror is missing. The bank supplies no mirrors, so every\n` +
      `line below needs one authored before it can be an entry.`
  );
  reportRoutes(routed.drink, DRINKS_DOC, "docs/drinks.md");

  section("FOUNDER-PENDING LEDGER — ten items, none skipped");
  for (const entry of pending) {
    console.log(`\n${entry.n}. ${entry.question}`);
    if (entry.attached.length > 0) {
      console.log(`   flagged draft-with-question on:`);
      for (const where of entry.attached) console.log(`     · ${where}`);
    } else {
      console.log(`   NO BANK ROW IS ITS RIGHT HOME. ${entry.why}`);
    }
  }

  section("NOT BANK CONTENT — parsed, kept, written nowhere");
  for (const block of notBank) {
    console.log(`\n${block.room} — ${block.label}  (${block.sink})`);
    console.log(`   ${block.text}`);
  }
  if (declined.length > 0) {
    console.log(`\nROOMS THAT DECLINE A KIND ON PURPOSE:`);
    for (const entry of declined) {
      console.log(`   ${entry.room} — ${entry.label}: ${entry.text}`);
    }
    console.log(
      `\n   A "none" LINE IS NOT A RULE THAT THE ROOM IS GAMELESS, and this\n` +
        `   paragraph is here so that nobody later "completes" the mechanism by\n` +
        `   writing the fact down. Founder, on the games fix: "lets not make a\n` +
        `   blanket rule that a room is gameless." The line above produces NO\n` +
        `   ROW, NO COLUMN AND NO NEGATIVE CLAIM — nothing anywhere records that\n` +
        `   a room HAS no game, so a room that says none can receive one the\n` +
        `   moment somebody names one, in a GAMES: block or in GAME_ROUTINGS,\n` +
        `   without touching the parser. Absence of a game row means nobody has\n` +
        `   written one; it never means the room refuses one.`
    );
  }

  section("COULD NOT CLASSIFY — read this first");
  if (unclassified.length === 0 && orphans.length === 0) {
    console.log("Nothing. Which would be surprising; check the parser.");
  }
  for (const entry of unclassified) {
    console.log(`\n${entry.room} — ${entry.label}, line ${entry.line}`);
    console.log(`   ${entry.text}`);
    console.log(`   WHY: ${entry.reason}.`);
  }
  for (const orphan of orphans) {
    console.log(`\n${orphan.room ?? "(no room)"} — line ${orphan.line}, under no block label`);
    console.log(`   ${orphan.text}`);
    console.log(`   WHY: a sentence that belongs to no labelled block. Not swallowed into the block above it.`);
  }

  section("PHASE RULINGS — TAHITI'S WIDENED ARC");
  console.log(
    `\nTahiti became an AFTERNOON-THROUGH-MORNING arc by founder ruling on ` +
      `2026-08-23.\nThe room now begins in daylight, so items whose whole ` +
      `character is daylight are\nsaid so outright instead of carrying the ` +
      `NO OPINION the evening-only room left\nthem with. db/040 makes the ` +
      `same three changes to rows already in the database.\n` +
      `\nThe hinge is UNMOVED: the torches go up in full daylight, as they ` +
      `always did.\nIt lives on the destination record, not in the bank — no ` +
      `row below can shift it.`
  );
  console.log(`\nRETAGGED (${PHASE_RULINGS.length})`);
  for (const ruling of PHASE_RULINGS) {
    console.log(`   ${ruling.slug}: ${ruling.was} -> ${ruling.phase}`);
    console.log(`      ${ruling.why}`);
  }
  console.log(`\nLEFT ALONE (${PHASE_RULINGS_DECLINED.length})`);
  for (const declined of PHASE_RULINGS_DECLINED) {
    console.log(`   ${declined.slug}: stays ${declined.phase}`);
    console.log(`      ${declined.why}`);
  }
  console.log(
    `\n   "Where it is obvious" was the founder's qualifier and the LEFT ` +
      `ALONE list is\n   where it did the work. Two of those rows are open ` +
      `questions rather than\n   settled noes — the finished leis, and ` +
      `whether a technique card should\n   inherit the phase of the item it ` +
      `rides with.`
  );

  reportGames(allRows);
  reportSupply(allRows);
  reportShared(allRows);

  section("JUDGEMENTS AND GAPS");
  const byKind = new Map();
  for (const note of notes) {
    const list = byKind.get(note.kind) ?? [];
    list.push(note);
    byKind.set(note.kind, list);
  }
  for (const [kind, list] of byKind) {
    console.log(`\n${kind.toUpperCase()} (${list.length})`);
    for (const note of list) console.log(`   ${note.room}: ${note.text}`);
  }
  console.log(`\nBANK_PHASE HAS NO 'dawn'`);
  console.log(
    `   Havana's dawn pour and St. Moritz's dawn breakfast are authored ` +
      `content\n   and db/031's day_phase is (daylight, dusk, dark, dawn, all). ` +
      `'dark' is the\n   nearest and is not true — dawn is the moment dark ` +
      `ends. Both rows are\n   phase='all' (NO OPINION) rather than wrongly ` +
      `dark.`
  );
  console.log(`\nA DISH CANNOT CARRY A STRUCTURAL REQUIREMENT`);
  console.log(
    `   Big Sur routes "s'mores (requires_outdoors)" to the dish pool, and\n` +
      `   db/020's ingredient_requirement is CHECKed to ('product', 'game',\n` +
      `   'tracklist', 'menu', 'drink'). 'dish' is not in the list, so that\n` +
      `   requirement has nowhere to live either.`
  );
  console.log(`\nTHE 'descent' TAG DOES NOT EXIST YET`);
  console.log(
    `   The routing rules introduce it as a new dish tag ("one deliberately\n` +
      `   humble late plate, till-morn/late rooms only"). db/021's dish table\n` +
      `   has no such column and six rooms say "NO descent" explicitly, which\n` +
      `   is positive evidence worth keeping. A migration, not a seeder.`
  );
  console.log(`\nbank_item_ingredient IS EMPTY BY DESIGN THIS RUN`);
  console.log(
    `   db/031's shoppable-atmosphere table points at canonical product rows.\n` +
      `   The bank names no products, so nothing is linked and nothing was\n` +
      `   invented.`
  );
  console.log(`\n'outdoor_access' IS NOT A structural_requirement`);
  console.log(
    `   RESOLVED BY db/033 — outdoor_access is now a structural_requirement\n` +
      `   structural_requirement table has only 'requires_outdoors'. The two\n` +
      `   in its own right at position 15, a GRADE below requires_outdoors.\n` +
      `   bank_item.venue is dropped; a bank item carries its requirement\n` +
      `   through ingredient_requirement, the same table a menu uses, so\n` +
      `   venueEligibility() reads both the same way. This seeder writes no\n` +
      `   venue at all — declare one at /desk/bank once the rows exist.`
  );

  section("COUNTS");
  const header = ["destination".padEnd(22), ...KINDS.map((k) => k.padStart(13)), "total".padStart(7)].join("");
  console.log(header);
  for (const room of rooms) {
    const mine = allRows.filter((row) => row.key === room.key);
    console.log(
      [
        room.slug.padEnd(22),
        ...KINDS.map((kind) => String(mine.filter((r) => r.kind === kind).length).padStart(13)),
        String(mine.length).padStart(7),
      ].join("")
    );
  }
  console.log(
    [
      "TOTAL".padEnd(22),
      ...KINDS.map((kind) => String(allRows.filter((r) => r.kind === kind).length).padStart(13)),
      String(allRows.length).padStart(7),
    ].join("")
  );
  const holding = allRows.filter(isHeldBack);
  console.log(
    `\n${allRows.length - holding.length} row(s) above go LIVE on the way in ` +
      `and ${holding.length} stay in draft\nbecause they carry a ` +
      `${FOUNDER_PENDING} question in their own text. There is still no ` +
      `--activate\nflag on this seeder; see 1 in this file's header for why, ` +
      `and for what replaced it.`
  );
  for (const row of holding) {
    console.log(`  held  ${row.slug} — ${row.name}`);
  }
}

/**
 * THE GAMES — section 11, with the count in front of the argument.
 *
 * CLAUDE.md rule 24 in its literal form: after a routing step, count the rows
 * it touched and put that number beside the number that was expected. The
 * expectation here is the founder's read-only audit — 22 rows misfiled by the
 * header-only router — and this file converts 20. The gap is printed, the
 * declines are printed with it, and neither is rounded away.
 */
function reportGames(rows) {
  section("GAMES — ROUTED BY CONTENT, NOT BY HEADING");

  const games = rows.filter((row) => row.kind === "game");
  const fromHeading = games.filter(
    (row) => !routedToGame.some((r) => r.slug === row.slug)
  );

  console.log(
    `   THE COUNT FIRST. ${games.length} game rows in the catalogue: ` +
      `${fromHeading.length} from a GAMES:\n   heading, which is all the ` +
      `parser has ever produced across eighteen rooms, and\n   ` +
      `${routedToGame.length} routed here by ruling from a GOODS: line. The ` +
      `founder's audit counted 22\n   rows misfiled by this defect. THIS ` +
      `TABLE CONVERTS ${routedToGame.length} OF THOSE 22 and the ` +
      `${22 - routedToGame.length}\n   it does not are not a rounding error ` +
      `— every candidate looked at and\n   refused is listed below by name, ` +
      `so the difference can be read rather than\n   guessed at. Overruling ` +
      `any of them is one line in GAME_ROUTINGS.\n`
  );

  console.log(`   ROUTED (${routedToGame.length})`);
  for (const ruling of routedToGame) {
    console.log(`     ${ruling.slug}: ${ruling.was} -> game`);
    console.log(`        ${ruling.why}`);
  }

  console.log(`\n   LOOKED AT AND LEFT ALONE (${GAME_ROUTINGS_DECLINED.length})`);
  for (const declined of GAME_ROUTINGS_DECLINED) {
    console.log(`     ${declined.slug}: stays ${declined.kind}`);
    console.log(`        ${declined.why}`);
  }

  const byRoom = new Map();
  for (const row of games) {
    byRoom.set(row.room, (byRoom.get(row.room) ?? 0) + 1);
  }
  const gameless = rooms.filter((room) => !games.some((g) => g.key === room.key));
  console.log(
    `\n   ROOMS WITH A GAME ROW: ${byRoom.size} of ${rooms.length}. ` +
      `Before this ruling, three.\n   ROOMS WITH NONE: ` +
      (gameless.length === 0
        ? "none."
        : `${gameless.map((r) => r.heading).join(", ")}.`) +
      `\n   THAT IS AN ABSENCE OF AUTHORING, NOT A CLAIM ABOUT THE ROOM. See ` +
      `the\n   "declines a kind on purpose" note above: nothing in this ` +
      `catalogue records\n   that a room HAS no game, and nothing may.`
  );

  console.log(`\n   THE KILL CHECK — ${KILLED_GAMES.length} killed items, checked against every row`);
  for (const killed of killMatches) {
    console.log(
      `     "${killed.phrase}" — ${killed.hits.length === 0 ? "no row carries it" : "MATCHED"} ` +
        `[${killed.where}]`
    );
  }
  console.log(
    `\n   Full phrases and not keywords, which is the whole care in that list:\n` +
      `   "the belote sheet" was cut and "belote rules card" is routed to game,\n` +
      `   one word apart and opposite decisions. A match is a FAILED RUN, not a\n` +
      `   warning — a killed game reappearing as a routing win would look\n` +
      `   exactly like the fix working.`
  );

  console.log(`\n   WHAT THIS DOES NOT REACH, and what it would take:`);
  console.log(
    `     · TWENTY \`piece: "game_rule"\` ENTRIES in src/lib/destinations.ts,\n` +
      `       across all eighteen rooms — each a game written in the room's own\n` +
      `       voice, none of them a row in bank_item or in the game table. That\n` +
      `       is where most of the catalogue's games live. Routing them is not a\n` +
      `       parser change: a voice line is a SENTENCE ("Everybody names the\n` +
      `       song that gets them up"), and a game row needs rules, bounds, a\n` +
      `       host role and a runbook (db/010). It is authoring, in the game\n` +
      `       table's own seeder, and it is the founder's call whether it is\n` +
      `       next.\n` +
      `     · THE \`game\` TABLE IS STILL WESTHAMPTON'S ALONE. Its rows are\n` +
      `       scoped to westhampton-1976 and this ruling does not change that:\n` +
      `       bank_kind='game' rows fill the four ATMOSPHERE slots (db/043), not\n` +
      `       the ambient_game slot the game pool fills. Seventeen rooms still\n` +
      `       have no eligible game-table row.\n` +
      `     · THREE TAKE-HOMES DECLARE DEPENDENCIES ON GAME SLOTS AND NONE OF\n` +
      `       THEM IS SATISFIED BY THIS FIX. Vegas's IOU watches\n` +
      `       "game yields_iou"; Oaxaca's Conquián tally and St. Moritz's\n` +
      `       backgammon column watch "ambient_game yields_score_sheet"; St.\n` +
      `       Moritz's doubling cube watches "ambient_game yields_prize". Those\n` +
      `       slots are filled from the GAME TABLE, so a bank row of kind 'game'\n` +
      `       does not feed them. They remain aimed at nothing, and they would\n` +
      `       still be aimed at nothing if every one of the twenty above were a\n` +
      `       game-table row, because ingredient_supplies is empty on every\n` +
      `       database the committed chain builds (db/044).`
  );

  console.log(`\n   TWO ROOMS CONTRADICT THEMSELVES, AND ONLY THE FOUNDER CAN RULE:`);
  console.log(
    `     · TAHITI. This document says "GAMES: none, on purpose", and\n` +
      `       src/lib/destinations.ts carries a game_rule for the room:\n` +
      `       "Everybody says what they would want on the last night. Whoever\n` +
      `       names something already on the table cooks tomorrow."\n` +
      `     · ACAPULCO. "GAMES: none — the band, the window, and the dancing\n` +
      `       are the shelf", against a voice line that reads "Everybody names\n` +
      `       the last song. Whoever names one already played goes in the\n` +
      `       water."\n` +
      `   The voice record and the bank record disagree. NOTHING HERE RESOLVES\n` +
      `   EITHER — no row is written, no "none" is enforced, and both are booked\n` +
      `   as rulings owed in docs/proposals.md under 2026-08-27.`
  );
}

/**
 * THE EVENING SUPPLIES IT — every row db/044's third category touched.
 *
 * Printed whether or not there are any, so that "none" is a reading rather than
 * a section that quietly did not appear. Nothing here is set silently: the two
 * quantity semantics are separated because that separation is the whole point
 * of the founder's ruling, and the rows watching nothing are listed under their
 * own heading because "supplied by the night itself" is a decision somebody
 * made and not a dependency somebody forgot.
 */
function reportSupply(rows) {
  const supplied = rows.filter((row) => row.supply === "evening_supplied");
  section("THE EVENING SUPPLIES IT — db/044's third category");

  if (supplied.length === 0) {
    console.log(
      `   None. Every row in the document is stocked, which is what the ` +
        `bank's own\n   routing rule says the bank holds.`
    );
    return;
  }

  const perGuest = supplied.filter((r) => r.takeHomeQuantity === "per_guest");
  const single = supplied.filter((r) => r.takeHomeQuantity === "single_artifact");
  const unwatched = supplied.filter((r) => r.dependencies.length === 0);

  console.log(
    `   ${supplied.length} row(s) carry the marker. Every one ships nothing ` +
      `(db/044 refuses\n   the other combination) and every one names how the ` +
      `night produces it.\n`
  );

  const show = (label, list) => {
    console.log(`   ${label} — ${list.length}`);
    for (const row of list) {
      const watches =
        row.dependencies.length === 0
          ? "the night itself"
          : row.dependencies
              .map((d) => `${d.slotCode} -> ${d.supplies}`)
              .join(" AND ");
      console.log(`     ${row.slug}`);
      console.log(`       watches  ${watches}`);
    }
    console.log("");
  };

  show("PER GUEST — scales with the dinner", perGuest);
  show("SINGLE ARTIFACT — one guest gets it", single);

  console.log(
    `   ${unwatched.length} of them watch NO slot. That is an answer, not a ` +
      `gap: a rose hip off\n   the lane and a stone out of the creek have ` +
      `nothing in the package to depend\n   on, and db/044 makes supply_note ` +
      `compulsory so the data cannot confuse\n   "decided" with "not yet ` +
      `written".\n`
  );
  console.log(
    `   THE SLOT AND SUPPLIES CODES ABOVE ARE NOT CHECKED BY THIS SCRIPT. ` +
      `db/044 gives\n   bank_item_dependency real foreign keys to slot_kind ` +
      `and supplies_tag, so a bad\n   code is a failed insert naming it. A ` +
      `list of valid codes here would be the\n   hand-written copy rule 19 is ` +
      `about. A dry run has checked the SHAPE only.`
  );
  console.log(
    `\n   AND NOTHING IN THE CATALOGUE CARRIES A SUPPLIES TAG YET. ` +
      `ingredient_supplies is\n   created empty by db/044 — a migration runs ` +
      `BEFORE every seeder, so it cannot\n   tag content that does not exist ` +
      `(the same reason ingredient_requirement is\n   empty on every database ` +
      `built by the committed chain). Until a pool's own\n   seeder tags its ` +
      `rows, every dependency above resolves BROKEN, which is\n   correct and ` +
      `loud: all ${supplied.length} rows are drafts carrying a founder ` +
      `question and\n   none of them can reach a member meanwhile.`
  );
}

/**
 * WHAT THE DOCUMENT SAYS BELONGS TO TWO ROOMS — section 10, before a database
 * is involved, so that `--dry-run` answers it too.
 */
function reportShared(rows) {
  const travelling = rows.filter((row) => (row.also ?? []).length > 0);
  section('"Also at:" — ONE ROW, CLAIMED BY MORE THAN ONE ROOM');

  if (travelling.length === 0) {
    console.log(
      `   None. Every row in the document belongs to the room it sits ` +
        `under.\n   The line exists (section 10) and nothing uses it yet, ` +
        `which is a limitation\n   removed rather than data changed.`
    );
    return;
  }

  console.log(
    `   ${travelling.length} row(s). Each becomes a second NATIVE row in ` +
      `bank_item_world —\n   the only kind of row that grants eligibility. ` +
      `Affinity re-weights scoring for\n   candidates that already cleared ` +
      `the gate and confers none.\n`
  );
  for (const row of travelling) {
    console.log(
      `   ${row.slug}\n      ${row.worldSlug} + ` +
        `${row.also.map((key) => DESTINATIONS[key]).join(" + ")}` +
        `${isHeldBack({ description: row.description }) ? "   [held back — draft]" : ""}`
    );
    console.log(`      shares verbatim: "${row.name}"`);
  }
}

function reportRoutes(lines, docPath, docName) {
  let headings = new Set();
  try {
    for (const match of readFileSync(docPath, "utf8").matchAll(/^##\s+(.+?)\s*$/gm)) {
      headings.add(match[1]);
    }
  } catch {
    headings = new Set();
  }
  let room = null;
  for (const line of lines) {
    if (line.room !== room) {
      room = line.room;
      const has = headings.has(line.key);
      console.log(
        `\n${room}  ->  ${docName} "## ${line.key}"` +
          (has ? "" : `   ⚠ NO SUCH SECTION YET — the room is not in ${docName} at all`)
      );
    }
    console.log(`   · ${line.text}`);
  }
}

report();

/* ── the write ──────────────────────────────────────────────────────── */

if (dryRun) {
  console.log(`\n[seed-bank] --dry-run: no database was contacted.`);
  process.exit(0);
}

const url = process.env.DATABASE_URL;
if (!url) fail("DATABASE_URL is not set. Use --dry-run to read the report without one.");

const client = new pg.Client({
  connectionString: url,
  ssl: needsSsl(url) ? { rejectUnauthorized: false } : undefined,
  application_name: "revelle-seed-bank",
});

await client.connect();

let created = 0;
let left = 0;
let updated = 0;
let attached = 0;
let heldBack = 0;
let gesturesWritten = 0;
const stubbed = [];
/** Slugs db/057's guard refused to recreate. Reported, never silent. */
const refusedBySlug = [];

/**
 * SECTION 10 — every second claim this run touched, and what happened to it.
 *
 * Both halves are reported. A claim WRITTEN is the file widening a row's reach
 * and has to be visible, because CLAUDE.md rule 13 means the widened row is
 * live the moment it is not held back. A claim ALREADY THERE is reported too,
 * so a run that appears to do nothing says which of the two nothings it is.
 */
const shared = [];
function recordAlsoAt(row, writtenIds, alsoWorlds) {
  for (const world of alsoWorlds) {
    shared.push({
      slug: row.slug,
      name: row.name,
      home: row.worldSlug,
      also: world.slug,
      written: writtenIds.includes(world.id),
    });
  }
}

try {
  await client.query("begin");

  const worlds = new Map();
  for (const room of rooms) {
    // The stub name is the heading as db/029 writes it — "WESTHAMPTON, 1976" —
    // because that migration made "NAME, YEAR" the canonical `world.name` and a
    // stub with a shorter name would have to be corrected by hand later.
    const world = await ensureWorld(client, room.key, "seed-bank", room.heading);
    if (world.created) stubbed.push(world.slug);
    worlds.set(room.key, world);
  }

  // Every row first, the attachments after. db/031's bank_item_card_kind
  // trigger READS the row a technique_card_id points at, so a pointer written
  // in the same statement as the row it names would fail. allRows puts the
  // cards ahead of the items that ride with them for readability; the separate
  // pass below is what actually makes the order safe.
  const idBySlug = new Map();
  for (const row of allRows) {
    const world = worlds.get(row.key);
    // Section 10. Every room in an `Also at:` line is one of the eighteen the
    // document already carries, so `worlds` holds it — but ensureWorld is the
    // one path that may create a world and this file does not get a second,
    // shorter one for the case it thinks cannot happen.
    const alsoWorlds = [];
    for (const key of row.also ?? []) {
      let target = worlds.get(key);
      if (!target) {
        target = await ensureWorld(client, key, "seed-bank");
        if (target.created) stubbed.push(target.slug);
        worlds.set(key, target);
      }
      alsoWorlds.push(target);
    }
    const description = row.description.join("\n\n");

    const { rows: existing } = await client.query(
      `select id, name, description, kind::text, phase::text,
              min_lead_days, ships, weight::text, source_citation,
              supply::text as supply,
              take_home_quantity::text as take_home_quantity,
              supply_note
         from bank_item where slug = $1`,
      [row.slug]
    );

    if (existing.length === 0) {
      const held = isHeldBack(row);
      const { rows: inserted } = await client.query(
        // THE PLACEHOLDERS RUN $1..$11 WITH NO GAP, and that is a fix rather
        // than a tidy-up. This statement and the update below both skipped $7
        // and then ran off the end at $11 — the shape left behind when db/033
        // dropped `venue` from the column list and nobody renumbered what came
        // after it. Postgres would have refused the bind ("11 parameters
        // required, 10 supplied") on the first row of the first run, and this
        // seeder was not in preDeployCommand until 2026-08-23, so nothing ever
        // executed it. CLAUDE.md rule 12's failure and this one are the same
        // failure twice: a seeder that never runs is never wrong.
        //
        // `world_id` LEFT THIS LIST IN db/043 and the destination is written
        // one statement later, into bank_item_world. See section 8.
        //
        // `supply`, `take_home_quantity` and `supply_note` join the list at
        // $11..$13 — db/044, section 9. Appended rather than inserted into the
        // middle for the reason the paragraph above records: this statement has
        // already been broken once by a column leaving the list and nothing
        // after it being renumbered.
        `insert into bank_item
           (slug, kind, name, description, phase,
            min_lead_days, ships, weight, status, source_citation,
            supply, take_home_quantity, supply_note)
         values ($1, $2::bank_kind, $3, $4, $5::day_phase,
                 $6, $7, $8, $9::product_status, $10,
                 $11::bank_supply, $12::take_home_quantity, $13)
         returning id`,
        [
          row.slug,
          row.kind,
          row.name,
          description,
          row.phase,
          row.minLeadDays,
          row.ships,
          row.weight,
          // The whole of section 1, in one expression: the pool stocks itself,
          // except where the row itself carries the founder's question.
          held ? HELD : LIVE,
          row.citation,
          row.supply,
          row.takeHomeQuantity,
          row.supplyNote,
        ]
      );
      // ── AN INSERT THAT WROTE NOTHING IS A REFUSAL, NOT A CRASH ──────
      //
      // db/057's `refuse_recreated` is a BEFORE INSERT trigger that RETURNS
      // NULL for a slug in `refused_row`, which skips the row without failing
      // the statement — deliberately, so a run writing fifty items where one
      // is refused writes the other forty-nine.
      //
      // But a skipped insert returns ZERO ROWS, and this line read
      // `inserted[0].id` as if one always came back. On the first deploy after
      // db/059 restored 191 refusals, that was:
      //
      //     [seed-bank] FAILED: Cannot read properties of undefined (reading 'id')
      //
      // CI CANNOT SEE THIS, and the reason is rule 33 exactly: the scratch
      // database has an empty refused_row, so the trigger never fires there,
      // and the guard and the seeder had never met. The one machine where they
      // do meet is production.
      //
      // So: no row means she refused this slug and the guard did its job.
      // Counted and reported, never silent — a seeder that skips work without
      // saying so is the shape rule 12's corollary warns about.
      if (inserted.length === 0) {
        refusedBySlug.push(row.slug);
        continue;
      }

      idBySlug.set(row.slug, inserted[0].id);
      recordAlsoAt(
        row,
        await claimDestination(
          client,
          inserted[0].id,
          world.id,
          alsoWorlds.map((w) => w.id)
        ),
        alsoWorlds
      );
      await claimDependencies(client, inserted[0].id, row.dependencies);
      created += 1;
      if (held) {
        heldBack += 1;
      } else {
        // In the same transaction as the row, so a bank item cannot go out
        // with nothing in the ledger saying it did.
        await recordAutoPublish(client, {
          table: "bank_item",
          id: inserted[0].id,
          name: row.name,
          seeder: "seed-bank",
          run: RUN,
          source: SOURCE_NAME,
        });
      }
    } else {
      idBySlug.set(row.slug, existing[0].id);
      // Also on the row that already exists, and `on conflict do nothing`
      // inside: this heals a row whose claim was deleted and changes nothing
      // on the ordinary re-run. It is NOT part of `differs` — a destination a
      // curator moved at the desk is hers, exactly as the gesture and the
      // technique-card attachment are, and --overwrite governs her WORDS.
      recordAlsoAt(
        row,
        await claimDestination(
          client,
          existing[0].id,
          world.id,
          alsoWorlds.map((w) => w.id)
        ),
        alsoWorlds
      );
      // Same treatment as the destination and for the same reason: additive,
      // `on conflict do nothing`, outside `differs`. A dependency a curator
      // added at the desk is hers, and --overwrite governs the file's WORDS.
      await claimDependencies(client, existing[0].id, row.dependencies);
      const differs =
        existing[0].name !== row.name ||
        existing[0].description !== description ||
        existing[0].kind !== row.kind ||
        existing[0].phase !== row.phase ||
        (existing[0].min_lead_days ?? null) !== row.minLeadDays ||
        existing[0].ships !== row.ships ||
        Number(existing[0].weight) !== row.weight ||
        existing[0].source_citation !== row.citation ||
        // db/044. These three ARE the file's words about where an object comes
        // from — the clause said "THE EVENING SUPPLIES IT" or it did not — so
        // they belong on this side of the line with `ships`, not with the
        // destination claim.
        existing[0].supply !== row.supply ||
        (existing[0].take_home_quantity ?? null) !== row.takeHomeQuantity ||
        existing[0].supply_note !== row.supplyNote;

      if (differs && !overwrite) {
        left += 1;
        console.log(
          `[seed-bank] differs  ${row.slug} — left as the desk has it. ` +
            `Re-run with --overwrite to let the file win.`
        );
      } else if (differs) {
        await client.query(
          // $1..$9 with no gap — the same renumbering as the insert above, and
          // the same reason. Before it, `min_lead_days` was being handed the
          // value of `ships`, `ships` the weight and `weight` the citation, and
          // `source_citation = $10` did not exist at all.
          //
          // `status` is still absent from this list and that is not an
          // oversight: no seeder writes a status on a row that already exists.
          // --overwrite lets the file beat a curator's WORDS; whether a row is
          // offered is settled once, on the way in, and after that it belongs
          // to the desk.
          `update bank_item set name = $2, description = $3, kind = $4::bank_kind,
                  phase = $5::day_phase,
                  min_lead_days = $6, ships = $7, weight = $8,
                  source_citation = $9,
                  supply = $10::bank_supply,
                  take_home_quantity = $11::take_home_quantity,
                  supply_note = $12
             where id = $1`,
          [
            existing[0].id,
            row.name,
            description,
            row.kind,
            row.phase,
            row.minLeadDays,
            row.ships,
            row.weight,
            row.citation,
            row.supply,
            row.takeHomeQuantity,
            row.supplyNote,
          ]
        );
        updated += 1;
        console.log(`[seed-bank] updated  ${row.slug} — from the file`);
      }
    }
  }

  // The attachments, once every row exists. Never overwritten: a curator may
  // have pointed an act at a different card at the desk.
  for (const item of items) {
    if (item.cardSlugs.length === 0) continue;
    const { rowCount } = await client.query(
      `update bank_item set technique_card_id = $2
         where id = $1 and technique_card_id is null`,
      [idBySlug.get(item.slug), idBySlug.get(item.cardSlugs[0])]
    );
    attached += rowCount;
  }

  // The gestures. Written only where the column is still null — a gesture is
  // the room's invariant and the desk outranks the file for it as for
  // everything else.
  for (const gesture of gestures) {
    const world = worlds.get(gesture.key);
    const { rowCount } = await client.query(
      `update world
          set gesture = coalesce(gesture, $2),
              gesture_note = coalesce(nullif(gesture_note, ''), $3)
        where id = $1
          and (gesture is null or gesture_note is null or gesture_note = '')`,
      [world.id, gesture.gesture, `${gesture.note} [${gesture.citation}]`]
    );
    gesturesWritten += rowCount;
  }

  await client.query("commit");
} catch (err) {
  await client.query("rollback");
  console.error(`\n[seed-bank] FAILED: ${err.message}`);
  process.exitCode = 1;
} finally {
  await client.end();
}

console.log(
  `\n[seed-bank] ${created} row(s) created, ${updated} updated, ${left} left ` +
    `as the desk has them; ${attached} technique card(s) attached; ` +
    `${gesturesWritten} gesture(s) written.`
);

if (refusedBySlug.length > 0) {
  // Loud on purpose. db/057's guard skipping a row is the system working, but
  // a seeder that quietly writes less than the document describes is rule 12's
  // corollary — "the catalogue is just smaller than the repo says" — and the
  // whole reason that rule exists.
  console.log(
    `\n[seed-bank] ${refusedBySlug.length} row(s) NOT recreated because she ` +
      `refused them (db/057's refused_row):\n  ` +
      refusedBySlug.join("\n  ") +
      `\nDelete the row from refused_row to un-refuse one; it returns as an ` +
      `ordinary draft on the next deploy.`
  );
}

if (stubbed.length > 0) {
  console.log(
    `\nThese destinations had no world row and now have a DRAFT STUB:\n  ` +
      stubbed.join("\n  ") +
      `\nA draft destination is never chosen for a customer. Author the look ` +
      `and the voice in src/lib/destinations.ts and run ` +
      `npm run seed:destinations, which completes a stub in place.`
  );
}

if (shared.length > 0) {
  const written = shared.filter((claim) => claim.written);
  console.log(
    `\n${"─".repeat(72)}\n"Also at:" — ${shared.length} SECOND CLAIM(S), ` +
      `${written.length} written this run\n${"─".repeat(72)}\n` +
      `Each is a second NATIVE row in bank_item_world, which is the only kind ` +
      `of row\nthat makes an item eligible somewhere: affinity re-weights ` +
      `scoring for candidates\nthat already cleared the gate and confers no ` +
      `eligibility at all.\n`
  );
  for (const claim of shared) {
    console.log(
      `   ${claim.written ? "written " : "already "} ${claim.slug} — ` +
        `${claim.home} + ${claim.also}`
    );
  }
  console.log(
    `\n   ONE ROW, CLAIMED TWICE: the name and the description travel ` +
      `verbatim. If the\n   words name their own room, the item cannot ` +
      `travel and wants two rows instead.\n` +
      `\n   AND A KNOWN HAZARD, until somebody fixes the screen: the bank ` +
      `item form\n   (src/app/desk/(signed-in)/bank/actions.ts) has ONE ` +
      `destination select and its save\n   deletes every other native row, ` +
      `so saving any edit to one of the rows above at\n   the desk destroys ` +
      `its second claim. Booked in docs/needs-a-human.md.`
  );
}

console.log(
  `\n${created - heldBack} of the ${created} row(s) created went LIVE, and ` +
    `${heldBack} stayed in draft because\nthe row itself carries a ` +
    `${FOUNDER_PENDING} question. The pool stocks itself (db/036);\n` +
    `/desk/stocked is where that gets vetoed, and it sends one row or the ` +
    `whole run back.\nThe held rows are at /desk/publish, which is where a ` +
    `question that has been answered\ngets said yes to.`
);
