import Link from "next/link";

import { query } from "@/lib/db";
import { MIXING_LEVELS, POOL_STATUS, SEASONS } from "@/lib/desk/labels";

import styles from "../../desk.module.css";
import { Chips, Empty, Head, Status } from "../bits";
import { setDrinkStatus } from "./actions";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  slug: string;
  name: string;
  cocktails: string;
  mocktails: string;
  season: string;
  season_note: string;
  season_strict: boolean;
  making: string;
  status: string;
  world_slugs: string[];
  tags: string[];
};

const label = (
  list: readonly { code: string; label: string }[],
  code: string
) => list.find((entry) => entry.code === code)?.label ?? code;

const FILTERS = ["all", "draft", "active", "discontinued"];

export default async function DrinksPage({
  searchParams,
}: PageProps<"/desk/drinks">) {
  const params = await searchParams;
  const filter =
    typeof params.status === "string" && FILTERS.includes(params.status)
      ? params.status
      : "all";

  const rows = await query<Row>(
    `select id, slug::text as slug, name, cocktails, mocktails,
            season::text as season, season_note, season_strict,
            making::text as making, status::text as status, world_slugs, tags
       from drink_card
      ${filter === "all" ? "" : "where status = $1::product_status"}
      order by slug`,
    filter === "all" ? [] : [filter]
  );

  return (
    <>
      <Head eyebrow="The table" title="Drinks">
        <Link href="/desk/drinks/new" className={styles.button}>
          Add a drink
        </Link>
      </Head>

      <p className={styles.note}>
        Every drink carries a mirror: the same glass, built from the same
        components, arriving at the same time. It is one record with two builds
        and the two are chosen together, so nobody at the table is visibly not
        drinking and nobody has a conversation about it.
      </p>

      <div className={styles.filters}>
        {FILTERS.map((value) => (
          <Link
            key={value}
            href={
              value === "all" ? "/desk/drinks" : `/desk/drinks?status=${value}`
            }
            className={styles.filter}
            aria-current={filter === value}
          >
            {value === "all" ? "All" : POOL_STATUS[value]}
          </Link>
        ))}
        <span className={styles.hint}>{rows.length} shown</span>
      </div>

      {rows.length === 0 ? (
        <Empty>
          Nothing yet. <code>npm run seed:drinks</code> loads the programmes
          from docs/drinks.md, verbatim.
        </Empty>
      ) : (
        <ul className={styles.rows}>
          {rows.map((row) => (
            <li key={row.id} className={styles.row}>
              <div className={styles.who}>
                <Link
                  href={`/desk/drinks/${row.id}`}
                  className={styles.whoEmail}
                >
                  {row.name}
                </Link>
                <span className={styles.when}>{row.slug}</span>
                <Chips items={row.world_slugs} />
              </div>

              <div>
                <div className={styles.facts}>
                  <div className={styles.fact}>
                    <span className={styles.factLabel}>The cocktails</span>
                    <span className={styles.factValue}>{row.cocktails}</span>
                  </div>
                  <div className={styles.fact}>
                    <span className={styles.factLabel}>The mirror</span>
                    <span className={styles.factValue}>{row.mocktails}</span>
                  </div>
                  <div className={styles.fact}>
                    <span className={styles.factLabel}>Season</span>
                    <span className={styles.factValue}>
                      {row.season_note || label(SEASONS, row.season)}
                      {row.season_strict ? " · hard filter" : ""}
                    </span>
                  </div>
                  <div className={styles.fact}>
                    <span className={styles.factLabel}>Mixing</span>
                    <span className={styles.factValue}>
                      {label(MIXING_LEVELS, row.making)}
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
                <form action={setDrinkStatus}>
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
                <Link href={`/desk/drinks/${row.id}`} className={styles.filter}>
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
