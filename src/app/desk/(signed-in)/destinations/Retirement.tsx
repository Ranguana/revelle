import Link from "next/link";

import type { Retirement } from "@/lib/desk/retirement";
import type { Carried } from "@/lib/desk/review";

import styles from "../../desk.module.css";
import { ReviewFields } from "../bits";
import { retireDestination } from "./actions";

/**
 * WHAT A RETIREMENT LOOKS LIKE ON THE DESK.
 *
 * db/042 gave a retirement two columns; this is the half that puts them on a
 * screen. Without it the migration would have satisfied CLAUDE.md rule 17's
 * letter and missed its point — the rule says the reason goes in a column
 * BECAUSE the desk has to render it and a person six months out has to read it
 * without an archaeologist.
 *
 * ── THIS EXTENDS THE RETIRED-ROW TREATMENT. IT DOES NOT REPLACE IT ──
 *
 * The library list already says a retired room is retired, in three places
 * that were argued for separately and are all still here: the pill beside the
 * name, the "Kept for the record" subtitle, and the row's closed tint. Those
 * answer "can I send somebody here" (no). What was missing is the next
 * question, which is the one db/028 could not answer: WHERE DID IT GO.
 *
 * So this adds one line under the existing subtitle and nothing else. No new
 * colour, no new mark, no second idiom for closed-ness — `styles.when` is the
 * subtitle voice this table already speaks in, and the successor is an
 * ordinary `styles.link` to an ordinary destination page.
 */

/**
 * THE FOLD, IN ONE LINE, FOR A DENSE TABLE CELL.
 *
 * Three shapes, because a retirement genuinely has three and collapsing them
 * would each time hide the interesting one:
 *
 *   FOLDED       lineage exists. The successor is a link, because the entire
 *                argument for an FK over a sentence was that the desk could
 *                draw one.
 *
 *   UNEXPLAINED  retired with nothing written down. Only reachable for rooms
 *                retired before db/042; said out loud rather than rendered as
 *                an empty space, which is rule 16 — a reader must never have
 *                to guess whether the room has no reason or the screen failed
 *                to fetch one.
 *
 *   PLAIN        a reason and no successor. The commonest real retirement:
 *                most rooms that close were not absorbed by another one.
 */
export function FoldedInto({ record }: { record: Retirement }) {
  if (record.successor === null && record.note === null) return null;

  return (
    <>
      {record.successor ? (
        <div className={styles.when}>
          {/*
            PAST TENSE FOR A ROOM THAT HAS COME BACK. db/042 keeps the record
            after an un-retirement on purpose — it is a record of what happened,
            not a description of the current state — so the sentence has to stop
            claiming the room is closed the moment it is not.
          */}
          {record.retired ? "Folded into " : "Was folded into "}
          <Link
            href={`/desk/destinations/${record.successor.id}`}
            className={styles.link}
          >
            {record.successor.name}
          </Link>
          {record.successor.retired ? (
            <>
              {" — which is retired too"}
              {record.successor.next
                ? `, and was folded into ${record.successor.next}`
                : ""}
            </>
          ) : null}
          .
        </div>
      ) : null}

      {record.unexplained ? (
        <div className={styles.when}>
          No reason on record. It was retired before one was required.
        </div>
      ) : record.note ? (
        <div className={styles.when}>{record.note}</div>
      ) : null}
    </>
  );
}

/**
 * THE SAME RECORD, AT LENGTH, ON THE DESTINATION'S OWN PAGE.
 *
 * `absorbed` is the reverse question — what was folded into THIS room — and it
 * is not decoration. Côte d'Azur holds Cap Ferrat's menus, drinks and dishes
 * (db/028 moved them) and nothing on its page said where they came from. A
 * curator reading a room's table wants to know which claims are inherited, and
 * the FK is what makes that askable in one query.
 */
