import Link from "next/link";

import { query } from "@/lib/db";
import {
  COURSES,
  DISH_LEVELS,
  MEAL_SHAPES,
  POOL_STATUS,
  SEASONS,
} from "@/lib/desk/labels";

import {
  DISH_FROM,
  DISH_ORDER,
  DISH_PER_PAGE,
  POOL_STATUSES,
  dishList,
} from "@/lib/desk/lists";
import { one, passHref } from "@/lib/desk/review";

import styles from "../../desk.module.css";
import { Chips, Empty, Head, Status, StatusLegend, TableRow } from "../bits";
import { setDishStatus } from "./actions";

/**
 * The dish pool, six hundred rows deep.
 *
 * ── WHY THIS SCREEN IS NOT /desk/menus ──────────────────────────────
 *
 * The menus screen is a plain list of thirty-six cards with a status filter,
 * and it is right for thirty-six. At six hundred it is a wall: nothing can be
 * found, nothing can be compared, and the one question a curator actually asks
 * here — "what do I have at Havana, for a host who wants to cook nothing" —
 * cannot be asked at all.
 *
 * So the same visual language, the denser instrument. A filter bar over the
 * five axes the pool is described on (destination, course, how much making,
 * season, and what the table is for) plus a name search and the status filter
 * every pool screen has, and a table rather than cards because six hundred
 * cards is not a list, it is a scroll.
 *
 * EVERY CONTROL IS A GET PARAMETER, which is the reason this is a server
 * component with a plain `<form method="get">` and no client JavaScript at all.
 * A filtered view is then a URL: a curator can send "the Dolomites mains that
 * arrive finished" to somebody, and it is the same nine words as the sentence.
 *
 * ── AND IT IS PAGED, WHICH IS A CLAIM ABOUT THE POOL ────────────────
 *
 * A hundred rows a page. Six hundred rows in one document is technically
 * possible and is how a screen stops being read — and unlike the menus, this
 * pool is expected to keep growing: fifty dishes arrive with every new
 * destination. The count line always states the whole truth ("101–200 of 600")
 * so that the page never lies about how much is behind it.
 */

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  slug: string;
  name: string;
  course: string;
  making: string;
  season: string;
  season_note: string;
  season_strict: boolean;
  status: string;
  world_slugs: string[];
  tags: string[];
  meals: string[];
};

/**
 * THE FILTERS ARE NOT DECIDED HERE. src/lib/desk/lists.ts holds them, together
 * with this table's FROM and ORDER BY, so that a review pass over this screen
 * walks the sequence this screen is showing.
 */

const label = (
  list: readonly { code: string; label: string }[],
  code: string
) => list.find((entry) => entry.code === code)?.label ?? code;

