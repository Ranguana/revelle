import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import MATRIX from "../../data/destination-matrix.json" with { type: "json" };
import {
  CELL_SAID,
  DEFAULT_STATUS,
  EXTRACT_TOOL_NAME,
  MATRIX_FACETS,
  MATRIX_LEVELS,
  MAX_PHOTOS,
  NEVER_FROM_A_PHOTO,
  PHOTO_LONG_EDGE,
  PROPOSABLE_FACETS,
  PROPOSABLE_LEVELS,
  extractFrom,
  extractSystemPrompt,
  extractTool,
  isLevelOf,
  mayPropose,
  mayPrune,
  mergeSet,
  saidAs,
  silentExtract,
  type DecidedClaim,
  type MatrixFacet,
  type PhotoExtract,
} from "./photo-extract.ts";
import { GOLD_GROUPS, GOLD_SET, score } from "./photo-gold-set.ts";
import { bandOf, sortQueue, type QueueApplication } from "./desk/photo-queue.ts";

/**
 * WHAT A PHOTOGRAPH MAY SAY — the guards, driven from both ends.
 *
 * Every rule the founder wrote down for this feature is a wall somewhere:
 * in the tool schema, in `extractFrom`, or in db/064's CHECK constraints.
 * This file's job is to prove each wall is still standing, and to prove that
 * the three copies of the vocabulary — the matrix, the code and the migration
 * — are one list.
 *
 * ── THE GUARDS GO THROUGH THE CONSUMERS ─────────────────────────────
 *
 * CLAUDE.md rule 21: "A test that calls the shared function twice and compares
 * it to itself CANNOT FAIL." So the migration is read off disk as text and its
 * lists are parsed out, rather than asserted against a constant this file also
 * imports. db/064 cannot import TypeScript and TypeScript cannot import SQL;
 * text is the only honest bridge.
 */

const ROOT = new URL("../../", import.meta.url).pathname;
const SQL = readFileSync(`${ROOT}db/064-what-a-photograph-may-say.sql`, "utf8");

/* ══ 1 · THE VOCABULARY IS THE MATRIX'S, NOT A COPY ═════════════════ */

test("the nine columns are the matrix's nine — there is no tenth", () => {
  assert.deepEqual([...MATRIX_FACETS], Object.keys(MATRIX.facets));
  for (const facet of MATRIX_FACETS) {
    assert.deepEqual(
      [...MATRIX_LEVELS[facet]],
      (MATRIX.facets as Record<string, string[]>)[facet],
      `${facet}'s levels have drifted from data/destination-matrix.json`
    );
  }
});

test("arrival, ending and starts may never be proposed by a photograph", () => {
  assert.deepEqual(Object.keys(NEVER_FROM_A_PHOTO).sort(), [
    "arrival",
    "ending",
    "starts",
  ]);
  for (const facet of Object.keys(NEVER_FROM_A_PHOTO)) {
    assert.ok(
      !mayPropose(facet),
      `${facet} is refused by name and mayPropose still allows it`
    );
    assert.ok(
      !PROPOSABLE_FACETS.includes(facet as MatrixFacet),
      `${facet} reached PROPOSABLE_FACETS`
    );
    // The reason travels with the name. A refusal with no argument is exactly
    // what CLAUDE.md rule 17 calls an adjudication with the opinion torn off.
    assert.ok(
      (NEVER_FROM_A_PHOTO[facet as MatrixFacet] ?? "").length > 40,
      `${facet} is refused without saying why`
    );
  }
  assert.equal(PROPOSABLE_FACETS.length, 6);
});

test("ending and starts are refused BECAUSE they are fed — check they still are", () => {
  // Positive evidence for the exclusion, from the matrix itself. If a future
  // change unfeeds either column the argument in NEVER_FROM_A_PHOTO stops
  // being true, and this is where that surfaces rather than in a review.
  const fedBy = MATRIX.fedBy as unknown as Record<string, { field: string | null }>;
  assert.equal(fedBy.ending.field, "how_it_ends");
  assert.equal(fedBy.starts.field, "meal_time");
  // And arrival is refused for the OTHER reason — it is unfed and a
  // fingerprint. If somebody wires it, this test says so.
  assert.equal(fedBy.arrival.field, null);
});

test("no level of a refused column can reach the tool's level enum", () => {
  for (const facet of Object.keys(NEVER_FROM_A_PHOTO)) {
    for (const level of MATRIX_LEVELS[facet]) {
      assert.ok(
        !PROPOSABLE_LEVELS.includes(level),
        `${level} belongs to ${facet} and is offerable to the model`
      );
    }
  }
});

