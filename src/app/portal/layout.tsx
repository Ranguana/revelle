import type { Metadata } from "next";

import { requireMember } from "@/lib/members";

/**
 * THE GUARD, in one place.
 *
 * Wrapping the whole segment means a page added under /portal cannot forget to
 * check — the same reason src/app/desk/(signed-in)/layout.tsx exists. It is
 * not the only check: every Server Action under here calls `requireMember`
 * itself, because an action is its own entry point and is reachable without
 * anybody rendering the page whose form contains it.
 *
 * `requireMember` re-reads whether she is still a member on every request, so
 * a membership that ends does not leave a live session behind it.
 */

export const metadata: Metadata = {
  title: "Your membership",
  // Hers, and nobody else's business. Never indexed, never followed.
  robots: { index: false, follow: false, nocache: true },
};

export default async function PortalLayout({
  children,
}: LayoutProps<"/portal">) {
  await requireMember();
  return children;
}
