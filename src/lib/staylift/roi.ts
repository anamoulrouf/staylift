/**
 * Staylift ROI engine — the single source of truth for every ROI number the
 * product shows (landing teaser, /roi calculator, measured ROI in the desk).
 *
 * Pure functions, no imports, safe on server and client. Units:
 *   - money in US dollars (floats), rounded only at display time
 *   - every *Pct input is a percentage (5 means 5%), every result ratio is a
 *     fraction (0.05 means 5%) — the suffix tells you which
 *   - "booking" is the unit of the funnel, not the room-night
 *
 * Definitions (they are what the UI labels mean):
 *   bookings       = rooms × occupancy × 365 ÷ average stay
 *   reachable      = bookings with a usable channel (OTA relay, real email, valid phone)
 *   viewers        = reachable bookings that open the stay page
 *   buyers         = viewers who buy at least one offer
 *   gross upsell   = buyers × average spend per buying booking
 *   incremental    = gross × incrementality (the share a holdout says would NOT
 *                    have happened anyway — desk sales, walk-ins, phone)
 *   hotel net      = incremental × contribution margin − platform fees − card fees
 *
 * Deliberately conservative: platform share and card fees are charged on ALL
 * page revenue (including the non-incremental part), and margin is applied
 * before fees.
 */

export type PlanId = "A" | "B" | "C" | "custom";

export type Plan = {
  id: PlanId;
  name: string;
  perRoomMonthly: number;
  baseMonthly: number;
  revSharePct: number;
  note: string;
};

export const PLANS: Record<Exclude<PlanId, "custom">, Plan> = {
  A: {
    id: "A",
    name: "Plan A · Hybrid",
    perRoomMonthly: 1,
    baseMonthly: 0,
    revSharePct: 7,
    note: "$1/room/month + 7% of upsell revenue. Lead hypothesis: fee scales with results.",
  },
  B: {
    id: "B",
    name: "Plan B · Subscription",
    perRoomMonthly: 4,
    baseMonthly: 0,
    revSharePct: 0,
    note: "$4/room/month flat. Hotel keeps 100% of upsell revenue.",
  },
  C: {
    id: "C",
    name: "Plan C · Revenue share",
    perRoomMonthly: 0,
    baseMonthly: 0,
    revSharePct: 10,
    note: "10% of upsell revenue, no subscription.",
  },
};

export function customPlan(perRoomMonthly: number, baseMonthly: number, revSharePct: number): Plan {
  return {
    id: "custom",
    name: "Custom plan",
    perRoomMonthly,
    baseMonthly,
    revSharePct,
    note: "Your own mix of per-room, base and revenue-share fees.",
  };
}

export type HotelInputs = {
  rooms: number;
  occupancyPct: number;
  avgStayNights: number;
  reachablePct: number;
  viewPct: number;
  buyPct: number;
  avgSpend: number;
  ordersPerBuyer: number;
  marginPct: number;
  incrementalityPct: number;
  cardPct: number;
  cardFixed: number;
};

export type ScenarioId = "conservative" | "base" | "upside";

/** Funnel assumptions that differ between scenarios. Everything else is the hotel's. */
export const SCENARIOS: Record<
  ScenarioId,
  { label: string; viewPct: number; buyPct: number; avgSpend: number; blurb: string }
> = {
  conservative: {
    label: "Conservative",
    viewPct: 50,
    buyPct: 10,
    avgSpend: 35,
    blurb: "5% of reachable bookings buy, $35 average spend.",
  },
  base: {
    label: "Base",
    viewPct: 50,
    buyPct: 16,
    avgSpend: 45,
    blurb: "8% of reachable bookings buy, $45 average spend.",
  },
  upside: {
    label: "Upside",
    viewPct: 50,
    buyPct: 20,
    avgSpend: 60,
    blurb: "10% buy, $60 average spend — upgrade-led.",
  },
};