test("isLevelOf closes the pairing a flat enum cannot express", () => {
  assert.ok(isLevelOf("dress", "dressed"));
  assert.ok(!isLevelOf("dress", "crowd"));
  assert.ok(!isLevelOf("nonsense", "dressed"));
  // AND IT IS ONLY ABOUT THE PAIRING. `assigned` IS a level of `arrival` and
  // this function says so — the refusal of `arrival` is mayPropose's job, and
  // `extractFrom` asks that first. Two questions, two functions, said here
  // because one function answering both is how the second answer gets lost.
  assert.ok(isLevelOf("arrival", "assigned"));
  assert.ok(!mayPropose("arrival"));
});

/* ══ 2 · THE TOOL SCHEMA IS A WALL, NOT A REQUEST ═══════════════════ */

test("the tool schema has no way to name a destination — not even a null one", () => {
  const schema = JSON.stringify(extractTool());
  for (const forbidden of [
    "destination",
    "world",
    "slug",
    "room",
    "similar",
    "embedding",
  ]) {
    assert.ok(
      !schema.toLowerCase().includes(forbidden),
      `the tool schema contains "${forbidden}". The founder: a nullable slug ` +
        `is an invitation.`
    );
  }
});

test("the tool offers exactly the six proposable columns and their levels", () => {
  const tool = extractTool();
  const items = (
    tool.input_schema.properties as Record<string, Record<string, unknown>>
  ).facets.items as Record<string, Record<string, { enum: string[] }>>;
  assert.deepEqual(items.properties.facet.enum, [...PROPOSABLE_FACETS]);
  assert.deepEqual(items.properties.level.enum, [...PROPOSABLE_LEVELS]);
});

test("every object in the schema refuses additional properties", () => {
  const seen: string[] = [];
  const walk = (node: unknown, path: string): void => {
    if (node === null || typeof node !== "object") return;
    const shape = node as Record<string, unknown>;
    if (shape.type === "object") {
      seen.push(path);
      assert.equal(
        shape.additionalProperties,
        false,
        `${path} lets the model add fields nobody wrote down`
      );
    }
    for (const [key, value] of Object.entries(shape)) {
      walk(value, `${path}.${key}`);
    }
  };
  walk(extractTool().input_schema, "input_schema");
  assert.ok(seen.length >= 5, `only ${seen.length} objects walked`);
});

test("every array may be empty — an empty answer is a correct answer", () => {
  const properties = extractTool().input_schema.properties as Record<
    string,
    Record<string, unknown>
  >;
  for (const [name, shape] of Object.entries(properties)) {
    assert.equal(shape.type, "array", `${name} is not an array`);
    assert.equal(
      shape.minItems,
      0,
      `${name} has a floor. The founder: if every facet is required, the ` +
        `model will invent cells to fill the object.`
    );
  }
});

test("there is no `unknown` level anywhere", () => {
  assert.ok(!PROPOSABLE_LEVELS.includes("unknown"));
  assert.ok(!JSON.stringify(extractTool()).includes('"unknown"'));
});

test("the system rule says the five things and names no destination", () => {
  const prompt = extractSystemPrompt("evening_she_wants");
  assert.match(prompt, /only claim a facet if the frame shows the fact/i);
  assert.match(prompt, /omit/i);
  assert.match(prompt, /never name a destination/i);
  assert.match(prompt, /never infer anything from what is missing/i);
  assert.match(prompt, /never report a colour/i);
  assert.ok(prompt.includes(EXTRACT_TOOL_NAME));
  // Short. A long prompt is where a second copy of the schema's rules grows.
  assert.ok(prompt.length < 900, `${prompt.length} characters`);
});

/* ══ 3 · DEFENCE IN DEPTH: THE PARSE DROPS WHAT THE SCHEMA MISSED ═══ */

const READ = {
  role: "evening_she_wants" as const,
  model: "test",
  palette: [],
};

test("a fingerprint column is dropped after parsing, and says so", () => {
  const parsed = extractFrom({
    ...READ,
    raw: {
      facets: [
        { facet: "arrival", level: "assigned", evidence: "a card", confidence: 1 },
      ],
    },
  });
  assert.ok(parsed.ok);
  assert.equal(parsed.extract.facets.length, 0);
  assert.equal(parsed.dropped.length, 1);
  assert.equal(parsed.dropped[0].kind, "fingerprint");
  assert.equal(parsed.dropped[0].facet, "arrival");
});

