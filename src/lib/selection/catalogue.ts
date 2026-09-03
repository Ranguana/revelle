/**
 * THE SQL EDGE. The only file in this directory that knows a database exists.
 *
 * Everything above it takes a snapshot and returns candidates. This turns an
 * application id into that snapshot, and does nothing else — no scoring, no
 * filtering that the engine should be doing, and NO WRITES. Reading the
 * catalogue is a read; recording what a curator chose is a different operation
 * belonging to a different caller.
 *
 * It takes a database HANDLE rather than importing one. src/lib/db.ts is marked
 * "server-only" and would make this module unimportable from a script, which is
 * how the engine is actually exercised — see scripts/selection-demo.mjs. A
 * `pg.Pool`, a `pg.Client` and a transaction's `PoolClient` all satisfy
 * `Queryable`, and so does anything else that can answer a parameterised query.
 */

import {
  STOCKED_POOLS,
  idColumnFor,
  tablesFor,
  type StockedPool,
} from "../pools/registry.ts";
import { runSelection } from "./engine.ts";
import { hostExclusions } from "./exclusions.ts";
import { assemblageFingerprint } from "./novelty.ts";
import { composeVenue, statedAnswers } from "./venue.ts";
import type {
  Application,
  Candidate,
  Catalogue,
  CohortAffinity,
  Destination,
  EngineOptions,
  Facet,
  FacetTags,
  GameShape,
  HistorySignal,
  Ingredient,
  OccasionClaim,
  OccasionCode,
  OccasionShape,
  PrintedPiece,
  Scale,
  SelectionInput,
  SelectionResult,
  SlotClaim,
  SlotRule,
  StatedFacet,
  StructuralRequirement,
  Venue,
  VenueAnswers,
} from "./types.ts";

export type Queryable = {
  query: (
    text: string,
    params?: unknown[]
  ) => Promise<{ rows: Record<string, unknown>[] }>;
};

/**
 * THE ENTRY POINT.
 *
 *   const candidates = await selectCandidates(pool, quizResponseId);
 *
 * A database handle and an application id in, candidates out. Anything
 * Next-specific — a route handler, caching, auth, the curator's tool — wraps
 * this from outside and does not leak in. It runs in the same process as a
 * deployment choice; if it ever needs to move out of one, that is a deployment
 * change rather than a rewrite.
 */
export async function selectCandidates(
  db: Queryable,
  applicationId: string,
  options: Partial<EngineOptions> = {}
): Promise<Candidate[]> {
  const result = await selectForApplication(db, applicationId, options);
  return result.candidates;
}

/** The same run, with the vector, the eliminations and the seed attached. */
export async function selectForApplication(
  db: Queryable,
  applicationId: string,
  options: Partial<EngineOptions> = {}
): Promise<SelectionResult> {
  const input = await loadSelectionInput(db, applicationId);
  return runSelection(input, options);
}

// ─────────────────────────────────────────────────────────────────────
// THE SNAPSHOT
// ─────────────────────────────────────────────────────────────────────

export async function loadSelectionInput(
  db: Queryable,
  applicationId: string
): Promise<SelectionInput> {
  // Sequential, not Promise.all. A `pg.Pool` would happily fan these out, but a
  // plain `pg.Client` — which is what every script here uses — has one
  // connection and warns (and will eventually refuse) when a second query is
  // issued mid-flight. Two dozen small queries against a local catalogue is not
  // where this is slow, and accepting either handle is worth more than the
  // parallelism.
  const application = await loadApplication(db, applicationId);
  const history = await loadHistory(db, application.customerId, applicationId);
  const cohorts = await loadCohorts(db, application.customerId);
  const catalogue = await loadCatalogue(
    db,
    application.occasion,
    application.venueAnswers
  );

  return { application, history, cohorts, catalogue };
}

/**
 * THE CATALOGUE AS OF NOW, for one occasion and one room.
 *
 * Split out of `loadSelectionInput` so that a caller who has an APPLICATION
 * SHAPE but no stored application — the curators' test bench in
 * src/lib/desk/bench.ts — reads exactly the same catalogue the real run reads,
 * through exactly this code. The alternative was a second loader, and a second
 * loader is a second thing to keep in step with db/019 the next time a state is
 * added to a scoping row.
 *
 * Still a pure read. Nothing in this file writes.
 */
export async function loadCatalogue(
  db: Queryable,
  occasion: OccasionCode,
  venueAnswers: VenueAnswers
): Promise<Catalogue> {
  const facets = await loadFacets(db);
  const destinations = await loadDestinations(db);
  const ingredients = await loadIngredients(db);
  const slotRules = await loadSlotRules(db, occasion);
  const shape = await loadShape(db, occasion);
  const venue = await loadVenue(db, venueAnswers);
  const issued = await loadIssuedFingerprints(db);

  return {
    facets,
    destinations,
    ingredients,
    slotRules,
    shape,
    venue,
    issuedFingerprints: issued,
  } satisfies Catalogue;
}

