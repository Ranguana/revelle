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
import {
  decisionLine,
  readDecisions,
  type Divergence,
} from "./applications/decisions";

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
 * yes gets said in TWO places now, sharing one implementation: `/desk/publish`
 * and `npm run activate:catalogue -- --yes`. The screen exists because the
 * database is unreachable from any laptop, so the script alone meant publishing
 * required a shell inside Render — a gate nobody could operate is not a gate. Nothing about removing the curator from selection weakens the gate on
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
 * ── THE AFFORDANCE THAT WAS ON EVERY ROW, AND WHY IT WENT ────────────
 *
 * Each row carried a status dropdown and a Set button, posting to
 * `setApplicationStatus`. The argument for it was good and it is worth keeping:
 * somebody working the inbox should be able to move six applications along
 * without opening six pages, and a queue you cannot clear from the list is a
 * queue that stays full.
 *
 * It lost to the design above. A screen with a per-row decision on it is a
 * queue whatever the header says, and the one decision that used to justify
 * working down this list — which Revelle she gets — is no longer anybody's here
 * to make. What replaced the dropdown is the DECISION LINE: who decided, which
 * rank was taken, and what the engine had wanted instead. That is a fact to
 * read, not a control to operate, and it is the thing this screen now exists to
 * show.
 *
 * The status itself is still real — the filters below are built on it, and
 * archiving is still housekeeping somebody does — so it kept its control on
 * the application's own page, where a spot-check ends. It is one page further
 * from the list on purpose.
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

  // WHAT SHE DID WITH WHAT THE ENGINE PROPOSED. A second read rather than a
  // join, so that the list above — which has always worked — cannot be taken
  // down by a proposal table that is a migration behind. See decisions.ts.
  const decisions = await readDecisions(rows.map((row) => row.id));

  const settled = [...decisions.values()].filter((d) => d.chosen !== null);
  const tally = {
    decided: settled.length,
    diverged: settled.filter((d) => (d.rankGap ?? 0) > 0).length,
    timedOut: settled.filter((d) => d.kind === "system_default").length,
  };

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
        {/*
          THE ONLY NUMBER ON THIS SCREEN THAT IS ABOUT THE ENGINE. Over the
          applications in view: how many were decided, how many of those went
          against the engine's first choice, and how many were nobody at all.
          The last is kept separate from the first two forever — see db/027.
        */}
        {tally.decided > 0 ? (
          <span className={styles.hint}>
            {tally.decided} decided · {tally.diverged} took something other than
            rank 1 · {tally.timedOut} timed out
          </span>
        ) : null}
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
                {/*
                  WAS: a status dropdown and a Set button, posting to
                  `setApplicationStatus`. Removed with the curator — see the
                  essay at the top of this file. The control now lives only on
                  the application's own page; what stands in its place here is
                  the decision line, which is read and not operated.
                */}
                <Decision divergence={decisions.get(row.id) ?? null} />
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

/**
 * THE DECISION LINE, and what replaced the dropdown.
 *
 * Three states, and the middle one is the reason the column in db/027 exists:
 *
 *   nothing here      the engine has not produced candidates for her at all.
 *                     Silence rather than a reassuring blank — an application
 *                     with no run is a different problem from an open reveal
 *                     and the detail page is where that is diagnosed.
 *   a timeout         `system_default`. It took rank 1 and it looks exactly
 *                     like agreement in every column except this one, so it is
 *                     marked, in the row, every time. A screen that renders it
 *                     as a pick is a screen that will one day be used to argue
 *                     the model is well calibrated because five hundred people
 *                     stopped reading.
 *   unattributed      a decided proposal with no `decided_by_kind`, which is
 *                     every row written before db/027 and every row written by
 *                     anything that has not been taught to set it. Said out
 *                     loud rather than guessed at.
 */
function Decision({ divergence }: { divergence: Divergence | null }) {
  if (divergence === null) return null;

  // A decision that is not hers — a timeout, or one nobody attributed — is set
  // bold rather than in its own colour: the row is already dense, and `when` is
  // the type the rest of this column is set in.
  const suspect =
    divergence.chosen !== null &&
    (divergence.kind === "system_default" || divergence.kind === null);
  const line = decisionLine(divergence);

  return (
    <span className={styles.when}>
      {suspect ? <strong>{line}</strong> : line}
    </span>
  );
}
