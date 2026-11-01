import { a as money, c as priceHint } from "./format-CAsbM_bU.mjs";
import { C as useRouter, w as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { A as Coffee, M as Clock3, U as BedDouble, l as Sunrise, u as Sparkles, v as Plane, w as LayoutGrid, z as Car } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { f as Route$12, st as toggleOffer } from "./router-CoWk33e6.mjs";
import { t as Button } from "./button-DWJAclyi.mjs";
import { t as Badge } from "./badge-C-LEKJr-.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/offers-BmHd78Ia.js
var import_jsx_runtime = require_jsx_runtime();
var CATEGORY_ICON = {
	upgrade: BedDouble,
	breakfast: Coffee,
	late_checkout: Clock3,
	early_checkin: Sunrise,
	parking: Car,
	spa: Sparkles,
	transfer: Plane
};
function OffersPage() {
	const { offers, canEdit } = Route$12.useLoaderData();
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
		className: "mx-auto max-w-5xl stagger-in",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-3xl font-semibold tracking-tight",
				children: "Service library"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 max-w-2xl text-stone",
				children: "The library of fulfillable services guests see on their stay page. Start with what the house already sells — partner-owned experiences can share this model later."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-8 grid gap-3 lg:grid-cols-2",
				children: offers.map((offer) => {
					const Icon = CATEGORY_ICON[offer.category] ?? LayoutGrid;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex gap-4 rounded-2xl bg-paper p-5 shadow-[var(--shadow-border)]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "flex size-11 shrink-0 items-center justify-center rounded-xl bg-moss text-pine",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
								className: "size-5",
								strokeWidth: 1.75
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 flex-1",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap items-center gap-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
											className: "font-display text-lg font-semibold leading-tight",
											children: offer.name
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											tone: offer.active ? "good" : "quiet",
											children: offer.active ? "Live" : "Paused"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											tone: "quiet",
											children: offer.autoApprove ? "Instant" : offer.category === "upgrade" ? "Request · confirmed 72h before arrival" : "Needs approval"
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 line-clamp-2 text-sm text-stone",
									children: offer.description
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-3 flex items-center justify-between gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-sm",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "font-semibold tabular-nums",
											children: [money(offer.priceCents), priceHint(offer.priceUnit)]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-stone",
											children: [offer.inventory === null ? " · Unlimited" : ` · ${offer.inventory} left`, offer.cutoffHours ? ` · Cutoff ${offer.cutoffHours}h` : ""]
										})]
									}), canEdit ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: offer.active ? "outline" : "primary",
										size: "sm",
										onClick: () => void toggle(offer.id, !offer.active),
										children: offer.active ? "Pause" : "Activate"
									}) : null]
								})
							]
						})]
					}, offer.id);
				})
			})
		]
	});
}
//#endregion
export { OffersPage as component };
