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
import { composeVenue, venueEligibility } from "../selection/venue.ts";
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
  /**
   * Per ANSWER — `environment=hotel`, `water_access=none` — rather than per
   * environment, since db/049 gave a host four venue answers instead of one.
   *
   * Keyed by the answer that REFUSED, so "it only ever prunes in a studio"
   * stays visible and "the water gate has never once fired" becomes visible
   * beside it. An answer absent from this map refused nothing anywhere.
   */
  readonly venueByAnswer: Readonly<Record<string, number>>;
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

/**
 * ONE REQUIREMENT, MEASURED FROM BOTH ENDS — db/049.
 *
 * CLAUDE.md rule 24 says to count in both directions "because they fail
 * differently and look identical from outside — a gate that matches EVERYTHING
 * prunes nothing and is invisible, and a gate that matches NOTHING prunes
 * everything and is member-facing". Before db/049 the second direction could be
 * inferred from `venueByEnvironment`, badly. It is now measured.
 *
 * `claimed` is the demand side: how many rows want this of a room.
 * `affordedBy` is the supply side: how many of the host configurations the
 * house models can actually give it. The two zeros mean opposite things and
 * both are reported by name, because the remedy is different every time:
 *
 *   claimed 0                  AN AUTHORING ABSENCE. Nothing wants it yet. Not
 *                              a wiring bug, and calling it one files a defect
 *                              against a person's unfinished work.
 *   claimed >0, refusals 0     INERT. Everything affords it; the gate cannot
 *                              fire. This is `outdoor_access` before db/035.
 *   claimed >0, affordedBy 0   MEMBER-FACING. Rows exist that NO HOST CAN EVER
 *                              RECEIVE. Not a thin pool — an unreachable one,
 *                              and it is the failure the founder named when the
 *                              occasion gate was proposed: "filters nothing"
 *                              becoming "filters to zero".
 */
export type RequirementReach = {
  readonly code: string;
  readonly label: string;
  /** `ingredient_requirement` rows carrying it. The demand side. */
  readonly claimed: number;
  /** Host configurations that afford it. The supply side. */
  readonly affordedBy: number;
  /** (row × host configuration) pairs it refuses. */
  readonly refusals: number;
  /** The answers that refuse it — "water_access=none" — in vocabulary order. */
  readonly refusedByAnswers: readonly string[];
};

/** A row nothing the house models can deliver. See RequirementReach. */
export type UnreachableRow = {
  readonly pool: string;
  readonly name: string;
  readonly requirement: string;
};

