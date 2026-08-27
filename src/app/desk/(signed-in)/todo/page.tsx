import Link from "next/link";

import { stamp } from "@/lib/desk/labels";
import { everyone, openTodos, recentlyDone, type Todo } from "@/lib/desk/room";
import { POOL_SCREEN } from "@/lib/desk/stocked";

import styles from "../../desk.module.css";
import { Empty, Head, Seam } from "../bits";
import {
  addTodoAction,
  assignTodoAction,
  dismissTodoAction,
  toggleTodoAction,
} from "../thread/actions";

/**
 * WHERE A TODO'S SUBJECT IS LOOKED AT.
 *
 * This used to be string surgery — `/desk/${todo.subject_table}s/${id}` — with
 * two hand-written exceptions in front of it for `quiz_response` and `world`.
 * That is CLAUDE.md rule 19's `/desk/${table}s` verbatim, and it was already
 * wrong: an engine-found gap on the atmosphere pool carries `bank_item`, which
 * pluralises to `/desk/bank_items/…` and 404s. The screen is `/desk/bank`.
 *
 * `POOL_SCREEN` in src/lib/desk/stocked.ts has held that answer since the
 * publish screen and the publish action were found keeping two copies of it —
 * and it already carried `world: "/desk/destinations"`, so the second of the
 * two hand-written exceptions was a third copy of a fact that module owns. It
 * is gone. `quiz_response` stays, and stays HERE, because it is not a pool: an
 * application is not a thing the engine draws from, and `POOL_SCREEN` is
 * documented as a map of pools rather than a router.
 *
 * A subject with no screen now renders as PLAIN TEXT rather than as a link to
 * nothing (rule 16 — a control that absorbs a click and delivers a 404 has
 * taken input it cannot honour). `POOL_SCREEN`'s own note says a pool absent
 * from it "just has no list screen to link to, which is itself worth seeing";
 * this is what seeing it looks like.
 */
function subjectHref(todo: Todo): string | null {
  const { subject_table: table, subject_id: id } = todo;
  if (!table || !id) return null;
  if (table === "quiz_response") return `/desk/applications/${id}`;
  const screen = POOL_SCREEN[table];
  return screen ? `${screen}/${id}` : null;
}

/**
 * THE LIST.
 *
 * Four facts per item and no more — what it is, whose it is, whether it is
 * done, when it was made. No priority, no due date, no labels, no status
 * ladder: two people do not need a project management tool, and every extra
 * field is a field that goes stale and then lies.
 *
 * ── WHY THE ENGINE'S FINDINGS ARE HERE ──────────────────────────────
 *
 * The selection engine discovers exactly what the catalogue is missing, and an
 * unfilled slot is SILENT to the member — she does not receive that
 * deliverable and is never told a slot existed. This list is therefore the
 * only place a gap becomes visible to anybody at all. Those items are marked,
 * deduped on what the gap IS rather than on the run that found it, and can be
 * dismissed — a dismissal persists, so a gap the house has decided not to fill
 * never comes back.
 */

export const dynamic = "force-dynamic";

const BACK = "/desk/todo";

export default async function TodoPage() {
  const [open, done, staffList] = await Promise.all([
    openTodos(),
    recentlyDone(15),
    everyone(),
  ]);

  const fromGaps = open.filter((todo) => todo.source === "gap");
  const typed = open.filter((todo) => todo.source !== "gap");

  const list = (items: typeof open) => (
    <ul className={styles.todos}>
      {items.map((todo) => (
        <li key={todo.id} className={styles.todo}>
          <form action={toggleTodoAction}>
            <input type="hidden" name="todo_id" value={todo.id} />
            <input type="hidden" name="done" value="true" />
            <input type="hidden" name="back" value={BACK} />
            <button className={styles.filter} title="Done">
              ✓
            </button>
          </form>

          <div className={styles.todoBody}>
            {todo.body}
            <div className={styles.todoMeta}>
              {todo.source === "gap" ? (
                <span className={styles.fromGap}>
                  found by the engine · {String(todo.detail.pool ?? "")}
                </span>
              ) : null}
              {subjectHref(todo) ? (
                <Link className={styles.link} href={subjectHref(todo)!}>
                  on the {todo.subject_table}
                </Link>
              ) : todo.subject_table ? (
                <span className={styles.todoMeta}>
                  on the {todo.subject_table} — no screen shows this pool yet
                </span>
              ) : null}
              <span>{stamp(todo.created_at)}</span>
            </div>
          </div>

          <div className={styles.buttonRow}>
            <form action={assignTodoAction} className={styles.buttonRow}>
              <input type="hidden" name="todo_id" value={todo.id} />
              <input type="hidden" name="back" value={BACK} />
              <select
                name="assignee_id"
                defaultValue={todo.assignee_id ?? ""}
                className={styles.select}
                aria-label="Whose"
              >
                <option value="">Nobody yet</option>
                {staffList.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </select>
              <button className={styles.filter}>Set</button>
            </form>
            <form action={dismissTodoAction}>
              <input type="hidden" name="todo_id" value={todo.id} />
              <input type="hidden" name="back" value={BACK} />
              <button className={styles.filter}>Not doing it</button>
            </form>
          </div>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      <Head eyebrow="Between us" title="To do" />

      <form action={addTodoAction} className={styles.form}>
        <input type="hidden" name="back" value={BACK} />
        <div className={styles.buttonRow}>
          <input
            name="body"
            className={styles.input}
            style={{ maxWidth: "34rem" }}
            placeholder="What needs doing"
            aria-label="What needs doing"
          />
          <select name="assignee_id" className={styles.select} aria-label="Whose">
            <option value="">Nobody yet</option>
            {staffList.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
          <button className={styles.button}>Add</button>
        </div>
      </form>

      <section className={styles.panel}>
        <h2 className={styles.panelHead}>
          <span>What the catalogue is missing</span>
          <span>found by the selection engine</span>
        </h2>
        {fromGaps.length === 0 ? (
          <Seam title="Nothing yet, and here is why">
            These appear when a selection runs and a slot cannot be filled —{" "}
            <code>recordCatalogueGaps(result.gaps)</code> from{" "}
            <code>src/lib/desk/gaps.ts</code>, called wherever a candidate is
            persisted. A gap that exists because the host opted out of a
            deliverable is never listed here: that is not work, and the engine
            says which is which.
          </Seam>
        ) : (
          list(fromGaps)
        )}
      </section>

      <section className={styles.panel}>
        <h2 className={styles.panelHead}>
          <span>Ours</span>
        </h2>
        {typed.length === 0 ? <Empty>Nothing outstanding.</Empty> : list(typed)}
      </section>

      {done.length > 0 ? (
        <section className={styles.panel}>
          <h2 className={styles.panelHead}>
            <span>Recently done</span>
          </h2>
          <ul className={styles.todos}>
            {done.map((todo) => (
              <li key={todo.id} className={`${styles.todo} ${styles.todoDone}`}>
                <form action={toggleTodoAction}>
                  <input type="hidden" name="todo_id" value={todo.id} />
                  <input type="hidden" name="done" value="false" />
                  <input type="hidden" name="back" value={BACK} />
                  <button className={styles.filter} title="Not done after all">
                    ↺
                  </button>
                </form>
                <div className={styles.todoBody}>{todo.body}</div>
                <span className={styles.todoMeta}>{stamp(todo.done_at)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
