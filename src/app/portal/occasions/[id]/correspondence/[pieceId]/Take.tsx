"use client";

/**
 * COPY, AND PRINT.
 *
 * The two ways this actually travels that are not email. Most of a real guest
 * list gets told in a group chat, and the printed object is the thing she pins
 * to a fridge or leaves on a hall table — docs/portal-spec.md names both, and
 * neither of them needs a server.
 *
 * A client component because both are browser verbs. Nothing else on the
 * review page is, and this deliberately holds no state that matters: if the
 * clipboard is unavailable, the piece is still on the page to select by hand,
 * and if printing is unavailable the browser's own print is still there.
 */

import { useState } from "react";

import styles from "../correspondence.module.css";

export function Take({ body }: { body: string }) {
  const [taken, setTaken] = useState(false);

  return (
    <span className={styles.actions}>
      <button
        type="button"
        className={`${styles.button} ${styles.buttonQuiet}`}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(body);
            setTaken(true);
            // Long enough to be seen and short enough that the control is
            // itself again before she looks back at it.
            setTimeout(() => setTaken(false), 2400);
          } catch {
            // No clipboard. The words are on the page; she can take them.
          }
        }}
      >
        {taken ? "Copied" : "Copy"}
      </button>

      <button
        type="button"
        className={`${styles.button} ${styles.buttonQuiet}`}
        onClick={() => window.print()}
      >
        Print
      </button>
    </span>
  );
}
