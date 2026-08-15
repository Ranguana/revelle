import Link from "next/link";
import { notFound } from "next/navigation";

import { query, queryOne } from "@/lib/db";
import { groupFacets, tagsFor, taggingVocabulary } from "@/lib/desk/facets";
import { POOL_STATUS } from "@/lib/desk/labels";

import styles from "../../../desk.module.css";
import Thread from "../../Thread";
import { Head, Status } from "../../bits";
import DrinkForm, { type DrinkValues } from "../DrinkForm";

export const dynamic = "force-dynamic";

export default async function DrinkPage({
  params,
  searchParams,
}: PageProps<"/desk/drinks/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const saved = (await searchParams).saved === "1";

  const drink = await queryOne<DrinkValues & { status: string; name: string }>(
    `select id, slug::text as slug, name, cocktails, mocktails,
            season::text as season, season_note, season_strict,
            making::text as making, notes, status::text as status
       from drink where id = $1`,
    [id]
  );
  if (!drink) notFound();

  const [groups, tags, destinations, attached] = await Promise.all([
    taggingVocabulary("drink").then(groupFacets),
    tagsFor("drink", id),
    query<{ id: string; name: string }>(
      `select id, name from world where status <> 'retired' order by name`
    ),
    query<{ world_id: string }>(
      `select world_id from drink_world where drink_id = $1 and not forbidden`,
      [id]
    ),
  ]);

  // The two projected dimensions are shown as their own fields, so they are
  // filtered out of the tag picker's idea of what is ticked. db/017.
  const handTags = tags.filter(
    (tag) => tag.dimension_code !== "season" && tag.dimension_code !== "making"
  );

  return (
    <>
      <Head eyebrow="The table" title={drink.name}>
        <Status code={drink.status} label={POOL_STATUS[drink.status]} />
        <Link href="/desk/drinks" className={styles.filter}>
          All drinks
        </Link>
      </Head>

      {saved ? <p className={styles.ok}>Saved.</p> : null}

      <div className={styles.panels}>
        <div>
          <DrinkForm
            values={drink}
            groups={groups}
            selected={handTags.map((tag) => tag.facet_id)}
            weights={handTags.map((tag) => [tag.facet_id, tag.weight] as const)}
            destinations={destinations}
            attached={attached.map((row) => row.world_id)}
          />
        </div>
        <div>
          <Thread
            subject={{ table: "drink", id }}
            back={`/desk/drinks/${id}`}
            title="Notes on this drink"
          />
        </div>
      </div>
    </>
  );
}
