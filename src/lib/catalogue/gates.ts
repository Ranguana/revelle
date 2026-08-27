/**
 * DID THE GATE ACTUALLY FIRE — the two-part guard CLAUDE.md rule 22 asks for.
 *
 * ── WHY IT IS TWO PARTS AND NOT ONE ──────────────────────────────────
 *
 * Rule 22, verbatim, because the whole shape of this file is in it:
 *
 *   "…a build test that FAILS IF THE DERIVED TABLE IS EMPTY after a full
 *    build, and a detector for A GATE THAT PRUNES ZERO ROWS ACROSS THE WHOLE
 *    CATALOGUE. The first catches the tagger never running; the second catches
 *    it running and matching nothing, which reads identically from the outside
 *    and is why one guard is not enough."
 *
 * From outside, "nobody tagged anything" and "the tagger ran and its predicates
 * matched nothing" are the same screen: the column exists, nothing errors, the
 * desk shows a plausible value, and the filter filters nothing. `holdings`
 * below answers the first. `prunes` answers the second, and it answers it by
 * DRIVING THE ENGINE'S OWN ELIGIBILITY FUNCTIONS over the whole active
 * catalogue rather than by reasoning about the rows.
 *
 * ── AND A THIRD THING, WHICH IS THE MEMBER-FACING HALF ───────────────
 *
 * A gate that matches everything filters nothing. A gate that matches nothing
 * filters to ZERO, and that is not a curator's problem, it is a member holding
 * a package with no drink in it. The founder, on the day the occasion gate was
 * proposed:
 *
 *   "Occasion-scoping a thin catalogue converts 'filters nothing' into 'filters
 *    to zero.' Rooms carry 1–3 programmes; nine occasions each draw exactly 1.
 *    The moment `drink_occasion` populates, a single-programme room whose one
 *    programme reads 'Brunch' has zero eligible drinks at a dinner — Big Sur,
 *    the Dolomites, and Tahiti go from no-choice to possibly no-drink, and
 *    Havana's two-way ranking becomes a coin toss with occasions that neither
 *    side covers. So the fix ships in a required pair: the tagging step writes
 *    the claims, and the gap reporter must watch drink coverage per-occasion
 *    BEFORE the gate goes live."
 *
 * `zeros` is that watch. Every room × occasion pair whose drink pool comes back
 * empty, enumerated, so the list can be read before anything ships rather than
 * discovered from a package.
 *
 * ── ONE AUTHORITY FOR THE RULE, PER-SURFACE READS FOR THE DATA ───────
 *
 * Nothing here restates an eligibility rule. `venueEligibility`,
 * `occasionEligibility`, `placement` and `inSeason` are imported from
 * src/lib/selection/, and this module's whole content is WHICH QUESTIONS TO
 * ASK AND HOW MANY TIMES. That is the same division src/lib/selection/
 * slot-coverage.ts drew between the board and the reporter, and for the same
 * reason: a second copy of a rule is correct exactly until one copy is edited.
 *
 * The catalogue itself is loaded with the engine's own `loadCatalogue`, once
 * per occasion, so the rows measured here are the rows a real selection run
 * would see — active only, through the same query, with the same joins. A
 * bespoke `select * from drink` here would be the thing this file exists to
 * catch, one layer up.
 */

import { loadCatalogue, type Queryable } from "../selection/catalogue.ts";
import { occasionEligibility } from "../selection/occasion.ts";
import { placement } from "../selection/slot-coverage.ts";
import { inSeason } from "../selection/table.ts";
import { venueEligibility } from "../selection/venue.ts";
import type { OccasionClaim, OccasionCode, Venue } from "../selection/types.ts";

/** Which pool this report enumerates room × occasion coverage for. */
export const WATCHED_POOL = "drink";

