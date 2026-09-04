import "server-only";

/**
 * THE GAME PAGE, READ BACK OUT OF THE DATABASE.
 *
 * The card in her Revelle is `game.description` and it is a teaser. This is
 * what she clicks through to: how it is actually run, what to get, what to
 * print, and what to do when it goes wrong.
 *
 * ── WHO READS THIS AND WHERE ─────────────────────────────────────────
 *
 * She reads it standing up, on a phone, with eleven people in the next room
 * waiting for her to start something. That sentence decides the shape: the
 * steps come back already grouped and already in order, with the timings
 * resolved and the supplies and printed matter already attached to the steps
 * that mention them. The page assembles nothing. A component doing joins is a
 * component that renders half a runbook when one of them returns nothing.
 *
 * ── THE WALL ─────────────────────────────────────────────────────────
 *
 * Everything here is scoped by customer id in the same statement that finds it,
 * exactly as src/lib/portal/occasions.ts is. A member holding another member's
 * revelle id gets the same answer as a member holding a typo: null. And there
 * is no house-side information to withhold — a runbook is authored writing
 * about a game she was given, not a record of a search.
 *
 * A game is only readable through a Revelle that contains it. There is no
 * /portal/games/<slug> and there must not be one: the pool is the house's, and
 * what she has is what she was sent.
 */

import { query, queryOne } from "@/lib/db";
import { settledSql } from "@/lib/portal/choice";

/** Openable statuses, the same three src/lib/portal/occasions.ts allows. */
const OPENABLE = ["preview", "delivered", "archived"] as const;

/** One thing she has to get, with the product link where there is one. */
export type RunbookSupply = {
  item: string;
  /** Plainly what to get, where no product says it. */
  detail: string;
  /** printed / host_buys / on_hand. */
  source: string;
  perGuest: boolean;
  quantity: number | null;
  /** Days before the party. Zero means no deadline. */
  leadTimeDays: number;
  /** Where she can actually buy it. Empty where the answer is "you have one". */
  products: { name: string; url: string | null; supplier: string | null }[];
};

/** One object that gets set in the destination's typeface. */
export type RunbookPrinted = {
  piece: string;
  label: string;
  description: string;
  perGuest: boolean;
  quantity: number | null;
};

export type RunbookStepView = {
  step: string;
  instruction: string;
  detail: string;
  /** Words she may say out loud. Empty where there are none. */
  say: string;
  minutes: number | null;
  /** The supply this step is about, resolved. */
  supply: RunbookSupply | null;
  /** The printed piece it hands out, resolved. */
  printed: RunbookPrinted | null;
};

/** A heading and the steps under it. Only ever built from steps that exist. */
export type RunbookPhaseView = {
  phase: string;
  label: string;
  description: string;
  steps: RunbookStepView[];
};

export type RunbookTrouble = { trouble: string; label: string; answer: string };

export type GamePage = {
  revelleId: string;
  slug: string;
  name: string;
  /** The teaser, repeated at the top so she knows she is in the right place. */
  description: string;
  /** The prose account. What the game is, as opposed to how it is run. */
  howItWorks: string;
  shape: string;
  sourcing: string;
  externalName: string | null;
  externalUrl: string | null;
  caveat: string | null;
  scoring: string | null;
  currencyLabel: string | null;
  minGuests: number | null;
  maxGuests: number | null;
  durationMinutes: number | null;
  durationMaxMinutes: number | null;
  hostRole: "runs_it" | "plays_too";
  hostNote: string | null;
  phases: RunbookPhaseView[];
  troubles: RunbookTrouble[];
  /** Everything she has to get, including what no step happens to mention. */
  supplies: RunbookSupply[];
  /** Everything that gets printed for it. */
  printed: RunbookPrinted[];
  /** The games this one needs to have happened. Any one of them will do. */
  needs: { name: string; note: string | null; placed: boolean }[];
};

type GameRow = {
  game_id: string;
  slug: string;
  name: string;
  description: string;
  how_it_works: string;
  shape: string;
  sourcing: string;
  external_name: string | null;
  external_url: string | null;
  caveat: string | null;
  scoring: string | null;
  currency_label: string | null;
  min_guests: number | null;
  max_guests: number | null;
  duration_minutes: number | null;
  duration_max_minutes: number | null;
  host_role: "runs_it" | "plays_too";
  host_note: string | null;
};

