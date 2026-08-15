import Link from "next/link";

import { requireMember } from "@/lib/members";
import { listOccasions } from "@/lib/portal/occasions";
import { longDate } from "@/lib/portal/sections";

import styles from "./portal.module.css";
import { signOutAction } from "./actions";

/**
 * Where a member's link lands: her occasions.
 *
 * docs/portal-spec.md describes four areas. This is half of the second one —
 * the live one, and the shelf behind it — built no further than it takes to
 * reach the inside of an occasion, which is the screen membership actually
 * buys. Membership, dues, correspondence and the guest list are separate jobs
 * with separate tables and are not pretended at here.
 *
 * ── WHAT IT DOES NOT SAY ─────────────────────────────────────────────
 *
 * No count of anything: not how many she has, not how far along one is, not a
 * status ladder. docs/copy-brief.md bans counting and the same rule that keeps
 * a progress bar off the application keeps a state machine off this page. A
 * Revelle the house is still building is simply not on it (src/lib/portal/
 * occasions.ts), which is the same rule as a deliverable that could not be
 * filled: she is never shown the house's work in progress.
 *
 * It also says nothing at all when she has neither. An empty state promising a
 * section that does not exist is the failure this page was written to avoid;
 * an accepted member with no Revelle yet gets her name, her address, and the
 * way out, which is all that is true.
 */

export const dynamic = "force-dynamic";

export default async function PortalPage() {
  const member = await requireMember();
  const { upcoming, past } = await listOccasions(member.id);

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <p className={styles.eyebrow}>Revelle Société</p>
        <h1 className={styles.title}>{member.name ?? "Your membership"}</h1>
        <div className={styles.rule} />

        {upcoming.length > 0 ? (
          <section className={styles.shelf}>
            <h2 className={styles.shelfHead}>Next</h2>
            <ul className={styles.list}>
              {upcoming.map((occasion) => (
                <li key={occasion.id}>
                  <Link
                    className={styles.entry}
                    href={`/portal/occasions/${occasion.id}`}
                  >
                    <span className={styles.when}>{longDate(occasion.eventDate)}</span>
                    <span className={styles.destination}>
                      {occasion.destination}
                    </span>
                    <span className={styles.tagline}>{occasion.tagline}</span>
                    {/*
                      A persistent mark that this opens. Persistent because
                      there is no hover on a phone and an entry that only looks
                      like a link when a mouse is over it does not look like a
                      link to the person this screen is for.
                    */}
                    <span className={styles.open} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {past.length > 0 ? (
          <section className={styles.shelf}>
            <h2 className={styles.shelfHead}>Before</h2>
            <ul className={styles.list}>
              {past.map((occasion) => (
                <li key={occasion.id}>
                  <Link
                    className={styles.entry}
                    href={`/portal/occasions/${occasion.id}`}
                  >
                    <span className={styles.when}>{longDate(occasion.eventDate)}</span>
                    <span className={styles.destination}>
                      {occasion.destination}
                    </span>
                    <span className={styles.tagline}>{occasion.tagline}</span>
                    {/*
                      A persistent mark that this opens. Persistent because
                      there is no hover on a phone and an entry that only looks
                      like a link when a mouse is over it does not look like a
                      link to the person this screen is for.
                    */}
                    <span className={styles.open} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className={styles.out}>
          <p className={styles.line}>
            Signed in as <span className={styles.address}>{member.email}</span>
          </p>
          <form action={signOutAction}>
            <button className={styles.button}>Sign out</button>
          </form>
        </div>
      </div>
    </main>
  );
}
