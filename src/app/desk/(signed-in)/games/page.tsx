import Link from "next/link";

import { query } from "@/lib/db";
import {
  GAME_SHAPES,
  POOL_STATUS,
  guests,
  minutes,
  stamp,
} from "@/lib/desk/labels";

import styles from "../../desk.module.css";
import { Chips, Empty, Head, Status, StatusLegend, TableRow } from "../bits";
import { setGameStatus } from "./actions";

/**
 * THE FUN.
 *
 * A small pool and a plain list, for the reason /desk/menus is a plain list at
 * thirty-six and /desk/dishes is an instrument at six hundred: the shape of the
 * screen should follow the size of the thing. Seven games, a status filter, and
 * the columns a curator scans down.
 *
 * ── THE TWO COLUMNS THAT ARE NOT FIELDS ─────────────────────────────
 *
 * `Runbook` and the marks under it are db/025's two views, shown here rather
 * than left to somebody running a query, because they are the difference
 * between a game that reads well and a game a host can actually run:
 *
 *   game_runbook_clock  what the steps ADD UP TO against what the duration
 *                       CLAIMS. `disagrees` is the sentence a host would
 *                       otherwise discover at eleven o'clock. Not enforced by
 *                       the database on purpose — it is a judgement, and this
 *                       is the screen where the judgement is made.
 *   game_runbook_gap    one row per UNIVERSAL kind of trouble a game with a
 *                       runbook does not answer. Empty is the goal.
 *
 * A game with no runbook at all shows neither mark, which is honest: nothing
 * disagrees with nothing.
 */

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  slug: string;
  name: string;
  shape: string;
  sourcing: string;
  external_name: string | null;
  external_url: string | null;
  duration_minutes: number | null;
  duration_max_minutes: number | null;
  min_guests: number | null;
  max_guests: number | null;
  status: string;
  updated_at: string;
  /** count(*) arrives as a string from pg. Never compared without Number(). */
  steps: string;
  planned_minutes: string;
  disagrees: boolean | null;
  lead_time_days: number | null;
  unanswered: string;
  tags: string[];
};

const FILTERS = ["all", "draft", "active", "discontinued"];

const shapeLabel = (code: string) =>
  GAME_SHAPES.find((entry) => entry.code === code)?.label ?? code;

export default async function GamesPage({
  searchParams,
}: PageProps<"/desk/games">) {
  const params = await searchParams;
  const filter =
    typeof params.status === "string" && FILTERS.includes(params.status)
      ? params.status
      : "all";

  const rows = await query<Row>(
    `select g.id, g.slug::text as slug, g.name,
            g.shape::text as shape, g.sourcing::text as sourcing,
            g.external_name, g.external_url,
            g.duration_minutes, g.duration_max_minutes,
            g.min_guests, g.max_guests,
            g.status::text as status, g.updated_at,
            coalesce(c.steps, 0) as steps,
            coalesce(c.planned_minutes, 0) as planned_minutes,
            c.disagrees,
            l.lead_time_days,
            (select count(*) from game_runbook_gap gg
              where gg.game_id = g.id) as unanswered,
            coalesce(
              (select array_agg(f.label order by f.label)
                 from game_facet gf join facet f on f.id = gf.facet_id
                where gf.game_id = g.id),
              '{}') as tags
       from game g
       left join game_runbook_clock c on c.game_id = g.id
       left join game_lead_time l on l.game_id = g.id
      ${filter === "all" ? "" : "where g.status = $1::product_status"}
      order by g.name`,
    filter === "all" ? [] : [filter]
  );

  return (
    <>
      <Head eyebrow="The fun" title="Games">
        <Link href="/desk/games/new" className={styles.button}>
          Add a game
        </Link>
      </Head>

      <p className={styles.note}>
        The house&rsquo;s own, and the reason this pool is worth having: a game
        nobody else can send is a thing Revelle has and a Pinterest board does
        not. They are authored in <code>src/lib/games.ts</code>, where a
        reworded rule is a diff a human can read in a pull request, and seeded
        from there. An edit made here outranks the file and is never overwritten
        by a later seed.
      </p>

      <div className={styles.filters}>
        {FILTERS.map((value) => (
          <Link
            key={value}
            href={value === "all" ? "/desk/games" : `/desk/games?status=${value}`}
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
          {filter === "all" ? (
            <>
              Nothing yet. <code>npm run seed:games</code> moves the authored
              ones out of src/lib/games.ts, as drafts, or start one here.
            </>
          ) : (
            <>
              Nothing at that status.{" "}
              <Link href="/desk/games">See them all</Link>.
            </>
          )}
        </Empty>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Game</th>
              <th>Kind</th>
              <th>How long</th>
              <th>Guests</th>
              <th>Runbook</th>
              <th>Tagged</th>
              <th>Status</th>
              <th>Changed</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const steps = Number(row.steps);
              const unanswered = Number(row.unanswered);
              return (
                <TableRow key={row.id} status={row.status}>
                  <td>
                    <Link href={`/desk/games/${row.id}`} className={styles.whoEmail}>
                      {row.name}
                    </Link>
                    <div className={styles.when}>
                      {row.slug}
                      {row.lead_time_days ? ` · ${row.lead_time_days}d lead` : ""}
                    </div>
                  </td>
                  <td>
                    {shapeLabel(row.shape)}
                    {row.sourcing === "recommended" ? (
                      <div className={styles.when}>
                        {row.external_url ? (
                          <a
                            href={row.external_url}
                            target="_blank"
                            rel="noreferrer"
                            className={styles.link}
                          >
                            {row.external_name ?? "theirs"}
                          </a>
                        ) : (
                          (row.external_name ?? "theirs")
                        )}
                      </div>
                    ) : null}
                  </td>
                  <td className={styles.numeric}>
                    {minutes(row.duration_minutes, row.duration_max_minutes)}
                  </td>
                  <td className={styles.numeric}>
                    {guests(row.min_guests, row.max_guests)}
                  </td>
                  <td className={styles.numeric}>
                    {steps === 0 ? "none" : `${steps} steps`}
                    {steps > 0 ? (
                      <div className={styles.when}>
                        {[
                          row.disagrees
                            ? `steps say ${row.planned_minutes}`
                            : null,
                          unanswered > 0 ? `${unanswered} unanswered` : null,
                        ]
                          .filter(Boolean)
                          .join(" · ") || "agrees, and answers everything"}
                      </div>
                    ) : null}
                  </td>
                  <td>
                    <Chips items={row.tags} />
                  </td>
                  <td>
                    <Status code={row.status} label={POOL_STATUS[row.status]} />
                  </td>
                  <td className={styles.numeric}>{stamp(row.updated_at)}</td>
                  <td>
                    <form action={setGameStatus}>
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
              );
            })}
          </tbody>
        </table>
      )}
    </>
  );
}