/**
 * THE ROOM SHE IS IN, as a set of affordances — db/020, and db/049.
 *
 * Read here and nowhere else, and read as a room rather than as a taste. Her
 * answers never enter the preference vector (vector.ts lists all four venue
 * dimensions among the non-taste ones and says why at length), and the database
 * refuses to let any of them be tagged onto a destination at all, so this query
 * is the only route the venue has into the engine.
 *
 * ── TWO READS, ONE RULE ──────────────────────────────────────────────
 *
 * The room type comes from `venue_affordance_labelled`, which db/020 built. The
 * other three answers come from `host_affordance`, which db/049 built. THE RULE
 * THAT COMBINES THEM IS NOT HERE — it is `composeVenue()` in ./venue.ts,
 * because `catalogue/gates.ts` has to reach the same verdict over every host
 * configuration the house models and two copies of a composition rule is
 * exactly the drift CLAUDE.md rule 21 is about.
 *
 * The host query is scoped to the answers she actually gave. Reading the whole
 * table and filtering in TypeScript would work and is refused on principle: the
 * failure mode is a host who affords everything, which looks identical to a
 * host with no constraints and would never be noticed.
 *
 * A NULL RESULT MEANS "the house does not know this room", not "no limits".
 * db/020 seeds a row for every value of environment_type against every
 * requirement, so null is reachable only from an answer written before a new
 * environment was seeded — and nothing is pruned on it, because pruning on an
 * unknown is how a deliverable vanishes for a reason nobody can name.
 *
 * THAT NULL SURVIVES db/049 UNCHANGED and it is worth saying why, because the
 * tempting move is to return a Venue built from the water answers alone. It is
 * refused: the rejection sentence names the room, `Venue.label` has nothing to
 * put in it, and the number of applications with an unknown environment is zero
 * — this is a guard against a schema change, not a live path. A host who has
 * answered the water question and NOT the room question does not exist, because
 * every field in the quiz is required.
 */
async function loadVenue(
  db: Queryable,
  answers: VenueAnswers
): Promise<Venue | null> {
  const environment = answers.environment;
  if (!environment) return null;

  const { rows } = await db.query(
    `select v.environment::text as environment,
            v.label,
            v.requirement,
            v.provided,
            v.note
       from venue_affordance_labelled v
      where v.environment::text = $1`,
    [environment]
  );

  if (rows.length === 0) return null;

  // db/049. One row per (answer, requirement) she has actually stated. An
  // answer with no row makes no claim — that is "Still deciding", and it is
  // also every response written before 2026-08-h, where the columns are null
  // and `statedAnswers` returns nothing for them.
  const stated = statedAnswers(answers);
  const { rows: hostRows } =
    stated.length === 0
      ? { rows: [] as Record<string, unknown>[] }
      : await db.query(
          `select h.quiz_field, h.option_code::text as option_code,
                  h.requirement, h.provided, h.note
             from host_affordance h
             join unnest($1::text[], $2::text[]) as a(quiz_field, option_code)
               on a.quiz_field = h.quiz_field
              and a.option_code = h.option_code::text`,
          [
            stated.map((pair) => pair.quizField),
            stated.map((pair) => pair.optionCode),
          ]
        );

  return composeVenue({
    environment,
    label: str(rows[0].label),
    environmentRows: rows.map((row) => ({
      requirement: str(row.requirement),
      provided: Boolean(row.provided),
      note: str(row.note ?? ""),
    })),
    hostClaims: hostRows.map((row) => ({
      quizField: str(row.quiz_field),
      optionCode: str(row.option_code),
      requirement: str(row.requirement),
      provided: Boolean(row.provided),
      note: str(row.note ?? ""),
    })),
  });
}

/**
 * WHAT EACH INGREDIENT NEEDS OF THE ROOM — db/020, one query for all five pools.
 *
 * Polymorphic on (entity_table, entity_id), exactly like `ingredient_issuance`,
 * because a requirement is a property of a thing rather than of a pool and
 * five near-identical tables would be five places to forget one.
 */
async function loadRequirements(
  db: Queryable
): Promise<Map<string, StructuralRequirement[]>> {
  const { rows } = await db.query(
    `select r.entity_table, r.entity_id, r.requirement, r.note,
            k.label, k.demand
       from ingredient_requirement r
       join structural_requirement k on k.code = r.requirement
      order by k.position, k.code`
  );

  const byEntity = new Map<string, StructuralRequirement[]>();
  for (const row of rows) {
    const key = `${str(row.entity_table)}:${str(row.entity_id)}`;
    const list = byEntity.get(key) ?? [];
    list.push({
      code: str(row.requirement),
      label: str(row.label),
      demand: str(row.demand),
      note: nullableStr(row.note),
    });
    byEntity.set(key, list);
  }
  return byEntity;
}

