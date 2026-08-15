import type { Metadata } from "next";

/**
 * The one part of the desk a signed-out browser may reach.
 *
 * It is a route GROUP rather than a path segment, so the way in stays at
 * /desk/sign-in while everything else lives under the guarded layout in
 * (signed-in). Route groups exist for exactly this: two layouts at one path
 * level, one of which checks a session and one of which cannot.
 */

export const metadata: Metadata = {
  title: "The desk",
  // Internal. Never indexed, never followed.
  robots: { index: false, follow: false, nocache: true },
};

export default function SignedOutLayout({ children }: LayoutProps<"/desk">) {
  return children;
}
