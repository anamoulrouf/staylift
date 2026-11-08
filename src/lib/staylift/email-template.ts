/**
 * The new-booking email: confirmation + online check-in + offers picked for
 * this stay. Pure function → { subject, preheader, html, text }.
 *
 * Email-client rules: table layout, inline styles, 600px max, web-safe fonts,
 * "bulletproof" buttons (a link inside a coloured cell), no scripts, no
 * external CSS, alt-free (no images) so it renders the same with images off.
 *
 * Three modes, chosen per recipient by emailModeFor():
 *   full    — a real guest email: offer cards with price and one-tap "Add".
 *   light   — an OTA relay address (e.g. @guest.booking.com): only content
 *             about THIS reservation — picks named with their reason, no
 *             prices, one link to the stay page. Keeps the email a stay
 *             service message under OTA terms, not a promotion.
 *   service — holdout bookings: confirmation and check-in only, no offers,
 *             so the control group stays clean.
 */
import { formatDate, money, priceHint } from "./format.ts";
import type { EmailKind, Offer, Property, Reservation } from "./types.ts";

export type EmailMode = "full" | "light" | "service";

export function emailModeFor(r: { holdout: boolean; emailKind: EmailKind }): EmailMode | null {
  if (r.emailKind === "none") return null;
  if (r.holdout) return "service";
  return r.emailKind === "masked" ? "light" : "full";
}

export const EMAIL_MODE_LABEL: Record<EmailMode, string> = {
  full: "Full offers",
  light: "Light (OTA relay)",
  service: "Service only (holdout)",
};

export type EmailInput = {
  property: Pick<Property, "name" | "city">;
  reservation: Pick<
    Reservation,
    "guestName" | "arrival" | "departure" | "nights" | "guests" | "roomTypeName" | "bookingRef" | "source"
  >;
  picks: { offer: Offer; reason: string }[];
  headline: string;
  /** absolute URL of the guest's stay page, e.g. https://host/stay/maya */
  stayUrl: string;
  mode: EmailMode;
};

export type RenderedEmail = { subject: string; preheader: string; html: string; text: string };

const C = {
  ground: "#f3eee6",
  paper: "#fffdf8",
  ink: "#1c1814",
  stone: "#6f675e",
  line: "#e4dcd0",
  pine: "#234139",
  pineFg: "#f6f1ea",
  moss: "#e7efe8",
};
/* Display + body now share the landing's face (Inter). Web-font support in
 * email clients is unreliable (Gmail strips <link>), so every stack keeps
 * Arial/Helvetica fallbacks — the Google Fonts link in the head only
 * upgrades clients that allow it (this preview always does). */
const SERIF = "'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";
const SANS = "'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";
const FONT_LINK =
  '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">';

export function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function link(base: string, params: Record<string, string>, hash = "") {
  const q = new URLSearchParams(params).toString();
  return `${base}${base.includes("?") ? "&" : "?"}${q}${hash}`;
}