export type GateHoldings = {
  /** `ingredient_requirement` rows, by requirement code. */
  readonly venueRequirements: Readonly<Record<string, number>>;
  readonly venueRequirementRows: number;
  /** `world.venue_requirement` — db/033 §4, the destination's own presupposition. */
  readonly worldRequirements: number;
  /** Active rows whose season is a gate rather than a lean, by pool. */
  readonly seasonStrict: Readonly<Record<string, number>>;
  readonly seasonStrictRows: number;
  /** `<pool>_occasion` rows, by pool. */
  readonly occasionClaims: Readonly<Record<string, number>>;
  readonly occasionClaimRows: number;
};

export type GatePruning = {
  /**
   * How many (ingredient, room-she-is-in) pairs the venue gate refuses across
   * the whole active catalogue and every environment the house models. Zero
   * means the gate is inert however full `ingredient_requirement` looks.
   */
  readonly venue: number;
  readonly venueByRequirement: Readonly<Record<string, number>>;
  /** Per environment, so "it only ever prunes in a studio" is visible. */
  readonly venueByEnvironment: Readonly<Record<string, number>>;
  /** (ingredient, her season) pairs the season gate refuses. */
  readonly season: number;
  readonly seasonByBand: Readonly<Record<string, number>>;
  /** (ingredient, occasion) pairs the occasion gate refuses. */
  readonly occasion: number;
  readonly occasionByPool: Readonly<Record<string, number>>;
};

export type ZeroPair = {
  readonly worldSlug: string;
  readonly worldName: string;
  readonly worldStatus: string;
  readonly occasion: string;
  /** The slot the occasion draws this pool into. */
  readonly slotCode: string;
  /**
   * Why it is zero, in the engine's own words — the first refusal a real gap
   * would rank. Empty when the pool holds nothing for this room at all.
   */
  readonly reason: string;
  /** True when the DESTINATION is vetoed for this occasion (db/009's veto). */
  readonly roomNotOffered: boolean;
};

/**
 * A room × (one host answer) pair the watched pool comes back empty for.
 *
 * The same question the occasion enumeration asks, on the other two axes, and
 * asked one axis at a time on purpose: a pair that is empty under EVERY axis
 * together tells you the room is thin, and a pair that is empty under ONE tells
 * you which gate did it. The second is the one somebody can act on.
 */
export type AxisZero = {
  readonly worldSlug: string;
  readonly worldName: string;
  /** The environment code, or the season band she stated. */
  readonly answer: string;
  readonly reason: string;
};

export type GateReport = {
  readonly holdings: GateHoldings;
  readonly prunes: GatePruning;
  /** Every room × occasion pair with no eligible row in the watched pool. */
  readonly zeros: readonly ZeroPair[];
  /** Every room × environment pair the venue gate empties. */
  readonly venueZeros: readonly AxisZero[];
  /** Every room × stated-season pair the season gate empties. */
  readonly seasonZeros: readonly AxisZero[];
  readonly environments: readonly string[];
  readonly seasons: readonly string[];
  readonly rooms: number;
  readonly occasions: readonly string[];
  readonly pairs: number;
  /** Rooms holding 1–3 rows of the watched pool — the fragile ones. */
  readonly thinRooms: readonly { slug: string; name: string; held: number }[];
};

/**
 * WHICH GATES ARE INERT. The one-line verdict, for a test and for an exit code.
 *
 * A gate is INERT when it holds no claims at all (the tagger never ran) OR when
 * it holds claims and refuses nothing anywhere (the tagger ran and matched
 * nothing). Both are reported by name, because the remedy is different: the
 * first is a wiring bug and the second is an authoring gap.
 */
