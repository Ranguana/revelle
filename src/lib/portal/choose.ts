import "server-only";

import type { QueryResultRow } from "pg";

import { transaction } from "@/lib/db";
import { composed } from "@/lib/desk/publish";
import { chooseStatement } from "@/lib/portal/choice";
import { OPENABLE } from "@/lib/portal/occasions";

/**
 * TAKING ONE OF THE CARDS — db/061's write, extended to every pool by db/062.
 *
 * ── WHAT THIS IS ALLOWED TO FAIL AT, WHICH IS ALMOST NOTHING ────────
 *
 * db/061 decided that the OFFER binds uniqueness and the choice does not,
 * expressly so that this function cannot refuse her. Every offered card was
 * delivered into `revelle_<pool>` at approval and is inside the assemblage
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
 * order, available. They were given to her; the house does not take them back
 * the moment she picks another.
 *
 * ── AND IT IS ONE STATEMENT FOR EVERY POOL ──────────────────────────
 *
 * THE PARAGRAPH THIS REPLACES, KEPT PER CLAUDE.md RULE 14, because it was
 * right on the day and it named its own expiry:
 *
 *     "`revelle_game` is named directly rather than composed through the
 *      registry, and that is deliberate: this is not a read that has to cover
 *      every pool... It is the write behind one button on one beat. If a second
 *      pool ever offers a choice, the button that offers it will be written
 *      then, and it will know its own pool."
 *
 * The second pool arrived the next day. db/062 gives the three courses
 * `offer_count = 3`, so there are now four beats she chooses in — a game, an
 * appetizer, a main and a dessert — and the sentence's own condition is met.
 *
 * WHAT IT IS NOT is four buttons. A per-pool write would be four places that
 * must agree about what choosing means, and the disagreement would be
 * invisible: a dish button that forgot to clear the group would leave her with
 * two chosen mains until db/061's partial unique index refused the third, at
 * which point the page would fail on a correction. Rule 21's narrow test —
 * must two surfaces agree about this? — is answered yes by the schema itself,
 * which put `offer_group` and `chosen_at` on EVERY join table precisely so
 * that the mechanism could not become per-pool.
 *
 * The identifiers come from the generated registry and are quoted by Postgres's
 * own `format(%I)`, never by string interpolation here. `pool` arrives from a
 * form field, so it is checked against the registry BEFORE it reaches a
 * statement and an unrecognised value never reaches one at all.
 */
export async function chooseInOffer(input: {
  /** Scoped on every statement — this is the whole of the authorisation. */
  customerId: string;
  revelleId: string;
  /** Which pool the card came out of. From the rendered card, then checked. */
  pool: string;
  /** The beat, from the rendered offer. 'game:1:0', 'the_main:1:0'. */
  group: string;
  /** The card she pressed. A slug, because that is what the page has. */
  slug: string;
}): Promise<boolean> {
  const statement = chooseStatement(input.pool);

  // A POOL THE REGISTRY DOES NOT ISSUE. Not an error state and not rule 19's
  // loud case: `pool` is a value out of a request, so a string naming no pool
  // is the same class of thing as a slug naming no card, and gets the same
  // silent answer. The registry-known pool with no join table is `world`
  // alone, which is the frame the evening is drawn in and can never be a card.
  if (statement === null) return false;

  return transaction(async (tx) => {
    // The registry's identifiers are quoted by the database that will run
    // them, never by us — src/lib/desk/publish.ts's `composed`, which needs a
    // way to ask, and inside a transaction that way is this client.
    const ask = async <T extends QueryResultRow>(
      text: string,
      params?: readonly unknown[]
    ): Promise<T[]> =>
      (await tx.query<T>(text, params ? [...params] : [])).rows;

    /*
      HER REVELLE, HER OFFER, HER CARD — in one statement, so that none of the
      three can be true of a different row than the other two.
    */
    const { rows } = await tx.query(
      await composed(ask, statement.template, statement.identifiers),
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
    // her with an offer and no choice — a button that un-chose her main course
    // and said nothing. Rolling back is the only honest answer, and returning
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
