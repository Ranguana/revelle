#!/usr/bin/env node
/**
 * Offer the catalogue.
 *
 *   npm run activate:catalogue          say what would change, change nothing
 *   npm run activate:catalogue -- --yes actually do it
 *
 * ── THERE IS NOW A SCREEN, AND THIS STILL EXISTS ─────────────────────
 *
 * /desk/publish does the same thing with the list in front of a curator, and it
 * is the one a person should reach for: this command can only be typed inside a
 * Render shell, because the database has an empty ipAllowList and is
 * unreachable from any laptop by design (render.yaml says why). A gate that can
 * only be operated from a shell is a gate nobody operates, which is how 372
 * dishes came to be sitting in draft.
 *
 * This is kept because it is the gesture that needs no browser and no session:
 * the whole catalogue, one command, from inside a deploy shell, when that is
 * what the situation is. The two must not drift, so the RULES BELOW ARE NOT
 * IMPLEMENTED HERE ANY MORE — they live in src/lib/desk/publish.ts and both
 * callers import them. Read that file for the code; read this header for the
 * argument, which is still the canonical one.
 *
 * (Importing a .ts module from a .mjs script is the same thing
 * scripts/seed-games.mjs and scripts/seed-destinations.mjs already do — Node 22
 * strips the types. render.yaml pins NODE_VERSION to 22.)
 *
 * ── WHY THIS IS SEPARATE FROM SEEDING ────────────────────────────────
 *
 * Every seeder creates DRAFTS and says so, because deciding that something is
 * offered to a customer is a curator's decision and not a script's. That rule
 * is right and it is not being weakened here: this is the curator saying yes,
 * in one place, out loud, with a record of what it touched.
 *
 * WHAT THAT PARAGRAPH USED TO BE FOLLOWED BY, kept because CLAUDE.md rule 14
 * keeps a reversed argument rather than deleting it:
 *
 *   "seed:menus, seed:drinks and seed:dishes each take `--activate`, which
 *    applies only to rows THEY create. seed:games has no such flag and never
 *    had one, and a destination's status is not something any seeder sets at
 *    all. So 'activate everything' was three different gestures and one
 *    impossibility. This is the missing one."
 *
 * NONE OF THOSE THREE FLAGS EXISTS ANY MORE. db/036 and CLAUDE.md rule 13 made
 * pool content stock itself: a dish, drink, menu or bank item a seeder creates
 * is live on the way in and lands in `staff_action` under `auto:
 * pool-stocking`, and the founder VETOES at /desk/stocked rather than
 * consenting. The old rule was right about what it protected — a world, a
 * voice — and wrong about its scope, which is why it still governs `world` and
 * `world_voice` word for word and nothing else.
 *
 * So this script has almost nothing left to move in the pools, and that is
 * success rather than obsolescence. What it still does is the part that was
 * always the point: the destinations, under the voice rule below, plus the few
 * rows a person drafted by hand or a seeder held back on a founder-pending
 * question. It is the shell-side twin of /desk/publish and calls the same
 * functions, which is the only reason it may still exist (CLAUDE.md rule 9: the
 * database is unreachable from a laptop, so this is a Render-shell gesture and
 * the screen is the one a curator can actually reach).
 *
 * ── THE ONE RULE THAT IS NOT NEGOTIABLE ──────────────────────────────
 *
 * A destination is published ONLY if it has a published voice.
 *
 * A destination with a look and no voice cannot be written — no invitation, no
 * menu card, no place cards, nothing. Publishing one puts a house in front of
 * a customer that cannot speak. db/019 added a trigger that refuses it; this
 * script does not rely on that trigger existing, because the rule has to hold
 * on any database this is pointed at.
 *
 * The eleven destinations that currently have menus and drinks but no authored
 * voice therefore stay draft, and are NAMED in the output, because that list
 * is the authoring queue.
 *
 * ── IDEMPOTENT ───────────────────────────────────────────────────────
 *
 * Re-running reports zero of everything. Nothing here moves a row backwards:
 * a discontinued product stays discontinued, an unpublished destination that a
 * curator archived stays archived. Only `draft` moves.
 *
 * ── AND ONE-WAY ──────────────────────────────────────────────────────
 *
 * No seeder in this repository can undo what this does. No seeder writes a
 * status on a row that already exists; `--overwrite` (menus, drinks, dishes)
 * lets the file beat a curator's edit on the WORDS and writes no status at
 * all. The way back is by hand, one row at a time, at the desk. See
 * IRREVERSIBLE in src/lib/desk/publish.ts, where that claim is checked against
 * every seeder — and where the ONE asymmetry is argued: a row a SEEDER offered
 * without asking goes back in bulk at /desk/stocked, because a veto has to be
 * as cheap as the act it answers. A row this script or that screen published
 * does not, because somebody decided it.
 */

