/**
 * WHO MAY WORK THE DESK.
 *
 * Moved out of src/lib/staff.ts, unchanged, and re-exported from there so
 * every existing import still reads. It moved for one reason: staff.ts is
 * marked "server-only" and imports next/headers, so nothing framework-free can
 * read it — and the sign-in door (src/lib/login.ts) has to ask this question,
 * as does the test that proves staff and members are routed to different
 * places. THIS IS THE SAME LIST, IN ONE PLACE. There is no second allowlist
 * anywhere and there must never be.
 *
 * ── THE ALLOWLIST IS AN ENVIRONMENT VARIABLE ─────────────────────────
 *
 * STAFF_EMAILS, comma separated. Not a table, not a constant, not a committed
 * file: the addresses are real personal ones and do not belong in git, the
 * list changes, and it has to be settable on Render without a deploy.
 *
 * IT FAILS CLOSED. Unset or empty means NOBODY is staff and the desk is
 * unreachable — there is no "any signed-in user" fallback and no development
 * default, for the same reason src/lib/db.ts has no local DATABASE_URL
 * fallback. A missing value fails loudly at the point of use.
 */

/**
 * The addresses allowed to sign in, lower-cased and trimmed.
 *
 * Both normalisations are deliberate: one stray space or one capital letter in
 * an environment variable must not lock somebody out of her own tool, and
 * neither failure would be obvious from the outside.
 */
export function staffAllowlist(): readonly string[] {
  return (process.env.STAFF_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.length > 0);
}

/**
 * Is this address staff?
 *
 * Logs the refusal without logging the address. A silent denial when somebody
 * fat-fingers the variable costs an hour of confusion; the address itself in a
 * log line costs more than it is worth, so the line says which of the two
 * things went wrong and nothing else.
 */
export function isStaffEmail(email: string): boolean {
  const list = staffAllowlist();
  if (list.length === 0) {
    console.warn(
      "[staff] STAFF_EMAILS is unset or empty — nobody is staff and the desk " +
        "is closed. This is the fail-closed default, not a bug: set the " +
        "variable (comma-separated addresses) on the service."
    );
    return false;
  }
  const candidate = email.trim().toLowerCase();
  return list.includes(candidate);
}
