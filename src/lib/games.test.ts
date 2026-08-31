/**
 * THE RUNBOOKS, CHECKED WITHOUT A DATABASE.
 *
 * db/025 puts most of these rules in the schema, where they belong: a step with
 * a clock in a phase that has none is a constraint violation, and a recommended
 * game whose runbook plays the game is refused in both directions. This file
 * exists for the two things a constraint cannot do.
 *
 *   1. IT FAILS THE BUILD RATHER THAN THE SEED. A runbook that disagrees with
 *      its own duration is caught by `npm test` on a laptop with no Postgres,
 *      not by a curator running scripts/seed-games.mjs on a Tuesday.
 *   2. IT CHECKS THE WRITING. "Every game answers what to do when somebody will
 *      not play" and "no exclamation points" are house rules with no column.
 *
 * The clock check is the one worth reading twice. db/010's duration_minutes is
 * what the filler plans an evening against, and until the steps existed there
 * was nothing to check it against — the reverse scavenger hunt claimed
 * forty-five minutes and described sixty-seven, and nobody could have known.
 */

import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";

import {
  AMALFI_1953,
  ASPEN_1994,
  DESTINATIONS,
  OAXACA_1954,
  PALM_SPRINGS_1965,
  ST_MORITZ_1984,
} from "./destinations.ts";
import { ALL_GAMES, type Game, type RunbookPhase, type TroubleKind } from "./games.ts";
import type { Destination } from "./tokens.ts";

/** db/025's runbook_phase, in position order. */
const PHASES: readonly RunbookPhase[] = [
  "before",
  "underway",
  "opening",
  "playing",
  "deciding",
  "ending",
];

/** The phases db/025 marks on_the_clock. */
const CLOCKED: ReadonlySet<RunbookPhase> = new Set([
  "opening",
  "playing",
  "deciding",
  "ending",
]);

/** The phases db/025 marks reproduces_play — refused for a recommended game. */
const PLAYS: ReadonlySet<RunbookPhase> = new Set([
  "underway",
  "playing",
  "deciding",
]);

/** runbook_trouble_kind.universal. Every game with a runbook answers these. */
const UNIVERSAL: readonly TroubleKind[] = [
  "will_not_play",
  "under_minimum",
  "running_long",
  "played_before",
];

const each = (fn: (game: Game) => void) => {
  for (const game of ALL_GAMES) fn(game);
};

test("every game has a runbook, and it starts, runs and ends", () => {
  each((game) => {
    const phases = new Set(game.runbook.steps.map((s) => s.phase));
    for (const need of ["before", "opening", "ending"] as const) {
      assert.ok(
        phases.has(need),
        `${game.slug} has no "${need}" step. A host who has never seen it ` +
          `cannot run it without one.`
      );
    }
  });
});

test("a phase's steps are contiguous, because the page prints one heading per phase", () => {
  /*
   * THE ORDER IS THE CURATOR'S, NOT THE VOCABULARY'S, and this test is what
   * that costs.
   *
   * runbook_phase.position is the canonical order of the VOCABULARY, and it is
   * not the order of every runbook — because the two games with an `underway`
   * phase want it on opposite sides of `opening`. The secret cards are drawn at
   * the door and then the night runs. The auction's money is paid out for four
   * hours before anybody calls the room. Both are true, and a fixed phase order
   * would have to make one of them lie.
   *
   * So `position` is the array index and the page renders in it. The only rule
   * is that a phase does not come back: one heading per phase, in the order the
   * curator wrote them, and no step of "Getting the room" three steps after
   * "The ending".
   */
  each((game) => {
    const seen = new Set<RunbookPhase>();
    let previous: RunbookPhase | null = null;
    for (const step of game.runbook.steps) {
      assert.ok(
        PHASES.includes(step.phase),
        `${game.slug}/${step.step}: unknown phase "${step.phase}"`
      );
      if (step.phase === previous) continue;
      assert.ok(
        !seen.has(step.phase),
        `${game.slug}/${step.step} returns to "${step.phase}" after leaving ` +
          `it. The page prints one heading per phase.`
      );
      seen.add(step.phase);
      previous = step.phase;
    }
  });
});

