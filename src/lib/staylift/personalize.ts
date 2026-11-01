/**
 * Level-1 personalisation: transparent rules, no model. Every pick carries the
 * reason it was picked, in words the guest recognises ("Two of you, three
 * mornings"), so the email and the stay page can say *why*, and staff can see
 * the logic. Later levels (behavioural ranking, predicted conversion) replace
 * the scores, not the shape.
 *
 * Input offers must already be eligible for the stay (dates, room type,
 * inventory) — that check lives in queries.isEligible.
 */
import type { Offer, OfferCategory, Reservation } from "./types.ts";

export type Pick = {
  offerId: string;
  score: number;
  reason: string;
};

export type Personalization = {
  /** top picks, best first (max `limit`) */
  picks: Pick[];
  /** remaining eligible offers, best first */
  restIds: string[];
  /** one line for the page/email header */
  headline: string;
  /** the signals the rules saw — shown to staff, never to the guest */
  signals: string[];
};

type Ctx = {
  nights: number;
  guests: number;
  couple: boolean;
  weekend: boolean;
  leadDays: number;
  standardRoom: boolean;
  ota: boolean;
  notes: string;
  city: string;
};

const DAY = 86_400_000;

function utc(day: string) {
  return Date.parse(`${day.slice(0, 10)}T00:00:00Z`);
}

/** True when any night of the stay is a Friday or Saturday night. */
export function includesWeekendNight(arrival: string, nights: number) {
  for (let i = 0; i < nights; i += 1) {
    const dow = new Date(utc(arrival) + i * DAY).getUTCDay();
    if (dow === 5 || dow === 6) return true;
  }
  return false;
}

function has(notes: string, ...words: string[]) {
  return words.some((w) => notes.includes(w));
}

function plural(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven"];
const word = (n: number) => WORDS[n] ?? String(n);

type Rule = (ctx: Ctx, offer: Offer) => { score: number; reason: string };

const RULES: Record<OfferCategory, Rule> = {
  upgrade: (c, o) => {
    let score = 30;
    let reason = `More room for your ${plural(c.nights, "night")} — ${o.shortLabel}`;
    if (c.standardRoom && c.nights >= 2) score += 25;
    if (has(c.notes, "quiet")) {
      score += 25;
      reason = `You asked for quiet: the ${o.shortLabel} faces the courtyard`;
    }
    if (has(c.notes, "anniversary", "honeymoon", "birthday", "celebrat")) {
      score += 30;
      reason = `For the occasion — ${o.shortLabel}`;
    }
    return { score, reason };
  },
  breakfast: (c) => {
    let score = 25;
    if (c.couple) score += 25;
    if (c.nights >= 2) score += 10;
    const mornings = c.nights === 1 ? "on your morning" : `all ${word(c.nights)} mornings`;
    return {
      score,
      reason: c.couple ? `For ${word(c.guests)}, ${mornings}` : `${mornings[0].toUpperCase()}${mornings.slice(1)}`,
    };
  },
  spa: (c) => {
    let score = 15;
    let reason = "An hour off your feet, off the courtyard";
    if (c.weekend) {
      score += 25;
      reason = "Your stay includes a weekend night";
    }
    if (has(c.notes, "anniversary", "honeymoon", "birthday", "celebrat")) {
      score += 25;
      reason = "For the occasion — book a treatment for two";
    }
    return { score, reason };
  },
  transfer: (c) => {
    let score = 15;
    let reason = `Flying into ${c.city}? A driver meets you and waits 45 minutes`;
    if (c.ota && c.leadDays >= 2) score += 15;
    if (has(c.notes, "flight", "airport", "fly", "plane")) {
      score += 30;
      reason = "You mentioned your flight — your driver tracks it";
    }
    return { score, reason };
  },
  parking: (c) => {
    let score = 10;
    let reason = "Driving in? A covered spot is held for you";
    if (has(c.notes, "car", "drive", "driving", "parking", "road trip")) {
      score += 35;
      reason = "You're driving in — your covered spot is held";
    }
    return { score, reason };
  },
  late_checkout: (c) => {
    let score = 20;
    if (c.nights === 1) score += 15;
    return { score, reason: "Keep the room until 2 PM on your last day" };
  },
  early_checkin: (c) => {
    let score = 20;
    let reason = "Settle in from noon instead of three";
    if (has(c.notes, "early", "morning arrival", "red-eye", "red eye")) {
      score += 35;
      reason = "Arriving early? Your room is ready at noon";
    }
    return { score, reason };
  },
  fb: () => ({ score: 15, reason: "From the house kitchen" }),
};

export function personalize(
  reservation: Pick_<Reservation, "arrival" | "nights" | "guests" | "roomTypeId" | "source" | "notes">,
  offers: Offer[],
  opts: { today: string; city: string; limit?: number; standardRoomId?: string },
): Personalization {
  const ctx: Ctx = {
    nights: reservation.nights,
    guests: reservation.guests,
    couple: reservation.guests >= 2,
    weekend: includesWeekendNight(reservation.arrival, reservation.nights),
    leadDays: Math.round((utc(reservation.arrival) - utc(opts.today)) / DAY),
    standardRoom: reservation.roomTypeId === (opts.standardRoomId ?? "rt_standard"),
    ota: reservation.source !== "Direct",
    notes: (reservation.notes ?? "").toLowerCase(),
    city: opts.city,
  };

  const scored = offers
    .map((offer) => {
      const rule = RULES[offer.category] ?? RULES.fb;
      const { score, reason } = rule(ctx, offer);
      return { offerId: offer.id, score, reason, sort: offer.sortOrder };
    })
    // Highest score first; ties keep the hotel's own ordering.
    .sort((a, b) => b.score - a.score || a.sort - b.sort);

  const limit = opts.limit ?? 3;
  const picks = scored.slice(0, limit).map(({ offerId, score, reason }) => ({ offerId, score, reason }));
  const signals = [
    `${plural(ctx.guests, "guest")}`,
    `${plural(ctx.nights, "night")}`,
    ctx.weekend ? "weekend night" : "weekdays only",
    ctx.leadDays >= 0 ? `arrives in ${plural(ctx.leadDays, "day")}` : "in house",
    ctx.standardRoom ? "standard room" : "upgraded room type",
    ctx.ota ? `booked via ${reservation.source}` : "booked direct",
  ];
  if (ctx.notes) signals.push(`notes: “${reservation.notes}”`);

  const who = ctx.couple ? `the ${word(ctx.guests)} of you` : "you";
  return {
    picks,
    restIds: scored.slice(limit).map((s) => s.offerId),
    headline: `Picked for ${who}: ${plural(ctx.nights, "night")} in ${opts.city}`,
    signals,
  };
}

// Local alias so the exported signature reads cleanly without clashing with the Pick type above.
type Pick_<T, K extends keyof T> = { [P in K]: T[P] };
