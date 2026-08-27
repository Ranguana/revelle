import Link from "next/link";

import { query } from "@/lib/db";
import { POOL_STATUS, stamp } from "@/lib/desk/labels";
import { pools, type Ask } from "@/lib/desk/publish";
import {
  FEED_CEILING,
  POOL_SCREEN,
  feed,
  vetoes,
  type Run,
  type RunPool,
  type Veto,
} from "@/lib/desk/stocked";

import styles from "../../desk.module.css";
import { Empty, Head, Seam, Status, StatusLegend, TableRow } from "../bits";
import { revertStocked } from "./actions";
import { SyncPanel } from "./SyncPanel";

/**
 * STOCKED — what the seeders put in front of members, and how to take it back.
 *
 * ── WHY THIS IS ONE SCREEN AND NOT A PANEL ON EACH LIST ──────────────
 *
 * The other shape was a strip at the top of /desk/dishes, /desk/drinks,
 * /desk/menus and /desk/bank saying "41 of these went live on Tuesday". It was
 * rejected for three reasons, and they are all the same reason:
 *
 *   1. A DEPLOY IS ONE EVENT AND WOULD HAVE BEEN FIVE SCREENS. seed-dishes,
 *      seed-drinks, seed-menus and seed-bank all run in one chain
 *      (render.yaml's preDeployCommand), so "what happened on Tuesday" is a
 *      question about the library, not about the dish pool. Answering it would
 *      have meant opening four screens and holding the answer in your head.
 *
 *   2. A BATCH REVERT HAS NOWHERE TO LIVE ON A POOL SCREEN. The unit of the
 *      veto is a RUN — "seed-drinks put twenty-five programmes out and I want
 *      them back" — and a pool screen is organised by the pool's own axes
 *      (destination, course, season), which cut across runs and cannot express
 *      one. /desk/dishes already has the row-at-a-time gesture, and it is the
 *      right one there.
 *
 *   3. IT IS THE MIRROR OF /desk/publish AND BELONGS BESIDE IT. That screen is
 *      the consent gate and it now governs one thing: destinations, plus the
 *      few rows a person drafted or a seeder held back. This is the veto gate.
 *      Two links, next to each other in the rail, are the whole doctrine of
 *      CLAUDE.md rule 13 made visible: what the house signs for, and what the
 *      house merely watches.
 *
 * ── NO CLIENT JAVASCRIPT ─────────────────────────────────────────────
 *
 * A server component, a `<form>`, checkboxes, one submit per pool per run. Same
 * as /desk/publish and for the same reason. The one difference is that NOTHING
 * ARRIVES TICKED: there, ticking everything is the gesture; here, the default
 * gesture is to leave the catalogue alone.
 *
 * ── WHAT IT DOES NOT SHOW ────────────────────────────────────────────
 *
 * Destinations, gestures and voices. Nothing auto-publishes one — they are
 * governed classes (CLAUDE.md rule 13, src/lib/governed.test.ts) — so a
 * destination can never appear in this feed, and a screen that offered a
 * "revert" for one would be offering a gesture with no act behind it.
 */

export const dynamic = "force-dynamic";

/** `query` is exactly the shape the shared module asks for. */
const ask: Ask = query;

