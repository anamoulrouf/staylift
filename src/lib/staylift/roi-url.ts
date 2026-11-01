/**
 * Calculator state <-> short URL query keys, so a model can be shared as a link
 * ("here is your hotel at 8% conversion on plan A"). Only values that differ
 * from the defaults are written; anything unreadable falls back to defaults.
 */
import {
  DEFAULT_INPUTS,
  DEFAULT_OPERATOR,
  INPUT_BOUNDS,
  MESSAGE_RATES,
  PLANS,
  clampInputs,
  customPlan,
  type HotelInputs,
  type MarketId,
  type OperatorInputs,
  type Plan,
  type PlanId,
} from "./roi.ts";

export type CalculatorTab = "hotel" | "operator";

export type CalculatorState = {
  inputs: HotelInputs;
  plan: Plan;
  operator: OperatorInputs;
  tab: CalculatorTab;
};

const INPUT_KEYS: Record<keyof HotelInputs, string> = {
  rooms: "rooms",
  occupancyPct: "occ",
  avgStayNights: "stay",
  reachablePct: "reach",
  viewPct: "view",
  buyPct: "buy",
  avgSpend: "spend",
  ordersPerBuyer: "opb",
  marginPct: "margin",
  incrementalityPct: "incr",
  cardPct: "card",
  cardFixed: "cardfix",
};

const OP_KEYS = {
  phoneSharePct: "phone",
  messagesPerBooking: "msgs",
  repliesPerBooking: "replies",
  customRate: "rate",
  bspPerMessage: "bsp",
  supportPerHotelYear: "support",
  churnMonthlyPct: "churn",
  cac: "cac",
  hotels: "hotels",
} as const satisfies Partial<Record<keyof OperatorInputs, string>>;

export const DEFAULT_STATE: CalculatorState = {
  inputs: DEFAULT_INPUTS,
  plan: PLANS.A,
  operator: DEFAULT_OPERATOR,
  tab: "hotel",
};

function num(v: unknown): number | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function decodeState(search: Record<string, unknown>): CalculatorState {
  const raw: Partial<Record<keyof HotelInputs, unknown>> = {};
  for (const [field, key] of Object.entries(INPUT_KEYS) as [keyof HotelInputs, string][]) {
    raw[field] = search[key];
  }
  const inputs = clampInputs(raw);

  const planId = String(search.plan ?? "A") as PlanId;
  let plan: Plan = PLANS.A;
  if (planId === "B" || planId === "C") plan = PLANS[planId];
  if (planId === "custom") {
    plan = customPlan(
      clamp(num(search.prr) ?? 1, 0, 50),
      clamp(num(search.pbase) ?? 0, 0, 5000),
      clamp(num(search.pshare) ?? 7, 0, 50),
    );
  }

  const operator: OperatorInputs = { ...DEFAULT_OPERATOR };
  const market = String(search.mkt ?? "");
  if (market in MESSAGE_RATES) operator.market = market as MarketId;
  if (search.cat === "marketing") operator.category = "marketing";
  for (const [field, key] of Object.entries(OP_KEYS) as [keyof typeof OP_KEYS, string][]) {
    const v = num(search[key]);
    if (v !== undefined && v >= 0) operator[field] = v;
  }
  operator.phoneSharePct = clamp(operator.phoneSharePct, 0, 100);
  operator.messagesPerBooking = clamp(operator.messagesPerBooking, 0, 10);
  operator.churnMonthlyPct = clamp(operator.churnMonthlyPct, 0, 50);

  return { inputs, plan, operator, tab: search.tab === "operator" ? "operator" : "hotel" };
}

/** Rounds to the input's step so URLs stay short and stable. */
function tidy(field: keyof HotelInputs, value: number) {
  const step = INPUT_BOUNDS[field].step;
  const decimals = step < 1 ? String(step).split(".")[1]?.length ?? 2 : 0;
  return Number(value.toFixed(decimals));
}

export function encodeState(state: CalculatorState): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [field, key] of Object.entries(INPUT_KEYS) as [keyof HotelInputs, string][]) {
    const v = tidy(field, state.inputs[field]);
    if (v !== DEFAULT_INPUTS[field]) out[key] = v;
  }
  if (state.plan.id !== "A") out.plan = state.plan.id;
  if (state.plan.id === "custom") {
    out.prr = state.plan.perRoomMonthly;
    out.pbase = state.plan.baseMonthly;
    out.pshare = state.plan.revSharePct;
  }
  const op = state.operator;
  if (op.market !== DEFAULT_OPERATOR.market) out.mkt = op.market;
  if (op.category !== DEFAULT_OPERATOR.category) out.cat = op.category;
  for (const [field, key] of Object.entries(OP_KEYS) as [keyof typeof OP_KEYS, string][]) {
    if (op[field] !== DEFAULT_OPERATOR[field]) out[key] = Number(op[field].toFixed(4));
  }
  if (state.tab !== "hotel") out.tab = state.tab;
  return out;
}

export function toQueryString(state: CalculatorState) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(encodeState(state))) params.set(k, String(v));
  const s = params.toString();
  return s ? `?${s}` : "";
}
