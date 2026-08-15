import "server-only";

/**
 * ONE REVELLE, READ BACK OUT OF THE DATABASE, FOR THE WOMAN IT BELONGS TO.
 *
 * The selection engine's snapshot goes forwards: an application in, candidates
 * out. This is the return journey — a delivered Revelle in the tables, read
 * back as the thing she opens on the day. There is no generation step between
 * the two yet; when there is, it writes exactly the rows this file reads and
 * nothing here changes.
 *
 * ── THE WALL IS CROSSED IN ONE PLACE, AND IT IS memberRevelle() ──────
 *
 * The rows are assembled into a `Candidate` and handed to `memberRevelle()`,
 * which is the only sanctioned way to anything a member may see (see the
 * essay at the top of src/lib/selection/member.ts). It would have been shorter
 * to build a MemberRevelle here directly. It would also have been a second
 * crossing, and the second crossing is the one that eventually carries a gap
 * across because somebody wanted to "show what is missing while we test".
 *
 * The Candidate this file builds is deliberately BARREN on the house's side:
 * no gaps, no eliminations, no drops, no explanation, no budget. Not because
 * they are hidden — because they do not exist here. What the pool could not
 * fill left no row, and a row that is not there cannot be read. That is the
 * absent-deliverable rule holding at the level of the schema rather than the
 * level of a component's `if`.
 *
 * ── WHAT IS NOT HERE ─────────────────────────────────────────────────
 *
 * No writes. No guest list, no dues, no correspondence — those are separate
 * jobs with separate tables (docs/portal-spec.md). And no draft Revelles: a
 * Revelle the house is still building is house work, and she must no more see
 * a half-built one than she must see a slot that could not be filled.
 */

import { query, queryOne } from "@/lib/db";
import { memberRevelle, type MemberRevelle } from "@/lib/selection/member";
import type {
  Candidate,
  Ingredient,
  Pick,
  PrintedPiece,
  SectionKind,
  UnitSlot,
} from "@/lib/selection/types";
import { readTheme } from "@/lib/portal/theme";
import type { Theme } from "@/lib/tokens";

/**
 * WHAT SHE MAY OPEN.
 *
 * 'draft' is absent on purpose — see the note above. 'archived' is present:
 * her archive is a large part of what membership is (docs/portal-spec.md), and
 * a société that closes its own records is not keeping any.
 */
const OPENABLE = ["preview", "delivered", "archived"] as const;

/** One line on the shelf. Enough to recognise it and reach it. */
export type OccasionCard = {
  id: string;
  /** The destination's name, or the per-Revelle override. */
  destination: string;
  tagline: string;
  /** ISO date, or null when no date has been fixed. */
  eventDate: string | null;
};

export type Occasions = {
  /** Dated today or later, or not yet dated. Newest last: the next one first. */
  upcoming: OccasionCard[];
  /** The shelf. Most recent first. */
  past: OccasionCard[];
};

/**
 * ONE LINE OF THE PREP.
 *
 * Assembled from the authored rows the placed games already carry — db/010's
 * game_supply and game_requirement — and from nothing else. Every sentence in
 * it was written by a curator about a specific game; none of it is generated,
 * and none of it is a task list the house invented to look thorough.
 */
export type PrepLine = {
  /** The thing itself. "Small canvases or thick paper." */
  item: string;
  /** The curator's sentence about it, or empty. */
  detail: string;
  /** Days before, when there is a real deadline. Zero means no deadline. */
  leadTimeDays: number;
  /** True when the count comes from her guest list rather than a number. */
  perGuest: boolean;
};

export type Occasion = {
  id: string;
  eventDate: string | null;
  /** The destination's long-form point of view, or empty. */
  premise: string;
  /** The private note above the fold, or null. */
  dedication: string | null;
  /** The look, validated. Painted under a scoped selector. */
  theme: Theme;
  /** Everything she actually received, through the one sanctioned door. */
  revelle: MemberRevelle;
  /** A short list. Not a project plan — docs/portal-spec.md says so. */
  prep: PrepLine[];
};

/* ── the shelf ──────────────────────────────────────────────────────── */

export async function listOccasions(customerId: string): Promise<Occasions> {
  const rows = await query<{
    id: string;
    destination: string;
    tagline: string;
    event_date: Date | null;
  }>(
    `select r.id,
            coalesce(r.title_override, w.name)      as destination,
            coalesce(r.tagline_override, w.tagline) as tagline,
            r.event_date
       from revelle r
       join world w on w.id = r.world_id
      where r.customer_id = $1
        and r.status = any($2::revelle_status[])
      order by r.event_date desc nulls first, r.created_at desc`,
    [customerId, OPENABLE]
  );

  const cards = rows.map((row) => ({
    id: row.id,
    destination: row.destination,
    tagline: row.tagline,
    eventDate: date(row.event_date),
  }));

  // Compared as a calendar day, not an instant: a party on Saturday is
  // upcoming for the whole of Saturday, including at one in the morning when
  // she is looking at this in a kitchen.
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = cards
    .filter((card) => card.eventDate === null || card.eventDate >= today)
    .reverse();
  const past = cards.filter(
    (card) => card.eventDate !== null && card.eventDate < today
  );

  return { upcoming, past };
}

