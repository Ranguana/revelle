"use server";

import { redirect } from "next/navigation";

import { confirmApplying } from "@/lib/auth";

/**
 * Confirm the address, on a POST and never on a GET.
 *
 * A Server Function, because confirming SETS a cookie and a Server Component
 * cannot — HTTP does not allow a Set-Cookie once streaming has begun. The same
 * constraint shaped src/app/login/[token]/actions.ts, and the same solution
 * fits.
 *
 * THE SINGLE-FAILURE RULE, unchanged from the sign-in door: expired, already
 * pressed, never existed, or a sign-in link submitted here by mistake all land
 * back on /apply and read the same sentence. Distinguishing them would tell a
 * script which of its guesses was closest, and there is nothing she could do
 * differently anyway.
 *
 * Both outcomes go to /apply, and that is not laziness. On success she has a
 * confirmed address and a pass, so /apply shows the questions. On failure she
 * either still has an unconfirmed pass — the waiting screen, with a way to ask
 * for another note — or no pass at all, and gets the sign-up. Every failure
 * lands on the screen that can fix it.
 */
export async function confirmAction(form: FormData): Promise<void> {
  const token = String(form.get("token") ?? "");
  await confirmApplying(token);
  redirect("/apply");
}