test("a level that is not a level of its facet is dropped", () => {
  const parsed = extractFrom({
    ...READ,
    raw: {
      facets: [
        { facet: "dress", level: "crowd", evidence: "people", confidence: 0.9 },
      ],
    },
  });
  assert.ok(parsed.ok);
  assert.equal(parsed.extract.facets.length, 0);
  assert.equal(parsed.dropped[0].kind, "not_a_level");
});

test("a claim with no evidence is not a claim", () => {
  const parsed = extractFrom({
    ...READ,
    raw: {
      facets: [{ facet: "dress", level: "plain", evidence: "  ", confidence: 1 }],
    },
  });
  assert.ok(parsed.ok);
  assert.equal(parsed.extract.facets.length, 0);
  assert.equal(parsed.dropped[0].kind, "no_evidence");
});

test("the same cell proposed twice lands once", () => {
  const one = {
    facet: "size",
    level: "one_table",
    evidence: "eight chairs round one table",
    confidence: 0.8,
  };
  const parsed = extractFrom({ ...READ, raw: { facets: [one, one] } });
  assert.ok(parsed.ok);
  assert.equal(parsed.extract.facets.length, 1);
  assert.equal(parsed.dropped[0].kind, "duplicate");
});

test("an empty reading is legal and is not an error", () => {
  const parsed = extractFrom({
    ...READ,
    raw: { facets: [], venue: [], tone: [], objects: [] },
  });
  assert.ok(parsed.ok);
  assert.deepEqual(parsed.extract.facets, []);
  assert.equal(parsed.extract.outcome, "read");
  assert.equal(parsed.dropped.length, 0);
});

test("a reply that is not an object is silence, never a repair", () => {
  for (const raw of ["{}", null, 7, [1, 2]]) {
    const parsed = extractFrom({ ...READ, raw });
    assert.ok(!parsed.ok, `${JSON.stringify(raw)} parsed as a reading`);
    assert.ok(parsed.silence.length > 0);
  }
});

/* ══ 4 · THE SEAM: ONLY HER OWN PLACE MAY PRUNE ═════════════════════ */

test("mayPrune is true for exactly one role and for no null", () => {
  assert.equal(mayPrune("place_she_has"), true);
  assert.equal(mayPrune("evening_she_wants"), false);
  assert.equal(mayPrune("object_to_find"), false);
  assert.equal(mayPrune(null), false);
  assert.equal(mayPrune(undefined), false);
});

test("a venue cue off a picture that is not her place is dropped, not filtered", () => {
  const raw = {
    facets: [],
    venue: [{ affordance: "requires_open_flame", evidence: "a lit fire pit" }],
  };
  const taste = extractFrom({ ...READ, raw });
  assert.ok(taste.ok);
  assert.deepEqual(
    taste.extract.venue,
    [],
    "a Pinterest terrace became evidence about her house"
  );
  assert.equal(taste.extract.mayPrune, false);

  const hers = extractFrom({ ...READ, role: "place_she_has", raw });
  assert.ok(hers.ok);
  assert.equal(hers.extract.venue.length, 1);
  assert.equal(hers.extract.mayPrune, true);
});

test("mayPrune never comes from the reply", () => {
  const parsed = extractFrom({
    ...READ,
    raw: { facets: [], mayPrune: true, may_prune: true, role: "place_she_has" },
  });
  assert.ok(parsed.ok);
  assert.equal(parsed.extract.mayPrune, false);
  assert.equal(parsed.extract.role, "evening_she_wants");
});

test("a silent extract carries its reason and proposes nothing", () => {
  const silent = silentExtract("the reader declined this frame");
  assert.equal(silent.outcome, "silent");
  assert.equal(silent.silence, "the reader declined this frame");
  assert.deepEqual(silent.facets, []);
  assert.equal(silent.mayPrune, false);
});

/* ══ 5 · THE MERGE RULE — AND IT DOES NOT AVERAGE ═══════════════════ */

const claim = (
  facet: string,
  level: string,
  status: DecidedClaim["status"]
): DecidedClaim => ({ facet: facet as MatrixFacet, level, status });

function facetOf(set: ReturnType<typeof mergeSet>, facet: string) {
  const found = set.facets.find((entry) => entry.facet === facet);
  assert.ok(found, `${facet} missing from the set`);
  return found;
}

test("one kept claim states the column", () => {
  const set = mergeSet("a", [], [claim("dress", "dressed", "accepted")]);
  const dress = facetOf(set, "dress");
  assert.equal(dress.state, "stated");
  assert.equal(dress.state === "stated" ? dress.level : null, "dressed");
});

