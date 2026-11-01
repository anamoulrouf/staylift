import type { PriceUnit, StayStatus } from "./types";

export function money(cents: number, opts?: { compact?: boolean }) {
  const value = cents / 100;
  if (opts?.compact && Math.abs(value) >= 1000) {
    return `$${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

export function formatDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  const date = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatDateLong(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  const date = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function stayRange(arrival: string, departure: string) {
  return `${formatDate(arrival)} → ${formatDate(departure)}`;
}

export function priceHint(unit: PriceUnit) {
  switch (unit) {
    case "night":
      return "/night";
    case "person":
      return "/guest";
    case "person_night":
      return "/guest / morning";
    default:
      return "";
  }
}

export function statusLabel(status: StayStatus) {
  switch (status) {
    case "in_house":
      return "In house";
    case "departing":
      return "Departing";
    case "departed":
      return "Departed";
    default:
      return "Upcoming";
  }
}

export function pct(n: number) {
  return `${(n * 100).toFixed(n * 100 >= 10 ? 0 : 1)}%`;
}

export function nightsBetween(arrival: string, departure: string) {
  const a = Date.parse(`${arrival.slice(0, 10)}T00:00:00Z`);
  const b = Date.parse(`${departure.slice(0, 10)}T00:00:00Z`);
  return Math.max(1, Math.round((b - a) / 86_400_000));
}

export const SAMPLE_CONFIRMATION = `Booking.com reservation confirmation

Reservation number: 38194421
Hotel: The Marlowe, Austin
Guest name: Sam Ortega
Check-in: 18 October 2026
Check-out: 20 October 2026
Room: Standard Queen
Number of guests: 2
Guest email: 38194421-ortega@guest.booking.com
Telephone: +1 512 555 0144

Thank you for your reservation.
`;

/** Whole or fractional US dollars (not cents). `sign` prefixes + on gains. */
export function usd(
  dollars: number,
  opts?: { sign?: boolean; compact?: boolean; cents?: boolean },
) {
  const abs = Math.abs(dollars);
  let body: string;
  if (opts?.compact && abs >= 1_000_000) body = `$${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
  else if (opts?.compact && abs >= 10_000) body = `$${(abs / 1000).toFixed(abs >= 100_000 ? 0 : 1)}k`;
  else
    body = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: opts?.cents ? 2 : 0,
      maximumFractionDigits: opts?.cents ? 2 : 0,
    }).format(abs);
  if (dollars < 0 && Math.round(abs * (opts?.cents ? 100 : 1)) !== 0) return `−${body}`;
  if (opts?.sign && Math.round(abs * (opts?.cents ? 100 : 1)) !== 0) return `+${body}`;
  return body;
}

/** A fraction (0.05) as a percentage string ("5.0%"). */
export function pctOf(fraction: number, digits = 1) {
  if (!Number.isFinite(fraction)) return "—";
  return `${(fraction * 100).toFixed(digits)}%`;
}

export function count(n: number) {
  return Math.round(n).toLocaleString("en-US");
}
