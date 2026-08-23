import Link from "next/link";

import { query } from "@/lib/db";
import {
  CEILING,
  pools,
  standing,
  worldStanding,
  type Ask,
  type Pool,
  type Standing,
  type WorldStanding,
} from "@/lib/desk/publish";

import styles from "../../desk.module.css";
import { Empty, Head, Seam } from "../bits";
import { publishSelected } from "./actions";

/**
 * PUBLISH.
 *
 * ── THE PROBLEM THIS SCREEN IS THE ANSWER TO ─────────────────────────
 *
 * Every seeder creates DRAFTS, because deciding that something is offered to a
 * customer is a curator's decision and not a script's. The rule is right. It
 * was also unoperable.
 *
 * render.yaml runs migrate plus six seeders on every deploy and none of them
 * passes `--activate`, so everything arrives in draft — 372 dishes, at the last
 * count. The one bulk gesture that could move them,
 * `npm run activate:catalogue -- --yes`, can only be typed inside a Render
 * shell, because the database has an empty ipAllowList and is unreachable from
 * any laptop by design. And the desk could publish one row at a time. Three
 * hundred and seventy-two times is not a decision, it is an afternoon.
 *
 * So the gate keeps its meaning and gains a handle. This is the same gesture
 * the script performs, calling the same functions in src/lib/desk/publish.ts,
 * with the one thing a shell cannot give: the LIST. She is saying yes to
 * specific things, so she is shown specific things, and she can untick any of
 * them before she says it.
 *
 * ── NO CLIENT JAVASCRIPT ─────────────────────────────────────────────
 *
 * A server component, a `<form>`, ticked checkboxes, one submit. Ticking every
 * box by default IS "publish the whole pool"; unticking is how she narrows it.
 * The one control that would need script — a select-all toggle — is the one the
 * default already does, so there is nothing here for a browser to run. Same
 * reason /desk/dishes is a plain GET form.
 *
 * ── WHAT IT WILL NOT DO ──────────────────────────────────────────────
 *
 * It does not withdraw. Offering something and taking it back are not one
 * control with two directions here, because they are not symmetrical: no seeder
 * in this repository can put a published row back into draft (see IRREVERSIBLE
 * in src/lib/desk/publish.ts), so the way back is deliberately the slow one —
 * one row at a time, on the pool's own screen, where the row can be looked at.
 * The seam at the bottom of this page says so out loud, along with the pools
 * that have no screen at all.
 */

export const dynamic = "force-dynamic";

/** `query` is exactly the shape the shared module asks for. */
const ask: Ask = query;

/**
 * Where a row of each pool can be looked at and, if it comes to it, withdrawn.
 *
 * A fact about the DESK's routes, not about the database, so it is written here
 * rather than derived from `ingredient_pool` — the registry has no column for
 * it and should not grow one. A pool that is absent is not a bug in this map;
 * it is a pool this screen can publish and the desk cannot otherwise show, and
 * the seam at the bottom names it for exactly that reason.
 */
const SCREENS: Readonly<Record<string, string>> = {
  // Added with /desk/bank. Without it the confirmation text tells a curator
  // "there is no desk screen for this pool, so there is no way back from here
  // at all" — in the warning for an IRREVERSIBLE bulk publish, which was false
  // the moment the section shipped.
  bank_item: "/desk/bank",
  menu: "/desk/menus",
  drink: "/desk/drinks",
  dish: "/desk/dishes",
  game: "/desk/games",
  product: "/desk/products",
  world: "/desk/destinations",
};

/** The desk's word for `world`. `ingredient_pool.label` says "Creative worlds". */
const WORLD_LABEL = "Destinations";

