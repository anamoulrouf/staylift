import { o as __toESM } from "../_runtime.mjs";
import { i as money } from "./format-BLHOf1yn.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { C as require_jsx_runtime, x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { g as ArrowRight } from "../_libs/lucide-react.mjs";
import { t as Button } from "./button-DWJAclyi.mjs";
import { t as Mark } from "./mark-6eISl1Ml.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-DqMV6k4W.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var LOOP = [
	{
		title: "Reservation",
		body: "A booking arrives from the OTA, the website, or a pasted confirmation."
	},
	{
		title: "Guest + stay",
		body: "Nights, party, room type, and whether we can actually reach them."
	},
	{
		title: "Offer ranking",
		body: "Hotel-owned inventory first. Instant purchase or a request the desk confirms."
	},
	{
		title: "The guest page",
		body: "No app. No account. A stay that already knows their dates."
	},
	{
		title: "Fulfillment",
		body: "Staff see the order. Guest is told. Payment is captured. Revenue is attributed."
	},
	{
		title: "Learning",
		body: "What this kind of guest buys, when, at what price, on which channel."
	}
];
function Landing() {
	const [rooms, setRooms] = (0, import_react.useState)(42);
	const [occ, setOcc] = (0, import_react.useState)(62);
	const [stay, setStay] = (0, import_react.useState)(2.1);
	const [conv, setConv] = (0, import_react.useState)(5);
	const [aov, setAov] = (0, import_react.useState)(35);
	const math = (0, import_react.useMemo)(() => {
		const bookings = Math.round(rooms * (occ / 100) * 365 / stay);
		const reachable = Math.round(bookings * .7);
		const revenue = Math.round(reachable * (conv / 100) * aov);
		const saas = rooms * 4 * 12;
		const take = Math.round(revenue * .03);
		const cost = saas + take;
		const contribution = Math.round(revenue * .6);
		return {
			bookings,
			reachable,
			revenue,
			saas,
			take,
			cost,
			contribution,
			roi: cost ? (contribution - cost) / cost : 0
		};
	}, [
		rooms,
		occ,
		stay,
		conv,
		aov
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh bg-linen",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "mx-auto flex max-w-5xl items-center justify-between px-5 py-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mark, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/hotel",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							size: "sm",
							children: "Hotel desk"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/stay/$token",
						params: { token: "maya" },
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "sm",
							children: ["Guest page", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-4" })]
						})
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mx-auto max-w-5xl px-5 pb-16 pt-10 sm:pt-16 stagger-in",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs uppercase tracking-[0.2em] text-stone",
							children: "Ancillary revenue automation"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "mt-4 max-w-3xl font-display text-5xl font-medium leading-[1.05] tracking-tight sm:text-7xl",
							children: "Turn every reservation into incremental revenue."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-6 max-w-xl text-lg text-stone",
							children: "Staylift is the automated revenue layer for independent hotels. It sells the upgrades, breakfast, and late checkout you already have — without adding work for the front desk."
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
							children: "The loop, and nothing else"
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
							children: "Measure it on your book"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 max-w-xl text-stone",
							children: "Conservative conversion, real occupancy math. Not a 41× case study."
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
										min: 40,
										max: 90,
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
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
										label: "Conversion %",
										value: conv,
										min: 2,
										max: 12,
										onChange: setConv
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
										label: "Average order $",
										value: aov,
										min: 20,
										max: 80,
										onChange: setAov
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-xl bg-pine p-6 text-pine-fg",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs uppercase tracking-[0.18em] text-pine-fg/70",
										children: "Annual, conservative"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-4 font-display text-5xl font-medium tabular-nums",
										children: money(math.revenue * 100)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-2 text-sm text-pine-fg/80",
										children: "Incremental ancillary revenue"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
										className: "mt-8 space-y-2 text-sm",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
												k: "Bookings",
												v: math.bookings.toLocaleString()
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
												k: "Reachable (70%)",
												v: math.reachable.toLocaleString()
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
												k: "Hotel contribution (60%)",
												v: money(math.contribution * 100)
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
												k: "Staylift (hybrid)",
												v: money(math.cost * 100)
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
												k: "ROI",
												v: `${math.roi >= 0 ? "+" : ""}${Math.round(math.roi * 100)}%`
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-6 text-xs text-pine-fg/70",
										children: "Hybrid priced here as $4/room/month + 3% of upsell. The pilot tests subscription, revenue share, and hybrid — ask “if we generated $10,000, what fee feels fair?”"
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
							className: "mt-8 grid gap-4 sm:grid-cols-3",
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
