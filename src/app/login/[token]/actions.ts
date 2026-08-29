"use server";

import { redirect } from "next/navigation";

import { spendLink } from "@/lib/auth";

/**
 * Spend the link, on a POST and never on a GET.
 *
 * A Server Function, because spending a link SETS a cookie and a Server
 * Component cannot — HTTP does not allow a Set-Cookie once streaming has
 * begun. That constraint is why this was a Route Handler for as long as it
 * was; a Server Function satisfies it equally well and only runs on a POST,
 * which is the whole point of the move.
 *
 * The single-failure rule is unchanged: expired, already spent, never
 * existed, or belonging to somebody whose access has since gone away all land
 * on /login?error=link and read the same sentence. A handler that
 * distinguished them would be telling a script which of its guesses was
 * closest.
 */
export async function spendLinkAction(form: FormData): Promise<void> {
  const token = String(form.get("token") ?? "");

  const outcome = await spendLink(token);
  if (!outcome.ok) redirect("/login?error=link");

  redirect(outcome.destination);
}
