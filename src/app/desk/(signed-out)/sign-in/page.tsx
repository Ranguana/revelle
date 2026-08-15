import { redirect } from "next/navigation";

/**
 * The desk's old door, kept open just far enough to point at the new one.
 *
 * There is one way in now, at /login, for curators and members alike — see
 * src/lib/login.ts for why there must not be two. This route survives because
 * both people have it bookmarked and because a bookmark that 404s is a support
 * conversation; it holds no form and asks no question.
 *
 * `permanentRedirect` would be the tidier verb, but it is cached by browsers
 * forever and this path may want to be something else one day. A plain
 * redirect costs one hop and keeps the option.
 */
export default function DeskSignInPage() {
  redirect("/login");
}
