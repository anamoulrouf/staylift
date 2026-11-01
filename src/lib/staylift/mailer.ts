/**
 * Email delivery (server-only).
 *
 *   POSTMARK_SERVER_TOKEN set  -> sends through Postmark's API.
 *                                 Streams: "outbound" (transactional: codes, invites,
 *                                 booking emails) and "broadcast" (occasion marketing,
 *                                 phase D) so marketing complaints never touch the
 *                                 delivery of booking mail.
 *   not set, local development -> nothing leaves the machine; the message is
 *                                 returned as a dev preview so the screen can show
 *                                 the code or link.
 *   not set, real database     -> refuses: a production hotel must not believe an
 *                                 email went out when it did not.
 *
 * From address: the hotel's sender_email (e.g. stay@mail.themarlowe.com, set up
 * with SPF/DKIM/DMARC on that subdomain), else STAYLIFT_FROM_EMAIL.
 */

export type MailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  from?: string | null;
  fromName?: string;
  stream?: "outbound" | "broadcast";
  tag?: string;
};

export type MailResult =
  | { delivered: true; provider: "postmark"; messageId: string }
  | { delivered: false; provider: "dev-outbox"; preview: { to: string; subject: string; text: string } };

function env(name: string): string | undefined {
  const v = typeof process !== "undefined" ? process.env[name] : undefined;
  return v && v.trim() ? v.trim() : undefined;
}

export type MailStatus = { mode: "postmark" | "dev-outbox" | "missing"; from: string | null };

export function mailStatus(senderEmail?: string | null): MailStatus {
  const from = senderEmail || env("STAYLIFT_FROM_EMAIL") || null;
  if (env("POSTMARK_SERVER_TOKEN")) return { mode: "postmark", from };
  return { mode: env("DATABASE_URL") ? "missing" : "dev-outbox", from };
}

export async function sendMail(input: MailInput): Promise<MailResult> {
  const token = env("POSTMARK_SERVER_TOKEN");
  if (!token) {
    if (env("DATABASE_URL")) {
      throw new Error("Email is not set up yet: add POSTMARK_SERVER_TOKEN and a sender address in Settings.");
    }
    return { delivered: false, provider: "dev-outbox", preview: { to: input.to, subject: input.subject, text: input.text } };
  }
  const fromAddress = input.from || env("STAYLIFT_FROM_EMAIL");
  if (!fromAddress) throw new Error("No sender address: set one in Settings or STAYLIFT_FROM_EMAIL.");
  const from = input.fromName ? `${input.fromName.replace(/[<>"]/g, "")} <${fromAddress}>` : fromAddress;
  const res = await fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Postmark-Server-Token": token,
    },
    body: JSON.stringify({
      From: from,
      To: input.to,
      Subject: input.subject,
      HtmlBody: input.html,
      TextBody: input.text,
      MessageStream: input.stream ?? "outbound",
      Tag: input.tag,
    }),
  });
  const body = (await res.json().catch(() => ({}))) as { MessageID?: string; Message?: string; ErrorCode?: number };
  if (!res.ok || (body.ErrorCode && body.ErrorCode !== 0)) {
    throw new Error(`Email was not sent: ${body.Message ?? res.statusText}`);
  }
  return { delivered: true, provider: "postmark", messageId: body.MessageID ?? "" };
}

/** Minimal branded wrapper for short service emails (codes, invites). */
export function simpleEmail(opts: { hotel: string; heading: string; lines: string[]; cta?: { label: string; url: string } }) {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const html = `<!doctype html><html><body style="margin:0;background:#f3eee6;font-family:Helvetica,Arial,sans-serif;color:#1f1d1a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" style="max-width:480px;background:#fffdf9;border-radius:12px;padding:28px" cellpadding="0" cellspacing="0">
<tr><td style="font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#7a7368">${esc(opts.hotel)}</td></tr>
<tr><td style="padding-top:12px;font-size:22px;font-weight:600">${esc(opts.heading)}</td></tr>
${opts.lines.map((l) => `<tr><td style="padding-top:12px;font-size:15px;line-height:1.5">${esc(l)}</td></tr>`).join("")}
${opts.cta ? `<tr><td style="padding-top:20px"><a href="${esc(opts.cta.url)}" style="display:inline-block;background:#17503f;color:#f3eee6;text-decoration:none;padding:12px 18px;border-radius:8px;font-size:15px">${esc(opts.cta.label)}</a></td></tr>` : ""}
</table></td></tr></table></body></html>`;
  const text = [opts.hotel, "", opts.heading, "", ...opts.lines, ...(opts.cta ? ["", `${opts.cta.label}: ${opts.cta.url}`] : [])].join("\n");
  return { html, text };
}
