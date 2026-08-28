import type { BenchRoom, WritingRun } from "@/lib/desk/writing";
import type { PieceKind } from "@/lib/tokens";

/**
 * What the writing bench holds between two clicks.
 *
 * Its own module for the reason the selection bench's state.ts gives: a
 * "use server" file may only export async functions, so the empty state and the
 * form's shape cannot live beside the action.
 *
 * EVERY IMPORT HERE IS `import type`, and that is not tidiness. `WritingRun`
 * and `BenchRoom` live in a module that reaches src/lib/destinations.ts — ten
 * thousand lines of authored world — and a value import would carry the whole
 * catalogue into the browser bundle to render a slug and a name. Types are
 * erased; the strings arrive as props.
 */

/** The form, exactly as it is typed. Parsed in the action, never before. */
export type WritingFormValues = {
  slugs: string[];
  piece: PieceKind;
  /** Blank means the house's standby ask for that piece. */
  ask: string;
  /** One fact a line, the way the member's compose screen takes them. */
  facts: string;
  /** Blank means the house ceiling for that piece; 0 means none. */
  maxWords: string;
};

export type WritingState = {
  /** Bumped on every action, to redraw the form from what the server echoed. */
  formKey: number;
  form: WritingFormValues;
  errors: string[];
  /**
   * ONE RUN, NOT A HISTORY. The side-by-side lives inside a single run — up to
   * three rooms answering the same brief — so there is nothing to keep from the
   * run before. A stack of past runs would be persistence by another name, and
   * a bench that persists is a bench whose output can be mistaken for something
   * the house offered somebody.
   */
  run: WritingRun | null;
};

/** A room as the picker draws it, re-exported so the form needs one import. */
export type { BenchRoom };

/** A piece kind as the select draws it. Assembled by the page, which may read
 * the catalogue; the form may not. */
export type PieceChoice = {
  kind: PieceKind;
  label: string;
  /** The house ceiling, shown so a blank field is not a mystery. */
  ceiling: number | null;
};
