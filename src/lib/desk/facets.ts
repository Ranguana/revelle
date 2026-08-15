import "server-only";

import type { PoolClient } from "pg";

import { query, transaction } from "@/lib/db";

/**
 * The shared vocabulary, and how the desk edits a thing's tags.
 *
 * db/002 is emphatic that there is ONE vocabulary: a destination, a product, a
 * game and a menu are all described in the same `facet` rows, which is what
 * makes "which of these suits her" a join rather than a judgement rendered in
 * code. The desk therefore never invents a term, and never offers a private
 * one — every checkbox on every form in this tool is a row in that table.
 *
 * ── WHY THE JOIN TABLE NAME IS A LOOKUP AND NOT A STRING ────────────
 *
 * The join tables are created by install_facet_tags() and are all named
 * `<entity>_facet`. Composing that name from a caller's string would be a SQL
 * identifier built from input, which is an injection surface in every function
 * that touches it — the same objection db/002 raises to storing a predicate as
 * text. So the four that exist are listed here, by hand, and anything else is
 * a compile error rather than a query.
 */

/** entity table -> its facet join table and the column that points at it. */
const TAGGABLE = {
  world: { join: "world_facet", column: "world_id" },
  product: { join: "product_facet", column: "product_id" },
  taste_cohort: { join: "taste_cohort_facet", column: "taste_cohort_id" },
  game: { join: "game_facet", column: "game_id" },
  menu: { join: "menu_facet", column: "menu_id" },
} as const;

export type Taggable = keyof typeof TAGGABLE;

export type FacetRow = {
  id: string;
  dimension_code: string;
  dimension_label: string;
  dimension_position: number;
  code: string;
  label: string;
  description: string;
};

/**
 * Dimensions the desk's tag pickers NEVER offer, and why each one:
 *
 *   voice        a RESOLUTION vocabulary. db/007 says outright that nothing is
 *                tagged in it by hand and nobody is shown it.
 *   guest_count  a CONSTRAINT, not a taste. db/006: no ingredient is ever
 *   spend_per_person   tagged in either dimension.
 *   budget       retired with the total-spend question.
 *   music_service      a ROUTING answer — how the soundtrack reaches her. It
 *                describes a delivery channel, not what anything is like.
 *   season       projected from menu.season by a trigger (db/012). Offering it
 *   cooking      as a checkbox would let a curator create a second, contrary
 *                copy of a fact the column already holds.
 */
const NOT_OFFERED = new Set([
  "voice",
  "guest_count",
  "spend_per_person",
  "budget",
  "music_service",
  "season",
  "cooking",
]);

/**
 * THE FIFTY TONES ARE FOR DESTINATIONS ONLY.
 *
 * db/007 is precise about what `voice_tone` is: "the fifty tones a host is
 * shown, and the same fifty a destination is tagged with". Both ends of that
 * sentence are a REGISTER — how her people talk, how a house talks. A candle
 * does not talk, and a menu does not either.
 *
 * This is not only tidiness. Fifty checkboxes on the form used most often, for
 * a dimension that is meaningless there, is fifty things to read past on every
 * single product — and a picker mostly full of irrelevant terms is a picker
 * that stops being read, which is how things end up untagged.
 */
const DESTINATION_ONLY = new Set(["voice_tone"]);

/**
 * The tag picker's vocabulary for one kind of thing, in presentation order.
 *
 * Takes the entity rather than serving one list to everything, because what a
 * thing can meaningfully BE described as differs by what it is. The vocabulary
 * itself is still the single shared one — this narrows what is offered, never
 * what exists.
 */
export async function taggingVocabulary(
  entity: Taggable = "world"
): Promise<FacetRow[]> {
  const rows = await query<FacetRow>(
    `select f.id,
            f.dimension_code,
            d.label       as dimension_label,
            d.position    as dimension_position,
            f.code::text  as code,
            f.label,
            f.description
       from facet f
       join facet_dimension d on d.code = f.dimension_code
      where f.status = 'active'
      order by d.position, f.label`
  );
  return rows.filter(
    (row) =>
      !NOT_OFFERED.has(row.dimension_code) &&
      (entity === "world" || !DESTINATION_ONLY.has(row.dimension_code))
  );
}

