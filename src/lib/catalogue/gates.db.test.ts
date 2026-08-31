/**
 * THE TWO-PART GUARD, AND THE PROOF THAT EACH HALF GOES RED.
 *
 *   createdb revelle_gates && DATABASE_URL=postgres://…/revelle_gates \
 *     npm run migrate && npm run seed:destinations && npm run seed:menus && \
 *     npm run seed:drinks && npm run seed:dishes && npm run seed:games && \
 *     npm run seed:bank && npm run seed:destinations && npm run tag:catalogue
 *   REVELLE_TEST_DATABASE_URL=postgres://…/revelle_gates npm test
 *
 * SKIPPED unless REVELLE_TEST_DATABASE_URL is set, exactly like
 * ../desk/coverage.db.test.ts and ../pools/registry.db.test.ts, and for their
 * reasons: the suite must stay runnable with no database.
 *
 * ── WHAT IT IS FOR ───────────────────────────────────────────────────
 *
 * CLAUDE.md rule 22 asks for two guards and says why one is not enough:
 *
 *   "…a build test that FAILS IF THE DERIVED TABLE IS EMPTY after a full
 *    build, and a detector for A GATE THAT PRUNES ZERO ROWS ACROSS THE WHOLE
 *    CATALOGUE. The first catches the tagger never running; the second catches
 *    it running and matching nothing, which reads identically from the outside
 *    and is why one guard is not enough."
 *
 * Both are here, and so is the third thing without which neither is worth
 * anything: each is BROKEN ON PURPOSE, inside a transaction that is rolled
 * back, and the test asserts it goes red. A guard nobody has watched fail is a
 * guard nobody has evidence for — which is the same class of claim as the
 * migration that "ran clean" for weeks.
 *
 * ── AND THE THIRD TEST, WHICH IS RULE 21's ──────────────────────────
 *
 * The tagging step has two callers: the deploy chain and /desk/stocked's sync
 * button. The founder:
 *
 *   "If you add a test that the two paths agree, it must exercise both callers
 *    end to end — not call the shared function twice and compare it to itself.
 *    A test that cannot fail is worse than no test, because it reports safety
 *    it does not provide."
 *
 * So nothing below calls `tagCatalogue()`. One side spawns `npm run
 * tag:catalogue` as a child process, which is literally what render.yaml runs.
 * The other calls `POST()` from src/app/api/desk/seed/route.ts — the function
 * the button reaches — with a real Request and a real token, and lets it spawn
 * its own chain. The derived rows are wiped between the two and the two results
 * are compared. A future edit that gives either path its own tagging turns this
 * red.
 */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { register } from "node:module";
import test, { after, before } from "node:test";

import pg from "pg";

import { loadCatalogue } from "../selection/catalogue.ts";
import { gateReport, inertGates, type GateReport } from "./gates.ts";

const URL = process.env.REVELLE_TEST_DATABASE_URL;
const skip = URL ? false : "set REVELLE_TEST_DATABASE_URL to run";

/** The seeder chain the route spawns is not fast. Ten minutes is generous. */
const CHAIN_TIMEOUT_MS = 600_000;

let client: pg.Client | null = null;
let report: GateReport | null = null;

before(async () => {
  if (!URL) return;
  client = new pg.Client({ connectionString: URL, application_name: "revelle-gates-test" });
  await client.connect();
  report = await gateReport(client);
});

after(async () => {
  await client?.end();
});

/* ═══ PART ONE — THE DERIVED TABLES ARE NOT EMPTY ═════════════════════ */

/**
 * THE TAGGER RAN. The cheap half, and the one that would have caught the
 * founding defect on the day db/020 landed.
 *
 * `ingredient_requirement` was EMPTY on every database built from the committed
 * chain for weeks — db/020 and db/033 tag by matching authored text and
 * `migrate` runs before every seeder — and nothing anywhere reported it. It
 * surfaced only when somebody went looking.
 */
test("after a full build, ingredient_requirement is not empty", { skip }, () => {
  assert.ok(
    report!.holdings.venueRequirementRows > 0,
    "ingredient_requirement holds no rows after a full build. Either " +
      "`npm run tag:catalogue` did not run — check that it is the last step of " +
      "render.yaml's preDeployCommand and of CATALOGUE_CHAIN — or every one of " +
      "its predicates matched nothing. `npm run check:gates` distinguishes the " +
      "two. This is the exact state production was in, invisibly, for weeks."
  );
});

