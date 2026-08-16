import Link from "next/link";
import { notFound } from "next/navigation";

import { query, queryOne } from "@/lib/db";
import { groupFacets, tagsFor, taggingVocabulary } from "@/lib/desk/facets";
import { POOL_STATUS } from "@/lib/desk/labels";

import styles from "../../../desk.module.css";
import Thread from "../../Thread";
import { Head, Status } from "../../bits";
import DishForm, { type DishValues } from "../DishForm";

export const dynamic = "force-dynamic";

export default async function DishPage({
  params,
  searchParams,
}: PageProps<"/desk/dishes/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const saved = (await searchParams).saved === "1";

  const dish = await queryOne<DishValues & { status: string; name: string }>(
    `select id, slug::text as slug, name, course::text as course,
            making::text as making, season::text as season, season_note,
            season_strict, source_note, notes, status::text as status
       from dish where id = $1`,
    [id]
  );
  if (!dish) notFound();

  const [groups, tags, destinations, attached, meals] = await Promise.all([
    taggingVocabulary("dish").then(groupFacets),
    tagsFor("dish", id),
    query<{ id: string; name: string }>(
      `select id, name from world where status <> 'retired' order by name`
    ),
    // THE CLAIM, and not "everything that is not a veto". The box beside it
    // asks "which destinations was it written for", which is db/019's `native`
    // column exactly. Reading `not forbidden` here would tick the box for a row
    // that is only a re-weighting, and then a save would turn that weight into
    // a claim — which is the second half of the bug the delete in actions.ts is
    // narrowed to avoid. The three states round-trip through /desk/matrix.
    query<{ world_id: string }>(
      `select world_id from dish_world where dish_id = $1 and native`,
      [id]
    ),
    // db/023. Empty means every shape, so an empty result is a complete answer.
    query<{ meal: string }>(
      `select meal::text as meal from dish_meal where dish_id = $1 order by meal`,
      [id]
    ),
  ]);

  // The two projected dimensions are shown as their own fields, so they are
  // filtered out of the tag picker's idea of what is ticked. db/021.
  const handTags = tags.filter(
    (tag) => tag.dimension_code !== "season" && tag.dimension_code !== "making"
  );

  return (
    <>
      <Head eyebrow="The table" title={dish.name}>
        <Status code={dish.status} label={POOL_STATUS[dish.status]} />
        <Link href="/desk/dishes" className={styles.filter}>
          All dishes
        </Link>
      </Head>

      {saved ? <p className={styles.ok}>Saved.</p> : null}

      <div className={styles.panels}>
        <div>
          <DishForm
            values={dish}
            groups={groups}
            selected={handTags.map((tag) => tag.facet_id)}
            weights={handTags.map((tag) => [tag.facet_id, tag.weight] as const)}
            destinations={destinations}
            attached={attached.map((row) => row.world_id)}
            meals={meals.map((row) => row.meal)}
          />
        </div>
        <div>
          <Thread
            subject={{ table: "dish", id }}
            back={`/desk/dishes/${id}`}
            title="Notes on this dish"
          />
        </div>
      </div>
    </>
  );
}