import pg from "pg";

import {
  pools,
  publish,
  publishDestinations,
  worldStanding,
} from "../src/lib/desk/publish.ts";

const yes = process.argv.includes("--yes");

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("[activate] DATABASE_URL is not set.");
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: url,
  ssl: /@(localhost|127\.0\.0\.1|\[::1\])/.test(url) || /sslmode=disable/.test(url)
    ? undefined
    : { rejectUnauthorized: false },
  max: 2,
});

const client = await pool.connect();

/**
 * The shared module's `Ask`, bound to THIS client.
 *
 * Binding it to one client rather than to the pool is what keeps the dry run
 * honest: every statement below lands inside the single transaction opened here
 * and is rolled back together when `--yes` is absent.
 */
const ask = async (text, params = []) => (await client.query(text, params)).rows;

let changed = 0;

try {
  await client.query("begin");

  // Which pools exist, and what "offered" MEANS for each, is data — see the
  // registry note in src/lib/desk/publish.ts. `world` is excluded there, not
  // here, because excluding it is part of the rule and not part of this loop.
  for (const p of await pools(ask)) {
    // null: the whole pool, no list. That is this command's gesture — the
    // screen passes ids because it showed her the rows first.
    const done = await publish(ask, p, null);
    if (done.length) {
      console.log(
        `[activate] ${p.code.padEnd(10)} ${done.length} draft -> ${p.activeValue}`
      );
      changed += done.length;
    } else {
      console.log(`[activate] ${p.code.padEnd(10)} nothing in draft`);
    }
  }

  // ── destinations ───────────────────────────────────────────────────
  //
  // The voice rule is inside publishDestinations() and is applied whether or
  // not a list was given, which is the point: the veto belongs to the
  // statement, not to whoever assembled the list.
  const voiced = await publishDestinations(ask, null);
  for (const r of voiced) console.log(`[activate] world      ${r.slug} -> published`);
  changed += voiced.length;

  // Read AFTER the update, so this is what is still draft once the voiced ones
  // have gone out.
  const { mute } = await worldStanding(ask);

  if (yes) {
    await client.query("commit");
  } else {
    await client.query("rollback");
  }

  console.log(
    `\n[activate] ${changed} row(s) ${yes ? "changed" : "WOULD change — nothing was written"}`
  );

  if (mute.length) {
    console.log(
      `\n[activate] These destinations stay DRAFT because they have no published ` +
        `voice.\n           A destination with a look and no voice cannot be ` +
        `written, so it must not\n           be offered. This list is the ` +
        `authoring queue:\n`
    );
    for (const r of mute) {
      console.log(
        `             ${r.slug.padEnd(18)} ${String(r.menus).padStart(2)} menus, ` +
          `${String(r.drinks).padStart(2)} drinks written for it`
      );
    }
  }

  if (!yes) console.log(`\n[activate] Re-run with --yes to apply.`);
} catch (err) {
  await client.query("rollback");
  console.error(`[activate] FAILED: ${err.message}`);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
