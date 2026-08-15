import Link from "next/link";

import { query } from "@/lib/db";
import { WORLD_STATUS, stamp } from "@/lib/desk/labels";

import styles from "../../desk.module.css";
import { Empty, Head, Status } from "../bits";
import { setDestinationStatus } from "./actions";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  status: string;
  updated_at: string;
  voice_version: number | null;
  voice_published_at: string | null;
  drafts: number;
  facet_count: number;
  thin: boolean;
  lopsided: boolean;
  narrow: boolean;
  revelles: number;
};

/**
 * The library.
 *
 * The three coverage flags are `destination_facet_coverage` (db/009), shown
 * here rather than left to `npm run check:coverage` because they are the thing
 * that decides whether a destination can ever be matched to anybody:
 *
 *   thin      fewer than six terms. Not a description, a label.
 *   lopsided  one facet holds more than half the weight — it will win for the
 *             women who tapped that one thing and be invisible to everyone else.
 *   narrow    everything on one axis, so half her answers fall through it.
 */
export default async function DestinationsPage() {
  const rows = await query<Row>(
    `select w.id, w.slug::text as slug, w.name, w.tagline,
            w.status::text as status, w.updated_at,
            v.version as voice_version, v.published_at as voice_published_at,
            (select count(*) from world_voice d
              where d.world_id = w.id and d.status = 'draft') as drafts,
            coalesce(c.facet_count, 0) as facet_count,
            coalesce(c.thin, true) as thin,
            coalesce(c.lopsided, false) as lopsided,
            coalesce(c.narrow, true) as narrow,
            (select count(*) from revelle r where r.world_id = w.id) as revelles
       from world w
       left join world_voice v on v.world_id = w.id and v.status = 'published'
       left join destination_facet_coverage c on c.id = w.id
      order by w.status, w.name`
  );

  return (
    <>
      <Head eyebrow="The library" title="Destinations">
        <Link href="/desk/destinations/new" className={styles.button}>
          New destination
        </Link>
      </Head>

      <p className={styles.note}>
        A destination is a look and a voice. The look is edited in place; the
        voice is versioned, and a version a Revelle was issued under can never
        be changed.
      </p>

      {rows.length === 0 ? (
        <Empty>
          Nothing yet. <code>npm run seed:destinations</code> moves the
          hand-authored ones out of src/lib/destinations.ts, or start one here.
        </Empty>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Destination</th>
              <th>Voice</th>
              <th>Described</th>
              <th>Issued</th>
              <th>Status</th>
              <th>Changed</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <Link
                    href={`/desk/destinations/${row.id}`}
                    className={styles.whoEmail}
                  >
                    {row.name}
                  </Link>
                  <div className={styles.when}>{row.tagline}</div>
                </td>
                <td>
                  {row.voice_version ? (
                    <Link
                      href={`/desk/destinations/${row.id}/voice`}
                      className={styles.link}
                    >
                      v{row.voice_version}
                    </Link>
                  ) : (
                    <Link
                      href={`/desk/destinations/${row.id}/voice`}
                      className={styles.link}
                    >
                      none — look only
                    </Link>
                  )}
                  {row.drafts > 0 ? (
                    <div className={styles.when}>
                      {row.drafts} draft{row.drafts === 1 ? "" : "s"} open
                    </div>
                  ) : null}
                </td>
                <td>
                  <span className={styles.numeric}>{row.facet_count} terms</span>
                  <div className={styles.when}>
                    {[
                      row.thin ? "thin" : null,
                      row.lopsided ? "lopsided" : null,
                      row.narrow ? "narrow" : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "reads across the vocabulary"}
                  </div>
                </td>
                <td className={styles.numeric}>{row.revelles}</td>
                <td>
                  <Status code={row.status} label={WORLD_STATUS[row.status]} />
                </td>
                <td className={styles.numeric}>{stamp(row.updated_at)}</td>
                <td>
                  <form action={setDestinationStatus}>
                    <input type="hidden" name="id" value={row.id} />
                    <input
                      type="hidden"
                      name="status"
                      value={row.status === "published" ? "draft" : "published"}
                    />
                    <button className={styles.filter}>
                      {row.status === "published" ? "Unpublish" : "Publish"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
