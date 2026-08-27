import Link from "next/link";

import { query, queryOne } from "@/lib/db";
import { COOKING_LEVELS, MENU_STATUS, SEASONS } from "@/lib/desk/labels";

import { MENU_FROM, MENU_ORDER, menuList } from "@/lib/desk/lists";
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
  retirement_note: string | null;
};

/**
 * WHETHER THE POOL ITSELF IS RETIRED, asked of the registry.
 *
 * `ingredient_pool` is the only truth about what pools exist (rule 19) and,
 * since db/045, about which of them the house still stocks. This screen reads
 * it rather than knowing: the day the founder brings the set menu back she
 * clears one column, and this banner goes away on its own instead of becoming
 * a sentence somebody has to remember to delete.
 */
type PoolStanding = {
  retired: boolean;
  retirement_note: string | null;
  superseded_by: string | null;
};

const label = (
  list: readonly { code: string; label: string }[],
  code: string
) => list.find((entry) => entry.code === code)?.label ?? code;

const FILTERS = ["all", "draft", "active"];

export default async function MenusPage({
  searchParams,
}: PageProps<"/desk/menus">) {
  const params = await searchParams;
  const list = menuList(params);
  const filter = list.status === "" ? "all" : list.status;

  const rows = await query<Row>(
    `select m.id, m.slug::text as slug, m.name, m.dishes,
            m.season::text as season, m.season_note, m.season_strict,
            m.cooking::text as cooking, m.cooking_note,
            m.status::text as status, m.world_slugs, m.tags, m.retirement_note
       from ${MENU_FROM}
      ${list.where}
      order by ${MENU_ORDER}`,
    [...list.binds]
  );

  /*
    COUNTED WHETHER OR NOT THEY ARE SHOWN — the destinations screen's rule,
    which is not a nicety: a shorter list that does not say it is shorter is
    the failure this codebase keeps rediscovering.
  */
  const retiredCount = Number(
    (
      await queryOne<{ n: string }>(
        `select count(*)::text as n from menu where status = 'discontinued'`
      )
    )?.n ?? 0
  );
  /*
    Derived from the VIEW rather than from the rows it returned: "are the
    retired ones in this set" is a question about the query, and answering it by
    looking for one in the results says "none hidden" on a filter that happens
    to be empty.
  */
  const showsRetired =
    list.status === "discontinued" || (list.status === "" && list.retired);
  const hidden = showsRetired ? 0 : retiredCount;

  const pool = await queryOne<PoolStanding>(
    `select retired_at is not null as retired, retirement_note,
            superseded_by
       from ingredient_pool where entity_table = 'menu'`
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

      {/*
        THE POOL'S OWN RETIREMENT, IN ITS OWN WORDS.

        Not a hardcoded sentence: db/045 wrote it into `ingredient_pool` and
        this renders whatever is there. A retired pool that said nothing would
        be rule 16 on the screen the decision is most visible from — the rows
        are gone from the working set and the person standing here would have
        to guess why.
      */}
      {pool?.retired ? (
        <p className={styles.note}>
          <strong>This pool is retired.</strong> {pool.retirement_note}
          {pool.superseded_by ? (
            <>
              {" "}
              The work moved to the <code>{pool.superseded_by}</code> pool.
            </>
          ) : null}{" "}
          Nothing was deleted, and nothing here has to change to bring it back.
        </p>
      ) : null}

      <div className={styles.filters}>
        {FILTERS.map((value) => (
          <Link
            key={value}
            href={
              value === "all"
                ? `/desk/menus${list.retired ? "?retired=show" : ""}`
                : `/desk/menus?status=${value}`
            }
            className={styles.filter}
            aria-current={filter === value}
          >
            {value === "all" ? "All" : MENU_STATUS[value]}
          </Link>
        ))}
        <span className={styles.hint}>
          {rows.length} {rows.length === 1 ? "menu" : "menus"}
          {hidden > 0 ? `. ${hidden} retired, not shown` : ""}
          {hidden === 0 && retiredCount > 0
            ? `, including ${retiredCount} retired`
            : ""}
        </span>
        {retiredCount > 0 ? (
          <Link
            href={list.retired ? "/desk/menus" : "/desk/menus?retired=show"}
            className={styles.filter}
          >
            {list.retired ? "Hide the retired" : "Show the retired"}
          </Link>
        ) : null}
      </div>

      {rows.length > 0 ? <StatusLegend statuses={MENU_STATUS} /> : null}

      {rows.length === 0 ? (
        <Empty>
          {hidden > 0 ? (
            <>
              Nothing in the working set. The {hidden} retired{" "}
              {hidden === 1 ? "one is" : "ones are"} still here, with their
              dishes, their seasons and their reason —{" "}
              <Link href="/desk/menus?retired=show">show them</Link>.
            </>
          ) : (
            <>
              Nothing yet. <code>npm run seed:menus</code> loads the
              thirty-nine from docs/menus.md, verbatim.
            </>
          )}
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
                    list.search,
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
                  {/*
                    THE REASON, ON THE ROW IT IS ABOUT. db/045 requires one
                    whenever a menu is out (menu_discontinued_has_reason), so
                    this is never empty when the row reads Retired — and it is
                    the difference between "this pool closed" and "somebody
                    withdrew THIS one", which are two different facts and would
                    otherwise look identical here.
                  */}
                  {row.retirement_note ? (
                    <div className={styles.fact}>
                      <span className={styles.factLabel}>
                        {row.status === "discontinued" ? "Retired" : "Was out"}
                      </span>
                      <span className={styles.factValue}>
                        {row.retirement_note}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className={styles.actions}>
                <Status code={row.status} label={MENU_STATUS[row.status]} />
                {/*
                  WITHDRAW AND OFFER ONLY. Retiring a menu needs a reason in the
                  same statement (db/045), and a reason is a sentence somebody
                  writes — so it belongs on the form, where there is a field for
                  it, and not on a one-click toggle that has nowhere to put one.
                */}
                {row.status === "discontinued" ? null : (
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
                )}
                <Link
                  href={passHref(
                    `/desk/menus/${row.id}`,
                    list.search,
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
