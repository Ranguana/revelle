import "server-only";

import { query } from "@/lib/db";

/**
 * WHAT A THING NEEDS OF THE ROOM — the desk's end of db/020's
 * `ingredient_requirement`, and there is exactly ONE of these vocabularies.
 *
 * db/033 is the migration that made that true. `bank_venue` was a second
 * vocabulary saying what `structural_requirement` already said, invented three
 * hours earlier because the real one had no soft grade; it is gone, its two
 * rows moved, and every registered pool now carries a venue requirement in the
 * same place or carries none. The founder's instruction was "unify the venue
 * vocabulary, don't bridge it", and a bridge is precisely what a second list in
 * this file would be.
 *
 * So nothing here types out a code. The vocabulary is a TABLE — it is read,
 * joined and ordered, the way /desk/games reads `game_requirement_kind` and
 * src/lib/selection/catalogue.ts reads this same one. db/020: the list "is
 * closed only in the sense that adding to it is an INSERT rather than a
 * migration", which a hand-written copy here would silently stop tracking.
 *
 * ── UNTAGGED MEANS WORKS ANYWHERE ────────────────────────────────────
 *
 * db/020, verbatim, and it is the founder's instruction as well as the safe
 * default: "Where it is a judgement call, leave it untagged rather than guess."
 * NO ROW IS A COMPLETE ANSWER. Every screen that renders these must say so in
 * words, because an empty cell is the one place a curator will read a gap.
 *
 * ── WHY `vetoes` IS DERIVED AND NOT DECLARED ─────────────────────────
 *
 * The desk draws a hard requirement as a veto chip and a soft one as plain
 * text, and the two must never look like one control with an on and an off.
 * The honest test for "hard" is not a list kept here: it is whether any room
 * actually REFUSES the thing, which is `venue_affordance`, which is the same
 * table `venueEligibility()` prunes with. A requirement no room declines cannot
 * delete a deliverable, so it is not drawn as though it could.
 *
 * That is how `outdoor_access` comes out soft without being named: db/033 adds
 * the code and no affordance rows, so no room refuses it. And it is a GRADE
 * rather than a sibling — anything satisfying `requires_outdoors` satisfies it
 * — which the `position` ordering keeps visible by sitting the two next to each
 * other wherever the vocabulary is printed.
 */

/**
 * The pools db/033's CHECK will accept an `entity_table` of.
 *
 * A union rather than a string, for the reason facets.ts gives about its join
 * names: an unknown pool should be a compile error and not a constraint
 * violation raised as a 500. The value is a bound parameter, never
 * interpolated, so this is about honesty rather than injection.
 */
export const REQUIRABLE = [
  "product",
  "game",
  "tracklist",
  "menu",
  "drink",
  "dish",
  "bank_item",
] as const;

export type Requirable = (typeof REQUIRABLE)[number];

export type RequirementKind = {
  code: string;
  label: string;
  /** Completes "it …" in a rejection sentence. db/020's own column. */
  demand: string;
  description: string;
  /** Some room refuses it, so carrying it can actually delete a deliverable. */
  vetoes: boolean;
};

export type CarriedRequirement = RequirementKind & { note: string };

