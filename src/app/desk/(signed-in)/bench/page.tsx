import Link from "next/link";

import styles from "../../desk.module.css";
import { Head } from "../bits";
import BenchForm from "./BenchForm";

/**
 * THE TEST BENCH.
 *
 * The desk could show every row in the library and nothing about what any of it
 * DOES. Two people are tuning a selection engine whose behaviour was invisible
 * to them: a menu scoped to a destination, a tone tagged, an occasion vetoed —
 * all of it landed in a table and none of it could be seen working until a real
 * application arrived and it was too late to be curious.
 *
 * This is where it can be seen working. Compose a host, run the ACTUAL engine
 * against the catalogue as it stands right now, and read what she would have
 * received, including everything the house side is told and she is not.
 *
 * ── IT RUNS THE ENGINE. IT DOES NOT MODEL IT ─────────────────────────
 *
 * `runSelection` is pure — a snapshot in, candidates out, no database handle,
 * no writes — and that purity is exactly what makes this page possible without
 * a second implementation to drift. Nothing about scoring, dithering, the beam
 * search, the fingerprint or the explanation is reimplemented or approximated
 * here. See src/lib/desk/bench.ts for the list of things a run does not leave
 * behind.
 */

export const dynamic = "force-dynamic";

export default function BenchPage() {
  return (
    <>
      {/*
        BOTH LINKS OPEN A SECOND TAB, and that is the workflow rather than a
        flourish. The run and the run before it live in this page's own state —
        deliberately, because writing them down would be persistence, and a
        bench that persists is a bench that can be mistaken for a proposal.
        Navigating away therefore loses the comparison, and the comparison is
        the point: toggle a scoping in the other tab, come back to this one,
        press Run, and the two runs sit beside each other.
      */}
      <Head eyebrow="The engine" title="The test bench">
        <Link
          href="/desk/matrix"
          target="_blank"
          rel="noreferrer"
          className={styles.filter}
        >
          The connections, in a new tab
        </Link>
        <Link
          href="/desk/coverage"
          target="_blank"
          rel="noreferrer"
          className={styles.filter}
        >
          The coverage board, in a new tab
        </Link>
      </Head>

      <p className={styles.note}>
        A host who does not exist, put through the engine that serves the ones
        who do. Nothing here is written down: no application, no job, no
        proposal, no issued assemblage, and nothing is learned about anybody. The
        catalogue is read exactly as it stands at the moment you press the
        button, so a scoping you changed a minute ago is already in the answer.
        The run and the one before it live in this tab and nowhere else — change
        a connection in the other tab, come back, press Run, and the two sit
        side by side with what moved marked.
      </p>

      <BenchForm />
    </>
  );
}