export type FacetGroup = {
  code: string;
  label: string;
  facets: FacetRow[];
};

export function groupFacets(rows: readonly FacetRow[]): FacetGroup[] {
  const groups: FacetGroup[] = [];
  for (const row of rows) {
    let group = groups.find((g) => g.code === row.dimension_code);
    if (!group) {
      group = {
        code: row.dimension_code,
        label: row.dimension_label,
        facets: [],
      };
      groups.push(group);
    }
    group.facets.push(row);
  }
  return groups;
}

export type ExistingTag = {
  facet_id: string;
  weight: string;
  provenance: string;
  note: string | null;
  code: string;
  label: string;
  dimension_code: string;
};

export async function tagsFor(
  entity: Taggable,
  id: string
): Promise<ExistingTag[]> {
  const { join, column } = TAGGABLE[entity];
  return query<ExistingTag>(
    `select t.facet_id, t.weight::text as weight, t.provenance::text as provenance,
            t.note, f.code::text as code, f.label, f.dimension_code
       from ${join} t
       join facet f on f.id = t.facet_id
      where t.${column} = $1
      order by f.dimension_code, f.label`
  , [id]);
}

/**
 * Set a thing's tags to exactly this list of facets.
 *
 * ── THE ONE RULE WORTH STATING ──────────────────────────────────────
 *
 * A tag that is already there KEEPS ITS WEIGHT. The checkbox says whether the
 * thing is tagged; it does not say how strongly, and a form that silently reset
 * every hand-tuned 0.35 to 1.000 on every save would destroy a curator's
 * judgement as a side effect of editing a price. db/002 builds a whole layered
 * primary key so that a recompute cannot overwrite a curator; a form that does
 * it instead would be the same failure arriving by a different door.
 *
 * New tags land at 1.000, provenance 'curator'. Unticked tags are deleted,
 * because an untick is a statement.
 */
export async function setTags(
  entity: Taggable,
  id: string,
  facetIds: readonly string[]
): Promise<{ added: number; removed: number }> {
  const { join, column } = TAGGABLE[entity];
  const wanted = Array.from(new Set(facetIds));

  return transaction(async (client: PoolClient) => {
    const removed = await client.query(
      `delete from ${join}
        where ${column} = $1
          and ($2::uuid[] = '{}' or facet_id <> all($2::uuid[]))`,
      [id, wanted]
    );

    if (wanted.length === 0) {
      return { added: 0, removed: removed.rowCount ?? 0 };
    }

    const added = await client.query(
      `insert into ${join} (${column}, facet_id, weight, provenance, note)
       select $1, f.id, 1.000, 'curator', 'Tagged at the desk.'
         from unnest($2::uuid[]) as f(id)
       on conflict (${column}, facet_id) do nothing`,
      [id, wanted]
    );

    return { added: added.rowCount ?? 0, removed: removed.rowCount ?? 0 };
  });
}

/**
 * Every facet id a form submitted, filtered to ones that actually exist.
 *
 * A checkbox value is a uuid from our own page, but it arrives from a browser
 * and the foreign key would refuse an unknown one with a 500 rather than a
 * message. Validating here turns that into nothing happening, quietly.
 */
export async function validFacetIds(
  candidates: readonly string[]
): Promise<string[]> {
  const ids = candidates.filter((value) =>
    /^[0-9a-f-]{36}$/i.test(value)
  );
  if (ids.length === 0) return [];
  const rows = await query<{ id: string }>(
    `select id from facet where id = any($1::uuid[]) and status = 'active'`,
    [ids]
  );
  return rows.map((row) => row.id);
}