/** Postgres text arrives as a string; a tampered or absent one must not throw. */
function text(value: unknown): string {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

type KindRow = {
  code: string;
  label: string;
  demand: string;
  description: string;
  vetoes: boolean;
};

const VETOES = `exists (select 1 from venue_affordance v
                         where v.requirement = k.code and not v.provided)`;

function kind(row: KindRow): RequirementKind {
  return {
    code: text(row.code),
    label: text(row.label),
    demand: text(row.demand),
    description: text(row.description),
    // `exists` is a boolean out of node-postgres, but this is the one field a
    // screen draws a veto mark from and a truthy string would be wrong forever.
    vetoes: row.vetoes === true,
  };
}

/**
 * Every requirement there is, in the order db/020 positions them.
 *
 * Presentation order and not alphabetical, because the order is the argument:
 * `requires_outdoors` at 10 and `outdoor_access` at 15 read as a ladder, and
 * sorting by name would put the lesser grade four rows away from the greater.
 */
export async function requirementVocabulary(): Promise<RequirementKind[]> {
  const rows = await query<KindRow>(
    `select k.code, k.label, k.demand, k.description, ${VETOES} as vetoes
       from structural_requirement k
      order by k.position, k.code`
  );
  return rows.map(kind);
}

type CarriedRow = KindRow & { entity_id: string; note: string | null };

function carried(row: CarriedRow): CarriedRequirement {
  return { ...kind(row), note: text(row.note) };
}

/** What one thing needs of the room. An empty array means: anywhere. */
export async function requirementsFor(
  entity: Requirable,
  id: string
): Promise<CarriedRequirement[]> {
  const rows = await query<CarriedRow>(
    `select r.entity_id, r.note, k.code, k.label, k.demand, k.description,
            ${VETOES} as vetoes
       from ingredient_requirement r
       join structural_requirement k on k.code = r.requirement
      where r.entity_table = $1 and r.entity_id = $2
      order by k.position, k.code`,
    [entity, id]
  );
  return rows.map(carried);
}

/**
 * The same, for a page of rows, in one query rather than one per row.
 *
 * Returns a Map keyed by entity id. A row with no requirements is ABSENT from
 * the map rather than present with an empty list, and callers must read the
 * absence as "works anywhere" — which is what it means everywhere else too.
 */
export async function requirementsForMany(
  entity: Requirable,
  ids: readonly string[]
): Promise<Map<string, CarriedRequirement[]>> {
  const byEntity = new Map<string, CarriedRequirement[]>();
  if (ids.length === 0) return byEntity;

  const rows = await query<CarriedRow>(
    `select r.entity_id, r.note, k.code, k.label, k.demand, k.description,
            ${VETOES} as vetoes
       from ingredient_requirement r
       join structural_requirement k on k.code = r.requirement
      where r.entity_table = $1 and r.entity_id = any($2::uuid[])
      order by k.position, k.code`,
    [entity, ids]
  );

  for (const row of rows) {
    const key = text(row.entity_id);
    const list = byEntity.get(key) ?? [];
    list.push(carried(row));
    byEntity.set(key, list);
  }
  return byEntity;
}

/**
 * The one requirement this code names, or null if the vocabulary has no such
 * thing.
 *
 * The same guard `validFacetIds` puts in front of a facet id and for the same
 * reason: the value comes from our own select, but it arrives from a browser,
 * and the foreign key would refuse an unknown one with a 500 instead of a
 * sentence. Checked against the table rather than a list, so a code added by
 * INSERT is usable the moment it exists.
 *
 * It returns the ROW rather than a boolean so that a caller writing an audit
 * line can use `demand`, which db/020 shaped to complete "it …". A log entry
 * reading "it needs live fire" is the sentence a person can check; one reading
 * "requires_open_flame" is the code, which is the thing the label exists to
 * translate.
 */
export async function requirementNamed(
  code: string
): Promise<RequirementKind | null> {
  if (!/^[a-z_]{1,60}$/.test(code)) return null;
  const rows = await query<KindRow>(
    `select k.code, k.label, k.demand, k.description, ${VETOES} as vetoes
       from structural_requirement k
      where k.code = $1`,
    [code]
  );
  return rows.length === 1 ? kind(rows[0]) : null;
}

/**
 * Declare one requirement, or reword the note on one already declared.
 *
 * An upsert rather than an insert: re-declaring something is a curator saying
 * the same thing again, and it should read as a saved note and not as a
 * constraint violation.
 */
export async function declareRequirement(
  entity: Requirable,
  id: string,
  requirement: string,
  note: string
): Promise<void> {
  await query(
    `insert into ingredient_requirement (entity_table, entity_id, requirement, note)
     values ($1, $2, $3, $4)
     on conflict (entity_table, entity_id, requirement)
       do update set note = excluded.note`,
    [entity, id, requirement, note]
  );
}

/** Clear one. The row going away IS the claim that it works anywhere. */
export async function clearRequirement(
  entity: Requirable,
  id: string,
  requirement: string
): Promise<void> {
  await query(
    `delete from ingredient_requirement
      where entity_table = $1 and entity_id = $2 and requirement = $3`,
    [entity, id, requirement]
  );
}
