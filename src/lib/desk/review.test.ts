import assert from "node:assert/strict";
import test from "node:test";

import {
  carryReview,
  listQuery,
  passHref,
  readReview,
  reviewPass,
  reviewSearch,
  type Control,
} from "./review.ts";

/**
 * THE PASS, CHECKED WITHOUT A DATABASE OR A BROWSER.
 *
 * Everything in review.ts is arithmetic over a list of ids and a query string,
 * which is deliberate: the parts of sequential review that can be wrong are the
 * ENDS and the row that leaves the list mid-review, and both are pure. There is
 * nothing to stand up and nothing to mock.
 *
 * The three failures these tests exist to catch are all silent ones. A pass
 * that wraps around judges one row twice and misses another with nothing on the
 * screen to say so. A pass that carries a page number walks the page instead of
 * the list. A pass that trusts the position it was handed rather than the list
 * it can see reports a number that was true a minute ago.
 */

const ids = ["a", "b", "c", "d"];
const carried = (at: number | null, search = "") => ({ search, at });

/* ── where she is ───────────────────────────────────────────────────── */

test("the middle of a pass has both ends and a true position", () => {
  const pass = reviewPass({
    path: "/desk/bank",
    ids,
    id: "b",
    carried: carried(2),
  });
  assert.equal(pass.position, 2);
  assert.equal(pass.total, 4);
  assert.equal(pass.adrift, false);
  assert.equal(pass.previous, "/desk/bank/a?review=&at=1");
  assert.equal(pass.next, "/desk/bank/c?review=&at=3");
});

test("the first row has no Previous and the last has no Next", () => {
  const first = reviewPass({ path: "/x", ids, id: "a", carried: carried(1) });
  assert.equal(first.previous, null);
  assert.notEqual(first.next, null);

  const last = reviewPass({ path: "/x", ids, id: "d", carried: carried(4) });
  assert.notEqual(last.previous, null);
  assert.equal(last.next, null);
});

test("a pass never wraps around", () => {
  // The failure this guards is silent by construction: a wrap re-shows the
  // first row after the last, so one row is judged twice and none is reported
  // as missed. Both ends must be dead ends.
  const last = reviewPass({ path: "/x", ids, id: "d", carried: carried(4) });
  assert.equal(last.next, null);
  const first = reviewPass({ path: "/x", ids, id: "a", carried: carried(1) });
  assert.equal(first.previous, null);
});

test("a pass over one row has neither end", () => {
  const pass = reviewPass({
    path: "/x",
    ids: ["only"],
    id: "only",
    carried: carried(1),
  });
  assert.equal(pass.position, 1);
  assert.equal(pass.total, 1);
  assert.equal(pass.previous, null);
  assert.equal(pass.next, null);
});

test("the list she is shown is the list she is in, not the one she was handed", () => {
  // `at` says 1 and the row is really third. The live sequence wins, because it
  // is the only one of the two that is true now.
  const pass = reviewPass({ path: "/x", ids, id: "c", carried: carried(1) });
  assert.equal(pass.position, 3);
});

/* ── the row that leaves the list ───────────────────────────────────── */

test("a row that has left the list says so and hands Next its place", () => {
  // She was at 3 of 5. The row was published off a drafts-only pass, so it is
  // gone and everything after it moved up one: the row now standing at 3 is the
  // next one she has not seen.
  const pass = reviewPass({
    path: "/desk/bank",
    ids: ["a", "b", "d", "e"],
    id: "c",
    carried: carried(3),
  });
  assert.equal(pass.adrift, true);
  assert.equal(pass.position, null);
  assert.equal(pass.total, 4);
  assert.equal(pass.wasAt, 3);
  assert.equal(pass.next, "/desk/bank/d?review=&at=3");
  assert.equal(pass.previous, "/desk/bank/b?review=&at=2");
});

test("a row that leaves from the end of the list has no Next", () => {
  const pass = reviewPass({
    path: "/x",
    ids: ["a", "b"],
    id: "c",
    carried: carried(3),
  });
  assert.equal(pass.adrift, true);
  assert.equal(pass.next, null);
  assert.equal(pass.previous, "/x/b?review=&at=2");
});

test("a filter that now matches nothing offers nowhere to go", () => {
  const pass = reviewPass({ path: "/x", ids: [], id: "c", carried: carried(2) });
  assert.equal(pass.total, 0);
  assert.equal(pass.adrift, true);
  assert.equal(pass.next, null);
  assert.equal(pass.previous, null);
});