/** The worked example from the plan: an 80-room independent at 50% occupancy. */
export const DEFAULT_INPUTS: HotelInputs = {
  rooms: 80,
  occupancyPct: 50,
  avgStayNights: 2,
  reachablePct: 70,
  viewPct: SCENARIOS.base.viewPct,
  buyPct: SCENARIOS.base.buyPct,
  avgSpend: SCENARIOS.base.avgSpend,
  ordersPerBuyer: 1.2,
  marginPct: 60,
  incrementalityPct: 70,
  cardPct: 3.5,
  cardFixed: 0,
};

/** Hard bounds the UI and URL parser clamp to, so a typo can't produce nonsense. */
export const INPUT_BOUNDS: Record<keyof HotelInputs, { min: number; max: number; step: number }> = {
  rooms: { min: 5, max: 400, step: 1 },
  occupancyPct: { min: 10, max: 100, step: 1 },
  avgStayNights: { min: 1, max: 14, step: 0.1 },
  reachablePct: { min: 0, max: 100, step: 1 },
  viewPct: { min: 0, max: 100, step: 1 },
  buyPct: { min: 0, max: 100, step: 0.5 },
  avgSpend: { min: 0, max: 500, step: 1 },
  ordersPerBuyer: { min: 1, max: 5, step: 0.1 },
  marginPct: { min: 0, max: 100, step: 1 },
  incrementalityPct: { min: 0, max: 100, step: 1 },
  cardPct: { min: 0, max: 10, step: 0.1 },
  cardFixed: { min: 0, max: 2, step: 0.05 },
};

export function clampInputs(raw: Partial<Record<keyof HotelInputs, unknown>>): HotelInputs {
  const out = { ...DEFAULT_INPUTS };
  for (const key of Object.keys(INPUT_BOUNDS) as (keyof HotelInputs)[]) {
    const value = Number(raw[key]);
    if (raw[key] === undefined || raw[key] === null || raw[key] === "" || !Number.isFinite(value)) {
      continue;
    }
    const { min, max } = INPUT_BOUNDS[key];
    out[key] = Math.min(max, Math.max(min, value));
  }
  return out;
}

export type HotelResult = {
  bookings: number;
  occupiedNights: number;
  reachable: number;
  viewers: number;
  buyers: number;
  orders: number;
  /** buyers ÷ reachable bookings — the number most plans quote as "conversion". */
  conversionOfReachable: number;
  /** buyers ÷ all bookings. */
  attachRate: number;
  gross: number;
  incrementalRevenue: number;
  baselineRevenue: number;
  incrementalContribution: number;
  subscriptionFees: number;
  shareFees: number;
  platformFees: number;
  cardFees: number;
  totalCost: number;
  hotelNet: number;
  /** hotelNet ÷ totalCost. */
  roi: number;
  /** incremental contribution per $1 of fees (the "2:1" in the pricing rule). */
  returnPerDollar: number;
  grossPerBooking: number;
  netPerBooking: number;
  /** platform fees as a share of gross upsell revenue. */
  effectiveTakeRate: number;
  breakEven: BreakEven | null;
  guarantee: Guarantee;
};

export type BreakEven = {
  buyers: number;
  /** buyers ÷ reachable at which hotel net = 0. */
  conversionOfReachable: number;
  /** the same point expressed as the "buy %" input (buyers ÷ viewers). */
  buyPct: number;
};

export type Guarantee = {
  lift: number;
  threshold: number;
  passes: boolean;
};

const safeDiv = (a: number, b: number) => (b === 0 ? 0 : a / b);

export function annualBookings(i: Pick<HotelInputs, "rooms" | "occupancyPct" | "avgStayNights">) {
  return safeDiv(i.rooms * (i.occupancyPct / 100) * 365, i.avgStayNights);
}

export function platformFeesFor(plan: Plan, rooms: number, gross: number, months = 12) {
  const subscription = (plan.perRoomMonthly * rooms + plan.baseMonthly) * months;
  const share = gross * (plan.revSharePct / 100);
  return { subscription, share, total: subscription + share };
}

