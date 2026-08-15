import type { Metadata } from "next";

import QuizFlow from "./QuizFlow";

export const metadata: Metadata = {
  title: "The quiz",
  description:
    "What you are planning, where it happens, how your people actually have fun, and the one thing we could not possibly know.",
  // Nothing here should be indexed as a landing page in its own right, and a
  // half-finished quiz is not a thing to surface in search.
  robots: { index: false, follow: true },
};

/**
 * A Server Component wrapper that does nothing but render the client flow.
 *
 * Kept this way on purpose: `metadata` may only be exported from a Server
 * Component, and the quiz itself has to be client-side because it owns the
 * draft in localStorage.
 */
export default function QuizPage() {
  return <QuizFlow />;
}