/* ── the inside ─────────────────────────────────────────────────────── */

type RevelleRow = {
  id: string;
  occasion: string;
  world_id: string;
  world_slug: string;
  name: string;
  tagline: string;
  description: string;
  tokens: unknown;
  tokens_override: unknown;
  dedication: string | null;
  event_date: Date | null;
  guest_count: number | null;
};

/**
 * Her Revelle, or null.
 *
 * Scoped by customer id in the same statement that finds it, so a member
 * holding another member's id gets the same answer as a member holding a
 * typo: nothing. Not a 403 — there is nothing here to acknowledge the
 * existence of.
 */
export async function readOccasion(
  customerId: string,
  revelleId: string
): Promise<Occasion | null> {
  if (!/^[0-9a-f-]{36}$/i.test(revelleId)) return null;

  const row = await queryOne<RevelleRow>(
    `select r.id, r.event_date, r.guest_count, r.dedication,
            r.tokens_override,
            q.occasion::text                        as occasion,
            w.id                                    as world_id,
            w.slug::text                            as world_slug,
            coalesce(r.title_override, w.name)      as name,
            coalesce(r.tagline_override, w.tagline) as tagline,
            w.description, w.tokens
       from revelle r
       join world w on w.id = r.world_id
       join quiz_response q on q.id = r.quiz_response_id
      where r.id = $1 and r.customer_id = $2
        and r.status = any($3::revelle_status[])`,
    [revelleId, customerId, OPENABLE]
  );
  if (!row) return null;

  const picks = await readPicks(row);
  const look = readTheme(
    merged(row.tokens, row.tokens_override),
    row.world_slug
  );

  return {
    id: row.id,
    eventDate: date(row.event_date),
    premise: row.description ?? "",
    dedication: row.dedication,
    theme: look.theme,
    revelle: memberRevelle(candidateFrom(row, picks)),
    prep: await readPrep(row.id),
  };
}

/**
 * The stored token set with her per-Revelle overrides shallow-merged over it,
 * which is what db/001 says `tokens_override` means. Shallow at the top level
 * only — a Theme's three sub-objects are merged one level deeper, because
 * overriding `palette` wholesale would mean restating sixteen colours to
 * change one.
 */
function merged(base: unknown, override: unknown): unknown {
  const a = (base ?? {}) as Record<string, unknown>;
  const b = (override ?? {}) as Record<string, unknown>;
  const out: Record<string, unknown> = { ...a };
  for (const [key, value] of Object.entries(b)) {
    const left = out[key];
    if (
      left && typeof left === "object" && !Array.isArray(left) &&
      value && typeof value === "object" && !Array.isArray(value)
    ) {
      out[key] = { ...(left as object), ...(value as object) };
      continue;
    }
    out[key] = value;
  }
  return out;
}

type PickRow = {
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
  printed_matter: unknown;
};

/**
 * WHAT IS IN HER REVELLE, from the join tables and nowhere else.
 *
 * One statement per pool rather than a union over `revelle_ingredient`,
 * because that view carries only ids and the name and the authored text are
 * the whole point. The pool list is a constant of this module — never a value
 * from a request — so composing the identifiers into SQL is safe in the one
 * way that matters, exactly as src/lib/selection/catalogue.ts argues.
 *
 * A pool with no row for this Revelle contributes nothing and says nothing.
 */
const POOLS: readonly {
  pool: string;
  table: string;
  describe: string;
  /** drink.mocktails. The mirror travels with the drink or not at all. */
  mirror: string | null;
  printed: string | null;
}[] = [
  { pool: "product", table: "product", describe: "description", mirror: null, printed: null },
  { pool: "game", table: "game", describe: "description", mirror: null, printed: "game_printed_matter" },
  { pool: "tracklist", table: "tracklist", describe: "description", mirror: null, printed: null },
  // A menu has no description and its line of dishes IS the thing — db/012.
  { pool: "menu", table: "menu", describe: "dishes", mirror: null, printed: null },
  // A drink has two authored lines on ONE row — the cocktails and the mocktail
  // mirror of the same glass (db/017). Both are read here so that a delivered
  // Revelle can never show one without the other.
  { pool: "drink", table: "drink", describe: "cocktails", mirror: "mocktails", printed: null },
];

