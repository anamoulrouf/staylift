import { S as useNavigate, w as require_jsx_runtime, x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { h as Route$15 } from "./router-CoWk33e6.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { t as Badge } from "./badge-C-LEKJr-.mjs";
import { t as AUDIT_ACTION_LABEL } from "./audit-CWKuUfF1.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/audit-BHoICoer.js
var import_jsx_runtime = require_jsx_runtime();
var FILTERS = [
	{
		id: "",
		label: "Everything"
	},
	{
		id: "contact.",
		label: "Contact reveals"
	},
	{
		id: "profile.",
		label: "Profiles"
	},
	{
		id: "consent.",
		label: "Consent"
	},
	{
		id: "guest.",
		label: "Guest requests"
	},
	{
		id: "team.",
		label: "Team"
	},
	{
		id: "order.",
		label: "Orders"
	},
	{
		id: "retention.",
		label: "Retention"
	}
];
function describe(detail) {
	const parts = [];
	for (const [k, v] of Object.entries(detail)) {
		if (v === null || v === void 0 || typeof v === "object") continue;
		parts.push(`${k.replace(/([A-Z])/g, " $1").toLowerCase()}: ${String(v)}`);
	}
	return parts.join(" · ");
}
function AuditPage() {
	const rows = Route$15.useLoaderData();
	const search = Route$15.useSearch();
	const navigate = useNavigate({ from: "/hotel/audit" });
	const active = search.action ?? "";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-5xl",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-3xl font-medium tracking-tight",
				children: "Audit log"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 max-w-2xl text-stone",
				children: "Append-only: the app can add entries but never change or delete them. Contact values and codes are never written here."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-6 flex flex-wrap gap-1.5",
				children: FILTERS.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => void navigate({ search: { action: f.id || void 0 } }),
					className: cn("h-8 rounded-full border px-3 text-sm", active === f.id ? "border-pine bg-pine text-pine-fg" : "border-line bg-paper"),
					children: f.label
				}, f.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 overflow-x-auto rounded-xl bg-paper shadow-[var(--shadow-border)]",
				children: rows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "px-5 py-10 text-center text-stone",
					children: "Nothing recorded yet."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full min-w-[720px] text-left text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
						className: "border-b border-line text-xs uppercase tracking-[0.14em] text-stone",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-4 py-3 font-medium",
								children: "When"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-4 py-3 font-medium",
								children: "Who"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-4 py-3 font-medium",
								children: "What"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-4 py-3 font-medium",
								children: "Details"
							})
						] })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: rows.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-b border-line align-top last:border-0",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "whitespace-nowrap px-4 py-2.5 tabular-nums text-stone",
								children: new Date(r.at).toLocaleString("en-US", {
									month: "short",
									day: "numeric",
									hour: "2-digit",
									minute: "2-digit"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "px-4 py-2.5",
								children: [
									r.actorLabel,
									" ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										className: "ml-1",
										children: r.actorKind
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "px-4 py-2.5",
								children: [AUDIT_ACTION_LABEL[r.action] ?? r.action, r.targetType === "profile" && r.targetId && !r.action.endsWith("erase") ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/hotel/guests/$profileId",
									params: { profileId: r.targetId },
									className: "ml-2 text-xs text-pine underline-offset-4 hover:underline",
									children: "open"
								}) : null]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-2.5 text-xs text-stone",
								children: describe(r.detail)
							})
						]
					}, r.id)) })]
				})
			})
		]
	});
}
//#endregion
export { AuditPage as component };
