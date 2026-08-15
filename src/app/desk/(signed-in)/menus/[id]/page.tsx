import Link from "next/link";
import { notFound } from "next/navigation";

import { query, queryOne } from "@/lib/db";
import { groupFacets, tagsFor, taggingVocabulary } from "@/lib/desk/facets";
import { POOL_STATUS } from "@/lib/desk/labels";

import styles from "../../../desk.module.css";
import Thread from "../../Thread";
import { Head, Status } from "../../bits";
import MenuForm, { type MenuValues } from "../MenuForm";

export const dynamic = "force-dynamic";

export default async function MenuPage({
  params,
  searchParams,
}: PageProps<"/desk/menus/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const saved = (await searchParams).saved === "1";

  const menu = await queryOne<MenuValues & { status: string; name: string }>(
    `select id, slug::text as slug, name, dishes, season::text as season,
            season_note, season_strict, cooking::text as cooking, cooking_note,
            notes, status::text as status
       from menu where id = $1`,
    [id]
  );
  if (!menu) notFound();

  const [groups, tags, destinations, attached] = await Promise.all([
    taggingVocabulary("menu").then(groupFacets),
    tagsFor("menu", id),
    query<{ id: string; name: string }>(
      `select id, name from world where status <> 'retired' order by name`
    ),
    query<{ world_id: string }>(
      `select world_id from menu_world where menu_id = $1 and not forbidden`,
      [id]
    ),
  ]);

  // The two projected dimensions are shown as their own fields, so they are
  // filtered out of the tag picker's idea of what is ticked. db/012.
  const handTags = tags.filter(
    (tag) => tag.dimension_code !== "season" && tag.dimension_code !== "cooking"
  );

  return (
    <>
      <Head eyebrow="The table" title={menu.name}>
        <Status code={menu.status} label={POOL_STATUS[menu.status]} />
        <Link href="/desk/menus" className={styles.filter}>
          All menus
        </Link>
      </Head>

      {saved ? <p className={styles.ok}>Saved.</p> : null}

      <div className={styles.panels}>
        <div>
          <MenuForm
            values={menu}
            groups={groups}
            selected={handTags.map((tag) => tag.facet_id)}
            weights={handTags.map((tag) => [tag.facet_id, tag.weight] as const)}
            destinations={destinations}
            attached={attached.map((row) => row.world_id)}
          />
        </div>
        <div>
          <Thread
            subject={{ table: "menu", id }}
            back={`/desk/menus/${id}`}
            title="Notes on this menu"
          />
        </div>
      </div>
    </>
  );
}
