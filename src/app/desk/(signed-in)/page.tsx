import Link from "next/link";

import { query } from "@/lib/db";
import {
  APPLICATION_STATUS,
  dollars,
  optionLabel,
  optionLabels,
  stamp,
  toneLabel,
} from "@/lib/desk/labels";

import styles from "../desk.module.css";
import { Chips, Empty, Fact, Head, Status } from "./bits";
import { setApplicationStatus } from "./applications/actions";

/**
 * THE INBOX.
 *
 * ── WHAT THE DESK IS FOR, WHICH CHANGED ─────────────────────────────
 *
 *   DECIDING WHAT THE HOUSE MAY OFFER REMAINS OURS.
 *   DECIDING WHAT ONE MEMBER GETS IS NOW HERS.
 *
 * The human left the PER-MEMBER loop, not the CATALOGUE GATE. That is the whole
 * change and it is a better product than the one with a curator in it.
 *
 * So the seeders-create-drafts rule stands untouched — "deciding that something
 * is offered to a customer is a curator's decision and not a script's" — and
 * `npm run activate:catalogue -- --yes` is still the one place that yes gets
 * said. Nothing about removing the curator from selection weakens the gate on
 * what may reach a member at all.
 *
 * What it DOES remove is approval of an individual Revelle. The engine ranks,
 * the member is shown two or three, she taps one, and her pick is the record.
 * This screen is therefore an OBSERVATION surface and a spot-check window, not
 * a queue anybody has to clear: what came in, what the engine proposed, what
 * she picked, and how far apart those last two were. That divergence is the
 * calibration data the seam exists to collect (see THE SEAM in
 * src/lib/destinations.ts) and this is where it is read.
 *
 * The approve and reject affordances below are from the previous design and are
 * due for removal rather than repair.
 *
 * ── THE ORIGINAL REASON IT EXISTS, WHICH STILL HOLDS ─────────────────
 *
 * The most valuable screen in the tool: applications arrive, nobody is told,
 * and until this existed nowhere showed them.
 *
 * ── WHAT IS ON A ROW, AND WHY ───────────────────────────────────────
 *
 * Enough to triage without opening anything. Two people should be able to look
 * at this list and know which application to work on next, which means the
 * scale of the thing (how many, what a head, what the ceiling is), when it is,
 * what it is for, and — the part that actually decides it — HER OWN WORDS.
 *
 * The free text is set larger than everything around it, quoted, and never
 * truncated. docs/build-checklist.md calls the one free-text question "the one
 * that makes it yours"; a tool that renders it as a grey 12px cell in a table
 * has thrown away the most valuable thing the application collects. Everything
 * else on the row is a label and a value at 11px because everything else is a
 * fact you scan.
 *
 * Newest first, always. A queue ordered any other way is a queue where the
 * thing that came in this morning is somewhere in the middle.
 */

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  created_at: string;
  status: string;
  occasion: string;
  occasion_other: string | null;
  environment: string;
  taste_directions: string[];
  group_fun: string[];
  anti_preferences: string[];
  affinities: string[];
  voice_tones: string[];
  secret: string | null;
  guest_count_band: string | null;
  spend_per_person: string | null;
  music_service: string | null;
  event_date: string | null;
  guest_count_confirmed: number | null;
  email: string;
  name: string | null;
  guests_low: number | null;
  guests_high: number | null;
  budget_planning: string | null;
  budget_ceiling: string | null;
  revelle_status: string | null;
  notes: number;
};

const FILTERS: readonly { value: string; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "new", label: "New" },
  { value: "in_progress", label: "In progress" },
  { value: "delivered", label: "Delivered" },
  { value: "archived", label: "Archived" },
  { value: "all", label: "All" },
];