test("after a full build, a destination declares its own venue requirement", { skip }, () => {
  // db/033 §4's `update world set venue_requirement = … where slug in (…)`.
  // The third inert derivation of the same shape, and the one nobody was
  // looking for: `world` rows come from seeders too.
  assert.ok(
    report!.holdings.worldRequirements > 0,
    "no destination declares a venue requirement. db/033 set two — tahiti and " +
      "palm-springs-1965 — from inside the migration chain, against a world " +
      "table the seeders had not filled yet."
  );
});

test("after a full build, some drink's season is a gate rather than a lean", { skip }, () => {
  const drinks = report!.holdings.seasonStrict.drink ?? 0;
  assert.ok(
    drinks > 0,
    `${drinks} active drinks are season-gated. seed-drinks has never written ` +
      `season_strict and the column defaults false, so before the post-seed ` +
      `step this was ZERO and a February party was offered the summer bar with ` +
      `"Summer" printed on the sheet.`
  );
});

/* ═══ PART TWO — THE GATES ACTUALLY REFUSE SOMETHING ══════════════════ */

/**
 * THE OTHER FAILURE, WHICH LOOKS IDENTICAL FROM OUTSIDE.
 *
 * A full `ingredient_requirement` and a gate that refuses nothing anywhere is
 * a filter that filters nothing, and rule 15's whole subject: an unfed
 * instrument still returns a number, the reveal still renders, no test goes
 * red. The count below is over the cross product of the ACTIVE catalogue and
 * every room the house models, so a zero means the gate cannot fire for
 * anybody, ever — not that this evening happened not to trip it.
 */
test("the venue gate refuses something, somewhere in the catalogue", { skip }, () => {
  assert.ok(
    report!.prunes.venue > 0,
    `the venue gate holds ${report!.holdings.venueRequirementRows} requirement ` +
      `row(s) and refuses NOTHING in any of the ` +
      `${report!.environments.length} rooms the house models. The tags are on ` +
      `rows the engine cannot see (a retired or draft pool), or every room ` +
      `affords everything. Full and inert is the failure that reads exactly ` +
      `like empty and inert.`
  );
});

/* ═══ db/049 — THE THREE NEW VENUE ANSWERS ════════════════════════════ */

/**
 * RULE 21's GUARD, AND IT GOES THROUGH THE CONSUMERS.
 *
 * The founder, on the shape a unification test has to take: "it must exercise
 * both callers end to end — not call the shared function twice and compare it
 * to itself. A test that cannot fail is worse than no test."
 *
 * `composeVenue()` has two consumers that must agree about what a host's
 * answers afford: the ENGINE's loader, which builds one Venue for one
 * application, and the REPORTER's enumerator, which builds every one of them.
 * Nothing
 * below calls `composeVenue`. One side calls `loadCatalogue` — the function
 * `loadSelectionInput` calls on every real run — and the other reads
 * `gateReport`'s own numbers. A future edit that gives either path its own
 * composition rule turns this red.
 *
 * The host chosen is the founder's own case, because it is the one where a
 * naive AND and a naive OR give different answers: a POOL, at a party where
 * NOBODY IS GETTING IN. Presence says yes, use says no, and the answer is no.
 */
test("the engine and the reporter agree about one host's affordances", { skip }, async () => {
  const catalogue = await loadCatalogue(client!, "girls_weekend", {
    environment: "my_home",
    indoorOutdoor: "outdoor",
    waterAccess: "pool",
    waterUse: "beside_it",
  });

  const venue = catalogue.venue;
  assert.ok(venue, "loadVenue returned nothing for a real environment");

  assert.equal(
    venue!.provides.requires_still_water,
    false,
    "a good pool at a party nobody swims at affords no float. Among host " +
      "answers, false wins — see composeVenue()."
  );
  assert.equal(
    venue!.provides.requires_outdoors,
    true,
    "and her own statement that the party is outside stands"
  );

  // The reporter's side: this exact configuration is one of the ones it
  // enumerates, so the requirement's supply count must be strictly between
  // nobody and everybody — some host affords a float and some host does not.
  const water = report!.requirements.find((r) => r.code === "requires_still_water");
  assert.ok(water, "requires_still_water is not in structural_requirement");
  assert.ok(
    water!.affordedBy > 0 && water!.affordedBy < report!.configurations,
    `requires_still_water is afforded by ${water!.affordedBy} of ` +
      `${report!.configurations} host configurations. Zero means no host can ` +
      `ever receive a float; all of them means the gate cannot fire. Both are ` +
      `the same screen from outside, which is why this counts in two directions.`
  );
});

