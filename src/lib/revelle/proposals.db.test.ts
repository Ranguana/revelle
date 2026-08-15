/**
 * The join between the engine and the queue, against a real Postgres.
 *
 *   createdb revelle_proposals && npm run migrate      # against that database
 *   REVELLE_TEST_DATABASE_URL=postgres://…/revelle_proposals npm test
 *
 * SKIPPED unless REVELLE_TEST_DATABASE_URL is set, so `npm test` stays a
 * no-dependency run — the same arrangement src/lib/jobs/queue.db.test.ts and
 * src/lib/login.db.test.ts use, and a separate variable from DATABASE_URL for
 * the same reason: these tests write and delete rows, and pointing them at
 * anything that matters would be a bad afternoon.
 *
 * ── WHY THESE PARTICULAR TESTS ───────────────────────────────────────
 *
 * Everything here that can go wrong is a claim made by a migration, and none of
 * it is observable from a unit test:
 *
 *   1. a run that happens twice writes one set of proposals (db/008's
 *      at-least-once, answered by the seed derivation and the unique key)
 *   2. a destination with a look and no voice is proposed and cannot be
 *      approved — the decision argued in src/lib/revelle/generate.ts
 *   3. approval materialises a `revelle` and its ingredients, and the losing
 *      candidates stop being options
 *   4. delivery arms db/003's ratchet, and after it nothing can re-roll
 *   5. what she can see carries no trace of what the catalogue could not supply
 *
 * The fixtures are built here rather than seeded, so the file is hermetic and
 * says in one place exactly what a proposal needs to exist.
 */
import assert from "node:assert/strict";
import test, { after, before } from "node:test";

import pg from "pg";

import { noEmphasis } from "../selection/emphasis.ts";
import { memberRevelle } from "../selection/member.ts";
import type {
  Candidate,
  Ingredient,
  Pick,
  SelectionResult,
  UnitSlot,
} from "../selection/types.ts";

import {
  approve,
  deliver,
  discard,
  persistRun,
  readProposals,
  reject,
  seedForJob,
  type Queryable,
} from "./proposals.ts";

const URL = process.env.REVELLE_TEST_DATABASE_URL;
const skip = URL ? false : "set REVELLE_TEST_DATABASE_URL to run these";

let pool: pg.Pool;
let db: Queryable;

/** Everything one run needs. Rebuilt per test so nothing leaks between them. */
type Fixture = {
  customerId: string;
  quizResponseId: string;
  staffId: string;
  voicedWorldId: string;
  silentWorldId: string;
  productId: string;
};

before(async () => {
  if (!URL) return;
  pool = new pg.Pool({ connectionString: URL, max: 6 });
  db = pool as unknown as Queryable;
});

after(async () => {
  if (!URL) return;
  await pool.end();
});

/**
 * NOTHING IS TRUNCATED BETWEEN TESTS, and that is not laziness.
 *
 * db/001 makes `quiz_response` append-only with a trigger that refuses a
 * DELETE outright — including a cascaded one — because "editing history would
 * corrupt it". A test that cleaned up after itself would have to work around
 * the single most important guarantee in the schema, which is a strange thing
 * for a test of that schema to do.
 *
 * So every test builds its OWN customer, application, destinations and product
 * under a unique stamp and shares nothing. Rows accumulate in the throwaway
 * database this file already refuses to run without, which is the correct
 * place for them to accumulate.
 */

/* ── the seed ─────────────────────────────────────────────────────── */

test("the seed is a function of the job id, and a uint32", () => {
  const id = "3f2b6a1c-0000-4000-8000-000000000001";
  assert.equal(seedForJob(id), seedForJob(id));
  assert.notEqual(seedForJob(id), seedForJob("3f2b6a1c-0000-4000-8000-000000000002"));
  const seed = seedForJob(id);
  assert.ok(Number.isInteger(seed) && seed >= 0 && seed <= 0xffffffff);
});

/* ── the database-backed claims ───────────────────────────────────── */

