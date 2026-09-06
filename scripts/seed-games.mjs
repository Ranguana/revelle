#!/usr/bin/env node
/**
 * Put the authored games into the database.
 *
 *   npm run seed:games
 *
 * ─────────────────────────────────────────────────────────────────────
 * WHY THIS IS A SCRIPT AND NOT A MIGRATION
 *
 * db/010 adds the SHAPE of a game. A game is CONTENT, and content in a
 * migration is content that can only be corrected by another migration — the
 * same argument scripts/seed-destinations.mjs makes and db/009 makes again
 * about its slot plans. The canonical text lives in src/lib/games.ts, where a
 * change to a rule is a diff a human can read; this moves it into the tables
 * the app and the curator's tool read from.
 *
 * ─────────────────────────────────────────────────────────────────────
 * WHAT IT WILL AND WILL NOT DO
 *
 *   · A game that does not exist is created LIVE, unless its own text carries
 *     a founder-pending question — see THE HOLD-BACK below. The pool stocks
 *     itself (db/038, CLAUDE.md rule 13) and the desk VETOES at /desk/stocked
 *     rather than consents.
 *
 *     ── SUPERSEDED, AND KEPT WHOLE PER RULE 14 ──────────────────────
 *
 *     This bullet used to read "A game that does not exist is created as a
 *     DRAFT. Deciding that something is active is a curator's decision, not a
 *     script's", under the heading THIS SEEDER DID NOT CHANGE WHEN THE OTHERS
 *     DID, AND THAT IS A DECISION. The argument was:
 *
 *       db/036 and rule 13 made pool content stock itself, and every other
 *       pool seeder now creates live rows: dishes, drinks, menus, bank items.
 *       Rule 13 names the classes it moved — "dishes, drinks, bank items,
 *       menus, products and tracklists" — and the `game` TABLE is not among
 *       them. What the rule's bank list calls "games" is `bank_kind = 'game'`,
 *       a line in the atmosphere bank, not one of these: a `game` row carries
 *       rules, bounds, runbook steps, contingencies and a host role, and it is
 *       the only pool row a member is walked through live by somebody reading
 *       it aloud. So it stays behind the old gate until the founder classifies
 *       it, and the restraint is the point rather than caution. The rule
 *       db/036 replaced was RIGHT ABOUT WHAT IT PROTECTED and wrong about its
 *       SCOPE — it was written for destinations and applied to everything.
 *       Reading the new rule wider than it was written would be the identical
 *       mistake with the sign flipped. A game is either a pool class or it is
 *       not, and that sentence belongs in rule 13 and a migration, not in an
 *       inference made here.
 *
 *     THE INSTINCT TO STOP AND ASK WAS RIGHT AND THE OUTCOME IS REVERSED. The
 *     founder answered the question rather than the reasoning, and what beat
 *     it is a fact the argument above did not have — THE TWO-TABLE WRINKLE,
 *     written down here because a future reader will otherwise re-derive it:
 *
 *       `bank_kind = 'game'` and the `game` table are the same product
 *       category in two tables. The bank rows are the PHYSICAL GOODS — the
 *       tombola kit, the dice cups, the printed card decks — and seed-bank has
 *       been stocking them live since db/036. The `game` table is the PLAYABLE
 *       CONTENT for the same games. Holding one and not the other put one
 *       category under two publication regimes, and the shape of that bug is
 *       specific: A MEMBER COULD RECEIVE THE SHIPPED KIT FOR A GAME WHOSE
 *       RULES CONTENT SAT IN DRAFT. Nothing in either table would have said
 *       so.
 *
 *     Rule 13 now carries the test that decides the next content type without
 *     another stop-and-ask: POOL means selection CHOOSES AMONG rows, GOVERNED
 *     means a row DEFINES WHAT A MEMBER CAN BE PROMISED. A game row is SHELF,
 *     not WORLD — assembly selects among games, a room filters which are
 *     eligible, a dealbreaker never touches one, and no voice depends on one.
 *     The old bullet's true observation — that a game is walked through live
 *     by somebody reading it aloud — is a fact about how a game is USED at a
 *     party, not about whether the house may offer it, and those are different
 *     questions.
 *
 *   · THE HOLD-BACK IS THE ROW'S OWN TEXT, exactly as the bank's is. A game
 *     whose authored prose contains the founder-pending marker is created as a
 *     DRAFT and gets no ledger entry, because nothing was offered. There is no
 *     list of held slugs here or anywhere: a list is a thing that falls out of
 *     date, and text cannot. db/038 makes the same test in SQL over the same
 *     columns.
 *
 *     THIS BULLET USED TO END "NO GAME CARRIES THE MARKER TODAY — the
 *     mechanism is in place before it is needed, which is the only order in
 *     which it can be trusted." That was true and is now false, and it is
 *     corrected rather than deleted per CLAUDE.md rule 14 because the claim it
 *     made about ORDER was the right one and is now demonstrated: the
 *     mechanism was built with nothing to hold, and the first row that needed
 *     it did not have to invent it under pressure. ONE GAME CARRIES THE MARKER
 *     — nantucket-what-the-weather-will-do, whose own text asks whether the
 *     bank document's `KILLED: the weather-forecast act.` reaches the game or
 *     only the host act. The reasoning is in the row, which is the only place
 *     a hold-back is ever allowed to live.
 *
 *   · A NATIVE SCOPE THAT CANNOT RESOLVE ALSO HOLDS THE GAME. This is new and
 *     it is CLAUDE.md rule 16 rather than a nicety. A `native` world claim is
 *     a WHITELIST (rule 23): a game carrying one is eligible ONLY under the
 *     destinations it names. So a native scope silently skipped because that
 *     destination has no `world` row does not fail safe — IT INVERTS. The row
 *     lands with no world claim at all, which means eligible EVERYWHERE, and a
 *     game written in one room's voice is offered in eighteen with nothing
 *     anywhere saying so. The bullet below about skipping missing worlds is
 *     still correct for `forbidden` and for `affinity`, both of which mean
 *     nothing when the world is absent; it was never correct for `native` and
 *     `native` did not exist on any game when it was written.
 *
 *     It bites today rather than hypothetically: five authored rooms —
 *     amalfi-1953, aspen-1994, palm-springs-1965, oaxaca-1954,
 *     st-moritz-1984 — are not keyed into DESTINATIONS, so seed:destinations
 *     does not create them, and seed:bank (which creates their draft stubs)
 *     runs AFTER this seeder in preDeployCommand. Seven of the twenty room
 *     games are therefore held on a fresh build. They are drafts on purpose
 *     and they are at /desk/publish.
 *   · A game that already exists is LEFT ALONE — name, rules, bounds and all.
 *     A curator's edit in the tool outranks the module, and silently
 *     overwriting her work is the failure this house cares about most. What
 *     differs is REPORTED.
 *   · Facet tags, occasion claims, slot claims, supplies, requirements,
 *     printed matter, RUNBOOK STEPS, CONTINGENCIES, dependencies and
 *     destination scoping are added where absent and never changed where
 *     present. `on conflict do nothing` everywhere, deliberately.
 *   · Runbook steps are written AFTER supplies and printed matter, in that
 *     order, because a step points at both and db/025 refuses a pointer to
 *     something the game does not have yet.
 *   · A facet code that is not in the vocabulary is a HARD FAILURE, not a
 *     skipped row. A game tagged with a term that does not exist is a game
 *     that quietly matches nobody, which is worse than a crash.
 *   · Destination scoping is applied only for worlds that exist. A missing
 *     world is reported and skipped — run npm run seed:destinations first if
 *     the scoping matters to you. FOR A `native` CLAIM THE SKIP IS NOT
 *     ENOUGH, and the bullet above says why.
 *
 * Re-running with nothing changed does nothing at all. The whole run is one
 * transaction: a failure halfway leaves no half-seeded game.
 *
 * Same connection rules as scripts/migrate.mjs. Needs DATABASE_URL.
 *
 * IT IS IN THE DEPLOY CHAIN. This line used to end "and is deliberately not
 * wired into a deploy: putting a game in the catalogue is a decision", which
 * stopped being true when `npm run seed:games` was added to render.yaml's
 * preDeployCommand — and CLAUDE.md rule 12 is about exactly the damage a
 * seeder's own claim about the chain can do when it is wrong. It runs on every
 * deploy and the games it creates are LIVE, which is the first bullet above.
 * That second half also used to read "are drafts", and it is corrected rather
 * than deleted for the same reason as everything else in this header.
*
 * ── ONE ASYMMETRY, STATED SO IT IS NOT A SURPRISE ────────────────────
 *
 * `--overwrite` lets the file beat the curator's WORDS when explicitly asked.
 * seed:menus, seed:drinks and seed:dishes have it; seed:games and
 * seed:destinations do not.
 *
 * BUT THE FLAG HAS NOTHING TO DO WITH STATUS, WHICH IS THE PART THAT MATTERS.
 * No seeder in this repo writes `status` on a row that already exists — not
 * one, checked across all five. `--overwrite` rewrites name, contents, season,
 * notes; a status is written once, on the way in, and never again.
 *
 * The next two sentences used to read: "`--activate` only touches rows the
 * seeder itself just created. So PUBLISHING IS ONE-WAY FOR EVERY POOL, and the
 * only way back is a person withdrawing a row by hand at the desk." They are
 * kept because CLAUDE.md rule 14 keeps a reversed argument, and they are now
 * false in both halves for every pool INCLUDING this one: `--activate` is gone
 * from seed:menus, seed:drinks and seed:dishes and is REFUSED BY NAME here,
 * and /desk/stocked sends a run of auto-published rows back to draft in one
 * gesture. This paragraph carried a third sentence for one round — "For GAMES
 * both halves still hold, because this seeder still creates drafts" — which
 * db/038 made false.
 *
 * An earlier version of this note said the asymmetry was about reversibility
 * and named the wrong scripts. It was wrong twice, and it is corrected here
 * rather than deleted because the distinction it missed — words are revertible,
 * offered-ness is not — is the one worth knowing.

 */
