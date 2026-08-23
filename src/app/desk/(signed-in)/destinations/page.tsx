import Link from "next/link";

import { query } from "@/lib/db";
import { destinationDrift, driftSummary, hasDrift } from "@/lib/desk/drift";
import { WORLD_STATUS, stamp } from "@/lib/desk/labels";
import {
  DESTINATION_FROM,
  DESTINATION_ORDER,
  destinationList,
} from "@/lib/desk/lists";
import {
  RETIRED_SUBTITLE,
  RETIREMENT_COLUMNS,
  RETIREMENT_JOIN,
  retirementRecord,
  type RetirementRow,
} from "@/lib/desk/retirement";
import { passHref } from "@/lib/desk/review";

import styles from "../../desk.module.css";
import { Empty, Head, Status, StatusLegend, TableRow } from "../bits";
import { FoldedInto } from "./Retirement";
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
  // ::int in the query, not just here. count(*) is bigint and node-postgres
  // hands bigint back as a STRING, so an uncast count typed as `number` lies:
  // `drafts > 0` survives on coercion but `drafts === 1` is false for "1", and
  // the plural below silently read "1 drafts" for every destination.
  drafts: number;
  facet_count: number;
  thin: boolean;
  lopsided: boolean;
  narrow: boolean;
  revelles: number;
  // ── the three columns that exist only to be compared with the file ──
  //
  // Fetched here and nowhere sent: src/lib/desk/drift.ts runs on the server,
  // and only its VERDICT reaches the browser. The voice document is the large
  // one and it is still cheap — twelve rows, once, over the database
  // connection — and the alternative, comparing versions instead of words,
  // would miss the case the seed script's own log line describes: the same
  // version number in force while the file was rewritten underneath it.
  description: string | null;
  voice: unknown;
  /** [{ code, weight }], from json_agg. Typed unknown; parsed defensively. */
  tones: unknown;
  /** Tags in dimensions the file does not author. Not drift — see drift.ts. */
  other_tags: number;
};

/**
 * The retirement columns travel on every row, not only the retired ones.
 *
 * db/042 keeps a note and a lineage after a room is brought back — it is a
 * record of what happened, not a description of the current state — so
 * selecting them only `where status = 'retired'` would drop the history of
 * exactly the rooms somebody has acted on most recently.
 */
type LibraryRow = Row & RetirementRow;

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
 *
 * ── WHAT IS IN THE DEFAULT VIEW, AND WHY THE RETIRED ONES ARE NOT ───
 *
 * The library is read as the working set: these are the rooms a Revelle can be
 * issued from. A retired one is kept for its claims and its history — db/028
 * retires Cap Ferrat rather than deleting it so that its voice and its tags
 * stay with it — but it sat in this table looking like a room, and was read as
 * one. The status pill said "Retired" in the sixth column of eight, and the row
 * carried the closed tint, which is `--ink-faint` at nine per cent: a colour
 * chosen to RECEDE, which is right in a pool of six hundred dishes and wrong in
 * a library of thirteen rooms where the retired one is the anomaly.
 *
 * So: out of the default view, one link away, and the number always printed.
 * The set is decided in src/lib/desk/lists.ts and not here, because the review
 * pass has to walk exactly what this screen shows.
 */
