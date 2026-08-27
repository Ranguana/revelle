import "server-only";

import { query } from "@/lib/db";
import { occasionEligibility, worldEligibility } from "@/lib/selection/occasion.ts";
import {
  claimsForSlot,
  itemsForRoom,
} from "@/lib/selection/slot-coverage.ts";
import type {
  OccasionClaim,
  OccasionCode,
  SlotClaim,
  WorldScope,
} from "@/lib/selection/types.ts";

import { idColumnFor, tablesFor, type StockedPool } from "@/lib/pools/registry.ts";

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
 *   the pools     something to serve, something to pour, something to play —
 *                 measured, since the ruling below, WHERE THE SERVING ACTUALLY
 *                 HAPPENS: the three dish slots db/022 composed the table from,
 *                 not the menu pool the engine can no longer place.
 *   atmosphere    the room it all happens in — added after db/043, PER SLOT.
 *                 See "THE PER-SLOT BLOCKS" below for why each is several
 *                 columns and one total rather than a single number.
 *   occasion      "Four menus that are all long dinners is one menu."
 *   season        "A year-round destination needs a winter table and a summer
 *                 one, or it is unavailable for half the year."
 *   how much      "THIS IS THE ONE THAT GETS MISSED. A destination whose menus
 *   making        are all actually made is invisible to a host who said she
 *                 wants everything to arrive finished. She will be matched to
 *                 it and find nothing on the table she can have."
 *                 Read over DISHES now, for the same reason serve-coverage is:
 *                 the rung of a row nothing draws grades nothing.
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
 *
 * The two numbers that ARE totals — "in all", at the end of each per-slot
 * block — are the exception that proves it, and both are deliberately unable
 * to congratulate: see `blockTotalCell`.
 *
 * ── THE PER-SLOT BLOCKS, AND WHY EACH IS SEVERAL COLUMNS ─────────────
 *
 * Two blocks, on two founder rulings a day apart: THE TABLE (three dish slots)
 * and ATMOSPHERE (four bank slots). They are rendered by one pair of functions
 * — `slotCell` and `blockTotalCell` — because they are one idea used twice,
 * and because a third block is now expected. The argument below is written
 * about atmosphere, where it was first made, and applies to both.
 *
 * The founder, after db/043 gave atmosphere a path into a package:
 *
 *   "Add atmosphere (per-slot) as the fourth coverage dimension — it's now
 *    load-bearing for the member experience by your own migration — and leave
 *    the rest excluded-and-named."
 *
 * PER-SLOT IS THE WHOLE INSTRUCTION, and the argument against the easy version
 * is db/043's own, made about the gap reporter and true one layer up here:
 *
 *   "The gap reporter is per-slot. One generic atmosphere slot means a gap can
 *    only ever say 'no atmosphere at all,' which with 174 active rows will
 *    never fire — re-installing the exact failure mode this whole thread
 *    started with, a coverage check that cannot see the coverage that matters.
 *    Named slots make 'Positano has table settings but nothing to take home' a
 *    reportable fact."
 *
 * A board with one ATMOSPHERE column would commit that error verbatim: every
 * room would be green, because every room has something, and the take-home —
 * 2 active rows in the entire bank — would be invisible behind the 120 in the
 * general bucket. So the four named slots get four columns and are never
 * summed into a verdict.
 *
 * SUB-COLUMNS UNDER ONE SPANNING HEADING, rather than stacked lines inside one
 * cell, for three reasons worth writing down because the other shape is the
 * tempting one:
 *
 *   1. A slot cell stays an ordinary `Cell` — same type, same three states,
 *      same link, rendered by the same branch of the page as every other cell.
 *      A new cell shape is a new way for a cell to be wrong.
 *   2. THE VERTICAL READ IS THE POINT. The take-home column is a single
 *      unbroken run of oxblood down every room in the library, and that column
 *      IS the finding. Stacked inside a cell it would be the fourth line of
 *      twelve boxes and nobody would ever see it whole.
 *   3. The spanning heading states the founder's ruling instead of asserting
 *      it: these are one dimension, reported separately.
 *
 * WHICH SLOTS, AND HOW MANY OF THEM, ARE READ FROM THE DATABASE. There is no
 * list of slot codes in this file, and there must never be one: db/022 and
 * db/043 put the codes in `slot_kind` and the draw in `occasion_slot`, and a
 * copy here would be the hand-written list rule 19 is about — with the added
 * irony of sitting in the function whose own comment removed one. It is also
 * what let the second block be added by naming a pool: `slotsFor("dish")`
 * returned three columns with nothing else edited.
 *
 * ── CLAIMS PER CELL, DISTINCT ITEMS IN THE TOTAL ─────────────────────
 *
 * An item may claim more than one slot, so the four cells do not partition the
 * bank and their sum is not the room's holdings. The founder settled the basis:
 *
 *   "Per-slot cells should count claims — 'how many items can fill this slot
 *    for this room' is the operationally relevant number, because that's what
 *    selection draws from. Your rock legitimately counts in two cells; that's
 *    not double-counting, it's the truth about the rock. Distinct-items is the
 *    right basis only for a per-room total column. So: cells = claims, totals
 *    = distinct, both labeled."
 *
 * And, pre-approved: "The mismatch between them (total < sum of cells) is
 * correct output, same category as the empty take-home cells." Both bases are
 * therefore named ON THE BOARD — `claims per slot` in each spanning heading,
 * `In all · distinct` on each total, and a paragraph above the table — so that
 * a reader who adds a row up and gets a bigger number than the total can see
 * why without opening this file.
 *
 * ── ONE AUTHORITY FOR "CAN THIS FILL THAT" ───────────────────────────
 *
 * Every eligibility decision on this board goes through
 * src/lib/selection/slot-coverage.ts, which is also the function the engine's
 * gap reporter calls. Two surfaces answering "does room X have slot Y covered"
 * with two queries is the drift the founder named, and
 * src/lib/desk/coverage.db.test.ts is the guard that fails if they ever part.
 * AN ELIGIBILITY RULE WRITTEN INLINE IN THIS FILE IS A BUG, however small and
 * however obviously equivalent. That now covers nine columns and two pools,
 * which is why the rule is stated rather than left to be noticed.
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

