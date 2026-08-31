import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { register } from "node:module";
import test from "node:test";

/**
 * THE INSTRUMENT, TESTED. NOT THE VERDICTS — THERE ARE NONE TO TEST.
 *
 * Every case below is either a classification this pass would get wrong in a
 * way nothing else could catch, or one of the two guards that exist to stop a
 * later edit turning an instrument into a ruling.
 *
 * ── WHY THE ALIAS HOOK ──────────────────────────────────────────────
 *
 * `reconcile.ts` reaches `./drift.ts` and `./registry-dates.ts` through `@/`,
 * which the bundler resolves and Node does not. ./alias.test.hooks.mjs teaches
 * Node the same two things the bundler knows, so the module under test is
 * byte-for-byte the module the screen imports. Registered before the dynamic
 * imports below, because a resolver registered after a module is loaded is a
 * resolver that did nothing.
 */
register("./alias.test.hooks.mjs", import.meta.url);

const {
  PILE_LABEL,
  isVerdict,
  pileOf,
  provenanceOf,
  reconcileRows,
  settlementOf,
  timelineOf,
  unsettled,
  verdictFrom,
} = (await import("./reconcile.ts")) as typeof import("./reconcile.ts");

const { REGISTRY_COPY_DATES, registryDate } = (await import(
  "./registry-dates.ts"
)) as typeof import("./registry-dates.ts");

const { DESTINATIONS } = (await import("../destinations.ts")) as typeof import(
  "../destinations.ts"
);

const ROOT = new URL("../../../", import.meta.url).pathname;

/* ── provenance ─────────────────────────────────────────────────────── */

/**
 * The whole two-pile sort rests on one claim: a `destination.updated` row
 * means a human chose this, and its absence means a seeder wrote it. These
 * cases are the four ways that claim can be read wrong.
 */

test("no desk save at all: only ever seeded, and it says why", () => {
  const reading = provenanceOf("tagline", []);
  assert.equal(reading.provenance, "stale_seed");
  assert.equal(reading.fieldExact, true);
  assert.equal(reading.editedAt, null);
  assert.equal(reading.edits, 0);
  assert.match(reading.why, /nobody has ever saved this room/i);
});

test("a save naming the field: a curator chose it, field-exact", () => {
  const reading = provenanceOf("tagline", [
    { at: "2026-08-20T10:00:00.000Z", copyChanged: ["tagline"] },
    { at: "2026-08-22T10:00:00.000Z", copyChanged: ["premise"] },
  ]);
  assert.equal(reading.provenance, "curator_edit");
  assert.equal(reading.fieldExact, true);
  // The field's own date, not the room's newest — this is the date the
  // founder's stale-choice comparison is made against, and using the room's
  // would say a tagline was chosen on a day nobody touched it.
  assert.equal(reading.fieldEditedAt, "2026-08-20T10:00:00.000Z");
  assert.equal(reading.editedAt, "2026-08-22T10:00:00.000Z");
});

/**
 * THE CASE THAT PAYS FOR THE WHOLE `copy_changed` COLUMN.
 *
 * A room somebody has saved four times, where every save recorded what copy it
 * touched and none of them touched this one. Room-level evidence would file
 * this under "a human chose it" and cost her the closer look on four rows that
 * do not need one. The negative evidence is the useful direction.
 */
test("saves that all speak and none names the field: still the seeder's words", () => {
  const reading = provenanceOf("tagline", [
    { at: "2026-08-20T10:00:00.000Z", copyChanged: [] },
    { at: "2026-08-21T10:00:00.000Z", copyChanged: ["premise"] },
  ]);
  assert.equal(reading.provenance, "stale_seed");
  assert.equal(reading.fieldExact, true);
  assert.equal(reading.fieldEditedAt, null);
  // The room HAS been saved, and the row says so — the pile is about the
  // field, and hiding the room's history would be a different lie.
  assert.equal(reading.editedAt, "2026-08-21T10:00:00.000Z");
  assert.match(reading.why, /None of them names the tagline/);
});

