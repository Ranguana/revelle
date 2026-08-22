/**
 * OFFERING THE CATALOGUE — one definition of "yes", two callers.
 *
 * ── WHY THIS MODULE EXISTS ───────────────────────────────────────────
 *
 * Every seeder creates DRAFTS, because deciding that something is offered to a
 * customer is a curator's decision and not a script's. That rule is right and
 * nothing here weakens it. What was wrong was that the rule had exactly one
 * way to be OPERATED — `npm run activate:catalogue -- --yes` — and the database
 * has an empty ipAllowList (render.yaml says why), so that command can only be
 * typed inside a Render shell. A gate a curator cannot reach is not a gate, it
 * is a wall, and the seeders had put 372 dishes behind it.
 *
 * So the gesture now has a screen: /desk/publish. And the screen must mean
 * EXACTLY what the script means, or the house would have two definitions of
 * "offered" and would eventually disagree with itself about which rows the
 * engine can see. Hence this file: the semantics live here, and both
 * scripts/activate-catalogue.mjs and the desk screen call into it.
 *
 * scripts/activate-catalogue.mjs is still the canonical PROSE — read its header
 * for the argument. This is the canonical CODE.
 *
 * ── FRAMEWORK-FREE, ON PURPOSE ───────────────────────────────────────
 *
 * No React, no `server-only`, no `@/` alias, and the only import is a type that
 * erases. That is what lets a plain .mjs script import this file directly the
 * way scripts/seed-games.mjs imports src/lib/games.ts — Node 22 strips the
 * types and runs it. Nothing in here may grow an import that Node would have to
 * resolve at runtime.
 *
 * ── THE TWO RULES THAT ARE NOT NEGOTIABLE ────────────────────────────
 *
 * 1. WHICH POOLS EXIST, AND WHAT "OFFERED" MEANS FOR EACH, IS DATA. db/002's
 *    `ingredient_pool` carries `active_column` and `active_value` as a
 *    column/value pair rather than a predicate string, deliberately, so nothing
 *    here has to know that a menu says `status = 'active'` and guess that every
 *    other pool agrees. A pool that declares no pair has no draft state to
 *    leave and is skipped rather than assumed. A seventh pool is a migration,
 *    not an edit to a list in a component.
 *
 * 2. A DESTINATION IS PUBLISHED ONLY IF IT HAS A PUBLISHED VOICE. A destination
 *    with a look and no voice cannot be written — no invitation, no menu card,
 *    no place cards — so publishing one puts a house in front of a customer
 *    that cannot speak. db/019's `world_publish_needs_a_voice` trigger refuses
 *    it; the predicate below does not RELY on that trigger existing, because
 *    the rule has to hold on any database this is pointed at. `world` therefore
 *    never goes through the generic loop, which would publish every draft
 *    destination including the mute ones — the exact thing the gate exists to
 *    refuse.
 *
 * ── IDEMPOTENT, AND ONE-WAY ──────────────────────────────────────────
 *
 * Nothing here moves a row backwards. A discontinued product stays
 * discontinued, a destination a curator archived stays archived. Only `draft`
 * moves, and it moves in one direction. See `IRREVERSIBLE` below for what that
 * costs.
 */

import type { QueryResultRow } from "pg";

/**
 * The narrowest thing both callers can supply.
 *
 * `query` from src/lib/db is this exactly. In a script it is one line over a
 * `pg` client — and binding it to a single client is what lets the script keep
 * its dry run, because every statement below then lands inside the one
 * transaction the script opened and can be rolled back.
 */
export type Ask = <T extends QueryResultRow>(
  text: string,
  params?: readonly unknown[]
) => Promise<T[]>;

/** One pool that has a draft/offered distinction. */
export type Pool = {
  /** `ingredient_pool.entity_table` — 'menu', 'drink', 'dish', … */
  code: string;
  label: string;
  /** Which column holds a human name. db/002 stores it so this need not guess. */
  labelColumn: string;
  activeColumn: string;
  activeValue: string;
};

/** One row a curator is being asked to say yes to. */
export type Item = { id: string; name: string };

export type Standing = {
  pool: Pool;
  draft: number;
  active: number;
  /** The draft rows, named, at most CEILING of them. */
  drafts: Item[];
  /** How many draft rows the ceiling kept off that list. Usually 0. */
  beyond: number;
};

/** A draft destination with no published voice. The authoring queue. */
export type Mute = Item & { slug: string; menus: number; drinks: number };

export type WorldStanding = {
  draft: number;
  published: number;
  /** Draft destinations that HAVE a published voice: publishable. */
  voiced: (Item & { slug: string })[];
  /** Draft destinations that do not. Named, because the list is the queue. */
  mute: Mute[];
};

