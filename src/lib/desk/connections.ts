import "server-only";

import { query } from "@/lib/db";
import { slotEligibility, worldEligibility } from "@/lib/selection/occasion.ts";
import type { SlotClaim, WorldScope } from "@/lib/selection/types.ts";

/**
 * THE CONNECTIONS, AS A GRID.
 *
 * Ingredients down, destinations across, one cell per pair. The desk could
 * already state a scoping — one row at a time, on the deliverables screen of
 * one destination — and could not show the shape of them. A curator asking
 * "what can HAVANA actually draw on" or "is anything written for the
 * Dolomites" had to open thirteen screens and remember.
 *
 * ── THREE STATES, WHICH IS WHAT db/019 GAVE THE SCHEMA ───────────────
 *
 *   written for   `native`. A CLAIM. Any native row makes the ingredient
 *                 eligible only under the destinations it claims — it is taken
 *                 away from every other destination in the library.
 *   forbidden     a structural never. A veto that can be outvoted is not a
 *                 veto, so it beats a claim and the database has a CHECK
 *                 saying the two cannot both be true.
 *   neither       a WEIGHT and nothing more, or no row at all. `affinity` pulls
 *                 the score toward or away and says nothing about eligibility.
 *
 * All three round-trip. Setting a cell back to "neither" keeps a curator's
 * weight and her note if there is one and removes the row only when the flags
 * were all it said — see `setConnection` in the screen's actions.ts.
 *
 * ── AND THE CONSEQUENCE, BESIDE THE GRID ─────────────────────────────
 *
 * A grid of marks is a picture of the rows. What a curator needs to see is what
 * the rows DO, so every column carries how many ingredients that destination
 * can actually draw on, per slot — computed by `worldEligibility` and
 * `slotEligibility`, the engine's own functions, never by a second reading of
 * the same rule. Toggle a cell and the number under it moves.
 *
 * The occasion and the room are deliberately NOT applied to that number. Both
 * are properties of a host, this screen has no host, and a pool size that
 * quietly assumed a birthday would be a different number every curator
 * remembered differently. The test bench is where a host is composed.
 */

/** One pool that can be scoped to a destination. db/009, db/012, db/017. */
export type Pool = {
  /** ingredient_pool.entity_table — 'menu', 'drink', 'game', … */
  code: string;
  label: string;
  /** '<code>_world'. From the registry, never assembled by hand elsewhere. */
  worldTable: string;
  slotTable: string | null;
};

export type Destination = {
  id: string;
  name: string;
  slug: string;
  status: string;
};

export type CellState = "native" | "forbidden" | "neither";

export type Cell = {
  state: CellState;
  /** Signed −1..1. Meaningful in every state; it is a weight, not a claim. */
  affinity: number;
  note: string | null;
};

export type Row = {
  id: string;
  name: string;
  status: string;
  /** world id -> cell. Missing means no row at all, which is `neither`. */
  cells: Record<string, Cell>;
  /** Which slots this ingredient may fill. The second axis, db/009. */
  slots: SlotClaim[];
};

/** One line of the consequence strip: a slot, and what each column can fill it with. */
export type SlotDepth = {
  slotCode: string;
  label: string;
  /** world id -> how many active ingredients of this pool are eligible. */
  depth: Record<string, number>;
};

export type Grid = {
  pools: Pool[];
  pool: Pool;
  status: RowFilter;
  destinations: Destination[];
  rows: Row[];
  /** How many rows the filter matched, before the ceiling below cut it. */
  matched: number;
  slots: SlotDepth[];
};

/**
 * WHICH ROWS ARE DRAWN. Active by default, and that default is the screen's
 * argument: the grid is about what the engine can draw on, and the engine
 * cannot see a draft. The other two exist because scoping something before
 * offering it is the normal order of work.
 */
export type RowFilter = "active" | "draft" | "all";

export function isRowFilter(value: string): value is RowFilter {
  return value === "active" || value === "draft" || value === "all";
}