export function computeHotel(input: HotelInputs, plan: Plan): HotelResult {
  const bookings = annualBookings(input);
  const occupiedNights = input.rooms * (input.occupancyPct / 100) * 365;
  const reachable = bookings * (input.reachablePct / 100);
  const viewers = reachable * (input.viewPct / 100);
  const buyers = viewers * (input.buyPct / 100);
  const orders = buyers * input.ordersPerBuyer;

  const gross = buyers * input.avgSpend;
  const incrementalRevenue = gross * (input.incrementalityPct / 100);
  const baselineRevenue = gross - incrementalRevenue;
  const incrementalContribution = incrementalRevenue * (input.marginPct / 100);

  const fees = platformFeesFor(plan, input.rooms, gross);
  const cardFees = gross * (input.cardPct / 100) + orders * input.cardFixed;
  const totalCost = fees.total + cardFees;
  const hotelNet = incrementalContribution - totalCost;

  return {
    bookings,
    occupiedNights,
    reachable,
    viewers,
    buyers,
    orders,
    conversionOfReachable: safeDiv(buyers, reachable),
    attachRate: safeDiv(buyers, bookings),
    gross,
    incrementalRevenue,
    baselineRevenue,
    incrementalContribution,
    subscriptionFees: fees.subscription,
    shareFees: fees.share,
    platformFees: fees.total,
    cardFees,
    totalCost,
    hotelNet,
    roi: safeDiv(hotelNet, totalCost),
    returnPerDollar: safeDiv(incrementalContribution, totalCost),
    grossPerBooking: safeDiv(gross, bookings),
    netPerBooking: safeDiv(hotelNet, bookings),
    effectiveTakeRate: safeDiv(fees.total, gross),
    breakEven: breakEven(input, plan, reachable, viewers),
    guarantee: {
      lift: incrementalRevenue,
      threshold: 2 * fees.total,
      passes: incrementalRevenue >= 2 * fees.total,
    },
  };
}

/**
 * Hotel net is linear in buyers B:
 *   net(B) = B × [S × (m × i − r − p) − f × k] − F
 * where S = spend, m = margin, i = incrementality, r = revenue share,
 * p = card %, f = card fixed fee, k = orders per buyer, F = fixed fees/year.
 */
function breakEven(input: HotelInputs, plan: Plan, reachable: number, viewers: number): BreakEven | null {
  const perBuyer =
    input.avgSpend *
      ((input.marginPct / 100) * (input.incrementalityPct / 100) -
        plan.revSharePct / 100 -
        input.cardPct / 100) -
    input.cardFixed * input.ordersPerBuyer;
  const fixed = (plan.perRoomMonthly * input.rooms + plan.baseMonthly) * 12;
  if (perBuyer <= 0) return null;
  const buyers = fixed / perBuyer;
  if (reachable <= 0 || viewers <= 0) return null;
  return {
    buyers,
    conversionOfReachable: buyers / reachable,
    buyPct: (buyers / viewers) * 100,
  };
}

export function withScenario(input: HotelInputs, id: ScenarioId): HotelInputs {
  const s = SCENARIOS[id];
  return { ...input, viewPct: s.viewPct, buyPct: s.buyPct, avgSpend: s.avgSpend };
}

/** Which scenario (if any) the funnel inputs currently match exactly. */
export function matchScenario(input: HotelInputs): ScenarioId | null {
  for (const id of Object.keys(SCENARIOS) as ScenarioId[]) {
    const s = SCENARIOS[id];
    if (input.viewPct === s.viewPct && input.buyPct === s.buyPct && input.avgSpend === s.avgSpend) {
      return id;
    }
  }
  return null;
}

/**
 * The pricing rule from the plan: a price is acceptable only if the hotel nets
 * a positive return in the conservative case AND gets at least $2 of
 * incremental margin per $1 of fees in the base case.
 */
export function pricingRule(input: HotelInputs, plan: Plan) {
  const conservative = computeHotel(withScenario(input, "conservative"), plan);
  const base = computeHotel(withScenario(input, "base"), plan);
  const conservativeOk = conservative.hotelNet > 0;
  const baseOk = base.returnPerDollar >= 2;
  return { conservative, base, conservativeOk, baseOk, passes: conservativeOk && baseOk };
}

