/**
 * Launch-market presets. A hotel picks its market once (Settings); the market
 * decides phone normalisation, which privacy wording the guest sees, how long
 * OTA-sourced contact data may be kept, and which holidays are offered first.
 *
 * Legal notes here are product defaults, not legal advice — each launch market
 * still needs a lawyer's sign-off (see plan v3, phase B).
 */

export type MarketId = "US" | "UK" | "EU" | "AE";

export type HolidayId =
  | "christmas"
  | "new_year"
  | "lunar_new_year"
  | "eid_al_fitr"
  | "eid_al_adha"
  | "diwali"
  | "hanukkah"
  | "easter"
  | "thanksgiving"
  | "uae_national_day";

export const HOLIDAYS: Record<HolidayId, { label: string; when: string }> = {
  christmas: { label: "Christmas", when: "December" },
  new_year: { label: "New Year", when: "Dec–Jan" },
  lunar_new_year: { label: "Lunar New Year", when: "Jan–Feb" },
  eid_al_fitr: { label: "Eid al-Fitr", when: "moves yearly" },
  eid_al_adha: { label: "Eid al-Adha", when: "moves yearly" },
  diwali: { label: "Diwali", when: "Oct–Nov" },
  hanukkah: { label: "Hanukkah", when: "Nov–Dec" },
  easter: { label: "Easter", when: "Mar–Apr" },
  thanksgiving: { label: "Thanksgiving", when: "November" },
  uae_national_day: { label: "UAE National Day", when: "2 December" },
};

export function isHolidayId(value: string): value is HolidayId {
  return Object.hasOwn(HOLIDAYS, value);
}

export type Market = {
  id: MarketId;
  label: string;
  /** Default country calling code for numbers typed without one. */
  dialCode: string;
  defaultTimezone: string;
  currency: string;
  /** Which rules apply, in one line for staff. */
  law: string;
  /** Religion-linked holidays are special-category data and need explicit consent. */
  explicitSpecialCategory: boolean;
  /** Holidays listed first in the guest picker (all remain selectable). */
  holidays: HolidayId[];
  /** Phone marketing needs carrier registration before the first send. */
  phoneMarketingNote: string;
};

export const MARKETS: Record<MarketId, Market> = {
  US: {
    id: "US",
    label: "United States",
    dialCode: "1",
    defaultTimezone: "America/Chicago",
    currency: "USD",
    law: "CAN-SPAM for email (honour opt-outs, show a postal address); TCPA for texts; WhatsApp needs opt-in.",
    explicitSpecialCategory: false,
    holidays: ["thanksgiving", "christmas", "new_year", "hanukkah", "easter", "lunar_new_year", "diwali", "eid_al_fitr", "eid_al_adha"],
    phoneMarketingNote: "US texts need 10DLC brand and campaign registration before the first marketing send.",
  },
  UK: {
    id: "UK",
    label: "United Kingdom",
    dialCode: "44",
    defaultTimezone: "Europe/London",
    currency: "GBP",
    law: "UK GDPR + PECR: marketing email and messages need consent; religious data needs explicit consent.",
    explicitSpecialCategory: true,
    holidays: ["christmas", "new_year", "easter", "diwali", "eid_al_fitr", "eid_al_adha", "hanukkah", "lunar_new_year"],
    phoneMarketingNote: "Marketing messages need prior consent under PECR.",
  },
  EU: {
    id: "EU",
    label: "European Union",
    dialCode: "",
    defaultTimezone: "Europe/Berlin",
    currency: "EUR",
    law: "GDPR + ePrivacy: marketing needs consent; religious data is special category (Art. 9) and needs explicit consent.",
    explicitSpecialCategory: true,
    holidays: ["christmas", "new_year", "easter", "eid_al_fitr", "eid_al_adha", "hanukkah", "diwali", "lunar_new_year"],
    phoneMarketingNote: "Marketing messages need prior consent. Numbers must include the country code.",
  },
  AE: {
    id: "AE",
    label: "United Arab Emirates",
    dialCode: "971",
    defaultTimezone: "Asia/Dubai",
    currency: "AED",
    law: "UAE PDPL: consent for marketing and for sensitive data; honour withdrawal promptly.",
    explicitSpecialCategory: true,
    holidays: ["eid_al_fitr", "eid_al_adha", "uae_national_day", "new_year", "diwali", "christmas", "lunar_new_year"],
    phoneMarketingNote: "Promotional messages need opt-in and must respect local sending hours.",
  },
};

export function marketFor(id: string | null | undefined): Market {
  return MARKETS[(id ?? "US") as MarketId] ?? MARKETS.US;
}

export function isMarketId(value: string): value is MarketId {
  return Object.hasOwn(MARKETS, value);
}

/**
 * How long contact data that came from a booking channel may be kept after
 * departure. Booking.com's terms are verified (30 days after the stay). Others
 * are unverified, so they get the same conservative clock until a lawyer
 * confirms otherwise.
 */
export const OTA_RETENTION: Record<string, { days: number; verified: boolean }> = {
  "Booking.com": { days: 30, verified: true },
  Expedia: { days: 30, verified: false },
  Agoda: { days: 30, verified: false },
  "Trip.com": { days: 30, verified: false },
  Airbnb: { days: 30, verified: false },
};

export function otaRetention(source: string) {
  if (source === "Direct") return null;
  return OTA_RETENTION[source] ?? { days: 30, verified: false };
}

/* --------------------------------------------------------------- consent */

export type ConsentPurpose = "marketing_email" | "marketing_whatsapp" | "profile_memory";

export const CONSENT_PURPOSES: ConsentPurpose[] = ["marketing_email", "marketing_whatsapp", "profile_memory"];

/** Bump when wording changes; the ledger stores the version and the exact text shown. */
export const CONSENT_VERSION = "2026-10-v1";

/** The exact sentence a guest sees for each purpose. Stored with every consent event. */
export function consentWording(purpose: ConsentPurpose, hotel: string, market: Market): string {
  switch (purpose) {
    case "marketing_email":
      return `Email me offers and occasion reminders from ${hotel}. Unsubscribe any time.`;
    case "marketing_whatsapp":
      return `Send me offers and occasion reminders from ${hotel} on WhatsApp. Reply STOP any time.`;
    case "profile_memory":
      return market.explicitSpecialCategory
        ? `Remember my special dates, who I travel with, and any holidays I choose to share (which may reveal my religion or culture), so ${hotel} can tailor future stays. I can change or delete this any time.`
        : `Remember my special dates, who I travel with, and the holidays I celebrate, so ${hotel} can tailor future stays. I can change or delete this any time.`;
  }
}

export const CONSENT_LABEL: Record<ConsentPurpose, string> = {
  marketing_email: "Offers by email",
  marketing_whatsapp: "Offers on WhatsApp",
  profile_memory: "Remember my dates and preferences",
};
