import Link from "next/link";

import { query } from "@/lib/db";
import {
  BANK_KINDS,
  DAY_PHASES,
  POOL_STATUS,
  leadDays,
  shipsWord,
} from "@/lib/desk/labels";
import {
  BANK_FROM,
  BANK_ORDER,
  BANK_PER_PAGE,
  NEEDS_NOTHING,
  POOL_STATUSES,
  SHIPPING,
  bankList,
} from "@/lib/desk/lists";
import {
  requirementVocabulary,
  requirementsForMany,
  type CarriedRequirement,
} from "@/lib/desk/requirements";
import { one, passHref } from "@/lib/desk/review";

import styles from "../../desk.module.css";
import { Chips, Empty, Head, Seam, Status, StatusLegend, TableRow } from "../bits";
import { setBankStatus } from "./actions";
import { refusePoolRow } from "../refuse";

/**
 * THE BANK — pool-selected atmosphere, per destination.
 *
 * The same instrument /desk/dishes is, for the same reason: the pool is
 * per-destination and four-kinded, so the question a curator actually asks here
 * — "what does Havana have for after dark that needs no door" — cannot be asked
 * of a list. Every control is a GET parameter, so a filtered view is a URL she
 * can send to somebody, and there is no client JavaScript on this screen.
 *
 * ── HOW TO READ THE COLUMNS, WHICH IS THE WHOLE DESIGN PROBLEM ───────
 *
 * Three of this pool's values are named the opposite of what they mean, and a
 * curator who reads them wrongly will TAG ROWS to match the wrong reading. So
 * the table never prints the stored word for them:
 *
 *   phase `all`      printed "no opinion", lower case. It is not "All" and not
 *                    "always" — it is the absence of a claim about the hour.
 *                    Four real times of day sit above it and run as the day
 *                    runs: daylight, dusk, dark, dawn. Dawn is db/033's, and it
 *                    is NOT dark — it is the windows going blue.
 *   ships `false`    printed "Owned if present", a sentence, never a blank cell
 *                    or an unticked box. Both of those read as "out of stock",
 *                    which is the one thing it does not mean.
 *   no requirement   printed "works anywhere", lower case, never left blank. An
 *                    empty cell is the one place a curator reads a gap, and
 *                    db/020 is explicit that this is a complete answer: "UNTAGGED
 *                    MEANS WORKS ANYWHERE, and that is the founder's instruction
 *                    as well as the safe default."
 *
 * The typographic rule that follows from those three, and is stated in the note
 * on the screen: A CAPITAL IS A CLAIM, lower case is the absence of one.
 *
 * ── WHERE IT CAN HAPPEN, AFTER db/033 ───────────────────────────────
 *
 * The column used to read `bank_item.venue`. That column is gone and so is the
 * `bank_venue` type: a bank item's venue requirement now lives in
 * `ingredient_requirement` beside every other pool's, in the one vocabulary
 * `structural_requirement` holds. The grades survive the move and are still
 * never collapsed into one control with an on and an off — a requirement some
 * room REFUSES is drawn as a veto chip, the mark the rest of the desk gives a
 * thing that rules an evening out; a requirement no room refuses is plain text.
 * The mark is derived from `venue_affordance` rather than from a list here, so
 * it means exactly "this can delete a deliverable".
 *
 * ── GESTURES ARE NOT HERE. NEITHER IS THE DESTINATION'S OWN ──────────
 *
 * db/031 kept the gesture off this table on purpose — it is INVARIANT per
 * destination and the bank is only what selection chooses among. Filter to one
 * destination and it is shown at the foot of this screen, read-only, with where
 * it is edited. db/033's `world.venue_requirement` is shown the same way and for
 * a sharper reason: every line in a room that presupposes outdoors inherits a
 * constraint none of them declared, and a per-row column would say it a hundred
 * times and imply it was theirs.
 */

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  slug: string;
  name: string;
  description: string;
  kind: string;
  phase: string;
  min_lead_days: number | string | null;
  ships: boolean;
  /** numeric(4,3) — a STRING out of node-postgres. Never compared as a number. */
  weight: string;
  status: string;
  world_name: string;
  card_id: string | null;
  card_name: string | null;
  /** count(*) is bigint, which node-postgres hands back as a STRING. */
  ingredients: string;
  /** db/044. NULL when the object is not a take-home at all — it stays. */
  take_home_quantity: string | null;
};

