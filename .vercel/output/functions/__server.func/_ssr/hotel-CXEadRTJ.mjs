import { C as require_jsx_runtime, _ as Outlet, m as useRouterState, x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { d as ChartNoAxesColumn, i as Sparkles, l as ClipboardList, m as BedDouble, o as LayoutGrid, p as CalendarRange } from "../_libs/lucide-react.mjs";
import { l as Route$7 } from "./router-ZEuq5NDh.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { t as Mark } from "./mark-6eISl1Ml.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/hotel-CXEadRTJ.js
var import_jsx_runtime = require_jsx_runtime();
var NAV = [
	{
		to: "/hotel",
		label: "Overview",
		icon: LayoutGrid,
		exact: true
	},
	{
		to: "/hotel/reservations",
		label: "Reservations",
		icon: CalendarRange
	},
	{
		to: "/hotel/offers",
		label: "Offers",
		icon: BedDouble
	},
	{
		to: "/hotel/fulfillment",
		label: "Fulfillment",
		icon: ClipboardList
	},
	{
		to: "/hotel/automation",
		label: "Recipes",
		icon: Sparkles
	},
	{
		to: "/hotel/analytics",
		label: "Attribution",
		icon: ChartNoAxesColumn
	}
];
function HotelShell({ children, pendingCount = 0 }) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh bg-linen",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: "fixed inset-y-0 left-0 z-20 hidden w-56 flex-col border-r border-line bg-cream/80 px-4 py-6 lg:flex",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "px-2",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mark, {})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-6 px-2 font-display text-lg leading-tight text-ink",
						children: "The Marlowe"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "px-2 text-xs text-stone",
						children: "Austin · 42 rooms"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
						className: "mt-8 flex flex-1 flex-col gap-1",
						children: NAV.map((item) => {
							const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
							const Icon = item.icon;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: item.to,
								className: cn("flex h-11 items-center gap-2.5 rounded-md px-3 text-sm transition-colors duration-150", active ? "bg-pine text-pine-fg" : "text-stone hover:bg-paper hover:text-ink"),
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
										className: "size-4",
										strokeWidth: 1.75
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "flex-1",
										children: item.label
									}),
									item.to === "/hotel/fulfillment" && pendingCount > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: cn("min-w-5 rounded-full px-1.5 text-center text-xs tabular-nums", active ? "bg-pine-fg/15 text-pine-fg" : "bg-amber-soft text-amber"),
										children: pendingCount
									}) : null
								]
							}, item.to);
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/stay/$token",
						params: { token: "maya" },
						className: "mt-auto rounded-md px-3 py-3 text-xs text-stone hover:text-ink",
						children: "Preview guest page →"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "lg:pl-56",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "sticky top-0 z-10 flex items-center justify-between border-b border-line bg-linen/90 px-4 py-3 backdrop-blur-sm lg:hidden",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mark, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xs text-stone",
						children: "The Marlowe"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
					className: "px-4 py-6 pb-24 sm:px-8 sm:py-8 lg:pb-10",
					children
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
				className: "fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-line bg-cream/95 backdrop-blur-sm lg:hidden",
				children: NAV.slice(0, 5).map((item) => {
					const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
					const Icon = item.icon;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: item.to,
						className: cn("flex min-h-14 flex-col items-center justify-center gap-1 text-[11px]", active ? "text-pine" : "text-stone"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "relative",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
								className: "size-5",
								strokeWidth: 1.75
							}), item.to === "/hotel/fulfillment" && pendingCount > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute -right-2 -top-1 size-1.5 rounded-full bg-amber" }) : null]
						}), item.label]
					}, item.to);
				})
			})
		]
	});
}
function HotelLayout() {
	const data = Route$7.useLoaderData();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HotelShell, {
		pendingCount: data.pending.length,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {})
	});
}
//#endregion
export { HotelLayout as component };