test("two kept claims that disagree state NOTHING, and do not vote", () => {
  const set = mergeSet(
    "a",
    [],
    [
      claim("dress", "dressed", "accepted"),
      claim("dress", "dressed", "accepted"),
      claim("dress", "dressed", "accepted"),
      claim("dress", "plain", "accepted"),
    ]
  );
  assert.deepEqual(set.conflicts, ["dress"]);
  const dress = facetOf(set, "dress");
  assert.equal(
    dress.state,
    "conflict",
    "three-to-one became a majority. The founder: do not average."
  );
  assert.equal(dress.level, null, "a conflicted column carried a level");
});

test("a struck claim does not contradict a kept one", () => {
  const set = mergeSet(
    "a",
    [],
    [claim("dress", "dressed", "accepted"), claim("dress", "plain", "struck")]
  );
  assert.deepEqual(set.conflicts, []);
  assert.equal(facetOf(set, "dress").state, "stated");
});

test("proposals nobody has read state nothing", () => {
  const set = mergeSet("a", [], [claim("volume", "quiet", "proposed")]);
  assert.equal(facetOf(set, "volume").state, "pending");
  assert.equal(set.conflicts.length, 0);
});

test("every claim struck leaves the column struck, not untouched", () => {
  const set = mergeSet("a", [], [claim("food", "cooked", "struck")]);
  assert.equal(facetOf(set, "food").state, "struck");
});

test("a column nobody proposed is untouched, and all nine are present", () => {
  const set = mergeSet("a", [], []);
  assert.equal(set.facets.length, MATRIX_FACETS.length);
  for (const entry of set.facets) assert.equal(entry.state, "untouched");
});

test("the default status is silence, so an unlabelled row states nothing", () => {
  assert.equal(DEFAULT_STATUS, "silent");
  const set = mergeSet("a", [], [claim("size", "crowd", "silent")]);
  assert.equal(facetOf(set, "size").state, "struck");
});

/* ══ 6 · WHAT SHE READS ═════════════════════════════════════════════ */

test("every proposable cell has a sentence a member can read", () => {
  for (const facet of PROPOSABLE_FACETS) {
    for (const level of MATRIX_LEVELS[facet]) {
      const said = saidAs(facet, level);
      assert.notEqual(
        said,
        `${facet} = ${level}`,
        `${facet}/${level} has no member-facing sentence, so she would be ` +
          `shown a column name and asked to strike it`
      );
      assert.ok(said.length > 3);
    }
  }
});

test("no refused column has a member sentence — there is nothing to show her", () => {
  for (const facet of Object.keys(NEVER_FROM_A_PHOTO)) {
    assert.equal(
      CELL_SAID[facet],
      undefined,
      `${facet} has member-facing copy for a claim that can never exist`
    );
  }
});

/* ══ 7 · THE MIGRATION AND THE CODE ARE ONE LIST ════════════════════ */

test("db/064's facet CHECK is exactly PROPOSABLE_FACETS", () => {
  const found = SQL.match(/check \(facet in \(([^)]*)\)\)/);
  assert.ok(found, "db/064 no longer constrains `facet`");
  const inSql = [...found[1].matchAll(/'([a-z_]+)'/g)].map((m) => m[1]).sort();
  assert.deepEqual(
    inSql,
    [...PROPOSABLE_FACETS].sort(),
    "the migration and PROPOSABLE_FACETS disagree about which columns a " +
      "photograph may propose"
  );
});

test("db/064's level CHECK is exactly the matrix's levels for those six", () => {
  const block = SQL.slice(
    SQL.indexOf("constraint photo_claim_level_belongs_to_facet"),
    SQL.indexOf("-- WHAT IN THE FRAME SAYS SO")
  );
  assert.ok(block.length > 100, "the level constraint has moved or gone");
  for (const facet of PROPOSABLE_FACETS) {
    const clause = block.match(
      new RegExp(`facet = '${facet}'\\s+and level in \\(([^)]*)\\)`)
    );
    assert.ok(clause, `db/064 does not constrain ${facet}'s levels`);
    const inSql = [...clause[1].matchAll(/'([a-z_]+)'/g)].map((m) => m[1]);
    assert.deepEqual(
      inSql.sort(),
      [...MATRIX_LEVELS[facet]].sort(),
      `${facet}'s levels differ between db/064 and the matrix`
    );
  }
});

