#!/usr/bin/env node
/**
 * Is every published destination described in the SHARED vocabulary, richly
 * enough to join a host's answers against?
 *
 *   npm run check:coverage
 *   npm run check:coverage -- --all      (drafts and retired ones too)
 *
 * ─────────────────────────────────────────────────────────────────────
 * WHAT THIS CATCHES, AND WHY IT IS WORTH A SCRIPT
 *
 * Stage 2 of the selection engine is a join between what she answered and how a
 * destination is tagged. That join is exactly as good as the tagging, and there
 * are two ways for the tagging to be bad that nothing else notices — because
 * nothing errors, nothing is null, and every number that comes out looks like a
 * number.
 *
 *   THIN      three facets is not a description, it is a label. The curator
 *             knows what the destination is; the shared vocabulary does not, so
 *             every customer scores about the same against it. That is mush
 *             wearing a score.
 *   LOPSIDED  one facet holding most of the weight makes it a single-facet
 *             destination. It wins for the women who tapped that one thing and
 *             is invisible to everyone else, which reads as a scoring bug and
 *             is a tagging one.
 *   NARROW    everything on one axis. A destination tagged only in
 *             taste_direction has nothing to say about how her people behave,
 *             so the group_fun and affinity halves of her vector fall straight
 *             through it.
 *
 * Right now the founder tags every destination personally, so this cannot
 * drift. The moment anyone else tags one, this is the review — which is why it
 * exists before it is needed rather than after.
 *
 * Exits non-zero when a PUBLISHED destination trips a flag, so it can go in
 * CI beside scripts/check-facets.mjs. Drafts are reported and never fail the
 * run: a draft being half-tagged is what a draft is.
 */
import pg from "pg";

function needsSsl(url) {
  if (/sslmode=disable/.test(url)) return false;
  return !/@(localhost|127\.0\.0\.1|\[::1\])/.test(url);
}

const all = process.argv.includes("--all");

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("[check:coverage] DATABASE_URL is not set.");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: url,
  ssl: needsSsl(url) ? { rejectUnauthorized: false } : undefined,
  application_name: "revelle-check-coverage",
});
await client.connect();

try {
  const { rows } = await client.query(
    `select * from destination_facet_coverage
      ${all ? "" : "where status = 'published'"}
      order by status, thin desc, lopsided desc, facet_count`
  );

  if (rows.length === 0) {
    console.log(
      "[check:coverage] No destinations to check." +
        (all ? "" : " Try --all — there may be drafts.")
    );
    process.exit(0);
  }

  console.log(
    "  " +
      "destination".padEnd(28) +
      "status".padEnd(11) +
      "facets".padStart(7) +
      "dims".padStart(6) +
      "top".padStart(7) +
      "conc".padStart(7) +
      "   flags"
  );
  console.log("  " + "─".repeat(80));

  let failures = 0;

  for (const row of rows) {
    const flags = [
      row.thin ? "THIN" : null,
      row.lopsided ? "LOPSIDED" : null,
      row.narrow ? "NARROW" : null,
    ].filter(Boolean);

    if (flags.length > 0 && row.status === "published") failures += 1;

    console.log(
      "  " +
        String(row.name).slice(0, 27).padEnd(28) +
        String(row.status).padEnd(11) +
        String(row.facet_count).padStart(7) +
        String(row.dimension_count).padStart(6) +
        Number(row.top_facet_share).toFixed(2).padStart(7) +
        Number(row.concentration).toFixed(2).padStart(7) +
        "   " +
        (flags.join(" ") || "ok")
    );
  }

  console.log("");
  console.log(
    "  THIN      fewer than 6 facets. Not a description, a label.\n" +
      "  LOPSIDED  one facet holds more than half the weight.\n" +
      "  NARROW    fewer than 3 dimensions — one axis only.\n" +
      "  conc      Herfindahl over the weights. 1.00 is one facet; 1/n is even."
  );

  if (failures > 0) {
    console.error(
      `\n[check:coverage] ${failures} PUBLISHED destination${failures === 1 ? "" : "s"} ` +
        `flagged. Tag them further, or argue with the thresholds in db/009 — ` +
        `but argue, do not ignore.`
    );
    process.exitCode = 1;
  } else {
    console.log("[check:coverage] every published destination is described.");
  }
} finally {
  await client.end();
}