function button(href: string, label: string, kind: "primary" | "secondary" = "primary") {
  const bg = kind === "primary" ? C.pine : C.paper;
  const fg = kind === "primary" ? C.pineFg : C.ink;
  const border = kind === "primary" ? C.pine : C.line;
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="${bg}" style="border-radius:10px;border:1px solid ${border};">
<a href="${esc(href)}" style="display:inline-block;padding:12px 20px;font-family:${SANS};font-size:15px;font-weight:600;color:${fg};text-decoration:none;border-radius:10px;">${esc(label)}</a>
</td></tr></table>`;
}

function nightsLabel(n: number) {
  return `${n} night${n === 1 ? "" : "s"}`;
}

export function renderBookingEmail(input: EmailInput): RenderedEmail {
  const { property, reservation: r, picks, mode } = input;
  const first = r.guestName.split(" ")[0] ?? r.guestName;
  const range = `${formatDate(r.arrival)}–${formatDate(r.departure)}`;
  const subject = `${first}, your ${property.city} stay is confirmed (${range})`;
  const showOffers = mode !== "service" && picks.length > 0;
  const preheader = showOffers
    ? `Check in online, plus ${picks.length} things picked for your ${nightsLabel(r.nights)}.`
    : `Check in online before you arrive at ${property.name}.`;

  const checkinUrl = link(input.stayUrl, { src: "email" }, "#checkin");
  const pageUrl = link(input.stayUrl, { src: "email" });

  const facts: [string, string][] = [
    ["Dates", `${range} · ${nightsLabel(r.nights)}`],
    ["Room", `${r.roomTypeName} · ${r.guests} guest${r.guests === 1 ? "" : "s"}`],
    ["Booking", `${r.bookingRef}${r.source !== "Direct" ? ` via ${r.source}` : ""}`],
  ];

  const factRows = facts
    .map(
      ([k, v]) => `<tr>
<td style="padding:6px 0;font-family:${SANS};font-size:13px;color:${C.stone};width:90px;vertical-align:top;">${esc(k)}</td>
<td style="padding:6px 0;font-family:${SANS};font-size:14px;color:${C.ink};">${esc(v)}</td></tr>`,
    )
    .join("");

  let offersHtml = "";
  if (showOffers && mode === "full") {
    offersHtml = picks
      .map(
        ({ offer, reason }) => `<tr><td style="padding:0 0 12px 0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.paper};border:1px solid ${C.line};border-radius:14px;">
<tr><td style="padding:18px 20px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td style="font-family:${SERIF};font-size:19px;font-weight:600;color:${C.ink};">${esc(offer.name)}</td>
<td align="right" style="font-family:${SANS};font-size:15px;color:${C.ink};white-space:nowrap;">${esc(money(offer.priceCents))}<span style="color:${C.stone};font-size:13px;">${esc(priceHint(offer.priceUnit))}</span></td>
</tr></table>
<p style="margin:6px 0 14px 0;font-family:${SANS};font-size:14px;line-height:20px;color:${C.stone};">${esc(reason)}</p>
${button(link(input.stayUrl, { src: "email", offer: offer.id }), offer.autoApprove ? "Add to my stay" : "Request it", "secondary")}
</td></tr></table></td></tr>`,
      )
      .join("");
  } else if (showOffers && mode === "light") {
    offersHtml = `<tr><td style="padding:0 0 16px 0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.paper};border:1px solid ${C.line};border-radius:14px;">
<tr><td style="padding:18px 20px;">
${picks
  .map(
    ({ offer, reason }) => `<p style="margin:0 0 12px 0;font-family:${SANS};font-size:15px;line-height:21px;color:${C.ink};"><strong style="font-weight:600;">${esc(offer.name)}</strong><br><span style="color:${C.stone};font-size:14px;">${esc(reason)}</span></p>`,
  )
  .join("")}
${button(pageUrl, "See the options for your stay", "secondary")}
</td></tr></table></td></tr>`;
  }

  const offersSection = showOffers
    ? `<tr><td style="padding:28px 0 6px 0;">
<p style="margin:0;font-family:${SANS};font-size:12px;letter-spacing:1.6px;text-transform:uppercase;color:${C.stone};">Picked for your stay</p>
<p style="margin:6px 0 16px 0;font-family:${SERIF};font-size:22px;font-weight:600;line-height:28px;color:${C.ink};">${esc(input.headline)}</p>
</td></tr>${offersHtml}
<tr><td style="padding:2px 0 0 0;font-family:${SANS};font-size:13px;line-height:19px;color:${C.stone};">Nothing is charged until you choose it. Requests the house confirms are only charged once confirmed.</td></tr>`
    : "";

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="x-apple-disable-message-reformatting">
${FONT_LINK}<title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:${C.ground};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.ground}"><tr><td align="center" style="padding:28px 14px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
<tr><td style="padding:0 0 22px 0;">
<p style="margin:0;font-family:${SERIF};font-size:26px;font-weight:600;color:${C.ink};">${esc(property.name)}</p>
<p style="margin:2px 0 0 0;font-family:${SANS};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${C.stone};">${esc(property.city)}</p>
</td></tr>
<tr><td style="background:${C.paper};border:1px solid ${C.line};border-radius:16px;padding:26px 24px;">
<p style="margin:0 0 6px 0;font-family:${SANS};font-size:15px;color:${C.stone};">Hi ${esc(first)},</p>
<p style="margin:0 0 18px 0;font-family:${SERIF};font-size:26px;font-weight:600;line-height:32px;color:${C.ink};">Your stay is confirmed.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${C.line};border-bottom:1px solid ${C.line};margin:0 0 20px 0;">${factRows}</table>
<p style="margin:0 0 14px 0;font-family:${SANS};font-size:15px;line-height:22px;color:${C.ink};">Check in online now and your key is ready when you arrive. It takes a minute${r.source !== "Direct" ? `, and lets us reach you directly instead of through ${esc(r.source)}` : ""}.</p>
${button(checkinUrl, "Check in online")}
</td></tr>
${offersSection}
<tr><td style="padding:28px 4px 0 4px;font-family:${SANS};font-size:12px;line-height:18px;color:${C.stone};">
This email is about your reservation ${esc(r.bookingRef)} at ${esc(property.name)} only — no newsletters. Reply to reach the front desk.
</td></tr>
</table></td></tr></table>
</body></html>`;

  const textLines = [
    `Hi ${first},`,
    "",
    "Your stay is confirmed.",
    ...facts.map(([k, v]) => `${k}: ${v}`),
    "",
    `Check in online: ${checkinUrl}`,
  ];
  if (showOffers) {
    textLines.push("", input.headline.toUpperCase());
    for (const { offer, reason } of picks) {
      textLines.push(
        mode === "full"
          ? `- ${offer.name} (${money(offer.priceCents)}${priceHint(offer.priceUnit)}): ${reason}\n  ${link(input.stayUrl, { src: "email", offer: offer.id })}`
          : `- ${offer.name}: ${reason}`,
      );
    }
    if (mode === "light") textLines.push(`See the options for your stay: ${pageUrl}`);
    textLines.push("", "Nothing is charged until you choose it.");
  }
  textLines.push("", `— ${property.name}, ${property.city}. About reservation ${r.bookingRef} only.`);

  return { subject, preheader, html, text: textLines.join("\n") };
}