/** Hotel net across buyer conversion (of reachable), for the sensitivity chart. */
export function netCurve(input: HotelInputs, plan: Plan, maxConversion = 0.15, steps = 60) {
  const points: { conversion: number; net: number }[] = [];
  for (let s = 0; s <= steps; s += 1) {
    const conversion = (maxConversion * s) / steps;
    const buyPct = input.viewPct > 0 ? (conversion / (input.viewPct / 100)) * 100 : 0;
    const r = computeHotel({ ...input, buyPct }, plan);
    points.push({ conversion, net: r.hotelNet });
  }
  return points;
}

/* ------------------------------------------------------------------------ */
/* Operator (Staylift) unit economics                                        */
/* ------------------------------------------------------------------------ */

export type MarketId = "US" | "UK" | "DE" | "NL";
export type MessageCategory = "utility" | "marketing";

/**
 * Meta WhatsApp per-delivered-message rates (USD) we could verify for 2026.
 * null = no verified figure; the UI asks for a custom rate instead of guessing.
 * Meta revises rate cards quarterly — re-check before quoting.
 * From 1 Oct 2026 utility templates and free-form replies inside the 24-hour
 * service window are billed too, so every phone message has a cost.
 */
export const MESSAGE_RATES: Record<MarketId, { label: string; utility: number | null; marketing: number | null }> = {
  US: { label: "United States", utility: 0.004, marketing: 0.025 },
  UK: { label: "United Kingdom", utility: 0.0171, marketing: 0.0592 },
  DE: { label: "Germany", utility: 0.055, marketing: null },
  NL: { label: "Netherlands", utility: null, marketing: 0.1597 },
};

export type OperatorInputs = {
  market: MarketId;
  category: MessageCategory;
  /** used when the market/category has no verified rate */
  customRate: number;
  bspPerMessage: number;
  /** share of reachable bookings contacted by WhatsApp/SMS rather than email */
  phoneSharePct: number;
  /** template messages per phone-reachable booking (lean design caps this at 2) */
  messagesPerBooking: number;
  /** staff replies per phone-reachable booking, billed at the utility rate */
  repliesPerBooking: number;
  supportPerHotelYear: number;
  churnMonthlyPct: number;
  cac: number;
  hotels: number;
};

export const DEFAULT_OPERATOR: OperatorInputs = {
  market: "US",
  category: "utility",
  customRate: 0.05,
  bspPerMessage: 0.005,
  phoneSharePct: 95,
  messagesPerBooking: 1.5,
  repliesPerBooking: 0.3,
  supportPerHotelYear: 200,
  churnMonthlyPct: 2,
  cac: 750,
  hotels: 100,
};

export function messageRate(op: OperatorInputs, category: MessageCategory = op.category) {
  const preset = MESSAGE_RATES[op.market][category];
  return { rate: preset ?? op.customRate, verified: preset !== null };
}

export type OperatorResult = {
  vendorRevenue: number;
  templateMessages: number;
  replyMessages: number;
  messagingCost: number;
  messagingPerBooking: number;
  supportCost: number;
  grossProfit: number;
  grossMargin: number;
  monthlyGrossProfit: number;
  ltv: number;
  cacPaybackMonths: number | null;
  ltvToCac: number;
  portfolioArr: number;
  portfolioGrossProfit: number;
  rateUsed: number;
  rateVerified: boolean;
};

export function computeOperator(hotel: HotelResult, op: OperatorInputs): OperatorResult {
  const phoneReachable = hotel.reachable * (op.phoneSharePct / 100);
  const templateMessages = phoneReachable * op.messagesPerBooking;
  const replyMessages = phoneReachable * op.repliesPerBooking;
  const template = messageRate(op);
  const utility = messageRate(op, "utility");
  const messagingCost =
    templateMessages * (template.rate + op.bspPerMessage) +
    replyMessages * (utility.rate + op.bspPerMessage);
  const vendorRevenue = hotel.platformFees;
  const grossProfit = vendorRevenue - messagingCost - op.supportPerHotelYear;
  const monthlyGrossProfit = grossProfit / 12;
  const churn = op.churnMonthlyPct / 100;
  const ltv = churn > 0 ? monthlyGrossProfit / churn : 0;
  return {
    vendorRevenue,
    templateMessages,
    replyMessages,
    messagingCost,
    messagingPerBooking: safeDiv(messagingCost, hotel.bookings),
    supportCost: op.supportPerHotelYear,
    grossProfit,
    grossMargin: safeDiv(grossProfit, vendorRevenue),
    monthlyGrossProfit,
    ltv,
    cacPaybackMonths: monthlyGrossProfit > 0 ? op.cac / monthlyGrossProfit : null,
    ltvToCac: safeDiv(ltv, op.cac),
    portfolioArr: vendorRevenue * op.hotels,
    portfolioGrossProfit: grossProfit * op.hotels,
    rateUsed: template.rate,
    rateVerified: template.verified && utility.verified,
  };
}

