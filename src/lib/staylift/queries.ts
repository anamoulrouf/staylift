/**
 * Staylift data layer: plain async functions over the shared `Sql` surface.
 * `server.ts` wraps each one in a `createServerFn`; keeping the SQL here lets
 * it be tested against a real Postgres without the framework.
 *
 * Metric definitions live in `types.ts` (Funnel, Dashboard, MeasuredRoi).
 * Drivers differ on numeric/timestamp types, so every numeric column goes
 * through Number() and every timestamp through iso().
 */
import type { Sql } from "@/lib/db";
import { nightsBetween } from "./format.ts";
import { parseReservationEmail } from "./parse-email.ts";
import { computeAmount, isNightly } from "./pricing.ts";
import { personalize } from "./personalize.ts";
import { EMAIL_MODE_LABEL, emailModeFor, renderBookingEmail, type EmailMode } from "./email-template.ts";
import { isMarketId, otaRetention, type MarketId } from "./markets.ts";
import { randomToken } from "./vault.ts";

export { computeAmount };
import type {
  Consent,
  Dashboard,
  Economics,
  EmailKind,
  MeasuredRoi,
  Offer,
  OfferCategory,
  Order,
  OrderChannel,
  OrderStatus,
  PhoneKind,
  PriceUnit,
  Property,
  Recipe,
  Reservation,
  StayPayload,
  StayStatus,
} from "./types.ts";

/**
 * Every function here runs inside withTenant() (tenant-db.ts): row-level security
 * limits it to one hotel and new rows default to that hotel. Explicit
 * `property_id = current_setting(...)` filters below are a second check, not the
 * only one.
 */
const CURRENT_PROPERTY = "current_setting('app.property_id', true)";

/** Phone messages (WhatsApp/SMS) allowed per booking under the lean design. */
export const PHONE_MESSAGE_CAP = 2;

/** Upgrades are released this many days before arrival, so they never displace higher-paying bookings. */
export const UPGRADE_RELEASE_DAYS = 3;

const PAID = "('paid','fulfilled')";

export function iso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function isoOrNull(value: unknown): string | null {
  return value === null || value === undefined ? null : iso(value);
}

