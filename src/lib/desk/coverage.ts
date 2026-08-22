import "server-only";

import { query } from "@/lib/db";
import { occasionEligibility, worldEligibility } from "@/lib/selection/occasion.ts";
import type { OccasionClaim, OccasionCode, WorldScope } from "@/lib/selection/types.ts";

import { COOKING_LEVELS, OCCASIONS, SEASONS, optionLabel } from "./labels.ts";

/**
 * THE COVERAGE BOARD — the library, against the standard it is meant to meet.
 *
 * Not a board of applications. There are none, and a kanban of empty columns
 * would be a screen about work that does not exist. The thing that needs a
 * board is the LIBRARY: twelve destinations, and for each of them the seven
 * facts that decide whether it can be given to anybody, filled or thin or
 * empty, with the thing that would fill it one click away.
 *
 * ── WHAT IT IS MEASURING AGAINST ─────────────────────────────────────
 *
 * docs/new-destination.md, sections 6 and 8, in the founder's own order:
 *
 *   the voice     "A destination is published only if it has a published
 *                 voice." A house with a look and no voice cannot write an
 *                 invitation, a menu card or a place card. Generation proposes
 *                 it anyway and approval refuses it, which is a slow way to
 *                 find out.
 *   the pools     something to serve, something to pour, something to play.
 *   occasion      "Four menus that are all long dinners is one menu."
 *   season        "A year-round destination needs a winter table and a summer
 *                 one, or it is unavailable for half the year."
 *   how much      "THIS IS THE ONE THAT GETS MISSED. A destination whose menus
 *   making        are all actually made is invisible to a host who said she
 *                 wants everything to arrive finished. She will be matched to
 *                 it and find nothing on the table she can have."
 *
 * ── DERIVED, NEVER KEPT ──────────────────────────────────────────────
 *
 * Every cell is computed from the rows as they stand, using the ENGINE'S OWN
 * eligibility functions — `worldEligibility` and `occasionEligibility` from
 * src/lib/selection/occasion.ts. A hand-kept checklist would be a second
 * catalogue, and the day it disagreed with the first one it would be the one
 * people believed. Scoping a menu at /desk/matrix changes this board on the
 * next load, with nothing to remember.
 *
 * ── AND WHAT IT WILL NOT DO ──────────────────────────────────────────
 *
 * No score, no percentage, no total, no congratulation. Three states and the
 * missing thing named. docs/copy-brief.md forbids counting for its own sake,
 * and a library that is 62% covered is a number nobody can act on; "no menu
 * here arrives finished" is a sentence somebody can go and fix.
 */

export type CellState = "filled" | "thin" | "empty";

export type Cell = {
  state: CellState;
  /** The fact, in a few words. */
  value: string;
  /** What is missing, or what would fill it. Empty when nothing is. */
  what: string;
  href: string;
};

export type BoardRow = {
  id: string;
  name: string;
  tagline: string;
  status: string;
  cells: Record<string, Cell>;
};

export type Board = {
  columns: readonly { key: string; label: string }[];
  rows: BoardRow[];
};

export const COLUMNS = [
  { key: "voice", label: "Voice" },
  { key: "menus", label: "Menus" },
  { key: "drinks", label: "Drinks" },
  { key: "games", label: "Games" },
  { key: "occasion", label: "Occasion spread" },
  { key: "season", label: "Season spread" },
  { key: "making", label: "Making spread" },
] as const;

/** season_band, split the way the standard splits it. `shoulder` sits astride. */
const WARM = new Set(["spring", "summer", "high_summer"]);
const COLD = new Set(["autumn", "winter"]);
const BOTH = new Set(["year_round", "shoulder"]);

/** The three rungs the whole catalogue speaks. db/016, docs/menus.md. */
const MAKING = ["actually_made", "half_made", "bought_and_arranged"] as const;

