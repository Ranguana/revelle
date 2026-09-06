import { query } from "@/lib/db";
import { BANK_KINDS, DAY_PHASES, COURSES, DISH_LEVELS, MEAL_SHAPES, SEASONS } from "@/lib/desk/labels";
import {
  CAP,
  listQuery,
  oneOf,
  reader,
  reviewSearch,
  type Control,
  type ListQuery,
  type Params,
} from "@/lib/desk/review";

/**
 * WHAT EACH DESK LIST SELECTS, AND IN WHAT ORDER — in one place.
 *
 * Every list screen and every review pass over it reads this file, and that is
 * the point. A pass has to walk THE SEQUENCE SHE IS LOOKING AT: if she narrowed
 * the bank to Havana's draft goods, Next has to be the next Havana draft good
 * and not the next row of some default order. The only way to promise that
 * without carrying a snapshot of row ids in the URL is for the two screens to
 * ask the same question, which means the question is written once.
 *
 * So: the filters live here, the ORDER BY lives here, and the list screen has
 * neither of its own. The sequence functions at the foot return ids only — the
 * whole row is what the list screen is for, and a pass needs to know nothing
 * about a row except where it stands.
 *
 * ── THE CAP ─────────────────────────────────────────────────────────
 *
 * A sequence stops at CAP ids. A pass over more than a thousand rows is not a
 * pass, and the alternative — an unbounded id list rebuilt on every Next — is a
 * slow page that gets slower as the catalogue grows. Where a list is longer
 * than the cap the strip says so rather than presenting a truncated set as the
 * whole thing.
 *
 * ── WHICH LISTS ARE HERE, AND WHY /desk/products IS NOT ─────────────
 *
 * Every list whose rows are judged one at a time and whose ORDER IS STABLE
 * UNDER THE JUDGING. /desk/products is ordered by `updated_at desc`, so saving
 * a row moves it to the top and everything she has not seen shifts down by one.
 * A Next button over a self-shuffling order silently skips rows, which is worse
 * than no Next button at all. Giving products a stable order would change what
 * that screen is for — "what have I touched lately" is a real question — and
 * that is the founder's call, not this file's.
 */

/** product_status, db/002 — the three every pool screen filters on. */
export const POOL_STATUSES = ["draft", "active", "discontinued"];

/* ── the library ────────────────────────────────────────────────────── */

/**
 * THE LIBRARY, AND ITS ONE CONTROL.
 *
 * Order: status first, then name — unchanged, and the same on both screens.
 *
 * ── WHY RETIRED IS OUT OF THE DEFAULT VIEW ──────────────────────────
 *
 * A retired destination is not a room the house offers. It is kept because its
 * claims and its history have to survive — db/028 retires Cap Ferrat rather
 * than deleting it precisely so that its voice and its tags stay with it — but
 * the library is read as the working set, and a room sitting in it that nobody
 * can be sent to reads as a room. It was reported as one.
 *
 * So the default view is the working set, and the retired ones are one link
 * away with their number always printed. THE COUNT IS NOT OPTIONAL: a list that
 * is quietly shorter than the truth is the failure this codebase keeps
 * rediscovering, and it would be a fresh instance of it to fix a misread screen
 * by hiding rows without saying how many.
 *
 * ── AND WHY THE PASS READS THIS SAME FUNCTION ───────────────────────
 *
 * A review walks the sequence she is looking at. If retired rows are out of the
 * view they are out of the pass; if she has asked for them, they are in it.
 * That is not a nicety — a pass that quietly walked a different set from the
 * screen it started on is the exact failure this module exists to prevent, and
 * it is why the filter is written here rather than on either screen.
 */
export const DESTINATION_FROM = `world w`;
export const DESTINATION_ORDER = `w.status, w.name`;

export type DestinationList = {
  /** true when she has asked to see the retired ones too */
  readonly retired: boolean;
  /** `where …`, or "" */
  readonly where: string;
  /** what a pass over this view carries */
  readonly search: string;
};

