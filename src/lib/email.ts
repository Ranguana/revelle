import "server-only";

/**
 * Outbound email via Resend.
 *
 * Deliberately a thin fetch wrapper rather than the SDK: the surface used here
 * is one POST, and the send path is the piece most worth being able to read end
 * to end when something does not arrive.
 *
 * Nothing here reads a file or talks to a local mail agent. Like every other
 * moving part in this repo, it must work identically inside Render with no
 * developer machine involved.
 */

const ENDPOINT = "https://api.resend.com/emails";

export class EmailNotConfiguredError extends Error {
  constructor(missing: string) {
    super(`${missing} is not set — email cannot be sent`);
    this.name = "EmailNotConfiguredError";
  }
}

export class EmailSendError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "EmailSendError";
  }
}

function apiKey(): string {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new EmailNotConfiguredError("RESEND_API_KEY");
  return key;
}

/**
 * The From address. Must be on a domain verified in Resend, or every send is
 * rejected. Kept in config rather than hardcoded because the right sending
 * domain is a product decision, not a code one.
 */
function fromAddress(): string {
  const from = process.env.MAIL_FROM;
  if (!from) throw new EmailNotConfiguredError("MAIL_FROM");
  return from;
}

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
};

export type SendEmailResult = {
  /** Resend's id. Worth recording — delivery webhooks reference it. */
  providerId: string;
};

export async function sendEmail(
  input: SendEmailInput
): Promise<SendEmailResult> {
  const body: Record<string, unknown> = {
    from: fromAddress(),
    to: input.to,
    subject: input.subject,
    html: input.html,
  };
  if (input.text) body.text = input.text;
  if (input.replyTo) body.reply_to = input.replyTo;

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey()}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    // Read the provider's message — "domain is not verified" and "invalid
    // recipient" are very different problems and both arrive as a 4xx.
    let detail = `HTTP ${res.status}`;
    try {
      const err = (await res.json()) as { message?: string };
      if (err.message) detail = err.message;
    } catch {
      // Non-JSON error body; the status is what we have.
    }
    throw new EmailSendError(detail, res.status);
  }

  const json = (await res.json()) as { id?: string };
  if (!json.id) {
    // A 200 with no id means the shape changed. Fail loudly rather than record
    // a send that can never be reconciled against a webhook.
    throw new EmailSendError("Resend returned no message id", res.status);
  }
  return { providerId: json.id };
}

/**
 * The one email a quiz submission sends.
 *
 * Plain and short on purpose: image-heavy, link-heavy mail is likelier to be
 * filtered, and this is the first thing a new customer receives from us. It
 * promises nothing about timing, and it says nothing about who or what reads
 * an application. The house does not introduce its staff (docs/copy-brief.md),
 * and the opposite claim would be worse — so the question goes unanswered.
 */
export async function sendQuizConfirmation(to: string): Promise<SendEmailResult> {
  const html = `<!doctype html>
<html><body style="margin:0;padding:32px 24px;background:#EFE3D2;color:#2A2018;font-family:Georgia,'Times New Roman',serif;line-height:1.6">
  <div style="max-width:34rem;margin:0 auto">
    <p style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#8E8173;margin:0 0 28px">Revelle Soci&eacute;t&eacute;</p>
    <p style="font-size:26px;line-height:1.2;margin:0 0 24px">We have your answers.</p>
    <p style="margin:0 0 18px;color:#5E5245">Nothing else is needed from you. Your destination will follow.</p>
    <p style="margin:0 0 18px;color:#5E5245">If you think of the thing you forgot to tell us, reply to this email.</p>
    <p style="margin:32px 0 0;font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#8E8173">Est. for people who host</p>
  </div>
</body></html>`;

  const text = [
    "REVELLE SOCIÉTÉ",
    "",
    "We have your answers.",
    "",
    "Nothing else is needed from you. Your destination will follow.",
    "",
    "If you think of the thing you forgot to tell us, reply to this email.",
    "",
    "Est. for people who host",
  ].join("\n");

  return sendEmail({
    to,
    subject: "We have your answers",
    html,
    text,
    replyTo: process.env.MAIL_REPLY_TO || undefined,
  });
}