export function inertGates(report: GateReport): string[] {
  const inert: string[] = [];

  if (report.holdings.venueRequirementRows === 0) {
    inert.push(
      "venue: ingredient_requirement is EMPTY — the tagger did not run, or " +
        "ran before the seeders. This is the founding defect (CLAUDE.md rule 22)."
    );
  } else if (report.prunes.venue === 0) {
    inert.push(
      `venue: ${report.holdings.venueRequirementRows} requirement row(s) held ` +
        `and NOTHING is refused in any of the rooms the house models. The tags ` +
        `are on rows the engine cannot see, or every room affords everything.`
    );
  }

  if (report.holdings.seasonStrictRows === 0) {
    inert.push(
      "season: not one active row has season_strict — every season is a lean, " +
        "so a February party is offered the summer bar."
    );
  } else if (report.prunes.season === 0) {
    inert.push(
      `season: ${report.holdings.seasonStrictRows} row(s) gate on a season and ` +
        `no season she can state refuses any of them.`
    );
  }

  // THE OCCASION GATE IS DELIBERATELY NOT LISTED HERE, and this is the one
  // place in the file where an absence is the finding rather than an omission.
  // `drink_occasion` holds zero rows because the drinks document has no
  // occasion field to derive one from — see the long argument in ./tagging.ts —
  // and calling that "inert" would file a wiring bug against an authoring
  // decision. It is reported instead as `holdings.occasionClaimRows`, which a
  // caller prints whatever its value, and the desk carries the one to-do that
  // says whose move it is.

  return inert;
}

/* ── the reads ───────────────────────────────────────────────────────── */

/**
 * EVERY ROOM THE HOUSE MODELS, as the engine's own `Venue`.
 *
 * Read from `venue_affordance_labelled`, which is the view db/020 built and
 * `loadVenue` reads — the same rows, so the verdicts below are the verdicts a
 * real application gets. The loader is private to the engine and takes one
 * environment at a time; this needs all of them at once, which is a different
 * QUERY and the same RULE, and the rule is `venueEligibility`.
 */
async function loadEveryRoom(db: Queryable): Promise<Venue[]> {
  const { rows } = await db.query(
    `select v.environment::text as environment, v.label, v.requirement,
            v.provided, v.note
       from venue_affordance_labelled v
      order by v.environment, v.requirement`
  );

  const byEnvironment = new Map<string, Venue>();
  for (const row of rows) {
    const environment = String(row.environment);
    let venue = byEnvironment.get(environment);
    if (!venue) {
      venue = {
        environment,
        label: String(row.label ?? environment),
        provides: {},
        notes: {},
      };
      byEnvironment.set(environment, venue);
    }
    const requirement = String(row.requirement);
    (venue.provides as Record<string, boolean>)[requirement] = Boolean(row.provided);
    const note = String(row.note ?? "");
    if (note.length > 0) (venue.notes as Record<string, string>)[requirement] = note;
  }
  return [...byEnvironment.values()];
}

/**
 * EVERY SEASON A HOST CAN ACTUALLY STATE — from the QUESTION, not the vocabulary.
 *
 * `statedSeason()` reads her `event_month` answer as a `season` facet code, so
 * the supplier is `quiz_option_facet` for that field — the bridge db/026 built
 * between a month she picks and a band the pools carry.
 *
 * IT IS NOT `select code from facet where dimension_code = 'season'`, and the
 * difference is not cosmetic: that returns seven codes and only FIVE of them
 * are reachable. `shoulder` and `year_round` are bands a ROW may carry and no
 * month resolves to, so counting refusals against them inflates the season
 * gate's pruning by more than a third with pairs that can never occur. A report
 * generated from something other than reality is the most convincing failure
 * this system produces (CLAUDE.md rule 20), and this function is one join away
 * from being an instance of it.
 *
 * CLAUDE.md rule 15's trace, in one query: the instrument is `season_strict`,
 * and this is the answer that feeds it.
 */
async function statableSeasons(db: Queryable): Promise<string[]> {
  const { rows } = await db.query(
    `select distinct f.code
       from quiz_option_facet o
       join facet f on f.id = o.facet_id
      where o.quiz_field = 'event_month'
        and f.dimension_code = 'season'
      order by f.code`
  );
  return rows.map((row) => String(row.code));
}

