#!/usr/bin/env node
/**
 * Put the authored destinations into the database.
 *
 *   npm run seed:destinations
 *
 * ─────────────────────────────────────────────────────────────────────
 * WHY THIS IS A SCRIPT AND NOT A MIGRATION
 *
 * db/004 adds the SHAPE of a voice. A destination is CONTENT, and content in a
 * migration is content that can only be corrected by another migration. The
 * canonical text of a destination lives in src/lib/destinations.ts, where a
 * change is a diff a human can read; this moves it into the tables the app and
 * the curator's tool read from.
 *
 * ─────────────────────────────────────────────────────────────────────
 * WHAT IT WILL AND WILL NOT DO
 *
 *   · A destination that does not exist is created, as a DRAFT world. Deciding
 *     that something is published is a curator's decision, not a script's.
 *   · A destination that already exists is LEFT ALONE — name, tagline and
 *     tokens included. A curator's edit in the tool outranks the module, and
 *     silently overwriting her copy is exactly the failure this house cares
 *     about most.
 *   · THE ONE EXCEPTION: a STUB. scripts/seed-menus.mjs and
 *     scripts/seed-drinks.mjs create a draft `world` row for a destination that
 *     has authored content and has not been written yet, so the content can be
 *     scoped to something true; the row marks itself as a stub in its own
 *     `notes` column. A stub is completed in place from the module — never
 *     duplicated, because every menu_world and drink_world row already points
 *     at it — and its status is still left for a curator to change.
 *   · A destination with no voice yet gets its first one, published.
 *   · A destination whose published voice DIFFERS from the module is reported
 *     and left alone unless `--publish` is passed, in which case the next
 *     version is published and the current one superseded. It never edits the
 *     published row — it cannot, the database refuses — so a Revelle already
 *     issued keeps the words it was issued with. The flag exists because the
 *     difference may be a curator's revision made in the tool rather than a
 *     change in the module, and a script that supersedes her work on a routine
 *     re-run is the same drift db/004 was written to prevent, arriving by a
 *     different door. Re-running with nothing changed does nothing at all.
 *
 * Same connection rules as scripts/migrate.mjs. Needs DATABASE_URL and is
 * deliberately not wired into a deploy: publishing a voice is a decision.
*
 * ── ONE ASYMMETRY, STATED SO IT IS NOT A SURPRISE ────────────────────
 *
 * seed:menus and seed:drinks take `--overwrite`, which lets the file beat the
 * curator when explicitly asked. THIS SEEDER HAS NO SUCH FLAG and never had
 * one, and neither do seed:destinations or seed:dishes. So a desk edit here is
 * not merely default-winning — nothing in the pipeline can revert it, and the
 * only way back to the authored text is a person retyping it.
 *
 * That is defensible for content a curator is meant to own. It is written down
 * because five scripts describe themselves in near-identical words and only two
 * of them have the escape hatch.

 */
import pg from "pg";

import { DESTINATIONS, DESTINATION_TONES } from "../src/lib/destinations.ts";
import { isStubRow } from "./catalogue-vocabulary.mjs";

/** Kept in sync with the same function in scripts/migrate.mjs and src/lib/db.ts. */
function needsSsl(url) {
  if (/sslmode=disable/.test(url)) return false;
  return !/@(localhost|127\.0\.0\.1|\[::1\])/.test(url);
}

/** Superseding a voice that is in force is a decision, so it is asked for. */
const publish = process.argv.includes("--publish");

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("[seed-destinations] DATABASE_URL is not set.");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: url,
  ssl: needsSsl(url) ? { rejectUnauthorized: false } : undefined,
  application_name: "revelle-seed-destinations",
});

await client.connect();

