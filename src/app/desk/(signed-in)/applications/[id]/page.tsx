import Link from "next/link";
import { notFound } from "next/navigation";

import { query, queryOne } from "@/lib/db";
import { membership } from "@/lib/desk/acceptance";
import { readNotice } from "@/lib/desk/notice";
import {
  APPLICATION_STATUS,
  dollars,
  optionLabel,
  optionLabels,
  stamp,
  toneLabel,
} from "@/lib/desk/labels";
import {
  applicationProposals,
  approvedRevelle,
  latestRun,
} from "@/lib/desk/proposals";

import styles from "../../../desk.module.css";
import Thread from "../../Thread";
import { Chips, Fact, Head, Status } from "../../bits";
import Proposals from "./Proposals";
import {
  acceptApplicantAction,
  deliverRevelleAction,
  discardRevelleAction,
  setApplicationFacts,
  setApplicationStatus,
} from "../actions";

/**
 * One application, in full.
 *
 * The inbox is for triage; this is for working. It adds the three things a row
 * cannot carry: what her answers RESOLVE TO in the shared vocabulary, how her
 * people sound on the voice axes, and the verbatim payload she submitted.
 *
 * ── WHY THE RAW ANSWERS ARE ON THE PAGE ─────────────────────────────
 *
 * db/001 calls `answers` "the evidentiary record of what she actually
 * submitted, against the question set she was actually shown". The columns
 * beside it are a projection. When the two ever disagree — a retired option, a
 * question reworded between versions — the projection is the thing that is
 * wrong, and a tool that only shows the projection makes that invisible.
 */

export const dynamic = "force-dynamic";

type Application = {
  id: string;
  created_at: string;
  status: string;
  quiz_version: string;
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
  food_plan: string | null;
  play_appetite: string | null;
  how_made: string | null;
  event_date: string | null;
  guest_count_confirmed: number | null;
  answers: unknown;
  customer_id: string;
  email: string;
  name: string | null;
  guests_low: number | null;
  guests_high: number | null;
  guests_planning: number | null;
  per_person_planning: number | null;
  budget_planning: string | null;
  budget_ceiling: string | null;
};

