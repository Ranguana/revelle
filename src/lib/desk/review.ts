/**
 * SEQUENTIAL REVIEW — reading a list one row at a time without returning to it.
 *
 * Reviewing is not browsing. It is going through a set of things, forming a
 * judgement on each, and knowing when the set is finished. Without this module
 * that costs three moves per row — open, judge, back, find your place again —
 * and the expensive one is the last: the place is held in the reviewer's head
 * and it is dropped every time the list re-sorts under her.
 *
 * ── WHAT TRAVELS, AND WHAT IS RECOMPUTED ────────────────────────────
 *
 * Two query parameters, and no client state of any kind. The desk's screens
 * work without JavaScript on purpose and this one does too — Previous and Next
 * are ordinary links.
 *
 *   review  the LIST'S OWN FILTERS, as a query string. Its presence is what
 *           says "you are in a pass"; `review=` (empty) is a pass over an
 *           unfiltered list, which is why the code tests for the parameter
 *           rather than for a value. The page number is deliberately NOT in it:
 *           a pass runs across pages, and the page a row sits on is arithmetic.
 *   at      where she was, 1-based, when the link was made. A HINT AND NEVER AN
 *           AUTHORITY — see the ends, below.
 *
 * The ORDER is not carried, because carrying it would be carrying a snapshot. A
 * list of row ids in a URL is stale the moment anything is edited, and it is
 * also four kilobytes. Instead the pass carries the QUESTION — the filters —
 * and every view re-asks it. So "4 of 17" is true at the moment it is read
 * rather than true when the pass began, and a row that has been published,
 * withdrawn or reverted out of the filter says so instead of lying quietly.
 *
 * ── THE ENDS, WHICH ARE THE WHOLE DESIGN PROBLEM ────────────────────
 *
 * The first row has no Previous and the last has no Next, and neither WRAPS.
 * Wrapping around to the top of a set you are auditing is how a row gets judged
 * twice and another gets missed, and the reviewer cannot tell which happened.
 * A boundary is drawn as inert text rather than a disabled link, for the reason
 * /desk/bank's pager states: `aria-disabled` on an anchor is a lie a screen
 * reader repeats, because the link still navigates.
 *
 * A row can also leave the list WHILE SHE IS LOOKING AT IT. This is the common
 * case, not the exotic one: on a pass filtered to drafts, publishing the row in
 * front of her is exactly what removes it. That is what `at` is for. The live
 * sequence is always the authority on where a row IS; `at` is only consulted
 * when the row is no longer in it, and then it answers the one question the
 * sequence cannot — where she had got to. The row that has slid into that
 * position is the next one she has not seen, so Next is honest again with no
 * state kept anywhere.
 *
 * ── AND WHY NOTHING HERE ADVANCES ON ITS OWN ────────────────────────
 *
 * No action in this codebase redirects to the next row, and none should. Two
 * reasons, in order of weight:
 *
 *   1. The undo lands somewhere else. Publish and Withdraw sit beside each
 *      other and the second is the correction for the first; a page that moves
 *      after the first click means the correction is applied to a different
 *      row. That is a data bug dressed as a convenience.
 *   2. She never sees what she did. On a filtered pass the acted-on row leaves
 *      the sequence, so auto-advancing hides the result of the act that caused
 *      it. Staying put and saying "no longer in this list" reports the same
 *      fact and leaves the moving to her.
 *
 * So acting keeps her where she is, the strip re-reads the list, and Next — one
 * deliberate click — is already pointing at the right row.
 */

/** The two parameters a pass travels on. Nothing else in a URL is reserved. */
export const REVIEW = "review";
export const AT = "at";

/** A page's `searchParams`, before anything has decided what any of it means. */
export type Params = {
  readonly [key: string]: string | string[] | undefined;
};

/** A carried filter string longer than this is not a filter, it is an attack. */
const MAX_SEARCH = 500;

/** No pass walks further than this. See `capped` on the strip. */
export const CAP = 1000;