export default async function DestinationsPage({
  searchParams,
}: PageProps<"/desk/destinations">) {
  const params = await searchParams;
  const list = destinationList(params);

  const [rows, retired] = await Promise.all([
    query<LibraryRow>(
    `select w.id, w.slug::text as slug, w.name, w.tagline,
            w.status::text as status, w.updated_at,
            v.version as voice_version, v.published_at as voice_published_at,
            (select count(*)::int from world_voice d
              where d.world_id = w.id and d.status = 'draft') as drafts,
            coalesce(c.facet_count, 0) as facet_count,
            coalesce(c.thin, true) as thin,
            coalesce(c.lopsided, false) as lopsided,
            coalesce(c.narrow, true) as narrow,
            (select count(*)::int from revelle r where r.world_id = w.id) as revelles,
            w.description, v.voice,
            (select coalesce(
                      json_agg(json_build_object(
                        'code', f.code::text, 'weight', wf.weight::text)),
                      '[]'::json)
               from world_facet wf
               join facet f on f.id = wf.facet_id
              where wf.world_id = w.id
                and f.dimension_code = 'voice_tone') as tones,
            (select count(*)::int
               from world_facet wf
               join facet f on f.id = wf.facet_id
              where wf.world_id = w.id
                and f.dimension_code <> 'voice_tone') as other_tags,
            ${RETIREMENT_COLUMNS}
       from ${DESTINATION_FROM}
       ${RETIREMENT_JOIN}
       left join world_voice v on v.world_id = w.id and v.status = 'published'
       left join destination_facet_coverage c on c.id = w.id
       ${list.where}
      order by ${DESTINATION_ORDER}`
    ),
    // Counted whether or not any are shown. A list that is quietly shorter than
    // the truth is the one failure a hidden row can cause, and the number is
    // what stops it: see the head of src/lib/desk/lists.ts.
    query<{ retired: number }>(
      `select count(*)::int as retired from world where status = 'retired'`
    ),
  ]);

  const retiredCount = retired[0]?.retired ?? 0;
  const hidden = list.retired ? 0 : retiredCount;

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

      {/*
        THE FILE COLUMN. Its argument is in src/lib/desk/drift.ts and the short
        version is on every destination's own page; what belongs here is only
        the sentence that stops the column being read as an error list.
      */}
      <p className={styles.note}>
        <strong>Against the file</strong> compares each row with{" "}
        <code>src/lib/destinations.ts</code>, which is what a fresh database is
        seeded from and never what a live one is overwritten with. A difference
        is not a fault — the database is what ships and the file is what seeds
        — but a difference left alone means a rebuild would quietly revert
        whatever was decided here. Open a destination to see both sides.
      </p>

      {/*
        THE RETIRED ONES, COUNTED WHETHER OR NOT THEY ARE SHOWN.

        The filter-row idiom every other pool screen uses, with the number in
        it. A retired room is kept on purpose and has to stay reachable — its
        voice and its tags are still its own — but it is not part of the working
        set and it was being read as one. What is never acceptable is a shorter
        list that does not say it is shorter, so the count is printed in both
        states and the control names what it will do.
      */}
      <div className={styles.filters}>
        <span className={styles.hint}>
          {rows.length} {rows.length === 1 ? "destination" : "destinations"}
          {list.retired
            ? retiredCount > 0
              ? `, including ${retiredCount} retired`
              : ""
            : hidden > 0
              ? `. ${hidden} retired, not shown`
              : ""}
        </span>
        {retiredCount > 0 ? (
          <Link
            href={list.retired ? "/desk/destinations" : "/desk/destinations?retired=show"}
            className={styles.filter}
          >
            {list.retired ? "Hide the retired" : "Show the retired"}
          </Link>
        ) : null}
      </div>

      {rows.length > 0 ? <StatusLegend statuses={WORLD_STATUS} /> : null}

      {rows.length === 0 ? (
        <Empty>
          {hidden > 0 ? (
            <>
              Nothing in the working set. The {hidden} retired{" "}
              {hidden === 1 ? "one is" : "ones are"} still here —{" "}
              <Link href="/desk/destinations?retired=show">show them</Link>.
            </>
          ) : (
            <>
              Nothing yet. <code>npm run seed:destinations</code> moves the
              hand-authored ones out of src/lib/destinations.ts, or start one
              here.
            </>
          )}
        </Empty>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Destination</th>
              <th>Voice</th>
              <th>Described</th>
              <th>Issued</th>
              <th>Against the file</th>
              <th>Status</th>
              <th>Changed</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, seat) => {
              // WHERE THIS ROW SITS, carried into every link out of it, so
              // that opening one starts a review rather than a detour. What
              // travels beside it is the view she is looking at — with or
              // without the retired ones — so Next walks THIS list and not a
              // fresh default. See the head of src/lib/desk/review.ts.
              const at = seat + 1;
              // Null for every live room that has never been retired, which is
              // almost all of them; see src/lib/desk/retirement.ts.
              const retirement = retirementRecord(row);
              const drift = destinationDrift({
                slug: row.slug,
                name: row.name,
                tagline: row.tagline,
                description: row.description,
                // `voice` is null when nothing is published, which is
                // look-only and not a difference; drift.ts keeps that apart
                // from "not fetched".
                voice: row.voice,
                tones: row.tones,
                unauthoredTags: row.other_tags,
              });
              return (
              <TableRow key={row.id} status={row.status}>
                <td>
                  <Link
                    href={passHref(`/desk/destinations/${row.id}`, list.search, at)}
                    className={styles.whoEmail}
                  >
                    {row.name}
                  </Link>
                  {/*
                    SAID AT THE NAME. The Status column already carries the
                    word, six columns to the right, and the row carries the
                    closed tint — which is the faintest colour in the palette
                    and is meant to recede. Neither reached the reader. A room
                    nobody can be sent to says so beside its own name.
                  */}
                  {row.status === "retired" ? (
                    <Status code={row.status} label="Retired" />
                  ) : null}
                  <div className={styles.when}>
                    {row.status === "retired" ? RETIRED_SUBTITLE : row.tagline}
                  </div>
                  {/*
                    WHERE IT WENT — the question the pill and the subtitle
                    above cannot answer, and the one db/028 left unanswerable
                    for a year. One line, in the subtitle voice this cell
                    already speaks in. Null for a room with no record, which
                    is most of them.
                  */}
                  {retirement ? <FoldedInto record={retirement} /> : null}
                </td>
                <td>
                  {row.voice_version ? (
                    <Link
                      href={passHref(
                        `/desk/destinations/${row.id}/voice`,
                        list.search,
                        at
                      )}
                      className={styles.link}
                    >
                      v{row.voice_version}
                    </Link>
                  ) : (
                    <Link
                      href={passHref(
                        `/desk/destinations/${row.id}/voice`,
                        list.search,
                        at
                      )}
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
                  {!drift.authored ? (
                    <span className={styles.when}>not in the file</span>
                  ) : hasDrift(drift) ? (
                    <Link
                      href={passHref(
                        `/desk/destinations/${row.id}`,
                        list.search,
                        at,
                        "#file"
                      )}
                      className={styles.link}
                    >
                      {driftSummary(drift).join(" · ")}
                    </Link>
                  ) : (
                    <span className={styles.when}>
                      matches{drift.voiceCompared ? "" : " — no voice yet"}
                    </span>
                  )}
                </td>
                <td>
                  <Status code={row.status} label={WORLD_STATUS[row.status]} />
                </td>
                <td className={styles.numeric}>{stamp(row.updated_at)}</td>
                <td>
                  {/*
                    A RETIRED ROOM IS NOT A DRAFT. Both were offered the same
                    "Publish" button, which is how a room that was folded into
                    another gets served to somebody by one wrong click. Bringing
                    it back is a decision of its own and it lands in draft,
                    where a voice and a look can be looked at before anybody is
                    sent there. db/019 would refuse the direct jump anyway.
                  */}
                  <form action={setDestinationStatus}>
                    <input type="hidden" name="id" value={row.id} />
                    <input
                      type="hidden"
                      name="status"
                      value={
                        row.status === "published" || row.status === "retired"
                          ? "draft"
                          : "published"
                      }
                    />
                    <button className={styles.filter}>
                      {row.status === "published"
                        ? "Unpublish"
                        : row.status === "retired"
                          ? "Bring back as a draft"
                          : "Publish"}
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