/**
 * A CEILING ON THE ROWS SHOWN, for the same reason src/lib/desk/connections.ts
 * has one: a pool can be very large and a document nobody scrolls is not a list
 * a curator read. Five hundred clears the largest pool in the library today
 * (600 dishes, 372 of them draft) with room, so in practice it cuts nothing —
 * and when it does cut, `beyond` says so rather than the list quietly lying.
 *
 * It bounds what she is SHOWN and therefore what she can tick. It does not
 * bound what `publish` can write: the script passes no ids at all and moves the
 * whole pool in one statement.
 */
export const CEILING = 500;

/**
 * NO SEEDER CAN PUT ANY OF THIS BACK.
 *
 * The premise is easy to get wrong, so it is written down once, here, checked
 * against the four seeders that have a `--overwrite` flag:
 *
 *   · `--activate` (seed:menus, seed:drinks, seed:dishes) sets a status only on
 *     rows the seeder CREATES. It never touches a row that already exists.
 *   · `--overwrite` (seed:menus, seed:drinks, seed:dishes) lets the file beat a
 *     curator's edit — on the WORDS. Look at the three update statements: name,
 *     dishes, season, making, notes. `status` is in none of them.
 *   · seed:games and seed:destinations have no `--overwrite` at all, and
 *     seed:destinations says outright that it leaves status as it is.
 *
 * So publishing is one-way as far as every script in this repository is
 * concerned. The way back is by hand, one row at a time, at the pool's own desk
 * screen — and there is no desk screen for every pool. A bulk action that
 * cannot be reversed should feel like one, which is what the screen's
 * confirmation is for.
 */
export const IRREVERSIBLE = true;

/* ── composing an identifier safely ─────────────────────────────────── */

/**
 * Build a statement whose TABLE and COLUMN names come from the registry.
 *
 * Composed by Postgres's own `format()` with %I and %L rather than by string
 * interpolation here — db/002 makes the same point about why a predicate string
 * was refused in `ingredient_pool`. These identifiers come from a table a
 * curator could in principle write to, so they are quoted by the database that
 * will execute them, never by us.
 *
 * The returned text may still contain `$1`; `format` does not touch it, which
 * is how the id restriction below stays a bound parameter.
 */
async function composed(
  ask: Ask,
  template: string,
  args: readonly string[]
): Promise<string> {
  const holes = args.map((_, index) => `$${index + 2}::text`).join(", ");
  const rows = await ask<{ sql: string }>(
    `select format($1::text${holes ? `, ${holes}` : ""}) as sql`,
    [template, ...args]
  );
  return rows[0].sql;
}

/* ── the pools ──────────────────────────────────────────────────────── */

/**
 * Every pool with a draft state, out of the registry, EXCEPT `world`.
 *
 * `world` IS a pool row — db/002 registers it by hand, with `join_table` null
 * because the reference lives on `revelle` itself — and it must not go through
 * the generic loop. See rule 2 at the top of this file. It has its own pair of
 * functions below.
 */
export async function pools(ask: Ask): Promise<Pool[]> {
  const rows = await ask<{
    entity_table: string;
    label: string;
    label_column: string;
    active_column: string;
    active_value: string;
  }>(
    `select entity_table, label, label_column, active_column, active_value
       from ingredient_pool
      where active_column is not null
        and entity_table <> 'world'
      order by entity_table`
  );

  return rows.map((row) => ({
    code: row.entity_table,
    label: row.label,
    labelColumn: row.label_column,
    activeColumn: row.active_column,
    activeValue: row.active_value,
  }));
}

/** How much of one pool is in draft, how much is offered, and which rows. */
export async function standing(ask: Ask, pool: Pool): Promise<Standing> {
  const counted = await ask<{ draft: string; active: string }>(
    await composed(
      ask,
      "select count(*) filter (where %I = %L) as draft, " +
        "count(*) filter (where %I = %L) as active from %I",
      [
        pool.activeColumn,
        "draft",
        pool.activeColumn,
        pool.activeValue,
        pool.code,
      ]
    )
  );

  const draft = Number(counted[0]?.draft ?? 0);
  const active = Number(counted[0]?.active ?? 0);

  const drafts =
    draft === 0
      ? []
      : await ask<Item>(
          await composed(
            ask,
            // CEILING is concatenated rather than passed through %L because it
            // is a constant of this module and a number — it never came from a
            // request, and `limit '500'` is a coercion nobody should have to
            // reason about.
            "select id::text as id, %I::text as name from %I " +
              `where %I = %L order by %I limit ${CEILING}`,
            [
              pool.labelColumn,
              pool.code,
              pool.activeColumn,
              "draft",
              pool.labelColumn,
            ]
          )
        );

  return {
    pool,
    draft,
    active,
    drafts,
    beyond: Math.max(0, draft - drafts.length),
  };
}

