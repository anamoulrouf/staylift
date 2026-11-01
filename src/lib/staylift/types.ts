export type OfferCategory =
  | "upgrade"
  | "breakfast"
  | "late_checkout"
  | "early_checkin"
  | "parking"
  | "spa"
  | "transfer"
  | "fb";

export type PriceUnit = "stay" | "night" | "person" | "person_night";
export type StayStatus = "upcoming" | "in_house" | "departing" | "departed";
export type OrderStatus =
  | "pending_approval"
  | "pending_payment"
  | "paid"
  | "declined"
  | "fulfilled"
  | "refunded";
/** Where the sale happened. Desk sales are logged so the holdout baseline is real. */
export type OrderChannel = "guest_page" | "desk";
export type EmailKind = "real" | "masked" | "none";
export type PhoneKind = "valid" | "placeholder" | "none";
export type Consent = "none" | "transactional" | "marketing";

export type Economics = {
  launchedOn: string;
  planId: "A" | "B" | "C" | "custom";
  perRoomMonthly: number;
  baseMonthly: number;
  revSharePct: number;
  marginPct: number;
  cardPct: number;
  cardFixedCents: number;
  holdoutPct: number;
  messageCostCents: number;
};

export type PropertySettings = {
  market: "US" | "UK" | "EU" | "AE";
  timezone: string;
  /** short code in the desk QR link (/c/<code>) */
  code: string;
  isDemo: boolean;
  /** From address for guest email, on the hotel's own sending subdomain */
  senderEmail: string | null;
  /** When the check-in capture step went live (phase B gate window starts here) */
  captureLaunchedOn: string | null;
  /** Days after departure that stay-only data (service contact, party, celebration) is kept */
  serviceRetentionDays: number;
};

export type Property = {
  id: string;
  name: string;
  city: string;
  rooms: number;
  occupancyPct: number;
  avgStayNights: number;
  tagline: string;
  economics: Economics;
  settings: PropertySettings;
};

export type RoomType = {
  id: string;
  name: string;
  nightlyCents: number;
  inventory: number;
};

export type Offer = {
  id: string;
  name: string;
  shortLabel: string;
  description: string;
  category: OfferCategory;
  priceCents: number;
  priceUnit: PriceUnit;
  inventory: number | null;
  cutoffHours: number | null;
  autoApprove: boolean;
  ownerType: "HOTEL" | "PARTNER";
  active: boolean;
  fromRoomTypeId: string | null;
  toRoomTypeId: string | null;
  sortOrder: number;
};

export type Reservation = {
  /** guest profile this stay is linked to (after a verified contact + consent) */
  profileId?: string | null;
  /** OTA-sourced guest data purged on its clock (name reduced to initials) */
  anonymized?: boolean;
  id: string;
  bookingRef: string;
  source: string;
  guestName: string;
  arrival: string;
  departure: string;
  nights: number;
  roomTypeId: string;
  roomTypeName: string;
  guests: number;
  token: string;
  emailKind: EmailKind;
  phoneKind: PhoneKind;
  consent: Consent;
  notes: string;
  status: StayStatus;
  /** has a usable channel: OTA relay, real email, or a valid phone */
  reachable: boolean;
  eligibleChannels: string[];
  /** control group: check-in only, never shown offers */
  holdout: boolean;
  /** last day OTA-provided contact data may be held (null = no fixed clock known) */
  contactPurgeOn: string | null;
  createdAt: string;
};

export type Order = {
  id: string;
  reservationId: string;
  guestName: string;
  offerId: string;
  offerName: string;
  category: OfferCategory;
  qty: number;
  amountCents: number;
  status: OrderStatus;
  channel: OrderChannel;
  forDate: string | null;
  forTime: string | null;
  autoApprove: boolean;
  createdAt: string;
  paidAt: string | null;
  /** first day staff may approve (upgrades open 72h before arrival); null = now */
  approvableFrom: string | null;
  token: string;
  /** stay dates + where the booking came from, for the requests table */
  arrival: string;
  departure: string;
  platform: string;
  bookingRef: string;
};