import pg from "pg";

import { ALL_GAMES } from "../src/lib/games.ts";

import {
  HELD,
  LIVE,
  carriesFounderQuestion,
  recordAutoPublish,
  refuseActivateFlag,
  stockingRun,
} from "./catalogue-vocabulary.mjs";

refuseActivateFlag("seed-games");

/** One id for this run, so /desk/stocked can group what it put out. */
const RUN = stockingRun();

/**
 * THE AUTHORED PROSE OF A GAME, as the columns that hold it.
 *
 * The hold-back reads every free-text column the seeder writes from the module
 * — anywhere an author could plausibly put a question — and NOT the game's
 * children. A runbook step, a contingency answer and a supply note are all
 * prose too, but a step is not the game: holding a whole game back because one
 * of its fourteen steps carries a question would be a different rule, and it
 * is not this one.
 *
 * `name` and `slug` are excluded because they are identifiers, and
 * `external_name` / `external_url` because they are somebody else's product.
 *
 * DB/038 MAKES THE SAME TEST OVER THE SAME COLUMNS and says so in its own
 * prose. If a column joins or leaves this list, that migration's successor has
 * to move with it, or a game the migration would hold is one the seeder
 * offers.
 */
const PROSE = [
  ["description", (g) => g.description],
  ["how_it_works", (g) => g.howItWorks],
  ["materials", (g) => g.materials],
  ["scoring", (g) => g.scoring],
  ["caveat", (g) => g.caveat],
  ["source_note", (g) => g.sourceNote],
  ["notes", (g) => g.notes],
  ["host_note", (g) => g.runbook.hostNote],
];