/**
 * SAY YES.
 *
 * `ids` null means the whole pool — the script's gesture, one statement, no
 * list. A list of ids means the curator ticked specific rows and is saying yes
 * to those, which is the screen's gesture and the reason the screen exists.
 *
 * `where <active> = 'draft'` is kept in BOTH cases and is not decoration: it is
 * what makes this idempotent and what stops a stale form from moving a row
 * somebody has since discontinued. Nothing here moves a row backwards.
 *
 * Returns what actually moved, named, for the ledger and for the screen's
 * receipt. A row that was already offered is simply not in it.
 */
export async function publish(
  ask: Ask,
  pool: Pool,
  ids: readonly string[] | null
): Promise<Item[]> {
  const restriction = ids === null ? "" : " and id = any($1::uuid[])";
  const text = await composed(
    ask,
    "update %I set %I = %L where %I = %L" +
      restriction +
      " returning id::text as id, %I::text as name",
    [
      pool.code,
      pool.activeColumn,
      pool.activeValue,
      pool.activeColumn,
      "draft",
      pool.labelColumn,
    ]
  );
  return ask<Item>(text, ids === null ? [] : [ids]);
}

/* ── destinations, which are not a pool like the others ─────────────── */

/**
 * The destinations, split by whether they can speak.
 *
 * `world_voice` is versioned and superseded (db/004), so a destination "has a
 * voice" only if a row of it is currently published — hence a join rather than
 * a flag. The mute list carries how many menus and drinks were written for each
 * one, because that number is what makes the authoring queue urgent: eleven
 * destinations with content nobody can deliver.
 */
export async function worldStanding(ask: Ask): Promise<WorldStanding> {
  const counted = await ask<{ draft: string; published: string }>(
    `select count(*) filter (where status = 'draft') as draft,
            count(*) filter (where status = 'published') as published
       from world`
  );

  const voiced = await ask<{ id: string; slug: string; name: string }>(
    `select w.id::text as id, w.slug::text as slug, w.name
       from world w
      where w.status = 'draft'
        and exists (
          select 1 from world_voice v
           where v.world_id = w.id
             and v.published_at is not null
             and v.superseded_at is null
        )
      order by w.name`
  );

  const mute = await ask<{
    id: string;
    slug: string;
    name: string;
    menus: string;
    drinks: string;
  }>(
    `select w.id::text as id, w.slug::text as slug, w.name,
            (select count(*) from menu_world mw where mw.world_id = w.id) as menus,
            (select count(*) from drink_world dw where dw.world_id = w.id) as drinks
       from world w
      where w.status = 'draft'
        and not exists (
          select 1 from world_voice v
           where v.world_id = w.id
             and v.published_at is not null
             and v.superseded_at is null
        )
      order by w.slug`
  );

  return {
    draft: Number(counted[0]?.draft ?? 0),
    published: Number(counted[0]?.published ?? 0),
    voiced,
    mute: mute.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      menus: Number(row.menus),
      drinks: Number(row.drinks),
    })),
  };
}

/**
 * Publish the destinations that have a voice.
 *
 * The `exists` clause is the rule and it is present whether or not a curator
 * narrowed the list — ticking a mute destination on a screen cannot publish it,
 * because the statement will not match the row. That is deliberate: the veto
 * belongs to the query, not to whatever built the list.
 *
 * `published_at` is not decoration either. db/001's `world_published_has_timestamp`
 * constrains status='published' and published_at to be true together, so setting
 * one without the other is refused — which is why the two move in one statement.
 * `coalesce` so a destination that was published, unpublished and published
 * again keeps the date it first went out.
 */
export async function publishDestinations(
  ask: Ask,
  ids: readonly string[] | null
): Promise<{ id: string; slug: string }[]> {
  return ask<{ id: string; slug: string }>(
    `update world w
        set status = 'published',
            published_at = coalesce(w.published_at, now())
      where w.status = 'draft'
        ${ids === null ? "" : "and w.id = any($1::uuid[])"}
        and exists (
          select 1 from world_voice v
           where v.world_id = w.id
             and v.published_at is not null
             and v.superseded_at is null
        )
      returning w.id::text as id, w.slug::text as slug`,
    ids === null ? [] : [ids]
  );
}