test("a step code is unique within its game", () => {
  each((game) => {
    const seen = new Set<string>();
    for (const step of game.runbook.steps) {
      assert.ok(!seen.has(step.step), `${game.slug}: duplicate step ${step.step}`);
      seen.add(step.step);
    }
  });
});

test("a step points at supplies and printed matter that exist", () => {
  // The anti-duplication mechanism, and the reason a runbook does not restate
  // what a canvas is or when it had to be bought. db/025 refuses a dangling
  // pointer too; this is the same failure caught a day earlier.
  each((game) => {
    const supplies = new Set(game.supplies.map((s) => s.item));
    const pieces = new Set(game.printedMatter.map((p) => p.piece));
    for (const step of game.runbook.steps) {
      if (step.supplyItem !== undefined) {
        assert.ok(
          supplies.has(step.supplyItem),
          `${game.slug}/${step.step} points at a supply it does not have: ` +
            `"${step.supplyItem}"`
        );
      }
      if (step.printedPiece !== undefined) {
        assert.ok(
          pieces.has(step.printedPiece),
          `${game.slug}/${step.step} hands out printed matter it does not ` +
            `have: "${step.printedPiece}"`
        );
      }
    }
  });
});

test("only a phase with a clock carries minutes", () => {
  each((game) => {
    for (const step of game.runbook.steps) {
      if (step.minutes === undefined) continue;
      assert.ok(
        CLOCKED.has(step.phase),
        `${game.slug}/${step.step} is in "${step.phase}" and has a clock. ` +
          `Time before anyone arrives does not come out of the evening.`
      );
    }
  });
});

test("an ambient game has no clock anywhere — it runs as long as the evening", () => {
  each((game) => {
    if (game.shape !== "ambient") return;
    for (const step of game.runbook.steps) {
      assert.equal(
        step.minutes,
        undefined,
        `${game.slug}/${step.step} puts a clock on an ambient game.`
      );
    }
  });
});

test("A RECOMMENDED GAME'S RUNBOOK IS THE HOUSE'S OWN PART ONLY", () => {
  // The line db/010 draws for printed matter, drawn again for writing. Revelle
  // may name somebody else's game and point a host at it. It may not say how
  // that game is played or scored.
  each((game) => {
    if (game.sourcing !== "recommended") return;
    assert.equal(game.printedMatter.length, 0, `${game.slug} prints something`);
    for (const step of game.runbook.steps) {
      assert.ok(
        !PLAYS.has(step.phase),
        `${game.slug}/${step.step} is in "${step.phase}", which reproduces ` +
          `play. That is somebody else's product.`
      );
    }
  });
});

test("THE STEPS ADD UP TO WHAT THE GAME CLAIMS", () => {
  // game_runbook_clock, as a test. A runbook that says forty-five minutes and
  // describes seventy hands a host a failure at eleven o'clock, and the filler
  // has already planned an evening around the smaller number.
  each((game) => {
    if (game.sourcing === "recommended") return; // the house does not write the play
    if (game.durationMaxMinutes === undefined) return; // ambient: no block to check
    const planned = game.runbook.steps.reduce(
      (total, step) => total + (step.minutes ?? 0),
      0
    );
    assert.ok(planned > 0, `${game.slug} claims a duration and times nothing`);
    assert.ok(
      planned >= (game.durationMinutes ?? 0) && planned <= game.durationMaxMinutes,
      `${game.slug}: the runbook adds up to ${planned} minutes and the game ` +
        `claims ${game.durationMinutes}–${game.durationMaxMinutes}. Fix ` +
        `whichever one is wrong; they are not allowed to disagree.`
    );
  });
});