/**
 * Does this game carry a question with the founder's name on it?
 *
 * The same shape as scripts/seed-bank.mjs's `isHeldBack`, over this pool's own
 * prose.
 *
 * THIS COMMENT USED TO SAY "No game in src/lib/games.ts carries the marker
 * today; the mechanism exists before the first row that needs it, because a
 * hold-back written on the day it is first needed is a hold-back written under
 * pressure." Kept per CLAUDE.md rule 14, because the argument was right and
 * has now been paid off: one game carries it —
 * nantucket-what-the-weather-will-do, asking whether the bank document's kill
 * of the weather-forecast act reaches the game or only the host act — and
 * nothing had to be invented to hold it.
 */
function isHeldBack(game) {
  return carriesFounderQuestion(PROSE.map(([, read]) => read(game)));
}

/**
 * THE OTHER REASON A GAME IS HELD, AND IT IS NOT ABOUT TEXT.
 *
 * A `native` world claim is a WHITELIST (CLAUDE.md rule 23): the game is
 * eligible only under the destinations it names. If that destination has no
 * `world` row, writing nothing does not fail safe — the row lands carrying NO
 * claim, and no claim means eligible everywhere. A game written in one room's
 * voice would be offered in all eighteen, silently.
 *
 * So the game is created as a DRAFT instead, and this is rule 16's second
 * option of three: honour it, refuse it, or drop it visibly. Honouring it is
 * impossible — there is no world to point at. Refusing it would fail the
 * deploy on every fresh build, because five authored rooms have no world row
 * when this seeder runs. Dropping it visibly is what is left, and a draft is
 * how this system says a row is not offered.
 *
 * `worldId` is the map of every world slug this run could resolve.
 */
function unresolvableNatives(game, worldId) {
  return game.worlds
    .filter((scope) => scope.native === true && !worldId.has(scope.world))
    .map((scope) => scope.world);
}

/** Kept in sync with the same function in scripts/migrate.mjs and src/lib/db.ts. */
function needsSsl(url) {
  if (/sslmode=disable/.test(url)) return false;
  return !/@(localhost|127\.0\.0\.1|\[::1\])/.test(url);
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("[seed-games] DATABASE_URL is not set.");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: url,
  ssl: needsSsl(url) ? { rejectUnauthorized: false } : undefined,
  application_name: "revelle-seed-games",
});

const log = (...parts) => console.log("[seed-games]", ...parts);

await client.connect();

