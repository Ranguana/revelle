import "server-only";

import { Pool, type PoolClient, type QueryResultRow } from "pg";

/**
 * One pool per process. Next.js recreates modules on hot reload in
 * development, so the pool is stashed on globalThis — otherwise every edit
 * leaks a pool and the connection limit is reached within a few saves.
 */
declare global {
  var __revellePool: Pool | undefined;
}

function connectionString(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. There is no local fallback by design — see " +
        ".env.example."
    );
  }
  return url;
}

export function pool(): Pool {
  if (!globalThis.__revellePool) {
    const url = connectionString();
    globalThis.__revellePool = new Pool({
      connectionString: url,
      max: Number(process.env.DATABASE_POOL_MAX ?? 10),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
      // Hosted Postgres (Render, Neon, Supabase) terminates unencrypted
      // connections. A local socket has no TLS to offer.
      ssl: needsSsl(url) ? { rejectUnauthorized: false } : undefined,
    });
    globalThis.__revellePool.on("error", (err) => {
      // An idle client erroring must not take the process down.
      console.error("[db] idle client error", err.message);
    });
  }
  return globalThis.__revellePool;
}

/** Kept in sync with the same function in scripts/migrate.mjs. */
function needsSsl(url: string): boolean {
  if (/sslmode=disable/.test(url)) return false;
  return !/@(localhost|127\.0\.0\.1|\[::1\])/.test(url);
}

/** A query with parameters. Never interpolate values into SQL. */
export async function query<T extends QueryResultRow>(
  text: string,
  params: readonly unknown[] = []
): Promise<T[]> {
  const res = await pool().query<T>(text, params as unknown[]);
  return res.rows;
}

/** Exactly one row, or null. Throws if the query returns more than one. */
export async function queryOne<T extends QueryResultRow>(
  text: string,
  params: readonly unknown[] = []
): Promise<T | null> {
  const rows = await query<T>(text, params);
  if (rows.length > 1) {
    throw new Error(`queryOne expected at most 1 row, got ${rows.length}`);
  }
  return rows[0] ?? null;
}

/**
 * Run several statements in a transaction. The callback receives the client;
 * anything thrown rolls back.
 *
 * Use it wherever a write depends on a read. Submitting a quiz is the obvious
 * case: the customer, her response and her (empty) taste profile are one fact
 * about the world and must not half-exist.
 */
export async function transaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool().connect();
  try {
    await client.query("begin");
    const result = await fn(client);
    await client.query("commit");
    return result;
  } catch (err) {
    try {
      await client.query("rollback");
    } catch {
      // A failed rollback is not the error worth surfacing.
    }
    throw err;
  } finally {
    client.release();
  }
}