test("every game answers what a host actually asks at nine o'clock", () => {
  each((game) => {
    const answered = new Set(game.runbook.contingencies.map((c) => c.trouble));
    assert.equal(
      answered.size,
      game.runbook.contingencies.length,
      `${game.slug}: the same trouble is answered twice`
    );
    for (const trouble of UNIVERSAL) {
      assert.ok(
        answered.has(trouble),
        `${game.slug} has no answer for "${trouble}". A refusal, a thin room, ` +
          `a game running long and a guest who has played before can happen ` +
          `to anything in this pool.`
      );
    }
  });
});

test("a game that needs somebody to run it says she is not playing", () => {
  // db/010's host_to_run_it requirement and db/025's host_role are two halves
  // of one fact, and a game that carries the first and claims she plays too is
  // the arrangement that fails at the moment the game starts.
  const needsRunning = new Set(["reverse-scavenger-hunt", "lets-make-a-deal", "the-secret-auction"]);
  each((game) => {
    if (!needsRunning.has(game.slug)) return;
    assert.equal(
      game.runbook.hostRole,
      "runs_it",
      `${game.slug} spends a person to run it and must say so`
    );
  });
});

test("the copy brief reaches the runbooks", () => {
  // No exclamation points, no italics, no cheerleading. Instructions are the
  // one thing in the product read under pressure; nothing in them congratulates
  // her for continuing.
  const banned = /[!*_]|\bhave fun\b|\bdon't worry\b|\benjoy\b/i;
  each((game) => {
    const lines: string[] = [];
    for (const step of game.runbook.steps) {
      lines.push(step.instruction, step.detail ?? "", step.say ?? "");
    }
    for (const c of game.runbook.contingencies) lines.push(c.answer);
    lines.push(game.runbook.hostNote ?? "");

    for (const line of lines) {
      assert.ok(
        !banned.test(line),
        `${game.slug}: "${line.slice(0, 60)}…" breaks docs/copy-brief.md`
      );
    }
  });
});

test("instructions are imperatives short enough to read at a glance", () => {
  // The line she finds when she looks down at a phone mid-sentence. A
  // paragraph in this field is a paragraph she reads while eleven people wait.
  each((game) => {
    for (const step of game.runbook.steps) {
      assert.ok(
        step.instruction.length <= 110,
        `${game.slug}/${step.step}: the instruction is ${step.instruction.length} ` +
          `characters. Put the rest in detail.`
      );
    }
  });
});

/* ═══════════════════════════════════════════════════════════════════
 * THE SEEDER'S HARD FAILURES, BROUGHT FORWARD TO A LAPTOP
 *
 * CLAUDE.md rule 12's corollary: a seeder's first real use is its first test
 * unless somebody forces an earlier one. `initdb` does not run on every
 * machine and the production database is unreachable from any laptop
 * (`ipAllowList: []`, rule 9), so a dry run against a real schema is not
 * available to most people who will edit src/lib/games.ts. Every check below
 * is one scripts/seed-games.mjs or the database would make, made here instead,
 * against the committed SQL rather than against a running server.
 *
 * They are deliberately parsed OUT OF db/*.sql and not restated as literals.
 * A hand-written copy of the facet vocabulary in a test file is CLAUDE.md rule
 * 19's hand-written list of pools: correct until the next insert, and then
 * wrong without being broken.
 *
 * THE TWENTY ROOM GAMES ARE WHY THIS EXISTS NOW. Seven of them are native to
 * destinations the committed chain does not create yet, so they will not be
 * exercised against a real schema for some time, and the failure they would
 * produce there — an unknown facet, a slot a shape cannot fill, a dangling
 * dependency — is a failed deploy rather than a red test.
 * ═══════════════════════════════════════════════════════════════════ */

/**
 * Every `insert into <table>` statement in db/, whole.
 *
 * The scanner respects quoted strings and line comments, which a split on ";"
 * does not: db/010's slot_kind insert contains "Everyone is playing; nobody
 * has stopped doing anything else." A naive reader truncates there, loses the
 * `finale` slot, and reports a vocabulary gap that is entirely its own. Found
 * by counting, exactly as rule 24 says it would be.
 */