async function loadApplication(
  db: Queryable,
  applicationId: string
): Promise<Application> {
  const { rows } = await db.query(
    `select qr.id,
            qr.customer_id,
            c.email,
            qr.quiz_version,
            qr.occasion,
            qr.occasion_other,
            qr.environment,
            -- db/049. Null on every response written before 2026-08-h, which
            -- means she was never asked and must prune nothing.
            qr.indoor_outdoor,
            qr.water_access,
            qr.water_use,
            qr.secret,
            qr.music_service,
            qr.created_at,
            s.guest_count_band,
            s.guests_low, s.guests_high, s.guests_planning,
            s.spend_per_person,
            s.per_person_low, s.per_person_high, s.per_person_planning,
            s.budget_planning, s.budget_ceiling,
            s.retired_budget_band
       from quiz_response qr
       join customer c on c.id = qr.customer_id
       join quiz_response_scale s on s.quiz_response_id = qr.id
      where qr.id = $1`,
    [applicationId]
  );

  const row = rows[0];
  if (!row) throw new Error(`No application ${applicationId}`);

  const { rows: statedRows } = await db.query(
    `select facet_id, dimension_code, facet_code, facet_label, quiz_field,
            polarity, answer_weight
       from quiz_response_facet
      where quiz_response_id = $1`,
    [applicationId]
  );

  const stated: StatedFacet[] = statedRows.map((r) => ({
    facetId: str(r.facet_id),
    dimension: str(r.dimension_code),
    code: str(r.facet_code),
    label: str(r.facet_label),
    field: str(r.quiz_field),
    polarity: str(r.polarity) === "negative" ? "negative" : "positive",
    // numeric, so it arrives as a string. A missing or unreadable weight falls
    // back to 1 — the value every answer carried before db/016 — because the
    // failure mode of guessing zero is an answer that silently means nothing.
    weight: num(r.answer_weight) ?? 1,
  }));

  // SLOTS SHE DOES NOT HAVE. The codes as she stated them, resolved by the
  // database through quiz_option_exclusion (db/016) and passed to
  // hostExclusions() verbatim. Nothing is derived from an answer that means
  // something else — db/014 refused the two near misses by name, and that
  // refusal is why this is a read rather than a rule.
  const { rows: exclusionRows } = await db.query(
    `select exclusion_code from quiz_response_exclusion
      where quiz_response_id = $1`,
    [applicationId]
  );

  const scale: Scale = {
    guestBand: nullableStr(row.guest_count_band),
    guestsLow: num(row.guests_low),
    guestsHigh: num(row.guests_high),
    guestsPlanning: num(row.guests_planning),
    spendBand: nullableStr(row.spend_per_person),
    perPersonLow: num(row.per_person_low),
    perPersonHigh: num(row.per_person_high),
    perPersonPlanning: num(row.per_person_planning),
    budgetPlanning: num(row.budget_planning),
    budgetCeiling: num(row.budget_ceiling),
    retiredBudgetBand: nullableStr(row.retired_budget_band),
  };

  return {
    quizResponseId: str(row.id),
    customerId: str(row.customer_id),
    customerEmail: str(row.email),
    quizVersion: str(row.quiz_version),
    occasion: str(row.occasion) as OccasionCode,
    occasionOther: nullableStr(row.occasion_other),
    environment: str(row.environment),
    venueAnswers: {
      environment: str(row.environment),
      indoorOutdoor: nullableStr(row.indoor_outdoor),
      waterAccess: nullableStr(row.water_access),
      waterUse: nullableStr(row.water_use),
    },
    secret: nullableStr(row.secret),
    musicService: nullableStr(row.music_service),
    stated,
    scale,
    // The third gate. `recorded` is exactly what db/014 said it would be: the
    // codes she stated, read back, with the rule itself unchanged.
    exclusions: hostExclusions({
      occasion: str(row.occasion) as OccasionCode,
      environment: str(row.environment),
      stated,
      recorded: exclusionRows.map((r) => str(r.exclusion_code)),
    }),
    createdAt: iso(row.created_at),
  };
}

async function loadFacets(db: Queryable): Promise<Record<string, Facet>> {
  const { rows } = await db.query(
    `select id, dimension_code, code, label from facet`
  );
  const facets: Record<string, Facet> = {};
  for (const row of rows) {
    facets[str(row.id)] = {
      id: str(row.id),
      dimension: str(row.dimension_code),
      code: str(row.code),
      label: str(row.label),
    };
  }
  return facets;
}

/**
 * Her history, superseded rows excluded by the WHERE clause rather than by
 * anything downstream — a 2029 preference beats a 2026 one and they are never
 * averaged.
 *
 * Two exclusions worth stating, because both are double-counting bugs waiting
 * to happen:
 *
 *   · THIS application's own quiz signals. record_quiz_signals() projects every
 *     answer into taste_signal, so counting them here as well would give her
 *     stated answers two votes and quietly break the blend.
 *   · source = 'cohort_prior'. That is not an observation about her at all; it
 *     arrives through the cohort term, which has its own weight.
 */
async function loadHistory(
  db: Queryable,
  customerId: string,
  applicationId: string
): Promise<HistorySignal[]> {
  const { rows } = await db.query(
    `select facet_id, polarity, strength, confidence, source, context,
            observed_at, subject_label, note
       from taste_signal
      where customer_id = $1
        and superseded_by is null
        and source <> 'cohort_prior'
        and (quiz_response_id is null or quiz_response_id <> $2)
      order by observed_at desc`,
    [customerId, applicationId]
  );

  return rows.map((row) => ({
    facetId: nullableStr(row.facet_id),
    polarity: str(row.polarity) === "negative" ? "negative" : "positive",
    strength: num(row.strength) ?? 1,
    confidence: num(row.confidence) ?? 1,
    source: str(row.source) as HistorySignal["source"],
    context: str(row.context),
    observedAt: iso(row.observed_at),
    subjectLabel: nullableStr(row.subject_label),
    note: nullableStr(row.note),
  }));
}

async function loadCohorts(
  db: Queryable,
  customerId: string
): Promise<CohortAffinity[]> {
  const { rows } = await db.query(
    `select a.cohort_id, a.cohort_slug, a.cohort_name, a.weight_share, a.confidence,
            coalesce(
              (select jsonb_object_agg(cf.facet_id, cf.weight)
                 from taste_cohort_facet cf
                where cf.taste_cohort_id = a.cohort_id),
              '{}'::jsonb) as facets
       from customer_cohort_affinity_effective a
      where a.customer_id = $1
        and a.cohort_status = 'active'`,
    [customerId]
  );

  return rows.map((row) => ({
    cohortId: str(row.cohort_id),
    slug: str(row.cohort_slug),
    name: str(row.cohort_name),
    weightShare: num(row.weight_share) ?? 0,
    confidence: num(row.confidence) ?? 0.5,
    facets: tags(row.facets),
  }));
}

