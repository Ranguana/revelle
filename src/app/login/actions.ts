"use server";

import { askForLink } from "@/lib/auth";
import { answerFor, type Answer } from "@/lib/login";

export type LoginState = Answer;

/**
 * Ask for a link.
 *
 * Deliberately almost empty. Every decision — who gets a message, what it
 * says, and the one sentence this form renders for all of them — is in
 * src/lib/login.ts, where `node --test` can reach it. The rule that keeps this
 * door from becoming a membership lookup is asserted by a test rather than
 * guarded by a comment, and this file has nothing in it that could break the
 * rule on its own.
 *
 * The empty case is handled here and not there because "you typed nothing" is
 * a fact about the form, not about the door.
 */
export async function requestLinkAction(
  _previous: LoginState,
  form: FormData
): Promise<LoginState> {
  const email = String(form.get("email") ?? "").trim();
  if (email.length === 0) {
    return { message: "An address is needed.", asked: false };
  }

  return answerFor(await askForLink(email));
}