/**
 * THE SUPPLY SIDE IS COMPLETE EVEN WHERE THE DEMAND SIDE IS NOT.
 *
 * db/049 ships the affordance matrix before any row claims `requires_still_water`
 * — the striped floats are authored in docs/cote-dazur-additions.md and reach
 * the bank when that clause is written into the idea bank. That is an AUTHORING
 * absence and `inertGates()` deliberately does not file it as a wiring bug.
 *
 * What must still be true, and is asserted rather than assumed, is that the
 * plumbing is finished: some answers afford it and some refuse it. If this goes
 * red, the day the float lands it will land everywhere or nowhere.
 */
test("every venue requirement is refused by some answer and afforded by others", { skip }, () => {
  for (const reach of report!.requirements) {
    assert.ok(
      reach.affordedBy > 0,
      `${reach.code} is afforded by NO host configuration. Any row carrying ` +
        `it would be undeliverable to everybody — the member-facing half of ` +
        `CLAUDE.md rule 24.`
    );
    assert.ok(
      reach.affordedBy < report!.configurations,
      `${reach.code} is afforded by every one of the ` +
        `${report!.configurations} host configurations, so no answer she can ` +
        `give refuses it. That is db/035's "grade wearing a column", and it is ` +
        `invisible from outside.`
    );
  }
});

test("no row in the catalogue is undeliverable to every host", { skip }, () => {
  assert.deepEqual(
    report!.unreachable,
    [],
    "these rows claim a requirement no host configuration affords. They are " +
      "in the catalogue, they are active, and nobody can ever receive them."
  );
});

/**
 * THE OUTDOOR GATE, WHICH IS THE HALF THAT HAS BEEN INERT SINCE db/033.
 *
 * `outdoor_access` was minted by db/033 and given its affordance matrix by
 * db/035, which named the one item that would carry it — Acapulco's sparkler
 * kit — and no code path has ever written the claim: seed-bank parses the tag
 * out of the clause and discards it, and db/033 dropped the column that used to
 * hold it. db/049's clause matcher in ./tagging.ts is the first thing that
 * writes it. If this is zero, that matcher has stopped matching.
 */
test("the bank clause matcher tagged the rows that name their own requirement", { skip }, () => {
  const outdoors = report!.requirements.find((r) => r.code === "requires_outdoors");
  const access = report!.requirements.find((r) => r.code === "outdoor_access");
  assert.ok(
    (outdoors?.claimed ?? 0) > 0,
    "nothing in the catalogue requires outdoors, which cannot be right: " +
      "docs/menus.md's clambake and every grilled menu do."
  );
  assert.ok(
    (access?.claimed ?? 0) > 0,
    "`outdoor_access` is claimed by nothing. docs/atmosphere-idea-bank-v1.md " +
      "writes 'outdoor_access tag' into the sparkler kit's clause and " +
      "'requires_outdoors' into the pétanque set's, and bank_item.description " +
      "is the clause verbatim — so zero means the clause matcher in " +
      "./tagging.ts is no longer finding text that is definitely there. " +
      "`npm run tag:catalogue` prints what it took, by name."
  );
});

test("the season gate refuses something, somewhere in the catalogue", { skip }, () => {
  assert.ok(
    report!.prunes.season > 0,
    `${report!.holdings.seasonStrictRows} active row(s) gate on a season and no ` +
      `season a host can state refuses any of them.`
  );
});

/**
 * AND THE ONE THAT IS DELIBERATELY NOT AN ASSERTION.
 *
 * `drink_occasion` holds zero rows and that is a decision — docs/drinks.md has
 * no occasion field, and the "what it's for" line is db/023's meal-shape axis.
 * Asserting it must prune would demand a claim nobody authored; asserting it
 * must be empty would freeze a decision the founder may reverse the day the
 * document grows a field. So this records the number and refuses to have an
 * opinion about it, which is the honest third state — and `inertGates()` says
 * the same thing in the same words at the same place.
 */
