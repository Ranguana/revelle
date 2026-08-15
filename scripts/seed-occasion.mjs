#!/usr/bin/env node
/**
 * ONE REVELLE, SO THE INSIDE OF AN OCCASION CAN BE LOOKED AT.
 *
 *   npm run seed:occasion            build it and print the way in
 *   npm run seed:occasion -- --link  mint another link, change nothing
 *   npm run seed:occasion -- --remove take it back out
 *
 * ─────────────────────────────────────────────────────────────────────
 * WHY THIS EXISTS
 *
 * Nothing connects an application to a stored Revelle yet. The selection
 * engine produces candidates and stops; the portal reads rows and there are
 * none. So the one screen membership actually buys cannot be looked at, and a
 * screen nobody has looked at is a screen nobody has designed.
 *
 * This writes the rows the generation step will one day write, for one member,
 * so that it can be opened over real HTTP on a real phone.
 *
 * ─────────────────────────────────────────────────────────────────────
 * WHY IT DOES NOT RUN THE ENGINE
 *
 * It would be one line, and it would be wrong. A fixture has to be the same
 * thing every time it is built: the founder looks at this screen, changes a
 * margin, rebuilds and looks again, and the two pictures have to differ only
 * by the margin. An engine's output moves when the catalogue moves — add a
 * menu and the assemblage changes, and the founder is comparing two designs
 * AND two Revelles. So the pieces below are NAMED, by slug, and the file can
 * be read to know exactly what the screen will show.
 *
 * The engine is exercised by scripts/selection-demo.mjs, which is its own job.
 *
 * ─────────────────────────────────────────────────────────────────────
 * WHAT IT WILL AND WILL NOT PLACE
 *
 * The drinks, the menu and the games are the FOUNDER'S OWN — docs/drinks.md,
 * docs/menus.md and src/lib/games.ts, moved into the database by seed:drinks,
 * seed:menus and seed:games. The arrival drink, the table, the soundtrack and
 * the edit are FIXTURES, because there is no authored product or tracklist in
 * the catalogue at all; the script says which is which every time it runs, so
 * nothing graduates by accident.
 *
 * Anything it cannot find, it does not place, and the screen then shows
 * NOTHING where that deliverable would have been. That is not a degraded
 * fixture — it is the product's central rule (src/lib/selection/member.ts) and
 * seeing it happen is half the reason to look at this screen.
 *
 * It changes no statuses. A draft menu is a curator's decision not yet taken,
 * and a seed that activated one to make its own output prettier would be
 * taking that decision on her behalf. A delivered Revelle keeps what it was
 * issued with regardless — that is what the `restrict` in db/002 is for.
 *
 * ─────────────────────────────────────────────────────────────────────
 * SAFETY
 *
 * Refuses a DATABASE_URL that does not look local unless --force is passed,
 * exactly as scripts/seed-fixtures.mjs does, and for a sharper reason: this
 * one creates a MEMBER and prints a working sign-in link for her.
 *
 * Same connection rules as scripts/migrate.mjs. Needs DATABASE_URL.
 */
import { createHash, randomBytes } from "node:crypto";

import pg from "pg";

const remove = process.argv.includes("--remove");
const force = process.argv.includes("--force");
const linkOnly = process.argv.includes("--link");

/** Kept in sync with the same function in scripts/migrate.mjs and src/lib/db.ts. */
function needsSsl(url) {
  if (/sslmode=disable/.test(url)) return false;
  return !/@(localhost|127\.0\.0\.1|\[::1\])/.test(url);
}

function looksLocal(url) {
  return /@(localhost|127\.0\.0\.1|\[::1\])/.test(url);
}

// ─────────────────────────────────────────────────────────────────────
// THE FIXTURE
// ─────────────────────────────────────────────────────────────────────

/**
 * `.invalid` is reserved by RFC 2606 and can never be delivered to, so this
 * address cannot become a real person's inbox by accident. The name is the
 * house's own placeholder; nothing about her is a claim.
 */