type Destination = {
  id: string;
  slug: string;
  name: string;
  gesture: string | null;
  gesture_note: string | null;
  /** db/033 — what this destination's deliverable presupposes. Never scored. */
  venue_requirement: string | null;
  venue_requirement_label: string | null;
  venue_requirement_demand: string | null;
};

/**
 * THE FILTERS ARE NOT DECIDED HERE. src/lib/desk/lists.ts holds them, together
 * with this table's FROM and ORDER BY, because a review pass over this screen
 * has to walk the sequence this screen is showing — the same filters, the same
 * order, asked once. `NEEDS_NOTHING` and `SHIPPING` moved there with them; the
 * arguments for both are at their new home.
 */

const label = (
  list: readonly { code: string; label: string }[],
  code: string
) => list.find((entry) => entry.code === code)?.label ?? code;

/**
 * WHAT ONE LINE NEEDS OF THE ROOM, and the cell where db/033's grades survive.
 *
 * A requirement some room REFUSES is drawn with the mark the rest of the desk
 * gives a veto, because carrying it can remove this line from a package. One no
 * room refuses is plain text beside it, and the two are NEVER one control with
 * an on and an off — that distinction was the whole reason the dropped
 * `bank_venue` was not a boolean, and it does not depend on the column that
 * held it. Which is which comes from `venue_affordance`, the same table the
 * pruning reads, rather than from a list kept here.
 *
 * NO ROW PRINTS WORDS, never a blank cell: "works anywhere", lower case, under
 * the rule stated in the note on the screen — a capital is a claim, lower case
 * is the absence of one. db/020 is explicit that the absence is a complete
 * answer, and an empty cell is the one place a curator reads a gap.
 */
function Needs({ needs }: { needs?: readonly CarriedRequirement[] }) {
  const list = needs ?? [];
  if (list.length === 0) return <>works anywhere</>;
  const vetoes = list.filter((one) => one.vetoes);
  const soft = list.filter((one) => !one.vetoes);
  return (
    <>
      {vetoes.length > 0 ? (
        <Chips items={vetoes.map((one) => one.label)} tone="no" />
      ) : null}
      {soft.length > 0 ? <div>{soft.map((one) => one.label).join(" · ")}</div> : null}
    </>
  );
}

