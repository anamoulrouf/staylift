/**
 * Contact normalisation, validation and masking (pure; client and server).
 * Normalised values feed the blind index, so the rules here decide what counts
 * as "the same contact" when matching guest profiles.
 */
import { marketFor } from "./markets.ts";

const RELAY_DOMAINS = [
  "guest.booking.com",
  "m.expediapartnercentral.com",
  "agoda-messaging.com",
  "guest.airbnb.com",
  "trip.com",
];

export function normalizeEmail(raw: string): string | null {
  const v = raw.trim().toLowerCase();
  // Pragmatic check: one @, a dot in the domain, no spaces, sane length.
  if (v.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return null;
  return v;
}

/** OTA relay inboxes forward to the guest but are not the guest's own address. */
export function isRelayEmail(email: string): boolean {
  const domain = email.split("@")[1] ?? "";
  return RELAY_DOMAINS.some((d) => domain === d || domain.endsWith(`.${d}`));
}

/**
 * E.164-style: "+<country><number>", 8–15 digits. Numbers without a country
 * code take the hotel market's code; EU hotels must have one typed, since the
 * EU has no single code.
 */
export function normalizePhone(raw: string, marketId?: string | null): string | null {
  let v = raw.trim().replace(/[\s().-]/g, "");
  if (v.startsWith("00")) v = `+${v.slice(2)}`;
  if (!v.startsWith("+")) {
    const dial = marketFor(marketId).dialCode;
    if (!dial) return null;
    v = `+${dial}${v.replace(/^0+/, "")}`;
  }
  const digits = v.slice(1);
  if (!/^\d{8,15}$/.test(digits)) return null;
  // Placeholder numbers OTAs send (all one digit, or 1234567…) are not contacts.
  if (/^(\d)\1+$/.test(digits.slice(-8)) || /123456789|987654321/.test(digits)) return null;
  return `+${digits}`;
}

export function maskEmail(email: string): string {
  const [user = "", domain = ""] = email.split("@");
  const head = user.slice(0, 1);
  return `${head}${"•".repeat(Math.max(2, Math.min(5, user.length - 1)))}@${domain}`;
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return `+•• •••• ••${digits.slice(-2)}`;
}

export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

/** "Maya Kapoor" -> "M. K." — what a purged reservation keeps for the books. */
export function initials(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => `${p[0]?.toUpperCase() ?? ""}.`)
    .join(" ");
}