/**
 * The games in one of her Revelles, for linking to from the occasion page.
 *
 * Keyed by slug, because src/lib/selection/member.ts carries a piece's pool and
 * slug and that is the only pair a surface should ever match on.
 */
export async function gamesIn(
  customerId: string,
  revelleId: string
): Promise<Set<string>> {
  if (!/^[0-9a-f-]{36}$/i.test(revelleId)) return new Set();

  const rows = await query<{ slug: string }>(
    `select g.slug::text as slug
       from revelle r
       join revelle_game rg on rg.revelle_id = r.id
       join game g on g.id = rg.game_id
      where r.id = $1 and r.customer_id = $2
        and r.status = any($3::revelle_status[])`,
    [revelleId, customerId, OPENABLE]
  );
  return new Set(rows.map((row) => row.slug));
}

/**
 * One game page, or null.
 *
 * Null covers all four ways this can fail to be a page — not her Revelle, not
 * an openable one, not a game in it, and not a game at all — because they are
 * the same answer: there is nothing here to acknowledge.
 */
export async function readGamePage(
  customerId: string,
  revelleId: string,
  slug: string
): Promise<GamePage | null> {
  if (!/^[0-9a-f-]{36}$/i.test(revelleId)) return null;
  if (!/^[a-z][a-z0-9-]*$/.test(slug)) return null;

  const game = await queryOne<GameRow>(
    `select g.id as game_id, g.slug::text as slug, g.name, g.description,
            g.how_it_works, g.shape::text as shape, g.sourcing::text as sourcing,
            g.external_name, g.external_url, g.caveat,
            g.scoring, g.currency_label,
            g.min_guests, g.max_guests,
            g.duration_minutes, g.duration_max_minutes,
            g.host_role::text as host_role, g.host_note
       from revelle r
       join revelle_game rg on rg.revelle_id = r.id
       join game g on g.id = rg.game_id
      where r.id = $1 and r.customer_id = $2
        and r.status = any($3::revelle_status[])
        and g.slug = $4::citext`,
    [revelleId, customerId, OPENABLE, slug]
  );
  if (!game) return null;

  const [supplies, printed, steps, troubles, needs] = await Promise.all([
    readSupplies(game.game_id),
    readPrinted(game.game_id),
    readSteps(game.game_id),
    readTroubles(game.game_id),
    readNeeds(game.game_id, revelleId),
  ]);

  const supplyBy = new Map(supplies.map((s) => [s.item, s]));
  const printedBy = new Map(printed.map((p) => [p.piece, p]));

  // Grouped by phase, in the curator's order, and a phase with no steps is not
  // in the list — the same absence rule the occasion page holds to. There is no
  // empty heading to render because there is no empty group to iterate.
  const phases: RunbookPhaseView[] = [];
  for (const row of steps) {
    let group = phases[phases.length - 1];
    if (!group || group.phase !== row.phase) {
      group = {
        phase: row.phase,
        label: row.phase_label,
        description: row.phase_description,
        steps: [],
      };
      phases.push(group);
    }
    group.steps.push({
      step: row.step,
      instruction: row.instruction,
      detail: row.detail,
      say: row.say,
      minutes: row.minutes,
      supply: row.supply_item ? supplyBy.get(row.supply_item) ?? null : null,
      printed: row.printed_piece ? printedBy.get(row.printed_piece) ?? null : null,
    });
  }

  return {
    revelleId,
    slug: game.slug,
    name: game.name,
    description: game.description,
    howItWorks: game.how_it_works,
    shape: game.shape,
    sourcing: game.sourcing,
    externalName: game.external_name,
    externalUrl: game.external_url,
    caveat: game.caveat,
    scoring: game.scoring,
    currencyLabel: game.currency_label,
    minGuests: game.min_guests,
    maxGuests: game.max_guests,
    durationMinutes: game.duration_minutes,
    durationMaxMinutes: game.duration_max_minutes,
    hostRole: game.host_role,
    hostNote: game.host_note,
    phases,
    troubles,
    supplies,
    printed,
    needs,
  };
}

/* ── the pieces ─────────────────────────────────────────────────────── */

/**
 * What she has to get, with the shopping edit attached.
 *
 * db/025's game_supply_product is the join, and it is OPTIONAL by design: a
 * supply with no product is a plain instruction to go and find something, which
 * is the right answer for a bowl. Only ACTIVE products are offered — a
 * discontinued row is a link to a page that is not there.
 */
