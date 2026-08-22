import { groupFacets, taggingVocabulary } from "@/lib/desk/facets";

import styles from "../../../desk.module.css";
import { Head } from "../../bits";
import GameForm from "../GameForm";

export const dynamic = "force-dynamic";

/**
 * A game started at the desk.
 *
 * The same affordance /desk/destinations/new has, on the same terms: this
 * creates the game as a DRAFT, and the parts that are authored in a file are
 * written in the file. There a destination's look is created here and its voice
 * is written on the next screen; here a game's words and bounds are created
 * here and its runbook is written in src/lib/games.ts.
 *
 * That is not a dead end, and the note below says so where a curator can read
 * it: scripts/seed-games.mjs matches on the SLUG. A game started here and later
 * given a runbook in the module receives those rows on the next seed — the
 * script adds what is absent and changes nothing that is present, which is the
 * same "left as the desk has it" rule seed-menus.mjs states.
 */
export default async function NewGamePage() {
  const groups = groupFacets(await taggingVocabulary("game"));

  return (
    <>
      <Head eyebrow="The fun" title="Add a game" />
      <p className={styles.note}>
        This creates the game and its bounds, as a draft. Its runbook — the
        steps, the clock, the words to say, what to do when nobody will play —
        is authored in <code>src/lib/games.ts</code> against this game&rsquo;s
        slug, so that a rule the founder wants reworded is a diff a human can
        read in a pull request. <code>npm run seed:games</code> then fills in
        what is missing here and changes nothing you have already written.
      </p>
      <GameForm values={{ status: "draft" }} groups={groups} selected={[]} />
    </>
  );
}
