import {
  driftSummary,
  hasDrift,
  toneLiteral,
  type DestinationDrift,
  type ProseDrift,
} from "@/lib/desk/drift";

import styles from "../../desk.module.css";

/**
 * AGAINST THE FILE.
 *
 * The screen half of src/lib/desk/drift.ts — read its header first, the
 * argument is all there. What is decided HERE is only how it is said, and the
 * two decisions worth defending are these:
 *
 * NOTHING ON THIS PANEL IS A BUTTON. Not one control writes anything. Prose is
 * shown in two panes and reconciled by a person; tags are shown as a literal a
 * person copies. The moment there is a "make the file match" or a "make the
 * database match" here, this stops being a report and becomes the overwrite
 * that scripts/seed-destinations.mjs spent its whole header refusing to do.
 *
 * IT SAYS WHAT DRIFT MEANS, IN WORDS, EVERY TIME. Not once in a tooltip and
 * not in a doc. A curator meeting a red count with no explanation will read it
 * as an error and try to make it go away, and the correct thing to do with
 * drift is often nothing at all.
 */

function Pair({ item }: { item: ProseDrift }) {
  return (
    <div>
      <p className={styles.driftField}>
        {item.label} <span className={styles.when}>{item.where}</span>
      </p>
      <div className={styles.driftPair}>
        <div className={styles.driftSide}>
          <span className={styles.label}>In the file</span>
          <pre className={styles.driftText}>{item.file || "—"}</pre>
        </div>
        <div className={styles.driftSide}>
          <span className={styles.label}>Live, at the desk</span>
          <pre className={styles.driftText}>{item.live || "—"}</pre>
        </div>
      </div>
    </div>
  );
}

export default function Drift({
  report,
  name,
}: {
  report: DestinationDrift;
  name: string;
}) {
  if (!report.authored) {
    return (
      <section className={styles.panel} id="file">
        <h2 className={styles.panelHead}>
          <span>Against src/lib/destinations.ts</span>
        </h2>
        <p className={styles.hint}>
          The file authors no destination with the slug{" "}
          <code>{report.slug}</code>, so there is nothing to compare. {name} was
          started here rather than in code. That is legal and it has one
          consequence worth knowing: a fresh database seeded from the file will
          not contain it at all.
        </p>
      </section>
    );
  }

  const rowProse = report.prose.filter((item) => item.source === "row");
  const voiceProse = report.prose.filter((item) => item.source === "voice");
  const drifted = hasDrift(report);

  return (
    <section className={styles.panel} id="file">
      <h2 className={styles.panelHead}>
        <span>Against src/lib/destinations.ts</span>
        <span>{drifted ? driftSummary(report).join(" · ") : "no difference"}</span>
      </h2>

      <p className={styles.note}>
        Neither side is wrong. <strong>The database is what ships</strong> — a
        Revelle issued today carries these rows, not the file. <strong>The file
        is what seeds a fresh environment</strong> — a new database, a restored
        backup, a colleague&rsquo;s machine.{" "}
        <code>scripts/seed-destinations.mjs</code> never overwrites a row that
        already exists, on purpose, so a difference left here stays here: a
        rebuild would come up with the file&rsquo;s words and silently revert
        whatever was decided at this desk.
      </p>

      {!drifted ? (
        <p className={styles.hint}>
          Everything comparable matches the file
          {report.voiceCompared ? ", voice included" : ""}.
        </p>
      ) : null}

      {rowProse.length > 0 || voiceProse.length > 0 ? (
        <>
          <h3 className={styles.driftHead}>
            The writing — shown, never overwritten
          </h3>
          <p className={styles.hint}>
            These are authored essays with arguments written around them in the
            file. There is no button here to push either way in either
            direction: reconciling them is a person&rsquo;s job, in an editor,
            with the reasoning beside the words.
          </p>
          {rowProse.map((item) => (
            <Pair key={item.key} item={item} />
          ))}
          {voiceProse.length > 0 ? (
            <>
              <p className={styles.hint}>
                The voice in force, against the voice the file authors. A
                published voice can never be edited (db/004) — a difference
                here means a later version was published at the desk, or the
                file was rewritten after this one was published.
              </p>
              {voiceProse.map((item) => (
                <Pair key={item.key} item={item} />
              ))}
            </>
          ) : null}
        </>
      ) : null}

      {!report.voiceCompared ? (
        <p className={styles.hint}>
          No published voice, so none was compared. That is look-only, which
          db/004 treats as legal — not a difference.
        </p>
      ) : null}

      <h3 className={styles.driftHead}>The tone tags — copyable</h3>

      {report.tones.length === 0 ? (
        <p className={styles.hint}>
          The tone tags on this row are exactly the ones{" "}
          <code>DESTINATION_TONES</code> authors.
        </p>
      ) : (
        <>
          <p className={styles.hint}>
            A tone code and a weight carry no argument — they are data, so the
            desk&rsquo;s version of them can go back into the file as a code
            change. The seeder reports these differences and leaves them alone;
            this is where a decision made here becomes a commit.
          </p>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tone</th>
                <th>In the file</th>
                <th>Live, at the desk</th>
              </tr>
            </thead>
            <tbody>
              {report.tones.map((tone) => (
                <tr key={tone.code}>
                  <td>
                    <code>{tone.code}</code>
                  </td>
                  <td className={styles.numeric}>
                    {tone.file === null ? "not tagged" : tone.file}
                  </td>
                  <td className={styles.numeric}>
                    {tone.live === null ? "not tagged" : tone.live}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <pre className={styles.copyBlock}>
            {toneLiteral(report.slug, report.liveTones)}
          </pre>
        </>
      )}

      {report.unauthoredTags > 0 ? (
        <p className={styles.hint}>
          This destination also carries {report.unauthoredTags} facet tag
          {report.unauthoredTags === 1 ? "" : "s"} in dimensions outside{" "}
          <code>voice_tone</code>. The file authors none of those — there is
          nothing on the other side for them to differ from, and no shape in{" "}
          <code>src/lib/destinations.ts</code> to paste them into, so no block
          is offered for them.
        </p>
      ) : null}

      <p className={styles.hint}>
        Not compared: the look. <code>world.tokens</code> against{" "}
        <code>Destination.look</code> is mechanical and could be, but sixteen
        hex pairs would bury whatever else is on this panel. It is named here
        rather than left to be assumed.
      </p>
    </section>
  );
}