type Scoped = {
  id: string;
  name: string;
  /** season_band. Absent in the game pool. */
  season: string | null;
  /** cooking_level / making_level. Absent in the game pool. */
  making: string | null;
  worlds: Record<string, WorldScope>;
  occasions: OccasionClaim[];
};

export async function board(): Promise<Board> {
  const destinations = await query<{
    id: string;
    name: string;
    tagline: string;
    status: string;
    voice_version: number | null;
    drafts: number;
  }>(
    `select w.id, w.name, w.tagline, w.status::text as status,
            v.version as voice_version,
            (select count(*) from world_voice d
              where d.world_id = w.id and d.status = 'draft') as drafts
       from world w
       left join world_voice v on v.world_id = w.id and v.status = 'published'
      where w.status <> 'retired'
      order by w.name`
  );

  const menus = await pool("menu", "season", "cooking");
  const drinks = await pool("drink", "season", "making");
  const games = await pool("game", null, null);

  const rows = destinations.map((destination) => {
    const here = (list: readonly Scoped[]) =>
      list.filter(
        (thing) =>
          worldEligibility(thing.worlds, destination.id, destination.name).eligible
      );

    const myMenus = here(menus);
    const myDrinks = here(drinks);
    const myGames = here(games);

    return {
      id: destination.id,
      name: destination.name,
      tagline: destination.tagline,
      status: destination.status,
      cells: {
        voice: voiceCell(destination),
        menus: poolCell(destination.id, "menu", "menus", myMenus),
        drinks: poolCell(destination.id, "drink", "drinks", myDrinks),
        games: poolCell(destination.id, "game", "games", myGames),
        occasion: occasionCell(destination.id, [
          ...myMenus,
          ...myDrinks,
          ...myGames,
        ]),
        season: seasonCell(destination.id, [...myMenus, ...myDrinks]),
        making: makingCell(destination.id, myMenus, myDrinks),
      },
    };
  });

  return { columns: COLUMNS, rows };
}

/**
 * One pool, with its scoping and its two authored axes.
 *
 * ACTIVE ROWS ONLY, and that is the whole difference between this board and a
 * count of what has been typed in. A draft menu is a decision not yet taken;
 * the engine cannot see it, so a host cannot receive it, so it does not cover
 * anything.
 *
 * The column names are literals in this file and never come from a request.
 */
async function pool(
  table: "menu" | "drink" | "game",
  seasonColumn: string | null,
  makingColumn: string | null
): Promise<Scoped[]> {
  const rows = await query<{
    id: string;
    name: string;
    season: string | null;
    making: string | null;
    worlds: Record<
      string,
      { forbidden: boolean; native: boolean; affinity: string; note: string | null }
    >;
    occasions: { occasion: string; fit: string }[];
  }>(
    `select t.id, t.name,
            ${seasonColumn ? `t.${seasonColumn}::text` : "null::text"} as season,
            ${makingColumn ? `t.${makingColumn}::text` : "null::text"} as making,
            coalesce(
              (select jsonb_object_agg(
                        w.world_id,
                        jsonb_build_object('forbidden', w.forbidden,
                                           'native', w.native,
                                           'affinity', w.affinity,
                                           'note', w.note))
                 from ${table}_world w where w.${table}_id = t.id),
              '{}'::jsonb) as worlds,
            coalesce(
              (select jsonb_agg(jsonb_build_object(
                        'occasion', o.occasion, 'fit', o.fit))
                 from ${table}_occasion o where o.${table}_id = t.id),
              '[]'::jsonb) as occasions
       from ${table} t
      where t.status = 'active'
      order by t.name`
  );

  return rows.map((row) => {
    const worlds: Record<string, WorldScope> = {};
    for (const [worldId, raw] of Object.entries(row.worlds ?? {})) {
      worlds[worldId] = {
        forbidden: raw.forbidden,
        native: raw.native,
        affinity: Number(raw.affinity) || 0,
        note: raw.note,
      };
    }
    return {
      id: row.id,
      name: row.name,
      season: row.season,
      making: row.making,
      worlds,
      occasions: (row.occasions ?? []).map((claim) => ({
        occasion: claim.occasion as OccasionCode,
        fit: claim.fit === "forbidden" ? "forbidden" : "native",
        note: null,
      })),
    };
  });
}