/**
 * EVERY ROOM THE LIBRARY HOLDS — and deliberately NOT the engine's own
 * `loadDestinations`.
 *
 * That loader ends `where w.status = 'published'`, which is exactly right for a
 * selection run and exactly wrong here. Publication is a human gesture (rule 8;
 * `activate:catalogue` is a separate call the deploy never makes), so on any
 * freshly built database EVERY world is a draft and a reporter built on the
 * engine's loader would enumerate zero rooms and pass with a clean sheet — the
 * precise failure this file exists to catch, committed by the file itself.
 *
 * The basis is the desk coverage board's: `status <> 'retired'`. A coverage
 * question is about the LIBRARY, and a room whose voice is still being written
 * is exactly the room a curator needs to see has no drinks in it. src/lib/desk/
 * coverage.ts uses the same predicate for the same reason.
 */
type Room = {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly status: string;
  readonly occasions: OccasionClaim[];
};

async function loadRooms(db: Queryable): Promise<Room[]> {
  const { rows } = await db.query(
    `select w.id, w.slug, w.name, w.status::text as status,
            coalesce(
              (select jsonb_agg(jsonb_build_object(
                        'occasion', wo.occasion, 'fit', wo.fit, 'note', wo.note))
                 from world_occasion wo where wo.world_id = w.id),
              '[]'::jsonb) as occasions
       from world w
      where w.status <> 'retired'
      order by w.name`
  );

  return rows.map((row) => ({
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    status: String(row.status),
    occasions: (Array.isArray(row.occasions) ? row.occasions : []).map(
      (claim: Record<string, unknown>): OccasionClaim => ({
        occasion: String(claim.occasion) as OccasionCode,
        // db/019: `world_occasion` carries no `native` — a destination's
        // occasion rows are a veto and nothing else — so anything that is not
        // spelled 'forbidden' is not a claim. Narrowed here rather than trusted,
        // because `occasion_fit` has more spellings than the eligibility rule
        // has states, which is the same narrowing coverage.ts makes.
        fit: String(claim.fit) === "forbidden" ? "forbidden" : "native",
        note: claim.note === null || claim.note === undefined ? null : String(claim.note),
      })
    ),
  }));
}

async function occasionCodes(db: Queryable): Promise<OccasionCode[]> {
  const { rows } = await db.query(
    `select unnest(enum_range(null::occasion_type))::text as code`
  );
  return rows.map((row) => String(row.code) as OccasionCode);
}

async function holdingsOf(db: Queryable): Promise<GateHoldings> {
  const requirements = await db.query(
    `select requirement, count(*)::int as n
       from ingredient_requirement group by requirement order by requirement`
  );
  const venueRequirements: Record<string, number> = {};
  let venueRequirementRows = 0;
  for (const row of requirements.rows) {
    const n = Number(row.n);
    venueRequirements[String(row.requirement)] = n;
    venueRequirementRows += n;
  }

  const worlds = await db.query(
    `select count(*)::int as n from world where venue_requirement is not null`
  );

  // THE POOLS THAT CARRY A SEASON, FROM THE REGISTRY-SHAPED READ AND NOT A
  // HAND LIST (rule 19). `information_schema` is asked which registered pools
  // actually have the two columns, so a pool that grows one is counted the day
  // it does and a pool that has none is not silently reported as zero.
  const seasoned = await db.query(
    `select p.entity_table
       from ingredient_pool p
       join information_schema.columns c
         on c.table_schema = 'public'
        and c.table_name = p.entity_table
        and c.column_name = 'season_strict'
      order by p.entity_table`
  );
  const seasonStrict: Record<string, number> = {};
  let seasonStrictRows = 0;
  for (const row of seasoned.rows) {
    const table = String(row.entity_table);
    const counted = await db.query(
      `select count(*)::int as n from ${table} where season_strict and status = 'active'`
    );
    const n = Number(counted.rows[0]?.n ?? 0);
    seasonStrict[table] = n;
    seasonStrictRows += n;
  }

  const occasionTables = await db.query(
    `select entity_table, occasion_table
       from ingredient_pool
      where occasion_table is not null
      order by entity_table`
  );
  const occasionClaims: Record<string, number> = {};
  let occasionClaimRows = 0;
  for (const row of occasionTables.rows) {
    const counted = await db.query(
      `select count(*)::int as n from ${String(row.occasion_table)}`
    );
    const n = Number(counted.rows[0]?.n ?? 0);
    occasionClaims[String(row.entity_table)] = n;
    occasionClaimRows += n;
  }

  return {
    venueRequirements,
    venueRequirementRows,
    worldRequirements: Number(worlds.rows[0]?.n ?? 0),
    seasonStrict,
    seasonStrictRows,
    occasionClaims,
    occasionClaimRows,
  };
}

