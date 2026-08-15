import Link from "next/link";
import { notFound } from "next/navigation";

import { queryOne } from "@/lib/db";
import { groupFacets, tagsFor, taggingVocabulary } from "@/lib/desk/facets";
import { POOL_STATUS } from "@/lib/desk/labels";

import styles from "../../../desk.module.css";
import Thread from "../../Thread";
import { Head, Status } from "../../bits";
import ProductForm, { type ProductValues } from "../ProductForm";

export const dynamic = "force-dynamic";

export default async function ProductPage({
  params,
  searchParams,
}: PageProps<"/desk/products/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const saved = (await searchParams).saved === "1";

  const product = await queryOne<ProductValues & { status: string; name: string }>(
    `select id, slug::text as slug, name, description, external_url, image_url,
            price_cents, price_band::text as price_band, supplier, source_note,
            status::text as status
       from product where id = $1`,
    [id]
  );
  if (!product) notFound();

  const [groups, tags] = await Promise.all([
    taggingVocabulary("product").then(groupFacets),
    tagsFor("product", id),
  ]);

  return (
    <>
      <Head eyebrow="The edit" title={product.name}>
        <Status code={product.status} label={POOL_STATUS[product.status]} />
        <Link href="/desk/products" className={styles.filter}>
          All products
        </Link>
      </Head>

      {saved ? <p className={styles.ok}>Saved.</p> : null}

      <div className={styles.panels}>
        <div>
          <ProductForm
            values={product}
            groups={groups}
            selected={tags.map((tag) => tag.facet_id)}
            weights={tags.map((tag) => [tag.facet_id, tag.weight] as const)}
          />
        </div>
        <div>
          <Thread
            subject={{ table: "product", id }}
            back={`/desk/products/${id}`}
            title="Notes on this product"
          />
        </div>
      </div>
    </>
  );
}