export type GateReport = {
  readonly holdings: GateHoldings;
  readonly prunes: GatePruning;
  /** Every room × occasion pair with no eligible row in the watched pool. */
  readonly zeros: readonly ZeroPair[];
  /** Every room × environment pair the venue gate empties. */
  readonly venueZeros: readonly AxisZero[];
  /** Every structural_requirement, measured from both ends. db/049. */
  readonly requirements: readonly RequirementReach[];
  /** Rows no host configuration can receive. Empty is the healthy answer. */
  readonly unreachable: readonly UnreachableRow[];
  /**
   * How many (environment × inside-or-out × water × swimming) combinations the
   * house models. The denominator for `affordedBy`.
   */
  readonly configurations: number;
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

  // ── PER REQUIREMENT, db/049 ────────────────────────────────────────
  //
  // The venue block above is one verdict over the whole gate, and it goes green
  // the moment ANY requirement refuses ANYTHING. That was adequate while all
  // four codes were seeded together by one migration; it stops being adequate
  // the day a fifth is added, because a new code that refuses nothing hides
  // behind an old code that refuses plenty. `outdoor_access` proved it — db/033
  // added the code, db/020's rows made the gate as a whole look alive, and the
  // grade refused nowhere for two months.
  //
  // A CLAIMED-ZERO CODE IS NOT LISTED, and that is the occasion gate's
  // precedent below applied honestly rather than as a loophole: it is reported
  // BY NAME with its count wherever this report is printed, and it becomes
  // subject to every rule here the moment one row claims it.
  for (const reach of report.requirements) {
    if (reach.claimed === 0) continue;

    if (reach.affordedBy === 0) {
      inert.push(
        `${reach.code}: ${reach.claimed} row(s) claim it and NOT ONE of the ` +
          `${report.configurations} host configurations the house models can ` +
          `afford it. These rows cannot be delivered to anybody. This is not a ` +
          `thin pool, it is an unreachable one.`
      );
      continue;
    }
    if (reach.refusals === 0) {
      inert.push(
        // The number is READ, not asserted. This said "every one of the
        // ${configurations}" regardless of what the table above it printed,
        // so on the night the gate was half-fixed the verdict claimed
        // 960/960 while its own breakdown showed 480/960 — and the person
        // reading it believed the verdict. A report that contradicts its own
        // table teaches you to distrust the table (rule 23).
        `${reach.code}: ${reach.claimed} live row(s) claim it and ` +
          `${reach.affordedBy} of ${report.configurations} host ` +
          `configurations afford it, so it refuses nothing anywhere. ` +
          `A grade wearing a column — see db/035.`
      );
    }
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
 *
 * Since db/049 this is the BASE rather than the whole: a host also answers
 * inside-or-out, what water there is and whether anybody gets in, and
 * `everyHostConfiguration` below crosses these rooms with those three.
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
 * EVERY HOST THE HOUSE CAN MODEL — db/049, and the enumeration the founder
 * asked for before a gate goes live.
 *
 * Her ruling, made when the occasion gate was proposed and general to every
 * gate since: enumerate the pairs that would land at zero BEFORE it ships, as a
 * named list, rather than discovering them from a package. A venue gate's
 * version of that list is the cross product of everything a host can say about
 * the physical world — the room, inside or out, what water there is, whether
 * anybody gets in — against every row that makes a claim on it.
 *
 * IT IS A CROSS PRODUCT AND NOT A SAMPLE. Ten rooms × four × eight × three is
 * under a thousand configurations — small enough to enumerate exactly, and
 * exactness is the point: `affordedBy = 0` has to mean NOBODY, not "nobody in
 * the combinations somebody thought to check". The count is REPORTED rather
 * than written down here (`GateReport.configurations`), because a number in a
 * comment is a number that goes stale the next time an option is added, and a
 * stale denominator makes a reachability report quietly wrong.
 *
 * The verdicts come from `composeVenue`, which is the same function
 * `loadVenue` calls, so a refusal counted here is a refusal a real application
 * gets. Rule 21's guard goes through the consumers: see gates.db.test.ts, which
 * drives the loader and this reporter over one seeded host and compares.
 *
 * The answer combinations include contradictory ones — `poolside` with `none`,
 * `none` with `in_the_water` — deliberately. A host can give them, so the house
 * models them, and pretending she cannot is how a report stops describing
 * reality (rule 20).
 */
type HostConfiguration = {
  readonly venue: Venue;
  /** quiz_field -> option_code, for a report line and for attribution. */
  readonly answers: Readonly<Record<string, string>>;
};

async function everyHostConfiguration(
  db: Queryable
): Promise<HostConfiguration[]> {
  const rooms = await loadEveryRoom(db);

  const claims = await db.query(
    `select quiz_field, option_code::text as option_code, requirement,
            provided, note
       from host_affordance
      order by quiz_field, option_code, requirement`
  );
  const byAnswer = new Map<string, {
    quizField: string; optionCode: string; requirement: string;
    provided: boolean; note: string;
  }[]>();
  for (const row of claims.rows) {
    const key = `${String(row.quiz_field)}=${String(row.option_code)}`;
    const list = byAnswer.get(key) ?? [];
    list.push({
      quizField: String(row.quiz_field),
      optionCode: String(row.option_code),
      requirement: String(row.requirement),
      provided: Boolean(row.provided),
      note: String(row.note ?? ""),
    });
    byAnswer.set(key, list);
  }

  // THE ANSWER SETS COME FROM THE ENUMS, not from a hand-written list and not
  // from `host_affordance` — a value that affords nothing has no row there, and
  // building the axis from the affordance table would silently drop every
  // 'not_decided' from the enumeration. Those are exactly the configurations
  // where nothing may be pruned, which makes them the ones a reporter must not
  // lose. Same class of error as `statableSeasons` below, from the other side.
  const axes: { quizField: string; codes: string[] }[] = [];
  for (const [quizField, enumType] of [
    ["indoor_outdoor", "indoor_outdoor"],
    ["water_access", "water_access"],
    ["water_use", "water_use"],
  ] as const) {
    const { rows } = await db.query(
      `select unnest(enum_range(null::${enumType}))::text as code order by 1`
    );
    axes.push({ quizField, codes: rows.map((row) => String(row.code)) });
  }

  const configurations: HostConfiguration[] = [];
  for (const room of rooms) {
    const environmentRows = Object.entries(room.provides).map(([requirement, provided]) => ({
      requirement,
      provided,
      note: room.notes[requirement] ?? "",
    }));

    const walk = (index: number, chosen: Record<string, string>) => {
      if (index === axes.length) {
        const hostClaims = Object.entries(chosen).flatMap(
          ([quizField, optionCode]) => byAnswer.get(`${quizField}=${optionCode}`) ?? []
        );
        configurations.push({
          venue: composeVenue({
            environment: room.environment,
            label: room.label,
            environmentRows,
            hostClaims,
          }),
          answers: { environment: room.environment, ...chosen },
        });
        return;
      }
      for (const code of axes[index].codes) {
        walk(index + 1, { ...chosen, [axes[index].quizField]: code });
      }
    };
    walk(0, {});
  }

  return configurations;
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
    // ── A RETIRED POOL IS NOT DEMAND ────────────────────────────────
    //
    // This counted every ingredient_requirement row, and the count is the
    // DEMAND side of rule 24's both-directions measure — so a requirement
    // whose only claimants had been retired read as heavily claimed and
    // refusing nothing, which is the exact signature of a broken gate.
    //
    // `requires_full_kitchen` is that case and it cost two wrong diagnoses.
    // Its 17 claimants are all menus (db/020: `where m.cooking =
    // 'actually_made'`), and db/045 retired the menu pool. The gate is
    // CORRECT — 480 of 960 configurations refuse it, in exactly the five
    // rooms with no kitchen she can cook in — and it prunes nothing because
    // nothing live asks for it.
    //
    // That is an AUTHORING absence, not a wiring one, and this file already
    // rules on that case: `claimed === 0` continues rather than failing, the
    // same ruling `requires_still_water` gets. The rule was right; the count
    // feeding it was not (rule 24: count what it matched).
    //
    // NOT extended to dishes by symmetry. src/lib/catalogue/tagging.ts says
    // why, in the comment above this same insert: "symmetry is not evidence."
    // Whether an atomised dish claims a full kitchen is the founder's to
    // author, and this file has no standing to invent the claim.
    `select r.requirement, count(*)::int as n
       from ingredient_requirement r
       join ingredient_pool p on p.entity_table = r.entity_table
      where p.retired_at is null
      group by r.requirement order by r.requirement`
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
  const configurations = await everyHostConfiguration(db);
  const seasons = await statableSeasons(db);
  const holdings = await holdingsOf(db);
  const vocabulary = await db.query(
    `select code, label from structural_requirement order by position, code`
  );

  // One load per occasion, because `slotRules` and `shape` are per-occasion and
  // everything else is not. The ingredients are identical across the nine, and
  // that is asserted rather than assumed below.
  const perOccasion = new Map<string, Awaited<ReturnType<typeof loadCatalogue>>>();
  for (const occasion of occasions) {
    // 'not_decided' ON EVERY AXIS, which is the configuration that prunes
    // NOTHING. The ingredients are the same across all of them — `venue` is the
    // only field of the snapshot this argument touches, and it is re-derived
    // per configuration below — so loading the least constrained host is the
    // one choice that cannot silently shrink the set being measured.
    perOccasion.set(
      occasion,
      await loadCatalogue(db, occasion, {
        environment: "not_decided",
        indoorOutdoor: "not_decided",
        waterAccess: "not_decided",
        waterUse: "not_decided",
      })
    );
  }

  const first = perOccasion.get(occasions[0]);
  if (!first) throw new Error("occasion_type has no members — the enum is empty.");
  const ingredients = first.ingredients;
  const destinations = await loadRooms(db);

  /* ── the venue gate ─────────────────────────────────────────────── */

  // ── DEMAND IS COUNTED OVER THE ROWS THE TEST ACTUALLY RUNS ──────────
  //
  // `holdings.venueRequirements` counts every ingredient_requirement row whose
  // pool is not retired. The eligibility loop below runs over ISSUABLE rows.
  // Two populations, one report — so the verdict could say "2 claim it and it
  // refuses nothing" about a requirement whose only claimants were drafts and
  // therefore could never be tested. That reads exactly like a broken gate and
  // is not one.
  //
  // It surfaced on `requires_lodging` the day it was added: both claimants are
  // bank items held by their own FOUNDER-PENDING questions, which is how EVERY
  // bank item starts. Under the old count, a requirement could not be added
  // with its claimants — the rule db/035 and db/039 both insist on — without
  // failing this check until somebody approved them.
  //
  // Counted here instead, from `ingredients`, so demand and refusals are
  // measured against the same rows by construction and cannot disagree (rule
  // 21). A requirement claimed only by drafts now reads `claimed: 0` and falls
  // to the authoring-absence exemption below, which is what it is. One claimed
  // by live rows that still refuses nothing is caught exactly as before.
  const claimedByIssuable: Record<string, number> = {};
  for (const ingredient of ingredients) {
    for (const requirement of ingredient.requirements ?? []) {
      claimedByIssuable[requirement.code] =
        (claimedByIssuable[requirement.code] ?? 0) + 1;
    }
  }

  let venuePrunes = 0;
  const venueByRequirement: Record<string, number> = {};
  const venueByAnswer: Record<string, number> = {};
  // Per requirement: how many configurations afford it, and which answers
  // refuse it. Rule 24's two directions, kept as two counters because one
  // number cannot carry both.
  const affordedBy: Record<string, number> = {};
  const refusedByAnswers: Record<string, Set<string>> = {};
  for (const row of vocabulary.rows) {
    affordedBy[String(row.code)] = 0;
    refusedByAnswers[String(row.code)] = new Set<string>();
  }

  for (const configuration of configurations) {
    const venue = configuration.venue;

    for (const code of Object.keys(affordedBy)) {
      // ── WHAT SILENCE MEANS, AND WHY THIS FLIPPED ────────────────────
      //
      // This read `!== false`, under the reasoning preserved verbatim here
      // because it is the exact belief that hid the defect:
      //
      //   "db/020's default, restated here because it is the thing that makes
      //    the number honest: a requirement with NO ROW is afforded. Counting
      //    only explicit `true` rows would report `requires_still_water` as
      //    unreachable on every legacy configuration, which is the opposite of
      //    what silence means."
      //
      // WHAT BEAT IT: this detector exists to find requirements that never
      // prune, and it counted a missing row as an affordance — so an axis with
      // NO ROWS AT ALL reported as universally afforded, which is precisely
      // the signature of the thing it is looking for. It found
      // `requires_full_kitchen` anyway, and the finding was right, but it
      // would have reported the same number for a requirement that was
      // perfectly configured and one that had been forgotten entirely.
      //
      // `=== true` matches src/lib/selection/venue.ts, which is the rule that
      // actually decides. A detector that models the engine loosely is a
      // detector that grades a system nobody runs (rule 21).
      if (venue.provides[code] === true) affordedBy[code] += 1;
      else {
        const source = venue.refusedBy?.[code] ?? "environment";
        refusedByAnswers[code].add(
          `${source}=${configuration.answers[source] ?? venue.environment}`
        );
      }
    }

    for (const ingredient of ingredients) {
      const verdict = venueEligibility(ingredient, venue);
      if (verdict.eligible) continue;
      venuePrunes += 1;
      for (const requirement of ingredient.requirements ?? []) {
        // Same flip, same reason: skip only what is EXPLICITLY afforded, so a
        // missing row is counted as the refusal the engine now treats it as.
        if (venue.provides[requirement.code] === true) continue;
        venueByRequirement[requirement.code] =
          (venueByRequirement[requirement.code] ?? 0) + 1;
        const source = venue.refusedBy?.[requirement.code] ?? "environment";
        const answer = `${source}=${configuration.answers[source] ?? venue.environment}`;
        venueByAnswer[answer] = (venueByAnswer[answer] ?? 0) + 1;
      }
    }
  }

  const requirements: RequirementReach[] = vocabulary.rows.map((row) => {
    const code = String(row.code);
    return {
      code,
      label: String(row.label ?? code),
      claimed: claimedByIssuable[code] ?? 0,
      affordedBy: affordedBy[code] ?? 0,
      refusals: venueByRequirement[code] ?? 0,
      refusedByAnswers: [...refusedByAnswers[code]].sort(),
    };
  });

  // THE ROWS NOBODY CAN RECEIVE. Named individually rather than counted,
  // because the remedy is per row: either the tag is wrong or the item needs a
  // fallback authored beside it, and a curator cannot tell which from a number.
  const unreachableCodes = new Set(
    requirements.filter((r) => r.claimed > 0 && r.affordedBy === 0).map((r) => r.code)
  );
  const unreachable: UnreachableRow[] = [];
  if (unreachableCodes.size > 0) {
    for (const ingredient of ingredients) {
      for (const requirement of ingredient.requirements ?? []) {
        if (!unreachableCodes.has(requirement.code)) continue;
        unreachable.push({
          pool: ingredient.pool,
          name: ingredient.name,
          requirement: requirement.code,
        });
      }
    }
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
      venueByAnswer,
      season: seasonPrunes,
      seasonByBand,
      occasion: occasionPrunes,
      occasionByPool,
    },
    zeros,
    venueZeros,
    seasonZeros,
    requirements,
    unreachable,
    configurations: configurations.length,
    environments: rooms.map((room) => room.environment),
    seasons,
    rooms: destinations.length,
    occasions,
    pairs,
    thinRooms,
  };
}
