/**
 * WHAT IS IN HER REVELLE — READ OFF THE REGISTRY, NOT OFF A LIST.
 *
 * This is the member-facing read. Everything that reaches the page she opens
 * on the day comes through here, and what does not come through here she never
 * learns existed. That asymmetry is the whole reason the file is separate from
 * src/lib/portal/occasions.ts and the whole reason it is written the way it is.
 *
 * ── THE ARGUMENT THIS REPLACES, KEPT WHOLE (CLAUDE.md rule 14) ───────
 *
 * The read used to run off a `POOLS` constant declared a few lines above it —
 * five entries, product, game, tracklist, menu, drink — and the note beside it
 * read, verbatim:
 *
 *     WHAT IS IN HER REVELLE, from the join tables and nowhere else.
 *
 *     One statement per pool rather than a union over `revelle_ingredient`,
 *     because that view carries only ids and the name and the authored text
 *     are the whole point. The pool list is a constant of this module — never
 *     a value from a request — so composing the identifiers into SQL is safe
 *     in the one way that matters, exactly as src/lib/selection/catalogue.ts
 *     argues.
 *
 *     A pool with no row for this Revelle contributes nothing and says
 *     nothing.
 *
 * The first paragraph SURVIVES and is why this file still issues one statement
 * per pool instead of selecting from `revelle_ingredient`. The second is also
 * still true about injection, and it is beside the point: the list was never
 * unsafe, it was INCOMPLETE. `dish` and `bank_item` are registered pools with
 * their own `revelle_dish` and `revelle_bank_item` join tables, and neither was
 * on it. Anything issued into either rendered as nothing at all — no error, no
 * gap message, no empty state, just a package on her screen missing its
 * dishes.
 *
 * The third sentence is the one that was actively dangerous. "A pool with no
 * row for this Revelle contributes nothing and says nothing" is correct and
 * humane — that is the absent-deliverable rule. But the code could not tell
 * that case apart from "a pool with rows this file has no idea how to read",
 * and it treated both as silence. CLAUDE.md rule 19 now names the difference:
 *
 *     IF A POOL THE REGISTRY KNOWS ABOUT RETURNS ROWS A SURFACE CANNOT
 *     RENDER, THAT IS AN ERROR STATE, NOT AN EMPTY SECTION.
 *
 * ── SO: THE REGISTRY DECIDES WHICH POOLS, THIS FILE DECIDES HOW ──────
 *
 * `ingredient_pool` (db/002, extended by db/009) is the only thing that knows
 * what the pools are. `install_revelle_ingredients()` writes a row of it every
 * time a pool is installed, carrying `join_table` — so a seventh pool becomes
 * part of this read on the day its migration runs, which is the point of rule
 * 19. The pool list is no longer a thing anybody can forget to edit.
 *
 * WHAT THE REGISTRY CANNOT SAY is which column holds the sentence a member
 * reads. There is no one answer: a product and a game have `description`, a
 * menu's line of dishes IS the thing (db/012), a drink has two authored lines
 * on one row (db/017), and a dish has no description column at all because the
 * plate is the sentence (db/021). Those are facts about AUTHORING, not about
 * the schema, and putting them in `ingredient_pool` would be putting a portal
 * concern in a migration. So they stay here, in `RENDERING` — but `RENDERING`
 * is no longer the list of pools. It is a lookup, and a registered pool that
 * misses it is a loud failure rather than a silent absence.
 *
 * ── `world` IS A POOL AND HAS NO JOIN TABLE ──────────────────────────
 *
 * db/002 registers `world` in `ingredient_pool` with `join_table` NULL on
 * purpose: db/001 already carries the chosen destination as `revelle.world_id`
 * and a join table would be a second place for one fact. A loop over every
 * registry row would therefore compose `revelle_world`, which does not exist,
 * and the page would 500 for everybody.
 *
 * It is excluded by `join_table is not null` rather than by name. That is not a
 * shortcut around naming it — it is the more exact statement of the rule. The
 * predicate says "pools whose ingredients live in a join table", which is
 * precisely the set this read can read, and it stays right for a second
 * join-table-less pool nobody has thought of. Excluding `world` by name would
 * be a hand-written list of one, which is the thing rule 19 is about.
 *
 * ── FRAMEWORK-FREE, LIKE ITS TWO SIBLINGS ───────────────────────────
 *
 * No React, no `server-only`, no `@/` alias. Same rule as src/lib/desk/
 * publish.ts and src/lib/desk/stocked.ts, and here it buys the same thing it
 * buys them: a test can import this file and drive it against a real database
 * without starting Next. That is not a convenience. A bench proof is the only
 * way to demonstrate that a dish issued into a Revelle actually reaches her
 * page, and "one line nobody proves" is exactly how the missing pools survived.
 *
 * It composes identifiers with `composed` from src/lib/desk/publish.ts rather
 * than a local copy. The portal reaching into the desk's module reads oddly for
 * about a second, and then the alternative reads worse: that file's own note
 * says a second copy "would be a second opinion about how an identifier out of
 * a table gets quoted, which is the kind of second opinion that becomes an
 * injection". This is the pattern's third consumer, not a fourth style.
 */

