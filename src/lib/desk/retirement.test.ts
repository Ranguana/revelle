import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";

import {
  PLAIN_STATUSES,
  RETIRED_SUBTITLE,
  retirementFrom,
  retirementRecord,
} from "./retirement.ts";

/**
 * RULE 17, MADE ENFORCEABLE RATHER THAN ASPIRATIONAL.
 *
 * "A status change on a governed class carries its reason, in a column." A
 * rule that lives only in CLAUDE.md is a rule the next retirement forgets —
 * which is not a hypothetical, it is what db/028 did, and the reason had to be
 * reconstructed out of a conversation a year later.
 *
 * ── THE GUARD, IN TWO PLACES, EACH DOING A DIFFERENT JOB ────────────
 *
 * THE REAL ONE IS IN THE DATABASE. db/042's `world_retired_has_reason` refuses
 * `status = 'retired'` without a note, and it refuses it for EVERY writer: the
 * desk, a seeder, a future migration hand-writing an UPDATE, a psql session.
 * Nothing in TypeScript can make that claim, and nothing here tries to
 * duplicate it.
 *
 * WHAT THIS FILE ADDS IS EARLINESS. A migration that violates the rule is
 * caught by the constraint AT DEPLOY TIME, which is the safe outcome and also
 * the expensive one: `npm run migrate` exits non-zero, Render fails the deploy,
 * every later migration and every seeder in the chain never runs, and the only
 * evidence is a log nobody opens — the exact sequence scripts/migrate.mjs
 * describes after db/032, which cost four migrations and seven seeders. Catching
 * it here costs a red test on a laptop instead.
 *
 * ── WHAT THIS CANNOT CATCH, SAID PLAINLY ────────────────────────────
 *
 * It reads TEXT. A migration that retires a world through dynamic SQL, through
 * a helper function, or by any spelling this file's patterns do not match
 * walks straight past it. So does a retirement performed by hand in a psql
 * session, or by a service that is not this repo.
 *
 * All of those are still caught by the CHECK constraint, and that ordering is
 * the point: THE CONSTRAINT IS THE GUARANTEE AND THIS IS THE EARLY WARNING.
 * If the two ever disagree, the constraint is right.
 *
 * What NEITHER can catch is a bad reason. `retirement_note = 'x'` satisfies
 * every check in this codebase. No mechanism proposed here can read a sentence
 * and decide whether it is an argument, and pretending otherwise would be the
 * zero-failure audit rule 15's cousin warns about.
 */

/* ── the reading half ───────────────────────────────────────────────── */

const LIVE = {
  status: "published",
  retirement_note: null,
  superseded_id: null,
  superseded_name: null,
  superseded_status: null,
  superseded_next_name: null,
};

test("a live room with no record has nothing to say", () => {
  assert.equal(retirementRecord(LIVE), null);
});

test("a retirement with lineage reads as a fold", () => {
  const record = retirementRecord({
    ...LIVE,
    status: "retired",
    retirement_note: "the two were the same coast twice.",
    superseded_id: "11111111-1111-1111-1111-111111111111",
    superseded_name: "CÔTE D'AZUR, 1962",
    superseded_status: "published",
  });
  assert.ok(record);
  assert.equal(record.retired, true);
  assert.equal(record.unexplained, false);
  assert.equal(record.successor?.name, "CÔTE D'AZUR, 1962");
  assert.equal(record.successor?.retired, false);
  assert.equal(record.successor?.next, null);
});

test("most retirements have no lineage, and that is not a gap", () => {
  const record = retirementRecord({
    ...LIVE,
    status: "retired",
    retirement_note: "Nobody could write the voice.",
  });
  assert.ok(record);
  assert.equal(record.successor, null);
  assert.equal(record.unexplained, false);
});

test("a successor that is itself retired carries its own successor's name", () => {
  const record = retirementRecord({
    ...LIVE,
    status: "retired",
    retirement_note: "folded.",
    superseded_id: "11111111-1111-1111-1111-111111111111",
    superseded_name: "CÔTE D'AZUR, 1962",
    superseded_status: "retired",
    superseded_next_name: "THE RIVIERA",
  });
  assert.equal(record?.successor?.retired, true);
  assert.equal(record?.successor?.next, "THE RIVIERA");
});

/**
 * The case db/042 argues for at length: a record OUTLIVES the retirement, so
 * that "a future un-retirement knows its own history". The desk renders this
 * one in the past tense; what it must never do is drop it because the status
 * moved on.
 */
test("a room brought back keeps its record, and it is not in force", () => {
  const record = retirementRecord({
    ...LIVE,
    status: "draft",
    retirement_note: "folded once, and brought back.",
    superseded_id: "11111111-1111-1111-1111-111111111111",
    superseded_name: "CÔTE D'AZUR, 1962",
    superseded_status: "published",
  });
  assert.ok(record);
  assert.equal(record.retired, false);
  assert.equal(record.note, "folded once, and brought back.");
});

