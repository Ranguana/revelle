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
 */
import pg from "pg";

import { DESTINATIONS } from "../src/lib/destinations.ts";

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
      `select id, name from world where slug = $1`,
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
    } else {
      worldId = existing[0].id;
      console.log(`[seed-destinations] exists   ${key} — left as it is`);
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
