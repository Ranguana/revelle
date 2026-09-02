/**
 * WHICH MODEL, AND HOW MUCH ROOM IT GETS.
 *
 * Moved out of src/lib/correspondence/writer.ts, unchanged, and re-exported
 * from there so every existing import still reads. It moved for one reason,
 * and it is the same reason src/lib/staff-allowlist.ts exists: writer.ts is
 * marked `server-only`, so nothing framework-free can read it — and
 * scripts/mood-board.mjs, which spends exactly this model on exactly this
 * ceiling, is a plain node script.
 *
 * THESE ARE THE SAME TWO NUMBERS, IN ONE PLACE. There is no second model name
 * anywhere and there must never be. writer.ts's own argument for exporting
 * them is preserved there and applies here word for word: a caller carrying
 * its own copy is right until one of them moves and then is confidently wrong
 * about a bill (rule 21).
 *
 * Framework-free on purpose: no "server-only", no next/*, nothing that cannot
 * be imported by `node --experimental-strip-types`.
 */

/** The model every call in the house is made against. */
export const MODEL = "claude-opus-5";

/**
 * Room for the piece and for the thinking that reaches it. `max_tokens` caps
 * both together on this model, and a piece that comes back truncated because
 * the ceiling was set to the length of the piece is the sort of bug that only
 * shows up on the shortest ones.
 */
export const MAX_TOKENS = 4000;
