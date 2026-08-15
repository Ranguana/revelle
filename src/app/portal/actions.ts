"use server";

import { redirect } from "next/navigation";

import { endSession } from "@/lib/auth";

/**
 * Leaving.
 *
 * It revokes the session row and then clears the cookie, in that order and in
 * that importance: a cookie copied off a shared laptop before she pressed this
 * has to stop working, and only the row can stop it. A sign-out that only
 * deletes the cookie is a sign-out that lies.
 */
export async function signOutAction(): Promise<void> {
  await endSession();
  redirect("/");
}
