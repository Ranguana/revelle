import Link from "next/link";

import { query } from "@/lib/db";
import { POOL_STATUS, money, stamp } from "@/lib/desk/labels";

import styles from "../../desk.module.css";
import { Chips, Empty, Head, Status, StatusLegend, TableRow } from "../bits";
import { setProductStatus } from "./actions";
import { refusePoolRow } from "../refuse";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  slug: string;
  name: string;
  supplier: string | null;
  external_url: string | null;
  price_cents: number | null;
  price_band: string | null;
  status: string;
  updated_at: string;
  tags: string[];
};

const FILTERS = ["all", "draft", "active", "discontinued"];

export default async function ProductsPage({
  searchParams,
}: PageProps<"/desk/products">) {
  const params = await searchParams;
  const filter =
    typeof params.status === "string" && FILTERS.includes(params.status)
      ? params.status
      : "all";

  const rows = await query<Row>(
    `select p.id, p.slug::text as slug, p.name, p.supplier, p.external_url,
            p.price_cents, p.price_band::text as price_band,
            p.status::text as status, p.updated_at,
            coalesce(
              (select array_agg(f.label order by f.label)
                 from product_facet pf join facet f on f.id = pf.facet_id
                where pf.product_id = p.id),
              '{}') as tags
       from product p
      ${filter === "all" ? "" : "where p.status = $1::product_status"}
      order by p.updated_at desc
      limit 500`,
    filter === "all" ? [] : [filter]
  );

  return (
    <>
      <Head eyebrow="The edit" title="Products">
        <Link href="/desk/products/new" className={styles.button}>
          Add a product
        </Link>
      </Head>

      <div className={styles.filters}>
        {FILTERS.map((value) => (
          <Link
            key={value}
            href={value === "all" ? "/desk/products" : `/desk/products?status=${value}`}
            className={styles.filter}
            aria-current={filter === value}
          >
            {value === "all" ? "All" : POOL_STATUS[value]}
          </Link>
        ))}
        <span className={styles.hint}>{rows.length} shown</span>
      </div>

      {rows.length > 0 ? <StatusLegend statuses={POOL_STATUS} /> : null}

      {rows.length === 0 ? (
        <Empty>
          Nothing in the pool yet. Add the thing you just found — one at a
          time is the common case, and there is no bulk importer.
        </Empty>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Price</th>
              <th>Supplier</th>
              <th>Tagged</th>
              <th>Status</th>
              <th>Changed</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <TableRow key={row.id} status={row.status}>
                <td>
                  <Link href={`/desk/products/${row.id}`} className={styles.whoEmail}>
                    {row.name}
                  </Link>
                  <div className={styles.when}>
                    {row.slug}
                    {row.external_url ? (
                      <>
                        {" · "}
                        <a
                          href={row.external_url}
                          target="_blank"
                          rel="noreferrer"
                          className={styles.link}
                        >
                          source
                        </a>
                      </>
                    ) : null}
                  </div>
                </td>
                <td className={styles.numeric}>{money(row.price_cents)}</td>
                <td>{row.supplier ?? "—"}</td>
                <td>
                  <Chips items={row.tags} />
                </td>
                <td>
                  <Status code={row.status} label={POOL_STATUS[row.status]} />
                </td>
                <td className={styles.numeric}>{stamp(row.updated_at)}</td>
                <td>
                  {row.status !== "active" ? (
                    <form action={setProductStatus}>
                      <input type="hidden" name="id" value={row.id} />
                      <input type="hidden" name="status" value="active" />
                      <button className={styles.filter}>Offer it</button>
                    </form>
                  ) : (
                    <form action={setProductStatus}>
                      <input type="hidden" name="id" value={row.id} />
                      <input type="hidden" name="status" value="draft" />
                      <button className={styles.filter}>Withdraw</button>
                    </form>
                  )}
                  {/* NO — deletes the row AND records the slug, so no seeder
                      rebuilds it from its document on the next deploy. db/057.
                      Placed after the ternary closes, not inside it: the first
                      attempt landed between the two branches and broke the
                      JSX, which the typechecker caught before anything shipped.
                      Offered on every row — an issued row is protected by the
                      database itself, and the action explains that rather than
                      hiding the control. */}
                  <form action={refusePoolRow}>
                    <input type="hidden" name="entity_table" value="product" />
                    <input type="hidden" name="id" value={row.id} />
                    <input type="hidden" name="back" value="/desk/products" />
                    <button className={styles.filter}>No</button>
                  </form>
                </td>
              </TableRow>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
