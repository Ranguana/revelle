/**
 * Four job types that do nothing, so that everything around them can be proved
 * before there is anything real to run.
 *
 * The generation layer does not exist yet — that is the point of building this
 * first. But a queue is only as trustworthy as the evidence that it claims
 * exactly once, hands a dead runner's work back, backs off, gives up visibly,
 * and reports a parent's progress while one of its pieces is misbehaving. None
 * of that can be demonstrated with an empty registry, and all of it is
 * demonstrated with these.
 *
 * They are registered only when JOBS_FIXTURES=on (see index.ts), so production
 * carries the code but not the types. The tests register them directly.
 *
 * When generation lands it registers `revelle.generate` and its pieces against
 * the same registry, and none of the machinery changes.
 */

import {
  done,
  waiting,
  type Handler,
  type JsonObject,
  type JsonValue,
} from "./types.ts";
import type { Registry } from "./registry.ts";

function number(payload: JsonObject, key: string, fallback: number): number {
  const value = payload[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/** Succeeds immediately, echoing its payload as its result. The happy path. */
export const echo: Handler = async (ctx) =>
  done({ echoed: ctx.job.payload, attempt: ctx.job.attempts });

/**
 * Always throws. Exercises backoff and the terminal failed state, and — because
 * the message comes from the payload — lets a test assert that the exact error
 * it threw is the error a human would read off the row.
 */
export const alwaysFails: Handler = async (ctx) => {
  const message = ctx.job.payload.message;
  throw new Error(
    typeof message === "string" ? message : "fixture.fail always fails"
  );
};

/**
 * Fails until `succeedOnAttempt`. The retry story in one handler: the same
 * piece failing, backing off, and then working, without its siblings noticing.
 */
export const flaky: Handler = async (ctx) => {
  const target = number(ctx.job.payload, "succeedOnAttempt", 2);
  if (ctx.job.attempts < target) {
    throw new Error(
      `fixture.flaky is set to succeed on attempt ${target}; this is attempt ${ctx.job.attempts}`
    );
  }
  return done({ succeededOnAttempt: ctx.job.attempts });
};

/**
 * The fan-out, and the shape every generation job will have.
 *
 * Wave one: enqueue `pieces` children and return waiting. Wave two — which the
 * runner only reaches because the database woke the parent when the last piece
 * settled — read the pieces' results and join them.
 *
 * The two waves are told apart by asking whether this job has any pieces yet,
 * rather than by a marker in the payload. A handler that has to remember to
 * write down which phase it is in is a handler that will one day forget.
 */
export const fanOut: Handler = async (ctx) => {
  const existing = await ctx.pieces();

  if (existing.length === 0) {
    const count = number(ctx.job.payload, "pieces", 3);
    // Which piece, if any, should need a second go. Lets a test watch the
    // parent report honestly while one child retries and the others are done.
    const flakyIndex = number(ctx.job.payload, "flakyIndex", -1);
    const failIndex = number(ctx.job.payload, "failIndex", -1);

    const ids: string[] = [];
    for (let i = 0; i < count; i += 1) {
      const type =
        i === failIndex
          ? "fixture.fail"
          : i === flakyIndex
            ? "fixture.flaky"
            : "fixture.echo";
      const piece = await ctx.piece({
        type,
        payload: { index: i, succeedOnAttempt: 2 },
        leaseSeconds: 30,
      });
      ids.push(piece.id);
    }
    return waiting(ids);
  }

  const results: JsonValue[] = existing.map((piece) => ({
    type: piece.type,
    result: piece.result,
  }));
  return done({ joined: results });
};

export function registerFixtures(registry: Registry): Registry {
  registry.register("fixture.echo", { handle: echo, leaseSeconds: 30 });
  registry.register("fixture.fail", { handle: alwaysFails, leaseSeconds: 30 });
  registry.register("fixture.flaky", { handle: flaky, leaseSeconds: 30 });
  registry.register("fixture.fanout", { handle: fanOut, leaseSeconds: 30 });
  return registry;
}