function one(value: string | string[] | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export default async function PublishPage({
  searchParams,
}: PageProps<"/desk/publish">) {
  const params = await searchParams;

  const registry = await pools(ask);
  const wanted = one(params.pool);
  const world = wanted === "world";

  // Every pool is counted, because the index is a picture of the whole gate and
  // a screen that only knew about the pool she had already opened would not be
  // one. The lists come back capped (see CEILING) and the index shows three
  // names off each; the panel below shows the one pool's list in full.
  const standings: Standing[] = await Promise.all(
    registry.map((pool) => standing(ask, pool))
  );
  const destinations = await worldStanding(ask);

  const chosen = standings.find((row) => row.pool.code === wanted) ?? null;
  const unscreened = missing(registry);

  const published = Number(one(params.published));
  const asked = Number(one(params.asked));
  const refused = one(params.refused);

  const draftTotal =
    standings.reduce((sum, row) => sum + row.draft, 0) + destinations.draft;

  return (
    <>
      <Head eyebrow="The library" title="Publish">
        <Link href="/desk/matrix" className={styles.filter}>
          Connections
        </Link>
        <Link href="/desk/coverage" className={styles.filter}>
          Coverage
        </Link>
      </Head>

      <p className={styles.note}>
        Every seeder creates drafts, because deciding that something is offered
        to a customer is a curator&rsquo;s decision and not a script&rsquo;s.
        This is where that decision gets made for more than one thing at a time.
        The engine cannot see a draft, so nothing below has ever reached a
        member — and nothing below goes back to draft on its own once it has.
      </p>

      {refused ? <p className={styles.error}>{refused}</p> : null}
      {published > 0 ? (
        <p className={styles.ok}>
          {published} offered
          {asked > published
            ? ` — ${asked - published} of the ${asked} ticked had already left draft and were untouched.`
            : "."}
        </p>
      ) : null}

      <div className={styles.filters}>
        <Link
          href="/desk/publish"
          className={styles.filter}
          aria-current={!chosen && !world}
        >
          Everything
        </Link>
        {registry.map((pool) => (
          <Link
            key={pool.code}
            href={`/desk/publish?pool=${pool.code}`}
            className={styles.filter}
            aria-current={chosen?.pool.code === pool.code}
          >
            {pool.label}
          </Link>
        ))}
        <Link
          href="/desk/publish?pool=world"
          className={styles.filter}
          aria-current={world}
        >
          {WORLD_LABEL}
        </Link>
        <span className={styles.hint}>
          {draftTotal === 0
            ? "nothing in draft anywhere"
            : `${draftTotal} in draft across the library`}
        </span>
      </div>

      {chosen ? (
        <PoolPanel board={chosen} />
      ) : world ? (
        <WorldPanel board={destinations} />
      ) : (
        <Board standings={standings} destinations={destinations} />
      )}

      <Seam title="What this screen will not do">
        It only ever moves a row OUT of draft. Withdrawing something is one row
        at a time, on the pool&rsquo;s own screen, on purpose — no seeder in this
        repository can put a published row back, so there is no fast way to
        reverse a fast mistake.{" "}
        {unscreened.length > 0 ? (
          <>
            And {unscreened.join(", ")} can be published here and looked at
            nowhere else in the desk: there is no list screen for{" "}
            {unscreened.length === 1 ? "it" : "them"} yet, so what is offered
            there can only be read back out of the database.
          </>
        ) : null}{" "}
        It covers what <code>npm run activate:catalogue</code> covers, out of
        the same <code>ingredient_pool</code> registry and through the same
        functions, so a seventh pool appears on both without an edit to either.
      </Seam>
    </>
  );
}

/** Pools this screen can publish and no other desk screen can show. */
function missing(registry: readonly Pool[]): string[] {
  return registry
    .filter((pool) => !SCREENS[pool.code])
    .map((pool) => pool.label);
}

/* ── the index ──────────────────────────────────────────────────────── */

function Board({
  standings,
  destinations,
}: {
  standings: readonly Standing[];
  destinations: WorldStanding;
}) {
  const nothing =
    destinations.draft === 0 && standings.every((row) => row.draft === 0);

  return (
    <>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Pool</th>
            <th>In draft</th>
            <th>Offered</th>
            <th>Some of what is waiting</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {standings.map((row) => (
            <tr key={row.pool.code}>
              <td>
                <Link
                  href={`/desk/publish?pool=${row.pool.code}`}
                  className={styles.whoEmail}
                >
                  {row.pool.label}
                </Link>
                <div className={styles.when}>
                  {row.pool.code} · offered means{" "}
                  <code>
                    {row.pool.activeColumn} = {row.pool.activeValue}
                  </code>
                </div>
              </td>
              <td className={styles.numeric}>{row.draft}</td>
              <td className={styles.numeric}>{row.active}</td>
              <td>{taste(row.drafts.map((item) => item.name))}</td>
              <td>
                {row.draft > 0 ? (
                  <Link
                    href={`/desk/publish?pool=${row.pool.code}`}
                    className={styles.filter}
                  >
                    Read the list
                  </Link>
                ) : null}
              </td>
            </tr>
          ))}

          {/*
            Destinations are last and are their own row rather than a seventh
            pool, because they are the one thing here with a rule attached: a
            destination is published only if it has a published voice. The count
            in this row is what CAN be published, not what is in draft, and the
            two differ — see the panel.
          */}
          <tr>
            <td>
              <Link href="/desk/publish?pool=world" className={styles.whoEmail}>
                {WORLD_LABEL}
              </Link>
              <div className={styles.when}>
                world · only with a published voice
              </div>
            </td>
            <td className={styles.numeric}>{destinations.draft}</td>
            <td className={styles.numeric}>{destinations.published}</td>
            <td>
              {destinations.voiced.length === 0
                ? destinations.mute.length > 0
                  ? `none — all ${destinations.mute.length} draft destinations are mute`
                  : "—"
                : taste(destinations.voiced.map((item) => item.name))}
            </td>
            <td>
              {destinations.draft > 0 ? (
                <Link href="/desk/publish?pool=world" className={styles.filter}>
                  Read the list
                </Link>
              ) : null}
            </td>
          </tr>
        </tbody>
      </table>

      {nothing ? (
        <Empty>
          Nothing is waiting. Every row in every pool has either been offered or
          been taken out of the running, which is what this screen looks like
          when the gate is clear.
        </Empty>
      ) : null}
    </>
  );
}

/** The first few names, so a count on the index is never only a count. */
function taste(names: readonly string[]): string {
  if (names.length === 0) return "—";
  const shown = names.slice(0, 3).join(", ");
  return names.length > 3 ? `${shown}, and ${names.length - 3} more` : shown;
}

/* ── one pool ───────────────────────────────────────────────────────── */

// `board` rather than `standing`, because `standing` is the module function
// this file imports and a shadowed name in a component is a name that reads
// wrong from three lines away.
function PoolPanel({ board }: { board: Standing }) {
  const { pool } = board;

  if (board.draft === 0) {
    return (
      <Empty>
        Nothing in the {pool.label.toLowerCase()} pool is in draft.{" "}
        {board.active} offered.
        {SCREENS[pool.code] ? (
          <>
            {" "}
            <Link href={SCREENS[pool.code]}>The pool</Link> is where one row
            goes back.
          </>
        ) : null}
      </Empty>
    );
  }

  return (
    <section className={styles.panel}>
      <h2 className={styles.panelHead}>
        <span>{pool.label} in draft</span>
        <span>
          {board.draft} waiting · {board.active} already offered
        </span>
      </h2>

      <p className={styles.note}>
        Every box is ticked. Untick what should stay in draft — what is left is
        what gets offered, and it is offered to every member the engine puts it
        in front of from that moment.
      </p>

      {board.beyond > 0 ? (
        <p className={styles.error}>
          Only the first {CEILING} are listed; {board.beyond} more are in
          draft and cannot be ticked from this page. Publish these, then come
          back — the list refills.
        </p>
      ) : null}

      <PublishForm
        pool={pool.code}
        items={board.drafts.map((item) => ({
          id: item.id,
          name: item.name,
        }))}
        warning={warning(pool)}
      />
    </section>
  );
}

/**
 * The sentence beside the tick, per pool.
 *
 * It is not the same sentence for everything, because the consequence is not
 * the same. What is common to all of them — that no seeder can reverse it — is
 * checked and argued in src/lib/desk/publish.ts, not asserted here.
 */
function warning(pool: Pool): string {
  const back = SCREENS[pool.code]
    ? "The only way back is one row at a time, by hand, at " +
      SCREENS[pool.code] +
      "."
    : "There is no desk screen for this pool, so there is no way back from " +
      "here at all.";
  return (
    "I am offering these to members. No seeder can undo it — `--activate` " +
    "only touches rows a seeder creates, and `--overwrite` rewrites the words " +
    "and never the status. " +
    back
  );
}

/* ── destinations ───────────────────────────────────────────────────── */

function WorldPanel({ board }: { board: WorldStanding }) {
  return (
    <>
      {board.voiced.length === 0 ? (
        <Empty>
          No draft destination has a published voice, so there is nothing here
          to publish. {board.published} are already out.
        </Empty>
      ) : (
        <section className={styles.panel}>
          <h2 className={styles.panelHead}>
            <span>Destinations that can speak</span>
            <span>
              {board.voiced.length} ready · {board.published} already
              published
            </span>
          </h2>

          <p className={styles.note}>
            A destination is published only if it has a published voice, and
            that rule is in the statement rather than in this list — ticking a
            mute destination could not publish it even if the box existed.
            Publishing sets the date it first went out, and db/001 holds the
            status and the date together.
          </p>

          <PublishForm
            pool="world"
            items={board.voiced.map((item) => ({
              id: item.id,
              name: `${item.name} (${item.slug})`,
            }))}
            warning={
              "I am publishing these destinations. Everything a member is sent " +
              "is written in the voice one of them carries. The only way back " +
              "is one at a time at /desk/destinations."
            }
          />
        </section>
      )}

      {/*
        THE AUTHORING QUEUE. Named rather than counted, exactly as the script
        names it: a destination with menus and drinks written for it and no
        voice is content nobody can deliver, and the list is the work.
      */}
      {board.mute.length > 0 ? (
        <section className={styles.panel}>
          <h2 className={styles.panelHead}>
            <span>Staying in draft — no published voice</span>
            <span>{board.mute.length}</span>
          </h2>
          <p className={styles.note}>
            A destination with a look and no voice cannot be written: no
            invitation, no menu card, no place cards. So it must not be offered,
            and this screen has no button that would. This is the authoring
            queue.
          </p>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Destination</th>
                <th>Menus written for it</th>
                <th>Drinks</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {board.mute.map((row) => (
                <tr key={row.id}>
                  <td>
                    <Link
                      href={`/desk/destinations/${row.id}`}
                      className={styles.whoEmail}
                    >
                      {row.name}
                    </Link>
                    <div className={styles.when}>{row.slug}</div>
                  </td>
                  <td className={styles.numeric}>{row.menus}</td>
                  <td className={styles.numeric}>{row.drinks}</td>
                  <td>
                    <Link
                      href={`/desk/destinations/${row.id}/voice`}
                      className={styles.filter}
                    >
                      Write the voice
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
    </>
  );
}

/* ── the form itself ────────────────────────────────────────────────── */

/**
 * One form, one action, one submit — the same shape /desk/matrix uses, for the
 * same reason: a form per row would be several hundred forms for no gain.
 *
 * The confirmation is a `required` checkbox rather than a second page. A second
 * page would show her a count she has already read; the checkbox makes her
 * re-read the sentence that says it cannot be taken back, in the same gesture,
 * with the list still in front of her. It is re-checked in the action, because
 * `required` is a courtesy the browser pays and an action is its own entry
 * point.
 */
function PublishForm({
  pool,
  items,
  warning,
}: {
  pool: string;
  items: readonly { id: string; name: string }[];
  warning: string;
}) {
  return (
    <form action={publishSelected}>
      <input type="hidden" name="pool" value={pool} />

      <div className={styles.pickList}>
        <ul className={styles.facetList}>
          {items.map((item) => (
            <li key={item.id}>
              <label className={styles.facetItem}>
                <input type="checkbox" name="id" value={item.id} defaultChecked />
                <span>{item.name}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>

      <label className={`${styles.facetItem} ${styles.pickConfirm}`}>
        <input type="checkbox" name="confirm" required />
        <span>{warning}</span>
      </label>

      <div className={styles.buttonRow}>
        <button className={styles.buttonDanger}>Offer what is ticked</button>
      </div>
    </form>
  );
}
