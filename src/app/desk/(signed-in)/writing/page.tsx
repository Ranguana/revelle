import { canWrite } from "@/lib/correspondence/writer";
import { MAX_ROOMS, benchRooms, defaultCeiling } from "@/lib/desk/writing";
import { PIECE_KINDS } from "@/lib/tokens";

import styles from "../../desk.module.css";
import { Head } from "../bits";
import WritingForm from "./WritingForm";
import type { PieceChoice, WritingState } from "./state";

/**
 * THE WRITING BENCH.
 *
 * src/lib/correspondence/writer.ts is the one model call in the product — Opus,
 * carrying each room's lexicon, its matched exemplars and its rejected lines —
 * and until this screen it had never run. Not once, in any environment. It was
 * reachable only from a member's own portal, so producing a single line meant a
 * member, an application, a delivered Revelle and an occasion, which means the
 * person whose taste the voices are cannot read what they say.
 *
 * This is where it can be read.
 *
 * ── WHAT IT DOES NOT DO ──────────────────────────────────────────────
 *
 * It never touches a member's data. It composes a throwaway request against a
 * Destination object; there is no member in the module it calls and no
 * parameter through which one could arrive. Nothing is drafted into anybody's
 * occasion, no voice version is pinned, no row is written anywhere.
 *
 * ── AND WHERE IT RUNS ────────────────────────────────────────────────
 *
 * The key is on Render and nowhere else, so the honest local answer is the
 * prompts — which is why assembling them is its own free button rather than a
 * step on the way to a call. `canWrite()` is asked here, before the form is
 * drawn, and where it is false the Write button is not rendered at all and the
 * reason is on the screen instead (rule 9: never point a person at something
 * that cannot be run).
 */

export const dynamic = "force-dynamic";

export default function WritingBenchPage() {
  const open = canWrite();
  const rooms = benchRooms();

  /*
   * ALL NINE PIECE KINDS, because `writerPrompt` supports nine. The member's
   * compose screen offers six — `heading`, `sign_off` and `game_rule` are parts
   * of printed matter the house sets rather than letters she sends — and the
   * consequence is that three of the nine registers have no other surface in
   * the product where anybody could read one.
   */
  const pieces: PieceChoice[] = PIECE_KINDS.map((kind) => ({
    kind,
    label: kind.replace(/_/g, " "),
    ceiling: defaultCeiling(kind),
  }));

  const initial: WritingState = {
    formKey: 0,
    form: { slugs: [], piece: "invitation", ask: "", facts: "", maxWords: "" },
    errors: [],
    run: null,
  };

  return (
    <>
      <Head eyebrow="The engine" title="The writing bench" />

      <p className={styles.note}>
        The real writer, on a request that belongs to nobody. Pick up to{" "}
        {MAX_ROOMS} rooms and one kind of piece, and the same brief is written in
        each so the answers can be read against one another — because the failure
        worth catching is not a bad line, it is the same line in every house.
        Nothing here is written down: no piece, no draft, no occasion, and
        nothing reaches a member. Every run shows which exemplars and which
        refusals the prompt actually carried, and runs the banned-shapes check
        over what came back.
      </p>

      {open ? null : (
        <p className={styles.error}>
          ANTHROPIC_API_KEY is not set on this service, so nothing can be
          written here. The key is set on Render and on nothing else, which is
          where a line has to be written. Showing the prompts below needs no key
          and works anywhere.
        </p>
      )}

      <WritingForm
        rooms={rooms}
        pieces={pieces}
        open={open}
        initial={initial}
        maxRooms={MAX_ROOMS}
      />
    </>
  );
}