async function loadDestinations(db: Queryable): Promise<Destination[]> {
  const { rows } = await db.query(
    `select w.id, w.slug, w.name, w.tagline,
            coalesce(
              (select jsonb_object_agg(wf.facet_id, wf.weight)
                 from world_facet wf where wf.world_id = w.id),
              '{}'::jsonb) as facets,
            coalesce(
              (select jsonb_agg(jsonb_build_object(
                        'occasion', wo.occasion, 'fit', wo.fit, 'note', wo.note))
                 from world_occasion wo where wo.world_id = w.id),
              '[]'::jsonb) as occasions,
            s.issue_count, s.last_issued_at, s.customer_count
       from world w
       left join ingredient_issuance s
         on s.entity_table = 'world' and s.entity_id = w.id
      where w.status = 'published'
      order by w.name`
  );

  return rows.map((row) => ({
    id: str(row.id),
    slug: str(row.slug),
    name: str(row.name),
    tagline: str(row.tagline),
    facets: tags(row.facets),
    occasions: claims(row.occasions),
    issuance: issuance(row),
    isFixture: str(row.slug).startsWith("fixture-"),
  }));
}

/**
 * HOW TO READ ONE POOL. Not which pools exist — `../pools/registry.ts` says
 * that, and this object is keyed by its union so that leaving one out is a
 * COMPILE ERROR rather than a silence.
 *
 * ── THE SENTENCE THIS COMMENT USED TO CARRY, AND WHY IT WENT ─────────
 *
 * It read: "One entry per pool, and adding a fifth is one entry here plus the
 * three calls in a migration. The identifiers below are a fixed constant of
 * this module — they never come from a request — so composing them into SQL is
 * safe in the one way that matters."
 *
 * Both halves survive in substance. It is still one entry per pool, and the
 * identifiers are still a constant of the module rather than a value from a
 * request, so the injection argument stands unchanged and this file still
 * composes them into SQL. What was wrong was the word "adding": the sentence
 * described the edit as a thing somebody remembers to make. Twice nobody did.
 * `menu` was missing for four pools' worth of migrations and `bank_item` for
 * three, and in neither case did anything go red — see the two notes below,
 * which are the evidence and stay exactly where they are (CLAUDE.md rule 14).
 *
 * `Record<StockedPool, PoolSpec>` is the same list with the remembering taken
 * out of it. A migration that calls `install_revelle_ingredients` regenerates
 * `STOCKED_POOLS`, the union gains a member, and this object stops
 * type-checking until somebody says what the new pool's authored line is
 * called. That question has no answer in the schema (db/012, db/017, db/021 all
 * decide it differently), which is why the ANSWERS below are still hand-written
 * while the KEY SET no longer is.
 *
 * `pool` and `table` are gone as fields: both were always the registry's
 * `entity_table`, spelled a third and fourth time, and a spelling that can
 * differ is a spelling that will.
 */
type PoolSpec = {
  /**
   * The column holding the sentence a member reads. `description` in three of
   * the five pools; a menu's is its dishes and a drink's is its cocktails, in
   * the author's own punctuation, because neither has a description and the
   * line IS the thing (db/012, db/017).
   */
  describe: string;
  /**
   * THE SECOND BUILD OF THE SAME RECORD — drink.mocktails, and null everywhere
   * else. Not a description of a different ingredient: the mocktail mirror is
   * the same glass built without the alcohol, it is stored on the same row by
   * db/017, and it is loaded here so that it cannot be anywhere the drink is
   * not. See `printedMatterFor`.
   */
  mirror: string | null;
  price: string | null;
  minGuests: string | null;
  maxGuests: string | null;
  /**
   * THE TWO AXES A COMPOSED TABLE HAS TO AGREE ON — db/022.
   *
   * `season` is season_band, carried by the three food-and-drink pools and by
   * nothing else. `making` is the making axis under whichever name its own
   * migration gave it — `menu.cooking` (db/012), `drink.making` (db/017),
   * `dish.making` (db/021) — which is why this is a column NAME per pool and
   * not one shared string. Same members, same ladder, three column names, and
   * db/017 explains at length why the names were not unified.
   */
  season: string | null;
  making: string | null;
  /**
   * WHETHER THAT SEASON GATES — `season_strict`, carried by the same three
   * pools that carry `season` and by nothing else. Null here means the pool has
   * no such column, which reads as false: a pool with no season cannot have a
   * strict one. See db/012 on why the two columns are not one.
   */
  seasonStrict: string | null;
  /**
   * The table of meal-shape claims this pool has — `dish_meal`, db/023. Null in
   * a pool the engine reads no such claims from.
   *
   * WHAT THIS SENTENCE USED TO SAY, AND WHY IT IS NOT SIMPLY CORRECTED
   * (CLAUDE.md rule 14):
   *
   *     "Null in a pool that makes no claim about what kind of table it is
   *      for, which is every pool but dishes: a menu and a drink both say what
   *      they are for in a `name` column, in her own words, and that sentence
   *      is richer than an enum."
   *
   * That was db/023's ruling and it was right about a PROGRAMME, whose `name`
   * held "A summer dinner or cocktail party". db/060 reversed it at the atomic
   * grain — a gin and tonic is not a summer dinner — and `drink_meal` now
   * exists and is filled by scripts/seed-drinks.mjs from the document's third
   * bullet: 89 claims over 76 rows, 6 of which claim nothing.
   *
   * So `drink.meals` is null here because THE GATE IS NOT LIVE YET, not because
   * the claims do not exist. db/060 §VI names the sequencing and it is the
   * founder's: "the tagging step writes the claims, and the gap reporter must
   * watch drink coverage per-occasion BEFORE the gate goes live." That watch is
   * not built. Turning this on first would narrow seventy of seventy-six drinks
   * with nothing counting what it refused — rule 24 in the direction that ends
   * in an empty slot on a member's package.
   */
  meals: string | null;
  /** game.shape — db/010. Only the game pool has one. */
  shape: string | null;
  /**
   * The table of objects this pool sets in the destination's typeface —
   * game_printed_matter, db/010. Null in a pool that prints nothing of its
   * own, which is every pool but games today.
   */
  printed: string | null;
  active: string;
};

