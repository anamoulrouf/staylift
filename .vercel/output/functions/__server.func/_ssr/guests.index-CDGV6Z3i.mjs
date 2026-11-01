import { o as __toESM } from "../_runtime.mjs";
import { a as money, r as formatDate } from "./format-CAsbM_bU.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { S as useNavigate, w as require_jsx_runtime, x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { V as CalendarHeart, p as Search } from "../_libs/lucide-react.mjs";
import { r as Route$1 } from "./router-CoWk33e6.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { t as Badge } from "./badge-C-LEKJr-.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/guests.index-CDGV6Z3i.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var FILTERS = [
	{
		id: "all",
		label: "All"
	},
	{
		id: "marketable",
		label: "Opted in"
	},
	{
		id: "returning",
		label: "Returning"
	},
	{
		id: "occasions",
		label: "Occasion soon"
	}
];
function GuestsPage() {
	const data = Route$1.useLoaderData();
	const search = Route$1.useSearch();
	const navigate = useNavigate({ from: "/hotel/guests/" });
	const [q, setQ] = (0, import_react.useState)(search.q ?? "");
	const filter = search.filter ?? "all";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-5xl",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-3xl font-medium tracking-tight",
				children: "Guests"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 max-w-2xl text-stone",
				children: "A profile exists only when a guest confirmed their own contact and opted in at check-in. Contacts are encrypted and shown masked; managers can reveal one, which is logged."
			}),
			data.upcoming.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-6 rounded-xl bg-pine p-5 text-pine-fg",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
						className: "flex items-center gap-2 font-display text-lg font-medium",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarHeart, { className: "size-5" }), " Coming up in the next 60 days"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-3 grid gap-2 sm:grid-cols-2",
						children: data.upcoming.map((u) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/hotel/guests/$profileId",
							params: { profileId: u.profileId },
							className: "flex justify-between gap-3 rounded-md bg-pine-fg/10 px-3 py-2 text-sm hover:bg-pine-fg/15",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "truncate",
								children: [
									u.name,
									" · ",
									u.what
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "shrink-0 tabular-nums text-pine-fg/80",
								children: u.exactDay ? formatDate(u.date) : formatDate(u.date).split(" ")[0]
							})]
						}) }, `${u.profileId}-${u.what}`))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-xs text-pine-fg/70",
						children: "Occasion campaigns (phase D) will use these. Nothing is sent yet."
					})
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "relative w-full sm:max-w-sm",
					onSubmit: (e) => {
						e.preventDefault();
						navigate({ search: {
							q: q.trim() || void 0,
							filter: search.filter
						} });
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-mist" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						"aria-label": "Search guests",
						value: q,
						onChange: (e) => setQ(e.target.value),
						placeholder: "Name, or exact email / phone",
						className: "h-11 w-full rounded-md border border-line bg-paper pl-9 pr-3 text-sm outline-none focus:border-pine"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "inline-flex rounded-md bg-cream p-1",
					children: FILTERS.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => void navigate({ search: {
							q: search.q,
							filter: f.id === "all" ? void 0 : f.id
						} }),
						className: cn("h-8 rounded-sm px-3 text-sm", filter === f.id ? "bg-paper shadow-[var(--shadow-border)]" : "text-stone"),
						children: f.label
					}, f.id))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 overflow-x-auto rounded-xl bg-paper shadow-[var(--shadow-border)]",
				children: data.rows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "px-5 py-10 text-center text-stone",
					children: search.q ? "No guest matches that. Email and phone search needs the exact address or number." : "No profiles yet. They appear as guests opt in at check-in."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full min-w-[720px] text-left text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
						className: "border-b border-line text-xs uppercase tracking-[0.14em] text-stone",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-4 py-3 font-medium",
								children: "Guest"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-4 py-3 font-medium",
								children: "Stays"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-4 py-3 font-medium",
								children: "Spent"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-4 py-3 font-medium",
								children: "Opted in"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-4 py-3 font-medium",
								children: "Next occasion"
							})
						] })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: data.rows.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-b border-line last:border-0 hover:bg-cream/60",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "px-4 py-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/hotel/guests/$profileId",
									params: { profileId: r.id },
									className: "font-medium hover:text-pine",
									children: r.name
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-stone",
									children: [r.email, r.phone].filter(Boolean).join(" · ")
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "px-4 py-3 tabular-nums",
								children: [r.stays, r.lastArrival ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "block text-xs text-stone",
									children: ["last ", formatDate(r.lastArrival)]
								}) : null]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3 tabular-nums",
								children: r.spentCents ? money(r.spentCents) : "—"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap gap-1",
									children: [
										r.consents.marketing_email ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											tone: "pine",
											children: "Email"
										}) : null,
										r.consents.marketing_whatsapp ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											tone: "pine",
											children: "WhatsApp"
										}) : null,
										r.consents.profile_memory ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, { children: "Memory" }) : null,
										!r.consents.marketing_email && !r.consents.marketing_whatsapp && !r.consents.profile_memory ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-xs text-stone",
											children: "Withdrawn"
										}) : null
									]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3 text-stone",
								children: r.nextOccasion ? `${r.nextOccasion.label} · ${formatDate(r.nextOccasion.date)}` : "—"
							})
						]
					}, r.id)) })]
				})
			})
		]
	});
}
//#endregion
export { GuestsPage as component };