try {
  await client.query("begin");

  // ── the vocabulary, resolved once ──────────────────────────────────
  //
  // Every facet a game claims, looked up as one set before anything is
  // written. A typo in src/lib/games.ts must be an error here and not a row
  // nobody ever matches — the exact failure db/002's foreign keys exist to
  // make impossible, brought forward to the seed so the message names the file.
  const wanted = new Map();
  for (const game of ALL_GAMES) {
    for (const tag of game.facets) {
      wanted.set(`${tag.dimension}:${tag.code}`, tag);
    }
  }

  const { rows: facetRows } = await client.query(
    `select f.id, f.dimension_code, f.code::text as code, f.status
       from facet f
      where (f.dimension_code || ':' || f.code::text) = any($1::text[])`,
    [[...wanted.keys()]]
  );

  const facetId = new Map(
    facetRows.map((r) => [`${r.dimension_code}:${r.code}`, r.id])
  );

  const missing = [...wanted.keys()].filter((k) => !facetId.has(k));
  if (missing.length > 0) {
    throw new Error(
      `src/lib/games.ts tags games with facets that are not in the ` +
        `vocabulary: ${missing.join(", ")}. Either the migrations are behind, ` +
        `or the vocabulary genuinely cannot say this yet — in which case ` +
        `propose the addition rather than inventing a private term.`
    );
  }

  const deprecated = facetRows.filter((r) => r.status === "deprecated");
  for (const row of deprecated) {
    log(
      `warn     ${row.dimension_code}:${row.code} is deprecated — the tag will ` +
        `still resolve, but it should be replaced`
    );
  }

  // ── the destinations, resolved once, BEFORE any game is written ────
  //
  // Moved ahead of the insert loop because the answer changes what STATUS a
  // game is created with — see `unresolvableNatives`. Resolving it inside the
  // scoping pass, where it used to live, is too late: the row is already live
  // by then and a native claim that never landed cannot be taken back by a
  // seeder that does not rewrite status.
  //
  // One query rather than one per scope, and CLAUDE.md rule 24's procedure
  // applies to it: the counts are reported below rather than assumed.
  const wantedWorlds = [
    ...new Set(ALL_GAMES.flatMap((g) => g.worlds.map((w) => w.world))),
  ];
  const { rows: worldRows } = await client.query(
    `select id, slug::text as slug from world where slug = any($1::text[])`,
    [wantedWorlds]
  );
  const worldId = new Map(worldRows.map((r) => [r.slug, r.id]));
  const missingWorlds = wantedWorlds.filter((slug) => !worldId.has(slug));
  log(
    `worlds   ${worldId.size} of ${wantedWorlds.length} destinations named by a ` +
      `game exist here` +
      (missingWorlds.length > 0 ? `; missing: ${missingWorlds.join(", ")}` : "")
  );

  // ── the games ──────────────────────────────────────────────────────

  const idBySlug = new Map();
  let created = 0;
  let heldBack = 0;
  let heldForWorld = 0;

  for (const game of ALL_GAMES) {
    const { rows: existing } = await client.query(
      `select id from game where slug = $1`,
      [game.slug]
    );

    let gameId;
    if (existing.length === 0) {
      const orphanNatives = unresolvableNatives(game, worldId);
      const held = isHeldBack(game) || orphanNatives.length > 0;
      const { rows } = await client.query(
        // THE PLACEHOLDERS RUN $1..$22 WITH NO GAP. `status` was the literal
        // 'draft' until db/038 and is now bound like everything else, and
        // `phase` was added by db/068 — both are the moment a column list gets
        // renumbered wrongly, see the note in scripts/seed-bank.mjs's insert,
        // where exactly that left $7 skipped and the statement running off the
        // end. src/lib/seed-binds.test.ts now checks this statement and every
        // other one in the tree.
        //
        // `phase` COALESCES TO 'all' RATHER THAN BINDING NULL: db/068 makes the
        // column not-null with that default, and `all` means NO OPINION, which
        // is what a game that does not state an hour means. Binding null would
        // fail the insert; binding 'all' says the true thing.
        `insert into game (
           slug, name, description, how_it_works, materials,
           shape, sourcing, phase,
           duration_minutes, duration_max_minutes,
           min_guests, max_guests,
           scoring, currency_label,
           external_name, external_url, caveat,
           source_note, notes, host_role, host_note, status)
         values ($1,$2,$3,$4,$5,$6::game_shape,$7::game_sourcing,$8::day_phase,
                 $9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,
                 $20::host_role,$21,$22::product_status)
         returning id`,
        [
          game.slug,
          game.name,
          game.description,
          game.howItWorks,
          game.materials ?? null,
          game.shape,
          game.sourcing,
          game.phase ?? "all",
          game.durationMinutes ?? null,
          game.durationMaxMinutes ?? null,
          game.minGuests ?? null,
          game.maxGuests ?? null,
          game.scoring ?? null,
          game.currencyLabel ?? null,
          game.externalName ?? null,
          game.externalUrl ?? null,
          game.caveat ?? null,
          game.sourceNote ?? null,
          game.notes ?? null,
          game.runbook.hostRole,
          game.runbook.hostNote ?? null,
          // The whole of the first bullet in one expression: the pool stocks
          // itself, except where the row itself carries the founder's question
          // or its native scope has nowhere to land.
          held ? HELD : LIVE,
        ]
      );
      gameId = rows[0].id;
      created += 1;
      if (held) {
        heldBack += 1;
        // Two different reasons, said differently, because they are answered
        // by two different people: a question is answered by the founder, and
        // a missing destination is answered by seeding it.
        if (orphanNatives.length > 0) {
          heldForWorld += 1;
          log(
            `held     ${game.slug} (draft, ${game.shape}, ${game.sourcing}) — ` +
              `native to ${orphanNatives.join(", ")}, which ${
                orphanNatives.length === 1 ? "does" : "do"
              } not exist here. A native claim is a whitelist; skipping it ` +
              `would offer this game in every room instead of one`
          );
        } else {
          log(
            `held     ${game.slug} (draft, ${game.shape}, ${game.sourcing}) — ` +
              `its own text carries a founder-pending question`
          );
        }
      } else {
        // In the same transaction as the row, so a game cannot go out with
        // nothing in the ledger saying it did.
        await recordAutoPublish(client, {
          table: "game",
          id: gameId,
          name: game.name,
          seeder: "seed-games",
          run: RUN,
          source: "src/lib/games.ts",
        });
        log(`created  ${game.slug} (live, ${game.shape}, ${game.sourcing})`);
      }
    } else {
      gameId = existing[0].id;
      log(`exists   ${game.slug} — left as it is`);
    }
    idBySlug.set(game.slug, gameId);

    // ── facets ──────────────────────────────────────────────────────
    const codes = game.facets.map((t) => `${t.dimension}:${t.code}`);
    const { rows: tagged } = await client.query(
      `insert into game_facet (game_id, facet_id, weight, provenance, note)
       select $1, t.facet_id, t.weight, 'curator', t.note
         from unnest($2::uuid[], $3::numeric[], $4::text[])
              as t(facet_id, weight, note)
       on conflict (game_id, facet_id) do nothing
       returning facet_id`,
      [
        gameId,
        codes.map((k) => facetId.get(k)),
        game.facets.map((t) => t.weight),
        game.facets.map((t) => t.note ?? "From src/lib/games.ts."),
      ]
    );
    log(
      `facets   ${game.slug} ${tagged.length} tagged, ` +
        `${game.facets.length - tagged.length} already there`
    );

    // ── occasion and slot eligibility ───────────────────────────────
    if (game.occasions.length > 0) {
      await client.query(
        `insert into game_occasion (game_id, occasion, fit, note)
         select $1, t.occasion::occasion_type, t.fit::occasion_fit, t.note
           from unnest($2::text[], $3::text[], $4::text[])
                as t(occasion, fit, note)
         on conflict (game_id, occasion) do nothing`,
        [
          gameId,
          game.occasions.map((o) => o.occasion),
          game.occasions.map((o) => o.fit),
          game.occasions.map((o) => o.note ?? null),
        ]
      );
    }

    if (game.slots.length > 0) {
      await client.query(
        `insert into game_slot (game_id, slot_code, fit, note)
         select $1, t.slot_code, t.fit::occasion_fit, t.note
           from unnest($2::text[], $3::text[], $4::text[])
                as t(slot_code, fit, note)
         on conflict (game_id, slot_code) do nothing`,
        [
          gameId,
          game.slots.map((s) => s.slotCode),
          game.slots.map((s) => s.fit),
          game.slots.map((s) => s.note ?? null),
        ]
      );
    }

    // ── supplies ────────────────────────────────────────────────────
    if (game.supplies.length > 0) {
      await client.query(
        `insert into game_supply
           (game_id, item, detail, source, per_guest, quantity,
            lead_time_days, position, note)
         select $1, t.item, t.detail, t.source::supply_source, t.per_guest,
                t.quantity, t.lead_time_days, t.position, t.note
           from unnest($2::text[], $3::text[], $4::text[], $5::boolean[],
                       $6::integer[], $7::integer[], $8::integer[], $9::text[])
                as t(item, detail, source, per_guest, quantity,
                     lead_time_days, position, note)
         on conflict (game_id, item) do nothing`,
        [
          gameId,
          game.supplies.map((s) => s.item),
          game.supplies.map((s) => s.detail ?? ""),
          game.supplies.map((s) => s.source),
          game.supplies.map((s) => s.perGuest === true),
          game.supplies.map((s) => s.quantity ?? null),
          game.supplies.map((s) => s.leadTimeDays ?? 0),
          game.supplies.map((_, i) => (i + 1) * 10),
          game.supplies.map((s) => s.note ?? null),
        ]
      );
    }

    // ── requirements ────────────────────────────────────────────────
    if (game.requirements.length > 0) {
      const kinds = game.requirements.map((r) => r.requirement);
      const { rows: known } = await client.query(
        `select code from game_requirement_kind where code = any($1::text[])`,
        [kinds]
      );
      if (known.length !== new Set(kinds).size) {
        const found = new Set(known.map((r) => r.code));
        throw new Error(
          `${game.slug} names requirements that db/010 does not define: ` +
            `${kinds.filter((k) => !found.has(k)).join(", ")}.`
        );
      }

      await client.query(
        `insert into game_requirement (game_id, requirement, note)
         select $1, t.requirement, t.note
           from unnest($2::text[], $3::text[]) as t(requirement, note)
         on conflict (game_id, requirement) do nothing`,
        [gameId, kinds, game.requirements.map((r) => r.note ?? null)]
      );
    }

    // ── printed matter ──────────────────────────────────────────────
    //
    // The database refuses these outright for a recommended game, so nothing
    // here needs to remember the rule. Imposter carries an empty list and
    // would be rejected if it did not.
    if (game.printedMatter.length > 0) {
      await client.query(
        `insert into game_printed_matter
           (game_id, piece, label, description, voice_piece, per_guest,
            quantity, position, note)
         select $1, t.piece, t.label, t.description, t.voice_piece,
                t.per_guest, t.quantity, t.position, t.note
           from unnest($2::text[], $3::text[], $4::text[], $5::text[],
                       $6::boolean[], $7::integer[], $8::integer[], $9::text[])
                as t(piece, label, description, voice_piece, per_guest,
                     quantity, position, note)
         on conflict (game_id, piece) do nothing`,
        [
          gameId,
          game.printedMatter.map((p) => p.piece),
          game.printedMatter.map((p) => p.label),
          game.printedMatter.map((p) => p.description ?? ""),
          game.printedMatter.map((p) => p.voicePiece ?? null),
          game.printedMatter.map((p) => p.perGuest === true),
          game.printedMatter.map((p) => p.quantity ?? null),
          game.printedMatter.map((_, i) => (i + 1) * 10),
          game.printedMatter.map((p) => p.note ?? null),
        ]
      );
    }

    // ── the runbook ─────────────────────────────────────────────────
    //
    // LAST, because a step points at a game_supply row and a
    // game_printed_matter row, and db/025 refuses a pointer to something the
    // game does not have. Both were written a few lines above.
    //
    // `position` is the array index in src/lib/games.ts and not the phase's
    // rank: the order is the curator's, for the reason argued in db/025 and
    // tested in src/lib/games.test.ts.
    if (game.runbook.steps.length > 0) {
      const { rows: written } = await client.query(
        `insert into game_runbook_step
           (game_id, step, phase, position, instruction, detail, say,
            minutes, supply_item, printed_piece, note)
         select $1, t.step, t.phase, t.position, t.instruction, t.detail,
                t.say, t.minutes, t.supply_item, t.printed_piece, t.note
           from unnest($2::text[], $3::text[], $4::integer[], $5::text[],
                       $6::text[], $7::text[], $8::integer[], $9::text[],
                       $10::text[], $11::text[])
                as t(step, phase, position, instruction, detail, say,
                     minutes, supply_item, printed_piece, note)
         on conflict (game_id, step) do nothing
         returning step`,
        [
          gameId,
          game.runbook.steps.map((s) => s.step),
          game.runbook.steps.map((s) => s.phase),
          game.runbook.steps.map((_, i) => (i + 1) * 10),
          game.runbook.steps.map((s) => s.instruction),
          game.runbook.steps.map((s) => s.detail ?? ""),
          game.runbook.steps.map((s) => s.say ?? ""),
          game.runbook.steps.map((s) => s.minutes ?? null),
          game.runbook.steps.map((s) => s.supplyItem ?? null),
          game.runbook.steps.map((s) => s.printedPiece ?? null),
          game.runbook.steps.map((s) => s.note ?? null),
        ]
      );
      log(
        `runbook  ${game.slug} ${written.length} steps written, ` +
          `${game.runbook.steps.length - written.length} already there`
      );
    }

    if (game.runbook.contingencies.length > 0) {
      const kinds = game.runbook.contingencies.map((c) => c.trouble);
      const { rows: known } = await client.query(
        `select code from runbook_trouble_kind where code = any($1::text[])`,
        [kinds]
      );
      if (known.length !== new Set(kinds).size) {
        const found = new Set(known.map((r) => r.code));
        throw new Error(
          `${game.slug} answers troubles db/025 does not define: ` +
            `${kinds.filter((k) => !found.has(k)).join(", ")}.`
        );
      }

      await client.query(
        `insert into game_contingency (game_id, trouble, answer, position)
         select $1, t.trouble, t.answer, t.position
           from unnest($2::text[], $3::text[], $4::integer[])
                as t(trouble, answer, position)
         on conflict (game_id, trouble) do nothing`,
        [
          gameId,
          kinds,
          game.runbook.contingencies.map((c) => c.answer),
          game.runbook.contingencies.map((_, i) => (i + 1) * 10),
        ]
      );
    }
  }

  // ── dependencies, after every game has an id ───────────────────────
  //
  // A second pass, because a game may depend on one declared later in the
  // module and an ordering requirement in a data file is a trap.
  for (const game of ALL_GAMES) {
    if (game.dependencies.length === 0) continue;

    const unknown = game.dependencies
      .map((d) => d.requires)
      .filter((slug) => !idBySlug.has(slug));
    if (unknown.length > 0) {
      throw new Error(
        `${game.slug} depends on games that src/lib/games.ts does not define: ` +
          `${unknown.join(", ")}.`
      );
    }

    await client.query(
      `insert into game_dependency
         (game_id, requires_game_id, strength, group_key, note)
       select $1, t.requires, t.strength::dependency_strength,
              t.group_key, t.note
         from unnest($2::uuid[], $3::text[], $4::text[], $5::text[])
              as t(requires, strength, group_key, note)
       on conflict (game_id, requires_game_id) do nothing`,
      [
        idBySlug.get(game.slug),
        game.dependencies.map((d) => idBySlug.get(d.requires)),
        game.dependencies.map((d) => d.strength),
        game.dependencies.map((d) => d.groupKey ?? null),
        game.dependencies.map((d) => d.note ?? null),
      ]
    );
    log(`depends  ${game.slug} on ${game.dependencies.length}`);
  }

  // ── destination scoping — stage 3 ──────────────────────────────────
  //
  // Reads `worldId`, resolved once at the top of the run. It used to query per
  // scope, which was a query per row and, worse, meant the answer arrived
  // AFTER the game had already been created live — see `unresolvableNatives`.
  //
  // A skip here is still correct for a missing world, and it is now only ever
  // reached by a `forbidden` or `affinity` scope on a room that does not
  // exist: a game with an unresolvable NATIVE scope was held as a draft on the
  // way in, so it is not sitting in the catalogue unscoped while this loop
  // decides what to do about it.
  let scoped = 0;
  let scopeSkipped = 0;
  for (const game of ALL_GAMES) {
    for (const scope of game.worlds) {
      const id = worldId.get(scope.world);
      if (id === undefined) {
        scopeSkipped += 1;
        log(
          `skip     ${game.slug} scoping to ${scope.world} — that destination ` +
            `is not in the database yet (npm run seed:destinations)` +
            (scope.native === true
              ? `. The game was held as a draft on the way in, because a ` +
                `native claim that lands nowhere means eligible everywhere`
              : "")
        );
        continue;
      }
      scoped += 1;

      await client.query(
        // `native` (db/019) is the CLAIM — "written for this destination and
        // nowhere else" — and it defaults to false. THE SEVEN ORIGINAL GAMES
        // MEAN THAT: `affinity: 0.4` on ART BATTLE says "the house would allow
        // it", not "no other house may", and the two are different columns
        // precisely so that sentence stays true. The twenty room games added
        // under CLAUDE.md rule 29 are the other case and say so — each is
        // written in one room's voice and claims `native` on it alone.
        `insert into game_world (game_id, world_id, forbidden, native, affinity, note)
         values ($1, $2, $3, $4, $5, $6)
         on conflict (game_id, world_id) do nothing`,
        [
          idBySlug.get(game.slug),
          id,
          scope.forbidden === true,
          scope.native === true,
          scope.affinity ?? 0,
          scope.note ?? null,
        ]
      );
    }
  }
  // CLAUDE.md rule 24: count what it matched. A scoping pass that wrote
  // nothing and a scoping pass that wrote everything read identically from
  // outside, and the second number is the one that changes what is eligible.
  log(
    `scoped   ${scoped} game_world claim(s) written or already present, ` +
      `${scopeSkipped} skipped for a destination that does not exist here`
  );

  // ── what the runbooks say about themselves ─────────────────────────
  //
  // Reported, never fatal. A game whose steps do not add up to its duration is
  // a curator's decision to make — she may have edited the duration in the tool
  // on purpose — and src/lib/games.test.ts already fails the build when the
  // AUTHORED runbooks disagree. This is the same question asked of whatever is
  // actually in the database, which may not be the module any more.
  const { rows: clock } = await client.query(
    `select slug, planned_minutes, claimed_low, claimed_high
       from game_runbook_clock where disagrees`
  );
  for (const row of clock) {
    log(
      `warn     ${row.slug}: the runbook adds up to ${row.planned_minutes} ` +
        `minutes and the game claims ${row.claimed_low}–${row.claimed_high}`
    );
  }

  const { rows: gaps } = await client.query(
    `select slug, string_agg(trouble_label, '; ' order by trouble) as troubles
       from game_runbook_gap group by slug`
  );
  for (const row of gaps) {
    log(`warn     ${row.slug} has no answer for: ${row.troubles}`);
  }

  /*
   * ── EVERY GAME BEAT HAS SOMETHING THAT CAN FILL IT ──────────────────
   *
   * CLAUDE.md's own near-miss entry: REMOVING A SLOT ORPHANS THE CLAIMS ON IT,
   * AND CLAIMS ARE WHITELISTS. Its mirror is a beat nothing claims — silent in
   * exactly the same way, because a slot no row can fill never reports
   * anything, it simply never fills.
   *
   * ── WHY IT IS HERE AND NOT IN A MIGRATION, WHICH IS THE WHOLE POINT ──
   *
   * db/069 asked this question in the migration and WEDGED THE DEPLOY. Rule 33
   * exactly: render.yaml runs `migrate` before every seeder, so at migration
   * time production still holds the PREVIOUS catalogue. A beat the migration
   * has just created legitimately has no claimant yet, and the guard called
   * that a catastrophe and stopped eight seeders from running.
   *
   *     A GUARD MAY ASSERT A PROPERTY OF THE ROWS THAT EXIST.
   *     IT MAY NOT ASSERT THAT ROWS EXIST.
   *
   * "Is the pool populated" does not rescue the second kind — a full table
   * proves the seeders ran once, not that they have run since the catalogue
   * gained the rows being asked after. THIS is the first instant at which the
   * question has an answer: the claims were written above, in this
   * transaction, from src/lib/games.ts.
   *
   * ── DRIVEN OFF occasion_slot, NEVER OFF A LIST OF BEATS (rule 19) ────
   *
   * Any beat drawing the game pool is covered, so `field_day`, `day_material`
   * and `game` are one check and the tenth beat somebody authors is too. A
   * hand-written list here would be correct until the next `insert into
   * occasion_slot` and then wrong without being broken.
   *
   * DRAFT CLAIMANTS COUNT. A game held back because its world is not seeded
   * yet is a legitimate state (see `isHeldBack` above), and refusing to
   * finish the seed over it would turn an ordinary partial catalogue into a
   * failed deploy. What is fatal is a beat NOTHING claims at any status —
   * that one can only be an authoring or migration mistake.
   */
  const { rows: beats } = await client.query(
    `select os.slot_code,
            count(distinct gs.game_id)                        as claimants,
            count(distinct g.id) filter (where g.status = 'active') as live
       from occasion_slot os
       left join game_slot gs
         on gs.slot_code = os.slot_code and gs.fit = 'native'
       left join game g on g.id = gs.game_id
      where os.pool = 'game'
      group by os.slot_code
      order by os.slot_code`
  );

  const unclaimed = beats.filter((row) => Number(row.claimants) === 0);
  for (const row of beats) {
    log(
      `beat     ${row.slot_code}: ${row.claimants} native claimant(s), ` +
        `${row.live} of them live`
    );
  }

  if (unclaimed.length > 0) {
    await client.query("rollback");
    throw new Error(
      `${unclaimed.map((row) => row.slot_code).join(", ")} draw(s) from the ` +
        `game pool and NO game claims ${unclaimed.length === 1 ? "it" : "them"}.\n\n` +
        `A slot no row can fill never reports anything — it simply never ` +
        `fills, and the member's package is quietly thinner than the ` +
        `catalogue says. Either a game should claim the beat in ` +
        `src/lib/games.ts, or the beat should not exist.\n\n` +
        `This is the check db/069 tried to make at migration time, where it ` +
        `could not be true yet. Do not move it back.`
    );
  }

  // AND THE OTHER DIRECTION, which is a warning rather than a failure: a beat
  // whose every claimant is held back fills for nobody today, and that is an
  // ordinary consequence of a world not being seeded rather than a mistake.
  for (const row of beats.filter((r) => Number(r.live) === 0)) {
    log(
      `warn     ${row.slot_code} has ${row.claimants} claimant(s) and none of ` +
        `them is live, so nothing can fill it yet`
    );
  }

  await client.query("commit");
  log(`done. ${ALL_GAMES.length} games in the module.`);

  if (created - heldBack > 0) {
    console.log(
      `\n${created - heldBack} game(s) went LIVE on this run. The pool stocks ` +
        `itself (db/038); the desk\nis where that gets vetoed, not where it ` +
        `gets approved. /desk/stocked lists this run\nand sends one game or ` +
        `all ${created - heldBack} back to draft.`
    );
  }
  if (heldBack - heldForWorld > 0) {
    console.log(
      `\n${heldBack - heldForWorld} game(s) stayed DRAFT because the row ` +
        `itself carries a FOUNDER-PENDING question.\nThey are at ` +
        `/desk/publish, which is where a question that has been answered ` +
        `gets\nsaid yes to. Removing the question from src/lib/games.ts does ` +
        `NOT publish an\nexisting row: no seeder here rewrites the status of ` +
        `a row it did not create.`
    );
  }
  if (heldForWorld > 0) {
    console.log(
      `\n${heldForWorld} game(s) stayed DRAFT because they are NATIVE to a ` +
        `destination this database\ndoes not have. A native claim is a ` +
        `whitelist (CLAUDE.md rule 23), so writing the\nrow without it would ` +
        `not fail safe — it would offer a game written for one room\nin every ` +
        `room, silently. Seed the destination and publish them at ` +
        `/desk/publish;\nthis seeder will not change the status of a row it ` +
        `did not create.`
    );
  }
} catch (err) {
  try {
    await client.query("rollback");
  } catch {
    // The connection is already gone; the transaction died with it.
  }
  console.error(`\n[seed-games] FAILED: ${err.message}`);
  process.exitCode = 1;
} finally {
  await client.end();
}
