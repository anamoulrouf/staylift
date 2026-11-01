import { o as __toESM } from "../_runtime.mjs";
import { d as usd, n as count, s as pctOf } from "./format-CAsbM_bU.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { w as require_jsx_runtime, x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { G as ArrowRight } from "../_libs/lucide-react.mjs";
import { t as Button } from "./button-DWJAclyi.mjs";
import { t as Mark } from "./mark-6eISl1Ml.mjs";
import { b as withScenario, l as computeHotel, o as PLANS, p as encodeState, r as DEFAULT_STATE, s as SCENARIOS, t as DEFAULT_INPUTS } from "./roi-url-BGBbatUc.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-Ds9c8u69.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var LOOP = [
	{
		title: "Booking from an OTA",
		body: "Booking.com, Expedia or Agoda — from a CSV or a forwarded confirmation. No PMS project."
	},
	{
		title: "Personalised booking email",
		body: "Sent automatically: confirmation, online check-in, and three offers picked for this stay, each with the reason."
	},
	{
		title: "Personalised stay page",
		body: "No app, no account. Leads with the same picks; one tap from the email opens the offer."
	},
	{
		title: "Offer booked",
		body: "Instant purchase, or a request the desk confirms. Charged only when confirmed."
	},
	{
		title: "Hotelier dashboard",
		body: "The order lands in Fulfillment; the journey funnel shows emailed → opened → booked → revenue."
	},
	{
		title: "Proof",
		body: "A random holdout gets check-in but no offers. The difference is the lift — not a vendor case study."
	}
];
function Landing() {
	const [rooms, setRooms] = (0, import_react.useState)(42);
	const [occ, setOcc] = (0, import_react.useState)(62);
	const [stay, setStay] = (0, import_react.useState)(2.1);
	const [scenario, setScenario] = (0, import_react.useState)("conservative");
	const inputs = (0, import_react.useMemo)(() => withScenario({
		...DEFAULT_INPUTS,
		rooms,
		occupancyPct: occ,
		avgStayNights: stay
	}, scenario), [
		rooms,
		occ,
		stay,
		scenario
	]);
	const math = (0, import_react.useMemo)(() => computeHotel(inputs, PLANS.A), [inputs]);
	const fullModel = encodeState({
		...DEFAULT_STATE,
		inputs
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh bg-linen",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "mx-auto flex max-w-5xl items-center justify-between px-5 py-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mark, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
					className: "flex items-center gap-1 sm:gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/roi",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								size: "sm",
								children: "ROI"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/hotel",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								size: "sm",
								children: "Sign in"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/stay/$token",
							params: { token: "maya" },
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								size: "sm",
								children: ["Guest page", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-4" })]
							})
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mx-auto max-w-5xl px-5 pb-16 pt-10 sm:pt-16 stagger-in",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs uppercase tracking-[0.2em] text-stone",
							children: "For 20–80 room independent hotels"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "mt-4 max-w-3xl font-display text-5xl font-medium leading-[1.05] tracking-tight sm:text-7xl",
							children: "Upsell revenue you can prove."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-6 max-w-xl text-lg text-stone",
							children: "Staylift sells the upgrades, breakfast and late checkout you already have through a no-app stay page — from a CSV or forwarded confirmations, no PMS project. Then it measures the lift against a holdout, so you pay for revenue that wouldn’t have happened anyway."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-8 flex flex-wrap gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/stay/$token",
								params: { token: "maya" },
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									size: "lg",
									children: ["Try Maya’s stay", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-4" })]
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/hotel",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "lg",
									variant: "secondary",
									children: "Open the hotel desk"
								})
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-6 text-sm text-stone",
							children: "Demo property: The Marlowe, 42 rooms, Austin. Live book, live orders, live attribution."
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
					className: "border-y border-line bg-cream/60",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mx-auto grid max-w-5xl gap-8 px-5 py-14 sm:grid-cols-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-3xl font-medium tracking-tight",
							children: "The guest journey"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-stone",
							children: "Marketplace, loyalty, CRM, and “AI matching” come later. If this loop does not print money, they should not exist."
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
							className: "space-y-5",
							children: LOOP.map((step, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex gap-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "w-8 shrink-0 font-mono text-sm text-mist",
									children: String(i + 1).padStart(2, "0")
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-medium",
									children: step.title
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-sm text-stone",
									children: step.body
								})] })]
							}, step.title))
						})]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mx-auto max-w-5xl px-5 py-16",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-3xl font-medium tracking-tight",
							children: "What it’s worth to you, after fees"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 max-w-xl text-stone",
							children: "Net of what you’d have sold at the desk anyway (70% incremental), card fees and our price (plan A: $1/room/month + 7%). Not a 41× case study."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-8 grid gap-8 lg:grid-cols-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
										label: "Rooms",
										value: rooms,
										min: 20,
										max: 80,
										onChange: setRooms
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
										label: "Occupancy %",
										value: occ,
										min: 30,
										max: 95,
										onChange: setOcc
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
										label: "Average stay (nights)",
										value: stay,
										min: 1,
										max: 4,
										step: .1,
										onChange: setStay
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "flex flex-wrap gap-2 pt-2",
										role: "group",
										"aria-label": "Scenario",
										children: Object.keys(SCENARIOS).map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											"aria-pressed": scenario === id,
											onClick: () => setScenario(id),
											className: scenario === id ? "h-10 rounded-full bg-pine px-4 text-sm text-pine-fg" : "h-10 rounded-full bg-paper px-4 text-sm shadow-[var(--shadow-border)]",
											children: SCENARIOS[id].label
										}, id))
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm text-stone",
										children: SCENARIOS[scenario].blurb
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-xl bg-pine p-6 text-pine-fg",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-xs uppercase tracking-[0.18em] text-pine-fg/70",
										children: ["Hotel net gain per year · ", SCENARIOS[scenario].label.toLowerCase()]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-4 font-display text-5xl font-medium tabular-nums",
										children: usd(math.hotelNet, { sign: true })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-2 text-sm text-pine-fg/80",
										children: math.totalCost > 0 ? `${Math.round(math.roi * 100)}% ROI on fees and card costs` : ""
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
										className: "mt-8 space-y-2 text-sm",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
												k: "Bookings a year",
												v: count(math.bookings)
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
												k: `Buying bookings (${pctOf(math.conversionOfReachable)} of reachable)`,
												v: count(math.buyers)
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
												k: "Upsell revenue",
												v: usd(math.gross)
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
												k: "Incremental × 60% margin",
												v: usd(math.incrementalContribution)
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
												k: "Staylift + card fees",
												v: `−${usd(math.totalCost)}`
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
										to: "/roi",
										search: fullModel,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											variant: "secondary",
											className: "mt-6 w-full",
											children: ["Open the full ROI calculator", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-4" })]
										})
									})
								]
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
					className: "border-t border-line bg-cream/60",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mx-auto max-w-5xl px-5 py-16",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-3xl font-medium tracking-tight",
							children: "Walk the product"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-8 grid gap-4 sm:grid-cols-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Walk, {
									to: "/stay/$token",
									params: { token: "maya" },
									kicker: "Upcoming · OTA",
									title: "Maya Chen",
									body: "Just booked a Standard. Upgrade, breakfast, transfer. Capture her real email at check-in."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Walk, {
									to: "/stay/$token",
									params: { token: "sofia" },
									kicker: "Departing · request",
									title: "Sofia Alves",
									body: "Late checkout is waiting on the desk. Approve it in Fulfillment and watch revenue move."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Walk, {
									to: "/hotel/email/$reservationId",
									params: { reservationId: "res_elena" },
									kicker: "Booking email",
									title: "Elena Rossi",
									body: "Booked direct, celebrating, flying in. Her email leads with breakfast, an airport car and the spa — and says why."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Walk, {
									to: "/hotel/fulfillment",
									kicker: "Staff queue",
									title: "Fulfillment",
									body: "Spa and late checkout need a human. Breakfast does not. That distinction is the product."
								})
							]
						})]
					})
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("footer", {
				className: "border-t border-line px-5 py-8",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 text-sm text-stone",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mark, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Built for 20–80 room independent hotels. Not a guest-experience suite." })]
				})
			})
		]
	});
}
function Slider({ label, value, min, max, step = 1, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "block",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "flex justify-between text-sm",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-stone",
				children: label
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "tabular-nums",
				children: value
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			type: "range",
			min,
			max,
			step,
			value,
			onChange: (e) => onChange(Number(e.target.value)),
			className: "mt-2 h-11 w-full accent-pine"
		})]
	});
}
function Row({ k, v }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex justify-between gap-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
			className: "text-pine-fg/70",
			children: k
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
			className: "tabular-nums",
			children: v
		})]
	});
}
function Walk({ to, params, kicker, title, body }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to,
		params,
		className: "rounded-xl bg-paper p-5 shadow-[var(--shadow-border)] transition-shadow duration-150 hover:shadow-[var(--shadow-lift)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs uppercase tracking-[0.16em] text-stone",
				children: kicker
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 font-display text-2xl font-medium",
				children: title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-stone",
				children: body
			})
		]
	});
}
//#endregion
export { Landing as component };