export type BoardColumn = { key: string; label: string };

/**
 * One cell of the TOP header row. `span` is how many columns it covers, which
 * is 1 for every standing column and 5 for atmosphere — four slots and the
 * room's total. A heading, rather than a flat list, is how the board says that
 * those five are one dimension without a paragraph.
 */
export type BoardHeading = { key: string; label: string; span: number };

export type Board = {
  headings: readonly BoardHeading[];
  /** Flattened, in heading order. One entry per `<th>` of the second row. */
  columns: readonly BoardColumn[];
  rows: BoardRow[];
};

/**
 * A POOL REPORTED PER SLOT — several columns under one heading, plus a total.
 *
 * Two blocks today: what she is served (three dish slots) and the room it is
 * served in (four atmosphere slots). Neither list is written down anywhere in
 * this file; both come from `occasion_slot` at request time. See `slotsFor`.
 */
type SlotBlock = {
  /** Column-key prefix, and the heading's own key. */
  key: string;
  /** The spanning heading, carrying the basis: "· claims per slot". */
  heading: string;
  slots: readonly PoolSlot[];
  /** The pool, unfiltered. Narrowing is `slot-coverage.ts`'s job, not this file's. */
  items: readonly Scoped[];
  /** Where a curator goes to fill one of these slots. */
  href: string;
};

const blockSlotKey = (block: SlotBlock, slotCode: string) =>
  `${block.key}:${slotCode}`;
const blockTotalKey = (block: SlotBlock) => `${block.key}:in-all`;

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
  /**
   * `<pool>_slot` — db/009. Carried for every pool rather than only the one
   * that reads it, because the row shape is the pool's, not this board's, and
   * a field that appears only for `bank_item` is a special case waiting to be
   * discovered by whoever adds the fifth column.
   *
   * This is what makes a `Scoped` satisfy `Placeable` in
   * src/lib/selection/slot-coverage.ts without a conversion.
   */
  slots: SlotClaim[];
};