export default async function Inbox({ searchParams }: PageProps<"/desk">) {
  const params = await searchParams;
  const filter =
    typeof params.status === "string" && FILTERS.some((f) => f.value === params.status)
      ? params.status
      : "open";

  // 'open' is the default and is not a status: it is "anything still to do",
  // which is what somebody sitting down at this screen actually wants.
  const where =
    filter === "all"
      ? ""
      : filter === "open"
        ? `where qr.status in ('new', 'in_progress')`
        : `where qr.status = $1::quiz_status`;
  const args = filter === "all" || filter === "open" ? [] : [filter];

  const rows = await query<Row>(
    `select qr.id,
            qr.created_at,
            qr.status::text            as status,
            qr.occasion::text          as occasion,
            qr.occasion_other,
            qr.environment::text       as environment,
            qr.taste_directions,
            qr.group_fun,
            qr.anti_preferences,
            qr.affinities,
            qr.voice_tones,
            qr.secret,
            qr.guest_count_band::text  as guest_count_band,
            qr.spend_per_person::text  as spend_per_person,
            qr.music_service::text     as music_service,
            qr.event_date,
            qr.guest_count_confirmed,
            c.email::text              as email,
            c.name,
            s.guests_low,
            s.guests_high,
            s.budget_planning::text    as budget_planning,
            s.budget_ceiling::text     as budget_ceiling,
            r.status::text             as revelle_status,
            (select count(*) from desk_message m
              where m.subject_table = 'quiz_response' and m.subject_id = qr.id)
                                       as notes
       from quiz_response qr
       join customer c on c.id = qr.customer_id
       left join quiz_response_scale s on s.quiz_response_id = qr.id
       left join revelle r on r.quiz_response_id = qr.id
       ${where}
      order by qr.created_at desc
      limit 200`,
    args
  );

  return (
    <>
      <Head eyebrow="Applications" title="The inbox" />

      <div className={styles.filters}>
        {FILTERS.map((option) => (
          <Link
            key={option.value}
            href={option.value === "open" ? "/desk" : `/desk?status=${option.value}`}
            className={styles.filter}
            aria-current={filter === option.value}
          >
            {option.label}
          </Link>
        ))}
        <span className={styles.hint}>
          {rows.length} shown, newest first
        </span>
      </div>

      {rows.length === 0 ? (
        <Empty>
          Nothing here. When someone applies, her answers land at the top of
          this list.
        </Empty>
      ) : (
        <ul className={styles.rows}>
          {rows.map((row) => (
            <li
              key={row.id}
              className={`${styles.row} ${row.status === "new" ? styles.rowNew : ""}`}
            >
              <div className={styles.who}>
                <Link href={`/desk/applications/${row.id}`} className={styles.whoEmail}>
                  {row.email}
                </Link>
                {row.name ? <div>{row.name}</div> : null}
                <span className={styles.when}>{stamp(row.created_at)}</span>
                {/*
                  count(*) comes back from pg as a STRING, because a bigint
                  does not fit a JS number safely. Coerce before comparing, or
                  every row reads "1 notes".
                */}
                {Number(row.notes) > 0 ? (
                  <span className={styles.when}>
                    {Number(row.notes)} note{Number(row.notes) === 1 ? "" : "s"}{" "}
                    on the desk
                  </span>
                ) : null}
              </div>

              <div>
                {/*
                  A fixed eight-column grid, not a flow: reading DOWN the
                  ceilings of six applications is the question this list is for.
                */}
                <div className={styles.scale}>
                  <Fact label="Occasion">
                    {row.occasion === "other" && row.occasion_other
                      ? row.occasion_other
                      : optionLabel("occasion", row.occasion)}
                  </Fact>
                  <Fact label="Where">
                    {optionLabel("environment", row.environment)}
                  </Fact>
                  <Fact label="Guests">
                    {optionLabel("guest_count_band", row.guest_count_band)}
                    {row.guest_count_confirmed
                      ? ` · ${row.guest_count_confirmed} confirmed`
                      : ""}
                  </Fact>
                  <Fact label="A head">
                    {optionLabel("spend_per_person", row.spend_per_person)}
                  </Fact>
                  <Fact label="Plan to">{dollars(row.budget_planning)}</Fact>
                  <Fact label="Ceiling">
                    {row.budget_ceiling === null ? (
                      <em>open — ask her</em>
                    ) : (
                      dollars(row.budget_ceiling)
                    )}
                  </Fact>
                  <Fact label="Date">
                    {row.event_date ? (
                      new Date(row.event_date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    ) : (
                      <em>not given</em>
                    )}
                  </Fact>
                  <Fact label="Music">
                    {optionLabel("music_service", row.music_service)}
                  </Fact>
                </div>

                <div className={styles.facts} style={{ marginTop: "0.375rem" }}>
                  <Fact label="Direction">
                    <Chips items={optionLabels("taste_directions", row.taste_directions)} />
                  </Fact>
                  <Fact label="How they have fun">
                    <Chips items={optionLabels("group_fun", row.group_fun)} />
                  </Fact>
                  <Fact label="Would ruin it">
                    <Chips
                      items={optionLabels("anti_preferences", row.anti_preferences)}
                      tone="no"
                    />
                  </Fact>
                  <Fact label="More of">
                    <Chips items={optionLabels("affinities", row.affinities)} />
                  </Fact>
                  <Fact label="How they talk">
                    <Chips items={row.voice_tones.map(toneLabel)} />
                  </Fact>
                </div>
              </div>

              <div className={styles.actions}>
                <Status code={row.status} label={APPLICATION_STATUS[row.status]} />
                {row.revelle_status ? (
                  <span className={styles.when}>
                    Revelle: {row.revelle_status}
                  </span>
                ) : null}
                <form action={setApplicationStatus}>
                  <input type="hidden" name="id" value={row.id} />
                  <select
                    name="status"
                    defaultValue={row.status}
                    className={styles.select}
                    aria-label="Status"
                  >
                    {Object.entries(APPLICATION_STATUS).map(([code, label]) => (
                      <option key={code} value={code}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <button className={styles.filter} type="submit">
                    Set
                  </button>
                </form>
                <Link href={`/desk/applications/${row.id}`} className={styles.filter}>
                  Open
                </Link>
              </div>

              {/*
                HER OWN WORDS. Verbatim, full width, never shortened, and set
                larger than the facts above it — see the note at the top of
                this file.
              */}
              {row.secret ? (
                <blockquote className={styles.secret}>{row.secret}</blockquote>
              ) : (
                <p className={styles.secretNone}>
                  She left the free-text answer empty.
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
