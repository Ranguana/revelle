import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { drinkCounts, parseDrinks } from "../../scripts/drinks-parse.mjs";
import { OWED_NOTE_OPENING, drinkRow } from "../../scripts/drinks-row.mjs";

/**
 * THE DOCUMENT -> THE ROW. The mapping, driven, not read.
 *
 * ── WHAT THIS EXISTS TO CATCH ────────────────────────────────────────
 *
 * `docs/drinks.md` stopped being twenty-five PROGRAMMES and became seventy-six
 * atomic DRINKS, and twenty-one of the seventy-six have no mocktail mirror —
 * their author wrote none, and nobody may invent one. What must be true of
 * those twenty-one is a CONJUNCTION, and either half alone is a defect:
 *
 *   `mocktails` is NULL   — because a plausible invented twin is worse than a
 *                           named gap, and db/017's guarantee (nobody at the
 *                           table is visibly not drinking) is exactly what an
 *                           invented one spends.
 *   the status is DRAFT   — because db/060's `drink_live_has_its_mirror` will
 *                           not hold an active row whose mirror is null, and a
 *                           seeder that wrote `active` anyway would meet a
 *                           constraint name mid-deploy instead of saying so.
 *
 * Nothing else in `npm test` can see either half: the seeder needs a database
 * the tests do not have. That is why `scripts/drinks-row.mjs` is a module —
 * see its header — and why this file drives `drinkRow()` rather than reading
 * the seeder's source for a token. scripts/catalogue-vocabulary.mjs records
 * what the other approach is worth: "a test that reads a source file for a
 * token is testing a spelling, and the spelling next to it was enough to keep
 * the test green while the behaviour was reverted."
 *
 * ── WHY IT READS THE REAL DOCUMENT ───────────────────────────────────
 *
 * Same reason src/lib/catalogue/tagging.test.ts does, and it is CLAUDE.md rule
 * 24: a fixture spelled the way the matcher expects passes brilliantly and
 * proves nothing. The counts below are the ones `docs/drink-explosion.md` §1
 * reports from its own hand count and db/060 quotes in its header. If one moves
 * it is a finding, not a number to adjust.
 *
 * The one place a fixture earns its keep is the LAST test, and its reason is
 * rule 24's corollary: `docs/drinks.md` carries zero `Also at:` lines, so the
 * sharing path has never run against anything. "Never used" means "never tested
 * against the tables it will actually meet", so the earlier test is forced here.
 */

const SOURCE = new URL("../../docs/drinks.md", import.meta.url);

const drinks = parseDrinks(readFileSync(SOURCE, "utf8"));
const rows = drinks.map(drinkRow);

/** db/023's five, closed. A sixth is a migration, not a wording. */
const MEAL_SHAPES = ["brunch", "lunch", "cocktails", "long_dinner", "late_supper"];

/* ── the counts, before anything else means anything ─────────────────── */

test("the document reads as eighty-five drinks: sixty-one paired, twenty-four owed", () => {
  const counts = drinkCounts(drinks);

  assert.equal(
    counts.drinks,
    85,  // was 76
    `docs/drinks.md reads as ${counts.drinks} drinks and the conversion says ` +
      `seventy-six. Every assertion in this file is made over that list, so a ` +
      `reader that has lost records reports a clean sheet it has not earned.`
  );
  assert.equal(counts.paired, 61, "61 drinks have the mirror their author wrote");  // was 55 before Hong Kong
  assert.equal(
    counts.owed,
    24,  // was 21
    "24 drinks have no twin in their programme's mocktail line. They are not " +
      "a parse failure — the mocktail lines are shorter than the cocktail " +
      "lines in twenty of the twenty-five programmes."
  );
  assert.equal(counts.paired + counts.owed, counts.drinks, "85 = 61 + 24");
  assert.equal(counts.programmes, 28, "twenty-eight programmes were split");  // was 25
  assert.equal(counts.rooms, 13, "thirteen rooms have drinks");  // was 12

  assert.equal(rows.length, drinks.length, "every drink maps to exactly one row");
});