/** One value out of the query string, or "" — never a decision, only a read. */
export function one(value: string | string[] | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

/** A value that must be one of a closed set, or "" for "no filter". */
export function oneOf(
  value: string | string[] | undefined,
  allowed: readonly string[]
): string {
  const picked = one(value);
  return allowed.includes(picked) ? picked : "";
}

/**
 * A reader over either a screen's searchParams or a carried filter string.
 *
 * The point of the pair is that ONE function per list resolves its controls,
 * and both the list screen and the review pass call that one function. A second
 * copy of "what this list filters on" is the drift this whole module exists to
 * avoid: the pass would then walk a different set from the one on the screen,
 * and nothing would ever say so.
 */
export function reader(source: Params | string): (key: string) => string {
  if (typeof source === "string") {
    const carried = new URLSearchParams(source.slice(0, MAX_SEARCH));
    return (key) => (carried.get(key) ?? "").trim();
  }
  return (key) => one(source[key]);
}

/* ── a list's filters ───────────────────────────────────────────────── */

/**
 * One control on a list screen: its query-string key, its resolved value, and
 * the clause it contributes when it is set.
 *
 * Built as a list of these rather than as hand-numbered SQL for the reason
 * /desk/dishes gives where the idiom started: adding a filter is one line and
 * cannot get the placeholder numbering wrong, which is the bug every
 * hand-numbered dynamic WHERE eventually has.
 */
export type Control = {
  /** the query-string key, which is also the form control's name */
  readonly name: string;
  /** the value, already validated by whoever built the control */
  readonly value: string;
  /** the clause it adds when set, with `$?` where its value binds */
  readonly sql?: string;
  /** what binds, when that is not the value itself — `ships` binds a boolean */
  readonly bind?: unknown;
  /**
   * A clause that binds nothing at all. Only a sentinel is one: "the rows that
   * carry no requirement" is a question about the ABSENCE of a row and has no
   * value to bind.
   */
  readonly bare?: string;
};

export type ListQuery = {
  /** the resolved value of every control, keyed by its query-string name */
  readonly value: Readonly<Record<string, string>>;
  /** `where …`, or "" */
  readonly where: string;
  /** the bound values, in placeholder order */
  readonly binds: readonly unknown[];
  /** true when any control is set */
  readonly filtered: boolean;
  /** what a pass over this view carries. The page is deliberately absent. */
  readonly search: string;
};

export function listQuery(controls: readonly Control[]): ListQuery {
  const value: Record<string, string> = {};
  const clauses: string[] = [];
  const binds: unknown[] = [];

  for (const control of controls) {
    value[control.name] = control.value;
    if (!control.value) continue;
    if (control.bare) {
      clauses.push(control.bare);
      continue;
    }
    if (!control.sql) continue;
    binds.push(control.bind === undefined ? control.value : control.bind);
    clauses.push(control.sql.replace("$?", `$${binds.length}`));
  }

  return {
    value,
    where: clauses.length > 0 ? `where ${clauses.join(" and ")}` : "",
    binds,
    filtered: clauses.length > 0,
    search: reviewSearch(value),
  };
}

/**
 * The filters, as the string a pass carries.
 *
 * Keys are sorted so that the same view has the same address however the
 * controls happened to be read, and `page` is dropped because a pass runs
 * across pages — the page a row sits on is arithmetic, done in `reviewPass`.
 */
export function reviewSearch(filters: Readonly<Record<string, string>>): string {
  const next = new URLSearchParams();
  for (const key of Object.keys(filters).sort()) {
    if (key === "page") continue;
    const value = filters[key];
    if (!value) continue;
    next.set(key, value);
  }
  return next.toString();
}

/* ── the pass ───────────────────────────────────────────────────────── */

/** What a screen in a pass is carrying. Null when it is not in one. */
export type Carried = {
  /** the list's filters. "" is a pass over a list with nothing set. */
  readonly search: string;
  /** where she was, 1-based, when the link was made. A hint, never authority. */
  readonly at: number | null;
};

/**
 * Whether this view is part of a pass, and what it carries.
 *
 * Presence, not truthiness: `review=` is a pass over an unfiltered list and is
 * the ordinary case on /desk/destinations, which has no controls at all.
 */
export function readReview(params: Params): Carried | null {
  const raw = params[REVIEW];
  if (typeof raw !== "string") return null;
  const at = Number(one(params[AT]));
  return {
    // Re-serialised rather than passed through, so a hand-edited URL cannot
    // carry a `page`, an empty control or a five-kilobyte value into a query.
    search: reviewSearch(Object.fromEntries(
      new URLSearchParams(raw.slice(0, MAX_SEARCH)).entries()
    )),
    at: Number.isInteger(at) && at > 0 && at <= CAP ? at : null,
  };
}

/**
 * A link into a pass: one row's screen, and the place that row holds.
 *
 * `base` is the whole path of the screen rather than the list's path plus an
 * id, because a row can have more than one reviewable screen. A destination is
 * walked at /desk/destinations/<id> and its voice at /desk/destinations/<id>/
 * voice, and a pass through the second must not hand her back to the first.
 */
export function passHref(
  base: string,
  search: string,
  at: number,
  hash = ""
): string {
  const next = new URLSearchParams();
  next.set(REVIEW, search);
  next.set(AT, String(at));
  return `${base}?${next.toString()}${hash}`;
}

/**
 * Carry the pass through a Server Action's redirect.
 *
 * A save that lands back on the row must land back on it IN THE PASS, or the
 * strip disappears the first time she edits anything and the review is over.
 * The two parameters ride in hidden fields; see `ReviewFields` in bits.tsx.
 */
export function carryReview(form: FormData, url: string): string {
  const raw = form.get(REVIEW);
  if (typeof raw !== "string") return url;
  const carried = readReview({ [REVIEW]: raw, [AT]: String(form.get(AT) ?? "") });
  if (!carried) return url;
  const next = new URLSearchParams();
  next.set(REVIEW, carried.search);
  if (carried.at !== null) next.set(AT, String(carried.at));
  return `${url}${url.includes("?") ? "&" : "?"}${next.toString()}`;
}

export type Pass = {
  /** where this row sits in the list right now, 1-based. Null once it has left. */
  readonly position: number | null;
  /** how many the list holds right now. Counted on this view, never carried. */
  readonly total: number;
  /** where she was when she opened this row. Only meaningful once adrift. */
  readonly wasAt: number | null;
  /** true when the row is no longer one of the list's rows */
  readonly adrift: boolean;
  /** true when the list is longer than a pass walks */
  readonly capped: boolean;
  readonly previous: string | null;
  readonly next: string | null;
  /** back to the list, on the page this row sits on */
  readonly list: string;
};

export function reviewPass(opts: {
  /** the list's path, e.g. /desk/bank */
  path: string;
  /** every id the list holds under these filters, in the list's own order */
  ids: readonly string[];
  /** the row being looked at */
  id: string;
  carried: Carried;
  /** rows per page on the list, so Back returns to the page this row is on */
  perPage?: number;
  /**
   * The screen a row is reviewed on, when it is not `${path}/${id}` — a voice
   * pass walks /desk/destinations/<id>/voice and must stay on that screen.
   */
  rowPath?: (id: string) => string;
}): Pass {
  const { path, ids, id, carried } = opts;
  const total = ids.length;
  const index = ids.indexOf(id);
  const rowPath = opts.rowPath ?? ((row: string) => `${path}/${row}`);
  const href = (at: number) => passHref(rowPath(ids[at - 1]), carried.search, at);

  let previous: string | null = null;
  let next: string | null = null;

  if (index >= 0) {
    if (index > 0) previous = href(index);
    if (index + 1 < total) next = href(index + 2);
  } else if (carried.at !== null) {
    // ADRIFT. The row has left the list — published off a drafts-only pass,
    // withdrawn, retagged, or edited so it no longer matches. Everything after
    // it has moved up one, so the row now standing at her old position is the
    // next one she has not seen, and the one before it is the last she has.
    if (carried.at <= total) next = href(carried.at);
    if (carried.at > 1 && carried.at - 1 <= total) previous = href(carried.at - 1);
  }

  // Page one is the URL without a page, so that a filtered list has one address
  // rather than two that render the same thing — /desk/dishes' rule.
  const perPage = opts.perPage ?? 0;
  const page = perPage > 0 && index >= 0 ? Math.floor(index / perPage) + 1 : 1;
  const back = new URLSearchParams(carried.search);
  if (page > 1) back.set("page", String(page));
  const query = back.toString();

  return {
    position: index >= 0 ? index + 1 : null,
    total,
    wasAt: carried.at,
    adrift: index < 0,
    capped: total >= CAP,
    previous,
    next,
    list: query ? `${path}?${query}` : path,
  };
}
