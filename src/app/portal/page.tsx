import { requireMember } from "@/lib/members";

import styles from "./portal.module.css";
import { signOutAction } from "./actions";

/**
 * Where a member's link lands.
 *
 * This is the room, not the furniture. docs/portal-spec.md describes four
 * areas — membership, her occasions, the inside of one, and the
 * correspondence — and none of them is built; they are the next job and they
 * are a large one. What is here is what the door needs in order to be a real
 * door: proof she is signed in, as herself, and a way back out.
 *
 * It says nothing it cannot do. No empty states promising sections that do not
 * exist, no counters, and no line congratulating her for arriving.
 */
export default async function PortalPage() {
  const member = await requireMember();

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <p className={styles.eyebrow}>Revelle Société</p>
        <h1 className={styles.title}>
          {member.name ?? "Your membership"}
        </h1>
        <div className={styles.rule} />
        <p className={styles.line}>
          Signed in as <span className={styles.address}>{member.email}</span>
        </p>

        <div className={styles.out}>
          <form action={signOutAction}>
            <button className={styles.button}>Sign out</button>
          </form>
        </div>
      </div>
    </main>
  );
}