/* ── the conjunction this file exists for ────────────────────────────── */

test("an owed mirror lands as NULL and draft, on every one of the twenty-four", () => {
  const owed = drinks
    .map((drink, at) => ({ drink, row: rows[at] }))
    .filter(({ drink }) => drink.mirrorOwed);

  assert.equal(owed.length, 24, "twenty-four mirrors are owed");  // was 21; Hong Kong adds the Martini, Manhattan and Sidecar

  for (const { drink, row } of owed) {
    assert.equal(
      row.mocktails,
      null,
      `${drink.slug} owes its mirror and did not map to NULL. A blank, a ` +
        `placeholder, or the words "Mirror owed" in the column would all read ` +
        `as answered from every angle and are not.`
    );
    assert.equal(
      row.status,
      "draft",
      `${drink.slug} owes its mirror and did not map to draft. db/060's ` +
        `drink_live_has_its_mirror refuses an active row with a null mirror, ` +
        `so writing anything else here turns a named gap into a failed deploy.`
    );
    assert.equal(row.mirrorSelf, false, `${drink.slug} has no mirror to be`);
    assert.ok(
      typeof row.notes === "string" && row.notes.startsWith(OWED_NOTE_OPENING),
      `${drink.slug} carries no note saying what is owed. The debt has to be ` +
        `legible at /desk/drinks to the one person who can settle it.`
    );
  }
});

test("the owed note is NOT the founder-pending hold-back, which works the other way round", () => {
  // CLAUDE.md rule 23. `FOUNDER-PENDING` means "this row's own TEXT holds it
  // back, and deleting the question publishes it". Here the hold-back is a NULL
  // column and a check constraint: deleting the sentence changes nothing, and a
  // curator who believed otherwise would get a constraint name after a click.
  const owed = rows.filter((row) => row.mocktails === null);
  assert.ok(owed.length > 0, "there are owed rows to check");
  for (const row of owed) {
    assert.ok(
      !String(row.notes).includes("FOUNDER-PENDING"),
      `${row.slug} spells the founder-pending marker. That marker promises ` +
        `that deleting the question publishes the row, which is false here.`
    );
    assert.match(
      String(row.notes),
      /WRITING THE MIRROR IS WHAT PUBLISHES THIS ROW/,
      `${row.slug}'s note must say what actually settles the debt.`
    );
  }
});

test("a paired drink lands live, with its mirror, carrying no debt", () => {
  const paired = drinks
    .map((drink, at) => ({ drink, row: rows[at] }))
    .filter(({ drink }) => !drink.mirrorOwed);

  assert.equal(paired.length, 61);  // was 55
  for (const { drink, row } of paired) {
    assert.equal(
      row.status,
      "active",
      `${drink.slug} has its mirror and must go out live — the pool stocks ` +
        `itself and the desk vetoes rather than consents (CLAUDE.md rule 13).`
    );
    assert.ok(
      typeof row.mocktails === "string" && row.mocktails.trim().length > 0,
      `${drink.slug} has a mirror in the document and none in the row`
    );
    assert.equal(row.notes, null, `${drink.slug} owes nothing and says nothing`);
  }
});

test("no row is offerable without its mirror — db/060's constraint, restated here", () => {
  // The check itself lives in the database and this cannot replace it. What it
  // catches is the mapping producing a row Postgres would refuse, which on a
  // deploy is a rolled-back chain and a constraint name in a log.
  const refused = rows.filter(
    (row) => row.status === "active" && row.mocktails === null
  );
  assert.deepEqual(
    refused.map((row) => row.slug),
    [],
    "these rows would be refused by drink_live_has_its_mirror: an active " +
      "drink with no mirror. Nobody at the table may be visibly not drinking."
  );
});

