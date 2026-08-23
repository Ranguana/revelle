/**
 * WHAT THE SEEDERS PUT OUT — the read behind /desk/stocked.
 *
 * ── THE QUESTION THIS ANSWERS IS THE OPPOSITE OF /desk/publish's ─────
 *
 * /desk/publish asks "what is waiting for a yes". For pool content that
 * question has no answer any more: db/036 and CLAUDE.md rule 13 made dishes,
 * drinks, menus and bank items stock themselves, so nothing of theirs waits.
 * The interesting question became the one nobody could ask — WHAT WENT LIVE,
 * WHEN, AND OUT OF WHICH SEEDER — and the answer has to be cheap to act on,
 * because a veto that costs more than the act it answers is not a veto.
 *
 * So this module reads the ledger rather than the pools. Every auto-publish
 * writes a `staff_action` row with `staff_id` null and `actor` = the
 * pool-stocking actor (db/036 made the column nullable and added `actor` beside
 * it precisely so the ledger could say "nobody, this seeder" without inventing
 * a fake person). Those rows are the feed.
 *
 * ── WHY IT DOES NOT READ `staff_recent_activity` ─────────────────────
 *
 * That view (db/011) was `staff_action JOIN staff`. An INNER join. Every row
 * this screen exists to show has a null `staff_id`, so all of them fell out of
 * it — the view answers "what did the two of them do", which is a different
 * question and still the right one for /desk/thread.
 *
 * That used to be knowledge held in this comment and nowhere else, which is
 * thin protection when the view still returns plausible rows and says nothing
 * about what it dropped. db/038 gave the whole ledger a name — `desk_activity`,
 * a LEFT join carrying `actor` — and redefined `staff_recent_activity` as that
 * view filtered to `actor = 'staff'`, so the partiality is now written into
 * the definition instead of being an accident of a join. Same rows as before
 * for /desk/thread; a name for the next screen to find.
 *
 * THIS MODULE STILL READS THE TABLE, and not because the view is inadequate.
 * The feed joins every ledger entry back to ITS OWN POOL TABLE to read the
 * row's status now, composing the label and status columns per pool — see
 * `feed` below. No single view can carry that, so a view here would only be a
 * layer to look through on the way to the same table.
 *
 * ── STILL LIVE IS READ FROM THE ROW, NOT INFERRED FROM THE LEDGER ────
 *
 * The ledger says what happened. Whether the dish is offered RIGHT NOW is a
 * fact about the dish, so each entry is joined back to its own table and the
 * current status is read off it. A row somebody discontinued by hand, or
 * withdrew on /desk/dishes, or reverted here last week, all read the same way
 * and read true. Deriving it from "is there a later revert row" would be a
 * second opinion about the same fact, and the second opinion would be the one
 * that goes stale.
 *
 * The join is a LEFT join for the same reason db/011 gives `(entity_table,
 * entity_id)` no foreign key: the record must outlive the thing. A deleted row
 * still shows what was done, named as gone.
 *
 * ── FRAMEWORK-FREE, LIKE ITS SIBLING ─────────────────────────────────
 *
 * Same rule as src/lib/desk/publish.ts, which this imports from: no React, no
 * `server-only`, no `@/` alias. It composes identifiers with that module's
 * `composed` rather than a second copy — one opinion about how a name out of
 * `ingredient_pool` gets quoted.
 */

import { composed, type Ask, type Item, type Pool } from "./publish";

/**
 * How many ledger rows per pool the feed loads.
 *
 * Smaller than publish's CEILING of 500 on purpose. That number bounds a list
 * a curator is TICKING and had to clear the largest pool in one pass; this one
 * bounds a list she is READING, newest first, and a feed is not a backlog — the
 * whole point of it is that the recent end is where the work is. What the
 * ceiling cuts is always the OLDEST entries, and the count line says so.
 */
export const FEED_CEILING = 200;

/** How many of the desk's own vetoes to show under the feed. */
export const VETOES_SHOWN = 20;

/** One thing a seeder put in front of members. */
export type Entry = {
  /** `staff_action.id`. The machine's act, not the row it acted on. */
  entry: string;
  /** The row itself, or null if the ledger has outlived it. */
  id: string | null;
  /** Its name NOW, which is not necessarily the name in the summary. */
  name: string | null;
  /** Its status NOW. Null when the row is gone. */
  status: string | null;
  /** Is it offered to members at this moment? */
  live: boolean;
  at: Date;
  /** What the seeder wrote at the time. Kept when the row is gone. */
  summary: string;
};

/** One pool's share of one run. */
export type RunPool = {
  pool: Pool;
  entries: Entry[];
  /** How many of them are still offered. The number the veto acts on. */
  live: number;
};

/**
 * ONE RUN OF ONE SEEDER — the unit of the feed, and the unit of a revert.
 *
 * Not "one deploy". A deploy runs five seeders and they stock five different
 * pools out of five different documents; "seed-dishes put 41 dishes out at
 * 09:12" is a thing a curator can hold an opinion about, and "a deploy
 * happened" is not. Each seeder stamps its own `detail.run` (one wall-clock id
 * per process, scripts/catalogue-vocabulary.mjs) and that is the grouping.
 *
 * db/036 wrote its own rows with `detail.migration` instead, because it cleared
 * the backlog before any seeder existed to stamp anything. Those group as
 * `db/036`, which is the honest name for what did it.
 */