function sqlStatements(head: string): string[] {
  const dir = new URL("../../db/", import.meta.url).pathname;
  const all = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => readFileSync(`${dir}${f}`, "utf8"))
    .join("\n");

  const end = (from: number): number => {
    let i = from;
    while (i < all.length) {
      const c = all[i];
      if (c === "'") {
        i += 1;
        while (i < all.length) {
          if (all[i] === "'" && all[i + 1] === "'") i += 2;
          else if (all[i] === "'") {
            i += 1;
            break;
          } else i += 1;
        }
        continue;
      }
      if (c === "-" && all[i + 1] === "-") {
        const nl = all.indexOf("\n", i);
        i = nl === -1 ? all.length : nl;
        continue;
      }
      if (c === ";") return i;
      i += 1;
    }
    return all.length;
  };

  const out: string[] = [];
  const re = new RegExp(head, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(all)) !== null) out.push(all.slice(m.index, end(m.index)));
  return out;
}

const firstOfEachTuple = (statements: string[]): string[] =>
  statements.flatMap((s) => [...s.matchAll(/\(\s*'([a-z_]+)'/g)].map((m) => m[1]));
const firstTwoOfEachTuple = (statements: string[]): string[] =>
  statements.flatMap((s) =>
    [...s.matchAll(/\(\s*'([a-z_]+)',\s*'([a-z_]+)'/g)].map((m) => `${m[1]}:${m[2]}`)
  );

/** db/002 and everything that has added to it. `dimension:code`. */
const FACETS = new Set(
  firstTwoOfEachTuple(sqlStatements("insert into facet \\(dimension_code"))
);
/** db/010 and db/050. */
const REQUIREMENT_KINDS = new Set(
  firstOfEachTuple(sqlStatements("insert into game_requirement_kind \\(code"))
);
/** db/004. */
const VOICE_PIECES = new Set(
  firstOfEachTuple(sqlStatements("insert into voice_piece_kind\\s*\\(code"))
);
/** db/009 and db/010. */
const SLOT_KINDS = new Set(
  firstOfEachTuple(sqlStatements("insert into slot_kind \\(code"))
);
/** db/010's gate, as `slot:shape`. */
const SLOT_SHAPES = new Set(
  firstTwoOfEachTuple(sqlStatements("insert into slot_shape \\(slot_code"))
);
/** db/001's occasion_type. */
const OCCASIONS = new Set(
  [
    ...(/create type occasion_type as enum \(([^)]*)\)/.exec(
      readFileSync(new URL("../../db/001-schema.sql", import.meta.url).pathname, "utf8")
    )?.[1] ?? "").matchAll(/'([a-z_]+)'/g),
  ].map((m) => m[1])
);

test("the vocabularies this file checks against were actually found", () => {
  // Rule 24 in its smallest form: a parser that matched nothing would make
  // every test below pass by having nothing to compare against, and would look
  // exactly like a clean tree. Four floors, each one under what db/ holds today.
  assert.ok(FACETS.size >= 150, `parsed ${FACETS.size} facets from db/`);
  assert.ok(REQUIREMENT_KINDS.size >= 10, `parsed ${REQUIREMENT_KINDS.size} requirement kinds`);
  assert.ok(VOICE_PIECES.size >= 9, `parsed ${VOICE_PIECES.size} voice piece kinds`);
  assert.ok(SLOT_KINDS.size >= 12, `parsed ${SLOT_KINDS.size} slot kinds`);
  assert.ok(SLOT_SHAPES.size >= 6, `parsed ${SLOT_SHAPES.size} slot/shape pairs`);
  assert.ok(OCCASIONS.size === 9, `parsed ${OCCASIONS.size} occasions`);
});

test("every facet a game claims is in the vocabulary a host answers in", () => {
  // scripts/seed-games.mjs throws on this and says why: a game tagged with a
  // term that does not exist is a game that quietly matches nobody.
  each((game) => {
    for (const tag of game.facets) {
      assert.ok(
        FACETS.has(`${tag.dimension}:${tag.code}`),
        `${game.slug} tags ${tag.dimension}:${tag.code}, which db/ does not ` +
          `define. Either the migration is missing or the vocabulary genuinely ` +
          `cannot say this yet — in which case propose the addition rather ` +
          `than inventing a private term.`
      );
      assert.ok(
        tag.weight >= -1 && tag.weight <= 1 && tag.weight !== 0,
        `${game.slug}/${tag.code}: weight ${tag.weight} is outside db/002's -1..1 excluding zero`
      );
    }
    const seen = new Set(game.facets.map((t) => `${t.dimension}:${t.code}`));
    assert.equal(seen.size, game.facets.length, `${game.slug} tags the same facet twice`);
  });
});

test("every requirement, voice piece, slot and occasion code exists in db/", () => {
  each((game) => {
    for (const r of game.requirements) {
      assert.ok(
        REQUIREMENT_KINDS.has(r.requirement),
        `${game.slug} needs "${r.requirement}", which game_requirement_kind ` +
          `does not define. It is a foreign key; the seeder fails on it.`
      );
    }
    for (const p of game.printedMatter) {
      if (p.voicePiece === undefined) continue;
      assert.ok(
        VOICE_PIECES.has(p.voicePiece),
        `${game.slug}/${p.piece} is written as a "${p.voicePiece}", which db/004 does not define`
      );
    }
    for (const s of game.slots) {
      assert.ok(SLOT_KINDS.has(s.slotCode), `${game.slug} claims unknown slot "${s.slotCode}"`);
    }
    for (const o of game.occasions) {
      assert.ok(OCCASIONS.has(o.occasion), `${game.slug} claims unknown occasion "${o.occasion}"`);
    }
  });
});

test("A GAME NEVER CLAIMS A SLOT ITS SHAPE CANNOT FILL", () => {
  // db/010's slot_shape gate, which is a constraint trigger and fires at the
  // moment a curator makes the mistake. Here it fires a day earlier. The
  // failure it prevents is the one db/010 was written for: an ambient game
  // booked into the hour a scheduled one owns, or the reverse.
  each((game) => {
    for (const claim of game.slots) {
      const declared = [...SLOT_SHAPES].some((pair) => pair.startsWith(`${claim.slotCode}:`));
      if (!declared) continue; // a slot claiming no shapes makes no claim
      assert.ok(
        SLOT_SHAPES.has(`${claim.slotCode}:${game.shape}`),
        `${game.slug} is ${game.shape} and claims the "${claim.slotCode}" ` +
          `slot, which db/010 does not let that shape fill.`
      );
    }
    if (game.shape === "ambient") {
      assert.equal(game.durationMinutes, undefined, `${game.slug} is ambient and has a duration`);
      assert.equal(game.durationMaxMinutes, undefined, `${game.slug} is ambient and has a top duration`);
    }
    assert.ok(
      !game.slots.some((s) => s.slotCode === "honouring"),
      `${game.slug} claims the honouring slot. db/010 leaves that gap VISIBLE ` +
        `on purpose — mis-tagging a party game as an honouring beat to make ` +
        `the coverage report go quiet is the actual bug.`
    );
  });
});

test("the shape of a game and the columns db/010 constrains agree", () => {
  each((game) => {
    assert.match(game.slug, /^[a-z][a-z0-9-]*$/, `${game.slug} is not a legal slug`);
    if (game.durationMinutes !== undefined && game.durationMaxMinutes !== undefined) {
      assert.ok(
        game.durationMaxMinutes >= game.durationMinutes,
        `${game.slug}: the duration range runs backwards`
      );
    }
    if (game.minGuests !== undefined && game.maxGuests !== undefined) {
      assert.ok(game.maxGuests >= game.minGuests, `${game.slug}: the guest range runs backwards`);
    }
    if (game.sourcing === "provided") {
      assert.equal(game.externalName, undefined, `${game.slug} is provided and names an external product`);
      assert.equal(game.externalUrl, undefined, `${game.slug} is provided and links an external product`);
    } else {
      assert.ok(game.externalName !== undefined, `${game.slug} is recommended and unnamed`);
    }
    for (const dep of game.dependencies) {
      assert.ok(
        ALL_GAMES.some((g) => g.slug === dep.requires),
        `${game.slug} depends on "${dep.requires}", which this module does not define`
      );
      assert.notEqual(dep.requires, game.slug, `${game.slug} depends on itself`);
      if (dep.groupKey !== undefined) {
        assert.equal(
          dep.strength,
          "required",
          `${game.slug}: db/010 refuses a group key on anything but a required dependency`
        );
      }
    }
    const supplies = new Set(game.supplies.map((s) => s.item));
    assert.equal(supplies.size, game.supplies.length, `${game.slug} lists the same supply twice`);
    for (const s of game.supplies) {
      assert.ok(
        !(s.perGuest === true && s.quantity !== undefined),
        `${game.slug}/${s.item}: db/010 refuses a fixed count on a per-head supply`
      );
    }
    const pieces = new Set(game.printedMatter.map((p) => p.piece));
    assert.equal(pieces.size, game.printedMatter.length, `${game.slug} prints the same piece twice`);
    for (const p of game.printedMatter) {
      assert.match(p.piece, /^[a-z][a-z0-9_]*$/, `${game.slug}: "${p.piece}" is not a legal piece code`);
    }
  });
});

test("ONE PRINTED PIECE PER GAME, counted in both directions", () => {
  /*
   * Founder: "for each game 1 printed matter not 3 for each game, consolidate
   * it. but again it wasnt actually done." The ruling had been made before and
   * had lived in the block comment at the top of src/lib/games.ts, which is
   * CLAUDE.md rule 20's shape — the file that describes the rule is not the
   * rule, and a paragraph does not go red.
   *
   * COUNTED IN BOTH DIRECTIONS (rule 24), because the two failures look
   * identical from outside and are opposite: a provided game that drifts back
   * to two pieces, and a provided game that has quietly lost the only one it
   * had. Zero is a real defect here — a game the house provides and prints
   * nothing for is a game with no object in the room.
   *
   * Recommended games are the other side of it and are asserted at zero in
   * "A RECOMMENDED GAME'S RUNBOOK IS THE HOUSE'S OWN PART ONLY", which is
   * where db/010's sourcing trigger is mirrored. That absence is a claim the
   * schema enforces, not the authoring gap CLAUDE.md rule 29 is about.
   */
  const provided = ALL_GAMES.filter((g) => g.sourcing === "provided");
  assert.equal(provided.length, 26, `${provided.length} provided games rather than 26`);

  for (const game of provided) {
    assert.equal(
      game.printedMatter.length,
      1,
      `${game.slug} prints ${game.printedMatter.length} pieces rather than 1. ` +
        `One artwork per game, set once in the destination's face; a game that ` +
        `needs several things at once gets one PERFORATED sheet, not several ` +
        `objects. Nothing may be dropped to reach the number.`
    );
    const [piece] = game.printedMatter;
    assert.ok(
      !(piece.perGuest === true && piece.quantity !== undefined),
      `${game.slug}/${piece.piece}: db/010 refuses a fixed count on a per-head piece`
    );
    assert.ok(
      (piece.description ?? "").length > 0,
      `${game.slug}/${piece.piece} carries everything this game prints and says ` +
        `nothing about what is on it. The description is the only place the ` +
        `merged pieces survive.`
    );
  }
});

/* ═══════════════════════════════════════════════════════════════════
 * CLAUDE.md RULE 29 — EVERY ROOM MAY HAVE GAMES
 *
 * "lets not make a blanket rule that a room is gameless", then "i told you
 * that they can have games." The three tests below are that ruling made
 * mechanical, and the first one is the one that matters: it counts, in both
 * directions, rather than trusting that twenty games were written because
 * twenty were asked for.
 * ═══════════════════════════════════════════════════════════════════ */

/** Every authored room, wired into DESTINATIONS or not. */
const ROOMS: readonly Destination[] = [
  ...Object.values(DESTINATIONS),
  AMALFI_1953,
  ASPEN_1994,
  PALM_SPRINGS_1965,
  OAXACA_1954,
  ST_MORITZ_1984,
];

/** room key -> the room's own game_rule sentences, in the order it writes them. */
const GAME_RULE_PIECES = new Map<string, string[]>(
  ROOMS.map((room) => [
    room.key,
    room.voice.exemplars.filter((e) => e.piece === "game_rule").map((e) => e.text),
  ])
);

test("EVERY GAME_RULE THE FOUNDER WROTE IS A ROW, COUNTED IN BOTH DIRECTIONS", () => {
  // Rule 24, and the reason this test is a count and not a spot check: a
  // matcher that found nineteen and a matcher that found twenty-one read
  // identically from outside. Both numbers are asserted.
  const written = [...GAME_RULE_PIECES.values()].flat();
  const scoped = ALL_GAMES.flatMap((g) =>
    g.worlds.filter((w) => w.native === true).map(() => g)
  );

  assert.equal(
    written.length,
    20,
    `src/lib/destinations.ts now carries ${written.length} game_rule pieces ` +
      `rather than 20. If a room gained one, it needs a game; if a room lost ` +
      `one, this file has a row with nothing behind it.`
  );
  assert.equal(
    scoped.length,
    20,
    `${scoped.length} games claim a native destination rather than 20`
  );

  for (const [key, rules] of GAME_RULE_PIECES) {
    const mine = ALL_GAMES.filter((g) => g.worlds.some((w) => w.world === key && w.native === true));
    assert.equal(
      mine.length,
      rules.length,
      `${key} writes ${rules.length} game_rule piece(s) and has ${mine.length} ` +
        `game(s) native to it. A room with no game row has an AUTHORING ` +
        `ABSENCE and never a property (CLAUDE.md rule 29).`
    );
  }
});

test("HER SENTENCE SURVIVES VERBATIM, character for character", () => {
  // The rule is hers and everything around it is ours, and this is the only
  // part of that separation a later edit cannot quietly drift. Each room game
  // quotes its own sentence under a fixed heading in `notes`; the quote is
  // compared to the room's own voice piece, not to another copy of itself.
  const quoted = /HER RULE, VERBATIM: "([^"]+)"/;
  let checked = 0;

  each((game) => {
    const native = game.worlds.filter((w) => w.native === true);
    if (native.length === 0) return;
    assert.equal(native.length, 1, `${game.slug} claims ${native.length} native rooms`);

    const found = quoted.exec(game.notes ?? "");
    assert.ok(
      found,
      `${game.slug} is native to a room and does not quote its rule under ` +
        `"HER RULE, VERBATIM:". That heading is how a reader tells what is ` +
        `hers from what the house added.`
    );

    const rules = GAME_RULE_PIECES.get(native[0].world);
    assert.ok(rules, `${game.slug} is native to "${native[0].world}", which is not an authored room`);
    assert.ok(
      rules.includes(found[1]),
      `${game.slug} quotes a rule that ${native[0].world} does not write:\n` +
        `  quoted: ${found[1]}\n` +
        `  the room writes: ${rules.join(" | ")}`
    );

    // And it is printed as she wrote it. The rules card is the object a guest
    // reads, so a paraphrase there is the paraphrase that reaches the table.
    const card = game.printedMatter.find((p) => p.voicePiece === "game_rule");
    assert.ok(card, `${game.slug} prints no game_rule card`);
    checked += 1;
  });

  assert.equal(checked, 20, `${checked} room games checked rather than 20`);
});

