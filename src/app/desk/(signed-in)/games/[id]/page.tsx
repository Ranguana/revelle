import Link from "next/link";
import { notFound } from "next/navigation";

import { query, queryOne } from "@/lib/db";
import { groupFacets, tagsFor, taggingVocabulary } from "@/lib/desk/facets";
import {
  DEPENDENCY_STRENGTH,
  GAME_SHAPES,
  GAME_SOURCING,
  HOST_ROLES,
  POOL_STATUS,
  SUPPLY_SOURCES,
  guests,
  minutes,
  optionLabel,
  sectionLabel,
} from "@/lib/desk/labels";

import styles from "../../../desk.module.css";
import Thread from "../../Thread";
import { Chips, Empty, Fact, Head, Status } from "../../bits";
import GameForm, { type GameValues } from "../GameForm";
import { setGameStatus } from "../actions";

/**
 * ONE GAME, WHOLE.
 *
 * The form on the left edits the `game` row — its words, its shape, its bounds,
 * its tags. Everything below it is READ ONLY and is the authored structure:
 * db/010's supplies, printed matter, requirements and dependencies, db/025's
 * runbook and contingencies, db/009's three scoping registries. actions.ts
 * argues that cut; the short version is that those rows are authored in
 * src/lib/games.ts and guarded by triggers that make a half-edit impossible,
 * and the destinations section makes exactly the same cut between the look,
 * which is edited in place, and the voice, which is not.
 *
 * Read only is not the same as hidden. A curator deciding whether to offer a
 * game has to be able to read what she is offering, and the runbook is the part
 * of it a host actually stands up with. So all of it is on the page, in the
 * order db/025 phases it, including the two things a runbook can be wrong
 * about: a clock that disagrees with the duration, and a kind of trouble it
 * does not answer.
 */

export const dynamic = "force-dynamic";

type Step = {
  step: string;
  phase: string;
  phase_label: string;
  instruction: string;
  detail: string;
  say: string;
  minutes: number | null;
  supply_item: string | null;
  printed_piece: string | null;
  note: string | null;
};

type Standing = {
  revelles: string;
  steps: string;
  timed_steps: string;
  planned_minutes: string;
  disagrees: boolean | null;
  lead_time_days: number;
  items_to_buy: string;
  items_to_print: string;
  fragile: string;
};

const label = (
  list: readonly { code: string; label: string }[],
  code: string
) => list.find((entry) => entry.code === code)?.label ?? code;