test("retired with nothing written down is reported, never rendered blank", () => {
  const record = retirementRecord({ ...LIVE, status: "retired" });
  assert.ok(record);
  assert.equal(record.unexplained, true);
  assert.equal(record.note, null);
});

test("whitespace is not a reason", () => {
  const record = retirementRecord({
    ...LIVE,
    status: "retired",
    retirement_note: "   \n ",
  });
  assert.equal(record?.unexplained, true);
});

test("the standing sentence is a constant, so two screens cannot disagree", () => {
  assert.match(RETIRED_SUBTITLE, /Kept for the record/);
});

/* ── the writing half ───────────────────────────────────────────────── */

test("the plain status control cannot retire", () => {
  assert.ok(
    !PLAIN_STATUSES.includes("retired"),
    "setDestinationStatus carries a status and nothing else. A retirement " +
      "needs words, so it may not travel on that button — rule 16: refuse it " +
      "by name rather than letting the database throw at a curator."
  );
});

test("a retirement with no words is refused before the database sees it", () => {
  const blank = retirementFrom("   ", "", "self");
  assert.equal(blank.value, null);
  assert.match(blank.error ?? "", /carries its reason/i);
});

test("a room cannot be folded into itself", () => {
  const self = "11111111-1111-1111-1111-111111111111";
  const draft = retirementFrom("because.", self, self);
  assert.equal(draft.value, null);
  assert.match(draft.error ?? "", /itself/i);
});

test("a reason without a successor is a complete retirement", () => {
  const draft = retirementFrom("  The room was wrong.  ", "", "self");
  assert.equal(draft.error, null);
  assert.deepEqual(draft.value, {
    note: "The room was wrong.",
    successorId: null,
  });
});

/* ── the guard ──────────────────────────────────────────────────────── */

const ROOT = new URL("../../../", import.meta.url).pathname;

/**
 * Rule 17 landed with db/042. Files before it are HISTORY and are exempt.
 *
 * db/028 is the offence this rule was written from — it retires Cap Ferrat
 * with no reason anywhere — and it must stay exactly as it is: rule 14,
 * superseded reasoning is preserved, and a migration that has already been
 * applied to the live database cannot be edited in any case. A test that made
 * the past red would be a test somebody turns off.
 */
const RULE_17_LANDED_AT = 42;

/** Comments argue about this rule constantly and must not trip it. */
function code(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/^\s*\/\/.*$/gm, " ")
    .replace(/^\s*--.*$/gm, " ");
}

/**
 * `... world ... status ... 'retired' ...` inside one statement.
 *
 * Deliberately loose about word order and generous about distance, because the
 * real shapes in db/ are `update world set status = 'retired' where …` and
 * `update world set status = $1 …` inside a do-block twenty lines long. Loose
 * here costs a false positive, which is a person reading a migration; tight
 * costs a miss, which is a wedged deploy.
 */
const RETIRES = /update\s+world\b[\s\S]{0,600}?'retired'/i;

test("no migration after rule 17 retires a world without writing its reason", () => {
  const offences: string[] = [];

  for (const name of readdirSync(`${ROOT}db`).sort()) {
    if (!name.endsWith(".sql")) continue;
    const number = Number(name.slice(0, 3));
    if (!Number.isInteger(number) || number < RULE_17_LANDED_AT) continue;

    const src = code(readFileSync(`${ROOT}db/${name}`, "utf8"));
    const hit = RETIRES.exec(src);
    if (!hit) continue;
    if (!/retirement_note/i.test(hit[0])) {
      offences.push(`db/${name} sets world.status to 'retired' with no retirement_note beside it`);
    }
  }

  assert.deepEqual(
    offences,
    [],
    `CLAUDE.md rule 17 — a status change on a governed class carries its reason, ` +
      `in the same statement that writes the status:\n  ${offences.join("\n  ")}\n\n` +
      `db/042's world_retired_has_reason will refuse this at deploy time, which ` +
      `fails the deploy and stops every migration and seeder behind it. Write ` +
      `the note in the same UPDATE.`
  );
});

/**
 * A seeder may stock a pool. It may not sign for a world (rule 13,
 * src/lib/governed.test.ts) — and it may not close one either. Retiring a room
 * is an adjudication, and the reasons live with a person.
 */
test("no seeder retires a destination at all", () => {
  const offences: string[] = [];

  for (const name of readdirSync(`${ROOT}scripts`).sort()) {
    if (!name.startsWith("seed-") || !name.endsWith(".mjs")) continue;
    const src = code(readFileSync(`${ROOT}scripts/${name}`, "utf8"));
    if (RETIRES.test(src)) offences.push(`scripts/${name} retires a world`);
  }

  assert.deepEqual(
    offences,
    [],
    `A seeder that retires a destination is a script withdrawing a room from ` +
      `the catalogue on a deploy, with whatever reason a script can invent:\n  ` +
      `${offences.join("\n  ")}`
  );
});
