"use server";

import { redirect } from "next/navigation";

import { signOut } from "@/lib/staff";

/**
 * Sign out, and land on the one way in — /login, not the desk's old door. The
 * old door still exists and forwards here, but sending somebody through a
 * redirect she does not need is just a slower answer.
 */
export async function signOutAction(): Promise<void> {
  await signOut();
  redirect("/login");
}