import { composed, type Ask } from "../desk/publish.ts";
import { isSettled } from "./choice.ts";
import type {
  Candidate,
  Ingredient,
  Pick,
  PrintedPiece,
  SectionKind,
  UnitSlot,
} from "../selection/types.ts";

/* ── one row of one pool ────────────────────────────────────────────── */

export type PickRow = {
  pool: string;
  entity_id: string;
  slug: string;
  name: string;
  description: string;
  /** drink.mocktails — the second build of the same record. Null elsewhere. */
  mirror: string | null;
  slot_code: string | null;
  slot_label: string | null;
  slot_section: string | null;
  slot_per_guest: boolean | null;
  slot_position: number | null;
  section: string | null;
  position: number | null;
  /**
   * db/061. Which set of alternatives this row is one of, or null when the
   * house simply placed it — which is every row of every pool but the game,
   * and every game row delivered before the founder's ruling.
   */
  offer_group: string | null;
  /** db/061. When she took this one. Null means she has not. */
  chosen_at: string | null;
  printed_matter: unknown;
};

/** The same row before anything has vouched for it. */
type RawRow = Omit<PickRow, "entity_id" | "slug" | "name"> & {
  entity_id: string | null;
  slug: string | null;
  name: string | null;
};

/* ── how one pool's words are read ──────────────────────────────────── */

/**
 * HOW TO READ ONE POOL'S AUTHORED TEXT. Not which pools exist — the registry
 * says that. See the essay above for why this half cannot move into db/002.
 *
 * Keyed by `ingredient_pool.entity_table`. Every value in it is an IDENTIFIER
 * and reaches the database through `format(%I)`, never through interpolation.
 */
type Rendering = {
  /** The column holding the sentence she reads. */
  describe: string;
  /** drink.mocktails. The mirror travels with the drink or not at all. */
  mirror: string | null;
  /** A table of authored printed objects, or null. */
  printed: string | null;
};

const RENDERING: Readonly<Record<string, Rendering>> = {
  product: { describe: "description", mirror: null, printed: null },
  game: { describe: "description", mirror: null, printed: "game_printed_matter" },
  tracklist: { describe: "description", mirror: null, printed: null },
  // A menu has no description and its line of dishes IS the thing — db/012.
  menu: { describe: "dishes", mirror: null, printed: null },
  // A drink has two authored lines on ONE row — the cocktails and the mocktail
  // mirror of the same glass (db/017). Both are read here so that a delivered
  // Revelle can never show one without the other.
  drink: { describe: "cocktails", mirror: "mocktails", printed: null },
  // A DISH HAS NO DESCRIPTION COLUMN, and db/021 declines to give it one: the
  // plate is the sentence, which is db/012's ruling one level down. So the name
  // is both the label and the line, exactly as src/lib/selection/catalogue.ts
  // reads it on the forward path. Nothing prints — a dish is not a card, and
  // when it becomes part of one it will be part of the MENU card.
  dish: { describe: "name", mirror: null, printed: null },
  // db/031's atmosphere pool. `description` is the curator's line about the
  // object or the act. A `printed_card` bank item is a thing she is sent, not
  // a piece this read composes, so nothing prints from here either.
  bank_item: { describe: "description", mirror: null, printed: null },
};

