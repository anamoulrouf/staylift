import { o as __toESM } from "../_runtime.mjs";
import { a as money, i as formatDateLong, s as pctOf, u as stayRange } from "./format-CAsbM_bU.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { C as useRouter, w as require_jsx_runtime, x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { D as EyeOff, E as Eye, L as Check, N as ClipboardList, S as MailWarning, W as ArrowUpRight, f as Send, j as Clock, t as X } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { A as decideOrder, _ as Route$17, it as sendStayLink } from "./router-CoWk33e6.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { t as Button } from "./button-DWJAclyi.mjs";
import { t as Badge } from "./badge-C-LEKJr-.mjs";
import { a as Cell, i as Bar, n as YAxis, o as ResponsiveContainer, r as XAxis, s as Tooltip, t as BarChart } from "../_libs/recharts+[...].mjs";
import { n as StatusPill } from "./status-pill-BHZJqj_x.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/hotel-hVsQpDgk.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Overview() {
	const { data, extras } = Route$17.useLoaderData();
	const router = useRouter();
	async function decide(orderId, decision) {
		try {
			await decideOrder({ data: {
				orderId,
				decision
			} });
			toast.success(decision === "approve" ? "Approved. Payment captured." : "Declined. Guest notified.");
			await router.invalidate();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Could not update order.");
		}
	}
	const f = data.funnel;
	const totalViews = extras.viewSources.reduce((s, v) => s + v.n, 0);
	const emailViews = extras.viewSources.find((v) => v.source === "email")?.n ?? 0;
	const emailShare = totalViews ? emailViews / totalViews : 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "stagger-in",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-end justify-between gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs uppercase tracking-[0.18em] text-stone",
						children: formatDateLong(data.today)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-2 font-display text-4xl font-semibold tracking-tight text-ink sm:text-[42px]",
						children: "Welcome back."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-stone",
						children: data.pendingCents > 0 ? `${money(data.pendingCents)} in requests are waiting on the desk.` : "Nothing is waiting on the desk."
					})
				] }), data.property.settings.isDemo ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/stay/$token",
					params: { token: "maya" },
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "secondary",
						children: ["Open Maya's stay", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpRight, { className: "size-4" })]
					})
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/desk",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "secondary",
						children: ["Check-in tablet", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpRight, { className: "size-4" })]
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)_300px]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex min-w-0 flex-col gap-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RevenueHero, {
								cents: data.pilotCents,
								todayCents: data.todayCents,
								rooms: data.property.rooms,
								city: data.property.city,
								since: formatDateLong(data.property.economics.launchedOn)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WeeklyRevenue, {
								thisWeekCents: extras.weekly.thisWeekCents,
								prevWeekCents: extras.weekly.prevWeekCents
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TopOffers, { offers: extras.topOffers })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex min-w-0 flex-col gap-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AttachChartCard, {
							weekly: extras.series.weekly,
							monthly: extras.series.monthly
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RequestsFeed, {
							pending: data.pending.map((o) => ({
								id: o.id,
								guestName: o.guestName,
								offerName: o.offerName,
								forDate: o.forDate,
								forTime: o.forTime,
								amountCents: o.amountCents,
								locked: o.approvableFrom !== null,
								approvableFrom: o.approvableFrom
							})),
							onDecide: decide
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex min-w-0 flex-col gap-4 lg:col-span-2 xl:col-span-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OpenOffersCard, { extras }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChannelShareCard, { channel: extras.channel }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NeedsAttentionCard, {
								attention: extras.attention,
								pendingCents: data.pendingCents
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-4 rounded-2xl bg-paper p-5 shadow-[var(--shadow-border)] sm:p-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-baseline justify-between gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-xl font-semibold",
							children: "Funnel"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/hotel/roi",
							className: "text-sm text-stone hover:text-ink",
							children: [data.holdoutBookings, " holdout bookings → measured lift"]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-stone",
						children: "Each step is a subset of the one before, so no step can pass 100%."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
						className: "mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FunnelStep, {
								label: "Bookings",
								value: f.bookings,
								note: "treatment, since launch"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FunnelStep, {
								label: "Reached",
								value: f.reached,
								share: f.bookings ? f.reached / f.bookings : 0,
								of: "of bookings",
								note: f.bookings ? `${pctOf(f.bookings ? f.reached / f.bookings : 0, 0)} reachable by email or WhatsApp` : void 0
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FunnelStep, {
								label: "Opened page",
								value: f.viewed,
								share: f.reached ? f.viewed / f.reached : 0,
								of: "of reached",
								note: totalViews ? `${pctOf(emailShare, 0)} of page visits come from the booking email` : void 0
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FunnelStep, {
								label: "Bought",
								value: f.bought,
								share: f.viewed ? f.bought / f.viewed : 0,
								of: "of openers",
								note: data.topOffer ? `top claim: ${data.topOffer.name}` : void 0
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FunnelStep, {
								label: "Revenue",
								value: money(f.pageRevenueCents, { compact: true }),
								note: "desk sales tracked separately"
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-4 rounded-2xl bg-pine p-5 text-pine-fg sm:p-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-baseline justify-between gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-xl font-semibold",
							children: "Guest journey · OTA bookings"
						}), data.property.settings.isDemo ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/hotel/email/$reservationId",
							params: { reservationId: "res_maya" },
							className: "text-sm text-pine-fg/75 hover:text-pine-fg",
							children: "See the booking email →"
						}) : null]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-pine-fg/75",
						children: "Booking from an OTA → personalised booking email → personalised stay page → offer booked → this dashboard."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
						className: "mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(JourneyStep, {
								n: 1,
								label: "OTA bookings",
								value: data.journey.otaBookings.toLocaleString("en-US")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(JourneyStep, {
								n: 2,
								label: "Emailed",
								value: data.journey.emailed.toLocaleString("en-US"),
								share: data.journey.otaBookings ? data.journey.emailed / data.journey.otaBookings : 0,
								of: "of bookings"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(JourneyStep, {
								n: 3,
								label: "Opened page",
								value: data.journey.clicked.toLocaleString("en-US"),
								share: data.journey.emailed ? data.journey.clicked / data.journey.emailed : 0,
								of: "of emailed"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(JourneyStep, {
								n: 4,
								label: "Booked offer",
								value: data.journey.booked.toLocaleString("en-US"),
								share: data.journey.clicked ? data.journey.booked / data.journey.clicked : 0,
								of: "of visitors"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(JourneyStep, {
								n: 5,
								label: "Email revenue",
								value: money(data.journey.revenueCents)
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-5 text-xs text-pine-fg/70",
						children: "Counted only when each step follows the one before: a page visit counts if it came from the email link, a purchase if it happened on that visit. Holdout bookings are excluded."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CaptureGatePanel, { gate: data.capture }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-3 flex items-baseline justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-xl font-semibold",
						children: "In house & arriving"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/hotel/reservations",
						className: "text-sm text-stone hover:text-ink",
						children: "All stays"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "divide-y divide-line overflow-hidden rounded-2xl bg-paper shadow-[var(--shadow-border)]",
					children: [data.arriving.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "px-5 py-8 text-sm text-stone",
						children: "No arrivals in the next three days."
					}) : null, data.arriving.map((res) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/stay/$token",
						params: { token: res.token },
						className: "flex items-center gap-3 px-4 py-3 transition-colors hover:bg-cream",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
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
							}),
							res.holdout ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone: "quiet",
								children: "Holdout"
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusPill, { status: res.status })
						]
					}) }, res.id))]
				})]
			})
		]
	});
}
function RevenueHero({ cents, todayCents, rooms, city, since }) {
	const [hidden, setHidden] = (0, import_react.useState)(() => {
		try {
			return localStorage.getItem("staylift-hide-amounts") === "1";
		} catch {
			return false;
		}
	});
	function toggleHidden() {
		setHidden((v) => {
			try {
				localStorage.setItem("staylift-hide-amounts", v ? "0" : "1");
			} catch {}
			return !v;
		});
	}
	const month = (/* @__PURE__ */ new Date()).toLocaleDateString("en-US", { month: "long" });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "hotel-hero relative overflow-hidden rounded-2xl p-5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-start justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-[11px] uppercase tracking-[0.18em] text-pine-fg/70",
						children: ["Upsell revenue · since ", since]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: cn("mt-2 font-display text-[40px] font-semibold leading-none tabular-nums", hidden && "select-none blur-sm"),
						children: money(cents)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-sm text-pine-fg/75",
						children: [
							rooms,
							" rooms · ",
							city
						]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				"aria-label": hidden ? "Show amounts" : "Hide amounts",
				onClick: toggleHidden,
				className: "rounded-lg p-1.5 text-pine-fg/70 transition-opacity hover:bg-white/10 hover:text-pine-fg",
				children: hidden ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "size-4" })
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-5 flex items-center justify-between border-t border-white/15 pt-3 text-sm text-pine-fg/85",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
				"Captured today",
				" ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
					className: cn("font-semibold tabular-nums", hidden && "select-none blur-sm"),
					children: money(todayCents)
				})
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: month })]
		})]
	});
}
function WeeklyRevenue({ thisWeekCents, prevWeekCents }) {
	const delta = prevWeekCents > 0 ? (thisWeekCents - prevWeekCents) / prevWeekCents * 100 : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rounded-2xl bg-paper p-5 shadow-[var(--shadow-border)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] uppercase tracking-[0.14em] text-stone",
				children: "Last 7 days"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-2 flex items-baseline gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-2xl font-semibold tabular-nums",
					children: money(thisWeekCents)
				}), delta !== null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DeltaChip, { value: delta }) : null]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-xs text-stone",
				children: prevWeekCents > 0 ? "vs the previous 7 days" : "no paid orders the week before"
			})
		]
	});
}
function TopOffers({ offers }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rounded-2xl bg-paper p-5 shadow-[var(--shadow-border)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-baseline justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-lg font-semibold",
				children: "Top offers"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/hotel/analytics",
				className: "text-xs text-stone hover:text-ink",
				children: "All"
			})]
		}), offers.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 text-sm text-stone",
			children: "No paid orders yet."
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-3 divide-y divide-line",
			children: offers.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "flex items-center justify-between gap-3 py-2.5 text-sm",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "min-w-0 truncate",
						children: o.name
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "shrink-0 text-stone",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "tabular-nums text-pine",
							children: o.n
						}), " claims"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "w-14 shrink-0 text-right tabular-nums",
						children: money(o.cents, { compact: true })
					})
				]
			}, o.name))
		})]
	});
}
function AttachChartCard({ weekly, monthly }) {
	const [granularity, setGranularity] = (0, import_react.useState)("weekly");
	const data = (granularity === "weekly" ? weekly : monthly).map((d) => ({
		...d,
		attach: d.bookings ? d.bought / d.bookings : 0
	}));
	const peakIdx = data.reduce((best, d, i) => d.bookings > 0 && d.attach > (data[best]?.attach ?? -1) ? i : best, 0);
	const peak = data[peakIdx];
	const prev = peakIdx > 0 ? data[peakIdx - 1] : null;
	const peakDeltaPts = peak && prev && prev.bookings > 0 ? (peak.attach - prev.attach) * 100 : null;
	const totalRevenue = data.reduce((s, d) => s + d.revenueCents, 0);
	const hasData = data.some((d) => d.bookings > 0);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "min-w-0 overflow-hidden rounded-2xl bg-paper p-5 shadow-[var(--shadow-border)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-xl font-semibold",
						children: "Attach rate"
					}), peakDeltaPts !== null && isFinite(peakDeltaPts) ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "rounded-full bg-moss px-2 py-0.5 text-xs font-semibold tabular-nums text-pine",
						children: [
							peakDeltaPts >= 0 ? "+" : "−",
							Math.abs(peakDeltaPts).toFixed(1),
							" pts vs prior"
						]
					}) : null]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex rounded-full bg-cream p-1",
					children: ["weekly", "monthly"].map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setGranularity(g),
						className: cn("rounded-full px-3 py-1 text-xs font-medium transition-colors", granularity === g ? "bg-paper text-ink shadow-[var(--shadow-border)]" : "text-stone hover:text-ink"),
						children: g === "weekly" ? "Weekly" : "Monthly"
					}, g))
				})]
			}),
			hasData ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 h-56 min-w-0",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
					width: "100%",
					height: "100%",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BarChart, {
						data,
						margin: {
							top: 8,
							right: 4,
							left: -18,
							bottom: 0
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
								dataKey: "label",
								tick: {
									fill: "#6f675e",
									fontSize: 10
								},
								axisLine: false,
								tickLine: false,
								interval: 0,
								tickMargin: 8
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
								tickFormatter: (v) => `${Math.round(v * 100)}%`,
								tick: {
									fill: "#6f675e",
									fontSize: 10
								},
								axisLine: false,
								tickLine: false,
								width: 44
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {
								cursor: { fill: "rgba(196, 85, 46, 0.07)" },
								content: ({ active, payload }) => {
									if (!active || !payload?.length) return null;
									const d = payload[0].payload;
									return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "rounded-xl border border-line bg-paper px-3 py-2 text-xs shadow-[var(--shadow-border)]",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "font-medium text-ink",
												children: d.label
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "text-stone",
												children: [
													d.bought,
													" of ",
													d.bookings,
													" bookings bought · ",
													pctOf(d.attach, 1)
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "text-stone",
												children: [money(d.revenueCents), " paid"]
											})
										]
									});
								}
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
								dataKey: "attach",
								radius: [
									14,
									14,
									0,
									0
								],
								barSize: 30,
								children: data.map((d, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cell, {
									fill: "var(--series-a)",
									fillOpacity: i === peakIdx && d.bookings > 0 ? 1 : .16
								}, d.bucket))
							})
						]
					})
				})
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-6 px-1 pb-4 text-sm text-stone",
				children: "No bookings with offers since launch yet — the chart fills as the book arrives."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-3 text-xs text-stone",
				children: [
					"Share of bookings arriving in each ",
					granularity === "weekly" ? "week" : "month",
					" that bought at least one extra · ",
					money(totalRevenue),
					" paid on those stays."
				]
			})
		]
	});
}
function RequestsFeed({ pending, onDecide }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rounded-2xl bg-paper p-5 shadow-[var(--shadow-border)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-baseline justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-xl font-semibold",
				children: "Booking requests"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-0.5 text-sm text-stone",
				children: "Guest requests waiting for your response"
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/hotel/fulfillment",
				className: "text-sm text-stone hover:text-ink",
				children: "View all"
			})]
		}), pending.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-4 rounded-xl bg-cream px-4 py-6 text-sm text-stone",
			children: "Queue is clear. Instant-purchase offers settle on their own."
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-3 divide-y divide-line",
			children: pending.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "flex flex-wrap items-center gap-3 py-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "flex size-9 shrink-0 items-center justify-center rounded-full bg-cream text-xs font-semibold text-stone",
						children: o.guestName.slice(0, 1).toUpperCase()
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "truncate text-sm font-medium",
							children: [o.guestName, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "ml-2 font-normal text-stone",
								children: money(o.amountCents)
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "truncate text-xs text-stone",
							children: [
								o.offerName,
								o.forTime ? ` · ${o.forTime}` : "",
								o.forDate ? ` · ${o.forDate}` : ""
							]
						})]
					}),
					o.locked ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
						tone: "amber",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "mr-1 size-3" }),
							" Opens ",
							o.approvableFrom
						]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						tone: "amber",
						children: "Pending"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "sm",
							disabled: o.locked,
							onClick: () => onDecide(o.id, "approve"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-3.5" }), "Approve"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "sm",
							variant: "outline",
							onClick: () => onDecide(o.id, "decline"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-3.5" }), "Decline"]
						})]
					})
				]
			}, o.id))
		})]
	});
}
function OpenOffersCard({ extras }) {
	const { openOffers } = extras;
	const router = useRouter();
	const [busyId, setBusyId] = (0, import_react.useState)(null);
	async function send(guest) {
		setBusyId(guest.reservationId);
		try {
			await sendStayLink({ data: {
				reservationId: guest.reservationId,
				channel: "email"
			} });
			toast.success(`Stay link sent to ${guest.guestName}.`);
			await router.invalidate();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Could not send the stay link.");
		} finally {
			setBusyId(null);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rounded-2xl bg-paper p-5 shadow-[var(--shadow-border)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-lg font-semibold",
					children: "Open offer value"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-0.5 text-xs text-stone",
					children: "Reserved for arriving guests"
				})] }), openOffers.guestCount > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarStack, { names: openOffers.guests.slice(0, 5).map((g) => g.guestName) }) : null]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 font-display text-3xl font-semibold tabular-nums",
				children: money(openOffers.totalCents)
			}),
			openOffers.guestCount === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-stone",
				children: "Every stay in the book has its picks claimed — or the book is quiet right now."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 text-xs text-stone",
					children: [
						openOffers.guestCount,
						" guest",
						openOffers.guestCount === 1 ? "" : "s",
						" with unclaimed picks"
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-3 divide-y divide-line",
					children: openOffers.guests.slice(0, 3).map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-center gap-2 py-2.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "truncate text-sm font-medium",
								children: g.guestName
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "truncate text-xs text-stone",
								children: [
									g.arrival,
									" · ",
									g.offers.map((o) => o.name).join(", ")
								]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							title: `Send ${g.guestName} their stay link`,
							"aria-label": `Send ${g.guestName} their stay link`,
							disabled: busyId === g.reservationId,
							onClick: () => void send(g),
							className: "flex size-8 shrink-0 items-center justify-center rounded-lg bg-moss text-pine transition-colors hover:bg-pine hover:text-pine-fg disabled:opacity-50",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "size-3.5" })
						})]
					}, g.reservationId))
				}),
				openOffers.guestCount > 3 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 text-xs text-stone",
					children: [
						"+",
						openOffers.guestCount - 3,
						" more guests"
					]
				}) : null
			] })
		]
	});
}
function ChannelShareCard({ channel }) {
	const total = channel.guestPageCents + channel.deskCents;
	const share = total ? channel.guestPageCents / total : 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rounded-2xl bg-paper p-5 shadow-[var(--shadow-border)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-lg font-semibold",
				children: "Stay-page share"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-2 flex items-baseline gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-3xl font-semibold tabular-nums",
					children: pctOf(share, 0)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs text-stone",
					children: "of upsell revenue"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex h-3 gap-[2px] overflow-hidden rounded-full bg-cream",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-full rounded-l-full bg-[var(--series-a)]",
					style: { width: `${Math.max(share * 100, total ? 3 : 0)}%` }
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-full flex-1 rounded-r-full bg-line" })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
				className: "mt-3 space-y-1 text-xs text-stone",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dt", {
						className: "flex items-center gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-2 rounded-full bg-[var(--series-a)]" }), " Guests buy on the stay page"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", {
						className: "tabular-nums",
						children: [
							money(channel.guestPageCents, { compact: true }),
							" · ",
							channel.guestPageOrders
						]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dt", {
						className: "flex items-center gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-2 rounded-full bg-line" }), " Desk and phone sales"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", {
						className: "tabular-nums",
						children: [
							money(channel.deskCents, { compact: true }),
							" · ",
							channel.deskOrders
						]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-xs text-stone",
				children: "Desk sales keep the holdout baseline honest."
			})
		]
	});
}
function NeedsAttentionCard({ attention, pendingCents }) {
	const rows = [
		{
			show: attention.pendingCount > 0,
			icon: ClipboardList,
			text: `${attention.pendingCount} request${attention.pendingCount === 1 ? "" : "s"} need a decision · ${money(pendingCents)}`,
			to: "/hotel/fulfillment"
		},
		{
			show: attention.expiringCount > 0,
			icon: Clock,
			text: `${money(attention.expiringCents)} in unclaimed picks on stays starting within 3 days`,
			to: "/hotel/reservations"
		},
		{
			show: attention.bouncedCount > 0,
			icon: MailWarning,
			text: `${attention.bouncedCount} bounced message${attention.bouncedCount === 1 ? "" : "s"} to chase`,
			to: "/hotel/reservations"
		}
	].filter((r) => r.show);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rounded-2xl bg-paper p-5 shadow-[var(--shadow-border)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "font-display text-lg font-semibold",
			children: "Needs attention"
		}), rows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 text-sm text-stone",
			children: "Nothing needs you. The desk is clear."
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-3 space-y-2",
			children: rows.map((r) => {
				const Icon = r.icon;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: r.to,
					className: "flex items-start gap-2.5 rounded-xl px-2 py-1.5 text-sm hover:bg-cream",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
							className: "mt-0.5 size-4 shrink-0 text-amber",
							strokeWidth: 1.75
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "flex-1 text-ink",
							children: r.text
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpRight, { className: "mt-0.5 size-3.5 shrink-0 text-stone" })
					]
				}) }, r.text);
			})
		})]
	});
}
function AvatarStack({ names }) {
	const init = (n) => n.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex shrink-0",
		children: [names.slice(0, 4).map((n, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			title: n,
			className: "-ml-2 flex size-7 items-center justify-center rounded-full border-2 border-paper bg-moss text-[10px] font-semibold text-pine first:ml-0",
			children: init(n)
		}, i)), names.length > 4 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "-ml-2 flex size-7 items-center justify-center rounded-full border-2 border-paper bg-cream text-[10px] font-semibold text-stone",
			children: ["+", names.length - 4]
		}) : null]
	});
}
function DeltaChip({ value }) {
	if (!isFinite(value)) return null;
	const up = value >= 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
		tone: up ? "good" : "rose",
		children: [
			up ? "+" : "−",
			Math.abs(value).toFixed(1),
			"%"
		]
	});
}
function JourneyStep({ n, label, value, share, of }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "text-xs uppercase tracking-[0.14em] text-pine-fg/70",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "tabular-nums",
					children: n
				}),
				" · ",
				label
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 font-display text-2xl font-semibold tabular-nums",
			children: value
		}),
		share !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mt-1 text-xs text-pine-fg/75",
			children: [
				pctOf(share, share >= .1 ? 0 : 1),
				" ",
				of
			]
		}) : null
	] });
}
function FunnelStep({ label, value, share, of, note }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs uppercase tracking-[0.14em] text-stone",
			children: label
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 font-display text-2xl font-semibold tabular-nums",
			children: typeof value === "number" ? value.toLocaleString("en-US") : value
		}),
		share !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
			tone: "quiet",
			className: "mt-2",
			children: [
				pctOf(share, share >= .1 ? 0 : 1),
				" ",
				of
			]
		}) : null,
		note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1.5 text-xs leading-snug text-stone",
			children: note
		}) : null
	] });
}
var STEP_LABEL = {
	started: "Started",
	celebration: "Celebration asked",
	party: "Party step",
	code_sent: "Code sent",
	verified: "Contact verified",
	consented: "Opted in",
	completed: "Completed"
};
function CaptureGatePanel({ gate }) {
	if (!gate.launchedOn) return null;
	const evidence = gate.evidence === "too_few" ? {
		tone: "rose",
		label: "Too early",
		note: "Fewer than 50 OTA check-ins since launch."
	} : gate.evidence === "directional" ? {
		tone: "amber",
		label: "Directional",
		note: "Enough to see the direction; firm after ~300 OTA check-ins."
	} : {
		tone: "good",
		label: "Solid",
		note: "300+ OTA check-ins since launch."
	};
	const allPass = gate.gates.every((g) => g.pass);
	const maxStep = Math.max(1, ...gate.steps.map((s) => s.n));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mt-4 rounded-2xl bg-paper p-5 shadow-[var(--shadow-border)] sm:p-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-baseline justify-between gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-xl font-semibold",
					children: "Contact capture · phase B gate"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						tone: evidence.tone,
						children: evidence.label
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						tone: allPass ? "good" : "amber",
						children: allPass ? "Gate passed" : "Not yet"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1 text-sm text-stone",
				children: [
					"Since ",
					formatDateLong(gate.launchedOn),
					" · ",
					gate.after.otaCompleted,
					" OTA check-ins. ",
					evidence.note
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-5 grid gap-3 sm:grid-cols-3",
				children: gate.gates.map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: g.pass ? "rounded-xl bg-[#e2f1e8] px-4 py-3" : "rounded-xl bg-amber-soft px-4 py-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs uppercase tracking-[0.14em] text-stone",
							children: g.label
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 font-display text-2xl font-semibold tabular-nums",
							children: g.id === "completion" ? `${g.value > 0 ? "−" : "+"}${Math.abs(g.value).toFixed(1)} pts` : `${g.value.toFixed(0)}%`
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-stone",
							children: [
								g.target,
								" · ",
								g.pass ? "pass" : "below target"
							]
						})
					]
				}, g.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-3 text-xs text-stone",
				children: [
					"Check-in completion ",
					gate.baseline.completionPct.toFixed(1),
					"% before launch (",
					gate.baseline.completed,
					" of",
					" ",
					gate.baseline.arrivals,
					" arrivals) vs ",
					gate.after.completionPct.toFixed(1),
					"% since (",
					gate.after.completed,
					" of",
					" ",
					gate.after.arrivals,
					"). Own contact = verified by code; marketable = opted in to email or WhatsApp offers."
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
				className: "mt-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", {
						className: "cursor-pointer text-sm text-stone",
						children: "Where guests drop off"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
						className: "mt-3 space-y-1.5",
						children: gate.steps.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "grid grid-cols-[130px_1fr_40px] items-center gap-3 text-sm",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-stone",
									children: STEP_LABEL[s.step] ?? s.step
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "h-2 rounded-full bg-cream",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "block h-2 rounded-full bg-pine",
										style: { width: `${s.n / maxStep * 100}%` }
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-right tabular-nums",
									children: s.n
								})
							]
						}, s.step))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-3 text-xs text-stone",
						children: ["Completed via ", gate.bySource.map((b) => `${b.source === "desk_tablet" ? "desk tablet" : b.source === "qr" ? "QR" : "online"} ${b.n}`).join(" · ")]
					})
				]
			})
		]
	});
}
//#endregion
export { Overview as component };
