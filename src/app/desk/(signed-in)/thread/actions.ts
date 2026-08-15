"use server";

import { revalidatePath } from "next/cache";

import {
  addTodo,
  dismissTodo,
  editMessage,
  markRead,
  postMessage,
  setTodoAssignee,
  setTodoDone,
  type Subject,
} from "@/lib/desk/room";
import { recordAction, requireStaff } from "@/lib/staff";

/**
 * The room's write paths.
 *
 * All of them re-check the session. A Server Action is its own entry point and
 * is reachable without rendering the page whose form calls it, so the layout's
 * guard is not enough — Next's own forms guide says exactly this.
 *
 * The subject arrives as two hidden fields. A comment on a record and a message
 * in the general thread are the same row with the anchor null (db/013), so the
 * same action serves both and there is no second copy of any of this.
 */

const TABLES = new Set([
  "quiz_response",
  "world",
  "world_voice",
  "product",
  "menu",
  "drink",
  "game",
]);

function subjectOf(form: FormData): Subject {
  const table = String(form.get("subject_table") ?? "");
  const id = String(form.get("subject_id") ?? "");
  if (!TABLES.has(table) || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  return { table, id };
}

function back(form: FormData): void {
  const path = String(form.get("back") ?? "/desk/thread");
  revalidatePath(path);
}

export async function postMessageAction(form: FormData): Promise<void> {
  const staff = await requireStaff();
  const subject = subjectOf(form);
  const body = String(form.get("body") ?? "");
  if (body.trim().length === 0) return;

  await postMessage(staff, subject, body);
  // Posting is reading: nothing you just wrote should come back as unread.
  await markRead(staff, subject);
  back(form);
}

export async function editMessageAction(form: FormData): Promise<void> {
  const staff = await requireStaff();
  const id = String(form.get("message_id") ?? "");
  const body = String(form.get("body") ?? "");

  // Author-only. Enforced here rather than in the database, which has no idea
  // who is at the desk — see the note in src/lib/desk/room.ts.
  await editMessage(staff, id, body);
  back(form);
}

export async function markReadAction(form: FormData): Promise<void> {
  const staff = await requireStaff();
  await markRead(staff, subjectOf(form));
  back(form);
}

export async function addTodoAction(form: FormData): Promise<void> {
  const staff = await requireStaff();
  const body = String(form.get("body") ?? "");
  if (body.trim().length === 0) return;

  const assignee = String(form.get("assignee_id") ?? "");
  await addTodo(
    staff,
    body,
    subjectOf(form),
    /^[0-9a-f-]{36}$/i.test(assignee) ? assignee : null
  );
  back(form);
}

export async function toggleTodoAction(form: FormData): Promise<void> {
  const staff = await requireStaff();
  const id = String(form.get("todo_id") ?? "");
  const done = String(form.get("done") ?? "") === "true";
  await setTodoDone(staff, id, done);
  back(form);
}

export async function assignTodoAction(form: FormData): Promise<void> {
  await requireStaff();
  const id = String(form.get("todo_id") ?? "");
  const assignee = String(form.get("assignee_id") ?? "");
  await setTodoAssignee(id, /^[0-9a-f-]{36}$/i.test(assignee) ? assignee : null);
  back(form);
}

/**
 * "We are not doing this."
 *
 * Recorded rather than deleted, which is what stops a dismissed catalogue gap
 * reappearing the next time the engine hits it. See db/013 and
 * src/lib/desk/gaps.ts.
 */
export async function dismissTodoAction(form: FormData): Promise<void> {
  const staff = await requireStaff();
  const id = String(form.get("todo_id") ?? "");
  await dismissTodo(staff, id);
  await recordAction(staff, {
    action: "todo.dismissed",
    entityTable: "desk_todo",
    summary: `Dismissed to-do ${id}`,
    detail: { id },
  });
  back(form);
}