test("the occasion gate's drink half is reported, not asserted", { skip }, () => {
  const claims = report!.holdings.occasionClaims.drink ?? 0;
  assert.equal(typeof claims, "number");
  assert.ok(
    inertGates(report!).every((line) => !line.startsWith("occasion")),
    "inertGates() has started filing the occasion gate as a wiring bug. It is " +
      "an authoring decision — see section 3 of ./tagging.ts — and a to-do on " +
      "the desk is where it belongs."
  );
});

test("no gate is inert on this database", { skip }, () => {
  assert.deepEqual(
    inertGates(report!),
    [],
    "at least one gate holds no claims, or holds claims and refuses nothing."
  );
});

/* ═══ PART THREE — PROVE EACH HALF GOES RED ═══════════════════════════ */

/**
 * Break it on purpose, watch it fail, roll back.
 *
 * Every case below runs inside a transaction that is ALWAYS rolled back, so the
 * database is unchanged whatever the assertions do. The reason this exists at
 * all is the week's theme: a green check that has never been red is a claim
 * about safety with no evidence under it.
 */
async function whileBroken<T>(
  statements: readonly string[],
  read: () => Promise<T>
): Promise<T> {
  await client!.query("begin");
  try {
    for (const statement of statements) await client!.query(statement);
    return await read();
  } finally {
    await client!.query("rollback");
  }
}

test("GUARD ONE goes red when the derived table is emptied", { skip }, async () => {
  const broken = await whileBroken(
    ["delete from ingredient_requirement"],
    () => gateReport(client!)
  );
  assert.equal(broken.holdings.venueRequirementRows, 0);
  const inert = inertGates(broken);
  assert.ok(
    inert.some((line) => line.startsWith("venue:") && line.includes("EMPTY")),
    `emptying ingredient_requirement did not produce an inert verdict. The ` +
      `guard reports: ${JSON.stringify(inert)}`
  );
});

test("GUARD TWO goes red when the tags are held and refuse nothing", { skip }, async () => {
  // The rows stay exactly where they are; every room is made to afford
  // everything. That is the second lie in its purest form — a full derived
  // table and a gate that cannot fire — and it must NOT be caught by the
  // emptiness check, or the two guards are one guard.
  const broken = await whileBroken(
    ["update venue_affordance set provided = true"],
    () => gateReport(client!)
  );
  assert.ok(
    broken.holdings.venueRequirementRows > 0,
    "the rows should be untouched — this case is about a full table that " +
      "prunes nothing."
  );
  assert.equal(broken.prunes.venue, 0);
  const inert = inertGates(broken);
  assert.ok(
    inert.some((line) => line.startsWith("venue:") && line.includes("refused")),
    `a full but inert venue gate was not reported. The guard reports: ` +
      `${JSON.stringify(inert)}`
  );
  assert.ok(
    !inert.some((line) => line.includes("EMPTY")),
    "the emptiness guard fired on a full table — the two halves are not " +
      "distinguishing the two failures they exist to distinguish."
  );
});

test("GUARD ONE goes red when no row's season gates", { skip }, async () => {
  const statements = Object.keys(report!.holdings.seasonStrict).map(
    (pool) => `update ${pool} set season_strict = false`
  );
  const broken = await whileBroken(statements, () => gateReport(client!));
  assert.equal(broken.holdings.seasonStrictRows, 0);
  assert.ok(
    inertGates(broken).some((line) => line.startsWith("season:")),
    "clearing every season_strict did not produce an inert verdict — which is " +
      "the exact state of the drink pool before the post-seed step existed."
  );
});

/* ═══ PART FOUR — THE TWO CALLERS AGREE, END TO END ═══════════════════ */

/** Everything the tagging step derives, as a comparable snapshot. */
type Derived = {
  requirements: string[];
  worldRequirements: string[];
  seasonGated: string[];
};

async function derived(): Promise<Derived> {
  const requirements = await client!.query(
    `select entity_table || ':' || entity_id::text || ':' || requirement as k
       from ingredient_requirement order by k`
  );
  const worlds = await client!.query(
    `select slug || ':' || venue_requirement as k
       from world where venue_requirement is not null order by k`
  );
  const drinks = await client!.query(
    `select slug from drink where season_strict order by slug`
  );
  return {
    requirements: requirements.rows.map((r) => String(r.k)),
    worldRequirements: worlds.rows.map((r) => String(r.k)),
    seasonGated: drinks.rows.map((r) => String(r.slug)),
  };
}

