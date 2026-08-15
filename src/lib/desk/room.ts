import "server-only";

import { query, queryOne } from "@/lib/db";
import type { Staff } from "@/lib/staff";

/**
 * THE ROOM — two curators talking, and the work that falls out of it.
 *
 * The schema and the arguments for it are db/013. This module is the only
 * place either table is written, so the rules that are not constraints — an
 * author edits her own message and nobody else's — live in one readable place
 * rather than in four route handlers.
 *
 * A message anchored to a record and a message in the general thread are the
 * SAME row with the subject null. Everything below takes the subject as an
 * optional pair for that reason.
 */

export const GENERAL = "~general";

export type Subject = { table: string; id: string } | null;

export function threadKey(subject: Subject): string {
  return subject ? `${subject.table}:${subject.id}` : GENERAL;
}

/* ── messages ───────────────────────────────────────────────────────── */

export type Message = {
  id: string;
  body: string;
  created_at: string;
  edited_at: string | null;
  staff_id: string;
  author: string;
  /** Every earlier wording, newest first. The argument, kept. */
  revisions: string[];
};

export async function messages(subject: Subject): Promise<Message[]> {
  return query<Message>(
    `select m.id::text as id,
            m.body,
            m.created_at,
            m.edited_at,
            m.staff_id,
            coalesce(nullif(btrim(s.name), ''), split_part(s.email::text, '@', 1))
              as author,
            coalesce(
              (select array_agg(r.body order by r.superseded_at desc)
                 from desk_message_revision r where r.message_id = m.id),
              '{}'
            ) as revisions
       from desk_message m
       join staff s on s.id = m.staff_id
      where m.thread_key = $1
      order by m.id`,
    [threadKey(subject)]
  );
}

export async function postMessage(
  staff: Staff,
  subject: Subject,
  body: string
): Promise<void> {
  const text = body.trim();
  if (text.length === 0) return;
  await query(
    `insert into desk_message (staff_id, subject_table, subject_id, body)
     values ($1, $2, $3, $4)`,
    [staff.id, subject?.table ?? null, subject?.id ?? null, text]
  );
}

/**
 * Rewording your own message.
 *
 * Author-only, and checked HERE rather than in the database, because the
 * database has no idea who is at the desk. Inventing a session variable to
 * tell it would be a second, weaker copy of this line. The trigger in db/013
 * still does the part a trigger is good at: it files the previous text before
 * the new one lands, in the same statement.
 */
export async function editMessage(
  staff: Staff,
  id: string,
  body: string
): Promise<boolean> {
  const text = body.trim();
  if (text.length === 0) return false;
  const rows = await query<{ id: string }>(
    `update desk_message set body = $3
      where id = $1 and staff_id = $2
      returning id::text as id`,
    [id, staff.id, text]
  );
  return rows.length > 0;
}

/* ── unread ─────────────────────────────────────────────────────────── */

/**
 * A MARK, NOT A COUNT. See db/013: a number in a badge is a number two people
 * will start working to, and docs/copy-brief.md's ban on gimmick mechanics
 * applies to the tool as much as to the page.
 */
export async function hasUnread(
  staff: Staff,
  subject: Subject
): Promise<boolean> {
  const row = await queryOne<{ unread: boolean }>(
    `select exists (
       select 1
         from desk_message m
         left join desk_read r
           on r.staff_id = $2 and r.thread_key = m.thread_key
        where m.thread_key = $1
          and m.staff_id <> $2
          and m.id > coalesce(r.last_read_id, 0)
     ) as unread`,
    [threadKey(subject), staff.id]
  );
  return row?.unread ?? false;
}

export async function markRead(staff: Staff, subject: Subject): Promise<void> {
  await query(
    `insert into desk_read (staff_id, thread_key, last_read_id, read_at)
     select $2, $1, coalesce(max(m.id), 0), now()
       from desk_message m where m.thread_key = $1
     on conflict (staff_id, thread_key) do update
       set last_read_id = greatest(desk_read.last_read_id, excluded.last_read_id),
           read_at = now()`,
    [threadKey(subject), staff.id]
  );
}

/* ── to-do ──────────────────────────────────────────────────────────── */

export type Todo = {
  id: string;
  body: string;
  source: string;
  gap_key: string | null;
  subject_table: string | null;
  subject_id: string | null;
  assignee_id: string | null;
  assignee: string | null;
  created_at: string;
  done_at: string | null;
  detail: Record<string, unknown>;
};