/**
 * Does the portal know how to read this pool's words?
 *
 * Exported for the bench, which asserts that every pool `ingredient_pool`
 * registers with a join table has an entry here. That assertion is the cheap
 * half of rule 19: it turns "the next pool will be forgotten" from something
 * discovered on a member's screen into a red test on the day the migration
 * lands. `readPicks` is the expensive half and catches it either way.
 */
export function hasRenderer(pool: string): boolean {
  return Object.hasOwn(RENDERING, pool);
}

/* ── the loud form ──────────────────────────────────────────────────── */

/** One pool that had rows and could not be turned into anything she can read. */
export type Unrenderable = {
  /** `ingredient_pool.entity_table`. */
  pool: string;
  /** How many rows of hers are stranded in it. Never zero. */
  rows: number;
  /** Which of the two failures it is, in a sentence a curator can act on. */
  why: string;
};

/**
 * HER REVELLE CANNOT BE READ WHOLE, SO IT IS NOT HANDED OVER AT ALL.
 *
 * Thrown by `readPicks` and by nothing else. It is deliberately a THROW rather
 * than a field on the result, because a field would have to be checked and the
 * entire failure mode being fixed here is a check nobody wrote. A caller that
 * ignores this cannot ignore it quietly.
 *
 * ── WHY THE WHOLE OCCASION AND NOT THE MISSING PART ──────────────────
 *
 * Because the missing part is exactly what is not knowable. When a pool cannot
 * be read, this file cannot say whether it held one favour or the entire
 * table; what it can say is that the package on the screen is NOT the package
 * that was assembled. docs/selection-spec.md's slot minimums exist so a member
 * never receives silently thinned goods, and rendering "what we could read" is
 * that harm arriving through the back door with the front door still locked.
 *
 * There is a precedent and this follows it: `memberRevelle()` throws on a
 * blocked candidate rather than returning something smaller, for the same
 * reason in the same words — "that is a reason to withhold the whole Revelle,
 * not to quietly hand over a thinner one".
 *
 * ── AND WHY IT IS RAISED HERE, AT THE QUERY ─────────────────────────
 *
 * This is the last place in the program where the failure is visible. One
 * statement further on, a row that could not be read and a row that never
 * existed are the same absence — there is no `Pick` for either, no gap, no
 * marker, nothing downstream can tell them apart, and every surface after this
 * one would be right to render silence. So detection cannot live at the render
 * layer; only TRANSLATION can, which is what src/app/portal/occasions/[id]/
 * page.tsx does with it.
 *
 * What it carries is for the house — pool names, counts, a revelle id. Nothing
 * in it may be shown to a member; the page catches it by type and renders its
 * own words. See rule 16: the failure says so loudly, where the person is
 * standing, and the two people standing here need two different sentences.
 */
export class UnrenderableIngredients extends Error {
  readonly revelleId: string;
  readonly pools: readonly Unrenderable[];

  constructor(revelleId: string, pools: readonly Unrenderable[]) {
    super(
      `revelle ${revelleId} has ingredients the portal cannot render: ` +
        pools
          .map((entry) => `${entry.rows}×${entry.pool} (${entry.why})`)
          .join("; ") +
        `. It has been withheld from the member rather than shown thinned. ` +
        `A pool registered in ingredient_pool needs an entry in RENDERING in ` +
        `src/lib/portal/picks.ts before anything may be issued into it.`
    );
    this.name = "UnrenderableIngredients";
    this.revelleId = revelleId;
    this.pools = pools;
  }
}

/* ── the read ───────────────────────────────────────────────────────── */

type Registered = { entity_table: string; join_table: string };

/**
 * EVERY POOL THAT KEEPS ITS INGREDIENTS IN A JOIN TABLE.
 *
 * `join_table is not null` is the whole of the `world` exclusion and the essay
 * at the top says why it is the exact statement rather than a convenient one.
 * Ordered by `entity_table` so a run is reproducible; the order she actually
 * reads them in is decided later, by `memberRevelle()` sorting on slot
 * position, and this only breaks ties between two hand-placed rows that name
 * neither a slot nor a position.
 */
