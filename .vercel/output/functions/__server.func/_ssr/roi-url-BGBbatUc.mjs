//#region node_modules/.nitro/vite/services/ssr/assets/roi-url-BGBbatUc.js
var PLANS = {
	A: {
		id: "A",
		name: "Plan A · Hybrid",
		perRoomMonthly: 1,
		baseMonthly: 0,
		revSharePct: 7,
		note: "$1/room/month + 7% of upsell revenue. Lead hypothesis: fee scales with results."
	},
	B: {
		id: "B",
		name: "Plan B · Subscription",
		perRoomMonthly: 4,
		baseMonthly: 0,
		revSharePct: 0,
		note: "$4/room/month flat. Hotel keeps 100% of upsell revenue."
	},
	C: {
		id: "C",
		name: "Plan C · Revenue share",
		perRoomMonthly: 0,
		baseMonthly: 0,
		revSharePct: 10,
		note: "10% of upsell revenue, no subscription."
	}
};
function customPlan(perRoomMonthly, baseMonthly, revSharePct) {
	return {
		id: "custom",
		name: "Custom plan",
		perRoomMonthly,
		baseMonthly,
		revSharePct,
		note: "Your own mix of per-room, base and revenue-share fees."
	};
}
/** Funnel assumptions that differ between scenarios. Everything else is the hotel's. */
var SCENARIOS = {
	conservative: {
		label: "Conservative",
		viewPct: 50,
		buyPct: 10,
		avgSpend: 35,
		blurb: "5% of reachable bookings buy, $35 average spend."
	},
	base: {
		label: "Base",
		viewPct: 50,
		buyPct: 16,
		avgSpend: 45,
		blurb: "8% of reachable bookings buy, $45 average spend."
	},
	upside: {
		label: "Upside",
		viewPct: 50,
		buyPct: 20,
		avgSpend: 60,
		blurb: "10% buy, $60 average spend — upgrade-led."
	}
};
/** The worked example from the plan: an 80-room independent at 50% occupancy. */
var DEFAULT_INPUTS = {
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
	cardFixed: 0
};
/** Hard bounds the UI and URL parser clamp to, so a typo can't produce nonsense. */
var INPUT_BOUNDS = {
	rooms: {
		min: 5,
		max: 400,
		step: 1
	},
	occupancyPct: {
		min: 10,
		max: 100,
		step: 1
	},
	avgStayNights: {
		min: 1,
		max: 14,
		step: .1
	},
	reachablePct: {
		min: 0,
		max: 100,
		step: 1
	},
	viewPct: {
		min: 0,
		max: 100,
		step: 1
	},
	buyPct: {
		min: 0,
		max: 100,
		step: .5
	},
	avgSpend: {
		min: 0,
		max: 500,
		step: 1
	},
	ordersPerBuyer: {
		min: 1,
		max: 5,
		step: .1
	},
	marginPct: {
		min: 0,
		max: 100,
		step: 1
	},
	incrementalityPct: {
		min: 0,
		max: 100,
		step: 1
	},
	cardPct: {
		min: 0,
		max: 10,
		step: .1
	},
	cardFixed: {
		min: 0,
		max: 2,
		step: .05
	}
};
function clampInputs(raw) {
	const out = { ...DEFAULT_INPUTS };
	for (const key of Object.keys(INPUT_BOUNDS)) {
		const value = Number(raw[key]);
		if (raw[key] === void 0 || raw[key] === null || raw[key] === "" || !Number.isFinite(value)) continue;
		const { min, max } = INPUT_BOUNDS[key];
		out[key] = Math.min(max, Math.max(min, value));
	}
	return out;
}
var safeDiv = (a, b) => b === 0 ? 0 : a / b;
function annualBookings(i) {
	return safeDiv(i.rooms * (i.occupancyPct / 100) * 365, i.avgStayNights);
}
function platformFeesFor(plan, rooms, gross, months = 12) {
	const subscription = (plan.perRoomMonthly * rooms + plan.baseMonthly) * months;
	const share = gross * (plan.revSharePct / 100);
	return {
		subscription,
		share,
		total: subscription + share
	};
}
function computeHotel(input, plan) {
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
			passes: incrementalRevenue >= 2 * fees.total
		}
	};
}
/**
* Hotel net is linear in buyers B:
*   net(B) = B × [S × (m × i − r − p) − f × k] − F
* where S = spend, m = margin, i = incrementality, r = revenue share,
* p = card %, f = card fixed fee, k = orders per buyer, F = fixed fees/year.
*/
function breakEven(input, plan, reachable, viewers) {
	const perBuyer = input.avgSpend * (input.marginPct / 100 * (input.incrementalityPct / 100) - plan.revSharePct / 100 - input.cardPct / 100) - input.cardFixed * input.ordersPerBuyer;
	const fixed = (plan.perRoomMonthly * input.rooms + plan.baseMonthly) * 12;
	if (perBuyer <= 0) return null;
	const buyers = fixed / perBuyer;
	if (reachable <= 0 || viewers <= 0) return null;
	return {
		buyers,
		conversionOfReachable: buyers / reachable,
		buyPct: buyers / viewers * 100
	};
}
function withScenario(input, id) {
	const s = SCENARIOS[id];
	return {
		...input,
		viewPct: s.viewPct,
		buyPct: s.buyPct,
		avgSpend: s.avgSpend
	};
}
/** Which scenario (if any) the funnel inputs currently match exactly. */
function matchScenario(input) {
	for (const id of Object.keys(SCENARIOS)) {
		const s = SCENARIOS[id];
		if (input.viewPct === s.viewPct && input.buyPct === s.buyPct && input.avgSpend === s.avgSpend) return id;
	}
	return null;
}
/**
* The pricing rule from the plan: a price is acceptable only if the hotel nets
* a positive return in the conservative case AND gets at least $2 of
* incremental margin per $1 of fees in the base case.
*/
function pricingRule(input, plan) {
	const conservative = computeHotel(withScenario(input, "conservative"), plan);
	const base = computeHotel(withScenario(input, "base"), plan);
	const conservativeOk = conservative.hotelNet > 0;
	const baseOk = base.returnPerDollar >= 2;
	return {
		conservative,
		base,
		conservativeOk,
		baseOk,
		passes: conservativeOk && baseOk
	};
}
/** Hotel net across buyer conversion (of reachable), for the sensitivity chart. */
function netCurve(input, plan, maxConversion = .15, steps = 60) {
	const points = [];
	for (let s = 0; s <= steps; s += 1) {
		const conversion = maxConversion * s / steps;
		const buyPct = input.viewPct > 0 ? conversion / (input.viewPct / 100) * 100 : 0;
		const r = computeHotel({
			...input,
			buyPct
		}, plan);
		points.push({
			conversion,
			net: r.hotelNet
		});
	}
	return points;
}
/**
* Meta WhatsApp per-delivered-message rates (USD) we could verify for 2026.
* null = no verified figure; the UI asks for a custom rate instead of guessing.
* Meta revises rate cards quarterly — re-check before quoting.
* From 1 Oct 2026 utility templates and free-form replies inside the 24-hour
* service window are billed too, so every phone message has a cost.
*/
var MESSAGE_RATES = {
	US: {
		label: "United States",
		utility: .004,
		marketing: .025
	},
	UK: {
		label: "United Kingdom",
		utility: .0171,
		marketing: .0592
	},
	DE: {
		label: "Germany",
		utility: .055,
		marketing: null
	},
	NL: {
		label: "Netherlands",
		utility: null,
		marketing: .1597
	}
};
var DEFAULT_OPERATOR = {
	market: "US",
	category: "utility",
	customRate: .05,
	bspPerMessage: .005,
	phoneSharePct: 95,
	messagesPerBooking: 1.5,
	repliesPerBooking: .3,
	supportPerHotelYear: 200,
	churnMonthlyPct: 2,
	cac: 750,
	hotels: 100
};
function messageRate(op, category = op.category) {
	const preset = MESSAGE_RATES[op.market][category];
	return {
		rate: preset ?? op.customRate,
		verified: preset !== null
	};
}
function computeOperator(hotel, op) {
	const phoneReachable = hotel.reachable * (op.phoneSharePct / 100);
	const templateMessages = phoneReachable * op.messagesPerBooking;
	const replyMessages = phoneReachable * op.repliesPerBooking;
	const template = messageRate(op);
	const utility = messageRate(op, "utility");
	const messagingCost = templateMessages * (template.rate + op.bspPerMessage) + replyMessages * (utility.rate + op.bspPerMessage);
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
		rateVerified: template.verified && utility.verified
	};
}
function meanVar(values) {
	const n = values.length;
	if (n === 0) return {
		mean: 0,
		variance: 0
	};
	const mean = values.reduce((a, b) => a + b, 0) / n;
	return {
		mean,
		variance: n > 1 ? values.reduce((a, v) => a + (v - mean) ** 2, 0) / (n - 1) : 0
	};
}
/**
* Difference in mean ancillary revenue per completed stay, treatment vs
* holdout, with a Welch 95% interval. Per-booking revenue is very skewed
* (most bookings buy nothing), so the interval is wide until the holdout has
* a few hundred stays — that is the point of showing it.
*/
function measureLift(treatment, holdout) {
	const t = meanVar(treatment);
	const h = meanVar(holdout);
	const nT = treatment.length;
	const nH = holdout.length;
	const se = Math.sqrt(safeDiv(t.variance, nT) + safeDiv(h.variance, nH));
	const lift = t.mean - h.mean;
	const evidence = nH < 50 || nT < 50 ? "too_few" : nH < 300 ? "directional" : "solid";
	return {
		nTreatment: nT,
		nHoldout: nH,
		meanTreatment: t.mean,
		meanHoldout: h.mean,
		liftPerBooking: lift,
		standardError: se,
		ci95: [lift - 1.96 * se, lift + 1.96 * se],
		evidence
	};
}
function measuredEconomics(m) {
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
			passes: incrementalRevenue >= 2 * fees.total
		}
	};
}
/**
* Calculator state <-> short URL query keys, so a model can be shared as a link
* ("here is your hotel at 8% conversion on plan A"). Only values that differ
* from the defaults are written; anything unreadable falls back to defaults.
*/
var INPUT_KEYS = {
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
	cardFixed: "cardfix"
};
var OP_KEYS = {
	phoneSharePct: "phone",
	messagesPerBooking: "msgs",
	repliesPerBooking: "replies",
	customRate: "rate",
	bspPerMessage: "bsp",
	supportPerHotelYear: "support",
	churnMonthlyPct: "churn",
	cac: "cac",
	hotels: "hotels"
};
var DEFAULT_STATE = {
	inputs: DEFAULT_INPUTS,
	plan: PLANS.A,
	operator: DEFAULT_OPERATOR,
	tab: "hotel"
};
function num(v) {
	if (v === void 0 || v === null || v === "") return void 0;
	const n = Number(v);
	return Number.isFinite(n) ? n : void 0;
}
function clamp(n, min, max) {
	return Math.min(max, Math.max(min, n));
}
function decodeState(search) {
	const raw = {};
	for (const [field, key] of Object.entries(INPUT_KEYS)) raw[field] = search[key];
	const inputs = clampInputs(raw);
	const planId = String(search.plan ?? "A");
	let plan = PLANS.A;
	if (planId === "B" || planId === "C") plan = PLANS[planId];
	if (planId === "custom") plan = customPlan(clamp(num(search.prr) ?? 1, 0, 50), clamp(num(search.pbase) ?? 0, 0, 5e3), clamp(num(search.pshare) ?? 7, 0, 50));
	const operator = { ...DEFAULT_OPERATOR };
	const market = String(search.mkt ?? "");
	if (market in MESSAGE_RATES) operator.market = market;
	if (search.cat === "marketing") operator.category = "marketing";
	for (const [field, key] of Object.entries(OP_KEYS)) {
		const v = num(search[key]);
		if (v !== void 0 && v >= 0) operator[field] = v;
	}
	operator.phoneSharePct = clamp(operator.phoneSharePct, 0, 100);
	operator.messagesPerBooking = clamp(operator.messagesPerBooking, 0, 10);
	operator.churnMonthlyPct = clamp(operator.churnMonthlyPct, 0, 50);
	return {
		inputs,
		plan,
		operator,
		tab: search.tab === "operator" ? "operator" : "hotel"
	};
}
/** Rounds to the input's step so URLs stay short and stable. */
function tidy(field, value) {
	const step = INPUT_BOUNDS[field].step;
	const decimals = step < 1 ? String(step).split(".")[1]?.length ?? 2 : 0;
	return Number(value.toFixed(decimals));
}
function encodeState(state) {
	const out = {};
	for (const [field, key] of Object.entries(INPUT_KEYS)) {
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
	for (const [field, key] of Object.entries(OP_KEYS)) if (op[field] !== DEFAULT_OPERATOR[field]) out[key] = Number(op[field].toFixed(4));
	if (state.tab !== "hotel") out.tab = state.tab;
	return out;
}
//#endregion
export { messageRate as _, MESSAGE_RATES as a, withScenario as b, clampInputs as c, customPlan as d, decodeState as f, measuredEconomics as g, measureLift as h, INPUT_BOUNDS as i, computeHotel as l, matchScenario as m, DEFAULT_OPERATOR as n, PLANS as o, encodeState as p, DEFAULT_STATE as r, SCENARIOS as s, DEFAULT_INPUTS as t, computeOperator as u, netCurve as v, pricingRule as y };