function one(value: string | string[] | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export default async function StockedPage({
  searchParams,
}: PageProps<"/desk/stocked">) {
  const params = await searchParams;

  // RETIRED POOLS ARE NOT LISTED HERE. Founder ruling, 2026-08-27: a pool
  // the engine cannot draw from has nothing to say on the audit feed, and a row
  // reading "0 of 0, retired" is the confusion db/045 was meant to end
  // rather than relocate. The registry still knows them, /desk/publish
  // still governs them if one is ever un-retired, and the rows are still
  // readable at their own route — this is a display decision, not a
  // second retirement.
  const registry = (await pools(ask)).filter((pool) => !pool.retired);
  const wanted = one(params.pool);
  // An unknown pool in the query string narrows to nothing rather than
  // silently showing everything, which would be the screen disagreeing with
  // its own filter bar about what it is showing.
  const chosen = registry.find((pool) => pool.code === wanted) ?? null;

  const board = await feed(ask, chosen ? [chosen] : registry);
  const recent = await vetoes(ask);

  const withdrawn = Number(one(params.withdrawn));
  const asked = Number(one(params.asked));
  const refused = one(params.refused);

  return (
    <>
      <Head eyebrow="The library" title="Stocked">
        <Link href="/desk/publish" className={styles.filter}>
          Publish
        </Link>
        <Link href="/desk/coverage" className={styles.filter}>
          Coverage
        </Link>
      </Head>

      <p className={styles.note}>
        Pool content stocks itself. A dish, a drink, a menu, a game or a bank
        item that a seeder creates is offered to members on the way in, and this
        is where that gets read back: what went live, when, and out of which
        seeder.
        Nothing here is waiting for a yes — the gesture on this screen is the
        other one. Tick what should not have gone out and it goes back to draft,
        with your name on it, under the seeder&rsquo;s row in the same ledger.
      </p>

      <SyncPanel />

      {refused ? <p className={styles.error}>{refused}</p> : null}
      {withdrawn > 0 ? (
        <p className={styles.ok}>
          {withdrawn} back to draft
          {asked > withdrawn
            ? ` — ${asked - withdrawn} of the ${asked} ticked had already left the pool and were untouched.`
            : "."}
        </p>
      ) : null}

      <div className={styles.filters}>
        <Link
          href="/desk/stocked"
          className={styles.filter}
          aria-current={!chosen}
        >
          Everything
        </Link>
        {registry.map((pool) => (
          <Link
            key={pool.code}
            href={`/desk/stocked?pool=${pool.code}`}
            className={styles.filter}
            aria-current={chosen?.code === pool.code}
          >
            {pool.label}
          </Link>
        ))}
        <span className={styles.hint}>{counted(board.total, board.shown)}</span>
      </div>

      {board.runs.length > 0 ? <StatusLegend statuses={POOL_STATUS} /> : null}

      {board.runs.length === 0 ? (
        <Empty>
          {chosen ? (
            <>
              No seeder has put a {chosen.label.toLowerCase()} row out yet.{" "}
              <Link href="/desk/stocked">Every pool</Link> is the wider view.
            </>
          ) : (
            <>
              Nothing has been stocked automatically yet. The seeders write here
              on their next deploy — every row they offer lands in the ledger as
              an act with no person behind it, which is what this screen reads.
              Until then the only things in the library are what somebody put
              there by hand.
            </>
          )}
        </Empty>
      ) : (
        board.runs.map((run) => <RunPanel key={run.key} run={run} />)
      )}

      <Vetoes list={recent} />

      <Seam title="What this screen will not do">
        It only ever moves a row from offered back to draft. Offering something
        is <Link href="/desk/publish">Publish</Link>, which is now mostly about
        destinations — those stay founder-signed, so they never appear here.
        Withdrawing a row that no seeder offered is on the pool&rsquo;s own
        screen, one row at a time, where the row can be looked at properly.
      </Seam>
    </>
  );
}

/** The count line, which must never be only a count. */
function counted(total: number, shown: number): string {
  if (total === 0) return "nothing stocked automatically yet";
  if (shown >= total) return `${total} stocked automatically`;
  return `${shown} of ${total} shown — ${FEED_CEILING} per pool, newest first`;
}

/* ── one run ────────────────────────────────────────────────────────── */

/**
 * One seeder's pass, with its pools under it.
 *
 * The heading carries the two numbers that matter and they are not the same
 * number: what it PUT OUT, which is history and cannot change, and what is
 * STILL OFFERED, which is a fact about the pool right now. When they differ,
 * somebody has already acted — here, on the pool's own screen, or by
 * discontinuing the row — and the difference is the interesting part.
 */
function RunPanel({ run }: { run: Run }) {
  // Named `span` rather than `window`, which is a global this file has no
  // business shadowing even in a component that never runs in a browser.
  const span =
    run.first.getTime() === run.last.getTime()
      ? stamp(run.last)
      : `${stamp(run.first)} — ${stamp(run.last)}`;

  return (
    <section className={styles.panel}>
      <h2 className={styles.panelHead}>
        <span>{run.seeder}</span>
        <span>
          {run.total} stocked · {run.live} still offered
        </span>
      </h2>

      <p className={styles.note}>
        {span}
        {run.source ? (
          <>
            {" "}
            · out of <code>{run.source}</code>
          </>
        ) : null}{" "}
        · recorded as <code>{run.actor}</code>, which is the ledger saying
        nobody signed for it.
      </p>

      {run.pools.map((share) => (
        <PoolShare key={share.pool.code} run={run} share={share} />
      ))}
    </section>
  );
}

/**
 * One pool's rows within one run, and the form that takes them back.
 *
 * A form per (run, pool) rather than one form for the whole run, because the
 * action resolves ONE pool code against `ingredient_pool` before it composes a
 * statement — the registry is what makes the table name safe, and a form that
 * mixed two pools would have to either trust a per-row table name from the
 * browser or run two statements out of one submit. One pool, one statement, one
 * ledger row.
 */
function PoolShare({ run, share }: { run: Run; share: RunPool }) {
  const screen = POOL_SCREEN[share.pool.code];

  return (
    <form action={revertStocked}>
      <input type="hidden" name="pool" value={share.pool.code} />
      <input type="hidden" name="run" value={run.key} />

      {/*
        THE BATCH, CARRIED SEPARATELY FROM THE TICKS.
        One list per gesture, both of them explicit ids that were on this
        screen: `id` is what she ticked, `all` is every row of this run still
        offered at the moment it rendered. The action reads one or the other by
        which button was pressed, so "send the whole run back" needs no ticking
        and no client JavaScript, and neither button can act on a row this page
        did not show her.
      */}
      {share.entries
        .filter((entry) => entry.live && entry.id)
        .map((entry) => (
          <input key={entry.entry} type="hidden" name="all" value={entry.id ?? ""} />
        ))}

      <table className={styles.table}>
        <thead>
          <tr>
            <th>
              {share.pool.label}
              {screen ? (
                <>
                  {" "}
                  <Link href={screen} className={styles.whoEmail}>
                    (the pool)
                  </Link>
                </>
              ) : null}
            </th>
            <th>Offered</th>
            <th>Status now</th>
            <th>Back to draft</th>
          </tr>
        </thead>
        <tbody>
          {share.entries.map((entry) => (
            // Tinted by the row's CURRENT status, which is the same colour
            // language every pool screen uses and the reason the legend at the
            // top of this page is worth printing: a run that has been vetoed
            // reads as a block of "open" rows without anybody counting.
            <TableRow key={entry.entry} status={entry.status}>
              <td>
                {entry.id && screen ? (
                  <Link
                    href={`${screen}/${entry.id}`}
                    className={styles.whoEmail}
                  >
                    {entry.name ?? entry.summary}
                  </Link>
                ) : (
                  <span className={styles.whoEmail}>
                    {entry.name ?? entry.summary}
                  </span>
                )}
                {entry.name === null ? (
                  <div className={styles.when}>
                    the row is gone; the ledger kept the act
                  </div>
                ) : null}
              </td>
              <td className={styles.when}>{stamp(entry.at)}</td>
              <td>
                {entry.status ? (
                  <Status
                    code={entry.status}
                    label={POOL_STATUS[entry.status] ?? entry.status}
                  />
                ) : (
                  <span className={styles.when}>—</span>
                )}
              </td>
              <td>
                {/*
                  A box only where there is something to take back. A row that
                  is already in draft, already discontinued or already deleted
                  has no gesture left, and a tickable box beside it would be a
                  control that does nothing — `revert` would not match the row
                  either, so the box would lie about the outcome as well.
                */}
                {entry.live && entry.id ? (
                  <label className={styles.facetItem}>
                    <input type="checkbox" name="id" value={entry.id} />
                    <span>Withdraw</span>
                  </label>
                ) : (
                  <span className={styles.when}>already out of the pool</span>
                )}
              </td>
            </TableRow>
          ))}
        </tbody>
      </table>

      {share.live > 0 ? (
        <div className={styles.buttonRow}>
          <button name="scope" value="ticked" className={styles.buttonDanger}>
            Send what is ticked back to draft
          </button>
          <button name="scope" value="run" className={styles.buttonQuiet}>
            Send all {share.live} back
          </button>
          <span className={styles.hint}>
            {share.live} of these {share.entries.length} are still offered. A
            draft row is invisible to the engine; nothing else about it changes,
            and offering it again is one click on the pool&rsquo;s own screen.
          </span>
        </div>
      ) : (
        <p className={styles.hint}>
          None of these are offered any more, so there is nothing here to
          withdraw.
        </p>
      )}
    </form>
  );
}

/* ── the other half of the ledger ───────────────────────────────────── */

/**
 * WHAT THE DESK HAS VETOED.
 *
 * The point of showing it under the feed rather than only inside the runs: a
 * revert is a JUDGEMENT, and the list of them is the record of what the house
 * decided a seeder should not have offered. Read down it and you are reading
 * the shape of what the next seeder run gets wrong.
 */
function Vetoes({ list }: { list: readonly Veto[] }) {
  if (list.length === 0) return null;

  return (
    <section className={styles.panel}>
      <h2 className={styles.panelHead}>
        <span>What the desk has taken back</span>
        <span>{list.length}</span>
      </h2>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>What</th>
            <th>Who</th>
            <th>When</th>
          </tr>
        </thead>
        <tbody>
          {list.map((veto) => (
            <tr key={veto.entry}>
              <td>
                {veto.summary}
                <div className={styles.when}>{veto.action}</div>
              </td>
              <td>{veto.who}</td>
              <td className={styles.when}>{stamp(veto.at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