/**
 * The key set is the registry's. The values are not, and cannot be: see the
 * per-pool notes for what each one costs to decide.
 */
const POOLS: { readonly [P in StockedPool]: PoolSpec } = {
  product: {
    describe: "description",
    mirror: null,
    price: "price_cents",
    minGuests: null,
    maxGuests: null,
    season: null,
    seasonStrict: null,
    making: null,
    meals: null,
    shape: null,
    printed: null,
    active: "t.status = 'active'",
  },
  game: {
    describe: "description",
    mirror: null,
    price: "price_cents",
    minGuests: "min_guests",
    maxGuests: "max_guests",
    season: null,
    seasonStrict: null,
    making: null,
    meals: null,
    shape: "shape",
    printed: "game_printed_matter",
    active: "t.status = 'active'",
  },
  tracklist: {
    describe: "description",
    mirror: null,
    price: null,
    minGuests: null,
    maxGuests: null,
    season: null,
    seasonStrict: null,
    making: null,
    meals: null,
    shape: null,
    printed: null,
    active: "t.status = 'active'",
  },
  // MENUS — db/012's pool, and until now the only one the engine could not
  // see, which meant `the_menu` reported a catalogue gap on every occasion
  // that has one however full the pool was. It is registered exactly like the
  // other three (install_facet_tags, install_revelle_ingredients and the three
  // scoping installers all ran in db/012), so it needs an entry here and
  // nothing else.
  //
  // No price column, deliberately: db/012 declines to invent a per-head cost
  // for a menu nobody has priced. It therefore arrives with priceCents null
  // and is listed by name in the budget report, which is the honest version.
  menu: {
    describe: "dishes",
    mirror: null,
    price: null,
    minGuests: null,
    maxGuests: null,
    season: "season",
    seasonStrict: "season_strict",
    // db/012's older name for db/016's axis. Same members, same ladder.
    making: "cooking",
    meals: null,
    shape: null,
    printed: null,
    active: "t.status = 'active'",
  },
  // DRINKS — db/017's pool, and the first with TWO authored lines on one row.
  //
  // `describe` is the cocktails and `mirror` is the mocktail build of the same
  // glass. They are one ingredient, they are selected together because they are
  // one row, and nothing downstream is given a way to have one without the
  // other. That is the entire guarantee: nobody at the table is visibly not
  // drinking. Read the top of db/017 before adding a second drink pool, an
  // `is_mocktail` flag, or a separate mirror ingredient.
  //
  // No price, for db/012's reason unchanged: docs/drinks.md carries no cost and
  // inventing one per head would be a number nobody authored.
  drink: {
    describe: "cocktails",
    mirror: "mocktails",
    price: null,
    minGuests: null,
    maxGuests: null,
    season: "season",
    seasonStrict: "season_strict",
    making: "making",
    // `drink_meal` EXISTS AND IS FILLED, AND IS DELIBERATELY NOT READ HERE.
    // Read the note on `meals` in the type above before changing this to
    // "drink_meal": the claims are seeded, the per-occasion coverage watch
    // db/060 §VI requires before the gate goes live is not built, and a gate
    // that narrows seventy of seventy-six rows with nothing counting what it
    // refused is how a thin catalogue becomes an empty package.
    meals: null,
    shape: null,
    printed: null,
    active: "t.status = 'active'",
  },
  // DISHES — db/021's pool, and the first that is REGISTERED HERE WITHOUT A
  // SLOT TO FILL. Both halves of that are deliberate.
  //
  // Registered, because a pool the engine cannot see is a pool that reports a
  // phantom gap forever: the menu pool was missing from this list once, and
  // `the_menu` recorded a catalogue gap on every occasion that had one however
  // full the pool was. An entry here costs one query and is the difference
  // between a gap that names a real hole and a gap that names this file.
  //
  // No slot, because db/021 ships none — no `slot_kind` row, no `occasion_slot`
  // row, `typical_draw` 0 — and the argument is at the top of that migration:
  // `the_menu` is already required on the one-evening occasions, so a dish slot
  // beside it serves two dinners, and three independent picks average out the
  // single answer a host gave about how much she wants to make. Until a slot
  // exists, `loadIngredients` returns these candidates and `fill.ts` has
  // nowhere to put them, which is exactly the intended behaviour and not a
  // half-finished wiring.
  //
  // `describe` is the dish's own name, because a dish has no description
  // column and does not want one: the line IS the thing, which is db/012's
  // ruling applied one level down. The name is therefore both the label and the
  // sentence, and printedMatterFor returns nothing for this pool — a dish is
  // not a card. When it becomes part of one, it will be part of the MENU card.
  //
  // No price, for db/012's reason unchanged: docs/dishes.md carries no cost and
  // inventing one per plate would be a number nobody authored driving a budget
  // nobody checked.
  dish: {
    describe: "name",
    mirror: null,
    price: null,
    minGuests: null,
    maxGuests: null,
    season: "season",
    seasonStrict: "season_strict",
    making: "making",
    meals: "dish_meal",
    shape: null,
    printed: null,
    active: "t.status = 'active'",
  },
  // ATMOSPHERE — db/031's pool, and the second one this list could not see.
  //
  // Read the menu note above before this one: it is the same failure, found
  // again, four pools later. 174 published bank items existed and NOTHING in
  // this directory mentioned `bank_item`, so every atmosphere slot was empty
  // on every real package with no error anywhere — CLAUDE.md rule 19's worst
  // shape, a pool the registry knows about that a surface cannot see.
  //
  // It could not simply be added, which is why it sat. db/031 called
  // `install_revelle_ingredients` and none of the other four installers, so
  // `bank_item_facet`, `bank_item_occasion`, `bank_item_slot` and
  // `bank_item_world` did not exist and the query below composes from all
  // four. db/043 makes the four calls db/012 made for `menu` — the precedent
  // this file already named — and only then is an entry here enough.
  //
  // `describe` is the clause verbatim, in the founder's own punctuation, which
  // is what seed-bank writes into `description`. Same ruling as db/012's line
  // of dishes: the line IS the thing.
  //
  // No price, for db/012's reason unchanged: the bank document carries no cost
  // and inventing one would be a number nobody authored driving a budget
  // nobody checked. `min_lead_days` is not read here either — it is a
  // fulfilment fact, not a selection one, and the slot rules say nothing about
  // when an order has to be placed.
  bank_item: {
    describe: "description",
    mirror: null,
    price: null,
    minGuests: null,
    maxGuests: null,
    season: null,
    seasonStrict: null,
    making: null,
    meals: null,
    shape: null,
    printed: null,
    active: "t.status = 'active'",
  },
};

