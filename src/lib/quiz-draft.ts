import { QUIZ_VERSION, type QuizAnswers } from "./quiz";

/**
 * Her half-finished quiz, kept outside React.
 *
 * THE REQUIREMENT: she must never lose her answers. She fills this in on a
 * phone, one-handed, and will be interrupted — a call, a tab eviction, a
 * closed browser three days ago. Everything she taps is written to
 * localStorage the moment she taps it, and the draft is only cleared once the
 * server has confirmed the submission.
 *
 * WHY THIS IS A STORE AND NOT useState + an effect: localStorage IS the source
 * of truth here, and React's way of reading an external source is
 * useSyncExternalStore. Doing it that way gets three things at once —
 *
 *   - no hydration mismatch. The server snapshot is always null, so the server
 *     and the first client render agree; React then re-renders from the real
 *     snapshot itself. Reading localStorage in a useState initialiser would
 *     make the two disagree.
 *   - no chance of the copy in memory and the copy on disk drifting apart,
 *     because there is only one copy.
 *   - another tab, or the same quiz reopened in a second window, stays in step
 *     via the `storage` event.
 *
 * If localStorage throws — private mode, quota, a locked-down browser — the
 * module falls back to memory. The quiz keeps working; it just will not resume
 * after a reload, which is the least-bad failure available.
 */

export type QuizDraft = {
  version: string;
  stepIndex: number;
  answers: QuizAnswers;
  /**
   * One key per attempt, generated when the draft is created. It is what makes
   * a retry after a dropped connection idempotent: the server has a unique
   * constraint on it and returns the original row instead of writing a second.
   */
  submissionKey: string;
};

const KEY = "revelle.quiz.draft";

/** `undefined` means "not read yet"; `null` means "no draft". */
let current: string | null | undefined = undefined;
/** Used when localStorage is unavailable, so the quiz still functions. */
let memory: string | null = null;

const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== KEY) return;
    current = undefined; // force a re-read
    notify();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/**
 * The raw stored string. Cached in the module so React can call this on every
 * render without touching disk, and so successive snapshots are identical by
 * value when nothing has changed.
 */
export function getSnapshot(): string | null {
  if (current === undefined) {
    try {
      current = window.localStorage.getItem(KEY);
    } catch {
      current = memory;
    }
  }
  return current;
}

/** There is no draft on the server, and there never can be. */
export function getServerSnapshot(): string | null {
  return null;
}

function write(value: string | null): void {
  current = value;
  memory = value;
  try {
    if (value === null) window.localStorage.removeItem(KEY);
    else window.localStorage.setItem(KEY, value);
  } catch {
    // Memory only. See the note at the top.
  }
  notify();
}

export function parseDraft(raw: string | null): QuizDraft | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<QuizDraft>;
    // A draft written against a different question set cannot be trusted to
    // still mean what it said. Better a fresh start than a wrong answer.
    if (parsed.version !== QUIZ_VERSION) return null;
    if (typeof parsed.answers !== "object" || parsed.answers === null) return null;
    if (typeof parsed.submissionKey !== "string" || !parsed.submissionKey) return null;
    return {
      version: QUIZ_VERSION,
      stepIndex:
        typeof parsed.stepIndex === "number" && Number.isFinite(parsed.stepIndex)
          ? Math.max(0, Math.trunc(parsed.stepIndex))
          : 0,
      answers: parsed.answers as QuizAnswers,
      submissionKey: parsed.submissionKey,
    };
  } catch {
    return null;
  }
}

function newSubmissionKey(): string {
  // Present in every browser this app supports (Safari 16.4+, Chrome 111+).
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

const EMPTY: QuizDraft = {
  version: QUIZ_VERSION,
  stepIndex: 0,
  answers: {},
  submissionKey: "",
};

/**
 * Read-modify-write. The draft is created on her first tap, not on page load,
 * so a visitor who looks and leaves writes nothing to her device.
 */
export function updateDraft(mutate: (draft: QuizDraft) => QuizDraft): void {
  const existing = parseDraft(getSnapshot());
  const base: QuizDraft = existing ?? {
    ...EMPTY,
    submissionKey: newSubmissionKey(),
  };
  write(JSON.stringify(mutate(base)));
}

/** Called only after the server has confirmed the submission. */
export function clearDraft(): void {
  write(null);
}
