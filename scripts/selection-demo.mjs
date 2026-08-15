#!/usr/bin/env node
/**
 * Run the selection engine against the fixture applications and print what it
 * decided, in the shape a curator would read it.
 *
 *   npm run selection:demo
 *   npm run selection:demo -- nora
 *   npm run selection:demo -- --seed 12345
 *
 * ─────────────────────────────────────────────────────────────────────
 * WHY THIS IS A SCRIPT AND NOT A TEST
 *
 * The unit tests in src/lib/selection/*.test.ts assert on the arithmetic —
 * that the dither leaves the top of a ranking roughly alone, that a dealbreaker
 * filters rather than penalises, that a collision produces a swap and not a
 * restart. They run without a database and they are the regression net.
 *
 * This is the other thing: it reads. The engine's output is prose written for a
 * human, and the only way to know whether that prose is any good is to look at
 * it against real rows. Run it after changing anything in src/lib/selection/
 * and read the explanations, not just the exit code.
 *
 * Needs DATABASE_URL and a database seeded with scripts/seed-fixtures.mjs.
 * Writes nothing, except in the --collision section, which says so.
 */
import pg from "pg";

import {
  selectForApplication,
  loadSelectionInput,
  runSelection,
} from "../src/lib/selection/index.ts";

function needsSsl(url) {
  if (/sslmode=disable/.test(url)) return false;
  return !/@(localhost|127\.0\.0\.1|\[::1\])/.test(url);
}

const args = process.argv.slice(2);
const only = args.find((a) => !a.startsWith("--"));
const seedArg = args.includes("--seed")
  ? Number(args[args.indexOf("--seed") + 1])
  : null;
const doCollision = args.includes("--collision");

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("[selection-demo] DATABASE_URL is not set.");
  process.exit(1);
}

const db = new pg.Client({
  connectionString: url,
  ssl: needsSsl(url) ? { rejectUnauthorized: false } : undefined,
  application_name: "revelle-selection-demo",
});
await db.connect();