/**
 * THE GATE THAT CANNOT BE BYPASSED. A look with no voice cannot be written, so
 * it cannot be delivered — approval refuses it in words a curator can act on,
 * which is a slow and expensive way to learn something this cell says at a
 * glance.
 */
function voiceCell(destination: {
  id: string;
  voice_version: number | null;
  drafts: number;
}): Cell {
  const href = `/desk/destinations/${destination.id}/voice`;
  if (destination.voice_version !== null) {
    return {
      state: "filled",
      value: `v${destination.voice_version} published`,
      what: destination.drafts > 0 ? `${destination.drafts} draft open` : "",
      href,
    };
  }
  if (destination.drafts > 0) {
    return {
      state: "thin",
      value: "drafted, not published",
      what: "nothing can be written in it until it is published",
      href,
    };
  }
  return {
    state: "empty",
    value: "none",
    what: "a look and no voice. It cannot be given to anybody",
    href,
  };
}

/**
 * Three is the floor, and it is not a round number: the making axis has three
 * rungs and every destination needs at least one of each, so a pool of two
 * cannot cover it however good the two are.
 */
function poolCell(
  worldId: string,
  poolCode: string,
  noun: string,
  things: readonly Scoped[]
): Cell {
  // Games have their own list now; everything else is still best read on the
  // connections grid, which is where a pool without a screen of its own lives.
  const href = poolCode === "game" ? "/desk/games" : `/desk/matrix?pool=${poolCode}`;
  if (things.length === 0) {
    return {
      state: "empty",
      value: `no ${noun}`,
      what: `nothing here can be served — every slot drawing on the ${noun} is a catalogue gap`,
      href,
    };
  }
  if (things.length < 3) {
    return {
      state: "thin",
      value: `${things.length}`,
      what: `too few to cover the three makings`,
      href,
    };
  }
  return { state: "filled", value: `${things.length}`, what: "", href };
}

/**
 * WHAT THIS DESTINATION CAN BE ASKED FOR.
 *
 * An ingredient with no occasion claim is eligible for every occasion — the
 * rule `claimEligibility` states, and the right default for a catalogue that
 * starts empty. But it also means an untagged pool cannot tell a long dinner
 * from standing drinks, and the engine will place the same menu at both. That
 * is not coverage, it is an untagged axis, and the cell says so rather than
 * reporting nine out of nine and looking finished.
 */
function occasionCell(worldId: string, things: readonly Scoped[]): Cell {
  const href = `/desk/destinations/${worldId}/deliverables`;

  if (things.length === 0) {
    return {
      state: "empty",
      value: "nothing to serve",
      what: "no pool reaches this destination at all",
      href,
    };
  }

  const claimed = new Set<string>();
  for (const thing of things) {
    for (const claim of thing.occasions) {
      if (claim.fit === "native") claimed.add(claim.occasion);
    }
  }

  // Which of the nine this destination could actually be offered for, by the
  // engine's own rule over the pool as it stands.
  const served = OCCASIONS.filter((occasion) =>
    things.some(
      (thing) =>
        occasionEligibility(thing.occasions, occasion as OccasionCode).eligible
    )
  );

  if (claimed.size === 0) {
    // Said in three words rather than a sentence, because when the whole
    // library is untagged this cell appears on every row and a paragraph
    // repeated twelve times stops being read. The page carries the
    // explanation once, above the table.
    return {
      state: "thin",
      value: "unclaimed",
      what: `all ${served.length} of ${OCCASIONS.length}, always`,
      href,
    };
  }

  return {
    state: claimed.size >= 3 ? "filled" : "thin",
    value: [...claimed].map((code) => optionLabel("occasion", code)).join(", "),
    what:
      claimed.size >= 3
        ? ""
        : "one kind of evening — a long dinner and standing drinks are different tables",
    href,
  };
}

