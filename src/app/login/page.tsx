import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { currentSubject } from "@/lib/auth";
import { destinationFor } from "@/lib/session";

import styles from "./login.module.css";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign in",
  // A door is not a page to arrive at from a search result, and a sign-in form
  // in an index is only ever useful to somebody phishing with it.
  robots: { index: false, follow: false, nocache: true },
};

/**
 * THE ONE WAY IN, for both kinds of person.
 *
 * A curator and a member type an address into the same field and get the same
 * answer; where the link lands is decided when it is clicked, by
 * `destinationFor` (src/lib/session.ts), from the allowlist. Nothing on this
 * page asks which one she is, because asking would mean answering.
 *
 * Already signed in? Go where she was going. The commonest way to arrive at a
 * sign-in page is a bookmark, and showing a form that would do nothing is the
 * least useful thing the route can do.
 */
export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const subject = await currentSubject();
  if (subject) redirect(destinationFor(subject));

  const params = await searchParams;

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <LoginForm failedLink={params.error === "link"} />
        <Link className={styles.back} href="/">
          Revelle Société
        </Link>
      </div>
    </main>
  );
}