export function RetirementPanel({
  record,
  absorbed,
}: {
  record: Retirement | null;
  absorbed: readonly { id: string; name: string; note: string | null }[];
}) {
  if (record === null && absorbed.length === 0) return null;

  return (
    <section className={styles.panel}>
      <h2 className={styles.panelHead}>
        <span>
          {record === null
            ? "What was folded into this room"
            : record.retired
              ? "Why it was retired"
              : "Retired once, and brought back"}
        </span>
      </h2>

      {record ? (
        <>
          {record.unexplained ? (
            <p className={styles.hint}>
              This room was retired before a reason was required, and nobody
              wrote one down. If you know why, say so here — the note is what
              the desk will show from now on.
            </p>
          ) : (
            <p className={styles.note}>{record.note}</p>
          )}

          {record.successor ? (
            <p className={styles.hint}>
              {record.retired ? "Folded into " : "Was folded into "}
              <Link
                href={`/desk/destinations/${record.successor.id}`}
                className={styles.link}
              >
                {record.successor.name}
              </Link>
              {record.successor.retired ? (
                <>
                  {", which is itself retired"}
                  {record.successor.next
                    ? ` and was folded into ${record.successor.next}`
                    : ""}
                </>
              ) : null}
              . Its menus, drinks and dishes moved with it; its voice and its
              tags stayed here.
            </p>
          ) : (
            <p className={styles.hint}>
              Nothing succeeded it. A retirement does not have to be a merge —
              most are not.
            </p>
          )}
        </>
      ) : null}

      {absorbed.length > 0 ? (
        <>
          <p className={styles.hint}>
            {absorbed.length === 1 ? "One room was" : `${absorbed.length} rooms were`}{" "}
            folded into this one. Its claims may be here because of that.
          </p>
          <ul className={styles.chips}>
            {absorbed.map((room) => (
              <li key={room.id} className={styles.chip}>
                <Link
                  href={`/desk/destinations/${room.id}`}
                  className={styles.link}
                >
                  {room.name}
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}

/**
 * CLOSING A ROOM, WITH SOMEWHERE TO SAY WHY.
 *
 * The desk had no retire control at all before this — `setDestinationStatus`
 * accepted `retired` and no screen ever sent it — which meant the only way to
 * close a room was to write a migration. That is exactly how Cap Ferrat was
 * retired, and exactly how its reason ended up in a SQL comment.
 *
 * ── THE REASON IS REQUIRED, AND THE SUCCESSOR IS NOT ────────────────
 *
 * Which is db/042's asymmetry, rendered: `world_retired_has_reason` demands
 * words on every retirement, `world_lineage_has_words` demands words only if
 * there is a pointer, and nothing demands a pointer. Most rooms that close were
 * not absorbed by another one, so a required successor select would push
 * curators into naming a room that did not actually take its place — a
 * falsehood the FK would then make look authoritative.
 *
 * `required` on the textarea is the browser's copy of the rule, not the rule.
 * `retirementFrom` refuses a blank reason server-side and the CHECK refuses it
 * under that, so the three agree and the outermost one is the only one a
 * curator normally meets.
 */
export function RetireForm({
  id,
  carried,
  candidates,
}: {
  id: string;
  carried: Carried | null;
  candidates: readonly { id: string; name: string }[];
}) {
  return (
    <section className={styles.panel}>
      <h2 className={styles.panelHead}>
        <span>Retire this destination</span>
      </h2>
      <p className={styles.hint}>
        A retired room is kept, not deleted — its voice, its tags and any
        Revelle ever issued from it stay exactly as they are. It stops being
        offered and stops being matched to anybody.
      </p>
      <form action={retireDestination} className={styles.form}>
        <input type="hidden" name="id" value={id} />
        <ReviewFields carried={carried} />

        <div className={styles.field}>
          <label className={styles.label} htmlFor="retirement_note">
            Why (required)
          </label>
          <textarea
            id="retirement_note"
            name="retirement_note"
            className={styles.textarea}
            rows={3}
            required
            placeholder="What is closing this room, in your own words. This is what the desk shows from now on."
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="superseded_by">
            Folded into (optional)
          </label>
          <select
            id="superseded_by"
            name="superseded_by"
            className={styles.select}
            defaultValue=""
          >
            <option value="">Nothing — it is simply closing</option>
            {candidates.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name}
              </option>
            ))}
          </select>
        </div>

        <button className={styles.buttonDanger}>Retire this destination</button>
      </form>
    </section>
  );
}