test("a row that has left, with no remembered place, offers nowhere to go", () => {
  const pass = reviewPass({ path: "/x", ids, id: "z", carried: carried(null) });
  assert.equal(pass.adrift, true);
  assert.equal(pass.next, null);
  assert.equal(pass.previous, null);
  assert.equal(pass.list, "/x");
});

/* ── back to the list ───────────────────────────────────────────────── */

test("Back returns to the page the row is on, filters intact", () => {
  const many = Array.from({ length: 250 }, (_, i) => `id-${i}`);
  const pass = reviewPass({
    path: "/desk/dishes",
    ids: many,
    id: "id-150",
    carried: carried(151, "status=draft"),
    perPage: 100,
  });
  assert.equal(pass.position, 151);
  assert.equal(pass.list, "/desk/dishes?status=draft&page=2");
});

test("page one is the address without a page", () => {
  const pass = reviewPass({
    path: "/desk/dishes",
    ids,
    id: "a",
    carried: carried(1, "status=draft"),
    perPage: 100,
  });
  assert.equal(pass.list, "/desk/dishes?status=draft");
});

/* ── what travels ───────────────────────────────────────────────────── */

test("the carried string drops the page, drops empties and sorts", () => {
  assert.equal(
    reviewSearch({ status: "draft", q: "", page: "4", destination: "havana" }),
    "destination=havana&status=draft"
  );
});

test("presence marks a pass, not truthiness", () => {
  // /desk/destinations has no controls, so an empty filter string is the
  // ordinary case. Testing the value rather than the parameter would mean the
  // library could never start a review at all.
  assert.notEqual(readReview({ review: "" }), null);
  assert.equal(readReview({}), null);
  assert.equal(readReview({ at: "3" }), null);
});

test("a hand-edited pass cannot smuggle a page or an empty control", () => {
  const carriedIn = readReview({ review: "page=9&status=draft&q=", at: "2" });
  assert.equal(carriedIn?.search, "status=draft");
  assert.equal(carriedIn?.at, 2);
});

test("a place that is not a place is no place at all", () => {
  assert.equal(readReview({ review: "", at: "0" })?.at, null);
  assert.equal(readReview({ review: "", at: "-3" })?.at, null);
  assert.equal(readReview({ review: "", at: "two" })?.at, null);
  assert.equal(readReview({ review: "", at: "1.5" })?.at, null);
  assert.equal(readReview({ review: "", at: "999999" })?.at, null);
});

test("a link into a pass carries the view and the place", () => {
  assert.equal(
    passHref("/desk/bank/abc", "status=draft", 4),
    "/desk/bank/abc?review=status%3Ddraft&at=4"
  );
  assert.equal(
    passHref("/desk/destinations/abc", "", 1, "#file"),
    "/desk/destinations/abc?review=&at=1#file"
  );
});

/* ── a save lands back inside the pass ──────────────────────────────── */

test("a save keeps the review it was made in", () => {
  const form = new FormData();
  form.set("review", "status=draft");
  form.set("at", "4");
  assert.equal(
    carryReview(form, "/desk/bank/abc?saved=1"),
    "/desk/bank/abc?saved=1&review=status%3Ddraft&at=4"
  );
});

test("a save outside a review is left alone", () => {
  assert.equal(
    carryReview(new FormData(), "/desk/bank/abc?saved=1"),
    "/desk/bank/abc?saved=1"
  );
});

/* ── the filters the pass and the screen share ──────────────────────── */

test("placeholders are numbered by the clauses that are actually set", () => {
  const controls: Control[] = [
    { name: "q", value: "", sql: "b.name ilike $?" },
    { name: "kind", value: "good", sql: "b.kind = $?" },
    { name: "ships", value: "owned", sql: "b.ships = $?", bind: false },
  ];
  const built = listQuery(controls);
  assert.equal(built.where, "where b.kind = $1 and b.ships = $2");
  assert.deepEqual(built.binds, ["good", false]);
  assert.equal(built.filtered, true);
  assert.equal(built.search, "kind=good&ships=owned");
});

test("a clause with nothing to bind takes no placeholder", () => {
  const built = listQuery([
    { name: "needs", value: "-none", bare: "not exists (select 1)" },
    { name: "status", value: "draft", sql: "b.status = $?" },
  ]);
  assert.equal(built.where, "where not exists (select 1) and b.status = $1");
  assert.deepEqual(built.binds, ["draft"]);
});

test("nothing set is no WHERE at all", () => {
  const built = listQuery([{ name: "q", value: "", sql: "b.name = $?" }]);
  assert.equal(built.where, "");
  assert.equal(built.filtered, false);
  assert.equal(built.search, "");
});