test("a room game is written for one room and says so with native, not affinity", () => {
  // CLAUDE.md rule 23, from both ends. `native` is a whitelist and `affinity`
  // is a weight that says nothing about eligibility, and the misreading of
  // that distinction produced a wrong report, a wrong ruling and two inert
  // rows in one week. THE SEVEN ORIGINAL GAMES ARE THE OTHER SIDE OF IT: they
  // carry affinities to westhampton-1976 and no native claim, so they stay
  // playable everywhere, and this test fails if anybody rescopes them.
  const original = [
    "art-battle",
    "reverse-scavenger-hunt",
    "lets-make-a-deal",
    "secret-game-cards",
    "the-secret-auction",
    "fishbowl",
    "imposter",
  ];
  for (const slug of original) {
    const game = ALL_GAMES.find((g) => g.slug === slug);
    assert.ok(game, `${slug} is gone from the module`);
    assert.ok(
      !game.worlds.some((w) => w.native === true),
      `${slug} has been given a native destination. The seven house games are ` +
        `playable everywhere and a native claim would confine them to one room.`
    );
  }

  each((game) => {
    for (const scope of game.worlds) {
      assert.ok(
        ROOMS.some((room) => room.key === scope.world),
        `${game.slug} is scoped to "${scope.world}", which src/lib/destinations.ts does not author`
      );
      assert.ok(
        !(scope.native === true && scope.forbidden === true),
        `${game.slug} is both native to and forbidden at ${scope.world}`
      );
    }
  });
});

