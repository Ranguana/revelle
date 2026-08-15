#!/usr/bin/env node
/**
 * Offer the catalogue.
 *
 *   npm run activate:catalogue          say what would change, change nothing
 *   npm run activate:catalogue -- --yes actually do it
 *
 * ── WHY THIS IS SEPARATE FROM SEEDING ────────────────────────────────
 *
 * Every seeder creates DRAFTS and says so, because deciding that something is
 * offered to a customer is a curator's decision and not a script's. That rule
 * is right and it is not being weakened here: this is the curator saying yes,
 * in one place, out loud, with a record of what it touched.
 *
 * seed:menus and seed:drinks each take `--activate`. seed:games has no such
 * flag and never had one, and a destination's status is not something any
 * seeder sets at all. So "activate everything" was three different gestures
 * and one impossibility. This is the missing one.
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
 */

import pg from "pg";

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

/** Which pools exist is data (db/002's ingredient_pool), not a list to keep in step. */
const pools = (
  await client.query(`select table_name from ingredient_pool order by table_name`)
).rows.map((r) => r.table_name);

let changed = 0;

try {
  await client.query("begin");

  for (const table of pools) {
    // Every pool table carries `status` with a `draft` member — see the
    // installers in db/002 and db/010. A pool that does not is a schema change
    // that should fail loudly here rather than be skipped silently.
    const { rows } = await client.query(
      `update ${table} set status = 'active'
        where status = 'draft'
        returning slug`
    );
    if (rows.length) {
      console.log(`[activate] ${table.padEnd(10)} ${rows.length} draft -> active`);
      changed += rows.length;
    } else {
      console.log(`[activate] ${table.padEnd(10)} nothing in draft`);
    }
  }

  // ── destinations ───────────────────────────────────────────────────
  //
  // `world_voice` is versioned and superseded; a destination "has a voice"
  // only if a row of it is currently published. Joining rather than trusting
  // a flag is the point — see db/004.
  const voiced = await client.query(
    `update world w set status = 'published'
      where w.status = 'draft'
        and exists (
          select 1 from world_voice v
           where v.world_id = w.id
             and v.published_at is not null
             and v.superseded_at is null
        )
      returning w.slug`
  );
  for (const r of voiced.rows) console.log(`[activate] world      ${r.slug} -> published`);
  changed += voiced.rows.length;

  const mute = await client.query(
    `select w.slug,
            (select count(*) from menu_world mw where mw.world_id = w.id) as menus,
            (select count(*) from drink_world dw where dw.world_id = w.id) as drinks
       from world w
      where w.status = 'draft'
      order by w.slug`
  );

  if (yes) {
    await client.query("commit");
  } else {
    await client.query("rollback");
  }

  console.log(
    `\n[activate] ${changed} row(s) ${yes ? "changed" : "WOULD change — nothing was written"}`
  );

  if (mute.rows.length) {
    console.log(
      `\n[activate] These destinations stay DRAFT because they have no published ` +
        `voice.\n           A destination with a look and no voice cannot be ` +
        `written, so it must not\n           be offered. This list is the ` +
        `authoring queue:\n`
    );
    for (const r of mute.rows) {
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
