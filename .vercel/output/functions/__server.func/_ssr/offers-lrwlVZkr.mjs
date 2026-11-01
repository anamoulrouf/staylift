import { i as money, s as priceHint } from "./format-BLHOf1yn.mjs";
import { C as require_jsx_runtime, S as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { _ as toggleOffer, i as Route$2 } from "./router-ZEuq5NDh.mjs";
import { t as Badge } from "./badge-CSy3-CFY.mjs";
import { t as Button } from "./button-DWJAclyi.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/offers-lrwlVZkr.js
var import_jsx_runtime = require_jsx_runtime();
function OffersPage() {
	const offers = Route$2.useLoaderData();
	const router = useRouter();
	async function toggle(id, active) {
		await toggleOffer({ data: {
			id,
			active
		} });
		toast.success(active ? "Offer live." : "Offer paused.");
		await router.invalidate();
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-4xl",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-3xl font-medium tracking-tight",
				children: "Hotel inventory"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 max-w-2xl text-stone",
				children: "Start with what the house already sells. Partner-owned experiences can share this offer model later — the marketplace UI is not this product."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-8 space-y-3",
				children: offers.map((offer) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex flex-col gap-4 rounded-xl bg-paper p-5 shadow-[var(--shadow-border)] sm:flex-row sm:items-start",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-center gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "font-display text-xl font-medium",
										children: offer.name
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										tone: offer.active ? "pine" : "quiet",
										children: offer.active ? "Live" : "Paused"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										tone: "quiet",
										children: offer.autoApprove ? "Instant" : "Needs approval"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										tone: "quiet",
										children: offer.ownerType === "HOTEL" ? "Hotel-owned" : "Partner"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm text-stone",
								children: offer.description
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-3 text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "tabular-nums font-medium",
									children: [money(offer.priceCents), priceHint(offer.priceUnit)]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-stone",
									children: [offer.inventory === null ? " · Unlimited" : ` · ${offer.inventory} left`, offer.cutoffHours ? ` · Cutoff ${offer.cutoffHours}h` : ""]
								})]
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: offer.active ? "outline" : "primary",
						size: "sm",
						onClick: () => void toggle(offer.id, !offer.active),
						children: offer.active ? "Pause" : "Activate"
					})]
				}, offer.id))
			})
		]
	});
}
//#endregion
export { OffersPage as component };