export function destinationList(source: Params | string): DestinationList {
  const retired = reader(source)("retired") === "show";
  return {
    retired,
    where: retired ? "" : `where w.status <> 'retired'`,
    search: reviewSearch({ retired: retired ? "show" : "" }),
  };
}

export async function destinationSequence(search: string): Promise<string[]> {
  const list = destinationList(search);
  const rows = await query<{ id: string }>(
    `select w.id from ${DESTINATION_FROM} ${list.where}
      order by ${DESTINATION_ORDER} limit ${CAP}`
  );
  return rows.map((row) => row.id);
}

/* ── the bank ───────────────────────────────────────────────────────── */

/**
 * The bank filter's one value that is not a requirement code.
 *
 * "Only the ones that need nothing" is a real question — it is how a curator
 * finds the lines that survive any room — and it cannot be asked with a code,
 * because the answer is the ABSENCE of a row. A code from
 * `structural_requirement` can never collide with it: db/020's codes are
 * lower-case identifiers and this is not one.
 */
export const NEEDS_NOTHING = "-none";

/** The two answers the `ships` filter can give, as words rather than a boolean. */
export const SHIPPING: readonly { code: string; label: string; value: boolean }[] = [
  { code: "ships", label: "Only what ships", value: true },
  { code: "owned", label: "Only owned-if-present", value: false },
];

export const BANK_PER_PAGE = 100;

/**
 * The bank's controls, resolved.
 *
 * `destinations` and `requirements` are passed in rather than fetched here
 * because both callers already hold them: the list screen fills its selects
 * from them and the item screen shows the same vocabulary in its requirement
 * panel. Validating against them is what keeps a hand-edited URL from asking a
 * question the screen's own controls cannot express.
 */
export function bankList(
  source: Params | string,
  allowed: {
    destinations: readonly string[];
    requirements: readonly string[];
  }
): ListQuery {
  const get = reader(source);
  const needs = oneOf(get("needs"), [NEEDS_NOTHING, ...allowed.requirements]);

  const controls: Control[] = [
    { name: "q", value: get("q").slice(0, 80), sql: "b.name ilike '%' || $? || '%'" },
    {
      // Over the view's array, exactly as `dishList` reads `d.world_slugs`.
      // "Claims this destination" rather than "is filed under it": db/043 let
      // one lantern serve two rooms, and a curator asking what she has for
      // Amalfi means everything that claims Amalfi.
      name: "destination",
      value: oneOf(get("destination"), allowed.destinations),
      sql: "$? = any(b.world_slugs)",
    },
    {
      name: "kind",
      value: oneOf(get("kind"), BANK_KINDS.map((entry) => entry.code)),
      sql: "b.kind::text = $?",
    },
    {
      // A phase filter of "no opinion" asks for the rows that make no claim,
      // which is a real question and not the same as "any phase" — that is the
      // empty filter, the one the select's first option sets.
      name: "phase",
      value: oneOf(get("phase"), DAY_PHASES.map((entry) => entry.code)),
      sql: "b.phase::text = $?",
    },
    {
      // WHAT IT NEEDS OF THE ROOM — an EXISTS over db/020's polymorphic side
      // table rather than a column comparison, because that is where the answer
      // lives after db/033. The sentinel is the mirror question: the rows that
      // carry no requirement at all, which is the pool that survives any room.
      //
      // The filter matches the tag a row actually carries and does not widen a
      // grade into its lesser one. Asking for `outdoor_access` therefore does
      // NOT return the rows tagged `requires_outdoors`, even though anything
      // that satisfies the harder one satisfies the softer. That is deliberate:
      // this screen is for finding what a curator TAGGED, and a filter that
      // silently returned rows she did not tag would be the bridge db/033
      // removed, rebuilt in the desk. The note on the screen says so.
      name: "needs",
      value: needs,
      bare:
        needs === NEEDS_NOTHING
          ? `not exists (select 1 from ingredient_requirement r
                          where r.entity_table = 'bank_item'
                            and r.entity_id = b.id)`
          : undefined,
      sql: `exists (select 1 from ingredient_requirement r
                     where r.entity_table = 'bank_item'
                       and r.entity_id = b.id
                       and r.requirement = $?)`,
    },
    {
      name: "ships",
      value: oneOf(get("ships"), SHIPPING.map((entry) => entry.code)),
      sql: "b.ships = $?",
      bind: SHIPPING.find((entry) => entry.code === get("ships"))?.value ?? true,
    },
    { name: "status", value: oneOf(get("status"), POOL_STATUSES), sql: "b.status::text = $?" },
  ];

  return listQuery(controls);
}