async function registered(ask: Ask): Promise<Registered[]> {
  return ask<Registered>(
    `select entity_table, join_table
       from ingredient_pool
      where join_table is not null
      order by entity_table`
  );
}

/**
 * Her rows, out of every registered join table, with their authored words.
 *
 * Throws `UnrenderableIngredients` if any pool held rows of hers that could not
 * be turned into something she can read. Two ways that happens, and both are
 * detected rather than assumed:
 *
 *   · THE POOL HAS NO ENTRY IN `RENDERING`. A pool registered after this file
 *     was written — which is the case that produced the bug rule 19 is named
 *     for. Its rows are counted rather than selected, because without a
 *     `describe` column there is no statement to write.
 *   · A ROW IS IN THE JOIN TABLE AND ITS OWN ROW IS GONE. The join is a LEFT
 *     join for this and only this. `install_revelle_ingredients()` makes the
 *     foreign key `on delete restrict` precisely so it cannot happen, so the
 *     inner join it replaces was not wrong — it was UNFALSIFIABLE. A left join
 *     costs nothing and turns "cannot happen" into "did not happen", which is
 *     a claim this file can actually make.
 */
export async function readPicks(
  ask: Ask,
  revelleId: string
): Promise<PickRow[]> {
  const out: PickRow[] = [];
  const stranded: Unrenderable[] = [];

  for (const pool of await registered(ask)) {
    const render = RENDERING[pool.entity_table];

    if (!render) {
      const rows = await strandedCount(ask, pool.join_table, revelleId);
      // ZERO IS NOT A FAILURE, and the distinction is the humane half of the
      // rule. A pool she has nothing from contributes nothing and says
      // nothing — that is the absent-deliverable rule and it is untouched.
      // Registering a pool must not break every member's page; issuing into
      // one nothing can read must break the page it guts.
      if (rows > 0) {
        stranded.push({
          pool: pool.entity_table,
          rows,
          why: "no entry in RENDERING — the portal cannot read this pool's words",
        });
      }
      continue;
    }

    const rows = await readPool(ask, pool, render, revelleId);
    const gone = rows.filter((row) => row.entity_id === null);
    if (gone.length > 0) {
      stranded.push({
        pool: pool.entity_table,
        rows: gone.length,
        why: `row in ${pool.join_table} with no matching ${pool.entity_table}`,
      });
      continue;
    }
    out.push(...(rows as PickRow[]));
  }

  if (stranded.length > 0) {
    throw new UnrenderableIngredients(revelleId, stranded);
  }

  return out;
}

/** How many of her rows are stuck in a pool nothing here can read. */
async function strandedCount(
  ask: Ask,
  joinTable: string,
  revelleId: string
): Promise<number> {
  const text = await composed(
    ask,
    "select count(*)::int as rows from %I where revelle_id = $1",
    [joinTable]
  );
  const rows = await ask<{ rows: number }>(text, [revelleId]);
  return Number(rows[0]?.rows ?? 0);
}

/**
 * One pool's rows, composed by Postgres's own `format()`.
 *
 * Every identifier below arrives as a `%I` argument: the join table and the
 * entity table out of `ingredient_pool`, the columns out of `RENDERING`. The
 * template's `$1` survives `format()` untouched — publish.ts's `composed` says
 * so where it stands — which is how the revelle id stays a bound parameter.
 *
 * `<entity>_id` is the one name not taken from a column of the registry, and it
 * is not a guess: `install_revelle_ingredients()` computes the column as
 * `p_entity_table || '_id'` in the same statement that computes `join_table`,
 * so this reproduces the installer's own expression rather than a convention
 * somebody remembers. src/lib/desk/connections.ts and the matrix action derive
 * it the same way beside the same registry.
 */