/**
 * UNDO EVERYTHING THE TAGGING STEP WRITES, so that the next caller has to write
 * it again from nothing rather than finding it already there.
 *
 * Without this, both paths would "agree" on a database neither of them had
 * changed — the vacuous version of this test, and the one the founder named.
 */
async function wipeDerived(): Promise<void> {
  await client!.query("delete from ingredient_requirement");
  await client!.query("update world set venue_requirement = null");
  await client!.query("update drink set season_strict = false");
}

function run(argv: readonly string[]): Promise<{ code: number; output: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn("npm", ["run", ...argv], {
      env: { ...process.env, DATABASE_URL: URL },
      cwd: process.cwd(),
    });
    let output = "";
    const take = (chunk: Buffer) => {
      output += chunk.toString();
      if (output.length > 40_000) output = output.slice(-40_000);
    };
    child.stdout.on("data", take);
    child.stderr.on("data", take);
    child.on("close", (code) => resolve({ code: code ?? -1, output }));
    child.on("error", reject);
  });
}

let hooked = false;

test(
  "the deploy chain and the sync button derive the same rows",
  { skip, timeout: CHAIN_TIMEOUT_MS },
  async () => {
    const before = await derived();
    assert.ok(
      before.requirements.length > 0,
      "nothing to compare — run the full chain against this database first."
    );

    // ── the DEPLOY path: the wrapper render.yaml runs, as a child process ──
    await wipeDerived();
    const deploy = await run(["tag:catalogue"]);
    assert.equal(
      deploy.code,
      0,
      `\`npm run tag:catalogue\` exited ${deploy.code}:\n${deploy.output}`
    );
    const fromDeploy = await derived();

    // ── the BUTTON path: the route function /desk/stocked calls ────────────
    //
    // Loaded through the resolver hook beside ../desk/coverage.db.test.ts, which
    // teaches Node the two things the bundler knows (`@/x` is `src/x`, and
    // `server-only` is a marker with no runtime). The module under test is
    // byte-for-byte the module the button reaches, and it spawns its own chain
    // exactly as it does in Render.
    await wipeDerived();
    process.env.DATABASE_URL = URL;
    process.env.DESK_DIGEST_TOKEN = process.env.DESK_DIGEST_TOKEN || "gates-db-test";
    if (!hooked) {
      register("../desk/alias.test.hooks.mjs", import.meta.url);
      hooked = true;
    }
    const route = (await import("../../app/api/desk/seed/route.ts")) as {
      POST: (request: Request) => Promise<Response>;
    };
    const response = await route.POST(
      new Request("https://example.invalid/api/desk/seed", {
        method: "POST",
        headers: { authorization: `Bearer ${process.env.DESK_DIGEST_TOKEN}` },
        body: "{}",
      })
    );
    const body = (await response.json()) as {
      ok: boolean;
      steps: { script: string; code: number; output: string }[];
    };
    assert.ok(
      body.ok,
      `the sync route failed:\n${body.steps
        .filter((step) => step.code !== 0)
        .map((step) => `${step.script} exited ${step.code}\n${step.output}`)
        .join("\n")}`
    );
    assert.ok(
      body.steps.some((step) => step.script === "tag:catalogue"),
      `the sync route's chain does not include the tagging step. It ran: ` +
        `${body.steps.map((s) => s.script).join(", ")}. The button would then ` +
        `stock a catalogue whose gates cannot fire, while the deploy stocks one ` +
        `whose gates can — two databases from one repo, which is exactly the ` +
        `drift the button was built to end.`
    );
    const fromButton = await derived();

    assert.deepEqual(
      fromButton,
      fromDeploy,
      "the deploy chain and the sync button derived DIFFERENT rows. They are " +
        "meant to be one exported function behind one wrapper; one of them has " +
        "grown a path of its own."
    );
    assert.deepEqual(
      fromDeploy,
      before,
      "the tagging step is not idempotent: re-deriving from nothing did not " +
        "reproduce what the original build wrote."
    );
  }
);
