import "server-only";

import { transaction } from "@/lib/db";
import { OPENABLE } from "@/lib/portal/occasions";

/**
 * TAKING ONE OF THE THREE — db/061's write, and the only one there is.
 *
 * ── WHAT THIS IS ALLOWED TO FAIL AT, WHICH IS ALMOST NOTHING ────────
 *
 * db/061 decided that the OFFER binds uniqueness and the choice does not,
 * expressly so that this function cannot refuse her. All three games were
 * delivered into `revelle_game` at approval and are inside the assemblage
 * fingerprint; taking one moves a timestamp on a row she already has. There is
 * no collision to hit, no ratchet to trip, and no reason the house could ever
 * have to say no to a card it dealt her.
 *
 * So the only refusals below are about IDENTITY — is this her Revelle, is this
 * card in it — and they are silent, because a member who has landed on
 * somebody else's Revelle is not owed an explanation of the schema. That is
 * `src/app/portal/occasions/[id]/correspondence/actions.ts`'s pattern: one
 * answer for not-hers and not-there.
 *
 * ── AND SHE MAY CHANGE HER MIND, WITHOUT LIMIT AND WITHOUT COST ─────
 *
 * The clear and the set are one statement so there is no instant at which she
 * has chosen nothing or chosen two — db/061's partial unique index would
 * refuse the second, and a mind-change that could fail halfway is a mechanism
 * that punishes correcting a mistake. CLAUDE.md rule 18 is the same rule from
 * the interface side: nothing moves between the mistake and its fix.
 *
 * The unchosen cards are UNTOUCHED. They stay in the offer, in their delivered
 * order, available. They were given to her; the house does not take two of
 * them back the moment she picks the third.
 */
export async function chooseInOffer(input: {
  /** Scoped on every statement — this is the whole of the authorisation. */
  customerId: string;
  revelleId: string;
  /** The beat, from the rendered offer. 'game:1:0'. */
  group: string;
  /** The card she pressed. A slug, because that is what the page has. */
  slug: string;
}): Promise<boolean> {
  return transaction(async (tx) => {
    /*
      HER REVELLE, HER OFFER, HER CARD — in one statement, so that none of the
      three can be true of a different row than the other two.

      `revelle_game` is named directly rather than composed through the
      registry, and that is deliberate: this is not a read that has to cover
      every pool (src/lib/portal/picks.ts is, and does). It is the write behind
      one button on one beat. If a second pool ever offers a choice, the button
      that offers it will be written then, and it will know its own pool.
    */
    const { rows } = await tx.query(
      `update revelle_game rg
          set chosen_at = case when g.slug = $4 then now() else null end
         from game g,
              revelle r
        where g.id = rg.game_id
          and r.id = rg.revelle_id
          and rg.revelle_id = $2
          and r.customer_id = $1
          and r.status = any($5::revelle_status[])
          and rg.offer_group = $3
        returning rg.game_id, g.slug, rg.chosen_at`,
      // OPENABLE comes from the read path (src/lib/portal/occasions.ts) and is
      // not restated here. CLAUDE.md rule 21: a Revelle she cannot open is a
      // Revelle she cannot choose in, and two copies of that list would
      // eventually disagree about one status and leave a page she can read and
      // cannot act on.
      [input.customerId, input.revelleId, input.group, input.slug, OPENABLE]
    );

    // NOTHING MATCHED, OR THE SLUG IS NOT IN THIS OFFER.
    //
    // The second is the one worth naming: the update above clears the group
    // whether or not the slug is in it, so a bad slug would otherwise leave
    // her with an offer and no choice — a button that un-chose her game and
    // said nothing. Rolling back is the only honest answer, and returning
    // false is what makes the caller leave the page as it was.
    if (rows.length === 0) throw new Rollback();
    if (!rows.some((row) => row.chosen_at !== null)) throw new Rollback();
    return true;
  }).catch((err) => {
    if (err instanceof Rollback) return false;
    throw err;
  });
}

/** Not an error anybody reports. It is how the statement above is undone. */
class Rollback extends Error {}