/** A year-round destination needs a winter table and a summer one. */
function seasonCell(worldId: string, things: readonly Scoped[]): Cell {
  const href = "/desk/menus/new";
  const seasons = new Set(
    things.map((thing) => thing.season).filter((s): s is string => s !== null)
  );

  if (seasons.size === 0) {
    return {
      state: "empty",
      value: "nothing seasoned",
      what: "no menu and no drink reaches this destination",
      href,
    };
  }

  const warm = [...seasons].some((s) => WARM.has(s) || BOTH.has(s));
  const cold = [...seasons].some((s) => COLD.has(s) || BOTH.has(s));
  const named = [...seasons]
    .map((code) => SEASONS.find((s) => s.code === code)?.label ?? code)
    .sort()
    .join(", ");

  if (warm && cold) return { state: "filled", value: named, what: "", href };

  return {
    state: "thin",
    value: named,
    what: warm
      ? "nothing for the cold half of the year"
      : "nothing for the warm half of the year",
    href,
  };
}

/**
 * THE ONE THAT GETS MISSED, and the reason this board exists at all.
 *
 * Her answer to "how much of this do you want to make" WEIGHTS the pool and
 * never filters it — a host who wants everything to arrive finished is pulled
 * toward the most finished thing there is rather than shown an empty table. So
 * a destination whose menus are all actually made does not fail for her. It
 * matches her, and then hands her an afternoon of cooking she said she did not
 * want, and nothing anywhere reports it.
 *
 * Menus and drinks are judged SEPARATELY and the worse of the two decides the
 * cell. They are one axis (db/016 asks it once), but they are two tables: a bar
 * that pours something bought does not save a host from a kitchen.
 */
function makingCell(
  worldId: string,
  menus: readonly Scoped[],
  drinks: readonly Scoped[]
): Cell {
  const href = "/desk/menus/new";
  if (menus.length === 0 && drinks.length === 0) {
    return {
      state: "empty",
      value: "nothing made or bought",
      what: "no menu and no drink reaches this destination",
      href,
    };
  }

  const missing = (things: readonly Scoped[]) => {
    const have = new Set(things.map((thing) => thing.making));
    return MAKING.filter((level) => !have.has(level));
  };

  const menusMissing = missing(menus);
  const drinksMissing = missing(drinks);

  const say = (levels: readonly string[]) =>
    levels
      .map(
        (code) =>
          COOKING_LEVELS.find((l) => l.code === code)?.label.toLowerCase() ?? code
      )
      .join(", ");

  if (menusMissing.length === 0 && drinksMissing.length === 0) {
    return {
      state: "filled",
      value: "all three, on the table and at the bar",
      what: "",
      href,
    };
  }

  const parts: string[] = [];
  if (menus.length === 0) parts.push("no menus at all");
  else if (menusMissing.length > 0) {
    parts.push(`no menu that is ${say(menusMissing)}`);
  }
  if (drinks.length === 0) parts.push("no drinks at all");
  else if (drinksMissing.length > 0) {
    parts.push(`no drink that is ${say(drinksMissing)}`);
  }

  const everythingIsOneRung =
    menus.length > 0 && menusMissing.length === MAKING.length - 1;

  return {
    state: everythingIsOneRung || menus.length === 0 ? "empty" : "thin",
    value: everythingIsOneRung
      ? `every menu is ${say(
          MAKING.filter((level) => !menusMissing.includes(level))
        )}`
      : "short",
    what:
      parts.join(" · ") +
      (everythingIsOneRung
        ? ". A host who wants the other end is matched here and finds nothing on the table she can have"
        : ""),
    href,
  };
}