test("a save that could not say: curator edit, and NOT field-exact", () => {
  const reading = provenanceOf("tagline", [
    { at: "2026-08-20T10:00:00.000Z", copyChanged: null },
    { at: "2026-08-21T10:00:00.000Z", copyChanged: ["premise"] },
  ]);
  assert.equal(reading.provenance, "curator_edit");
  // One row that cannot speak is enough to lose the negative claim. Reading
  // the other row's silence as proof would be exactly the inference-from-
  // silence this project exists to escape.
  assert.equal(reading.fieldExact, false);
  assert.match(reading.why, /CANNOT SAY WHETHER THIS FIELD WAS ONE OF THEM/);
});

test("an unreadable ledger is indeterminate and never stale-seed", () => {
  const reading = provenanceOf("tagline", [], false);
  assert.equal(reading.provenance, "indeterminate");
  assert.notEqual(reading.provenance, "stale_seed");
  assert.equal(reading.fieldExact, false);
  assert.match(reading.why, /not evidence that nobody edited/i);
});

/* ── the timeline ───────────────────────────────────────────────────── */

const DATED = (at: string) =>
  ({
    state: "dated" as const,
    at: {
      slug: "havana",
      field: "tagline",
      authoredAt: at,
      sha: "0".repeat(40),
      subject: "a commit",
      value: "whatever",
      revisions: 2,
      unknown: null,
    },
  }) as const;

function edited(at: string) {
  return provenanceOf("tagline", [{ at, copyChanged: ["tagline"] }]);
}

test("a desk edit older than the registry sentence is the stale choice", () => {
  const line = timelineOf(
    edited("2026-08-15T12:00:00.000Z"),
    DATED("2026-08-31T12:00:00.000Z")
  );
  assert.equal(line.state, "edit_precedes_registry");
});

test("a desk edit after the registry sentence is not", () => {
  const line = timelineOf(
    edited("2026-08-31T12:00:00.000Z"),
    DATED("2026-08-15T12:00:00.000Z")
  );
  assert.equal(line.state, "edit_follows_registry");
});

test("within a day is neither: a correction cycle takes longer than lunch", () => {
  const line = timelineOf(
    edited("2026-08-31T09:00:00.000Z"),
    DATED("2026-08-31T18:00:00.000Z")
  );
  assert.equal(line.state, "same_day");
});

test("no desk edit places nothing in time, and is not 'undatable'", () => {
  const line = timelineOf(provenanceOf("tagline", []), DATED("2026-08-15T12:00:00.000Z"));
  assert.equal(line.state, "no_edit");
});

/**
 * A stale generated date is the one shape that must never reach the screen as
 * a number: it is real, it belongs to a sentence nobody is looking at, and it
 * would sit under her cursor at the exact moment she is deciding whether an
 * edit predates a correction. Rule 20 — a report generated from something
 * other than reality is the most convincing failure this system produces.
 */
test("a stale registry date is undatable, and says how to fix it", () => {
  const line = timelineOf(edited("2026-08-15T12:00:00.000Z"), {
    state: "stale",
    at: DATED("2026-08-01T12:00:00.000Z").at,
  });
  assert.equal(line.state, "undatable");
  assert.equal(line.state === "undatable" && line.editedAt, "2026-08-15T12:00:00.000Z");
  assert.match(
    line.state === "undatable" ? line.why : "",
    /gen:registry-dates/
  );
});

test("an unknown registry date is undatable and carries its own reason", () => {
  const line = timelineOf(edited("2026-08-15T12:00:00.000Z"), {
    state: "unknown",
    why: "the parser does not recognise its shape",
  });
  assert.equal(line.state, "undatable");
  assert.match(line.state === "undatable" ? line.why : "", /parser/);
});

/* ── the baseline ───────────────────────────────────────────────────── */

function record(over: Partial<Record<string, string>> = {}) {
  return {
    id: "1",
    field: "tagline",
    verdict: "database",
    registry_value: "FILE",
    database_value: "DESK",
    chosen_value: "DESK",
    provenance: "curator_edit",
    note: "",
    decided_at: "2026-08-31T12:00:00.000Z",
    decided_by_email: "her@example.com",
    ...over,
  };
}

test("no record at all: never reconciled", () => {
  assert.equal(settlementOf(null, "FILE", "DESK").state, "never");
});

test("a database verdict stays settled while both sides hold still", () => {
  assert.equal(settlementOf(record(), "FILE", "DESK").state, "settled");
});

