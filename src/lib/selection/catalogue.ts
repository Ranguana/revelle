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

import { runSelection } from "./engine.ts";
import { assemblageFingerprint } from "./novelty.ts";
import type {
  Application,
  Candidate,
  Catalogue,
  CohortAffinity,
  Destination,
  EngineOptions,
  Facet,
  FacetTags,
  HistorySignal,
  Ingredient,
  OccasionClaim,
  OccasionCode,
  OccasionShape,
  Scale,
  SelectionInput,
  SelectionResult,
  SlotClaim,
  SlotRule,
  StatedFacet,
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
  const facets = await loadFacets(db);
  const history = await loadHistory(db, application.customerId, applicationId);
  const cohorts = await loadCohorts(db, application.customerId);
  const destinations = await loadDestinations(db);
  const ingredients = await loadIngredients(db);
  const slotRules = await loadSlotRules(db, application.occasion);
  const shape = await loadShape(db, application.occasion);
  const issued = await loadIssuedFingerprints(db);

  return {
    application,
    history,
    cohorts,
    catalogue: {
      facets,
      destinations,
      ingredients,
      slotRules,
      shape,
      issuedFingerprints: issued,
    } satisfies Catalogue,
  };
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
    `select facet_id, dimension_code, facet_code, facet_label, quiz_field, polarity
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
  }));

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
    secret: nullableStr(row.secret),
    musicService: nullableStr(row.music_service),
    stated,
    scale,
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
 * One entry per pool, and adding a fifth is one entry here plus the three calls
 * in a migration. The identifiers below are a fixed constant of this module —
 * they never come from a request — so composing them into SQL is safe in the
 * one way that matters.
 */
const POOLS: readonly {
  pool: string;
  table: string;
  price: string | null;
  minGuests: string | null;
  maxGuests: string | null;
  active: string;
}[] = [
  {
    pool: "product",
    table: "product",
    price: "price_cents",
    minGuests: null,
    maxGuests: null,
    active: "t.status = 'active'",
  },
  {
    pool: "game",
    table: "game",
    price: "price_cents",
    minGuests: "min_guests",
    maxGuests: "max_guests",
    active: "t.status = 'active'",
  },
  {
    pool: "tracklist",
    table: "tracklist",
    price: null,
    minGuests: null,
    maxGuests: null,
    active: "t.status = 'active'",
  },
];

async function loadIngredients(db: Queryable): Promise<Ingredient[]> {
  const all: Ingredient[] = [];

  for (const spec of POOLS) {
    const idColumn = `${spec.table}_id`;
    const { rows } = await db.query(
      `select t.id, t.slug, t.name, t.description,
              ${spec.price ? `t.${spec.price}` : "null::integer"} as price_cents,
              ${spec.minGuests ? `t.${spec.minGuests}` : "null::integer"} as min_guests,
              ${spec.maxGuests ? `t.${spec.maxGuests}` : "null::integer"} as max_guests,
              coalesce(
                (select jsonb_object_agg(x.facet_id, x.weight)
                   from ${spec.table}_facet x where x.${idColumn} = t.id),
                '{}'::jsonb) as facets,
              coalesce(
                (select jsonb_agg(jsonb_build_object(
                          'occasion', o.occasion, 'fit', o.fit, 'note', o.note))
                   from ${spec.table}_occasion o where o.${idColumn} = t.id),
                '[]'::jsonb) as occasions,
              coalesce(
                (select jsonb_agg(jsonb_build_object(
                          'slot_code', sl.slot_code, 'fit', sl.fit, 'note', sl.note))
                   from ${spec.table}_slot sl where sl.${idColumn} = t.id),
                '[]'::jsonb) as slots,
              coalesce(
                (select jsonb_object_agg(
                          w.world_id,
                          jsonb_build_object('forbidden', w.forbidden,
                                             'affinity', w.affinity,
                                             'note', w.note))
                   from ${spec.table}_world w where w.${idColumn} = t.id),
                '{}'::jsonb) as worlds,
              s.issue_count, s.last_issued_at, s.customer_count
         from ${spec.table} t
         left join ingredient_issuance s
           on s.entity_table = '${spec.pool}' and s.entity_id = t.id
        where ${spec.active}
        order by t.name`
    );

    for (const row of rows) {
      all.push({
        pool: spec.pool,
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
  }));
}

async function loadShape(
  db: Queryable,
  occasion: OccasionCode
): Promise<OccasionShape> {
  const { rows } = await db.query(
    `select occasion, label, days, note from occasion_shape where occasion = $1`,
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
        affinity: num(row.affinity) ?? 0,
        note: nullableStr(row.note),
      };
    }
  }
  return out;
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
