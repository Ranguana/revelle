/**
 * THE FRAME EVERY MESSAGE FROM THE HOUSE SHARES.
 *
 * ── WHY THIS IS ITS OWN FILE ─────────────────────────────────────────
 *
 * Rule 21. The house's mail has ONE look, and until now three files each held
 * their own copy of it: src/lib/login.ts (the desk link, the member link, the
 * applicant note), src/lib/email.ts (the confirmation after a submission), and
 * whatever came next — which is the confirmation note in
 * src/lib/application.ts. Three copies of five hex values and a table-free
 * one-column layout is not duplicated code, it is DUPLICATED AUTHORITY: the
 * day somebody adjusts the ground colour, two of the three change and nothing
 * anywhere goes red, because a message that renders is a message that works.
 *
 * The test rule 21 asks is narrow and this passes it: must two surfaces agree
 * about this? Yes — a member who gets a sign-in link and then a confirmation
 * must not receive two differently coloured letters from the same house.
 *
 * ── WHY IT IS PLAIN ──────────────────────────────────────────────────
 *
 * No images, no web fonts, no external stylesheet, one column, inline styles.
 * Image-heavy and link-heavy mail is likelier to be filtered, and this is mail
 * somebody is waiting on. The tokens are inlined as literals rather than read
 * from src/lib/tokens.ts because a mail client resolves no custom properties;
 * they are the house's light values, written out.
 *
 * Framework-free — no "server-only", no next/*, siblings imported with an
 * explicit .ts extension — so `node --test` can assert what a message says
 * without a network or an API key.
 */

/** What a composed message looks like on its way to the mailer. */
export type Mail = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

/**
 * How a message leaves. Injected rather than imported so the modules that
 * COMPOSE mail stay framework-free (src/lib/email.ts is "server-only") and so
 * a test can watch what would have been sent without a real inbox.
 */
export type Deliver = (mail: Mail) => Promise<void>;

export const GROUND = "#EFE3D2";
export const INK = "#2A2018";
export const INK_SOFT = "#5E5245";
export const INK_FAINT = "#8E8173";
export const OXBLOOD = "#B4522C";

/** The house's sign-off. Approved copy — docs/copy-brief.md. */
export const FOOTER = "Est. for people who host";

export function shell(body: string, footer: string): string {
  return `<!doctype html>
<html><body style="margin:0;padding:32px 24px;background:${GROUND};color:${INK};font-family:Georgia,'Times New Roman',serif;line-height:1.6">
  <div style="max-width:34rem;margin:0 auto">
${body}
    <p style="margin:32px 0 0;font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${INK_FAINT}">${footer}</p>
  </div>
</body></html>`;
}

export function eyebrow(text: string): string {
  return `    <p style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:${INK_FAINT};margin:0 0 28px">${text}</p>`;
}

export function heading(text: string): string {
  return `    <p style="font-size:26px;line-height:1.2;margin:0 0 24px">${text}</p>`;
}

export function line(text: string): string {
  return `    <p style="margin:0 0 18px;color:${INK_SOFT}">${text}</p>`;
}

export function button(href: string, label: string): string {
  return `    <p style="margin:0 0 22px"><a href="${href}" style="color:${OXBLOOD}">${label}</a></p>`;
}

/** The small print at the foot of the body, above the sign-off. */
export function aside(text: string): string {
  return `    <p style="margin:0;color:${INK_FAINT};font-size:13px">${text}</p>`;
}

/**
 * The sentence every unasked-for message ends on.
 *
 * Shared because it is a promise rather than a decoration: a person who did
 * not ask for a link, or for a confirmation note, has to be told that ignoring
 * it costs her nothing. Two versions of that sentence would be two promises.
 */
export const NOTHING_HAPPENED =
  "If you did not ask for this, nothing has happened.";