/**
 * ONE ATMOSPHERE SLOT, AS THE DATABASE DESCRIBES IT — never as this file
 * remembers it.
 */
type PoolSlot = {
  /** `slot_kind.code`. */
  code: string;
  /** `slot_kind.label`, in the founder's words, rendered as the heading. */
  label: string;
  /**
   * The most any one occasion draws into this slot — `max(occasion_slot
   * .max_count)`. 1 for the three named slots, 2 for the general bucket, and
   * read rather than assumed because db/043 chose those numbers against
   * `ingredient_pool.typical_draw` and a later migration may choose others.
   *
   * It is the floor the cell judges against: see `atmosphereCell`.
   */
  draw: number;
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

  // WHAT SHE IS SERVED IS DRAWN FROM `dish`, NOT FROM `menu`. See "SOMETHING TO
  // SERVE IS NO LONGER A MENU" in the doc above `pool`.
  const dishes = await pool("dish", "season", "making");
  const drinks = await pool("drink", "season", "making");
  const games = await pool("game", null, null);
  const bank = await pool("bank_item", null, null);

  // The slots come out of the database. Nothing in this file knows that there
  // are three of one and four of the other, or what any of them is called.
  const serve: SlotBlock = {
    key: "serve",
    heading: "The table · claims per slot",
    slots: await slotsFor("dish"),
    items: dishes,
    href: "/desk/dishes",
  };
  const atmosphere: SlotBlock = {
    key: "atmosphere",
    heading: "Atmosphere · claims per slot",
    slots: await slotsFor("bank_item"),
    items: bank,
    href: "/desk/bank",
  };

  const headings: BoardHeading[] = [];
  const columns: BoardColumn[] = [];

  const standing = (key: string, label: string) => {
    headings.push({ key, label, span: 1 });
    columns.push({ key, label });
  };
  const block = (b: SlotBlock) => {
    headings.push({ key: b.key, label: b.heading, span: b.slots.length + 1 });
    for (const slot of b.slots) {
      columns.push({ key: blockSlotKey(b, slot.code), label: slot.label });
    }
    columns.push({ key: blockTotalKey(b), label: "In all · distinct" });
  };

  standing("voice", "Voice");
  block(serve);
  standing("drinks", "Drinks");
  standing("games", "Games");
  block(atmosphere);
  standing("occasion", "Occasion spread");
  standing("season", "Season spread");
  standing("making", "Making spread");

  const rows = destinations.map((destination) => {
    const here = (list: readonly Scoped[]) =>
      list.filter(
        (thing) =>
          worldEligibility(thing.worlds, destination.id, destination.name).eligible
      );

    const myDishes = here(dishes);
    const myDrinks = here(drinks);
    const myGames = here(games);

    return {
      id: destination.id,
      name: destination.name,
      tagline: destination.tagline,
      status: destination.status,
      cells: {
        voice: voiceCell(destination),
        ...blockCells(destination.id, destination.name, serve),
        drinks: poolCell(destination.id, "drink", "drinks", myDrinks),
        games: poolCell(destination.id, "game", "games", myGames),
        ...blockCells(destination.id, destination.name, atmosphere),
        occasion: occasionCell(destination.id, [
          ...myDishes,
          ...myDrinks,
          ...myGames,
        ]),
        season: seasonCell(destination.id, [...myDishes, ...myDrinks]),
        making: makingCell(destination.id, myDishes, myDrinks),
      },
    };
  });

  return { headings, columns, rows };
}

/**
 * ONE BLOCK'S CELLS FOR ONE ROOM — the slots, then the total.
 *
 * THE POOL IS PASSED IN UNFILTERED. Every cell asks
 * src/lib/selection/slot-coverage.ts for the destination AND the slot in one
 * call, because that is the call the gap reporter makes. Narrowing by room here
 * first and by slot after would be this file holding half of a rule that lives
 * somewhere else, and half a rule is how two surfaces start disagreeing.
 */