test("no room game spends a person: rule 25's third test, mechanically", () => {
  // "NO LABOUR OR STAFF THE HOST DOES NOT HAVE." Acapulco states it
  // structurally — there is no staff in this voice, things appear and nobody
  // serves them — and Amalfi's own rule says whoever is calling is playing
  // too. A room game whose host role is runs_it has put a compere in a house
  // that has none.
  each((game) => {
    if (!game.worlds.some((w) => w.native === true)) return;
    assert.equal(
      game.runbook.hostRole,
      "plays_too",
      `${game.slug} is a room game and spends a host to run it. The host plays; ` +
        `she does not compere (CLAUDE.md rule 25).`
    );
  });
});

test("RULE 25.2, MECHANICALLY: no room's name reaches anything a guest reads", () => {
  /*
   * "NO PROPER NOUN A GUEST WOULD NOT SAY AT THE TABLE. Place names, brand
   * names and landmarks are the postcard writing itself."
   *
   * The twenty room games are the place this is most likely to fail, because
   * each one was written FROM a room and it costs one careless sentence to
   * name it. The block comment in src/lib/games.ts already claims this holds —
   * "no place name, no brand, no landmark reaches a name, a rule, a step or a
   * printed piece" — and until now the claim was a paragraph rather than a
   * check, which is CLAUDE.md rule 20's shape: the file that describes the
   * rule is not the rule.
   *
   * THE VOCABULARY IS DERIVED, NOT LISTED. Rule 19: a hand-written list of
   * place names is correct until the next room is authored. The words come
   * out of the room keys themselves, which is exactly the set that must not
   * appear, and short tokens are dropped because "new", "las", "big" and "st"
   * are English before they are anywhere.
   *
   * SLUGS AND WORLD SCOPES ARE EXEMPT and are checked nowhere here: they are
   * identifiers, they are never printed, and the same block comment says so.
   */
  const forbidden = new Set(
    ROOMS.flatMap((room) => room.key.split("-")).filter((word) => word.length >= 4)
  );
  assert.ok(forbidden.size >= 15, `derived ${forbidden.size} room words from ${ROOMS.length} rooms`);

  each((game) => {
    const read: string[] = [
      game.name,
      game.description,
      game.howItWorks,
      game.materials ?? "",
      game.scoring ?? "",
      game.caveat ?? "",
    ];
    for (const step of game.runbook.steps) {
      read.push(step.instruction, step.detail ?? "", step.say ?? "");
    }
    for (const c of game.runbook.contingencies) read.push(c.answer);
    for (const p of game.printedMatter) read.push(p.label, p.description ?? "");

    for (const text of read) {
      for (const word of text.toLowerCase().match(/[a-z0-9]+/g) ?? []) {
        assert.ok(
          !forbidden.has(word),
          `${game.slug} writes "${word}", which is part of a room's name. ` +
            `A guest reading this at the table has been handed a postcard ` +
            `(CLAUDE.md rule 25.2). Say the thing, not the place.`
        );
      }
    }
  });
});
