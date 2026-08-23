/**
 * WHAT A RETIREMENT SAYS, AND WHERE THE DESK READS IT FROM.
 *
 * CLAUDE.md rule 17: a status change on a governed class carries its reason,
 * IN A COLUMN. db/042 adds the two columns and the four constraints; this file
 * is the reading half — the SQL fragments every destination screen selects, and
 * the one function that turns a row into something a component can render
 * without deciding anything for itself.
 *
 * ── WHY THIS IS A MODULE AND NOT THREE LINES ON A PAGE ──────────────
 *
 * Because two screens show it and a third will. `db/028` retired Cap Ferrat
 * and the reason lived in a SQL comment, which is exactly the failure of
 * putting a rule where only one reader can see it. A retirement sentence
 * assembled independently on the library list and on a destination's own page
 * would drift the first time somebody improved one of them, and the two would
 * then disagree about a room nobody can be sent to.
 *
 * ── THE TWO HOPS, AND WHY IT STOPS AT TWO ───────────────────────────
 *
 * A successor may itself be retired — db/042 permits it and argues why at
 * length: if Côte d'Azur is ever folded into something, Cap Ferrat's pointer at
 * it is still TRUE, and the alternatives are refusing that retirement or
 * falsifying Cap Ferrat's history to keep the link tidy.
 *
 * So the read follows the chain exactly two hops: the successor, and — only
 * when the successor is itself retired — the name of what took ITS place. Two
 * is enough to say the true sentence ("folded into Côte d'Azur, which is
 * retired too and was folded into X") and short enough to be two LEFT JOINs
 * rather than a recursive CTE.
 *
 * The bound is also the cycle defence. db/042 does NOT forbid A → B → A: a
 * CHECK cannot see another row, and a trigger walking the chain on every write
 * would be guarding a two-step mistake nobody has made. A fixed number of hops
 * on the reading side means such a cycle is wrong data that renders as a
 * strange sentence, and never a page that does not return.
 */

/** The columns, for a query whose `world` is aliased `w`. */
export const RETIREMENT_COLUMNS = `
  w.retirement_note,
  sup.id::text        as superseded_id,
  sup.name            as superseded_name,
  sup.status::text    as superseded_status,
  sup_next.name       as superseded_next_name`;

/** The two hops. Requires the same `w` alias. */
export const RETIREMENT_JOIN = `
  left join world sup      on sup.id = w.superseded_by
  left join world sup_next on sup_next.id = sup.superseded_by`;

/** What `RETIREMENT_COLUMNS` returns, plus the status the screen already has. */
export type RetirementRow = {
  status: string;
  retirement_note: string | null;
  superseded_id: string | null;
  superseded_name: string | null;
  superseded_status: string | null;
  superseded_next_name: string | null;
};

export type Successor = {
  readonly id: string;
  readonly name: string;
  /** The successor is itself retired. Legal, and the desk says so. */
  readonly retired: boolean;
  /** What took the successor's place, when the successor is retired. */
  readonly next: string | null;
};

export type Retirement = {
  /** In force now, as opposed to a record kept after coming back. */
  readonly retired: boolean;
  readonly note: string | null;
  readonly successor: Successor | null;
  /**
   * Retired, and nothing says why.
   *
   * db/042's constraint makes this unreachable for anything retired after it
   * applied, and it is deliberately still modelled: the desk must never render
   * a blank where a reason belongs and leave the reader to guess whether the
   * room has no reason or the screen forgot to fetch one. Rule 16 — say it at
   * the point of use.
   */
  readonly unexplained: boolean;
};

/**
 * The standing sentence for a room that is kept and not offered.
 *
 * Lives here rather than on the library list because the destination page says
 * the same thing, and two copies of a sentence about what a status MEANS is
 * how the two screens end up meaning different things.
 */
export const RETIRED_SUBTITLE =
  "Kept for the record. Not offered, and not matched to anybody.";