export default async function DishesPage({
  searchParams,
}: PageProps<"/desk/dishes">) {
  const params = await searchParams;

  const destinations = await query<{ slug: string; name: string }>(
    `select slug::text as slug, name from world
      where status <> 'retired' order by name`
  );

  // Resolved once, in src/lib/desk/lists.ts. Every argument for what each
  // control means travelled there with the code.
  const list = dishList(params, {
    destinations: destinations.map((row) => row.slug),
  });
  const q = list.value.q;
  const destination = list.value.destination;
  const course = list.value.course;
  const making = list.value.making;
  const season = list.value.season;
  const meal = list.value.meal;
  const status = list.value.status;
  const page = Math.max(1, Number(one(params.page)) || 1);

  const values = [...list.binds];

  const filter = list.where;

  const [{ total, everything }] = await query<{
    total: string;
    everything: string;
  }>(
    `select (select count(*) from ${DISH_FROM} ${filter}) as total,
            (select count(*) from dish_card) as everything`,
    values
  );

  const matched = Number(total);
  const pages = Math.max(1, Math.ceil(matched / DISH_PER_PAGE));
  const current = Math.min(page, pages);
  const offset = (current - 1) * DISH_PER_PAGE;

  const rows = await query<Row>(
    // Qualified on `d`, because both views carry an `id` and Postgres is right
    // to refuse the ambiguity rather than pick one.
    `select d.id, d.slug::text as slug, d.name, d.course::text as course,
            d.making::text as making, d.season::text as season, d.season_note,
            d.season_strict, d.status::text as status, d.world_slugs, d.tags,
            m.meals
       from ${DISH_FROM}
       ${filter}
      order by ${DISH_ORDER}
      limit ${DISH_PER_PAGE} offset ${offset}`,
    values
  );

  /** This view's URL with one thing changed. Paging must not drop the filters. */
  const href = (changes: Record<string, string>) => {
    const next = new URLSearchParams();
    const base: Record<string, string> = {
      q,
      destination,
      course,
      making,
      season,
      meal,
      status,
      page: String(current),
    };
    for (const [key, value] of Object.entries({ ...base, ...changes })) {
      if (!value) continue;
      // Page one is the URL without a page, so that "the Havana desserts" has
      // one address rather than two that render the same thing.
      if (key === "page" && value === "1") continue;
      next.set(key, value);
    }
    const search = next.toString();
    return search ? `/desk/dishes?${search}` : "/desk/dishes";
  };

  const filtered = list.filtered;
  const first = matched === 0 ? 0 : offset + 1;
  const last = Math.min(offset + DISH_PER_PAGE, matched);

  return (
    <>
      <Head eyebrow="The table" title="Dishes">
        <Link href="/desk/dishes/new" className={styles.button}>
          Add a dish
        </Link>
      </Head>

      <p className={styles.note}>
        The interchangeable half of the table — one line each, never a recipe.
        Six hundred dishes from six hundred and fifty authored lines: a dish
        written under four destinations is one dish that four houses serve, and
        it is offered at those four and nowhere else. This is what the engine
        sets a table from: three courses, one destination, one season, one
        amount of making. The authored menus are the exemplars beside it.
      </p>

      <form method="get" action="/desk/dishes" className={styles.buttonRow}>
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search the name"
          aria-label="Search the name"
          className={styles.input}
        />
        <select
          name="destination"
          defaultValue={destination}
          aria-label="Destination"
          className={styles.select}
        >
          <option value="">Every destination</option>
          {destinations.map((row) => (
            <option key={row.slug} value={row.slug}>
              {row.name}
            </option>
          ))}
        </select>
        <select
          name="course"
          defaultValue={course}
          aria-label="Course"
          className={styles.select}
        >
          <option value="">Every course</option>
          {COURSES.map((entry) => (
            <option key={entry.code} value={entry.code}>
              {entry.label}
            </option>
          ))}
        </select>
        <select
          name="making"
          defaultValue={making}
          aria-label="How much making"
          className={styles.select}
        >
          <option value="">Any amount of making</option>
          {DISH_LEVELS.map((entry) => (
            <option key={entry.code} value={entry.code}>
              {entry.label}
            </option>
          ))}
        </select>
        <select
          name="season"
          defaultValue={season}
          aria-label="Season"
          className={styles.select}
        >
          <option value="">Any season</option>
          {SEASONS.map((entry) => (
            <option key={entry.code} value={entry.code}>
              {entry.label}
            </option>
          ))}
        </select>
        <select
          name="meal"
          defaultValue={meal}
          aria-label="What it is for"
          className={styles.select}
        >
          <option value="">Any kind of table</option>
          {MEAL_SHAPES.map((entry) => (
            <option key={entry.code} value={entry.code}>
              {entry.label}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={status}
          aria-label="Status"
          className={styles.select}
        >
          <option value="">Any status</option>
          {POOL_STATUSES.map((code) => (
            <option key={code} value={code}>
              {POOL_STATUS[code]}
            </option>
          ))}
        </select>
        <button className={styles.button}>Filter</button>
        {filtered ? (
          <Link href="/desk/dishes" className={styles.filter}>
            Clear
          </Link>
        ) : null}
      </form>

      <div className={styles.filters}>
        <span className={styles.hint}>
          {matched === 0
            ? filtered
              ? `Nothing matches, out of ${everything}`
              : "Nothing yet"
            : `${first}–${last} of ${matched}${
                filtered ? ` matched, out of ${everything}` : ""
              }`}
        </span>
        {pages > 1 ? (
          <>
            {/*
              A boundary is a SPAN and not a disabled link. `aria-disabled` on
              an anchor is a lie a screen reader repeats: the link still
              navigates. There is nowhere to go, so there is no link.
            */}
            {current > 1 ? (
              <Link href={href({ page: String(current - 1) })} className={styles.filter}>
                Previous
              </Link>
            ) : null}
            <span className={styles.hint}>
              Page {current} of {pages}
            </span>
            {current < pages ? (
              <Link href={href({ page: String(current + 1) })} className={styles.filter}>
                Next
              </Link>
            ) : null}
          </>
        ) : null}
      </div>

      {rows.length > 0 ? <StatusLegend statuses={POOL_STATUS} /> : null}

      {rows.length === 0 ? (
        <Empty>
          {filtered ? (
            <>
              Nothing matches those filters. <Link href="/desk/dishes">Clear
              them</Link> to see the whole pool.
            </>
          ) : (
            <>
              Nothing yet. <code>npm run seed:dishes</code> loads the six
              hundred from docs/dishes.md, deduped across destinations.
            </>
          )}
        </Empty>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Dish</th>
              <th>Course</th>
              <th>How much making</th>
              <th>Season</th>
              <th>What it is for</th>
              <th>Written for</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, seat) => (
              <TableRow key={row.id} status={row.status}>
                <td>
                  {/*
                    Into the review, carrying this view's filters and the place
                    this row holds in the whole filtered set — not in this page,
                    because a pass runs across pages.
                  */}
                  <Link
                    href={passHref(
                      `/desk/dishes/${row.id}`,
                      list.search,
                      offset + seat + 1
                    )}
                    className={styles.whoEmail}
                  >
                    {row.name}
                  </Link>
                  {row.tags.length > 0 ? <Chips items={row.tags} /> : null}
                </td>
                <td className={styles.numeric}>{label(COURSES, row.course)}</td>
                <td className={styles.numeric}>
                  {label(DISH_LEVELS, row.making)}
                </td>
                <td className={styles.numeric}>
                  {row.season === "year_round" && !row.season_note
                    ? "—"
                    : row.season_note || label(SEASONS, row.season)}
                  {row.season_strict ? " · hard" : ""}
                </td>
                <td className={styles.numeric}>
                  {row.meals.length === 0
                    ? "anywhere"
                    : row.meals
                        .map(
                          (code) =>
                            MEAL_SHAPES.find((entry) => entry.code === code)
                              ?.letter ?? code
                        )
                        .join(", ")}
                </td>
                <td>
                  <Chips items={row.world_slugs} />
                </td>
                <td>
                  <Status code={row.status} label={POOL_STATUS[row.status]} />
                </td>
                <td>
                  <form action={setDishStatus}>
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
                </td>
              </TableRow>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
