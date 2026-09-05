"use server";

import { redirect } from "next/navigation";

import { answerForBegin } from "@/lib/application";
import { beginApplying, currentApplicant } from "@/lib/auth";
import type { Answer } from "@/lib/login";

export type ApplyState = Answer;

/**
 * Two actions, one act.
 *
 * Both ask src/lib/application.ts for a note, and every decision — the
 * throttle, the customer row, the pass, what the note says, and the one
 * sentence rendered for every address — lives there, where `node --test` can
 * reach it. These are deliberately almost empty, exactly as
 * src/app/login/actions.ts is. Nothing here can break a property on its own.
 */

/**
 * The sign-up.
 *
 * ON SUCCESS IT REDIRECTS RATHER THAN RETURNING A SENTENCE, and the redirect
 * is the point: /apply re-renders, sees a pass, and shows her the screen that
 * says the note is coming. A message appearing under a form she is still
 * looking at would make signing up feel like a field validating rather than
 * like something having happened.
 *
 * Every successful sign-up lands on the same screen whoever she is, so the
 * redirect gives away nothing — a member's address, a stranger's, and one
 * nobody has typed before are indistinguishable from outside. That is the same
 * property the sign-in door has, and it is easier to hold here because every
 * well-formed address becomes an applicant.
 *
 * The empty case is handled here and not in the library because "you typed
 * nothing" is a fact about the form, not about the application.
 */
export async function beginApplicationAction(
  _previous: ApplyState,
  form: FormData
): Promise<ApplyState> {
  const email = String(form.get("email") ?? "").trim();
  if (email.length === 0) {
    return { message: "An address is needed.", asked: false };
  }

  const outcome = await beginApplying(email);
  if (outcome.ok) redirect("/apply");

  return answerForBegin(outcome);
}

/**
 * Another note, for a person who is looking at the waiting screen.
 *
 * IT TAKES NO ADDRESS. The one it uses is read from her pass, server side —
 * the form cannot name an inbox. A hidden field here would be an open relay
 * with a friendly face: anybody could post to it and have the house mail
 * anybody, at our cost and from our domain, and the throttle would only
 * decide how fast.
 *
 * No redirect: she is already on the right screen, so the sentence appears
 * under the button and the screen stays put. Rule 18 — the target of a
 * correction does not move between the mistake and its fix.
 */
export async function resendNoteAction(
  _previous: ApplyState,
  _form: FormData
): Promise<ApplyState> {
  const applicant = await currentApplicant();
  if (!applicant) {
    return {
      message: "Start again from the top and we will send another.",
      asked: false,
    };
  }

  return answerForBegin(await beginApplying(applicant.email));
}