/** The engine's view of the pool list, for src/lib/pools/registry.test.ts. */
export const CATALOGUE_POOLS = Object.keys(POOLS) as StockedPool[];

async function loadIngredients(db: Queryable): Promise<Ingredient[]> {
  const all: Ingredient[] = [];
  const requirements = await loadRequirements(db);

  // STOCKED_POOLS rather than Object.keys(POOLS), so the ORDER of the reads is
  // the registry's and not a property of how this object literal happens to be
  // typed. Same members either way — the Record type guarantees that — but a
  // stable order makes two runs of the demo script diffable.
  for (const pool of STOCKED_POOLS) {
    const spec = POOLS[pool];

    // FROM THE REGISTRY, NOT FROM CONCATENATION. These four used to be built
    // here as `${spec.table}_facet`, `_occasion`, `_slot` and `_world`, which
    // is right until a pool is registered whose migration did not call all four
    // installers — precisely db/031, which gave `bank_item` a join table and
    // none of these, and which is why the ATMOSPHERE note above says the entry
    // "could not simply be added". A guess names a table that is not there and
    // fails as a 500 at the far end of the query; this fails here, by name,
    // before a single row is read. CLAUDE.md rule 19.
    const tables = tablesFor(pool);
    const missing = !tables
      ? "not registered at all"
      : [
          tables.facetTable ? null : "install_facet_tags",
          tables.occasionTable ? null : "install_occasion_eligibility",
          tables.slotTable ? null : "install_slot_eligibility",
          tables.worldTable ? null : "install_world_affinity",
        ]
          .filter(Boolean)
          .join(", ");
    if (!tables || missing) {
      throw new Error(
        `pool '${pool}' is half-installed and cannot be read: ${missing}. ` +
          `A migration must run the missing installer(s) before the engine ` +
          `can see it — see db/043, which did exactly that for bank_item.`
      );
    }
    const facetTable = tables.facetTable;
    const occasionTable = tables.occasionTable;
    const slotTable = tables.slotTable;
    const worldTable = tables.worldTable;

    const idColumn = idColumnFor(pool);
    const { rows } = await db.query(
      `select t.id, t.slug, t.name, t.${spec.describe} as description,
              ${spec.mirror ? `t.${spec.mirror}` : "null::text"} as mirror,
              ${spec.price ? `t.${spec.price}` : "null::integer"} as price_cents,
              ${spec.minGuests ? `t.${spec.minGuests}` : "null::integer"} as min_guests,
              ${spec.maxGuests ? `t.${spec.maxGuests}` : "null::integer"} as max_guests,
              ${spec.shape ? `t.${spec.shape}::text` : "null::text"} as shape,
              ${spec.season ? `t.${spec.season}::text` : "null::text"} as season,
              ${
                spec.seasonStrict ? `t.${spec.seasonStrict}` : "false"
              } as season_strict,
              ${spec.making ? `t.${spec.making}::text` : "null::text"} as making,
              ${
                spec.meals
                  ? `coalesce(
                (select jsonb_agg(m.meal::text order by m.meal)
                   from ${spec.meals} m where m.${idColumn} = t.id),
                '[]'::jsonb)`
                  : "'[]'::jsonb"
              } as meals,
              coalesce(
                (select jsonb_object_agg(x.facet_id, x.weight)
                   from ${facetTable} x where x.${idColumn} = t.id),
                '{}'::jsonb) as facets,
              coalesce(
                (select jsonb_agg(jsonb_build_object(
                          'occasion', o.occasion, 'fit', o.fit, 'note', o.note))
                   from ${occasionTable} o where o.${idColumn} = t.id),
                '[]'::jsonb) as occasions,
              coalesce(
                (select jsonb_agg(jsonb_build_object(
                          'slot_code', sl.slot_code, 'fit', sl.fit, 'note', sl.note))
                   from ${slotTable} sl where sl.${idColumn} = t.id),
                '[]'::jsonb) as slots,
              -- native is the CLAIM (db/019) and is what makes this a filter
              -- rather than a weight; wd.name is carried for one sentence,
              -- "written for HAVANA, 1957, not for PORT CLYDE", and
              -- the join is against world unfiltered on purpose — an ingredient
              -- may well claim a destination that is still a draft, and the gap
              -- should name it rather than say "another one".
              coalesce(
                (select jsonb_object_agg(
                          w.world_id,
                          jsonb_build_object('forbidden', w.forbidden,
                                             'native', w.native,
                                             'affinity', w.affinity,
                                             'name', wd.name,
                                             'note', w.note))
                   from ${worldTable} w
                   join world wd on wd.id = w.world_id
                  where w.${idColumn} = t.id),
                '{}'::jsonb) as worlds,
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
              } as printed_matter,
              s.issue_count, s.last_issued_at, s.customer_count
         from ${pool} t
         left join ingredient_issuance s
           on s.entity_table = '${pool}' and s.entity_id = t.id
        where ${spec.active}
        order by t.name`
    );

    for (const row of rows) {
      all.push({
        pool,
        id: str(row.id),
        slug: str(row.slug),
        name: str(row.name),
        description: str(row.description ?? ""),
        priceCents: num(row.price_cents),
        facets: tags(row.facets),
        occasions: claims(row.occasions),
        slots: slotClaims(row.slots),
        worlds: scopes(row.worlds),
        issuance: issuance(row),
        minGuests: num(row.min_guests),
        maxGuests: num(row.max_guests),
        shape: gameShape(row.shape),
        // The two coherence axes, as columns. See the note on POOLS: these
        // CONSTRAIN a set, the facets projected from them SCORE an ingredient,
        // and keeping the two reads apart is what lets either change alone.
        season: nullableStr(row.season),
        // db/026 made this act. A pool with no season column selects a literal
        // false, so "this pool has no seasonality" and "this row's season only
        // leans" arrive as the same value — which is right, because they mean
        // the same thing to every reader: nothing may be refused on a season.
        seasonStrict: Boolean(row.season_strict),
        making: nullableStr(row.making),
        // db/023. Empty means every shape — the default an untagged claim has
        // on all four axes in this schema.
        meals: Array.isArray(row.meals) ? row.meals.map((m) => str(m)) : [],
        printedMatter: printedMatterFor(pool, row),
        // Absent and empty mean the same thing: works anywhere. That is the
        // safe default, and it is the one the founder asked for by name.
        requirements: requirements.get(`${pool}:${str(row.id)}`) ?? [],
        isFixture: str(row.slug).startsWith("fixture-"),
      });
    }
  }

  return all;
}

