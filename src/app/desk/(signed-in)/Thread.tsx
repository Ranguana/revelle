import { stamp } from "@/lib/desk/labels";
import {
  everyone,
  subjectContext,
  type Subject,
} from "@/lib/desk/room";
import { requireStaff } from "@/lib/staff";

import styles from "../desk.module.css";
import {
  addTodoAction,
  dismissTodoAction,
  markReadAction,
  postMessageAction,
  toggleTodoAction,
} from "./thread/actions";

/**
 * THE THREAD, and the work attached to it.
 *
 * One component, used on the general page and on every record page, because a
 * comment on a menu and a message in the general thread are the same row with
 * the anchor set or null (db/013). Two components would be two things to keep
 * in step forever.
 *
 * ── EDITS SHOW THEIR HISTORY ────────────────────────────────────────
 *
 * A reworded message keeps what it used to say and shows it underneath, in
 * grey. That is not an audit feature: "make the clams the opener" replaced by
 * "no, the soup" is the argument that produced the current catalogue, and it
 * is worth more than the conclusion on its own.
 */

export default async function Thread({
  subject,
  back,
  title = "Between us",
}: {
  subject: Subject;
  /** The path to revalidate after a write. */
  back: string;
  title?: string;
}) {
  const staff = await requireStaff();
  const [{ thread, work, unread }, staffList] = await Promise.all([
    subjectContext(staff, subject),
    everyone(),
  ]);

  const anchor = (
    <>
      <input type="hidden" name="subject_table" value={subject?.table ?? ""} />
      <input type="hidden" name="subject_id" value={subject?.id ?? ""} />
      <input type="hidden" name="back" value={back} />
    </>
  );

  return (
    <section className={styles.panel}>
      <h2 className={styles.panelHead}>
        <span>{title}</span>
        {unread ? (
          <form action={markReadAction}>
            {anchor}
            <button className={styles.filter} type="submit">
              Mark read
            </button>
          </form>
        ) : null}
      </h2>

      {thread.length === 0 ? (
        <p className={styles.hint}>Nothing said yet.</p>
      ) : (
        <ul className={styles.messages}>
          {thread.map((message) => (
            <li
              key={message.id}
              className={`${styles.message} ${
                unread && message.staff_id !== staff.id ? styles.messageNew : ""
              }`}
            >
              <div className={styles.messageMeta}>
                <span>{message.author}</span>
                <span>{stamp(message.created_at)}</span>
                {message.edited_at ? <span>edited</span> : null}
              </div>
              <p className={styles.messageBody}>{message.body}</p>
              {message.revisions.map((old, index) => (
                <p key={index} className={styles.messageOld}>
                  was: {old}
                </p>
              ))}
            </li>
          ))}
        </ul>
      )}

      <form action={postMessageAction} className={styles.form}>
        {anchor}
        <textarea
          name="body"
          rows={2}
          className={styles.textarea}
          placeholder="Leave a note"
          aria-label="Leave a note"
        />
        <div className={styles.buttonRow}>
          <button className={styles.button} type="submit">
            Say it
          </button>
        </div>
      </form>

      <h2 className={styles.panelHead} style={{ marginTop: "1rem" }}>
        <span>To do here</span>
      </h2>

      {work.length === 0 ? (
        <p className={styles.hint}>Nothing outstanding.</p>
      ) : (
        <ul className={styles.todos}>
          {work.map((todo) => (
            <li key={todo.id} className={styles.todo}>
              <form action={toggleTodoAction}>
                <input type="hidden" name="todo_id" value={todo.id} />
                <input type="hidden" name="done" value="true" />
                <input type="hidden" name="back" value={back} />
                <button className={styles.filter} type="submit" title="Done">
                  ✓
                </button>
              </form>
              <div className={styles.todoBody}>
                {todo.body}
                <div className={styles.todoMeta}>
                  {todo.source === "gap" ? (
                    <span className={styles.fromGap}>found by the engine</span>
                  ) : null}
                  <span>{todo.assignee ?? "unassigned"}</span>
                </div>
              </div>
              <form action={dismissTodoAction}>
                <input type="hidden" name="todo_id" value={todo.id} />
                <input type="hidden" name="back" value={back} />
                <button className={styles.filter} type="submit">
                  Not doing it
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <form action={addTodoAction} className={styles.form}>
        {anchor}
        <input
          name="body"
          className={styles.input}
          placeholder="Add something to do"
          aria-label="Add something to do"
        />
        <div className={styles.buttonRow}>
          <select name="assignee_id" className={styles.select} aria-label="Whose">
            <option value="">Nobody yet</option>
            {staffList.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
          <button className={styles.button} type="submit">
            Add
          </button>
        </div>
      </form>
    </section>
  );
}
