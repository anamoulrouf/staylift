import { r as formatDate } from "./format-CAsbM_bU.mjs";
import { C as useRouter, w as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { ct as toggleRecipe, m as Route$14 } from "./router-CoWk33e6.mjs";
import { t as Badge } from "./badge-C-LEKJr-.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/automation-3zC__vq3.js
var import_jsx_runtime = require_jsx_runtime();
function AutomationPage() {
	const { recipes, offers, messages } = Route$14.useLoaderData();
	const router = useRouter();
	const byId = Object.fromEntries(offers.map((o) => [o.id, o.name]));
	async function toggle(id, active) {
		await toggleRecipe({ data: {
			id,
			active
		} });
		toast.success(active ? "Recipe on." : "Recipe paused.");
		await router.invalidate();
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-4xl",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-3xl font-medium tracking-tight",
				children: "Default recipes"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 max-w-2xl text-stone",
				children: "Small hotels should not build campaigns. They activate templates. Only two recipes send a message, and it carries service content (check-in link, arrival details) — billed as a utility template, never as marketing. The rest change which offers the stay page leads with. Phone messages are capped at 2 per booking."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
				className: "mt-8 space-y-3",
				children: recipes.map((recipe, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "rounded-xl bg-paper p-5 shadow-[var(--shadow-border)]",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-start justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs tabular-nums text-stone",
								children: ["0", i + 1]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-1 flex flex-wrap items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "font-display text-xl font-medium",
									children: recipe.name
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									tone: recipe.sendsMessage ? "amber" : "quiet",
									children: recipe.sendsMessage ? "Sends 1 message" : "Page only"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm text-stone",
								children: recipe.summary
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-3 flex flex-wrap gap-1.5",
								children: recipe.offerIds.map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									tone: "quiet",
									children: byId[id] ?? id
								}, id))
							})
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							role: "switch",
							"aria-checked": recipe.active,
							onClick: () => void toggle(recipe.id, !recipe.active),
							className: `relative h-11 w-16 rounded-full transition-colors duration-150 ${recipe.active ? "bg-pine" : "bg-line"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `absolute top-1 size-9 rounded-full bg-paper shadow-[var(--shadow-border)] transition-transform duration-150 ${recipe.active ? "translate-x-6" : "translate-x-1"}` }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "sr-only",
								children: recipe.active ? "On" : "Off"
							})]
						})]
					})
				}, recipe.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-10 font-display text-xl font-medium",
				children: "Recent sends"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-3 divide-y divide-line overflow-hidden rounded-xl bg-paper shadow-[var(--shadow-border)]",
				children: messages.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex flex-wrap items-center justify-between gap-3 px-5 py-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-medium",
						children: m.subject
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-stone",
						children: [
							m.guestName,
							" · ",
							m.kind.startsWith("booking_") ? `booking email (${m.kind.slice(8)})` : m.channel,
							" ·",
							" ",
							formatDate(m.sentAt),
							" ·",
							" ",
							m.costCents > 0 ? `$${(m.costCents / 100).toFixed(3)}` : "no charge"
						]
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						tone: m.status === "sent" ? "pine" : "rose",
						children: m.status
					})]
				}, m.id))
			})
		]
	});
}
//#endregion
export { AutomationPage as component };
