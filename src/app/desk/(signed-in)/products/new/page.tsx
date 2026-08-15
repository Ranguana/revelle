import { groupFacets, taggingVocabulary } from "@/lib/desk/facets";

import { Head } from "../../bits";
import ProductForm from "../ProductForm";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const groups = groupFacets(await taggingVocabulary("product"));

  return (
    <>
      <Head eyebrow="The edit" title="Add a product" />
      <ProductForm values={{ status: "draft" }} groups={groups} selected={[]} />
    </>
  );
}
