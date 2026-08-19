import "server-only";

/**
 * A PIECE, AS SOMETHING THAT ARRIVES IN AN INBOX.
 *
 * Rendering only, plus the loop that hands each recipient to Resend. The
 * transport is src/lib/email.ts, which is wired and has really delivered; this
 * file does not know what an API key is.
 *
 * ── TWO RENDERERS, AND THAT IS THE POINT ─────────────────────────────
 *
 * `voicedHtml` takes a destination and sets the piece on its paper, in its
 * type. `plainHtml` takes a string and no destination at all — there is no
 * parameter through which a palette could arrive, so a cancellation cannot be
 * set in Bodoni on terracotta no matter what a future caller passes. Same
 * argument as ./plain.ts: the rule is enforced by what a function can be
 * given, not by what it is asked to do.
 *
 * A plain message in a charming envelope is still the house being charming at
 * somebody about a hospital, and the envelope is half the message.
 *
 * ── WHO IT IS FROM ───────────────────────────────────────────────────
 *
 * From the configured sending address, because that is the domain Resend has
 * verified and mail from anywhere else does not arrive. Reply-to is HERS, so a
 * guest who hits reply reaches the woman throwing the party rather than a
 * société they have never heard of. docs/portal-spec.md leaves "who sends" as
 * an open question; this is the smallest honest answer available today, and
 * the Copy route beside it in the interface exists because most of this
 * travels by group chat anyway.
 */

import { sendEmail } from "@/lib/email";
import type { Destination } from "@/lib/tokens";

/**
 * The subject line: the piece's own first sentence.
 *
 * Nothing is invented and nothing is prefixed. "Dune Road, Friday" is a better
 * subject than anything a template could produce, and it is already written —
 * the house wrote it. A subject line that announced the occasion, or the
 * société, would be the one line of the correspondence not in the destination's
 * voice, sitting where it is read first.
 */
export function subjectFor(body: string): string {
  const first = body.split("\n").find((line) => line.trim().length > 0) ?? "";
  const sentence = first.trim().split(/(?<=[.?!])\s/)[0] ?? first.trim();
  return sentence.replace(/[.]$/, "").slice(0, 120);
}

/** The piece as plain text, for the multipart alternative and for Copy. */
export function textFor(body: string): string {
  return body.trim();
}

const ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
};

function escape(text: string): string {
  return text.replace(/[&<>"]/g, (ch) => ESCAPES[ch]);
}

function paragraphs(body: string): string[] {
  return body
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/**
 * The piece on the destination's paper.
 *
 * Inline styles and a table-free single column, because that is what survives
 * a mail client. The typefaces are the stacks from the destination's own
 * tokens with their webfont head removed — a mail client will not load
 * @font-face, and the fallbacks in those stacks are chosen (Didot, Georgia,
 * Helvetica) precisely so the second name is still the right shape.
 *
 * No logo, no header bar, no footer of links. This is a card.
 */
export function voicedHtml(destination: Destination, body: string): string {
  const { palette } = destination.look;
  const display = fallback(destination.look.type.display);
  const text = fallback(destination.look.type.body);

  const lines = paragraphs(body)
    .map(
      (line, index) =>
        `<p style="margin:0 0 ${index === 0 ? "18px" : "14px"};font-size:${
          index === 0 ? "21px" : "16px"
        };line-height:1.45;font-family:${index === 0 ? display : text};color:${
          index === 0 ? palette.ink : palette.inkSoft
        }">${escape(line)}</p>`
    )
    .join("\n    ");

  return `<!doctype html>
<html><body style="margin:0;padding:40px 24px;background:${palette.ground2};color:${palette.ink}">
  <div style="max-width:32rem;margin:0 auto;background:${palette.bone};border:1px solid ${palette.rule};padding:36px 28px">
    <p style="margin:0 0 22px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.26em;text-transform:uppercase;color:${palette.inkFaint}">${escape(destination.name)}</p>
    ${lines}
  </div>
</body></html>`;
}

/**
 * The piece, plainly. No destination parameter — see the note at the top.
 *
 * Black on white, one type stack, no ornament, and every line its own
 * paragraph so an address or a gate code is findable at a glance by somebody
 * reading it while walking to a door.
 */
export function plainHtml(body: string): string {
  const lines = paragraphs(body)
    .map(
      (line) =>
        `<p style="margin:0 0 12px;font-size:16px;line-height:1.5">${escape(line)}</p>`
    )
    .join("\n    ");

  return `<!doctype html>
<html><body style="margin:0;padding:32px 24px;background:#ffffff;color:#111111;font-family:Helvetica,Arial,sans-serif">
  <div style="max-width:32rem;margin:0 auto">
    ${lines}
  </div>
</body></html>`;
}

/**
 * The first stack entry is a webfont this repo ships. Mail clients will not
 * load it, so it is dropped and the real fallback leads.
 */
function fallback(stack: string): string {
  const parts = stack.split(",").map((s) => s.trim());
  return (parts.length > 1 ? parts.slice(1) : parts).join(", ");
}

export type Recipient = {
  guestId: string | null;
  name: string;
  email: string;
};

export type Delivery = {
  recipient: Recipient;
  providerId: string | null;
  error: string | null;
};

/**
 * Send one piece to a list.
 *
 * One request per recipient rather than one with many addresses, for two
 * reasons that are the same reason: a guest must never see the rest of the
 * list, and "did Nora get the change of address" has to be answerable. A
 * failure for one address is recorded against that address and does not stop
 * the others — a bad entry in a guest list is not a reason for nobody to be
 * invited.
 */
export async function deliver(
  destination: Destination | null,
  plain: boolean,
  body: string,
  recipients: readonly Recipient[],
  replyTo: string
): Promise<Delivery[]> {
  const subject = subjectFor(body);
  const html =
    plain || destination === null ? plainHtml(body) : voicedHtml(destination, body);
  const text = textFor(body);

  const out: Delivery[] = [];
  for (const recipient of recipients) {
    try {
      const { providerId } = await sendEmail({
        to: recipient.email,
        subject,
        html,
        text,
        replyTo,
      });
      out.push({ recipient, providerId, error: null });
    } catch (err) {
      out.push({
        recipient,
        providerId: null,
        error: err instanceof Error ? err.message : "it did not go",
      });
    }
  }
  return out;
}