/**
 * A CEILING ON THE ROWS, because a pool can be very large.
 *
 * The dish pool arrived with six hundred rows in it, which at thirteen
 * destinations is nearly eight thousand buttons in one form — a page that takes
 * seconds to render and cannot be read anyway. Three hundred is roughly what
 * fits on a screen a curator will actually scroll, and the count that was cut
 * is stated rather than silently dropped.
 */
const CEILING = 300;

/**
 * Every pool with destination scoping installed, out of the registry.
 *
 * `ingredient_pool` is the registry db/002 built and db/009 extended precisely
 * so that a sixth pool is a migration and not an edit to a list in a component.
 * Reading it here means the switcher grows on its own.
 */
export async function pools(): Promise<Pool[]> {
  const rows = await query<{
    entity_table: string;
    label: string;
    world_table: string;
    slot_table: string | null;
  }>(
    `select entity_table, label, world_table, slot_table
       from ingredient_pool
      where world_table is not null
      order by label`
  );

  return rows.map((row) => ({
    code: row.entity_table,
    label: row.label,
    worldTable: row.world_table,
    slotTable: row.slot_table,
  }));
}

export async function grid(
  poolCode: string,
  status: RowFilter = "active"
): Promise<Grid> {
  const all = await pools();
  const pool = all.find((entry) => entry.code === poolCode) ?? all[0];

  const destinations = await query<Destination>(
    `select id, name, slug::text as slug, status::text as status
       from world
      where status <> 'retired'
      order by name`
  );

  /*
   * The identifiers below come from `ingredient_pool`, which is a registry this
   * codebase writes with `install_world_affinity` and nothing else ever writes.
   * They are never derived from a request: `pool` above is resolved by matching
   * a request value against that registry, and an unrecognised value falls back
   * to the first pool rather than reaching a query.
   */
  const idColumn = `${pool.code}_id`;

  const rows = await query<{
    id: string;
    name: string;
    status: string;
    cells: Record<string, { forbidden: boolean; native: boolean; affinity: string; note: string | null }>;
    slots: { slot_code: string; fit: string; note: string | null }[];
  }>(
    `select t.id, t.name, t.status::text as status,
            coalesce(
              (select jsonb_object_agg(
                        w.world_id,
                        jsonb_build_object('forbidden', w.forbidden,
                                           'native', w.native,
                                           'affinity', w.affinity,
                                           'note', w.note))
                 from ${pool.worldTable} w where w.${idColumn} = t.id),
              '{}'::jsonb) as cells,
            ${
              pool.slotTable
                ? `coalesce(
              (select jsonb_agg(jsonb_build_object(
                        'slot_code', s.slot_code, 'fit', s.fit, 'note', s.note))
                 from ${pool.slotTable} s where s.${idColumn} = t.id),
              '[]'::jsonb)`
                : `'[]'::jsonb`
            } as slots
       from ${pool.code} t
      where ${
        status === "all"
          ? "t.status <> 'discontinued'"
          : status === "draft"
            ? "t.status = 'draft'"
            : "t.status = 'active'"
      }
      order by t.name`
  );

  const grid: Row[] = rows.slice(0, CEILING).map((row) => {
    const cells: Record<string, Cell> = {};
    for (const [worldId, raw] of Object.entries(row.cells ?? {})) {
      cells[worldId] = {
        state: raw.forbidden ? "forbidden" : raw.native ? "native" : "neither",
        affinity: Number(raw.affinity) || 0,
        note: raw.note,
      };
    }
    return {
      id: row.id,
      name: row.name,
      status: row.status,
      cells,
      slots: (row.slots ?? []).map((claim) => ({
        slotCode: claim.slot_code,
        fit: claim.fit === "forbidden" ? "forbidden" : "native",
        note: claim.note,
      })),
    };
  });

  return {
    pools: all,
    pool,
    status,
    destinations,
    rows: grid,
    matched: rows.length,
    // THE STRIP IS COMPUTED FROM THE WHOLE POOL, not from the rows drawn. What
    // a destination can draw on does not depend on which page a curator is
    // looking at, and a number that shrank when she filtered would be a number
    // she could not trust.
    slots: await depths(pool, destinations, await allRows(pool)),
  };
}

/**
 * Every ACTIVE row of the pool with its scoping, for the consequence strip.
 *
 * Read separately from the grid above because the grid is filtered and capped
 * for the eye, and the strip must not be.
 */