test("a run that happens twice leaves one set of proposals", { skip }, async () => {
  const fx = await fixture();
  const jobId = await makeJob(fx.quizResponseId);
  const result = runOf(fx, [fx.voicedWorldId, fx.silentWorldId]);

  const first = await persistRun(db, {
    jobId,
    quizResponseId: fx.quizResponseId,
    result,
  });
  assert.equal(first.created, 2);

  // The lease expired and another runner took the row. It recomputes the
  // identical candidates — same job id, same seed — and writes nothing.
  const second = await persistRun(db, {
    jobId,
    quizResponseId: fx.quizResponseId,
    result,
  });
  assert.equal(second.created, 0);

  const proposals = await readProposals(db, fx.quizResponseId);
  assert.equal(proposals.length, 2);
  assert.equal(
    proposals.reduce((n, p) => n + p.picks.length, 0),
    2,
    "the second attempt must not have doubled the picks either"
  );
});

test("a later run supersedes the earlier one", { skip }, async () => {
  const fx = await fixture();
  const jobA = await makeJob(fx.quizResponseId);
  const jobB = await makeJob(fx.quizResponseId);

  await persistRun(db, {
    jobId: jobA,
    quizResponseId: fx.quizResponseId,
    result: runOf(fx, [fx.voicedWorldId]),
  });
  await persistRun(db, {
    jobId: jobB,
    quizResponseId: fx.quizResponseId,
    result: runOf(fx, [fx.silentWorldId]),
  });

  const proposals = await readProposals(db, fx.quizResponseId);
  const live = proposals.filter((p) => p.status === "proposed");
  assert.equal(live.length, 1);
  assert.equal(live[0].jobId, jobB);
  assert.equal(
    proposals.find((p) => p.jobId === jobA)?.status,
    "superseded"
  );
});

test("a destination with no voice is proposed and cannot be approved", { skip }, async () => {
  const fx = await fixture();
  const jobId = await makeJob(fx.quizResponseId);
  await persistRun(db, {
    jobId,
    quizResponseId: fx.quizResponseId,
    result: runOf(fx, [fx.silentWorldId, fx.voicedWorldId]),
  });

  const proposals = await readProposals(db, fx.quizResponseId);
  const silent = proposals.find((p) => p.worldId === fx.silentWorldId);
  assert.ok(silent, "generation must NOT filter an unvoiced destination out");
  assert.equal(silent.voiceId, null);

  const refusal = await inTransaction((tx) =>
    approve(tx, { proposalId: silent.id, staffId: fx.staffId })
  );
  assert.equal(refusal.ok, false);
  assert.match(refusal.ok === false ? refusal.reason : "", /no published voice/);

  // And nothing was written on the way to refusing.
  const { rows } = await pool.query(
    `select count(*)::int as n from revelle where quiz_response_id = $1`,
    [fx.quizResponseId]
  );
  assert.equal(rows[0].n, 0);
});

test("approval makes a Revelle and the alternatives stop being options", { skip }, async () => {
  const fx = await fixture();
  const jobId = await makeJob(fx.quizResponseId);
  await persistRun(db, {
    jobId,
    quizResponseId: fx.quizResponseId,
    result: runOf(fx, [fx.voicedWorldId, fx.silentWorldId]),
  });

  const before = await readProposals(db, fx.quizResponseId);
  const chosen = before.find((p) => p.worldId === fx.voicedWorldId);
  assert.ok(chosen);

  const outcome = await inTransaction((tx) =>
    approve(tx, { proposalId: chosen.id, staffId: fx.staffId })
  );
  assert.equal(outcome.ok, true);

  const after = await readProposals(db, fx.quizResponseId);
  assert.equal(after.find((p) => p.id === chosen.id)?.status, "approved");
  assert.equal(
    after.find((p) => p.worldId === fx.silentWorldId)?.status,
    "superseded"
  );

  const { rows } = await pool.query(
    `select r.id, r.status::text as status, r.first_delivered_at,
            r.assemblage_fingerprint,
            (select count(*)::int from revelle_product j where j.revelle_id = r.id) as products
       from revelle r where r.quiz_response_id = $1`,
    [fx.quizResponseId]
  );
  assert.equal(rows.length, 1);
  assert.equal(rows[0].status, "preview");
  assert.equal(rows[0].first_delivered_at, null, "approval is not delivery");
  assert.equal(rows[0].products, 1);
  assert.ok(
    String(rows[0].assemblage_fingerprint).startsWith("a1:"),
    "db/002's trigger stamps the digest as the ingredients land"
  );

  // A second approval of the same proposal cannot make a second Revelle.
  const again = await inTransaction((tx) =>
    approve(tx, { proposalId: chosen.id, staffId: fx.staffId })
  );
  assert.equal(again.ok, false);
});