async function loadSlotRules(
  db: Queryable,
  occasion: OccasionCode
): Promise<SlotRule[]> {
  const { rows } = await db.query(
    `select os.slot_code, sk.label, sk.description, sk.section, sk.per_guest,
            sk.excluded_by, sk.coherence_group,
            os.pool, os.min_count, os.max_count, os.required, os.per_day,
            os.position, os.note
       from occasion_slot os
       join slot_kind sk on sk.code = os.slot_code
      where os.occasion = $1
      order by os.position`,
    [occasion]
  );

  return rows.map((row) => ({
    slotCode: str(row.slot_code),
    label: str(row.label),
    description: str(row.description),
    section: str(row.section) as SlotRule["section"],
    perGuest: Boolean(row.per_guest),
    pool: str(row.pool),
    minCount: Number(row.min_count),
    maxCount: Number(row.max_count),
    required: Boolean(row.required),
    perDay: Boolean(row.per_day),
    position: Number(row.position),
    note: str(row.note ?? ""),
    excludedBy: nullableStr(row.excluded_by),
    // db/022. Which slots have to agree WITH EACH OTHER rather than each with
    // her — the three courses share 'the_table'.
    coherenceGroup: nullableStr(row.coherence_group),
  }));
}

async function loadShape(
  db: Queryable,
  occasion: OccasionCode
): Promise<OccasionShape> {
  const { rows } = await db.query(
    `select occasion, label, days, note, scheduled_game_max
       from occasion_shape where occasion = $1`,
    [occasion]
  );
  const row = rows[0];
  if (!row) {
    throw new Error(
      `No occasion_shape row for '${occasion}'. Every occasion_type needs one — ` +
        `see db/009.`
    );
  }
  return {
    occasion: str(row.occasion) as OccasionCode,
    label: str(row.label),
    days: Number(row.days),
    note: str(row.note ?? ""),
    // db/010's column is NOT NULL with a default of 1, so the coalesce is only
    // ever reached by a hand-built row. One block is the conservative answer:
    // an evening that programmes nothing is a quiet evening, and an evening
    // that programmes three things at once is not an evening.
    scheduledGameMax: num(row.scheduled_game_max) ?? 1,
  };
}

/**
 * Every assemblage that has actually been DELIVERED, digested the same way the
 * engine digests a candidate.
 *
 * Recomputed from the ingredient rows rather than read from
 * revelle.assemblage_fingerprint on purpose. The stored column is PostgreSQL's
 * digest, sorted under the database's collation; this one sorts by byte. They
 * agree on identity — same ingredients, same digest — but not necessarily on
 * the exact string, and comparing the two kinds would be a bug that only
 * appears on a database initialised in a different locale. So the engine
 * compares its own digests with its own, and the database keeps enforcing the
 * promise with its own. See novelty.ts.
 */