async function readPool(
  ask: Ask,
  pool: Registered,
  render: Rendering,
  revelleId: string
): Promise<RawRow[]> {
  const idColumn = `${pool.entity_table}_id`;
  const args: string[] = [pool.entity_table, render.describe];

  let template =
    "select %L::text as pool," +
    " t.id::text as entity_id, t.slug::text as slug, t.name," +
    " t.%I as description,";

  if (render.mirror) {
    template += " t.%I as mirror,";
    args.push(render.mirror);
  } else {
    template += " null::text as mirror,";
  }

  template +=
    " j.slot_code, j.slot::text as section, j.position," +
    // db/061. The offer and her choice. Read for every pool, not only the
    // game: the columns are on every join table because occasion_slot's
    // offer_count is pool-agnostic, and a read that only looked for them on
    // one pool would drop an offer the plan legitimately produced.
    " j.offer_group, j.chosen_at::text as chosen_at," +
    " sk.label as slot_label, sk.section::text as slot_section," +
    " sk.per_guest as slot_per_guest, sk.position as slot_position,";

  if (render.printed) {
    template +=
      " coalesce((select jsonb_agg(jsonb_build_object(" +
      "'piece', pm.piece, 'label', pm.label, 'description', pm.description," +
      " 'per_guest', pm.per_guest, 'quantity', pm.quantity)" +
      " order by pm.position, pm.piece)" +
      " from %I pm where pm.%I = t.id), '[]'::jsonb) as printed_matter";
    args.push(render.printed, idColumn);
  } else {
    template += " '[]'::jsonb as printed_matter";
  }

  template +=
    " from %I j" +
    " left join %I t on t.id = j.%I" +
    " left join slot_kind sk on sk.code = j.slot_code" +
    " where j.revelle_id = $1" +
    // AN ORDER, BECAUSE THE CARDS MUST NOT MOVE. CLAUDE.md rule 18: between a
    // mistake and its fix the thing being corrected stays where it was, and
    // the three candidates of an offer share a slot_kind position, so without
    // this the carousel's order would be whatever the planner felt like today.
    // `j.position` is stamped once at approval and never recomputed.
    " order by j.position nulls last, t.name, t.id";
  args.push(pool.join_table, pool.entity_table, idColumn);

  return ask<RawRow>(await composed(ask, template, args), [revelleId]);
}

/* ── the rows, as something she may see ─────────────────────────────── */

/**
 * The destination her Revelle is set in, and how many people are coming.
 *
 * Narrower than the row `readOccasion` selects, on purpose: this is everything
 * building a Candidate needs, and a test that has to fabricate a whole database
 * row to prove a dish renders is a test nobody writes.
 */
export type Setting = {
  worldId: string;
  worldSlug: string;
  name: string;
  tagline: string;
  guestCount: number | null;
};

/**
 * The rows, as a Candidate.
 *
 * Every house-side field is empty because there is nothing to put in it: the
 * search that produced these rows happened elsewhere, and what it rejected was
 * never written down beside what it chose. `blocked` is null because a stored
 * Revelle has already been delivered — the uniqueness guard in db/002 refused
 * it or it would not be a row.
 *
 * The scoring numbers on each Pick are zeroes rather than reconstructions. A
 * Pick's score is a fact about a search, not about a thing she owns, and
 * inventing one would be inventing evidence.
 */
export function candidateFrom(
  setting: Setting,
  picks: readonly PickRow[]
): Candidate {
  return {
    rank: 1,
    destination: {
      id: setting.worldId,
      slug: setting.worldSlug,
      name: setting.name,
      tagline: setting.tagline,
      facets: {},
      occasions: [],
      issuance: null,
      isFixture: setting.worldSlug.startsWith("fixture-"),
    },
    destinationScore: 0,
    destinationRank: 1,
    ditheredRank: 1,
    picks: picks.map((pick) => toPick(pick, setting.guestCount)),
    dropped: [],
    gaps: [],
    swaps: [],
    fingerprint: null,
    budget: {
      guests: null,
      guestsAreConfirmed: false,
      planning: null,
      ceiling: null,
      totalCents: 0,
      totalPerHeadCents: null,
      overage: null,
      overagePerHead: null,
      unbounded: false,
      unpricedItems: [],
    },
    score: 0,
    lowConfidence: false,
    blocked: null,
    explanation: {
      headline: "",
      destination: [],
      eliminated: [],
      forced: [],
      dropped: [],
      swapped: [],
      budget: [],
      emphasis: [],
      venue: [],
      gaps: [],
      excluded: [],
      confidence: [],
      secret: null,
    },
  };
}