const MEMBER = {
  email: "portal-preview@example.invalid",
  name: "Nora Vance",
};

const DESTINATION = "westhampton-1976";

/** This year's Labor Day weekend, and last spring. */
const YEAR = new Date().getFullYear();

/**
 * TWO REVELLES, because the shelf has two halves.
 *
 * docs/portal-spec.md is clear that the archive is a large part of what
 * membership IS — "it should feel like a shelf, not a list of closed tickets"
 * — and a shelf with one thing on it does not demonstrate a shelf. So there is
 * a next one and a past one, and the split between them can be looked at.
 *
 * They are deliberately different assemblages. db/002 refuses to deliver the
 * same set of pooled ingredients twice, and two fixtures that collide would
 * fail on the second insert with an error about somebody else's Revelle.
 *
 * `slot` is the occasion slot each piece fills (slot_kind.code) and `section`
 * is the block it renders into — both are recorded, because db/009 added
 * slot_code precisely so "which slot did this fill" survives beside "which
 * block does it appear in". `authored` marks the founder's own work; the rest
 * are fixtures and are reported as such on every run.
 *
 * The dedication on each is written in the house's register — short
 * declaratives, a real hour, no feeling named — because otherwise the one
 * piece of personal writing on the screen is the only thing that sounds like
 * software.
 */
const REVELLES = [
  {
    key: "portal-preview-v1",
    // The long dinner. db/009's `dinner_party`: one table, one evening, and
    // the occasion whose slots the founder's catalogue can most nearly fill.
    occasion: "dinner_party",
    guests: 10,
    // Labor Day weekend, which is the destination's own weekend.
    date: `${YEAR}-09-05`,
    dedication:
      "The house is open from Friday. Drinks at seven, dinner when it suits you.",
    secret: "A rented house on Dune Road and six people who have all met before.",
    answers: {
      environment: "rented_house",
      tasteDirections: ["old_world_riviera", "faded_coastal"],
      groupFun: ["long_dinner", "talk_deep"],
      antiPreferences: ["schedule"],
      affinities: ["beauty", "ease"],
      guests: "from_9_to_12",
      spend: "from_150_to_300",
    },
    pieces: [
      { pool: "product", slug: "fixture-cold-rose-service", slot: "arrival_drink", section: "arrival" },
      { pool: "drink", slug: "drink-01", slot: "the_drinks", section: "details", authored: true },
      { pool: "menu", slug: "menu-01", slot: "the_menu", section: "details", authored: true },
      { pool: "product", slug: "fixture-lemon-centrepiece", slot: "table_object", section: "details" },
      { pool: "game", slug: "art-battle", slot: "the_moment", section: "moment", authored: true },
      { pool: "game", slug: "fishbowl", slot: "game", section: "fun", authored: true },
      { pool: "tracklist", slug: "fixture-porch-and-dock", slot: "soundtrack", section: "soundtrack" },
      { pool: "product", slug: "fixture-ice-bucket", slot: "edit_item", section: "edit" },
      { pool: "product", slug: "fixture-record-crate", slot: "edit_item", section: "edit" },
    ],
  },
  {
    key: "portal-preview-v2",
    // A birthday, which has two slots a dinner does not: the beat where the
    // person is marked, and something they take home. It is in the past, so it
    // is on the shelf rather than next.
    occasion: "birthday",
    guests: 14,
    date: `${YEAR}-04-18`,
    dedication:
      "Fourteen at the table and nobody making a speech. Half past eight.",
    secret: "Her fortieth, and she does not want it announced.",
    answers: {
      environment: "my_home",
      tasteDirections: ["old_world_riviera", "supper_club"],
      groupFun: ["long_dinner", "compete"],
      antiPreferences: ["novelty"],
      affinities: ["beauty"],
      guests: "from_13_to_20",
      spend: "from_150_to_300",
    },
    pieces: [
      { pool: "product", slug: "fixture-negroni-batch", slot: "arrival_drink", section: "arrival" },
      { pool: "drink", slug: "drink-02", slot: "the_drinks", section: "details", authored: true },
      { pool: "menu", slug: "menu-03", slot: "the_menu", section: "details", authored: true },
      { pool: "game", slug: "fixture-letters-read-aloud", slot: "honouring", section: "moment" },
      { pool: "product", slug: "fixture-brass-candelabra", slot: "table_object", section: "details" },
      { pool: "game", slug: "lets-make-a-deal", slot: "the_moment", section: "moment", authored: true },
      { pool: "game", slug: "reverse-scavenger-hunt", slot: "game", section: "fun", authored: true },
      { pool: "tracklist", slug: "fixture-brass-and-marble", slot: "soundtrack", section: "soundtrack" },
      { pool: "product", slug: "fixture-coupe-glasses", slot: "edit_item", section: "edit" },
      { pool: "product", slug: "fixture-tiny-bottle", slot: "favour", section: "edit" },
    ],
  },
];