/* ── the columns db/017 and db/060 constrain ─────────────────────────── */

test("the two builds are one row, and they differ unless the row says why", () => {
  // db/060 §IV replaced db/017's flat `drink_mirror_is_not_the_cocktail` with a
  // qualified one: the lines may agree ONLY where `mirror_self` says that is
  // what it means, and a row that says so must actually have them agree.
  const selves = rows.filter((row) => row.mirrorSelf);
  assert.equal(
    selves.length,
    1,
    `${selves.length} rows claim mirror_self, not one. The one is Vegas 14's ` +
      `black coffee: no alcohol in it, so the same glass goes to everybody. ` +
      `Three other drinks look similar and are NOT flagged, because their ` +
      `author wrote a different sentence in the mirror column (CLAUDE.md ` +
      `rule 32).`
  );

  for (const row of rows) {
    if (row.mocktails === null) continue;
    const same =
      row.mocktails.trim().toLowerCase() === row.cocktails.trim().toLowerCase();
    assert.equal(
      same,
      row.mirrorSelf,
      `${row.slug}: mirror_self is ${row.mirrorSelf} and the two lines ` +
        `${same ? "are" : "are not"} the same. db/060 constrains this in both ` +
        `directions — drink_mirror_is_not_the_cocktail and ` +
        `drink_mirror_self_is_the_same_glass — so a row that disagrees with ` +
        `itself here is a row the database will not take.`
    );
  }
});

test("the name is the drink; the programme's line is provenance, not a name", () => {
  // db/060 §I, the reversal of db/023's "no meal_shape on a drink" caveat: at
  // the programme grain `name` held "A summer dinner or cocktail party" and was
  // richer than any enum. At this grain a gin and tonic is not a summer dinner.
  for (let at = 0; at < drinks.length; at += 1) {
    const drink = drinks[at];
    const row = rows[at];
    assert.equal(row.name, drink.name);
    assert.equal(row.cocktails, drink.name, "one row, two builds, one string");
    assert.notEqual(
      row.name,
      drink.programmeLine,
      `${row.slug} took its programme's "what it is for" line as its name`
    );
    assert.ok(
      row.sourceNote.includes(drink.programmeLine),
      `${row.slug} lost the line it was split out of. It is provenance and it ` +
        `is not deleted — CLAUDE.md rule 14.`
    );
  }
});

test("every row satisfies db/017's shape checks for a slug and a drinks line", () => {
  const seen = new Set<string>();
  for (const row of rows) {
    assert.match(
      row.slug,
      /^[a-z][a-z0-9-]*$/,
      `${row.slug} is not a slug db/017's check accepts`
    );
    assert.match(
      row.slug,
      /^drink-[0-9]{2}-[0-9]+$/,
      `${row.slug} is not in the atomic slug space. db/060 §III retires ` +
        `everything matching ^drink-[0-9]{2}$ — the programmes — so the two ` +
        `spaces must not collide.`
    );
    assert.doesNotMatch(
      row.slug,
      /^drink-[0-9]{2}$/,
      `${row.slug} would be retired by db/060 §III on the next migration`
    );
    assert.ok(!seen.has(row.slug), `${row.slug} appears twice`);
    seen.add(row.slug);

    for (const [field, value] of [
      ["cocktails", row.cocktails],
      ["mocktails", row.mocktails],
    ] as const) {
      if (value === null) continue;
      assert.doesNotMatch(value, /[\r\n]/, `${row.slug}: ${field} has a newline`);
      assert.ok(
        value.trim().length >= 1 && value.trim().length <= 600,
        `${row.slug}: ${field} is outside db/017's 1..600`
      );
    }
    assert.ok(row.name.trim().length > 0, `${row.slug} has a blank name`);
  }
  assert.equal(seen.size, 85);  // was 76
});

/* ── the claims table ────────────────────────────────────────────────── */

