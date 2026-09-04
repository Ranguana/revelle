"use server";

import { revalidatePath } from "next/cache";

import { requireMember } from "@/lib/members";
import { chooseInOffer } from "@/lib/portal/choose";

/**
 * SHE PICKS ONE OF THE THREE.
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
 */
export async function chooseGameAction(form: FormData): Promise<void> {
  const revelleId = String(form.get("revelleId") ?? "").trim();
  const group = String(form.get("group") ?? "").trim();
  const slug = String(form.get("slug") ?? "").trim();
  if (revelleId.length === 0 || group.length === 0 || slug.length === 0) return;

  // Re-guarded per action rather than trusted from the page that rendered the
  // form: a hidden field is a value from a request, and the only thing that
  // makes this her Revelle is the session, checked here.
  const member = await requireMember();

  await chooseInOffer({
    customerId: member.id,
    revelleId,
    group,
    slug,
  });

  revalidatePath(`/portal/occasions/${revelleId}`);
}
