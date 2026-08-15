import { spawn } from "node:child_process";
import { timingSafeEqual } from "node:crypto";

/**
 * Seed the catalogue, from inside Render.
 *
 * ── WHY THIS EXISTS ──────────────────────────────────────────────────
 *
 * The database has an empty ipAllowList by design: it is reachable only from
 * inside this service. Migrations run as the preDeployCommand for exactly that
 * reason. Seeding should live beside them — and in render.yaml it does — but
 * this service is not blueprint-linked, so the committed blueprint is
 * aspirational and the Render API refuses to change the command. The result
 * was a live database with a full set of migrations and none of the content:
 * an authored catalogue of thirty-three menus and twenty-three drinks that no
 * curator could see.
 *
 * So this is the same step, reachable. It is not a new capability — it runs
 * the identical npm scripts the preDeployCommand would, with the same
 * environment, on the same private network.
 *
 * ── WHY IT IS SAFE TO CALL TWICE ─────────────────────────────────────
 *
 * Every seeder is idempotent by construction and reports what it did: a re-run
 * against a current database says "0 created, 0 updated". None of them takes
 * `--overwrite`, so a curator's edit at the desk always outranks the file —
 * that decision belongs to a human and is not made by an HTTP request.
 *
 * The fixture and demo-occasion seeders are deliberately NOT here. They invent
 * test customers, and they refuse a non-local database anyway.
 *
 * ── WHY A TOKEN AND NOT A SESSION ────────────────────────────────────
 *
 * Same argument as the digest route beside it: sign-in is passwordless and
 * needs a mailbox, which is right for two people at a screen and useless for
 * anything operational. It reuses DESK_DIGEST_TOKEN rather than minting a
 * second secret — one credential, one thing to rotate.
 *
 * FAILS CLOSED. Unset means 404, not open.
 */

export const dynamic = "force-dynamic";
/** The seeders are not fast. Well inside Render's ceiling, well past the default. */
export const maxDuration = 300;

/** Exactly the preDeployCommand render.yaml carries, in order. */
const STEPS: readonly (readonly [string, ...string[]])[] = [
  ["seed:destinations"],
  ["seed:menus"],
  ["seed:drinks"],
  ["seed:games"],
  // Twice on purpose: the menu and drink seeders create a draft stub for a
  // destination that has content and no authored look, and this is what
  // completes a stub once somebody writes the voice.
  ["seed:destinations"],
];

/**
 * Offering the catalogue, which the seeders deliberately will not do.
 *
 * Everything a seeder creates is a draft, because deciding that something
 * reaches a customer is a curator's decision. This is that decision, and it is
 * a SEPARATE call — POST with {"activate": true} — so it can never happen as a
 * side effect of seeding.
 *
 * It publishes a destination only if that destination has a published voice.
 * A house with a look and no voice cannot write anything.
 */
const ACTIVATE: readonly (readonly [string, ...string[]])[] = [
  ["activate:catalogue", "--", "--yes"],
];

function sameSecret(given: string, expected: string): boolean {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  // timingSafeEqual THROWS on a length mismatch, which would leak the length
  // through the error path and turn a wrong guess into a 500.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function run(argv: readonly string[]): Promise<{ script: string; code: number; output: string }> {
  const script = argv.join(" ");
  return new Promise((resolve) => {
    const child = spawn("npm", ["run", ...argv], {
      env: process.env,
      // The repo root. Render runs the service from it, and a seeder resolves
      // docs/menus.md relative to its own file rather than to cwd, so this is
      // belt and braces.
      cwd: process.cwd(),
    });
    let output = "";
    const take = (chunk: Buffer) => {
      output += chunk.toString();
      // A runaway seeder must not be able to fill a response with megabytes.
      if (output.length > 20_000) output = output.slice(-20_000);
    };
    child.stdout.on("data", take);
    child.stderr.on("data", take);
    child.on("close", (code) => resolve({ script, code: code ?? -1, output: output.trim() }));
    child.on("error", (err) =>
      resolve({ script, code: -1, output: `failed to start: ${err.message}` })
    );
  });
}

export async function POST(request: Request): Promise<Response> {
  const expected = (process.env.DESK_DIGEST_TOKEN ?? "").trim();
  if (!expected) {
    console.warn("[seed] DESK_DIGEST_TOKEN is not set; the route is closed.");
    return new Response("Not found", { status: 404 });
  }

  const header = request.headers.get("authorization") ?? "";
  const given = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!given || !sameSecret(given, expected)) {
    return new Response("Not found", { status: 404 });
  }

  // A body is optional; a malformed one is not a reason to fail.
  const body = (await request.json().catch(() => null)) as { activate?: unknown } | null;
  const steps = body?.activate === true ? [...STEPS, ...ACTIVATE] : STEPS;

  const results: { script: string; code: number; output: string }[] = [];
  for (const step of steps) {
    const result = await run(step);
    results.push(result);
    // Stop at the first failure rather than pressing on: the later seeders
    // depend on the earlier ones having made their world rows, and a cascade
    // of failures buries the one that actually mattered.
    if (result.code !== 0) break;
  }

  const ok = results.every((r) => r.code === 0);
  return Response.json(
    { ok, steps: results },
    { status: ok ? 200 : 500, headers: { "cache-control": "no-store" } }
  );
}
