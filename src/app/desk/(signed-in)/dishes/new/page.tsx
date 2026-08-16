import { query } from "@/lib/db";
import { groupFacets, taggingVocabulary } from "@/lib/desk/facets";

import { Head } from "../../bits";
import DishForm from "../DishForm";

export const dynamic = "force-dynamic";

export default async function NewDishPage() {
  const [groups, destinations] = await Promise.all([
    taggingVocabulary("dish").then(groupFacets),
    query<{ id: string; name: string }>(
      `select id, name from world where status <> 'retired' order by name`
    ),
  ]);

  return (
    <>
      <Head eyebrow="The table" title="Add a dish" />
      <DishForm
        values={{ status: "draft" }}
        groups={groups}
        selected={[]}
        destinations={destinations}
        attached={[]}
        meals={[]}
      />
    </>
  );
}