export default async function BankPage({
  searchParams,
}: PageProps<"/desk/bank">) {
  const params = await searchParams;

  const [destinations, vocabulary] = await Promise.all([
    query<Destination>(
      `select w.id, w.slug::text as slug, w.name, w.gesture, w.gesture_note,
              w.venue_requirement,
              k.label  as venue_requirement_label,
              k.demand as venue_requirement_demand
         from world w
         left join structural_requirement k on k.code = w.venue_requirement
        where w.status <> 'retired'
        order by w.name`
    ),
    // The filter's vocabulary, read rather than declared, in db/020's own
    // `position` order — which is what sits `outdoor_access` directly under
    // `requires_outdoors` in the select instead of four rows away.
    requirementVocabulary(),
  ]);

  // Resolved once, in src/lib/desk/lists.ts, so that a review pass over this
  // screen walks the sequence this screen shows. Every argument for what each
  // control means — the phase sentinel, the requirement sentinel, why a grade
  // is not widened into its lesser one — travelled there with the code.
  const list = bankList(params, {
    destinations: destinations.map((row) => row.slug),
    requirements: vocabulary.map((entry) => entry.code),
  });
  const q = list.value.q;
  const destination = list.value.destination;
  const kind = list.value.kind;
  const phase = list.value.phase;
  const needs = list.value.needs;
  const shipping = list.value.ships;
  const status = list.value.status;
  const page = Math.max(1, Number(one(params.page)) || 1);

  const values = [...list.binds];

  const filter = list.where;

  const counted = await query<{ total: string; everything: string }>(
    `select (select count(*) from ${BANK_FROM} ${filter}) as total,
            (select count(*) from bank_item) as everything`,
    values
  );

  // Both counts arrive as STRINGS. Parsed once, here, and never compared in the
  // shape they arrived in.
  const matched = Number(counted[0]?.total ?? 0);
  const everything = Number(counted[0]?.everything ?? 0);
  const pages = Math.max(1, Math.ceil(matched / BANK_PER_PAGE));
  const current = Math.min(page, pages);
  const offset = (current - 1) * BANK_PER_PAGE;

  const rows = await query<Row>(
    `select b.id, b.slug::text as slug, b.name, b.description,
            b.kind::text as kind, b.phase::text as phase,
            b.min_lead_days, b.ships,
            b.weight::text as weight, b.status::text as status,
            b.take_home_quantity::text as take_home_quantity,
            -- Every destination the item claims, not one. db/043 made this an
            -- array; joining them for display rather than showing the first is
            -- the difference between a curator seeing a second home and never
            -- learning it exists.
            array_to_string(b.world_names, ' · ') as world_name,
            c.id as card_id, c.name as card_name,
            (select count(*) from bank_item_ingredient i
              where i.bank_item_id = b.id) as ingredients
       from ${BANK_FROM}
       left join bank_item c on c.id = b.technique_card_id
       ${filter}
      order by ${BANK_ORDER}
      limit ${BANK_PER_PAGE} offset ${offset}`,
    values
  );

  // One query for the whole page rather than one per row. A row that is ABSENT
  // from this map carries no requirement, which is the claim that it works
  // anywhere — the cell below prints those words rather than leaving a blank,
  // because a blank is the one place a curator reads a gap.
  const carried = await requirementsForMany(
    "bank_item",
    rows.map((row) => row.id)
  );

  /** This view's URL with one thing changed. Paging must not drop the filters. */
  const href = (changes: Record<string, string>) => {
    const next = new URLSearchParams();
    const base: Record<string, string> = {
      q,
      destination,
      kind,
      phase,
      needs,
      ships: shipping,
      status,
      page: String(current),
    };
    for (const [key, value] of Object.entries({ ...base, ...changes })) {
      if (!value) continue;
      if (key === "page" && value === "1") continue;
      next.set(key, value);
    }
    const search = next.toString();
    return search ? `/desk/bank?${search}` : "/desk/bank";
  };

  const filtered = list.filtered;
  const first = matched === 0 ? 0 : offset + 1;
  const last = Math.min(offset + BANK_PER_PAGE, matched);
  const house = destinations.find((row) => row.slug === destination) ?? null;

  return (
    <>
      <Head eyebrow="The bank" title="Atmosphere">
        <Link href="/desk/bank/new" className={styles.button}>
          Add to the bank
        </Link>
      </Head>

      <p className={styles.note}>
        Goods, host acts, games the house has out, and printed cards — one pool,
        per destination, chosen a few at a time per package. The four kinds are
        one table because their mechanics are identical and they differ only in
        what a curator calls them. Read the columns this way:{" "}
        <strong>a capital is a claim, lower case is the absence of one</strong>.
        &ldquo;no opinion&rdquo; under Time of day means this line says nothing
        about the hour — not that it suits every hour. &ldquo;Owned if
        present&rdquo; under What arrives means the house sends nothing and the
        scene card only glances at it — it is not out of stock. &ldquo;works
        anywhere&rdquo; under What it needs of the room means no requirement is
        declared, which is a complete answer and the safe one.
      </p>

      <p className={styles.note}>
        What a line needs of the room is the same vocabulary a menu, a drink, a
        dish, a game and a product use — db/033 unified it rather than bridging
        two of them. A requirement drawn as a{" "}
        <strong>veto</strong> is one some room actually refuses, so carrying it
        can remove the line from a package; one drawn as plain text is not
        refused anywhere and prunes nothing on its own.{" "}
        <strong>
          &ldquo;Needs a door to somewhere&rdquo; is a grade of &ldquo;Needs
          outdoors&rdquo;, not a sibling
        </strong>{" "}
        — a terrace, a stoop, a balcony, a yard, and anything that satisfies the
        harder one satisfies it. The filter matches the tag a line actually
        carries and does not widen one grade into the other.
      </p>

      <form method="get" action="/desk/bank" className={styles.buttonRow}>
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
          name="kind"
          defaultValue={kind}
          aria-label="What it is"
          className={styles.select}
        >
          <option value="">Every kind</option>
          {BANK_KINDS.map((entry) => (
            <option key={entry.code} value={entry.code}>
              {entry.label}
            </option>
          ))}
        </select>
        <select
          name="phase"
          defaultValue={phase}
          aria-label="Time of day"
          className={styles.select}
        >
          {/*
            "Any time of day" is NO FILTER. "No opinion" is a filter, for the
            rows that make no claim about the hour. Two different things, and
            the reason the default value here is "" rather than "all".
          */}
          <option value="">Any time of day</option>
          {DAY_PHASES.map((entry) => (
            <option key={entry.code} value={entry.code}>
              {entry.code === "all"
                ? "Only the ones with no opinion"
                : entry.label}
            </option>
          ))}
        </select>
        <select
          name="needs"
          defaultValue={needs}
          aria-label="What it needs of the room"
          className={styles.select}
        >
          {/*
            "Whatever it needs" is NO FILTER. "Only the ones that need nothing"
            is a filter, over the absence of a row — the same distinction the
            phase select draws above, and the reason the default here is ""
            rather than the sentinel.
          */}
          <option value="">Whatever it needs</option>
          <option value={NEEDS_NOTHING}>
            Only the ones that need nothing
          </option>
          {vocabulary.map((entry) => (
            <option key={entry.code} value={entry.code}>
              {entry.label}
            </option>
          ))}
        </select>
        <select
          name="ships"
          defaultValue={shipping}
          aria-label="What arrives"
          className={styles.select}
        >
          <option value="">Ships or not</option>
          {SHIPPING.map((entry) => (
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
          <Link href="/desk/bank" className={styles.filter}>
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
              A boundary is a SPAN and not a disabled link, for the reason
              /desk/dishes gives: `aria-disabled` on an anchor is a lie a screen
              reader repeats, because the link still navigates.
            */}
            {current > 1 ? (
              <Link
                href={href({ page: String(current - 1) })}
                className={styles.filter}
              >
                Previous
              </Link>
            ) : null}
            <span className={styles.hint}>
              Page {current} of {pages}
            </span>
            {current < pages ? (
              <Link
                href={href({ page: String(current + 1) })}
                className={styles.filter}
              >
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
              Nothing matches those filters.{" "}
              <Link href="/desk/bank">Clear them</Link> to see the whole pool.
            </>
          ) : (
            <>
              Nothing in the bank yet.{" "}
              <Link href="/desk/bank/new">Add the first line</Link> — one at a
              time is the common case here, and an item arrives as a draft
              because offering it is a curator&rsquo;s decision.
            </>
          )}
        </Empty>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>The line</th>
              <th>What it is</th>
              <th>Time of day</th>
              <th>What it needs of the room</th>
              <th>What arrives</th>
              <th>Lead time</th>
              <th>Card</th>
              {/* WHO KEEPS IT — added because its absence read as a defect in
                  the CONTENT. The founder, reviewing the held proposals:
                  "some of the atmosphere ideas are very off - why would we
                  give away a platter or the tablecloth?" Nobody proposed
                  giving away a platter. Westhampton's is `table set` and stays
                  on the table; the corno beside it is `per_guest` and leaves
                  with everybody. Both are kind `good`, both rendered as "A
                  good", and take_home_quantity — which is exactly this
                  distinction, and has been on the row since db/044 — was not
                  shown anywhere on the screen.
                  So a list that could not tell "stays" from "thirty of these
                  go home" made the catalogue look wrong. Rule 23: a mechanism
                  that invites misreading is a defect even when it works. */}
              <th>Who keeps it</th>
              <th>Destination</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, seat) => (
              <TableRow key={row.id} status={row.status}>
                <td>
                  {/*
                    Into the review, not just into the row: what travels is this
                    view's filters and the place this line holds in them, so
                    Next is the next line of THIS pool and not of a default one.
                    Its place counts from the first row of the whole filtered
                    set, not of this page — a pass runs across pages.
                  */}
                  <Link
                    href={passHref(
                      `/desk/bank/${row.id}`,
                      list.search,
                      offset + seat + 1
                    )}
                    className={styles.whoEmail}
                  >
                    {row.name}
                  </Link>
                  <div className={styles.when}>
                    {row.slug} · weight {row.weight}
                    {Number(row.ingredients) > 0
                      ? ` · ${row.ingredients} to buy`
                      : ""}
                  </div>
                </td>
                <td className={styles.numeric}>{label(BANK_KINDS, row.kind)}</td>
                <td className={styles.numeric}>
                  {/*
                    LOWER CASE IS THE ABSENCE OF A CLAIM. `all` is db/031's
                    "no opinion" and is deliberately not printed as "All",
                    which a curator reads as "every phase".
                  */}
                  {row.phase === "all"
                    ? "no opinion"
                    : label(DAY_PHASES, row.phase)}
                </td>
                <td>
                  <Needs needs={carried.get(row.id)} />
                </td>
                {/*
                  BOTH STATES ARE A SENTENCE. An unticked box or a blank cell
                  here would read as "out of stock", which is the one thing
                  `ships = false` does not mean.
                */}
                <td>{shipsWord(row.ships)}</td>
                <td className={styles.numeric}>{leadDays(row.min_lead_days)}</td>
                <td>
                  {row.card_id ? (
                    <Link
                      href={`/desk/bank/${row.card_id}`}
                      className={styles.link}
                    >
                      {row.card_name}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td>
                  {row.take_home_quantity === "per_guest"
                    ? "Each guest"
                    : row.take_home_quantity === "single_artifact"
                      ? "One of them, taken"
                      : "Stays"}
                </td>
                <td>{row.world_name}</td>
                <td>
                  <Status code={row.status} label={POOL_STATUS[row.status]} />
                </td>
                <td>
                  <form action={setBankStatus}>
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
                  {/* NO ON A DRAFT IS A DELETION, AND ONLY ON A DRAFT.
                      A draft has never been issued — `status = 'active'` is the
                      issuable predicate — so refusing one destroys nothing
                      anybody was given. An offered row may have been issued and
                      the database refuses to delete it out from under a Revelle
                      (db/002's join is `on delete restrict`); that one is
                      retired, which keeps its reason. The button is therefore
                      absent rather than disabled: a control that cannot act is
                      worse than no control (rule 23). */}
                  {row.status === "draft" ? (
                    <form action={refusePoolRow}>
                      <input type="hidden" name="entity_table" value="bank_item" />
                      <input type="hidden" name="id" value={row.id} />
                      <input type="hidden" name="back" value="/desk/bank" />
                      <button className={styles.filter}>No</button>
                    </form>
                  ) : null}
                </td>
              </TableRow>
            ))}
          </tbody>
        </table>
      )}

      {/*
        WHAT THIS DESTINATION PRESUPPOSES — db/033's `world.venue_requirement`,
        and only when the screen is filtered to one destination, because outside
        that it is not one fact.

        It belongs here rather than in a column for the reason the gesture does:
        every line in a room that presupposes outdoors inherits the constraint,
        none of them declared it, and printing it per row would say it a hundred
        times and imply it was theirs. A curator should be able to see, without
        leaving this screen, that the whole room is already outdoors — otherwise
        she declares `requires_outdoors` on line after line that never needed to
        carry it.

        READ-ONLY. It is the destination's, and db/033 is emphatic about what it
        is not: read at the reveal and SURFACED, never scored. Venue must never
        touch which destination a party is in — standing rule 2, enforced in
        vector.ts, db/020 and selection.test.ts.
      */}
      {house?.venue_requirement ? (
        <Seam title={`${house.name} already presupposes a room`}>
          Its deliverable{" "}
          <strong>
            {house.venue_requirement_demand ?? house.venue_requirement}
          </strong>
          {house.venue_requirement_label
            ? ` — “${house.venue_requirement_label}”`
            : ""}
          . Every line above inherits that whether or not it declares anything
          of its own: a host whose room cannot do it was never going to receive
          this room at all. So declaring the same requirement on a line here is
          usually redundant, and worth doing only where the line needs it and
          the rest of the room does not. It is read at the reveal and surfaced,
          never scored — venue never touches which destination she gets — and it
          is edited on the destination record.
        </Seam>
      ) : null}

      {house ? (
        <Seam title={`The gesture at ${house.name} is not in this pool`}>
          {house.gesture ? (
            <>
              <strong>{house.gesture}</strong>
              {house.gesture_note ? ` — ${house.gesture_note}` : ""}. It is the
              one thing that always happens here, so it is invariant and not
              something selection chooses among — an invariant in a pool of
              variables eventually gets left out of a package. It lives on the
              destination record and is edited there, not here.
            </>
          ) : (
            <>
              Nothing written yet. A gesture is the one thing that always
              happens in this room, so it is invariant rather than pool content
              and it lives on the destination record, not in the bank. It is not
              editable from this screen and will not become so.
            </>
          )}
        </Seam>
      ) : null}
    </>
  );
}
