"use server";

import { revalidatePath } from "next/cache";

import { requireMember } from "@/lib/members";
import { chooseInOffer, scheduleInOffer } from "@/lib/portal/choose";

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

/**
 * SHE PUTS ONE OF THE SET ON A DAY — db/069.
 *
 * Founder: "it is a set across different days if host wants it." The field day
 * arrives whole and she spreads it, or does not, per member.
 *
 * ── IT IS ITS OWN ACTION, AND NOT A SECOND ARGUMENT TO chooseAction ──
 *
 * Taking a game and placing it on Sunday are two decisions, and bundling them
 * would force the first to imply the second: every card she took would land on
 * a day, and null — SHE HAS NOT SAID — would stop being expressible. That is
 * the value the column exists to hold, and a mechanism that cannot represent
 * "not yet" invents an answer she did not give (rule 16).
 *
 * Everything else is chooseAction's, for chooseAction's reasons: it revalidates
 * and does not redirect, the session is what makes it her Revelle, and there is
 * no error to render because there is no refusal to report that she caused.
 */
export async function scheduleAction(form: FormData): Promise<void> {
  const revelleId = String(form.get("revelleId") ?? "").trim();
  const pool = String(form.get("pool") ?? "").trim();
  const group = String(form.get("group") ?? "").trim();
  const slug = String(form.get("slug") ?? "").trim();
  const raw = String(form.get("day") ?? "").trim();
  if (
    revelleId.length === 0 ||
    pool.length === 0 ||
    group.length === 0 ||
    slug.length === 0
  ) {
    return;
  }

  // AN EMPTY SELECTION IS "SHE HAS NOT SAID", NOT A FAILED PARSE. The control
  // carries a blank option on purpose — a set she is running without having
  // decided the days is a real and common state — so an empty string is the
  // member unscheduling, and anything that is not a whole number is a request
  // that never reaches a statement.
  const day = raw.length === 0 ? null : Number(raw);
  if (day !== null && !Number.isInteger(day)) return;

  const member = await requireMember();

  await scheduleInOffer({
    customerId: member.id,
    revelleId,
    pool,
    group,
    slug,
    day,
  });

  revalidatePath(`/portal/occasions/${revelleId}`);
}