async function readSupplies(gameId: string): Promise<RunbookSupply[]> {
  const rows = await query<{
    item: string;
    detail: string;
    source: string;
    per_guest: boolean;
    quantity: number | null;
    lead_time_days: number;
    products: unknown;
  }>(
    `select s.item, s.detail, s.source::text as source, s.per_guest,
            s.quantity, s.lead_time_days,
            coalesce(
              (select jsonb_agg(jsonb_build_object(
                        'name', p.name,
                        'url', p.external_url,
                        'supplier', p.supplier)
                      order by sp.position, p.name)
                 from game_supply_product sp
                 join product p on p.id = sp.product_id
                where sp.game_id = s.game_id and sp.item = s.item
                  and p.status = 'active'),
              '[]'::jsonb) as products
       from game_supply s
      where s.game_id = $1
      order by s.lead_time_days desc, s.position, s.item`,
    [gameId]
  );

  return rows.map((row) => ({
    item: row.item,
    detail: row.detail ?? "",
    source: row.source,
    perGuest: row.per_guest,
    quantity: row.quantity,
    leadTimeDays: row.lead_time_days,
    products: Array.isArray(row.products)
      ? row.products.map((entry) => {
          const object = entry as Record<string, unknown>;
          return {
            name: String(object.name ?? ""),
            url: object.url === null || object.url === undefined ? null : String(object.url),
            supplier:
              object.supplier === null || object.supplier === undefined
                ? null
                : String(object.supplier),
          };
        })
      : [],
  }));
}

async function readPrinted(gameId: string): Promise<RunbookPrinted[]> {
  const rows = await query<{
    piece: string;
    label: string;
    description: string;
    per_guest: boolean;
    quantity: number | null;
  }>(
    `select piece, label, description, per_guest, quantity
       from game_printed_matter
      where game_id = $1
      order by position, piece`,
    [gameId]
  );
  return rows.map((row) => ({
    piece: row.piece,
    label: row.label,
    description: row.description ?? "",
    perGuest: row.per_guest,
    quantity: row.quantity,
  }));
}

type StepRow = {
  step: string;
  phase: string;
  phase_label: string;
  phase_description: string;
  instruction: string;
  detail: string;
  say: string;
  minutes: number | null;
  supply_item: string | null;
  printed_piece: string | null;
};

async function readSteps(gameId: string): Promise<StepRow[]> {
  return query<StepRow>(
    `select s.step, s.phase, f.label as phase_label,
            f.description as phase_description,
            s.instruction, s.detail, s.say, s.minutes,
            s.supply_item, s.printed_piece
       from game_runbook_step s
       join runbook_phase f on f.code = s.phase
      where s.game_id = $1
      order by s.position, s.step`,
    [gameId]
  );
}

async function readTroubles(gameId: string): Promise<RunbookTrouble[]> {
  return query<RunbookTrouble>(
    `select c.trouble, k.label, c.answer
       from game_contingency c
       join runbook_trouble_kind k on k.code = c.trouble
      where c.game_id = $1
      order by k.position`,
    [gameId]
  );
}

/**
 * The games this one needs to have happened, and whether they are in her
 * Revelle.
 *
 * db/010's any-of reading: required rows sharing a group_key are satisfied when
 * ANY ONE of them is present. The auction needs a way for guests to have earned
 * something; it does not need all four earning games. So the page lists them
 * and marks the ones she actually has, which is the honest rendering of an
 * any-of — and the reason `placed` is a fact about her evening rather than a
 * warning about a gap.
 */
async function readNeeds(
  gameId: string,
  revelleId: string
): Promise<{ name: string; note: string | null; placed: boolean }[]> {
  return query<{ name: string; note: string | null; placed: boolean }>(
    // `placed` MEANS RUNS, NOT DELIVERED — db/061. A game she was offered and
    // did not choose is hers and is not happening, so it cannot be what
    // satisfies another game's dependency. `settledSql` is the one statement
    // of that (src/lib/portal/choice.ts); the page and the shopping list read
    // it from the same place for the same reason.
    `select need.name, d.note,
            exists (select 1 from revelle_game rg
                     where rg.revelle_id = $2 and rg.game_id = need.id
                       and ${settledSql("rg")}) as placed
       from game_dependency d
       join game need on need.id = d.requires_game_id
      where d.game_id = $1 and d.strength = 'required'
      order by need.name`,
    [gameId, revelleId]
  );
}