function blockCells(
  worldId: string,
  worldName: string,
  block: SlotBlock
): Record<string, Cell> {
  const cells: Record<string, Cell> = {};
  for (const slot of block.slots) {
    cells[blockSlotKey(block, slot.code)] = slotCell(
      worldId,
      worldName,
      slot,
      block
    );
  }
  cells[blockTotalKey(block)] = blockTotalCell(worldId, worldName, block);
  return cells;
}

/**
 * WHICH SLOTS A POOL IS DRAWN INTO, AND HOW DEEP EACH DRAW GOES.
 *
 * `occasion_slot` is the truth about which slots exist for a pool, and
 * `slot_kind` is the truth about what they are called and in what order the
 * engine fills them. Both are read; neither is remembered here. db/043 added
 * four rows to `slot_kind` and this function returned four more columns with
 * nothing edited, which is the property rule 19 asks for.
 *
 * ORDERED BY `slot_kind.position`, which is the order the engine fills and the
 * order the founder wrote them in — the table is dressed, then lit, then
 * everything else, and the take-home last because that is when it is handed
 * over. Alphabetical would scatter that for no reason.
 *
 * AN EMPTY RESULT IS AN ERROR AND NOT AN EMPTY BLOCK. Rule 19's loud form: "if
 * a pool the registry knows about returns rows a surface cannot render, that is
 * an error state, not an empty section." A registered pool with no slots is a
 * migration that installed a table and never gave it a way into a package, and
 * a board that quietly dropped its columns would report a covered library.
 */
