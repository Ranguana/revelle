import type { SchemaState } from "@/lib/desk/migrations";

import styles from "../desk.module.css";

/**
 * WHERE THE DATABASE STANDS, ON EVERY SCREEN OF THE TOOL.
 *
 * ── WHY IT LIVES IN THE LAYOUT AND NOT ON A PAGE ────────────────────
 *
 * A number nobody passes is a number nobody reads. A /desk/schema page would
 * be visited by whoever already suspected something, which is the one person
 * who did not need telling — and the whole shape of this failure is that
 * NOBODY SUSPECTED ANYTHING for four weeks. The founder found db/032 by
 * noticing a destination count looked wrong on a dashboard; she was not
 * looking for a migration, she was looking at her catalogue.
 *
 * It is also not scoped to any one screen, which is the other half of the
 * argument. A database stuck at db/032 does not make the destinations list
 * wrong and the dishes list right — it makes EVERY list in the tool a report
 * about a schema weeks out of date. The thing that is untrue is the tool, so
 * the warning belongs to the tool.
 *
 * ── TWO SIZES, AND THE SMALL ONE IS ALWAYS THERE ────────────────────
 *
 *   SchemaFoot   one line in the rail, on every screen, in every state,
 *                including the good one: "db/040 · migrate ran 4 minutes ago,
 *                ok". This is what makes "is production current?" answerable
 *                by looking instead of by archaeology. It is small because
 *                being right is not news.
 *
 *   SchemaBanner the loud form, above the page, drawn ONLY when something is
 *                wrong. A banner that is always present is wallpaper within a
 *                week and stops being read at exactly the moment it starts
 *                being true. So the good state renders nothing here and costs
 *                nobody any attention.
 *
 * `unknown` is drawn as loudly as `failed`, on purpose. "I cannot tell" is not
 * a milder version of "it is fine" — it is the state in which this component
 * has stopped working, and a monitor that hides its own failure is the bug
 * this whole change exists to remove.
 *
 * No new design language: the oxblood rule, the mono eyebrow and the small
 * detail list are the marks `.error`, `.sub` and `.hint` already draw.
 */

const EYEBROW: Record<SchemaState["verdict"], string> = {
  current: "Schema",
  behind: "The database is behind the code",
  failed: "The last deploy did not migrate the database",
  unknown: "The schema monitor cannot answer",
};

export function SchemaBanner({ state }: { state: SchemaState }) {
  if (state.verdict === "current") return null;

  return (
    <section
      className={`${styles.alarm} ${
        state.verdict === "behind" ? styles.alarmWarn : ""
      }`}
      // A live region, because on a client-side navigation this appears
      // without the page around it changing, and an alarm nobody is told
      // about is the shape of thing this file exists to stop.
      role="alert"
    >
      <p className={styles.alarmMark}>{EYEBROW[state.verdict]}</p>
      <p className={styles.alarmHead}>{state.headline}</p>
      {state.detail.length > 0 ? (
        <ul className={styles.alarmDetail}>
          {state.detail.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : null}
      <p className={styles.alarmFoot}>
        {/*
          RULE 9: never point a person at something that cannot be run. The
          database is unreachable from any laptop, so the remedy is never
          "connect and fix it" — it is a place to look and a thing to push.
        */}
        The deploy log for the run above is in Render, under the service&rsquo;s
        Events; the failure block there is greppable as{" "}
        <code>REVELLE_MIGRATE_FAILED</code>. Nothing is repaired from a laptop:
        the fix is a commit, and a deploy whose pre-deploy step finishes.
      </p>
    </section>
  );
}

export function SchemaFoot({ state }: { state: SchemaState }) {
  return (
    <div
      className={`${styles.schemaFoot} ${
        state.verdict === "current" ? "" : styles.schemaFootBad
      }`}
      title={state.headline}
    >
      {state.foot}
    </div>
  );
}
