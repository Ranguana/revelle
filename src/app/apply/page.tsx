import type { Metadata } from "next";

import { currentApplicant } from "@/lib/auth";

import QuizFlow from "./QuizFlow";
import SignUp from "./SignUp";
import Waiting from "./Waiting";

export const metadata: Metadata = {
  // Not "The quiz" — the word is banned in customer-facing copy and this one
  // was showing in the browser tab.
  title: "Apply",
  description:
    "What you are planning, where it happens, how your people actually have fun, and the one thing we could not possibly know.",
  // Nothing here should be indexed as a landing page in its own right, and a
  // half-finished application is not a thing to surface in search.
  robots: { index: false, follow: true },
};

/**
 * THE DOOR TO AN APPLICATION, in three states.
 *
 * Founder, 2026-09-05: "when they apply for membership, need a fun page where
 * they sign up and confirm email not just to the quiz." Until then this route
 * rendered the questions and nothing else, and asked for her address on the
 * last screen — so there was no moment of joining, and the address on an
 * application had never been proved by anybody.
 *
 *   no pass          →  SignUp.    Give an address; a note goes to it.
 *   pass, unconfirmed →  Waiting.  Open the note.
 *   pass, confirmed   →  QuizFlow. The questions, with the address known.
 *
 * ── THE STATE IS READ, NEVER TRUSTED FROM THE COOKIE ─────────────────
 *
 * The cookie holds a 256-bit pass and nothing else — no address, no id, no
 * flag. Everything the branch above turns on is looked up: whose pass this is,
 * and whether her address is confirmed. A cookie that named an address instead
 * would be a membership oracle wearing a convenience: type somebody else's
 * address into it, load this page, and the screen you got would tell you
 * whether she had applied. src/lib/login.ts spends its whole header keeping
 * that answer out of the sign-in door, and it must not leak out of this one.
 *
 * ── AND WHY THE STATE IS NEVER "SHE HAS ANSWERED N QUESTIONS" ────────
 *
 * Because the server does not know and must not. Her answers live in her
 * browser until she sends them (src/lib/quiz-draft.ts), which is what makes
 * every route through this page safe: nothing here can discard work, because
 * nothing here can see it.
 *
 * Dynamic by necessity — it reads a cookie — and correctly so: a prerendered
 * version of this page would show one of the three states to everybody.
 */
export default async function ApplyPage() {
  const applicant = await currentApplicant();

  if (!applicant) return <SignUp />;
  if (!applicant.confirmed) return <Waiting email={applicant.email} />;

  return <QuizFlow email={applicant.email} />;
}
