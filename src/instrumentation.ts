/**
 * Server startup.
 *
 * Next.js calls `register()` exactly once when a server instance is initiated,
 * and the server does not take traffic until it returns — so this must arrange
 * for work rather than do any. Starting an interval qualifies; awaiting the
 * database does not.
 *
 * The only thing here is the background-work runner. See the long note in
 * src/lib/jobs/index.ts for why the runner lives inside the web process at all,
 * and what that choice costs.
 */

export async function register(): Promise<void> {
  // `register` runs in every runtime. Nothing below can exist on the edge
  // runtime — it needs `pg`, a socket and a long-lived timer.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // `next build` initialises a server to collect page data. Starting a runner
  // in a build worker would have it claim real jobs from the real database
  // during a deploy, run them in a process that is about to exit, and leave
  // them to time out. Cheap to rule out, expensive to debug.
  if (process.env.NEXT_PHASE === "phase-production-build") return;

  const { startJobRunner } = await import("./lib/jobs/index.ts");
  startJobRunner();
}