const money = (cents) =>
  `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

function rule(char = "─", width = 78) {
  return char.repeat(width);
}

function heading(text) {
  console.log(`\n${rule("━")}\n${text}\n${rule("━")}`);
}

function printCandidate(candidate) {
  const e = candidate.explanation;
  console.log(`\n  ${rule("·", 74)}`);
  console.log(
    `  CANDIDATE ${candidate.rank}   ${candidate.destination.name}` +
      `   score ${candidate.destinationScore.toFixed(3)}` +
      `   merit rank ${candidate.destinationRank} → shown ${candidate.ditheredRank}` +
      (candidate.lowConfidence ? `   ⚑ LOW CONFIDENCE` : "")
  );
  console.log(`  ${rule("·", 74)}`);
  console.log(`  ${e.headline}`);

  console.log(`\n  THE ASSEMBLAGE`);
  for (const pick of candidate.picks) {
    const cost =
      pick.lineCost === null
        ? "unpriced"
        : pick.slot.quantity > 1
          ? `${money(pick.unitCost)} × ${pick.slot.quantity} = ${money(pick.lineCost)}`
          : money(pick.lineCost);
    console.log(
      `    ${pick.slot.label.padEnd(26)} ${pick.ingredient.name}`
    );
    console.log(
      `    ${"".padEnd(26)} ${pick.pool ?? pick.ingredient.pool} · ${cost} · ` +
        `match ${pick.facetMatch.toFixed(2)} affinity ${pick.affinity.toFixed(2)} ` +
        `issuance −${pick.issuancePenalty.toFixed(2)} similarity −${pick.similarityPenalty.toFixed(2)} ` +
        `= ${pick.score.toFixed(2)}` +
        (pick.forced ? "  [FORCED — only candidate]" : ` (${pick.alternatives} alternative${pick.alternatives === 1 ? "" : "s"})`)
    );
  }

  const section = (title, lines) => {
    if (!lines || lines.length === 0) return;
    console.log(`\n  ${title}`);
    for (const line of lines) console.log(`    · ${line}`);
  };

  section("WHY THIS DESTINATION", e.destination);
  section("WHAT ELIMINATED THE OTHERS", e.eliminated);
  section("WHAT THE OCCASION AND THE POOLS DECIDED", e.forced);
  section("WHAT MOVED, AND WHY", e.swapped);
  section("WHAT WAS DROPPED", e.dropped);
  section("THE MONEY", e.budget);
  section("CATALOGUE GAPS", e.gaps);
  // Kept apart from the gaps above, and the separation is the point: a gap is
  // work for the house, an exclusion is a fact about her evening that nobody
  // can act on. See db/014.
  section("SLOTS SHE DOES NOT HAVE", e.excluded);
  section("FLAGGED FOR REVIEW", e.confidence);

  if (candidate.blocked) {
    console.log(`\n  DO NOT DELIVER`);
    console.log(`    · ${candidate.blocked}`);
  }

  if (e.secret) {
    console.log(`\n  IN HER WORDS`);
    console.log(`    "${e.secret}"`);
  }
  console.log(`\n  fingerprint ${candidate.fingerprint ?? "(none)"}`);
}

async function applications() {
  const { rows } = await db.query(
    `select qr.id, c.name, qr.occasion, qr.guest_count_band, qr.spend_per_person
       from quiz_response qr join customer c on c.id = qr.customer_id
      where c.email like 'fixture-%'
      order by c.email`
  );
  return rows;
}

try {
  const apps = await applications();
  if (apps.length === 0) {
    console.error(
      "[selection-demo] No fixture applications. Run npm run seed:fixtures."
    );
    process.exit(1);
  }

  for (const app of apps) {
    const key = app.name.split(" ")[0].toLowerCase();
    if (only && key !== only) continue;

    heading(
      `${app.name}  ·  ${app.occasion}  ·  ${app.guest_count_band} guests  ·  ` +
        `${app.spend_per_person} a head`
    );

    const result = await selectForApplication(db, app.id, {
      seed: seedArg ?? undefined,
    });

    console.log(`seed ${result.seed}`);
    console.log(
      `preference vector: ${Object.keys(result.vector.weights).length} facets, ` +
        `blend stated ${result.vector.blend.stated.toFixed(2)} / ` +
        `history ${result.vector.blend.history.toFixed(2)} / ` +
        `cohort ${result.vector.blend.cohort.toFixed(2)} ` +
        `(${result.vector.evidenceCount} signals of her own)`
    );
    console.log(
      `dealbreakers: ${
        result.vector.dealbreakers
          .map((id) => result.vector.terms[id]?.facet.label ?? id)
          .join(", ") || "none"
      }`
    );

    if (result.impasse) {
      console.log(`\n  IMPASSE: ${result.impasse}`);
      continue;
    }

    for (const candidate of result.candidates) printCandidate(candidate);

    if (result.gaps.length > 0) {
      console.log(`\n  CATALOGUE GAPS ACROSS ALL CANDIDATES`);
      for (const gap of result.gaps) {
        console.log(`    · [${gap.required ? "REQUIRED" : "optional"}] ${gap.detail}`);
      }
    }
  }

  // ── the dither, twice ──────────────────────────────────────────────
  if (!only) {
    const nora = apps.find((a) => a.name.startsWith("Nora"));
    heading("THE SAME APPLICATION, TWICE — is the shortlist dithered?");
    const input = await loadSelectionInput(db, nora.id);
    const firstShown = new Map();
    for (let run = 1; run <= 12; run += 1) {
      const result = runSelection(input, { seed: 1000 + run });
      const merits = result.candidates.map((c) => c.destinationRank);
      firstShown.set(merits[0], (firstShown.get(merits[0]) ?? 0) + 1);
      console.log(
        `  seed ${result.seed}: ` +
          result.candidates
            .map((c) => `${c.destination.name} [merit ${c.destinationRank}]`)
            .join("  →  ")
      );
    }
    console.log(
      `\n  Which merit rank came first, over 12 seeds: ` +
        [...firstShown.entries()]
          .sort((a, b) => a[0] - b[0])
          .map(([rank, n]) => `#${rank} × ${n}`)
          .join(", ")
    );
    console.log(
      `  ε = 2. The top stays near the top and deeper candidates surface — ` +
        `which is the intended shape, not a bug.`
    );
  }

  // ── the collision ──────────────────────────────────────────────────
  if (doCollision) {
    const nora = apps.find((a) => a.name.startsWith("Nora"));
    heading("A COLLISION, AND THE LOCAL BACKTRACK  (this section WRITES)");

    const input = await loadSelectionInput(db, nora.id);
    const before = runSelection(input, { seed: 77 });
    const first = before.candidates[0];

    console.log(
      `  Candidate 1 at seed 77 is ${first.destination.name} with ` +
        `${first.picks.length} ingredients.`
    );
    console.log(`  fingerprint ${first.fingerprint}`);

    // ── the mechanism, isolated ──────────────────────────────────────
    //
    // Delivering the assemblage for real (below) also marks every ingredient in
    // it as issued, which moves every score and usually produces a different
    // assemblage on its own — the issuance penalty doing its job. That is worth
    // seeing, but it means the real delivery does not isolate the BACKTRACK.
    //
    // So first: take the same snapshot, mark only the FINGERPRINT as already
    // issued, and run again with the same seed. Every score is identical, the
    // search reaches the same set, and the only thing that can save it is the
    // local swap.
    console.log(
      `\n  ── the backtrack alone (same snapshot, same seed, fingerprint marked issued)`
    );
    const injected = {
      ...input,
      catalogue: {
        ...input.catalogue,
        issuedFingerprints: [
          ...input.catalogue.issuedFingerprints,
          first.fingerprint,
        ],
      },
    };
    const backtracked = runSelection(injected, { seed: 77 }).candidates[0];
    console.log(
      `  Candidate 1 is ${backtracked.destination.name}, fingerprint ${backtracked.fingerprint}`
    );
    console.log(
      `  Same destination: ${backtracked.destination.id === first.destination.id ? "yes" : "no"}. ` +
        `Collided: ${backtracked.fingerprint === first.fingerprint ? "YES — the backtrack failed" : "no"}`
    );
    for (const swap of backtracked.swaps) {
      console.log(`    · ${swap.slotLabel}: ${swap.from} → ${swap.to}`);
      console.log(`      ${swap.reason}`);
    }
    const moved = backtracked.picks.filter(
      (p, i) => first.picks[i]?.ingredient.id !== p.ingredient.id
    );
    console.log(
      `    ${first.picks.length} ingredients before, ${backtracked.picks.length} after; ` +
        `${moved.length} position${moved.length === 1 ? " differs" : "s differ"}. ` +
        `The search was NOT restarted.`
    );

    console.log(`\n  ── and now a real delivery, which also moves the issuance`);

    // Persist it as a DELIVERED Revelle for somebody else, so the assemblage is
    // genuinely spent. This is the caller's job, not the engine's — the engine
    // does not write, which is why this code is here and not in src/lib.
    await db.query("begin");
    const { rows: other } = await db.query(
      `insert into customer (email, name)
       values ('fixture-collision@example.invalid', 'Collision (fixture)')
       on conflict (email) do update set name = excluded.name returning id`
    );
    const customerId = other[0].id;
    await db.query(
      `insert into taste_profile (customer_id) values ($1)
       on conflict (customer_id) do nothing`,
      [customerId]
    );
    await db.query(
      `delete from revelle where customer_id = $1`, [customerId]
    );
    await db.query(
      `insert into quiz_response
         (customer_id, answers, quiz_version, submission_key, occasion,
          environment, taste_directions, group_fun, anti_preferences,
          affinities, guest_count_band, spend_per_person)
       values ($1, '{}'::jsonb, '2026-08-b', 'fixture-collision-v1',
               'dinner_party', 'my_home', array['old_world_riviera'],
               array['long_dinner'], array['novelty'], array['beauty'],
               'from_9_to_12', 'from_150_to_300')
       on conflict (submission_key) do nothing`,
      [customerId]
    );
    const { rows: qr } = await db.query(
      `select id from quiz_response where submission_key = 'fixture-collision-v1'`
    );
    const { rows: revelle } = await db.query(
      `insert into revelle (customer_id, quiz_response_id, world_id, status)
       values ($1, $2, $3, 'draft') returning id`,
      [customerId, qr[0].id, first.destination.id]
    );
    const revelleId = revelle[0].id;

    for (const pick of first.picks) {
      const table = `revelle_${pick.ingredient.pool}`;
      const column = `${pick.ingredient.pool}_id`;
      await db.query(
        `insert into ${table} (revelle_id, ${column}, slot, slot_code)
         values ($1, $2, $3, $4) on conflict do nothing`,
        [revelleId, pick.ingredient.id, pick.slot.section, pick.slot.slotCode]
      );
    }
    await db.query(
      `update revelle set status = 'delivered', delivered_at = now() where id = $1`,
      [revelleId]
    );
    const { rows: stored } = await db.query(
      `select assemblage_fingerprint from revelle where id = $1`,
      [revelleId]
    );
    await db.query("commit");

    console.log(
      `  Delivered it to somebody else. PostgreSQL's own digest of the same ` +
        `assemblage:\n    ${stored[0].assemblage_fingerprint}`
    );

    const after = await selectForApplication(db, nora.id, { seed: 77 });
    const repeat = after.candidates[0];
    console.log(
      `\n  Re-run, same seed, same catalogue plus one delivery:\n` +
        `  Candidate 1 is ${repeat.destination.name}, fingerprint ${repeat.fingerprint}`
    );
    console.log(
      `  Collided: ${repeat.fingerprint === first.fingerprint ? "YES — the backtrack failed" : "no"}`
    );
    if (repeat.swaps.length > 0) {
      console.log(`\n  THE BACKTRACK`);
      for (const swap of repeat.swaps) {
        console.log(`    · ${swap.slotLabel}: ${swap.from} → ${swap.to}`);
        console.log(`      ${swap.reason}`);
      }
      const changed = repeat.picks.filter(
        (p, i) => first.picks[i]?.ingredient.id !== p.ingredient.id
      );
      console.log(
        `    ${first.picks.length} ingredients before, ${repeat.picks.length} after; ` +
          `${changed.length} position${changed.length === 1 ? "" : "s"} differ. ` +
          `The search was NOT restarted.`
      );
    }
  }

  console.log("");
} finally {
  await db.end();
}