async function slotsFor(entity: StockedPool): Promise<PoolSlot[]> {
  const registered = tablesFor(entity);
  if (!registered?.slotTable) {
    throw new Error(
      `the coverage board asked for the slots of pool '${entity}', which has ` +
        `no slot table. Its migration never called install_slot_eligibility.`
    );
  }

  const rows = await query<{ code: string; label: string; draw: number }>(
    `select k.code, k.label, max(s.max_count)::int as draw
       from occasion_slot s
       join slot_kind k on k.code = s.slot_code
      where s.pool = $1
      group by k.code, k.label, k.position
      order by k.position`,
    [entity]
  );

  if (rows.length === 0) {
    throw new Error(
      `pool '${entity}' has a slot table and no rows in occasion_slot. ` +
        `Nothing it holds can reach a package, so the coverage board cannot ` +
        `report on it — see CLAUDE.md rule 19 and db/043.`
    );
  }

  return rows.map((row) => ({
    code: row.code,
    label: row.label,
    draw: Number(row.draw) || 1,
  }));
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
 *
 * ── THE THREE POOLS ABOVE ARE A CURATORIAL CHOICE, NOT A POOL LIST ───
 *
 * Worth separating carefully, because this parameter USED to read
 * `"menu" | "drink" | "game"` and that spelling made a product decision look
 * like a schema fact — which is the exact confusion CLAUDE.md rule 19 is about.
 *
 * The board measures against docs/new-destination.md section 6: "something to
 * serve, something to pour, something to play". Three pools, named by the
 * founder, in a document about what makes a destination GIVEABLE. It is not
 * trying to be a census of `ingredient_pool`, and widening it to seven columns
 * would not make it more correct — it would make it a different screen,
 * answering a question nobody asked.
 *
 * So what changed is only the dishonest half. The type is now `StockedPool`,
 * which says "any registered pool, and this board happens to ask for three",
 * and the table names come out of the registry instead of being composed here.
 * WHICH three is still decided above, by hand, on purpose.
 *
 * The four it does not cover — `product`, `tracklist`, `dish`, `bank_item` —
 * are named here rather than left as an absence, because rule 19's worst shape
 * is a gap that reads as a full board. `dish` and `bank_item` in particular are
 * stocked pools with real coverage consequences; a destination with no
 * atmosphere is a thin evening. If a curator ever asks why the board says a
 * room is covered when its bank is empty, THAT is the day this becomes a
 * product decision, and the answer is a wider board rather than a wider type.
 *
 * ── AMENDED: THAT DAY CAME, AND ONLY FOR ONE OF THE FOUR ─────────────
 *
 * CLAUDE.md rule 14 — the paragraphs above are kept exactly as written, because
 * they are still the reason this board is not a census. What changed is one
 * membership, on a founder ruling:
 *
 *   "Add atmosphere (per-slot) as the fourth coverage dimension — it's now
 *    load-bearing for the member experience by your own migration — and leave
 *    the rest excluded-and-named."
 *
 * WHAT MOVED WAS NOT THE ARGUMENT BUT THE FACT UNDER IT. When the paragraph
 * above was written, `bank_item` was a registered pool with a `world_id` and no
 * way into a package. db/043 gave it four named slots on nine occasions, one of
 * them REQUIRED on the five occasions that are an evening around a table, and
 * a member's package now renders atmosphere or reports a gap where it should
 * have been. That is a different kind of fact from "it has an
 * `ingredient_pool` row", and it is the only kind that earns a column — which
 * is the older paragraph's own test, applied and passed rather than overruled.
 *
 * STILL EXCLUDED, STILL NAMED, and the reason is the same test failing:
 *
 *   `product`     fills db/009's `table_object` and reaches a package, but no
 *                 ruling has made it a dimension the library is measured on,
 *                 and a column added on an agent's own authority is exactly
 *                 the curatorial creep the paragraph above refuses.
 *   `tracklist`   the soundtrack slot. Same standing as `product`.
 *   `dish`        [NO LONGER EXCLUDED — see THE DECLARED EXCLUSIONS at the
 *                 end of this comment for the current list. Kept because the
 *                 prediction is the part worth remembering.]
 *                 the strongest candidate to be next, and it is worth saying
 *                 why plainly rather than leaving it implied: db/022 moved
 *                 `typical_draw` to 3 for dishes and 0 for menus, so the
 *                 courses on her table are drawn from `dish` and the MENUS
 *                 column above is measuring the container rather than the
 *                 contents. That is a real question about this board and it is
 *                 not this change's question. It is written down here so that
 *                 whoever asks it next finds it already asked.
 *                 [IT WAS ASKED THE NEXT DAY, and answered — see the second
 *                 amendment below. This paragraph is kept because predicting
 *                 the defect and shipping past it is the part worth
 *                 remembering.]
 *
 * ── AMENDED AGAIN: SOMETHING TO SERVE IS NO LONGER A MENU ────────────
 *
 * CLAUDE.md rule 14 once more. Everything above stands; one column changed
 * what it measures, on a founder ruling, because it was reporting a fact it
 * could not have:
 *
 *   "'Something to serve' is counted as menu — a pool with zero slots that no
 *    package can deliver. The board is reporting serve-coverage via rows
 *    nothing draws, while actual serving happens through three dish slots the
 *    board doesn't look at. A room could be menu-covered and unable to fill
 *    `the_dessert`. That's not rule 15's 'unowned fact' tier — that's the
 *    board claiming certainty it doesn't have, this week's named defect, on
 *    the surface built to prevent it."
 *
 * THE FACT, VERIFIED AGAINST A MIGRATED DATABASE RATHER THAN INFERRED:
 * `occasion_slot` holds ZERO rows for `menu` and three for `dish`
 * (`the_appetizer`, `the_main`, `the_dessert`), and `ingredient_pool
 * .typical_draw` is 0 for menu and 3 for dish. db/022 composed the table out of
 * courses and said so in its own prose — "the engine no longer has a slot to
 * put a menu in" — and this board went on counting menus for a year of
 * migrations because a count of authored rows LOOKS like coverage from every
 * angle. Same family as rule 19's `portal/occasions.ts`: not broken, just no
 * longer about anything.
 *
 * WHAT REPLACED IT: the three dish slots, rendered exactly as atmosphere's
 * four. A room with plenty of appetisers and no dessert now reads as the gap
 * it is, which is the entire argument for per-slot made a second time.
 *
 * WHAT WAS REMOVED, AND EXACTLY THAT: the menu COLUMN on this board, and the
 * menu pool's contribution to the three spreads beside it. Nothing else. The
 * founder drew the line herself, and it is repeated here because the tempting
 * next step is a tidy-up that costs a decision:
 *
 *   "Make sure the right thing gets removed: the board column, not the desk
 *    tab. /desk/menus is where the 39 authored menus live for future decisions
 *    — that stays. Same for the pool, the registry entry, and the render path
 *    in picks.ts; those are the preserved fallback, they're invisible to the
 *    board, and touching them reopens a closed decision."
 *
 * db/022 line 513 deleted nine `occasion_slot` rows for `the_menu` and
 * deliberately kept everything else, so composition could be reverted without
 * losing the pool. The 39 menus are human-composed evenings, not a stale form
 * of the dish catalogue — db/021: "neither is derived from the other and
 * neither replaces the other" — and the live question about them is parked
 * with three named options in docs/needs-a-human.md. NOTHING HERE PROPOSES
 * DELETING ANY OF IT.
 *
 * THE SPREADS MOVED WITH THE COLUMN — the aggregate half of the same removal.
 * `seasonCell`, `makingCell` and `occasionCell` read DISHES now where they read
 * menus. Rule 19's "grep for its siblings in the same pass — they arrive in
 * families" is the reason. The making spread is the column whose own comment
 * calls it THE ONE THAT GETS MISSED; left on menus it would have been grading
 * the rung of rows nothing draws, which is the identical defect one column to
 * the right of the one just fixed. Dishes carry `making` and `season` in their
 * own columns (db/021), so the swap changes the argument and not the logic.
 *
 * ── THE DECLARED EXCLUSIONS ──────────────────────────────────────────
 *
 * THE CURRENT LIST, kept here so it can be read in one place without following
 * the amendments above. A registered pool that is absent from this board is
 * absent ON PURPOSE and says so, because the alternative is next month's
 * reader — or next month's agent doing a mechanical registry sweep — seeing a
 * gap and helpfully closing it:
 *
 *   `product`    fills db/009's `table_object` and reaches a package, but no
 *                ruling has made it a dimension the library is measured on. A
 *                column added on an agent's own authority is the curatorial
 *                creep the paragraph above refuses.
 *   `tracklist`  the soundtrack slot. Same standing as `product`.
 *   `menu`       no `occasion_slot` draws menus since db/022; pool preserved
 *                as fallback.
 *
 * `dish` HAS LEFT THIS LIST and is not an omission any more — it is what
 * serve-coverage now measures. `bank_item` left it a day earlier.
 *
 * And the reason there is a list at all: the previous agent flagged the
 * three-pool board as a judgement call rather than a schema fact, precisely so
 * that a change like this one could not happen silently. It did not. That
 * instinct is the whole value of the pattern and is worth naming.
 *
 * The board's shape is still a curatorial choice and still made by hand,
 * above, in `board()`. What is NOT made by hand is which slots a block has:
 * see `slotsFor`.
 */
async function pool(
  entity: StockedPool,
  seasonColumn: string | null,
  makingColumn: string | null
): Promise<Scoped[]> {
  // From the registry, never composed. See src/lib/pools/registry.test.ts.
  const registered = tablesFor(entity);
  const missing = !registered?.worldTable
    ? "world"
    : !registered.occasionTable
      ? "occasion"
      : !registered.slotTable
        ? "slot"
        : null;
  if (!registered || missing !== null) {
    throw new Error(
      `the coverage board asked for pool '${entity}', which has no ` +
        `${missing} table. Its migration never called the installer — see ` +
        `db/043.`
    );
  }
  const table = entity;
  const worldTable = registered.worldTable!;
  const occasionTable = registered.occasionTable!;
  const slotTable = registered.slotTable!;
  const idColumn = idColumnFor(entity);
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
    slots: { slot_code: string; fit: string }[];
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
                 from ${worldTable} w where w.${idColumn} = t.id),
              '{}'::jsonb) as worlds,
            coalesce(
              (select jsonb_agg(jsonb_build_object(
                        'occasion', o.occasion, 'fit', o.fit))
                 from ${occasionTable} o where o.${idColumn} = t.id),
              '[]'::jsonb) as occasions,
            coalesce(
              (select jsonb_agg(jsonb_build_object(
                        'slot_code', s.slot_code, 'fit', s.fit))
                 from ${slotTable} s where s.${idColumn} = t.id),
              '[]'::jsonb) as slots
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
      // Same two-state narrowing the occasion claims get above, for the same
      // reason: `occasion_fit` has more spellings than the eligibility rule
      // has meanings, and `claimEligibility` only distinguishes a veto from a
      // claim.
      slots: (row.slots ?? []).map((claim) => ({
        slotCode: claim.slot_code,
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
 * ONE SLOT, IN ONE ROOM — the per-slot cell, shared by both blocks.
 *
 * COUNTS CLAIMS. An item claiming both the dressed table and the general
 * bucket is counted in both cells, on the founder's ruling: "that's not
 * double-counting, it's the truth about the rock." The heading over these
 * columns says `claims per slot` so the number is never read as a headcount,
 * and `blockTotalCell` beside it carries the headcount and says so.
 *
 * ── THE FLOOR IS THE DRAW, NOT A ROUND NUMBER ────────────────────────
 *
 * `poolCell` above uses three because the making axis has three rungs. That
 * reasoning does not transfer to a single slot. What a slot has is a DRAW —
 * `occasion_slot.max_count`, read from the database with the slot — and the
 * honest floor is one more than that.
 *
 *   nothing      the engine files a catalogue gap for this slot in every
 *                package this room is ever used for. Not "thin": absent.
 *   draw or less there is no choice in it. Every evening in this room is lit
 *                by the same lantern and dressed with the same linen, and the
 *                second member to receive it receives a repeat. For an object
 *                that physically ships, that is a defect and not a nuance.
 *   more         the room can vary.
 *
 * ── SAID IN THREE WORDS ──────────────────────────────────────────────
 *
 * `occasionCell` below already argued this and it applies with more force
 * here: "when the whole library is untagged this cell appears on every row and
 * a paragraph repeated twelve times stops being read. The page carries the
 * explanation once, above the table." There are now nine of these columns and
 * eighteen rows; a sentence in each would be a wall. The cell says the fact,
 * the page says what the fact means.
 *
 * NO CELL HERE IS EVER SOFTENED. The take-home column is empty on sixteen of
 * eighteen rooms — 2 active items in the whole bank — and that is the finding
 * this dimension was added to make visible.
 */
function slotCell(
  worldId: string,
  worldName: string,
  slot: PoolSlot,
  block: SlotBlock
): Cell {
  const href = block.href;
  const claims = claimsForSlot(block.items, worldId, worldName, slot.code);

  if (claims.length === 0) {
    return {
      state: "empty",
      value: "none",
      what: "a gap in every package here",
      href,
    };
  }

  if (claims.length <= slot.draw) {
    return {
      state: "thin",
      value: `${claims.length}`,
      what:
        claims.length < slot.draw
          ? `it draws ${slot.draw}`
          : `all ${slot.draw} it draws — no choice`,
      href,
    };
  }

  return { state: "filled", value: `${claims.length}`, what: "", href };
}

/**
 * THE ROOM'S HOLDINGS FOR ONE BLOCK, COUNTED ONCE PER ITEM — and the label
 * that makes the cells beside it readable.
 *
 * DISTINCT ITEMS, on the founder's ruling: "Distinct-items is the right basis
 * only for a per-room total column." So this number can be SMALLER than the
 * sum of the cells to its left, and she has pre-approved that: "The mismatch
 * between them (total < sum of cells) is correct output, same category as the
 * empty take-home cells." Both bases are named in the headings and again in
 * the note above the table, so a reader who adds the row up and finds it long
 * is not looking at a suspected bug.
 *
 * ── IT CANNOT SAY A ROOM IS FINE ─────────────────────────────────────
 *
 * Two states, never three, and this is the guard against the one thing the
 * brief for these columns forbade — aggregating the slots to make the board
 * look healthier. `thin` is a per-slot judgement and this cell is not allowed
 * to make one: a room with nine general-bucket items and nothing to take home
 * must not be able to earn a reassuring amber here that competes with the
 * oxblood two columns to its left. It reports presence, absence, and which
 * basis it counted on. The verdicts are all to its left.
 */
function blockTotalCell(
  worldId: string,
  worldName: string,
  block: SlotBlock
): Cell {
  const codes = block.slots.map((slot) => slot.code);
  const items = itemsForRoom(block.items, worldId, worldName, codes);

  if (items.length === 0) {
    return {
      state: "empty",
      value: "none",
      what: "nothing reaches this room at all",
      href: block.href,
    };
  }

  return {
    state: "filled",
    value: `${items.length}`,
    what: "distinct",
    href: block.href,
  };
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
  const href = "/desk/dishes";
  const seasons = new Set(
    things.map((thing) => thing.season).filter((s): s is string => s !== null)
  );

  if (seasons.size === 0) {
    return {
      state: "empty",
      value: "nothing seasoned",
      what: "no dish and no drink reaches this destination",
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
 * a destination whose dishes are all actually made does not fail for her. It
 * matches her, and then hands her an afternoon of cooking she said she did not
 * want, and nothing anywhere reports it.
 *
 * Dishes and drinks are judged SEPARATELY and the worse of the two decides the
 * cell. They are one axis (db/016 asks it once), but they are two tables: a bar
 * that pours something bought does not save a host from a kitchen.
 *
 * READ OVER DISHES, NOT MENUS, since the ruling in `pool`'s doc above. The
 * founder's sentence was written about menus, and it is the same sentence:
 * what lands on her table is three courses drawn from `dish` (db/022), so the
 * rung that reaches her is the dishes' rung. Left on menus this column would
 * have been grading rows no package draws — the defect that ruling was about,
 * one column further right.
 */
function makingCell(
  worldId: string,
  dishes: readonly Scoped[],
  drinks: readonly Scoped[]
): Cell {
  const href = "/desk/dishes";
  if (dishes.length === 0 && drinks.length === 0) {
    return {
      state: "empty",
      value: "nothing made or bought",
      what: "no dish and no drink reaches this destination",
      href,
    };
  }

  const missing = (things: readonly Scoped[]) => {
    const have = new Set(things.map((thing) => thing.making));
    return MAKING.filter((level) => !have.has(level));
  };

  const dishesMissing = missing(dishes);
  const drinksMissing = missing(drinks);

  const say = (levels: readonly string[]) =>
    levels
      .map(
        (code) =>
          COOKING_LEVELS.find((l) => l.code === code)?.label.toLowerCase() ?? code
      )
      .join(", ");

  if (dishesMissing.length === 0 && drinksMissing.length === 0) {
    return {
      state: "filled",
      value: "all three, on the table and at the bar",
      what: "",
      href,
    };
  }

  const parts: string[] = [];
  if (dishes.length === 0) parts.push("no dishes at all");
  else if (dishesMissing.length > 0) {
    parts.push(`no dish that is ${say(dishesMissing)}`);
  }
  if (drinks.length === 0) parts.push("no drinks at all");
  else if (drinksMissing.length > 0) {
    parts.push(`no drink that is ${say(drinksMissing)}`);
  }

  const everythingIsOneRung =
    dishes.length > 0 && dishesMissing.length === MAKING.length - 1;

  return {
    state: everythingIsOneRung || dishes.length === 0 ? "empty" : "thin",
    value: everythingIsOneRung
      ? `every dish is ${say(
          MAKING.filter((level) => !dishesMissing.includes(level))
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