/**
 * The bank's FROM and ORDER BY, shared so the pass cannot walk a different set.
 *
 * `bank_item_card` rather than a join through `bank_item.world_id`, because
 * db/043 dropped that column: an atmosphere item now claims its destinations
 * through `bank_item_world`, and it may claim more than one. The view is the
 * sibling of `dish_card` and is read the same way — `world_slugs` as an array,
 * filtered with `= any(...)` — so this screen and the dish screen ask the
 * question in one shape rather than two.
 *
 * `home_name` is the alphabetically first destination the item claims, and it
 * is what orders the list. Stable under an edit to any other column, which is
 * what CLAUDE.md rule 18 requires of a list the review pass walks; `w.name`
 * was stable for the same reason and this preserves it.
 */
export const BANK_FROM = `bank_item_card b`;
export const BANK_ORDER = `b.home_name, b.kind, b.name`;

export async function bankSequence(
  search: string,
  allowed: { destinations: readonly string[]; requirements: readonly string[] }
): Promise<string[]> {
  const list = bankList(search, allowed);
  const rows = await query<{ id: string }>(
    `select b.id from ${BANK_FROM} ${list.where}
      order by ${BANK_ORDER} limit ${CAP}`,
    [...list.binds]
  );
  return rows.map((row) => row.id);
}

/* ── the table ──────────────────────────────────────────────────────── */

export const DISH_PER_PAGE = 100;

export function dishList(
  source: Params | string,
  allowed: { destinations: readonly string[] }
): ListQuery {
  const get = reader(source);
  return listQuery([
    { name: "q", value: get("q").slice(0, 80), sql: "d.name ilike '%' || $? || '%'" },
    {
      name: "destination",
      value: oneOf(get("destination"), allowed.destinations),
      sql: "$? = any(d.world_slugs)",
    },
    {
      name: "course",
      value: oneOf(get("course"), COURSES.map((entry) => entry.code)),
      sql: "d.course::text = $?",
    },
    {
      name: "making",
      value: oneOf(get("making"), DISH_LEVELS.map((entry) => entry.code)),
      sql: "d.making::text = $?",
    },
    {
      name: "season",
      value: oneOf(get("season"), SEASONS.map((entry) => entry.code)),
      sql: "d.season::text = $?",
    },
    {
      // db/023, and the read is over the view's array rather than a join, so
      // that "no claim means every shape" is visible in the query: an untagged
      // dish is NOT matched by a shape filter, which is what a curator asking
      // "what do I have for brunch" means — she is asking what was tagged.
      name: "meal",
      value: oneOf(get("meal"), MEAL_SHAPES.map((entry) => entry.code)),
      sql: "$? = any(m.meals)",
    },
    { name: "status", value: oneOf(get("status"), POOL_STATUSES), sql: "d.status::text = $?" },
  ]);
}

export const DISH_FROM = `dish_card d join dish_meal_card m on m.id = d.id`;
export const DISH_ORDER = `d.name`;

export async function dishSequence(
  search: string,
  allowed: { destinations: readonly string[] }
): Promise<string[]> {
  const list = dishList(search, allowed);
  const rows = await query<{ id: string }>(
    `select d.id from ${DISH_FROM} ${list.where}
      order by ${DISH_ORDER} limit ${CAP}`,
    [...list.binds]
  );
  return rows.map((row) => row.id);
}

/* ── the menus, which have a second control ─────────────────────────── */

