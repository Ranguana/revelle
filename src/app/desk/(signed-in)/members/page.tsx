import Link from "next/link";

import { listMembers, REVELLE_STATUS } from "@/lib/desk/members";
import { longDate } from "@/lib/portal/sections";

import styles from "../../desk.module.css";
import { Chips, Empty, Head, Status, StatusLegend, TableRow } from "../bits";

/**
 * THE MEMBERS. The screen that did not exist.
 *
 * `customer.accepted_at` has been the one door since db/015, and
 * src/lib/desk/acceptance.ts wired the button that opens it — but nothing
 * anywhere listed the people it had been opened for. Membership was a fact you
 * could only find by opening an application and reading a panel, one applicant
 * at a time, and only if you already knew which one to open.
 *
 * ── A MEMBER IS `accepted_at is not null` AND NOTHING ELSE ───────────
 *
 * The definition lives in src/lib/desk/members.ts as one named predicate, used
 * by every statement behind this screen. It is deliberately not
 * `quiz_response.status`, not "has a revelle row", and not "has signed in" —
 * db/015 refused to key a portal off workflow, and a list that quietly used a
 * looser rule would be a second definition of membership that disagreed with
 * the one the login path enforces.
 *
 * ── WHAT THE COLUMNS ARE FOR ─────────────────────────────────────────
 *
 * The questions a person actually has in front of this list: who did we take
 * on and when, who took them on, what have they got, and is anything coming.
 * Not a metric among them. The one number that looks like a metric — how many
 * Revelles, by state — is a fact about rows, and it is the answer to "is there
 * anything for her yet", which is the reason somebody opens this.
 *
 * ── LAST SIGNED IN, NOT LAST ACTIVE ──────────────────────────────────
 *
 * Because last active is not derivable. `login_session.last_seen_at` exists and
 * would be the better answer, but src/lib/session.ts only ever updates
 * `staff.last_seen_at`; for a member that column sits at its default forever.
 * So the column says what the data says — when a session of hers was last
 * opened — and is named that. See the note in src/lib/desk/members.ts.
 *
 * Same idiom as /desk/dishes throughout: a plain `<form method="get">`, every
 * control a URL parameter, no client JavaScript, and the row coloured by its
 * status with the legend that names what the colour means.
 */

export const dynamic = "force-dynamic";

const PER_PAGE = 100;

/** The filter's own vocabulary: the four statuses, plus "she has none". */
const STATES: readonly { code: string; label: string }[] = [
  { code: "none", label: "Nothing yet" },
  ...Object.entries(REVELLE_STATUS).map(([code, label]) => ({
    code,
    label: `Newest is ${label.toLowerCase()}`,
  })),
];