/* ------------------------------------------------------------------------ */
/* Measured lift (holdout)                                                   */
/* ------------------------------------------------------------------------ */

export type Evidence = "too_few" | "directional" | "solid";

export type Lift = {
  nTreatment: number;
  nHoldout: number;
  meanTreatment: number;
  meanHoldout: number;
  /** extra revenue per booking caused by Staylift (treatment − holdout means) */
  liftPerBooking: number;
  standardError: number;
  ci95: [number, number];
  evidence: Evidence;
};

function meanVar(values: number[]) {
  const n = values.length;
  if (n === 0) return { mean: 0, variance: 0 };
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = n > 1 ? values.reduce((a, v) => a + (v - mean) ** 2, 0) / (n - 1) : 0;
  return { mean, variance };
}

/**
 * Difference in mean ancillary revenue per completed stay, treatment vs
 * holdout, with a Welch 95% interval. Per-booking revenue is very skewed
 * (most bookings buy nothing), so the interval is wide until the holdout has
 * a few hundred stays — that is the point of showing it.
 */
export function measureLift(treatment: number[], holdout: number[]): Lift {
  const t = meanVar(treatment);
  const h = meanVar(holdout);
  const nT = treatment.length;
  const nH = holdout.length;
  const se = Math.sqrt(safeDiv(t.variance, nT) + safeDiv(h.variance, nH));
  const lift = t.mean - h.mean;
  const evidence: Evidence = nH < 50 || nT < 50 ? "too_few" : nH < 300 ? "directional" : "solid";
  return {
    nTreatment: nT,
    nHoldout: nH,
    meanTreatment: t.mean,
    meanHoldout: h.mean,
    liftPerBooking: lift,
    standardError: se,
    ci95: [lift - 1.96 * se, lift + 1.96 * se],
    evidence,
  };
}

export type MeasuredInputs = {
  lift: Lift;
  /** revenue sold through the stay page to treatment guests (completed stays) */
  pageRevenue: number;
  pageOrders: number;
  rooms: number;
  months: number;
  plan: Plan;
  marginPct: number;
  cardPct: number;
  cardFixed: number;
};

export function measuredEconomics(m: MeasuredInputs) {
  const incrementalRevenue = Math.max(0, m.lift.liftPerBooking) * m.lift.nTreatment;
  const incrementalLow = Math.max(0, m.lift.ci95[0]) * m.lift.nTreatment;
  const incrementalHigh = Math.max(0, m.lift.ci95[1]) * m.lift.nTreatment;
  const fees = platformFeesFor(m.plan, m.rooms, m.pageRevenue, m.months);
  const cardFees = m.pageRevenue * (m.cardPct / 100) + m.pageOrders * m.cardFixed;
  const cost = fees.total + cardFees;
  const margin = m.marginPct / 100;
  const net = incrementalRevenue * margin - cost;
  return {
    incrementalRevenue,
    incrementalLow,
    incrementalHigh,
    /** share of page revenue the holdout says is truly incremental */
    incrementality: Math.min(1, safeDiv(incrementalRevenue, m.pageRevenue)),
    platformFees: fees.total,
    subscriptionFees: fees.subscription,
    shareFees: fees.share,
    cardFees,
    cost,
    hotelNet: net,
    netLow: incrementalLow * margin - cost,
    netHigh: incrementalHigh * margin - cost,
    roi: safeDiv(net, cost),
    guarantee: {
      lift: incrementalRevenue,
      threshold: 2 * fees.total,
      passes: incrementalRevenue >= 2 * fees.total,
    },
  };
}