/**
 * THE TRAP db/055 IS WRITTEN AROUND.
 *
 * A merge rewrites the row, so `database_value` is superseded the instant the
 * verdict lands. A baseline compared against it would report every merged
 * field as "drifted again" one second after it was settled — a detector going
 * amber because it worked, which is the failure this whole pass exists to end,
 * reintroduced by the fix for it.
 */
test("a merge is settled against chosen_value, not against database_value", () => {
  const merged = record({
    verdict: "merge",
    database_value: "DESK",
    chosen_value: "BOTH",
  });
  assert.equal(settlementOf(merged, "FILE", "BOTH").state, "settled");
  // And it goes amber properly when the row really does move afterwards.
  const later = settlementOf(merged, "FILE", "SOMETHING ELSE");
  assert.equal(later.state, "drifted_again");
  assert.deepEqual(later.state === "drifted_again" ? later.moved : [], [
    "the database",
  ]);
});

test("a rewritten registry sentence drifts a settled field again", () => {
  const after = settlementOf(record(), "FILE, REVISED", "DESK");
  assert.equal(after.state, "drifted_again");
  assert.deepEqual(after.state === "drifted_again" ? after.moved : [], [
    "the registry",
  ]);
});

test("both sides moving names both", () => {
  const after = settlementOf(record(), "A", "B");
  assert.deepEqual(after.state === "drifted_again" ? after.moved : [], [
    "the registry",
    "the database",
  ]);
});

/* ── what the detector is allowed to call clear ─────────────────────── */

test("unsettled counts what is waiting and excludes what was decided", () => {
  const waiting = unsettled([
    { slug: "havana", field: "tagline", settlement: { state: "never" } },
    {
      slug: "havana",
      field: "premise",
      settlement: { state: "settled", record: record() },
    },
    {
      slug: "big-sur",
      field: "premise",
      settlement: { state: "drifted_again", record: record(), moved: ["the registry"] },
    },
  ]);
  // Sorted by slug, one line per room, and the drifted-again one says so —
  // "these five rooms have no row" ends an investigation, "they disagree"
  // starts one.
  assert.deepEqual(waiting, [
    "big-sur (premise (drifted again since it was settled))",
    "havana (tagline)",
  ]);
});

/* ── the posted verdict ─────────────────────────────────────────────── */

test("the three verdicts, and nothing else", () => {
  assert.equal(isVerdict("registry"), true);
  assert.equal(isVerdict("database"), true);
  assert.equal(isVerdict("merge"), true);
  assert.equal(isVerdict("REGISTRY"), false);
  assert.equal(isVerdict(""), false);
});

test("a post with no verdict is refused by name, never resolved into one", () => {
  const draft = verdictFrom("", "FILE", "DESK", "", "");
  assert.equal(draft.value, null);
  assert.match(draft.error ?? "", /Nothing was recorded/);
});

test("registry wins writes the registry's words; database wins writes the desk's", () => {
  const a = verdictFrom("registry", "FILE", "DESK", "", "");
  assert.equal(a.value?.chosenValue, "FILE");
  const b = verdictFrom("database", "FILE", "DESK", "", "");
  assert.equal(b.value?.chosenValue, "DESK");
});

test("a merge is the sentence she typed, folded and trimmed", () => {
  const draft = verdictFrom("merge", "FILE", "DESK", "  a\r\nb  ", "  why  ");
  assert.equal(draft.value?.chosenValue, "a\nb");
  assert.equal(draft.value?.note, "why");
});

test("an empty merge is refused: blank copy is the one thing that cannot be undone", () => {
  for (const said of ["", "   ", "\n\t "]) {
    const draft = verdictFrom("merge", "FILE", "DESK", said, "");
    assert.equal(draft.value, null, `"${said}" should not have been accepted`);
    assert.match(draft.error ?? "", /empty one would put blank copy/);
  }
});

test("a verdict on a field that no longer differs is refused, not recorded", () => {
  const draft = verdictFrom("registry", "SAME", "SAME", "", "");
  assert.equal(draft.value, null);
  assert.match(draft.error ?? "", /nothing to settle/);
});

/* ── the rows, and the order they sit in ────────────────────────────── */