async function allRows(pool: Pool): Promise<Row[]> {
  const idColumn = `${pool.code}_id`;
  const rows = await query<{
    id: string;
    cells: Record<string, { forbidden: boolean; native: boolean; affinity: string; note: string | null }>;
    slots: { slot_code: string; fit: string; note: string | null }[];
  }>(
    `select t.id,
            coalesce(
              (select jsonb_object_agg(
                        w.world_id,
                        jsonb_build_object('forbidden', w.forbidden,
                                           'native', w.native,
                                           'affinity', w.affinity,
                                           'note', w.note))
                 from ${pool.worldTable} w where w.${idColumn} = t.id),
              '{}'::jsonb) as cells,
            ${
              pool.slotTable
                ? `coalesce(
              (select jsonb_agg(jsonb_build_object(
                        'slot_code', s.slot_code, 'fit', s.fit, 'note', s.note))
                 from ${pool.slotTable} s where s.${idColumn} = t.id),
              '[]'::jsonb)`
                : `'[]'::jsonb`
            } as slots
       from ${pool.code} t
      where t.status = 'active'`
  );

  return rows.map((row) => {
    const cells: Record<string, Cell> = {};
    for (const [worldId, raw] of Object.entries(row.cells ?? {})) {
      cells[worldId] = {
        state: raw.forbidden ? "forbidden" : raw.native ? "native" : "neither",
        affinity: Number(raw.affinity) || 0,
        note: raw.note,
      };
    }
    return {
      id: row.id,
      name: "",
      status: "active",
      cells,
      slots: (row.slots ?? []).map((claim) => ({
        slotCode: claim.slot_code,
        fit: claim.fit === "forbidden" ? "forbidden" : "native",
        note: claim.note,
      })),
    };
  });
}

/**
 * HOW MANY THINGS EACH DESTINATION CAN ACTUALLY DRAW ON, per slot.
 *
 * The eligibility rule is not restated here. `worldEligibility` and
 * `slotEligibility` are the engine's own, from
 * src/lib/selection/occasion.ts, and they are called with the same arguments
 * stage 3 calls them with — so a number on this screen and a pool inside a run
 * cannot disagree. That is the whole reason to import from the engine rather
 * than write a `count(*) … where not forbidden`, which is the query that would
 * be wrong the moment a native claim exists anywhere in the pool.
 *
 * ONLY ACTIVE ROWS ARE COUNTED — see `allRows`, which is what is passed in. A
 * draft menu is a decision not yet taken and the engine cannot see it; counting
 * it would tell a curator a pool is deep when the engine finds it empty.
 */
async function depths(
  pool: Pool,
  destinations: readonly Destination[],
  rows: readonly Row[]
): Promise<SlotDepth[]> {
  const slots = await query<{ slot_code: string; label: string }>(
    `select distinct os.slot_code, sk.label
       from occasion_slot os
       join slot_kind sk on sk.code = os.slot_code
      where os.pool = $1
      order by sk.label`,
    [pool.code]
  );

  // The whole pool as the engine sees a scoping map, built once.
  const active = rows.filter((row) => row.status === "active");
  const scopes = new Map<string, Record<string, WorldScope>>();
  for (const row of active) {
    const map: Record<string, WorldScope> = {};
    for (const [worldId, cell] of Object.entries(row.cells)) {
      map[worldId] = {
        forbidden: cell.state === "forbidden",
        native: cell.state === "native",
        affinity: cell.affinity,
        note: cell.note,
      };
    }
    scopes.set(row.id, map);
  }

  return slots.map((slot) => {
    const depth: Record<string, number> = {};
    for (const destination of destinations) {
      let count = 0;
      for (const row of active) {
        if (!slotEligibility(row.slots, slot.slot_code).eligible) continue;
        const map = scopes.get(row.id) ?? {};
        if (!worldEligibility(map, destination.id, destination.name).eligible) {
          continue;
        }
        count += 1;
      }
      depth[destination.id] = count;
    }
    return { slotCode: slot.slot_code, label: slot.label, depth };
  });
}