test("db/064 declares no destination column, in any spelling", () => {
  // Comments and `comment on` bodies argue about destinations at length and
  // must keep doing so — rule 23: state the fact at every place the wrong
  // reading would be made. What is forbidden is a DECLARATION or a REFERENCE.
  const code = SQL.split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n")
    // Drop every `comment on ... is '...';` body, which is prose in the
    // database and is where the founder's argument is kept.
    .replace(/comment on [\s\S]*?;\n/g, "");
  for (const forbidden of [
    /\bworld_id\b/,
    /references\s+world\b/,
    /\bdestination\b/,
    /\bslug\b/,
  ]) {
    assert.ok(
      !forbidden.test(code),
      `db/064 declares ${forbidden}. A photograph proposes cells; which room ` +
        `they reach is stage 4's arithmetic and the founder's signature.`
    );
  }
});

test("db/064 makes the seam a constraint, not a comment", () => {
  assert.match(SQL, /check \(may_prune = false or role = 'place_she_has'\)/);
  assert.match(SQL, /check \(may_prune = true or venue = '\[\]'::jsonb\)/);
  assert.match(SQL, /photo_claim_member_strike_wins/);
  assert.match(SQL, /check \(ordinal between 1 and 7\)/);
});

test("the cap in the migration is the cap in the code", () => {
  assert.equal(MAX_PHOTOS, 7);
  assert.ok(SQL.includes("check (ordinal between 1 and 7)"));
});

test("the trigger refuses both halves of lifting her strike", () => {
  const fn = SQL.slice(
    SQL.indexOf("function photo_claim_member_strike_wins"),
    SQL.length
  );
  assert.match(fn, /new\.member_struck_at is null/);
  assert.match(fn, /new\.status = 'accepted'/);
});

/* ══ 8 · NO SURFACE IN THIS FEATURE CAN NAME A ROOM ═════════════════ */

const SURFACES = [
  "src/lib/photo-extract.ts",
  "src/lib/photo-read.ts",
  "src/lib/photo-store.ts",
  "src/lib/photos-member.ts",
  "src/lib/desk/photos.ts",
  "src/lib/desk/photo-queue.ts",
  "src/app/desk/(signed-in)/photos/page.tsx",
  "src/app/desk/(signed-in)/photos/actions.ts",
  "src/app/apply/photos/page.tsx",
  "src/app/apply/photos/actions.ts",
];

test("no file in this feature reads or writes a destination", () => {
  for (const surface of SURFACES) {
    const source = readFileSync(`${ROOT}${surface}`, "utf8");
    // Comments argue about destinations at length and must keep doing so
    // (rule 23: state the fact where the wrong reading would be made). It is
    // the CODE that may not name one.
    const code = source
      .split("\n")
      .filter(
        (line) =>
          !line.trimStart().startsWith("*") &&
          !line.trimStart().startsWith("//") &&
          !line.trimStart().startsWith("/*")
      )
      .join("\n");
    for (const forbidden of ["world_facet", "from world", "world_id", "DESTINATIONS"]) {
      assert.ok(
        !code.includes(forbidden),
        `${surface} names ${forbidden} in code. The founder: "Do not add ` +
          `destination: string | null. A nullable slug is an invitation."`
      );
    }
  }
});

test("the desk exports no bulk keep, and nothing that takes a room", () => {
  const source = readFileSync(`${ROOT}src/lib/desk/photos.ts`, "utf8");
  const exported = [...source.matchAll(/^export (?:async )?function (\w+)/gm)].map(
    (m) => m[1]
  );
  assert.deepEqual(
    exported.sort(),
    ["keepClaim", "photoQueue", "photoQueueFor", "setPhotoRole", "strikeClaim"],
    "the photo desk has grown a function. If it is a bulk keep, the founder's " +
      "answer is already written: a bulk keep on seven pictures is how " +
      "`arrival: assigned` sneaks in."
  );
});

/* ══ 9 · THE QUEUE'S ORDER ══════════════════════════════════════════ */

const NIGHT = {
  occasion: "birthday",
  environment: "my_home",
  budget: "band_2",
  howItEnds: "dissolves",
  mealTime: "dinner",
  tasteDirections: [],
  groupFun: [],
  antiPreferences: [],
};

function application(
  id: string,
  over: Partial<QueueApplication> = {}
): QueueApplication {
  return {
    id,
    email: `${id}@example.test`,
    createdAt: `2026-09-0${id.length}T00:00:00.000Z`,
    night: NIGHT,
    photos: [],
    claims: [],
    ...over,
  };
}