/**
 * A real room out of the registry, so the drift half is exercised through the
 * same `copyDrift` the detector calls rather than through a stub of it.
 */
const HAVANA = DESTINATIONS["havana"];
const NEW_YORK = DESTINATIONS["new-york"];

function room(
  slug: string,
  over: { name?: string; tagline?: string; description?: string } = {},
  edits: { at: string; copyChanged: string[] | null }[] = []
) {
  const authored = DESTINATIONS[slug as keyof typeof DESTINATIONS];
  return {
    worldId: `id-${slug}`,
    slug,
    name: over.name ?? authored.name,
    tagline: over.tagline ?? authored.tagline,
    description: over.description ?? authored.premise,
    edits,
  };
}

test("a room that matches the registry produces no rows at all", () => {
  assert.deepEqual(reconcileRows([room("havana")], new Map()), []);
});

test("trailing whitespace is not drift — the detector's fold, not a second one", () => {
  const rows = reconcileRows(
    [room("havana", { tagline: `${HAVANA.tagline}\n  ` })],
    new Map()
  );
  assert.deepEqual(rows, []);
});

test("the piles come first, then the slug, then the registry's field order", () => {
  const rows = reconcileRows(
    [
      // A curator edit — second pile — on a slug that sorts first.
      room(
        "big-sur",
        { tagline: "chosen at the desk" },
        [{ at: "2026-08-20T10:00:00.000Z", copyChanged: null }]
      ),
      // Two stale-seed fields on a slug that sorts later.
      room("new-york", {
        tagline: "seeded once",
        description: "seeded once too",
      }),
    ],
    new Map()
  );
  assert.deepEqual(
    rows.map((r) => `${r.slug}.${r.field}`),
    [
      // stale_seed pile, in field order
      "new-york.tagline",
      "new-york.premise",
      // curator_edit pile
      "big-sur.tagline",
    ]
  );
  assert.equal(pileOf(rows[0]), "stale_seed");
  assert.equal(pileOf(rows[2]), "curator_edit");
});

/**
 * RULE 18, AS AN ASSERTION. The target of a correction does not move between
 * the mistake and its fix. A verdict changes a field's settlement and nothing
 * the sort reads, so a decided row is in the same place on the way back.
 */
test("recording a verdict does not move the row", () => {
  const rooms = [
    room("new-york", { tagline: "seeded once" }),
    room("big-sur", { tagline: "seeded once" }),
  ];
  const before = reconcileRows(rooms, new Map()).map(
    (r) => `${r.slug}.${r.field}`
  );
  const after = reconcileRows(
    rooms,
    new Map([
      [
        "id-big-sur:tagline",
        record({
          registry_value: DESTINATIONS["big-sur"].tagline,
          database_value: "seeded once",
          chosen_value: "seeded once",
        }),
      ],
    ])
  );
  assert.deepEqual(after.map((r) => `${r.slug}.${r.field}`), before);
  assert.equal(
    after.find((r) => r.slug === "big-sur")?.settlement.state,
    "settled"
  );
});

test("the registry side of a row is the file's words, the other side the desk's", () => {
  const rows = reconcileRows(
    [room("new-york", { tagline: "what a member reads today" })],
    new Map()
  );
  assert.equal(rows.length, 1);
  assert.equal(rows[0].registry, NEW_YORK.tagline);
  assert.equal(rows[0].database, "what a member reads today");
  assert.equal(rows[0].where, "world.tagline");
});

/* ── the generated dates ────────────────────────────────────────────── */

/**
 * THE GUARD THAT MAKES THE GENERATED FILE SAFE TO SHIP.
 *
 * A commit that rewrites a tagline and forgets `npm run gen:registry-dates`
 * leaves a date belonging to a sentence nobody is looking at. `registryDate`
 * catches that at read time and returns `stale` — which is honest and is also
 * a screen that has lost the founder's third fact. This turns the same
 * condition into a red test, so the omission is caught in the commit rather
 * than in front of her.
 */
