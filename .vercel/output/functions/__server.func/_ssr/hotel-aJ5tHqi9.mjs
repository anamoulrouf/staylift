import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { C as useRouter, _ as Outlet, m as useRouterState, w as require_jsx_runtime, x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { B as CalendarRange, C as LogOut, H as Calculator, N as ClipboardList, R as ChartNoAxesColumn, U as BedDouble, b as Menu, c as Tablet, d as Settings, m as ScrollText, n as Users, o as TrendingUp, r as UsersRound, u as Sparkles, w as LayoutGrid } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { S as Route$22, ot as switchHotel } from "./router-CoWk33e6.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { t as Button } from "./button-DWJAclyi.mjs";
import { t as Badge } from "./badge-C-LEKJr-.mjs";
import { i as signOut } from "./client-1vAx-gM_.mjs";
import { i as ROLE_LABEL } from "./roles-8UfQ9oTl.mjs";
import { t as Mark } from "./mark-6eISl1Ml.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/hotel-aJ5tHqi9.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var NAV = [
	{
		to: "/hotel",
		label: "Overview",
		short: "Overview",
		icon: LayoutGrid,
		cap: "viewOverview",
		exact: true,
		group: "work"
	},
	{
		to: "/hotel/reservations",
		label: "Reservations",
		short: "Book",
		icon: CalendarRange,
		cap: "workReservations",
		group: "work"
	},
	{
		to: "/hotel/guests",
		label: "Guests",
		short: "Guests",
		icon: UsersRound,
		cap: "viewGuests",
		group: "work"
	},
	{
		to: "/hotel/fulfillment",
		label: "Requests",
		short: "Requests",
		icon: ClipboardList,
		cap: "workOrders",
		group: "work"
	},
	{
		to: "/hotel/offers",
		label: "Offers",
		short: "Offers",
		icon: BedDouble,
		cap: "workOrders",
		group: "work"
	},
	{
		to: "/hotel/automation",
		label: "Recipes",
		short: "Recipes",
		icon: Sparkles,
		cap: "editRecipes",
		group: "work"
	},
	{
		to: "/hotel/analytics",
		label: "Stats",
		short: "Stats",
		icon: ChartNoAxesColumn,
		cap: "viewAnalytics",
		group: "work"
	},
	{
		to: "/hotel/roi",
		label: "Measured ROI",
		short: "ROI",
		icon: TrendingUp,
		cap: "viewRoi",
		group: "work"
	},
	{
		to: "/hotel/team",
		label: "Team",
		short: "Team",
		icon: Users,
		cap: "manageTeam",
		group: "admin"
	},
	{
		to: "/hotel/settings",
		label: "Settings & privacy",
		short: "Settings",
		icon: Settings,
		cap: "editSettings",
		group: "admin"
	},
	{
		to: "/hotel/audit",
		label: "Audit log",
		short: "Audit",
		icon: ScrollText,
		cap: "viewAudit",
		group: "admin"
	}
];
/** Phone bottom bar: the daily screens. The rest sit in the header menu. */
var MOBILE_NAV = [
	"/hotel",
	"/hotel/reservations",
	"/hotel/guests",
	"/hotel/fulfillment",
	"/hotel/roi"
];
function initialsOf(name, email) {
	const source = (name || email || "?").trim();
	const parts = source.split(/\s+/).filter(Boolean);
	if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
	return source.slice(0, 1).toUpperCase() || "?";
}
function HotelShell({ children, ctx }) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const router = useRouter();
	const [menu, setMenu] = (0, import_react.useState)(false);
	const [userMenu, setUserMenu] = (0, import_react.useState)(false);
	const items = NAV.filter((i) => ctx.caps[i.cap]);
	const workItems = items.filter((i) => i.group === "work");
	const adminItems = items.filter((i) => i.group === "admin");
	const isActive = (item) => item.exact ? pathname === item.to : pathname.startsWith(item.to);
	async function changeHotel(propertyId) {
		try {
			await switchHotel({ data: { propertyId } });
			await router.navigate({ to: "/hotel" });
			await router.invalidate();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Could not switch hotel.");
		}
	}
	async function handleSignOut() {
		setUserMenu(false);
		try {
			await signOut("/login");
		} catch {
			toast.error("Sign-out didn't go through. Try again.");
		}
	}
	/** The demo property ships with its own crest (src/logo/marlowe.svg). */
	const crest = ctx.propertyName === "The Marlowe" ? "/logo/marlowe.svg" : null;
	const hotelBlock = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-w-0 items-center gap-2.5",
		children: [crest ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			src: crest,
			alt: "",
			className: "size-9 shrink-0"
		}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-w-0",
			children: [ctx.memberships.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
				"aria-label": "Hotel",
				value: ctx.propertyId,
				onChange: (e) => void changeHotel(e.target.value),
				className: "max-w-[230px] cursor-pointer truncate rounded-md bg-transparent text-[15px] font-semibold leading-tight text-ink outline-none hover:text-pine",
				children: ctx.memberships.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
					value: m.propertyId,
					children: m.propertyName
				}, m.propertyId))
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "truncate text-[15px] font-semibold leading-tight text-ink",
				children: ctx.propertyName
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-xs text-stone",
				children: [
					ctx.city,
					" · ",
					ctx.rooms,
					" rooms",
					ctx.isDemo ? " · demo" : ""
				]
			})]
		})]
	});
	const railButton = (item) => {
		const Icon = item.icon;
		const active = isActive(item);
		const badge = item.to === "/hotel/fulfillment" && ctx.pendingCount > 0;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
			to: item.to,
			title: item.label,
			"aria-label": item.label,
			className: cn("relative flex size-10 items-center justify-center rounded-xl transition-colors duration-150", active ? "bg-pine text-pine-fg" : "text-stone hover:bg-cream hover:text-ink"),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
				className: "size-5",
				strokeWidth: 1.75
			}), badge ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: cn("absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-semibold tabular-nums", active ? "bg-pine-fg/25 text-pine-fg" : "bg-amber-soft text-amber"),
				children: ctx.pendingCount
			}) : null]
		}, item.to);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "hotel-scope min-h-dvh bg-linen",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: "fixed inset-y-0 left-0 z-20 hidden w-[68px] flex-col items-center border-r border-line bg-paper py-4 lg:flex",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						"aria-label": "Staylift",
						className: "flex size-10 items-center justify-center rounded-xl hover:bg-cream",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mark, { wordmark: false })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
						className: "mt-4 flex flex-col items-center gap-1.5",
						"aria-label": "Hotel desk",
						children: workItems.map(railButton)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-auto flex flex-col items-center gap-1.5",
						children: ctx.caps.runDeskTablet ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/desk",
							title: "Check-in tablet",
							"aria-label": "Check-in tablet",
							className: "flex size-10 items-center justify-center rounded-xl text-stone hover:bg-cream hover:text-ink",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tablet, {
								className: "size-5",
								strokeWidth: 1.75
							})
						}) : null
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "lg:pl-[68px]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "sticky top-0 z-30 border-b border-line bg-linen/85 backdrop-blur-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex min-w-0 items-center gap-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									"aria-expanded": menu,
									"aria-label": "Menu",
									onClick: () => setMenu((v) => !v),
									className: "flex size-9 items-center justify-center rounded-xl text-stone hover:bg-cream hover:text-ink lg:hidden",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, {
										className: "size-5",
										strokeWidth: 1.75
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/",
									className: "hidden lg:block",
									"aria-label": "Staylift home",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mark, { wordmark: false })
								}),
								hotelBlock
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex shrink-0 items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/hotel/reservations",
								className: "hidden sm:block",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									children: "New booking"
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									"aria-expanded": userMenu,
									"aria-label": "Account menu",
									onClick: () => setUserMenu((v) => !v),
									className: "flex size-9 items-center justify-center rounded-full bg-pine text-xs font-semibold text-pine-fg",
									children: initialsOf(ctx.userName, ctx.email)
								}), userMenu ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									tabIndex: -1,
									"aria-hidden": true,
									className: "fixed inset-0 z-10 cursor-default",
									onClick: () => setUserMenu(false)
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "absolute right-0 top-full z-20 mt-2 w-64 rounded-2xl border border-line bg-paper p-2 shadow-[var(--shadow-lift)]",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "px-3 py-2",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "truncate text-sm font-semibold text-ink",
													children: ctx.userName || ctx.email
												}),
												ctx.userName && ctx.email ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "truncate text-xs text-stone",
													children: ctx.email
												}) : null,
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
													tone: "pine",
													className: "mt-1.5",
													children: ROLE_LABEL[ctx.role]
												})
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "my-1 h-px bg-line" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
											to: "/roi",
											onClick: () => setUserMenu(false),
											className: "flex h-9 items-center gap-2.5 rounded-lg px-3 text-sm text-ink hover:bg-cream",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Calculator, { className: "size-4 text-stone" }), " ROI calculator"]
										}),
										adminItems.map((item) => {
											const Icon = item.icon;
											return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
												to: item.to,
												onClick: () => setUserMenu(false),
												className: cn("flex h-9 items-center gap-2.5 rounded-lg px-3 text-sm hover:bg-cream", isActive(item) ? "font-medium text-pine" : "text-ink"),
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4 text-stone" }),
													" ",
													item.label
												]
											}, item.to);
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "my-1 h-px bg-line" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											onClick: () => void handleSignOut(),
											className: "flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-sm text-ink hover:bg-cream",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "size-4 text-stone" }), " Sign out"]
										})
									]
								})] }) : null]
							})]
						})]
					}), menu ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "border-t border-line px-4 pb-4 pt-3 lg:hidden",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
							className: "grid grid-cols-2 gap-1",
							"aria-label": "All pages",
							children: [
								items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: item.to,
									onClick: () => setMenu(false),
									className: cn("rounded-lg px-3 py-2 text-sm", isActive(item) ? "bg-moss font-medium text-pine" : "text-stone hover:bg-cream hover:text-ink"),
									children: item.label
								}, item.to)),
								ctx.caps.runDeskTablet ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/desk",
									onClick: () => setMenu(false),
									className: "rounded-lg px-3 py-2 text-sm text-stone hover:bg-cream hover:text-ink",
									children: "Check-in tablet"
								}) : null,
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/roi",
									onClick: () => setMenu(false),
									className: "rounded-lg px-3 py-2 text-sm text-stone hover:bg-cream hover:text-ink",
									children: "ROI calculator"
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 flex items-center justify-between border-t border-line pt-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "truncate text-sm text-ink",
									children: ctx.userName || ctx.email
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-stone",
									children: ROLE_LABEL[ctx.role]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => void handleSignOut(),
								className: "flex h-9 items-center gap-2 rounded-lg px-3 text-sm text-stone hover:bg-cream hover:text-ink",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "size-4" }), " Sign out"]
							})]
						})]
					}) : null]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
					className: "mx-auto max-w-[1440px] px-4 py-6 pb-28 sm:px-6 sm:py-8 lg:px-8 lg:pb-12",
					children
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
				className: "fixed inset-x-0 bottom-0 z-20 grid border-t border-line bg-paper/95 backdrop-blur-sm lg:hidden",
				style: { gridTemplateColumns: `repeat(${items.filter((i) => MOBILE_NAV.includes(i.to)).length}, minmax(0, 1fr))` },
				children: items.filter((item) => MOBILE_NAV.includes(item.to)).map((item) => {
					const Icon = item.icon;
					const active = isActive(item);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: item.to,
						className: cn("flex min-h-14 flex-col items-center justify-center gap-1 text-[11px]", active ? "text-pine" : "text-stone"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "relative",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
								className: "size-5",
								strokeWidth: 1.75
							}), item.to === "/hotel/fulfillment" && ctx.pendingCount > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute -right-2 -top-1 size-1.5 rounded-full bg-amber" }) : null]
						}), item.short]
					}, item.to);
				})
			})
		]
	});
}
function HotelLayout() {
	const ctx = Route$22.useLoaderData();
	if (ctx.kind !== "ok") return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HotelShell, {
		ctx,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {})
	});
}
//#endregion
export { HotelLayout as component };
