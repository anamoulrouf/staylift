import { i as money, o as pct } from "./format-BLHOf1yn.mjs";
import { C as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { s as Route$5 } from "./router-ZEuq5NDh.mjs";
import { a as ResponsiveContainer, i as Bar, n as YAxis, o as Tooltip, r as XAxis, t as BarChart } from "../_libs/recharts+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/analytics-PLXdEN2-.js
var import_jsx_runtime = require_jsx_runtime();
function AnalyticsPage() {
	const { analytics, dash } = Route$5.useLoaderData();
	const f = dash.funnel;
	const chart = analytics.byOffer.map((row) => ({
		name: row.name.replace(" your room", "").replace(" for two", ""),
		dollars: Math.round(row.cents / 100)
	}));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-4xl",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-3xl font-medium tracking-tight",
				children: "Incremental revenue"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 max-w-2xl text-stone",
				children: "Not a vanity ROI multiple. These numbers are this property, this book, this inventory — so a GM can decide whether to keep paying."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
				className: "mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "Revenue / booking",
						value: `$${dash.revenuePerBooking.toFixed(2)}`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "Revenue / night",
						value: `$${dash.revenuePerNight.toFixed(2)}`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "Conversion",
						value: pct(dash.conversion)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "Email captured",
						value: `${analytics.capture.captured}/${analytics.capture.ota} OTA`
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8 rounded-xl bg-paper p-5 shadow-[var(--shadow-border)] sm:p-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-xl font-medium",
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
									tickLine: false
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
									cursor: { fill: "#f3eee6" },
									contentStyle: {
										background: "#fffdf8",
										border: "1px solid #e4dcd0",
										borderRadius: 12,
										fontSize: 13
									},
									formatter: (value) => [`$${value}`, "Revenue"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
									dataKey: "dollars",
									fill: "#234139",
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
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-6 rounded-xl bg-paper p-5 shadow-[var(--shadow-border)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-xl font-medium",
					children: "By booking source"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-4 divide-y divide-line",
					children: analytics.bySource.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-center justify-between py-3 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [row.source, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "ml-2 text-stone",
							children: [row.bookings, " bookings"]
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "tabular-nums",
							children: money(row.cents)
						})]
					}, row.source))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-6 rounded-xl bg-pine px-5 py-6 text-pine-fg sm:px-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs uppercase tracking-[0.18em] text-pine-fg/70",
						children: "Funnel"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-3 font-display text-2xl font-medium",
						children: [
							f.bookings,
							" bookings → ",
							f.reached,
							" reached → ",
							f.views,
							" views → ",
							f.purchases,
							" ",
							"purchases"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-sm text-pine-fg/80",
						children: [
							money(f.revenueCents),
							" attributed · ",
							pct(f.bookings ? f.reached / f.bookings : 0),
							" ",
							"reachable. If capture is weak, the whole model is weak."
						]
					})
				]
			})
		]
	});
}
function Kpi({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-lg bg-paper px-4 py-4 shadow-[var(--shadow-border)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
			className: "text-xs uppercase tracking-[0.14em] text-stone",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
			className: "mt-2 font-display text-2xl font-medium tabular-nums tracking-tight",
			children: value
		})]
	});
}
//#endregion
export { AnalyticsPage as component };