export type Recipe = {
  id: string;
  name: string;
  summary: string;
  triggerEvent: string;
  offsetHours: number;
  offerIds: string[];
  active: boolean;
  sendsMessage: boolean;
  sortOrder: number;
};

/**
 * Nested funnel over treatment bookings since launch. Each step is a subset of
 * the one before it, so no step can exceed 100% of the previous one:
 *   bookings ⊇ reached (had a channel or opened the page)
 *            ⊇ viewed (opened the stay page or bought on it)
 *            ⊇ bought (≥1 paid order through the page)
 */
export type Funnel = {
  bookings: number;
  reached: number;
  viewed: number;
  bought: number;
  pageRevenueCents: number;
};

export type Dashboard = {
  property: Property;
  today: string;
  /** captured today (paid_at today), page and desk */
  todayCents: number;
  /** page revenue since launch, paid or fulfilled */
  pilotCents: number;
  pendingCents: number;
  /** page revenue ÷ treatment bookings since launch */
  revenuePerBooking: number;
  /** page revenue ÷ occupied room-nights of those bookings */
  revenuePerNight: number;
  /** bought ÷ bookings */
  attachRate: number;
  /** bought ÷ viewed */
  conversion: number;
  topOffer: { name: string; cents: number } | null;
  funnel: Funnel;
  holdoutBookings: number;
  /**
   * The guest journey over OTA bookings that saw offers, each step a subset of
   * the previous: booked → booking email sent → clicked through from the email
   * → bought an offer on that visit.
   */
  journey: {
    otaBookings: number;
    emailed: number;
    clicked: number;
    booked: number;
    revenueCents: number;
  };
  pending: Order[];
  arriving: Reservation[];
};

export type MeasuredRoi = {
  property: Property;
  today: string;
  daysLive: number;
  /** per completed stay: all paid ancillary revenue (page + desk), in dollars */
  treatmentRevenue: number[];
  holdoutRevenue: number[];
  pageRevenueCents: number;
  pageOrders: number;
  deskRevenueCents: number;
  messagingCostCents: number;
  messagesSent: number;
  /** funnel rates on completed treatment stays, for "model a full year" */
  rates: {
    reachablePct: number;
    viewPct: number;
    buyPct: number;
    avgSpend: number;
    ordersPerBuyer: number;
  };
};

export type StayPayload = {
  property: Property;
  reservation: Reservation;
  /** eligible offers, already ordered: personalised picks first */
  offers: Offer[];
  personalization: {
    headline: string;
    picks: { offerId: string; reason: string }[];
  };
  orders: Order[];
  checkin: CheckinState;
};

/* ------------------------------------------------- check-in capture (B) */

export type Celebration = "birthday" | "anniversary" | "honeymoon" | "achievement" | "other";
export type CelebrationWhose = "me" | "partner" | "someone";
export type CompanionRelation = "partner" | "child" | "parent" | "sibling" | "friend" | "colleague" | "other";
export type AgeBand = "0-2" | "3-12" | "13-17";
export type PartyMember =
  | { relation: Exclude<CompanionRelation, "child">; firstName: string }
  | { relation: "child"; ageBand: AgeBand };

export type CaptureSource = "online" | "desk_tablet" | "qr";

export type CheckinState = {
  completed: boolean;
  eta: string | null;
  source: CaptureSource | null;
  celebration: Celebration | null;
  celebrationWhose: CelebrationWhose | null;
  celebrationMonth: number | null;
  celebrationDay: number | null;
  party: PartyMember[];
  /** masked, e.g. m•••@gmail.com; never the full value on a guest page */
  verifiedEmail: string | null;
  verifiedPhone: string | null;
  /** current consents when this stay is linked to a profile */
  consents: { marketing_email: boolean; marketing_whatsapp: boolean; profile_memory: boolean };
  holidays: string[];
  returningGuest: boolean;
  /** legacy flag, kept for analytics: guest's own email captured */
  realEmailCaptured: boolean;
};