test("delivery arms the ratchet, and after it nothing re-rolls", { skip }, async () => {
  const fx = await fixture();
  const jobId = await makeJob(fx.quizResponseId);
  await persistRun(db, {
    jobId,
    quizResponseId: fx.quizResponseId,
    result: runOf(fx, [fx.voicedWorldId]),
  });
  const [proposal] = await readProposals(db, fx.quizResponseId);

  const approved = await inTransaction((tx) =>
    approve(tx, { proposalId: proposal.id, staffId: fx.staffId })
  );
  assert.equal(approved.ok, true);
  const revelleId = approved.ok ? approved.revelleId : "";

  // Before delivery a preview is disposable — db/003 is explicit about it.
  const undone = await inTransaction((tx) =>
    discard(tx, { quizResponseId: fx.quizResponseId, staffId: fx.staffId })
  );
  assert.equal(undone.ok, true);
  assert.equal(
    (await readProposals(db, fx.quizResponseId))[0].status,
    "proposed",
    "discarding must put the candidate back on the table"
  );

  // Approve again, then deliver.
  const readopted = await inTransaction((tx) =>
    approve(tx, { proposalId: proposal.id, staffId: fx.staffId })
  );
  assert.equal(readopted.ok, true);
  const finalId = readopted.ok ? readopted.revelleId : "";
  assert.notEqual(finalId, revelleId);

  const delivered = await inTransaction((tx) =>
    deliver(tx, { revelleId: finalId })
  );
  assert.equal(delivered.ok, true);

  const { rows } = await pool.query(
    `select first_delivered_at, voice_id from revelle where id = $1`,
    [finalId]
  );
  assert.notEqual(rows[0].first_delivered_at, null, "the ratchet is down");
  assert.notEqual(rows[0].voice_id, null, "db/004 pinned the voice it was written in");

  // THE RATCHET. Nothing at the desk can take it back.
  const refused = await inTransaction((tx) =>
    discard(tx, { quizResponseId: fx.quizResponseId, staffId: fx.staffId })
  );
  assert.equal(refused.ok, false);
  assert.match(refused.ok === false ? refused.reason : "", /no reissue/);
});

test("rejecting one leaves its siblings approvable", { skip }, async () => {
  const fx = await fixture();
  const jobId = await makeJob(fx.quizResponseId);
  await persistRun(db, {
    jobId,
    quizResponseId: fx.quizResponseId,
    result: runOf(fx, [fx.voicedWorldId, fx.silentWorldId]),
  });

  const before = await readProposals(db, fx.quizResponseId);
  const first = before[0];
  const outcome = await inTransaction((tx) =>
    reject(tx, {
      proposalId: first.id,
      staffId: fx.staffId,
      note: "too loud for these people",
    })
  );
  assert.equal(outcome.ok, true);

  const after = await readProposals(db, fx.quizResponseId);
  assert.equal(after.find((p) => p.id === first.id)?.status, "rejected");
  assert.equal(
    after.find((p) => p.id === first.id)?.decisionNote,
    "too loud for these people"
  );
  assert.equal(
    after.filter((p) => p.status === "proposed").length,
    1,
    "the alternative is untouched"
  );
});

test("a gap reaches the proposal and never the member", { skip }, async () => {
  const fx = await fixture();
  const jobId = await makeJob(fx.quizResponseId);
  const result = runOf(fx, [fx.voicedWorldId]);
  await persistRun(db, { jobId, quizResponseId: fx.quizResponseId, result });

  const [proposal] = await readProposals(db, fx.quizResponseId);

  // The house side has it, in the engine's own words.
  assert.equal(proposal.gaps.length, 1);
  assert.equal(proposal.gaps[0].slotCode, "the_menu");
  assert.equal(proposal.excluded.length, 1);
  assert.equal(proposal.excluded[0].slotCode, "game");

  // And the member's side structurally cannot. `memberRevelle()` is the only
  // way across (src/lib/selection/member.ts); this asserts the OUTPUT as well
  // as the type, because a type is a promise about code and this is a promise
  // about a page.
  const view = memberRevelle(result.candidates[0]);
  const text = JSON.stringify(view);
  for (const forbidden of [
    "menu",
    "gap",
    "unfilled",
    "could not",
    "game",
    "excluded",
    "explanation",
  ]) {
    assert.ok(
      !text.toLowerCase().includes(forbidden),
      `the member's view leaked "${forbidden}": ${text}`
    );
  }
  assert.equal(view.pieces.length, 1);
  assert.equal(view.pieces[0].heading, "The table");
});

