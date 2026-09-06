/**
 * THE DECLARED FOOD IDENTITY, AND THE FLOORS IT DECIDES.
 *
 * Three things are worth testing here and they fail differently:
 *
 *   1. THE DECLARATION IS COMPLETE. Every room the catalogue holds has said
 *      what its food is for. A room that has not is not a room with a default
 *      — it is a room the measure must refuse to answer about.
 *
 *   2. THE EVIDENCE IS STILL THERE. Each declaration quotes the sentence it
 *      was derived from, and the sentence is checked against the document it
 *      names. A quote that has drifted out of its source is a claim with the
 *      opinion torn off (rule 17's shape), and it is the failure this file
 *      exists to make loud: nothing else would notice, because the value would
 *      still be a legal string.
 *
 *   3. THE FLOOR GOES THROUGH THE CONSUMER. Rule 21 is explicit that a guard
 *      calling the shared function and comparing it to itself cannot fail, so
 *      the floors are exercised through `overlapFraction` — the function
 *      `check-voices` actually calls — on seeded pools, in the exact shape the
 *      founder's ruling names: A TABLE ROOM AT FOURTEEN IS SHORT WHERE AN
 *      INCIDENTAL ROOM AT SEVEN IS COMPLETE.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  FOOD_IDENTITY,
  DECLARED_ROOMS,
  foodIdentityOf,
  foodIdentityClaim,
  type FoodIdentity,
} from "./food-identity.ts";
import {
  EVIDENCE_FLOORS,
  DELIVERABLES_CLOSE,
  deliverableClaims,
  overlapFraction,
  evidenceFloor,
  roomEvidence,
} from "../../scripts/deliverables.mjs";
import * as CATALOGUE from "./destinations.ts";

/**
 * The same discovery rule `scripts/check-voices.mjs` uses, deliberately.
 *
 * A hand-written list of eighteen slugs here would pass forever and would stop
 * meaning anything the day a nineteenth room is authored — which is the one
 * day this test needs to fail (rule 19).
 */
function authoredSlugs(): string[] {
  const out: string[] = [];
  for (const value of Object.values(CATALOGUE)) {
    if (!value || typeof value !== "object" || Array.isArray(value)) continue;
    const room = value as { key?: unknown; voice?: unknown };
    if (typeof room.key !== "string" || !room.voice) continue;
    out.push(room.key);
  }
  return out;
}

/** Blockquote markers and line wrapping are formatting, not text. */
function normalise(text: string): string {
  return text
    .replace(/^>\s?/gm, " ")
    .replace(/\s+/g, " ")
    .trim();
}

test("every authored room has declared a food identity", () => {
  const missing = authoredSlugs().filter((slug) => !foodIdentityClaim(slug));
  assert.deepEqual(
    missing,
    [],
    "A room in the catalogue with no food-identity claim. There is no default " +
      "and no fallback to the old uniform twelve: declare it in " +
      "src/lib/food-identity.ts with the sentence it was derived from."
  );
});

test("the declaration holds no room the catalogue does not", () => {
  const known = new Set(authoredSlugs());
  const orphans = DECLARED_ROOMS.filter((slug) => !known.has(slug));
  assert.deepEqual(
    orphans,
    [],
    "A declared room that no longer exists. A retired room's claim is removed " +
      "with it, or the next reader takes the registry for a list of rooms."
  );
});

test("all nineteen rooms are declared, and the split is the reported one", () => {
  const counts: Record<FoodIdentity, number> = {
    table: 0,
    expression: 0,
    incidental: 0,
  };
  for (const slug of DECLARED_ROOMS) counts[foodIdentityOf(slug)]++;
  // WAS 18 (rule 14). hong-kong-1963 is the nineteenth: a voice written to her
  // split-twin ruling, declared `expression` on the Las Vegas precedent — a
  // table BOOKED is not a meal the room authored.
  assert.equal(DECLARED_ROOMS.length, 19);
  // Rule 24: the number is asserted, not described. If a declaration is
  // revised this line is where the revision has to be acknowledged.
  assert.deepEqual(counts, { table: 12, expression: 5, incidental: 2 });  // was 12/4/2 over 18
});

