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
 *   · A game that does not exist is created as a DRAFT. Deciding that
 *     something is active is a curator's decision, not a script's.
 *   · A game that already exists is LEFT ALONE — name, rules, bounds and all.
 *     A curator's edit in the tool outranks the module, and silently
 *     overwriting her work is the failure this house cares about most. What
 *     differs is REPORTED.
 *   · Facet tags, occasion claims, slot claims, supplies, requirements,
 *     printed matter, dependencies and destination scoping are added where
 *     absent and never changed where present. `on conflict do nothing`
 *     everywhere, deliberately.
 *   · A facet code that is not in the vocabulary is a HARD FAILURE, not a
 *     skipped row. A game tagged with a term that does not exist is a game
 *     that quietly matches nobody, which is worse than a crash.
 *   · Destination scoping is applied only for worlds that exist. A missing
 *     world is reported and skipped — run npm run seed:destinations first if
 *     the scoping matters to you.
 *
 * Re-running with nothing changed does nothing at all. The whole run is one
 * transaction: a failure halfway leaves no half-seeded game.
 *
 * Same connection rules as scripts/migrate.mjs. Needs DATABASE_URL and is
 * deliberately not wired into a deploy: putting a game in the catalogue is a
 * decision.
 */
import pg from "pg";

import { ALL_GAMES } from "../src/lib/games.ts";

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

  // ── the games ──────────────────────────────────────────────────────

  const idBySlug = new Map();

  for (const game of ALL_GAMES) {
    const { rows: existing } = await client.query(
      `select id from game where slug = $1`,
      [game.slug]
    );

    let gameId;
    if (existing.length === 0) {
      const { rows } = await client.query(
        `insert into game (
           slug, name, description, how_it_works, materials,
           shape, sourcing,
           duration_minutes, duration_max_minutes,
           min_guests, max_guests,
           scoring, currency_label,
           external_name, external_url, caveat,
           source_note, notes, status)
         values ($1,$2,$3,$4,$5,$6::game_shape,$7::game_sourcing,
                 $8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,'draft')
         returning id`,
        [
          game.slug,
          game.name,
          game.description,
          game.howItWorks,
          game.materials ?? null,
          game.shape,
          game.sourcing,
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
        ]
      );
      gameId = rows[0].id;
      log(`created  ${game.slug} (draft, ${game.shape}, ${game.sourcing})`);
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
  for (const game of ALL_GAMES) {
    for (const scope of game.worlds) {
      const { rows: world } = await client.query(
        `select id from world where slug = $1`,
        [scope.world]
      );
      if (world.length === 0) {
        log(
          `skip     ${game.slug} scoping to ${scope.world} — that destination ` +
            `is not in the database yet (npm run seed:destinations)`
        );
        continue;
      }

      await client.query(
        `insert into game_world (game_id, world_id, forbidden, affinity, note)
         values ($1, $2, $3, $4, $5)
         on conflict (game_id, world_id) do nothing`,
        [
          idBySlug.get(game.slug),
          world[0].id,
          scope.forbidden === true,
          scope.affinity ?? 0,
          scope.note ?? null,
        ]
      );
    }
  }

  await client.query("commit");
  log(`done. ${ALL_GAMES.length} games in the module.`);
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
