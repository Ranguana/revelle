"use server";

import { revalidatePath } from "next/cache";

import { requireMember } from "@/lib/members";
import { chooseInOffer } from "@/lib/portal/choose";

/**
 * SHE PICKS ONE OF THE THREE — the game, and since db/062 each of the courses.
 *
 * ── IT REVALIDATES AND IT DOES NOT REDIRECT ─────────────────────────
 *
 * CLAUDE.md rule 18, which is the rule this whole feature is built around:
 * between a mistake and its fix, the thing being corrected stays exactly where
 * it was. She presses the second card, the second card is marked, and the page
 * she is looking at is the page she was looking at — same scroll, same open
 * sections, same three cards in the same order. No advance, no jump to a
 * confirmation, no reshuffle that puts what she chose at the top.
 *
 * A redirect here would be the convenience-shaped data bug that rule names:
 * the correction for pressing the wrong card is pressing the right one, and
 * that is only possible if the right one has not moved.
 *
 * ── AND IT RETURNS NOTHING ──────────────────────────────────────────
 *
 * There is no error state to render because there is no refusal to report.
 * `chooseInOffer` cannot decline a card she was dealt — db/061 made the offer
 * the thing that binds precisely so that it could not — and its `false` means
 * the revelle or the slug was not hers, which is the case the page already
 * answers by simply being what it was. Nothing is invented to fill a message
 * slot that has no message.
 *
 * ── ONE ACTION, NOT ONE PER POOL — db/062 ───────────────────────────
 *
 * This was `chooseGameAction` for a day. There are four beats she chooses in
 * now — the game and the three courses — and they are the same gesture on the
 * same schema, so they are one action carrying the card's pool. Four actions
 * would be four places that must agree about what choosing means, and
 * `chooseInOffer` is where that sentence lives (CLAUDE.md rule 21).
 *
 * `pool` is a hidden field, which means it is a value from a request and is
 * checked against the generated registry before it reaches a statement. See
 * `chooseStatement`.
 */
export async function chooseAction(form: FormData): Promise<void> {
  const revelleId = String(form.get("revelleId") ?? "").trim();
  const pool = String(form.get("pool") ?? "").trim();
  const group = String(form.get("group") ?? "").trim();
  const slug = String(form.get("slug") ?? "").trim();
  if (
    revelleId.length === 0 ||
    pool.length === 0 ||
    group.length === 0 ||
    slug.length === 0
  ) {
    return;
  }

  // Re-guarded per action rather than trusted from the page that rendered the
  // form: a hidden field is a value from a request, and the only thing that
  // makes this her Revelle is the session, checked here.
  const member = await requireMember();

  await chooseInOffer({
    customerId: member.id,
    revelleId,
    pool,
    group,
    slug,
  });

  revalidatePath(`/portal/occasions/${revelleId}`);
}