test("every declaration quotes a sentence that is still in the source it names", () => {
  const sheets = normalise(
    readFileSync(new URL("../../docs/deliverables-sheets.md", import.meta.url), "utf8")
  );
  const premises = new Map<string, string>();
  for (const value of Object.values(CATALOGUE)) {
    if (!value || typeof value !== "object" || Array.isArray(value)) continue;
    const room = value as { key?: unknown; voice?: unknown; premise?: unknown };
    if (typeof room.key !== "string" || !room.voice) continue;
    if (typeof room.premise === "string")
      premises.set(room.key, normalise(room.premise));
  }

  for (const [slug, claim] of Object.entries(FOOD_IDENTITY)) {
    const haystack =
      claim.source === "premise" ? (premises.get(slug) ?? "") : sheets;
    assert.ok(
      haystack.includes(normalise(claim.from)),
      `${slug}: the quoted sentence is not in its ${claim.source} any more — ` +
        `"${claim.from}". Either the source was edited and the claim needs ` +
        `re-deriving, or the quote was never verbatim.`
    );
    assert.ok(
      claim.why.trim().length > 0,
      `${slug}: a declaration with no reasoning is a value somebody will ` +
        `assume was checked.`
    );
  }
});

test("an undeclared room gets no floor and no verdict — it throws", () => {
  assert.throws(
    () => foodIdentityOf("brooklyn-2026"),
    /No food-identity declared/,
    "A missing declaration must stop the measure. Returning a default here is " +
      "the whole defect: twelve is exactly the number at which an " +
      "under-authored table room looks like a healthy expression room."
  );
  assert.throws(() => evidenceFloor("brooklyn-2026"), /No food-identity declared/);
  assert.equal(foodIdentityClaim("brooklyn-2026"), null);
});

test("the three floors are ordered, and each identity has one", () => {
  assert.ok(EVIDENCE_FLOORS.table > EVIDENCE_FLOORS.expression);
  assert.ok(EVIDENCE_FLOORS.expression > EVIDENCE_FLOORS.incidental);
  assert.equal(EVIDENCE_FLOORS.table, 20);
  assert.equal(EVIDENCE_FLOORS.expression, 12);
  for (const slug of DECLARED_ROOMS)
    assert.equal(typeof evidenceFloor(slug), "number");
});

test("the incidental floor is the smallest at which one coincidence cannot breach", () => {
  const f = EVIDENCE_FLOORS.incidental;
  // Her band was "something like 6-8"; the choice inside it is argued from
  // DELIVERABLES_CLOSE rather than from the catalogue, and this is that
  // argument as an assertion rather than as prose.
  assert.ok(f >= 6 && f <= 8, "outside the founder's band");
  assert.ok(
    1 / f < DELIVERABLES_CLOSE,
    "at this floor a single coincidental shared claim could alone read as " +
      "deliverables-close"
  );
  assert.ok(
    1 / (f - 1) >= DELIVERABLES_CLOSE,
    "a smaller floor would still hold the one-coincidence guarantee, so this " +
      "one is not the smallest that does — and a floor larger than it has to " +
      "be is a floor that asks somebody to author to a metric"
  );
});

