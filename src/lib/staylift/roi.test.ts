import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_INPUTS,
  DEFAULT_OPERATOR,
  PLANS,
  clampInputs,
  computeHotel,
  computeOperator,
  customPlan,
  matchScenario,
  measureLift,
  measuredEconomics,
  netCurve,
  pricingRule,
  withScenario,
} from "./roi.ts";

const near = (actual: number, expected: number, tol = 1) =>
  assert.ok(Math.abs(actual - expected) <= tol, `expected ≈${expected}, got ${actual}`);

describe("hotel ROI ties out to the v6 plan (80 rooms, 50% occ, 2-night stay)", () => {
  it("computes the booking base", () => {
    const r = computeHotel(DEFAULT_INPUTS, PLANS.A);
    near(r.bookings, 7300, 0.001);
    near(r.reachable, 5110, 0.001);
    near(r.occupiedNights, 14600, 0.001);
  });

  it("conservative case: $8,943 gross, +$1,857 net, 98% ROI on plan A", () => {
    const r = computeHotel(withScenario(DEFAULT_INPUTS, "conservative"), PLANS.A);
    near(r.conversionOfReachable, 0.05, 1e-9);
    near(r.gross, 8942.5);
    near(r.hotelNet, 1857);
    near(r.roi, 0.98, 0.005);
  });

  it("base case: $18,396 gross, +$4,834 net, 167% ROI on plan A", () => {
    const r = computeHotel(withScenario(DEFAULT_INPUTS, "base"), PLANS.A);
    near(r.gross, 18396);
    near(r.hotelNet, 4834);
    near(r.roi, 1.67, 0.005);
    assert.ok(r.returnPerDollar >= 2);
  });

  it("upside case: $30,660 gross, +$8,698 net on plan A", () => {
    const r = computeHotel(withScenario(DEFAULT_INPUTS, "upside"), PLANS.A);
    near(r.gross, 30660);
    near(r.hotelNet, 8698);
  });

  it("the old v4 price ($4/room + 3%) loses money in the conservative case", () => {
    const r = computeHotel(withScenario(DEFAULT_INPUTS, "conservative"), customPlan(4, 0, 3));
    near(r.hotelNet, -665);
  });
});

describe("pricing rule", () => {
  it("plan A passes, plan B fails the conservative test", () => {
    assert.equal(pricingRule(DEFAULT_INPUTS, PLANS.A).passes, true);
    const b = pricingRule(DEFAULT_INPUTS, PLANS.B);
    assert.equal(b.conservativeOk, false);
  });
});

describe("break-even", () => {
  it("net is zero at the break-even conversion", () => {
    const r = computeHotel(DEFAULT_INPUTS, PLANS.A);
    assert.ok(r.breakEven);
    const at = computeHotel({ ...DEFAULT_INPUTS, buyPct: r.breakEven.buyPct }, PLANS.A);
    near(at.hotelNet, 0, 0.01);
  });

  it("is null when each buyer loses money (share above margin × incrementality)", () => {
    const r = computeHotel({ ...DEFAULT_INPUTS, incrementalityPct: 5 }, PLANS.C);
    assert.equal(r.breakEven, null);
  });

  it("pure revenue share breaks even at zero buyers", () => {
    const r = computeHotel(DEFAULT_INPUTS, PLANS.C);
    assert.ok(r.breakEven);
    near(r.breakEven.buyers, 0, 1e-9);
  });
});

describe("curve, clamping, scenarios", () => {
  it("net curve is monotonic when each buyer is profitable", () => {
    const pts = netCurve(DEFAULT_INPUTS, PLANS.A);
    for (let i = 1; i < pts.length; i += 1) assert.ok(pts[i].net >= pts[i - 1].net);
    near(pts[0].net, -960, 0.01);
  });

  it("clamps junk and keeps defaults for missing keys", () => {
    const c = clampInputs({ rooms: "9999", occupancyPct: "abc", buyPct: -4 });
    assert.equal(c.rooms, 400);
    assert.equal(c.occupancyPct, DEFAULT_INPUTS.occupancyPct);
    assert.equal(c.buyPct, 0);
  });

  it("recognises scenarios", () => {
    assert.equal(matchScenario(withScenario(DEFAULT_INPUTS, "upside")), "upside");
    assert.equal(matchScenario({ ...DEFAULT_INPUTS, avgSpend: 46 }), null);
  });
});

describe("operator economics", () => {
  it("US lean messaging lands near the plan's ~$66/yr and 72–88% margin band", () => {
    const hotel = computeHotel(DEFAULT_INPUTS, PLANS.A);
    const op = computeOperator(hotel, { ...DEFAULT_OPERATOR, repliesPerBooking: 0 });
    near(op.vendorRevenue, 2248);
    near(op.messagingCost, 66, 2);
    assert.ok(op.grossMargin > 0.85 && op.grossMargin < 0.9);
  });

  it("Germany utility rates cost ~$437/yr", () => {
    const hotel = computeHotel(DEFAULT_INPUTS, PLANS.A);
    const op = computeOperator(hotel, { ...DEFAULT_OPERATOR, market: "DE", repliesPerBooking: 0 });
    near(op.messagingCost, 437, 3);
    assert.ok(op.grossMargin > 0.7 && op.grossMargin < 0.75);
  });

  it("falls back to the custom rate when no verified rate exists", () => {
    const hotel = computeHotel(DEFAULT_INPUTS, PLANS.A);
    const op = computeOperator(hotel, { ...DEFAULT_OPERATOR, market: "DE", category: "marketing" });
    assert.equal(op.rateVerified, false);
    assert.equal(op.rateUsed, DEFAULT_OPERATOR.customRate);
  });
});

describe("measured lift", () => {
  it("computes the mean difference and a Welch interval", () => {
    const treatment = [0, 0, 0, 50, 0, 0, 30, 0, 0, 0];
    const holdout = [0, 0, 10, 0, 0];
    const lift = measureLift(treatment, holdout);
    near(lift.meanTreatment, 8, 1e-9);
    near(lift.meanHoldout, 2, 1e-9);
    near(lift.liftPerBooking, 6, 1e-9);
    assert.ok(lift.ci95[0] < 6 && lift.ci95[1] > 6);
    assert.equal(lift.evidence, "too_few");
  });

  it("measured economics never credits more than page revenue", () => {
    const lift = measureLift(Array(400).fill(10), Array(400).fill(0));
    const m = measuredEconomics({
      lift,
      pageRevenue: 3000,
      pageOrders: 70,
      rooms: 42,
      months: 2,
      plan: PLANS.A,
      marginPct: 60,
      cardPct: 3.5,
      cardFixed: 0,
    });
    assert.equal(m.incrementality, 1);
    near(m.platformFees, 42 * 2 + 210, 1e-9);
  });
});