/** True when the string carries something a person wrote. */
function said(value: string | null): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * The retirement record on a row, or null when there is nothing to say.
 *
 * Null is returned only for a row that is NOT retired and carries no record —
 * the ordinary case for every live room. A row that is retired always returns
 * a record even with nothing in the columns, because "retired and unexplained"
 * is itself the thing that has to reach the screen.
 *
 * ── A RECORD OUTLIVES THE RETIREMENT ─────────────────────────────────
 *
 * A room brought back as a draft KEEPS its note and its lineage. db/042 argues
 * that at length and it is the reason `retired` is a field here rather than the
 * function's precondition: the same record renders in the present tense on a
 * retired room and in the past tense on one that has returned.
 */
export function retirementRecord(row: RetirementRow): Retirement | null {
  const retired = row.status === "retired";
  const note = said(row.retirement_note) ? row.retirement_note.trim() : null;

  const successor: Successor | null =
    row.superseded_id && said(row.superseded_name)
      ? {
          id: row.superseded_id,
          name: row.superseded_name.trim(),
          retired: row.superseded_status === "retired",
          next:
            row.superseded_status === "retired" && said(row.superseded_next_name)
              ? row.superseded_next_name.trim()
              : null,
        }
      : null;

  if (!retired && note === null && successor === null) return null;

  return { retired, note, successor, unexplained: retired && note === null };
}

/* ── the writing half ───────────────────────────────────────────────── */

/**
 * THE STATUSES THE PLAIN STATUS CONTROL MAY SET. `retired` is not one.
 *
 * `setDestinationStatus` is the Publish / Unpublish / Bring-back button. It
 * carries a status and nothing else, and after db/042 that is structurally
 * insufficient for one of the three values: a retirement needs words, and a
 * button cannot supply them.
 *
 * The wrong fix — and the tempting one, because it is one line — is to leave
 * `retired` in the accepted list and let the database refuse it. That turns
 * rule 17 into a stack trace at the desk, and it means the control ADVERTISES
 * a transition it cannot perform. Rule 16: refuse it by name, at the point of
 * use, or honour it. It is refused by name, and `retireDestination` is where
 * the transition actually lives.
 *
 * Exported from here rather than declared in the action so the guard is a
 * value a test can hold, instead of a sentence a test has to grep for.
 */
export const PLAIN_STATUSES: readonly string[] = ["draft", "published"];

/** What the desk needs before it may retire a room. */
export type RetirementInput = {
  readonly note: string;
  readonly successorId: string | null;
};

export type RetirementDraft =
  | { readonly error: string; readonly value: null }
  | { readonly error: null; readonly value: RetirementInput };

const UUID = /^[0-9a-f-]{36}$/i;

/**
 * THE ONE DOOR A RETIREMENT GOES THROUGH FROM THE DESK.
 *
 * Every refusal here has a constraint behind it in db/042, and that pairing is
 * the design rather than a coincidence: the database is what makes the rule
 * true, and this function is what makes the refusal a sentence a curator can
 * act on instead of `violates check constraint
 * "world_retired_has_reason"`. Neither is redundant — remove the constraint and
 * a script walks round this; remove this and the desk shows a stack trace.
 *
 *   blank note        world_retired_has_reason, world_retirement_note_not_blank
 *   folded into self  world_superseded_by_is_another_room
 *
 * Pure, and separate from the server action, because the action needs a
 * database and a session and this needs neither — which is what lets the rule
 * be tested rather than trusted.
 */
export function retirementFrom(
  note: string,
  successor: string,
  self: string
): RetirementDraft {
  const said = note.trim();
  if (said.length === 0) {
    return {
      error:
        "A retirement carries its reason. Say why this room is closing — " +
        "what the desk shows six months from now is this sentence and " +
        "nothing else.",
      value: null,
    };
  }

  const to = successor.trim();
  if (to.length === 0) return { error: null, value: { note: said, successorId: null } };

  if (!UUID.test(to)) {
    return { error: "That is not a destination this desk knows.", value: null };
  }
  if (to === self) {
    return {
      error: "A room cannot be folded into itself.",
      value: null,
    };
  }
  return { error: null, value: { note: said, successorId: to } };
}