test("a table room at 14 is short where an incidental room at 7 is complete", () => {
  // Driven through overlapFraction, which is what check-voices calls, on a
  // seeded pool rather than the real one — the point is the FLOOR, and the
  // real catalogue currently clears every one of them.
  const claims = new Map<string, Set<string>>([
    ["amalfi-1953", new Set(Array.from({ length: 14 }, (_, i) => `dish::a${i}`))],
    ["st-moritz-1984", new Set(Array.from({ length: 7 }, (_, i) => `dish::b${i}`))],
    ["havana", new Set(Array.from({ length: 40 }, (_, i) => `dish::b${i}`))],
  ]);

  assert.equal(foodIdentityOf("amalfi-1953"), "table");
  assert.equal(foodIdentityOf("st-moritz-1984"), "incidental");

  assert.equal(
    overlapFraction("amalfi-1953", "havana", claims),
    null,
    "a table room with fourteen claims owes twenty and is not measurable"
  );
  assert.equal(
    overlapFraction("st-moritz-1984", "havana", claims),
    1,
    "an incidental room with seven claims is complete, and its whole pool " +
      "being a subset of Havana's is exactly the 1.0 the overlap coefficient " +
      "is chosen to report"
  );

  // The same two counts under one uniform number cannot come apart: twelve
  // refuses the incidental room, and any floor low enough to admit it admits
  // the under-authored table room too. That is the ruling, restated as a test.
  assert.ok(EVIDENCE_FLOORS.table > 14 && EVIDENCE_FLOORS.incidental <= 7);
});

test("roomEvidence reports a room against its own floor, not a shared one", () => {
  const claims = new Map<string, Set<string>>([
    ["oaxaca-1954", new Set(Array.from({ length: 14 }, (_, i) => `dish::a${i}`))],
    ["palm-springs-1965", new Set(Array.from({ length: 11 }, (_, i) => `dish::c${i}`))],
  ]);
  assert.deepEqual(roomEvidence("oaxaca-1954", claims), {
    slug: "oaxaca-1954",
    identity: "table",
    floor: 20,
    size: 14,
    short: true,
  });
  assert.deepEqual(roomEvidence("palm-springs-1965", claims), {
    slug: "palm-springs-1965",
    identity: "incidental",
    floor: 6,
    size: 11,
    short: false,
  });
  // A room with no pool at all is size 0 and short — absence is not a small
  // number and it is not disjointness either.
  assert.equal(roomEvidence("tahiti", new Map()).short, true);
});

/* ── AGAINST THE REAL CATALOGUE ───────────────────────────────────────
 *
 * Rule 24's corollary: an instrument's first real use is its first test unless
 * you force an earlier one. These run on the committed documents. */

test("the two rooms the uniform floor called short are complete under their own", () => {
  const claims = deliverableClaims();
  for (const slug of ["palm-springs-1965", "st-moritz-1984"]) {
    const e = roomEvidence(slug, claims);
    assert.equal(e.identity, "incidental");
    assert.ok(
      e.size < 12,
      `${slug} is expected to sit under the OLD uniform floor of twelve — ` +
        `that is what made this change necessary`
    );
    assert.equal(
      e.short,
      false,
      `${slug} refuses a seated meal in the founder's own sheet and must not ` +
        `read as incomplete`
    );
  }
  assert.notEqual(
    overlapFraction("palm-springs-1965", "st-moritz-1984", claims),
    null,
    "the pair that was unknown under one number is measurable under three"
  );
});

test("no room in the committed catalogue is short against its own identity", () => {
  const claims = deliverableClaims();
  const short = authoredSlugs()
    .map((slug) => roomEvidence(slug, claims))
    .filter((e) => e.short)
    .map((e) => `${e.slug} ${e.size}/${e.floor} (${e.identity})`);
  assert.deepEqual(
    short,
    [],
    "A room owes more than it has authored. This is the gate doing its job — " +
      "fill the pool with food only that room can claim (rule 30), or " +
      "re-derive the declaration from the room's own sentences."
  );
});

test("the founder's two validation pairs still read disjoint", () => {
  const claims = deliverableClaims();
  assert.equal(overlapFraction("havana", "oaxaca-1954", claims), 0);
  assert.equal(overlapFraction("acapulco-1959", "oaxaca-1954", claims), 0);
});
