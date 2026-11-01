import { a as money, s as pctOf } from "./format-CAsbM_bU.mjs";
import { w as require_jsx_runtime, x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { g as Route$16 } from "./router-CoWk33e6.mjs";
import { i as Bar, n as YAxis, o as ResponsiveContainer, r as XAxis, s as Tooltip, t as BarChart } from "../_libs/recharts+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/analytics-CVSHbuGX.js
var import_jsx_runtime = require_jsx_runtime();
function StatsPage() {
	const { analytics, dash, extras } = Route$16.useLoaderData();
	const f = dash.funnel;
	const chart = analytics.byOffer.map((row) => ({
		name: row.name.replace(" your room", "").replace(" for two", ""),
		dollars: Math.round(row.cents / 100)
	}));
	const histoMax = Math.max(1, ...extras.histogram.map((h) => h.n));
	const segTotal = extras.segments.celebrating.bookings + extras.segments.plain.bookings;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-5xl stagger-in",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-3xl font-semibold tracking-tight",
				children: "Stats"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 max-w-2xl text-stone",
				children: [
					"What sold through the stay page, to whom, from which channel — bookings that saw offers, since launch. This is attributed revenue, not incremental revenue: for that, see",
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/hotel/roi",
						className: "text-ink underline underline-offset-2",
						children: "Measured ROI"
					}),
					"."
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
				className: "mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "Revenue / booking",
						value: `$${dash.revenuePerBooking.toFixed(2)}`,
						hint: "all bookings that saw offers"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "Revenue / night",
						value: `$${dash.revenuePerNight.toFixed(2)}`,
						hint: "per occupied room-night"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "Conversion",
						value: pctOf(dash.conversion),
						hint: "bought ÷ opened page"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "Real email captured",
						value: pctOf(analytics.capture.checkedIn ? analytics.capture.captured / analytics.capture.checkedIn : 0, 0),
						hint: `${analytics.capture.captured} of ${analytics.capture.checkedIn} OTA check-ins`
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-6 rounded-2xl bg-paper p-5 shadow-[var(--shadow-border)] sm:p-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-xl font-semibold",
					children: "Revenue by offer"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4 h-64",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
						width: "100%",
						height: "100%",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BarChart, {
							data: chart,
							margin: {
								top: 8,
								right: 8,
								left: 0,
								bottom: 0
							},
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
									dataKey: "name",
									tick: {
										fill: "#6f675e",
										fontSize: 12
									},
									axisLine: false,
									tickLine: false,
									interval: 0
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
									tick: {
										fill: "#6f675e",
										fontSize: 12
									},
									axisLine: false,
									tickLine: false,
									width: 36
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {
									cursor: { fill: "rgba(196, 85, 46, 0.07)" },
									contentStyle: {
										background: "#ffffff",
										border: "1px solid #eae0d1",
										borderRadius: 12,
										fontSize: 13
									},
									formatter: (value) => [`$${value}`, "Revenue"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
									dataKey: "dollars",
									fill: "var(--series-a)",
									radius: [
										6,
										6,
										0,
										0
									]
								})
							]
						})
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 grid gap-4 lg:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "rounded-2xl bg-paper p-5 shadow-[var(--shadow-border)]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-xl font-semibold",
							children: "When guests buy"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-stone",
							children: "Paid stay-page orders, by how far ahead of the stay."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-4 space-y-2.5",
							children: extras.histogram.map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "grid grid-cols-[92px_1fr_36px] items-center gap-3 text-sm",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-stone",
										children: h.label
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "h-2.5 rounded-full bg-cream",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "block h-2.5 rounded-full bg-[var(--series-a)]",
											style: { width: `${h.n / histoMax * 100}%` }
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-right tabular-nums",
										children: h.n
									})
								]
							}, h.label))
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "rounded-2xl bg-paper p-5 shadow-[var(--shadow-border)]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-xl font-semibold",
							children: "Revenue per guest"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-stone",
							children: "Guests who told us they're celebrating vs everything else."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
							className: "mt-4 w-full text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-b border-line text-left text-xs uppercase tracking-[0.12em] text-stone",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "pb-2 font-medium",
										children: "Segment"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "pb-2 text-right font-medium",
										children: "Bookings"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "pb-2 text-right font-medium",
										children: "Revenue"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "pb-2 text-right font-medium",
										children: "$/booking"
									})
								]
							}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", {
								className: "divide-y divide-line",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-2.5",
										children: "Celebrating"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-2.5 text-right tabular-nums",
										children: extras.segments.celebrating.bookings
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-2.5 text-right tabular-nums",
										children: money(extras.segments.celebrating.cents)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
										className: "py-2.5 text-right tabular-nums",
										children: ["$", extras.segments.celebrating.bookings ? (extras.segments.celebrating.cents / 100 / extras.segments.celebrating.bookings).toFixed(2) : "0.00"]
									})
								] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-2.5",
										children: "Everything else"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-2.5 text-right tabular-nums",
										children: extras.segments.plain.bookings
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-2.5 text-right tabular-nums",
										children: money(extras.segments.plain.cents)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
										className: "py-2.5 text-right tabular-nums",
										children: ["$", extras.segments.plain.bookings ? (extras.segments.plain.cents / 100 / extras.segments.plain.bookings).toFixed(2) : "0.00"]
									})
								] })]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-2 text-xs text-stone",
							children: [segTotal, " treatment bookings since launch · celebrations come only from what guests tell us at check-in, never a guess."]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-4 rounded-2xl bg-paper p-5 shadow-[var(--shadow-border)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-xl font-semibold",
					children: "By booking source"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-4 divide-y divide-line",
					children: analytics.bySource.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-center justify-between py-3 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [row.source, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "ml-2 text-stone",
							children: [row.bookings, " bookings"]
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-right tabular-nums",
							children: [money(row.cents), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "block text-xs text-stone",
								children: [
									"$",
									row.bookings ? (row.cents / 100 / row.bookings).toFixed(2) : "0.00",
									" per booking"
								]
							})]
						})]
					}, row.source))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-4 rounded-2xl bg-pine px-5 py-6 text-pine-fg sm:px-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs uppercase tracking-[0.18em] text-pine-fg/70",
						children: "Funnel"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-3 font-display text-2xl font-semibold",
						children: [
							f.bookings,
							" bookings → ",
							f.reached,
							" reached → ",
							f.viewed,
							" opened → ",
							f.bought,
							" bought"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-sm text-pine-fg/80",
						children: [
							money(f.pageRevenueCents),
							" attributed · ",
							pctOf(f.bookings ? f.reached / f.bookings : 0, 0),
							" ",
							"reachable. Messaging: ",
							analytics.messaging.sent,
							" messages to ",
							analytics.messaging.bookings,
							" ",
							"bookings, $",
							(analytics.messaging.costCents / 100).toFixed(2),
							" total (",
							analytics.messaging.bookings ? `${(analytics.messaging.costCents / analytics.messaging.bookings).toFixed(2)}¢` : "—",
							" ",
							"per booking)."
						]
					})
				]
			})
		]
	});
}
function Kpi({ label, value, hint }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl bg-paper px-4 py-4 shadow-[var(--shadow-border)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
				className: "text-xs uppercase tracking-[0.14em] text-stone",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
				className: "mt-2 font-display text-2xl font-semibold tabular-nums tracking-tight",
				children: value
			}),
			hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-xs text-stone",
				children: hint
			}) : null
		]
	});
}
//#endregion
export { StatsPage as component };