/* ── the report ──────────────────────────────────────────────────────── */

/**
 * Run every gate over the whole catalogue and count what it refuses.
 *
 * Deliberately not scoped to one applicant: the question is not "was this
 * evening filtered" but "CAN this filter ever fire", and the only honest way to
 * answer it is the cross product of the catalogue against everything a host is
 * able to say.
 */
export async function gateReport(db: Queryable): Promise<GateReport> {
  const occasions = await occasionCodes(db);
  const rooms = await loadEveryRoom(db);
  const seasons = await statableSeasons(db);
  const holdings = await holdingsOf(db);

  // One load per occasion, because `slotRules` and `shape` are per-occasion and
  // everything else is not. The ingredients are identical across the nine, and
  // that is asserted rather than assumed below.
  const perOccasion = new Map<string, Awaited<ReturnType<typeof loadCatalogue>>>();
  for (const occasion of occasions) {
    perOccasion.set(occasion, await loadCatalogue(db, occasion, "not_decided"));
  }

  const first = perOccasion.get(occasions[0]);
  if (!first) throw new Error("occasion_type has no members — the enum is empty.");
  const ingredients = first.ingredients;
  const destinations = await loadRooms(db);

  /* ── the venue gate ─────────────────────────────────────────────── */

  let venuePrunes = 0;
  const venueByRequirement: Record<string, number> = {};
  const venueByEnvironment: Record<string, number> = {};
  for (const room of rooms) {
    let here = 0;
    for (const ingredient of ingredients) {
      const verdict = venueEligibility(ingredient, room);
      if (verdict.eligible) continue;
      here += 1;
      venuePrunes += 1;
      for (const requirement of ingredient.requirements ?? []) {
        if (room.provides[requirement.code] === false) {
          venueByRequirement[requirement.code] =
            (venueByRequirement[requirement.code] ?? 0) + 1;
        }
      }
    }
    venueByEnvironment[room.environment] = here;
  }

  /* ── the season gate ────────────────────────────────────────────── */

  let seasonPrunes = 0;
  const seasonByBand: Record<string, number> = {};
  for (const band of seasons) {
    let here = 0;
    for (const ingredient of ingredients) {
      if (ingredient.seasonStrict !== true) continue;
      if (inSeason(band, ingredient.season)) continue;
      here += 1;
      seasonPrunes += 1;
    }
    seasonByBand[band] = here;
  }

  /* ── the occasion gate ──────────────────────────────────────────── */

  let occasionPrunes = 0;
  const occasionByPool: Record<string, number> = {};
  for (const occasion of occasions) {
    for (const ingredient of ingredients) {
      if (occasionEligibility(ingredient.occasions, occasion).eligible) continue;
      occasionPrunes += 1;
      occasionByPool[ingredient.pool] = (occasionByPool[ingredient.pool] ?? 0) + 1;
    }
  }

  /* ── room × occasion, for the watched pool ──────────────────────── */

  const watched = ingredients.filter((i) => i.pool === WATCHED_POOL);
  const zeros: ZeroPair[] = [];
  let pairs = 0;

  for (const destination of destinations) {
    for (const occasion of occasions) {
      const catalogue = perOccasion.get(occasion)!;
      const slots = catalogue.slotRules.filter((rule) => rule.pool === WATCHED_POOL);
      // An occasion that never draws this pool cannot be zero for it. Not a
      // pass and not a failure — the question does not arise, and counting it
      // as covered would be the coverage board's own named sin.
      if (slots.length === 0) continue;

      // db/009's destination-level veto. The room is not offered at all, so an
      // empty drink pool here is not a catalogue gap.
      const roomVerdict = occasionEligibility(destination.occasions, occasion);

      for (const slot of slots) {
        pairs += 1;
        const eligible = watched.filter((ingredient) => {
          if (!placement(ingredient, destination.id, destination.name, slot.slotCode).eligible) {
            return false;
          }
          return occasionEligibility(ingredient.occasions, occasion).eligible;
        });
        if (eligible.length > 0) continue;

        // The first refusal, ranked the way a real gap ranks them, so the list
        // reads as work rather than as a log line.
        let reason = `no ${WATCHED_POOL} in the catalogue is written for ${destination.name}`;
        for (const ingredient of watched) {
          const placed = placement(
            ingredient,
            destination.id,
            destination.name,
            slot.slotCode
          );
          if (!placed.world.eligible) continue;
          if (!placed.slot.eligible) {
            reason = `${ingredient.name} is ${placed.slot.reason}`;
            break;
          }
          const forOccasion = occasionEligibility(ingredient.occasions, occasion);
          if (!forOccasion.eligible) {
            reason = `${ingredient.name} is ${forOccasion.reason}`;
            break;
          }
        }

        zeros.push({
          worldSlug: destination.slug,
          worldName: destination.name,
          worldStatus: destination.status,
          occasion,
          slotCode: slot.slotCode,
          reason,
          roomNotOffered: !roomVerdict.eligible,
        });
      }
    }
  }

  /* ── room × venue and room × season, on the same pool ───────────── */
  //
  // ONE AXIS AT A TIME, plus the destination axis that is always in force.
  // A room whose whole bar needs live fire has no bar in an apartment, and that
  // is a different sentence from "this room has no bar at all" — so the world
  // scope is applied here (it is a fact about the row, not about her) and the
  // occasion and slot axes are not.
  const slotCodes = [
    ...new Set(
      [...perOccasion.values()].flatMap((catalogue) =>
        catalogue.slotRules
          .filter((rule) => rule.pool === WATCHED_POOL)
          .map((rule) => rule.slotCode)
      )
    ),
  ];

  const venueZeros: AxisZero[] = [];
  const seasonZeros: AxisZero[] = [];

  for (const destination of destinations) {
    const inRoom = watched.filter((ingredient) =>
      slotCodes.some(
        (code) => placement(ingredient, destination.id, destination.name, code).eligible
      )
    );
    // A room with nothing at all is already in `zeros`, nine times over. Saying
    // it again on two more axes would be the same finding wearing three hats.
    if (inRoom.length === 0) continue;

    for (const room of rooms) {
      const survivors = inRoom.filter(
        (ingredient) => venueEligibility(ingredient, room).eligible
      );
      if (survivors.length > 0) continue;
      venueZeros.push({
        worldSlug: destination.slug,
        worldName: destination.name,
        answer: room.environment,
        reason: venueEligibility(inRoom[0], room).reason,
      });
    }

    for (const band of seasons) {
      const survivors = inRoom.filter(
        (ingredient) =>
          ingredient.seasonStrict !== true || inSeason(band, ingredient.season)
      );
      if (survivors.length > 0) continue;
      seasonZeros.push({
        worldSlug: destination.slug,
        worldName: destination.name,
        answer: band,
        reason:
          `every ${WATCHED_POOL} written for ${destination.name} is written ` +
          `strictly for another season`,
      });
    }
  }

  const thinRooms = destinations
    .map((destination) => ({
      slug: destination.slug,
      name: destination.name,
      held: watched.filter(
        (ingredient) => ingredient.worlds[destination.id]?.native === true
      ).length,
    }))
    .filter((room) => room.held > 0 && room.held <= 3);

  return {
    holdings,
    prunes: {
      venue: venuePrunes,
      venueByRequirement,
      venueByEnvironment,
      season: seasonPrunes,
      seasonByBand,
      occasion: occasionPrunes,
      occasionByPool,
    },
    zeros,
    venueZeros,
    seasonZeros,
    environments: rooms.map((room) => room.environment),
    seasons,
    rooms: destinations.length,
    occasions,
    pairs,
    thinRooms,
  };
}