export default async function ApplicationPage({
  params,
}: PageProps<"/desk/applications/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  // A refusal from one of the Server Actions in ../actions.ts — "this
  // destination has no voice", "the ratchet is down". It travels in a
  // short-lived cookie carrying the application it belongs to; see the note
  // above `settle` there for why that beats a query string and a client
  // component. Ignored when it names a different application.
  const refused = await readNotice(id);

  const application = await queryOne<Application>(
    `select qr.id, qr.created_at, qr.status::text as status, qr.quiz_version,
            qr.occasion::text as occasion, qr.occasion_other,
            qr.environment::text as environment,
            qr.taste_directions, qr.group_fun, qr.anti_preferences,
            qr.affinities, qr.voice_tones, qr.secret,
            qr.guest_count_band::text as guest_count_band,
            qr.spend_per_person::text as spend_per_person,
            qr.music_service::text as music_service,
            qr.food_plan::text as food_plan,
            qr.play_appetite::text as play_appetite,
            qr.how_made::text as how_made,
            qr.event_date, qr.guest_count_confirmed, qr.answers,
            qr.customer_id,
            c.email::text as email, c.name,
            s.guests_low, s.guests_high, s.guests_planning,
            s.per_person_planning,
            s.budget_planning::text as budget_planning,
            s.budget_ceiling::text as budget_ceiling
       from quiz_response qr
       join customer c on c.id = qr.customer_id
       left join quiz_response_scale s on s.quiz_response_id = qr.id
      where qr.id = $1`,
    [id]
  );
  if (!application) notFound();

  const [facets, voice] = await Promise.all([
    query<{
      quiz_field: string;
      option_code: string;
      dimension_code: string;
      facet_label: string;
      facet_status: string;
      polarity: string;
    }>(
      `select quiz_field, option_code::text as option_code, dimension_code,
              facet_label, facet_status::text as facet_status,
              polarity::text as polarity
         from quiz_response_facet
        where quiz_response_id = $1
        order by dimension_code, facet_label`,
      [id]
    ),
    query<{ voice_facet_label: string; weight: string; from_tones: string[] }>(
      `select voice_facet_label, weight::text as weight, from_tones
         from quiz_response_voice
        where quiz_response_id = $1
        order by weight desc`,
      [id]
    ),
  ]);

  // The three reads that make this page the curator's tool rather than a
  // viewer: what the engine proposed, where its run got to, and whether an
  // approval has already turned one of them into a Revelle.
  const [proposals, run, revelle, member] = await Promise.all([
    applicationProposals(id),
    latestRun(id),
    approvedRevelle(id),
    membership(application.customer_id),
  ]);

  const back = `/desk/applications/${id}`;

  return (
    <>
      <Head eyebrow="Application" title={application.email}>
        <Status
          code={application.status}
          label={APPLICATION_STATUS[application.status]}
        />
        <Link href="/desk" className={styles.filter}>
          Back to the inbox
        </Link>
      </Head>

      {refused.length > 0 ? <p className={styles.error}>{refused}</p> : null}

      <div className={styles.panels}>
        <div>
          {/* HER WORDS FIRST. Everything else on this page is a projection. */}
          <section className={styles.panel}>
            <h2 className={styles.panelHead}>
              <span>The thing we could not possibly know</span>
            </h2>
            {application.secret ? (
              <blockquote className={styles.secret}>
                {application.secret}
              </blockquote>
            ) : (
              <p className={styles.secretNone}>She left it empty.</p>
            )}
          </section>

          {/*
            THE WORKING SURFACE, and the reason this page exists at all. It is
            directly under her own words because those are what a curator reads
            the proposal against — docs/selection-spec.md keeps the free-text
            answer "verbatim and prominent" for exactly this moment.
          */}
          <Proposals
            applicationId={id}
            proposals={proposals}
            run={run}
            hasRevelle={revelle !== null}
          />

          <section className={styles.panel}>
            <h2 className={styles.panelHead}>
              <span>What she told us</span>
              <span>
                {stamp(application.created_at)} · {application.quiz_version}
              </span>
            </h2>
            <div className={styles.facts}>
              <Fact label="Occasion">
                {application.occasion === "other" && application.occasion_other
                  ? application.occasion_other
                  : optionLabel("occasion", application.occasion)}
              </Fact>
              <Fact label="Where">
                {optionLabel("environment", application.environment)}
              </Fact>
              <Fact label="Guests">
                {optionLabel("guest_count_band", application.guest_count_band)}
              </Fact>
              <Fact label="A head">
                {optionLabel("spend_per_person", application.spend_per_person)}
              </Fact>
              <Fact label="Music">
                {optionLabel("music_service", application.music_service)}
              </Fact>
              <Fact label="Food">
                {optionLabel("food_plan", application.food_plan)}
              </Fact>
              <Fact label="Games">
                {optionLabel("play_appetite", application.play_appetite)}
              </Fact>
              <Fact label="Making">
                {optionLabel("how_made", application.how_made)}
              </Fact>
            </div>
            <div className={styles.facts} style={{ marginTop: "0.5rem" }}>
              <Fact label="Direction">
                <Chips
                  items={optionLabels(
                    "taste_directions",
                    application.taste_directions
                  )}
                />
              </Fact>
              <Fact label="How they have fun">
                <Chips items={optionLabels("group_fun", application.group_fun)} />
              </Fact>
              <Fact label="Would ruin it">
                <Chips
                  items={optionLabels(
                    "anti_preferences",
                    application.anti_preferences
                  )}
                  tone="no"
                />
              </Fact>
              <Fact label="More of">
                <Chips items={optionLabels("affinities", application.affinities)} />
              </Fact>
              <Fact label="How they talk">
                <Chips items={application.voice_tones.map(toneLabel)} />
              </Fact>
            </div>
          </section>

          <section className={styles.panel}>
            <h2 className={styles.panelHead}>
              <span>The scale</span>
              <span>quiz_response_scale</span>
            </h2>
            <div className={styles.facts}>
              <Fact label="Guests, low">{application.guests_low ?? "—"}</Fact>
              <Fact label="Guests, high">
                {application.guests_high ?? <em>open</em>}
              </Fact>
              <Fact label="Plan for">{application.guests_planning ?? "—"}</Fact>
              <Fact label="A head, planning">
                {dollars(application.per_person_planning)}
              </Fact>
              <Fact label="Build to">{dollars(application.budget_planning)}</Fact>
              <Fact label="Never exceed">
                {application.budget_ceiling === null ? (
                  <em>open — ask her, do not assume no limit</em>
                ) : (
                  dollars(application.budget_ceiling)
                )}
              </Fact>
            </div>
          </section>

          <section className={styles.panel}>
            <h2 className={styles.panelHead}>
              <span>What it resolves to</span>
              <span>the shared vocabulary</span>
            </h2>
            {facets.length === 0 ? (
              <p className={styles.hint}>
                Nothing resolved. Either the vocabulary has not been seeded or
                her answers predate it.
              </p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Dimension</th>
                    <th>Facet</th>
                    <th>From</th>
                    <th>Says</th>
                  </tr>
                </thead>
                <tbody>
                  {facets.map((facet) => (
                    <tr key={`${facet.quiz_field}-${facet.option_code}`}>
                      <td>{facet.dimension_code}</td>
                      <td>
                        {facet.facet_label}
                        {facet.facet_status === "deprecated" ? " (retired)" : ""}
                      </td>
                      <td className={styles.numeric}>{facet.quiz_field}</td>
                      <td>{facet.polarity === "negative" ? "not this" : "yes"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className={styles.panel}>
            <h2 className={styles.panelHead}>
              <span>How her people sound</span>
              <span>quiz_response_voice</span>
            </h2>
            {voice.length === 0 ? (
              <p className={styles.hint}>
                She tapped no tones — this response predates the voice question.
                An absent row is silence, not a zero.
              </p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Axis</th>
                    <th>Weight</th>
                    <th>From which taps</th>
                  </tr>
                </thead>
                <tbody>
                  {voice.map((axis) => (
                    <tr key={axis.voice_facet_label}>
                      <td>{axis.voice_facet_label}</td>
                      <td className={styles.numeric}>{axis.weight}</td>
                      <td>{axis.from_tones.map(toneLabel).join(", ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className={styles.panel}>
            <h2 className={styles.panelHead}>
              <span>Exactly what she submitted</span>
              <span>quiz_response.answers</span>
            </h2>
            <pre className={styles.pre}>
              {JSON.stringify(application.answers, null, 2)}
            </pre>
          </section>
        </div>

        <div>
          <section className={styles.panel}>
            <h2 className={styles.panelHead}>
              <span>Workflow</span>
            </h2>
            <form action={setApplicationStatus} className={styles.form}>
              <input type="hidden" name="id" value={id} />
              <div className={styles.field}>
                <label className={styles.label} htmlFor="status">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  defaultValue={application.status}
                  className={styles.select}
                >
                  {Object.entries(APPLICATION_STATUS).map(([code, label]) => (
                    <option key={code} value={code}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.buttonRow}>
                <button className={styles.button} type="submit">
                  Set status
                </button>
              </div>
            </form>
          </section>

          <section className={styles.panel}>
            <h2 className={styles.panelHead}>
              <span>What we have learned since</span>
            </h2>
            <p className={styles.hint}>
              Her answers are frozen — the database refuses to change them. These
              two are facts the house learns afterwards, usually from her reply
              to the confirmation email.
            </p>
            <form action={setApplicationFacts} className={styles.form}>
              <input type="hidden" name="id" value={id} />
              <div className={styles.field}>
                <label className={styles.label} htmlFor="event_date">
                  The date
                </label>
                <input
                  id="event_date"
                  name="event_date"
                  type="date"
                  defaultValue={application.event_date?.slice(0, 10) ?? ""}
                  className={styles.input}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="guest_count_confirmed">
                  Confirmed guests
                </label>
                <input
                  id="guest_count_confirmed"
                  name="guest_count_confirmed"
                  type="number"
                  min={1}
                  defaultValue={application.guest_count_confirmed ?? ""}
                  className={styles.input}
                />
                <span className={styles.hint}>
                  Not her answer, which was a band and is frozen. This is the
                  number a print run reads.
                </span>
              </div>
              <div className={styles.buttonRow}>
                <button className={styles.button} type="submit">
                  Record
                </button>
              </div>
            </form>
          </section>

          {/*
            HER REVELLE, once a curator has approved one.
            Two buttons and the whole of db/003 behind them: discarding is free
            until the moment of delivery and impossible after it, because
            `first_delivered_at` is a ratchet and the assemblage it claims is
            claimed for good. The panel says which side of that line this
            Revelle is on before it offers either.
          */}
          {revelle ? (
            <section className={styles.panel}>
              <h2 className={styles.panelHead}>
                <span>Her Revelle</span>
                <span>{revelle.status}</span>
              </h2>

              <div className={styles.facts}>
                <Fact label="Delivered">
                  {revelle.firstDeliveredAt ? (
                    stamp(revelle.firstDeliveredAt)
                  ) : (
                    <em>not yet</em>
                  )}
                </Fact>
                <Fact label="Voice">
                  {revelle.voiceId ? "pinned" : <em>pinned at delivery</em>}
                </Fact>
              </div>

              {revelle.firstDeliveredAt ? (
                <p className={styles.hint}>
                  This is hers. The assemblage is claimed for good — db/003 is
                  explicit that there is no reissue, for anybody, ever,
                  including her. Nothing at this desk can re-roll it; a
                  different Revelle would have to vary at least one pooled
                  ingredient, and that is a new application.
                </p>
              ) : (
                <div className={styles.buttonRow}>
                  <form action={deliverRevelleAction}>
                    <input type="hidden" name="id" value={id} />
                    <input
                      type="hidden"
                      name="revelle_id"
                      value={revelle.id}
                    />
                    <button className={styles.button} type="submit">
                      Deliver it
                    </button>
                  </form>
                  <form action={discardRevelleAction}>
                    <input type="hidden" name="id" value={id} />
                    <button className={styles.buttonDanger} type="submit">
                      Discard and choose again
                    </button>
                  </form>
                </div>
              )}
            </section>
          ) : null}

          {/*
            THE ONE DOOR. db/015 built `customer.accepted_at` and left it
            unwired on purpose; this is the wire, and it is deliberately not a
            consequence of anything else on this page. Moving the status to "in
            progress" does not do it, approving a proposal does not do it, and
            delivering does not do it — db/015's author refused to key
            acceptance off workflow in as many words, because this column is
            what decides whether a sign-in link is ever mailed to her.
          */}
          <section className={styles.panel}>
            <h2 className={styles.panelHead}>
              <span>Membership</span>
              <span>customer.accepted_at</span>
            </h2>
            {member?.acceptedAt ? (
              <p className={styles.ok}>
                {member.email} is a member as of{" "}
                {member.acceptedAt.slice(0, 10)}
                {member.acceptedBy ? `, taken on by ${member.acceptedBy}` : ""}.
                She can ask for a sign-in link and reach her portal.
              </p>
            ) : (
              <>
                <p className={styles.hint}>
                  She has applied and nothing more. A sign-in request for her
                  address sends nothing, and there is no portal behind it. This
                  is a decision, not a workflow step: it is never inferred from
                  a status, and there is no undo — db/015 declines to guess
                  what ending a membership would mean.
                </p>
                <form action={acceptApplicantAction}>
                  <input type="hidden" name="id" value={id} />
                  <input
                    type="hidden"
                    name="customer_id"
                    value={application.customer_id}
                  />
                  <div className={styles.buttonRow}>
                    <button className={styles.button} type="submit">
                      Take her on
                    </button>
                  </div>
                </form>
              </>
            )}
          </section>

          <Thread
            subject={{ table: "quiz_response", id }}
            back={back}
            title="Notes on this application"
          />
        </div>
      </div>
    </>
  );
}
