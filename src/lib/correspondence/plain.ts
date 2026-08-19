/**
 * WHEN IT GOES OUT PLAIN.
 *
 * The one function in this module, and the important thing about it is its
 * signature: it takes a PlainRequest and NOTHING ELSE. There is no destination
 * parameter, no voice parameter, no model. It could not write in a house's
 * register if every line of it were rewritten to try.
 *
 * That is the whole design. `breaksCharacterFor` says a change of address, a
 * medical note and a cancellation go out plain; the way to guarantee that is
 * not to instruct a writer to behave, it is to have no writer here.
 *
 * ── WHY THERE IS NO MODEL CALL AT ALL ────────────────────────────────
 *
 * A plain message has nothing to add. "The address has changed. It is 14 Dune
 * Road, not 12. The gate code is 4412." is finished the moment she types the
 * facts, and anything a writer did to it — smoothing, ordering, a softer
 * opening — would be exactly the thing this route exists to prevent. So the
 * piece IS her facts, laid out one to a line, and the only work done to them
 * is ending each on a full stop so the page does not read as a form.
 *
 * It also means the plain route works with no API key, which is the correct
 * behaviour and not a happy accident: the message a guest must act on is the
 * last message that should depend on a third party being reachable.
 *
 * Framework-free and pure. Same input, same output, forever.
 */

import type { PlainRequest } from "./types.ts";

/**
 * Her message, plainly.
 *
 * The ask leads, because it is the thing being said. The facts follow, one to
 * a line, because a line break is how a reader finds an address at a glance
 * and a comma is how she loses it.
 */
export function composePlain(request: PlainRequest): string {
  const lines: string[] = [];

  const ask = request.ask.trim();
  if (ask.length > 0) lines.push(...sentences(ask));

  for (const fact of request.facts) {
    const line = fact.trim();
    if (line.length > 0) lines.push(stop(line));
  }

  return lines.join("\n");
}

/**
 * Her sentence, or her paragraph, as lines.
 *
 * She may type one sentence or four. Split on the sentence break rather than
 * on the newline so a paragraph she pasted in still lands as lines — this is
 * the piece a guest reads on a phone while walking to a door, and a wall of
 * text is the failure mode it exists to avoid.
 */
function sentences(text: string): string[] {
  return text
    .split(/(?<=[.?!])\s+|\n+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .map(stop);
}

/**
 * A full stop, unless it already ends on one.
 *
 * A question mark and an exclamation point both count as ended — the first
 * because a plain message may genuinely ask something, the second because
 * although the house never writes one (docs/copy-brief.md), these are HER
 * words and this function does not correct her.
 */
function stop(line: string): string {
  return /[.?!:]$/.test(line) ? line : `${line}.`;
}

/**
 * The subject line for a plain piece sent by mail.
 *
 * Her first sentence, and nothing invented. No "Important", no "Please read",
 * no prefix naming the occasion — a subject line that shouts is the same
 * mistake as a joke, made in a different direction.
 */
export function plainSubject(request: PlainRequest): string {
  const first = composePlain(request).split("\n")[0] ?? "";
  return first.replace(/\.$/, "");
}
