import { i as money, l as stayRange, n as formatDate, o as pct } from "./format-BLHOf1yn.mjs";
import { C as require_jsx_runtime, S as useRouter, x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { h as ArrowUpRight, t as X, u as Check } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { c as Route$6, d as decideOrder } from "./router-ZEuq5NDh.mjs";
import { t as Badge } from "./badge-CSy3-CFY.mjs";
import { t as Button } from "./button-DWJAclyi.mjs";
import { n as StatusPill } from "./status-pill-BF9J_gKl.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/hotel-CRnstZIx.js
var import_jsx_runtime = require_jsx_runtime();
function Overview() {
	const data = Route$6.useLoaderData();
	const router = useRouter();
	const f = data.funnel;
	async function decide(orderId, decision) {
		try {
			await decideOrder({ data: {
				orderId,
				decision
			} });
			toast.success(decision === "approve" ? "Approved and captured." : "Declined.");
			await router.invalidate();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Could not update order.");
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-5xl stagger-in",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-end justify-between gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs uppercase tracking-[0.18em] text-stone",
						children: "Today at The Marlowe"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-2 font-display text-4xl font-medium tracking-tight text-ink sm:text-5xl",
						children: money(data.todayCents)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-stone",
						children: "Upsell revenue captured today"
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/stay/$token",
					params: { token: "maya" },
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "secondary",
						children: ["Open Maya’s stay", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpRight, { className: "size-4" })]
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
				className: "mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "This period",
						value: money(data.periodCents)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Per booking",
						value: `$${data.revenuePerBooking.toFixed(2)}`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Attach rate",
						value: pct(data.attachRate)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Top offer",
						value: data.topOffer?.name ?? "—",
						hint: data.topOffer ? money(data.topOffer.cents) : void 0
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-10 rounded-xl bg-paper p-5 shadow-[var(--shadow-border)] sm:p-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-xl font-medium",
						children: "Attribution"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-stone",
						children: "Booking is the unit. This is what the engine did with the current book."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
						className: "mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FunnelStep, {
								label: "Bookings",
								value: f.bookings
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FunnelStep, {
								label: "Reached",
								value: f.reached,
								share: f.bookings ? f.reached / f.bookings : 0
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FunnelStep, {
								label: "Views",
								value: f.views,
								share: f.reached ? f.views / f.reached : 0
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FunnelStep, {
								label: "Purchases",
								value: f.purchases,
								share: f.views ? f.purchases / f.views : 0
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FunnelStep, {
								label: "Revenue",
								value: money(f.revenueCents, { compact: true })
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-8 grid gap-6 lg:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-3 flex items-baseline justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-xl font-medium",
						children: "Needs a decision"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/hotel/fulfillment",
						className: "text-sm text-stone hover:text-ink",
						children: "All orders"
					})]
				}), data.pending.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "rounded-lg border border-line bg-cream px-4 py-8 text-sm text-stone",
					children: "No pending requests. Instant-purchase offers settle on their own."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "space-y-3",
					children: data.pending.map((order) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "rounded-lg bg-paper p-4 shadow-[var(--shadow-border)]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-medium",
								children: order.guestName
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-sm text-stone",
								children: [
									order.offerName,
									order.forTime ? ` · ${order.forTime}` : "",
									order.forDate ? ` · ${formatDate(order.forDate)}` : ""
								]
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "tabular-nums text-sm",
								children: money(order.amountCents)
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 flex gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								size: "sm",
								onClick: () => void decide(order.id, "approve"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-4" }), "Approve"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								size: "sm",
								variant: "outline",
								onClick: () => void decide(order.id, "decline"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" }), "Decline"]
							})]
						})]
					}, order.id))
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-3 flex items-baseline justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-xl font-medium",
						children: "In house & arriving"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/hotel/reservations",
						className: "text-sm text-stone hover:text-ink",
						children: "All stays"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "divide-y divide-line overflow-hidden rounded-lg bg-paper shadow-[var(--shadow-border)]",
					children: data.arriving.map((res) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/stay/$token",
						params: { token: res.token },
						className: "flex items-center gap-3 px-4 py-3 hover:bg-cream",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "truncate font-medium",
								children: res.guestName
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "truncate text-sm text-stone",
								children: [
									stayRange(res.arrival, res.departure),
									" · ",
									res.roomTypeName
								]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusPill, { status: res.status })]
					}) }, res.id))
				})] })]
			})
		]
	});
}
function Stat({ label, value, hint }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-lg bg-paper px-4 py-4 shadow-[var(--shadow-border)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
				className: "text-xs uppercase tracking-[0.14em] text-stone",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
				className: "mt-2 truncate font-display text-2xl font-medium tabular-nums tracking-tight",
				children: value
			}),
			hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-xs text-stone",
				children: hint
			}) : null
		]
	});
}
function FunnelStep({ label, value, share }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs uppercase tracking-[0.14em] text-stone",
			children: label
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 font-display text-2xl font-medium tabular-nums",
			children: value
		}),
		share !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
			tone: "quiet",
			className: "mt-2",
			children: pct(share)
		}) : null
	] });
}
//#endregion
export { Overview as component };
