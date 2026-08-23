import Link from "next/link";

import { query } from "@/lib/db";
import { COOKING_LEVELS, POOL_STATUS, SEASONS } from "@/lib/desk/labels";

import { statusSearch } from "@/lib/desk/lists";
import { passHref } from "@/lib/desk/review";

import styles from "../../desk.module.css";
import { Chips, Empty, Head, Status, StatusLegend, rowClass } from "../bits";
import { setMenuStatus } from "./actions";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  slug: string;
  name: string;
  dishes: string;
  season: string;
  season_note: string;
  season_strict: boolean;
  cooking: string;
  cooking_note: string;
  status: string;
  world_slugs: string[];
  tags: string[];
};

const label = (
  list: readonly { code: string; label: string }[],
  code: string
) => list.find((entry) => entry.code === code)?.label ?? code;

const FILTERS = ["all", "draft", "active", "discontinued"];

export default async function MenusPage({
  searchParams,
}: PageProps<"/desk/menus">) {
  const params = await searchParams;
  const filter =
    typeof params.status === "string" && FILTERS.includes(params.status)
      ? params.status
      : "all";

  const rows = await query<Row>(
    `select id, slug::text as slug, name, dishes, season::text as season,
            season_note, season_strict, cooking::text as cooking, cooking_note,
            status::text as status, world_slugs, tags
       from menu_card
      ${filter === "all" ? "" : "where status = $1::product_status"}
      order by slug`,
    filter === "all" ? [] : [filter]
  );

  return (
    <>
      <Head eyebrow="The table" title="Menus">
        <Link href="/desk/menus/new" className={styles.button}>
          Add a menu
        </Link>
      </Head>

      <p className={styles.note}>
        Menu ideas, never recipes — a member can cook or she can order; what she
        lacks is knowing what the evening should be. A menu is chosen whole, so
        the courses agree with each other rather than each agreeing with her
        answers separately.
      </p>

      <div className={styles.filters}>
        {FILTERS.map((value) => (
          <Link
            key={value}
            href={value === "all" ? "/desk/menus" : `/desk/menus?status=${value}`}
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
          Nothing yet. <code>npm run seed:menus</code> loads the twenty from
          docs/menus.md, verbatim.
        </Empty>
      ) : (
        <ul className={styles.rows}>
          {rows.map((row, seat) => (
            <li key={row.id} className={rowClass(row.status)}>
              <div className={styles.who}>
                {/* Into the review, carrying this view and this row's place. */}
                <Link
                  href={passHref(
                    `/desk/menus/${row.id}`,
                    statusSearch(filter),
                    seat + 1
                  )}
                  className={styles.whoEmail}
                >
                  {row.name}
                </Link>
                <span className={styles.when}>{row.slug}</span>
                <Chips items={row.world_slugs} />
              </div>

              <div>
                <p className={styles.secret} style={{ fontSize: "0.9375rem" }}>
                  {row.dishes}
                </p>
                <div className={styles.facts} style={{ marginTop: "0.375rem" }}>
                  <div className={styles.fact}>
                    <span className={styles.factLabel}>Season</span>
                    <span className={styles.factValue}>
                      {row.season_note || label(SEASONS, row.season)}
                      {row.season_strict ? " · hard filter" : ""}
                    </span>
                  </div>
                  <div className={styles.fact}>
                    <span className={styles.factLabel}>Cooking</span>
                    <span className={styles.factValue}>
                      {label(COOKING_LEVELS, row.cooking)}
                      {row.cooking_note ? ` — ${row.cooking_note}` : ""}
                    </span>
                  </div>
                  <div className={styles.fact}>
                    <span className={styles.factLabel}>Tagged</span>
                    <Chips items={row.tags} />
                  </div>
                </div>
              </div>

              <div className={styles.actions}>
                <Status code={row.status} label={POOL_STATUS[row.status]} />
                <form action={setMenuStatus}>
                  <input type="hidden" name="id" value={row.id} />
                  <input
                    type="hidden"
                    name="status"
                    value={row.status === "active" ? "draft" : "active"}
                  />
                  <button className={styles.filter}>
                    {row.status === "active" ? "Withdraw" : "Offer it"}
                  </button>
                </form>
                <Link
                  href={passHref(
                    `/desk/menus/${row.id}`,
                    statusSearch(filter),
                    seat + 1
                  )}
                  className={styles.filter}
                >
                  Open
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