export function dateOnly(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

export function addDays(day: string, days: number): string {
  const t = Date.parse(`${day.slice(0, 10)}T00:00:00Z`) + days * 86_400_000;
  return new Date(t).toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string) {
  const a = Date.parse(`${from.slice(0, 10)}T00:00:00Z`);
  const b = Date.parse(`${to.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.round((b - a) / 86_400_000);
}

function stayStatus(arrival: string, departure: string, today: string): StayStatus {
  if (arrival > today) return "upcoming";
  if (departure > today) return "in_house";
  if (departure === today) return "departing";
  return "departed";
}

export function reachable(email: EmailKind, phone: PhoneKind) {
  return email !== "none" || phone === "valid";
}

function channels(email: EmailKind, phone: PhoneKind) {
  const list: string[] = [];
  if (phone === "valid") list.push("WhatsApp", "SMS");
  if (email === "real") list.push("Email");
  if (email === "masked") list.push("OTA relay");
  return list;
}

/**
 * Booking.com makes guest data available for 30 days after the stay; data
 * sourced from it must be purged by then. Other channels' terms are unverified,
 * so they get the same conservative clock (markets.ts OTA_RETENTION).
 */
export function contactPurgeOn(source: string, departure: string): string | null {
  const rule = otaRetention(source);
  return rule ? addDays(departure, rule.days) : null;
}

/** Row ids are unique across all hotels: 96 random bits, URL-safe. */
export function nid(prefix: string) {
  return `${prefix}_${randomToken(12)}`;
}

/* ------------------------------------------------------------------ rows */

type PropertyRow = {
  id: string;
  name: string;
  city: string;
  rooms: number;
  occupancy_pct: number;
  avg_stay_nights: string | number;
  tagline: string;
  launched_on: string | Date | null;
  plan_id: string;
  plan_per_room_monthly: string | number;
  plan_base_monthly: string | number;
  plan_rev_share_pct: string | number;
  margin_pct: string | number;
  card_pct: string | number;
  card_fixed_cents: number;
  holdout_pct: number;
  message_cost_cents: string | number;
  market: string;
  timezone: string;
  code: string;
  is_demo: boolean;
  sender_email: string | null;
  capture_launched_on: string | Date | null;
  service_retention_days: number;
};

const PROPERTY_COLS = `id, name, city, rooms, occupancy_pct, avg_stay_nights, tagline,
  launched_on::text as launched_on, plan_id, plan_per_room_monthly, plan_base_monthly,
  plan_rev_share_pct, margin_pct, card_pct, card_fixed_cents, holdout_pct, message_cost_cents,
  market, timezone, code, is_demo, sender_email, capture_launched_on::text as capture_launched_on,
  service_retention_days`;

function mapProperty(row: PropertyRow, today: string): Property {
  const planId = ["A", "B", "C"].includes(row.plan_id)
    ? (row.plan_id as Economics["planId"])
    : "custom";
  return {
    id: row.id,
    name: row.name,
    city: row.city,
    rooms: Number(row.rooms),
    occupancyPct: Number(row.occupancy_pct),
    avgStayNights: Number(row.avg_stay_nights),
    tagline: row.tagline,
    economics: {
      launchedOn: row.launched_on ? dateOnly(row.launched_on) : today,
      planId,
      perRoomMonthly: Number(row.plan_per_room_monthly),
      baseMonthly: Number(row.plan_base_monthly),
      revSharePct: Number(row.plan_rev_share_pct),
      marginPct: Number(row.margin_pct),
      cardPct: Number(row.card_pct),
      cardFixedCents: Number(row.card_fixed_cents),
      holdoutPct: Number(row.holdout_pct),
      messageCostCents: Number(row.message_cost_cents),
    },
    settings: {
      market: (isMarketId(row.market) ? row.market : "US") as MarketId,
      timezone: row.timezone,
      code: row.code,
      isDemo: Boolean(row.is_demo),
      senderEmail: row.sender_email,
      captureLaunchedOn: row.capture_launched_on ? dateOnly(row.capture_launched_on) : null,
      serviceRetentionDays: Number(row.service_retention_days),
    },
  };
}

type OfferRow = {
  id: string;
  name: string;
  short_label: string;
  description: string;
  category: string;
  price_cents: number;
  price_unit: string;
  inventory: number | null;
  cutoff_hours: number | null;
  auto_approve: boolean;
  owner_type: string;
  active: boolean;
  from_room_type_id: string | null;
  to_room_type_id: string | null;
  sort_order: number;
};

const OFFER_COLS = `id, name, short_label, description, category, price_cents, price_unit,
  inventory, cutoff_hours, auto_approve, owner_type, active,
  from_room_type_id, to_room_type_id, sort_order`;

function mapOffer(row: OfferRow): Offer {
  return {
    id: row.id,
    name: row.name,
    shortLabel: row.short_label,
    description: row.description,
    category: row.category as OfferCategory,
    priceCents: Number(row.price_cents),
    priceUnit: row.price_unit as PriceUnit,
    inventory: row.inventory === null ? null : Number(row.inventory),
    cutoffHours: row.cutoff_hours === null ? null : Number(row.cutoff_hours),
    autoApprove: row.auto_approve,
    ownerType: row.owner_type === "PARTNER" ? "PARTNER" : "HOTEL",
    active: row.active,
    fromRoomTypeId: row.from_room_type_id,
    toRoomTypeId: row.to_room_type_id,
    sortOrder: Number(row.sort_order),
  };
}

type ResRow = {
  id: string;
  booking_ref: string;
  source: string;
  guest_name: string;
  arrival: string;
  departure: string;
  room_type_id: string;
  room_type_name: string;
  guests: number;
  token: string;
  email_kind: string;
  phone_kind: string;
  consent: string;
  notes: string;
  holdout: boolean;
  created_at: string | Date;
  profile_id: string | null;
  anonymized: boolean;
};

const RES_COLS = `r.id, r.booking_ref, r.source, r.guest_name, r.arrival::text as arrival,
  r.departure::text as departure, r.room_type_id, rt.name as room_type_name,
  r.guests, r.token, r.email_kind, r.phone_kind, r.consent, r.notes, r.holdout, r.created_at,
  r.profile_id, (r.anonymized_at is not null) as anonymized`;

function mapReservation(row: ResRow, today: string): Reservation {
  const arrival = dateOnly(row.arrival);
  const departure = dateOnly(row.departure);
  const emailKind = row.email_kind as EmailKind;
  const phoneKind = row.phone_kind as PhoneKind;
  return {
    id: row.id,
    bookingRef: row.booking_ref,
    source: row.source,
    guestName: row.guest_name,
    arrival,
    departure,
    nights: nightsBetween(arrival, departure),
    roomTypeId: row.room_type_id,
    roomTypeName: row.room_type_name,
    guests: Number(row.guests),
    token: row.token,
    emailKind,
    phoneKind,
    consent: row.consent as Consent,
    notes: row.notes,
    status: stayStatus(arrival, departure, today),
    reachable: reachable(emailKind, phoneKind),
    eligibleChannels: channels(emailKind, phoneKind),
    holdout: Boolean(row.holdout),
    contactPurgeOn: contactPurgeOn(row.source, departure),
    createdAt: iso(row.created_at),
    profileId: row.profile_id ?? null,
    anonymized: Boolean(row.anonymized),
  };
}

type OrderRow = {
  id: string;
  reservation_id: string;
  guest_name: string;
  offer_id: string;
  offer_name: string;
  category: string;
  qty: number;
  amount_cents: number;
  status: string;
  channel: string;
  for_date: string | null;
  for_time: string | null;
  auto_approve: boolean;
  created_at: string | Date;
  paid_at: string | Date | null;
  token: string;
  arrival: string;
  departure: string;
  res_source: string;
  res_booking_ref: string;
};

const ORDER_COLS = `o.id, o.reservation_id, r.guest_name, o.offer_id, f.name as offer_name,
  f.category, o.qty, o.amount_cents, o.status, o.channel, o.for_date::text as for_date,
  o.for_time, f.auto_approve, o.created_at, o.paid_at, r.token, r.arrival::text as arrival,
  r.departure::text as departure, r.source as res_source, r.booking_ref as res_booking_ref`;

const ORDER_FROM = `from orders o
  join reservations r on r.id = o.reservation_id
  join offers f on f.id = o.offer_id`;

export function upgradeOpensOn(arrival: string) {
  return addDays(arrival, -UPGRADE_RELEASE_DAYS);
}

function mapOrder(row: OrderRow, today: string): Order {
  const category = row.category as OfferCategory;
  const opens = upgradeOpensOn(dateOnly(row.arrival));
  return {
    id: row.id,
    reservationId: row.reservation_id,
    guestName: row.guest_name,
    offerId: row.offer_id,
    offerName: row.offer_name,
    category,
    qty: Number(row.qty),
    amountCents: Number(row.amount_cents),
    status: row.status as OrderStatus,
    channel: (row.channel === "desk" ? "desk" : "guest_page") as OrderChannel,
    forDate: row.for_date ? dateOnly(row.for_date) : null,
    forTime: row.for_time,
    autoApprove: row.auto_approve,
    createdAt: iso(row.created_at),
    paidAt: isoOrNull(row.paid_at),
    approvableFrom:
      category === "upgrade" && row.status === "pending_approval" && opens > today ? opens : null,
    token: row.token,
    arrival: dateOnly(row.arrival),
    departure: dateOnly(row.departure),
    platform: row.res_source,
    bookingRef: row.res_booking_ref,
  };
}

/* --------------------------------------------------------------- helpers */

export async function todayIso(sql: Sql) {
  const rows = await sql<{ d: string }>`select CURRENT_DATE::text as d`;
  return rows[0]?.d ?? new Date().toISOString().slice(0, 10);
}

export async function loadProperty(sql: Sql, today?: string): Promise<Property> {
  const day = today ?? (await todayIso(sql));
  const rows = await sql.query<PropertyRow>(
    `select ${PROPERTY_COLS} from properties where id = ${CURRENT_PROPERTY}`,
  );
  const row = rows[0];
  if (!row) throw new Error("Hotel not found for this session.");
  return mapProperty(row, day);
}

export function isEligible(offer: Offer, res: Reservation, today: string) {
  if (res.holdout) return false;
  if (!offer.active) return false;
  if (offer.inventory === 0) return false;
  if (res.status === "departed") return false;
  if (offer.fromRoomTypeId && res.roomTypeId !== offer.fromRoomTypeId) return false;
  if (offer.category === "late_checkout") {
    return res.status === "in_house" || res.status === "departing";
  }
  if (offer.category === "early_checkin") {
    const until = daysBetween(today, res.arrival);
    return until >= 0 && until <= 1;
  }
  if (offer.category === "upgrade") {
    return res.status === "upcoming" || res.arrival === today;
  }
  return true;
}

export async function reservationByToken(sql: Sql, token: string, today: string) {
  const rows = await sql.query<ResRow>(
    `select ${RES_COLS} from reservations r join room_types rt on rt.id = r.room_type_id
     where r.token = $1`,
    [token],
  );
  return rows[0] ? mapReservation(rows[0], today) : null;
}

export async function reservationById(sql: Sql, id: string, today: string) {
  const rows = await sql.query<ResRow>(
    `select ${RES_COLS} from reservations r join room_types rt on rt.id = r.room_type_id
     where r.id = $1`,
    [id],
  );
  return rows[0] ? mapReservation(rows[0], today) : null;
}

async function offerById(sql: Sql, id: string) {
  const rows = await sql.query<OfferRow>(`select ${OFFER_COLS} from offers where id = $1`, [id]);
  return rows[0] ? mapOffer(rows[0]) : null;
}

/* ------------------------------------------------------------- dashboard */

export async function pendingCount(sql: Sql) {
  const rows = await sql<{ n: number }>`
    select count(*)::int as n from orders where status = 'pending_approval'
  `;
  return Number(rows[0]?.n ?? 0);
}

export async function dashboard(sql: Sql): Promise<Dashboard> {
  const today = await todayIso(sql);
  const property = await loadProperty(sql, today);
  const launched = property.economics.launchedOn;

  const [funnelRows, money, top, pending, arriving, holdoutRows, journeyRows] = await Promise.all([
    sql.query<{
      bookings: number;
      reached: number;
      viewed: number;
      bought: number;
      nights: number;
    }>(
      `with b as (
         select r.id,
           (r.email_kind <> 'none' or r.phone_kind = 'valid') as has_channel,
           exists (select 1 from events e where e.reservation_id = r.id and e.kind = 'view') as opened,
           exists (select 1 from orders o where o.reservation_id = r.id
                   and o.channel = 'guest_page' and o.status in ${PAID}) as bought,
           (r.departure - r.arrival) as nights
         from reservations r
         where r.property_id = ${CURRENT_PROPERTY} and not r.holdout and r.arrival >= $1::date
       )
       select count(*)::int as bookings,
         count(*) filter (where has_channel or opened or bought)::int as reached,
         count(*) filter (where opened or bought)::int as viewed,
         count(*) filter (where bought)::int as bought,
         coalesce(sum(nights), 0)::int as nights
       from b`,
      [launched],
    ),
    sql.query<{ pilot_cents: number; today_cents: number; pending_cents: number }>(
      `select
         coalesce(sum(o.amount_cents) filter (
           where o.status in ${PAID} and o.channel = 'guest_page'
             and not r.holdout and r.arrival >= $1::date), 0)::int as pilot_cents,
         coalesce(sum(o.amount_cents) filter (
           where o.status in ${PAID} and o.paid_at::date = CURRENT_DATE), 0)::int as today_cents,
         coalesce(sum(o.amount_cents) filter (
           where o.status = 'pending_approval'), 0)::int as pending_cents
       from orders o join reservations r on r.id = o.reservation_id`,
      [launched],
    ),
    sql.query<{ name: string; cents: number }>(
      `select f.name, sum(o.amount_cents)::int as cents
       ${ORDER_FROM}
       where o.status in ${PAID} and o.channel = 'guest_page'
         and not r.holdout and r.arrival >= $1::date
       group by f.name order by cents desc limit 1`,
      [launched],
    ),
    sql.query<OrderRow>(
      `select ${ORDER_COLS} ${ORDER_FROM}
       where o.status = 'pending_approval' order by o.created_at desc`,
    ),
    sql.query<ResRow>(
      `select ${RES_COLS} from reservations r join room_types rt on rt.id = r.room_type_id
       where r.arrival <= CURRENT_DATE + 3 and r.departure >= CURRENT_DATE
       order by r.arrival, r.guest_name`,
    ),
    sql.query<{ n: number }>(
      `select count(*)::int as n from reservations
       where property_id = ${CURRENT_PROPERTY} and holdout and arrival >= $1::date`,
      [launched],
    ),
    sql.query<{ ota: number; emailed: number; clicked: number; booked: number; cents: number }>(
      `with b as (
         select r.id,
           exists (select 1 from messages m where m.reservation_id = r.id
                   and m.recipe_id = 'rec_booking' and m.channel = 'email' and m.status = 'sent') as emailed,
           exists (select 1 from events e where e.reservation_id = r.id
                   and e.kind = 'view' and e.source = 'email') as clicked,
           coalesce((select sum(o.amount_cents) from orders o where o.reservation_id = r.id
                   and o.channel = 'guest_page' and o.source = 'email'
                   and o.status in ${PAID}), 0) as cents
         from reservations r
         where r.property_id = ${CURRENT_PROPERTY} and not r.holdout and r.arrival >= $1::date and r.source <> 'Direct'
       )
       select count(*)::int as ota,
         (count(*) filter (where emailed))::int as emailed,
         (count(*) filter (where emailed and clicked))::int as clicked,
         (count(*) filter (where emailed and clicked and cents > 0))::int as booked,
         coalesce(sum(cents) filter (where emailed and clicked), 0)::int as cents
       from b`,
      [launched],
    ),
  ]);

  const f = funnelRows[0] ?? { bookings: 0, reached: 0, viewed: 0, bought: 0, nights: 0 };
  const bookings = Number(f.bookings);
  const viewed = Number(f.viewed);
  const bought = Number(f.bought);
  const nights = Number(f.nights);
  const pilotCents = Number(money[0]?.pilot_cents ?? 0);
  const topRow = top[0];

  return {
    property,
    today,
    todayCents: Number(money[0]?.today_cents ?? 0),
    pilotCents,
    pendingCents: Number(money[0]?.pending_cents ?? 0),
    revenuePerBooking: bookings ? pilotCents / 100 / bookings : 0,
    revenuePerNight: nights ? pilotCents / 100 / nights : 0,
    attachRate: bookings ? bought / bookings : 0,
    conversion: viewed ? bought / viewed : 0,
    topOffer: topRow ? { name: topRow.name, cents: Number(topRow.cents) } : null,
    funnel: {
      bookings,
      reached: Number(f.reached),
      viewed,
      bought,
      pageRevenueCents: pilotCents,
    },
    holdoutBookings: Number(holdoutRows[0]?.n ?? 0),
    journey: {
      otaBookings: Number(journeyRows[0]?.ota ?? 0),
      emailed: Number(journeyRows[0]?.emailed ?? 0),
      clicked: Number(journeyRows[0]?.clicked ?? 0),
      booked: Number(journeyRows[0]?.booked ?? 0),
      revenueCents: Number(journeyRows[0]?.cents ?? 0),
    },
    pending: pending.map((o) => mapOrder(o, today)),
    arriving: arriving.map((r) => mapReservation(r, today)),
  };
}

/* ---------------------------------------------------------- measured ROI */

export async function measuredRoi(sql: Sql): Promise<MeasuredRoi> {
  const today = await todayIso(sql);
  const property = await loadProperty(sql, today);
  const launched = property.economics.launchedOn;

  const stays = await sql.query<{
    holdout: boolean;
    cents: number;
    page_cents: number;
    page_orders: number;
    desk_cents: number;
    has_channel: boolean;
    opened: boolean;
  }>(
    `select r.holdout,
       coalesce(sum(o.amount_cents) filter (where o.status in ${PAID}), 0)::int as cents,
       coalesce(sum(o.amount_cents) filter (
         where o.status in ${PAID} and o.channel = 'guest_page'), 0)::int as page_cents,
       (count(o.id) filter (where o.status in ${PAID} and o.channel = 'guest_page'))::int as page_orders,
       coalesce(sum(o.amount_cents) filter (
         where o.status in ${PAID} and o.channel = 'desk'), 0)::int as desk_cents,
       (r.email_kind <> 'none' or r.phone_kind = 'valid') as has_channel,
       exists (select 1 from events e where e.reservation_id = r.id and e.kind = 'view') as opened
     from reservations r
     left join orders o on o.reservation_id = r.id
     where r.property_id = ${CURRENT_PROPERTY} and r.arrival >= $1::date and r.departure <= CURRENT_DATE
     group by r.id`,
    [launched],
  );

  const msg = await sql.query<{ cents: string | number; n: number }>(
    `select coalesce(sum(cost_cents), 0) as cents, count(*)::int as n
     from messages m join reservations r on r.id = m.reservation_id
     where r.property_id = ${CURRENT_PROPERTY} and m.status = 'sent' and m.sent_at >= $1::date`,
    [launched],
  );

  const treatment = stays.filter((s) => !s.holdout);
  const holdout = stays.filter((s) => s.holdout);
  let reached = 0;
  let viewed = 0;
  let bought = 0;
  let pageCents = 0;
  let pageOrders = 0;
  let deskCents = 0;
  for (const s of stays) deskCents += Number(s.desk_cents);
  for (const s of treatment) {
    const orders = Number(s.page_orders);
    const isViewed = s.opened || orders > 0;
    if (s.has_channel || isViewed) reached += 1;
    if (isViewed) viewed += 1;
    if (orders > 0) bought += 1;
    pageCents += Number(s.page_cents);
    pageOrders += orders;
  }
  const pct = (a: number, b: number) => (b ? (a / b) * 100 : 0);

  return {
    property,
    today,
    daysLive: Math.max(1, daysBetween(launched, today)),
    treatmentRevenue: treatment.map((s) => Number(s.cents) / 100),
    holdoutRevenue: holdout.map((s) => Number(s.cents) / 100),
    pageRevenueCents: pageCents,
    pageOrders,
    deskRevenueCents: deskCents,
    messagingCostCents: Number(msg[0]?.cents ?? 0),
    messagesSent: Number(msg[0]?.n ?? 0),
    rates: {
      reachablePct: pct(reached, treatment.length),
      viewPct: pct(viewed, reached),
      buyPct: pct(bought, viewed),
      avgSpend: bought ? pageCents / 100 / bought : 0,
      ordersPerBuyer: bought ? pageOrders / bought : 1,
    },
  };
}

export type EconomicsUpdate = {
  planId: Economics["planId"];
  perRoomMonthly: number;
  baseMonthly: number;
  revSharePct: number;
  marginPct: number;
  cardPct: number;
};

export async function updateEconomics(sql: Sql, data: EconomicsUpdate) {
  await sql`
    update properties set
      plan_id = ${data.planId},
      plan_per_room_monthly = ${data.perRoomMonthly},
      plan_base_monthly = ${data.baseMonthly},
      plan_rev_share_pct = ${data.revSharePct},
      margin_pct = ${data.marginPct},
      card_pct = ${data.cardPct}
    where id = current_setting('app.property_id', true)
  `;
  return { ok: true as const };
}

/* ------------------------------------------------------------ book lists */

export async function reservations(sql: Sql, opts: { history?: boolean } = {}) {
  const today = await todayIso(sql);
  const rows = await sql.query<ResRow>(
    `select ${RES_COLS} from reservations r join room_types rt on rt.id = r.room_type_id
     where $1::boolean or r.departure >= CURRENT_DATE - 7 or r.created_at >= now() - interval '7 days'
     order by r.arrival desc, r.guest_name
     limit 1000`,
    [Boolean(opts.history)],
  );
  const counts = await sql<{ all_n: number; current_n: number }>`
    select count(*)::int as all_n,
      (count(*) filter (where departure >= CURRENT_DATE - 7 or created_at >= now() - interval '7 days'))::int as current_n
    from reservations
  `;
  const totals = await sql.query<{ reservation_id: string; cents: number; pending: number }>(
    `select reservation_id,
       coalesce(sum(amount_cents) filter (where status in ${PAID}), 0)::int as cents,
       coalesce(sum(amount_cents) filter (where status = 'pending_approval'), 0)::int as pending
     from orders group by reservation_id`,
  );
  const ordersByRes: Record<string, { cents: number; pendingCents: number }> = {};
  for (const t of totals) {
    ordersByRes[t.reservation_id] = { cents: Number(t.cents), pendingCents: Number(t.pending) };
  }
  const list = rows.map((r) => mapReservation(r, today));
  // Current book reads best soonest-first; history reads best newest-first.
  if (!opts.history) list.sort((a, b) => a.arrival.localeCompare(b.arrival));
  return {
    today,
    reservations: list,
    ordersByRes,
    totalCount: Number(counts[0]?.all_n ?? 0),
    currentCount: Number(counts[0]?.current_n ?? 0),
  };
}

export async function offers(sql: Sql) {
  const rows = await sql.query<OfferRow>(`select ${OFFER_COLS} from offers order by sort_order`);
  return rows.map(mapOffer);
}

export async function fulfillment(sql: Sql) {
  const today = await todayIso(sql);
  const pending = await sql.query<OrderRow>(
    `select ${ORDER_COLS} ${ORDER_FROM}
     where o.status = 'pending_approval' order by o.created_at desc`,
  );
  const recent = await sql.query<OrderRow>(
    `select ${ORDER_COLS} ${ORDER_FROM}
     where o.status in ${PAID}
       and (o.for_date >= CURRENT_DATE - 7 or o.paid_at >= now() - interval '7 days')
     order by coalesce(o.paid_at, o.created_at) desc
     limit 50`,
  );
  return {
    pending: pending.map((o) => mapOrder(o, today)),
    paid: recent.map((o) => mapOrder(o, today)),
  };
}

export async function recipes(sql: Sql): Promise<Recipe[]> {
  const rows = await sql<{
    id: string;
    name: string;
    summary: string;
    trigger_event: string;
    offset_hours: number;
    offer_ids: string;
    active: boolean;
    sends_message: boolean;
    sort_order: number;
  }>`
    select id, name, summary, trigger_event, offset_hours, offer_ids, active, sends_message, sort_order
    from recipes
    order by sort_order
  `;
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    summary: r.summary,
    triggerEvent: r.trigger_event,
    offsetHours: Number(r.offset_hours),
    offerIds: r.offer_ids.split(",").filter(Boolean),
    active: r.active,
    sendsMessage: Boolean(r.sends_message),
    sortOrder: Number(r.sort_order),
  }));
}

export async function analytics(sql: Sql) {
  const today = await todayIso(sql);
  const property = await loadProperty(sql, today);
  const launched = property.economics.launchedOn;
  const byOffer = await sql.query<{ name: string; cents: number; n: number }>(
    `select f.name, sum(o.amount_cents)::int as cents, count(*)::int as n
     ${ORDER_FROM}
     where o.status in ${PAID} and o.channel = 'guest_page'
       and not r.holdout and r.arrival >= $1::date
     group by f.name order by cents desc`,
    [launched],
  );
  const bySource = await sql.query<{ source: string; cents: number; bookings: number }>(
    `select r.source,
       coalesce(sum(o.amount_cents) filter (
         where o.status in ${PAID} and o.channel = 'guest_page'), 0)::int as cents,
       count(distinct r.id)::int as bookings
     from reservations r
     left join orders o on o.reservation_id = r.id
     where not r.holdout and r.arrival >= $1::date
     group by r.source order by cents desc`,
    [launched],
  );
  const capture = await sql.query<{ captured: number; checked_in: number }>(
    `select
       (count(*) filter (where c.real_email_captured))::int as captured,
       count(*)::int as checked_in
     from checkins c join reservations r on r.id = c.reservation_id
     where r.source <> 'Direct' and c.completed_at is not null and r.arrival >= $1::date`,
    [launched],
  );
  const messaging = await sql.query<{ cents: string | number; n: number; bookings: number }>(
    `select coalesce(sum(m.cost_cents), 0) as cents, count(*)::int as n,
       count(distinct m.reservation_id)::int as bookings
     from messages m join reservations r on r.id = m.reservation_id
     where m.status = 'sent' and r.arrival >= $1::date`,
    [launched],
  );
  return {
    byOffer: byOffer.map((r) => ({ name: r.name, cents: Number(r.cents), n: Number(r.n) })),
    bySource: bySource.map((r) => ({
      source: r.source,
      cents: Number(r.cents),
      bookings: Number(r.bookings),
    })),
    capture: {
      captured: Number(capture[0]?.captured ?? 0),
      checkedIn: Number(capture[0]?.checked_in ?? 0),
    },
    messaging: {
      costCents: Number(messaging[0]?.cents ?? 0),
      sent: Number(messaging[0]?.n ?? 0),
      bookings: Number(messaging[0]?.bookings ?? 0),
    },
  };
}

/* ------------------------------------------------------------ guest page */

export async function stay(sql: Sql, token: string): Promise<StayPayload> {
  const today = await todayIso(sql);
  const property = await loadProperty(sql, today);
  const reservation = await reservationByToken(sql, token, today);
  if (!reservation) throw new Error("This stay link is not valid.");

  const offerRows = await sql.query<OfferRow>(
    `select ${OFFER_COLS} from offers where active = true order by sort_order`,
  );
  const orderRows = await sql.query<OrderRow>(
    `select ${ORDER_COLS} ${ORDER_FROM}
     where r.token = $1 and o.status in ('pending_approval','paid','fulfilled')
     order by o.created_at`,
    [token],
  );
  const checkRows = await sql.query<{ celebration: string | null }>(
    `select celebration from checkins where reservation_id = $1`,
    [reservation.id],
  );
  const celebration = checkRows[0]?.celebration;

  const bought = new Set(orderRows.map((o) => o.offer_id));
  const available = offerRows
    .map(mapOffer)
    .filter((o) => isEligible(o, reservation, today) && !bought.has(o.id));
  // What the guest told us at check-in ("anniversary") steers the picks like a booking note.
  const p = personalize(
    celebration ? { ...reservation, notes: `${reservation.notes} ${celebration}` } : reservation,
    available,
    { today, city: property.city, standardRoomId: await standardRoomId(sql) },
  );
  const order = [...p.picks.map((x) => x.offerId), ...p.restIds];
  const ordered = order
    .map((id) => available.find((o) => o.id === id))
    .filter((o): o is Offer => Boolean(o));

  return {
    property,
    reservation,
    offers: ordered,
    personalization: {
      headline: p.headline,
      picks: p.picks.map(({ offerId, reason }) => ({ offerId, reason })),
    },
    orders: orderRows.map((o) => mapOrder(o, today)),
    // Filled in by guests.stayPage (capture state, masked contacts, consents).
    checkin: emptyCheckin(),
  };
}

export function emptyCheckin(): StayPayload["checkin"] {
  return {
    completed: false,
    eta: null,
    source: null,
    celebration: null,
    celebrationWhose: null,
    celebrationMonth: null,
    celebrationDay: null,
    party: [],
    verifiedEmail: null,
    verifiedPhone: null,
    consents: { marketing_email: false, marketing_whatsapp: false, profile_memory: false },
    holidays: [],
    returningGuest: false,
    realEmailCaptured: false,
  };
}

/** The hotel's entry room type (cheapest), which upgrade rules treat as "standard". */
export async function standardRoomId(sql: Sql) {
  const rows = await sql<{ id: string }>`select id from room_types order by nightly_cents, id limit 1`;
  return rows[0]?.id;
}

/** One view per booking per 20 minutes; holdout guests never see offers, so no view. */
export type Touchpoint = "email" | "whatsapp" | "sms";

export async function recordStayView(sql: Sql, token: string, source?: Touchpoint) {
  const rows = await sql.query<{ id: string; holdout: boolean }>(
    `select id, holdout from reservations where token = $1`,
    [token],
  );
  const row = rows[0];
  if (!row || row.holdout) return { ok: false as const };
  const recent = await sql.query<{ n: number }>(
    `select count(*)::int as n from events
     where reservation_id = $1 and kind = 'view' and created_at > now() - interval '20 minutes'`,
    [row.id],
  );
  if (Number(recent[0]?.n ?? 0) === 0) {
    await sql`
      insert into events (reservation_id, kind, source) values (${row.id}, 'view', ${source ?? null})
    `;
  }
  return { ok: true as const };
}

function forDateFor(offer: Offer, res: Reservation) {
  return offer.category === "late_checkout" ? res.departure : res.arrival;
}

async function takeInventory(sql: Sql, offer: Offer) {
  if (offer.inventory === null) return;
  const rows = await sql.query<{ id: string }>(
    `update offers set inventory = inventory - 1 where id = $1 and inventory > 0 returning id`,
    [offer.id],
  );
  if (rows.length === 0) throw new Error("Sold out for these dates.");
}

export async function purchaseOffer(
  sql: Sql,
  data: { token: string; offerId: string; qty: number; forTime?: string; source?: Touchpoint },
) {
  const today = await todayIso(sql);
  const reservation = await reservationByToken(sql, data.token, today);
  if (!reservation) throw new Error("Stay not found.");
  const offer = await offerById(sql, data.offerId);
  if (!offer) throw new Error("Offer not found.");
  if (!isEligible(offer, reservation, today)) {
    throw new Error("That offer is not available for this stay.");
  }

  const existing = await sql.query<{ n: number }>(
    `select count(*)::int as n from orders
     where reservation_id = $1 and offer_id = $2 and status in ('pending_approval','paid','fulfilled')`,
    [reservation.id, offer.id],
  );
  if (Number(existing[0]?.n ?? 0) > 0) throw new Error("Already on this stay.");

  await takeInventory(sql, offer);

  const amount = computeAmount(offer, reservation, data.qty);
  const status: OrderStatus = offer.autoApprove ? "paid" : "pending_approval";
  const id = nid("ord");
  await sql`
    insert into orders (
      id, reservation_id, offer_id, qty, amount_cents, status, for_date, for_time, channel, paid_at, source
    )
    values (
      ${id}, ${reservation.id}, ${offer.id}, ${data.qty}, ${amount}, ${status},
      ${forDateFor(offer, reservation)}, ${data.forTime ?? null}, 'guest_page',
      ${offer.autoApprove ? new Date().toISOString() : null}, ${data.source ?? null}
    )
  `;
  await sql`
    insert into events (reservation_id, offer_id, kind)
    values (${reservation.id}, ${offer.id}, 'purchase')
  `;
  return {
    id,
    status,
    amountCents: amount,
    autoApprove: offer.autoApprove,
    confirmsFrom: offer.category === "upgrade" ? upgradeOpensOn(reservation.arrival) : null,
  };
}

export async function decideOrder(
  sql: Sql,
  data: { orderId: string; decision: "approve" | "decline" },
) {
  const today = await todayIso(sql);
  const rows = await sql.query<{
    id: string;
    status: string;
    offer_id: string;
    category: string;
    arrival: string;
  }>(
    `select o.id, o.status, o.offer_id, f.category, r.arrival::text as arrival
     from orders o join offers f on f.id = o.offer_id join reservations r on r.id = o.reservation_id
     where o.id = $1`,
    [data.orderId],
  );
  const row = rows[0];
  if (!row) throw new Error("Order not found.");
  if (row.status !== "pending_approval") throw new Error("Already decided.");

  if (data.decision === "approve") {
    const opens = upgradeOpensOn(dateOnly(row.arrival));
    if (row.category === "upgrade" && opens > today) {
      throw new Error(
        `Upgrades are confirmed from ${opens} (72 hours before arrival), so they never displace a higher-paying booking.`,
      );
    }
    await sql`
      update orders set status = 'paid', decided_at = now(), paid_at = now()
      where id = ${data.orderId}
    `;
  } else {
    await sql`update orders set status = 'declined', decided_at = now() where id = ${data.orderId}`;
    await sql`
      update offers set inventory = inventory + 1
      where id = ${row.offer_id} and inventory is not null
    `;
  }
  return { ok: true as const };
}

/* --------------------------------------------------------------- desk ops */

export async function toggleRecipe(sql: Sql, data: { id: string; active: boolean }) {
  await sql`update recipes set active = ${data.active} where id = ${data.id}`;
  return { ok: true as const };
}

export async function toggleOffer(sql: Sql, data: { id: string; active: boolean }) {
  await sql`update offers set active = ${data.active} where id = ${data.id}`;
  return { ok: true as const };
}

export async function sendStayLink(
  sql: Sql,
  data: { reservationId: string; recipeId?: string; channel: "email" | "sms" | "whatsapp" },
) {
  const property = await loadProperty(sql);
  const res = await sql.query<{
    id: string;
    guest_name: string;
    email_kind: string;
    phone_kind: string;
  }>(`select id, guest_name, email_kind, phone_kind from reservations where id = $1`, [
    data.reservationId,
  ]);
  const row = res[0];
  if (!row) throw new Error("Reservation not found.");
  const phone = data.channel !== "email";
  if (!phone && row.email_kind === "none") throw new Error("No email on file.");
  if (phone && row.phone_kind !== "valid") {
    throw new Error("No valid phone on file — placeholder numbers are rejected.");
  }
  if (phone) {
    const sent = await sql.query<{ n: number }>(
      `select count(*)::int as n from messages
       where reservation_id = $1 and channel in ('sms','whatsapp') and status = 'sent'`,
      [row.id],
    );
    if (Number(sent[0]?.n ?? 0) >= PHONE_MESSAGE_CAP) {
      throw new Error(
        `Already ${PHONE_MESSAGE_CAP} phone messages on this booking — the lean cap. Use email or the desk.`,
      );
    }
  }
  const recipe = data.recipeId
    ? await sql.query<{ name: string }>(`select name from recipes where id = $1`, [data.recipeId])
    : [];
  const first = row.guest_name.split(" ")[0] ?? row.guest_name;
  const subject = recipe[0]?.name
    ? `${recipe[0].name} — ${first}`
    : `Check in online for ${property.name}`;
  const cost = phone ? property.economics.messageCostCents : 0;
  await sql`
    insert into messages (id, reservation_id, recipe_id, channel, subject, status, kind, cost_cents)
    values (
      ${nid("msg")}, ${row.id}, ${data.recipeId ?? null}, ${data.channel}, ${subject},
      'sent', 'utility', ${cost}
    )
  `;
  return { ok: true as const, costCents: cost };
}

export async function logDeskSale(
  sql: Sql,
  data: { reservationId: string; offerId: string; qty: number },
) {
  const today = await todayIso(sql);
  const reservation = await reservationById(sql, data.reservationId, today);
  if (!reservation) throw new Error("Reservation not found.");
  const offer = await offerById(sql, data.offerId);
  if (!offer) throw new Error("Offer not found.");
  await takeInventory(sql, offer);
  const amount = computeAmount(offer, reservation, data.qty);
  const id = nid("ord");
  await sql`
    insert into orders (
      id, reservation_id, offer_id, qty, amount_cents, status, for_date, channel, paid_at, decided_at
    ) values (
      ${id}, ${reservation.id}, ${offer.id}, ${data.qty}, ${amount}, 'paid',
      ${forDateFor(offer, reservation)}, 'desk', now(), now()
    )
  `;
  return { id, amountCents: amount, holdout: reservation.holdout };
}

export type IngestInput = {
  bookingRef: string;
  source: string;
  guestName: string;
  arrival: string;
  departure: string;
  roomTypeId: string;
  guests: number;
  emailKind: EmailKind;
  phoneKind: PhoneKind;
};

/** `draw` is injectable for tests; production uses a uniform random draw. */
export async function ingestReservation(
  sql: Sql,
  data: IngestInput,
  draw = Math.random(),
  origin?: string,
) {
  if (data.departure <= data.arrival) throw new Error("Departure must be after arrival.");
  const rooms = await sql.query<{ id: string }>(`select id from room_types where id = $1`, [
    data.roomTypeId,
  ]);
  if (!rooms[0]) throw new Error("Unknown room type.");
  const dupes = await sql.query<{ n: number }>(
    `select count(*)::int as n from reservations where booking_ref = $1 and source = $2`,
    [data.bookingRef, data.source],
  );
  if (Number(dupes[0]?.n ?? 0) > 0) throw new Error(`${data.bookingRef} is already on the book.`);
  const property = await loadProperty(sql);
  const holdout = draw * 100 < property.economics.holdoutPct;
  // The stay link is the guest's key to their page, check-in and contact step:
  // 144 random bits, not derived from the name.
  const token = randomToken(18);
  const id = nid("res");
  await sql`
    insert into reservations (
      id, booking_ref, source, guest_name, arrival, departure,
      room_type_id, guests, token, email_kind, phone_kind, consent, holdout
    ) values (
      ${id}, ${data.bookingRef}, ${data.source}, ${data.guestName},
      ${data.arrival}, ${data.departure}, ${data.roomTypeId}, ${data.guests},
      ${token}, ${data.emailKind}, ${data.phoneKind}, 'transactional', ${holdout}
    )
  `;
  // Journey step 2: the booking email goes out automatically when the booking lands.
  let emailed: EmailMode | null = null;
  if (data.emailKind !== "none" && origin !== undefined) {
    const sent = await sendBookingEmail(sql, id, origin);
    emailed = sent.mode;
  }
  return { id, token, holdout, emailed };
}

/* ------------------------------------------------------- booking email */

/** Where stay links in emails point. A configured public URL wins over the caller's origin. */
export function publicOrigin(origin?: string) {
  const env = typeof process !== "undefined" ? process.env.PUBLIC_APP_URL : undefined;
  const base = (env && env.trim()) || (origin && origin.trim()) || "http://localhost:8080";
  return base.replace(/\/+$/, "");
}

export async function bookingEmail(sql: Sql, reservationId: string, origin?: string) {
  const today = await todayIso(sql);
  const property = await loadProperty(sql, today);
  const reservation = await reservationById(sql, reservationId, today);
  if (!reservation) throw new Error("Reservation not found.");
  const mode = emailModeFor(reservation);
  const offerRows = await sql.query<OfferRow>(
    `select ${OFFER_COLS} from offers where active = true order by sort_order`,
  );
  const eligible = offerRows.map(mapOffer).filter((o) => isEligible(o, reservation, today));
  const p = personalize(reservation, eligible, {
    today,
    city: property.city,
    standardRoomId: await standardRoomId(sql),
  });
  const picks = p.picks
    .map((x) => ({ offer: eligible.find((o) => o.id === x.offerId), reason: x.reason, score: x.score }))
    .filter((x): x is { offer: Offer; reason: string; score: number } => Boolean(x.offer));
  const stayUrl = `${publicOrigin(origin)}/stay/${reservation.token}`;
  const rendered = mode
    ? renderBookingEmail({
        property,
        reservation,
        picks,
        headline: p.headline,
        stayUrl,
        mode,
      })
    : null;
  const sent = await sql.query<{ sent_at: string | Date }>(
    `select sent_at from messages
     where reservation_id = $1 and recipe_id = 'rec_booking' and channel = 'email' and status = 'sent'
     order by sent_at desc limit 1`,
    [reservation.id],
  );
  return {
    property: { name: property.name, city: property.city },
    reservation,
    mode,
    modeLabel: mode ? EMAIL_MODE_LABEL[mode] : "No email address",
    recipient:
      reservation.emailKind === "masked"
        ? `${reservation.source} relay address`
        : reservation.emailKind === "real"
          ? "Guest's own email"
          : "None on file",
    signals: p.signals,
    picks: picks.map(({ offer, reason, score }) => ({
      offerId: offer.id,
      name: offer.name,
      reason,
      score,
      priceCents: offer.priceCents,
      priceUnit: offer.priceUnit,
    })),
    stayUrl,
    email: rendered,
    sentAt: sent[0] ? iso(sent[0].sent_at) : null,
  };
}

export async function sendBookingEmail(sql: Sql, reservationId: string, origin?: string) {
  const preview = await bookingEmail(sql, reservationId, origin);
  if (!preview.mode || !preview.email) throw new Error("No email address on this booking.");
  if (preview.sentAt) throw new Error("The booking email has already gone to this guest.");
  await sql`
    insert into messages (id, reservation_id, recipe_id, channel, subject, status, kind, cost_cents)
    values (
      ${nid("msg")}, ${reservationId}, 'rec_booking', 'email', ${preview.email.subject},
      'sent', ${`booking_${preview.mode}`}, 0
    )
  `;
  return { mode: preview.mode, subject: preview.email.subject };
}

export async function previewEmailParse(sql: Sql, text: string) {
  const parsed = parseReservationEmail(text);
  if ("error" in parsed) return parsed;
  const rooms = await sql<{ id: string; name: string }>`
    select id, name from room_types order by nightly_cents
  `;
  const hint = parsed.roomTypeHint.toLowerCase();
  const match =
    rooms.find((r) => hint.includes(r.name.toLowerCase().split(" ")[0] ?? "")) ??
    rooms.find((r) => r.name.toLowerCase().includes("standard")) ??
    rooms[0];
  return { ...parsed, roomTypeId: match?.id ?? "rt_standard" };
}

export async function roomTypes(sql: Sql) {
  return sql<{ id: string; name: string }>`
    select id, name from room_types order by nightly_cents
  `;
}

export async function messages(sql: Sql) {
  const rows = await sql<{
    id: string;
    guest_name: string;
    channel: string;
    subject: string;
    status: string;
    sent_at: Date | string;
    cost_cents: string | number;
    kind: string;
    token: string;
    reservation_id: string;
  }>`
    select m.id, r.guest_name, m.channel, m.subject, m.status, m.sent_at, m.cost_cents, m.kind, r.token, r.id as reservation_id
    from messages m
    join reservations r on r.id = m.reservation_id
    order by m.sent_at desc
    limit 20
  `;
  return rows.map((r) => ({
    id: r.id,
    guestName: r.guest_name,
    channel: r.channel,
    subject: r.subject,
    status: r.status,
    sentAt: iso(r.sent_at),
    costCents: Number(r.cost_cents),
    kind: r.kind,
    token: r.token,
    reservationId: r.reservation_id,
  }));
}

/* ---------------------------------------------------- hotel setup (phase A) */

/**
 * A new hotel starts with a small catalogue it can edit: two room types, the
 * common extras, and the lean recipe set. Ids carry the hotel id because offer
 * and room ids are global keys.
 */
export async function seedStarterCatalogue(sql: Sql, propertyId: string) {
  const k = (key: string) => `${key}-${propertyId}`.slice(0, 64);
  const std = k("rt_standard");
  const dlx = k("rt_deluxe");
  await sql`
    insert into room_types (id, name, nightly_cents, inventory) values
      (${std}, 'Standard Room', 16000, 20),
      (${dlx}, 'Deluxe Room', 21000, 8)
  `;
  const offers: [string, string, string, string, string, number, string, boolean, string | null, string | null][] = [
    ["off_upgrade", "Upgrade to Deluxe", "More space, better view", "Move up to a Deluxe room for the whole stay, subject to availability.", "upgrade", 4000, "night", false, std, dlx],
    ["off_breakfast", "Breakfast", "Served 7–10:30", "Full breakfast in the restaurant, per person per morning.", "breakfast", 2400, "person_night", true, null, null],
    ["off_early", "Early check-in", "Room ready at noon", "Your room from 12:00 instead of 15:00.", "early_checkin", 3500, "stay", false, null, null],
    ["off_late", "Late checkout", "Keep the room until 2 PM", "Stay in your room until 14:00 on departure day.", "late_checkout", 4000, "stay", false, null, null],
    ["off_parking", "Parking", "Covered, on site", "A covered space held for your car.", "parking", 2500, "night", true, null, null],
    ["off_transfer", "Airport transfer", "Driver meets you", "A driver meets you at arrivals and waits 45 minutes.", "transfer", 6500, "stay", true, null, null],
  ];
  let order = 1;
  for (const [key, name, short, desc, category, cents, unit, auto, from, to] of offers) {
    await sql`
      insert into offers (
        id, name, short_label, description, category, price_cents, price_unit,
        auto_approve, from_room_type_id, to_room_type_id, sort_order
      ) values (
        ${k(key)}, ${name}, ${short}, ${desc}, ${category}, ${cents}, ${unit},
        ${auto}, ${from}, ${to}, ${order}
      )
    `;
    order += 1;
  }
  const recipes: [string, string, string, string, number, boolean][] = [
    ["rec_booking", "New booking", "Message: confirmation + check-in link (service). Page leads with the personalised picks.", "booking_created", 0, true],
    ["rec_prearrival", "3 days before arrival", "Message: arrival details (service). Page leads with breakfast and transfer.", "pre_arrival", -72, true],
    ["rec_checkin", "Online check-in", "No message. The check-in step asks about celebrations and the guest's own contact.", "checkin", 0, false],
    ["rec_depart", "Night before departure", "No message. Page leads with late checkout.", "pre_departure", -12, false],
  ];
  order = 1;
  for (const [key, name, summary, trigger, offset, sends] of recipes) {
    await sql`
      insert into recipes (id, name, summary, trigger_event, offset_hours, offer_ids, active, sends_message, sort_order)
      values (${k(key)}, ${name}, ${summary}, ${trigger}, ${offset}, '', true, ${sends}, ${order})
    `;
    order += 1;
  }
  return { roomTypes: 2, offers: offers.length, recipes: recipes.length };
}

export type SettingsUpdate = {
  name: string;
  city: string;
  market: MarketId;
  timezone: string;
  rooms: number;
  senderEmail: string | null;
  serviceRetentionDays: number;
  captureLaunchedOn: string | null;
};

export async function updateSettings(sql: Sql, data: SettingsUpdate) {
  await sql`
    update properties set
      name = ${data.name.trim()},
      city = ${data.city.trim()},
      market = ${data.market},
      timezone = ${data.timezone.trim()},
      rooms = ${data.rooms},
      sender_email = ${data.senderEmail?.trim() || null},
      service_retention_days = ${data.serviceRetentionDays},
      capture_launched_on = ${data.captureLaunchedOn}
    where id = current_setting('app.property_id', true)
  `;
  return { ok: true as const };
}

/* -------------------------------------------------- overview extras (coral desk) */

export type SeriesBucket = {
  bucket: string;
  label: string;
  bookings: number;
  bought: number;
  revenueCents: number;
};

export type SegmentRow = { bookings: number; cents: number };

export type OpenOfferGuest = {
  reservationId: string;
  guestName: string;
  token: string;
  arrival: string;
  nights: number;
  guests: number;
  offers: { id: string; name: string; cents: number }[];
};

export type OverviewExtras = {
  /** attach rate + revenue by arrival week/month (treatment bookings since launch) */
  series: { weekly: SeriesBucket[]; monthly: SeriesBucket[] };
  /** page revenue, last 7 days vs the 7 before */
  weekly: { thisWeekCents: number; prevWeekCents: number };
  /** paid revenue split by where the guest bought */
  channel: { guestPageCents: number; deskCents: number; guestPageOrders: number; deskOrders: number };
  /** where page views came from, for the funnel annotations */
  viewSources: { source: string; n: number }[];
  /** unclaimed personalised picks for the live book (not departed, not holdout) */
  openOffers: { totalCents: number; guestCount: number; expiringCount: number; guests: OpenOfferGuest[] };
  /** when guests buy, relative to arrival (paid page orders) */
  histogram: { label: string; n: number }[];
  attention: { pendingCount: number; expiringCount: number; expiringCents: number; bouncedCount: number };
  topOffers: { name: string; cents: number; n: number }[];
  segments: { celebrating: SegmentRow; plain: SegmentRow };
};

const HISTOGRAM_BUCKETS = [
  { key: "a", label: "14+ days out" },
  { key: "b", label: "8–13 days" },
  { key: "c", label: "4–7 days" },
  { key: "d", label: "1–3 days" },
  { key: "e", label: "In stay" },
] as const;

function bucketLabel(bucket: string, granularity: "week" | "month") {
  const d = new Date(`${bucket}T00:00:00Z`);
  const month = d.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
  return granularity === "month" ? month : `${month} ${d.getUTCDate()}`;
}

async function bookedSeries(sql: Sql, launched: string, granularity: "week" | "month") {
  const rows = await sql.query<{ bucket: string; bookings: number; bought: number; cents: number }>(
    `with b as (
       select r.id, r.arrival,
         exists (select 1 from orders o where o.reservation_id = r.id
                 and o.channel = 'guest_page' and o.status in ${PAID}) as bought,
         coalesce((select sum(o.amount_cents) from orders o where o.reservation_id = r.id
                   and o.channel = 'guest_page' and o.status in ${PAID}), 0) as cents
       from reservations r
       where r.property_id = ${CURRENT_PROPERTY} and not r.holdout and r.arrival >= $1::date
     )
     select to_char(date_trunc($2::text, arrival), 'YYYY-MM-DD') as bucket,
       count(*)::int as bookings,
       count(*) filter (where bought)::int as bought,
       coalesce(sum(cents), 0)::int as cents
     from b
     group by 1
     order by 1`,
    [launched, granularity],
  );
  return rows.map((r) => ({
    bucket: r.bucket,
    label: bucketLabel(r.bucket, granularity),
    bookings: Number(r.bookings),
    bought: Number(r.bought),
    revenueCents: Number(r.cents),
  }));
}

/**
 * Read-only aggregates behind the coral Overview. Every number derives from the
 * same tables as dashboard()/analytics() — nothing new is captured, nothing is
 * simulated.
 */
export async function overviewExtras(sql: Sql): Promise<OverviewExtras> {
  const today = await todayIso(sql);
  const property = await loadProperty(sql, today);
  const launched = property.economics.launchedOn;
  const standardId = await standardRoomId(sql);

  const [weekly, monthly, weekRows, channelRows, sourceRows, histoRows, bounceRows, topRows, segmentRows, liveRows, offerRows, orderRows, checkRows, pendingRows] =
    await Promise.all([
      bookedSeries(sql, launched, "week"),
      bookedSeries(sql, launched, "month"),
      sql.query<{ this_week: number; prev_week: number }>(
        `select
           coalesce(sum(o.amount_cents) filter (where o.paid_at >= now() - interval '7 days'), 0)::int as this_week,
           coalesce(sum(o.amount_cents) filter (where o.paid_at >= now() - interval '14 days'
             and o.paid_at < now() - interval '7 days'), 0)::int as prev_week
         from orders o join reservations r on r.id = o.reservation_id
         where o.status in ${PAID} and o.channel = 'guest_page'
           and not r.holdout and r.arrival >= $1::date`,
        [launched],
      ),
      sql.query<{ channel: string; cents: number; n: number }>(
        `select o.channel, coalesce(sum(o.amount_cents), 0)::int as cents, count(*)::int as n
         ${ORDER_FROM}
         where o.status in ${PAID} and not r.holdout and r.arrival >= $1::date
         group by o.channel`,
        [launched],
      ),
      sql.query<{ s: string; n: number }>(
        `select coalesce(e.source, 'other') as s, count(*)::int as n
         from events e join reservations r on r.id = e.reservation_id
         where e.kind = 'view' and not r.holdout and r.arrival >= $1::date
         group by 1 order by n desc`,
        [launched],
      ),
      sql.query<{ k: string; n: number }>(
        `with paid as (
           select (r.arrival - o.paid_at::date) as lead
           from orders o join reservations r on r.id = o.reservation_id
           where o.status in ${PAID} and o.channel = 'guest_page' and o.paid_at is not null
             and not r.holdout and r.arrival >= $1::date
         )
         select case when lead >= 14 then 'a' when lead >= 8 then 'b' when lead >= 4 then 'c'
                     when lead >= 1 then 'd' else 'e' end as k,
           count(*)::int as n
         from paid
         group by k`,
        [launched],
      ),
      sql.query<{ n: number }>(
        `select count(*)::int as n
         from messages m join reservations r on r.id = m.reservation_id
         where m.status = 'bounced' and r.arrival >= $1::date`,
        [launched],
      ),
      sql.query<{ name: string; cents: number; n: number }>(
        `select f.name, sum(o.amount_cents)::int as cents, count(*)::int as n
         ${ORDER_FROM}
         where o.status in ${PAID} and o.channel = 'guest_page'
           and not r.holdout and r.arrival >= $1::date
         group by f.name order by cents desc limit 4`,
        [launched],
      ),
      sql.query<{ celebrating: boolean; bookings: number; cents: number }>(
        `select (c.celebration is not null) as celebrating,
           count(distinct r.id)::int as bookings,
           coalesce(sum(px.cents), 0)::int as cents
         from reservations r
         left join checkins c on c.reservation_id = r.id
         left join lateral (
           select sum(o.amount_cents) as cents from orders o
           where o.reservation_id = r.id and o.channel = 'guest_page' and o.status in ${PAID}
         ) px on true
         where not r.holdout and r.arrival >= $1::date
         group by 1`,
        [launched],
      ),
      sql.query<ResRow>(
        `select ${RES_COLS} from reservations r join room_types rt on rt.id = r.room_type_id
         where r.arrival >= CURRENT_DATE - 21 and r.departure >= CURRENT_DATE
         order by r.arrival, r.guest_name`,
      ),
      sql.query<OfferRow>(`select ${OFFER_COLS} from offers where active = true order by sort_order`),
      sql.query<{ reservation_id: string; offer_id: string }>(
        `select reservation_id, offer_id from orders
         where status in ('pending_approval','paid','fulfilled')`,
      ),
      sql.query<{ reservation_id: string; celebration: string }>(
        `select reservation_id, celebration from checkins where celebration is not null`,
      ),
      pendingCount(sql),
    ]);

  const channel = { guestPageCents: 0, deskCents: 0, guestPageOrders: 0, deskOrders: 0 };
  for (const row of channelRows) {
    if (row.channel === "desk") {
      channel.deskCents = Number(row.cents);
      channel.deskOrders = Number(row.n);
    } else {
      channel.guestPageCents = Number(row.cents);
      channel.guestPageOrders = Number(row.n);
    }
  }

  const viewSources = sourceRows.map((r) => ({
    source: r.s === "email" ? "email" : r.s === "whatsapp" ? "whatsapp" : r.s === "sms" ? "sms" : "direct",
    n: Number(r.n),
  }));

  const histoMap = new Map(histoRows.map((r) => [r.k, Number(r.n)]));
  const histogram = HISTOGRAM_BUCKETS.map((b) => ({ label: b.label, n: histoMap.get(b.key) ?? 0 }));

  const segments = { celebrating: { bookings: 0, cents: 0 }, plain: { bookings: 0, cents: 0 } };
  for (const row of segmentRows) {
    const target = row.celebrating ? segments.celebrating : segments.plain;
    target.bookings = Number(row.bookings);
    target.cents = Number(row.cents);
  }

  const boughtByReservation = new Map<string, Set<string>>();
  for (const o of orderRows) {
    let set = boughtByReservation.get(o.reservation_id);
    if (!set) boughtByReservation.set(o.reservation_id, (set = new Set<string>()));
    set.add(o.offer_id);
  }
  const celebrationByReservation = new Map(
    checkRows.map((c) => [c.reservation_id, c.celebration] as const),
  );
  const activeOffers = offerRows.map(mapOffer);

  const guests: OpenOfferGuest[] = [];
  let totalCents = 0;
  let expiringCount = 0;
  let expiringCents = 0;
  for (const row of liveRows) {
    const res = mapReservation(row, today);
    if (res.status === "departed" || res.holdout) continue;
    const bought = boughtByReservation.get(res.id) ?? new Set<string>();
    const available = activeOffers.filter((o) => isEligible(o, res, today) && !bought.has(o.id));
    if (available.length === 0) continue;
    const celebration = celebrationByReservation.get(res.id);
    const p = personalize(
      celebration ? { ...res, notes: `${res.notes} ${celebration}` } : res,
      available,
      { today, city: property.city, standardRoomId: standardId },
    );
    const ranked = [...p.picks.map((x) => x.offerId), ...p.restIds]
      .map((id) => available.find((o) => o.id === id))
      .filter((o): o is Offer => Boolean(o));
    const priced = ranked.map((o) => ({
      id: o.id,
      name: o.name,
      cents: computeAmount(o, res, isNightly(o) ? res.nights : 1),
    }));
    const resCents = priced.reduce((s, o) => s + o.cents, 0);
    totalCents += resCents;
    const daysOut = daysBetween(today, res.arrival);
    if (daysOut >= 0 && daysOut <= 3) {
      expiringCount += priced.length;
      expiringCents += resCents;
    }
    guests.push({
      reservationId: res.id,
      guestName: res.guestName,
      token: res.token,
      arrival: res.arrival,
      nights: res.nights,
      guests: res.guests,
      offers: priced,
    });
  }
  guests.sort((a, b) => a.arrival.localeCompare(b.arrival) || a.guestName.localeCompare(b.guestName));

  return {
    series: { weekly, monthly },
    weekly: {
      thisWeekCents: Number(weekRows[0]?.this_week ?? 0),
      prevWeekCents: Number(weekRows[0]?.prev_week ?? 0),
    },
    channel,
    viewSources,
    openOffers: { totalCents, guestCount: guests.length, expiringCount, guests },
    histogram,
    attention: {
      pendingCount: pendingRows,
      expiringCount,
      expiringCents,
      bouncedCount: Number(bounceRows[0]?.n ?? 0),
    },
    topOffers: topRows.map((r) => ({ name: r.name, cents: Number(r.cents), n: Number(r.n) })),
    segments,
  };
}