/* ── fixtures ─────────────────────────────────────────────────────── */

async function fixture(): Promise<Fixture> {
  const stamp = `dbtest-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const { rows: customer } = await pool.query<{ id: string }>(
    `insert into customer (email) values ($1) returning id`,
    [`dbtest-${stamp}@example.invalid`]
  );
  const { rows: staff } = await pool.query<{ id: string }>(
    `insert into staff (email, name) values ($1, 'Test curator') returning id`,
    [`dbtest-${stamp}@example.invalid`]
  );
  const { rows: response } = await pool.query<{ id: string }>(
    `insert into quiz_response
       (customer_id, answers, quiz_version, submission_key, occasion,
        environment, taste_directions, spend_per_person, guest_count_band)
     values ($1, '{}'::jsonb, 'db-test', $2, 'dinner_party', 'my_home',
             array['warm_and_low'], 'from_75_to_150', 'from_6_to_8')
     returning id`,
    [customer[0].id, stamp]
  );

  const voiced = await makeWorld(`${stamp}-voiced`, true);
  const silent = await makeWorld(`${stamp}-silent`, false);

  const { rows: product } = await pool.query<{ id: string }>(
    `insert into product (slug, name, description, price_cents, status)
     values ($1, 'A candelabra', 'One, and nobody mentions it.', 12000, 'active')
     returning id`,
    [`dbtest-${stamp}-product`]
  );

  return {
    customerId: customer[0].id,
    quizResponseId: response[0].id,
    staffId: staff[0].id,
    voicedWorldId: voiced,
    silentWorldId: silent,
    productId: product[0].id,
  };
}

/**
 * A published destination, with or without a voice.
 *
 * The one without is the case the whole unvoiced-destination decision turns on,
 * and db/004 says it is legal: "a destination may have a look and no voice
 * yet". Eleven of twelve in the real catalogue are like this today.
 */
async function makeWorld(slug: string, voiced: boolean): Promise<string> {
  const { rows } = await pool.query<{ id: string }>(
    `insert into world (slug, name, tagline, status, published_at)
     values ($1, $2, 'A tagline.', 'published', now())
     returning id`,
    [`dbtest-${slug}`, slug.toUpperCase()]
  );
  const id = rows[0].id;
  if (!voiced) return id;

  await pool.query(
    `insert into world_voice (world_id, voice, status, provenance)
     values ($1, $2::jsonb, 'published', 'curator')`,
    [id, JSON.stringify(VOICE)]
  );
  return id;
}

/** The minimum validate_voice() in db/004 will publish. */
const VOICE = {
  speaker: "the house",
  audience: "her people",
  register: "dry",
  formality: "cordial",
  cadence: "short, then shorter",
  punctuation: "full stops",
  orthography: "British",
  selfReference: ["the house"],
  lexicon: ["supper"],
  formulae: ["Drinks at seven."],
  banned: ["journey"],
  signOffs: ["The house"],
  always: ["say the time"],
  never: ["explain the joke"],
  breaksCharacterFor: ["an allergy"],
  rejected: ["Let's get this party started!"],
  address: { mode: "second_person", note: "you, plural" },
  humour: { mode: "dry", mechanism: "understatement, never a punchline" },
  sentence: { typicalWords: 9, maxWords: 18 },
  exemplars: [
    { piece: "invitation", text: "Drinks at seven. Wear the good shoes." },
    { piece: "menu_item", text: "Three courses. None of them a surprise." },
    { piece: "house_note", text: "The ice is in the bath. It always is." },
  ],
};

async function makeJob(quizResponseId: string): Promise<string> {
  const { rows } = await pool.query<{ id: string }>(
    `insert into job (type, payload) values ('test.generate', $1::jsonb)
     returning id`,
    [JSON.stringify({ quizResponseId })]
  );
  return rows[0].id;
}

/**
 * A SelectionResult, by hand.
 *
 * One placed product per candidate, one catalogue gap (the menu pool could not
 * fill a slot her occasion has — a work order) and one excluded slot (she said
 * no games — not a work order, and db/014 exists to keep the two apart).
 */
function runOf(fx: Fixture, worldIds: readonly string[]): SelectionResult {
  return {
    candidates: worldIds.map((worldId, index) =>
      candidateOf(fx, worldId, index + 1)
    ),
    vector: {
      weights: {},
      terms: {},
      dealbreakers: [],
      blend: { stated: 0.55, history: 0, cohort: 0.45 },
      evidenceCount: 0,
    },
    emphasis: noEmphasis(),
    eliminated: [],
    impasse: null,
    seed: 4242,
    gaps: [
      {
        pool: "menu",
        slotCode: "the_menu",
        slotLabel: "The menu",
        required: true,
        detail: "Nothing in the menu pool can fill it. The pool is empty.",
      },
    ],
    excluded: [
      {
        slotCode: "game",
        slotLabel: "The fun",
        pool: "game",
        requiredByOccasion: false,
        exclusion: "no_games",
        detail: "She said no games, so the slot is not in her plan at all.",
      },
    ],
  };
}

function candidateOf(fx: Fixture, worldId: string, rank: number): Candidate {
  const slot: UnitSlot = {
    key: "table_object#1",
    slotCode: "table_object",
    label: "The table",
    section: "details",
    pool: "product",
    required: true,
    quantity: 1,
    perGuest: false,
    dayIndex: null,
    position: 30,
    note: "",
  };

  const ingredient: Ingredient = {
    pool: "product",
    id: fx.productId,
    slug: "dbtest-product",
    name: "A candelabra",
    description: "One, and nobody mentions it.",
    priceCents: 12000,
    facets: {},
    occasions: [],
    slots: [],
    worlds: {},
    issuance: null,
    minGuests: null,
    maxGuests: null,
    shape: null,
    printedMatter: [],
    isFixture: false,
  };

  const pick: Pick = {
    slot,
    ingredient,
    unitCost: 12000,
    lineCost: 12000,
    facetMatch: 0.2,
    affinity: 0.1,
    issuancePenalty: 0,
    similarityPenalty: 0,
    score: 0.3,
    forced: false,
    alternatives: 4,
  };

  return {
    rank,
    destination: {
      id: worldId,
      slug: `dbtest-${rank}`,
      name: `Destination ${rank}`,
      tagline: "A tagline.",
      facets: {},
      occasions: [],
      issuance: null,
      isFixture: false,
    },
    destinationScore: 0.5,
    destinationRank: rank,
    ditheredRank: rank,
    picks: [pick],
    dropped: [],
    gaps: [
      {
        pool: "menu",
        slotCode: "the_menu",
        slotLabel: "The menu",
        required: true,
        detail: "Nothing in the menu pool can fill it. The pool is empty.",
      },
    ],
    swaps: [],
    fingerprint: `a1:${rank}`,
    budget: {
      guests: 12,
      guestsAreConfirmed: true,
      planning: 1200,
      ceiling: 1800,
      totalCents: 12000,
      totalPerHeadCents: 1000,
      overage: null,
      overagePerHead: null,
      unbounded: false,
      unpricedItems: [],
    },
    score: 0.3,
    lowConfidence: false,
    blocked: null,
    explanation: {
      headline: "A destination for a dinner party, 1 ingredient placed.",
      destination: ["It matched on warmth."],
      eliminated: [],
      forced: [],
      dropped: [],
      swapped: [],
      budget: ["$120 of pooled ingredients."],
      emphasis: [],
      venue: [],
      gaps: ['REQUIRED slot "The menu" is unfilled.'],
      excluded: ["She said no games."],
      confidence: [],
      secret: null,
    },
  };
}

/** A transaction, because approve/discard/deliver require one. */
async function inTransaction<T>(
  fn: (tx: Queryable) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const result = await fn(client as unknown as Queryable);
    await client.query("commit");
    return result;
  } catch (err) {
    await client.query("rollback");
    throw err;
  } finally {
    client.release();
  }
}