async function readPicks(row: RevelleRow): Promise<PickRow[]> {
  const out: PickRow[] = [];

  for (const spec of POOLS) {
    const idColumn = `${spec.table}_id`;
    const rows = await query<PickRow>(
      `select '${spec.pool}'::text as pool,
              t.id as entity_id, t.slug::text as slug, t.name,
              t.${spec.describe} as description,
              ${spec.mirror ? `t.${spec.mirror}` : "null::text"} as mirror,
              j.slot_code, j.slot::text as section, j.position,
              sk.label     as slot_label,
              sk.section::text as slot_section,
              sk.per_guest as slot_per_guest,
              sk.position  as slot_position,
              ${
                spec.printed
                  ? `coalesce(
                (select jsonb_agg(jsonb_build_object(
                          'piece', pm.piece, 'label', pm.label,
                          'description', pm.description,
                          'per_guest', pm.per_guest, 'quantity', pm.quantity)
                        order by pm.position, pm.piece)
                   from ${spec.printed} pm where pm.${idColumn} = t.id),
                '[]'::jsonb)`
                  : "'[]'::jsonb"
              } as printed_matter
         from revelle_${spec.table} j
         join ${spec.table} t on t.id = j.${idColumn}
         left join slot_kind sk on sk.code = j.slot_code
        where j.revelle_id = $1`,
      [row.id]
    );
    out.push(...rows);
  }

  return out;
}

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
function candidateFrom(row: RevelleRow, picks: PickRow[]): Candidate {
  return {
    rank: 1,
    destination: {
      id: row.world_id,
      slug: row.world_slug,
      name: row.name,
      tagline: row.tagline,
      facets: {},
      occasions: [],
      issuance: null,
      isFixture: row.world_slug.startsWith("fixture-"),
    },
    destinationScore: 0,
    destinationRank: 1,
    ditheredRank: 1,
    picks: picks.map((pick) => toPick(pick, row.guest_count)),
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
  };

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
    printedMatter: printedMatterFor(row),
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

/* ── the prep ───────────────────────────────────────────────────────── */

/**
 * A SHORT LIST.
 *
 * Two kinds of line, and both are things she has to do before the day rather
 * than facts about the evening:
 *
 *   · something to get in hand, from game_supply — and only where it has a
 *     real lead time, because "a pen" is not prep;
 *   · something that could fail on the night through nobody's fault, from the
 *     `fragile` half of game_requirement_kind. db/010 is explicit that this is
 *     what the prep says out loud.
 *
 * Ordered by deadline, longest first, and CAPPED. The cap is the spec's
 * sentence made structural: "a short list, not a project plan". A Revelle with
 * four games would otherwise produce twenty lines and stop being read, which
 * is the same failure the curator's gap list is warned about.
 */
const PREP_MAX = 6;

async function readPrep(revelleId: string): Promise<PrepLine[]> {
  const supplies = await query<{
    item: string;
    detail: string;
    per_guest: boolean;
    lead_time_days: number;
  }>(
    `select s.item, s.detail, s.per_guest, s.lead_time_days
       from revelle_game rg
       join game_supply s on s.game_id = rg.game_id
      where rg.revelle_id = $1
        and s.source <> 'on_hand'
        and s.lead_time_days > 0
      order by s.lead_time_days desc, s.position, s.item`,
    [revelleId]
  );

  const fragile = await query<{ label: string; note: string | null; description: string }>(
    `select k.label, r.note, k.description
       from revelle_game rg
       join game_requirement r on r.game_id = rg.game_id
       join game_requirement_kind k on k.code = r.requirement
      where rg.revelle_id = $1 and k.fragile
      order by k.position`,
    [revelleId]
  );

  const lines: PrepLine[] = [];
  const seen = new Set<string>();

  for (const supply of supplies) {
    if (seen.has(supply.item)) continue;
    seen.add(supply.item);
    lines.push({
      item: supply.item,
      detail: supply.detail ?? "",
      leadTimeDays: supply.lead_time_days,
      perGuest: supply.per_guest,
    });
  }

  for (const need of fragile) {
    if (seen.has(need.label)) continue;
    seen.add(need.label);
    lines.push({
      item: need.label,
      detail: need.note ?? need.description ?? "",
      leadTimeDays: 0,
      perGuest: false,
    });
  }

  return lines.slice(0, PREP_MAX);
}

/* ── small things ───────────────────────────────────────────────────── */

/**
 * A `date` column as its calendar day.
 *
 * `pg` hands back a Date at local midnight for a `date`, so toISOString would
 * move it west of Greenwich onto the previous day. Read the local parts.
 */
function date(value: Date | null): string | null {
  if (!value) return null;
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