const TODO_COLUMNS = `
  t.id::text as id, t.body, t.source, t.gap_key,
  t.subject_table, t.subject_id::text as subject_id,
  t.assignee_id,
  coalesce(nullif(btrim(a.name), ''), split_part(a.email::text, '@', 1)) as assignee,
  t.created_at, t.done_at, t.detail`;

/** Open work. Dismissed gaps and finished items are both out — see db/013. */
export async function openTodos(subject?: Subject): Promise<Todo[]> {
  if (subject) {
    return query<Todo>(
      `select ${TODO_COLUMNS}
         from desk_todo t
         left join staff a on a.id = t.assignee_id
        where t.done_at is null and t.dismissed_at is null
          and t.subject_table = $1 and t.subject_id = $2
        order by t.created_at desc`,
      [subject.table, subject.id]
    );
  }
  return query<Todo>(
    `select ${TODO_COLUMNS}
       from desk_todo t
       left join staff a on a.id = t.assignee_id
      where t.done_at is null and t.dismissed_at is null
      order by t.source desc, t.created_at desc`
  );
}

/** The last things finished, so a list of nothing does not look broken. */
export async function recentlyDone(limit = 20): Promise<Todo[]> {
  return query<Todo>(
    `select ${TODO_COLUMNS}
       from desk_todo t
       left join staff a on a.id = t.assignee_id
      where t.done_at is not null
      order by t.done_at desc
      limit $1`,
    [limit]
  );
}

export async function addTodo(
  staff: Staff,
  body: string,
  subject: Subject,
  assigneeId: string | null
): Promise<void> {
  const text = body.trim();
  if (text.length === 0) return;
  await query(
    `insert into desk_todo
       (body, assignee_id, subject_table, subject_id, source, created_by)
     values ($1, $2, $3, $4, 'curator', $5)`,
    [text, assigneeId, subject?.table ?? null, subject?.id ?? null, staff.id]
  );
}

export async function setTodoDone(
  staff: Staff,
  id: string,
  done: boolean
): Promise<void> {
  await query(
    done
      ? `update desk_todo set done_at = now(), done_by = $2 where id = $1 and done_at is null`
      : `update desk_todo set done_at = null, done_by = null where id = $1`,
    done ? [id, staff.id] : [id]
  );
}

export async function setTodoAssignee(
  id: string,
  assigneeId: string | null
): Promise<void> {
  await query(`update desk_todo set assignee_id = $2 where id = $1`, [
    id,
    assigneeId,
  ]);
}

/**
 * "We are not doing this."
 *
 * The row is kept, never deleted, and that is what stops a dismissed catalogue
 * gap coming back the next time the engine runs into it: the unique index on
 * gap_key means the re-insert finds a row and does nothing. Dismissal is a
 * fact that has to persist to be worth anything.
 */
export async function dismissTodo(staff: Staff, id: string): Promise<void> {
  await query(
    `update desk_todo set dismissed_at = now(), dismissed_by = $2
      where id = $1 and dismissed_at is null`,
    [id, staff.id]
  );
}

/** Both of them, for the assignee menu. Two rows; no pagination needed. */
export async function everyone(): Promise<
  { id: string; name: string; email: string }[]
> {
  return query<{ id: string; name: string; email: string }>(
    `select id,
            coalesce(nullif(btrim(name), ''), split_part(email::text, '@', 1)) as name,
            email::text as email
       from staff
      where status = 'active'
      order by name`
  );
}

/* ── counts for the rail ────────────────────────────────────────────── */

export async function deskSummary(staff: Staff): Promise<{
  openTodos: number;
  unreadGeneral: boolean;
}> {
  const row = await queryOne<{ open_todos: string }>(
    `select count(*)::text as open_todos
       from desk_todo where done_at is null and dismissed_at is null`
  );
  return {
    openTodos: Number(row?.open_todos ?? 0),
    unreadGeneral: await hasUnread(staff, null),
  };
}

/** Used by the record pages to show their own thread and work together. */
export async function subjectContext(staff: Staff, subject: Subject) {
  const [thread, work, unread] = await Promise.all([
    messages(subject),
    openTodos(subject),
    hasUnread(staff, subject),
  ]);
  return { thread, work, unread };
}