const EXTRACT = {
  id: "e",
  version: "photo-extract-1",
  model: "test",
  role: null,
  mayPrune: false,
  outcome: "read" as const,
  silence: null,
  palette: [],
  venue: [],
  tone: [],
  objects: [],
  dropped: [],
  readAt: "2026-09-05T00:00:00.000Z",
};

test("the bands are the founder's order, and a conflict outranks everything", () => {
  const conflict = application("a", {
    claims: [
      {
        id: "1",
        photoId: "p",
        facet: "dress" as MatrixFacet,
        level: "dressed",
        evidence: "x",
        status: "accepted",
        memberStruck: false,
        confidence: 0,
      },
      {
        id: "2",
        photoId: "p",
        facet: "dress" as MatrixFacet,
        level: "plain",
        evidence: "y",
        status: "accepted",
        memberStruck: false,
        confidence: 0,
      },
    ],
    photos: [
      {
        id: "p",
        ordinal: 1,
        filename: "",
        role: "place_she_has",
        extract: {
          ...EXTRACT,
          role: "place_she_has",
          mayPrune: true,
          venue: [{ affordance: "requires_outdoors" as const, evidence: "sky" }],
        },
      },
    ],
  });
  assert.equal(bandOf(conflict).band, "conflict");

  const herPlace = application("bb", {
    photos: [
      {
        id: "p",
        ordinal: 1,
        filename: "",
        role: "place_she_has",
        extract: {
          ...EXTRACT,
          role: "place_she_has",
          mayPrune: true,
          venue: [{ affordance: "requires_outdoors" as const, evidence: "sky" }],
        },
      },
    ],
  });
  assert.equal(bandOf(herPlace).band, "her_place");

  const fingerprint = application("ccc", {
    photos: [
      {
        id: "p",
        ordinal: 1,
        filename: "",
        role: "evening_she_wants",
        extract: {
          ...EXTRACT,
          dropped: [
            { kind: "fingerprint" as const, facet: "arrival", said: "arrival" },
          ],
        },
      },
    ],
  });
  const ranked = bandOf(fingerprint);
  assert.equal(ranked.band, "fingerprint");
  assert.deepEqual(ranked.reachedFor, ["arrival"]);

  const proposals = application("dddd", {
    claims: [
      {
        id: "3",
        photoId: "p",
        facet: "size" as MatrixFacet,
        level: "crowd",
        evidence: "z",
        status: "proposed",
        memberStruck: false,
        confidence: 0,
      },
    ],
  });
  assert.equal(bandOf(proposals).band, "proposals");

  const objects = application("eeeee", {
    photos: [
      {
        id: "p",
        ordinal: 1,
        filename: "",
        role: "object_to_find",
        extract: {
          ...EXTRACT,
          objects: [{ object: "a low brass lamp", evidence: "on the table" }],
        },
      },
    ],
  });
  assert.equal(bandOf(objects).band, "objects");

  assert.equal(bandOf(application("ffffff")).band, "settled");

  const order = sortQueue([
    application("ffffff"),
    objects,
    proposals,
    fingerprint,
    herPlace,
    conflict,
  ]).map((row) => row.band);
  assert.deepEqual(order, [
    "conflict",
    "her_place",
    "fingerprint",
    "proposals",
    "objects",
    "settled",
  ]);
});

test("a venue cue on a picture that is not her place does not reach her_place", () => {
  const borrowed = application("g", {
    photos: [
      {
        id: "p",
        ordinal: 1,
        filename: "",
        role: "evening_she_wants",
        extract: {
          ...EXTRACT,
          venue: [{ affordance: "requires_outdoors" as const, evidence: "sky" }],
        },
      },
    ],
  });
  assert.notEqual(bandOf(borrowed).band, "her_place");
});

/* ══ 10 · THE NUMBERS THE FOUNDER SET ═══════════════════════════════ */

test("the frame the model reads is 1280 on its long edge, not the bank's 1600", () => {
  assert.equal(PHOTO_LONG_EDGE, 1280);
  const bank = readFileSync(`${ROOT}src/lib/desk/images.ts`, "utf8");
  assert.ok(
    bank.includes("export const LONG_EDGE = 1600"),
    "the image bank's own edge moved; the two are separate decisions and " +
      "this test exists so a change to one is a change somebody made on purpose"
  );
});

test("the palette is never asked of the model", () => {
  const schema = JSON.stringify(extractTool()).toLowerCase();
  for (const forbidden of ["palette", "colour", "color", "hex", "#"]) {
    assert.ok(
      !schema.includes(forbidden),
      `the tool asks for ${forbidden}. The founder: VLMs invent #C4A574. ` +
        `Count pixels.`
    );
  }
});