test("every generated registry date is for the sentence the registry holds now", () => {
  const stale: string[] = [];
  for (const slug of Object.keys(DESTINATIONS)) {
    for (const field of ["name", "tagline", "premise"]) {
      const reading = registryDate(slug, field);
      if (reading.state !== "dated") stale.push(`${slug}.${field} — ${reading.state}`);
    }
  }
  assert.deepEqual(
    stale,
    [],
    `src/lib/desk/registry-dates.ts is out of date:\n  ${stale.join("\n  ")}\n\n` +
      `Run \`npm run gen:registry-dates\` and commit the result. Until then ` +
      `/desk/reconcile cannot show when the registry sentence was written, ` +
      `which is one of the three facts a verdict is supposed to be made on.`
  );
});

test("the generated dates cover every authored room, three fields each", () => {
  // CLAUDE.md rule 24: count what it matched. A parser that found three rooms
  // out of eighteen is not a parser that worked, and nothing else here would
  // notice — every assertion above passes just as happily over a short list.
  const slugs = new Set(REGISTRY_COPY_DATES.map((row) => row.slug));
  assert.equal(REGISTRY_COPY_DATES.length, slugs.size * 3);
  for (const slug of Object.keys(DESTINATIONS)) {
    assert.ok(slugs.has(slug), `no generated dates for ${slug}`);
  }
});

/* ── the two guards that keep this an instrument ────────────────────── */

/**
 * NO VERDICT IS PRE-SELECTED. The founder's constraint, as a test rather than
 * as a paragraph, because the paragraph is exactly what a later edit adding a
 * "recommended" default would not read.
 *
 * Source-level, in the idiom governed.test.ts already uses on the seeders: the
 * thing being caught is somebody ADDING a second behaviour, which by
 * definition does not go through any function this test could call.
 */
test("nothing on the reconciliation screen starts selected", () => {
  const page = readFileSync(
    `${ROOT}src/app/desk/(signed-in)/reconcile/page.tsx`,
    "utf8"
  );
  const code = page
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, " ");

  for (const banned of [
    "defaultChecked",
    "defaultValue",
    "autoFocus",
    "checked=",
    "selected=",
  ]) {
    assert.ok(
      !code.includes(banned),
      `/desk/reconcile uses \`${banned}\`. No verdict may be pre-selected, ` +
        `defaulted or auto-applied — the founder clicks. If this is a control ` +
        `that genuinely needs a starting value, it is not a verdict control ` +
        `and this list needs an argument written beside it, not a deletion.`
    );
  }

  // The merge textarea must be EMPTY. A pre-filled one is a pre-selection
  // wearing a textarea: whichever side it was filled from is the side she is
  // being nudged towards, and the nudge is invisible because it looks like a
  // convenience.
  assert.match(
    code,
    /name="merged"[\s\S]{0,220}placeholder=/,
    "the merge box must carry a placeholder and no value"
  );
});

/**
 * ONE OWNER FOR "THE COPY HAS DRIFTED" (rule 21).
 *
 * The health route and the desk each had their own comparison, differing by a
 * trim, and neither could go red. The shared function is the fix; this is the
 * part of the fix that survives somebody adding a second path next month,
 * which is the only failure worth guarding — a test that called the shared
 * function twice would be testing it against itself.
 */
test("/api/health does not compare copy for itself", () => {
  const route = readFileSync(`${ROOT}src/app/api/health/route.ts`, "utf8");
  const code = route
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/^\s*\/\/.*$/gm, " ");

  assert.ok(
    code.includes("copyDriftReport("),
    "the health route must read its copy drift from src/lib/desk/drift.ts"
  );
  // `room.premise`, `room.tagline`, `row.description !==` — any of the shapes
  // the route used before the predicate was extracted.
  const secondOpinion = /(room|registry|file)\.(name|tagline|premise)\b|\.description\s*!==/;
  assert.ok(
    !secondOpinion.test(code),
    "the health route is comparing registry copy against a row itself again. " +
      "There is one owner for that predicate — copyDrift in " +
      "src/lib/desk/drift.ts — because a field this route calls drifted and " +
      "the desk calls clean can never be reconciled: it sits on the detector " +
      "forever with nothing on the screen to click."
  );
});

test("the piles are labelled, and the third one is not a pile of facts", () => {
  assert.equal(PILE_LABEL.stale_seed, "Only ever seeded");
  assert.equal(PILE_LABEL.curator_edit, "Somebody chose this at the desk");
  assert.match(PILE_LABEL.indeterminate, /could not be established/);
});