export type Run = {
  /** Stable within a render; used as a form value and a React key. */
  key: string;
  /** 'seed-dishes', 'db/036', or the raw actor if a row carries neither. */
  seeder: string;
  /** The authored document it came out of, where the seeder recorded one. */
  source: string | null;
  actor: string;
  /** When the run started and finished, as far as the ledger saw it. */
  first: Date;
  last: Date;
  pools: RunPool[];
  total: number;
  live: number;
};

export type Feed = {
  runs: Run[];
  /** Every auto-publish ever recorded, across the pools asked for. */
  total: number;
  /** How many of those this feed loaded. */
  shown: number;
};

/** A person's veto, for the half of the ledger that has a name on it. */
export type Veto = {
  entry: string;
  at: Date;
  action: string;
  summary: string;
  who: string;
  count: number;
};

/* ── where a pool can be looked at ──────────────────────────────────── */

/**
 * The desk screen that shows one pool, by `ingredient_pool.entity_table`.
 *
 * A fact about the DESK's ROUTES rather than about the database, so it is
 * written down rather than derived — the registry has no column for it and
 * should not grow one. A pool that is absent from this map still publishes,
 * still reverts and still appears in the feed; it just has no list screen to
 * link to or to refresh, which is itself worth seeing.
 *
 * It lives in this module, which is a plain one, because the two places that
 * needed it were both `"use server"` files — and a `"use server"` module may
 * only export async functions, so neither could own the map and lend it to the
 * other. There were two copies of this fact before, and they had already
 * drifted: the publish screen's knew about `bank_item` and the publish action's
 * did not, so offering a bank item left /desk/bank stale.
 */
export const POOL_SCREEN: Readonly<Record<string, string>> = {
  bank_item: "/desk/bank",
  menu: "/desk/menus",
  drink: "/desk/drinks",
  dish: "/desk/dishes",
  game: "/desk/games",
  product: "/desk/products",
  world: "/desk/destinations",
};

/* ── the feed ───────────────────────────────────────────────────────── */

type Row = {
  entry: string;
  created_at: Date;
  actor: string;
  summary: string;
  detail: Record<string, unknown> | null;
  id: string | null;
  name: string | null;
  status: string | null;
  total: string;
};

/**
 * Everything the seeders put out, newest first, grouped by run.
 *
 * One statement per pool rather than one union over all of them, because the
 * label column and the status column differ per pool and are identifiers rather
 * than values — a union would have to compose six sub-selects into one string
 * and would be harder to read than the loop, for no fewer round trips.
 *
 * `count(*) over ()` is evaluated before LIMIT, so `total` is the whole count
 * and not the size of the page. It comes back as a STRING, like every count in
 * Postgres, and is converted exactly once here.
 */
export async function feed(ask: Ask, list: readonly Pool[]): Promise<Feed> {
  const runs = new Map<string, Run>();
  let total = 0;
  let shown = 0;

  for (const pool of list) {
    const text = await composed(
      ask,
      "select a.id::text as entry, a.created_at, a.actor, a.summary, a.detail," +
        " a.entity_id::text as id, e.%I::text as name, e.%I::text as status," +
        " count(*) over () as total" +
        " from staff_action a" +
        " left join %I e on e.id = a.entity_id" +
        // NOT A PERSON, rather than one named actor. db/036's CHECK ties
        // `actor <> 'staff'` and a null `staff_id` together, so this predicate
        // IS "nobody signed for it" — and a second system actor added later
        // appears in the feed on the day it first writes, instead of on the day
        // somebody remembers to add it to a list here.
        " where a.actor <> 'staff' and a.entity_table = %L" +
        // Newest first, and `id` after `created_at` because a seeder writes a
        // whole run inside one transaction and every row of it can carry the
        // same `now()`. The identity column is the only tiebreak that is not a
        // coin toss.
        " order by a.created_at desc, a.id desc" +
        ` limit ${FEED_CEILING}`,
      [pool.labelColumn, pool.activeColumn, pool.code, pool.code]
    );
    const rows = await ask<Row>(text);
    if (rows.length === 0) continue;

    total += Number(rows[0].total ?? 0);
    shown += rows.length;

    for (const row of rows) {
      // `pg` hands back a Date for timestamptz, and every consumer here does
      // date arithmetic on it. Normalised once rather than trusted, because a
      // string arriving in this field would not fail — it would silently make
      // every run its own group and every comparison a lie.
      const at = new Date(row.created_at);
      const named = naming(row, at);
      let run = runs.get(named.key);
      if (!run) {
        run = {
          key: named.key,
          seeder: named.seeder,
          source: named.source,
          actor: row.actor,
          first: at,
          last: at,
          pools: [],
          total: 0,
          live: 0,
        };
        runs.set(named.key, run);
      }
      if (at < run.first) run.first = at;
      if (at > run.last) run.last = at;
      if (!run.source && named.source) run.source = named.source;

      let share = run.pools.find((entry) => entry.pool.code === pool.code);
      if (!share) {
        share = { pool, entries: [], live: 0 };
        run.pools.push(share);
      }

      const live = row.status !== null && row.status === pool.activeValue;
      share.entries.push({
        entry: row.entry,
        id: row.id,
        name: row.name,
        status: row.status,
        live,
        at,
        summary: row.summary,
      });
      share.live += live ? 1 : 0;
      run.total += 1;
      run.live += live ? 1 : 0;
    }
  }

  return {
    runs: [...runs.values()].sort((a, b) => b.last.getTime() - a.last.getTime()),
    total,
    shown,
  };
}