test("the reader is asked once and never retried", () => {
  const source = readFileSync(`${ROOT}src/lib/photo-read.ts`, "utf8");
  const code = source
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("*") && !line.trimStart().startsWith("//"))
    .join("\n");
  assert.ok(
    !/for\s*\(.*attempt/.test(code),
    "src/lib/photo-read.ts has grown a retry loop. The founder: a retry that " +
      "'just works' is how `assigned` appears."
  );
  assert.equal((code.match(/messages\.create/g) ?? []).length, 1);
  assert.match(code, /temperature: 0/);
  assert.match(code, /tool_choice: \{ type: "tool"/);
});

test("nothing in this feature adds a fedBy entry", () => {
  // CLAUDE.md rule 15, and the founder's own condition: accepted cells wait
  // for a supplier. Until one is written, an extract is a proposal on a desk.
  //
  // Asserted as "no supplier names a photograph" rather than as an exact list
  // of the fed columns. The exact list belongs to whoever is wiring the
  // ranker and moves for reasons that have nothing to do with pictures; a
  // test here that fires on their work would be noise, and noise is how a
  // guard stops being read.
  const fedBy = MATRIX.fedBy as unknown as Record<
    string,
    { field?: string | null } | string
  >;
  for (const [column, entry] of Object.entries(fedBy)) {
    if (column === "note" || typeof entry === "string") continue;
    const field = entry.field ?? "";
    assert.ok(
      !/photo|picture|image/i.test(field),
      `${column} is fed by ${field}. A photograph-supplied column is a ` +
        `founder's decision and this feature deliberately did not make it.`
    );
  }
  // And the three a photograph may never propose must have no photo supplier
  // by construction — they are not even in the tool.
  for (const facet of Object.keys(NEVER_FROM_A_PHOTO)) {
    assert.ok(!PROPOSABLE_FACETS.includes(facet as MatrixFacet));
  }
});

/* ══ 11 · THE BENCH ═════════════════════════════════════════════════ */

test("the bench is thirty cases, ten of each group", () => {
  assert.equal(GOLD_SET.length, 30);
  for (const group of GOLD_GROUPS) {
    assert.equal(
      GOLD_SET.filter((entry) => entry.group === group).length,
      10,
      `${group} is not ten cases. A bench that has quietly lost four still ` +
        `prints a percentage.`
    );
  }
  assert.equal(new Set(GOLD_SET.map((entry) => entry.id)).size, 30);
});

test("every trap has its invitation written, which is what a trap is", () => {
  const traps = GOLD_SET.filter((entry) => entry.group === "trap");
  for (const trap of traps) {
    assert.ok(trap.brief.length > 60, `${trap.id} has no design written`);
  }
  // The founder's three, by their shape rather than by their words.
  const byId = new Map(traps.map((trap) => [trap.id, trap]));
  assert.deepEqual([...(byId.get("trap-01")?.mustNotPropose ?? [])], ["dress"]);
  assert.deepEqual([...(byId.get("trap-02")?.mustNotPropose ?? [])], ["spectacle"]);
  assert.ok(byId.get("trap-03")?.brief.includes("beach"));
  // At least half the group must be scoreable before anybody labels anything;
  // otherwise the trap group is a list of pictures rather than a measurement.
  const scoreable = traps.filter((trap) => trap.mustNotPropose.length > 0);
  assert.ok(scoreable.length >= 5, `${scoreable.length} traps score unlabelled`);
});

test("nothing in the bench is labelled by a machine", () => {
  // Rule 8, at the bench: the ground truth is the founder's, and an entry
  // that arrived pre-labelled would be the reader marking its own paper.
  assert.equal(
    GOLD_SET.filter((entry) => entry.labelled).length,
    0,
    "a case is labelled. If she wrote it, delete this assertion and say so in " +
      "docs/photo-gold-set.md. If a script wrote it, the bench is now measuring " +
      "the reader against the reader."
  );
});

function reading(over: Partial<PhotoExtract> = {}): PhotoExtract {
  return { ...silentExtract("none"), outcome: "read", silence: null, ...over };
}

test("a proposal on a trap's invited column is a false positive", () => {
  const trap = GOLD_SET.find((entry) => entry.id === "trap-01");
  assert.ok(trap);
  const s = score([
    {
      photo: trap,
      extract: reading({
        facets: [
          {
            facet: "dress" as MatrixFacet,
            level: "dressed",
            evidence: "marble",
            confidence: 0.9,
          },
        ],
      }),
    },
  ]);
  assert.equal(s.falsePositives, 1);
  assert.equal(s.falsePositiveRate, 1);
  assert.equal(s.silencePrecision, 0);
});

test("silence on a trap's invited column is the whole point", () => {
  const trap = GOLD_SET.find((entry) => entry.id === "trap-01");
  assert.ok(trap);
  const s = score([{ photo: trap, extract: reading() }]);
  assert.equal(s.falsePositives, 0);
  assert.equal(s.silencePrecision, 1);
  assert.equal(s.falsePositiveRate, null, "nothing was proposed to rate");
});

test("an unlabelled case contributes nothing to precision or recall", () => {
  const evening = GOLD_SET.find((entry) => entry.id === "evening-01");
  assert.ok(evening);
  const s = score([
    {
      photo: evening,
      extract: reading({
        facets: [
          {
            facet: "size" as MatrixFacet,
            level: "one_table",
            evidence: "one table",
            confidence: 1,
          },
        ],
      }),
    },
  ]);
  assert.equal(s.labelled, 0);
  assert.equal(s.hits, 0);
  assert.equal(s.misses, 0);
  assert.equal(s.scoredProposals, 0);
  assert.equal(s.recall, null);
});

test("a labelled case scores hits, misses and the columns left silent", () => {
  const evening = GOLD_SET.find((entry) => entry.id === "evening-01");
  assert.ok(evening);
  const labelled = {
    ...evening,
    labelled: true,
    expected: [
      { facet: "size" as MatrixFacet, level: "one_table" },
      { facet: "volume" as MatrixFacet, level: "one_conversation" },
    ],
  };
  const s = score([
    {
      photo: labelled,
      extract: reading({
        facets: [
          {
            facet: "size" as MatrixFacet,
            level: "one_table",
            evidence: "one table",
            confidence: 1,
          },
          {
            facet: "dress" as MatrixFacet,
            level: "dressed",
            evidence: "guessed",
            confidence: 0.4,
          },
        ],
      }),
    },
  ]);
  assert.equal(s.hits, 1);
  assert.equal(s.misses, 1, "volume was labelled and nobody proposed it");
  assert.equal(s.falsePositives, 1, "dress was invented");
  assert.equal(s.scoredProposals, 2);
  assert.equal(s.recall, 0.5);
  // Four proposable columns were not labelled; `dress` is one of them and was
  // proposed, so three of four were correctly silent.
  assert.equal(s.shouldBeSilent, 4);
  assert.equal(s.wereSilent, 3);
});

test("the seam is checked on every bench case and a breach is not a score", () => {
  const evening = GOLD_SET.find((entry) => entry.id === "evening-01");
  const place = GOLD_SET.find((entry) => entry.id === "place-01");
  assert.ok(evening && place);

  const clean = score([
    { photo: evening, extract: reading({ role: "evening_she_wants" }) },
    { photo: place, extract: reading({ role: "place_she_has", mayPrune: true }) },
  ]);
  assert.equal(clean.seamBreaches, 0);

  const breached = score([
    // A taste frame that came back able to prune. That is the whole seam.
    { photo: evening, extract: reading({ mayPrune: true }) },
    // And a taste frame carrying a venue cue.
    {
      photo: evening,
      extract: reading({
        venue: [{ affordance: "requires_outdoors" as const, evidence: "sky" }],
      }),
    },
  ]);
  assert.equal(breached.seamBreaches, 2);
});

test("schema validity is counted apart from claim correctness", () => {
  const trap = GOLD_SET.find((entry) => entry.id === "trap-07");
  assert.ok(trap);
  const s = score([
    {
      photo: trap,
      extract: reading(),
      drops: [
        { kind: "fingerprint" },
        { kind: "not_a_level" },
      ],
    },
  ]);
  assert.equal(s.dropped, 2);
  assert.equal(s.fingerprintAttempts, 1);
  // And none of that moved the claim numbers.
  assert.equal(s.falsePositives, 0);
  assert.equal(s.hits, 0);
});

test("a silent reading is reported with its reason, not as a zero", () => {
  const evening = GOLD_SET.find((entry) => entry.id === "evening-01");
  assert.ok(evening);
  const s = score([
    { photo: evening, extract: silentExtract("the reader declined this frame") },
  ]);
  assert.equal(s.read, 0);
  assert.equal(s.silences.length, 1);
  assert.match(s.silences[0], /evening-01: the reader declined/);
});