async function loadIssuedFingerprints(db: Queryable): Promise<string[]> {
  const { rows } = await db.query(
    `select i.revelle_id, i.entity_table, i.entity_id
       from revelle_ingredient i
       join revelle r on r.id = i.revelle_id
      where r.first_delivered_at is not null`
  );

  const byRevelle = new Map<string, { pool: string; id: string }[]>();
  let worldOf = new Map<string, string>();

  for (const row of rows) {
    const revelleId = str(row.revelle_id);
    const pool = str(row.entity_table);
    const entityId = str(row.entity_id);
    if (pool === "world") {
      worldOf.set(revelleId, entityId);
      continue;
    }
    const list = byRevelle.get(revelleId) ?? [];
    list.push({ pool, id: entityId });
    byRevelle.set(revelleId, list);
  }

  const ids = new Set([...byRevelle.keys(), ...worldOf.keys()]);
  const prints: string[] = [];
  for (const revelleId of ids) {
    const print = assemblageFingerprint(
      worldOf.get(revelleId) ?? null,
      byRevelle.get(revelleId) ?? []
    );
    if (print) prints.push(print);
  }
  worldOf = new Map();
  return prints;
}

// ── coercion ─────────────────────────────────────────────────────────
//
// node-postgres returns `numeric` as a STRING, because a numeric can hold
// values a double cannot. Every number that arrives from a numeric column
// therefore goes through num(), and forgetting one produces string
// concatenation where arithmetic was intended — which is silent, and wrong in a
// way that looks plausible.

function num(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function str(value: unknown): string {
  return value === null || value === undefined ? "" : String(value);
}

function nullableStr(value: unknown): string | null {
  return value === null || value === undefined ? null : String(value);
}

/**
 * game_shape, or null for a pool that has no shape.
 *
 * An unrecognised value becomes null rather than being trusted, and null means
 * "takes no block". The alternative — trusting the string — would have a
 * misspelt enum value silently stop counting against the evening's blocks, and
 * the failure would be a host handed three games in one hour.
 */
function gameShape(value: unknown): GameShape | null {
  switch (value) {
    case "scheduled":
    case "ambient":
    case "finale":
      return value;
    default:
      return null;
  }
}

function iso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  return String(value ?? "");
}

function tags(value: unknown): FacetTags {
  const out: FacetTags = {};
  if (value && typeof value === "object") {
    for (const [key, weight] of Object.entries(value as Record<string, unknown>)) {
      const parsed = num(weight);
      if (parsed !== null) out[key] = parsed;
    }
  }
  return out;
}

function claims(value: unknown): OccasionClaim[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => {
    const row = entry as Record<string, unknown>;
    return {
      occasion: str(row.occasion) as OccasionCode,
      fit: str(row.fit) === "forbidden" ? "forbidden" : "native",
      note: nullableStr(row.note),
    };
  });
}

function slotClaims(value: unknown): SlotClaim[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => {
    const row = entry as Record<string, unknown>;
    return {
      slotCode: str(row.slot_code),
      fit: str(row.fit) === "forbidden" ? "forbidden" : "native",
      note: nullableStr(row.note),
    };
  });
}

function scopes(value: unknown): Ingredient["worlds"] {
  const out: Ingredient["worlds"] = {};
  if (value && typeof value === "object") {
    for (const [worldId, scope] of Object.entries(
      value as Record<string, unknown>
    )) {
      const row = (scope ?? {}) as Record<string, unknown>;
      out[worldId] = {
        forbidden: Boolean(row.forbidden),
        // db/019's third state. A row written before that migration has it
        // false, which means what it has always meant: a weight, not a claim.
        native: Boolean(row.native),
        affinity: num(row.affinity) ?? 0,
        name: nullableStr(row.name),
        note: nullableStr(row.note),
      };
    }
  }
  return out;
}

/**
 * WHAT THIS INGREDIENT PRINTS.
 *
 * Games have a table of it (db/010). A MENU does not, and does not need one:
 * a menu is a single printed object whose text is its line of dishes, and
 * db/012 says so in as many words — the dishes are held verbatim, in the
 * author's punctuation, because the line IS the thing. Making the card here
 * rather than in a migration keeps the claim next to the only other place
 * that already knows a menu has no `description` column.
 *
 * `THE MENU` as the object's label and the menu's own name — "A long summer
 * dinner" — as what it came with, which is how every other printed object
 * reads: the object, then the thing it belongs to.
 *
 * A DRINK PRINTS TWO OBJECTS FROM ONE ROW, and this is where the mocktail
 * mirror becomes visible without ever becoming separable. db/017 stores both
 * builds on one record so they cannot be selected apart; here they become the
 * bar card and the mirror card, exactly the way a game prints its rules and its
 * ballot from one game. "The mirror" is the founder's own noun for it.
 *
 * The second card is not conditional. A drink cannot reach this function
 * without a mirror — the column is NOT NULL and non-empty — so there is no
 * branch in which a cocktail is printed alone, which is the whole point.
 *
 * Products and tracklists print nothing. There is no object; a soundtrack is
 * not a card, and a page that renders one is showing her something that will
 * never arrive.
 */
function printedMatterFor(
  pool: string,
  row: Record<string, unknown>
): PrintedPiece[] {
  if (pool === "drink") {
    const cocktails = str(row.description ?? "").trim();
    const mirror = str(row.mirror ?? "").trim();
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

  if (pool === "menu") {
    const dishes = str(row.description ?? "").trim();
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
    const row = entry as Record<string, unknown>;
    return {
      piece: str(row.piece),
      label: str(row.label),
      description: str(row.description ?? ""),
      perGuest: Boolean(row.per_guest),
      quantity: num(row.quantity),
    };
  });
}

function issuance(row: Record<string, unknown>): Ingredient["issuance"] {
  const count = num(row.issue_count);
  if (count === null || count === 0) return null;
  return {
    issueCount: count,
    lastIssuedAt: row.last_issued_at ? iso(row.last_issued_at) : null,
    customerCount: num(row.customer_count) ?? 0,
  };
}