/**
 * Which run a ledger row belongs to, and what to call it.
 *
 * Everything here is read DEFENSIVELY out of a jsonb column: `detail` is
 * `{}` by default and its shape differs per action by design (db/011), so a
 * missing key is normal and never an error. A row that carries neither a run
 * nor a migration still groups — by the minute it landed in — rather than
 * becoming its own singleton run, which is what would happen if the key were
 * allowed to be the row's own id.
 */
function naming(
  row: Row,
  at: Date
): { key: string; seeder: string; source: string | null } {
  const detail = row.detail ?? {};
  const read = (key: string): string | null => {
    const value = (detail as Record<string, unknown>)[key];
    return typeof value === "string" && value.length > 0 ? value : null;
  };

  const run = read("run");
  const migration = read("migration");
  const seeder = read("seeder") ?? (migration ? `db/${migration}` : row.actor);
  // ISO to the minute. `toISOString` rather than anything local, because this
  // is a grouping key and a key that moves with a timezone is not one.
  const minute = at.toISOString().slice(0, 16);

  return {
    key: `${seeder}@${run ?? minute}`,
    seeder,
    source: read("source"),
  };
}

/* ── the other half of the ledger ───────────────────────────────────── */

/**
 * The desk's own vetoes, with the name of whoever made them.
 *
 * An INNER join on `staff` here, and that is the right join for once: a revert
 * is a person's act, `recordAction` always writes her id, and a revert row with
 * no staff behind it would be a bug rather than a machine — db/036's CHECK
 * makes it unrepresentable anyway.
 *
 * Matched on the verb rather than on `actor`, because both halves of this
 * screen's story are 'staff' acts once a person is involved. The dotted suffix
 * is the convention db/011 asks for and `revertStocked` is the only thing that
 * writes it.
 */
export async function vetoes(ask: Ask): Promise<Veto[]> {
  const rows = await ask<{
    entry: string;
    created_at: Date;
    action: string;
    summary: string;
    who: string;
    detail: Record<string, unknown> | null;
  }>(
    `select a.id::text as entry, a.created_at, a.action, a.summary, a.detail,
            coalesce(nullif(btrim(s.name), ''), s.email) as who
       from staff_action a
       join staff s on s.id = a.staff_id
      where a.action like '%.auto_publish_reverted'
      order by a.created_at desc, a.id desc
      limit ${VETOES_SHOWN}`
  );

  return rows.map((row) => {
    const withdrawn = (row.detail ?? {})["withdrawn"];
    return {
      entry: row.entry,
      at: new Date(row.created_at),
      action: row.action,
      summary: row.summary,
      who: row.who,
      count: typeof withdrawn === "number" ? withdrawn : 0,
    };
  });
}

/* ── the veto itself ────────────────────────────────────────────────── */

/**
 * PUT IT BACK IN DRAFT.
 *
 * The mirror of `publish` in src/lib/desk/publish.ts, and deliberately built
 * out of the same three registry columns so the two gestures cannot come to
 * disagree about what "offered" means for a pool.
 *
 * `where <active> = <activeValue>` is the whole of the safety and is not
 * decoration:
 *
 *   · a row somebody already discontinued is NOT dragged back to draft, which
 *     would be this function silently reversing a curator's decision;
 *   · a row already reverted is not touched twice, so the gesture is
 *     idempotent and a double submit is not a second ledger entry's worth of
 *     nothing;
 *   · a stale form — the feed rendered before somebody else acted — is a
 *     smaller receipt, never a wrong write.
 *
 * It returns what actually moved, named, and the caller records THAT rather
 * than what was asked for. A veto that claims more than it did is worse than
 * no record, because the ledger is the thing everybody trusts.
 *
 * 'draft' is written as the destination rather than read from the registry
 * because `ingredient_pool` records what OFFERED means and has no column for
 * what it means to be waiting — the same literal `publish` uses on the other
 * side of the same statement.
 */
export async function revert(
  ask: Ask,
  pool: Pool,
  ids: readonly string[]
): Promise<Item[]> {
  if (ids.length === 0) return [];
  const text = await composed(
    ask,
    "update %I set %I = %L where %I = %L and id = any($1::uuid[])" +
      " returning id::text as id, %I::text as name",
    [
      pool.code,
      pool.activeColumn,
      "draft",
      pool.activeColumn,
      pool.activeValue,
      pool.labelColumn,
    ]
  );
  return ask<Item>(text, [ids]);
}