/** A magic link is short lived, and a seed does not get to relax that. */
const SIGN_IN_TTL_MINUTES = 15;

// ─────────────────────────────────────────────────────────────────────

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("[seed-occasion] DATABASE_URL is not set.");
  process.exit(1);
}

if (!looksLocal(url) && !force) {
  console.error(
    "[seed-occasion] REFUSING: DATABASE_URL does not look local.\n" +
      "  This creates a member and prints a working sign-in link for her. In a\n" +
      "  real database that is an account nobody asked for. Pass --force if you\n" +
      "  are certain."
  );
  process.exit(1);
}

const client = new pg.Client({
  connectionString: url,
  ssl: needsSsl(url) ? { rejectUnauthorized: false } : undefined,
  application_name: "revelle-seed-occasion",
});

await client.connect();

/** Where the printed link points. Matches src/lib/login.ts's own default. */
function appUrl() {
  return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

async function one(sql, params = []) {
  const { rows } = await client.query(sql, params);
  return rows[0] ?? null;
}

/**
 * A fresh link for the preview member.
 *
 * The digest is stored and the raw token is printed, which is the same trade
 * src/lib/session.ts makes with an email: the only two places a raw token may
 * exist are the message and the browser. Here the terminal is the message.
 */
async function mintLink(customerId) {
  const raw = randomBytes(32).toString("hex");
  await client.query(
    `insert into sign_in_token
       (customer_id, token_hash, expires_at, requested_user_agent)
     values ($1, $2, now() + ($3 || ' minutes')::interval, 'seed-occasion')`,
    [customerId, createHash("sha256").update(raw).digest("hex"), String(SIGN_IN_TTL_MINUTES)]
  );
  return `${appUrl()}/login/${raw}`;
}

/**
 * Take it back out.
 *
 * The customer stays and her application is ARCHIVED, for the reason
 * seed-fixtures.mjs states at length: `quiz_response` is append-only and the
 * database means it. What is genuinely removed is everything that makes her a
 * member — the Revelle, her acceptance, her live links and her open sessions —
 * so that after this the printed link is dead and the portal refuses her.
 */
async function removeIt() {
  const counts = {};
  for (const [label, sql] of [
    [
      "revelle",
      `delete from revelle r using customer c
        where c.id = r.customer_id and c.email = $1`,
    ],
    [
      "sign_in_token",
      `delete from sign_in_token t using customer c
        where c.id = t.customer_id and c.email = $1`,
    ],
    [
      "login_session",
      `delete from login_session s using customer c
        where c.id = s.customer_id and c.email = $1`,
    ],
    [
      "membership",
      `update customer set accepted_at = null where email = $1`,
    ],
    [
      "quiz_response archived",
      `update quiz_response set status = 'archived'
        where status <> 'archived'
          and customer_id in (select id from customer where email = $1)`,
    ],
  ]) {
    const result = await client.query(sql, [MEMBER.email]);
    counts[label] = result.rowCount;
  }
  console.log("[seed-occasion] removed", counts);
  console.log(
    "[seed-occasion] the customer row and her application were kept and " +
      "archived — quiz_response is append-only and the database says so. She " +
      "is no longer a member and the link no longer works."
  );
}

try {
  await client.query("begin");

  if (remove) {
    await removeIt();
    await client.query("commit");
    await client.end();
    process.exit(0);
  }

  // ── the member ─────────────────────────────────────────────────────
  //
  // accepted_at is what makes an applicant a member (db/015). Set here
  // deliberately and reversed by --remove.
  const customer = await one(
    `insert into customer (email, name, accepted_at)
     values ($1, $2, now())
     on conflict (email) do update
       set name = excluded.name,
           accepted_at = coalesce(customer.accepted_at, excluded.accepted_at)
     returning id`,
    [MEMBER.email, MEMBER.name]
  );
  const customerId = customer.id;

  if (linkOnly) {
    const link = await mintLink(customerId);
    await client.query("commit");
    console.log(
      `\n[seed-occasion] a fresh link, good for ${SIGN_IN_TTL_MINUTES} minutes:\n\n` +
        `    ${link}\n`
    );
    await client.end();
    process.exit(0);
  }

  await client.query(
    `insert into taste_profile (customer_id) values ($1)
     on conflict (customer_id) do nothing`,
    [customerId]
  );

  // ── the destination ────────────────────────────────────────────────
  const world = await one(`select id, name, status from world where slug = $1`, [
    DESTINATION,
  ]);
  if (!world) {
    throw new Error(
      `${DESTINATION} is not in this database. Run npm run seed:destinations first.`
    );
  }

  // The voice in force, bound to every Revelle issued under it. A delivered
  // Revelle keeps the words it was issued with even when the destination is
  // revised later — db/004's whole argument — so the version is recorded
  // rather than looked up at read time.
  const voice = await one(
    `select id from world_voice where world_id = $1 and status = 'published'`,
    [world.id]
  );

  // ── the two Revelles ───────────────────────────────────────────────
  const built = [];
  let anyMissing = false;

  for (const spec of REVELLES) {
    // Her application. Append-only: inserted once and never rewritten. The
    // answers are the shape the real submission path writes (see
    // src/app/api/quiz/route.ts), so the desk shows a readable application
    // beside the Revelle rather than a husk.
    await client.query(
      `insert into quiz_response
         (customer_id, answers, quiz_version, submission_key, occasion,
          environment, taste_directions, group_fun, anti_preferences,
          affinities, secret, guest_count_band, spend_per_person, music_service)
       values ($1, $2::jsonb, '2026-08-b', $3, $4, $5, $6, $7, $8, $9, $10,
               $11, $12, 'spotify')
       on conflict (submission_key) do nothing`,
      [
        customerId,
        JSON.stringify({
          occasion: spec.occasion,
          environment: spec.answers.environment,
          taste_directions: spec.answers.tasteDirections,
          group_fun: spec.answers.groupFun,
          anti_preferences: spec.answers.antiPreferences,
          affinities: spec.answers.affinities,
          guest_count_band: spec.answers.guests,
          spend_per_person: spec.answers.spend,
          music_service: "spotify",
          email: MEMBER.email,
        }),
        spec.key,
        spec.occasion,
        spec.answers.environment,
        spec.answers.tasteDirections,
        spec.answers.groupFun,
        spec.answers.antiPreferences,
        spec.answers.affinities,
        spec.secret,
        spec.answers.guests,
        spec.answers.spend,
      ]
    );
    const response = await one(
      `select id, status from quiz_response where submission_key = $1`,
      [spec.key]
    );
    // --remove archives it; a rebuild puts it back to work.
    if (response.status === "archived") {
      await client.query(`update quiz_response set status = 'new' where id = $1`, [
        response.id,
      ]);
    }

    // The projection the real submission path performs. Idempotent by its own
    // definition — db/002 supersedes rather than duplicating.
    await client.query(`select record_quiz_signals($1)`, [response.id]);

    // Dropped and rebuilt rather than updated in place. There is one Revelle
    // per quiz response (db/001) and its assemblage is checked for uniqueness
    // on the way in, so rebuilding is both the simplest idempotence and the
    // only one that cannot collide with the row it is replacing.
    await client.query(`delete from revelle where quiz_response_id = $1`, [
      response.id,
    ]);

    const revelle = await one(
      `insert into revelle
         (customer_id, quiz_response_id, world_id, voice_id, dedication,
          event_date, guest_count, status)
       values ($1, $2, $3, $4, $5, $6, $7, 'draft')
       returning id`,
      [
        customerId,
        response.id,
        world.id,
        voice ? voice.id : null,
        spec.dedication,
        spec.date,
        spec.guests,
      ]
    );

    const placed = [];
    const missing = [];
    let position = 0;

    for (const piece of spec.pieces) {
      const row = await one(`select id, name from ${piece.pool} where slug = $1`, [
        piece.slug,
      ]);
      if (!row) {
        missing.push(piece);
        continue;
      }
      position += 1;
      await client.query(
        `insert into revelle_${piece.pool}
           (revelle_id, ${piece.pool}_id, slot, slot_code, position)
         values ($1, $2, $3::section_kind, $4, $5)
         on conflict do nothing`,
        [revelle.id, row.id, piece.section, piece.slot, position]
      );
      placed.push({ ...piece, name: row.name });
    }

    if (placed.length === 0) {
      throw new Error(
        `Nothing could be placed in ${spec.key}. Run npm run seed:destinations, ` +
          `npm run seed:menus, npm run seed:games and npm run seed:fixtures first.`
      );
    }

    await client.query(
      `update revelle set status = 'delivered', delivered_at = now() where id = $1`,
      [revelle.id]
    );

    if (missing.length > 0) anyMissing = true;
    built.push({ spec, id: revelle.id, placed, missing });
  }

  const link = await mintLink(customerId);
  await client.query("commit");

  // ── what happened ──────────────────────────────────────────────────
  console.log(
    `\n[seed-occasion] ${world.name} — the destination is '${world.status}' ` +
      `and was not touched.`
  );

  for (const { spec, placed, missing } of built) {
    console.log(
      `\n  ${spec.occasion}, ${spec.guests} guests, ${spec.date}`
    );
    for (const piece of placed) {
      console.log(
        `    placed  ${piece.slot.padEnd(14)} ` +
          `${piece.authored ? "authored" : "FIXTURE "}  ${piece.name}`
      );
    }
    for (const piece of missing) {
      console.log(
        `    absent  ${piece.slot.padEnd(14)}           ` +
          `${piece.slug} is not in this database`
      );
    }
  }

  if (anyMissing) {
    console.log(
      `\n  Anything absent renders as NOTHING — no heading, no placeholder, no\n` +
        `  explanation. That is the rule, not a gap in the seed. If you meant to\n` +
        `  see those, run npm run seed:fixtures and this again.`
    );
  }

  console.log(
    `\n[seed-occasion] Open this, then an occasion. Good for ` +
      `${SIGN_IN_TTL_MINUTES} minutes:\n\n    ${link}\n\n` +
      `  Another one:  npm run seed:occasion -- --link\n` +
      `  Take it out:  npm run seed:occasion -- --remove\n`
  );
} catch (err) {
  await client.query("rollback");
  console.error(`\n[seed-occasion] FAILED: ${err.message}`);
  process.exitCode = 1;
} finally {
  await client.end();
}
