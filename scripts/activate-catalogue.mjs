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

/**
 * Which pools exist, and what "offered" MEANS for each, is data — db/002's
 * ingredient_pool carries `active_column` and `active_value` as a column/value
 * pair rather than a predicate string, deliberately, so nothing here has to
 * know that a menu says `status = 'active'` and guess that every other pool
 * agrees. A pool that does not declare a pair has no draft state to leave and
 * is skipped rather than assumed.
 */
const pools = (
  await client.query(
    `select entity_table, active_column, active_value
       from ingredient_pool
      where active_column is not null
      order by entity_table`
  )
).rows;

let changed = 0;

try {
  await client.query("begin");

  for (const p of pools) {
    // format(%I) on the identifiers, never interpolation: these come from a
    // table a curator could in principle write to, and db/002 makes the same
    // point about why a predicate string was refused here.
    const { rows } = await client.query(
      `select format(
                'update %I set %I = %L where %I = %L returning slug',
                $1::text, $2::text, $3::text, $2::text, 'draft'
              ) as sql`,
      [p.entity_table, p.active_column, p.active_value]
    );
    const done = await client.query(rows[0].sql);
    if (done.rows.length) {
      console.log(
        `[activate] ${p.entity_table.padEnd(10)} ${done.rows.length} draft -> ${p.active_value}`
      );
      changed += done.rows.length;
    } else {
      console.log(`[activate] ${p.entity_table.padEnd(10)} nothing in draft`);
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
