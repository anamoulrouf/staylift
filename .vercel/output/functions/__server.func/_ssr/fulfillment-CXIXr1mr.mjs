import { i as money, n as formatDate } from "./format-BLHOf1yn.mjs";
import { C as require_jsx_runtime, S as useRouter, x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as X, u as Check } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as Route$3, d as decideOrder } from "./router-ZEuq5NDh.mjs";
import { t as Badge } from "./badge-CSy3-CFY.mjs";
import { t as Button } from "./button-DWJAclyi.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/fulfillment-CXIXr1mr.js
var import_jsx_runtime = require_jsx_runtime();
function FulfillmentPage() {
	const { pending, paid } = Route$3.useLoaderData();
	const router = useRouter();
	async function decide(orderId, decision) {
		try {
			await decideOrder({ data: {
				orderId,
				decision
			} });
			toast.success(decision === "approve" ? "Guest notified. Payment captured. Revenue recorded." : "Request declined.");
			await router.invalidate();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Could not update.");
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-4xl",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-3xl font-medium tracking-tight",
				children: "Fulfillment"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 max-w-2xl text-stone",
				children: "A purchase is not a campaign metric. Staff have to know immediately, and the guest has to know if the house said no."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-8 font-display text-xl font-medium",
				children: "New requests"
			}),
			pending.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 rounded-lg border border-line bg-cream px-4 py-8 text-sm text-stone",
				children: "Queue is clear."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-3 space-y-3",
				children: pending.map((order) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "rounded-xl bg-paper p-5 shadow-[var(--shadow-border)]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-start justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs uppercase tracking-[0.14em] text-stone",
								children: "New order"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "mt-1 font-display text-2xl font-medium",
								children: order.guestName
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 text-stone",
								children: [
									order.offerName,
									order.forTime ? ` · ${order.forTime}` : "",
									order.forDate ? ` · ${formatDate(order.forDate)}` : ""
								]
							})
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-2xl tabular-nums",
							children: money(order.amountCents)
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 flex flex-wrap gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								onClick: () => void decide(order.id, "approve"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-4" }), " Approve"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "outline",
								onClick: () => void decide(order.id, "decline"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" }), " Decline"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/stay/$token",
								params: { token: order.token },
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "ghost",
									children: "Guest page"
								})
							})
						]
					})]
				}, order.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-10 font-display text-xl font-medium",
				children: "On the books"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-3 divide-y divide-line overflow-hidden rounded-xl bg-paper shadow-[var(--shadow-border)]",
				children: paid.map((order) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex flex-wrap items-center justify-between gap-3 px-5 py-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-medium",
						children: order.guestName
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-stone",
						children: [
							order.offerName,
							order.forDate ? ` · ${formatDate(order.forDate)}` : "",
							order.forTime ? ` · ${order.forTime}` : ""
						]
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							tone: "pine",
							children: "Paid"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "tabular-nums text-sm",
							children: money(order.amountCents)
						})]
					})]
				}, order.id))
			})
		]
	});
}
//#endregion
export { FulfillmentPage as component };
