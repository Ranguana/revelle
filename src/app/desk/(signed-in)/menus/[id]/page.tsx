import Link from "next/link";
import { notFound } from "next/navigation";

import { query, queryOne } from "@/lib/db";
import { groupFacets, tagsFor, taggingVocabulary } from "@/lib/desk/facets";
import { POOL_STATUS } from "@/lib/desk/labels";
import { menuSequence } from "@/lib/desk/lists";
import { readReview, reviewPass } from "@/lib/desk/review";

import styles from "../../../desk.module.css";
import Thread from "../../Thread";
import { Head, Review, Status } from "../../bits";
import MenuForm, { type MenuValues } from "../MenuForm";

export const dynamic = "force-dynamic";

export default async function MenuPage({
  params,
  searchParams,
}: PageProps<"/desk/menus/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const search = await searchParams;
  const saved = search.saved === "1";
  const carried = readReview(search);

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
    // THE CLAIM, and not "everything that is not a veto". The box beside it
    // asks "which destinations was it written for", which is db/019's `native`
    // column exactly; reading `not forbidden` ticked it for a row that is only
    // a re-weighting and then let a save turn that weight into a claim. The
    // three states round-trip through /desk/matrix.
    query<{ world_id: string }>(
      `select world_id from menu_world where menu_id = $1 and native`,
      [id]
    ),
  ]);

  // The two projected dimensions are shown as their own fields, so they are
  // filtered out of the tag picker's idea of what is ticked. db/012.
  const handTags = tags.filter(
    (tag) => tag.dimension_code !== "season" && tag.dimension_code !== "cooking"
  );

  // Asked live, and only during a review: the sequence is recounted here
  // rather than carried, so a row acted on off a filtered pass reports that it
  // has left the list instead of pretending it has not.
  const sequence = carried ? await menuSequence(carried.search) : [];
  const pass = carried
    ? reviewPass({ path: "/desk/menus", ids: sequence, id, carried })
    : null;

  return (
    <>
      <Head eyebrow="The table" title={menu.name}>
        <Status code={menu.status} label={POOL_STATUS[menu.status]} />
        <Link href="/desk/menus" className={styles.filter}>
          All menus
        </Link>
      </Head>

      {pass ? <Review pass={pass} noun="menus" /> : null}

      {saved ? <p className={styles.ok}>Saved.</p> : null}

      <div className={styles.panels}>
        <div>
          <MenuForm
            carried={carried}
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