export default async function GamePage({
  params,
  searchParams,
}: PageProps<"/desk/games/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const search = await searchParams;
  const saved = search.saved === "1";
  // The database's own words when it refused a status change — db/025's
  // sourcing and shape guards. Shown verbatim; see actions.ts.
  const refused = typeof search.refused === "string" ? search.refused : null;

  const game = await queryOne<GameValues & { status: string; name: string }>(
    `select id, slug::text as slug, name, description, how_it_works, materials,
            shape::text as shape, sourcing::text as sourcing,
            duration_minutes, duration_max_minutes, min_guests, max_guests,
            scoring, currency_label, external_name, external_url, caveat,
            host_role::text as host_role, host_note, source_note, notes,
            status::text as status
       from game where id = $1`,
    [id]
  );
  if (!game) notFound();

  const [
    groups,
    tags,
    steps,
    contingencies,
    gaps,
    supplies,
    printed,
    requirements,
    dependsOn,
    neededBy,
    occasions,
    slots,
    worlds,
    standing,
  ] = await Promise.all([
    taggingVocabulary("game").then(groupFacets),
    tagsFor("game", id),
    query<Step>(
      `select s.step, s.phase, p.label as phase_label, s.instruction, s.detail,
              s.say, s.minutes, s.supply_item, s.printed_piece, s.note
         from game_runbook_step s
         join runbook_phase p on p.code = s.phase
        where s.game_id = $1
        order by s.position`,
      [id]
    ),
    query<{ trouble: string; trouble_label: string; answer: string }>(
      `select c.trouble, k.label as trouble_label, c.answer
         from game_contingency c
         join runbook_trouble_kind k on k.code = c.trouble
        where c.game_id = $1
        order by k.position`,
      [id]
    ),
    // db/025's own view of what is missing, rather than a second copy of the
    // "universal" list in TypeScript.
    query<{ trouble_label: string }>(
      `select trouble_label from game_runbook_gap where game_id = $1`,
      [id]
    ),
    query<{
      item: string;
      detail: string;
      source: string;
      per_guest: boolean;
      quantity: number | null;
      lead_time_days: number;
      note: string | null;
      products: string[];
    }>(
      `select s.item, s.detail, s.source::text as source, s.per_guest,
              s.quantity, s.lead_time_days, s.note,
              coalesce(
                (select array_agg(p.name order by p.name)
                   from game_supply_product gp
                   join product p on p.id = gp.product_id
                  where gp.game_id = s.game_id and gp.item = s.item),
                '{}') as products
         from game_supply s
        where s.game_id = $1
        order by s.position, s.item`,
      [id]
    ),
    query<{
      piece: string;
      label: string;
      description: string;
      voice_label: string | null;
      per_guest: boolean;
      quantity: number | null;
      note: string | null;
    }>(
      `select m.piece, m.label, m.description, v.label as voice_label,
              m.per_guest, m.quantity, m.note
         from game_printed_matter m
         left join voice_piece_kind v on v.code = m.voice_piece
        where m.game_id = $1
        order by m.position, m.piece`,
      [id]
    ),
    query<{
      requirement: string;
      label: string;
      description: string;
      fragile: boolean;
      note: string | null;
    }>(
      `select r.requirement, k.label, k.description, k.fragile, r.note
         from game_requirement r
         join game_requirement_kind k on k.code = r.requirement
        where r.game_id = $1
        order by k.position`,
      [id]
    ),
    query<{
      id: string;
      name: string;
      strength: string;
      group_key: string | null;
      note: string | null;
    }>(
      `select o.id, o.name, d.strength::text as strength, d.group_key, d.note
         from game_dependency d
         join game o on o.id = d.requires_game_id
        where d.game_id = $1
        order by d.strength, o.name`,
      [id]
    ),
    query<{ id: string; name: string; strength: string }>(
      `select o.id, o.name, d.strength::text as strength
         from game_dependency d
         join game o on o.id = d.game_id
        where d.requires_game_id = $1
        order by o.name`,
      [id]
    ),
    query<{ occasion: string; fit: string; note: string | null }>(
      `select occasion::text as occasion, fit::text as fit, note
         from game_occasion where game_id = $1 order by occasion`,
      [id]
    ),
    query<{
      slot_code: string;
      label: string;
      section: string;
      fit: string;
      note: string | null;
    }>(
      `select s.slot_code, k.label, k.section::text as section,
              s.fit::text as fit, s.note
         from game_slot s
         join slot_kind k on k.code = s.slot_code
        where s.game_id = $1
        order by k.position`,
      [id]
    ),
    query<{
      id: string;
      name: string;
      forbidden: boolean;
      affinity: string;
      note: string | null;
    }>(
      `select w.id, w.name, gw.forbidden, gw.affinity::text as affinity, gw.note
         from game_world gw
         join world w on w.id = gw.world_id
        where gw.game_id = $1
        order by w.name`,
      [id]
    ),
    queryOne<Standing>(
      `select (select count(*) from revelle_game rg where rg.game_id = g.id)
                as revelles,
              coalesce(c.steps, 0)           as steps,
              coalesce(c.timed_steps, 0)     as timed_steps,
              coalesce(c.planned_minutes, 0) as planned_minutes,
              c.disagrees,
              coalesce(l.lead_time_days, 0)  as lead_time_days,
              coalesce(l.items_to_buy, 0)    as items_to_buy,
              coalesce(l.items_to_print, 0)  as items_to_print,
              coalesce(f.fragile_requirements, 0) as fragile
         from game g
         left join game_runbook_clock c on c.game_id = g.id
         left join game_lead_time l on l.game_id = g.id
         left join game_fragility f on f.game_id = g.id
        where g.id = $1`,
      [id]
    ),
  ]);

  const claimed = minutes(game.duration_minutes, game.duration_max_minutes);

  return (
    <>
      <Head eyebrow="The fun" title={game.name}>
        <Status code={game.status} label={POOL_STATUS[game.status]} />
        <Link href="/desk/games" className={styles.filter}>
          All games
        </Link>
        <form action={setGameStatus}>
          <input type="hidden" name="id" value={id} />
          <input
            type="hidden"
            name="status"
            value={game.status === "active" ? "draft" : "active"}
          />
          <button className={styles.filter}>
            {game.status === "active" ? "Withdraw" : "Offer it"}
          </button>
        </form>
      </Head>

      {refused ? <p className={styles.error}>{refused}</p> : null}
      {saved ? <p className={styles.ok}>Saved.</p> : null}

      <div className={styles.panels}>
        <div>
          <GameForm
            values={game}
            groups={groups}
            selected={tags.map((tag) => tag.facet_id)}
            weights={tags.map((tag) => [tag.facet_id, tag.weight] as const)}
          />
        </div>

        <div>
          <section className={styles.panel}>
            <h2 className={styles.panelHead}>
              <span>Where it stands</span>
            </h2>
            <div className={styles.facts}>
              <Fact label="Revelles issued">{standing?.revelles ?? 0}</Fact>
              <Fact label="Kind">{label(GAME_SHAPES, game.shape ?? "")}</Fact>
              <Fact label="Whose">
                {label(GAME_SOURCING, game.sourcing ?? "")}
              </Fact>
              <Fact label="Claimed">{claimed}</Fact>
              <Fact label="Guests">
                {guests(game.min_guests, game.max_guests)}
              </Fact>
              <Fact label="Host">{label(HOST_ROLES, game.host_role ?? "")}</Fact>
              <Fact label="Runbook">
                {Number(standing?.steps ?? 0) === 0
                  ? "none yet"
                  : `${standing?.steps} steps`}
              </Fact>
              <Fact label="Steps add up to">
                {Number(standing?.timed_steps ?? 0) === 0
                  ? "no clock"
                  : `${standing?.planned_minutes} min`}
              </Fact>
              <Fact label="In hand by">
                {standing?.lead_time_days
                  ? `${standing.lead_time_days} days before`
                  : "nothing to order"}
              </Fact>
              <Fact label="To buy / to print">
                {standing?.items_to_buy ?? 0} / {standing?.items_to_print ?? 0}
              </Fact>
              <Fact label="Fragile requirements">
                {standing?.fragile ?? 0}
              </Fact>
            </div>
            {standing?.disagrees ? (
              <p className={styles.error}>
                The steps add up to {standing.planned_minutes} minutes and the
                duration claims {claimed}. db/025 does not enforce this on
                purpose — it is a judgement, and this is where it gets made.
              </p>
            ) : null}
          </section>

          <section className={styles.panel}>
            <h2 className={styles.panelHead}>
              <span>Where it may go</span>
              <Link href="/desk/matrix?pool=game" className={styles.link}>
                the matrix
              </Link>
            </h2>
            <div className={styles.facts}>
              <Fact label="Occasions">
                {occasions.length === 0 ? (
                  <em>no claim — every occasion</em>
                ) : (
                  <Chips
                    items={occasions
                      .filter((row) => row.fit === "native")
                      .map((row) => optionLabel("occasion", row.occasion))}
                  />
                )}
              </Fact>
              {occasions.some((row) => row.fit === "forbidden") ? (
                <Fact label="Never at">
                  <Chips
                    tone="no"
                    items={occasions
                      .filter((row) => row.fit === "forbidden")
                      .map((row) => optionLabel("occasion", row.occasion))}
                  />
                </Fact>
              ) : null}
              {/*
                Split by fit rather than listed together, because the two are
                opposite claims and a single row of chips reads as one list.
                db/009: no rows means any slot, a native row makes it a
                whitelist, a forbidden row is a veto.
              */}
              <Fact label="Slots">
                {slots.length === 0 ? (
                  <em>no claim — any slot</em>
                ) : (
                  <Chips
                    items={slots
                      .filter((row) => row.fit === "native")
                      .map((row) => `${row.label} · ${sectionLabel(row.section)}`)}
                  />
                )}
              </Fact>
              {slots.some((row) => row.fit === "forbidden") ? (
                <Fact label="Never in">
                  <Chips
                    tone="no"
                    items={slots
                      .filter((row) => row.fit === "forbidden")
                      .map((row) => `${row.label} · ${sectionLabel(row.section)}`)}
                  />
                </Fact>
              ) : null}
            </div>

            {worlds.length === 0 ? (
              <p className={styles.hint}>
                No destination scoping. It stays playable everywhere, which is
                the right answer for a game that is not about a place.
              </p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Destination</th>
                    <th>How</th>
                  </tr>
                </thead>
                <tbody>
                  {worlds.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <Link
                          href={`/desk/destinations/${row.id}`}
                          className={styles.link}
                        >
                          {row.name}
                        </Link>
                        {row.note ? (
                          <div className={styles.when}>{row.note}</div>
                        ) : null}
                      </td>
                      <td className={styles.numeric}>
                        {row.forbidden
                          ? "never here"
                          : Number(row.affinity) === 0
                            ? "neutral"
                            : `${Number(row.affinity) > 0 ? "+" : ""}${Number(
                                row.affinity
                              )}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <Thread
            subject={{ table: "game", id }}
            back={`/desk/games/${id}`}
            title="Notes on this game"
          />
        </div>
      </div>

      {/*
        THE AUTHORED STRUCTURE, FULL WIDTH.

        Below the form rather than beside it because a runbook is prose read
        under pressure and a narrow column is the wrong measure for it — the
        same reason the deliverables screen stacks its panels.
      */}

      <section className={styles.panel}>
        <h2 className={styles.panelHead}>
          <span>The runbook</span>
          <span>
            authored in src/lib/games.ts · {game.host_note ?? "she plays too"}
          </span>
        </h2>
        {steps.length === 0 ? (
          <Empty>
            No runbook. A game in the pool without one is a card a host cannot
            act on — add the steps to <code>src/lib/games.ts</code> and run{" "}
            <code>npm run seed:games</code>, which fills in what is absent and
            changes nothing that is already there.
          </Empty>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Phase</th>
                <th>The step</th>
                <th>Clock</th>
              </tr>
            </thead>
            <tbody>
              {steps.map((step, index) => (
                <tr key={step.step}>
                  <td className={styles.numeric}>
                    {/* Only where it changes: a repeated phase label down six
                        rows is six readings of one fact. */}
                    {index === 0 || steps[index - 1].phase !== step.phase
                      ? step.phase_label
                      : ""}
                  </td>
                  <td>
                    <strong>{step.instruction}</strong>
                    {step.detail ? <p>{step.detail}</p> : null}
                    {step.say ? <p className={styles.secret}>{step.say}</p> : null}
                    {step.supply_item || step.printed_piece || step.note ? (
                      <div className={styles.when}>
                        {[
                          step.supply_item ? `needs: ${step.supply_item}` : null,
                          step.printed_piece
                            ? `hands out: ${step.printed_piece}`
                            : null,
                          step.note,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </div>
                    ) : null}
                  </td>
                  <td className={styles.numeric}>
                    {step.minutes === null ? "—" : `${step.minutes} min`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className={styles.panel}>
        <h2 className={styles.panelHead}>
          <span>When it goes wrong</span>
        </h2>
        {gaps.length > 0 ? (
          <div className={styles.facts}>
            <Fact label="Not answered">
              <Chips tone="no" items={gaps.map((row) => row.trouble_label)} />
            </Fact>
          </div>
        ) : null}
        {contingencies.length === 0 ? (
          <p className={styles.hint}>
            Nothing written down. The commonest thing that happens at a party is
            that somebody will not play, and it is the thing least often written
            down.
          </p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>The trouble</th>
                <th>What she does</th>
              </tr>
            </thead>
            <tbody>
              {contingencies.map((row) => (
                <tr key={row.trouble}>
                  <td>{row.trouble_label}</td>
                  <td>{row.answer}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className={styles.panel}>
        <h2 className={styles.panelHead}>
          <span>What it needs</span>
          <span>counted, and dated</span>
        </h2>
        {supplies.length === 0 ? (
          <p className={styles.hint}>
            Nothing to get, which is a common and good answer — the best games
            in this catalogue need a pen.
          </p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Item</th>
                <th>How it arrives</th>
                <th>How many</th>
                <th>In hand by</th>
                <th>In the edit</th>
              </tr>
            </thead>
            <tbody>
              {supplies.map((row) => (
                <tr key={row.item}>
                  <td>
                    <strong>{row.item}</strong>
                    {row.detail ? <div>{row.detail}</div> : null}
                    {row.note ? (
                      <div className={styles.when}>{row.note}</div>
                    ) : null}
                  </td>
                  <td className={styles.numeric}>
                    {SUPPLY_SOURCES[row.source] ?? row.source}
                  </td>
                  <td className={styles.numeric}>
                    {row.per_guest
                      ? "one each"
                      : row.quantity === null
                        ? "—"
                        : row.quantity}
                  </td>
                  <td className={styles.numeric}>
                    {row.lead_time_days === 0
                      ? "on the day"
                      : `${row.lead_time_days} days before`}
                  </td>
                  <td>
                    <Chips items={row.products} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className={styles.panel}>
        <h2 className={styles.panelHead}>
          <span>What the house prints</span>
          <span>in the destination&rsquo;s own face</span>
        </h2>
        {printed.length === 0 ? (
          <p className={styles.hint}>
            {game.sourcing === "recommended"
              ? "Nothing, and nothing may be. A recommended game is somebody else's product: the house may name it and may not print a card for it."
              : "Nothing printed."}
          </p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Piece</th>
                <th>What kind of writing</th>
                <th>How many</th>
              </tr>
            </thead>
            <tbody>
              {printed.map((row) => (
                <tr key={row.piece}>
                  <td>
                    <strong>{row.label}</strong>
                    {row.description ? <div>{row.description}</div> : null}
                    {row.note ? (
                      <div className={styles.when}>{row.note}</div>
                    ) : null}
                  </td>
                  <td className={styles.numeric}>{row.voice_label ?? "—"}</td>
                  <td className={styles.numeric}>
                    {row.per_guest
                      ? "one each"
                      : row.quantity === null
                        ? "—"
                        : row.quantity}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className={styles.panel}>
        <h2 className={styles.panelHead}>
          <span>What the room has to have</span>
        </h2>
        {requirements.length === 0 ? (
          <p className={styles.hint}>Nothing. It runs anywhere.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>It needs</th>
                <th>Why</th>
              </tr>
            </thead>
            <tbody>
              {requirements.map((row) => (
                <tr key={row.requirement}>
                  <td>
                    <strong>{row.label}</strong>
                    {/* db/010 marks the fragile ones: a phone each, signal that
                        holds, an app somebody else maintains. They are the
                        reasons a game fails on the night. */}
                    {row.fragile ? (
                      <div className={styles.when}>fragile</div>
                    ) : null}
                  </td>
                  <td>
                    {row.description}
                    {row.note ? (
                      <div className={styles.when}>{row.note}</div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className={styles.panel}>
        <h2 className={styles.panelHead}>
          <span>What has to happen first</span>
        </h2>
        {dependsOn.length === 0 && neededBy.length === 0 ? (
          <p className={styles.hint}>Nothing. It stands on its own.</p>
        ) : (
          <ul className={styles.rows}>
            {dependsOn.map((row) => (
              <li key={`needs-${row.id}`} className={styles.row}>
                <div className={styles.who}>
                  <span className={styles.factLabel}>
                    {DEPENDENCY_STRENGTH[row.strength] ?? row.strength}
                  </span>
                  <Link href={`/desk/games/${row.id}`} className={styles.whoEmail}>
                    {row.name}
                  </Link>
                </div>
                <div>
                  {row.note}
                  {row.group_key ? (
                    <div className={styles.when}>
                      one of the &ldquo;{row.group_key}&rdquo; group — any one of
                      them satisfies this
                    </div>
                  ) : null}
                </div>
              </li>
            ))}
            {neededBy.map((row) => (
              <li key={`for-${row.id}`} className={styles.row}>
                <div className={styles.who}>
                  <span className={styles.factLabel}>Needed by</span>
                  <Link href={`/desk/games/${row.id}`} className={styles.whoEmail}>
                    {row.name}
                  </Link>
                </div>
                <div className={styles.when}>
                  Withdrawing this one takes that one with it.
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className={styles.note}>
        Everything from the runbook down is the database&rsquo;s copy of what{" "}
        <code>src/lib/games.ts</code> authored. A rewording belongs in that file
        too: a fresh database seeds from it, and{" "}
        <code>npm run seed:games</code> will never overwrite what is here.
      </p>
    </>
  );
}