try {
  await client.query("begin");

  for (const destination of Object.values(DESTINATIONS)) {
    const { key, name, tagline, premise, look, voice } = destination;

    // The look, as the world's token set: exactly the object src/lib/tokens.ts
    // renders to CSS, so what is stored is what is drawn.
    const tokens = JSON.stringify(look);

    const { rows: existing } = await client.query(
      `select id, name, notes from world where slug = $1`,
      [key]
    );

    let worldId;
    if (existing.length === 0) {
      const { rows } = await client.query(
        `insert into world (slug, name, tagline, description, tokens, status)
         values ($1, $2, $3, $4, $5::jsonb, 'draft')
         returning id`,
        [key, name, tagline, premise, tokens]
      );
      worldId = rows[0].id;
      console.log(`[seed-destinations] created  ${key} (draft)`);
    } else if (isStubRow(existing[0])) {
      // ── THE ONE EXCEPTION TO "LEAVE IT ALONE" ──────────────────────
      //
      // The rule above protects a CURATOR'S work, and a stub is not a
      // curator's work. It is a placeholder that scripts/seed-menus.mjs or
      // scripts/seed-drinks.mjs created so that authored content could be
      // scoped to something true before the destination itself existed, and it
      // says exactly that in its own notes column — which is what makes this
      // safe to detect rather than guess at.
      //
      // Completing it in place matters because the alternative is worse in
      // both directions: a second world row would orphan every menu_world and
      // drink_world row already pointing at the stub, and leaving the stub
      // alone would leave the destination permanently nameless and untokened
      // while looking, to every screen, as though it had been authored.
      //
      // Status is NOT touched. Publishing a destination is a curator's
      // decision and a seed script has no standing to make it — the same
      // sentence this file has always ended on.
      worldId = existing[0].id;
      await client.query(
        `update world
            set name = $2, tagline = $3, description = $4,
                tokens = $5::jsonb, notes = null
          where id = $1`,
        [worldId, name, tagline, premise, tokens]
      );
      console.log(
        `[seed-destinations] adopted  ${key} — was a stub from a catalogue ` +
          `seed; look and copy filled in, status left as it is`
      );
    } else {
      worldId = existing[0].id;
      console.log(`[seed-destinations] exists   ${key} — left as it is`);
    }

    // ── how it sounds, in the vocabulary a host answers in ──────────
    //
    // The same fifty tones she is shown (src/lib/voice.ts), so that matching a
    // register is a set operation over shared rows rather than a comparison of
    // two private descriptions. See the note at the top of db/007.
    //
    // Same rule as everything else here: NEVER overwrite a curator. A tag that
    // already exists is left exactly as she set it and the difference is
    // reported, because a weight changed in the tool is a judgement and this
    // script has no standing to reverse it.
    const tones = DESTINATION_TONES[key] ?? [];
    if (tones.length > 0) {
      const codes = tones.map((t) => t.code);
      const weights = tones.map((t) => t.weight);

      // The insert below joins by code, so a tone that does not exist would
      // simply produce no row. Fail loudly instead: a destination missing a tag
      // it thinks it has is a destination that quietly matches nobody.
      const { rows: known } = await client.query(
        `select f.code::text as code
           from facet f
          where f.dimension_code = 'voice_tone' and f.code::text = any($1::text[])`,
        [codes]
      );
      if (known.length !== codes.length) {
        const found = new Set(known.map((r) => r.code));
        throw new Error(
          `${key} is tagged with tones that are not in the vocabulary: ` +
            `${codes.filter((c) => !found.has(c)).join(", ")}. ` +
            `Has db/007 been applied?`
        );
      }

      const { rows: added } = await client.query(
        `insert into world_facet (world_id, facet_id, weight, provenance, note)
         select $1, f.id, t.weight, 'curator', 'From src/lib/destinations.ts.'
           from unnest($2::text[], $3::numeric[]) as t(code, weight)
           join facet f
             on f.dimension_code = 'voice_tone' and f.code::text = t.code
         on conflict (world_id, facet_id) do nothing
         returning facet_id`,
        [worldId, codes, weights]
      );

      const { rows: differing } = await client.query(
        `select f.code::text as code, wf.weight
           from world_facet wf
           join facet f on f.id = wf.facet_id
           join unnest($2::text[], $3::numeric[]) as t(code, weight)
             on t.code = f.code::text
          where wf.world_id = $1
            and f.dimension_code = 'voice_tone'
            and wf.weight <> t.weight`,
        [worldId, codes, weights]
      );

      console.log(
        `[seed-destinations] tones    ${key} ${added.length} tagged, ` +
          `${tones.length - added.length} already there`
      );
      for (const row of differing) {
        console.log(
          `[seed-destinations] tones    ${key} ${row.code} is ${row.weight} ` +
            `here and differs in src/lib/destinations.ts — left as it is`
        );
      }
    }

    const payload = JSON.stringify(voice);

    const { rows: published } = await client.query(
      `select id, version, voice = $2::jsonb as same
         from world_voice
        where world_id = $1 and status = 'published'`,
      [worldId, payload]
    );

    if (published.length > 0 && published[0].same) {
      console.log(
        `[seed-destinations] voice    ${key} v${published[0].version} unchanged`
      );
      continue;
    }

    if (published.length > 0 && !publish) {
      console.log(
        `[seed-destinations] voice    ${key} v${published[0].version} differs ` +
          `from src/lib/destinations.ts — left in force. Re-run with ` +
          `--publish to issue the next version.`
      );
      continue;
    }

    // No version passed: the database numbers it. Inserted straight into
    // 'published', which validates the shape and supersedes the previous
    // version in the same statement.
    const { rows: inserted } = await client.query(
      `insert into world_voice (world_id, voice, status, authored_by, note)
       values ($1, $2::jsonb, 'published', $3, $4)
       returning id, version`,
      [
        worldId,
        payload,
        "curator",
        published.length === 0
          ? "First voice, from src/lib/destinations.ts."
          : `Supersedes v${published[0].version}. From src/lib/destinations.ts.`,
      ]
    );

    console.log(
      `[seed-destinations] voice    ${key} v${inserted[0].version} published` +
        (published.length > 0
          ? ` (v${published[0].version} superseded; Revelles issued in it keep it)`
          : "")
    );
  }

  await client.query("commit");
} catch (err) {
  await client.query("rollback");
  console.error(`\n[seed-destinations] FAILED: ${err.message}`);
  process.exitCode = 1;
} finally {
  await client.end();
}