/** One value out of the query string, or "" — never a decision, only a read. */
function one(value: string | string[] | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

/** A value that must be one of a closed set, or "" for "no filter". */
function oneOf(
  value: string | string[] | undefined,
  allowed: readonly string[]
): string {
  const picked = one(value);
  return allowed.includes(picked) ? picked : "";
}

export default async function MembersPage({
  searchParams,
}: PageProps<"/desk/members">) {
  const params = await searchParams;

  const q = one(params.q).slice(0, 80);
  const state = oneOf(params.state, STATES.map((entry) => entry.code));
  const page = Math.max(1, Number(one(params.page)) || 1);

  // Asked once for the count and once for the rows, inside the helper, so the
  // paging line and the page cannot disagree about what matched.
  const first = await listMembers({
    q,
    state,
    limit: PER_PAGE,
    offset: (page - 1) * PER_PAGE,
  });

  const pages = Math.max(1, Math.ceil(first.matched / PER_PAGE));
  const current = Math.min(page, pages);
  // A page number past the end is a URL somebody kept, not a mistake worth an
  // error. Re-read at the last real page rather than showing an empty table
  // under a line that says there are forty of them.
  const found =
    current === page
      ? first
      : await listMembers({
          q,
          state,
          limit: PER_PAGE,
          offset: (current - 1) * PER_PAGE,
        });

  const rows = found.rows;
  const filtered = Boolean(q || state);
  const offset = (current - 1) * PER_PAGE;
  const from = found.matched === 0 ? 0 : offset + 1;
  const to = Math.min(offset + PER_PAGE, found.matched);

  /** This view's URL with one thing changed. Paging must not drop the filters. */
  const href = (changes: Record<string, string>) => {
    const next = new URLSearchParams();
    const base: Record<string, string> = { q, state, page: String(current) };
    for (const [key, value] of Object.entries({ ...base, ...changes })) {
      if (!value) continue;
      if (key === "page" && value === "1") continue;
      next.set(key, value);
    }
    const search = next.toString();
    return search ? `/desk/members?${search}` : "/desk/members";
  };

  return (
    <>
      <Head eyebrow="The société" title="Members" />

      <p className={styles.note}>
        Everyone the house has taken on — <code>customer.accepted_at</code>, set
        by hand from an application and by nothing else. An applicant is not on
        this list however far along her application is: acceptance is its own
        act, it is what decides whether a sign-in link is ever mailed to her,
        and there is no undo. Her portal can be read from here without signing
        in as her.
      </p>

      <form method="get" action="/desk/members" className={styles.buttonRow}>
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search a name or an address"
          aria-label="Search a name or an address"
          className={styles.input}
        />
        <select
          name="state"
          defaultValue={state}
          aria-label="What she has"
          className={styles.select}
        >
          <option value="">Anything, or nothing</option>
          {STATES.map((entry) => (
            <option key={entry.code} value={entry.code}>
              {entry.label}
            </option>
          ))}
        </select>
        <button className={styles.button}>Filter</button>
        {filtered ? (
          <Link href="/desk/members" className={styles.filter}>
            Clear
          </Link>
        ) : null}
      </form>

      <div className={styles.filters}>
        <span className={styles.hint}>
          {found.matched === 0
            ? filtered
              ? `Nobody matches, out of ${found.everything}`
              : "Nobody yet"
            : `${from}–${to} of ${found.matched}${
                filtered ? ` matched, out of ${found.everything}` : ""
              }`}
        </span>
        {pages > 1 ? (
          <>
            {/*
              A boundary is a SPAN and not a disabled link, for the reason
              /desk/dishes gives: `aria-disabled` on an anchor is a lie a
              screen reader repeats, because the link still navigates.
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

      {rows.length > 0 ? (
        <>
          <StatusLegend statuses={REVELLE_STATUS} />
          {/*
            THE HOLE IN THE LEGEND, SAID OUT LOUD.

            `revelle_status` has four values and bits.tsx's family map knows
            three of them — 'preview' is not in it. bits.tsx is explicit that a
            code it does not know gets NO colour rather than quietly borrowing
            one, which is the right refusal and leaves a row on this screen
            uncoloured with nothing to explain it. Saying so is cheaper than
            adding a meaning to a shared map from a screen that is not entitled
            to decide it.
          */}
          <p className={styles.hint}>
            A Revelle in preview has no family in the row-colour map, so its row
            is deliberately left uncoloured rather than borrowing a meaning
            nobody chose for it. Its status is on the row.
          </p>
        </>
      ) : null}

      {rows.length === 0 ? (
        <Empty>
          {filtered ? (
            <>
              Nobody matches those filters.{" "}
              <Link href="/desk/members">Clear them</Link> to see everybody.
            </>
          ) : (
            <>
              Nobody has been taken on yet. Membership is granted one applicant
              at a time, from &ldquo;Take her on&rdquo; on an application.
            </>
          )}
        </Empty>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Member</th>
              <th>Taken on</th>
              <th>What she has</th>
              <th>Next</th>
              <th>Last signed in</th>
              <th>Newest</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <TableRow key={row.id} status={row.newestStatus}>
                <td>
                  <div className={styles.who}>
                    {/*
                      db/001 does not ask for a name — staff fill it in — so
                      the address is what is always true and is always printed.
                      The link is her name where there is one, because that is
                      what somebody scanning is looking for.
                    */}
                    <Link
                      href={`/desk/members/${row.id}/portal`}
                      className={styles.whoEmail}
                    >
                      {row.name ?? row.email}
                    </Link>
                    <span className={styles.when}>{row.email}</span>
                    {row.name === null ? (
                      <span className={styles.when}>no name recorded</span>
                    ) : null}
                  </div>
                </td>

                <td className={styles.numeric}>
                  {row.acceptedOn ?? "—"}
                  <span className={styles.when}>
                    {row.acceptedBy ? `by ${row.acceptedBy}` : "who is not recorded"}
                  </span>
                </td>

                <td>
                  {row.revelles.total === 0 ? (
                    <span className={styles.factValue}>Nothing yet</span>
                  ) : (
                    <Chips items={tally(row.revelles)} />
                  )}
                  {row.revelles.total > 0 && row.revelles.openable === 0 ? (
                    <span className={styles.when}>nothing she can open</span>
                  ) : null}
                </td>

                <td className={styles.numeric}>
                  {row.nextDate ? longDate(row.nextDate) : "—"}
                </td>

                <td className={styles.numeric}>
                  {row.lastSignedIn ?? "never"}
                </td>

                <td>
                  {row.newestStatus ? (
                    <Status
                      code={row.newestStatus}
                      label={REVELLE_STATUS[row.newestStatus] ?? row.newestStatus}
                    />
                  ) : (
                    <span className={styles.factValue}>—</span>
                  )}
                </td>

                <td>
                  <Link
                    href={`/desk/members/${row.id}/portal`}
                    className={styles.filter}
                  >
                    Read her portal
                  </Link>
                </td>
              </TableRow>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

/**
 * What she has, as one chip per state that has anything in it.
 *
 * A state with nothing in it is not printed. Zeroes down a column read as a
 * report on what is missing, and what is missing from a member's shelf is the
 * house's business rather than a fact about her.
 */
function tally(revelles: {
  draft: number;
  preview: number;
  delivered: number;
  archived: number;
}): string[] {
  const out: string[] = [];
  for (const code of ["delivered", "preview", "draft", "archived"] as const) {
    const n = revelles[code];
    if (n > 0) out.push(`${n} ${REVELLE_STATUS[code].toLowerCase()}`);
  }
  return out;
}