function toPick(row: PickRow, guestCount: number | null): Pick {
  // slot_code is nullable: db/009 allows an ingredient placed by hand at the
  // desk to name no slot. It still has to render, and the block it renders
  // into is `slot`, which is the coarser fact and is always recorded.
  const section = (row.slot_section ?? row.section ?? "details") as SectionKind;
  const perGuest = row.slot_per_guest ?? false;

  const slot: UnitSlot = {
    key: `${row.pool}:${row.entity_id}`,
    slotCode: row.slot_code ?? section,
    label: row.slot_label ?? "",
    section,
    pool: row.pool,
    required: false,
    quantity: perGuest ? Math.max(guestCount ?? 1, 1) : 1,
    perGuest,
    dayIndex: null,
    position: row.slot_position ?? row.position ?? 0,
    note: "",
    // db/061. Carried so the page can show her the choice she was given; the
    // ORDER of the cards is the order this row arrived in, not this number.
    offerGroup: row.offer_group ?? null,
  };

  // WHAT SHE HAS NOT PICKED PRINTS NOTHING AND BUYS NOTHING.
  //
  // The card is hers — db/061 argues the offer is what was delivered — but it
  // is not yet part of the night, and printing a ballot for a game she has not
  // chosen would put three games' worth of objects in The Printed Matter and
  // three games' worth of shopping in The Prep. `readPrep` applies the same
  // rule in SQL through `settledSql`; both read it off src/lib/portal/choice.ts
  // so the page and the shopping list cannot come to disagree (rule 21).
  const settled = isSettled(row.offer_group, row.chosen_at);

  const ingredient: Ingredient = {
    pool: row.pool,
    id: row.entity_id,
    slug: row.slug,
    name: row.name,
    description: row.description ?? "",
    priceCents: null,
    facets: {},
    occasions: [],
    slots: [],
    worlds: {},
    issuance: null,
    minGuests: null,
    maxGuests: null,
    shape: null,
    printedMatter: settled ? printedMatterFor(row) : [],
    isFixture: row.slug.startsWith("fixture-"),
  };

  return {
    slot,
    ingredient,
    unitCost: null,
    lineCost: null,
    facetMatch: 0,
    affinity: 0,
    issuancePenalty: 0,
    similarityPenalty: 0,
    score: 0,
    forced: false,
    alternatives: 0,
    // Only ever true here. The engine delivers an offer and never chooses.
    chosen: row.offer_group !== null && row.chosen_at !== null,
  };
}

/**
 * What one stored pick prints. The same two rules the forward path applies in
 * src/lib/selection/catalogue.ts, and deliberately the same two: a menu is one
 * card made of its dishes, a game has its authored objects, everything else
 * prints nothing at all. Read that file's note for why.
 */
function printedMatterFor(row: PickRow): PrintedPiece[] {
  // A drink prints two objects from one row: the bar card and its mirror.
  // Never one alone — db/017 makes the pair structural and this is where a
  // delivered Revelle would otherwise be able to lose half of it.
  if (row.pool === "drink") {
    const cocktails = (row.description ?? "").trim();
    const mirror = (row.mirror ?? "").trim();
    if (cocktails.length === 0 || mirror.length === 0) return [];
    return [
      {
        piece: "drink_card",
        label: "The drinks",
        description: cocktails,
        perGuest: false,
        quantity: null,
      },
      {
        piece: "mirror_card",
        label: "The mirror",
        description: mirror,
        perGuest: false,
        quantity: null,
      },
    ];
  }

  if (row.pool === "menu") {
    const dishes = (row.description ?? "").trim();
    if (dishes.length === 0) return [];
    return [
      {
        piece: "menu_card",
        label: "The menu",
        description: dishes,
        perGuest: false,
        quantity: null,
      },
    ];
  }
  return printedPieces(row.printed_matter);
}

function printedPieces(value: unknown): PrintedPiece[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => {
    const object = entry as Record<string, unknown>;
    return {
      piece: String(object.piece ?? ""),
      label: String(object.label ?? ""),
      description: String(object.description ?? ""),
      perGuest: Boolean(object.per_guest),
      quantity:
        object.quantity === null || object.quantity === undefined
          ? null
          : Number(object.quantity),
    };
  });
}