test("eighty-nine meal-shape claims, and fifteen drinks that claim none", () => {
  const counts = drinkCounts(drinks);
  assert.equal(
    counts.mealClaims,
    89,
    "the third bullet, summed. db/060 §V's drink_meal is where these land."
  );
  assert.equal(
    counts.noMealShape,
    15,
    'WAS SIX, from programmes 17 and 25 — "After a day outside" and ' +
      '"A boat or beach day" — which name no shape. NO ROWS MEANS EVERY ' +
      "SHAPE, which is claimEligibility()'s own default, and it is the " +
      "document refusing to guess rather than a claim on all five (rule 3). " +
      "Hong Kong's nine take it to fifteen: she wrote the drinks and no meal " +
      "shapes, so all nine say `Not said` rather than have one inferred."
  );

  for (const drink of drinks) {
    assert.ok(drink.meals.length <= 2, `${drink.slug} claims more than two shapes`);
    assert.equal(
      new Set(drink.meals).size,
      drink.meals.length,
      `${drink.slug} claims a shape twice — drink_meal's primary key refuses it`
    );
    for (const meal of drink.meals) {
      assert.ok(
        MEAL_SHAPES.includes(meal),
        `${drink.slug} claims "${meal}", which is not one of db/023's five`
      );
    }
  }
});

/* ── the path the corpus does not exercise ───────────────────────────── */

test("the sixth bullet is read, and every drink is scoped to at least one room", () => {
  // Zero of the seventy-six carry `Also at:` today, so the corpus cannot test
  // it and the run says so rather than assuming. CLAUDE.md rule 24's corollary:
  // "never used" means "never tested against the tables it will actually meet",
  // so the earlier test is forced here instead of on the first authored line.
  assert.equal(
    drinkCounts(drinks).shared,
    0,
    "docs/drinks.md carries no sharing line today. If it gains one, this " +
      "number is the finding — and the on-conflict branch of the seeder's " +
      "drink_world upsert will be running against real rows for the first " +
      "time (docs/drink-explosion.md §7.2)."
  );
  for (const drink of drinks) {
    assert.ok(
      drink.destinations.length >= 1,
      `${drink.slug} is scoped to no room. A native claim is a whitelist; a ` +
        `drink with none would be offered everywhere.`
    );
    assert.equal(drink.destinations[0], drink.destination);
  }

  const shared = parseDrinks(
    [
      "## Westhampton",
      "",
      "### 1 · A summer dinner",
      "",
      "**1.1**",
      "- Gin and tonics in tall glasses",
      "- Tonic and lime with cucumber",
      "- Dinner, Standing drinks",
      "- Summer",
      "- Half made",
      "- Also at: Vegas, Catskills",
      "",
      "**1.2**",
      "- Whiskey by the fire",
      "- Mirror owed",
      "- Dinner, Standing drinks",
      "- Summer",
      "- Half made",
      "",
    ].join("\n")
  );

  assert.equal(shared.length, 2);
  assert.deepEqual(shared[0].destinations, ["Westhampton", "Vegas", "Catskills"]);
  assert.deepEqual(shared[0].meals, ["long_dinner", "cocktails"]);

  const [first, second] = shared.map(drinkRow);
  assert.equal(first.slug, "drink-01-1");
  assert.equal(first.mocktails, "Tonic and lime with cucumber");
  assert.equal(first.status, "active");
  assert.equal(first.notes, null);
  assert.equal(first.season, "summer");
  assert.equal(first.seasonNote, "Summer");
  assert.equal(first.making, "half_made");

  assert.equal(second.slug, "drink-01-2");
  assert.equal(second.mocktails, null, "`Mirror owed` maps to NULL, never text");
  assert.equal(second.status, "draft");
  assert.ok(String(second.notes).startsWith(OWED_NOTE_OPENING));
  assert.deepEqual(shared[1].destinations, ["Westhampton"]);
});
