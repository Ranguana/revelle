/**
 * What each job type does.
 *
 * A plain map, and deliberately not a database table. `job.type` is text in
 * db/008 precisely so that adding a kind of work is a code change rather than a
 * migration; putting the registry back in the database would undo that. Same
 * arrangement as the taste vocabulary in src/lib/quiz.ts: the database stores
 * the value, the code owns the meaning.
 *
 * The two operational numbers live here rather than at every call site that
 * enqueues, because "how long may this take" and "how many times is it worth
 * trying" are facts about the handler, not about the caller. `enqueue` in
 * queue.ts stays free of the registry — it takes the numbers as arguments —
 * and index.ts is what looks them up.
 */

import type { Handler, Registration } from "./types.ts";

export class Registry {
  private readonly handlers = new Map<string, Registration>();

  /**
   * The type must be `area.verb`. The same shape the table's check constraint
   * enforces, checked here too so that a typo is a startup error rather than a
   * job that enqueues fine and then fails at claim time on a row nobody
   * expected to see.
   */
  register(type: string, handler: Handler | Registration): this {
    if (!/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(type)) {
      throw new Error(
        `job type ${JSON.stringify(type)} is not shaped like area.verb — ` +
          `lowercase, at least one dot, no spaces`
      );
    }
    if (this.handlers.has(type)) {
      // Two registrations for one type means one of them is dead code and
      // nobody knows which. Louder now than in production.
      throw new Error(`job type ${type} is already registered`);
    }
    this.handlers.set(
      type,
      typeof handler === "function" ? { handle: handler } : handler
    );
    return this;
  }

  get(type: string): Registration | undefined {
    return this.handlers.get(type);
  }

  has(type: string): boolean {
    return this.handlers.has(type);
  }

  types(): string[] {
    return [...this.handlers.keys()].sort();
  }
}

export function createRegistry(): Registry {
  return new Registry();
}
