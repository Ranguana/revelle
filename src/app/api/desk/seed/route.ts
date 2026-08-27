import { spawn } from "node:child_process";
import { timingSafeEqual } from "node:crypto";

import { CATALOGUE_CHAIN, type ChainStep } from "@/lib/desk/seed-chain";

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

/**
 * The steps, from the one place that holds them.
 *
 * THIS USED TO BE AN ARRAY IN THIS FILE, under the comment "Exactly the
 * preDeployCommand render.yaml carries, in order" — which it stopped being on
 * 2026-08-23, when `seed:bank` entered render.yaml and never entered the array.
 * The button then stocked a catalogue with 180 bank rows, seventeen gestures
 * and six draft room stubs missing from it, and nothing said anything. Rule 20
 * one layer in: a list that describes what runs is not what runs.
 *
 * The list now lives in src/lib/desk/seed-chain.ts and `src/lib/deploy.test.ts`
 * compares it against render.yaml's chain, step for step and order for order.
 * The two cannot be one object — a YAML blueprint cannot import a module — so
 * the guard goes through the consumers, which is the shape CLAUDE.md rule 21
 * asks for.
 *
 * The last step is `tag:catalogue`, the post-seed tagging step. It is one
 * exported function (`tagCatalogue()`, src/lib/catalogue/tagging.ts) behind one
 * wrapper (scripts/tag-catalogue.mjs), and the deploy runs the same wrapper.
 * The founder, before it was built: "one exported function both paths invoke,
 * or the button and the deploy drift apart the day after the button existed to
 * prevent exactly that."
 */
const STEPS: readonly ChainStep[] = CATALOGUE_CHAIN;

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

/**
 * One Revelle a curator can actually open, and the link to open it with.
 *
 * Nothing connects an application to a stored Revelle for a REAL member yet —
 * generation proposes, a curator approves, and until somebody applies there is
 * nothing in the portal to look at. This composes one by hand from the real
 * authored catalogue so the screen membership actually buys can be seen.
 *
 * It creates a DEMO MEMBER and mints a working sign-in link for her, which is
 * why the script refuses a non-local database unless forced. Forcing it here is
 * deliberate and narrow: this is the only way to look at the portal on the only
 * database that has the catalogue in it. `--remove` takes it back out, and the
 * member is an example.invalid address that can never receive mail.
 *
 * Separate call — POST {"demo": true} — so it can never happen as a side
 * effect of seeding the catalogue.
 */
const DEMO: readonly (readonly [string, ...string[]])[] = [
  ["seed:occasion", "--", "--force"],
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
  const body = (await request.json().catch(() => null)) as
    | { activate?: unknown; demo?: unknown }
    | null;
  // `demo` stands alone: it composes one Revelle and does not re-seed anything.
  const steps =
    body?.demo === true
      ? DEMO
      : body?.activate === true
        ? [...STEPS, ...ACTIVATE]
        : STEPS;

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