/**
 * THE MENU LIST, AND WHY IT IS NOT ONE OF THE THREE PLAIN ONES ANY MORE.
 *
 * db/045 retired the whole pool by founder ruling: db/022 deleted the nine
 * `occasion_slot` rows for `the_menu`, so no package can deliver a menu, and
 * thirty-nine rows sat in the catalogue looking exactly like stock. They are
 * KEPT — a menu is an evening and a dish is a plate, composition is still
 * revertible, and every row keeps its text, its season, its destinations and
 * its reason.
 *
 * Which makes /desk/menus the same screen /desk/destinations already was after
 * db/028, so it gets the same answer and the argument is stated once, up at
 * `destinationList`: the default view is THE WORKING SET, the retired ones are
 * one link away, and THE COUNT IS PRINTED IN BOTH STATES. A list that is
 * quietly shorter than the truth is the failure this codebase keeps
 * rediscovering; a screen that shows thirty-nine undeliverable rows as stock is
 * the failure that produced the coverage-board defect. Neither is acceptable
 * and the count is what makes the third option honest.
 *
 * `status` is still here and still means what it means everywhere. Asking for
 * `status=discontinued` explicitly IS asking for the retired ones, so it wins
 * over the toggle rather than fighting it — one axis, two ways to phrase the
 * same question.
 */
export const MENU_FROM = `menu_card m`;
export const MENU_ORDER = `m.slug`;

export type MenuList = {
  /** "" | draft | active | discontinued */
  readonly status: string;
  /** true when she has asked to see the retired ones too */
  readonly retired: boolean;
  /** `where …`, or "" */
  readonly where: string;
  readonly binds: readonly unknown[];
  /** what a pass over this view carries */
  readonly search: string;
};

export function menuList(source: Params | string): MenuList {
  const status = oneOf(reader(source)("status"), POOL_STATUSES);
  const retired = reader(source)("retired") === "show";

  const clauses: string[] = [];
  const binds: unknown[] = [];
  if (status) {
    binds.push(status);
    clauses.push(`m.status::text = $${binds.length}`);
  } else if (!retired) {
    clauses.push(`m.status <> 'discontinued'`);
  }

  return {
    status,
    retired,
    where: clauses.length > 0 ? `where ${clauses.join(" and ")}` : "",
    binds,
    search: reviewSearch({ status, retired: retired ? "show" : "" }),
  };
}

export async function menuSequence(search: string): Promise<string[]> {
  const list = menuList(search);
  const rows = await query<{ id: string }>(
    `select m.id from ${MENU_FROM} ${list.where}
      order by ${MENU_ORDER} limit ${CAP}`,
    [...list.binds]
  );
  return rows.map((row) => row.id);
}

/* ── the two plain lists ────────────────────────────────────────────── */

/**
 * Drinks and games each have one control — the status filter every pool screen
 * carries — and no paging. `all` is the absence of a filter and is stored in
 * the URL as nothing, which is why an incoming `status=all` resolves to "" here
 * exactly as it does on the screen.
 */
function statusOnly(search: string): string {
  return oneOf(reader(search)("status"), POOL_STATUSES);
}

/**
 * What a pass over one of those two carries: the status filter, and nothing
 * else. `all` is the absence of a filter and travels as nothing, so the pass
 * and the screen resolve the same set from the same string.
 */
export function statusSearch(filter: string): string {
  return reviewSearch({
    status: POOL_STATUSES.includes(filter) ? filter : "",
  });
}

async function statusSequence(
  select: string,
  from: string,
  column: string,
  order: string,
  search: string
): Promise<string[]> {
  const status = statusOnly(search);
  const rows = await query<{ id: string }>(
    `select ${select} from ${from}
      ${status ? `where ${column} = $1::product_status` : ""}
      order by ${order} limit ${CAP}`,
    status ? [status] : []
  );
  return rows.map((row) => row.id);
}

export function drinkSequence(search: string): Promise<string[]> {
  return statusSequence("id", "drink_card", "status", "slug", search);
}

export function gameSequence(search: string): Promise<string[]> {
  return statusSequence("g.id", "game g", "g.status", "g.name", search);
}
