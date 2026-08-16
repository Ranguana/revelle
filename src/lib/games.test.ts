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
import test from "node:test";

import { ALL_GAMES, type Game, type RunbookPhase, type TroubleKind } from "./games.ts";

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
